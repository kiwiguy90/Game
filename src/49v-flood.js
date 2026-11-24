/* ==========================================================================
   BLACKTHORN MANOR — 6zd. THE FLOOD (a test run, F9)
   Black water comes up across the whole estate — inside the house and out —
   slowly at first, to the waist, then faster, floor by floor, until it stands
   at the top of the mansion's roof. Only the towers and the clock tower stand
   above it. As it climbs it gets into the wiring and the fittings, lowest
   first on every floor and in the grounds: the plugs and lamps, the wall
   lights, the ceilings, the lamp posts. Each one flickers, crackles and
   fizzes, then sparks and goes out, some with a bang. The fires hiss out.
   You wade, and when it is over your chest you swim: on the surface or under
   it (Space up, C down). You cannot drown.
   F9 again runs the pumps: the water goes down, and as it falls below each
   fitting that fitting dries out, comes back on and is sound again.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const BASE = -3.2;            // the cellar floor: it comes up from there first
const WAIST = 1.0;
const TOP = 11.2;             // the ridge of the main roof
const SLOW = 1 / 95;          // m/s to the waist: about a minute and a half
const FAST = 1 / 13;          // m/s from there to the roof: about two and a half minutes
const DRAIN = 1 / 9;          // m/s: the pumps, about a minute and a half from the roof
const FLOAT = 1.42;           // swimming, your feet hang this far under the surface (eyes just above it)
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
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

BM.buildFlood = function (B, game) {
  const scene = B.zones.mansion.parent, root = B.zones.mansion;
  const F = game.flood = { depth: BASE, rising: false, draining: false, said: {}, lights: [], fires: [], appliances: [], sparks: [], t: 0, swim: false, wade: 0, under: false };
  /* the water: one sheet over the whole estate, inside the house and out; the walls hide it where it should not be */
  const SIZE = 900, nm = rippleNormals(); nm.repeat.set(SIZE / 4, SIZE / 4);
  const mat = new THREE.MeshPhongMaterial({ color: 0x0d0c08, specular: 0xc8c4b4, shininess: 140, transparent: true, opacity: 0.8, normalMap: nm, normalScale: new THREE.Vector2(0.7, 0.7), side: THREE.DoubleSide });
  const w = F.water = new THREE.Mesh(G.plane, mat);
  w.rotation.x = -Math.PI / 2; w.scale.set(SIZE, SIZE, 1); w.position.set(0, -5, 0);
  w.visible = false; w.userData.dynamic = true; w.userData.noInstance = true; w.renderOrder = 2; w.frustumCulled = false;
  scene.add(w);
  /* sparks: a pool of tiny hot cubes, additive, one draw */
  const N = 160, sm = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sp = F.sparkMesh = new THREE.InstancedMesh(G.box, sm, N);
  sp.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sp.frustumCulled = false; sp.count = 0; sp.userData.dynamic = true;
  scene.add(sp);
  /* what the water carries out of the house: loose papers, letters, a few books */
  const NP = 46, pm = new THREE.MeshPhongMaterial({ color: 0x8f8670, specular: 0x111111, shininess: 4 });
  const pp = F.papers = new THREE.InstancedMesh(G.box, pm, NP);
  pp.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pp.userData.dynamic = true; pp.visible = false; pp.frustumCulled = false;
  scene.add(pp);
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
  if (F.rising || (F.depth > BASE + 0.01 && !F.draining)) BM.floodDrain(game); else BM.floodStart(game);
};

/* where a fitting's wiring is: the floor under it, and how high above that floor it hangs */
function failHeight(game, l) {
  const floor = game.B.phys.support(l.pos.x, l.pos.z, l.pos.y - 0.05, 0);
  const fl = isFinite(floor) && floor > BASE - 0.3 ? floor : 0, rel = l.pos.y - fl;   // over open water: count from the ground
  if (l.id === 'hall-chandelier') return 0.97;                      // the last to go downstairs
  if (rel < 1.7) return fl + 0.1 + Math.random() * 0.25;            // plugged into the skirting sockets, or low in the ground
  if (rel < 2.8) return fl + 0.38 + Math.random() * 0.3;            // wall lights and lamp posts: the wiring drops to the switch, the post's base
  return fl + 0.62 + Math.random() * 0.3;                           // ceilings: the water gets into the junction boxes
}

BM.floodStart = function (game) {
  const F = game.flood, g = game.grid;
  if (F.rising) return;
  // a test run: the power is on, and every light in the house and the grounds is on, so you can watch them go
  const A = game.audio, ui = game.ui, click = A.click, say = ui.say, lever = A.lever, clunk = A.clunk;
  A.click = A.lever = A.clunk = () => {}; ui.say = () => {};
  try {
    if (!g.lodge) g.setLodge(true);
    if (!g.live('main')) g.throwMain();
    for (const it of game.interactables) if (it.switchVisual && !it.leverOn && it.zone === 'mansion' && (it.controls || []).length) it.act(game);
    if (game.setEstateAll) game.setEstateAll(true);
  } finally { A.click = click; A.lever = lever; A.clunk = clunk; ui.say = say; }
  // every fitting fails when the water reaches its wiring; the ones built for water, and the towers above the roof, do not
  F.lights = [];
  for (const l of g.lights) {
    if (l.kind === 'fire' || l.circuit === 'car' || l.drowned || /under/i.test(l.id)) continue;
    if (l.level === 'clock' || l.level === 'belfry' || (l.zone === 'mansion' && l.pos.y > TOP + 0.5)) continue;   // the towers stand above it; a mast's wiring is at its foot
    if (!l.dead) l.on = true;
    F.lights.push({ l, at: failHeight(game, l), state: 0, next: 0, bang: Math.random() < 0.45 || l.id === 'hall-chandelier' });
  }
  F.fires = (game.fires || []).filter(f => f.pos && f.pos.y < TOP).map(f => ({ f, at: f.pos.y - 0.12, out: false }));
  F.appliances = g.appliances.filter(a => a.pos.y < TOP).map(a => {
    const fl = game.B.phys.support(a.pos.x, a.pos.z, a.pos.y, 0);
    return { a, at: (isFinite(fl) ? fl : 0) + 0.25 + Math.random() * 0.2, was: a.switchedOn, out: false };
  });
  if (F.depth <= BASE) F.depth = BASE;
  F.rising = true; F.draining = false; F.said = {};
  F.water.visible = true; F.papers.visible = true;
  game.ui.say('Under your feet, somewhere below, a rush of water. The cellar is filling — and then it is coming up the cellar steps, under the doors and out of the ground, across the floors and the lawns alike. It is not stopping.', 7);
};

BM.floodDrain = function (game) {
  const F = game.flood;
  F.rising = false; F.draining = true;
  game.audio.clunk && game.audio.clunk(0.6);
  game.ui.say('Somewhere, deep down, the pumps thump into life. Slowly the water begins to go down.', 6);
};

/* a fitting dries out and is sound again: it comes back on, steady, and will not fail */
function mend(e) {
  const l = e.l; e.state = 3;
  if (!l.drowned) return;
  l.drowned = false; l.dead = false; l.flicker = 0; if (l.kind === 'bang') l.kind = 'incandescent'; l.lightType = 'steady'; l.noFail = true; l.failed = null; l.scorched = false;
  if (l.scorch) l.scorch.visible = false;
}

function finish(game) {
  const F = game.flood;
  for (const e of F.lights) mend(e);
  for (const e of F.appliances) if (e.out) { e.a.switchedOn = e.was; e.out = false; }
  F.lights = []; F.fires = []; F.appliances = [];
  F.water.visible = false; F.papers.visible = false; F.draining = false; F.swim = false; F.wade = 0;
  game.ui.say('The last of the water drains away. Everything is black and soaked and dripping — and every light is back on, steady, as if nothing had happened.', 6);
}

/* ---- every frame ---- */
BM.updateFlood = function (game, dt) {
  const F = game.flood; if (!F) return;
  const A = game.audio;
  if (!F.rising && !F.draining && F.depth <= BASE) { if (F.loop && A.ctx) F.loop.g.gain.setTargetAtTime(0, A.ctx.currentTime, 0.3); return; }
  F.t += dt;
  const rate = F.rising ? (F.depth < 0 || F.depth >= WAIST ? FAST : SLOW) : DRAIN;
  if (F.rising) F.depth = Math.min(TOP, F.depth + rate * dt * (F.speed || 1));
  if (F.draining) F.depth = Math.max(BASE, F.depth - rate * dt * (F.speed || 1));
  const d = F.depth, p = game.player;
  // the water sheet, its ripples drifting
  F.water.position.y = d + 0.005;
  F.water.material.normalMap.offset.set(F.t * 0.011, F.t * 0.007);
  // the sound of it pouring in, or draining away
  if (A.ctx) {
    if (!F.loop) F.loop = A.noiseLoop(A.brown, 'lowpass', 650, 0.8);
    const lvl = F.rising && d < TOP ? 0.2 : F.draining ? 0.16 : 0.03;
    F.loop.g.gain.setTargetAtTime(lvl, A.ctx.currentTime, 0.5);
  }
  // the lines as it climbs
  const line = (k, at, text) => { if (!F.said[k] && F.rising && d >= at) { F.said[k] = true; game.ui.say(text, 6); } };
  line('cellar', -1.6, 'The cellar is half full already, and it is still coming up the steps.');
  line('ankle', 0.18, 'It is over your ankles, and the plugs along the skirting are going under. Something in the walls begins to spit and crackle.');
  line('knee', 0.5, 'Knee-deep, inside and out. Papers turn slowly on the surface. The lights are fighting it — flickering, buzzing, fizzing.');
  line('waist', WAIST, 'Waist-deep across the whole estate, and now it is rising faster. Every light down here is out.');
  line('first', 4.4, 'It is over the first floor. The bedroom lights are going, one by one, as it climbs the walls.');
  line('attic', 8.4, 'The attic is going under. Only the roof is left above it.');
  line('top', TOP - 0.01, 'It has stopped at the roof. The house is gone under the water. Only the towers and the clock stand above it, the clock face still lit.');
  // the fittings
  const band = Math.min(0.7, Math.max(0.09, rate * 9));             // about nine seconds of fighting it before it goes
  for (const e of F.lights) {
    const l = e.l;
    if (F.rising) {
      if (e.state === 0 && d >= e.at - band) { e.state = 1; l.flicker = 0.75 + Math.random() * 0.2; l.lightType = 'flicker'; e.next = 0; }
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
    } else if (F.draining && e.state > 0 && e.state < 3 && d < e.at - 0.05) mend(e);   // dried out: back on, and sound
  }
  for (const e of F.fires) if (!e.out && d >= e.at && F.rising) { e.out = true; if (e.f.lit) { e.f.lit = false; e.f.light.on = false; hiss(A, vol(game, e.f.pos, 18)); } }
  for (const e of F.appliances) {
    if (!e.out && d >= e.at && F.rising) { e.out = true; if (e.a.switchedOn) { e.a.switchedOn = false; if (e.a.running) { zap(A, 0.7 * vol(game, e.a.pos)); sparkBurst(F, e.a.pos, 8, false); } } }
    else if (e.out && F.draining && d < e.at - 0.05) { e.out = false; e.a.switchedOn = e.was; }
  }
  // sparks: fall, and die on the water
  const sm = F.sparkMesh, m4 = BM._m4 || (BM._m4 = new THREE.Matrix4());
  let n = 0;
  for (let i = F.sparks.length - 1; i >= 0; i--) {
    const s = F.sparks[i];
    s.life -= dt; s.vy -= 9.8 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (s.life <= 0 || s.y < d) F.sparks.splice(i, 1);
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
  if (F.draining && d <= BASE) finish(game);
  // in it: wading, or over your chest and swimming
  const over = d - p.y;
  if (!F.swim && over > 1.3) { F.swim = true; p.vy = 0; }
  F.wade = !F.swim && over > 0.05 ? Math.min(1, over / WAIST) : 0;
};

/* how much the water holds you back, as a fraction of your speed */
BM.floodDrag = function (game) { const F = game.flood; return !F ? 1 : F.swim ? 0.72 : F.wade ? 1 - 0.55 * F.wade : 1; };

/* a step through the water: a heavy slosh, deeper the deeper it is */
BM.floodSlosh = function (game) {
  const A = game.audio, F = game.flood; if (!A.ctx) return;
  if (F.swim) {                                   // a stroke: a soft wash at the surface, or a muffled rush under it
    A.burst(A.brown, 'lowpass', F.under ? 260 : 600, 0.8, F.under ? 0.12 : 0.1, 0.08, 0.6);
    if (!F.under) A.burst(A.white, 'bandpass', 1300, 0.9, 0.04, 0.05, 0.4, 0.1);
    return;
  }
  const w = F.wade;
  A.burst(A.brown, 'lowpass', 380 + 300 * (1 - w), 0.9, 0.16 + 0.14 * w, 0.03, 0.45 + 0.4 * w);
  A.burst(A.white, 'bandpass', 900 + Math.random() * 500, 1.2, 0.05 + 0.04 * w, 0.02, 0.35, 0.08);
};

/* Swimming: the vertical part of moving, when the water is over your chest. Returns true when it has
   handled it. Space swims up, C (or Ctrl) dives; let go and you float back up to the surface. Floors
   are solid both ways: you come up through the stairwells, the hall, the open doors — not the ceilings. */
BM.floodSwim = function (game, dt) {
  const F = game.flood; if (!F || !F.swim) return false;
  const p = game.player, k = game.keys, phys = game.B.phys, d = F.depth, surface = d - FLOAT;
  let vy;
  if (k.Space) vy = 1.8;
  else if (k.KeyC || k.ControlLeft || k.ControlRight) vy = -1.8;
  else vy = Math.max(-1.2, Math.min(0.8, (surface - p.y) * 1.5));     // buoyancy: drift up to float at the surface
  let y = p.y + vy * dt;
  if (y > surface + 0.03 && vy > 0) y = Math.max(p.y, surface + 0.03);  // you cannot swim up out of the water
  const floor = phys.support(p.x, p.z, p.y + 0.05, 0);
  if (y < floor) y = floor;
  const head = phys.support(p.x, p.z, y + BM.PLAYER.height, 0);          // a floor between your feet and the top of your head?
  if (head > p.y + 0.2) y = Math.min(y, head - BM.PLAYER.height - 0.02);
  p.y = Math.max(y, floor); p.vy = 0;
  p.grounded = p.y <= floor + 0.02;
  // out of it again: the water is down below your chest and there is a floor under you
  if (d - p.y < 1.15 && phys.support(p.x, p.z, p.y + 0.3) >= p.y - 0.6) { F.swim = false; p.grounded = true; }
  return true;
};

/* After the weather and the light have had their say: under the water it is murky green and muffled. */
BM.floodAfterFx = function (game, dt) {
  const F = game.flood; if (!F) return;
  const p = game.player, eye = p.y + BM.PLAYER.eye, under = F.water.visible && eye < F.depth - 0.02;
  const A = game.audio;
  if (A.ctx && A.comp && !F.lp) {
    // a low-pass between the mix and the speakers, wide open until you go under
    F.lp = A.ctx.createBiquadFilter(); F.lp.type = 'lowpass'; F.lp.frequency.value = 20000;
    A.master.disconnect(); A.master.connect(F.lp); F.lp.connect(A.comp);
  }
  if (F.lp) F.lp.frequency.setTargetAtTime(under ? 520 : 20000, A.ctx.currentTime, 0.08);
  if (under && !F.veil && game.renderer && game.renderer.domElement && game.renderer.domElement.parentNode) {
    // a murky tint over the view, just above the picture and under the words
    const veil = F.veil = document.createElement('div'), cv = game.renderer.domElement;
    veil.style.cssText = 'position:fixed;inset:0;pointer-events:none;display:none;background:radial-gradient(ellipse at 50% 40%, rgba(24,52,40,0.28), rgba(4,14,10,0.78));';
    cv.parentNode.insertBefore(veil, cv.nextSibling);
  }
  if (under !== F.under) { F.under = under; if (F.veil) F.veil.style.display = under ? 'block' : 'none'; if (A.ctx && !under && F.swim) A.burst(A.white, 'bandpass', 900, 0.7, 0.12, 0.01, 0.5); }
  if (under) {
    const fog = game.scene.fog, deep = Math.min(1, (F.depth - eye) / 6);
    fog.color.setRGB(0.04 - 0.025 * deep, 0.085 - 0.05 * deep, 0.065 - 0.04 * deep);
    fog.density = 0.16 + 0.12 * deep;
    game.scene.background = fog.color;
  }
};
})();
