/* ==========================================================================
   BLACKTHORN MANOR — 6y. ROOM POLISH
   A pass through every room with the lights on, filling the ones that read
   as empty boxes with the things that room would really have held:
   - the stair hall: a console table and lamp under a mirror, hall chairs,
     a dead palm, the family's pictures and the estate map on the walls;
   - the boot room: a glass-fronted gun cabinet, fishing rods, wellingtons,
     a dog's basket, a cleaning table, logs;
   - the bathroom: a towel rail, a bath mat, a shelf of bottles, a basket.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildPolish = function (B, game) {
  const P = B.phys;
  const solid = (x0, x1, z0, z1, y0, y1, tag) => P.addWall(x0, x1, z0, z1, y0, y1, { kind: 'furniture', tag });
  const tiltPost = (mat, x, y, z, h, r, rx, rz) => { const m = B.mesh(G.post, mat, x, y, z, r, h, r); m.rotation.set(rx || 0, 0, rz || 0); m.updateMatrix(); return m; };
  B.zone = 'mansion'; B.levelName = 'ground';

  /* ======================= THE STAIR HALL ======================= */
  B.room = 'corridor';
  // a console table against the east wall, a lamp, a bowl, a mirror over it
  B.furniture('darkWood', 3.48, -6.6, 0, 0.5, 0.82, 1.8, 'console table');
  B.mesh(G.cyl, 'brass', 3.5, 0.95, -7.2, 0.14, 0.26, 0.14); B.mesh(G.cone, 'fabricCream', 3.5, 1.22, -7.2, 0.36, 0.26, 0.36);
  B.fixture({ id: 'stairhall-lamp', name: 'Table lamp', circuit: 'ground', kind: 'lamp', style: 'none', pos: [3.5, 1.15, -7.2], colour: 0xffc070, target: 0.5, range: 4, corona: 0.4 });
  B.mesh(G.sphere, 'porcelain', 3.5, 0.9, -6.2, 0.36, 0.14, 0.36);
  B.box('gilt', 3.77, 1.85, -6.6, 0.04, 0.95, 1.1); B.box('glass', 3.74, 1.85, -6.6, 0.01, 0.85, 1.0);
  for (const z of [-8.1, -5.1]) B.furniture('darkWood', 3.4, z, 0, 0.46, 0.95, 0.46, 'chair');
  // a dead kentia palm in a brass pot between the kitchen door and the hall stand
  B.mesh(G.cyl, 'brass', -5.45, 0.25, -8.3, 0.5, 0.5, 0.5); solid(-5.75, -5.15, -8.6, -8.0, 0, 1.2, 'palm');
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; tiltPost('deadStalk', -5.45 + Math.cos(a) * 0.18, 0.95, -8.3 + Math.sin(a) * 0.18, 0.9, 0.025, Math.sin(a) * 0.5, -Math.cos(a) * 0.5); }
  // pictures: a pair of hunting prints by the lift, the estate map framed over the settle
  B.picture(3.78, 1.95, -3.9, -Math.PI / 2, 0.55, 0.42, 'landscape', 91);
  B.picture(3.78, 1.95, -9.2, -Math.PI / 2, 0.55, 0.42, 'landscape', 92);
  B.box('gilt', -5.87, 1.95, -3.65, 0.03, 0.72, 1.1);
  B.mesh(G.plane, BM.labelMat('PLAN OF THE\nBLACKTHORN ESTATE\n1961', { w: 256, h: 160, size: 22, bg: '#d8c69c', fg: '#3a2c1a', border: '#8a7044' }), -5.85, 1.95, -3.65, 1.0, 0.62, 1, Math.PI / 2);
  // a long-case barometer and a brass dinner gong by the arch
  B.box('darkWood', -0.95, 1.6, -0.14, 0.18, 1.0, 0.04); B.mesh(G.cyl, 'brass', -0.95, 1.95, -0.17, 0.14, 0.02, 0.14).rotation.x = Math.PI / 2;
  B.box('darkWood', 1.6, 0.6, -0.5, 0.06, 1.2, 0.06); B.box('darkWood', 2.4, 0.6, -0.5, 0.06, 1.2, 0.06); B.box('darkWood', 2.0, 1.18, -0.5, 0.86, 0.05, 0.06);
  { const gong = B.mesh(G.cyl, 'brass', 2.0, 0.78, -0.5, 0.6, 0.03, 0.6); gong.rotation.x = Math.PI / 2; gong.updateMatrix(); }
  solid(1.55, 2.45, -0.6, -0.4, 0, 1.2, 'dinner gong');

  /* ======================= THE BOOT ROOM AND GUNS ======================= */
  B.room = 'service';
  // the gun cabinet: a tall glazed case against the west wall, four guns standing in it, the key in the lock
  { const x = 10.38, z0 = -8.4, z1 = -6.9, h = 2.0;
    B.boxE('darkWood', 10.12, 10.62, 0, 0.12, z0, z1); B.boxE('darkWood', 10.12, 10.62, h - 0.12, h, z0, z1);
    B.boxE('darkWood', 10.12, 10.62, 0, h, z0, z0 + 0.06); B.boxE('darkWood', 10.12, 10.62, 0, h, z1 - 0.06, z1);
    B.boxE('darkWood', 10.12, 10.16, 0, h, z0, z1);
    const gl = B.boxE('glass', 10.6, 10.62, 0.12, h - 0.12, z0 + 0.06, z1 - 0.06); gl.userData.glass = true;
    for (let i = 0; i < 4; i++) { const z = z0 + 0.3 + i * 0.3; B.box('black', x - 0.02, 1.05, z, 0.04, 1.6, 0.03); B.box('darkWood', x - 0.02, 0.45, z, 0.07, 0.6, 0.06); }
    B.box('brass', 10.63, 1.0, z1 - 0.12, 0.02, 0.04, 0.02);
    solid(10.1, 10.65, z0, z1, 0, h, 'gun cabinet'); }
  // fishing rods leaning in the corner, a creel on a nail
  for (let i = 0; i < 3; i++) tiltPost(i === 1 ? 'wood' : 'darkWood', 10.35 + i * 0.08, 1.35, -11.45, 2.6, 0.03, 0, -0.12 - i * 0.03);
  B.box('wood', 10.2, 1.5, -10.6, 0.25, 0.3, 0.4);
  // wellingtons in pairs along the north wall
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const x = 14.3 + i * 0.5 + s * 0.08; B.mesh(G.cyl, i === 2 ? 'garageGreen' : 'black', x, 0.2, -4.32, 0.12, 0.4, 0.15); B.box(i === 2 ? 'garageGreen' : 'black', x, 0.05, -4.42, 0.11, 0.08, 0.2); }
  // the dog's basket, an old blanket, a lead on the floor, a bowl
  B.mesh(G.cyl, 'wood', 11.2, 0.12, -10.6, 1.0, 0.24, 0.75); B.mesh(G.cyl, 'fabricRed', 11.2, 0.2, -10.6, 0.86, 0.06, 0.62);
  B.mesh(G.cyl, 'metal', 12.05, 0.04, -10.25, 0.24, 0.07, 0.24); B.box('leather', 11.7, 0.02, -9.9, 0.5, 0.01, 0.03, 0.4);
  solid(10.7, 11.7, -11.0, -10.2, 0, 0.3, 'dog basket');
  B.readable('boot-dog', "A dog's collar", 'A worn leather collar on the edge of the basket, the brass plate rubbed nearly smooth:\n\nJUDY\nBLACKTHORN MANOR\n\nThe blanket in the basket still has the hollow she slept in.', [11.2, 0.27, -10.3], [0, 1], { plaque: true });
  // a scrubbed table with the gun-cleaning things laid out
  B.furniture('wood', 12.0, -8.2, 0, 1.6, 0.85, 0.8, 'table');
  B.box('linen', 11.7, 0.87, -8.2, 0.5, 0.01, 0.3, 0.2); B.mesh(G.post, 'darkWood', 11.75, 0.88, -8.25, 0.02, 0.9, 0.02).rotation.z = Math.PI / 2;
  B.mesh(G.cyl, 'metalDark', 12.35, 0.93, -8.0, 0.1, 0.14, 0.1); for (let i = 0; i < 3; i++) B.box('fabricRed', 12.55 + i * 0.08, 0.89, -8.45, 0.07, 0.06, 0.11);
  // logs stacked in the corner by the window
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const l = B.mesh(G.cyl, 'bark', 16.45 + i * 0.22 + r * 0.11, 0.11 + r * 0.19, -11.2, 0.2, 0.9, 0.2); l.rotation.x = Math.PI / 2; l.updateMatrix(); }
  solid(16.3, 17.8, -11.7, -10.7, 0, 0.8, 'logs');
  // walking sticks in a stand by the back door
  B.mesh(G.cyl, 'brass', 17.45, 0.25, -4.25, 0.26, 0.5, 0.26); for (let i = 0; i < 4; i++) tiltPost('darkWood', 17.42 + (i % 2) * 0.05, 0.6, -4.28 + i * 0.03, 1.0, 0.025, (i - 1.5) * 0.06, (i % 2 - 0.5) * 0.1);
  solid(17.3, 17.6, -4.4, -4.1, 0, 0.9, 'stick stand');

  /* ======================= THE BATHROOM ======================= */
  B.room = 'bathroom';
  B.box('chrome', 9.86, 1.1, -9.5, 0.04, 0.04, 0.9); for (const z of [-9.9, -9.1]) B.box('chrome', 9.88, 1.1, z, 0.04, 0.04, 0.04);
  B.box('linen', 9.83, 0.88, -9.5, 0.03, 0.45, 0.7);                                         // a towel over the rail
  B.box('fabricCream', 8.6, 0.012, -10.0, 0.9, 0.012, 0.55);                                 // the bath mat
  B.box('white', 9.82, 1.55, -7.6, 0.12, 0.02, 0.55);                                         // a glass shelf over the basin
  for (let i = 0; i < 4; i++) B.mesh(G.cyl, ['glass', 'porcelain', 'darkGlass', 'flowersPurple'][i], 9.82, 1.62, -7.82 + i * 0.14, 0.05, 0.12 + (i % 2) * 0.05, 0.05);
  B.mesh(G.cyl, 'wood', 6.5, 0.3, -10.4, 0.42, 0.6, 0.42); solid(6.28, 6.72, -10.62, -10.18, 0, 0.6, 'laundry basket');
  B.box('linen', 6.45, 0.62, -10.4, 0.36, 0.05, 0.3, 0.3);

  /* ======================= ELEANOR'S BEDROOM (as a girl) ======================= */
  B.levelName = 'upper'; B.room = "eleanor's bedroom";
  const U = 4.2;
  B.furniture('wood', -16.2, -4.45, U, 1.2, 2.0, 0.6, 'wardrobe');
  B.furniture('wood', -9.0, -4.4, U, 1.0, 0.85, 0.5, 'chest of drawers');
  B.mesh(G.sphere, 'porcelain', -9.3, U + 0.95, -4.45, 0.16, 0.2, 0.16); B.box('gilt', -8.8, U + 1.35, -4.13, 0.5, 0.6, 0.03);
  B.furniture('wood', -17.55, -6.0, U, 0.4, 1.2, 1.2, 'bookcase');
  B.box('fabricCream', -12.0, U + 0.012, -7.8, 3.2, 0.012, 2.3);
  B.furniture('fabricRed', -16.6, -7.2, U, 0.7, 0.8, 0.7, 'armchair');
  B.furniture('wood', -15.5, -9.85, U, 1.4, 0.5, 0.45, 'toy chest');
  // a worn teddy on the pillow
  B.mesh(G.sphere, 'leather', -15.9, U + 0.86, -11.3, 0.28, 0.3, 0.22); B.mesh(G.sphere, 'leather', -15.9, U + 1.1, -11.32, 0.2, 0.19, 0.18);
  for (const s of [-1, 1]) B.mesh(G.sphere, 'leather', -15.9 + s * 0.08, U + 1.19, -11.32, 0.07, 0.07, 0.05);
  // a Pony Club rosette pinned over the bed
  { const r = B.mesh(G.disc, BM.Basic(0x2040a0), -15.5, U + 2.05, -11.77, 0.24, 0.24, 1); void r; B.box(BM.Basic(0x2040a0), -15.5, U + 1.82, -11.77, 0.07, 0.26, 0.01); }
  // her height, pencilled on the wall by the door, year by year — until 1961
  B.mesh(G.plane, BM.labelMat('— E. 1961\n\n— E. 1960\n\n— E. 1959\n— E. 1958\n\n— E. 1957\n— E. 1956\n\n— E. 1955\n\n— E. 1953', { w: 128, h: 320, size: 16, bg: 'rgba(0,0,0,0)', fg: '#3a3430' }), -6.13, U + 1.05, -5.0, 0.22, 0.55, 1, -Math.PI / 2);
  B.readable('height-marks', 'Pencil marks by the door', 'Pencil lines on the wallpaper by the door, each with a date beside it in a grown-up hand: E. 1953, E. 1955, E. 1956 ... a little higher every year.\n\nThe last one says E. 1961.\n\nAfter that, nobody measured.', [-6.14, U + 1.1, -5.0], [1, 0], { visual: false });

  /* ======================= THE WEST CELLAR ======================= */
  B.levelName = 'cellar'; B.room = 'cellar w';
  const C = -3.2;
  B.furniture('wood', -17.5, -10.0, C, 0.6, 2.2, 2.6, 'wine rack');
  for (let r = 0; r < 6; r++) for (let i = 0; i < 7; i++) if ((r * 7 + i) % 5) { const b = B.mesh(G.cyl, 'darkGlass', -17.25, C + 0.25 + r * 0.33, -11.1 + i * 0.32, 0.08, 0.3, 0.08); b.rotation.z = Math.PI / 2; b.updateMatrix(); }
  for (const [x, z] of [[-7.0, 1.1], [-7.85, 1.15], [-7.0, 0.25]]) { B.furniture(null, x, z, C, 0.78, 1.0, 0.78, 'barrel'); B.mesh(G.cyl, 'wood', x, C + 0.5, z, 0.8, 1.0, 0.8); for (const y of [C + 0.2, C + 0.8]) B.mesh(G.cyl, 'iron', x, y, z, 0.82, 0.05, 0.82); }
  for (const [x, z, y] of [[-7.2, -10.9, 0], [-7.95, -10.9, 0], [-7.55, -10.9, 0.6], [-7.2, -10.1, 0]]) B.solid('wood', x - 0.32, x + 0.32, C + y, C + y + 0.6, z - 0.32, z + 0.32, { kind: 'furniture', tag: 'crate' });
  // the furniture they put down here when the rooms upstairs were shut: shapes under dust sheets
  for (const [x, z, w, d, h] of [[-13.0, -6.2, 2.0, 1.0, 0.95], [-10.4, -2.4, 1.2, 1.2, 1.4], [-14.6, -2.2, 0.9, 0.9, 1.1]]) {
    // the sheet: a soft rounded top over the shape, falling in a slightly wider skirt to the floor
    B.mesh(G.sphere, 'dustSheet', x, C, z, w * 1.2, h * 2, d * 1.2);
    P.addWall(x - w / 2, x + w / 2, z - d / 2, z + d / 2, C, C + h, { kind: 'furniture', tag: 'something under a sheet' }); }
  B.fixture({ id: 'cellar-5', name: 'Cellar bulb', circuit: 'cellar', style: 'cage', pos: [-12, -0.6, -9.6], colour: 0xffbb70, target: 0.8, range: 7 });


  /* ======================= THE GARDEN SHED ======================= */
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'shed';
  // tools on nails along the back wall
  const tool = (x, head, w) => { B.box('wood', x, 1.25, -3.86, 0.04, 1.3, 0.04); B.box(head, x, 0.55, -3.86, w, 0.28, 0.03); };
  tool(-30.9, 'metal', 0.2); tool(-30.45, 'metal', 0.22); tool(-30.0, 'iron', 0.42); tool(-29.6, 'rust', 0.18);
  for (const x of [-31.2, -30.6, -30.0]) B.box('iron', x, 1.92, -3.88, 0.03, 0.03, 0.06);
  // the wheelbarrow, upended on its nose, and the mower
  { const w = B.mesh(G.sphere, 'garageGreen', -28.1, 0.55, -3.55, 0.7, 0.5, 0.6); w.rotation.x = 1.25; w.updateMatrix();
    const wh = B.mesh(G.cyl, 'rubber', -28.1, 0.18, -3.12, 0.34, 0.08, 0.34); wh.rotation.z = Math.PI / 2; wh.updateMatrix();
    for (const s of [-1, 1]) B.box('wood', -28.1 + s * 0.25, 0.85, -3.75, 0.04, 0.5, 0.04); }
  P.addWall(-28.5, -27.7, -3.9, -2.95, 0, 1.0, { kind: 'furniture', tag: 'wheelbarrow' });
  B.boxE('garageGreen', -28.6, -27.6, 0.12, 0.42, -1.4, -0.7); for (const [dx, dz] of [[-0.45, -1.35], [0.45, -1.35], [-0.45, -0.75], [0.45, -0.75]]) { const r = B.mesh(G.cyl, 'rubber', -28.1 + dx, 0.12, dz, 0.22, 0.06, 0.22); r.rotation.z = Math.PI / 2; r.updateMatrix(); }
  B.box('metalDark', -28.1, 0.75, -0.6, 0.6, 0.03, 0.03); for (const s of [-1, 1]) { const h = B.box('metalDark', -28.1 + s * 0.28, 0.5, -0.55, 0.03, 0.6, 0.03); h.rotation.x = -0.4; h.updateMatrix(); }
  P.addWall(-28.7, -27.5, -1.5, -0.4, 0, 0.8, { kind: 'furniture', tag: 'lawn mower' });
  // stacked clay pots and seed trays under the bench, a coil of hose, sacks
  for (let i = 0; i < 5; i++) B.mesh(G.cyl, 'rust', -31.55, 0.08 + i * 0.07, -1.9, 0.28 - i * 0.01, 0.16, 0.28 - i * 0.01);
  for (let i = 0; i < 4; i++) B.box('wood', -31.5, 0.04 + i * 0.07, -0.6, 0.45, 0.06, 0.32);
  { const h = B.mesh(G.ring, 'garageGreen', -27.32, 1.3, 0.7, 0.55, 0.55, 0.55); h.rotation.y = Math.PI / 2; h.updateMatrix(); }
  for (const [x, z] of [[-31.5, 1.4], [-31.0, 1.5]]) B.mesh(G.lowSphere, 'linen', x, 0.28, z, 0.48, 0.56, 0.4);
  P.addWall(-31.8, -30.7, 1.1, 1.8, 0, 0.6, { kind: 'furniture', tag: 'sacks' });

  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
};
})();
