/* ==========================================================================
   HALCYON HOUSE — THE GADGETS AND THE CAMERAS
   - A robot vacuum: it potters round the living room and the kitchen,
     turning away from furniture and walls, and goes back to its dock when
     told (its little light blue while it cleans, green when it charges).
   - Motion path lights: the garden path lights rest dim and brighten as
     you walk up to them, then fade behind you. (Or always on: the panel.)
   - Security cameras round the property, each a white housing on a bracket.
     In the security room a wall of nine screens shows them live; sit at the
     console and you can look through any of them full-screen (← → to
     change camera, Esc or E to stand up).
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const CAMS = [
  ['GATE', [6.6, 3.0, 97.4], [0, 1, 102]], ['DRIVE', [13, 4.2, 58], [3, 0, 82]], ['FORECOURT', [5.8, 3.25, 18.6], [0, 0.5, 34]],
  ['GARAGE', [-26.6, 4.3, 14.8], [-38, 0.3, 24]], ['ATRIUM', [5.6, 7.6, 13.4], [-2, 0.5, 4]], ['CAR GALLERY', [-45.4, 4.2, -11.4], [-34, 0.3, 4]],
  ['POOL', [-20, 7.6, -19.9], [0, 0, -31]], ['JETTY', [40, 3.0, -40.6], [33, 0.3, -62]], ['ROOF', [26, 10.8, 14.6], [-12, 8.4, -2]],
];

BM.buildHalcyonTech = function (B, game) {
  const HC = game.halcyon, M = BM.halcyonMats(), HL = BM.HALCYON;
  /* ---- the cameras: a white housing with a dark lens on a short arm ---- */
  B.zone = 'exterior'; B.room = 'grounds';
  HC.cams = CAMS.map(([name, pos, look], i) => {
    const [x, y, z] = pos, cam = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 160);
    cam.position.set(x, y, z); cam.lookAt(look[0], look[1], look[2]); cam.updateMatrixWorld();
    const dir = new THREE.Vector3(look[0] - x, look[1] - y, look[2] - z).normalize(), ry = Math.atan2(dir.x, dir.z);
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; B.root.add(g);
    B.box(M.white, 0, 0.06, -0.12, 0.05, 0.05, 0.24, 0, g);                                   // the arm
    const body = B.box(M.white, 0, 0, 0.05, 0.13, 0.12, 0.3, 0, g); body.rotation.x = -Math.asin(Math.max(-1, Math.min(1, dir.y))) * 0.8; body.updateMatrix();
    B.mesh(G.cyl, M.black, 0, -0.01, 0.21, 0.08, 0.02, 0.08, 0, g).rotation.x = Math.PI / 2;
    const tally = B.mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0xff2020 }), 0.05, 0.05, 0.12, 0.012, 0.012, 0.012, 0, g);
    g.traverse(o => { o.userData.dynamic = true; });
    const rt = new THREE.WebGLRenderTarget(256, 144);
    return { name, cam, rt, tally, i };
  });
  /* ---- the security room: a wall of screens, a desk, a console ---- */
  B.zone = 'mansion'; B.levelName = 'ground'; B.room = 'security room';
  const wallZ = 2.12, cx = -20;
  B.boxE(M.black, cx - 3.6, cx + 3.6, 0.85, 3.25, wallZ, wallZ + 0.05);
  HC.screens = HC.cams.map((c, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = cx - 2.35 + col * 2.35, y = 2.8 - row * 0.8;
    const m = new THREE.MeshBasicMaterial({ map: c.rt.texture, color: 0x101010 });
    const s = B.mesh(G.plane, m, x, y, wallZ + 0.06, 2.2, 1.24 * 0.6, 1, 0); s.userData.dynamic = true;
    B.mesh(G.plane, BM.labelMat('CAM ' + (i + 1) + ' · ' + c.name, { w: 256, h: 32, size: 18, bg: '#000000', fg: '#7ad08a' }), x - 0.7, y - 0.3, wallZ + 0.065, 0.7, 0.088, 1);
    return s;
  });
  B.furniture(M.charcoal, cx, 4.6, 0, 4.4, 0.76, 1.0, 'console desk');
  B.boxE(M.black, cx - 1.6, cx + 1.6, 0.76, 0.8, 4.2, 4.9);
  B.furniture(M.sofa, cx, 5.9, 0, 0.7, 0.5, 0.7, 'chair');
  B.interactable({ id: 'cctv-console', label: 'Security console: look through the cameras', pos: [cx, 1.0, 5.15], n: [0, 1], act: g => BM.cctvOpen(g) });
  HC.cctv = { on: false, i: 0, rr: 0, overlay: null };

  /* ---- the robot vacuum and its dock ---- */
  const dockX = -25.5, dockZ = -1.0;
  B.room = 'living room';
  B.box(M.white, dockX, 0.08, dockZ, 0.12, 0.16, 0.36);
  const vac = new THREE.Group(); vac.position.set(dockX + 0.3, 0, dockZ); B.root.add(vac);
  B.mesh(G.cyl, M.charcoal, 0, 0.045, 0, 0.34, 0.09, 0.34, 0, vac);
  B.mesh(G.cyl, M.black, 0, 0.092, 0, 0.14, 0.01, 0.14, 0, vac);
  const ledM = new THREE.MeshBasicMaterial({ color: 0x3fa0ff }); B.mesh(G.sphere, ledM, 0, 0.096, -0.11, 0.02, 0.01, 0.02, 0, vac);
  vac.traverse(o => { o.userData.dynamic = true; o.matrixAutoUpdate = true; });
  HC.vac = { g: vac, led: ledM, heading: Math.random() * 6.28, on: true, dock: { x: dockX + 0.3, z: dockZ }, turn: 0 };
  HC.pathMotion = true;
  B.room = 'house';
};

/* ---- looking through the cameras ---- */
BM.cctvOpen = function (game) {
  const HC = game.halcyon, C = HC.cctv; C.on = true; game.ui.mode = 'cctv';
  if (!C.overlay && typeof document !== 'undefined' && document.body) {
    const d = C.overlay = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;font:15px monospace;color:#9ff0a8;text-shadow:0 0 4px #000;background:repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 2px,transparent 2px 4px);';
    document.body.appendChild(d);
  }
  if (C.overlay) C.overlay.style.display = 'block';
  BM.halcyonSay(game, 'Camera ' + (C.i + 1) + ': ' + HC.cams[C.i].name.toLowerCase() + '. Left and right to change, Escape to stand up.', 4);
};
BM.cctvClose = function (game) { const C = game.halcyon.cctv; C.on = false; game.ui.mode = null; if (C.overlay) C.overlay.style.display = 'none'; };
BM.cctvKey = function (game, code) {
  const HC = game.halcyon, C = HC.cctv;
  if (code === 'Escape' || code === 'KeyE') { BM.cctvClose(game); return true; }
  if (code === 'ArrowRight' || code === 'KeyD') C.i = (C.i + 1) % HC.cams.length;
  else if (code === 'ArrowLeft' || code === 'KeyA') C.i = (C.i + HC.cams.length - 1) % HC.cams.length;
  game.audio.click && game.audio.click();
  return true;
};
/* while looking, the view is the camera's */
BM.cctvCamera = function (game) {
  const HC = game.halcyon, C = HC && HC.cctv; if (!C || !C.on) return;
  const cam = HC.cams[C.i].cam, c = game.camera;
  c.position.copy(cam.position); c.quaternion.copy(cam.quaternion); c.updateMatrixWorld();
  if (C.overlay) {
    const mins = Math.floor(game.clock / 60) % 60, hrs = game.timeFlow ? Math.floor(game.dayHour) : (23 + Math.floor(game.clock / 3600)) % 24;
    const html = `<div style="position:absolute;left:24px;top:20px">● REC&nbsp;&nbsp;CAM ${C.i + 1} · ${HC.cams[C.i].name}</div><div style="position:absolute;right:24px;top:20px">${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(Math.floor(game.time) % 60).padStart(2, '0')}</div><div style="position:absolute;left:24px;bottom:22px;opacity:.8">← → change camera · Esc stand up</div>`;
    if (C.html !== html) { C.overlay.innerHTML = html; C.html = html; }
  }
};
/* the screens in the security room: one camera drawn each frame, while you are in there to see them */
BM.halcyonCctvRender = function (game, r) {
  const HC = game.halcyon; if (!HC || !HC.cams) return;
  const p = game.player, inRoom = p.x < -14 && p.x > -26 && p.z > 2 && p.z < 14 && p.y < 3;
  for (const s of HC.screens) s.material.color.setHex(inRoom ? 0xd0f0d8 : 0x101010);
  if (!inRoom) return;
  const C = HC.cams[HC.cctv.rr = (HC.cctv.rr + 1) % HC.cams.length];
  const prev = r.getRenderTarget();
  r.setRenderTarget(C.rt); r.render(game.scene, C.cam); r.setRenderTarget(prev);
};

BM.updateHalcyonTech = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.vac) return;
  const p = game.player, t = HC.t, A = game.audio;
  // the tally lights on the cameras blink
  for (const c of HC.cams) c.tally.visible = (t + c.i * 0.37) % 2 < 0.25;
  /* the vacuum */
  const V = HC.vac, phys = game.B.phys, g = V.g.position;
  if (V.on) {
    const sp = 0.32 * dt, nx = g.x + Math.sin(V.heading) * sp, nz = g.z + Math.cos(V.heading) * sp;
    const out = nx < -25.6 || nx > 25.6 || nz < -17.6 || nz > 1.6 || (nx > 10.6 && nx < 19.4 && nz > -9.6 && nz < -6.4);
    if (out || phys.blocked(nx, nz, 0.05, 0.2, 0.3)) { V.heading += Math.PI * (0.5 + Math.random()); V.turn = 0.4; }
    else if (V.turn > 0) V.turn -= dt;
    else { g.x = nx; g.z = nz; if (Math.random() < dt * 0.08) V.heading += (Math.random() - 0.5) * 1.5; }
    V.led.color.setHex(0x3fa0ff);
    if (A.ctx && Math.hypot(p.x - g.x, p.z - g.z) < 6 && p.y < 2 && Math.random() < dt * 3) A.tone('sawtooth', 180, 175, 0.004, 0.05, 0.4);
  } else {
    const dx = V.dock.x - g.x, dz = V.dock.z - g.z, d = Math.hypot(dx, dz);
    if (d > 0.05) { g.x += dx / d * Math.min(d, 0.6 * dt); g.z += dz / d * Math.min(d, 0.6 * dt); V.heading = Math.atan2(dx, dz); }
    V.led.color.setHex(d > 0.05 ? 0xffb030 : 0x30ff60);
  }
  V.g.rotation.y = V.heading;
  /* motion path lights */
  const ids = game.estateLights.hgarden;
  for (const id of ids) {
    const l = game.grid.light(id); if (!l || !l.base) continue;
    const near = Math.hypot(p.x - l.pos.x, p.z - l.pos.z) < 7 && p.y < 2;
    const want = HC.pathMotion ? (near ? 1 : 0.12) : 1;
    l.mk = (l.mk === undefined ? want : l.mk) + (want - (l.mk === undefined ? want : l.mk)) * Math.min(1, dt * (want > (l.mk || 0) ? 4 : 0.8));
    l.target = l.base.target * l.mk;
  }
};

BM.halcyonTechRows = function (game) {
  const HC = game.halcyon; if (!HC || !HC.vac) return [];
  const r = (k, name, o) => Object.assign({ section: 'GADGETS', supply: '', k: 'smart:' + k, name, on: true, lit: false, live: true }, o);
  return [
    r('vac', 'Robot vacuum', { on: HC.vac.on, onText: 'CLEANING', offText: 'DOCKED', lit: HC.vac.on }),
    r('pathmotion', 'Garden path lights', { on: HC.pathMotion, onText: 'MOTION', offText: 'ALWAYS', lit: HC.pathMotion }),
    r('cctv', 'Security cameras', { value: HC.cams.length + ' LIVE' }),
  ];
};
BM.halcyonTechToggle = function (game, id) {
  const HC = game.halcyon;
  if (id === 'vac') { HC.vac.on = !HC.vac.on; BM.halcyonSay(game, HC.vac.on ? 'Starting the vacuum.' : 'Sending the vacuum back to its dock.', 2); }
  else if (id === 'pathmotion') { HC.pathMotion = !HC.pathMotion; BM.halcyonSay(game, HC.pathMotion ? 'Path lights on motion: they will light as you walk.' : 'Path lights on all the time.', 3); }
  else if (id === 'cctv') { BM.cctvOpen(game); }
  else return false;
  return true;
};
})();
