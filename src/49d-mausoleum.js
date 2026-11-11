/* ==========================================================================
   BLACKTHORN MANOR — 6l. THE MAUSOLEUM
   South of the cemetery, where the family has gone since 1771: a stone
   temple on a low plinth, four columns under a pediment, bronze doors.
   Inside, the walls are lined with niches, row on row, a name and two dates
   on every marble plate, six generations of Blackthorns from the founder's
   wife to Margaret in 1983, the children among them. Josiah himself lies
   in the middle on his tomb, carved in stone with his hands together. At
   the far end a mourning angel, and coloured glass. One niche at the bottom
   of the south wall is open and swept and has never had a plate.
   The lighting is the cemetery's: cold uplights wash the columns and the
   walls, warm lanterns hang by the doors and over the tomb, and a row of
   red votive glasses at Josiah's feet is, somehow, always lit.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const MZ = { x0: 35, x1: 47, z0: 14, z1: 25, t: 0.5, eaves: 5.0, ridge: 7.6, doorZ: 19.5 };
BM.MAUSOLEUM = MZ;

/* the generations, in the order they went into the walls */
const NAMES = [
  ['HANNAH', 'WIFE OF JOSIAH', '1708 – 1779'], ['MARY', 'THEIR DAUGHTER', '1734 – 1736'], ['NATHANIEL', '', '1731 – 1790'], ['PRUDENCE', 'HIS WIFE', '1735 – 1801'],
  ['GEORGE', '', '1760 – 1799'], ['JOSIAH', 'THE SECOND', '1758 – 1822'], ['CAROLINE', 'HIS WIFE', '1762 – 1830'], ['INFANT SON', '', '1789'],
  ['SOPHIA', '', '1793 – 1812'], ['THOMAS', '', '1785 – 1849'], ['AUGUSTA', 'HIS WIFE', '1790 – 1866'], ['HENRY', 'LOST AT SEA', '1812 – 1858'],
  ['LOUISA', '', '1816 – 1840'], ['ROBERT', '', '1815 – 1879'], ['EMILY', 'HIS WIFE', '1820 – 1883'], ['EDWARD', '', '1839 – 1901'],
  ['CLARA', 'HIS WIFE', '1844 – 1897'], ['FREDERICK', '', '1842 – 1870'], ['ALICE', '', '1847 – 1925'], ['FLORENCE', '', '1872 – 1874'],
  ['JAMES', '', '1874'], ['ARTHUR', 'THE SOMME', '1866 – 1916'], ['WALTER', '', '1868 – 1918'], ['BEATRICE', 'WIFE OF ARTHUR', '1870 – 1935'],
  ['HAROLD', 'PASSCHENDAELE', '1894 – 1917'], ['MABEL', '', '1892 – 1893'], ['ALBERT', '', '1888 – 1941'], ['CONSTANCE', 'HIS WIFE', '1890 – 1962'],
  ['CHARLES ALBERT', '', '1911 – 1979'], ['EDMUND', 'HIS BROTHER', '1913 – 1981'], ['MARGARET', 'WIFE OF CHARLES', '1915 – 1983'],
];
const COLS = 6, ROWS = 3;

/* one wall of niches as one picture: marble plates in frames, lettered, a few blank, one open */
function nicheWall(entries, emptyAt) {
  const W = 1536, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), rnd = BM.mulberry32(entries.length * 31 + 7);
  g.fillStyle = '#6e6a62'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(0,0,0,' + rnd() * 0.08 + ')'; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 6, 2 + rnd() * 6); }
  const cw = W / COLS, ch = H / ROWS;
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
    const i = r * COLS + k, x = k * cw + 10, y = r * ch + 10, w = cw - 20, h = ch - 20;
    g.fillStyle = '#4a4740'; g.fillRect(x - 6, y - 6, w + 12, h + 12);                          // the moulded frame
    if (i === emptyAt) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#0c0a08'); g.fillStyle = gr; g.fillRect(x, y, w, h); continue; }
    const e = entries[i];
    const m = g.createLinearGradient(x, y, x + w, y + h); m.addColorStop(0, '#e6e2d6'); m.addColorStop(1, '#c8c2b2'); g.fillStyle = m; g.fillRect(x, y, w, h);
    for (let v = 0; v < 6; v++) { g.strokeStyle = 'rgba(120,110,100,' + (0.1 + rnd() * 0.15) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + rnd() * w, y); g.bezierCurveTo(x + rnd() * w, y + h * 0.3, x + rnd() * w, y + h * 0.6, x + rnd() * w, y + h); g.stroke(); }
    g.fillStyle = 'rgba(60,70,40,' + (r === ROWS - 1 ? 0.35 : 0.12) + ')'; g.fillRect(x, y + h * 0.75, w, h * 0.25);   // damp, worst at the bottom
    if (!e) continue;                                                                               // a plate never cut
    g.fillStyle = '#2a2620'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 30px Georgia, serif'; g.fillText(e[0], x + w / 2, y + h * 0.33, w - 20);
    g.font = 'italic 21px Georgia, serif'; if (e[1]) g.fillText(e[1], x + w / 2, y + h * 0.53, w - 20);
    g.font = '24px Georgia, serif'; g.fillText(e[2], x + w / 2, y + h * 0.72, w - 20);
    g.fillStyle = '#8a6a2c'; g.beginPath(); g.arc(x + w / 2, y + h * 0.12, 6, 0, 6.3); g.fill();  // a bronze rosette
  }
  const t = new THREE.CanvasTexture(c);
  return new THREE.MeshPhongMaterial({ map: t, shininess: 30, specular: 0x333333 });
}

BM.buildMausoleum = function (B, game) {
  const P = B.phys;
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'mausoleum';
  const estate = (o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:cemetery' }, o)); game.estateLights.cemetery.push(l.id); return l; };
  const { x0, x1, z0, z1, t, eaves, ridge } = MZ, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const ix0 = x0 + t, ix1 = x1 - t, iz0 = z0 + t, iz1 = z1 - t;

  /* ---- the walls, the doors, the plinth course ---- */
  const W = { t, mat: 'gothicStone', y1: eaves };
  B.wall('z', x0 + t / 2, z0, z1, W, [{ at: MZ.doorZ, w: 2.2, type: 'door', head: 3.2, id: 'mausoleum-gate', casing: 'gothicTrim' }]);
  B.wall('z', x1 - t / 2, z0, z1, W, [{ at: cz, w: 1.0, type: 'lancet', sill: 2.2, head: 4.3 }]);
  for (const zc of [z0 + t / 2, z1 - t / 2]) B.wall('x', zc, x0 + t, x1 - t, W);
  for (const [a0, a1, b0, b1] of [[x0 - 0.15, x1 + 0.15, z0 - 0.15, z0], [x0 - 0.15, x1 + 0.15, z1, z1 + 0.15], [x1, x1 + 0.15, z0, z1]]) { B.boxE('stone', a0, a1, 0, 0.6, b0, b1); B.boxE('gothicTrim', a0 - 0.04, a1 + 0.04, 0.6, 0.7, b0 - 0.04, b1 + 0.04); }
  B.boxE('gothicTrim', x0 - 0.2, x1 + 0.2, eaves - 0.35, eaves, z0 - 0.2, z0 + 0.1); B.boxE('gothicTrim', x0 - 0.2, x1 + 0.2, eaves - 0.35, eaves, z1 - 0.1, z1 + 0.2); // the cornice
  // the name over the door
  B.mesh(G.plane, BM.labelMat('B L A C K T H O R N', { w: 512, h: 64, size: 40, bg: '#9a968c', fg: '#2a2620', border: '#9a968c' }), x0 - 0.02, 3.75, MZ.doorZ, 3.6, 0.42, 1, -Math.PI / 2);
  B.box('gothicTrim', x0 - 0.06, 3.38, MZ.doorZ, 0.12, 0.12, 3.0);

  /* ---- the portico: a step, four columns, an entablature, the pediment ---- */
  const PX0 = 32.2;
  B.boxE('stone', PX0 - 0.6, x0, 0, 0.06, z0 + 0.4, z1 - 0.4);
  B.boxE('stone', PX0 - 0.3, x0, 0.06, 0.12, z0 + 0.6, z1 - 0.6);
  const colGeo = BM.statuaryGeo('mzColumn', () => { const h = eaves - 0.55; const pts = [[0.001, 0], [0.36, 0], [0.36, 0.12], [0.3, 0.18], [0.3, 0.26], [0.27, 0.32], [0.24, h * 0.5], [0.22, h - 0.32], [0.26, h - 0.26], [0.26, h - 0.18], [0.34, h - 0.08], [0.36, h], [0.001, h]]; const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 16); g.computeVertexNormals(); return g; });
  const colZ = [z0 + 1.0, MZ.doorZ - 1.9, MZ.doorZ + 1.9, z1 - 1.0];
  for (const z of colZ) { B.mesh(colGeo, 'gothicStone', PX0 + 0.5, 0.12, z, 1, 1, 1); P.addWall(PX0 + 0.15, PX0 + 0.85, z - 0.35, z + 0.35, 0, eaves, { kind: 'furniture', tag: 'column' }); }
  B.boxE('gothicTrim', PX0, x0, eaves - 0.55, eaves - 0.3, z0 + 0.3, z1 - 0.3);
  B.boxE('gothicStone', PX0 - 0.05, x0, eaves - 0.3, eaves, z0 + 0.25, z1 - 0.25);
  B.boxE('gothicTrim', PX0 - 0.15, x0, eaves - 0.05, eaves + 0.05, z0 + 0.15, z1 - 0.15);
  B.mesh(G.wedge, 'gothicStone', (PX0 + x1) / 2, eaves, cz, x1 - PX0 + 0.3, ridge - eaves, z1 - z0 + 0.3, 0);       // the roof's stone core
  for (const s of [-1, 1]) {
    const halfW = (z1 - z0) / 2 + 0.35, rise = ridge - eaves, ang = Math.atan2(rise, halfW), slope = Math.hypot(rise, halfW);
    const r = B.box('slate', (PX0 + x1) / 2, eaves + rise / 2 + 0.1, cz + s * halfW / 2, x1 - PX0 + 0.6, 0.14, slope); r.rotation.x = s * ang; r.updateMatrix();
  }
  B.mesh(G.wedge, 'gothicTrim', PX0 - 0.12, eaves + 0.02, cz, 0.24, ridge - eaves - 0.15, z1 - z0 + 0.2, 0);     // the pediment's face
  B.mesh(G.sphere, 'gothicTrim', PX0 - 0.1, ridge + 0.2, cz, 0.4, 0.4, 0.4);                                      // its acroterion
  for (const s of [-1, 1]) BM.urn(B, PX0 - 0.05, eaves + 0.05, cz + s * (z1 - z0) / 2, 0.55);

  /* ---- the bronze doors ---- */
  game.mausoleumDoor = B.hingedDoor({ id: 'mausoleum-gate', axis: 'z', at: MZ.doorZ, c: x0 + t / 2, w: 2.2, h: 3.15, hinge: 'both', swing: 1, outside: -1, mat: 'brass', panelMat: 'metalDark', dur: 3.0, sound: 'groan', label: 'the mausoleum doors', wallT: t, maxAngle: 1.5 });

  /* ---- inside: the floor, the walls of niches, the founder's tomb, the angel ---- */
  B.boxE('stone', ix0, ix1, 0, 0.03, iz0, iz1);
  B.boxE('gothicTrim', ix0 + 1.6, ix1 - 1.4, 0.03, 0.04, cz - 0.6, cz + 0.6);   // a strip of darker stone down the middle
  // the inner roof: a coffered barrel of dark stone, and the tie beams
  for (const s of [-1, 1]) {
    const halfW = (z1 - z0) / 2 - t, rise = ridge - eaves - 0.4, ang = Math.atan2(rise, halfW), slope = Math.hypot(rise, halfW);
    const r = B.box(new THREE.MeshPhongMaterial({ color: 0x4a4640, side: THREE.DoubleSide, shininess: 4 }), cx, eaves + rise / 2 - 0.1, cz + s * halfW / 2, ix1 - ix0, 0.06, slope); r.rotation.x = s * ang; r.updateMatrix();
  }
  for (const bx of [38.5, 41.0, 43.5]) B.box('gothicTrim', bx, eaves - 0.15, cz, 0.3, 0.3, iz1 - iz0);
  // the niches: one picture per wall, framed in relief
  const north = NAMES.slice(0, 18), south = NAMES.slice(18).concat([null, null]);
  while (south.length < 18) south.push(null);
  const EMPTY = 17; // the bottom row, the far (east) end of the south wall
  const wallW = ix1 - 1.4 - (ix0 + 0.3), wallX = ix0 + 0.3 + wallW / 2, y0 = 0.55, y1 = 4.1;
  B.mesh(G.plane, nicheWall(north, -1), wallX, (y0 + y1) / 2, iz0 + 0.02, wallW, y1 - y0, 1, 0);
  B.mesh(G.plane, nicheWall(south, EMPTY), wallX, (y0 + y1) / 2, iz1 - 0.02, wallW, y1 - y0, 1, Math.PI);
  // (the south wall's picture runs east to west as you face it: its last column is at the west end. Mirror the index.)
  for (const zf of [iz0, iz1]) {
    const s = zf < cz ? 1 : -1;
    for (let r = 0; r <= ROWS; r++) B.box('gothicTrim', wallX, y0 + r * (y1 - y0) / ROWS, zf + s * 0.05, wallW + 0.1, 0.08, 0.1);
    for (let k = 0; k <= COLS; k++) B.box('gothicTrim', wallX - wallW / 2 + k * wallW / COLS, (y0 + y1) / 2, zf + s * 0.05, 0.08, y1 - y0, 0.1);
    B.box('gothicTrim', wallX, 0.28, zf + s * 0.12, wallW + 0.2, 0.5, 0.24);       // a ledge for flowers
  }
  // dead flowers in jars on the ledges, a wreath gone brown
  const rnd = BM.mulberry32(1771);
  for (let i = 0; i < 7; i++) { const x = ix0 + 0.8 + rnd() * (wallW - 1), zf = rnd() < 0.5 ? iz0 + 0.15 : iz1 - 0.15; B.mesh(G.cyl, 'darkGlass', x, 0.62, zf, 0.1, 0.18, 0.1); B.mesh(G.lowSphere, 'deadStalk', x, 0.82, zf, 0.2, 0.22, 0.2); }
  { const w = B.mesh(G.ring, 'deadStalk', 41.5, 1.4, iz0 + 0.06, 0.9, 0.9, 0.9); w.updateMatrix(); }
  // the empty niche: where the plate should be, the dark goes back into the wall
  const colW = wallW / COLS, emptyX = wallX - wallW / 2 + (COLS - 1 - (EMPTY % COLS)) * colW + colW / 2, emptyY = y0 + (ROWS - 1 - Math.floor(EMPTY / COLS)) * (y1 - y0) / ROWS + (y1 - y0) / ROWS / 2;
  B.readable('crypt-empty', 'An empty niche', 'Every other place on these walls has its plate, its name, its two dates. This one is open, and swept, and goes back into the dark further than it should.\n\nThere is no plate. There never was. In the dust of the ledge below it, as if written with a finger and written again since:\n\nE.', [emptyX, emptyY, iz1 - 0.06], [0, -1], { visual: false });
  // the founder's tomb: a chest of stone with panels, and his effigy on it
  const TX0 = 39.6, TX1 = 42.6, TZ0 = cz - 0.75, TZ1 = cz + 0.75;
  B.solid('gothicStone', TX0, TX1, 0, 1.0, TZ0, TZ1, { kind: 'furniture', tag: 'tomb' });
  B.boxE('gothicTrim', TX0 - 0.08, TX1 + 0.08, 0, 0.18, TZ0 - 0.08, TZ1 + 0.08); B.boxE('gothicTrim', TX0 - 0.1, TX1 + 0.1, 0.95, 1.08, TZ0 - 0.1, TZ1 + 0.1);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) B.boxE('statue', TX0 + 0.25 + k * 0.95, TX0 + 0.95 + k * 0.95, 0.3, 0.82, s < 0 ? TZ0 - 0.02 : TZ1, s < 0 ? TZ0 : TZ1 + 0.02);
  const eff = BM.figure(B, TX1 - 0.35, 1.24, cz, 0, { pose: 'pray', scale: 1.1 });
  eff.rotation.order = 'YXZ'; eff.rotation.set(-Math.PI / 2, Math.PI / 2, 0); eff.updateMatrixWorld(true);
  eff.traverse(o => { if (o.isMesh) o.updateMatrix(); });
  B.box('gothicTrim', TX0 + 0.12, 1.2, cz, 0.3, 0.24, 0.5);   // a stone cushion under his head
  B.readable('crypt-founder', "The founder's tomb", 'Cut into the stone along the side of the tomb:\n\nHERE LIES JOSIAH BLACKTHORN\n1702 – 1771\nWHO BUILT THIS HOUSE AND KEPT IT\n\nWHAT IS OURS WE HOLD\n\nThe same words, smaller, are cut over the lodge gates, under the lichen.', [(TX0 + TX1) / 2, 0.7, TZ0 - 0.1], [0, -1], { visual: false, floorY: 0 });
  // the angel at the far end, under the coloured glass
  BM.plinth(B, ix1 - 0.6, cz, 0.7, 1.0, 'gothicStone');
  P.addWall(ix1 - 0.95, ix1 - 0.25, cz - 0.35, cz + 0.35, 0, 2.6, { kind: 'furniture', tag: 'angel' });
  BM.figure(B, ix1 - 0.6, 1.0, cz, -Math.PI / 2, { pose: 'mourn', wings: true, scale: 0.95 });
  const glass = game.chapelGlass ? game.chapelGlass[1].clone() : new THREE.MeshBasicMaterial({ color: 0x303030 });
  B.mesh(G.plane, glass, x1 - t / 2, 3.25, cz, 1.0, 2.1, 1, Math.PI / 2);
  // the votive glasses at his feet, burning
  B.box('iron', TX1 + 0.55, 0.85, cz, 0.3, 0.04, 1.2); B.box('iron', TX1 + 0.55, 0.42, cz, 0.06, 0.84, 0.06);
  const votives = [];
  const redGlass = new THREE.MeshBasicMaterial({ color: 0x6a0806, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 5; i++) { const z = cz - 0.48 + i * 0.24; const m = B.mesh(G.cyl, redGlass, TX1 + 0.55, 0.92, z, 0.09, 0.12, 0.09); m.userData.dynamic = true; votives.push(m); }
  B.fixture({ id: 'crypt-votives', name: 'Votive candles', circuit: 'fire', kind: 'fire', style: 'none', pos: [TX1 + 0.55, 1.05, cz], colour: 0xff2a10, target: 0.7, range: 5, on: true, noFail: true, corona: 0.4 });

  /* ---- the lighting ---- */
  // cold uplights in the portico floor, washing the columns
  for (const z of colZ) {
    B.box('metalDark', PX0 - 0.2, 0.08, z, 0.22, 0.1, 0.22);
    estate({ id: 'crypt-uplight-' + z.toFixed(0), name: 'Mausoleum uplight', kind: 'incandescent', style: 'none', pos: [PX0 - 0.2, 0.2, z], spot: true, dir: [0.25, 1, 0], colour: 0x9fb8ff, target: 1.1, range: 7, corona: 0.3 });
  }
  // warm lanterns either side of the doors
  for (const s of [-1, 1]) estate({ id: 'crypt-lantern' + (s > 0 ? 'n' : 's'), name: 'Mausoleum lantern', kind: 'incandescent', style: 'lantern', pos: [x0 - 0.35, 2.6, MZ.doorZ + s * 1.55], nx: -1, colour: 0xffb060, target: 0.9, range: 7 });
  // inside: a bronze lamp on a chain over the tomb, and cold light along the foot of each wall of names
  B.box('iron', 41.1, (eaves + 3.1) / 2, cz, 0.02, eaves - 3.1, 0.02);
  estate({ id: 'crypt-lamp', name: 'Mausoleum lamp', kind: 'incandescent', style: 'lantern', pos: [41.1, 2.9, cz], colour: 0xffa040, target: 1.0, range: 8, flicker: 0.12, lightType: 'flicker' });
  for (const zf of [iz0 + 0.4, iz1 - 0.4]) for (const x of [38.0, 43.0]) {
    B.box('metalDark', x, 0.6, zf, 0.3, 0.06, 0.16);
    estate({ id: 'crypt-wash-' + x + (zf < cz ? 'n' : 's'), name: 'Niche light', kind: 'incandescent', style: 'none', pos: [x, 0.7, zf], spot: true, dir: [0, 1, zf < cz ? -0.25 : 0.25], colour: 0x8fa8ff, target: 0.6, range: 5, corona: 0 });
  }
  // the old plaque at the doors, rewritten
  B.readable('plaque-mausoleum', 'The mausoleum doors', 'BLACKTHORN\nMDCCLXXI\n\nThe bronze doors have gone green. They are not locked: the chain hangs loose through one handle, and the doors open on their own weight once they are moving.\n\nThe family has come in here for two hundred years. Five names on the stone in the cemetery; sixty-odd plates on the walls inside.', [x0 - 0.2, 1.5, MZ.doorZ - 1.45], [-1, 0], { plaque: true });

  game.mausoleum = { glass, votives, lamp: () => game.grid.light('crypt-lamp'), lit: -1 };
  B.room = 'grounds';
};

BM.updateMausoleum = function (game, dt, t) {
  const m = game.mausoleum; if (!m) return;
  const l = m.lamp(), k = Math.max(0.15, l && l.target > 0 ? Math.min(1, l.intensity / l.target) : 0);
  if (Math.abs(k - m.lit) > 0.01) { m.lit = k; m.glass.color.setScalar(0.12 + 0.8 * k); }
  for (let i = 0; i < m.votives.length; i++) { const f = 0.75 + 0.25 * Math.sin(t * 7 + i * 1.7) * Math.sin(t * 13 + i); m.votives[i].material.color.setRGB(0.45 * f, 0.04 * f, 0.02 * f); }
};
})();
