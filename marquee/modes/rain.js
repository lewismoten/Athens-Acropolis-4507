(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("rain", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = 1;
      dot.speed = (nextRandom() * 1.6) + 1.2;
      dot.wobble = 0;
      dot.drift = (nextRandom() * 0.8) + 0.15;
      dot.glow = (nextRandom() * 0.4) + 0.6;
      dot.length = (nextRandom() * 12) + 10;
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

      dot.x = initialSpawn ? ((nextRandom() * (canvas.width + 96)) - 32) : (nextRandom() * (canvas.width + 32));
      dot.y = spawnOffscreen
        ? (reverse ? (canvas.height + dot.length + (nextRandom() * 28)) : (-dot.length - (nextRandom() * 28)))
        : (initialSpawn ? ((nextRandom() * (canvas.height * 1.7)) - (canvas.height * 0.35)) : (nextRandom() * canvas.height));
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var fall;
      var drift;
      var alpha;
      var reverse = settings.dotSpeed < 0;

      context.lineWidth = 1.2;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * (settings.dotSpeed * 22);
        drift = dot.drift * (settings.dotSpeed * 5);
        alpha = 0.35 + (0.45 * dot.glow);

        dot.x += drift;
        dot.y += fall;

        if ((!reverse && dot.y - dot.length > canvas.height) ||
          (reverse && dot.y + dot.length < 0) ||
          dot.x > canvas.width + 12 || dot.x < -12) {
          runtime.resetDot(dot, true);
        }

        context.strokeStyle = dot.color;
        context.globalAlpha = alpha;
        context.beginPath();
        context.moveTo(dot.x, dot.y - dot.length);
        context.lineTo(dot.x + (drift * 1.6), dot.y);
        context.stroke();
      }

      context.globalAlpha = 1;
    }
  });
}());
