/* ==========================================================================
   BLACKTHORN MANOR — 6k. WINDOWS AND CURTAINS
   Every sash window in the house and the lodge opens: the lower sash
   slides up, and the rain and the wind come in. Every window has a pair of
   curtains on a pole under a pelmet, drawn or open; about half the rooms
   are found with the curtains drawn, the way the family left them, so
   those rooms are darker until you open them.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const DRAWN_ROOMS = new Set(['dining', 'drawing', 'bedroom1', "eleanor's sitting room", "eleanor's bedroom", 'nursery', 'library', 'back sitting']);
const NO_CURTAINS = new Set(['kitchen', 'pantry', 'bathroom', 'service', 'attic', 'linen', 'garage', 'shed', 'clock room', 'belfry', 'clock tower']);

BM.buildWindows = function (B, game) {
  const P = B.phys;
  game.openWindows = [];
  let made = 0, curtained = 0;
  // an interactable in front of a window needs somewhere to stand: the first clear spot out from the wall
  const place = (it, floorY) => {
    for (const d of [0.9, 1.15, 1.4, 1.65, 1.9]) {
      const x = it.pos.x + it.n.x * d, z = it.pos.z + it.n.z * d;
      const sup = P.support(x, z, floorY + 0.3);
      if (!isFinite(sup) || Math.abs(sup - floorY) > 0.3 || P.blocked(x, z, sup)) continue;
      it.approachDist = d; it.approach = { x, y: sup, z }; it.floorY = sup; return true;
    }
    B.interactables.splice(B.interactables.indexOf(it), 1);
    return false;
  };
  for (const w of B.windows) {
    if (w.zone !== 'mansion' && w.room !== 'lodge') continue;
    const inx = -w.nx, inz = -w.nz, tx = w.nz, tz = -w.nx, ry = Math.atan2(w.nx, w.nz);
    if (w.zone === 'mansion') { const r = BM.roomOfPoint(w.x + inx * 0.7, w.y, w.z + inz * 0.7); if (!r) continue; w.room = r; }
    if (w.room === 'attic' || w.room === 'clock room' || w.room === 'belfry') continue;
    if (w.id === 'w-kitchen-w') continue; // the range stands in front of it
    const floorY = w.y > 7.5 ? 8.2 : w.y > 3.5 ? 4.2 : 0;
    B.zone = w.zone; B.levelName = floorY > 7 ? 'attic' : floorY > 3 ? 'upper' : 'ground'; B.room = w.room;
    // the sash
    B.interactable({
      id: 'win:' + w.id, kind: 'control', label: () => w.open ? 'Close the window' : 'Open the window',
      pos: [w.x + inx * 0.22, w.sill + 0.55, w.z + inz * 0.22], n: [inx, inz], approachDist: 0.9, reach: 2.2,
      act: g => g.toggleWindow(w),
    });
    if (!place(B.interactables[B.interactables.length - 1], floorY)) continue;
    made++;
    if (NO_CURTAINS.has(w.room)) continue;
    // the curtains: a pole on brackets, a pelmet, and two panels that stretch to meet in the middle
    const px = w.x + inx * 0.32, pz = w.z + inz * 0.32, top = w.head + 0.3, bottom = w.sill - 0.6, H = top - bottom;
    const poleLen = w.w + 1.2;
    const pole = B.box('brass', px, top - 0.02, pz, poleLen, 0.035, 0.035, ry); pole.rotation.y = ry; pole.updateMatrix();
    for (const e of [-1, 1]) B.mesh(G.sphere, 'brass', px + tx * e * poleLen / 2, top - 0.02, pz + tz * e * poleLen / 2, 0.05);
    B.box('drape', px, top + 0.1, pz, w.w + 1.0, 0.26, 0.16, ry);
    const panels = [-1, 1].map(e => {
      const g = new THREE.Group(); g.position.set(px + tx * e * (w.w / 2 + 0.55), (top + bottom) / 2, pz + tz * e * (w.w / 2 + 0.55)); g.rotation.y = ry; B.root.add(g);
      // the panel's fixed edge is at the group's origin; it extends towards the window's centre
      B.box('drape', -e * 0.5, 0, 0, 1.0, H - 0.1, 0.09, 0, g);
      for (let k = 0; k < 5; k++) B.box('drape', -e * (0.1 + k * 0.2), 0, 0.055, 0.07, H - 0.2, 0.03, 0, g); // folds
      g.traverse(m => { m.userData.dynamic = true; });
      return { g, e };
    });
    const drawn = DRAWN_ROOMS.has(w.room) && (made % 3 !== 0);
    w.curtains = { panels, drawn, t: drawn ? 1 : 0, target: drawn ? 1 : 0, closedW: w.w / 2 + 0.6, openW: 0.42 };
    for (const p of panels) p.g.scale.x = drawn ? w.curtains.closedW : w.curtains.openW;
    const side = (made % 2) ? -1 : 1;
    B.interactable({
      id: 'curtain:' + w.id, kind: 'control', label: () => w.curtains.drawn ? 'Open the curtains' : 'Draw the curtains',
      pos: [px + tx * side * (w.w / 2 + 0.45), w.sill + 0.9, pz + tz * side * (w.w / 2 + 0.45)], n: [inx, inz], approachDist: 0.9, reach: 2.2,
      act: g => g.toggleCurtains(w),
    });
    if (!place(B.interactables[B.interactables.length - 1], floorY)) {
      const it2 = B.interactable({ id: 'curtain:' + w.id, kind: 'control', label: () => w.curtains.drawn ? 'Open the curtains' : 'Draw the curtains', pos: [px - tx * side * (w.w / 2 + 0.45), w.sill + 0.9, pz - tz * side * (w.w / 2 + 0.45)], n: [inx, inz], approachDist: 0.9, reach: 2.2, act: g => g.toggleCurtains(w) });
      place(it2, floorY);
    }
    curtained++;
  }
  game.windowCounts = { sashes: made, curtained };
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'house';
};

/* per-frame: sashes slide, curtains draw */
BM.updateWindows = function (game, dt) {
  for (const w of game.B.windows) {
    if (!w.sash) continue;
    const want = w.open ? 1 : 0;
    if (w.sashT !== want) { w.sashT += (want > w.sashT ? 1 : -1) * dt / 1.1; w.sashT = Math.max(0, Math.min(1, w.sashT)); w.sash.position.y = w.sill + w.sashT * (w.h / 2 - 0.12); }
    const c = w.curtains;
    if (c && c.t !== c.target) {
      c.t += (c.target > c.t ? 1 : -1) * dt / 1.3; c.t = Math.max(0, Math.min(1, c.t));
      const e = (1 - Math.cos(c.t * Math.PI)) / 2;
      for (const p of c.panels) p.g.scale.x = c.openW + (c.closedW - c.openW) * e;
    }
  }
};
})();
