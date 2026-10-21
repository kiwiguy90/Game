'use strict';
/*
 * Headless harness for Blackthorn Manor.
 * Stubs the DOM, WebGL and Web Audio, then loads the real game code — every
 * <script> in blackthorn-manor.html, Three.js r128 included — into a vm
 * context. The WebGL stub is complete enough for THREE.WebGLRenderer to run
 * its real render loop, so renderer.info.render.calls is a true draw count.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_FILE = path.join(__dirname, '..', 'blackthorn-manor.html');

/* ---------------------------------------------------------------- WebGL -- */
function makeGL() {
  const consts = {}, names = {};
  let next = 0x8000;
  const constant = (name) => {
    if (!(name in consts)) { consts[name] = next; names[next] = name; next++; }
    return consts[name];
  };
  // real values for every constant three.js queries by number
  next = 0x20000;
  const fixed = {
    FRAMEBUFFER_COMPLETE: 0x8CD5, NO_ERROR: 0, TEXTURE0: 0x84C0, VERSION: 7938, SHADING_LANGUAGE_VERSION: 35724, VENDOR: 7936, RENDERER: 7937,
    SCISSOR_BOX: 3088, VIEWPORT: 2978, COLOR_CLEAR_VALUE: 3106, MAX_TEXTURE_IMAGE_UNITS: 34930, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661, MAX_TEXTURE_SIZE: 3379, MAX_CUBE_MAP_TEXTURE_SIZE: 34076, MAX_VERTEX_ATTRIBS: 34921,
    MAX_VERTEX_UNIFORM_VECTORS: 36347, MAX_VARYING_VECTORS: 36348, MAX_FRAGMENT_UNIFORM_VECTORS: 36349, MAX_SAMPLES: 36183,
    ALIASED_POINT_SIZE_RANGE: 33901, ALIASED_LINE_WIDTH_RANGE: 33902, LINK_STATUS: 35714, COMPILE_STATUS: 35713,
    ACTIVE_UNIFORMS: 35718, ACTIVE_ATTRIBUTES: 35721, MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047, UNPACK_ALIGNMENT: 3317,
  };
  for (const k in fixed) { consts[k] = fixed[k]; names[fixed[k]] = k; }
  let objects = 0;
  const obj = (kind) => ({ __gl: kind, id: ++objects });
  const params = (p) => {
    const n = names[p] || '';
    if (n === 'VERSION') return 'WebGL 1.0 (headless stub)';
    if (n === 'SHADING_LANGUAGE_VERSION') return 'WebGL GLSL ES 1.0';
    if (n === 'VENDOR' || n === 'RENDERER') return 'stub';
    if (n === 'MAX_TEXTURE_IMAGE_UNITS' || n === 'MAX_VERTEX_TEXTURE_IMAGE_UNITS' || n === 'MAX_COMBINED_TEXTURE_IMAGE_UNITS') return 16;
    if (n === 'MAX_VERTEX_ATTRIBS') return 16;
    if (n === 'MAX_VERTEX_UNIFORM_VECTORS' || n === 'MAX_FRAGMENT_UNIFORM_VECTORS') return 1024;
    if (n === 'MAX_VARYING_VECTORS') return 30;
    if (n.indexOf('MAX_') === 0) return 4096;
    if (n === 'ALIASED_POINT_SIZE_RANGE' || n === 'ALIASED_LINE_WIDTH_RANGE') return new Float32Array([1, 1024]);
    if (n === 'VIEWPORT' || n === 'SCISSOR_BOX') return new Int32Array([0, 0, 1280, 720]);
    if (n === 'COLOR_CLEAR_VALUE') return new Float32Array([0, 0, 0, 1]);
    return 0;
  };
  const stats = { drawArrays: 0, drawElements: 0, instanced: 0, programs: 0 };
  const methods = {
    getParameter: params,
    getExtension: (name) => new Proxy({}, { get: (t, k) => typeof k === 'string' && /^[A-Z_0-9]+$/.test(k) ? constant(k) : (() => obj('ext')) }),
    getSupportedExtensions: () => [],
    getContextAttributes: () => ({ alpha: true, antialias: false, depth: true, stencil: true, premultipliedAlpha: true, preserveDrawingBuffer: false }),
    getShaderPrecisionFormat: () => ({ precision: 23, rangeMin: 127, rangeMax: 127 }),
    getShaderParameter: () => true,
    getProgramParameter: (p, n) => { const k = names[n]; if (k === 'LINK_STATUS') return true; return 0; },
    getShaderInfoLog: () => '', getProgramInfoLog: () => '',
    getError: () => 0, isContextLost: () => false,
    checkFramebufferStatus: () => 0x8CD5,
    createBuffer: () => obj('buffer'), createTexture: () => obj('texture'), createFramebuffer: () => obj('fb'), createRenderbuffer: () => obj('rb'),
    createProgram: () => { stats.programs++; return obj('program'); }, createShader: () => obj('shader'), createVertexArray: () => obj('vao'),
    getUniformLocation: () => obj('uniform'), getAttribLocation: () => -1,
    drawArrays: () => { stats.drawArrays++; }, drawElements: () => { stats.drawElements++; },
  };
  const gl = new Proxy({ __stats: stats }, {
    get(target, k) {
      if (k in target) return target[k];
      if (k in methods) return methods[k];
      if (typeof k === 'string' && /^[A-Z][A-Z_0-9]+$/.test(k)) return constant(k);
      if (k === 'canvas') return target.canvas;
      if (k === 'drawingBufferWidth') return 1280;
      if (k === 'drawingBufferHeight') return 720;
      return () => undefined;
    },
    set(target, k, v) { target[k] = v; return true; },
  });
  return gl;
}

/* ------------------------------------------------------------------ 2D --- */
function make2D(canvas) {
  const grad = { addColorStop() {} };
  return new Proxy({ canvas }, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if (k === 'getImageData' || k === 'createImageData') return (x, y, w, h) => ({ width: w || x, height: h || y, data: new Uint8ClampedArray(4 * (w || x) * (h || y)) });
      if (k === 'measureText') return () => ({ width: 10 });
      return () => undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

/* ----------------------------------------------------------------- DOM --- */
class Element {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.style = {}; this.children = []; this.attributes = {};
    this.listeners = {}; this.textContent = ''; this.innerHTML = ''; this.width = 300; this.height = 150;
    this.clientWidth = 1280; this.clientHeight = 720;
    this.classList = { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } };
  }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); return c; }
  setAttribute(k, v) { this.attributes[k] = v; } getAttribute(k) { return this.attributes[k]; }
  addEventListener(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f); }
  removeEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }; }
  focus() {} requestPointerLock() {}
  getContext(type) {
    if (type === '2d') return this._2d || (this._2d = make2D(this));
    if (/webgl/.test(type)) { if (type === 'webgl2') return null; if (!this._gl) { this._gl = makeGL(); this._gl.canvas = this; } return this._gl; }
    return null;
  }
}

/* --------------------------------------------------------------- Audio --- */
function makeAudioContext(log) {
  const param = () => ({ value: 0, setValueAtTime() { return this; }, linearRampToValueAtTime() { return this; }, exponentialRampToValueAtTime() { return this; }, setTargetAtTime() { return this; }, cancelScheduledValues() { return this; } });
  const node = (kind) => {
    const n = { kind, connect(t) { return t; }, disconnect() {}, start() { log.started++; }, stop() {} };
    return new Proxy(n, {
      get(t, k) { if (!(k in t)) { if (typeof k === 'string' && /^[a-zA-Z]/.test(k) && !['type', 'buffer', 'loop', 'then'].includes(k)) t[k] = param(); } return t[k]; },
      set(t, k, v) { t[k] = v; return true; },
    });
  };
  return class AudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = node('dest'); this.state = 'running'; log.contexts++; }
    resume() { return Promise.resolve(); }
    createBuffer(ch, len, rate) { const d = new Float32Array(len); return { length: len, sampleRate: rate, duration: len / rate, numberOfChannels: ch, getChannelData: () => d }; }
    createGain() { return node('gain'); } createOscillator() { return node('osc'); } createBiquadFilter() { return node('filter'); }
    createBufferSource() { log.sources++; return node('source'); } createDynamicsCompressor() { return node('comp'); }
    createStereoPanner() { return node('pan'); } createConvolver() { return node('conv'); } createDelay() { return node('delay'); }
  };
}

/* -------------------------------------------------------------- loader --- */
function extractScripts(html) {
  const out = [], re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const id = (/id="([^"]+)"/.exec(m[1]) || [])[1] || ('script' + out.length);
    if (/src=/.test(m[1])) throw new Error('external script found: ' + m[1] + ' (the game must be self-contained)');
    out.push({ id, code: m[2] });
  }
  return out;
}

function load(opts) {
  opts = opts || {};
  const html = fs.readFileSync(GAME_FILE, 'utf8');
  const audioLog = { contexts: 0, sources: 0, started: 0 };
  const ids = {};
  const document = {
    createElement: (t) => new Element(t), createElementNS: (ns, t) => new Element(t),
    getElementById: (id) => ids[id] || (ids[id] = new Element('div')),
    querySelector: () => new Element('div'), querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    body: new Element('body'), head: new Element('head'), documentElement: new Element('html'),
    pointerLockElement: null, exitPointerLock() {},
  };
  let now = 0;
  const rafQueue = [];
  const networkCalls = [];
  const window = {
    document, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    __BM_NO_AUTOSTART__: true,
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame: (f) => { rafQueue.push(f); return rafQueue.length; }, cancelAnimationFrame() {},
    AudioContext: makeAudioContext(audioLog),
    navigator: { userAgent: 'node-harness' },
    location: { href: 'file:///blackthorn-manor.html', protocol: 'file:' },
    fetch: (...a) => { networkCalls.push(['fetch', a[0]]); return Promise.reject(new Error('network disabled')); },
    XMLHttpRequest: function () { networkCalls.push(['xhr']); this.open = () => {}; this.send = () => {}; },
    Image: function () { networkCalls.push(['image']); },
    console: opts.quiet ? { log() {}, warn() {}, error() {}, info() {} } : console,
    performance: { now: () => now },
    setTimeout, clearTimeout, setInterval, clearInterval,
    HTMLCanvasElement: Element, HTMLImageElement: function () {}, ImageBitmap: function () {}, OffscreenCanvas: undefined,
    Math, Date, JSON, Promise, Float32Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, Float64Array, ArrayBuffer, DataView, Map, Set, WeakMap, Symbol, Proxy, Reflect, Error, TypeError, Object, Array, Number, String, Boolean, RegExp, parseInt, parseFloat, isFinite, isNaN,
  };
  window.window = window; window.self = window; window.globalThis = window;
  const ctx = vm.createContext(window);
  const scripts = extractScripts(html);
  for (const s of scripts) vm.runInContext(s.code, ctx, { filename: s.id + '.js' });
  const BM = window.BM;
  let game = null;
  if (opts.boot !== false) {
    game = new BM.Game(Object.assign({ headless: true }, opts.gameOpts || {}));
    game.init(null);
    game.ui.mode = null;
    game.audio.start();
  }
  return {
    window, BM, game, THREE: window.THREE, audioLog, networkCalls, scripts, html,
    advance(ms) { now += ms; },
    /* run n frames of dt seconds */
    step(n, dt) { dt = dt || 1 / 60; for (let i = 0; i < n; i++) { now += dt * 1000; game.frame(dt, dt * 1000); } },
    /* update only (no render) — fast for long simulations */
    tick(n, dt) { dt = dt || 1 / 60; for (let i = 0; i < n; i++) game.update(dt); },
  };
}

module.exports = { load, extractScripts, GAME_FILE };
