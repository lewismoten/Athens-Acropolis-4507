(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("fireflies", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = ((nextRandom() * 1.7) + 1.2) * 0.5;
      dot.speed = (nextRandom() * 0.5) + 0.35;
      dot.wobble = (nextRandom() * 0.9) + 0.35;
      dot.drift = (nextRandom() * 0.9) + 0.3;
      dot.glow = (nextRandom() * 0.5) + 0.8;
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
      dot.x = nextRandom() * canvas.width;
      dot.y = nextRandom() * canvas.height;
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var drawDotImage = runtime.drawDotImage;
      var index;
      var dot;
      var driftX;
      var driftY;
      var pulse;
      var glowRadius;
      var rotation;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = Math.sin((state.entryFrame / 26) + dot.phase) * dot.drift * (settings.dotSpeed * 2.4);
        driftY = Math.cos((state.entryFrame / 31) + dot.phase) * dot.wobble * (settings.dotSpeed * 1.5);
        pulse = 0.2 + (0.8 * Math.max(0, Math.sin((state.entryFrame / 12) + dot.phase)));
        glowRadius = dot.radius * (1.8 + (0.8 * pulse));

        dot.x += driftX;
        dot.y += driftY;

        if (dot.x < -24 || dot.x > canvas.width + 24 || dot.y < -24 || dot.y > canvas.height + 24) {
          runtime.resetDot(dot, false);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = 0.14 + (0.2 * pulse);
        context.beginPath();
        context.arc(dot.x, dot.y, glowRadius, 0, Math.PI * 2, false);
        context.fill();

        rotation = Math.atan2(driftY, driftX) + (Math.PI / 2);

        if (drawDotImage(dot, {
          width: dot.radius * 4.6,
          height: dot.radius * 4.6,
          rotation: rotation,
          alpha: 0.5 + (0.45 * pulse)
        })) {
          continue;
        }

        context.globalAlpha = 0.5 + (0.45 * pulse);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
