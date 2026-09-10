/* Tetris — plain HTML/CSS/JS/Canvas implementation.
 *
 * Structure:
 *   - CONSTANTS: every named value from the SPEC table.
 *   - PIECES:    the seven tetrominoes (spawn shape + color).
 *   - Pure game logic (collision, movement, rotation, gravity, line clears,
 *     scoring, spawn/game-over) lives on the `game` object and touches NO DOM
 *     or canvas context.
 *   - Rendering (render) and the input/rAF loop are separated below and only
 *     activate when a DOM is present (typeof guard), so `game` loads headless
 *     under Node for test.js.
 */

"use strict";

/* ------------------------------------------------------------------ */
/* Constants and piece data                                           */
/* ------------------------------------------------------------------ */

const CONSTANTS = {
  WIDTH: 480,
  HEIGHT: 640,
  COLS: 10,
  ROWS: 20,
  CELL: 30,
  BOARD_X: 90,
  BOARD_Y: 20,
  SPAWN_COL: 3,
  SPAWN_ROW: 0,
  DROP_START: 0.8,
  DROP_MIN: 0.1,
  DROP_STEP: 0.07,
  LINE_SCORES: [100, 300, 500, 800],
  SOFT_DROP_PTS: 1,
  HARD_DROP_PTS: 2,
};

// type -> { index (board color index 1-7), hex (render color), spawn matrix }
const PIECES = {
  I: { index: 1, hex: "#00F0F0", shape: ["....", "1111", "....", "...."] },
  O: { index: 2, hex: "#F0F000", shape: ["22", "22"] },
  T: { index: 3, hex: "#A000F0", shape: [".3.", "333", "..."] },
  S: { index: 4, hex: "#00F000", shape: [".44", "44.", "..."] },
  Z: { index: 5, hex: "#F00000", shape: ["55.", ".55", "..."] },
  J: { index: 6, hex: "#0000F0", shape: ["6..", "666", "..."] },
  L: { index: 7, hex: "#F0A000", shape: ["..7", "777", "..."] },
};

const PIECE_TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

/* Create a fresh board: ROWS rows of COLS empty (0) cells. */
function emptyBoard() {
  const board = [];
  for (let r = 0; r < CONSTANTS.ROWS; r++) {
    board.push(new Array(CONSTANTS.COLS).fill(0));
  }
  return board;
}

/* Pure helpers ------------------------------------------------------ */

/* Rotate a shape matrix 90 degrees clockwise: transpose then reverse rows. */
function rotateCW(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = [];
  for (let c = 0; c < cols; c++) {
    let rowStr = "";
    for (let r = rows - 1; r >= 0; r--) {
      rowStr += shape[r][c];
    }
    rotated.push(rowStr);
  }
  return rotated;
}

/* Does the piece at (x, y) overlap a wall / floor / filled cell?
 * Cells above the board (y < 0) are considered out-of-bounds-and-legal,
 * per the SPEC's "empty or out of bounds above the board". */
function collides(board, x, y, shape) {
  const { COLS, ROWS } = CONSTANTS;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === ".") continue;
      const bx = x + c;
      const by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true; // wall / floor
      if (by < 0) continue; // above the board: legal
      if (board[by][bx] !== 0) return true; // settled block
    }
  }
  return false;
}

/* Count filled "solid" cells in a shape matrix (for tests). */
function solidCellCount(shape) {
  let n = 0;
  for (const row of shape) {
    for (const ch of row) if (ch !== ".") n++;
  }
  return n;
}

/* Line clearing: remove full rows, shift down, top fills with empty rows.
 * Returns the number of cleared rows (0-4). Mutates board in place. */
function clearLines(board) {
  const { COLS, ROWS } = CONSTANTS;
  const remaining = board.filter((row) => {
    for (let c = 0; c < COLS; c++) {
      if (row[c] === 0) return true;
    }
    return false;
  });
  const cleared = ROWS - remaining.length;
  while (remaining.length < ROWS) {
    remaining.unshift(new Array(COLS).fill(0));
  }
  for (let r = 0; r < ROWS; r++) {
    board[r] = remaining[r];
  }
  return cleared;
}

/* ------------------------------------------------------------------ */
/* The game object (pure logic; no DOM dependencies)                  */
/* ------------------------------------------------------------------ */

const game = {
  state: "ready",   // 'ready' | 'playing' | 'over'
  paused: false,
  score: 0,
  lines: 0,
  level: 1,
  dropInterval: CONSTANTS.DROP_START,
  board: emptyBoard(),
  piece: null, // { type, matrix, x, y }
  nextType: "I",
  _gravity: 0, // gravity accumulator (seconds)

  _randomType() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  },

  _spawnBlocked() {
    // True if the freshly placed piece collides at its spawn position.
    return collides(this.board, this.piece.x, this.piece.y, this.piece.matrix);
  },

  _recomputeSpeed() {
    this.level = 1 + Math.floor(this.lines / 10);
    this.dropInterval = Math.max(
      CONSTANTS.DROP_MIN,
      CONSTANTS.DROP_START - CONSTANTS.DROP_STEP * (this.level - 1)
    );
  },

  /* Spawn the pending next piece; detect a blocked spawn (game over). */
  _spawn() {
    this.piece = {
      type: this.nextType,
      matrix: PIECES[this.nextType].shape,
      x: this.nextType === "O" ? 4 : CONSTANTS.SPAWN_COL,
      y: CONSTANTS.SPAWN_ROW,
    };
    this.nextType = this._randomType();
    this._gravity = 0;
    if (this._spawnBlocked()) {
      this.state = "over";
      return false;
    }
    return true;
  },

  _moveDown() {
    if (!collides(this.board, this.piece.x, this.piece.y + 1, this.piece.matrix)) {
      this.piece.y += 1;
      return true;
    }
    return false;
  },

  _tryMove(dx, dy) {
    if (!collides(this.board, this.piece.x + dx, this.piece.y + dy, this.piece.matrix)) {
      this.piece.x += dx;
      this.piece.y += dy;
      return true;
    }
    return false;
  },

  /* Write active piece into the board, clear lines, score, spawn next. */
  _lock() {
    const { index } = PIECES[this.piece.type];
    for (let r = 0; r < this.piece.matrix.length; r++) {
      for (let c = 0; c < this.piece.matrix[r].length; c++) {
        if (this.piece.matrix[r][c] === ".") continue;
        const by = this.piece.y + r;
        if (by < 0) continue;
        this.board[by][this.piece.x + c] = index;
      }
    }
    const cleared = clearLines(this.board);
    if (cleared > 0) {
      this.lines += cleared;
      this.score += CONSTANTS.LINE_SCORES[cleared - 1] * this.level;
      this._recomputeSpeed();
    }
    this._spawn();
  },

  reset() {
    this.state = "ready";
    this.paused = false;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = CONSTANTS.DROP_START;
    this.board = emptyBoard();
    this._gravity = 0;
    this.nextType = this._randomType();
    this._spawn();
  },

  start() {
    if (this.state === "ready" || this.state === "over") {
      this.reset();
      this.state = "playing";
      this.paused = false;
    }
  },

  restart() {
    this.start();
  },

  moveLeft() {
    if (this.state !== "playing" || this.paused) return;
    this._tryMove(-1, 0);
  },

  moveRight() {
    if (this.state !== "playing" || this.paused) return;
    this._tryMove(1, 0);
  },

  rotate() {
    if (this.state !== "playing" || this.paused) return;
    const { type } = this.piece;
    if (type === "O") return; // O rotates to itself

    const rotated = rotateCW(this.piece.matrix);
    // Wall-kick offsets, tried in order; first that fits wins.
    const kicks = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
    ];
    for (const [dx, dy] of kicks) {
      if (!collides(this.board, this.piece.x + dx, this.piece.y + dy, rotated)) {
        this.piece.x += dx;
        this.piece.y += dy;
        this.piece.matrix = rotated;
        return;
      }
    }
    // No kick fits: rotation cancelled, matrix reverts (no change made).
  },

  softDrop() {
    if (this.state !== "playing" || this.paused) return;
    if (this._moveDown()) {
      this.score += CONSTANTS.SOFT_DROP_PTS;
      this._gravity = 0;
    } else {
      this._lock();
    }
  },

  hardDrop() {
    if (this.state !== "playing" || this.paused) return;
    let rows = 0;
    while (this._moveDown()) rows++;
    this.score += CONSTANTS.HARD_DROP_PTS * rows;
    this._lock();
  },

  togglePause() {
    if (this.state !== "playing") return;
    this.paused = !this.paused;
  },

  /* One simulation step. No rendering side effects. */
  update(dt) {
    if (this.state !== "playing" || this.paused) return;
    this._gravity += dt;
    if (this._gravity >= this.dropInterval) {
      this._gravity = 0;
      if (!this._moveDown()) {
        this._lock();
      }
    }
  },
};

/* Initialize the pure game state (also runs under Node so the headless
 * export starts in a valid 'ready' state with a spawned piece). */
game.reset();

/* ------------------------------------------------------------------ */
/* Rendering + input + game loop (browser only)                        */
/* ------------------------------------------------------------------ */

if (typeof document !== "undefined") {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const { WIDTH, HEIGHT, COLS, ROWS, CELL, BOARD_X, BOARD_Y } = CONSTANTS;

  function drawCell(px, py, hex) {
    ctx.fillStyle = hex;
    ctx.fillRect(px, py, CELL, CELL);
  }

  function drawGrid() {
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + r * CELL);
      ctx.lineTo(BOARD_X + COLS * CELL, BOARD_Y + r * CELL);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + c * CELL, BOARD_Y);
      ctx.lineTo(BOARD_X + c * CELL, BOARD_Y + ROWS * CELL);
      ctx.stroke();
    }
  }

  function drawPiece(matrix, x, y, colorIndex) {
    const hex = cellTypeToHex(colorIndex);
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === ".") continue;
        const px = BOARD_X + (x + c) * CELL;
        const py = BOARD_Y + (y + r) * CELL;
        if (py < BOARD_Y) continue; // above the well
        drawCell(px, py, hex);
      }
    }
  }

  function cellTypeToHex(index) {
    for (const t of PIECE_TYPES) {
      if (PIECES[t].index === index) return PIECES[t].hex;
    }
    return "#000000";
  }

  function render(ctx) {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Locked board cells.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = game.board[r][c];
        if (v !== 0) drawCell(BOARD_X + c * CELL, BOARD_Y + r * CELL, cellTypeToHex(v));
      }
    }
    // Active piece.
    if (game.piece && (game.state === "playing" || game.state === "ready")) {
      drawPiece(game.piece.matrix, game.piece.x, game.piece.y, PIECES[game.piece.type].index);
    }
    drawGrid();

    // Side panel.
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px monospace";
    ctx.fillText("NEXT", 405, 40);
    const np = PIECES[game.nextType];
    const ph = np.shape[0].length;
    const pv = np.shape.length;
    const px = 405 + (60 - ph * 20) / 2;
    const py = 60 + (60 - pv * 20) / 2;
    ctx.fillStyle = np.hex;
    for (let r = 0; r < pv; r++) {
      for (let c = 0; c < ph; c++) {
        if (np.shape[r][c] === ".") continue;
        ctx.fillRect(px + c * 20, py + r * 20, 20, 20);
      }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px monospace";
    ctx.fillText("SCORE", 405, 200);
    ctx.fillText(String(game.score), 405, 220);
    ctx.fillText("LINES", 405, 260);
    ctx.fillText(String(game.lines), 405, 280);
    ctx.fillText("LEVEL", 405, 320);
    ctx.fillText(String(game.level), 405, 340);

    // Overlays.
    if (game.state === "ready") {
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px monospace";
      ctx.fillText("Press Space", 120, 320);
    } else if (game.state === "over") {
      ctx.fillStyle = "#ff0000";
      ctx.font = "28px monospace";
      ctx.fillText("GAME OVER", 120, 300);
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px monospace";
      ctx.fillText("Score: " + game.score, 130, 340);
      ctx.fillText("Press Space", 135, 370);
    } else if (game.paused) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px monospace";
      ctx.fillText("PAUSED", 150, 320);
      ctx.fillText("Press P", 170, 350);
    }
  }

  // Input.
  document.addEventListener("keydown", (e) => {
    const key = e.key;
    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === " "
    ) {
      e.preventDefault();
    }
    switch (key) {
      case "ArrowLeft":
        game.moveLeft();
        break;
      case "ArrowRight":
        game.moveRight();
        break;
      case "ArrowUp":
        game.rotate();
        break;
      case "ArrowDown":
        game.softDrop();
        break;
      case " ":
        if (game.state === "ready" || game.state === "over") game.start();
        else game.hardDrop();
        break;
      case "p":
      case "P":
        game.togglePause();
        break;
    }
  });

  // Game loop with delta-time clamping (background tabs don't jump).
  let last = null;
  function loop(ts) {
    if (last === null) last = ts;
    let dt = (ts - last) / 1000.0;
    last = ts;
    dt = Math.max(0, Math.min(dt, 0.05));
    game.update(dt);
    render(ctx);
    requestAnimationFrame(loop);
  }

  // Prepare the board for a fresh visit (state 'ready', preview shown).
  game.reset();
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ */
/* Headless export (Node test.js)                                      */
/* ------------------------------------------------------------------ */

if (typeof module !== "undefined" && module.exports) {
  module.exports = { game, CONSTANTS };
}