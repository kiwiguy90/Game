/* ==========================================================================
   BLACKTHORN MANOR — 4. THE GROUNDS
   The lane, the gates and lodge, the limestone carriage drive, the maze,
   fountain, sunken pool, pond, cemetery, garage and shed.
   Coordinates: x east, z south (towards the lane), y up. House front z=12.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildGrounds = function (B, game) {
  const P = B.phys, grid = B.grid;
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';

  /* ---- ground ---- */
  B.floor('grass', -64, 64, -54, 100, 0, 0.5, [[-18, 18, -12, 12], [-40, -24, 56, 68], [-13.4, -10.6, -16.8, -12]]);
  // the lane's verges (the road itself, out into the forest, is laid in 49-road)
  B.boxE('soil', -64, 64, 0, 0.02, 89.5, 100.6, null);
  // limestone carriage drive, turning circle ring and paths (visual overlays)
  B.boxE('limestone', -3, 3, 0, 0.03, 33, 89.5);
  const ring = 28;
  for (let i = 0; i < ring; i++) {
    const a = i / ring * Math.PI * 2, r = 6.75;
    B.box('limestone', Math.sin(a) * r, 0.015, 24 + Math.cos(a) * r, 4.6, 0.03, 1.65, a);
  }
  B.boxE('limestone', -6, 6, 0, 0.03, 12, 16.5); // forecourt
  const gravelPath = (pts, w) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      B.boxE('gravel', Math.min(ax, bx) - (az === bz ? 0 : w / 2), Math.max(ax, bx) + (az === bz ? 0 : w / 2), 0, 0.025,
        Math.min(az, bz) - (ax === bx ? 0 : w / 2), Math.max(az, bz) + (ax === bx ? 0 : w / 2));
    }
  };
  const PATHS = [
    { id: 'drive', pts: [[0, 92], [0, 33]], w: 6, y: 0 },
    { id: 'forecourt', pts: [[0, 15.2], [0, 16.4]], w: 6, y: 0 },
    { id: 'turning-circle', ring: { cx: 0, cz: 24, r: 6.75 }, w: 4, y: 0 },
    { id: 'maze-walk', pts: [[-9, 24], [-20, 24], [-20, 38.5], [-39.3, 38.5]], w: 2, y: 0 },
    { id: 'cemetery-walk', pts: [[9, 24], [24, 24], [24, 37], [29.6, 37]], w: 2, y: 0 },
    { id: 'garage-walk', pts: [[24, 24], [30, 24], [30, 8.6]], w: 2, y: 0 },
    { id: 'shed-walk', pts: [[-20, 24], [-29.5, 24], [-29.5, 2.7]], w: 2, y: 0 },
    { id: 'pond-walk', pts: [[3.1, 62], [27, 62]], w: 2, y: 0 },
    { id: 'pool-walk', pts: [[-3.1, 62], [-23.6, 62]], w: 2, y: 0 },
    { id: 'lane', pts: [[-60, 94], [60, 94]], w: 4.2, y: 0 }, // your car is parked on the far verge
  ];
  for (const p of PATHS) { if (p.pts && p.id !== 'drive' && p.id !== 'lane' && p.id !== 'forecourt') gravelPath(p.pts, p.w); B.paths.push(p); }

  /* ---- boundary ---- */
  const wallH = 2.4;
  B.solid('stone', -64.4, -64, 0, wallH, -54, 88.2);
  B.solid('stone', 64, 64.4, 0, wallH, -54, 88.2);
  B.solid('stone', -64, 64, 0, wallH, -54.4, -54);
  // the lane runs on for miles through the forest; you are not walking back
  P.addWall(-64, 64, 100.6, 101.2, 0, 4, { kind: 'hedge', tag: 'forest' });
  for (const x of [-64.6, 64]) P.addWall(x, x + 0.6, 88.2, 100.6, 0, 4, { kind: 'hedge', tag: 'the road on' });
  B.solid('stone', -64, -14, 0, wallH, 87.8, 88.2);             // estate wall
  B.solid('stone', -6, -4.2, 0, wallH, 87.8, 88.2);
  B.solid('stone', 4.2, 64, 0, wallH, 87.8, 88.2);
  // gate piers with ball finials
  for (const sx of [-1, 1]) {
    B.solid('stone', sx * 3.8 - 0.4, sx * 3.8 + 0.4, 0, 3.2, 87.6, 88.4);
    B.mesh(G.sphere, 'stone', sx * 3.8, 3.5, 88, 0.6);
  }
  // the gates: two wrought-iron leaves hinged on the piers
  const gateWall = P.addWall(-3.4, 3.4, 87.85, 88.15, 0, 2.8, { kind: 'gate', occludes: false });
  const gates = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * 3.4, 0, 88); B.root.add(pivot);
    pivot.userData.dynamic = true;
    for (let i = 0; i < 10; i++) B.mesh(G.post, 'iron', -sx * (0.15 + i * 0.34), 1.3, 0, 0.04, 2.6, 0.04, 0, pivot);
    B.box('iron', -sx * 1.7, 0.25, 0, 3.4, 0.07, 0.05, 0, pivot);
    B.box('iron', -sx * 1.7, 2.4, 0, 3.4, 0.07, 0.05, 0, pivot);
    pivot.traverse(o => { o.userData.dynamic = true; });
    gates.push(pivot);
  }
  game.gates = { wall: gateWall, leaves: gates, open: false, t: 0, closing: false, lockedIn: false, escaping: false };
  B.interactable({
    id: 'gates', label: () => game.gates.open ? '' : game.gates.lockedIn ? 'Gates: shut and bolted' : 'Gates: locked', pos: [0, 1.4, 88.2], n: [0, 1], kind: 'door',
    enabled: () => !game.gates.open,
    act: g => { g.ui.say(g.gates.lockedIn ? 'Shut, and bolted on the far side. You are not going out this way. Not yet.' : 'The gates are locked. A release is worked from the lodge.'); g.audio.rattle(); },
  });
  // the closing contact let into the drive: a worn brass strip, and the cable duct to the gate post
  B.room = 'drive';
  B.box('brass', 0, 0.035, 85.0, 6.0, 0.012, 0.12);
  B.box('metalDark', 3.2, 0.03, 86.5, 0.06, 0.01, 3.0);
  B.room = 'grounds';

  /* ---- the lane's street lights (council supply; one is faulty) ---- */
  B.room = 'lane';
  // old sodium lanterns on arms from the timber power poles (the poles are built in 49-road)
  const LANE = BM.LANE = { poleZ: 99.6, armZ: 97.1, lampY: 6.4, span: 16, from: -168, to: 168 };
  const street = [[-24, LANE.armZ, false], [8, LANE.armZ, false], [40, LANE.armZ, true]];
  LANE.lampXs = street.map(s => s[0]);
  for (const [x, z, faulty] of street) {
    B.fixture({
      id: 'street' + x, name: 'Street light', circuit: 'street', on: false, kind: 'sodium', style: 'cobra', pos: [x, LANE.lampY, z],
      colour: 0xffa04a, target: 2.4, range: 16, spot: true, dir: [0, -1, -0.2], flicker: faulty ? 0.7 : 0, blink: faulty ? 0.35 : 0,
      lightType: faulty ? 'flicker' : 'steady',
    });
  }

  /* ---- the gatekeeper's lodge (door on the lane) ---- */
  B.room = 'lodge';
  const L = { x0: -14, x1: -6, z0: 80, z1: 88, h: 3.2 };
  B.wall('x', 88, L.x0, L.x1, { t: 0.4, mat: 'plaster', matOut: 'brick', outSign: 1, y1: L.h }, [
    { at: -10, w: 1.2, type: 'door', id: 'lodge-door' }, { at: -12.4, w: 1.0, type: 'window', id: 'lodge-window-s', sill: 1.0, head: 2.3 }]);
  B.wall('x', 80, L.x0, L.x1, { t: 0.4, mat: 'plaster', matOut: 'brick', outSign: -1, y1: L.h }, [
    { at: -10, w: 1.2, type: 'window', id: 'lodge-window-n', sill: 1.0, head: 2.3 }]);
  B.wall('z', L.x0, L.z0, L.z1, { t: 0.4, mat: 'plaster', matOut: 'brick', outSign: -1, y1: L.h });
  B.wall('z', L.x1, L.z0, L.z1, { t: 0.4, mat: 'plaster', matOut: 'brick', outSign: 1, y1: L.h });
  B.boxE('stone', L.x0 + 0.2, L.x1 - 0.2, 0, 0.04, L.z0 + 0.2, L.z1 - 0.2);
  // the lodge door: a plain four-panel door, hinged on the left, opening into the room
  game.lodgeDoor = B.hingedDoor({ id: 'lodge-door', axis: 'x', at: -10, c: 88, w: 1.2, h: 2.1, hinge: 'low', swing: -1, mat: 'shutter', panelMat: 'boards', dur: 1.4, sound: 'creak', label: 'the lodge door', wallT: 0.4 });
  P.rect(L.x0 - 0.4, L.x1 + 0.4, L.z0 - 0.4, L.z1 + 0.4, L.h + 0.2, L.h, 'lodge-roof');
  B.boxE('plaster', L.x0, L.x1, L.h, L.h + 0.2, L.z0, L.z1);
  for (const s of [-1, 1]) {
    const r = B.box('roof', -10, L.h + 1.0, 84 + s * 2.2, 9.2, 0.18, 5.2);
    r.rotation.x = s * 0.42; r.updateMatrix();
  }
  B.box('brick', -10, L.h + 0.9, 80.2, 8.4, 1.8, 0.2);
  B.box('brick', -10, L.h + 0.9, 87.8, 8.4, 1.8, 0.2);
  B.furniture('darkWood', -8.0, 82.0, 0, 1.6, 0.78, 0.8, 'lodge desk');
  B.furniture('wood', -7.0, 86.6, 0, 0.6, 0.45, 0.6, 'lodge stool');
  const lodgeLamp = B.fixture({ id: 'lodge-lamp', name: 'Lodge lamp', circuit: 'lodge', kind: 'incandescent', style: 'pendant', pos: [-10, 2.5, 84], ceiling: L.h, colour: 0xffc27a, target: 1.4, range: 8 });
  B.lightSwitch('sw-lodge', 'Lodge light', [-8.9, 1.4, 87.75], [0, -1], ['lodge-lamp']);
  B.fixture({ id: 'lodge-porch', name: 'Lodge porch lantern', circuit: 'lodge', on: false, kind: 'incandescent', style: 'lantern', pos: [-11.2, 2.4, 88.45], nz: 1, colour: 0xffb060, target: 0.9, range: 7 });
  /* ---- estate lighting, all controlled from the lodge lighting panel ---- */
  const ESTATE_GROUPS = [
    ['street', 'Street lighting (lane)'], ['gate', 'Gate lights'], ['flood', 'Floodlights (house and yard)'],
    ['drive', 'Drive lamps'], ['garden', 'Garden lights (fountain, maze)'], ['pool', 'Pool lights'],
    ['pond', 'Pond lights'], ['garage', 'Garage lights'], ['shed', 'Shed lights'], ['cemetery', 'Cemetery lights'],
  ];
  const estate = {}; for (const [k] of ESTATE_GROUPS) estate[k] = [];
  const estateLight = (group, o) => { const l = B.fixture(Object.assign({ circuit: 'lodge', on: false, chain: 'estate:' + group }, o)); estate[group].push(l.id); return l; };
  B.room = 'grounds';
  for (const [x] of street) estate.street.push('street' + x);
  for (const sx of [-1, 1]) estateLight('gate', { id: 'gate-lantern' + sx, name: 'Gate lantern', kind: 'incandescent', style: 'lantern', pos: [sx * 3.8, 2.7, 88.55], nz: 1, colour: 0xffb866, target: 1.1, range: 8 });
  estate.gate.push('lodge-porch');
  for (const x of [-14, -7.5, 7.5, 14]) {
    estateLight('flood', { id: 'flood' + x, name: 'Floodlight', kind: 'incandescent', style: 'flood', pos: [x, 0.35, 14.2], colour: 0xe8eeff, target: 2.6, range: 18, spot: true, dir: [0, 0.75, -0.66] });
  }
  for (const x of [27, 33]) estateLight('flood', { id: 'yard-flood' + x, name: 'Yard floodlight', kind: 'incandescent', style: 'bulkhead', pos: [x, 2.8, 8.25], nz: 1, colour: 0xe8eeff, target: 2.2, range: 16, spot: true, dir: [0, -0.6, 0.8] });
  for (const z of [39, 56, 68, 87]) for (const sx of [-1, 1]) {
    estateLight('drive', { id: 'drive-lamp' + sx * z, name: 'Drive lamp', kind: 'incandescent', style: 'street', pos: [sx * 4.6, 3.2, z], colour: 0xffc070, target: 1.3, range: 10 });
    P.addWall(sx * 4.6 - 0.1, sx * 4.6 + 0.1, z - 0.1, z + 0.1, 0, 3, { kind: 'tree', occludes: false });
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, x = Math.sin(a) * 9.8, z = 24 + Math.cos(a) * 9.8;
    estateLight('drive', { id: 'circle-lamp' + i, name: 'Turning circle lamp', kind: 'incandescent', style: 'street', pos: [x, 3.2, z], colour: 0xffc070, target: 1.3, range: 10 });
    P.addWall(x - 0.1, x + 0.1, z - 0.1, z + 0.1, 0, 3, { kind: 'tree', occludes: false });
  }
  const bollard = (group, id, name, x, z, colour) => {
    estateLight(group, { id, name, kind: 'incandescent', style: 'bollard', pos: [x, 0.9, z], colour: colour || 0xffd08a, target: 0.9, range: 7 });
    P.addWall(x - 0.1, x + 0.1, z - 0.1, z + 0.1, 0, 0.9, { kind: 'tree', occludes: false });
  };
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; bollard('garden', 'fountain-light' + i, 'Fountain light', Math.sin(a) * 4.0, 24 + Math.cos(a) * 4.0, 0xbfe0ff); }
  bollard('garden', 'maze-light-n', 'Maze lantern', -38.2, 36.6); bollard('garden', 'maze-light-s', 'Maze lantern', -38.2, 40.4);
  bollard('pool', 'pool-light-n', 'Pool light', -23.2, 59.5, 0xbfe0ff); bollard('pool', 'pool-light-s', 'Pool light', -23.2, 64.5, 0xbfe0ff);
  for (const x of [-34, -30]) estateLight('pool', { id: 'pool-under' + x, name: 'Underwater light', kind: 'incandescent', style: 'none', pos: [x, -0.7, 62], colour: 0x5fd0ff, target: 1.2, range: 7, lightType: 'subtlePulse' });
  bollard('pond', 'pond-light-n', 'Pond light', 26.6, 59.5); bollard('pond', 'pond-light-s', 'Pond light', 26.6, 64.5);
  bollard('cemetery', 'cemetery-light-n', 'Cemetery gate lantern', 29.4, 35.3); bollard('cemetery', 'cemetery-light-s', 'Cemetery gate lantern', 29.4, 38.7);
  bollard('cemetery', 'eleanor-light', 'Lamp by the small stone', 49.4, 38.6, 0xffe0b0);
  B.room = 'lodge';
  game.estateLights = estate;
  game.estateGroups = ESTATE_GROUPS;
  B.interactable({
    id: 'lodge-lighting', label: 'Estate lighting panel', pos: [-12.2, 1.45, 80.36], n: [0, 1],
    act: g => g.ui.openEstate(),
  });
  B.interactable({
    id: 'lodge-main', label: () => grid.lodge ? 'Lodge main switch: ON' : 'Throw the lodge main switch', pos: [-13.62, 1.6, 84.4], n: [1, 0],
    act: g => {
      if (grid.lodge) { g.ui.say('The lodge switch is on. The estate has a supply.'); return; }
      grid.setLodge(true); g.audio.lever(); g.ui.say('A heavy clunk. Somewhere up the drive, something hums. Under the window, the estate lighting panel.');
    },
  });
  /* ---- the gate control box: a steel box on the wall; open its door, then pull the lever ---- */
  {
    const bx = -6.22, by = 1.45, bz = 83.2;
    B.box('metalDark', bx + 0.08, by, bz, 0.16, 0.62, 0.42);                       // the box
    B.box('black', bx - 0.005, by, bz, 0.01, 0.5, 0.32);                           // its dark inside
    const door = new THREE.Group(); door.position.set(bx - 0.01, by, bz - 0.21); B.root.add(door);
    B.box('metalDark', -0.01, 0, 0.21, 0.02, 0.62, 0.42, 0, door);
    B.mesh(G.sphere, 'brass', -0.03, -0.05, 0.36, 0.025, 0, door);
    door.traverse(o => { o.userData.dynamic = true; });
    const lever = new THREE.Group(); lever.position.set(bx - 0.03, by - 0.04, bz); lever.rotation.order = 'YXZ'; B.root.add(lever);
    B.mesh(G.post, 'iron', 0, 0.11, 0, 0.022, 0.22, 0.022, 0, lever); B.mesh(G.sphere, BM.M('fabricRed'), 0, 0.23, 0, 0.035, 0, lever);
    const hub = B.mesh(G.cyl, 'brass', 0, 0, 0, 0.06, 0.03, 0.06, 0, lever); hub.rotation.x = Math.PI / 2; hub.updateMatrix();
    lever.traverse(o => { o.userData.dynamic = true; });
    game.gateBox = { door, lever, open: false, t: 0, leverT: 0 };
    B.interactable({
      id: 'gate-box', label: () => game.gateBox.open ? 'Close the gate control box' : 'Open the gate control box', pos: [bx - 0.04, by + 0.27, bz + 0.17], n: [-1, 0], approachDist: 0.85,
      act: g => { g.gateBox.open = !g.gateBox.open; g.audio.latch(0.6); g.ui.say(g.gateBox.open ? 'The steel door swings open on a lever marked GATES: UP locked, DOWN released.' : 'You shut the box.', 3); },
    });
    B.interactable({
      id: 'gate-release', label: () => !game.gateBox.open ? '' : game.gates.lockedIn ? 'Pull the lever (gates bolted from the house)' : game.gates.open ? 'Push the lever up: lock the gates' : 'Pull the lever down: release the gates',
      pos: [bx - 0.06, by - 0.04, bz], n: [-1, 0], approachDist: 0.85, enabled: () => game.gateBox.open,
      act: g => { if (!grid.lodge) { g.ui.say('The lever moves, but the gates do not. No power to the lodge.'); g.audio.click(); return; } g.gateLever(); },
    });
  }
  // the gatekeeper's telephone on the wall by the door: an extension from the house, dead these fifty years
  B.box('cream', -11.4, 1.5, 87.74, 0.2, 0.3, 0.1); B.box('black', -11.52, 1.5, 87.7, 0.05, 0.24, 0.06); B.mesh(G.disc, 'black', -11.37, 1.55, 87.68, 0.12).rotation.x = 0; B.box('black', -11.4, 1.2, 87.72, 0.01, 0.3, 0.01);
  B.interactable({
    id: 'lodge-phone', label: 'Pick up the telephone', pos: [-11.4, 1.5, 87.68], n: [0, -1], approachDist: 0.9,
    act: g => { g.story.phoneTried = true; g.audio.click(); g.audio.tone('sine', 400, 400, 0.0, 0.01, 0.1); g.ui.say('Dead. Not a crackle, not a dial tone. The line comes down from the house, and nobody has paid for it since 1974.', 5); },
  });
  B.readable('note-lodge', "Gatekeeper's log", [
    '14 October 1974.',
    'The doctor\'s car again after dark. Mr Blackthorn says I am not to log it. I am logging it.',
    '19 October. The solicitor from London. The big house had every light burning all night, like a liner.',
    '21 October. Told to lock up and go home and not come back. Miss Eleanor came down the drive in the rain with no coat on and asked me to open the gates. I told her they shut from the house now and there was nothing I could do. I am ashamed of that.',
    'Main switch is on the left wall. Gate release by the door: it draws the bolt, that is all it does. Mind the contact in the drive. God help whoever comes next.',
  ].join('\n\n'), [-8.4, 0.78, 82.1], [0, 1]);

  /* ---- avenue trees, box and flower beds ---- */
  B.room = 'grounds';
  // haunted planting: gnarled dead trees (see 44-haunted); a few black yews
  const tree = (x, z, s) => BM.deadTree(B, x, z, s || 1, game);
  for (let z = 40; z <= 84; z += 8) { tree(-6.5, z); tree(6.5, z); }
  for (const [x, z, s] of [[-24, 12, 1.2], [-40, 0, 1.3], [44, 6, 1.2], [-50, 70, 1.1], [52, 52, 1.3], [-52, -20, 1.4], [40, -30, 1.2], [-12, -30, 1.3], [16, 78, 0.9], [-18, 80, 1.0]]) tree(x, z, s);
  // clipped box along the drive (gaps where the walks cross at z=62)
  for (let z = 34; z <= 86; z += 2) {
    if (z >= 60 && z <= 64) continue;
    // the clipped box has grown out: ragged, uneven, nobody has touched it since 1974
    for (const sx of [-1, 1]) { const hb = B.box('hedge', sx * 3.6, 0.3 + ((z * 7) % 5) * 0.03, z, 0.58 + ((z * 3) % 4) * 0.03, 0.6 + ((z * 11) % 7) * 0.05, 0.6, ((z * 13) % 9) * 0.04); P.addWall(sx * 3.6 - 0.3, sx * 3.6 + 0.3, z - 0.3, z + 0.3, 0, 0.6, { kind: 'hedge', occludes: false }); }
  }
  // flower beds between the trees
  const flowerMats = ['flowersRed', 'flowersWhite', 'flowersPurple'];
  for (let z = 42; z <= 82; z += 8) {
    if (z >= 58 && z <= 66) continue;
    for (const sx of [-1, 1]) {
      B.box('soil', sx * 4.8, 0.08, z + 2, 1.0, 0.16, 5.0);
      // withered beds: dead stalks, the odd blood-red rose still hanging on
      for (let i = 0; i < 6; i++) {
        const st = B.mesh(G.post, 'deadStalk', sx * (4.55 + (i % 2) * 0.5), 0.4, z + i * 0.8, 0.03, 0.55, 0.03);
        st.rotation.z = (i % 3 - 1) * 0.35; st.rotation.x = ((i + z) % 2 - 0.5) * 0.4; st.updateMatrix();
        B.mesh(G.lowSphere, flowerMats[(i + z) % 3], sx * (4.55 + (i % 2) * 0.5) + (i % 3 - 1) * 0.1, 0.62, z + i * 0.8, 0.14, 0.1, 0.14);
      }
    }
  }

  /* ---- turning circle and fountain ---- */
  B.mesh(G.cyl, 'grass', 0, 0.06, 24, 8.6, 0.12, 8.6);
  B.mesh(G.cyl, 'stone', 0, 0.25, 24, 6.4, 0.5, 6.4);
  B.mesh(G.cyl, 'water', 0, 0.42, 24, 5.8, 0.05, 5.8).userData.dynamic = true;
  B.mesh(G.cyl, 'stone', 0, 1.0, 24, 0.7, 2.0, 0.7);
  B.mesh(G.cyl, 'stone', 0, 2.0, 24, 2.4, 0.2, 2.4);
  B.mesh(G.cyl, 'statue', 0, 2.6, 24, 0.4, 1.0, 0.4);
  B.mesh(G.sphere, 'statue', 0, 3.25, 24, 0.5);
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2;
    const x = Math.sin(a) * 3.05, z = 24 + Math.cos(a) * 3.05;
    P.addWall(x - 0.28, x + 0.28, z - 0.28, z + 0.28, 0, 0.5, { kind: 'wall', occludes: false, structural: false });
  }
  game.fountain = { x: 0, z: 24 };

  /* ---- the yew maze, 7 x 7, statue at its heart ---- */
  const MZ = { x0: -60, z0: 28, n: 7, c: 3 };
  const rnd = BM.mulberry32(1961);
  const cells = []; for (let i = 0; i < 49; i++) cells.push({ n: true, s: true, e: true, w: true, v: false });
  const at = (i, j) => cells[j * 7 + i];
  const stack = [[3, 3]]; at(3, 3).v = true;
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = [];
    if (j > 0 && !at(i, j - 1).v) nb.push([i, j - 1, 'n', 's']);
    if (j < 6 && !at(i, j + 1).v) nb.push([i, j + 1, 's', 'n']);
    if (i > 0 && !at(i - 1, j).v) nb.push([i - 1, j, 'w', 'e']);
    if (i < 6 && !at(i + 1, j).v) nb.push([i + 1, j, 'e', 'w']);
    if (!nb.length) { stack.pop(); continue; }
    const [ni, nj, d, od] = nb[Math.floor(rnd() * nb.length)];
    at(i, j)[d] = false; at(ni, nj)[od] = false; at(ni, nj).v = true; stack.push([ni, nj]);
  }
  at(6, 3).e = false; // entrance on the east, facing the walk
  const hedgeT = 0.6, hedgeH = 2.4;
  const hedge = (x0, x1, z0, z1) => B.solid('hedge', x0, x1, 0, hedgeH, z0, z1, { kind: 'hedge' });
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
    const c = at(i, j), x = MZ.x0 + i * 3, z = MZ.z0 + j * 3;
    if (c.n) hedge(x - hedgeT / 2, x + 3 + hedgeT / 2, z - hedgeT / 2, z + hedgeT / 2);
    if (c.w) hedge(x - hedgeT / 2, x + hedgeT / 2, z - hedgeT / 2, z + 3 + hedgeT / 2);
    if (j === 6 && c.s) hedge(x - hedgeT / 2, x + 3 + hedgeT / 2, z + 3 - hedgeT / 2, z + 3 + hedgeT / 2);
    if (i === 6 && c.e) hedge(x + 3 - hedgeT / 2, x + 3 + hedgeT / 2, z - hedgeT / 2, z + 3 + hedgeT / 2);
  }
  game.maze = { cells, x0: MZ.x0, z0: MZ.z0 };
  const hx = MZ.x0 + 10.5, hz = MZ.z0 + 10.5;
  B.solid('stone', hx - 0.35, hx + 0.35, 0, 1.0, hz - 0.35, hz + 0.35, { kind: 'furniture', tag: 'statue plinth' });
  B.mesh(G.cyl, 'statue', hx, 1.7, hz, 0.42, 1.4, 0.42);
  B.mesh(G.sphere, 'statue', hx, 2.6, hz, 0.42);
  B.box('statue', hx - 0.35, 1.9, hz, 0.12, 0.7, 0.12);
  B.box('statue', hx + 0.3, 2.1, hz + 0.1, 0.12, 0.12, 0.6);
  const heart = at(3, 3), hn = !heart.s ? [0, 1] : !heart.n ? [0, -1] : !heart.e ? [1, 0] : [-1, 0];
  B.readable('plaque-statue', 'Plaque on the statue', 'MERCY, WHO WAITS\n\nGiven to the house by E.B., 1971.\n\nSomeone has scratched underneath, small, with a nail: "she is the only one of them who looked at us"', [hx + hn[0] * 0.37, 0.7, hz + hn[1] * 0.37], hn, { plaque: true });

  /* ---- sunken pool ---- */
  B.room = 'sunken pool';
  B.floor('stone', -40, -24, 56, 68, -0.8, 0.3);
  P.ramp(-25.6, -24, 61, 63, 'x', -0.8, 0, -1.1, 'pool steps');
  for (let i = 0; i < 4; i++) B.boxE('stone', -25.6 + i * 0.4, -24, -0.8, -0.8 + (i + 1) * 0.2, 61, 63);
  B.boxE('stone', -40, -24, -0.8, 0, 55.8, 56); B.boxE('stone', -40, -24, -0.8, 0, 68, 68.2);
  B.boxE('stone', -40.2, -40, -0.8, 0, 56, 68);
  B.boxE('stone', -24, -23.8, -0.8, 0, 56, 61); B.boxE('stone', -24, -23.8, -0.8, 0, 63, 68);
  B.solid('stone', -36.2, -27.8, -0.8, -0.4, 58.8, 59);
  B.solid('stone', -36.2, -27.8, -0.8, -0.4, 65, 65.2);
  B.solid('stone', -36.2, -36, -0.8, -0.4, 59, 65);
  B.solid('stone', -28, -27.8, -0.8, -0.4, 59, 65);
  B.boxE('water', -36, -28, -0.8, -0.55, 59, 65).userData.dynamic = true;

  /* ---- the pond, with ducks ---- */
  B.room = 'pond';
  B.mesh(G.cyl, 'water', 34, 0.05, 62, 12, 0.06, 12).userData.dynamic = true;
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2, x = 34 + Math.sin(a) * 6.2, z = 62 + Math.cos(a) * 6.2;
    B.mesh(G.lowSphere, 'stone', x, 0.12, z, 0.7, 0.4, 0.7);
    P.addWall(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 0, 0.5, { kind: 'wall', occludes: false, structural: false });
  }
  game.ducks = [];
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Group(); d.userData.dynamic = true; B.root.add(d);
    B.mesh(G.sphere, 'flowersWhite', 0, 0.12, 0, 0.36, 0.22, 0.5, 0, d);
    B.mesh(G.sphere, i ? 'fabricGreen' : 'flowersWhite', 0, 0.3, -0.24, 0.18, 0.18, 0.18, 0, d);
    B.box('brass', 0, 0.28, -0.36, 0.06, 0.03, 0.1, 0, d);
    d.traverse(o => { o.matrixAutoUpdate = true; o.userData.dynamic = true; });
    game.ducks.push({ obj: d, r: 1.8 + i * 0.8, a: i * 1.7, w: 0.18 + i * 0.05, cx: 34, cz: 62 });
  }

  /* ---- cemetery (Eleanor lies outside the fence) ---- */
  B.room = 'cemetery';
  const C = { x0: 30, x1: 46, z0: 30, z1: 44 };
  const rail = (x0, x1, z0, z1) => {
    B.solid(null, x0, x1, 0, 1.2, z0, z1, { kind: 'rail' });
    const len = Math.max(x1 - x0, z1 - z0);
    for (let s = 0; s <= len; s += 0.25) {
      const x = x1 - x0 > z1 - z0 ? x0 + s : (x0 + x1) / 2, z = x1 - x0 > z1 - z0 ? (z0 + z1) / 2 : z0 + s;
      B.mesh(G.post, 'iron', x, 0.6, z, 0.03, 1.2, 0.03);
    }
    B.boxE('iron', x0, x1, 1.12, 1.18, z0, z1);
  };
  rail(C.x0, C.x1, C.z0 - 0.05, C.z0 + 0.05);
  rail(C.x0, C.x1, C.z1 - 0.05, C.z1 + 0.05);
  rail(C.x1 - 0.05, C.x1 + 0.05, C.z0, C.z1);
  rail(C.x0 - 0.05, C.x0 + 0.05, C.z0, 36.2);
  rail(C.x0 - 0.05, C.x0 + 0.05, 37.8, C.z1);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) {
    const x = 33.5 + k * 2.2, z = 32.5 + r * 4.5;
    if (z > 35.5 && z < 38.5 && x < 35) continue;
    B.solid('statue', x - 0.35, x + 0.35, 0, 1.0, z - 0.09, z + 0.09, { kind: 'furniture', tag: 'headstone' });
    B.boxE('grass', x - 0.45, x + 0.45, 0, 0.12, z + 0.1, z + 1.9);
  }
  B.readable('grave-family', 'The family stone', 'BLACKTHORN\n\nCHARLES 1911–1979\nMARGARET 1915–1983\nEDMUND 1913–1981\n\n"Their works do follow them."\n\nThere are five names carved for the family. There were six of them.', [44.6, 0.95, 35.8], [-1, 0], { plaque: true });
  B.solid('statue', 44.75, 45.3, 0, 1.6, 34.8, 36.8, { kind: 'furniture', tag: 'family stone' });
  // Eleanor's marker: outside the fence line, on the far side
  B.solid('statue', 48.6, 48.8, 0, 0.7, 36.6, 37.4, { kind: 'furniture', tag: 'eleanor marker' });
  B.readable('eleanor-marker', "A marker outside the fence", 'E.B.\n1949 – 1975\n\nShe would not sign.\n\nThe stone is small and has been set outside the railings, facing away from the family. Somebody keeps the grass round it cut short.', [48.9, 0.55, 37.0], [1, 0], { plaque: true });

  /* ---- garage (walk-in, lit) ---- */
  B.room = 'garage';
  const GA = { x0: 26, x1: 34, z0: -2, z1: 8, h: 3.0 };
  B.wall('z', GA.x0, GA.z0, GA.z1, { t: 0.3, mat: 'brick', y1: GA.h });
  B.wall('z', GA.x1, GA.z0, GA.z1, { t: 0.3, mat: 'brick', y1: GA.h });
  B.wall('x', GA.z0, GA.x0, GA.x1, { t: 0.3, mat: 'brick', y1: GA.h });
  B.wall('x', GA.z1, GA.x0, GA.x1, { t: 0.3, mat: 'brick', y1: GA.h }, [{ at: 30, w: 5, type: 'door', head: 2.6, id: 'garage-door', casing: 'iron' }]);
  B.boxE('concrete', GA.x0, GA.x1, 0, 0.04, GA.z0, GA.z1);
  P.rect(GA.x0 - 0.3, GA.x1 + 0.3, GA.z0 - 0.3, GA.z1 + 0.3, GA.h + 0.2, GA.h, 'garage-roof');
  B.boxE('roof', GA.x0 - 0.3, GA.x1 + 0.3, GA.h, GA.h + 0.2, GA.z0 - 0.3, GA.z1 + 0.3);
  // the car, a 1972 saloon under dust
  B.furniture('carPaint', 30, 2.6, 0.35, 1.8, 0.75, 4.4, 'car body');
  B.box('carPaint', 30, 1.4, 2.4, 1.6, 0.55, 2.2);
  B.box('glass', 30, 1.4, 2.4, 1.62, 0.4, 2.0);
  for (const [dx, dz] of [[-0.85, 1.2], [0.85, 1.2], [-0.85, 4.0], [0.85, 4.0]]) { const w = B.mesh(G.cyl, 'rubber', 30 + dx, 0.35, dz, 0.7, 0.25, 0.7); w.rotation.z = Math.PI / 2; w.updateMatrix(); }
  B.furniture('wood', 33.35, 5.5, 0, 0.7, 0.9, 2.4, 'workbench');
  // a spare wheel leaning on the wall by the door, the tyre still good
  { const sw = new THREE.Group(); sw.position.set(26.55, 0.36, 1.2); sw.rotation.set(0, 0, 0.18); B.root.add(sw);
    const tyre = B.mesh(G.cyl, 'rubber', 0, 0, 0, 0.7, 0.22, 0.7, 0, sw); tyre.rotation.z = Math.PI / 2; tyre.updateMatrix();
    const rim = B.mesh(G.cyl, 'chrome', 0, 0, 0, 0.42, 0.24, 0.42, 0, sw); rim.rotation.z = Math.PI / 2; rim.updateMatrix();
    sw.traverse(o => { o.userData.dynamic = true; });
    game.spare = { mesh: sw, taken: false, fitted: false };
    B.interactable({
      id: 'spare-wheel', label: 'Take the spare wheel', pos: [26.6, 0.5, 1.2], n: [1, 0], approachDist: 0.9, enabled: () => !game.spare.taken,
      act: g => { if (g.carry) { g.ui.say('Your hands are full with the ' + g.carry + '.'); return; } g.spare.taken = true; g.carry = 'spare wheel'; g.spare.mesh.visible = false; g.audio.clunk(0.5); g.ui.say('The tyre is hard and the tread is good. A Rover wheel, but a wheel. You roll it out into the rain.', 5); },
    });
  }
  // on the bench, a car battery on charge: the gatekeeper kept the Rover's spare topped up
  { const bat = new THREE.Group(); bat.position.set(33.3, 0.9, 6.1); B.root.add(bat);
    B.box('black', 0, 0.1, 0, 0.26, 0.2, 0.17, 0, bat); B.box('black', 0, 0.2, 0, 0.26, 0.015, 0.17, 0, bat);
    for (const dz of [-0.06, 0.06]) B.mesh(G.cyl, 'metalDark', 0.08, 0.225, dz, 0.03, 0.03, 0.03, 0, bat);
    B.box(BM.Basic(0xd8c040), 0, 0.14, 0.086, 0.18, 0.06, 0.003, 0, bat);
    bat.traverse(o => { o.userData.dynamic = true; });
    game.battery = { mesh: bat, carried: false, fitted: false };
    B.box('metalDark', 33.76, 1.45, 6.1, 0.14, 0.3, 0.26); B.box('iron', 33.55, 1.2, 6.14, 0.012, 0.5, 0.012); B.box('iron', 33.55, 1.2, 6.02, 0.012, 0.5, 0.012); // the charger on the wall and its leads
    B.interactable({
      id: 'car-battery', label: 'Take the car battery', pos: [33.3, 1.0, 6.1], n: [-1, 0], approachDist: 0.85, enabled: () => !game.battery.carried && !game.battery.fitted,
      act: g => { if (g.carry) { g.ui.say('Your hands are full with the ' + g.carry + '.'); return; } g.battery.carried = true; g.carry = 'battery'; g.battery.mesh.visible = false; g.audio.clunk(0.7); g.ui.say('Heavy, and the terminals are clean. The charger\'s needle was still over on the right: it has been trickle-charging for fifty years. Get it to the car.', 6); },
    });
  }
  B.fixture({ id: 'garage-tube', name: 'Garage tube', circuit: 'lodge', on: false, kind: 'fluorescent', style: 'tube', pos: [30, 2.85, 3], colour: 0xe6f2ff, target: 1.6, range: 10, ry: Math.PI / 2, len: 1.6 });
  B.fixture({ id: 'garage-lantern', name: 'Garage lantern', circuit: 'lodge', on: false, kind: 'incandescent', style: 'lantern', pos: [26.8, 2.3, 8.3], nz: 1, colour: 0xffb866, target: 0.9, range: 7 });
  game.estateLights.garage.push('garage-tube', 'garage-lantern');
  B.lightSwitch('garage-switch', 'Garage light', [26.2, 1.4, 6.6], [1, 0], ['garage-tube']);
  B.readable('note-garage', 'Logbook in the glovebox', 'Rover 3500. Last entry, 18 October 1974, in a careful round hand:\n\n"Drove E. to the station. She would not get on the train. Drove her back. Father furious. Car stays here."\n\nThe keys are still in it.', [33.3, 0.92, 4.8], [-1, 0], { book: true });

  /* ---- garden shed (walk-in, lit) ---- */
  B.room = 'shed';
  const SH = { x0: -32, x1: -27, z0: -4, z1: 2, h: 2.6 };
  B.wall('z', SH.x0, SH.z0, SH.z1, { t: 0.15, mat: 'wood', y1: SH.h });
  B.wall('z', SH.x1, SH.z0, SH.z1, { t: 0.15, mat: 'wood', y1: SH.h });
  B.wall('x', SH.z0, SH.x0, SH.x1, { t: 0.15, mat: 'wood', y1: SH.h });
  B.wall('x', SH.z1, SH.x0, SH.x1, { t: 0.15, mat: 'wood', y1: SH.h }, [{ at: -29.5, w: 1.2, type: 'door', head: 2.1, id: 'shed-door' }]);
  B.boxE('floor', SH.x0, SH.x1, 0, 0.05, SH.z0, SH.z1);
  P.rect(SH.x0 - 0.2, SH.x1 + 0.2, SH.z0 - 0.2, SH.z1 + 0.2, SH.h + 0.12, SH.h, 'shed-roof');
  B.boxE('roof', SH.x0 - 0.2, SH.x1 + 0.2, SH.h, SH.h + 0.12, SH.z0 - 0.2, SH.z1 + 0.2);
  B.furniture('wood', -31.5, -1.0, 0, 0.8, 0.9, 3.6, 'potting bench');
  for (let i = 0; i < 5; i++) B.mesh(G.cyl, 'brick', -31.5, 1.0, -2.4 + i * 0.6, 0.22, 0.2, 0.22);
  B.fixture({ id: 'shed-bulb', name: 'Shed bulb', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [-29.5, 2.0, -1], ceiling: SH.h, colour: 0xffc070, target: 1.0, range: 6 });
  B.fixture({ id: 'shed-lantern', name: 'Shed lantern', circuit: 'lodge', on: false, kind: 'incandescent', style: 'lantern', pos: [-30.7, 2.0, 2.15], nz: 1, colour: 0xffb866, target: 0.8, range: 6 });
  game.estateLights.shed.push('shed-bulb', 'shed-lantern');
  B.lightSwitch('shed-switch', 'Shed light', [-28.7, 1.4, 1.9], [0, -1], ['shed-bulb']);
  B.readable('note-shed', "Gardener's list", 'Box along the drive — clip.\nYew — clip.\nPond — ducks fed, 2 handfuls.\nThe little stone outside the railings — cut round it. Miss E. asked. Told not to. Doing it anyway.\n\n— T.H., Nov 1975', [-27.12, 1.4, -2.5], [-1, 0], { plaque: true });

  return { paths: PATHS };
};
})();
