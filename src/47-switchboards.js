/* ==========================================================================
   BLACKTHORN MANOR — 6f. SWITCHBOARDS
   The power boxes as they would have been in 1974: a varnished backboard
   in an open steel cabinet, porcelain fuse carriers with brass contacts,
   black bakelite levers that flip with the circuit, indicator lamps,
   printed label plates, volt and amp meters whose needles follow the load,
   a DANGER sign, and conduit running up into the ceiling.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const labelMat = BM.labelMat;

BM.buildSwitchboards = function (B, game) {
  const grid = B.grid;
  game.switchboards = [];

  /* Lay out one board on a wall. n = outward normal of the wall face (towards
     the player), (px, pz) a point on the face, y the board's centre height. */
  function board(o) {
    const F = BM.face(B, o.n[0], o.n[1], o.px, o.pz), y = o.y, W = o.w, H = o.h;
    const sb = { levers: [], lamps: [], needles: [] };
    const lever = (lx, ly, state, big) => {
      F.box('metalDark', lx, ly, 0.075, big ? 0.16 : 0.07, big ? 0.22 : 0.1, 0.03);  // the switch base
      const m = F.box(big ? BM.M('fabricRed') : BM.M('piano'), lx, ly, 0.11, big ? 0.05 : 0.026, big ? 0.2 : 0.09, big ? 0.05 : 0.03);
      m.rotation.order = 'YXZ'; m.matrixAutoUpdate = true; m.userData.dynamic = true;
      sb.levers.push({ mesh: m, state, ry: F.ry, big });
      return m;
    };
    const lamp = (lx, ly, state, colour) => {
      F.box('brass', lx, ly, 0.075, 0.05, 0.05, 0.02);
      const m = F.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0x200a06 }), lx, ly, 0.09, 0.034, 0.034, 0.034);
      m.userData.dynamic = true;
      sb.lamps.push({ mesh: m, state, colour: colour || 0xff3a1a });
    };
    const label = (lx, ly, text, w, h, opts) => F.mesh(G.plane, labelMat(text, opts), lx, ly, 0.072, w, h, 1);
    const fuse = (lx, ly) => {
      F.box('porcelain', lx, ly, 0.08, 0.1, 0.16, 0.05);
      F.box('brass', lx, ly + 0.065, 0.108, 0.05, 0.02, 0.012);
      F.box('brass', lx, ly - 0.065, 0.108, 0.05, 0.02, 0.012);
      F.box('porcelain', lx, ly, 0.112, 0.03, 0.09, 0.02);
    };
    const meter = (lx, ly, title, value) => {
      F.mesh(G.cyl, 'metalDark', lx, ly, 0.08, 0.2, 0.04, 0.2).rotation.set(Math.PI / 2, F.ry, 0, 'YXZ');
      B.root.children[B.root.children.length - 1].updateMatrix();
      F.mesh(G.disc, labelMat(title, { w: 128, h: 128, size: 18, bg: '#efe6cc', border: '#efe6cc' }), lx, ly, 0.102, 0.17, 0.17, 1);
      const m = F.box('black', lx, ly, 0.106, 0.006, 0.075, 0.004);
      m.rotation.order = 'YXZ'; m.matrixAutoUpdate = true; m.userData.dynamic = true;
      sb.needles.push({ mesh: m, value, ry: F.ry, lx, ly, F });
    };
    // backboard, steel cabinet with its door hanging open, conduit to the ceiling
    F.box('darkWood', 0, y, 0.02, W, H, 0.04);
    F.box('metalDark', 0, y + H / 2 + 0.03, 0.08, W + 0.06, 0.04, 0.16);
    F.box('metalDark', 0, y - H / 2 - 0.03, 0.08, W + 0.06, 0.04, 0.16);
    F.box('metalDark', -W / 2 - 0.03, y, 0.08, 0.04, H + 0.1, 0.16);
    F.box('metalDark', W / 2 + 0.03, y, 0.08, 0.04, H + 0.1, 0.16);
    const [dx, dz] = F.at(W / 2 + 0.05, 0.16);
    const door = B.box('metalDark', dx, y, dz, 0.025, H + 0.08, W * 0.55, F.ry + Math.PI / 2 + 0.55);
    door.position.set(dx + Math.sin(F.ry + 1.0) * W * 0.27, y, dz + Math.cos(F.ry + 1.0) * W * 0.27); door.updateMatrix();
    for (let i = 0; i < (o.conduits || 3); i++) {
      const lx = -W / 2 + 0.15 + i * 0.12;
      F.mesh(G.post, 'metal', lx, (y + H / 2 + o.ceiling) / 2, 0.06, 0.035, o.ceiling - y - H / 2, 0.035);
    }
    if (o.title) label(0, y + H / 2 - 0.07, o.title, W - 0.1, 0.08, { w: 512, h: 64, size: 30, bg: '#1d1a16', fg: '#d8c890', border: '#8a7448' });
    if (o.danger) label(o.danger[0], o.danger[1], 'DANGER\n415 VOLTS', 0.2, 0.15, { w: 256, h: 192, size: 34, bg: '#f2ece0', fg: '#b01818', border: '#b01818', bolt: true });
    o.build({ lever, lamp, label, fuse, meter, F });
    game.switchboards.push(sb);
    return sb;
  }

  /* ---- the lodge: the estate's supply comes in here ---- */
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lodge';
  board({
    n: [1, 0], px: -13.8, pz: 84.4, y: 1.6, w: 1.0, h: 0.95, ceiling: 3.2, title: 'ESTATE SUPPLY', danger: [0.32, 1.33],
    build: ({ lever, lamp, label, fuse, meter }) => {
      lever(0.3, 1.72, () => grid.lodge, true);
      label(0.3, 1.9, 'MAIN', 0.18, 0.05);
      lamp(0.3, 1.52, () => grid.lodge, 0x30ff60);
      ['LODGE', 'GATE', 'ESTATE\nLIGHTS', 'HOUSE'].forEach((t, i) => {
        const lx = -0.38 + i * 0.16;
        fuse(lx, 1.78);
        label(lx, 1.62, t, 0.14, 0.06, { w: 192, h: 96, size: 22 });
        lamp(lx, 1.5, () => grid.lodge);
      });
      meter(-0.3, 1.3, 'VOLTS', () => grid.lodge ? 0.78 : 0);
      meter(-0.05, 1.3, 'AMPS', () => grid.lodge ? Math.min(1, grid.lights.filter(l => l.powered).length / 140) : 0);
    },
  });
  // the gate release gets a proper label too
  B.mesh(G.plane, labelMat('GATES', { w: 192, h: 64, size: 34 }), -6.36, 1.86, 83.2, 0.26, 0.09, 1, -Math.PI / 2);
  B.mesh(G.plane, labelMat('UP · LOCK\nDOWN · RELEASE', { w: 256, h: 96, size: 22, bg: '#2a2a2a', fg: '#e0d8c0', border: '#555' }), -6.235, 1.65, 83.2, 0.2, 0.075, 1, -Math.PI / 2);

  /* ---- the estate lighting panel ---- */
  board({
    n: [0, 1], px: -12.2, pz: 80.2, y: 1.45, w: 1.5, h: 0.9, ceiling: 3.2, title: 'ESTATE LIGHTING', conduits: 4,
    build: ({ lever, lamp, label }) => {
      game.estateGroups.forEach(([k], i) => {
        const col = i % 5, row = Math.floor(i / 5);
        const lx = -0.56 + col * 0.28, ly = 1.62 - row * 0.34;
        const name = { street: 'STREET', gate: 'GATE', flood: 'FLOOD', drive: 'DRIVE', garden: 'GARDEN', pool: 'POOL', pond: 'POND', garage: 'GARAGE', shed: 'SHED', cemetery: 'CEMETERY' }[k];
        lever(lx, ly, () => game.estateGroupOn(k));
        label(lx, ly - 0.1, ((i + 1) % 10) + ' ' + name, 0.24, 0.05, { w: 256, h: 56, size: 26 });
        lamp(lx + 0.09, ly + 0.03, () => grid.lodge && game.estateGroupOn(k), 0xffc040);
      });
    },
  });

  /* ---- the pantry fuse board: MAIN and the six house circuits ---- */
  B.zone = 'mansion'; B.room = 'pantry';
  board({
    n: [-1, 0], px: -0.1, pz: -8.6, y: 1.75, w: 1.5, h: 1.2, ceiling: 4.0, title: 'HOUSE SUPPLY — MAIN BOARD', danger: [0.55, 1.3], conduits: 5,
    build: ({ lever, lamp, label, fuse, meter }) => {
      lever(0.55, 1.83, () => grid.breakers.main && !grid.tripped, true);
      label(0.55, 2.02, 'MAIN', 0.2, 0.06);
      lamp(0.55, 1.62, () => grid.live('main'), 0x30ff60);
      ['HALL', 'GROUND', 'EAST', 'WEST', 'ATTIC', 'CELLAR'].forEach((t, i) => {
        const lx = -0.63 + i * 0.17, c = t.toLowerCase();
        fuse(lx, 2.0);
        label(lx, 1.85, (i + 1) + ' ' + t, 0.15, 0.045, { w: 192, h: 56, size: 22 });
        lever(lx, 1.68, () => grid.breakers[c]);
        lamp(lx, 1.55, () => grid.live(c));
      });
      meter(-0.45, 1.33, 'VOLTS', () => grid.live('main') || grid.live('hall') ? 0.8 : 0);
      meter(-0.15, 1.33, 'AMPS', () => {
        const h = grid.lights.filter(l => grid.isHouseCircuit(l.circuit));
        return Math.min(1, h.filter(l => l.powered).length / Math.max(1, h.length) * 0.9 + 0.05 * (grid.live('main') ? 1 : 0));
      });
      label(0.15, 1.33, 'W.G. 21/10/74\nLEFT ALL ON', 0.22, 0.1, { w: 256, h: 112, size: 22, bg: '#d8cba8' });
    },
  });

  /* ---- the gate motor, in the cellar by the boiler: one big switch on the house supply ---- */
  B.zone = 'mansion'; B.levelName = 'cellar'; B.room = 'cellar';
  board({
    n: [-1, 0], px: 17.8, pz: -5.5, y: -1.6, w: 0.7, h: 0.8, ceiling: 0, title: 'GATE MOTOR', danger: [-0.1, -1.95],
    build: ({ lever, lamp, label, meter }) => {
      lever(-0.1, -1.55, () => game.gates.escaping, true);
      label(-0.1, -1.33, 'OPEN', 0.18, 0.05);
      lamp(0.18, -1.55, () => grid.live('cellar'), 0x30ff60);
      label(0.18, -1.7, 'SUPPLY', 0.14, 0.045, { w: 192, h: 56, size: 22 });
      meter(0.18, -1.98, 'LOAD', () => game.gates.escaping && game.gates.t < 1 ? 0.9 : 0);
    },
  });
  B.interactable({
    id: 'gate-motor', label: () => game.gates.escaping ? 'Gate motor: running' : 'Gate motor switch', pos: [17.75, -1.6, -5.5], n: [-1, 0], kind: 'control', approachDist: 0.95,
    act: g => g.throwGateMotor(),
  });
};
})();
