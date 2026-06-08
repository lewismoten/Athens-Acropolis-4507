(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("fog", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 10) + 8;
      dot.speed = (nextRandom() * 0.32) + 0.18;
      dot.wobble = (nextRandom() * 0.85) + 0.2;
      dot.drift = 0;
      dot.glow = 1;
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
      dot.x = spawnOffscreen ? (canvas.width + (dot.radius * 8.5) + (nextRandom() * (canvas.width * 0.18))) : (nextRandom() * canvas.width);
      dot.y = nextRandom() * canvas.height;
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var drawFogEllipse = runtime.drawFogEllipse;
      var index;
      var dot;
      var driftX;
      var driftY;
      var alpha;
      var width;
      var height;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = dot.speed * settings.dotSpeed * 0.9;
        driftY = Math.sin((state.backgroundFrame / 48) + dot.phase) * dot.wobble * settings.dotSpeed * 0.4;
        alpha = 0.045 + (0.04 * (0.5 + (Math.sin((state.backgroundFrame / 36) + dot.phase) / 2)));
        width = dot.radius * 8.5;
        height = dot.radius * 2.6;

        dot.x -= driftX;
        dot.y += driftY;

        if (dot.x < -width - 24) {
          runtime.resetDot(dot, true);
        } else if (dot.y < -height) {
          dot.y = 6;
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
        } else if (dot.y > canvas.height + height) {
          dot.y = canvas.height - 6;
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        drawFogEllipse(dot.x, dot.y, width, height);
        context.globalAlpha = alpha * 0.75;
        drawFogEllipse(dot.x + (width * 0.22), dot.y - (height * 0.1), width * 0.68, height * 0.72);
        context.globalAlpha = alpha * 0.55;
        drawFogEllipse(dot.x - (width * 0.18), dot.y + (height * 0.08), width * 0.56, height * 0.62);
      }

      context.globalAlpha = 1;
    }
  });
}());
