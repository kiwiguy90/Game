/* ==========================================================================
   BLACKTHORN MANOR — 6zh. FIREWORKS OVER THE LAKE
   From the side panel: a show of about a minute, fired from the middle of
   the lake. Rockets go up with a whistle and a trail of sparks; they burst
   into peonies, gold willows that hang and fall, rings, glitter and
   two-colour bursts, and finish with a barrage. Each burst lights the
   water, the house and the sky in its colour for a moment; the bang
   arrives late if you are far away, as it would.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const MAX = 4200;
const COLOURS = [[1, 0.25, 0.2], [0.3, 1, 0.4], [0.35, 0.55, 1], [1, 0.82, 0.35], [0.85, 0.4, 1], [1, 1, 1], [1, 0.55, 0.15], [0.3, 0.95, 1]];
const SOUND = 343;               // metres a second

BM.buildFireworks = function (B, game) {
  const scene = B.zones.mansion.parent, LK = (BM.ESTATE_PLACES && BM.ESTATE_PLACES.LK) || { cx: 50, cz: -33, y: 0 };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX), 1).setUsage(THREE.DynamicDrawUsage));
  geo.userData.canonical = 'fitting:fireworks';
  geo.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { scale: { value: 400 } },
    vertexShader: 'attribute float size; attribute vec3 color; uniform float scale; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(size * scale / -mv.z, 1.0, 24.0); }',
    fragmentShader: 'varying vec3 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float r = dot(c, c); if (r > 0.25) discard; float k = 1.0 - r * 4.0; gl_FragColor = vec4(vC * (0.4 + 0.6 * k * k), 1.0); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.userData.dynamic = true; pts.visible = false;
  scene.add(pts);
  // one light for the bursts, always there (so nothing recompiles when the show starts), dark until it is needed
  const light = new THREE.PointLight(0xffffff, 0, 140, 2); light.position.set(LK.cx, 30, LK.cz); scene.add(light);
  const P = [];   // live particles
  game.fireworks = { pts, geo, light, P, rockets: [], on: false, t: 0, next: 0, flash: 0, flashCol: new THREE.Color(), origin: { x: LK.cx, y: (LK.y || 0) + 0.2, z: LK.cz }, shown: 0 };
};

function spark(F, x, y, z, vx, vy, vz, c, life, size, drag, glitter) {
  if (F.P.length >= MAX) return;
  F.P.push({ x, y, z, vx, vy, vz, r: c[0], g: c[1], b: c[2], life, max: life, size, drag, glitter: !!glitter });
}

function launch(F, game, kind) {
  const o = F.origin, a = Math.random() * 6.28, d = Math.random() * 5;
  const h = 26 + Math.random() * 18;
  F.rockets.push({ x: o.x + Math.cos(a) * d, y: o.y, z: o.z + Math.sin(a) * d, vy: Math.sqrt(2 * 9.8 * h) * 1.02, vx: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 3, kind: kind || pick(['peony', 'peony', 'willow', 'ring', 'glitter', 'double']), c: pick(COLOURS), c2: pick(COLOURS) });
  const A = game.audio, v = hear(game, o, 0.5);
  if (A.ctx && v > 0.01) { A.tone('sine', 900, 2600, 0.05 * v, 0.05, 1.4, delay(game, o)); A.burst(A.white, 'bandpass', 2400, 1.2, 0.08 * v, 0.02, 0.6, delay(game, o)); }
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (game, p) => { const q = game.player; return Math.hypot(p.x - q.x, p.y - q.y - 1.6, p.z - q.z); };
const hear = (game, p, k) => { const d = dist(game, p), inside = game.ctx && game.ctx.zone !== 'exterior'; return Math.max(0, 1 - d / 400) * (inside ? 0.45 : 1) * (k || 1); };
const delay = (game, p) => dist(game, p) / SOUND;

function burst(F, game, R) {
  const { x, y, z, kind, c, c2 } = R;
  const n = kind === 'willow' ? 160 : kind === 'ring' ? 90 : kind === 'glitter' ? 140 : 180;
  const speed = kind === 'willow' ? 9 : 15 + Math.random() * 5;
  // a ring is a flat circle tipped at random; the rest are spheres
  const ax = Math.random() * 6.28, ay = Math.random() * 6.28;
  for (let i = 0; i < n; i++) {
    let vx, vy, vz;
    if (kind === 'ring') { const t = i / n * 6.283; vx = Math.cos(t); vy = Math.sin(t) * Math.cos(ax); vz = Math.sin(t) * Math.sin(ax); const cx = vx * Math.cos(ay) - vz * Math.sin(ay); vz = vx * Math.sin(ay) + vz * Math.cos(ay); vx = cx; }
    else { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, s = Math.sqrt(1 - u * u); vx = s * Math.cos(t); vy = u; vz = s * Math.sin(t); }
    const sp = speed * (kind === 'ring' ? 1 : 0.75 + Math.random() * 0.25);
    const col = kind === 'willow' ? [1, 0.72, 0.3] : kind === 'double' && i % 2 ? c2 : c;
    spark(F, x, y, z, vx * sp, vy * sp, vz * sp, col, kind === 'willow' ? 3.2 + Math.random() : 1.6 + Math.random() * 0.8, kind === 'willow' ? 0.9 : 1.2, kind === 'willow' ? 1.6 : 1.1, kind === 'glitter');
  }
  // the light of it, on the water and the house and the sky
  const lc = kind === 'willow' ? [1, 0.75, 0.35] : c;
  F.light.position.set(x, y, z); F.flashCol.setRGB(lc[0], lc[1], lc[2]); F.flash = 1;
  const A = game.audio, v = hear(game, R);
  if (A.ctx && v > 0.01) {
    const w = delay(game, R);
    A.burst(A.brown, 'lowpass', 180, 0.8, 0.9 * v, 0.004, 1.6, w);          // the boom
    A.burst(A.white, 'lowpass', 1400, 0.7, 0.35 * v, 0.002, 0.25, w);
    if (kind === 'glitter' || kind === 'willow') for (let i = 0; i < 18; i++) A.burst(A.white, 'highpass', 4000 + Math.random() * 3000, 1, 0.05 * v, 0.001, 0.02, w + 0.4 + Math.random() * 1.6);   // crackle
  }
}

BM.fireworksToggle = function (game) {
  const F = game.fireworks; if (!F) return;
  if (F.on) { F.on = false; game.ui.say('The last rockets go up, and the show is over.', 3); return; }
  F.on = true; F.t = 0; F.next = 0.6; F.shown++;
  game.ui.say(F.shown === 1 ? 'Out on the lake, something hisses — and the first rocket goes up over the water.' : 'Fireworks over the lake again.', 4);
};

BM.updateFireworks = function (game, dt) {
  const F = game.fireworks; if (!F) return;
  // the show: a rocket every second or so, quickening, and a barrage at the end
  if (F.on) {
    F.t += dt; F.next -= dt;
    const finale = F.t > 52;
    if (F.next <= 0) { launch(F, game); if (finale) launch(F, game); F.next = finale ? 0.25 + Math.random() * 0.2 : 0.7 + Math.random() * (F.t > 35 ? 0.6 : 1.4); }
    if (F.t > 60) { F.on = false; game.ui.say('The last of the smoke drifts off over the lake.', 4); }
  }
  // rockets climb, trailing sparks, and burst at the top
  for (let i = F.rockets.length - 1; i >= 0; i--) {
    const R = F.rockets[i];
    R.vy -= 9.8 * dt; R.x += R.vx * dt; R.y += R.vy * dt; R.z += R.vz * dt;
    spark(F, R.x, R.y, R.z, (Math.random() - 0.5) * 1.2, -1 - Math.random(), (Math.random() - 0.5) * 1.2, [1, 0.75, 0.4], 0.5, 0.5, 2, false);
    if (R.vy <= 1) { burst(F, game, R); F.rockets.splice(i, 1); }
  }
  // the sparks fall, slow in the air, fade
  const pos = F.geo.attributes.position.array, col = F.geo.attributes.color.array, sz = F.geo.attributes.size.array;
  let n = 0;
  for (let i = F.P.length - 1; i >= 0; i--) {
    const s = F.P[i];
    s.life -= dt;
    if (s.life <= 0 || s.y < 0) { F.P[i] = F.P[F.P.length - 1]; F.P.pop(); continue; }
    const dr = Math.max(0, 1 - s.drag * dt);
    s.vx *= dr; s.vy = s.vy * dr - 9.8 * dt * 0.55; s.vz *= dr;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
  }
  for (const s of F.P) {
    const k = s.life / s.max, fade = Math.min(1, k * 2.2) * (s.glitter ? (Math.random() < 0.5 ? 1.4 : 0.15) : 1);
    pos[n * 3] = s.x; pos[n * 3 + 1] = s.y; pos[n * 3 + 2] = s.z;
    col[n * 3] = s.r * fade; col[n * 3 + 1] = s.g * fade; col[n * 3 + 2] = s.b * fade;
    sz[n] = s.size * (0.6 + 0.4 * k); n++;
  }
  F.geo.setDrawRange(0, n);
  F.geo.attributes.position.needsUpdate = F.geo.attributes.color.needsUpdate = F.geo.attributes.size.needsUpdate = true;
  F.pts.visible = n > 0;
  if (game.renderer && game.renderer.domElement) F.pts.material.uniforms.scale.value = game.renderer.domElement.height * 0.5;
  // the light of the bursts dies away
  F.flash = Math.max(0, F.flash - dt * 1.6);
  // (only out in the open: the light has no walls, and would shine straight through them into the rooms)
  const open = game.ctx && game.ctx.zone === 'exterior' && game.player.y > -0.5;
  F.light.color.copy(F.flashCol); F.light.intensity = (open ? 1.5 : 0) * F.flash * F.flash;
};

/* after the light: a big burst colours the sky for a moment */
BM.fireworksAfterFx = function (game) {
  const F = game.fireworks; if (!F || F.flash <= 0.02 || !game.scene.fog) return;
  const out = game.ctx && game.ctx.zone === 'exterior';
  game.scene.fog.color.lerp(F.flashCol, (out ? 0.035 : 0.01) * F.flash * F.flash);
};
})();
