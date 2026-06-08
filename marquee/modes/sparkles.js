(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  api.registerMode("sparkles", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.1) + 0.55;
      dot.speed = (nextRandom() * 18) + 10;
      dot.wobble = 0;
      dot.drift = 0;
      dot.glow = 1;
      dot.length = 0;
      dot.popDuration = 8;
      dot.sparkleFadeDuration = 18 + Math.floor(nextRandom() * 18);
      dot.sparkleLifeDuration = (dot.sparkleFadeDuration * 2) + 80 + Math.floor(nextRandom() * 180);
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      var nextRandom = runtime.nextRandom;
      var canvas = runtime.canvas;

      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.vx = 0;
      dot.vy = 0;
      dot.fireworkState = "";
      dot.x = nextRandom() * canvas.width;
      dot.y = nextRandom() * canvas.height;
      dot.sparkleFrame = Math.floor(nextRandom() * Math.max(dot.sparkleLifeDuration || 1, 1));
    },
    cleanup: function (dot) {
      dot.popFrame = -1;
      dot.popTargetY = -1;
      dot.vx = 0;
      dot.vy = 0;
      dot.fireworkState = "";
    },
    draw: function (runtime) {
      var state = runtime.state;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var drawDotImage = runtime.drawDotImage;
      var index;
      var dot;
      var twinkle;
      var sparkleSize;
      var offset;
      var lifeProgress;
      var fadeAlpha;
      var fadeFrames;
      var holdFrames;

      context.lineWidth = 1;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fadeFrames = Math.max(dot.sparkleFadeDuration || 24, 1);
        holdFrames = Math.max((dot.sparkleLifeDuration || 180) - (fadeFrames * 2), 1);
        lifeProgress = dot.sparkleFrame || 0;

        if (lifeProgress < fadeFrames) {
          fadeAlpha = lifeProgress / fadeFrames;
        } else if (lifeProgress < fadeFrames + holdFrames) {
          fadeAlpha = 1;
        } else if (lifeProgress < (fadeFrames * 2) + holdFrames) {
          fadeAlpha = 1 - ((lifeProgress - fadeFrames - holdFrames) / fadeFrames);
        } else {
          dot.x = runtime.nextRandom() * canvas.width;
          dot.y = runtime.nextRandom() * canvas.height;
          runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);
          dot.sparkleFrame = 0;
          fadeAlpha = 0;
          lifeProgress = 0;
        }

        twinkle = 0.18 + (0.82 * Math.max(0, Math.sin((state.backgroundFrame / dot.speed) + dot.phase)));
        sparkleSize = dot.radius * (0.6 + (0.9 * twinkle));
        offset = sparkleSize * 1.6;

        if (drawDotImage(dot, {
          width: sparkleSize * 4.2,
          height: sparkleSize * 4.2,
          alpha: (0.3 + (0.6 * twinkle)) * fadeAlpha
        })) {
          dot.sparkleFrame += 1;
          continue;
        }

        context.strokeStyle = dot.color;
        context.globalAlpha = (0.2 + (0.55 * twinkle)) * fadeAlpha;
        context.beginPath();
        context.moveTo(dot.x - offset, dot.y);
        context.lineTo(dot.x + offset, dot.y);
        context.moveTo(dot.x, dot.y - offset);
        context.lineTo(dot.x, dot.y + offset);
        context.stroke();

        context.globalAlpha = (0.12 + (0.22 * twinkle)) * fadeAlpha;
        context.beginPath();
        context.arc(dot.x, dot.y, sparkleSize * 1.1, 0, Math.PI * 2, false);
        context.fillStyle = dot.color;
        context.fill();

        dot.sparkleFrame += 1;
      }

      context.globalAlpha = 1;
    }
  });
}());
