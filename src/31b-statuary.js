/* ==========================================================================
   BLACKTHORN MANOR — 3b. STATUARY
   Carved stone, turned rather than stacked: robed figures whose drapery
   falls in folds, angels with feathered wings, moulded plinths, urns, and a
   two-tier fountain whose water runs in sheets from bowl to bowl when the
   garden circuit is on. Everything here is a builder; the grounds call it.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const V = (x, y) => new THREE.Vector2(x, y);
const cache = {};
const once = (k, f) => { if (!cache[k]) { cache[k] = f(); cache[k].userData.canonical = 'statuary:' + k; } return cache[k]; }; // built once, shared

/* A lathe from a profile, with the seam smoothed. */
function lathe(pts, seg) { const g = new THREE.LatheGeometry(pts, seg || 24); g.computeVertexNormals(); return g; }

/* The robe: a lathe from hem to neck, pushed in and out round its girth so it
   falls in folds, deeper at the hem, and flattened front to back. */
function robe() {
  return once('robe', () => {
    const P = [[0.001, 0], [0.37, 0], [0.38, 0.03], [0.33, 0.2], [0.27, 0.5], [0.21, 0.8], [0.175, 0.98], [0.19, 1.12], [0.215, 1.27], [0.2, 1.38], [0.13, 1.45], [0.06, 1.5], [0.055, 1.56]];
    const pts = []; for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 3; k++) { const t = k / 3; pts.push(V(P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t)); } pts.push(V(P[P.length - 1][0], P[P.length - 1][1]));
    const g = new THREE.LatheGeometry(pts, 64);
    const fh = a => { const v = Math.sin(a * 127.1) * 43758.5; return v - Math.floor(v); }; // a fixed unevenness for each fold
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), r = Math.hypot(x, z);
      if (r < 0.01) continue;
      const a = Math.atan2(z, x), deep = Math.max(0, 1 - y / 1.0);
      const fi = Math.floor((a + Math.PI) / (Math.PI * 2) * 11), depth = 0.6 + 0.8 * fh(fi + 1);
      const fold = Math.pow(Math.abs(Math.sin(a * 5.5 + y * 0.9 + Math.sin(y * 3 + a) * 0.3)), 0.6) * (0.008 + 0.05 * deep) * depth - 0.02 * deep + Math.sin(a * 2 - 0.7) * 0.012 * deep;
      const k = (r + fold) / r;
      pos.setXYZ(i, x * k, y, z * k * (0.82 + 0.1 * deep)); // flatter through the body than at the hem
    }
    g.computeVertexNormals();
    return g;
  });
}

/* A wing, folded down the back: a curved outline with scalloped primaries, given thickness. */
function wing(side) {
  return once('wing' + side, () => {
    const s = side, sh = new THREE.Shape();
    sh.moveTo(0.04 * s, 1.32);
    sh.bezierCurveTo(0.1 * s, 1.75, 0.34 * s, 1.92, 0.5 * s, 1.72);   // the shoulder of the wing, above the figure's own
    sh.bezierCurveTo(0.56 * s, 1.5, 0.5 * s, 0.9, 0.36 * s, 0.32);     // the leading edge sweeping down
    const tips = 7;                                                   // the primaries, each with a rounded end
    for (let i = 0; i < tips; i++) {
      const t0 = i / tips, t1 = (i + 1) / tips;
      const x0 = (0.36 - 0.26 * t0) * s, y0 = 0.32 + t0 * 0.75, x1 = (0.36 - 0.26 * t1) * s, y1 = 0.32 + t1 * 0.75;
      sh.quadraticCurveTo((x0 + x1) / 2 - 0.06 * s, (y0 + y1) / 2 - 0.08, x1, y1);
    }
    sh.bezierCurveTo(0.06 * s, 1.15, 0.03 * s, 1.25, 0.04 * s, 1.32);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2, curveSegments: 6 });
    g.computeVertexNormals();
    return g;
  });
}

/* Coverts: the shorter feathers over the top of the wing. */
function covert(side) {
  return once('covert' + side, () => {
    const s = side, sh = new THREE.Shape();
    sh.moveTo(0.05 * s, 1.34);
    sh.bezierCurveTo(0.12 * s, 1.7, 0.32 * s, 1.84, 0.46 * s, 1.68);
    for (let i = 0; i < 5; i++) { const t0 = i / 5, t1 = (i + 1) / 5; sh.quadraticCurveTo((0.46 - 0.4 * (t0 + t1) / 2) * s, 1.68 - 0.36 * (t0 + t1) / 2 - 0.07, (0.46 - 0.4 * t1) * s, 1.68 - 0.36 * t1); }
    sh.lineTo(0.05 * s, 1.34);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 1, curveSegments: 5 });
    g.computeVertexNormals();
    return g;
  });
}

/* A cylinder from a to b (in the group's frame), for arms and sleeves. */
const _u = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
function limb(B, mat, a, b, r0, r1, parent) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _d.length(); _d.divideScalar(len);
  const geo = once('limb' + r0 + '-' + r1, () => new THREE.CylinderGeometry(r1, r0, 1, 10));
  const m = B.mesh(geo, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 1, len, 1, 0, parent);
  m.quaternion.copy(_q.setFromUnitVectors(_u, _d)); m.updateMatrix();
  return m;
}

/* The arms for each pose: [shoulder, elbow, hand] per side, in the figure's frame (it faces +z). */
const POSES = {
  weep: s => [[0.19 * s, 1.36, 0.0], [0.17 * s, 1.24, 0.17], [0.05 * s, 1.56, 0.13]],     // hands over the face
  pray: s => [[0.19 * s, 1.36, 0.0], [0.17 * s, 1.08, 0.08], [0.02 * s, 1.24, 0.16]],     // hands together at the breast
  reach: s => s > 0 ? [[0.19, 1.36, 0.0], [0.33, 1.3, 0.2], [0.42, 1.38, 0.45]] : [[-0.19, 1.36, 0.0], [-0.21, 1.1, 0.04], [-0.14, 0.88, 0.1]], // one hand held out
  mourn: s => s > 0 ? [[0.19, 1.36, 0.0], [0.2, 1.1, 0.06], [0.06, 1.18, 0.14]] : [[-0.19, 1.36, 0.0], [-0.21, 1.08, 0.05], [-0.12, 0.86, 0.12]],
};

/* A robed figure standing at (x, y, z), facing angle ang. Options:
   pose (weep, pray, reach, mourn), wings, headless, scale, mat. */
BM.figure = function (B, x, y, z, ang, o) {
  o = o || {};
  const mat = o.mat || 'statueWorn', S = o.scale || 1;
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ang || 0; g.scale.setScalar(S); B.root.add(g);
  B.mesh(robe(), mat, 0, 0, 0, 1, 1, 1, 0, g);
  // a girdle at the waist, a mantle over the shoulders
  B.mesh(once('girdle', () => new THREE.TorusGeometry(0.18, 0.018, 6, 24).rotateX(Math.PI / 2)), mat, 0, 0.99, 0, 1, 1, 0.85, 0, g);
  B.mesh(once('mantle', () => lathe([V(0.03, 1.5), V(0.16, 1.44), V(0.235, 1.33), V(0.25, 1.2), V(0.22, 1.12)], 24)), mat, 0, 0, -0.01, 1, 1, 0.86, 0, g);
  // the head, bowed, under a veil that falls to the shoulders
  const bow = o.pose === 'weep' || o.pose === 'mourn' ? 0.06 : o.pose === 'pray' ? 0.03 : 0.0;
  if (!o.headless) {
    B.mesh(G.sphere, mat, 0, 1.64, 0.02 + bow, 0.19, 0.24, 0.21, 0, g);
    B.mesh(G.sphere, mat, 0, 1.67, -0.015 + bow * 0.6, 0.235, 0.27, 0.25, 0, g);                  // the veil over the crown
    B.mesh(once('veil', () => new THREE.CylinderGeometry(0.115, 0.2, 0.3, 16, 1, true)), mat, 0, 1.5, -0.03, 1, 1, 0.9, 0, g);
    if (o.pose !== 'weep') B.mesh(G.wedge, mat, 0, 1.6, 0.115 + bow, 0.025, 0.05, 0.035, Math.PI / 2, g); // the nose
  } else {
    B.mesh(G.sphere, mat, 0, 1.53, 0, 0.11, 0.06, 0.1, 0, g);                                       // the broken neck
  }
  // arms in sleeves, and hands
  const pose = POSES[o.pose || 'pray'];
  for (const s of [-1, 1]) {
    const [sh, el, ha] = pose(s);
    limb(B, mat, sh, el, 0.075, 0.07, g);
    limb(B, mat, el, ha, 0.068, 0.045, g);
    limb(B, mat, el, [el[0] + (el[0] - sh[0]) * 0.1, el[1] - 0.12, el[2] + (el[2] - sh[2]) * 0.1], 0.09, 0.03, g); // the sleeve hanging from the forearm
    B.mesh(G.sphere, mat, ha[0], ha[1], ha[2], 0.07, 0.1, 0.05, 0, g);
  }
  if (o.wings) for (const s of [-1, 1]) {
    const w = B.mesh(wing(s), mat, 0.02 * s, 0, -0.16, 1, 1, 1, 0, g); w.rotation.set(0.06, s * -0.32, 0); w.updateMatrix();
    const c = B.mesh(covert(s), mat, 0.02 * s, 0, -0.1, 1, 1, 1, 0, g); c.rotation.set(0.06, s * -0.32, 0); c.updateMatrix();
  }
  return g;
};

/* A fallen head, veiled, on its cheek in the grass. */
BM.fallenHead = function (B, x, z, ang, mat) {
  const g = new THREE.Group(); g.position.set(x, 0.1, z); g.rotation.set(0.2, ang, 1.35); B.root.add(g);
  B.mesh(G.sphere, mat || 'statueWorn', 0, 0, 0, 0.19, 0.24, 0.21, 0, g);
  B.mesh(G.sphere, mat || 'statueWorn', 0, 0.03, -0.035, 0.235, 0.27, 0.25, 0, g);
  B.mesh(G.wedge, mat || 'statueWorn', 0, -0.04, 0.1, 0.025, 0.05, 0.035, Math.PI / 2, g);
};

/* A moulded plinth: base, die and cornice. Top at y = h. */
BM.plinth = function (B, x, z, w, h, mat) {
  mat = mat || 'gothicStone';
  B.box(mat, x, 0.08, z, w + 0.2, 0.16, w + 0.2);
  B.box('gothicTrim', x, 0.2, z, w + 0.1, 0.08, w + 0.1);
  B.box(mat, x, 0.24 + (h - 0.4) / 2, z, w, h - 0.4, w);
  B.box('gothicTrim', x, h - 0.12, z, w + 0.1, 0.08, w + 0.1);
  B.box(mat, x, h - 0.04, z, w + 0.18, 0.08, w + 0.18);
};

/* A turned urn: foot, bowl, neck, lip. Lying on its side if fallen. */
BM.urn = function (B, x, y, z, s, fallen, mat) {
  const geo = once('urn', () => lathe([V(0.001, 0), V(0.2, 0), V(0.2, 0.06), V(0.11, 0.1), V(0.09, 0.2), V(0.26, 0.34), V(0.33, 0.5), V(0.3, 0.66), V(0.2, 0.74), V(0.17, 0.8), V(0.27, 0.86), V(0.27, 0.9), V(0.18, 0.9), V(0.15, 0.82), V(0.001, 0.8)], 24));
  const m = B.mesh(geo, mat || 'statueWorn', x, y, z, s, s, s);
  if (fallen) { m.rotation.set(Math.PI / 2 - 0.1, 0, fallen); m.updateMatrix(); }
  return m;
};

/* ---------------- the fountain ---------------- */

/* Running water: an open surface whose streaks run along v, fading at both ends. */
function waterMaterial() {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, level: { value: 0 }, speed: { value: 1.6 } }]);
  return new THREE.ShaderMaterial({
    uniforms: u, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: [
      'varying vec2 vUv;', THREE.ShaderChunk.fog_pars_vertex,
      'void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;', THREE.ShaderChunk.fog_vertex, '}',
    ].join('\n'),
    fragmentShader: [
      'uniform float time; uniform float level; uniform float speed; varying vec2 vUv;', THREE.ShaderChunk.fog_pars_fragment,
      'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'void main(){',
      '  float s = n(vec2(vUv.x * 90.0, vUv.y * 5.0 - time * speed * 3.0)) * 0.6 + n(vec2(vUv.x * 230.0, vUv.y * 11.0 - time * speed * 5.0)) * 0.4;',
      '  float ends = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.8, vUv.y);',
      '  float a = level * ends * (0.18 + 0.55 * smoothstep(0.35, 0.9, s));',
      '  gl_FragColor = vec4(mix(vec3(0.42, 0.5, 0.52), vec3(0.86, 0.92, 0.95), s), a);',
      THREE.ShaderChunk.fog_fragment, '}',
    ].join('\n'),
  });
}

/* A tiered fountain at (cx, cz): basin, baluster, a wide lower bowl, a small
   upper bowl and a finial. Returns the parts that move when it runs. */
BM.buildFountain = function (B, game, cx, cz) {
  const st = 'statueWorn';
  // the basin: a low wall with a rolled coping, the old water in it
  B.mesh(once('basinWall', () => lathe([V(3.0, 0), V(3.25, 0), V(3.25, 0.38), V(3.33, 0.42), V(3.33, 0.5), V(3.25, 0.56), V(3.05, 0.56), V(2.98, 0.5), V(2.98, 0.1)], 48)), 'stone', cx, 0, cz, 1, 1, 1);
  B.mesh(G.cyl, 'stone', cx, 0.15, cz, 6.0, 0.3, 6.0);
  // the baluster and the lower bowl
  B.mesh(once('fBaluster', () => lathe([V(0.48, 0), V(0.48, 0.12), V(0.36, 0.18), V(0.3, 0.3), V(0.38, 0.62), V(0.36, 0.86), V(0.22, 1.05), V(0.18, 1.2), V(0.26, 1.3)], 20)), st, cx, 0.42, cz, 1, 1, 1);
  B.mesh(once('fBowl', () => lathe([V(0.24, 0), V(0.5, 0.06), V(0.95, 0.22), V(1.28, 0.42), V(1.36, 0.5), V(1.34, 0.56), V(1.24, 0.55), V(0.9, 0.38), V(0.4, 0.3), V(0.001, 0.28)], 40)), st, cx, 1.68, cz, 1, 1, 1);
  // the upper stage
  B.mesh(once('fBaluster2', () => lathe([V(0.2, 0), V(0.16, 0.1), V(0.2, 0.3), V(0.12, 0.52), V(0.1, 0.62), V(0.16, 0.68)], 16)), st, cx, 1.98, cz, 1, 1, 1);
  B.mesh(once('fBowl2', () => lathe([V(0.14, 0), V(0.4, 0.1), V(0.62, 0.26), V(0.68, 0.33), V(0.64, 0.37), V(0.42, 0.24), V(0.001, 0.2)], 32)), st, cx, 2.64, cz, 1, 1, 1);
  // the finial: a pine cone the water comes out of
  B.mesh(once('fCone', () => lathe([V(0.001, 0), V(0.08, 0.02), V(0.12, 0.1), V(0.13, 0.2), V(0.1, 0.32), V(0.05, 0.4), V(0.012, 0.44)], 12)), st, cx, 2.84, cz, 1, 1, 1);
  // the old water and the green in the bowls
  B.mesh(G.cyl, 'scum', cx, 2.165, cz, 2.4, 0.01, 2.4);
  B.mesh(G.cyl, 'scum', cx, 2.9, cz, 1.16, 0.01, 1.16);

  // the running water: a spout and a crown of droplets, the sheets off each lip, rings in the basin
  const mat = waterMaterial(), parts = [];
  const add = (geo, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(cx + x, y, cz + z); m.userData.dynamic = true; m.renderOrder = 6; B.root.add(m); parts.push(m); return m; };
  add(once('water1', () => lathe([V(0.012, 0), V(0.02, 0.15), V(0.028, 0.32), V(0.06, 0.44), V(0.15, 0.46), V(0.3, 0.32), V(0.45, 0.08), V(0.56, -0.14), V(0.6, -0.3)], 24)), 0, 3.24, 0); // the jet, opening into a crown that falls to the upper bowl
  add(once('water2', () => lathe([V(0.68, 0.0), V(0.75, -0.08), V(0.83, -0.3), V(0.9, -0.6), V(0.94, -0.77)], 32)), 0, 3.0, 0);                                       // off the upper lip
  add(once('water3', () => lathe([V(1.36, 0.0), V(1.46, -0.1), V(1.6, -0.45), V(1.72, -0.95), V(1.8, -1.42)], 48)), 0, 2.24, 0);                                       // off the lower lip, into the basin
  const rings = [], ringMat = mat.clone(); ringMat.uniforms.speed.value = 0.4;
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(G.ring, ringMat); r.rotation.x = -Math.PI / 2; r.position.set(cx, 0.47, cz); r.userData.dynamic = true; r.renderOrder = 6; B.root.add(r); rings.push(r); parts.push(r); }
  for (const p of parts) p.frustumCulled = false;
  game.fountainFx = { mat, ringMat, parts, rings, on: false, level: 0, cx, cz };
};

/* Per frame: the water runs while the garden circuit is live, and dies away slowly when it isn't. */
BM.updateFountain = function (game, dt, t) {
  const f = game.fountainFx; if (!f || !f.rings) return false;
  const on = game.grid.live('lodge') && game.estateGroupOn('garden');
  f.on = on;
  f.level += ((on ? 1 : 0) - f.level) * Math.min(1, dt * (on ? 1.5 : 2));
  const u = f.mat.uniforms; u.time.value = t; u.level.value = f.level;
  const vis = f.level > 0.01;
  for (const p of f.parts) p.visible = vis;
  for (let i = 0; i < f.rings.length; i++) { const k = (t * 0.35 + i / f.rings.length) % 1, r = f.rings[i]; r.scale.setScalar(3.6 + k * 1.6); }
  f.ringMat.uniforms.time.value = t; f.ringMat.uniforms.level.value = f.level * 0.3;
  return true;
};
BM.statuaryGeo = once;
BM.waterMaterial = waterMaterial; // running water, for the pool garden // for one-off turned shapes elsewhere in the grounds
})();
