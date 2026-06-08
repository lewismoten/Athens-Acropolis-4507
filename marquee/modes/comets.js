(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("comets", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.2) + 0.8;
      dot.speed = (nextRandom() * 1.6) + 1.6;
      dot.wobble = 0;
      dot.drift = (nextRandom() * 1.2) - 0.6;
      dot.glow = 0.55 + (nextRandom() * 0.4);
      dot.length = (nextRandom() * 46) + 28;
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
      dot.x = spawnOffscreen ? (canvas.width + dot.length + (nextRandom() * canvas.width * 0.8)) : (initialSpawn ? ((nextRandom() * (canvas.width + dot.length + (canvas.width * 0.8))) - (canvas.width * 0.35)) : (nextRandom() * (canvas.width + dot.length)));
      dot.y = initialSpawn ? ((nextRandom() * (canvas.height * 1.3)) - (canvas.height * 0.15)) : (nextRandom() * canvas.height);
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var driftX;
      var driftY;
      var alpha;

      context.lineWidth = 1.2;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = dot.speed * settings.dotSpeed * 12;
        driftY = dot.drift * settings.dotSpeed * 3.4;
        alpha = 0.18 + (0.55 * dot.glow);

        dot.x -= driftX;
        dot.y += driftY;

        if (dot.x < -dot.length - 28 || dot.y > canvas.height + 28 || dot.y < -28) {
          runtime.resetDot(dot, true);
          continue;
        }

        context.strokeStyle = dot.color;
        context.globalAlpha = alpha * 0.55;
        context.beginPath();
        context.moveTo(dot.x + dot.length, dot.y - (driftY * 3.4));
        context.lineTo(dot.x, dot.y);
        context.stroke();

        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fillStyle = dot.color;
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
