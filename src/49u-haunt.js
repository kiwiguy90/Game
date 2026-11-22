/* ==========================================================================
   BLACKTHORN MANOR — 6zc. THE HOUSE PUTS ITSELF BACK
   Once the house has power, every few minutes, somewhere you are not, the
   house undoes something you did:
   - a room you lit goes dark again: the switch is found down, the lights off;
   - a door you left open is found shut;
   - or, when there is nothing to undo, footsteps cross the floor above you.
   You find out when you come back. Never in front of you; never too often.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const FIRST = 240, GAP = [180, 360], MAX = 8;

BM.buildHaunt = function (B, game) {
  game.haunt = { next: FIRST, events: 0, pending: [] };
};

function quietly(game, fn) {
  const A = game.audio, ui = game.ui, click = A.click, say = ui.say;
  A.click = () => {}; ui.say = () => {};
  try { fn(); } finally { A.click = click; ui.say = say; }
}
const label = it => (typeof it.label === 'function' ? it.label() : it.label || '').replace(/ light panel$| lights$| light$/i, '').toLowerCase();

BM.updateHaunt = function (game, dt) {
  const H = game.haunt; if (!H) return;
  if (game.headless && !game.hauntTest) return;
  if (game.intro || game.outro || game.story.ended || game.ui.mode === 'title') return;
  const p = game.player, grid = game.grid;
  // finding what was undone
  for (let i = H.pending.length - 1; i >= 0; i--) {
    const e = H.pending[i];
    if (Math.hypot(p.x - e.x, p.z - e.z) < 5 && Math.abs(p.y - e.y) < 2.5) {
      H.pending.splice(i, 1);
      game.ui.say(e.kind === 'light' ? 'The ' + e.name + ' is dark. You left the lights on in here. The switch is down.' : 'This door is shut. You left it open — you are sure you left it open.', 6);
    }
  }
  if (!grid.live('main') || H.events >= MAX) return;
  H.next -= dt;
  if (H.next > 0) return;
  H.next = GAP[0] + Math.random() * (GAP[1] - GAP[0]);
  const far = (x, y, z, d) => Math.hypot(p.x - x, p.z - z) > d || Math.abs(p.y - y) > 3;
  // a lit room, somewhere you are not
  const lit = game.interactables.filter(it => it.switchVisual && it.leverOn && it.zone === 'mansion' && far(it.pos.x, it.pos.y, it.pos.z, 13)
    && (it.controls || []).some(id => { const l = grid.light(id); return l && l.on && !l.dead; }));
  // a door you opened, somewhere you are not
  const doors = (game.B.doors || []).filter(d => d.open && !d.moving && d !== game.frontDoors && far(d.axis === 'x' ? d.at : d.c, d.y0 + 1, d.axis === 'x' ? d.c : d.at, 15) && !game.inDoorway(d));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  if (lit.length && (Math.random() < 0.6 || !doors.length)) {
    const it = pick(lit);
    quietly(game, () => it.act(game));
    H.pending.push({ kind: 'light', x: it.pos.x, y: it.pos.y - 1.4, z: it.pos.z, name: label(it) || 'room' }); H.events++;
  } else if (doors.length) {
    const d = pick(doors);
    game.toggleDoor(d);
    H.pending.push({ kind: 'door', x: d.axis === 'x' ? d.at : d.c, y: d.y0, z: d.axis === 'x' ? d.c : d.at }); H.events++;
  } else if (p.y > -1 && p.y < 3.5 && Math.abs(p.x) < 18 && Math.abs(p.z) < 12) {
    const A = game.audio;
    if (A.step) for (let i = 0; i < 7; i++) setTimeout(() => A.step('wood'), 400 + i * 560);
    game.ui.say('Footsteps cross the floor over your head, slow and heavy. They stop right above you.', 6); H.events++;
  }
};
})();
