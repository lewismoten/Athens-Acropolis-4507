(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("dust", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 2.2) + 0.9;
      dot.speed = (nextRandom() * 0.5) + 0.25;
      dot.wobble = (nextRandom() * 0.7) + 0.2;
      dot.drift = (nextRandom() * 0.8) + 0.2;
      dot.glow = 0.4 + (nextRandom() * 0.25);
      dot.length = 0;
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
      dot.x = spawnOffscreen ? (canvas.width + dot.radius + (nextRandom() * (canvas.width * 0.2))) : (nextRandom() * canvas.width);
      dot.y = nextRandom() * canvas.height;
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
      var pulse;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = (dot.speed * settings.dotSpeed * 1.8) + (Math.sin((state.entryFrame / 40) + dot.phase) * dot.drift * settings.dotSpeed);
        driftY = Math.cos((state.entryFrame / 34) + dot.phase) * dot.wobble * settings.dotSpeed;
        pulse = 0.18 + (0.16 * (0.5 + (Math.sin((state.entryFrame / 28) + dot.phase) / 2)));

        dot.x -= driftX;
        dot.y += driftY;

        if (dot.x < -dot.radius - 12) {
          runtime.resetDot(dot, true);
        } else if (dot.y < -18 || dot.y > canvas.height + 18) {
          dot.y = Math.max(2, Math.min(canvas.height - 2, runtime.nextRandom() * canvas.height));
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = pulse;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
