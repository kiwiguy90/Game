/* ==========================================================================
   BLACKTHORN MANOR — 5d. GLIMPSES
   Nobody chases you. But the cook's note says she is still here, and now
   and then you catch her: a girl's shape in an upstairs window as you walk
   up the drive, with a candle behind her; slow footsteps crossing the
   balcony over the hall; a figure at the far end of the back landing that
   is gone when you look properly; a music box in the nursery; and three
   knocks from the attic when you set the gate motor running. Each happens
   once, and only when you are looking, or listening, in the right place.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

BM.buildGlimpses = function (B, game) {
  B.zone = 'mansion';
  const shade = new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0 });
  const make = (x, y, z, ang, pose) => {
    const f = BM.figure(B, x, y, z, ang, { pose, mat: shade, scale: 0.92 });
    f.traverse(o => { o.userData.dynamic = true; }); f.visible = false;
    return f;
  };
  // the window: the left-hand upper window of the front bedroom, a candle behind her
  B.levelName = 'upper'; B.room = 'bedroom1';
  const winFig = make(-9, 4.2, 11.35, 0, 'mourn');
  const candle = B.fixture({ id: 'glimpse-candle', name: 'Candle', circuit: 'fire', kind: 'fire', style: 'none', pos: [-9.3, 5.4, 10.4], colour: 0xffa850, target: 0.9, range: 5, on: false, noFail: true, corona: 0 });
  // the landing: at the far end, by her bedroom door
  B.levelName = 'upper'; B.room = 'upper corridor';
  const landFig = make(-5.0, 4.2, -9.6, Math.PI / 2, 'pray');
  game.glimpses = { shade, winFig, landFig, candle, active: null, t: 0, hallT: 0 };
};

const done = (g, k) => (g.story.glimpses || (g.story.glimpses = {}))[k];
const mark = (g, k) => { (g.story.glimpses || (g.story.glimpses = {}))[k] = true; };
/* is the point in front of you, within a cone, and not behind a wall? */
function seen(g, x, y, z, cone) {
  const p = g.player, f = g.forward(), eye = p.y + BM.PLAYER.eye;
  const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
  if ((dx * f.x + dz * f.z) / d < cone) return false;
  return !g.phys.occluded(p.x, eye, p.z, x, y, z, 0.3);
}

BM.updateGlimpses = function (g, dt) {
  const G = g.glimpses; if (!G || g.intro || g.outro || (g.story && g.story.ended)) return;
  const p = g.player, A = g.audio;
  // a glimpse in progress: she is there for a moment, then fades
  if (G.active) {
    G.t += dt;
    const a = G.active, k = a.t1 ? Math.min(1, G.t / 0.25) * Math.max(0, 1 - Math.max(0, G.t - a.t1) / a.fade) : 1;
    G.shade.opacity = 0.96 * k;
    if (a.until && a.until()) a.t1 = Math.min(a.t1, G.t);
    if (G.t > a.t1 + a.fade) { a.fig.visible = false; if (a.end) a.end(); G.active = null; }
    return;
  }
  const show = (key, fig, t1, fade, extra) => { mark(g, key); G.active = Object.assign({ fig, t1, fade }, extra || {}); G.t = 0; fig.visible = true; G.shade.opacity = 0; };

  // 1. the window, from the drive, once the gates have shut behind you and before you have gone in
  if (!done(g, 'window') && g.gates.lockedIn && !g.frontDoors.opened && p.z > 22 && p.z < 70 && Math.abs(p.x) < 14 && seen(g, -9, 6.0, 12.3, 0.93)) {
    G.candle.on = true;
    show('window', G.winFig, 2.2, 1.2, { end: () => { G.candle.on = false; } });
    if (A.creakBoard) A.creakBoard(0.25, -0.3);
    return;
  }
  // 2. footsteps on the balcony over the hall, while you stand in it with the lights on
  const inHall = Math.abs(p.x) < 5.6 && p.z > 0.5 && p.z < 11.5 && p.y < 1;
  G.hallT = inHall && g.grid.live('main') ? G.hallT + dt : 0;
  if (!done(g, 'steps') && G.hallT > 6 && A.burst) {
    mark(g, 'steps');
    for (let i = 0; i < 7; i++) { const w = i * 0.85 + Math.random() * 0.1, pan = -0.7 + i * 0.22; A.burst(A.brown, 'lowpass', 170, 1.2, 0.32, 0.004, 0.16, w, pan); A.burst(A.white, 'bandpass', 600, 4, 0.05, 0.002, 0.05, w + 0.02, pan); }
    if (A.creakBoard) setTimeoutSafe(() => A.creakBoard(0.5, 0.5), 3800);
    if (A.latch) setTimeoutSafe(() => A.latch(0.35), 6600);
    return;
  }
  // 3. the landing: she stands by her door at the far end; gone when you look properly or come close
  if (!done(g, 'landing') && p.y > 4 && p.y < 5 && Math.abs(p.x) < 5.5 && p.z < -0.5 && p.z > -4.5 && seen(g, -5.0, 5.2, -9.6, 0.9)) {
    show('landing', G.landFig, 1.6, 0.5, { until: () => Math.hypot(p.x + 5, p.z + 9.6) < 4.5 });
    if (A.tone) A.tone('sine', 52, 40, 0.18, 0.4, 2.2);
    return;
  }
  // 4. the music box in the nursery, heard from the landing
  if (!done(g, 'musicbox') && p.y > 4 && p.y < 5 && p.x > 1 && p.x < 6 && p.z < -5 && A.bell) {
    mark(g, 'musicbox');
    const tune = [1318, 1174, 1046, 1174, 1318, 1318, 1318, 1174, 1174, 1174, 1318, 1568, 1568];
    tune.forEach((f, i) => A.bell(f * 2, 0.05 * (1 - i / tune.length * 0.5), 0.3 + i * 0.42 * (1 + i * 0.03), 1.2));
    return;
  }
  // 5. three knocks from the attic when the gate motor is set running
  if (!done(g, 'knocks') && g.gates.escaping && A.burst) {
    mark(g, 'knocks');
    for (let i = 0; i < 3; i++) A.burst(A.brown, 'lowpass', 260, 1.5, 0.5, 0.003, 0.18, 2.5 + i * 1.1);
    setTimeoutSafe(() => { if (!g.story.ended) g.ui.say('Above you, somewhere in the roof: three slow knocks. Then nothing.', 4); }, 4200);
  }
};
function setTimeoutSafe(fn, ms) { if (typeof setTimeout !== 'undefined') setTimeout(fn, ms); }
})();
