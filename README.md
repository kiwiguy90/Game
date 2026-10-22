# Blackthorn Manor

A first-person atmospheric horror exploration game. You inherit a country house
that stopped in 1974. There is no combat and nothing chases you: the whole game
is finding electrical power and switching it on, and every light you restore
shows you more of what the family did.

## Play

Open `blackthorn-manor.html` in a browser. It is one self-contained file
(Three.js r128 is inlined), runs offline from `file://`, and makes no network
requests. There is no build step.

| Key | Action |
| --- | --- |
| W / S | Move forward / back |
| Left Shift | Run (hold with W) |
| A / D | Turn (tank controls) |
| Space | Jump |
| E | Interact / put down / close a panel |
| T | Torch (starts off) |
| P | Phone (objective and documents) |
| R / F | Look up / down |
| L | Show / hide the lighting panel |
| 1 – 0 | Switch an estate lighting group from anywhere (while no panel is open) |
| Mouse | Click a row on the lighting panel to switch it |

It begins in your own car, coming up Blackthorn Lane after midnight with the
radio on low: an old abandoned country road through miles of pine forest,
cracked tarmac, potholes full of rain, and timber power poles leaning along
the verge with the street lights hung off their arms. The car stalls at the
gates, the headlights flicker and die and the battery is flat; that is why you
are here on foot. Press E, Space, Enter or Escape to skip the arrival.

The lighting panel on the right of the screen lists every estate group and
every room's lights, with what is on, lit, warming up or without supply. It
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
ATTIC, CELLAR. At the routing console: `1`–`6` feed PLATFORM, LIFTS, LABS,
SECURITY, DINING, CORE.

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
| arrival | The old road, poles and forest; the car drives in, stalls, its lights die; you get out and walk; skippable |
| hud | The side lighting panel switches estate groups and rooms from anywhere; number keys; L; walking and running speeds |
| appliances | Lodge and house appliances: switching, boiling, cycling, clocks stopping, coming back by themselves |
| circuits | Lodge → estate lights and hall → MAIN, start-up behaviours, storm trip, appliances, fire, generator limit, the SECURITY bus |
| playthrough | The whole game from the lane to the ending, walking every leg by flood-fill under the current state |
| controls | The whole game again, played only with the keyboard (an autopilot steers with A/D/W and presses E) |
| reachability | Flood-fill over all seven levels: every switch, door, ladder, lift and readable can be reached and selected |
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
  storm trip, Hive generator routing), `LightRecord` (every light is data),
  start-up sequences and the nine light types.
- `bm-20-physics` — collision as data: walls and furniture boxes, floor rects,
  ramps and arcs (the curved stairs), sliding movement, occlusion rays and the
  flood-fill used by the tests.
- `bm-30-build` — canonical geometry scaled per mesh, procedural textures
  mapped in world space, walls with real door and window openings, fittings
  and interactables.
- `bm-40-grounds`, `bm-41-mansion`, `bm-42-hive`, `bm-43-appliances`, `bm-44-haunted` — the world,
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
