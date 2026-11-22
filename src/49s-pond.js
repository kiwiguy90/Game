/* ==========================================================================
   BLACKTHORN MANOR — 6za. THE POND
   The old pond, made over the way a big estate pond is really done:
   - a naturalistic shore of weathered stones of all sizes, softened by
     marginal planting: reeds, yellow flag iris, bulrushes, ferns; lily pads
     with white and pink flowers lying on the water;
   - a rock cascade on the north-west bank, falling in two steps from a
     small upper pool, with foam where it lands;
   - a flagged viewing terrace on the south bank with a bench, under two
     lamp posts, off the walk to the folly;
   - koi turning slowly under the surface; mallards (green-headed drakes
     with their white collars and chestnut breasts, mottled brown hens)
     paddling about, now and then tipping up to feed;
   - layered lighting on the pond group, as pond designers advise: warm
     underwater lights that make the water glow, a spotlight on the cascade
     and a light at its foot, the willow and a red maple uplit from the
     ground, aimed away from where you stand, and lamps along the terrace.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const PD = { cx: 37, cz: 63, rx: 8.5, rz: 6.2, y: 0.07 };
BM.POND = PD;
const shore = (a, k) => { const w = 1 + 0.07 * Math.sin(a * 3 + 1.3) + 0.05 * Math.sin(a * 5 + 0.4); k = (k || 1) * w; return [PD.cx + Math.sin(a) * PD.rx * k, PD.cz + Math.cos(a) * PD.rz * k]; };
BM.inPond = (x, z, k) => { const a = Math.atan2(x - PD.cx, z - PD.cz), [sx, sz] = shore(a, k); return Math.hypot(x - PD.cx, z - PD.cz) < Math.hypot(sx - PD.cx, sz - PD.cz); };
const FALL = 5.55;                     // the angle round the shore of the cascade: north-west
const TERRACE = Math.PI;               // and of the terrace: due south

function glowTex() {
  if (glowTex.t) return glowTex.t;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (glowTex.t = new THREE.CanvasTexture(c));
}

BM.buildPond = function (B, game) {
  const P = B.phys;
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'pond';
  const rnd = BM.mulberry32(4242);
  const estate = o => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:pond' }, o)); game.estateLights.pond.push(l.id); return l; };
  const glows = [];
  const glow = (l, x, y, z, r, tint, k) => {
    const m = new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = B.mesh(G.disc, m, x, y, z, r * 2, r * 2, 1); mesh.rotation.x = -Math.PI / 2; mesh.updateMatrix(); mesh.userData.dynamic = true; mesh.renderOrder = 5;
    glows.push({ l, m, tint: new THREE.Color(tint), k: k || 0.6 });
  };

  /* ---- the water: a dark deep middle under a clearer margin ---- */
  const N = 72, pts = []; for (let i = 0; i < N; i++) pts.push(shore(i / N * Math.PI * 2));
  const flat = (k, key) => BM.statuaryGeo(key, () => {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(PD.cx + (x - PD.cx) * k, -(PD.cz + (z - PD.cz) * k))));
    const g = new THREE.ShapeGeometry(sh, 2); g.rotateX(-Math.PI / 2); return g; });
  B.mesh(flat(0.99, 'pondBed'), 'soil', 0, 0.03, 0, 1, 1, 1);
  const water = B.mesh(flat(1.0, 'pondWater'), 'water', 0, PD.y, 0, 1, 1, 1); water.userData.dynamic = true;
  B.mesh(flat(0.55, 'pondDeep'), BM.Basic(0x0a1418), 0, PD.y - 0.005, 0, 1, 1, 1);

  /* ---- the shore: stones of every size, the ring you cannot cross ---- */
  const per = []; let L = 0;
  for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N]; per.push([a, b, L]); L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const at = s => { s = ((s % L) + L) % L; for (const [a, b, l0] of per) { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s <= l0 + d) { const t = (s - l0) / d; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } } return pts[0]; };
  const angAt = (x, z) => Math.atan2(x - PD.cx, z - PD.cz);
  const nearAng = (a, b, w) => { let d = Math.abs(a - b) % (Math.PI * 2); if (d > Math.PI) d = Math.PI * 2 - d; return d < w; };
  let k = 0;
  for (let s = 0; s < L; s += 0.55, k++) {
    const [x, z] = at(s), a = angAt(x, z);
    // mostly small and flat, a few big ones; dark and wet, some green with moss
    const big = rnd() < 0.12, w = big ? 0.65 + rnd() * 0.35 : 0.28 + rnd() * 0.3, ox2 = (rnd() - 0.5) * 0.25;
    const st = B.mesh(G.lowSphere, k % 4 === 0 ? 'moss' : 'stone', x + ox2, 0.04 + w * 0.1, z - ox2, w, w * (0.3 + rnd() * 0.35), w * (0.6 + rnd() * 0.4)); st.rotation.y = rnd() * 3; st.updateMatrix();
    if (rnd() < 0.5) { const w2 = 0.2 + rnd() * 0.2, s2 = B.mesh(G.lowSphere, 'stone', x - ox2 * 2, 0.03, z + ox2 * 2, w2, w2 * 0.35, w2); s2.rotation.y = rnd() * 3; s2.updateMatrix(); }
    if (!nearAng(a, TERRACE, 0.28)) P.addWall(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 0, 0.9, { kind: 'wall', occludes: false, structural: false, tag: 'the pond\'s edge' });
    else P.addWall(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 0, 0.9, { kind: 'rail', occludes: false, tag: 'the pond\'s edge' });
    if (nearAng(a, TERRACE, 0.28) || nearAng(a, FALL, 0.3)) continue;
    // marginal planting in drifts: reeds, flag iris, bulrushes
    const kind = Math.floor((s / 3.3) % 3), ox = (x - PD.cx) / Math.hypot(x - PD.cx, z - PD.cz), oz = (z - PD.cz) / Math.hypot(x - PD.cx, z - PD.cz);
    if (k % 2) continue;
    const px = x - ox * 0.45, pz = z - oz * 0.45;
    if (kind === 0) for (let r = 0; r < 6; r++) B.mesh(G.cone, 'longGrass', px + (rnd() - 0.5) * 0.5, 0.75, pz + (rnd() - 0.5) * 0.5, 0.05, 1.5 + rnd() * 0.5, 0.05);
    else if (kind === 1) { for (let r = 0; r < 5; r++) { const l = B.mesh(G.cone, 'leaves', px + (rnd() - 0.5) * 0.4, 0.5, pz + (rnd() - 0.5) * 0.4, 0.09, 1.0, 0.03); l.rotation.y = rnd() * 3; l.updateMatrix(); }
      for (let r = 0; r < 3; r++) B.mesh(G.sphere, BM.Basic(0xd8b820), px + (rnd() - 0.5) * 0.4, 0.95 + rnd() * 0.15, pz + (rnd() - 0.5) * 0.4, 0.09, 0.07, 0.09); }
    else for (let r = 0; r < 4; r++) { const bx = px + (rnd() - 0.5) * 0.5, bz = pz + (rnd() - 0.5) * 0.5, h = 1.3 + rnd() * 0.4;
      B.mesh(G.post, 'longGrass', bx, h / 2, bz, 0.025, h, 0.025); B.mesh(G.cyl, 'bark', bx, h - 0.15, bz, 0.06, 0.24, 0.06); }
  }
  // lily pads, some in flower, in drifts on the open water
  const padMat = new THREE.MeshLambertMaterial({ color: 0x2c4a22 });
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, r = 0.3 + rnd() * 0.55, [x, z] = shore(a, r);
    if (Math.hypot(x - PD.cx, z - PD.cz) < 2.2 && rnd() < 0.7) continue;
    const s = 0.25 + rnd() * 0.25, pad = B.mesh(G.disc, padMat, x, PD.y + 0.008, z, s, s, 1); pad.rotation.set(-Math.PI / 2, 0, rnd() * 6); pad.updateMatrix();
    if (rnd() < 0.22) { const f = rnd() < 0.5 ? 'flowersWhite' : 'flowersRed'; B.mesh(G.cone, f, x, PD.y + 0.06, z, 0.12, 0.1, 0.12); B.mesh(G.sphere, BM.Basic(0xe8c020), x, PD.y + 0.08, z, 0.03, 0.03, 0.03); }
  }

  /* ---- the cascade: rocks stepping down from a small upper pool, water falling in two steps ---- */
  const [fx, fz] = shore(FALL, 1.12), [ix, iz] = shore(FALL, 0.86), dir = Math.atan2(ix - fx, iz - fz);
  const along = (d, side) => [fx + Math.sin(dir) * d + Math.cos(dir) * side, fz + Math.cos(dir) * d - Math.sin(dir) * side];
  // a back rock holding the upper pool, a step stone half way, and rocks either side of the falls (never in front of them)
  for (const [d, side, w, h] of [[-2.0, 0, 2.2, 1.95], [-1.8, -1.6, 1.5, 1.6], [-1.8, 1.6, 1.5, 1.4], [-0.3, 0, 0.75, 1.0], [-0.4, -1.0, 1.0, 1.2], [-0.4, 1.0, 0.95, 1.05], [0.4, -0.95, 0.8, 0.6], [0.4, 0.95, 0.75, 0.5]]) {
    const [x, z] = along(d, side); const r = B.mesh(G.lowSphere, side ? 'stone' : 'statueWorn', x, h * 0.48, z, w, h, w * 0.9); r.rotation.y = d + side; r.updateMatrix();
    P.addWall(x - w * 0.42, x + w * 0.42, z - w * 0.42, z + w * 0.42, 0, h, { kind: 'wall', occludes: false, structural: false, tag: 'cascade rocks' });
  }
  { const [ux, uz] = along(-2.0, 0); B.mesh(G.cyl, 'water', ux, 1.97, uz, 1.3, 0.04, 1.0).userData.dynamic = true; }
  const fallMat = BM.waterMaterial(); fallMat.uniforms.level.value = 1; fallMat.uniforms.speed.value = 2.6;
  const sheets = [];
  for (const [d0, d1, y0, y1, w] of [[-0.95, -0.62, 1.95, 1.0, 0.8], [0.06, 0.5, 1.0, PD.y + 0.02, 0.95]]) {
    const [x0, z0] = along(d0, 0), [x1, z1] = along(d1, 0), len = Math.hypot(Math.hypot(x1 - x0, z1 - z0), y1 - y0);
    const sh = new THREE.Mesh(G.plane, fallMat); sh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); sh.scale.set(w, len, 1);
    sh.rotation.set(-Math.atan2(Math.hypot(x1 - x0, z1 - z0), y0 - y1) + Math.PI / 2, dir, 0, 'YXZ'); sh.userData.dynamic = true; sh.renderOrder = 4; B.root.add(sh); sheets.push(sh);
  }
  const [bx, bz] = along(0.75, 0), foam = B.mesh(G.disc, new THREE.MeshBasicMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.55, depthWrite: false }), bx, PD.y + 0.02, bz, 1.4, 1.0, 1);
  foam.rotation.set(-Math.PI / 2, 0, dir); foam.updateMatrix(); foam.userData.dynamic = true;

  /* ---- the terrace on the south bank, with a bench and two lamps ---- */
  const [tx, tz] = shore(TERRACE, 1.2);
  B.boxE('limestone', tx - 3, tx + 3, 0.02, 0.06, tz - 1.6, tz + 0.6);
  for (let i = 0; i < 6; i++) B.boxE('gothicTrim', tx - 3 + i, tx - 3 + i + 0.02, 0.06, 0.065, tz - 1.6, tz + 0.6);
  B.furniture('wood', tx, tz - 0.9, 0, 1.8, 0.48, 0.5, 'garden bench');
  B.box('wood', tx, 0.8, tz - 1.16, 1.8, 0.5, 0.06);
  for (const s of [-1, 1]) {
    estate({ id: 'pond-terrace-' + (s < 0 ? 'w' : 'e'), name: 'Terrace lamp', kind: 'incandescent', style: 'street', pos: [tx + s * 2.6, 2.4, tz - 1.2], colour: 0xffc27a, target: 0.75, range: 8 });
    P.addWall(tx + s * 2.6 - 0.12, tx + s * 2.6 + 0.12, tz - 1.32, tz - 1.08, 0, 2.4, { kind: 'tree', occludes: false, tag: 'lamp post' });
  }

  /* ---- trees and shrubs round the water ---- */
  // a Japanese maple by the cascade, red even at night, uplit
  const [mx, mz] = along(-1.2, -3.0);
  B.mesh(G.cyl, 'bark', mx, 0.9, mz, 0.22, 1.8, 0.22);
  const mapleLeaf = new THREE.MeshLambertMaterial({ color: 0x8a2a18, emissive: 0x1a0402 });
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 0.7 + (i % 3) * 0.25; B.mesh(G.lowSphere, mapleLeaf, mx + Math.sin(a) * r, 1.9 + (i % 3) * 0.3, mz + Math.cos(a) * r, 1.0, 0.45, 1.0); }   // layered tiers of leaf
  B.mesh(G.lowSphere, mapleLeaf, mx, 2.55, mz, 1.3, 0.5, 1.3);
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4, br = B.mesh(G.post, 'bark', mx + Math.sin(a) * 0.35, 1.75, mz + Math.cos(a) * 0.35, 0.06, 0.9, 0.06); br.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6); br.updateMatrix(); }
  P.addWall(mx - 0.2, mx + 0.2, mz - 0.2, mz + 0.2, 0, 2, { kind: 'tree', tag: 'maple' });
  // clipped box and rounded shrubs in groups round the back of the pond
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + 0.2; if (nearAng(a, TERRACE, 0.55) || nearAng(a, FALL, 0.45) || nearAng(a, 0.75, 0.3) || nearAng(a, 4.71, 0.4)) continue;   // (not on the terrace, the cascade, under the willow, or where the walk arrives)
    const [x, z] = shore(a, 1.32), s = 0.8 + rnd() * 0.6;
    B.mesh(G.sphere, i % 3 ? 'hedge' : 'leavesDark', x, s * 0.45, z, s * 1.2, s * 0.9, s * 1.1);
    P.addWall(x - s * 0.45, x + s * 0.45, z - s * 0.45, z + s * 0.45, 0, s, { kind: 'hedge', tag: 'shrub' });
    if (i % 2) for (let f = 0; f < 3; f++) B.mesh(G.cone, 'leaves', x + (rnd() - 0.5) * 1.4, 0.3, z + (rnd() - 0.5) * 1.4, 0.4, 0.6, 0.4);   // ferns at their feet
  }

  /* ---- the lights ---- */
  const under = [];
  for (const [a, r] of [[0.7, 0.55], [2.2, 0.5], [3.9, 0.6], [5.0, 0.45]]) {
    const [x, z] = shore(a, r);
    const l = estate({ id: 'pond-under-' + under.length, name: 'Underwater light', kind: 'incandescent', style: 'none', pos: [x, PD.y + 0.25, z], colour: 0xffe0a0, target: 0.5, range: 5, corona: 0 });
    glow(l, x, PD.y + 0.012, z, 2.6, 0xffd890, 0.55); under.push(l);
  }
  { const [x, z] = along(0.8, 0.6), l = estate({ id: 'pond-fall-up', name: 'Cascade light', kind: 'incandescent', style: 'none', pos: [x, 0.4, z], spot: true, dir: [-Math.sin(dir), 0.8, -Math.cos(dir)], colour: 0xfff0d8, target: 0.9, range: 7, corona: 0 });
    glow(l, bx, PD.y + 0.015, bz, 1.4, 0xe8f4ff, 0.35); }
  { const [x, z] = along(2.6, -1.4), l = estate({ id: 'pond-fall-spot', name: 'Cascade spotlight', kind: 'incandescent', style: 'flood', pos: [x, 0.5, z], spot: true, dir: [-Math.sin(dir) * 0.8, 0.4, -Math.cos(dir) * 0.8], colour: 0xfff4e0, target: 0.9, range: 9 });
    void l; }
  { const l = estate({ id: 'pond-willow-up', name: 'Willow uplight', kind: 'incandescent', style: 'none', pos: [41.6, 0.3, 68.4], spot: true, dir: [0.25, 1, 0.3], colour: 0xe8ffd0, target: 0.9, range: 8, corona: 0 });
    B.box('metalDark', 41.6, 0.06, 68.4, 0.22, 0.12, 0.22); glow(l, 42.3, 0.03, 69.2, 2.2, 0xd8ffb0, 0.35); }
  { const l = estate({ id: 'pond-maple-up', name: 'Maple uplight', kind: 'incandescent', style: 'none', pos: [mx + 0.6, 0.3, mz + 0.6], spot: true, dir: [-0.3, 1, -0.3], colour: 0xffd8b0, target: 0.8, range: 6, corona: 0 });
    B.box('metalDark', mx + 0.6, 0.06, mz + 0.6, 0.22, 0.12, 0.22); }

  /* ---- koi under the surface ---- */
  const koi = [];
  const koiCol = [0xe86a1c, 0xf0f0e8, 0xd84020, 0xe8a030, 0xf0f0e8];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); B.root.add(g);
    B.mesh(G.sphere, BM.Basic(koiCol[i]), 0, 0, 0, 0.12, 0.06, 0.42, 0, g);
    if (i % 2) B.mesh(G.sphere, BM.Basic(0xd83018), 0, 0.012, -0.05, 0.08, 0.05, 0.16, 0, g);                      // a red saddle
    const tail = B.mesh(G.cone, BM.Basic(koiCol[i]), 0, 0, 0.25, 0.14, 0.14, 0.02, 0, g); tail.rotation.x = Math.PI / 2;
    g.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    koi.push({ g, tail, r: 0.25 + i * 0.07, w: 0.12 + i * 0.03, ph: i * 1.3 });
  }

  /* ---- mallards ---- */
  const drakeHead = new THREE.MeshPhongMaterial({ color: 0x0e4a24, specular: 0x3a8a50, shininess: 70 });
  const grey = new THREE.MeshLambertMaterial({ color: 0x9a9890 }), chestnut = new THREE.MeshLambertMaterial({ color: 0x5a2c18 });
  const hen = new THREE.MeshLambertMaterial({ color: 0x7a5a38 }), henDark = new THREE.MeshLambertMaterial({ color: 0x4a3420 });
  const billY = BM.Basic(0xc8b030), billO = BM.Basic(0xc87020), black = BM.Basic(0x141414), white = BM.Basic(0xe8e8e0), speculum = BM.Basic(0x2a3aa0);
  const ducks = [];
  for (let i = 0; i < 6; i++) {
    const drake = i % 3 !== 2, d = new THREE.Group(); B.root.add(d);
    const body = new THREE.Group(); d.add(body);
    B.mesh(G.sphere, drake ? grey : hen, 0, 0.1, 0.02, 0.3, 0.18, 0.48, 0, body);                                     // body, low in the water
    B.mesh(G.sphere, drake ? chestnut : hen, 0, 0.13, -0.15, 0.24, 0.18, 0.18, 0, body);                             // breast
    B.mesh(G.sphere, drake ? black : henDark, 0, 0.15, 0.24, 0.14, 0.1, 0.16, 0, body);                              // tail
    if (drake) B.mesh(G.sphere, black, 0, 0.21, 0.29, 0.03, 0.06, 0.03, 0, body);                                    // the drake's curl
    for (const s of [-1, 1]) B.box(speculum, s * 0.13, 0.15, 0.05, 0.02, 0.04, 0.12, 0, body);                       // the blue wing patch
    const head = new THREE.Group(); head.position.set(0, 0.24, -0.22); body.add(head);
    B.mesh(G.sphere, drake ? drakeHead : hen, 0, 0.06, 0, 0.13, 0.14, 0.15, 0, head);
    if (drake) B.mesh(G.cyl, white, 0, -0.03, 0.01, 0.1, 0.018, 0.1, 0, head);                                       // the white collar
    B.box(drake ? billY : billO, 0, 0.04, -0.11, 0.05, 0.025, 0.09, 0, head);
    for (const s of [-1, 1]) B.mesh(G.sphere, black, s * 0.055, 0.08, -0.04, 0.02, 0.02, 0.02, 0, head);
    d.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    ducks.push({ obj: d, body, head, own: true, a: rnd() * 6, r: 0.35 + rnd() * 0.4, w: (0.05 + rnd() * 0.05) * (i % 2 ? 1 : -1), dip: 0, next: 4 + rnd() * 12, ph: rnd() * 6 });
  }
  game.ducks = ducks;
  game.pond = { glows, koi, sheets, fallMat, under, foam };
  B.room = 'grounds';
};

BM.updatePond = function (game, dt, t) {
  const S = game.pond; if (!S) return;
  for (const g of S.glows) { const l = g.l, k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0; g.m.color.copy(g.tint).multiplyScalar(g.k * k * (0.9 + 0.1 * Math.sin(t * 2.1 + g.k * 9))); }
  S.fallMat.uniforms.time.value = t;
  S.foam.material.opacity = 0.22 + 0.08 * Math.sin(t * 7);
  // koi: slow loops under the surface, the tail flicking
  for (const f of S.koi) {
    const a = t * f.w + f.ph, [x, z] = shoreAt(a, f.r + 0.08 * Math.sin(t * 0.3 + f.ph));
    f.g.position.set(x, PD.y - 0.06, z); if (f.lx !== undefined) f.g.rotation.y = Math.atan2(x - f.lx, z - f.lz) + Math.PI; f.lx = x; f.lz = z;
    f.tail.rotation.y = Math.sin(t * 5 + f.ph) * 0.4; f.tail.updateMatrix();
  }
  // mallards: paddling in slow loops, heads bobbing, now and then tipping up to feed
  for (const d of game.ducks || []) {
    if (!d.own) continue;
    d.next -= dt;
    if (d.next <= 0 && d.dip <= 0) { d.dip = 2.4; d.next = 8 + Math.random() * 16; }
    let tip = 0;
    if (d.dip > 0) { d.dip -= dt; tip = Math.sin(Math.min(1, (2.4 - d.dip) / 0.4) * Math.PI / 2) * (d.dip > 0.4 ? 1 : d.dip / 0.4); }
    else d.a += d.w * dt;
    const [x, z] = shoreAt(d.a, d.r + 0.05 * Math.sin(t * 0.2 + d.ph));
    const px = d.obj.position.x, pz = d.obj.position.z;
    d.obj.position.set(x, PD.y - 0.06 + Math.sin(t * 2 + d.ph) * 0.012, z);
    if (Math.hypot(x - px, z - pz) > 1e-4) d.obj.rotation.y = Math.atan2(-(x - px), -(z - pz));
    d.body.rotation.x = -tip * 1.25; d.body.position.y = tip * 0.06;
    d.head.rotation.x = tip ? 0.3 : Math.sin(t * 3 + d.ph) * 0.08;
  }
};
function shoreAt(a, k) { const w = 1 + 0.07 * Math.sin(a * 3 + 1.3) + 0.05 * Math.sin(a * 5 + 0.4); return [PD.cx + Math.sin(a) * PD.rx * k * w, PD.cz + Math.cos(a) * PD.rz * k * w]; }
})();
