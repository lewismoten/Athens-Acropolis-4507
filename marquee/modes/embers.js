(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("embers", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.4) + 0.7;
      dot.speed = (nextRandom() * 0.8) + 0.45;
      dot.wobble = (nextRandom() * 0.35) + 0.15;
      dot.drift = (nextRandom() * 1.0) + 0.25;
      dot.glow = 0.7 + (nextRandom() * 0.35);
      dot.length = 0;
      dot.popDuration = 8;
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      var nextRandom = runtime.nextRandom;
      var canvas = runtime.canvas;

      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.sparkleFrame = 0;
      dot.vx = 0;
      dot.vy = 0;
      dot.fireworkState = "";
      dot.x = nextRandom() * canvas.width;
      dot.y = spawnOffscreen ? (canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.2))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.65)) - (canvas.height * 0.3)) : (nextRandom() * canvas.height));
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
      var flicker;
      var glowRadius;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        rise = dot.speed * (settings.dotSpeed * 8.5);
        sway = Math.sin((state.entryFrame / 16) + dot.phase) * dot.drift * (settings.dotSpeed * 3.1);
        flicker = 0.25 + (0.55 * (0.5 + (Math.sin((state.entryFrame / 10) + dot.phase) / 2)));
        glowRadius = dot.radius * (1.35 + (0.6 * flicker));

        dot.x += sway;
        dot.y -= rise;

        if (dot.y < -dot.radius - 10 || dot.x < -26 || dot.x > canvas.width + 26) {
          runtime.resetDot(dot, true);
          continue;
        }

        context.fillStyle = dot.color;
        context.globalAlpha = 0.12 + (0.12 * flicker);
        context.beginPath();
        context.arc(dot.x, dot.y, glowRadius, 0, Math.PI * 2, false);
        context.fill();

        context.globalAlpha = 0.45 + (0.35 * flicker);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
