(function () {
  var api = window.ShoomiColorMarquee;

  if (!api || !api.registerMode) {
    return;
  }

  function getLaunchScale(settings) {
    return Math.max(1, 0.75 + (settings.dotSpeed * 2.5));
  }

  function initializeFirework(dot, runtime) {
    var nextRandom = runtime.nextRandom;
    var canvas = runtime.canvas;

    dot.x = canvas.width * (0.04 + (nextRandom() * 0.92));
    dot.y = canvas.height + (nextRandom() * (canvas.height * 0.42));
    dot.fireworkLaunchStartY = dot.y;
    dot.fireworkState = "idle";
    dot.fireworkDelay = 12 + Math.floor(nextRandom() * 90);
    dot.fireworkTargetY = canvas.height * (0.12 + (nextRandom() * 0.38));
    dot.sparkleFrame = 0;
  }

  function getLaunchFadeAlpha(dot) {
    var totalRise = Math.max(1, (dot.fireworkLaunchStartY || dot.y) - dot.fireworkTargetY);
    var riseProgress = Math.max(0, Math.min(1, ((dot.fireworkLaunchStartY || dot.y) - dot.y) / totalRise));
    var fadeProgress;

    if (riseProgress <= 0.6) {
      return 1;
    }

    fadeProgress = (riseProgress - 0.6) / 0.4;
    return Math.max(0.15, 1 - (fadeProgress * 0.85));
  }

  function restartFirework(dot, runtime) {
    runtime.applyDotStyle(dot);
    initializeFirework(dot, runtime);
  }

  function burstFirework(dot) {
    dot.fireworkState = "burst";
    dot.sparkleFrame = 0;
  }

  function stepFirework(dot, runtime) {
    var launchScale;

    if (dot.fireworkState === "idle") {
      dot.fireworkDelay -= 1;
      if (dot.fireworkDelay <= 0) {
        dot.fireworkState = "launch";
      }
      return;
    }

    if (dot.fireworkState === "launch") {
      launchScale = getLaunchScale(runtime.settings);
      dot.x += dot.vx * launchScale;
      dot.y += dot.vy * launchScale;
      dot.vy += 0.085 * launchScale;

      if (dot.y <= dot.fireworkTargetY) {
        burstFirework(dot);
      } else if (dot.vy >= 0) {
        burstFirework(dot);
      } else if (dot.y < -40 || dot.y > runtime.canvas.height + 40) {
        restartFirework(dot, runtime);
      }
      return;
    }

    dot.sparkleFrame += 1;

    if ((dot.sparkleFrame / Math.max(dot.sparkleLifeDuration || 1, 1)) >= 1) {
      restartFirework(dot, runtime);
    }
  }

  function warmupFirework(dot, frameCount, runtime) {
    var remaining = Math.max(0, frameCount || 0);
    var frame;

    for (frame = 0; frame < remaining; frame += 1) {
      stepFirework(dot, runtime);
    }
  }

  api.registerMode("fireworks", {
    style: function (dot, runtime) {
      var nextRandom = runtime.nextRandom;

      dot.radius = (nextRandom() * 1.6) + 1.1;
      dot.speed = 1;
      dot.wobble = 0;
      dot.drift = 0;
      dot.glow = 1;
      dot.length = 0;
      dot.popDuration = 8;
      dot.sparkleLifeDuration = 22 + Math.floor(nextRandom() * 24);
      dot.sparkleFrame = 0;
      dot.vx = (nextRandom() * 0.8) - 0.4;
      dot.vy = -((nextRandom() * 1.4) + 2.3);
      dot.fireworkBurstSize = 18 + (nextRandom() * 38);
      dot.fireworkBurstCount = 10 + Math.floor(nextRandom() * 18);
    },
    reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
      initializeFirework(dot, runtime);
      dot.popFrame = -1;
      dot.popTargetY = -1;

      if (initialSpawn) {
        warmupFirework(dot, Math.max(1, Math.round(runtime.settings.fps * 2)) + Math.floor(runtime.nextRandom() * Math.max(1, Math.round(runtime.settings.fps * 2))), runtime);
      }
    },
    cleanup: function (dot) {
      dot.popFrame = -1;
      dot.popTargetY = -1;
    },
    draw: function (runtime) {
      var state = runtime.state;
      var settings = runtime.settings;
      var context = runtime.context;
      var canvas = runtime.canvas;
      var index;
      var dot;
      var lifeProgress;
      var alpha;
      var launchX;
      var launchY;
      var trailLength;
      var particleIndex;
      var angle;
      var radius;
      var burstAlpha;
      var burstCount;
      var spread;
      var launchScale;
      var previousLifeProgress;
      var particleTravel;
      var previousTravel;
      var currentX;
      var currentY;
      var previousX;
      var previousY;
      var gravityDrop;
      var previousGravityDrop;
      var particleRadius;
      var launchAlpha;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];

        if (dot.fireworkState === "idle") {
          dot.fireworkDelay -= 1;
          if (dot.fireworkDelay <= 0) {
            dot.fireworkState = "launch";
          }
          continue;
        }

        if (dot.fireworkState === "launch") {
          launchX = dot.x;
          launchY = dot.y;
          launchScale = getLaunchScale(settings);

          dot.x += dot.vx * launchScale;
          dot.y += dot.vy * launchScale;
          dot.vy += 0.085 * launchScale;

          trailLength = Math.max(8, dot.fireworkBurstSize * 0.22);
          launchAlpha = getLaunchFadeAlpha(dot);
          context.strokeStyle = dot.color;
          context.globalAlpha = 0.35 * launchAlpha;
          context.lineWidth = Math.max(1, dot.radius * 0.35);
          context.beginPath();
          context.moveTo(launchX, launchY + trailLength);
          context.lineTo(dot.x, dot.y);
          context.stroke();

          context.fillStyle = dot.color;
          context.globalAlpha = 0.9 * launchAlpha;
          context.beginPath();
          context.arc(dot.x, dot.y, Math.max(0.75, dot.radius * 0.45), 0, Math.PI * 2, false);
          context.fill();

          if (dot.y <= dot.fireworkTargetY) {
            burstFirework(dot);
          } else if (dot.vy >= 0) {
            burstFirework(dot);
          } else if (dot.y < -40 || dot.y > canvas.height + 40) {
            runtime.resetDot(dot, true);
          }
          continue;
        }

        dot.sparkleFrame += 1;
        lifeProgress = dot.sparkleFrame / Math.max(dot.sparkleLifeDuration || 1, 1);

        if (lifeProgress >= 1) {
          runtime.resetDot(dot, true);
          continue;
        }

        alpha = 1 - lifeProgress;
        burstAlpha = alpha * 0.85;
        burstCount = dot.fireworkBurstCount;
        previousLifeProgress = Math.max(0, (dot.sparkleFrame - 1) / Math.max(dot.sparkleLifeDuration || 1, 1));

        context.fillStyle = dot.color;
        for (particleIndex = 0; particleIndex < burstCount; particleIndex += 1) {
          angle = ((Math.PI * 2) * (particleIndex / burstCount)) + dot.phase;
          spread = 0.72 + (((particleIndex % 5) / 4) * 0.42);
          radius = dot.fireworkBurstSize * (0.22 + (spread * 0.1));
          particleTravel = radius * runtime.easeOutCubic(Math.min(lifeProgress, 1));
          previousTravel = radius * runtime.easeOutCubic(Math.min(previousLifeProgress, 1));
          gravityDrop = (lifeProgress * lifeProgress) * dot.fireworkBurstSize * 0.42;
          previousGravityDrop = (previousLifeProgress * previousLifeProgress) * dot.fireworkBurstSize * 0.42;
          currentX = dot.x + (Math.cos(angle) * particleTravel);
          currentY = dot.y + (Math.sin(angle) * particleTravel) + gravityDrop;
          previousX = dot.x + (Math.cos(angle) * previousTravel);
          previousY = dot.y + (Math.sin(angle) * previousTravel) + previousGravityDrop;
          particleRadius = dot.radius * (0.7 - (lifeProgress * 0.2));

          context.strokeStyle = dot.color;
          context.globalAlpha = burstAlpha * 0.58;
          context.lineWidth = Math.max(1, dot.radius * 0.22);
          context.beginPath();
          context.moveTo(previousX, previousY);
          context.lineTo(currentX, currentY);
          context.stroke();

          context.globalAlpha = burstAlpha * (0.8 + (0.15 * Math.sin(dot.phase + particleIndex)));
          context.beginPath();
          context.arc(currentX, currentY, Math.max(0.45, particleRadius), 0, Math.PI * 2, false);
          context.fill();
        }
      }

      context.globalAlpha = 1;
    }
  });
}());
