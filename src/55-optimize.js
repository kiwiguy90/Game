/* ==========================================================================
   BLACKTHORN MANOR — 9. PERFORMANCE
   Start-up: de-duplicate geometry and materials, then merge any 12+ static
   copies of the same geometry+material in a zone into one InstancedMesh.
   Runtime: adaptive quality on the MEDIAN frame time.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

function geoKey(g) {
  if (g.userData && g.userData.canonical) return 'canon:' + g.userData.canonical;
  if (g.parameters) return g.type + ':' + JSON.stringify(g.parameters);
  return null;
}
function matKey(m) {
  if (m.isShaderMaterial || m.userData.unique) return null;
  const c = m.color ? m.color.getHexString() : '';
  const e = m.emissive ? m.emissive.getHexString() : '';
  return [m.type, c, e, m.map ? m.map.uuid : '', m.transparent, m.opacity, m.side, m.blending, m.depthWrite, m.depthTest,
    m.shininess, m.userData.texScale || 0, m.vertexColors, m.wireframe].join('|');
}

/* Replace geometries and materials that are equal in all but identity. */
BM.dedupe = function (root) {
  const geos = new Map(), mats = new Map();
  let geoMerged = 0, matMerged = 0;
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const gk = geoKey(o.geometry);
    if (gk) {
      const have = geos.get(gk);
      if (!have) geos.set(gk, o.geometry);
      else if (have !== o.geometry) { o.geometry = have; geoMerged++; }
    }
    if (o.userData.dynamic) return; // per-object materials that animate
    const mk = matKey(o.material);
    if (mk) {
      const have = mats.get(mk);
      if (!have) mats.set(mk, o.material);
      else if (have !== o.material) { o.material = have; matMerged++; }
    }
  });
  return { geoMerged, matMerged, uniqueGeometries: geos.size, uniqueMaterials: mats.size };
};

/* Merge 12+ static copies of the same geometry+material into an InstancedMesh. */
BM.instance = function (zoneGroup, min) {
  min = min || 12;
  const groups = new Map();
  for (const o of zoneGroup.children) {
    if (!o.isMesh || o.isInstancedMesh || o.userData.dynamic || o.userData.mirror || o.matrixAutoUpdate) continue;
    if (o.material.transparent && !o.userData.glass && !o.userData.instanceOK) continue;
    const k = o.geometry.uuid + '|' + o.material.uuid;
    let l = groups.get(k); if (!l) groups.set(k, l = []);
    l.push(o);
  }
  let made = 0, absorbed = 0;
  for (const list of groups.values()) {
    if (list.length < min) continue;
    const im = new THREE.InstancedMesh(list[0].geometry, list[0].material, list.length);
    list.forEach((m, i) => { m.updateMatrix(); im.setMatrixAt(i, m.matrix); });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = list.some(m => m.castShadow); im.receiveShadow = true;
    im.frustumCulled = false;
    im.userData.instanced = list.length;
    im.matrixAutoUpdate = false; im.updateMatrix();
    for (const m of list) zoneGroup.remove(m);
    zoneGroup.add(im);
    made++; absorbed += list.length;
  }
  return { made, absorbed };
};

BM.optimize = function (game) {
  const stats = { before: 0, after: 0 };
  game.scene.traverse(o => { if (o.isMesh) stats.before++; });
  Object.assign(stats, BM.dedupe(game.scene));
  stats.instancedMeshes = 0; stats.instancesAbsorbed = 0;
  for (const z in game.B.zones) {
    const r = BM.instance(game.B.zones[z], 4);
    stats.instancedMeshes += r.made; stats.instancesAbsorbed += r.absorbed;
  }
  // shadows: everything receives; furniture-scale things cast
  game.scene.traverse(o => {
    if (!o.isMesh) return;
    o.receiveShadow = !o.material.transparent;
    if (o.userData.wall === undefined && !o.material.transparent && !(o.material.isMeshBasicMaterial)) o.castShadow = true;
  });
  game.scene.traverse(o => { if (o.isMesh) stats.after++; });
  // small static details: drawn only within a distance that grows with their size
  const details = [], v = new THREE.Vector3();
  game.scene.updateMatrixWorld(true);
  game.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.dynamic || o.material.isMeshBasicMaterial || o.material.transparent || o.frustumCulled === false) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const s = o.matrixWorld.getMaxScaleOnAxis(), r = o.geometry.boundingSphere.radius * s;
    if (r > 0.9) return;
    v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld);
    details.push({ o, x: v.x, y: v.y, z: v.z, d2: Math.pow(16 + r * 70, 2) });
  });
  game.details = details; stats.details = details.length;
  return stats;
};
/* Hide the small details that are too far away to see. Cheap enough to run on a slice of them each frame. */
BM.cullDetails = function (game, cam) {
  const D = game.details; if (!D || !D.length) return;
  const n = Math.ceil(D.length / 6), start = game.detailCursor || 0;
  for (let i = 0; i < n; i++) {
    const d = D[(start + i) % D.length], dx = d.x - cam.x, dy = d.y - cam.y, dz = d.z - cam.z;
    d.o.visible = dx * dx + dy * dy + dz * dz < d.d2;
  }
  game.detailCursor = (start + n) % D.length;
};
/* Put every detail right at once (after a teleport). */
BM.cullDetailsAll = function (game, cam) { const D = game.details; if (!D) return; for (const d of D) { const dx = d.x - cam.x, dy = d.y - cam.y, dz = d.z - cam.z; d.o.visible = dx * dx + dy * dy + dz * dz < d.d2; } };

/* --------------------------------------------------------------------------
   Adaptive quality. Watches the MEDIAN of recent frame times so a single
   hitch cannot drop the level; steps pixel ratio, rain density, shadows.
   -------------------------------------------------------------------------- */
const LEVELS = [
  { name: 'low', pixelRatio: 0.7, rain: 1500, shadowEvery: 0, mirrors: false },
  { name: 'medium', pixelRatio: 1.0, rain: 4500, shadowEvery: 3, mirrors: true },
  { name: 'high', pixelRatio: 1.5, rain: 9000, shadowEvery: 1, mirrors: true },
];
BM.QUALITY_LEVELS = LEVELS;

class Quality {
  constructor(apply, start) {
    this.apply = apply || (() => {});
    this.level = start === undefined ? 2 : start;
    this.samples = [];
    this.window = 90;
    this.timer = 0;
    this.goodStreak = 0;
    this.slowMs = 24;   // median above this: step down
    this.fastMs = 13;   // median below this three checks running: step up
    this.history = [];
  }
  get settings() { return LEVELS[this.level]; }
  sample(ms) {
    this.samples.push(ms);
    if (this.samples.length > this.window) this.samples.shift();
  }
  median() {
    if (!this.samples.length) return 0;
    const s = this.samples.slice().sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  update(dt) {
    this.timer += dt;
    if (this.timer < 2) return false;
    this.timer = 0;
    if (this.samples.length < 30) return false;
    const med = this.median();
    if (med > this.slowMs && this.level > 0) {
      this.level--; this.goodStreak = 0; this.samples.length = 0;
      this.history.push({ to: this.level, median: med }); this.apply(this.settings);
      return true;
    }
    if (med < this.fastMs) {
      if (++this.goodStreak >= 3 && this.level < LEVELS.length - 1) {
        this.level++; this.goodStreak = 0; this.samples.length = 0;
        this.history.push({ to: this.level, median: med }); this.apply(this.settings);
        return true;
      }
    } else this.goodStreak = 0;
    return false;
  }
}
BM.Quality = Quality;
})();
