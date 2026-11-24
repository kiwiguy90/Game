/* ==========================================================================
   HALCYON HOUSE — THE KIT: MATERIALS AND FURNITURE
   Real surfaces (oak planks, stacked stone, veined marble, polished
   concrete, walnut, timber battens, bouclé, leather, travertine, soapstone)
   drawn once as textures and laid in world space, and a library of modern
   furniture built from many small parts: sofas with arms, seat and back
   cushions and throw pillows; curved sofas; lounge chairs; dining chairs;
   bar stools; tables; beds with headboards, pillows, duvets and throws;
   bedside lamps; rugs with borders; potted olive trees and fig trees;
   abstract paintings; shelves with books and vases; pendants.
   Everything uses shared materials and the shared primitive shapes, so the
   optimiser can batch it.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* ---------------- textures ---------------- */
const lerpHex = (a, b, k) => { const A = parseInt(a.slice(1), 16), Bv = parseInt(b.slice(1), 16); const c = i => Math.round(((A >> i) & 255) * (1 - k) + ((Bv >> i) & 255) * k); return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; };
function grain(g, x0, y0, w, h, base, dark, r, vertical, n) {
  g.fillStyle = base; g.fillRect(x0, y0, w, h);
  for (let i = 0; i < (n || 26); i++) {
    g.strokeStyle = 'rgba(' + dark + ',' + (0.08 + r() * 0.18) + ')'; g.lineWidth = 0.5 + r() * 1.5;
    g.beginPath();
    const off = r() * (vertical ? w : h), amp = 1 + r() * 3, f = 0.02 + r() * 0.05;
    if (vertical) { for (let y = y0; y <= y0 + h; y += 4) g.lineTo(x0 + off + Math.sin(y * f + i) * amp, y); }
    else { for (let x = x0; x <= x0 + w; x += 4) g.lineTo(x, y0 + off + Math.sin(x * f + i) * amp); }
    g.stroke();
  }
}
BM.TEX_EXTRA = BM.TEX_EXTRA || {};
Object.assign(BM.TEX_EXTRA, {
  // pale European oak planks, staggered, with grain and soft joints
  oakPlank: { size: 256, draw: (g, s, r) => {
    const rows = 8, rh = s / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * s;
      while (x < s) {
        const L = s * (0.45 + r() * 0.6), tone = lerpHex('#c49a6a', '#a87c4e', r());
        grain(g, x, i * rh, L, rh, tone, '90,60,30', r, false, 10);
        g.fillStyle = 'rgba(60,40,20,0.35)'; g.fillRect(x, i * rh, 1, rh);
        x += L;
      }
      g.fillStyle = 'rgba(60,40,20,0.4)'; g.fillRect(0, i * rh, s, 1);
    }
  } },
  walnutGrain: { size: 256, draw: (g, s, r) => { grain(g, 0, 0, s, s, '#5a3a24', '25,12,6', r, true, 60); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(30,16,8,0.12)'; g.fillRect(r() * s, 0, 8 + r() * 20, s); } } },
  // stacked natural stone: long thin courses of limestone, each stone a little different
  stoneStack: { size: 256, draw: (g, s, r) => {
    g.fillStyle = '#5a554c'; g.fillRect(0, 0, s, s);
    let y = 0;
    while (y < s) {
      const h = 10 + Math.floor(r() * 22); let x = -r() * 60;
      while (x < s) {
        const w = 40 + r() * 110, tone = lerpHex('#b8ae9c', '#d6cdbb', r());
        g.fillStyle = tone; g.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
        for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255' : '60,50,40') + ',' + (0.06 + r() * 0.1) + ')'; g.fillRect(x + r() * w, y + r() * h, 2 + r() * 8, 1 + r() * 3); }
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 1.5, y + h - 4, w - 3, 2.5);
        x += w;
      }
      y += h;
    }
  } },
  // white marble with soft grey veins
  marbleVein: { size: 256, draw: (g, s, r) => {
    const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, '#eeebe5'); gr.addColorStop(1, '#e4e0d8'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = 'rgba(110,108,104,' + (0.12 + r() * 0.3) + ')'; g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath(); let x = r() * s, y = 0; g.moveTo(x, y);
      while (y < s) { x += (r() - 0.45) * 22; y += 6 + r() * 14; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(150,145,140,' + r() * 0.08 + ')'; g.fillRect(r() * s, r() * s, 2, 2); }
  } },
  // polished concrete: mottled grey, a few specks of aggregate
  concretePol: { size: 256, draw: (g, s, r) => {
    g.fillStyle = '#9a9690'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) { const x = r() * s, y = r() * s, rad = 20 + r() * 60, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(' + (r() < 0.5 ? '255,255,255' : '40,38,34') + ',0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '230,226,220' : '70,66,60') + ',0.5)'; g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2); }
  } },
  // vertical timber battens with dark shadow gaps
  battens: { size: 256, draw: (g, s, r) => {
    g.fillStyle = '#1a120c'; g.fillRect(0, 0, s, s);
    const n = 8, w = s / n;
    for (let i = 0; i < n; i++) grain(g, i * w + 3, 0, w - 6, s, lerpHex('#9a6a42', '#b07a4c', r()), '60,36,18', r, true, 8);
  } },
  boucle: { size: 128, draw: (g, s, r) => { g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, s, s); for (let i = 0; i < 2200; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(150,140,120,0.35)'; g.beginPath(); g.arc(r() * s, r() * s, 0.8 + r() * 1.6, 0, 7); g.fill(); } } },
  leatherGrain: { size: 128, draw: (g, s, r) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1600; i++) { g.fillStyle = 'rgba(0,0,0,' + r() * 0.12 + ')'; g.fillRect(r() * s, r() * s, 1 + r() * 3, 1); } } },
  travertine: { size: 256, draw: (g, s, r) => { g.fillStyle = '#d9c9ad'; g.fillRect(0, 0, s, s); for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(' + (r() < 0.6 ? '160,140,110' : '240,230,210') + ',' + (0.15 + r() * 0.25) + ')'; g.fillRect(0, r() * s, s, 0.5 + r() * 2.5); } for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(120,100,70,0.35)'; g.fillRect(r() * s, r() * s, 2 + r() * 7, 1 + r() * 1.5); } } },
  soapstone: { size: 256, draw: (g, s, r) => { g.fillStyle = '#2a2b2c'; g.fillRect(0, 0, s, s); for (let i = 0; i < 10; i++) { g.strokeStyle = 'rgba(160,165,165,' + (0.06 + r() * 0.12) + ')'; g.lineWidth = 0.5 + r(); g.beginPath(); let x = r() * s, y = 0; g.moveTo(x, y); while (y < s) { x += (r() - 0.5) * 30; y += 10 + r() * 20; g.lineTo(x, y); } g.stroke(); } } },
  // granite setts, 100 mm, in staggered courses, each a little different in tone
  hSetts: { size: 256, draw: (g, s, r) => { g.fillStyle = '#3a3a38'; g.fillRect(0, 0, s, s); const n = 16, w = s / n; for (let j = 0; j < n; j++) for (let i = -1; i < n; i++) { const x = i * w + (j % 2) * w / 2; g.fillStyle = lerpHex('#6a6a66', '#82827c', r()); g.fillRect(x + 1.5, j * w + 1.5, w - 3, w - 3); g.fillStyle = 'rgba(255,255,255,' + r() * 0.08 + ')'; g.fillRect(x + 3, j * w + 3, w - 8, 2); } } },
  // big honed limestone slabs, 600 x 1200, hairline joints
  hSlab: { size: 256, draw: (g, s, r) => { g.fillStyle = '#b8b0a0'; g.fillRect(0, 0, s, s); const sw = s / 2, sh = s / 4; for (let j = 0; j < 4; j++) for (let i = -1; i < 2; i++) { const x = i * sw + (j % 2) * sw / 2; g.fillStyle = lerpHex('#d8d0c0', '#cfc6b4', r()); g.fillRect(x + 1, j * sh + 1, sw - 2, sh - 2); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(140,125,100,' + r() * 0.12 + ')'; g.fillRect(x + r() * sw, j * sh + r() * sh, 1 + r() * 4, 1); } } } },
  // limewash plaster: soft cloudy movement
  hPlaster: { size: 256, draw: (g, s, r) => { g.fillStyle = '#dcd5ca'; g.fillRect(0, 0, s, s); for (let i = 0; i < 70; i++) { const x = r() * s, y = r() * s, rad = 20 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(' + (r() < 0.5 ? '255,255,255' : '150,135,115') + ',0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } } },
  // fluted timber: rounded reeds, 25 mm (the shading makes the bump)
  fluted: { size: 128, draw: (g, s, r) => { const n = 16, w = s / n; for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0); gr.addColorStop(0, '#5a3e28'); gr.addColorStop(0.5, '#a07a54'); gr.addColorStop(1, '#4a3220'); g.fillStyle = gr; g.fillRect(i * w, 0, w, s); } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(40,24,12,' + r() * 0.12 + ')'; g.fillRect(0, r() * s, s, 1); } } },
  // acoustic fabric panels, 600 x 1200, crisp joints
  acoustic: { size: 128, draw: (g, s, r) => { g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, s, s); for (const [x, y, w, h] of [[0, 0, s / 2, s], [s / 2, 0, s / 2, s]]) { g.fillStyle = '#ffffff'; g.fillRect(x + 1.5, y + 1.5, w - 3, h - 3); for (let i = 0; i < 600; i++) { g.fillStyle = 'rgba(0,0,0,' + r() * 0.1 + ')'; g.fillRect(x + r() * w, y + r() * h, 1, 1); } } } },
  // gym rubber: tiles with a grey fleck
  rubber: { size: 128, draw: (g, s, r) => { g.fillStyle = '#2e2f31'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1400; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '150,150,150' : '20,20,20') + ',0.6)'; g.fillRect(r() * s, r() * s, 1, 1); } g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s); } },
  turf: { size: 128, draw: (g, s, r) => { g.fillStyle = '#3f7a3a'; g.fillRect(0, 0, s, s); for (let i = 0; i < 2500; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '90,150,70' : '30,70,30') + ',0.5)'; g.fillRect(r() * s, r() * s, 1, 2); } } },
  linenWeave: { size: 128, draw: (g, s, r) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 2) { g.fillStyle = 'rgba(0,0,0,' + (0.03 + r() * 0.04) + ')'; g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); } } },
  rugPile: { size: 128, draw: (g, s, r) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s); for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(0,0,0,' + r() * 0.09 + ')'; g.fillRect(r() * s, r() * s, 1, 1); } } },
});
BM.MAT_EXTRA = BM.MAT_EXTRA || {};
Object.assign(BM.MAT_EXTRA, {
  // name: [tint, texture, metres-to-texture scale, shininess, extra]
  hOak: [0xffffff, 'oakPlank', 0.42, 40, { bump: 1 }],
  hOakLight: [0xf4ead8, 'oakPlank', 0.42, 30],
  hWalnut: [0xffffff, 'walnutGrain', 0.9, 50],
  hStone: [0xffffff, 'stoneStack', 0.32, 6, { bump: 3 }],
  hMarble: [0xffffff, 'marbleVein', 0.4, 110],
  hConcrete: [0xffffff, 'concretePol', 0.22, 70],
  hBattens: [0xffffff, 'battens', 0.7, 14, { bump: 2 }],
  hTravertine: [0xffffff, 'travertine', 0.45, 24],
  hSoapstone: [0xffffff, 'soapstone', 0.45, 40],
  hBoucle: [0xfff8ee, 'boucle', 2.2, 2, { bump: 0.6 }],
  hFabricSand: [0xd6c8b0, 'linenWeave', 2.4, 3],
  hFabricStone: [0x9a958c, 'linenWeave', 2.4, 3],
  hFabricCharcoal: [0x4a4a4c, 'linenWeave', 2.4, 3],
  hFabricRust: [0xb06a44, 'linenWeave', 2.4, 3],
  hFabricOlive: [0x7a7e56, 'linenWeave', 2.4, 3],
  hFabricWhite: [0xf2efe8, 'linenWeave', 2.4, 6],
  hFabricBlue: [0x4a5a72, 'linenWeave', 2.4, 3],
  hLeather: [0x8a4e2a, 'leatherGrain', 1.6, 45],
  hLeatherBlack: [0x1c1a18, 'leatherGrain', 1.6, 55],
  hRugCream: [0xe2d8c4, 'rugPile', 1.5, 1],
  hRugGrey: [0x8e8a84, 'rugPile', 1.5, 1],
  hRugRust: [0xa8705a, 'rugPile', 1.5, 1],
  hSetts: [0xffffff, 'hSetts', 0.625, 8, { bump: 2 }],
  hSlab: [0xffffff, 'hSlab', 0.4, 10],
  hSlabIn: [0xbdb5a8, 'hSlab', 0.4, 40],
  hPlaster: [0xffffff, 'hPlaster', 0.25, 4],
  hFluted: [0xffffff, 'fluted', 2.5, 30, { bump: 3 }],
  hAcoustic: [0x2b2b2e, 'acoustic', 0.42, 2],
  hAcousticPlum: [0x3a2a35, 'acoustic', 0.42, 2],
  hRubber: [0xffffff, 'rubber', 1.0, 4],
  hTurf: [0xffffff, 'turf', 1.5, 2],
  hDeck: [0x8a6a52, 'oakPlank', 0.5, 10, { bump: 1 }],
  hTeak: [0xa0764a, 'walnutGrain', 1.2, 20],
  hSmokedOak: [0x8a7058, 'oakPlank', 0.42, 30],
  hAspen: [0xd0a070, 'battens', 1.4, 10],
  hNero: [0xffffff, 'soapstone', 0.6, 90],
  hBronze: [0x3b3128, null, 0, 60, { specular: 0x6a5a44 }],
  hBronzeGlass: [0x6b5a48, null, 0, 140, { transparent: true, opacity: 0.45, specular: 0xffffff }],
  hMirror: [0xcad6de, null, 0, 180, { specular: 0xffffff }],
  hBlackGlass: [0x060708, null, 0, 160, { specular: 0x999999 }],
  hRackPerf: [0x141416, null, 0, 30],
  hCorten: [0x7a3e20, null, 0, 6],
  hMaple: [0x8e2b20, null, 0, 6],
  hTyre: [0x141414, null, 0, 8],
  hBottleGreen: [0x1a2410, null, 0, 150, { specular: 0x888888 }],
  hBottleRed: [0x2a0c10, null, 0, 150, { specular: 0x888888 }],
  hBottleAmber: [0x3a2010, null, 0, 150, { specular: 0x888888 }],
  hBottleClear: [0xc8d0c8, null, 0, 150, { specular: 0xffffff, transparent: true, opacity: 0.6 }],
  hFoil: [0xb8a060, null, 0, 90],
  hCloth: [0x2e5e8c, 'linenWeave', 3, 2],
  hBrass: [0xc8a058, null, 0, 120, { specular: 0x9a7a3a }],
  hBlackSteel: [0x161616, null, 0, 70, { specular: 0x444444 }],
  hChrome: [0xd8dcdf, null, 0, 160, { specular: 0xffffff }],
  hOpal: [0xfff4e4, null, 0, 20, { emissive: 0x3a3020 }],
  hCeramic: [0xe8e4dc, null, 0, 60],
  hCeramicDark: [0x2e2c2a, null, 0, 60],
  hTerracotta: [0xb46a46, null, 0, 8],
  hOliveLeaf: [0x8a9a72, null, 0, 6],
  hFigLeaf: [0x2e5a2a, null, 0, 40],
  hSoil: [0x2a1e14, null, 0, 2],
  hBark: [0x6a5a48, null, 0, 4],
  hPaper: [0xf0ece2, null, 0, 4],
});

/* ---------------- placing parts in a piece's own frame ---------------- */
function frame(B, x, z, y0, ry) {
  const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  return {
    at,
    box(mat, lx, ly, lz, sx, sy, sz, rx, rz) { const [wx, wz] = at(lx, lz); const m = B.box(mat, wx, y0 + ly, wz, sx, sy, sz, ry || 0); if (rx || rz) { m.rotation.set(rx || 0, ry || 0, rz || 0, 'YXZ'); m.updateMatrix(); } return m; },
    mesh(geo, mat, lx, ly, lz, sx, sy, sz, rx, rz) { const [wx, wz] = at(lx, lz); const m = B.mesh(geo, mat, wx, y0 + ly, wz, sx, sy, sz, ry || 0); if (rx || rz) { m.rotation.set(rx || 0, ry || 0, rz || 0, 'YXZ'); m.updateMatrix(); } return m; },
    collide(w, d, h, tag) { const sw = Math.abs(Math.cos(ry || 0)) > 0.7; const ex = sw ? w : d, ez = sw ? d : w; return B.phys.addWall(x - ex / 2, x + ex / 2, z - ez / 2, z + ez / 2, y0, y0 + h, { kind: 'furniture', tag: tag || 'furniture' }); },
  };
}
const K = BM.KIT = {};

/* A sofa: frame, arms, seat and back cushions, throw pillows. Seats face +z in its own frame. */
K.sofa = (B, x, z, y0, w, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), d = o.d || 1.0, mat = o.mat || 'hFabricSand', arm = o.arms === false ? 0 : 0.22;
  for (const [lx, lz] of [[-w / 2 + 0.12, -d / 2 + 0.12], [w / 2 - 0.12, -d / 2 + 0.12], [-w / 2 + 0.12, d / 2 - 0.12], [w / 2 - 0.12, d / 2 - 0.12]]) f.box('hBlackSteel', lx, 0.05, lz, 0.05, 0.1, 0.05);
  f.box(mat, 0, 0.22, 0, w, 0.24, d);                                                 // the base
  f.box(mat, 0, 0.55, -d / 2 + 0.1, w, 0.66, 0.2);                                   // the back frame
  if (arm) for (const s of [-1, 1]) f.box(mat, s * (w / 2 - arm / 2), 0.42, 0.02, arm, 0.44, d - 0.02);
  const inner = w - arm * 2, n = Math.max(1, Math.round(inner / 0.85)), cw = inner / n;
  for (let i = 0; i < n; i++) {
    const lx = -inner / 2 + cw * (i + 0.5);
    f.box(mat, lx, 0.42, 0.08, cw - 0.03, 0.17, d - 0.3);                             // seat cushion
    f.box(mat, lx, 0.66, -d / 2 + 0.3, cw - 0.04, 0.46, 0.2, -0.2);                   // back cushion, leaning
  }
  const acc = o.accent || 'hFabricRust';
  for (const s of [-1, 1]) f.mesh(G.sphere, s < 0 ? acc : 'hFabricWhite', s * (inner / 2 - 0.28), 0.68, -d / 2 + 0.48, 0.44, 0.4, 0.14, -0.35, s * 0.25);
  f.collide(w, d, 0.85, 'sofa');
};
/* A curved sofa: a run of modules along an arc, all facing its centre. */
K.curvedSofa = (B, cx, cz, y0, R, a0, a1, o) => {
  o = o || {}; const mat = o.mat || 'hBoucle', d = 0.95, n = Math.max(3, Math.round(R * Math.abs(a1 - a0) / 0.8));
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i + 0.5) / n, x = cx + Math.sin(a) * R, z = cz + Math.cos(a) * R, ry = a + Math.PI;
    const f = frame(B, x, z, y0, ry), w = R * Math.abs(a1 - a0) / n + 0.04;
    f.box(mat, 0, 0.2, 0, w, 0.26, d); f.box(mat, 0, 0.42, 0.08, w - 0.02, 0.16, d - 0.3); f.box(mat, 0, 0.6, -d / 2 + 0.12, w, 0.56, 0.24, -0.12);
    f.collide(w, d, 0.8, 'curved sofa');
  }
  for (const a of [a0, a1]) { const f = frame(B, cx + Math.sin(a) * R, cz + Math.cos(a) * R, y0, a + Math.PI); f.mesh(G.cyl, mat, 0, 0.32, 0, 0.3, 0.56, 0.95); }
  if (o.pillows !== false) for (let k = 0; k < 3; k++) { const a = a0 + (a1 - a0) * (0.2 + k * 0.3), f = frame(B, cx + Math.sin(a) * (R + 0.25), cz + Math.cos(a) * (R + 0.25), y0, a + Math.PI); f.mesh(G.sphere, ['hFabricRust', 'hFabricOlive', 'hFabricWhite'][k], 0, 0.68, 0, 0.44, 0.4, 0.14, -0.3); }
};
/* A lounge chair: a walnut shell, leather cushions, an ottoman. */
K.loungeChair = (B, x, z, y0, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), lm = o.mat || 'hLeather';
  f.box('hBlackSteel', 0, 0.12, 0, 0.06, 0.24, 0.06); f.box('hBlackSteel', 0, 0.02, 0, 0.7, 0.03, 0.06); f.box('hBlackSteel', 0, 0.02, 0, 0.06, 0.03, 0.7);
  f.box('hWalnut', 0, 0.36, 0.05, 0.8, 0.06, 0.8, -0.12); f.box(lm, 0, 0.45, 0.05, 0.72, 0.12, 0.72, -0.12);
  f.box('hWalnut', 0, 0.8, -0.36, 0.8, 0.8, 0.06, -0.32); f.box(lm, 0, 0.82, -0.3, 0.72, 0.74, 0.12, -0.32);
  for (const s of [-1, 1]) f.box(lm, s * 0.38, 0.6, -0.05, 0.12, 0.08, 0.6);
  if (o.ottoman !== false) { f.box('hWalnut', 0, 0.3, 0.85, 0.6, 0.05, 0.5); f.box(lm, 0, 0.38, 0.85, 0.56, 0.12, 0.46); f.box('hBlackSteel', 0, 0.14, 0.85, 0.05, 0.28, 0.05); }
  f.collide(0.9, 1.6, 1.0, 'lounge chair');
};
K.armchair = (B, x, z, y0, ry, o) => { o = o || {}; const f = frame(B, x, z, y0, ry), m = o.mat || 'hBoucle'; f.mesh(G.cyl, m, 0, 0.22, 0, 0.9, 0.3, 0.86); f.box(m, 0, 0.42, 0.05, 0.62, 0.14, 0.6); f.mesh(G.cyl, m, 0, 0.55, -0.12, 0.92, 0.5, 0.7); f.collide(0.9, 0.9, 0.8, 'armchair'); };
/* A dining chair: oak frame, an upholstered seat, a curved back. */
K.diningChair = (B, x, z, y0, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), w = o.wood || 'hOak', m = o.mat || 'hFabricSand';
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) f.box(w, lx, 0.22, lz, 0.035, 0.44, 0.035);
  f.box(w, 0, 0.45, 0, 0.46, 0.03, 0.46); f.box(m, 0, 0.49, 0.01, 0.44, 0.05, 0.42);
  for (const s of [-1, 1]) f.box(w, s * 0.2, 0.68, -0.21, 0.035, 0.44, 0.035, -0.1);
  f.box(m, 0, 0.78, -0.23, 0.44, 0.22, 0.05, -0.1);
};
K.barStool = (B, x, z, y0, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), m = o.mat || 'hLeather', h = o.h || 0.76;
  f.mesh(G.cyl, 'hBlackSteel', 0, 0.01, 0, 0.42, 0.02, 0.42); f.mesh(G.cyl, 'hBlackSteel', 0, h / 2, 0, 0.05, h - 0.02, 0.05);
  f.mesh(G.ring, 'hBrass', 0, h * 0.4, 0, 0.36, 0.36, 0.36, -Math.PI / 2);
  f.mesh(G.cyl, m, 0, h, 0, 0.42, 0.07, 0.42); f.box(m, 0, h + 0.19, -0.17, 0.36, 0.24, 0.05, -0.12);
};
/* Tables: a top and its legs (four, a slab pair, or a pedestal) */
K.table = (B, x, z, y0, w, d, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), h = o.h || 0.75, top = o.top || 'hOak', t = o.t || 0.05, legs = o.legs || 'four', lm = o.legMat || top;
  f.box(top, 0, h - t / 2, 0, w, t, d);
  if (legs === 'four') for (const [lx, lz] of [[-w / 2 + 0.08, -d / 2 + 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, d / 2 - 0.08], [w / 2 - 0.08, d / 2 - 0.08]]) f.box(lm, lx, (h - t) / 2, lz, 0.06, h - t, 0.06);
  else if (legs === 'slab') for (const s of [-1, 1]) f.box(lm, s * (w / 2 - 0.25), (h - t) / 2, 0, 0.08, h - t, d * 0.8);
  else f.mesh(G.cyl, lm, 0, (h - t) / 2, 0, Math.min(w, d) * 0.3, h - t, Math.min(w, d) * 0.3);
  if (o.collide !== false) f.collide(w, d, h, o.tag || 'table');
};
K.roundTable = (B, x, z, y0, r, h, o) => { o = o || {}; B.mesh(G.cyl, o.top || 'hTravertine', x, y0 + h - 0.03, z, r * 2, 0.06, r * 2); B.mesh(G.cyl, o.base || o.top || 'hTravertine', x, y0 + (h - 0.06) / 2, z, r * 0.9, h - 0.06, r * 0.9); B.phys.addWall(x - r, x + r, z - r, z + r, y0, y0 + h, { kind: 'furniture', tag: 'table' }); };
/* A bed: a low walnut platform, mattress, duvet, a throw, pillows, a tall upholstered headboard, bedside tables and lamps */
K.bed = (B, x, z, y0, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), w = o.w || 1.95, l = o.l || 2.1, hb = o.headboard || 'hFabricStone';
  f.box('hWalnut', 0, 0.14, 0, w + 0.2, 0.22, l + 0.1);
  f.box('hFabricWhite', 0, 0.38, 0.02, w, 0.26, l - 0.02);                                   // mattress
  f.box('hFabricWhite', 0, 0.53, 0.32, w + 0.08, 0.06, l * 0.72);                            // the duvet, folded back a little
  f.box(o.throw || 'hFabricRust', 0, 0.57, l / 2 - 0.42, w + 0.12, 0.04, 0.5);                // a throw across the foot
  for (const [lx, sz] of [[-w / 4, 1], [w / 4, 1]]) { f.mesh(G.sphere, 'hFabricWhite', lx, 0.72, -l / 2 + 0.22, w / 2 - 0.08, 0.5, 0.2, -0.5); f.mesh(G.sphere, 'hFabricWhite', lx, 0.62, -l / 2 + 0.42, w / 2 - 0.12, 0.3, 0.2, -0.2); }
  f.mesh(G.sphere, o.accent || 'hFabricOlive', 0, 0.62, -l / 2 + 0.6, 0.5, 0.36, 0.14, -0.3);
  f.box(hb, 0, 0.75, -l / 2 - 0.08, w + 0.7, 1.3, 0.12);                                    // the headboard
  for (let i = -4; i <= 4; i++) f.box(hb, i * (w + 0.6) / 9, 0.75, -l / 2 - 0.015, 0.012, 1.2, 0.02);
  const lamps = [];
  for (const s of [-1, 1]) {
    const bx = s * (w / 2 + 0.55);
    f.box('hWalnut', bx, 0.25, -l / 2 + 0.25, 0.55, 0.5, 0.45); f.box('hBrass', bx, 0.505, -l / 2 + 0.25, 0.5, 0.01, 0.4);
    f.mesh(G.cyl, 'hCeramicDark', bx, 0.66, -l / 2 + 0.25, 0.12, 0.3, 0.12); f.mesh(G.cyl, 'hOpal', bx, 0.93, -l / 2 + 0.25, 0.34, 0.26, 0.34);
    lamps.push(f.at(bx, -l / 2 + 0.25));
  }
  f.collide(w + 0.2, l + 0.2, 0.6, 'bed');
  return lamps;   // where the bedside lamps stand, for their lights
};
K.rug = (B, x, z, y, w, d, ry, o) => { o = o || {}; const f = frame(B, x, z, y, ry); f.box(o.mat || 'hRugCream', 0, 0.006, 0, w, 0.012, d); if (o.border !== false) { const b = o.border || 'hRugGrey'; for (const s of [-1, 1]) { f.box(b, 0, 0.007, s * (d / 2 - 0.12), w - 0.1, 0.012, 0.06); f.box(b, s * (w / 2 - 0.12), 0.007, 0, 0.06, 0.012, d - 0.1); } } };
/* Plants: an olive tree or a fig in a big pot, or a tall grass */
K.plant = (B, x, z, y0, kind, h, o) => {
  o = o || {}; h = h || 2.2; const pot = o.pot || 'hCeramicDark', rnd = BM.mulberry32(Math.floor(x * 13 + z * 7));
  B.mesh(G.cyl, pot, x, y0 + 0.3, z, 0.62, 0.6, 0.62); B.mesh(G.cyl, 'hSoil', x, y0 + 0.59, z, 0.55, 0.02, 0.55);
  if (kind === 'olive') {
    for (let i = 0; i < 3; i++) { const m = B.mesh(G.post, 'hBark', x + (i - 1) * 0.06, y0 + 0.6 + h * 0.25, z, 0.07, h * 0.5, 0.07); m.rotation.set((i - 1) * 0.15, 0, (i - 1) * 0.2); m.updateMatrix(); }
    for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, r = 0.2 + rnd() * 0.55; B.mesh(G.sphere, 'hOliveLeaf', x + Math.cos(a) * r, y0 + 0.6 + h * 0.55 + rnd() * h * 0.35, z + Math.sin(a) * r, 0.35 + rnd() * 0.25, 0.22 + rnd() * 0.12, 0.35 + rnd() * 0.25); }
  } else if (kind === 'fig') {
    B.mesh(G.post, 'hBark', x, y0 + 0.6 + h * 0.3, z, 0.05, h * 0.6, 0.05);
    for (let i = 0; i < 18; i++) { const a = i * 2.4, yy = y0 + 0.9 + (i / 18) * h * 0.8, r = 0.15 + rnd() * 0.25; const m = B.mesh(G.sphere, 'hFigLeaf', x + Math.cos(a) * r, yy, z + Math.sin(a) * r, 0.34, 0.04, 0.26); m.rotation.set(0.4 + rnd() * 0.4, -a, 0, 'YXZ'); m.updateMatrix(); }
  } else {
    for (let i = 0; i < 14; i++) { const m = B.mesh(G.cone, 'longGrass', x + (rnd() - 0.5) * 0.3, y0 + 0.6 + h * 0.3, z + (rnd() - 0.5) * 0.3, 0.04, h * 0.6, 0.04); m.rotation.set((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); m.updateMatrix(); }
  }
  B.phys.addWall(x - 0.32, x + 0.32, z - 0.32, z + 0.32, y0, y0 + 1.0, { kind: 'furniture', tag: 'plant' });
};
/* A painting: a thin frame and a canvas of its own (colour fields, brushwork, circles or a horizon) */
const ART = [['#c8b8a0', '#8a5a3a', '#2a2a30'], ['#1e2a3a', '#c86a3a', '#e8dcc8'], ['#d8d0c0', '#4a6a5a', '#b89a6a'], ['#2a2a2c', '#a8a49c', '#d8b070'], ['#e6e0d4', '#6a7a9a', '#c8a090']];
K.art = (B, x, y, z, w, h, ry, seed) => {
  const r = BM.mulberry32(seed || 1), pal = ART[(seed || 0) % ART.length], c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w);
  const g = c.getContext && c.getContext('2d');
  if (g) {
    const H = c.height, style = (seed || 0) % 4;
    g.fillStyle = pal[0]; g.fillRect(0, 0, 256, H);
    if (style === 0) { g.fillStyle = pal[1]; g.fillRect(20, 20, 216, H * 0.45); g.fillStyle = pal[2]; g.fillRect(20, H * 0.55, 216, H * 0.38); }
    else if (style === 1) { for (let i = 0; i < 40; i++) { g.strokeStyle = pal[1 + (i % 2)]; g.globalAlpha = 0.3 + r() * 0.5; g.lineWidth = 4 + r() * 16; g.beginPath(); g.moveTo(r() * 256, r() * H); g.quadraticCurveTo(r() * 256, r() * H, r() * 256, r() * H); g.stroke(); } g.globalAlpha = 1; }
    else if (style === 2) { for (let i = 0; i < 6; i++) { g.fillStyle = pal[1 + (i % 2)]; g.globalAlpha = 0.5 + r() * 0.5; g.beginPath(); g.arc(40 + r() * 176, 30 + r() * (H - 60), 14 + r() * 50, 0, 7); g.fill(); } g.globalAlpha = 1; }
    else { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pal[0]); gr.addColorStop(0.62, pal[2]); gr.addColorStop(0.64, pal[1]); gr.addColorStop(1, pal[1]); g.fillStyle = gr; g.fillRect(0, 0, 256, H); }
    for (let i = 0; i < 800; i++) { g.fillStyle = 'rgba(0,0,0,' + r() * 0.05 + ')'; g.fillRect(r() * 256, r() * H, 2, 2); }
  }
  const t = new THREE.CanvasTexture(c), f = frame(B, x, z, 0, ry);
  f.box('hBlackSteel', 0, y, -0.02, w + 0.06, h + 0.06, 0.04);
  f.mesh(G.plane, new THREE.MeshPhongMaterial({ map: t, shininess: 4 }), 0, y, 0.002, w, h, 1);
};
/* Shelves with books, vases and a few objects */
const BOOKS = ['hFabricWhite', 'hFabricRust', 'hFabricCharcoal', 'hFabricOlive', 'hFabricBlue', 'hFabricSand'];
K.shelves = (B, x, z, y0, w, h, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), d = 0.36, m = o.mat || 'hWalnut', rows = Math.max(3, Math.round(h / 0.42)), rnd = BM.mulberry32(Math.floor(x * 31 + z * 17));
  f.box(m, 0, h / 2, -d / 2 + 0.01, w, h, 0.02);
  for (const s of [-1, 1]) f.box(m, s * w / 2, h / 2, 0, 0.03, h, d);
  for (let i = 0; i <= rows; i++) f.box(m, 0, i * h / rows, 0, w, 0.03, d);
  for (let i = 0; i < rows; i++) {
    const y = i * h / rows + 0.015; let lx = -w / 2 + 0.06;
    while (lx < w / 2 - 0.15) {
      const k = rnd();
      if (k < 0.6) { const n = 4 + Math.floor(rnd() * 8); for (let b = 0; b < n && lx < w / 2 - 0.06; b++) { const bh = 0.22 + rnd() * 0.1; f.box(BOOKS[Math.floor(rnd() * BOOKS.length)], lx + 0.016, y + bh / 2, 0.02, 0.03, bh, 0.22); lx += 0.034; } lx += 0.1; }
      else if (k < 0.8) { f.mesh(G.sphere, rnd() < 0.5 ? 'hCeramic' : 'hCeramicDark', lx + 0.1, y + 0.12, 0.02, 0.16, 0.22, 0.16); lx += 0.3; }
      else { f.box('hTravertine', lx + 0.08, y + 0.06, 0.02, 0.12, 0.12, 0.12); f.mesh(G.sphere, 'hBrass', lx + 0.08, y + 0.17, 0.02, 0.08, 0.08, 0.08); lx += 0.3; }
    }
  }
  f.collide(w, d, h, 'shelves');
};
/* Pendants: a globe in opal glass, a brass drum, a long linear bar */
K.pendant = (B, x, y, z, kind, o) => {
  o = o || {}; const drop = o.drop || 1.0;
  B.box('hBlackSteel', x, y + drop / 2, z, 0.01, drop, 0.01);
  if (kind === 'globe') B.mesh(G.sphere, 'hOpal', x, y, z, o.size || 0.38);
  else if (kind === 'drum') { B.mesh(G.cyl, 'hBrass', x, y, z, o.size || 0.5, 0.26, o.size || 0.5); B.mesh(G.cyl, 'hOpal', x, y - 0.13, z, (o.size || 0.5) * 0.9, 0.01, (o.size || 0.5) * 0.9); }
  else { const len = o.len || 2.4; B.box('hBlackSteel', x, y, z, len, 0.06, 0.08, o.ry || 0); B.box('hOpal', x, y - 0.035, z, len - 0.04, 0.012, 0.05, o.ry || 0); }
};
K.floorLamp = (B, x, z, y0, o) => { o = o || {}; B.mesh(G.cyl, 'hTravertine', x, y0 + 0.03, z, 0.34, 0.06, 0.34); B.mesh(G.post, 'hBrass', x, y0 + 0.8, z, 0.025, 1.55, 0.025); B.mesh(G.cyl, 'hFabricWhite', x, y0 + 1.6, z, 0.42, 0.34, 0.42); };
K.vase = (B, x, y, z, s) => { s = s || 1; B.mesh(G.sphere, 'hCeramic', x, y + 0.14 * s, z, 0.2 * s, 0.3 * s, 0.2 * s); for (let i = 0; i < 5; i++) { const m = B.mesh(G.post, 'hBark', x + (i - 2) * 0.02, y + 0.45 * s, z, 0.008, 0.5 * s, 0.008); m.rotation.z = (i - 2) * 0.12; m.updateMatrix(); } };
K.books = (B, x, y, z, n, ry) => { const f = frame(B, x, z, y, ry), rnd = BM.mulberry32(Math.floor(x * 7 + z * 3)); for (let i = 0; i < n; i++) f.box(BOOKS[Math.floor(rnd() * BOOKS.length)], (rnd() - 0.5) * 0.04, 0.025 + i * 0.045, 0, 0.3, 0.04, 0.22, 0, 0); };

/* A specimen tree: a trunk that forks into three or four limbs, a crown of clumped foliage (not one ball) */
K.tree = (B, x, z, s, kind, o) => {
  o = o || {}; const rnd = BM.mulberry32(Math.floor(x * 101 + z * 37)), h = 3.0 * s, leaf = o.leaf || 'leaves', leaf2 = o.leaf2 || 'leavesDark';
  if (kind === 'pine') return K.pine(B, x, z, s, o);
  B.mesh(G.post, 'bark', x, h * 0.3, z, 0.34 * s, h * 0.6, 0.34 * s);
  const limbs = kind === 'multi' ? 5 : 3 + Math.floor(rnd() * 2), tops = [];
  for (let i = 0; i < limbs; i++) {
    const a = i / limbs * 6.28 + rnd() * 0.6, tilt = 0.35 + rnd() * 0.3, L = h * (0.55 + rnd() * 0.25), y0 = kind === 'multi' ? 0 : h * 0.55;
    const cx = x + Math.cos(a) * Math.sin(tilt) * L / 2, cz = z + Math.sin(a) * Math.sin(tilt) * L / 2, cy = y0 + Math.cos(tilt) * L / 2;
    const m = B.mesh(G.post, 'bark', cx, cy, cz, (kind === 'multi' ? 0.16 : 0.2) * s, L, (kind === 'multi' ? 0.16 : 0.2) * s);
    m.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); m.updateMatrix();
    tops.push([x + Math.cos(a) * Math.sin(tilt) * L, y0 + Math.cos(tilt) * L, z + Math.sin(a) * Math.sin(tilt) * L]);
  }
  const R = (kind === 'multi' ? 2.4 : 2.8) * s, cy = h * 1.25;
  for (let i = 0; i < 16; i++) {
    const t = tops[i % tops.length], a = rnd() * 6.28, r = rnd();
    const px = i < tops.length ? t[0] : x + Math.cos(a) * R * 0.8 * Math.sqrt(r), pz = i < tops.length ? t[2] : z + Math.sin(a) * R * 0.8 * Math.sqrt(r);
    const py = i < tops.length ? t[1] + 0.3 * s : cy + (rnd() - 0.4) * h * 0.5, sz = (1.3 + rnd() * 1.1) * s;
    B.mesh(G.lowSphere, i % 3 ? leaf : leaf2, px, py, pz, sz * 1.15, sz * 0.8, sz);
  }
  B.phys.addWall(x - 0.2 * s, x + 0.2 * s, z - 0.2 * s, z + 0.2 * s, 0, h, { kind: 'tree', occludes: false, tag: 'tree' });
  return h;
};
K.pine = (B, x, z, s, o) => {
  o = o || {}; const h = 3.0 * s, mat = o.dark ? 'pineDark' : 'pine';
  B.mesh(G.post, 'bark', x, h * 0.5, z, 0.3 * s, h, 0.3 * s);
  for (let k = 0; k < 4; k++) { const w = (2.6 - k * 0.55) * s; B.mesh(G.cone, mat, x, h * 0.7 + k * 1.5 * s + 1.0 * s, z, w, 2.6 * s, w); }
  if (!o.noCollide) B.phys.addWall(x - 0.2 * s, x + 0.2 * s, z - 0.2 * s, z + 0.2 * s, 0, h, { kind: 'tree', occludes: false, tag: 'tree' });
  return h;
};
/* A home-cinema recliner: a leather seat, a padded back, wide arms with a console, a footrest */
K.recliner = (B, x, z, y0, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), m = o.mat || 'hLeather';
  f.box(m, 0, 0.24, 0, 0.62, 0.36, 0.78); f.box(m, 0, 0.5, 0.05, 0.58, 0.12, 0.66);
  f.box(m, 0, 0.72, -0.36, 0.6, 0.7, 0.2, -0.18); f.box(m, 0, 1.02, -0.43, 0.5, 0.2, 0.18, -0.18);
  for (const sx of [-1, 1]) { f.box(o.arm || 'hLeatherBlack', sx * 0.4, 0.33, 0, 0.18, 0.62, 0.88); f.box('hWalnut', sx * 0.4, 0.645, 0.08, 0.18, 0.02, 0.5); f.mesh(G.cyl, 'hBlackSteel', sx * 0.4, 0.65, 0.25, 0.09, 0.02, 0.09); }
  f.box(m, 0, 0.25, 0.48, 0.56, 0.1, 0.24, 0.35);
  f.collide(0.98, 0.95, 0.9, 'recliner');
};
/* A sun lounger: a teak frame, a thick cushion, the back raised */
K.lounger = (B, x, z, y0, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), w = o.wood || 'hTeak';
  for (const s of [-1, 1]) f.box(w, s * 0.33, 0.17, 0.1, 0.05, 0.08, 1.7);
  for (const [lx, lz] of [[-0.33, -0.7], [0.33, -0.7], [-0.33, 0.85], [0.33, 0.85]]) f.box(w, lx, 0.07, lz, 0.05, 0.14, 0.05);
  f.box(w, 0, 0.22, 0.25, 0.66, 0.03, 1.3); f.box(o.mat || 'hFabricWhite', 0, 0.28, 0.3, 0.64, 0.09, 1.22);
  f.box(w, 0, 0.45, -0.68, 0.66, 0.03, 0.62, 0.9); f.box(o.mat || 'hFabricWhite', 0, 0.48, -0.64, 0.62, 0.08, 0.56, 0.9);
  f.box(o.mat || 'hFabricWhite', 0, 0.68, -0.85, 0.5, 0.12, 0.18, 0.9);
  f.collide(0.7, 2.0, 0.4, 'lounger');
};
/* Wine bottles lying label-out on pegs, against a dark wall: a face of x0..x1, y0..y1 at depth c, facing n */
K.bottles = (B, axis, c, n, a0, a1, y0, y1, o) => {
  o = o || {}; const rnd = BM.mulberry32(Math.floor(c * 91 + a0 * 13)), cols = ['hBottleGreen', 'hBottleRed', 'hBottleAmber', 'hBottleGreen', 'hBottleClear'], dx = o.dx || 0.095, dy = o.dy || 0.11;
  for (let y = y0 + dy / 2; y < y1; y += dy) for (let a = a0 + dx / 2; a < a1; a += dx) {
    if (rnd() < (o.gaps || 0.06)) continue;
    const col = cols[Math.floor(rnd() * cols.length)], x = axis === 'x' ? a : c + n * 0.15, z = axis === 'x' ? c + n * 0.15 : a;
    // the bottle points out of the wall: a body, a neck, a foil cap
    const b = B.mesh(G.cyl, col, x, y, z, 0.075, 0.22, 0.075); b.rotation.set(axis === 'x' ? Math.PI / 2 : 0, 0, axis === 'x' ? 0 : Math.PI / 2); b.updateMatrix();
    const nx = axis === 'x' ? x : x + n * 0.15, nz = axis === 'x' ? z + n * 0.15 : z;
    const k = B.mesh(G.cyl, col, nx, y, nz, 0.03, 0.09, 0.03); k.rotation.copy(b.rotation); k.updateMatrix();
    const cap = B.mesh(G.cyl, rnd() < 0.5 ? 'hFoil' : 'hBottleRed', axis === 'x' ? x : x + n * 0.2, y, axis === 'x' ? z + n * 0.2 : z, 0.032, 0.02, 0.032); cap.rotation.copy(b.rotation); cap.updateMatrix();
  }
  // the brushed-steel pegs as rails along each row
  for (let y = y0 + dy / 2; y < y1; y += dy) { if (axis === 'x') B.boxE('hChrome', a0, a1, y - 0.045, y - 0.04, c + n * 0.02, c + n * 0.12); else B.boxE('hChrome', c + Math.min(0.02 * n, 0.12 * n), c + Math.max(0.02 * n, 0.12 * n), y - 0.045, y - 0.04, a0, a1); }
};
/* Clothes on a rail: a run of jackets, shirts and dresses in a closet */
K.clothes = (B, axis, c, a0, a1, y, n, o) => {
  o = o || {}; const rnd = BM.mulberry32(Math.floor(c * 17 + a0 * 29 + y * 5)), cols = o.cols || ['hFabricCharcoal', 'hFabricWhite', 'hFabricBlue', 'hFabricSand', 'hFabricStone', 'hFabricOlive', 'hFabricRust'];
  if (axis === 'x') B.box('hBrass', (a0 + a1) / 2, y, c, a1 - a0, 0.02, 0.02); else B.box('hBrass', c, y, (a0 + a1) / 2, 0.02, 0.02, a1 - a0);
  for (let a = a0 + 0.05; a < a1 - 0.03; a += 0.05 + rnd() * 0.04) {
    const L = (o.long ? 1.2 : 0.7) + rnd() * 0.25, m = cols[Math.floor(rnd() * cols.length)];
    if (axis === 'x') B.box(m, a, y - 0.04 - L / 2, c, 0.025, L, 0.48); else B.box(m, c, y - 0.04 - L / 2, a, 0.48, L, 0.025);
  }
};
/* A floating stone vanity with its shadow gap lit, two basins, wall taps, two backlit mirrors */
K.vanity = (B, x, z, y0, w, ry, o) => {
  o = o || {}; const f = frame(B, x, z, y0, ry), d = 0.55, lamps = [];
  f.box(o.wood || 'hOak', 0, 0.6, -0.02, w, 0.42, d - 0.04);                 // the cabinet, floating
  for (let i = 1; i < 4; i++) f.box('hBlackSteel', -w / 2 + i * w / 4, 0.6, d / 2 - 0.035, 0.004, 0.38, 0.004);
  f.box(o.top || 'hMarble', 0, 0.83, 0, w + 0.02, 0.04, d);
  for (const s of [-1, 1]) {
    const bx = s * 0.45;
    f.mesh(G.cyl, 'hCeramic', bx, 0.9, 0.02, 0.46, 0.12, 0.36); f.mesh(G.cyl, 'hSoapstone', bx, 0.962, 0.02, 0.4, 0.004, 0.3);
    f.box('hBrass', bx, 1.08, -d / 2 + 0.1, 0.02, 0.02, 0.2); f.mesh(G.cyl, 'hBrass', bx - 0.12, 1.12, -d / 2 + 0.02, 0.04, 0.04, 0.04); f.mesh(G.cyl, 'hBrass', bx + 0.12, 1.12, -d / 2 + 0.02, 0.04, 0.04, 0.04);
    f.box('hMirror', bx, 1.75, -d / 2 + 0.03, 0.7, 0.95, 0.02);
    lamps.push([f.at(bx, -d / 2 + 0.05), y0 + 1.75]);
  }
  f.collide(w, d, 0.9, 'vanity');
  return lamps;
};
/* A pool table: walnut, blue cloth, six pockets, rails, a rack of balls */
K.poolTable = (B, x, z, y0, ry) => {
  const f = frame(B, x, z, y0, ry), L = 2.9, W = 1.63;
  for (const [lx, lz] of [[-1.25, -0.6], [1.25, -0.6], [-1.25, 0.6], [1.25, 0.6]]) f.box('hWalnut', lx, 0.3, lz, 0.18, 0.6, 0.18);
  f.box('hWalnut', 0, 0.68, 0, L - 0.1, 0.18, W - 0.1);
  f.box('hCloth', 0, 0.78, 0, 2.54, 0.02, 1.27);
  for (const s of [-1, 1]) { f.box('hWalnut', 0, 0.8, s * (W / 2 - 0.09), L, 0.06, 0.18); f.box('hWalnut', s * (L / 2 - 0.09), 0.8, 0, 0.18, 0.06, W); f.box('hCloth', 0, 0.8, s * 0.65, 2.5, 0.04, 0.04); f.box('hCloth', s * 1.29, 0.8, 0, 0.04, 0.04, 1.22); }
  for (const [lx, lz] of [[-1.29, -0.65], [0, -0.66], [1.29, -0.65], [-1.29, 0.65], [0, 0.66], [1.29, 0.65]]) f.mesh(G.cyl, 'hBlackSteel', lx, 0.8, lz, 0.12, 0.065, 0.12);
  const balls = [0xffffff, 0xf0c020, 0x2040c0, 0xd02020, 0x6020a0, 0xff7010, 0x208030, 0x801010, 0x101010, 0xf0c020, 0x2040c0, 0xd02020, 0x6020a0, 0xff7010, 0x208030, 0x801010];
  let i = 0; for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) { const c = balls[1 + (i++ % 15)]; f.mesh(G.sphere, BM.Ball ? BM.Ball(c) : new THREE.MeshPhongMaterial({ color: c, shininess: 120 }), 0.6 + r * 0.05, 0.818, (k - r / 2) * 0.058, 0.057, 0.057, 0.057); }
  f.mesh(G.sphere, BM.Ball ? BM.Ball(0xffffff) : new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 120 }), -0.7, 0.818, 0, 0.057, 0.057, 0.057);
  { const cue = f.box('hOak', 0.1, 0.83, 0.3, 1.45, 0.025, 0.025); }
  f.collide(L, W, 0.85, 'pool table');
};
const BALLS = {}; BM.Ball = c => BALLS[c] || (BALLS[c] = new THREE.MeshPhongMaterial({ color: c, shininess: 120, specular: 0x888888 }));
/* A low credenza: walnut, fluted doors, on a black plinth */
K.credenza = (B, x, z, y0, w, ry, o) => { o = o || {}; const f = frame(B, x, z, y0, ry); f.box('hBlackSteel', 0, 0.06, 0, w - 0.1, 0.12, 0.4); f.box(o.mat || 'hWalnut', 0, 0.42, 0, w, 0.6, 0.46); f.box('hFluted', 0, 0.42, 0.232, w - 0.04, 0.56, 0.004); f.box(o.top || 'hTravertine', 0, 0.735, 0, w + 0.02, 0.03, 0.48); f.collide(w, 0.46, 0.75, 'credenza'); };
K.sideTable = (B, x, z, y0, o) => { o = o || {}; B.mesh(G.cyl, o.mat || 'hTravertine', x, y0 + 0.5, z, 0.5, 0.04, 0.5); B.mesh(G.cyl, o.base || 'hBronze', x, y0 + 0.24, z, 0.12, 0.48, 0.12); B.mesh(G.cyl, o.base || 'hBronze', x, y0 + 0.01, z, 0.36, 0.02, 0.36); };
})();
