# Flappy Bird — Web Game Spec

A single-page Flappy Bird clone in plain HTML, CSS, and JavaScript. The game runs entirely in the browser with no build step, no external libraries, and no network assets. A headless Node test exercises the core logic without a browser.

## File Layout

```
flappy/
├── SPEC.md       # This spec
├── index.html    # Page shell: loads style.css and game.js, contains the <canvas>
├── style.css     # Page background, canvas centering and border
├── game.js       # All game logic and rendering (the only script)
└── test.js       # Headless Node logic checks (DOM/Canvas shim)
```

## Game Loop

- `game.js` drives the loop with `requestAnimationFrame` and a delta-time parameter in seconds.
- Clamp each delta to 0.05 s so a background tab does not produce a physics jump.
- Each frame runs two steps in order: `update(dt)` then `render(ctx)`. All simulation lives in `update`. All drawing lives in `render`. `update` must not touch the DOM or the canvas context.
- Three states: `ready`, `playing`, `over`.
  - `ready`: the bird rests at the start position and a prompt shows "Click or press Space".
  - `playing`: physics run, pipes scroll, score counts.
  - `over`: motion stops, the final score and a restart prompt show.
- The first input in `ready` starts the game. Input in `over` restarts.

## Mechanics

### Flap
- A pointer click or tap on the canvas, or a `Space` keypress, sets the bird velocity to FLAP_VELOCITY.
- Input during `ready` starts the game. Input during `over` restarts. Neither flaps.

### Gravity
- During `playing`, each `update(dt)` adds GRAVITY × dt to the bird velocity.
- Cap the downward velocity at MAX_FALL.

### Pipe movement
- Pipes spawn off the right edge every SPAWN_INTERVAL seconds and move left at PIPE_SPEED.
- Each pipe pair has a gap of PIPE_GAP. The gap center is random in [100, 460], so the top and bottom pipes stay inside the playfield.
- Remove a pipe pair once its right edge passes the left edge of the canvas.

### Collision
- Use axis-aligned rectangle overlap between the bird hitbox and each pipe rectangle.
- Contact with a pipe or the ground sets the state to `over`.
- The ceiling clamps the bird at the top edge and the bird stays alive.

### Scoring
- The score increments by exactly 1 per pipe pair, at the moment the bird hitbox right edge passes the pair right edge. One increment per pair.
- The current score draws on the canvas during `playing` and as the final score on the `over` screen.

### Game over and restart
- On death, freeze all motion and show the final score.
- A restart input resets: state to `ready`, score to 0, bird to start position with zero velocity, pipes to an empty list.

## Layout

Canvas: 480 × 640, centered on the page with a plain border. The ground is a strip along the bottom, so the playfield is y = 0 to 560. Draw the bird as a circle of similar size to its hitbox. Draw pipes, bird, and ground programmatically with the Canvas 2D API. The background is a flat color. No images.

All values below are named constants, collected in a single `CONSTANTS` object in `game.js`:

| Constant       | Value      | Meaning                                   |
|----------------|------------|-------------------------------------------|
| WIDTH          | 480        | Canvas width                               |
| HEIGHT         | 640        | Canvas height                              |
| GROUND_H       | 80         | Ground strip height (ground top at y=560)  |
| BIRD_X         | 100        | Fixed bird x                               |
| BIRD_START_Y   | 280        | Bird start y                               |
| BIRD_SIZE      | 24 × 24    | Bird hitbox                                |
| PIPE_W         | 60         | Pipe width                                 |
| PIPE_GAP       | 150        | Gap height                                 |
| SPAWN_INTERVAL | 1.5 s      | Time between pipe spawns                   |
| PIPE_SPEED     | 150 px/s   | Leftward pipe speed                        |
| GRAVITY        | 1500 px/s² | Downward acceleration                      |
| FLAP_VELOCITY  | −400 px/s  | Upward impulse                             |
| MAX_FALL       | 600 px/s   | Terminal velocity                          |

## Headless Test Contract

`test.js` loads `game.js` in Node with a small DOM/Canvas shim. `game.js` must satisfy:

- The top level defines the game object and the constants from the layout table.
- Wire input listeners and start the rAF loop only when a DOM is present: guard this with `typeof document !== 'undefined'`.
- End with `if (typeof module !== 'undefined' && module.exports) { module.exports = { game, CONSTANTS }; }`.
- The exported `game` object exposes:
  - `state` ('ready' | 'playing' | 'over') and `score` (number)
  - `bird` with `x`, `y`, `vy`
  - `pipes` array of pipe pairs with `x` and gap position
  - `update(dt)`, `flap()`, `restart()`
- `update(dt)` performs one simulation step with no rendering side effects.

`test.js` runs five checks (state transitions, gravity, collision, scoring, restart) plus `node --check game.js`, and prints `N/5 checks passed`.

## Out of Scope

Sound, sprites, high-score persistence, difficulty progression, mobile-specific controls, ArrowUp input, responsive layout.

## Acceptance Criteria

- [ ] `index.html` with `style.css` and `game.js` runs in a modern browser with no console errors. The page loads no external libraries, fonts, images, or scripts.
- [ ] The bird falls under gravity, a click or Space flaps, pipes scroll left at PIPE_SPEED and spawn every SPAWN_INTERVAL, and the score increments once per pipe pair.
- [ ] Contact with a pipe or the ground ends the game. A restart input returns to `ready` with score 0 and no pipes.
- [ ] `node --check game.js` passes.
- [ ] `node test.js` prints `5/5 checks passed`.
- [ ] `python3 -m http.server 8000 --directory /Users/jokot/dev/flappy` serves the game: `curl -sI` on the local URL and on the ngrok public URL for port 8000 each returns HTTP 200.
