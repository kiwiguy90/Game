/* ==========================================================================
   BLACKTHORN MANOR — 6j. THE KITCHEN COURTYARD AND THE STORM CELLAR
   Behind the house, a walled yard the servants used: setts underfoot, a
   pump, the coal store, a water butt, the bins, a washing line nobody took
   in, lamps on the walls (floodlights group), an arch out to the gardens
   and a gate towards the garage. The kitchen door and the back door open
   onto it. Against the house wall, two sloping steel doors over a flight of
   steps down to the cellar: bolted from inside, so the first time you come
   through them it is from below.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const T = BM.TEX_EXTRA = BM.TEX_EXTRA || {};
T.setts = { size: 128, draw(g, s, r) { // granite setts in rows, moss in the joints
  g.fillStyle = '#3a4030'; g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 16) for (let x = (y / 16 % 2) * 12; x < s; x += 24) { const v = 80 + r() * 40; g.fillStyle = `rgb(${v | 0},${v - 4 | 0},${v - 10 | 0})`; g.fillRect(x + 1, y + 1, 22, 14); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 2, y + 2, 20, 3); }
  for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(r() * s, r() * s, 2, 2); }
} };
Object.assign(BM.MAT_DEFS, { setts: [0xffffff, 'setts', 0.5, 6, { bump: 2, weather: true }], coal: [0x14120f, 'gravel', 0.4, 30] });

BM.buildCourtyard = function (B, game) {
  const P = B.phys, grid = B.grid;
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'courtyard';
  const Y = { x0: -18, x1: 4, z0: -24, z1: -12 };
  const yardLight = (o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:flood' }, o)); game.estateLights.flood.push(l.id); return l; };

  /* ---- the ground: setts, with moss and standing water ---- */
  B.boxE('setts', Y.x0, Y.x1, 0.005, 0.03, Y.z0, Y.z1 - 0.2);
  for (let i = 0; i < 14; i++) { const x = Y.x0 + 1 + Math.random() * 20, z = Y.z0 + 1 + Math.random() * 10; B.box('moss', x, 0.032, z, 0.6 + Math.random() * 1.4, 0.004, 0.5 + Math.random() * 1.0, Math.random() * 3); }
  B.box('water', -8, 0.034, -19, 2.4, 0.003, 1.6, 0.3); B.box('water', 0, 0.034, -21.5, 1.6, 0.003, 1.2, 1.1);
  B.mesh(G.disc, 'grate', -6, 0.036, -16, 0.5); // the drain

  /* ---- the walls: brick, with an arch to the gardens and a gate towards the garage ---- */
  const H = 2.6;
  B.wall('z', Y.x0, Y.z0, Y.z1, { t: 0.4, mat: 'brick', y1: H });
  B.wall('x', Y.z0, Y.x0, Y.x1, { t: 0.4, mat: 'brick', y1: H }, [{ at: -7.5, w: 3.0, type: 'arch', head: 2.3, id: 'yard-arch' }]);
  B.wall('z', Y.x1, Y.z0, Y.z1, { t: 0.4, mat: 'brick', y1: H }, [{ at: -17.5, w: 1.5, type: 'arch', head: 2.2, id: 'yard-gate' }]);
  // the arch's stone head and the gate's posts and an open iron gate
  B.box('gothicTrim', -7.5, 2.45, Y.z0, 3.6, 0.3, 0.6); B.mesh(G.wedge, 'gothicTrim', -7.5, 2.6, Y.z0, 3.6, 0.5, 0.6);
  for (const z of [-18.35, -16.65]) B.box('gothicTrim', Y.x1, 1.3, z, 0.5, 2.6, 0.2);
  { const g = new THREE.Group(); g.position.set(Y.x1 - 0.1, 0, -18.25); g.rotation.y = -2.2; B.root.add(g);
    for (let i = 0; i < 7; i++) B.mesh(G.post, 'iron', 0, 1.0, 0.15 + i * 0.2, 0.03, 2.0, 0.03, 0, g);
    B.box('iron', 0, 0.3, 0.75, 0.04, 0.05, 1.4, 0, g); B.box('iron', 0, 1.8, 0.75, 0.04, 0.05, 1.4, 0, g); }
  // coping, and ivy over the top of the walls in places
  B.boxE('gothicTrim', Y.x0 - 0.3, Y.x1 + 0.3, H, H + 0.12, Y.z0 - 0.3, Y.z0 + 0.3);
  B.boxE('gothicTrim', Y.x0 - 0.3, Y.x0 + 0.3, H, H + 0.12, Y.z0, Y.z1); B.boxE('gothicTrim', Y.x1 - 0.3, Y.x1 + 0.3, H, H + 0.12, Y.z0, Y.z1);
  for (let i = 0; i < 9; i++) { const x = Y.x0 + 1 + i * 2.4; B.mesh(G.lowSphere, 'ivy', x, H - 0.3 - (i % 3) * 0.6, Y.z0 + 0.25, 1.2 + (i % 2) * 0.6, 1.4, 0.5); }
  for (let i = 0; i < 4; i++) B.mesh(G.lowSphere, 'ivy', Y.x0 + 0.25, H - 0.5 - i * 0.4, Y.z0 + 2 + i * 2.6, 0.5, 1.6, 1.3);

  /* ---- the yard's things ---- */
  // the pump
  B.mesh(G.post, 'iron', -4.0, 0.6, -20.0, 0.2, 1.2, 0.2); B.mesh(G.cyl, 'iron', -4.0, 1.25, -20.0, 0.26, 0.12, 0.26);
  B.box('iron', -4.0, 0.95, -20.25, 0.08, 0.08, 0.5); B.box('iron', -4.0, 1.1, -19.6, 0.05, 0.9, 0.05).rotation.z = 0.0;
  { const h = B.box('iron', -4.0, 1.35, -19.75, 0.04, 0.9, 0.04); h.rotation.x = 0.7; h.updateMatrix(); }
  B.box('stone', -4.0, 0.08, -20.0, 1.0, 0.16, 1.0); B.mesh(G.cyl, 'stone', -4.0, 0.3, -20.6, 0.5, 0.3, 0.5);
  P.addWall(-4.3, -3.7, -20.3, -19.7, 0, 1.4, { kind: 'furniture', tag: 'pump' });
  // the coal store against the west wall, half full
  B.solid('brick', Y.x0 + 0.2, Y.x0 + 2.6, 0, 1.6, -22.5, -20.0, { kind: 'furniture', tag: 'coal store' });
  B.boxE('boards', Y.x0 + 0.1, Y.x0 + 2.7, 1.6, 1.75, -22.6, -19.9);
  B.boxE('black', Y.x0 + 2.6, Y.x0 + 2.62, 0.1, 1.2, -22.2, -20.3);
  B.mesh(G.lowSphere, 'coal', Y.x0 + 2.0, 0.2, -21.2, 2.2, 0.5, 1.6);
  for (let i = 0; i < 20; i++) B.mesh(G.lowSphere, 'coal', Y.x0 + 2.4 + Math.random() * 1.4, 0.05, -22.3 + Math.random() * 2.4, 0.12, 0.08, 0.1);
  // the water butt under the downpipe, the bins, the mangle left out, crates
  B.mesh(G.cyl, 'boards', -16.6, 0.55, -12.8, 0.9, 1.1, 0.9); B.mesh(G.cyl, 'water', -16.6, 1.08, -12.8, 0.82, 0.04, 0.82);
  P.addWall(-17.05, -16.15, -13.25, -12.35, 0, 1.1, { kind: 'furniture', tag: 'water butt' });
  B.box('iron', -15.9, 2.2, -12.3, 0.1, 4.4, 0.1); B.box('iron', -16.3, 1.3, -12.5, 0.9, 0.08, 0.08);
  for (const [x, z] of [[2.6, -13.2], [2.6, -14.2]]) { B.mesh(G.cyl, 'metalDark', x, 0.45, z, 0.55, 0.9, 0.55); B.mesh(G.cyl, 'metalDark', x, 0.93, z, 0.6, 0.06, 0.6); P.addWall(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 0, 1, { kind: 'furniture', tag: 'dustbin' }); }
  B.box('iron', 2.5, 0.02, -15.1, 0.6, 0.04, 0.3, 0.4); // a lid blown off
  B.furniture('iron', -1.5, -22.8, 0, 0.8, 1.2, 0.5, 'mangle'); B.mesh(G.cyl, 'iron', -1.5, 1.1, -22.8, 0.14, 0.7, 0.14).rotation.z = Math.PI / 2;
  for (const [x, z, r] of [[1.2, -22.6, 0.3], [0.4, -22.9, 1.2]]) B.furniture('boards', x, z, 0, 0.6, 0.4, 0.5, 'crate');
  // the washing line: two posts, a sagging line, three grey sheets that never came in
  for (const x of [-13, -6]) B.mesh(G.post, 'boards', x, 1.1, -17.5, 0.08, 2.2, 0.08);
  B.box('wire', -9.5, 2.05, -17.5, 7.0, 0.012, 0.012);
  for (const [x, w] of [[-12.0, 1.1], [-9.2, 1.4], [-7.0, 0.9]]) { const sh = B.box('dustSheet', x, 1.45, -17.5, w, 1.2, 0.03); sh.rotation.y = 0.08; sh.updateMatrix(); }
  // a bench, broken pots, a bicycle against the wall, nettles in the corners
  B.furniture('boards', -8.0, -13.0, 0, 1.6, 0.45, 0.45, 'yard bench');
  for (let i = 0; i < 6; i++) { const x = -12 + i * 1.1, z = -23.3; B.mesh(G.cyl, 'brick', x, 0.12, z, 0.26 - (i % 3) * 0.04, 0.24, 0.26 - (i % 3) * 0.04); if (i % 2) B.mesh(G.lowSphere, 'deadStalk', x, 0.3, z, 0.3, 0.3, 0.3); }
  B.box('iron', 3.6, 0.5, -20.5, 0.06, 0.9, 1.6); for (const z of [-21.2, -19.8]) { const w = B.mesh(G.ring, 'iron', 3.5, 0.35, z, 0.68, 0.68, 0.68); w.rotation.y = Math.PI / 2; w.updateMatrix(); }
  for (const [x, z] of [[Y.x0 + 0.6, -13.0], [Y.x1 - 0.6, -23.3], [-7.5, -23.4]]) for (let k = 0; k < 7; k++) B.mesh(G.cone, 'deadGrass', x + (Math.random() - 0.5) * 0.8, 0.35, z + (Math.random() - 0.5) * 0.8, 0.35, 0.7, 0.35);
  BM.deadTree(B, 1.0, -19.5, 0.55, game, 77); // a sapling that seeded itself in the setts

  /* ---- the lamps: bulkheads over the doors, lanterns on the walls ---- */
  yardLight({ id: 'yard-door-lamp', name: 'Back door lamp', kind: 'incandescent', style: 'bulkhead', pos: [-3, 2.7, -12.25], nz: -1, colour: 0xffd7a0, target: 1.2, range: 8 });
  yardLight({ id: 'yard-kitchen-lamp', name: 'Kitchen door lamp', kind: 'incandescent', style: 'bulkhead', pos: [-15, 2.7, -12.25], nz: -1, colour: 0xffd7a0, target: 1.2, range: 8, flicker: 0.25, lightType: 'flicker' });
  yardLight({ id: 'yard-lantern-w', name: 'Yard lantern', kind: 'incandescent', style: 'lantern', pos: [Y.x0 + 0.35, 2.2, -18], nx: 1, colour: 0xffc070, target: 1.0, range: 9 });
  yardLight({ id: 'yard-lantern-n', name: 'Yard lantern', kind: 'incandescent', style: 'lantern', pos: [-2, 2.2, Y.z0 + 0.35], nz: 1, colour: 0xffc070, target: 1.0, range: 9 });
  yardLight({ id: 'yard-arch-lamp', name: 'Arch lamp', kind: 'incandescent', style: 'lantern', pos: [-9.6, 2.2, Y.z0 + 0.35], nz: 1, colour: 0xffc070, target: 0.9, range: 8, flicker: 0.45, lightType: 'flicker' });

  /* ---- the storm cellar: steps down through the house wall, under two sloping steel doors ---- */
  const SX0 = -13, SX1 = -11, SZ0 = -16.4, SZ1 = -12.4, CY = -3.2;
  B.levelName = 'cellar'; B.room = 'cellar';
  P.ramp(SX0, SX1, SZ0, SZ1, 'z', 0, CY, CY - 0.3, 'storm steps');
  P.rect(SX0, SX1, SZ1 - 0.1, -11.9, CY, CY - 0.3, 'storm landing');
  const n = 12;
  for (let i = 0; i < n; i++) { const z = SZ0 + (i + 0.5) * (SZ1 - SZ0) / n, top = CY * (i + 1) / n; B.boxE('stone', SX0, SX1, CY - 0.3, top, z - (SZ1 - SZ0) / n / 2 - 0.01, z + (SZ1 - SZ0) / n / 2); }
  B.boxE('stone', SX0, SX1, CY - 0.3, CY, SZ1 - 0.1, -11.9);
  // the stairwell's walls: brick, rising to a low parapet above the yard
  B.solid('brick', SX0 - 0.4, SX0, CY - 0.3, 0.7, SZ0 - 0.4, SZ1 + 0.4);
  B.solid('brick', SX1, SX1 + 0.4, CY - 0.3, 0.7, SZ0 - 0.4, SZ1 + 0.4);
  B.solid('brick', SX0 - 0.4, SX1 + 0.4, CY - 0.3, 0.25, SZ0 - 0.4, SZ0);
  B.boxE('gothicTrim', SX0 - 0.45, SX0 - 0.05, 0.7, 0.8, SZ0 - 0.45, SZ1 + 0.45); B.boxE('gothicTrim', SX1 + 0.05, SX1 + 0.45, 0.7, 0.8, SZ0 - 0.45, SZ1 + 0.45);
  // the two steel leaves, hinged along the parapets, sloping up to the house wall
  const slope = Math.atan2(1.25 - 0.3, SZ1 - SZ0), len = Math.hypot(SZ1 - SZ0, 0.95);
  const leaves = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side < 0 ? SX0 - 0.2 : SX1 + 0.2, 0.78, (SZ0 + SZ1) / 2); pivot.rotation.order = 'YXZ'; B.root.add(pivot);
    const leaf = B.box('metalDark', side * 0.6, 0, 0, 1.22, 0.05, len, 0, pivot); leaf.rotation.x = -slope; leaf.updateMatrix();
    for (let k = 0; k < 3; k++) { const rib = B.box('rust', side * 0.6, 0.035, -1.4 + k * 1.4, 1.18, 0.03, 0.08, 0, pivot); rib.rotation.x = -slope; rib.position.y += Math.sin(slope) * (1.4 - k * 1.4) * 0; rib.updateMatrix(); }
    B.mesh(G.cyl, 'iron', 0, 0, 0, 0.08, len + 0.2, 0.08, 0, pivot).rotation.x = Math.PI / 2;
    pivot.traverse(o => { o.userData.dynamic = true; });
    return { pivot, side };
  });
  const hatchWall = P.addWall(SX0, SX1, SZ0 - 0.4, SZ0, -0.5, 1.3, { kind: 'door', tag: 'storm doors' });
  const bolt = new THREE.Group(); bolt.position.set(-12, 0.55, SZ0 + 1.3); B.root.add(bolt);
  B.box('iron', 0, 0, 0, 0.5, 0.05, 0.05, 0, bolt); B.box('iron', 0.1, -0.06, 0, 0.05, 0.12, 0.05, 0, bolt);
  bolt.traverse(o => { o.userData.dynamic = true; });
  game.storm = game.storm; // (the weather flag is elsewhere; this is the cellar)
  game.stormDoors = { leaves, wall: hatchWall, bolt, bolted: true, open: false, t: 0, boltT: 0 };
  const rampY = z => CY * (z - SZ0) / (SZ1 - SZ0);
  B.interactable({
    id: 'storm-bolt', kind: 'control', label: () => game.stormDoors.bolted ? 'Draw the bolt on the storm doors' : 'Bolt the storm doors', pos: [-12, 0.5, SZ0 + 1.3], n: [0, 1], approachDist: 1.0, floorY: rampY(SZ0 + 2.3), reach: 2.4,
    enabled: () => !game.stormDoors.open && game.stormDoors.bolted,
    act: g => g.stormBolt(),
  });
  B.interactable({
    id: 'storm-doors-in', kind: 'door', label: () => game.stormDoors.open ? 'Pull the storm doors shut' : 'Push the storm doors open', pos: [-12, 0.9, SZ0 + 0.6], n: [0, 1], approachDist: 1.3, floorY: rampY(SZ0 + 1.9), reach: 2.6,
    enabled: () => !game.stormDoors.bolted, act: g => g.stormDoorsToggle(),
  });
  B.levelName = 'ground'; B.room = 'courtyard';
  B.interactable({
    id: 'storm-doors', kind: 'door', label: () => game.stormDoors.bolted ? 'Storm doors (bolted from inside)' : game.stormDoors.open ? 'Close the storm doors' : 'Open the storm doors', pos: [-12, 0.6, SZ0 - 0.5], n: [0, -1], approachDist: 1.1,
    act: g => g.stormDoorsToggle(),
  });
  B.readable('note-storm', 'Painted on the storm doors', 'In white paint, flaking, on the inside of the left-hand door:\n\nKEEP BOLTED\nC.A.B. 1961\n\nand under it, in a different hand, scratched into the paint with something sharp:\n\nI counted the bolts. Seven on this side. None on mine.', [SX1 - 0.02, -1.3, -13.4], [-1, 0], { plaque: true, floorY: rampY(-13.4 - 0.0) , reach: 2.0, approachDist: 0.7 });
  B.levelName = 'ground'; B.room = 'grounds';
};
})();
