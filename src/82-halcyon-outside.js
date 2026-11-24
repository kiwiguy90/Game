/* ==========================================================================
   HALCYON HOUSE — OUTSIDE: THE POOL, THE ROOF, THE FOUNTAIN
   - The infinity pool on the lake terrace: its far edge is a weir the water
     slides over into a hidden trough, so from the house the pool runs
     straight into the lake. Lit from under the water, in any colour.
   - A hot tub at the end of the terrace: jets, bubbles and steam.
   - The roof terrace: a fire pit with a lounge round it, planters, and a
     helipad with its lights, and a helicopter on it whose rotors you can
     start.
   - The fountain on the forecourt plays a show: jets leaping to music, lit
     in changing colours.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const POOL_COLOURS = [['Blue', 0x2a7dff], ['Teal', 0x18e0c8], ['Purple', 0x9a46ff], ['Pink', 0xff4fb8], ['Green', 0x2cff6a], ['White', 0xe8f4ff], ['Rainbow', 0xffffff]];

/* water jets you can colour: flowing streaks, additive, lit from below */
function jetMat() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, colour: { value: new THREE.Color(0x9fd8ff) }, level: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform float time; uniform vec3 colour; uniform float level; varying vec2 vUv;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'void main(){ float s = n(vec2(vUv.x * 40.0, vUv.y * 8.0 - time * 9.0)); float a = level * (0.25 + 0.55 * s) * smoothstep(1.0, 0.8, vUv.y);',
      '  gl_FragColor = vec4(mix(colour, vec3(1.0), 0.35 + 0.3 * s) * a, a); }',
    ].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

BM.buildHalcyonOutside = function (B, game) {
  const HC = game.halcyon, M = BM.halcyonMats(), P = B.phys, PL = BM.HALCYON_POOL, R = BM.HALCYON.ROOF;
  const led = (o) => BM.halcyonLed(B, game, o);
  HC.poolColour = 0; HC.tub = false; HC.fire = true; HC.show = false; HC.rotor = 0; HC.rotorOn = false;
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'pool terrace';

  /* ---- the infinity pool ---- */
  const tile = new THREE.MeshPhongMaterial({ color: 0x1c4a66, shininess: 60 });
  B.boxE(tile, PL.x0, PL.x1, -1.6, -1.5, PL.z0, PL.z1);                                     // the floor
  B.boxE(tile, PL.x0 - 0.3, PL.x0, -1.6, 0.02, PL.z0, PL.z1); B.boxE(tile, PL.x1, PL.x1 + 0.3, -1.6, 0.02, PL.z0, PL.z1);
  B.boxE(tile, PL.x0, PL.x1, -1.6, 0.02, PL.z1, PL.z1 + 0.3);
  B.boxE(M.stone, PL.x0 - 0.3, PL.x1 + 0.3, -1.6, -0.06, PL.z0 - 0.3, PL.z0);              // the weir: just under the water
  B.boxE(M.stone, PL.x0 - 0.3, PL.x1 + 0.3, -0.9, -0.8, PL.trough, PL.z0 - 0.3);            // the trough it falls into
  B.boxE(M.stone, PL.x0 - 0.3, PL.x1 + 0.3, -0.9, 0.02, PL.trough - 0.3, PL.trough);
  // you can't walk on it: a low invisible edge all round (the coping is enough to see)
  P.addWall(PL.x0 - 0.3, PL.x1 + 0.3, PL.z1, PL.z1 + 0.3, 0, 1.0, { kind: 'wall', tag: 'pool edge', occludes: false });
  P.addWall(PL.x0 - 0.3, PL.x0, PL.trough - 0.3, PL.z1, 0, 1.0, { kind: 'wall', tag: 'pool edge', occludes: false });
  P.addWall(PL.x1, PL.x1 + 0.3, PL.trough - 0.3, PL.z1, 0, 1.0, { kind: 'wall', tag: 'pool edge', occludes: false });
  P.addWall(PL.x0 - 0.3, PL.x1 + 0.3, PL.trough - 0.3, PL.trough, 0, 1.0, { kind: 'wall', tag: 'pool edge', occludes: false });
  const nm = BM.rippleNormals ? BM.rippleNormals() : null; if (nm) nm.repeat.set(8, 3);
  const water = new THREE.MeshPhongMaterial({ color: 0x0a2a3a, specular: 0xd0e8ff, shininess: 120, transparent: true, opacity: 0.86, normalMap: nm, normalScale: new THREE.Vector2(0.35, 0.35) });
  { const w = B.mesh(G.plane, water, (PL.x0 + PL.x1) / 2, -0.07, (PL.z0 + PL.z1) / 2, PL.x1 - PL.x0, PL.z1 - PL.z0 + 0.3, 1); w.rotation.x = -Math.PI / 2; w.updateMatrix(); w.userData.dynamic = true; }
  // the sheet over the weir
  const flow = BM.waterMaterial ? BM.waterMaterial() : new THREE.MeshBasicMaterial({ color: 0xa0c0d0, transparent: true, opacity: 0.4 });
  if (flow.uniforms) { flow.uniforms.level.value = 0.9; flow.uniforms.speed.value = 1.4; }
  { const sh = B.mesh(G.plane, flow, (PL.x0 + PL.x1) / 2, -0.45, PL.z0 - 0.33, PL.x1 - PL.x0, 0.75, 1); sh.userData.dynamic = true; sh.renderOrder = 6; }
  { const w2 = B.mesh(G.plane, water, (PL.x0 + PL.x1) / 2, -0.78, (PL.trough + PL.z0 - 0.3) / 2, PL.x1 - PL.x0, PL.z0 - 0.3 - PL.trough, 1); w2.rotation.x = -Math.PI / 2; w2.updateMatrix(); }
  // the lights under the water: they take the colour from the panel
  HC.poolLights = [];
  for (let i = 0; i < 8; i++) { const x = PL.x0 + 2 + i * 4; HC.poolLights.push(led({ group: 'hpool', id: 'pool-under-' + i, name: 'Pool light', pos: [x, -0.9, PL.z1 - 0.4], colour: 0x2a7dff, target: 1.1, range: 7, corona: 0.15 })); }
  HC.poolWater = water;

  /* ---- the hot tub: raised in stone at the east end of the terrace ---- */
  const TX = 22, TZ = -29;
  B.solid(M.stone, TX - 1.8, TX + 1.8, 0, 0.55, TZ - 1.8, TZ + 1.8, { kind: 'wall', tag: 'hot tub' });
  const tw = B.mesh(G.cyl, water, TX, 0.56, TZ, 3.0, 0.02, 3.0); tw.userData.dynamic = true;
  HC.tubLight = led({ group: 'hpool', id: 'tub-light', name: 'Hot tub light', pos: [TX, 0.4, TZ], colour: 0x18e0c8, target: 0.9, range: 4, corona: 0.2 });
  HC.tubWater = tw;
  const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  HC.steam = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(G.sphere, steamMat); s.position.set(TX, 0.8, TZ); s.scale.setScalar(0.6); s.userData.dynamic = true; s.userData.ph = i / 6; B.root.add(s); HC.steam.push(s); }
  HC.steamMat = steamMat;
  B.interactable({ id: 'hot-tub', label: () => HC.tub ? 'Hot tub: turn the jets off' : 'Hot tub: turn the jets on', pos: [TX - 1.9, 0.6, TZ], n: [-1, 0], act: g => BM.halcyonTub(g) });

  /* ---- the roof: a fire pit and its lounge, planters, the helipad ---- */
  B.zone = 'mansion'; B.levelName = 'attic'; B.room = 'roof terrace';
  const FX = 12, FZ = -4;
  B.solid(M.concrete, FX - 1.3, FX + 1.3, R, R + 0.45, FZ - 1.3, FZ + 1.3, { kind: 'furniture', tag: 'fire pit' });
  B.boxE(M.black, FX - 1.0, FX + 1.0, R + 0.45, R + 0.47, FZ - 1.0, FZ + 1.0);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  HC.flames = [];
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, f = new THREE.Mesh(G.cone, flameMat); f.position.set(FX + Math.cos(a) * 0.45, R + 0.75, FZ + Math.sin(a) * 0.45); f.scale.set(0.25, 0.6, 0.25); f.userData.dynamic = true; B.root.add(f); HC.flames.push(f); }
  HC.flameMat = flameMat;
  HC.fireLight = led({ group: 'hroof', id: 'fire-pit', name: 'Fire pit', pos: [FX, R + 1.0, FZ], colour: 0xff9a40, target: 1.4, range: 9, corona: 0.4 });
  for (const [x, z, w, d] of [[FX, FZ - 3.2, 4.4, 1.0], [FX, FZ + 3.2, 4.4, 1.0], [FX - 3.2, FZ, 1.0, 4.4]]) B.furniture(M.sofa, x, z, R, w, 0.45, d, 'lounge');
  for (const [x, z] of [[2, -10], [22, -10], [2, 8], [22, 8]]) { B.furniture(M.charcoal, x, z, R, 1.6, 0.7, 1.6, 'planter'); B.mesh(G.sphere, 'leaves', x, R + 1.2, z, 1.2, 0.9, 1.2); }
  // the helipad: a white circle and an H on the west half of the roof, ringed with green lights
  const HX = -14, HZ = -2;
  { const ring = B.mesh(G.ring, M.white, HX, R + 0.01, HZ, 11, 11, 11); ring.rotation.x = -Math.PI / 2; ring.updateMatrix(); }
  B.boxE(M.white, HX - 2.2, HX - 1.4, R, R + 0.012, HZ - 3, HZ + 3); B.boxE(M.white, HX + 1.4, HX + 2.2, R, R + 0.012, HZ - 3, HZ + 3); B.boxE(M.white, HX - 1.4, HX + 1.4, R, R + 0.012, HZ - 0.4, HZ + 0.4);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = HX + Math.cos(a) * 6.2, z = HZ + Math.sin(a) * 6.2; led({ group: 'hroof', id: 'helipad-' + i, name: 'Helipad light', pos: [x, R + 0.12, z], colour: 0x30ff70, target: 0.25, range: 2.5, corona: 1.0, glow: [x, R + 0.06, z, 0.14, 0.08, 0.14] }); }
  // the helicopter: a sleek black machine parked on the pad
  const heli = new THREE.Group(); heli.position.set(HX, R, HZ); heli.rotation.y = 0.5; B.root.add(heli);
  const paint = new THREE.MeshPhongMaterial({ color: 0x15171a, shininess: 120, specular: 0x777777 });
  const tint = new THREE.MeshPhongMaterial({ color: 0x1a2a36, shininess: 140, specular: 0xffffff, transparent: true, opacity: 0.7 });
  B.mesh(G.sphere, paint, 0, 1.45, 0, 1.5, 1.35, 3.6, 0, heli);                     // the cabin
  B.mesh(G.sphere, tint, 0, 1.65, -1.2, 1.36, 0.9, 1.7, 0, heli);                    // its glazing
  B.box(paint, 0, 1.6, 3.6, 0.28, 0.3, 4.4, 0, heli);                               // the tail boom
  B.box(paint, 0, 2.3, 5.6, 0.1, 1.2, 0.8, 0, heli);                                // the fin
  for (const s of [-1, 1]) { B.box(M.steel, s * 0.9, 0.12, 0, 0.08, 0.08, 3.2, 0, heli); B.box(M.steel, s * 0.9, 0.45, -0.8, 0.06, 0.66, 0.06, 0, heli); B.box(M.steel, s * 0.9, 0.45, 0.8, 0.06, 0.66, 0.06, 0, heli); }
  B.box(M.steel, 0, 2.3, 0, 0.18, 0.5, 0.18, 0, heli);
  const rotor = new THREE.Group(); rotor.position.set(0, 2.6, 0); heli.add(rotor);
  for (let i = 0; i < 4; i++) { const blade = B.box(M.black, 4.2, 0, 0, 8.2, 0.04, 0.32, 0, rotor); blade.position.set(Math.cos(i * Math.PI / 2) * 4.1, 0, -Math.sin(i * Math.PI / 2) * 4.1); blade.rotation.y = i * Math.PI / 2; }
  const tailRotor = new THREE.Group(); tailRotor.position.set(0.2, 2.3, 5.8); heli.add(tailRotor);
  for (let i = 0; i < 2; i++) { const b = B.box(M.black, 0, 0, 0, 0.03, 1.4, 0.14, 0, tailRotor); b.rotation.x = i * Math.PI / 2; }
  heli.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
  const beacon = B.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0x300000 }), 0, 2.0, 2.6, 0.1, 0.1, 0.1, 0, heli);
  P.addWall(HX - 1.6, HX + 1.6, HZ - 3.2, HZ + 3.2, R, R + 2.5, { kind: 'furniture', tag: 'helicopter' });
  HC.heli = { heli, rotor, tailRotor, beacon, spin: 0 };
  B.interactable({ id: 'helicopter', label: () => HC.rotorOn ? 'Helicopter: shut the engine down' : 'Helicopter: start the rotors', pos: [HX + 1.8, R + 1.3, HZ], n: [1, 0], approachDist: 1.2, act: g => BM.halcyonHeli(g) });
  B.levelName = 'ground';

  /* ---- the fountain show: nine jets in the forecourt pool ---- */
  B.zone = 'exterior'; B.room = 'forecourt';
  HC.jets = [];
  const jm = [];
  for (let i = 0; i < 9; i++) {
    const a = (i - 1) / 8 * Math.PI * 2, r = i === 0 ? 0 : 2.6, x = Math.sin(a) * r, z = 30 + Math.cos(a) * r;
    const m = jetMat(); jm.push(m);
    const j = new THREE.Mesh(G.cyl, m); j.position.set(x, 0.47, z); j.scale.set(i ? 0.24 : 0.36, 0.01, i ? 0.24 : 0.36); j.userData.dynamic = true; j.renderOrder = 7; j.frustumCulled = false; B.root.add(j);
    const crown = new THREE.Mesh(G.sphere, m); crown.position.set(x, 0.5, z); crown.scale.setScalar(0.01); crown.userData.dynamic = true; crown.renderOrder = 7; B.root.add(crown);
    HC.jets.push({ j, crown, m, x, z, h: 0, ph: i * 0.7 });
  }
  B.levelName = 'ground'; B.room = 'grounds';
  BM.halcyonPoolColour(game, 0, true);
};

/* ---- the controls ---- */
BM.halcyonPoolColour = function (game, dir, quiet) {
  const HC = game.halcyon; HC.poolColour = (HC.poolColour + (dir === undefined ? 1 : dir) + POOL_COLOURS.length) % POOL_COLOURS.length;
  const [name, hex] = POOL_COLOURS[HC.poolColour];
  if (name !== 'Rainbow') { for (const l of HC.poolLights) l.colour = hex; HC.tubLight.colour = hex; }
  if (!quiet) BM.halcyonSay(game, 'Pool lights: ' + name.toLowerCase() + '.', 3);
};
BM.halcyonTub = function (game) {
  const HC = game.halcyon; HC.tub = !HC.tub;
  game.audio.clunk && game.audio.clunk(0.4);
  BM.halcyonSay(game, HC.tub ? 'Hot tub jets on. It is at thirty-eight degrees.' : 'Hot tub jets off.', 3);
};
BM.halcyonFire = function (game) {
  const HC = game.halcyon; HC.fire = !HC.fire; HC.fireLight.on = HC.fire;
  game.audio.burst && game.audio.burst(game.audio.white, 'lowpass', 900, 1, 0.3, 0.01, 0.6);
  BM.halcyonSay(game, HC.fire ? 'Fire pit lit.' : 'Fire pit out.', 3);
};
BM.halcyonHeli = function (game) {
  const HC = game.halcyon; HC.rotorOn = !HC.rotorOn;
  BM.halcyonSay(game, HC.rotorOn ? 'Starting the helicopter. Stand clear of the rotors.' : 'Shutting the helicopter down.', 4);
};
BM.halcyonFountainShow = function (game, on) {
  const HC = game.halcyon; HC.show = on === undefined ? !HC.show : !!on;
  if (HC.show) { HC.beat0 = game.audio.ctx ? game.audio.ctx.currentTime + 0.3 : 0; HC.showT = 0; HC.nextBar = 0; }
  BM.halcyonSay(game, HC.show ? 'Fountain show. Music, and light.' : 'Fountain show off.', 3);
};
/* party mode plays the show; other scenes stop it */
BM.halcyonShowForScene = function (game, scene) { if (game.halcyon && game.halcyon.jets) BM.halcyonFountainShow(game, scene === 'party'); };

/* the show's music: a bright, steady four-chord loop at 112 beats a minute, scheduled a bar ahead */
const BPM = 112, BEAT = 60 / BPM;
const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];   // C, G, Am, F
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function scheduleBar(A, bar, t0, v) {
  const ch = CHORDS[bar % 4], when = t0 - A.ctx.currentTime;
  if (when < -0.1) return;
  for (let b = 0; b < 4; b++) {
    const w = when + b * BEAT;
    A.burst(A.brown, 'lowpass', 120, 1, 0.5 * v, 0.002, 0.25, w);                                // the kick
    A.burst(A.white, 'highpass', 7000, 1, 0.06 * v, 0.001, 0.05, w + BEAT / 2);                   // the hat
    A.tone('sine', hz(ch[0] - 24), hz(ch[0] - 24), 0.12 * v, 0.01, BEAT * 0.9, w);                 // the bass
    for (let k = 0; k < 2; k++) { const n = ch[(b * 2 + k) % 3] + 12; A.tone('triangle', hz(n), hz(n), 0.05 * v, 0.005, BEAT * 0.45, w + k * BEAT / 2); }   // the plucks
  }
  if (bar % 2 === 0) A.tone('sine', hz(ch[2] + 12), hz(ch[2] + 12), 0.04 * v, 0.2, BEAT * 3.5, when);   // a pad
}

BM.updateHalcyonOutside = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.jets) return;
  const t = HC.t, p = game.player, A = game.audio;
  // the pool: ripples drifting towards the edge, and glowing with its lights
  if (HC.poolWater.normalMap) HC.poolWater.normalMap.offset.y += dt * 0.03;
  const [pname] = POOL_COLOURS[HC.poolColour];
  if (pname === 'Rainbow') { const c = HC._pc || (HC._pc = new THREE.Color()); HC.poolLights.forEach((l, i) => { c.setHSL((t * 0.06 + i * 0.08) % 1, 1, 0.55); l.colour = c.getHex(); }); HC.tubLight.colour = HC.poolLights[0].colour; }
  const pl = HC.poolLights[0], k = pl.target > 0 ? Math.min(1, pl.intensity / pl.target) : 0;
  HC.poolWater.emissive.setHex(pl.colour).multiplyScalar(0.22 * k);
  // the hot tub: bubbling, and steam rising off it
  const tubOn = HC.tub;
  HC.tubWater.position.y = 0.56 + (tubOn ? Math.sin(t * 23) * 0.008 : 0);
  HC.steamMat.opacity = tubOn ? 0.08 : 0.03;
  for (const s of HC.steam) { const u = (t * 0.18 + s.userData.ph) % 1; s.position.y = 0.7 + u * 2.4; s.position.x = 22 + Math.sin(u * 6 + s.userData.ph * 9) * 0.5; s.scale.setScalar(0.5 + u * 1.4); }
  if (tubOn && A.ctx && Math.hypot(p.x - 22, p.z + 29) < 10 && Math.random() < dt * 14) A.burst(A.white, 'bandpass', 1800 + Math.random() * 1500, 2, 0.03, 0.002, 0.05);
  // the fire pit
  HC.flameMat.opacity = HC.fire ? 0.85 : 0;
  HC.flames.forEach((f, i) => { f.visible = HC.fire; f.scale.y = 0.45 + 0.35 * Math.abs(Math.sin(t * (5 + i) + i)); f.scale.x = f.scale.z = 0.2 + 0.08 * Math.sin(t * 7 + i); });
  if (HC.fire && A.ctx && Math.hypot(p.x - 12, p.z + 4) < 8 && p.y > 8 && Math.random() < dt * 5) A.burst(A.white, 'highpass', 2500, 1, 0.05, 0.001, 0.03);
  // the helicopter: the rotors spool up and down; the beacon flashes while it runs
  const Hh = HC.heli;
  Hh.spin += ((HC.rotorOn ? 1 : 0) - Hh.spin) * Math.min(1, dt * (HC.rotorOn ? 0.25 : 0.12));
  Hh.rotor.rotation.y += dt * 28 * Hh.spin; Hh.tailRotor.rotation.x += dt * 90 * Hh.spin;
  Hh.beacon.material.color.setHex(HC.rotorOn && (t % 1.2) < 0.15 ? 0xff2020 : 0x300000);
  if (Hh.spin > 0.02 && A.ctx) {
    const d = Math.hypot(p.x + 14, p.y - 8.4, p.z + 2), v = Math.max(0, 1 - d / 120) * Hh.spin;
    if (!HC.heliLoop) HC.heliLoop = A.noiseLoop(A.brown, 'lowpass', 300, 1);
    HC.heliLoop.g.gain.setTargetAtTime(0.35 * v * (0.75 + 0.25 * Math.sin(t * 28 * Hh.spin)), A.ctx.currentTime, 0.02);
  } else if (HC.heliLoop && A.ctx) HC.heliLoop.g.gain.setTargetAtTime(0, A.ctx.currentTime, 0.3);
  // the fountain: a gentle play by itself, the full show to music
  let beat = t / BEAT, bar = 0;
  if (HC.show && A.ctx) {
    const now = A.ctx.currentTime; beat = (now - HC.beat0) / BEAT; bar = Math.floor(beat / 4);
    while (HC.nextBar <= bar + 1) { const v = Math.max(0.15, 1 - Math.hypot(p.x, p.z - 30) / 70); scheduleBar(A, HC.nextBar, HC.beat0 + HC.nextBar * 4 * BEAT, v); HC.nextBar++; }
  } else if (HC.show) beat = t / BEAT;
  const c = HC._jc || (HC._jc = new THREE.Color());
  const live = game.grid.live('lodge') && game.estateGroupOn('hcourt');
  HC.jets.forEach((J, i) => {
    let h;
    if (HC.show) {
      const ph = beat % 4, pulse = Math.pow(Math.max(0, 1 - (beat % 1)), 2), pattern = Math.floor(beat / 8) % 4;
      h = pattern === 0 ? (i === 0 ? 5 : 1.5 + 2 * pulse) : pattern === 1 ? (i === 0 ? 2 + pulse : 1 + 3.5 * Math.max(0, Math.sin(beat * Math.PI / 2 + i * 0.8))) : pattern === 2 ? (i === 0 ? 6 * pulse + 1 : (Math.floor(ph) === (i - 1) % 4 ? 4 : 0.8)) : (2.5 + 2.5 * Math.sin(beat * 0.9 + i));
      c.setHSL(((beat / 16) + i * 0.11) % 1, 0.9, 0.6);
    } else { h = live ? (i === 0 ? 2.2 : 0.9) + Math.sin(t * 1.3 + J.ph) * 0.15 : 0; c.setHex(0x9fd8ff); }
    J.h += (h - J.h) * Math.min(1, dt * (HC.show ? 9 : 2));
    J.j.scale.y = Math.max(0.01, J.h); J.j.position.y = 0.47 + J.h / 2; J.j.visible = J.h > 0.05;
    J.crown.position.y = 0.47 + J.h; J.crown.scale.setScalar(J.h > 0.05 ? 0.18 + J.h * 0.05 : 0.01); J.crown.visible = J.h > 0.05;
    J.m.uniforms.time.value = t; J.m.uniforms.colour.value.copy(c);
  });
  // the fountain's lights follow the show's colours
  if (HC.show) { const ids = game.estateLights.hcourt; for (let i = 0; i < 12; i++) { const l = game.grid.light(ids[i]); if (l) { c.setHSL(((beat / 16) + i * 0.08) % 1, 0.9, 0.6); l.colour = c.getHex(); } } }
  else if (HC.wasShow) { for (const id of game.estateLights.hcourt.slice(0, 12)) { const l = game.grid.light(id); if (l) l.colour = 0x9fd8ff; } }
  HC.wasShow = HC.show;
};

BM.halcyonOutsideRows = function (game) {
  const HC = game.halcyon; if (!HC || !HC.jets) return [];
  const r = (k, name, o) => Object.assign({ section: 'OUTSIDE', supply: '', k: 'smart:' + k, name, on: true, lit: false, live: true }, o);
  return [
    r('show', 'Fountain show', { on: HC.show, onText: 'ON', offText: 'OFF', lit: HC.show }),
    r('pool', 'Pool light colour', { value: POOL_COLOURS[HC.poolColour][0].toUpperCase() }),
    r('tub', 'Hot tub jets', { on: HC.tub, onText: 'ON', offText: 'OFF', lit: HC.tub }),
    r('fire', 'Roof fire pit', { on: HC.fire, onText: 'LIT', offText: 'OUT', lit: HC.fire }),
    r('heli', 'Helicopter rotors', { on: HC.rotorOn, onText: 'RUNNING', offText: 'STOPPED', lit: HC.rotorOn }),
  ];
};
BM.halcyonOutsideToggle = function (game, id) {
  if (id === 'show') BM.halcyonFountainShow(game);
  else if (id === 'pool') BM.halcyonPoolColour(game);
  else if (id === 'tub') BM.halcyonTub(game);
  else if (id === 'fire') BM.halcyonFire(game);
  else if (id === 'heli') BM.halcyonHeli(game);
  else return false;
  return true;
};
})();
