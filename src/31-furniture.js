/* ==========================================================================
   BLACKTHORN MANOR — 3b. FURNITURE AND PICTURES
   Every piece of furniture keeps its simple collision box, but is drawn as
   the thing it is: a table on four turned legs with an apron, a chair with
   a seat, legs, uprights and rails, a bed with a headboard, mattress and
   bedding, a wardrobe with doors and a cornice, chests with drawer fronts
   and knobs, bookcases full of books. Paintings are painted: a procedural
   landscape, portrait or still life under crazed varnish, in a gilt frame.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const B = BM.Builder.prototype;

/* ---- the pieces. Each gets (b, mat, cx, cz, y0, sx, sy, sz): the box it must fill. ---- */
const legs = (b, mat, cx, cz, y0, sx, sz, h, r, inset) => {
  for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.mesh(G.post, mat, cx + ex * (sx / 2 - inset), y0 + h / 2, cz + ez * (sz / 2 - inset), r, h, r);
};
const turned = (b, mat, x, y0, z, h, r) => {
  b.mesh(G.post, mat, x, y0 + h / 2, z, r, h, r);
  b.mesh(G.sphere, mat, x, y0 + h * 0.3, z, r * 1.7, r * 1.4, r * 1.7);
  b.mesh(G.sphere, mat, x, y0 + h * 0.62, z, r * 1.5, r * 1.2, r * 1.5);
};
const PIECES = {
  table(b, mat, cx, cz, y0, sx, sy, sz) {
    const top = 0.04, apron = Math.min(0.12, sy * 0.15);
    b.box(mat, cx, y0 + sy - top / 2, cz, sx, top, sz);
    b.box(mat, cx, y0 + sy - top - apron / 2, cz, sx - 0.16, apron, sz - 0.16);
    const r = Math.min(0.08, sx * 0.08);
    for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) turned(b, mat, cx + ex * (sx / 2 - 0.1), y0, cz + ez * (sz / 2 - 0.1), sy - top, r);
    if (sx > 3) for (const ex of [-1, 1]) turned(b, mat, cx + ex * sx / 6, y0, cz, sy - top, r); // a long table has six legs
  },
  desk(b, mat, cx, cz, y0, sx, sy, sz) {
    b.box(mat, cx, y0 + sy - 0.02, cz, sx, 0.04, sz);
    b.box('leather', cx, y0 + sy + 0.001, cz, sx * 0.7, 0.004, sz * 0.7);
    // pedestals of drawers either side of the kneehole
    const pw = Math.min(0.5, sx * 0.3);
    for (const ex of [-1, 1]) {
      const px = cx + ex * (sx / 2 - pw / 2);
      b.box(mat, px, y0 + (sy - 0.04) / 2, cz, pw, sy - 0.04, sz);
      for (let i = 0; i < 3; i++) { const y = y0 + 0.14 + i * (sy - 0.2) / 3; b.box('darkWood', px, y, cz + sz / 2 + 0.005, pw - 0.08, (sy - 0.2) / 3 - 0.04, 0.01); b.mesh(G.sphere, 'brass', px, y, cz + sz / 2 + 0.02, 0.018); }
    }
  },
  stand(b, mat, cx, cz, y0, sx, sy, sz) {
    b.box(mat, cx, y0 + sy - 0.02, cz, sx, 0.04, sz);
    b.mesh(G.post, mat, cx, y0 + sy / 2, cz, 0.06, sy - 0.04, 0.06);
    b.mesh(G.sphere, mat, cx, y0 + sy * 0.45, cz, 0.11, 0.09, 0.11);
    b.mesh(G.cyl, mat, cx, y0 + 0.02, cz, sx * 0.8, 0.04, sz * 0.8);
  },
  chair(b, mat, cx, cz, y0, sx, sy, sz, back) {
    const seatY = y0 + Math.min(0.46, sy * 0.48);
    b.box(mat, cx, seatY, cz, sx, 0.04, sz);
    b.box('fabricRed', cx, seatY + 0.04, cz, sx - 0.06, 0.05, sz - 0.06);
    legs(b, mat, cx, cz, y0, sx, sz, seatY - y0, 0.035, 0.04);
    // the back: two uprights and three rails, on the side away from the table
    const bx = back ? back[0] : 0, bz = back ? back[1] : -1;
    const ux = cx + bx * (sx / 2 - 0.03), uz = cz + bz * (sz / 2 - 0.03);
    const along = bx ? [0, 1] : [1, 0];
    for (const e of [-1, 1]) b.mesh(G.post, mat, ux + along[0] * e * (sx / 2 - 0.03), y0 + sy / 2, uz + along[1] * e * (sz / 2 - 0.03), 0.035, sy, 0.035);
    for (let i = 0; i < 3; i++) b.box(mat, ux, seatY + 0.14 + i * (sy - (seatY - y0) - 0.2) / 2, uz, along[0] ? sx - 0.06 : 0.025, 0.05, along[1] ? sz - 0.06 : 0.025);
  },
  stool(b, mat, cx, cz, y0, sx, sy, sz) {
    b.mesh(G.cyl, mat, cx, y0 + sy - 0.025, cz, sx, 0.05, sz);
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; b.mesh(G.post, mat, cx + Math.cos(a) * sx * 0.35, y0 + (sy - 0.05) / 2, cz + Math.sin(a) * sz * 0.35, 0.035, sy - 0.05, 0.035); }
  },
  seating(b, mat, cx, cz, y0, sx, sy, sz, kind) {
    const wide = sx >= sz, len = wide ? sx : sz, dep = wide ? sz : sx;
    const seatH = Math.min(0.42, sy * 0.47);
    // the frame, the seat cushions, the back, the arms, turned feet
    b.box(mat, cx, y0 + seatH / 2, cz, sx, seatH, sz);
    const nCush = Math.max(1, Math.round(len / 0.75));
    for (let i = 0; i < nCush; i++) {
      const u = (i + 0.5) / nCush - 0.5;
      b.box(mat, wide ? cx + u * len : cx, y0 + seatH + 0.06, wide ? cz : cz + u * len, wide ? len / nCush - 0.05 : dep - 0.1, 0.12, wide ? dep - 0.1 : len / nCush - 0.05);
    }
    if (kind !== 'chaise') {
      const bt = 0.16;
      b.box(mat, wide ? cx : cx - (sx / 2 - bt / 2), y0 + sy / 2 + seatH / 4, wide ? cz - (sz / 2 - bt / 2) : cz, wide ? sx : bt, sy - seatH / 2, wide ? bt : sz);
      for (const e of [-1, 1]) b.box(mat, wide ? cx + e * (sx / 2 - 0.08) : cx, y0 + seatH + 0.14, wide ? cz : cz + e * (sz / 2 - 0.08), wide ? 0.16 : sx, 0.28, wide ? sz : 0.16);
    } else {
      b.box(mat, cx - (sx / 2 - 0.12), y0 + seatH + 0.22, cz, 0.24, 0.44, sz); // one scrolled end
    }
    for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.mesh(G.sphere, 'darkWood', cx + ex * (sx / 2 - 0.1), y0 + 0.05, cz + ez * (sz / 2 - 0.1), 0.1, 0.1, 0.1);
  },
  bed(b, mat, cx, cz, y0, sx, sy, sz) {
    const frameH = Math.min(0.3, sy * 0.45);
    b.box('darkWood', cx, y0 + frameH / 2 + 0.1, cz, sx, frameH, sz);
    legs(b, 'darkWood', cx, cz, y0, sx, sz, 0.12, 0.05, 0.06);
    b.box('linen', cx, y0 + frameH + 0.1 + 0.09, cz, sx - 0.08, 0.18, sz - 0.08);               // mattress
    b.box('drape', cx, y0 + frameH + 0.1 + 0.19, cz + sz * 0.12, sx - 0.06, 0.05, sz * 0.72);     // the cover, turned back
    b.mesh(G.sphere, 'linen', cx, y0 + frameH + 0.1 + 0.24, cz - sz / 2 + 0.3, sx * 0.4, 0.12, 0.3); // pillow
    b.box('darkWood', cx, y0 + sy * 0.75, cz - sz / 2 + 0.04, sx, sy * 1.5, 0.08);               // headboard
  },
  cot(b, mat, cx, cz, y0, sx, sy, sz) {
    b.box(mat, cx, y0 + 0.4, cz, sx, 0.04, sz);
    b.box('linen', cx, y0 + 0.47, cz, sx - 0.1, 0.1, sz - 0.1);
    legs(b, mat, cx, cz, y0, sx, sz, sy, 0.035, 0.03);
    for (const side of [-1, 1]) for (let i = 0; i < Math.floor(sx / 0.12); i++) b.mesh(G.post, mat, cx - sx / 2 + 0.08 + i * 0.12, y0 + sy * 0.6, cz + side * (sz / 2 - 0.03), 0.015, sy * 0.8, 0.015);
    for (const side of [-1, 1]) b.box(mat, cx, y0 + sy - 0.02, cz + side * (sz / 2 - 0.03), sx, 0.04, 0.04);
  },
  cupboard(b, mat, cx, cz, y0, sx, sy, sz, front) {
    b.box(mat, cx, y0 + sy / 2, cz, sx, sy, sz);
    const fx = front[0], fz = front[1];
    const faceX = cx + fx * (sz / 2 + 0.006), faceZ = cz + fz * (sz / 2 + 0.006);
    // two doors with raised panels, a cornice and a plinth
    const w = fx ? sz : sx;
    for (const e of [-1, 1]) {
      const px = fx ? faceX : cx + e * w / 4, pz = fz ? faceZ : cz + e * w / 4;
      b.box('panel', fx ? cx + fx * (sx / 2 + 0.006) : px, y0 + sy * 0.55, fz ? pz : cz + e * w / 4 * 0 + (fx ? cz + e * w / 4 : 0) * 0 + (fx ? e * w / 4 : 0), fx ? 0.012 : w / 2 - 0.08, sy * 0.72, fz ? 0.012 : w / 2 - 0.08);
      b.mesh(G.sphere, 'brass', fx ? cx + fx * (sx / 2 + 0.02) : cx + e * 0.06, y0 + sy * 0.5, fz ? cz + fz * (sz / 2 + 0.02) : cz + e * 0.06 * 0 + (fx ? e * 0.06 : 0), 0.018);
    }
    b.box(mat, cx, y0 + sy + 0.03, cz, sx + 0.1, 0.06, sz + 0.1);
    b.box('darkWood', cx, y0 + 0.05, cz, sx + 0.04, 0.1, sz + 0.04);
  },
  drawers(b, mat, cx, cz, y0, sx, sy, sz, front) {
    b.box(mat, cx, y0 + sy / 2, cz, sx, sy, sz);
    const fx = front[0], fz = front[1], w = fx ? sz : sx;
    const n = Math.max(2, Math.round(sy / 0.26)), dh = (sy - 0.12) / n;
    for (let i = 0; i < n; i++) {
      const y = y0 + 0.08 + dh * (i + 0.5);
      b.box('darkWood', cx + fx * (sx / 2 + 0.006), y, cz + fz * (sz / 2 + 0.006), fx ? 0.012 : w - 0.1, dh - 0.03, fz ? 0.012 : w - 0.1);
      for (const e of [-1, 1]) b.mesh(G.sphere, 'brass', cx + fx * (sx / 2 + 0.02) + (fz ? e * w * 0.25 : 0), y, cz + fz * (sz / 2 + 0.02) + (fx ? e * w * 0.25 : 0), 0.016);
    }
    b.box(mat, cx, y0 + sy + 0.015, cz, sx + 0.04, 0.03, sz + 0.04);
  },
  bookcase(b, mat, cx, cz, y0, sx, sy, sz, front) {
    const fx = front[0], fz = front[1];
    b.box(mat, cx, y0 + sy / 2, cz, sx, sy, sz);
    const n = Math.max(3, Math.round(sy / 0.36)), sh = (sy - 0.08) / n, w = fx ? sz : sx, rnd = BM.mulberry32(Math.round(cx * 31 + cz * 17));
    const cols = ['fabricRed', 'fabricGreen', 'darkWood', 'leather', 'fabricCream', 'frame'];
    for (let i = 0; i < n; i++) {
      const y = y0 + 0.04 + sh * i;
      b.box('darkWood', cx + fx * 0.01, y + sh - 0.015, cz + fz * 0.01, fx ? sz * 0.9 : sx - 0.06, 0.03, fz ? sz * 0.9 : sz - 0.06);
      let u = -w / 2 + 0.06;
      while (u < w / 2 - 0.08) {
        const bw = 0.03 + rnd() * 0.04, bh = sh * (0.5 + rnd() * 0.4);
        if (rnd() < 0.08) { u += bw * 3; continue; } // a gap where a book was taken
        b.box(cols[Math.floor(rnd() * cols.length)], cx + fx * (sx * 0.15) + (fz ? u + bw / 2 : 0), y + bh / 2, cz + fz * (sz * 0.15) + (fx ? u + bw / 2 : 0), fx ? sx * 0.55 : bw, bh, fz ? sz * 0.55 : bw);
        u += bw + 0.004;
      }
    }
    b.box(mat, cx, y0 + sy + 0.03, cz, sx + 0.08, 0.06, sz + 0.08);
  },
  trunk(b, mat, cx, cz, y0, sx, sy, sz) {
    b.box(mat, cx, y0 + sy * 0.4, cz, sx, sy * 0.8, sz);
    b.mesh(G.cyl, mat, cx, y0 + sy * 0.8, cz, sz, sx, sz).rotation.z = Math.PI / 2;
    const lid = b.mesh(G.cyl, mat, cx, y0 + sy * 0.8, cz, sz * 0.98, sx, sz * 0.98); lid.rotation.z = Math.PI / 2; lid.updateMatrix();
    for (const e of [-1, 1]) b.box('iron', cx + e * sx * 0.3, y0 + sy * 0.4, cz, 0.04, sy * 0.82, sz + 0.02);
    b.box('brass', cx, y0 + sy * 0.55, cz + sz / 2 + 0.01, 0.1, 0.1, 0.02);
  },
  bath(b, mat, cx, cz, y0, sx, sy, sz) {
    b.mesh(G.sphere, 'porcelain', cx, y0 + sy * 0.55, cz, sx, sy * 0.9, sz);
    b.box('porcelain', cx, y0 + sy - 0.03, cz, sx, 0.06, sz);
    b.box('black', cx, y0 + sy + 0.001, cz, sx - 0.24, 0.002, sz - 0.24);
    for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.mesh(G.sphere, 'brass', cx + ex * (sx / 2 - 0.15), y0 + 0.08, cz + ez * (sz / 2 - 0.12), 0.1, 0.16, 0.1);
    b.mesh(G.post, 'brass', cx - sx / 2 + 0.15, y0 + sy + 0.12, cz, 0.02, 0.24, 0.02); b.box('brass', cx - sx / 2 + 0.15, y0 + sy + 0.24, cz, 0.04, 0.03, 0.16);
  },
  basin(b, mat, cx, cz, y0, sx, sy, sz) {
    b.mesh(G.post, 'porcelain', cx, y0 + sy * 0.42, cz, sx * 0.4, sy * 0.84, sz * 0.4);
    b.mesh(G.sphere, 'porcelain', cx, y0 + sy * 0.86, cz, sx, sy * 0.26, sz);
    b.box('porcelain', cx, y0 + sy - 0.01, cz, sx, 0.02, sz);
    for (const e of [-1, 1]) b.mesh(G.cyl, 'brass', cx + e * sx * 0.25, y0 + sy + 0.05, cz - sz * 0.3, 0.04, 0.1, 0.04);
  },
  panel(b, mat, cx, cz, y0, sx, sy, sz) {
    b.box(mat, cx, y0 + sy / 2, cz, sx, sy, sz);
    b.box('panel', cx, y0 + sy * 0.55, cz + sz / 2 + 0.006, sx - 0.2, sy * 0.6, 0.012);
    b.box(mat, cx, y0 + sy + 0.03, cz, sx + 0.06, 0.06, sz + 0.04);
  },
};

/* Which piece a name is. */
function pieceOf(name) {
  const n = (name || '').toLowerCase();
  if (/dining chair|^chair|kitchen chair|windsor/.test(n)) return 'chair';
  if (/stool/.test(n)) return 'stool';
  if (/sofa|settee|settle|armchair|reading chair|chaise/.test(n)) return 'seating';
  if (/narrow bed|^bed$|^bed /.test(n) || n === 'bed') return 'bed';
  if (/cot/.test(n)) return 'cot';
  if (/headboard/.test(n)) return 'panel';
  if (/wardrobe|press|cabinet|dresser|pantry shelves|linen shelves/.test(n)) return 'cupboard';
  if (/sideboard|chest of drawers|dressing table/.test(n)) return 'drawers';
  if (/bookcase|wine rack/.test(n)) return 'bookcase';
  if (/trunk|tea chest|hall chest/.test(n)) return 'trunk';
  if (/bath$/.test(n)) return 'bath';
  if (/basin/.test(n)) return 'basin';
  if (/desk/.test(n)) return 'desk';
  if (/stand$|side table|bedside|landing table|nursery table|shelf$/.test(n)) return 'stand';
  if (/table|bench|lectern/.test(n)) return 'table';
  return null;
}

/* The furniture call: the same collision box, a real piece on top of it. */
B.furniture = function (mat, cx, cz, y0, sx, sy, sz, name) {
  const w = this.phys.addWall(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, y0, y0 + sy, { kind: 'furniture', tag: name || 'furniture' });
  w.room = this.room;
  if (!mat) return w;
  const piece = pieceOf(name);
  // which way a case piece faces: away from the nearest wall
  let front = [0, 1];
  if (piece === 'cupboard' || piece === 'drawers' || piece === 'bookcase' || piece === 'chair') {
    let best = Infinity;
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const hit = this.phys.occluded(cx + nx * (sx / 2 + 0.05), y0 + 1.0, cz + nz * (sz / 2 + 0.05), cx + nx * (sx / 2 + 1.2), y0 + 1.0, cz + nz * (sz / 2 + 1.2));
      if (hit && hit.kind === 'wall') { const d = nx ? Math.abs((nx > 0 ? hit.x0 : hit.x1) - cx) : Math.abs((nz > 0 ? hit.z0 : hit.z1) - cz); if (d < best) { best = d; front = [-nx, -nz]; } }
    }
  }
  if (piece && PIECES[piece]) {
    if (piece === 'chair') {
      // a chair's back is away from the table it sits at
      const hit = ['x', 'z'].map(() => null);
      let back = front;
      const t = this.phys.furniture.find(f => f !== w && /table|desk/.test(f.tag) && Math.abs((f.x0 + f.x1) / 2 - cx) < 3 && Math.abs((f.z0 + f.z1) / 2 - cz) < 3);
      if (t) { const dx = (t.x0 + t.x1) / 2 - cx, dz = (t.z0 + t.z1) / 2 - cz; back = Math.abs(dx) > Math.abs(dz) ? [-Math.sign(dx), 0] : [0, -Math.sign(dz)]; }
      PIECES.chair(this, mat, cx, cz, y0, sx, sy, sz, back);
    } else if (piece === 'seating') PIECES.seating(this, mat, cx, cz, y0, sx, sy, sz, /chaise/.test(name) ? 'chaise' : 'sofa');
    else PIECES[piece](this, mat, cx, cz, y0, sx, sy, sz, front);
    return w;
  }
  const m = this.boxE(mat, cx - sx / 2, cx + sx / 2, y0, y0 + sy, cz - sz / 2, cz + sz / 2);
  m.userData.wall = w.id;
  return w;
};

/* ---- paintings: painted on a canvas, varnished, crazed, framed ---- */
const PAINT = {};
function painting(style, seed) {
  const key = style + ':' + seed;
  if (PAINT[key]) return PAINT[key];
  const c = document.createElement('canvas'); c.width = 256; c.height = 192;
  const g = c.getContext('2d'), rnd = BM.mulberry32(seed * 977 + 13), W = 256, H = 192;
  const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`;
  if (style === 'landscape' || style === 'house') {
    const sky = g.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, hsl(215 + rnd() * 20, 30, 40 + rnd() * 20)); sky.addColorStop(1, hsl(35 + rnd() * 20, 45, 70));
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(255,250,240,${0.15 + rnd() * 0.2})`; g.beginPath(); g.ellipse(rnd() * W, H * (0.1 + rnd() * 0.3), 40 + rnd() * 50, 10 + rnd() * 12, 0, 0, 7); g.fill(); }
    for (let k = 0; k < 3; k++) { g.fillStyle = hsl(200 - k * 30, 20 + k * 10, 55 - k * 14); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16) g.lineTo(x, H * (0.5 + k * 0.08) - Math.sin(x * 0.02 + k + rnd() * 0.3) * 18 - rnd() * 8); g.lineTo(W, H); g.fill(); }
    g.fillStyle = hsl(85, 30, 30); g.fillRect(0, H * 0.72, W, H * 0.28);
    if (style === 'house') { g.fillStyle = hsl(30, 15, 22); g.fillRect(W * 0.35, H * 0.42, W * 0.3, H * 0.3); g.beginPath(); g.moveTo(W * 0.33, H * 0.42); g.lineTo(W * 0.5, H * 0.28); g.lineTo(W * 0.67, H * 0.42); g.fill(); g.fillRect(W * 0.47, H * 0.2, W * 0.06, H * 0.25); }
    for (let i = 0; i < 6; i++) { const x = rnd() * W, y = H * (0.68 + rnd() * 0.1), s = 10 + rnd() * 22; g.fillStyle = hsl(100 + rnd() * 30, 25, 14 + rnd() * 10); g.beginPath(); g.ellipse(x, y - s, s * 0.6, s, 0, 0, 7); g.fill(); g.fillRect(x - 2, y - s * 0.4, 4, s * 0.5); }
    if (rnd() < 0.6) { g.fillStyle = hsl(205, 25, 50); g.beginPath(); g.ellipse(W * 0.5, H * 0.86, W * 0.3, H * 0.06, 0, 0, 7); g.fill(); }
  } else if (style === 'portrait') {
    g.fillStyle = hsl(25, 20, 12 + rnd() * 6); g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.42, skin = hsl(28, 35, 60 + rnd() * 15);
    g.fillStyle = hsl(rnd() < 0.5 ? 0 : 230, 25, 18); g.beginPath(); g.ellipse(cx, H * 0.95, W * 0.34, H * 0.45, 0, 0, 7); g.fill(); // the coat
    g.fillStyle = hsl(40, 20, 85); g.beginPath(); g.ellipse(cx, H * 0.68, W * 0.13, H * 0.09, 0, 0, 7); g.fill(); // lace
    g.fillStyle = skin; g.beginPath(); g.ellipse(cx, cy, W * 0.14, H * 0.2, 0, 0, 7); g.fill();
    g.fillStyle = hsl(20 + rnd() * 20, 30, 12 + rnd() * 25); g.beginPath(); g.ellipse(cx, cy - H * 0.14, W * 0.15, H * 0.1, 0, 0, 7); g.fill(); // hair
    g.fillStyle = hsl(30, 20, 20); for (const e of [-1, 1]) { g.beginPath(); g.ellipse(cx + e * W * 0.05, cy - H * 0.02, 5, 3, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(80,40,30,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 8, cy + H * 0.09); g.quadraticCurveTo(cx, cy + H * 0.11, cx + 8, cy + H * 0.09); g.stroke();
  } else {
    g.fillStyle = hsl(30, 25, 14); g.fillRect(0, 0, W, H);
    g.fillStyle = hsl(28, 30, 30); g.fillRect(0, H * 0.6, W, H * 0.4);
    g.fillStyle = hsl(40, 25, 70); g.beginPath(); g.ellipse(W * 0.5, H * 0.62, W * 0.38, H * 0.06, 0, 0, 7); g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = hsl([0, 40, 100, 280][Math.floor(rnd() * 4)], 50, 40 + rnd() * 15); g.beginPath(); g.arc(W * (0.25 + rnd() * 0.5), H * (0.52 + rnd() * 0.06), 10 + rnd() * 12, 0, 7); g.fill(); }
    g.fillStyle = hsl(200, 20, 55); g.fillRect(W * 0.62, H * 0.3, W * 0.14, H * 0.32); g.beginPath(); g.ellipse(W * 0.69, H * 0.3, W * 0.07, H * 0.03, 0, 0, 7); g.fill();
  }
  // varnish: a warm, dark, crazed skin over everything
  const v = g.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75); v.addColorStop(0, 'rgba(60,40,10,0.15)'); v.addColorStop(1, 'rgba(20,10,0,0.7)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.7;
  for (let i = 0; i < 70; i++) { let x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 16; y += (rnd() - 0.5) * 16; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.MeshPhongMaterial({ map: t, shininess: 60, specular: 0x333322 }); m.userData.unique = true;
  return PAINT[key] = m;
}
BM.painting = painting;

/* A framed picture on a wall: x,y,z its centre on the wall face, ry facing into the room. */
B.picture = function (x, y, z, ry, w, h, style, seed) {
  const s = Math.sin(ry), c = Math.cos(ry), fw = 0.09;
  // a moulded gilt frame: four bars, stepped
  for (const [u, v, bw, bh] of [[0, h / 2 + fw / 2, w + fw * 2, fw], [0, -h / 2 - fw / 2, w + fw * 2, fw], [-w / 2 - fw / 2, 0, fw, h], [w / 2 + fw / 2, 0, fw, h]]) {
    this.box('gilt', x + c * u + s * 0.04, y + v, z - s * u + c * 0.04, bw, bh, 0.08, ry);
    this.box('frame', x + c * u + s * 0.075, y + v, z - s * u + c * 0.075, bw * 0.96, bh * 0.5, 0.012, ry);
  }
  const canvas = this.mesh(G.plane, painting(style || 'landscape', seed || Math.round(x * 7 + y * 3 + z * 11)), x + s * 0.035, y, z + c * 0.035, w, h, 1, ry);
  canvas.userData.picture = true;
  (this.pictures || (this.pictures = [])).push({ x, y, z, ry, w: w + fw * 2, h: h + fw * 2, level: this.levelName, room: this.room });
  return canvas;
};
})();
