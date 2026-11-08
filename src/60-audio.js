/* ==========================================================================
   BLACKTHORN MANOR — 8. SOUND
   Everything is synthesised with the Web Audio API. No sound files.
   Loops are built once; per-frame work only moves gains and pans.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

/* What each kind of fitting sounds like when lit. */
const HUM = {
  incandescent: { freq: 50, filter: 120, gain: 0.018, reach: 6 },
  lamp: { freq: 50, filter: 110, gain: 0.014, reach: 4 },
  bang: { freq: 50, filter: 120, gain: 0.018, reach: 6 },
  fluorescent: { freq: 100, filter: 1300, gain: 0.03, reach: 8 },
  sodium: { freq: 100, filter: 420, gain: 0.03, reach: 12 },
  emergency: { freq: 100, filter: 700, gain: 0.012, reach: 6 },
};
BM.HUM = HUM;

class Synth {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.loops = {};
    this.enabled = false;
  }

  start() {
    if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.resume) this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(ctx.destination);
    // shared noise buffers
    const len = ctx.sampleRate * 2;
    this.white = ctx.createBuffer(1, len, ctx.sampleRate);
    this.brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const w = this.white.getChannelData(0), b = this.brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const r = Math.random() * 2 - 1; w[i] = r; last = (last + 0.02 * r) / 1.02; b[i] = last * 3.5; }
    // ambient and positional loops (built once)
    this.loops.rain = this.noiseLoop(this.white, 'bandpass', 1400, 0.6);
    this.loops.rainLow = this.noiseLoop(this.brown, 'lowpass', 400, 0.7);
    this.loops.wind = this.noiseLoop(this.brown, 'bandpass', 260, 3);
    this.loops.hum = this.toneLoop('sawtooth', 50, 'lowpass', 180);
    // a small pool of hum voices, reassigned each frame to the nearest lit fittings
    this.hum = [];
    for (let i = 0; i < Synth.HUM_VOICES; i++) {
      const v = this.toneLoop('sawtooth', 50, 'bandpass', 160);
      v.f.Q.value = 2.5;
      v.src.detune.value = (i - 2) * 7;
      this.hum.push(v);
    }
    this.loops.motor = this.toneLoop('square', 36, 'lowpass', 180);
    this.loops.fan = this.noiseLoop(this.white, 'bandpass', 600, 1.5);
    this.loops.radio = this.noiseLoop(this.white, 'bandpass', 2400, 2.5);
    this.loops.radioTone = this.toneLoop('triangle', 330, 'lowpass', 1500);
    this.loops.tv = this.noiseLoop(this.white, 'highpass', 5000, 0.7);
    this.loops.kettle = this.noiseLoop(this.brown, 'lowpass', 300, 1.5);
    this.loops.heater = this.noiseLoop(this.white, 'bandpass', 3500, 4);
    this.loops.fridge = this.toneLoop('sawtooth', 48, 'lowpass', 160);
    this.loops.record = this.toneLoop('triangle', 262, 'lowpass', 1400);
    this.loops.recordBass = this.toneLoop('sine', 131, 'lowpass', 400);
    this.loops.fire = this.noiseLoop(this.brown, 'lowpass', 900, 0.8);
    this.loops.fountain = this.noiseLoop(this.white, 'bandpass', 1400, 0.6);
    this.loops.lift = this.toneLoop('sawtooth', 46, 'lowpass', 180); // the lift motor, felt more than heard
    this.loops.engine = this.toneLoop('sawtooth', 38, 'lowpass', 240);
    // the car radio: a song sequenced live through a small, tinny speaker
    { const g = ctx.createGain(); g.gain.value = 0; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7;
      const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 2600;
      f.connect(f2); f2.connect(g); g.connect(this.master);
      this.loops.song = { g, f, bus: f }; this.songBeat = 0; this.songNext = 0; }
    this.enabled = true;
  }

  noiseLoop(buffer, type, freq, q) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(this.master); } else g.connect(this.master);
    src.start();
    return { src, f, g, p };
  }
  toneLoop(type, freq, ftype, ffreq) {
    const ctx = this.ctx, o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.value = ffreq;
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(this.master); } else g.connect(this.master);
    o.start();
    return { src: o, f, g, p };
  }
  set(loop, gain, pan) {
    const l = this.loops[loop]; if (!l) return;
    (this.levels || (this.levels = {}))[loop] = gain;
    const t = this.ctx.currentTime;
    l.g.gain.setTargetAtTime(Math.max(0, gain), t, 0.08);
    if (l.p && pan !== undefined) l.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.08);
  }

  /* one-shots */
  burst(buffer, type, freq, q, gain, attack, decay, when, pan) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + (when || 0);
    const s = ctx.createBufferSource(); s.buffer = buffer;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    s.connect(f); f.connect(g);
    if (pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.master); } else g.connect(this.master);
    s.loop = true;
    s.start(t, Math.random() * 1.5); s.stop(t + attack + decay + 0.1);
    return { f, g };
  }
  tone(type, f0, f1, gain, attack, decay, when) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + attack + decay);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + attack + decay + 0.1);
  }

  thunder(delay, loudness) {
    if (!this.ctx) return;
    const L = loudness || 0.6;
    const close = L > 0.85;
    if (close) this.burst(this.white, 'highpass', 1800, 0.5, 0.9, 0.003, 0.25, delay);
    this.burst(this.brown, 'lowpass', close ? 900 : 280 + L * 300, 0.6, 1.3 * L, 0.05, 2.5 + L * 2, delay);
    this.burst(this.brown, 'lowpass', 160, 1.2, 1.0 * L, 0.6, 3.5 + L * 3, delay + 0.3);
  }
  clunk(v) { v = v === undefined ? 1 : v; this.tone('sine', 90, 40, 0.5 * v, 0.005, 0.18); this.burst(this.white, 'lowpass', 900, 1, 0.3 * v, 0.002, 0.08); }
  click() { this.burst(this.white, 'highpass', 3000, 1, 0.25, 0.001, 0.03); }
  lever() { this.clunk(); this.burst(this.white, 'bandpass', 500, 2, 0.4, 0.01, 0.35, 0.05); this.tone('sine', 60, 50, 0.3, 0.2, 1.6, 0.1); }
  bang(v) { v = v === undefined ? 1 : v; this.burst(this.white, 'highpass', 900, 0.6, 1.2 * v, 0.001, 0.12); this.burst(this.brown, 'lowpass', 600, 1, 0.8 * v, 0.002, 0.5); this.tone('square', 2400, 300, 0.2 * v, 0.001, 0.08); for (let i = 0; i < 4; i++) this.tone('sine', 3200 + i * 700, 3000 + i * 600, 0.05 * v, 0.001, 0.06, 0.08 + i * 0.07); }
  tink() { this.tone('sine', 2600, 2400, 0.06, 0.001, 0.05); }
  denied() { this.tone('square', 220, 200, 0.2, 0.01, 0.18); this.tone('square', 165, 150, 0.2, 0.01, 0.25, 0.2); }
  accept() { this.tone('sine', 660, 660, 0.15, 0.01, 0.12); this.tone('sine', 880, 880, 0.12, 0.01, 0.15, 0.12); }
  /* A bell: a strike, then the partials of a cast bell dying away at their own rates. */
  bell(f, gain, when, decay) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + (when || 0), D = decay || 3;
    const partials = [[0.5, 0.55, 1.6], [1.0, 1.0, 1.0], [1.19, 0.35, 0.7], [1.5, 0.45, 0.8], [2.0, 0.6, 0.55], [2.51, 0.22, 0.4], [3.0, 0.12, 0.3], [4.2, 0.06, 0.2]];
    const out = ctx.createGain(); out.gain.value = 1; out.connect(this.master);
    for (const [r, a, dk] of partials) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * a * 0.5), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + D * dk);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + D * dk + 0.1);
    }
    this.burst(this.white, 'bandpass', f * 4, 3, gain * 0.5, 0.001, 0.05, when || 0);
  }
  /* The song on the car radio: a slow seventies ballad in A minor, scheduled a few beats ahead. */
  songUpdate(level) {
    if (!this.ctx || !this.loops.song) return;
    const ctx = this.ctx, bus = this.loops.song.bus, BPM = 76, beat = 60 / BPM;
    if (level <= 0.001) { this.songNext = 0; return; }
    if (!this.songNext || this.songNext < ctx.currentTime - 1) { this.songNext = ctx.currentTime + 0.1; this.songBeat = 0; }
    const CH = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 164.8, 196], [196, 246.9, 293.7]]; // Am F C G
    const MEL = [440, 0, 523.3, 493.9, 440, 0, 392, 0, 349.2, 0, 440, 0, 392, 349.2, 329.6, 0, 261.6, 0, 329.6, 392, 440, 0, 523.3, 0, 493.9, 0, 440, 392, 349.2, 0, 329.6, 0];
    while (this.songNext < ctx.currentTime + 0.4) {
      const b = this.songBeat, t = this.songNext, bar = Math.floor(b / 4) % 4, ch = CH[bar];
      if (b % 2 === 0) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = ch[0] / 2; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 1.8); o.connect(g); g.connect(bus); o.start(t); o.stop(t + beat * 2); }
      if (b % 4 === 0) for (const f of ch) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 3.8); o.connect(g); g.connect(bus); o.start(t); o.stop(t + beat * 4); }
      const m = MEL[b % MEL.length];
      if (m) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = m; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.95); o.connect(g); g.connect(bus); o.start(t); o.stop(t + beat); }
      // the brush on the snare
      if (b % 2 === 1) this.burst(this.white, 'highpass', 4000, 1, 0.05, 0.002, 0.08, t - ctx.currentTime);
      this.songNext += beat; this.songBeat++;
    }
  }
  /* changing a wheel: the jack's ratchet, the nuts spun off and on, the wheel dropped */
  wheelChange(dur) {
    if (!this.ctx) return;
    for (let i = 0; i < 12; i++) this.burst(this.white, 'bandpass', 1800, 6, 0.25, 0.002, 0.05, 0.3 + i * 0.22);   // jack
    for (let i = 0; i < 5; i++) { const t = 3.2 + i * 0.5; this.tone('square', 90, 60, 0.2, 0.01, 0.3, t); this.burst(this.white, 'bandpass', 2500, 3, 0.2, 0.005, 0.25, t); } // nuts off
    this.burst(this.brown, 'lowpass', 300, 1, 0.5, 0.01, 0.3, 5.9);                                              // the flat dropped
    for (let i = 0; i < 5; i++) { const t = 6.4 + i * 0.4; this.tone('square', 110, 80, 0.2, 0.01, 0.25, t); this.burst(this.white, 'bandpass', 2800, 3, 0.18, 0.005, 0.2, t); } // nuts on
    for (let i = 0; i < 6; i++) this.burst(this.white, 'bandpass', 1600, 6, 0.2, 0.002, 0.05, 8.3 + i * 0.1);     // jack down
  }
  /* a sash window in dry runners, and the curtain rings along a brass pole */
  sash(up) { this.burst(this.white, 'bandpass', 700, 2, 0.35, 0.01, 0.9); this.tone('sawtooth', 55, up ? 70 : 45, 0.12, 0.05, 0.8); this.tone('sine', 140, 80, 0.4, 0.003, 0.25, 0.95); }
  curtains() { for (let i = 0; i < 14; i++) this.burst(this.white, 'bandpass', 3200 + Math.random() * 1500, 6, 0.12, 0.001, 0.04, i * 0.085 + Math.random() * 0.03); this.burst(this.brown, 'lowpass', 500, 1, 0.25, 0.1, 1.1); }
  /* the storm cellar's bolt and its steel doors */
  stormBolt(home) { this.burst(this.white, 'bandpass', 2200, 8, 0.4, 0.01, 0.6); this.tone('sawtooth', 600, home ? 300 : 900, 0.15, 0.05, 0.5); this.tone('sine', 120, 60, 0.4, 0.004, 0.3, 0.55); }
  stormDoors(opening) { this.burst(this.white, 'bandpass', 900, 3, 0.35, 0.01, 1.4); this.tone('sawtooth', 70, 50, 0.3, 0.3, 1.5); this.tone('sine', 140, 40, 0.8, 0.004, 1.6, opening ? 2.0 : 2.1); this.burst(this.brown, 'lowpass', 400, 1, 0.6, 0.005, 0.8, opening ? 2.0 : 2.1); }
  /* the starter motor turning the engine over */
  crank() { for (let i = 0; i < 6; i++) { this.tone('sawtooth', 90, 70, 0.25, 0.01, 0.12, i * 0.27); this.burst(this.brown, 'lowpass', 400, 1, 0.3, 0.01, 0.2, i * 0.27); } this.burst(this.brown, 'lowpass', 300, 1, 0.6, 0.05, 1.2, 1.7); }
  /* the engine warning: a soft electronic ping */
  warnPing() { for (let i = 0; i < 3; i++) this.tone('sine', 1760, 1760, 0.12, 0.005, 0.25, i * 0.5); }
  /* the escapement of the tower clock: tick, tock */
  tick(v, tock) {
    if (!this.ctx || v <= 0) return;
    this.burst(this.white, 'bandpass', tock ? 1900 : 2600, 6, 0.35 * v, 0.001, 0.045);
    this.tone('square', tock ? 180 : 240, tock ? 120 : 160, 0.12 * v, 0.001, 0.05);
  }
  /* a wooden door on dry hinges: a short stick-slip creak, higher and thinner than the gates */
  doorCreak(dur, gain) {
    if (!this.ctx) return;
    const ctx = this.ctx, g0 = gain || 0.4, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(16, t); o.frequency.linearRampToValueAtTime(9, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 12;
    f.frequency.setValueAtTime(1700, t); f.frequency.linearRampToValueAtTime(2300, t + dur * 0.6); f.frequency.linearRampToValueAtTime(1400, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    let tt = t;
    while (tt < t + dur) { const seg = 0.12 + Math.random() * 0.3; g.gain.linearRampToValueAtTime((0.2 + Math.random() * 0.8) * 0.3 * g0, tt + seg * 0.5); g.gain.linearRampToValueAtTime(0.02 * g0, tt + seg); tt += seg; }
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
    o.connect(f); f.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.4);
  }
  /* a door meeting its frame and the latch dropping */
  latch(gain) {
    const v = gain === undefined ? 1 : gain;
    this.tone('sine', 120, 60, 0.35 * v, 0.004, 0.25);
    this.burst(this.white, 'lowpass', 1200, 1, 0.3 * v, 0.002, 0.08);
    this.burst(this.white, 'bandpass', 3200, 4, 0.2 * v, 0.001, 0.05, 0.09);
  }
  /* the gates meeting: iron on iron, then the bolt */
  gateBang(v) {
    v = v === undefined ? 1 : v;
    this.burst(this.white, 'bandpass', 900, 1.5, 0.7 * v, 0.002, 0.5);
    this.tone('sine', 110, 35, 0.6 * v, 0.004, 1.4);
    this.burst(this.brown, 'lowpass', 200, 1, 0.5 * v, 0.01, 1.8);
    this.tone('square', 240, 180, 0.3 * v, 0.005, 0.12, 1.1);   // the bolt
    this.burst(this.white, 'highpass', 2500, 1, 0.3 * v, 0.001, 0.06, 1.1);
  }
  rattle() { for (let i = 0; i < 5; i++) this.burst(this.white, 'bandpass', 1800 + i * 200, 4, 0.35, 0.002, 0.07, i * 0.06); }
  caw(pan, v) {
    // a crow: two or three harsh, nasal calls
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const w = i * (0.32 + Math.random() * 0.1);
      this.tone('sawtooth', 820, 560, 0.09 * v, 0.02, 0.2, w);
      this.burst(this.white, 'bandpass', 1500, 4, 0.12 * v, 0.01, 0.18, w, pan);
    }
  }
  /* A tyre blowing out at speed: a crack like a shot, a thump through the floor. */
  tyreBang() {
    this.burst(this.white, 'lowpass', 4000, 0.7, 1.0, 0.001, 0.22);
    this.tone('sine', 95, 28, 0.9, 0.002, 0.6);
    this.burst(this.brown, 'lowpass', 300, 1, 0.7, 0.005, 1.0);
    this.burst(this.white, 'bandpass', 900, 2, 0.25, 0.01, 0.5, 0.05);
  }
  /* The flat slapping round: rubber on the arch, once a turn. */
  flap(v) {
    v = v === undefined ? 1 : v;
    this.burst(this.brown, 'lowpass', 380, 1.2, 0.42 * v, 0.003, 0.09);
    this.burst(this.white, 'bandpass', 700, 2.5, 0.14 * v, 0.002, 0.06);
  }
  /* Under the bonnet something shorts: a sharp pop, then a long electrical fizzle. */
  pop() {
    this.burst(this.white, 'highpass', 1500, 0.8, 0.9, 0.001, 0.06);
    this.tone('square', 320, 70, 0.35, 0.002, 0.14);
    this.burst(this.white, 'highpass', 4200, 0.7, 0.16, 0.06, 1.9, 0.05);
    for (let i = 0; i < 46; i++) { const w = 0.05 + Math.pow(Math.random(), 1.6) * 1.9; this.burst(this.white, 'bandpass', 2500 + Math.random() * 4500, 9, 0.06 + Math.random() * 0.16, 0.001, 0.015 + Math.random() * 0.03, w); }
  }
  /* The lift: a clank as the brake lifts; at the floor, a clunk and a bell. */
  liftStart() { this.burst(this.brown, 'lowpass', 300, 1, 0.5, 0.005, 0.3); this.tone('square', 90, 60, 0.12, 0.005, 0.2); }
  liftStop() { this.burst(this.brown, 'lowpass', 260, 1, 0.55, 0.005, 0.35); this.tone('sine', 1318, 1318, 0.12, 0.005, 1.6, 0.35); this.tone('sine', 1046, 1046, 0.1, 0.005, 1.8, 0.8); }
  /* A loose shutter knocking back against the stone, and the creak of its hinges. */
  shutterKnock(v, pan) {
    this.burst(this.brown, 'lowpass', 520, 1.5, 0.55 * v, 0.003, 0.14, 0, pan);
    this.burst(this.white, 'bandpass', 1300, 3, 0.18 * v, 0.002, 0.07, 0, pan);
    if (Math.random() < 0.5) this.burst(this.brown, 'lowpass', 520, 1.5, 0.25 * v, 0.003, 0.1, 0.12 + Math.random() * 0.08, pan);
  }
  shutterCreak(v) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime, dur = 0.5 + Math.random() * 0.6;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = 380 + Math.random() * 200; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * (0.7 + Math.random() * 0.5), t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * v + 0.0002, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  /* The car's engine coughing and dying. */
  cough() {
    for (const [w, v] of [[0, 0.9], [0.45, 0.7], [0.8, 0.5], [1.05, 0.3]]) { this.burst(this.brown, 'lowpass', 260, 2, 0.8 * v, 0.01, 0.16, w); this.tone('sawtooth', 44, 26, 0.25 * v, 0.01, 0.2, w); }
  }
  quack() { this.tone('sawtooth', 520, 380, 0.08, 0.01, 0.12); this.tone('sawtooth', 500, 360, 0.07, 0.01, 0.1, 0.18); }
  step(surface) {
    const f = { stone: 1300, wood: 700, grass: 500, gravel: 2200, metal: 3000 }[surface] || 900;
    this.burst(this.white, surface === 'metal' ? 'bandpass' : 'lowpass', f, surface === 'metal' ? 6 : 1, surface === 'grass' ? 0.06 : 0.1, 0.004, 0.09);
    if (surface === 'wood' && Math.random() < 0.15) this.tone('sawtooth', 180, 120, 0.03, 0.05, 0.3, 0.05);
  }
  /* The front doors: a long two-stage groan. */
  groan() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (const [when, f0, f1, dur] of [[0, 95, 140, 1.1], [1.25, 120, 70, 1.9]]) {
      const t = ctx.currentTime + when;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 23; const lg = ctx.createGain(); lg.gain.value = 9;
      lfo.connect(lg); lg.connect(o.frequency);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 5;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.15);
      g.gain.setValueAtTime(0.35, t + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(this.master);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
    }
    this.clunk();
  }

  /* The nearest lit fittings and how loud each hums (follows its brightness, so a flicker crackles). */
  pickHums(p) {
    const out = [];
    for (const l of this.game.grid.lights) {
      if (l.intensity < 0.02 || l.kind === 'fire' || l.circuit === 'car') continue;
      const dx = l.pos.x - p.x, dy = l.pos.y - p.y, dz = l.pos.z - p.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const spec = HUM[l.kind] || HUM.incandescent;
      if (d > spec.reach) continue;
      const level = Math.min(1.3, l.intensity / Math.max(0.01, l.target));
      let gain = spec.gain * level * (1 - d / spec.reach) * (1 - d / spec.reach);
      // through a wall or a floor it is only a faint thrum
      if (this.game.phys.occluded(p.x, p.y, p.z, l.pos.x, l.pos.y, l.pos.z, 0.3)) gain *= 0.15;
      out.push({ light: l, d, gain });
    }
    out.sort((a, b) => b.gain - a.gain);
    return out.slice(0, Synth.HUM_VOICES);
  }

  /* The gates: bolts, then a long, uneven, creaking swing. */
  gateCreak(delay, dur, gain) {
    if (!this.ctx) return;
    const ctx = this.ctx, g0 = gain || 0.5;
    this.tone('square', 140, 90, 0.25 * g0, 0.002, 0.12, delay - 0.7); // the bolts shoot back
    this.burst(this.white, 'bandpass', 1500, 3, 0.3 * g0, 0.002, 0.2, delay - 0.68);
    for (const [f0, f1, off] of [[11, 7, 0], [14, 9, 0.35]]) {
      const t = ctx.currentTime + delay + off;
      // stick-slip: a slow pulse train exciting a high, narrow resonance — iron on iron
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 16;
      f.frequency.setValueAtTime(950 + off * 300, t); f.frequency.linearRampToValueAtTime(700 + off * 200, t + dur * 0.5); f.frequency.linearRampToValueAtTime(1150, t + dur);
      const low = ctx.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 260;
      const g = ctx.createGain(), lg = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); lg.gain.value = 0.35;
      // the creak swells and catches unevenly as the hinge binds
      let tt = t;
      while (tt < t + dur) {
        const seg = 0.25 + Math.random() * 0.6;
        g.gain.linearRampToValueAtTime((0.15 + Math.random() * 0.85) * 0.35 * g0, tt + seg * 0.5);
        g.gain.linearRampToValueAtTime(0.03 * g0, tt + seg);
        tt += seg;
      }
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
      o.connect(f); f.connect(g); o.connect(low); low.connect(lg); lg.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.5);
    }
    // the leaves come up against their stops
    this.tone('sine', 70, 45, 0.4 * g0, 0.005, 0.5, delay + dur + 0.1);
    for (let i = 0; i < 3; i++) this.burst(this.white, 'bandpass', 2200 - i * 300, 5, 0.25 * g0, 0.001, 0.25, delay + dur + 0.1 + i * 0.09);
  }

  /* Positional loop levels from the player's position, every frame. */
  update(dt, ctx) {
    if (!this.ctx || !this.enabled) return;
    const game = this.game, p = ctx.camPos, yaw = game.player.yaw, grid = game.grid;
    const near = (pos, r) => { const dx = pos.x - p.x, dy = (pos.y - p.y) * 1.5, dz = pos.z - p.z; const d = Math.sqrt(dx * dx + dy * dy + dz * dz); return Math.max(0, 1 - d / r); };
    const pan = (pos) => { const dx = pos.x - p.x, dz = pos.z - p.z; const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw); return Math.max(-1, Math.min(1, rx / (Math.abs(rx) + Math.abs(dx * Math.sin(yaw) + dz * Math.cos(yaw)) + 0.01))); };
    const zone = ctx.zone, storm = game.storm;
    const out = zone === 'exterior' ? 1 : zone === 'house' ? 0.3 : 0;
    // an open window lets the weather in
    let winIn = 0;
    for (const w of game.openWindows || []) winIn = Math.max(winIn, near({ x: w.x, y: w.y, z: w.z }, 9));
    this.set('rain', storm ? 0.2 * out + (zone === 'house' && p.y > 7.5 ? 0.15 : 0) + winIn * 0.22 : 0);
    this.set('rainLow', storm ? 0.25 * out : 0);
    this.set('wind', storm ? 0.12 * out + 0.04 + winIn * 0.1 : 0.02);
    // every lit fitting hums: the nearest ones get the voices
    this.humTargets = this.pickHums(p);
    const tNow = this.ctx.currentTime;
    for (let i = 0; i < this.hum.length; i++) {
      const v = this.hum[i], h = this.humTargets[i];
      if (!h) { v.g.gain.setTargetAtTime(0, tNow, 0.05); continue; }
      const spec = HUM[h.light.kind] || HUM.incandescent;
      v.src.frequency.setTargetAtTime(spec.freq, tNow, 0.05);
      v.f.frequency.setTargetAtTime(spec.filter, tNow, 0.05);
      v.g.gain.setTargetAtTime(h.gain, tNow, 0.02);
      if (v.p) v.p.pan.setTargetAtTime(pan(h.light.pos), tNow, 0.05);
    }
    // appliances
    let fan = 0, fanPos = null, radio = 0, radioPos = null, tv = 0, tvPos = null;
    const best = {};
    for (const a of grid.appliances) {
      if (!a.running && !(a.kind === 'heater' && a.glow > 0)) continue;
      const v = near(a.pos, a.kind === 'fan' ? 7 : a.kind === 'clock' ? 4 : a.kind === 'fridge' || a.kind === 'heater' || a.kind === 'kettle' ? 6 : 11);
      if (a.kind === 'fan' && v > fan) { fan = v; fanPos = a.pos; }
      if (a.kind === 'radio' && v > radio) { radio = v; radioPos = a.pos; }
      if (a.kind === 'tv' && v > tv) { tv = v; tvPos = a.pos; }
      if (!best[a.kind] || v > best[a.kind].v) best[a.kind] = { v, a };
    }
    this.applianceLevels = best;
    const lv = k => best[k] ? best[k].v : 0, pn = k => best[k] ? pan(best[k].a.pos) : 0;
    const k = best.kettle;
    this.set('kettle', k ? lv('kettle') * (0.04 + k.a.boil * 0.28) : 0, pn('kettle'));
    if (k) this.loops.kettle.f.frequency.setTargetAtTime(200 + k.a.boil * 2200, this.ctx.currentTime, 0.3);
    this.set('heater', lv('heater') * 0.02 * (best.heater ? best.heater.a.glow : 0), pn('heater'));
    this.set('fridge', best.fridge && best.fridge.a.compressor ? lv('fridge') * 0.1 : 0, pn('fridge'));
    this.set('record', lv('record') * 0.05, pn('record'));
    this.set('recordBass', lv('record') * 0.05, pn('record'));
    if (best.record && Math.random() < dt * 2.2) {
      const n = [262, 294, 330, 349, 392, 440, 392, 330][Math.floor(Math.random() * 8)], t0 = this.ctx.currentTime;
      this.loops.record.src.frequency.setTargetAtTime(n, t0, 0.04); this.loops.recordBass.src.frequency.setTargetAtTime(n / 2, t0, 0.1);
    }
    if (best.record && Math.random() < dt * 9) this.burst(this.white, 'highpass', 3000, 1, 0.03 * lv('record'), 0.001, 0.01);
    if (best.clock && lv('clock') > 0) {
      const sec = Math.floor(best.clock.a.clockTime);
      if (sec !== this.lastTick) { this.lastTick = sec; this.burst(this.white, 'bandpass', 4200, 8, 0.12 * lv('clock'), 0.001, 0.02); }
    }
    this.set('fan', fan * 0.12, fanPos ? pan(fanPos) : 0);
    this.set('radio', radio * 0.08, radioPos ? pan(radioPos) : 0);
    this.set('radioTone', radio * 0.05, radioPos ? pan(radioPos) : 0);
    if (radio > 0 && Math.random() < dt * 5) this.loops.radioTone.src.frequency.setTargetAtTime([220, 247, 262, 294, 330, 349, 392][Math.floor(Math.random() * 7)], this.ctx.currentTime, 0.02);
    this.set('tv', tv * 0.06, tvPos ? pan(tvPos) : 0);
    // the gate motor grinds while the gates are being driven open: loud at the gates, a thrum through the cellar
    const gp = { x: 0, y: 0, z: 88 }, motor = game.gates.escaping && game.gates.t < 1;
    this.set('motor', motor ? Math.max(near(gp, 40) * 0.3, zone === 'house' && p.y < -1 ? 0.08 : 0) : 0, pan(gp));
    // the nearest burning hearth crackles (candles are silent)
    let fireV = 0, firePos = null;
    for (const f of game.fires || []) { if (!f.lit || f.kind === 'candle') continue; const v = near(f.light.pos, 9) * (f.kind === 'hearth' ? 1 : 0.6); if (v > fireV) { fireV = v; firePos = f.light.pos; } }
    this.set('fire', fireV * 0.3, firePos ? pan(firePos) : 0);
    if (fireV > 0 && Math.random() < dt * 6) this.burst(this.white, 'highpass', 2500, 1, 0.12 * fireV, 0.001, 0.03);
    this.set('hum', grid.live('main') && zone === 'house' ? 0.03 : 0);
    const fp = { x: 0, y: 1, z: 24 };
    this.set('fountain', game.fountainFx && game.fountainFx.on ? near(fp, 22) * 0.22 : 0, pan(fp));
    // the arrival: your engine and your car radio, on low
    const intro = game.intro;
    this.set('engine', intro ? intro.engine : 0);
    if (intro) {
      this.loops.engine.src.frequency.setTargetAtTime(32 * (intro.engineRev || 1), this.ctx.currentTime, 0.2);
      this.set('radio', intro.radio * 0.5, 0);
    }
    // the song on the car radio: during the arrival, and again when the car is running at the end
    const songLevel = intro ? intro.radio * 7 : (game.outro && game.outro.car ? game.outro.radio * 7 : 0);
    this.set('song', songLevel, 0); this.songUpdate(songLevel);
    if (game.outro && game.outro.car) { this.set('engine', game.outro.engine || 0); this.loops.engine.src.frequency.setTargetAtTime(32 * (game.outro.rev || 1), this.ctx.currentTime, 0.2); }
    if (zone === 'exterior' && game.crows && game.crows.length && Math.random() < dt * 0.06) {
      const c = game.crows[Math.floor(Math.random() * game.crows.length)], v = near(c, 60);
      if (v > 0) this.caw(pan(c), 0.4 + v);
    }
    if (zone === 'exterior' && Math.random() < dt * 0.15 && game.ducks && game.ducks.length) {
      const d = game.ducks[0].obj.position; if (near(d, 30) > 0) this.quack();
    }
  }
}
Synth.HUM_VOICES = 5;
BM.Synth = Synth;
})();
