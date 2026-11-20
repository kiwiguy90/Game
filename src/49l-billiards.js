/* ==========================================================================
   BLACKTHORN MANOR — 6t. THE BILLIARD ROOM
   The east cellar was fitted out as a games room in the 1920s: panelled to
   the dado, a full-size table under a long three-shaded lamp, the cues in
   their rack, the marker board still showing the last game anybody played.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildBilliards = function (B, game) {
  B.zone = 'mansion'; B.levelName = 'cellar'; B.room = 'billiard room';
  const Y = -3.2, X0 = 6.1, X1 = 17.8, Z0 = -11.8, Z1 = 1.8;
  const TX = 12.2, TZ = -5.2, TW = 1.9, TL = 3.7, TH = 0.86;
  // the room: panelling to the dado round the walls, a rug, a ceiling of dark boards
  for (const [a, b, c, axis] of [[X0 + 0.02, X0 + 0.08, null, 'x0'], [X1 - 0.08, X1 - 0.02, null, 'x1']]) { void c; void axis;
    B.boxE('panel', a, b, Y, Y + 1.1, Z0 + 0.1, -1.0); B.boxE('darkWood', a - 0.01, b + 0.01, Y + 1.1, Y + 1.16, Z0 + 0.1, -1.0); }
  B.boxE('panel', X0 + 1.0, X1 - 0.1, Y, Y + 1.1, Z0 + 0.02, Z0 + 0.08); B.boxE('darkWood', X0 + 1.0, X1 - 0.1, Y + 1.1, Y + 1.16, Z0 + 0.01, Z0 + 0.09);
  B.box('carpet', TX, Y + 0.012, TZ, 6.4, 0.01, 4.8);
  // the table: a heavy mahogany body on six turned legs, green cloth, cushions, six leather pockets
  B.furniture(null, TX, TZ, Y, TW + 0.3, TH, TL + 0.3, 'billiard table');
  const felt = new THREE.MeshLambertMaterial({ color: 0x1f5a34 });
  B.boxE('darkWood', TX - TW / 2 - 0.15, TX + TW / 2 + 0.15, Y + TH - 0.3, Y + TH - 0.04, TZ - TL / 2 - 0.15, TZ + TL / 2 + 0.15);
  B.boxE(felt, TX - TW / 2, TX + TW / 2, Y + TH - 0.05, Y + TH - 0.02, TZ - TL / 2, TZ + TL / 2);
  for (const s of [-1, 1]) {
    B.boxE('darkWood', TX + s * (TW / 2 + 0.075) - 0.075, TX + s * (TW / 2 + 0.075) + 0.075, Y + TH - 0.04, Y + TH + 0.03, TZ - TL / 2 - 0.15, TZ + TL / 2 + 0.15);
    B.boxE('darkWood', TX - TW / 2 - 0.15, TX + TW / 2 + 0.15, Y + TH - 0.04, Y + TH + 0.03, TZ + s * (TL / 2 + 0.075) - 0.075, TZ + s * (TL / 2 + 0.075) + 0.075);
    B.boxE(felt, TX + s * (TW / 2 - 0.03) - 0.03, TX + s * (TW / 2 - 0.03) + 0.03, Y + TH - 0.03, Y + TH + 0.01, TZ - TL / 2, TZ + TL / 2);
    for (const l of [-1, 0, 1]) {
      B.mesh(G.cyl, 'darkWood', TX + s * (TW / 2 - 0.05), Y + 0.29, TZ + l * (TL / 2 - 0.2), 0.2, 0.58, 0.2);
      B.mesh(G.cyl, 'black', TX + s * (TW / 2 + 0.02), Y + TH - 0.02, TZ + l * (TL / 2 + 0.02), 0.16, 0.08, 0.16);   // the pockets
    }
  }
  // the balls, mid-game: reds still in a loose pack, the colours on their spots, the white near baulk
  const ball = c => new THREE.MeshPhongMaterial({ color: c, shininess: 90, specular: 0x666666 });
  const red = ball(0x9a1010), by = Y + TH + 0.02;
  let k = 0;
  for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) { if (k++ % 4 === 3) continue;
    B.mesh(G.sphere, red, TX + (i - r / 2) * 0.054, by, TZ - 0.95 - r * 0.047, 0.052, 0.052, 0.052); }
  for (const [c, dx, dz] of [[0xf2ecd8, 0.32, 1.2], [0x1a1a1a, 0, -1.55], [0xd060a0, 0, -0.85], [0x2a4ab8, 0, 0], [0x6a4020, 0, 1.15], [0x2a7a38, -0.29, 1.15], [0xd8c020, 0.29, 1.15], [0x9a1010, -0.5, -0.2]])
    B.mesh(G.sphere, ball(c), TX + dx, by, TZ + dz, 0.052, 0.052, 0.052);
  // a cue left lying across the cloth
  { const c = B.mesh(G.cyl, 'wood', TX + 0.25, by + 0.02, TZ + 0.5, 0.025, 1.45, 0.025); c.rotation.set(Math.PI / 2, 0, 0.35); c.updateMatrix(); }
  // the lamp: a long brass bar on chains, three deep green shades
  B.box('brass', TX, -1.32, TZ, 0.07, 0.05, 2.6);
  for (const dz of [-1.1, 1.1]) B.mesh(G.post, 'iron', TX, -0.76, TZ + dz, 0.012, 1.1, 0.012);
  const lamps = [];
  for (const dz of [-0.95, 0, 0.95]) {
    B.mesh(G.cone, new THREE.MeshPhongMaterial({ color: 0x1d4a2a, shininess: 60, side: THREE.DoubleSide }), TX, -1.45, TZ + dz, 0.5, 0.26, 0.5);
    const id = 'billiard-lamp' + lamps.length; lamps.push(id);
    B.fixture({ id, name: 'Billiard lamp', circuit: 'cellar', on: false, kind: 'incandescent', style: 'none', pos: [TX, -1.6, TZ + dz], spot: dz === 0, dir: [0, -1, 0], colour: 0xfff0c8, target: 0.9, range: 4.5, corona: 0 });
  }
  // a pool of light on the cloth under the shades, warm and sharp-edged
  const pool = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const poolMesh = B.mesh(G.plane, pool, TX, Y + TH + 0.003, TZ, TW, TL, 1); poolMesh.rotation.x = -Math.PI / 2; poolMesh.updateMatrix(); poolMesh.userData.dynamic = true;
  B.lightSwitch('sw-billiard', 'Billiard lamp', [X0 + 0.17, Y + 1.4, -0.4], [1, 0], lamps);
  // the cue rack and the marker board on the north wall
  B.boxE('darkWood', 8.0, 9.6, Y + 0.9, Y + 2.3, Z0 + 0.1, Z0 + 0.16);
  for (let i = 0; i < 6; i++) B.mesh(G.cyl, i === 4 ? 'darkWood' : 'wood', 8.2 + i * 0.25, Y + 1.55, Z0 + 0.22, 0.03, 1.45, 0.03);
  B.boxE('darkWood', 13.6, 15.4, Y + 1.25, Y + 2.15, Z0 + 0.1, Z0 + 0.15);
  B.mesh(G.plane, BM.labelMat('C.A.B.   47\nE.B.     61', { w: 256, h: 128, size: 34, bg: '#1e2a20', fg: '#e8e2c8', border: '#5a4620' }), 14.5, Y + 1.7, Z0 + 0.155, 1.6, 0.8, 1);
  B.readable('billiard-board', 'The marker board', 'The marker board on the wall still shows the last game ever played in this room, in chalk:\n\nC.A.B.  47\nE.B.  61\n\nUnderneath, smaller, in a girl\'s hand: "best of three?" — and under that, in a man\'s: "No."\n\nThe chalk has been gone over since. Recently.', [14.5, Y + 1.7, Z0 + 0.12], [0, 1], { visual: false });
  // a leather chesterfield to watch from, a drinks cabinet, a dartboard nobody dared use
  B.furniture('leather', 12.2, -9.8, Y, 2.4, 0.85, 0.9, 'sofa');
  B.furniture('darkWood', 16.2, -10.9, Y, 1.4, 1.1, 0.5, 'drinks cabinet');
  for (let i = 0; i < 4; i++) B.mesh(G.cyl, 'glass', 15.8 + i * 0.25, Y + 1.22, -10.85, 0.09, 0.22, 0.09);
  { const d = B.mesh(G.cyl, 'leather', 17.72, Y + 1.75, -6.5, 0.46, 0.05, 0.46); d.rotation.z = Math.PI / 2; d.updateMatrix(); }
  game.billiards = { lamps, pool };
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
};

BM.updateBilliards = function (game) {
  const S = game.billiards; if (!S) return;
  let k = 0; for (const id of S.lamps) { const l = game.grid.light(id); if (l && l.target > 0) k = Math.max(k, Math.min(1.2, l.intensity / l.target)); }
  S.pool.color.setRGB(0.05 * k, 0.07 * k, 0.03 * k);
};
})();
