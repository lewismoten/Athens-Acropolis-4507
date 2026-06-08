(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("matrix", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 2.4) + 1.4;
      dot.speed = (nextRandom() * 0.9) + 0.8;
      dot.wobble = 0;
      dot.drift = 0;
      dot.glow = 4 + Math.floor(nextRandom() * 6);
      dot.length = (nextRandom() * 10) + 8;
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
      dot.x = Math.floor(nextRandom() * Math.max(canvas.width - dot.radius, 1));
      if (initialSpawn) {
        dot.x += (nextRandom() * 6) - 3;
      }
      dot.y = spawnOffscreen
        ? (reverse ? (canvas.height + (dot.length * dot.glow) + (nextRandom() * 24)) : (-dot.length * dot.glow - (nextRandom() * 24)))
        : (initialSpawn ? ((nextRandom() * (canvas.height * 1.8)) - (dot.length * dot.glow * 0.9)) : (nextRandom() * canvas.height));
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var drawDotImage = runtime.drawDotImage;
      var index;
      var dot;
      var fall;
      var trailStep;
      var segmentCount;
      var segmentIndex;
      var segmentY;
      var alpha;
      var width;
      var reverse = settings.dotSpeed < 0;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * settings.dotSpeed * 7.5;
        trailStep = dot.length;
        segmentCount = Math.max(3, Math.round(dot.glow));
        width = dot.radius;

        dot.y += fall;

        if ((!reverse && dot.y - (trailStep * segmentCount) > canvas.height + 18) ||
          (reverse && dot.y + trailStep < -18)) {
          runtime.resetDot(dot, true);
          continue;
        }

        for (segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
          segmentY = dot.y - (segmentIndex * trailStep);
          alpha = (1 - (segmentIndex / segmentCount)) * 0.45;

          if (segmentY < -trailStep || segmentY > canvas.height + trailStep) {
            continue;
          }

          if (drawDotImage(dot, {
            x: dot.x + (width / 2),
            y: segmentY + ((trailStep * 0.72) / 2),
            width: Math.max(width * 2.4, trailStep * 0.7),
            height: trailStep * 0.72,
            alpha: alpha
          })) {
            continue;
          }

          context.fillStyle = dot.color;
          context.globalAlpha = alpha;
          context.fillRect(dot.x, segmentY, width, trailStep * 0.72);
        }

        if (drawDotImage(dot, {
          x: dot.x + (width / 2),
          y: dot.y + ((trailStep * 0.78) / 2),
          width: Math.max(width * 2.4, trailStep * 0.7),
          height: trailStep * 0.78,
          alpha: 0.85
        })) {
          continue;
        }

        context.globalAlpha = 0.85;
        context.fillStyle = dot.color;
        context.fillRect(dot.x, dot.y, width, trailStep * 0.78);
      }

      context.globalAlpha = 1;
    }
  });
}());
