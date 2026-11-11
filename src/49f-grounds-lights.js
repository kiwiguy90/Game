/* ==========================================================================
   BLACKTHORN MANOR — 6n. THE MAZE LIGHTS AND THE TENNIS COURT
   The maze: uplights set in the grass all round it, each throwing a pale
   wash up the face of the yew, and a spot on Mercy at its heart, all on the
   garden group. The tennis court: behind the walled garden, a hard court
   gone green, its lines still there under the moss, a sagging net, a
   chain-link fence, an umpire's chair, and four tall floodlight masts with
   banks of lamps whose light you can see falling through the rain. They
   come on with the floodlights.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* the wash an uplight throws up a wall: bright at the foot, spreading, fading by the top */
let washTex = null;
function washTexture() {
  if (washTex) return washTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  for (let y = 0; y < 128; y++) {
    const v = 1 - y / 128, w = 6 + (1 - v) * 26, a = Math.pow(v, 1.6);
    const gr = g.createLinearGradient(32 - w, 0, 32 + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 127 - y, 64, 1);
  }
  washTex = new THREE.CanvasTexture(c);
  return washTex;
}
function chainLink() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.strokeStyle = '#fff'; g.lineWidth = 2.2;
  for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function beamMaterial(len) {
  return new THREE.ShaderMaterial({
    uniforms: { level: { value: 0 }, time: { value: 0 } },
    vertexShader: 'varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.y / ' + len.toFixed(1) + '; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float level; uniform float time; varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); float fall = pow(clamp(1.0 - vZ, 0.0, 1.0), 1.3); float rain = 0.85 + 0.15 * sin(vZ * 90.0 - time * 8.0); gl_FragColor = vec4(vec3(0.9, 0.94, 1.0) * edge * fall * rain * level * 0.13, 1.0); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

BM.buildGroundsLights = function (B, game) {
  const P = B.phys;
  B.zone = 'exterior'; B.levelName = 'ground';
  const estate = (group, o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:' + group }, o)); game.estateLights[group].push(l.id); return l; };
  const washes = [];
  const wash = (l, x, z, nx, nz, w, h) => {
    const m = new THREE.MeshBasicMaterial({ map: washTexture(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    B.mesh(G.plane, m, x, h / 2, z, w, h, 1, Math.atan2(nx, nz)).userData.dynamic = true;
    washes.push({ l, m, hex: l.colour });
  };

  /* ---- the maze: uplights all round, and Mercy lit at its heart ---- */
  B.room = 'maze';
  const MZ = { x0: -60, x1: -39, z0: 28, z1: 49 }, gap = 1.1;
  const up = (id, x, z, nx, nz) => {
    B.box('metalDark', x, 0.06, z, 0.24, 0.12, 0.24);
    B.mesh(G.disc, new THREE.MeshBasicMaterial({ color: 0x223322 }), x, 0.125, z, 0.16, 0.16, 1).rotation.x = -Math.PI / 2;
    const l = estate('garden', { id, name: 'Maze uplight', kind: 'incandescent', style: 'none', pos: [x, 0.2, z], spot: true, dir: [-nx * 0.35, 1, -nz * 0.35], colour: 0xd4f2d8, target: 0.7, range: 6, corona: 0.4 });
    wash(l, x - nx * (gap - 0.33), z - nz * (gap - 0.33), nx, nz, 3.2, 2.4);
  };
  let n = 0;
  for (let x = MZ.x0 + 2.1; x < MZ.x1; x += 4.2) { up('maze-up-' + n++, x, MZ.z0 - gap, 0, -1); up('maze-up-' + n++, x, MZ.z1 + gap, 0, 1); }
  for (let z = MZ.z0 + 2.1; z < MZ.z1; z += 4.2) { up('maze-up-' + n++, MZ.x0 - gap, z, -1, 0); if (Math.abs(z - 38.5) > 2.5) up('maze-up-' + n++, MZ.x1 + gap, z, 1, 0); }
  // Mercy, lit from a lamp on a short iron post
  const hx = MZ.x0 + 10.5, hz = MZ.z0 + 10.5;
  B.mesh(G.post, 'iron', hx + 1.3, 1.1, hz + 1.3, 0.06, 2.2, 0.06);
  estate('garden', { id: 'maze-mercy', name: 'Light on Mercy', kind: 'incandescent', style: 'none', pos: [hx + 1.2, 2.25, hz + 1.2], spot: true, dir: [-0.6, -0.4, -0.6], colour: 0xe6eeff, target: 1.0, range: 6, corona: 0.8 });
  B.box('metalDark', hx + 1.2, 2.25, hz + 1.2, 0.2, 0.16, 0.26, Math.PI / 4);

  /* ---- the tennis court ---- */
  B.room = 'tennis court';
  const TC = { x0: -17, x1: 17, z0: -50.6, z1: -33.6 }, cx = 0, cz = (TC.z0 + TC.z1) / 2;
  // the surface: a hard court gone green, cracked, moss in the seams; the lines under it
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x3e5a46, shininess: 4 }), TC.x0, TC.x1, 0, 0.03, TC.z0, TC.z1);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x5a4a3e, shininess: 4 }), -11.9, 11.9, 0.03, 0.035, cz - 5.5, cz + 5.5);  // the old red playing area
  const line = (x0, x1, z0, z1) => B.boxE('paper', x0, x1, 0.035, 0.04, z0, z1);
  const L = 11.885, Wd = 5.485, Ws = 4.115, S = 6.4;
  line(-L, L, cz - Wd - 0.025, cz - Wd + 0.025); line(-L, L, cz + Wd - 0.025, cz + Wd + 0.025);   // doubles sidelines
  line(-L, L, cz - Ws - 0.025, cz - Ws + 0.025); line(-L, L, cz + Ws - 0.025, cz + Ws + 0.025);   // singles
  for (const x of [-L, L]) line(x - 0.025, x + 0.025, cz - Wd, cz + Wd);                          // baselines
  for (const x of [-S, S]) line(x - 0.025, x + 0.025, cz - Ws, cz + Ws);                          // service lines
  line(-S, S, cz - 0.025, cz + 0.025);                                                            // centre service line
  const rnd = BM.mulberry32(1974);
  for (let i = 0; i < 26; i++) B.box('moss', TC.x0 + 1 + rnd() * 32, 0.042, TC.z0 + 1 + rnd() * 15, 0.5 + rnd() * 2.5, 0.004, 0.2 + rnd() * 1.0, rnd() * 3);
  for (let i = 0; i < 14; i++) B.box('black', TC.x0 + 1 + rnd() * 32, 0.041, TC.z0 + 1 + rnd() * 15, 0.03, 0.004, 1 + rnd() * 3, rnd() * 3); // cracks
  // the net, sagging, its tape grey
  for (const z of [cz - Wd - 0.9, cz + Wd + 0.9]) { B.mesh(G.post, 'paintedWood', 0, 0.54, z, 0.09, 1.07, 0.09); P.addWall(-0.1, 0.1, z - 0.1, z + 0.1, 0, 1.1, { kind: 'furniture', tag: 'net post' }); }
  const netMat = new THREE.MeshLambertMaterial({ map: chainLink(), color: 0x2a2a2a, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  netMat.map.repeat.set(24, 2);
  const net = B.mesh(G.plane, netMat, 0, 0.6, cz, Wd * 2 + 1.8, 0.85, 1, Math.PI / 2); void net;
  B.box('linen', 0, 0.96, cz, 0.03, 0.06, Wd * 2 + 1.8);
  P.addWall(-0.05, 0.05, cz - Wd - 0.9, cz + Wd + 0.9, 0, 0.95, { kind: 'rail' });
  // the umpire's chair and a bench, a roller left out
  B.mesh(G.post, 'paintedWood', 0.6, 0.9, cz + Wd + 1.6, 0.06, 1.8, 0.06); B.mesh(G.post, 'paintedWood', -0.6, 0.9, cz + Wd + 1.6, 0.06, 1.8, 0.06);
  B.box('paintedWood', 0, 1.8, cz + Wd + 1.75, 1.4, 0.06, 0.6); B.box('paintedWood', 0, 2.2, cz + Wd + 2.0, 1.4, 0.8, 0.06);
  P.addWall(-0.75, 0.75, cz + Wd + 1.35, cz + Wd + 2.1, 0, 2.6, { kind: 'furniture', tag: "umpire's chair" });
  B.furniture('paintedWood', -11, TC.z1 - 0.6, 0, 2.0, 0.45, 0.45, 'bench');
  B.mesh(G.cyl, 'metalDark', 9.5, 0.4, TC.z1 - 0.9, 0.8, 1.4, 0.8).rotation.z = Math.PI / 2; B.root.children[B.root.children.length - 1].updateMatrix();
  P.addWall(8.7, 10.3, TC.z1 - 1.3, TC.z1 - 0.5, 0, 0.8, { kind: 'furniture', tag: 'roller' });
  B.readable('note-tennis', 'A scorecard in the umpire\'s chair', 'A pencilled card, swollen with damp:\n\nCHARLES v. EDMUND — 6–4, 6–3\nE. B. v. CHARLES — (no score)\n\nUnder it, in a girl\'s hand: "He would not play me. He said girls lose."\n\nAnd under that, in his: "She was winning."', [0.78, 1.85, cz + Wd + 1.75], [1, 0], { visual: false });
  // the chain-link fence, with a gate on the north side
  const linkMat = new THREE.MeshLambertMaterial({ map: chainLink(), color: 0x6a7074, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const FH = 3.0, gateX = -4.5;
  const fence = (axis, c, a0, a1) => {
    const len = a1 - a0, mid = (a0 + a1) / 2, m = linkMat.clone(); m.map = linkMat.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(len / 0.6, FH / 0.6);
    if (axis === 'x') { B.mesh(G.plane, m, mid, FH / 2, c, len, FH, 1, 0); P.addWall(a0, a1, c - 0.05, c + 0.05, 0, FH, { kind: 'rail' }); B.box('metalDark', mid, FH, c, len, 0.05, 0.05); }
    else { B.mesh(G.plane, m, c, FH / 2, mid, len, FH, 1, Math.PI / 2); P.addWall(c - 0.05, c + 0.05, a0, a1, 0, FH, { kind: 'rail' }); B.box('metalDark', c, FH, mid, 0.05, 0.05, len); }
    for (let a = a0; a <= a1 + 0.01; a += 3) { if (axis === 'x') B.mesh(G.post, 'metalDark', a, FH / 2, c, 0.07, FH, 0.07); else B.mesh(G.post, 'metalDark', c, FH / 2, a, 0.07, FH, 0.07); }
  };
  fence('x', TC.z1, TC.x0, gateX - 0.8); fence('x', TC.z1, gateX + 0.8, TC.x1); fence('x', TC.z0, TC.x0, TC.x1);
  fence('z', TC.x0, TC.z0, TC.z1); fence('z', TC.x1, TC.z0, TC.z1);
  // the floodlight masts at the corners, outside the fence, each with a bank of four lamps aimed at the court
  const beamGeo = new THREE.CylinderGeometry(4.2, 0.6, 16, 18, 1, true); beamGeo.translate(0, 8, 0); beamGeo.userData.canonical = 'fitting:tennisbeam';
  const masts = [];
  for (const [mx, mz] of [[TC.x0 - 0.8, TC.z0 - 0.8], [TC.x1 + 0.8, TC.z0 - 0.8], [TC.x0 - 0.8, TC.z1 + 0.8], [TC.x1 + 0.8, TC.z1 + 0.8]]) {
    const MH = 12;
    B.mesh(G.post, 'metalDark', mx, MH / 2, mz, 0.28, MH, 0.28); B.box('stone', mx, 0.2, mz, 0.7, 0.4, 0.7);
    P.addWall(mx - 0.35, mx + 0.35, mz - 0.35, mz + 0.35, 0, MH, { kind: 'tree', occludes: false });
    for (let r = 0; r < 20; r++) B.box('metalDark', mx, 0.6 + r * 0.55, mz + (mz < cz ? 0.16 : -0.16), 0.3, 0.03, 0.03); // the ladder rungs
    const dx = cx - mx, dz = cz - mz, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
    const head = new THREE.Group(); head.position.set(mx, MH + 0.4, mz); head.rotation.y = Math.atan2(ux, uz); B.root.add(head);
    B.box('metalDark', 0, 0, 0, 1.9, 0.08, 0.12, 0, head); B.box('metalDark', 0, 0.75, 0, 1.9, 0.08, 0.12, 0, head);
    const lenses = [];
    for (const [px, py] of [[-0.5, 0.1], [0.5, 0.1], [-0.5, 0.75], [0.5, 0.75]]) {
      const lamp = new THREE.Group(); lamp.position.set(px, py, 0.15); lamp.rotation.x = 0.75; head.add(lamp);
      B.box('metalDark', 0, 0, -0.1, 0.62, 0.48, 0.3, 0, lamp);
      lenses.push(B.box(new THREE.MeshBasicMaterial({ color: 0x1a1c1e }), 0, 0, 0.06, 0.54, 0.4, 0.02, 0, lamp));
    }
    const beam = new THREE.Mesh(beamGeo, beamMaterial(16)); beam.frustumCulled = false; beam.renderOrder = 7;
    beam.position.set(mx + ux * 0.2, MH + 0.7, mz + uz * 0.2);
    const dir = new THREE.Vector3(cx - mx, -MH, cz - mz).normalize(); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    B.root.add(beam); beam.userData.dynamic = true;
    head.traverse(o => { o.userData.dynamic = true; });
    const l = estate('flood', { id: 'tennis-flood-' + masts.length, name: 'Tennis floodlight', kind: 'incandescent', style: 'none', pos: [mx + ux * 0.4, MH + 0.6, mz + uz * 0.4], spot: true, dir: [dir.x, dir.y, dir.z], colour: 0xf2f6ff, target: 2.2, range: 30, corona: 1.6 });
    masts.push({ l, lenses, beam });
  }
  // the way in: a gravel walk from the garden's back arch to the court gate
  game.groundsLights = { washes, masts };
  B.room = 'grounds';
};

BM.updateGroundsLights = function (game, dt, t) {
  const S = game.groundsLights; if (!S) return;
  const c = new THREE.Color();
  for (const w of S.washes) { const l = w.l, k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0; c.setHex(w.hex).multiplyScalar(0.55 * k); w.m.color.copy(c); }
  for (const m of S.masts) {
    const l = m.l, k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0;
    for (const s of m.lenses) s.material.color.setRGB(0.1 + 0.9 * k, 0.11 + 0.89 * k, 0.12 + 0.88 * k);
    m.beam.visible = k > 0.01; m.beam.material.uniforms.level.value = k; m.beam.material.uniforms.time.value = t;
  }
};
})();
