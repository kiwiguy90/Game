/* Plays the game with the real controls (A/D turn, W walk, E use, panel keys).
   Loaded into the page (or the harness): route-finds on the game's own
   collision model, then steers along the route like a player. */
(function () {
  const g = BM.game, P = g.phys, BMx = BM;
  const realFrame = g.frame.bind(g);
  g.frame = function () {};              // stop the rAF loop driving the game; we drive it
  const AP = window.AP = { log: [], frames: 0, rendered: 0, stuck: 0, renderEvery: 20, dt: 1 / 60, says: [] };
  const origSay = g.ui.say.bind(g.ui);
  g.ui.say = (t, s) => { AP.says.push(t); return origSay(t, s); };
  const step = (n) => {
    for (let i = 0; i < n; i++) {
      AP.frames++;
      if (AP.frames % AP.renderEvery === 0) { realFrame(AP.dt, 16); AP.rendered++; }
      else { try { g.update(AP.dt); } catch (e) { g.frameErrors++; g.lastError = e; } }
    }
  };
  AP.step = step;
  AP.render = () => { realFrame(AP.dt, 16); realFrame(AP.dt, 16); };
  const key = (c, down) => down ? g.keyDown(c) : g.keyUp(c);
  const press = (c) => { g.keyDown(c); step(2); g.keyUp(c); step(2); };
  AP.press = press;

  /* BFS on the player's own collision model, returning a path of cells. */
  function plan(target, maxNodes, margin) {
    const R = margin || 0.42;
    const p = g.player, cell = 0.25;
    const k = (x, z, y) => Math.round(x / cell) + ',' + Math.round(z / cell) + ',' + Math.round(y * 2);
    const start = { x: Math.round(p.x / cell) * cell, z: Math.round(p.z / cell) * cell, y: P.support(p.x, p.z, p.y + 0.3) };
    if (P.blocked(start.x, start.z, start.y)) { start.x = p.x; start.z = p.z; }
    const seen = new Map([[k(start.x, start.z, start.y), null]]), q = [start];
    let qi = 0, found = null;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (qi < q.length && seen.size < (maxNodes || 900000)) {
      const n = q[qi++];
      if (Math.abs(n.x - target.x) <= 0.3 && Math.abs(n.z - target.z) <= 0.3 && Math.abs(n.y - target.y) < 0.6) { found = n; break; }
      for (const [dx, dz] of dirs) {
        const nx = n.x + dx * cell, nz = n.z + dz * cell;
        const nearEnd = Math.hypot(nx - target.x, nz - target.z) < 1.4 || Math.hypot(nx - start.x, nz - start.z) < 1.4;
        const r = nearEnd ? 0.3 : R;
        if (P.blocked(nx, nz, n.y, r)) continue;
        if (dx && dz && (P.blocked(n.x + dx * cell, n.z, n.y, r) || P.blocked(n.x, n.z + dz * cell, n.y, r))) continue;
        const sup = P.support(nx, nz, n.y);
        if (!isFinite(sup) || sup < n.y - 0.55) continue; // never plan a fall
        if (P.blocked(nx, nz, sup)) continue;
        const kk = k(nx, nz, sup);
        if (seen.has(kk)) continue;
        const m = { x: nx, z: nz, y: sup, prev: n };
        seen.set(kk, n); q.push(m);
      }
    }
    if (!found) return null;
    const path = [];
    for (let n = found; n; n = n.prev) path.push(n);
    path.reverse();
    // string-pull: keep only waypoints we cannot walk straight past
    // a straight line is only taken if it keeps a margin off every corner
    const clear = (a, b) => {
      const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / 0.1));
      let y = a.y;
      for (let i = 1; i <= n; i++) {
        const x = a.x + (b.x - a.x) * i / n, z = a.z + (b.z - a.z) * i / n;
        const s = P.support(x, z, y);
        if (!isFinite(s) || s < y - 0.55) return false;
        y = s;
        if (P.blocked(x, z, y, 0.4)) return false;
      }
      return Math.abs(y - b.y) < 0.3;
    };
    const out = [path[0]];
    let i = 0;
    while (i < path.length - 1) {
      let j = Math.min(path.length - 1, i + 60);
      while (j > i + 1 && !clear(path[i], path[j])) j--;
      out.push(path[j]); i = j;
    }
    return out;
  }

  AP.plan = plan;
  /* Steer along a path with A/D and W, like a player would. */
  function follow(path, label) {
    const p = g.player;
    let wi = 1, lastProgress = AP.frames, best = Infinity, replans = 0;
    while (wi < path.length) {
      const w = path[wi];
      const dx = w.x - p.x, dz = w.z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.22 && Math.abs(w.y - p.y) < 0.7) { wi++; best = Infinity; lastProgress = AP.frames; continue; }
      const want = Math.atan2(-dx, -dz);
      let err = want - p.yaw; while (err > Math.PI) err -= Math.PI * 2; while (err < -Math.PI) err += Math.PI * 2;
      key('KeyA', err > 0.04); key('KeyD', err < -0.04);
      key('KeyW', Math.abs(err) < 0.2);
      step(1);
      if (d < best - 0.05) { best = d; lastProgress = AP.frames; }
      if (AP.frames - lastProgress > 240) {
        AP.stuck++; AP.log.push({ stuck: label, at: [p.x.toFixed(2), p.y.toFixed(2), p.z.toFixed(2)], waypoint: [w.x, w.y, w.z] });
        key('KeyW', false); key('KeyA', false); key('KeyD', false);
        // like a player: back off a step, turn a little, try again
        key('KeyS', true); step(36); key('KeyS', false);
        key(replans % 2 ? 'KeyA' : 'KeyD', true); step(20); key('KeyA', false); key('KeyD', false);
        if (++replans > 5) return false;
        return 'replan';
      }
    }
    key('KeyW', false); key('KeyA', false); key('KeyD', false);
    return true;
  }

  /* Walk to a point (no interaction). */
  function goTo(pt) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const path = plan(pt) || plan(pt, 0, 0.3);
      if (!path) return false;
      const r = follow(path, 'point');
      if (r === true) return true;
      if (r === false) return false;
    }
    return false;
  }
  /* Use the right-hand curved staircase like a person: from its foot, follow the curve. */
  function stairs(up) {
    const p = g.player;
    if (up ? !goTo({ x: 1.6, y: 0, z: 9.4 }) : !goTo({ x: 0.4, y: 4.2, z: 1.6 })) return false;
    for (let i = 0; i < 60 * 15; i++) {
      const th = Math.atan2(p.x, p.z - 6), dir = up ? 0.35 : -0.35;
      const tx = Math.sin(th + dir) * 3.3, tz = 6 + Math.cos(th + dir) * 3.3;
      const want = Math.atan2(-(tx - p.x), -(tz - p.z));
      let e = want - p.yaw; while (e > Math.PI) e -= Math.PI * 2; while (e < -Math.PI) e += Math.PI * 2;
      key('KeyA', e > 0.03); key('KeyD', e < -0.03); key('KeyW', Math.abs(e) < 0.4); step(1);
      if (up ? p.y > 4.15 : p.y < 0.05) break;
    }
    key('KeyW', false); key('KeyA', false); key('KeyD', false);
    return up ? p.y > 4.1 : p.y < 0.1;
  }
  const levelOf = (y) => y > 7 ? 'attic' : y > 3 ? 'upper' : y > -1 ? 'ground' : y > -10 ? 'cellar' : 'hive';
  /* Walk to an interactable's approach spot, face it, and press E. */
  AP.goUse = function (id, opts) {
    opts = opts || {};
    const it = g.byId[id], t0 = AP.frames;
    if (!it) return { id, ok: false, why: 'no such item' };
    const from = levelOf(g.player.y), to = levelOf(it.approach.y);
    const inHouse = Math.abs(g.player.x) < 18 && Math.abs(g.player.z) < 12;
    if ((from === 'ground' || from === 'cellar') && to === 'upper') stairs(true);
    if (from === 'upper' && (to === 'ground' || to === 'cellar' || to === 'hive')) stairs(false);
    let arrived = false;
    for (let attempt = 0; attempt < 6 && !arrived; attempt++) {
      const path = plan(it.approach) || plan(it.approach, 0, 0.3);
      if (!path) return { id, ok: false, why: 'no route', from: [g.player.x, g.player.y, g.player.z].map(v => +v.toFixed(2)) };
      const r = follow(path, id);
      if (r === true) arrived = true;
      if (r === false) break;
    }
    if (!arrived) return { id, ok: false, why: 'stuck', at: [g.player.x, g.player.y, g.player.z].map(v => +v.toFixed(2)) };
    // face it
    const want = Math.atan2(it.n.x, it.n.z);
    for (let i = 0; i < 400; i++) {
      let err = want - g.player.yaw; while (err > Math.PI) err -= Math.PI * 2; while (err < -Math.PI) err += Math.PI * 2;
      if (Math.abs(err) < 0.05) break;
      key('KeyA', err > 0); key('KeyD', err < 0); step(1);
    }
    key('KeyA', false); key('KeyD', false); step(2);
    const picked = g.pick();
    const prompt = document.getElementById('prompt').textContent;
    if (picked !== it) return { id, ok: false, why: 'picked ' + (picked && picked.id), prompt };
    if (!opts.noUse) press('KeyE');
    return { id, ok: true, secs: +((AP.frames - t0) / 60).toFixed(1), prompt };
  };
  AP.wait = (secs) => step(Math.round(secs * 60));
  AP.state = () => ({
    pos: [g.player.x, g.player.y, g.player.z].map(v => +v.toFixed(2)), zone: g.zoneAt(g.player.x, g.player.y, g.player.z),
    lodge: g.grid.lodge, main: g.grid.live('main'), tripped: g.grid.tripped, journal: g.story.journalRead, gen: g.grid.generator,
    routed: [...g.grid.routed], coreDoor: g.grid.coreDoorUnsealed, lasers: g.grid.lasersLive, ended: g.story.ended,
    objective: g.objective(), uiMode: g.ui.mode, frameErrors: g.frameErrors, lastError: g.lastError ? String(g.lastError.stack).slice(0, 300) : null,
    lit: g.grid.lights.filter(l => l.powered).length, blown: g.grid.lights.filter(l => l.failed === 'exploded').length, flickering: g.grid.lights.filter(l => l.failed === 'faulty').length,
    frames: AP.frames, stuck: AP.stuck,
  });
})();
