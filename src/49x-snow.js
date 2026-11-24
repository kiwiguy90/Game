/* ==========================================================================
   BLACKTHORN MANOR — 6zf. SNOW
   A weather of its own (the panel's Weather row, or the pause menu): no
   wind to speak of, no thunder, just snow coming down out of the dark, and
   lying. It settles over a few minutes — patchy first, then white — on the
   lawns, the drive, the roofs, the tops of the walls and the hedges, but
   never indoors and never under a roof or a tree: before the first flake
   the estate is looked at once from straight above, and only what can see
   the sky gets snow. Your footprints follow you across it, and fill in.
   Steps crunch. The snow throws the lamplight back, so the night outside is
   a little brighter. When it stops, the snow slowly goes.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const SETTLE = 150;            // seconds of snowfall to lie white
const MELT = 240;              // seconds to go again once it stops
const MAP = { cx: 0, cz: 15, size: 340, res: 2048, top: 60, depth: 80 };
const SNOW_RGB = [0.86, 0.885, 0.93];

/* shared by every patched material */
const U = { snAmt: { value: 0 }, snMap: { value: null }, snMat: { value: new THREE.Matrix4() }, snReady: { value: 0 } };
BM.SNOW_UNIFORMS = U;

/* ---- what can see the sky: a height map from straight above ---- */
function buildSkyMap(game) {
  const r = game.renderer; if (!r || !r.setRenderTarget) return false;
  const rt = new THREE.WebGLRenderTarget(MAP.res, MAP.res, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  const h = MAP.size / 2, cam = new THREE.OrthographicCamera(-h, h, h, -h, 0, MAP.depth);
  cam.position.set(MAP.cx, MAP.top, MAP.cz); cam.up.set(0, 0, -1); cam.lookAt(MAP.cx, MAP.top - 1, MAP.cz); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const scene = game.scene, zones = game.B.zones, keep = [], vis = [];
  const zoneSet = new Set(Object.values(zones));
  for (const o of scene.children) { keep.push([o, o.visible]); o.visible = zoneSet.has(o); }
  // each pixel keeps the height of the highest solid thing over it, in two bytes (to a millimetre or so)
  const depthMat = new THREE.ShaderMaterial({
    vertexShader: 'varying float vY;\nvoid main(){ vec4 p = vec4(position, 1.0);\n#ifdef USE_INSTANCING\np = instanceMatrix * p;\n#endif\nvec4 w = modelMatrix * p; vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'varying float vY;\nvoid main(){ float v = clamp((vY - ' + (MAP.top - MAP.depth).toFixed(1) + ') / ' + MAP.depth.toFixed(1) + ', 0.0, 1.0) * 255.0; gl_FragColor = vec4(floor(v) / 255.0, fract(v), 0.0, 1.0); }',
    side: THREE.DoubleSide,
  });
  const over = scene.overrideMaterial, bg = scene.background, fog = scene.fog;
  // only solid meshes count: no lines, points, sprites or glass
  // only solid things count: no lines, points or glass, and no grass or swaying fronds (snow lies through them)
  scene.traverse(o => { const m = o.material; if (o.visible && (o.isPoints || o.isLine || o.isSprite || (m && !Array.isArray(m) && ((m.transparent && m.opacity < 0.5) || m.isShaderMaterial || m.depthWrite === false || (m.userData && m.userData.sway))))) { vis.push(o); o.visible = false; } });
  scene.overrideMaterial = depthMat; scene.background = null; scene.fog = null;
  const prevRT = r.getRenderTarget(), clear = r.getClearColor(new THREE.Color()).getHex(), clearA = r.getClearAlpha();
  r.setRenderTarget(rt); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, cam);
  // and keep a copy on the CPU, to know where you are standing in the open
  const px = new Uint8Array(MAP.res * MAP.res * 4);
  try { r.readRenderTargetPixels(rt, 0, 0, MAP.res, MAP.res, px); } catch (e) { /* the footprints just go everywhere */ }
  r.setRenderTarget(prevRT); r.setClearColor(clear, clearA);
  scene.overrideMaterial = over; scene.background = bg; scene.fog = fog;
  for (const o of vis) o.visible = true;
  for (const [o, v] of keep) o.visible = v;
  U.snMap.value = rt.texture; U.snMat.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); U.snReady.value = 1;
  game.snow.px = px; game.snow.cam = cam;
  return true;
}
/* the height of the first thing the sky sees at x,z (CPU side) */
function skyTop(S, x, z) {
  if (!S.px) return -Infinity;
  const v = new THREE.Vector3(x, 0, z).applyMatrix4(U.snMat.value);
  const u = Math.floor((v.x * 0.5 + 0.5) * MAP.res), w = Math.floor((v.y * 0.5 + 0.5) * MAP.res);
  if (u < 0 || w < 0 || u >= MAP.res || w >= MAP.res) return -Infinity;
  const i = (w * MAP.res + u) * 4, p = S.px;
  return MAP.top - MAP.depth + (p[i] + p[i + 1] / 255) / 255 * MAP.depth;
}
BM.snowSkyTop = (game, x, z) => skyTop(game.snow, x, z);

/* ---- every lit surface learns to carry snow ---- */
const VERT_PARS = 'varying vec3 snWP;\nvarying vec3 snWN;\n';
const VERT = [
  'vec4 snW = vec4(transformed, 1.0); vec3 snN = objectNormal;',
  '#ifdef USE_INSTANCING',
  'snW = instanceMatrix * snW; snN = mat3(instanceMatrix) * snN;',
  '#endif',
  'snW = modelMatrix * snW; snWP = snW.xyz; snWN = mat3(modelMatrix) * snN;',
].join('\n');
const FRAG_PARS = [
  'varying vec3 snWP; varying vec3 snWN; uniform float snAmt; uniform sampler2D snMap; uniform mat4 snMat; uniform float snReady;',
  'float snHeight(vec4 v) { return ' + (MAP.top - MAP.depth).toFixed(1) + ' + (v.r * 255.0 + v.g) / 255.0 * ' + MAP.depth.toFixed(1) + '; }',
  'float snHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float snNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(snHash(i), snHash(i + vec2(1.0, 0.0)), f.x), mix(snHash(i + vec2(0.0, 1.0)), snHash(i + vec2(1.0, 1.0)), f.x), f.y); }',
].join('\n');
const FRAG = [
  'if (snAmt > 0.001) {',
  '  float snUp = smoothstep(0.25, 0.6, normalize(snWN).y);',   // flat ground, and roofs up to a steep pitch
  '  float snOpen = 1.0;',
  '  if (snReady > 0.5) { vec4 snC = snMat * vec4(snWP, 1.0); vec2 snUV = snC.xy * 0.5 + 0.5;',
  '    if (snUV.x > 0.0 && snUV.x < 1.0 && snUV.y > 0.0 && snUV.y < 1.0) { float snTop = snHeight(texture2D(snMap, snUV)); snOpen = smoothstep(snTop - 0.45, snTop - 0.15, snWP.y); } }',
  // it lies in drifts and patches first, then everywhere
  '  float snPatch = snNoise(snWP.xz * 0.35) * 0.6 + snNoise(snWP.xz * 1.7) * 0.4;',
  '  float snK = snUp * snOpen * smoothstep(snPatch - 0.15, snPatch + 0.15, snAmt * 1.35 - 0.1);',
  '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(' + SNOW_RGB.join(', ') + '), snK * 0.96);',
  '}',
].join('\n');

function patch(mat) {
  if (!mat || mat.userData.snow || !(mat.isMeshPhongMaterial || mat.isMeshLambertMaterial || mat.isMeshStandardMaterial)) return;
  mat.userData.snow = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = function (shader, renderer) {
    if (prev) prev.call(this, shader, renderer);
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_PARS).replace('#include <fog_vertex>', '#include <fog_vertex>\n' + VERT);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG_PARS).replace('#include <color_fragment>', '#include <color_fragment>\n' + FRAG);
  };
  mat.customProgramCacheKey = () => prevKey + '|snow';
  mat.needsUpdate = true;
}
function patchAll(game) {
  for (const z of Object.values(game.B.zones)) z.traverse(o => { if (!o.material) return; if (Array.isArray(o.material)) o.material.forEach(patch); else patch(o.material); });
}

BM.buildSnow = function (B, game) {
  const scene = B.zones.mansion.parent;
  const S = game.snow = { cover: 0, falling: 0, prints: [], printI: 0, stepL: false, ready: false };
  /* the flakes: a box of them that travels with you, drifting down and sideways */
  // (they ride on the rain's own points: the shader wraps them into a box of their own)
  const geo = new THREE.BufferGeometry();   // replaced by the rain's points once the effects exist
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, origin: { value: new THREE.Vector3() }, density: { value: 0 }, scale: { value: 300 }, lit: { value: 0.12 }, manorBoxes: BM.ROOF_BOXES.manor, roofBoxes: BM.ROOF_BOXES.boxes, roofTops: BM.ROOF_BOXES.tops },
    vertexShader: [
      'uniform float time; uniform vec3 origin; uniform float scale; varying vec3 vW; varying float vA;',
      'void main(){ vec3 p = position; float s = fract(p.x * 7.13 + p.z * 3.7);',
      ' p.y = mod(p.y - time * (0.7 + 0.5 * s) - origin.y, 22.0) + origin.y - 5.0;',
      ' p.x = mod(p.x + sin(time * 0.6 + p.y * 0.8 + s * 6.0) * 0.6 + time * 0.25 - origin.x + 20.0, 40.0) + origin.x - 20.0;',
      ' p.z = mod(p.z + cos(time * 0.5 + p.y * 0.7 + s * 4.0) * 0.6 - origin.z + 20.0, 40.0) + origin.z - 20.0;',
      ' vW = p; vA = s; vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;',
      ' gl_PointSize = clamp(scale * (0.35 + 0.45 * s) / -mv.z, 1.0, 9.0); }',
    ].join('\n'),
    fragmentShader: [
      'uniform float density; uniform float lit; uniform float manorBoxes; uniform vec4 roofBoxes[8]; uniform float roofTops[8]; varying vec3 vW; varying float vA;',
      'bool inside(vec4 b, float top){ return vW.x > b.x && vW.x < b.y && vW.z > b.z && vW.z < b.w && vW.y < top; }',
      'bool underRoof(){ for (int i = 0; i < 8; i++) { if (inside(roofBoxes[i], roofTops[i])) return true; } return false; }',
      'void main(){ if (vA > density) discard;',
      ' if ((manorBoxes > 0.5 && (inside(vec4(-18.4,18.4,-12.4,12.4), 12.0) || inside(vec4(-17.6,-5.6,79.6,88.4), 5.2) || inside(vec4(33.8,50.2,-6.2,4.2), 8.4) || inside(vec4(-52.2,-37.8,-28.2,-19.8), 5.3) || inside(vec4(-58.2,-39.8,-4.2,2.2), 5.4) || inside(vec4(45.8,52.2,-22.2,-13.8), 4.8) || inside(vec4(50.9,54.3,71.2,77.6), 8.8) || inside(vec4(-50.6,-45.4,-46.6,-38.3), 3.6) || inside(vec4(-32.2,-26.8,-4.2,2.2), 2.8) || inside(vec4(52.8,61.2,30.8,37.2), 7.2) || inside(vec4(31.6,47.2,13.8,25.2), 7.8))) || underRoof()) discard;',
      ' if (vW.y < -0.5) discard;',
      ' vec2 c = gl_PointCoord - 0.5; float r = dot(c, c); if (r > 0.25) discard;',
      ' gl_FragColor = vec4(vec3(0.88, 0.9, 0.96) * lit, (1.0 - r * 4.0) * 0.85); }',
    ].join('\n'),
    transparent: true, depthWrite: false,
  });
  const flakes = S.flakes = new THREE.Points(geo, mat);
  flakes.frustumCulled = false; flakes.visible = false; flakes.userData.dynamic = true;
  scene.add(flakes);
  /* footprints: pressed into it, a little blue-grey */
  const NP = 260, fm = new THREE.MeshLambertMaterial({ color: 0x6e7888, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const fp = S.printMesh = new THREE.InstancedMesh(G.plane, fm, NP);
  fp.instanceMatrix.setUsage(THREE.DynamicDrawUsage); fp.count = 0; fp.frustumCulled = false; fp.userData.dynamic = true;
  scene.add(fp);
};

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

/* standing in the open, on snow that is lying? */
function onSnow(game) {
  const S = game.snow, p = game.player; if (!S || S.cover < 0.3) return false;
  if (game.zoneAt(p.x, p.y, p.z) !== 'exterior') return false;
  const top = skyTop(S, p.x, p.z);
  return !S.px || Math.abs(top - p.y) < 0.35;
}
/* a step: on snow it crunches, and leaves a print */
BM.snowStep = function (game, surface) {
  const S = game.snow; if (!onSnow(game)) return surface;
  const p = game.player, side = (S.stepL = !S.stepL) ? 1 : -1, fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
  const x = p.x + fz * 0.13 * side, z = p.z - fx * 0.13 * side;
  S.prints[S.printI] = { x, z, y: p.y + 0.015, yaw: p.yaw, age: 0 };
  S.printI = (S.printI + 1) % 260;
  S.printsDirty = true;
  return 'snow';
};

BM.updateSnow = function (game, dt) {
  const S = game.snow; if (!S) return;
  if (game.fx && game.fx.rain && S.flakes.geometry !== game.fx.rain.geometry) { S.flakes.geometry.dispose(); S.flakes.geometry = game.fx.rain.geometry; }
  const W = game.weather, snowing = game.night === 'snow' && !(W && W.clear >= 1);
  // fall and settle; stop and go
  S.falling += ((snowing ? 1 : 0) - S.falling) * Math.min(1, dt / 4);
  if (snowing) S.cover = Math.min(1, S.cover + dt / SETTLE * (S.cover < 0.2 ? 1.6 : 1));
  else S.cover = Math.max(0, S.cover - dt / MELT * (game.timeOfDay === 'day' ? 2 : 1));
  if ((snowing || S.cover > 0) && !S.ready) {
    S.ready = true; patchAll(game);
    if (!game.headless) buildSkyMap(game);
  }
  U.snAmt.value = S.cover;
  // the flakes travel with you
  const fl = S.flakes, cam = game.camera.position, ctx = game.ctx, out = ctx && ctx.visibleZones ? ctx.visibleZones.exterior : true;
  fl.visible = S.falling > 0.01 && out;
  if (fl.visible) {
    const u = fl.material.uniforms; u.time.value += dt; u.origin.value.set(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z));
    u.density.value = S.falling * Math.min(1, (game.fx && game.fx.quality ? game.fx.quality.rain : 9000) / 9000);
    u.lit.value = 0.55 + 0.4 * (game.grid.daylight || 0);
    u.scale.value = (game.renderer && game.renderer.domElement ? game.renderer.domElement.height : 720) * 0.35;
  }
  // footprints fill in while it snows, and melt with it
  const fp = S.printMesh, fill = snowing ? dt / 90 : 0;
  let n = 0;
  if (S.cover > 0.2) {
    for (const pr of S.prints) {
      if (!pr) continue;
      pr.age += fill;
      if (pr.age >= 1) continue;
      const k = 1 - pr.age;
      e3.set(-Math.PI / 2, 0, pr.yaw); q.setFromEuler(e3); v3.set(pr.x, pr.y, pr.z); s3.set(0.11 * k + 0.02, 0.28 * k + 0.04, 1);
      m4.compose(v3, q, s3); fp.setMatrixAt(n++, m4);
    }
  }
  fp.count = n; fp.instanceMatrix.needsUpdate = true;
  fp.material.opacity = 0.55 * Math.min(1, S.cover * 1.5);
};

/* after the light: snow on the ground throws it back */
BM.snowAfterFx = function (game) {
  const S = game.snow; if (!S || S.cover <= 0 || !game.fx || !game.fx.hemi) return;
  const out = game.ctx && game.ctx.zone === 'exterior';
  game.fx.hemi.intensity += (out ? 0.16 : 0.05) * S.cover;
};
})();
