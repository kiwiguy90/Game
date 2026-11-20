/* ==========================================================================
   BLACKTHORN MANOR — 6v. MOONRISE, AND THE ANIMALS
   - Moonrise: once the gate motor is running and you are on your way out,
     the storm blows itself out. The rain thins and stops, the lightning
     goes away down the valley, the murk lifts, stars come out and a low
     moon stands over the lake to the north-east, silvering the estate.
   - A fox: on the west lawns, trotting its round between the drive and the
     maze, stopping to look at you; come too close and it bolts.
   - An owl: on the battlements of the folly, turning its head to follow you,
     hooting now and then; climb up to it and it goes.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const MOON_DIR = new THREE.Vector3(0.55, 0.27, -0.79).normalize();

function moonTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const halo = g.createRadialGradient(64, 64, 10, 64, 64, 64); halo.addColorStop(0, 'rgba(220,230,255,0.55)'); halo.addColorStop(0.3, 'rgba(160,180,220,0.18)'); halo.addColorStop(1, 'rgba(120,140,190,0)');
  g.fillStyle = halo; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#e8ecf2'; g.beginPath(); g.arc(64, 64, 17, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(150,160,175,0.55)';                                                  // the seas
  for (const [x, y, r] of [[58, 58, 5], [69, 62, 4], [62, 71, 3.5], [71, 71, 2.5], [55, 68, 2]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  return new THREE.CanvasTexture(c);
}

BM.buildWild = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  /* ---- the moon and the stars: drawn round the camera, beyond the fog ---- */
  const moonMat = new THREE.MeshBasicMaterial({ map: moonTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
  const moon = new THREE.Mesh(G.plane, moonMat); moon.scale.setScalar(46); moon.frustumCulled = false; moon.renderOrder = -2; moon.userData.dynamic = true;
  game.scene.add(moon);
  const N = 420, sp = new Float32Array(N * 3), rnd = BM.mulberry32(1974);
  for (let i = 0; i < N; i++) {
    const a = rnd() * Math.PI * 2, e = Math.asin(0.08 + rnd() * 0.92);
    sp[i * 3] = Math.cos(e) * Math.sin(a); sp[i * 3 + 1] = Math.sin(e); sp[i * 3 + 2] = Math.cos(e) * Math.cos(a);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.userData.canonical = 'fitting:stars';
  const starMat = new THREE.PointsMaterial({ color: 0xc8d4ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(sg, starMat); stars.scale.setScalar(200); stars.frustumCulled = false; stars.renderOrder = -3; stars.userData.dynamic = true;
  game.scene.add(stars);
  game.weather = { clear: 0, rain: 1, moon, moonMat, stars, starMat, said: 0, fog0: BM.FOG.exterior.colour.clone(), dens0: BM.FOG.exterior.density, base: { colour: BM.FOG.exterior.colour.clone(), density: BM.FOG.exterior.density } };

  /* ---- the fox ---- */
  const fur = new THREE.MeshLambertMaterial({ color: 0x9a4a1c }), white = new THREE.MeshLambertMaterial({ color: 0xd8d0c0 }), dark = new THREE.MeshLambertMaterial({ color: 0x1a120c });
  const fox = new THREE.Group(); B.root.add(fox);
  B.mesh(G.sphere, fur, 0, 0.36, 0, 0.26, 0.24, 0.62, 0, fox);                               // body
  B.mesh(G.sphere, white, 0, 0.32, -0.2, 0.18, 0.16, 0.22, 0, fox);                           // chest
  const head = new THREE.Group(); head.position.set(0, 0.48, -0.36); fox.add(head);
  B.mesh(G.sphere, fur, 0, 0, 0, 0.19, 0.17, 0.2, 0, head);
  B.mesh(G.cone, fur, 0, -0.02, -0.15, 0.09, 0.18, 0.09, 0, head).rotation.x = -Math.PI / 2;  // muzzle
  B.mesh(G.sphere, dark, 0, -0.02, -0.25, 0.035, 0.035, 0.035, 0, head);                    // nose
  for (const s of [-1, 1]) {
    B.mesh(G.cone, fur, s * 0.06, 0.12, 0.02, 0.07, 0.13, 0.04, 0, head);                     // ears
    B.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0x8a7a30 }), s * 0.05, 0.03, -0.09, 0.025, 0.025, 0.02, 0, head); // eyeshine
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.38, 0.3); fox.add(tail);
  { const t = B.mesh(G.sphere, fur, 0, -0.05, 0.22, 0.13, 0.13, 0.48, 0, tail); t.rotation.x = 0.35; B.mesh(G.sphere, white, 0, -0.13, 0.44, 0.07, 0.07, 0.1, 0, tail); }
  const legs = [];
  for (const [x, z] of [[-0.08, -0.2], [0.08, -0.2], [-0.08, 0.2], [0.08, 0.2]]) {
    const leg = new THREE.Group(); leg.position.set(x, 0.3, z); fox.add(leg);
    B.mesh(G.post, dark, 0, -0.15, 0, 0.05, 0.3, 0.05, 0, leg); legs.push(leg);
  }
  fox.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
  const route = [[-10, 33], [-30, 44], [-21, 49], [-12, 58], [-14, 75], [-32, 80], [-20, 70], [-7, 52]];
  game.fox = { g: fox, head, tail, legs, route, seg: 0, u: 0, speed: 2.0, pause: 0, flee: 0, phase: 0 };

  /* ---- the owl, on the folly ---- */
  B.zone = 'estate';
  const FO = BM.FOLLY;
  if (FO) {
    const brown = new THREE.MeshLambertMaterial({ color: 0x5a4632 }), pale = new THREE.MeshLambertMaterial({ color: 0x9a8668 });
    const owl = new THREE.Group(); owl.position.set(FO.cx - FO.hx - FO.t / 2, FO.floors[3] + FO.parapet * 0.7 + 0.4, FO.cz + 1.4); B.root.add(owl);
    B.mesh(G.sphere, brown, 0, 0.17, 0, 0.26, 0.36, 0.24, 0, owl);
    B.mesh(G.sphere, pale, 0, 0.14, -0.07, 0.18, 0.26, 0.12, 0, owl);
    const oh = new THREE.Group(); oh.position.set(0, 0.4, 0); owl.add(oh);
    B.mesh(G.sphere, brown, 0, 0, 0, 0.22, 0.2, 0.2, 0, oh);
    B.mesh(G.sphere, pale, 0, -0.01, -0.07, 0.17, 0.15, 0.08, 0, oh);                         // the facial disc
    for (const s of [-1, 1]) B.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0xd8b040 }), s * 0.045, 0.01, -0.105, 0.04, 0.04, 0.02, 0, oh);
    B.mesh(G.cone, new THREE.MeshLambertMaterial({ color: 0x3a3020 }), 0, -0.04, -0.11, 0.025, 0.05, 0.025, 0, oh).rotation.x = Math.PI;
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.11, 0.24, 0.02); owl.add(w); B.mesh(G.sphere, brown, s * 0.03, -0.08, 0, 0.08, 0.28, 0.2, 0, w); return w; });
    owl.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    owl.scale.setScalar(1.5);                                                                    // a big tawny, to be seen from the path
    owl.rotation.y = -Math.PI / 2;                                                                // facing out, west, over the pond
    game.owl = { g: owl, head: oh, wings, home: owl.position.clone(), hoot: 6, gone: 0 };
  }
  B.zone = 'exterior';
};

/* The night you chose on the title screen: the storm, a still night of thick fog, or a clear one under the moon. */
BM.NIGHTS = {
  storm: { name: 'Storm', blurb: 'Rain, wind and lightning all night.' },
  fog: { name: 'Fog', blurb: 'No wind, no rain: a white fog you can barely see the lamps through.' },
  clear: { name: 'Moonlit', blurb: 'A clear, still night under a full moon.' },
};
BM.applyNight = function (game, night) {
  const W = game.weather; night = BM.NIGHTS[night] ? night : 'storm';
  game.night = night; game.story.night = night;
  if (!W) return;
  W.clear = 0; W.started = false; W.delay = 0; W.said = 0; W.rain = 1; W.noLightning = false;
  W.fog0.copy(W.base.colour); W.dens0 = W.base.density; game.storm = true;
  if (night === 'fog') { W.rain = 0; W.noLightning = true; W.fog0.setHex(0x30363e); W.dens0 = 0.05; }
  if (night === 'clear') { W.rain = 0; W.started = true; W.clear = 1; W.said = 2; }
};

BM.updateWild = function (game, dt, t) {
  const p = game.player, A = game.audio;
  /* ---- weather ---- */
  const W = game.weather;
  if (W) {
    const g = game.gates;
    if (g && g.escaping && !W.started) { W.started = true; W.delay = 14; }
    if (W.started) { if (W.delay > 0) W.delay -= dt; else W.clear = Math.min(1, W.clear + dt / 40); }
    const c = W.clear, cam = game.camera.position;
    if (W.started && W.delay <= 0 && W.said === 0) { W.said = 1; game.ui.say('The rain is easing. Somewhere off down the valley the thunder is going away.', 5); }
    if (c > 0.55 && W.said === 1) { W.said = 2; game.ui.say('The cloud tears open over the lake, and there is the moon — low and enormous, and the whole estate silver under it.', 7); }
    if ((c > 0.25 || W.noLightning) && game.fx) game.fx.nextStrike = Math.max(game.fx.nextStrike, 6);
    if (c >= 1 && game.storm) game.storm = false;
    if (game.fx && game.fx.rain) { const u = game.fx.rain.material.uniforms; if (u.density) u.density.value = W.rain * (1 - c); }
    BM.FOG.exterior.colour.copy(W.fog0).lerp(new THREE.Color(0x34445c), c);
    BM.FOG.exterior.density = W.dens0 + (0.0102 - W.dens0) * c;
    const outside = game.ctx && game.ctx.zone === 'exterior', show = outside ? Math.max(0, (c - 0.35) / 0.65) : 0;
    W.moon.position.copy(cam).addScaledVector(MOON_DIR, 180); W.moon.quaternion.copy(game.camera.quaternion); W.moon.visible = show > 0.01; W.moonMat.opacity = show;
    W.stars.position.copy(cam); W.stars.visible = show > 0.01; W.starMat.opacity = show * 0.9;
    if (game.fx && game.fx.moon) { game.fx.moon.position.copy(MOON_DIR).multiplyScalar(100); game.fx.moon.intensity += (outside ? 0.32 : 0.06) * c; }
  }
  /* ---- the fox ---- */
  const F = game.fox;
  if (F) {
    const R = F.route, a = R[F.seg], b = R[(F.seg + 1) % R.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const x = F.g.position.x, z = F.g.position.z, d = Math.hypot(p.x - x, p.z - z);
    if (d < 7 && F.flee <= 0 && p.y > -1 && p.y < 2) { F.flee = 4; F.pause = 0; if (A.rustle) A.rustle(); }
    let v = 0;
    if (F.flee > 0) { F.flee -= dt; v = 6.5; }
    else if (F.pause > 0) { F.pause -= dt; }
    else { v = F.speed; if (Math.random() < dt * 0.06) F.pause = 2 + Math.random() * 3; }
    F.u += v * dt / L;
    if (F.u >= 1) { F.u = 0; F.seg = (F.seg + 1) % R.length; }
    const ux = a[0] + (b[0] - a[0]) * F.u, uz = a[1] + (b[1] - a[1]) * F.u;
    F.g.position.set(ux, 0.02, uz);
    F.g.rotation.y = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
    F.phase += dt * (v > 0 ? 4 + v * 2.2 : 0);
    F.legs.forEach((l, i) => { l.rotation.x = v > 0 ? Math.sin(F.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.6 : 0; });
    F.tail.rotation.x = v > 0 ? -0.2 + Math.sin(F.phase * 0.5) * 0.1 : 0.15 + Math.sin(t * 1.3) * 0.05;
    // when it stops, it looks at you
    const look = F.pause > 0 && d < 30 ? Math.atan2(-(p.x - ux), -(p.z - uz)) - F.g.rotation.y : 0;
    let lk = ((look + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; lk = Math.max(-1.1, Math.min(1.1, lk));
    F.head.rotation.y += (lk - F.head.rotation.y) * Math.min(1, dt * 4);
  }
  /* ---- the owl ---- */
  const O = game.owl;
  if (O) {
    const d = Math.hypot(p.x - O.home.x, p.y - O.home.y, p.z - O.home.z);
    if (!O.gone && d < 2.8) { O.gone = 0.001; if (A.flap) { A.flap(0.6); A.flap(0.5); } game.ui.say('The owl drops off the parapet without a sound and goes away low over the water.', 4); }
    if (O.gone > 0) {
      O.gone += dt; const k = O.gone;
      O.g.position.set(O.home.x - k * 6, O.home.y + Math.sin(Math.min(k, 3)) * 2 - k * 0.6, O.home.z - k * 2.5);
      for (const [i, w] of O.wings.entries()) w.rotation.z = (i ? -1 : 1) * (0.6 + Math.sin(k * 14) * 0.9);
      if (k > 6) { O.g.visible = false; }
    } else {
      // the head turns to follow you, and back again
      const want = d < 40 ? Math.atan2(-(p.x - O.home.x), -(p.z - O.home.z)) - O.g.rotation.y : Math.sin(t * 0.3) * 1.2;
      let lk = ((want + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; lk = Math.max(-2.2, Math.min(2.2, lk));
      O.head.rotation.y += (lk - O.head.rotation.y) * Math.min(1, dt * 2);
      O.hoot -= dt;
      if (O.hoot <= 0) { O.hoot = 10 + Math.random() * 14; if (d < 45 && A.owl) { const dx = O.home.x - p.x, dz = O.home.z - p.z, yaw = p.yaw; A.owl(Math.max(-1, Math.min(1, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / (d + 0.1)))); } }
    }
  }
};
})();
