/* ==========================================================================
   BLACKTHORN MANOR — 6zb. THE DOORBELLS
   - At the gates: an electric bell push in a brass plate on the right-hand
     pier, on the lane side. It rings an electric trill bell on the lodge
     wall, so it only works once the lodge has power.
   - At the front doors: a cast-iron bell pull on the porch wall. It needs
     no power: a wire runs from it through the walls to a bell on its spring
     on the kitchen board. The first time you pull it, somebody answers.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

function trill(A, v, when) {          // an electric bell: the hammer hammering the gong
  if (!A || !A.tone) return;
  for (let i = 0; i < 22; i++) A.tone('square', 1320, 1260, 0.04 * v, 0.002, 0.04, (when || 0) + i * 0.055);
  A.bell && A.bell(1320, 0.05 * v, (when || 0) + 1.2, 1.2);
}
function jangle(A, v) {               // a sprung house bell on the end of a wire
  if (!A || !A.bell) return;
  for (let k = 0; k < 12; k++) A.bell(1560 + (k % 3) * 90, v * (1 - k * 0.06), k * 0.13, 0.7);
}

BM.buildDoorbells = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  /* ---- the gate bell ---- */
  const gx = 3.8, gz = 88.42;
  B.box('brass', gx, 1.35, gz, 0.14, 0.2, 0.02);
  B.mesh(G.cyl, 'porcelain', gx, 1.38, gz + 0.015, 0.05, 0.02, 0.05).rotation.x = Math.PI / 2;
  B.mesh(G.plane, BM.labelMat('LODGE', { w: 128, h: 40, size: 22, bg: '#8a7034', fg: '#2a1e0a' }), gx, 1.29, gz + 0.012, 0.1, 0.03, 1);
  // the bell itself, on the lodge wall inside, by the door
  B.room = 'lodge';
  B.mesh(G.sphere, 'brass', -8.6, 2.3, 87.72, 0.16, 0.16, 0.08); B.box('metalDark', -8.6, 2.12, 87.75, 0.08, 0.1, 0.04);
  B.room = 'grounds';
  B.interactable({
    id: 'gate-bell', label: 'Ring the bell', pos: [gx, 1.38, gz + 0.02], n: [0, 1], approachDist: 0.8,
    act: g => {
      g.audio.click();
      if (!g.grid.lodge) { g.ui.say('You press the button. Nothing — not even a click. Whatever it rang, it rang on electricity.', 4); return; }
      const p = g.player, d = Math.hypot(p.x + 8.6, p.z - 87.7);
      trill(g.audio, Math.max(0.25, 1 - d / 25));
      g.story.gateBellRung = (g.story.gateBellRung || 0) + 1;
      g.ui.say(g.story.gateBellRung === 1 ? 'Inside the lodge a bell goes off like a fire alarm, loud and long. When it stops, nobody comes. Nobody has come to that bell for fifty years.' : 'The lodge bell shrills again. Nobody comes.', 5);
    },
  });

  /* ---- the front door bell pull ---- */
  B.room = 'porch';
  const px = -1.62, py = 1.45, pz = 12.24;
  B.box('iron', px, py, pz + 0.01, 0.16, 0.34, 0.03);                                      // the backplate
  for (const dy of [-0.13, 0.13]) B.mesh(G.sphere, 'iron', px, py + dy, pz + 0.03, 0.025, 0.025, 0.02);
  const pull = new THREE.Group(); pull.position.set(px, py + 0.06, pz + 0.05); B.root.add(pull);
  B.box('iron', 0, -0.06, 0.02, 0.025, 0.14, 0.025, 0, pull);                             // the stem
  B.mesh(G.sphere, 'brass', 0, -0.15, 0.04, 0.07, 0.07, 0.07, 0, pull);                   // the knob
  pull.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
  B.mesh(G.plane, BM.labelMat('PULL', { w: 96, h: 32, size: 20, bg: '#2a2a2a', fg: '#c8b890' }), px, py + 0.13, pz + 0.03, 0.07, 0.024, 1);
  game.doorbell = { pull, t: 0 };
  B.interactable({
    id: 'door-bell', label: 'Pull the bell', pos: [px, py - 0.08, pz + 0.12], n: [0, 1], approachDist: 0.8,
    act: g => {
      g.doorbell.t = 1;
      jangle(g.audio, 0.14);
      const n = g.story.doorBellRung = (g.story.doorBellRung || 0) + 1;
      // the board in the kitchen: the bell nobody had a label for, the front door
      if (n === 1) {
        g.ui.say('The wire grates in the wall, and somewhere deep in the house a bell jangles on its spring — on and on, much too long.', 5);
        g.doorbell.answer = 4;
      } else g.ui.say(n === 2 ? 'The bell jangles again inside. The house listens.' : 'The bell jangles in the empty kitchen.', 4);
    },
  });
  B.room = 'grounds';
};

BM.updateDoorbells = function (game, dt) {
  const D = game.doorbell; if (!D) return;
  if (D.t > 0) { D.t = Math.max(0, D.t - dt * 2.5); D.pull.position.z = 12.29 + D.t * 0.12; }
  // the first time: an answer from inside — slow footsteps across the hall, to the doors, then nothing
  if (D.answer > 0) {
    D.answer -= dt; const A = game.audio;
    if (D.answer <= 0) {
      D.answer = 0;
      if (A && A.step) for (let i = 0; i < 7; i++) setTimeout(() => A.step('wood'), i * 620);
      if (A && A.latch) setTimeout(() => A.latch(0.5), 7 * 620 + 400);
      game.ui.say('Footsteps. Slow, on bare boards, crossing the hall towards you on the other side of the doors. They stop just behind them. The latch moves — once. Then nothing at all.', 8);
    }
  }
};
})();
