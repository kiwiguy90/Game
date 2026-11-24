/* ==========================================================================
   HALCYON HOUSE — INSIDE: THE GLASS LIFT, THE CINEMA, THE CAR GALLERY
   - A glass lift in the atrium, from the hall to the first-floor gallery
     and up through the roof onto the terrace. Use the panel on any landing
     to call it, or (standing in it) to ride to the next floor; glass gates
     close the shaft wherever the car is not.
   - The cinema: a big screen, three rows of recliners, a starlit ceiling.
     Start a film and the room lights fade down and the screen comes up.
   - The car gallery in the garage wing: four cars under display lights,
     one turning slowly on a lit turntable, chargers glowing on the wall,
     and two wide garage doors that lift up out of the way.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildHalcyonInside = function (B, game) {
  const HC = game.halcyon, M = BM.halcyonMats(), P = B.phys, HL = BM.HALCYON, L = HL.LIFT, F1 = HL.F1, R = HL.ROOF;
  const led = (o) => BM.halcyonLed(B, game, o);

  /* ================= THE GLASS LIFT ================= */
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'atrium';
  const LEVELS = [{ y: 0, name: 'Hall' }, { y: F1, name: 'Gallery' }, { y: R, name: 'Roof terrace' }];
  // the shaft: glass on three sides, slim steel corners, open to the east at each landing
  const top = R + 2.6;
  B.solid(M.glass, L.x0 - 0.05, L.x0, 0, top, L.z0, L.z1, { kind: 'wall', tag: 'lift shaft' });
  B.solid(M.glass, L.x0, L.x1, 0, top, L.z0 - 0.05, L.z0, { kind: 'wall', tag: 'lift shaft' }); B.solid(M.glass, L.x0, L.x1, 0, top, L.z1, L.z1 + 0.05, { kind: 'wall', tag: 'lift shaft' });
  for (const [x, z] of [[L.x0, L.z0], [L.x0, L.z1], [L.x1, L.z0], [L.x1, L.z1]]) B.boxE(M.steel, x - 0.05, x + 0.05, 0, top, z - 0.05, z + 0.05);
  B.boxE(M.steel, L.x0 - 0.1, L.x1 + 0.1, top, top + 0.15, L.z0 - 0.1, L.z1 + 0.1);
  // on the roof, a glass box round the top of the shaft, its door to the east
  B.levelName = 'attic';
  B.solid(M.glass, L.x1, L.x1 + 0.05, R, top, L.z0 - 0.05, L.z0 + 0.1, { kind: 'wall', tag: 'lift' }); B.solid(M.glass, L.x1, L.x1 + 0.05, R, top, L.z1 - 0.1, L.z1 + 0.05, { kind: 'wall', tag: 'lift' });
  // the first-floor landing: a short bridge from the gallery to the shaft
  B.levelName = 'upper';
  B.floor(M.oak, L.x1, HL.VOID[1], L.z0, L.z1, F1, 0.3);
  B.solid(M.glass, L.x1, HL.VOID[1], F1, F1 + 1.05, L.z0 - 0.04, L.z0, { kind: 'wall', tag: 'balustrade' }); B.solid(M.glass, L.x1, HL.VOID[1], F1, F1 + 1.05, L.z1, L.z1 + 0.04, { kind: 'wall', tag: 'balustrade' });
  B.levelName = 'ground';
  // the car: a glass box on a steel floor, a ring of light under it
  const car = new THREE.Group(); car.position.set((L.x0 + L.x1) / 2, 0, (L.z0 + L.z1) / 2); B.root.add(car);
  const w = L.x1 - L.x0 - 0.12, d = L.z1 - L.z0 - 0.12;
  B.box(M.steel, 0, 0.02, 0, w, 0.06, d, 0, car); B.box(M.steel, 0, 2.4, 0, w, 0.06, d, 0, car);
  B.box(M.glass, -w / 2, 1.2, 0, 0.03, 2.36, d, 0, car); B.box(M.glass, 0, 1.2, -d / 2, w, 2.36, 0.03, 0, car); B.box(M.glass, 0, 1.2, d / 2, w, 2.36, 0.03, 0, car);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  B.box(ringMat, 0, -0.02, 0, w + 0.04, 0.02, d + 0.04, 0, car);
  B.box(M.charcoal, -w / 2 + 0.05, 1.2, 0, 0.04, 0.3, 0.2, 0, car);   // the button panel
  car.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
  const carLight = led({ id: 'lift-light', name: 'Lift light', room: 'atrium', pos: [car.position.x, 2.3, car.position.z], colour: 0xe8f0ff, target: 0.7, range: 4, corona: 0 });
  // the gates at each landing: glass, sliding across the open side while the car is elsewhere
  const gates = LEVELS.map((lv, i) => {
    const g = new THREE.Group(); g.position.set(L.x1 + 0.03, lv.y, (L.z0 + L.z1) / 2); B.root.add(g);
    B.box(M.glass, 0, 1.1, 0, 0.03, 2.2, L.z1 - L.z0, 0, g); B.box(M.steel, 0, 2.22, 0, 0.05, 0.05, L.z1 - L.z0, 0, g);
    g.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    const wall = P.addWall(L.x1, L.x1 + 0.06, L.z0, L.z1, lv.y, lv.y + 2.2, { kind: 'door', tag: 'lift gate' });
    return { g, wall, t: 0 };
  });
  HC.lift = { car, ringMat, carLight, gates, levels: LEVELS, at: 0, y: 0, to: 0, moving: false, wait: 0 };
  LEVELS.forEach((lv, i) => {
    B.levelName = i === 0 ? 'ground' : i === 1 ? 'upper' : 'attic';
    B.interactable({ id: 'lift-' + i, label: () => BM.halcyonInLift(game) ? 'Lift: ride to the ' + LEVELS[(HC.lift.at + 1) % 3].name.toLowerCase() : 'Lift: call it to the ' + lv.name.toLowerCase(),
      pos: [L.x1 + 0.35, lv.y + 1.2, L.z1 + 0.3], n: [1, 0], floorY: lv.y, approachDist: 0.9, act: g => BM.halcyonLiftUse(g, i) });
  });
  B.levelName = 'ground';

  /* ================= THE CINEMA ================= */
  B.room = 'cinema';
  const SX = 25.6, SZ = 8, SW = 6.8, SH = 3.2, H_Z1 = HL.H.z1;
  B.boxE(M.black, SX - 0.05, SX + 0.25, 0.2, 3.7, SZ - SW / 2 - 0.3, SZ + SW / 2 + 0.3);          // the frame
  const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 120;
  const tex = new THREE.CanvasTexture(cvs);
  const screen = B.mesh(G.plane, new THREE.MeshBasicMaterial({ map: tex, color: 0x050505 }), SX - 0.06, 0.45 + SH / 2, SZ, SW, SH, 1, -Math.PI / 2); screen.userData.dynamic = true;
  // three rows of recliners, rising to the back, and a starlit ceiling
  for (let r = 0; r < 3; r++) {
    const x = 22 - r * 2.6, y0 = r * 0.25;
    if (r) B.solid(M.charcoal, x - 1.2, x + 1.3, 0, y0, 3.5, 13.6, { kind: 'furniture', tag: 'riser' });
    // leather recliners, five to a row with shared console arms, facing the screen
    for (let s = 0; s < 5; s++) BM.KIT.recliner(B, x, 8 + (s - 2) * 0.98, y0, Math.PI / 2, { mat: 'hLeather' });
    if (r) { B.boxE('hAcoustic', x + 1.3, x + 1.31, 0, y0, 3.5, 13.6);   // the riser's fascia, carpeted, with amber step lights along its nose
      const more = []; for (let z = 4.1; z < 13.5; z += 0.6) more.push(['box', x + 1.312, y0 - 0.06, z, 0.004, 0.02, 0.05]);
      const f = more.shift(); led({ id: 'cinema-step-' + r, name: 'Step lights', room: 'cinema', pos: [x + 1.5, 0.15 + y0 / 2, 8], colour: 0xffa040, target: 0.15, range: 2, corona: 0, glow: [f[1], f[2], f[3], f[4], f[5], f[6]], glowMore: more }); }
  }
  // the walls in dark fabric acoustic panels, the ceiling deep navy, and a field of fibre-optic stars in three sizes
  B.boxE('hAcoustic', 14.2, 25.5, 0.3, F1 - 0.4, 2.1, 2.14); B.boxE('hAcoustic', 14.2, 25.5, 0.3, F1 - 0.4, H_Z1 - 0.34, H_Z1 - 0.3);
  B.boxE('hAcoustic', 14.15, 14.19, 2.5, F1 - 0.4, 2.2, 13.6); B.boxE('hAcoustic', 25.9, 25.96, 0, F1 - 0.3, 2.1, H_Z1 - 0.3);
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x0e1424, shininess: 2 }), 14.15, 26, F1 - 0.305, F1 - 0.3, 2.1, H_Z1 - 0.3);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xdce6ff }), srnd = BM.mulberry32(9);
  for (let i = 0; i < 600; i++) { const d = [0.012, 0.018, 0.028][Math.floor(srnd() * srnd() * 3)]; const s = B.box(starMat, 14.3 + srnd() * 11.4, F1 - 0.31, 2.3 + srnd() * 11.2, d, 0.004, d); s.userData.star = true; }
  HC.cinema = { tex, cvs, screen, playing: false, t: 0, dim: 0, screenLight: led({ id: 'cinema-screen', name: 'Screen glow', room: 'cinema', pos: [SX - 1.5, 2, SZ], colour: 0x000000, target: 0, range: 12, corona: 0 }), starMat };
  HC.cinema.screenLight.smart = false; HC.cinema.screenLight.base = null;
  B.interactable({ id: 'cinema-play', label: () => HC.cinema.playing ? 'Cinema: stop the film' : 'Cinema: play a film', pos: [14.4, 1.2, 5.6], n: [1, 0], act: g => BM.halcyonCinema(g) });

  /* ================= THE CAR GALLERY ================= */
  B.room = 'garage';
  const GA = HL.GA;
  // a gloss floor, display spots over each car, chargers glowing on the back wall
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x121416, shininess: 120, specular: 0x888888 }), GA.x0 + 0.3, GA.x1, 0.02, 0.03, GA.z0 + 0.3, GA.z1 - 0.3);
  const CARS = [[-41, 4, 0xc81818], [-31, 4, 0xf0f0ee], [-41, -6, 0xc8e020], [-31, -5, 0x101214]];
  HC.cars = [];
  CARS.forEach(([x, z, col], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = i % 2 ? 0.2 : -0.2; B.root.add(g);
    const paint = new THREE.MeshPhongMaterial({ color: col, shininess: 150, specular: 0xaaaaaa });
    const glass = new THREE.MeshPhongMaterial({ color: 0x0c1218, shininess: 160, specular: 0xffffff });
    B.box(paint, 0, 0.55, 0, 2.0, 0.5, 4.4, 0, g);                       // the body
    const nose = B.box(paint, 0, 0.48, -2.4, 1.9, 0.32, 0.8, 0, g); nose.rotation.x = 0.28;
    const deck = B.box(paint, 0, 0.92, 1.4, 1.9, 0.3, 1.6, 0, g); deck.rotation.x = -0.1;
    B.mesh(G.sphere, glass, 0, 0.92, -0.2, 0.9, 0.42, 1.6, 0, g);       // the canopy
    // the details that make it a car: sills, a splitter and diffuser, mirrors, a grille, door shut-lines, a rear light bar
    for (const s of [-1, 1]) { B.box('hBlackGlass', s * 1.0, 0.34, 0, 0.06, 0.1, 3.0, 0, g); B.box(paint, s * 1.02, 0.92, -0.75, 0.16, 0.06, 0.1, 0, g); B.box('hBlackGlass', s * 1.08, 0.92, -0.75, 0.02, 0.05, 0.09, 0, g); B.box('hBlackSteel', s * 1.001, 0.62, -0.3, 0.002, 0.42, 0.004, 0, g); B.box('hBlackSteel', s * 1.001, 0.62, 0.9, 0.002, 0.42, 0.004, 0, g); B.box('hBlackSteel', s * 1.0, 0.55, 0.45, 0.01, 0.12, 0.5, 0, g); }
    B.box('hBlackGlass', 0, 0.22, -2.72, 1.9, 0.05, 0.3, 0, g); B.box('hBlackGlass', 0, 0.42, -2.78, 1.1, 0.16, 0.04, 0, g); B.box('hBlackGlass', 0, 0.34, 2.22, 1.7, 0.16, 0.06, 0, g);
    for (const s of [-1, 1]) B.mesh(G.cyl, 'hChrome', s * 0.35, 0.28, 2.24, 0.1, 0.04, 0.1, 0, g).rotation.x = Math.PI / 2;
    B.box('hBlackGlass', 0, 1.06, 2.05, 1.5, 0.03, 0.25, 0, g);
    for (const [wx, wz] of [[-0.95, -1.45], [0.95, -1.45], [-0.95, 1.45], [0.95, 1.45]]) {
      const wh = B.mesh(G.cyl, 'hTyre', wx, 0.36, wz, 0.72, 0.3, 0.72, 0, g); wh.rotation.z = Math.PI / 2;
      const rim = B.mesh(G.cyl, 'hChrome', wx * 1.02, 0.36, wz, 0.5, 0.31, 0.5, 0, g); rim.rotation.z = Math.PI / 2;
      const hub = B.mesh(G.cyl, 'hBlackSteel', wx * 1.03, 0.36, wz, 0.4, 0.312, 0.4, 0, g); hub.rotation.z = Math.PI / 2;
      for (let k = 0; k < 5; k++) { const sp = B.box('hChrome', wx * 1.03 + Math.sign(wx) * 0.157, 0.36, wz, 0.012, 0.38, 0.05, 0, g); sp.rotation.set(k * Math.PI * 2 / 5, 0, 0); }
      const cal = B.box(new THREE.MeshPhongMaterial({ color: 0xd8a010, shininess: 60 }), wx * 0.97, 0.48, wz - 0.1, 0.06, 0.14, 0.18, 0, g);
    }
    const lamp = new THREE.MeshBasicMaterial({ color: 0xe8f4ff });
    for (const s of [-1, 1]) { B.box(lamp, s * 0.72, 0.6, -2.62, 0.4, 0.04, 0.06, 0, g); B.box(new THREE.MeshBasicMaterial({ color: 0xff1a1a }), s * 0.6, 0.72, 2.21, 0.6, 0.05, 0.03, 0, g); }
    g.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    P.addWall(x - 1.1, x + 1.1, z - 2.4, z + 2.4, 0, 1.2, { kind: 'furniture', tag: 'car' });
    led({ id: 'car-spot-' + i, name: 'Display spot', room: 'garage', pos: [x, GA.h - 0.3, z], spot: true, dir: [0, -1, 0], colour: 0xfff6ea, target: 1.6, range: 7, corona: 0.2, glow: [x, GA.h - 0.02, z, 0.3, 0.03, 0.3] });
    HC.cars.push(g);
  });
  // the turntable under the white car
  const TT = new THREE.Group(); TT.position.set(-31, 0, 4); B.root.add(TT);
  B.mesh(G.cyl, M.steel, 0, 0.04, 0, 5.6, 0.06, 5.6, 0, TT);
  const ttRing = new THREE.MeshBasicMaterial({ color: 0x111111 });
  { const rg = B.mesh(G.ring, ttRing, 0, 0.075, 0, 5.6, 5.6, 5.6, 0, TT); rg.rotation.x = -Math.PI / 2; }
  TT.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
  HC.turntable = { g: TT, car: HC.cars[1], on: true, ring: ttRing, a: 0.2 };
  B.interactable({ id: 'turntable', label: () => HC.turntable.on ? 'Turntable: stop' : 'Turntable: turn', pos: [-27.6, 1.0, 4], n: [1, 0], act: g => { HC.turntable.on = !HC.turntable.on; BM.halcyonSay(g, HC.turntable.on ? 'Turntable on.' : 'Turntable stopped.', 2); } });
  // chargers on the back wall
  HC.chargers = [];
  for (const x of [-42, -38, -34, -30]) {
    B.box(M.white, x, 1.3, GA.z0 + 0.36, 0.4, 0.55, 0.12);
    const ring = B.mesh(G.ring, new THREE.MeshBasicMaterial({ color: 0x20c060 }), x, 1.36, GA.z0 + 0.43, 0.22, 0.22, 0.22); ring.userData.dynamic = true; HC.chargers.push(ring);
  }
  // the garage doors: two wide panels that lift up into the head
  HC.gdoors = HC.garageOpenings.map(([x0, x1]) => {
    const g = new THREE.Group(); g.position.set((x0 + x1) / 2, 0, GA.z1 - 0.15); B.root.add(g);
    for (let k = 0; k < 4; k++) B.box(M.timber, 0, 0.4 + k * 0.8, 0, x1 - x0, 0.79, 0.06, 0, g);   // flush, clad in the same battens as the wall: they disappear
    g.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    const wall = P.addWall(x0, x1, GA.z1 - 0.3, GA.z1, 0, 3.2, { kind: 'door', tag: 'garage door' });
    return { g, wall, t: 0 };
  });
  HC.gdoorTarget = 0;
  B.zone = 'exterior'; B.room = 'grounds';
  B.interactable({ id: 'garage-doors', label: () => HC.gdoorTarget ? 'Garage: close the doors' : 'Garage: open the doors', pos: [-36, 1.2, GA.z1 + 0.03], n: [0, 1], act: g => BM.halcyonGarage(g) });
  B.zone = 'mansion'; B.room = 'garage';
  B.interactable({ id: 'garage-doors-in', label: () => HC.gdoorTarget ? 'Garage: close the doors' : 'Garage: open the doors', pos: [-36, 1.3, GA.z1 - 0.33], n: [0, -1], act: g => BM.halcyonGarage(g) });
  B.room = 'house';
};

/* ---- the lift ---- */
BM.halcyonInLift = function (game) {
  const L = BM.HALCYON.LIFT, p = game.player, lf = game.halcyon.lift;
  return p.x > L.x0 && p.x < L.x1 && p.z > L.z0 && p.z < L.z1 && Math.abs(p.y - lf.y) < 0.6;
};
BM.halcyonLiftUse = function (game, i) {
  const lf = game.halcyon.lift; if (lf.moving) { game.ui.say('The lift is on its way.', 2); return; }
  const to = BM.halcyonInLift(game) ? (lf.at + 1) % 3 : i;
  if (to === lf.at) { BM.halcyonSay(game, 'The lift is here.', 2); return; }
  lf.to = to; lf.moving = true; lf.wait = 0.6; lf.ride = BM.halcyonInLift(game);
  game.audio.tone && game.audio.tone('sine', 660, 990, 0.04, 0.01, 0.3);
  BM.halcyonSay(game, lf.ride ? 'Going up to the ' + lf.levels[to].name.toLowerCase() + '.' : 'The lift is coming.', 2);
  if (lf.ride && to < lf.at) game.ui.say('HALCYON · Going down to the ' + lf.levels[to].name.toLowerCase() + '.', 2);
};
/* ---- the cinema ---- */
BM.halcyonCinema = function (game) {
  const C = game.halcyon.cinema; C.playing = !C.playing; C.t = 0;
  BM.halcyonSay(game, C.playing ? 'Enjoy the film.' : 'Film stopped. Lights up.', 3);
};
/* ---- the garage ---- */
BM.halcyonGarage = function (game) {
  const HC = game.halcyon; HC.gdoorTarget = HC.gdoorTarget ? 0 : 1;
  game.audio.tone && game.audio.tone('sawtooth', 70, 70, 0.02, 0.1, 3.5);
  BM.halcyonSay(game, HC.gdoorTarget ? 'Opening the garage.' : 'Closing the garage.', 2);
};

function drawFilm(C, t) {
  const g = C.cvs.getContext && C.cvs.getContext('2d'); if (!g) return;
  // a slow aerial film over mountains and a lake at sunset
  const sky = g.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, '#1a2a5a'); sky.addColorStop(0.55, '#d8784a'); sky.addColorStop(1, '#f0c080');
  g.fillStyle = sky; g.fillRect(0, 0, 256, 120);
  g.fillStyle = '#ffe0a0'; g.beginPath(); g.arc(180 - (t * 2) % 40, 70, 14, 0, 7); g.fill();
  for (let k = 0; k < 3; k++) {
    g.fillStyle = ['#3a2a4a', '#2a1e36', '#180f22'][k]; g.beginPath(); g.moveTo(0, 120);
    for (let x = 0; x <= 256; x += 8) g.lineTo(x, 60 + k * 14 + Math.sin((x + t * (10 + k * 14)) * 0.03 + k) * (12 - k * 2) + Math.sin((x + t * (6 + k * 9)) * 0.011) * 10);
    g.lineTo(256, 120); g.fill();
  }
  g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(0, 100, 256, 20);
  if (t < 4) { g.fillStyle = 'rgba(255,255,255,' + Math.max(0, 1 - t / 4) + ')'; g.font = 'bold 18px sans-serif'; g.fillText('HALCYON PICTURES', 46, 50); }
  C.tex.needsUpdate = true;
}

BM.updateHalcyonInside = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.lift) return;
  const p = game.player, A = game.audio, lf = HC.lift;
  /* the lift: doors first, then the ride, carrying you with it */
  const inCar = BM.halcyonInLift(game);
  if (lf.moving) {
    if (lf.wait > 0) lf.wait -= dt;
    else {
      const ty = lf.levels[lf.to].y, dir = Math.sign(ty - lf.y);
      lf.y += dir * Math.min(Math.abs(ty - lf.y), dt * 1.4);
      if (A.ctx && Math.random() < dt * 4) A.tone('sine', 110, 110, 0.012, 0.05, 0.3);
      if (lf.y === ty) { lf.moving = false; lf.at = lf.to; A.tone && A.tone('sine', 990, 990, 0.04, 0.01, 0.4); }
    }
  }
  lf.car.position.y = lf.y;
  lf.carLight.pos.y = lf.y + 2.3;
  if (inCar || (lf.ride && lf.moving)) {
    if (lf.ride || inCar) { p.y = lf.y; p.vy = 0; p.grounded = true; }
  }
  if (!lf.moving) lf.ride = false;
  lf.gates.forEach((gt, i) => {
    const open = !lf.moving && lf.at === i ? 1 : 0;
    gt.t += Math.sign(open - gt.t) * Math.min(Math.abs(open - gt.t), dt / 0.8);
    gt.g.position.z = (BM.HALCYON.LIFT.z0 + BM.HALCYON.LIFT.z1) / 2 + gt.t * 1.75;
    gt.wall.enabled = gt.t < 0.6;
  });
  lf.ringMat.color.setHex(lf.moving ? 0x3f8cff : 0x16304a);
  /* the cinema */
  const C = HC.cinema;
  C.dim += Math.sign((C.playing ? 1 : 0) - C.dim) * Math.min(Math.abs((C.playing ? 1 : 0) - C.dim), dt / 3);
  for (const l of game.grid.lights) if (l.room === 'cinema' && l.smart && l.base) l.target = l.base.target * HC.bright * (1 - 0.92 * C.dim);
  C.screen.material.color.setScalar(0.03 + 0.97 * C.dim);
  C.starMat.color.setRGB(0.25 + 0.6 * C.dim, 0.3 + 0.6 * C.dim, 0.45 + 0.6 * C.dim);
  if (C.playing) {
    C.t += dt; C.drawT = (C.drawT || 0) - dt;
    if (C.drawT <= 0) { C.drawT = 0.1; drawFilm(C, C.t); }
    C.screenLight.colour = 0xd88a5a; C.screenLight.target = 1.2 * C.dim; C.screenLight.on = true;
    if (A.ctx && game.ctx && game.ctx.zone === 'house' && p.x > 14 && p.z > 2 && Math.random() < dt * 0.6) A.tone('sine', 220 + Math.random() * 220, 200, 0.02, 0.4, 2.5);
  } else { C.screenLight.target = 0; }
  /* the car gallery */
  const T = HC.turntable;
  if (T.on) { T.a += dt * 0.25; }
  T.g.rotation.y = T.a; T.car.rotation.y = T.a + 0.2;
  T.ring.color.setHSL((HC.t * 0.05) % 1, 0.8, T.on ? 0.5 : 0.15);
  HC.chargers.forEach((r, i) => r.material.color.setHSL(0.36, 0.9, 0.3 + 0.2 * Math.max(0, Math.sin(HC.t * 2 + i))));
  for (const d of HC.gdoors) {
    d.t += Math.sign(HC.gdoorTarget - d.t) * Math.min(Math.abs(HC.gdoorTarget - d.t), dt / 4);
    d.g.position.y = d.t * 3.0; d.g.scale.y = Math.max(0.12, 1 - d.t * 0.88);
    d.wall.enabled = d.t < 0.65;
  }
};

BM.halcyonInsideRows = function (game) {
  const HC = game.halcyon; if (!HC || !HC.lift) return [];
  const r = (k, name, o) => Object.assign({ section: 'INSIDE', supply: '', k: 'smart:' + k, name, on: true, lit: false, live: true }, o);
  return [
    r('lift', 'Glass lift', { value: HC.lift.moving ? 'MOVING' : HC.lift.levels[HC.lift.at].name.toUpperCase() }),
    r('cinema', 'Cinema', { on: HC.cinema.playing, onText: 'PLAYING', offText: 'OFF', lit: HC.cinema.playing }),
    r('garage', 'Garage doors', { on: HC.gdoorTarget > 0, onText: 'OPEN', offText: 'CLOSED', lit: HC.gdoorTarget > 0 }),
    r('turntable', 'Car turntable', { on: HC.turntable.on, onText: 'TURNING', offText: 'STOPPED', lit: HC.turntable.on }),
  ];
};
BM.halcyonInsideToggle = function (game, id) {
  const HC = game.halcyon;
  if (id === 'lift') { const lf = HC.lift; if (!lf.moving) { lf.to = (lf.at + 1) % 3; lf.moving = true; lf.wait = 0.6; lf.ride = BM.halcyonInLift(game); BM.halcyonSay(game, 'Sending the lift to the ' + lf.levels[lf.to].name.toLowerCase() + '.', 2); } }
  else if (id === 'cinema') BM.halcyonCinema(game);
  else if (id === 'garage') BM.halcyonGarage(game);
  else if (id === 'turntable') { HC.turntable.on = !HC.turntable.on; BM.halcyonSay(game, HC.turntable.on ? 'Turntable on.' : 'Turntable stopped.', 2); }
  else return false;
  return true;
};
})();
