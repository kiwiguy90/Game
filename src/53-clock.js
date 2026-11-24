/* ==========================================================================
   BLACKTHORN MANOR — 5c. THE TOWER CLOCK
   The clock over the hall stopped at 11:41 on the night the house was shut.
   It is electric: with the attic circuit live it catches, ticks and runs
   (fast: four minutes to the real one, so the night moves), the hands turn,
   and it chimes the Westminster quarters on four small bells and strikes
   the hours on the great bell. The storm trip stops it dead. The opal dial
   glows when its lamps are switched on.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;

const RATE = 4;               // clock seconds per real second
const QUARTER = 900;
/* the tunes themselves (Westminster by default) are in 12-chimes.js */

class TowerClock {
  constructor(game) {
    this.game = game; this.c = game.towerClock;
    this.c.running = false; this.c.ever = false;
    this.quarter = Math.floor(this.c.time / QUARTER);
    this.tickT = 0; this.tock = false; this.hammerT = 0;
    this.chimes = 0; this.strikes = 0; this.log = [];
  }
  get powered() { return this.game.grid.live('attic'); }
  /* How loud the tower is from where the player stands: carried across the whole estate. */
  hearing(pos) {
    const p = this.game.player, d = Math.hypot(pos.x - p.x, pos.y - p.y - 1.6, pos.z - p.z);
    let v = Math.max(0.06, 1 - d / 170);
    const inTower = p.y > 10 && Math.abs(p.x) < 4 && p.z > 6.5 && p.z < 12.5;
    if (!inTower && this.game.zoneAt(p.x, p.y, p.z) === 'house') v *= 0.45;
    return v;
  }
  update(dt) {
    const c = this.c, g = this.game, audio = g.audio;
    const was = c.running; c.running = this.powered;
    if (c.running && !was) {
      audio.clunk(0.6 * this.hearing(c.mechPos));
      if (!c.ever) { c.ever = true; g.ui.say('Somewhere above the hall a heavy mechanism catches, and begins to tick.', 5); }
      g.events.emit('clock:start');
    }
    if (!c.running && was) g.events.emit('clock:stop');
    if (c.running) {
      c.time += dt * RATE;
      const q = Math.floor(c.time / QUARTER);
      // (if the grandfather clock in the hall is still chiming, the tower waits for it to finish)
      if (q !== this.quarter && !(g.chimeBusyUntil > g.time)) { this.quarter = q; this.chime(q % 4, Math.floor(c.time / 3600) % 12 || 12); }
      // the escapement, heard close to
      this.tickT += dt;
      if (this.tickT >= 1.0) {
        this.tickT -= 1.0; this.tock = !this.tock;
        const p = g.player, d = Math.hypot(c.mechPos.x - p.x, c.mechPos.y - p.y - 1.6, c.mechPos.z - p.z);
        if (d < 16) audio.tick(Math.max(0, 1 - d / 16) * (p.y > 10 ? 1 : 0.4), this.tock);
      }
    }
    // the hands and the pendulum
    const t = c.time % 43200;
    c.hands[0].rotation.z = -(t / 43200) * Math.PI * 2;
    c.hands[1].rotation.z = -((t % 3600) / 3600) * Math.PI * 2;
    if (c.pendulum) { c.pendulum.rotation.z = c.running ? Math.sin(g.time * Math.PI * 2 / 1.5) * 0.09 : c.pendulum.rotation.z * (1 - Math.min(1, dt * 2)); }
    // the hammer kicks when the great bell is struck
    if (this.hammerT > 0) { this.hammerT -= dt; c.hammer.rotation.z = -0.55 * Math.max(0, Math.sin(Math.min(1, this.hammerT / 0.25) * Math.PI)); }
    // the opal dial glows with its lamps
    const l = g.grid.light('clock-dial-1'), k = l && l.target > 0 ? Math.min(1, l.intensity / l.target) : 0;
    c.dialMat.color.setRGB(0.23 + 0.77 * k, 0.2 + 0.7 * k, 0.16 + 0.5 * k);
  }
  /* The quarter chime, then the hour on the great bell. */
  chime(quarter, hour) {
    const g = this.game, audio = g.audio, v = this.hearing(this.c.bellPos);
    // the tune is chosen on the side panel; the tower can also be switched off there altogether
    const tune = g.towerOff ? 'off' : (g.chimeTunes && g.chimeTunes.tower) || 'westminster';
    const when = BM.ringChime(audio, tune, quarter, hour, { gain: 0.5 * v, decay: 2.6, hourGain: 0.9 * v, hourDecay: 5.5, hourGap: 2.4, onStrike: w => this.strikeAt(w) });
    this.chimes++;
    g.events.emit('clock:chime', { quarter, hour });
    if (tune === 'off') { this.log.push({ quarter, hour }); return; }
    if (quarter === 0) {
      this.strikes += hour;
      g.ui.say(hour === 12 ? 'Midnight. Above the house, the great bell begins to strike twelve.' : `The clock tower strikes ${['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][hour - 1]}.`, 6);
    } else if (this.chimes === 1 && tune !== 'hours') g.ui.say('From the tower over the hall, the bells carry across the grounds: the clock chimes the quarter.', 5);
    this.log.push({ quarter, hour });
    g.chimeBusyUntil = g.time + when + 3; // let the last bell ring out before anything else chimes
  }
  strikeAt(when) {
    // the hammer's swing is scheduled in game time
    (this.pendingStrikes = this.pendingStrikes || []).push(this.game.time + when);
  }
  tickHammers() {
    const ps = this.pendingStrikes; if (!ps || !ps.length) return;
    while (ps.length && ps[0] <= this.game.time) { ps.shift(); this.hammerT = 0.25; }
  }
}
BM.TowerClock = TowerClock;
})();
