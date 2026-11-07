/* ==========================================================================
   BLACKTHORN MANOR — 6h. THE OLD ROAD
   Blackthorn Lane: a country road nobody maintains any more, running for
   miles through pine forest. Cracked, patched tarmac with weeds in the
   seams, potholes full of rain and a centre line worn almost away. Timber
   power poles lean along the far verge, sagging wires between them, and
   the three sodium street lights hang off their arms. Past the estate the
   road runs on into the trees and the fog.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildRoad = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lane';
  const L = BM.LANE, limb = BM.limb;
  const rnd = BM.mulberry32(1974);
  const X0 = -184, X1 = 184, R0 = 91.9, R1 = 96.1; // the tarmac, either side of the lane's centre (z 94)
  const stats = { poles: 0, spans: 0, trees: 0, potholes: 0 };

  /* ---- the forest floor beyond the estate wall, all round ---- */
  B.boxE('soil', -220, -64.4, -0.02, 0.0, -140, 170);
  B.boxE('soil', 64.4, 220, -0.02, 0.0, -140, 170);
  B.boxE('soil', -64.4, 64.4, -0.02, 0.0, 100.6, 170);
  B.boxE('soil', -64.4, 64.4, -0.02, 0.0, -140, -54.4);
  // the verge beyond the estate, either side of the road
  for (const [a, b] of [[X0, -64], [64, X1]]) B.boxE('soil', a, b, 0, 0.02, 88.2, 100.6);

  /* ---- the road ---- */
  B.boxE('asphalt', X0, X1, 0, 0.035, R0, R1);
  // the apron from the gates, gravel gone to moss
  B.boxE('gravelOld', -3.4, 3.4, 0, 0.03, 88.2, R0 + 0.1);
  // the centre line: what is left of it
  for (let x = X0 + 2; x < X1 - 2; x += 6) {
    if (rnd() < 0.38) continue;
    const len = 1.2 + rnd() * 1.6;
    B.box('roadPaint', x + rnd() * 0.6, 0.037, 94 + (rnd() - 0.5) * 0.06, len, 0.004, 0.11, (rnd() - 0.5) * 0.02);
  }
  // crumbling edges: the verge creeping over the tarmac
  for (let x = X0; x < X1; x += 2.5 + rnd() * 3) {
    for (const edge of [R0, R1]) {
      if (rnd() < 0.45) continue;
      const w = 0.3 + rnd() * 0.6, l = 1 + rnd() * 2.5;
      B.box(rnd() < 0.5 ? 'soil' : 'moss', x, 0.038, edge + (edge === R0 ? w / 2 - 0.15 : 0.15 - w / 2), l, 0.006, w, (rnd() - 0.5) * 0.3);
    }
  }
  // patches of newer tarmac, now cracked themselves
  for (let i = 0; i < 26; i++) {
    const x = X0 + rnd() * (X1 - X0);
    B.box('tarPatch', x, 0.036, 92.6 + rnd() * 2.8, 1.2 + rnd() * 2.4, 0.003, 0.8 + rnd() * 1.4, (rnd() - 0.5) * 0.4);
  }
  // potholes holding rain
  for (let i = 0; i < 46; i++) {
    const x = X0 + rnd() * (X1 - X0), z = 92.3 + rnd() * 3.4, s = 0.35 + rnd() * 0.9;
    if (Math.abs(x - BM.CAR.stopX) < 3 && z > 95) continue;
    B.box('soil', x, 0.037, z, s * 1.25, 0.004, s * 1.05, rnd() * 3);
    B.box('water', x, 0.039, z, s, 0.003, s * 0.8, rnd() * 3);
    stats.potholes++;
  }
  // weeds in the cracks and along the crown, dead leaves blown across
  for (let i = 0; i < 300; i++) {
    const x = X0 + rnd() * (X1 - X0);
    const z = rnd() < 0.35 ? 94 + (rnd() - 0.5) * 0.5 : rnd() < 0.5 ? R0 + rnd() * 0.5 : R1 - rnd() * 0.5;
    // a tuft: a few thin blades splayed out of the crack
    for (let k = 0; k < 3; k++) {
      const h = 0.1 + rnd() * 0.22, a = rnd() * 6.3, l = 0.06 + rnd() * 0.08;
      limb(B, rnd() < 0.6 ? 'weed' : 'deadGrass', [x, 0.03, z], [x + Math.cos(a) * l, h, z + Math.sin(a) * l], 0.012 + rnd() * 0.01, G.cone);
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = X0 + rnd() * (X1 - X0), z = R0 + rnd() * (R1 - R0);
    B.box(rnd() < 0.5 ? 'leafLitter' : 'leafLitter2', x, 0.04, z, 0.12 + rnd() * 0.2, 0.004, 0.08 + rnd() * 0.12, rnd() * 3);
  }
  // bracken and long grass on the verges
  for (let i = 0; i < 520; i++) {
    const far = rnd() < 0.6, x = X0 + rnd() * (X1 - X0);
    const z = far ? R1 + 0.2 + rnd() * 4.6 : 88.4 + rnd() * (R0 - 88.6);
    if (!far && Math.abs(x) < 64) continue; // inside the estate the verge is already dressed
    if (far && Math.abs(x - BM.CAR.stopX) < 3 && z < 98.8) continue;
    const h = 0.3 + rnd() * 0.7, mat = rnd() < 0.5 ? 'weed' : rnd() < 0.6 ? 'deadGrass' : 'thorn';
    for (let k = 0; k < 4; k++) {
      const a = rnd() * 6.3, l = 0.1 + rnd() * 0.25;
      limb(B, mat, [x, 0.02, z], [x + Math.cos(a) * l, h * (0.6 + rnd() * 0.4), z + Math.sin(a) * l], 0.02 + rnd() * 0.02, G.cone);
    }
  }

  /* ---- the power poles along the far verge ---- */
  const poles = [];
  for (let x = L.from; x <= L.to; x += L.span) {
    const lamp = L.lampXs.indexOf(x) >= 0, broken = x === 152;
    const h = 8.6;
    // old poles lean: towards the road, away from it, along it
    const lean = lamp ? 0.012 : (rnd() - 0.4) * 0.09, along = lamp ? 0 : (rnd() - 0.5) * 0.05;
    const base = [x, 0, L.poleZ + (rnd() - 0.5) * 0.3];
    if (broken) {
      // snapped in a storm: a stump, and the rest of it down in the bracken
      limb(B, 'pole', base, [x, 2.1, base[2]], 0.14, G.cyl);
      limb(B, 'pole', [x + 0.4, 0.25, base[2] + 0.6], [x + 6.2, 0.35, base[2] + 2.8], 0.13, G.cyl);
      B.box('pole', x + 6.4, 0.4, base[2] + 2.9, 0.12, 0.12, 2.0, 1.2);
      poles.push({ x, broken: true, top: [x, 2.1, base[2]] });
      continue;
    }
    const top = [x + along * h, h, base[2] - lean * h];
    limb(B, 'pole', base, top, 0.14, G.cyl);
    B.mesh(G.cone, 'pole', top[0], h + 0.08, top[2], 0.3, 0.16, 0.3); // weathered cap
    // the crossarm, three glass insulators
    B.box('pole', top[0], h - 0.35, top[2], 0.12, 0.12, 2.1);
    limb(B, 'pole', [top[0], h - 1.1, top[2]], [top[0], h - 0.4, top[2] - 0.8], 0.03);
    limb(B, 'pole', [top[0], h - 1.1, top[2]], [top[0], h - 0.4, top[2] + 0.8], 0.03);
    const ends = [];
    for (const o of [-0.9, 0, 0.9]) {
      const y = h - 0.22 + (o === 0 ? 0.42 : 0);
      B.mesh(G.cyl, 'insulator', top[0], y - 0.06, top[2] + o, 0.09, 0.14, 0.09);
      ends.push([top[0], y, top[2] + o]);
    }
    // a rusted step bolt here and there, and the pole's number plate
    for (let k = 0; k < 5; k++) B.box('rust', x + (k % 2 ? 0.14 : -0.14), 2.6 + k * 0.9, base[2], 0.18, 0.03, 0.03);
    if (lamp) {
      // the lantern's arm reaches out over the road
      const a0 = [x, 7.2, base[2] - 0.1], a1 = [x, 6.75, L.armZ + 0.2];
      limb(B, 'iron', a0, [x, 7.0, (a0[2] + a1[2]) / 2 + 0.3], 0.05);
      limb(B, 'iron', [x, 7.0, (a0[2] + a1[2]) / 2 + 0.3], a1, 0.045);
      limb(B, 'iron', [x, 6.2, base[2] - 0.12], [x, 6.95, (a0[2] + a1[2]) / 2 + 0.4], 0.03);
      limb(B, 'iron', a1, [x, L.lampY + 0.22, L.armZ + 0.1], 0.04);
      // the feed from the lines down the pole to the lantern
      limb(B, 'wire', ends[0], [x - 0.05, 7.2, base[2] - 0.14], 0.012);
      B.box('metalDark', x, 3.0, base[2] - 0.16, 0.22, 0.34, 0.12); // the photocell box, long dead
    }
    poles.push({ x, ends, top });
    stats.poles++;
  }
  // the transformer that fed the house, and the drop across the lane to the lodge
  const feed = poles.find(p => p.x === -8);
  if (feed) {
    const t = feed.top;
    B.mesh(G.cyl, 'metalDark', t[0] + 0.32, 6.2, t[2] + 0.05, 0.62, 1.1, 0.62);
    B.mesh(G.disc, 'metalDark', t[0] + 0.32, 6.76, t[2] + 0.05, 0.62, 1, 0.62);
    for (const o of [-0.15, 0.15]) B.mesh(G.cyl, 'insulator', t[0] + 0.32 + o, 6.88, t[2] + 0.05, 0.08, 0.16, 0.08);
    const a = [t[0] + 0.32, 6.9, t[2] + 0.05], b = [-8.2, 3.05, 87.8], n = 8;
    let prev = a;
    for (let i = 1; i <= n; i++) {
      const u = i / n, p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - 1.1 * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      limb(B, 'wire', prev, p, 0.014); prev = p;
    }
    B.box('metalDark', -8.2, 2.9, 87.95, 0.26, 0.3, 0.14); // the service head on the lodge wall
  }
  // the lines, sagging between the poles
  const sag = (a, b, s, segs) => {
    let prev = a;
    for (let i = 1; i <= segs; i++) {
      const u = i / segs, p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - s * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      limb(B, 'wire', prev, p, 0.012); prev = p;
    }
  };
  for (let i = 0; i < poles.length - 1; i++) {
    const p = poles[i], q = poles[i + 1];
    if (p.broken || q.broken) {
      // the lines from the snapped pole lie slack in the verge
      const whole = p.broken ? q : p, down = p.broken ? p : q;
      for (const e of whole.ends) sag(e, [down.x + (whole.x < down.x ? -1.5 : 1.5), 0.15, down.top[2] + 1.2 + e[2] - whole.top[2]], 1.4, 8);
      continue;
    }
    for (let k = 0; k < 3; k++) sag(p.ends[k], q.ends[k], 0.75 + rnd() * 0.5 + (i === 4 && k === 2 ? 2.4 : 0), 6);
    stats.spans++;
  }

  /* ---- the forest: tall black pines, with dead trees leaning out over the road ---- */
  const pine = (x, z, s) => {
    const h = (11 + rnd() * 7) * s;
    B.mesh(G.cyl, 'bark', x, h * 0.3, z, 0.36 * s, h * 0.6, 0.36 * s);
    const tiers = 4;
    for (let k = 0; k < tiers; k++) {
      const u = k / tiers, w = (3.6 - u * 2.6) * s * (0.85 + rnd() * 0.3), th = h * 0.36;
      B.mesh(G.cone, rnd() < 0.5 ? 'pine' : 'pineDark', x + (rnd() - 0.5) * 0.3, h * (0.34 + u * 0.19) + th / 2, z + (rnd() - 0.5) * 0.3, w, th, w);
    }
    stats.trees++;
  };
  const clearOf = (x, z) => !(z > 88.2 && z < 101.2) || (Math.abs(x) < 64 ? z > 101.2 : z > 101.6);
  // across the road, the whole length
  for (let x = X0; x < X1; x += 5.5) for (let z = 102.2; z < 140; z += 6) {
    const px = x + rnd() * 4, pz = z + rnd() * 4;
    if (rnd() < 0.12 || !clearOf(px, pz)) continue;
    pine(px, pz, 0.8 + rnd() * 0.45);
  }
  // either side of the estate, right up to its wall, and behind it
  for (const [ax, bx] of [[-150, -66], [66, 150]]) for (let x = ax; x < bx; x += 6) for (let z = -90; z < 88; z += 6.5) {
    const px = x + rnd() * 4, pz = z + rnd() * 4;
    if (rnd() < 0.15 || pz > 87.4) continue;
    pine(px, pz, 0.8 + rnd() * 0.45);
  }
  for (let x = -64; x < 64; x += 7) for (let z = -100; z < -57; z += 7) { if (rnd() < 0.2) continue; pine(x + rnd() * 4, z + rnd() * 4, 0.8 + rnd() * 0.4); }
  // along the road beyond the estate, on the near side too
  for (let x = X0; x < X1; x += 6) {
    if (Math.abs(x) < 70) continue;
    const pz = 82 + rnd() * 5;
    if (rnd() < 0.3) continue;
    pine(x + rnd() * 3, pz, 0.8 + rnd() * 0.4);
  }
  // dead trees right on the verge, reaching over the road
  for (let i = 0; i < 16; i++) {
    const x = X0 + 6 + rnd() * (X1 - X0 - 12), z = 101.8 + rnd() * 1.6;
    if (Math.abs(x - BM.CAR.stopX) < 6) continue;
    BM.deadTree(B, x, z, 0.95 + rnd() * 0.5, game, 40 + i);
  }

  /* ---- signs ---- */
  const sign = (x, z, ry, text, o, w, h, tilt) => {
    B.mesh(G.post, 'rust', x, 1.1, z, 0.06, 2.2, 0.06);
    const m = B.mesh(G.plane, BM.labelMat(text, o), x, 1.9, z + 0.04 * Math.cos(ry), w, h, 1, ry);
    if (tilt) { m.rotation.z = tilt; m.updateMatrix(); }
  };
  sign(6.2, 100.0, Math.PI, 'BLACKTHORN LANE\nNO THROUGH ROAD', { w: 256, h: 128, bg: '#7d8a7a', fg: '#e2e0d2', border: '#e2e0d2' }, 0.9, 0.45, 0.06);
  sign(-60, 90.2, 0, 'BRIDGE OUT\n3 MILES', { w: 256, h: 128, bg: '#8a6a24', fg: '#1a1408', border: '#1a1408' }, 0.8, 0.4, -0.12);
  // the road was closed, east of the estate, years ago
  for (const z of [92.6, 95.4]) { B.box('wood', 61.5, 0.45, z, 0.08, 0.9, 0.7); }
  B.mesh(G.plane, BM.labelMat('ROAD CLOSED', { w: 256, h: 64, bg: '#a89a88', fg: '#5a1410', border: '#5a1410' }), 61.42, 0.85, 94, 3.0, 0.38, 1, -Math.PI / 2);
  B.box('wood', 61.5, 0.85, 94, 0.05, 0.4, 3.1);
  B.phys.addWall(61.4, 61.6, 92.2, 95.8, 0, 1.1, { kind: 'rail', tag: 'road closed' });
  limb(B, 'deadBark', [63.4, 0.35, 90.2], [62.6, 0.7, 99.5], 0.32, G.cyl); // and a tree came down across it
  // milepost
  B.box('stone', -44, 0.4, 89.0, 0.28, 0.8, 0.2);

  game.road = stats;
};
})();
