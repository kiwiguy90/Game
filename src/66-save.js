/* ==========================================================================
   BLACKTHORN MANOR — 7b. SAVING AND CONTINUING
   The night is saved as you play (every few seconds while nothing is in
   motion, and whenever you pause), in this browser only. The title screen
   offers Continue when there is a night to go back to. Finishing the game
   clears it.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const KEY = 'blackthorn-manor-save';
const VERSION = 1;

const store = {
  get() { try { const s = JSON.parse(window.localStorage.getItem(KEY) || 'null'); return s && s.v === VERSION ? s : null; } catch (e) { return null; } },
  set(s) { try { window.localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } },
  clear() { try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ } },
};

const Save = BM.Save = {
  has() { return !!store.get(); },
  clear() { store.clear(); },
  read() { return store.get(); },

  /* Is the world at rest, so that a snapshot of it can be put back exactly? */
  stable(g) {
    const G = g.gates, sd = g.stormDoors, L = g.lift;
    if (g.intro || g.outro || g.busy || g.climbing || (g.story && g.story.ended)) return false;
    if (g.ui.mode && g.ui.mode !== 'pause') return false;
    if (G && (G.closing || (G.open && G.t < 1))) return false;
    if (sd && sd.moving) return false;
    if (L && L.phase !== 'idle') return false;
    if (g.B.doors.some(d => d.moving)) return false;
    if (!g.player.grounded) return false;
    return true;
  },

  snapshot(g) {
    const p = g.player, grid = g.grid, G = g.gates;
    const story = Object.assign({}, g.story, { read: [...(g.story.read || [])] });
    return {
      v: VERSION, at: Date.now(),
      player: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, torch: !!p.torch },
      grid: { lodge: grid.lodge, breakers: Object.assign({}, grid.breakers), tripped: grid.tripped, stormHasTripped: grid.stormHasTripped,
        on: grid.lights.filter(l => l.on).map(l => l.id) },
      gates: { open: G.open, lockedIn: G.lockedIn, escaping: G.escaping, lodgeLocked: !!G.lodgeLocked },
      doors: g.B.doors.filter(d => d.open).map(d => d.id),
      story, carry: g.carry || null,
      spare: { taken: g.spare.taken, fitted: g.spare.fitted },
      battery: { carried: g.battery.carried, fitted: g.battery.fitted },
      windows: g.B.windows.filter(w => w.open || (w.curtains && w.curtains.drawn)).map(w => ({ id: w.id, open: !!w.open, drawn: !!(w.curtains && w.curtains.drawn) })),
      fires: g.fires.filter(f => f.lit).map(f => f.id),
      storm: { bolted: g.stormDoors.bolted, open: g.stormDoors.open },
      lift: g.lift ? g.lift.at : 1,
      garage: g.garageDoor ? g.garageDoor.open : true,
      garage2: g.garageDoors && g.garageDoors[1] ? g.garageDoors[1].open : true,
      clocks: { tower: g.towerClock ? g.towerClock.time : 0, longcase: g.longcase ? g.longcase.time : 0 },
    };
  },

  write(g) {
    if (!this.stable(g)) return false;
    const ok = store.set(this.snapshot(g));
    if (ok) g.lastSave = g.time;
    return ok;
  },

  /* Put a saved night back into a freshly built world (the arrival already skipped). */
  restore(g, s) {
    const grid = g.grid, G = g.gates;
    // the supply and every switch
    if (s.grid.lodge) grid.setLodge(true);
    Object.assign(grid.breakers, s.grid.breakers);
    grid.tripped = s.grid.tripped; grid.stormHasTripped = s.grid.stormHasTripped;
    const on = new Set(s.grid.on);
    for (const l of grid.lights) if (!l.dead && l.circuit !== 'car') l.on = on.has(l.id);
    grid.events.emit('power:changed');
    // the gates
    Object.assign(G, { open: s.gates.open, lockedIn: s.gates.lockedIn, escaping: s.gates.escaping, lodgeLocked: s.gates.lodgeLocked, closing: false, t: s.gates.open ? 1 : 0, wait: 0, saidOpen: true });
    const a = s.gates.open ? 1.65 : 0;
    G.leaves[0].rotation.y = a; G.leaves[1].rotation.y = -a; G.wall.enabled = !s.gates.open;
    // the doors: each finishes its swing on the next frame, silently
    const open = new Set(s.doors);
    for (const d of g.B.doors) {
      const want = open.has(d.id);
      if (want === d.open) continue;
      d.target = want ? 1 : 0; d.t = want ? 0.99 : 0.01; d.moving = true;
    }
    // the story so far, and what you are carrying
    Object.assign(g.story, s.story, { read: new Set(s.story.read || []) });
    g.carry = s.carry;
    Object.assign(g.spare, s.spare); Object.assign(g.battery, s.battery);
    if (g.spare.taken || g.spare.fitted) g.spare.mesh.visible = false;
    if (g.battery.carried || g.battery.fitted) g.battery.mesh.visible = false;
    if (g.spare.fitted) { g.car.flat = false; g.car.setFlat(0); }
    // windows and curtains: they slide to where they were
    const W = new Map(s.windows.map(w => [w.id, w]));
    for (const w of g.B.windows) {
      const sv = W.get(w.id);
      w.open = !!(sv && sv.open);
      if (w.curtains) { w.curtains.drawn = !!(sv && sv.drawn); w.curtains.target = w.curtains.drawn ? 1 : 0; }
    }
    // fires and candles
    const lit = new Set(s.fires);
    for (const f of g.fires) { f.lit = lit.has(f.id); if (f.light) f.light.on = f.lit; }
    // the storm doors, the lift, the garage, the clocks
    const sd = g.stormDoors; sd.bolted = s.storm.bolted;
    if (s.storm.open !== sd.open) { sd.target = s.storm.open ? 1 : 0; sd.t = s.storm.open ? 0.99 : 0.01; sd.moving = true; }
    if (g.lift) { const L = g.lift; L.at = L.pos = L.from = L.to = s.lift; L.phase = 'idle'; for (let i = 0; i < 4; i++) L.gate[i] = L.gateTarget[i] = i === s.lift ? 1 : 0; }
    if (g.garageDoor && s.garage !== g.garageDoor.open) { g.garageDoor.open = s.garage; g.garageDoor.moving = true; }
    { const d2 = g.garageDoors && g.garageDoors[1]; if (d2 && s.garage2 !== undefined && s.garage2 !== d2.open) { d2.open = s.garage2; d2.moving = true; } }
    if (g.towerClock && s.clocks.tower) { g.towerClock.time = s.clocks.tower; if (g.clock_) g.clock_.quarter = Math.floor(s.clocks.tower / 900); }
    if (g.longcase && s.clocks.longcase) { g.longcase.time = s.clocks.longcase; g.longcase.quarter = Math.floor(s.clocks.longcase / 900); }
    // and you, where you stood
    g.teleport(s.player.x, s.player.y, s.player.z, s.player.yaw);
    g.player.pitch = s.player.pitch || 0; g.player.torch = !!s.player.torch;
    g.lastSave = g.time;
  },
};

/* every few seconds of play, when the world is still */
BM.updateSave = function (g, dt) {
  if (g.headless || !g.ui || g.ui.mode === 'title') return;
  g.saveT = (g.saveT || 0) + dt;
  if (g.saveT < 8) return;
  g.saveT = 0;
  if (Save.write(g)) flash();
};
/* a quiet word in the corner when the night is saved */
let flashEl = null, flashTimer = 0;
function flash() {
  if (typeof document === 'undefined' || !document.body) return;
  if (!flashEl) { flashEl = document.createElement('div'); flashEl.style.cssText = 'position:fixed;right:16px;bottom:12px;font:italic 12px Georgia,serif;color:#d8cfbf;opacity:0;transition:opacity .8s;pointer-events:none;text-shadow:0 0 4px #000'; flashEl.textContent = 'Saved'; document.body.appendChild(flashEl); }
  flashEl.style.opacity = '0.45'; clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashEl.style.opacity = '0'; }, 1400);
}
})();
