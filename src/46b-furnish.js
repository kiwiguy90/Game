/* ==========================================================================
   BLACKTHORN MANOR — 6e. THE ROOMS, LIVED IN
   What a family leaves in a house it shuts up in a hurry, room by room:
   coats on the stand and letters on the salver in the hall, decanters on
   the sideboard, a tea trolley nobody cleared in front of the television,
   copper pans and the bells board in the kitchen, a dolls' house and a
   blackboard in Eleanor's room, prams and pictures face to the wall in the
   attic, jars and a mangle in the cellar; and the gatekeeper's back room,
   with his bed, and the little monitor that watched the gates.
   Small things are decoration only; anything you could walk into has a
   collision box, kept clear of doors, switches and documents.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildFurnishings = function (B, game) {
  const P = B.phys, rnd = BM.mulberry32(1866);
  const at = (room, level, zone) => { B.room = room; B.levelName = level || 'ground'; B.zone = zone || 'mansion'; };
  const F = (y) => y; // floor heights read better as numbers below

  /* ---- small props ---- */
  const rug = (x, y, z, w, d, ry, mat) => B.box(mat || 'carpet', x, y + 0.012, z, w, 0.012, d, ry || 0);
  const runner = (x0, x1, z0, z1, y) => B.boxE('carpet', x0, x1, y + 0.006, y + 0.018, z0, z1);
  const mirror = (x, y, z, ry, w, h) => {
    const s = Math.sin(ry), c = Math.cos(ry);
    B.box('gilt', x, y, z, w + 0.16, h + 0.16, 0.05, ry);
    B.box(BM.mirrorGlass(), x + s * 0.03, y, z + c * 0.03, w, h, 0.01, ry);
  };
  const wallClock = (x, y, z, ry, r) => {
    const s = Math.sin(ry), c = Math.cos(ry); r = r || 0.2;
    const face = B.mesh(G.cyl, 'darkWood', x + s * 0.03, y, z + c * 0.03, r * 2.2, 0.06, r * 2.2); face.rotation.set(Math.PI / 2, ry, 0, 'YXZ'); face.updateMatrix();
    const dial = B.mesh(G.disc, 'paper', x + s * 0.065, y, z + c * 0.065, r * 1.8); dial.rotation.set(0, ry, 0); dial.updateMatrix();
    for (const [a, l] of [[2.1, r * 0.55], [5.4, r * 0.8]]) { const h = B.box('black', x + s * 0.07 + c * Math.sin(a) * l / 2, y + Math.cos(a) * l / 2, z + c * 0.07 - s * Math.sin(a) * l / 2, 0.012, l, 0.004, ry); h.rotation.set(0, ry, -a, 'YXZ'); h.updateMatrix(); }
  };
  const bottle = (x, y, z, mat) => { B.mesh(G.cyl, mat || 'darkGlass', x, y + 0.13, z, 0.08, 0.26, 0.08); B.mesh(G.cyl, mat || 'darkGlass', x, y + 0.3, z, 0.03, 0.09, 0.03); };
  const decanter = (x, y, z) => { B.mesh(G.sphere, 'glass', x, y + 0.1, z, 0.13, 0.18, 0.13); B.mesh(G.cyl, 'glass', x, y + 0.23, z, 0.04, 0.1, 0.04); B.mesh(G.sphere, 'glass', x, y + 0.3, z, 0.05); B.mesh(G.cyl, 'fabricRed', x, y + 0.06, z, 0.11, 0.08, 0.11); };
  const books = (x, y, z, n, ry) => { for (let i = 0; i < n; i++) B.box(['fabricRed', 'fabricGreen', 'leather', 'darkWood'][i % 4], x, y + 0.025 + i * 0.05, z, 0.24 - (i % 2) * 0.03, 0.045, 0.17, (ry || 0) + (rnd() - 0.5) * 0.4); };
  const vase = (x, y, z, dead) => { B.mesh(G.sphere, 'porcelain', x, y + 0.1, z, 0.16, 0.22, 0.16); B.mesh(G.cyl, 'porcelain', x, y + 0.24, z, 0.08, 0.1, 0.08); if (dead) for (let i = 0; i < 4; i++) B.mesh(G.post, 'deadStalk', x + (rnd() - 0.5) * 0.08, y + 0.42, z + (rnd() - 0.5) * 0.08, 0.012, 0.4, 0.012); };
  const oilLamp = (x, y, z) => { B.mesh(G.cyl, 'brass', x, y + 0.05, z, 0.14, 0.1, 0.14); B.mesh(G.sphere, 'brass', x, y + 0.16, z, 0.16, 0.12, 0.16); B.mesh(G.cyl, 'glass', x, y + 0.33, z, 0.07, 0.24, 0.07); B.mesh(G.sphere, 'fabricCream', x, y + 0.28, z, 0.2, 0.14, 0.2); };
  const plate = (x, y, z, ry, r) => { const d = B.mesh(G.disc, 'porcelain', x, y, z, r || 0.24); d.rotation.set(0, ry, 0); d.updateMatrix(); B.mesh(G.ring, 'flowersPurple', x, y, z, (r || 0.24) * 0.8, (r || 0.24) * 0.8, 0.02, ry); };
  const label = (text, x, y, z, ry, w, h, o) => B.mesh(G.plane, BM.labelMat(text, Object.assign({ w: 256, h: 128, size: 22 }, o || {})), x, y, z, w, h, 1, ry);
  const coat = (x, y, z, ry, mat) => { const c = B.box(mat || 'darkWood', x, y - 0.45, z, 0.42, 0.85, 0.12, ry); c.rotation.set(0.05, ry, 0, 'YXZ'); c.updateMatrix(); B.mesh(G.sphere, mat || 'darkWood', x, y - 0.05, z, 0.22, 0.12, 0.14, ry); };
  const doll = (x, y, z, ry, dress) => { B.box(dress || 'dollDress', x, y + 0.08, z, 0.1, 0.16, 0.07, ry); B.mesh(G.sphere, 'doll', x, y + 0.2, z, 0.08); B.mesh(G.sphere, 'darkWood', x, y + 0.23, z - 0.01, 0.085, 0.06, 0.08); };
  const birdcage = (x, y, z) => { B.mesh(G.disc, 'brass', x, y, z, 0.32); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; B.mesh(G.post, 'brass', x + Math.cos(a) * 0.15, y + 0.22, z + Math.sin(a) * 0.15, 0.008, 0.44, 0.008); } B.mesh(G.sphere, 'brass', x, y + 0.46, z, 0.32, 0.12, 0.32); B.mesh(G.ring, 'brass', x, y + 0.56, z, 0.06, 0.06, 0.06); };
  const jars = (x0, x1, y, z) => { for (let x = x0; x < x1; x += 0.16 + rnd() * 0.06) { const h = 0.14 + rnd() * 0.12; B.mesh(G.cyl, rnd() < 0.5 ? 'glass' : 'porcelain', x, y + h / 2, z, 0.11, h, 0.11); if (rnd() < 0.6) B.mesh(G.cyl, rnd() < 0.5 ? 'flowersRed' : 'leafLitter2', x, y + h * 0.35, z, 0.09, h * 0.65, 0.09); } };
  const shelf = (x, y, z, w, d, ry) => B.box('darkWood', x, y, z, w, 0.03, d, ry || 0);
  const pram = (x, y, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; B.root.add(g);
    B.box('carPaint', 0, 0.55, 0, 0.5, 0.32, 0.9, 0, g); B.mesh(G.sphere, 'leather', 0, 0.72, -0.28, 0.52, 0.42, 0.42, 0, g);
    for (const [wx, wz] of [[-0.27, -0.3], [0.27, -0.3], [-0.27, 0.3], [0.27, 0.3]]) { const w = B.mesh(G.ring, 'iron', wx, 0.2, wz, 0.36, 0.36, 0.36, 0, g); w.rotation.y = Math.PI / 2; w.updateMatrix(); }
    B.box('chrome', 0, 0.9, 0.55, 0.4, 0.02, 0.02, 0, g); B.box('chrome', 0, 0.75, 0.48, 0.02, 0.3, 0.02, 0, g);
  };

  /* ================= THE HALL ================= */
  at('hall');
  B.furniture('darkWood', 5.35, 11.4, 0, 0.5, 1.9, 0.5, 'coat stand');
  B.mesh(G.post, 'darkWood', 5.35, 1.0, 11.4, 0.06, 2.0, 0.06);
  coat(5.2, 1.75, 11.35, 0.4, 'fabricGreen'); coat(5.5, 1.7, 11.5, -0.3, 'darkWood'); B.mesh(G.cyl, 'black', 5.4, 1.95, 11.45, 0.3, 0.08, 0.3);
  B.mesh(G.cyl, 'iron', 4.6, 0.28, 11.5, 0.26, 0.55, 0.26);                                       // umbrella stand
  for (const [dx, dz, t] of [[-0.05, 0.02, 0.15], [0.05, -0.03, -0.12]]) { const u = B.mesh(G.post, 'black', 4.6 + dx, 0.7, 11.5 + dz, 0.025, 0.9, 0.025); u.rotation.z = t; u.updateMatrix(); }
  B.mesh(G.disc, 'brass', -3.0, 0.865, 10.9, 0.28);                                                // the salver, letters on it
  for (let i = 0; i < 4; i++) B.box('paper', -3.0 + (rnd() - 0.5) * 0.06, 0.875 + i * 0.004, 10.9 + (rnd() - 0.5) * 0.06, 0.16, 0.003, 0.11, rnd() * 0.6);
  B.box('cream', -4.3, 0.9, 11.05, 0.2, 0.09, 0.2); B.box('cream', -4.3, 0.97, 11.05, 0.18, 0.04, 0.06);   // the telephone
  rug(0, 0, 9.6, 2.6, 1.7, 0, 'carpet');
  // the barometer by the door; the keys board's empty hooks
  B.box('darkWood', 5.88, 1.55, 11.0, 0.05, 0.9, 0.22); { const d = B.mesh(G.disc, 'paper', 5.85, 1.75, 11.0, 0.18); d.rotation.y = -Math.PI / 2; d.updateMatrix(); }
  /* ================= THE STAIR HALL BEHIND THE ENTRANCE HALL ================= */
  at('corridor');
  runner(-0.45, 0.45, -9.4, -0.6, 0); runner(-5.4, -0.45, -6.95, -6.05, 0);
  // the key board and the coats by the garden door
  B.box('darkWood', -5.87, 1.5, -10.6, 0.03, 0.4, 0.5); label('KEYS', -5.85, 1.78, -10.6, Math.PI / 2, 0.18, 0.05, { w: 128, h: 40, size: 24 });
  for (let i = 0; i < 12; i++) { const kz = -10.8 + (i % 6) * 0.08, ky = 1.6 - Math.floor(i / 6) * 0.16; B.box('brass', -5.84, ky, kz, 0.03, 0.01, 0.01); if (rnd() < 0.4) B.box('brass', -5.84, ky - 0.05, kz, 0.004, 0.06, 0.015); }
  for (const x of [-3.2, -2.9]) B.box('brass', x, 1.75, -11.86, 0.02, 0.02, 0.05);
  coat(-3.05, 1.72, -11.8, 0, 'fabricCream');
  label('OCTOBER 1974', -5.88, 1.7, -3.3, Math.PI / 2, 0.3, 0.38, { w: 128, h: 160, size: 18, bg: '#e8e0c8' });
  // a long-case barometer and an umbrella stand by the arch, a settle against the west wall
  B.furniture('darkWood', -5.55, -3.65, 0, 0.5, 0.95, 1.3, 'settle');
  B.mesh(G.cyl, 'brass', -1.9, 0.3, -0.5, 0.32, 0.6, 0.32); for (const dx of [-0.06, 0.07]) B.mesh(G.post, 'black', -1.9 + dx, 0.75, -0.5, 0.025, 0.9, 0.025);
  B.picture(-5.88, 2.1, -8.2, Math.PI / 2, 0.8, 0.6, 'landscape', 5);
  B.picture(2.0, 2.2, -0.12, Math.PI, 0.7, 0.55, 'house', 9);

  /* ================= THE DINING ROOM ================= */
  at('dining');
  B.furniture('wood', -15.05, 8.0, 0, 0.55, 1.05, 0.55, 'dining chair');   // the carvers at each end
  B.furniture('wood', -8.95, 8.0, 0, 0.55, 1.05, 0.55, 'dining chair');
  for (const [i, z] of [[0, 7.4], [1, 8.0], [2, 8.6]]) decanter(-17.5, 0.9, z);
  B.box('brass', -17.5, 0.92, 7.0, 0.3, 0.03, 0.4); bottle(-17.45, 0.94, 6.95, 'darkGlass');
  B.furniture('darkWood', -7.25, 11.4, 0, 1.3, 0.85, 0.45, 'serving table');
  for (let i = 0; i < 4; i++) B.mesh(G.cyl, 'porcelain', -7.35, 0.86 + i * 0.015, 11.42, 0.24, 0.012, 0.24);
  // the epergne in the middle, one place laid at the head, a folded newspaper by it
  B.mesh(G.cyl, 'chrome', -12.0, 0.82, 7.6, 0.24, 0.08, 0.24); B.mesh(G.post, 'chrome', -12.0, 0.98, 7.6, 0.04, 0.3, 0.04); B.mesh(G.sphere, 'chrome', -12.0, 1.13, 7.6, 0.34, 0.08, 0.34);
  B.mesh(G.cyl, 'porcelain', -14.1, 0.79, 8.0, 0.27, 0.012, 0.27); B.mesh(G.cyl, 'porcelain', -14.1, 0.8, 8.0, 0.2, 0.01, 0.2); B.box('linen', -14.1, 0.8, 8.25, 0.12, 0.02, 0.2);
  B.box('paper', -13.8, 0.79, 8.35, 0.3, 0.01, 0.2, 0.3);
  B.picture(-12, 2.2, 11.78, Math.PI, 1.1, 0.75, 'landscape', 21);
  B.picture(-9.0, 2.0, 4.12, 0, 0.8, 0.6, 'stilllife', 22);
  B.box('fabricRed', -14.1, 1.8, 4.13, 0.06, 1.2, 0.02); B.box('brass', -14.1, 1.18, 4.14, 0.08, 0.1, 0.03);   // the bell pull
  rug(-12, 0, 8.0, 6.0, 3.0, 0, 'carpet');

  /* ================= THE DRAWING ROOM ================= */
  at('drawing');
  B.furniture('fabricGreen', 13.3, 6.0, 0, 0.85, 0.9, 0.85, 'armchair');
  B.furniture('fabricGreen', 17.2, 6.1, 0, 0.85, 0.9, 0.85, 'armchair');
  B.furniture('darkWood', 6.45, 11.45, 0, 0.5, 1.2, 0.45, 'whatnot');
  for (let i = 0; i < 3; i++) B.box('darkWood', 6.45, 0.35 + i * 0.4, 11.45, 0.5, 0.03, 0.45);
  vase(6.45, 0.37, 11.45); B.box('frame', 6.4, 0.85, 11.5, 0.12, 0.16, 0.02, 0.4); vase(6.5, 1.17, 11.4);
  B.furniture('darkWood', 7.05, 8.6, 0, 0.5, 0.65, 0.5, 'side table'); oilLamp(7.05, 0.65, 8.6);
  // on the mantel: a clock under a glass dome and a pair of Staffordshire dogs
  B.box('darkWood', 15.5, 1.5, 4.35, 0.3, 0.16, 0.14); B.mesh(G.sphere, 'glass', 15.5, 1.63, 4.35, 0.32, 0.4, 0.2);
  for (const x of [14.95, 16.05]) { B.box('porcelain', x, 1.5, 4.35, 0.1, 0.14, 0.06); B.mesh(G.sphere, 'porcelain', x, 1.62, 4.35, 0.08); }
  books(12.4, 0.45, 8.0, 3); B.box('paper', 12.7, 0.46, 7.85, 0.28, 0.01, 0.2, 0.2);
  B.picture(18 - 0.21, 2.3, 10.4, -Math.PI / 2, 0.7, 0.9, 'portrait', 31);
  rug(12, 0, 8.4, 5.4, 4.0, 0, 'carpet');

  /* ================= THE LIBRARY ================= */
  at('library');
  B.furniture('darkWood', 15.7, -3.68, 0, 3.0, 2.8, 0.4, 'bookcase');
  B.furniture('darkWood', 9.4, 0.8, 0, 2.0, 0.78, 1.1, 'library table');
  B.box('leather', 9.4, 0.785, 0.8, 1.7, 0.004, 0.85);
  oilLamp(8.7, 0.79, 0.6); books(10.0, 0.79, 1.0, 4, 0.3); decanter(9.9, 0.79, 0.45); B.mesh(G.cyl, 'glass', 10.1, 0.84, 0.35, 0.06, 0.1, 0.06);
  B.box('paper', 9.2, 0.79, 0.95, 0.42, 0.012, 0.3, 0.1); // the ledger, open
  B.furniture('wood', 9.4, 1.75, 0, 0.5, 0.95, 0.5, 'chair');
  B.furniture('darkWood', 16.0, -3.05, 0, 0.5, 0.75, 0.6, 'library steps');
  for (let i = 0; i < 3; i++) B.box('darkWood', 16.0, 0.25 + i * 0.25, -3.25 + i * 0.2, 0.5, 0.04, 0.22);
  B.mesh(G.post, 'darkWood', 14.0, 0.45, -1.6, 0.06, 0.9, 0.06); B.mesh(G.cyl, 'darkWood', 14.0, 0.02, -1.6, 0.4, 0.04, 0.4);
  B.mesh(G.sphere, 'fabricCream', 14.0, 1.12, -1.6, 0.46); B.mesh(G.ring, 'brass', 14.0, 1.12, -1.6, 0.52, 0.52, 0.52);
  P.addWall(13.8, 14.2, -1.8, -1.4, 0, 1.3, { kind: 'furniture', tag: 'globe' });
  rug(11, 0, 0.3, 4.0, 3.0, 0, 'carpet');

  /* ================= THE BACK SITTING ROOM ================= */
  at('back sitting');
  B.furniture('fabricCream', -13.6, -0.3, 0, 0.8, 0.85, 0.8, 'armchair');
  B.furniture('fabricRed', -11.4, -0.5, 0, 0.8, 0.85, 0.8, 'armchair');
  B.furniture('wood', -12.5, -1.65, 0, 0.6, 0.45, 0.4, 'side table');
  B.mesh(G.cyl, 'porcelain', -12.6, 0.5, -1.6, 0.12, 0.1, 0.12); B.mesh(G.cyl, 'porcelain', -12.35, 0.48, -1.7, 0.08, 0.06, 0.08);
  B.furniture('chrome', -9.0, 2.7, 0, 0.8, 0.75, 0.45, 'tea trolley');
  B.mesh(G.sphere, 'porcelain', -9.2, 0.82, 2.7, 0.2, 0.17, 0.2); for (let i = 0; i < 3; i++) B.mesh(G.cyl, 'porcelain', -8.8 + (i - 1) * 0.12, 0.8, 2.65 + (i % 2) * 0.1, 0.08, 0.07, 0.08);
  B.box('fabricRed', -10.6, 0.04, -2.9, 0.4, 0.08, 0.3, 0.3); for (const dx of [-0.05, 0.05]) B.mesh(G.post, 'chrome', -10.6 + dx, 0.15, -2.9, 0.01, 0.25, 0.01); // the knitting
  B.mesh(G.cyl, 'leafLitter', -7.3, 0.07, 3.1, 0.6, 0.14, 0.45);                                     // the cat's basket
  label('TV TIMES', -9.25, 0.82, 2.55, -Math.PI / 2, 0.16, 0.2, { w: 96, h: 128, size: 16, bg: '#d8402c', fg: '#fff' });
  B.picture(-9.0, 1.9, -3.89, 0, 0.9, 0.6, 'portrait', 41);
  wallClock(-6.11, 2.2, -1.5, -Math.PI / 2, 0.16);
  rug(-12.5, 0, 0.4, 3.6, 2.6, 0, 'carpet');

  /* ================= THE KITCHEN ================= */
  at('kitchen');
  B.furniture('wood', -11.8, -8.0, 0, 0.45, 0.95, 0.45, 'kitchen chair');
  B.furniture('wood', -10.0, -9.05, 0, 0.45, 0.95, 0.45, 'kitchen chair');
  // the dresser's plates and mugs
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const z = -10.45 + i * 0.38; const p = B.mesh(G.disc, 'porcelain', -6.73, 1.3 + r * 0.42, z - 0.1, 0.17); p.rotation.y = -Math.PI / 2; p.updateMatrix(); B.mesh(G.ring, 'flowersPurple', -6.735, 1.3 + r * 0.42, z, 0.13, 0.13, 0.02, -Math.PI / 2); }
  for (let i = 0; i < 5; i++) B.mesh(G.cyl, 'porcelain', -6.75, 1.0, -10.2 + i * 0.4, 0.08, 0.1, 0.08);
  // copper pans on the wall above the range, largest to smallest
  for (let i = 0; i < 6; i++) { const r = 0.32 - i * 0.035, z = -11.0 + i * 0.55; const p = B.mesh(G.cyl, 'brass', -13.84, 1.75, z, r, 0.07, r); p.rotation.z = Math.PI / 2; p.updateMatrix(); B.box('brass', -13.84, 1.75 + r / 2 + 0.08, z, 0.02, 0.18, 0.025); }
  B.box('iron', -13.86, 2.0, -9.6, 0.02, 0.02, 3.4);
  // the bells board high over the corridor door, every room on it
  B.box('darkWood', -8.6, 2.75, -4.12, 1.6, 0.42, 0.04);
  ['DINING', 'DRAWING', 'LIBRARY', 'SITTING', 'BED 1', 'BED 2', 'MISS E.', 'NURSERY'].forEach((t, i) => {
    const x = -9.25 + (i % 4) * 0.42, y = 2.86 - Math.floor(i / 4) * 0.2;
    B.mesh(G.cone, 'brass', x, y, -4.16, 0.07, 0.07, 0.07);
    label(t, x, y - 0.07, -4.15, Math.PI, 0.18, 0.04, { w: 160, h: 40, size: 18, bg: '#e8dcc0' });
  });
  B.box('wood', -13.0, 1.7, -11.85, 1.1, 0.6, 0.12); for (let i = 0; i < 7; i++) { const p = B.mesh(G.disc, 'porcelain', -13.45 + i * 0.15, 1.72, -11.85, 0.2); p.rotation.x = 0; p.updateMatrix(); } // the plate rack
  label('EGGS\nFLOUR\nCANDLES\nMATCHES', -13.3, 1.5, -4.12, Math.PI, 0.32, 0.4, { w: 160, h: 200, size: 20, bg: '#2a2a2a', fg: '#ddd' }); // the cook's slate
  B.box('black', -11.9, 0.9, -11.45, 0.4, 0.04, 0.3); B.mesh(G.cyl, 'brass', -12.0, 0.98, -11.45, 0.12, 0.14, 0.12); // the scales

  /* ================= THE PANTRY ================= */
  at('pantry');
  jars(-17.6, -14.4, 0.6, -4.45); jars(-17.6, -14.4, 1.2, -4.45);
  for (let i = 0; i < 5; i++) B.mesh(G.cyl, i % 2 ? 'metalDark' : 'flowersRed', -17.4 + i * 0.3, 1.82, -4.45, 0.09, 0.13, 0.09);
  B.furniture('wood', -17.45, -10.6, 0, 0.6, 0.85, 1.6, 'meat safe');
  B.mesh(G.cyl, 'metalDark', -15.0, 0.18, -11.4, 0.3, 0.36, 0.3); B.box('black', -15.6, 0.12, -11.5, 0.12, 0.24, 0.28); B.box('black', -15.8, 0.12, -11.5, 0.12, 0.24, 0.28); // a pail and boots
  B.box('wood', -17.85, 1.5, -6.2, 0.12, 0.3, 0.6); label('MATCHES', -17.78, 1.5, -6.2, Math.PI / 2, 0.18, 0.05, { w: 128, h: 36, size: 20 });

  /* ================= THE BATHROOM ================= */
  at('bathroom');
  B.furniture('porcelain', 6.5, -9.0, 0, 0.45, 0.42, 0.55, 'wc');
  B.mesh(G.sphere, 'porcelain', 6.5, 0.32, -9.0, 0.42, 0.22, 0.5); B.box('darkWood', 6.5, 0.43, -9.0, 0.44, 0.03, 0.5);
  B.box('porcelain', 6.23, 2.05, -9.0, 0.2, 0.3, 0.5); B.mesh(G.post, 'brass', 6.3, 1.1, -8.8, 0.025, 1.8, 0.025);
  B.mesh(G.post, 'brass', 6.45, 1.5, -9.28, 0.01, 0.8, 0.01); B.mesh(G.sphere, 'porcelain', 6.45, 1.08, -9.28, 0.05); // the chain
  mirror(9.86, 1.6, -7.6, -Math.PI / 2, 0.5, 0.65);
  B.box('brass', 9.85, 1.0, -5.6, 0.05, 0.05, 0.8); B.box('brass', 9.85, 0.6, -5.6, 0.05, 0.05, 0.8); B.box('linen', 9.82, 0.8, -5.6, 0.03, 0.55, 0.5);
  B.box('glass', 9.85, 1.22, -7.6, 0.12, 0.02, 0.5); bottle(9.83, 1.23, -7.45, 'glass'); B.mesh(G.cyl, 'porcelain', 9.83, 1.28, -7.75, 0.07, 0.1, 0.07);
  B.furniture('wood', 6.55, -11.4, 0, 0.5, 0.85, 0.5, 'chair');
  rug(8.4, 0, -9.0, 1.0, 0.7, 0, 'linen');

  /* ================= THE BOOT ROOM ================= */
  at('service');
  B.furniture('wood', 11.6, -4.45, 0, 1.4, 0.45, 0.4, 'bench');
  for (const x of [11.1, 11.6, 12.1]) B.box('black', x, 0.1, -4.9, 0.12, 0.22, 0.3); // boots under it
  for (const x of [10.9, 11.4, 12.0, 12.5]) { B.box('brass', x, 1.75, -4.13, 0.02, 0.02, 0.06); }
  coat(10.9, 1.72, -4.2, Math.PI, 'fabricGreen'); coat(12.0, 1.7, -4.2, Math.PI, 'leather');
  shelf(17.78 - 0.15, 1.3, -11.0, 0.3, 0.9); for (let i = 0; i < 3; i++) oilLamp(17.65, 1.31, -11.3 + i * 0.3);
  B.furniture('wood', 13.0, -11.45, 0, 2.0, 0.9, 0.6, 'boot room sink');

  /* ================= BEDROOM 1 ================= */
  at('bedroom1', 'upper');
  B.furniture('darkWood', -6.6, 6.6, 4.2, 0.5, 0.85, 1.0, 'washstand');
  B.box('marble', -6.6, 5.06, 6.6, 0.52, 0.03, 1.02); B.mesh(G.sphere, 'porcelain', -6.6, 5.12, 6.6, 0.42, 0.1, 0.42); B.mesh(G.sphere, 'porcelain', -6.6, 5.28, 6.45, 0.16, 0.3, 0.16);
  B.furniture('wood', -10.0, 6.2, 4.2, 0.5, 0.95, 0.5, 'chair');
  mirror(-9.3, 5.45, 4.13, 0, 0.6, 0.7); B.mesh(G.cyl, 'glass', -9.0, 5.02, 4.55, 0.06, 0.12, 0.06); B.box('darkWood', -9.6, 5.02, 4.55, 0.22, 0.03, 0.06);
  B.picture(-12.0, 6.2, 11.78, Math.PI, 0.5, 0.65, 'portrait', 51);
  label('THOU GOD\nSEEST ME', -17.79, 5.9, 10.5, Math.PI / 2, 0.36, 0.3, { w: 192, h: 160, size: 24, bg: '#e2d6b4', fg: '#6a1018' });
  B.mesh(G.cyl, 'porcelain', -13.4, 4.27, 9.0, 0.24, 0.14, 0.24);                                     // under the bed
  rug(-12.0, 4.2, 7.9, 2.2, 0.9, 0, 'carpet');

  /* ================= BEDROOM 2 (the guest room) ================= */
  at('bedroom2', 'upper');
  B.furniture('darkWood', 6.6, 6.6, 4.2, 0.5, 0.85, 1.0, 'washstand');
  B.box('marble', 6.6, 5.06, 6.6, 0.52, 0.03, 1.02); B.mesh(G.sphere, 'porcelain', 6.6, 5.12, 6.6, 0.42, 0.1, 0.42);
  B.furniture('wood', 10.6, 6.4, 4.2, 0.5, 0.95, 0.5, 'chair');
  B.furniture('darkWood', 17.3, 11.0, 4.2, 0.45, 0.45, 0.6, 'luggage stand');
  B.box('leather', 17.3, 4.82, 11.0, 0.42, 0.24, 0.62); B.box('brass', 17.08, 4.86, 11.0, 0.02, 0.04, 0.12);   // a suitcase, still packed
  B.picture(12.0, 6.2, 11.78, Math.PI, 0.6, 0.45, 'landscape', 61);
  rug(12.0, 4.2, 7.9, 1.8, 0.9, 0, 'carpet');

  /* ================= ELEANOR'S SITTING ROOM ================= */
  at("eleanor's sitting room", 'upper');
  B.furniture('wood', -9.0, -0.3, 4.2, 0.48, 0.95, 0.48, 'chair');
  B.furniture('fabricCream', -13.3, 2.0, 4.2, 0.85, 0.85, 0.85, 'armchair');
  B.mesh(G.post, 'brass', -17.3, 4.9, 1.9, 0.04, 1.4, 0.04); B.mesh(G.cyl, 'brass', -17.3, 4.22, 1.9, 0.36, 0.04, 0.36); birdcage(-17.3, 5.6, 1.9);
  P.addWall(-17.5, -17.1, 1.7, 2.1, 4.2, 6.2, { kind: 'furniture', tag: 'birdcage stand' });
  books(-9.4, 4.96, 0.8, 3, 0.4); B.box('paper', -9.3, 4.97, 0.3, 0.3, 0.004, 0.22, -0.2); B.mesh(G.cyl, 'black', -8.9, 5.0, 0.75, 0.05, 0.07, 0.05);
  for (let i = 0; i < 5; i++) B.box('paper', -12.6 + i * 0.36, 5.7 + (i % 2) * 0.18, -3.88, 0.26, 0.2, 0.004, (rnd() - 0.5) * 0.15); // her drawings
  rug(-12.5, 4.2, 0.6, 3.2, 2.2, 0, 'carpet');

  /* ================= THE GALLERY ================= */
  at('gallery', 'upper');
  B.furniture('fabricRed', 11.5, 1.6, 4.2, 1.6, 0.42, 0.5, 'ottoman');
  for (const x of [7.0, 16.8]) {
    B.furniture('marble', x, -3.35, 4.2, 0.45, 1.1, 0.45, 'pedestal');
    B.mesh(G.sphere, 'statue', x, 5.55, -3.35, 0.26, 0.32, 0.24); B.mesh(G.cyl, 'statue', x, 5.38, -3.35, 0.36, 0.14, 0.24);
  }
  runner(7, 17, -0.45, 0.45, 4.2);

  /* ================= THE LANDING AND UPPER CORRIDORS ================= */
  at('upper corridor', 'upper');
  B.furniture('wood', -5.45, -1.2, 4.2, 0.48, 0.95, 0.48, 'chair');
  B.furniture('wood', 3.3, -0.45, 4.2, 0.48, 0.95, 0.48, 'chair');
  B.furniture('darkWood', -3.6, -0.4, 4.2, 1.1, 0.55, 0.5, 'linen chest');
  vase(2.2, 5.0, -3.5, true);
  for (const x of [-3.5, 3.5]) B.picture(x, 6.0, -0.12, Math.PI, 0.55, 0.7, 'portrait', 70 + x);
  runner(-0.45, 0.45, -10.4, -0.6, 4.2);
  for (const z of [-6.2, -10.0]) B.picture(-5.88, 6.0, z, Math.PI / 2, 0.5, 0.4, 'landscape', 80 + z);
  B.box('paintedWood', -17.85, 5.25, -5.0, 0.06, 2.0, 0.8); B.mesh(G.sphere, 'brass', -17.8, 5.2, -4.75, 0.04);   // the housemaid's cupboard

  /* ================= ELEANOR'S BEDROOM ================= */
  at("eleanor's bedroom", 'upper');
  B.furniture('wood', -9.6, -11.45, 4.2, 0.9, 0.7, 0.5, 'dolls house table');
  B.box('brick', -9.6, 5.15, -11.45, 0.7, 0.5, 0.4); { const r = B.mesh(G.wedge, 'slate', -9.6, 5.4, -11.45, 0.74, 0.3, 0.42); }
  for (let i = 0; i < 6; i++) B.box(i === 2 ? 'candleGlow' : 'darkGlass', -9.85 + (i % 3) * 0.25, 5.05 + Math.floor(i / 3) * 0.2, -11.24, 0.08, 0.1, 0.01);
  // the blackboard on its easel, a lesson half rubbed out
  for (const dx of [-0.3, 0.3]) { const l = B.mesh(G.post, 'wood', -7.4 + dx, 5.0, -8.6, 0.04, 1.6, 0.04); l.rotation.x = -0.15; l.updateMatrix(); }
  label('Eleanor Blackthorn\n  5  x  7  =  35\n  I must not tell', -7.4, 5.2, -8.55, 0, 0.7, 0.5, { w: 256, h: 180, size: 20, bg: '#1e2420', fg: '#cfd2c8', border: '#4a3a28' });
  P.addWall(-7.8, -7.0, -8.8, -8.4, 4.2, 5.8, { kind: 'furniture', tag: 'blackboard' });
  // the dolls' tea party: four chairs, three dolls, one place empty
  B.furniture('wood', -10.5, -8.0, 4.2, 0.6, 0.45, 0.6, 'tea party table');
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, x = -10.5 + Math.cos(a) * 0.42, z = -8.0 + Math.sin(a) * 0.42; B.box('wood', x, 4.4, z, 0.2, 0.04, 0.2); if (i < 3) doll(x, 4.42, z, -a + Math.PI / 2, ['dollDress', 'fabricRed', 'flowersWhite'][i]); }
  for (let i = 0; i < 4; i++) B.mesh(G.cyl, 'porcelain', -10.5 + Math.cos(i * 1.57) * 0.18, 4.68, -8.0 + Math.sin(i * 1.57) * 0.18, 0.06, 0.04, 0.06);
  // her drawings pinned at child height along the wall, the dates rising to 1974
  for (let i = 0; i < 9; i++) B.box('paper', -6.12, 5.0 + (i % 2) * 0.32, -11.4 + i * 0.32, 0.004, 0.26, 0.28, 0);
  for (let i = 0; i < 9; i++) B.box(['flowersRed', 'fabricGreen', 'flowersPurple'][i % 3], -6.115, 5.0 + (i % 2) * 0.32 + 0.03, -11.4 + i * 0.32 - 0.04, 0.003, 0.08, 0.1);
  // bars on the window, added later; the bolt on the outside of her door
  for (let i = 0; i < 5; i++) B.mesh(G.post, 'iron', -12.6 + i * 0.3, 5.75, -11.74, 0.03, 1.6, 0.03);
  B.box('iron', -5.86, 5.5, -7.25, 0.05, 0.05, 0.3); B.box('iron', -5.84, 5.5, -7.35, 0.08, 0.12, 0.04);
  label('Thou God\nseest me\nE.B. aged 9', -17.79, 5.8, -8.0, Math.PI / 2, 0.32, 0.28, { w: 192, h: 160, size: 22, bg: '#e2d6b4', fg: '#2a3a6a' });
  for (let i = 0; i < 6; i++) B.box('black', -6.1 + 0.002, 4.5 + i * 0.18, -8.75, 0.002, 0.004, 0.12); // a height chart on the frame
  rug(-13.0, 4.2, -9.0, 1.4, 1.0, 0, 'carpet');

  /* ================= THE LINEN ROOM ================= */
  at('upper corridor', 'upper'); // the linen presses along the back of the landing
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) B.box(i % 3 ? 'linen' : 'dustSheet', -1.6 + i * 0.62, 4.75 + r * 0.45, -11.45, 0.5, 0.12 + rnd() * 0.12, 0.45);
  B.mesh(G.cyl, 'leafLitter2', 3.8, 4.45, -7.2, 0.6, 0.5, 0.45); B.box('linen', 3.8, 4.72, -7.2, 0.5, 0.08, 0.35);
  { const ib = B.box('wood', -3.6, 4.95, -7.0, 1.3, 0.04, 0.35, 0.0); ib.rotation.z = 0.0; ib.updateMatrix(); }
  for (const dx of [-0.4, 0.4]) { const l = B.mesh(G.post, 'wood', -3.6 + dx, 4.58, -7.0, 0.03, 0.75, 0.03); l.rotation.z = dx > 0 ? 0.25 : -0.25; l.updateMatrix(); }

  /* ================= THE NURSERY ================= */
  at('nursery', 'upper');
  B.furniture('wood', 16.8, -7.0, 4.2, 0.9, 0.55, 0.5, 'toy chest');
  B.furniture('wood', 6.3, -9.5, 4.2, 0.35, 0.9, 1.2, 'bookcase');
  for (let i = 0; i < 3; i++) doll(15.0 + i * 0.3, 4.62, -10.5, 0, ['dollDress', 'fabricCream', 'flowersPurple'][i]);
  B.box('wood', 12.5, 5.06, -8.5, 0.34, 0.12, 0.16); B.mesh(G.wedge, 'darkWood', 12.5, 5.12, -8.5, 0.36, 0.14, 0.17); // Noah's ark on the table
  label('A was an Apple\nB was a Bear', 12.0, 5.9, -11.79, 0, 0.6, 0.4, { w: 256, h: 160, size: 22, bg: '#e8e0c8' });
  rug(12.0, 4.2, -9.4, 2.2, 1.6, 0, 'carpet');

  /* ================= THE ATTIC ================= */
  at('attic', 'attic');
  pram(-8.0, 8.2, 4.0, 0.4); pram(8.5, 8.2, -4.0, -2.2);
  P.addWall(-8.4, -7.6, 3.4, 4.6, 8.2, 9.3, { kind: 'furniture', tag: 'pram' }); P.addWall(8.0, 9.0, -4.6, -3.4, 8.2, 9.3, { kind: 'furniture', tag: 'pram' });
  B.furniture('wood', -12.0, -4.6, 8.2, 0.6, 0.9, 0.6, 'hat boxes');
  for (let i = 0; i < 3; i++) B.mesh(G.cyl, ['fabricCream', 'fabricRed', 'leather'][i], -12.0, 8.32 + i * 0.3, -4.6, 0.55 - i * 0.08, 0.26, 0.55 - i * 0.08);
  for (let i = 0; i < 3; i++) { const c = B.mesh(G.cyl, 'carpet', -15.5, 8.33 + (i === 2 ? 0.26 : 0), -5.0 + i * 0.32 - (i === 2 ? 0.16 : 0), 0.3, 2.4, 0.3); c.rotation.z = Math.PI / 2; c.updateMatrix(); }
  P.addWall(-16.7, -14.3, -5.2, -4.2, 8.2, 8.8, { kind: 'furniture', tag: 'rolled carpets' });
  B.furniture('metalDark', 5.0, -5.4, 8.2, 1.4, 0.45, 0.7, 'tin bath');
  B.furniture('wood', 14.5, 4.6, 8.2, 1.2, 0.8, 0.65, 'broken cot');
  B.furniture('iron', 15.5, -5.0, 8.2, 1.9, 0.5, 0.9, 'servant bed');
  B.box('linen', 15.5, 8.75, -5.0, 1.8, 0.1, 0.85); B.box('dustSheet', 15.1, 8.82, -5.0, 1.0, 0.05, 0.86);
  label('PREPARE TO\nMEET THY GOD', 17.79, 9.1, -5.0, -Math.PI / 2, 0.42, 0.3, { w: 192, h: 140, size: 22, bg: '#e2d6b4', fg: '#222' });
  birdcage(3.0, 10.4, 1.2); B.mesh(G.post, 'iron', 3.0, 11.0, 1.2, 0.01, 1.0, 0.01);
  for (let i = 0; i < 5; i++) B.picture(-4.6 + i * 0.05, 8.75, 5.2 + i * 0.08, Math.PI + 0.06, 0.8, 0.95, 'stilllife', 90 + i);

  /* ================= THE CELLAR ================= */
  at('cellar', 'cellar');
  B.furniture('darkWood', -14.0, 1.55, -3.2, 4.0, 1.9, 0.4, 'jar shelves');
  for (let r = 0; r < 3; r++) { B.box('darkWood', -14.0, -3.2 + 0.5 + r * 0.55, 1.55, 4.0, 0.03, 0.4); jars(-15.9, -12.1, -3.2 + 0.52 + r * 0.55, 1.55); }
  B.furniture('iron', 2.4, -0.2, -3.2, 0.8, 1.3, 0.5, 'mangle');
  for (const y of [-2.2, -2.05]) { const r = B.mesh(G.cyl, 'wood', 2.4, y, -0.2, 0.14, 0.72, 0.14); r.rotation.z = Math.PI / 2; r.updateMatrix(); }
  { const w = B.mesh(G.ring, 'iron', 2.85, -2.1, -0.2, 0.5, 0.5, 0.5); w.rotation.y = Math.PI / 2; w.updateMatrix(); }
  B.furniture('brick', 4.4, -9.4, -3.2, 0.9, 0.95, 0.9, 'copper');
  B.mesh(G.cyl, 'brass', 4.4, -2.2, -9.4, 0.7, 0.06, 0.7);
  B.furniture('darkWood', 4.95, -11.55, -3.2, 1.6, 1.8, 0.4, 'jar shelves');
  for (let r = 0; r < 3; r++) { B.box('darkWood', 4.95, -3.2 + 0.45 + r * 0.5, -11.55, 1.6, 0.03, 0.4); jars(4.3, 5.6, -3.2 + 0.47 + r * 0.5, -11.55); }
  for (const x of [-1.6, -1.2]) { B.mesh(G.cyl, 'flowersRed', x, -2.98, -0.9, 0.3, 0.44, 0.22); B.mesh(G.cyl, 'black', x, -2.72, -0.9, 0.06, 0.08, 0.06); } // paraffin cans by the boiler
  for (let i = 0; i < 6; i++) B.mesh(G.cyl, 'wax', -10.3 + i * 0.07, -2.38, -11.6, 0.03, 0.03 + rnd() * 0.06, 0.03); // candle stubs on the ledge
  B.box('leather', -10.0, -2.38, -11.35, 0.22, 0.04, 0.3); // the wine ledger

  /* ================= THE GATEKEEPER'S LODGE: the back room and the monitor ================= */
  at('lodge', 'ground', 'exterior');
  // the back room, built onto the west side of the lodge through a door by the stove
  const BR = { x0: -17.2, x1: -14, z0: 81.0, z1: 86.5, h: 2.8 };
  B.wall('z', BR.x0, BR.z0, BR.z1, { t: 0.3, mat: 'plaster', matOut: 'brick', outSign: -1, y1: BR.h }, [{ at: 83.6, w: 0.9, type: 'window', id: 'lodge-back-window', sill: 1.0, head: 2.1 }]);
  B.wall('x', BR.z0, BR.x0 - 0.15, BR.x1 - 0.2, { t: 0.3, mat: 'plaster', matOut: 'brick', outSign: -1, y1: BR.h });
  B.wall('x', BR.z1, BR.x0 - 0.15, BR.x1 - 0.2, { t: 0.3, mat: 'plaster', matOut: 'brick', outSign: 1, y1: BR.h });
  B.boxE('stone', BR.x0 + 0.15, BR.x1 - 0.2, 0, 0.04, BR.z0 + 0.15, BR.z1 - 0.15);
  P.rect(BR.x0 - 0.3, BR.x1, BR.z0 - 0.3, BR.z1 + 0.3, BR.h + 0.2, BR.h, 'lodge-back-roof');
  B.boxE('plaster', BR.x0, BR.x1 - 0.2, BR.h, BR.h + 0.15, BR.z0, BR.z1);
  { const r = B.box('roof', (BR.x0 + BR.x1) / 2 - 0.1, BR.h + 0.45, (BR.z0 + BR.z1) / 2, 3.8, 0.16, 6.1); r.rotation.z = 0.22; r.updateMatrix(); }
  game.lodgeBackDoor = B.hingedDoor({ id: 'lodge-back-door', axis: 'z', at: 83.05, c: -14, w: 0.9, h: 2.05, hinge: 'high', swing: -1, outside: 1, mat: 'shutter', panelMat: 'boards', dur: 1.2, sound: 'creak', label: 'the back room door', wallT: 0.4 });
  game.lodgeBackDoor.open = true; game.lodgeBackDoor.opened = true; game.lodgeBackDoor.t = 1; game.lodgeBackDoor.wall.enabled = false; game.lodgeBackDoor.angle(game.lodgeBackDoor.maxAngle);
  B.room = 'lodge back room';
  B.furniture('iron', -16.1, 85.7, 0, 1.85, 0.5, 0.85, 'camp bed');
  B.box('linen', -16.05, 0.55, 85.7, 1.8, 0.08, 0.8); B.box('fabricGreen', -15.7, 0.62, 85.7, 1.1, 0.05, 0.82); B.mesh(G.sphere, 'linen', -16.75, 0.64, 85.7, 0.4, 0.1, 0.55);
  B.furniture('darkWood', -16.75, 82.0, 0, 0.45, 0.8, 0.9, 'washstand');
  B.mesh(G.sphere, 'porcelain', -16.75, 0.86, 82.0, 0.36, 0.08, 0.36); B.mesh(G.sphere, 'porcelain', -16.7, 1.0, 81.8, 0.12, 0.24, 0.12);
  mirror(-17.02, 1.55, 82.0, Math.PI / 2, 0.36, 0.45);
  B.furniture('darkWood', -14.65, 85.85, 0, 0.88, 0.85, 0.45, 'chest of drawers');
  B.mesh(G.cyl, 'black', -14.65, 0.95, 85.85, 0.12, 0.2, 0.12); label('Woman\'s Realm', -14.45, 0.86, 85.75, 0.3, 0.2, 0.26, { w: 96, h: 128, size: 14, bg: '#c8384a', fg: '#fff' }).rotation.x = -Math.PI / 2;
  B.box('black', -15.2, 0.12, 81.4, 0.14, 0.24, 0.3); B.box('black', -15.0, 0.12, 81.4, 0.14, 0.24, 0.3); // wellingtons
  B.box('leather', -17.0, 1.7, 84.8, 0.08, 0.15, 1.1); // the shotgun case on its pegs
  for (const z of [84.4, 85.2]) B.box('darkWood', -17.0, 1.6, z, 0.12, 0.04, 0.04);
  B.fixture({ id: 'lodge-back-bulb', name: 'Back room bulb', circuit: 'lodge', kind: 'incandescent', style: 'pendant', pos: [-15.6, 2.3, 83.8], ceiling: BR.h, colour: 0xffc070, target: 0.9, range: 6 });
  B.lightSwitch('sw-lodge-back', 'Back room light', [-14.3, 1.4, 84.3], [-1, 0], ['lodge-back-bulb']);
  B.room = 'lodge';
  // in the lodge proper: a noticeboard, the keys board, a coat on the door, the calendar
  B.box('frame', -9.6, 1.7, 80.22, 0.9, 0.6, 0.03); B.box('fabricGreen', -9.6, 1.7, 80.24, 0.82, 0.52, 0.01);
  for (let i = 0; i < 5; i++) B.box('paper', -9.9 + (i % 3) * 0.26, 1.82 - Math.floor(i / 3) * 0.24, 80.255, 0.18, 0.2, 0.003, (rnd() - 0.5) * 0.2);
  B.box('darkWood', -13.78, 1.5, 86.0, 0.03, 0.5, 0.6); label('GATE KEYS', -13.75, 1.8, 86.0, Math.PI / 2, 0.3, 0.06, { w: 160, h: 36, size: 20 });
  for (let i = 0; i < 16; i++) { const z = 85.78 + (i % 8) * 0.06, y = 1.55 - Math.floor(i / 8) * 0.18; B.box('brass', -13.75, y, z, 0.03, 0.01, 0.01); if (rnd() < 0.5) B.box('brass', -13.74, y - 0.05, z, 0.004, 0.06, 0.012); }
  label('ESSO\n1974\nOCTOBER', -6.21, 1.75, 86.8, -Math.PI / 2, 0.3, 0.42, { w: 128, h: 180, size: 20, bg: '#e8e0c8', fg: '#a01818' });
  // the gate monitor: a small set on a bracket, the picture from the camera on the right-hand pier
  B.box('metalDark', -6.32, 1.62, 85.0, 0.2, 0.06, 0.3); B.box('black', -6.42, 1.82, 85.0, 0.24, 0.3, 0.36);
  const mc = document.createElement('canvas'); mc.width = 128; mc.height = 96;
  const mt = new THREE.CanvasTexture(mc), mm = new THREE.MeshBasicMaterial({ map: mt, color: 0x111111 }); mm.userData.unique = true;
  B.mesh(G.plane, mm, -6.55, 1.82, 85.0, 0.27, 0.2, 1, -Math.PI / 2);
  game.gateMonitor = { on: false, canvas: mc, tex: mt, mat: mm, t: 0 };
  B.interactable({
    id: 'gate-monitor', label: () => game.gateMonitor.on ? 'Switch off the gate monitor' : 'Switch on the gate monitor', pos: [-6.56, 1.66, 85.0], n: [-1, 0], approachDist: 0.9,
    act: g => {
      if (!g.grid.lodge) { g.audio.click(); g.ui.say('The set is dead. No power to the lodge.'); return; }
      g.gateMonitor.on = !g.gateMonitor.on; g.audio.click();
      if (g.gateMonitor.on) { g.audio.tone('sine', 15600, 15600, 0.02, 0.05, 2.5); g.ui.say('The tube warms with a whine, and a grey picture of the gates rolls up out of the snow.', 4); }
    },
  });
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'house';
};

/* The gate monitor's picture: the two leaves from the camera on the pier, in grey snow. */
BM.updateGateMonitor = function (game, dt) {
  const m = game.gateMonitor; if (!m) return;
  const live = m.on && game.grid.lodge;
  m.mat.color.setHex(live ? 0xffffff : 0x111111);
  if (!live) return;
  m.t += dt; if (m.t < 0.12) return; m.t = 0;
  const c = m.canvas, g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = '#1c1e1c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#4a4e4a'; g.fillRect(0, H * 0.62, W, H * 0.38);                  // the drive
  g.fillStyle = '#5a5e58'; g.fillRect(4, H * 0.18, 18, H * 0.6); g.fillRect(W - 22, H * 0.18, 18, H * 0.6); // the piers
  const leaves = game.gates.leaves, a = leaves ? Math.abs(leaves[0].rotation.y) : 0;
  g.strokeStyle = '#8a8e88'; g.lineWidth = 2;
  for (const s of [-1, 1]) {
    const hx = s < 0 ? 22 : W - 22, len = (W / 2 - 22) * Math.cos(a);
    for (let i = 0; i <= 8; i++) { const x = hx - s * len * i / 8; g.beginPath(); g.moveTo(x, H * 0.3 + a * 6 * i / 8); g.lineTo(x, H * 0.72 + a * 4 * i / 8); g.stroke(); }
    g.beginPath(); g.moveTo(hx, H * 0.33); g.lineTo(hx - s * len, H * 0.33 + a * 6); g.stroke();
  }
  // snow, rolling bars, the time stamp
  const img = g.getImageData(0, 0, W, H), d = img.data, roll = (performance.now ? performance.now() : Date.now()) / 40 % H;
  for (let i = 0; i < d.length; i += 4) {
    const y = (i / 4 / W) | 0, n = (Math.random() - 0.5) * 70 + (Math.abs(y - roll) < 6 ? 25 : 0);
    d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, (d[i] + d[i + 1] + d[i + 2]) / 3 + n));
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = '#d8d8d8'; g.font = '9px monospace'; g.fillText('CAM 1  GATES', 4, 10);
  m.tex.needsUpdate = true;
};
})();
