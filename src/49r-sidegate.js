/* ==========================================================================
   BLACKTHORN MANOR — 6z. THE SIDE GATE
   A narrow wrought-iron gate for people on foot, in the estate wall just
   east of the main gates, between two small piers. Its electric bolt is
   worked from the second (green) lever in the lodge's gate box. Released,
   it opens by hand from either side.

   It is wired into the same contact as the main gates: however you come in,
   once you are inside, both bolt from the house side, and only the gate
   motor in the cellar draws them. After that the lodge has them both back.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const SG = { x0: 5.4, x1: 6.6, z: 88, h: 2.1 };

BM.buildSideGate = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  const cx = (SG.x0 + SG.x1) / 2, w = SG.x1 - SG.x0;
  // two small piers with stone caps, an iron arch over the gap
  for (const x of [SG.x0 - 0.15, SG.x1 + 0.15]) {
    B.solid('stone', x - 0.15, x + 0.15, 0, 2.6, 87.75, 88.25, { kind: 'wall' });
    B.box('gothicTrim', x, 2.66, 88, 0.4, 0.12, 0.6); B.mesh(G.pyramid, 'stone', x, 2.86, 88, 0.3, 0.3, 0.3);
  }
  B.box('iron', cx, 2.55, 88, w + 0.3, 0.05, 0.05);
  for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI, x = cx - Math.cos(a) * w * 0.5; B.box('iron', x, 2.55 + Math.sin(a) * 0.32, 88, 0.05, 0.05, 0.05); }
  B.box('iron', cx, 2.87, 88, 0.05, 0.05, 0.05);
  // the leaf: a hinged door whose panels are swapped for iron bars and a scroll
  const door = B.hingedDoor({ id: 'side-gate-leaf', axis: 'x', at: cx, c: SG.z, w, h: SG.h, y0: 0, hinge: 'low', swing: 1, mat: 'iron', panelMat: 'iron', dur: 1.3, sound: 'creak', label: 'the side gate', wallT: 0.2, interact: false });
  const pivot = door.leaves[0].pivot;
  for (const c of [...pivot.children]) pivot.remove(c);
  const bar = (x, y, sx, sy) => { const m = B.box('iron', x, y, 0, sx, sy, 0.035, 0, pivot); m.userData.dynamic = true; };
  for (const y of [0.12, 1.0, SG.h - 0.06]) bar(w / 2, y, w - 0.04, 0.05);
  for (let i = 0; i < 9; i++) bar(0.06 + i * (w - 0.12) / 8, SG.h / 2, 0.03, SG.h - 0.08);
  for (let i = 0; i < 9; i++) { const s = B.mesh(G.cone, 'iron', 0.06 + i * (w - 0.12) / 8, SG.h + 0.06, 0, 0.05, 0.12, 0.05, 0, pivot); s.userData.dynamic = true; }
  { const r = B.mesh(G.ring, 'iron', w / 2, 1.42, 0.02, 0.36, 0.36, 0.36, 0, pivot); r.userData.dynamic = true; }   // a scroll in the middle
  { const k = B.mesh(G.sphere, 'brass', w - 0.1, 1.0, 0.04, 0.05, 0.05, 0.05, 0, pivot); k.userData.dynamic = true; }   // the latch
  B.box('metalDark', SG.x1 + 0.02, 1.0, 88.17, 0.1, 0.2, 0.06);                                  // the electric lock box on the pier
  const lamp = B.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0x401010 }), SG.x1 + 0.02, 1.16, 88.21, 0.04, 0.04, 0.04); lamp.userData.dynamic = true;
  B.doorways.push({ id: 'side-gate', x: cx, z: SG.z, y: 0, axis: 'x', width: w, thick: 0.4, zone: B.zone, room: B.room });
  game.sideGate = { door, locked: true, lamp };
  const act = g => {
    const s = g.sideGate;
    if (s.locked) { g.audio.rattle(); g.ui.say(g.gates.lockedIn ? 'The side gate rattles in its frame. The bolt is shot — from the house side, like the big gates.' : 'The side gate is locked: an electric bolt in the pier, with a dead red lamp. It is worked from the lodge.', 4); return; }
    g.toggleDoor(s.door);
  };
  const label = () => game.sideGate.locked ? 'Side gate: locked' : (game.sideGate.door.open ? 'Close the side gate' : 'Open the side gate');
  B.interactable({ id: 'side-gate', kind: 'door', label, pos: [cx + 0.3, 1.1, SG.z + 0.15], n: [0, 1], approachDist: 0.95, act });
  B.interactable({ id: 'side-gate-in', kind: 'door', label, pos: [cx + 0.3, 1.1, SG.z - 0.15], n: [0, -1], approachDist: 0.95, act });
};

BM.lockSideGate = function (game, lock) {
  const s = game.sideGate; if (!s) return;
  s.locked = lock;
  if (lock && (s.door.open || s.door.target)) game.toggleDoor(s.door);
};

/* the green lever in the lodge's gate box */
BM.sideGateLever = function (game) {
  const s = game.sideGate; if (!s) return;
  if (game.gates.lockedIn) { game.audio.click(); game.ui.say('The green lever goes down and springs back. Along the wall, nothing: the side gate is bolted from the house side too.', 5); return; }
  BM.lockSideGate(game, !s.locked);
  game.audio.clunk(0.6);
  game.ui.say(s.locked ? 'Green lever up. Along the wall, the side gate\'s bolt shoots home.' : 'Green lever down. Along the wall by the gates, a smaller bolt draws back with a clack: the side gate.', 4);
};

/* every frame: the bolt's lamp, and the contact for anyone who comes in by the side gate while the big gates are shut */
BM.updateSideGate = function (game) {
  const s = game.sideGate; if (!s) return;
  s.lamp.material.color.setHex(game.grid.lodge ? (s.locked ? 0xd02010 : 0x20c030) : 0x401010);
  const g = game.gates, p = game.player;
  const inside = p.z < 85 && p.z > 50 && p.y > -1 && !(p.x > -17.8 && p.x < -5.4 && p.z > 79.4);
  if (inside && !g.lockedIn && !g.escaping && !g.open && !g.closing && !game.story.ended && !s.locked) {
    g.lockedIn = true; BM.lockSideGate(game, true);
    game.audio.gateBang && game.audio.gateBang(0.4);
    game.ui.say('Behind you the side gate swings to on its own and a bolt shoots home — and another, heavier, in the big gates. Locked. From the house side.', 7);
  }
};
})();
