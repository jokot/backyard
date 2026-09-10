/* Headless Node logic tests for Flappy Bird (game.js).
 *
 * DOM/Canvas wiring in game.js is guarded by `typeof document !== 'undefined'`,
 * and the game state machine is exported via module.exports, so we can load
 * the file under plain Node and drive `update(dt)` / `flap()` / `restart()`
 * directly without a browser.
 */
'use strict';

var { game, CONSTANTS } = require('./game.js');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS  ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL  ' + name + '  ->  ' + e.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

var GT = CONSTANTS.HEIGHT - CONSTANTS.GROUND_H;   // ground top = 560
var HALF = CONSTANTS.BIRD_SIZE / 2;

function restartToPlaying() {
  game.restart();
  game.flap();                                     // ready -> playing
}

// 1) State transitions: ready -> playing -> over -> restart -> playing
check('state transitions (ready -> playing -> over -> restart)', function () {
  game.restart();
  assert(game.state === 'ready', 'expected initial state "ready"' + game.state);

  game.flap();
  assert(game.state === 'playing', 'flap from ready should start playing, got ' + game.state);

  // Force game-over by driving the bird into the ground.
  game.bird.y = GT - HALF;                         // bottom edge on the ground line
  game.update(1 / 60);
  assert(game.state === 'over', 'ground hit should set state "over", got ' + game.state);

  // Restart is triggered by input in the "over" state (flap()).
  game.flap();
  assert(game.state === 'ready', 'flap from over should restart -> "ready", got ' + game.state);

  game.flap();
  assert(game.state === 'playing', 'flap from ready should be "playing" after restart, got ' + game.state);
});

// 2) Gravity: velocity accumulates and position falls each tick.
check('gravity (vy accumulates, bird falls each tick)', function () {
  restartToPlaying();
  var dt = 1 / 60;
  var y0 = game.bird.y;
  var vy0 = game.bird.vy;                          // 0 after a ready->playing flap

  game.update(dt);

  var vy1 = game.bird.vy;
  var expectedVy = vy0 + CONSTANTS.GRAVITY * dt;
  assert(Math.abs(vy1 - expectedVy) < 1e-6, 'vy should increase by GRAVITY*dt, got ' + vy1 + ' expected ~' + expectedVy);

  var expectedY = y0 + vy1 * dt;
  assert(game.bird.y > y0, 'bird y should increase (fall) each tick');
  assert(Math.abs(game.bird.y - expectedY) < 1e-6, 'y should advance by vy*dt');
});

// 3) Collision: hitting a pipe or the ground triggers game-over.
check('collision (pipe and ground both trigger game-over)', function () {
  // 3a. Ground.
  restartToPlaying();
  game.bird.y = GT - HALF;
  game.update(1 / 60);
  assert(game.state === 'over', 'ground collision should set "over", got ' + game.state);

  // 3b. Pipe: place a pipe whose solid rect overlaps the bird.
  restartToPlaying();
  game.pipes = [{ x: game.bird.x - 10, gapY: 100, passed: false }]; // gap far above bird
  game.bird.y = 280;
  game.bird.vy = 0;
  game.update(1 / 60);
  assert(game.state === 'over', 'pipe collision should set "over", got ' + game.state);
});

// 4) Scoring: +1 when the bird passes a pipe (once per pair).
check('scoring (score +1 when bird passes a pipe)', function () {
  restartToPlaying();
  game.pipes = [{ x: 20, gapY: 280, passed: false }]; // gap centered on bird, no collision
  game.bird.y = 280;
  game.bird.vy = 0;
  game.update(1 / 60);
  assert(game.score === 1, 'score should be 1 after passing a pipe, got ' + game.score);

  // Same pipe must not score twice.
  game.update(1 / 60);
  assert(game.score === 1, 'score must not double-count the same pipe, got ' + game.score);
});

// 5) Restart: state, bird, pipes and score all reset.
check('restart (state, score, bird and pipes reset)', function () {
  restartToPlaying();
  game.score = 7;
  game.bird.y = 400;
  game.bird.vy = -250;
  game.pipes = [
    { x: 100, gapY: 200, passed: true },
    { x: 300, gapY: 350, passed: false }
  ];

  game.restart();

  assert(game.state === 'ready', 'restart should set "ready"');
  assert(game.score === 0, 'restart should zero the score, got ' + game.score);
  assert(game.bird.y === CONSTANTS.BIRD_START_Y, 'restart should reset bird y');
  assert(game.bird.vy === 0, 'restart should reset bird vy');
  assert(game.pipes.length === 0, 'restart should clear pipes');

  // And it is immediately playable again.
  game.flap();
  assert(game.state === 'playing', 'should be playable after restart');
});

console.log('----------------------------------------');
console.log(passed + '/' + (passed + failed) + ' checks passed');
process.exit(failed > 0 ? 1 : 0);