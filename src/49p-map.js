/* ==========================================================================
   BLACKTHORN MANOR — 6x. THE ESTATE PLAN
   M (or from the phone): the old surveyor's plan of the estate, inked on
   yellowed paper. Every building, path and water; a red arrow for you and
   which way you face; a tick by each place you have been; a warm glow on
   every place whose lights are burning; and a small star wherever you
   found one of Eleanor's things.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const W = 900, H = 1094, S = 6.4, X0 = -66, Z0 = -58, M = 28;
const X = x => M + (x - X0) * S, Y = z => M + (z - Z0) * S;

/* the places on the plan: a shape, a name, and the estate light group that lights it */
const PLACES = [
  { id: 'house', name: 'BLACKTHORN MANOR', rect: [-18, 18, -12, 12], lit: 'main', big: true },
  { id: 'walled', name: 'Walled garden', rect: [-18, 18, -30, -12], outline: true },
  { id: 'lodge', name: 'Lodge', rect: [-14, -6, 80, 88], lit: 'gate' },
  { id: 'gates', name: 'Gates', circle: [0, 88, 1.5], lit: 'gate', mark: true },
  { id: 'fountain', name: 'Fountain', circle: [0, 24, 3.2], lit: 'garden', water: true },
  { id: 'coach', name: 'Coach house', rect: [34, 50, -6, 4], lit: 'garage' },
  { id: 'shed', name: 'Shed', rect: [-32, -27, -4, 2], lit: 'shed' },
  { id: 'glass', name: 'Glass house', rect: [-52, -38, -28, -20], lit: 'glasshouse', glass: true },
  { id: 'stables', name: 'Stables', rect: [-58, -40, -4, 2], lit: 'stables' },
  { id: 'maze', name: 'The maze', rect: [-60, -39, 28, 49], lit: 'garden', maze: true },
  { id: 'pool', name: 'Pool garden', rect: [-46, -24, 53, 71], lit: 'pool', pool: true },
  { id: 'pond', name: 'Pond', circle: [34, 62, 6.2], lit: 'pond', water: true },
  { id: 'cemetery', name: 'Cemetery', rect: [30, 46, 30, 44], lit: 'cemetery', outline: true, graves: true },
  { id: 'chapel', name: 'Chapel', rect: [53, 61, 31, 37], lit: 'cemetery' },
  { id: 'mausoleum', name: 'Mausoleum', rect: [35, 47, 14, 25], lit: 'cemetery' },
  { id: 'tennis', name: 'Tennis court', rect: [-17, 17, -50.6, -33.6], lit: 'flood', outline: true, court: true },
  { id: 'lake', name: 'The lake', lake: true, lit: 'lake' },
  { id: 'boathouse', name: 'Boathouse', rect: [46, 52, -22, -14], lit: 'lake' },
  { id: 'island', name: 'Island', circle: [54.6, -37.2, 3.4], lit: 'lake', isle: true },
  { id: 'folly', name: 'Folly tower', rect: [50.9, 54.3, 71.2, 77.6], lit: 'folly' },
  { id: 'icehouse', name: 'Ice house', circle: [-48, -44, 5.2], mound: true },
];
BM.MAP_PLACES = PLACES;
const centre = p => p.rect ? [(p.rect[0] + p.rect[1]) / 2, (p.rect[2] + p.rect[3]) / 2] : p.circle ? [p.circle[0], p.circle[1]] : [50, -33];
const near = (p, x, z, m) => {
  if (p.rect) return x > p.rect[0] - m && x < p.rect[1] + m && z > p.rect[2] - m && z < p.rect[3] + m;
  if (p.circle) return Math.hypot(x - p.circle[0], z - p.circle[1]) < p.circle[2] + m;
  const L = BM.ESTATE_PLACES && BM.ESTATE_PLACES.LK; return L ? Math.hypot((x - L.cx) / (L.rx + m), (z - L.cz) / (L.rz + m)) < 1 : false;
};

function lakePath(g, grow) {
  const L = BM.ESTATE_PLACES.LK; g.beginPath();
  for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2, k = (1 + 0.06 * Math.sin(a * 3 + 0.7) + 0.04 * Math.sin(a * 5 + 2.1)) * (grow || 1);
    const x = X(L.cx + Math.sin(a) * L.rx * k), y = Y(L.cz + Math.cos(a) * L.rz * k); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath();
}

/* the paper and the fixed ink: drawn once */
function drawBase(game) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  if (!g || !g.fillRect) return c;
  // the paper: yellowed, foxed, darker at the edges
  g.fillStyle = '#d8c69c'; g.fillRect(0, 0, W, H);
  const rnd = BM.mulberry32(1961);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(120,90,40,${0.02 + rnd() * 0.05})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, 2 + rnd() * 26, 0, Math.PI * 2); g.fill(); }
  if (g.createRadialGradient) { const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(60,40,10,0)'); v.addColorStop(1, 'rgba(60,40,10,0.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
  const ink = '#3a2c1a', faint = 'rgba(58,44,26,0.45)';
  g.lineCap = 'round'; g.lineJoin = 'round';
  // the lane and the boundary wall
  g.fillStyle = 'rgba(90,70,40,0.25)'; g.fillRect(X(-66), Y(91.9), X(66) - X(-66), (4.2) * S);
  g.strokeStyle = ink; g.lineWidth = 4; g.strokeRect(X(-64), Y(-54), 128 * S, 142 * S);
  g.fillStyle = '#d8c69c'; g.fillRect(X(-4.2), Y(88) - 4, 8.4 * S, 8);                       // the gateway through the wall
  // trees: a scatter of little inked crowns
  const P = game.phys, solid = (x, z) => PLACES.some(p => near(p, x, z, 3)) || P.paths.some(pp => pp.pts && pp.pts.some((q, i) => i && segDist(pp.pts[i - 1], q, x, z) < pp.w / 2 + 2));
  g.strokeStyle = faint; g.lineWidth = 1;
  for (let i = 0; i < 520; i++) { const x = -62 + rnd() * 124, z = -52 + rnd() * 138; if (solid(x, z) || Math.hypot(x, z - 24) < 10 || Math.abs(x) < 6 && z > 28) continue;
    g.beginPath(); g.arc(X(x), Y(z), 3 + rnd() * 2.5, 0, Math.PI * 2); g.stroke(); }
  // paths and drives
  g.strokeStyle = 'rgba(120,90,50,0.55)';
  for (const p of P.paths) {
    if (p.ring) { g.lineWidth = p.w * S; g.beginPath(); g.arc(X(p.ring.cx), Y(p.ring.cz), p.ring.r * S, 0, Math.PI * 2); g.stroke(); continue; }
    if (!p.pts) continue;
    g.lineWidth = Math.max(4, p.w * S); g.beginPath(); p.pts.forEach(([x, z], i) => i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))); g.stroke();
  }
  // water
  const water = 'rgba(70,100,120,0.35)';
  if (BM.ESTATE_PLACES) { g.fillStyle = water; lakePath(g); g.fill(); g.strokeStyle = ink; g.lineWidth = 1.5; lakePath(g); g.stroke(); lakePath(g, 1.06); g.strokeStyle = faint; g.stroke(); }
  // the places
  g.font = 'italic 15px Georgia, serif'; g.textAlign = 'center';
  for (const p of PLACES) {
    g.strokeStyle = ink; g.lineWidth = 1.6;
    if (p.rect) {
      const [x0, x1, z0, z1] = p.rect, rx = X(x0), ry = Y(z0), rw = (x1 - x0) * S, rh = (z1 - z0) * S;
      if (p.pool) { g.fillStyle = water; g.fillRect(X(-44), Y(56), 8 * S, 12 * S); g.fillRect(X(-34), Y(55), 8 * S, 14 * S); g.strokeRect(rx, ry, rw, rh); }
      else if (p.maze) { g.strokeRect(rx, ry, rw, rh); g.strokeStyle = faint; for (let i = 1; i < 6; i++) { g.strokeRect(rx + i * 9, ry + i * 9, rw - i * 18, rh - i * 18); } }
      else if (p.court) { g.strokeRect(rx, ry, rw, rh); g.strokeStyle = faint; g.strokeRect(X(-5.5), Y(-48), 11 * S, 12.4 * S); g.beginPath(); g.moveTo(X(-5.5), Y(-42.1)); g.lineTo(X(5.5), Y(-42.1)); g.stroke(); }
      else if (p.outline) { g.setLineDash && g.setLineDash([5, 4]); g.strokeRect(rx, ry, rw, rh); g.setLineDash && g.setLineDash([]);
        if (p.graves) { g.fillStyle = faint; for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) g.fillRect(X(33.5 + k * 2.2) - 2, Y(32.5 + r * 4.5) - 4, 4, 8); } }
      else { g.fillStyle = p.glass ? 'rgba(160,190,170,0.5)' : 'rgba(58,44,26,0.75)'; g.fillRect(rx, ry, rw, rh); g.strokeRect(rx, ry, rw, rh);
        if (p.big) { g.fillStyle = 'rgba(58,44,26,0.85)'; for (const [tx, tz] of [[-21, 15], [21, 15], [-21, -15], [21, -15]]) { g.beginPath(); g.arc(X(tx), Y(tz), 3.2 * S, 0, Math.PI * 2); g.fill(); g.stroke(); } } }
    } else if (p.circle) {
      const [cx, cz, r] = p.circle;
      g.beginPath(); g.arc(X(cx), Y(cz), r * S, 0, Math.PI * 2);
      if (p.water) { g.fillStyle = water; g.fill(); g.stroke(); }
      else if (p.isle) { g.fillStyle = '#d0bc90'; g.fill(); g.stroke(); g.beginPath(); g.arc(X(55.1), Y(-37.5), 1.8 * S, 0, Math.PI * 2); g.stroke(); }
      else if (p.mound) { g.fillStyle = 'rgba(90,110,60,0.3)'; g.fill(); g.stroke(); g.fillStyle = ink; g.fillRect(X(cx) - 6, Y(cz + r) - 6, 12, 7); }
      else if (p.mark) { g.lineWidth = 3; g.beginPath(); g.moveTo(X(-3.8), Y(88)); g.lineTo(X(3.8), Y(88)); g.stroke(); }
    }
  }
  // the title, a north arrow and a scale
  g.fillStyle = 'rgba(216,198,156,0.9)'; g.fillRect(X(-62), Y(74), 190, 58); g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(X(-62) + 4, Y(74) + 4, 182, 50);
  g.fillStyle = ink; g.textAlign = 'center'; g.font = '14px Georgia, serif'; g.fillText('THE BLACKTHORN ESTATE', X(-62) + 95, Y(74) + 27); g.font = 'italic 12px Georgia, serif'; g.fillText('surveyed for J. Blackthorn, 1961', X(-62) + 95, Y(74) + 45);
  const nx = X(58), ny = Y(-48); g.beginPath(); g.moveTo(nx, ny - 26); g.lineTo(nx + 9, ny + 8); g.lineTo(nx, ny); g.lineTo(nx - 9, ny + 8); g.closePath(); g.fill(); g.font = '15px Georgia, serif'; g.fillText('N', nx, ny - 32);
  g.fillRect(X(36), Y(84), 20 * S, 3); g.font = 'italic 11px Georgia, serif'; g.fillText('20 yards', X(36) + 10 * S, Y(84) - 6);
  g.font = 'italic 13px Georgia, serif'; g.fillText('THE LANE', X(30), Y(94) + 4);
  return c;
}
function segDist(a, b, x, z) { const vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx * vx + vz * vz || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / L2)); return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); }

class EstateMap {
  constructor(game) {
    this.game = game; this.t = 0;
    if (typeof document === 'undefined' || !document.body) return;
    const st = document.createElement('style');
    st.textContent = '#estate-map { display: none; position: fixed; inset: 0; z-index: 15; background: rgba(0,0,0,.72); align-items: center; justify-content: center; flex-direction: column; } #estate-map canvas { max-height: 88vh; max-width: 94vw; box-shadow: 0 0 60px rgba(0,0,0,.9); } #estate-map .hint { font: 13px Georgia, serif; color: #cdbd9c; opacity: .7; margin-top: 8px; }';
    document.head.appendChild(st);
    const el = this.el = document.createElement('div'); el.id = 'estate-map';
    this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H;
    const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = '✓ been there · ● lights on · ★ something of Eleanor\'s · M or Esc to close';
    el.appendChild(this.canvas); el.appendChild(hint); document.body.appendChild(el);
  }
  visited() { const s = this.game.story; return s.visited || (s.visited = {}); }
  /* every frame: tick off places as you reach them */
  track() {
    const p = this.game.player, v = this.visited();
    for (const pl of PLACES) if (!v[pl.id] && near(pl, p.x, p.z, 4)) v[pl.id] = true;
  }
  isLit(pl) {
    const g = this.game, grid = g.grid;
    if (!pl.lit) return false;
    if (pl.lit === 'main') return grid.live('main');
    return grid.lodge && g.estateLights[pl.lit] && g.estateGroupOn(pl.lit);
  }
  draw() {
    const g0 = this.canvas && this.canvas.getContext('2d'); if (!g0 || !g0.drawImage) return;
    if (!this.base) this.base = drawBase(this.game);
    const g = g0, game = this.game, v = this.visited(), p = game.player;
    g.drawImage(this.base, 0, 0);
    // lit places glow; visited places get a tick; every place its name
    g.textAlign = 'center';
    for (const pl of PLACES) {
      const [cx, cz] = centre(pl), lit = this.isLit(pl);
      if (lit && g.createRadialGradient) { const r = 46, gr = g.createRadialGradient(X(cx), Y(cz), 2, X(cx), Y(cz), r); gr.addColorStop(0, 'rgba(255,200,80,0.55)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(X(cx) - r, Y(cz) - r, r * 2, r * 2); }
      const ly = pl.rect && !pl.outline && !pl.maze ? Y(pl.rect[2]) - 7 : (pl.lake ? Y(cz - 7) : Y(cz)) + (pl.lake ? 0 : pl.circle ? pl.circle[2] * S + 15 : 5);
      g.font = pl.big ? '18px Georgia, serif' : 'italic 14px Georgia, serif';
      g.fillStyle = v[pl.id] ? '#2a1e0e' : 'rgba(58,44,26,0.55)';
      g.fillText((v[pl.id] ? '✓ ' : '') + pl.name + (lit ? ' ●' : ''), pl.big ? X(cx) : X(cx), pl.big ? Y(cz) + 6 : ly);
    }
    // Eleanor's things, where you found them
    const found = BM.ELEANOR_TRAIL.map(([id]) => id).concat(['icehouse-case', 'journal']).filter(id => game.story.read.has(id) && game.byId[id]);
    g.fillStyle = '#8a1a10'; g.font = '16px Georgia, serif';
    for (const id of found) { const it = game.byId[id]; g.fillText('★', X(it.pos.x), Y(it.pos.z) + 5); }
    // you are here
    const ax = X(p.x), ay = Y(p.z), dx = -Math.sin(p.yaw), dy = -Math.cos(p.yaw);
    g.fillStyle = '#b01810'; g.strokeStyle = '#3a0a04'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(ax + dx * 16, ay + dy * 16); g.lineTo(ax - dx * 7 - dy * 8, ay - dy * 7 + dx * 8); g.lineTo(ax - dx * 3, ay - dy * 3); g.lineTo(ax - dx * 7 + dy * 8, ay - dy * 7 - dx * 8); g.closePath(); g.fill(); g.stroke();
    const floor = p.y < -1 ? ' (below ground)' : p.y > 7.5 ? ' (attic)' : p.y > 3.5 && Math.abs(p.x) < 18.5 && Math.abs(p.z) < 12.5 ? ' (first floor)' : '';
    g.font = 'italic 13px Georgia, serif'; g.fillStyle = '#8a1a10'; g.textAlign = 'left';
    g.fillText('You are here' + floor, Math.min(W - 160, ax + 14), Math.max(20, ay - 12));
    // a count in the corner
    const n = PLACES.filter(pl => v[pl.id]).length;
    g.textAlign = 'right'; g.fillStyle = '#3a2c1a'; g.font = 'italic 13px Georgia, serif';
    g.fillText(n + ' of ' + PLACES.length + ' places visited', W - 34, H - 30);
  }
  open() { if (this.el) this.el.style.display = 'flex'; this.draw(); }
  close() { if (this.el) this.el.style.display = 'none'; }
}
BM.EstateMap = EstateMap;

BM.updateMap = function (game, dt) {
  const m = game.map; if (!m) return;
  m.track();
  if (game.ui.mode === 'map') { m.t -= dt; if (m.t <= 0) { m.t = 0.1; m.draw(); } }
};
})();
