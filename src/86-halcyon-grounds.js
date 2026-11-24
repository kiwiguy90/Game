/* ==========================================================================
   HALCYON HOUSE — THE GROUNDS (from the research into 2026 estates)
   - A pool pavilion on the west lawn by the lake: an outdoor kitchen with a
     wood-fired pizza oven, a grill and a bar, and an outdoor living room
     with a linear fireplace and a weatherproof TV, under a flat roof.
   - A floodlit sport court: tennis and pickleball lines, a net, a fence,
     a basketball hoop at one end.
   - A putting green with three lit holes.
   - A guest house across the lawn: one glass room, a bed, a kitchenette.
   - Looser, natural planting: drifts of ornamental grass that sway, flower
     beds; and "moonlighting": soft lights high in the big trees shining
     down through the branches.
   - A yoga deck on the lake edge with a water bowl spilling over.
   - Sprinklers that pop up and water the lawns at dawn when time passes
     (or now, from the panel).
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildHalcyonGrounds = function (B, game) {
  const HC = game.halcyon, M = BM.halcyonMats(), P = B.phys;
  const led = o => BM.halcyonLed(B, game, o);
  for (const [k, n] of [['hsport', 'Sport court'], ['hputt', 'Putting green'], ['hpav', 'Pool pavilion'], ['hguest', 'Guest house']]) { game.estateGroups.push([k, n]); game.estateLights[k] = []; }
  const solid = (mat, x0, x1, y0, y1, z0, z1, tag) => B.solid(mat, x0, x1, y0, y1, z0, z1, { kind: 'wall', tag: tag || 'wall' });
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';

  /* ================= THE POOL PAVILION ================= */
  const PV = { x0: -46, x1: -32, z0: -38, z1: -24, h: 3.2 };
  B.boxE(M.paver, PV.x0 - 1, PV.x1 + 1, 0, 0.02, PV.z0 - 1, PV.z1 + 1);
  for (const [x, z] of [[PV.x0, PV.z0], [PV.x1, PV.z0], [PV.x0, PV.z1], [PV.x1, PV.z1], [(PV.x0 + PV.x1) / 2, PV.z0], [(PV.x0 + PV.x1) / 2, PV.z1]]) solid(M.charcoal, x - 0.12, x + 0.12, 0, PV.h, z - 0.12, z + 0.12, 'column');
  B.boxE(M.timber, PV.x0 - 0.6, PV.x1 + 0.6, PV.h, PV.h + 0.3, PV.z0 - 0.6, PV.z1 + 0.6);
  BM.addRoofBox(PV.x0 - 0.6, PV.x1 + 0.6, PV.z0 - 0.6, PV.z1 + 0.6, PV.h + 0.4);
  // the kitchen: a long counter, the pizza oven's dome glowing, a grill, the bar with stools
  B.room = 'pool pavilion';
  B.furniture(M.charcoal, -39, PV.z0 + 0.6, 0, 9, 0.92, 0.8, 'outdoor kitchen'); B.boxE(M.stone, -43.5, -34.5, 0.92, 0.97, PV.z0 + 0.2, PV.z0 + 1.0);
  B.mesh(G.sphere, M.render, -43, 1.25, PV.z0 + 0.6, 1.1, 0.75, 1.0);
  const ovenGlow = new THREE.MeshBasicMaterial({ color: 0xff6a20 }); { const m = B.box(ovenGlow, -43, 1.08, PV.z0 + 1.08, 0.42, 0.24, 0.02); m.userData.dynamic = true; }
  B.box(M.steel, -38.5, 1.0, PV.z0 + 0.6, 1.4, 0.06, 0.7); B.box(M.black, -38.5, 1.25, PV.z0 + 0.25, 1.4, 0.45, 0.08);
  B.furniture(M.black, -35.5, PV.z0 + 2.4, 0, 2.6, 1.1, 0.6, 'bar'); for (let i = 0; i < 3; i++) { B.mesh(G.cyl, M.steel, -36.6 + i * 1.1, 0.38, PV.z0 + 3.1, 0.07, 0.76, 0.07); B.mesh(G.cyl, M.charcoal, -36.6 + i * 1.1, 0.78, PV.z0 + 3.1, 0.38, 0.05, 0.38); }
  HC.oven = { glow: ovenGlow, light: led({ group: 'hpav', id: 'pizza-oven', name: 'Pizza oven', pos: [-43, 1.0, PV.z0 + 1.6], colour: 0xff7a30, target: 0.9, range: 4, corona: 0.2 }) };
  // the outdoor living room: sofas round a coffee table, a linear fire, a TV over it
  B.furniture(M.sofa, -39, PV.z1 - 4.5, 0, 6, 0.6, 0.9, 'outdoor sofa'); B.furniture(M.sofa, -43.6, PV.z1 - 2.6, 0, 0.9, 0.6, 3.2, 'outdoor sofa');
  B.furniture(M.oak, -39, PV.z1 - 2.6, 0, 2.2, 0.38, 1.0, 'coffee table');
  B.furniture(M.stone, -39, PV.z1 - 0.4, 0, 4.4, 0.9, 0.6, 'fireplace');
  const fire = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  HC.pfire = []; for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(G.cone, fire); f.position.set(-40.6 + i * 0.4, 1.02, PV.z1 - 0.62); f.scale.set(0.16, 0.25, 0.08); f.userData.dynamic = true; B.root.add(f); HC.pfire.push(f); }
  led({ group: 'hpav', id: 'pav-fire', name: 'Outdoor fireplace', pos: [-39, 1.3, PV.z1 - 1.2], colour: 0xff9a40, target: 1.0, range: 6, corona: 0.2 });
  const tvc = document.createElement('canvas'); tvc.width = 256; tvc.height = 144; const tvt = new THREE.CanvasTexture(tvc);
  const tvm = B.mesh(G.plane, new THREE.MeshBasicMaterial({ map: tvt }), -39, 2.1, PV.z1 - 0.68, 2.0, 1.12, 1, Math.PI); tvm.userData.dynamic = true;
  HC.ptv = { c: tvc, t: tvt, k: 0 };
  for (const x of [-44, -39, -34]) led({ group: 'hpav', id: 'pav-' + x, name: 'Pavilion downlight', pos: [x, PV.h - 0.1, -31], colour: 0xfff0dc, target: 0.8, range: 6, corona: 0.2, glow: [x, PV.h - 0.02, -31, 0.18, 0.02, 0.18] });
  led({ group: 'hpav', id: 'pav-strip', name: 'Pavilion edge light', pos: [-39, PV.h, PV.z0 - 0.7], colour: 0xffe2c0, target: 0.5, range: 6, corona: 0, glow: [-39, PV.h + 0.02, PV.z0 - 0.62, PV.x1 - PV.x0 + 1.2, 0.03, 0.04] });

  /* ================= THE SPORT COURT ================= */
  B.room = 'sport court';
  const SC = { x0: -66, x1: -48, z0: 30, z1: 66 };
  const surf = new THREE.MeshPhongMaterial({ color: 0x2a5a8a, shininess: 8 }), apron = new THREE.MeshPhongMaterial({ color: 0x2f6a4a, shininess: 8 });
  B.boxE(apron, SC.x0, SC.x1, 0, 0.02, SC.z0, SC.z1);
  const cx = (SC.x0 + SC.x1) / 2, cz = (SC.z0 + SC.z1) / 2;
  B.boxE(surf, cx - 5.49, cx + 5.49, 0.02, 0.025, cz - 11.89, cz + 11.89);
  const line = (x0, x1, z0, z1) => B.boxE(M.white, x0, x1, 0.025, 0.028, z0, z1);
  for (const s of [-1, 1]) { line(cx + s * 5.49 - 0.025, cx + s * 5.49 + 0.025, cz - 11.89, cz + 11.89); line(cx + s * 4.11 - 0.025, cx + s * 4.11 + 0.025, cz - 11.89, cz + 11.89); line(cx - 5.49, cx + 5.49, cz + s * 11.89 - 0.025, cz + s * 11.89 + 0.025); line(cx - 4.11, cx + 4.11, cz + s * 6.4 - 0.025, cz + s * 6.4 + 0.025); }
  line(cx - 0.025, cx + 0.025, cz - 6.4, cz + 6.4);
  // the net
  B.boxE(new THREE.MeshPhongMaterial({ color: 0x111111, transparent: true, opacity: 0.55 }), cx - 6.4, cx + 6.4, 0, 0.92, cz - 0.01, cz + 0.01);
  B.boxE(M.white, cx - 6.4, cx + 6.4, 0.9, 0.95, cz - 0.02, cz + 0.02); for (const s of [-1, 1]) B.box(M.steel, cx + s * 6.4, 0.55, cz, 0.08, 1.1, 0.08);
  P.addWall(cx - 6.4, cx + 6.4, cz - 0.05, cz + 0.05, 0, 0.95, { kind: 'furniture', tag: 'net' });
  // the fence: black mesh panels on posts, a gate gap on the east side
  const mesh = new THREE.MeshPhongMaterial({ color: 0x111214, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const fence = (x0, x1, z0, z1) => { solid(mesh, x0, x1, 0, 3, z0, z1, 'court fence'); };
  fence(SC.x0, SC.x1, SC.z0 - 0.03, SC.z0); fence(SC.x0, SC.x1, SC.z1, SC.z1 + 0.03); fence(SC.x0 - 0.03, SC.x0, SC.z0, SC.z1); fence(SC.x1, SC.x1 + 0.03, SC.z0, cz - 1); fence(SC.x1, SC.x1 + 0.03, cz + 1, SC.z1);
  for (let z = SC.z0; z <= SC.z1; z += 3) for (const x of [SC.x0, SC.x1]) B.box(M.charcoal, x, 1.5, z, 0.06, 3, 0.06);
  // a basketball hoop on the north end
  B.box(M.charcoal, cx, 1.6, SC.z1 - 0.3, 0.12, 3.2, 0.12); B.box(M.white, cx, 3.35, SC.z1 - 0.65, 1.8, 1.05, 0.04);
  { const rim = B.mesh(G.ring, new THREE.MeshPhongMaterial({ color: 0xff5a10 }), cx, 3.05, SC.z1 - 0.95, 0.46, 0.46, 0.46); rim.rotation.x = -Math.PI / 2; rim.updateMatrix(); }
  // floodlights on four masts
  for (const [x, z] of [[SC.x0 + 0.5, SC.z0 + 6], [SC.x1 - 0.5, SC.z0 + 6], [SC.x0 + 0.5, SC.z1 - 6], [SC.x1 - 0.5, SC.z1 - 6]]) {
    B.mesh(G.post, M.charcoal, x, 4, z, 0.16, 8, 0.16);
    led({ group: 'hsport', id: 'court-' + x + '-' + z, name: 'Court floodlight', pos: [x, 7.8, z], spot: true, dir: [cx - x, -6, cz - z], colour: 0xeef4ff, target: 2.0, range: 22, corona: 1.0, glow: [x, 7.9, z, 0.6, 0.2, 0.3] });
  }
  HC.court = SC;

  /* ================= THE PUTTING GREEN ================= */
  B.room = 'putting green';
  const PG = { cx: 38, cz: 32 };
  { const gr = B.mesh(G.cyl, new THREE.MeshPhongMaterial({ color: 0x3e9a3e, shininess: 10 }), PG.cx, 0.012, PG.cz, 16, 0.02, 10); gr.userData.ground = true; }
  HC.holes = [];
  for (const [dx, dz] of [[-5, -2], [1, 2.5], [5.5, -1.5]]) {
    const x = PG.cx + dx, z = PG.cz + dz;
    B.mesh(G.cyl, M.black, x, 0.02, z, 0.12, 0.01, 0.12); B.box(M.white, x, 0.75, z, 0.015, 1.5, 0.015);
    const flag = B.box(new THREE.MeshPhongMaterial({ color: 0xff2a2a }), x + 0.15, 1.4, z, 0.3, 0.2, 0.01); flag.userData.dynamic = true; flag.matrixAutoUpdate = true;
    led({ group: 'hputt', id: 'cup-' + HC.holes.length, name: 'Hole light', pos: [x, 0.05, z], colour: 0xffffff, target: 0.35, range: 2, corona: 0.6, glow: [x, 0.025, z, 0.1, 0.01, 0.1] });
    HC.holes.push({ x, z, flag });
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; led({ group: 'hputt', id: 'putt-edge-' + i, name: 'Green light', pos: [PG.cx + Math.cos(a) * 8.6, 0.06, PG.cz + Math.sin(a) * 5.6], colour: 0xfff0dc, target: 0.3, range: 3, corona: 0.3, glow: [PG.cx + Math.cos(a) * 8.6, 0.03, PG.cz + Math.sin(a) * 5.6, 0.12, 0.03, 0.12] }); }
  B.interactable({ id: 'putt', label: 'Putting green: take a putt', pos: [PG.cx - 7, 0.4, PG.cz], n: [-1, 0], floorY: 0, act: g => BM.halcyonPutt(g) });
  HC.putt = { ball: B.mesh(G.sphere, M.white, PG.cx - 6.5, 0.05, PG.cz, 0.045, 0.045, 0.045), t: -1 };
  HC.putt.ball.userData.dynamic = true; HC.putt.ball.matrixAutoUpdate = true;

  /* ================= THE GUEST HOUSE ================= */
  B.zone = 'mansion'; B.room = 'guest house';
  const GH = { x0: 40, x1: 54, z0: 66, z1: 78, h: 3.4 };
  B.boxE(M.oak, GH.x0, GH.x1, 0, 0.02, GH.z0, GH.z1);
  solid(M.stone, GH.x1, GH.x1 + 0.3, 0, GH.h, GH.z0, GH.z1); solid(M.stone, GH.x0, GH.x1 + 0.3, 0, GH.h, GH.z1, GH.z1 + 0.3); solid(M.stone, GH.x0, GH.x1 + 0.3, 0, GH.h, GH.z0 - 0.3, GH.z0);
  B.solid(M.glazing, GH.x0 - 0.04, GH.x0 + 0.04, 0, GH.h, GH.z0, 70.6, { kind: 'wall', tag: 'glass' }); B.solid(M.glazing, GH.x0 - 0.04, GH.x0 + 0.04, 0, GH.h, 73.4, GH.z1, { kind: 'wall', tag: 'glass' });
  B.solid(M.glazing, GH.x0 - 0.04, GH.x0 + 0.04, 2.7, GH.h, 70.6, 73.4, { kind: 'wall', tag: 'glass' });
  BM.halcyonSlider(B, game, { id: 'guest-door', axis: 'z', at: 72, c: GH.x0, w: 2.8, h: 2.7, y0: 0 });
  B.levelName = 'upper'; B.floor(M.white, GH.x0 - 1, GH.x1 + 0.3, GH.z0 - 0.3, GH.z1 + 0.3, GH.h + 0.3, 0.3); B.levelName = 'ground';
  B.boxE(M.charcoal, GH.x0 - 1.0, GH.x1 + 0.3, GH.h + 0.3, GH.h + 0.5, GH.z0 - 0.3, GH.z1 + 0.3);
  BM.addRoofBox(GH.x0 - 1, GH.x1 + 0.6, GH.z0 - 0.6, GH.z1 + 0.6, GH.h + 0.6);
  B.furniture(M.white, 50, 74.5, 0, 2.0, 0.55, 2.2, 'guest bed'); B.boxE(M.charcoal, 48.8, 51.2, 0, 1.1, 75.7, 75.8);
  B.furniture(M.kitchen, 52.8, 68.5, 0, 1.6, 0.92, 2.6, 'kitchenette'); B.boxE(M.marble, 52.0, 53.6, 0.92, 0.96, 67.2, 69.8);
  B.furniture(M.sofa, 44, 68.2, 0, 2.6, 0.7, 0.9, 'sofa');
  const ghIds = []; for (let x = GH.x0 + 2; x < GH.x1; x += 4) for (let z = GH.z0 + 2; z < GH.z1; z += 4) ghIds.push(led({ group: 'hguest', id: 'gh-' + x + '-' + z, name: 'Guest house light', pos: [x, GH.h - 0.05, z], colour: 0xffe6c8, target: 0.85, range: 7, corona: 0.2, glow: [x, GH.h - 0.015, z, 0.16, 0.02, 0.16] }).id);
  led({ group: 'hguest', id: 'gh-porch', name: 'Guest house porch', pos: [GH.x0 - 0.6, GH.h - 0.1, 72], colour: 0xfff0dc, target: 0.8, range: 6, corona: 0.3, glow: [GH.x0 - 0.6, GH.h + 0.28, 72, 0.6, 0.02, 3] });
  // a path to it from the drive
  B.zone = 'exterior'; B.room = 'grounds';
  for (let i = 0; i < 9; i++) { const x = 12 + i * 3.3, z = 70 + Math.sin(i * 0.6) * 1.2; B.box(M.paver, x, 0.01, z, 1.2, 0.02, 1.2, i * 0.2); }

  /* ================= NATURAL PLANTING AND MOONLIGHTING ================= */
  const rnd = BM.mulberry32(77);
  const drift = (x0, x1, z0, z1, n) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
      const k = rnd();
      if (k < 0.55) { for (let j = 0; j < 4; j++) { const b = B.mesh(G.cone, rnd() < 0.5 ? 'longGrass' : 'dryGrass', x + (rnd() - 0.5) * 0.4, 0.45, z + (rnd() - 0.5) * 0.4, 0.05, 0.9 + rnd() * 0.5, 0.05); b.rotation.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5); b.updateMatrix(); } }
      else B.mesh(G.lowSphere, ['flowersWhite', 'flowersPurple', 'flowersRed'][Math.floor(rnd() * 3)], x, 0.25, z, 0.4 + rnd() * 0.3, 0.35, 0.4 + rnd() * 0.3);
    }
  };
  // along both sides of the drive, round the forecourt, along the boundary, round the pavilion
  drift(-14, -8, 48, 96, 50); drift(14, 22, 48, 96, 50); drift(-22, -16, 16, 44, 30); drift(16, 24, 26, 44, 26);
  drift(-68, -62, -36, 26, 50); drift(62, 68, -36, 90, 70); drift(-48, -44, -40, -24, 20);
  // the big round trees get a soft light high in their crowns, shining down
  HC.trees.forEach((t, i) => { if (i % 2) return; led({ group: 'htrees', id: 'moon-' + i, name: 'Moonlight', pos: [t.x, 5.2, t.z], spot: true, dir: [0, -1, 0], colour: 0xc8d8ff, target: 0.55, range: 11, corona: 0 }); });

  /* ================= THE YOGA DECK ================= */
  B.room = 'yoga deck';
  const YD = { x0: 54, x1: 66, z0: -39.6, z1: -30 };
  B.floor(M.deck, YD.x0, YD.x1, YD.z0, YD.z1, 0.15, 0.2);
  P.ramp(YD.x0, YD.x1, YD.z1, YD.z1 + 0.5, 'z', 0.15, 0, -0.3, 'deck edge');
  for (let i = 0; i < 3; i++) B.box(new THREE.MeshPhongMaterial({ color: [0x6a8ab0, 0xa08ac0, 0x8ab09a][i], shininess: 4 }), 57 + i * 3, 0.17, -35, 0.7, 0.01, 1.9);
  B.mesh(G.cyl, M.stone, 64.5, 0.45, -32, 1.2, 0.6, 1.2);
  const bowl = BM.waterMaterial ? BM.waterMaterial() : M.glass; if (bowl.uniforms) { bowl.uniforms.level.value = 0.9; bowl.uniforms.speed.value = 0.8; }
  { const lip = B.mesh(G.cyl, bowl, 64.5, 0.42, -32, 1.24, 0.42, 1.24); lip.userData.dynamic = true; HC.bowl = bowl; }
  for (const [x, z] of [[YD.x0 + 0.3, YD.z1 - 0.3], [YD.x1 - 0.3, YD.z1 - 0.3], [YD.x0 + 0.3, YD.z0 + 0.3], [YD.x1 - 0.3, YD.z0 + 0.3]]) led({ group: 'hlake', id: 'yoga-' + x + '-' + z, name: 'Deck light', pos: [x, 0.25, z], colour: 0xffd8a8, target: 0.3, range: 4, corona: 0.4, glow: [x, 0.2, z, 0.1, 0.08, 0.1] });
  led({ group: 'hlake', id: 'yoga-bowl', name: 'Water bowl light', pos: [64.5, 0.9, -32], colour: 0x9fd8ff, target: 0.5, range: 3, corona: 0 });

  /* ================= THE SPRINKLERS ================= */
  const SP = [[-24, 60], [-24, 82], [24, 60], [24, 84], [-36, 40], [36, 44], [-44, 70], [46, 56]];
  const N = 90 * SP.length, pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.userData.canonical = 'fitting:sprinklers';
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe6f4, size: 0.07, transparent: true, opacity: 0.7, depthWrite: false }));
  pts.frustumCulled = false; pts.visible = false; pts.userData.dynamic = true; B.zones.mansion.parent.add(pts);
  HC.sprinklers = { heads: SP, pts, geo, on: false, auto: true, t: 0 };
  for (const [x, z] of SP) B.mesh(G.cyl, M.charcoal, x, 0.03, z, 0.08, 0.06, 0.08);
  B.room = 'grounds';
};

BM.halcyonPutt = function (game) {
  const HC = game.halcyon, U = HC.putt; U.t = 0; U.hole = HC.holes[Math.floor(Math.random() * HC.holes.length)]; U.in = Math.random() < 0.45;
  game.audio.burst && game.audio.burst(game.audio.white, 'bandpass', 1800, 3, 0.15, 0.001, 0.05);
};
BM.halcyonSprinklers = function (game, on) {
  const S = game.halcyon.sprinklers; S.on = on === undefined ? !S.on : on; S.t = 0;
  if (on === undefined) BM.halcyonSay(game, S.on ? 'Watering the lawns.' : 'Sprinklers off.', 2);
};

BM.updateHalcyonGrounds = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.sprinklers) return;
  const t = HC.t, p = game.player, A = game.audio;
  // the pavilion's fire and its TV
  HC.pfire.forEach((f, i) => { f.scale.y = 0.2 + 0.15 * Math.abs(Math.sin(t * (4 + i * 0.7) + i)); });
  HC.oven.glow.color.setHSL(0.06, 1, 0.35 + 0.1 * Math.sin(t * 3));
  const T = HC.ptv; T.k -= dt;
  if (T.k <= 0 && T.c.getContext) { T.k = 0.2; const g = T.c.getContext('2d'); if (g) { g.fillStyle = '#1a5a2a'; g.fillRect(0, 0, 256, 144); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(20, 20, 216, 104); g.beginPath(); g.moveTo(128, 20); g.lineTo(128, 124); g.stroke(); g.fillStyle = '#fff'; const bx = 128 + Math.sin(t * 0.7) * 90, by = 72 + Math.cos(t * 1.3) * 40; g.beginPath(); g.arc(bx, by, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(8, 6, 96, 14); g.fillStyle = '#fff'; g.font = '10px sans-serif'; g.fillText('LIVE  2 - 1  ' + Math.floor(60 + t / 60) + "'", 12, 17); T.t.needsUpdate = true; } }
  // the putt: the ball rolls to the hole, and drops, or doesn't
  const U = HC.putt;
  if (U.t >= 0) {
    U.t += dt; const k = Math.min(1, U.t / 2.4), h = U.hole, sx = 38 - 6.5, sz = 32;
    const ex = h.x + (U.in ? 0 : 0.5), ez = h.z + (U.in ? 0 : 0.3), e = 1 - Math.pow(1 - k, 2);
    U.ball.position.set(sx + (ex - sx) * e, U.in && k >= 1 ? 0.0 : 0.05, sz + (ez - sz) * e);
    if (k >= 1 && !U.said) { U.said = true; BM.halcyonSay(game, U.in ? 'In! Lovely putt.' : 'Just past the hole.', 2); if (U.in && A.ctx) A.tone('sine', 660, 990, 0.04, 0.005, 0.15); }
    if (U.t > 4.5) { U.t = -1; U.said = false; U.ball.position.set(38 - 6.5, 0.05, 32); }
  }
  for (const h of HC.holes) h.flag.rotation.y = Math.sin(t * 1.7 + h.x) * 0.3;
  // the yoga bowl
  if (HC.bowl && HC.bowl.uniforms) HC.bowl.uniforms.time.value = t;
  // the sprinklers: at dawn when time is passing, and whenever you ask
  const S = HC.sprinklers;
  if (S.auto && game.timeFlow) { const h = game.dayHour || 0, want = h > 5.4 && h < 6.6; if (want !== S.on && !S.manual) BM.halcyonSprinklers(game, want); }
  S.pts.visible = S.on;
  if (S.on) {
    S.t += dt; const pos = S.geo.attributes.position.array; let n = 0;
    S.heads.forEach(([hx, hz], si) => {
      const base = S.t * 0.9 + si * 1.3;
      for (let j = 0; j < 90; j++) {
        const arm = j % 3, u = ((j / 3) / 30 + S.t * 1.6 + arm * 0.33) % 1, ang = base + arm * 2.1, R = 6 * u;
        pos[n++] = hx + Math.sin(ang) * R; pos[n++] = 0.1 + 1.6 * 4 * u * (1 - u); pos[n++] = hz + Math.cos(ang) * R;
      }
    });
    S.geo.attributes.position.needsUpdate = true;
    if (A.ctx) { const d = Math.min(...S.heads.map(([x, z]) => Math.hypot(p.x - x, p.z - z))); if (d < 25 && Math.random() < dt * 20) A.burst(A.white, 'highpass', 5000, 1, 0.02 * (1 - d / 25), 0.002, 0.08); }
  }
};

BM.halcyonGroundsRows = function (game) {
  const HC = game.halcyon; if (!HC || !HC.sprinklers) return [];
  const r = (k, name, o) => Object.assign({ section: 'GROUNDS', supply: '', k: 'smart:' + k, name, on: true, lit: false, live: true }, o);
  return [
    r('sprinklers', 'Sprinklers', { on: HC.sprinklers.on, onText: 'WATERING', offText: HC.sprinklers.auto ? 'DAWN' : 'OFF', lit: HC.sprinklers.on }),
    r('putt', 'Putting green', { value: 'PUTT' }),
  ];
};
BM.halcyonGroundsToggle = function (game, id) {
  const HC = game.halcyon;
  if (id === 'sprinklers') { HC.sprinklers.manual = true; BM.halcyonSprinklers(game); }
  else if (id === 'putt') BM.halcyonPutt(game);
  else return false;
  return true;
};
})();
