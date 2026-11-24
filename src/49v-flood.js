/* ==========================================================================
   BLACKTHORN MANOR — 6zd. THE FLOOD (a test run)
   On the storm night the house floods. This is the test of it, started and
   drained by hand (F9): black water comes in under the doors and up from the
   cellar and rises slowly across the ground floor to waist height. As it
   climbs it gets into the wiring and the fittings, lowest first — the plugs,
   the lamps, the wall lights, the ceiling roses, at last the chandelier — and
   each one flickers, crackles and fizzes, then sparks and goes out, some with
   a bang. The fires hiss out. Upstairs stays dry and lit. No timer, no way to
   lose: you can wade through it, slowly, and go in and out of the house.
   F9 again starts the pumps; the water drains and the lights come back.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const TOP = 1.0;           // waist height on you
const RISE = 1 / 95;       // metres a second: about a minute and a half to the waist
const DRAIN = 1 / 45;
const HOUSE = { x0: -17.9, x1: 17.9, z0: -11.9, z1: 11.9 };
const inHouse = (x, z) => x > HOUSE.x0 && x < HOUSE.x1 && z > HOUSE.z0 && z < HOUSE.z1;

/* A small tiling ripple normal map, drawn once. */
function rippleNormals() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S), h = new Float32Array(S * S);
  const waves = [];
  for (let i = 0; i < 7; i++) waves.push([1 + Math.floor(Math.random() * 4), 1 + Math.floor(Math.random() * 4), Math.random() * 6.28, 0.4 + Math.random() * 0.6]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let v = 0; for (const [a, b, p, w] of waves) v += w * Math.sin((a * x + b * y) / S * 6.2832 + p) + 0.5 * w * Math.sin((b * x - a * y) / S * 6.2832 * 2 + p);
    h[y * S + x] = v;
  }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = h[y * S + (x + 1) % S] - h[y * S + (x + S - 1) % S], dy = h[((y + 1) % S) * S + x] - h[((y + S - 1) % S) * S + x];
    const nx = -dx * 0.35, ny = -dy * 0.35, l = Math.hypot(nx, ny, 1), i = (y * S + x) * 4;
    img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 6);
  return t;
}

BM.buildFlood = function (B, game) {
  const root = B.zones.mansion;
  const F = game.flood = { depth: 0, target: 0, rising: false, draining: false, said: {}, lights: [], fires: [], appliances: [], sparks: [], t: 0 };
  /* the water: one sheet over the whole ground floor; the walls hide it outside the rooms */
  const mat = new THREE.MeshPhongMaterial({ color: 0x0d0c08, specular: 0xc8c4b4, shininess: 140, transparent: true, opacity: 0.8, normalMap: rippleNormals(), normalScale: new THREE.Vector2(0.7, 0.7) });
  const w = F.water = new THREE.Mesh(G.plane, mat);
  w.rotation.x = -Math.PI / 2; w.scale.set(HOUSE.x1 - HOUSE.x0, HOUSE.z1 - HOUSE.z0, 1); w.position.set(0, -5, 0);
  w.visible = false; w.userData.dynamic = true; w.userData.noInstance = true; w.renderOrder = 2;
  root.add(w);
  /* sparks: a pool of tiny hot cubes, additive, one draw */
  const N = 160, sm = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sp = F.sparkMesh = new THREE.InstancedMesh(G.box, sm, N);
  sp.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sp.frustumCulled = false; sp.count = 0; sp.userData.dynamic = true;
  root.add(sp);
  /* what the water carries: loose papers, letters, a few books */
  const NP = 46, pm = new THREE.MeshPhongMaterial({ color: 0x8f8670, specular: 0x111111, shininess: 4 });
  const pp = F.papers = new THREE.InstancedMesh(G.box, pm, NP);
  pp.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pp.userData.dynamic = true; pp.visible = false;
  root.add(pp);
  F.float = [];
  const phys = B.phys, rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0, tries = 0; i < NP && tries < 3000; tries++) {
    const x = rnd(HOUSE.x0 + 0.5, HOUSE.x1 - 0.5), z = rnd(HOUSE.z0 + 0.5, HOUSE.z1 - 0.5);
    if (phys.blocked && phys.blocked(x, z, 0.4)) continue;
    const book = i % 7 === 0;
    F.float.push({ x, z, x0: x, z0: z, ry: Math.random() * 6.28, vx: rnd(-0.03, 0.03), vz: rnd(-0.03, 0.03), ph: Math.random() * 6.28,
      sx: book ? 0.17 : 0.21, sy: book ? 0.035 : 0.003, sz: book ? 0.24 : 0.29 }); i++;
  }
  pp.count = F.float.length;
};

/* ---- the sounds of it ---- */
function vol(game, pos, range) {
  const p = game.player, d = Math.hypot(pos.x - p.x, pos.y - p.y - 1.6, pos.z - p.z);
  return Math.max(0, 1 - d / (range || 22));
}
function crackle(A, v) {                      // water in a live fitting: a fizzing, spitting crackle
  if (!A || !A.ctx || v <= 0.02) return;
  const n = 3 + Math.floor(Math.random() * 6);
  for (let i = 0; i < n; i++) A.burst(A.white, 'highpass', 2500 + Math.random() * 4000, 1.5, (0.05 + Math.random() * 0.09) * v, 0.001, 0.012 + Math.random() * 0.03, i * (0.02 + Math.random() * 0.06));
  if (Math.random() < 0.5) A.tone('square', 100, 96, 0.035 * v, 0.005, 0.25 + Math.random() * 0.3);          // the mains buzz
}
function zap(A, v) {                          // an arc: a hard electrical snap and a sizzle after it
  if (!A || !A.ctx || v <= 0.02) return;
  A.burst(A.white, 'bandpass', 3800, 0.8, 0.5 * v, 0.001, 0.05);
  A.tone('sawtooth', 1800, 140, 0.12 * v, 0.001, 0.16);
  A.tone('square', 100, 100, 0.06 * v, 0.002, 0.5);
  A.burst(A.white, 'highpass', 5000, 1, 0.12 * v, 0.02, 0.9, 0.06);
}
function hiss(A, v) { if (A && A.ctx && v > 0.02) { A.burst(A.white, 'highpass', 1800, 0.7, 0.4 * v, 0.05, 2.4); A.burst(A.brown, 'lowpass', 500, 1, 0.3 * v, 0.02, 1.2); } }

function sparkBurst(F, pos, n, hot) {
  for (let i = 0; i < n && F.sparks.length < 160; i++) {
    const a = Math.random() * 6.28, s = (hot ? 2.6 : 1.4) * (0.3 + Math.random());
    F.sparks.push({ x: pos.x, y: pos.y - 0.05, z: pos.z, vx: Math.cos(a) * s * 0.6, vy: Math.random() * s * 0.6 - 0.3, vz: Math.sin(a) * s * 0.6, life: 0.4 + Math.random() * (hot ? 0.9 : 0.5) });
  }
}

BM.floodSparks = (game, pos, n, hot) => sparkBurst(game.flood, pos, n, hot);   // for the screenshots

/* ---- starting and draining (F9) ---- */
BM.floodToggle = function (game) {
  const F = game.flood; if (!F) return;
  if (F.rising || (F.depth > 0.01 && !F.draining)) BM.floodDrain(game); else BM.floodStart(game);
};

BM.floodStart = function (game) {
  const F = game.flood, g = game.grid, p = game.player;
  if (F.rising) return;
  // a test run: the house has power, and every light on the ground floor is on, so you can watch them go
  if (!g.lodge) g.setLodge(true);
  if (!g.live('main')) g.throwMain();
  const ground = l => l.zone === 'mansion' && l.level === 'ground' && inHouse(l.pos.x, l.pos.z) && l.pos.y > -0.5 && l.pos.y < 7;
  const A = game.audio, ui = game.ui, click = A.click, say = ui.say; A.click = () => {}; ui.say = () => {};
  try {
    for (const it of game.interactables) {
      if (!it.switchVisual || it.leverOn || it.zone !== 'mansion') continue;
      if ((it.controls || []).some(id => { const l = g.light(id); return l && ground(l); })) it.act(game);
    }
  } finally { A.click = click; ui.say = say; }
  // each fitting fails when the water reaches it: the plugs and lamps first, then the wall lights, then the ceiling
  F.lights = [];
  for (const l of g.lights) {
    if (!ground(l) || l.kind === 'fire' || l.drowned || l.dead) continue;
    l.on = true;
    let at;
    if (l.pos.y < 1.7) at = 0.1 + Math.random() * 0.25;              // plugged into the skirting sockets
    else if (l.pos.y < 2.8) at = 0.38 + Math.random() * 0.3;          // wall lights: the wiring drops to the switches
    else at = 0.62 + Math.random() * 0.3;                             // the ceilings: the water gets into the junction boxes
    if (l.id === 'hall-chandelier') at = 0.97;                        // the last to go
    F.lights.push({ l, at, state: 0, next: 0, bang: Math.random() < 0.45 || l.id === 'hall-chandelier' });
  }
  F.fires = (game.fires || []).filter(f => f.pos && inHouse(f.pos.x, f.pos.z) && f.pos.y > -0.5 && f.pos.y < 1.5).map(f => ({ f, at: Math.max(0.12, f.pos.y - 0.15), out: false }));
  F.appliances = g.appliances.filter(a => inHouse(a.pos.x, a.pos.z) && a.pos.y > -0.5 && a.pos.y < 2.5).map(a => ({ a, at: 0.25 + Math.random() * 0.2, was: a.switchedOn, out: false }));
  // if you are not in the house, you are put in the hall to watch
  if (!(inHouse(p.x, p.z) && p.y > -0.5 && p.y < 2)) game.teleport(0, 0, 8.5, 0);
  F.rising = true; F.draining = false; F.target = TOP; F.said = {};
  F.water.visible = true; F.papers.visible = true;
  game.ui.say('Water. It is coming in under the front doors and up the cellar steps — black, cold, spreading across the boards — and it is not stopping.', 6);
};

BM.floodDrain = function (game) {
  const F = game.flood;
  F.rising = false; F.draining = true; F.target = 0;
  game.audio.clunk && game.audio.clunk(0.6);
  game.ui.say('Somewhere below, the pumps thump into life. Slowly — very slowly — the water begins to go down.', 6);
};

function restore(game) {
  const F = game.flood;
  for (const e of F.lights) { const l = e.l; if (l.drowned) { l.drowned = false; l.dead = false; l.flicker = e.flicker0 || 0; l.lightType = e.type0 || 'steady'; if (l.scorch) l.scorch.visible = false; } }
  for (const e of F.appliances) if (e.out) { e.a.switchedOn = e.was; e.out = false; }
  F.lights = []; F.fires = []; F.appliances = [];
  F.water.visible = false; F.papers.visible = false; F.draining = false;
  game.ui.say('The last of the water slides away down the cellar steps. The boards are black and soaked. One by one the lights stutter back on.', 6);
}

/* ---- every frame ---- */
BM.updateFlood = function (game, dt) {
  const F = game.flood; if (!F) return;
  const A = game.audio;
  if (!F.rising && !F.draining && F.depth <= 0) { if (F.loop && A.ctx) F.loop.g.gain.setTargetAtTime(0, A.ctx.currentTime, 0.3); return; }
  F.t += dt;
  const was = F.depth;
  if (F.rising) F.depth = Math.min(F.target, F.depth + RISE * dt * (F.speed || 1));
  if (F.draining) F.depth = Math.max(0, F.depth - DRAIN * dt * (F.speed || 1));
  const d = F.depth, p = game.player, inside = inHouse(p.x, p.z) && p.y > -0.5 && p.y < 2.2;
  // the water sheet, its ripples drifting
  F.water.position.y = Math.max(0.005, d);
  F.water.material.normalMap.offset.set(F.t * 0.011, F.t * 0.007);
  // the sound of it pouring in, or draining away
  if (A.ctx) {
    if (!F.loop) F.loop = A.noiseLoop(A.brown, 'lowpass', 650, 0.8);
    const lvl = (F.rising && d < TOP ? 0.22 : F.draining ? 0.16 : 0.03) * (inside ? 1 : 0.35);
    F.loop.g.gain.setTargetAtTime(lvl, A.ctx.currentTime, 0.5);
  }
  // the lines as it climbs
  const line = (k, at, text) => { if (!F.said[k] && F.rising && d >= at) { F.said[k] = true; game.ui.say(text, 6); } };
  line('ankle', 0.18, 'It is over your ankles now, and the plugs along the skirting are going under. Something in the walls begins to spit and crackle.');
  line('knee', 0.5, 'Knee-deep. Papers and letters turn slowly on the surface. The lights are fighting it — flickering, buzzing, fizzing.');
  line('thigh', 0.8, 'It is up past your thighs and still rising. Every light on this floor is crackling. Upstairs, the landing light is steady and dry.');
  line('waist', TOP - 0.005, 'Waist-deep, and it has stopped rising. The ground floor is dark. The only sound is the water, moving.');
  // the fittings
  for (const e of F.lights) {
    const l = e.l;
    if (e.state === 0 && d >= e.at - 0.09 && F.rising) {
      // it reaches the wiring: the light starts to fight it
      e.state = 1; e.flicker0 = l.flicker; e.type0 = l.lightType;
      l.flicker = 0.75 + Math.random() * 0.2; l.lightType = 'flicker'; e.next = 0;
    }
    if (e.state === 1) {
      e.next -= dt;
      if (e.next <= 0) {
        e.next = 0.15 + Math.random() * 0.55;
        if (l.powered) { crackle(A, vol(game, l.pos)); if (Math.random() < 0.35) sparkBurst(F, l.pos, 3 + Math.floor(Math.random() * 4), false); }
      }
      if (d >= e.at) {
        e.state = 2; l.drowned = true;
        if (l.powered && e.bang) {
          // it flares, arcs and blows
          l.seq = [{ d: 0.05, v: 1.6 }, { d: 0.04, v: 0.2 }, { d: 0.14, v: 3.4, ramp: true }, { d: 0.01, v: 0, bang: true }]; l.seqIndex = 0; l.seqT = 0;
          zap(A, vol(game, l.pos, 30)); sparkBurst(F, l.pos, 26, true);
        } else {
          // it sputters out with a sizzle
          if (l.powered) { zap(A, 0.55 * vol(game, l.pos)); sparkBurst(F, l.pos, 10, false); }
          l.dead = true;
        }
      }
    }
  }
  for (const e of F.fires) if (!e.out && d >= e.at && F.rising) { e.out = true; if (e.f.lit) { e.f.lit = false; e.f.light.on = false; hiss(A, vol(game, e.f.pos, 18)); if (vol(game, e.f.pos, 14) > 0) game.ui.say('The water reaches the hearth. The fire goes out in a long hiss of steam.', 4); } }
  for (const e of F.appliances) if (!e.out && d >= e.at && F.rising) { e.out = true; if (e.a.switchedOn) { e.a.switchedOn = false; if (e.a.running) { zap(A, 0.7 * vol(game, e.a.pos)); sparkBurst(F, e.a.pos, 8, false); } } }
  // sparks: fall, and die on the water
  const sm = F.sparkMesh, m4 = BM._m4 || (BM._m4 = new THREE.Matrix4());
  let n = 0;
  for (let i = F.sparks.length - 1; i >= 0; i--) {
    const s = F.sparks[i];
    s.life -= dt; s.vy -= 9.8 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (s.life <= 0 || s.y < d) { F.sparks.splice(i, 1); continue; }
  }
  for (const s of F.sparks) { if (n >= 160) break; const k = 0.012 + 0.02 * Math.min(1, s.life); m4.makeScale(k, k, k); m4.setPosition(s.x, s.y, s.z); sm.setMatrixAt(n++, m4); }
  sm.count = n; sm.instanceMatrix.needsUpdate = true;
  // the papers ride the surface, turning slowly
  if (F.papers.visible) {
    const pm = F.papers, q = BM._q || (BM._q = new THREE.Quaternion()), e3 = BM._e3 || (BM._e3 = new THREE.Euler()), v3 = BM._v3 || (BM._v3 = new THREE.Vector3()), s3 = BM._s3 || (BM._s3 = new THREE.Vector3());
    const show = d > 0.06;
    for (let i = 0; i < F.float.length; i++) {
      const f = F.float[i];
      if (show) { f.x += f.vx * dt; f.z += f.vz * dt; if (Math.hypot(f.x - f.x0, f.z - f.z0) > 1.2) { f.vx = -f.vx; f.vz = -f.vz; } f.ry += dt * 0.05 * (i % 2 ? 1 : -1); }
      const bob = Math.sin(F.t * 1.1 + f.ph) * 0.006;
      e3.set(Math.sin(F.t * 0.9 + f.ph) * 0.04, f.ry, Math.cos(F.t * 0.8 + f.ph) * 0.04); q.setFromEuler(e3);
      v3.set(f.x, show ? d + f.sy * 0.3 + bob : -5, f.z); s3.set(f.sx, f.sy, f.sz);
      m4.compose(v3, q, s3); pm.setMatrixAt(i, m4);
    }
    pm.instanceMatrix.needsUpdate = true;
  }
  if (F.draining && d <= 0) restore(game);
  // wading
  F.wade = inside && d > 0.05 && p.y < d ? Math.min(1, (d - p.y) / TOP) : 0;
};

/* a step through the water: a heavy slosh, deeper the deeper it is */
BM.floodSlosh = function (game) {
  const A = game.audio, w = game.flood.wade; if (!A.ctx) return;
  A.burst(A.brown, 'lowpass', 380 + 300 * (1 - w), 0.9, 0.16 + 0.14 * w, 0.03, 0.45 + 0.4 * w);
  A.burst(A.white, 'bandpass', 900 + Math.random() * 500, 1.2, 0.05 + 0.04 * w, 0.02, 0.35, 0.08);
};
/* how much the water holds you back, 0..1 of your speed */
BM.floodDrag = function (game) { const F = game.flood; return F && F.wade ? 1 - 0.55 * F.wade : 1; };
})();
