/* ==========================================================================
   HALCYON HOUSE — THE SMART HOME
   - Scenes, set from the side panel or the wall tablets: Evening, Morning,
     Party, Movie, Night, Away. Each sets the lights inside and out, the
     colour, the brightness, the glass and the blinds at once.
   - Every light inside can take a colour (warm, white, cool, blue, purple,
     red, green, or a slow rainbow) and a brightness.
   - Smart glass (X): the windows turn from clear to frosted and glow with
     the light inside. Motorised blinds (Z) come down over the lake glass.
   - The house talks: it greets you at the gate and at the door, and says
     what it is doing. (Out loud, if the browser has a voice; it can be
     turned off on the panel.)
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;

const COLOURS = {
  warm: { name: 'Warm white', hex: 0xffd6a8 }, white: { name: 'White', hex: 0xfff2e2 }, cool: { name: 'Cool white', hex: 0xe2ecff },
  blue: { name: 'Blue', hex: 0x3f6dff }, purple: { name: 'Purple', hex: 0x9a46ff }, red: { name: 'Red', hex: 0xff2f3a }, green: { name: 'Green', hex: 0x2cff6a },
  rainbow: { name: 'Rainbow', hex: 0xffffff },
};
const COLOUR_ORDER = ['warm', 'white', 'cool', 'blue', 'purple', 'red', 'green', 'rainbow'];
const BRIGHT = [1, 0.75, 0.5, 0.25];
const SCENES = {
  evening: { name: 'Evening', say: 'Good evening. Evening scene: warm lights inside, the grounds lit.', inside: true, colour: 'warm', bright: 0.75, outside: 'all', glass: false, blinds: false },
  morning: { name: 'Morning', say: 'Good morning. Bright, cool light, the blinds up, the garden lights off.', inside: true, colour: 'cool', bright: 1, outside: 'none', glass: false, blinds: false },
  party: { name: 'Party', say: 'Party mode. Enjoy yourself.', inside: true, colour: 'rainbow', bright: 1, outside: 'all', glass: false, blinds: false, party: true },
  movie: { name: 'Movie', say: 'Movie scene. The lights are down.', inside: true, colour: 'warm', bright: 0.25, outside: 'drive', glass: true, blinds: true },
  night: { name: 'Night', say: 'Good night. Just the stairs and the drive are lit.', inside: 'stairs', colour: 'warm', bright: 0.25, outside: 'drive', glass: true, blinds: true },
  away: { name: 'Away', say: 'Away mode. Everything off, the glass frosted, the gates locked. The cameras are watching.', inside: false, colour: 'warm', bright: 1, outside: 'gate', glass: true, blinds: true, lock: true },
};
const SCENE_ORDER = ['evening', 'morning', 'party', 'movie', 'night', 'away'];
BM.HALCYON_SCENES = SCENES;

/* the house's voice: on the screen, and out loud where the browser can */
BM.halcyonSay = function (game, text, secs) {
  const HC = game.halcyon; if (!HC) return;
  game.ui.say('HALCYON · ' + text, secs || 5);
  if (HC.voice === false || game.headless || typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  try {
    const s = window.speechSynthesis; s.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    const voices = s.getVoices ? s.getVoices() : [];
    const v = voices.find(v => /en-GB/i.test(v.lang) && /female|libby|sonia|serena|kate|hazel/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang));
    if (v) u.voice = v;
    u.rate = 1.0; u.pitch = 1.05; u.volume = Math.min(1, ((game.menu && game.menu.settings.volume) || 0.8) * 1.1);
    s.speak(u);
  } catch (e) { /* no voice: the words on the screen will do */ }
};

/* a canvas the tablets show: the scene, the time, a few buttons */
function tabletTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160;
  const t = new THREE.CanvasTexture(c); t.userData = { c };
  return t;
}
function drawTablet(game, T) {
  const c = T.userData.c; if (!c || !c.getContext) return;
  const g = c.getContext('2d'); if (!g) return;
  const HC = game.halcyon, S = SCENES[HC.scene] || SCENES.evening;
  g.fillStyle = '#0c1016'; g.fillRect(0, 0, 256, 160);
  g.fillStyle = '#8ab4ff'; g.font = '13px sans-serif'; g.fillText('HALCYON', 14, 22);
  g.fillStyle = '#ffffff'; g.font = 'bold 26px sans-serif'; g.fillText(S.name, 14, 62);
  g.fillStyle = '#9aa4b4'; g.font = '13px sans-serif'; g.fillText((COLOURS[HC.colour] || COLOURS.warm).name + ' · ' + Math.round(HC.bright * 100) + '%', 14, 86);
  SCENE_ORDER.forEach((k, i) => { const x = 14 + (i % 3) * 78, y = 104 + Math.floor(i / 3) * 26; g.fillStyle = k === HC.scene ? '#3f6dff' : '#1c2430'; g.fillRect(x, y, 70, 20); g.fillStyle = '#dde6f4'; g.font = '11px sans-serif'; g.fillText(SCENES[k].name, x + 6, y + 14); });
  T.needsUpdate = true;
}

BM.buildHalcyonSmart = function (B, game) {
  const HC = game.halcyon, M = BM.halcyonMats();
  HC.voice = true; HC.frost = 0; HC.frostTarget = 0; HC.blindT = 0; HC.blindTarget = 0; HC.tablets = [];
  /* ---- the wall tablets: by the front door, in the kitchen, on the landing ---- */
  B.zone = 'mansion';
  for (const [id, x, y, z, nx, nz, room, level] of [['tablet-hall', -9.5, 1.4, BM.HALCYON.H.z1 - 0.32, 0, -1, 'atrium', 'ground'], ['tablet-kitchen', 23, 1.4, 1.88, 0, -1, 'kitchen', 'ground'], ['tablet-landing', 7.88, BM.HALCYON.F1 + 1.4, -11, -1, 0, 'landing', 'upper']]) {
    B.room = room; B.levelName = level;
    const ry = Math.atan2(nx, nz), tex = tabletTexture();
    B.box(M.black, x + nx * 0.01, y, z + nz * 0.01, 0.42, 0.28, 0.02, ry);
    const scr = B.mesh(G.plane, new THREE.MeshBasicMaterial({ map: tex }), x + nx * 0.022, y, z + nz * 0.022, 0.38, 0.24, 1, ry); scr.userData.dynamic = true;
    HC.tablets.push(tex);
    B.interactable({ id, label: () => 'Home tablet: ' + (SCENES[HC.scene] || SCENES.evening).name + ' — next scene', pos: [x + nx * 0.05, y, z + nz * 0.05], n: [nx, nz], act: g => BM.halcyonScene(g, SCENE_ORDER[(SCENE_ORDER.indexOf(HC.scene) + 1) % SCENE_ORDER.length]) });
  }
  /* ---- motorised blinds: one long blind behind each run of lake glass, on both floors ---- */
  HC.blinds = [];
  const H = BM.HALCYON.H, F1 = BM.HALCYON.F1, R = BM.HALCYON.ROOF;
  const fab = new THREE.MeshPhongMaterial({ color: 0xd8d2c6, shininess: 2, side: THREE.DoubleSide });
  for (const [y0, y1] of [[0, F1 - 0.3], [F1, R - 0.3]]) for (let x = H.x0 + 0.2; x < H.x1 - 0.2; x += 6.4) {
    const w = Math.min(6.3, H.x1 - 0.2 - x), g = new THREE.Group(); g.position.set(x + w / 2, y1 - 0.05, H.z0 + 0.25); B.root.add(g);
    B.box(fab, 0, -(y1 - y0 - 0.1) / 2, 0, w, y1 - y0 - 0.1, 0.02, 0, g);
    B.box(M.steel, 0, 0.02, 0, w + 0.05, 0.1, 0.1, 0, g);   // the cassette
    g.children[0].userData.dynamic = true; g.children[0].matrixAutoUpdate = true;
    g.traverse(m => { m.userData.dynamic = true; });
    HC.blinds.push(g.children[0]);
  }
  for (const b of HC.blinds) { b.scale.y = 0.001; b.position.y = 0; }
  HC.blindH = (F1 - 0.4);
  B.levelName = 'ground'; B.room = 'house';
};

/* ---- applying the smart state to the fittings ---- */
function applyLights(game) {
  const HC = game.halcyon, col = COLOURS[HC.colour] || COLOURS.warm;
  for (const l of game.grid.lights) {
    if (!l.base || !l.smart) continue;
    l.target = l.base.target * HC.bright;
    if (HC.colour !== 'rainbow') l.colour = HC.colour === 'warm' ? l.base.colour : col.hex;
  }
  HC.glow = HC.colour === 'rainbow' ? 0xffc8f0 : col.hex;
  for (const t of HC.tablets || []) drawTablet(game, t);
}

BM.halcyonScene = function (game, name, quiet) {
  const HC = game.halcyon, S = SCENES[name]; if (!S) return;
  HC.scene = name; HC.colour = S.colour; HC.bright = S.bright; HC.party = !!S.party;
  const g = game.grid;
  for (const l of g.lights) {
    if (!l.base) continue;
    if (l.smart) l.on = S.inside === true || (S.inside === 'stairs' && /stair|landing/i.test(l.id + ' ' + l.room));
  }
  for (const [k] of game.estateGroups) {
    const on = S.outside === 'all' || (S.outside === 'drive' && (k === 'hdrive' || k === 'hgate')) || (S.outside === 'gate' && k === 'hgate');
    for (const id of game.estateLights[k]) { const l = g.light(id); if (l) l.on = on; }
  }
  for (const it of game.interactables) if (it.switchVisual && it.controls) it.leverOn = it.controls.some(id => { const l = g.light(id); return l && l.on; });
  HC.frostTarget = S.glass ? 1 : 0; HC.blindTarget = S.blinds ? 1 : 0;
  if (S.lock && HC.gate) { HC.gate.held = 'closed'; HC.gate.target = 0; }
  else if (HC.gate && HC.gate.held === 'closed' && name !== 'night') HC.gate.held = null;
  if (BM.halcyonShowForScene) BM.halcyonShowForScene(game, name);
  applyLights(game);
  game.audio.click && game.audio.click();
  if (!quiet) BM.halcyonSay(game, S.say, 5);
};
BM.halcyonColour = function (game, dir) {
  const HC = game.halcyon; HC.colour = COLOUR_ORDER[(COLOUR_ORDER.indexOf(HC.colour) + (dir || 1) + COLOUR_ORDER.length) % COLOUR_ORDER.length];
  HC.party = HC.colour === 'rainbow';
  applyLights(game); game.audio.click && game.audio.click();
  BM.halcyonSay(game, 'Lights: ' + COLOURS[HC.colour].name.toLowerCase() + '.', 3);
};
BM.halcyonBright = function (game) {
  const HC = game.halcyon, i = BRIGHT.indexOf(HC.bright); HC.bright = BRIGHT[(i + 1) % BRIGHT.length];
  applyLights(game); game.audio.click && game.audio.click();
  BM.halcyonSay(game, 'Lights at ' + Math.round(HC.bright * 100) + ' percent.', 3);
};
BM.halcyonGlass = function (game) {
  const HC = game.halcyon; HC.frostTarget = HC.frostTarget ? 0 : 1;
  game.audio.tone && game.audio.tone('sine', 880, 1320, 0.03, 0.02, 0.25);
  BM.halcyonSay(game, HC.frostTarget ? 'Privacy glass on.' : 'Privacy glass off. Clear.', 3);
};
BM.halcyonBlinds = function (game) {
  const HC = game.halcyon; HC.blindTarget = HC.blindTarget ? 0 : 1;
  BM.halcyonSay(game, HC.blindTarget ? 'Lowering the blinds.' : 'Raising the blinds.', 3);
};

BM.halcyonPanelRows = function (game) {
  const HC = game.halcyon; if (!HC) return [];
  const row = (k, name, value, extra) => Object.assign({ section: 'SMART HOME', supply: '', k: 'smart:' + k, name, value, on: true, lit: false, live: true }, extra || {});
  return [
    row('scene', 'Scene', (SCENES[HC.scene] || SCENES.evening).name.toUpperCase()),
    row('colour', 'Light colour', COLOURS[HC.colour].name.toUpperCase()),
    row('bright', 'Brightness', Math.round(HC.bright * 100) + '%'),
    Object.assign(row('glass', 'Privacy glass'), { value: undefined, key: 'X', on: HC.frostTarget > 0, onText: 'FROSTED', offText: 'CLEAR', lit: HC.frostTarget > 0 }),
    Object.assign(row('blinds', 'Blinds'), { value: undefined, key: 'Z', on: HC.blindTarget > 0, onText: 'DOWN', offText: 'UP', lit: HC.blindTarget > 0 }),
    Object.assign(row('voice', 'House voice'), { value: undefined, on: HC.voice !== false, onText: 'ON', offText: 'OFF', lit: HC.voice !== false }),
  ].concat(BM.halcyonOutsideRows ? BM.halcyonOutsideRows(game) : [], BM.halcyonInsideRows ? BM.halcyonInsideRows(game) : [], BM.halcyonTechRows ? BM.halcyonTechRows(game) : [], BM.halcyonAmenityRows ? BM.halcyonAmenityRows(game) : [], BM.halcyonGroundsRows ? BM.halcyonGroundsRows(game) : []);
};
BM.halcyonPanelToggle = function (game, k) {
  if (k.indexOf('smart:') !== 0) return false;
  const id = k.slice(6), HC = game.halcyon;
  if (BM.halcyonOutsideToggle && BM.halcyonOutsideToggle(game, id)) return true;
  if (BM.halcyonInsideToggle && BM.halcyonInsideToggle(game, id)) return true;
  if (BM.halcyonTechToggle && BM.halcyonTechToggle(game, id)) return true;
  if (BM.halcyonAmenityToggle && BM.halcyonAmenityToggle(game, id)) return true;
  if (BM.halcyonGroundsToggle && BM.halcyonGroundsToggle(game, id)) return true;
  if (id === 'scene') BM.halcyonScene(game, SCENE_ORDER[(SCENE_ORDER.indexOf(HC.scene) + 1) % SCENE_ORDER.length]);
  else if (id === 'colour') BM.halcyonColour(game);
  else if (id === 'bright') BM.halcyonBright(game);
  else if (id === 'glass') BM.halcyonGlass(game);
  else if (id === 'blinds') BM.halcyonBlinds(game);
  else if (id === 'voice') { HC.voice = HC.voice === false; game.ui.say(HC.voice ? 'HALCYON · Voice on.' : 'The house will keep quiet now (its words still show here).', 3); if (HC.voice) BM.halcyonSay(game, 'Hello again.', 2); }
  return true;
};

BM.updateHalcyonSmart = function (game, dt) {
  const HC = game.halcyon; if (!HC) return;
  const p = game.player, M = BM.halcyonMats();
  // a slow rainbow, each light a little ahead of the last
  if (HC.colour === 'rainbow') {
    const c = HC._c || (HC._c = new THREE.Color());
    let i = 0;
    for (const l of game.grid.lights) { if (!l.smart) continue; c.setHSL(((HC.t * (HC.party ? 0.12 : 0.05)) + i++ * 0.013) % 1, 1, 0.55); l.colour = c.getHex(); }
  }
  // the smart glass: clear to milky white, glowing with the lights inside
  HC.frost += Math.sign(HC.frostTarget - HC.frost) * Math.min(Math.abs(HC.frostTarget - HC.frost), dt / 1.2);
  const gz = M.glazing; gz.opacity = 0.16 + 0.68 * HC.frost; gz.color.setHex(0x9cc0d0).lerp(HC._white || (HC._white = new THREE.Color(0xeef2f4)), HC.frost);
  // the blinds come down, and go up
  HC.blindT += Math.sign(HC.blindTarget - HC.blindT) * Math.min(Math.abs(HC.blindTarget - HC.blindT), dt / 6);
  for (const b of HC.blinds) { b.scale.y = Math.max(0.001, HC.blindT); b.position.y = -HC.blindH * HC.blindT / 2; }
  // the house greets you: at the gate, and at the front door
  if (!HC.greetGate && p.z < 99 && p.z > 80) { HC.greetGate = true; BM.halcyonSay(game, 'Welcome to Halcyon House. The drive is lit for you.', 5); }
  if (!HC.greetDoor && game.ctx && game.ctx.zone === 'house') { HC.greetDoor = true; const hr = game.timeFlow ? game.dayHour : { night: 21, dusk: 19, dawn: 6, day: 12 }[game.timeOfDay] || 21; BM.halcyonSay(game, (hr < 12 && hr >= 5 ? 'Good morning.' : hr < 18 && hr >= 12 ? 'Good afternoon.' : 'Good evening.') + ' Welcome home. Say the word on the panel and I will set the scene.', 6); }
};
})();
