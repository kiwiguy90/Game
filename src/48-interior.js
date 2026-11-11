/* ==========================================================================
   BLACKTHORN MANOR — 6i. THE INTERIOR, FINISHED
   The house as a Victorian house really was: every room papered in its own
   paper in the tripartite scheme (dado, field, frieze), with skirting,
   dado and picture rails, a cornice and a ceiling rose; Minton tiles in
   the hall and parquet borders round the carpets; a real four-panel door
   in every doorway, left standing open and closable. The paper skins are
   laid on the inside faces of the existing walls, cut round every door
   and window.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* ---- wallpapers and finishes, drawn ---- */
const T = BM.TEX_EXTRA = BM.TEX_EXTRA || {};
const sp = (g, s, r, base, vary, n) => { g.fillStyle = base; g.fillRect(0, 0, s, s); for (let i = 0; i < n; i++) { const v = (r() - 0.5) * vary; g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; g.fillRect(r() * s, r() * s, 2, 2); } };
const leaf = (g, x, y, w, h, a, col) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, 7); g.fill(); g.restore(); };
T.flock = { size: 128, draw(g, s, r) { // deep red damask: a mirrored acanthus in a velvet nap
  sp(g, s, r, '#5a1216', 0.12, 1500);
  g.fillStyle = 'rgba(120,30,34,0.9)';
  for (const [cx, cy] of [[32, 32], [96, 96], [96, 32], [32, 96]]) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; leaf(g, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 11, 5, a, 'rgba(130,34,38,0.9)'); } g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); }
} };
T.damask = { size: 128, draw(g, s, r) { // sage green silk damask
  sp(g, s, r, '#8c9a7a', 0.08, 1200);
  for (const [cx, cy] of [[32, 32], [96, 96], [96, 32], [32, 96]]) { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; leaf(g, cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 12, 4, a, 'rgba(160,172,140,0.85)'); } g.fillStyle = 'rgba(120,135,105,0.9)'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); }
} };
T.trellis = { size: 128, draw(g, s, r) { // Morris Trellis: a square lattice with climbing roses on a bottle-green ground
  sp(g, s, r, '#2a4030', 0.08, 1200);
  g.strokeStyle = 'rgba(150,120,70,0.8)'; g.lineWidth = 5;
  for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(0, 32 + i * 64); g.lineTo(s, 32 + i * 64); g.stroke(); g.beginPath(); g.moveTo(32 + i * 64, 0); g.lineTo(32 + i * 64, s); g.stroke(); }
  for (let i = 0; i < 7; i++) { const x = r() * s, y = r() * s; for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(190,80,90,0.9)'; g.beginPath(); g.arc(x + (r() - 0.5) * 8, y + (r() - 0.5) * 8, 4, 0, 7); g.fill(); } leaf(g, x + 9, y + 4, 7, 3, 0.6, 'rgba(90,130,80,0.9)'); leaf(g, x - 9, y - 4, 7, 3, -0.6, 'rgba(90,130,80,0.9)'); }
} };
T.daisy = { size: 128, draw(g, s, r) { // Morris Daisy: little flowering clumps on a soft ground
  sp(g, s, r, '#c9b9a0', 0.07, 1200);
  for (const [cx, cy] of [[32, 40], [96, 104], [96, 40], [32, 104]]) {
    for (let k = -2; k <= 2; k++) leaf(g, cx + k * 5, cy + 10, 2.5, 9, k * 0.25, 'rgba(90,120,70,0.9)');
    for (const [dx, dy, col] of [[-10, -8, '#e8e0c8'], [0, -14, '#d86a6a'], [10, -8, '#e8e0c8']]) { g.fillStyle = col; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.ellipse(cx + dx + Math.cos(a) * 3.5, cy + dy + Math.sin(a) * 3.5, 2.5, 1.4, a, 0, 7); g.fill(); } g.fillStyle = '#c8a040'; g.beginPath(); g.arc(cx + dx, cy + dy, 1.8, 0, 7); g.fill(); }
  }
} };
T.willow = { size: 128, draw(g, s, r) { // Willow Bough: sweeping leafy stems on cream
  sp(g, s, r, '#d8d0b4', 0.06, 1000);
  for (let k = 0; k < 4; k++) { const x0 = k * 32 + 8; g.strokeStyle = 'rgba(110,130,80,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, 0); g.quadraticCurveTo(x0 + 18, 64, x0, 128); g.stroke();
    for (let i = 0; i < 9; i++) { const t = i / 9, x = x0 + 18 * 2 * t * (1 - t) * 1.0 + 4 * Math.sin(i), y = t * 128; leaf(g, x + 7, y, 7, 2.5, 0.9 + t, 'rgba(120,145,85,0.9)'); leaf(g, x - 7, y + 6, 7, 2.5, -0.9 - t, 'rgba(100,125,70,0.9)'); } }
} };
T.floral = { size: 128, draw(g, s, r) { // faded blue sprigs: a girl's bedroom
  sp(g, s, r, '#b7c2c6', 0.06, 1000);
  for (let i = 0; i < 14; i++) { const x = r() * s, y = r() * s; g.fillStyle = 'rgba(80,100,150,0.7)'; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; g.beginPath(); g.ellipse(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.6, 1.5, a, 0, 7); g.fill(); } leaf(g, x + 6, y + 5, 5, 2, 0.8, 'rgba(100,120,90,0.7)'); }
} };
T.lincrusta = { size: 64, draw(g, s, r) { // embossed dado, painted oxblood brown
  sp(g, s, r, '#4a2a1c', 0.12, 500);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (const [cx, cy] of [[16, 16], [48, 48], [48, 16], [16, 48]]) { g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,220,180,0.18)'; g.beginPath(); g.arc(cx - 1, cy - 1, 9, 3.4, 5.6); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.35)'; }
} };
T.anaglypta = { size: 64, draw(g, s, r) { sp(g, s, r, '#d8d0bc', 0.08, 500); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 16 + 8); for (let x = 0; x <= s; x += 4) g.lineTo(x, i * 16 + 8 + Math.sin(x / 5 + i) * 4); g.stroke(); } } };
T.frieze = { size: 128, draw(g, s, r) { sp(g, s, r, '#c8bc9c', 0.06, 600); g.fillStyle = 'rgba(120,90,50,0.5)'; for (let x = 0; x < s; x += 32) { for (let i = 0; i < 5; i++) { const a = i * Math.PI / 5 + Math.PI; leaf(g, x + 16 + Math.cos(a) * 10, 60 + Math.sin(a) * 10, 9, 3, a, 'rgba(110,80,45,0.55)'); } } g.fillRect(0, 20, s, 3); g.fillRect(0, 100, s, 3); } };
T.whitetile = { size: 64, draw(g, s, r) { g.fillStyle = '#9a9690'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 32) for (let x = 0; x < s; x += 32) { g.fillStyle = `rgb(${225 + r() * 20 | 0},${222 + r() * 18 | 0},${210 + r() * 15 | 0})`; g.fillRect(x + 1, y + 1, 30, 30); } g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 60; i++) g.fillRect(r() * s, r() * s, 3, 1); } };
T.minton = { size: 128, draw(g, s, r) { // encaustic geometric: buff, red, black, blue, white
  const cols = ['#b8925a', '#8a3a2a', '#262220', '#4a5a7a', '#d8d0b8'];
  for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 16) {
    const k = ((x / 16) + (y / 16)) % 4; g.fillStyle = cols[[0, 1, 0, 2][k]]; g.fillRect(x, y, 16, 16);
    g.fillStyle = cols[[4, 3, 4, 1][k]]; g.beginPath(); g.moveTo(x + 8, y); g.lineTo(x + 16, y + 8); g.lineTo(x + 8, y + 16); g.lineTo(x, y + 8); g.fill();
  }
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; for (let i = 0; i <= s; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(r() * s, r() * s, 2, 2); }
} };
T.parquet = { size: 128, draw(g, s, r) { // herringbone oak
  g.fillStyle = '#6a4a2c'; g.fillRect(0, 0, s, s);
  for (let i = -8; i < 16; i++) for (let k = 0; k < 2; k++) { const v = 120 + r() * 50; g.fillStyle = `rgb(${v + 30 | 0},${v | 0},${v * 0.55 | 0})`; g.save(); g.translate(i * 16 + k * 8, k * 8); g.rotate(k ? -Math.PI / 4 : Math.PI / 4); g.fillRect(0, 0, 40, 10); g.restore(); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 40; i++) g.fillRect(r() * s, r() * s, 1, 14);
} };
T.distemper = { size: 64, draw(g, s, r) { sp(g, s, r, '#d6cfbb', 0.1, 600); } };
T.oakpanel = { size: 128, draw(g, s, r) { sp(g, s, r, '#5a3a22', 0.1, 600); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeRect(6, 6, 52, 52); g.strokeRect(70, 6, 52, 52); g.strokeRect(6, 70, 52, 52); g.strokeRect(70, 70, 52, 52); g.strokeStyle = 'rgba(255,220,170,0.14)'; g.strokeRect(10, 10, 44, 44); g.strokeRect(74, 10, 44, 44); g.strokeRect(10, 74, 44, 44); g.strokeRect(74, 74, 44, 44); } };

Object.assign(BM.MAT_DEFS, {
  flock: [0xffffff, 'flock', 1.4, 3], damask: [0xffffff, 'damask', 1.3, 8], trellis: [0xffffff, 'trellis', 1.1, 3], daisy: [0xffffff, 'daisy', 1.3, 3],
  willow: [0xffffff, 'willow', 1.1, 3], floral: [0xffffff, 'floral', 1.5, 3], lincrusta: [0xffffff, 'lincrusta', 0.35, 14], anaglypta: [0xffffff, 'anaglypta', 0.35, 6],
  frieze: [0xffffff, 'frieze', 0.6, 3], whitetile: [0xffffff, 'whitetile', 0.3, 60], minton: [0xffffff, 'minton', 0.6, 20], parquet: [0xffffff, 'parquet', 0.5, 25],
  distemper: [0xffffff, 'distemper', 0.4, 2], oakpanel: [0xffffff, 'oakpanel', 0.7, 18, { bump: 2 }], libraryGreen: [0x5a6a4a, 'damask', 1.3, 5], galleryRed: [0x8a3a32, 'damask', 1.3, 6],
  cream: [0xd8d0bc, null, 0, 6], paintedWood: [0x8a8070, null, 0, 20],
});

/* ---- the rooms and their schemes ---- */
const SCHEMES = {
  dining:  { field: 'flock', dado: 'oakpanel', dadoH: 1.2, frieze: 'frieze', cornice: 0.22, rose: 0.9, skirt: 'darkWood', rails: 'darkWood', floor: 'parquet' },
  drawing: { field: 'damask', dado: 'lincrusta', dadoH: 0.95, frieze: 'frieze', cornice: 0.22, rose: 0.9, skirt: 'paintedWood', rails: 'paintedWood', floor: 'parquet' },
  library: { field: 'libraryGreen', dado: 'oakpanel', dadoH: 1.3, frieze: 'frieze', cornice: 0.18, rose: 0.7, skirt: 'darkWood', rails: 'darkWood', floor: 'parquet' },
  sitting: { field: 'willow', dado: 'lincrusta', dadoH: 0.95, frieze: 'frieze', cornice: 0.16, rose: 0.6, skirt: 'paintedWood', rails: 'paintedWood' },
  hall:    { field: null, dado: null, cornice: 0.2, rose: 0, skirt: 'darkWood', floor: 'minton' },
  service: { field: 'distemper', dado: 'lincrusta', dadoH: 1.2, frieze: null, cornice: 0.08, rose: 0, skirt: 'paintedWood', rails: 'paintedWood' },
  kitchen: { field: 'distemper', dado: 'whitetile', dadoH: 1.5, frieze: null, cornice: 0, rose: 0, skirt: null, rails: null },
  bathroom:{ field: 'distemper', dado: 'whitetile', dadoH: 1.5, frieze: null, cornice: 0, rose: 0, skirt: null, rails: null },
  bed1:    { field: 'trellis', dado: null, frieze: 'frieze', cornice: 0.13, rose: 0.55, skirt: 'paintedWood', rails: 'paintedWood' },
  bed2:    { field: 'daisy', dado: null, frieze: 'frieze', cornice: 0.13, rose: 0.55, skirt: 'paintedWood', rails: 'paintedWood' },
  eleanor: { field: 'willow', dado: null, frieze: 'frieze', cornice: 0.13, rose: 0.55, skirt: 'paintedWood', rails: 'paintedWood' },
  gallery: { field: 'galleryRed', dado: 'oakpanel', dadoH: 1.0, frieze: 'frieze', cornice: 0.16, rose: 0, skirt: 'darkWood', rails: 'darkWood' },
  eleanorBed: { field: 'floral', dado: null, frieze: null, cornice: 0.1, rose: 0.45, skirt: 'paintedWood', rails: 'paintedWood' },
  nursery: { field: 'distemper', dado: null, frieze: 'frieze', cornice: 0.1, rose: 0.45, skirt: 'paintedWood', rails: 'paintedWood' },
  landing: { field: 'anaglypta', dado: 'oakpanel', dadoH: 1.0, frieze: null, cornice: 0.14, rose: 0.55, skirt: 'darkWood', rails: 'darkWood' },
  corridorUp: { field: 'anaglypta', dado: 'lincrusta', dadoH: 1.0, frieze: null, cornice: 0.1, rose: 0, skirt: 'paintedWood', rails: 'paintedWood' },
};
const ROOMS = [
  ['hall', 'hall', -6, 6, 0, 12, 0, 7.98], ['dining', 'dining', -18, -6, 4, 12, 0, 3.98], ['drawing', 'drawing', 6, 18, 4, 12, 0, 3.98],
  ['library', 'library', 6, 18, -4, 4, 0, 3.98], ['back sitting', 'sitting', -18, -6, -4, 4, 0, 3.98], ['corridor', 'landing', -6, 6, -12, 0, 0, 3.98],
  ['kitchen', 'kitchen', -14, -6, -12, -4, 0, 3.98], ['pantry', 'service', -18, -14, -12, -4, 0, 3.98], ['bathroom', 'bathroom', 6, 10, -12, -4, 0, 3.98], ['service', 'service', 10, 18, -12, -4, 0, 3.98],
  ['bedroom1', 'bed1', -18, -6, 4, 12, 4.2, 7.98], ['bedroom2', 'bed2', 6, 18, 4, 12, 4.2, 7.98], ["eleanor's sitting room", 'eleanor', -18, -6, -4, 4, 4.2, 7.98],
  ['gallery', 'gallery', 6, 18, -4, 4, 4.2, 7.98], ['upper corridor', 'landing', -6, 6, -12, 0, 4.2, 7.98],
  ["eleanor's bedroom", 'eleanorBed', -18, -6, -12, -4, 4.2, 7.98], ['nursery', 'nursery', 6, 18, -12, -4, 4.2, 7.98],
];

/* Subtract a rectangle from a list of rectangles (in a 2-D [u0,u1]x[v0,v1] space). */
function cut(rects, h) {
  const out = [];
  for (const r of rects) {
    if (h.u1 <= r.u0 || h.u0 >= r.u1 || h.v1 <= r.v0 || h.v0 >= r.v1) { out.push(r); continue; }
    if (h.u0 > r.u0) out.push({ u0: r.u0, u1: h.u0, v0: r.v0, v1: r.v1 });
    if (h.u1 < r.u1) out.push({ u0: h.u1, u1: r.u1, v0: r.v0, v1: r.v1 });
    const m0 = Math.max(r.u0, h.u0), m1 = Math.min(r.u1, h.u1);
    if (h.v0 > r.v0) out.push({ u0: m0, u1: m1, v0: r.v0, v1: h.v0 });
    if (h.v1 < r.v1) out.push({ u0: m0, u1: m1, v0: h.v1, v1: r.v1 });
  }
  return out;
}

BM.ROOMS = ROOMS;
BM.roomOfPoint = function (x, y, z) { const r = ROOMS.find(q => x >= q[2] - 0.3 && x <= q[3] + 0.3 && z >= q[4] - 0.3 && z <= q[5] + 0.3 && y >= q[6] - 0.2 && y <= q[7]); return r ? r[0] : null; };

BM.buildInterior = function (B, game) {
  const P = B.phys;
  B.zone = 'mansion';
  // (only the openings on this floor: a door upstairs is not a hole in the wall downstairs)
  const doorsOn = (axis, c, a0, a1, f) => P.doorways.filter(d => Math.abs(d.y - f) < 0.5 && d.axis === axis && Math.abs((axis === 'x' ? d.z : d.x) - c) < 0.35 && (axis === 'x' ? d.x : d.z) > a0 - 0.1 && (axis === 'x' ? d.x : d.z) < a1 + 0.1);
  const windowsOn = (axis, c, a0, a1, f) => B.windows.filter(w => w.sill > f - 0.1 && w.sill < f + 3.6 && (axis === 'x' ? w.nz !== 0 : w.nx !== 0) && Math.abs((axis === 'x' ? w.z : w.x) - c) < 0.35 && (axis === 'x' ? w.x : w.z) > a0 - 0.1 && (axis === 'x' ? w.x : w.z) < a1 + 0.1);

  for (const [room, schemeName, x0, x1, z0, z1, f, c] of ROOMS) {
    const S = SCHEMES[schemeName];
    B.levelName = f > 4 ? 'upper' : 'ground'; B.room = room;
    // the four sides: each a wall line and an inward normal
    const sides = [
      { axis: 'x', c: z0, a0: x0, a1: x1, inward: 1 }, { axis: 'x', c: z1, a0: x0, a1: x1, inward: -1 },
      { axis: 'z', c: x0, a0: z0, a1: z1, inward: 1 }, { axis: 'z', c: x1, a0: z0, a1: z1, inward: -1 },
    ];
    for (const sd of sides) {
      // where the wall's face is (the wall sits on the line, its thickness either side)
      const probe = P.occluded(sd.axis === 'x' ? (sd.a0 + sd.a1) / 2 : sd.c + sd.inward * 0.6, f + 1.0, sd.axis === 'x' ? sd.c + sd.inward * 0.6 : (sd.a0 + sd.a1) / 2, sd.axis === 'x' ? (sd.a0 + sd.a1) / 2 : sd.c - sd.inward * 0.3, f + 1.0, sd.axis === 'x' ? sd.c - sd.inward * 0.3 : (sd.a0 + sd.a1) / 2);
      let face = sd.c + sd.inward * 0.1;
      if (probe && probe.x0 !== undefined) face = sd.axis === 'x' ? (sd.inward > 0 ? probe.z1 : probe.z0) : (sd.inward > 0 ? probe.x1 : probe.x0);
      const lay = (mat, rects, thick, extra) => {
        for (const r of rects) {
          if (r.u1 - r.u0 < 0.02 || r.v1 - r.v0 < 0.02) continue;
          const off = extra || 0;
          if (sd.axis === 'x') B.boxE(mat, r.u0, r.u1, r.v0, r.v1, Math.min(face + off * sd.inward, face + (off + thick) * sd.inward), Math.max(face + off * sd.inward, face + (off + thick) * sd.inward));
          else B.boxE(mat, Math.min(face + off * sd.inward, face + (off + thick) * sd.inward), Math.max(face + off * sd.inward, face + (off + thick) * sd.inward), r.v0, r.v1, r.u0, r.u1);
        }
      };
      // the holes: doorways (full height to their head) and windows (sill to head, plus the shutter boxes)
      let holes = [];
      for (const d of doorsOn(sd.axis, sd.c, sd.a0, sd.a1, f)) { const u = sd.axis === 'x' ? d.x : d.z; holes.push({ u0: u - d.width / 2 - 0.09, u1: u + d.width / 2 + 0.09, v0: f, v1: f + 2.42 }); }
      for (const w of windowsOn(sd.axis, sd.c, sd.a0, sd.a1, f)) { const u = sd.axis === 'x' ? w.x : w.z; holes.push({ u0: u - w.w / 2 - 0.36, u1: u + w.w / 2 + 0.36, v0: w.sill - 0.1, v1: w.head + 0.06 }); }
      // the shutter boxes beside each window: painted panelled reveals where the folding shutters live
      for (const w of windowsOn(sd.axis, sd.c, sd.a0, sd.a1, f)) {
        const u = sd.axis === 'x' ? w.x : w.z, v0 = w.sill - 0.1, v1 = w.head + 0.06, vm = (v0 + v1) * 0.5;
        for (const [a, bb] of [[u - w.w / 2 - 0.36, u - w.w / 2 - 0.01], [u + w.w / 2 + 0.01, u + w.w / 2 + 0.36]]) {
          lay('paintedWood', [{ u0: a, u1: bb, v0, v1 }], 0.035);
          lay('paintedWood', [{ u0: a + 0.06, u1: bb - 0.06, v0: v0 + 0.08, v1: vm - 0.04 }, { u0: a + 0.06, u1: bb - 0.06, v0: vm + 0.04, v1: v1 - 0.08 }], 0.012, 0.035);
        }
      }
      const band = (v0, v1) => { let r = [{ u0: sd.a0 + 0.02, u1: sd.a1 - 0.02, v0, v1 }]; for (const h of holes) r = cut(r, h); return r; };
      const skirtH = f > 4 ? 0.2 : 0.26, dadoH = S.dado ? S.dadoH : 0, friezeH = S.frieze ? 0.45 : 0, cornice = S.cornice || 0;
      // paper: field (and frieze), the dado below the rail, the skirting
      if (S.field) lay(S.field, band(f + (dadoH ? dadoH : skirtH), c - friezeH - cornice), 0.008);
      if (S.frieze) lay(S.frieze, band(c - friezeH - cornice, c - cornice), 0.008);
      if (S.dado) lay(S.dado, band(f + skirtH * (S.skirt ? 1 : 0), f + dadoH), 0.012);
      if (S.skirt) { lay(S.skirt, band(f, f + skirtH), 0.03); lay(S.skirt, band(f + skirtH - 0.03, f + skirtH), 0.045); }
      if (S.rails && dadoH) lay(S.rails, band(f + dadoH, f + dadoH + 0.06), 0.03);
      if (S.rails && friezeH) lay(S.rails, band(c - friezeH - cornice - 0.04, c - friezeH - cornice), 0.025);
      if (cornice) { lay('cream', band(c - cornice, c), cornice * 0.6); lay('cream', band(c - cornice * 0.5, c), cornice); }
    }
    // the ceiling rose at the room's pendant
    if (S.rose) {
      const l = game.grid.lights.find(l => l.room === room && (l.style === 'chandelier' || l.style === 'pendant') && l.pos.y > f && l.pos.y < c);
      if (l) { B.mesh(G.disc, 'cream', l.pos.x, c - 0.015, l.pos.z, S.rose).rotation.x = Math.PI / 2; B.mesh(G.disc, 'anaglypta', l.pos.x, c - 0.03, l.pos.z, S.rose * 0.7).rotation.x = Math.PI / 2; B.mesh(G.disc, 'cream', l.pos.x, c - 0.045, l.pos.z, S.rose * 0.35).rotation.x = Math.PI / 2; }
    }
    // floors: Minton tiles in the hall; a parquet border round the carpet in the reception rooms
    if (S.floor === 'minton') B.boxE('minton', x0 + 0.1, x1 - 0.1, f + 0.012, f + 0.022, z0 + 0.1, z1 - 0.1);
    if (S.floor === 'parquet') {
      B.boxE('parquet', x0 + 0.1, x1 - 0.1, f + 0.008, f + 0.016, z0 + 0.1, z0 + 0.6); B.boxE('parquet', x0 + 0.1, x1 - 0.1, f + 0.008, f + 0.016, z1 - 0.6, z1 - 0.1);
      B.boxE('parquet', x0 + 0.1, x0 + 0.6, f + 0.008, f + 0.016, z0 + 0.1, z1 - 0.1); B.boxE('parquet', x1 - 0.6, x1 - 0.1, f + 0.008, f + 0.016, z0 + 0.1, z1 - 0.1);
    }
  }

  /* ---- real doors in every interior doorway, standing open ---- */
  const clear = (axis, hx, hz, dir, len, swing, y0) => {
    // the open leaf lies along the wall from the hinge: nothing may stand in its way
    const ex = axis === 'x' ? hx + dir * len : hx + swing * 0.15, ez = axis === 'x' ? hz + swing * 0.15 : hz + dir * len;
    const minx = Math.min(hx, ex) - 0.25, maxx = Math.max(hx, ex) + 0.25, minz = Math.min(hz, ez) - 0.25, maxz = Math.max(hz, ez) + 0.25;
    for (const it of B.interactables) if (it.pos.x > minx && it.pos.x < maxx && it.pos.z > minz && it.pos.z < maxz && Math.abs(it.pos.y - y0 - 1.2) < 1.5) return false;
    for (const w of P.furniture) if (w.x1 > minx && w.x0 < maxx && w.z1 > minz && w.z0 < maxz && w.y1 > y0 + 0.1 && w.y0 < y0 + 2.1) return false;
    for (const l of game.grid.lights) if (l.pos.x > minx && l.pos.x < maxx && l.pos.z > minz && l.pos.z < maxz && Math.abs(l.pos.y - y0 - 1.2) < 1.2) return false;
    return true;
  };
  let made = 0;
  for (const d of P.doorways.slice()) {
    if (d.zone !== 'mansion' || /^front-doors$|^back-door$|^kitchen-door$|^yard-door$|^d-cellar-hatch$|^d-balcony-landing$|^arch/.test(d.id) || d.width > 1.6) continue;
    if (d.y < -1 || d.y > 7) continue; // the cellar's and the attic's stay as they are
    let built = null;
    for (const hinge of ['low', 'high']) for (const swing of [-1, 1]) {
      if (built) break;
      const along = d.axis === 'x' ? d.x : d.z, hs = hinge === 'low' ? -1 : 1;
      const h = along + hs * d.width / 2, dir = hs; // the leaf swings back against the wall beyond its hinge
      const hx = d.axis === 'x' ? h : d.x, hz = d.axis === 'x' ? d.z : h;
      if (!clear(d.axis, hx, hz, dir, d.width, swing, d.y)) continue;
      B.levelName = d.y > 4 ? 'upper' : 'ground'; B.room = d.room;
      const dark = /hall|dining|library|drawing|gallery|bal-/.test(d.id);
      built = B.hingedDoor({ id: 'door:' + d.id, axis: d.axis, at: along, c: d.axis === 'x' ? d.z : d.x, w: d.width, h: 2.2, y0: d.y, hinge, swing, mat: dark ? 'darkWood' : 'shutter', panelMat: dark ? 'panel' : 'boards', dur: 1.3, sound: 'creak', label: 'the door', wallT: d.thick, maxAngle: 1.62 });
      built.open = true; built.opened = true; built.t = 1; built.wall.enabled = false; built.angle(built.maxAngle);
      made++;
      break;
    }
  }
  game.interiorDoors = made;
  B.levelName = 'ground'; B.room = 'house';
};
})();
