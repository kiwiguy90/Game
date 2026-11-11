/* ==========================================================================
   BLACKTHORN MANOR — 6c'. FIFTY YEARS OF NOBODY
   The grounds as they would be after half a century: lawns gone to long
   grass and tussock, brambles in arcs over the beds and up the walls,
   nettles and hogweed, birch and sycamore seeded in the gravel, the box
   and the maze grown out into lumpy shapes, beards of lichen hanging from
   the dead trees, green water in the pool with leaves on it, the cemetery
   knee-deep with its stones leaning. The fountain still runs, if the garden
   circuit is on. Everything here is decoration: none of it blocks you.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const UP = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion();

BM.buildOvergrown = function (B, game) {
  const P = B.phys, rnd = BM.mulberry32(1974 * 3);
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  const stats = { tufts: 0, brambles: 0, weeds: 0, saplings: 0, bulges: 0, moss: 0 };

  /* where nothing grows: buildings, water, the lane */
  const NOGO = [
    [-18.4, 18.4, -12.4, 12.4], [-17.6, -5.6, 79.6, 88.4], [26, 34, -2, 8], [-34, -26, -6, 4],
    [-40.2, -23.8, 55.8, 68.2], [-64, 64, 88, 101], [33, 43, 21, 29.5], [52.4, 61.6, 30.4, 37.6], [-18, -6, -24, -12], [-6, 18, -15, -12], [-5.3, -3.7, -30, -15], [-6, 16, -22.7, -21.3], [5.3, 6.7, -30, -15], [12, 18, -30, -23.4],
  ];
  const WATER = [[0, 24, 3.4], [34, 62, 6.4]];
  const grows = (x, z) => Math.abs(x) < 63.5 && z > -53.5 && z < 87.5 && !NOGO.some(q => x > q[0] && x < q[1] && z > q[2] && z < q[3]) && !WATER.some(c => Math.hypot(x - c[0], z - c[1]) < c[2]);
  const onPath = (x, z, m) => P.paths.some(p => {
    if (p.ring) return Math.abs(Math.hypot(x - p.ring.cx, z - p.ring.cz) - p.ring.r) < p.w / 2 + m;
    if (!p.pts) return false;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2));
      if (Math.hypot(x - ax - vx * t, z - az - vz * t) < p.w / 2 + m) return true;
    }
    return false;
  });
  const stem = (mat, a, b, r, geo) => {
    _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _d.length(); if (len < 1e-3) return null; _d.divideScalar(len);
    const m = new THREE.Mesh(geo || G.post, BM.M(mat));
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.copy(_q.setFromUnitVectors(UP, _d));
    m.scale.set(r * 2, len, r * 2); m.matrixAutoUpdate = false; m.updateMatrix(); B.root.add(m); return m;
  };

  /* ---- long grass: tufts of blades everywhere it can grow, thinner on the paths ---- */
  const tuft = (x, z, h, n, mat) => {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(G.blade, BM.M(mat || (rnd() < 0.3 ? 'dryGrass' : 'longGrass')));
      m.position.set(x + (rnd() - 0.5) * 0.3, 0.0, z + (rnd() - 0.5) * 0.3);
      m.rotation.set((rnd() - 0.5) * 0.5, rnd() * Math.PI, (rnd() - 0.5) * 0.5);
      m.scale.set(0.035 + rnd() * 0.04, h * (0.55 + rnd() * 0.6), 1);
      m.matrixAutoUpdate = false; m.updateMatrix(); B.root.add(m);
    }
    stats.tufts++;
  };
  for (let i = 0; i < 26000 && stats.tufts < 4200; i++) {
    const x = (rnd() * 2 - 1) * 63, z = -53 + rnd() * 140;
    if (!grows(x, z)) continue;
    const path = onPath(x, z, -0.2);
    if (path) continue; // the gravel stays clear: weeds there read as spikes
    tuft(x, z, path ? 0.25 : 0.35 + rnd() * 0.5, path ? 3 : 7);
  }
  // the drive: two wheel ruts, and a strip of grass up the middle where nothing has run for fifty years
  for (let z = 34; z < 86; ) { const len = 0.8 + rnd() * 2.6, w = 0.25 + rnd() * 0.3; B.boxE('moss', -w + (rnd() - 0.5) * 0.15, w, 0.004, 0.012, z, Math.min(86.5, z + len)); z += len + 0.3 + rnd() * 1.4; }
  for (let z = 34; z < 87; z += 1.6) if (rnd() < 0.4) tuft(rnd() < 0.5 ? -2.75 : 2.75, z, 0.3, 3); // weeds along the edges
  // grass through the setts in the courtyard and up against the house
  for (let i = 0; i < 40; i++) tuft(-18 + rnd() * 12, -24 + rnd() * 11.8, 0.25, 3);
  for (let x = -17.5; x < 17.6; x += 0.9) { if (Math.abs(x) > 3.2) tuft(x, 12.55 + rnd() * 0.25, 0.45, 4); tuft(x, -12.55 - rnd() * 0.25, 0.45, 4); }

  /* ---- brambles: arching canes, over beds, round the pool, up the walls ---- */
  const bramble = (x, z, s) => {
    // the mound: a few overlapping clumps of dark leaf, low and wide
    for (let k = 0; k < 4; k++) B.mesh(G.lowSphere, k % 2 ? 'sapLeaves' : 'leavesDark', x + (rnd() - 0.5) * 0.9 * s, (0.25 + rnd() * 0.15) * s, z + (rnd() - 0.5) * 0.9 * s, (1.0 + rnd() * 0.6) * s, (0.55 + rnd() * 0.3) * s, (1.0 + rnd() * 0.6) * s);
    // canes arching out of it and rooting again
    for (let i = 0; i < 3; i++) { // a few canes arching just clear of the leaf and rooting again at its edge
      const a = rnd() * Math.PI * 2, r = (0.75 + rnd() * 0.3) * s, h = (0.75 + rnd() * 0.2) * s;
      const mid = [x + Math.cos(a) * r * 0.45, h, z + Math.sin(a) * r * 0.45], end = [x + Math.cos(a) * r, 0.1 * s, z + Math.sin(a) * r];
      stem('thorn', [x, 0.4 * s, z], mid, 0.022); stem('thorn', mid, end, 0.018);
    }
    stats.brambles++;
  };
  const brambleAt = [];
  for (let i = 0; i < 2000 && brambleAt.length < 46; i++) {
    const x = (rnd() * 2 - 1) * 62, z = -52 + rnd() * 138;
    if (!grows(x, z) || onPath(x, z, 0.9)) continue;
    brambleAt.push([x, z]); bramble(x, z, 0.8 + rnd() * 0.7);
  }
  for (const [x, z] of [[-40.8, 58], [-40.8, 64], [-23.2, 57.5], [-23.2, 66.5], [-32, 69], [-28, 55]]) bramble(x, z, 1.1); // round the pool
  for (let z = 30.5; z < 44; z += 2.6) { bramble(29.2, z, 0.7); bramble(46.8, z, 0.7); }                            // the cemetery railings

  /* ---- nettles and hogweed ---- */
  for (let i = 0; i < 3000 && stats.weeds < 90; i++) {
    const x = (rnd() * 2 - 1) * 62, z = -52 + rnd() * 138;
    if (!grows(x, z) || onPath(x, z, 0.5)) continue;
    if (rnd() < 0.35) {
      const h = 1.4 + rnd() * 0.9; stem('deadStalk', [x, 0, z], [x + (rnd() - 0.5) * 0.2, h, z + (rnd() - 0.5) * 0.2], 0.025);
      B.mesh(G.cone, 'flowersWhite', x, h + 0.04, z, 0.55, 0.12, 0.55);
      B.mesh(G.lowSphere, 'sapLeaves', x, 0.25, z, 1.1, 0.5, 1.1, rnd() * 3); // the broad leaves at its foot
    } else { // a nettle bed: soft leafy clumps with a few taller stalks through them
      for (let k = 0; k < 3; k++) B.mesh(G.lowSphere, k ? 'sapLeaves' : 'leavesDark', x + (rnd() - 0.5) * 0.6, 0.3 + rnd() * 0.1, z + (rnd() - 0.5) * 0.6, 0.7 + rnd() * 0.4, 0.75 + rnd() * 0.4, 0.7 + rnd() * 0.4, rnd() * 3);
      tuft(x, z, 0.9 + rnd() * 0.3, 4);
    }
    stats.weeds++;
  }

  /* ---- self-seeded saplings: birch and sycamore, some right in the gravel ---- */
  const sapling = (x, z, s, birch) => {
    const h = (2.2 + rnd() * 1.8) * s;
    stem(birch ? 'birch' : 'bark', [x, 0, z], [x + (rnd() - 0.5) * 0.4, h, z + (rnd() - 0.5) * 0.4], 0.05 * s, G.cyl);
    for (let k = 0; k < 7; k++) { const a = rnd() * 6.3, y = h * (0.4 + k * 0.08); const tip = [x + Math.cos(a) * 0.7 * s, y + (0.4 + rnd() * 0.4) * s, z + Math.sin(a) * 0.7 * s]; stem('deadTwig', [x, y, z], tip, 0.014 * s); for (let j = 0; j < 2; j++) { const b = rnd() * 6.3; stem('deadTwig', tip, [tip[0] + Math.cos(b) * 0.3 * s, tip[1] + 0.25 * s, tip[2] + Math.sin(b) * 0.3 * s], 0.007 * s); } }
    stats.saplings++;
  };
  for (let i = 0; i < 2000 && stats.saplings < 30; i++) {
    const x = (rnd() * 2 - 1) * 60, z = -50 + rnd() * 134;
    if (!grows(x, z) || onPath(x, z, 1.2)) continue;
    sapling(x, z, 0.8 + rnd() * 0.5, rnd() < 0.5);
  }
  for (const [x, z] of [[-2.4, 46], [2.5, 71], [-2.2, 79], [5.2, 26.5], [-5.6, 18.5]]) sapling(x, z, 0.7, true); // in the gravel, at the edges where nobody drives

  /* ---- hedges grown out: lumps on the tops and sides of every hedge, shoots sticking up ---- */
  for (const w of P.walls) {
    if (w.kind !== 'hedge' || w.tag === 'forest' || w.tag === 'the road on') continue;
    const lx = w.x1 - w.x0, lz = w.z1 - w.z0, along = lx > lz, len = Math.max(lx, lz), cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2, h = w.y1 - w.y0;
    const n = Math.max(1, Math.round(len / 0.9));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5, x = along ? cx + u * len : cx, z = along ? cz : cz + u * len;
      const s = 0.7 + rnd() * 0.45;
      B.mesh(G.lowSphere, 'hedge', x + (along ? 0 : (rnd() - 0.5) * 0.15), w.y1 - 0.05 + rnd() * 0.15, z + (along ? (rnd() - 0.5) * 0.15 : 0), (along ? 1.2 : Math.min(lx, 0.8) + 0.25) * s, 0.55 * s, (along ? Math.min(lz, 0.8) + 0.25 : 1.2) * s);
      if (rnd() < 0.3) stem('deadTwig', [x, w.y1, z], [x + (rnd() - 0.5) * 0.4, w.y1 + 0.5 + rnd() * 0.6, z + (rnd() - 0.5) * 0.4], 0.012);
      stats.bulges++;
    }
  }

  /* ---- the dead trees: beards of lichen hanging from the branches ---- */
  for (const t of game.deadTrees || []) for (const tip of t.tips) {
    if (rnd() < 0.35) continue;
    for (let k = 0; k < 3; k++) {
      const x = tip[0] + (rnd() - 0.5) * 0.5, z = tip[2] + (rnd() - 0.5) * 0.5, y = tip[1] - rnd() * 0.3, len = 0.5 + rnd() * 1.3;
      stem('beardMoss', [x, y, z], [x + (rnd() - 0.5) * 0.15, y - len, z + (rnd() - 0.5) * 0.15], 0.03 + rnd() * 0.03, G.cone);
      stats.moss++;
    }
  }

  /* ---- the pool: green scum, leaves floating and sunk, algae on the walls, a ladder, an old chair in it ---- */
  B.room = 'sunken pool';
  B.boxE('scum', -36, -28, -0.56, -0.545, 59, 65);
  for (let i = 0; i < 60; i++) B.box(rnd() < 0.5 ? 'leafLitter' : 'leafLitter2', -35.8 + rnd() * 7.6, -0.54, 59.2 + rnd() * 5.6, 0.14, 0.005, 0.09, rnd() * 3);
  for (let i = 0; i < 6; i++) B.mesh(G.lowSphere, 'sapLeaves', -35.7 + rnd() * 7.4, -0.54, 59.3 + rnd() * 5.4, 0.5 + rnd() * 0.6, 0.04, 0.4 + rnd() * 0.5);
  for (const [x0, x1, z0, z1] of [[-36.2, -27.8, 58.82, 58.84], [-36.2, -27.8, 65.16, 65.18], [-36.18, -36.16, 59, 65], [-27.84, -27.82, 59, 65]]) B.boxE('moss', x0, x1, -0.75, -0.55, z0, z1);
  for (const dx of [-0.25, 0.25]) { stem('chrome', [-28.6 + dx, -0.4, 65.1], [-28.6 + dx, 0.5, 65.1], 0.02); stem('chrome', [-28.6 + dx, 0.5, 65.1], [-28.6 + dx, 0.55, 65.4], 0.02); }
  for (let k = 0; k < 3; k++) B.box('chrome', -28.6, -0.25 + k * 0.25, 65.05, 0.5, 0.02, 0.05);
  { const c = new THREE.Group(); c.position.set(-33.2, -0.6, 62.6); c.rotation.set(0.4, 0.7, 1.2); B.root.add(c); B.box('rust', 0, 0, 0, 0.5, 0.04, 0.5, 0, c); B.box('rust', 0, 0.25, -0.24, 0.5, 0.5, 0.04, 0, c); for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) B.mesh(G.post, 'rust', dx, -0.22, dz, 0.025, 0.45, 0.025, 0, c); }
  // cracked and missing coping, and two dark cypresses at the far end
  for (let i = 0; i < 6; i++) B.box('stone', -39.6 + rnd() * 15, 0.03, rnd() < 0.5 ? 55.9 : 68.1, 0.5, 0.06, 0.3, rnd() * 0.5);
  for (const x of [-41.5, -22.5]) { B.mesh(G.cyl, 'bark', x, 0.6, 69.2, 0.2, 1.2, 0.2); B.mesh(G.cone, 'pineDark', x, 2.6, 69.2, 1.3, 4.4, 1.3); B.mesh(G.cone, 'pine', x + 0.1, 3.9, 69.2, 0.9, 2.6, 0.9); P.addWall(x - 0.3, x + 0.3, 68.9, 69.5, 0, 4, { kind: 'tree' }); }
  // the light under the water: a soft green-blue glow in the scum when the pool lights are on
  const glowMat = BM.Own(0x000000); glowMat.transparent = true; glowMat.blending = THREE.AdditiveBlending; glowMat.depthWrite = false;
  const poolGlow = B.boxE(glowMat, -35.8, -28.2, -0.544, -0.54, 59.2, 64.8); poolGlow.userData.dynamic = true;
  game.poolGlow = glowMat;

  /* ---- the fountain: it still runs on the garden circuit ---- */
  B.room = 'grounds';
  B.mesh(G.cyl, 'scum', 0, 0.452, 24, 5.7, 0.01, 5.7);
  for (let i = 0; i < 30; i++) { const a = rnd() * 6.3, r = 0.6 + rnd() * 2.1; B.box(rnd() < 0.5 ? 'leafLitter' : 'leafLitter2', Math.sin(a) * r, 0.46, 24 + Math.cos(a) * r, 0.14, 0.005, 0.09, rnd() * 3); }

  /* ---- the cemetery: knee-deep grass, stones leaning, ivy on them ---- */
  B.room = 'cemetery';
  for (let i = 0; i < 160; i++) tuft(30.4 + rnd() * 15.2, 30.4 + rnd() * 13.2, 0.6 + rnd() * 0.4, 5);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) {
    const x = 33.5 + k * 2.2, z = 32.5 + r * 4.5;
    if (z > 35.5 && z < 38.5 && x < 35) continue;
    if (rnd() < 0.5) B.mesh(G.lowSphere, 'ivy', x + (rnd() - 0.5) * 0.4, 0.4 + rnd() * 0.4, z - 0.1, 0.4, 0.5, 0.12);
  }
  B.room = 'grounds';

  /* ---- the heart of the maze: a bench, a sundial, roses gone wild ---- */
  if (game.maze) {
    const hx = game.maze.x0 + 10.5, hz = game.maze.z0 + 10.5;
    B.box('boards', hx - 1.0, 0.42, hz + 0.9, 0.4, 0.05, 1.1); for (const dz of [-0.45, 0.45]) B.box('stone', hx - 1.0, 0.2, hz + 0.9 + dz, 0.35, 0.4, 0.12);
    B.box('boards', hx - 1.18, 0.75, hz + 0.9, 0.05, 0.5, 1.1);
    B.mesh(G.cyl, 'stone', hx + 0.9, 0.45, hz - 0.9, 0.3, 0.9, 0.3); B.mesh(G.cyl, 'brass', hx + 0.9, 0.92, hz - 0.9, 0.5, 0.03, 0.5);
    { const gn = B.box('brass', hx + 0.9, 1.0, hz - 0.9, 0.02, 0.16, 0.22); gn.rotation.y = 0.6; gn.updateMatrix(); }
    for (let k = 0; k < 4; k++) bramble(hx + (k < 2 ? -1.1 : 1.1), hz + (k % 2 ? 1.1 : -1.1), 0.55);
    for (let k = 0; k < 6; k++) B.mesh(G.lowSphere, 'flowersRed', hx - 1.2 + rnd() * 2.4, 0.5 + rnd() * 0.4, hz - 1.2 + rnd() * 2.4, 0.12, 0.1, 0.12);
  }

  /* ---- the flower beds along the drive: nettles and bramble through the dead stalks ---- */
  for (let z = 42; z <= 82; z += 8) { if (z >= 58 && z <= 66) continue; for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) tuft(sx * (4.4 + rnd() * 0.8), z + rnd() * 5, 0.7, 5); }

  game.overgrown = stats;
};

/* per frame: the fountain runs while the garden circuit does; the pool glows under its lights */
BM.updateOvergrown = function (game, dt, t) {
  const grid = game.grid;
  BM.updateFountain(game, dt, t);
  if (game.poolGlow && game.estateLights) {
    let k = 0;
    for (const id of game.estateLights.pool) { const l = grid.light(id); if (l && /pool-under/.test(id) && l.target > 0) k = Math.max(k, Math.min(1.2, l.intensity / l.target)); }
    game.poolGlow.color.setRGB(0.003 * k, 0.016 * k, 0.01 * k);
  }
};
})();
