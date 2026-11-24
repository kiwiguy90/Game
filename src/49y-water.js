/* ==========================================================================
   BLACKTHORN MANOR — 6zg. THE WATER, ON ITS OWN SWITCHES
   The fountain on the turning circle, the waterfall at the pond and the
   pumps in the pool garden each have a switch on the side panel (WATER).
   They all run on the lodge supply. When the pool pumps run, six laminar
   jets arc in glassy curves from the kerbs into the deep pool, splashing
   rings where they land, and both pools' surfaces move: ripples drift
   towards the weir and away from the chute, faster with the pumps on.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* a jet of water: smooth and glassy, with light running along it */
function jetMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, level: { value: 0 }, glow: { value: new THREE.Color(0x000000) } }]),
    fog: true, transparent: true, depthWrite: false,
    vertexShader: ['varying vec2 vUv;', THREE.ShaderChunk.fog_pars_vertex, 'void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;', THREE.ShaderChunk.fog_vertex, '}'].join('\n'),
    fragmentShader: [
      'uniform float time; uniform float level; uniform vec3 glow; varying vec2 vUv;', THREE.ShaderChunk.fog_pars_fragment,
      'void main(){',
      // how far the water has reached along the arc (it grows out as the pump starts), and light running down it
      '  if (vUv.x > level * 1.05) discard;',
      '  float run = 0.5 + 0.5 * sin(vUv.x * 40.0 - time * 14.0);',
      '  float rim = pow(abs(sin(vUv.y * 3.14159)), 0.6);',
      '  vec3 c = mix(vec3(0.55, 0.68, 0.74), vec3(0.92, 0.97, 1.0), run * 0.5 + 0.2) + glow;',
      '  gl_FragColor = vec4(c, (0.35 + 0.35 * rim) * smoothstep(1.0, 0.92, vUv.x));',
      THREE.ShaderChunk.fog_fragment, '}',
    ].join('\n'),
  });
}

BM.buildWaterSwitches = function (B, game) {
  const s = (game.menu && game.menu.settings) || {};
  game.waterSw = { fountain: s.waterFountain !== false, cascade: s.waterCascade !== false, pool: s.waterPool !== false };
  const PG = BM.POOLGARDEN; if (!PG) return;
  const { D, LO } = PG;
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'sunken pool';
  /* ---- the jets: from brass nozzles in the kerb, three each side, arcing into the deep pool ---- */
  const reach = 2.6, rise = 0.85, drop = (D.y + 0.06) - (LO.water + 0.01);
  const geo = BM.statuaryGeo('poolJet', () => {
    const pts = []; for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push(new THREE.Vector3(0, 4 * rise * s * (1 - s) - drop * s, reach * s)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.03, 8, false);
  });
  const mat = jetMaterial(), jets = [], splashes = [];
  const splashMat = BM.waterMaterial ? BM.waterMaterial() : new THREE.MeshBasicMaterial({ color: 0xc8d8e0, transparent: true, opacity: 0.4 });
  if (splashMat.uniforms) splashMat.uniforms.speed.value = 0.6;
  for (const side of [-1, 1]) for (const x of [-32, -30, -28]) {
    const z0 = side < 0 ? LO.z0 + 0.05 : LO.z1 - 0.05;
    B.mesh(G.cyl, 'brass', x, D.y + 0.03, z0, 0.07, 0.04, 0.07);                       // the nozzle
    const j = new THREE.Mesh(geo, mat); j.position.set(x, D.y + 0.06, z0); j.rotation.y = side < 0 ? 0 : Math.PI;
    j.userData.dynamic = true; j.renderOrder = 7; j.frustumCulled = false; B.root.add(j); jets.push(j);
    const sp = new THREE.Mesh(G.ring, splashMat); sp.rotation.x = -Math.PI / 2; sp.position.set(x, LO.water + 0.02, z0 - side * reach);
    sp.userData.dynamic = true; sp.renderOrder = 7; B.root.add(sp); splashes.push(sp);
  }
  /* ---- the pools' surfaces, made to move ---- */
  const surfs = [];
  game.B.zones.exterior.traverse(o => { if (o.isMesh && o.material && o.material.isMeshPhongMaterial && o.material.color.getHex() === 0x08262c) surfs.push(o.material); });
  const tex = BM.rippleNormals ? BM.rippleNormals() : null;
  surfs.forEach((m, i) => {
    if (!tex) return;
    const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(i ? 3 : 2.5, i ? 5 : 4);
    m.normalMap = t; m.normalScale = new THREE.Vector2(0.25, 0.25); m.needsUpdate = true;
  });
  game.waterFx = { mat, jets, splashMat, splashes, surfs, level: 0 };
  B.room = 'grounds';
};

/* what is running: the pumps need the lodge supply and their switch */
BM.waterRunning = function (game, which) { return game.grid.live('lodge') && !!(game.waterSw && game.waterSw[which]); };

BM.toggleWater = function (game, which) {
  const W = game.waterSw; W[which] = !W[which];
  const s = game.menu && game.menu.settings; if (s) { s['water' + which.charAt(0).toUpperCase() + which.slice(1)] = W[which]; game.menu.save && game.menu.save(); }
  game.audio.clunk && game.audio.clunk(0.5);
  const live = game.grid.live('lodge');
  const say = {
    fountain: W.fountain ? (live ? 'Out on the turning circle the fountain gurgles, coughs, and begins to play.' : 'The fountain is switched on — but there is no power at the lodge for its pump.') : 'The fountain sinks back into its bowls and stops.',
    cascade: W.cascade ? (live ? 'At the pond the waterfall starts to run again, over the rocks in two white steps.' : 'The waterfall pump is on — but there is no power to run it.') : 'The waterfall at the pond thins to a trickle and stops. The pond goes still.',
    pool: W.pool ? (live ? 'In the pool garden the pumps start: the weir runs, and six jets leap out from the kerbs in glassy arcs.' : 'The pool pumps are on — but there is no power at the lodge.') : 'The pool pumps run down. The jets fall back, the weir stops, the water goes flat.',
  }[which];
  game.ui.say(say, 4);
};

BM.updateWaterSwitches = function (game, dt, t) {
  if (!game.waterSwLoaded && game.menu && game.waterSw) {   // the switches as you left them last time
    game.waterSwLoaded = true; const s = game.menu.settings;
    for (const k of ['fountain', 'cascade', 'pool']) { const v = s['water' + k.charAt(0).toUpperCase() + k.slice(1)]; if (v !== undefined) game.waterSw[k] = v; }
  }
  const F = game.waterFx, pf = game.poolFx, pd = game.pond;
  // the pond's waterfall
  if (pd) {
    const on = BM.waterRunning(game, 'cascade');
    pd.fallLevel = (pd.fallLevel === undefined ? (on ? 1 : 0) : pd.fallLevel) + ((on ? 1 : 0) - (pd.fallLevel || 0)) * Math.min(1, dt * (on ? 0.8 : 1.2));
    pd.fallOn = pd.fallLevel > 0.05;
    pd.fallMat.uniforms.level.value = pd.fallLevel;
    for (const s of pd.sheets) s.visible = pd.fallLevel > 0.01;
    pd.foam.visible = pd.fallLevel > 0.05; pd.foam.material.opacity *= pd.fallLevel;
    if (!pd.fallPos && pd.sheets[1]) pd.fallPos = pd.sheets[1].position.clone();
  }
  if (!F || !pf) return;
  // the jets grow out as the pumps come up, and the splashes ring where they land
  const lv = pf.level;
  F.mat.uniforms.time.value = t; F.mat.uniforms.level.value = lv;
  let k = 0; for (const id of ['pool-under-34', 'pool-under-30']) { const l = game.grid.light(id); if (l && l.target > 0) k = Math.max(k, Math.min(1, l.intensity / l.target)); }
  F.mat.uniforms.glow.value.setRGB(0.05 * k, 0.22 * k, 0.4 * k);
  for (const j of F.jets) j.visible = lv > 0.02;
  if (F.splashMat.uniforms) { F.splashMat.uniforms.time.value = t; F.splashMat.uniforms.level.value = Math.max(0, lv - 0.6) * 1.2; }
  F.splashes.forEach((s, i) => { s.visible = lv > 0.6; s.scale.setScalar(0.35 + 0.12 * Math.sin(t * 9 + i * 1.7)); });
  // the surfaces: ripples drift with the flow, faster and rougher with the pumps on
  const sp = 0.012 + 0.05 * lv;
  F.surfs.forEach((m, i) => { if (!m.normalMap) return; m.normalMap.offset.x -= dt * sp * (i ? 1.2 : 1); m.normalMap.offset.y += dt * sp * 0.25 * Math.sin(t * 0.3 + i); m.normalScale.setScalar(0.2 + 0.35 * lv); });
};
})();
