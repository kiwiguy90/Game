/* ==========================================================================
   BLACKTHORN MANOR — 10. THE GAME
   Tank controls: W/S move, A/D turn, Space jump, E interact, T torch, P phone.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const START = { x: 0.6, y: 0, z: 95.6, yaw: 0 }; // on the lane beside your car, facing the gates
const GATE = { delay: 1.0, swing: 9, close: 7.5, escape: 12 };
const APPLIANCE_SAY = {
  tv: 'The set warms up with a whine. Snow, and a grey hiss.',
  fan: 'The fan whirs up to speed.',
  radio: 'Valves warm. Static, and somewhere under it, music.',
  kettle: 'The kettle starts to tick and murmur.',
  heater: 'The bars tick as they start to glow.',
  fridge: 'The fridge shudders and its motor starts to hum.',
  record: 'The platter turns. The needle finds the groove: crackle, then a waltz.',
};
BM.GATE = GATE;
const ESTATE_SAY = {
  street: 'Along the lane, the street lamps come up orange — all but the one that never works properly.',
  gate: 'The lanterns on the gate piers glow on.',
  flood: 'Floodlights thump on, one after another. The front of the house and the garage yard leap out of the rain, and one by one the four towers are lit from their feet, standing up pale against the dark. Behind the house, the floodlights over the old tennis court bang on.',
  drive: 'Lamps come up along the drive, two by two, all the way to the turning circle.',
  garden: 'Small lights wake round the fountain, and all round the maze the uplights come on one by one, washing the yew walls a pale, cold green.',
  pool: 'Down in the pool garden the pumps knock and start, the upper pool begins to spill over its weir, and both pools light from underneath, blue and green, the light swimming on the water.',
  pond: 'Lamps come on at the edge of the pond. The ducks complain.',
  garage: 'The garage tube strobes and catches; a lantern lights over its door.',
  shed: 'The shed bulb comes on, and the lantern by its door.',
  cemetery: 'Two lanterns at the cemetery gate, one more by a small stone outside the railings — and beyond it the chapel, its windows coming up red and blue and gold.',
};
BM.START = START;

/* ---------------------------------------------------------------- UI ---- */
class UI {
  constructor(game) {
    this.game = game;
    const $ = id => document.getElementById(id);
    this.el = {
      prompt: $('prompt'), msg: $('msg'), reader: $('reader'), readerTitle: $('reader-title'), readerText: $('reader-text'),
      panel: $('panel'), panelTitle: $('panel-title'), panelBody: $('panel-body'), phone: $('phone'), phoneBody: $('phone-body'),
      fade: $('fade'), title: $('title'), ending: $('ending'), endingText: $('ending-text'), objective: $('objective'),
    };
    this.el.lights = $('lights');
    this.lightsVisible = true;
    this.lightsT = 0;
    if (this.el.lights && this.el.lights.addEventListener) this.el.lights.addEventListener('pointerdown', e => {
      if (e.button) return;
      let t = e.target;
      while (t && t !== this.el.lights && !(t.dataset && t.dataset.k)) t = t.parentNode;
      if (t && t.dataset && t.dataset.k) { this.game.lightPanelToggle(t.dataset.k); this.lightsT = 0; }
    });
    this.mode = null;    // null | 'read' | 'fuse' | 'estate' | 'lights' | 'phone' | 'title' | 'ending'
    this.lightsSel = 0;
    this.msgT = 0;
    this.fadeV = 0;
  }
  say(text, secs) {
    this.lastSay = text;
    this.el.msg.textContent = text; this.el.msg.style.opacity = '1';
    this.msgT = secs || Math.min(7, 2.5 + text.length * 0.04);
  }
  read(it) {
    this.mode = 'read';
    this.el.readerTitle.textContent = it.title;
    this.el.readerText.textContent = it.text;
    this.el.reader.style.display = 'block';
  }
  close() {
    this.el.reader.style.display = 'none'; this.el.panel.style.display = 'none'; this.el.phone.style.display = 'none';
    const was = this.mode; this.mode = null;
    if (was === 'lights') { this.lightsT = 0; this.lightsHtml = ''; this.renderLights(); if (this.game.menu) this.game.menu.lock(); }
    if (was === 'read' && this.game.onReadClosed) this.game.onReadClosed();
  }
  openFuseBoard() {
    this.mode = 'fuse'; this.el.panel.style.display = 'block';
    this.el.panelTitle.textContent = 'PANTRY FUSE BOARD';
    this.renderFuse();
  }
  renderFuse() {
    const g = this.game.grid, row = (k, c) => `<div class="row"><span class="key">${k}</span><span>${c.toUpperCase()}</span><span class="${g.breakers[c] ? 'on' : 'off'}">${g.breakers[c] ? 'ON' : 'OFF'}</span><span class="${g.live(c) ? 'live' : 'dead'}">${g.live(c) ? '● live' : '○ dead'}</span></div>`;
    this.el.panelBody.innerHTML = row('M', 'main') + ['hall', 'ground', 'east', 'west', 'attic', 'cellar'].map((c, i) => row(String(i + 1), c)).join('') +
      `<div class="hint">${g.lodge ? (g.tripped ? 'MAIN HAS TRIPPED. Throw it again to reset.' : 'Supply from the lodge: present.') : 'No supply from the lodge.'}<br>M / 1–6 to switch · E to close</div>`;
  }
  openEstate() {
    this.mode = 'estate'; this.el.panel.style.display = 'block';
    this.el.panelTitle.textContent = 'LODGE — ESTATE LIGHTING';
    this.renderEstate();
  }
  renderEstate() {
    const g = this.game, grid = g.grid;
    const rows = g.estateGroups.map(([k, name], i) => {
      const on = g.estateGroupOn(k);
      return `<div class="row"><span class="key">${(i + 1) % 10}</span><span>${name.toUpperCase()}</span><span class="${on ? 'on' : 'off'}">${on ? 'ON' : 'OFF'}</span><span class="${on && grid.lodge ? 'live' : 'dead'}">${g.estateLights[k].length} lamps</span></div>`;
    }).join('');
    this.el.panelBody.innerHTML = rows + `<div class="row"><span class="key">A</span><span>ALL ON / ALL OFF</span><span></span><span></span></div>` +
      `<div class="hint">${grid.lodge ? 'Lodge supply: ON.' : 'Lodge supply: OFF. Throw the main switch first.'}<br>1–9, 0 to switch a group · A for everything · E to close</div>`;
  }
  phone() {
    if (this.mode === 'phone') { this.close(); return; }
    this.mode = 'phone'; this.el.phone.style.display = 'block';
    const g = this.game, read = g.story.read;
    const docs = g.B.readables.filter(r => read.has(r.id)).map(r => `<div class="doc">· ${r.title}</div>`).join('') || '<div class="doc">Nothing yet.</div>';
    const mins = Math.floor(g.clock / 60) % 60, hrs = (23 + Math.floor(g.clock / 3600)) % 24;
    this.el.phoneBody.innerHTML = `<div class="ph-top"><span>${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}</span><span>No service</span><span>${Math.max(5, 64 - Math.floor(g.clock / 90))}%</span></div>` +
      `<div class="ph-h">Notes</div><div class="ph-obj">${g.objective()}</div>` +
      `<div class="ph-h">Photos of documents (${read.size})</div>${docs}` +
      `<div class="ph-h">Torch</div><div>${g.player.torch ? 'On' : 'Off'} — press T</div>`;
  }
  fade(v) { this.fadeV = v; if (this.el.fade) this.el.fade.style.opacity = String(v); }
  setPrompt(t) { if (t !== this.promptText) { this.promptText = t; if (this.el.prompt) this.el.prompt.textContent = t; } }
  setObjective(t) { if (t !== this.objectiveText) { this.objectiveText = t; if (this.el.objective) this.el.objective.textContent = t; } }
  /* Tab: let go of the mouse so the lighting panel can be clicked (or worked with the arrow keys). */
  openLights() {
    if (this.mode) return;
    this.mode = 'lights'; this.lightsVisible = true; this.lightsT = 0; this.lightsHtml = '';
    const rows = this.game.lightPanelRows();
    if (!(this.lightsSel >= 0 && this.lightsSel < rows.length)) this.lightsSel = 0;
    if (this.game.menu) this.game.menu.unlock();
  }
  moveLightsSel(d) {
    const n = this.game.lightPanelRows().length; if (!n) return;
    this.lightsSel = ((this.lightsSel || 0) + d + n) % n;
    const el = this.el.lights, row = el && el.querySelector && el.querySelectorAll('.r')[this.lightsSel];
    this.renderLights();
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
  }
  toggleLightsSel() {
    const r = this.game.lightPanelRows()[this.lightsSel || 0];
    if (r) { this.game.lightPanelToggle(r.k); this.lightsT = 0; }
  }
  /* The lighting panel on the side of the screen: every light group, always to hand. */
  renderLights() {
    const el = this.el.lights; if (!el) return;
    const active = this.mode === 'lights';
    const show = (this.lightsVisible || active) && this.mode !== 'title' && this.mode !== 'ending' && !this.game.intro;
    el.style.display = show ? 'block' : 'none';
    if (!show) return;
    if (el.classList) el.classList.toggle('active', active);
    const rows = this.game.lightPanelRows();
    let html = '', section = '', i = -1;
    for (const r of rows) {
      i++;
      if (r.section !== section) {
        section = r.section;
        html += `<div class="hd"><span>${section}</span><span class="sup">${r.supply}</span></div>`;
      }
      const dot = r.lit ? 'lit' : r.warming ? 'warm' : '';
      html += `<div class="r${r.live ? '' : ' dead'}${active && i === this.lightsSel ? ' sel' : ''}" data-k="${r.k}"><span class="dot ${dot}"></span><span class="k">${r.key || ''}</span><span>${r.name}</span><span class="st ${r.on ? 'on' : 'off'}">${r.on ? 'ON' : 'OFF'}</span></div>`;
    }
    html += active ? '<div class="hint">Click a row to switch it · ↑ ↓ and Enter · Tab or Esc to look around again</div>'
      : '<div class="hint">Tab to use the mouse here · O / I masters · 1–0 estate · L hide</div>';
    if (html !== this.lightsHtml) { el.innerHTML = html; this.lightsHtml = html; }
  }
  update(dt) {
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.el.msg.style.opacity = '0'; }
    if (this.mode === 'fuse') this.renderFuse();
    if (this.mode === 'estate') this.renderEstate();
    this.lightsT -= dt;
    if (this.lightsT <= 0) { this.lightsT = 0.2; this.renderLights(); }
  }
}
BM.UI = UI;

/* -------------------------------------------------------------- GAME ---- */
class Game {
  constructor(opts) {
    this.opts = opts || {};
    this.headless = !!this.opts.headless;
  }

  init(container) {
    const W = this.opts.width || window.innerWidth || 1280, H = this.opts.height || window.innerHeight || 720;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', canvas: this.opts.canvas });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(W, H);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.info.autoReset = false;
    if (container) container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, W / H, 0.05, 240);
    this.scene.add(this.camera);

    this.events = new BM.Events();
    this.grid = new BM.PowerGrid(this.events, 1974);
    this.phys = new BM.PhysWorld();
    this.B = new BM.Builder(this.scene, this.phys, this.grid);
    this.storm = true;
    this.story = { read: new Set(), journalRead: false, ended: false, stormTripReported: false };
    this.player = { x: START.x, y: START.y, z: START.z, yaw: START.yaw, pitch: 0, vy: 0, grounded: true, torch: false, bob: 0, stepAcc: 0, safe: { x: START.x, y: START.y, z: START.z } };
    this.keys = {};
    this.clock = 41 * 60;
    this.frameErrors = 0;
    this.time = 0;

    BM.buildGrounds(this.B, this);
    BM.buildCar(this.B, this);
    BM.buildMansion(this.B, this);
    BM.buildAppliances(this.B, this);
    BM.buildHauntedGarden(this.B, this);
    BM.buildGothic(this.B, this);
    BM.buildRoad(this.B, this);
    BM.buildOvergrown(this.B, this);
    BM.buildDressing(this.B, this);
    BM.buildSwitchboards(this.B, this);
    BM.buildHearths(this.B, this);
    BM.buildCourtyard(this.B, this);
    BM.buildFurnishings(this.B, this);
    BM.buildInterior(this.B, this);
    BM.buildWindows(this.B, this);
    BM.buildLift(this.B, this);
    BM.buildChapel(this.B, this);
    BM.buildMausoleum(this.B, this);
    BM.buildSearchlights(this.B, this);
    BM.buildGroundsLights(this.B, this);
    BM.buildPoolGarden(this.B, this);
    BM.buildGlimpses(this.B, this);
    this.interactables = this.B.interactables;
    this.byId = {};
    for (const it of this.interactables) this.byId[it.id] = it;

    this.audio = new BM.Synth(this);
    this.fx = new BM.FX(this);
    this.fx.look = new BM.LightLook(this.fx, this);
    this.clock_ = this.towerClock ? new BM.TowerClock(this) : null;
    this.ui = new UI(this);
    this.optStats = BM.optimize(this);
    this.quality = new BM.Quality(s => this.applyQuality(s), this.opts.quality !== undefined ? this.opts.quality : 2);
    this.applyQuality(this.quality.settings);
    this.menu = BM.Menu ? new BM.Menu(this) : null; // pause, settings, mouse look
    if (this.menu) this.menu.apply();
    this.wireEvents();
    this.stormTimer = -1;
    this.climbing = null;
    this.outro = null;
    this.updateCamera();
    return this;
  }

  applyQuality(s) {
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(dpr, s.pixelRatio));
    this.fx.quality.rain = s.rain;
    this.fx.quality.mirrors = s.mirrors;
    this.fx.quality.shadowEvery = s.shadowEvery;
    this.renderer.shadowMap.autoUpdate = false;
    if (this.fx.torch) { this.fx.torch.castShadow = s.shadowEvery > 0; this.shadowFrame = 0; }
  }

  wireEvents() {
    const ev = this.events;
    ev.on('light:bang', l => {
      const p = this.player, d = Math.hypot(l.pos.x - p.x, l.pos.y - p.y - 1.6, l.pos.z - p.z);
      this.audio.bang(Math.max(0.08, 1 - d / 45)); if (l.scorch) l.scorch.visible = true;
    });
    ev.on('light:fail', e => {
      const l = e.light, p = this.player, d = Math.hypot(l.pos.x - p.x, l.pos.y - p.y - 1.6, l.pos.z - p.z);
      if (d > 18 || this.time - (this.lastFailSay || -9) < 4) return;
      this.lastFailSay = this.time;
      this.ui.say(e.mode === 'exploded' ? `Pop — the ${l.name.toLowerCase()} flares and blows. Glass tinkles down.` : `The ${l.name.toLowerCase()} won't settle. It just keeps flickering.`, 4);
    });
    ev.on('appliance:start', a => {
      const p = this.player, d = Math.hypot(a.pos.x - p.x, a.pos.y - p.y - 1.6, a.pos.z - p.z);
      if (d < 14) this.audio.clunk(Math.max(0.15, 1 - d / 14));
    });
    // the little sounds of old fittings striking up, if you are near enough to hear
    ev.on('light:start', l => {
      const p = this.player, d = Math.hypot(l.pos.x - p.x, l.pos.y - p.y - 1.6, l.pos.z - p.z);
      if (d > 9 || !this.audio.ctx) return;
      const v = 1 - d / 9;
      if (l.kind === 'fluorescent') { for (let i = 0; i < 3; i++) this.audio.tone('square', 5200 - i * 300, 4800, 0.02 * v, 0.001, 0.03, 0.05 + i * 0.11); }
      else if (l.kind === 'incandescent' || l.kind === 'lamp') this.audio.tone('sine', 3800 + Math.random() * 900, 3500, 0.025 * v, 0.001, 0.12);
    });
    ev.on('appliance:boiled', a => {
      this.audio.click();
      const p = this.player;
      if (Math.hypot(a.pos.x - p.x, a.pos.z - p.z) < 10 && Math.abs(a.pos.y - p.y) < 3) this.ui.say('The ' + a.name.toLowerCase() + ' rumbles to the boil and clicks itself off.');
    });
    ev.on('power:trip', () => { this.fx.strike(true); this.audio.clunk(); this.ui.say('A white crack of lightning, right overhead — and every light in the house goes out.', 6); });
    ev.on('power:main', e => { this.audio.lever(); this.ui.say(e.reset ? 'MAIN goes back up with a clunk. The house comes back on around you.' : 'MAIN. A deep clunk through the walls, then fittings all over the house begin to stutter into life.', 6); });
  }

  /* --------------------------------------------------- state queries ---- */
  zoneAt(x, y, z) {
    if (y < -1) return 'house';
    if (x > -18.2 && x < 18.2 && z > -12.2 && z < 12.2) return 'house';
    return 'exterior';
  }
  visibleZones(y) {
    if (y < -1) return { exterior: false, mansion: true };
    return { exterior: true, mansion: true };
  }
  roomAt(x, y, z) {
    if (y > -1 && y < 3.5 && x > 6 && x < 18 && z > -4 && z < 4) return 'library';
    return null;
  }
  objective() {
    const g = this.grid, s = this.story;
    const gates = this.gates;
    if (s.ended) return 'You are out.';
    const bat = this.battery || {}, sp = this.spare || {};
    const need = [];
    if (!sp.fitted) need.push(this.carry === 'spare wheel' ? 'the spare on' : 'a wheel from the garage');
    if (!bat.fitted) need.push(this.carry === 'battery' ? 'the battery in' : 'the battery from the garage');
    if (gates.escaping) return gates.t < 1 ? 'The gate motor is running. ' + (this.carry ? 'Get the ' + this.carry + ' down the drive to the car.' : 'Get down the drive.') : 'The gates are open. The car needs ' + need.join(' and ') + '.';
    if (!g.lodge) return s.phoneTried ? 'The phone is dead. Try the lodge\'s main switch, on the left wall.' : 'The car is dead and the road is blocked both ways. The gatekeeper\'s lodge, to the left of the gates, might have a telephone.';
    if (!gates.open && !gates.lockedIn) return 'There is power at the lodge. Work the gate release — and the estate lighting panel under the window lights the grounds.';
    if (!gates.lockedIn) return 'Go up the drive to the house.';
    if (!this.frontDoors.opened) return 'The gates have shut and bolted behind you. There is nothing for it but the house.';
    if (!g.breakers.main && !g.stormHasTripped) return s.hallSwitchTried ? 'The switches by the door do nothing: the house main is off. Find the fuse board — try the pantry, through the kitchen at the back.' : 'It is dark. There are switches by the door.';
    if (g.tripped) return 'The storm has tripped MAIN. Go back down to the pantry fuse board and reset it.';
    if (!s.journalRead) return 'Look round the house. Eleanor\'s rooms are upstairs, and the attic above them.';
    if (!g.live('cellar')) return 'Eleanor\'s father wired the gates to a switch in the cellar, on the house supply. The cellar circuit must be on.';
    return this.carry ? 'You have the ' + this.carry + '. The gate motor switch is in the cellar, by the boiler. Throw it.' : 'The gate motor switch is in the cellar, by the boiler. And your car needs a wheel and a battery: there is an old Rover in the garage.';
  }
  hallLit() { return this.hallLights.some(id => { const l = this.grid.light(id); return l && l.powered; }); }

  /* ------------------------------------------------------ actions ---- */
  toggleFittings(ids) {
    const lights = ids.map(id => this.grid.light(id)).filter(Boolean);
    const anyOn = lights.some(l => l.on && !l.dead);
    for (const l of lights) if (!l.dead) l.on = !anyOn;
    this.audio.click();
    const powered = lights.some(l => this.grid.live(l.circuit));
    if (!powered) { if (!this.grid.live('main') && lights.some(l => this.grid.isHouseCircuit(l.circuit))) { this.story.hallSwitchTried = true; this.ui.say('The switch clicks. Nothing. The house main must be off: there will be a fuse board somewhere at the back.'); } else this.ui.say('The switch clicks. Nothing — that circuit is dead.'); }
    return !anyOn;
  }
  /* Rows for the side lighting panel: estate groups, then every room's switch. */
  lightPanelRows() {
    const g = this.grid, rows = [];
    const state = ids => {
      const ls = ids.map(id => g.light(id)).filter(l => l && !l.dead);
      return { on: ls.some(l => l.on), lit: ls.some(l => l.powered && l.fraction >= 0.95), warming: ls.some(l => (l.powered && l.fraction < 0.95) || l.waiting), live: ls.some(l => g.live(l.circuit)) || !ls.length };
    };
    rows.push({ section: 'MASTER', supply: '', k: 'master:outside', key: 'O', name: 'OUTSIDE supply (lodge)', on: g.lodge, lit: g.lodge, warming: false, live: true });
    rows.push({ section: 'MASTER', supply: '', k: 'master:inside', key: 'I', name: 'INSIDE supply (MAIN)', on: g.live('main'), lit: g.live('main'), warming: false, live: g.lodge });
    const short = { street: 'Street (lane)', gate: 'Gate', flood: 'Floodlights', drive: 'Drive lamps', garden: 'Garden', pool: 'Pool', pond: 'Pond', garage: 'Garage', shed: 'Shed', cemetery: 'Cemetery & chapel' };
    this.estateGroups.forEach(([k], i) => {
      const st = state(this.estateLights[k]);
      rows.push(Object.assign({ section: 'ESTATE', supply: g.lodge ? 'lodge supply ●' : 'no supply ○', k: 'estate:' + k, key: String((i + 1) % 10), name: short[k] || k }, st, { live: g.lodge && st.live }));
    });
    const allOn = this.estateGroups.every(([k]) => this.estateGroupOn(k));
    rows.push({ section: 'ESTATE', supply: g.lodge ? 'lodge supply ●' : 'no supply ○', k: 'estate-all', key: '', name: allOn ? 'All estate lights off' : 'All estate lights on', on: allOn, lit: false, live: g.lodge });
    const houseSupply = g.live('main') ? 'house supply ●' : 'no supply ○';
    for (const it of this.interactables) {
      if (!it.switchVisual) continue;
      const name = (typeof it.label === 'function' ? it.label() : it.label).replace(/ light panel$| lights$| light$/i, '');
      rows.push(Object.assign({ section: 'ROOMS', supply: houseSupply, k: 'room:' + it.id, name }, state(it.controls)));
    }
    return rows;
  }
  lightPanelToggle(k) {
    if (k === 'estate-all') return this.setEstateAll(!this.estateGroups.every(([g]) => this.estateGroupOn(g)));
    const [kind, id] = k.split(':');
    if (kind === 'master') return id === 'outside' ? this.masterOutside() : this.masterInside();
    if (kind === 'estate') return this.toggleEstate(id);
    if (kind === 'room' && this.byId[id]) return this.byId[id].act(this);
  }
  estateGroupOn(k) { return this.estateLights[k].some(id => { const l = this.grid.light(id); return l && !l.dead && l.on; }); }
  toggleEstate(k) {
    if (!this.grid.lodge) { this.audio.click(); this.ui.say('The switches click. Nothing. The lodge main switch is off.'); return false; }
    const ids = this.estateLights[k], on = !this.estateGroupOn(k);
    for (const id of ids) { const l = this.grid.light(id); if (!l.dead) l.on = on; }
    this.audio.clunk();
    const name = this.estateGroups.find(e => e[0] === k)[1];
    this.ui.say(on ? ESTATE_SAY[k] || name + ': on.' : name + ': off.');
    return on;
  }
  setEstateAll(on) {
    if (!this.grid.lodge) { this.audio.click(); this.ui.say('The switches click. Nothing. The lodge main switch is off.'); return; }
    for (const [k] of this.estateGroups) for (const id of this.estateLights[k]) { const l = this.grid.light(id); if (!l.dead) l.on = on; }
    this.audio.lever();
    this.ui.say(on ? 'You throw every switch on the panel. Across the estate, light after light stutters on in the rain.' : 'You throw every switch off. The estate goes back to the dark.');
  }
  toggleAppliance(a) {
    a.switchedOn = !a.switchedOn; this.audio.click();
    if (a.switchedOn && !this.grid.live(a.circuit)) { this.ui.say(a.name + ': switched on, but there is no power to it.'); return; }
    if (a.switchedOn) this.ui.say(APPLIANCE_SAY[a.kind] || a.name + ': on.', 3.5);
  }
  lightFire() { this.lightHearth(this.fire); }
  /* a thin wisp from under the bonnet for a while after you get out */
  carSmoulder(dt) {
    const car = this.car, c = car.group.position, inv = this._carInv || (this._carInv = car.group.matrixWorld.clone().invert());
    for (const pf of car.puffs) {
      if (pf.t < 0 && Math.random() < dt * 0.8) { pf.t = 0; pf.life = 2.5; pf.ox = (Math.random() - 0.5) * 0.4; }
      if (pf.t >= 0) {
        pf.t += dt; const u = pf.t / pf.life;
        if (u >= 1) { pf.t = -1; pf.m.material.opacity = 0; continue; }
        pf.m.position.set(c.x + 2.1 - u * 0.5, 0.95 + u * 1.2, c.z + pf.ox + u * 0.6).applyMatrix4(inv);
        pf.m.scale.setScalar(0.15 + u * 0.5); pf.m.material.opacity = 0.18 * Math.sin(u * Math.PI);
      }
    }
  }
  /* Fires need no electricity: a match, kindling, and they burn for the night. */
  lightHearth(f) {
    if (f.lit) { this.ui.say(f.name + ' is burning. It needs no electricity at all.'); return; }
    f.lit = true; f.light.on = true;
    this.audio.burst(this.audio.white, 'lowpass', 1200, 1, 0.5, 0.01, 0.8);
    this.ui.say(f.kind === 'hearth' ? 'Old newspaper, kindling, a match. ' + f.name + ' catches, and the room comes up orange.' : f.kind === 'range' ? 'A match to the paper and sticks in the firebox. The old range takes, ticking as the iron warms.' : 'A match to the kindling in the stove. It draws, and begins to roar quietly.');
  }
  lightCandle(c) {
    c.lit = !c.lit; c.light.on = c.lit;
    if (c.lit) { this.audio.burst(this.audio.white, 'highpass', 3000, 2, 0.15, 0.002, 0.15); this.ui.say('You strike a match and the wick takes. A small warm light, and the shadows move.', 3); }
    else { this.audio.burst(this.audio.white, 'lowpass', 500, 1, 0.1, 0.002, 0.08); this.ui.say('You pinch out the candle.', 2); }
  }
  /* the lever in the lodge's gate box: down releases the gates, up locks them again */
  gateLever() {
    const gates = this.gates;
    if (gates.lockedIn) { this.audio.click(); this.ui.say('The lever goes down and comes back up on its spring. Out at the gates, nothing moves: the bolt is on the house side now.'); return; }
    if (gates.escaping) { this.ui.say('The motor has them. Leave it.'); return; }
    if (!gates.open && !gates.closing) { this.openGates(); return; }
    if (gates.open && gates.t >= 1 && !gates.closing) {
      gates.closing = true; gates.closeT = 0; gates.closeWait = 0; gates.lodgeLocked = true;
      this.audio.lever();
      const p = this.player; this.audio.gateCreak(0.6, GATE.close, Math.max(0.4, 1 - Math.hypot(p.x, p.z - 88) / 40));
      this.ui.say('You push the lever up. Out at the lane the gates begin to swing shut.', 4);
      return;
    }
    this.audio.click(); this.ui.say('The gates are still moving.');
  }
  openGates() {
    if (this.gates.open) return;
    if (this.gates.lockedIn) { this.audio.click(); this.ui.say('The release clicks. Out at the gates, nothing moves: the bolt is on the house side now.'); return; }
    this.gates.open = true; this.gates.t = 0; this.gates.wait = 0; this.gates.lodgeLocked = false;
    this.audio.lever();
    const p = this.player, d = Math.hypot(p.x, p.z - 88);
    this.audio.gateCreak(GATE.delay, GATE.swing, Math.max(0.3, 1 - d / 40));
    this.ui.say('Out by the lane the bolts shoot back, and the gates begin to swing inwards, groaning on their hinges.');
  }
  openFrontDoors() { if (!this.frontDoors.open) this.toggleDoor(this.frontDoors); }
  /* Doors: work the handle and the leaf swings; shut, it blocks the way again. */
  toggleDoor(door) {
    if (door.moving) return;
    door.moving = true; door.target = door.open ? 0 : 1;
    const p = this.player, d = Math.hypot(door.at - (door.axis === 'x' ? p.x : p.z), door.c - (door.axis === 'x' ? p.z : p.x));
    const v = Math.max(0.2, 1 - d / 20);
    if (door.target) { if (door.sound === 'groan') this.audio.groan(); else this.audio.doorCreak(door.dur * 0.8, v); }
    else this.audio.doorCreak(door.dur * 0.6, v * 0.7);
  }
  inDoorway(door) {
    const p = this.player, r = BM.PLAYER.radius + 0.1;
    const along = door.axis === 'x' ? p.x : p.z, across = door.axis === 'x' ? p.z : p.x;
    return Math.abs(along - door.at) < door.w / 2 + r && Math.abs(across - door.c) < door.wt / 2 + r && p.y > door.y0 - 1 && p.y < door.y0 + 2.2;
  }
  updateHingedDoors(dt) {
    for (const d of this.B.doors) {
      if (!d.moving) continue;
      const dir = d.target > d.t ? 1 : -1;
      d.t = Math.max(0, Math.min(1, d.t + dir * dt / d.dur));
      let a;
      if (d.sound === 'groan' && dir > 0) {
        // the front doors: a first heave to a crack, a pause, then the long swing
        const t = d.t; a = (t < 0.35 ? (t / 0.35) * 0.2 : t < 0.42 ? 0.2 : 0.2 + ((t - 0.42) / 0.58) * 0.8) * d.maxAngle;
      } else a = (1 - Math.cos(d.t * Math.PI)) / 2 * d.maxAngle;
      d.angle(a);
      if (d.t > 0.3 && d.wall.enabled) d.wall.enabled = false;
      if (dir > 0 && d.t >= 1) { d.moving = false; d.open = true; d.opened = true; }
      if (dir < 0 && d.t <= 0) {
        if (this.inDoorway(d)) { d.t = 0.02; continue; } // it will not shut on you: it waits
        d.moving = false; d.open = false; d.wall.enabled = true;
        const p = this.player, dist = Math.hypot(d.at - (d.axis === 'x' ? p.x : p.z), d.c - (d.axis === 'x' ? p.z : p.x));
        this.audio.latch(Math.max(0.2, 1 - dist / 20));
      }
    }
  }
  /* The master switches on the panel: the lodge main for everything outside, MAIN for the house. */
  masterOutside() {
    const g = this.grid; g.setLodge(!g.lodge); this.audio.lever();
    this.ui.say(g.lodge ? 'OUTSIDE master: on. The lodge supply comes up with a clunk.' : 'OUTSIDE master: off. The lodge supply drops, and everything on it with it.');
    return g.lodge;
  }
  masterInside() {
    const g = this.grid;
    if (!g.lodge) { this.audio.click(); this.ui.say('INSIDE master: nothing. The house is fed from the lodge, and the lodge is off.'); return false; }
    if (g.live('main')) { g.setBreaker('main', false); this.audio.lever(); this.ui.say('INSIDE master: off. MAIN drops and the house goes dark around you.'); return false; }
    g.throwMain(); return true;
  }
  throwGateMotor() {
    const gates = this.gates;
    if (gates.escaping) { this.ui.say('The motor is running. Get up the stairs and down the drive.'); return; }
    if (!this.grid.live('cellar')) { this.audio.denied(); this.ui.say('The switch is dead. The gate motor is on the house supply: MAIN, and the CELLAR circuit.'); return; }
    if (!gates.lockedIn) { this.audio.click(); this.ui.say('The gates are open already.'); return; }
    gates.escaping = true; gates.lockedIn = false; gates.closing = false;
    gates.open = true; gates.t = 0; gates.wait = 0; gates.swing = GATE.escape;
    this.audio.lever();
    this.ui.say('A deep grinding starts up in the wall and travels away through the ground. Far off at the lane, the bolt draws, and the gates begin to open.', 7);
  }
  climb(dest, yaw) {
    if (this.climbing) return;
    this.climbing = { dest, yaw, t: 0 };
    this.audio.step('wood');
  }
  endGame() {
    this.story.ended = true;
    if (BM.Save) BM.Save.clear();
    this.ui.mode = 'ending';
    const text = [
      'Three miles on, the lane ends at a river with no bridge in it. You stop on the bank with the engine running, the heater on, and the doors locked, and you wait for the light. By morning the water will be down. By morning somebody will come.',
      'Behind you the house has gone dark, one light at a time, the way it came on.',
      'Eleanor never got this far. Her father\'s gates shut on her the year she turned thirteen, and in her lifetime they did not open again. "Abroad" was the attic. "Cursed" was the easiest word they had.',
      'They are still up there, in a way: every switch you threw tonight was a switch she was never allowed to touch.',
      'You put the lights on. You looked. And you got out.',
      'BLACKTHORN MANOR',
    ].join('\n\n');
    if (this.ui.el.ending) {
      // clear the screen of everything else, and leave a way back to the start
      this.ui.msgT = 0; for (const k of ['msg', 'prompt', 'objective', 'lights']) if (this.ui.el[k]) this.ui.el[k].style.display = 'none';
      this.ui.el.endingText.textContent = text; this.ui.el.ending.style.display = 'flex';
      if (typeof document !== 'undefined' && !document.getElementById('play-again')) {
        const b = document.createElement('button'); b.id = 'play-again'; b.textContent = 'Play again';
        b.style.cssText = 'position:fixed;left:50%;bottom:7vh;transform:translateX(-50%);background:#2a2016;color:#ecdcbc;border:1px solid #6a5434;padding:10px 26px;font:16px Georgia,serif;letter-spacing:.08em;cursor:pointer';
        b.addEventListener('click', () => window.location.reload()); this.ui.el.ending.appendChild(b);
      }
      if (this.menu) this.menu.unlock();
    }
    this.endingText = text;
  }
  onReadClosed() {}

  /* ------------------------------------------------- interaction ---- */
  forward() { return { x: -Math.sin(this.player.yaw), z: -Math.cos(this.player.yaw) }; }
  pick() {
    const p = this.player, f = this.forward(), eyeY = p.y + BM.PLAYER.eye;
    let best = null, bestScore = -Infinity;
    for (const it of this.interactables) {
      if (it.enabled && !it.enabled()) continue;
      const dx = it.pos.x - p.x, dz = it.pos.z - p.z, dy = it.pos.y - eyeY;
      if (Math.abs(it.pos.y - (p.y + 0.9)) > 2.0) continue;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d > it.reach) continue;
      const dot = d < 0.05 ? 1 : (dx * f.x + dz * f.z) / d;
      if (dot < 0.6) continue;
      if (this.phys.occluded(p.x, eyeY, p.z, it.pos.x, it.pos.y, it.pos.z, 0.3)) continue;
      // what you are looking straight at wins over something nearer but off to the side
      const lateral = d * Math.sqrt(Math.max(0, 1 - dot * dot)); // how far off the crosshair it sits
      const score = dot * 3.0 - d * 0.5 - Math.abs(dy) * 0.15 - lateral * 2.5;
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return best;
  }
  interact() {
    const it = this.pick();
    if (!it) return null;
    if (it.kind === 'readable') {
      this.story.read.add(it.id);
      if (it.id === 'journal') this.story.journalRead = true;
      this.ui.read(it);
      this.audio.burst(this.audio.white, 'highpass', 4000, 1, 0.08, 0.01, 0.2);
    } else if (it.act) it.act(this);
    return it;
  }
  labelOf(it) { const l = typeof it.label === 'function' ? it.label() : it.label; return l; }

  /* --------------------------------------------------------- input ---- */
  keyDown(code) {
    this.keys[code] = true;
    const ui = this.ui;
    if (ui.mode === 'title') {
      // with a night saved, only a deliberate key starts again: Enter or C continues, N begins a new night
      if (BM.Save && BM.Save.has()) { if (code === 'Enter' || code === 'KeyC') this.continueGame(); else if (code === 'KeyN') this.begin(); return; }
      this.begin(); return;
    }
    if (ui.mode === 'pause') { if (code === 'Escape' || code === 'KeyP') this.menu.resume(); return; }
    if (this.intro) { if (['KeyE', 'Space', 'Enter', 'Escape'].includes(code) && this.intro.t > 0.6) this.intro.skip(); return; }
    if (this.outro) return;
    if (ui.mode === 'ending') return;
    if (ui.mode === 'read') { if (code === 'KeyE' || code === 'Escape' || code === 'Space' || code === 'Enter') ui.close(); return; }
    if (ui.mode === 'fuse') {
      if (code === 'KeyE' || code === 'Escape') ui.close();
      else if (code === 'KeyM') {
        const up = !this.grid.breakers.main || this.grid.tripped;
        this.grid.setBreaker('main', up);
        if (!up) { this.audio.lever(); this.ui.say('You pull MAIN. The whole house goes dark around you.'); }
      }
      else { const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].indexOf(code); if (i >= 0) { this.grid.toggleBreaker(['hall', 'ground', 'east', 'west', 'attic', 'cellar'][i]); this.audio.clunk(); } }
      return;
    }
    if (ui.mode === 'estate') {
      if (code === 'KeyE' || code === 'Escape') ui.close();
      else if (code === 'KeyA') this.setEstateAll(!this.estateGroups.every(([k]) => this.estateGroupOn(k)));
      else { const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'].indexOf(code); if (i >= 0 && i < this.estateGroups.length) this.toggleEstate(this.estateGroups[i][0]); }
      return;
    }
    if (ui.mode === 'lights') {
      if (code === 'Tab' || code === 'Escape' || code === 'KeyL') ui.close();
      else if (code === 'ArrowUp' || code === 'KeyW') ui.moveLightsSel(-1);
      else if (code === 'ArrowDown' || code === 'KeyS') ui.moveLightsSel(1);
      else if (code === 'Enter' || code === 'Space' || code === 'KeyE') ui.toggleLightsSel();
      else if (code === 'KeyO') { this.masterOutside(); ui.lightsT = 0; }
      else if (code === 'KeyI') { this.masterInside(); ui.lightsT = 0; }
      else { const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'].indexOf(code); if (i >= 0 && this.estateGroups[i]) this.toggleEstate(this.estateGroups[i][0]); }
      return;
    }
    if (code === 'Tab' && !ui.mode) { ui.openLights(); return; }
    if (code === 'Escape' && !ui.mode && this.menu) { this.menu.pause(); return; }
    if (code === 'KeyP') { ui.phone(); return; }
    if (code === 'KeyL') { ui.lightsVisible = !ui.lightsVisible; ui.lightsT = 0; return; }
    if (code === 'KeyO' && !ui.mode) { this.masterOutside(); ui.lightsT = 0; return; }
    if (code === 'KeyI' && !ui.mode) { this.masterInside(); ui.lightsT = 0; return; }
    { const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'].indexOf(code);
      if (i >= 0 && !ui.mode && this.estateGroups[i]) { this.toggleEstate(this.estateGroups[i][0]); ui.lightsT = 0; return; } }
    if (ui.mode === 'phone' && (code === 'Escape' || code === 'KeyE')) { ui.close(); return; }
    if (code === 'KeyT') { this.player.torch = !this.player.torch; this.audio.click(); }
    if (code === 'KeyE') this.interact();
    if (code === 'Space' && this.player.grounded && !this.climbing) { this.player.vy = 4.3; this.player.grounded = false; }
  }
  keyUp(code) { this.keys[code] = false; }
  begin() {
    if (BM.Save) BM.Save.clear();
    this.ui.mode = null;
    if (this.ui.el.title) this.ui.el.title.style.display = 'none';
    this.audio.start();
    this.intro = new BM.Intro(this); // your car arrives; when it dies, you walk
    if (this.menu) this.menu.lock();
  }

  /* Go back to a saved night: the arrival is skipped and the world is put back as it was. */
  continueGame() {
    const s = BM.Save && BM.Save.read(); if (!s) { this.begin(); return; }
    this.ui.mode = null;
    if (this.ui.el.title) this.ui.el.title.style.display = 'none';
    this.audio.start();
    this.intro = new BM.Intro(this); this.intro.skip();
    BM.Save.restore(this, s);
    this.ui.say('You pick up where you left off.', 3);
    if (this.menu) this.menu.lock();
  }

  /* -------------------------------------------------------- update ---- */
  update(dt) {
    this.time += dt; this.clock += dt;
    const p = this.player;
    const frozen = this.ui.mode === 'read' || this.ui.mode === 'fuse' || this.ui.mode === 'estate' || this.ui.mode === 'lights' || this.ui.mode === 'title' || this.ui.mode === 'ending';
    if (this.intro) this.intro.update(dt);
    else if (this.outro) this.updateOutro(dt);
    else if (this.climbing) this.updateClimb(dt);
    else if (!frozen && !this.busy) this.updatePlayer(dt);
    this.updateDoors(dt);
    this.updateStorm(dt);
    if (this.clock_) { this.clock_.update(dt); this.clock_.tickHammers(); }
    if (this.car && this.car.parked && this.time < 90) this.carSmoulder(dt);
    this.grid.origin = this.player;
    this.grid.update(dt);
    this.updateDucks(dt);
    const camPos = { x: p.x, y: p.y + BM.PLAYER.eye, z: p.z };
    const ctx = { camPos, zone: this.zoneAt(p.x, p.y, p.z), visibleZones: this.visibleZones(p.y) };
    this.ctx = ctx;
    for (const z in this.B.zones) this.B.zones[z].visible = ctx.visibleZones[z];
    this.fx.update(dt, ctx);
    this.audio.update(dt, ctx);
    this.ui.update(dt);
    this.updateCamera();
    // prompt
    if (!frozen && !this.climbing && !this.intro && !this.outro) {
      const it = this.pick();
      const label = it ? this.labelOf(it) : '';
      this.currentPick = it;
      this.ui.setPrompt(label ? 'E — ' + label : '');
    } else this.ui.setPrompt('');
    if (this.ui.mode !== 'title') this.ui.setObjective(this.objective());
  }

  updatePlayer(dt) {
    const p = this.player, k = this.keys, phys = this.phys;
    // the arrow keys turn; the mouse looks; A and D step to the side
    const turn = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
    p.yaw += turn * 1.9 * dt;
    if (k.KeyR) p.pitch = Math.min(1.25, p.pitch + dt * 1.2);
    if (k.KeyF) p.pitch = Math.max(-1.25, p.pitch - dt * 1.2);
    if (!k.KeyR && !k.KeyF && !this.mouseLook) p.pitch *= Math.max(0, 1 - dt * 2);
    const fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 0.6 : 0);
    const side = (k.KeyD ? 0.8 : 0) - (k.KeyA ? 0.8 : 0);
    const running = (k.ShiftLeft || k.ShiftRight) && fwd > 0;
    const speed = running ? 5.2 : 2.8;
    const f = this.forward(), rx = -f.z, rz = f.x;
    const y0 = p.y;
    if (fwd !== 0 || side !== 0) {
      let mx = f.x * fwd + rx * side, mz = f.z * fwd + rz * side; const ml = Math.hypot(mx, mz), amt = Math.max(Math.abs(fwd), Math.abs(side));
      mx = mx / ml * amt; mz = mz / ml * amt;
      const hit = phys.move(p, mx * speed * dt, mz * speed * dt);
      p.bob += dt * (running ? 12 : 8); p.stepAcc += amt * speed * dt;
      if (p.stepAcc > (running ? 1.1 : 0.75) && p.grounded) { p.stepAcc = 0; this.audio.step(this.surfaceAt(p)); }
    }
    // vertical
    const sup = phys.support(p.x, p.z, Math.max(p.y, y0));
    if (p.grounded && p.vy <= 0 && sup <= p.y + 0.01 && sup >= p.y - 0.55) { p.y = sup; p.vy = 0; }
    else {
      p.vy -= 18 * dt;
      const prevY = p.y;
      p.y += p.vy * dt;
      const s2 = phys.support(p.x, p.z, prevY);
      if (p.y <= s2) { p.y = s2; if (p.vy < -7) this.audio.step('stone'); p.vy = 0; p.grounded = true; }
      else p.grounded = false;
    }
    if (p.grounded && phys.depenetrate(p)) this.unstuck = (this.unstuck || 0) + 1;
    if (p.grounded) {
      const z = this.zoneAt(p.x, p.y, p.z);
      if (!phys.blocked(p.x, p.z, p.y)) { p.safe.x = p.x; p.safe.y = p.y; p.safe.z = p.z; p.safe.zone = z; }
    }
    if (p.y < -80) { p.x = p.safe.x; p.y = p.safe.y; p.z = p.safe.z; p.vy = 0; }
  }
  surfaceAt(p) {
    const z = this.zoneAt(p.x, p.y, p.z);
    if (z === 'house') return p.y < -1 ? 'stone' : 'wood';
    if (Math.abs(p.x) < 3.2 && p.z > 30) return 'gravel';
    return 'grass';
  }
  updateClimb(dt) {
    const c = this.climbing, p = this.player;
    c.t += dt;
    const dur = this.headless ? 0.01 : 1.2;
    this.ui.fade(Math.min(0.85, Math.sin(Math.min(1, c.t / dur) * Math.PI)));
    if (!c.moved && c.t >= dur / 2) { c.moved = true; p.x = c.dest.x; p.y = c.dest.y; p.z = c.dest.z; p.yaw = c.yaw; p.vy = 0; p.grounded = true; p.safe = { x: p.x, y: p.y, z: p.z }; }
    if (c.t >= dur) { this.climbing = null; this.ui.fade(0); }
  }
  updateDoors(dt) {
    const g = this.gates, p = this.player;
    if (g.open && g.t < 1) {
      // bolts first, then a slow inward swing that drags and catches on the hinges
      g.wait = (g.wait || 0) + dt;
      if (g.wait > GATE.delay) g.t = Math.min(1, g.t + dt / (g.swing || GATE.swing));
      const e = (1 - Math.cos(g.t * Math.PI)) / 2, a = (e + Math.sin(g.t * Math.PI * 7) * 0.012 * (1 - g.t)) * 1.65;
      g.leaves[0].rotation.y = a; g.leaves[1].rotation.y = -a;
      if (g.t > 0.45) g.wall.enabled = false;
      if (g.escaping && g.t >= 1 && !g.saidOpen) { g.saidOpen = true; this.ui.say('The motor stops. Out at the lane, the gates stand wide.', 5); }
    }
    // the contact in the drive: once you are inside, the gates swing shut behind you and bolt
    if (g.open && g.t >= 1 && !g.lockedIn && !g.closing && !g.escaping && !this.story.ended && p.z < 85 && p.z > 70 && Math.abs(p.x) < 3.5) {
      g.closing = true; g.closeT = 0; g.closeWait = 0;
      this.audio.click();
      this.audio.gateCreak(0.6, GATE.close, Math.max(0.4, 1 - Math.hypot(p.x, p.z - 88) / 40));
      this.ui.say('Something clicks under your foot. Behind you, with a long creak, the gates begin to swing shut.', 6);
    }
    if (g.closing) {
      g.closeWait += dt;
      if (g.closeWait > 0.6) g.closeT = Math.min(1, g.closeT + dt / GATE.close);
      const u = g.closeT, e = 1 - (1 - Math.cos(u * Math.PI)) / 2, a = (e + Math.sin(u * Math.PI * 9) * 0.01 * u) * 1.65;
      g.leaves[0].rotation.y = a; g.leaves[1].rotation.y = -a;
      // the leaves become solid again once they are mostly shut, unless you are standing in the gap
      if (u > 0.55 && !g.wall.enabled && !(Math.abs(p.z - 88) < 1.2 && Math.abs(p.x) < 3.8)) g.wall.enabled = true;
      if (u >= 1) {
        g.closing = false; g.open = false; g.t = 0; g.wall.enabled = true;
        this.audio.gateBang(Math.max(0.35, 1 - Math.hypot(p.x, p.z - 88) / 60));
        if (g.lodgeLocked) { g.lodgeLocked = false; this.ui.say('They meet with a bang, and the bolt drops. Locked, from the lodge.', 4); }
        else { g.lockedIn = true; this.ui.say('They meet with a bang that goes away down the lane — and a bolt shoots home. Locked. From the house side.', 7); }
      }
    }
    this.updateHingedDoors(dt);
    BM.updateWindows(this, dt);
    BM.updateGateMonitor(this, dt);
    BM.updateOvergrown(this, dt, this.time);
    BM.updateShutters(this, dt, this.time);
    BM.updateLift(this, dt);
    BM.updateLongcase(this, dt);
    BM.updateSave(this, dt);
    BM.updateGlimpses(this, dt);
    BM.updateChapel(this, dt, this.time);
    BM.updateMausoleum(this, dt, this.time);
    BM.updateSearchlights(this, dt, this.time);
    BM.updateGroundsLights(this, dt, this.time);
    const sd = this.stormDoors;
    if (sd) {
      sd.boltT += ((sd.bolted ? 0 : 1) - sd.boltT) * Math.min(1, dt * 5); sd.bolt.position.x = -12 - 0.3 * sd.boltT;
      if (sd.moving) {
        sd.t = Math.max(0, Math.min(1, sd.t + (sd.target > sd.t ? 1 : -1) * dt / 2.2));
        const a = (1 - Math.cos(sd.t * Math.PI)) / 2 * 2.3;
        for (const l of sd.leaves) l.pivot.rotation.z = l.side * -a;
        if (sd.t > 0.25 && sd.wall.enabled) sd.wall.enabled = false;
        if (sd.target && sd.t >= 1) { sd.moving = false; sd.open = true; }
        if (!sd.target && sd.t <= 0) { sd.moving = false; sd.open = false; sd.wall.enabled = true; }
      }
    }
    if (this.busy) { this.busy.t += dt; if (this.busy.t >= this.busy.dur) { const b = this.busy; this.busy = null; b.done(); } }
    const gb = this.gateBox;
    if (gb) {
      gb.t += ((gb.open ? 1 : 0) - gb.t) * Math.min(1, dt * 6); gb.door.rotation.y = -gb.t * 1.9;
      const down = g.open || (g.closing && !g.lodgeLocked) || g.escaping;
      gb.leverT += ((down ? 1 : 0) - gb.leverT) * Math.min(1, dt * 8); gb.lever.rotation.z = -gb.leverT * 2.6;
    }
  }
  /* ---- the way out: you stop on the lane and look back, and the house goes dark one light at a time ---- */
  /* Sash windows slide up; curtains draw along their poles. */
  toggleWindow(w) {
    w.open = !w.open;
    if (w.open) { this.openWindows.push(w); this.audio.sash && this.audio.sash(true); this.ui.say('The sash goes up, stiff in its runners. Cold air, and the rain is suddenly loud.', 3); }
    else { this.openWindows = this.openWindows.filter(x => x !== w); this.audio.sash && this.audio.sash(false); this.ui.say('You pull the sash down.', 2); }
  }
  toggleCurtains(w) {
    const c = w.curtains; if (!c) return;
    c.drawn = !c.drawn; c.target = c.drawn ? 1 : 0;
    this.audio.curtains && this.audio.curtains();
    this.ui.say(c.drawn ? 'The rings chatter along the pole and the room goes dim.' : 'The curtains come back in two heavy sweeps, and dust comes off them. The window is a black mirror.', 3);
  }
  /* The spare goes on: the jack, the nuts, the wheel. */
  changeWheel() {
    if (this.carry !== 'spare wheel' || this.busy) return;
    this.carry = null; this.spare.fitted = true;
    this.busy = { t: 0, dur: this.headless ? 0.05 : 9, done: () => {
      this.car.flat = false; this.car.setFlat(0);
      this.ui.say('Last nut tight, jack down. The car sits level again.' + (this.battery.fitted ? ' Now the key.' : ' It still needs a battery.'), 5);
      if (this.battery.fitted) this.startOutro();
    } };
    this.audio.wheelChange && this.audio.wheelChange(this.busy.dur);
    this.ui.say('Jack under the sill, wind it up. The flat comes off, the spare goes on, one nut at a time.', 6);
  }
  /* The battery goes in; if the wheel is on too, the car starts, and you drive: the end. */
  fitBattery() {
    if (this.carry !== 'battery' || this.outro || this.busy) return;
    this.carry = null; this.battery.carried = false; this.battery.fitted = true;
    this.audio.clunk(0.9); this.audio.burst(this.audio.white, 'bandpass', 2000, 3, 0.2, 0.002, 0.15, 0.4);
    if (this.car.flat) { this.ui.say('The clamps go on and the dash lights come up. But it is not going anywhere on that tyre.', 5); return; }
    this.ui.say('The clamps go on. You get in out of the rain, and turn the key.', 4);
    this.startOutro();
  }
  /* The storm doors over the cellar steps: bolted from inside until you draw the bolt. */
  stormBolt() {
    const sd = this.stormDoors; if (sd.open) return;
    sd.bolted = !sd.bolted; this.audio.stormBolt && this.audio.stormBolt(sd.bolted);
    this.ui.say(sd.bolted ? 'You shoot the bolt home.' : 'Stiff with rust, but it goes: the bolt draws back with a shriek. Push the doors up.', 4);
  }
  stormDoorsToggle() {
    const sd = this.stormDoors;
    if (sd.bolted) { this.audio.rattle(); this.ui.say('Steel, and bolted from the inside. They do not give at all.', 4); return; }
    if (sd.moving) return;
    sd.moving = true; sd.target = sd.open ? 0 : 1;
    this.audio.stormDoors && this.audio.stormDoors(!sd.open);
    this.ui.say(sd.open ? 'You haul the doors down. They meet with a clang.' : 'The doors go up on their hinges and fall open on the setts with a clang. Rain comes in down the steps.', 4);
  }
  /* The lift: call it to your floor, or ride it to another. */
  liftCall(i) {
    const L = this.lift;
    if (!this.grid.live('main')) { this.audio.click(); this.ui.say('The button sinks with a click. Nothing: the lift runs on the house supply.'); return; }
    this.audio.click();
    if (L.phase !== 'idle') { this.ui.say('Somewhere in the shaft the lift is already moving.'); return; }
    if (L.at === i) { if (L.gate[i] < 0.5) { L.phase = 'opening'; L.t = 0; } this.ui.say('The lift is here. The gate folds back.'); return; }
    L.to = i; L.rideWith = false; L.phase = 'closing'; L.t = 0;
    this.ui.say('A clank deep in the house, and the hum of a motor. The needle over the gate begins to creep round.', 4);
  }
  liftPress(i, k) {
    const L = this.lift, F = BM.LIFT_FLOORS;
    this.audio.click();
    if (!this.grid.live('main')) { this.ui.say('The button goes in and stays in. No power: the lift runs on the house supply.'); return; }
    if (L.phase !== 'idle') return;
    if (k === i) { this.ui.say('You are on the ' + F[k].name.toLowerCase() + ' already.'); return; }
    L.to = k; L.rideWith = BM.inLift(this, i); L.phase = 'closing'; L.t = 0;
    this.ui.say(k === 3 ? 'The gate rattles shut. The car lurches, and climbs into the roof.' : k === 0 ? 'The gate rattles shut, and the car sinks, slow, into the cold.' : 'The gate rattles shut and the car shudders into motion.', 4);
  }
  toggleGarageDoor() {
    const gd = this.garageDoor; if (gd.moving) return;
    gd.open = !gd.open; gd.moving = true;
    this.audio.stormDoors ? this.audio.rattle() : this.audio.click();
    this.ui.say(gd.open ? 'You heave the handle. The springs take it, and the door swings up into the roof with a shriek of runners.' : 'You reach up for the handle and pull. The door comes down on its springs and shuts with a bang.', 4);
  }
  startOutro() {
    const p = this.player, car = this.car, c = car.group.position;
    this.outro = { t: 0, step: 0, car: true, radio: 0, engine: 0, rev: 1, x: c.x, z: c.z, yaw: -Math.PI / 2 };
    this.carWall.enabled = false; car.setCabin(true);
    const e = car.eye(); p.x = e.x; p.z = e.z; p.y = e.y - BM.PLAYER.eye; p.pitch = -0.06; p.yaw = -Math.PI / 2;
  }
  updateOutro(dt) {
    const o = this.outro, p = this.player, g = this.grid, car = this.car;
    o.t += dt;
    const t = o.t;
    // the dash wakes, the engine turns over and catches, the headlights come up, the radio comes back
    const dash = Math.min(1, t / 1.5);
    Object.assign(car.dashState, { engine: t < 2.5, battery: t < 2.5, tpms: false, flicker: false, speed: 0, rpm: o.engine > 0.05 ? 0.8 + (o.rev - 0.8) * 2 : 0 });
    car.radioState.t = t; car.radioState.crackle = false; car.radioState.level = dash;
    if (t > 1.0 && !o.cranked) { o.cranked = true; this.audio.crank && this.audio.crank(); }
    o.engine = t < 1.0 ? 0 : t < 2.6 ? 0.08 : Math.min(0.2, 0.1 + (t - 2.6) * 0.03);
    o.rev = t < 2.6 ? 0.5 + 0.3 * Math.sin(t * 20) : 0.8 + Math.min(1, Math.max(0, t - 6) / 8) * 0.7;
    if (t > 2.6 && !o.said1) { o.said1 = true; this.ui.say('It catches. The heater, the lights, the wipers. And the radio, halfway through the same song.', 5); }
    const head = Math.min(1, Math.max(0, (t - 2.0) / 2));
    o.radio = Math.min(0.05, Math.max(0, (t - 2.6) / 3) * 0.05);
    // turn in the lane and drive west, away from the gates
    const turn = Math.min(1, Math.max(0, (t - 5) / 4)), drive = Math.max(0, t - 9);
    o.yaw = -Math.PI / 2 + turn * turn * (3 - 2 * turn) * Math.PI;
    const speed = Math.min(14, drive * 2.2);
    o.x -= speed * dt * Math.max(0, Math.cos(o.yaw + Math.PI / 2) * -1); // along -x once turned
    if (turn > 0 && turn < 1) { o.z += dt * 0.6; }
    car.group.position.set(o.x, Math.sin(t * 9) * 0.006 * Math.min(1, speed / 3), o.z); car.group.rotation.y = o.yaw;
    car.spin(speed * dt); car.wipe(dt, t > 2.6, t);
    car.dashState.speed = speed * 3.6; car.setDash(dash);
    car.beams.forEach((l, i) => {
      l.corona = 0; l.on = head > 0.02; l.target = 2.6 * head; l.colour = 0xfff0c8; l.flicker = 0; l.lightType = 'steady';
      const w = car.toWorld(i ? 0.62 : -0.62, 0.92, -2.3); l.pos.x = w.x; l.pos.y = w.y; l.pos.z = w.z;
      l.dir = [-Math.sin(o.yaw), -0.12, -Math.cos(o.yaw)];
      this.fx.moveLight(l);
    });
    car.setLamps(head);
    // the driver's seat goes with the car; you look along the nose
    const e = car.eye(); p.x = e.x; p.z = e.z; p.y = e.y - BM.PLAYER.eye;
    p.yaw = o.yaw; p.pitch = -0.06;
    if (t > 9.5 && !o.said2) { o.said2 = true, this.ui.say('The gates go by on the right, open, and the house above them with every window lit. You do not look back at the windows.', 6); }
    // the house goes dark from the top down, then the grounds from the house outwards
    const STEPS = [
      [9.5, () => this.darken(l => l.circuit === 'attic')],
      [10.5, () => this.darken(l => l.circuit === 'west' || l.circuit === 'east')],
      [11.5, () => this.darken(l => l.circuit === 'ground' || l.circuit === 'cellar')],
      [12.5, () => this.darken(l => l.circuit === 'hall')],
      [13.5, () => this.darken(l => l.circuit === 'lodge' && !this.estateLights.drive.includes(l.id) && !this.estateLights.gate.includes(l.id))],
      [14.5, () => this.darken(l => this.estateLights.drive.includes(l.id))],
      [15.5, () => this.darken(l => this.estateLights.gate.includes(l.id))],
    ];
    while (o.step < STEPS.length && o.t >= STEPS[o.step][0]) { STEPS[o.step][1](); this.audio.clunk(0.35); o.step++; }
    if (o.t > 15.5) this.ui.fade(Math.min(1, (o.t - 15.5) / 2.5));
    if (o.t > 18.5) { this.outro = null; this.endGame(); }
  }
  darken(pred) { for (const l of this.grid.lights) if (pred(l)) l.on = false; }
  updateStorm(dt) {
    const p = this.player, g = this.grid;
    const inAttic = p.y > 7.6 && Math.abs(p.x) < 18.5 && Math.abs(p.z) < 12.5;
    if (inAttic && g.live('main') && !g.stormHasTripped && this.stormTimer < 0) this.stormTimer = this.headless ? 0.01 : 2.5;
    if (this.stormTimer >= 0) { this.stormTimer -= dt; if (this.stormTimer < 0) { g.stormTrip(); this.stormTimer = -1; } }
  }
  updateDucks(dt) {
    // the swing and the rocking chair move on their own
    for (const s of this.swings || []) s.pivot.rotation.x = Math.sin(this.time * 1.15 + s.phase) * 0.22 * (0.6 + 0.4 * Math.sin(this.time * 0.13));
    for (const r of this.rockers || []) r.obj.rotation.x = Math.sin(this.time * 1.6) * 0.09;
    for (const d of this.ducks || []) {
      d.a += d.w * dt;
      d.obj.position.set(d.cx + Math.sin(d.a) * d.r, 0.05 + Math.sin(this.time * 2 + d.r) * 0.02, d.cz + Math.cos(d.a) * d.r);
      d.obj.rotation.y = d.a + Math.PI / 2;
    }
  }
  updateCamera() {
    const p = this.player, c = this.camera;
    const bob = p.grounded ? Math.sin(p.bob) * 0.025 : 0;
    c.position.set(p.x, p.y + BM.PLAYER.eye + bob, p.z);
    c.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
    c.updateMatrixWorld();
  }

  render() {
    const r = this.renderer;
    r.info.reset();
    const s = this.fx.quality;
    this.shadowFrame = (this.shadowFrame || 0) + 1;
    r.shadowMap.needsUpdate = this.player.torch && s.shadowEvery > 0 && this.shadowFrame % s.shadowEvery === 0;
    const p = this.player;
    this.fx.renderMirrors(r, this.roomAt(p.x, p.y, p.z) === 'library');
    // details too far away to matter are not drawn; a jump of more than a few metres updates all of them at once
    const cp = this.camera.getWorldPosition(this._camP || (this._camP = new THREE.Vector3()));
    if (!this._lastCam || this._lastCam.distanceToSquared(cp) > 16) { BM.cullDetailsAll(this, cp); this._lastCam = (this._lastCam || new THREE.Vector3()).copy(cp); }
    else BM.cullDetails(this, cp);
    if (this._lastCam.distanceToSquared(cp) > 4) this._lastCam.copy(cp);
    r.render(this.scene, this.camera);
    this.lastDrawCalls = r.info.render.calls;
    return this.lastDrawCalls;
  }

  /* One guarded frame: one bad frame cannot freeze the game. */
  frame(dt, rawMs) {
    const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    try {
      if (this.ui.mode !== 'pause') this.update(Math.min(0.05, dt));
      if (this.menu) this.menu.update(dt);
      this.render();
    } catch (e) {
      this.frameErrors++;
      this.lastError = e;
      if (this.frameErrors < 5 && typeof console !== 'undefined') console.error(e);
    }
    if (rawMs !== undefined) {
      // a vsync'd frame always takes a whole refresh period, so judge the work inside it
      const work = t0 ? performance.now() - t0 : rawMs;
      this.quality.sample(this.opts.sampleRaw ? rawMs : Math.min(rawMs, work));
      if (!this.quality.fixed) this.quality.update(dt);
    }
  }

  resize(W, H) { this.camera.aspect = W / H; this.camera.updateProjectionMatrix(); this.renderer.setSize(W, H); }

  /* ---- helpers for the test harness ---- */
  teleport(x, y, z, yaw) { const p = this.player; p.x = x; p.y = y; p.z = z; if (yaw !== undefined) p.yaw = yaw; p.vy = 0; p.grounded = true; this.updateCamera(); }
  standAt(it) { this.teleport(it.approach.x, it.approach.y, it.approach.z, Math.atan2(it.n.x, it.n.z)); }
}
BM.Game = Game;

/* --------------------------------------------------------------- boot ---- */
/* Tell the player plainly when the browser cannot run the game, instead of a black screen. */
BM.showFatal = function (title, body) {
  const t = document.getElementById('title');
  if (t) { t.style.display = 'flex'; t.innerHTML = '<h1>BLACKTHORN MANOR</h1><p style="opacity:.9">' + title + '</p><p>' + body + '</p>'; }
};
BM.boot = function (opts) {
  const game = new Game(opts);
  try { game.init(document.getElementById('view')); }
  catch (e) {
    BM.showFatal('This browser could not start the 3D view.', 'Blackthorn Manor needs WebGL. Try the latest Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is switched on in the browser settings.');
    if (typeof console !== 'undefined') console.error(e);
    return null;
  }
  // switching away pauses the night; a lost graphics context asks for a reload
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.menu) game.menu.pause(); });
  game.renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); BM.showFatal('The graphics driver reset.', 'Your progress is saved every few seconds. Reload the page and choose Continue.'); });
  BM.game = game;
  game.ui.mode = 'title';
  window.addEventListener('keydown', e => { if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].indexOf(e.code) >= 0) e.preventDefault(); if (!e.repeat) game.keyDown(e.code); if (game.ui.mode !== 'title') game.audio.start(); });
  window.addEventListener('pointerdown', () => { if (game.ui.mode !== 'title') game.audio.start(); });
  window.addEventListener('keyup', e => game.keyUp(e.code));
  window.addEventListener('blur', () => { game.keys = {}; });
  window.addEventListener('resize', () => game.resize(window.innerWidth, window.innerHeight));
  const title = document.getElementById('title');
  if (title) {
    // a saved night: Continue, or a new one; otherwise a click anywhere begins
    const keys = title.querySelector('.keys'), saved = BM.Save && BM.Save.has();
    if (saved) {
      const b = document.createElement('div'); b.className = 'title-btns';
      b.innerHTML = '<button id="t-continue">Continue</button><button id="t-new">New game</button>';
      title.appendChild(b);
      document.getElementById('t-continue').addEventListener('click', e => { e.stopPropagation(); game.continueGame(); });
      document.getElementById('t-new').addEventListener('click', e => { e.stopPropagation(); if (window.confirm('Start a new night? The saved one will be lost.')) game.begin(); });
      if (keys) keys.innerHTML = keys.innerHTML.replace('Click to begin', 'Enter to continue · N for a new game');
    } else title.addEventListener('click', () => game.begin());
  }
  let last = performance.now();
  const loop = (now) => {
    const raw = now - last; last = now;
    game.frame(raw / 1000, raw);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return game;
};
if (!window.__BM_NO_AUTOSTART__) window.addEventListener('load', () => BM.boot({}));
})();
