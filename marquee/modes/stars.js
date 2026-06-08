(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("stars", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.35) + 0.45;
      dot.speed = (nextRandom() * 1.2) + 0.6;
      dot.wobble = nextRandom() * 0.6;
      dot.drift = 0;
      dot.glow = 1;
      dot.length = 0;
      dot.popDuration = 8;
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      var nextRandom = runtime.nextRandom;
      var canvas = runtime.canvas;
      var reverse = runtime.settings.dotSpeed < 0;

      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.sparkleFrame = 0;
      dot.vx = 0;
      dot.vy = 0;
      dot.fireworkState = "";
      dot.fireworkDelay = 0;
      dot.fireworkTargetY = 0;
      dot.fireworkBurstSize = 0;
      dot.fireworkBurstCount = 0;

      if (spawnOffscreen) {
        dot.x = reverse
          ? (-dot.radius - (nextRandom() * 26))
          : (canvas.width + dot.radius + (nextRandom() * 26));
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      } else if (initialSpawn) {
        dot.x = (nextRandom() * (canvas.width + dot.radius + (canvas.width * 0.35))) - (canvas.width * 0.2);
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      } else {
        dot.x = nextRandom() * canvas.width;
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      }
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var drift;
      var twinkle;
      var shimmerY;
      var reverse = settings.dotSpeed < 0;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        drift = dot.speed * settings.dotSpeed;
        twinkle = 0.45 + (0.35 * (0.5 + (Math.sin((state.entryFrame / 10) + dot.phase) / 2)));
        shimmerY = Math.sin((state.entryFrame / 18) + dot.phase) * dot.wobble;

        dot.x -= drift;

        if ((!reverse && dot.x < -dot.radius) || (reverse && dot.x > canvas.width + dot.radius)) {
          runtime.resetDot(dot, true);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = twinkle;
        context.beginPath();
        context.arc(dot.x, dot.y + shimmerY, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
