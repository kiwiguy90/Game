/* ==========================================================================
   BLACKTHORN MANOR — 6u. THE ICE HOUSE
   Out at the north-west edge of the estate, a grassed-over mound with a
   brick doorway in its face: the old ice house. A short passage slopes
   down under the turf into a domed brick chamber where the winter's ice
   was packed in straw. There has never been a light in it. Bring a torch.
   At the back, a tin trunk: what her mother hid for her, and she never found.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const IH = { cx: -48, cz: -44, r: 2.3, floor: -0.8, face: -38.6, mound: 5.2 };
BM.ICEHOUSE = IH;

BM.buildIcehouse = function (B, game) {
  const P = B.phys;
  B.zone = 'estate'; B.levelName = 'ground'; B.room = 'ice house';
  const { cx, cz, r, floor: FY, face } = IH;
  const brick = BM.M('brick'), innerBrick = brick.clone(); innerBrick.side = THREE.BackSide;
  // the mound: a low turfed dome, with nettles and long grass on it
  // (open on the doorway side, so the passage can be seen into; drawn from both sides so the open edge reads as turf)
  const moundGeo = BM.statuaryGeo('iceMound', () => new THREE.SphereGeometry(0.5, 28, 12, Math.PI / 2 + 0.32, Math.PI * 2 - 0.64));
  const turf = BM.M('grass').clone(); turf.side = THREE.DoubleSide;
  B.mesh(moundGeo, turf, cx, -0.4, cz, IH.mound * 2, 7.2, IH.mound * 2);
  for (const s of [-1, 1]) B.boxE('brick', cx + s * 1.55 - 0.12, cx + s * 1.55 + 0.12, 0, 2.4, face - 1.4, face);     // brick cheeks into the turf
  for (let i = 0; i < 26; i++) { const a = i * 2.4, d = 1 + (i * 1.37) % 3.6, x = cx + Math.sin(a) * d, z = cz + Math.cos(a) * d * 0.9;
    if (z > cz + 3.2 && Math.abs(x - cx) < 1.8) continue;
    const y = -0.4 + 3.6 * Math.sqrt(Math.max(0, 1 - (d / IH.mound) * (d / IH.mound)));
    B.mesh(G.cone, i % 3 ? 'longGrass' : 'weed', x, y + 0.3, z, 0.12, 0.7, 0.12); }
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, x = cx + Math.sin(a) * 5.0, z = cz + Math.cos(a) * 5.0;
    if (Math.cos(a) > 0.93) continue;                                        // the doorway face closes this side
    P.addWall(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 0, 3.5, { kind: 'wall', tag: 'the ice house mound' }); }
  // the doorway: a brick face set into the mound, a pediment, a heavy plank door
  B.wall('x', face, cx - 1.6, cx + 1.6, { t: 0.4, mat: 'brick', y1: 2.6 }, [{ at: cx, w: 1.0, type: 'door', head: 2.0, id: 'icehouse-door', casing: 'gothicTrim' }]);
  B.mesh(G.wedge, 'brick', cx, 2.6, face, 0.4, 0.7, 3.2, Math.PI / 2);
  B.boxE('gothicTrim', cx - 1.7, cx + 1.7, 2.55, 2.65, face - 0.25, face + 0.25);
  game.icehouseDoor = B.hingedDoor({ id: 'icehouse-door', axis: 'x', at: cx, c: face, w: 1.0, h: 2.0, hinge: 'low', swing: -1, mat: 'boards', panelMat: 'boards', dur: 2.0, sound: 'creak', label: 'the ice house door', wallT: 0.4 });
  // the passage: down a slope of worn brick under a vaulted roof
  const PZ0 = cz + r - 0.3, PZ1 = face - 0.2;
  P.ramp(cx - 0.5, cx + 0.5, PZ0, PZ1, 'z', FY, 0, FY - 0.3, 'ice house passage');
  for (let i = 0; i < 12; i++) { const z0 = PZ0 + (PZ1 - PZ0) * i / 12, z1 = PZ0 + (PZ1 - PZ0) * (i + 1) / 12, y = FY + (0 - FY) * (i + 0.5) / 12;
    B.boxE('brick', cx - 0.5, cx + 0.5, y - 0.2, y, z0, z1 + 0.01); }
  B.boxE('brick', cx - 0.5, cx + 0.5, -0.02, 0, PZ1, face);
  for (const s of [-1, 1]) {
    B.boxE('brick', cx + s * 0.55 - 0.05, cx + s * 0.55 + 0.05, FY, 2.0, PZ0 - 0.4, face);
    P.addWall(cx + s * 0.55 - 0.05, cx + s * 0.55 + 0.05, PZ0 - 0.4, face, FY, 2.5, { kind: 'wall' });
  }
  B.boxE('brick', cx - 0.6, cx + 0.6, 1.95, 2.05, PZ0 - 0.4, face);
  // the chamber: a brick dome, a stone floor, a drain grate in the middle where the meltwater went
  P.rect(cx - r, cx + r, cz - r, cz + r, FY, FY - 0.3, 'ice house floor');
  B.mesh(G.cyl, 'stone', cx, FY - 0.05, cz, r * 2 + 0.2, 0.1, r * 2 + 0.2);
  B.mesh(G.sphere, innerBrick, cx, FY, cz, (r + 0.1) * 2, 6.2, (r + 0.1) * 2);
  { const g = B.mesh(G.disc, 'grate', cx, FY + 0.005, cz + 0.4, 0.7, 0.7, 1); g.rotation.x = -Math.PI / 2; g.updateMatrix(); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
    if (Math.cos(a) > 0.85) continue;                                        // where the passage comes in
    P.addWall(x - 0.3, x + 0.3, z - 0.3, z + 0.3, FY, 3, { kind: 'wall', tag: 'the ice house wall' }); }
  // what is left: old straw, an ice saw and tongs on a nail, and the trunk
  const straw = new THREE.MeshLambertMaterial({ color: 0x6e5e3a });
  for (const [dx, dz, w] of [[-1.3, -0.6, 1.1], [1.2, -0.9, 0.9], [-0.9, 0.9, 0.7]]) B.mesh(G.lowSphere, straw, cx + dx, FY + 0.05, cz + dz, w, 0.18, w * 0.8);
  { const s = B.box('rust', cx + 2.05, FY + 1.3, cz - 0.4, 0.04, 0.9, 0.16); s.rotation.x = 0.2; s.updateMatrix(); }
  for (const s of [-1, 1]) { const t = B.box('iron', cx + 2.05, FY + 1.25, cz + 0.4 + s * 0.08, 0.04, 0.7, 0.03); t.rotation.x = s * 0.25; t.updateMatrix(); }
  P.addWall(cx - 0.48, cx + 0.48, cz - 1.83, cz - 1.27, FY, FY + 0.55, { kind: 'furniture', tag: 'tin trunk' });
  B.boxE('rust', cx - 0.47, cx + 0.47, FY, FY + 0.48, cz - 1.82, cz - 1.28);
  B.boxE('metalDark', cx - 0.49, cx + 0.49, FY + 0.46, FY + 0.5, cz - 1.84, cz - 1.26);
  for (const dx of [-0.3, 0.3]) B.boxE('iron', cx + dx - 0.03, cx + dx + 0.03, FY, FY + 0.5, cz - 1.285, cz - 1.275);
  B.mesh(G.plane, BM.labelMat('E.J.B.', { w: 128, h: 48, size: 28, bg: '#5a3018', fg: '#d8c8a0', border: '#3a2010' }), cx, FY + 0.3, cz - 1.27, 0.3, 0.11, 1);
  B.readable('icehouse-case', 'A tin trunk marked E.J.B.', 'A tin trunk, wrapped in a tarpaulin and pushed to the back of the ice house where nobody would come. Inside, packed with care:\n\nA passport. Eleanor Jane Blackthorn, issued September 1974. Never stamped.\nA one-way railway ticket to London, for the 5th of November 1974.\nForty pounds in an envelope.\nA cardigan, folded. A hairbrush.\n\nAnd a letter, in her mother\'s hand:\n\n"My darling girl — your father will never think of the ice house. Everything you need is here. When the gates are open for the bonfire night carriages, go, and do not look back, and do not write to me, because he reads everything.\nI am sorry I was not braver.\nYour loving Mother."\n\nThe envelope with the money has never been opened. She never found it.', [cx, FY + 0.55, cz - 1.5], [0, 1], { visual: false, floorY: FY });
  // the grass and the rain keep out
  game.icehouse = { inside: false, scare: 0, done: false };
  B.zone = 'exterior'; B.room = 'grounds';
};

/* The first time you stand under the dome, your torch goes out. Something lets out a breath. Then it comes back. */
BM.updateIcehouse = function (game, dt) {
  const S = game.icehouse; if (!S) return;
  const p = game.player, inside = Math.hypot(p.x - IH.cx, p.z - IH.cz) < IH.r - 0.3 && p.y < -0.4 && p.y > -1.2;
  if (inside && !S.done && !game.headless) {
    S.done = true; S.scare = 0.001; S.torchWas = p.torch;
    if (p.torch) { p.torch = false; game.audio.click(); }
    game.audio.groan && game.audio.groan();
    game.ui.say('Your torch dies. In the black, very close, something lets out a long breath — like someone who has been holding it for a very long time.', 5);
  }
  if (S.scare > 0) { S.scare += dt;
    if (S.scare > 1.8) { S.scare = 0; if (S.torchWas) { p.torch = true; game.audio.click(); } game.ui.say('The torch catches again. There is nobody here. There is a trunk at the back of the chamber.', 4); } }
  if (game.story.read.has('icehouse-case')) game.story.iceSecret = true;
};
})();
