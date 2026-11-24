/* ==========================================================================
   HALCYON HOUSE — a second world, chosen on the title screen
   Not haunted: just a modern house to explore and to play with. A long,
   lit drive from automatic gates on the road, up through a big section of
   lawns and specimen trees to a glass-and-stone house on the shore of a
   lake. Everything is lit and everything is switchable: the house's smart
   lights (scenes, colours, brightness) and a dozen groups of outdoor
   lighting on the number keys.
   Layout (metres): the road runs along z = 108, the gates are at z = 100,
   the drive climbs north to a forecourt round a fountain at z = 30, the
   house stands from z = 14 (front) to z = -18 (the glass wall to the lake),
   x -26..26, with the garage wing west of it (x -46..-26). The pool terrace
   runs down to the lake edge at z = -40.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const H = { x0: -26, x1: 26, z0: -18, z1: 14 };          // the house
const GA = { x0: -46, x1: -26, z0: -12, z1: 14, h: 4.6 }; // the garage wing
const F1 = 4.2, ROOF = 8.4;                               // floor levels
const VOID = [-6, 6, 2, 14];                              // the atrium, open to the roof slab
const ST1 = { x0: -6, x1: -4.5, z0: 2, z1: 8.4 };         // the floating stairs, ground to first floor
const ST2 = { x0: 6.2, x1: 7.7, z0: -4, z1: 2.4 };         // and on up to the roof, off the landing
const SECTION = { x0: -70, x1: 70, z0: -40, z1: 100 };
const LIFT = { x0: 3.8, x1: 5.6, z0: 10.4, z1: 12.2 };       // the glass lift, in the atrium (83-halcyon-inside.js)
const START = { x: 0, y: 0, z: 107, yaw: 0 };
const LAKE = { cx: 0, cz: -110, y: -0.45 };

BM.HALCYON = { H, GA, F1, ROOF, START, LAKE, SECTION, LIFT, VOID };
BM.storedWorld = () => { try { return window.localStorage.getItem('bm-world') || 'manor'; } catch (e) { return 'manor'; } };
BM.chooseWorld = w => { try { window.localStorage.setItem('bm-world', w); } catch (e) { /* only this visit */ } };

/* ---- finishes: clean, flat colours ---- */
const phong = (c, sh, o) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: sh || 10, specular: 0x222222 }, o || {}));
const MAT = {};
function mats() {
  if (MAT.ready) return MAT;
  Object.assign(MAT, {
    ready: true,
    concrete: phong(0xb9b5ac, 6), render: phong(0xe8e5de, 6), charcoal: phong(0x26282c, 30), timber: phong(0x8a5a36, 14),
    oak: phong(0xa07a52, 30), floor: phong(0x8e8b86, 70, { specular: 0x555555 }), steel: phong(0x141618, 90, { specular: 0x666666 }),
    glass: phong(0x9cc0d0, 140, { transparent: true, opacity: 0.16, depthWrite: false, specular: 0xffffff }),
    glazing: phong(0x9cc0d0, 140, { transparent: true, opacity: 0.16, depthWrite: false, specular: 0xffffff }),   // the house's own windows: these can frost
    paver: phong(0xc8c2b4, 6), deck: phong(0x5e4430, 12), white: phong(0xf2f0ec, 20), sofa: phong(0x5a5e66, 4), rug: phong(0xb0a690, 2),
    black: phong(0x0c0c0e, 60), stone: phong(0x8c8780, 8), kitchen: phong(0x2e2a26, 50), marble: phong(0xe6e2da, 90, { specular: 0x888888 }),
    asphalt: phong(0x2c2c2e, 4), line: phong(0xd8d4c8, 4), lawn: null,
  });
  return MAT;
}

/* ---- the lights: modern fittings, every one switchable, dimmable and colourable ---- */
function led(B, game, o) {
  const grp = o.group;
  const rec = B.fixture(Object.assign({ circuit: grp ? 'lodge' : 'main', kind: 'led', style: 'none', on: true, noFail: true, corona: 0.5 }, o, grp ? { chain: 'estate:' + grp } : {}));
  if (grp) game.estateLights[grp].push(rec.id);
  if (o.glow) {
    const g = o.glow, m = B.box(new THREE.MeshBasicMaterial({ color: 0x111111 }), g[0], g[1], g[2], g[3], g[4], g[5], g[6] || 0);
    m.userData.dynamic = true; rec.bulbBox = m;
  }
  rec.base = { colour: rec.colour, target: rec.target };
  rec.smart = !grp;
  return rec;
}
const downlight = (B, game, id, name, x, y, z, o) => led(B, game, Object.assign({ id, name, pos: [x, y - 0.05, z], colour: 0xfff0dc, target: 0.9, range: 7, corona: 0.2, glow: [x, y - 0.015, z, 0.16, 0.02, 0.16] }, o || {}));

/* a modern switch: a white glass keypad with a little light that shows what it does */
function keypad(B, game, id, label, pos, n, ids) {
  const [x, y, z] = pos, ry = Math.atan2(n[0], n[1]);
  B.box(mats().white, x + n[0] * 0.006, y, z + n[1] * 0.006, 0.09, 0.13, 0.012, ry);
  const dot = B.box(new THREE.MeshBasicMaterial({ color: 0x40a0ff }), x + n[0] * 0.014, y + 0.04, z + n[1] * 0.014, 0.012, 0.012, 0.004, ry); dot.userData.dynamic = true;
  const it = B.interactable({ id, label, pos: [x + n[0] * 0.02, y, z + n[1] * 0.02], n, act: g => { it.leverOn = g.toggleFittings(ids); } });
  it.switchVisual = { lever: new THREE.Group(), ids, ry, dot };
  it.controls = ids;
  it.leverOn = true;
  return it;
}

/* a solid wall or slab by extents, and glass the same way (both stop you) */
const solid = (B, mat, x0, x1, y0, y1, z0, z1, tag) => B.solid(mat, x0, x1, y0, y1, z0, z1, { kind: 'wall', tag: tag || 'wall' });
function glassWall(B, axis, c, a0, a1, y0, y1, step) {
  // full-height glazing between slim black mullions
  const M = mats(), t = 0.04;
  if (axis === 'x') solid(B, M.glazing, a0, a1, y0, y1, c - t, c + t, 'glass'); else solid(B, M.glazing, c - t, c + t, y0, y1, a0, a1, 'glass');
  for (let a = a0; a <= a1 + 0.01; a += step || 3.25) {
    if (axis === 'x') B.boxE(M.steel, a - 0.04, a + 0.04, y0, y1, c - 0.07, c + 0.07); else B.boxE(M.steel, c - 0.07, c + 0.07, y0, y1, a - 0.04, a + 0.04);
  }
}
/* an automatic sliding glass door: it opens as you walk up to it */
function slider(B, game, o) {
  const M = mats(), panels = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); B.root.add(g);
    const w = o.w / 2;
    if (o.axis === 'x') { g.position.set(o.at + s * w / 2, o.y0, o.c); B.box(M.glass, 0, o.h / 2, 0, w, o.h, 0.04, 0, g); }
    else { g.position.set(o.c, o.y0, o.at + s * w / 2); B.box(M.glass, 0, o.h / 2, 0, 0.04, o.h, w, 0, g); }
    // frame: a slim black edge
    if (o.axis === 'x') { B.box(M.steel, s * w / 2, o.h / 2, 0, 0.05, o.h, 0.06, 0, g); B.box(M.steel, 0, 0.03, 0, w, 0.06, 0.06, 0, g); }
    else { B.box(M.steel, 0, o.h / 2, s * w / 2, 0.06, o.h, 0.05, 0, g); B.box(M.steel, 0, 0.03, 0, 0.06, 0.06, w, 0, g); }
    g.traverse(m => { m.userData.dynamic = true; m.matrixAutoUpdate = true; });
    panels.push({ g, s, home: o.axis === 'x' ? g.position.x : g.position.z });
  }
  const wall = o.axis === 'x' ? B.phys.addWall(o.at - o.w / 2, o.at + o.w / 2, o.c - 0.1, o.c + 0.1, o.y0, o.y0 + o.h, { kind: 'door', tag: o.id })
    : B.phys.addWall(o.c - 0.1, o.c + 0.1, o.at - o.w / 2, o.at + o.w / 2, o.y0, o.y0 + o.h, { kind: 'door', tag: o.id });
  const d = Object.assign({ panels, wall, t: 0 }, o);
  game.halcyon.sliders.push(d);
  return d;
}

BM.buildHalcyon = function (B, game) {
  const M = mats(), P = B.phys, rnd = BM.mulberry32(2026);
  M.lawn = 'grass'; B.plain = true;
  const HC = game.halcyon = { sliders: [], trees: [], scene: 'evening', colour: 'warm', bright: 1, t: 0 };
  game.estateLights = {};
  game.estateGroups = [['hgate', 'Gates & entry'], ['hdrive', 'Driveway'], ['htrees', 'Tree uplights'], ['hgarden', 'Garden & paths'], ['hfacade', 'House facade'],
    ['hfence', 'Boundary wash'], ['hcourt', 'Forecourt & fountain'], ['hlake', 'Lake & jetty'], ['hroof', 'Roof terrace'], ['hpool', 'Pool terrace']];
  for (const [k] of game.estateGroups) game.estateLights[k] = [];
  BM.ESTATE_PLACES = { LK: { cx: LAKE.cx, cz: -75, rx: 40, rz: 25, y: LAKE.y } };   // (where the fireworks go up)
  BM.ROOF_BOXES.manor.value = 0;
  BM.ROOF_BOXES.box1.value.set(H.x0 - 0.5, H.x1 + 0.5, H.z0 - 0.5, H.z1 + 0.5); BM.ROOF_BOXES.box2.value.set(GA.x0 - 0.5, GA.x1 + 0.5, GA.z0 - 0.5, GA.z1 + 0.5); BM.ROOF_BOXES.top.value.set(ROOF + 0.2, GA.h + 0.2);
  game.gates = { open: false, t: 0, closing: false, lockedIn: false, escaping: false };

  /* ================= THE GROUND ================= */
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  // the section and the road outside it: one walkable plane; the lawn, the road and the verge laid over it
  B.floor(null, -150, 150, SECTION.z0, 130, 0, 0.3);
  // (the lawn stops at the back of the house: the terrace behind it is all stone, with the pool cut into it; and either side of the terrace)
  { const lawn = B.mesh(G.plane, 'grass', 0, 0.001, (H.z0 + SECTION.z1) / 2, SECTION.x1 - SECTION.x0 + 60, SECTION.z1 - H.z0, 1); lawn.rotation.x = -Math.PI / 2; lawn.updateMatrix(); }
  for (const s of [-1, 1]) { const x0 = s < 0 ? SECTION.x0 - 30 : H.x1 + 4, x1 = s < 0 ? H.x0 - 4 : SECTION.x1 + 30, l2 = B.mesh(G.plane, 'grass', (x0 + x1) / 2, 0.001, (SECTION.z0 + H.z0) / 2, x1 - x0, H.z0 - SECTION.z0, 1); l2.rotation.x = -Math.PI / 2; l2.updateMatrix(); }
  { const v = B.mesh(G.plane, 'grass', 0, 0.001, 118, 300, 30, 1); v.rotation.x = -Math.PI / 2; v.updateMatrix(); }
  B.boxE(M.asphalt, -150, 150, -0.02, 0.012, 103.5, 112.5);                     // the road
  for (let x = -146; x < 150; x += 6) B.boxE(M.line, x, x + 3, 0.012, 0.016, 107.9, 108.1);
  B.boxE(M.paver, -150, 150, 0, 0.02, 100.6, 103.5);                            // the footpath
  // the lake, beyond a stone edge with a glass balustrade
  { const w = B.mesh(G.plane, 'water', LAKE.cx, LAKE.y, -160, 600, 240, 1); w.rotation.x = -Math.PI / 2; w.updateMatrix(); }
  B.boxE(M.stone, -150, 150, LAKE.y - 1, 0.04, -40.6, -40);
  solid(B, M.glass, -70, 70, 0, 1.1, -40.3, -40.25, 'balustrade'); B.boxE(M.steel, -70, 70, 1.08, 1.12, -40.32, -40.22);
  for (const x of [-150, 150]) solid(B, null, x - 0.5, x + 0.5, 0, 3, SECTION.z0, 130);
  solid(B, null, -150, 150, 0, 3, 129.5, 130.5);
  solid(B, null, -150, -70, 0, 3, -40.6, -40);  solid(B, null, 70, 150, 0, 3, -40.6, -40);
  // the jetty: a timber deck out over the water, lit along both sides
  const JX = 34;
  B.floor(M.deck, JX - 1.6, JX + 1.6, -66, -40, 0.15, 0.2);
  for (let z = -64; z <= -42; z += 2.2) for (const s of [-1, 1]) B.box(M.deck, JX + s * 1.45, -0.4, z, 0.2, 1.2, 0.2);
  solid(B, M.glass, JX - 1.65, JX - 1.6, 0.15, 1.2, -66, -40.6); solid(B, M.glass, JX + 1.6, JX + 1.65, 0.15, 1.2, -66, -40.6); solid(B, M.glass, JX - 1.6, JX + 1.6, 0.15, 1.2, -66.05, -66);
  P.ramp(JX - 1.6, JX + 1.6, -40.2, -39.8, 'z', 0.15, 0, -0.3, 'jetty step');
  B.boxE(M.glass, JX - 1.65, JX - 1.6, 0.15, 1.2, -40, -40.6);
  for (let z = -64; z <= -42; z += 4.4) for (const s of [-1, 1]) {
    B.box(M.steel, JX + s * 1.62, 0.6, z, 0.08, 0.9, 0.08);
    led(B, game, { group: 'hlake', id: 'jetty-' + z + '-' + s, name: 'Jetty light', pos: [JX + s * 1.62, 1.08, z], colour: 0xfff0d8, target: 0.6, range: 5, corona: 0.8, glow: [JX + s * 1.62, 1.06, z, 0.07, 0.04, 0.07] });
  }
  led(B, game, { group: 'hlake', id: 'jetty-end', name: 'Jetty end light', pos: [JX, 0.4, -65.6], colour: 0x80c8ff, target: 1.0, range: 8, corona: 0.8, glow: [JX, 0.25, -65.8, 3, 0.04, 0.06] });
  // the lake edge: a line of uplights in the stone, and the glass rail lit from below
  for (let x = -66; x <= 66; x += 6) led(B, game, { group: 'hlake', id: 'edge-' + x, name: 'Lake edge light', pos: [x, 0.08, -40.1], spot: x % 12 === 0, dir: [0, 1, 0.1], colour: 0xd8ecff, target: 0.45, range: 4, corona: 0.5, glow: [x, 0.045, -40.1, 0.5, 0.01, 0.08] });

  /* ---- the boundary: a rendered wall with a black slatted fence on top, washed with light ---- */
  const fence = (axis, c, a0, a1) => {
    if (axis === 'x') { solid(B, M.render, a0, a1, 0, 0.9, c - 0.15, c + 0.15, 'boundary'); for (let a = a0; a < a1; a += 0.12) B.boxE(M.charcoal, a, a + 0.07, 0.9, 2.1, c - 0.04, c + 0.04); B.boxE(M.charcoal, a0, a1, 2.08, 2.14, c - 0.06, c + 0.06); solid(B, null, a0, a1, 0.9, 2.1, c - 0.05, c + 0.05); }
    else { solid(B, M.render, c - 0.15, c + 0.15, 0, 0.9, a0, a1, 'boundary'); for (let a = a0; a < a1; a += 0.12) B.boxE(M.charcoal, c - 0.04, c + 0.04, 0.9, 2.1, a, a + 0.07); B.boxE(M.charcoal, c - 0.06, c + 0.06, 2.08, 2.14, a0, a1); solid(B, null, c - 0.05, c + 0.05, 0.9, 2.1, a0, a1); }
  };
  fence('x', 100, SECTION.x0, -7); fence('x', 100, 7, SECTION.x1);
  fence('z', SECTION.x0, SECTION.z0, 100); fence('z', SECTION.x1, SECTION.z0, 100);
  for (let a = SECTION.z0 + 6; a < 100; a += 10) for (const x of [SECTION.x0 + 0.3, SECTION.x1 - 0.3]) led(B, game, { group: 'hfence', id: 'fence-' + x + '-' + a, name: 'Wall wash', pos: [x, 0.1, a], spot: false, colour: 0xfff1e0, target: 0.5, range: 4.5, corona: 0.2, glow: [x, 0.05, a, 0.12, 0.06, 0.12] });
  for (let a = SECTION.x0 + 6; a < 100 && a < SECTION.x1; a += 10) if (Math.abs(a) > 9) led(B, game, { group: 'hfence', id: 'fence-f' + a, name: 'Wall wash', pos: [a, 0.1, 99.6], colour: 0xfff1e0, target: 0.5, range: 4.5, corona: 0.2, glow: [a, 0.05, 99.6, 0.12, 0.06, 0.12] });

  /* ---- the gates: one wide sliding gate of black slats, on a motor, between two stone pillars ---- */
  for (const s of [-1, 1]) {
    solid(B, M.stone, s * 7 - 0.6, s * 7 + 0.6, 0, 2.8, 99.4, 100.6, 'gate pillar');
    B.boxE(M.charcoal, s * 7 - 0.7, s * 7 + 0.7, 2.8, 2.9, 99.3, 100.7);
    led(B, game, { group: 'hgate', id: 'pillar-' + s, name: 'Pillar light', pos: [s * 7, 2.6, 100.7], colour: 0xfff0dc, target: 0.9, range: 7, corona: 0.6, glow: [s * 7, 2.55, 100.62, 1.0, 0.04, 0.02] });
    led(B, game, { group: 'hgate', id: 'pillar-in-' + s, name: 'Pillar light', pos: [s * 7, 2.6, 99.3], colour: 0xfff0dc, target: 0.7, range: 6, corona: 0.6, glow: [s * 7, 2.55, 99.38, 1.0, 0.04, 0.02] });
  }
  // the house number, lit
  B.mesh(G.plane, BM.labelMat('HALCYON', { w: 256, h: 64, size: 30, bg: '#1a1a1c', fg: '#e8e0d0' }), 7, 1.8, 100.62, 0.9, 0.22, 1);
  // the intercom and a camera on the east pillar
  B.box(M.steel, 6.55, 1.35, 100.62, 0.14, 0.22, 0.04);
  const gate = new THREE.Group(); gate.position.set(0, 0, 100); B.root.add(gate);
  for (let x = -6.4; x <= 6.4; x += 0.16) B.box(M.charcoal, x, 1.1, 0, 0.1, 2.0, 0.06, 0, gate);
  B.box(M.charcoal, 0, 2.12, 0, 13.6, 0.08, 0.1, 0, gate); B.box(M.charcoal, 0, 0.08, 0, 13.6, 0.08, 0.1, 0, gate);
  const strip = B.box(new THREE.MeshBasicMaterial({ color: 0x111111 }), 0, 2.18, 0.0, 13.4, 0.03, 0.03, 0, gate);
  gate.traverse(m => { m.userData.dynamic = true; m.matrixAutoUpdate = true; });
  const gateLed = led(B, game, { group: 'hgate', id: 'gate-strip', name: 'Gate light strip', pos: [0, 2.3, 100], colour: 0xffffff, target: 0.5, range: 5, corona: 0 }); gateLed.bulbBox = strip;
  HC.gate = { g: gate, wall: P.addWall(-6.4, 6.4, 99.85, 100.15, 0, 2.2, { kind: 'door', tag: 'gate' }), t: 0, target: 0, auto: true, held: null };
  // the track it runs along, west of the opening, behind the wall
  B.boxE(M.steel, -20, 7, 0, 0.04, 99.9, 100.1);

  /* ---- the drive: pale pavers curving up through the lawns, bollards every few metres ---- */
  const DRIVE = [[0, 103], [0, 92], [4, 80], [8, 68], [7, 56], [3, 46], [0, 42]];
  HC.drive = DRIVE;
  let bi = 0;
  for (let i = 0; i < DRIVE.length - 1; i++) {
    const [ax, az] = DRIVE[i], [bx, bz] = DRIVE[i + 1], len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
    const seg = B.box(M.paver, (ax + bx) / 2, 0.01, (az + bz) / 2, 6, 0.02, len + 3.2, ang);
    for (const s of [-1, 1]) B.box(M.charcoal, (ax + bx) / 2 + Math.cos(ang) * s * 3.05, 0.015, (az + bz) / 2 - Math.sin(ang) * s * 3.05, 0.12, 0.03, len + 3.2, ang);
    for (let d = 0; d < len; d += 6) for (const s of [-1, 1]) {
      const t = d / len, x = ax + (bx - ax) * t + Math.cos(ang) * s * 3.6, z = az + (bz - az) * t - Math.sin(ang) * s * 3.6;
      B.box(M.charcoal, x, 0.45, z, 0.16, 0.9, 0.16);
      led(B, game, { group: 'hdrive', id: 'bollard-' + (bi++), name: 'Drive bollard', pos: [x, 0.78, z], colour: 0xfff0dc, target: 0.55, range: 5, corona: 0.4, glow: [x, 0.78, z, 0.17, 0.12, 0.17] });
    }
  }
  /* ---- the forecourt: a paved circle round a round fountain pool, and a side apron to the garage ---- */
  { const fc = B.mesh(G.cyl, M.paver, 0, 0.005, 30, 28, 0.02, 28); fc.userData.ground = true; }
  B.boxE(M.paver, -24, 24, 0, 0.02, 14, 22);
  B.boxE(M.paver, GA.x0, GA.x1, 0, 0.02, 14, 24);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; solid(B, null, Math.sin(a) * 5 - 0.9, Math.sin(a) * 5 + 0.9, 0, 0.5, 30 + Math.cos(a) * 5 - 0.9, 30 + Math.cos(a) * 5 + 0.9, 'fountain basin'); }   // (a ring of stops round the round pool)
  B.mesh(G.cyl, M.stone, 0, 0.25, 30, 10.4, 0.5, 10.4);
  { const fw = B.mesh(G.cyl, 'water', 0, 0.46, 30, 9.6, 0.02, 9.6); fw.userData.dynamic = true; HC.fountainWater = fw; }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; led(B, game, { group: 'hcourt', id: 'fountain-' + i, name: 'Fountain light', pos: [Math.sin(a) * 3.6, 0.42, 30 + Math.cos(a) * 3.6], colour: 0x9fd8ff, target: 0.6, range: 4, corona: 0.3 }); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0) continue; const x = Math.sin(a) * 13.6, z = 30 + Math.cos(a) * 13.6; led(B, game, { group: 'hcourt', id: 'court-' + i, name: 'Forecourt light', pos: [x, 0.05, z], colour: 0xfff0dc, target: 0.4, range: 4, corona: 0.4, glow: [x, 0.025, z, 0.18, 0.01, 0.18] }); }

  /* ---- the lawns: specimen trees, each uplit; low hedges; paths with step lights ---- */
  const tree = (x, z, s, kind) => {
    const h = 3.2 * s;
    B.mesh(G.post, 'bark', x, h / 2, z, 0.28 * s, h, 0.28 * s);
    if (kind === 'round') { B.mesh(G.sphere, 'leaves', x, h + 1.4 * s, z, 2.6 * s, 2.2 * s, 2.6 * s); B.mesh(G.sphere, 'leavesDark', x + 0.6 * s, h + 0.9 * s, z - 0.4 * s, 1.8 * s, 1.5 * s, 1.8 * s); }
    else { B.mesh(G.cone, 'pine', x, h + 2.6 * s, z, 2.0 * s, 6 * s, 2.0 * s); }
    P.addWall(x - 0.2 * s, x + 0.2 * s, z - 0.2 * s, z + 0.2 * s, 0, h, { kind: 'tree', occludes: false, tag: 'tree' });
    led(B, game, { group: 'htrees', id: 'uplight-' + HC.trees.length, name: 'Tree uplight', pos: [x + 0.9, 0.1, z + 0.9], spot: true, dir: [-0.25, 1, -0.25], colour: 0xf0f4ff, target: 1.0, range: 9, corona: 0.2, glow: [x + 0.9, 0.04, z + 0.9, 0.16, 0.04, 0.16] });
    HC.trees.push({ x, z });
  };
  const avoid = (x, z) => (Math.abs(x) < 16 && z > 14 && z < 46) || (x > -10 && x < 16 && z > 40 && z < 104) || (x > GA.x0 - 3 && x < H.x1 + 3 && z > H.z0 - 22 && z < 26);
  for (const [x, z, s, k] of [[-22, 70, 1.1, 'round'], [26, 72, 1.0, 'round'], [-30, 52, 1.2, 'round'], [34, 52, 1.1, 'round'], [-50, 86, 1.0, 'pine'], [52, 86, 1.0, 'pine'],
    [-58, 60, 1.1, 'pine'], [58, 60, 1.2, 'pine'], [-58, 30, 1.0, 'round'], [58, 30, 1.0, 'round'], [-60, 2, 1.1, 'pine'], [60, 2, 1.0, 'pine'], [-18, 88, 0.9, 'round'], [22, 90, 0.9, 'round'],
    [44, 14, 1.0, 'round'], [-60, -26, 1.0, 'round'], [60, -28, 1.0, 'round'], [46, -20, 0.9, 'pine']]) if (!avoid(x, z)) tree(x, z, s, k);
  // a ring of pines outside the section, dark against the sky
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, r = 120 + rnd() * 50, x = Math.sin(a) * r, z = 30 + Math.cos(a) * r; if (z < -40) continue; B.mesh(G.cone, 'pineDark', x, 6, z, 4, 12 + rnd() * 6, 4); }
  // hedges along the drive and round the forecourt
  for (const [x, z, w, d] of [[-14, 40, 0.8, 10], [14, 40, 0.8, 10], [-14, 26, 6, 0.8], [14, 26, 6, 0.8]]) B.furniture('hedge', x, z, 0, w, 1.0, d, 'hedge');
  // paths: from the forecourt round the east of the house to the lake, with step lights in the edge
  const PATH = [[16, 22], [30, 18], [32, 0], [32, -20], [34, -38]];
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1], len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
    B.box(M.paver, (ax + bx) / 2, 0.008, (az + bz) / 2, 1.6, 0.016, len + 1.6, ang);
    for (let d = 1; d < len; d += 3) { const t = d / len, x = ax + (bx - ax) * t + Math.cos(ang) * 0.95, z = az + (bz - az) * t - Math.sin(ang) * 0.95; led(B, game, { group: 'hgarden', id: 'path-' + i + '-' + d, name: 'Path light', pos: [x, 0.06, z], colour: 0xfff0dc, target: 0.35, range: 3, corona: 0.3, glow: [x, 0.03, z, 0.14, 0.03, 0.06, ang] }); }
  }
  HC.path = PATH;

  /* ================= THE HOUSE ================= */
  B.zone = 'mansion'; B.room = 'house';
  // slabs: the ground floor, the first floor with the atrium and stairs open, the roof
  B.levelName = 'ground';
  B.boxE(M.floor, H.x0, H.x1, 0, 0.02, H.z0, H.z1);
  B.levelName = 'upper';
  B.floor(M.concrete, H.x0, H.x1, H.z0, H.z1, F1, 0.3, [VOID]);
  B.boxE(M.oak, H.x0, VOID[0], F1 - 0.005, F1 + 0.01, H.z0, H.z1); B.boxE(M.oak, VOID[1], H.x1, F1 - 0.005, F1 + 0.01, H.z0, H.z1); B.boxE(M.oak, VOID[0], VOID[1], F1 - 0.005, F1 + 0.01, H.z0, VOID[2]);
  B.levelName = 'attic';
  B.floor(M.deck, H.x0 - 1.5, H.x1 + 1.5, H.z0 - 1.5, H.z1 + 1.5, ROOF, 0.3, [[ST2.x0, ST2.x1, ST2.z0, ST2.z1], [LIFT.x0, LIFT.x1, LIFT.z0, LIFT.z1]]);
  // the deep fascia round the overhang: the roof seems to float
  for (const [x0, x1, z0, z1] of [[H.x0 - 1.5, H.x1 + 1.5, H.z1, H.z1 + 1.5], [H.x0 - 1.5, H.x1 + 1.5, H.z0 - 1.5, H.z0], [H.x1, H.x1 + 1.5, H.z0, H.z1], [H.x0 - 1.5, H.x0, H.z0, H.z1]]) B.boxE(M.charcoal, x0, x1, ROOF - 0.6, ROOF - 0.3, z0, z1);
  B.levelName = 'ground';

  /* ---- the ground floor ---- */
  B.room = 'living room';
  glassWall(B, 'x', H.z0, H.x0, -2.2, 0, F1 - 0.3); glassWall(B, 'x', H.z0, 2.2, H.x1, 0, F1 - 0.3);
  slider(B, game, { id: 'terrace-door', axis: 'x', at: 0, c: H.z0, w: 4.4, h: F1 - 0.3, y0: 0 });
  B.boxE(M.steel, -2.2, 2.2, F1 - 0.3, F1 - 0.24, H.z0 - 0.08, H.z0 + 0.08);
  // the front: stone either side, the atrium all glass, the front doors in the middle
  B.room = 'atrium';
  solid(B, M.stone, H.x0, VOID[0], 0, ROOF - 0.3, H.z1 - 0.3, H.z1, 'front wall'); solid(B, M.stone, VOID[1], H.x1, 0, ROOF - 0.3, H.z1 - 0.3, H.z1, 'front wall');
  glassWall(B, 'x', H.z1 - 0.15, VOID[0], -1.4, 0, ROOF - 0.3, 2.3); glassWall(B, 'x', H.z1 - 0.15, 1.4, VOID[1], 0, ROOF - 0.3, 2.3);
  solid(B, M.glass, -1.4, 1.4, 2.8, ROOF - 0.3, H.z1 - 0.19, H.z1 - 0.11); B.boxE(M.steel, -1.4, 1.4, 2.76, 2.84, H.z1 - 0.2, H.z1 - 0.1);
  slider(B, game, { id: 'front-door', axis: 'x', at: 0, c: H.z1 - 0.15, w: 2.8, h: 2.76, y0: 0 });
  // a deep canopy over the door
  B.boxE(M.charcoal, -6, 6, 3.2, 3.45, H.z1, H.z1 + 4.5);
  // the sides
  solid(B, M.stone, H.x0 - 0.3, H.x0, 0, ROOF - 0.3, H.z0, 6.5, 'west wall'); solid(B, M.stone, H.x0 - 0.3, H.x0, 0, ROOF - 0.3, 8.1, H.z1, 'west wall'); solid(B, M.stone, H.x0 - 0.3, H.x0, 2.4, ROOF - 0.3, 6.5, 8.1, 'west wall');
  glassWall(B, 'z', H.x1, H.z0, 2, 0, ROOF - 0.3); solid(B, M.stone, H.x1, H.x1 + 0.3, 0, ROOF - 0.3, 2, H.z1, 'east wall');
  // inner rooms: the security room by the front door, the cinema across the hall
  B.room = 'security room';
  solid(B, M.render, -14.15, -13.95, 0, F1 - 0.3, 2, 9.9); solid(B, M.render, -14.15, -13.95, 0, F1 - 0.3, 11.1, H.z1 - 0.3); solid(B, M.render, -14.15, -13.95, 2.3, F1 - 0.3, 9.9, 11.1);
  solid(B, M.render, H.x0, -14.15, 0, F1 - 0.3, 1.9, 2.1);
  B.room = 'cinema';
  solid(B, M.charcoal, 13.95, 14.15, 0, F1 - 0.3, 2, 3.2); solid(B, M.charcoal, 13.95, 14.15, 0, F1 - 0.3, 4.4, H.z1 - 0.3); solid(B, M.charcoal, 13.95, 14.15, 2.3, F1 - 0.3, 3.2, 4.4);
  solid(B, M.charcoal, 14.15, H.x1, 0, F1 - 0.3, 1.9, 2.1);
  // the floating stairs: oak treads cantilevered off the atrium wall, a light under each
  B.room = 'atrium';
  P.ramp(ST1.x0, ST1.x1, ST1.z0, ST1.z1, 'z', F1, 0, -0.3, 'floating stairs');
  { const n = 23; for (let i = 0; i < n; i++) { const z = ST1.z1 - (i + 0.5) * (ST1.z1 - ST1.z0) / n, y = (i + 1) * F1 / n; B.boxE(M.oak, ST1.x0, ST1.x1, y - 0.06, y, z - 0.14, z + 0.14);
    if (i % 3 === 1) led(B, game, { id: 'stair-' + i, name: 'Stair light', room: 'atrium', pos: [ST1.x1 - 0.7, y - 0.1, z], colour: 0xfff0dc, target: 0.25, range: 2.5, corona: 0, glow: [(ST1.x0 + ST1.x1) / 2, y - 0.065, z, ST1.x1 - ST1.x0 - 0.1, 0.008, 0.2] }); } }
  solid(B, M.glass, ST1.x1, ST1.x1 + 0.03, 0, F1 + 1.0, ST1.z0, ST1.z1, 'stair rail');
  // the second flight, to the roof
  B.levelName = 'upper'; B.room = 'landing';
  P.ramp(ST2.x0, ST2.x1, ST2.z0, ST2.z1, 'z', ROOF, F1, F1 - 0.3, 'roof stairs');
  { const n = 23; for (let i = 0; i < n; i++) { const z = ST2.z1 - (i + 0.5) * (ST2.z1 - ST2.z0) / n, y = F1 + (i + 1) * (ROOF - F1) / n; B.boxE(M.oak, ST2.x0, ST2.x1, y - 0.06, y, z - 0.14, z + 0.14); } }
  solid(B, M.glass, ST2.x0 - 0.03, ST2.x0, F1, ROOF + 1.0, ST2.z0, ST2.z1, 'stair rail');
  B.levelName = 'ground';

  /* ---- the first floor ---- */
  B.levelName = 'upper';
  glassWall(B, 'x', H.z0, H.x0, H.x1, F1, ROOF - 0.3);
  // the gallery round the atrium: a glass balustrade
  solid(B, M.glass, ST1.x1, VOID[1], F1, F1 + 1.05, VOID[2] - 0.02, VOID[2] + 0.02, 'balustrade');
  solid(B, M.glass, VOID[1] - 0.02, VOID[1] + 0.02, F1, F1 + 1.05, VOID[2], LIFT.z0, 'balustrade'); solid(B, M.glass, VOID[1] - 0.02, VOID[1] + 0.02, F1, F1 + 1.05, LIFT.z1, H.z1 - 0.3, 'balustrade');   // (open where the lift's bridge meets it)
  solid(B, M.glass, VOID[0] - 0.02, VOID[0] + 0.02, F1, F1 + 1.05, ST1.z1, H.z1 - 0.3, 'balustrade');
  // bedrooms on the lake side, a study and a bathroom at the front
  B.room = 'master suite';
  solid(B, M.render, 7.9, 8.1, F1, ROOF - 0.3, H.z0, -4.6); solid(B, M.render, 7.9, 8.1, F1, ROOF - 0.3, -3.4, 1.9); solid(B, M.render, 7.9, 8.1, F1 + 2.3, ROOF - 0.3, -4.6, -3.4);
  solid(B, M.render, 8.1, H.x1, F1, ROOF - 0.3, 1.9, 2.1);
  B.room = 'guest room';
  solid(B, M.render, -8.1, -7.9, F1, ROOF - 0.3, H.z0, -4.6); solid(B, M.render, -8.1, -7.9, F1, ROOF - 0.3, -3.4, 1.9); solid(B, M.render, -8.1, -7.9, F1 + 2.3, ROOF - 0.3, -4.6, -3.4);
  solid(B, M.render, H.x0, -8.1, F1, ROOF - 0.3, 1.9, 2.1);
  B.levelName = 'ground';

  /* ---- the roof terrace: a glass balustrade all round ---- */
  B.levelName = 'attic'; B.room = 'roof terrace';
  const RX0 = H.x0 - 1.5, RX1 = H.x1 + 1.5, RZ0 = H.z0 - 1.5, RZ1 = H.z1 + 1.5;
  solid(B, M.glass, RX0, RX1, ROOF, ROOF + 1.1, RZ0, RZ0 + 0.05, 'balustrade'); solid(B, M.glass, RX0, RX1, ROOF, ROOF + 1.1, RZ1 - 0.05, RZ1, 'balustrade');
  solid(B, M.glass, RX0, RX0 + 0.05, ROOF, ROOF + 1.1, RZ0, RZ1, 'balustrade'); solid(B, M.glass, RX1 - 0.05, RX1, ROOF, ROOF + 1.1, RZ0, RZ1, 'balustrade');
  for (const [x0, x1, z0, z1] of [[RX0, RX1, RZ0, RZ0 + 0.06], [RX0, RX1, RZ1 - 0.06, RZ1], [RX0, RX0 + 0.06, RZ0, RZ1], [RX1 - 0.06, RX1, RZ0, RZ1]]) {
    const len = Math.max(x1 - x0, z1 - z0), ax = x1 - x0 > z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    led(B, game, { group: 'hroof', id: 'roofstrip-' + Math.round(cx) + '-' + Math.round(cz), name: 'Roof edge strip', pos: [cx, ROOF + 0.2, cz], colour: 0xfff0dc, target: 0.6, range: 6, corona: 0, glow: [cx, ROOF + 0.03, cz, ax ? len : 0.04, 0.03, ax ? 0.04 : len] });
  }
  // a hatch-box over the top of the stairs
  solid(B, M.charcoal, ST2.x0 - 0.3, ST2.x1 + 0.3, ROOF, ROOF + 2.6, ST2.z1, ST2.z1 + 0.3); solid(B, M.charcoal, ST2.x0 - 0.3, ST2.x0, ROOF, ROOF + 2.6, ST2.z0, ST2.z1); solid(B, M.charcoal, ST2.x1, ST2.x1 + 0.3, ROOF, ROOF + 2.6, ST2.z0, ST2.z1);
  B.boxE(M.charcoal, ST2.x0 - 0.3, ST2.x1 + 0.3, ROOF + 2.6, ROOF + 2.8, ST2.z0, ST2.z1 + 0.3);
  B.levelName = 'ground';

  /* ---- the garage wing ---- */
  B.room = 'garage';
  B.boxE(M.floor, GA.x0, GA.x1, 0, 0.02, GA.z0, GA.z1);
  solid(B, M.stone, GA.x0, GA.x1, 0, GA.h, GA.z0, GA.z0 + 0.3); solid(B, M.stone, GA.x0, GA.x0 + 0.3, 0, GA.h, GA.z0, GA.z1);
  B.floor(M.charcoal, GA.x0 - 0.5, GA.x1, GA.z0 - 0.5, GA.z1 + 0.5, GA.h + 0.3, 0.3);
  // the front: two wide openings onto the apron (their doors come with the cars)
  solid(B, M.stone, GA.x0, GA.x0 + 1, 0, GA.h, GA.z1 - 0.3, GA.z1); solid(B, M.stone, -36.6, -35.4, 0, GA.h, GA.z1 - 0.3, GA.z1); solid(B, M.stone, GA.x1 - 0.6, GA.x1, 0, GA.h, GA.z1 - 0.3, GA.z1);
  solid(B, M.stone, GA.x0 + 1, GA.x1 - 0.6, 3.2, GA.h, GA.z1 - 0.3, GA.z1);
  HC.garageOpenings = [[GA.x0 + 1, -36.6], [-35.4, GA.x1 - 0.6]];

  /* ---- the facade lights: washers along the front, a glowing strip under the floating roof, and the canopy ---- */
  B.zone = 'exterior'; B.room = 'grounds';
  for (let x = H.x0 + 2; x < H.x1; x += 4) {
    if (Math.abs(x) < 6.5) continue;
    led(B, game, { group: 'hfacade', id: 'washer-' + x, name: 'Facade washer', pos: [x, 0.1, H.z1 + 0.5], spot: true, dir: [0, 1, -0.12], colour: 0xffe8cc, target: 1.8, range: 12, corona: 0.3, glow: [x, 0.04, H.z1 + 0.5, 0.3, 0.05, 0.1] });
  }
  led(B, game, { group: 'hfacade', id: 'soffit-front', name: 'Roof soffit strip', pos: [0, ROOF - 0.8, H.z1 + 1.2], colour: 0xfff0dc, target: 0.8, range: 12, corona: 0, glow: [0, ROOF - 0.61, H.z1 + 1.4, H.x1 - H.x0 + 2.8, 0.02, 0.06] });
  led(B, game, { group: 'hfacade', id: 'soffit-back', name: 'Roof soffit strip', pos: [0, ROOF - 0.8, H.z0 - 1.2], colour: 0xfff0dc, target: 0.8, range: 12, corona: 0, glow: [0, ROOF - 0.61, H.z0 - 1.4, H.x1 - H.x0 + 2.8, 0.02, 0.06] });
  led(B, game, { group: 'hfacade', id: 'soffit-east', name: 'Roof soffit strip', pos: [H.x1 + 1.2, ROOF - 0.8, -2], colour: 0xfff0dc, target: 0.6, range: 10, corona: 0, glow: [H.x1 + 1.4, ROOF - 0.61, -2, 0.06, 0.02, H.z1 - H.z0 + 2.8] });
  led(B, game, { group: 'hfacade', id: 'canopy', name: 'Canopy downlights', pos: [0, 3.1, H.z1 + 2.2], colour: 0xfff0dc, target: 1.1, range: 8, corona: 0.2, glow: [0, 3.19, H.z1 + 2.2, 9, 0.01, 0.12] });
  for (const x of [-40, -31]) led(B, game, { group: 'hfacade', id: 'garage-wash-' + x, name: 'Garage wash', pos: [x, GA.h - 0.2, GA.z1 + 0.4], colour: 0xfff0dc, target: 0.7, range: 7, corona: 0.2, glow: [x, GA.h - 0.15, GA.z1 + 0.35, 2.5, 0.03, 0.06] });

  /* ---- the pool terrace: stone from the house to the lake edge ---- */
  // (laid round the infinity pool, which is cut into it: see 82-halcyon-outside.js)
  const PL = BM.HALCYON_POOL = { x0: -16, x1: 16, z0: -34, z1: -24, trough: -35.4 };
  B.boxE(M.paver, H.x0 - 4, H.x1 + 4, 0, 0.02, PL.z1, H.z0); B.boxE(M.paver, H.x0 - 4, H.x1 + 4, 0, 0.02, -40, PL.trough);
  B.boxE(M.paver, H.x0 - 4, PL.x0, 0, 0.02, PL.trough, PL.z1); B.boxE(M.paver, PL.x1, H.x1 + 4, 0, 0.02, PL.trough, PL.z1);
  for (let x = -24; x <= 24; x += 8) for (const z of [-21, -38]) led(B, game, { group: 'hpool', id: 'terrace-' + x + '-' + z, name: 'Terrace light', pos: [x, 0.05, z], colour: 0xfff0dc, target: 0.35, range: 4, corona: 0.3, glow: [x, 0.025, z, 0.16, 0.01, 0.16] });

  /* ================= INSIDE: THE SMART LIGHTS ================= */
  B.zone = 'mansion';
  const room = (name, level, x0, x1, z0, z1, ceil, sw, step) => {
    B.room = name; B.levelName = level; const ids = []; step = step || 3.2;
    for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) ids.push(downlight(B, game, name.replace(/\W+/g, '-') + '-' + Math.round(x * 10) + '-' + Math.round(z * 10), 'Downlight', x, ceil, z).id);
    return ids;
  };
  const sw = (name, level, ids, pos, n) => keypad(B, game, 'k-' + name.replace(/\W+/g, '-'), name.charAt(0).toUpperCase() + name.slice(1) + ' lights', pos, n, ids);
  // ground floor
  const living = room('living room', 'ground', -26, 6, -18, 2, F1 - 0.3, 0, 4);
  const cove = led(B, game, { id: 'living-cove', name: 'Cove light', room: 'living room', pos: [-10, F1 - 0.6, -2], colour: 0xffe6c8, target: 0.8, range: 14, corona: 0, glow: [-10, F1 - 0.32, 1.7, 32, 0.03, 0.06] });
  sw('living room', 'ground', living.concat(cove.id), [H.x0 + 0.02, 1.3, -6], [1, 0]);
  const kitchen = room('kitchen', 'ground', 6, 26, -18, 2, F1 - 0.3, 0, 4);
  B.room = 'kitchen';
  B.furniture(M.kitchen, 15, -8, 0, 7, 0.92, 1.6, 'kitchen island'); B.boxE(M.marble, 11.4, 18.6, 0.92, 0.96, -8.9, -7.1);
  const pend = []; for (const x of [12.5, 15, 17.5]) { B.box(M.steel, x, F1 - 0.9, -8, 0.01, 1.2, 0.01); pend.push(led(B, game, { id: 'island-' + x, name: 'Island pendant', room: 'kitchen', pos: [x, F1 - 1.6, -8], colour: 0xffd8a8, target: 0.7, range: 5, corona: 0.4, glow: [x, F1 - 1.55, -8, 0.32, 0.18, 0.32] }).id); }
  B.furniture(M.kitchen, 22, -0.5, 0, 7, 0.92, 0.7, 'kitchen bench'); B.boxE(M.marble, 18.5, 25.5, 0.92, 0.96, -0.85, -0.15);
  sw('kitchen', 'ground', kitchen.concat(pend), [20, 1.3, 1.88], [0, -1]);
  const atrium = room('atrium', 'ground', -6, 6, 2, 14, ROOF - 0.35, 0, 4);
  sw('atrium', 'ground', atrium, [-8, 1.3, H.z1 - 0.32], [0, -1]);
  const sec = room('security room', 'ground', -26, -14, 2, 14, F1 - 0.3);
  sw('security room', 'ground', sec, [-14.17, 1.3, 12.2], [-1, 0]);
  const cin = room('cinema', 'ground', 14, 26, 2, 14, F1 - 0.3);
  sw('cinema', 'ground', cin, [14.17, 1.3, 5.2], [1, 0]);
  const gar = room('garage', 'ground', GA.x0, GA.x1, GA.z0, GA.z1, GA.h, 0, 4);
  sw('garage', 'ground', gar, [GA.x1 - 0.32, 1.3, 9.0], [-1, 0]);
  // first floor
  const master = room('master suite', 'upper', 8, 26, -18, 2, ROOF - 0.3, 0, 4);
  sw('master suite', 'upper', master, [8.12, F1 + 1.3, -2.8], [1, 0]);
  const guest = room('guest room', 'upper', -26, -8, -18, 2, ROOF - 0.3, 0, 4);
  sw('guest room', 'upper', guest, [-8.12, F1 + 1.3, -2.8], [-1, 0]);
  const land = room('landing', 'upper', -8, 8, -18, 2, ROOF - 0.3, 0, 4);
  sw('landing', 'upper', land, [7.88, F1 + 1.3, -8], [-1, 0]);
  const front1 = room('study and bath', 'upper', -26, -6, 2, 14, ROOF - 0.3, 0, 4).concat(room('study and bath', 'upper', 6, 26, 2, 14, ROOF - 0.3, 0, 4));
  sw('study and bath', 'upper', front1, [12, F1 + 1.3, 2.12], [0, 1]);
  B.levelName = 'ground'; B.room = 'house';

  /* a few pieces of furniture, so the rooms read as rooms */
  B.room = 'living room';
  B.furniture(M.sofa, -12, -12, 0, 6, 0.75, 1.0, 'sofa'); B.furniture(M.sofa, -15.5, -9.5, 0, 1.0, 0.75, 4, 'sofa');
  B.boxE(M.rug, -16, -8, 0.02, 0.03, -13.5, -6.5); B.furniture(M.black, -12, -9.5, 0, 2.2, 0.4, 1.1, 'coffee table');
  B.furniture(M.oak, 2, -12, 0, 2.6, 0.76, 1.1, 'dining table');
  B.room = 'master suite'; B.levelName = 'upper';
  B.furniture(M.white, 18, -10, F1, 2.2, 0.55, 2.4, 'bed'); B.boxE(M.charcoal, 16.8, 19.2, F1, F1 + 1.2, -11.3, -11.15);
  B.room = 'guest room';
  B.furniture(M.white, -18, -10, F1, 1.9, 0.55, 2.2, 'bed');
  B.levelName = 'ground'; B.room = 'house';
  BM.buildHalcyonSmart(B, game);
  BM.buildHalcyonOutside(B, game);
  BM.buildHalcyonInside(B, game);
  BM.buildHalcyonTech(B, game);
};
BM.halcyonMats = mats;
BM.halcyonLed = (B, game, o) => led(B, game, o);

/* ---- once the game is up: the power on, the lights steady, you at the gate ---- */
BM.afterHalcyonInit = function (game) {
  const g = game.grid;
  g.failureRate = 0; g.stormHasTripped = true;
  g.setLodge(true); g.throwMain();
  for (const l of g.lights) { l.noFail = true; if (l.base) l.on = true; }
  const p = game.player; p.x = START.x; p.y = START.y; p.z = START.z; p.yaw = START.yaw; p.safe = { x: START.x, y: START.y, z: START.z };
  game.clock = 20 * 60 + 3600 * -3;   // (the phone's clock reads about eight in the evening)
  BM.halcyonScene(game, 'evening', true);
};

BM.beginHalcyon = function (game) {
  game.audio.stopTheme && game.audio.stopTheme(4);
  game.ui.mode = null;
  if (game.ui.el.title) game.ui.el.title.style.display = 'none';
  game.audio.start();
  BM.applyNight(game, game.chosenNight || (game.menu && game.menu.settings.night) || 'clear');
  BM.setTimeOfDay(game, (game.menu && game.menu.settings.time) || 'night');
  if (game.menu) game.menu.lock();
  game.ui.say('Halcyon House. The gate slides open as you walk up to it. Every light here is yours to play with: Tab for the panel, 1–0 for the grounds, H for all the keys.', 8);
};

/* After the light: lit rooms fill with their own bounce, and from outside the glass glows warm */
BM.halcyonAfterFx = function (game) {
  const HC = game.halcyon; if (!HC || !game.fx || !game.fx.hemi) return;
  let n = 0, on = 0; const k = HC.inside || (HC.inside = game.grid.lights.filter(l => l.smart));
  for (const l of k) { n++; if (l.intensity > 0.05) on += Math.min(1, l.intensity / Math.max(0.01, l.target || 1)); }
  const f = n ? on / n : 0, inHouse = game.ctx && game.ctx.zone === 'house';
  const p = game.player, inCinema = HC.cinema && p.x > 14 && p.z > 2 && p.y < 4 && inHouse;
  game.fx.hemi.intensity += (inHouse ? 0.55 : 0.08) * f * HC.bright * (inCinema ? 1 - 0.9 * HC.cinema.dim : 1);
  if (inHouse) game.fx.hemi.color.lerp(HC.tint || (HC.tint = new THREE.Color(0xffe2c0)), 0.5 * f);
  const gl = mats().glazing; gl.emissive.setHex(HC.glow || 0xffd9a8).multiplyScalar(0.11 * f * HC.bright * (1 + 2.5 * (HC.frost || 0)));
};
BM.halcyonZone = function (x, y, z) {
  if (y > -1 && y < ROOF - 0.2 && x > H.x0 && x < H.x1 && z > H.z0 && z < H.z1) return 'house';
  if (y > -1 && y < GA.h && x > GA.x0 && x < GA.x1 && z > GA.z0 && z < GA.z1) return 'house';
  return 'exterior';
};
BM.halcyonObjective = function (game) {
  const p = game.player;
  if (p.z > 100) return 'Halcyon House. Walk up to the gates.';
  return 'Explore. Tab: the lighting panel · 1–0: the grounds · G: the gates · H: every key.';
};

/* the gate: G opens or closes it; it also opens by itself as you walk up, and closes behind you */
BM.halcyonGate = function (game) {
  const G0 = game.halcyon.gate;
  G0.held = G0.target ? 'closed' : 'open'; G0.target = G0.target ? 0 : 1;
  game.audio.clunk && game.audio.clunk(0.4);
  game.ui.say(G0.target ? 'The gate slides open on its motor, its light strip running ahead of it.' : 'The gate slides shut. (It will stay shut until you open it again.)', 4);
};
BM.halcyonDoors = function (game) {
  const HC = game.halcyon; HC.doorsHeld = !HC.doorsHeld;
  BM.halcyonSay(game, HC.doorsHeld ? 'Holding the doors open.' : 'Doors back on automatic.', 3);
};

BM.updateHalcyon = function (game, dt) {
  const HC = game.halcyon, p = game.player; if (!HC) return;
  HC.t += dt;
  // the gate: walk up to it and it opens; walk away and it closes (unless you have told it otherwise with G)
  const G0 = HC.gate, near = Math.abs(p.x) < 9 && Math.abs(p.z - 100) < 7;
  if (G0.held === null) G0.target = near ? 1 : 0;
  else if (G0.held === 'open' && !near && Math.abs(p.z - 100) > 30) { /* stays open */ }
  const was = G0.t;
  G0.t += Math.sign(G0.target - G0.t) * Math.min(Math.abs(G0.target - G0.t), dt / 5.5);
  if (G0.t !== was && game.audio.ctx && Math.random() < dt * 3) game.audio.tone('sawtooth', 70, 70, 0.012 * Math.max(0, 1 - Math.hypot(p.x, p.z - 100) / 30), 0.05, 0.35);
  G0.g.position.x = -12.9 * G0.t;
  G0.wall.enabled = G0.t < 0.55;
  game.gates.open = G0.t > 0.5; game.gates.t = G0.t; game.gates.closing = G0.target === 0 && G0.t > 0;
  // the sliding doors: they open as you come up to them, at their own level
  for (const d of HC.sliders) {
    const dx = d.axis === 'x' ? p.x - d.at : p.z - d.at, dc = d.axis === 'x' ? p.z - d.c : p.x - d.c;
    const want = HC.doorsHeld || (Math.abs(dx) < d.w / 2 + 1.0 && Math.abs(dc) < 3.0 && Math.abs(p.y - d.y0) < 1.5) ? 1 : 0;
    const before = d.t;
    d.t += Math.sign(want - d.t) * Math.min(Math.abs(want - d.t), dt / 0.9);
    if (before === 0 && d.t > 0 && game.audio.ctx) game.audio.burst(game.audio.white, 'bandpass', 900, 1, 0.05, 0.05, 0.5);
    const e = (1 - Math.cos(d.t * Math.PI)) / 2;
    for (const pn of d.panels) { const off = pn.s * e * (d.w / 2 - 0.05); if (d.axis === 'x') pn.g.position.x = pn.home + off; else pn.g.position.z = pn.home + off; }
    d.wall.enabled = d.t < 0.6;
  }
  // a glass house: inside, the air is as clear as outside
  const FE = BM.FOG.exterior, FH = BM.FOG.house; FH.colour.copy(FE.colour); FH.density = FE.density * 0.6;
  // the fountain's water shimmers
  if (HC.fountainWater) HC.fountainWater.position.y = 0.46 + Math.sin(HC.t * 2) * 0.004;
  BM.updateHalcyonSmart(game, dt);
  BM.updateHalcyonOutside(game, dt);
  BM.updateHalcyonInside(game, dt);
  BM.updateHalcyonTech(game, dt);
};
})();
