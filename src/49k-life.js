/* ==========================================================================
   BLACKTHORN MANOR — 6s. THINGS THAT MOVE IN THE DARK
   - Bats: a colony in the towers, out hunting round the battlements, black
     against the floodlit stone.
   - Every light on: Eleanor's letter asks whoever finds it to put the lights
     on, all of them. Do that — every group on the estate panel burning at
     once — and somebody comes to the gable window to look: a girl's shape
     against the candle, quite still, for as long as it takes to be sure you
     saw her. Then the candle goes out.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

function silhouetteTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.beginPath(); g.ellipse(64, 52, 22, 27, 0, 0, Math.PI * 2); g.fill();                             // the head
  g.beginPath(); g.moveTo(40, 40); g.quadraticCurveTo(30, 110, 34, 150); g.lineTo(94, 150); g.quadraticCurveTo(98, 110, 88, 40); g.fill(); // long hair down her back
  g.fillRect(56, 74, 16, 22);                                                                         // the neck
  g.beginPath(); g.moveTo(18, 192); g.quadraticCurveTo(22, 104, 64, 96); g.quadraticCurveTo(106, 104, 110, 192); g.fill(); // shoulders and dress
  const t = new THREE.CanvasTexture(c); return t;
}

BM.buildLife = function (B, game) {
  B.zone = 'exterior'; B.room = 'grounds';
  /* ---- bats ---- */
  const bats = [];
  const wingGeo = BM.statuaryGeo('batWing', () => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.22, 0.06); s.lineTo(0.3, -0.02); s.lineTo(0.2, -0.05); s.lineTo(0.14, -0.1); s.lineTo(0.08, -0.06); s.lineTo(0, -0.08);
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g; });
  const batMat = new THREE.MeshBasicMaterial({ color: 0x07070a, side: THREE.DoubleSide });
  const homes = (game.towers || [[-21, 15], [21, 15], [-21, -15], [21, -15]]).concat([[0, 10]]);
  // the whole colony in two draws: one instanced mesh for the bodies, one for the wings
  const N = 11;
  const bodies = new THREE.InstancedMesh(G.lowSphere, batMat, N), wings = new THREE.InstancedMesh(wingGeo, batMat, N * 2);
  for (const m of [bodies, wings]) { m.frustumCulled = false; m.userData.dynamic = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); B.root.add(m); }
  for (let i = 0; i < N; i++) {
    const [hx, hz] = homes[i % homes.length];
    bats.push({ hx, hz, r: 4 + (i * 1.7) % 5, h: 13 + (i * 2.3) % 8, w: (0.6 + (i % 4) * 0.18) * (i % 2 ? 1 : -1), ph: i * 2.1, flap: 14 + (i % 3) * 3 });
  }
  game.batMeshes = { bodies, wings, o: new THREE.Object3D(), w: new THREE.Object3D() };
  /* ---- the girl at the gable window ---- */
  const mat = new THREE.MeshBasicMaterial({ map: silhouetteTexture(), color: 0xffffff, transparent: true, alphaTest: 0.4, depthWrite: false, opacity: 0 });
  // the lit lancet high in the west front tower, the one window that always has a light in it
  const [tx, tz] = (game.towers || [[-21, 15]])[0], out = Math.atan2(tx, tz), ap = 3.2 * Math.cos(Math.PI / 8) + 0.065;
  const fig = B.mesh(G.plane, mat, tx + Math.sin(out) * ap, 17.85, tz + Math.cos(out) * ap, 0.7, 1.25, 1, out);
  fig.userData.dynamic = true; fig.visible = false; fig.renderOrder = 6;
  const glow = BM.M('candleGlow');
  game.life = { bats, fig, mat, glow, glowE: glow.emissive.clone(), glowC: glow.color.clone(), allOnT: 0, seen: 0 };
};

BM.updateLife = function (game, dt, t) {
  const L = game.life; if (!L) return;
  for (const b of L.bats) {
    const a = t * b.w + b.ph, wob = Math.sin(t * 1.3 + b.ph) * 1.6;
    const x = b.hx + Math.cos(a) * (b.r + wob), z = b.hz + Math.sin(a) * (b.r + wob), y = b.h + Math.sin(t * 2.1 + b.ph) * 1.4 + Math.sin(t * 0.37 + b.ph) * 2;
    const M = game.batMeshes, o = M.o, i = L.bats.indexOf(b);
    o.position.set(x, y, z); o.rotation.set(0, -a + (b.w > 0 ? 0 : Math.PI), 0); o.scale.set(0.11, 0.09, 0.2); o.updateMatrix(); M.bodies.setMatrixAt(i, o.matrix);
    const f = Math.sin(t * b.flap + b.ph) * 0.9;
    for (const sd of [-1, 1]) { o.scale.set(sd * 1.7, 1.7, 1.7); o.rotation.set(0, -a + (b.w > 0 ? 0 : Math.PI), 0); o.updateMatrix();
      M.w.rotation.set(0, 0, f); M.w.position.set(0, 0, 0); M.w.scale.set(1, 1, 1); M.w.updateMatrix(); o.matrix.multiply(M.w.matrix); M.wings.setMatrixAt(i * 2 + (sd > 0 ? 1 : 0), o.matrix); }
  }
  if (game.batMeshes) { game.batMeshes.bodies.instanceMatrix.needsUpdate = true; game.batMeshes.wings.instanceMatrix.needsUpdate = true; }
  // every group on the estate panel burning at once: she comes to look
  const s = game.story, grid = game.grid;
  if (!s.allLit && !s.ended && grid.lodge && game.estateGroups.every(([k]) => game.estateGroupOn(k))) {
    const lights = game.estateGroups.flatMap(([k]) => game.estateLights[k]).map(id => grid.light(id)).filter(l => l && !l.dead);
    if (lights.length && lights.every(l => l.powered && l.fraction > 0.9)) L.allOnT += dt; else L.allOnT = 0;
    if (L.allOnT > 2.5) {
      s.allLit = true; L.seen = 0.001;
      game.ui.say('Every light on the estate is burning — the lanes, the gardens, the water, the towers, the stables, the far tower out past the pond. The whole of Blackthorn is lit up in the rain, as if for a party nobody came to. High in the west tower, in the one window that always has a light in it, somebody is standing. A girl. Quite still. Looking out at all of it.', 12);
      game.audio.bell && game.audio.bell(392, 0.12, 0.4, 4);
    }
  }
  if (L.seen > 0) {
    L.seen += dt;
    const k = L.seen < 3 ? L.seen / 3 : L.seen < 26 ? 1 : Math.max(0, 1 - (L.seen - 26) / 2);
    L.fig.visible = k > 0.01; L.mat.opacity = 0.95 * k;
    if (!L.out) L.glow.emissive.copy(L.glowE).multiplyScalar(1 + 1.2 * k);                      // the window brightens behind her
    if (L.seen > 26 && !L.out) {
      L.out = true; const c = grid.light('gable-candle'); if (c) c.on = false;
      L.glow.emissive.setRGB(0, 0, 0); L.glow.color.setRGB(0.03, 0.025, 0.02);
      game.ui.say('The light in the tower window goes out, and the candle in the gable with it. For the first time tonight, every window up there is dark.', 6);
    }
    if (L.seen > 28.5) L.seen = -1;
  }
};
})();
