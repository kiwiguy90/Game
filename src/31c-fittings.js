/* ==========================================================================
   BLACKTHORN MANOR — 3c. LIGHT FITTINGS
   The fittings themselves, made properly: a ceiling rose, a flex and an
   opal-glass tulip shade for a pendant; a brass chandelier with eight
   candle arms and glass drops; a sconce with a backplate, a curved arm and
   a little silk shade; coach lanterns with glass panes on iron brackets;
   cast-iron lamp posts; caged bulkheads; turned table lamps. The glass and
   the shades glow with the light they hold, so a lit fitting reads as lit
   from across a room and an unlit one is plain glass and cloth.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const V = (x, y) => new THREE.Vector2(x, y);
const cache = {};
const geo = (k, f) => { if (!cache[k]) { cache[k] = f(); cache[k].userData.canonical = 'fitting:' + k; } return cache[k]; };
// a profile drawn downwards would turn its faces inwards: always lathe it bottom to top
const lathe = (k, pts, seg) => geo(k, () => { const q = pts[0][1] > pts[pts.length - 1][1] ? pts.slice().reverse() : pts; const g = new THREE.LatheGeometry(q.map(p => V(p[0], p[1])), seg || 16); g.computeVertexNormals(); return g; });

const _u = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
function rod(B, mat, a, b, r) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _d.length(); if (len < 1e-3) return null; _d.divideScalar(len);
  const m = B.mesh(G.post, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, r * 2, len, r * 2);
  m.quaternion.copy(_q.setFromUnitVectors(_u, _d)); m.updateMatrix();
  return m;
}
/* Glass and cloth that glow with their light: one material per fitting, lit from the record by the effects pass. */
function glowing(rec, hex, shin) {
  const m = new THREE.MeshPhongMaterial({ color: hex, shininess: shin || 30, specular: 0x222222, side: THREE.DoubleSide });
  (rec.glass || (rec.glass = [])).push(m);
  return m;
}
const bulbMat = () => new THREE.MeshBasicMaterial({ color: 0x15110c });
function dyn(m) { m.userData.dynamic = true; return m; }

/* Returns the bulb size the builder should add itself (0 when the fitting made its own), or undefined to fall back. */
BM.drawFitting = function (B, style, o, rec) {
  const [x, y, z] = o.pos, nx = o.nx || 0, nz = o.nz || 0;
  const ceilingOf = () => o.ceiling || Math.ceil((y + 0.6) / 4) * 4;
  switch (style) {
    case 'pendant': {
      const c = ceilingOf();
      B.mesh(lathe('rose', [[0.001, 0], [0.13, 0], [0.12, -0.02], [0.08, -0.035], [0.03, -0.05], [0.001, -0.05]], 20), 'plaster', x, c, z, 1, 1, 1);
      B.mesh(G.post, 'black', x, (c - 0.05 + y + 0.24) / 2, z, 0.01, c - 0.05 - (y + 0.24), 0.01);       // the flex
      B.mesh(lathe('gallery', [[0.02, 0.06], [0.035, 0.05], [0.045, 0.0], [0.06, -0.02], [0.001, -0.02]], 14), 'brass', x, y + 0.22, z, 1, 1, 1);
      const shade = glowing(rec, 0xf3ede0, 60);                                                                // an opal glass tulip
      B.mesh(lathe('tulip', [[0.055, 0.2], [0.07, 0.17], [0.11, 0.1], [0.15, 0.03], [0.175, -0.01], [0.185, -0.02], [0.17, -0.012]], 24), shade, x, y, z, 1, 1, 1);
      rec.bulb = dyn(B.mesh(G.lowSphere, bulbMat(), x, y + 0.04, z, 0.08, 0.1, 0.08));
      return 0;
    }
    case 'chandelier': {
      const c = ceilingOf(), r = 0.58, bm = bulbMat();
      B.mesh(lathe('canopy', [[0.001, 0], [0.16, 0], [0.12, -0.05], [0.04, -0.1], [0.001, -0.1]], 18), 'brass', x, c, z, 1, 1, 1);
      B.mesh(G.post, 'brass', x, (c - 0.1 + y + 0.45) / 2, z, 0.02, c - 0.1 - (y + 0.45), 0.02);                   // the chain
      B.mesh(lathe('stem', [[0.03, 0.45], [0.05, 0.4], [0.035, 0.32], [0.06, 0.22], [0.045, 0.12], [0.1, 0.02], [0.14, -0.04], [0.12, -0.1], [0.05, -0.16], [0.02, -0.24], [0.001, -0.26]], 18), 'brass', x, y, z, 1, 1, 1);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        rod(B, 'brass', [x + ca * 0.1, y - 0.04, z + sa * 0.1], [x + ca * (r - 0.06), y - 0.12, z + sa * (r - 0.06)], 0.012);
        rod(B, 'brass', [x + ca * (r - 0.06), y - 0.12, z + sa * (r - 0.06)], [x + ca * r, y + 0.0, z + sa * r], 0.012);
        B.mesh(lathe('cup', [[0.001, 0], [0.06, 0.0], [0.065, 0.015], [0.03, 0.02], [0.025, 0.04], [0.001, 0.04]], 12), 'brass', x + ca * r, y, z + sa * r, 1, 1, 1);
        B.mesh(G.cyl, 'porcelain', x + ca * r, y + 0.09, z + sa * r, 0.035, 0.1, 0.035);                       // the candle sleeve
        const flame = dyn(B.mesh(G.lowSphere, bm, x + ca * r, y + 0.175, z + sa * r, 0.05, 0.1, 0.05)); // a candle bulb, flame-shaped
        if (!i) rec.bulb = flame;
        // a glass drop hanging between the arms
        const b = a + Math.PI / 8;
        B.mesh(G.cone, 'glass', x + Math.cos(b) * (r - 0.15), y - 0.24, z + Math.sin(b) * (r - 0.15), 0.04, -0.09, 0.04);
      }
      B.mesh(G.cone, 'glass', x, y - 0.33, z, 0.07, -0.14, 0.07);
      return 0;
    }
    case 'sconce': {
      // a brass backplate on the wall, an arm curving up, a candle cup and a small silk shade
      const wx = x - nx * 0.13, wz = z - nz * 0.13;
      const bp = B.mesh(lathe('backplate', [[0.001, 0], [0.055, 0], [0.06, 0.012], [0.04, 0.025], [0.001, 0.025]], 16), 'brass', wx, y - 0.16, wz, 1, 2.0, 1);
      bp.rotation.set(nz ? Math.PI / 2 * nz : 0, 0, nx ? -Math.PI / 2 * nx : 0); bp.updateMatrix();
      rod(B, 'brass', [wx + nx * 0.02, y - 0.16, wz + nz * 0.02], [x - nx * 0.03, y - 0.13, z - nz * 0.03], 0.011);
      rod(B, 'brass', [x - nx * 0.03, y - 0.13, z - nz * 0.03], [x, y - 0.06, z], 0.011);
      B.mesh(geo('cupS', () => lathe('cup', [[0.001, 0], [0.06, 0.0], [0.065, 0.015], [0.03, 0.02], [0.025, 0.04], [0.001, 0.04]], 12)), 'brass', x, y - 0.06, z, 0.8, 0.8, 0.8);
      B.mesh(G.cyl, 'porcelain', x, y - 0.01, z, 0.03, 0.08, 0.03);
      const opal = glowing(rec, 0xf1e9d8, 60);                      // a frosted tulip, mouth up
      B.mesh(lathe('tulipUp', [[0.035, -0.02], [0.05, 0.0], [0.085, 0.06], [0.115, 0.13], [0.13, 0.16], [0.125, 0.165]], 20), opal, x, y - 0.02, z, 1, 1, 1);
      rec.bulb = dyn(B.mesh(G.lowSphere, bulbMat(), x, y + 0.05, z, 0.06, 0.08, 0.06));
      return 0;
    }
    case 'lamp': {
      // a table lamp: a turned brass column and a pleated drum shade
      B.mesh(lathe('lampBase', [[0.001, 0], [0.1, 0], [0.1, 0.02], [0.06, 0.04], [0.03, 0.08], [0.025, 0.2], [0.045, 0.26], [0.02, 0.36], [0.015, 0.42], [0.001, 0.42]], 16), 'brass', x, y - 0.5, z, 1, 1, 1);
      const shade = glowing(rec, 0xe8d6b0, 4);
      B.mesh(lathe('drum', [[0.12, 0.16], [0.13, 0.15], [0.19, -0.02], [0.185, -0.03]], 20), shade, x, y - 0.04, z, 1, 1, 1);
      rec.bulb = dyn(B.mesh(G.lowSphere, bulbMat(), x, y - 0.02, z, 0.07));
      return 0;
    }
    case 'lantern': case 'street': {
      // a coach lantern: an iron frame round four glass panes, a cap, a finial; on a bracket from the wall or atop a post
      const ln = new THREE.Group(); ln.position.set(x, y, z); B.root.add(ln);
      const S = style === 'street' ? 1.35 : 1;
      ln.scale.setScalar(S);
      const pane = glowing(rec, 0xf2e2b8, 80);
      B.mesh(lathe('lanternGlass', [[0.1, -0.16], [0.13, 0.14]], 4), pane, 0, 0, 0, 1, 1, 1, Math.PI / 4, ln);
      for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; B.box('iron', Math.cos(a) * 0.115 * 1.414 / 1.414, 0, Math.sin(a) * 0.115, 0.018, 0.32, 0.018, 0, ln); }
      B.mesh(G.pyramid, 'iron', 0, 0.21, 0, 0.36, 0.14, 0.36, 0, ln);
      B.box('iron', 0, 0.145, 0, 0.3, 0.025, 0.3, 0, ln);
      B.box('iron', 0, -0.17, 0, 0.22, 0.03, 0.22, 0, ln);
      B.mesh(G.sphere, 'iron', 0, 0.31, 0, 0.05, 0.05, 0.05, 0, ln);
      B.mesh(lathe('lanternFoot', [[0.001, 0], [0.06, 0], [0.03, -0.06], [0.012, -0.1], [0.001, -0.1]], 10), 'iron', 0, -0.18, 0, 1, 1, 1, 0, ln);
      rec.bulb = dyn(B.mesh(G.lowSphere, bulbMat(), 0, 0.0, 0, 0.09, 0.12, 0.09, 0, ln));
      if (style === 'street') {
        // a fluted cast-iron post with a base, a collar and a ladder bar
        B.mesh(lathe('postBase', [[0.001, 0], [0.2, 0], [0.2, 0.08], [0.15, 0.14], [0.13, 0.5], [0.09, 0.62], [0.001, 0.62]], 12), 'iron', x, 0, z, 1, 1, 1);
        B.mesh(G.post, 'iron', x, (0.62 + y - 0.36) / 2, z, 0.1, y - 0.36 - 0.62, 0.1);
        B.mesh(lathe('collar', [[0.001, 0], [0.08, 0], [0.11, 0.04], [0.06, 0.08], [0.001, 0.08]], 12), 'iron', x, y - 0.38, z, 1, 1, 1);
        B.box('iron', x, y - 0.55, z, 0.5, 0.03, 0.03);
      } else if (nx || nz) {
        // a scrolled bracket from the wall
        rod(B, 'iron', [x - nx * 0.32, y + 0.12, z - nz * 0.32], [x, y + 0.3, z], 0.015);
        rod(B, 'iron', [x - nx * 0.32, y - 0.1, z - nz * 0.32], [x - nx * 0.05, y + 0.27, z - nz * 0.05], 0.012);
        B.box('iron', x - nx * 0.33, y + 0.0, z - nz * 0.33, nz ? 0.1 : 0.02, 0.32, nx ? 0.1 : 0.02);
      }
      return 0;
    }
    case 'cage': {
      // a bare bulb in a wire cage under a cast cap: cellars and outbuildings
      B.mesh(lathe('cageCap', [[0.001, 0.06], [0.05, 0.06], [0.1, 0.02], [0.11, 0.0], [0.001, 0.0]], 14), 'metalDark', x, y + 0.12, z, 1, 1, 1);
      const glass = glowing(rec, 0xd8dcd0, 90);
      B.mesh(lathe('cageGlass', [[0.08, 0.12], [0.09, 0.05], [0.08, -0.04], [0.04, -0.09], [0.001, -0.1]], 14), glass, x, y, z, 1, 1, 1);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; const w = B.box('iron', x, y + 0.01, z, 0.006, 0.22, 0.2); w.rotation.y = a; w.updateMatrix(); }
      B.mesh(G.ring, 'iron', x, y - 0.03, z, 0.22, 0.22, 0.22).rotation.x = -Math.PI / 2;
      rec.bulb = dyn(B.mesh(G.lowSphere, bulbMat(), x, y + 0.01, z, 0.07, 0.09, 0.07));
      return 0;
    }
    case 'bulkhead': {
      // an oval cast bulkhead on the wall: a ribbed frame over ribbed glass
      const g = new THREE.Group(); g.position.set(x - nx * 0.06, y, z - nz * 0.06); g.rotation.y = Math.atan2(nx, nz); B.root.add(g);
      B.box('metalDark', 0, 0, -0.03, 0.34, 0.22, 0.05, 0, g);
      const glass = glowing(rec, 0xe8e6da, 70);
      const dome = B.mesh(G.sphere, glass, 0, 0, 0.0, 0.28, 0.17, 0.1, 0, g);
      for (const yy of [-0.04, 0, 0.04]) B.box('metalDark', 0, yy, 0.05, 0.27, 0.012, 0.012, 0, g);
      B.box('metalDark', 0, 0, 0.05, 0.012, 0.15, 0.012, 0, g);
      rec.bulb = dyn(B.mesh(G.lowSphere, bulbMat(), 0, 0, 0.0, 0.08, 0.06, 0.04, 0, g));
      void dome;
      return 0;
    }
  }
  return undefined;
};
/* A looking-glass, old and foxed: pale silvering with dark spots and a cloudy edge, shiny enough to catch the lamps. */
let mirrorMat = null;
BM.mirrorGlass = function () {
  if (mirrorMat) return mirrorMat;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'), rnd = BM.mulberry32(41);
  const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#9aa4aa'); gr.addColorStop(0.5, '#6c767c'); gr.addColorStop(1, '#8a9298'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const edge = g.createRadialGradient(64, 64, 30, 64, 64, 92); edge.addColorStop(0, 'rgba(40,36,30,0)'); edge.addColorStop(1, 'rgba(40,36,30,0.75)'); g.fillStyle = edge; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(30,26,20,' + (0.2 + rnd() * 0.5) + ')'; g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 0.5 + rnd() * rnd() * 4, 0, 6.3); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 6; g.beginPath(); g.moveTo(10, 118); g.lineTo(118, 10); g.stroke();
  const t = new THREE.CanvasTexture(c);
  mirrorMat = new THREE.MeshPhongMaterial({ map: t, color: 0xffffff, shininess: 140, specular: 0xdddddd });
  return mirrorMat;
};
/* Soft-edged damp: a stain that fades out at its edges. */
BM.softenDamp = function () {
  const m = BM.M('damp'); if (m.alphaMap) return;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'), rnd = BM.mulberry32(7);
  const gr = g.createRadialGradient(32, 26, 4, 32, 32, 31); gr.addColorStop(0, '#fff'); gr.addColorStop(0.55, '#999'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,' + rnd() * 0.4 + ')'; g.beginPath(); g.arc(rnd() * 64, rnd() * 64, 2 + rnd() * 6, 0, 6.3); g.fill(); }
  m.alphaMap = new THREE.CanvasTexture(c); m.opacity = 0.6; m.needsUpdate = true;
};
})();
