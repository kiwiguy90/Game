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
  for (let i = 0; i < 300; i++) game.updateDoors(1 / 30);
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
  // audio is synthesised: no buffers loaded from files, sources created
  assert(env.audioLog.contexts === 1 && env.audioLog.sources > 0, 'web audio synth not started');
  return `${game.grid.lights.length} light records, ${game.interactables.length} interactables, ${game.phys.walls.length} colliders`;
});

suite('circuits', () => {
  const env = H.load({ quiet: true });
  const { game, BM } = env, g = game.grid;
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
  assert(street.length === 3 && street.every(l => l.powered) && street.filter(l => l.flicker > 0).length === 1, 'three street lights, one faulty');
  // lodge on: hall is live immediately, everything else waits for MAIN
  g.setLodge(true);
  assert(g.live('hall') && !g.live('main') && ['ground', 'east', 'west', 'attic', 'cellar'].every(c => !g.live(c)), 'hall live, rest waiting for main');
  assert(lit('lodge-lamp') || (settle(env, 3), lit('lodge-lamp')), 'lodge lamp on lodge supply');
  // the hall panel: fittings start off; incandescent: two false starts then holds
  assert(game.hallLights.every(id => !g.light(id).on), 'hall fittings start switched off');
  game.toggleFittings(game.hallLights);
  const chand = g.light('hall-chandelier');
  const trace = [];
  for (let i = 0; i < 120; i++) { g.update(1 / 60); trace.push(chand.fraction > 0.3 ? 1 : 0); }
  let onRuns = 0; for (let i = 0; i < trace.length; i++) if (trace[i] && !trace[i - 1]) onRuns++;
  assert(onRuns === 3 && trace[trace.length - 1] === 1, `incandescent: two false starts then hold (saw ${onRuns} on-runs)`);
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
  for (let i = 0; i < 600 && !tube.buzzing; i++) { g.update(1 / 120); const on = tube.fraction > 0.5 ? 1 : 0; if (on && !prev) strobes++; prev = on; }
  buzzed = tube.buzzing;
  assert(buzzed, 'fluorescent holds with a buzz');
  assert(strobes >= 9 && strobes <= 14, 'fluorescent strobes 9-13 times then holds, saw ' + strobes);
  settle(env, 3);
  assert(house.filter(l => !l.dead).every(l => l.powered), 'all live fittings powered');
  assert(deadAll.every(l => !l.powered && l.intensity === 0), 'dead fittings never light');
  // appliances run, then stop where they stand
  const fan = g.appliances.find(a => a.kind === 'fan');
  settle(env, 2);
  assert(g.appliances.every(a => a.running), 'appliances running after MAIN');
  assert(g.appliances.filter(a => a.kind === 'radio').length === 2 && g.appliances.filter(a => a.kind === 'tv').length === 1 && g.appliances.filter(a => a.kind === 'fan').length === 2, 'two radios, a television, two fans');
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
  // light types all exist
  for (const t of ['steady', 'pulse', 'subtlePulse', 'blink', 'flicker', 'strobe', 'shock', 'interference', 'rotor']) assert(typeof BM.LIGHT_TYPES[t] === 'function', 'light type ' + t);
  const kinds = new Set(g.lights.map(l => l.lightType));
  for (const t of ['steady', 'pulse', 'subtlePulse', 'flicker', 'shock', 'interference', 'rotor']) assert(kinds.has(t), 'light type in use: ' + t);
  // the light record shape
  for (const k of ['name', 'room', 'circuit', 'kind', 'pos', 'colour', 'target', 'on', 'dead', 'flicker', 'blink', 'lightType']) assert(k in g.lights[0], 'light record field ' + k);
  return `${g.lights.length} fittings, ${deadAll.length} dead, ${g.appliances.length} appliances`;
});

suite('playthrough', () => {
  const env = H.load({ quiet: true });
  const { game } = env, g = game.grid;
  assert(!canWalk(env, 'front-doors'), 'the gates must stop you reaching the house at the start');
  go(env, 'gate-release');
  assert(!game.gates.open, 'gate release dead without lodge power');
  go(env, 'lodge-main'); assert(g.lodge, 'lodge on');
  go(env, 'gate-release'); assert(game.gates.open, 'gates open');
  settle(env, 3);
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
