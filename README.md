# Blackthorn Manor

A first-person atmospheric horror exploration game. You inherit a country house
that stopped in 1974. There is no combat and nothing chases you: the whole game
is finding electrical power and switching it on, and every light you restore
shows you more of what the family did to their daughter. The gates shut and
bolt behind you on the way in; getting them open again is the way out.

## Play

Open `blackthorn-manor.html` in a browser. It is one self-contained file
(Three.js r128 is inlined), runs offline from `file://`, and makes no network
requests. There is no build step.

| Key | Action |
| --- | --- |
| Mouse | Look around (click the view to capture the mouse) |
| W / A / S / D | Move and step sideways |
| Left Shift | Run (hold with W) |
| ← / → | Turn without the mouse |
| R / F | Look up / down without the mouse |
| Space | Jump |
| E | Interact: switches, doors (open and close), documents, appliances |
| T | Torch (starts off) |
| P | Phone (objective and documents) |
| L | Show / hide the lighting panel |
| O / I | Master switches: all outside supply (the lodge), all inside supply (MAIN) |
| 1 – 0 | Switch an estate lighting group from anywhere (while no panel is open) |
| Esc | Pause: mouse sensitivity, invert, volume, field of view, graphics, objective, start again |

Settings are remembered between visits in the same browser.

It begins in your own car, coming up Blackthorn Lane after midnight with the
radio playing: an old abandoned country road through miles of pine forest,
the bridge behind you under the river, the nearest town a hundred and fifty
kilometres away, and no signal. You are at the wheel of a modern SUV, the
cluster and the radio touchscreen glowing, the wipers going. A tyre blows with a
bang and starts slapping round; then something under the bonnet pops and fizzes,
the dash flickers, and smoke pours out. You pull over at the gates, the engine
dies, and the screens, the headlights and the radio fade out together. When you
get out the tyre is in shreds and the battery is dead. Press E, Space, Enter or
Escape to skip the arrival.

The lodge's telephone is dead. The gate box in the lodge has a lever that
releases the gates; past the contact in the drive they swing shut and bolt
behind you. The way out is the gate motor switch in the cellar (Eleanor's
journal in the attic tells you where), then the spare wheel and the car
battery from the garage, carried one at a time to your car. Fit them, turn the
key, and drive.

Doors open and close (the front doors inwards, the lodge door, the kitchen,
back and side doors, every room door). Sash windows slide up and let the rain
in; curtains draw and open, and some rooms are found with them drawn. Every
main room has a fireplace you can light and a candle you can light and snuff:
when the storm takes the power, that is your light. Behind the house is a
walled kitchen courtyard with two steel storm doors over steps down to the
cellar, bolted from inside. The clock tower over the hall is electric: with
the attic circuit on it ticks, chimes the quarters and strikes the hours, its
dial lit from behind on its own switch; a ladder from the attic goes up to the
clock room and the belfry. In the hall the grandfather clock was electrified with the house: with the
hall circuit on its pendulum swings and it chimes the quarters on its rods.
The garage has an up-and-over door you can pull down and lift again. At the east end of the back corridor a 1931 cage lift
runs from the cellar to the attic on the house supply: call it, step in, press
a floor, and the brass gate rattles shut behind you.

The lighting panel on the right of the screen has the two master switches, then
every estate group and every room's lights, with what is on, lit, warming up or without supply. It
works from anywhere, but a light still needs its supply: the lodge for the
estate, the hall circuit or MAIN for the house.

In the gatekeeper's lodge, the main switch powers the estate, and the estate
lighting panel under the window controls every outdoor group: `1` street
lighting, `2` gate lights, `3` floodlights (house and yard), `4` drive lamps,
`5` garden lights, `6` pool lights, `7` pond lights, `8` garage lights, `9` shed
lights, `0` cemetery lights, `A` everything on or off.

Everything starts dark, the lane's street lights included. The wiring is old, so
lights that get power together come on one at a time: the one nearest you
first, each warming up to full brightness before the next one starts. Every
room in the house, and every estate group, works through its own lights side
by side with the others. The fittings are fifty years old: bulbs sputter and warm up slowly, tubes strobe before they
hold, and each time a light is switched on it may blow (a flare, a bang, dead
for good) or come on but never stop flickering.

The lodge and the house are furnished, and their appliances work on real
circuits: televisions, fans, radios, kettles that boil and click off, bar
heaters that glow, a fridge whose compressor cycles, a radiogram, and electric
clocks that stop when the power does. Walk up to one and press E to switch it.

At the fuse board: `M` throws MAIN, `1`–`6` switch HALL, GROUND, EAST, WEST,
ATTIC, CELLAR. The gate motor switch is in the cellar, on the CELLAR circuit.

## Building

The game is written in `src/` (one file per system, loaded in name order) and
assembled into the single `blackthorn-manor.html` with Three.js r128 from
`vendor/` inlined:

    python3 src/assemble.py blackthorn-manor.html

## Tests

```
node tests/run.js            # every suite
node tests/run.js circuits   # one suite
```

`tests/harness.js` stubs the DOM, WebGL and Web Audio, and loads every
`<script>` in `blackthorn-manor.html` into a Node `vm` context. The WebGL stub
is complete enough for `THREE.WebGLRenderer` to run its real render path, so
draw-call counts are what the renderer actually issues.

| Suite | Checks |
| --- | --- |
| builds | Boots and runs with no frame errors or network use; 27 house windows; light count constant |
| arrival | The old road, poles and forest; a blowout, a pop and smoke under the bonnet; the SUV pulls over, stalls, its lights and radio die; you get out and walk; skippable |
| hud | The side lighting panel switches estate groups and rooms from anywhere; number keys; L; walking and running speeds |
| appliances | Lodge and house appliances: switching, boiling, cycling, clocks stopping, coming back by themselves |
| circuits | Lodge → estate lights and hall → MAIN, start-up behaviours, storm trip, appliances, fire, blown and faulty bulbs |
| playthrough | The whole game from the lane to the ending: the gates locking behind you, the storm, the gate motor, walking out; every leg walked by flood-fill under the current state |
| controls | The whole game again, played only with the keyboard (an autopilot steers with A/D/W and presses E) |
| reachability | Flood-fill over all four levels: every switch, door, ladder and readable can be reached and selected |
| doorways | Every wall gap walks through clear at full width, both directions |
| paths | The drive and every garden path walk clear at full width |
| furniture | No furniture penetrates a wall |
| windows | Every window can be seen out of |
| readables | No readable item is shadowed by a nearby control |
| budgets | Draw calls under 2,200 from every interactable and key viewpoint; canonical geometry only |
| random | 10,000 random interactions with no exceptions |
| quality | Adaptive quality steps on the median frame time; one bad frame cannot stop the loop |

## How it is put together

The HTML holds one `<script>` per system, in load order:

- `bm-10-power` — the electricity model. `PowerGrid` (circuits, breakers,
  storm trip), `LightRecord` (every light is data),
  start-up sequences and the nine light types.
- `bm-20-physics` — collision as data: walls and furniture boxes, floor rects,
  ramps and arcs (the curved stairs), sliding movement, occlusion rays and the
  flood-fill used by the tests.
- `bm-30-build` — canonical geometry scaled per mesh, procedural textures
  mapped in world space, walls with real door and window openings, fittings
  and interactables.
- `bm-40-grounds`, `bm-41-mansion`, `bm-43-appliances`, `bm-44-haunted` — the world,
  including the haunted garden (dead trees, yews, willow, blackthorn, ivy, crows).
- `bm-45-gothic` — the Gothic Revival exterior: corner towers and spires, the clock
  tower, steep slate roof, gables, buttresses, window hoods, gargoyles, the porch;
  angels, the mausoleum, the well and the swing in the grounds.
- `bm-46-dressing` — the interior's decay and furnishings: dust sheets, cobwebs,
  damp, peeling paper, drapes, candelabras, clock, armour, portraits, dolls.
- `bm-50-fx` — the pool of 8 point and 2 spot lights reassigned each frame,
  occluded coronas, zone fog, rain, lightning, mist, the torch beam and the
  mirrors.
- `bm-55-optimize` — start-up de-duplication and instancing, and adaptive
  quality.
- `bm-60-audio` — the Web Audio synth.
- `bm-70-game` — the player, input, interaction, story, UI and frame loop.
