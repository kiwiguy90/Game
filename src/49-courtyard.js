/* ==========================================================================
   BLACKTHORN MANOR — 6j. THE WALLED GARDEN AND THE STORM CELLAR
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
  const W = { x0: -18, x1: 18, z0: -30, z1: -12 };      // the whole walled garden behind the house
  const YD = { x0: -18, x1: -6, z0: -24, z1: -12 };     // the service yard behind the kitchen
  const yardLight = (o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:flood' }, o)); game.estateLights.flood.push(l.id); return l; };
  const rnd = BM.mulberry32(1961);

  /* ---- the ground: setts in the yard, flags on the terrace, gravel paths through the garden ---- */
  B.boxE('setts', YD.x0, YD.x1, 0.005, 0.03, YD.z0, YD.z1 - 0.2);
  for (let i = 0; i < 10; i++) B.box('moss', -17 + rnd() * 10, 0.032, -23 + rnd() * 10, 0.6 + rnd() * 1.4, 0.004, 0.5 + rnd() * 1.0, rnd() * 3);
  B.box('water', -9.2, 0.034, -19.5, 2.0, 0.003, 1.4, 0.3);
  B.mesh(G.disc, 'grate', -8.5, 0.036, -15.5, 0.5); // the drain
  B.boxE('stone', -6, W.x1, 0.005, 0.04, -15, W.z1 - 0.2);                                   // the terrace
  for (let x = -5.5; x < 18; x += 1.5) B.boxE('gothicTrim', x, x + 0.02, 0.04, 0.045, -15, -12.2); // its joints
  B.boxE('gravel', -5.2, -3.8, 0.005, 0.035, W.z0 + 0.2, -15);                                // the walk down the middle
  B.boxE('gravel', -6, 16, 0.005, 0.035, -22.6, -21.4);                                       // and across
  B.boxE('gravel', 5.4, 6.6, 0.005, 0.035, -29.6, -15);

  /* ---- the walls: an old brick enclosure, an arch out to the grounds, a gate to the east lawn ---- */
  const H = 2.6;
  B.wall('z', W.x0, W.z0, W.z1, { t: 0.4, mat: 'brick', y1: H });
  B.wall('x', W.z0, W.x0, W.x1, { t: 0.4, mat: 'brick', y1: H }, [{ at: -4.5, w: 2.4, type: 'arch', head: 2.3, id: 'yard-arch' }]);
  B.wall('z', W.x1, W.z0, W.z1, { t: 0.4, mat: 'brick', y1: H }, [{ at: -21.0, w: 1.5, type: 'arch', head: 2.2, id: 'yard-gate' }]);
  // inside: the yard's own walls, lower, with a gate into the orchard; open to the terrace at the house end
  B.wall('x', YD.z0, YD.x0, YD.x1, { t: 0.3, mat: 'brick', y1: 2.0 }, [{ at: -12, w: 1.4, type: 'arch', head: 1.9, id: 'orchard-gate' }]);
  B.wall('z', YD.x1, YD.z0, -15.2, { t: 0.3, mat: 'brick', y1: 2.0 });
  B.box('gothicTrim', -4.5, 2.45, W.z0, 3.0, 0.3, 0.6); B.mesh(G.wedge, 'gothicTrim', -4.5, 2.6, W.z0, 3.0, 0.5, 0.6);
  for (const z of [-21.85, -20.15]) B.box('gothicTrim', W.x1, 1.3, z, 0.5, 2.6, 0.2);
  { const g = new THREE.Group(); g.position.set(W.x1 - 0.1, 0, -21.8); g.rotation.y = -2.2; B.root.add(g);
    for (let i = 0; i < 7; i++) B.mesh(G.post, 'iron', 0, 1.0, 0.15 + i * 0.2, 0.03, 2.0, 0.03, 0, g);
    B.box('iron', 0, 0.3, 0.75, 0.04, 0.05, 1.4, 0, g); B.box('iron', 0, 1.8, 0.75, 0.04, 0.05, 1.4, 0, g); }
  B.boxE('gothicTrim', W.x0 - 0.3, W.x1 + 0.3, H, H + 0.12, W.z0 - 0.3, W.z0 + 0.3);
  B.boxE('gothicTrim', W.x0 - 0.3, W.x0 + 0.3, H, H + 0.12, W.z0, W.z1); B.boxE('gothicTrim', W.x1 - 0.3, W.x1 + 0.3, H, H + 0.12, W.z0, W.z1);
  for (let i = 0; i < 14; i++) { const x = W.x0 + 1 + i * 2.6; if (Math.abs(x + 4.5) < 2) continue; B.mesh(G.lowSphere, 'ivy', x, H - 0.3 - (i % 3) * 0.6, W.z0 + 0.25, 1.2 + (i % 2) * 0.6, 1.4, 0.5); }
  for (let i = 0; i < 6; i++) B.mesh(G.lowSphere, 'ivy', W.x0 + 0.25, H - 0.5 - (i % 3) * 0.4, W.z0 + 2 + i * 2.6, 0.5, 1.6, 1.3);
  for (let i = 0; i < 5; i++) B.mesh(G.lowSphere, 'ivy', W.x1 - 0.25, H - 0.5 - (i % 3) * 0.4, W.z0 + 2 + i * 2.6, 0.5, 1.6, 1.3);

  /* ---- the service yard: pump, coal store, water butt, bins, the washing line ---- */
  B.mesh(G.post, 'iron', -9.5, 0.6, -21.0, 0.2, 1.2, 0.2); B.mesh(G.cyl, 'iron', -9.5, 1.25, -21.0, 0.26, 0.12, 0.26);
  B.box('iron', -9.5, 0.95, -21.25, 0.08, 0.08, 0.5);
  { const h = B.box('iron', -9.5, 1.35, -20.75, 0.04, 0.9, 0.04); h.rotation.x = 0.7; h.updateMatrix(); }
  B.box('stone', -9.5, 0.08, -21.0, 1.0, 0.16, 1.0); B.mesh(G.cyl, 'stone', -9.5, 0.3, -21.6, 0.5, 0.3, 0.5);
  P.addWall(-9.8, -9.2, -21.3, -20.7, 0, 1.4, { kind: 'furniture', tag: 'pump' });
  B.solid('brick', YD.x0 + 0.2, YD.x0 + 2.6, 0, 1.6, -23.5, -21.0, { kind: 'furniture', tag: 'coal store' });
  B.boxE('boards', YD.x0 + 0.1, YD.x0 + 2.7, 1.6, 1.75, -23.6, -20.9);
  B.boxE('black', YD.x0 + 2.6, YD.x0 + 2.62, 0.1, 1.2, -23.2, -21.3);
  B.mesh(G.lowSphere, 'coal', YD.x0 + 2.0, 0.2, -22.2, 2.2, 0.5, 1.6);
  for (let i = 0; i < 16; i++) B.mesh(G.lowSphere, 'coal', YD.x0 + 2.8 + rnd() * 1.2, 0.05, -23.3 + rnd() * 2.2, 0.12, 0.08, 0.1);
  B.mesh(G.cyl, 'boards', -17.3, 0.55, -13.0, 0.9, 1.1, 0.9); B.mesh(G.cyl, 'water', -17.3, 1.08, -13.0, 0.82, 0.04, 0.82);
  P.addWall(-17.75, -16.85, -13.45, -12.55, 0, 1.1, { kind: 'furniture', tag: 'water butt' });
  B.box('iron', -17.6, 2.2, -12.3, 0.1, 4.4, 0.1); B.box('iron', -17.45, 1.3, -12.6, 0.08, 0.08, 0.5);
  for (const x of [-6.9, -7.6]) { B.mesh(G.cyl, 'metalDark', x, 0.45, -23.3, 0.55, 0.9, 0.55); B.mesh(G.cyl, 'metalDark', x, 0.93, -23.3, 0.6, 0.06, 0.6); P.addWall(x - 0.3, x + 0.3, -23.6, -23.0, 0, 1, { kind: 'furniture', tag: 'dustbin' }); }
  B.box('iron', -7.2, 0.02, -22.4, 0.6, 0.04, 0.3, 0.4); // a lid blown off
  B.furniture('iron', -15.2, -23.3, 0, 0.8, 1.2, 0.5, 'mangle'); B.mesh(G.cyl, 'iron', -15.2, 1.1, -23.3, 0.14, 0.7, 0.14).rotation.z = Math.PI / 2;
  for (const [x, z] of [[-13.6, -23.2], [-14.3, -23.5]]) B.furniture('boards', x, z, 0, 0.6, 0.4, 0.5, 'crate');
  for (const x of [-16, -9.8]) B.mesh(G.post, 'boards', x, 1.1, -18.6, 0.08, 2.2, 0.08);
  B.box('wire', -12.9, 2.05, -18.6, 6.2, 0.012, 0.012);
  for (const [x, w] of [[-15.0, 1.1], [-12.6, 1.4], [-10.8, 0.9]]) { const sh = B.box('dustSheet', x, 1.45, -18.6, w, 1.2, 0.03); sh.rotation.y = 0.08; sh.updateMatrix(); }
  B.furniture('boards', -9.5, -12.75, 0, 1.4, 0.45, 0.42, 'yard bench');

  /* ---- the terrace: a balustrade along its edge, urns, a garden seat ---- */
  const balustrade = (x0, x1) => {
    P.addWall(x0, x1, -15.1, -14.9, 0, 0.95, { kind: 'rail' });
    B.boxE('gothicTrim', x0, x1, 0.0, 0.14, -15.15, -14.85); B.boxE('gothicTrim', x0, x1, 0.82, 0.95, -15.18, -14.82);
    for (let x = x0 + 0.15; x < x1 - 0.05; x += 0.3) B.mesh(BM.statuaryGeo('baluster', () => new THREE.LatheGeometry([0.001, 0.07, 0.05, 0.03, 0.06, 0.075, 0.04, 0.03, 0.05, 0.001].map((r, i) => new THREE.Vector2(r, i * 0.076)), 10)), 'gothicTrim', x, 0.14, -15, 1, 1, 1);
  };
  balustrade(-3.8, 5.4); balustrade(6.6, 17.8);
  for (const x of [-3.7, 5.3, 6.7]) { BM.plinth(B, x, -15, 0.5, 1.05, 'gothicTrim'); BM.urn(B, x, 1.05, -15, 0.6); }
  B.furniture('iron', 12.0, -12.7, 0, 1.6, 0.9, 0.6, 'garden seat');
  for (const [x, z] of [[2.5, -12.6], [9.0, -12.6], [16.6, -12.6]]) { B.mesh(G.cyl, 'brick', x, 0.25, z, 0.5, 0.5, 0.5); B.mesh(G.lowSphere, 'deadStalk', x, 0.6, z, 0.4, 0.4, 0.4); }

  /* ---- the formal garden, gone wild: four box-edged beds round a sundial, roses, a ruined glasshouse ---- */
  const bed = (x0, x1, z0, z1) => {
    for (const [a0, a1, b0, b1] of [[x0, x1, z0, z0 + 0.4], [x0, x1, z1 - 0.4, z1], [x0, x0 + 0.4, z0, z1], [x1 - 0.4, x1, z0, z1]]) {
      B.boxE('hedge', a0, a1, 0, 0.55, b0, b1); P.addWall(a0, a1, b0, b1, 0, 0.55, { kind: 'hedge' });
      for (let k = 0; k < Math.max(a1 - a0, b1 - b0) / 0.9; k++) B.mesh(G.lowSphere, 'hedge', a0 + (a1 - a0) * rnd(), 0.6, b0 + (b1 - b0) * rnd(), 0.6, 0.35, 0.6); // grown shaggy
    }
    for (let k = 0; k < 6; k++) { const x = x0 + 0.8 + rnd() * (x1 - x0 - 1.6), z = z0 + 0.8 + rnd() * (z1 - z0 - 1.6);
      B.mesh(G.lowSphere, rnd() < 0.5 ? 'leavesDark' : 'sapLeaves', x, 0.45, z, 1.0 + rnd() * 0.6, 0.8 + rnd() * 0.5, 1.0 + rnd() * 0.6);
      if (rnd() < 0.6) for (let j = 0; j < 4; j++) B.mesh(G.lowSphere, 'flowersRed', x + (rnd() - 0.5) * 0.8, 0.7 + rnd() * 0.4, z + (rnd() - 0.5) * 0.8, 0.1, 0.08, 0.1); }
  };
  bed(-2.6, 5.0, -21.0, -15.6); bed(7.0, 15.4, -21.0, -15.6); bed(-2.6, 5.0, -29.2, -23.0); bed(7.0, 11.6, -29.2, -23.0);
  // the sundial where the paths cross
  BM.plinth(B, 6, -22, 0.45, 0.95, 'gothicTrim'); P.addWall(5.7, 6.3, -22.3, -21.7, 0, 0.95, { kind: 'furniture', tag: 'sundial' });
  B.mesh(G.cyl, 'brass', 6, 0.97, -22, 0.55, 0.025, 0.55); { const gn = B.box('brass', 6, 1.07, -22, 0.02, 0.18, 0.26); gn.rotation.y = 0.6; gn.updateMatrix(); }
  B.readable('note-sundial', 'The sundial', 'Round the rim, in letters worn almost smooth:\n\nI COUNT ONLY THE SUNNY HOURS\n\nUnder it, scratched in later with a nail: "then it has nothing to count here"', [6, 1.0, -21.62], [0, 1], { visual: false });
  // the glasshouse: an iron frame against the south-east corner, most of its panes gone
  const GH = { x0: 12.2, x1: 17.8, z0: -29.8, z1: -23.6 };
  for (const x of [GH.x0, (GH.x0 + GH.x1) / 2, GH.x1 - 0.05]) for (const z of [GH.z0 + 0.05, GH.z1]) B.mesh(G.post, 'paintedWood', x, 1.2, z, 0.08, 2.4, 0.08);
  B.boxE('paintedWood', GH.x0, GH.x1, 2.4, 2.48, GH.z1 - 0.05, GH.z1 + 0.05); B.boxE('paintedWood', GH.x0 - 0.05, GH.x0 + 0.05, 2.4, 2.48, GH.z0, GH.z1);
  for (let i = 0; i < 6; i++) { const z = GH.z0 + 0.6 + i * 1.0; const r = B.box('paintedWood', (GH.x0 + GH.x1) / 2, 2.9, z, GH.x1 - GH.x0, 0.05, 0.06); r.rotation.z = 0.15; r.updateMatrix(); if (rnd() < 0.55) { const g = B.box('glass', (GH.x0 + GH.x1) / 2 - 0.4, 2.85, z + 0.5, GH.x1 - GH.x0 - 1.0, 0.01, 0.9); g.rotation.z = 0.15; g.updateMatrix(); } }
  for (let i = 0; i < 4; i++) if (rnd() < 0.7) B.box('glass', GH.x0, 1.3, GH.z0 + 0.8 + i * 1.4, 0.01, 2.0, 1.2);
  for (const [x0, x1, z0, z1] of [[GH.x0 - 0.05, GH.x0 + 0.05, GH.z0, -26.0], [GH.x0 - 0.05, GH.x0 + 0.05, -24.8, GH.z1], [GH.x0, GH.x1, GH.z1 - 0.05, GH.z1 + 0.05]]) P.addWall(x0, x1, z0, z1, 0, 2.4, { kind: 'glass' });
  B.furniture('wood', 16.6, -27.0, 0, 0.9, 0.9, 5.0, 'potting staging');
  for (let i = 0; i < 9; i++) { const z = -29.2 + i * 0.6; B.mesh(G.cyl, 'brick', 16.6, 1.0, z, 0.24, 0.22, 0.24); B.mesh(G.lowSphere, 'deadStalk', 16.6, 1.2, z, 0.25, 0.3, 0.25); }
  B.mesh(G.lowSphere, 'sapLeaves', 14.4, 0.9, -26.8, 2.2, 1.8, 2.8); // a vine that took the house
  for (let i = 0; i < 18; i++) B.box('glass', GH.x0 + 0.5 + rnd() * 4.8, 0.035, GH.z0 + 0.4 + rnd() * 5.4, 0.2 + rnd() * 0.3, 0.004, 0.15 + rnd() * 0.25, rnd() * 3); // broken panes on the floor

  /* ---- the orchard behind the yard: old fruit trees, dead, in long grass ---- */
  B.room = 'orchard';
  for (const [x, z, s] of [[-15.5, -26.5, 0.5], [-11.0, -27.8, 0.55], [-8.0, -25.6, 0.45], [-16.0, -29.0, 0.4], [-12.6, -25.4, 0.4]]) BM.deadTree(B, x, z, s, game, Math.round(x * z));
  B.room = 'courtyard';

  /* ---- the lamps: bulkheads over the doors, lanterns on the walls and on posts down the walk ---- */
  yardLight({ id: 'yard-door-lamp', name: 'Garden door lamp', kind: 'incandescent', style: 'bulkhead', pos: [-4.5, 2.7, -12.25], nz: -1, colour: 0xffd7a0, target: 1.2, range: 8 });
  yardLight({ id: 'yard-kitchen-lamp', name: 'Kitchen door lamp', kind: 'incandescent', style: 'bulkhead', pos: [-7.5, 2.7, -12.25], nz: -1, colour: 0xffd7a0, target: 1.2, range: 8, flicker: 0.25, lightType: 'flicker' });
  yardLight({ id: 'yard-lantern-w', name: 'Yard lantern', kind: 'incandescent', style: 'lantern', pos: [YD.x0 + 0.35, 2.2, -18], nx: 1, colour: 0xffc070, target: 1.0, range: 9 });
  yardLight({ id: 'yard-lantern-n', name: 'Terrace lantern', kind: 'incandescent', style: 'lantern', pos: [W.x1 - 0.35, 2.2, -18.0], nx: -1, colour: 0xffc070, target: 1.0, range: 9 });
  yardLight({ id: 'yard-arch-lamp', name: 'Arch lamp', kind: 'incandescent', style: 'lantern', pos: [-6.4, 2.2, W.z0 + 0.35], nz: 1, colour: 0xffc070, target: 0.9, range: 8, flicker: 0.45, lightType: 'flicker' });
  for (const [i, z] of [[1, -18.5], [2, -25.5]]) yardLight({ id: 'garden-lamp-' + i, name: 'Garden lamp', kind: 'incandescent', style: 'street', pos: [-3.3, 2.4, z], colour: 0xffc070, target: 1.0, range: 9 });
  for (const z of [-18.5, -25.5]) P.addWall(-3.4, -3.2, z - 0.1, z + 0.1, 0, 2.4, { kind: 'tree', occludes: false });

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
