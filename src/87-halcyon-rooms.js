/* ==========================================================================
   HALCYON HOUSE — THE ROOMS, DRESSED
   Built from research into 2026 lakeside houses (sources in the README):
   - the living room: a stone fireplace wall with a long linear fire set
     low, no mantel; deep low seating floating off the walls on a big rug;
     a curved bouclé sofa facing the lake; a travertine block table;
   - dining for ten under a linear pendant hung 0.8 m over the table;
   - the kitchen: a 4.2 m island with a waterfall stone top over a fluted
     oak base, counter stools, globe pendants; a wall of flush handleless
     cabinets hiding the fridge, the freezer and the ovens, a stone
     splashback with a lit ledge, a coffee niche;
   - the atrium: a cascading chandelier of glass globes, sized for a
     double-height space, its foot about 3.3 m up;
   - the bedrooms: beds facing the lake against batten headboard walls,
     the rug under the lower two-thirds, a bench at the foot, lamps level
     with the mattress, a lounge chair angled to the view, sheers;
   - the landing: a reading room of shelves, a sofa and two armchairs.
   Every light is warm (2700K) and layered: downlights, coves, lamps,
   grazing on the stone.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildHalcyonRooms = function (B, game) {
  const K = BM.KIT, HL = BM.HALCYON, F1 = HL.F1, ROOF = HL.ROOF, HC = game.halcyon, P = B.phys;
  const led = o => BM.halcyonLed(B, game, o);
  const C = F1 - 0.3, C2 = ROOF - 0.3;   // the ceilings
  B.zone = 'mansion';

  /* ---- plaster ceilings, which take a little of the room's light back (see halcyonAfterFx) ---- */
  const ceil = HC.ceilMat = new THREE.MeshPhongMaterial({ color: 0xe8e4dc, shininess: 4, specular: 0x111111 });
  const H = HL.H, ST2 = { x0: 6.2, x1: 7.7, z0: -4, z1: 2.4 }, LF = HL.LIFT;
  B.levelName = 'ground';
  for (const [x0, x1, z0, z1] of [[H.x0, H.x1, H.z0, 2], [H.x0, -6, 2, H.z1 - 0.3], [6, 13.95, 2, H.z1 - 0.3]]) B.boxE(ceil, x0, x1, C - 0.007, C, z0, z1);
  B.levelName = 'upper';
  for (const [x0, x1, z0, z1] of [[H.x0, LF.x0, H.z0, H.z1], [LF.x0, LF.x1, H.z0, LF.z0], [LF.x0, LF.x1, LF.z1, H.z1], [LF.x1, ST2.x0, H.z0, H.z1], [ST2.x0, ST2.x1, H.z0, ST2.z0], [ST2.x0, ST2.x1, ST2.z1, H.z1], [ST2.x1, H.x1, H.z0, H.z1]]) B.boxE(ceil, x0, x1, C2 - 0.007, C2, z0, z1);

  /* ================= THE LIVING ROOM ================= */
  B.levelName = 'ground'; B.room = 'living room';
  B.boxE('hOak', -26, 1, 0.02, 0.026, -18, 2);   // oak boards over the stone
  // the fireplace wall: dark soapstone slabs floor to ceiling, a linear fire low in it, art above
  const FW = { x: -26, z0: -15.5, z1: -8.5 };
  B.boxE('hSoapstone', FW.x, FW.x + 0.16, 0, C, FW.z0, FW.z1);
  for (let z = FW.z0 + 1.75; z < FW.z1; z += 1.75) B.boxE('hBlackSteel', FW.x + 0.16, FW.x + 0.163, 0, C, z - 0.002, z + 0.002);   // the slab joints
  B.boxE('hBlackGlass', FW.x + 0.1, FW.x + 0.18, 0.45, 0.88, -13.2, -10.8);                                              // the firebox
  B.boxE('hBlackSteel', FW.x + 0.17, FW.x + 0.19, 0.42, 0.45, -13.25, -10.75);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a30, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  HC.lflames = [];
  for (let i = 0; i < 14; i++) { const f = B.mesh(G.cone, flameMat, FW.x + 0.15, 0.55, -13.05 + i * 0.16, 0.1, 0.2, 0.04); f.userData.dynamic = true; f.matrixAutoUpdate = true; HC.lflames.push(f); }
  B.boxE('hBlackSteel', FW.x + 0.12, FW.x + 0.17, 0.45, 0.5, -13.2, -10.8);   // the burner bed: black glass beads
  HC.livingFire = { on: true, mat: flameMat, light: led({ id: 'living-fire', name: 'Fireplace', room: 'living room', pos: [FW.x + 0.8, 0.7, -12], colour: 0xff932c, target: 0.9, range: 6, corona: 0 }) };
  HC.livingFire.light.smart = false; HC.livingFire.light.base = null;
  B.interactable({ id: 'living-fire', label: () => HC.livingFire.on ? 'Fireplace: turn it off' : 'Fireplace: light it', pos: [FW.x + 0.3, 0.7, -10.4], n: [1, 0], act: g => BM.halcyonLivingFire(g) });
  K.art(B, FW.x + 0.17, 2.45, -12, 2.2, 1.4, Math.PI / 2, 3);
  for (const z of [-14.5, -12, -9.5]) led({ id: 'living-graze-' + z, name: 'Fireplace wall grazer', room: 'living room', pos: [FW.x + 0.3, C - 0.1, z], spot: true, dir: [0.06, -1, 0], colour: 0xffd8b0, target: 0.7, range: 5, corona: 0, glow: [FW.x + 0.3, C - 0.005, z, 0.08, 0.01, 0.08] });
  // the seating round the fire: a deep sofa, two lounge chairs, the travertine block, a big rug
  K.rug(B, -22, -11.9, 0.026, 5, 5.6, 0, { mat: 'hRugCream', border: 'hRugGrey' });
  K.sofa(B, -19.3, -11.9, 0.026, 3.6, -Math.PI / 2, { mat: 'hFabricSand', accent: 'hFabricRust', d: 1.05 });
  B.box('hTravertine', -22.6, 0.026 + 0.17, -11.9, 0.95, 0.34, 1.7); B.box('hTravertine', -22.6, 0.026 + 0.345, -11.9, 0.97, 0.01, 1.72);
  K.books(B, -22.7, 0.37, -12.3, 3, 0.2); K.vase(B, -22.5, 0.37, -11.4, 0.7);
  K.loungeChair(B, -22.6, -15.3, 0.026, 0.25, { ottoman: false }); K.loungeChair(B, -22.6, -8.5, 0.026, Math.PI - 0.25, { ottoman: false });
  K.sideTable(B, -19.3, -14.25, 0.026); K.sideTable(B, -19.3, -9.55, 0.026);
  K.floorLamp(B, -24.4, -16.2, 0.026); K.floorLamp(B, -24.4, -7.6, 0.026);
  for (const [z, k] of [[-16.2, 'a'], [-7.6, 'b']]) led({ id: 'living-lamp-' + k, name: 'Floor lamp', room: 'living room', pos: [-24.4, 1.5, z], colour: 0xffc890, target: 0.45, range: 4, corona: 0.3, glow: [-24.4, 1.626, z, 0.43, 0.35, 0.43], glowGeo: 'cyl' });
  // facing the lake: a curved bouclé sofa round a low round table
  K.rug(B, -11.5, -11.5, 0.026, 5.2, 4.6, 0, { mat: 'hRugGrey', border: false });
  K.curvedSofa(B, -11.5, -12.2, 0.026, 2.3, -1.15, 1.15, { mat: 'hBoucle' });
  K.roundTable(B, -11.5, -12.4, 0.026, 0.6, 0.34, { top: 'hTravertine' });
  K.vase(B, -11.3, 0.37, -12.3, 0.8);
  // along the back wall: a long credenza, books and pots on it, a painting over it
  K.credenza(B, -19, 1.64, 0.026, 3.2, Math.PI);
  K.vase(B, -20.2, 0.79, 1.6, 1); K.books(B, -18.6, 0.79, 1.62, 4, 0.1); B.mesh(G.sphere, 'hCeramicDark', -17.8, 0.89, 1.62, 0.2, 0.2, 0.2);
  K.art(B, -19, 1.95, 1.89, 2.4, 1.2, Math.PI, 1);
  led({ id: 'living-art', name: 'Picture light', room: 'living room', pos: [-19, C - 0.1, 0.9], spot: true, dir: [0, -1, 0.5], colour: 0xffe0c0, target: 0.6, range: 4, corona: 0, glow: [-19, C - 0.005, 0.9, 0.08, 0.01, 0.08] });
  // trees in pots: an olive in the corner by the glass, a fig by the dining table
  K.plant(B, -24.9, -16.9, 0.026, 'olive', 2.5, { pot: 'hConcrete' });
  K.plant(B, -6.6, -16.9, 0.026, 'fig', 2.2);

  /* ================= THE DINING TABLE ================= */
  const DT = { x: -1.6, z: -10.6 };
  K.rug(B, DT.x, DT.z, 0.026, 4.6, 3.4, 0, { mat: 'hRugGrey', border: 'hRugCream' });
  K.table(B, DT.x, DT.z, 0.026, 3.0, 1.1, 0, { top: 'hWalnut', legs: 'slab', t: 0.06, tag: 'dining table' });
  for (const lx of [-1.05, -0.35, 0.35, 1.05]) { K.diningChair(B, DT.x + lx, DT.z - 0.78, 0.026, 0, { wood: 'hWalnut', mat: 'hFabricRust' }); K.diningChair(B, DT.x + lx, DT.z + 0.78, 0.026, Math.PI, { wood: 'hWalnut', mat: 'hFabricRust' }); }
  K.diningChair(B, DT.x - 1.85, DT.z, 0.026, Math.PI / 2, { wood: 'hWalnut', mat: 'hFabricRust' }); K.diningChair(B, DT.x + 1.85, DT.z, 0.026, -Math.PI / 2, { wood: 'hWalnut', mat: 'hFabricRust' });
  K.pendant(B, DT.x, 1.6, DT.z, 'linear', { len: 1.9, drop: C - 1.6 });
  led({ id: 'dining-pendant', name: 'Dining pendant', room: 'living room', pos: [DT.x, 1.5, DT.z], colour: 0xffc890, target: 0.8, range: 5, corona: 0.3, glow: [DT.x, 1.563, DT.z, 1.86, 0.012, 0.05] });
  for (const lx of [-0.6, 0.6]) K.vase(B, DT.x + lx, 0.79, DT.z, 0.6);

  /* ================= THE KITCHEN ================= */
  B.room = 'kitchen';
  // the island: a fluted oak base, a 60 mm quartzite top that falls to the floor at both ends
  const IS = { x: 15, z: -8, w: 4.2, d: 1.3 };
  B.boxE('hFluted', IS.x - IS.w / 2 + 0.06, IS.x + IS.w / 2 - 0.06, 0.03, 0.86, IS.z - IS.d / 2 + 0.05, IS.z + IS.d / 2 - 0.32);
  B.boxE('hBlackSteel', IS.x - IS.w / 2 + 0.1, IS.x + IS.w / 2 - 0.1, 0.0, 0.08, IS.z - IS.d / 2 + 0.1, IS.z + IS.d / 2 - 0.36);   // the shadow-gap plinth
  B.boxE('hMarble', IS.x - IS.w / 2, IS.x + IS.w / 2, 0.86, 0.92, IS.z - IS.d / 2, IS.z + IS.d / 2);
  for (const s of [-1, 1]) B.boxE('hMarble', IS.x + s * (IS.w / 2 - 0.03) - 0.03, IS.x + s * (IS.w / 2 - 0.03) + 0.03, 0, 0.86, IS.z - IS.d / 2, IS.z + IS.d / 2);
  P.addWall(IS.x - IS.w / 2, IS.x + IS.w / 2, IS.z - IS.d / 2, IS.z + IS.d / 2, 0, 0.92, { kind: 'furniture', tag: 'kitchen island' });
  // on it: an induction hob in black glass, a sink with a tall black tap, a bowl of lemons
  B.boxE('hBlackGlass', 15.6, 16.5, 0.92, 0.926, -8.45, -7.9);
  B.boxE('hBlackSteel', 13.4, 14.2, 0.9, 0.922, -8.45, -7.95);
  B.mesh(G.post, 'hBlackSteel', 13.8, 1.1, -8.55, 0.03, 0.38, 0.03); B.box('hBlackSteel', 13.8, 1.28, -8.42, 0.025, 0.025, 0.26);
  B.mesh(G.cyl, 'hCeramic', 14.9, 0.97, -7.7, 0.34, 0.1, 0.34);
  for (let i = 0; i < 5; i++) B.mesh(G.sphere, 'hFoil', 14.9 + Math.cos(i * 1.3) * 0.08, 1.02 + (i > 3 ? 0.04 : 0), -7.7 + Math.sin(i * 1.3) * 0.08, 0.08, 0.075, 0.075);
  for (let i = 0; i < 5; i++) K.barStool(B, 13.7 + i * 0.65, -6.95, 0, Math.PI, { mat: 'hLeather', h: 0.65 });
  // the back wall: tall flush cabinets (fridge, freezer, ovens), a run with a stone splashback and ledge, a coffee niche
  const BZ = 1.9, D = 0.65;
  const tall = (x0, x1) => { B.boxE('hWalnut', x0, x1, 0, C, BZ - D, BZ); for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 0.6))) B.boxE('hBlackSteel', x - 0.0015, x + 0.0015, 0.1, C, BZ - D - 0.002, BZ - D); B.boxE('hBlackSteel', x0, x1, 2.29, 2.293, BZ - D - 0.002, BZ - D); B.boxE('hBlackSteel', x0, x1, 0, 0.1, BZ - D + 0.05, BZ - D + 0.06); P.addWall(x0, x1, BZ - D, BZ, 0, C, { kind: 'furniture', tag: 'kitchen cabinets' }); };
  tall(14.2, 17.8);
  for (const y of [0.95, 1.6]) { B.boxE('hBlackGlass', 16.65, 17.75, y, y + 0.6, BZ - D - 0.01, BZ - D); B.boxE('hChrome', 16.75, 17.65, y + 0.5, y + 0.52, BZ - D - 0.02, BZ - D - 0.01); }   // two ovens, flush in the tall run
  tall(20.8, 22.4); tall(23.6, 25.8);
  // (a gap in the tall run for the kitchen's home tablet: a stone counter below it, a cabinet above)
  B.boxE('hWalnut', 22.4, 23.6, 0, 0.86, BZ - D, BZ); B.boxE('hMarble', 22.4, 23.6, 0.86, 0.9, BZ - D - 0.02, BZ); B.boxE('hWalnut', 22.4, 23.6, 2.2, C, BZ - 0.4, BZ);
  P.addWall(22.4, 23.6, BZ - D, BZ, 0, 0.9, { kind: 'furniture', tag: 'kitchen bench' });
  // the run between: base cabinets, the stone carried up the wall, a ledge, wall cabinets with a light under them
  B.boxE('hWalnut', 17.8, 19.3, 0, 0.86, BZ - D, BZ); B.boxE('hMarble', 17.8, 19.3, 0.86, 0.9, BZ - D - 0.02, BZ);
  B.boxE('hMarble', 17.8, 19.3, 0.9, 1.55, BZ - 0.02, BZ); B.boxE('hMarble', 17.8, 19.3, 1.55, 1.59, BZ - 0.2, BZ);
  B.boxE('hWalnut', 17.8, 19.3, 2.2, C, BZ - 0.4, BZ);
  P.addWall(17.8, 19.3, BZ - D, BZ, 0, 0.9, { kind: 'furniture', tag: 'kitchen bench' });
  led({ id: 'kitchen-undercab', name: 'Under-cabinet light', room: 'kitchen', pos: [18.55, 2.0, BZ - 0.3], colour: 0xffd8b0, target: 0.5, range: 3, corona: 0, glow: [18.55, 2.195, BZ - 0.36, 1.46, 0.008, 0.03] });
  led({ id: 'kitchen-ledge', name: 'Ledge light', room: 'kitchen', pos: [18.55, 1.45, BZ - 0.15], colour: 0xffc890, target: 0.35, range: 2, corona: 0, glow: [18.55, 1.545, BZ - 0.17, 1.46, 0.006, 0.02] });
  K.vase(B, 18.1, 1.59, BZ - 0.1, 0.6); B.mesh(G.sphere, 'hCeramic', 18.9, 1.65, BZ - 0.1, 0.12, 0.12, 0.12);
  // the coffee niche (its pocket doors slid back): a machine, cups, a lit stone shelf, and the keypad beside it
  B.boxE('hTravertine', 19.3, 20.8, 0, 0.9, BZ - 0.45, BZ); B.boxE('hTravertine', 19.3, 20.8, 2.2, C, BZ - 0.45, BZ);
  B.boxE('hBlackSteel', 19.5, 19.95, 0.9, 1.3, BZ - 0.38, BZ - 0.05); B.boxE('hChrome', 19.6, 19.85, 1.0, 1.03, BZ - 0.42, BZ - 0.38);
  for (let i = 0; i < 4; i++) B.mesh(G.cyl, 'hCeramic', 20.15 + i * 0.12, 0.94, BZ - 0.2, 0.08, 0.08, 0.08);
  P.addWall(19.3, 20.8, BZ - 0.45, BZ, 0, 0.9, { kind: 'furniture', tag: 'coffee niche' });
  K.plant(B, 7.4, -16.8, 0, 'olive', 2.3);

  /* ================= THE ATRIUM: A CASCADE OF GLOBES ================= */
  B.room = 'atrium';
  { const cx = 0, cz = 7.6, rnd = BM.mulberry32(77), globes = [];
    for (let i = 0; i < 34; i++) {
      const a = i * 2.399, r = 0.25 + 0.6 * Math.sqrt(i / 34), y = 3.4 + (i / 34) * 2.1 + rnd() * 0.25, d = 0.16 + rnd() * 0.12;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      B.box('hBrass', x, (y + C2) / 2, z, 0.006, C2 - y, 0.006);
      globes.push(['sphere', x, y, z, d, d, d]);
    }
    B.mesh(G.cyl, 'hBrass', cx, C2 - 0.02, cz, 1.8, 0.04, 1.8);
    const g0 = globes.shift();
    led({ id: 'atrium-chandelier', name: 'Chandelier', room: 'atrium', pos: [cx, 4.4, cz], colour: 0xffc890, target: 1.1, range: 11, corona: 0.4, glow: [g0[1], g0[2], g0[3], g0[4], g0[5], g0[6]], glowGeo: 'sphere', glowMore: globes });
  }
  // a fig either side of the door, a sculpture on a travertine plinth, a long bench
  for (const s of [-1, 1]) K.plant(B, s * 2.4, 12.9, 0, 'fig', 2.4, { pot: 'hTravertine' });
  B.solid('hTravertine', -3.6, -2.8, 0, 0.9, 11.2, 12.0, { kind: 'furniture', tag: 'plinth' });
  B.mesh(G.sphere, 'hBronze', -3.2, 1.25, 11.6, 0.5, 0.7, 0.5); B.mesh(G.sphere, 'hBronze', -3.2, 1.72, 11.6, 0.3, 0.36, 0.3);
  led({ id: 'atrium-sculpture', name: 'Sculpture spot', room: 'atrium', pos: [-3.2, 3.0, 11.6], spot: true, dir: [0, -1, 0], colour: 0xffe0c0, target: 0.6, range: 4, corona: 0 });

  /* ================= THE MASTER BEDROOM ================= */
  B.levelName = 'upper'; B.room = 'master suite';
  const MB = { x: 13, z: 0.62 };
  B.boxE('hBattens', MB.x - 1.9, MB.x + 1.9, F1, C2, 1.86, 1.9);                         // the headboard wall: oak battens
  led({ id: 'master-headwash', name: 'Headboard wash', room: 'master suite', pos: [MB.x, C2 - 0.2, 1.5], spot: true, dir: [0, -1, 0.15], colour: 0xffc890, target: 0.5, range: 5, corona: 0, glow: [MB.x, C2 - 0.02, 1.75, 3.6, 0.01, 0.03] });
  K.rug(B, MB.x, 0.15, F1, 3.65, 2.9, 0, { mat: 'hRugCream', border: 'hRugGrey' });
  const lampsM = K.bed(B, MB.x, MB.z, F1, Math.PI, { w: 1.95, l: 2.1, headboard: 'hFabricStone', throw: 'hFabricRust' });
  lampsM.forEach(([x, z], i) => led({ id: 'master-lamp-' + i, name: 'Bedside lamp', room: 'master suite', pos: [x, F1 + 0.95, z], colour: 0xffc890, target: 0.4, range: 3, corona: 0.3, glow: [x, F1 + 0.93, z, 0.35, 0.27, 0.35], glowGeo: 'cyl' }));
  // the bench at the foot of the bed
  B.box('hFabricStone', MB.x, F1 + 0.4, -0.9, 1.5, 0.12, 0.45); for (const s of [-1, 1]) B.box('hWalnut', MB.x + s * 0.68, F1 + 0.17, -0.9, 0.05, 0.34, 0.4);
  // a chair angled to the view, a side table, a lamp; a long dresser with art over it
  K.loungeChair(B, 10.2, -14.2, F1, Math.PI + 0.6, { mat: 'hFabricSand' }); K.sideTable(B, 11.3, -15.2, F1); K.floorLamp(B, 9.2, -15.4, F1);
  K.credenza(B, 8.4, -9.5, F1, 2.6, Math.PI / 2, { mat: 'hSmokedOak' }); K.art(B, 8.12, F1 + 1.8, -9.5, 1.6, 1.1, Math.PI / 2, 4);
  K.plant(B, 17.1, -16.9, F1, 'fig', 2.2);
  // sheers: long folds stacked either side of the glass
  const sheer = new THREE.MeshPhongMaterial({ color: 0xf2eee8, transparent: true, opacity: 0.7, shininess: 2, side: THREE.DoubleSide });
  const folds = (x0, x1, z, y0, y1) => { for (let x = x0, k = 0; x < x1; x += 0.11, k++) B.box(sheer, x + 0.055, (y0 + y1) / 2, z + (k % 2 ? 0.05 : 0), 0.12, y1 - y0 - 0.02, 0.02, k % 2 ? 0.5 : -0.5); B.box('hBlackSteel', (x0 + x1) / 2, y1 - 0.01, z + 0.02, x1 - x0, 0.02, 0.04); };
  folds(8.25, 9.1, -17.75, F1, C2); folds(16.95, 17.8, -17.75, F1, C2);

  /* ================= THE GUEST ROOM ================= */
  B.room = 'guest room';
  const GB = { x: -17, z: 0.62 };
  B.boxE('hPlaster', GB.x - 2.2, GB.x + 2.2, F1, C2, 1.86, 1.9);
  B.boxE('hWalnut', GB.x - 1.4, GB.x + 1.4, F1 + 1.4, F1 + 1.46, 1.75, 1.9);   // a picture ledge over the bed
  K.art(B, GB.x - 0.55, F1 + 1.85, 1.82, 0.7, 0.75, Math.PI, 2); K.art(B, GB.x + 0.45, F1 + 1.8, 1.82, 0.6, 0.65, Math.PI, 0);
  K.rug(B, GB.x, 0.2, F1, 3.05, 2.45, 0, { mat: 'hRugRust', border: 'hRugCream' });
  const lampsG = K.bed(B, GB.x, GB.z + 0.02, F1, Math.PI, { w: 1.55, l: 2.05, headboard: 'hFabricOlive', throw: 'hFabricWhite', accent: 'hFabricRust' });
  lampsG.forEach(([x, z], i) => led({ id: 'guest-lamp-' + i, name: 'Bedside lamp', room: 'guest room', pos: [x, F1 + 0.95, z], colour: 0xffc890, target: 0.4, range: 3, corona: 0.3, glow: [x, F1 + 0.93, z, 0.35, 0.27, 0.35], glowGeo: 'cyl' }));
  // a desk on the west wall, its chair; a lounge chair by the glass; a built-in wardrobe of flush oak
  K.table(B, -25.65, -6, F1, 1.2, 0.5, Math.PI / 2, { top: 'hOak', h: 0.75, tag: 'desk' });
  K.diningChair(B, -25.0, -6, F1, -Math.PI / 2, { wood: 'hOak', mat: 'hFabricStone' });
  B.mesh(G.cyl, 'hBrass', -25.75, F1 + 0.76, -5.6, 0.14, 0.02, 0.14); B.mesh(G.post, 'hBrass', -25.75, F1 + 0.98, -5.6, 0.015, 0.44, 0.015); B.mesh(G.sphere, 'hOpal', -25.7, F1 + 1.22, -5.6, 0.16);
  K.books(B, -25.7, F1 + 0.775, -6.3, 3, 0.3);
  K.loungeChair(B, -11.2, -15, F1, Math.PI - 0.5, { mat: 'hBoucle', ottoman: false }); K.sideTable(B, -12.2, -15.8, F1);
  B.boxE('hOak', -8.75, -8.1, F1, C2 - 0.6, -16.4, -6);
  for (let z = -16.4; z <= -6; z += 0.6933) B.boxE('hBlackSteel', -8.752, -8.75, F1 + 0.05, C2 - 0.65, z - 0.0015, z + 0.0015);
  B.boxE('hOak', -8.75, -8.1, C2 - 0.6, C2, -16.4, -6);
  P.addWall(-8.75, -8.1, -16.4, -6, F1, C2, { kind: 'furniture', tag: 'wardrobe' });
  K.plant(B, -24.9, -16.9, F1, 'olive', 2.0);
  folds(-25.8, -24.95, -17.75, F1, C2); folds(-9.1, -8.25, -17.75, F1, C2);

  /* ================= THE LANDING: A READING ROOM OVER THE LAKE ================= */
  B.room = 'landing';
  K.rug(B, 0, -12.2, F1, 4.6, 4.0, 0, { mat: 'hRugCream', border: 'hRugRust' });
  K.sofa(B, 0, -10.6, F1, 3.0, Math.PI, { mat: 'hFabricCharcoal', accent: 'hFabricSand' });
  K.armchair(B, -1.6, -14.2, F1, 0.35, { mat: 'hBoucle' }); K.armchair(B, 1.6, -14.2, F1, -0.35, { mat: 'hBoucle' });
  K.table(B, 0, -12.4, F1, 1.4, 0.8, 0, { top: 'hTravertine', h: 0.34, legs: 'slab', t: 0.06, tag: 'coffee table' });
  K.books(B, -0.3, F1 + 0.34, -12.5, 4, 0.4); K.vase(B, 0.35, F1 + 0.34, -12.3, 0.7);
  K.shelves(B, -7.72, -12, F1, 4.2, 2.8, Math.PI / 2, { mat: 'hWalnut' });
  K.shelves(B, -7.72, -7.2, F1, 4.2, 2.8, Math.PI / 2, { mat: 'hWalnut' });
  led({ id: 'landing-shelves', name: 'Shelf light', room: 'landing', pos: [-7.2, F1 + 2.9, -9.6], spot: true, dir: [-0.3, -1, 0], colour: 0xffd8b0, target: 0.5, range: 5, corona: 0, glow: [-7.45, F1 + 2.83, -9.6, 0.02, 0.01, 8.6] });
  K.credenza(B, 7.65, -13, F1, 2.4, -Math.PI / 2, { mat: 'hSmokedOak' }); K.art(B, 7.89, F1 + 1.8, -13, 1.8, 1.1, -Math.PI / 2, 2);
  K.floorLamp(B, -2.6, -9.6, F1);
  led({ id: 'landing-lamp', name: 'Floor lamp', room: 'landing', pos: [-2.6, F1 + 1.5, -9.6], colour: 0xffc890, target: 0.45, range: 4, corona: 0.3, glow: [-2.6, F1 + 1.6, -9.6, 0.43, 0.35, 0.43], glowGeo: 'cyl' });
  K.plant(B, 6.8, -16.9, F1, 'olive', 2.2);
  B.levelName = 'ground'; B.room = 'house';

  /* ================= THE POOL TERRACE: LOUNGERS IN PAIRS, UMBRELLAS ================= */
  B.zone = 'exterior'; B.room = 'grounds';
  for (const s of [-1, 1]) {
    for (const x of [19, 19.8, 23, 23.8]) K.lounger(B, s * x, -29.5, 0.02, Math.PI);
    for (const x of [21.4]) { B.mesh(G.cyl, 'hTravertine', s * x, 0.06, -28.2, 0.5, 0.12, 0.5); B.mesh(G.post, 'hBlackSteel', s * x, 1.3, -28.2, 0.05, 2.5, 0.05); B.box('hFabricSand', s * x, 2.5, -28.2, 3, 0.05, 3); B.box('hFabricSand', s * x, 2.45, -28.2, 3.02, 0.12, 3.02); }
    K.sideTable(B, s * 19.4, -27.8, 0.02); K.sideTable(B, s * 23.4, -27.8, 0.02);
  }
  B.zone = 'mansion';
};

/* the living-room fire: on and off, the flames licking */
BM.halcyonLivingFire = function (game, on) {
  const F = game.halcyon.livingFire; F.on = on === undefined ? !F.on : on;
  F.light.on = F.on; F.light.target = F.on ? 0.9 : 0;
  BM.halcyonSay(game, F.on ? 'Fireplace on.' : 'Fireplace off.', 2);
};
BM.updateHalcyonRooms = function (game, dt) {
  const HC = game.halcyon; if (!HC || !HC.lflames) return;
  const F = HC.livingFire, t = HC.t;
  F.mat.opacity += ((F.on ? 0.9 : 0) - F.mat.opacity) * Math.min(1, dt * 3);
  HC.lflames.forEach((f, i) => { const h = 0.16 + 0.1 * Math.abs(Math.sin(t * (3.1 + i * 0.37) + i)) + 0.05 * Math.sin(t * 7.3 + i * 2); f.scale.set(0.09, h, 0.04); f.position.y = 0.5 + h / 2; f.visible = F.mat.opacity > 0.02; });
  if (F.on && F.light.intensity > 0) F.light.colour = 0xff932c;
};
})();
