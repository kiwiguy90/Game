/* ==========================================================================
   BLACKTHORN MANOR — 6b. FURNITURE AND APPLIANCES
   The lodge is furnished and its appliances run off the lodge supply; the
   house gains a fridge, kettle and clock in the kitchen, a radiogram in the
   drawing room and a bar heater upstairs. Every appliance is on a real
   circuit: it stops where it stands when the power goes and comes back on
   by itself, with a clunk, when it returns.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildAppliances = function (B, game) {
  const grid = B.grid;
  const group = (x, y, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, y, z); if (ry) g.rotation.y = ry;
    B.root.add(g); return g;
  };
  const dyn = (o) => { o.traverse(c => { c.userData.dynamic = true; }); return o; };
  /* A switch for an appliance. `n` is the side the player stands on. */
  const control = (a, pos, n, o) => B.interactable(Object.assign({
    id: a.id + '-switch', pos, n,
    label: () => a.name + (a.switchedOn ? ': switch off' : ': switch on'),
    act: g => g.toggleAppliance(a),
  }, o || {}));

  /* ---- builders: each returns the appliance record ---- */
  const tv = (id, name, circuit, x, y, z, nx, nz) => {
    // set on a cabinet, screen facing (nx, nz)
    const along = nx !== 0;
    B.box('darkWood', x, y + 0.28, z, along ? 0.5 : 0.62, 0.52, along ? 0.62 : 0.5);
    const screen = B.box(BM.Own(0x0a0c0c), x + nx * 0.26, y + 0.3, z + nz * 0.26, along ? 0.02 : 0.42, 0.34, along ? 0.42 : 0.02);
    screen.userData.dynamic = true;
    B.mesh(G.cyl, 'brass', x + nx * 0.26 + (along ? 0 : 0.24), y + 0.12, z + nz * 0.26 + (along ? 0.24 : 0), 0.05, 0.02, 0.05);
    const a = grid.addAppliance({ id, name, kind: 'tv', circuit, room: B.room, pos: [x, y + 0.3, z] });
    a.object = screen;
    // the screen throws a flickering blue-grey light into the room
    a.light = B.fixture({ id: id + '-glow', name: name + ' screen', circuit, kind: 'emergency', style: 'none', pos: [x + nx * 0.6, y + 0.3, z + nz * 0.6], colour: 0x9fb8ff, target: 0.55, range: 5, lightType: 'flicker', on: false, noFail: true, corona: 0 });
    return a;
  };
  const deskFan = (id, name, circuit, x, y, z, facing) => {
    const g = group(x, y, z, facing);
    B.mesh(G.cyl, 'iron', 0, 0.03, 0, 0.18, 0.06, 0.18, 0, g);
    B.mesh(G.post, 'iron', 0, 0.16, 0, 0.03, 0.22, 0.03, 0, g);
    B.mesh(G.ring, 'iron', 0, 0.3, 0.04, 0.34, 0.34, 0.34, 0, g);
    const blades = new THREE.Group(); blades.position.set(0, 0.3, 0.02); g.add(blades);
    for (let i = 0; i < 3; i++) { const b = B.box('brass', 0, 0, 0, 0.05, 0.13, 0.01, 0, blades); b.rotation.set(0, 0, i * Math.PI * 2 / 3); b.position.set(Math.sin(i * 2.094) * 0.07, Math.cos(i * 2.094) * 0.07, 0); b.updateMatrix(); }
    dyn(g);
    const a = grid.addAppliance({ id, name, kind: 'fan', circuit, room: B.room, pos: [x, y + 0.3, z] });
    a.object = blades; a.axis = 'z';
    return a;
  };
  const radio = (id, name, circuit, x, y, z, nx, nz, station) => {
    B.box('wood', x, y + 0.14, z, nx ? 0.22 : 0.42, 0.28, nx ? 0.42 : 0.22);
    const dial = B.box(BM.Own(0x221608), x + nx * 0.115, y + 0.17, z + nz * 0.115, nx ? 0.02 : 0.3, 0.08, nx ? 0.3 : 0.02);
    dial.userData.dynamic = true;
    const a = grid.addAppliance({ id, name, kind: 'radio', circuit, room: B.room, pos: [x, y + 0.14, z], station: station || 0 });
    a.object = dial;
    return a;
  };
  const kettle = (id, name, circuit, x, y, z, ry) => {
    const g = group(x, y, z, ry);
    B.mesh(G.cyl, 'chrome', 0, 0.12, 0, 0.18, 0.24, 0.18, 0, g);
    B.mesh(G.sphere, 'chrome', 0, 0.24, 0, 0.18, 0.1, 0.18, 0, g);
    B.box('black', 0, 0.22, -0.12, 0.03, 0.16, 0.06, 0, g);
    B.box('chrome', 0, 0.16, 0.12, 0.03, 0.03, 0.1, 0, g);
    const lamp = B.box(BM.Own(0x200606), 0.06, 0.06, 0.088, 0.03, 0.03, 0.01, 0, g);
    dyn(g);
    const a = grid.addAppliance({ id, name, kind: 'kettle', circuit, room: B.room, pos: [x, y + 0.15, z], switchedOn: false });
    a.object = lamp;
    return a;
  };
  const heater = (id, name, circuit, x, y, z, nx, nz) => {
    const along = nx !== 0;
    B.box('metalDark', x, y + 0.3, z, along ? 0.25 : 0.8, 0.6, along ? 0.8 : 0.25);
    const bars = [];
    for (let i = 0; i < 2; i++) {
      const b = B.box(BM.Own(0x1a0804), x + nx * 0.13, y + 0.25 + i * 0.16, z + nz * 0.13, along ? 0.03 : 0.62, 0.035, along ? 0.62 : 0.03);
      b.userData.dynamic = true; bars.push(b);
    }
    bars[1].material = bars[0].material;
    const a = grid.addAppliance({ id, name, kind: 'heater', circuit, room: B.room, pos: [x, y + 0.3, z] });
    a.object = bars[0];
    a.light = B.fixture({ id: id + '-glow', name: name + ' glow', circuit, kind: 'emergency', style: 'none', pos: [x + nx * 0.5, y + 0.35, z + nz * 0.5], colour: 0xff6a20, target: 0.6, range: 4.5, on: false, noFail: true, corona: 0 });
    return a;
  };
  const fridge = (id, name, circuit, x, y, z, nx, nz) => {
    const along = nx !== 0;
    B.box('white', x + nx * 0.02, y + 1.12, z + nz * 0.02, along ? 0.02 : 0.08, 0.3, along ? 0.08 : 0.02);
    const tell = B.box(BM.Own(0x101010), x + nx * 0.37, y + 1.45, z + nz * 0.37 + (along ? 0.2 : 0), 0.04, 0.04, 0.04);
    tell.userData.dynamic = true;
    const a = grid.addAppliance({ id, name, kind: 'fridge', circuit, room: B.room, pos: [x, y + 0.8, z] });
    a.object = tell;
    return a;
  };
  const clock = (id, name, circuit, x, y, z, nx, nz) => {
    const g = group(x, y, z, Math.atan2(nx, nz));
    B.mesh(G.cyl, 'darkWood', 0, 0, -0.02, 0.34, 0.04, 0.34, 0, g).rotation.x = Math.PI / 2;
    g.children[0].updateMatrix();
    B.mesh(G.disc, 'white', 0, 0, 0.005, 0.3, 0.3, 0.3, 0, g);
    for (let i = 0; i < 12; i++) { const m = B.box('black', Math.sin(i / 12 * Math.PI * 2) * 0.12, Math.cos(i / 12 * Math.PI * 2) * 0.12, 0.012, 0.012, 0.025, 0.004, 0, g); m.rotation.z = -i / 12 * Math.PI * 2; m.updateMatrix(); }
    const hands = {};
    for (const [k, len, w, zz] of [['hour', 0.07, 0.012, 0.016], ['minute', 0.11, 0.008, 0.02], ['second', 0.12, 0.003, 0.024]]) {
      const pivot = new THREE.Group(); pivot.position.z = zz; g.add(pivot);
      B.box(k === 'second' ? BM.Basic(0x8a1010) : 'black', 0, len / 2, 0, w, len, 0.003, 0, pivot);
      hands[k] = pivot;
    }
    dyn(g);
    const a = grid.addAppliance({ id, name, kind: 'clock', circuit, room: B.room, pos: [x, y, z] });
    // stopped at 11:41 — when the last of the power went in 1974
    a.clockTime = (11 * 3600 + 41 * 60 + 12);
    a.object = hands;
    return a;
  };
  const radiogram = (id, name, circuit, x, y, z, nx, nz) => {
    const along = nx !== 0;
    B.box('darkWood', x, y + 0.82, z, along ? 0.5 : 1.0, 0.04, along ? 1.0 : 0.5);
    const g = group(x + (along ? 0 : -0.15), y + 0.86, z + (along ? -0.15 : 0));
    B.mesh(G.cyl, 'black', 0, 0.01, 0, 0.3, 0.02, 0.3, 0, g);
    B.mesh(G.cyl, 'fabricRed', 0, 0.022, 0, 0.1, 0.005, 0.1, 0, g);
    B.box('chrome', 0.1, 0.03, 0.04, 0.12, 0.01, 0.02, 0, g);
    dyn(g);
    B.box('chrome', x + (along ? -0.15 : 0.22), y + 0.9, z + (along ? 0.22 : -0.15), 0.02, 0.06, 0.25);
    const a = grid.addAppliance({ id, name, kind: 'record', circuit, room: B.room, pos: [x, y + 0.9, z] });
    a.object = g;
    return a;
  };
  game.applianceBuilders = { tv, deskFan, radio, kettle, heater, fridge, clock, radiogram };

  /* ======================= THE LODGE ======================= */
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lodge';
  // furniture: armchair, TV cabinet, side cabinet, filing cabinet, coat stand, rug
  B.boxE('carpet', -12.6, -8.6, 0.04, 0.05, 83.6, 87.0);
  B.furniture('fabricGreen', -11.3, 85.6, 0, 0.8, 0.9, 0.8, 'lodge armchair');
  B.furniture('darkWood', -13.4, 86.9, 0, 0.6, 0.7, 0.8, 'tv cabinet');
  B.furniture('darkWood', -7.1, 80.4, 0, 1.4, 1.0, 0.4, 'lodge cabinet');
  B.furniture('metalDark', -13.5, 82.1, 0, 0.5, 1.3, 0.6, 'filing cabinet');
  B.furniture('darkWood', -6.5, 87.4, 0, 0.3, 1.8, 0.3, 'coat stand');
  B.box('fabricCream', -6.5, 1.55, 87.4, 0.45, 0.5, 0.3);
  B.box('frame', -6.22, 1.9, 81.2, 0.04, 0.6, 0.9);
  B.box('paper', -6.19, 1.9, 81.2, 0.01, 0.5, 0.8); // estate map on the wall
  // appliances on the lodge supply
  const lTv = tv('lodge-tv', 'Television', 'lodge', -13.4, 0.7, 86.9, 1, 0);
  control(lTv, [-13.05, 0.95, 86.9], [1, 0]);
  const lFan = deskFan('lodge-fan', 'Desk fan', 'lodge', -7.3, 0.78, 81.85, 0);
  control(lFan, [-7.3, 0.9, 82.2], [0, 1], { approachDist: 1.0 });
  const lRadio = radio('lodge-radio', 'Radio', 'lodge', -7.65, 1.0, 80.42, 0, 1, 2);
  control(lRadio, [-7.65, 1.1, 80.6], [0, 1], { approachDist: 0.6 });
  const lKettle = kettle('lodge-kettle', 'Kettle', 'lodge', -6.55, 1.0, 80.42, Math.PI);
  control(lKettle, [-6.55, 1.1, 80.6], [0, 1], { approachDist: 0.6 });
  const lHeater = heater('lodge-heater', 'Bar heater', 'lodge', -11.3, 0, 87.62, 0, -1);
  B.furniture(null, -11.3, 87.62, 0, 0.8, 0.6, 0.25, 'bar heater');
  control(lHeater, [-11.3, 0.5, 87.42], [0, -1], { approachDist: 0.9 });
  clock('lodge-clock', 'Wall clock', 'lodge', -6.22, 2.3, 85.6, -1, 0);

  /* ======================= THE HOUSE ======================= */
  B.zone = 'mansion'; B.levelName = 'ground';
  B.room = 'kitchen';
  B.furniture('white', -17.4, -6.55, 0, 0.7, 1.6, 0.68, 'fridge');
  const kFridge = fridge('kitchen-fridge', 'Fridge', 'ground', -12.6, 0, -4.55, 0, -1);
  control(kFridge, [-17.03, 1.0, -6.55], [1, 0]);
  const kKettle = kettle('kitchen-kettle', 'Kettle', 'ground', -10.2, 0.9, -11.4, 0);
  control(kKettle, [-10.6, 1.0, -11.3], [0, 1]);
  clock('kitchen-clock', 'Kitchen clock', 'ground', -11, 2.7, -4.13, 0, -1);
  B.room = 'drawing';
  B.furniture('darkWood', 6.5, 5.0, 0, 0.8, 0.82, 1.2, 'radiogram');
  const record = radiogram('drawing-radiogram', 'Radiogram', 'east', 6.5, 0, 5.0, 1, 0);
  control(record, [6.95, 0.85, 5.0], [1, 0]);
  // the back sitting room television throws its light too
  const oldTv = grid.appliances.find(a => a.id === 'tv');
  if (oldTv) { B.room = 'back sitting'; oldTv.light = B.fixture({ id: 'tv-glow', name: 'Television screen', circuit: oldTv.circuit, kind: 'emergency', style: 'none', pos: [-15.7, 1.05, 2.7], colour: 0x9fb8ff, target: 0.55, range: 5, lightType: 'flicker', on: false, noFail: true, corona: 0 }); }
  B.levelName = 'upper'; B.room = 'bedroom1';
  const bHeater = heater('bedroom-heater', 'Bar heater', 'west', -17.62, 4.2, 10.2, 1, 0);
  B.furniture(null, -17.62, 10.2, 4.2, 0.25, 0.6, 0.8, 'bar heater');
  control(bHeater, [-17.4, 4.7, 10.2], [1, 0]);
};
})();
