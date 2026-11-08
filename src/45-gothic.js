/* ==========================================================================
   BLACKTHORN MANOR — 6d. THE GOTHIC HOUSE
   The exterior the family built to be looked at: four octagonal corner
   towers with slate spires, a central clock tower (stopped at 11:41), a
   steep slate roof with iron cresting, front gables, stepped buttresses with
   pinnacles, pointed hoods over every window, broken shutters, string
   courses, battlements, tall chimneys, a gothic porch and gargoyles.
   Grounds: weeping angels (one headless), a family mausoleum, an old well,
   a toppled urn and a rope swing.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* Draw on a wall face: n = outward normal (nx, nz), p = a point on the face.
   Local x runs along the face, local z out from it. */
function face(B, nx, nz, px, pz) {
  const tx = nz, tz = -nx, ry = Math.atan2(nx, nz);
  const at = (lx, lz) => [px + tx * lx + nx * lz, pz + tz * lx + nz * lz];
  return {
    ry, at,
    box(mat, lx, y, lz, sx, sy, sz, tilt) {
      const [x, z] = at(lx, lz);
      const m = B.box(mat, x, y, z, sx, sy, sz, ry);
      if (tilt) { m.rotation.set(0, ry, tilt); m.updateMatrix(); }
      return m;
    },
    /* a gable/pointed shape in the face plane: width along the face, depth out */
    wedge(mat, lx, y, lz, width, h, depth) {
      const [x, z] = at(lx, lz);
      return B.mesh(G.wedge, mat, x, y, z, depth, h, width, ry + Math.PI / 2);
    },
    mesh(geo, mat, lx, y, lz, sx, sy, sz) { const [x, z] = at(lx, lz); return B.mesh(geo, mat, x, y, z, sx, sy, sz, ry); },
  };
}
BM.face = face;

/* A lancet (pointed) window set into masonry: glass, stone surround, hood. */
function lancet(F, lx, y0, w, h, o) {
  o = o || {};
  const glass = o.lit ? 'candleGlow' : 'darkGlass';
  F.box(glass, lx, y0 + h / 2, 0.03, w, h, 0.04);
  F.wedge(glass, lx, y0 + h, 0.03, w, w * 0.7, 0.04);
  // tracery: a mullion and a transom
  F.box('gothicTrim', lx, y0 + h / 2 + w * 0.2, 0.07, 0.07, h + w * 0.5, 0.06);
  F.box('gothicTrim', lx, y0 + h * 0.62, 0.07, w, 0.07, 0.06);
  // jambs, sill and pointed hood
  F.box('gothicTrim', lx - w / 2 - 0.09, y0 + h / 2, 0.05, 0.18, h, 0.2);
  F.box('gothicTrim', lx + w / 2 + 0.09, y0 + h / 2, 0.05, 0.18, h, 0.2);
  F.box('gothicTrim', lx, y0 - 0.06, 0.08, w + 0.4, 0.12, 0.28);
  F.wedge('gothicTrim', lx, y0 + h - 0.02, 0.06, w + 0.5, w * 0.85, 0.24);
  if (o.boarded) for (let i = 0; i < 3; i++) F.box('boards', lx, y0 + h * (0.25 + i * 0.25), 0.1, w + 0.3, 0.16, 0.04, (i - 1) * 0.18);
}

BM.buildGothic = function (B, game) {
  const P = B.phys, rnd = BM.mulberry32(1888);
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'exterior';
  const EAVES = 8.2, RIDGE = 17.2;

  /* ---- the steep slate roof, gable ends, iron cresting ---- */
  B.mesh(G.wedge, 'slate', 0, EAVES, 0, 36.1, RIDGE - EAVES, 25.4);
  for (const sx of [-1, 1]) {
    B.mesh(G.wedge, 'gothicStone', sx * 18.15, EAVES, 0, 0.5, (RIDGE - EAVES) * 24.6 / 25.4, 24.6);
    B.mesh(G.spire, 'gothicTrim', sx * 18.15, RIDGE + 0.35, 0, 0.5, 1.4, 0.5);
    const F = face(B, sx, 0, sx * 18.4, 0);
    lancet(F, 0, 10.6, 1.0, 2.4, { boarded: sx > 0 });
  }
  for (let x = -17; x <= 17.01; x += 0.5) {
    B.mesh(G.post, 'iron', x, RIDGE + 0.28, 0, 0.035, 0.56, 0.035);
    B.mesh(G.pyramid, 'iron', x, RIDGE + 0.62, 0, 0.09, 0.16, 0.09);
  }
  B.box('iron', 0, RIDGE + 0.5, 0, 34, 0.04, 0.04);

  /* ---- string courses and the eaves cornice with corbels ---- */
  const faces = [[0, 1, 0, 12.2, 36.4], [0, -1, 0, -12.2, 36.4], [1, 0, 18.2, 0, 24.8], [-1, 0, -18.2, 0, 24.8]];
  for (const [nx, nz, px, pz, len] of faces) {
    const F = face(B, nx, nz, px, pz);
    F.box('gothicTrim', 0, 4.15, 0.07, len, 0.18, 0.14);
    F.box('gothicTrim', 0, EAVES - 0.1, 0.18, len + 0.4, 0.34, 0.36);
    for (let l = -len / 2 + 0.6; l < len / 2; l += 1.2) F.box('gothicTrim', l, EAVES - 0.42, 0.12, 0.2, 0.3, 0.24);
    // plinth course along the foot of the wall, broken at every doorway and the cellar steps so the doors meet the ground
    const gaps = P.doorways.filter(d => d.y < 0.5 && d.y > -0.5 && (nz ? d.axis === 'x' && Math.abs(d.z - pz) < 0.4 : d.axis === 'z' && Math.abs(d.x - px) < 0.4))
      .map(d => { const along = nz ? d.x * nz : -d.z * nx; return [along - d.width / 2 - 0.12, along + d.width / 2 + 0.12]; })
      .sort((a, b) => a[0] - b[0]);
    let from = -len / 2 - 0.1;
    for (const [g0, g1] of gaps.concat([[len / 2 + 0.1, len / 2 + 0.1]])) {
      if (g0 - from > 0.05) F.box('stone', (from + g0) / 2, 0.25, 0.08, g0 - from, 0.5, 0.16);
      from = Math.max(from, g1);
    }
  }

  /* ---- pointed hoods over every window, and shutters, some hanging ---- */
  game.shutters = [];
  P.windows.filter(w => w.zone === 'mansion').forEach((w, i) => {
    const F = face(B, w.nx, w.nz, w.x + w.nx * 0.2, w.z + w.nz * 0.2);
    F.wedge('gothicTrim', 0, w.head + 0.02, 0.1, w.w + 0.45, Math.min(0.9, w.w * 0.6), 0.22);
    F.wedge('darkGlass', 0, w.head + 0.04, 0.02, w.w - 0.05, Math.min(0.75, w.w * 0.5), 0.03);
    F.box('gothicTrim', -w.w / 2 - 0.22, w.head + 0.05, 0.12, 0.14, 0.2, 0.24);
    F.box('gothicTrim', w.w / 2 + 0.22, w.head + 0.05, 0.12, 0.14, 0.2, 0.24);
    if (i % 3 !== 1) {
      const sh = (w.head - w.sill), sw = w.w / 2 + 0.04;
      for (const e of [-1, 1]) {
        // every so often one hangs from a single hinge; a few more have lost their catches and swing in the wind
        if (e === 1 && i % 5 === 2) { F.box('shutter', w.w / 2 + sw / 2 + 0.3, w.sill + sh / 2 - 0.3, 0.1, sw, sh, 0.05, -0.35); continue; }
        const loose = (i * 3 + (e > 0 ? 1 : 0)) % 5 === 0 && game.shutters.length < 14;
        if (!loose) { F.box('shutter', e * (w.w / 2 + sw / 2 + 0.16), w.sill + sh / 2, 0.08, sw, sh, 0.05); continue; }
        const [hx, hz] = F.at(e * (w.w / 2 + 0.16), 0.08);
        const pv = new THREE.Group(); pv.position.set(hx, w.sill + sh / 2, hz); pv.rotation.y = F.ry; B.root.add(pv);
        B.box('shutter', e * sw / 2, 0, 0, sw, sh, 0.05, 0, pv);
        for (const ry of [-0.3, 0.3]) { B.box('shutter', e * sw / 2, ry * sh, 0.03, sw - 0.04, 0.08, 0.02, 0, pv); B.box('black', e * 0.12, ry * sh, 0.035, 0.24, 0.025, 0.012, 0, pv); }
        pv.traverse(o => { o.userData.dynamic = true; });
        game.shutters.push({ pv, e, ry: F.ry, a: 0, v: 0, phase: rnd() * 100, reach: 0.8 + rnd() * 0.9, x: hx, y: w.sill + sh / 2, z: hz });
      }
    }
  });

  /* ---- stepped buttresses with pinnacles ---- */
  const buttress = (F, l) => {
    const steps = [[0, 3.2, 0.9, 0.9], [3.2, 6.6, 0.7, 0.62], [6.6, EAVES + 0.4, 0.5, 0.38]];
    for (const [y0, y1, w, d] of steps) {
      F.box('gothicStone', l, (y0 + y1) / 2, d / 2, w, y1 - y0, d);
      F.wedge('gothicTrim', l, y1 - 0.02, d / 2 + 0.02, w + 0.06, 0.3, d + 0.04);
    }
    F.mesh(G.pyramid, 'gothicTrim', l, EAVES + 1.5, 0.2, 0.42, 2.0, 0.42);
    F.box('gothicStone', l, EAVES + 0.35, 0.2, 0.42, 0.7, 0.42);
    const [x0, z0] = F.at(l - 0.45, 0), [x1, z1] = F.at(l + 0.45, 0.9);
    P.addWall(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1), 0, 3.2, { kind: 'wall', structural: false });
  };
  { const F = face(B, 0, 1, 0, 12.2); for (const l of [-12, -6.25, 6.25, 12]) buttress(F, l); }
  { const F = face(B, 0, -1, 0, -12.2); for (const l of [14.4, 9.2, 2.3, -4.5, -10.6, -16.5]) buttress(F, l); } // (x = -l), clear of the back doors and windows
  { const F = face(B, -1, 0, -18.2, 0); for (const l of [-4.2, 2.5]) buttress(F, l); }   // west: z = 4.2, -2.5
  { const F = face(B, 1, 0, 18.2, 0); for (const l of [-4.2, 2.6]) buttress(F, l); }     // east: z = 4.2, -2.6

  /* ---- front gables with lancet windows (one with a candle burning) ---- */
  for (const gx of [-11, 11]) {
    const F = face(B, 0, 1, gx, 12.2);
    F.wedge('gothicStone', 0, EAVES, 0.0, 7, 7, 0.5);
    B.mesh(G.wedge, 'slate', gx, EAVES - 0.1, 7.7, 9.8, 7.4, 7.7, Math.PI / 2);
    lancet(F, 0, 9.6, 1.3, 2.6, { lit: gx < 0 });
    B.mesh(G.spire, 'gothicTrim', gx, EAVES + 7.4, 12.45, 0.45, 1.6, 0.45);
  }
  // the one lit attic window throws a faint light
  B.fixture({ id: 'gable-candle', name: 'Candle in the gable window', circuit: 'fire', kind: 'fire', style: 'none', pos: [-11, 11, 11.9], colour: 0xff9a3a, target: 0.35, range: 5, lightType: 'flicker', corona: 0.5, noFail: true });

  /* ---- the central clock tower over the hall: hollow, and climbable from the attic ---- */
  const T = { x0: -4, x1: 4, z0: 6.5, z1: 12.45, top: 25, base: 10.8, clock: 15.2, belfry: 21.0 };
  BM.TOWER = T;
  B.levelName = 'tower'; B.room = 'clock tower';
  const TW = { t: 0.5, mat: 'gothicStone', y0: EAVES, y1: T.top };
  B.wall('x', T.z1 - 0.25, T.x0, T.x1, TW);          // south: carries the dial
  B.wall('x', T.z0 + 0.25, T.x0, T.x1, TW);          // north
  B.wall('z', T.x0 + 0.25, T.z0, T.z1, TW);          // west
  B.wall('z', T.x1 - 0.25, T.z0, T.z1, TW);          // east
  const IX0 = T.x0 + 0.5, IX1 = T.x1 - 0.5, IZ0 = T.z0 + 0.5, IZ1 = T.z1 - 0.5; // the shaft inside: x -3.5..3.5, z 7..11.95
  {
    const F = face(B, 0, 1, 0, T.z1);
    F.box('gothicTrim', 0, 16.0, 0.08, 8.3, 0.22, 0.18);
    F.box('gothicTrim', 0, 21.3, 0.08, 8.3, 0.22, 0.18);
    lancet(F, -1.6, 12.2, 1.0, 2.8); lancet(F, 1.6, 12.2, 1.0, 2.8);
    // the dial: an opal glass face in a stone ring, lit from behind when the dial lights are on
    { const ring = F.mesh(G.cyl, 'gothicTrim', 0, 18.6, 0.05, 3.2, 0.1, 3.2); ring.rotation.set(Math.PI / 2, F.ry, 0, 'YXZ'); ring.updateMatrix(); }
    const [cx, cz] = F.at(0, 0.14);
    const dialMat = BM.Own(0x3a3328);
    const dial = B.mesh(G.disc, dialMat, cx, 18.6, cz, 2.7); dial.updateMatrix(); dial.userData.dynamic = true;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const m = B.box('black', cx + Math.sin(a) * 1.15, 18.6 + Math.cos(a) * 1.15, cz + 0.02, 0.08, 0.25, 0.02); m.rotation.z = -a; m.updateMatrix(); }
    // the hands pivot at the dial's centre; they are driven by the clock
    const hands = [[0.75, 0.1], [1.15, 0.07]].map(([len, w]) => {
      const pivot = new THREE.Group(); pivot.position.set(cx, 18.6, cz + 0.04); B.root.add(pivot);
      B.box('black', 0, len / 2, 0, w, len, 0.02, 0, pivot);
      B.box('black', 0, -0.12, 0, w * 1.2, 0.24, 0.02, 0, pivot);
      pivot.traverse(o => { o.userData.dynamic = true; });
      return pivot;
    });
    B.mesh(G.sphere, 'black', cx, 18.6, cz + 0.05, 0.1).userData.dynamic = true;
    // belfry: louvred openings
    for (const l of [-1.6, 1.6]) { lancet(F, l, 22.0, 1.1, 2.0); for (let k = 0; k < 5; k++) F.box('boards', l, 22.3 + k * 0.4, 0.1, 1.1, 0.07, 0.1, 0.25); }
    game.towerClock = { dial, dialMat, hands, time: 11 * 3600 + 41 * 60, running: false };
  }
  for (const [nx, nz, px, pz, len] of [[-1, 0, T.x0, (T.z0 + T.z1) / 2, 5.95], [1, 0, T.x1, (T.z0 + T.z1) / 2, 5.95]]) {
    const F = face(B, nx, nz, px, pz);
    F.box('gothicTrim', 0, 16.0, 0.08, len + 0.3, 0.22, 0.18);
    lancet(F, 0, 22.0, 1.0, 2.0, { boarded: nx > 0 });
  }
  // battlements and corner pinnacles, then the spire
  B.boxE('gothicTrim', T.x0 - 0.25, T.x1 + 0.25, T.top, T.top + 0.35, T.z0 - 0.25, T.z1 + 0.25);
  for (let x = T.x0; x <= T.x1 + 0.01; x += 1.0) for (const z of [T.z0 - 0.1, T.z1 + 0.1]) B.box('gothicStone', x, T.top + 0.75, z, 0.5, 0.8, 0.35);
  for (let z = T.z0 + 1; z < T.z1; z += 1.0) for (const x of [T.x0 - 0.1, T.x1 + 0.1]) B.box('gothicStone', x, T.top + 0.75, z, 0.35, 0.8, 0.5);
  for (const x of [T.x0, T.x1]) for (const z of [T.z0, T.z1]) { B.box('gothicStone', x, T.top + 1, z, 0.7, 2, 0.7); B.mesh(G.pyramid, 'slate', x, T.top + 3.3, z, 0.8, 2.6, 0.8); }
  B.mesh(G.pyramid, 'slate', 0, T.top + 0.35 + 5.6, (T.z0 + T.z1) / 2, 7.2, 11.2, 5.4);
  B.mesh(G.post, 'iron', 0, T.top + 12.4, (T.z0 + T.z1) / 2, 0.06, 1.8, 0.06);
  B.box('iron', 0, T.top + 12.9, (T.z0 + T.z1) / 2, 0.9, 0.05, 0.05);
  B.box('iron', 0.2, T.top + 13.2, (T.z0 + T.z1) / 2, 0.5, 0.3, 0.02); // the weathervane's pennant

  /* ---- inside the tower ---- */
  // the base room over the roof, reached by a ladder from the attic through a hatch
  B.floor('boards', IX0, IX1, IZ0, IZ1, T.base, 0.2, [[-0.6, 0.6, IZ0, IZ0 + 1.0]]);
  B.boxE('darkWood', -0.7, 0.7, T.base, T.base + 0.08, IZ0 - 0.1, IZ0 + 1.1);
  B.levelName = 'attic';
  for (let i = 0; i < 7; i++) B.box('wood', 0, 8.45 + i * 0.36, 6.2 + i * 0.17, 0.6, 0.05, 0.08);
  for (const sx of [-0.32, 0.32]) { const r = B.box('wood', sx, 9.55, 6.75, 0.05, 2.9, 0.08); r.rotation.x = -0.4; r.updateMatrix(); }
  B.interactable({
    id: 'ladder-tower-up', kind: 'ladder', label: 'Climb up into the clock tower', pos: [0, 8.9, 6.1], n: [0, -1], approachDist: 0.85,
    links: [{ x: 0, y: T.base, z: IZ0 + 1.5 }], act: g => g.climb({ x: 0, y: T.base, z: IZ0 + 1.5 }, Math.PI),
  });
  B.levelName = 'tower';
  B.interactable({
    id: 'ladder-tower-down', kind: 'ladder', label: 'Climb down to the attic', pos: [0, T.base + 0.5, IZ0 + 0.5], n: [0, 1], approachDist: 0.85,
    links: [{ x: 0, y: 8.2, z: 5.6 }], act: g => g.climb({ x: 0, y: 8.2, z: 5.6 }, 0),
  });
  // a timber stair in two flights: along the south wall, a landing on the east, back along the north wall
  const F1 = { x0: -3.2, x1: 2.4, z0: IZ1 - 1.1, z1: IZ1, ya: T.base, yb: 13.0 };
  const F2 = { x0: -3.2, x1: 2.4, z0: IZ0, z1: IZ0 + 1.1, ya: 13.0, yb: T.clock };
  const stairs = (f, dir) => {
    P.ramp(f.x0, f.x1, f.z0, f.z1, 'x', dir > 0 ? f.ya : f.yb, dir > 0 ? f.yb : f.ya, f.ya - 0.3, 'tower stair');
    const n = 14, run = (f.x1 - f.x0) / n, rise = (f.yb - f.ya) / n;
    for (let i = 0; i < n; i++) {
      const x = dir > 0 ? f.x0 + run * (i + 0.5) : f.x1 - run * (i + 0.5), y = f.ya + rise * i;
      B.box('boards', x, y + rise / 2 - 0.02, (f.z0 + f.z1) / 2, run + 0.02, rise, f.z1 - f.z0);
    }
  };
  stairs(F1, 1); stairs(F2, -1);
  P.rect(2.4, IX1, IZ0, IZ1, 13.0, 12.7, 'tower landing'); B.boxE('boards', 2.4, IX1, 12.7, 13.0, IZ0, IZ1);
  // rails on the open sides, and posts
  const rail = (x0, x1, z0, z1, ya, yb) => {
    P.addWall(x0, x1, z0, z1, Math.min(ya, yb), Math.max(ya, yb) + 1.0, { kind: 'rail', tag: 'stair rail', occludes: false });
    const n = Math.max(2, Math.round((x1 - x0) / 0.9));
    for (let i = 0; i <= n; i++) { const u = i / n; B.box('darkWood', x0 + (x1 - x0) * u, ya + (yb - ya) * u + 0.5, (z0 + z1) / 2, 0.06, 1.0, 0.06); }
    const m = B.box('darkWood', (x0 + x1) / 2, (ya + yb) / 2 + 0.98, (z0 + z1) / 2, Math.hypot(x1 - x0, yb - ya), 0.07, 0.07);
    m.rotation.z = Math.atan2(yb - ya, x1 - x0); m.updateMatrix();
  };
  rail(F1.x0 + 1.0, F1.x1, F1.z0 - 0.08, F1.z0, F1.ya + 1.0 * (F1.yb - F1.ya) / (F1.x1 - F1.x0), F1.yb); // open at the foot, where you step on
  B.box('darkWood', 2.45, 13.5, (IZ0 + IZ1) / 2, 0.06, 1.0, IZ1 - IZ0 - 2.2); P.addWall(2.42, 2.48, IZ0 + 1.1, IZ1 - 1.1, 13.0, 14.0, { kind: 'rail', occludes: false });
  // the clock room, with the stair coming up through a hole along the north side
  B.levelName = 'clock'; B.room = 'clock room';
  B.floor('boards', IX0, IX1, IZ0, IZ1, T.clock, 0.25, [[-3.5, 3.5, IZ0, IZ0 + 1.1], [-0.3, 0.3, 9.9, 10.5], [2.3, 3.5, 8.5, 9.7]]);
  rail(-1.9, 3.5, IZ0 + 1.1, IZ0 + 1.18, T.clock, T.clock); // round the stairwell, open where the stair arrives
  // the mechanism: a flatbed turret clock on a timber frame, its pendulum through the floor, its weights in a trunk
  for (const [x, z] of [[-0.7, 9.8], [0.7, 9.8], [-0.7, 10.7], [0.7, 10.7]]) B.box('boards', x, T.clock + 0.4, z, 0.12, 0.8, 0.12);
  B.box('metalDark', 0, T.clock + 0.86, 10.25, 1.7, 0.12, 1.1);
  B.box('metalDark', 0, T.clock + 1.05, 10.25, 1.4, 0.3, 0.16);
  for (const [x, r] of [[-0.45, 0.28], [0.05, 0.2], [0.5, 0.32]]) { const w = B.mesh(G.cyl, 'brass', x, T.clock + 1.15, 10.25, r * 2, 0.04, r * 2); w.rotation.x = Math.PI / 2; w.updateMatrix(); }
  B.mesh(G.cyl, 'brass', -0.2, T.clock + 1.35, 10.25, 0.16, 0.05, 0.16).rotation.x = Math.PI / 2;
  B.furniture('boards', -3.2, 8.75, T.base, 0.5, T.clock + 1.8 - T.base, 0.5, 'weight trunk');
  { const pend = new THREE.Group(); pend.position.set(0, T.clock + 1.2, 10.2); B.root.add(pend);
    B.mesh(G.post, 'iron', 0, -1.1, 0, 0.025, 2.2, 0.025, 0, pend); B.mesh(G.cyl, 'brass', 0, -2.15, 0, 0.3, 0.1, 0.3, 0, pend);
    pend.traverse(o => { o.userData.dynamic = true; }); game.towerClock.pendulum = pend; }
  // the motion rod to the dial
  B.mesh(G.post, 'iron', 0.6, T.clock + 1.85, 10.25, 0.03, 1.5, 0.03);
  B.box('iron', 0.3, 18.6, 11.1, 0.6, 0.03, 0.03); B.box('iron', 0, 18.6, 11.5, 0.03, 0.03, 0.9);
  B.furniture('wood', 2.6, 11.2, T.clock, 0.45, 0.5, 0.45, "winder's stool");
  B.mesh(G.cyl, 'brass', -2.4, T.clock + 0.1, 11.4, 0.1, 0.2, 0.1); // the oil can
  B.box('iron', -1.0, T.clock + 1.6, 11.85, 0.5, 0.05, 0.05); B.box('iron', -1.2, T.clock + 1.42, 11.85, 0.05, 0.36, 0.05); // the winding crank on its hook
  B.readable('note-clock', "Clockwinder's card", 'BLACKTHORN MANOR — TOWER CLOCK\nPardoe & Son, Electrical & Horological.\n\nMovement converted to electric drive 1961: it keeps time while the house supply is on and stops dead when it is off. Quarters on the four small bells, hours on the great bell.\n\nDial lamps behind the glass: switch by the stairhead. Mind the pendulum.\n\nWound and oiled: 21 Oct 1974. — T.P.', [-2.0, T.clock + 0.9, 11.7], [0, -1], { plaque: true });
  // the dial lamps behind the opal glass, and the glow they throw out over the forecourt
  B.fixture({ id: 'clock-dial-1', name: 'Dial lamp', circuit: 'attic', kind: 'incandescent', style: 'bulkhead', pos: [-1.3, 18.2, IZ1 - 0.06], nz: -1, colour: 0xffd8a0, target: 1.0, range: 7, on: false });
  B.fixture({ id: 'clock-dial-2', name: 'Dial lamp', circuit: 'attic', kind: 'incandescent', style: 'bulkhead', pos: [1.3, 18.2, IZ1 - 0.06], nz: -1, colour: 0xffd8a0, target: 1.0, range: 7, on: false });
  B.fixture({ id: 'clock-face', name: 'Clock face', circuit: 'attic', kind: 'incandescent', style: 'none', pos: [0, 18.6, T.z1 + 0.2], colour: 0xffe2b0, target: 1.6, range: 18, spot: true, dir: [0, -0.35, 1], on: false, noFail: true, corona: 0.8 });
  B.lightSwitch('sw-clock-dial', 'Clock dial lights', [-1.6, T.clock + 1.4, IZ0 + 1.55], [0, 1], ['clock-dial-1', 'clock-dial-2', 'clock-face']);
  B.fixture({ id: 'clock-room-bulb', name: 'Clock room bulb', circuit: 'attic', style: 'cage', pos: [0, T.clock + 2.6, 9.0], colour: 0xffc070, target: 0.9, range: 7 });
  B.fixture({ id: 'tower-base-bulb', name: 'Tower stair bulb', circuit: 'attic', style: 'cage', pos: [0, T.base + 2.4, 9.5], colour: 0xffc070, target: 0.9, range: 8, flicker: 0.15 });
  B.lightSwitch('sw-clock-room', 'Tower lights', [-2.2, T.clock + 1.4, IZ0 + 1.55], [0, 1], ['clock-room-bulb', 'tower-base-bulb', 'belfry-bulb']);
  // a ladder on up to the belfry
  for (let i = 0; i < 12; i++) B.box('wood', 2.9, T.clock + 0.4 + i * 0.4, 9.1, 0.6, 0.05, 0.08);
  B.box('wood', 2.58, T.clock + 2.6, 9.1, 0.05, 5.2, 0.08); B.box('wood', 3.22, T.clock + 2.6, 9.1, 0.05, 5.2, 0.08);
  B.interactable({
    id: 'ladder-belfry-up', kind: 'ladder', label: 'Climb to the belfry', pos: [2.9, T.clock + 1.3, 9.1], n: [0, 1], approachDist: 0.85,
    links: [{ x: 2.9, y: T.belfry, z: 10.4 }], act: g => g.climb({ x: 2.9, y: T.belfry, z: 10.4 }, Math.PI),
  });
  B.levelName = 'belfry'; B.room = 'belfry';
  B.floor('boards', IX0, IX1, IZ0, IZ1, T.belfry, 0.2, [[2.3, 3.5, 8.5, 9.7]]);
  B.interactable({
    id: 'ladder-belfry-down', kind: 'ladder', label: 'Climb down to the clock room', pos: [2.9, T.belfry + 0.5, 9.1], n: [0, 1], approachDist: 0.85,
    links: [{ x: 2.9, y: T.clock, z: 10.4 }], act: g => g.climb({ x: 2.9, y: T.clock, z: 10.4 }, Math.PI),
  });
  P.addWall(2.3, 3.5, 8.4, 8.5, T.belfry, T.belfry + 1, { kind: 'rail', occludes: false }); P.addWall(2.2, 2.3, 8.4, 9.7, T.belfry, T.belfry + 1, { kind: 'rail', occludes: false });
  B.box('darkWood', 2.9, T.belfry + 0.5, 8.45, 1.2, 1.0, 0.06); B.box('darkWood', 2.25, T.belfry + 0.5, 9.1, 0.06, 1.0, 1.3);
  B.boxE('boards', IX0, IX1, T.top - 0.25, T.top, IZ0, IZ1); // the ceiling under the spire
  // the bells: four quarter bells on a beam, and the great hour bell with its hammer
  B.box('boards', 0, T.belfry + 3.0, 8.0, 6.4, 0.3, 0.3);
  for (const x of [-2.4, -0.8, 0.8, 2.4]) { B.mesh(G.cone, 'brass', x, T.belfry + 2.55, 8.0, 0.5, 0.55, 0.5); B.mesh(G.sphere, 'brass', x, T.belfry + 2.85, 8.0, 0.14); }
  for (const x of [-3.0, 3.0]) B.box('boards', x, T.belfry + 1.5, 8.0, 0.3, 3.0, 0.3);
  B.box('boards', 0, T.belfry + 3.3, 10.3, 1.6, 0.4, 0.4);
  for (const x of [-0.6, 0.6]) B.box('boards', x, T.belfry + 1.65, 10.3, 0.3, 3.3, 0.3);
  { B.mesh(G.cone, 'brass', 0, T.belfry + 2.45, 10.3, 1.1, 1.3, 1.1);
    B.mesh(G.sphere, 'brass', 0, T.belfry + 3.05, 10.3, 0.3);
    const hammer = new THREE.Group(); hammer.position.set(0.9, T.belfry + 2.9, 10.3); B.root.add(hammer);
    B.mesh(G.post, 'iron', 0, -0.5, 0, 0.04, 1.0, 0.04, 0, hammer); B.box('iron', 0, -1.0, 0, 0.18, 0.16, 0.16, 0, hammer);
    hammer.traverse(o => { o.userData.dynamic = true; });
    game.towerClock.hammer = hammer; game.towerClock.bellPos = { x: 0, y: T.belfry + 2.4, z: 10.3 }; game.towerClock.mechPos = { x: 0, y: T.clock + 1.2, z: 10.25 };
  }
  B.fixture({ id: 'belfry-bulb', name: 'Belfry bulb', circuit: 'attic', style: 'cage', pos: [-1.5, T.belfry + 2.2, 9.6], colour: 0xffc070, target: 0.8, range: 7, flicker: 0.25 });
  B.levelName = 'ground'; B.room = 'exterior';

  /* ---- four octagonal corner towers with slate spires ---- */
  const tower = (cx, cz) => {
    const R = 3.2, H = 24;
    const body = B.mesh(G.post, 'gothicStone', cx, H / 2, cz, R * 2, H, R * 2); body.rotation.y = Math.PI / 8; body.updateMatrix();
    for (const y of [4.15, EAVES, 16]) { const b = B.mesh(G.post, 'gothicTrim', cx, y, cz, R * 2 + 0.3, 0.25, R * 2 + 0.3); b.rotation.y = Math.PI / 8; b.updateMatrix(); }
    const crown = B.mesh(G.post, 'gothicTrim', cx, H + 0.4, cz, R * 2 + 0.8, 0.8, R * 2 + 0.8); crown.rotation.y = Math.PI / 8; crown.updateMatrix();
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; B.box('gothicStone', cx + Math.sin(a) * (R + 0.3), H + 1.1, cz + Math.cos(a) * (R + 0.3), 0.55, 0.7, 0.35, a); }
    B.mesh(G.spire, 'slate', cx, H + 0.8 + 6.5, cz, R * 2 + 0.4, 13, R * 2 + 0.4);
    B.mesh(G.sphere, 'iron', cx, H + 14.1, cz, 0.3);
    B.mesh(G.post, 'iron', cx, H + 14.9, cz, 0.05, 1.6, 0.05);
    // lancets on the faces turned away from the house
    const out = Math.atan2(cx, cz);
    [[-0.5, 2.0, {}], [0.5, 9.4, { boarded: true }], [0, 17.2, { lit: cz > 0 && cx < 0 }], [1.3, 9.4, {}], [-1.3, 17.2, {}]].forEach(([da, y, o]) => {
      const a = out + da, apothem = R * Math.cos(Math.PI / 8);
      const F = face(B, Math.sin(a), Math.cos(a), cx + Math.sin(a) * apothem, cz + Math.cos(a) * apothem);
      lancet(F, 0, y, 0.8, 2.2, o);
    });
    P.addWall(cx - 2.95, cx + 2.95, cz - 2.95, cz + 2.95, 0, H, { kind: 'wall', structural: false });
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tower(sx * 21, sz * 15);
  game.towers = [[-21, 15], [21, 15], [-21, -15], [21, -15]];

  /* ---- tall chimney stacks with pots ---- */
  for (const [x, z] of [[-10, 0], [10, 0], [-15.5, -6], [15.5, 6]]) {
    B.box('brick', x, 18.6, z, 1.6, 5.4, 1.4);
    B.box('gothicTrim', x, 21.4, z, 1.9, 0.3, 1.7);
    for (const dx of [-0.4, 0.4]) B.mesh(G.cyl, 'brick', x + dx, 22.0, z, 0.36, 0.9, 0.36);
  }

  /* ---- gargoyles at the corners of the cornice and the clock tower ---- */
  const gargoyle = (x, y, z, ang) => {
    const s = Math.sin(ang), c = Math.cos(ang);
    B.mesh(G.sphere, 'gothicTrim', x + s * 0.3, y, z + c * 0.3, 0.55, 0.45, 0.75, ang);
    B.mesh(G.sphere, 'gothicTrim', x + s * 0.75, y + 0.15, z + c * 0.75, 0.32, 0.3, 0.38, ang);
    for (const h of [-1, 1]) B.mesh(G.cone, 'gothicTrim', x + s * 0.72 + c * 0.1 * h, y + 0.38, z + c * 0.72 - s * 0.1 * h, 0.06, 0.22, 0.06, ang);
    for (const h of [-1, 1]) B.mesh(G.wedge, 'gothicTrim', x + c * 0.32 * h, y + 0.15, z - s * 0.32 * h, 0.5, 0.55, 0.06, ang);
    B.mesh(G.cyl, 'iron', x + s * 0.95, y + 0.05, z + c * 0.95, 0.06, 0.06, 0.06);
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) gargoyle(sx * 18.1, EAVES - 0.2, sz * 12.0, Math.atan2(sx, sz));
  for (const sx of [-1, 1]) gargoyle(sx * 4.1, T.top - 0.3, 12.4, Math.atan2(sx, 1));
  for (const x of [-3, 3]) gargoyle(x, 15.5, 12.6, 0);

  /* ---- the gothic porch ---- */
  B.room = 'porch';
  for (const sx of [-1, 1]) {
    B.solid('gothicStone', sx * 2.6 - 0.3, sx * 2.6 + 0.3, 0, 3.8, 14.1, 14.7, { kind: 'furniture', tag: 'porch pier' });
    B.mesh(G.pyramid, 'gothicTrim', sx * 2.6, 4.6, 14.4, 0.5, 1.6, 0.5);
  }
  B.mesh(G.wedge, 'gothicStone', 0, 3.6, 14.65, 0.4, 1.5, 6.0, Math.PI / 2);
  B.mesh(G.wedge, 'darkGlass', 0, 3.4, 14.68, 0.42, 1.2, 4.2, Math.PI / 2); // the shadow of the arch
  B.mesh(G.wedge, 'slate', 0, 3.5, 13.45, 2.8, 1.6, 6.6, Math.PI / 2);
  B.mesh(G.wedge, 'darkWood', 0, 3.2, 12.28, 0.06, 0.9, 2.4, Math.PI / 2); // pointed tympanum over the doors

  /* ======================= THE GROUNDS ======================= */
  B.zone = 'exterior'; B.room = 'grounds';
  /* ---- weeping angels by the porch, one beheaded ---- */
  const angel = (x, z, ang, headless) => {
    P.addWall(x - 0.45, x + 0.45, z - 0.45, z + 0.45, 0, 1.2, { kind: 'furniture', tag: 'angel plinth' });
    BM.plinth(B, x, z, 0.9, 1.2);
    BM.figure(B, x, 1.2, z, ang, { pose: 'weep', wings: true, headless, scale: 1.12 });
    if (headless) BM.fallenHead(B, x + Math.sin(ang) * 1.0 + 0.5, z + Math.cos(ang) * 1.0, 0.8); // the head, in the grass
  };
  angel(-4.9, 15.6, 0.0, false);
  angel(4.9, 15.6, 0.0, true);
  /* ---- a toppled urn in the fountain garden ---- */
  { BM.urn(B, 2.9, 0.33, 21.3, 0.95, 0.7);
    BM.plinth(B, 2.2, 20.6, 0.55, 0.7);
    P.addWall(2.2, 3.2, 20.6, 21.8, 0, 0.7, { kind: 'furniture', tag: 'urn' }); }

  /* ---- the family mausoleum ---- */
  B.room = 'mausoleum';
  const MZ = { x0: 35, x1: 41, z0: 23.5, z1: 27.5 };
  B.solid('gothicStone', MZ.x0, MZ.x1, 0, 3.6, MZ.z0, MZ.z1, { kind: 'wall', structural: false });
  B.mesh(G.wedge, 'slate', (MZ.x0 + MZ.x1) / 2, 3.6, (MZ.z0 + MZ.z1) / 2, 6.6, 2.2, 4.8);
  B.mesh(G.wedge, 'gothicStone', (MZ.x0 + MZ.x1) / 2, 3.6, MZ.z0 - 0.35, 0.3, 2.0, 6.2, Math.PI / 2);
  for (const dx of [-2.2, 2.2]) B.mesh(G.cyl, 'gothicTrim', 38 + dx, 1.8, MZ.z0 - 0.3, 0.45, 3.6, 0.45);
  B.boxE('darkGlass', 37.0, 39.0, 0.0, 2.4, MZ.z0 - 0.02, MZ.z0);
  B.mesh(G.wedge, 'darkGlass', 38, 2.4, MZ.z0 - 0.01, 0.04, 0.8, 2.0, Math.PI / 2);
  for (let i = 0; i < 7; i++) B.mesh(G.post, 'iron', 37.15 + i * 0.28, 1.3, MZ.z0 - 0.08, 0.04, 2.6, 0.04);
  B.box('brass', 38, 3.2, MZ.z0 - 0.05, 2.4, 0.3, 0.04);
  B.readable('plaque-mausoleum', 'The mausoleum door', 'BLACKTHORN\n\nCharles · Margaret · Edmund\n\nThe iron gate is chained shut. Inside, in the dark, there are six shelves. One has never been used and never will be.', [36.3, 1.4, 23.4], [0, -1], { plaque: true });

  /* ---- an old stone well ---- */
  B.room = 'well';
  B.solid(null, -14.0, -12.0, 0, 0.9, 30.0, 32.0, { kind: 'furniture', tag: 'well' });
  B.mesh(G.cyl, 'stone', -13, 0.45, 31, 2.0, 0.9, 2.0);
  B.mesh(G.cyl, 'black', -13, 0.91, 31, 1.6, 0.02, 1.6);
  for (const dx of [-0.95, 0.95]) B.mesh(G.post, 'darkWood', -13 + dx, 1.5, 31, 0.12, 2.4, 0.12);
  B.mesh(G.wedge, 'slate', -13, 2.6, 31, 2.4, 0.8, 1.6);
  { const ax = B.mesh(G.cyl, 'darkWood', -13, 2.25, 31, 0.12, 1.8, 0.12); ax.rotation.z = Math.PI / 2; ax.updateMatrix(); }
  B.mesh(G.post, 'deadStalk', -13, 1.6, 31, 0.02, 1.3, 0.02);
  B.mesh(G.cyl, 'iron', -13, 0.95, 31, 0.3, 0.32, 0.3);

  /* ---- a rope swing on one of the dead trees, moving on its own ---- */
  game.swings = [];
  const cand = (game.deadTrees || []).find(t => t.tips.some(p => p[1] > 3.5 && p[1] < 6 && Math.hypot(p[0] - t.x, p[2] - t.z) > 1.4));
  if (cand) {
    const tip = cand.tips.find(p => p[1] > 3.5 && p[1] < 6 && Math.hypot(p[0] - cand.x, p[2] - cand.z) > 1.4);
    const pivot = new THREE.Group(); pivot.position.set(tip[0], tip[1], tip[2]);
    pivot.rotation.order = 'YXZ';
    pivot.rotation.y = Math.atan2(tip[0] - cand.x, tip[2] - cand.z);
    B.root.add(pivot);
    const L = tip[1] - 0.55;
    for (const h of [-0.22, 0.22]) B.mesh(G.post, 'deadStalk', h, -L / 2, 0, 0.025, L, 0.025, 0, pivot);
    B.box('boards', 0, -L, 0, 0.6, 0.05, 0.22, 0, pivot);
    pivot.traverse(o => { o.userData.dynamic = true; });
    game.swings.push({ pivot, phase: rnd() * 6 });
  }
};
/* The loose shutters: the wind takes them out from the wall, slowly, and lets them fall back with a knock. */
BM.updateShutters = function (game, dt, t) {
  const list = game.shutters; if (!list || !list.length) return;
  const p = game.player, A = game.audio;
  const gust = Math.max(0, BM.noise1(t * 0.13) * 1.3 - 0.25); // the storm's own gusts, shared by every shutter
  for (const s of list) {
    const local = Math.max(0, BM.noise1(t * 0.31 + s.phase)); // and each one catching it differently
    const target = Math.min(1.9, gust * local * s.reach * 2.2) - 0.5 * (1 - local); // out on a gust; pressed back to the wall when it turns
    s.v += ((target - s.a) * 1.6 - s.v * 1.1) * dt;                 // a soft spring: slow swings, not snaps
    s.a += s.v * dt;
    if (s.a < 0) {
      if (s.v < -0.35) {
        const d = Math.hypot(s.x - p.x, s.z - p.z), vol = Math.max(0, 1 - d / 30) * Math.min(1, -s.v / 1.5);
        if (vol > 0.03 && A.shutterKnock) { const dx = (s.x - p.x) / (d || 1), dz = (s.z - p.z) / (d || 1); A.shutterKnock(vol, Math.max(-1, Math.min(1, dx * Math.cos(p.yaw) - dz * Math.sin(p.yaw)))); }
      }
      s.a = 0; s.v = -s.v * 0.25;
    }
    if (Math.abs(s.v) > 0.5 && !s.creaking && A.shutterCreak) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < 18) { s.creaking = true; A.shutterCreak(Math.max(0, 1 - d / 18) * 0.6); } }
    if (Math.abs(s.v) < 0.2) s.creaking = false;
    s.pv.rotation.y = s.ry - s.e * s.a; s.pv.updateMatrix();
  }
};
})();
