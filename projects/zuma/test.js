'use strict';

/*
 * Headless logic checks for the Zuma game (SPEC.md "Headless Test Contract").
 *
 * Reads index.html, extracts the game script between the
 * <!-- GAME-SCRIPT-START --> and <!-- GAME-SCRIPT-END --> markers, and
 * evaluates it under a minimal DOM/Canvas shim so the exported `game`
 * object can be driven directly. Runs exactly eight grouped checks and
 * prints "N/8 checks passed".
 *
 * Run: node test.js            (from zuma/)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract the block between the two marker comments, then strip the
// <script>...</script> shell so only the JS body is evaluated.
const startMarker = '<!-- GAME-SCRIPT-START -->';
const endMarker = '<!-- GAME-SCRIPT-END -->';
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);
if (startIdx < 0 || endIdx < 0) {
  console.error('FAIL: GAME-SCRIPT markers not found in index.html');
  process.exit(1);
}
let script = html.slice(startIdx + startMarker.length, endIdx);
script = script.replace(/<\/?script[^>]*>/g, '');

// --- DOM / Canvas / window shim (only what the script references at load) ---
const noopCtx = new Proxy({}, {
  get() { return function () {}; },
  set() { return true; }
});
const canvasStub = {
  width: 800,
  height: 600,
  getContext() { return noopCtx; },
  addEventListener() {},
};
globalThis.document = { getElementById() { return canvasStub; } };
globalThis.window = globalThis;
globalThis.requestAnimationFrame = function () {};

const sandbox = vm.createContext({
  console,
  Math,
  requestAnimationFrame: globalThis.requestAnimationFrame,
  module: { exports: {} },
});
sandbox.document = globalThis.document;
sandbox.window = globalThis.window;

try {
  vm.runInContext(script, sandbox);
} catch (e) {
  console.error('FAIL: game script threw during evaluation:', e);
  process.exit(1);
}

const game = sandbox.module.exports.game;
const C = sandbox.module.exports.CONSTANTS;

const TOTAL = 8;
let passed = 0;

function check(name, cond) {
  if (cond) { passed++; console.log('  ok - ' + name); }
  else { console.log('  FAIL - ' + name); }
}
function approx(a, b, eps) { return Math.abs(a - b) <= eps; }
function assertSpaced(chain, label) {
  for (let i = 1; i < chain.length; i++) {
    const gap = chain[i - 1].s - chain[i].s;
    if (gap > C.CHAIN_SPACING + C.CONTIGUOUS_EPS + 0.001) {
      console.log('    spacing violation at ' + i + ' (gap ' + gap.toFixed(2) + ') in ' + label);
      return false;
    }
  }
  return true;
}

console.log('Zuma headless checks (8)');

/* ---- Check 1: initial state and loaded ball ---- */
game.reset();
const c1 =
  game.state === 'ready' &&
  game.win === false &&
  game.spawned === 0 &&
  Array.isArray(game.chain) && game.chain.length === 0 &&
  game.loadedColor >= 0 && game.loadedColor <= 3 &&
  game.PATH_LENGTH > 1300 && game.PATH_LENGTH < 1450 &&
  approx(game.pathPoint(-50).x, game.pathPoint(0).x, 0.5) &&
  approx(game.pathPoint(1e9).x, 540, 0.5) &&
  approx(game.pathPoint(1e9).y, 120, 0.5);
check('initial state is ready with an empty chain, loaded ball, and computed PATH_LENGTH', c1);

/* ---- Check 2: start and chain advance ---- */
let ok2 = true;
game.start();
if (game.state !== 'playing') ok2 = false;
const s0 = game.spawned;
game.update(0.5);
if (game.spawned < s0 || game.chain.length < 1) ok2 = false;
const headStart = game.chain[0].s;
for (let i = 0; i < 10; i++) game.update(0.1);
if (!(game.chain[0].s > headStart + 5)) ok2 = false;
for (let i = 1; i < game.chain.length; i++) {
  if (game.chain[i - 1].s - game.chain[i].s < -0.001) ok2 = false;
}
check('start() begins play, a head ball spawns and advances; balls never overlap', ok2);

/* ---- Check 3: aiming ---- */
game.setAim(C.SHOOTER_X + 100, C.SHOOTER_Y);
const aimRight = approx(game.aimAngle, 0, 0.01);
game.setAim(C.SHOOTER_X, C.SHOOTER_Y - 100);
const aimUp = approx(game.aimAngle, -Math.PI / 2, 0.01);
check('aiming maps the pointer to the barrel angle (0 right, -PI/2 up)', aimRight && aimUp);

/* ---- Check 4: launch trajectory ---- */
let ok4 = true;
game.setAim(C.SHOOTER_X + 100, C.SHOOTER_Y);
const nBefore = game.projectiles.length;
game.launch();
if (game.projectiles.length !== nBefore + 1) ok4 = false;
const p4 = game.projectiles[game.projectiles.length - 1];
if (!(p4.x === C.SHOOTER_X && p4.y === C.SHOOTER_Y &&
      p4.vx > 0 && approx(Math.hypot(p4.vx, p4.vy), C.PROJECTILE_SPEED, 0.001))) ok4 = false;
const px0 = p4.x;
game.update(0.01);
if (game.projectiles.length === 0 || game.projectiles[0].x <= px0) ok4 = false;
game.setAim(C.SHOOTER_X + 100, C.SHOOTER_Y);
game.launch();
if (game.projectiles.length < 2) ok4 = false;
check('launch creates a 600 px/s projectile along the aim; multiple shots in flight', ok4);

/* ---- Check 5: insertion with spacing ---- */
let ok5 = true;
game.reset();
game.state = 'playing';
game.spawned = C.BALL_COUNT;
game.chain = [{ colorIndex: 1, s: 224 }, { colorIndex: 0, s: 200 }];
const a = game.pathPoint(200);
const b = game.pathPoint(206);
const tl = Math.hypot(b.x - a.x, b.y - a.y);
game.projectiles = [{
  x: a.x, y: a.y,
  vx: ((b.x - a.x) / tl) * C.PROJECTILE_SPEED,
  vy: ((b.y - a.y) / tl) * C.PROJECTILE_SPEED,
  colorIndex: 3
}];
game.update(0.01);
if (!(game.chain.length === 3 && assertSpaced(game.chain, 'insert'))) ok5 = false;
if (!(game.chain[1].colorIndex === 3 &&
      game.chain[0].s > game.chain[1].s && game.chain[1].s > game.chain[2].s)) ok5 = false;
if (!(game.loadedColor >= 0 && game.loadedColor <= 3)) ok5 = false;
check('a launched ball inserts at the impact point, spacing is preserved, and a new ball loads', ok5);

/* ---- Check 6: single-run removal and gap closing ---- */
let ok6 = true;
game.reset();
game.state = 'playing';
game.spawned = C.BALL_COUNT;
game.chain = [
  { colorIndex: 0, s: 120 },
  { colorIndex: 1, s: 96 },
  { colorIndex: 1, s: 72 },
  { colorIndex: 1, s: 48 },
  { colorIndex: 2, s: 24 }
];
game.update(0.05);
if (!(game.chain.length === 2 && game.chain.map(b => b.colorIndex).join(',') === '0,2')) ok6 = false;
const rearBefore = game.chain[1].s;
for (let i = 0; i < 40; i++) game.update(0.05);
if (!(game.chain[0].s - game.chain[1].s <= C.CHAIN_SPACING + C.CONTIGUOUS_EPS &&
      game.chain[1].s > rearBefore)) ok6 = false;
check('a contiguous run of 3 is removed in one pass and the rear rolls forward to close the gap', ok6);

/* ---- Check 7: cascade resolution ---- */
let ok7 = true;
game.reset();
game.state = 'playing';
game.spawned = C.BALL_COUNT;
game.chain = [
  { colorIndex: 0, s: 180 },
  { colorIndex: 1, s: 156 },
  { colorIndex: 1, s: 132 },
  { colorIndex: 1, s: 108 },
  { colorIndex: 0, s: 84 },
  { colorIndex: 0, s: 60 }
];
let frames = 0;
while (game.chain.length > 0 && frames < 400 && game.state === 'playing') {
  game.update(0.1);
  frames++;
}
if (game.chain.length !== 0) ok7 = false;
check('a gap-created run re-contacts and cascades until the chain is stable', ok7);

/* ---- Check 8: win and lose conditions ---- */
let ok8 = true;
game.reset();
game.state = 'playing';
game.spawned = C.BALL_COUNT;
game.chain = [];
game.update(0.1);
if (!(game.state === 'over' && game.win === true)) ok8 = false;
game.reset();
game.state = 'playing';
game.spawned = C.BALL_COUNT;
game.chain = [{ colorIndex: 0, s: game.PATH_LENGTH - 2 }];
game.update(0.1);
if (!(game.state === 'over' && game.win === false)) ok8 = false;
game.restart();
if (!(game.state === 'playing' && game.chain.length === 0 &&
      game.spawned === 0 && game.sequence.length === C.BALL_COUNT)) ok8 = false;
check('win when the board clears, lose when a ball reaches the hole, restart is fresh', ok8);

/* ---- Report ---- */
console.log(passed + '/' + TOTAL + ' checks passed');
process.exitCode = passed === TOTAL ? 0 : 1;