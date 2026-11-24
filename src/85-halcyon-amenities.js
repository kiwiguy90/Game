/* ==========================================================================
   HALCYON HOUSE — THE AMENITIES (from the research into 2026 luxury homes)
   - The wellness wing, east of the house on the lake: a gym with the lake
     in front of you, and a spa for the hot-and-cold circuit: an infrared
     sauna, a steam room, a cold plunge, a rain shower and loungers.
   - A glass wine room in the living space, its bottles backlit.
   - The games room upstairs: a golf simulator, a pool table, a backlit bar.
   - The main suite: a bathroom across the lake end with a freestanding bath
     and a rain shower, and a dressing room lit like a boutique.
   - Music that follows you round the house.
   - Face recognition at the front door: it knows you, and lets you in.
   - Solar panels on the garage roof, a home battery wall, and an energy
     screen that shows the sun coming in and the house using it.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const W = { x0: 26.3, x1: 44, z0: -18, z1: 4, h: 3.8, split: -3 };   // the wellness wing

function canvasMat(w, h, draw, basic) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext && c.getContext('2d'); if (g) draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.userData = { c };
  return basic === false ? new THREE.MeshPhongMaterial({ map: t }) : new THREE.MeshBasicMaterial({ map: t });
}

BM.buildHalcyonAmenities = function (B, game) {
  const HC = game.halcyon, M = BM.halcyonMats(), P = B.phys, HL = BM.HALCYON, F1 = HL.F1;
  const led = o => BM.halcyonLed(B, game, o);
  const solid = (mat, x0, x1, y0, y1, z0, z1, tag) => B.solid(mat, x0, x1, y0, y1, z0, z1, { kind: 'wall', tag: tag || 'wall' });
  const keypadIds = [];
  const roomLights = (name, level, x0, x1, z0, z1, y, step) => {
    const ids = [];
    for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) {
      ids.push(led({ id: name.replace(/\W+/g, '-') + '-' + Math.round(x * 10) + '-' + Math.round(z * 10), name: 'Downlight', room: name, pos: [x, y - 0.05, z], colour: 0xfff0dc, target: 0.9, range: 7, corona: 0.2, glow: [x, y - 0.015, z, 0.16, 0.02, 0.16] }).id);
    }
    return ids;
  };
  const keypad = (name, ids, pos, n) => {
    const [x, y, z] = pos, ry = Math.atan2(n[0], n[1]);
    B.box(M.white, x + n[0] * 0.006, y, z + n[1] * 0.006, 0.09, 0.13, 0.012, ry);
    const it = B.interactable({ id: 'k-' + name.replace(/\W+/g, '-'), label: name.charAt(0).toUpperCase() + name.slice(1) + ' lights', pos: [x + n[0] * 0.02, y, z + n[1] * 0.02], n, act: g => { it.leverOn = g.toggleFittings(ids); } });
    it.switchVisual = { lever: new THREE.Group(), ids, ry }; it.controls = ids; it.leverOn = true;
  };

  /* ================= THE WELLNESS WING ================= */
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'gym';
  B.boxE(M.floor, W.x0, W.x1, 0, 0.02, W.z0, W.z1);
  const gl = M.glazing, t = 0.04;
  B.solid(gl, W.x0, W.x1, 0, W.h, W.z0 - t, W.z0 + t, { kind: 'wall', tag: 'glass' });                 // the lake side: all glass
  B.solid(gl, W.x1 - t, W.x1 + t, 0, W.h, W.z0, W.split, { kind: 'wall', tag: 'glass' });
  for (let x = W.x0; x <= W.x1; x += 3.2) B.boxE(M.steel, x - 0.04, x + 0.04, 0, W.h, W.z0 - 0.07, W.z0 + 0.07);
  solid(M.stone, W.x1, W.x1 + 0.3, 0, W.h, W.split, W.z1 + 0.3); solid(M.stone, W.x0, W.x1, 0, W.h, W.z1, W.z1 + 0.3);
  B.levelName = 'upper'; B.floor(M.white, W.x0 - 0.3, W.x1 + 0.6, W.z0 - 0.6, W.z1 + 0.3, W.h + 0.3, 0.3); B.levelName = 'ground';
  B.boxE(M.charcoal, W.x0 - 0.3, W.x1 + 0.9, W.h + 0.3, W.h + 0.55, W.z0 - 0.9, W.z1 + 0.3);            // the roof's edge
  // the partition between the gym and the spa, with a door through it
  solid(M.timber, W.x0, 40, 0, W.h, W.split - 0.1, W.split + 0.1); solid(M.timber, 41.6, W.x1, 0, W.h, W.split - 0.1, W.split + 0.1); solid(M.timber, 40, 41.6, 2.4, W.h, W.split - 0.1, W.split + 0.1);
  // the gym: a rubber floor, a mirror wall, the machines, a screen
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x1c1d20, shininess: 4 }), W.x0, W.x1, 0.02, 0.03, W.z0, W.split);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0xcad6de, shininess: 160, specular: 0xffffff }), W.x0 + 1, 39.6, 0.3, 2.6, W.split - 0.14, W.split - 0.11);   // the mirror
  for (const [x, z] of [[30, -15], [33, -15]]) {
    B.furniture(M.charcoal, x, z, 0, 0.9, 0.25, 2.0, 'treadmill base');
    B.box(M.black, x, 0.27, z + 0.1, 0.6, 0.02, 1.6);
    for (const s of [-1, 1]) B.box(M.steel, x + s * 0.42, 0.75, z - 0.85, 0.05, 1.0, 0.05);
    const scr = B.box(new THREE.MeshBasicMaterial({ color: 0x2a8cff }), x, 1.3, z - 0.92, 0.5, 0.3, 0.03); scr.userData.dynamic = true;
  }
  B.furniture(M.black, 38, -15, 0, 2.2, 2.2, 0.7, 'weights rack'); for (let i = 0; i < 6; i++) B.mesh(G.cyl, M.steel, 37.2 + i * 0.32, 0.9 + (i % 2) * 0.6, -14.7, 0.16, 0.3, 0.16).rotation.x = Math.PI / 2;
  B.furniture(M.charcoal, 38, -10, 0, 0.5, 0.45, 1.3, 'bench');
  B.furniture(M.steel, 31.5, -8, 0, 0.6, 0.4, 2.2, 'rower');
  const tv = canvasMat(256, 144, (g) => { const gr = g.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, '#0a1a2a'); gr.addColorStop(1, '#16324a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 144); g.fillStyle = '#5ad0ff'; g.font = 'bold 20px sans-serif'; g.fillText('HIIT · 32:00', 20, 40); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText('Heart rate 128', 20, 70); g.fillText('Calories 412', 20, 92); g.fillStyle = '#ff5a8a'; g.fillRect(20, 110, 150, 8); });
  B.mesh(G.plane, tv, W.x0 + 0.06, 1.8, -10, 2.2, 1.24, 1, Math.PI / 2);
  const gymL = roomLights('gym', 'ground', W.x0, W.x1, W.z0, W.split, W.h, 3.4);
  keypad('gym', gymL, [30, 1.3, W.split - 0.12], [0, -1]);
  // the spa
  B.room = 'spa';
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x6a6258, shininess: 30 }), W.x0, W.x1, 0.02, 0.03, W.split, W.z1);
  // the infrared sauna: a cedar box with a glass front, a red-orange glow inside
  const cedar = new THREE.MeshPhongMaterial({ color: 0xa8683a, shininess: 10 });
  solid(cedar, 27, 30.4, 0, 2.3, W.z1 - 0.1 - 2.6, W.z1 - 2.5 - 0.1); solid(cedar, 27, 27.1, 0, 2.3, W.z1 - 2.7, W.z1); solid(cedar, 30.3, 30.4, 0, 2.3, W.z1 - 2.7, W.z1);
  B.boxE(cedar, 27, 30.4, 2.3, 2.4, W.z1 - 2.7, W.z1);
  B.furniture(cedar, 28.7, W.z1 - 0.6, 0, 3.2, 0.45, 0.9, 'sauna bench');
  const glow = new THREE.MeshBasicMaterial({ color: 0x200800 });
  B.box(glow, 28.7, 1.6, W.z1 - 0.16, 2.6, 0.6, 0.03);
  HC.sauna = { on: false, glow, light: led({ id: 'sauna-glow', name: 'Sauna', room: 'spa', pos: [28.7, 1.4, W.z1 - 1.2], colour: 0xff5a20, target: 0, range: 4, corona: 0 }), temp: 22 };
  HC.sauna.light.smart = false; HC.sauna.light.base = null;
  B.interactable({ id: 'sauna', label: () => HC.sauna.on ? 'Sauna: switch off (' + Math.round(HC.sauna.temp) + '°C)' : 'Sauna: switch on', pos: [28.7, 1.3, W.z1 - 2.75], n: [0, -1], act: g => BM.halcyonSauna(g) });
  // the steam room: frosted glass, mist inside
  const frost = new THREE.MeshPhongMaterial({ color: 0xe8f0f4, transparent: true, opacity: 0.55, shininess: 100 });
  solid(frost, 31, 34.4, 0, 2.4, W.z1 - 2.7, W.z1 - 2.6); solid(frost, 31, 31.1, 0, 2.4, W.z1 - 2.7, W.z1); solid(frost, 34.3, 34.4, 0, 2.4, W.z1 - 2.7, W.z1);
  B.boxE(M.white, 31, 34.4, 2.4, 2.5, W.z1 - 2.7, W.z1);
  const mistMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  HC.mist = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(G.sphere, mistMat); m.position.set(31.6 + (i % 4) * 0.8, 0.8 + Math.floor(i / 4) * 0.8, W.z1 - 1.3); m.scale.setScalar(0.8); m.userData.dynamic = true; B.root.add(m); HC.mist.push(m); }
  HC.steam2 = { on: false, mat: mistMat, light: led({ id: 'steam-light', name: 'Steam room', room: 'spa', pos: [32.7, 2.2, W.z1 - 1.3], colour: 0x80b8ff, target: 0.6, range: 4, corona: 0 }) };
  B.interactable({ id: 'steam', label: () => HC.steam2.on ? 'Steam room: switch off' : 'Steam room: switch on', pos: [32.7, 1.3, W.z1 - 2.75], n: [0, -1], act: g => BM.halcyonSteam(g) });
  // the cold plunge: a steel tub of icy water, lit blue
  B.solid(M.steel, 35.6, 38.4, 0, 0.9, W.z1 - 2.2, W.z1 - 0.6, { kind: 'wall', tag: 'cold plunge' });
  const plunge = new THREE.MeshPhongMaterial({ color: 0x9ad8ff, emissive: 0x0a3050, shininess: 140, transparent: true, opacity: 0.85 });
  B.boxE(plunge, 35.75, 38.25, 0.82, 0.84, W.z1 - 2.05, W.z1 - 0.75);
  led({ id: 'plunge-light', name: 'Cold plunge', room: 'spa', pos: [37, 0.5, W.z1 - 1.4], colour: 0x4ab8ff, target: 0.7, range: 3, corona: 0 });
  B.interactable({ id: 'plunge', label: 'Cold plunge: 6°C', pos: [37, 0.95, W.z1 - 2.25], n: [0, -1], act: g => BM.halcyonSay(g, 'The cold plunge is at six degrees. Two minutes, after the sauna.', 3) });
  // a rain shower and two loungers by the glass
  B.boxE(M.steel, 39.4, 40.6, 2.55, 2.6, W.z1 - 1.8, W.z1 - 0.6); B.boxE(new THREE.MeshPhongMaterial({ color: 0x3a3a3c, shininess: 20 }), 39.2, 40.8, 0.02, 0.04, W.z1 - 2, W.z1 - 0.4);
  for (const x of [42, 43.2]) { B.furniture(M.white, x, -0.5, 0, 0.8, 0.4, 2.0, 'lounger'); }
  const spaL = roomLights('spa', 'ground', W.x0, W.x1, W.split, W.z1, W.h, 3.4);
  keypad('spa', spaL, [36, 1.3, W.split + 0.12], [0, 1]);
  // its own rain and snow cover, and its own zone
  if (BM.ROOF_BOXES.box3) { BM.ROOF_BOXES.box3.value.set(W.x0 - 0.5, W.x1 + 0.9, W.z0 - 0.9, W.z1 + 0.5); BM.ROOF_BOXES.top.value.z = W.h + 0.6; }
  HC.wing = W;

  /* ================= THE WINE ROOM ================= */
  B.room = 'wine room';
  const WR = { x0: 1, x1: 5.4, z0: -3.8, z1: 1.6 };
  solid(M.glass, WR.x0, WR.x1, 0, 3.6, WR.z0 - 0.03, WR.z0, 'glass'); solid(M.glass, WR.x0, WR.x1, 0, 3.6, WR.z1, WR.z1 + 0.03, 'glass'); solid(M.glass, WR.x1, WR.x1 + 0.03, 0, 3.6, WR.z0, WR.z1, 'glass');
  solid(M.glass, WR.x0 - 0.03, WR.x0, 0, 3.6, WR.z0, -1.7, 'glass'); solid(M.glass, WR.x0 - 0.03, WR.x0, 0, 3.6, -0.5, WR.z1, 'glass');
  for (const [x, z] of [[WR.x0, WR.z0], [WR.x1, WR.z0], [WR.x0, WR.z1], [WR.x1, WR.z1]]) B.boxE(M.steel, x - 0.04, x + 0.04, 0, 3.6, z - 0.04, z + 0.04);
  B.boxE(M.steel, WR.x0, WR.x1, 3.6, 3.66, WR.z0, WR.z1);
  const bottles = canvasMat(256, 256, (g, w, h) => {
    g.fillStyle = '#ffcf8a'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.fillStyle = ['#2a0c10', '#1a2010', '#3a1810', '#14100c'][(x * 7 + y * 3) % 4]; g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,240,200,.35)'; g.beginPath(); g.arc(x - 2, y - 2, 2, 0, 7); g.fill(); }
  });
  B.mesh(G.plane, bottles, (WR.x0 + WR.x1) / 2, 1.8, WR.z0 + 0.05, WR.x1 - WR.x0 - 0.2, 3.2, 1);
  { const side = B.mesh(G.plane, bottles, WR.x1 - 0.05, 1.8, (WR.z0 + WR.z1) / 2, WR.z1 - WR.z0 - 0.2, 3.2, 1, -Math.PI / 2); side.userData.dynamic = true; }
  B.furniture(M.oak, 3.0, -0.6, 0, 1.6, 0.95, 0.7, 'tasting table');
  led({ id: 'wine-glow', name: 'Wine wall light', room: 'wine room', pos: [3.2, 2.4, -1.2], colour: 0xffc890, target: 0.7, range: 4, corona: 0 });
  B.interactable({ id: 'wine-room', label: 'Wine room: 13°C, 840 bottles', pos: [WR.x0 + 0.1, 1.3, -1.1], n: [-1, 0], act: g => BM.halcyonSay(g, 'The wine room is at thirteen degrees and sixty-five percent humidity. Eight hundred and forty bottles.', 4) });

  /* ================= THE GAMES ROOM ================= */
  B.levelName = 'upper'; B.room = 'games room';
  // the golf simulator: a screen on the west wall, a mat, a tee
  const golf = canvasMat(256, 160, () => {});
  const gscr = B.mesh(G.plane, golf, -25.66, F1 + 1.8, 8, 5.2, 3.0, 1, Math.PI / 2); gscr.userData.dynamic = true;
  HC.golf = { mat: golf, shot: 0, t: 0, dist: 0 };
  BM.drawGolf(HC.golf, 0);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x2a6a30, shininess: 4 }), -24, -20, F1, F1 + 0.03, 6.5, 9.5);
  B.mesh(G.sphere, M.white, -22.6, F1 + 0.07, 8, 0.04, 0.04, 0.04);
  B.interactable({ id: 'golf', label: 'Golf simulator: take a shot', pos: [-22.4, F1 + 1.0, 8], n: [1, 0], act: g => BM.halcyonGolf(g) });
  // the pool table
  B.furniture(M.oak, -14, 9, F1, 2.6, 0.8, 1.5, 'pool table');
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x1a5a3a, shininess: 6 }), -15.2, -12.8, F1 + 0.8, F1 + 0.82, 8.4, 9.6);
  const ballCols = [0xffffff, 0xf0c020, 0x2040c0, 0xd02020, 0x6020a0, 0xff7010, 0x208030, 0x801010, 0x101010];
  ballCols.forEach((c, i) => B.mesh(G.sphere, new THREE.MeshPhongMaterial({ color: c, shininess: 120 }), -14.5 + (i % 3) * 0.08 + (i === 0 ? -0.6 : 0), F1 + 0.85, 9 + Math.floor(i / 3) * 0.08 - 0.08, 0.03, 0.03, 0.03));
  led({ id: 'pool-table-lamp', name: 'Pool table lamp', room: 'games room', pos: [-14, F1 + 1.9, 9], colour: 0xfff0dc, target: 1.1, range: 4, corona: 0.3, glow: [-14, F1 + 2.0, 9, 2.0, 0.08, 0.3] });
  // the bar: a long counter, a backlit shelf wall, stools, a neon sign
  B.furniture(M.black, -20.5, 12.3, F1, 6, 1.1, 0.7, 'bar counter'); B.boxE(M.marble, -23.5, -17.5, F1 + 1.1, F1 + 1.14, 11.9, 12.7);
  const shelf = B.mesh(G.plane, bottles, -20.5, F1 + 2.0, 13.66, 5.6, 1.6, 1, Math.PI); shelf.userData.dynamic = true;
  for (let i = 0; i < 5; i++) { const x = -23 + i * 1.2; B.mesh(G.cyl, M.steel, x, F1 + 0.38, 11.4, 0.08, 0.76, 0.08); B.mesh(G.cyl, M.charcoal, x, F1 + 0.78, 11.4, 0.4, 0.06, 0.4); }
  const neon = B.mesh(G.plane, BM.labelMat('HALCYON CLUB', { w: 512, h: 96, size: 52, bg: '#000000', fg: '#ff4fd8' }), -20.5, F1 + 3.1, 13.64, 2.4, 0.45, 1, Math.PI);
  neon.material.blending = THREE.AdditiveBlending; neon.material.transparent = true;
  led({ id: 'bar-glow', name: 'Bar backlight', room: 'games room', pos: [-20.5, F1 + 1.6, 13.2], colour: 0xff7ad8, target: 0.6, range: 5, corona: 0, glow: [-20.5, F1 + 1.15, 12.72, 5.8, 0.03, 0.03] });

  /* ================= THE MAIN BATHROOM AND THE DRESSING ROOM ================= */
  B.room = 'master suite';
  // the bath: a freestanding white oval facing the lake, a floor tap beside it
  B.mesh(G.sphere, M.white, 22, F1 + 0.32, -15.4, 1.8, 0.64, 0.95);
  B.mesh(G.sphere, new THREE.MeshPhongMaterial({ color: 0xbfe0f0, shininess: 120, transparent: true, opacity: 0.8 }), 22, F1 + 0.5, -15.4, 1.6, 0.2, 0.8);
  P.addWall(21.1, 22.9, -15.9, -14.9, F1, F1 + 0.6, { kind: 'furniture', tag: 'bath' });
  B.box(M.steel, 23.2, F1 + 0.5, -15.4, 0.04, 1.0, 0.04);
  // the rain shower: a glass box, a big square head
  B.solid(M.glass, 23.6, 26, F1, ROOF_(), -4.2, -4.17, { kind: 'wall', tag: 'shower glass' });
  B.boxE(M.steel, 24.3, 25.3, ROOF_() - 0.4, ROOF_() - 0.36, -3.5, -2.5);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x3a3a3c, shininess: 30 }), 23.6, 26, F1, F1 + 0.02, -4.2, -2);
  // the double vanity on the new wall
  B.furniture(M.oak, 18.45, -10, F1, 0.6, 0.85, 3.2, 'vanity'); B.boxE(M.marble, 18.1, 18.8, F1 + 0.85, F1 + 0.89, -11.6, -8.4);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0xcad6de, shininess: 160, specular: 0xffffff }), 18.11, 18.13, F1 + 1.1, F1 + 2.3, -11.4, -8.6);
  led({ id: 'vanity-glow', name: 'Mirror light', room: 'master suite', pos: [18.6, F1 + 2.2, -10], colour: 0xfff4e6, target: 0.6, range: 3, corona: 0, glow: [18.16, F1 + 2.35, -10, 0.02, 0.04, 2.8] });
  // the dressing room: shelves lit like a boutique, an island, a long mirror
  B.room = 'dressing room';
  for (const z of [13.62]) for (let k = 0; k < 4; k++) {
    const y = F1 + 0.5 + k * 0.6;
    B.boxE(M.oak, 8, 24, y, y + 0.03, z - 0.45, z);
    const strip = led({ id: 'shelf-' + k, name: 'Shelf light', room: 'dressing room', pos: [16, y - 0.05, z - 0.3], colour: 0xfff4e6, target: 0.25, range: 2, corona: 0, glow: [16, y - 0.01, z - 0.4, 16, 0.01, 0.04] });
    for (let x = 8.4; x < 24; x += 0.55) B.box(new THREE.MeshPhongMaterial({ color: [0x2a2a30, 0xd8d0c0, 0x8a2030, 0x30405a, 0xc8a060][Math.floor(x * 3 + k) % 5] }), x, y + 0.12, z - 0.22, 0.4, 0.2 + (k % 2) * 0.05, 0.3);
  }
  B.furniture(M.oak, 16, 8, F1, 3.2, 0.95, 1.2, 'island'); B.boxE(M.glass, 14.4, 17.6, F1 + 0.95, F1 + 0.98, 7.4, 8.6);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0xcad6de, shininess: 160, specular: 0xffffff }), 25.66, 25.7, F1 + 0.2, F1 + 2.6, 6, 9);
  B.levelName = 'ground';

  /* ================= THE FRONT DOOR: FACE RECOGNITION ================= */
  B.zone = 'exterior'; B.room = 'grounds';
  const sc = new THREE.MeshBasicMaterial({ color: 0x0a1018 });
  B.box(M.black, 2.0, 1.55, HL.H.z1 + 0.04, 0.16, 0.26, 0.04);
  const scr = B.box(sc, 2.0, 1.58, HL.H.z1 + 0.065, 0.12, 0.16, 0.01); scr.userData.dynamic = true;
  HC.face = { mat: sc, scanT: 0, known: false };
  HC.faceOK = 0;

  /* ================= SOLAR, THE BATTERY, THE ENERGY SCREEN ================= */
  B.zone = 'exterior'; B.room = 'garage';
  const pv = new THREE.MeshPhongMaterial({ color: 0x14203a, shininess: 140, specular: 0x8aa8d0 });
  const GA = HL.GA;
  for (let x = GA.x0 + 1; x < GA.x1 - 1; x += 2.1) for (let z = GA.z0 + 1; z < GA.z1 - 1; z += 1.2) { const p = B.box(pv, x + 1, GA.h + 0.42, z + 0.5, 2.0, 0.04, 1.1); p.rotation.x = -0.18; p.updateMatrix(); }
  B.zone = 'mansion';
  for (let i = 0; i < 3; i++) {
    const z = 2 + i * 1.2; B.box(M.white, GA.x0 + 0.42, 1.2, z, 0.18, 1.15, 0.8);
    const bar = B.box(new THREE.MeshBasicMaterial({ color: 0x20c060 }), GA.x0 + 0.52, 1.6, z, 0.01, 0.05, 0.5); bar.userData.dynamic = true;
  }
  const energy = canvasMat(256, 144, () => {});
  const escr = B.mesh(G.plane, energy, GA.x0 + 0.36, 1.6, 7, 1.6, 0.9, 1, Math.PI / 2); escr.userData.dynamic = true;
  HC.energy = { mat: energy, batt: 76, solar: 0, load: 0, drawT: 0 };
  B.interactable({ id: 'energy', label: 'Energy: solar, battery, house', pos: [GA.x0 + 0.5, 1.6, 7], n: [1, 0], act: g => { const E = HC.energy; BM.halcyonSay(g, 'Solar ' + E.solar.toFixed(1) + ' kilowatts. Battery ' + Math.round(E.batt) + ' percent. The house is using ' + E.load.toFixed(1) + '.', 5); } });

  /* ================= MUSIC THAT FOLLOWS YOU ================= */
  HC.music = { on: false, nextBar: 0, beat0: 0 };
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'house';
};
const ROOF_ = () => BM.HALCYON.ROOF - 0.3;

/* ---- the golf simulator ---- */
BM.drawGolf = function (Gf, t) {
  const c = Gf.mat.map.userData.c, g = c.getContext && c.getContext('2d'); if (!g) return;
  const sky = g.createLinearGradient(0, 0, 0, 160); sky.addColorStop(0, '#5a9ad8'); sky.addColorStop(0.5, '#b8d8f0'); sky.addColorStop(0.51, '#3a8a3a'); sky.addColorStop(1, '#2a6a2a');
  g.fillStyle = sky; g.fillRect(0, 0, 256, 160);
  g.fillStyle = '#4ea84e'; g.beginPath(); g.moveTo(100, 160); g.lineTo(122, 82); g.lineTo(134, 82); g.lineTo(156, 160); g.fill();
  g.fillStyle = '#7ac87a'; g.beginPath(); g.ellipse(128, 84, 14, 4, 0, 0, 7); g.fill();
  g.fillStyle = '#ff3030'; g.fillRect(128, 70, 1, 12); g.fillRect(128, 70, 6, 4);
  for (const [x, h] of [[30, 30], [60, 22], [200, 26], [230, 34]]) { g.fillStyle = '#1e4e2a'; g.beginPath(); g.ellipse(x, 80 - h / 3, h / 2, h / 2, 0, 0, 7); g.fill(); }
  if (Gf.shot > 0) {
    const k = Math.min(1, t / 2.2), x = 128 + Gf.drift * k * 60, y = 150 - Math.sin(k * Math.PI) * 90 - k * 66;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 3 - k * 1.6, 0, 7); g.fill();
    if (k >= 1) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(8, 8, 120, 40); g.fillStyle = '#fff'; g.font = 'bold 16px sans-serif'; g.fillText(Gf.dist + ' m', 16, 30); g.font = '11px sans-serif'; g.fillText(Gf.dist > 230 ? 'On the green!' : Gf.dist > 200 ? 'Fairway' : 'Short', 16, 43); }
  } else { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(8, 8, 150, 22); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText('HOLE 7 · PAR 4 · 245 m', 14, 23); }
  Gf.mat.map.needsUpdate = true;
};
BM.halcyonGolf = function (game) {
  const Gf = game.halcyon.golf; Gf.shot++; Gf.t = 0; Gf.dist = 180 + Math.floor(Math.random() * 70); Gf.drift = (Math.random() - 0.5) * 0.6;
  const A = game.audio; A.burst && A.burst(A.white, 'bandpass', 2600, 2, 0.3, 0.001, 0.08);
};
BM.halcyonSauna = function (game) {
  const S = game.halcyon.sauna; S.on = !S.on;
  BM.halcyonSay(game, S.on ? 'Sauna on. It will be at seventy-five degrees in a few minutes.' : 'Sauna off.', 3);
};
BM.halcyonSteam = function (game) {
  const S = game.halcyon.steam2; S.on = !S.on;
  BM.halcyonSay(game, S.on ? 'Steam room on.' : 'Steam room off.', 2);
};
BM.halcyonMusic = function (game) {
  const Mu = game.halcyon.music; Mu.on = !Mu.on;
  if (Mu.on && game.audio.ctx) { Mu.beat0 = game.audio.ctx.currentTime + 0.3; Mu.nextBar = 0; }
  BM.halcyonSay(game, Mu.on ? 'Music on. It will follow you from room to room.' : 'Music off.', 3);
};

/* a soft, slow chord loop for the house: electric piano, a bass, a brush of hi-hat */
const LBEAT = 60 / 84;
const LCH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]];   // Am7, Fmaj7, Cmaj7, G7
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function loungeBar(A, bar, t0, bus) {
  const ch = LCH[bar % 4], w0 = t0 - A.ctx.currentTime; if (w0 < -0.1) return;
  for (const n of ch) A.pianoNote ? A.pianoNote(n, w0, 0.22, bus) : null;
  A.pianoNote && A.pianoNote(ch[0] - 12, w0, 0.35, bus); A.pianoNote && A.pianoNote(ch[0] - 12, w0 + LBEAT * 2.5, 0.25, bus);
  for (let b = 0; b < 4; b++) A.burst(A.white, 'highpass', 8000, 1, 0.012, 0.001, 0.06, w0 + b * LBEAT + LBEAT / 2);
  A.pianoNote && A.pianoNote(ch[3] + 12, w0 + LBEAT * 1.5, 0.16, bus); A.pianoNote && A.pianoNote(ch[2] + 12, w0 + LBEAT * 3, 0.14, bus);
}

BM.updateHalcyonAmenities = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.sauna) return;
  const p = game.player, A = game.audio, t = HC.t;
  // the sauna warms up, glowing deeper as it does
  const S = HC.sauna; S.temp += ((S.on ? 75 : 22) - S.temp) * Math.min(1, dt / 40);
  const k = (S.temp - 22) / 53; S.glow.color.setRGB(0.12 + 0.88 * k, 0.03 + 0.25 * k, 0.01); S.light.target = 1.0 * k; S.light.on = k > 0.02;
  // the steam room
  const St = HC.steam2; St.mat.opacity += ((St.on ? 0.22 : 0) - St.mat.opacity) * Math.min(1, dt / 2);
  HC.mist.forEach((m, i) => { m.position.y = 0.6 + ((t * 0.12 + i * 0.13) % 1) * 1.6; m.scale.setScalar(0.7 + 0.3 * Math.sin(t + i)); });
  // the golf screen
  const Gf = HC.golf; if (Gf.shot > 0 && Gf.t < 3) { Gf.t += dt; Gf.drawT = (Gf.drawT || 0) - dt; if (Gf.drawT <= 0) { Gf.drawT = 0.05; BM.drawGolf(Gf, Gf.t); } if (Gf.t >= 2.2 && !Gf.said) { Gf.said = true; BM.halcyonSay(game, Gf.dist + ' metres. ' + (Gf.dist > 230 ? 'On the green.' : Gf.dist > 200 ? 'Nice drive.' : 'A little short.'), 3); } }
  if (Gf.t < 2.2) Gf.said = false;
  // face recognition at the front door: walk up, it scans, it knows you, the door opens
  const F = HC.face, fd = BM.HALCYON.H.z1;
  const atDoor = Math.abs(p.x) < 2.5 && p.z > fd && p.z < fd + 3.2 && p.y < 1;
  if (HC.faceOK > 0) HC.faceOK -= dt;
  if (atDoor && HC.faceOK <= 0) {
    F.scanT += dt;
    F.mat.color.setHSL(0.58, 1, 0.3 + 0.25 * Math.abs(Math.sin(t * 12)));
    if (F.scanT >= 1.1) { HC.faceOK = 10; F.scanT = 0; A.tone && A.tone('sine', 880, 1320, 0.05, 0.01, 0.25); BM.halcyonSay(game, F.known ? 'Welcome back.' : 'Face recognised. Welcome home.', 3); F.known = true; }
  } else { F.scanT = 0; F.mat.color.setHex(HC.faceOK > 0 ? 0x30ff70 : 0x0a2a40); }
  // energy: the sun on the panels, the house's load, the battery between them
  const E = HC.energy, day = game.grid.daylight || 0;
  E.solar = 11.2 * day;
  let on = 0; for (const l of game.grid.lights) if (l.intensity > 0.02) on++;
  E.load = 0.6 + on * 0.006 + (S.on ? 6 : 0) + (HC.tub ? 2.5 : 0) + (HC.cinema && HC.cinema.playing ? 0.8 : 0);
  E.batt = Math.max(5, Math.min(100, E.batt + (E.solar - E.load) * dt * 0.05));
  E.drawT -= dt;
  if (E.drawT <= 0) {
    E.drawT = 0.5;
    const c = E.mat.map.userData.c, g = c.getContext && c.getContext('2d');
    if (g) {
      g.fillStyle = '#0c1016'; g.fillRect(0, 0, 256, 144);
      g.fillStyle = '#8ab4ff'; g.font = '12px sans-serif'; g.fillText('HALCYON · ENERGY', 12, 20);
      g.fillStyle = '#ffd040'; g.font = 'bold 22px sans-serif'; g.fillText('☀ ' + E.solar.toFixed(1) + ' kW', 12, 54);
      g.fillStyle = '#7ad0ff'; g.fillText('⌂ ' + E.load.toFixed(1) + ' kW', 140, 54);
      g.fillStyle = '#1c2430'; g.fillRect(12, 80, 232, 22); g.fillStyle = E.batt > 25 ? '#30d070' : '#ff7030'; g.fillRect(12, 80, 232 * E.batt / 100, 22);
      g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText('Battery ' + Math.round(E.batt) + '%  ' + (E.solar > E.load ? 'charging' : 'supplying the house'), 16, 96);
      g.fillStyle = '#9aa4b4'; g.fillText(E.solar > 0.1 ? 'The panels are in the sun' : 'Night: running on the battery', 12, 128);
      E.mat.map.needsUpdate = true;
    }
  }
  // music that follows you: loud where you are in the house, quiet on the terrace, gone out in the grounds
  const Mu = HC.music;
  if (A.ctx) {
    if (!Mu.bus) { Mu.bus = A.ctx.createGain(); Mu.bus.gain.value = 0; Mu.bus.connect(A.master); }
    const inside = game.ctx && game.ctx.zone === 'house', near = Math.abs(p.x) < 50 && p.z < 20 && p.z > -42;
    const vol = Mu.on && !(HC.show) ? (inside ? 0.55 : near ? 0.18 : 0) : 0;
    Mu.bus.gain.setTargetAtTime(vol, A.ctx.currentTime, 0.6);
    if (Mu.on) { const now = A.ctx.currentTime, bar = Math.floor((now - Mu.beat0) / (LBEAT * 4)); while (Mu.nextBar <= bar + 1) { loungeBar(A, Mu.nextBar, Mu.beat0 + Mu.nextBar * 4 * LBEAT, Mu.bus); Mu.nextBar++; } }
  }
};

BM.halcyonAmenityRows = function (game) {
  const HC = game.halcyon; if (!HC || !HC.sauna) return [];
  const r = (k, name, o) => Object.assign({ section: 'WELLNESS & MORE', supply: '', k: 'smart:' + k, name, on: true, lit: false, live: true }, o);
  return [
    r('music', 'Music (follows you)', { on: HC.music.on, onText: 'ON', offText: 'OFF', lit: HC.music.on }),
    r('sauna', 'Sauna', { on: HC.sauna.on, onText: Math.round(HC.sauna.temp) + '°C', offText: 'OFF', lit: HC.sauna.on, warming: HC.sauna.on && HC.sauna.temp < 70 }),
    r('steam', 'Steam room', { on: HC.steam2.on, onText: 'ON', offText: 'OFF', lit: HC.steam2.on }),
    r('golf', 'Golf simulator', { value: 'TEE OFF' }),
    r('energy', 'Energy', { value: '☀' + HC.energy.solar.toFixed(1) + ' · ' + Math.round(HC.energy.batt) + '%' }),
  ];
};
BM.halcyonAmenityToggle = function (game, id) {
  const HC = game.halcyon;
  if (id === 'music') BM.halcyonMusic(game);
  else if (id === 'sauna') BM.halcyonSauna(game);
  else if (id === 'steam') BM.halcyonSteam(game);
  else if (id === 'golf') BM.halcyonGolf(game);
  else if (id === 'energy') { const E = HC.energy; BM.halcyonSay(game, 'Solar ' + E.solar.toFixed(1) + ' kilowatts. Battery ' + Math.round(E.batt) + ' percent.', 3); }
  else return false;
  return true;
};
})();
