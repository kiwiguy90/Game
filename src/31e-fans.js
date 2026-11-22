/* ==========================================================================
   BLACKTHORN MANOR — 3e. FANS
   Built from how the real things go together:
   - the ceiling fan: a canopy against the ceiling, a downrod, a ribbed
     motor housing, four pitched wooden paddle blades on curved brass blade
     irons with medallions, a switch housing underneath with a small frosted
     light bowl and two pull chains;
   - the desk fan (a 1950s British oscillating fan): a weighted domed base,
     a neck and yoke, a rounded motor housing behind, four pitched brass
     blades on a hub, front and back wire guards of rings and spokes with a
     maker's badge in the middle. Running, the head turns slowly to and fro.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

/* fold placed copies of simple geometries into one (for the wire guards) */
function merge(parts) {
  const pos = [], nor = [], uv = [], idx = []; let base = 0;
  for (const [geo, m] of parts) {
    const g = geo.index ? geo.clone() : geo.clone(); g.applyMatrix4(m);
    const p = g.attributes.position, n = g.attributes.normal, t = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(t ? t.getX(i) : 0, t ? t.getY(i) : 0); }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base); else for (let i = 0; i < p.count; i++) idx.push(i + base);
    base += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx); out.computeBoundingSphere(); return out;
}
const M4 = (x, y, z, rx, ry, rz, s) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(s || 1, s || 1, s || 1));
const lathe = (key, pts, seg) => BM.statuaryGeo(key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg || 20));

/* ---- shared shapes ---- */
const geo = {
  paddle: () => BM.statuaryGeo('fanPaddle', () => {                 // a wooden paddle blade, 0.62 long, rounded at the tip, narrower at the root
    const s = new THREE.Shape(); s.moveTo(0, -0.045); s.lineTo(0.4, -0.065); s.quadraticCurveTo(0.5, -0.065, 0.5, 0); s.quadraticCurveTo(0.5, 0.065, 0.4, 0.065); s.lineTo(0, 0.045); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g; }),
  iron: () => BM.statuaryGeo('fanIron', () => {                      // a blade iron: a curved brass arm from the hub, dropping a little, out to the blade
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.08, 0, 0), new THREE.Vector3(0.14, -0.035, 0), new THREE.Vector3(0.22, -0.05, 0), new THREE.Vector3(0.3, -0.05, 0)]);
    return new THREE.TubeGeometry(c, 8, 0.012, 6, false); }),
  housing: () => lathe('fanHousing', [[0.001, 0.09], [0.07, 0.085], [0.12, 0.06], [0.135, 0.02], [0.135, -0.02], [0.12, -0.05], [0.08, -0.07], [0.001, -0.07]], 24),
  canopy: () => lathe('fanCanopy', [[0.001, 0], [0.09, 0], [0.085, -0.04], [0.04, -0.07], [0.015, -0.075], [0.001, -0.075]], 18),
  bowl: () => lathe('fanBowl', [[0.001, 0], [0.11, 0], [0.105, -0.05], [0.07, -0.1], [0.02, -0.12], [0.001, -0.12]], 18),
  deskBlade: () => BM.statuaryGeo('deskBlade', () => {               // a broad, swept desk-fan blade
    const s = new THREE.Shape(); s.moveTo(0.015, -0.02); s.quadraticCurveTo(0.09, -0.07, 0.14, -0.035); s.quadraticCurveTo(0.165, 0, 0.13, 0.04); s.quadraticCurveTo(0.08, 0.05, 0.015, 0.02); s.closePath();
    return new THREE.ShapeGeometry(s, 6); }),
  base: () => lathe('deskFanBase', [[0.001, 0], [0.12, 0], [0.125, 0.012], [0.11, 0.03], [0.06, 0.05], [0.025, 0.06], [0.001, 0.062]], 24),
  motor: () => lathe('deskFanMotor', [[0.001, -0.12], [0.035, -0.115], [0.065, -0.09], [0.075, -0.05], [0.07, -0.01], [0.04, 0.01], [0.001, 0.012]], 18),
  guard: () => BM.statuaryGeo('deskFanGuard', () => {                // front and back wire guards: rings and spokes, one geometry
    const parts = [], R = 0.165;
    for (const [z, rr] of [[0.05, [R, 0.11, 0.05]], [-0.03, [R, 0.09]]]) for (const r of rr) parts.push([new THREE.TorusGeometry(r, 0.0035, 4, 32), M4(0, 0, z)]);
    parts.push([new THREE.TorusGeometry(R, 0.006, 4, 36), M4(0, 0, 0.01)]);                                  // the rim that joins them
    const spoke = new THREE.CylinderGeometry(0.0025, 0.0025, 1, 4);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2;
      for (const [z, r0] of [[0.05, 0.02], [-0.03, 0.03]]) { const L = R - r0, m = (r0 + R) / 2;
        parts.push([spoke, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * m, Math.sin(a) * m, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, a - Math.PI / 2)), new THREE.Vector3(1, L, 1))]); }
      // the side wires that bow forward between the rim and the front face
      parts.push([spoke, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0.03), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 0.04, 1))]); }
    return merge(parts); }),
};

/* the ceiling fan. Returns the rotor (turns about y) */
BM.ceilingFan = function (B, x, y, z, ceilingY, opts) {
  opts = opts || {};
  const wood = opts.wood || 'darkWood', metal = opts.metal || 'brass';
  const root = new THREE.Group(); root.position.set(x, y, z); B.root.add(root);
  B.mesh(geo.canopy(), metal, 0, ceilingY - y, 0, 1, 1, 1, 0, root);
  B.mesh(G.post, metal, 0, (ceilingY - y) / 2, 0, 0.022, ceilingY - y - 0.05, 0.022, 0, root);                      // the downrod
  B.mesh(G.cyl, metal, 0, 0.11, 0, 0.05, 0.04, 0.05, 0, root);                                                         // the coupling
  // the switch housing and light kit, which do not turn
  B.mesh(G.cyl, metal, 0, -0.1, 0, 0.11, 0.05, 0.11, 0, root);
  B.mesh(geo.bowl(), 'porcelain', 0, -0.125, 0, 1, 1, 1, 0, root);
  for (const dx of [-0.025, 0.03]) { B.mesh(G.post, metal, dx, -0.26, 0.02, 0.003, 0.26, 0.003, 0, root); B.mesh(G.sphere, metal, dx, -0.4, 0.02, 0.015, 0.02, 0.015, 0, root); }
  // the rotor: the ribbed housing, the irons, the medallions, the blades
  const rotor = new THREE.Group(); root.add(rotor);
  B.mesh(geo.housing(), metal, 0, 0, 0, 1, 1, 1, 0, rotor);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; B.box(metal, Math.cos(a) * 0.136, 0, Math.sin(a) * 0.136, 0.006, 0.05, 0.012, -a, rotor); }   // the ribs
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group(); arm.rotation.y = i * Math.PI / 2; rotor.add(arm);
    B.mesh(geo.iron(), metal, 0, -0.01, 0, 1, 1, 1, 0, arm);
    const blade = B.mesh(geo.paddle(), wood, 0.26, -0.06, 0, 1, 1, 1, 0, arm); blade.rotation.x = 0.2; blade.updateMatrix();   // pitched to push the air down
    B.mesh(G.cyl, metal, 0.3, -0.045, 0, 0.04, 0.012, 0.04, 0, arm);                                                        // the medallion over the screws
  }
  root.traverse(o => { o.userData.dynamic = true; });
  return { root, rotor };
};

/* the desk fan, built in a group whose +z is the way the fan faces. Returns the head (oscillates about y) and the rotor (spins about z) */
BM.deskFan = function (B, g, opts) {
  opts = opts || {};
  const body = opts.body || 'garageGreen';
  B.mesh(geo.base(), body, 0, 0, 0, 1, 1, 1, 0, g);
  B.mesh(G.post, body, 0, 0.1, 0, 0.022, 0.1, 0.022, 0, g);                                                             // the neck
  const head = new THREE.Group(); head.position.set(0, 0.16, 0); g.add(head);
  B.box(body, 0, 0.03, -0.02, 0.06, 0.05, 0.05, 0, head);                                                            // the yoke and the tilt knuckle
  B.mesh(G.cyl, 'chrome', 0.035, 0.05, -0.02, 0.025, 0.015, 0.025, 0, head).rotation.z = Math.PI / 2;
  const hz = 0.13;                                                                                                   // the head's centre, up from the knuckle
  { const m = B.mesh(geo.motor(), body, 0, hz, -0.02, 1, 1, 1, 0, head); m.rotation.x = -Math.PI / 2; m.updateMatrix(); }
  B.mesh(geo.guard(), 'chrome', 0, hz, 0.06, 1, 1, 1, 0, head);
  { const b = B.mesh(G.cyl, 'brass', 0, hz, 0.112, 0.045, 0.008, 0.045, 0, head); b.rotation.x = Math.PI / 2; b.updateMatrix(); }   // the badge
  const rotor = new THREE.Group(); rotor.position.set(0, hz, 0.07); head.add(rotor);
  { const h = B.mesh(G.cyl, 'brass', 0, 0, 0, 0.045, 0.03, 0.045, 0, rotor); h.rotation.x = Math.PI / 2; h.updateMatrix(); }
  if (!BM.deskBladeMat) { BM.deskBladeMat = BM.M('brass').clone(); BM.deskBladeMat.side = THREE.DoubleSide; }
  for (let i = 0; i < 4; i++) { const bl = B.mesh(geo.deskBlade(), BM.deskBladeMat, 0, 0, 0, 1, 1, 1, 0, rotor); bl.rotation.set(0.35, 0, i * Math.PI / 2, 'ZXY'); bl.updateMatrix(); }
  g.traverse(o => { o.userData.dynamic = true; });
  return { head, rotor };
};

/* while a desk fan runs its head sweeps slowly from side to side; switched off, it stops where it is */
BM.updateFans = function (game, dt) {
  for (const a of game.grid.appliances) {
    if (!a.head) continue;
    if (a.running) a.osc = (a.osc || 0) + dt * 0.45;
    a.head.rotation.y = Math.sin(a.osc || 0) * 0.55;
    a.head.updateMatrix && (a.head.matrixAutoUpdate = true);
  }
};
})();
