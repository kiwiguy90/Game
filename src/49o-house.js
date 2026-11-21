/* ==========================================================================
   BLACKTHORN MANOR — 6w. ELEANOR'S ROOM, AND THE BELLS
   - Eleanor's room: the west end of the attic, boarded off round the
     chimney into a room of her own: a narrow bed, a washstand, the desk
     where her journal is, one bare bulb. Her drawings pinned to the boards.
     On the chimney breast, the days, counted in fives.
   - The bell board: high on the kitchen wall, a row of brass bells on
     springs, one for each room, that rang down here when someone pulled a
     cord upstairs. Nobody is upstairs. Now and then one rings anyway. One
     label has been painted over.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* a child's drawing in crayon: the house with every window lit, the gates shut, a girl outside them */
function drawing(kind) {
  const c = document.createElement('canvas'); c.width = 192; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#e8dfc8'; g.fillRect(0, 0, 192, 256);
  g.globalAlpha = 0.85; g.lineWidth = 4; g.lineCap = 'round';
  const scrib = (col, pts) => { g.strokeStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  if (kind === 0) {           // the house, every window yellow
    g.fillStyle = '#6a6a72'; g.fillRect(30, 90, 132, 100);
    scrib('#3a3a40', [[24, 92], [96, 40], [168, 92]]);
    g.fillStyle = '#f0c020'; for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) g.fillRect(42 + k * 30, 102 + r * 30, 16, 18);
    g.fillStyle = '#1a1a20'; g.font = '20px serif'; g.fillText('ALL ON', 60, 230);
  } else if (kind === 1) {    // the gates, shut, and a small figure on the wrong side of them
    for (let i = 0; i < 9; i++) scrib('#202020', [[30 + i * 16, 80], [30 + i * 16, 200]]);
    scrib('#202020', [[24, 82], [170, 82]]); scrib('#202020', [[24, 140], [170, 140]]);
    scrib('#c03020', [[96, 150], [96, 196]]); g.fillStyle = '#c03020'; g.beginPath(); g.arc(96, 140, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1a20'; g.font = '18px serif'; g.fillText('ME', 84, 232);
  } else {                    // a road going away, and a train
    scrib('#5a4a30', [[96, 60], [40, 240]]); scrib('#5a4a30', [[96, 60], [152, 240]]);
    g.fillStyle = '#2a5a2a'; g.fillRect(20, 40, 150, 14);
    g.fillStyle = '#802020'; g.fillRect(40, 30, 50, 22); g.fillRect(96, 34, 34, 18);
    g.fillStyle = '#1a1a20'; g.font = '16px serif'; g.fillText('LONDON', 64, 26);
  }
  return new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) });
}
function tallies() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 256, 384);
  g.strokeStyle = 'rgba(235,225,200,0.75)'; g.lineWidth = 1.6;
  const rnd = BM.mulberry32(1961);
  for (let row = 0; row < 30; row++) for (let k = 0; k < 11; k++) {
    if (row === 29 && k > 4) break;
    const x = 6 + k * 23 + rnd() * 2, y = 6 + row * 12.6;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + i * 3.6, y); g.lineTo(x + i * 3.6 + rnd() - 0.5, y + 9); g.stroke(); }
    g.beginPath(); g.moveTo(x - 2, y + 7); g.lineTo(x + 14, y + 2); g.stroke();
  }
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, color: 0x9a9080 });
}

BM.buildHouseTouches = function (B, game) {
  const P = B.phys;
  /* ======================= ELEANOR'S ROOM ======================= */
  B.zone = 'mansion'; B.levelName = 'attic'; B.room = "eleanor's attic";
  const Y = 8.2, X0 = -17.8, XP = -7.5, ZN = -4.2, ZS = 2.7, TOP = 10.65;   // (the front gable's roof comes down into the attic just south of here)
  const BOARD = { t: 0.08, mat: 'boards', y0: Y, y1: TOP };
  B.wall('x', ZS, X0, XP, BOARD);
  B.wall('x', ZN, X0, XP, BOARD);
  B.wall('z', XP, ZN, ZS, BOARD, [{ at: 1.6, w: 1.0, type: 'door', head: 2.0, id: 'd-eleanor-attic' }]);
  B.boxE('darkWood', XP - 0.06, XP + 0.06, TOP - 0.02, TOP + 0.05, ZN, ZS);
  game.eleanorDoor = B.hingedDoor({ id: 'd-eleanor-attic', axis: 'z', at: 1.6, c: XP, w: 1.0, h: 2.0, y0: Y, hinge: 'low', swing: 1, outside: 1, mat: 'boards', panelMat: 'boards', dur: 1.5, sound: 'creak', label: "the door of Eleanor's room", wallT: 0.08 });
  { const d = game.eleanorDoor; d.t = 1; d.open = d.opened = true; d.target = 1; d.wall.enabled = false; d.angle(d.maxAngle); }   // left open, the way she never could
  // a bolt on the OUTSIDE of her door
  B.boxE('iron', XP + 0.05, XP + 0.08, Y + 1.25, Y + 1.31, 0.95, 1.25); B.boxE('iron', XP + 0.05, XP + 0.09, Y + 1.22, Y + 1.34, 0.92, 1.0);
  B.furniture('fabricCream', -16.9, 1.15, Y, 0.9, 0.55, 2.0, 'narrow bed');
  B.furniture('wood', -17.4, -1.0, Y, 0.5, 0.8, 0.9, 'washstand');
  B.mesh(G.sphere, 'porcelain', -17.4, Y + 0.86, -1.0, 0.4, 0.1, 0.4);
  B.mesh(G.sphere, 'porcelain', -17.45, Y + 1.0, -1.25, 0.14, 0.26, 0.14);
  B.furniture('wood', -15.2, -1.7, Y, 0.45, 0.9, 0.45, 'chair');
  B.box('fabricRed', -14.2, Y + 0.012, 0.4, 2.2, 0.01, 1.4);
  // her drawings, pinned to the boards
  for (const [i, x] of [[0, -15.2], [1, -13.9], [2, -12.6]]) B.mesh(G.plane, drawing(i), x, Y + 1.55, ZS - 0.05, 0.42, 0.56, 1, Math.PI);
  B.readable('attic-drawings', 'Drawings pinned to the boards', 'Crayon drawings, pinned up with dressmaker\'s pins, the paper gone soft and brown.\n\nThe house, with every single window coloured in yellow. Across the bottom: ALL ON.\n\nThe gates, black bars, shut, and a small red figure on the inside of them. ME.\n\nA road going away between two lines of trees to a green train. LONDON.\n\nThe last one is much later, in pencil, and better: the same road. There is nobody on it.', [-13.9, Y + 1.2, ZS - 0.06], [0, -1], { visual: false });
  // the days, on the chimney breast
  B.mesh(G.plane, tallies(), -10.62, Y + 1.25, 0, 1.15, 1.75, 1, -Math.PI / 2).renderOrder = 3;
  B.readable('attic-tally', 'Marks on the chimney breast', 'Scratched into the plaster of the chimney breast with something sharp — a hairpin, perhaps — row after row of marks in fives.\n\nYou start to count them and stop. Hundreds. Thousands. At the bottom the rows go ragged, and the last group of five is not finished.\n\nThirteen years of days, more or less. You do the sum in your head and wish you had not.', [-10.65, Y + 1.0, 0], [-1, 0], { visual: false });
  // one bare bulb, on its own switch inside the door
  B.fixture({ id: 'eleanor-attic-bulb', name: "Eleanor's bulb", circuit: 'attic', style: 'cage', pos: [-13.0, 10.1, 0.4], colour: 0xffc070, target: 0.9, range: 7 });
  B.lightSwitch('sw-eleanor-attic', "Eleanor's room light", [XP - 0.06, Y + 1.4, 0.6], [-1, 0], ['eleanor-attic-bulb']);

  /* the two front gables come down into the attic: board them off as low eaves box-rooms */
  B.room = 'attic';
  const EAV = { t: 0.08, mat: 'boards', y0: Y, y1: 10.7 };
  B.wall('x', ZS, XP, -6.9, EAV); B.wall('z', -6.9, ZS, 6.2, EAV);
  B.wall('x', 3.6, 6.9, 15.3, EAV); B.wall('z', 6.9, 3.6, 6.2, EAV); B.wall('z', 15.3, 3.6, 6.2, EAV);
  B.box('darkWood', 11.1, Y + 0.9, 3.55, 0.7, 1.2, 0.04); B.box('iron', 11.38, Y + 0.95, 3.52, 0.03, 0.12, 0.02);   // a low cupboard door into the eaves, nailed shut
  for (const x of [10.85, 11.35]) B.box('iron', x, Y + 1.3, 3.52, 0.25, 0.03, 0.02);

  /* ======================= THE BELL BOARD ======================= */
  B.levelName = 'ground'; B.room = 'kitchen';
  const BX = -6.14, BZ = -9.6, BY = 2.95;
  B.boxE('darkWood', BX - 0.06, BX, BY - 0.62, BY + 0.62, BZ - 0.85, BZ + 0.85);
  B.boxE('gilt', BX - 0.08, BX - 0.05, BY + 0.55, BY + 0.6, BZ - 0.8, BZ + 0.8);
  const names = ['DINING', 'DRAWING', 'LIBRARY', 'NURSERY', 'BEDROOM 1', 'BEDROOM 2', 'GALLERY', 'ATTIC'];
  const bells = [];
  names.forEach((n, i) => {
    const row = Math.floor(i / 4), z = BZ - 0.6 + (i % 4) * 0.4, y = BY + 0.3 - row * 0.62;
    const pivot = new THREE.Group(); pivot.position.set(BX - 0.12, y + 0.12, z); B.root.add(pivot);
    B.box('iron', 0, -0.06, 0, 0.012, 0.12, 0.012, 0, pivot);                                  // the spring
    B.mesh(G.cone, 'brass', 0, -0.16, 0, 0.12, 0.12, 0.12, 0, pivot);                          // the bell
    B.mesh(G.sphere, 'brass', 0, -0.11, 0, 0.07, 0.05, 0.07, 0, pivot);
    pivot.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    const painted = n === 'ATTIC';
    B.mesh(G.plane, BM.labelMat(painted ? '' : n, { w: 192, h: 48, size: 22, bg: painted ? '#3a2a1a' : '#e0d4b0', fg: '#2a1e0a', border: '#5a4620' }), BX - 0.065, y - 0.14, z, 0.34, 0.085, 1, -Math.PI / 2);
    const flag = B.box(BM.Basic(0xb02018), BX - 0.075, y - 0.25, z, 0.01, 0.06, 0.06); flag.visible = false; flag.userData.dynamic = true;
    bells.push({ pivot, flag, name: n, t: 0, painted });
  });
  B.readable('bell-board', 'The bell board', 'A board of brass bells on curled springs, high on the kitchen wall. A wire runs up from each one into the house; when somebody pulled a cord upstairs, the bell for that room jangled down here, and a little red flag dropped to show which.\n\nDINING · DRAWING · LIBRARY · NURSERY · BEDROOM 1 · BEDROOM 2 · GALLERY\n\nThe eighth label has been painted over, brown, thickly, more than once. Under the paint, raised letters: ATTIC.\n\nThe wire to that bell has not been cut.', [BX - 0.1, 2.7, BZ - 0.9], [-1, 0], { visual: false });
  game.bellBoard = { bells, next: 50, atticRung: false, pos: { x: BX, y: BY, z: BZ } };
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
};

BM.ringBell = function (game, b) {
  b.t = 2.6; b.flag.visible = true;
  const A = game.audio, p = game.player, d = Math.hypot(p.x - game.bellBoard.pos.x, p.z - game.bellBoard.pos.z);
  const v = Math.max(0.05, 1 - d / 18) * 0.16;
  if (A.bell) for (let k = 0; k < 9; k++) A.bell(1850 + (k % 3) * 70, v * (1 - k * 0.08), k * 0.11, 0.5);
};

BM.updateHouseTouches = function (game, dt, t) {
  const S = game.bellBoard; if (!S) return;
  const p = game.player, near = Math.hypot(p.x - S.pos.x, p.z - S.pos.z) < 14 && p.y > -1 && p.y < 4;
  for (const b of S.bells) {
    if (b.t > 0) { b.t -= dt; b.pivot.rotation.x = Math.sin(t * 34) * 0.45 * Math.min(1, b.t); if (b.t <= 0) b.pivot.rotation.x = 0; }
  }
  if (!near || game.headless) return;
  // once you have read her journal, the one nobody may ring, rings
  if (game.story.journalRead && !S.atticRung) {
    S.atticRung = true;
    BM.ringBell(game, S.bells.find(b => b.painted));
    game.ui.say('Up on the kitchen wall a bell jangles — on and on — and a little red flag drops. It is the one with the painted-out label. ATTIC.', 7);
    return;
  }
  S.next -= dt;
  if (S.next <= 0) {
    S.next = 45 + Math.random() * 60;
    const free = S.bells.filter(b => !b.painted);
    const b = free[Math.floor(Math.random() * free.length)];
    BM.ringBell(game, b);
    game.ui.say('Somewhere above you a cord is pulled. On the kitchen wall the ' + b.name.toLowerCase() + ' bell jangles on its spring.', 5);
  }
};
})();
