(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("snow", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.6) + 1.1;
      dot.speed = (nextRandom() * 0.8) + 0.5;
      dot.wobble = (nextRandom() * 1.2) + 0.35;
      dot.drift = (nextRandom() * 1.1) + 0.4;
      dot.glow = 1;
      dot.length = 0;
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

      dot.x = initialSpawn ? ((nextRandom() * (canvas.width + 48)) - 24) : (nextRandom() * canvas.width);
      dot.y = spawnOffscreen
        ? (reverse ? (canvas.height + dot.radius + (nextRandom() * 24)) : (-dot.radius - (nextRandom() * 24)))
        : (initialSpawn ? ((nextRandom() * (canvas.height * 1.6)) - (canvas.height * 0.25)) : (nextRandom() * canvas.height));
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var drawDotImage = runtime.drawDotImage;
      var index;
      var dot;
      var drift;
      var fall;
      var sway;
      var alpha;
      var reverse = settings.dotSpeed < 0;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        drift = Math.sin((state.entryFrame / 22) + dot.phase) * dot.drift * (settings.dotSpeed * 3.4);
        fall = dot.speed * (settings.dotSpeed * 7.5);
        sway = Math.cos((state.entryFrame / 20) + dot.phase) * dot.wobble * 2.2;
        alpha = 0.45 + (0.35 * (0.5 + (Math.sin((state.entryFrame / 16) + dot.phase) / 2)));

        dot.x += drift;
        dot.y += fall;

        if ((!reverse && dot.y - dot.radius > canvas.height) ||
          (reverse && dot.y + dot.radius < 0) ||
          dot.x > canvas.width + 18 || dot.x < -18) {
          runtime.resetDot(dot, true);
        }

        if (drawDotImage(dot, {
          x: dot.x + sway,
          width: dot.radius * 3.1,
          height: dot.radius * 3.1,
          alpha: alpha
        })) {
          continue;
        }

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(dot.x + sway, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
