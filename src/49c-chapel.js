/* ==========================================================================
   BLACKTHORN MANOR — 6k. THE CHAPEL
   East of the cemetery, past the small stone outside the railings, the
   family's chapel: a stone nave under a steep slate roof, a bellcote on
   the west gable, an oak door, lancet windows of stained glass. Inside,
   pews either side of the aisle, an altar rail, an altar, a corona of
   lights, a red sanctuary lamp, and the register on the lectern. It is
   wired with the cemetery: its lanterns and its lights come on with the
   cemetery group on the estate panel, and there is a switch inside the
   door. When it is lit, its windows glow out across the graves.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const CH = { x0: 53.0, x1: 61.0, z0: 31.0, z1: 37.0, t: 0.4, eaves: 4.2, ridge: 7.0, doorZ: 34 };
BM.CHAPEL = CH;

/* stained glass: a lancet of coloured quarries in lead, the pointed head drawn in, the corners left as stone */
function glassTexture(seed, wide) {
  const W = wide ? 96 : 64, H = 192, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), rnd = BM.mulberry32(seed);
  g.fillStyle = '#2c2a26'; g.fillRect(0, 0, W, H);
  // the lancet: straight sides, a pointed head
  g.save(); g.beginPath(); g.moveTo(3, H - 3); g.lineTo(3, W * 0.62); g.quadraticCurveTo(3, 6, W / 2, 3); g.quadraticCurveTo(W - 3, 6, W - 3, W * 0.62); g.lineTo(W - 3, H - 3); g.closePath(); g.clip();
  const cols = ['#1d3c8c', '#8c1d24', '#c89a2a', '#2a6a3a', '#5a2a7a', '#2a5a9a', '#b8641c'];
  const q = wide ? 12 : 10;
  for (let y = -q; y < H + q; y += q) for (let x = -q; x < W + q; x += q) {
    g.fillStyle = cols[Math.floor(rnd() * cols.length)];
    g.beginPath(); g.moveTo(x, y + q / 2); g.lineTo(x + q / 2, y); g.lineTo(x + q, y + q / 2); g.lineTo(x + q / 2, y + q); g.closePath(); g.fill();
  }
  // a roundel in the middle: a pale ring, a cross in the east window, a lily in the others
  const cy = H * 0.45, r = W * 0.3;
  g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(W / 2, cy, r, 0, 6.3); g.fill();
  g.fillStyle = wide ? '#c89a2a' : '#f2efe0';
  if (wide) { g.fillRect(W / 2 - 3, cy - r * 0.8, 6, r * 1.6); g.fillRect(W / 2 - r * 0.55, cy - r * 0.35, r * 1.1, 6); }
  else { g.fillRect(W / 2 - 1.5, cy - r * 0.2, 3, r * 0.9); for (const a of [-0.6, 0, 0.6]) { g.beginPath(); g.ellipse(W / 2 + Math.sin(a) * 6, cy - r * 0.35 - Math.cos(a) * 4, 3, 7, a, 0, 6.3); g.fill(); } }
  // the leading
  g.strokeStyle = 'rgba(20,18,16,0.85)'; g.lineWidth = 1.5;
  for (let y = 0; y < H + W; y += q) { g.beginPath(); g.moveTo(0, y); g.lineTo(y, 0); g.stroke(); g.beginPath(); g.moveTo(W, y); g.lineTo(W - y, 0); g.stroke(); }
  g.lineWidth = 3; g.beginPath(); g.arc(W / 2, cy, r, 0, 6.3); g.stroke();
  g.restore();
  g.strokeStyle = '#1a1814'; g.lineWidth = 4; g.beginPath(); g.moveTo(3, H - 3); g.lineTo(3, W * 0.62); g.quadraticCurveTo(3, 6, W / 2, 3); g.quadraticCurveTo(W - 3, 6, W - 3, W * 0.62); g.lineTo(W - 3, H - 3); g.stroke();
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.MeshBasicMaterial({ map: t, color: 0x303030, side: THREE.DoubleSide });
  return m;
}

BM.buildChapel = function (B, game) {
  const P = B.phys, rnd = BM.mulberry32(1871);
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'chapel';
  const estate = (o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:cemetery' }, o)); game.estateLights.cemetery.push(l.id); return l; };
  const { x0, x1, z0, z1, t, eaves, ridge } = CH, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const ix0 = x0 + t, ix1 = x1 - t, iz0 = z0 + t, iz1 = z1 - t;
  const glass = [glassTexture(7, false), glassTexture(19, true)];
  const lancets = [];
  const lancet = (axis, c, at, w, sill, head, wide) => {
    lancets.push({ axis, c, at, w, sill, head, wide });
    return { at, w, type: 'lancet', sill, head };
  };

  /* ---- the walls: ashlar, with the door in the west gable and lancets down each side and over the altar ---- */
  const W = { t, mat: 'gothicStone', y1: eaves };
  B.wall('z', x0 + t / 2, z0, z1, W, [{ at: CH.doorZ, w: 1.4, type: 'door', head: 2.6, id: 'chapel-door', casing: 'gothicTrim' }]);
  B.wall('z', x1 - t / 2, z0, z1, W, [lancet('z', x1 - t / 2, cz, 1.2, 1.2, 3.7, true)]);
  for (const zc of [z0 + t / 2, z1 - t / 2]) B.wall('x', zc, x0 + t, x1 - t, W, [lancet('x', zc, 55.6, 0.8, 1.3, 3.4), lancet('x', zc, 58.4, 0.8, 1.3, 3.4)]);
  // the glass in each lancet, a little in from the outer face; the pointed heads and the dripstones over them
  game.chapelGlass = glass;
  for (const L of lancets) {
    const h = L.head - L.sill, ym = (L.sill + L.head) / 2;
    if (L.axis === 'x') { B.mesh(G.plane, glass[L.wide ? 1 : 0], L.at, ym, L.c, L.w, h, 1); }
    else B.mesh(G.plane, glass[L.wide ? 1 : 0], L.c, ym, L.at, L.w, h, 1, Math.PI / 2);
    for (const side of [-1, 1]) {
      const o = L.c + side * (t / 2 + 0.02);
      if (L.axis === 'x') { B.box('gothicTrim', L.at, L.head + 0.08, o, L.w + 0.3, 0.12, 0.06); B.box('gothicTrim', L.at, L.sill - 0.05, o, L.w + 0.2, 0.1, 0.12); }
      else { B.box('gothicTrim', o, L.head + 0.08, L.at, 0.06, 0.12, L.w + 0.3); B.box('gothicTrim', o, L.sill - 0.05, L.at, 0.12, 0.1, L.w + 0.2); }
    }
  }
  // a plinth course outside, broken at the door; buttresses at the corners
  for (const [a0, a1, b0, b1] of [[x0 - 0.12, x1 + 0.12, z0 - 0.12, z0], [x0 - 0.12, x1 + 0.12, z1, z1 + 0.12], [x1, x1 + 0.12, z0, z1], [x0 - 0.12, x0, z0, CH.doorZ - 0.85], [x0 - 0.12, x0, CH.doorZ + 0.85, z1]]) B.boxE('stone', a0, a1, 0, 0.45, b0, b1);
  for (const [bx, bz, dx, dz] of [[x0, z0, -1, -1], [x1, z0, 1, -1], [x0, z1, -1, 1], [x1, z1, 1, 1]]) {
    for (const [ax, az] of [[dx, 0], [0, dz]]) { const px = bx + ax * 0.35, pz = bz + az * 0.35; B.solid('gothicStone', px - 0.3, px + 0.3, 0, 2.6, pz - 0.3, pz + 0.3, { kind: 'furniture', tag: 'buttress' }); B.mesh(G.wedge, 'gothicTrim', px, 2.6, pz, 0.6, 0.5, 0.6, ax ? 0 : Math.PI / 2); }
  }
  // the door's pointed head and its hood
  B.mesh(G.wedge, 'gothicTrim', x0 - 0.05, 2.62, CH.doorZ, 0.5, 0.75, 1.9, Math.PI / 2);
  B.mesh(G.wedge, 'darkGlass', x0 - 0.08, 2.62, CH.doorZ, 0.46, 0.55, 1.4, Math.PI / 2);

  /* ---- the roof: two slate slopes, the gables, a bellcote at the west end and a cross at the east ---- */
  const halfW = (z1 - z0) / 2 + 0.35, rise = ridge - eaves, ang = Math.atan2(rise, halfW), slope = Math.hypot(rise, halfW);
  for (const s of [-1, 1]) {
    const zc = cz + s * halfW / 2, yc = eaves + rise / 2;
    const r = B.box('slate', cx, yc + 0.08, zc, x1 - x0 + 0.7, 0.16, slope); r.rotation.x = s * ang; r.updateMatrix();
    const ri = B.box(new THREE.MeshPhongMaterial({ color: 0x3a2a1c, side: THREE.DoubleSide, shininess: 6 }), cx, yc - 0.06, zc, x1 - x0, 0.05, slope - 0.2); ri.rotation.x = s * ang; ri.updateMatrix();
  }
  B.box('gothicTrim', cx, ridge + 0.12, cz, x1 - x0 + 0.8, 0.12, 0.18);
  for (const gx of [x0 + t / 2, x1 - t / 2]) B.mesh(G.wedge, 'gothicStone', gx, eaves, cz, t, rise, z1 - z0, 0);
  // open timber roof inside: tie beams and the king posts
  for (const bx of [55.0, 57.0, 59.0]) { B.box('darkWood', bx, eaves - 0.1, cz, 0.22, 0.24, z1 - z0 - t * 2); B.box('darkWood', bx, eaves + rise * 0.45, cz, 0.16, rise * 0.9, 0.16); }
  // the bellcote: two piers and a pointed cap over a small bell
  const bx = x0 + 0.1, by = ridge - 0.2;
  for (const s of [-1, 1]) B.box('gothicStone', bx, by + 0.6, cz + s * 0.38, 0.4, 1.2, 0.22);
  B.mesh(G.pyramid, 'slate', bx, by + 1.2, cz, 0.55, 0.7, 1.1);
  const bell = B.mesh(BM.statuaryGeo('chapelBell', () => new THREE.LatheGeometry([[0.001, 0.32], [0.08, 0.3], [0.12, 0.2], [0.14, 0.06], [0.2, 0.0], [0.21, -0.02]].reverse().map(p => new THREE.Vector2(p[0], p[1])), 16)), 'brass', bx, by + 0.38, cz, 1, 1, 1);
  void bell;
  B.box('iron', x1 + 0.02, ridge + 0.45, cz, 0.06, 0.8, 0.08); B.box('iron', x1 + 0.02, ridge + 0.6, cz, 0.06, 0.08, 0.45); // the cross

  /* ---- inside: a stone floor, pews, the altar rail, the altar, a font, the lectern, memorials ---- */
  B.boxE('stone', ix0, ix1, 0.0, 0.035, iz0, iz1);
  B.boxE('carpet', ix0 + 0.2, 58.6, 0.035, 0.045, cz - 0.45, cz + 0.45); // the aisle runner
  B.boxE('stone', 58.6, ix1, 0.035, 0.18, iz0, iz1);                    // the sanctuary, one step up
  P.addWall(58.6, ix1, iz0, iz1, 0, 0.17, { kind: 'furniture', tag: 'sanctuary step' });
  const pew = (px, za, zb) => {
    const zc2 = (za + zb) / 2, len = zb - za;
    B.box('darkWood', px, 0.45, zc2, 0.42, 0.06, len);                               // the seat
    B.box('darkWood', px + 0.22, 0.75, zc2, 0.05, 0.62, len);                         // the back
    B.box('darkWood', px - 0.35, 0.95, zc2, 0.04, 0.12, len);                         // the book ledge of the pew in front
    for (const ez of [za + 0.03, zb - 0.03]) { B.box('darkWood', px, 0.5, ez, 0.55, 1.0, 0.06); B.mesh(G.sphere, 'darkWood', px + 0.15, 1.02, ez, 0.12, 0.08, 0.08); }
    B.box('fabricRed', px - 0.25, 0.08, zc2, 0.2, 0.08, len * 0.85);                   // the kneeler
    P.addWall(px - 0.28, px + 0.28, za, zb, 0, 1.0, { kind: 'furniture', tag: 'pew' });
  };
  for (const px of [55.3, 56.4, 57.5]) { pew(px, iz0 + 0.1, cz - 0.6); pew(px, cz + 0.6, iz1 - 0.1); }
  // the altar rail, open in the middle
  for (const [za, zb] of [[iz0 + 0.1, cz - 0.55], [cz + 0.55, iz1 - 0.1]]) {
    B.boxE('darkWood', 58.45, 58.6, 0.85, 0.92, za, zb);
    for (let z = za + 0.08; z < zb; z += 0.22) B.mesh(G.post, 'darkWood', 58.52, 0.5, z, 0.04, 0.8, 0.04);
    P.addWall(58.45, 58.6, za, zb, 0, 0.92, { kind: 'rail' });
  }
  // the altar: stone, a red frontal, a white cloth, a brass cross and two candlesticks
  B.solid('stone', 59.85, 60.5, 0.18, 1.12, cz - 0.95, cz + 0.95, { kind: 'furniture', tag: 'altar' });
  B.boxE('fabricRed', 59.8, 59.85, 0.25, 1.05, cz - 0.9, cz + 0.9);
  B.boxE('linen', 59.78, 60.52, 1.12, 1.14, cz - 1.0, cz + 1.0);
  B.box('brass', 60.3, 1.45, cz, 0.04, 0.6, 0.05); B.box('brass', 60.3, 1.55, cz, 0.04, 0.05, 0.32); B.box('brass', 60.3, 1.17, cz, 0.18, 0.06, 0.14);
  const flames = [];
  for (const s of [-1, 1]) {
    const z = cz + s * 0.65;
    B.mesh(G.cyl, 'brass', 60.15, 1.16, z, 0.14, 0.04, 0.14); B.mesh(G.post, 'brass', 60.15, 1.32, z, 0.04, 0.32, 0.04); B.mesh(G.cyl, 'wax', 60.15, 1.6, z, 0.05, 0.26, 0.05);
    const fl = B.fixture({ id: 'chapel-candle' + (s > 0 ? 'n' : 's'), name: 'Altar candle', circuit: 'fire', kind: 'fire', style: 'none', pos: [60.15, 1.82, z], colour: 0xffb060, target: 0.5, range: 4, on: true, noFail: true, corona: 0.6 });
    const m = B.mesh(G.cone, new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), 60.15, 1.8, z, 0.04, 0.1, 0.04);
    m.userData.dynamic = true; m.matrixAutoUpdate = true; flames.push(m); void fl;
  }
  // the font by the door, and a board of hymn numbers
  B.mesh(BM.statuaryGeo('font', () => new THREE.LatheGeometry([[0.001, 0], [0.32, 0], [0.32, 0.1], [0.16, 0.18], [0.14, 0.7], [0.32, 0.82], [0.38, 1.0], [0.32, 1.0], [0.28, 0.9], [0.001, 0.88]].map(p => new THREE.Vector2(p[0], p[1])), 16)), 'gothicStone', 54.1, 0, iz0 + 0.65, 1, 1, 1);
  P.addWall(53.75, 54.45, iz0 + 0.3, iz0 + 1.0, 0, 1.0, { kind: 'furniture', tag: 'font' });
  B.box('darkWood', ix1 - 0.03, 2.2, iz0 + 0.9, 0.05, 0.9, 0.55);
  ['117', '241', '477', '—'].forEach((n, i) => B.mesh(G.plane, BM.labelMat(n, { w: 96, h: 32, size: 22, bg: '#1a1410', fg: '#e8dcc0', border: '#1a1410' }), ix1 - 0.06, 2.5 - i * 0.2, iz0 + 0.9, 0.36, 0.13, 1, -Math.PI / 2));
  // memorial tablets on the walls
  const tablet = (z, y, text, wd) => { const s = z < cz ? 1 : -1; B.box('statue', cx + (z < cz ? -1 : 1) * 0, y, z, wd || 0.9, 0.62, 0.05); B.mesh(G.plane, BM.labelMat(text, { w: 256, h: 176, size: 17, bg: '#d8d4c8', fg: '#2a2620', border: '#8a8478' }), cx, y, z + s * 0.03, (wd || 0.9) - 0.1, 0.52, 1, s > 0 ? 0 : Math.PI); };
  tablet(iz0 + 0.03, 2.4, 'IN LOVING MEMORY\nCHARLES ALBERT\nBLACKTHORN\n1911 – 1979\nTHY WILL BE DONE');
  tablet(iz1 - 0.03, 2.4, 'MARGARET\nBLACKTHORN\n1915 – 1983\nAND OF EDMUND\nHIS BROTHER 1913 – 1981');
  // the lectern, its register open
  B.furniture('darkWood', 58.15, cz - 0.95, 0, 0.45, 1.05, 0.45, 'lectern');
  B.readable('chapel-register', 'The chapel register', [
    'BLACKTHORN ESTATE CHAPEL — REGISTER OF SERVICES',
    'The last entries, in a careful hand:\n\n14 March 1979. Burial: Charles Albert Blackthorn. Family present.\n2 June 1981. Burial: Edmund Blackthorn. Family present.\n9 January 1983. Burial: Margaret Blackthorn. None present.',
    'On the facing page, by itself, in pencil:',
    '"April 1975. A service for Miss Eleanor, said here without leave, because nobody else would come. I have laid her outside the railings, where they cannot pretend she was one of them, and where she can see the house. I keep the lamp by her stone, and the grass short. Forgive me, both of you. — W.G."',
  ].join('\n\n'), [58.15, 1.1, cz - 0.95], [0, 1], { book: true });
  // dust, a fallen hymn book, a cobweb in the rafters
  for (let i = 0; i < 4; i++) B.box('fabricRed', 54 + rnd() * 3.5, 0.06, iz0 + 0.4 + rnd() * 4.4, 0.16, 0.04, 0.12, rnd() * 3);

  /* ---- the lights: lanterns at the door, the corona over the nave, the red sanctuary lamp ---- */
  for (const s of [-1, 1]) estate({ id: 'chapel-lantern' + (s > 0 ? 'n' : 's'), name: 'Chapel door lantern', kind: 'incandescent', style: 'lantern', pos: [x0 - 0.35, 2.4, CH.doorZ + s * 1.25], nx: -1, colour: 0xffc070, target: 1.0, range: 8 });
  const corona = estate({ id: 'chapel-corona', name: 'Chapel corona', kind: 'incandescent', style: 'chandelier', pos: [56.0, 3.2, cz], ceiling: eaves - 0.2, colour: 0xffc786, target: 1.5, range: 10 });
  const sanctuary = estate({ id: 'chapel-sanctuary', name: 'Sanctuary lamp', kind: 'incandescent', style: 'none', pos: [59.3, 2.4, cz], colour: 0xff3020, target: 0.5, range: 4 });
  B.box('brass', 59.3, 3.3, cz, 0.012, 1.8, 0.012);
  sanctuary.bulb = B.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0x200404 }), 59.3, 2.4, cz, 0.12, 0.16, 0.12); sanctuary.bulb.userData.dynamic = true;
  B.mesh(G.cyl, 'brass', 59.3, 2.3, cz, 0.16, 0.04, 0.16);
  B.lightSwitch('sw-chapel', 'Chapel lights', [ix0 + 0.03, 1.4, CH.doorZ + 1.1], [1, 0], [corona.id, sanctuary.id]);

  /* ---- the door, and a way up to it ---- */
  game.chapelDoor = B.hingedDoor({ id: 'chapel-door', axis: 'z', at: CH.doorZ, c: x0 + t / 2, w: 1.4, h: 2.55, hinge: 'low', swing: 1, outside: -1, mat: 'darkWood', panelMat: 'boards', dur: 1.8, sound: 'creak', label: 'the chapel door', wallT: t });
  B.box('stone', x0 - 0.5, 0.04, CH.doorZ, 1.0, 0.08, 1.8); // the step
  game.chapel = { glass, flames, corona, sanctuary, lit: 0 };
  B.room = 'grounds';
};

/* per frame: the glass glows with the lights inside; the altar candles move */
BM.updateChapel = function (game, dt, t) {
  const c = game.chapel; if (!c) return;
  const f = l => l && l.target > 0 ? Math.min(1, l.intensity / l.target) : 0;
  const k = Math.max(f(c.corona), f(c.sanctuary) * 0.35, 0.18);
  if (Math.abs(k - c.lit) > 0.01) { c.lit = k; for (const m of c.glass) m.color.setScalar(0.12 + 0.88 * k); }
  for (let i = 0; i < c.flames.length; i++) { const s = 1 + Math.sin(t * 9 + i * 2) * 0.12 + Math.sin(t * 23 + i) * 0.06; c.flames[i].scale.set(0.04, 0.1 * s, 0.04); }
};
})();
