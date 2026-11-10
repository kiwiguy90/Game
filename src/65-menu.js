/* ==========================================================================
   BLACKTHORN MANOR — 7a. THE MENU, SETTINGS AND MOUSE LOOK
   Click the view to look round with the mouse (the pointer is captured);
   Esc releases it and pauses. The pause menu holds the settings: mouse
   sensitivity, invert, volume, graphics, field of view, subtitles, and
   the controls. Settings are remembered between visits on this machine.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const KEY = 'blackthorn-manor-settings';
const DEFAULTS = { sens: 1.0, invert: false, volume: 0.8, quality: 'auto', fov: 70, showObjective: true };
const QUALITY = ['auto', 'low', 'medium', 'high'];

function load() {
  try { const s = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return Object.assign({}, DEFAULTS, s); } catch (e) { return Object.assign({}, DEFAULTS); }
}
function save(s) { try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window: keep them for this visit only */ } }

const CSS = `
#pause { display: none; position: fixed; inset: 0; background: rgba(4,3,2,.82); align-items: center; justify-content: center; z-index: 20; font-family: Georgia, 'Times New Roman', serif; }
#pause .box { width: min(520px, 90vw); max-height: 90vh; overflow-y: auto; padding: 28px 34px; border: 1px solid #4a3c28; background: rgba(18,14,10,.95); box-shadow: 0 0 60px rgba(0,0,0,.8); }
#pause h2 { margin: 0 0 18px; font-weight: normal; letter-spacing: .18em; font-size: 26px; color: #e6d8bc; text-align: center; }
#pause .row { display: grid; grid-template-columns: 1fr 180px 44px; align-items: center; gap: 10px; margin: 10px 0; font-size: 15px; }
#pause .row label { opacity: .85; }
#pause .row .v { text-align: right; opacity: .6; font-size: 13px; }
#pause input[type=range] { width: 100%; accent-color: #c89a48; }
#pause select { background: #221a12; color: #e6d8bc; border: 1px solid #5a4a34; padding: 3px 6px; font-family: inherit; }
#pause input[type=checkbox] { accent-color: #c89a48; width: 18px; height: 18px; }
#pause .btns { display: flex; gap: 10px; justify-content: center; margin-top: 22px; flex-wrap: wrap; }
#pause button { background: #2a2016; color: #ecdcbc; border: 1px solid #6a5434; padding: 9px 20px; font-family: inherit; font-size: 15px; letter-spacing: .06em; cursor: pointer; }
#pause button:hover { background: #3a2c1c; }
#pause button.main { background: #5a4220; border-color: #a07a40; }
#pause .keys { margin-top: 18px; font-size: 12.5px; line-height: 1.75; opacity: .62; columns: 2; column-gap: 24px; }
#pause .keys b { color: #e8c070; font-weight: normal; }
#clickhint { position: fixed; left: 50%; top: 58%; transform: translateX(-50%); font-size: 14px; opacity: 0; transition: opacity .6s; pointer-events: none; text-shadow: 0 0 6px #000; letter-spacing: .05em; }
`;

class Menu {
  constructor(game) {
    this.game = game;
    this.settings = load();
    this.locked = false;
    this.hintT = 0;
    if (typeof document === 'undefined' || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = this.el = document.createElement('div'); el.id = 'pause';
    el.innerHTML = `<div class="box"><h2>PAUSED</h2>
      <div class="row"><label>Mouse sensitivity</label><input id="m-sens" type="range" min="0.2" max="3" step="0.05"><span class="v" id="m-sens-v"></span></div>
      <div class="row"><label>Invert mouse</label><input id="m-invert" type="checkbox"><span></span></div>
      <div class="row"><label>Volume</label><input id="m-vol" type="range" min="0" max="1" step="0.05"><span class="v" id="m-vol-v"></span></div>
      <div class="row"><label>Field of view</label><input id="m-fov" type="range" min="55" max="95" step="1"><span class="v" id="m-fov-v"></span></div>
      <div class="row"><label>Graphics</label><select id="m-q">${QUALITY.map(q => `<option value="${q}">${q[0].toUpperCase() + q.slice(1)}</option>`).join('')}</select><span></span></div>
      <div class="row"><label>Show objective</label><input id="m-subs" type="checkbox"><span></span></div>
      <div class="btns"><button class="main" id="m-resume">Resume</button><button id="m-restart">Start again</button></div>
      <div class="keys"><b>Mouse</b> look · <b>Click</b> capture mouse<br><b>W A S D</b> move · <b>Shift</b> run<br><b>← →</b> turn · <b>R / F</b> look up / down<br><b>Space</b> jump · <b>E</b> use, open, read<br><b>T</b> torch · <b>P</b> phone and notes<br><b>L</b> lighting panel · <b>O / I</b> master switches<br><b>1 – 0</b> estate lights · <b>Esc</b> pause</div>
    </div>`;
    document.body.appendChild(el);
    const hint = this.hint = document.createElement('div'); hint.id = 'clickhint'; hint.textContent = 'Click to look around with the mouse'; document.body.appendChild(hint);
    const $ = id => document.getElementById(id);
    this.inputs = { sens: $('m-sens'), invert: $('m-invert'), vol: $('m-vol'), fov: $('m-fov'), q: $('m-q'), subs: $('m-subs') };
    const I = this.inputs;
    const sync = () => {
      const s = this.settings;
      I.sens.value = s.sens; I.invert.checked = s.invert; I.vol.value = s.volume; I.fov.value = s.fov; I.q.value = s.quality; I.subs.checked = s.showObjective;
      $('m-sens-v').textContent = (+s.sens).toFixed(2); $('m-vol-v').textContent = Math.round(s.volume * 100) + '%'; $('m-fov-v').textContent = s.fov + '°';
    };
    this.sync = sync; sync();
    const change = () => {
      const s = this.settings;
      s.sens = +I.sens.value; s.invert = I.invert.checked; s.volume = +I.vol.value; s.fov = +I.fov.value; s.quality = I.q.value; s.showObjective = I.subs.checked;
      save(s); sync(); this.apply();
    };
    for (const k in I) { I[k].addEventListener('input', change); I[k].addEventListener('change', change); }
    $('m-resume').addEventListener('click', e => { e.stopPropagation(); this.resume(); });
    $('m-restart').addEventListener('click', e => { e.stopPropagation(); if (window.confirm('Start again from the beginning? Your progress tonight will be lost.')) window.location.reload(); });
    // the pointer: capture on a click in the view, pause when it is let go mid-game
    const canvas = game.renderer && game.renderer.domElement;
    if (canvas) canvas.addEventListener('click', () => { if (this.playing()) this.lock(); });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked && this.playing() && !game.ui.mode) this.pause();
    });
    document.addEventListener('mousemove', e => {
      if (!this.locked || game.ui.mode || game.intro || game.outro) return;
      const k = 0.0022 * this.settings.sens, p = game.player;
      p.yaw -= e.movementX * k;
      p.pitch = Math.max(-1.25, Math.min(1.25, p.pitch - e.movementY * k * (this.settings.invert ? -1 : 1)));
      game.mouseLook = true;
    });
  }
  playing() { const g = this.game; return g.ui.mode !== 'title' && g.ui.mode !== 'ending' && !g.intro && !g.outro && !(g.story && g.story.ended); }
  lock() { const c = this.game.renderer && this.game.renderer.domElement; if (c && c.requestPointerLock && !this.locked) { try { const r = c.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed here */ } } }
  unlock() { if (typeof document !== 'undefined' && document.exitPointerLock && this.locked) document.exitPointerLock(); }
  /* push the settings into the game */
  apply() {
    const g = this.game, s = this.settings;
    if (g.audio && g.audio.master) g.audio.master.gain.value = s.volume;
    if (g.audio) g.audio.volume = s.volume;
    if (g.camera && g.camera.fov !== s.fov) { g.camera.fov = s.fov; g.camera.updateProjectionMatrix(); }
    if (g.quality) {
      const i = QUALITY.indexOf(s.quality) - 1;
      g.quality.fixed = i >= 0;
      if (i >= 0 && g.quality.level !== i) { g.quality.level = i; g.applyQuality(BM.QUALITY_LEVELS[i]); }
    }
    if (g.ui && g.ui.el && g.ui.el.objective) g.ui.el.objective.style.display = s.showObjective ? '' : 'none';
  }
  pause() {
    const g = this.game; if (!this.playing() || g.ui.mode) return;
    g.ui.mode = 'pause'; g.keys = {};
    if (this.el) { this.sync && this.sync(); this.el.style.display = 'flex'; }
    if (BM.Save && !g.headless) BM.Save.write(g);
    if (g.audio && g.audio.ctx && g.audio.ctx.suspend) g.audio.ctx.suspend().catch(() => {});
    this.unlock();
  }
  resume() {
    const g = this.game; if (g.ui.mode !== 'pause') return;
    g.ui.mode = null;
    if (this.el) this.el.style.display = 'none';
    if (g.audio && g.audio.ctx && g.audio.ctx.resume) g.audio.ctx.resume().catch(() => {});
    this.lock();
  }
  /* per frame: remind a player who has not found the mouse yet */
  update(dt) {
    if (!this.hint) return;
    const show = this.playing() && !this.game.ui.mode && !this.locked && !this.game.mouseLook;
    this.hintT = show ? this.hintT + dt : 0;
    this.hint.style.opacity = this.hintT > 3 ? '0.75' : '0';
  }
}
BM.Menu = Menu;
})();
