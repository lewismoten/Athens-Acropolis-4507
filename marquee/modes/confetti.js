(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("confetti", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 2.8) + 1.6;
      dot.speed = (nextRandom() * 1.1) + 0.75;
      dot.wobble = 0;
      dot.drift = (nextRandom() * 1.2) + 0.35;
      dot.glow = 1;
      dot.length = (nextRandom() * 7) + 6;
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
      dot.y = spawnOffscreen ? (-dot.length - (nextRandom() * canvas.height * 0.35)) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.65)) - (canvas.height * 0.3)) : (nextRandom() * canvas.height));
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var fall;
      var sway;
      var flicker;
      var width;
      var height;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * settings.dotSpeed * 8.2;
        sway = Math.sin((state.backgroundFrame / 18) + dot.phase) * dot.drift * (settings.dotSpeed * 3.8);
        flicker = 0.55 + (0.35 * (0.5 + (Math.sin((state.backgroundFrame / 14) + dot.phase) / 2)));
        width = dot.radius * 1.25;
        height = dot.length;

        dot.x += sway;
        dot.y += fall;

        if (dot.y - height > canvas.height + 18 || dot.x < -24 || dot.x > canvas.width + 24) {
          runtime.resetDot(dot, true);
          continue;
        }

        context.save();
        context.translate(dot.x, dot.y);
        context.rotate(Math.sin((state.backgroundFrame / 20) + dot.phase) * 0.9);
        context.fillStyle = dot.color;
        context.globalAlpha = flicker;
        context.fillRect(-width / 2, -height / 2, width, height);
        context.restore();
      }

      context.globalAlpha = 1;
    }
  });
}());
