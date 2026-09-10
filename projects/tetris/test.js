/* Tetris — headless logic tests.
 *
 * Loads the pure game object from game.js without any DOM. Every required
 * behavior from the spec is exercised against deterministic fixtures.
 * Covers:
 *   1. Each of the seven pieces has the correct spawn cell count.
 *   2. A T piece returns to its original orientation after a full rotation
 *      cycle (4 clockwise rotations).
 *   3. Rotation is refused / safely handled at an impenetrable wall.
 *   4. A falling piece stops at the floor.
 *   5. A falling piece stops on settled blocks.
 *   6. Clearing one row removes it and shifts rows correctly.
 *   7. Clearing four rows works.
 *   8. Four-row scoring is greater than one-row scoring.
 *   9. A blocked spawn produces game over.
 */

"use strict";

const { game, CONSTANTS } = require("./game.js");

let passed = 0;
let total = 0;

function check(name, cond) {
  total++;
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    console.log(`FAIL  ${name}`);
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/* Force the next spawn to be a specific piece type (deterministic). */
function forceNext(type) {
  game._randomType = () => type; // always yields `type`
  game.reset();                  // reset reads _randomType for nextType + spawns it
  game.state = "playing";
  game.paused = false;
}

/* Count solid (non-".") cells in a matrix. */
function cellCount(matrix) {
  let n = 0;
  for (const row of matrix) for (const ch of row) if (ch !== ".") n++;
  return n;
}

/* Fill the given rows of the board with a stub block (index 7). */
function shelve(rows) {
  for (const r of rows) game.board[r] = new Array(CONSTANTS.COLS).fill(7);
}

/* ------------------------------------------------------------------ */
/* 1. Spawn cell counts for the seven pieces                          */
/* ------------------------------------------------------------------ */

{
  const expected = {
    I: 4, O: 4, T: 4, S: 4, Z: 4, J: 4, L: 4,
  };
  const types = Object.keys(expected);
  for (const type of types) {
    forceNext(type);
    const got = cellCount(game.piece.matrix);
    check(`${type} spawns with ${expected[type]} cell(s) (got ${got})`, got === expected[type]);
  }
}

/* ------------------------------------------------------------------ */
/* 2. T rotation cycle returns to original orientation                */
/* ------------------------------------------------------------------ */

{
  forceNext("T");
  const original = game.piece.matrix.slice();
  for (let i = 0; i < 4; i++) game.rotate();
  const same =
    game.piece.type === "T" &&
    game.piece.matrix.length === original.length &&
    game.piece.matrix.every((row, r) => row === original[r]);
  check("T returns to original orientation after a full (4x CW) rotation cycle", same);
}

/* ------------------------------------------------------------------ */
/* 3. Rotation refused / safely handled at an impenetrable wall       */
/* ------------------------------------------------------------------ */

{
  // Fully packed board: every cell is wall/settled, and an I piece is pinned
  // against the left wall with no empty cell anywhere. Every wall-kick
  // collides, so rotation must be refused without throwing and the matrix
  // must stay unchanged.
  game.reset();
  game.board = new Array(CONSTANTS.ROWS).fill().map(() => new Array(CONSTANTS.COLS).fill(7));
  game.piece = { type: "I", matrix: ["....", "1111", "....", "...."], x: 0, y: 0 };
  game.state = "playing";
  game.paused = false;
  const before = game.piece.matrix.slice();
  let threw = false;
  try {
    game.rotate();
  } catch (e) {
    threw = true;
  }
  const unchanged =
    game.piece.matrix.length === before.length &&
    game.piece.matrix.every((row, r) => row === before[r]);
  check("rotation is refused (matrix unchanged) at an impenetrable wall", unchanged);
  check("rotation is safe (no throw) at an impenetrable wall", !threw);
}

/* ------------------------------------------------------------------ */
/* 4. A falling piece stops at the floor                              */
/* ------------------------------------------------------------------ */

{
  // Empty board. An O piece (2x2) must fall until it rests on the bottom
  // row (the floor) and lock there.
  forceNext("O");
  game.hardDrop(); // drives it to the floor and locks
  // The O fills cells at the bottom row after locking (cols 4,5 of the last
  // row, since O spawns at x=4 and sits flush on the floor).
  const bottomRest = game.board[CONSTANTS.ROWS - 1].some((v) => v !== 0);
  check("falling piece stops at the floor (locked cells on bottom row)", bottomRest);
}

/* ------------------------------------------------------------------ */
/* 5. A falling piece stops on settled blocks                         */
/* ------------------------------------------------------------------ */

{
  // Place a 2-row shelf (partial, never-full rows so nothing clears) near
  // the bottom. A falling I must come to rest on top of that shelf rather
  // than falling through it.
  game.reset();
  game.state = "playing";
  game.paused = false;
  // Fill columns 0..5 of the bottom two rows (partial => no line clear).
  for (const r of [CONSTANTS.ROWS - 1, CONSTANTS.ROWS - 2]) {
    game.board[r] = new Array(CONSTANTS.COLS).fill(0);
    for (let c = 0; c < 6; c++) game.board[r][c] = 7;
  }
  game.nextType = "I";
  game._spawn();
  game.state = "playing";
  game.hardDrop();
  // The flat I rests with its active row just above the shelf top (row - 3)
  // instead of falling into/through the shelf down to the floor.
  const restingAboveShelf = game.board[CONSTANTS.ROWS - 3].some((v) => v !== 0);
  // And it must not have fallen to the bottom row (the shelf held it up).
  const notOnFloor =
    game.board[CONSTANTS.ROWS - 1].every((v) => v <= 6) || // shelf rows, not an I
    game.board[CONSTANTS.ROWS - 1].filter((v) => v !== 0).length === 6;
  check(
    "falling piece stops on settled blocks (rests above shelf, not the floor)",
    restingAboveShelf && notOnFloor
  );
}

/* ------------------------------------------------------------------ */
/* 6. One-row clear: removes the row and shifts correctly             */
/* ------------------------------------------------------------------ */

{
  game.reset();
  game.state = "playing";
  game.paused = false;
  // Bottom row is almost full — only columns 3..6 are empty, exactly the
  // footprint of a flat I. Position the I directly at the bottom row (its
  // active row index 1 lands on the last board row), then lock it in.
  game.board[CONSTANTS.ROWS - 1] = new Array(CONSTANTS.COLS).fill(7);
  for (let c = 3; c <= 6; c++) game.board[CONSTANTS.ROWS - 1][c] = 0;
  game.nextType = "I";
  game._spawn();          // piece at x=3, y=0
  game.piece.y = CONSTANTS.ROWS - 2; // active row → last row
  game._lock();           // I completes the bottom row -> 1-line clear
  check(
    `one-row clear increments lines to 1 (got ${game.lines})`,
    game.lines === 1
  );
  check(
    `one-row clear scores exactly ${CONSTANTS.LINE_SCORES[0]} (got ${game.score})`,
    game.score === CONSTANTS.LINE_SCORES[0]
  );
  // After the clear, the completed row is removed: the bottom row is empty.
  const bottomEmpty = game.board[CONSTANTS.ROWS - 1].every((v) => v === 0);
  check("cleared row is removed (bottom row empty after 1-line clear)", bottomEmpty);
}

/* ------------------------------------------------------------------ */
/* 7 & 8. Four-row clear + four-row vs one-row scoring                */
/* ------------------------------------------------------------------ */

{
  // Fill the bottom 4 rows completely, then lock a piece on top to trigger
  // clearLines. Those 4 full rows must clear at once.
  game.reset();
  game.state = "playing";
  game.paused = false;
  shelve([CONSTANTS.ROWS - 1, CONSTANTS.ROWS - 2, CONSTANTS.ROWS - 3, CONSTANTS.ROWS - 4]);
  game.nextType = "I";
  game._spawn();               // piece at x=3, y=0
  game.piece.y = CONSTANTS.ROWS - 6; // active row just above the 4-row stack
  game._lock();                // locks I onto the stack -> 4-line clear
  check(
    `four-row clear increments lines to 4 (got ${game.lines})`,
    game.lines === 4
  );
  check(
    `four-row clear scores exactly ${CONSTANTS.LINE_SCORES[3]} (got ${game.score})`,
    game.score === CONSTANTS.LINE_SCORES[3]
  );
  // After the 4-line clear the rows above shift down; the top 4 rows are
  // empty (the cleared block was removed).
  const topFourEmpty = game.board
    .slice(0, 4)
    .every((row) => row.every((v) => v === 0));
  check("four-row clear shifts rows correctly (top 4 rows empty)", topFourEmpty);

  // 8. Four-row scoring > one-row scoring (same level, base constants).
  check(
    `four-row score (${CONSTANTS.LINE_SCORES[3]}) > one-row score (${CONSTANTS.LINE_SCORES[0]})`,
    CONSTANTS.LINE_SCORES[3] > CONSTANTS.LINE_SCORES[0]
  );
}

/* ------------------------------------------------------------------ */
/* 9. A blocked spawn produces game over                              */
/* ------------------------------------------------------------------ */

{
  game.reset();
  game.state = "playing";
  game.paused = false;
  // Pack the whole board solid; the next spawn has nowhere to fit.
  game.board = new Array(CONSTANTS.ROWS).fill().map(() => new Array(CONSTANTS.COLS).fill(7));
  game.nextType = "T";
  game._spawn();
  check("blocked spawn transitions state to 'over'", game.state === "over");
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

console.log("");
console.log(`RESULT  ${passed}/${total} checks passed`);

if (passed !== total) {
  console.error("SOME CHECKS FAILED — implementation or test needs attention.");
  process.exit(1);
}
console.log("ALL CHECKS PASSED");
process.exit(0);