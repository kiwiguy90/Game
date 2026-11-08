/* ==========================================================================
   BLACKTHORN MANOR — 5. THE HOUSE
   Footprint x -18..18, z -12..12. Ground 0, upper 4.2, attic 8.2, cellar -3.2.
   A double-height entry hall with two sweeping curved staircases rising to a
   balcony round an open void. 27 glazed windows.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildMansion = function (B, game) {
  const P = B.phys, grid = B.grid;
  B.zone = 'mansion';
  const EXT = { t: 0.4, mat: 'plaster', matOut: 'stone' };
  const win = (at, id, o) => Object.assign({ at, w: 1.4, type: 'window', id }, o || {});
  const door = (at, id, o) => Object.assign({ at, w: 1.2, type: 'door', id }, o || {});
  const roomSwitch = (id, label, pos, n, ids) => B.lightSwitch(id, label, pos, n, ids);

  /* ======================= GROUND FLOOR ======================= */
  B.levelName = 'ground'; B.room = 'house';
  // floor (with the cellar stairwell cut out); ceiling skin is the upper slab
  B.floor('floor', -18, 18, -12, 12, 0, 0.2, [[-2.4, 3.6, -11.8, -10.0]]);
  // exterior walls, ground storey
  B.wall('x', 12, -18, 18, Object.assign({ outSign: 1 }, EXT), [
    win(-15, 'w-dining-1'), win(-9, 'w-dining-2'), win(-3.5, 'w-hall-l', { w: 1.2 }), win(3.5, 'w-hall-r', { w: 1.2 }),
    win(9, 'w-drawing-1'), win(15, 'w-drawing-2'), { at: 0, w: 2.4, type: 'door', head: 3.2, id: 'front-doors', casing: 'stone' }]);
  B.wall('x', -12, -18, 18, Object.assign({ outSign: -1 }, EXT), [win(-16, 'w-pantry-b', { w: 0.9 }), win(-11, 'w-kitchen-r'), door(-7.5, 'kitchen-door', { head: 2.2 }), door(-4.5, 'yard-door', { head: 2.2 }), win(0.6, 'w-stairhall', { w: 1.8 }), win(8, 'w-bath', { w: 0.9 }), win(14, 'w-service-b')]);
  B.wall('z', -18, -12, 12, Object.assign({ outSign: -1 }, EXT), [win(8, 'w-dining-w'), win(0, 'w-backsitting'), win(-9, 'w-pantry')]);
  B.wall('z', 18, -12, 12, Object.assign({ outSign: 1 }, EXT), [win(8, 'w-drawing-e'), win(0, 'w-library'), win(-9, 'w-service'), door(-5, 'back-door')]);
  // interior walls, ground
  // interior walls, ground. The front of the house: hall, dining, drawing, library, sitting room.
  // The back: a stair hall behind the entrance hall (the lift in its east wall, the cellar stairs along its
  // back wall, the garden door), the kitchen and pantry to the west, the bathroom and boot room to the east.
  B.wall('z', -6, -4, 12, { mat: 'panel' }, [door(9.6, 'd-hall-dining'), door(2.6, 'd-hall-backsitting'), door(-2, 'd-stairhall-sitting')]);
  B.wall('z', 6, -4, 12, { mat: 'panel' }, [door(9.6, 'd-hall-drawing'), door(2.6, 'd-hall-library')]);
  B.wall('x', 4, -18, -6, { mat: 'wallpaperGreen' }, [door(-12, 'd-dining-backsitting')]);
  B.wall('x', 4, 6, 18, { mat: 'wallpaper' }, [door(12, 'd-drawing-library')]);
  B.wall('x', 0, -6, 6, { mat: 'panel' }, [{ at: 0, w: 2.4, type: 'door', head: 2.8, id: 'arch-hall-back' }]); // a wide arch through to the stair hall
  B.wall('x', -4, -18, -6, { mat: 'plaster' });
  B.wall('x', -4, 6, 18, { mat: 'plaster' }, [door(13.3, 'd-library-service')]);
  B.wall('z', -6, -12, -4, { mat: 'plaster' }, [door(-6.5, 'd-kitchen')]);
  B.wall('z', -14, -12, -4, { mat: 'plaster' }, [door(-5.6, 'd-pantry')]);
  B.wall('z', 6, -12, -4, { mat: 'plaster' }, [door(-6.5, 'd-bath')]);
  B.wall('z', 10, -12, -4, { mat: 'tile' });

  /* ---- the front doors: two leaves that open inwards together on a long groan, and can be shut again ---- */
  // the kitchen door and the back door open onto the courtyard; the side door onto the east lawn
  game.kitchenDoor = B.hingedDoor({ id: 'kitchen-door', axis: 'x', at: -7.5, c: -12, w: 1.2, h: 2.1, hinge: 'low', swing: 1, outside: -1, mat: 'shutter', panelMat: 'boards', dur: 1.4, sound: 'creak', label: 'the kitchen door', wallT: 0.4 });
  game.yardDoor = B.hingedDoor({ id: 'yard-door', axis: 'x', at: -4.5, c: -12, w: 1.2, h: 2.1, hinge: 'high', swing: 1, outside: -1, mat: 'shutter', panelMat: 'boards', dur: 1.4, sound: 'creak', label: 'the back door', wallT: 0.4 });
  game.sideDoor = B.hingedDoor({ id: 'back-door', axis: 'z', at: -5, c: 18, w: 1.2, h: 2.1, hinge: 'low', swing: -1, outside: 1, mat: 'darkWood', dur: 1.4, sound: 'creak', label: 'the side door', wallT: 0.4 });
  game.frontDoors = B.hingedDoor({ id: 'front-doors', axis: 'x', at: 0, c: 12.0, w: 2.4, h: 3.1, hinge: 'both', swing: -1, mat: 'darkWood', dur: 3.2, sound: 'groan', label: 'the front doors', wallT: 0.4, maxAngle: 1.7 });
  B.mesh(G.ring, 'brass', -0.3, 1.5, 12.26, 0.18, 0.18, 0.18); B.mesh(G.ring, 'brass', 0.3, 1.5, 12.26, 0.18, 0.18, 0.18); // the knockers
  // porch steps and lanterns
  B.boxE('stone', -3, 3, 0, 0.06, 12.2, 15.2);
  for (const sx of [-1, 1]) {
    B.solid('stone', sx * 2.2 - 0.3, sx * 2.2 + 0.3, 0, 3.4, 12.2, 12.8, { kind: 'furniture', tag: 'porch column' });
    B.fixture({ id: 'porch' + sx, name: 'Porch lantern', room: 'porch', circuit: 'ground', on: false, kind: 'incandescent', style: 'lantern', pos: [sx * 2.2, 2.6, 12.95], nz: 1, colour: 0xffb366, target: 1.0, range: 7 });
  }

  /* ---- ENTRY HALL: double height, two curved stairs, balcony ---- */
  B.room = 'hall';
  B.boxE('marble', -5.9, 5.9, 0, 0.03, 0.1, 11.8);
  // curved staircases: centre (0,6), radius 2.6..4.0, both rising to the back
  const SC = { cx: 0, cz: 6, r0: 2.6, r1: 4.0 };
  P.arc(SC.cx, SC.cz, SC.r0, SC.r1, 0.5, Math.PI, 0, 4.2, 0, 'stair-right');
  P.arc(SC.cx, SC.cz, SC.r0, SC.r1, -Math.PI, -0.5, 4.2, 0, 0, 'stair-left');
  BM.buildGrandStair(B, SC, 4.2, 22); // the treads, runner, strings, balusters, rails and newels: see 31d
  // upper floor slab with the void cut out; balcony rails
  B.levelName = 'upper';
  const upperSlab = B.floor('floor', -18, 18, -12, 12, 4.2, 0.2, [[-4.6, 4.6, 2, 12]]);
  for (const r of upperSlab) B.boxE('plaster', r.x0, r.x1, 3.98, 4.0, r.z0, r.z1);
  const balRail = (x0, x1, z0, z1) => {
    P.addWall(x0, x1, z0, z1, 4.2, 5.2, { kind: 'rail' });
    B.boxE('darkWood', x0, x1, 5.12, 5.2, z0, z1);
    const len = Math.max(x1 - x0, z1 - z0), alongX = x1 - x0 > z1 - z0;
    for (let s = 0.1; s < len; s += 0.3) B.mesh(G.post, 'darkWood', alongX ? x0 + s : (x0 + x1) / 2, 4.66, alongX ? (z0 + z1) / 2 : z0 + s, 0.05, 0.92, 0.05);
  };
  balRail(-4.6, -1.5, 1.95, 2.05); balRail(1.5, 4.6, 1.95, 2.05);
  balRail(-4.65, -4.55, 2, 12); balRail(4.55, 4.65, 2, 12);
  B.levelName = 'ground';
  // hall furniture
  B.furniture('darkWood', -3.6, 10.9, 0, 1.6, 0.85, 0.6, 'hall table');
  B.furniture('darkWood', 5.45, 6.0, 0, 0.6, 1.0, 1.6, 'hall chest');
  B.furniture('fabricRed', -5.4, 5.6, 0, 0.7, 0.9, 1.6, 'hall settle');
  B.mesh(G.cyl, 'porcelain', -3.0, 1.05, 10.9, 0.3, 0.4, 0.3);
  B.picture(0, 7.42, 0.14, 0, 1.9, 0.78, 'house', 3); // the house itself, over the landing door
  // hall lights: chandelier and sconces, off at the panel
  const hallIds = [];
  const hall = (o) => { const l = B.fixture(Object.assign({ circuit: 'hall', on: false, colour: 0xffc786 }, o)); hallIds.push(l.id); return l; };
  hall({ id: 'hall-chandelier', name: 'Hall chandelier', kind: 'incandescent', style: 'chandelier', pos: [0, 6.2, 6], target: 2.4, range: 16 });
  hall({ id: 'hall-sconce-w1', name: 'Hall sconce', kind: 'incandescent', style: 'sconce', pos: [-5.85, 2.5, 4.3], nx: 1, target: 0.9, range: 7 });
  hall({ id: 'hall-sconce-w2', name: 'Hall sconce', kind: 'incandescent', style: 'sconce', pos: [-5.85, 2.5, 7.5], nx: 1, target: 0.9, range: 7 });
  hall({ id: 'hall-sconce-e1', name: 'Hall sconce', kind: 'bang', style: 'sconce', pos: [5.85, 2.5, 4.3], nx: -1, target: 0.9, range: 7, scorch: true });
  hall({ id: 'hall-sconce-e2', name: 'Hall sconce', kind: 'incandescent', style: 'sconce', pos: [5.85, 2.5, 7.5], nx: -1, target: 0.9, range: 7 });
  hall({ id: 'hall-sconce-b1', name: 'Balcony sconce', kind: 'incandescent', style: 'sconce', pos: [-2.6, 6.6, 0.15], nz: 1, target: 0.8, range: 7 });
  hall({ id: 'hall-sconce-b2', name: 'Balcony sconce', kind: 'incandescent', style: 'sconce', pos: [2.6, 6.6, 0.15], nz: 1, target: 0.8, range: 7, dead: true });
  game.hallLights = hallIds;
  // three switches on one board by the front door: the porch lanterns, the wall lights, the chandelier
  const sconces = hallIds.filter(id => id !== 'hall-chandelier');
  roomSwitch('sw-porch', 'Porch lanterns', [1.8, 1.4, 11.77], [0, -1], ['porch-1', 'porch1']);
  roomSwitch('sw-hall-sconces', 'Hall wall lights', [2.0, 1.4, 11.77], [0, -1], sconces);
  roomSwitch('sw-hall-chandelier', 'Hall chandelier', [2.2, 1.4, 11.77], [0, -1], ['hall-chandelier']);
  B.readable('note-solicitor', "Solicitor's letter", [
    'Harrow & Lisle, Solicitors. 3 March.',
    'Dear Sir or Madam, we write regarding the estate of the late Miss A. Blackthorn, who has named you as sole beneficiary of Blackthorn Manor.',
    'We should advise that the house has stood unoccupied since October 1974 and that the supply has never been formally disconnected. The family appear to have simply locked the gates. Keys enclosed.',
    'We are instructed to pass on one sentence from Miss Blackthorn without comment: "Tell them to put the lights on, and to look."',
  ].join('\n\n'), [-3.9, 0.86, 10.75], [0, -1]);

  /* ---- DINING ROOM (west circuit) ---- */
  B.room = 'dining';
  B.furniture('darkWood', -12, 8, 0, 5.0, 0.78, 1.4, 'dining table');
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) B.furniture('wood', -13.8 + i * 1.2, 8 + s * 1.05, 0, 0.5, 0.95, 0.5, 'dining chair');
  B.furniture('darkWood', -17.5, 8.0, 0, 0.5, 0.9, 2.4, 'sideboard');
  B.fixture({ id: 'dining-pendant', name: 'Dining chandelier', circuit: 'west', style: 'chandelier', pos: [-12, 3.0, 8.3], colour: 0xffc786, target: 1.8, range: 11 });
  B.fixture({ id: 'dining-sconce', name: 'Dining sconce', circuit: 'west', style: 'sconce', pos: [-17.7, 2.4, 5.0], nx: 1, colour: 0xffc786, target: 0.7, range: 6, dead: true });
  roomSwitch('sw-dining', 'Dining room lights', [-6.25, 1.4, 10.8], [-1, 0], ['dining-pendant', 'dining-sconce']);
  B.readable('note-dining', 'Place card and menu', 'Dinner, Friday 18 October 1974\n\nConsommé · Sole Véronique · Pheasant · Syllabub\n\nGuests: Dr R. Haldane. Mr P. Voss (solicitor).\n\nThe card at the head of the table reads ELEANOR. Someone has crossed it out and written the name of a different chair.', [-12.0, 0.79, 8.62], [0, 1], { approachDist: 1.2 });
  // ceiling fan (west circuit), stops where it stands
  const fanA = new THREE.Group(); fanA.position.set(-12, 3.7, 5.4); B.root.add(fanA);
  B.mesh(G.cyl, 'brass', 0, 0.12, 0, 0.18, 0.25, 0.18, 0, fanA);
  for (let i = 0; i < 4; i++) B.box('darkWood', 0, 0, 0, 1.3, 0.02, 0.18, i * Math.PI / 2, fanA).position.x = 0;
  fanA.children.slice(1).forEach((b, i) => { b.position.set(Math.cos(i * Math.PI / 2) * 0.6, 0, -Math.sin(i * Math.PI / 2) * 0.6); b.updateMatrix(); });
  fanA.traverse(o => { o.userData.dynamic = true; });
  const fan1 = grid.addAppliance({ id: 'fan-dining', name: 'Ceiling fan', kind: 'fan', circuit: 'west', room: 'dining', pos: [-12, 3.7, 5.4] });
  fan1.object = fanA;
  B.box('brass', -9.5, 1.4, 4.13, 0.1, 0.16, 0.04);
  B.interactable({ id: 'fan-dining-switch', label: () => fan1.switchedOn ? 'Ceiling fan: switch off' : 'Ceiling fan: switch on', pos: [-9.5, 1.4, 4.14], n: [0, 1], act: g => g.toggleAppliance(fan1) });

  /* ---- DRAWING ROOM (east circuit), with a fire that needs no power ---- */
  B.room = 'drawing';
  B.boxE('carpet', 7.5, 16.5, 0, 0.02, 6, 11);
  B.furniture('fabricGreen', 12, 10.6, 0, 3.0, 0.9, 1.0, 'sofa');
  B.furniture('fabricGreen', 8.0, 7.4, 0, 1.0, 0.9, 1.0, 'armchair');
  B.furniture('darkWood', 12.4, 8.0, 0, 1.6, 0.45, 0.8, 'tea table');
  B.furniture('darkWood', 16.9, 10.8, 0, 1.2, 0.8, 0.6, 'writing desk');
  // (the fireplace is built with the other hearths)
  B.fixture({ id: 'drawing-pendant', name: 'Drawing room light', circuit: 'east', style: 'chandelier', pos: [12, 3.0, 8], colour: 0xffc786, target: 1.6, range: 11 });
  B.fixture({ id: 'drawing-lamp', name: 'Standard lamp', circuit: 'east', kind: 'lamp', style: 'lamp', pos: [6.9, 1.5, 6.4], colour: 0xffb870, target: 0.8, range: 6 });
  B.furniture('wood', 6.9, 6.4, 0, 0.36, 1.05, 0.36, 'lamp stand');
  roomSwitch('sw-drawing', 'Drawing room lights', [6.25, 1.4, 10.8], [1, 0], ['drawing-pendant', 'drawing-lamp']);
  B.readable('note-drawing', 'Letter, Edmund to Charles', [
    'Whitehall, 4 May 1962.',
    'Charles — the gates were the right idea. Nobody leaves and nobody asks, and a girl who cannot get to the village cannot tell the village anything.',
    'As to Eleanor. She is thirteen and she has started asking the men questions. You must make Margaret understand that a girl who frightens the staff is a girl who is unwell, and an unwell girl is not believed. Say she is not right. Say it often. In a family like ours the word for it is cursed, and people are very happy to use it.',
    '— E.',
  ].join('\n\n'), [12.4, 0.46, 7.65], [0, -1]);
  // desk fan on the writing desk (east circuit)
  const fanB = new THREE.Group(); fanB.position.set(16.9, 1.05, 11.15); B.root.add(fanB);
  B.mesh(G.cyl, 'iron', 0, -0.2, 0, 0.16, 0.06, 0.16, 0, fanB);
  B.mesh(G.post, 'iron', 0, -0.1, 0, 0.03, 0.2, 0.03, 0, fanB);
  const blades = new THREE.Group(); fanB.add(blades);
  for (let i = 0; i < 3; i++) { const b = B.box('brass', 0, 0, 0, 0.04, 0.3, 0.02, 0, blades); b.rotation.set(0, 0, i * Math.PI * 2 / 3); b.position.set(Math.sin(i * 2.094) * 0.12, Math.cos(i * 2.094) * 0.12, 0); b.updateMatrix(); }
  fanB.traverse(o => { o.userData.dynamic = true; });
  const fan2 = grid.addAppliance({ id: 'fan-desk', name: 'Desk fan', kind: 'fan', circuit: 'east', room: 'drawing', pos: [16.9, 1.05, 11.15] });
  fan2.object = blades; fan2.axis = 'z';
  B.interactable({ id: 'fan-desk-switch', label: () => fan2.switchedOn ? 'Desk fan: switch off' : 'Desk fan: switch on', pos: [16.6, 0.9, 11.4], n: [-1, 0], approachDist: 1.0, act: g => g.toggleAppliance(fan2) });

  /* ---- LIBRARY OF MIRRORS (east) ---- */
  B.room = 'library';
  B.boxE('carpet', 7, 17, 0, 0.02, -3, 3);
  // shelves on the east wall either side of the window; pier glasses face each other N and S
  B.furniture('darkWood', 17.55, -2.6, 0, 0.5, 3.4, 2.2, 'bookcase');
  B.furniture('darkWood', 17.55, 2.6, 0, 0.5, 3.4, 2.2, 'bookcase');
  for (const z of [-2.6, 2.6]) for (let s = 0; s < 6; s++) B.box(s % 2 ? 'fabricRed' : 'fabricGreen', 17.25, 0.4 + s * 0.55, z, 0.1, 0.36, 2.0);
  game.mirrors = [];
  for (const [x, z, nz] of [[9, 3.88, -1], [15, 3.88, -1], [9, -3.88, 1], [15, -3.88, 1]]) {
    B.box('gilt', x, 1.9, z + nz * 0.0, 1.5, 3.0, 0.06);
    const m = B.mesh(G.plane, BM.Basic(0x1c2228), x, 1.9, z + nz * 0.04, 1.2, 2.6, 1);
    m.rotation.y = nz > 0 ? 0 : Math.PI; m.updateMatrix();
    m.userData.dynamic = true; m.userData.mirror = true;
    game.mirrors.push({ mesh: m, nz, x, z });
  }
  B.furniture('darkWood', 12, -0.2, 0, 0.6, 1.1, 0.6, 'lectern');
  B.furniture('fabricRed', 8.0, -2.9, 0, 0.9, 0.9, 0.9, 'reading chair');
  B.fixture({ id: 'library-pendant', name: 'Library light', circuit: 'east', style: 'chandelier', pos: [12, 3.1, 0], colour: 0xffcf8c, target: 1.7, range: 11 });
  B.fixture({ id: 'library-lamp', name: 'Reading lamp', circuit: 'east', kind: 'lamp', style: 'lamp', pos: [8.6, 1.5, -3.4], colour: 0xffb870, target: 0.7, range: 5 });
  B.furniture('wood', 8.6, -3.4, 0, 0.3, 1.05, 0.3, 'lamp stand');
  roomSwitch('sw-library', 'Library lights', [6.25, 1.4, 1.5], [1, 0], ['library-pendant', 'library-lamp']);
  B.readable('note-lease', "The electrician's account, 1961", [
    'PARDOE & SON, ELECTRICAL CONTRACTORS. To C.A. Blackthorn Esq., Blackthorn Manor. 9 November 1961.',
    'To supplying and fitting one electric motor to the Lane gates, with closing contact let into the drive, so that the gates close of themselves upon any car or person passing in.',
    'To one control switch for the same, fitted in the cellar as instructed, on the house supply, the gates to be opened from that switch and from nowhere else. The release in the lodge to draw the bolt only.',
    'We would respectfully note that a gate which cannot be opened from the lodge is contrary to usual practice. Fitted as instructed. Paid, with thanks.',
  ].join('\n\n'), [12, 1.12, 0.08], [0, 1], { book: true });

  /* ---- BACK SITTING ROOM (west), with the television ---- */
  B.room = 'back sitting';
  B.boxE('carpet', -16.5, -7.5, 0, 0.02, -2.5, 2.8);
  B.furniture('fabricCream', -15.5, -3.3, 0, 2.6, 0.85, 0.9, 'settee');
  B.furniture('wood', -16.7, 2.7, 0, 1.2, 0.7, 0.7, 'tv cabinet');
  const tvScreen = B.box(BM.Own(0x0a0c0c), -16.25, 1.05, 2.7, 0.04, 0.42, 0.56);
  B.box('darkWood', -16.6, 1.05, 2.7, 0.7, 0.62, 0.8);
  tvScreen.userData.dynamic = true;
  const tv = grid.addAppliance({ id: 'tv', name: 'Television', kind: 'tv', circuit: 'west', room: 'back sitting', pos: [-16.2, 1.05, 2.7] });
  tv.object = tvScreen;
  B.interactable({ id: 'tv-switch', label: () => tv.switchedOn ? 'Television: switch off' : 'Television: switch on', pos: [-16.2, 0.8, 2.7], n: [1, 0], approachDist: 1.2, act: g => g.toggleAppliance(tv) });
  B.fixture({ id: 'backsitting-pendant', name: 'Sitting room light', circuit: 'west', style: 'pendant', pos: [-12, 3.2, 0], ceiling: 4, colour: 0xffc786, target: 1.4, range: 9 });
  B.fixture({ id: 'backsitting-lamp', name: 'Table lamp', circuit: 'west', kind: 'lamp', style: 'lamp', pos: [-7.0, 1.3, -3.4], colour: 0xffb870, target: 0.6, range: 5 });
  B.furniture('wood', -7.0, -3.4, 0, 0.5, 0.8, 0.5, 'side table');
  roomSwitch('sw-backsitting', 'Sitting room lights', [-6.25, 1.4, 3.6], [-1, 0], ['backsitting-pendant', 'backsitting-lamp']);
  B.readable('note-newspaper', 'Newspaper, 22 October 1974', 'THE COUNTY GAZETTE\n\nBLACKTHORN GIRL "TO REST ABROAD"\n\nThe family of Blackthorn Manor confirmed last night that Miss Eleanor Blackthorn, 25, will travel to a private clinic in Switzerland "for her nerves". A spokesman for the family declined to comment on local rumours, describing their daughter as "troubled since childhood" and asking for privacy.', [-15.5, 0.87, -3.3], [0, 1]);

  /* ---- THE STAIR HALL (ground circuit): behind the entrance hall, through the arch ---- */
  B.room = 'corridor';
  B.fixture({ id: 'lobby-pendant', name: 'Stair hall light', circuit: 'ground', style: 'pendant', pos: [0, 3.2, -3.5], ceiling: 4, colour: 0xffc786, target: 1.2, range: 9 });
  B.fixture({ id: 'corridor-w', name: 'Stair hall light', circuit: 'ground', style: 'pendant', pos: [-3, 3.3, -8.5], ceiling: 4, colour: 0xffc786, target: 0.9, range: 7, blink: 0.25 });
  B.fixture({ id: 'corridor-e', name: 'Cellar stair light', circuit: 'ground', style: 'pendant', pos: [2.5, 3.3, -9.2], ceiling: 4, colour: 0xffc786, target: 0.9, range: 7 });
  roomSwitch('sw-corridor', 'Stair hall lights', [-2.2, 1.4, -0.25], [0, -1], ['lobby-pendant', 'corridor-w', 'corridor-e']);
  // the cellar stairs: a straight flight down along the back wall, from a landing in the south-east corner
  P.ramp(-2.4, 3.6, -11.8, -10.0, 'x', -3.2, 0, -3.2, 'cellar stairs');
  for (let i = 0; i < 16; i++) { const x = 3.6 - (i + 0.5) * 6.0 / 16, top = -3.2 * (i + 1) / 16; B.boxE('wood', x - 0.19, x + 0.19, -3.2, top + 0.02, -11.8, -10.0); B.boxE('stone', x - 0.19, x + 0.19, top, top + 0.025, -11.78, -10.02); }
  P.addWall(-2.4, 3.6, -10.0, -9.9, 0, 1.0, { kind: 'rail' });
  P.addWall(-2.5, -2.4, -11.8, -9.9, 0, 1.0, { kind: 'rail' });
  B.boxE('darkWood', -2.45, 3.6, 0.95, 1.02, -10.02, -9.9); B.boxE('darkWood', -2.5, -2.4, 0.95, 1.02, -11.8, -9.9);
  for (let x = -2.3; x < 3.6; x += 0.3) B.mesh(G.post, 'darkWood', x, 0.48, -9.96, 0.035, 0.95, 0.035);
  for (const z of [-11.5, -11.0, -10.5]) B.mesh(G.post, 'darkWood', -2.45, 0.48, z, 0.035, 0.95, 0.035);
  B.mesh(G.post, 'darkWood', -2.45, 0.6, -9.95, 0.12, 1.2, 0.12); B.mesh(G.post, 'darkWood', 3.6, 0.6, -9.95, 0.12, 1.2, 0.12); // newels
  // below, the stair's open side is walled down to the cellar floor
  B.solid('brick', -2.4, 3.6, -3.2, -0.2, -10.0, -9.8);
  B.readable('sign-cellar', 'A painted board', 'CELLAR\n\nMind the step. Lamp on the left.', [4.8, 1.6, -11.78], [0, 1], { plaque: true });

  /* ---- KITCHEN (ground circuit, fluorescent) ---- */
  B.room = 'kitchen';
  B.boxE('tile', -13.9, -6.1, 0, 0.02, -11.8, -4.1);
  B.furniture('wood', -10, -8.0, 0, 2.6, 0.9, 1.2, 'kitchen table');
  B.furniture('metalDark', -13.5, -9.6, 0, 0.8, 0.95, 3.4, 'range');
  B.furniture('white', -11, -11.45, 0, 2.4, 0.9, 0.6, 'sink unit');
  B.furniture('wood', -6.45, -9.6, 0, 0.5, 2.0, 2.4, 'dresser');
  B.fixture({ id: 'kitchen-tube', name: 'Kitchen tube', circuit: 'ground', kind: 'fluorescent', style: 'tube', pos: [-10, 3.9, -8], colour: 0xeaf4ff, target: 1.8, range: 10, flicker: 0.25 });
  roomSwitch('sw-kitchen', 'Kitchen light', [-6.25, 1.4, -5.4], [-1, 0], ['kitchen-tube']);
  const radio1Box = B.box('wood', -11.1, 1.05, -8.2, 0.42, 0.28, 0.22);
  const radio1Dial = B.box(BM.Own(0x221608), -11.1, 1.07, -8.08, 0.3, 0.08, 0.02); radio1Dial.userData.dynamic = true;
  const radio1 = grid.addAppliance({ id: 'radio-kitchen', name: 'Kitchen radio', kind: 'radio', circuit: 'ground', room: 'kitchen', pos: [-11.1, 1.05, -8.2], station: 0 });
  radio1.object = radio1Dial;
  B.interactable({ id: 'radio-kitchen-switch', label: () => radio1.switchedOn ? 'Radio: switch off' : 'Radio: switch on', pos: [-11.1, 1.0, -7.45], n: [0, 1], act: g => g.toggleAppliance(radio1) });
  B.readable('note-cook', "Cook's note", "Mrs Blackthorn,\n\nI have done the trays as asked but I will not carry them up to Miss Eleanor's door again. It is locked on the outside and she talks to me through it. Last night she asked me to tell the gatekeeper she is still here. I did not, and I have not slept.\n\nI give my notice from Friday.\n\nAgnes Pell", [-10.0, 0.91, -7.9], [0, 1]);

  /* ---- PANTRY: the fuse board, through the kitchen ---- */
  B.room = 'pantry';
  B.furniture('wood', -16.0, -4.45, 0, 3.6, 2.2, 0.5, 'pantry shelves');
  for (let i = 0; i < 12; i++) B.mesh(G.cyl, i % 3 ? 'porcelain' : 'brick', -17.4 + (i % 6) * 0.55, 1.2 + Math.floor(i / 6) * 0.6, -4.5, 0.18, 0.25, 0.18);
  B.fixture({ id: 'pantry-tube', name: 'Pantry tube', circuit: 'ground', kind: 'fluorescent', style: 'tube', pos: [-16, 3.9, -8], colour: 0xeaf4ff, target: 1.3, range: 7, len: 1.2 });
  B.interactable({
    id: 'fuse-board', label: 'Fuse board', pos: [-14.3, 1.75, -8.0], n: [-1, 0], kind: 'control', approachDist: 0.95,
    act: g => g.ui.openFuseBoard(),
  });
  roomSwitch('sw-pantry', 'Pantry light', [-14.25, 1.4, -6.3], [-1, 0], ['pantry-tube']);
  B.readable('note-electrician', "Electrician's tag", "ESTATE SUPPLY — BLACKTHORN\n\nLodge main must be ON before anything in the house will take.\nHall circuit runs direct from the lodge.\nEverything else is fed through MAIN here. Throwing MAIN brings every circuit and every fitting back as it was left.\n\nLeft as instructed 21/10/74: ALL ON. Do not touch. — W.G.", [-14.3, 1.35, -9.4], [-1, 0], { plaque: true });

  /* ---- BATHROOM ---- */
  B.room = 'bathroom';
  B.boxE('tile', 6.1, 9.9, 0, 0.02, -11.8, -4.1);
  B.furniture('porcelain', 8.6, -10.9, 0, 1.7, 0.6, 0.8, 'bath');
  B.furniture('porcelain', 9.55, -7.6, 0, 0.5, 0.85, 0.6, 'basin');
  B.fixture({ id: 'bath-light', name: 'Bathroom light', circuit: 'ground', style: 'bulkhead', pos: [8, 3.6, -4.25], nz: -1, colour: 0xf2e6d0, target: 0.9, range: 6 });
  roomSwitch('sw-bath', 'Bathroom light', [6.25, 1.4, -5.4], [1, 0], ['bath-light']);

  /* ---- THE BOOT ROOM, off the library, with the side door ---- */
  B.room = 'service';
  B.furniture('wood', 17.4, -6.95, 0, 0.8, 1.8, 1.6, 'linen press');
  B.fixture({ id: 'service-light', name: 'Service room light', circuit: 'ground', style: 'pendant', pos: [14, 3.3, -8], ceiling: 4, colour: 0xffc786, target: 1.0, range: 8 });
  roomSwitch('sw-service', 'Boot room light', [15.1, 1.4, -4.25], [0, -1], ['service-light']);

  /* ======================= UPPER FLOOR ======================= */
  B.levelName = 'upper';
  const U = { y0: 4.2, y1: 8.2 };
  B.room = 'house';
  B.wall('x', 12, -18, 18, Object.assign({ outSign: 1 }, EXT, U), [win(-15, 'w-bed1-1'), win(-9, 'w-bed1-2'), win(0, 'w-hall-upper', { w: 1.8, sill: 1.0, head: 3.0 }), win(9, 'w-bed2-1'), win(15, 'w-bed2-2')]);
  B.wall('x', -12, -18, 18, Object.assign({ outSign: -1 }, EXT, U), [win(-12, 'w-eleanor-bed-r'), win(-2.5, 'w-landing'), win(12, 'w-nursery-b')]);
  B.wall('z', -18, -12, 12, Object.assign({ outSign: -1 }, EXT, U), [win(8, 'w-bed1-w'), win(0, 'w-eleanor-sitting'), win(-9, 'w-eleanor-bed-w')]);
  B.wall('z', 18, -12, 12, Object.assign({ outSign: 1 }, EXT, U), [win(8, 'w-bed2-e'), win(0, 'w-gallery'), win(-9, 'w-nursery')]);
  B.wall('z', -6, -4, 12, Object.assign({ mat: 'panel' }, U), [door(9.6, 'd-bal-bed1'), door(2.6, 'd-bal-eleanor')]);
  B.wall('z', 6, -4, 12, Object.assign({ mat: 'panel' }, U), [door(9.6, 'd-bal-bed2'), door(2.6, 'd-bal-gallery')]);
  B.wall('x', 4, -18, -6, Object.assign({ mat: 'wallpaperBlue' }, U), [door(-12, 'd-bed1-eleanor')]);
  B.wall('x', 4, 6, 18, Object.assign({ mat: 'wallpaper' }, U), [door(17.0, 'd-bed2-gallery')]);
  B.wall('x', 0, -6, 6, Object.assign({ mat: 'panel' }, U), [{ at: 0, w: 2.0, type: 'door', head: 2.6, id: 'd-balcony-landing' }]);
  // the back of the first floor: one landing over the stair hall; Eleanor's bedroom west of it, the nursery east
  B.wall('x', -4, -18, -6, Object.assign({ mat: 'plaster' }, U), [door(-12, 'd-eleanor-corridor')]);
  B.wall('x', -4, 6, 18, Object.assign({ mat: 'plaster' }, U), [door(12, 'd-gallery-corridor')]);
  B.wall('z', -6, -12, -4, Object.assign({ mat: 'plaster' }, U), [door(-8, 'd-eleanor-bed')]);
  B.wall('z', 6, -12, -4, Object.assign({ mat: 'plaster' }, U), [door(-8, 'd-nursery')]);
  // attic floor slab (ceiling of the upper storey and the hall)
  B.levelName = 'attic';
  const atticSlab = B.floor('floor', -18, 18, -12, 12, 8.2, 0.2);
  for (const r of atticSlab) B.boxE('plaster', r.x0, r.x1, 7.98, 8.0, r.z0, r.z1);
  B.levelName = 'upper';

  /* ---- landing and upper corridor (east circuit); the loft ladder ---- */
  B.room = 'upper corridor';
  B.fixture({ id: 'landing-pendant', name: 'Landing light', circuit: 'east', style: 'pendant', pos: [0, 7.3, -2], ceiling: 8, colour: 0xffc786, target: 1.1, range: 8 });
  B.fixture({ id: 'upcorr-w', name: 'Upper corridor light', circuit: 'west', style: 'pendant', pos: [-2.5, 7.3, -8.5], ceiling: 8, colour: 0xffc786, target: 0.9, range: 7 });
  B.fixture({ id: 'upcorr-e', name: 'Upper corridor light', circuit: 'east', style: 'pendant', pos: [2.5, 7.3, -8.5], ceiling: 8, colour: 0xffc786, target: 0.9, range: 7, dead: true });
  roomSwitch('sw-landing', 'Landing lights', [1.4, 5.6, -0.15], [0, -1], ['landing-pendant', 'upcorr-w', 'upcorr-e']);
  // loft ladder from the landing up through a hatch
  for (let i = 0; i < 10; i++) B.box('wood', -3.5, 4.4 + i * 0.4, -4.75, 0.6, 0.05, 0.08);
  B.box('wood', -3.82, 6.2, -4.75, 0.05, 4.0, 0.08); B.box('wood', -3.18, 6.2, -4.75, 0.05, 4.0, 0.08);
  B.interactable({
    id: 'ladder-up', kind: 'ladder', label: 'Climb the loft ladder', pos: [-3.5, 5.4, -4.75], n: [0, 1], approachDist: 0.85,
    links: [{ x: -3.5, y: 8.2, z: -3.4 }], act: g => g.climb({ x: -3.5, y: 8.2, z: -3.4 }, 0),
  });
  B.levelName = 'attic';
  B.interactable({
    id: 'ladder-down', kind: 'ladder', label: 'Climb down the loft ladder', pos: [-3.5, 8.6, -4.75], n: [0, 1], approachDist: 0.85,
    links: [{ x: -3.5, y: 4.2, z: -3.6 }], act: g => g.climb({ x: -3.5, y: 4.2, z: -3.6 }, Math.PI),
  });
  B.levelName = 'upper';

  /* ---- Bedroom 1 (Charles & Margaret) (west) ---- */
  B.room = 'bedroom1';
  B.boxE('carpet', -16.8, -7.2, 4.2, 4.22, 5.2, 11.2);
  B.furniture('fabricCream', -12, 9.6, 4.2, 2.0, 0.7, 2.2, 'bed');
  B.furniture('darkWood', -12, 11.55, 4.2, 2.2, 1.4, 0.3, 'headboard');
  B.furniture('darkWood', -17.45, 6.0, 4.2, 0.6, 2.2, 1.6, 'wardrobe');
  B.furniture('darkWood', -9.3, 4.5, 4.2, 1.4, 0.8, 0.5, 'dressing table');
  B.fixture({ id: 'bed1-pendant', name: 'Bedroom light', circuit: 'west', style: 'pendant', pos: [-12, 7.3, 8], ceiling: 8, colour: 0xffc786, target: 1.2, range: 9, dead: true });
  B.fixture({ id: 'bed1-lamp', name: 'Bedside lamp', circuit: 'west', kind: 'lamp', style: 'lamp', pos: [-14.3, 5.5, 11.3], colour: 0xffb870, target: 0.6, range: 5 });
  B.furniture('wood', -14.3, 11.3, 4.2, 0.5, 0.75, 0.5, 'bedside table');
  roomSwitch('sw-bed1', 'Bedroom lights', [-6.25, 5.6, 10.8], [-1, 0], ['bed1-pendant', 'bed1-lamp']);
  B.readable('note-margaret', "Margaret's diary", "21 October 1974.\n\nThey signed it tonight. Haldane came up to the house with the papers, and Charles signed, and Edmund signed, and I signed. Eleanor would not. She stood in the hall with the paper in her hand and said you are not sending me anywhere, Mother, you are keeping me, you have kept me since I was thirteen, and she tore it in half.\n\nCharles says the order does not need her name. It never did. They only wanted her to be one of us.\n\nI have told the vicar she is ill. God forgive me, it is easier.", [-9.3, 5.01, 4.6], [0, 1]);

  /* ---- Bedroom 2 (guest) (east) ---- */
  B.room = 'bedroom2';
  B.boxE('carpet', 7.2, 16.8, 4.2, 4.22, 5.2, 11.2);
  B.furniture('fabricRed', 12, 9.6, 4.2, 1.6, 0.7, 2.2, 'bed');
  B.furniture('darkWood', 17.45, 6.0, 4.2, 0.6, 2.2, 1.6, 'wardrobe');
  B.furniture('darkWood', 9.0, 4.5, 4.2, 1.2, 0.8, 0.5, 'chest of drawers');
  B.fixture({ id: 'bed2-pendant', name: 'Guest room light', circuit: 'east', style: 'pendant', pos: [12, 7.3, 8], ceiling: 8, colour: 0xffc786, target: 1.2, range: 9 });
  roomSwitch('sw-bed2', 'Guest room light', [6.25, 5.6, 10.8], [1, 0], ['bed2-pendant']);
  const radio2Box = B.box('wood', 9.0, 5.16, 4.5, 0.42, 0.28, 0.22);
  const radio2Dial = B.box(BM.Own(0x221608), 9.0, 5.18, 4.62, 0.3, 0.08, 0.02); radio2Dial.userData.dynamic = true;
  const radio2 = grid.addAppliance({ id: 'radio-guest', name: 'Guest room radio', kind: 'radio', circuit: 'east', room: 'bedroom2', pos: [9.0, 5.16, 4.5], station: 1 });
  radio2.object = radio2Dial;
  B.interactable({ id: 'radio-guest-switch', label: () => radio2.switchedOn ? 'Radio: switch off' : 'Radio: switch on', pos: [9.0, 5.1, 4.75], n: [0, 1], act: g => g.toggleAppliance(radio2) });
  B.readable('note-haldane', 'Calling card', 'R. J. HALDANE, M.D.\nHarley Street\n\nOn the back, in pencil: "Bed made up for Voss. He will want to see the girl before the papers go. Keep her in her room. Gates to stay shut."', [12.6, 4.93, 8.45], [0, -1]);

  /* ---- Eleanor's sitting room (west) ---- */
  B.room = "eleanor's sitting room";
  B.boxE('carpet', -16.8, -7.2, 4.2, 4.22, -3, 3);
  B.furniture('fabricCream', -15.8, -3.3, 4.2, 2.2, 0.85, 0.8, 'chaise');
  B.furniture('wood', -9.0, 0.5, 4.2, 1.4, 0.76, 0.8, 'writing table');
  B.furniture('darkWood', -17.5, -2.6, 4.2, 0.5, 2.6, 2.0, 'bookcase');
  B.fixture({ id: 'eleanor-pendant', name: "Eleanor's lamp", circuit: 'west', style: 'pendant', pos: [-12, 7.3, 0], ceiling: 8, colour: 0xffd29a, target: 1.2, range: 9 });
  B.fixture({ id: 'eleanor-lamp', name: 'Desk lamp', circuit: 'west', kind: 'lamp', style: 'lamp', pos: [-9.5, 5.45, 0.7], colour: 0xffb870, target: 0.6, range: 5 });
  roomSwitch('sw-eleanor', "Eleanor's room lights", [-6.25, 5.6, 3.6], [-1, 0], ['eleanor-pendant', 'eleanor-lamp']);
  B.readable('note-order', 'Reception order (unsigned copy)', [
    'IN THE MATTER OF ELEANOR MARY BLACKTHORN, aged 25, of Blackthorn Manor.',
    'On the certificate of R.J. Haldane M.D. that the patient is of unsound mind and a danger to herself, the patient is to be received into private care at a place to be nominated by the family, with effect from 22 October 1974, and is not to leave it without the family\'s consent.',
    'Consent: C.A. Blackthorn ✓   E.J. Blackthorn ✓   M. Blackthorn ✓   Patient: ________',
    'Across the bottom, in ink, pressed so hard it has gone through: "I am not ill. I will not sign. You will have to keep the gates shut for ever. — Eleanor"',
  ].join('\n\n'), [-8.5, 4.97, 0.5], [1, 0]);

  /* ---- Portrait gallery (east): Eleanor's portrait turned to the wall ---- */
  B.room = 'gallery';
  B.boxE('floor', 6.2, 17.8, 4.2, 4.22, -3.8, 3.8);
  const portraits = [['Charles Blackthorn, 1960', 8.5], ['Margaret Blackthorn, 1960', 11.5], ['Edmund Blackthorn, 1962', 14.5]];
  portraits.forEach(([name, x], i) => B.picture(x, 6.2, 3.88, Math.PI, 1.1, 1.5, 'portrait', 11 + i));
  B.box('darkWood', 15.5, 6.0, -3.86, 1.3, 1.8, 0.08); // the turned portrait: you see its back
  B.fixture({ id: 'gallery-1', name: 'Picture light', circuit: 'east', style: 'sconce', pos: [8.5, 7.3, 3.8], nz: -1, colour: 0xffd29a, target: 0.7, range: 5 });
  B.fixture({ id: 'gallery-2', name: 'Picture light', circuit: 'east', style: 'sconce', pos: [11.5, 7.3, 3.8], nz: -1, colour: 0xffd29a, target: 0.7, range: 5, dead: true });
  B.fixture({ id: 'gallery-3', name: 'Picture light', circuit: 'east', style: 'sconce', pos: [14.5, 7.3, 3.8], nz: -1, colour: 0xffd29a, target: 0.7, range: 5 });
  B.fixture({ id: 'gallery-4', name: 'Picture light', circuit: 'east', style: 'sconce', pos: [15.5, 7.3, -3.8], nz: 1, colour: 0xffd29a, target: 0.7, range: 5, lightType: 'subtlePulse' });
  roomSwitch('sw-gallery', 'Gallery lights', [6.25, 5.6, 1.5], [1, 0], ['gallery-1', 'gallery-2', 'gallery-3', 'gallery-4']);
  B.readable('plaque-eleanor', 'A portrait turned to the wall', 'ELEANOR BLACKTHORN, b. 1949\n\nThe brass plate is on the back now, because the picture has been hung facing the wall. Someone has chalked on the backing board, years ago:\n\n"THE CURSED ONE"\n\nIn a different hand underneath: "the only one who said no."', [15.5, 5.4, -3.8], [0, 1], { plaque: true });

  /* ---- Eleanor's bedroom (west, rear) ---- */
  B.room = "eleanor's bedroom";
  B.furniture('fabricCream', -15.5, -11.0, 4.2, 2.2, 0.6, 1.4, 'narrow bed');
  B.furniture('wood', -7.0, -11.4, 4.2, 1.2, 0.76, 0.6, 'school desk');
  B.fixture({ id: 'eleanor-bed-light', name: 'Bedroom light', circuit: 'west', style: 'pendant', pos: [-12, 7.3, -9], ceiling: 8, colour: 0xffd29a, target: 1.0, range: 8 });
  roomSwitch('sw-eleanor-bed', "Eleanor's bedroom light", [-6.25, 5.6, -6.9], [-1, 0], ['eleanor-bed-light']);
  B.readable('note-voss', 'Letter to Eleanor', "Miss Blackthorn — I am told you have been writing to the newspapers. Your family has explained your condition to them. You will find nobody prints the letters of a cursed girl.\n\nIf you want to help those people, sign the order and let it be finished quietly. If you do not, it will be finished anyway, and you will have to live in this house knowing you could not stop it.\n\nP. Voss", [-7.0, 4.97, -11.2], [0, 1]);

  /* ---- Nursery (east, rear) ---- */
  B.room = 'nursery';
  B.furniture('wood', 15.5, -10.5, 4.2, 1.4, 0.9, 0.8, 'cot');
  B.furniture('fabricRed', 8.5, -11.2, 4.2, 0.8, 0.9, 0.9, 'rocking horse');
  B.fixture({ id: 'nursery-light', name: 'Nursery light', circuit: 'east', style: 'pendant', pos: [12, 7.3, -9], ceiling: 8, colour: 0xffd29a, target: 1.0, range: 8 });
  roomSwitch('sw-nursery', 'Nursery light', [6.25, 5.6, -6.9], [1, 0], ['nursery-light']);

  /* ---- Linen room ---- */
  B.room = 'linen';
  B.furniture('wood', 0, -11.45, 4.2, 4.0, 2.2, 0.6, 'linen shelves');
  B.fixture({ id: 'linen-light', name: 'Back landing light', circuit: 'east', style: 'bulkhead', pos: [0, 7.2, -11.75], nz: 1, colour: 0xf2e6d0, target: 0.8, range: 6 });
  roomSwitch('sw-linen', 'Back landing light', [1.65, 5.6, -0.15], [0, -1], ['linen-light']);

  /* ======================= ATTIC ======================= */
  B.levelName = 'attic'; B.room = 'attic';
  // roof: two pitched planes, plus stepped occluders/colliders under them
  for (const s of [-1, 1]) {
    if (s < 0) {
      const r = B.box('roof', 0, 10.0, s * 6.3, 37.2, 0.25, 13.2);
      r.rotation.x = s * 0.278; r.updateMatrix();
      const ri = B.box('wood', 0, 9.85, s * 6.3, 36, 0.05, 13.0);
      ri.rotation.x = s * 0.278; ri.updateMatrix();
    } else {
      // the south plane leaves a gap for the clock tower's shaft (x -4..4, z 6.5 on)
      for (const [x0, x1, zl] of [[-18.6, -4, 13.2], [4, 18.6, 13.2], [-4, 4, 6.5 / Math.cos(0.278)]]) {
        const cz = zl === 13.2 ? 6.3 : 6.5 / 2, cy = zl === 13.2 ? 10.0 : 11.8 - 3.25 * Math.tan(0.278);
        const r = B.box('roof', (x0 + x1) / 2, cy, cz, x1 - x0, 0.25, zl); r.rotation.x = 0.278; r.updateMatrix();
        const ri = B.box('wood', (x0 + x1) / 2, cy - 0.15, cz, x1 - x0 - 0.2, 0.05, zl - 0.2); ri.rotation.x = 0.278; ri.updateMatrix();
      }
    }
    for (let i = 0; i < 6; i++) {
      const za = s * (12.6 - i * 2.1), zb = s * (12.6 - (i + 1) * 2.1);
      if (s > 0 && Math.min(za, zb) < 12.2 && Math.max(za, zb) > 6.5) {
        P.addWall(-18.2, -4, za, zb, 8.2 + i * 0.6, 8.2 + (i + 1) * 0.6 + 0.4, { kind: 'wall' });
        P.addWall(4, 18.2, za, zb, 8.2 + i * 0.6, 8.2 + (i + 1) * 0.6 + 0.4, { kind: 'wall' });
      } else P.addWall(-18.2, 18.2, za, zb, 8.2 + i * 0.6, 8.2 + (i + 1) * 0.6 + 0.4, { kind: 'wall' });
    }
  }
  // gable ends
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const w = 12.6 - i * 2.1;
    B.solid('stone', sx * 18 - 0.2, sx * 18 + 0.2, 8.2 + i * 0.6, 8.2 + (i + 1) * 0.6, -w, w);
  }
  // chimney stacks rise through the attic
  for (const x of [-10, 10]) { B.solid('brick', x - 0.6, x + 0.6, 8.2, 13, -0.6, 0.6); }
  B.box('brick', -10, 12.6, 0, 1.4, 1.2, 1.4); B.box('brick', 10, 12.6, 0, 1.4, 1.2, 1.4);
  // hatch surround
  B.boxE('darkWood', -4.1, -2.9, 8.2, 8.3, -5.3, -4.2);
  // trunks, dress form, rocking chair
  B.furniture('wood', -13, 3.2, 8.2, 1.2, 0.6, 0.7, 'trunk');
  B.furniture('darkWood', 13.5, -2.5, 8.2, 1.0, 0.7, 0.7, 'trunk');
  B.furniture('wood', 6.0, 3.8, 8.2, 1.4, 0.5, 0.8, 'tea chest');
  B.furniture('fabricCream', -6.0, 3.0, 8.2, 0.5, 1.6, 0.5, 'dress form');
  B.furniture('wood', -14.0, -2.4, 8.2, 1.6, 0.78, 0.8, 'old desk');
  B.fixture({ id: 'attic-1', name: 'Attic bulb', circuit: 'attic', style: 'pendant', pos: [-12, 10.4, 0], ceiling: 11.4, colour: 0xffc070, target: 1.1, range: 8 });
  B.fixture({ id: 'attic-2', name: 'Attic bulb', circuit: 'attic', style: 'pendant', pos: [0, 10.4, -1], ceiling: 11.6, colour: 0xffc070, target: 1.1, range: 8 });
  B.fixture({ id: 'attic-3', name: 'Attic bulb', circuit: 'attic', style: 'pendant', pos: [12, 10.4, 0], ceiling: 11.4, colour: 0xffc070, target: 1.1, range: 8, flicker: 0.2 });
  roomSwitch('sw-attic', 'Attic lights', [-9.35, 9.6, 0], [1, 0], ['attic-1', 'attic-2', 'attic-3']);
  B.readable('journal', "Eleanor's journal", [
    'This is the last book. They are taking me "abroad" in the morning.',
    'If you are reading this, the lights are on, and you have come up here in the dark to find it, which is more than any of them ever did.',
    'You will have found out about the gates. My father had them wired in 1961, the year I was thirteen and started asking questions. A contact in the drive: anything that passes in, they shut behind, and bolt. I have heard that bang every day of my life. "Abroad" is this attic. "Cursed" was the easiest word they had.',
    'They do not open from the lodge, whatever the man there believes. The release only draws the bolt. The motor is worked from one switch, in the cellar, by the boiler, on the house supply. He thought nobody would ever look for it there.',
    'Put the house on. Go down and throw it. Then do not stop for anything: walk down the drive and out, and do not look back at the windows. Somebody should get out of here. It was never going to be me.',
    '— E.',
  ].join('\n\n'), [-14.0, 8.99, -2.1], [0, 1], { book: true });

  /* ======================= CELLAR ======================= */
  B.levelName = 'cellar'; B.room = 'cellar';
  const CY = -3.2;
  B.floor('stone', -18, 18, -12, 2, CY, 0.3);
  const CEL = { t: 0.4, mat: 'brick', y0: CY, y1: 0 };
  B.wall('x', 2, -18, 18, CEL);
  B.wall('z', -18, -12, 2, CEL); B.wall('z', 18, -12, 2, CEL);
  B.wall('x', -12, -18, 18, CEL, [{ at: -12, w: 1.3, type: 'door', head: 2.2, id: 'd-cellar-hatch', casing: 'brick' }]);
  B.wall('z', -6, -12, 2, { mat: 'brick', y0: CY, y1: 0 }, [door(-4, 'd-cellar-w')]);
  B.wall('z', 6, -12, 2, { mat: 'brick', y0: CY, y1: 0 }, [door(0.6, 'd-cellar-e')]);
  // wine racks, boiler, coal
  B.furniture('wood', -17.5, -5, CY, 0.6, 2.2, 6.0, 'wine rack');
  for (let i = 0; i < 24; i++) B.mesh(G.cyl, 'fabricGreen', -17.45, CY + 0.3 + (i % 6) * 0.33, -7.4 + Math.floor(i / 6) * 1.6, 0.09, 0.3, 0.09).userData.bottle = true;
  B.furniture('metalDark', -3.5, -0.5, CY, 1.6, 2.2, 1.6, 'boiler');
  B.mesh(G.cyl, 'metalDark', -3.5, CY + 2.9, -0.5, 0.3, 1.4, 0.3);
  B.fixture({ id: 'cellar-1', name: 'Cellar bulb', circuit: 'cellar', style: 'cage', pos: [-12, -0.6, -5], colour: 0xffbb70, target: 0.9, range: 7 });
  B.fixture({ id: 'cellar-2', name: 'Cellar bulb', circuit: 'cellar', style: 'cage', pos: [0, -0.6, -6], colour: 0xffbb70, target: 1.0, range: 8 });
  B.fixture({ id: 'cellar-3', name: 'Cellar bulb', circuit: 'cellar', style: 'cage', pos: [12, -0.6, -5], colour: 0xffbb70, target: 0.9, range: 7, dead: true });
  B.fixture({ id: 'cellar-4', name: 'Cellar bulb', circuit: 'cellar', style: 'cage', pos: [12, -0.6, -1], colour: 0xffbb70, target: 0.8, range: 7 });
  roomSwitch('sw-cellar', 'Cellar lights', [17.75, -1.8, -9.2], [-1, 0], ['cellar-1', 'cellar-2', 'cellar-3', 'cellar-4']);
  // a coal heap, and the gate motor's cable running up the wall from the box by the boiler
  B.mesh(G.lowSphere, 'black', 8, CY + 0.35, -10.5, 2.6, 0.9, 2.2);
  B.box('metalDark', 17.78, CY + 1.6, -5.5, 0.04, 3.2, 0.06);
  B.box('metalDark', 17.78, CY + 3.15, -8.5, 0.04, 0.06, 6.0);
};
})();
