/* ==========================================================================
   BLACKTHORN MANOR — 6m. THE HOUSE FLOODLIGHTS
   Walk-over uplighters set flush in the gravel all round the house: three at
   the foot of each corner tower, aimed straight up the stone to the
   battlements; a row along the front, washing up the buttresses and the piers
   between the windows; two on the ledge at the foot of the clock tower; and
   rows down both sides and across the back. Lit, the house stands up out of
   the dark in pale columns of light, strongest at the foot, with the rain
   shining in the beams. From the lane the towers are the first thing you see.
   All of it on the floodlight group of the estate panel.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const TOWER_H = 24.6, WALL_H = 9.2;

/* one material for every wash: a hot spot at the foot opening out across the
   face, fading as it climbs; each wash follows its own lamp's level */
function washMaterial(n) {
  return new THREE.ShaderMaterial({
    uniforms: { levels: { value: new Array(n).fill(0) } },
    vertexShader: [
      'attribute float gid; attribute float style; varying vec2 vUv; varying float vG; varying float vS;',
      'void main(){ vUv = uv; vG = gid; vS = style; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    ].join('\n'),
    fragmentShader: [
      'uniform float levels[' + n + ']; varying vec2 vUv; varying float vG; varying float vS;',
      'void main(){',
      '  float level = 0.0;',
      '  for (int i = 0; i < ' + n + '; i++) { if (abs(float(i) - vG) < 0.5) level = levels[i]; }',
      '  if (level < 0.005) discard;',
      '  if (vS > 1.5) { gl_FragColor = vec4(vec3(1.0, 0.98, 0.92) * level * 1.6, 1.0); return; }',   // the lamp glass
      '  float v = vUv.y, u = abs(vUv.x * 2.0 - 1.0);',
      '  float open = min(1.0, 0.16 + v * (vS < 0.5 ? 5.0 : 2.6));',                                   // how far the pool of light has spread
      '  float across = 1.0 - smoothstep(open * 0.5, open, u);',
      '  float foot = smoothstep(0.0, 0.02, v) * (1.0 + 1.3 * exp(-v * 16.0));',
      '  float fade = vS < 0.5 ? (1.0 - 0.38 * v) * (1.0 - smoothstep(0.94, 1.0, v)) : pow(1.0 - v, 0.85);', // towers: carried to the top
      '  gl_FragColor = vec4(vec3(0.5, 0.53, 0.58) * across * foot * fade * level, 1.0);',
      '}',
    ].join('\n'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

/* the beams in the rain, hugging the walls */
function beamMaterial(n) {
  return new THREE.ShaderMaterial({
    uniforms: { levels: { value: new Array(n).fill(0) }, time: { value: 0 } },
    vertexShader: 'attribute float along; attribute float gid; varying float vZ; varying float vG; varying vec3 vN; varying vec3 vV; void main(){ vZ = along; vG = gid; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float levels[' + n + ']; uniform float time; varying float vZ; varying float vG; varying vec3 vN; varying vec3 vV;',
      'void main(){',
      '  float level = 0.0;',
      '  for (int i = 0; i < ' + n + '; i++) { if (abs(float(i) - vG) < 0.5) level = levels[i]; }',
      '  if (level < 0.005) discard;',
      '  float edge = pow(abs(dot(vN, vV)), 1.4);',
      '  float fall = pow(clamp(1.0 - vZ, 0.0, 1.0), 1.4) * smoothstep(0.0, 0.03, vZ);',
      '  float rain = 0.85 + 0.15 * sin(vZ * 60.0 - time * 7.0);',
      '  gl_FragColor = vec4(vec3(0.92, 0.95, 1.0) * edge * fall * rain * level * 0.14, 1.0);',
      '}',
    ].join('\n'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

/* fold placed copies of geometries into one, with per-vertex lamp ids, so
   every wash (or every beam) round the house costs a single draw */
function merged(parts, key) {
  const pos = [], nor = [], uv = [], idx = [], gid = [], style = [], along = [];
  let base = 0;
  for (const pt of parts) {
    const g = pt.geo.clone().applyMatrix4(pt.matrix);
    const p = g.attributes.position, n = g.attributes.normal, t = g.attributes.uv, src = pt.geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(t.getX(i), t.getY(i));
      gid.push(pt.gid); style.push(pt.style || 0); along.push(pt.len ? src.getY(i) / pt.len : 0);
    }
    const ix = g.index; for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base);
    base += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('gid', new THREE.Float32BufferAttribute(gid, 1));
  out.setAttribute('style', new THREE.Float32BufferAttribute(style, 1));
  out.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
  out.setIndex(idx);
  out.computeBoundingSphere();
  out.userData.canonical = 'fitting:' + key;
  return out;
}

BM.buildSearchlights = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  const plane = new THREE.PlaneGeometry(1, 1);
  const disc = new THREE.CircleGeometry(0.5, 16); disc.rotateX(-Math.PI / 2);
  const cones = {};
  const cone = (len, r) => { const k = len + ':' + r; if (!cones[k]) { const c = new THREE.CylinderGeometry(r, 0.12, len, 14, 1, true); c.translate(0, len / 2, 0); cones[k] = c; } return cones[k]; };
  const lamps = [], washes = [], beams = [];
  const fixtures = [];
  const estate = o => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:flood', kind: 'incandescent', style: 'none', colour: 0xeef2ff, corona: 0.3 }, o)); game.estateLights.flood.push(l.id); fixtures.push(l); return fixtures.length - 1; };
  const Y = new THREE.Vector3(0, 1, 0);
  /* one uplighter: a flush lamp in the ground at (lx, lz), throwing a wash up a face whose outward normal is at
     angle a, centred on (fx, fz), w wide and h high, starting at y0 */
  const uplight = (gid, lx, lz, ly, fx, fz, a, w, h, y0, style) => {
    const nx = Math.sin(a), nz = Math.cos(a);
    B.box('metalDark', lx, ly + 0.012, lz, 0.38, 0.024, 0.38, a);                                            // the frame, flush with the gravel
    lamps.push({ geo: disc, gid, style: 2, matrix: new THREE.Matrix4().compose(new THREE.Vector3(lx, ly + 0.026, lz), new THREE.Quaternion(), new THREE.Vector3(0.28, 1, 0.28)) });
    washes.push({ geo: plane, gid, style, matrix: new THREE.Matrix4().compose(new THREE.Vector3(fx + nx * 0.03, y0 + h / 2, fz + nz * 0.03),
      new THREE.Quaternion().setFromAxisAngle(Y, a), new THREE.Vector3(w, h, 1)) });
    const off = Math.hypot(lx - fx, lz - fz), len = h * 0.95, lean = Math.atan2(Math.max(0, off - 0.3), len);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), -lean);
    const c = cone(len, Math.min(1.3, w * 0.45));
    beams.push({ geo: c, gid, len, matrix: new THREE.Matrix4().compose(new THREE.Vector3(lx, ly + 0.03, lz), q, new THREE.Vector3(1, 1, 1)) });
  };

  /* ---- the four corner towers: the three faces turned away from the house, lit to the battlements ---- */
  const towers = game.towers || [[-21, 15], [21, 15], [-21, -15], [21, -15]];
  const R = 3.2, apothem = R * Math.cos(Math.PI / 8), faceW = 2 * R * Math.sin(Math.PI / 8);
  towers.forEach(([tx, tz], i) => {
    const out = Math.atan2(tx, tz);
    const gid = estate({ id: 'tower-flood-' + i, name: 'Tower floodlight', spot: true, target: 1.6, range: 18,
      pos: [tx + Math.sin(out) * (apothem + 0.9), 0.7, tz + Math.cos(out) * (apothem + 0.9)], dir: [-Math.sin(out) * 0.18, 1, -Math.cos(out) * 0.18] });
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4; let d = Math.abs(a - out) % (Math.PI * 2); if (d > Math.PI) d = Math.PI * 2 - d;
      if (d >= 1.25) continue;
      const nx = Math.sin(a), nz = Math.cos(a);
      uplight(gid, tx + nx * (apothem + 0.75), tz + nz * (apothem + 0.75), 0, tx + nx * apothem, tz + nz * apothem, a, faceW * 0.98, TOWER_H, 0.05, 0);
    }
  });

  /* ---- the front: the buttresses and the piers between the windows ---- */
  const FZ = 12.2;
  for (const sx of [-1, 1]) {
    const gid = estate({ id: 'front-flood-' + (sx < 0 ? 'w' : 'e'), name: 'Front floodlight', spot: true, target: 1.2, range: 14, pos: [sx * 11, 0.6, 14.2], dir: [0, 1, -0.45] });
    for (const x of [6.25, 12]) {
      uplight(gid, sx * x, 13.75, 0, sx * x, FZ, 0, 2.6, WALL_H, 0.04, 1);
      uplight(gid, sx * x, 13.75, 0, sx * x, 13.1, 0, 0.9, 3.2, 0.04, 1);                      // the buttress's own face
    }
    uplight(gid, sx * 17.0, 13.0, 0, sx * 17.0, FZ, 0, 2.2, WALL_H, 0.04, 1);
  }
  // the clock tower, from a ledge at its foot over the porch
  { const gid = estate({ id: 'clock-flood', name: 'Clock tower floodlight', spot: true, target: 1.1, range: 16, pos: [0, 9.0, 13.6], dir: [0, 1, -0.3] });
    B.boxE('gothicTrim', -4.05, 4.05, 8.05, 8.3, 12.45, 13.25);
    for (const x of [-2.1, 2.1]) {
      B.mesh(G.cyl, 'metalDark', x, 8.42, 13.0, 0.42, 0.24, 0.42);
      uplight(gid, x, 13.0, 8.3, x, 12.45, 0, 4.1, 16.6, 8.3, 0);
    } }

  /* ---- the back: a lamp at every buttress ---- */
  const BZ = -12.2;
  for (const sx of [-1, 1]) {
    const gid = estate({ id: 'rear-flood-' + (sx < 0 ? 'w' : 'e'), name: 'Rear floodlight', spot: true, target: 1.1, range: 14, pos: [sx * 9, 0.6, -14.0], dir: [0, 1, 0.45] });
    for (const x of (sx < 0 ? [-14.4, -9.2, -2.3] : [4.5, 10.6, 16.5])) {
      uplight(gid, x, -13.65, 0, x, BZ, Math.PI, 1.9, WALL_H, 0.04, 1);
      uplight(gid, x, -13.65, 0, x, -13.1, Math.PI, 0.9, 3.2, 0.04, 1);
    }
  }

  /* ---- the sides ---- */
  for (const sx of [-1, 1]) {
    const SXF = sx * 18.2, a = sx * Math.PI / 2;
    const gid = estate({ id: 'side-flood-' + (sx < 0 ? 'w' : 'e'), name: 'Side floodlight', spot: true, target: 1.1, range: 14, pos: [sx * 20.2, 0.6, 0], dir: [-sx * 0.45, 1, 0] });
    const buttresses = sx < 0 ? [2.5, -4.2] : [4.2, -2.6];
    for (const z of buttresses) {
      uplight(gid, sx * 19.65, z, 0, SXF, z, a, 1.9, WALL_H, 0.04, 1);
      uplight(gid, sx * 19.65, z, 0, sx * 19.1, z, a, 0.9, 3.2, 0.04, 1);
    }
    for (const z of [10.4, -10.9]) uplight(gid, sx * 19.2, z, 0, SXF, z, a, 1.9, WALL_H, 0.04, 1);
  }

  const n = fixtures.length;
  const washMat = washMaterial(n);
  const wash = new THREE.Mesh(merged(washes, 'floodwash'), washMat); wash.renderOrder = 6; wash.frustumCulled = false; B.root.add(wash);
  const glass = new THREE.Mesh(merged(lamps, 'floodglass'), washMat); glass.renderOrder = 6; B.root.add(glass);
  const beam = new THREE.Mesh(merged(beams, 'floodbeam'), beamMaterial(n)); beam.renderOrder = 7; beam.frustumCulled = false; B.root.add(beam);
  for (const m of [wash, glass, beam]) m.userData.dynamic = true;
  game.floodlights = { fixtures, wash, glass, beam, washMat };
};

BM.updateSearchlights = function (game, dt, t) {
  const S = game.floodlights; if (!S) return;
  const W = S.washMat.uniforms.levels.value, Bv = S.beam.material.uniforms.levels.value;
  let any = 0;
  S.fixtures.forEach((l, i) => { const k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0; W[i] = Bv[i] = k; any = Math.max(any, k); });
  S.wash.visible = S.glass.visible = S.beam.visible = any > 0.005;
  S.beam.material.uniforms.time.value = t;
};
})();
