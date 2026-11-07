/* ==========================================================================
   BLACKTHORN MANOR — 7. ATMOSPHERE
   A fixed pool of 8 point + 2 spot lights reassigned every frame to the
   nearest bright fixtures (the light count never changes at runtime),
   occlusion-tested coronas with a four-point star, zone fog that
   cross-fades, rain, lightning, ground mist, the torch beam, the mirrors.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const POOL_POINTS = 8, POOL_SPOTS = 2;
const LIGHT_SCALE = 0.5; // fixture intensity -> real light intensity
BM.POOL = { points: POOL_POINTS, spots: POOL_SPOTS };

const FOG = {
  exterior: { colour: new THREE.Color(0x222b36), density: 0.017 },   // cold blue-grey
  house: { colour: new THREE.Color(0x140c07), density: 0.06 },      // warm brown-black
};
BM.FOG = FOG;

function starTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.08, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.18)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  // the four-point star streak
  for (const [w, h] of [[128, 3], [3, 128], [90, 1.5], [1.5, 90]]) {
    const lg = g.createLinearGradient(64 - w / 2, 64 - h / 2, 64 + w / 2, 64 + h / 2);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(64 - w / 2, 64 - h / 2, w, h);
  }
  const t = new THREE.CanvasTexture(c);
  return t;
}

class FX {
  constructor(game) {
    this.game = game;
    const scene = game.scene, camera = game.camera;
    this.scene = scene; this.camera = camera;
    this.time = 0;

    /* ---- the fixed light pool ---- */
    this.points = []; this.spots = [];
    for (let i = 0; i < POOL_POINTS; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 2);
      l.userData.pool = true; scene.add(l); this.points.push(l);
    }
    for (let i = 0; i < POOL_SPOTS; i++) {
      const l = new THREE.SpotLight(0xffffff, 0, 20, 0.7, 0.6, 2);
      l.userData.pool = true; scene.add(l); scene.add(l.target); this.spots.push(l);
    }
    this.assigned = new Array(POOL_POINTS + POOL_SPOTS).fill(null);
    // ambient: a dim hemisphere (lightning drives it) and a moon
    this.hemi = new THREE.HemisphereLight(0x50607a, 0x0a0806, 0.08); scene.add(this.hemi);
    this.moon = new THREE.DirectionalLight(0x7f95b5, 0.05); this.moon.position.set(-40, 80, 30); scene.add(this.moon);
    // the torch: a spot on the camera, with a visible beam
    this.torch = new THREE.SpotLight(0xffe9c8, 0, 26, 0.42, 0.75, 2);
    this.torch.castShadow = true;
    this.torch.shadow.mapSize.set(512, 512);
    this.torch.shadow.camera.near = 0.3; this.torch.shadow.camera.far = 30;
    camera.add(this.torch); this.torch.position.set(0.18, -0.12, 0.1);
    camera.add(this.torch.target); this.torch.target.position.set(0.1, -0.35, -5);
    this.lightCount = scene.children.filter(o => o.isLight).length + 1;

    const beamGeo = new THREE.CylinderGeometry(2.4, 0.06, 13, 24, 1, true);
    beamGeo.translate(0, -6.5, 0); beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 0);
    this.beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
      uniforms: { level: { value: 0 } },
      vertexShader: 'varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = -position.z / 13.0; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float level; varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 2.2); float fall = pow(clamp(1.0 - vZ, 0.0, 1.0), 2.4); gl_FragColor = vec4(vec3(1.0,0.95,0.85) * edge * fall * 0.085 * level, 1.0); }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    this.beam.position.set(0.18, -0.12, 0.1);
    this.beam.rotation.x = -0.07;
    this.beam.frustumCulled = false;
    this.beam.userData.dynamic = true;
    camera.add(this.beam);

    /* ---- coronas: one Points draw for every light record ---- */
    const lights = game.grid.lights;
    this.coronaCount = lights.length;
    const pos = new Float32Array(lights.length * 3), col = new Float32Array(lights.length * 3), size = new Float32Array(lights.length);
    lights.forEach((l, i) => { pos[i * 3] = l.pos.x; pos[i * 3 + 1] = l.pos.y; pos[i * 3 + 2] = l.pos.z; l.occl = 0; l.occlTarget = 1; l.coronaIndex = i; });
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    cg.setAttribute('colour', new THREE.BufferAttribute(col, 3));
    cg.setAttribute('csize', new THREE.BufferAttribute(size, 1));
    this.coronaGeo = cg;
    this.coronas = new THREE.Points(cg, new THREE.ShaderMaterial({
      uniforms: { map: { value: starTexture() }, scale: { value: 600 } },
      vertexShader: 'attribute vec3 colour; attribute float csize; uniform float scale; varying vec3 vC; void main(){ vC = colour; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = clamp(csize * scale / max(0.5, -mv.z), 0.0, 320.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb * t.a, 1.0); }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    }));
    this.coronas.frustumCulled = false;
    this.coronas.renderOrder = 10;
    this.coronas.userData.dynamic = true;
    scene.add(this.coronas);
    this.occlCursor = 0;
    this.occlPerFrame = 6;

    /* ---- fog volumes ---- */
    this.fogZone = 'exterior';
    scene.fog = new THREE.FogExp2(FOG.exterior.colour.clone(), FOG.exterior.density);
    scene.background = scene.fog.color;

    /* ---- rain ---- */
    this.rainMax = 9000;
    const rp = new Float32Array(this.rainMax * 6), rnd = BM.mulberry32(77);
    for (let i = 0; i < this.rainMax; i++) {
      const x = (rnd() - 0.5) * 44, y = rnd() * 26, z = (rnd() - 0.5) * 44;
      rp.set([x, y, z, x + 0.03, y + 0.55, z + 0.02], i * 6);
    }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }, origin: { value: new THREE.Vector3() }, flash: { value: 0 }, carBox: { value: new THREE.Vector4(0, 0, 0, 0) },
        lp: { value: Array.from({ length: 10 }, () => new THREE.Vector3()) }, lc: { value: Array.from({ length: 10 }, () => new THREE.Vector3()) }, lr: { value: new Float32Array(10) },
      },
      vertexShader: [
        'uniform float time; uniform vec3 origin; uniform vec3 lp[10]; uniform vec3 lc[10]; uniform float lr[10]; varying vec3 vW; varying float vA; varying vec3 vL;',
        'void main(){ vec3 p = position; p.y = mod(p.y - time * 16.0 - origin.y, 26.0) + origin.y - 6.0; p.x = mod(p.x + time * 1.5 - origin.x + 22.0, 44.0) + origin.x - 22.0; p.z = mod(p.z - origin.z + 22.0, 44.0) + origin.z - 22.0;',
        'vW = p; vA = 0.5 + 0.5 * fract(position.x * 13.7);',
        // the streaks nearest a lamp take its colour: rain is only seen where it is lit
        'vL = vec3(0.0); for (int i = 0; i < 10; i++) { if (lr[i] > 0.0) { float w = clamp(1.0 - distance(p, lp[i]) / lr[i], 0.0, 1.0); vL += lc[i] * w * w; } }',
        'gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }',
      ].join('\n'),
      fragmentShader: [
        'uniform float flash; uniform vec4 carBox; varying vec3 vW; varying float vA; varying vec3 vL;',
        'bool inside(vec4 b, float top){ return vW.x > b.x && vW.x < b.y && vW.z > b.z && vW.z < b.w && vW.y < top; }',
        'void main(){ if (inside(vec4(-18.4,18.4,-12.4,12.4), 12.0) || inside(vec4(-17.6,-5.6,79.6,88.4), 5.2) || inside(vec4(25.7,34.3,-2.3,8.3), 3.3) || inside(vec4(-32.2,-26.8,-4.2,2.2), 2.8) || inside(carBox, 1.6)) discard;',
        'if (vW.y < 0.0) discard;',
        'gl_FragColor = vec4((vec3(0.42,0.48,0.58) * (0.10 + flash) + vL * 0.7) * vA, 1.0); }',
      ].join('\n'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.rain.frustumCulled = false;
    this.rain.userData.dynamic = true;
    scene.add(this.rain);

    /* ---- ground mist ---- */
    this.mist = [];
    const mistMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, flash: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [
        'uniform float time; uniform float flash; varying vec3 vW;',
        'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
        'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }',
        'void main(){ vec2 p = vW.xz * 0.06 + vec2(time * 0.02, time * 0.013); float v = n(p) * 0.6 + n(p * 2.3 - time * 0.03) * 0.4; v = smoothstep(0.35, 0.95, v);',
        'if (vW.x > -18.4 && vW.x < 18.4 && vW.z > -12.4 && vW.z < 12.4) discard;',
        'gl_FragColor = vec4(vec3(0.42,0.47,0.55) * (1.0 + flash * 3.0), v * 0.16); }',
      ].join('\n'),
      transparent: true, depthWrite: false,
    });
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(BM.G.ground, mistMat);
      m.scale.set(140, 1, 170); m.position.set(0, 0.25 + i * 0.35, 23);
      m.userData.dynamic = true; m.userData.zone = 'exterior';
      game.B.zones.exterior.add(m); this.mist.push(m);
    }
    this.mistMat = mistMat;

    /* ---- lightning ---- */
    this.flash = 0; this.flashT = 0; this.flashSeq = [];
    this.nextStrike = 6;
    this.rnd = BM.mulberry32(1974);

    /* ---- rotor sweeps (a beam that goes round like a fan) ---- */
    this.rotors = [];
    for (const l of lights) if (l.lightType === 'rotor') {
      const g = new THREE.Group(); g.position.set(l.pos.x, l.pos.y - 0.1, l.pos.z);
      for (const s of [1, -1]) {
        const b = new THREE.Mesh(BM.G.cone, new THREE.MeshBasicMaterial({ color: l.colour, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
        b.scale.set(1.6, 7, 0.4); b.rotation.z = s * Math.PI / 2; b.position.x = s * 3.5;
        g.add(b);
      }
      g.userData.dynamic = true;
      game.B.zones[l.zone].add(g);
      this.rotors.push({ g, l });
    }

    /* ---- mirrors (Library of Mirrors): render-to-texture, round robin ---- */
    this.mirrors = [];
    for (const m of game.mirrors || []) {
      const rt = new THREE.WebGLRenderTarget(256, 512);
      const mat = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: rt.texture }, textureMatrix: { value: new THREE.Matrix4() }, tint: { value: new THREE.Color(0x9aa6ad) } },
        vertexShader: 'uniform mat4 textureMatrix; varying vec4 vUv; void main(){ vUv = textureMatrix * vec4(position,1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform sampler2D tDiffuse; uniform vec3 tint; varying vec4 vUv; void main(){ vec4 c = texture2DProj(tDiffuse, vUv); gl_FragColor = vec4(c.rgb * tint, 1.0); }',
      });
      m.mesh.material = mat;
      this.mirrors.push({ mesh: m.mesh, rt, mat, cam: new THREE.PerspectiveCamera() });
    }
    this.mirrorCursor = 0;
    this.mirrorFallback = new THREE.MeshPhongMaterial({ color: 0x2a3036, specular: 0x9aa6ad, shininess: 140 });
    this._v = new THREE.Vector3(); this._n = new THREE.Vector3(); this._r = new THREE.Matrix4();
    this._mp = new THREE.Vector3(); this._cp = new THREE.Vector3(); this._la = new THREE.Vector3(); this._t = new THREE.Vector3();

    this.quality = { rain: 9000, shadowEvery: 1, mirrors: true };
    this._tmpColour = new THREE.Color();
    this._skyColour = new THREE.Color(); this._flashColour = new THREE.Color(0x8a9ab8);
  }

  /* A light that moves (the car's headlights): keep its corona with it. */
  moveLight(l) {
    const a = this.coronaGeo.attributes.position;
    a.setXYZ(l.coronaIndex, l.pos.x, l.pos.y, l.pos.z); a.needsUpdate = true;
  }

  /* Choose the pool assignments for this frame. Returns the chosen records. */
  assignPool(cam, visibleZones) {
    const lights = this.game.grid.lights;
    const pts = [], sps = [];
    for (const l of lights) {
      if (l.intensity < 0.02 || !visibleZones[l.zone]) continue;
      const dx = l.pos.x - cam.x, dy = l.pos.y - cam.y, dz = l.pos.z - cam.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      const reach = l.range * 2.5;
      if (d2 > reach * reach) continue;
      const score = l.intensity * l.range * l.range / (d2 + 1);
      (l.spot ? sps : pts).push({ l, score });
    }
    pts.sort((a, b) => b.score - a.score); sps.sort((a, b) => b.score - a.score);
    // spill spare spot-type fixtures into point slots
    for (let i = POOL_SPOTS; i < sps.length; i++) pts.push(sps[i]);
    pts.sort((a, b) => b.score - a.score);
    const chosen = [];
    for (let i = 0; i < POOL_POINTS; i++) {
      const p = this.points[i], c = pts[i];
      if (c) {
        p.position.set(c.l.pos.x, c.l.pos.y, c.l.pos.z);
        p.color.setHex(c.l.colour); p.intensity = c.l.intensity * LIGHT_SCALE; p.distance = c.l.range * 1.15;
        chosen.push(c.l);
      } else p.intensity = 0;
      this.assigned[i] = c ? c.l : null;
    }
    for (let i = 0; i < POOL_SPOTS; i++) {
      const s = this.spots[i], c = sps[i];
      if (c) {
        const d = c.l.dir || [0, -1, 0];
        s.position.set(c.l.pos.x, c.l.pos.y, c.l.pos.z);
        s.target.position.set(c.l.pos.x + d[0] * 5, c.l.pos.y + d[1] * 5, c.l.pos.z + d[2] * 5);
        s.target.updateMatrixWorld();
        s.color.setHex(c.l.colour); s.intensity = c.l.intensity * LIGHT_SCALE * 1.6; s.distance = c.l.range * 1.6;
        chosen.push(c.l);
      } else s.intensity = 0;
      this.assigned[POOL_POINTS + i] = c ? c.l : null;
    }
    return chosen;
  }

  strike(close) {
    // a lightning flash: a stutter of bright pulses, thunder after the light
    const n = 2 + Math.floor(this.rnd() * 3);
    this.flashSeq = [];
    let t = 0;
    for (let i = 0; i < n; i++) { this.flashSeq.push({ t, v: 0.6 + this.rnd() * 0.6 }); t += 0.05 + this.rnd() * 0.12; this.flashSeq.push({ t, v: 0.05 }); t += 0.04 + this.rnd() * 0.1; }
    this.flashSeq.push({ t: t + 0.1, v: 0 });
    this.flashT = 0;
    const distance = close ? 120 : 700 + this.rnd() * 2600;
    const delay = distance / 343;
    this.game.audio.thunder(delay, close ? 1.0 : Math.max(0.25, 1 - distance / 3600));
    this.lastStrike = { distance, delay, at: this.time };
    return this.lastStrike;
  }

  update(dt, ctx) {
    const game = this.game, grid = game.grid, cam = ctx.camPos;
    this.time += dt;
    const t = this.time;
    BM.wind.value = t;

    /* lightning */
    if (game.storm) {
      this.nextStrike -= dt;
      if (this.nextStrike <= 0) { this.strike(false); this.nextStrike = 9 + this.rnd() * 18; }
    }
    this.flashT += dt;
    let f = 0;
    for (const s of this.flashSeq) if (this.flashT >= s.t) f = s.v;
    this.flash += (f - this.flash) * Math.min(1, dt * 40);
    const outdoorFactor = ctx.zone === 'exterior' ? 1 : (ctx.zone === 'house' ? 0.3 : 0);
    this.hemi.intensity = 0.06 + this.flash * 2.2 * outdoorFactor + (ctx.zone === 'exterior' ? 0.04 : 0);
    this.moon.intensity = (ctx.zone === 'exterior' ? 0.06 : 0.0) + this.flash * 1.6 * outdoorFactor;

    /* fog cross-fade */
    const target = FOG[ctx.zone] || FOG.exterior;
    const k = Math.min(1, dt * 1.4);
    this.scene.fog.color.lerp(target.colour, k);
    this.scene.fog.density += (target.density - this.scene.fog.density) * k;
    if (this.flash > 0.05 && ctx.zone === 'exterior') {
      this._skyColour.copy(this.scene.fog.color).lerp(this._flashColour, Math.min(0.6, this.flash * 0.5));
      this.scene.background = this._skyColour;
    } else this.scene.background = this.scene.fog.color;
    this.fogZone = ctx.zone;

    /* pool */
    const chosen = this.assignPool(cam, ctx.visibleZones);

    /* torch */
    const torchOn = game.player.torch;
    // an old torch: softer up close so walls don't white out, still reaching down a corridor
    let torchTarget = 0;
    if (torchOn) {
      const f = game.forward(), p = game.player;
      let near = 6;
      for (let d = 0.3; d < 6; d += 0.3) if (game.phys.blocked(p.x + f.x * d, p.z + f.z * d, p.y, 0.05)) { near = d; break; }
      torchTarget = 0.95 * Math.min(1, 0.35 + near / 3.5);
    }
    this.torch.intensity += (torchTarget - this.torch.intensity) * Math.min(1, dt * 10);
    this.beam.material.uniforms.level.value = torchOn ? Math.min(1, this.torch.intensity / 0.95) : 0;
    this.beam.visible = this.torch.intensity > 0.02;

    /* coronas + bulbs */
    const lights = grid.lights, col = this.coronaGeo.attributes.colour.array, size = this.coronaGeo.attributes.csize.array;
    const n = lights.length;
    for (let i = 0; i < this.occlPerFrame && n; i++) {
      const l = lights[this.occlCursor = (this.occlCursor + 1) % n];
      if (l.intensity < 0.02 || !ctx.visibleZones[l.zone]) continue;
      l.occlTarget = game.phys.occluded(cam.x, cam.y, cam.z, l.pos.x, l.pos.y, l.pos.z, 0.35) ? 0 : 1;
    }
    for (let i = 0; i < n; i++) {
      const l = lights[i];
      l.occl += (l.occlTarget - l.occl) * Math.min(1, dt * 10);
      let a = l.target > 0 ? Math.min(1.6, l.intensity / l.target) : 0;
      if (!ctx.visibleZones[l.zone]) a = 0;
      a *= l.occl * l.corona;
      this._tmpColour.setHex(l.colour);
      col[i * 3] = this._tmpColour.r * a; col[i * 3 + 1] = this._tmpColour.g * a; col[i * 3 + 2] = this._tmpColour.b * a;
      size[i] = a > 0.01 ? (l.kind === 'fire' ? 0.5 : 0.35 + 0.12 * l.target) : 0;
      const glow = l.target > 0 ? Math.min(1.4, l.intensity / l.target) : 0;
      if (l.bulb) l.bulb.material.color.setHex(l.colour).multiplyScalar(glow > 0.02 ? 0.3 + 0.75 * Math.min(1, glow) : 0.07);
      if (l.bulbBox) l.bulbBox.material.color.setHex(l.colour).multiplyScalar(glow > 0.02 ? 0.25 + 0.75 * Math.min(1, glow) : 0.06);
      if (l.scorch) l.scorch.visible = l.scorched;
    }
    this.coronaGeo.attributes.colour.needsUpdate = true;
    this.coronaGeo.attributes.csize.needsUpdate = true;
    if (this.look) this.look.update(dt, ctx);

    /* rain and mist */
    const outdoorsVisible = ctx.visibleZones.exterior;
    this.rain.visible = game.storm && outdoorsVisible;
    this.rain.material.uniforms.time.value = t;
    this.rain.material.uniforms.origin.value.set(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z));
    this.rain.material.uniforms.flash.value = this.flash;
    if (game.car) { const c = game.car.group.position; this.rain.material.uniforms.carBox.value.set(c.x - 2.3, c.x + 2.3, c.z - 1.0, c.z + 1.0); }
    this.rain.geometry.setDrawRange(0, this.quality.rain * 2);
    this.mistMat.uniforms.time.value = t;
    this.mistMat.uniforms.flash.value = this.flash * outdoorFactor;

    /* rotors */
    for (const r of this.rotors) {
      const on = r.l.intensity > 0.02;
      r.g.visible = on && ctx.visibleZones[r.l.zone];
      r.g.rotation.y = (t * 1.6 + r.l.phase) * Math.PI * 2;
      for (const b of r.g.children) b.material.opacity = on ? 0.18 : 0;
    }
    this.updateAppliances(dt, t);
    return chosen;
  }

  updateAppliances(dt, t) {
    const game = this.game, grid = game.grid;
    // switchboards: levers follow their circuits, lamps glow when live, needles swing with the load
    for (const sb of game.switchboards || []) {
      for (const l of sb.levers) {
        const target = l.state() ? -0.55 : 0.55, m = l.mesh;
        m.rotation.set(m.rotation.x + (target - m.rotation.x) * Math.min(1, dt * 25), l.ry, 0);
      }
      for (const l of sb.lamps) l.mesh.material.color.setHex(l.state() ? l.colour : 0x200a06);
      for (const nd of sb.needles) {
        nd.cur = (nd.cur || 0) + ((nd.value() * 1.6 - 0.8) - (nd.cur || 0)) * Math.min(1, dt * 3);
        const wobble = nd.value() > 0 ? Math.sin(t * 9 + nd.lx * 7) * 0.015 : 0;
        nd.mesh.rotation.set(0, nd.ry, -(nd.cur + wobble) * 1.2 + 0.0);
      }
    }
    // wall switch toggles: up for on, down for off, with a quick snap
    for (const it of game.interactables) {
      const sv = it.switchVisual; if (!sv) continue;
      // the toggle always shows the real state of its fittings (MAIN can switch them all on)
      const live = sv.ids.map(id => grid.light(id)).filter(l => l && !l.dead);
      if (live.length) it.leverOn = live.some(l => l.on);
      const target = it.leverOn ? -0.5 : 0.5;
      sv.lever.rotation.set(sv.lever.rotation.x + (target - sv.lever.rotation.x) * Math.min(1, dt * 30), sv.ry, 0);
    }
    for (const a of grid.appliances) {
      if (!a.object) continue;
      if (a.kind === 'fan') {
        if (a.axis === 'z') a.object.rotation.z = a.angle; else a.object.rotation.y = a.angle;
      } else if (a.kind === 'radio') {
        a.object.material.color.setHex(a.running ? 0xffb050 : 0x221608);
      } else if (a.kind === 'tv') {
        const v = a.running ? 0.35 + 0.25 * BM.noise1(t * 30) : 0.03;
        a.object.material.color.setRGB(v * 0.8, v * 0.9, v);
      } else if (a.kind === 'record') {
        a.object.rotation.y = a.angle;
      } else if (a.kind === 'kettle') {
        a.object.material.color.setHex(a.running ? 0xff2a10 : 0x200606);
      } else if (a.kind === 'heater') {
        a.object.material.color.setRGB(0.1 + a.glow * 0.9, 0.04 + a.glow * 0.32, 0.02 + a.glow * 0.04);
        if (a.light) a.light.target = 0.6 * Math.max(0.05, a.glow);
      } else if (a.kind === 'fridge') {
        a.object.material.color.setHex(a.running ? 0x30ff60 : 0x101010);
      } else if (a.kind === 'clock') {
        const s = a.clockTime;
        a.object.second.rotation.z = -Math.floor(s % 60) / 60 * Math.PI * 2;
        a.object.minute.rotation.z = -(s % 3600) / 3600 * Math.PI * 2;
        a.object.hour.rotation.z = -(s % 43200) / 43200 * Math.PI * 2;
      }
    }
    // fire
    for (const fire of game.fires || []) {
      const small = fire.kind === 'candle';
      for (let i = 0; i < fire.flames.length; i++) {
        const fl = fire.flames[i];
        const v = fire.lit ? 0.5 + 0.5 * BM.noise1(t * (small ? 9 : 6) + i * 3 + fire.pos.x) : 0;
        fl.material.opacity = fire.lit ? (small ? 0.85 : 0.7) : 0;
        if (small) fl.scale.set(0.05, 0.08 + v * 0.07, 0.05); else if (fire.kind === 'hearth') fl.scale.set(0.25, 0.3 + v * 0.6, 0.25); else fl.scale.set(0.14, 0.18 + v * 0.25, 0.14);
        fl.visible = fire.lit;
      }
    }
  }

  /* Render one mirror per frame while the player is in the library. */
  renderMirrors(renderer, active) {
    const on = this.quality.mirrors;
    for (const m of this.mirrors) m.mesh.material = on ? m.mat : this.mirrorFallback;
    if (!active || !on || !this.mirrors.length) return 0;
    const m = this.mirrors[this.mirrorCursor = (this.mirrorCursor + 1) % this.mirrors.length];
    const camera = this.camera, mesh = m.mesh;
    mesh.updateMatrixWorld();
    this._mp.setFromMatrixPosition(mesh.matrixWorld);
    this._cp.setFromMatrixPosition(camera.matrixWorld);
    this._r.extractRotation(mesh.matrixWorld);
    this._n.set(0, 0, 1).applyMatrix4(this._r);
    this._v.subVectors(this._mp, this._cp);
    if (this._v.dot(this._n) > 0) return 0;
    this._v.reflect(this._n).negate().add(this._mp);
    this._r.extractRotation(camera.matrixWorld);
    this._la.set(0, 0, -1).applyMatrix4(this._r).add(this._cp);
    this._t.subVectors(this._mp, this._la).reflect(this._n).negate().add(this._mp);
    const vc = m.cam;
    vc.position.copy(this._v);
    vc.up.set(0, 1, 0).applyMatrix4(this._r).reflect(this._n);
    vc.lookAt(this._t);
    vc.far = 40; vc.near = 0.1;
    vc.updateMatrixWorld();
    vc.projectionMatrix.copy(camera.projectionMatrix);
    const tm = m.mat.uniforms.textureMatrix.value;
    tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    tm.multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse).multiply(mesh.matrixWorld);
    // oblique near plane on the mirror, so the wall behind it is clipped away
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(this._n, this._mp).applyMatrix4(vc.matrixWorldInverse);
    const cp = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const pm = vc.projectionMatrix.elements, q = new THREE.Vector4(
      (Math.sign(cp.x) + pm[8]) / pm[0], (Math.sign(cp.y) + pm[9]) / pm[5], -1.0, (1.0 + pm[10]) / pm[14]);
    cp.multiplyScalar(2.0 / cp.dot(q));
    pm[2] = cp.x; pm[6] = cp.y; pm[10] = cp.z + 1.0 - 0.003; pm[14] = cp.w;
    mesh.visible = false;
    const beamVis = this.beam.visible; this.beam.visible = false;
    renderer.setRenderTarget(m.rt);
    renderer.clear();
    renderer.render(this.scene, vc);
    renderer.setRenderTarget(null);
    mesh.visible = true; this.beam.visible = beamVis;
    return 1;
  }
}
BM.FX = FX;
})();
