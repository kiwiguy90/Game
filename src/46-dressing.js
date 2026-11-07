/* ==========================================================================
   BLACKTHORN MANOR — 6e. DRESSING THE HOUSE
   Fifty years of neglect: dust sheets over the furniture, cobwebs in every
   corner, damp coming through the ceilings, wallpaper peeling down in long
   strips, fallen plaster, heavy drapes, candelabras burnt down to stubs.
   And the things people remember about a house like this: a grandfather
   clock, a suit of armour, a stag's head, portraits whose eyes catch the
   light, a piano no one plays, a four-poster bed, dolls, a rocking chair.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

BM.buildDressing = function (B, game) {
  const P = B.phys, rnd = BM.mulberry32(1974);
  B.zone = 'mansion';

  /* rooms: [name, level, x0, x1, z0, z1, floor, ceiling] (inner faces) */
  const R = [
    ['dining', 'ground', -17.8, -6.1, 4.1, 11.8, 0, 4.0], ['drawing', 'ground', 6.1, 17.8, 4.1, 11.8, 0, 4.0],
    ['library', 'ground', 6.1, 17.8, -3.9, 3.9, 0, 4.0], ['back sitting', 'ground', -17.8, -6.1, -3.9, 3.9, 0, 4.0],
    ['kitchen', 'ground', -17.8, -6.1, -11.8, -6.1, 0, 4.0], ['pantry', 'ground', -5.9, -0.1, -11.8, -6.1, 0, 4.0],
    ['bathroom', 'ground', 0.1, 5.9, -11.8, -6.1, 0, 4.0], ['service', 'ground', 6.1, 17.8, -11.8, -6.1, 0, 4.0],
    ['corridor', 'ground', -17.8, 17.8, -5.9, -4.1, 0, 4.0], ['hall', 'ground', -5.9, 5.9, 0.1, 11.8, 0, 8.0],
    ['bedroom1', 'upper', -17.8, -6.1, 4.1, 11.8, 4.2, 8.0], ['bedroom2', 'upper', 6.1, 17.8, 4.1, 11.8, 4.2, 8.0],
    ["eleanor's sitting room", 'upper', -17.8, -6.1, -3.9, 3.9, 4.2, 8.0], ['gallery', 'upper', 6.1, 17.8, -3.9, 3.9, 4.2, 8.0],
    ["eleanor's bedroom", 'upper', -17.8, -6.1, -11.8, -6.1, 4.2, 8.0], ['linen', 'upper', -5.9, 5.9, -11.8, -6.1, 4.2, 8.0],
    ['nursery', 'upper', 6.1, 17.8, -11.8, -6.1, 4.2, 8.0], ['upper corridor', 'upper', -17.8, 17.8, -5.9, -4.1, 4.2, 8.0],
    ['cellar w', 'cellar', -17.8, -6.1, -11.8, 1.8, -3.2, -0.2], ['cellar', 'cellar', -5.9, 5.9, -11.8, 1.8, -3.2, -0.2],
    ['cellar e', 'cellar', 6.1, 17.8, -11.8, 1.8, -3.2, -0.2],
  ];

  /* ---- cobwebs in the ceiling corners of every room ---- */
  const web = (x, y, z, tx, ty, tz, s) => {
    const m = new THREE.Mesh(G.plane, BM.M('cobweb'));
    m.position.set(x, y, z); m.scale.set(s, s, s);
    m.lookAt(tx, ty, tz);
    m.matrixAutoUpdate = false; m.updateMatrix();
    m.userData.instanceOK = true;
    B.root.add(m);
    return m;
  };
  let webs = 0;
  for (const [, , x0, x1, z0, z1, , c] of R) {
    for (const [cx, cz, sx, sz] of [[x0, z0, 1, 1], [x1, z0, -1, 1], [x0, z1, 1, -1], [x1, z1, -1, -1]]) {
      if (rnd() < 0.15) continue;
      const s = 0.8 + rnd() * 0.7;
      web(cx + sx * s * 0.32, c - s * 0.32, cz + sz * s * 0.32, cx + sx * 3, c - 3, cz + sz * 3, s);
      webs++;
    }
  }
  // the attic is thick with them, strung between the rafters
  for (let i = 0; i < 26; i++) {
    const x = -16 + rnd() * 32, z = (rnd() < 0.5 ? -1 : 1) * (2 + rnd() * 4), y = 8.2 + 2.6 - Math.abs(z) * 0.18;
    web(x, y, z, x + (rnd() - 0.5) * 4, y - 2, 0, 1 + rnd()); webs++;
  }

  /* ---- damp through the ceilings, wallpaper peeling in strips, fallen plaster ---- */
  for (const [name, , x0, x1, z0, z1, f, c] of R) {
    if (/cellar/.test(name)) continue;
    const n = name === 'hall' ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const side = Math.floor(rnd() * 4), t = 0.2 + rnd() * 0.6;
      const w = 0.7 + rnd() * 1.2, h = 0.5 + rnd() * 0.8, y = c - h / 2 - 0.05;
      let x, z, ry;
      if (side === 0) { x = x0 + (x1 - x0) * t; z = z0 + 0.012; ry = 0; }
      else if (side === 1) { x = x0 + (x1 - x0) * t; z = z1 - 0.012; ry = Math.PI; }
      else if (side === 2) { x = x0 + 0.012; z = z0 + (z1 - z0) * t; ry = Math.PI / 2; }
      else { x = x1 - 0.012; z = z0 + (z1 - z0) * t; ry = -Math.PI / 2; }
      const st = B.mesh(G.plane, 'damp', x, y, z, w, h, 1, ry); st.userData.instanceOK = true;
      // the stain on the ceiling above it
      B.mesh(G.ground, 'damp', x + Math.sin(ry) * 0.5, c - 0.012, z + Math.cos(ry) * 0.5, w * 1.2, 1, 1.1, ry).userData.instanceOK = true;
      // a strip of wallpaper hanging away from the wall
      if (name !== 'kitchen' && name !== 'pantry' && name !== 'bathroom' && name !== 'service') {
        const len = 0.6 + rnd() * 0.5, peel = B.box('peel', x + Math.sin(ry) * 0.06 + Math.cos(ry) * (w * 0.3), c - 0.15 - len / 2, z + Math.cos(ry) * 0.06 - Math.sin(ry) * (w * 0.3), 0.32, len, 0.006, ry);
        peel.rotation.set(0.18 + rnd() * 0.2, ry, (rnd() - 0.5) * 0.3, 'YXZ'); peel.updateMatrix();
      }
      // plaster fallen on the floor beneath
      for (let k = 0; k < 4; k++) B.box('plaster', x + Math.sin(ry) * (0.3 + rnd() * 0.5) + (rnd() - 0.5) * 0.6, f + 0.03, z + Math.cos(ry) * (0.3 + rnd() * 0.5) + (rnd() - 0.5) * 0.6, 0.1 + rnd() * 0.15, 0.05, 0.08 + rnd() * 0.12, rnd() * 3);
    }
  }

  /* ---- dust sheets over the furniture (fitted to each piece's collision box) ---- */
  const sheet = new Set(['piano', 'tea chest', 'hall chest']);
  const sheetOver = (f) => {
    const w = f.x1 - f.x0, d = f.z1 - f.z0, h = f.y1 - f.y0;
    B.box('dustSheet', (f.x0 + f.x1) / 2, f.y0 + h / 2, (f.z0 + f.z1) / 2, w + 0.08, h + 0.03, d + 0.08);
    B.mesh(G.sphere, 'dustSheet', (f.x0 + f.x1) / 2, f.y1, (f.z0 + f.z1) / 2, w * 1.02, 0.28, d * 1.02);
  };

  /* ---- the grand piano in the drawing room, under its sheet ---- */
  B.room = 'drawing'; B.levelName = 'ground';
  B.furniture(null, 10.2, 5.4, 0, 1.5, 1.0, 1.8, 'piano');
  for (const [dx, dz] of [[-0.6, -0.75], [0.6, -0.75], [0, 0.75]]) B.mesh(G.post, 'piano', 10.2 + dx, 0.3, 5.4 + dz, 0.08, 0.6, 0.08);
  B.mesh(G.post, 'piano', 10.2, 0.25, 5.0, 0.04, 0.5, 0.04);
  for (const f of P.furniture) if (sheet.has(f.tag)) sheetOver(f);

  /* ---- the stag's head over the drawing room fire ---- */
  { const x = 15.5, y = 3.35, z = 4.13;
    B.box('darkWood', x, y, z + 0.03, 0.5, 0.6, 0.06);
    B.mesh(G.sphere, 'bark', x, y - 0.05, z + 0.22, 0.32, 0.36, 0.38);
    B.mesh(G.sphere, 'bark', x, y - 0.18, z + 0.5, 0.18, 0.18, 0.36);
    for (const h of [-1, 1]) {
      let p = [x + h * 0.1, y + 0.12, z + 0.25];
      for (let k = 0; k < 4; k++) {
        const q = [p[0] + h * 0.16, p[1] + 0.14, p[2] + 0.02];
        B.mesh(G.post, 'fungusStem', (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2, 0.035, 0.22, 0.035).rotation.z = -h * 0.85;
        B.root.children[B.root.children.length - 1].updateMatrix();
        B.mesh(G.post, 'fungusStem', q[0], q[1] + 0.09, q[2], 0.025, 0.16, 0.025);
        p = q;
      }
    }
  }

  /* ---- candelabras, burnt down to stubs ---- */
  const candelabra = (x, y, z, arms) => {
    B.mesh(G.cyl, 'brass', x, y + 0.02, z, 0.18, 0.04, 0.18);
    B.mesh(G.post, 'brass', x, y + 0.25, z, 0.04, 0.46, 0.04);
    B.box('brass', x, y + 0.46, z, 0.5, 0.03, 0.03);
    for (let i = 0; i < arms; i++) {
      const dx = (i - (arms - 1) / 2) * 0.24, h = 0.04 + rnd() * 0.14;
      B.mesh(G.cyl, 'brass', x + dx, y + 0.49, z, 0.07, 0.03, 0.07);
      B.mesh(G.cyl, 'wax', x + dx, y + 0.5 + h / 2, z, 0.045, h, 0.045);
      B.mesh(G.cyl, 'wax', x + dx + 0.03, y + 0.47, z, 0.03, 0.08, 0.03); // a drip
    }
  };
  candelabra(-13.2, 0.78, 8, 3); candelabra(-10.8, 0.78, 8, 3);
  candelabra(14.7, 1.42, 4.45, 3); candelabra(16.3, 1.42, 4.45, 3);
  B.levelName = 'upper'; candelabra(-9.9, 5.0, 4.4, 3); B.levelName = 'ground';

  /* ---- the hall: grandfather clock, suit of armour, portraits ---- */
  B.room = 'hall';
  { const x = -5.55, z = 8.4;
    B.furniture('darkWood', x, z, 0, 0.6, 2.3, 0.6, 'grandfather clock');
    B.box('gilt', x + 0.31, 1.95, z, 0.02, 0.5, 0.5);
    B.mesh(G.disc, 'paper', x + 0.33, 1.95, z, 0.42, 0.42, 1, Math.PI / 2);
    B.box('black', x + 0.34, 1.97, z - 0.04, 0.01, 0.16, 0.02);   // stopped
    B.box('black', x + 0.34, 2.0, z + 0.03, 0.01, 0.2, 0.015);
    B.box('darkGlass', x + 0.31, 1.05, z, 0.02, 0.9, 0.3);
    B.mesh(G.cyl, 'brass', x + 0.27, 0.85, z, 0.16, 0.02, 0.16).rotation.z = Math.PI / 2;
    B.root.children[B.root.children.length - 1].updateMatrix();
    B.mesh(G.pyramid, 'darkWood', x, 2.45, z, 0.62, 0.3, 0.62);
  }
  const armour = (x, y, z, ang, room) => {
    B.room = room;
    B.furniture(null, x, z, y, 0.55, 1.9, 0.55, 'suit of armour');
    B.box('gothicStone', x, y + 0.05, z, 0.6, 0.1, 0.6);
    for (const h of [-1, 1]) B.mesh(G.post, 'armour', x + Math.cos(ang) * 0.12 * h, y + 0.5, z - Math.sin(ang) * 0.12 * h, 0.13, 0.8, 0.13);
    B.mesh(G.cyl, 'armour', x, y + 1.2, z, 0.44, 0.65, 0.32, ang);
    B.mesh(G.sphere, 'armour', x, y + 1.48, z, 0.52, 0.22, 0.36, ang);
    for (const h of [-1, 1]) B.mesh(G.post, 'armour', x + Math.cos(ang) * 0.3 * h, y + 1.15, z - Math.sin(ang) * 0.3 * h, 0.1, 0.65, 0.1);
    B.mesh(G.sphere, 'armour', x, y + 1.72, z, 0.26, 0.3, 0.28);
    B.box('black', x + Math.sin(ang) * 0.13, y + 1.74, z + Math.cos(ang) * 0.13, 0.16, 0.025, 0.02, ang);
    B.mesh(G.post, 'darkWood', x + Math.cos(ang) * 0.38, y + 1.1, z - Math.sin(ang) * 0.38, 0.04, 2.2, 0.04);
    B.mesh(G.wedge, 'armour', x + Math.cos(ang) * 0.38, y + 2.15, z - Math.sin(ang) * 0.38, 0.02, 0.35, 0.22, ang);
  };
  armour(-1.95, 0, 11.35, Math.PI, 'hall');
  B.levelName = 'upper'; armour(3.6, 4.2, 0.45, 0, 'hall'); B.levelName = 'ground';
  const portrait = (x, y, z, ry, w, h, style) => B.picture(x, y, z, ry, w, h, style || 'portrait');
  portrait(-5.88, 2.6, 5.9, Math.PI / 2, 1.0, 1.4);
  portrait(5.88, 2.6, 5.9, -Math.PI / 2, 1.0, 1.4);
  B.levelName = 'upper';
  portrait(-3.6, 6.3, 0.12, 0, 0.9, 1.2); portrait(3.6, 6.6, 0.12, 0, 0.9, 1.2);
  portrait(-15.5, 6.3, 4.12, 0, 1.0, 1.3, 'landscape');        // bedroom 1
  portrait(-17.88, 6.3, -11.0, Math.PI / 2, 0.7, 0.9); // eleanor's bedroom: a child's portrait
  B.levelName = 'ground';
  portrait(-15.6, 2.5, 4.12, 0, 1.2, 0.9, 'house');         // dining
  portrait(-8.5, 2.4, -3.88, 0, 1.1, 0.8, 'stilllife');         // back sitting

  function roomAt(w) { const r = R.find(q => w.x > q[2] - 0.6 && w.x < q[3] + 0.6 && w.z > q[4] - 0.6 && w.z < q[5] + 0.6 && w.y > q[6] && w.y < q[7]); return r ? r[0] : ''; }

  /* ---- bedroom 1: a four-poster ---- */
  B.levelName = 'upper'; B.room = 'bedroom1';
  for (const [x, z] of [[-13.0, 8.5], [-11.0, 8.5], [-13.0, 11.3], [-11.0, 11.3]]) B.mesh(G.post, 'darkWood', x, 4.2 + 1.2, z, 0.12, 2.4, 0.12);
  B.boxE('darkWood', -13.06, -10.94, 6.55, 6.65, 8.44, 11.36);
  for (const [x, z, sx, sz] of [[-13.0, 9.9, 0.06, 2.8], [-11.0, 9.9, 0.06, 2.8], [-12.0, 8.5, 2.0, 0.06]]) {
    const d = B.box('drape', x, 5.55, z, sx, 2.0, sz); d.rotation.set(0.05 * (rnd() - 0.5), 0, 0.04 * (rnd() - 0.5)); d.updateMatrix();
  }

  /* ---- the nursery: a rocking chair that rocks, and dolls ---- */
  B.room = 'nursery';
  const rock = new THREE.Group(); rock.position.set(10.0, 4.2, -8.5); rock.rotation.y = 0.6; B.root.add(rock);
  for (const h of [-0.28, 0.28]) { B.box('darkWood', h, 0.05, 0, 0.05, 0.08, 1.0, 0, rock); }
  B.box('darkWood', 0, 0.45, 0, 0.6, 0.06, 0.55, 0, rock);
  B.box('darkWood', 0, 0.95, 0.27, 0.6, 1.0, 0.05, 0, rock);
  for (const h of [-0.28, 0.28]) { B.mesh(G.post, 'darkWood', h, 0.65, -0.22, 0.04, 0.4, 0.04, 0, rock); }
  // a doll sits in it
  B.mesh(G.cone, 'dollDress', 0, 0.62, -0.02, 0.32, 0.36, 0.28, 0, rock);
  B.mesh(G.sphere, 'doll', 0, 0.9, -0.02, 0.2, 0.22, 0.2, 0, rock);
  for (const e of [-1, 1]) B.mesh(G.sphere, 'black', e * 0.045, 0.93, -0.11, 0.03, 0.03, 0.02, 0, rock);
  rock.traverse(o => { o.userData.dynamic = true; });
  B.furniture(null, 10.0, -8.5, 4.2, 0.8, 1.2, 0.8, 'rocking chair');
  game.rockers = [{ obj: rock }];
  const doll = (x, y, z, ry) => {
    B.mesh(G.cone, 'dollDress', x, y + 0.13, z, 0.26, 0.26, 0.22, ry);
    B.mesh(G.sphere, 'doll', x, y + 0.33, z, 0.17, 0.18, 0.17, ry);
    for (const e of [-1, 1]) B.mesh(G.sphere, 'black', x + Math.cos(ry) * e * 0.04 + Math.sin(ry) * 0.075, y + 0.35, z - Math.sin(ry) * e * 0.04 + Math.cos(ry) * 0.075, 0.025);
  };
  doll(15.3, 5.1, -10.5, -0.4);    // in the cot
  doll(13.0, 4.2, -6.9, Math.PI);  // on the floor, facing the door
  B.room = "eleanor's bedroom";
  doll(-15.6, 4.8, -9.3, 0.4);
  B.room = 'attic'; B.levelName = 'attic';
  doll(-5.6, 8.2, 3.6, -0.6);

  /* ---- the cellar: barrels; the attic: stacked frames ---- */
  B.levelName = 'cellar'; B.room = 'cellar e';
  for (const [x, z] of [[17.2, 0.9], [16.35, 1.1], [17.2, 0.05]]) {
    B.furniture(null, x, z, -3.2, 0.78, 1.0, 0.78, 'barrel');
    B.mesh(G.cyl, 'wood', x, -2.7, z, 0.8, 1.0, 0.8);
    for (const y of [-3.0, -2.4]) B.mesh(G.cyl, 'iron', x, y, z, 0.82, 0.05, 0.82);
  }
  B.levelName = 'attic'; B.room = 'attic';
  for (let i = 0; i < 4; i++) { const f = B.box('gilt', 9.5 + i * 0.12, 8.2 + 0.55, -3.2, 0.06, 1.1 - i * 0.12, 0.9 - i * 0.1); f.rotation.z = -0.25; f.updateMatrix(); }

  game.dressing = { webs };
};
})();
