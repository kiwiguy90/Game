/* ==========================================================================
   BLACKTHORN MANOR — 6j. THE LIFT
   A 1931 cage lift at the east end of the central corridor, from the
   cellar to the attic: a panelled car with a brass button plate, folding
   brass gates on every landing, and a dial over each gate whose needle
   follows the car. It runs on the house supply. Call it, step in, press a
   floor: the gate rattles shut, the motor hums, the car shudders, and the
   gate opens on another floor.
   (Only the car's own floor shows a car; behind the other gates the shaft
   is dark. While the gate is shut you ride with it.)
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const LIFT = { x0: 4.0, x1: 5.85, z0: -3.2, z1: -1.5, gate0: -2.85, gate1: -1.85, wall: 3.9 };
const FLOORS = [
  { name: 'Cellar', key: 'B', y: -3.2, top: 0.0, mat: 'brick', level: 'cellar' },
  { name: 'Ground floor', key: 'G', y: 0.0, top: 4.2, mat: 'panel', level: 'ground' },
  { name: 'First floor', key: '1', y: 4.2, top: 8.2, mat: 'panel', level: 'upper' },
  { name: 'Attic', key: 'A', y: 8.2, top: 10.68, mat: 'boards', level: 'attic' },
];
BM.LIFT = LIFT; BM.LIFT_FLOORS = FLOORS;
const BUTTON_Z = k => -2.72 + k * 0.25;
const GATE_H = 2.3, CLOSE_T = 1.1, PER_FLOOR = 2.4;

/* The folding gate: a brass lattice, cut out of a texture. */
function latticeMat() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 256); g.strokeStyle = '#fff'; g.lineCap = 'round';
  g.lineWidth = 5; for (const x of [3, 64, 125]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.lineWidth = 3; for (let y = -128; y < 256; y += 32) { g.beginPath(); g.moveTo(3, y); g.lineTo(125, y + 122); g.stroke(); g.beginPath(); g.moveTo(125, y); g.lineTo(3, y + 122); g.stroke(); }
  g.lineWidth = 7; for (const y of [4, 252]) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshPhongMaterial({ color: 0xb08a40, map: t, alphaTest: 0.5, side: THREE.DoubleSide, shininess: 70, specular: 0x554422 });
}
/* The dial over each gate: the floors round an arc. */
function dialMat() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(128, 120, 118, Math.PI, 0); g.fill();
  g.strokeStyle = '#6a5020'; g.lineWidth = 6; g.beginPath(); g.arc(128, 120, 118, Math.PI, 0); g.stroke();
  g.fillStyle = '#2a2018'; g.font = 'bold 30px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  FLOORS.forEach((f, i) => { const a = Math.PI + (0.2 + i * 0.2) * Math.PI; g.fillText(f.key, 128 + Math.cos(a) * 88, 120 + Math.sin(a) * 88); });
  g.font = '12px serif'; g.fillText('BLACKTHORN & SONS  1931', 128, 108);
  const t = new THREE.CanvasTexture(c);
  return new THREE.MeshBasicMaterial({ map: t, color: 0x8a8070 });
}

BM.buildLift = function (B, game) {
  const P = B.phys;
  B.zone = 'mansion'; B.room = 'lift';
  const lattice = latticeMat(), dial = dialMat();
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x1a1610 });
  const L = game.lift = { at: 1, pos: 1, phase: 'idle', t: 0, from: 1, to: 1, gate: [0, 1, 0, 0], gateTarget: [0, 1, 0, 0], floors: [], rideWith: false, queue: null };
  FLOORS.forEach((f, i) => {
    B.levelName = f.level;
    const y0 = f.y, y1 = f.top, H = y1 - y0, wy = (y0 + y1) / 2;
    // the shaft: south and north walls, the front with its gate opening, a back wall in the attic
    const wall = (x0, x1, z0, z1, a, b) => { P.addWall(x0, x1, z0, z1, a, b, { kind: 'wall' }); B.boxE(f.mat, x0, x1, a, b, z0, z1); };
    wall(LIFT.wall, LIFT.x1 + 0.05, LIFT.z0 - 0.1, LIFT.z0, y0, y1);
    wall(LIFT.wall, LIFT.x1 + 0.05, LIFT.z1, LIFT.z1 + 0.1, y0, y1);
    wall(LIFT.wall, LIFT.x0, LIFT.z0, LIFT.gate0, y0, y1);
    wall(LIFT.wall, LIFT.x0, LIFT.gate1, LIFT.z1, y0, y1);
    wall(LIFT.wall, LIFT.x0, LIFT.gate0, LIFT.gate1, y0 + GATE_H + 0.1, y1);
    if (f.level === 'attic') wall(LIFT.x1, LIFT.x1 + 0.1, LIFT.z0, LIFT.z1, y0, y1);
    else if (f.level !== 'cellar') {
      // set into the east wall of the stair hall: the wall carries on either side of the shaft, closing off the
      // space behind it, and the way through to the east wing stays open beyond (z below -4)
      const zEnd = f.level === 'cellar' ? 1.8 : -0.1;
      wall(LIFT.wall, LIFT.x0, LIFT.z1, zEnd, y0, y1);
      wall(LIFT.wall, LIFT.x0, -4.1, LIFT.z0 - 0.1, y0, y1);
      wall(LIFT.wall, 5.9, -4.1, -4.0, y0, y1);
      // a cornice and a skirting run across the front, so it reads as one wall with the gate in it
      if (f.level !== 'cellar') { B.boxE('darkWood', LIFT.wall - 0.04, LIFT.wall, y0, y0 + 0.18, -4.1, zEnd); B.boxE('plaster', LIFT.wall - 0.06, LIFT.wall, y1 - 0.14, y1 - 0.02, -4.1, zEnd); }
    }
    // a brass frame round the opening
    for (const z of [LIFT.gate0, LIFT.gate1]) B.box('brass', LIFT.wall - 0.02, y0 + (GATE_H + 0.1) / 2, z, 0.05, GATE_H + 0.1, 0.06);
    B.box('brass', LIFT.wall - 0.02, y0 + GATE_H + 0.1, (LIFT.gate0 + LIFT.gate1) / 2, 0.05, 0.06, 1.06);
    // the gate: two leaves that fold away to the south; a wall that stands while it is shut
    const leaves = [0, 1].map(k => { const m = B.mesh(G.plane, lattice, LIFT.wall - 0.05 - k * 0.035, y0 + GATE_H / 2 + 0.03, 0, 0.52, GATE_H - 0.04, 1, Math.PI / 2); m.userData.dynamic = true; m.matrixAutoUpdate = true; return m; });
    const gateWall = P.addWall(LIFT.wall - 0.12, LIFT.wall + 0.08, LIFT.gate0, LIFT.gate1, y0, y0 + GATE_H, { kind: 'door', tag: 'lift-gate-' + i });
    // the dial and its needle
    // (under the attic roof there is no room over the gate: there it goes on the wall beside it)
    const low = f.level === 'attic', dk = low ? 0.8 : 1, dY = low ? y0 + 2.0 : y0 + GATE_H + 0.42, dZ = low ? -3.07 : (LIFT.gate0 + LIFT.gate1) / 2;
    B.mesh(G.plane, dial, LIFT.wall - 0.03, dY, dZ, 0.5 * dk, 0.25 * dk, 1, -Math.PI / 2);
    const pivot = new THREE.Group(); pivot.position.set(LIFT.wall - 0.04, dY - 0.11 * dk, dZ); pivot.scale.setScalar(dk); B.root.add(pivot);
    const needle = B.box('black', 0, 0.09, 0, 0.01, 0.18, 0.012, 0, pivot); needle.userData.dynamic = true;
    pivot.userData.dynamic = true; pivot.matrixAutoUpdate = true;
    // the call button beside the gate
    B.box('brass', LIFT.wall - 0.015, y0 + 1.2, -3.07, 0.02, 0.2, 0.12);
    const callLamp = B.mesh(G.cyl, glowMat.clone(), LIFT.wall - 0.035, y0 + 1.25, -3.07, 0.04, 0.02, 0.04, 0); callLamp.rotation.z = Math.PI / 2; callLamp.updateMatrix(); callLamp.userData.dynamic = true;
    B.interactable({ id: 'lift-call-' + i, label: 'Call the lift', pos: [LIFT.wall - 0.03, y0 + 1.2, -3.07], n: [-1, 0], floorY: y0, act: g => g.liftCall(i) });

    // the car, as it looks when it is standing at this floor
    const car = new THREE.Group(); B.root.add(car);
    const cb = (mat, x0, x1, a, b, z0, z1) => { const m = B.boxE(mat, x0, x1, a, b, z0, z1); car.add(m); return m; };
    cb('darkWood', LIFT.x0, LIFT.x1, y0, y0 + 0.02, LIFT.z0, LIFT.z1);
    cb('carpet', LIFT.x0 + 0.1, LIFT.x1 - 0.1, y0 + 0.02, y0 + 0.03, LIFT.z0 + 0.1, LIFT.z1 - 0.1);
    cb('panel', LIFT.x0, LIFT.x1, y0 + 2.5, y0 + 2.55, LIFT.z0, LIFT.z1);
    cb('panel', LIFT.x1 - 0.04, LIFT.x1, y0, y0 + 2.5, LIFT.z0, LIFT.z1);
    cb('panel', LIFT.x0, LIFT.x1, y0, y0 + 2.5, LIFT.z0, LIFT.z0 + 0.04);
    cb('panel', LIFT.x0, LIFT.x1, y0, y0 + 2.5, LIFT.z1 - 0.04, LIFT.z1);
    for (const z of [LIFT.z0 + 0.06, LIFT.z1 - 0.06]) cb('brass', LIFT.x0 + 0.2, LIFT.x1 - 0.2, y0 + 0.92, y0 + 0.95, z - 0.02, z + 0.02); // handrails
    cb('brass', LIFT.x1 - 0.06, LIFT.x1 - 0.04, y0 + 1.05, y0 + 1.45, -2.88, -1.8); // the button plate
    const lamp = B.mesh(G.sphere, glowMat.clone(), (LIFT.x0 + LIFT.x1) / 2, y0 + 2.48, (LIFT.z0 + LIFT.z1) / 2, 0.3, 0.12, 0.3); car.add(lamp);
    const plate = BM.labelMat('BLACKTHORN & SONS   4 PERSONS', { w: 256, h: 32, size: 14, bg: '#b8964a', fg: '#2a1e0c', border: '#6a5020' });
    const pl = B.mesh(G.plane, plate, LIFT.x1 - 0.065, y0 + 1.52, -2.34, 0.5, 0.06, 1, -Math.PI / 2); car.add(pl);
    FLOORS.forEach((t, k) => {
      const z = BUTTON_Z(k);
      const b = B.mesh(G.cyl, 'porcelain', LIFT.x1 - 0.07, y0 + 1.25, z, 0.07, 0.03, 0.07); b.rotation.z = Math.PI / 2; b.updateMatrix(); car.add(b);
      const lab = B.mesh(G.plane, BM.labelMat(t.key, { w: 32, h: 32, size: 22, bg: '#b8964a', fg: '#1a1208', border: '#b8964a' }), LIFT.x1 - 0.066, y0 + 1.36, z, 0.07, 0.07, 1, -Math.PI / 2); car.add(lab);
      const others = FLOORS.map((_, m) => m).filter(m => m !== k);
      B.interactable({
        id: 'lift-' + i + '-' + t.key, label: 'Lift: ' + t.name, pos: [LIFT.x1 - 0.08, y0 + 1.25, z], n: [-1, 0], floorY: y0, reach: 1.6,
        enabled: () => L.at === i,
        links: k === i ? undefined : [{ x: LIFT.x1 - 0.08 - 0.9, y: FLOORS[k].y, z }],
        act: g => g.liftPress(i, k),
      });
      void others;
    });
    car.traverse(o => { o.userData.dynamic = true; });
    // the empty shaft, dark behind the gate, when the car is elsewhere
    const voidBox = B.boxE('black', LIFT.x0 + 0.02, LIFT.x1, y0, y0 + GATE_H, LIFT.z0, LIFT.z1); voidBox.userData.dynamic = true;
    L.floors.push({ f, car, voidBox, leaves, gateWall, pivot, lamp, callLamp });
  });
  B.room = 'corridor';
};

/* The state machine: idle, closing, moving, opening. */
BM.updateLift = function (game, dt) {
  const L = game.lift; if (!L) return;
  const grid = game.grid, A = game.audio, p = game.player;
  const live = grid.live('main');
  L.t += dt;
  if (L.phase === 'closing') {
    for (let i = 0; i < 4; i++) L.gateTarget[i] = 0;
    if (L.t >= CLOSE_T) {
      if (L.to === L.at) { L.phase = 'opening'; L.t = 0; }
      else { L.phase = 'moving'; L.t = 0; L.from = L.at; A.liftStart && A.liftStart(); }
    }
  } else if (L.phase === 'moving') {
    const dur = PER_FLOOR * Math.abs(L.to - L.from), u = Math.min(1, L.t / dur);
    L.pos = L.from + (L.to - L.from) * (u * u * (3 - 2 * u));
    if (u >= 1) {
      // arrive: if you rode with it, you are now on the new floor, standing where you stood
      if (L.rideWith) { const dy = FLOORS[L.to].y - FLOORS[L.from].y; game.teleport(p.x, p.y + dy, p.z, p.yaw); L.rideWith = false; }
      L.at = L.to; L.pos = L.at; L.phase = 'opening'; L.t = 0;
      A.liftStop && A.liftStop();
    }
  } else if (L.phase === 'opening') {
    L.gateTarget[L.at] = 1;
    if (L.t >= CLOSE_T) { L.phase = 'idle'; L.t = 0; }
  }
  // the gates fold and unfold; the gate stands as a wall until it is fully open
  for (let i = 0; i < 4; i++) {
    const fl = L.floors[i], before = L.gate[i];
    L.gate[i] += Math.max(-dt / CLOSE_T, Math.min(dt / CLOSE_T, L.gateTarget[i] - L.gate[i]));
    if ((before === 0 || before === 1) && before !== L.gate[i]) A.rattle && A.rattle();
    const g = L.gate[i];
    fl.leaves[0].position.z = -2.6 - g * 0.5; fl.leaves[1].position.z = -2.1 - g * 1.0;
    fl.gateWall.enabled = g < 0.95;
    fl.car.visible = L.at === i && L.phase !== 'moving' || (L.phase === 'moving' && L.rideWith && L.from === i);
    fl.voidBox.visible = !fl.car.visible;
    fl.pivot.rotation.x = -(-0.6 + (L.pos / 3) * 1.2) * Math.PI / 2 * 0.9;
    fl.lamp.material.color.setHex(live ? 0xffe2a8 : 0x1a1610);
    fl.callLamp.material.color.setHex(live && L.phase !== 'idle' ? 0xffb040 : live ? 0x5a3010 : 0x1a1610);
  }
  if (A.set) A.set('lift', L.phase === 'moving' ? (L.rideWith ? 0.22 : 0.12) : 0);
};

/* Is the player standing in the car at floor i? */
BM.inLift = function (game, i) {
  const p = game.player;
  return p.x > LIFT.x0 && p.x < LIFT.x1 && p.z > LIFT.z0 && p.z < LIFT.z1 && Math.abs(p.y - FLOORS[i].y) < 0.5;
};
})();
