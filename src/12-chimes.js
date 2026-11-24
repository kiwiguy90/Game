/* ==========================================================================
   BLACKTHORN MANOR — 1b. CHIME TUNES
   The tunes the clock tower and the grandfather clock can play, chosen from
   the side panel. Each is a set of bells and a few "changes" (rows of bells);
   the quarter plays one change, the half two, the three-quarter three, and
   the hour four before the hour bell strikes.
   - Westminster: four bells, five changes (the tune of the great clock at
     Westminster, and of most English house clocks).
   - Whittington: eight bells down a major scale, five changes (the tune
     named for St Mary-le-Bow; the house-clock form on eight rods).
   - St Michael's: eight bells, four changes (the house-clock form of the
     chimes of St Michael's, Charleston).
   - Hours only: no quarters, the hour bell alone.
   - Silent.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const hz = n => 440 * Math.pow(2, (n - 69) / 12);          // a MIDI note number to its pitch
const scale = (root, steps) => steps.map(s => hz(root + s));
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];

const TUNES = {
  westminster: {
    name: 'Westminster',
    bells: [hz(59), hz(64), hz(66), hz(68)],               // B, E, F#, G#
    rows: [[4, 3, 2, 1], [2, 4, 3, 1], [2, 3, 4, 2], [4, 2, 3, 1], [1, 3, 4, 2]],
    quarters: { 1: [0], 2: [1, 2], 3: [3, 4, 0], 0: [1, 2, 3, 4] },
    hour: hz(52), gap: 0.9,
  },
  whittington: {
    name: 'Whittington',
    bells: scale(62, MAJOR),                               // D major, eight bells
    rows: [[8, 7, 6, 5, 4, 3, 2, 1], [8, 2, 7, 3, 6, 4, 5, 1], [8, 6, 4, 2, 7, 5, 3, 1], [8, 7, 4, 3, 6, 5, 2, 1], [2, 4, 6, 8, 5, 2, 3, 1]],
    quarters: { 1: [0], 2: [1, 2], 3: [3, 4, 0], 0: [1, 2, 3, 4] },
    hour: hz(50), gap: 0.5,
  },
  stmichael: {
    name: "St Michael's",
    bells: scale(53, MAJOR),                               // F major, eight bells
    rows: [[8, 2, 3, 4, 7, 5, 6, 1], [5, 4, 3, 6, 2, 7, 8, 1], [7, 8, 3, 4, 2, 5, 6, 1], [5, 7, 3, 8, 4, 2, 6, 1]],
    quarters: { 1: [0], 2: [1, 2], 3: [3, 0, 1], 0: [0, 1, 2, 3] },
    hour: hz(48), gap: 0.5,
  },
  hours: { name: 'Hours only', bells: [], rows: [], quarters: { 1: [], 2: [], 3: [], 0: [] }, hour: hz(52), gap: 0.9 },
  off: { name: 'Silent', bells: [], rows: [], quarters: { 1: [], 2: [], 3: [], 0: [] }, hour: 0, gap: 0.9 },
};
BM.CHIMES = TUNES;
BM.CHIME_ORDER = ['westminster', 'whittington', 'stmichael', 'hours', 'off'];

/* Ring a quarter (0 = the hour) on a clock's voice. Returns how long it takes, in seconds.
   voice: { octave (x2 per step), gain, decay, gapScale, hourGain, hourDecay, hourGap, hourMul, when } */
BM.ringChime = function (audio, key, quarter, hour, voice) {
  const T = TUNES[key] || TUNES.westminster, v = voice || {};
  if (!audio || !audio.bell || key === 'off') return 0;
  const oct = Math.pow(2, v.octave || 0), gap = T.gap * (v.gapScale || 1);
  let when = v.when || 0.4;
  for (const r of T.quarters[quarter] || []) {
    for (const b of T.rows[r]) { audio.bell(T.bells[b - 1] * oct, v.gain || 0.5, when, v.decay || 2.6); when += gap; }
    when += gap * 0.55;
  }
  if (quarter === 0 && hour > 0 && T.hour) {
    when += 1.2 * (v.gapScale || 1);
    const strikes = [];
    for (let i = 0; i < hour; i++) { audio.bell(T.hour * oct * (v.hourMul || 1), v.hourGain || 0.9, when, v.hourDecay || 5.5); strikes.push(when); when += v.hourGap || 2.4; }
    v.onStrike && strikes.forEach(v.onStrike);
  }
  return when;
};
})();
