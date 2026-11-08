/* ==========================================================================
   BLACKTHORN MANOR — 1. ELECTRICITY
   The whole game loop is finding power and switching it on. Every light is a
   data record; real THREE lights are a fixed pool assigned elsewhere.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM = window.BM || {};

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
BM.mulberry32 = mulberry32;

/* A tiny event bus shared by every system. */
class Events {
  constructor() { this.handlers = {}; this.log = []; }
  on(name, fn) { (this.handlers[name] = this.handlers[name] || []).push(fn); }
  emit(name, data) {
    this.log.push(name);
    if (this.log.length > 400) this.log.splice(0, 200);
    const list = this.handlers[name];
    if (list) for (const fn of list) fn(data);
  }
}
BM.Events = Events;

const HOUSE_CIRCUITS = ['main', 'hall', 'ground', 'east', 'west', 'attic', 'cellar'];
BM.HOUSE_CIRCUITS = HOUSE_CIRCUITS;

/* --------------------------------------------------------------------------
   Light-type modulation. Each returns a multiplier for a light's intensity.
   `p` is a per-light phase so identical fittings do not pulse in lockstep.
   -------------------------------------------------------------------------- */
function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash1(i) * (1 - u) + hash1(i + 1) * u; }
BM.noise1 = noise1;

const LIGHT_TYPES = {
  steady: () => 1,
  pulse: (t, p) => 0.55 + 0.45 * Math.sin((t * 0.9 + p) * Math.PI * 2),
  subtlePulse: (t, p) => 0.88 + 0.12 * Math.sin((t * 0.6 + p) * Math.PI * 2),
  blink: (t, p) => ((t * 0.8 + p) % 1) < 0.5 ? 1 : 0.04,
  flicker: (t, p) => { const n = noise1(t * 11 + p * 50); return n < 0.18 ? 0.25 + n : 0.8 + 0.2 * noise1(t * 23 + p * 9); },
  strobe: (t, p) => ((t * 6 + p) % 1) < 0.12 ? 1.4 : 0.02,
  shock: (t, p) => { const n = noise1(t * 17 + p * 31); return n > 0.86 ? 1.6 : 0.12 + 0.1 * noise1(t * 40 + p); },
  interference: (t, p) => 0.65 + 0.35 * Math.sin(t * 7.0 + p * 6.28) * Math.sin(t * 1.3 + p),
  rotor: (t, p) => 0.45 + 0.55 * Math.max(0, Math.cos((t * 1.6 + p) * Math.PI * 2)),
};
BM.LIGHT_TYPES = LIGHT_TYPES;

/* --------------------------------------------------------------------------
   A light fitting. Pure data: the renderer reads `intensity` each frame.
   -------------------------------------------------------------------------- */
let lightSeq = 0;
class LightRecord {
  constructor(o) {
    this.id = o.id || ('light' + (lightSeq++));
    this.name = o.name || this.id;
    this.room = o.room || 'grounds';
    this.circuit = o.circuit;              // supply id, see PowerGrid.live()
    this.kind = o.kind || 'incandescent';  // incandescent|fluorescent|bang|sodium|emergency|fire|lamp
    this.pos = { x: o.pos[0], y: o.pos[1], z: o.pos[2] };
    this.colour = o.colour !== undefined ? o.colour : 0xffc98a;
    this.target = o.target !== undefined ? o.target : 1.2;   // full intensity
    this.range = o.range || 9;
    this.on = o.on !== undefined ? o.on : true;               // the fitting's own switch
    this.dead = !!o.dead;                                     // blown, never comes back
    this.flicker = o.flicker || 0;                            // fault: random dropouts 0..1
    this.blink = o.blink || 0;                                // fault: on/off Hz, 0 = none
    this.lightType = o.lightType || 'steady';
    this.spot = !!o.spot;                                     // wants one of the 2 spot slots
    this.dir = o.dir || null;                                 // spot direction
    this.zone = o.zone || 'exterior';
    this.level = o.level || 'ground';
    this.corona = o.corona !== undefined ? o.corona : 1;
    this.phase = o.phase !== undefined ? o.phase : (lightSeq * 0.618) % 1;
    this.chain = o.chain || null;          // lights in one chain come on one at a time
    // runtime
    this.powered = false;
    this.fraction = 0;    // 0..1 start-up envelope
    this.seq = null;      // [{d, v, ramp}]
    this.seqIndex = 0; this.seqT = 0;
    this.buzzing = false;
    this.warming = false;
    this.waiting = false; // has supply, queued behind the light before it in its chain
    this.failed = null;   // null | 'exploded' | 'faulty' — old fittings fail when switched on
    this.noFail = !!o.noFail;
    this.intensity = 0;
    this.scorched = false;
    this.bulb = null;     // optional mesh for emissive feedback
  }

  /* Build the start-up sequence for this kind of fitting. */
  startSequence(rng) {
    const s = [];
    if (this.kind === 'incandescent' || this.kind === 'lamp') {
      // two false starts, then holds
      s.push({ d: 0.06 + rng() * 0.05, v: 0.9 }, { d: 0.18 + rng() * 0.2, v: 0 });
      s.push({ d: 0.04 + rng() * 0.05, v: 0.7 }, { d: 0.3 + rng() * 0.3, v: 0 });
      // then an old filament warms up slowly, unsteadily
      s.push({ d: 0.05, v: 0.2 }, { d: 2.0 + rng() * 1.5, v: 1, ramp: true, warm: true });
    } else if (this.kind === 'fluorescent') {
      const n = 9 + Math.floor(rng() * 5); // 9..13 strobes
      for (let i = 0; i < n; i++) {
        s.push({ d: 0.03 + rng() * 0.06, v: 0.8 + rng() * 0.2 });
        s.push({ d: 0.05 + rng() * 0.22, v: i % 3 === 0 ? 0.08 : 0 });
      }
      s.push({ d: 0.01, v: 0.7, buzz: true }, { d: 0.8 + rng() * 0.8, v: 1, ramp: true, warm: true });
    } else if (this.kind === 'bang') {
      s.push({ d: 0.12, v: 1 }, { d: 0.18, v: 3.2, ramp: true }, { d: 0.01, v: 0, bang: true });
    } else if (this.kind === 'sodium') {
      s.push({ d: 0.01, v: 0.1 }, { d: 4 + rng() * 3, v: 1, ramp: true, warm: true });
    } else {
      s.push({ d: 0.01, v: 1 });
    }
    return s;
  }
}
BM.LightRecord = LightRecord;

/* --------------------------------------------------------------------------
   Appliances on real circuits: they stop where they stand when the power
   goes and come back on by themselves, with a clunk, when it returns.
   -------------------------------------------------------------------------- */
class Appliance {
  constructor(o) {
    this.id = o.id; this.name = o.name; this.kind = o.kind; // radio|tv|fan
    this.circuit = o.circuit; this.room = o.room;
    this.pos = { x: o.pos[0], y: o.pos[1], z: o.pos[2] };
    this.switchedOn = o.switchedOn !== undefined ? o.switchedOn : true;
    this.running = false;
    this.angle = 0;      // fan blade angle: frozen in place when stopped
    this.spin = 0;       // fan speed rad/s
    this.station = o.station || 0;
    this.object = null;  // visual hook
    this.light = null;   // a light record it casts while running (TV screen, heater bars)
    this.boil = 0;       // kettle
    this.glow = 0;       // heater bars warm up and cool down
    this.cycle = 0;      // fridge compressor
    this.compressor = false;
    this.clockTime = 0;  // clock: seconds past midnight, only advances with power
  }
}
BM.Appliance = Appliance;

/* --------------------------------------------------------------------------
   The grid.
   house: lodge switch -> hall (immediately) and main (pantry fuse board)
          main -> ground/east/west/attic/cellar breakers
   other supplies: street (council, always), fire (no power needed), lodge,
          car (its own battery)
   -------------------------------------------------------------------------- */
class PowerGrid {
  constructor(events, seed) {
    this.events = events || new Events();
    this.rng = mulberry32(seed || 1974);
    this.lodge = false;
    this.breakers = { main: false, hall: true, ground: false, east: false, west: false, attic: false, cellar: false };
    this.tripped = false;          // storm trip in force
    this.stormHasTripped = false;  // it only happens once
    this.lights = [];
    this.byId = new Map();
    this.appliances = [];
    this.time = 0;
    this._lastLive = {};
    this.failureRate = 0.07; // chance an old fitting fails each time it powers up
    this.origin = null;      // where the player stands: a chain starts with the light nearest them
    this.sequential = true;  // lights that get supply together come on one after another

  }

  addLight(o) { const l = o instanceof LightRecord ? o : new LightRecord(o); this.lights.push(l); this.byId.set(l.id, l); return l; }
  addAppliance(o) { const a = new Appliance(o); this.appliances.push(a); return a; }
  light(id) { return this.byId.get(id); }

  /* Is a supply live right now? */
  live(c) {
    if (!c) return false;
    switch (c) {
      case 'street': case 'fire': case 'always': return true;
      case 'lodge': return this.lodge;
      case 'car': return true; // the car's own battery: its lamps are switched by the intro
      case 'main': return this.lodge && !this.tripped && this.breakers.main;
    }
    if (HOUSE_CIRCUITS.indexOf(c) >= 0) return this.live('main') && this.breakers[c];
    return false;
  }

  /* The spec's `circuits` view: live state of every house circuit. */
  get circuits() { const o = {}; for (const c of HOUSE_CIRCUITS) o[c] = this.live(c); return o; }

  isHouseCircuit(c) { return HOUSE_CIRCUITS.indexOf(c) >= 0; }

  setLodge(v) {
    if (this.lodge === !!v) return;
    this.lodge = !!v;
    this.events.emit('power:lodge', this.lodge);
    this.events.emit('power:changed');
  }

  /* MAIN at the pantry fuse board: every breaker on, and every fitting on by
     itself — the house was left switched on in 1974. Also resets a trip. */
  throwMain() {
    if (!this.lodge) { this.events.emit('power:nosupply'); return false; }
    for (const c of HOUSE_CIRCUITS) this.breakers[c] = true;
    const wasTripped = this.tripped;
    this.tripped = false;
    for (const l of this.lights) if (this.isHouseCircuit(l.circuit) && !l.dead) l.on = true;
    this.events.emit('power:main', { reset: wasTripped });
    this.events.emit('power:changed');
    return true;
  }

  setBreaker(c, v) {
    if (HOUSE_CIRCUITS.indexOf(c) < 0) return false;
    if (c === 'main' && v) return this.throwMain();
    this.breakers[c] = !!v;
    this.events.emit('power:breaker', { circuit: c, on: !!v });
    this.events.emit('power:changed');
    return true;
  }
  toggleBreaker(c) { return this.setBreaker(c, !this.breakers[c]); }

  /* The storm trips MAIN once. Everything dies, the hall included. */
  stormTrip() {
    if (this.stormHasTripped || !this.live('main')) return false;
    this.stormHasTripped = true;
    this.tripped = true;
    this.breakers.main = false;
    this.events.emit('power:trip');
    this.events.emit('power:changed');
    return true;
  }

  /* Old fittings: each power-up may blow the bulb or leave it flickering for good. */
  rollFailure(l, rng) {
    // a fitting that has already failed fails the same way again (its power may have been cut mid-start)
    if (!l.failed) {
      if (l.noFail || l.kind === 'bang' || l.kind === 'emergency' || l.kind === 'fire') return;
      if (l.circuit === 'fire') return;
      if (rng() >= this.failureRate) return;
      l.failed = rng() < 0.5 ? 'exploded' : 'faulty';
    }
    if (l.failed === 'exploded') {
      // flares, pops and dies: keep the first sputters, then blow
      l.seq = l.seq.slice(0, 2).concat([{ d: 0.1 + rng() * 0.3, v: 0.9 }, { d: 0.12, v: 3.4, ramp: true }, { d: 0.01, v: 0, bang: true }]);
    } else {
      // lights, but never settles
      l.seq.push({ d: 0.01, v: 1, fault: Math.max(l.flicker, 0.45 + rng() * 0.4) });
    }
  }

  /* Which chain a light starts in: its estate group, its room in the house, else its supply and room. */
  chainOf(l) { return l.chain || (this.isHouseCircuit(l.circuit) ? 'house:' : l.circuit + ':') + l.room; }
  /* Lights that just come on, with no warm-up to wait for. */
  instant(l) { return l.kind === 'emergency' || l.kind === 'fire' || l.circuit === 'car' || l.circuit === 'fire'; }

  /* Old wiring brings its lights up one at a time: within a chain, the next
     light only starts once the one before it has reached full brightness
     (or blown). The first to go is the one nearest the player. */
  chooseStarters() {
    const busy = new Set(), best = new Map(), o = this.origin;
    for (const l of this.lights) if (l.powered && l.seq && !this.instant(l)) busy.add(this.chainOf(l));
    for (const l of this.lights) {
      l.waiting = false;
      if (l.powered || l.dead || !l.on || this.instant(l) || !this.live(l.circuit)) continue;
      const k = this.chainOf(l);
      if (busy.has(k)) { l.waiting = true; continue; }
      const d = o ? (l.pos.x - o.x) * (l.pos.x - o.x) + (l.pos.z - o.z) * (l.pos.z - o.z) + (l.pos.y - (o.y || 0)) * (l.pos.y - (o.y || 0)) : 0;
      const b = best.get(k);
      if (!b || d < b.d) { if (b) b.l.waiting = true; best.set(k, { l, d }); } else l.waiting = true;
    }
    const go = new Set();
    for (const v of best.values()) go.add(v.l);
    return go;
  }

  /* Advance start-up envelopes, fault modulation and appliances. */
  update(dt) {
    this.time += dt;
    const t = this.time, rng = this.rng;
    const go = this.sequential ? this.chooseStarters() : null;
    for (const l of this.lights) {
      let powered = !l.dead && l.on && this.live(l.circuit);
      if (powered && !l.powered && go && !go.has(l) && !this.instant(l)) powered = false; // waiting its turn
      if (powered && !l.powered) {
        l.seq = l.startSequence(rng); l.seqIndex = 0; l.seqT = 0; l.fraction = 0; l.buzzing = false;
        this.rollFailure(l, rng);
        this.events.emit('light:start', l);
      } else if (!powered && l.powered) {
        l.seq = null; l.fraction = 0; l.buzzing = false;
        this.events.emit('light:stop', l);
      }
      l.powered = powered;
      if (powered && l.seq) {
        l.seqT += dt;
        let guard = 0;
        while (l.seq && l.seqT >= l.seq[l.seqIndex].d && guard++ < 64) {
          const step = l.seq[l.seqIndex];
          l.seqT -= step.d;
          l.fraction = step.v;
          if (step.buzz) { l.buzzing = true; this.events.emit('light:buzz', l); }
          if (step.fault) { const first = !l.faultShown; l.faultShown = true; l.flicker = Math.max(l.flicker, step.fault); l.lightType = 'flicker'; if (first) this.events.emit('light:fail', { light: l, mode: 'faulty' }); }
          if (step.bang) {
            // flares, bangs and dies permanently with a scorch mark
            l.dead = true; l.scorched = true; l.powered = false; l.fraction = 0; l.seq = null; l.warming = false;
            this.events.emit('light:bang', l);
            if (l.failed === 'exploded') this.events.emit('light:fail', { light: l, mode: 'exploded' });
            break;
          }
          l.seqIndex++;
          if (l.seqIndex >= l.seq.length) { l.seq = null; }
        }
        l.warming = !!(l.seq && l.seq[l.seqIndex].warm);
        if (l.seq) {
          const step = l.seq[l.seqIndex];
          if (step.ramp) {
            const prev = l.seqIndex > 0 ? l.seq[l.seqIndex - 1].v : 0;
            l.fraction = prev + (step.v - prev) * Math.min(1, l.seqT / step.d);
          }
        }
      }
      let k = l.powered ? l.fraction : 0;
      if (k > 0) {
        k *= (LIGHT_TYPES[l.lightType] || LIGHT_TYPES.steady)(t, l.phase);
        if (l.warming) k *= 0.62 + 0.38 * noise1(t * 13 + l.phase * 40);
        if (l.flicker > 0) { const n = noise1(t * 9 + l.phase * 77); if (n < l.flicker * 0.5) k *= 0.1 + n; }
        if (l.blink > 0) { if (((t * l.blink + l.phase) % 1) > 0.55) k *= 0.03; }
      }
      l.intensity = l.target * k;
    }
    for (const a of this.appliances) {
      const run = a.switchedOn && this.live(a.circuit);
      if (run && !a.running) this.events.emit('appliance:start', a);
      if (!run && a.running) this.events.emit('appliance:stop', a);
      a.running = run;
      if (a.kind === 'fan') {
        // stops where it stands: no spin-down, the blades freeze
        a.spin = run ? Math.min(9, a.spin + dt * 6) : 0;
        a.angle = (a.angle + a.spin * dt) % (Math.PI * 2);
      } else if (a.kind === 'record') {
        a.spin = run ? 3.5 : 0; // 33 rpm
        a.angle = (a.angle + a.spin * dt) % (Math.PI * 2);
      } else if (a.kind === 'kettle') {
        if (run) {
          a.boil = Math.min(1, a.boil + dt / 25);
          if (a.boil >= 1) { a.switchedOn = false; this.events.emit('appliance:boiled', a); }
        } else a.boil = Math.max(0, a.boil - dt / 180);
      } else if (a.kind === 'heater') {
        a.glow = run ? Math.min(1, a.glow + dt / 4) : Math.max(0, a.glow - dt / 6);
      } else if (a.kind === 'fridge') {
        if (run) { a.cycle += dt; a.compressor = (a.cycle % 30) < 20; } else a.compressor = false;
      } else if (a.kind === 'clock') {
        if (run) a.clockTime += dt;
      }
      if (a.light) a.light.on = a.switchedOn;
    }
  }
}
BM.PowerGrid = PowerGrid;
})();
