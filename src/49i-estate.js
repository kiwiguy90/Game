/* ==========================================================================
   BLACKTHORN MANOR — 6q. THE GLASS HOUSE, THE STABLES AND THE LAKE
   Three places out in the dark, each with its own switch on the estate panel:
   - the glass house, north-west of the house: a white-painted Victorian
     range of glass on a dwarf brick wall, palms and orange trees inside,
     that lights up from within like a lantern;
   - the stables, west of the house: five loose boxes and a tack room round a
     cobbled yard, a lantern over every door, the names still over the boxes;
   - the lake, north-east: a boathouse on the south shore with a skiff in its
     slip, a jetty out into the water with a rowing boat tied at the end, and
     lanterns on posts whose light lies on the water.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const GH = { x0: -52, x1: -38, z0: -28, z1: -20, wall: 0.6, eave: 3.0, ridge: 5.0 };
const ST = { x0: -58, x1: -40, z0: -4, z1: 2, eave: 3.0, ridge: 5.2 };
const LK = { cx: 50, cz: -33, rx: 10.5, rz: 14, y: 0.04 };
const BH = { x0: 46, x1: 52, z0: -22, z1: -14, eave: 2.8, ridge: 4.6 };
const JT = { x0: 38.0, xs: 39.4, x1: 47.5, z0: -34, z1: -32, y: 0.35 };
BM.ESTATE_PLACES = { GH, ST, LK, BH, JT };

/* the lake's shore: an ellipse, pushed in and out a little so it looks dug by nature, not a compass */
function shore(a) {
  const k = 1 + 0.06 * Math.sin(a * 3 + 0.7) + 0.04 * Math.sin(a * 5 + 2.1);
  return [LK.cx + Math.sin(a) * LK.rx * k, LK.cz + Math.cos(a) * LK.rz * k];
}
BM.inLake = (x, z, m) => {
  const a = Math.atan2(x - LK.cx, z - LK.cz), [sx, sz] = shore(a);
  return Math.hypot(x - LK.cx, z - LK.cz) < Math.hypot(sx - LK.cx, sz - LK.cz) + (m || 0);
};

/* a soft pool of light on the water (or the stone) under a lamp: additive, following its lamp */
const glowGeo = (() => { const g = new THREE.CircleGeometry(0.5, 20); g.rotateX(-Math.PI / 2); g.userData.canonical = 'fitting:glowdisc'; return g; })();
function glowTex() {
  if (glowTex.t) return glowTex.t;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (glowTex.t = new THREE.CanvasTexture(c));
}

BM.buildEstatePlaces = function (B, game) {
  const P = B.phys;
  B.zone = 'estate'; B.levelName = 'ground';
  const glows = [];
  const estate = (group, o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:' + group }, o)); game.estateLights[group].push(l.id); return l; };
  const glow = (l, x, y, z, r, tint) => {
    const m = new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(glowGeo, m); mesh.position.set(x, y, z); mesh.scale.set(r * 2, 1, r * 2); mesh.renderOrder = 5;
    mesh.userData.dynamic = true; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); B.root.add(mesh);
    glows.push({ l, m, tint: new THREE.Color(tint || 0xffc070) });
  };
  const post = (group, id, name, x, z, h, glowR) => {
    const l = estate(group, { id, name, kind: 'incandescent', style: 'street', pos: [x, h || 2.5, z], colour: 0xffc27a, target: 0.75, range: 8 });
    P.addWall(x - 0.12, x + 0.12, z - 0.12, z + 0.12, 0, 2.4, { kind: 'tree', occludes: false, tag: 'lamp post' });
    if (glowR) glow(l, x, LK.y + 0.02, z, glowR);
    return l;
  };
  const hay = new THREE.MeshLambertMaterial({ color: 0xb09a62 });
  const white = 'white';

  /* ======================= THE GLASS HOUSE ======================= */
  B.room = 'glass house';
  { const { x0, x1, z0, z1, wall, eave, ridge } = GH, zm = (z0 + z1) / 2;
    const glassWall = (ax0, ax1, az0, az1) => P.addWall(ax0, ax1, az0, az1, 0, eave, { kind: 'glass' });
    // the dwarf wall, the glass, the white-painted glazing bars
    for (const z of [z0, z1]) {
      B.boxE('brick', x0, x1, 0, wall, z - 0.15, z + 0.15);
      B.boxE('gothicTrim', x0 - 0.05, x1 + 0.05, wall, wall + 0.06, z - 0.2, z + 0.2);
      B.boxE('glass', x0, x1, wall + 0.06, eave, z - 0.01, z + 0.01).userData.glass = true;
      glassWall(x0, x1, z - 0.15, z + 0.15);
      for (let x = x0; x <= x1 + 0.01; x += 0.875) B.boxE(white, x - 0.035, x + 0.035, wall, eave, z - 0.05, z + 0.05);
      B.boxE(white, x0, x1, eave - 0.08, eave, z - 0.08, z + 0.08);
      B.boxE(white, x0, x1, 1.9, 1.95, z - 0.04, z + 0.04);
    }
    for (const x of [x0, x1]) {
      const door = x === x1;
      const segs = door ? [[z0, zm - 0.6], [zm + 0.6, z1]] : [[z0, z1]];
      for (const [a, b] of segs) {
        B.boxE('brick', x - 0.15, x + 0.15, 0, wall, a, b);
        B.boxE('glass', x - 0.01, x + 0.01, wall, eave, a, b).userData.glass = true;
        glassWall(x - 0.15, x + 0.15, a, b);
        for (let z = a; z <= b + 0.01; z += (b - a) / Math.max(1, Math.round((b - a) / 0.9))) B.boxE(white, x - 0.05, x + 0.05, wall, eave, z - 0.035, z + 0.035);
      }
      // the gable: a glass triangle on a white frame
      B.mesh(G.wedge, 'glass', x, eave, zm, 0.02, ridge - eave, z1 - z0).userData.glass = true;
      B.mesh(G.wedge, white, x, eave - 0.01, zm, 0.1, 0.12, z1 - z0 + 0.1);
      if (door) {
        B.boxE(white, x - 0.08, x + 0.08, 2.4, eave, zm - 0.62, zm + 0.62);
        // two glazed doors, folded back against the glass
        for (const s of [-1, 1]) { B.boxE(white, x + 0.05, x + 0.65, 0, 2.4, zm + s * 0.62 - 0.03, zm + s * 0.62 + 0.03);
          B.boxE('glass', x + 0.12, x + 0.58, 0.9, 2.3, zm + s * 0.62 - 0.035, zm + s * 0.62 + 0.035).userData.glass = true; }
      }
    }
    B.doorways.push({ id: 'glasshouse-door', x: x1, z: zm, y: 0, axis: 'z', width: 1.2, thick: 0.3, zone: B.zone, room: B.room });
    // the roof: two slopes of glass on white rafters, a ridge with cast cresting
    const half = (z1 - z0) / 2, ang = Math.atan2(ridge - eave, half), slope = half / Math.cos(ang);
    for (const s of [-1, 1]) {
      const r = B.box('glass', (x0 + x1) / 2, (eave + ridge) / 2, zm + s * half / 2, x1 - x0, 0.02, slope); r.rotation.x = s * ang; r.updateMatrix(); r.userData.glass = true;
      for (let x = x0; x <= x1 + 0.01; x += 0.875) { const b = B.box(white, x, (eave + ridge) / 2 + 0.03, zm + s * half / 2, 0.06, 0.08, slope); b.rotation.x = s * ang; b.updateMatrix(); }
    }
    B.boxE(white, x0 - 0.1, x1 + 0.1, ridge - 0.02, ridge + 0.12, zm - 0.08, zm + 0.08);
    for (let x = x0 + 0.3; x < x1; x += 0.6) B.mesh(G.sphere, 'iron', x, ridge + 0.2, zm, 0.08, 0.12, 0.08);
    for (const x of [x0, x1]) B.mesh(G.pyramid, white, x, ridge + 0.35, zm, 0.18, 0.5, 0.18);
    P.rect(x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, eave + 0.1, eave, 'glasshouse-roof');
    // inside: a tiled walk down the middle, raised beds either side
    B.boxE('tile', x0 + 0.15, x1 - 0.15, 0, 0.03, zm - 1.0, zm + 1.0);
    for (const [a, b] of [[z0 + 0.4, zm - 1.0], [zm + 1.0, z1 - 0.4]]) {
      B.solid('brick', x0 + 0.4, x1 - 0.8, 0, 0.55, a, b, { kind: 'furniture', tag: 'planting bed' });
      B.boxE('soil', x0 + 0.5, x1 - 0.9, 0.55, 0.6, a + 0.1, b - 0.1);
    }
    // palms, orange trees in tubs, ferns
    const orange = new THREE.MeshLambertMaterial({ color: 0xe0801c, emissive: 0x2a1000 });
    const palm = (x, z, h) => {
      B.mesh(G.cyl, 'bark', x, 0.6 + h / 2, z, 0.18, h, 0.18);
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2;
        const f = B.mesh(G.cone, 'leaves', x + Math.sin(a) * 0.55, 0.6 + h - 0.1, z + Math.cos(a) * 0.55, 0.35, 1.4, 0.12);
        f.rotation.set(Math.cos(a) * 1.15, 0, -Math.sin(a) * 1.15); f.updateMatrix(); }
    };
    const citrus = (x, z) => {
      B.mesh(G.cyl, 'darkWood', x, 0.85, z, 0.55, 0.5, 0.55);
      B.mesh(G.cyl, 'bark', x, 1.4, z, 0.07, 0.8, 0.07);
      B.mesh(G.sphere, 'leavesDark', x, 2.0, z, 1.0, 0.85, 1.0);
      for (let i = 0; i < 9; i++) { const a = i * 2.4, y = 1.75 + (i % 3) * 0.22; B.mesh(G.sphere, orange, x + Math.sin(a) * 0.47, y, z + Math.cos(a) * 0.47, 0.09); }
    };
    for (const z of [z0 + 1.6, z1 - 1.6]) {
      palm(x0 + 1.6, z, 2.6); citrus(x0 + 4.4, z); palm(x0 + 7.2, z, 2.1); citrus(x0 + 9.8, z);
      for (let x = x0 + 0.9; x < x1 - 1.2; x += 0.8) B.mesh(G.cone, 'leaves', x, 0.85, z + ((x * 7) % 1 - 0.5) * 0.9, 0.5, 0.5, 0.5);
    }
    B.furniture('wood', x0 + 0.6, zm, 0, 0.5, 0.45, 1.5, 'garden bench');
    B.readable('glasshouse-label', 'A plant label', 'A slate label pushed into the soil of the orange tub, the chalk long gone but the scratches still there:\n\nSEVILLE ORANGE\nraised from a pip by E.B. aged 9\nMarch 1958\n\nThe tree is still alive. Somebody has been watering it.', [x0 + 4.4, 0.62, zm - 1.05], [0, 1], { plaque: true });
    // the lights: lanterns hung from the ridge, uplights among the plants, and the glass lit from inside
    const lit = [];
    for (const x of [x0 + 2.8, (x0 + x1) / 2, x1 - 2.8]) {
      lit.push(estate('glasshouse', { id: 'glasshouse-lantern' + lit.length, name: 'Glass house lantern', kind: 'incandescent', style: 'lantern', pos: [x, 3.3, zm], colour: 0xffcf8a, target: 0.9, range: 8 }));
      B.mesh(G.post, 'iron', x, 4.1, zm, 0.015, 1.4, 0.015);
    }
    for (const [x, z] of [[x0 + 1.6, z0 + 1.6], [x0 + 7.2, z1 - 1.6]]) lit.push(estate('glasshouse', { id: 'glasshouse-up' + lit.length, name: 'Glass house uplight', kind: 'incandescent', style: 'none', pos: [x, 0.8, z], spot: true, dir: [0, 1, 0], colour: 0xd8ffb8, target: 0.6, range: 5, corona: 0 }));
    // the inside of the glass catching the light: a warm haze on every pane, seen from out in the dark
    const haze = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const hz = [];
    for (const z of [z0 + 0.03, z1 - 0.03]) hz.push(B.mesh(G.plane, haze, (x0 + x1) / 2, (wall + eave) / 2, z, x1 - x0, eave - wall, 1));
    for (const x of [x0 + 0.03, x1 - 0.03]) hz.push(B.mesh(G.plane, haze, x, (wall + eave) / 2, zm, z1 - z0, eave - wall, 1, Math.PI / 2));
    for (const s of [-1, 1]) { const r = B.mesh(G.plane, haze, (x0 + x1) / 2, (eave + ridge) / 2 - 0.04, zm + s * half / 2, x1 - x0, slope, 1); r.rotation.set(-Math.PI / 2 + s * ang, 0, 0); r.updateMatrix(); hz.push(r); }
    for (const m of hz) { m.userData.dynamic = true; m.renderOrder = 4; }
    game.glasshouse = { lit, haze };
  }

  /* ======================= THE STABLES ======================= */
  B.room = 'stables';
  { const { x0, x1, z0, z1, eave, ridge } = ST, zm = (z0 + z1) / 2;
    const boxes = [-53.5, -50.5, -47.5, -44.5, -41.5], names = ['BESS', 'CAPTAIN', 'TANSY', 'DUKE', 'MARIGOLD'];
    const EXT = { t: 0.3, mat: 'plaster', matOut: 'brick', y1: eave };
    B.wall('x', z1, x0, x1, Object.assign({ outSign: 1 }, EXT), [{ at: -56.5, w: 1.0, type: 'door', head: 2.1, id: 'tack-door' }]
      .concat(boxes.map((x, i) => ({ at: x, w: 1.2, type: 'lancet', sill: 1.15, head: 2.25, id: 'stable-box-' + i }))));
    B.wall('x', z0, x0, x1, Object.assign({ outSign: -1 }, EXT));
    B.wall('z', x0, z0, z1, Object.assign({ outSign: -1 }, EXT));
    B.wall('z', x1, z0, z1, Object.assign({ outSign: 1 }, EXT));
    B.wall('z', -55, z0 + 0.15, z1 - 0.15, { t: 0.2, mat: 'plaster', y1: eave });
    for (const x of [-52, -49, -46, -43]) B.wall('z', x, z0 + 0.15, z1 - 0.15, { t: 0.12, mat: 'boards', y1: eave });
    B.boxE('plaster', x0 + 0.15, x1 - 0.15, eave - 0.02, eave, z0 + 0.15, z1 - 0.15);
    P.rect(x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, eave + 0.2, eave, 'stables-roof');
    const half = (z1 - z0) / 2 + 0.45, ang = Math.atan2(ridge - eave, half - 0.45);
    for (const s of [-1, 1]) { const r = B.box('slate', (x0 + x1) / 2, (eave + ridge) / 2 + 0.05, zm + s * half / 2, x1 - x0 + 0.7, 0.16, half / Math.cos(ang) + 0.1); r.rotation.x = s * ang; r.updateMatrix(); }
    B.box('gothicTrim', (x0 + x1) / 2, ridge + 0.05, zm, x1 - x0 + 0.75, 0.14, 0.26);
    for (const x of [x0, x1]) B.mesh(G.wedge, 'brick', x, eave, zm, 0.3, ridge - eave, z1 - z0 + 0.3);
    // each loose box: a half-door shut below, the top leaf hooked back, straw, a hay rack, a name over the door
    boxes.forEach((x, i) => {
      B.boxE('shutter', x - 0.6, x + 0.6, 0, 1.15, z1 + 0.15, z1 + 0.2);
      B.boxE('shutter', x - 0.6, x + 0.6, 0, 1.15, z1 - 0.2, z1 - 0.15);
      B.boxE('darkWood', x - 0.62, x + 0.62, 1.12, 1.2, z1 + 0.13, z1 + 0.25);                      // the rail along the top of the half-door
      B.boxE('shutter', x - 1.85, x - 0.65, 1.2, 2.2, z1 + 0.16, z1 + 0.21);                        // the top leaf, back against the wall
      B.boxE('iron', x - 0.7, x - 0.62, 1.65, 1.68, z1 + 0.16, z1 + 0.24);
      B.mesh(G.plane, BM.labelMat(names[i], { w: 256, h: 64, size: 36, bg: '#3a2e1a', fg: '#d8b860', border: '#7a6a3a' }), x, 2.45, z1 + 0.16, 0.7, 0.18, 1);
      B.boxE(hay, x - 1.35, x + 1.35, 0, 0.04, z0 + 0.2, z1 - 0.2);
      B.boxE('darkWood', x - 0.6, x + 0.6, 1.4, 1.9, z0 + 0.16, z0 + 0.5);
      B.boxE(hay, x - 0.55, x + 0.55, 1.5, 1.85, z0 + 0.18, z0 + 0.45);
      B.mesh(G.cyl, 'metal', x + 0.9, 0.18, z0 + 0.5, 0.32, 0.36, 0.32);
      glow(estate('stables', { id: 'stable-lantern' + i, name: 'Stable lantern', kind: 'incandescent', style: 'lantern', pos: [x + 0.98, 2.35, z1 + 0.32], nz: 1, colour: 0xffbe70, target: 1.0, range: 7 }), x + 0.4, 0.05, z1 + 1.3, 1.7);
    });
    glow(estate('stables', { id: 'stable-lantern-tack', name: 'Stable lantern', kind: 'incandescent', style: 'lantern', pos: [-55.55, 2.35, z1 + 0.32], nz: 1, colour: 0xffbe70, target: 1.0, range: 7 }), -56.1, 0.05, z1 + 1.3, 1.7);
    // the tack room
    B.room = 'tack room';
    game.tackDoor = B.hingedDoor({ id: 'tack-door', axis: 'x', at: -56.5, c: z1, w: 1.0, h: 2.1, hinge: 'low', swing: -1, mat: 'shutter', panelMat: 'boards', dur: 1.3, sound: 'creak', label: 'the tack room door', wallT: 0.3 });
    B.boxE('boards', x0 + 0.15, -55.1, 0, 0.03, z0 + 0.15, z1 - 0.15);
    for (const z of [-3.0, -1.6, -0.2]) {                                                               // saddles on their racks
      // a saddle horse out from the wall: a ridged rack, the saddle astride it with its skirts and flaps hanging, the stirrups run up
      B.boxE('darkWood', x0 + 0.15, x0 + 0.75, 1.14, 1.2, z - 0.05, z + 0.05); B.boxE('darkWood', x0 + 0.15, x0 + 0.2, 0.9, 1.2, z - 0.05, z + 0.05);
      B.mesh(G.sphere, 'leather', x0 + 0.47, 1.26, z, 0.56, 0.16, 0.36);                          // the seat
      B.mesh(G.sphere, 'leather', x0 + 0.72, 1.31, z, 0.12, 0.14, 0.26);                          // the pommel
      B.mesh(G.sphere, 'leather', x0 + 0.24, 1.32, z, 0.1, 0.16, 0.32);                           // the cantle
      for (const s of [-1, 1]) {
        const f = B.box('leather', x0 + 0.5, 1.02, z + s * 0.2, 0.42, 0.42, 0.02); f.rotation.x = -s * 0.22; f.updateMatrix();   // the flaps
        B.box('iron', x0 + 0.55, 1.08, z + s * 0.23, 0.1, 0.02, 0.06);                                                      // stirrup irons, run up
      }
      B.box('linen', x0 + 0.47, 1.21, z, 0.6, 0.02, 0.5);                                         // the numnah under it
    }
    for (const z of [-3.4, -2.6]) B.boxE('leather', -55.25, -55.12, 1.2, 1.9, z - 0.03, z + 0.03); // bridles on their hooks
    B.furniture('darkWood', -56.4, -3.3, 0, 1.4, 0.55, 0.65, 'tack chest');
    B.readable('stud-book', 'The stable book', 'A ledger: feed, farrier, vet, in the groom\'s hand from 1946.\n\nThe last page:\n\n"Oct 1974. Tansy lame again — Miss E. sat up with her all night in the box.\nNov 1974. By order of Mr B., all horses to Knowle Farm. Tansy to go last.\nMiss E. would not come down to see her off."\n\nThen nothing. The rest of the book is blank.', [-56.4, 0.57, -3.3], [0, 1], { book: true });
    B.fixture({ id: 'tack-lamp', name: 'Tack room light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'cage', pos: [-56.5, 2.6, -1.0], colour: 0xffc27a, target: 0.8, range: 6 });
    B.lightSwitch('sw-tack', 'Tack room light', [-55.85, 1.4, z1 - 0.17], [0, -1], ['tack-lamp']);
    // the yard: cobbles, a trough, a mounting block, hay, two lamps on posts
    B.room = 'stable yard';
    B.boxE('gravelOld', x0, x1, 0, 0.025, z1 + 0.15, 12);
    B.solid('stone', -50.6, -48.4, 0, 0.7, 9.0, 9.8, { kind: 'furniture', tag: 'trough' });
    B.boxE('water', -50.45, -48.55, 0.6, 0.62, 9.12, 9.68);
    B.solid('stone', -42.6, -41.6, 0, 0.3, 5.6, 6.4, { kind: 'furniture', tag: 'mounting block' });
    B.boxE('stone', -42.6, -42.1, 0.3, 0.6, 5.6, 6.4);
    for (const [x, z, y] of [[-57.3, 6.2, 0], [-56.2, 6.2, 0], [-56.75, 6.2, 0.5]]) B.solid(hay, x - 0.5, x + 0.5, y, y + 0.5, z - 0.4, z + 0.4, { kind: 'furniture', tag: 'hay bale' });
    post('stables', 'stable-yard-lamp-w', 'Stable yard lamp', -57.4, 11.3, 2.7);
    post('stables', 'stable-yard-lamp-e', 'Stable yard lamp', -41.0, 11.3, 2.7);
  }

  /* ======================= THE LAKE ======================= */
  B.room = 'lake';
  { const N = 96, pts = [];
    for (let i = 0; i < N; i++) pts.push(shore(i / N * Math.PI * 2));
    const flat = (scale, key) => BM.statuaryGeo(key, () => {
      const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(LK.cx + (x - LK.cx) * scale, -(LK.cz + (z - LK.cz) * scale))));
      const g = new THREE.ShapeGeometry(sh, 2); g.rotateX(-Math.PI / 2); return g; });
    B.mesh(flat(1.08, 'lakeMud'), 'soil', 0, 0.02, 0, 1, 1, 1);
    const water = B.mesh(flat(1.0, 'lakeWater'), 'water', 0, LK.y, 0, 1, 1, 1); water.userData.dynamic = true;
    // the shore: stones and reeds all round, except where the jetty and the boathouse meet the water
    const gapJetty = (x, z) => x < LK.cx && Math.abs(z - (JT.z0 + JT.z1) / 2) < 1.6;
    const gapBoat = (x, z) => x > BH.x0 - 0.3 && x < BH.x1 + 0.3 && z > LK.cz;
    const per = []; let L = 0;
    for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N]; per.push([a, b, L]); L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const at = s => { s = ((s % L) + L) % L; for (const [a, b, l0] of per) { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s <= l0 + d) { const t = (s - l0) / d; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } } return pts[0]; };
    let k = 0;
    for (let s = 0; s < L; s += 0.7, k++) {
      const [x, z] = at(s);
      if (gapJetty(x, z) || gapBoat(x, z)) continue;
      B.mesh(G.lowSphere, 'stone', x, 0.1, z, 0.75 + (k % 3) * 0.12, 0.35, 0.65 + (k % 4) * 0.1);
      P.addWall(x - 0.32, x + 0.32, z - 0.32, z + 0.32, 0, 0.5, { kind: 'wall', occludes: false, structural: false, tag: 'lake shore' });
      if (k % 3 === 0) { const ix = LK.cx + (x - LK.cx) * 0.96, iz = LK.cz + (z - LK.cz) * 0.96;
        for (let r = 0; r < 4; r++) B.mesh(G.cone, 'longGrass', ix + Math.sin(r * 2.3 + k) * 0.25, 0.65, iz + Math.cos(r * 2.3 + k) * 0.25, 0.06, 1.3 + (r % 2) * 0.3, 0.06); }
    }
    // a rowing boat: a clinker hull, two thwarts, a pair of oars
    const hull = BM.statuaryGeo('rowingBoat', () => {
      const g = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setX(i, p.getX(i) * (1 - 0.75 * Math.max(0, z) * Math.max(0, z))); }
      g.computeVertexNormals(); return g; });
    const hullMat = new THREE.MeshLambertMaterial({ color: 0x3e4a3a, side: THREE.DoubleSide });
    const boats = [];
    const boat = (x, z, ry) => {
      const g = new THREE.Group(); g.position.set(x, LK.y + 0.32, z); g.rotation.y = ry; B.root.add(g);
      B.mesh(hull, hullMat, 0, 0, 0, 0.62, 0.38, 1.9, 0, g);
      for (const zz of [-0.5, 0.45]) B.box('wood', 0, -0.1, zz, 1.1, 0.04, 0.22, 0, g);
      for (const s of [-1, 1]) { const o = B.box('wood', s * 0.3, -0.05, 0.1, 0.05, 0.04, 2.2, 0, g); o.rotation.y = s * 0.12; }
      g.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
      boats.push({ g, x, z, ry, ph: boats.length * 1.9 });
    };
    // the jetty: a boardwalk out from the west shore on posts, a ramp up from the bank, rails you cannot see
    const zc = (JT.z0 + JT.z1) / 2;
    P.ramp(JT.x0, JT.xs, JT.z0, JT.z1, 'x', 0, JT.y, 0, 'jetty ramp');
    P.rect(JT.xs, JT.x1, JT.z0, JT.z1, JT.y, JT.y - 0.12, 'jetty');
    for (let x = JT.x0; x < JT.x1; x += 0.22) { const y = x < JT.xs ? JT.y * (x - JT.x0) / (JT.xs - JT.x0) : JT.y;
      B.boxE('wood', x, x + 0.2, Math.max(0.01, y - 0.06), y, JT.z0, JT.z1); }
    for (let x = JT.xs; x <= JT.x1; x += 1.6) for (const z of [JT.z0 + 0.05, JT.z1 - 0.05]) B.mesh(G.post, 'darkWood', x, 0.15, z, 0.16, 0.6, 0.16);
    for (const z of [JT.z0, JT.z1]) P.addWall(JT.x0 + 0.6, JT.x1, z - 0.1 + (z === JT.z0 ? -0.05 : 0.05), z + 0.1 + (z === JT.z0 ? -0.05 : 0.05), 0, 1.4, { kind: 'rail', occludes: false });
    P.addWall(JT.x1, JT.x1 + 0.15, JT.z0 - 0.2, JT.z1 + 0.2, 0, 1.4, { kind: 'rail', occludes: false });
    B.mesh(G.post, 'darkWood', JT.x1 - 0.1, 0.55, JT.z0 - 0.05, 0.2, 1.1, 0.2);     // the mooring post at the end
    boat(JT.x1 - 1.2, JT.z0 - 0.9, Math.PI / 2 + 0.08);
    for (const [x, z] of [[JT.xs + 0.2, JT.z0 - 0.14], [JT.xs + 0.2, JT.z1 + 0.14], [JT.x1 - 0.2, JT.z0 - 0.14], [JT.x1 - 0.2, JT.z1 + 0.14]])
      post('lake', 'jetty-lantern-' + (x > 45 ? 'out' : 'in') + (z < zc ? 's' : 'n'), 'Jetty lantern', x, z, 2.2, 1.9);
    // lanterns round the near shore, their light lying on the water
    for (const a of [0.45, 5.6, 5.15, 4.3]) { const [sx, sz] = shore(a), x = LK.cx + (sx - LK.cx) * 1.12, z = LK.cz + (sz - LK.cz) * 1.12;
      post('lake', 'lake-lantern-' + Math.round(a * 100), 'Lake lantern', x, z, 2.5, 2.4); }

    /* ---- the boathouse: on the south shore, its slip open to the lake ---- */
    B.room = 'boathouse';
    const { x0, x1, z0, z1, eave, ridge } = BH, xm = (x0 + x1) / 2;
    const BEXT = { t: 0.25, mat: 'boards', y1: eave };
    B.wall('z', x0, z0, z1, BEXT);
    B.wall('z', x1, z0, z1, BEXT);
    B.wall('x', z1, x0, x1, BEXT, [{ at: xm, w: 1.1, type: 'door', head: 2.1, id: 'boathouse-door' }]);
    B.boxE('boards', x0, x1, 2.3, eave, z0 - 0.12, z0 + 0.12);                                                 // the header over the water door
    P.addWall(x0, x1, z0 - 0.12, z0 + 0.12, 2.3, eave, { kind: 'wall' });
    // a walk round three sides of the slip, the slip itself full of lake
    const S = { x0: 47.3, x1: 50.7, z1: -16.6 };
    B.boxE('boards', x0 + 0.12, x1 - 0.12, 0, 0.06, S.z1, z1 - 0.12);
    B.boxE('boards', x0 + 0.12, S.x0, 0, 0.06, z0, S.z1); B.boxE('boards', S.x1, x1 - 0.12, 0, 0.06, z0, S.z1);
    B.boxE('water', S.x0, S.x1, -0.05, LK.y, z0, S.z1);
    for (const [a, b, c, d] of [[S.x0 - 0.06, S.x0, z0, S.z1], [S.x1, S.x1 + 0.06, z0, S.z1], [S.x0, S.x1, S.z1 - 0.06, S.z1], [x0, S.x0, z0 - 0.06, z0], [S.x1, x1, z0 - 0.06, z0]])
      P.addWall(a, b, c, d, 0, 0.6, { kind: 'rail', occludes: false });
    B.boxE('darkWood', S.x0 - 0.08, S.x0, 0.06, 0.16, z0, S.z1); B.boxE('darkWood', S.x1, S.x1 + 0.08, 0.06, 0.16, z0, S.z1);
    boat(xm, -19.4, 0.03);
    // oars and a lifebuoy on the walls, a workbench by the door
    for (const z of [-20.5, -19.2]) { const o = B.box('wood', x0 + 0.2, 1.4, z, 0.05, 0.05, 2.4); o.rotation.x = 1.2; o.updateMatrix(); }
    { const buoy = B.mesh(G.ring, new THREE.MeshLambertMaterial({ color: 0xb03a28, side: THREE.DoubleSide }), x1 - 0.14, 1.6, -18.0, 0.6, 0.6, 0.6, Math.PI / 2); void buoy; }
    B.furniture('wood', x0 + 0.55, -15.4, 0, 0.7, 0.85, 1.6, 'workbench');
    B.readable('boathouse-log', 'A chalkboard', 'A blackboard screwed to the boathouse wall, for who had the boats out:\n\nSKIFF — Mr B. — fishing\nPUNT — Miss E. — island\n\nThe chalk under Miss E.\'s line has been gone over again and again, as if someone kept rewriting it so it would not fade.', [x0 + 0.15, 1.5, -16.0], [1, 0], { plaque: true });
    // the roof, gable to the lake
    const half = (x1 - x0) / 2 + 0.35, ang = Math.atan2(ridge - eave, half - 0.35);
    for (const s of [-1, 1]) { const r = B.box('slate', xm + s * half / 2, (eave + ridge) / 2 + 0.05, (z0 + z1) / 2, half / Math.cos(ang) + 0.1, 0.14, z1 - z0 + 0.6); r.rotation.z = -s * ang; r.updateMatrix(); }
    for (const z of [z0, z1]) B.mesh(G.wedge, 'boards', xm, eave, z, 0.2, ridge - eave, x1 - x0 + 0.25, Math.PI / 2);
    B.boxE('plaster', x0 + 0.12, x1 - 0.12, eave - 0.02, eave, z0, z1 - 0.12);
    P.rect(x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, eave + 0.2, eave, 'boathouse-roof');
    estate('lake', { id: 'boathouse-lamp', name: 'Boathouse light', kind: 'incandescent', style: 'cage', pos: [xm, 2.5, -18.5], colour: 0xffc27a, target: 0.9, range: 7 });
    const door = estate('lake', { id: 'boathouse-lantern', name: 'Boathouse lantern', kind: 'incandescent', style: 'lantern', pos: [xm + 0.95, 2.25, z1 + 0.28], nz: 1, colour: 0xffbe70, target: 0.7, range: 6 });
    glow(door, xm + 0.95, 0.05, z1 + 1.2, 1.8);
    game.lake = { boats, water };
  }
  game.estateGlows = glows;
  B.zone = 'exterior'; B.room = 'grounds';
};

BM.updateEstatePlaces = function (game, dt, t) {
  const c = new THREE.Color();
  for (const g of game.estateGlows || []) { const l = g.l, k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0; g.m.color.copy(g.tint).multiplyScalar(0.55 * k); }
  const G1 = game.glasshouse;
  if (G1) { let k = 0; for (const l of G1.lit) k = Math.max(k, l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0); c.setRGB(0.075, 0.056, 0.028).multiplyScalar(k); G1.haze.color.copy(c); }
  const L = game.lake;
  if (L) for (const b of L.boats) { b.g.position.y = (b.base !== undefined ? b.base : LK.y + 0.3) + Math.sin(t * 1.3 + b.ph) * 0.025; b.g.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.035; b.g.rotation.y = b.ry + Math.sin(t * 0.4 + b.ph) * 0.03; }
};
})();
