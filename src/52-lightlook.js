/* ==========================================================================
   BLACKTHORN MANOR — 5b. THE LOOK OF LIGHT
   Only ten real lights exist, so everything else that says "light" is
   faked cheaply and drawn in one go: lit windows glowing from outside with
   a spill on the wall below, pools of light on the ground under every
   outdoor lamp, a halo of lamp colour in the rain, and a hot spot in the
   torch beam. All the glowing quads share one geometry, one texture atlas
   and one draw call; only their colours change from frame to frame.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

/* The atlas: left half a pool of light on wet ground, right half a lit window. */
function glowAtlas() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const rnd = BM.mulberry32(5);
  g.clearRect(0, 0, 512, 256);
  // the pool: a soft disc, broken up by the stones and the wet
  const pool = g.createRadialGradient(128, 128, 0, 128, 128, 126);
  pool.addColorStop(0, 'rgba(255,255,255,0.95)'); pool.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  pool.addColorStop(0.7, 'rgba(255,255,255,0.16)'); pool.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = pool; g.fillRect(0, 0, 256, 256);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 1400; i++) { const r = 1 + rnd() * 3; g.fillStyle = 'rgba(0,0,0,' + (0.15 + rnd() * 0.35) + ')'; g.fillRect(rnd() * 256, rnd() * 256, r, r * 0.6); }
  g.globalCompositeOperation = 'source-over';
  // the window: a warm rectangle with a vignette, curtain folds, a glazing bar
  const win = g.createLinearGradient(256, 0, 512, 0);
  win.addColorStop(0, 'rgba(255,255,255,0.0)'); win.addColorStop(0.08, 'rgba(255,255,255,0.9)'); win.addColorStop(0.92, 'rgba(255,255,255,0.9)'); win.addColorStop(1, 'rgba(255,255,255,0.0)');
  g.fillStyle = win; g.fillRect(256, 0, 256, 256);
  const vert = g.createLinearGradient(0, 0, 0, 256);
  vert.addColorStop(0, 'rgba(0,0,0,0.5)'); vert.addColorStop(0.1, 'rgba(0,0,0,0)'); vert.addColorStop(0.9, 'rgba(0,0,0,0)'); vert.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = vert; g.fillRect(256, 0, 256, 256);
  for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.12 + rnd() * 0.2) + ')'; g.fillRect(256 + 14 + i * 34 + rnd() * 10, 0, 6 + rnd() * 8, 256); }
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(256, 124, 256, 6); g.fillRect(382, 0, 5, 256);
  g.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
const UV_POOL = [0.01, 0.01, 0.49, 0.99], UV_WINDOW = [0.51, 0.01, 0.99, 0.99];

class LightLook {
  constructor(fx, game) {
    this.fx = fx; this.game = game;
    const grid = game.grid, B = game.B, P = game.phys;
    this.quads = []; // { kind, colour hex, scale, ... }
    const pos = [], uv = [], col = [], idx = [];
    const _c = new THREE.Color();
    const quad = (corners, uvr, hex) => {
      const i = pos.length / 3;
      for (const c of corners) pos.push(c[0], c[1], c[2]);
      uv.push(uvr[0], uvr[1], uvr[2], uvr[1], uvr[2], uvr[3], uvr[0], uvr[3]);
      _c.setHex(hex); for (let k = 0; k < 4; k++) col.push(0, 0, 0);
      idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
      return i;
    };

    /* ---- pools of light under every outdoor lamp ---- */
    this.pools = [];
    for (const l of grid.lights) {
      if (l.zone !== 'exterior' || l.circuit === 'car' || l.kind === 'fire' || l.pos.y < 0.4 || l.corona === 0) continue;
      const h = l.pos.y, d = l.dir || [0, -1, 0];
      const r = Math.max(1.4, Math.min(7.5, h * (l.spot ? 1.1 : 0.95)));
      const cx = l.pos.x + (l.spot ? d[0] * h * 0.9 : 0), cz = l.pos.z + (l.spot ? d[2] * h * 0.9 : 0);
      const y = P.support(cx, cz, h) + 0.06;
      const i = quad([[cx - r, y, cz - r], [cx + r, y, cz - r], [cx + r, y, cz + r], [cx - r, y, cz + r]], UV_POOL, l.colour);
      this.pools.push({ l, i, gain: l.kind === 'sodium' ? 0.5 : 0.42 });
    }

    /* ---- lit windows: a glow in the opening, and a spill on the wall below ---- */
    this.windows = [];
    const inside = (w, l) => (l.pos.x - w.x) * w.nx + (l.pos.z - w.z) * w.nz < -0.2;
    for (const w of B.windows) {
      const litBy = [];
      for (const l of grid.lights) {
        if (l.zone !== w.zone || l.kind === 'fire' && l.corona === 0) continue;
        if (w.zone === 'exterior' && l.room !== w.room) continue;
        if (!inside(w, l) || Math.abs(l.pos.y - w.y) > 2.8) continue;
        const dx = l.pos.x - w.x, dz = l.pos.z - w.z, dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 11) continue;
        if (P.occluded(l.pos.x, l.pos.y, l.pos.z, w.x - w.nx * 0.35, w.y, w.z - w.nz * 0.35, 0.25)) continue;
        litBy.push({ l, k: Math.max(0.15, 1 - dist / 11) });
      }
      if (!litBy.length) continue;
      // the pane, just outside the glass, facing out
      const ux = w.nz, uz = -w.nx; // along the wall
      const hw = w.w / 2 - 0.03, hh = w.h / 2 - 0.03, ox = w.x + w.nx * 0.05, oz = w.z + w.nz * 0.05;
      const pane = quad([[ox - ux * hw, w.y - hh, oz - uz * hw], [ox + ux * hw, w.y - hh, oz + uz * hw], [ox + ux * hw, w.y + hh, oz + uz * hw], [ox - ux * hw, w.y + hh, oz - uz * hw]], UV_WINDOW, 0xffd090);
      // the spill: on the outer face of the wall, from the sill downwards
      const sx = w.x + w.nx * 0.215, sz = w.z + w.nz * 0.215, sw = w.w * 0.9, top = w.sill - 0.02, bot = w.sill - 1.5;
      const spill = quad([[sx - ux * sw, bot, sz - uz * sw], [sx + ux * sw, bot, sz + uz * sw], [sx + ux * sw * 0.55, top, sz + uz * sw * 0.55], [sx - ux * sw * 0.55, top, sz - uz * sw * 0.55]], UV_POOL, 0xffd090);
      this.windows.push({ w, litBy, pane, spill });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('colour', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    this.colours = geo.attributes.colour;
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { map: { value: glowAtlas() } },
      vertexShader: 'attribute vec3 colour; varying vec3 vC; varying vec2 vUv; void main(){ vC = colour; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(vC * t.a, 1.0); }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
    this.mesh.userData.dynamic = true; this.mesh.userData.fxOneOff = true; // one shared quad mesh, built once
    fx.scene.add(this.mesh);

    /* ---- the torch's hot spot: a narrow second beam inside the wide one ---- */
    this.hot = new THREE.SpotLight(0xfff2dc, 0, 22, 0.17, 0.8, 2);
    fx.camera.add(this.hot); this.hot.position.set(0.18, -0.12, 0.1);
    this.hot.target = fx.torch.target;
    const coreGeo = new THREE.CylinderGeometry(0.75, 0.04, 12, 16, 1, true);
    coreGeo.translate(0, -6, 0); coreGeo.rotateX(Math.PI / 2);
    this.core = new THREE.Mesh(coreGeo, fx.beam.material.clone());
    this.core.position.copy(fx.beam.position); this.core.rotation.copy(fx.beam.rotation);
    this.core.frustumCulled = false; this.core.userData.dynamic = true; this.core.userData.fxOneOff = true;
    fx.camera.add(this.core);

    this._c = new THREE.Color();
  }

  /* Colour a quad: all four corners the same. */
  paint(i, hex, k) {
    const c = this._c.setHex(hex), a = this.colours.array;
    for (let v = 0; v < 4; v++) { a[(i + v) * 3] = c.r * k; a[(i + v) * 3 + 1] = c.g * k; a[(i + v) * 3 + 2] = c.b * k; }
  }

  update(dt, ctx) {
    const fx = this.fx, grid = this.game.grid, vis = ctx.visibleZones;
    for (const p of this.pools) {
      const l = p.l, k = l.target > 0 && vis[l.zone] ? Math.min(1.5, l.intensity / l.target) * p.gain : 0;
      this.paint(p.i, l.colour, k);
    }
    for (const w of this.windows) {
      let g = 0;
      for (const e of w.litBy) { const l = e.l; if (l.target > 0) g += Math.min(1.3, l.intensity / l.target) * e.k; }
      g = Math.min(1, g);
      if (w.w.curtains && w.w.curtains.t > 0) g *= 1 - 0.7 * w.w.curtains.t; // through drawn curtains, only a dull warm band
      // a lit window is seen from outside only; the pane faces out and the exterior must be drawn
      if (!vis.exterior) g = 0;
      this.paint(w.pane, 0xffd090, g * 0.95);
      this.paint(w.spill, 0xffc880, g * 0.32);
    }
    this.colours.needsUpdate = true;

    // the torch: the hot spot rides with the wide beam
    this.hot.intensity = fx.torch.intensity * 0.6;
    this.core.material.uniforms.level.value = fx.beam.material.uniforms.level.value * 1.6;
    this.core.visible = fx.beam.visible;

    // the rain takes the colour of the nearest lamps
    const u = fx.rain.material.uniforms;
    if (u.lp) {
      const lp = u.lp.value, lc = u.lc.value, lr = u.lr.value;
      for (let i = 0; i < fx.assigned.length; i++) {
        const l = fx.assigned[i];
        if (!l || l.zone !== 'exterior') { lr[i] = 0; continue; }
        lp[i].set(l.pos.x, l.pos.y, l.pos.z);
        this._c.setHex(l.colour); const k = Math.min(1.5, l.intensity / Math.max(0.01, l.target)) * 0.9;
        lc[i].set(this._c.r * k, this._c.g * k, this._c.b * k);
        lr[i] = l.range * 0.9;
      }
    }
  }
}
BM.LightLook = LightLook;
})();
