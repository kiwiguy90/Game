'use strict';
/*
 * Blackthorn Manor test suites. Run: node tests/run.js [suite ...]
 * Every suite loads the real game from blackthorn-manor.html via the harness.
 */
const H = require('./harness');

const suites = {};
const suite = (name, fn) => { suites[name] = fn; };
class Fail extends Error {}
const assert = (cond, msg) => { if (!cond) throw new Fail(msg); };
const near = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-6);

/* ------------------------------------------------------------ helpers -- */
const LEVELS = { ground: 0, upper: 4.2, attic: 8.2, cellar: -3.2, hiveA: -30, hiveB: -38, hiveC: -46 };

function openEverything(game) {
  const g = game.grid;
  g.setLodge(true); game.openGates(); game.openFrontDoors(); g.throwMain();
  game.story.journalRead = true; game.tryBlastDoor();
  g.startGenerator(); g.route('lifts', true); g.route('security', true); g.route('security', false); g.route('core', true);
  for (let i = 0; i < 400; i++) game.updateDoors(1 / 30);
  game.fx.updateAppliances(0, 0);
}

function linkMap(game) {
  // approach cells that carry links (ladders, lifts) — only usable ones
  return game.interactables.filter(it => it.links);
}
function flood(game, seeds, opts) {
  const withLinks = linkMap(game);
  return game.phys.flood(seeds, Object.assign({
    links: (n) => {
      if (!(opts && opts.useLinks)) return [];
      const out = [];
      for (const it of withLinks) {
        if (it.requires && !it.requires()) continue;
        if (Math.abs(n.x - it.approach.x) < 0.3 && Math.abs(n.z - it.approach.z) < 0.3 && Math.abs(n.y - it.approach.y) < 0.6) out.push(...it.links);
      }
      return out;
    },
  }, opts || {}));
}
const atApproach = (it) => (n) => Math.abs(n.x - it.approach.x) <= 0.3 && Math.abs(n.z - it.approach.z) <= 0.3 && Math.abs(n.y - it.approach.y) < 0.6;

/* Walk (by flood) from where the player is to an interactable, then use it. */
function go(env, id, opts) {
  const game = env.game, it = game.byId[id];
  assert(it, 'no interactable ' + id);
  const p = game.player;
  const r = flood(game, [{ x: p.x, y: p.y, z: p.z }], { until: atApproach(it), maxNodes: 600000 });
  assert(r.found, `cannot walk from (${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}) to ${id}`);
  game.standAt(it);
  const picked = game.pick();
  assert(picked === it, `standing at ${id}, picked ${picked && picked.id}`);
  if (!(opts && opts.noUse)) game.interact();
  return it;
}
function canWalk(env, id) {
  const game = env.game, it = game.byId[id], p = game.player;
  return !!flood(game, [{ x: p.x, y: p.y, z: p.z }], { until: atApproach(it), maxNodes: 600000 }).found;
}
function settle(env, secs) { env.tick(Math.round(secs * 30), 1 / 30); }

function segBox(a, b, w) {
  let t0 = 0, t1 = 1;
  for (const [o, d, lo, hi] of [[a.x, b.x - a.x, w.x0, w.x1], [a.y, b.y - a.y, w.y0, w.y1], [a.z, b.z - a.z, w.z0, w.z1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return false; continue; }
    let ta = (lo - o) / d, tb = (hi - o) / d; if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return false;
  }
  return true;
}
/* Lights come on one at a time down each chain: wait until every one that has supply is up (or blown). */
function settleLights(env, max) {
  const g = env.game.grid, busy = () => g.lights.some(l => l.waiting || (l.powered && l.seq && !g.instant(l)));
  let t = 0; env.game.update(1 / 30);
  while (busy() && t < (max || 180)) { settle(env, 0.25); t += 0.25; }
  settle(env, 0.1);
  return t;
}

/* -------------------------------------------------------------- suites -- */
suite('builds', () => {
  const env = H.load({ quiet: true });
  const { game, BM, THREE } = env;
  assert(THREE.REVISION === '128', 'Three.js must be r128, got ' + THREE.REVISION);
  for (const s of env.scripts) assert(s.code.length > 0, 'empty script ' + s.id);
  assert(!/<(script|link|img)[^>]+(src|href)=["']?https?:/i.test(env.html), 'the HTML references the network');
  assert(!/@import|url\(\s*["']?https?:/i.test(env.html.replace(/<script[\s\S]*?<\/script>/g, '')), 'CSS references the network');
  const lightsBefore = game.scene.children.filter(o => o.isLight).length + 1; // + the torch on the camera
  env.step(240);
  assert(game.frameErrors === 0, 'frame errors: ' + (game.lastError && game.lastError.stack));
  assert(env.networkCalls.length === 0, 'network calls made: ' + JSON.stringify(env.networkCalls));
  assert(game.phys.windows.filter(w => w.zone === 'mansion').length === 27, '27 mansion windows, got ' + game.phys.windows.filter(w => w.zone === 'mansion').length);
  assert(BM.POOL.points === 8 && BM.POOL.spots === 2, 'pool must be 8 points + 2 spots');
  assert(game.fx.points.length === 8 && game.fx.spots.length === 2, 'pool built wrong');
  assert(!game.player.torch, 'the torch starts OFF');
  // power everything and run: the light count never changes at runtime
  openEverything(game);
  env.step(300);
  const lightsAfter = game.scene.children.filter(o => o.isLight).length + 1;
  assert(lightsBefore === lightsAfter, `light count changed ${lightsBefore} -> ${lightsAfter}`);
  assert(game.frameErrors === 0, 'frame errors after power-up');
  // levels exist where the spec puts them
  for (const [name, y] of Object.entries(LEVELS)) assert(game.phys.surfaces.some(s => s.type === 'rect' && near(s.y, y, 0.01)), 'no floor at level ' + name + ' ' + y);
  // two curved staircases rising to the balcony
  const arcs = game.phys.surfaces.filter(s => s.type === 'arc');
  assert(arcs.length === 2 && arcs.every(a => Math.max(a.y0, a.y1) === 4.2 && Math.min(a.y0, a.y1) === 0), 'two curved staircases 0 -> 4.2');
  // the haunted garden: dead trees, yews, willow, grass, crows; swaying parts are instanced
  const hg = game.haunted;
  assert(hg.trees >= 35 && hg.yews >= 3 && hg.clumps >= 300 && hg.crows >= 6, 'haunted planting: ' + JSON.stringify(hg));
  const sway = []; game.scene.traverse(o => { if (o.isInstancedMesh && o.material.userData.sway) sway.push(o.material.name + ':' + o.count); });
  assert(sway.length >= 4, 'swaying instanced vegetation: ' + sway.join(' '));
  // the gothic house: towers and spires, a clock tower, steep roof; the house dressed
  assert(game.towers.length === 4, 'four corner towers');
  let tallest = 0; game.scene.traverse(o => { if (o.isMesh && o.geometry === BM.G.spire) tallest = Math.max(tallest, o.position.y + o.scale.y / 2); if (o.isInstancedMesh && o.geometry === BM.G.spire) { const m = new env.THREE.Matrix4(), p = new env.THREE.Vector3(), q = new env.THREE.Quaternion(), sc = new env.THREE.Vector3(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); m.decompose(p, q, sc); tallest = Math.max(tallest, p.y + sc.y / 2); } } });
  assert(tallest > 35, 'the spires rise over 35 m (' + tallest.toFixed(1) + ')');
  assert(game.dressing.webs > 60, 'cobwebs in the rooms');
  assert(['grandfather clock', 'suit of armour', 'piano', 'rocking chair'].every(t => game.phys.furniture.some(f => f.tag === t)), 'the house is dressed');
  // audio is synthesised: no buffers loaded from files, sources created
  assert(env.audioLog.contexts === 1 && env.audioLog.sources > 0, 'web audio synth not started');
  return `${game.grid.lights.length} light records, ${game.interactables.length} interactables, ${game.phys.walls.length} colliders`;
});

suite('circuits', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env, g = game.grid;
  g.failureRate = 0; // deterministic model checks; failures are tested on their own below
  const house = g.lights.filter(l => g.isHouseCircuit(l.circuit));
  const lit = (id) => g.light(id).powered && g.light(id).intensity > 0;
  // nothing works until the lodge
  assert(!g.live('hall') && !g.live('main') && !BM.HOUSE_CIRCUITS.some(c => g.live(c)), 'house live before lodge');
  assert(g.throwMain() === false && !g.live('main'), 'MAIN must not work without the lodge');
  for (const id of game.hallLights) g.light(id).on = true;
  settle(env, 3);
  assert(house.every(l => !l.powered), 'fittings powered without the lodge');
  for (const id of game.hallLights) g.light(id).on = false;
  // street lights are council supply: on from the start, one faulty
  const street = g.lights.filter(l => l.circuit === 'street');
  assert(street.length === 3 && street.every(l => !l.powered && !l.on) && street.filter(l => l.flicker > 0).length === 1, 'three street lights, off at the start, one faulty');
  settle(env, 1);
  // dark, except one candle someone has left burning in a gable window
  assert(g.lights.filter(l => l.circuit !== 'battery' && l.id !== 'gable-candle').every(l => !l.powered), 'the whole estate starts dark');
  assert(g.light('gable-candle').powered, 'the candle in the gable window is burning');
  // lodge on: hall is live immediately, everything else waits for MAIN
  g.setLodge(true);
  assert(g.live('hall') && !g.live('main') && ['ground', 'east', 'west', 'attic', 'cellar'].every(c => !g.live(c)), 'hall live, rest waiting for main');
  assert(lit('lodge-lamp') || (settle(env, 3), lit('lodge-lamp')), 'lodge lamp on lodge supply');
  // the estate lighting panel in the lodge: every outdoor group
  const est = game.estateLights;
  g.setLodge(true);
  const groups = ['street', 'gate', 'flood', 'drive', 'garden', 'pool', 'pond', 'garage', 'shed', 'cemetery'];
  assert(groups.every(k => est[k] && est[k].length >= 2), 'every estate group has lamps');
  const all = groups.flatMap(k => est[k]).map(id => g.light(id));
  assert(all.every(l => !l.on), 'every estate light starts off');
  assert(all.filter(l => l.circuit !== 'street').every(l => l.circuit === 'lodge'), 'estate lights on the lodge supply');
  game.standAt(game.byId['lodge-lighting']); assert(game.pick() === game.byId['lodge-lighting'], 'lighting panel selectable');
  game.interact(); assert(game.ui.mode === 'estate', 'lighting panel opens');
  game.keyDown('Digit1'); settleLights(env);
  assert(est.street.every(id => g.light(id).powered), 'street lighting switched on from the lodge');
  game.keyDown('Digit3');
  assert(est.street.every(id => g.light(id).on) && est.flood.every(id => g.light(id).on) && !game.estateGroupOn('pool'), 'groups switch independently');
  game.keyDown('KeyA'); game.keyDown('KeyE');
  settleLights(env);
  assert(all.filter(l => !l.dead).every(l => l.powered && l.intensity > 0), 'every estate light on with A');
  g.setLodge(false); g.update(1 / 60);
  assert(all.filter(l => l.circuit === 'lodge').every(l => !l.powered), 'lodge-fed lights go off with the lodge main');
  g.setLodge(true);
  // the hall panel: fittings start off; incandescent: two false starts then holds
  assert(game.hallLights.every(id => !g.light(id).on), 'hall fittings start switched off');
  game.toggleFittings(game.hallLights);
  // the hall's fittings come on one after another: follow the first to start
  const trace = [];
  g.update(1 / 60);
  const chand = game.hallLights.map(id => g.light(id)).find(l => l.powered);
  assert(chand && game.hallLights.filter(id => g.light(id).powered).length === 1, 'one hall fitting starts at a time');
  trace.push(chand.fraction > 0.3 ? 1 : 0);
  const frac = [], lvl = [];
  for (let i = 0; i < 300; i++) { g.update(1 / 60); trace.push(chand.fraction > 0.3 ? 1 : 0); frac.push(chand.fraction); lvl.push(chand.intensity / chand.target); }
  let onRuns = 0; for (let i = 0; i < trace.length; i++) if (trace[i] && !trace[i - 1]) onRuns++;
  assert(onRuns === 3 && trace[trace.length - 1] === 1, `incandescent: two false starts then hold (saw ${onRuns} on-runs)`);
  // ...and it warms up slowly and unsteadily rather than snapping on
  assert(frac[110] > 0 && frac[110] < 0.8 && frac[299] === 1, 'incandescent warms up slowly to full brightness');
  const warm = lvl.filter((v, i) => frac[i] > 0.25 && frac[i] < 0.95);
  assert(warm.length > 20 && Math.max(...warm) - Math.min(...warm) > 0.1, 'the warm-up flickers');
  settleLights(env);
  // one hall sconce flares, bangs and dies permanently with a scorch mark
  const bang = g.light('hall-sconce-e1');
  assert(bang.dead && bang.scorched, 'the bang sconce died with a scorch');
  assert(game.events.log.includes('light:bang'), 'bang event');
  const deadAll = g.lights.filter(l => l.dead);
  assert(deadAll.length >= 6, 'several fittings are simply dead (' + deadAll.length + ')');
  // MAIN: every circuit on and every fitting on by itself
  for (const l of house) if (!l.dead) l.on = false;
  assert(g.throwMain() === true, 'throw main');
  assert(BM.HOUSE_CIRCUITS.every(c => g.live(c)), 'every circuit live after MAIN');
  assert(house.filter(l => !l.dead).every(l => l.on), 'every fitting switched on by MAIN');
  // fluorescent: strobes 9-13 times then holds with a buzz
  const tube = g.light('kitchen-tube');
  tube.flicker = 0;
  let strobes = 0, prev = 0, buzzed = false;
  for (let i = 0; i < 4000 && !tube.buzzing; i++) { g.update(1 / 120); const on = tube.fraction > 0.5 ? 1 : 0; if (on && !prev) strobes++; prev = on; }
  buzzed = tube.buzzing;
  assert(buzzed, 'fluorescent holds with a buzz');
  assert(strobes >= 9 && strobes <= 14, 'fluorescent strobes 9-13 times then holds, saw ' + strobes);
  settleLights(env);
  assert(house.filter(l => !l.dead).every(l => l.powered), 'all live fittings powered');
  assert(deadAll.every(l => !l.powered && l.intensity === 0), 'dead fittings never light');
  // appliances run, then stop where they stand
  const fan = g.appliances.find(a => a.kind === 'fan');
  settle(env, 2);
  assert(g.appliances.filter(a => g.isHouseCircuit(a.circuit) && a.switchedOn).every(a => a.running), 'house appliances left on are running after MAIN');
  assert(g.appliances.filter(a => a.kind === 'radio').length >= 2 && g.appliances.filter(a => a.kind === 'tv').length >= 1 && g.appliances.filter(a => a.kind === 'fan').length >= 2, 'at least two radios, a television, two fans');
  // the storm trips MAIN once, while the player is in the attic; everything dies
  game.teleport(-3.5, 8.2, -3.4, 0);
  const startsBefore = game.events.log.filter(e => e === 'appliance:start').length;
  settle(env, 0.5);
  assert(g.tripped && !g.live('main') && !g.live('hall'), 'storm trip kills everything, hall included');
  assert(house.every(l => !l.powered), 'every house fitting dark after the trip');
  const frozen = fan.angle;
  settle(env, 1);
  assert(fan.angle === frozen && !fan.running, 'fan stopped where it stood');
  // ...only once
  g.throwMain();
  settle(env, 1);
  assert(!g.tripped && g.live('main'), 'reset at the board');
  settle(env, 3);
  assert(!g.tripped, 'storm only trips once');
  const startsAfter = game.events.log.filter(e => e === 'appliance:start').length;
  assert(startsAfter > startsBefore, 'appliances came back by themselves (with a clunk)');
  assert(fan.running, 'fan back on');
  // the fire needs no power at all
  for (const c of BM.HOUSE_CIRCUITS) g.setBreaker(c, false);
  g.setLodge(false);
  game.lightFire();
  settle(env, 1);
  assert(game.fire.light.powered && game.fire.light.intensity > 0, 'the fire works with every breaker off');
  // the Hive generator and routing
  assert(!g.route('core', true).ok, 'no routing without the generator');
  assert(g.lights.filter(l => l.circuit === 'battery').every(l => l.powered), 'emergency lighting on battery is always on');
  g.startGenerator();
  assert(g.route('platform', true).ok && g.route('labs', true).ok && g.route('dining', true).ok, 'three sectors');
  const r4 = g.route('core', true);
  assert(!r4.ok && r4.reason === 'capacity' && !g.routed.has('core'), 'a fourth is refused');
  g.route('dining', false);
  assert(!g.coreDoorUnsealed && !g.lasersLive, 'door sealed, lasers off');
  g.route('security', true);
  assert(g.coreDoorUnsealed && g.lasersLive, 'security unseals the door and powers the lasers');
  g.route('security', false);
  assert(g.coreDoorUnsealed && !g.lasersLive, 'door stays open, lasers die when security is cut');
  // old fittings fail: some blow (and stay dead), some lights stay flickering
  {
    const env2 = H.load({ quiet: true }), g2 = env2.game.grid;
    g2.failureRate = 0.35;
    const fails = { exploded: 0, faulty: 0 };
    env2.game.events.on('light:fail', e => fails[e.mode]++);
    g2.setLodge(true); g2.throwMain(); env2.game.setEstateAll(true);
    for (let i = 0; i < 300; i++) g2.update(1 / 30);
    for (let cycle = 0; cycle < 4; cycle++) { g2.setLodge(false); g2.update(1 / 30); g2.setLodge(true); for (let i = 0; i < 300; i++) g2.update(1 / 30); }
    settleLights(env2);
    const blown = g2.lights.filter(l => l.failed === 'exploded'), faulty = g2.lights.filter(l => l.failed === 'faulty');
    assert(fails.exploded > 3 && fails.faulty > 3, `failures happen (${fails.exploded} blown, ${fails.faulty} faulty)`);
    assert(blown.every(l => l.dead && !l.powered && l.intensity === 0), 'blown bulbs stay dead after re-powering');
    assert(faulty.every(l => l.flicker > 0.4 && l.powered), 'faulty fittings stay lit but flickering');
    assert(g2.lights.filter(l => l.circuit === 'battery').every(l => !l.failed), 'battery emergency lamps never fail');
    assert(new Set(g2.lights.map(l => l.failed).filter(Boolean)).size === 2, 'both failure modes');
  }
  // every lit fitting hums; the nearest get the hum voices, loudness follows brightness
  {
    const env3 = H.load({ quiet: true }), gm = env3.game, g3 = gm.grid;
    g3.failureRate = 0;
    gm.teleport(-12, 0, 8, 0); // dining room
    gm.update(1 / 30);
    assert(!gm.audio.humTargets.length, 'no hum with the power off');
    g3.setLodge(true); g3.throwMain();
    for (let i = 0; i < 150; i++) gm.update(1 / 30);
    const h = gm.audio.humTargets;
    assert(h.length > 0 && h.length <= BM.Synth.HUM_VOICES, 'hum voices assigned to lit fittings (' + h.length + ')');
    assert(h[0].light.id === 'dining-pendant' && h[0].gain > 0, 'the nearest lit fitting hums loudest: ' + h[0].light.id);
    for (const t of h) assert(t.light.powered && t.light.intensity > 0, 'only lit fittings hum');
    gm.toggleFittings(['dining-pendant', 'dining-sconce']); gm.update(1 / 30);
    assert(!gm.audio.humTargets.some(t => t.light.id === 'dining-pendant'), 'switched off: no hum');
    const tube = gm.grid.light('kitchen-tube'); gm.teleport(-12, 0, -8, 0); gm.update(1 / 30);
    assert(gm.audio.humTargets.some(t => t.light === tube), 'fluorescent tubes hum');
    const th = gm.audio.humTargets;
    assert(th[0].light === tube, 'in the kitchen the kitchen tube hums loudest, not a light through the floor: ' + th[0].light.id);
    assert(th.filter(t => t.light.level !== 'ground').every(t => t.gain < th[0].gain * 0.3), 'hums through a floor are muffled');
    assert(BM.HUM.fluorescent.freq === 100 && BM.HUM.incandescent.freq === 50, 'mains hum 50 Hz, tubes buzz at 100 Hz');
  }
  // light types all exist
  for (const t of ['steady', 'pulse', 'subtlePulse', 'blink', 'flicker', 'strobe', 'shock', 'interference', 'rotor']) assert(typeof BM.LIGHT_TYPES[t] === 'function', 'light type ' + t);
  const kinds = new Set(g.lights.map(l => l.lightType));
  for (const t of ['steady', 'pulse', 'subtlePulse', 'flicker', 'shock', 'interference', 'rotor']) assert(kinds.has(t), 'light type in use: ' + t);
  // the light record shape
  for (const k of ['name', 'room', 'circuit', 'kind', 'pos', 'colour', 'target', 'on', 'dead', 'flicker', 'blink', 'lightType']) assert(k in g.lights[0], 'light record field ' + k);
  return `${g.lights.length} fittings, ${deadAll.length} dead, ${g.appliances.length} appliances`;
});

suite('switches', () => {
  // every light control in the game, one by one
  const env = H.load({ quiet: true });
  const { game, BM } = env, g = game.grid;
  g.failureRate = 0;
  g.stormHasTripped = true; // the storm trip has its own test; here it would cut the power mid-check
  const clicks = []; const origClick = game.audio.click.bind(game.audio); game.audio.click = () => { clicks.push(1); origClick(); };
  const switches = game.interactables.filter(i => i.switchVisual);
  assert(switches.length >= 18, 'visible wall switches: ' + switches.length);
  const fails = [];
  const lit = l => l.powered && l.intensity > 0;
  // 1. with no power, every switch clicks and nothing lights
  for (const it of switches) {
    game.standAt(it); if (game.pick() !== it) { fails.push(it.id + ': not selectable from its spot'); continue; }
    const n = clicks.length; game.interact(); settle(env, 0.2);
    if (clicks.length === n) fails.push(it.id + ': no click with the power off');
    if (it.controls.some(id => lit(g.light(id)))) fails.push(it.id + ': lit with no power');
    game.interact(); settle(env, 0.1);
  }
  // 2. with power: off then on again for every switch; toggle, lights, glow, hum follow
  g.setLodge(true); g.throwMain(); settleLights(env);
  for (const it of switches) {
    game.standAt(it);
    const lights = it.controls.map(id => g.light(id)).filter(l => !l.dead);
    if (!lights.length) continue;
    if (!lights.some(l => l.on)) { game.interact(); settleLights(env); }
    if (!lights.every(lit)) { fails.push(it.id + ': not all lit before the test (' + lights.filter(l => !lit(l)).map(l => l.id).join(',') + ')'); continue; }
    const leverOn = it.switchVisual.lever.rotation.x;
    const glowOn = lights[0].bulb ? lights[0].bulb.material.color.r + lights[0].bulb.material.color.g : null;
    game.interact(); settle(env, 0.3);
    if (lights.some(l => l.powered || l.intensity > 0)) fails.push(it.id + ': did not switch off');
    if (Math.abs(it.switchVisual.lever.rotation.x - leverOn) < 0.5) fails.push(it.id + ': toggle did not flip');
    if (glowOn !== null && lights[0].bulb.material.color.r + lights[0].bulb.material.color.g >= glowOn) fails.push(it.id + ': bulb still glowing');
    game.interact();
    settle(env, 0.1);
    const startedDim = lights.every(l => l.fraction < 1);
    settleLights(env);
    if (!lights.every(lit)) fails.push(it.id + ': did not come back on');
    if (!startedDim) fails.push(it.id + ': snapped on instead of warming up');
    game.update(1 / 30);
    const near = game.audio.humTargets.map(h => h.light.id);
    if (!lights.some(l => near.includes(l.id)) && lights.some(l => Math.hypot(l.pos.x - it.pos.x, l.pos.z - it.pos.z) < 5)) fails.push(it.id + ': no hum from its lights');
  }
  // 3. the fuse board: every breaker kills exactly its circuit and brings it back
  for (const c of ['hall', 'ground', 'east', 'west', 'attic', 'cellar']) {
    const mine = g.lights.filter(l => l.circuit === c && l.on && !l.dead), others = g.lights.filter(l => g.isHouseCircuit(l.circuit) && l.circuit !== c && l.on && !l.dead && lit(l));
    g.setBreaker(c, false); settle(env, 0.2);
    if (mine.some(lit)) fails.push('breaker ' + c + ': its lights stayed on');
    if (others.some(l => !lit(l))) fails.push('breaker ' + c + ': killed another circuit');
    g.setBreaker(c, true); settleLights(env);
    if (!mine.every(lit)) fails.push('breaker ' + c + ': lights did not return');
  }
  // 4. the estate lighting panel: every group independently
  game.standAt(game.byId['lodge-lighting']); game.interact();
  const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
  game.estateGroups.forEach(([k], i) => {
    const mine = game.estateLights[k].map(id => g.light(id));
    const before = game.estateGroupOn(k);
    game.keyDown(keys[i]); if (before) settle(env, 0.3); else settleLights(env);
    const now = mine.filter(l => !l.dead).every(l => before ? !lit(l) : lit(l));
    if (!now) fails.push('estate group ' + k + ': did not switch ' + (before ? 'off' : 'on'));
  });
  game.keyDown('KeyE');
  // 5. no orphans: every light can be controlled by something the player can reach
  const controlled = new Set();
  for (const it of switches) for (const id of it.controls) controlled.add(id);
  for (const k in game.estateLights) for (const id of game.estateLights[k]) controlled.add(id);
  const orphans = g.lights.filter(l => !controlled.has(l.id) && !l.circuit.startsWith('hive:') && !['battery', 'fire', 'generator', 'street', 'car'].includes(l.circuit) && !/-glow$/.test(l.id) && !(g.isHouseCircuit(l.circuit)));
  if (orphans.length) fails.push('lights nothing can switch: ' + orphans.map(l => l.id).join(', '));
  const houseLights = g.lights.filter(l => g.isHouseCircuit(l.circuit));
  const unswitched = houseLights.filter(l => !controlled.has(l.id) && !/-glow$/.test(l.id));
  if (unswitched.length) fails.push('house fittings with no wall switch (breaker only): ' + unswitched.map(l => l.id).join(', '));
  // 6. the switchboards: every lever, lamp and meter follows the real state
  const sbs = game.switchboards;
  if (!sbs || sbs.length < 3) fails.push('switchboards missing');
  const snapshot = () => sbs.map(sb => [sb.levers.map(l => Math.sign(l.mesh.rotation.x)), sb.lamps.map(l => l.mesh.material.color.getHex() !== 0x200a06), sb.needles.map(nd => +(nd.cur || 0).toFixed(2))]);
  g.setLodge(true); g.throwMain(); for (const k in game.estateLights) game.estateLights[k].forEach(id => { g.light(id).on = true; }); settle(env, 2);
  const onSnap = snapshot();
  for (const sb of sbs) for (const l of sb.levers) if (l.state() !== (l.mesh.rotation.x < 0)) fails.push('a switchboard lever shows the wrong position');
  for (const sb of sbs) for (const l of sb.lamps) if (l.state() !== (l.mesh.material.color.getHex() !== 0x200a06)) fails.push('a switchboard lamp shows the wrong state');
  g.setBreaker('east', false); settle(env, 1);
  const pantry = sbs[2], eastLever = pantry.levers[3], eastLamp = pantry.lamps[3]; // MAIN comes first
  if (eastLever.mesh.rotation.x < 0 || eastLamp.mesh.material.color.getHex() !== 0x200a06) fails.push('EAST breaker off: lever or lamp did not follow');
  g.setBreaker('east', true);
  g.setLodge(false); settle(env, 3);
  const offSnap = snapshot();
  if (JSON.stringify(onSnap) === JSON.stringify(offSnap)) fails.push('switchboards look the same with the power on and off');
  if (sbs[0].needles.some(nd => Math.abs(nd.cur - -0.8) > 0.1)) fails.push('lodge meters did not drop to zero with the supply off');
  g.setLodge(true);
  assert(!fails.length, fails.join('\n'));
  return `${sbs.length} switchboards follow the power; ${switches.length} wall switches, 6 breakers and ${game.estateGroups.length} estate groups all switch off and on, with toggle, glow, warm-up and hum`;
});

suite('arrival', () => {
  // your car arrives, the radio on low; it stalls at the gates and its lights die
  const env = H.load({ quiet: true });
  const { game, BM } = env, T = BM.INTRO_T;
  game.ui.mode = 'title'; game.keyDown('KeyX');
  assert(game.intro, 'clicking the title starts the arrival');
  const at = s => { while (game.intro && game.intro.t < s) game.update(1 / 30); };
  at(3);
  const road = game.road;
  assert(road.poles >= 20 && road.spans >= 18 && road.trees > 300 && road.potholes > 20, 'an old road through the forest, power poles along it: ' + JSON.stringify(road));
  assert(['street-24', 'street8', 'street40'].every(id => game.grid.light(id)), 'the street lights hang from the poles');
  const car = game.car, x3 = car.group.position.x;
  assert(car.beams.every(l => l.powered && l.intensity > 1.5), 'headlights on as you drive');
  assert(game.intro.radio > 0.02 && game.intro.radio < 0.1 && game.intro.engine > 0.05, 'radio on low, engine running');
  assert(game.audio.loops.engine && game.audio.loops.radio, 'engine and radio sounds exist');
  game.keyDown('KeyW'); at(5); game.keyUp('KeyW');
  assert(car.group.position.x > x3 + 5, 'the car drives up the lane (and W does nothing while you are in it)');
  at(T.arrive + 0.2);
  assert(Math.abs(car.group.position.x - BM.CAR.stopX) < 0.01, 'it pulls up at the gates');
  at(T.flicker + 0.6);
  assert(car.beams.every(l => l.flicker > 0.5), 'the headlights flicker');
  at(T.dim + 1.2);
  const dim = car.beams[0].target;
  assert(dim > 0 && dim < 1.6 && car.beams[0].colour === 0xffa050, 'they sag to a dull orange');
  at(T.dead + 0.2);
  assert(car.beams.every(l => !l.powered) && game.intro.radio === 0, 'then go out, and the radio is gone');
  at(T.end + 1);
  assert(!game.intro && car.parked && game.carWall.enabled, 'you are out of the car; it stays parked');
  assert(Math.abs(game.player.x - BM.START.x) < 0.01 && Math.abs(game.player.z - BM.START.z) < 0.01, 'standing beside it, facing the gates');
  game.standAt(game.byId['car']); assert(game.pick() === game.byId['car'], 'you can try the car');
  game.interact(); assert(/flat/.test(game.ui.lastSay), 'the battery is flat');
  game.keys = {}; game.teleport(BM.START.x, 0, BM.START.z, BM.START.yaw); game.keyDown('KeyW'); for (let i = 0; i < 30; i++) game.update(1 / 30); game.keyUp('KeyW');
  assert(game.player.z < BM.START.z - 0.5, 'and you can walk');
  // skipping
  const env2 = H.load({ quiet: true }), g2 = env2.game;
  g2.ui.mode = 'title'; g2.keyDown('KeyX'); g2.update(1 / 30); g2.keyDown('Space');
  assert(!g2.intro && g2.car.parked && g2.car.beams.every(l => !l.on), 'any key skips the arrival');
  assert(game.frameErrors === 0, 'frame errors');
  return `${road.poles} poles, ${road.trees} pines; drive in, stall, lights die, walk; skippable`;
});

suite('one-by-one', () => {
  // old wiring: lights given supply together come on one at a time, each reaching
  // full brightness before the next starts, beginning with the one nearest you
  const env = H.load({ quiet: true });
  const { game } = env, g = game.grid;
  g.failureRate = 0; g.stormHasTripped = true;
  g.setLodge(true);
  game.teleport(0, 0, 90, 0);
  game.toggleEstate('drive');
  const lamps = game.estateLights.drive.map(id => g.light(id));
  const order = [], fullAt = {};
  let t = 0, overlap = 0;
  while (t < 120 && Object.keys(fullAt).length < lamps.length) {
    game.update(1 / 30); t += 1 / 30;
    let starting = 0;
    for (const l of lamps) {
      if (l.powered && order.indexOf(l) < 0) order.push(l);
      if (l.powered && l.seq) starting++;
      if (l.powered && !l.seq && !(l.id in fullAt)) fullAt[l.id] = t;
    }
    if (starting > 1) overlap++;
  }
  assert(Object.keys(fullAt).length === lamps.length, 'every drive lamp came on');
  assert(overlap === 0, 'never two lamps warming up at once');
  const d = l => Math.hypot(l.pos.x - 0, l.pos.z - 90);
  assert(order.every((l, i) => i === 0 || d(l) >= d(order[i - 1]) - 0.01), 'nearest lamp first, then outwards');
  assert(t > lamps.length * 2, 'slowly: ' + t.toFixed(1) + ' s for ' + lamps.length + ' lamps');
  // the waiting lamps show as warming on the side panel, and other groups run alongside
  game.toggleEstate('drive'); game.update(1 / 30);
  game.toggleEstate('drive'); game.toggleEstate('flood'); game.update(1 / 30); game.update(1 / 30);
  const flood = game.estateLights.flood.map(id => g.light(id));
  assert(lamps.filter(l => l.powered).length === 1 && flood.filter(l => l.powered).length === 1, 'each group has its own chain');
  assert(game.lightPanelRows().find(r => r.k === 'estate:drive').warming, 'the panel shows the group still coming on');
  // the house: each room's lights in turn, rooms side by side
  g.throwMain(); game.update(1 / 30); game.update(1 / 30);
  const byRoom = {};
  for (const l of g.lights) if (g.isHouseCircuit(l.circuit) && l.powered && !g.instant(l)) byRoom[l.room] = (byRoom[l.room] || 0) + 1;
  assert(Object.values(byRoom).every(n => n === 1) && Object.keys(byRoom).length > 8, 'one light per room starting: ' + JSON.stringify(byRoom));
  return `${lamps.length} drive lamps one by one, nearest first, ${t.toFixed(0)} s; rooms in parallel`;
});

suite('hud', () => {
  // the lighting panel on the side of the screen, and running
  const env = H.load({ quiet: true });
  const { game } = env, g = game.grid;
  g.failureRate = 0; g.stormHasTripped = true;
  const rows = game.lightPanelRows();
  assert(rows.filter(r => r.section === 'ESTATE').length === 11 && rows.filter(r => r.section === 'ROOMS').length >= 20, 'panel lists every estate group and every room: ' + rows.length);
  game.ui.renderLights();
  const el = env.window.document.getElementById('lights');
  assert(el.style.display === 'block' && /Drive lamps/.test(el.innerHTML) && /Dining room/.test(el.innerHTML), 'panel is shown with its rows');
  // without supply nothing comes on
  game.lightPanelToggle('estate:drive'); for (let i = 0; i < 60; i++) game.update(1 / 30);
  assert(!game.estateLights.drive.some(id => g.light(id).powered), 'no supply, no lights');
  g.setLodge(true); g.throwMain();
  // from anywhere: stand in the cellar and switch the drive lamps and the attic lights
  game.teleport(0, -3.2, -6, 0);
  game.lightPanelToggle('estate:drive');
  game.lightPanelToggle('room:sw-attic'); game.lightPanelToggle('room:sw-attic');
  settleLights(env);
  assert(game.estateLights.drive.every(id => g.light(id).powered), 'drive lamps switched on from the cellar');
  assert(['attic-1', 'attic-2', 'attic-3'].every(id => g.light(id).powered), 'attic lights toggled from the cellar');
  game.lightPanelToggle('room:sw-attic'); for (let i = 0; i < 10; i++) game.update(1 / 30);
  assert(['attic-1', 'attic-2', 'attic-3'].every(id => !g.light(id).powered), 'and off again');
  const r = game.lightPanelRows().find(x => x.k === 'room:sw-attic');
  assert(!r.on && !r.lit && game.byId['sw-attic'].leverOn === false, 'the panel row and the wall toggle agree');
  // number keys work the estate groups while walking about
  const before = game.estateGroupOn('pool'); game.keyDown('Digit6'); assert(game.estateGroupOn('pool') !== before, 'key 6 switches the pool lights');
  // L hides and shows the panel
  game.keyDown('KeyL'); game.ui.renderLights(); assert(el.style.display === 'none', 'L hides the panel');
  game.keyDown('KeyL'); game.ui.renderLights(); assert(el.style.display === 'block', 'L shows it again');
  // Shift to run
  game.teleport(0, 0, 70, 0); game.keys = { KeyW: true }; for (let i = 0; i < 60; i++) game.update(1 / 60);
  const walk = 70 - game.player.z;
  game.teleport(0, 0, 70, 0); game.keys = { KeyW: true, ShiftLeft: true }; for (let i = 0; i < 60; i++) game.update(1 / 60);
  const run = 70 - game.player.z; game.keys = {};
  assert(walk > 2.5 && walk < 3.1 && run > 4.8, `walk ${walk.toFixed(2)} m/s, run ${run.toFixed(2)} m/s`);
  return `panel: ${rows.length} rows, works from anywhere; walk ${walk.toFixed(1)} m/s, run ${run.toFixed(1)} m/s`;
});

suite('appliances', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env, g = game.grid;
  g.failureRate = 0;
  const A = id => g.appliances.find(a => a.id === id);
  const lodge = g.appliances.filter(a => a.room === 'lodge');
  const kinds = k => new Set(lodge.map(a => a.kind)).has(k);
  assert(['tv', 'fan', 'radio', 'kettle', 'heater', 'clock'].every(kinds), 'the lodge has a TV, fan, radio, kettle, heater and clock');
  assert(game.phys.furniture.filter(f => f.room === 'lodge').length >= 6, 'the lodge is furnished');
  // every appliance but a clock has a switch you can reach and use
  for (const a of g.appliances) {
    if (a.kind === 'clock') continue;
    const it = game.byId[a.id + '-switch'] || game.interactables.find(i => i.id.indexOf(a.id) === 0);
    assert(it, 'no switch for ' + a.id);
  }
  // with no power, nothing runs
  settle(env, 1);
  assert(g.appliances.every(a => !a.running), 'nothing runs with the power off');
  const clockAt = A('lodge-clock').clockTime;
  // the lodge supply alone runs the lodge appliances
  g.setLodge(true); settle(env, 1);
  assert(lodge.filter(a => a.switchedOn).every(a => a.running), 'lodge appliances run off the lodge supply');
  assert(!A('kitchen-fridge').running, 'house appliances still wait for MAIN');
  assert(A('lodge-clock').clockTime > clockAt, 'the clock runs with power');
  // TV: switch off and on from its switch; screen and light follow
  const tv = A('lodge-tv'), sw = game.byId['lodge-tv-switch'];
  game.standAt(sw); assert(game.pick() === sw, 'tv switch selectable');
  game.interact(); settle(env, 0.5);
  assert(!tv.running && !tv.light.powered, 'tv off');
  const off = tv.object.material.color.r;
  game.interact(); settle(env, 2);
  assert(tv.running && tv.light.powered && tv.object.material.color.r > off * 3, 'tv back on, screen and glow lit');
  // fan: switch off, blades stop where they stand
  const fan = A('lodge-fan');
  settle(env, 1); assert(fan.spin > 5, 'fan spinning');
  game.toggleAppliance(fan); settle(env, 0.1); const ang = fan.angle; settle(env, 1);
  assert(!fan.running && fan.angle === ang, 'fan stopped where it stood');
  game.toggleAppliance(fan); settle(env, 1); assert(fan.running && fan.spin > 3, 'fan on again');
  // kettle: boils and clicks itself off
  const kettle = A('lodge-kettle');
  assert(!kettle.switchedOn, 'kettle starts off');
  game.toggleAppliance(kettle); settle(env, 10);
  assert(kettle.running && kettle.boil > 0.3 && kettle.boil < 1, 'kettle heating');
  settle(env, 20);
  assert(!kettle.switchedOn && !kettle.running && game.events.log.includes('appliance:boiled'), 'kettle boiled and switched itself off');
  // heater: bars warm up slowly, cast light, cool down after
  const heater = A('lodge-heater');
  assert(heater.glow === 1 && heater.light.powered, 'heater glowing');
  game.toggleAppliance(heater); settle(env, 2);
  assert(heater.glow > 0 && heater.glow < 1, 'heater bars cooling slowly');
  // power cut: everything stops where it stands, the clock stops
  g.setLodge(false); settle(env, 0.2);
  const stopped = A('lodge-clock').clockTime; settle(env, 3);
  assert(A('lodge-clock').clockTime === stopped, 'the clock stops when the power goes');
  assert(lodge.every(a => !a.running), 'lodge appliances stopped');
  const starts = game.events.log.filter(e => e === 'appliance:start').length;
  g.setLodge(true); settle(env, 0.5);
  assert(game.events.log.filter(e => e === 'appliance:start').length > starts, 'they come back by themselves');
  // the house: fridge compressor cycles, the radiogram turns, the kitchen clock runs
  g.throwMain(); settle(env, 25);
  const fridge = A('kitchen-fridge'), rec = A('drawing-radiogram');
  assert(fridge.running && fridge.cycle > 20, 'fridge running');
  let sawOff = false, sawOn = false; for (let i = 0; i < 40; i++) { settle(env, 1); if (fridge.compressor) sawOn = true; else sawOff = true; }
  assert(sawOn && sawOff, 'the fridge compressor cycles on and off');
  const a0 = rec.angle; settle(env, 0.3); assert(rec.running && rec.angle !== a0, 'the radiogram turntable turns');
  // each appliance's state is its own: no two share the material that shows it
  const mats = g.appliances.filter(a => a.object && a.object.material).map(a => a.object.material);
  assert(new Set(mats).size === mats.length, 'two appliances share a state material (one would light the other)');
  game.toggleAppliance(A('lodge-tv')); settle(env, 0.5);
  const otherTv = A('tv');
  assert(!tv.running && otherTv.object.material !== tv.object.material, 'switching one TV off leaves the other alone');
  // the routing console lamps show each sector's own state
  g.startGenerator(); g.route('lifts', true); g.route('core', true); game.fx.updateAppliances(0.016, 0);
  const lampOn = game.consoleLamps.map(c => c.mesh.material.color.getHex() === 0x40ff70);
  assert(JSON.stringify(lampOn) === JSON.stringify(BM.HIVE_SECTORS.map(s => g.routed.has(s))), 'console lamps match the routed sectors: ' + lampOn);
  return `${g.appliances.length} appliances (${lodge.length} in the lodge), ${game.phys.furniture.filter(f => f.room === 'lodge').length} pieces of lodge furniture`;
});

suite('playthrough', () => {
  const env = H.load({ quiet: true });
  const { game } = env, g = game.grid;
  assert(!canWalk(env, 'front-doors'), 'the gates must stop you reaching the house at the start');
  go(env, 'gate-release');
  assert(!game.gates.open, 'gate release dead without lodge power');
  go(env, 'lodge-main'); assert(g.lodge, 'lodge on');
  go(env, 'lodge-lighting'); game.keyDown('KeyA'); game.keyDown('KeyE');
  settleLights(env);
  assert(game.estateLights.drive.every(id => g.light(id).powered || g.light(id).dead), 'drive lamps on from the lodge');
  go(env, 'gate-release'); assert(game.gates.open, 'gates released');
  // the gates swing slowly inwards: not passable at once, open after the swing
  settle(env, 2);
  assert(game.gates.t < 0.3 && game.gates.wall.enabled, 'gates still swinging after 2 s');
  const leaf = game.gates.leaves[0], tip = new env.THREE.Vector3(-1.7, 0, 0);
  settle(env, 9);
  assert(game.gates.t === 1 && !game.gates.wall.enabled, 'gates fully open after the swing');
  leaf.updateMatrixWorld(); tip.set(3.4, 0, 0).applyMatrix4(leaf.matrixWorld);
  assert(tip.z < 87, 'the gates swing inwards, into the estate (leaf tip z ' + tip.z.toFixed(2) + ')');
  go(env, 'front-doors'); assert(game.frontDoors.open, 'front doors open');
  settle(env, 4);
  go(env, 'hall-panel'); settle(env, 3);
  assert(game.hallLit(), 'hall lit from the panel before the fuse board');
  assert(!g.live('ground'), 'the rest of the house still dark');
  go(env, 'fuse-board'); assert(game.ui.mode === 'fuse', 'fuse board opens');
  game.keyDown('KeyM'); game.keyDown('KeyE');
  assert(g.live('main') && g.live('cellar'), 'MAIN on');
  settle(env, 4);
  // read the story on the way up
  for (const id of ['note-solicitor', 'note-lease', 'note-drawing', 'note-order', 'note-margaret']) { go(env, id); game.keyDown('KeyE'); }
  go(env, 'blast-door'); assert(!game.blastDoor.open, 'blast door locked before the journal');
  go(env, 'ladder-up'); settle(env, 1);
  assert(game.player.y > 8, 'in the attic');
  settle(env, 1);
  assert(g.tripped, 'the storm trips MAIN while in the attic');
  go(env, 'journal'); game.keyDown('KeyE');
  assert(game.story.journalRead, 'journal read');
  go(env, 'ladder-down'); settle(env, 1);
  go(env, 'fuse-board'); game.keyDown('KeyM'); game.keyDown('KeyE');
  assert(!g.tripped && g.live('cellar'), 'MAIN reset');
  settle(env, 2);
  go(env, 'blast-door'); assert(game.blastDoor.open, 'blast door opens after the journal');
  settle(env, 3);
  go(env, 'lift-house-down'); settle(env, 1);
  assert(game.player.y < -29, 'down in the Hive');
  go(env, 'routing-console'); game.keyDown('Digit2'); game.keyDown('KeyE');
  assert(!g.routed.size, 'nothing routes without the generator');
  go(env, 'generator-start'); assert(g.generator, 'generator running');
  go(env, 'routing-console');
  game.keyDown('Digit2'); game.keyDown('Digit4');
  assert(g.routed.has('lifts') && g.routed.has('security') && g.coreDoorUnsealed, 'lifts + security: core seal released');
  game.keyDown('Digit1'); game.keyDown('Digit3');
  assert(g.routed.size === 3 && !g.routed.has('labs'), 'a fourth sector is refused');
  game.keyDown('KeyE');
  go(env, 'lift-hiveA-to-hiveC'); settle(env, 1);
  assert(near(game.player.y, -46, 0.01), 'on Level C');
  settle(env, 4);
  assert(!canWalk(env, 'core-terminal'), 'lasers block the corridor while SECURITY is fed');
  go(env, 'note-menu-b'); game.keyDown('KeyE');
  go(env, 'lift-hiveC-to-hiveA'); settle(env, 1);
  go(env, 'routing-console');
  game.keyDown('Digit4'); game.keyDown('Digit1'); game.keyDown('Digit6'); game.keyDown('KeyE');
  assert(!g.lasersLive && g.live('hive:core') && g.coreDoorUnsealed, 'security cut, core fed, door still open');
  go(env, 'lift-hiveA-to-hiveC'); settle(env, 1);
  settle(env, 4);
  go(env, 'core-terminal');
  assert(game.story.ended && /BLACKTHORN MANOR/.test(game.endingText), 'the ending');
  assert(game.frameErrors === 0, 'no frame errors');
  return `${game.story.read.size} documents read on the way`;
});

suite('controls', () => {
  // the whole game again, but played only with the keyboard: turn, walk, use, panel keys
  const env = H.load({ quiet: true });
  const { game } = env;
  env.window.BM.game = game;
  require('vm').runInContext(require('fs').readFileSync(require('path').join(__dirname, 'autopilot.js'), 'utf8'), env.window);
  const AP = env.window.AP; AP.renderEvery = 1e9;
  game.ui.mode = null;
  const fails = [];
  const use = (id, o) => { const r = AP.goUse(id, o); if (!r.ok) fails.push(id + ': ' + r.why + ' ' + JSON.stringify(r.at || r.from || '')); return r; };
  const keys = l => l.forEach(k => AP.press(k));
  keys(['KeyT']);
  use('lodge-main'); use('lodge-lighting'); keys(['KeyA', 'KeyE']);
  use('gate-release'); AP.wait(12);
  use('front-doors'); AP.wait(5); use('hall-panel'); AP.wait(3);
  use('fuse-board'); keys(['KeyM', 'KeyE']); AP.wait(4);
  use('note-order'); keys(['KeyE']);
  use('ladder-up'); AP.wait(4);
  assert(game.grid.tripped, 'storm trip in the attic');
  use('journal'); keys(['KeyE']); use('ladder-down'); AP.wait(2);
  use('fuse-board'); keys(['KeyM', 'KeyE']); AP.wait(2);
  use('blast-door'); AP.wait(4); use('lift-house-down'); AP.wait(5);
  use('generator-start'); use('routing-console'); keys(['Digit2', 'Digit4', 'KeyE']);
  use('lift-hiveA-to-hiveC'); AP.wait(5);
  assert(!AP.goUse('core-terminal', { noUse: true }).ok, 'the lasers bar the way while SECURITY is fed');
  use('lift-hiveC-to-hiveA'); AP.wait(5);
  use('routing-console'); keys(['Digit4', 'Digit6', 'KeyE']);
  use('lift-hiveA-to-hiveC'); AP.wait(5); use('core-terminal'); AP.wait(1);
  assert(!fails.length, 'could not do with the controls: ' + fails.join('; '));
  assert(game.story.ended, 'reached the ending with the keyboard alone');
  assert(game.frameErrors === 0, 'frame errors');
  return `ending reached by keyboard in ${(AP.frames / 60 / 60).toFixed(1)} game minutes, ${AP.stuck} recoveries from snags`;
});

suite('reachability', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env;
  openEverything(game);
  const r = flood(game, [{ x: BM.START.x, y: BM.START.y, z: BM.START.z }], { useLinks: true, maxNodes: 3e6 });
  const nodes = r.list;
  const perLevel = {};
  for (const n of nodes) for (const [name, y] of Object.entries(LEVELS)) if (Math.abs(n.y - y) < 0.05) perLevel[name] = (perLevel[name] || 0) + 1;
  for (const name of Object.keys(LEVELS)) assert(perLevel[name] > 50, 'level not reached: ' + name);
  const missing = [], badPick = [];
  const kinds = {};
  for (const it of game.interactables) {
    kinds[it.kind] = (kinds[it.kind] || 0) + 1;
    if (!nodes.some(atApproach(it))) { missing.push(it.id); continue; }
    if (it.enabled && !it.enabled()) continue;
    game.standAt(it);
    if (game.pick() !== it) badPick.push(it.id + '->' + (game.pick() && game.pick().id));
  }
  assert(!missing.length, 'unreachable: ' + missing.join(', '));
  assert(!badPick.length, 'cannot be selected from its approach: ' + badPick.join(', '));
  for (const k of ['control', 'door', 'ladder', 'lift', 'readable']) assert(kinds[k] > 0, 'no ' + k + ' interactables');
  return `${nodes.length} cells over ${Object.keys(perLevel).length} levels; ${game.interactables.length} items reached (${Object.entries(kinds).map(([k, v]) => v + ' ' + k).join(', ')})`;
});

suite('doorways', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env, P = game.phys, r = BM.PLAYER.radius;
  openEverything(game);
  const fails = [];
  for (const d of P.doorways) {
    const half = d.width / 2 - r - 0.01;
    assert(half > 0, d.id + ' narrower than the player');
    for (let off = -half; off <= half + 1e-6; off += 0.05) {
      for (const dir of [1, -1]) {
        const lateral = d.axis === 'x' ? { x: off, z: 0 } : { x: 0, z: off };
        const normal = d.axis === 'x' ? { x: 0, z: dir } : { x: dir, z: 0 };
        const s = { x: d.x + lateral.x - normal.x * (d.thick / 2 + r + 0.15), z: d.z + lateral.z - normal.z * (d.thick / 2 + r + 0.15) };
        const e = { x: d.x + lateral.x + normal.x * (d.thick / 2 + r + 0.15), z: d.z + lateral.z + normal.z * (d.thick / 2 + r + 0.15) };
        const y = P.support(s.x, s.z, d.y + 0.2);
        const p = { x: s.x, y, z: s.z };
        const hit = P.move(p, e.x - s.x, e.z - s.z);
        if (Math.abs(p.x - e.x) > 0.02 || Math.abs(p.z - e.z) > 0.02) { fails.push(`${d.id} @${off.toFixed(2)} dir ${dir}: blocked by ${hit && (hit.kind + ' ' + (hit.tag || hit.id))}`); break; }
      }
    }
  }
  assert(!fails.length, fails.slice(0, 12).join('\n') + (fails.length > 12 ? `\n...and ${fails.length - 12} more` : ''));
  return `${P.doorways.length} doorways walked at full width both ways`;
});

suite('paths', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env, P = game.phys, r = BM.PLAYER.radius;
  openEverything(game);
  const fails = [];
  for (const path of P.paths) {
    const half = path.w / 2 - r;
    const samples = [];
    if (path.ring) {
      for (let a = 0; a < Math.PI * 2; a += 0.5 / path.ring.r) samples.push({ x: path.ring.cx + Math.sin(a) * path.ring.r, z: path.ring.cz + Math.cos(a) * path.ring.r, nx: Math.sin(a), nz: Math.cos(a) });
    } else for (let i = 0; i < path.pts.length - 1; i++) {
      const [ax, az] = path.pts[i], [bx, bz] = path.pts[i + 1], L = Math.hypot(bx - ax, bz - az);
      for (let s = 0; s <= L; s += 0.5) samples.push({ x: ax + (bx - ax) * s / L, z: az + (bz - az) * s / L, nx: -(bz - az) / L, nz: (bx - ax) / L });
    }
    for (const s of samples) for (let o = -half; o <= half + 1e-6; o += 0.1) {
      const x = s.x + s.nx * o, z = s.z + s.nz * o, y = P.support(x, z, path.y + 0.3);
      const b = P.blocked(x, z, y);
      if (b || !isFinite(y)) { fails.push(`${path.id} at (${x.toFixed(1)}, ${z.toFixed(1)}): ${b ? b.kind + ' ' + (b.tag || b.id) : 'no ground'}`); break; }
    }
  }
  const uniq = [...new Set(fails)];
  assert(!uniq.length, uniq.slice(0, 12).join('\n'));
  return `${P.paths.length} drives and paths clear at full width`;
});

suite('furniture', () => {
  const env = H.load({ quiet: true });
  const P = env.game.phys;
  const walls = P.walls.filter(w => w.kind === 'wall' && w.structural);
  const fails = [];
  for (const f of P.furniture) for (const w of walls) {
    const ox = Math.min(f.x1, w.x1) - Math.max(f.x0, w.x0), oz = Math.min(f.z1, w.z1) - Math.max(f.z0, w.z0), oy = Math.min(f.y1, w.y1) - Math.max(f.y0, w.y0);
    if (ox > 0.01 && oz > 0.01 && oy > 0.01) fails.push(`${f.tag} (${f.room}) clips a wall by ${Math.min(ox, oz).toFixed(2)}m`);
  }
  assert(!fails.length, fails.slice(0, 15).join('\n'));
  return `${P.furniture.length} pieces of furniture clear of ${walls.length} wall pieces`;
});

suite('windows', () => {
  const env = H.load({ quiet: true });
  const P = env.game.phys;
  const fails = [];
  const solid = P.walls.filter(w => w.kind === 'furniture' || w.kind === 'tree' || w.kind === 'hedge');
  for (const w of P.windows) for (const [du, dv] of [[0, 0], [-0.3, 0.3], [0.3, -0.3]]) {
    const ux = w.nz !== 0 ? 1 : 0, uz = w.nx !== 0 ? 1 : 0;
    const cx = w.x + ux * du * w.w, cz = w.z + uz * du * w.w, cy = w.y + dv * (w.head - w.sill) * 0.5;
    const a = { x: cx - w.nx * 1.0, y: cy, z: cz - w.nz * 1.0 }, b = { x: cx + w.nx * 6, y: cy, z: cz + w.nz * 6 };
    const occ = P.occluded(a.x, a.y, a.z, b.x, b.y, b.z);
    const furn = solid.find(f => segBox(a, b, f));
    if (occ || furn) { fails.push(`${w.id}: view blocked by ${occ ? (occ.kind || occ.tag) : furn.tag}`); break; }
  }
  assert(!fails.length, fails.join('\n'));
  return `${P.windows.length} windows (${P.windows.filter(w => w.zone === 'mansion').length} in the house) can be seen out of`;
});

suite('readables', () => {
  const env = H.load({ quiet: true });
  const { game } = env;
  openEverything(game);
  const fails = [];
  const controls = game.interactables.filter(i => i.kind !== 'readable');
  for (const rd of game.B.readables) {
    game.standAt(rd);
    const p = game.pick();
    if (p !== rd) fails.push(`${rd.id} shadowed by ${p && p.id}`);
    for (const c of controls) {
      const d = Math.hypot(c.pos.x - rd.pos.x, c.pos.z - rd.pos.z);
      if (d < 1.0 && Math.abs(c.pos.y - rd.pos.y) < 1.5) fails.push(`${rd.id} only ${d.toFixed(2)}m from control ${c.id}`);
    }
  }
  assert(!fails.length, fails.join('\n'));
  return `${game.B.readables.length} readable items, none shadowed`;
});

suite('budgets', () => {
  const env = H.load({ quiet: true });
  const { game, THREE } = env;
  openEverything(game);
  game.player.torch = true;
  env.step(60);
  // geometry: one canonical geometry per primitive; nothing sized by its own radius
  const geos = new Set(), nonCanon = new Set();
  game.scene.traverse(o => {
    if (!o.geometry) return;
    geos.add(o.geometry);
    if (o.isMesh && !o.isInstancedMesh && !(o.geometry.userData && o.geometry.userData.canonical) && o !== game.fx.beam) nonCanon.add(o.geometry.type);
    if (o.isInstancedMesh && !(o.geometry.userData && o.geometry.userData.canonical)) nonCanon.add('instanced:' + o.geometry.type);
  });
  assert(!nonCanon.size, 'meshes not using canonical geometry: ' + [...nonCanon].join(', '));
  assert(geos.size <= 20, 'unique geometries ' + geos.size);
  let tris = 0; for (const g of geos) tris += (g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0)) / 3;
  assert(tris < 60000, 'unique triangles ' + tris);
  assert(game.optStats.instancedMeshes > 10, 'instancing pass did not run');
  // draw calls from every interactable's approach, plus the walk
  let worst = 0, worstAt = '';
  const views = game.interactables.map(it => ({ id: it.id, x: it.approach.x, y: it.approach.y, z: it.approach.z, yaw: Math.atan2(it.n.x, it.n.z) }));
  for (let yaw = 0; yaw < 6.28; yaw += 0.785) views.push({ id: 'drive ' + yaw.toFixed(1), x: 0, y: 0, z: 40, yaw }, { id: 'hall ' + yaw.toFixed(1), x: 0, y: 0, z: 10.5, yaw }, { id: 'balcony ' + yaw.toFixed(1), x: 0, y: 4.2, z: 1, yaw });
  for (const v of views) {
    game.teleport(v.x, v.y, v.z, v.yaw);
    game.frame(1 / 60, 16);
    if (game.lastDrawCalls > worst) { worst = game.lastDrawCalls; worstAt = v.id; }
  }
  assert(worst < 2200, `draw calls ${worst} at ${worstAt}`);
  // a lightning flash tints the sky towards blue-grey, never towards a light's colour
  game.teleport(0, 0, 45, 0); game.fx.strike(true);
  for (let i = 0; i < 4; i++) game.frame(1 / 60, 16);
  const sky = game.scene.background;
  assert(sky.b >= sky.r, 'sky colour during a flash went ' + sky.getHexString());
  assert(game.frameErrors === 0, 'frame errors');
  return `worst ${worst} draw calls (${worstAt}) over ${views.length} views; ${geos.size} unique geometries, ${Math.round(tris)} tris; ${game.optStats.instancedMeshes} instanced meshes absorbing ${game.optStats.instancesAbsorbed}`;
});

suite('random', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env;
  const rnd = BM.mulberry32(504);
  const keys = ['KeyE', 'KeyM', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'KeyT', 'KeyP', 'Escape', 'Space', 'KeyW', 'KeyA'];
  let interactions = 0;
  for (let i = 0; i < 10000; i++) {
    const it = game.interactables[Math.floor(rnd() * game.interactables.length)];
    if (game.ui.mode && game.ui.mode !== 'ending') game.ui.close();
    if (game.ui.mode === 'ending') { game.ui.mode = null; game.story.ended = false; }
    game.riding = null; game.climbing = null;
    game.standAt(it);
    game.interact(); interactions++;
    const n = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) { game.keyDown(keys[Math.floor(rnd() * keys.length)]); game.keyUp('KeyW'); game.keyUp('KeyA'); }
    if (rnd() < 0.3) { const g = game.grid; [() => g.setLodge(rnd() < 0.7), () => g.toggleBreaker(BM.HOUSE_CIRCUITS[Math.floor(rnd() * 7)]), () => g.toggleRoute(BM.HIVE_SECTORS[Math.floor(rnd() * 6)]), () => g.startGenerator()][Math.floor(rnd() * 4)](); }
    if (i % 10 === 0) game.frame(1 / 30, 33); else game.update(1 / 30);
  }
  assert(game.frameErrors === 0, 'frame errors: ' + (game.lastError && game.lastError.stack));
  return `${interactions} random interactions, no exceptions`;
});

suite('quality', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env;
  const applied = [];
  const q = new BM.Quality(s => applied.push(s.name), 2);
  // one hitch must not drop it: median, not mean
  for (let i = 0; i < 89; i++) q.sample(15); q.sample(800);
  q.update(2.1);
  assert(q.level === 2 && !applied.length, 'a single hitch dropped quality');
  // sustained slow frames step down one level at a time
  for (let i = 0; i < 90; i++) q.sample(34);
  q.update(2.1); assert(q.level === 1 && applied[0] === 'medium', 'steps down to medium');
  for (let i = 0; i < 90; i++) q.sample(34);
  q.update(2.1); assert(q.level === 0 && applied[1] === 'low', 'steps down to low');
  for (let i = 0; i < 90; i++) q.sample(40);
  q.update(2.1); assert(q.level === 0, 'stays at low');
  // fast frames for three checks running step back up
  for (let c = 0; c < 3; c++) { for (let i = 0; i < 90; i++) q.sample(9); q.update(2.1); }
  assert(q.level === 1, 'steps back up after sustained fast frames');
  // the game applies pixel ratio, rain and shadows
  const L = BM.QUALITY_LEVELS;
  game.applyQuality(L[0]); assert(game.fx.quality.rain === L[0].rain && game.fx.quality.shadowEvery === 0 && !game.fx.quality.mirrors, 'low applied');
  game.applyQuality(L[2]); assert(game.fx.quality.rain === L[2].rain && game.fx.quality.shadowEvery === 1, 'high applied');
  // and the frame loop feeds it raw frame times
  game.quality.level = 2; game.quality.samples = [];
  for (let i = 0; i < 200; i++) game.frame(1 / 60, 45);
  assert(game.quality.level < 2, 'the live loop steps down under load');
  // a thrown error in one frame does not stop the next
  const orig = game.fx.update; let once = true;
  game.fx.update = function (...a) { if (once) { once = false; throw new Error('bad frame'); } return orig.apply(this, a); };
  const before = game.frameErrors;
  game.frame(1 / 60, 16); game.frame(1 / 60, 16);
  assert(game.frameErrors === before + 1, 'bad frame caught and the loop continued');
  return 'median-based stepping verified';
});

/* --------------------------------------------------------------- runner -- */
const want = process.argv.slice(2);
let failed = 0;
for (const [name, fn] of Object.entries(suites)) {
  if (want.length && !want.includes(name)) continue;
  const t0 = Date.now();
  try {
    const info = fn();
    console.log(`  PASS  ${name.padEnd(13)} ${((Date.now() - t0) / 1000).toFixed(1)}s  ${info || ''}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name.padEnd(13)} ${((Date.now() - t0) / 1000).toFixed(1)}s\n${(e instanceof Fail ? e.message : e.stack).split('\n').map(l => '        ' + l).join('\n')}`);
  }
}
console.log(failed ? `\n${failed} suite(s) failed` : '\nall suites passed');
process.exit(failed ? 1 : 0);
