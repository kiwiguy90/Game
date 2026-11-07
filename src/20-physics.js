/* ==========================================================================
   BLACKTHORN MANOR — 2. PHYSICAL WORLD
   Collision is data, not meshes: axis-aligned walls, and walkable surfaces
   (rects, ramps, arcs for the curved stairs). The player, the flood-fill
   reachability tests and the corona occlusion rays all use this one model.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const PLAYER = { radius: 0.3, height: 1.7, eye: 1.6, step: 0.5, kerb: 0.35 };
BM.PLAYER = PLAYER;

class PhysWorld {
  constructor() {
    this.cell = 4;
    this.walls = []; this.surfaces = [];
    this.wgrid = new Map(); this.sgrid = new Map();
    this.doorways = []; this.windows = []; this.paths = []; this.furniture = [];
    this._stamp = 0;
  }
  key(ix, iz) { return ix * 65536 + iz; }
  _insert(grid, item, x0, x1, z0, z1) {
    const c = this.cell;
    for (let ix = Math.floor(x0 / c); ix <= Math.floor(x1 / c); ix++)
      for (let iz = Math.floor(z0 / c); iz <= Math.floor(z1 / c); iz++) {
        const k = this.key(ix, iz);
        let l = grid.get(k); if (!l) grid.set(k, l = []);
        l.push(item);
      }
  }

  /* A solid axis-aligned box. kind: wall|furniture|glass|door|gate|laser|tree|hedge|rail */
  addWall(x0, x1, z0, z1, y0, y1, o) {
    o = o || {};
    const w = {
      id: this.walls.length,
      x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1),
      y0: Math.min(y0, y1), y1: Math.max(y0, y1),
      kind: o.kind || 'wall', enabled: o.enabled !== undefined ? o.enabled : true,
      occludes: o.occludes !== undefined ? o.occludes : !(o.kind === 'glass' || o.kind === 'laser' || o.kind === 'rail' || o.kind === 'furniture' || o.kind === 'tree'),
      tag: o.tag || null, structural: o.structural !== undefined ? o.structural : (o.kind || 'wall') === 'wall', _s: 0,
    };
    this.walls.push(w);
    this._insert(this.wgrid, w, w.x0, w.x1, w.z0, w.z1);
    if (w.kind === 'furniture') this.furniture.push(w);
    return w;
  }

  /* Walkable surfaces. `bottom` makes them solid from bottom to top. */
  addSurface(s) {
    s.id = this.surfaces.length; s._s = 0;
    if (s.type === 'arc') {
      s.bx0 = s.cx - s.r1; s.bx1 = s.cx + s.r1; s.bz0 = s.cz - s.r1; s.bz1 = s.cz + s.r1;
    } else {
      s.bx0 = Math.min(s.x0, s.x1); s.bx1 = Math.max(s.x0, s.x1);
      s.bz0 = Math.min(s.z0, s.z1); s.bz1 = Math.max(s.z0, s.z1);
      s.x0 = s.bx0; s.x1 = s.bx1; s.z0 = s.bz0; s.z1 = s.bz1;
    }
    if (s.bottom === undefined) s.bottom = Infinity; // not solid
    this.surfaces.push(s);
    this._insert(this.sgrid, s, s.bx0, s.bx1, s.bz0, s.bz1);
    return s;
  }
  rect(x0, x1, z0, z1, y, bottom, tag) { return this.addSurface({ type: 'rect', x0, x1, z0, z1, y, bottom, tag }); }
  /* Rectangle minus holes, decomposed into rects. */
  rectWithHoles(x0, x1, z0, z1, y, bottom, holes, tag) {
    const xs = new Set([x0, x1]), zs = new Set([z0, z1]);
    for (const h of holes) { xs.add(Math.max(x0, Math.min(x1, h[0]))); xs.add(Math.max(x0, Math.min(x1, h[1]))); zs.add(Math.max(z0, Math.min(z1, h[2]))); zs.add(Math.max(z0, Math.min(z1, h[3]))); }
    const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < X.length - 1; i++) {
      // merge vertical runs of cells in this column
      let run = null;
      for (let j = 0; j < Z.length - 1; j++) {
        const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
        const inHole = holes.some(h => cx > h[0] && cx < h[1] && cz > h[2] && cz < h[3]);
        if (!inHole && X[i + 1] - X[i] > 1e-6 && Z[j + 1] - Z[j] > 1e-6) {
          if (run) run[3] = Z[j + 1]; else run = [X[i], X[i + 1], Z[j], Z[j + 1]];
        } else if (run) { out.push(run); run = null; }
      }
      if (run) out.push(run);
    }
    return out.map(r => this.rect(r[0], r[1], r[2], r[3], y, bottom, tag));
  }
  ramp(x0, x1, z0, z1, axis, ya, yb, bottom, tag) {
    return this.addSurface({ type: 'ramp', x0, x1, z0, z1, axis, ya, yb, bottom, tag, a0: axis === 'x' ? x0 : z0, a1: axis === 'x' ? x1 : z1 });
  }
  arc(cx, cz, r0, r1, a0, a1, y0, y1, bottom, tag) {
    return this.addSurface({ type: 'arc', cx, cz, r0, r1, a0, a1, y0, y1, bottom, tag });
  }

  surfaceTop(s, x, z) {
    if (x < s.bx0 || x > s.bx1 || z < s.bz0 || z > s.bz1) return null;
    if (s.type === 'rect') return s.y;
    if (s.type === 'ramp') {
      const c = s.axis === 'x' ? x : z;
      const t = (c - s.a0) / (s.a1 - s.a0);
      return s.ya + (s.yb - s.ya) * Math.max(0, Math.min(1, t));
    }
    const dx = x - s.cx, dz = z - s.cz, r = Math.sqrt(dx * dx + dz * dz);
    if (r < s.r0 || r > s.r1) return null;
    let th = Math.atan2(dx, dz);
    while (th < s.a0) th += Math.PI * 2;
    while (th >= s.a0 + Math.PI * 2) th -= Math.PI * 2;
    if (th > s.a1) return null;
    return s.y0 + (s.y1 - s.y0) * ((th - s.a0) / (s.a1 - s.a0));
  }

  /* Highest surface the player can stand on from height y. */
  support(x, z, y, step) {
    step = step === undefined ? PLAYER.step : step;
    const l = this.sgrid.get(this.key(Math.floor(x / this.cell), Math.floor(z / this.cell)));
    let best = -Infinity;
    if (!l) return best;
    for (const s of l) {
      const top = this.surfaceTop(s, x, z);
      if (top !== null && top <= y + step && top > best) best = top;
    }
    return best;
  }

  /* What (if anything) blocks a standing player circle at x,z,y. */
  blocked(x, z, y, r, h) {
    r = r === undefined ? PLAYER.radius : r; h = h === undefined ? PLAYER.height : h;
    const c = this.cell, stamp = ++this._stamp;
    for (let ix = Math.floor((x - r) / c); ix <= Math.floor((x + r) / c); ix++)
      for (let iz = Math.floor((z - r) / c); iz <= Math.floor((z + r) / c); iz++) {
        const l = this.wgrid.get(this.key(ix, iz));
        if (l) for (const w of l) {
          if (w._s === stamp) continue; w._s = stamp;
          if (!w.enabled || w.y1 <= y + PLAYER.kerb || w.y0 >= y + h) continue;
          const px = Math.max(w.x0, Math.min(x, w.x1)), pz = Math.max(w.z0, Math.min(z, w.z1));
          const dx = x - px, dz = z - pz;
          if (dx * dx + dz * dz < r * r) return w;
        }
        const sl = this.sgrid.get(this.key(ix, iz));
        if (sl) for (const s of sl) {
          if (s._s === stamp) continue; s._s = stamp;
          if (s.bottom >= y + h) continue;
          for (let k = 0; k < 9; k++) {
            const a = k * Math.PI / 4, rr = k === 8 ? 0 : r * 0.95;
            const top = this.surfaceTop(s, x + Math.cos(a) * rr, z + Math.sin(a) * rr);
            if (top !== null && top > y + PLAYER.step && s.bottom < y + h) return s;
          }
        }
      }
    return null;
  }

  /* Move a body {x,y,z} horizontally with sliding; returns the last blocker. */
  move(p, dx, dz) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.08));
    const sx = dx / n, sz = dz / n;
    let hit = null;
    for (let i = 0; i < n; i++) {
      let b = this.blocked(p.x + sx, p.z, p.y);
      if (!b) p.x += sx; else hit = b;
      b = this.blocked(p.x, p.z + sz, p.y);
      if (!b) p.z += sz; else hit = b;
      const sup = this.support(p.x, p.z, p.y);
      if (sup > p.y) p.y = sup; // stepped up a stair or kerb
    }
    return hit;
  }

  /* If a body has ended up overlapping something solid (a fall beside a
     staircase, say), find the nearest free spot and put it there. */
  depenetrate(p) {
    if (!this.blocked(p.x, p.z, p.y)) return false;
    for (let r = 0.05; r <= 1.2; r += 0.05) {
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
        const y = this.support(x, z, p.y + 0.1);
        if (!isFinite(y) || y < p.y - 0.6) continue;
        if (!this.blocked(x, z, y)) { p.x = x; p.z = z; p.y = y; return true; }
      }
    }
    return false;
  }

  /* Segment vs occluding boxes (walls and floor slabs). */
  occluded(ax, ay, az, bx, by, bz, ignoreEnd) {
    const c = this.cell, stamp = ++this._stamp;
    const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), z0 = Math.min(az, bz), z1 = Math.max(az, bz);
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const tmax = ignoreEnd ? 1 - ignoreEnd / Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz)) : 1;
    const hitBox = (bx0, bx1, by0, by1, bz0, bz1) => {
      let t0 = 0, t1 = tmax;
      const sl = [[ax, dx, bx0, bx1], [ay, dy, by0, by1], [az, dz, bz0, bz1]];
      for (const [o, d, lo, hi] of sl) {
        if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return false; continue; }
        let ta = (lo - o) / d, tb = (hi - o) / d;
        if (ta > tb) { const tt = ta; ta = tb; tb = tt; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) return false;
      }
      return true;
    };
    for (let ix = Math.floor(x0 / c); ix <= Math.floor(x1 / c); ix++)
      for (let iz = Math.floor(z0 / c); iz <= Math.floor(z1 / c); iz++) {
        const k = this.key(ix, iz);
        const l = this.wgrid.get(k);
        if (l) for (const w of l) {
          if (w._s === stamp) continue; w._s = stamp;
          if (!w.enabled || !w.occludes) continue;
          if (hitBox(w.x0, w.x1, w.y0, w.y1, w.z0, w.z1)) return w;
        }
        const sl = this.sgrid.get(k);
        if (sl) for (const s of sl) {
          if (s._s === stamp) continue; s._s = stamp;
          if (s.type !== 'rect' || !isFinite(s.bottom) || s.noOcclude) continue;
          if (hitBox(s.x0, s.x1, s.bottom, s.y, s.z0, s.z1)) return s;
        }
      }
    return null;
  }

  /* Breadth-first flood of where a player can stand, from seeds.
     `links(node)` may return extra seeds (ladders, lifts). */
  flood(seeds, opts) {
    opts = opts || {};
    const cell = opts.cell || 0.25, maxNodes = opts.maxNodes || 2e6;
    const seen = new Map(), queue = [];
    let found = null;
    const keyOf = (x, z, y) => Math.round(x / cell) + ',' + Math.round(z / cell) + ',' + Math.round(y * 2);
    const push = (x, z, y) => {
      const k = keyOf(x, z, y);
      if (seen.has(k)) return;
      const n = { x, z, y }; seen.set(k, n); queue.push(n);
      if (opts.until && !found && opts.until(n)) found = n;
    };
    for (const s of seeds) {
      const y = this.support(s.x, s.z, s.y + 0.3);
      if (isFinite(y) && !this.blocked(s.x, s.z, y)) push(Math.round(s.x / cell) * cell, Math.round(s.z / cell) * cell, y);
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let qi = 0;
    while (qi < queue.length && seen.size < maxNodes && !found) {
      const n = queue[qi++];
      for (const [ddx, ddz] of dirs) {
        const p = { x: n.x, y: n.y, z: n.z };
        // walk half then the rest so stairs are climbed like the player does
        if (this.blocked(p.x + ddx * cell, p.z + ddz * cell, p.y)) continue;
        p.x += ddx * cell; p.z += ddz * cell;
        let sup = this.support(p.x, p.z, p.y);
        if (!isFinite(sup) || sup < p.y - 40) continue;
        if (sup < p.y && this.blocked(p.x, p.z, sup)) continue;
        push(p.x, p.z, sup);
      }
      if (opts.links) for (const s of opts.links(n)) {
        const y = this.support(s.x, s.z, s.y + 0.3);
        if (isFinite(y)) push(Math.round(s.x / cell) * cell, Math.round(s.z / cell) * cell, y);
      }
    }
    return { nodes: seen, list: queue, cell, found };
  }
}
BM.PhysWorld = PhysWorld;
})();
