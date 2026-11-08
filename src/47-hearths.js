/* ==========================================================================
   BLACKTHORN MANOR — 6f. HEARTHS AND CANDLES
   None of this needs electricity. Every main room has a fireplace you can
   light (the kitchen its range, the lodge its stove), and every room has a
   candle you can light with a match and snuff again. When the storm takes
   the power, this is what you have.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildHearths = function (B, game) {
  const P = B.phys;
  game.fires = [];
  const flameMat = () => BM.Basic(0xff8a2a, { transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending });

  /* A fireplace set into a wall. pos = a point on the wall's face at floor level, n = out into the room.
     style: 'marble' (reception rooms), 'iron' (bedrooms), 'stone' (the hall). */
  const hearth = (o) => {
    const [x, y0, z] = o.pos, n = { x: o.n[0], z: o.n[1] }, ry = Math.atan2(n.x, n.z);
    const w = o.w || 2.0, h = o.h || 1.3, d = 0.5, mat = o.style === 'iron' ? 'metalDark' : o.style === 'stone' ? 'gothicTrim' : 'marble';
    const cx = x + n.x * d / 2, cz = z + n.z * d / 2;
    // the surround, the dark opening, the shelf, and (reception rooms) the overmantel mirror
    const along = (len) => (n.x ? [d, len] : [len, d]);
    const [sx, sz] = along(w);
    B.solid(mat, cx - sx / 2, cx + sx / 2, y0, y0 + h, cz - sz / 2, cz + sz / 2, { kind: 'furniture', tag: 'fireplace' });
    const [ox, oz] = along(w * 0.55);
    B.box('black', x + n.x * (d - 0.02), y0 + h * 0.38, z + n.z * (d - 0.02), ox + (n.x ? 0 : 0), h * 0.7, oz, 0);
    const [mx, mz] = along(w + 0.3);
    B.box(mat, x + n.x * (d + 0.08) / 2, y0 + h + 0.06, z + n.z * (d + 0.08) / 2, mx, 0.12, mz);
    if (o.style === 'marble') {
      B.box('gilt', x + n.x * 0.04, y0 + h + 0.95, z + n.z * 0.04, n.x ? 0.06 : 1.5, 1.4, n.x ? 1.5 : 0.06);
      B.box('darkGlass', x + n.x * 0.075, y0 + h + 0.95, z + n.z * 0.075, n.x ? 0.01 : 1.3, 1.2, n.x ? 1.3 : 0.01);
    }
    // the grate: bars, and the logs behind them
    for (let i = -2; i <= 2; i++) B.box('iron', x + n.x * 0.42 + (n.x ? 0 : i * 0.18), y0 + 0.2, z + n.z * 0.42 + (n.z ? 0 : i * 0.18), 0.03, 0.4, 0.03);
    for (let i = 0; i < 3; i++) B.box('bark', x + n.x * 0.25, y0 + 0.1 + i * 0.05, z + n.z * 0.25, n.x ? 0.12 : 0.8, 0.1, n.x ? 0.8 : 0.12, 0.3 * i + ry);
    const f = { id: o.id, name: o.name, kind: 'hearth', lit: false, flames: [], pos: { x: x + n.x * 0.25, y: y0 + 0.4, z: z + n.z * 0.25 } };
    f.light = B.fixture({ id: o.id + '-fire', name: o.name, circuit: 'fire', kind: 'fire', style: 'fire', pos: [f.pos.x, f.pos.y, f.pos.z], colour: 0xff7a2a, target: o.target || 1.5, range: o.range || 9, on: false, lightType: 'flicker', noFail: true });
    for (let i = 0; i < 5; i++) {
      const fl = B.mesh(G.cone, flameMat(), x + n.x * 0.25 + (n.x ? 0 : (i - 2) * 0.17), y0 + 0.32, z + n.z * 0.25 + (n.z ? 0 : (i - 2) * 0.17), 0.25, 0.6, 0.25);
      fl.userData.dynamic = true; fl.matrixAutoUpdate = true; f.flames.push(fl);
    }
    B.interactable({ id: o.id === 'drawing' ? 'fire' : 'fire-' + o.id, label: () => f.lit ? o.name + ': burning' : 'Light the ' + o.name.toLowerCase(), pos: [x + n.x * (d + 0.12), y0 + 0.6, z + n.z * (d + 0.12)], n: o.n, act: g => g.lightHearth(f) });
    game.fires.push(f);
    return f;
  };

  /* A fire that lives inside something already built (the range, the stove): just the glow and the door. */
  const firebox = (o) => {
    const [x, y, z] = o.pos, n = { x: o.n[0], z: o.n[1] };
    const f = { id: o.id, name: o.name, kind: o.kind || 'range', lit: false, flames: [], pos: { x, y, z } };
    B.box('black', x - n.x * 0.02, y, z - n.z * 0.02, n.x ? 0.02 : 0.5, 0.36, n.x ? 0.5 : 0.02);
    f.light = B.fixture({ id: o.id + '-fire', name: o.name, circuit: 'fire', kind: 'fire', style: 'fire', pos: [x + n.x * 0.15, y, z + n.z * 0.15], colour: 0xff6a20, target: o.target || 0.9, range: 6, on: false, lightType: 'flicker', noFail: true });
    for (let i = 0; i < 3; i++) {
      const fl = B.mesh(G.cone, flameMat(), x + n.x * 0.03 + (n.x ? 0 : (i - 1) * 0.12), y - 0.08, z + n.z * 0.03 + (n.z ? 0 : (i - 1) * 0.12), 0.14, 0.3, 0.14);
      fl.userData.dynamic = true; fl.matrixAutoUpdate = true; f.flames.push(fl);
    }
    B.interactable({ id: 'fire-' + o.id, label: () => f.lit ? o.name + ': burning' : 'Light the ' + o.name.toLowerCase(), pos: [x + n.x * 0.1, y, z + n.z * 0.1], n: o.n, act: g => g.lightHearth(f) });
    game.fires.push(f);
    return f;
  };

  /* A candle in a brass stick, standing on something. pos = where the stick's foot goes. */
  const candle = (o) => {
    const [x, y, z] = o.pos;
    B.mesh(G.disc, 'brass', x, y + 0.005, z, 0.1); B.mesh(G.cyl, 'brass', x, y + 0.06, z, 0.03, 0.12, 0.03);
    B.mesh(G.cyl, 'brass', x, y + 0.13, z, 0.07, 0.03, 0.07);
    B.mesh(G.cyl, 'wax', x, y + 0.26, z, 0.028, 0.24, 0.028);
    const f = { id: o.id, name: 'Candle', kind: 'candle', lit: false, flames: [], pos: { x, y: y + 0.45, z } };
    f.light = B.fixture({ id: o.id + '-flame', name: 'Candle', circuit: 'fire', kind: 'fire', style: 'none', pos: [x, y + 0.45, z], colour: 0xffb060, target: o.target || 0.55, range: 5, on: false, lightType: 'flicker', noFail: true, corona: 0.6 });
    const fl = B.mesh(G.cone, flameMat(), x, y + 0.44, z, 0.05, 0.12, 0.05);
    fl.userData.dynamic = true; fl.matrixAutoUpdate = true; f.flames.push(fl);
    B.interactable({ id: o.id, label: () => f.lit ? 'Snuff the candle' : 'Light the candle', pos: [x, y + 0.3, z], n: o.n || [0, 1], reach: 1.8, approachDist: o.approach || 0.7, act: g => g.lightCandle(f) });
    game.fires.push(f);
    return f;
  };

  /* ---- the house's fireplaces ---- */
  B.zone = 'mansion'; B.levelName = 'ground';
  B.room = 'drawing';
  game.fire = hearth({ id: 'drawing', name: 'Drawing room fire', pos: [15.5, 0, 4.1], n: [0, 1], style: 'marble' });
  B.room = 'dining';
  hearth({ id: 'dining', name: 'Dining room fire', pos: [-15.5, 0, 4.1], n: [0, 1], style: 'marble' });
  B.room = 'library';
  hearth({ id: 'library', name: 'Library fire', pos: [15.5, 0, 3.9], n: [0, -1], style: 'marble', w: 1.8 });
  B.room = 'back sitting';
  hearth({ id: 'sitting', name: 'Sitting room fire', pos: [-14.0, 0, 3.9], n: [0, -1], style: 'iron', w: 1.4, h: 1.1 });
  B.room = 'kitchen';
  firebox({ id: 'range', name: 'Kitchen range', pos: [-13.1, 0.42, -9.6], n: [1, 0], kind: 'range', target: 1.0 });
  B.levelName = 'upper';
  B.room = 'bedroom1';
  hearth({ id: 'bedroom1', name: 'Bedroom fire', pos: [-14.0, 4.2, 4.1], n: [0, 1], style: 'iron', w: 1.3, h: 1.1 });
  B.room = 'bedroom2';
  hearth({ id: 'bedroom2', name: 'Guest room fire', pos: [14.0, 4.2, 4.1], n: [0, 1], style: 'iron', w: 1.3, h: 1.1 });
  B.room = "eleanor's sitting room";
  hearth({ id: 'eleanor', name: "Eleanor's fire", pos: [-15.5, 4.2, 3.9], n: [0, -1], style: 'iron', w: 1.3, h: 1.1 });
  B.room = 'nursery';
  hearth({ id: 'nursery', name: 'Nursery fire', pos: [9.0, 4.2, -4.1], n: [0, -1], style: 'iron', w: 1.2, h: 1.0 });

  /* ---- the lodge's stove ---- */
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lodge';
  B.furniture('metalDark', -13.3, 81.2, 0, 0.7, 0.9, 0.6, 'stove');
  B.mesh(G.cyl, 'metalDark', -13.3, 2.0, 81.2, 0.14, 2.2, 0.14);
  B.box('brass', -12.93, 0.55, 81.2, 0.02, 0.06, 0.06);
  firebox({ id: 'stove', name: 'Lodge stove', pos: [-12.95, 0.45, 81.2], n: [1, 0], kind: 'stove', target: 0.8 });

  /* ---- a candle in every room ---- */
  const C = (id, room, pos, n, level, zone) => { B.zone = zone || 'mansion'; B.levelName = level || 'ground'; B.room = room; candle({ id, pos, n }); };
  C('candle-hall', 'hall', [5.45, 1.0, 6.0], [-1, 0]);
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'dining';
  candle({ id: 'candle-dining', pos: [-12.0, 0.78, 7.45], n: [0, -1], approach: 0.95 });
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'drawing';
  candle({ id: 'candle-drawing', pos: [16.9, 0.8, 10.8], n: [-1, 0], approach: 1.05 });
  B.room = 'library';
  B.furniture('darkWood', 13.5, 2.6, 0, 0.5, 0.8, 0.5, 'library stand'); candle({ id: 'candle-library', pos: [13.5, 0.8, 2.6], n: [0, -1] });
  C('candle-sitting', 'back sitting', [-7.0, 0.8, -3.4], [0, 1]);
  C('candle-kitchen', 'kitchen', [-8.95, 0.9, -8.3], [1, 0]);
  C('candle-pantry', 'pantry', [-16.6, 1.2, -4.75], [0, -1]);
  C('candle-bathroom', 'bathroom', [9.55, 0.85, -7.95], [-1, 0]);
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'service';
  B.furniture('wood', 14.5, -7.0, 0, 0.5, 0.8, 0.5, 'stand'); candle({ id: 'candle-service', pos: [14.5, 0.8, -7.0], n: [-1, 0] });
  B.room = 'corridor';
  B.furniture('wood', -5.45, -9.5, 0, 0.5, 0.8, 0.5, 'hall stand'); candle({ id: 'candle-corridor', pos: [-5.45, 0.8, -9.5], n: [1, 0] });
  B.levelName = 'upper'; B.room = 'upper corridor';
  B.furniture('darkWood', 2.0, -3.4, 4.2, 0.5, 0.8, 0.5, 'landing table'); candle({ id: 'candle-landing', pos: [2.0, 5.0, -3.4], n: [0, 1] });
  C('candle-bedroom1', 'bedroom1', [-14.3, 4.95, 11.3], [0, -1], 'upper');
  B.levelName = 'upper'; B.room = 'bedroom2';
  B.furniture('wood', 14.3, 11.3, 4.2, 0.5, 0.75, 0.5, 'bedside table'); candle({ id: 'candle-bedroom2', pos: [14.3, 4.95, 11.3], n: [0, -1] });
  B.levelName = 'upper'; B.room = "eleanor's sitting room";
  B.furniture('darkWood', -15.5, -0.5, 4.2, 0.4, 0.75, 0.4, 'side table'); candle({ id: 'candle-eleanor', pos: [-15.5, 4.95, -0.5], n: [1, 0] });
  B.levelName = 'upper'; B.room = 'gallery';
  B.furniture('darkWood', 12.0, -0.2, 4.2, 0.5, 0.8, 0.5, 'gallery stand'); candle({ id: 'candle-gallery', pos: [12.0, 5.0, -0.2], n: [0, 1] });
  B.levelName = 'upper'; B.room = "eleanor's bedroom";
  B.furniture('wood', -13.9, -9.6, 4.2, 0.4, 0.7, 0.4, 'bedside stand'); candle({ id: 'candle-eleanor-bed', pos: [-13.9, 4.9, -9.6], n: [1, 0] });
  B.levelName = 'upper'; B.room = 'nursery';
  B.furniture('wood', 12.5, -8.5, 4.2, 0.5, 0.8, 0.5, 'nursery table'); candle({ id: 'candle-nursery', pos: [12.5, 5.0, -8.5], n: [0, 1] });
  C('candle-linen', 'linen', [0.6, 5.4, -11.2], [0, 1], 'upper');
  C('candle-attic', 'attic', [-13.0, 8.8, 3.2], [0, -1], 'attic');
  B.levelName = 'cellar'; B.room = 'cellar';
  B.furniture('wood', -10.0, -11.5, -3.2, 0.5, 0.8, 0.5, 'cellar stand'); candle({ id: 'candle-cellar', pos: [-10.0, -2.4, -11.5], n: [0, 1] });
  C('candle-clock', 'clock room', [2.6, 15.7, 11.2], [0, -1], 'clock');
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lodge';
  B.furniture('wood', -13.5, 85.0, 0, 0.5, 0.9, 0.5, 'shelf'); candle({ id: 'candle-lodge', pos: [-13.5, 0.9, 85.0], n: [1, 0] });
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'house';
};
})();
