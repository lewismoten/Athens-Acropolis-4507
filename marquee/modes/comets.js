(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  function getCometY(dot, canvas, frame) {
    var curveProgress = (dot.x + dot.length + 28) / (canvas.width + (dot.length * 2) + 56);
    var horizonDistance = (curveProgress * 2) - 1;
    var curveLift = (1 - (horizonDistance * horizonDistance * 1.35)) * dot.arcHeight;
    var curveOffset = Math.sin((curveProgress * Math.PI) + dot.arcBias) * (dot.arcHeight * 0.22);

    return dot.horizonY - curveLift + curveOffset + (Math.sin((frame / 20) + dot.phase) * dot.drift * 0.9);
  }

  api.registerMode("comets", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.2) + 0.8;
      dot.speed = (nextRandom() * 1.6) + 1.6;
      dot.wobble = 0;
      dot.drift = (nextRandom() * 1.2) - 0.6;
      dot.glow = 0.55 + (nextRandom() * 0.4);
      dot.length = (nextRandom() * 46) + 28;
      dot.popDuration = 8;
      dot.arcHeight = (nextRandom() * 34) + 18;
      dot.arcBias = (nextRandom() * 0.8) - 0.4;
      dot.horizonY = 0;
      dot.starX = nextRandom();
      dot.starY = nextRandom();
      dot.starRadius = (nextRandom() * 1.05) + 0.35;
      dot.starTwinkle = (nextRandom() * 0.45) + 0.35;
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
        ? (reverse ? (-dot.length - (nextRandom() * 56)) : (canvas.width + dot.length + (nextRandom() * 56)))
        : (initialSpawn ? ((nextRandom() * (canvas.width + dot.length + (canvas.width * 0.8))) - (canvas.width * 0.35)) : (nextRandom() * (canvas.width + dot.length)));
      dot.horizonY = (canvas.height * (0.56 + (nextRandom() * 0.24)));
      dot.y = getCometY(dot, canvas, runtime.state ? runtime.state.backgroundFrame : 0);
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
      var backgroundIndex;
      var backgroundDot;
      var twinkle;
      var starX;
      var starY;
      var trailStartX;
      var trailStartY;
      var previousX;
      var previousY;
      var tailVectorX;
      var tailVectorY;
      var tailScale;
      var reverse = settings.dotSpeed < 0;

      context.lineWidth = 1.2;

      for (backgroundIndex = 0; backgroundIndex < Math.min(16, state.dots.length); backgroundIndex += 1) {
        backgroundDot = state.dots[backgroundIndex];
        twinkle = backgroundDot.starTwinkle + (0.28 * (0.5 + (Math.sin((state.backgroundFrame / 14) + backgroundDot.phase) / 2)));
        starX = backgroundDot.starX * canvas.width;
        starY = (backgroundDot.starY * canvas.height * 0.55) + 4;

        context.fillStyle = backgroundDot.color;
        context.globalAlpha = twinkle * 0.7;
        context.beginPath();
        context.arc(starX, starY, backgroundDot.starRadius, 0, Math.PI * 2, false);
        context.fill();
      }

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = dot.speed * settings.dotSpeed * 12;
        driftY = dot.drift * settings.dotSpeed * 3.4;
        alpha = 0.18 + (0.55 * dot.glow);
        previousX = dot.x;
        previousY = dot.y;

        dot.x -= driftX;
        dot.y = getCometY(dot, canvas, state.backgroundFrame);

        if ((!reverse && dot.x < -dot.length - 28) ||
          (reverse && dot.x > canvas.width + dot.length + 28) ||
          dot.y > canvas.height + 28 || dot.y < -28) {
          runtime.resetDot(dot, true);
          continue;
        }

        tailVectorX = previousX - dot.x;
        tailVectorY = previousY - dot.y;
        tailScale = dot.length / Math.max(Math.sqrt((tailVectorX * tailVectorX) + (tailVectorY * tailVectorY)), 0.001);
        trailStartX = dot.x + (tailVectorX * tailScale);
        trailStartY = dot.y + (tailVectorY * tailScale);

        context.strokeStyle = dot.color;
        context.globalAlpha = alpha * 0.55;
        context.beginPath();
        context.moveTo(trailStartX, trailStartY);
        context.lineTo(dot.x, dot.y);
        context.stroke();

        if (drawDotImage(dot, {
          width: dot.radius * 3.2,
          height: dot.radius * 3.2,
          alpha: alpha
        })) {
          continue;
        }

        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fillStyle = dot.color;
        context.fill();
      }

      context.globalAlpha = 1;
    }
  });
}());
