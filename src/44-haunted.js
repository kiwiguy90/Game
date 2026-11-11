/* ==========================================================================
   BLACKTHORN MANOR — 6c. THE HAUNTED GARDEN
   Gnarled dead trees, black yews, a weeping willow by the pond, blackthorn,
   dead grass, ivy on the walls, fallen leaves, toadstools, and crows.
   Every part is a canonical primitive placed by its matrix, so the start-up
   pass instances each kind into a single draw. Branches, grass and willow
   strands sway in the storm wind in the vertex shader.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const UP = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion(), _d = new THREE.Vector3(), _m = new THREE.Vector3();

/* A cylinder from a to b (both [x,y,z]) of radius r. */
function limb(B, mat, a, b, r, geo) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _d.length();
  if (len < 1e-3) return null;
  _d.divideScalar(len);
  const m = new THREE.Mesh(geo || G.post, BM.M(mat));
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.copy(_q.setFromUnitVectors(UP, _d));
  m.scale.set(r * 2, len, r * 2);
  m.matrixAutoUpdate = false; m.updateMatrix();
  B.root.add(m);
  return m;
}
/* A crooked limb: two segments with a kink, returns the tip. */
function crooked(B, mat, a, dir, len, r0, r1, rnd) {
  const k = [a[0] + dir[0] * len * 0.5 + (rnd() - 0.5) * len * 0.25, a[1] + dir[1] * len * 0.5 + (rnd() - 0.5) * len * 0.15, a[2] + dir[2] * len * 0.5 + (rnd() - 0.5) * len * 0.25];
  const t = [a[0] + dir[0] * len, a[1] + dir[1] * len - len * 0.12 * rnd(), a[2] + dir[2] * len];
  limb(B, mat, a, k, r0);
  limb(B, mat, k, t, (r0 + r1) / 2);
  return t;
}
BM.limb = limb;
function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

/* A gnarled dead tree: leaning trunk, clawing limbs, twigs. Returns limb tips. */
BM.deadTree = function (B, x, z, s, game, seed) {
  const rnd = BM.mulberry32(Math.floor(x * 73 + z * 131 + (seed || 0) * 7) | 0);
  const H = (4.2 + rnd() * 2.2) * s;
  // trunk: three leaning, twisting sections
  const pts = [[x, 0, z]];
  let lx = (rnd() - 0.5) * 0.5 * s, lz = (rnd() - 0.5) * 0.5 * s;
  for (let i = 1; i <= 3; i++) {
    const p = pts[i - 1];
    pts.push([p[0] + lx * i * 0.4 + (rnd() - 0.5) * 0.25 * s, H * i / 3, p[2] + lz * i * 0.4 + (rnd() - 0.5) * 0.25 * s]);
  }
  const rTrunk = [0.38, 0.3, 0.2, 0.12];
  for (let i = 0; i < 3; i++) limb(B, 'deadBark', pts[i], pts[i + 1], rTrunk[i] * s, G.cyl);
  // knotted joints so the leaning sections read as one twisted trunk
  for (let i = 1; i < 3; i++) B.mesh(G.sphere, 'deadBark', pts[i][0], pts[i][1], pts[i][2], rTrunk[i - 1] * 2.1 * s);
  // root flare
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + rnd(); limb(B, 'deadBark', [x, 0.5 * s, z], [x + Math.cos(a) * 0.9 * s, 0.02, z + Math.sin(a) * 0.9 * s], 0.12 * s); }
  const tips = [];
  const nPrimary = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < nPrimary; i++) {
    const t = 0.45 + 0.55 * (i / nPrimary);
    const seg = Math.min(2, Math.floor(t * 3));
    const f = t * 3 - seg, a0 = pts[seg], a1 = pts[seg + 1];
    const base = [a0[0] + (a1[0] - a0[0]) * f, a0[1] + (a1[1] - a0[1]) * f, a0[2] + (a1[2] - a0[2]) * f];
    const ang = i * 2.399 + rnd() * 0.8;
    const dir = norm([Math.cos(ang), 0.35 + rnd() * 0.6, Math.sin(ang)]);
    const len = (1.6 + rnd() * 1.5) * s * (1.1 - t * 0.4);
    const tip = crooked(B, 'deadTwig', base, dir, len, 0.11 * s, 0.07 * s, rnd);
    tips.push(tip);
    // secondaries: claw outward and up, some droop
    const nSec = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < nSec; k++) {
      const d2 = norm([dir[0] + (rnd() - 0.5) * 1.2, dir[1] + (rnd() - 0.3) * 0.9, dir[2] + (rnd() - 0.5) * 1.2]);
      const t2 = crooked(B, 'deadTwig', tip, d2, len * (0.45 + rnd() * 0.3), 0.06 * s, 0.035 * s, rnd);
      for (let j = 0; j < 2; j++) {
        const d3 = norm([d2[0] + (rnd() - 0.5) * 1.6, d2[1] + (rnd() - 0.4), d2[2] + (rnd() - 0.5) * 1.6]);
        limb(B, 'deadTwig', t2, [t2[0] + d3[0] * len * 0.3, t2[1] + d3[1] * len * 0.3, t2[2] + d3[2] * len * 0.3], 0.02 * s);
      }
    }
  }
  B.phys.addWall(x - 0.3 * s, x + 0.3 * s, z - 0.3 * s, z + 0.3 * s, 0, H, { kind: 'tree' });
  if (game) (game.deadTrees = game.deadTrees || []).push({ x, z, s, tips });
  return tips;
};

/* A black yew: a tall, dark, ragged cone. */
function yew(B, x, z, s) {
  B.mesh(G.cyl, 'deadBark', x, 0.6 * s, z, 0.4 * s, 1.2 * s, 0.4 * s);
  B.mesh(G.cone, 'yew', x, 2.8 * s, z, 2.6 * s, 4.6 * s, 2.6 * s);
  B.mesh(G.cone, 'yew', x + 0.2 * s, 4.4 * s, z - 0.1 * s, 1.7 * s, 3.0 * s, 1.7 * s);
  B.phys.addWall(x - 0.35 * s, x + 0.35 * s, z - 0.35 * s, z + 0.35 * s, 0, 4 * s, { kind: 'tree' });
}

BM.buildHauntedGarden = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  const P = B.phys, rnd = BM.mulberry32(666);
  /* ---- where planting must not go ---- */
  const rects = [
    [-25, 25, -33, 19],        // the house and its walled garden
    [-16, -4, 78, 101],        // lodge
    [24, 36, -4, 10.5],        // garage and its yard
    [-34, -25, -6, 4],         // shed
    [-61, -38, 27, 50],        // maze
    [29, 47, 29, 45],          // cemetery
    [47, 63, 28, 48],          // the chapel, and the path round to it
    [31, 49, 12, 27.5],        // the mausoleum
    [-42, -21, 54, 70],        // sunken pool
    [-8, 8, 26, 101],          // the avenue and the gates
    [-64, 64, 85, 101],        // the boundary wall and the lane
    [33, 43, 21, 29.5],        // the mausoleum
  ];
  const circles = [[0, 24, 12], [34, 62, 8.5], [48.7, 37, 2.5], [-13, 31, 3]];
  const paths = P.paths.filter(p => p.pts);
  const nearPath = (x, z, m) => paths.some(p => {
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1];
      const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2));
      if (Math.hypot(x - ax - vx * t, z - az - vz * t) < p.w / 2 + m) return true;
    }
    return false;
  });
  const placed = [];
  const free = (x, z, r, spacing) => {
    if (Math.abs(x) > 62 || z < -52 || z > 84) return false;
    if (rects.some(q => x > q[0] - r && x < q[1] + r && z > q[2] - r && z < q[3] + r)) return false;
    if (circles.some(c => Math.hypot(x - c[0], z - c[1]) < c[2] + r)) return false;
    if (nearPath(x, z, r + 0.5)) return false;
    if (spacing && placed.some(p => Math.hypot(x - p[0], z - p[1]) < spacing)) return false;
    return true;
  };
  const scatter = (n, r, spacing, fn, tries) => {
    let made = 0;
    for (let i = 0; i < (tries || n * 40) && made < n; i++) {
      const x = (rnd() * 2 - 1) * 62, z = -52 + rnd() * 136;
      if (!free(x, z, r, spacing)) continue;
      placed.push([x, z]); fn(x, z); made++;
    }
    return made;
  };

  /* ---- dead trees across the grounds, black yews among them ---- */
  game.deadTrees = game.deadTrees || [];
  let yews = 0;
  const treesMade = scatter(30, 1.5, 7, (x, z) => {
    if (rnd() < 0.18) { yew(B, x, z, 0.9 + rnd() * 0.4); yews++; }
    else BM.deadTree(B, x, z, 0.9 + rnd() * 0.6, game);
  });
  // one by Eleanor's stone, leaning over it
  BM.deadTree(B, 52.4, 41.8, 1.25, game, 9);
  placed.push([52.4, 41.8]);

  /* ---- the weeping willow by the pond ---- */
  const wx = 42.5, wz = 69.5;
  limb(B, 'deadBark', [wx, 0, wz], [wx - 0.3, 2.6, wz + 0.2], 0.42, G.cyl);
  limb(B, 'deadBark', [wx - 0.3, 2.6, wz + 0.2], [wx - 0.1, 4.6, wz], 0.3, G.cyl);
  P.addWall(wx - 0.4, wx + 0.4, wz - 0.4, wz + 0.4, 0, 4.6, { kind: 'tree' });
  for (let i = 0; i < 6; i++) { const a = i * 1.05; limb(B, 'deadTwig', [wx - 0.1, 4.4, wz], [wx + Math.cos(a) * 2.4, 5.3, wz + Math.sin(a) * 2.4], 0.08); }
  // the curtain: fine strands arching out from the crown, then hanging almost to the ground
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2, r = 1.4 + rnd() * 2.6, crown = [wx - 0.1 + Math.cos(a) * 0.5, 5.0 + rnd() * 0.6, wz + Math.sin(a) * 0.5];
    const arc = [wx + Math.cos(a) * r, 5.4 - r * 0.18 + rnd() * 0.3, wz + Math.sin(a) * r];
    const end = [arc[0] + Math.cos(a) * 0.25, 0.5 + rnd() * 1.6, arc[2] + Math.sin(a) * 0.25];
    limb(B, 'willow', crown, arc, 0.018);
    limb(B, 'willow', arc, end, 0.014);
  }
  placed.push([wx, wz]);

  /* ---- blackthorn: low thorny bushes along the house and in clumps ---- */
  const thornBush = (x, z, s) => {
    for (let i = 0; i < 7; i++) {
      const a = rnd() * Math.PI * 2, up = 0.4 + rnd() * 0.6;
      const d = norm([Math.cos(a), up, Math.sin(a)]), len = (0.5 + rnd() * 0.5) * s;
      const tip = [x + d[0] * len, 0.05 + d[1] * len, z + d[2] * len];
      limb(B, 'thorn', [x, 0.02, z], tip, 0.025 * s);
      for (let k = 0; k < 2; k++) {
        const a2 = a + (rnd() - 0.5) * 2;
        limb(B, 'thorn', tip, [tip[0] + Math.cos(a2) * 0.3 * s, tip[1] + 0.05 + rnd() * 0.2, tip[2] + Math.sin(a2) * 0.3 * s], 0.012 * s);
      }
    }
  };
  // along the front and sides of the house, below the window sills
  for (let x = -17; x <= 17; x += 2.3) if (Math.abs(x) > 3.4) thornBush(x, 12.9 + rnd() * 0.4, 0.8 + rnd() * 0.3);
  for (let z = -10; z <= 10; z += 2.6) { thornBush(-18.9 - rnd() * 0.3, z, 0.8); thornBush(18.9 + rnd() * 0.3, z, 0.8); }
  scatter(26, 0.8, 2.5, (x, z) => { thornBush(x, z, 1); thornBush(x + 0.7, z + 0.4, 0.8); });

  /* ---- dead grass clumps ---- */
  const grass = (x, z, s) => {
    for (let i = 0; i < 6; i++) {
      const m = B.mesh(G.blade, 'dryGrass', x + (rnd() - 0.5) * 0.4, 0, z + (rnd() - 0.5) * 0.4, 0.05 + rnd() * 0.04, 0.62 * s * (0.7 + rnd() * 0.5), 1);
      m.rotation.set((rnd() - 0.5) * 0.6, rnd() * 3, (rnd() - 0.5) * 0.6); m.updateMatrix();
    }
  };
  let clumps = 0;
  for (let i = 0; i < 6000 && clumps < 420; i++) {
    const x = (rnd() * 2 - 1) * 62, z = -52 + rnd() * 136;
    if (!free(x, z, 0.2, 0)) continue;
    grass(x, z, 0.7 + rnd() * 0.8); clumps++;
  }
  // and round the boles of the trees
  for (const t of game.deadTrees) for (let k = 0; k < 3; k++) { const a = rnd() * 6.28; grass(t.x + Math.cos(a) * 0.9, t.z + Math.sin(a) * 0.9, 0.9); }

  /* ---- fallen leaves and toadstools under the trees ---- */
  for (const t of game.deadTrees) {
    for (let k = 0; k < 14; k++) {
      const a = rnd() * 6.28, r = 0.5 + rnd() * 3.5;
      const x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
      if (nearPath(x, z, 0)) continue;
      B.box(k % 2 ? 'leafLitter' : 'leafLitter2', x, 0.012, z, 0.16, 0.012, 0.1, rnd() * 3);
    }
    for (let k = 0; k < 4; k++) {
      const a = rnd() * 6.28, r = 0.45 + rnd() * 0.4, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r, h = 0.06 + rnd() * 0.08;
      B.mesh(G.post, 'fungusStem', x, h / 2, z, 0.025, h, 0.025);
      B.mesh(G.lowSphere, 'fungus', x, h, z, 0.1, 0.05, 0.1);
    }
  }

  /* ---- ivy on the house and the estate wall, never over a window ---- */
  const wins = P.windows.filter(w => w.zone === 'mansion');
  const clearOfWindows = (face, along, y) => !wins.some(w => {
    const onFace = face === 'z+' ? w.nz > 0 : face === 'z-' ? w.nz < 0 : face === 'x+' ? w.nx > 0 : w.nx < 0;
    if (!onFace) return false;
    const c = face[0] === 'z' ? w.x : w.z;
    return Math.abs(along - c) < w.w / 2 + 0.45 && y > w.sill - 0.6 && y < w.head + 0.5;
  });
  const ivy = (face, plane, along, y0, height) => {
    for (let y = y0; y < y0 + height; y += 0.3) {
      // a creeping spray of small leaves, widest at the bottom, thinning as it climbs
      const spread = 0.35 + 0.6 * (1 - (y - y0) / height);
      for (let k = 0; k < 6; k++) {
        const a = along + (rnd() - 0.5) * spread * 2, yy = y + (rnd() - 0.5) * 0.4, w = 0.14 + rnd() * 0.16;
        if (!clearOfWindows(face, a, yy)) continue;
        const out = face[1] === '+' ? 1 : -1, off = plane + out * (0.025 + rnd() * 0.03);
        const leaf = face[0] === 'z' ? B.box('ivy', a, yy, off, w, w * 0.8, 0.03, 0) : B.box('ivy', off, yy, a, 0.03, w * 0.8, w);
        leaf.rotation[face[0] === 'z' ? 'z' : 'x'] = rnd() * 3; leaf.updateMatrix();
      }
    }
  };
  for (const x of [-17.4, -12, -6.2, 6.2, 12, 17.4]) ivy('z+', 12.2, x, 0.3, 2 + rnd() * 5.5);
  for (const z of [-11, -5, 4, 11]) { ivy('x-', -18.2, z, 0.3, 2 + rnd() * 5); ivy('x+', 18.2, z, 0.3, 2 + rnd() * 5); }
  for (const x of [-15, -6, 6, 15]) ivy('z-', -12.2, x, 0.3, 2 + rnd() * 5);
  for (let x = -60; x <= 60; x += 7 + rnd() * 6) if (Math.abs(x) > 5 && (x < -16 || x > -4)) ivy('z-', 87.8, x, 0.3, 1.6 + rnd() * 0.6);
  for (let z = -50; z <= 84; z += 8 + rnd() * 7) { ivy('x+', -64, z, 0.3, 1.5 + rnd() * 0.8); ivy('x-', 64, z, 0.3, 1.5 + rnd() * 0.8); }

  /* ---- crows in the dead branches ---- */
  game.crows = [];
  const trees = game.deadTrees.slice();
  for (let i = 0; i < trees.length && game.crows.length < 9; i += 3) {
    const t = trees[i], tip = t.tips[Math.floor(rnd() * t.tips.length)];
    if (!tip) continue;
    const [x, y, z] = tip, ry = rnd() * 6.28;
    B.mesh(G.sphere, 'crow', x, y + 0.14, z, 0.18, 0.2, 0.32, ry);
    B.mesh(G.sphere, 'crow', x + Math.sin(ry) * 0.14, y + 0.27, z + Math.cos(ry) * 0.14, 0.12);
    B.mesh(G.cone, 'crow', x - Math.sin(ry) * 0.2, y + 0.14, z - Math.cos(ry) * 0.2, 0.12, 0.25, 0.04, ry);
    game.crows.push({ x, y: y + 0.2, z });
  }
  game.haunted = { trees: game.deadTrees.length, yews, treesMade, clumps, crows: game.crows.length };
};
})();
