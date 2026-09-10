# Tetris — Web Game Spec

A single-page Tetris clone in plain HTML, CSS, and JavaScript. The game runs entirely in the browser with no build step, no external libraries, and no network assets. A headless Node test exercises the core logic without a browser.

## File Layout

```
tetris/
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
- Three states: `ready`, `playing`, `over`. `P` toggles a `paused` flag while `playing` (a paused game skips `update` entirely and draws a "Paused" overlay; only `P` is accepted while paused).
- `ready`: the board is empty and a prompt shows "Press Space". `Space` starts the game.
- `over`: motion stops, the final score shows, and `Space` restarts (same reset as `ready`, then straight into `playing`).

## Board

- A grid of 10 columns × 20 rows, stored as a 20-element array of 10-element rows. An empty cell is `0`; a filled cell holds an integer 1–7 identifying the piece color.
- The board spawns empty. Filled cells only ever come from locked pieces.
- Draw the board as a bordered well on the canvas: each cell CELL × CELL pixels, with a thin grid line per cell. The well sits at BOARD_X, BOARD_Y on the canvas.

## Pieces

Seven tetrominoes, each with a fixed color and a spawn-shape matrix. `1`–`7` in the matrix are placeholders for the piece's color index; `.` is empty. Spawn shapes:

| Piece | Color index | Color   | Spawn matrix              |
|-------|-------------|---------|---------------------------|
| I     | 1           | cyan    | `['....','1111','....','....']` |
| O     | 2           | yellow  | `['22','22']`             |
| T     | 3           | purple  | `['.3.','333','...']`     |
| S     | 4           | green   | `['.44','44.','...']`     |
| Z     | 5           | red     | `['55.','.55','...']`     |
| J     | 6           | blue    | `['6..','666','...']`     |
| L     | 7           | orange  | `['..7','777','...']`     |

- Spawn position: the matrix's top-left cell lands at column 3, row 0 for I, T, S, Z, J, L; at column 4, row 0 for O.
- On spawn, the next piece is chosen uniformly at random from the seven types (`Math.floor(Math.random() * 7)`).
- The next piece's type and spawn shape draw in a preview panel to the right of the well, before it spawns.

## Mechanics

### Movement
- `ArrowLeft` / `ArrowRight` move the active piece one column left/right, if every matrix cell's target cell is empty or out of bounds above the board.
- A move that would overlap the board or pass a side wall is rejected whole (no partial moves).

### Rotation
- `ArrowUp` rotates the active piece's matrix 90° clockwise (transpose + reverse rows). The O piece rotates to itself.
- After rotating, if the piece collides, apply wall kicks in this order and take the first that fits: (0, 0), (−1, 0), (+1, 0), (−2, 0), (+2, 0), (0, −1). Offsets are (dx, dy) in cells.
- If no offset fits, the rotation is cancelled and the matrix reverts.

### Gravity
- During `playing` (not paused), gravity accumulates delta time. Once the accumulator reaches `dropInterval`, the piece attempts to move down one row and the accumulator resets.
- If the piece cannot move down, it locks: its cells are written into the board, lines clear, and the next piece spawns.

### Soft drop and hard drop
- `ArrowDown` (soft drop) moves the piece one row down immediately and resets the gravity accumulator. Each successful soft-drop row scores 1 point. If it cannot move down, the piece locks (same path as gravity).
- `Space` (hard drop) moves the piece to the lowest valid position instantly, scores 2 points per row dropped, and locks immediately.

### Line clears
- After a piece locks, every row that is completely filled is removed at once (1–4 rows possible). Rows above shift down by the number of removed rows; the top fills with empty rows.

### Scoring and speed
- Line-clear score: 1 row = 100, 2 = 300, 3 = 500, 4 = 800, all multiplied by the current level.
- Total cleared lines and level are tracked. `level = 1 + floor(lines / 10)` — speed increases every 10 cleared rows.
- `dropInterval = max(0.1, 0.8 − 0.07 × (level − 1))` seconds, recomputed whenever the level changes.

### Game over
- When a newly spawned piece collides at its spawn position, the state becomes `over`, the board freezes, and the final score shows.
- `Space` restarts: board emptied, score/lines/level reset to 0/0/1, dropInterval back to its level-1 value, new piece and preview drawn.

## Layout

Canvas: 480 × 640, centered on the page with a plain border. The well is 300 × 600 (10 × 20 cells of 30 px) drawn at (90, 20). The side panel to the right of the well shows "NEXT" with the preview piece and "SCORE / LINES / LEVEL" readouts. All drawing is programmatic with the Canvas 2D API: flat colors, 1 px grid lines, a 1 px border around the well. No images.

All values below are named constants, collected in a single `CONSTANTS` object in `game.js`:

| Constant       | Value | Meaning                                    |
|----------------|-------|--------------------------------------------|
| WIDTH          | 480   | Canvas width                                |
| HEIGHT         | 640   | Canvas height                               |
| COLS           | 10    | Board columns                               |
| ROWS           | 20    | Board rows                                  |
| CELL           | 30    | Cell size in px                             |
| BOARD_X        | 90    | Well left edge on canvas                    |
| BOARD_Y        | 20    | Well top edge on canvas                     |
| SPAWN_COL      | 3     | Spawn column for I, T, S, Z, J, L (O uses 4)|
| SPAWN_ROW      | 0     | Spawn row                                   |
| DROP_START     | 0.8   | Level-1 gravity interval, seconds           |
| DROP_MIN       | 0.1   | Minimum gravity interval, seconds           |
| DROP_STEP      | 0.07  | Interval reduction per level, seconds       |
| LINE_SCORES    | [100, 300, 500, 800] | Points per clear, × level |
| SOFT_DROP_PTS  | 1     | Points per soft-dropped row                 |
| HARD_DROP_PTS  | 2     | Points per hard-dropped row                 |

Piece colors as hex strings, keyed by color index 1–7: I `#00F0F0`, O `#F0F000`, T `#A000F0`, S `#00F000`, Z `#F00000`, J `#0000F0`, L `#F0A000`.

## Input

Wire `keydown` on `document`. Call `preventDefault()` for ArrowLeft, ArrowRight, ArrowUp, ArrowDown, and Space so the page does not scroll. Mapping:

| Key        | Action                                            |
|------------|---------------------------------------------------|
| ArrowLeft  | Move piece left                                   |
| ArrowRight | Move piece right                                  |
| ArrowUp    | Rotate clockwise with wall kicks                  |
| ArrowDown  | Soft drop one row (+1 point per row, locks at bottom) |
| Space      | Start (ready) / hard drop (playing) / restart (over) |
| KeyP       | Pause / resume while playing                      |

No key-repeat handling beyond the browser's native repeat: each keydown event performs exactly one action.

## Headless Test Contract

`test.js` loads `game.js` in Node with a small DOM/Canvas shim. `game.js` must satisfy:

- The top level defines the game object and the constants from the layout table.
- Wire input listeners and start the rAF loop only when a DOM is present: guard this with `typeof document !== 'undefined'`.
- End with `if (typeof module !== 'undefined' && module.exports) { module.exports = { game, CONSTANTS }; }`.
- The exported `game` object exposes:
  - `state` ('ready' | 'playing' | 'over'), `paused` (boolean), `score`, `lines`, `level`, `dropInterval` (number)
  - `board` (20×10 array of 0–7)
  - `piece` with `type` ('I'|'O'|'T'|'S'|'Z'|'J'|'L'), `matrix`, `x`, `y`, and `nextType`
  - `update(dt)`, `start()`, `moveLeft()`, `moveRight()`, `rotate()`, `softDrop()`, `hardDrop()`, `togglePause()`, `restart()`
- `update(dt)` performs one simulation step with no rendering side effects.
- Tests may set `game.board` and `game.piece` directly to construct deterministic positions, then drive locks via `update` or `hardDrop`.

`test.js` runs eight checks (initial state, spawn and preview, movement and wall clamp, rotation with wall kick, single-line clear and scoring, tetris clear plus level speed-up, soft/hard drop points, game over and restart) plus `node --check game.js`, and prints `N/8 checks passed`.

## Out of Scope

Sound, hold piece, 7-bag randomizer, ghost piece, T-spins and combo scoring, high-score persistence, mobile/touch controls, full SRS kick tables, responsive layout.

## Acceptance Criteria

- [ ] `index.html` with `style.css` and `game.js` runs in a modern browser with no console errors. The page loads no external libraries, fonts, images, or scripts.
- [ ] Pieces spawn at SPAWN_COL/SPAWN_ROW with the next piece visible in the preview. ArrowLeft/Right move, ArrowUp rotates with wall kicks, ArrowDown soft-drops and locks at the bottom, Space hard-drops, P pauses and resumes.
- [ ] Gravity drops the piece every `dropInterval`; a locking piece clears all full rows; scoring is 100/300/500/800 × level plus 1 per soft-dropped and 2 per hard-dropped row; the level rises every 10 lines and `dropInterval` shrinks accordingly.
- [ ] A spawn blocked by filled cells ends the game; Space restarts with an empty board and reset score.
- [ ] `node --check game.js` passes.
- [ ] `node test.js` prints `8/8 checks passed`.
- [ ] `python3 -m http.server 8000 --directory /Users/jokot/dev/tetris` serves the game: `curl -sI` on the local URL and on the ngrok public URL for port 8000 each returns HTTP 200.
