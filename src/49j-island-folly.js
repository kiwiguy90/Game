/* ==========================================================================
   BLACKTHORN MANOR — 6r. THE ISLAND AND THE FOLLY
   - The island: out in the lake, off the end of the jetty, a little round
     temple under a dome — the summerhouse Eleanor rowed out to when she
     wanted to be where nobody could follow without a boat. You row out from
     the jetty and back again. Its lantern and uplights are on the lake group.
   - The folly: a gothic tower built for nothing but the view, out past the
     pond. Three storeys of steep stair inside, a parapet on top, and a brass
     plate pointing out everything you can see. Floodlit from the ground,
     with a beacon on the top: the folly group on the estate panel.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const IS = { cx: 54.6, cz: -37.2, r: 3.4, y: 0.06 };
const RT = { cx: 55.1, cz: -37.5, r: 1.75, plinth: 0.18, top: 2.9 };
const FO = { cx: 52.6, cz: 74.4, hx: 1.3, hz: 3.2, t: 0.4, floors: [0, 3.0, 6.0, 9.0], parapet: 1.15 };
BM.ISLAND = IS; BM.FOLLY = FO;

function washTexture() {
  if (washTexture.t) return washTexture.t;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  for (let y = 0; y < 128; y++) {
    const v = 1 - y / 128, w = 8 + (1 - v) * 24, a = 0.55 * Math.pow(v, 1.2);
    const gr = g.createLinearGradient(32 - w, 0, 32 + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 127 - y, 64, 1);
  }
  return (washTexture.t = new THREE.CanvasTexture(c));
}

BM.buildIslandFolly = function (B, game) {
  const P = B.phys;
  B.zone = 'estate'; B.levelName = 'ground';
  const washes = [];
  const estate = (group, o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:' + group }, o)); game.estateLights[group].push(l.id); return l; };
  const washMats = new Map();
  const wash = (l, x, y0, z, nx, nz, w, h) => {
    let m = washMats.get(l);
    if (!m) { m = new THREE.MeshBasicMaterial({ map: washTexture(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); washMats.set(l, m); }
    const mesh = B.mesh(G.plane, m, x + nx * 0.03, y0 + h / 2, z + nz * 0.03, w, h, 1, Math.atan2(nx, nz)); mesh.userData.dynamic = true; mesh.renderOrder = 5;
    if (!washes.some(e => e.m === m)) washes.push({ l, m });
  };
  const LK = BM.ESTATE_PLACES.LK, JT = BM.ESTATE_PLACES.JT;

  /* ======================= THE ISLAND ======================= */
  B.room = 'island';
  { const { cx, cz, r } = IS;
    // the island itself: a low grassy mound with a stony edge you cannot step off
    B.mesh(G.cyl, 'grass', cx, IS.y / 2, cz, r * 2 + 0.6, IS.y, r * 2 + 0.6);
    B.mesh(G.cyl, 'soil', cx, IS.y / 2 - 0.01, cz, r * 2 + 1.2, IS.y - 0.02, r * 2 + 1.2);
    const N = 30;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2, x = cx + Math.sin(a) * (r + 0.2), z = cz + Math.cos(a) * (r + 0.2);
      const landing = Math.abs(Math.sin(a) + 1) < 0.08 && Math.cos(a) > -0.2;               // the west side, where the landing stage is
      if (!landing) B.mesh(G.lowSphere, 'stone', x, 0.1, z, 0.8, 0.35, 0.7);
      P.addWall(x - 0.36, x + 0.36, z - 0.36, z + 0.36, 0, 1.2, { kind: 'rail', occludes: false, tag: 'the island\'s edge' });
      if (i % 4 === 1) for (let k = 0; k < 4; k++) B.mesh(G.cone, 'longGrass', x + Math.sin(k * 2.1 + i) * 0.3, 0.65, z + Math.cos(k * 2.1 + i) * 0.3, 0.06, 1.3, 0.06);
    }
    // the landing stage, and the punt tied up alongside
    const LX = cx - r - 0.6;
    B.boxE('wood', LX - 0.9, cx - r + 0.4, 0.06, 0.16, cz - 0.8, cz + 0.8);
    for (const [x, z] of [[LX - 0.85, cz - 0.75], [LX - 0.85, cz + 0.75]]) B.mesh(G.post, 'darkWood', x, 0.3, z, 0.14, 0.9, 0.14);
    const punt = new THREE.Group(); punt.position.set(LX - 1.6, LK.y + 0.18, cz + 0.2); B.root.add(punt);
    B.box('darkWood', 0, 0, 0, 0.95, 0.26, 3.2, 0, punt); B.box('wood', 0, 0.12, 0, 0.82, 0.04, 3.0, 0, punt);
    B.box('wood', 0, 0.18, 0.6, 0.85, 0.05, 0.25, 0, punt);
    punt.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
    game.lake.boats.push({ g: punt, x: punt.position.x, z: punt.position.z, ry: 0, ph: 4.2, base: LK.y + 0.18 });
    // the way across: the rowing boat at the jetty takes you out, the punt brings you back
    const jettyEnd = { x: JT.x1 - 0.9, y: JT.y, z: (JT.z0 + JT.z1) / 2 }, ashore = { x: cx - r + 1.2, y: 0, z: cz };
    B.interactable({ id: 'row-to-island', kind: 'ladder', label: 'Row out to the island', pos: [JT.x1 - 0.15, JT.y + 0.5, JT.z0 + 0.2], n: [-1, 0], approachDist: 0.75, floorY: JT.y,
      links: [ashore], act: g => { g.climb(ashore, -Math.PI / 2, { dur: 3.2, sound: 'oars' }); g.ui.say('You climb down into the boat and pull out across the black water. The rain hisses on the lake all round you. The island comes up out of the dark.', 5); } });
    B.interactable({ id: 'row-to-jetty', kind: 'ladder', label: 'Row back to the jetty', pos: [cx - r - 0.1, 0.5, cz + 0.5], n: [1, 0], approachDist: 0.95,
      links: [jettyEnd], act: g => { g.climb(jettyEnd, Math.PI / 2, { dur: 3.2, sound: 'oars' }); g.ui.say('You push off in the punt and pole back across to the jetty lanterns.', 4); } });
    // a weeping willow over the water
    const WX = cx - 1.2, WZ = cz + 2.3;
    B.mesh(G.cyl, 'bark', WX, 1.4, WZ, 0.4, 2.8, 0.4);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2;
      B.mesh(G.cone, 'leaves', WX + Math.sin(a) * 1.25, 1.75, WZ + Math.cos(a) * 1.25, 0.75, 2.6, 0.75); }
    B.mesh(G.sphere, 'leaves', WX, 3.0, WZ, 2.6, 1.3, 2.6);
    P.addWall(WX - 0.2, WX + 0.2, WZ - 0.2, WZ + 0.2, 0, 3, { kind: 'tree', tag: 'willow' });

    // the summerhouse: six columns in a ring on a round plinth, an entablature, a shallow dome
    const T = RT;
    P.arc(T.cx, T.cz, 0, T.r + 0.25, -Math.PI, Math.PI, T.plinth, T.plinth, 0, 'rotunda');
    B.mesh(G.cyl, 'statue', T.cx, T.plinth / 2, T.cz, (T.r + 0.25) * 2, T.plinth, (T.r + 0.25) * 2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, x = T.cx + Math.sin(a) * T.r, z = T.cz + Math.cos(a) * T.r;
      B.mesh(G.cyl, 'statue', x, T.plinth + 0.08, z, 0.42, 0.16, 0.42);
      B.mesh(G.cyl, 'marble', x, T.plinth + (T.top - T.plinth) / 2, z, 0.28, T.top - T.plinth - 0.3, 0.28);
      B.mesh(G.cyl, 'statue', x, T.top - 0.1, z, 0.42, 0.2, 0.42);
      P.addWall(x - 0.16, x + 0.16, z - 0.16, z + 0.16, 0, T.top, { kind: 'wall', tag: 'column' }); }
    B.mesh(G.cyl, 'statue', T.cx, T.top + 0.18, T.cz, (T.r + 0.35) * 2, 0.36, (T.r + 0.35) * 2);
    B.mesh(G.sphere, 'statueWorn', T.cx, T.top + 0.36, T.cz, (T.r + 0.15) * 2, 1.8, (T.r + 0.15) * 2);
    B.mesh(G.sphere, 'statue', T.cx, T.top + 1.3, T.cz, 0.28, 0.4, 0.28);
    P.rect(T.cx - T.r, T.cx + T.r, T.cz - T.r, T.cz + T.r, T.top + 0.4, T.top, 'rotunda roof');
    // inside: a stone seat, an urn, and a biscuit tin wrapped in oilcloth
    B.furniture('stone', T.cx + 0.9, T.cz, T.plinth, 0.5, 0.45, 1.5, 'garden bench');
    B.mesh(G.cyl, 'statueWorn', T.cx - 0.3, T.plinth + 0.35, T.cz - 0.9, 0.5, 0.7, 0.5);
    B.box('rust', T.cx + 0.9, T.plinth + 0.5, T.cz + 0.35, 0.28, 0.1, 0.22);
    B.readable('island-letter', 'A tin of letters', 'A biscuit tin wrapped in oilcloth, tucked under the seat. Inside, a bundle of letters in a girl\'s round hand, never sent. The one on top:\n\n"October 1974.\nThey want my name on the papers by Christmas. I won\'t. Father says that if I won\'t sign then I can\'t leave, and he means it — the gates, the car, the trains.\n\nSo I row out here, where nobody can follow me without a boat, and I write.\n\nThe orange tree is doing well. Tansy has gone.\n\nIf anyone ever reads this: put the lights on. All of them. I want this house to be seen.\n— E."', [T.cx + 0.9, T.plinth + 0.46, T.cz + 0.35], [-1, 0], { visual: false });
    // the lights: a lantern hung under the dome, the columns lit from their feet, lanterns at the landing
    const lantern = estate('lake', { id: 'island-lantern', name: 'Summerhouse lantern', kind: 'incandescent', style: 'lantern', pos: [T.cx, T.top - 0.55, T.cz], colour: 0xffc98a, target: 0.9, range: 7 });
    B.mesh(G.post, 'iron', T.cx, T.top - 0.18, T.cz, 0.015, 0.35, 0.015);
    const up = estate('lake', { id: 'island-uplight', name: 'Summerhouse uplight', kind: 'incandescent', style: 'none', pos: [T.cx, 0.4, T.cz + T.r + 0.6], spot: true, dir: [0, 1, -0.6], colour: 0xfff0d8, target: 0.7, range: 7, corona: 0 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, nx = Math.sin(a), nz = Math.cos(a);
      wash(up, T.cx + nx * (T.r + 0.16), T.plinth, T.cz + nz * (T.r + 0.16), nx, nz, 0.5, T.top - T.plinth); }
    for (const dz of [-0.85, 0.85]) {
      estate('lake', { id: 'island-landing-' + (dz < 0 ? 'n' : 's'), name: 'Island lantern', kind: 'incandescent', style: 'street', pos: [LX + 0.2, 2.2, cz + dz * 1.4], colour: 0xffc27a, target: 0.7, range: 7 });
      P.addWall(LX + 0.08, LX + 0.32, cz + dz * 1.4 - 0.12, cz + dz * 1.4 + 0.12, 0, 2.2, { kind: 'tree', occludes: false, tag: 'lamp post' });
    }
    void lantern;
  }

  /* ======================= THE FOLLY ======================= */
  B.room = 'folly';
  { const { cx, cz, hx, hz, t, floors, parapet } = FO, top = floors[3];
    const x0 = cx - hx, x1 = cx + hx, z0 = cz - hz, z1 = cz + hz;
    const EXT = { t, mat: 'stone', matOut: 'gothicStone' };
    // the walls, a storey at a time, a lancet in every face; the door on the north side, toward the path
    for (let k = 0; k < 3; k++) {
      const y0 = floors[k], y1 = floors[k + 1];
      B.wall('x', z0 - t / 2, x0 - t, x1 + t, Object.assign({ outSign: -1, y0, y1 }, EXT), k === 0 ? [{ at: cx + 0.6, w: 1.0, type: 'door', head: 2.3, id: 'folly-door', casing: 'gothicTrim' }] : [{ at: cx, w: 0.5, type: 'lancet', sill: 1.1, head: 2.4 }]);
      B.wall('x', z1 + t / 2, x0 - t, x1 + t, Object.assign({ outSign: 1, y0, y1 }, EXT), [{ at: cx, w: 0.5, type: 'lancet', sill: 1.1, head: 2.4 }]);
      B.wall('z', x0 - t / 2, z0, z1, Object.assign({ outSign: -1, y0, y1 }, EXT), [{ at: cz, w: 0.5, type: 'lancet', sill: 1.1, head: 2.4 }]);
      B.wall('z', x1 + t / 2, z0, z1, Object.assign({ outSign: 1, y0, y1 }, EXT), [{ at: cz, w: 0.5, type: 'lancet', sill: 1.1, head: 2.4 }]);
    }
    // the parapet, crenellated, with a pinnacle at each corner
    for (const [ax, az, w, d] of [[cx, z0 - t / 2, 2 * hx + 2 * t, t], [cx, z1 + t / 2, 2 * hx + 2 * t, t], [x0 - t / 2, cz, t, 2 * hz], [x1 + t / 2, cz, t, 2 * hz]]) {
      B.box('gothicStone', ax, top + parapet * 0.35, az, w, parapet * 0.7, d);
      P.addWall(ax - w / 2, ax + w / 2, az - d / 2, az + d / 2, top, top + parapet, { kind: 'wall', tag: 'parapet' });
      const L = Math.max(w, d), n = Math.floor(L / 0.7);
      for (let i = 0; i < n; i += 2) { const s = -L / 2 + (i + 0.5) * L / n;
        B.box('gothicStone', ax + (w > d ? s : 0), top + parapet * 0.7 + 0.2, az + (w > d ? 0 : s), w > d ? L / n : w, 0.4, w > d ? d : L / n); }
    }
    B.boxE('gothicTrim', x0 - t - 0.1, x1 + t + 0.1, top - 0.2, top, z0 - t - 0.1, z0 - t);
    B.boxE('gothicTrim', x0 - t - 0.1, x1 + t + 0.1, top - 0.2, top, z1 + t, z1 + t + 0.1);
    for (const x of [x0 - t / 2, x1 + t / 2]) for (const z of [z0 - t / 2, z1 + t / 2]) {
      B.box('gothicStone', x, top + 1.0, z, 0.55, 2.0, 0.55); B.mesh(G.pyramid, 'gothicTrim', x, top + 2.35, z, 0.6, 0.7, 0.6);
      B.box('gothicStone', x, 4.5, z, 0.7, 9.0, 0.7);                                                   // the corner buttresses
    }
    // the stair: steep straight flights up alternate sides, a floor at each storey with a hole over the flight below
    const FA = { x0: x0, x1: cx - 0.2 }, FB = { x0: cx + 0.2, x1: x1 }, RZ = 2.2;
    const flight = (f, ya, yb, up) => {      // up: +1 rises toward +z, -1 toward -z
      const zA = cz - up * RZ, zB = cz + up * RZ;
      P.ramp(f.x0, f.x1, Math.min(zA, zB), Math.max(zA, zB), 'z', up > 0 ? ya : yb, up > 0 ? yb : ya, ya - 0.3, 'folly stair');
      const n = 15, run = 2 * RZ / n, rise = (yb - ya) / n;
      for (let i = 0; i < n; i++) { const z = zA + up * run * (i + 0.5), y = ya + rise * (i + 1);
        B.boxE('stone', f.x0, f.x1, Math.max(ya, y - 0.35), y, z - run / 2 - 0.01, z + run / 2 + 0.01); }
      // a rope rail on the open side
      const rx = f.x0 === x0 ? f.x1 + 0.03 : f.x0 - 0.03;
      const foot = up > 0 ? [cz - RZ + 0.8, cz + RZ] : [cz - RZ, cz + RZ - 0.8];   // open at the foot, where you step on
      P.addWall(rx - 0.03, rx + 0.03, foot[0], foot[1], Math.min(ya, yb), Math.max(ya, yb) + 1.0, { kind: 'rail', occludes: false, tag: 'stair rail' });
      const m = B.box('darkWood', rx, (ya + yb) / 2 + 0.95, cz, 0.05, 0.05, Math.hypot(2 * RZ, yb - ya)); m.rotation.x = -up * Math.atan2(yb - ya, 2 * RZ); m.updateMatrix();
    };
    flight(FA, floors[0], floors[1], -1);    // up the west side, south to north
    flight(FB, floors[1], floors[2], 1);     // up the east side, north to south
    flight(FA, floors[2], floors[3], -1);    // up the west side again, to the top
    B.boxE('stone', x0, x1, -0.02, 0.02, z0, z1);
    const floorWithHole = (y, f) => {
      B.floor('boards', x0, x1, z0, z1, y, 0.2, [[f.x0, f.x1, cz - RZ, cz + RZ]]);
      const rx = f.x0 === x0 ? f.x1 + 0.03 : f.x0 - 0.03;
      P.addWall(rx - 0.03, rx + 0.03, cz - RZ, cz + RZ - 0.8, y, y + 1.0, { kind: 'rail', occludes: false, tag: 'stairwell rail' });
      B.boxE('darkWood', rx - 0.03, rx + 0.03, y + 0.95, y + 1.0, cz - RZ, cz + RZ - 0.8);
    };
    floorWithHole(floors[1], FA); floorWithHole(floors[2], FB); floorWithHole(floors[3], FA);
    // on top, a brass plate on a stone drum that points out the view
    B.mesh(G.cyl, 'stone', cx + 0.75, top + 0.5, cz + 1.4, 0.5, 1.0, 0.5);
    { const m = B.mesh(G.disc, 'brass', cx + 0.75, top + 1.01, cz + 1.4, 0.48, 0.48, 1); m.rotation.x = -Math.PI / 2; m.updateMatrix(); }
    P.addWall(cx + 0.5, cx + 1.0, cz + 1.15, cz + 1.65, top, top + 1.0, { kind: 'furniture', tag: 'view plate' });
    B.readable('folly-view', 'The view plate', 'A brass plate on a stone drum, engraved with arrows to everything you can see from up here:\n\nBLACKTHORN MANOR  ·  THE CHAPEL  ·  THE LAKE AND ISLAND  ·  KNOWLE FARM 3 MI  ·  ST MICHAEL\'S SPIRE 5 MI  ·  THE LONDON ROAD\n\nAnd under the rim, scratched with a pin:\n\n"E.B. was here 1962 — and could see the road."', [cx + 0.75, top + 1.02, cz + 1.4], [0, -1], { visual: false, floorY: top });
    // the lights: floods at the foot of the north and west faces, lamps inside, a beacon on top
    const flood = estate('folly', { id: 'folly-flood', name: 'Folly floodlight', kind: 'incandescent', style: 'none', pos: [cx - 0.4, 0.6, z0 - 2.0], spot: true, dir: [0, 1, 0.5], colour: 0xf2e6d0, target: 0.8, range: 14, corona: 0 });
    for (const [x, z, nx, nz, w] of [[cx - 0.5, z0 - t, 0, -1, 1.5], [cx + 1.3, z0 - t, 0, -1, 1.2], [x0 - t, cz - 1.4, -1, 0, 2.6], [x0 - t, cz + 1.4, -1, 0, 2.6], [x1 + t, cz, 1, 0, 3.2]])
      wash(flood, x, 0.02, z, nx, nz, w, top + parapet);
    for (const [x, z] of [[cx - 0.5, z0 - t - 0.75], [x0 - t - 0.75, cz], [x1 + t + 0.75, cz]]) B.box('metalDark', x, 0.012, z, 0.36, 0.024, 0.36);
    estate('folly', { id: 'folly-beacon', name: 'Folly beacon', kind: 'incandescent', style: 'lantern', pos: [x1 - 0.3, top + 1.4, z0 + 0.3], colour: 0xffcf8a, target: 1.1, range: 10 });
    B.mesh(G.post, 'iron', x1 - 0.3, top + 0.6, z0 + 0.3, 0.08, 1.2, 0.08);
    P.addWall(x1 - 0.4, x1 - 0.2, z0 + 0.2, z0 + 0.4, top, top + 1.4, { kind: 'furniture', tag: 'beacon post' });
    estate('folly', { id: 'folly-door-lamp', name: 'Folly lantern', kind: 'incandescent', style: 'lantern', pos: [cx - 0.35, 2.4, z0 - t - 0.3], nz: -1, colour: 0xffbe70, target: 0.7, range: 6 });
    for (let k = 0; k < 3; k++) estate('folly', { id: 'folly-stair-' + k, name: 'Folly stair lamp', kind: 'incandescent', style: 'cage', pos: [x1 - 0.25, floors[k] + 2.5, z1 - 0.3], colour: 0xffc27a, target: 0.5, range: 5 });
    // a lamp-post where the path arrives
    estate('folly', { id: 'folly-path-lamp', name: 'Folly path lamp', kind: 'incandescent', style: 'street', pos: [cx - 1.6, 2.6, z0 - 3.2], colour: 0xffc27a, target: 0.7, range: 8 });
    P.addWall(cx - 1.72, cx - 1.48, z0 - 3.32, z0 - 3.08, 0, 2.4, { kind: 'tree', occludes: false, tag: 'lamp post' });
  }
  game.follyWashes = washes;
  B.room = 'grounds'; B.zone = 'exterior';
};

BM.updateIslandFolly = function (game) {
  for (const w of game.follyWashes || []) { const l = w.l, k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0; w.m.color.setRGB(0.52 * k, 0.5 * k, 0.46 * k); }
};
})();
