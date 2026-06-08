(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  function drawLeafShape(context, width, height) {
    context.beginPath();
    context.moveTo(0, -height / 2);
    context.bezierCurveTo(width / 2, -height / 3, width / 2, height / 3, 0, height / 2);
    context.bezierCurveTo(-width / 2, height / 3, -width / 2, -height / 3, 0, -height / 2);
    context.fill();

    context.globalAlpha *= 0.55;
    context.fillRect(-0.5, -height / 2, 1, height);
  }

  api.registerMode("leaves", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 3.2) + 2.2;
      dot.speed = (nextRandom() * 0.7) + 0.45;
      dot.wobble = 0;
      dot.drift = (nextRandom() * 1.1) + 0.45;
      dot.glow = 1;
      dot.length = (nextRandom() * 8) + 10;
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
      dot.x = nextRandom() * canvas.width;
      dot.y = spawnOffscreen
        ? (reverse ? (canvas.height + dot.length + (nextRandom() * 22)) : (-dot.length - (nextRandom() * 22)))
        : (initialSpawn ? ((nextRandom() * (canvas.height * 1.65)) - (canvas.height * 0.3)) : (nextRandom() * canvas.height));
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
      var sway;
      var width;
      var height;
      var rotation;
      var reverse = settings.dotSpeed < 0;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * settings.dotSpeed * 5.6;
        sway = Math.sin((state.backgroundFrame / 22) + dot.phase) * dot.drift * (settings.dotSpeed * 3.4);
        width = dot.radius * 1.55;
        height = dot.length;
        rotation = Math.sin((state.backgroundFrame / 20) + dot.phase) * 0.85;

        dot.x += sway;
        dot.y += fall;

        if ((!reverse && dot.y - height > canvas.height + 18) ||
          (reverse && dot.y + height < -18) ||
          dot.x < -28 || dot.x > canvas.width + 28) {
          runtime.resetDot(dot, true);
          continue;
        }

        if (drawDotImage(dot, {
          width: width * 1.55,
          height: height * 1.05,
          rotation: rotation,
          alpha: 0.78
        })) {
          continue;
        }

        context.save();
        context.translate(dot.x, dot.y);
        context.rotate(rotation);
        context.fillStyle = dot.color;
        context.globalAlpha = 0.78;
        drawLeafShape(context, width, height);
        context.restore();
      }

      context.globalAlpha = 1;
    }
  });
}());
