# Zuma — Web Game Spec

A single-page Zuma clone in plain HTML, CSS, and JavaScript. The entire game lives in one self-contained `index.html`: no build step, no framework, no CDN, no external libraries, no images, no sound, no network assets. Every visual is drawn with Canvas 2D primitives. A headless Node test exercises the core logic without a browser.

## File Layout

```
zuma/
├── SPEC.md       # This spec
├── index.html    # The entire game: markup, CSS, and all logic and rendering in one file
└── test.js       # Headless Node logic checks (extracts the game script from index.html)
```

`index.html` is the only runtime artifact. Its game code sits inside a single `<script>` block delimited by the marker comments `<!-- GAME-SCRIPT-START -->` and `<!-- GAME-SCRIPT-END -->` so `test.js` can extract it. Nothing else in the file is logic.

## Game Loop

- The game script drives the loop with `requestAnimationFrame` and a delta-time parameter in seconds.
- Clamp each delta to 0.05 s so a background tab does not produce a physics jump.
- Each frame runs two steps in order: `update(dt)` then `render(ctx)`. All simulation lives in `update`. All drawing lives in `render`. `update` must not touch the DOM or the canvas context.
- Three states: `ready`, `playing`, `over`.
  - `ready`: the track and shooter are drawn, the chain is empty, and a prompt shows "Click to start".
  - `playing`: balls spawn and roll, the shooter aims and fires.
  - `over`: motion stops, a final message shows ("You win!" or "You lose"), and a click restarts.
- The first click in `ready` starts the game. A click in `over` restarts (identical reset to `ready`, then straight into `playing`).

## Track Path

One fixed curved track, defined at init and never changed. It is a Catmull-Rom spline through 11 control points in canvas coordinates (x right, y down):

```
P0 (-30, 430)   P1 (120, 430)   P2 (240, 360)   P3 (210, 240)   P4 (330, 180)
P5 (470, 220)   P6 (500, 340)   P7 (620, 390)   P8 (700, 300)   P9 (660, 180)
P10 (540, 120)
```

- P0 is the spawn entrance: it lies off-canvas, so balls appear to enter from the left edge. P10 is the hole at (540, 120).
- Standard uniform Catmull-Rom interpolation over each segment [Pi, Pi+1] with tangent control points clamped at the ends (P[−1] = P0, P[n+1] = P[n]).
- Sampling rule: for each of the 10 segments i = 0…9, evaluate t = k/24 for k = 0…23; finally append the exact endpoint (540, 120). This yields exactly 241 samples.
- Precompute the cumulative arc length along the samples. Total length ≈ 1,359 px (compute the exact value at init as `PATH_LENGTH`).
- `pathPoint(s)` maps an arc position to a point: clamp s below 0 to the entrance sample and above `PATH_LENGTH` to the hole sample; otherwise linearly interpolate between the two samples bracketing s.
- The track has no self-crossings (verified: minimum clearance between non-adjacent sections is ≈ 88 px) and stays at least 200 px from the shooter.
- Render the track as a stroked polyline through all 241 samples: `lineWidth` 28, round joins and caps, colour `#232A33`.

## Chain

- A ball is `{ colorIndex, s }`: one of 4 colour indices (0–3) and its arc position `s` along the track.
- `chain` is an array ordered from the hole end to the entrance end: `chain[0]` is the ball closest to the hole (largest `s`).
- Spawning: one level has exactly `BALL_COUNT` = 60 balls. While `playing` and fewer than 60 have spawned, spawn one new ball whenever the chain is empty or the back ball's `s` ≥ `CHAIN_SPACING`; the new ball spawns at `s` = 0 with the next colour from the pre-generated sequence (see Colors and Level).
- Speed: touching balls advance at `CHAIN_SPEED` = 25 px/s. Per frame, iterate the chain front to back. `chain[0]` has no ball ahead and always advances by `CHAIN_SPEED × dt`. Every other ball measures its gap ahead, `ballAhead.s − s`. A ball whose gap is greater than `CHAIN_SPACING + CONTIGUOUS_EPS` advances by `CHAIN_SPEED × GAP_CLOSE_MULT × dt`. Every other ball advances by `CHAIN_SPEED × dt`. In both cases clamp the result: `s = min(s + advance, ballAhead.s − CHAIN_SPACING)`.
- A trailing ball closes a gap only when it moves faster than the ball ahead of it. The clamp prevents overlap. The clamp never closes a gap. Two balls that both advance by `CHAIN_SPEED × dt` hold the same distance forever, so `GAP_CLOSE_MULT` is required for criterion 7 to pass. Draft 1 of this specification omitted `GAP_CLOSE_MULT` and claimed that the clamp closed gaps. A 10 second simulation of that formula left a 100 px gap at exactly 100.00 px. See learning record 0016.
- Position on canvas: ball centre = `pathPoint(s)`.
- A ball reaching the hole (its `s` ≥ `PATH_LENGTH`) triggers the lose condition.

## Shooter

- Fixed at `SHOOTER_X`, `SHOOTER_Y` = (400, 520); it never moves.
- Aiming: `setAim(x, y)` sets `aimAngle = atan2(y − SHOOTER_Y, x − SHOOTER_X)`. Mouse move over the canvas calls it with the pointer position, so the barrel always points at the mouse.
- Loaded ball: the shooter always holds one ball whose colour index was chosen uniformly at random (`Math.floor(Math.random() * 4)`), assigned when loaded (at game start and immediately after every launch). The loaded ball renders at the shooter's centre.
- Launch: `launch()` spawns a projectile at the shooter's centre with velocity `PROJECTILE_SPEED` = 600 px/s along `aimAngle` (`vx = cos(aimAngle) × speed`, `vy = sin(aimAngle) × speed`). Multiple projectiles may be in flight.
- Rendering: shooter body is a filled circle (radius 16, `#2E3642`, stroked `#46505E`) plus a barrel rectangle 26 × 10 px rotated to `aimAngle`; the loaded ball renders on top of the body centre. A dashed aim line (`setLineDash([4, 6])`, `rgba(255,255,255,0.25)`) runs from the shooter along the aim direction to the canvas edge.

## Insertion

- A projectile collides with the first chain ball whose centre comes within `COLLIDE_RADIUS` = 24 px (checked after each movement sub-step — see Projectiles). If several qualify in the same sub-step, take the nearest.
- On collision, the projectile joins the chain at the impact point:
  1. Project the projectile's position onto the track: `s_P` = the arc position of the nearest of the 241 path samples to the projectile's centre.
  2. If `s_P > s(hit ball)`, insert the projectile in front of it in the chain array; otherwise insert behind it. Set its `s` = `s_P`.
  3. Spacing pass: iterate the chain front to back and set each ball's `s = min(s, ballAhead.s − CHAIN_SPACING)`. Balls pushed past their neighbours slide back toward the entrance; because balls with a gap ahead roll forward again (see Chain), the chain visibly pushes apart at the impact and then recompresses. Balls may push back past the entrance (`s` < 0, off-canvas inside the tunnel) — no clamping.
- After insertion the shooter immediately loads a new random ball, and match resolution runs (below).
- Projectiles ignore the track, the hole, and empty gaps: they only ever collide with chain balls.

## Match Resolution

- Two adjacent chain balls are "touching" when `ballAhead.s − ballBehind.s ≤ CHAIN_SPACING + 0.5`.
- Once per frame, after movement and insertions, scan the chain front to back: a run is a maximal sequence of consecutive balls with the same `colorIndex` in which each consecutive pair is touching. Remove every run of length ≥ 3 in a single pass.
- Removed balls disappear immediately. The balls behind the removed run now have a gap ahead and roll forward to close it (Chain rule).
- Cascades: when groups re-contact across a closed gap and form a new touching run of 3+, the per-frame match check removes it too. Resolution continues frame by frame until no touching run of 3+ remains — cascades need no special code, only the per-frame check.
- No score is tracked or displayed.

## Win and Lose

- Lose: any ball reaches the hole (`s` ≥ `PATH_LENGTH`). The state becomes `over` with the message "You lose".
- Win: all 60 balls have spawned and the chain is empty (every ball was cleared by matches). The state becomes `over` with the message "You win!".
- Check lose first, then win, each frame after movement and match resolution.

## Colors and Level

Exactly four ball colours, distinguishable by hue. Fill and stroke hex values:

| Index | Name   | Fill     | Stroke   |
|-------|--------|----------|----------|
| 0     | red    | `#E53935` | `#7F1610` |
| 1     | yellow | `#FDD835` | `#9A7B00` |
| 2     | green  | `#43A047` | `#1E5B24` |
| 3     | blue   | `#1E88E5` | `#114B78` |

- Ball sequence: at game start, generate an array of 60 colour indices, each uniform at random. Regenerate until every colour appears at least 3 times (so the level is always clearable).
- One level only: fixed 60-ball count, no level progression, no speed ramp.
- Ball rendering (canvas primitives only): filled circle radius `BALL_RADIUS` = 12 in the fill colour, 2 px stroke in the stroke colour, and a 3 px radius white highlight circle at offset (−4, −4) with 40% alpha. Projectiles render identically.

## Layout

Canvas: 800 × 600, centred on the page with a plain border; the canvas is not CSS-scaled, so `offsetX/offsetY` are direct canvas coordinates. Page background dark (`#10141A`), canvas background the same. Draw order each frame: background → track polyline → hole → aim line → chain balls → projectiles → shooter body and barrel → loaded ball → HUD text and state prompts.

- Hole: filled circle radius 18 at (540, 120) in `#05070A` with a 2 px `#3A424D` ring.
- HUD: top-left text "Balls: N", where N = unspawned balls + current chain length; 16 px monospace, fill `#C8D0DA`.
- Prompts: in `ready`, centred text "Click to start"; in `over`, centred "You win!" or "You lose" plus "Click to restart".

All values below are named constants, collected in a single `CONSTANTS` object inside the game script:

| Constant             | Value | Meaning                                      |
|----------------------|-------|----------------------------------------------|
| WIDTH                | 800   | Canvas width (px)                            |
| HEIGHT               | 600   | Canvas height (px)                           |
| BALL_RADIUS          | 12    | Ball radius (px)                             |
| CHAIN_SPACING        | 24    | Centre-to-centre distance of touching balls  |
| CHAIN_SPEED          | 25    | Chain advance speed (px/s)                   |
| PROJECTILE_SPEED     | 600   | Launched ball speed (px/s)                   |
| COLLIDE_RADIUS       | 24    | Projectile–chain collision distance (px)     |
| SHOOTER_X            | 400   | Shooter x (px)                               |
| SHOOTER_Y            | 520   | Shooter y (px)                               |
| SHOOTER_RADIUS       | 16    | Shooter body radius (px)                     |
| HOLE_RADIUS          | 18    | Hole radius (px)                             |
| BALL_COUNT           | 60    | Balls per level                              |
| COLORS               | `['#E53935','#FDD835','#43A047','#1E88E5']` | Fill colours, index 0–3 |
| STROKES              | `['#7F1610','#9A7B00','#1E5B24','#114B78']` | Stroke colours, index 0–3 |
| PATH_POINTS          | the 11 points above | Track control points            |
| SAMPLES_PER_SEGMENT  | 24    | Spline subdivisions per segment              |
| SPAWN_S              | 0     | Arc position where balls spawn               |
| PROJECTILE_STEP      | 8     | Max projectile sub-step (px)                 |
| CONTIGUOUS_EPS       | 0.5   | Touching tolerance (px)                      |
| GAP_CLOSE_MULT       | 3     | Speed multiple for a ball closing a gap      |

## Projectiles

- Each frame, a projectile moves `PROJECTILE_SPEED × dt` along its velocity — but in sub-steps of at most `PROJECTILE_STEP` = 8 px, checking chain collision after every sub-step, so a 0.05 s delta cannot tunnel through a ball.
- A projectile whose centre leaves the canvas by more than 20 px on any side is removed without effect.

## Input

Wire listeners on the canvas element. Mapping:

| Input            | Action                                                        |
|------------------|---------------------------------------------------------------|
| `mousemove`      | Aim the shooter at the pointer                                |
| `mousedown`      | `ready`: start game · `playing`: launch the loaded ball · `over`: restart |

Only the left button is used. No keyboard input is required; nothing scrolls because the page has no scrollable content.

## Headless Test Contract

`test.js` runs in Node with a small DOM/Canvas shim. It reads `index.html`, extracts the text between `<!-- GAME-SCRIPT-START -->` and `<!-- GAME-SCRIPT-END -->`, and evaluates it with `vm` after installing shim globals (`document` returning a canvas whose `getContext('2d')` is a no-op recording stub, `window`, and `requestAnimationFrame`). The game script must satisfy:

- The top level defines the game object and every constant from the layout table.
- Wire input listeners and start the rAF loop only when a DOM is present: guard this with `typeof document !== 'undefined'`.
- End with `if (typeof module !== 'undefined' && module.exports) { module.exports = { game, CONSTANTS }; }` so the shim can capture the exports.
- The exported `game` object exposes:
  - `state` ('ready' | 'playing' | 'over'), `win` (boolean, meaningful in `over`), `spawned` (number of balls spawned so far)
  - `chain` (array of `{ colorIndex, s }`, front = hole end), `loadedColor` (0–3), `projectiles` (array of `{ x, y, vx, vy }`)
  - `aimAngle` (number), `PATH_LENGTH` (number), `pathPoint(s)` → `{ x, y }`
  - `update(dt)`, `start()`, `launch()`, `setAim(x, y)`, `restart()`
- `update(dt)` performs one simulation step with no rendering side effects.
- Tests may set `game.chain` directly (e.g. `[{ colorIndex: 2, s: 100 }, …]`) to construct deterministic positions, then drive the simulation via `update`, `launch`, and `setAim`.

`test.js` runs eight checks (initial state and loaded ball, start and chain advance, aiming, launch trajectory, insertion with spacing, single-run removal and gap closing, cascade resolution, win and lose conditions) and prints `N/8 checks passed`.

## Out of Scope

Sound, score and combos, ball back-spin or snapback, reverse/precision aiming, next-ball preview, pause, multiple levels, speed ramps, frog swap (right-click), ball trails and particles, high-score persistence, mobile/touch controls, responsive layout.

## Acceptance Criteria

1. [ ] `index.html` alone runs the game in a modern browser with no console errors. The file references no external libraries, fonts, images, sprites, scripts, or network assets of any kind.
2. [ ] The track renders as a smooth curve through the 11 specified points: balls enter from the left edge near y = 430 and the hole sits at (540, 120).
3. [ ] Balls spawn at the entrance and roll toward the hole at 25 px/s; the chain stays contiguous at 24 px spacing and compresses correctly after insertions.
4. [ ] The shooter sits fixed at (400, 520) and its barrel follows the mouse on every mousemove.
5. [ ] Clicking in `playing` launches the loaded ball along the aim direction at 600 px/s and instantly loads a new uniformly random colour; multiple shots can be in flight; shots that hit nothing leave the canvas and vanish.
6. [ ] A launched ball that hits the chain joins it at the impact point — inserted before or behind the hit ball per the projection rule — pushing neighbours apart while the spacing pass keeps 24 px between touching balls.
7. [ ] Contiguous touching runs of 3+ same-coloured balls are removed; gaps close as rear balls roll forward; newly formed 3+ runs cascade until the chain is stable.
8. [ ] Clearing all 60 balls shows "You win!"; letting any ball reach the hole shows "You lose"; a click restarts with a fresh 60-ball sequence in `ready`-then-`playing`.
9. [ ] Exactly four ball colours (red, yellow, green, blue) are used; every generated sequence gives each colour at least 3 balls.
10. [ ] All visuals are Canvas 2D primitives (circles, rects, lines, dashes, text) — no images, sprites, emoji, or fonts loaded over the network.
11. [ ] `node --check test.js` passes and `node test.js` prints `8/8 checks passed`.
12. [ ] `python3 -m http.server 8000 --directory /Users/jokot/dev/plants/zuma` serves the game: `curl -sI` on the local URL and on the ngrok public URL for port 8000 each returns HTTP 200.