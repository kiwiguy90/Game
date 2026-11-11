/* ==========================================================================
   BLACKTHORN MANOR — 6o. THE POOL GARDEN
   West of the drive, a sunken pool garden: a stone deck below the lawn,
   reached down steps from the pool walk. On it two pools, one above the
   other. The upper pool is raised in a stone basin and spills over a weir
   down a stone chute into the lower, deeper pool; a blue fibreglass slide
   comes down off a heap of rocks into the lower pool too. Cypresses stand
   along the west side and weeping willows at the corners, shrubs along
   the rim. The pool group lights it all: lamps under the water that throw
   moving caustics up through it, two spotlights on poles aimed at the
   water, uplights in the trees, and the pumps, which start with the
   lights and set the water running.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const D = { x0: -46, x1: -24, z0: 53, z1: 71, y: -0.8 };               // the sunken deck
const UP = { x0: -44, x1: -36, z0: 56, z1: 68, rim: 0.3, water: 0.18 }; // the raised pool
const LO = { x0: -34, x1: -26, z0: 55, z1: 69, water: -1.0, floor: -1.9 }; // the deep pool
const WEIR = { z0: 59, z1: 65 };
BM.POOLGARDEN = { D, UP, LO };

/* light under water: soft moving caustics, coloured, added on top of the surface */
function causticMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, level: { value: 0 }, colour: { value: new THREE.Color(0x3fc8ff) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform float time; uniform float level; uniform vec3 colour; varying vec2 vUv;',
      'float c(vec2 p){ vec2 i = p; float v = 0.0; for (int k = 0; k < 3; k++) { float t = time * (0.35 + float(k) * 0.12); i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x)); v += 1.0 / length(vec2(p.x / (sin(i.x + t) / 0.02), p.y / (cos(i.y + t) / 0.02))); } return v / 3.0; }',
      'void main(){',
      '  vec2 p = vUv * vec2(9.0, 13.0);',
      '  float k = clamp(c(p) * 0.9, 0.0, 1.6);',
      '  float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);',
      '  gl_FragColor = vec4(colour * level * (0.18 + 0.32 * k) * (0.55 + 0.45 * edge), 1.0);',
      '}',
    ].join('\n'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

BM.buildPoolGarden = function (B, game) {
  const P = B.phys, rnd = BM.mulberry32(1962);
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'sunken pool';
  const estate = (o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:pool' }, o)); game.estateLights.pool.push(l.id); return l; };

  /* ---- the deck: flags below the lawn, a retaining wall all round with a coping, steps down from the walk ---- */
  B.floor('stone', D.x0, D.x1, D.z0, D.z1, D.y, 0.3, [[LO.x0, LO.x1, LO.z0, LO.z1]]);
  for (const [a0, a1, b0, b1] of [[D.x0, D.x1, D.z0 - 0.2, D.z0], [D.x0, D.x1, D.z1, D.z1 + 0.2], [D.x0 - 0.2, D.x0, D.z0 - 0.2, D.z1 + 0.2], [D.x1, D.x1 + 0.2, D.z0 - 0.2, 61], [D.x1, D.x1 + 0.2, 63, D.z1 + 0.2]]) {
    B.boxE('gothicStone', a0, a1, D.y, 0, b0, b1); B.boxE('gothicTrim', a0 - 0.05, a1 + 0.05, 0, 0.08, b0 - 0.05, b1 + 0.05);
  }
  P.ramp(D.x1 - 1.6, D.x1, 61, 63, 'x', D.y, 0, D.y - 0.3, 'pool steps');
  for (let i = 0; i < 4; i++) B.boxE('stone', D.x1 - 1.6 + i * 0.4, D.x1, D.y, D.y + (i + 1) * 0.2, 61, 63);
  for (let i = 0; i < 40; i++) B.box(rnd() < 0.5 ? 'leafLitter' : 'leafLitter2', D.x0 + 1 + rnd() * 20, D.y + 0.01, D.z0 + 0.6 + rnd() * 16.8, 0.16, 0.004, 0.1, rnd() * 3);

  /* ---- the upper pool: a raised basin, its east lip lowered to a weir ---- */
  const t = 0.3;
  for (const [a0, a1, b0, b1] of [[UP.x0, UP.x1, UP.z0, UP.z0 + t], [UP.x0, UP.x1, UP.z1 - t, UP.z1], [UP.x0, UP.x0 + t, UP.z0, UP.z1], [UP.x1 - t, UP.x1, UP.z0, WEIR.z0], [UP.x1 - t, UP.x1, WEIR.z1, UP.z1]]) {
    B.solid('gothicStone', a0, a1, D.y, UP.rim, b0, b1, { kind: 'wall', structural: false });
    B.boxE('gothicTrim', a0 - 0.06, a1 + 0.06, UP.rim, UP.rim + 0.08, b0 - 0.06, b1 + 0.06);
  }
  B.solid('gothicStone', UP.x1 - t, UP.x1, D.y, UP.water - 0.03, WEIR.z0, WEIR.z1, { kind: 'wall', structural: false }); // the weir, just under the water
  P.addWall(UP.x1 - t, UP.x1, WEIR.z0, WEIR.z1, D.y, UP.rim, { kind: 'rail' });
  B.boxE('whitetile', UP.x0 + t, UP.x1 - t, D.y + 0.02, D.y + 0.04, UP.z0 + t, UP.z1 - t);                 // the floor of it
  // the chute: a stone slope from the weir down to the lower pool, and a rail so nobody walks down it
  const chuteLen = Math.hypot(LO.x0 - UP.x1, UP.water - LO.water), chuteAng = Math.atan2(UP.water - LO.water, LO.x0 - UP.x1);
  { const c = B.box('gothicStone', (UP.x1 + LO.x0) / 2, (UP.water + LO.water) / 2 - 0.12, (WEIR.z0 + WEIR.z1) / 2, chuteLen + 0.1, 0.16, WEIR.z1 - WEIR.z0); c.rotation.z = -chuteAng; c.updateMatrix(); }
  for (const z of [WEIR.z0 - 0.12, WEIR.z1 + 0.12]) { const s = B.box('gothicStone', (UP.x1 + LO.x0) / 2, (UP.water + LO.water) / 2 + 0.15, z, chuteLen, 0.5, 0.24); s.rotation.z = -chuteAng; s.updateMatrix(); }
  P.addWall(UP.x1, LO.x0, WEIR.z0 - 0.25, WEIR.z1 + 0.25, D.y, 0.4, { kind: 'rail' });

  /* ---- the lower pool: sunk into the deck, tiled, a low kerb round it ---- */
  B.boxE('whitetile', LO.x0, LO.x1, LO.floor, LO.floor + 0.02, LO.z0, LO.z1);
  for (const [a0, a1, b0, b1] of [[LO.x0, LO.x1, LO.z0 - 0.02, LO.z0], [LO.x0, LO.x1, LO.z1, LO.z1 + 0.02], [LO.x0 - 0.02, LO.x0, LO.z0, LO.z1], [LO.x1, LO.x1 + 0.02, LO.z0, LO.z1]]) B.boxE('whitetile', a0, a1, LO.floor, D.y, b0, b1);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x1a4a6a, shininess: 30 }), LO.x0 + 0.01, LO.x1 - 0.01, D.y - 0.2, D.y - 0.12, LO.z0 + 0.01, LO.z0 + 0.02); // the tile band at the waterline
  for (const [a0, a1, b0, b1] of [[LO.x0 - 0.3, LO.x1 + 0.3, LO.z0 - 0.3, LO.z0], [LO.x0 - 0.3, LO.x1 + 0.3, LO.z1, LO.z1 + 0.3], [LO.x1, LO.x1 + 0.3, LO.z0, LO.z1], [LO.x0 - 0.3, LO.x0, LO.z0, WEIR.z0 - 0.25], [LO.x0 - 0.3, LO.x0, WEIR.z1 + 0.25, LO.z1]]) {
    B.boxE('gothicTrim', a0, a1, D.y, D.y + 0.12, b0, b1);
    P.addWall(a0, a1, b0, b1, D.y, D.y + 0.5, { kind: 'rail' });
  }
  // a chrome ladder on the east side
  for (const dz of [-0.25, 0.25]) { B.mesh(G.post, 'chrome', LO.x1 - 0.15, D.y - 0.35, 62 + dz, 0.04, 1.3, 0.04); B.mesh(G.post, 'chrome', LO.x1 + 0.05, D.y + 0.45, 62 + dz, 0.04, 0.5, 0.04); }
  for (let k = 0; k < 3; k++) B.box('chrome', LO.x1 - 0.12, LO.water - 0.4 + k * 0.3, 62, 0.06, 0.03, 0.5);

  /* ---- the water: a dark surface, caustics under it, a few leaves on it ---- */
  const surf = (x0, x1, z0, z1, y) => B.boxE(new THREE.MeshPhongMaterial({ color: 0x08262c, shininess: 140, specular: 0x6a90a8, transparent: true, opacity: 0.88 }), x0, x1, y - 0.01, y, z0, z1);
  surf(UP.x0 + t, UP.x1 - t, UP.z0 + t, UP.z1 - t, UP.water); surf(LO.x0, LO.x1, LO.z0, LO.z1, LO.water);
  const caustics = [];
  for (const [x0, x1, z0, z1, y, col] of [[UP.x0 + t, UP.x1 - t, UP.z0 + t, UP.z1 - t, UP.water, 0x40e0c8], [LO.x0, LO.x1, LO.z0, LO.z1, LO.water, 0x3fa8ff]]) {
    const m = causticMaterial(); m.uniforms.colour.value.setHex(col);
    const p = B.mesh(G.plane, m, (x0 + x1) / 2, y + 0.006, (z0 + z1) / 2, x1 - x0, z1 - z0, 1); p.rotation.x = -Math.PI / 2; p.updateMatrix(); p.userData.dynamic = true; p.renderOrder = 6;
    caustics.push(m);
  }
  for (let i = 0; i < 18; i++) { const lo = rnd() < 0.6, P0 = lo ? LO : UP; B.box(rnd() < 0.5 ? 'leafLitter' : 'leafLitter2', P0.x0 + 0.6 + rnd() * 6.8, (lo ? LO.water : UP.water) + 0.01, P0.z0 + 0.6 + rnd() * 10.8, 0.14, 0.004, 0.09, rnd() * 3); }

  /* ---- the running water: the sheet over the weir and down the chute, ripples where it lands ---- */
  const flow = BM.waterMaterial ? BM.waterMaterial() : new THREE.MeshBasicMaterial({ color: 0x8090a0, transparent: true, opacity: 0.4 });
  const sheet = B.mesh(G.plane, flow, (UP.x1 + LO.x0) / 2, (UP.water + LO.water) / 2 + 0.02, (WEIR.z0 + WEIR.z1) / 2, WEIR.z1 - WEIR.z0, chuteLen, 1);
  { const ax = new THREE.Vector3(0, 0, 1), ay = new THREE.Vector3(-Math.cos(chuteAng), Math.sin(chuteAng), 0), az = new THREE.Vector3().crossVectors(ax, ay);
    sheet.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ax, ay, az)); sheet.updateMatrix(); }
  sheet.userData.dynamic = true; sheet.renderOrder = 7;
  const lip = B.mesh(G.plane, flow, UP.x1 - 0.02, UP.water - 0.25, (WEIR.z0 + WEIR.z1) / 2, WEIR.z1 - WEIR.z0, 0.5, 1, Math.PI / 2); lip.userData.dynamic = true; lip.renderOrder = 7;
  const foam = B.mesh(G.ring, flow, LO.x0 + 0.9, LO.water + 0.02, (WEIR.z0 + WEIR.z1) / 2, 2.6, 2.6, 2.6); foam.rotation.x = -Math.PI / 2; foam.updateMatrix(); foam.userData.dynamic = true;

  /* ---- the slide: a heap of rocks on the north side, a ladder up the back, a blue trough curving down into the deep pool ---- */
  const rocks = [[-31.2, 70.9, 1.9, 1.5], [-32.6, 70.4, 1.5, 1.1], [-29.8, 70.6, 1.4, 1.0], [-30.6, 71.8, 1.6, 1.2], [-33.4, 71.6, 1.2, 0.8], [-28.6, 71.6, 1.2, 0.8], [-31.8, 69.6, 1.0, 0.6], [-29.4, 69.7, 0.9, 0.5]];
  for (const [x, z, s, h] of rocks) B.mesh(G.lowSphere, rnd() < 0.5 ? 'gothicStone' : 'stone', x, D.y + h * 0.45, z, s * (1 + rnd() * 0.3), h * 1.1, s * (0.9 + rnd() * 0.3), rnd() * 3);
  P.addWall(-33.8, -28.2, 69.2, 72.6, D.y, 1.6, { kind: 'furniture', tag: 'rocks' });
  for (let i = 0; i < 6; i++) B.mesh(G.lowSphere, rnd() < 0.5 ? 'sapLeaves' : 'leavesDark', -33.6 + rnd() * 5.2, D.y + 1.2 + rnd() * 0.3, 70.4 + rnd() * 1.8, 0.7, 0.4, 0.7); // ferns in the cracks
  const fibre = new THREE.MeshPhongMaterial({ color: 0x2a78b0, shininess: 90, specular: 0x6688aa });
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-30.9, D.y + 2.0, 71.1), new THREE.Vector3(-32.6, D.y + 1.45, 70.5), new THREE.Vector3(-32.9, D.y + 0.85, 69.4), new THREE.Vector3(-31.9, D.y + 0.25, 68.5), new THREE.Vector3(-30.8, LO.water + 0.15, 67.6)]);
  const N = 18, up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), slideFlow = [];
  for (let i = 0; i < N; i++) {
    const a = curve.getPoint(i / N), b = curve.getPoint((i + 1) / N), mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), len = dir.length(); dir.normalize();
    const seg = new THREE.Group(); seg.position.copy(mid); seg.quaternion.copy(q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir));
    // keep the trough level across its width
    const side = new THREE.Vector3().crossVectors(up, dir).normalize(), flat = new THREE.Vector3().crossVectors(dir, side).normalize();
    seg.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, flat, dir));
    B.root.add(seg);
    B.box(fibre, 0, 0, 0, 0.62, 0.05, len + 0.04, 0, seg);
    for (const s of [-1, 1]) B.box(fibre, s * 0.31, 0.12, 0, 0.05, 0.26, len + 0.04, 0, seg);
    const w = B.box(flow, 0, 0.03, 0, 0.5, 0.005, len + 0.04, 0, seg); w.userData.dynamic = true; slideFlow.push(w);
    seg.updateMatrixWorld(true); seg.traverse(o => { if (o.isMesh) o.updateMatrix(); });
  }
  B.box('fabricCream', -30.75, D.y + 2.05, 71.35, 0.9, 0.08, 0.7);                                 // the platform at the top
  for (const s of [-1, 1]) B.mesh(G.post, 'chrome', -30.75 + s * 0.4, D.y + 2.5, 71.05, 0.04, 0.9, 0.04);      // its handles
  for (const s of [-1, 1]) B.mesh(G.post, 'chrome', -30.75 + s * 0.3, D.y + 1.2, 72.25, 0.05, 2.4, 0.05);     // the ladder
  for (let k = 0; k < 6; k++) B.box('chrome', -30.75, D.y + 0.3 + k * 0.35, 72.25, 0.6, 0.03, 0.05);

  /* ---- planting: cypresses down the west, willows at the corners, shrubs along the rim ---- */
  B.room = 'grounds';
  for (let z = D.z0 + 1.2; z < D.z1; z += 3.0) { const x = D.x0 - 1.4, h = 4.6 + rnd() * 1.6; B.mesh(G.cyl, 'bark', x, 0.5, z, 0.2, 1.0, 0.2); B.mesh(G.cone, 'pineDark', x, 0.7 + h / 2, z, 1.2, h, 1.2); B.mesh(G.cone, 'pine', x + 0.1, 1.5 + h * 0.55, z, 0.8, h * 0.5, 0.8); P.addWall(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 0, h, { kind: 'tree' }); }
  const willow = (x, z) => {
    B.mesh(G.cyl, 'bark', x, 1.5, z, 0.55, 3.0, 0.55); P.addWall(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 0, 6, { kind: 'tree' });
    for (let i = 0; i < 4; i++) { const a = i * 1.6; B.mesh(G.post, 'bark', x + Math.sin(a) * 0.8, 3.4, z + Math.cos(a) * 0.8, 0.18, 1.8, 0.18).rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); B.root.children[B.root.children.length - 1].updateMatrix(); }
    B.mesh(G.lowSphere, 'sapLeaves', x, 4.6, z, 5.2, 2.4, 5.2);
    for (let i = 0; i < 22; i++) { const a = i / 22 * 6.3, r = 2.0 + rnd() * 0.6; B.mesh(G.cone, rnd() < 0.5 ? 'sapLeaves' : 'leavesDark', x + Math.sin(a) * r, 2.6 + rnd() * 0.5, z + Math.cos(a) * r, 0.9, -3.6 - rnd() * 1.2, 0.9); }
  };
  willow(D.x0 - 2.0, D.z0 - 2.2); willow(D.x0 - 2.0, D.z1 + 2.2);
  for (let i = 0; i < 14; i++) { const t2 = i / 13, x = D.x0 + 0.6 + t2 * (D.x1 - D.x0 - 1.2); for (const z of [D.z0 - 0.9, D.z1 + 0.9]) if (Math.abs(x + 31) > 3.2 || z < 60) B.mesh(G.lowSphere, rnd() < 0.5 ? 'leavesDark' : 'sapLeaves', x, 0.45, z + (rnd() - 0.5) * 0.3, 1.3 + rnd() * 0.5, 0.9 + rnd() * 0.4, 1.0); }

  /* ---- the lights ---- */
  B.room = 'sunken pool';
  // under the water: two in each pool (the lower pair keep their old names)
  estate({ id: 'pool-under-34', name: 'Underwater light', kind: 'incandescent', style: 'none', pos: [-31.6, LO.water - 0.7, 62], colour: 0x4fc0ff, target: 1.3, range: 8, corona: 0.2, lightType: 'subtlePulse' });
  estate({ id: 'pool-under-30', name: 'Underwater light', kind: 'incandescent', style: 'none', pos: [-28.4, LO.water - 0.7, 62], colour: 0x4fc0ff, target: 1.3, range: 8, corona: 0.2, lightType: 'subtlePulse' });
  estate({ id: 'pool-under-up', name: 'Underwater light', kind: 'incandescent', style: 'none', pos: [-40, UP.water - 0.6, 62], colour: 0x40e8c8, target: 1.1, range: 7, corona: 0.2, lightType: 'subtlePulse' });
  // spotlights on two poles at the east corners, aimed at the water
  for (const [px, pz] of [[D.x1 - 0.6, D.z0 + 0.6], [D.x1 - 0.6, D.z1 - 0.6]]) {
    B.mesh(G.post, 'metalDark', px, D.y + 2.6, pz, 0.12, 5.2, 0.12);
    const tx = -32, tz = 62, dx = tx - px, dz = tz - pz, dl = Math.hypot(dx, dz);
    const hd = B.mesh(G.cyl, 'metalDark', px + dx / dl * 0.25, D.y + 5.15, pz + dz / dl * 0.25, 0.32, 0.45, 0.32); hd.rotation.set(0, Math.atan2(dx, dz), 0, 'YXZ'); hd.rotation.x = Math.PI / 2 - 0.55; hd.updateMatrix();
    const dir = new THREE.Vector3(dx, D.y + 0.2 - (D.y + 5.2), dz).normalize();
    estate({ id: 'pool-spot-' + (pz < 62 ? 's' : 'n'), name: 'Pool spotlight', kind: 'incandescent', style: 'none', pos: [px + dx / dl * 0.4, D.y + 5.0, pz + dz / dl * 0.4], spot: true, dir: [dir.x, dir.y, dir.z], colour: 0xe8f2ff, target: 1.6, range: 18, corona: 1.2 });
  }
  // uplights in the willows and the cypresses
  for (const [x, z] of [[D.x0 - 2.0 + 1.1, D.z0 - 2.2], [D.x0 - 2.0 + 1.1, D.z1 + 2.2]]) { B.box('metalDark', x, 0.06, z, 0.24, 0.12, 0.24); estate({ id: 'pool-tree-' + (z < 62 ? 's' : 'n'), name: 'Tree uplight', kind: 'incandescent', style: 'none', pos: [x, 0.2, z], spot: true, dir: [-0.3, 1, 0], colour: 0xc8ffd8, target: 0.9, range: 7, corona: 0.3 }); }
  estate({ id: 'pool-tree-w', name: 'Tree uplight', kind: 'incandescent', style: 'none', pos: [D.x0 - 0.6, 0.2, 62], spot: true, dir: [-0.4, 1, 0], colour: 0xc8ffd8, target: 0.8, range: 7, corona: 0.3 });

  game.poolFx = { caustics, flow, sheet, lip, foam, slideFlow, level: 0, on: false, pos: { x: -35, y: -0.4, z: 62 } };
  B.room = 'grounds';
};

/* the pumps start with the lights: the water runs, the caustics swim */
BM.updatePoolGarden = function (game, dt, t) {
  const f = game.poolFx; if (!f) return;
  let k = 0;
  for (const id of ['pool-under-34', 'pool-under-30', 'pool-under-up']) { const l = game.grid.light(id); if (l && l.target > 0) k = Math.max(k, Math.min(1.2, l.intensity / l.target)); }
  for (const m of f.caustics) { m.uniforms.time.value = t; m.uniforms.level.value = k; }
  f.on = game.grid.live('lodge') && game.estateGroupOn('pool');
  f.level += ((f.on ? 1 : 0) - f.level) * Math.min(1, dt * (f.on ? 0.8 : 1.5));
  if (f.flow.uniforms) { f.flow.uniforms.time.value = t; f.flow.uniforms.level.value = f.level; }
  const vis = f.level > 0.01;
  f.sheet.visible = f.lip.visible = f.foam.visible = vis; for (const w of f.slideFlow) w.visible = vis;
  f.foam.scale.setScalar(2.4 + Math.sin(t * 3) * 0.15);
};
})();
