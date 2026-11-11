/* ==========================================================================
   BLACKTHORN MANOR — 6p. THE COACH HOUSE
   East of the house, on the old stable yard: a brick coach house of two
   storeys. Below, a big double garage behind two green up-and-over doors,
   with the Rover laid up under its sheet in one bay and Eleanor's shooting
   brake in the other, and beside it a guest room with its own front door
   and a stair. Above, across the whole building, the annexe: a sitting room
   with a kitchen corner over the garage, a bedroom and a bathroom. The
   garage lights are on the estate panel; the annexe has its own switches.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const CH = { x0: 34, xm: 44, x1: 50, z0: -6, z1: 4, g: 3.0, up: 3.2, top: 5.8, ridge: 8.0 };
BM.COACH_HOUSE = CH;

/* the up-and-over door: a ribbed steel panel that swings up into the roof on its runners */
function upAndOver(B, game, id, x, z, w, h) {
  const P = B.phys;
  const pivot = new THREE.Group(); pivot.position.set(x, h, z + 0.02); B.root.add(pivot);
  B.box('garageGreen', 0, -h / 2, 0, w, h, 0.05, 0, pivot);
  for (let k = 1; k < 12; k++) B.box('garageGreen', -w / 2 + k * w / 12, -h / 2, 0.035, 0.05, h - 0.1, 0.02, 0, pivot);   // the pressed ribs
  B.box('chrome', 0, -h + 0.35, 0.06, 0.24, 0.05, 0.04, 0, pivot);                                                       // the handle
  B.box('black', 0, -h + 0.32, 0.05, 0.05, 0.05, 0.02, 0, pivot);
  pivot.traverse(o => { o.userData.dynamic = true; }); pivot.matrixAutoUpdate = true;
  for (const sx of [-1, 1]) B.box('metalDark', x + sx * (w / 2 + 0.03), h - 0.05, z - 1.2, 0.04, 0.05, 2.4);             // the runners inside
  const wall = P.addWall(x - w / 2, x + w / 2, z - 0.15, z + 0.15, 0, h, { kind: 'door', tag: id, enabled: false });
  const gd = { id, pivot, wall, open: true, t: 1, moving: false, z };
  const act = g2 => g2.toggleGarageDoor(gd);
  const suffix = id === 'garage-door' ? '' : '-2';
  B.interactable({ id: 'garage-door-out' + suffix, label: () => gd.open ? 'Pull the garage door down' : 'Lift the garage door', pos: [x + w / 2 - 0.9, 1.0, z + 0.1], n: [0, 1], act });
  B.interactable({ id: 'garage-door-in' + suffix, label: () => gd.open ? 'Pull the garage door down' : 'Lift the garage door', pos: [x - w / 2 + 0.9, 1.0, z - 0.1], n: [0, -1], act });
  return gd;
}

/* Eleanor's car: a long, low shooting brake in deep maroon, chrome and glass, nose to the back wall */
function shootingBrake(B, cx, cz) {
  const paint = new THREE.MeshPhongMaterial({ color: 0x4e1518, specular: 0x555555, shininess: 90 });
  const L = 4.5, W = 1.74, z = l => cz - L / 2 + l;   // l: 0 at the nose, L at the tail
  // the body: a long lower hull, a bonnet that drops to the grille, and wings over the wheels
  B.boxE(paint, cx - W / 2, cx + W / 2, 0.66, 0.86, z(0.12), z(L - 0.05));                      // the upper hull, over the wheels
  for (const [a, b] of [[0.12, 0.4], [1.3, L - 1.4], [L - 0.5, L - 0.05]]) B.boxE(paint, cx - W / 2, cx + W / 2, 0.3, 0.66, z(a), z(b));   // valances and sills between the arches
  B.boxE('carTrim', cx - W / 2 + 0.12, cx + W / 2 - 0.12, 0.3, 0.66, z(0.4), z(L - 0.5));       // the floorpan, deep in shadow
  B.boxE(paint, cx - W / 2 + 0.04, cx + W / 2 - 0.04, 0.86, 0.94, z(0.2), z(1.55));            // the bonnet
  B.boxE(paint, cx - W / 2 + 0.03, cx + W / 2 - 0.03, 0.86, 0.95, z(L - 0.75), z(L - 0.06));   // the tail deck
  B.boxE('carTrim', cx - W / 2 - 0.005, cx + W / 2 + 0.005, 0.6, 0.64, z(0.3), z(L - 0.2));     // a dark waist line
  // the glasshouse: a long estate cabin running back to the tailgate
  const g0 = z(1.55), g1 = z(L - 0.12);
  B.boxE('darkGlass', cx - W / 2 + 0.1, cx + W / 2 - 0.1, 0.95, 1.4, g0 + 0.12, g1 - 0.04);
  B.boxE(paint, cx - W / 2 + 0.08, cx + W / 2 - 0.08, 1.4, 1.46, g0 + 0.2, g1);                  // the roof
  for (const sx of [-1, 1]) for (const zz of [g0 + 0.16, z(2.6), z(3.5), g1 - 0.06])
    B.boxE(paint, cx + sx * (W / 2 - 0.13) - 0.03, cx + sx * (W / 2 - 0.13) + 0.03, 0.95, 1.4, zz - 0.04, zz + 0.04);
  { const ws = B.mesh(G.box, 'darkGlass', cx, 1.18, g0 + 0.08, W - 0.24, 0.48, 0.05); ws.rotation.x = -0.55; ws.updateMatrix(); }   // the windscreen, raked
  // chrome: bumpers, the grille, the headlamps, a strip along the side
  for (const [zz, d] of [[z(0.05), 0.12], [z(L), 0.1]]) B.boxE('chrome', cx - W / 2 - 0.04, cx + W / 2 + 0.04, 0.34, 0.46, zz - d / 2, zz + d / 2);
  B.boxE('chrome', cx - 0.42, cx + 0.42, 0.5, 0.84, z(0.1), z(0.14));
  for (let i = -3; i <= 3; i++) B.boxE('carTrim', cx + i * 0.11 - 0.025, cx + i * 0.11 + 0.025, 0.53, 0.81, z(0.08), z(0.1));
  for (const sx of [-1, 1]) {
    const h = B.mesh(G.cyl, 'chrome', cx + sx * 0.64, 0.72, z(0.12), 0.24, 0.05, 0.24); h.rotation.x = Math.PI / 2; h.updateMatrix();
    const lens = B.mesh(G.disc, 'white', cx + sx * 0.64, 0.72, z(0.09), 0.19, 0.19, 1); lens.rotation.y = Math.PI; lens.updateMatrix();
    B.boxE('chrome', cx + sx * (W / 2 + 0.005) - 0.005, cx + sx * (W / 2 + 0.005) + 0.005, 0.7, 0.72, z(0.4), z(L - 0.3));
    B.boxE(BM.Basic(0x3a0806), cx + sx * 0.66 - 0.1, cx + sx * 0.66 + 0.1, 0.62, 0.74, z(L) - 0.06, z(L) - 0.04);   // the tail lamps
    B.boxE('chrome', cx + sx * (W / 2 + 0.02) - 0.02, cx + sx * (W / 2 + 0.02) + 0.02, 0.98, 1.02, g0 + 0.3, g0 + 0.42); // the door mirrors
  }
  // the wheels, with chrome hubcaps, under dark arches
  for (const sx of [-1, 1]) for (const l of [0.85, L - 0.95]) {
    const w = B.mesh(G.cyl, 'rubber', cx + sx * (W / 2 - 0.12), 0.33, z(l), 0.66, 0.2, 0.66); w.rotation.z = Math.PI / 2; w.updateMatrix();
    const hub = B.mesh(G.cyl, 'chrome', cx + sx * (W / 2 - 0.02), 0.33, z(l), 0.36, 0.03, 0.36); hub.rotation.z = Math.PI / 2; hub.updateMatrix();
  }
  B.phys.addWall(cx - W / 2 - 0.05, cx + W / 2 + 0.05, cz - L / 2, cz + L / 2 + 0.05, 0, 1.46, { kind: 'furniture', tag: 'shooting brake' });
}

BM.buildCoachHouse = function (B, game) {
  const P = B.phys;
  B.zone = 'exterior'; B.levelName = 'ground';
  const { x0, xm, x1, z0, z1 } = CH;
  const win = (at, id, o) => Object.assign({ at, w: 1.2, type: 'window', id }, o || {});
  const GUEST = { t: 0.3, mat: 'plaster', matOut: 'brick' };

  /* ======================= GROUND: THE GARAGE ======================= */
  B.room = 'garage';
  const G1 = 36.6, G2 = 41.4, GW = 3.0, GH = 2.5;
  B.wall('x', z1, x0, xm, { t: 0.3, mat: 'brick', y1: CH.up }, [
    { at: G1, w: GW, type: 'door', head: GH, id: 'garage-door', casing: 'iron' }, { at: G2, w: GW, type: 'door', head: GH, id: 'garage-door-2', casing: 'iron' }]);
  B.wall('x', z0, x0, xm, { t: 0.3, mat: 'brick', y1: CH.up }, [win(39.8, 'w-garage-back', { sill: 1.2, head: 2.3 })]);
  B.wall('z', x0, z0, z1, { t: 0.3, mat: 'brick', y1: CH.up }, [{ at: -3.0, w: 1.0, type: 'door', head: 2.1, id: 'garage-side-door' }]);
  game.garageSideDoor = B.hingedDoor({ id: 'garage-side-door', axis: 'z', at: -3.0, c: x0, w: 1.0, h: 2.1, hinge: 'low', swing: 1, outside: -1, mat: 'shutter', panelMat: 'boards', dur: 1.3, sound: 'creak', label: 'the garage side door', wallT: 0.3 });
  B.boxE('concrete', x0 - 1.2, x0 - 0.15, 0, 0.05, -3.8, -2.2);                                         // the step outside it
  B.wall('z', xm, z0 + 0.15, z1 - 0.15, { t: 0.2, mat: 'brick', y1: CH.g }, [{ at: -4, w: 0.9, type: 'door', head: 2.1, id: 'garage-annexe' }]);
  B.boxE('concrete', x0 + 0.15, xm - 0.1, 0, 0.04, z0 + 0.15, z1 - 0.15);
  B.boxE('plaster', x0 + 0.15, xm - 0.1, CH.g - 0.02, CH.g, z0 + 0.15, z1 - 0.15);                      // the garage ceiling
  B.boxE('concrete', 34.6, 43.4, 0, 0.05, 4.15, 9.0);                                                    // the apron
  // the doors
  const d1 = upAndOver(B, game, 'garage-door', G1, z1, GW - 0.1, GH - 0.02);
  const d2 = upAndOver(B, game, 'garage-door-2', G2, z1, GW - 0.1, GH - 0.02);
  game.garageDoor = d1; game.garageDoors = [d1, d2];

  // bay one: the Rover, laid up under a fitted cover: the sheet takes the car's shape, bonnet, screen, roof and boot, and hangs to the hubs
  const RZ = -1.2;
  P.addWall(G1 - 0.95, G1 + 0.95, RZ - 2.2, RZ + 2.2, 0, 1.45, { kind: 'furniture', tag: 'car under a sheet' });
  { const geo = BM.statuaryGeo('sheetedCar', () => {
      const pts = [[-2.2, 0.32], [-2.24, 0.62], [-2.15, 0.86], [-1.2, 0.98], [-0.55, 1.02], [0.05, 1.42], [1.0, 1.45], [1.45, 1.08], [2.1, 1.0], [2.24, 0.78], [2.2, 0.32]];
      const sh = new THREE.Shape(pts.map(q => new THREE.Vector2(q[0], q[1])));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 4, curveSegments: 8 });
      g.translate(0, 0, -0.8); g.rotateY(Math.PI / 2);
      // the cloth: let it sag between the high points, and ripple at the hem
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        pos.setY(i, y - 0.03 * Math.sin(z * 3.1) * Math.sin(x * 2.3) - (y < 0.5 ? 0.02 * Math.sin(z * 11 + x * 7) : 0)); }
      g.computeVertexNormals();
      return g; });
    B.mesh(geo, 'dustSheet', G1, 0, RZ, 1, 1, 1); }
  for (const [dx, dz] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.4], [0.85, 1.4]]) { const w = B.mesh(G.cyl, 'rubber', G1 + dx, 0.35, RZ + dz, 0.7, 0.25, 0.7); w.rotation.z = Math.PI / 2; w.updateMatrix(); }
  // bay two: the shooting brake, uncovered, the dust on it like felt
  shootingBrake(B, G2, -1.15);
  B.readable('note-brake', 'A card under the wiper', 'Pencil, on the back of a garage bill:\n\n"E. — the keys are with your father and they are staying there. You are not to take it out again. Not in this weather and not on your own. — M."\n\nThe car has not moved since. The tyres have sat flat on the concrete in the same four places for fifty years.', [G2 - 0.6, 0.955, -2.05], [-1, 0], { ry: 0.3 });

  // the back wall: a bench, a battery on charge, shelves, a pegboard of tools
  B.furniture('wood', 36.8, -5.42, 0, 3.0, 0.9, 0.7, 'workbench');
  B.box('wood', 36.8, 1.55, -5.8, 2.4, 0.9, 0.04);                                                        // the pegboard
  for (let i = 0; i < 9; i++) B.box(i % 3 ? 'metalDark' : 'iron', 35.8 + i * 0.25, 1.5 + (i % 2) * 0.15, -5.76, 0.04, 0.32 + (i % 3) * 0.08, 0.02);
  B.furniture('metalDark', 42.9, -5.5, 0, 1.6, 1.9, 0.5, 'linen shelves');
  for (const [x, y] of [[42.4, 0.45], [43.2, 0.45], [42.6, 1.05], [43.3, 1.6]]) B.box(['rust', 'garageGreen', 'wood', 'metal'][Math.floor(x * 7 + y * 3) % 4], x, y, -5.5, 0.32, 0.26, 0.28);
  // on the bench, a car battery on charge: the gatekeeper kept the Rover's spare topped up
  { const bat = new THREE.Group(); bat.position.set(37.9, 0.9, -5.45); B.root.add(bat);
    B.box('black', 0, 0.1, 0, 0.26, 0.2, 0.17, 0, bat); B.box('black', 0, 0.2, 0, 0.26, 0.015, 0.17, 0, bat);
    for (const dz of [-0.06, 0.06]) B.mesh(G.cyl, 'metalDark', 0.08, 0.225, dz, 0.03, 0.03, 0.03, 0, bat);
    B.box(BM.Basic(0xd8c040), 0, 0.14, 0.086, 0.18, 0.06, 0.003, 0, bat);
    bat.traverse(o => { o.userData.dynamic = true; });
    game.battery = { mesh: bat, carried: false, fitted: false };
    B.box('metalDark', 37.9, 1.42, -5.8, 0.26, 0.3, 0.14); B.box('iron', 37.84, 1.18, -5.6, 0.012, 0.5, 0.012); B.box('iron', 37.96, 1.18, -5.6, 0.012, 0.5, 0.012); // the charger on the wall and its leads
    B.interactable({
      id: 'car-battery', label: 'Take the car battery', pos: [37.9, 1.0, -5.45], n: [0, 1], approachDist: 0.85, enabled: () => !game.battery.carried && !game.battery.fitted,
      act: g => { if (g.carry) { g.ui.say('Your hands are full with the ' + g.carry + '.'); return; } g.battery.carried = true; g.carry = 'battery'; g.battery.mesh.visible = false; g.audio.clunk(0.7); g.ui.say('Heavy, and the terminals are clean. The charger\'s needle was still over on the right: it has been trickle-charging for fifty years. Get it to the car.', 6); },
    });
  }
  B.readable('note-garage', 'Logbook from the glovebox', 'Rover 3500. Last entry, 18 October 1974, in a careful round hand:\n\n"Drove E. to the station. She would not get on the train. Drove her back. Father furious. Car stays here."\n\nThe keys are still in it.', [35.7, 0.92, -5.4], [0, 1], { book: true });
  // a spare wheel leaning on the wall by the doors, the tyre still good
  { const sw = new THREE.Group(); sw.position.set(34.55, 0.36, 2.2); sw.rotation.set(0, 0, 0.18); B.root.add(sw);
    const tyre = B.mesh(G.cyl, 'rubber', 0, 0, 0, 0.7, 0.22, 0.7, 0, sw); tyre.rotation.z = Math.PI / 2; tyre.updateMatrix();
    const rim = B.mesh(G.cyl, 'chrome', 0, 0, 0, 0.42, 0.24, 0.42, 0, sw); rim.rotation.z = Math.PI / 2; rim.updateMatrix();
    sw.traverse(o => { o.userData.dynamic = true; });
    game.spare = { mesh: sw, taken: false, fitted: false };
    B.interactable({
      id: 'spare-wheel', label: 'Take the spare wheel', pos: [34.6, 0.5, 2.2], n: [1, 0], approachDist: 0.9, enabled: () => !game.spare.taken,
      act: g => { if (g.carry) { g.ui.say('Your hands are full with the ' + g.carry + '.'); return; } g.spare.taken = true; g.carry = 'spare wheel'; g.spare.mesh.visible = false; g.audio.clunk(0.5); g.ui.say('The tyre is hard and the tread is good. A Rover wheel, but a wheel. You roll it out into the rain.', 5); },
    });
  }
  // the garage lights, on the estate panel, and a switch by the doors
  B.fixture({ id: 'garage-tube', name: 'Garage tube', circuit: 'lodge', on: false, kind: 'fluorescent', style: 'tube', pos: [G1, 2.85, -1.2], colour: 0xe6f2ff, target: 1.6, range: 10, ry: Math.PI / 2, len: 1.6 });
  B.fixture({ id: 'garage-tube-2', name: 'Garage tube', circuit: 'lodge', on: false, kind: 'fluorescent', style: 'tube', pos: [G2, 2.85, -1.2], colour: 0xe6f2ff, target: 1.5, range: 10, ry: Math.PI / 2, len: 1.6 });
  B.fixture({ id: 'garage-lantern', name: 'Garage lantern', circuit: 'lodge', on: false, kind: 'incandescent', style: 'lantern', pos: [(G1 + G2) / 2, 2.5, 4.3], nz: 1, colour: 0xffb866, target: 0.9, range: 7 });
  B.fixture({ id: 'annexe-lantern', name: 'Annexe lantern', circuit: 'lodge', on: false, kind: 'incandescent', style: 'lantern', pos: [45.9, 2.3, 4.3], nz: 1, colour: 0xffb866, target: 0.8, range: 6 });
  B.fixture({ id: 'garage-side-lamp', name: 'Garage side lamp', circuit: 'lodge', on: false, kind: 'incandescent', style: 'lantern', pos: [x0 - 0.3, 2.4, -1.9], nx: -1, colour: 0xffb866, target: 0.7, range: 6 });
  game.estateLights.garage.push('garage-tube', 'garage-tube-2', 'garage-lantern', 'annexe-lantern', 'garage-side-lamp');
  B.lightSwitch('garage-switch', 'Garage light', [34.17, 1.4, 3.1], [1, 0], ['garage-tube', 'garage-tube-2']);

  /* ======================= GROUND: THE GUEST ROOM ======================= */
  B.room = 'annexe room';
  B.wall('x', z1, xm, x1, Object.assign({ outSign: 1, y1: CH.up }, GUEST), [{ at: 46.8, w: 1.0, type: 'door', head: 2.1, id: 'annexe-door' }, win(49.0, 'w-annexe-s', { w: 1.0 })]);
  B.wall('x', z0, xm, x1, Object.assign({ outSign: -1, y1: CH.up }, GUEST), [win(47.6, 'w-annexe-n', { w: 1.0 })]);
  B.wall('z', x1, z0, z1, Object.assign({ outSign: 1, y1: CH.up }, GUEST), [win(0, 'w-annexe-e')]);
  B.boxE('floor', xm + 0.1, x1 - 0.15, 0, 0.04, z0 + 0.15, z1 - 0.15);
  B.boxE('plaster', xm + 0.1, x1 - 0.15, CH.g - 0.02, CH.g, z0 + 0.15, -2.0);
  B.boxE('plaster', 45.3, x1 - 0.15, CH.g - 0.02, CH.g, -2.0, z1 - 0.15);
  game.annexeDoor = B.hingedDoor({ id: 'annexe-door', axis: 'x', at: 46.8, c: z1, w: 1.0, h: 2.1, hinge: 'low', swing: -1, mat: 'shutter', panelMat: 'boards', dur: 1.3, sound: 'creak', label: 'the annexe door', wallT: 0.3 });
  // the stair: a straight flight up beside the garage wall, from the front door end
  const SX0 = 44.12, SX1 = 45.22, SZ0 = -2.0, SZ1 = 3.0;
  P.ramp(SX0, SX1, SZ0, SZ1, 'z', CH.up, 0, 0, 'annexe stair');
  for (let i = 0; i < 16; i++) { const zz = SZ1 - (i + 0.5) * (SZ1 - SZ0) / 16, top = CH.up * (i + 1) / 16, d = (SZ1 - SZ0) / 32;
    B.boxE('darkWood', SX0, SX1, Math.max(0, top - 0.2), top, zz - d, zz + d); }
  B.solid('panel', 45.22, 45.32, 0, CH.g, SZ0, 1.0, { kind: 'wall' });                                  // the stair's side, panelled
  P.addWall(45.22, 45.32, 1.0, 2.5, 0, 1.0, { kind: 'rail' });
  B.boxE('darkWood', 45.22, 45.32, 0.95, 1.02, 1.0, 2.5); B.mesh(G.post, 'darkWood', 45.27, 0.55, 2.45, 0.1, 1.1, 0.1);
  for (let zz = 1.15; zz < 2.4; zz += 0.3) B.mesh(G.post, 'darkWood', 45.27, 0.48, zz, 0.035, 0.95, 0.035);
  // a guest bedroom
  B.furniture('fabricCream', 49.3, -4.8, 0, 1.0, 0.65, 2.0, 'bed');
  B.furniture('wood', 48.35, -5.5, 0, 0.45, 0.6, 0.45, 'bedside table');
  B.furniture('darkWood', 46.4, -5.5, 0, 1.2, 2.0, 0.6, 'wardrobe');
  B.furniture('fabricGreen', 48.6, 1.6, 0, 0.8, 0.85, 0.8, 'armchair');
  B.box('fabricRed', 47.6, 0.045, -0.8, 2.2, 0.01, 1.6);                                                  // a rag rug
  B.fixture({ id: 'annexe-room-light', name: 'Annexe room light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [47.6, 2.55, -0.6], ceiling: CH.g, colour: 0xffc27a, target: 1.0, range: 7 });
  B.fixture({ id: 'annexe-stair-light', name: 'Annexe stair light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [45.4, 2.6, -4.0], ceiling: CH.g, colour: 0xffc27a, target: 0.7, range: 6 });
  B.lightSwitch('sw-annexe-room', 'Annexe room light', [47.65, 1.4, z1 - 0.17], [0, -1], ['annexe-room-light', 'annexe-stair-light']);

  /* ======================= UPSTAIRS: THE ANNEXE ======================= */
  B.levelName = 'annexe';
  const U = CH.up, UH = CH.top - CH.up;
  B.floor('boards', x0 + 0.15, x1 - 0.15, z0 + 0.15, z1 - 0.15, U, 0.2, [[SX0 - 0.02, SX1, SZ0, SZ1]]);
  // the outer walls, upstairs
  B.room = 'annexe flat';
  B.wall('x', z1, x0, x1, Object.assign({ outSign: 1, y0: U, y1: CH.top }, GUEST), [win(36.5, 'w-flat-s1'), win(41.5, 'w-flat-s2'), win(47.0, 'w-bedroom-s', { w: 1.0 })]);
  B.wall('x', z0, x0, x1, Object.assign({ outSign: -1, y0: U, y1: CH.top }, GUEST), [win(39.5, 'w-flat-n')]);
  B.wall('z', x0, z0, z1, Object.assign({ outSign: -1, y0: U, y1: CH.top }, GUEST), [win(1.6, 'w-flat-w')]);
  B.wall('z', x1, z0, z1, Object.assign({ outSign: 1, y0: U, y1: CH.top }, GUEST), [win(1.0, 'w-bedroom-e', { w: 1.0 }), win(-4.0, 'w-bath-e', { w: 0.7, sill: 1.3, head: 2.3 })]);
  // the walls inside
  B.wall('z', xm, z0 + 0.15, z1 - 0.15, { t: 0.2, mat: 'wallpaper', y0: U, y1: CH.top }, [{ at: -4, w: 0.9, type: 'door', head: 2.1, id: 'd-annexe-sitting' }]);
  B.wall('z', 45.27, SZ0, z1 - 0.15, { t: 0.1, mat: 'wallpaperBlue', y0: U, y1: CH.top });
  B.wall('x', SZ0, 45.22, x1 - 0.15, { t: 0.2, mat: 'wallpaperBlue', y0: U, y1: CH.top }, [{ at: 46.2, w: 0.9, type: 'door', head: 2.1, id: 'd-annexe-bedroom' }]);
  B.wall('z', 47.0, z0 + 0.15, SZ0, { t: 0.2, mat: 'tile', y0: U, y1: CH.top }, [{ at: -4.0, w: 0.8, type: 'door', head: 2.1, id: 'd-annexe-bath' }]);
  B.boxE('plaster', x0 + 0.15, x1 - 0.15, CH.top - 0.02, CH.top, z0 + 0.15, z1 - 0.15);                  // the ceilings
  P.rect(x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, CH.top + 0.2, CH.top, 'coach-house-roof');

  // the sitting room over the garage: a sofa and chairs round a rug, a table by the back window, a kitchen corner
  B.box('carpet', 39.2, U + 0.01, 0.6, 4.4, 0.01, 3.0);
  B.furniture('fabricGreen', 39.2, 2.6, U, 2.4, 0.9, 0.9, 'sofa');
  B.furniture('fabricCream', 36.3, 0.3, U, 0.85, 0.9, 0.85, 'armchair');
  B.furniture('fabricCream', 42.2, 0.3, U, 0.85, 0.9, 0.85, 'armchair');
  B.furniture('darkWood', 39.2, 0.4, U, 1.1, 0.45, 0.6, 'side table');
  B.furniture('wood', 38.4, -4.3, U, 1.6, 0.76, 0.9, 'dining table');
  B.furniture('wood', 37.25, -4.3, U, 0.45, 0.9, 0.45, 'kitchen chair');
  B.furniture('wood', 39.55, -4.3, U, 0.45, 0.9, 0.45, 'kitchen chair');
  B.furniture('wood', 34.45, -2.4, U, 0.5, 2.0, 2.0, 'dresser');
  B.furniture('darkWood', 43.6, 1.6, U, 0.4, 1.9, 1.4, 'bookcase');
  B.readable('annexe-guestbook', "The visitors' book", 'A fat book bound in green cloth. "THE COACH HOUSE — VISITORS". Fifty years of names: shooting parties, a bishop, a cousin from Kenya who stayed a whole summer.\n\nThe last entry is October 1974, and it is not a visitor\'s:\n\n"E.B. — a week. Would not sleep in the house. Would not say why. Left the light on every night." \n\nUnder it, in another hand: "Not to be let again."', [38.0, U + 0.78, -4.1], [0, 1], { book: true });
  B.fixture({ id: 'annexe-flat-1', name: 'Annexe sitting room light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [39.2, CH.top - 0.5, 0.6], ceiling: CH.top, colour: 0xffc27a, target: 1.1, range: 8 });
  B.fixture({ id: 'annexe-flat-2', name: 'Annexe table light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [38.4, CH.top - 0.6, -4.3], ceiling: CH.top, colour: 0xffc27a, target: 0.8, range: 6 });
  B.lightSwitch('sw-annexe-flat', 'Annexe flat lights', [43.86, U + 1.4, -3.1], [-1, 0], ['annexe-flat-1', 'annexe-flat-2']);
  // the landing at the stair head
  B.room = 'annexe landing';
  B.fixture({ id: 'annexe-landing', name: 'Annexe landing light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [45.5, CH.top - 0.45, -4.0], ceiling: CH.top, colour: 0xffc27a, target: 0.7, range: 5 });
  B.lightSwitch('sw-annexe-landing', 'Annexe landing light', [46.88, U + 1.4, -2.7], [-1, 0], ['annexe-landing']);
  // the bedroom
  B.room = 'annexe bedroom';
  B.furniture('fabricRed', 48.4, -0.85, U, 1.6, 0.7, 2.0, 'bed');
  B.furniture('wood', 49.55, -1.55, U, 0.45, 0.6, 0.45, 'bedside table');
  B.furniture('darkWood', 45.72, 0.2, U, 0.6, 2.0, 1.4, 'wardrobe');
  B.furniture('darkWood', 48.4, 3.55, U, 1.1, 0.85, 0.55, 'chest of drawers');
  B.fixture({ id: 'annexe-bedroom', name: 'Annexe bedroom light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [47.6, CH.top - 0.5, 0.8], ceiling: CH.top, colour: 0xffc27a, target: 0.9, range: 6 });
  B.lightSwitch('sw-annexe-bedroom', 'Annexe bedroom light', [47.0, U + 1.4, SZ0 + 0.13], [0, 1], ['annexe-bedroom']);
  // the bathroom
  B.room = 'annexe bath';
  B.furniture('porcelain', 48.6, -5.45, U, 1.7, 0.6, 0.75, 'bath');
  B.furniture('porcelain', 49.55, -3.0, U, 0.5, 0.85, 0.6, 'basin');
  B.fixture({ id: 'annexe-bath', name: 'Annexe bathroom light', circuit: 'lodge', on: false, kind: 'incandescent', style: 'pendant', pos: [48.4, CH.top - 0.4, -4.0], ceiling: CH.top, colour: 0xfff0d8, target: 0.8, range: 5 });
  B.lightSwitch('sw-annexe-bath', 'Annexe bathroom light', [46.88, U + 1.4, -4.9], [-1, 0], ['annexe-bath']);

  /* ======================= THE ROOF ======================= */
  B.levelName = 'ground'; B.room = 'grounds';
  const midZ = (z0 + z1) / 2, half = (z1 - z0) / 2 + 0.45, rise = CH.ridge - CH.top, ang = Math.atan2(rise, half - 0.45);
  for (const s of [-1, 1]) {
    const r = B.box('roof', (x0 + x1) / 2, CH.top + rise / 2 + 0.05, midZ + s * half / 2, x1 - x0 + 0.8, 0.18, half / Math.cos(ang) + 0.1);
    r.rotation.x = s * ang; r.updateMatrix();
  }
  B.box('slate', (x0 + x1) / 2, CH.ridge + 0.05, midZ, x1 - x0 + 0.85, 0.16, 0.3);
  for (const x of [x0, x1]) B.mesh(G.wedge, 'brick', x, CH.top, midZ, 0.3, rise, z1 - z0 + 0.3);
  B.box('brick', 48.2, CH.ridge + 0.4, -3.4, 0.8, 1.6, 0.7);                                             // a chimney stack
  B.box('gothicTrim', 48.2, CH.ridge + 1.2, -3.4, 0.95, 0.12, 0.85);
  B.boxE('gothicTrim', x0 - 0.05, x1 + 0.05, U - 0.12, U + 0.04, z1 + 0.15, z1 + 0.25);                 // a string course between the storeys
};

/* the doors: up, or down on their springs */
BM.updateCoachHouse = function (game, dt) {
  const A = game.audio;
  for (const gd of game.garageDoors || []) {
    if (gd.moving) {
      gd.t += (gd.open ? 1 : -1) * dt / (gd.open ? 1.6 : 1.1);
      if (gd.t >= 1 || gd.t <= 0) { gd.t = Math.max(0, Math.min(1, gd.t)); gd.moving = false; if (!gd.open && A.gateBang) A.gateBang(0.35); }
      gd.wall.enabled = gd.t < 0.85;
    }
    const e = gd.t * gd.t * (3 - 2 * gd.t); gd.pivot.rotation.x = e * Math.PI / 2; gd.pivot.position.z = gd.z + 0.02 - e * 0.9;
  }
};
})();
