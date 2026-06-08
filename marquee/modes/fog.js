(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  function drawFogEllipse(context, centerX, centerY, width, height) {
    context.beginPath();
    if (typeof context.ellipse === "function") {
      context.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
    } else {
      context.save();
      context.translate(centerX, centerY);
      context.scale(width / 2, height / 2);
      context.arc(0, 0, 1, 0, Math.PI * 2, false);
      context.restore();
    }
    context.fill();
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
      var reverse = runtime.settings.dotSpeed < 0;

      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.sparkleFrame = 0;
      dot.vx = 0;
      dot.vy = 0;
      dot.fireworkState = "";
      dot.x = spawnOffscreen
        ? (reverse ? (-(dot.radius * 3.2) - (nextRandom() * 12)) : (canvas.width - (dot.radius * 3.2) + (nextRandom() * 12)))
        : (nextRandom() * canvas.width);
      dot.y = initialSpawn ? ((nextRandom() * (canvas.height * 1.15)) - (canvas.height * 0.075)) : (nextRandom() * canvas.height);
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
      var alpha;
      var width;
      var height;
      var reverse = settings.dotSpeed < 0;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = dot.speed * settings.dotSpeed * 0.9;
        driftY = Math.sin((state.backgroundFrame / 48) + dot.phase) * dot.wobble * settings.dotSpeed * 0.4;
        alpha = 0.045 + (0.04 * (0.5 + (Math.sin((state.backgroundFrame / 36) + dot.phase) / 2)));
        width = dot.radius * 8.5;
        height = dot.radius * 2.6;

        dot.x -= driftX;
        dot.y += driftY;

        if ((!reverse && dot.x < -width - 24) || (reverse && dot.x > canvas.width + width + 24)) {
          runtime.resetDot(dot, true);
        } else if (dot.y < -height) {
          dot.y = 6;
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
        } else if (dot.y > canvas.height + height) {
          dot.y = canvas.height - 6;
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        if (drawDotImage(dot, {
          width: width,
          height: height * 1.2,
          alpha: alpha * 1.8
        })) {
          continue;
        }

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        drawFogEllipse(context, dot.x, dot.y, width, height);
        context.globalAlpha = alpha * 0.75;
        drawFogEllipse(context, dot.x + (width * 0.22), dot.y - (height * 0.1), width * 0.68, height * 0.72);
        context.globalAlpha = alpha * 0.55;
        drawFogEllipse(context, dot.x - (width * 0.18), dot.y + (height * 0.08), width * 0.56, height * 0.62);
      }

      context.globalAlpha = 1;
    }
  });
}());
