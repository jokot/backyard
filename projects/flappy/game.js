/* Flappy Bird — plain Canvas 2D, no libraries, no network assets.
 *
 * All simulation lives in `update(dt)`; all drawing lives in `render(ctx)`.
 * `update` never touches the DOM or the canvas context so it can be exercised
 * headless under Node with a DOM shim.
 */
(function () {
  'use strict';

  var CONSTANTS = {
    WIDTH: 480,
    HEIGHT: 640,
    GROUND_H: 80,          // ground strip height (ground top at y = 560)
    BIRD_X: 100,           // fixed bird x (center)
    BIRD_START_Y: 280,     // bird start y (center)
    BIRD_SIZE: 24,         // bird hitbox, square
    PIPE_W: 60,            // pipe width
    PIPE_GAP: 150,         // gap height
    SPAWN_INTERVAL: 1.5,   // seconds between spawns
    PIPE_SPEED: 150,       // px/s leftward
    GRAVITY: 1500,         // px/s^2
    FLAP_VELOCITY: -400,   // px/s (upward)
    MAX_FALL: 600,         // px/s terminal velocity
    MAX_DT: 0.05,          // clamp so background tabs don't cause a physics jump
    MIN_GAP_CENTER: 100,   // fixed bottom pipes stay inside the playfield
    MAX_GAP_CENTER: 460
  };

  var rand = function (min, max) {
    return min + Math.random() * (max - min);
  };

  var game = {
    state: 'ready',        // 'ready' | 'playing' | 'over'
    score: 0,
    bird: {
      x: CONSTANTS.BIRD_X,
      y: CONSTANTS.BIRD_START_Y,
      vy: 0
    },
    pipes: [],             // each { x, gapY, passed }
    spawnTimer: 0,         // accumulates toward SPAWN_INTERVAL
    onGameOver: null       // optional callback (browser), ignored headless
  };

  var groundTop = function () {
    return CONSTANTS.HEIGHT - CONSTANTS.GROUND_H;
  };

  var half = CONSTANTS.BIRD_SIZE / 2;

  // Bird hitbox is centered on (x, y).
  var birdBox = function () {
    return {
      x: game.bird.x - half,
      y: game.bird.y - half,
      w: CONSTANTS.BIRD_SIZE,
      h: CONSTANTS.BIRD_SIZE
    };
  };

  game.restart = function () {
    game.state = 'ready';
    game.score = 0;
    game.bird.x = CONSTANTS.BIRD_X;
    game.bird.y = CONSTANTS.BIRD_START_Y;
    game.bird.vy = 0;
    game.pipes = [];
    game.spawnTimer = 0;
  };

  game.flap = function () {
    if (game.state === 'ready') {
      game.state = 'playing';
    } else if (game.state === 'playing') {
      game.bird.vy = CONSTANTS.FLAP_VELOCITY;
    } else if (game.state === 'over') {
      game.restart();
    }
  };

  game.spawnPipe = function () {
    var gapY = rand(CONSTANTS.MIN_GAP_CENTER, CONSTANTS.MAX_GAP_CENTER);
    game.pipes.push({ x: CONSTANTS.WIDTH, gapY: gapY, passed: false });
  };

  // Axis-aligned rectangle overlap.
  var overlaps = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  };

  // One simulation step. Pure state mutation; no rendering, no DOM.
  game.update = function (rawDt) {
    var dt = Math.min(rawDt || 0, CONSTANTS.MAX_DT);
    if (dt <= 0) return;

    var GT = groundTop();

    if (game.state === 'playing') {
      // Gravity.
      game.bird.vy += CONSTANTS.GRAVITY * dt;
      if (game.bird.vy > CONSTANTS.MAX_FALL) game.bird.vy = CONSTANTS.MAX_FALL;
      game.bird.y += game.bird.vy * dt;

      // Ceiling clamp — bird stays alive at the top edge.
      if (game.bird.y - half < 0) {
        game.bird.y = half;
        game.bird.vy = 0;
      }

      // Spawn pipes on a timer.
      game.spawnTimer += dt;
      while (game.spawnTimer >= CONSTANTS.SPAWN_INTERVAL) {
        game.spawnTimer -= CONSTANTS.SPAWN_INTERVAL;
        game.spawnPipe();
      }

      // Move pipes left, drop ones fully past the left edge.
      var remaining = [];
      for (var i = 0; i < game.pipes.length; i++) {
        var p = game.pipes[i];
        p.x -= CONSTANTS.PIPE_SPEED * dt;
        if (p.x + CONSTANTS.PIPE_W > 0) remaining.push(p);
      }
      game.pipes = remaining;

      // Score: +1 per pair when bird's right edge passes the pair's right edge.
      var bb = birdBox();
      var p2;
      for (var j = 0; j < game.pipes.length; j++) {
        p2 = game.pipes[j];
        if (!p2.passed && bb.x + bb.w > p2.x + CONSTANTS.PIPE_W) {
          p2.passed = true;
          game.score += 1;
        }
      }

      // Collision: bird vs pipes, bird vs ground.
      var gapHalf = CONSTANTS.PIPE_GAP / 2;
      var deadByPipe = false;
      for (var k = 0; k < game.pipes.length; k++) {
        var pc = game.pipes[k];
        var pipeRects = [
          { x: pc.x, y: 0,                              w: CONSTANTS.PIPE_W, h: pc.gapY - gapHalf },
          { x: pc.x, y: pc.gapY + gapHalf,              w: CONSTANTS.PIPE_W, h: GT - (pc.gapY + gapHalf) }
        ];
        if (overlaps(bb, pipeRects[0]) || overlaps(bb, pipeRects[1])) {
          deadByPipe = true;
          break;
        }
      }

      var hitGround = (bb.y + bb.h) >= GT;

      if (deadByPipe || hitGround) {
        game.state = 'over';
        if (typeof game.onGameOver === 'function') game.onGameOver();
      }
    }
  };

  // ---- Rendering (browser only) ---------------------------------------------

  game.render = function (ctx) {
    var W = CONSTANTS.WIDTH;
    var H = CONSTANTS.HEIGHT;
    var GT = groundTop();

    // Background (flat).
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, W, H);

    // Pipes.
    var gapHalf = CONSTANTS.PIPE_GAP / 2;
    for (var i = 0; i < game.pipes.length; i++) {
      var p = game.pipes[i];
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(p.x, 0, CONSTANTS.PIPE_W, p.gapY - gapHalf);
      ctx.fillRect(p.x, p.gapY + gapHalf, CONSTANTS.PIPE_W, GT - (p.gapY + gapHalf));
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(p.x - 2, p.gapY - gapHalf - 10, CONSTANTS.PIPE_W + 4, 12);
      ctx.fillRect(p.x - 2, p.gapY + gapHalf - 2, CONSTANTS.PIPE_W + 4, 12);
    }

    // Ground.
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, GT, W, CONSTANTS.GROUND_H);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, GT, W, 4);

    // Bird (circle, similar size to hitbox).
    ctx.fillStyle = '#f4d03f';
    ctx.beginPath();
    ctx.arc(game.bird.x, game.bird.y, half + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(game.bird.x + 5, game.bird.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // HUD.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    if (game.state === 'ready') {
      ctx.fillText('Flappy Bird', W / 2, 160);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click or press Space to start', W / 2, 200);
    } else if (game.state === 'playing') {
      ctx.fillText(String(game.score), W / 2, 60);
    } else if (game.state === 'over') {
      ctx.fillText('Game Over', W / 2, 160);
      ctx.font = '28px sans-serif';
      ctx.fillText('Score: ' + game.score, W / 2, 200);
      ctx.font = '20px sans-serif';
      ctx.fillText('Click or press Space to restart', W / 2, 240);
    }
  };

  // ---- Browser-only wiring: DOM listeners + rAF loop -------------------------
  // Guarded so the file also runs headless under Node with a shim.
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    var canvas = document.getElementById('game');
    var ctx = canvas && canvas.getContext('2d');

    var handleInput = function (ev) {
      if (ev && ev.type === 'keydown' && ev.code !== 'Space') return;
      if (ev) ev.preventDefault();
      game.flap();
    };
    canvas.addEventListener('pointerdown', handleInput);
    window.addEventListener('keydown', handleInput);

    var last = 0;
    var frame = function (t) {
      var dt = (t - last) / 1000;
      last = t;
      game.update(dt);
      game.render(ctx);
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { game.render(ctx); });
    } else {
      game.render(ctx);
    }
  }

  // ---- CommonJS export for the headless test --------------------------------
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { game: game, CONSTANTS: CONSTANTS };
  }
})();