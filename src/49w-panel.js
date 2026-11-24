/* ==========================================================================
   BLACKTHORN MANOR — 6ze. MORE ON THE SIDE PANEL
   Everything else in the house you might want from anywhere, on the
   lighting panel beside the lights, the gates, the doors and the windows:
   - a status line: the time, the weather, how many lights are on;
   - every fire and candle; every fan; the radios, the television and the
     radiogram; the cellar storm doors; the garage doors; the lift;
   - the clock tower on or off, and the tune each clock chimes;
   - the weather, the time of day, and the flood.
   Click a row (Tab frees the mouse), or ↑ ↓ and Enter.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const SETTINGS = game => (game.menu && game.menu.settings) || null;
function tunes(game) {
  if (!game.chimeTunes) { const s = SETTINGS(game) || {}; game.chimeTunes = { tower: s.chimeTower || 'westminster', longcase: s.chimeLongcase || 'westminster' }; }
  return game.chimeTunes;
}
const remember = (game, k, v) => { const s = SETTINGS(game); if (s) { s[k] = v; game.menu.save && game.menu.save(); } };
const next = (list, cur) => list[(list.indexOf(cur) + 1) % list.length];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function quietly(game, fn) {
  const A = game.audio, ui = game.ui, say = ui.say, click = A.click, rattle = A.rattle; ui.say = () => {}; A.click = () => {}; A.rattle = () => {};
  try { fn(); } finally { ui.say = say; A.click = click; A.rattle = rattle; }
}

const fires = game => game.fires || [];
const fans = game => game.grid.appliances.filter(a => a.kind === 'fan');
const music = game => game.grid.appliances.filter(a => a.kind === 'radio' || a.kind === 'tv' || a.kind === 'record');
const dialSwitch = game => game.interactables.find(it => it.switchVisual && (it.controls || []).indexOf('clock-dial-1') >= 0);

/* the line at the top of the panel */
BM.panelStatus = function (game) {
  let mins = Math.floor(game.clock / 60) % 60, hrs = (23 + Math.floor(game.clock / 3600)) % 24;
  if (game.timeFlow) { const h = game.dayHour || 0; hrs = Math.floor(h); mins = Math.floor((h - hrs) * 60); }
  let n = 0, lit = 0;
  for (const l of game.grid.lights) { if (l.kind === 'fire' || l.circuit === 'car') continue; n++; if (l.intensity > 0.02) lit++; }
  const w = (BM.WEATHERS || {})[game.night] || cap(game.night || 'storm'), t = BM.TIMES && BM.TIMES[game.timeOfDay] ? BM.TIMES[game.timeOfDay].name : cap(game.timeOfDay || 'night');
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} · ${w} · ${t} · ${lit} / ${n} lights on`;
};

BM.panelRows = function (game) {
  const g = game.grid, rows = [], T = tunes(game);
  const house = (k, name, on, onText, offText, extra) => rows.push(Object.assign({ section: 'HOUSE', supply: '', k: 'more:' + k, name, on, onText, offText, lit: on, warming: false, live: true }, extra || {}));
  const fl = fires(game).filter(f => f.lit).length;
  house('fires', 'Fires & candles', fl > 0, 'LIT', 'OUT');
  const fa = fans(game);
  house('fans', 'Fans', fa.some(a => a.switchedOn), 'ON', 'OFF', { live: fa.some(a => g.live(a.circuit)) });
  const mu = music(game);
  house('music', 'Radios & music', mu.some(a => a.switchedOn), 'ON', 'OFF', { live: mu.some(a => g.live(a.circuit)) });
  const sd = game.stormDoors;
  if (sd) house('storm', 'Cellar storm doors', sd.open || (sd.moving && sd.target), 'OPEN', sd.bolted ? 'BOLTED' : 'CLOSED', { warming: !!sd.moving });
  const gds = game.garageDoors || [];
  if (gds.length) house('garage', 'Garage doors', gds.some(d => d.open), 'OPEN', 'CLOSED', { warming: gds.some(d => d.moving) });
  const L = game.lift, F = BM.LIFT_FLOORS;
  if (L && F) rows.push({ section: 'HOUSE', supply: '', k: 'more:lift', name: 'Lift', value: L.phase !== 'idle' ? 'MOVING' : F[L.at].name.toUpperCase(), on: true, lit: L.phase === 'idle', warming: L.phase !== 'idle', live: g.live('main') });
  // the water
  if (game.waterSw) {
    const live = g.lodge, wr = (k, name, which) => rows.push({ section: 'WATER', supply: live ? 'lodge supply ●' : 'no supply ○', k: 'more:' + k, name, on: !!game.waterSw[which], onText: 'ON', offText: 'OFF', lit: BM.waterRunning(game, which), warming: false, live });
    wr('fountain', 'Garden fountain', 'fountain'); wr('cascade', 'Pond waterfall', 'cascade'); wr('poolpumps', 'Pool pumps & jets', 'pool');
  }
  // the clocks
  const ck = game.clock_;
  rows.push({ section: 'CLOCKS', supply: '', k: 'more:tower', name: 'Clock tower', on: !game.towerOff, onText: 'ON', offText: 'OFF', lit: !game.towerOff && !!(ck && ck.powered), warming: false, live: !!(ck && ck.powered) });
  rows.push({ section: 'CLOCKS', supply: '', k: 'more:towerTune', name: 'Tower chimes', value: BM.CHIMES[T.tower].name.toUpperCase(), on: true, lit: false, live: !game.towerOff });
  if (game.longcase) rows.push({ section: 'CLOCKS', supply: '', k: 'more:longcaseTune', name: 'Grandfather clock', value: BM.CHIMES[T.longcase].name.toUpperCase(), on: true, lit: false, live: true });
  // the world
  const W = BM.WEATHERS || {}, TI = BM.TIMES || {}, F9 = game.flood;
  rows.push({ section: 'WEATHER & TIME', supply: '', k: 'more:weather', name: 'Weather', value: (W[game.night] || cap(game.night || 'storm')).toUpperCase(), on: true, lit: false, live: true });
  rows.push({ section: 'WEATHER & TIME', supply: '', k: 'more:time', name: 'Time of day', value: (TI[game.timeOfDay] ? TI[game.timeOfDay].name : cap(game.timeOfDay || 'night')).toUpperCase(), on: true, lit: false, live: true });
  rows.push({ section: 'WEATHER & TIME', supply: '', k: 'more:flow', name: 'Time passes', on: !!game.timeFlow, onText: 'ON', offText: 'OFF', lit: !!game.timeFlow, warming: false, live: true });
  if (F9) {
    const up = F9.water && F9.water.visible, h = Math.max(0, F9.depth).toFixed(1) + ' M';
    rows.push({ section: 'WEATHER & TIME', supply: '', k: 'more:flood', key: 'F9', name: 'Flood', value: !up ? 'DRY' : F9.rising ? 'RISING ' + h : F9.draining ? 'DRAINING ' + h : 'STANDING ' + h, on: true, lit: !!up, warming: !!(F9.rising || F9.draining), live: true });
  }
  return rows;
};

BM.panelToggle = function (game, k) {
  if (k.indexOf('more:') !== 0) return false;
  const id = k.slice(5), A = game.audio, ui = game.ui, g = game.grid;
  if (id === 'fires') {
    const fs = fires(game), light = !fs.some(f => f.lit);
    for (const f of fs) { f.lit = light; f.light.on = light; }
    A.burst && A.burst(A.white, light ? 'lowpass' : 'highpass', light ? 1200 : 2500, 1, 0.3, 0.01, 0.6);
    ui.say(light ? 'In every hearth the fire catches, and every candle in the house takes a flame. The whole place glows orange.' : 'Every fire sinks to embers and every candle goes out in a thread of smoke.', 4);
  } else if (id === 'fans' || id === 'music') {
    const as = id === 'fans' ? fans(game) : music(game), on = !as.some(a => a.switchedOn);
    for (const a of as) a.switchedOn = on;
    A.click && A.click();
    const live = as.some(a => g.live(a.circuit));
    ui.say(id === 'fans' ? (on ? (live ? 'All over the house the fans whirr up to speed.' : 'Every fan is switched on — but there is no power to turn them.') : 'Every fan winds down and stops.')
      : (on ? (live ? 'The radios warm up and find their stations, the television hisses into life, the radiogram drops its needle: music through the empty house.' : 'Everything is switched on — but nothing plays without power.') : 'The radios, the television and the radiogram go quiet.'), 4);
  } else if (id === 'storm') {
    const sd = game.stormDoors;
    if (sd.moving) return true;
    if (sd.open) { quietly(game, () => game.stormDoorsToggle()); sd.boltAfter = true; ui.say('Out in the courtyard the storm doors come down with a clang, and the bolt goes home.', 4); }
    else if (sd.bolted) { sd.bolted = false; A.stormBolt && A.stormBolt(false); quietly(game, () => game.stormDoorsToggle()); ui.say('In the courtyard the bolt shrieks back, and the storm doors go up and fall open on the setts.', 4); }
    else { sd.bolted = true; A.stormBolt && A.stormBolt(true); ui.say('The storm doors are bolted.', 3); }
  } else if (id === 'garage') {
    const gds = game.garageDoors || [], open = !gds.some(d => d.open);
    quietly(game, () => { for (const d of gds) if (d.open !== open && !d.moving) game.toggleGarageDoor(d); });
    A.rattle && A.rattle();
    ui.say(open ? 'At the coach house both doors swing up into the roof with a shriek of runners.' : 'At the coach house both doors come down on their springs and shut with a bang.', 4);
  } else if (id === 'lift') {
    const L = game.lift, F = BM.LIFT_FLOORS;
    game.liftCall((L.at + 1) % F.length);
  } else if (id === 'tower') {
    game.towerOff = !game.towerOff;
    const sw = dialSwitch(game);
    if (sw && !!sw.leverOn === game.towerOff) quietly(game, () => sw.act(game));
    A.clunk && A.clunk(0.5);
    ui.say(game.towerOff ? 'The clock tower goes quiet, and its face goes dark. The hands still turn.' : 'The clock tower comes back: its face lights, and it will chime again on the quarter.', 4);
  } else if (id === 'towerTune' || id === 'longcaseTune') {
    const T = tunes(game), which = id === 'towerTune' ? 'tower' : 'longcase';
    T[which] = next(BM.CHIME_ORDER, T[which]);
    remember(game, which === 'tower' ? 'chimeTower' : 'chimeLongcase', T[which]);
    const name = BM.CHIMES[T[which]].name;
    // play it, so you can hear it
    const ck = game.clock_, lc = game.longcase;
    if (which === 'tower') {
      if (game.towerOff) ui.say(`The tower will chime ${name} — once it is switched back on.`, 4);
      else if (ck && ck.powered) { const w = BM.ringChime(A, T.tower, 2, 0, { gain: 0.5 * ck.hearing(ck.c.bellPos), decay: 2.6 }); game.chimeBusyUntil = game.time + w + 2; ui.say(T.tower === 'off' ? 'The clock tower will be silent.' : T.tower === 'hours' ? 'The clock tower will strike the hours only.' : `The clock tower will chime ${name}.`, 4); }
      else ui.say(`The clock tower is set to ${name}. It has no power to chime yet: it runs on the attic circuit.`, 4);
    } else {
      if (lc && lc.running) { const p = game.player, d = Math.hypot(lc.pos.x - p.x, lc.pos.y - p.y - 1.6, lc.pos.z - p.z), hear = Math.max(0.12, 1 - d / 30); const w = BM.ringChime(A, T.longcase, 2, 0, { octave: 1, gain: 0.22 * hear, decay: 1.8, gapScale: 0.66, when: 0.2 }); game.chimeBusyUntil = game.time + w + 2; }
      ui.say(T.longcase === 'off' ? 'The grandfather clock will be silent.' : T.longcase === 'hours' ? 'The grandfather clock will strike the hours only.' : `The grandfather clock will chime ${name}.` + (lc && lc.running ? '' : ' It has no power yet: it runs on the hall circuit.'), 4);
    }
  } else if (id === 'weather') {
    const n = next(Object.keys(BM.WEATHERS), game.night || 'storm');
    BM.applyNight(game, n); remember(game, 'night', n);
    ui.say({ storm: 'The storm comes in: wind, rain, and lightning over the house.', rain: 'Steady rain now, and no thunder.', fog: 'The rain stops, and the fog comes up off the lake.', clear: 'The sky clears. The moon is up.', snow: 'It goes still, and very quiet. The first flakes of snow come down out of the dark.' }[n] || n, 4);
  } else if (id === 'time') {
    const n = next(Object.keys(BM.TIMES), game.timeOfDay || 'night');
    BM.setTimeOfDay(game, n); remember(game, 'time', n);
    ui.say({ night: 'Night.', dusk: 'Dusk: the last of the light going.', dawn: 'Dawn: grey light in the east.', day: 'Day.' }[n] || n, 3);
  } else if (id === 'fountain' || id === 'cascade' || id === 'poolpumps') {
    BM.toggleWater(game, id === 'poolpumps' ? 'pool' : id);
  } else if (id === 'flow') {
    BM.setTimeFlow(game, !game.timeFlow); remember(game, 'timeFlow', game.timeFlow);
    A.click && A.click();
    ui.say(game.timeFlow ? 'Time passes now: an hour every minute, round the clock — night into dawn, into day, into dusk.' : 'Time stands still where it is.', 4);
  } else if (id === 'flood') BM.floodToggle(game);
  return true;
};

/* the storm doors bolt themselves once they are down */
BM.updatePanel = function (game) {
  if (!game.chimeTunes && game.menu) { tunes(game); if (game.menu.settings.timeFlow) BM.setTimeFlow(game, true); }   // the tunes you chose last time, and whether time passes
  const sd = game.stormDoors;
  if (sd && sd.boltAfter && !sd.moving && !sd.open) { sd.boltAfter = false; sd.bolted = true; game.audio.stormBolt && game.audio.stormBolt(true); }
};
})();
