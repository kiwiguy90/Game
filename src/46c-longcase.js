/* ==========================================================================
   BLACKTHORN MANOR — 6c. THE LONGCASE CLOCK AND THE GARAGE DOOR
   The grandfather clock in the hall: a mahogany longcase on a plinth, a
   long trunk with a glazed door, brass weights and a pendulum behind the
   glass, and a hood with an arched brass dial, a painted moon in the arch,
   columns and finials. It was electrified in 1961 with the rest of the
   house: with the hall circuit live the pendulum swings, it ticks, and it
   chimes the Westminster quarters on its rods and strikes the hours.

   The garage has an up-and-over door: a steel panel that swings up into
   the roof on its springs, and down again with a bang.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const RATE = 4, QUARTER = 900;
const NOTES = { gs: 830.6, fs: 740.0, e: 659.3, b: 493.9 };          // rods, an octave over the tower bells
const PHRASES = [['gs', 'fs', 'e', 'b'], ['e', 'gs', 'fs', 'b'], ['e', 'fs', 'gs', 'e'], ['gs', 'e', 'fs', 'b'], ['b', 'fs', 'gs', 'e']];
const QUARTERS = { 1: [0], 2: [1, 2], 3: [3, 4, 0], 0: [1, 2, 3, 4] };

function dialMat() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d');
  // the brass dial plate with an arch over it
  g.fillStyle = '#a8843c'; g.fillRect(0, 64, 256, 256); g.beginPath(); g.arc(128, 70, 128, Math.PI, 0); g.fill();
  // the moon in the arch
  const sky = g.createLinearGradient(0, 0, 0, 70); sky.addColorStop(0, '#203a6a'); sky.addColorStop(1, '#3a5a8a'); g.fillStyle = sky; g.beginPath(); g.arc(128, 74, 100, Math.PI, 0); g.fill();
  g.fillStyle = '#f2e6c0'; g.beginPath(); g.arc(128, 40, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c8b890'; for (const [x, y, r] of [[120, 34, 5], [136, 46, 4], [126, 50, 3]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) g.fillRect(40 + (i * 53) % 176, 18 + (i * 29) % 46, 2, 2);
  // the silvered chapter ring and its numerals
  g.fillStyle = '#e4e0d4'; g.beginPath(); g.arc(128, 192, 118, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#a8843c'; g.beginPath(); g.arc(128, 192, 74, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d8d0b8'; g.beginPath(); g.arc(128, 192, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1a1612'; g.font = 'bold 22px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(128 + Math.cos(a) * 96, 192 + Math.sin(a) * 96); g.rotate(a + Math.PI / 2); g.fillText(R[i], 0, 0); g.restore(); }
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; g.fillRect(128 + Math.cos(a) * 113 - 1, 192 + Math.sin(a) * 113 - 1, 2, 2); }
  g.font = 'italic 13px serif'; g.fillText('Jno. Blackthorn', 128, 226); g.fillText('Lichfield', 128, 242);
  // spandrels in the corners
  g.fillStyle = '#c8a050'; for (const [x, y] of [[14, 84], [242, 84], [14, 306], [242, 306]]) { g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  return new THREE.MeshPhongMaterial({ map: t, shininess: 40, specular: 0x332211 });
}

BM.buildLongcase = function (B, game) {
  const P = B.phys;
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'hall';
  const x = -5.6, z = 8.4;                        // against the west wall of the hall, facing east
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; B.root.add(g);  // local +z faces the room
  const box = (mat, X, Y, Z, sx, sy, sz) => B.box(mat, X, Y, Z, sx, sy, sz, 0, g);
  const wood = 'darkWood';
  P.addWall(x - 0.3, x + 0.3, z - 0.32, z + 0.32, 0, 2.5, { kind: 'furniture', tag: 'grandfather clock' });
  // plinth and base
  box(wood, 0, 0.06, 0, 0.6, 0.12, 0.4); box(wood, 0, 0.36, 0, 0.56, 0.5, 0.36); box('gilt', 0, 0.62, 0.0, 0.58, 0.03, 0.38);
  box(wood, 0, 0.4, 0.185, 0.4, 0.34, 0.01);                                             // a raised panel
  // the trunk, narrower, with a long door: glass in a moulded frame
  box(wood, 0, 1.15, -0.02, 0.44, 1.0, 0.3);
  box(wood, 0, 0.66, 0, 0.5, 0.06, 0.34); box(wood, 0, 1.66, 0, 0.5, 0.06, 0.34);
  for (const sx of [-1, 1]) box(wood, sx * 0.17, 1.15, 0.135, 0.06, 0.94, 0.02);
  box(wood, 0, 0.72, 0.135, 0.34, 0.06, 0.02); box(wood, 0, 1.6, 0.135, 0.34, 0.06, 0.02);
  box('darkGlass', 0, 1.16, 0.12, 0.28, 0.82, 0.01).material = new THREE.MeshPhongMaterial({ color: 0x0a0806, transparent: true, opacity: 0.35, shininess: 120, specular: 0x666666 });
  box('brass', 0.15, 1.17, 0.14, 0.02, 0.05, 0.02);                                       // the key escutcheon
  // inside: two brass weights on their chains, and the pendulum
  for (const sx of [-0.07, 0.07]) { B.mesh(G.cyl, 'brass', sx, 1.22, 0.02, 0.07, 0.3, 0.07, 0, g); B.mesh(G.post, 'black', sx, 1.52, 0.02, 0.006, 0.3, 0.006, 0, g); }
  const pend = new THREE.Group(); pend.position.set(0, 1.62, 0.05); g.add(pend);
  B.box('brass', 0, -0.4, 0, 0.012, 0.8, 0.006, 0, pend);
  B.mesh(G.cyl, 'brass', 0, -0.8, 0, 0.16, 0.012, 0.16, 0, pend).rotation.x = Math.PI / 2; pend.children[pend.children.length - 1].updateMatrix();
  pend.userData.dynamic = true; pend.traverse(o => { o.userData.dynamic = true; });
  // the hood: a box with a glazed door over the dial, columns, a swan-neck pediment and finials
  box(wood, 0, 2.0, 0, 0.56, 0.62, 0.38);
  for (const sx of [-1, 1]) { B.mesh(G.cyl, 'darkWood', sx * 0.25, 1.98, 0.17, 0.04, 0.54, 0.04, 0, g); B.mesh(G.cyl, 'brass', sx * 0.25, 2.27, 0.17, 0.05, 0.03, 0.05, 0, g); B.mesh(G.cyl, 'brass', sx * 0.25, 1.7, 0.17, 0.05, 0.03, 0.05, 0, g); }
  const dial = B.mesh(G.plane, dialMat(), 0, 2.02, 0.193, 0.4, 0.5, 1, 0, g);
  box(wood, 0, 2.36, 0, 0.62, 0.08, 0.42);
  for (const sx of [-1, 1]) { const sw = B.box(wood, sx * 0.13, 2.47, 0.04, 0.26, 0.06, 0.34, 0, g); sw.rotation.set(0, 0, -sx * 0.45); sw.updateMatrix(); B.mesh(G.sphere, 'brass', sx * 0.27, 2.47, 0.04, 0.07, 0.07, 0.07, 0, g); }
  B.mesh(G.cone, 'brass', 0, 2.56, 0.04, 0.06, 0.16, 0.06, 0, g);
  // the hands, over the chapter ring (centre at 2/3 down the dial)
  const hands = [0.085, 0.12].map((len, i) => {
    const pv = new THREE.Group(); pv.position.set(0, 2.02 - 0.25 + 0.4 * 0.6 * (192 / 320) * 0 + 0.025, 0.2); g.add(pv);
    B.box('black', 0, len / 2, 0, i ? 0.008 : 0.014, len, 0.004, 0, pv);
    pv.userData.dynamic = true; pv.matrixAutoUpdate = true; pv.traverse(o => { o.userData.dynamic = true; });
    return pv;
  });
  // place the hands on the dial's centre: the chapter ring sits at (128,192) of a 256x320 canvas
  for (const h of hands) h.position.y = 2.02 + 0.25 - 0.5 * (192 / 320);
  void dial;
  game.longcase = { g, pend, hands, time: (23 * 3600 + 47 * 60 + 30), running: false, quarter: 0, tickT: 0, tock: false, chimes: 0, pos: { x: x + 0.3, y: 1.8, z } };
  game.longcase.quarter = Math.floor(game.longcase.time / QUARTER);
  B.readable('longcase', 'The grandfather clock', 'A longcase clock in a mahogany case, its brass dial signed "Jno. Blackthorn, Lichfield". A moon rides in the arch over the dial.\n\nInside the trunk door a card is pinned:\n\n"Converted to electric winding, Pardoe & Son, November 1961. DO NOT WIND BY HAND."\n\nThe hands stand at thirteen minutes to twelve. It was always kept a few minutes fast, so that nobody in this house was ever late for anything.', [x + 0.33, 1.3, z], [1, 0], { visual: false }); // the card is on the trunk door itself

  /* ---------------- the garage door ---------------- */
  B.zone = 'exterior'; B.room = 'garage';
  const D = { x: 30, z: 8, w: 4.9, h: 2.58 };
  const pivot = new THREE.Group(); pivot.position.set(D.x, D.h, D.z + 0.02); B.root.add(pivot);
  B.box('garageGreen', 0, -D.h / 2, 0, D.w, D.h, 0.05, 0, pivot);
  for (let k = 1; k < 12; k++) B.box('garageGreen', -D.w / 2 + k * D.w / 12, -D.h / 2, 0.035, 0.05, D.h - 0.1, 0.02, 0, pivot); // the pressed ribs
  B.box('chrome', 0, -D.h + 0.35, 0.06, 0.24, 0.05, 0.04, 0, pivot);                                                            // the handle
  B.box('black', 0, -D.h + 0.32, 0.05, 0.05, 0.05, 0.02, 0, pivot);
  pivot.traverse(o => { o.userData.dynamic = true; }); pivot.matrixAutoUpdate = true;
  for (const sx of [-1, 1]) B.box('metalDark', D.x + sx * (D.w / 2 + 0.03), D.h - 0.05, D.z - 1.2, 0.04, 0.05, 2.4);           // the runners inside
  const wall = P.addWall(D.x - D.w / 2, D.x + D.w / 2, D.z - 0.15, D.z + 0.15, 0, D.h, { kind: 'door', tag: 'garage-door', enabled: false });
  const gd = game.garageDoor = { pivot, wall, open: true, t: 1, moving: false };
  const act = g2 => g2.toggleGarageDoor();
  B.interactable({ id: 'garage-door-out', label: () => gd.open ? 'Pull the garage door down' : 'Lift the garage door', pos: [D.x + 1.6, 1.0, D.z + 0.1], n: [0, 1], act });
  B.interactable({ id: 'garage-door-in', label: () => gd.open ? 'Pull the garage door down' : 'Lift the garage door', pos: [D.x - 1.6, 1.0, D.z - 0.1], n: [0, -1], act });
};

BM.updateLongcase = function (game, dt) {
  const c = game.longcase, A = game.audio, p = game.player;
  if (c) {
    const was = c.running; c.running = game.grid.live('hall');
    if (c.running && !was) A.clunk && A.clunk(0.25);
    const d = Math.hypot(c.pos.x - p.x, c.pos.y - p.y - 1.6, c.pos.z - p.z), inHouse = p.y > -1 && p.y < 9 && Math.abs(p.x) < 18.5 && Math.abs(p.z) < 12.5;
    const hear = inHouse ? Math.max(0.05, 1 - d / 30) : Math.max(0, 0.2 - d / 120);
    if (c.running) {
      c.time += dt * RATE;
      const q = Math.floor(c.time / QUARTER);
      // a few minutes fast on the tower, as these clocks always are; and never over the top of it
      if (q !== c.quarter && !(game.chimeBusyUntil > game.time)) {
        c.quarter = q; const quarter = q % 4, hour = Math.floor(c.time / 3600) % 12 || 12;
        let when = 0.2;
        for (const ph of QUARTERS[quarter]) { for (const n of PHRASES[ph]) { A.bell && A.bell(NOTES[n], 0.22 * hear, when, 1.8); when += 0.6; } when += 0.35; }
        if (quarter === 0) { when += 1.0; for (let i = 0; i < hour; i++) { A.bell && A.bell(NOTES.b / 2, 0.35 * hear, when, 3.0); when += 1.6; } }
        c.chimes++; game.chimeBusyUntil = game.time + when + 2.5;
        if (c.chimes === 1 && hear > 0.3) game.ui.say('In the hall the grandfather clock whirs, and chimes the quarter on its rods.', 4);
      }
      c.tickT += dt;
      if (c.tickT >= 1.0) { c.tickT -= 1.0; c.tock = !c.tock; if (d < 9 && A.tick) A.tick(Math.max(0, 1 - d / 9) * 0.25, c.tock); }
      c.pend.rotation.z = Math.sin(game.time * Math.PI) * 0.07;
    } else c.pend.rotation.z *= 1 - Math.min(1, dt * 2);
    c.pend.updateMatrix();
    const t = c.time % 43200;
    c.hands[0].rotation.z = -(t / 43200) * Math.PI * 2;
    c.hands[1].rotation.z = -((t % 3600) / 3600) * Math.PI * 2;
  }
  const gd = game.garageDoor;
  if (gd && gd.moving) {
    gd.t += (gd.open ? 1 : -1) * dt / (gd.open ? 1.6 : 1.1);
    if (gd.t >= 1 || gd.t <= 0) { gd.t = Math.max(0, Math.min(1, gd.t)); gd.moving = false; if (!gd.open && A.gateBang) A.gateBang(0.35); }
    gd.wall.enabled = gd.t < 0.85;
  }
  if (gd) { const e = gd.t * gd.t * (3 - 2 * gd.t); gd.pivot.rotation.x = e * Math.PI / 2; gd.pivot.position.z = 8.02 - e * 0.9; }
};
})();
