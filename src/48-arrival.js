/* ==========================================================================
   BLACKTHORN MANOR — 6g. THE ARRIVAL
   Your car comes up the lane in the rain with the radio on low. It pulls up
   at the gates, the engine coughs, the headlights flicker, dim and die, and
   the radio crackles away to nothing. The battery is flat. You walk.
   The car stays parked on the lane.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const CAR = { stopX: 2.0, z: 97.5, roadZ: 95.0, startX: -80, y: 0 };
BM.CAR = CAR;
/* timeline, seconds */
const T = { warn: 6.0, smoke: 7.5, arrive: 11.0, cough: 11.6, dim: 12.6, dead: 15.6, fadeOut: 16.6, out: 17.6, end: 18.6 };
BM.INTRO_T = T;

BM.buildCar = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lane';
  const car = new THREE.Group();
  car.position.set(CAR.startX, CAR.y, CAR.roadZ);
  car.rotation.y = -Math.PI / 2; // nose towards +x
  B.root.add(car);
  // the car is built along its own -z axis (nose at -z), 4.4 m long
  const add = (geo, mat, x, y, z, sx, sy, sz, rx, rz) => {
    const m = B.mesh(geo, mat, x, y, z, sx, sy, sz, 0, car);
    if (rx || rz) { m.rotation.set(rx || 0, 0, rz || 0); m.updateMatrix(); }
    return m;
  };
  add(G.box, 'carPaint', 0, 0.62, 0, 1.78, 0.62, 4.4);                 // body
  add(G.box, 'carPaint', 0, 0.5, -1.95, 1.7, 0.36, 0.5);               // nose
  add(G.box, 'chrome', 0, 0.42, -2.22, 1.74, 0.12, 0.06);              // front bumper
  add(G.box, 'chrome', 0, 0.42, 2.22, 1.74, 0.12, 0.06);               // rear bumper
  add(G.box, 'black', 0, 0.62, -2.21, 0.9, 0.22, 0.03);                // grille
  // the cabin: glass and pillars (seen from inside, its back faces vanish)
  add(G.box, 'carPaint', 0, 1.47, 0.35, 1.6, 0.06, 1.9);               // roof
  for (const sx of [-0.78, 0.78]) {
    add(G.box, 'carPaint', sx, 1.2, -0.65, 0.06, 0.55, 0.08, 0.35);    // A-pillars
    add(G.box, 'carPaint', sx, 1.2, 1.3, 0.06, 0.55, 0.1);             // C-pillars
    add(G.box, 'glass', sx, 1.2, 0.35, 0.02, 0.5, 1.85);               // side glass
  }
  add(G.box, 'glass', 0, 1.2, -0.72, 1.55, 0.5, 0.02, 0.35);           // windscreen
  add(G.box, 'glass', 0, 1.2, 1.32, 1.55, 0.5, 0.02, -0.3);            // rear screen
  add(G.box, 'darkWood', 0, 1.0, -0.45, 1.6, 0.14, 0.32);              // dashboard
  const wheel = add(G.ring, 'black', 0.38, 1.08, -0.2, 0.36, 0.36, 0.36, -0.4);
  add(G.post, 'black', 0.38, 1.0, -0.3, 0.03, 0.2, 0.03, 1.2);
  const dial = add(G.box, BM.Own(0x101010), 0.0, 1.07, -0.3, 0.16, 0.05, 0.02); // the radio's dial
  // the instrument cluster behind the wheel, with the engine warning lamp
  const cluster = add(G.box, BM.Own(0x0c1018), 0.38, 1.1, -0.42, 0.34, 0.1, 0.02);
  const warn = add(G.box, BM.Own(0x200800), 0.46, 1.11, -0.425, 0.03, 0.03, 0.01);
  // smoke from under the bonnet: a few soft puffs recycled as they rise
  const puffs = [];
  for (let i = 0; i < 14; i++) { const m = add(G.lowSphere, BM.Basic(0x9a9a98, { transparent: true, opacity: 0, depthWrite: false }), 0, 0.9, -2.0, 0.2); m.matrixAutoUpdate = true; puffs.push({ m, t: -1, seed: i * 0.37 }); }
  for (const sx of [-0.4, 0.4]) add(G.box, 'fabricRed', sx, 0.85, 0.55, 0.55, 0.5, 0.55);   // seats
  const wheels = [[-0.82, -1.4], [0.82, -1.4], [-0.82, 1.4], [0.82, 1.4]].map(([x, z]) => { const w = add(G.cyl, 'rubber', x, 0.33, z, 0.66, 0.24, 0.66, 0, Math.PI / 2); w.matrixAutoUpdate = true; return w; });
  // lamps: headlight glass and red tail lights that show their state
  const heads = [-0.62, 0.62].map(sx => add(G.sphere, BM.Own(0x202020), sx, 0.62, -2.18, 0.26, 0.2, 0.08));
  const tails = [-0.66, 0.66].map(sx => add(G.box, BM.Own(0x200404), sx, 0.68, 2.21, 0.3, 0.12, 0.03));
  car.traverse(o => { o.userData.dynamic = true; });
  wheel.userData.dynamic = true;

  // the headlights are real light records on the car's own supply, moved each frame
  const beams = [-0.62, 0.62].map((sx, i) => B.fixture({
    id: 'car-head-' + i, name: 'Headlight', circuit: 'car', kind: 'emergency', style: 'none', pos: [CAR.startX + 2.3, 0.62, CAR.z + sx],
    colour: 0xfff0c8, target: 2.6, range: 26, spot: true, dir: [1, -0.12, 0], on: false, noFail: true, corona: 0.7,
  }));

  // parked: collision, and the car itself is something you can try
  game.car = { group: car, heads, tails, dial, cluster, warn, puffs, beams, wheels, flat: true, parked: false }; // the tyre goes on the lane; you find it when you get out
  B.interactable({
    id: 'car', label: () => game.battery && game.battery.carried ? 'Fit the battery' : 'Your car', pos: [CAR.stopX, 1.0, CAR.z - 0.92], n: [0, -1],
    act: g => {
      if (g.carry === 'spare wheel') { g.changeWheel(); return; }
      if (g.carry === 'battery') { g.fitBattery(); return; }
      if (g.car.flat) { g.audio.click(); g.ui.say('The nearside front tyre is flat to the rim: the lane did that. The jack is in the boot, but the spare went for scrap years ago.' + (g.battery.fitted ? '' : ' And the battery is dead.'), 6); return; }
      g.audio.click(); g.audio.tone('sine', 60, 40, 0.15, 0.01, 0.12);
      g.ui.say(g.story.phoneTried ? 'A dry click, then nothing. It needs a battery that holds a charge.' : 'You try the key. A dry click from under the bonnet, then nothing. The battery is completely flat.');
    },
  });
  game.carWall = B.phys.addWall(CAR.stopX - 2.25, CAR.stopX + 2.25, CAR.z - 0.92, CAR.z + 0.92, 0, 1.5, { kind: 'furniture', tag: 'your car', enabled: false });
};

/* ---- the intro sequence: runs before the player has control ---- */
BM.Intro = class {
  constructor(game) { this.game = game; this.t = 0; this.done = false; this.said = {}; this.radio = 0; this.engine = 0; }
  skip() { this.t = T.end; this.finish(); }
  carX(t) {
    if (t >= T.arrive) return CAR.stopX;
    const u = t / T.arrive, e = 1 - Math.pow(1 - u, 2.2); // eases to a stop
    return CAR.startX + (CAR.stopX - CAR.startX) * e;
  }
  /* on the road, then pulled over onto the verge as it stops */
  carZ(t) { const u = Math.min(1, Math.max(0, (t - (T.arrive - 2.6)) / 2.6)); return CAR.roadZ + (CAR.z - CAR.roadZ) * u * u * (3 - 2 * u); }
  say(key, text, secs) { if (!this.said[key]) { this.said[key] = true; this.game.ui.say(text, secs || 5); } }
  update(dt) {
    const g = this.game, car = g.car, p = g.player;
    this.t += dt;
    const t = this.t;
    // the car rolls up the lane
    const x = this.carX(t), speed = Math.max(0, (x - this.carX(Math.max(0, t - 0.1))) / 0.1);
    const z = this.carZ(t);
    car.group.position.x = x; car.group.position.z = z;
    car.group.rotation.y = -Math.PI / 2 - Math.max(0, this.carZ(t + 0.15) - z) * 0.5;
    car.group.position.y = Math.sin(t * 9) * 0.008 * Math.min(1, speed / 3);
    // the driver: in the seat, looking up the lane, then round to the gates as it stops
    if (t < T.out) {
      const look = Math.min(1, Math.max(0, (t - T.arrive + 1.5) / 3));
      p.x = x - 0.45; p.z = z + 0.4; p.y = 1.22 - BM.PLAYER.eye;
      p.yaw = -Math.PI / 2 + look * 1.0;
      p.pitch = -0.04;
    }
    // headlights: full while the engine runs, then the battery drains and they sag to orange and out
    let head = 1, flick = 0;
    if (t >= T.dim) { const u = (t - T.dim) / (T.dead - T.dim); head = Math.max(0, 1 - u * u); }
    // the warning lamp blinks, then holds; the cluster dies with the battery
    const warnOn = t >= T.warn && (t < T.warn + 3 ? ((t * 3) % 1) < 0.5 : true) && t < T.dead;
    car.warn.material.color.setHex(warnOn ? 0xff7a10 : 0x200800);
    car.cluster.material.color.setRGB(0.05 + 0.12 * head, 0.08 + 0.16 * head, 0.14 + 0.25 * head);
    if (t >= T.warn && !this.said.warnPing) { this.said.warnPing = true; g.audio.warnPing && g.audio.warnPing(); }
    // smoke from the bonnet, thicker as it goes on, drifting back over the roof in the wind
    const smoking = t >= T.smoke && t < T.out;
    for (const pf of car.puffs) {
      if (pf.t < 0 && smoking && Math.random() < dt * 4) { pf.t = 0; pf.life = 1.6 + Math.random() * 1.2; pf.ox = (Math.random() - 0.5) * 0.6; }
      if (pf.t >= 0) {
        pf.t += dt; const u = pf.t / pf.life;
        if (u >= 1) { pf.t = -1; pf.m.material.opacity = 0; continue; }
        const lx = x + 2.1 - u * 1.6 * (speed > 1 ? 1 : 0.3) - (speed > 1 ? 0 : u * 0.4), ly = 0.95 + u * 1.3, lz = z + pf.ox + u * 0.4;
        pf.m.position.set(lx, ly, lz); pf.m.position.applyMatrix4(car.group.matrixWorld.clone().invert());
        pf.m.scale.setScalar(0.2 + u * 0.8); pf.m.material.opacity = 0.35 * Math.sin(u * Math.PI) * Math.min(1, (t - T.smoke) / 2);
      }
    }
    car.beams.forEach((l, i) => {
      l.on = head > 0.02 && t < T.dead;
      l.pos.x = x + 2.3; l.pos.z = z + (i ? 0.62 : -0.62);
      l.flicker = flick; l.lightType = flick ? 'flicker' : 'steady';
      l.target = 2.6 * head; l.colour = head > 0.6 ? 0xfff0c8 : 0xffa050;
      g.fx.moveLight(l);
    });
    const glow = t < T.dead ? head * (flick ? 0.4 + 0.6 * BM.noise1(t * 20) : 1) : 0;
    car.heads.forEach(m => m.material.color.setRGB(1.0 * glow, 0.92 * glow, 0.7 * glow * glow));
    car.tails.forEach(m => m.material.color.setRGB(0.12 + 0.6 * glow, 0.02, 0.02));
    car.dial.material.color.setRGB(0.6 * Math.min(1, this.radio * 3), 0.35 * Math.min(1, this.radio * 3), 0.05);
    // sound: radio low; the engine labours once it is smoking, coughs and dies; the radio fades with the battery
    this.radio = t < T.dim ? 0.05 : Math.max(0, 0.05 * head * (0.5 + 0.5 * BM.noise1(t * 14)));
    const labour = t >= T.smoke ? 0.5 + 0.5 * BM.noise1(t * 7) : 1;
    this.engine = t < T.cough ? 0.16 * (0.5 + 0.5 * Math.min(1, speed / 6)) * labour : Math.max(0, 0.16 * (1 - (t - T.cough) / 1.0));
    this.engineRev = (0.6 + Math.min(1, speed / 8) * 0.6) * (t >= T.smoke && t < T.cough ? 0.85 + 0.15 * BM.noise1(t * 9) : 1);
    if (t >= T.cough && !this.said.cough) { g.audio.cough && g.audio.cough(); }
    this.say('arrive', 'Blackthorn Lane, after midnight. Miles of forest and not another car. The radio is down low and the wipers can barely keep up.', 5.5);
    if (t >= 2.5) this.say('road', 'No signal since the turning. The bridge three miles back is under the river; the nearest town is a hundred and fifty kilometres the other way.', 5);
    if (t >= T.warn) this.say('warn', 'An amber lamp starts blinking on the dash. The engine note changes.', 3);
    if (t >= T.smoke + 0.8) this.say('smoke', 'Smoke, pale in the headlights, leaking from under the bonnet. You ease off and look for somewhere to pull in.', 5);
    if (t >= T.arrive - 1.0) this.say('gates', 'The headlights find a pair of iron gates. You pull over onto the verge beside them.', 4);
    if (t >= T.cough) this.say('cough', 'The engine coughs once, twice — and dies.', 3);
    if (t >= T.dim + 1.0) this.say('lights', 'The dash goes dark. The headlights sag to a dull orange, and the radio fades with them... and out.', 5);
    if (t >= T.dead) this.say('flat', 'You turn the key. A click. The battery is flat, the bonnet is smoking, and there is not another light for miles. Except up there, behind the gates.', 6);
    // fade, then you are standing in the rain beside the car
    if (t >= T.fadeOut && t < T.out) g.ui.fade(Math.min(1, (t - T.fadeOut) / (T.out - T.fadeOut)));
    if (t >= T.out && !this.placed) { this.placed = true; this.place(); }
    if (t >= T.out) g.ui.fade(Math.max(0, 1 - (t - T.out) / (T.end - T.out)));
    if (t >= T.end) this.finish();
  }
  place() {
    const g = this.game, car = g.car;
    car.group.position.set(CAR.stopX, 0, CAR.z); car.group.rotation.y = -Math.PI / 2;
    car.beams.forEach(l => { l.on = false; l.flicker = 0; l.lightType = 'steady'; l.target = 2.6; l.pos.x = CAR.stopX + 2.3; l.pos.z = CAR.z + (car.beams.indexOf(l) ? 0.62 : -0.62); g.fx.moveLight(l); });
    car.heads.forEach(m => m.material.color.setRGB(0.12, 0.12, 0.12));
    car.tails.forEach(m => m.material.color.setRGB(0.12, 0.02, 0.02));
    car.warn.material.color.setHex(0x200800); car.cluster.material.color.setHex(0x0c1018);
    for (const pf of car.puffs) { pf.t = -1; pf.m.material.opacity = 0; }
    g.carWall.enabled = true; car.parked = true;
    if (car.flat) { car.wheels[0].scale.set(0.66, 0.24, 0.42); car.wheels[0].position.y = 0.21; }
    g.teleport(BM.START.x, BM.START.y, BM.START.z, BM.START.yaw);
    g.player.pitch = 0;
  }
  finish() {
    if (this.done) return;
    if (!this.placed) { this.placed = true; this.place(); }
    this.done = true; this.radio = 0; this.engine = 0;
    this.game.ui.fade(0);
    this.game.ui.msgT = 0; if (this.game.ui.el.msg) this.game.ui.el.msg.style.opacity = '0';
    this.game.intro = null;
  }
};
})();
