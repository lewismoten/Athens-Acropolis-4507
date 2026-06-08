(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  function styleBubble(dot, nextRandom, isPop) {
    dot.radius = (nextRandom() * 3.2) + 1.8;
    dot.speed = (nextRandom() * 0.45) + 0.3;
    dot.wobble = 0;
    dot.drift = (nextRandom() * 0.85) + 0.25;
    dot.glow = 0.5 + (nextRandom() * 0.3);
    dot.length = 0;
    dot.popDuration = isPop ? (6 + Math.floor(nextRandom() * 5)) : (8 + Math.floor(nextRandom() * 4));
  }

  function resetBubble(dot, spawnOffscreen, initialSpawn, runtime, withPop) {
    var nextRandom = runtime.nextRandom;
    var canvas = runtime.canvas;
    var risePerFrame;
    var startY;
    var riseFrames;
    var cycleFrames;
    var initialAge;
    var simX;
    var simY;
    var simFrame;

    dot.popFrame = -1;
    dot.sparkleFrame = 0;
    dot.vx = 0;
    dot.vy = 0;
    dot.fireworkState = "";
    dot.x = nextRandom() * canvas.width;
    dot.y = spawnOffscreen ? (canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.25))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.8)) - (canvas.height * 0.45)) : (nextRandom() * canvas.height));

    if (!withPop) {
      dot.popTargetY = -1;
      return;
    }

    dot.popTargetY = (canvas.height * (0.08 + (nextRandom() * 0.42))) + dot.radius;

    if (!initialSpawn) {
      return;
    }

    risePerFrame = Math.max(dot.speed * Math.max(runtime.settings.dotSpeed, 0.01) * 6.5, 0.01);
    startY = canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.25));
    riseFrames = Math.max(1, Math.round((startY - dot.popTargetY) / risePerFrame));
    cycleFrames = riseFrames + Math.max(dot.popDuration, 1);
    initialAge = Math.floor(nextRandom() * Math.max(cycleFrames, 1));
    simX = dot.x;
    simY = startY;

    for (simFrame = 0; simFrame < initialAge && simFrame < riseFrames; simFrame += 1) {
      simX += Math.sin((simFrame / 24) + dot.phase) * dot.drift * (Math.max(runtime.settings.dotSpeed, 0.01) * 2.8);
      simY -= risePerFrame;
    }

    dot.x = simX;
    dot.y = simY;

    if (initialAge >= riseFrames) {
      dot.popFrame = Math.min(initialAge - riseFrames, Math.max(dot.popDuration, 1));
      dot.y = dot.popTargetY + ((nextRandom() * dot.radius * 2) - dot.radius);
    }
  }

  function drawBubbleBody(dot, context, pulse) {
    var highlightX = dot.x - (dot.radius * 0.28);
    var highlightY = dot.y - (dot.radius * 0.28);

    context.strokeStyle = dot.color;
    context.globalAlpha = 0.35 + pulse;
    context.beginPath();
    context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
    context.stroke();

    context.fillStyle = dot.color;
    context.globalAlpha = 0.12 + pulse;
    context.beginPath();
    context.arc(dot.x, dot.y, dot.radius * 0.92, 0, Math.PI * 2, false);
    context.fill();

    context.globalAlpha = 0.35 + pulse;
    context.beginPath();
    context.arc(highlightX, highlightY, Math.max(0.4, dot.radius * 0.22), 0, Math.PI * 2, false);
    context.fill();
  }

  api.registerMode("bubbles", {
    style: function (dot, runtime) {
      styleBubble(dot, runtime.nextRandom, false);
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      resetBubble(dot, spawnOffscreen, initialSpawn, runtime, false);
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var rise;
      var sway;
      var pulse;

      context.lineWidth = 1;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        rise = dot.speed * (settings.dotSpeed * 6.5);
        sway = Math.sin((state.entryFrame / 24) + dot.phase) * dot.drift * (settings.dotSpeed * 2.8);
        pulse = 0.14 + (0.12 * (0.5 + (Math.sin((state.entryFrame / 18) + dot.phase) / 2)));

        dot.x += sway;
        dot.y -= rise;

        if (dot.y < -dot.radius - 10 || dot.x < -24 || dot.x > canvas.width + 24) {
          runtime.resetDot(dot, true);
        }

        drawBubbleBody(dot, context, pulse);
      }

      context.globalAlpha = 1;
    }
  });

  api.registerMode("bubble-pop", {
    style: function (dot, runtime) {
      styleBubble(dot, runtime.nextRandom, true);
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      resetBubble(dot, spawnOffscreen, initialSpawn, runtime, true);
    },
    cleanup: function (dot) {
      dot.sparkleFrame = 0;
      dot.vx = 0;
      dot.vy = 0;
      dot.fireworkState = "";
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var rise;
      var sway;
      var pulse;
      var popProgress;
      var popRadius;

      context.lineWidth = 1;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];

        if (dot.popFrame >= 0) {
          popProgress = Math.min(dot.popFrame / dot.popDuration, 1);
          popRadius = dot.radius * (1 + (1.35 * popProgress));

          context.strokeStyle = dot.color;
          context.globalAlpha = 0.5 * (1 - popProgress);
          context.beginPath();
          context.arc(dot.x, dot.y, popRadius, 0, Math.PI * 2, false);
          context.stroke();

          context.globalAlpha = 0.3 * (1 - popProgress);
          context.beginPath();
          context.arc(dot.x, dot.y, popRadius * 0.62, 0, Math.PI * 2, false);
          context.stroke();

          dot.popFrame += 1;
          if (dot.popFrame > dot.popDuration) {
            runtime.resetDot(dot, true);
          }
          continue;
        }

        rise = dot.speed * (settings.dotSpeed * 6.5);
        sway = Math.sin((state.entryFrame / 24) + dot.phase) * dot.drift * (settings.dotSpeed * 2.8);
        pulse = 0.14 + (0.12 * (0.5 + (Math.sin((state.entryFrame / 18) + dot.phase) / 2)));

        dot.x += sway;
        dot.y -= rise;

        if (dot.popTargetY >= 0 && dot.y <= dot.popTargetY) {
          dot.popFrame = 0;
          continue;
        }

        if (dot.y < -dot.radius - 10 || dot.x < -24 || dot.x > canvas.width + 24) {
          runtime.resetDot(dot, true);
          continue;
        }

        drawBubbleBody(dot, context, pulse);
      }

      context.globalAlpha = 1;
    }
  });
}());
