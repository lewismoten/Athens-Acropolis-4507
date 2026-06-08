(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("balls", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 4.5) + 3.5;
      dot.speed = 1;
      dot.wobble = 0;
      dot.drift = 0;
      dot.glow = 1;
      dot.length = 0;
      dot.popDuration = 8;
      dot.vx = ((nextRandom() * 1.4) + 0.55) * (nextRandom() < 0.5 ? -1 : 1);
      dot.vy = ((nextRandom() * 1.4) + 0.55) * (nextRandom() < 0.5 ? -1 : 1);
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      var nextRandom = runtime.nextRandom;
      var canvas = runtime.canvas;

      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.sparkleFrame = 0;
      dot.fireworkState = "";
      dot.x = dot.radius + (nextRandom() * Math.max(canvas.width - (dot.radius * 2), 1));
      dot.y = dot.radius + (nextRandom() * Math.max(canvas.height - (dot.radius * 2), 1));
    },
    cleanup: function (dot) {
      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.sparkleFrame = 0;
      dot.fireworkState = "";
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var nextX;
      var nextY;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        nextX = dot.x + (dot.vx * settings.dotSpeed * 4.5);
        nextY = dot.y + (dot.vy * settings.dotSpeed * 4.5);

        if (nextX <= dot.radius || nextX >= canvas.width - dot.radius) {
          dot.vx *= -1;
          nextX = Math.max(dot.radius, Math.min(canvas.width - dot.radius, nextX));
        }

        if (nextY <= dot.radius || nextY >= canvas.height - dot.radius) {
          dot.vy *= -1;
          nextY = Math.max(dot.radius, Math.min(canvas.height - dot.radius, nextY));
        }

        dot.x = nextX;
        dot.y = nextY;
        runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);

        context.fillStyle = dot.color;
        context.globalAlpha = 0.75;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();

        context.globalAlpha = 0.28;
        context.beginPath();
        context.arc(dot.x - (dot.radius * 0.25), dot.y - (dot.radius * 0.25), dot.radius * 0.45, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
