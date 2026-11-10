/* ==========================================================================
   BLACKTHORN MANOR — 6g. THE ARRIVAL
   Your SUV comes up the lane in the rain with the radio on low. A tyre goes
   with a bang and starts slapping; then something under the bonnet pops and
   fizzes and smoke pours out. You pull over at a pair of gates, the engine
   dies, and the radio and the lights fade with the battery. You get out.
   The car is a modern right-hand-drive SUV (after the Land Rover Discovery
   Sport): a proper side profile with wheel arches, and a cabin you can see
   from the driver's seat: a digital cluster behind the wheel, a touchscreen
   in the middle of the dash, wipers, rain on the glass.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const CAR = { stopX: 2.0, z: 97.5, roadZ: 95.0, startX: -80, y: 0 };
BM.CAR = CAR;
/* timeline, seconds */
const T = { bang: 4.5, warn: 4.6, pop: 7.0, smoke: 7.3, arrive: 11.0, cough: 11.6, dim: 12.6, dead: 15.6, fadeOut: 16.6, out: 17.6, end: 18.6 };
BM.INTRO_T = T;

/* Car space: x to the driver's side (right-hand drive), y up, z back; the nose is at -z. */
const EYE = [0.38, 1.28, 0.16];
const WHEELS = [[-0.84, -1.37], [0.84, -1.37], [-0.84, 1.37], [0.84, 1.37]]; // nearside front first: that is the one that goes
const R_TYRE = 0.37;

const geoCache = {};
const geo = (k, f) => { if (!geoCache[k]) { geoCache[k] = f(); geoCache[k].userData.canonical = 'car:' + k; } return geoCache[k]; };
const V = (x, y) => new THREE.Vector2(x, y);
/* A side profile (u forward, y up) extruded across the car, centred on x = 0. */
function sideExtrude(pts, width, bevel) {
  const sh = new THREE.Shape(pts.map(p => V(p[0], p[1])));
  const b = bevel || 0;
  const g = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 3, curveSegments: 10 });
  g.rotateY(Math.PI / 2); g.translate(-(width - 2 * b) / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}
const arch = (pts, cu, from, to) => { for (let i = 0; i <= 12; i++) { const a = from + (to - from) * i / 12; pts.push([cu + Math.cos(a) * 0.45, 0.37 + Math.sin(a) * 0.45]); } };

/* The body below the glass: bumpers, bonnet, flanks, and two wheel arches. */
function bodyGeo() {
  return geo('body', () => {
    const P = [[-2.28, 0.42], [-2.32, 0.62], [-2.31, 1.02], [-2.22, 1.13], [-1.6, 1.14], [0.2, 1.11], [1.12, 1.08], [1.7, 1.03], [2.12, 0.98], [2.27, 0.93], [2.33, 0.82], [2.34, 0.6], [2.28, 0.4], [1.88, 0.33]];
    arch(P, 1.37, 0, Math.PI);
    P.push([0.9, 0.31], [-0.9, 0.31]);
    arch(P, -1.37, 0, Math.PI);
    P.push([-1.88, 0.33]);
    // hollow over the cabin: drop the upward faces behind the scuttle, so from the seat you see the cabin, not the top of a block
    const g = sideExtrude(P, 1.9, 0.06), pos = g.attributes.position, nor = g.attributes.normal, keep = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
      const cy = (a.y + b.y + c.y) / 3, cz = (a.z + b.z + c.z) / 3, cx = (a.x + b.x + c.x) / 3;
      if (n.y > 0.35 && cy > 0.95 && cz > -1.12 && Math.abs(cx) < 0.86) continue;
      keep.push(i);
    }
    const out = new THREE.BufferGeometry(), P2 = [], N2 = [];
    for (const i of keep) for (let k = 0; k < 3; k++) { P2.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k)); N2.push(nor.getX(i + k), nor.getY(i + k), nor.getZ(i + k)); }
    out.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(P2.length / 3 * 2).fill(0), 2));
    return out;
  });
}
/* The glasshouse: windscreen raked back, a long roof, the tailgate glass nearly upright. */
function glassGeo() {
  return geo('glass', () => sideExtrude([[1.14, 1.07], [0.42, 1.63], [-1.86, 1.67], [-2.12, 1.61], [-2.24, 1.14]], 1.6, 0.04));
}
/* The dashboard, in section: a flat shelf to the glass, a soft face falling to the knees. */
function dashGeo() {
  return geo('dash', () => sideExtrude([[1.14, 1.06], [0.72, 1.1], [0.6, 1.085], [0.555, 1.0], [0.57, 0.86], [0.66, 0.64], [0.95, 0.5], [1.14, 0.56]], 1.7, 0.02));
}

/* Canvas screens: the cluster behind the wheel and the radio touchscreen. */
function screen(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  return { c, g: c.getContext('2d'), tex, mat, key: '' };
}
function drawCluster(s, st) {
  const key = [Math.round(st.speed), Math.round(st.rpm * 20), st.tpms, st.engine, st.battery, Math.round(st.level * 20), st.flicker ? Math.random() : 0].join('|');
  if (key === s.key) return; s.key = key;
  const g = s.g, W = s.c.width, H = s.c.height, k = st.level;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (k <= 0.02) { s.tex.needsUpdate = true; return; }
  g.globalAlpha = Math.min(1, k);
  const dial = (cx, val, max, label, red) => {
    const r = 74, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    g.lineWidth = 3; g.strokeStyle = 'rgba(160,190,220,0.35)'; g.beginPath(); g.arc(cx, 104, r, a0, a1); g.stroke();
    if (red) { g.strokeStyle = 'rgba(230,40,30,0.8)'; g.beginPath(); g.arc(cx, 104, r, a0 + (a1 - a0) * red, a1); g.stroke(); }
    for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * i / 10; g.strokeStyle = 'rgba(220,235,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 10), 104 + Math.sin(a) * (r - 10)); g.lineTo(cx + Math.cos(a) * r, 104 + Math.sin(a) * r); g.stroke(); }
    const a = a0 + (a1 - a0) * Math.min(1, val / max);
    g.strokeStyle = '#ff5a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 104); g.lineTo(cx + Math.cos(a) * (r - 6), 104 + Math.sin(a) * (r - 6)); g.stroke();
    g.fillStyle = '#9ab'; g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText(label, cx, 160);
  };
  dial(100, st.speed, 200, 'km/h');
  dial(W - 100, st.rpm, 7, 'x1000 r/min', 0.78);
  g.fillStyle = '#e8f2ff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText(String(Math.round(st.speed)), W / 2, 96);
  g.font = '15px sans-serif'; g.fillStyle = '#8fa8c0'; g.fillText('km/h', W / 2, 116); g.fillText('D', W / 2, 186); g.fillText('00:47   9°C', W / 2, 26);
  // the warning lamps along the bottom
  const icon = (x, col, draw) => { g.save(); g.translate(x, 150); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.5; draw(); g.restore(); };
  if (st.tpms) icon(W / 2 - 60, '#ffb020', () => { g.beginPath(); g.arc(0, 0, 11, Math.PI * 0.15, Math.PI * 0.85, true); g.stroke(); g.beginPath(); g.moveTo(-11, 4); g.lineTo(-13, 10); g.moveTo(11, 4); g.lineTo(13, 10); g.stroke(); g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillText('!', 0, 5); });
  if (st.engine) icon(W / 2, '#ffb020', () => { g.strokeRect(-11, -7, 22, 13); g.strokeRect(-6, -11, 8, 4); g.beginPath(); g.moveTo(11, -2); g.lineTo(16, -2); g.moveTo(-11, -1); g.lineTo(-16, -1); g.stroke(); });
  if (st.battery) icon(W / 2 + 60, '#ff3b2a', () => { g.strokeRect(-13, -8, 26, 16); g.fillRect(-9, -11, 5, 3); g.fillRect(4, -11, 5, 3); g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('-  +', 0, 5); });
  g.globalAlpha = 1;
  s.tex.needsUpdate = true;
}
function drawRadio(s, st) {
  const key = [Math.round(st.level * 20), st.crackle ? Math.floor(Math.random() * 4) : 0, Math.floor(st.t * 2)].join('|');
  if (key === s.key) return; s.key = key;
  const g = s.g, W = s.c.width, H = s.c.height, k = st.level;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (k <= 0.02) { s.tex.needsUpdate = true; return; }
  g.globalAlpha = Math.min(1, k);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d1620'); bg.addColorStop(1, '#05080c'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7f95a8'; g.font = '16px sans-serif'; g.textAlign = 'left'; g.fillText('00:47', 18, 26); g.textAlign = 'right'; g.fillText(st.crackle ? 'NO SIGNAL' : 'FM ▂▃▅', W - 18, 26);
  const art = g.createLinearGradient(24, 50, 144, 170); art.addColorStop(0, '#3a2a4a'); art.addColorStop(1, '#a0603a'); g.fillStyle = art; g.fillRect(24, 50, 120, 120);
  g.fillStyle = 'rgba(255,220,170,0.6)'; g.beginPath(); g.arc(84, 118, 26, Math.PI, 0); g.fill();
  g.textAlign = 'left'; g.fillStyle = '#e8f0f8'; g.font = 'bold 26px sans-serif'; g.fillText('Valley FM 97.4', 164, 78);
  g.fillStyle = '#b8c8d8'; g.font = '20px sans-serif'; g.fillText('Distant Lights', 164, 112); g.fillStyle = '#7f95a8'; g.font = '17px sans-serif'; g.fillText('Late Night Requests', 164, 140);
  const prog = (st.t * 0.01 + 0.31) % 1; g.fillStyle = '#26323e'; g.fillRect(164, 160, W - 190, 4); g.fillStyle = '#5ab0ff'; g.fillRect(164, 160, (W - 190) * prog, 4);
  if (st.crackle) for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.3 + ')'; g.fillRect(Math.random() * W, Math.random() * H, 30 + Math.random() * 80, 1 + Math.random() * 2); }
  g.fillStyle = '#9ab'; g.font = '15px sans-serif'; g.textAlign = 'center';
  ['Home', 'Media', 'Phone', 'Nav', 'Climate'].forEach((n, i) => g.fillText(n, 50 + i * (W - 100) / 4, H - 18));
  g.globalAlpha = 1;
  s.tex.needsUpdate = true;
}
/* Rain drops on the windscreen, as a texture that slides down. */
function dropsTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'), rnd = BM.mulberry32(97);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * 256, y = rnd() * 256, r = 0.8 + rnd() * rnd() * 4;
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.6, 'rgba(200,215,230,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (rnd() < 0.15) { g.fillStyle = 'rgba(220,230,240,0.18)'; g.fillRect(x - 0.6, y, 1.2, 6 + rnd() * 18); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 1.5);
  return t;
}

BM.buildCar = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'lane';
  const car = new THREE.Group();
  car.rotation.order = 'YXZ'; // yaw, then pitch and roll in the car's own frame
  car.position.set(CAR.startX, CAR.y, CAR.roadZ);
  car.rotation.y = -Math.PI / 2; // nose towards +x
  B.root.add(car);
  const add = (geom, mat, x, y, z, sx, sy, sz, rx, ry, rz, parent) => {
    const m = B.mesh(geom, mat, x, y, z, sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz, 0, parent || car);
    if (rx || ry || rz) { m.rotation.set(rx || 0, ry || 0, rz || 0); m.updateMatrix(); }
    return m;
  };
  const box = (mat, x, y, z, sx, sy, sz, rx, ry, rz, parent) => add(G.box, mat, x, y, z, sx, sy, sz, rx, ry, rz, parent);
  const glow = hex => new THREE.MeshBasicMaterial({ color: hex, toneMapped: false });

  /* ---------------- outside ---------------- */
  add(bodyGeo(), 'suvPaint', 0, 0, 0);
  add(glassGeo(), 'darkGlass', 0, 0, 0);
  box('carTrim', 0, 1.715, 0.6, 1.46, 0.03, 2.36);                                   // the black roof
  for (const s of [-1, 1]) {
    box('alloy', s * 0.66, 1.75, 0.55, 0.035, 0.035, 2.1);                            // roof rails
    for (const z of [-0.45, 1.6]) box('alloy', s * 0.66, 1.73, z, 0.05, 0.04, 0.08);
    box('chrome', s * 0.8, 1.1, -0.45, 0.012, 0.014, 3.4);                            // the bright strip along the glass
    for (const az of [-1.37, 1.37]) add(geo('archLip', () => new THREE.TorusGeometry(0.47, 0.035, 6, 18, Math.PI).rotateY(Math.PI / 2)), 'cladding', s * 0.945, 0.37, az);
    box('cladding', s * 0.955, 0.36, 0, 0.03, 0.1, 1.82);                              // sill cladding
    for (const z of [-0.82, 0.42, 1.52]) box('carTrim', s * 0.952, 0.72, z, 0.004, 0.72, 0.006); // door shut lines
    for (const z of [0.18, 1.3]) box('chrome', s * 0.958, 1.0, z, 0.012, 0.035, 0.17);           // door handles
    // the mirrors, with an amber repeater along the top
    box('carTrim', s * 0.98, 1.1, -0.92, 0.12, 0.04, 0.06);
    box('suvPaint', s * 1.09, 1.13, -0.93, 0.13, 0.13, 0.22);
    box(glow(0x553000), s * 1.11, 1.195, -0.98, 0.1, 0.008, 0.012);
  }
  // nose: grille, badge, lamps, fogs, plate
  box('carTrim', 0, 0.75, -2.385, 0.9, 0.24, 0.03);
  for (let i = 0; i < 5; i++) box('cladding', 0, 0.65 + i * 0.045, -2.402, 0.86, 0.012, 0.01);
  add(G.cyl, 'chrome', 0, 0.78, -2.41, 0.17, 0.012, 0.075, Math.PI / 2);
  box('cladding', 0, 0.42, -2.36, 1.84, 0.2, 0.08);
  const heads = [], tails = [];
  for (const s of [-1, 1]) {
    box('carTrim', s * 0.62, 0.91, -2.33, 0.46, 0.11, 0.07, 0, s * 0.2, 0);
    const proj = add(G.sphere, glow(0x202020), s * 0.56, 0.915, -2.365, 0.08, 0.06, 0.03); heads.push(proj);
    const drl = box(glow(0x202020), s * 0.63, 0.868, -2.37, 0.4, 0.012, 0.012, 0, s * 0.2, 0); heads.push(drl);
    const hook = box(glow(0x202020), s * 0.83, 0.89, -2.31, 0.012, 0.05, 0.012); heads.push(hook);
    add(G.disc, 'darkGlass', s * 0.68, 0.47, -2.405, 0.1, 0.1, 1, 0, Math.PI, 0);
    tails.push(box(glow(0x200404), s * 0.62, 1.15, 2.375, 0.44, 0.055, 0.03));
    tails.push(box(glow(0x200404), s * 0.935, 1.15, 2.22, 0.03, 0.055, 0.2));
  }
  box('carTrim', 0, 1.06, 2.385, 0.86, 0.1, 0.02);                                   // the black band across the tailgate
  box('cladding', 0, 0.44, 2.35, 1.84, 0.2, 0.08);
  const plate = BM.labelMat('BLK 742', { w: 256, h: 56, size: 34, bg: '#f2f2ee', fg: '#111', border: '#222' });
  add(G.plane, plate, 0, 0.56, -2.405, 0.48, 0.1, 1, 0, Math.PI, 0);
  add(G.plane, plate, 0, 0.82, 2.4, 0.48, 0.1, 1);
  // wheels: a tyre, and an alloy that turns; the nearside front can go flat
  const wheels = WHEELS.map(([x, z]) => {
    const w = new THREE.Group(); w.position.set(x, R_TYRE, z); car.add(w);
    const tyre = add(G.cyl, 'rubber', 0, 0, 0, R_TYRE * 2, 0.235, R_TYRE * 2, 0, 0, Math.PI / 2, w);
    const hub = new THREE.Group(); w.add(hub);
    const out = Math.sign(x) * 0.118;
    add(G.cyl, 'carTrim', out, 0, 0, 0.47, 0.012, 0.47, 0, 0, Math.PI / 2, hub);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; for (const d of [-0.12, 0.12]) box('alloy', out + Math.sign(x) * 0.004, Math.sin(a + d) * 0.13, Math.cos(a + d) * 0.13, 0.014, 0.035, 0.2, -(a + d), 0, 0, hub); }
    add(G.cyl, 'alloy', out + Math.sign(x) * 0.006, 0, 0, 0.09, 0.012, 0.09, 0, 0, Math.PI / 2, hub);
    add(G.cyl, 'alloy', out - Math.sign(x) * 0.02, 0, 0, 0.47, 0.02, 0.47, 0, 0, Math.PI / 2, hub); // the rim's outer lip
    return { group: w, tyre, hub };
  });

  /* ---------------- inside ---------------- */
  const cabin = new THREE.Group(); car.add(cabin);
  const im = (hex, shin, name) => { const m = new THREE.MeshPhongMaterial({ color: hex, shininess: shin || 8, specular: 0x111111 }); m.name = name; m.userData.screenGlow = new THREE.Color(0.01, 0.014, 0.022); return m; };
  const MI = { dash: im(0x1c1d20, 12, 'carDash'), soft: im(0x2a2b2e, 6, 'carSoft'), leather: im(0x26211e, 30, 'carLeather'), lining: im(0x4a4844, 2, 'carLining'), carpet: im(0x141414, 1, 'carCarpet'), alu: im(0x9aa0a6, 80, 'carAlu'), black: im(0x070708, 60, 'carGloss') };
  const cb = (mat, x, y, z, sx, sy, sz, rx, ry, rz) => box(mat, x, y, z, sx, sy, sz, rx, ry, rz, cabin);
  add(dashGeo(), MI.dash, 0, 0, 0, 1, 1, 1, 0, 0, 0, cabin);
  cb(MI.alu, 0, 0.94, -0.553, 1.62, 0.02, 0.01);                                     // the satin band across the dash
  cb(MI.soft, 0.38, 1.225, -0.68, 0.42, 0.035, 0.22, -0.1);                          // the hood over the cluster
  cb(MI.dash, 0.38, 1.12, -0.71, 0.4, 0.1, 0.08);                           // the hood over the cluster
  cb(MI.carpet, 0, 0.42, 0.35, 1.7, 0.04, 3.2);                                      // floor
  cb(MI.lining, 0, 1.6, 0.7, 1.62, 0.03, 2.3);                                       // headlining
  for (const s of [-1, 1]) {
    // pillars, fat from inside: the A-pillar raked along the windscreen
    cb(MI.lining, s * 0.76, 1.34, -0.77, 0.1, 0.87, 0.06, 0.93);
    cb(MI.lining, s * 0.8, 1.34, 0.45, 0.08, 0.5, 0.12);
    cb(MI.lining, s * 0.8, 1.34, 1.85, 0.08, 0.5, 0.3);
    // door cards: a soft top, an armrest, a pull, a speaker, the window switches
    for (const [z0, z1] of [[-0.85, 0.42], [0.46, 1.5]]) {
      cb(MI.soft, s * 0.86, 0.76, (z0 + z1) / 2, 0.05, 0.66, z1 - z0);
      cb(MI.leather, s * 0.83, 1.09, (z0 + z1) / 2, 0.11, 0.04, z1 - z0);
      cb(MI.leather, s * 0.8, 0.83, (z0 + z1) / 2 + 0.05, 0.08, 0.05, (z1 - z0) * 0.55);
      cb(MI.alu, s * 0.835, 0.95, z0 + 0.25, 0.01, 0.03, 0.12);
      add(G.disc, MI.black, s * 0.832, 0.56, z0 + 0.3, 0.16, 0.16, 1, 0, -s * Math.PI / 2, 0, cabin);
    }
    cb(MI.black, s * 0.8, 0.865, 0.0, 0.05, 0.012, 0.14);
    // seats: cushion, bolstered back raked a little, head restraint
    const sx = s * 0.38;
    cb(MI.leather, sx, 0.62, 0.32, 0.5, 0.13, 0.52);
    for (const b of [-1, 1]) cb(MI.leather, sx + b * 0.23, 0.67, 0.32, 0.06, 0.1, 0.5);
    cb(MI.leather, sx, 0.98, 0.64, 0.5, 0.66, 0.13, 0.2);
    for (const b of [-1, 1]) cb(MI.leather, sx + b * 0.23, 0.98, 0.6, 0.06, 0.6, 0.16, 0.2);
    cb(MI.leather, sx, 1.42, 0.74, 0.27, 0.17, 0.1, 0.12);
    for (const b of [-1, 1]) cb(MI.alu, sx + b * 0.07, 1.31, 0.73, 0.012, 0.1, 0.012);
    // outer vents and sun visors
    cb(MI.black, s * 0.74, 1.0, -0.55, 0.12, 0.07, 0.03);
    cb(MI.lining, s * 0.4, 1.583, -0.36, 0.42, 0.02, 0.18);
  }
  // the rear bench
  cb(MI.leather, 0, 0.66, 1.35, 1.44, 0.13, 0.5);
  cb(MI.leather, 0, 0.98, 1.64, 1.44, 0.6, 0.12, 0.17);
  for (const x of [-0.5, 0, 0.5]) cb(MI.leather, x, 1.36, 1.72, 0.25, 0.15, 0.09, 0.1);
  // centre console: gear selector, cup holders, armrest; climate panel and vents round the screen
  cb(MI.soft, 0, 0.6, -0.08, 0.24, 0.3, 0.94);
  cb(MI.black, 0, 0.752, -0.2, 0.2, 0.006, 0.36);
  add(G.cyl, MI.alu, 0, 0.775, -0.24, 0.1, 0.04, 0.1, 0, 0, 0, cabin);
  add(G.cyl, MI.black, 0, 0.8, -0.24, 0.085, 0.02, 0.085, 0, 0, 0, cabin);
  for (const x of [-0.05, 0.05]) add(G.disc, MI.carpet, x, 0.757, -0.02, 0.075, 0.075, 1, -Math.PI / 2, 0, 0, cabin);
  cb(MI.leather, 0, 0.82, 0.48, 0.22, 0.08, 0.42);
  cb(MI.black, 0, 0.87, -0.56, 0.3, 0.09, 0.03, -0.25);
  for (const x of [-0.1, 0.1]) add(G.cyl, MI.alu, x, 0.87, -0.54, 0.045, 0.03, 0.045, Math.PI / 2 - 0.25, 0, 0, cabin);
  for (const x of [-0.22, 0.22]) { cb(MI.black, x, 1.02, -0.55, 0.07, 0.06, 0.03); cb(MI.alu, x, 1.02, -0.534, 0.06, 0.005, 0.005); }
  // the rear-view mirror
  cb(MI.black, 0, 1.565, -0.47, 0.025, 0.06, 0.025);
  cb(MI.black, 0, 1.52, -0.49, 0.22, 0.06, 0.022, -0.1);
  cb(im(0x30363c, 120, 'carMirror'), 0.0, 1.52, -0.477, 0.2, 0.045, 0.004, -0.1);
  // the steering wheel: rim, three spokes, a boss with a badge; the column; the stalks
  const sw = new THREE.Group(); sw.position.set(0.38, 0.97, -0.28); sw.rotation.x = -0.42; cabin.add(sw);
  add(geo('rim', () => new THREE.TorusGeometry(0.185, 0.017, 8, 40)), MI.leather, 0, 0, 0, 1, 1, 1, 0, 0, 0, sw);
  for (const a of [0, Math.PI, -Math.PI / 2]) { const sp = box(MI.soft, Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.0, a === -Math.PI / 2 ? 0.05 : 0.16, a === -Math.PI / 2 ? 0.14 : 0.045, 0.025, 0, 0, 0, sw); sp.position.set(Math.cos(a) * (a === -Math.PI / 2 ? 0 : 0.105), a === -Math.PI / 2 ? -0.1 : -0.01, 0); sp.updateMatrix(); }
  add(G.cyl, MI.soft, 0, -0.005, 0.01, 0.13, 0.05, 0.11, Math.PI / 2, 0, 0, sw);
  add(G.cyl, MI.alu, 0, 0.0, 0.04, 0.05, 0.004, 0.025, Math.PI / 2, 0, 0, sw);
  for (const sgn of [-1, 1]) for (let k = 0; k < 3; k++) box(MI.alu, sgn * 0.1, 0.02 - k * 0.02, 0.016, 0.012, 0.008, 0.004, 0, 0, 0, sw);
  cb(MI.soft, 0.38, 0.93, -0.47, 0.09, 0.09, 0.32, -0.42);
  for (const sgn of [-1, 1]) cb(MI.black, 0.38 + sgn * 0.13, 0.98, -0.42, 0.12, 0.015, 0.02, -0.42, 0, sgn * 0.15);
  // the screens
  const cl = screen(512, 200), ra = screen(512, 320);
  add(G.plane, cl.mat, 0.38, 1.16, -0.64, 0.31, 0.121, 1, -0.12, 0, 0, cabin);
  add(G.plane, ra.mat, 0.0, 1.0, -0.515, 0.265, 0.165, 1, -0.17, 0.14, 0, cabin);
  cb(MI.black, 0.0, 1.0, -0.523, 0.285, 0.18, 0.01, -0.17, 0.14);
  // the windscreen from inside: rain on the glass, and two wipers
  const rake = 0.932, wsMid = [0, 1.335, -0.77];
  const drops = new THREE.MeshBasicMaterial({ map: dropsTexture(), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  add(G.plane, drops, wsMid[0], wsMid[1], wsMid[2], 1.5, 0.87, 1, rake, 0, 0, cabin);
  const wipers = [];
  for (const [px, len] of [[-0.56, 0.6], [0.16, 0.66]]) {
    const pv = new THREE.Group(); pv.position.set(px, 1.1, -1.1); pv.rotation.x = rake; car.add(pv);
    const arm = new THREE.Group(); pv.add(arm);
    box('carTrim', len / 2, 0.0, 0.015, len, 0.018, 0.012, 0, 0, 0, arm);
    box('rubber', len * 0.55, 0.0, 0.006, len * 0.9, 0.012, 0.01, 0, 0, 0, arm);
    wipers.push({ arm, a: 0.05 });
  }
  // the pop under the bonnet: a flash and a few sparks
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flash = add(G.box, flashMat, -0.2, 1.09, -1.16, 1.1, 0.012, 0.03); add(G.sphere, flashMat, -0.3, 1.075, -1.5, 0.22, 0.05, 0.3);
  const sparks = [];
  for (let i = 0; i < 10; i++) { const m = add(G.lowSphere, flashMat, -0.25, 1.1, -1.3, 0.025, 0.025, 0.025); m.matrixAutoUpdate = true; sparks.push({ m, v: [0, 0, 0] }); }
  // smoke from under the bonnet: a few soft puffs recycled as they rise
  const puffs = [];
  for (let i = 0; i < 14; i++) { const m = add(G.lowSphere, BM.Basic(0x9a9a98, { transparent: true, opacity: 0, depthWrite: false }), 0, 0.9, -2.0, 0.2, 0.2, 0.2); m.matrixAutoUpdate = true; puffs.push({ m, t: -1, seed: i * 0.37 }); }

  car.traverse(o => { o.userData.dynamic = true; });
  for (const w of wipers) w.arm.matrixAutoUpdate = true;

  // the headlights are real light records on the car's own supply, moved each frame
  const beams = [-0.62, 0.62].map((sx, i) => B.fixture({
    id: 'car-head-' + i, name: 'Headlight', circuit: 'car', kind: 'emergency', style: 'none', pos: [CAR.startX + 2.3, 0.9, CAR.z + sx],
    colour: 0xfff0c8, target: 2.6, range: 26, spot: true, dir: [1, -0.12, 0], on: false, noFail: true, corona: 0.7,
  }));

  const v3 = new THREE.Vector3();
  game.car = {
    group: car, cabin, heads, tails, puffs, beams, wheels, wipers, flash, sparks, flat: true, parked: false, flatK: 0,
    dashState: { level: 0, speed: 0, rpm: 0, tpms: false, engine: false, battery: false, flicker: false },
    radioState: { level: 0, crackle: false, t: 0 },
    /* a point in car space, in the world */
    toWorld(x, y, z) { car.updateMatrixWorld(true); return v3.set(x, y, z).applyMatrix4(car.matrixWorld); },
    eye() { return this.toWorld(EYE[0], EYE[1], EYE[2]); },
    /* headlamps, DRLs and tail lamps, 0..1 */
    setLamps(k) {
      for (const m of heads) m.material.color.setRGB(1.0 * k, 0.95 * k, 0.82 * k * k);
      for (const m of tails) m.material.color.setRGB(0.12 + 0.75 * k, 0.02, 0.02);
    },
    /* the cluster, the radio screen, and the faint glow they throw on the cabin */
    setDash(k) {
      this.dashState.level = k; this.radioState.level = Math.min(this.radioState.level, 1);
      drawCluster(cl, this.dashState); drawRadio(ra, this.radioState);
      const e = Math.max(0, Math.min(1, Math.max(k, this.radioState.level)));
      for (const m of Object.values(MI)) m.emissive.copy(m.color).multiplyScalar(0.08 * e).add(m.userData.screenGlow.clone().multiplyScalar(e));
    },
    /* the nearside front tyre going down: 0 round, 1 flat to the rim */
    setFlat(k) {
      this.flatK = k;
      const w = wheels[0];
      w.tyre.scale.set(R_TYRE * 2 * (1 - 0.3 * k), 0.25, R_TYRE * 2 * (1 + 0.08 * k)); w.tyre.updateMatrix();
      w.group.position.y = R_TYRE - 0.11 * k;
      car.rotation.z = 0.022 * k; car.rotation.x = -0.012 * k;
    },
    spin(dist) { for (const w of wheels) { w.hub.rotation.x -= dist / R_TYRE; w.hub.updateMatrix(); } },
    /* wipers: a sweep about every 1.3 s while there is power; they stop where they are when it goes */
    wipe(dt, running, t) {
      for (const w of wipers) {
        if (running) { const ph = (t % 1.3) / 1.3; w.a = 0.05 + 1.7 * Math.sin(ph * Math.PI); }
        w.arm.rotation.z = w.a;
      }
    },
    setCabin(v) { cabin.visible = v; for (const w of wipers) w.arm.parent.visible = true; },
  };
  game.car.setFlat(0); game.car.setLamps(0); game.car.setDash(0);
  game.car.setCabin(false);

  // parked: collision, and the car itself is something you can try
  B.interactable({
    id: 'car', label: () => game.battery && game.battery.carried ? 'Fit the battery' : 'Your car', pos: [CAR.stopX, 1.0, CAR.z - 0.98], n: [0, -1],
    act: g => {
      if (g.carry === 'spare wheel') { g.changeWheel(); return; }
      if (g.carry === 'battery') { g.fitBattery(); return; }
      if (g.car.flat) { g.audio.click(); g.ui.say('The nearside front tyre is flat to the rim and the sidewall is split: that was the bang. The jack is under the boot floor, but the spare went for scrap years ago.' + (g.battery.fitted ? '' : ' And with the bonnet up, the battery terminals are furred white and stinking. Flat.'), 7); return; }
      g.audio.click(); g.audio.tone('sine', 60, 40, 0.15, 0.01, 0.12);
      g.ui.say(g.story.phoneTried ? 'A dry click, then nothing. It needs a battery that holds a charge.' : 'You try the key. A dry click from under the bonnet, then nothing. The battery is completely flat.');
    },
  });
  game.carWall = B.phys.addWall(CAR.stopX - 2.35, CAR.stopX + 2.35, CAR.z - 0.98, CAR.z + 0.98, 0, 1.7, { kind: 'furniture', tag: 'your car', enabled: false });
};

/* ---- the intro sequence: runs before the player has control ---- */
BM.Intro = class {
  constructor(game) { this.game = game; this.t = 0; this.done = false; this.said = {}; this.radio = 0; this.engine = 0; this.flapAcc = 0; game.car.setCabin(true); }
  skip() { this.t = T.end; this.finish(); }
  carX(t) {
    if (t >= T.arrive) return CAR.stopX;
    const u = t / T.arrive, e = 1 - Math.pow(1 - u, 2.2); // eases to a stop
    return CAR.startX + (CAR.stopX - CAR.startX) * e;
  }
  /* on the road, then pulled over onto the verge as it stops */
  carZ(t) { const u = Math.min(1, Math.max(0, (t - (T.arrive - 2.6)) / 2.6)); return CAR.roadZ + (CAR.z - CAR.roadZ) * u * u * (3 - 2 * u); }
  say(key, text, secs) { if (!this.said[key]) { this.said[key] = true; this.game.ui.say(text, secs || 5); } }
  once(key) { if (this.said[key]) return false; this.said[key] = true; return true; }
  update(dt) {
    const g = this.game, car = g.car, p = g.player, A = g.audio;
    this.t += dt;
    const t = this.t;
    // the car rolls up the lane
    const x = this.carX(t), speed = Math.max(0, (x - this.carX(Math.max(0, t - 0.1))) / 0.1);
    const z = this.carZ(t);
    const blown = t >= T.bang, wob = blown && t < T.arrive ? Math.sin(t * 13) * 0.012 * Math.max(0, 1 - (t - T.bang) / 3) + Math.sin(t * 5.3) * 0.004 : 0;
    car.group.position.x = x; car.group.position.z = z;
    car.group.rotation.y = -Math.PI / 2 - Math.max(0, this.carZ(t + 0.15) - z) * 0.5 + wob;
    car.group.position.y = Math.sin(t * 9) * 0.008 * Math.min(1, speed / 3) + (blown ? Math.abs(Math.sin(t * speed * 1.4)) * 0.006 * Math.min(1, speed / 4) : 0);
    car.spin(speed * dt);
    // the blowout: a bang, the wheel snatches, the tyre goes down and slaps round
    if (blown) {
      car.setFlat(Math.min(1, (t - T.bang) / 0.8));
      if (this.once('bang')) A.tyreBang && A.tyreBang();
      this.flapAcc += speed * dt;
      if (this.flapAcc > 2 * Math.PI * R_TYRE && speed > 0.5) { this.flapAcc = 0; A.flap && A.flap(Math.min(1, speed / 10)); }
    }
    // the pop under the bonnet: a flash, sparks, a fizzle; then the smoke
    if (t >= T.pop && this.once('pop')) {
      A.pop && A.pop();
      for (const s of car.sparks) { s.m.position.set(-0.3, 1.1, -1.25); s.v = [(Math.random() - 0.5) * 2.5, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 2 - 0.5]; }
    }
    const pf0 = t - T.pop;
    car.flash.material.opacity = pf0 >= 0 && pf0 < 0.9 ? Math.max(0, (1 - pf0 / 0.9)) * (0.5 + 0.5 * Math.random()) : 0;
    for (const s of car.sparks) { s.m.visible = pf0 >= 0 && pf0 < 0.7; if (s.m.visible) { s.v[1] -= 9.8 * dt; s.m.position.x += s.v[0] * dt; s.m.position.y += s.v[1] * dt; s.m.position.z += s.v[2] * dt; } }
    // the driver: in the seat, looking up the lane, then round to the gates as it stops
    if (t < T.out) {
      const look = Math.min(1, Math.max(0, (t - T.arrive + 1.5) / 3));
      const e = car.eye();
      p.x = e.x; p.z = e.z; p.y = e.y - BM.PLAYER.eye;
      p.yaw = car.group.rotation.y + look * 1.0 + (blown && t < T.bang + 0.6 ? Math.sin((t - T.bang) * 30) * 0.02 : 0);
      p.pitch = -0.06;
    }
    // headlights: full while the engine runs, a stutter at the pop, then the battery drains and they sag to orange and out
    let head = 1;
    if (t >= T.dim) { const u = (t - T.dim) / (T.dead - T.dim); head = Math.max(0, 1 - u * u); }
    const stutter = pf0 >= 0 && pf0 < 1.2 ? 0.35 + 0.65 * (Math.random() < 0.5 ? 1 : 0.2) : 1;
    const ds = car.dashState;
    ds.speed = speed * 3.6; ds.rpm = t < T.cough ? 0.8 + Math.min(1, speed / 16) * 1.6 + (pf0 >= 0 && pf0 < 2 ? Math.random() * 0.4 : 0) : Math.max(0, 0.8 - (t - T.cough) * 1.2);
    ds.tpms = blown; ds.engine = t >= T.pop; ds.battery = t >= T.pop; ds.flicker = pf0 >= 0 && pf0 < 1.2;
    const rs = car.radioState; rs.t = t; rs.crackle = t >= T.pop && t < T.pop + 1.2 || t >= T.dim; rs.level = t < T.dead ? head * (ds.flicker ? stutter : 1) : 0;
    car.setDash(t < T.dead ? head * (ds.flicker ? stutter : 1) : 0);
    if (t >= T.warn && !this.said.warnPing) { this.said.warnPing = true; A.warnPing && A.warnPing(); }
    car.wipe(dt, t < T.dim + 1.5, t);
    // smoke from the bonnet, thicker as it goes on, drifting back over the roof in the wind
    const smoking = t >= T.smoke && t < T.out;
    for (const pf of car.puffs) {
      if (pf.t < 0 && smoking && Math.random() < dt * 5) { pf.t = 0; pf.life = 1.6 + Math.random() * 1.2; pf.ox = (Math.random() - 0.5) * 0.6; }
      if (pf.t >= 0) {
        pf.t += dt; const u = pf.t / pf.life;
        if (u >= 1) { pf.t = -1; pf.m.material.opacity = 0; continue; }
        const lx = x + 1.9 - u * 1.6 * (speed > 1 ? 1 : 0.3) - (speed > 1 ? 0 : u * 0.4), ly = 1.05 + u * 1.3, lz = z + pf.ox + u * 0.4;
        pf.m.position.set(lx, ly, lz); pf.m.position.applyMatrix4(car.group.matrixWorld.clone().invert());
        pf.m.scale.setScalar(0.2 + u * 0.8); pf.m.material.opacity = 0.4 * Math.sin(u * Math.PI) * Math.min(1, (t - T.smoke) / 1.5);
      }
    }
    const hk = t < T.dead ? head * stutter : 0;
    car.beams.forEach((l, i) => {
      l.corona = 0; // from the driver's seat the lamps are behind the dash
      l.on = hk > 0.02 && t < T.dead;
      const w = car.toWorld(i ? 0.62 : -0.62, 0.92, -2.3); l.pos.x = w.x; l.pos.z = w.z; l.pos.y = w.y;
      l.flicker = 0; l.lightType = 'steady';
      l.target = 2.6 * hk; l.colour = head > 0.6 ? 0xfff0c8 : 0xffa050;
      g.fx.moveLight(l);
    });
    car.setLamps(hk);
    // sound: radio low; it crackles at the pop; the engine labours, coughs and dies; the radio fades with the battery
    this.radio = t < T.dim ? 0.05 * (rs.crackle ? 0.4 + 0.6 * Math.random() : 1) : Math.max(0, 0.05 * head * (0.5 + 0.5 * BM.noise1(t * 14)));
    if (t >= T.dead) this.radio = 0;
    const labour = t >= T.pop ? 0.5 + 0.5 * BM.noise1(t * 7) : 1;
    this.engine = t < T.cough ? 0.16 * (0.5 + 0.5 * Math.min(1, speed / 6)) * labour : Math.max(0, 0.16 * (1 - (t - T.cough) / 1.0));
    this.engineRev = (0.6 + Math.min(1, speed / 8) * 0.6) * (t >= T.pop && t < T.cough ? 0.85 + 0.15 * BM.noise1(t * 9) : 1);
    if (t >= T.cough && this.once('coughSnd')) A.cough && A.cough();
    this.say('arrive', 'Blackthorn Lane, after midnight, on the way to a house you have inherited and never seen. Miles of forest, not another car, the radio down low.', 4.5);
    if (t >= 2.4) this.say('road', 'No signal since the turning. The bridge back there is under the river; the nearest town is a hundred and fifty kilometres the other way.', 2.1);
    if (t >= T.bang + 0.1) this.say('bang', 'BANG. The wheel snatches in your hands and something starts slapping round under the front: a blowout.', 2.5);
    if (t >= T.pop + 0.05) this.say('pop', 'A loud pop under the bonnet, a fizzing like fat in a pan, and the whole dash flickers.', 2.8);
    if (t >= T.smoke + 0.9) this.say('smoke', 'Smoke, pouring out from under the bonnet, white in the headlights. You look for somewhere to pull in.', 3.0);
    if (t >= T.arrive - 1.0) this.say('gates', 'The headlights find a pair of iron gates. You bump onto the verge beside them and stop.', 2.6);
    if (t >= T.cough) this.say('cough', 'The engine coughs once, twice — and dies.', 2.0);
    if (t >= T.dim + 0.6) this.say('lights', 'The screens go dark. The headlights sag to a dull orange, and the radio fades with them... and out.', 3.5);
    if (t >= T.dead) this.say('flat', 'You turn the key. A click, nothing else. You get out into the rain to look.', 3);
    // fade, then you are standing in the rain beside the car
    if (t >= T.fadeOut && t < T.out) g.ui.fade(Math.min(1, (t - T.fadeOut) / (T.out - T.fadeOut)));
    if (t >= T.out && !this.placed) { this.placed = true; this.place(); }
    if (t >= T.out) g.ui.fade(Math.max(0, 1 - (t - T.out) / (T.end - T.out)));
    if (t >= T.end) this.finish();
  }
  place() {
    const g = this.game, car = g.car;
    car.group.position.set(CAR.stopX, 0, CAR.z); car.group.rotation.y = -Math.PI / 2;
    car.beams.forEach((l, i) => { l.corona = 0.7; l.on = false; l.flicker = 0; l.lightType = 'steady'; l.target = 2.6; const w = car.toWorld(i ? 0.62 : -0.62, 0.92, -2.3); l.pos.x = w.x; l.pos.y = w.y; l.pos.z = w.z; g.fx.moveLight(l); });
    car.setLamps(0); car.radioState.level = 0; car.setDash(0);
    car.flash.material.opacity = 0; for (const s of car.sparks) s.m.visible = false;
    for (const pf of car.puffs) { pf.t = -1; pf.m.material.opacity = 0; }
    g.carWall.enabled = true; car.parked = true;
    if (car.flat) car.setFlat(1);
    car.setCabin(false);
    g.teleport(BM.START.x, BM.START.y, BM.START.z, BM.START.yaw);
    g.player.pitch = 0;
  }
  finish() {
    if (this.done) return;
    if (!this.placed) { this.placed = true; this.place(); }
    this.done = true; this.radio = 0; this.engine = 0;
    this.game.ui.fade(0);
    this.game.ui.msgT = 0; if (this.game.ui.el.msg) this.game.ui.el.msg.style.opacity = '0';
    this.game.intro = null;
    this.game.ui.say('The front tyre is shredded to the rim, and the battery is dead: the terminals are furred white where it shorted. Not another light for miles. Except up there, behind the gates.', 7);
  }
};
})();
