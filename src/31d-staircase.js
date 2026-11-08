/* ==========================================================================
   BLACKTHORN MANOR — 3d. THE GRAND STAIRCASE
   The two curved flights in the hall, built as a joiner would: polished
   treads with rounded nosings over painted risers, a carpet runner held
   down by brass stair rods, a moulded string along each edge over a
   panelled curved spandrel, turned balusters on both sides carrying a
   handrail that sweeps up the curve in one piece, and turned newel posts
   with finials at the foot.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const V2 = (x, y) => new THREE.Vector2(x, y);
const cache = {};
const geo = (k, f) => { if (!cache[k]) { cache[k] = f(); cache[k].userData.canonical = 'stair:' + k; } return cache[k]; };

/* A solid in polar coordinates round (cx, cz): angle a0..a1, radius r0..r1, height lo(a)..hi(a).
   Appended as triangles (faces turned outwards) to arrays pos. */
function polarPrism(pos, cx, cz, a0, a1, r0, r1, lo, hi, segs) {
  if (a1 < a0) { const t = a0; a0 = a1; a1 = t; }
  const L = typeof lo === 'function' ? lo : () => lo, H = typeof hi === 'function' ? hi : () => hi;
  const P = (a, r, y) => [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r];
  const quad = (p, q, r, s, centre) => {
    // two triangles p q r, p r s; flip if the normal points at the centre
    const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = (p[0] + r[0]) / 2 - centre[0], my = (p[1] + r[1]) / 2 - centre[1], mz = (p[2] + r[2]) / 2 - centre[2];
    if (nx * mx + ny * my + nz * mz < 0) { pos.push(...p, ...s, ...r, ...p, ...r, ...q); } else { pos.push(...p, ...q, ...r, ...p, ...r, ...s); }
  };
  for (let k = 0; k < segs; k++) {
    const b0 = a0 + (a1 - a0) * k / segs, b1 = a0 + (a1 - a0) * (k + 1) / segs, bm = (b0 + b1) / 2;
    const l0 = L(b0), l1 = L(b1), h0 = H(b0), h1 = H(b1);
    const c = P(bm, (r0 + r1) / 2, (L(bm) + H(bm)) / 2);
    quad(P(b0, r0, h0), P(b1, r0, h1), P(b1, r1, h1), P(b0, r1, h0), c);   // top
    quad(P(b0, r0, l0), P(b1, r0, l1), P(b1, r1, l1), P(b0, r1, l0), c);   // underside
    quad(P(b0, r1, l0), P(b1, r1, l1), P(b1, r1, h1), P(b0, r1, h0), c);   // outer face
    quad(P(b0, r0, l0), P(b1, r0, l1), P(b1, r0, h1), P(b0, r0, h0), c);   // inner face
    if (k === 0) quad(P(b0, r0, l0), P(b0, r1, l0), P(b0, r1, h0), P(b0, r0, h0), c);
    if (k === segs - 1) quad(P(b1, r0, l1), P(b1, r1, l1), P(b1, r1, h1), P(b1, r0, h1), c);
  }
}
function finish(pos) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

/* One flight: side +1 rises clockwise from the front of the hall to the balcony, side -1 mirrors it. */
BM.buildGrandStair = function (B, SC, rise, steps) {
  const { cx, cz, r0, r1 } = SC, A0 = 0.5, A1 = Math.PI, N = steps, step = rise / N;
  const angle = (side, t) => side * (A0 + (A1 - A0) * t);
  const ins = 0.07;                                     // balusters stand this far in from each edge
  const railY = t => rise * t + step + 0.92;            // the rail follows the line of the nosings
  const balGeo = geo('baluster', () => { const pts = [[0.001, 0], [0.035, 0], [0.035, 0.06], [0.022, 0.1], [0.03, 0.2], [0.018, 0.45], [0.016, 0.62], [0.026, 0.7], [0.016, 0.78], [0.02, 0.94], [0.03, 0.96], [0.03, 1.0], [0.001, 1.0]]; const g = new THREE.LatheGeometry(pts.map(p => V2(p[0], p[1])), 10); g.computeVertexNormals(); return g; });
  const newelGeo = geo('newel', () => { const pts = [[0.001, 0], [0.11, 0], [0.11, 0.08], [0.085, 0.12], [0.085, 0.82], [0.1, 0.86], [0.1, 0.92], [0.065, 0.96], [0.05, 1.02], [0.075, 1.08], [0.075, 1.12], [0.04, 1.16], [0.07, 1.22], [0.075, 1.28], [0.06, 1.34], [0.02, 1.38], [0.001, 1.39]]; const g = new THREE.LatheGeometry(pts.map(p => V2(p[0], p[1])), 16); g.computeVertexNormals(); return g; });
  for (const side of [1, -1]) {
    const tag = side > 0 ? 'R' : 'L';
    // the treads, nosings and risers: each step a solid of polished wood over a white-painted riser
    B.mesh(geo('treads' + tag, () => { const p = [];
      for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, top = step * (i + 1), da = side * 0.035 / ((r0 + r1) / 2);
        polarPrism(p, cx, cz, angle(side, t0) - da, angle(side, t1), r0 - 0.02, r1 + 0.02, top - 0.045, top, 4); }
      return finish(p); }), 'darkWood', 0, 0, 0, 1, 1, 1);
    B.mesh(geo('risers' + tag, () => { const p = [];
      for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, top = step * (i + 1);
        polarPrism(p, cx, cz, angle(side, t0), angle(side, t1), r0, r1, Math.max(0, top - step - 0.01), top - 0.045, 4); }
      return finish(p); }), 'paintedWood', 0, 0, 0, 1, 1, 1);
    // the runner, over tread and riser, and the brass rod at the back of each tread
    B.mesh(geo('runner' + tag, () => { const p = [], a = r0 + 0.32, b = r1 - 0.32;
      for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, top = step * (i + 1), da = side * 0.04 / ((r0 + r1) / 2);
        polarPrism(p, cx, cz, angle(side, t0) - da, angle(side, t1), a, b, top, top + 0.012, 4);
        polarPrism(p, cx, cz, angle(side, t0) - da, angle(side, t0) - da - side * 0.012 / ((r0 + r1) / 2), a, b, top - step, top + 0.012, 1); }
      return finish(p); }), 'carpet', 0, 0, 0, 1, 1, 1);
    for (let i = 1; i < N; i++) {
      const a = angle(side, i / N), top = step * i, rm = (r0 + r1) / 2;
      const rod = B.mesh(G.post, 'brass', cx + Math.sin(a) * rm, top + 0.02, cz + Math.cos(a) * rm, 0.018, r1 - r0 - 0.5, 0.018);
      rod.rotation.set(Math.PI / 2, a, 0, 'YXZ'); rod.updateMatrix();
    }
    // the curved sides: a panelled spandrel down to the floor, and a moulded string along the top of it
    const strTop = a => rise * ((Math.abs(a) - A0) / (A1 - A0)) + step + 0.06, strBot = a => Math.max(0, rise * ((Math.abs(a) - A0) / (A1 - A0)) - 0.25);
    B.mesh(geo('spandrel' + tag, () => { const p = [];
      polarPrism(p, cx, cz, angle(side, 0), angle(side, 1), r1 - 0.01, r1 + 0.01, 0, strBot, 64);
      polarPrism(p, cx, cz, angle(side, 0), angle(side, 1), r0 - 0.01, r0 + 0.01, 0, strBot, 64);
      return finish(p); }), 'panel', 0, 0, 0, 1, 1, 1);
    B.mesh(geo('strings' + tag, () => { const p = [];
      polarPrism(p, cx, cz, angle(side, 0), angle(side, 1), r1, r1 + 0.06, strBot, strTop, 64);
      polarPrism(p, cx, cz, angle(side, 0), angle(side, 1), r0 - 0.06, r0, strBot, strTop, 64);
      polarPrism(p, cx, cz, angle(side, 0), angle(side, 1), r1 + 0.04, r1 + 0.08, a => strTop(a) - 0.05, strTop, 64);   // the moulding
      polarPrism(p, cx, cz, angle(side, 0), angle(side, 1), r0 - 0.08, r0 - 0.04, a => strTop(a) - 0.05, strTop, 64);
      return finish(p); }), 'darkWood', 0, 0, 0, 1, 1, 1);
    // balusters, two to a tread on each side, and the handrails over them
    for (const r of [r0 + ins, r1 - ins]) {
      for (let i = 0; i < N; i++) for (const f of [0.28, 0.72]) {
        const t = (i + f) / N, a = angle(side, t), top = step * (i + 1), h = railY(t) - top - 0.02;
        if (i === 0 && f < 0.5) continue; // the newel stands there
        B.mesh(balGeo, 'darkWood', cx + Math.sin(a) * r, top, cz + Math.cos(a) * r, 1, h, 1);
      }
      const pts = []; for (let k = 0; k <= 48; k++) { const t = 0.02 + 0.98 * k / 48, a = angle(side, t); pts.push(new THREE.Vector3(cx + Math.sin(a) * r, railY(t), cz + Math.cos(a) * r)); }
      const rail = geo('rail' + tag + (r < (r0 + r1) / 2 ? 'i' : 'o'), () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.035, 8, false));
      B.mesh(rail, 'darkWood', 0, 0, 0, 1, 1, 1);
      // the newel at the foot
      const a = angle(side, 0.012);
      B.mesh(newelGeo, 'darkWood', cx + Math.sin(a) * r, 0, cz + Math.cos(a) * r, 1, 1, 1);
    }
  }
};
})();
