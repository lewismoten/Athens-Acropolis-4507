(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("static", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = 1;
      dot.speed = 1;
      dot.wobble = 0;
      dot.drift = 0;
      dot.glow = 1;
      dot.length = (nextRandom() < 0.82) ? 1 : 2;
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
      dot.y = nextRandom() * canvas.height;
    },
    draw: function (runtime) {
      var state = runtime.state;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var settings = runtime.settings;
      var index;
      var dot;
      var alpha;
      var size;
      var scanlineAlpha;
      var y;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];

        if (runtime.nextRandom() < 0.085) {
          dot.x = runtime.nextRandom() * canvas.width;
          dot.y = runtime.nextRandom() * canvas.height;
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        alpha = 0.1 + (runtime.nextRandom() * 0.45);
        size = dot.length;

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        context.fillRect(dot.x, dot.y, size, size);
      }

      for (y = 0; y < canvas.height; y += 3) {
        scanlineAlpha = 0.05 + (0.03 * (0.5 + (Math.sin((state.backgroundFrame / 12) + (y / 18)) / 2)));
        context.fillStyle = settings.dotColor;
        context.globalAlpha = scanlineAlpha;
        context.fillRect(0, y, canvas.width, 1);
      }

      context.globalAlpha = 1;
    }
  });
}());
