/* ==========================================================================
   HALCYON HOUSE — THE LIVED-IN DETAIL
   Every room filled out, so nothing reads as an empty box:
   - the living room: a black grand piano you can play, a throw, magazines,
     candles; the dining table laid for ten; a bar cart;
   - the kitchen: a breakfast table by the glass under its own pendant,
     boards, knives, cookbooks, herbs, a shelving divider;
   - the halls: consoles with lamps and big art, a round mirror, a bench;
   - the security room: a sofa, a coffee counter, a status screen, a clock;
   - the cinema: tower speakers either side of the screen, sconces, a snack
     bar with a popcorn machine;
   - the car gallery: a lounge corner, a tool chest, helmets, a tyre wall;
   - the gym and the spa: kettlebells, a cable tower, mats, towels, robes;
   - the bedrooms: a reading pair by the glass, a desk, a TV wall, luggage,
     trays and books; the bathroom: a WC, a heated towel rail, a bath tray,
     mats, the shower's niche; the dressing room: a shoe wall and a
     dressing table;
   - the landing: a chess table and a globe;
   - the games room: two arcade cabinets you can play, a jukebox, table
     football, a card table, a dartboard, a sofa to watch the golf;
   - outside: dining for eight by the pavilion, towels on the loungers.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

Object.assign(BM.MAT_EXTRA, {
  hPianoBlack: [0x0a0a0b, null, 0, 160, { specular: 0x888888 }],
  hWhite: [0xf4f2ee, null, 0, 40],
  hRed: [0xb01818, null, 0, 90, { specular: 0x666666 }],
  hPopcorn: [0xf0d070, null, 0, 6],
  hSpeaker: [0x1a1a1c, 'linenWeave', 3, 2],
  hGreenFelt: [0x1f4d3a, 'linenWeave', 3, 2],
  hTowel: [0xf2efe8, 'rugPile', 3, 1],
  hTowelGrey: [0x8e8a84, 'rugPile', 3, 1],
  hKettle: [0x2a2c2e, null, 0, 40],
  hHerb: [0x4a7a3a, null, 0, 6],
  hBread: [0xc8904a, null, 0, 6],
  hBoard: [0xb08a5a, 'walnutGrain', 3, 20],
});

BM.buildHalcyonDetail = function (B, game) {
  const K = BM.KIT, HL = BM.HALCYON, F1 = HL.F1, ROOF = HL.ROOF, HC = game.halcyon, P = B.phys;
  const C = F1 - 0.3, C2 = ROOF - 0.3, Y = 0.026;   // the ceilings; the oak boards' top
  const led = o => BM.halcyonLed(B, game, o);
  const flame = new THREE.MeshBasicMaterial({ color: 0xffb050 });
  const candle = (x, y, z, h) => { B.mesh(G.cyl, 'hWhite', x, y + h / 2, z, 0.06, h, 0.06); B.mesh(G.sphere, flame, x, y + h + 0.018, z, 0.014, 0.03, 0.014); };
  const wineGlass = (x, y, z) => { B.mesh(G.cyl, 'hBottleClear', x, y + 0.003, z, 0.07, 0.006, 0.07); B.mesh(G.post, 'hBottleClear', x, y + 0.07, z, 0.008, 0.13, 0.008); B.mesh(G.sphere, 'hBottleClear', x, y + 0.17, z, 0.085, 0.1, 0.085); };
  const lampGlow = (id, name, room, x, y, z, w, h) => led({ id, name, room, pos: [x, y - 0.05, z], colour: 0xffc890, target: 0.4, range: 3.5, corona: 0.3, glow: [x, y, z, w, h, w], glowGeo: 'cyl' });
  const tableLamp = (id, room, x, y, z) => { B.mesh(G.sphere, 'hCeramic', x, y + 0.18, z, 0.22, 0.34, 0.22); B.mesh(G.post, 'hBrass', x, y + 0.42, z, 0.015, 0.16, 0.015); lampGlow(id, 'Table lamp', room, x, y + 0.6, z, 0.34, 0.26); };
  B.zone = 'mansion';

  /* ================= THE LIVING ROOM ================= */
  B.levelName = 'ground'; B.room = 'living room';
  // a black grand piano, lid up, by the way through to the hall; sit at it and play
  { const f = K.frame(B, -8.5, -3.2, Y, 0);
    f.box('hPianoBlack', 0, 0.82, -0.5, 1.5, 0.3, 1.0); f.mesh(G.cyl, 'hPianoBlack', 0.12, 0.82, -1.15, 1.3, 0.3, 1.3);
    f.box('hBrass', 0, 0.96, -0.6, 1.36, 0.01, 0.9); f.mesh(G.cyl, 'hBrass', 0.12, 0.962, -1.15, 1.16, 0.01, 1.16);
    for (let i = 0; i < 18; i++) f.box('hChrome', -0.6 + i * 0.07, 0.97, -0.85, 0.004, 0.006, 1.3 - Math.abs(i - 9) * 0.03);   // the strings
    f.box('hPianoBlack', 0.08, 1.3, -0.9, 1.45, 0.02, 1.7, 0, -0.62);                                                // the lid, propped open
    f.box('hPianoBlack', 0.7, 1.15, -0.9, 0.02, 0.6, 0.02, 0, 0.3);
    f.box('hPianoBlack', 0, 0.72, 0.1, 1.56, 0.12, 0.32); f.box('hWhite', 0, 0.79, 0.14, 1.24, 0.025, 0.15);
    const w = 1.24 / 52; for (let i = 0; i < 51; i++) { const n = (i + 5) % 7; if (n === 0 || n === 1 || n === 3 || n === 4 || n === 5) f.box('hPianoBlack', -0.62 + (i + 1) * w, 0.81, 0.1, 0.013, 0.02, 0.09); }
    f.box('hPianoBlack', 0, 1.06, -0.02, 0.8, 0.26, 0.02, -0.25); f.box('hPaper', 0, 1.07, -0.005, 0.42, 0.28, 0.004, -0.25);
    for (const [lx, lz] of [[-0.66, 0.0], [0.66, 0.0], [0.2, -1.65]]) f.box('hPianoBlack', lx, 0.34, lz, 0.1, 0.67, 0.1);
    f.box('hPianoBlack', 0, 0.36, -0.3, 0.14, 0.62, 0.04); for (const lx of [-0.05, 0, 0.05]) f.box('hBrass', lx, 0.04, -0.24, 0.025, 0.012, 0.08);
    f.box('hPianoBlack', 0, 0.48, 0.62, 0.8, 0.05, 0.34); f.box('hLeatherBlack', 0, 0.53, 0.62, 0.76, 0.05, 0.3); for (const s of [-1, 1]) f.box('hPianoBlack', s * 0.35, 0.23, 0.62, 0.05, 0.46, 0.3);
    f.rect(-0.78, 0.82, -1.85, 0.27, 1.0, 'grand piano');
    B.interactable({ id: 'piano', label: 'Piano: play', pos: [-8.5, 0.9, -2.5], n: [0, 1], act: g => BM.halcyonPiano(g) });
  }
  // a throw over the sofa's arm, magazines and candles on the block table, a bowl
  B.box('hFabricRust', -19.3, Y + 0.52, -13.62, 0.9, 0.04, 0.3); B.box('hFabricRust', -19.0, Y + 0.32, -13.78, 0.5, 0.42, 0.03);
  for (let i = 0; i < 3; i++) B.box(['hPaper', 'hFabricBlue', 'hFabricSand'][i], -22.9 + i * 0.01, Y + 0.355 + i * 0.006, -11.5 + i * 0.03, 0.3, 0.005, 0.23, 0.2 * i);
  candle(-22.4, Y + 0.35, -12.6, 0.12); candle(-22.3, Y + 0.35, -12.5, 0.18);
  B.mesh(G.lowSphere, 'hCeramicDark', -11.7, Y + 0.38, -12.6, 0.32, 0.1, 0.32);
  // a bar cart by the dining table: bottles, glasses, an ice bucket
  { const x = 1.9, z = -6.2; for (const y of [0.3, 0.8]) B.box('hBrass', x, Y + y, z, 0.8, 0.02, 0.45); for (const [dx, dz] of [[-0.38, -0.2], [0.38, -0.2], [-0.38, 0.2], [0.38, 0.2]]) B.box('hBrass', x + dx, Y + 0.45, z + dz, 0.02, 0.9, 0.02);
    for (let i = 0; i < 4; i++) { const c = ['hBottleAmber', 'hBottleClear', 'hBottleGreen', 'hBottleAmber'][i]; B.mesh(G.cyl, c, x - 0.3 + i * 0.12, Y + 0.95, z - 0.1, 0.08, 0.28, 0.08); B.mesh(G.cyl, c, x - 0.3 + i * 0.12, Y + 1.12, z - 0.1, 0.03, 0.08, 0.03); }
    for (let i = 0; i < 3; i++) wineGlass(x - 0.1 + i * 0.12, Y + 0.81, z + 0.12); B.mesh(G.cyl, 'hChrome', x + 0.27, Y + 0.9, z + 0.1, 0.16, 0.18, 0.16);
    P.addWall(x - 0.42, x + 0.42, z - 0.25, z + 0.25, 0, 1.0, { kind: 'furniture', tag: 'bar cart' }); }

  /* ================= THE DINING TABLE, LAID FOR TEN ================= */
  { const DT = { x: -1.6, z: -10.6 }, ty = Y + 0.75;
    B.box('hFabricSand', DT.x, ty + 0.003, DT.z, 2.6, 0.004, 0.36);   // a linen runner
    const set = (x, z, ry) => { B.mesh(G.cyl, 'hBronze', x, ty + 0.004, z, 0.32, 0.006, 0.32); B.mesh(G.cyl, 'hCeramic', x, ty + 0.012, z, 0.26, 0.01, 0.26); B.box('hFabricWhite', x, ty + 0.02, z, 0.12, 0.012, 0.12, ry + 0.785);
      const f = K.frame(B, x, z, ty, ry); f.box('hChrome', -0.19, 0.003, 0, 0.018, 0.004, 0.2); f.box('hChrome', 0.19, 0.003, 0, 0.012, 0.004, 0.22); const [gx, gz] = f.at(0.16, -0.2); wineGlass(gx, ty, gz); };
    for (const lx of [-1.05, -0.35, 0.35, 1.05]) { set(DT.x + lx, DT.z - 0.36, Math.PI); set(DT.x + lx, DT.z + 0.36, 0); }
    set(DT.x - 1.3, DT.z, -Math.PI / 2); set(DT.x + 1.3, DT.z, Math.PI / 2);
    for (const lx of [-0.9, -0.3, 0.3, 0.9]) { B.mesh(G.cyl, 'hBrass', DT.x + lx, ty + 0.03, DT.z, 0.07, 0.06, 0.07); candle(DT.x + lx, ty + 0.06, DT.z, 0.2 + (Math.abs(lx) < 0.5 ? 0.06 : 0)); }
  }

  /* ================= THE KITCHEN ================= */
  B.room = 'kitchen';
  // on the counters: a walnut board with bread, a knife block, cookbooks on a stand, herbs on the ledge, a kettle
  B.box('hBoard', 15.9, 0.935, -7.6, 0.5, 0.025, 0.32); B.mesh(G.lowSphere, 'hBread', 15.85, 0.98, -7.6, 0.32, 0.12, 0.16);
  B.box('hWalnut', 18.0, 1.0, 1.55, 0.14, 0.2, 0.12); for (let i = 0; i < 4; i++) B.box('hBlackSteel', 17.96 + i * 0.025, 1.14, 1.55, 0.01, 0.1, 0.02);
  K.books(B, 18.9, 0.9, 1.6, 3, 0.1);
  for (let i = 0; i < 3; i++) { B.mesh(G.cyl, 'hTerracotta', 18.1 + i * 0.25, 1.64, 1.8, 0.12, 0.1, 0.12); for (let k = 0; k < 6; k++) B.mesh(G.sphere, 'hHerb', 18.1 + i * 0.25 + Math.cos(k) * 0.03, 1.73 + (k % 2) * 0.03, 1.8 + Math.sin(k) * 0.03, 0.07); }
  B.mesh(G.cyl, 'hKettle', 22.75, 1.0, 1.55, 0.18, 0.2, 0.18); B.box('hKettle', 22.86, 1.06, 1.55, 0.04, 0.12, 0.04);
  // a breakfast table by the glass: a round travertine top, four chairs, a brass drum pendant over it
  K.rug(B, 21.5, -14.6, 0, 2.6, 2.6, 0, { mat: 'hRugCream', border: 'hRugGrey' });
  K.roundTable(B, 21.5, -14.6, 0.012, 0.6, 0.75, { top: 'hTravertine', base: 'hBronze' });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; K.diningChair(B, 21.5 + Math.sin(a) * 0.85, -14.6 + Math.cos(a) * 0.85, 0.012, a + Math.PI, { wood: 'hOak', mat: 'hBoucle' }); }
  K.vase(B, 21.5, 0.762, -14.6, 0.8);
  K.pendant(B, 21.5, 1.75, -14.6, 'drum', { size: 0.55, drop: C - 1.75 });
  led({ id: 'kitchen-nook', name: 'Breakfast pendant', room: 'kitchen', pos: [21.5, 1.6, -14.6], colour: 0xffc890, target: 0.6, range: 4, corona: 0.3, glow: [21.5, 1.618, -14.6, 0.49, 0.006, 0.49], glowGeo: 'cyl' });
  K.plant(B, 25.2, -17.0, 0, 'fig', 2.4);
  // an open shelving divider between the kitchen and the hall side: plants, bowls, books
  K.shelves(B, 8.6, -4.5, 0, 3.6, 2.2, Math.PI / 2, { mat: 'hOak' });

  /* ================= THE HALLS ================= */
  B.room = 'atrium';
  K.rug(B, 0, 7.4, 0, 4.2, 5.6, 0, { mat: 'hRugGrey', border: 'hRugCream' });
  // east: a long console against the cinema wall, lamps, a big canvas; a pair of chairs
  K.credenza(B, 13.7, 9.0, 0, 2.8, -Math.PI / 2, { mat: 'hWalnut' });
  K.art(B, 13.93, 2.1, 9.0, 2.6, 1.6, -Math.PI / 2, 6);
  tableLamp('hall-lamp-e1', 'atrium', 13.68, 0.75, 8.0); tableLamp('hall-lamp-e2', 'atrium', 13.68, 0.75, 10.0);
  K.vase(B, 13.68, 0.75, 9.0, 1.1);
  K.armchair(B, 9.6, 6.2, 0, -2.4, { mat: 'hFabricRust' }); K.armchair(B, 8.0, 7.2, 0, -2.0, { mat: 'hFabricRust' }); K.sideTable(B, 8.6, 5.9, 0);
  K.plant(B, 13.2, 12.9, 0, 'olive', 2.3, { pot: 'hTravertine' });
  // west: a console and a round brass mirror against the security room wall, a bench, a tree
  K.credenza(B, -13.7, 5.5, 0, 2.4, Math.PI / 2, { mat: 'hSmokedOak' });
  { const m = B.mesh(G.cyl, 'hBrass', -13.94, 1.75, 5.5, 1.06, 0.02, 1.06); m.rotation.z = Math.PI / 2; m.updateMatrix(); const g = B.mesh(G.cyl, 'hMirror', -13.92, 1.75, 5.5, 1.0, 0.02, 1.0); g.rotation.z = Math.PI / 2; g.updateMatrix(); }
  tableLamp('hall-lamp-w', 'atrium', -13.68, 0.75, 4.6); K.books(B, -13.68, 0.75, 6.2, 3, 0.2);
  B.box('hOak', -10.5, 0.42, 12.9, 1.8, 0.05, 0.42); for (const s of [-1, 1]) B.box('hBlackSteel', -10.5 + s * 0.8, 0.2, 12.9, 0.04, 0.4, 0.38); B.box('hFabricStone', -10.5, 0.47, 12.9, 1.7, 0.05, 0.38);
  P.addWall(-11.4, -9.6, 12.7, 13.1, 0, 0.5, { kind: 'furniture', tag: 'bench' });
  K.plant(B, -13.2, 12.9, 0, 'fig', 2.4);

  /* ================= THE SECURITY ROOM ================= */
  B.room = 'security room';
  // (kept clear of the door through to the garage, at z 6.5–8.1 in the west wall)
  K.sofa(B, -25.4, 3.9, 0, 2.2, Math.PI / 2, { mat: 'hFabricCharcoal', accent: 'hFabricBlue', d: 0.9 });
  K.table(B, -24.0, 3.9, 0, 0.6, 1.0, 0, { top: 'hBlackSteel', h: 0.42, legs: 'pedestal', tag: 'coffee table' });
  B.mesh(G.cyl, 'hCeramic', -23.95, 0.47, 3.6, 0.09, 0.1, 0.09);
  // a coffee counter on the front wall, and a status screen over it
  B.furniture('hBlackSteel', -19, 13.35, 0, 3.0, 0.9, 0.6, 'counter'); B.boxE('hChrome', -20.5, -17.5, 0.9, 0.93, 13.04, 13.66);
  B.box('hBlackSteel', -19.8, 1.13, 13.4, 0.36, 0.4, 0.34); for (let i = 0; i < 3; i++) B.mesh(G.cyl, 'hCeramic', -19.1 + i * 0.14, 0.98, 13.3, 0.08, 0.09, 0.08);
  B.mesh(G.plane, BM.labelMat('ALL SYSTEMS NORMAL · GATE SHUT · 9 CAMERAS · ALARM SET', { w: 512, h: 64, size: 22, bg: '#0a1a14', fg: '#5ad08a' }), -19, 2.2, 13.67, 2.6, 0.32, 1, Math.PI);
  { const ck = B.mesh(G.cyl, 'hWhite', -14.2, 2.6, 6.5, 0.4, 0.04, 0.4); ck.rotation.z = Math.PI / 2; ck.updateMatrix(); B.box('hBlackSteel', -14.25, 2.64, 6.5, 0.006, 0.14, 0.01); B.box('hBlackSteel', -14.25, 2.6, 6.55, 0.006, 0.01, 0.1); }
  K.plant(B, -14.8, 2.8, 0, 'fig', 1.8);

  /* ================= THE CINEMA ================= */
  B.room = 'cinema';
  // tower speakers either side of the screen, a centre speaker under it, a subwoofer
  for (const z of [3.7, 12.3]) { B.solid('hSpeaker', 25.0, 25.5, 0, 1.9, z - 0.3, z + 0.3, { kind: 'furniture', tag: 'speaker' }); for (const [y, d] of [[1.55, 0.18], [1.2, 0.25], [0.8, 0.25], [0.4, 0.25]]) { const c = B.mesh(G.cyl, 'hBlackSteel', 24.995, y, z, d, 0.01, d); c.rotation.z = Math.PI / 2; c.updateMatrix(); } }
  B.box('hSpeaker', 25.2, 0.25, 8, 0.4, 0.3, 1.2); B.box('hSpeaker', 24.9, 0.3, 11.4, 0.6, 0.6, 0.6);
  // sconces on the side walls (they fade with the rest when a film starts)
  for (const [x, z] of [[16.5, 2.16], [20.5, 2.16], [16.5, 13.64], [20.5, 13.64]]) {
    B.box('hBrass', x, 2.2, z, 0.12, 0.4, 0.06);
    led({ id: 'cinema-sconce-' + x + '-' + Math.round(z), name: 'Wall sconce', room: 'cinema', pos: [x, 2.2, z + (z < 8 ? 0.3 : -0.3)], colour: 0xffc58a, target: 0.35, range: 3, corona: 0.3, glow: [x, 2.2, z + (z < 8 ? 0.035 : -0.035), 0.1, 0.36, 0.01] });
  }
  // a snack bar at the back: a walnut cabinet, glass jars of sweets, a red popcorn machine
  B.furniture('hWalnut', 14.45, 10.8, 0, 0.5, 0.95, 2.4, 'snack bar'); B.boxE('hNero', 14.18, 14.73, 0.95, 0.99, 9.6, 12.0);
  for (let i = 0; i < 4; i++) { B.mesh(G.cyl, 'hBottleClear', 14.45, 1.1, 9.9 + i * 0.25, 0.16, 0.22, 0.16); B.mesh(G.cyl, ['hRed', 'hPopcorn', 'hFabricBlue', 'hFabricOlive'][i], 14.45, 1.06, 9.9 + i * 0.25, 0.14, 0.12, 0.14); }
  B.box('hRed', 14.45, 1.22, 11.5, 0.42, 0.06, 0.42); B.box('hBottleClear', 14.45, 1.45, 11.5, 0.42, 0.42, 0.42); B.box('hRed', 14.45, 1.69, 11.5, 0.44, 0.06, 0.44);
  for (let i = 0; i < 20; i++) B.mesh(G.lowSphere, 'hPopcorn', 14.3 + (i % 4) * 0.1, 1.28 + Math.floor(i / 8) * 0.04, 11.36 + (i % 5) * 0.07, 0.05);
  for (let i = 0; i < 3; i++) B.mesh(G.cyl, 'hRed', 14.32 + i * 0.12, 1.06, 12.3, 0.08, 0.14, 0.08);

  /* ================= THE CAR GALLERY ================= */
  B.room = 'garage';
  // a lounge corner to sit and look at the cars, a red tool chest, helmets on a shelf, a wall of tyres
  K.rug(B, -44.6, 9.5, 0.03, 2.2, 3.6, 0, { mat: 'hRugGrey', border: false });
  K.loungeChair(B, -44.7, 8.2, 0.03, Math.PI / 2 + 0.3, { ottoman: false }); K.loungeChair(B, -44.7, 10.8, 0.03, Math.PI / 2 - 0.3, { ottoman: false }); K.sideTable(B, -45.2, 9.5, 0.03);
  B.furniture('hRed', -44.9, -10.9, 0, 1.4, 1.0, 0.6, 'tool chest'); for (let i = 0; i < 6; i++) B.boxE('hChrome', -45.5, -44.3, 0.15 + i * 0.14, 0.16 + i * 0.14, -10.59, -10.58);
  B.boxE('hBlackSteel', -45.7, -45.4, 1.7, 1.73, -9.5, -6.5);
  for (let i = 0; i < 3; i++) { const c = [0xd8d8d8, 0xc81818, 0x101214][i]; B.mesh(G.lowSphere, BM.Ball(c), -45.55, 1.88, -9.0 + i * 0.9, 0.3, 0.3, 0.32); B.box('hBlackGlass', -45.4, 1.86, -9.0 + i * 0.9, 0.04, 0.1, 0.22); }
  for (let i = 0; i < 4; i++) { const t = B.mesh(G.cyl, 'hTyre', -45.5, 0.8 + (i % 2) * 0.75, -4.5 + Math.floor(i / 2) * 0.8, 0.68, 0.26, 0.68); t.rotation.z = Math.PI / 2; t.updateMatrix(); const r = B.mesh(G.cyl, 'hChrome', -45.5, 0.8 + (i % 2) * 0.75, -4.5 + Math.floor(i / 2) * 0.8, 0.44, 0.262, 0.44); r.rotation.z = Math.PI / 2; r.updateMatrix(); }
  P.addWall(-45.7, -45.2, -4.95, -3.25, 0, 2.0, { kind: 'furniture', tag: 'tyre rack' });

  /* ================= THE WINE ROOM ================= */
  B.room = 'wine room';
  for (const x of [2.4, 3.6]) K.barStool(B, x, 0.05, 0, Math.PI, { mat: 'hLeather', h: 0.75 });
  B.mesh(G.sphere, 'hBottleClear', 3.05, 1.08, -0.75, 0.18, 0.14, 0.18); B.mesh(G.post, 'hBottleClear', 3.05, 1.2, -0.75, 0.04, 0.16, 0.04);

  /* ================= THE WELLNESS WING ================= */
  B.room = 'gym';
  for (let i = 0; i < 6; i++) { const x = 34.6 + i * 0.5, s = 0.18 + i * 0.025; B.mesh(G.lowSphere, 'hBlackSteel', x, 0.03 + s / 2, -3.9, s, s, s); const h = B.mesh(G.ring, 'hBlackSteel', x, 0.05 + s, -3.9, s * 0.7, s * 0.7, s * 0.7); }
  for (let i = 0; i < 3; i++) B.mesh(G.cyl, ['hFabricOlive', 'hFabricBlue', 'hFabricCharcoal'][i], 27.2, 0.34, -10 + i * 0.2, 0.16, 0.62, 0.16).rotation.x = 0;
  B.box('hFabricOlive', 34.2, 0.035, -8.6, 0.62, 0.008, 1.83); B.box('hFabricBlue', 35.2, 0.035, -8.6, 0.62, 0.008, 1.83);
  // a cable tower (two stacks of plates in a black frame) on the east wall
  B.solid('hBlackSteel', 42.4, 43.6, 0, 0.08, -11, -9.4, { kind: 'furniture', tag: 'cable tower' });
  for (const z of [-10.85, -9.55]) B.box('hBlackSteel', 43.3, 1.05, z, 0.08, 2.1, 0.08); B.box('hBlackSteel', 43.3, 2.1, -10.2, 0.08, 0.08, 1.38);
  for (const z of [-10.5, -9.9]) { B.box('hChrome', 43.3, 0.6, z, 0.18, 0.9, 0.12); B.mesh(G.post, 'hChrome', 43.3, 1.6, z, 0.015, 1.1, 0.015); }
  P.addWall(42.9, 43.7, -11, -9.4, 0, 2.1, { kind: 'furniture', tag: 'cable tower' });
  // towels and water by the door
  B.solid('hOak', 27.0, 27.4, 0, 1.0, -4.0, -3.2, { kind: 'furniture', tag: 'towel shelf' });
  for (let i = 0; i < 4; i++) B.box('hTowel', 27.2, 1.03 + i * 0.07, -3.6, 0.32, 0.065, 0.5);
  for (let i = 0; i < 3; i++) B.mesh(G.cyl, 'hBottleClear', 27.15, 1.42, -3.9 + i * 0.12, 0.07, 0.22, 0.07);
  K.plant(B, 43.4, -17.4, 0.03, 'fig', 2.2);
  B.room = 'spa';
  // robes on hooks, stacked towels, a stone basin of water, candles, a tall plant
  for (let i = 0; i < 2; i++) { const x = 42.4 + i * 0.6; B.box('hBrass', x, 1.8, -2.95, 0.03, 0.03, 0.08); B.box('hTowel', x, 1.25, -2.88, 0.45, 1.1, 0.1); }
  B.solid('hTravertine', 26.5, 27.1, 0, 0.9, -2.6, -1.2, { kind: 'furniture', tag: 'basin' });
  B.box(new THREE.MeshPhongMaterial({ color: 0x9ac8d0, shininess: 140, transparent: true, opacity: 0.75 }), 26.8, 0.88, -1.9, 0.45, 0.01, 1.2);
  for (let i = 0; i < 4; i++) B.box(i % 2 ? 'hTowelGrey' : 'hTowel', 26.8, 0.96 + i * 0.07, -2.4, 0.4, 0.065, 0.3);
  for (let i = 0; i < 3; i++) candle(26.8, 0.9, -1.5 + i * 0.12, 0.08 + i * 0.03);
  K.plant(B, 43.4, 3.4, 0.03, 'olive', 2.0, { pot: 'hTravertine' });

  /* ================= THE MASTER SUITE ================= */
  B.levelName = 'upper'; B.room = 'master suite';
  // a reading pair by the glass
  K.rug(B, 15.2, -14.9, F1, 2.6, 2.2, 0, { mat: 'hRugGrey', border: false });
  K.armchair(B, 14.3, -14.9, F1, Math.PI - 0.5, { mat: 'hBoucle' }); K.armchair(B, 16.1, -14.9, F1, Math.PI + 0.5, { mat: 'hBoucle' });
  K.sideTable(B, 15.2, -15.6, F1); K.books(B, 15.2, F1 + 0.52, -15.6, 2, 0.4);
  // a writing desk on the bathroom wall: a lamp, a laptop, books
  K.table(B, 17.55, -8, F1, 1.4, 0.6, -Math.PI / 2, { top: 'hWalnut', h: 0.75, legs: 'slab', tag: 'desk' });
  K.diningChair(B, 16.85, -8, F1, Math.PI / 2, { wood: 'hWalnut', mat: 'hLeather' });
  tableLamp('master-desk-lamp', 'master suite', 17.6, F1 + 0.75, -8.5);
  B.box('hChrome', 17.45, F1 + 0.762, -7.8, 0.24, 0.012, 0.34); { const s = B.box('hBlackGlass', 17.62, F1 + 0.88, -7.8, 0.012, 0.22, 0.32); s.rotation.z = -0.25; s.updateMatrix(); }
  K.books(B, 17.6, F1 + 0.75, -7.3, 3, 0.2);
  // on the bed and the nightstands: a tray with cups at the foot, books, slippers
  B.box('hWalnut', 13, F1 + 0.6, -0.2, 0.5, 0.04, 0.34); for (const dx of [-0.1, 0.1]) B.mesh(G.cyl, 'hCeramic', 13 + dx, F1 + 0.66, -0.2, 0.08, 0.08, 0.08);
  K.books(B, 11.5, F1 + 0.51, 1.35, 2, 0.3); K.books(B, 14.5, F1 + 0.51, 1.35, 3, -0.2);
  for (const dx of [-0.07, 0.07]) B.box('hFabricWhite', 12.2 + dx, F1 + 0.03, -0.6, 0.1, 0.05, 0.27, 0.15);
  // at the foot of the bed, a walnut cabinet the TV rises out of; then a sitting room in the middle of the suite, facing the lake
  B.furniture('hWalnut', 13, -1.75, F1, 1.9, 0.7, 0.45, 'tv cabinet'); B.boxE('hFluted', 12.07, 13.93, F1 + 0.05, F1 + 0.66, -1.98, -1.97); B.boxE('hTravertine', 12.03, 13.97, F1 + 0.7, F1 + 0.73, -1.99, -1.51);
  K.rug(B, 13, -9, F1, 4.6, 3.6, 0, { mat: 'hRugCream', border: 'hRugRust' });
  K.sofa(B, 13, -7.6, F1, 2.8, Math.PI, { mat: 'hFabricSand', accent: 'hFabricOlive', d: 0.95 });
  K.armchair(B, 11.0, -10.0, F1, Math.PI / 2 + 0.3, { mat: 'hFabricRust' }); K.armchair(B, 15.0, -10.0, F1, -Math.PI / 2 - 0.3, { mat: 'hFabricRust' });
  K.table(B, 13, -9.4, F1, 1.3, 0.7, 0, { top: 'hTravertine', h: 0.36, legs: 'slab', t: 0.05, tag: 'coffee table' });
  K.vase(B, 12.7, F1 + 0.36, -9.4, 0.7); K.books(B, 13.35, F1 + 0.36, -9.3, 3, 0.3); candle(13.0, F1 + 0.36, -9.6, 0.1);
  K.floorLamp(B, 10.6, -7.5, F1); lampGlow('master-floor-lamp', 'Floor lamp', 'master suite', 10.6, F1 + 1.6, -7.5, 0.43, 0.35);
  K.plant(B, 8.7, -16.6, F1, 'olive', 2.3, { pot: 'hTravertine' });

  /* ================= THE MAIN BATHROOM ================= */
  // a wall-hung WC behind a frosted screen, a brass towel ladder hung with towels, a teak bath tray, mats, the shower's niche and rain head
  const frost = new THREE.MeshPhongMaterial({ color: 0xe8f0f4, transparent: true, opacity: 0.6, shininess: 120 });
  // (the east side is all glass, so the WC sits in the corner by the wall to the dressing room, behind its screen)
  B.solid(frost, 19.95, 20.0, F1, F1 + 2.2, 0.6, 1.9, { kind: 'wall', tag: 'screen' });
  B.box('hWhite', 19.3, F1 + 0.6, 1.82, 0.7, 1.2, 0.15); B.box('hChrome', 19.3, F1 + 1.0, 1.74, 0.2, 0.12, 0.01);
  B.mesh(G.lowSphere, 'hWhite', 19.3, F1 + 0.36, 1.45, 0.38, 0.36, 0.56); B.box('hWhite', 19.3, F1 + 0.55, 1.47, 0.38, 0.03, 0.5);
  P.addWall(19.0, 19.6, 1.15, 1.9, F1, F1 + 0.55, { kind: 'furniture', tag: 'wc' });
  for (let i = 0; i < 6; i++) B.box('hBrass', 23.5, F1 + 0.35 + i * 0.22, 1.87, 0.6, 0.025, 0.03); for (const dx of [-0.3, 0.3]) B.box('hBrass', 23.5 + dx, F1 + 0.9, 1.87, 0.03, 1.2, 0.03);
  B.box('hTowel', 23.5, F1 + 1.05, 1.82, 0.5, 0.7, 0.06); B.box('hTowelGrey', 23.4, F1 + 0.6, 1.8, 0.42, 0.4, 0.05);
  B.box('hTeak', 22, F1 + 0.575, -15.4, 0.3, 0.02, 0.9); candle(22, F1 + 0.585, -15.2, 0.1); K.books(B, 22, F1 + 0.585, -15.6, 1, 0);
  B.box('hTowelGrey', 22, F1 + 0.015, -14.6, 1.0, 0.012, 0.6); B.box('hTowelGrey', 19.1, F1 + 0.015, -10, 0.6, 0.012, 1.4);
  B.solid('hMarble', 25.4, 25.9, F1, F1 + 0.45, -4.1, -3.1, { kind: 'furniture', tag: 'shower bench' }); for (let i = 0; i < 3; i++) B.mesh(G.cyl, ['hWhite', 'hBottleAmber', 'hCeramicDark'][i], 25.7, F1 + 0.55, -3.9 + i * 0.25, 0.07, 0.2, 0.07);
  B.mesh(G.cyl, 'hChrome', 24.8, C2 - 0.06, -3.1, 0.3, 0.02, 0.3); B.box('hBlackSteel', 24.8, F1 + 0.025, -2.3, 1.1, 0.006, 0.06);
  B.box('hBlackSteel', 18.2, F1 + 1.9, -2.6, 0.08, 0.04, 0.04); B.box('hTowelGrey', 18.24, F1 + 1.35, -2.6, 0.1, 1.1, 0.42); B.box('hTowelGrey', 18.26, F1 + 1.85, -2.6, 0.12, 0.12, 0.2);   // a robe on its hook
  // a bench by the glass, a tall plant, a stool by the bath
  B.box('hTeak', 22.5, F1 + 0.42, -6.5, 1.6, 0.05, 0.42); for (const s of [-1, 1]) B.box('hTeak', 22.5 + s * 0.72, F1 + 0.2, -6.5, 0.05, 0.4, 0.4); B.box('hTowel', 22.0, F1 + 0.48, -6.5, 0.4, 0.07, 0.3);
  P.addWall(21.7, 23.3, -6.72, -6.28, F1, F1 + 0.45, { kind: 'furniture', tag: 'bench' });
  K.plant(B, 25.2, -6.5, F1, 'olive', 2.2, { pot: 'hTravertine' });
  B.mesh(G.cyl, 'hTeak', 23.5, F1 + 0.22, -14.4, 0.36, 0.44, 0.36);

  /* ================= THE DRESSING ROOM ================= */
  B.room = 'dressing room';
  // a shoe wall: angled shelves of pairs, each lit beneath
  B.boxE('hSmokedOak', 25.5, 25.98, F1, F1 + 2.4, 9.8, 13.5);
  P.addWall(25.5, 26, 9.8, 13.5, F1, F1 + 2.4, { kind: 'furniture', tag: 'shoe wall' });
  { const rnd = BM.mulberry32(41), cols = ['hBlackSteel', 'hLeather', 'hFabricWhite', 'hRed', 'hFabricSand', 'hLeatherBlack'];
    for (let k = 0; k < 8; k++) { const y = F1 + 0.15 + k * 0.28; { const s = B.box('hSmokedOak', 25.36, y, 11.65, 0.3, 0.02, 3.6); s.rotation.z = 0.2; s.updateMatrix(); }
      for (let z = 10.0; z < 13.3; z += 0.32) { const c = cols[Math.floor(rnd() * cols.length)]; for (const dz of [-0.055, 0.055]) { const sh = B.box(c, 25.33, y + 0.06, z + dz, 0.26, 0.09, 0.09); sh.rotation.z = 0.2; sh.updateMatrix(); } } } }
  // a dressing table with a lit mirror and a stool
  K.table(B, 25.6, 4.2, F1, 1.2, 0.5, -Math.PI / 2, { top: 'hMarble', h: 0.75, legs: 'slab', tag: 'dressing table' });
  B.box('hMirror', 25.95, F1 + 1.45, 4.2, 0.02, 0.8, 0.9);
  led({ id: 'dressing-mirror', name: 'Mirror light', room: 'dressing room', pos: [25.6, F1 + 1.45, 4.2], colour: 0xfff0dc, target: 0.4, range: 2.5, corona: 0, glow: [25.97, F1 + 1.45, 4.2, 0.01, 0.86, 0.96] });
  B.mesh(G.cyl, 'hBoucle', 25.0, F1 + 0.24, 4.2, 0.45, 0.46, 0.45);
  for (let i = 0; i < 4; i++) B.mesh(G.cyl, ['hBottleClear', 'hBrass', 'hBottleAmber', 'hCeramic'][i], 25.7, F1 + 0.8, 3.8 + i * 0.12, 0.05, 0.1 + (i % 2) * 0.05, 0.05);
  K.rug(B, 16, 8, F1, 3.6, 2.4, 0, { mat: 'hRugCream', border: 'hRugRust' });

  /* ================= THE GUEST ROOM ================= */
  B.room = 'guest room';
  // a sitting area facing a TV wall: a sofa, a coffee table, a lamp; and a luggage rack with a case
  K.rug(B, -22.6, -12.2, F1, 3.0, 3.4, 0, { mat: 'hRugGrey', border: 'hRugCream' });
  K.credenza(B, -25.65, -12.2, F1, 2.2, Math.PI / 2, { mat: 'hOak' });
  B.box('hBlackGlass', -25.96, F1 + 1.55, -12.2, 0.04, 0.83, 1.45);
  K.sofa(B, -21.2, -12.2, F1, 2.4, -Math.PI / 2, { mat: 'hFabricStone', accent: 'hFabricRust', d: 0.95 });
  K.table(B, -23.1, -12.2, F1, 0.6, 1.0, 0, { top: 'hOak', h: 0.4, legs: 'slab', tag: 'coffee table' });
  K.vase(B, -23.1, F1 + 0.4, -12.5, 0.6); K.books(B, -23.1, F1 + 0.4, -11.9, 2, 0.2);
  K.floorLamp(B, -21.4, -14.2, F1); lampGlow('guest-floor-lamp', 'Floor lamp', 'guest room', -21.4, F1 + 1.6, -14.2, 0.43, 0.35);
  { const x = -22.6, z = 1.2; for (const dx of [-0.3, 0.3]) for (const dz of [-0.2, 0.2]) B.box('hBrass', x + dx, F1 + 0.25, z + dz, 0.02, 0.5, 0.02); for (let i = 0; i < 4; i++) B.box('hLeather', x, F1 + 0.5, z - 0.15 + i * 0.1, 0.7, 0.02, 0.04);
    B.box('hLeather', x, F1 + 0.65, z, 0.7, 0.25, 0.45); B.box('hBrass', x, F1 + 0.79, z, 0.2, 0.03, 0.03); P.addWall(x - 0.36, x + 0.36, z - 0.24, z + 0.24, F1, F1 + 0.8, { kind: 'furniture', tag: 'luggage' }); }
  K.books(B, -18.6, F1 + 0.51, 1.35, 2, 0.4);
  B.box('hFabricOlive', -17, F1 + 0.42, -0.9, 1.3, 0.1, 0.42); for (const s of [-1, 1]) B.box('hOak', -17 + s * 0.6, F1 + 0.18, -0.9, 0.05, 0.36, 0.38);
  K.plant(B, -9.0, -16.8, F1, 'fig', 2.3);

  /* ================= THE LANDING ================= */
  B.room = 'landing';
  // a chess table between two chairs, a globe on a stand
  { const x = -4.6, z = -15.8; K.table(B, x, z, F1, 0.7, 0.7, 0, { top: 'hWalnut', h: 0.72, legs: 'pedestal', tag: 'chess table' });
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext && cv.getContext('2d');
    if (g) for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#3a2a1c' : '#e0d0b0'; g.fillRect(i * 8, j * 8, 8, 8); }
    { const b = B.mesh(G.plane, new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(cv), shininess: 40 }), x, F1 + 0.722, z, 0.45, 0.45, 1); b.rotation.x = -Math.PI / 2; b.updateMatrix(); }
    for (let i = 0; i < 16; i++) { const side = i < 8 ? -1 : 1, px = x - 0.197 + (i % 8) * 0.056, pz = z + side * 0.17 + (i % 3 === 0 ? -side * 0.056 : 0); B.mesh(G.cyl, side < 0 ? 'hWhite' : 'hPianoBlack', px, F1 + 0.745, pz, 0.03, 0.045, 0.03); B.mesh(G.sphere, side < 0 ? 'hWhite' : 'hPianoBlack', px, F1 + 0.775, pz, 0.025, 0.025, 0.025); }
    K.diningChair(B, x, z - 0.65, F1, 0, { wood: 'hWalnut', mat: 'hLeather' }); K.diningChair(B, x, z + 0.65, F1, Math.PI, { wood: 'hWalnut', mat: 'hLeather' }); }
  B.mesh(G.cyl, 'hWalnut', -6.6, F1 + 0.02, -16.6, 0.4, 0.04, 0.4); B.mesh(G.post, 'hBrass', -6.6, F1 + 0.45, -16.6, 0.03, 0.85, 0.03);
  B.mesh(G.sphere, 'hFabricBlue', -6.6, F1 + 1.05, -16.6, 0.42); B.mesh(G.ring, 'hBrass', -6.6, F1 + 1.05, -16.6, 0.5, 0.5, 0.5);

  /* ================= THE GAMES ROOM ================= */
  B.room = 'games room';
  // two arcade cabinets against the front wall, their screens alive
  const arc = document.createElement('canvas'); arc.width = 64; arc.height = 80; const arcT = new THREE.CanvasTexture(arc);
  HC.arcade = { c: arc, t: arcT, play: 0, k: 0 }; BM.drawArcade(HC.arcade);
  const arcMat = new THREE.MeshBasicMaterial({ map: arcT });
  for (const x of [-7.4, -8.4]) {
    const f = K.frame(B, x, 13.25, F1, Math.PI);
    f.box('hPianoBlack', 0, 0.9, 0, 0.7, 1.8, 0.8); f.box('hFabricBlue', 0.351, 1.0, 0, 0.004, 1.6, 0.7); f.box('hFabricBlue', -0.351, 1.0, 0, 0.004, 1.6, 0.7);
    f.box('hBlackSteel', 0, 0.98, 0.45, 0.66, 0.1, 0.3); for (let i = 0; i < 4; i++) f.mesh(G.sphere, ['hRed', 'hFabricBlue', 'hPopcorn', 'hRed'][i], -0.15 + i * 0.1, 1.04, 0.5, 0.04);
    f.mesh(G.post, 'hBlackSteel', -0.24, 1.07, 0.48, 0.02, 0.08, 0.02); f.mesh(G.sphere, 'hRed', -0.24, 1.12, 0.48, 0.045);
    const s = f.mesh(G.plane, arcMat, 0, 1.38, 0.405, 0.56, 0.66, 1, -0.2); s.userData.dynamic = true;
    f.mesh(G.plane, BM.labelMat('HALCYON INVADERS', { w: 256, h: 48, size: 26, bg: '#100820', fg: '#ff4fd8' }), 0, 1.88, 0.405, 0.66, 0.14, 1);
  }
  P.addWall(-8.8, -7.0, 12.85, 13.65, F1, F1 + 1.8, { kind: 'furniture', tag: 'arcade' });
  B.interactable({ id: 'arcade', label: () => HC.arcade.play > 0 ? 'Arcade: playing…' : 'Arcade: play a game', pos: [-7.9, F1 + 1.1, 12.6], n: [0, -1], act: g => BM.halcyonArcade(g) });
  // a jukebox with a glowing arch
  { const x = -10.0, z = 13.3; B.solid('hWalnut', x - 0.45, x + 0.45, F1, F1 + 1.4, z - 0.32, z + 0.32, { kind: 'furniture', tag: 'jukebox' });
    const arch = B.mesh(G.cyl, 'hBottleClear', x, F1 + 1.4, z, 0.9, 0.6, 0.6); arch.rotation.x = Math.PI / 2; arch.updateMatrix();
    led({ id: 'jukebox', name: 'Jukebox', room: 'games room', pos: [x, F1 + 1.2, z - 0.6], colour: 0xff8ad8, target: 0.4, range: 3, corona: 0, glow: [x, F1 + 0.8, z - 0.325, 0.7, 0.6, 0.01] }); }
  // table football: a box on legs, green pitch, eight rods with players
  { const x = -9.5, z = 9.0; B.solid('hWalnut', x - 0.6, x + 0.6, F1 + 0.7, F1 + 0.95, z - 0.38, z + 0.38, { kind: 'furniture', tag: 'table football' });
    for (const [dx, dz] of [[-0.55, -0.33], [0.55, -0.33], [-0.55, 0.33], [0.55, 0.33]]) B.box('hWalnut', x + dx, F1 + 0.35, z + dz, 0.07, 0.7, 0.07);
    B.box('hTurf', x, F1 + 0.951, z, 1.1, 0.004, 0.68);
    for (let i = 0; i < 8; i++) { const rx = x - 0.47 + i * 0.134; B.box('hChrome', rx, F1 + 1.0, z, 0.016, 0.016, 1.3); for (let k = 0; k < 3; k++) B.box(i % 2 ? 'hRed' : 'hFabricBlue', rx, F1 + 0.98, z - 0.2 + k * 0.2, 0.03, 0.08, 0.04); } }
  // a card table with four chairs, cards and chips
  { const x = -9.6, z = 5.2; K.table(B, x, z, F1, 1.0, 1.0, 0, { top: 'hGreenFelt', legMat: 'hWalnut', h: 0.75, tag: 'card table' });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; K.diningChair(B, x + Math.sin(a) * 0.75, z + Math.cos(a) * 0.75, F1, a + Math.PI, { wood: 'hWalnut', mat: 'hLeather' }); }
    for (let i = 0; i < 5; i++) B.box('hWhite', x - 0.2 + i * 0.1, F1 + 0.752, z + 0.05, 0.06, 0.002, 0.09, i * 0.2);
    for (let i = 0; i < 9; i++) B.mesh(G.cyl, ['hRed', 'hFabricBlue', 'hWhite'][i % 3], x + 0.25 + (i % 3) * 0.05, F1 + 0.755 + Math.floor(i / 3) * 0.006, z - 0.2, 0.04, 0.005, 0.04); }
  // a dartboard on the south wall, a line on the floor
  { const d = B.mesh(G.cyl, 'hPianoBlack', -18.2, F1 + 1.73, 2.13, 0.46, 0.04, 0.46); d.rotation.x = Math.PI / 2; d.updateMatrix();
    for (const [r, c] of [[0.34, 'hRed'], [0.26, 'hGreenFelt'], [0.18, 'hPopcorn'], [0.06, 'hGreenFelt'], [0.025, 'hRed']]) { const m = B.mesh(G.cyl, c, -18.2, F1 + 1.73, 2.152 + r * 0.01, r, 0.004, r); m.rotation.x = Math.PI / 2; m.updateMatrix(); }
    B.box('hBrass', -18.2, F1 + 0.003, 4.47, 0.6, 0.004, 0.04); }
  // a sofa to watch the golf
  K.sofa(B, -16.0, 2.75, F1, 2.6, 0, { mat: 'hLeather', accent: 'hFabricSand', d: 0.9 });

  /* ================= THE GUEST HOUSE ================= */
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'guest house';
  K.art(B, 53.98, 1.8, 72.5, 1.4, 1.0, -Math.PI / 2, 5);
  tableLamp('gh-lamp', 'guest house', 48.6, 0.53, 77.0);
  for (let i = 0; i < 3; i++) B.box(i % 2 ? 'hTowelGrey' : 'hTowel', 51.2, 0.65 + i * 0.07, 75.5, 0.4, 0.065, 0.3);

  /* ================= OUTSIDE: DINING FOR EIGHT BY THE PAVILION; TOWELS ON THE LOUNGERS ================= */
  B.zone = 'exterior'; B.room = 'grounds';
  { const x = -39, z = -19.6; K.table(B, x, z, 0.02, 2.6, 1.0, 0, { top: 'hTeak', h: 0.75, legs: 'slab', tag: 'outdoor table' });
    for (const lx of [-0.9, -0.3, 0.3, 0.9]) { K.diningChair(B, x + lx, z - 0.72, 0.02, 0, { wood: 'hTeak', mat: 'hFabricSand' }); K.diningChair(B, x + lx, z + 0.72, 0.02, Math.PI, { wood: 'hTeak', mat: 'hFabricSand' }); }
    for (const lx of [-0.6, 0, 0.6]) { B.mesh(G.cyl, 'hBottleClear', x + lx, 0.87, z, 0.12, 0.2, 0.12); candle(x + lx, 0.78, z, 0.1); } }
  for (const s of [-1, 1]) for (const x of [19, 23.8]) { B.box(s < 0 ? 'hFabricBlue' : 'hTowel', s * x, 0.4, -29.7, 0.5, 0.02, 0.9); const r = B.mesh(G.cyl, s < 0 ? 'hFabricBlue' : 'hTowel', s * x, 0.42, -30.3, 0.14, 0.45, 0.14); r.rotation.z = Math.PI / 2; r.updateMatrix(); }
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'house';
};

/* the piano: a short phrase of its own, in the house's room sound */
const PHRASES = [[[60, 0], [64, 0.25], [67, 0.5], [72, 0.75], [71, 1.25], [67, 1.5], [69, 2], [65, 2.5], [64, 3]], [[57, 0], [60, 0.3], [64, 0.6], [69, 0.9], [67, 1.5], [64, 1.8], [62, 2.4], [60, 3.0]], [[65, 0], [69, 0.25], [72, 0.5], [76, 0.75], [74, 1.25], [72, 1.75], [67, 2.25], [69, 2.75], [65, 3.25]]];
BM.halcyonPiano = function (game) {
  const A = game.audio, HC = game.halcyon; HC.pianoK = ((HC.pianoK || 0) + 1) % PHRASES.length;
  if (A && A.ctx && A.pianoNote) { const bus = A.master; for (const [m, t] of PHRASES[HC.pianoK]) A.pianoNote(m, t * 0.6, 0.5, bus); for (const [m, t] of [[PHRASES[HC.pianoK][0][0] - 12, 0], [PHRASES[HC.pianoK][0][0] - 5, 1.2]]) A.pianoNote(m, t * 0.6, 0.35, bus); }
  game.ui.say('You play a few bars on the grand piano.', 3);
};
/* the arcade: a little game of invaders on the screen, with bleeps */
BM.drawArcade = function (AR) {
  const g = AR.c.getContext && AR.c.getContext('2d'); if (!g) return;
  g.fillStyle = '#050510'; g.fillRect(0, 0, 64, 80);
  const k = AR.k, off = Math.sin(k * 0.3) * 6;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { if (AR.play > 0 && (r * 6 + c) < (k % 25)) continue; g.fillStyle = ['#ff4fd8', '#4fd8ff', '#ffd84f', '#7aff6a'][r]; const x = 8 + c * 9 + off, y = 8 + r * 8 + (k % 40) * 0.2; g.fillRect(x, y, 6, 4); g.fillRect(x - 1, y + 2, 1, 2); g.fillRect(x + 6, y + 2, 1, 2); }
  g.fillStyle = '#7aff6a'; const px = 32 + Math.sin(k * 0.17) * 22; g.fillRect(px - 4, 70, 8, 3); g.fillRect(px - 1, 67, 2, 3);
  if (AR.play > 0) { g.fillStyle = '#ffffff'; g.fillRect(px - 0.5, 60 - (k % 8) * 6, 1, 4); }
  g.fillStyle = '#ffffff'; g.font = '6px monospace'; g.fillText('SCORE ' + String(AR.play > 0 ? k * 10 : 0).padStart(4, '0'), 2, 6);
  AR.t.needsUpdate = true;
};
BM.halcyonArcade = function (game) {
  const AR = game.halcyon.arcade; AR.play = 8; AR.k = 0;
  const A = game.audio; if (A && A.ctx) for (let i = 0; i < 8; i++) A.tone('square', 440 + (i % 4) * 110, 440 + (i % 4) * 110, 0.02, 0.01, 0.08, i * 0.12);
  game.ui.say('Halcyon Invaders. You clear a wave.', 3);
};
BM.updateHalcyonDetail = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.arcade) return;
  const AR = HC.arcade; AR.acc = (AR.acc || 0) + dt;
  if (AR.acc > (AR.play > 0 ? 0.08 : 0.4)) { AR.acc = 0; AR.k++; if (AR.play > 0) AR.play -= 0.08; const p = game.player; if (AR.play > 0 || (Math.abs(p.x + 8) < 8 && Math.abs(p.z - 9) < 6 && p.y > 3)) BM.drawArcade(AR); }
  if (AR.play > 0 && game.audio && game.audio.ctx && Math.random() < dt * 4) game.audio.tone('square', 900, 300, 0.012, 0.005, 0.06);
};
})();
