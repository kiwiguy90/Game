/* ==========================================================================
   BLACKTHORN MANOR — 3. BUILDING BLOCKS
   One canonical geometry per primitive; size is always mesh.scale so the
   start-up pass can de-duplicate and instance. Materials map textures in
   world space so scaled boxes never stretch their texture.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

/* ---------------- canonical geometry ---------------- */
const G = BM.G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  post: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  sphere: new THREE.SphereGeometry(0.5, 14, 10),
  lowSphere: new THREE.SphereGeometry(0.5, 7, 5),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  plane: new THREE.PlaneGeometry(1, 1),
  disc: new THREE.CircleGeometry(0.5, 24),
  ring: new THREE.RingGeometry(0.42, 0.5, 32),
};
G.ground = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
/* A wedge (triangular prism): length along x, base width along z, apex at the
   top. Base sits at y = 0. Gables, steep roofs and pointed arches. */
G.wedge = (function () {
  const A = [-0.5, 0, -0.5], B = [-0.5, 0, 0.5], C = [-0.5, 1, 0], D = [0.5, 0, -0.5], E = [0.5, 0, 0.5], F = [0.5, 1, 0];
  const tris = [A, B, C, D, F, E, B, E, F, B, F, C, A, C, F, A, F, D, A, D, E, A, E, B];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([].concat(...tris), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(tris.length * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
})();
G.pyramid = new THREE.ConeGeometry(0.5, 1, 4).rotateY(Math.PI / 4);   // square spires, pinnacles
G.spire = new THREE.ConeGeometry(0.5, 1, 8).rotateY(Math.PI / 8);     // octagonal tower spires
/* A grass blade: one tapering triangle, base on the ground, tip at y = 1 (drawn from both sides). */
G.blade = (function () { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.08, 1, 0, 0.5, 0, 0, -0.5, 0, 0, 0.08, 1, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0.25, 0, 1, 0.25, 0, 1, 0.25, 0, 1, -0.25, 0, 1, -0.25, 0, 1, -0.25], 3)); return g; })(); // both faces, lit like the ground
for (const k in G) G[k].userData.canonical = k;

/* ---------------- procedural textures ---------------- */
function canvasTex(size, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const rnd = BM.mulberry32(size * 7 + draw.length);
  draw(g, size, rnd);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function speckle(g, s, rnd, base, vary, n, sz) {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  for (let i = 0; i < n; i++) {
    const v = (rnd() - 0.5) * vary;
    g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')';
    g.fillRect(rnd() * s, rnd() * s, sz * (0.5 + rnd()), sz * (0.5 + rnd()));
  }
}
const TEX = {};
function tex(name) {
  if (TEX[name]) return TEX[name];
  let t;
  switch (name) {
    case 'plaster': t = canvasTex(128, (g, s, r) => speckle(g, s, r, '#cfc4b0', 0.12, 900, 3)); break;
    case 'wallpaper': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#7a5a48', 0.08, 500, 2);
      g.strokeStyle = 'rgba(230,200,150,0.35)'; g.lineWidth = 2;
      for (let x = 0; x < s; x += 32) { g.beginPath(); for (let y = 0; y <= s; y += 4) g.lineTo(x + 16 + Math.sin(y / 10) * 8, y); g.stroke(); }
      for (let y = 16; y < s; y += 32) for (let x = 0; x < s; x += 32) { g.fillStyle = 'rgba(240,210,160,0.3)'; g.beginPath(); g.arc(x + 16, y, 4, 0, 7); g.fill(); }
    }); break;
    case 'panel': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#4a2e1c', 0.1, 600, 2);
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 3; g.strokeRect(10, 10, s - 20, s - 20);
      g.strokeStyle = 'rgba(255,220,170,0.12)'; g.strokeRect(14, 14, s - 28, s - 28);
    }); break;
    case 'floorboards': t = canvasTex(128, (g, s, r) => {
      for (let i = 0; i < 8; i++) { const v = 70 + r() * 30; g.fillStyle = 'rgb(' + (v + 40 | 0) + ',' + (v | 0) + ',' + (v * 0.6 | 0) + ')'; g.fillRect(0, i * 16, s, 16); }
      g.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 8; i++) { g.fillRect(0, i * 16, s, 1); g.fillRect(r() * s, i * 16, 1, 16); }
      for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(r() * s, r() * s, 8 + r() * 20, 1); }
    }); break;
    case 'carpet': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#5a1a1e', 0.15, 2500, 1.5);
      g.strokeStyle = 'rgba(200,150,60,0.35)'; g.lineWidth = 3; g.strokeRect(8, 8, s - 16, s - 16);
      g.beginPath(); g.moveTo(s / 2, 20); g.lineTo(s - 20, s / 2); g.lineTo(s / 2, s - 20); g.lineTo(20, s / 2); g.closePath(); g.stroke();
    }); break;
    case 'stone': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#8d8678', 0.18, 1500, 2);
      g.fillStyle = 'rgba(40,35,30,0.55)';
      for (let y = 0; y < s; y += 32) { g.fillRect(0, y, s, 2); for (let x = (y / 32 % 2) * 32; x < s; x += 64) g.fillRect(x, y, 2, 32); }
    }); break;
    case 'limestone': t = canvasTex(128, (g, s, r) => speckle(g, s, r, '#b9b29d', 0.16, 2200, 2)); break;
    case 'gravel': t = canvasTex(128, (g, s, r) => speckle(g, s, r, '#8a8273', 0.35, 3500, 2)); break;
    case 'grass': t = canvasTex(256, (g, s, r) => {
      speckle(g, s, r, '#34422a', 0.2, 6000, 2);
      // patches: dead brown, dark moss, a little clover
      for (let i = 0; i < 26; i++) { const x = r() * s, y = r() * s, rad = 10 + r() * 34, col = ['rgba(110,96,60,0.32)', 'rgba(26,40,22,0.4)', 'rgba(70,96,44,0.3)'][i % 3]; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      // blades, light and dark, leaning with the wind
      for (let i = 0; i < 2600; i++) { const v = r(); g.strokeStyle = v < 0.25 ? 'rgba(140,128,80,0.55)' : v < 0.6 ? 'rgba(' + (60 + r() * 40 | 0) + ',' + (90 + r() * 50 | 0) + ',42,0.6)' : 'rgba(20,34,18,0.55)'; g.lineWidth = 1; const x = r() * s, y = r() * s, l = 3 + r() * 7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.35, y - l); g.stroke(); }
    }); break;
    case 'hedge': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#1d3018', 0.25, 1800, 4);
      for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(' + (30 + r() * 30 | 0) + ',' + (70 + r() * 50 | 0) + ',30,0.6)'; g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 2.5, 0, 7); g.fill(); }
    }); break;
    case 'bark': t = canvasTex(64, (g, s, r) => { speckle(g, s, r, '#3a2e24', 0.3, 300, 2); g.fillStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 12; i++) g.fillRect(r() * s, 0, 1 + r() * 2, s); }); break;
    case 'brick': t = canvasTex(128, (g, s, r) => {
      g.fillStyle = '#5a5048'; g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 16) for (let x = (y / 16 % 2) * 16; x < s + 16; x += 32) {
        const v = 110 + r() * 40; g.fillStyle = 'rgb(' + (v | 0) + ',' + (v * 0.5 | 0) + ',' + (v * 0.38 | 0) + ')'; g.fillRect(x - 16 + 1, y + 1, 30, 14);
      }
    }); break;
    case 'metal': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#5d6366', 0.12, 1200, 2);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, s, 2); g.fillRect(0, 0, 2, s);
      g.fillStyle = 'rgba(255,255,255,0.15)'; for (let i = 8; i < s; i += 30) { g.beginPath(); g.arc(8, i, 2, 0, 7); g.fill(); g.beginPath(); g.arc(s - 8, i, 2, 0, 7); g.fill(); }
      for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(90,50,20,' + r() * 0.3 + ')'; g.fillRect(r() * s, r() * s, 3 + r() * 10, 2 + r() * 20); }
    }); break;
    case 'asphalt': t = canvasTex(256, (g, s, r) => {
      // old tarmac: worn aggregate, patched, and crazed with cracks
      speckle(g, s, r, '#3b3b3a', 0.22, 9000, 2);
      for (let i = 0; i < 5; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(150,145,130,0.08)'; g.fillRect(r() * s, r() * s, 30 + r() * 70, 20 + r() * 50); }
      g.strokeStyle = 'rgba(8,8,8,0.8)';
      for (let i = 0; i < 14; i++) {
        let x = r() * s, y = r() * s; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 34; y += (r() - 0.5) * 34; g.lineTo(x, y); }
        g.stroke();
      }
    }); break
    case 'concrete': t = canvasTex(128, (g, s, r) => { speckle(g, s, r, '#55585a', 0.15, 2000, 2); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, s - 2, s, 2); g.fillRect(s - 2, 0, 2, s); }); break;
    case 'tile': t = canvasTex(128, (g, s, r) => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#d8d2c0' : '#2a2a2a'; g.fillRect(x * 32, y * 32, 32, 32); }
      speckle(g, s, r, 'rgba(0,0,0,0)', 0.1, 600, 2);
    }); break;
    case 'grate': t = canvasTex(64, (g, s) => { g.fillStyle = '#2b2f30'; g.fillRect(0, 0, s, s); g.fillStyle = '#4c5355'; for (let i = 0; i < s; i += 8) { g.fillRect(i, 0, 3, s); g.fillRect(0, i, s, 3); } }); break;
    case 'water': t = canvasTex(64, (g, s, r) => speckle(g, s, r, '#1d2c33', 0.2, 300, 3)); break;
    case 'roof': t = canvasTex(128, (g, s, r) => {
      g.fillStyle = '#2c2e33'; g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 12) for (let x = (y / 12 % 2) * 10; x < s; x += 20) { const v = 40 + r() * 20; g.fillStyle = 'rgb(' + (v | 0) + ',' + (v | 0) + ',' + (v + 6 | 0) + ')'; g.fillRect(x + 1, y + 1, 18, 10); }
    }); break;
    case 'ashlar': t = canvasTex(256, (g, s, r) => {
      // coursed gothic stonework: uneven blocks, chipped arrises, lichen, soot
      g.fillStyle = '#3e3c38'; g.fillRect(0, 0, s, s);
      for (let y = 0, row = 0; y < s; y += 32, row++) {
        let x = -(row % 2) * 30;
        while (x < s) {
          const w = 44 + Math.floor(r() * 36), v = 92 + r() * 38, tint = r() * 10;
          g.fillStyle = 'rgb(' + (v + tint | 0) + ',' + (v + 2 | 0) + ',' + (v - 6 | 0) + ')';
          g.fillRect(x + 2, y + 2, w - 3, 29);
          for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (r() * 0.12) + ')'; g.fillRect(x + 2 + r() * (w - 4), y + 2 + r() * 28, 1 + r() * 3, 1 + r() * 3); }
          if (r() < 0.35) { g.fillStyle = 'rgba(90,110,60,' + (0.15 + r() * 0.25) + ')'; g.beginPath(); g.arc(x + r() * w, y + r() * 30, 3 + r() * 9, 0, 7); g.fill(); }
          if (r() < 0.2) { g.fillStyle = 'rgba(20,18,16,0.35)'; g.fillRect(x + r() * w, y + 2, 1 + r() * 2, 28); }
          x += w;
        }
      }
    }); break;
    case 'slate': t = canvasTex(128, (g, s, r) => {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 10) for (let x = (y / 10 % 2) * 8; x < s; x += 16) {
        if (r() < 0.04) continue; // a missing slate
        const v = 44 + r() * 26; g.fillStyle = 'rgb(' + (v | 0) + ',' + (v + 3 | 0) + ',' + (v + 10 | 0) + ')'; g.fillRect(x + 1, y + 1, 14, 9);
        if (r() < 0.12) { g.fillStyle = 'rgba(70,90,50,0.4)'; g.fillRect(x + 1, y + 6, 14, 4); }
      }
    }); break;
    case 'oldwood': t = canvasTex(128, (g, s, r) => {
      speckle(g, s, r, '#2a2018', 0.15, 500, 2);
      g.fillStyle = 'rgba(0,0,0,0.5)'; for (let x = 0; x < s; x += 16) g.fillRect(x, 0, 2, s);
      for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(120,110,90,' + r() * 0.15 + ')'; g.fillRect(r() * s, r() * s, 1, 10 + r() * 30); }
    }); break;
    case 'cobweb': {
      t = canvasTex(128, (g, s, r) => {
        g.clearRect(0, 0, s, s);
        g.strokeStyle = 'rgba(230,230,225,0.55)'; g.lineWidth = 1;
        const cx = 6, cy = 6;
        for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI / 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 140, cy + Math.sin(a) * 140); g.stroke(); }
        for (let k = 1; k < 12; k++) { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2, rr = k * 11 + (r() - 0.5) * 6; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.stroke(); }
        g.fillStyle = 'rgba(220,220,215,0.12)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(80, 0); g.lineTo(0, 80); g.fill();
      });
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    } break;
    default:
      if (BM.TEX_EXTRA && BM.TEX_EXTRA[name]) { const d = BM.TEX_EXTRA[name]; t = canvasTex(d.size || 128, d.draw); }
      else t = canvasTex(16, (g, s) => { g.fillStyle = '#888'; g.fillRect(0, 0, s, s); });
  }
  t.name = name;
  return TEX[name] = t;
}
BM.tex = tex;

/* A normal map from a texture's own luminance (Sobel), for surface relief. */
const NTEX = {};
function normalTex(name, strength) {
  const k = name + strength;
  if (NTEX[k]) return NTEX[k];
  const src = tex(name).image, s = src.width;
  const c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  const srcData = src.getContext('2d').getImageData(0, 0, s, s).data;
  const out = g.createImageData(s, s);
  if (srcData && out && out.data) {
    const h = (x, y) => { const i = (((y + s) % s) * s + ((x + s) % s)) * 4; return (srcData[i] + srcData[i + 1] + srcData[i + 2]) / 765; };
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x - 1, y) + h(x - 1, y + 1));
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x, y - 1) + h(x + 1, y - 1));
      let nx = -dx * strength, ny = -dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * s + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255; out.data[i + 1] = (ny * 0.5 + 0.5) * 255; out.data[i + 2] = (nz * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return NTEX[k] = t;
}
BM.normalTex = normalTex;

/* World-space (box-projected) texturing for scaled canonical geometry. */
BM.wind = { value: 0 }; // shared time uniform for everything that sways in the storm
function worldMapped(mat, scale, sway, weather) {
  mat.userData.texScale = scale;
  mat.userData.sway = !!sway;
  mat.userData.weather = !!weather;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.bmTexScale = { value: scale };
    // the world-space varyings first: the sway below replaces the projection include they hang off
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 bmWP;\nvarying vec3 bmWN;')
      .replace('#include <project_vertex>', [
        '#include <project_vertex>',
        'vec4 bmW = vec4(transformed, 1.0);',
        'mat3 bmN = mat3(modelMatrix);',
        '#ifdef USE_INSTANCING',
        'bmW = instanceMatrix * bmW; bmN = bmN * mat3(instanceMatrix);',
        '#endif',
        'bmWP = (modelMatrix * bmW).xyz;',
        'bmWN = bmN * objectNormal;',
      ].join('\n'));
    if (sway) {
      // branches, grass and willow strands bend with the wind; more the higher they are
      shader.uniforms.bmTime = BM.wind;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float bmTime;')
        .replace('#include <project_vertex>', [
          'vec4 bmS = vec4(transformed, 1.0);',
          '#ifdef USE_INSTANCING',
          'bmS = instanceMatrix * bmS;',
          '#endif',
          'bmS = modelMatrix * bmS;',
          'float bmH = max(0.0, bmS.y - ' + sway.base.toFixed(2) + ');',
          'float bmG = 0.6 + 0.4 * sin(bmTime * 0.37 + bmS.x * 0.05);',
          'bmS.x += sin(bmTime * 1.7 + bmS.z * 0.31 + bmS.y * 0.4) * ' + sway.amount.toFixed(3) + ' * bmH * bmG;',
          'bmS.z += cos(bmTime * 1.3 + bmS.x * 0.27) * ' + (sway.amount * 0.7).toFixed(3) + ' * bmH * bmG;',
          'vec4 mvPosition = viewMatrix * bmS;',
          'gl_Position = projectionMatrix * mvPosition;',
        ].join('\n'));
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 bmWP;\nvarying vec3 bmWN;\nuniform float bmTexScale;')
      .replace('#include <map_fragment>', [
        '#ifdef USE_MAP',
        'vec3 bmA = abs(normalize(bmWN));',
        'vec2 bmUV = bmA.y > 0.6 ? bmWP.xz : (bmA.x > bmA.z ? bmWP.zy : bmWP.xy);',
        'vec4 texelColor = texture2D(map, bmUV * bmTexScale);',
        'texelColor = mapTexelToLinear(texelColor);',
        'diffuseColor *= texelColor;',
        weather ? [
          // damp rising at the base, moss green; soot and rain streaks running down
          'float bmDamp = 1.0 - smoothstep(0.0, 2.4, bmWP.y);',
          'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.6, 0.42), bmDamp * 0.75);',
          'float bmStreak = texture2D(map, vec2((bmWP.x + bmWP.z) * 0.173, 0.41)).g;',
          'float bmStreak2 = texture2D(map, vec2((bmWP.x - bmWP.z) * 0.61, 0.77)).r;',
          'diffuseColor.rgb *= 0.62 + 0.38 * smoothstep(0.2, 0.7, bmStreak) * (0.8 + 0.2 * bmStreak2);',
        ].join('\n') : '',
        '#endif',
      ].join('\n'))
      .replace('#include <normal_fragment_maps>', [
        '#ifdef USE_NORMALMAP',
        'vec3 bmMapN = texture2D(normalMap, bmUV * bmTexScale).xyz * 2.0 - 1.0;',
        'bmMapN.xy *= normalScale;',
        'normal = bmPerturb(-vViewPosition, normal, bmMapN, bmUV * bmTexScale);',
        '#endif',
      ].join('\n'))
      .replace('void main() {', [
        '#ifdef USE_NORMALMAP',
        'vec3 bmPerturb(vec3 eye_pos, vec3 surf_norm, vec3 mapN, vec2 uv) {',
        '  vec3 q0 = dFdx(eye_pos); vec3 q1 = dFdy(eye_pos); vec2 st0 = dFdx(uv); vec2 st1 = dFdy(uv);',
        '  vec3 N = surf_norm; vec3 q1perp = cross(q1, N); vec3 q0perp = cross(N, q0);',
        '  vec3 T = q1perp * st0.x + q0perp * st1.x; vec3 B = q1perp * st0.y + q0perp * st1.y;',
        '  float det = max(dot(T, T), dot(B, B)); float sc = (det == 0.0) ? 0.0 : inversesqrt(det);',
        '  return normalize(T * (mapN.x * sc) + B * (mapN.y * sc) + N * mapN.z);',
        '}',
        '#endif',
        'void main() {',
      ].join('\n'));
  };
  mat.customProgramCacheKey = () => 'bm-wm' + (sway ? '-sway-' + sway.base + '-' + sway.amount : '') + (weather ? '-weather' : '') + (mat.normalMap ? '-n' : '');
  return mat;
}

/* ---------------- materials ---------------- */
const MATS = {};
const MAT_DEFS = {
  // name: [colour, texture, texScale, shininess, extra]
  plaster: [0x9c9282, 'plaster', 0.5, 4],
  wallpaper: [0xa89888, 'wallpaper', 0.6, 6],
  wallpaperGreen: [0x6a8572, 'wallpaper', 0.6, 6],
  wallpaperBlue: [0x6a7896, 'wallpaper', 0.6, 6],
  panel: [0xb09080, 'panel', 0.8, 18, { bump: 2 }],
  floor: [0xb8a890, 'floorboards', 0.5, 20, { bump: 1.5 }],
  carpet: [0xb09090, 'carpet', 0.4, 2],
  stone: [0xb0aca2, 'stone', 0.35, 4, { bump: 2.5, weather: true }],
  limestone: [0xffffff, 'limestone', 0.25, 3],
  gravel: [0xffffff, 'gravel', 0.3, 2],
  grass: [0xffffff, 'grass', 0.2, 2],
  hedge: [0x6a7a62, 'hedge', 0.5, 3],
  bark: [0xffffff, 'bark', 0.8, 2, { bump: 3 }],
  brick: [0xb0a098, 'brick', 0.5, 3, { bump: 3, weather: true }],
  metal: [0xffffff, 'metal', 0.35, 40],
  metalDark: [0x707880, 'metal', 0.35, 40],
  concrete: [0xffffff, 'concrete', 0.25, 6],
  asphalt: [0x8a8986, 'asphalt', 0.22, 8, { bump: 2.5, weather: true }],
  tarPatch: [0x5c5b58, 'asphalt', 0.3, 12, { bump: 1.5 }],
  gravelOld: [0x5e5a50, 'gravel', 0.3, 2],
  weed: [0x3c3e28, null, 0, 2, { sway: { base: 0.0, amount: 0.3 } }],
  roadPaint: [0x8a887c, null, 0, 6],
  pole: [0x5a4a3a, 'oldwood', 0.9, 3, { bump: 2.5, weather: true }],
  wire: [0x0c0c0c, null, 0, 30],
  insulator: [0x6a7a6a, null, 0, 90],
  rust: [0x5a3420, 'metal', 0.6, 10],
  pine: [0x18231a, 'hedge', 0.35, 2, { sway: { base: 1.5, amount: 0.02 } }],
  pineDark: [0x111a13, 'hedge', 0.35, 2, { sway: { base: 1.5, amount: 0.02 } }],
  moss: [0x2c3a22, 'grass', 0.4, 2],
  longGrass: [0x8a9a66, 'grass', 0.5, 2, { sway: { base: 0.0, amount: 0.22 } }],
  dryGrass: [0xa89870, 'grass', 0.5, 2, { sway: { base: 0.0, amount: 0.25 } }],
  beardMoss: [0x6a6e5a, 'hedge', 1.2, 2, { sway: { base: 1.5, amount: 0.05 } }],
  birch: [0xd8d2c4, 'bark', 0.9, 4, { bump: 2 }],
  scum: [0x22341a, 'water', 0.25, 40],
  sapLeaves: [0x3a4a26, 'hedge', 0.6, 3, { sway: { base: 0.8, amount: 0.05 } }],
  tile: [0xffffff, 'tile', 0.8, 30],
  grate: [0xffffff, 'grate', 1.0, 30],
  roof: [0xffffff, 'roof', 0.5, 6, { bump: 2 }],
  water: [0x8fb3c4, 'water', 0.15, 90],
  wood: [0x5a3a24, null, 0, 25],
  darkWood: [0x2e1e14, null, 0, 30],
  fabricRed: [0x6a1f22, null, 0, 4],
  fabricGreen: [0x2f4a3a, null, 0, 4],
  fabricCream: [0xbfb39a, null, 0, 4],
  brass: [0xb08a3e, null, 0, 80],
  iron: [0x1e2124, null, 0, 30],
  white: [0xb8b4aa, null, 0, 40],
  porcelain: [0xf2f0ea, null, 0, 90],
  black: [0x111111, null, 0, 10],
  paper: [0xe9dfc4, null, 0, 2],
  leaves: [0x24361e, 'hedge', 0.4, 3],
  leavesDark: [0x1a2a18, 'hedge', 0.4, 3],
  flowersRed: [0x5a0c12, null, 0, 6],
  flowersWhite: [0x6a645a, null, 0, 6],
  flowersPurple: [0x2e2236, null, 0, 6],
  deadBark: [0x6a625a, 'bark', 0.9, 4, { sway: { base: 1.6, amount: 0.022 }, bump: 3 }],
  deadTwig: [0x5a544e, 'bark', 0.9, 4, { sway: { base: 1.0, amount: 0.04 } }],
  deadGrass: [0x8a7f5e, 'grass', 0.6, 2, { sway: { base: 0.02, amount: 0.25 } }],
  willow: [0x7a8a5e, 'hedge', 0.7, 3, { sway: { base: 0.5, amount: 0.07 } }],
  thorn: [0x3a302a, 'bark', 1.2, 3, { sway: { base: 0.1, amount: 0.05 } }],
  ivy: [0x3a4c2c, 'hedge', 1.4, 3],
  yew: [0x1a2418, 'hedge', 0.5, 2],
  leafLitter: [0x4a3220, null, 0, 2],
  leafLitter2: [0x5e3a1a, null, 0, 2],
  fungus: [0xc8bfa8, null, 0, 20],
  fungusStem: [0x9a9282, null, 0, 6],
  crow: [0x0a0a0c, null, 0, 40],
  gothicStone: [0x9a968c, 'ashlar', 0.42, 6, { bump: 3, weather: true }],
  gothicTrim: [0x8a867c, 'limestone', 0.6, 8, { bump: 2, weather: true }],
  slate: [0x9aa0aa, 'slate', 0.45, 30, { bump: 2.5 }],
  shutter: [0x8a8070, 'oldwood', 0.7, 4, { bump: 2 }],
  boards: [0x9a8c76, 'oldwood', 0.5, 4, { bump: 2 }],
  darkGlass: [0x0b0d10, null, 0, 120],
  candleGlow: [0x5a3410, null, 0, 0, { emissive: 0x6a3a10 }],
  dustSheet: [0xa8a49a, 'plaster', 0.9, 2],
  drape: [0x4a1218, 'carpet', 1.6, 6],
  wax: [0xd8d0b8, null, 0, 30],
  armour: [0x8a9096, 'metal', 0.8, 90],
  doll: [0xe0d4c0, null, 0, 40],
  dollDress: [0x6a5a6a, null, 0, 4],
  piano: [0x101010, null, 0, 100],
  damp: [0x2a2418, null, 0, 0, { transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }],
  cobweb: [0xffffff, null, 0, 0, { transparent: true, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.02 }],
  peel: [0x9a8a70, null, 0, 2, { side: THREE.DoubleSide }],
  deadStalk: [0x3a3226, null, 0, 2],
  soil: [0x2a1e16, 'gravel', 0.4, 2],
  statue: [0x9a988f, 'limestone', 0.5, 10],
  statueWorn: [0x8e8c84, 'limestone', 0.62, 6, { bump: 2, weather: true }],
  marble: [0xa8a6a0, 'limestone', 0.6, 60],
  rubber: [0x1a1a1a, null, 0, 5],
  leather: [0x3a2418, null, 0, 40],
  linen: [0xcfc6b2, 'plaster', 0.6, 4],
  carPaint: [0x3c4a3a, null, 0, 120],
  garageGreen: [0x5f8268, 'metal', 0.3, 30],
  suvPaint: [0x39444e, null, 0, 160],
  carTrim: [0x0c0d0e, null, 0, 90],
  cladding: [0x19191a, null, 0, 6],
  alloy: [0xb4b8bd, null, 0, 110],
  chrome: [0xcfd4d8, null, 0, 150],
  frame: [0x3a2618, null, 0, 30],
  gilt: [0x8c6a2c, null, 0, 70],
  canvas: [0x3a3028, null, 0, 6],
  podGlass: [0x6fdc8a, null, 0, 100, { transparent: true, opacity: 0.28, depthWrite: false }],
  glass: [0x9fb6c2, null, 0, 120, { transparent: true, opacity: 0.16, depthWrite: false }],
  scorch: [0x050403, null, 0, 0, { transparent: true, opacity: 0.85, depthWrite: false }],
};
function M(name) {
  if (MATS[name]) return MATS[name];
  if (name === 'cobweb') { const m = new THREE.MeshBasicMaterial({ map: tex('cobweb'), transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xb8b8b0 }); m.name = name; return MATS[name] = m; }
  const d = MAT_DEFS[name] || [0xff00ff, null, 0, 10];
  const extra = Object.assign({}, d[4] || {}), sway = extra.sway, weather = extra.weather, bump = extra.bump;
  delete extra.sway; delete extra.weather; delete extra.bump;
  const o = Object.assign({ color: d[0], shininess: d[3], specular: 0x222222 }, extra);
  if (d[1]) o.map = tex(d[1]);
  if (d[1] && bump) { o.normalMap = normalTex(d[1], bump); o.normalScale = new THREE.Vector2(1, 1); }
  const m = new THREE.MeshPhongMaterial(o);
  if (d[1]) worldMapped(m, d[2], sway, weather);
  m.name = name;
  return MATS[name] = m;
}
BM.M = M;
BM.MATS = MATS;
BM.MAT_DEFS = MAT_DEFS;

/* Self-lit materials for screens and signage (no lighting needed). */
const BASIC = {};
function Basic(colour, opts) {
  const k = colour + JSON.stringify(opts || {});
  if (BASIC[k]) return BASIC[k];
  return BASIC[k] = new THREE.MeshBasicMaterial(Object.assign({ color: colour }, opts || {}));
}
BM.Basic = Basic;
/* A self-lit material of its own, for anything whose colour shows its own state
   (a TV screen, a dial, a lamp): never shared, or one object would light its twins. */
BM.Own = (colour) => new THREE.MeshBasicMaterial({ color: colour });

/* ---------------- builder ---------------- */
/* A printed label: dark text on cream card (or engraved brass). */
const LABELS = {};
function labelMat(text, o) {
  o = o || {};
  const key = text + JSON.stringify(o);
  if (LABELS[key]) return LABELS[key];
  const c = document.createElement('canvas'); c.width = o.w || 256; c.height = o.h || 64;
  const g = c.getContext('2d');
  g.fillStyle = o.bg || '#e2d6b4'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = o.border || '#3a2a18'; g.lineWidth = 4; g.strokeRect(3, 3, c.width - 6, c.height - 6);
  g.fillStyle = o.fg || '#1a1410';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = text.split('\n');
  let size = o.size || Math.min(40, Math.floor((c.height - 12) / lines.length * 0.8));
  // shrink until the longest line fits inside the border
  g.font = 'bold ' + size + 'px "Courier New", monospace';
  while (size > 8 && Math.max(...lines.map(l => g.measureText(l).width)) > c.width - 20) { size--; g.font = 'bold ' + size + 'px "Courier New", monospace'; }
  lines.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * size * 1.15));
  if (o.bolt) { g.fillStyle = o.fg; g.beginPath(); g.moveTo(40, 20); g.lineTo(24, 70); g.lineTo(38, 70); g.lineTo(26, 112); g.lineTo(58, 56); g.lineTo(44, 56); g.lineTo(56, 20); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  // a lit display label glows on its own; a card label needs light to be read
  const m = o.lit ? new THREE.MeshBasicMaterial({ map: t }) : new THREE.MeshPhongMaterial({ map: t, shininess: o.shiny || 10, specular: 0x222222 });
  m.userData.unique = true;
  return LABELS[key] = m;
}
BM.labelMat = labelMat;

class Builder {
  constructor(scene, phys, grid) {
    this.scene = scene; this.phys = phys; this.grid = grid;
    this.zones = {};
    for (const z of ['exterior', 'mansion']) {
      const g = new THREE.Group(); g.name = 'zone:' + z; g.userData.zone = z;
      scene.add(g); this.zones[z] = g;
    }
    this.zone = 'exterior';
    this.room = 'grounds';
    this.levelName = 'ground';
    this.interactables = [];
    this.windows = phys.windows; this.doorways = phys.doorways; this.paths = phys.paths;
    this.doors = [];
    this.fixtures = [];
    this.animated = [];
    this.readables = [];
    this.labels = {};
  }
  get root() { return this.zones[this.zone]; }

  mesh(geo, mat, x, y, z, sx, sy, sz, ry, parent) {
    const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
    if (ry) m.rotation.y = ry;
    m.matrixAutoUpdate = false; m.updateMatrix();
    (parent || this.root).add(m);
    return m;
  }
  /* A box by centre and size. */
  box(mat, x, y, z, sx, sy, sz, ry, parent) { return this.mesh(G.box, mat, x, y, z, sx, sy, sz, ry, parent); }
  /* A box by extents. */
  boxE(mat, x0, x1, y0, y1, z0, z1, parent) {
    return this.box(mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 0, parent);
  }
  /* A solid box: visual plus collision. */
  solid(mat, x0, x1, y0, y1, z0, z1, o) {
    o = o || {};
    const m = mat ? this.boxE(mat, x0, x1, y0, y1, z0, z1) : null;
    const w = this.phys.addWall(x0, x1, z0, z1, y0, y1, o);
    if (m) m.userData.wall = w.id;
    return w;
  }
  furniture(mat, cx, cz, y0, sx, sy, sz, name) {
    const w = this.solid(mat, cx - sx / 2, cx + sx / 2, y0, y0 + sy, cz - sz / 2, cz + sz / 2, { kind: 'furniture', tag: name || 'furniture' });
    w.room = this.room;
    return w;
  }
  floor(mat, x0, x1, z0, z1, y, thick, holes) {
    thick = thick || 0.2;
    const rects = this.phys.rectWithHoles(x0, x1, z0, z1, y, y - thick, holes || [], this.room);
    if (mat) for (const r of rects) this.boxE(mat, r.x0, r.x1, y - thick, y, r.z0, r.z1);
    return rects;
  }

  /* A wall along an axis with door and window openings.
     axis 'x': runs along x at z=c. axis 'z': runs along z at x=c.
     openings: [{at, w, type:'door'|'window', head, sill, id}]
     o: {t, mat, matOut, outSign (+1/-1: which side is outdoors), y0, y1} */
  wall(axis, c, a0, a1, o, openings) {
    o = o || {};
    const t = o.t || 0.2, y0 = o.y0 || 0, y1 = o.y1 !== undefined ? o.y1 : y0 + 4.2;
    const mat = o.mat || 'plaster';
    openings = (openings || []).slice().sort((p, q) => p.at - q.at);
    const seg = (s, e, ya, yb, kind) => {
      if (e - s < 0.001 || yb - ya < 0.001) return;
      const ex = axis === 'x' ? [s, e, c - t / 2, c + t / 2] : [c - t / 2, c + t / 2, s, e];
      this.phys.addWall(ex[0], ex[1], ex[2], ex[3], ya, yb, { kind: kind || 'wall' });
      if (o.matOut && o.outSign) {
        // two skins: outside face and inside face
        const h = t / 2;
        const inner = axis === 'x' ? [s, e, c - o.outSign * h, c] : [c - o.outSign * h, c, s, e];
        const outer = axis === 'x' ? [s, e, c, c + o.outSign * h] : [c, c + o.outSign * h, s, e];
        this.boxE(mat, inner[0], inner[1], ya, yb, inner[2], inner[3]);
        this.boxE(o.matOut, outer[0], outer[1], ya, yb, outer[2], outer[3]);
      } else {
        // an inside wall stops just under the floor above, so its top never shows through (and flickers in) that floor
        this.boxE(mat, ex[0], ex[1], ya, yb === y1 ? yb - 0.025 : yb, ex[2], ex[3]);
      }
    };
    let cur = a0;
    for (const op of openings) {
      const s = op.at - op.w / 2, e = op.at + op.w / 2;
      seg(cur, s, y0, y1);
      if (op.type === 'door') {
        const head = y0 + (op.head || 2.3);
        seg(s, e, head, y1);
        const d = {
          id: op.id || ('door' + this.doorways.length), x: axis === 'x' ? op.at : c, z: axis === 'x' ? c : op.at,
          y: y0, axis, width: op.w, thick: t, zone: this.zone, room: this.room,
        };
        this.doorways.push(d);
        // casing
        const cm = op.casing || 'darkWood';
        const ct = t + 0.06;
        if (axis === 'x') {
          this.boxE(cm, s - 0.08, s, y0, head + 0.08, c - ct / 2, c + ct / 2);
          this.boxE(cm, e, e + 0.08, y0, head + 0.08, c - ct / 2, c + ct / 2);
          this.boxE(cm, s - 0.08, e + 0.08, head, head + 0.1, c - ct / 2, c + ct / 2);
        } else {
          this.boxE(cm, c - ct / 2, c + ct / 2, y0, head + 0.08, s - 0.08, s);
          this.boxE(cm, c - ct / 2, c + ct / 2, y0, head + 0.08, e, e + 0.08);
          this.boxE(cm, c - ct / 2, c + ct / 2, head, head + 0.1, s - 0.08, e + 0.08);
        }
      } else if (op.type === 'window') {
        const sill = y0 + (op.sill || 0.9), head = y0 + (op.head || 2.7);
        seg(s, e, y0, sill);
        seg(s, e, head, y1);
        this.windowPane(axis, c, s, e, sill, head, o.outSign || 1, t, op);
      } else if (op.type === 'arch') {
        seg(s, e, y0 + (op.head || 3), y1);
        this.doorways.push({ id: op.id || ('arch' + this.doorways.length), x: axis === 'x' ? op.at : c, z: axis === 'x' ? c : op.at, y: y0, axis, width: op.w, thick: t, zone: this.zone, room: this.room });
      }
      cur = e;
    }
    seg(cur, a1, y0, y1);
  }

  /* A real glazed window: glass you can see through, glazing bars, a sill. */
  windowPane(axis, c, s, e, sill, head, outSign, t, op) {
    const w = e - s, h = head - sill, mid = (s + e) / 2, cy = (sill + head) / 2;
    // the upper sash is fixed; the lower sash lives in its own group so it can slide up
    const glass = axis === 'x'
      ? this.box('glass', mid, cy + h / 4, c, w, h / 2, 0.02)
      : this.box('glass', c, cy + h / 4, mid, 0.02, h / 2, w);
    glass.userData.glass = true;
    // the lower sash runs in its own track, just inside the upper one, so it can slide up in front of it
    const inset = -outSign * 0.045;
    const sashG = new THREE.Group(); sashG.position.set(axis === 'x' ? mid : c + inset, sill, axis === 'x' ? c + inset : mid); this.root.add(sashG);
    const sashFm = op.frame || 'white';
    const lower = this.box('glass', 0, h / 4, 0, axis === 'x' ? w : 0.02, h / 2, axis === 'x' ? 0.02 : w, 0, sashG); lower.userData.glass = true;
    this.box(sashFm, 0, h / 4, 0, axis === 'x' ? 0.04 : 0.065, h / 2, axis === 'x' ? 0.065 : 0.04, 0, sashG);                      // its glazing bar
    this.box(sashFm, 0, 0.03, 0, axis === 'x' ? w : 0.08, 0.06, axis === 'x' ? 0.08 : w, 0, sashG);                                 // bottom rail
    this.box(sashFm, 0, h / 2 - 0.035, 0, axis === 'x' ? w : 0.08, 0.07, axis === 'x' ? 0.08 : w, 0, sashG);                       // its meeting rail
    this.box(sashFm, 0, h / 4, 0, axis === 'x' ? w : 0.06, 0.04, axis === 'x' ? 0.06 : w, 0, sashG);                              // its cross bar
    for (const e2 of [-1, 1]) this.box(sashFm, axis === 'x' ? e2 * (w / 2 - 0.03) : 0, h / 4, axis === 'x' ? 0 : e2 * (w / 2 - 0.03), axis === 'x' ? 0.05 : 0.07, h / 2, axis === 'x' ? 0.07 : 0.05, 0, sashG); // its stiles
    sashG.traverse(m => { m.userData.dynamic = true; });
    const g = axis === 'x' ? [s, e, c - 0.03, c + 0.03] : [c - 0.03, c + 0.03, s, e];
    this.phys.addWall(g[0], g[1], g[2], g[3], sill, head, { kind: 'glass' });
    // a sash window: stiles, a stout meeting rail, one glazing bar in each sash, a sill
    const bar = 0.04, fm = op.frame || 'white', sash = this.zone === 'mansion' || this.zone === 'exterior';
    if (axis === 'x') {
      this.box(fm, mid, cy + h / 4, c, bar, h / 2, 0.07);
      this.box(fm, mid, cy + 0.03, c, w, 0.06, 0.09);
      for (const e of [-1, 1]) this.box(fm, mid + e * (w / 2 - 0.03), cy, c + inset / 2, 0.06, h, 0.15);
      this.box(fm, mid, cy + h / 4, c, w, bar, 0.06);
      this.box(fm, mid, head - 0.03, c, w, 0.06, 0.09);
      this.box('stone', mid, sill - 0.04, c + outSign * 0.05, w + 0.2, 0.08, t + 0.12);
      if (sash) for (const e of [-1, 1]) this.box('shutter', mid + e * (w / 2 + 0.12), cy, c - outSign * (t / 2 - 0.05), 0.2, h - 0.05, 0.05);
    } else {
      this.box(fm, c, cy + h / 4, mid, 0.07, h / 2, bar);
      this.box(fm, c, cy + 0.03, mid, 0.09, 0.06, w);
      for (const e of [-1, 1]) this.box(fm, c + inset / 2, cy, mid + e * (w / 2 - 0.03), 0.15, h, 0.06);
      this.box(fm, c, cy + h / 4, mid, 0.06, bar, w);
      this.box(fm, c, head - 0.03, mid, 0.09, 0.06, w);
      this.box('stone', c + outSign * 0.05, sill - 0.04, mid, t + 0.12, 0.08, w + 0.2);
      if (sash) for (const e of [-1, 1]) this.box('shutter', c - outSign * (t / 2 - 0.05), cy, mid + e * (w / 2 + 0.12), 0.05, h - 0.05, 0.2);
    }
    const rec = {
      id: op.id || ('window' + this.windows.length), zone: this.zone, room: this.room,
      x: axis === 'x' ? mid : c, y: cy, z: axis === 'x' ? c : mid,
      nx: axis === 'z' ? outSign : 0, nz: axis === 'x' ? outSign : 0, w, h, sill, head,
      sash: sashG, open: false, sashT: 0, curtains: null,
    };
    this.windows.push(rec);
    return rec;
  }

  /* ---------------- light fittings ----------------
     style: pendant|chandelier|sconce|tube|street|lantern|cage|bulkhead|lamp|strip|fire|beacon|none
     The visual fitting carries a bulb mesh whose glow follows the record. */
  fixture(o) {
    const rec = this.grid.addLight(Object.assign({ zone: this.zone, room: this.room, level: this.levelName }, o));
    const [x, y, z] = o.pos;
    const style = o.style || 'pendant';
    const nx = o.nx || 0, nz = o.nz || 0; // wall normal for sconces
    let bulbSize = 0.12;
    const drawn = BM.drawFitting ? BM.drawFitting(this, style, o, rec) : undefined; // the finer fittings, in 31c
    if (drawn !== undefined) bulbSize = drawn;
    else switch (style) {
      case 'pendant':
        this.box('iron', x, (y + (o.ceiling || y + 0.8)) / 2 + 0.15, z, 0.015, (o.ceiling || y + 0.8) - y - 0.3, 0.015);
        this.mesh(G.cone, 'fabricCream', x, y + 0.15, z, 0.55, 0.3, 0.55);
        break;
      case 'chandelier':
        this.box('brass', x, y + 0.9, z, 0.03, 1.6, 0.03);
        { const rg = this.mesh(G.ring, 'brass', x, y, z, 1.4, 1.4, 1.4); rg.rotation.x = -Math.PI / 2; rg.updateMatrix(); }
        this.mesh(G.sphere, 'brass', x, y - 0.1, z, 0.25);
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.mesh(G.cyl, 'porcelain', x + Math.cos(a) * 0.65, y + 0.06, z + Math.sin(a) * 0.65, 0.05, 0.12, 0.05); }
        bulbSize = 0.3;
        break;
      case 'sconce':
        this.box('brass', x - nx * 0.06, y - 0.12, z - nz * 0.06, nz ? 0.14 : 0.04, 0.28, nx ? 0.14 : 0.04);
        this.box('brass', x - nx * 0.02, y - 0.05, z - nz * 0.02, nz ? 0.04 : 0.12, 0.03, nx ? 0.04 : 0.12);
        this.mesh(G.cone, 'fabricCream', x, y + 0.08, z, 0.2, 0.18, 0.2);
        bulbSize = 0.09;
        break;
      case 'tube':
        this.box('white', x, y + 0.04, z, o.len || 1.4, 0.06, 0.18, o.ry || 0);
        bulbSize = 0;
        rec.bulbBox = this.box(Basic(0x111111), x, y - 0.01, z, (o.len || 1.4) - 0.1, 0.05, 0.08, o.ry || 0);
        break;
      case 'street':
        this.mesh(G.post, 'iron', x, (y - 0.4) / 2, z, 0.14, y - 0.4, 0.14);
        this.box('iron', x, y + 0.25, z, 0.42, 0.06, 0.42);
        this.mesh(G.cone, 'iron', x, y + 0.42, z, 0.5, 0.3, 0.5);
        bulbSize = 0.22;
        break;
      case 'lantern':
        this.box('iron', x - nx * 0.15, y, z - nz * 0.15, nz ? 0.06 : 0.3, 0.06, nx ? 0.06 : 0.3);
        this.mesh(G.cone, 'iron', x, y + 0.24, z, 0.32, 0.18, 0.32);
        bulbSize = 0.14;
        break;
      case 'cage':
        this.box('metalDark', x, y + 0.12, z, 0.22, 0.05, 0.22);
        this.mesh(G.post, 'iron', x, y, z, 0.2, 0.22, 0.2).userData.wire = true;
        bulbSize = 0.1;
        break;
      case 'bulkhead':
        this.box('metalDark', x - nx * 0.06, y, z - nz * 0.06, nz ? 0.32 : 0.1, 0.22, nx ? 0.32 : 0.1);
        bulbSize = 0.13;
        break;
      case 'lamp':
        this.mesh(G.cyl, 'brass', x, y - 0.32, z, 0.08, 0.42, 0.08);
        this.mesh(G.cone, 'fabricCream', x, y + 0.04, z, 0.38, 0.3, 0.38);
        bulbSize = 0.08;
        break;
      case 'flood':
        this.box('iron', x, 0.12, z, 0.3, 0.24, 0.3);
        this.box('metalDark', x, y, z + 0.08, 0.5, 0.36, 0.22);
        bulbSize = 0.14;
        break;
      case 'bollard':
        this.mesh(G.post, 'iron', x, (y - 0.12) / 2, z, 0.14, y - 0.12, 0.14);
        this.mesh(G.cone, 'iron', x, y + 0.16, z, 0.26, 0.14, 0.26);
        bulbSize = 0.13;
        break;
      case 'beacon':
        this.mesh(G.cyl, 'metalDark', x, y - 0.12, z, 0.26, 0.1, 0.26);
        bulbSize = 0.16;
        break;
      case 'strip':
        bulbSize = 0;
        rec.bulbBox = this.box(Basic(0x111111), x, y, z, o.len || 2, 0.05, 0.05, o.ry || 0);
        break;
      case 'cobra': // a sodium lantern hung from a pole's arm
        this.box('metalDark', x, y + 0.12, z, 0.36, 0.14, 0.62);
        this.box('iron', x, y + 0.22, z + 0.12, 0.2, 0.08, 0.5);
        bulbSize = 0.2;
        break;
      case 'fire': case 'none':
        bulbSize = 0;
        break;
    }
    if (bulbSize > 0) {
      rec.bulb = this.mesh(G.lowSphere, new THREE.MeshBasicMaterial({ color: 0x15110c }), x, y, z, bulbSize);
      rec.bulb.userData.dynamic = true;
    }
    if (rec.bulbBox) rec.bulbBox.material = new THREE.MeshBasicMaterial({ color: 0x15110c }), rec.bulbBox.userData.dynamic = true;
    if (o.scorch) {
      rec.scorch = this.box('scorch', x - nx * 0.0, y + 0.1, z - nz * 0.0, nz ? 0.9 : 0.02, 1.1, nx ? 0.9 : 0.02);
      rec.scorch.position.set(x - nx * 0.11 + (nx ? 0 : 0), y + 0.15, z - nz * 0.11);
      rec.scorch.updateMatrix();
      rec.scorch.visible = false;
      rec.scorch.userData.dynamic = true;
    }
    this.fixtures.push(rec);
    return rec;
  }

  /* A real door in a doorway: one leaf, or two meeting in the middle. It
     swings on its hinge(s), blocks the way while shut, and can be worked from
     either side. o: id, axis ('x': the wall runs along x at z = c; 'z': along
     z at x = c), at (centre along the wall), c, w, h, hinge ('low'|'high'|
     'both'), swing (+1|-1: the side the free edge moves to, along the wall's
     normal), mat, dur, sound ('creak'|'groan'), label, wallT. */
  hingedDoor(o) {
    const y0 = o.y0 !== undefined ? o.y0 : this.levelFloor(), h = o.h || 2.1, w = o.w, thick = o.thick || 0.07, axis = o.axis;
    const hinges = o.hinge === 'both' ? [-1, 1] : [o.hinge === 'high' ? 1 : -1];
    const leafW = o.hinge === 'both' ? w / 2 : w;
    const leaves = [];
    for (const hs of hinges) {
      const pivot = new THREE.Group();
      const along = o.at + hs * w / 2;
      if (axis === 'x') pivot.position.set(along, y0, o.c); else pivot.position.set(o.c, y0, along);
      this.root.add(pivot);
      const sign = -hs; // the leaf runs from its hinge towards the door's centre
      const lx = axis === 'x' ? sign * leafW / 2 : 0, lz = axis === 'x' ? 0 : sign * leafW / 2;
      const sx = axis === 'x' ? leafW : thick, sz = axis === 'x' ? thick : leafW;
      this.box(o.mat || 'darkWood', lx, h / 2, lz, sx, h, sz, 0, pivot);
      // raised panels on both faces, a rail between, and a knob at the free edge
      for (const face of [-1, 1]) {
        const off = face * (thick / 2 + 0.012);
        const px = axis === 'x' ? lx : off, pz = axis === 'x' ? off : lz;
        const pw = leafW - 0.22;
        for (const [py, ph] of [[h * 0.3, h * 0.42], [h * 0.76, h * 0.26]]) this.box(o.panelMat || 'panel', px, py, pz, axis === 'x' ? pw : 0.02, ph, axis === 'x' ? 0.02 : pw, 0, pivot);
        const kx = axis === 'x' ? sign * (leafW - 0.12) : off * 1.6, kz = axis === 'x' ? off * 1.6 : sign * (leafW - 0.12);
        this.mesh(G.sphere, o.knobMat || 'brass', kx, 1.0, kz, 0.06, 0, pivot);
      }
      pivot.traverse(m => { m.userData.dynamic = true; });
      leaves.push({ pivot, sign });
    }
    const wt = o.wallT || 0.3;
    const wall = axis === 'x'
      ? this.phys.addWall(o.at - w / 2, o.at + w / 2, o.c - wt / 2, o.c + wt / 2, y0, y0 + h, { kind: 'door', tag: o.id })
      : this.phys.addWall(o.c - wt / 2, o.c + wt / 2, o.at - w / 2, o.at + w / 2, y0, y0 + h, { kind: 'door', tag: o.id });
    const door = {
      id: o.id, leaves, wall, axis, at: o.at, c: o.c, w, wt, y0, swing: o.swing || -1, maxAngle: o.maxAngle || 1.75,
      open: false, opened: false, t: 0, target: 0, moving: false, dur: o.dur || 1.6, sound: o.sound || 'creak', label: o.label || 'the door',
      angle(a) { for (const l of this.leaves) l.pivot.rotation.y = (this.axis === 'x' ? -l.sign * this.swing : l.sign * this.swing) * a; },
    };
    this.doors.push(door);
    if (o.interact !== false) {
      for (const side of [-1, 1]) {
        const n = axis === 'x' ? [0, side] : [side, 0];
        const pos = axis === 'x' ? [o.at, y0 + 1.1, o.c + side * (wt / 2 + 0.05)] : [o.c + side * (wt / 2 + 0.05), y0 + 1.1, o.at];
        this.interactable({
          id: side === (o.outside || 1) ? o.id : o.id + '-in', kind: 'door', door, pos, n, approachDist: 0.95,
          label: () => (door.open ? 'Close ' : 'Open ') + door.label,
          act: g => g.toggleDoor(door),
        });
      }
    }
    return door;
  }

  /* ---------------- interactables ---------------- */
  interactable(o) {
    const it = Object.assign({
      zone: this.zone, room: this.room, level: this.levelName, reach: 2.0, kind: 'control', approachDist: 0.9,
    }, o);
    it.pos = { x: o.pos[0], y: o.pos[1], z: o.pos[2] };
    it.n = { x: (o.n || [0, 1])[0], z: (o.n || [0, 1])[1] };
    it.floorY = o.floorY !== undefined ? o.floorY : (o.pos[1] < 1.9 + this.levelFloor() ? this.levelFloor() : this.levelFloor());
    it.approach = { x: it.pos.x + it.n.x * it.approachDist, y: it.floorY, z: it.pos.z + it.n.z * it.approachDist };
    this.interactables.push(it);
    if (it.kind === 'readable') this.readables.push(it);
    return it;
  }
  levelFloor() {
    return { ground: 0, upper: 4.2, attic: 8.2, cellar: -3.2, tower: 10.8, clock: 15.2, belfry: 21.0 }[this.levelName] || 0;
  }
  /* A wall switch you can see: a brass plate flush on the wall with a toggle
     that flips up (on) and down (off). `ids` are the fittings it controls. */
  switchPlate(it, ids) {
    const n = it.n, p = it.pos;
    // find the wall face behind the switch position
    const w = this.phys.occluded(p.x + n.x * 0.05, p.y, p.z + n.z * 0.05, p.x - n.x * 0.8, p.y, p.z - n.z * 0.8);
    let fx = p.x, fz = p.z;
    if (w && w.x0 !== undefined) {
      if (n.x) fx = n.x > 0 ? w.x1 : w.x0;
      if (n.z) fz = n.z > 0 ? w.z1 : w.z0;
    }
    const ry = Math.atan2(n.x, n.z);
    // a brass dolly switch on a varnished wooden pattress, 1960s wiring on 1860s walls
    this.box('frame', fx + n.x * 0.007, p.y, fz + n.z * 0.007, 0.088, 0.088, 0.014, ry);
    const base = this.mesh(G.cyl, 'brass', fx + n.x * 0.019, p.y, fz + n.z * 0.019, 0.064, 0.01, 0.064);
    base.rotation.set(Math.PI / 2, ry, 0, 'YXZ'); base.updateMatrix();
    this.mesh(G.cyl, 'black', fx + n.x * 0.025, p.y, fz + n.z * 0.025, 0.026, 0.004, 0.026).rotation.set(Math.PI / 2, ry, 0, 'YXZ');
    // the dolly pivots at the base: up for on, down for off
    const lever = new THREE.Group();
    lever.position.set(fx + n.x * 0.026, p.y, fz + n.z * 0.026);
    lever.rotation.order = 'YXZ'; lever.rotation.y = ry;
    const dolly = this.mesh(G.cyl, 'brass', 0, 0, 0.02, 0.016, 0.04, 0.016, 0, lever);
    dolly.rotation.x = Math.PI / 2; dolly.updateMatrix();
    this.mesh(G.sphere, 'brass', 0, 0, 0.04, 0.011, 0, lever);
    this.root.add(lever);
    lever.traverse(m => { m.userData.dynamic = true; });
    // an engraved strip above the switch says what it works
    const text = (typeof it.label === 'function' ? it.label() : it.label || '').replace(/ lights?$/i, '').toUpperCase();
    if (text) this.mesh(G.plane, BM.labelMat(text, { w: 256, h: 48, size: 22, bg: '#8a6a2c', fg: '#241808', border: '#5a4418' }), fx + n.x * 0.012, p.y + 0.072, fz + n.z * 0.012, 0.17, 0.032, 1, ry);
    it.switchVisual = { lever, ids, ry };
    it.controls = ids;
    it.leverOn = ids.some(id => { const l = this.grid.light(id); return l && l.on && !l.dead; });
    it.pos = { x: fx + n.x * 0.03, y: p.y, z: fz + n.z * 0.03 };
    it.approach = { x: it.pos.x + n.x * it.approachDist, y: it.floorY, z: it.pos.z + n.z * it.approachDist };
    return lever;
  }
  /* A light switch: interactable plus a visible plate whose toggle follows it. */
  lightSwitch(id, label, pos, n, ids) {
    const it = this.interactable({ id, label, pos, n, act: g => { it.leverOn = g.toggleFittings(ids); } });
    this.switchPlate(it, ids);
    return it;
  }

  /* A readable item: a sheet of paper (or book, plaque) and its text. */
  readable(id, title, text, pos, n, o) {
    o = o || {};
    const [x, y, z] = pos;
    if (o.visual !== false) {
      if (o.book) {
        this.box('fabricRed', x, y + 0.03, z, 0.22, 0.06, 0.3);
        this.box('paper', x + 0.01, y + 0.03, z, 0.2, 0.045, 0.28);
      } else if (o.plaque) {
        this.box('brass', x, y, z, n[0] ? 0.02 : 0.3, 0.18, n[1] ? 0.02 : 0.3);
      } else {
        const p = this.box('paper', x, y + 0.005, z, 0.21, 0.01, 0.29, o.ry || 0.2);
        p.userData.paper = true;
      }
    }
    return this.interactable(Object.assign({ id, kind: 'readable', title, text, pos, n, label: 'Read: ' + title }, o));
  }
}
BM.Builder = Builder;
})();
