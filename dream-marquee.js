(function () {
  function parseColorList(rawValue) {
    var values = String(rawValue || "").split("|");
    var colors = [];
    var index;

    for (index = 0; index < values.length; index += 1) {
      if (values[index]) {
        colors.push(values[index].charAt(0) === "#" ? values[index] : ("#" + values[index]));
      }
    }

    return colors;
  }

  function createEntry(actionText, text, colorText, options) {
    var actions = String(actionText || "<>,<>").split(",");
    var settings = options || {};
    var defaultColors = settings.defaultColors || ["#ffaa00"];
    var holdFrames = typeof settings.holdFrames === "number" ? settings.holdFrames : 100;
    var travel = Math.max(35, Math.round(String(text || "").length * 1.6));
    var colors = Array.isArray(colorText) ? colorText : parseColorList(colorText);

    return {
      start: actions[0] || "<>",
      end: actions[1] || "<>",
      text: String(text || ""),
      colors: colors.length ? colors : defaultColors,
      holdFrames: holdFrames,
      transitionFrames: travel,
      holdStartFrame: travel + holdFrames,
      durationFrames: (travel * 2) + holdFrames,
      characters: null
    };
  }

  function parseEntries(rawEntries, options) {
    var results = [];
    var index;

    for (index = 0; index < rawEntries.length; index += 1) {
      results.push(createEntry(rawEntries[index][0], rawEntries[index][1], rawEntries[index][2], options));
    }

    return results;
  }

  function isTransitionLine(value) {
    return /^(>>|<<|\^\^|VV|<>),(>>|<<|\^\^|VV|<>)$/i.test(String(value || "").trim());
  }

  function parseMessageFile(rawText, options) {
    var settings = options || {};
    var lines = String(rawText || "").replace(/\r/g, "").split("\n");
    var entries = [];
    var totalCount;
    var index = 0;
    var entryText;
    var entryColors;
    var entryAction;
    var remaining;
    var parseUniformTriplets;

    while (index < lines.length && !String(lines[index] || "").trim()) {
      index += 1;
    }

    totalCount = parseInt(lines[index] || "", 10);
    if (!isFinite(totalCount) || totalCount < 0) {
      totalCount = 0;
    } else {
      index += 1;
    }

    remaining = lines.length - index;
    parseUniformTriplets = remaining >= 3 && (
      (totalCount > 0 && remaining >= totalCount * 3) ||
      isTransitionLine(lines[index + 2])
    );

    while (index < lines.length) {
      entryText = lines[index] || "";
      entryColors = lines[index + 1] || "";
      entryAction = parseUniformTriplets ? (lines[index + 2] || "") : "";

      if (!entryText && !entryColors && !entryAction) {
        break;
      }

      entries.push(createEntry(
        entryAction || settings.firstEntryAction || settings.defaultEntryAction || ">>,>>",
        entryText,
        entryColors,
        settings
      ));
      index += parseUniformTriplets ? 3 : 2;
    }

    if (totalCount > 0 && entries.length > totalCount) {
      entries = entries.slice(0, totalCount);
    }

    return entries;
  }

  function loadMessageFile(messageFile, options) {
    if (!messageFile || typeof fetch !== "function") {
      return Promise.resolve([]);
    }

    return fetch(messageFile).then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to load message file: " + messageFile);
      }
      return response.text();
    }).then(function (rawText) {
      return parseMessageFile(rawText, options);
    });
  }

  function clampNumber(rawValue, minimum, maximum, fallback) {
    var value = parseInt(rawValue, 10);

    if (!isFinite(value)) {
      return fallback;
    }

    return Math.min(maximum, Math.max(minimum, value));
  }

  function clampLoop(rawValue) {
    var value = parseInt(rawValue, 10);

    if (!isFinite(value)) {
      return -1;
    }

    if (value < -1) {
      return -1;
    }

    return value;
  }

  function normalizeColor(rawValue, fallback) {
    if (/^#[0-9a-f]{6}$/i.test(rawValue || "")) {
      return rawValue;
    }

    return fallback;
  }

  function normalizeBackgroundMode(value) {
    if (value === "rain" || value === "snow" || value === "fireflies" || value === "dust" || value === "bubbles" || value === "bubble-pop" || value === "embers" || value === "sparkles" || value === "fog" || value === "comets" || value === "matrix" || value === "confetti" || value === "balls" || value === "static" || value === "leaves" || value === "fireworks") {
      return value;
    }

    return "stars";
  }

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalizeHtmlConfig(rawConfig) {
    var config = rawConfig || {};
    return {
      text: config.text || " ",
      behavior: config.behavior || "scroll",
      direction: config.direction || "left",
      scrollAmount: clampNumber(config.scrollAmount, 1, 40, 6),
      scrollDelay: clampNumber(config.scrollDelay, 1, 500, 85),
      loop: clampLoop(config.loop),
      fontSize: clampNumber(config.fontSize, 10, 72, 30),
      width: clampNumber(config.width, 120, 1200, 640),
      height: clampNumber(config.height, 32, 240, 92),
      color: normalizeColor(config.color, "#ffff66"),
      background: normalizeColor(config.background, "#000066"),
      fontFamily: (config.fontFamily || "Times New Roman, Times, serif").trim(),
      bold: !!config.bold
    };
  }

  function applyHtmlMarquee(element, rawConfig) {
    var config = normalizeHtmlConfig(rawConfig);

    if (!element) {
      return config;
    }

    element.textContent = config.text;
    element.setAttribute("behavior", config.behavior);
    element.setAttribute("direction", config.direction);
    element.setAttribute("scrollamount", String(config.scrollAmount));
    element.setAttribute("scrolldelay", String(config.scrollDelay));
    element.setAttribute("loop", String(config.loop));

    element.style.width = config.width + "px";
    element.style.height = config.height + "px";
    element.style.lineHeight = config.height + "px";
    element.style.fontSize = config.fontSize + "px";
    element.style.color = config.color;
    element.style.backgroundColor = config.background;
    element.style.fontFamily = config.fontFamily;
    element.style.fontWeight = config.bold ? "bold" : "normal";

    return config;
  }

  function buildHtmlMarkup(rawConfig) {
    var config = normalizeHtmlConfig(rawConfig);
    var fontWeight = config.bold ? "bold" : "normal";

    return [
      "<marquee",
      '  behavior="' + escapeAttribute(config.behavior) + '"',
      '  direction="' + escapeAttribute(config.direction) + '"',
      '  scrollamount="' + config.scrollAmount + '"',
      '  scrolldelay="' + config.scrollDelay + '"',
      '  loop="' + config.loop + '"',
      '  style="' + escapeAttribute(
        "display:block;" +
        "width:" + config.width + "px;" +
        "height:" + config.height + "px;" +
        "line-height:" + config.height + "px;" +
        "color:" + config.color + ";" +
        "background:" + config.background + ";" +
        "font-size:" + config.fontSize + "px;" +
        "font-weight:" + fontWeight + ";" +
        "font-family:" + config.fontFamily + ";"
      ) + '"',
      ">",
      escapeHtml(config.text),
      "</marquee>"
    ].join("\n");
  }

  function createCanvasMarquee(rawOptions) {
    var options = rawOptions || {};
    var canvas = options.canvas;

    if (!canvas || !canvas.getContext) {
      return null;
    }

    var context = canvas.getContext("2d");
    var settings = {
      width: options.width || canvas.width || 500,
      height: options.height || canvas.height || 78,
      backgroundColor: options.backgroundColor || "#000033",
      backgroundMode: normalizeBackgroundMode(options.backgroundMode),
      dotColor: options.dotColor || "#9999ff",
      dotCount: typeof options.dotCount === "number" ? options.dotCount : 50,
      waveHeight: typeof options.waveHeight === "number" ? options.waveHeight : 8,
      font: options.font || "italic 29px Times New Roman, Times, serif",
      fontHeight: typeof options.fontHeight === "number" ? options.fontHeight : 29,
      fps: typeof options.fps === "number" ? options.fps : 30,
      displayFrames: typeof options.displayFrames === "number" ? options.displayFrames : 100,
      edgePadding: typeof options.edgePadding === "number" ? options.edgePadding : 18,
      dotSpeed: typeof options.dotSpeed === "number" ? options.dotSpeed : 0.18,
      defaultColors: Array.isArray(options.defaultColors) && options.defaultColors.length ? options.defaultColors : parseColorList("ffaa00")
    };

    var randomSeed = typeof options.randomSeed === "number" ? (options.randomSeed >>> 0) : 0x1a2b3c4d;

    var state = {
      currentIndex: 0,
      entryFrame: 0,
      backgroundFrame: 0,
      dots: createDots(settings.dotCount),
      lastTimestamp: 0,
      entries: []
    };

    resizeCanvas();
    setEntries(options.entries || [], false);
    if (options.messageFile) {
      loadMessageFile(options.messageFile, {
        defaultColors: settings.defaultColors,
        holdFrames: settings.displayFrames,
        firstEntryAction: options.firstEntryAction,
        defaultEntryAction: options.defaultEntryAction
      }).then(function (loadedEntries) {
        if (loadedEntries && loadedEntries.length) {
          setEntries(loadedEntries, false);
        }
      }).catch(function () {
        // Keep the current entries if the optional message file fails to load.
      });
    }
    requestAnimationFrame(tick);

    return {
      setEntries: setEntries,
      setSize: setSize,
      setOptions: setOptions,
      getEntries: function () {
        return state.entries.slice(0);
      }
    };

    function setEntries(entries, preserveProgress) {
      var shouldPreserve = preserveProgress !== false;
      var previousEntries = state.entries;
      var previousIndex = state.currentIndex;
      var previousFrame = state.entryFrame;
      var previousDuration = 0;
      var nextEntry;
      var progressRatio = 0;

      if (shouldPreserve && previousEntries.length) {
        previousIndex = Math.min(previousIndex, previousEntries.length - 1);
        previousDuration = previousEntries[previousIndex].durationFrames || 0;
        if (previousDuration > 0) {
          progressRatio = Math.max(0, Math.min(1, previousFrame / previousDuration));
        }
      }

      state.entries = normalizeEntries(entries);

      if (!shouldPreserve) {
        state.currentIndex = 0;
        state.entryFrame = 0;
        drawFrame();
        return;
      }

      state.currentIndex = Math.min(previousIndex, state.entries.length - 1);
      nextEntry = state.entries[state.currentIndex];
      state.entryFrame = Math.round((nextEntry.durationFrames || 0) * progressRatio);
      drawFrame();
    }

    function setSize(width, height) {
      settings.width = width || settings.width;
      settings.height = height || settings.height;
      resizeCanvas();
      drawFrame();
    }

    function setOptions(nextOptions) {
      var next = nextOptions || {};
      var previousDotCount = settings.dotCount;
      var previousDotColor = settings.dotColor;
      var previousBackgroundMode = settings.backgroundMode;

      settings.width = next.width || settings.width;
      settings.height = next.height || settings.height;
      settings.backgroundColor = next.backgroundColor || settings.backgroundColor;
      settings.backgroundMode = next.backgroundMode ? normalizeBackgroundMode(next.backgroundMode) : settings.backgroundMode;
      settings.dotColor = next.dotColor || settings.dotColor;
      settings.dotCount = typeof next.dotCount === "number" ? next.dotCount : settings.dotCount;
      settings.waveHeight = typeof next.waveHeight === "number" ? next.waveHeight : settings.waveHeight;
      settings.font = next.font || settings.font;
      settings.fontHeight = typeof next.fontHeight === "number" ? next.fontHeight : settings.fontHeight;
      settings.fps = typeof next.fps === "number" ? next.fps : settings.fps;
      settings.displayFrames = typeof next.displayFrames === "number" ? next.displayFrames : settings.displayFrames;
      settings.edgePadding = typeof next.edgePadding === "number" ? next.edgePadding : settings.edgePadding;
      settings.dotSpeed = typeof next.dotSpeed === "number" ? next.dotSpeed : settings.dotSpeed;
      settings.defaultColors = Array.isArray(next.defaultColors) && next.defaultColors.length ? next.defaultColors : settings.defaultColors;

      if (settings.dotCount !== previousDotCount) {
        state.dots = resizeDots(settings.dotCount);
      }

      if (settings.backgroundMode !== previousBackgroundMode) {
        state.dots = createDots(settings.dotCount);
      }

      if (settings.dotColor !== previousDotColor) {
        recolorDots(settings.dotColor);
      }

      resizeCanvas();
      drawFrame();
    }

    function normalizeEntries(entries) {
      var list = [];
      var index;
      var entry;

      for (index = 0; index < entries.length; index += 1) {
        entry = entries[index];

        if (Array.isArray(entry)) {
          list.push(createEntry(entry[0], entry[1], entry[2], {
            defaultColors: settings.defaultColors,
            holdFrames: settings.displayFrames
          }));
          continue;
        }

        list.push(createEntry(
          (entry.start || "<>") + "," + (entry.end || "<>"),
          entry.text || "",
          entry.colors || settings.defaultColors,
          {
            defaultColors: settings.defaultColors,
            holdFrames: typeof entry.holdFrames === "number" ? entry.holdFrames : settings.displayFrames
          }
        ));
      }

      if (!list.length) {
        list.push(createEntry("<>,<>", "", settings.defaultColors, {
          defaultColors: settings.defaultColors,
          holdFrames: settings.displayFrames
        }));
      }

      return list;
    }

    function tick(timestamp) {
      if (!state.lastTimestamp) {
        state.lastTimestamp = timestamp;
      }

      if (timestamp - state.lastTimestamp >= 1000 / settings.fps) {
        state.lastTimestamp = timestamp;
        drawFrame();
        state.backgroundFrame += 1;
        state.entryFrame += 1;

        if (state.entryFrame > state.entries[state.currentIndex].durationFrames) {
          state.currentIndex = (state.currentIndex + 1) % state.entries.length;
          state.entryFrame = 0;
        }
      }

      requestAnimationFrame(tick);
    }

    function drawFrame() {
      var entry = state.entries[state.currentIndex];
      var metrics;
      var progress;
      var holdProgress;
      var position;
      var exitProgress = 0;

      if (!entry) {
        return;
      }

      metrics = measureEntry(entry);
      progress = Math.min(state.entryFrame / entry.transitionFrames, 1);
      holdProgress = Math.max(state.entryFrame - entry.holdStartFrame, 0);
      if (state.entryFrame > entry.holdStartFrame) {
        exitProgress = Math.min(holdProgress / entry.transitionFrames, 1);
      }
      position = getPosition(entry, metrics, progress, holdProgress);

      context.fillStyle = settings.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      drawDots();
      drawText(entry, metrics, position.x, position.y, progress, exitProgress);
    }

    function drawDots() {
      if (settings.backgroundMode === "rain") {
        drawRain();
        return;
      }

      if (settings.backgroundMode === "snow") {
        drawSnow();
        return;
      }

      if (settings.backgroundMode === "fireflies") {
        drawFireflies();
        return;
      }

      if (settings.backgroundMode === "dust") {
        drawDust();
        return;
      }

      if (settings.backgroundMode === "bubbles") {
        drawBubbles();
        return;
      }

      if (settings.backgroundMode === "bubble-pop") {
        drawBubblePop();
        return;
      }

      if (settings.backgroundMode === "embers") {
        drawEmbers();
        return;
      }

      if (settings.backgroundMode === "sparkles") {
        drawSparkles();
        return;
      }

      if (settings.backgroundMode === "fog") {
        drawFog();
        return;
      }

      if (settings.backgroundMode === "comets") {
        drawComets();
        return;
      }

      if (settings.backgroundMode === "matrix") {
        drawMatrix();
        return;
      }

      if (settings.backgroundMode === "confetti") {
        drawConfetti();
        return;
      }

      if (settings.backgroundMode === "balls") {
        drawBalls();
        return;
      }

      if (settings.backgroundMode === "static") {
        drawStatic();
        return;
      }

      if (settings.backgroundMode === "leaves") {
        drawLeaves();
        return;
      }

      if (settings.backgroundMode === "fireworks") {
        drawFireworks();
        return;
      }

      drawStars();
    }

    function drawStars() {
      var index;
      var dot;
      var drift;
      var twinkle;
      var shimmerY;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        drift = dot.speed * settings.dotSpeed;
        twinkle = 0.45 + (0.35 * (0.5 + (Math.sin((state.entryFrame / 10) + dot.phase) / 2)));
        shimmerY = Math.sin((state.entryFrame / 18) + dot.phase) * dot.wobble;

        dot.x -= drift;

        if (dot.x < -dot.radius) {
          resetDot(dot, true);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = twinkle;
        context.beginPath();
        context.arc(dot.x, dot.y + shimmerY, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawRain() {
      var index;
      var dot;
      var fall;
      var drift;
      var length;
      var alpha;

      context.lineWidth = 1.2;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * (settings.dotSpeed * 22);
        drift = dot.drift * (settings.dotSpeed * 5);
        length = dot.length;
        alpha = 0.35 + (0.45 * dot.glow);

        dot.x += drift;
        dot.y += fall;

        if (dot.y - length > canvas.height || dot.x > canvas.width + 12 || dot.x < -12) {
          resetDot(dot, true);
        }

        context.strokeStyle = dot.color;
        context.globalAlpha = alpha;
        context.beginPath();
        context.moveTo(dot.x, dot.y - length);
        context.lineTo(dot.x + (drift * 1.6), dot.y);
        context.stroke();
      }

      context.globalAlpha = 1;
    }

    function drawSnow() {
      var index;
      var dot;
      var drift;
      var fall;
      var sway;
      var alpha;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        drift = Math.sin((state.entryFrame / 22) + dot.phase) * dot.drift * (settings.dotSpeed * 3.4);
        fall = dot.speed * (settings.dotSpeed * 7.5);
        sway = Math.cos((state.entryFrame / 20) + dot.phase) * dot.wobble * 2.2;
        alpha = 0.45 + (0.35 * (0.5 + (Math.sin((state.entryFrame / 16) + dot.phase) / 2)));

        dot.x += drift;
        dot.y += fall;

        if (dot.y - dot.radius > canvas.height || dot.x > canvas.width + 18 || dot.x < -18) {
          resetDot(dot, true);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(dot.x + sway, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawFireflies() {
      var index;
      var dot;
      var driftX;
      var driftY;
      var pulse;
      var glowRadius;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = Math.sin((state.entryFrame / 26) + dot.phase) * dot.drift * (settings.dotSpeed * 2.4);
        driftY = Math.cos((state.entryFrame / 31) + dot.phase) * dot.wobble * (settings.dotSpeed * 1.5);
        pulse = 0.2 + (0.8 * Math.max(0, Math.sin((state.entryFrame / 12) + dot.phase)));
        glowRadius = dot.radius * (1.8 + (0.8 * pulse));

        dot.x += driftX;
        dot.y += driftY;

        if (dot.x < -24 || dot.x > canvas.width + 24 || dot.y < -24 || dot.y > canvas.height + 24) {
          resetDot(dot, false);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = 0.14 + (0.2 * pulse);
        context.beginPath();
        context.arc(dot.x, dot.y, glowRadius, 0, Math.PI * 2, false);
        context.fill();

        context.globalAlpha = 0.5 + (0.45 * pulse);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawDust() {
      var index;
      var dot;
      var driftX;
      var driftY;
      var pulse;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = (dot.speed * settings.dotSpeed * 1.8) + (Math.sin((state.entryFrame / 40) + dot.phase) * dot.drift * settings.dotSpeed);
        driftY = Math.cos((state.entryFrame / 34) + dot.phase) * dot.wobble * settings.dotSpeed;
        pulse = 0.18 + (0.16 * (0.5 + (Math.sin((state.entryFrame / 28) + dot.phase) / 2)));

        dot.x -= driftX;
        dot.y += driftY;

        if (dot.x < -dot.radius - 12) {
          resetDot(dot, true);
        } else if (dot.y < -18 || dot.y > canvas.height + 18) {
          dot.y = Math.max(2, Math.min(canvas.height - 2, nextRandom() * canvas.height));
          syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = pulse;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawBubbles() {
      var index;
      var dot;
      var rise;
      var sway;
      var pulse;
      var highlightX;
      var highlightY;

      context.lineWidth = 1;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        rise = dot.speed * (settings.dotSpeed * 6.5);
        sway = Math.sin((state.entryFrame / 24) + dot.phase) * dot.drift * (settings.dotSpeed * 2.8);
        pulse = 0.14 + (0.12 * (0.5 + (Math.sin((state.entryFrame / 18) + dot.phase) / 2)));

        dot.x += sway;
        dot.y -= rise;

        if (dot.y < -dot.radius - 10 || dot.x < -24 || dot.x > canvas.width + 24) {
          resetDot(dot, true);
        }

        highlightX = dot.x - (dot.radius * 0.28);
        highlightY = dot.y - (dot.radius * 0.28);

        context.strokeStyle = dot.color;
        context.globalAlpha = 0.35 + pulse;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.stroke();

        context.fillStyle = dot.color;
        context.globalAlpha = 0.12 + pulse;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius * 0.92, 0, Math.PI * 2, false);
        context.fill();

        context.globalAlpha = 0.35 + pulse;
        context.beginPath();
        context.arc(highlightX, highlightY, Math.max(0.4, dot.radius * 0.22), 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawBubblePop() {
      var index;
      var dot;
      var rise;
      var sway;
      var pulse;
      var highlightX;
      var highlightY;
      var popProgress;
      var popRadius;

      context.lineWidth = 1;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];

        if (dot.popFrame >= 0) {
          popProgress = Math.min(dot.popFrame / dot.popDuration, 1);
          popRadius = dot.radius * (1 + (1.35 * popProgress));

          context.strokeStyle = dot.color;
          context.globalAlpha = 0.5 * (1 - popProgress);
          context.beginPath();
          context.arc(dot.x, dot.y, popRadius, 0, Math.PI * 2, false);
          context.stroke();

          context.globalAlpha = 0.3 * (1 - popProgress);
          context.beginPath();
          context.arc(dot.x, dot.y, popRadius * 0.62, 0, Math.PI * 2, false);
          context.stroke();

          dot.popFrame += 1;
          if (dot.popFrame > dot.popDuration) {
            resetDot(dot, true);
          }
          continue;
        }

        rise = dot.speed * (settings.dotSpeed * 6.5);
        sway = Math.sin((state.entryFrame / 24) + dot.phase) * dot.drift * (settings.dotSpeed * 2.8);
        pulse = 0.14 + (0.12 * (0.5 + (Math.sin((state.entryFrame / 18) + dot.phase) / 2)));

        dot.x += sway;
        dot.y -= rise;

        if (dot.popTargetY >= 0 && dot.y <= dot.popTargetY) {
          dot.popFrame = 0;
          continue;
        }

        if (dot.y < -dot.radius - 10) {
          resetDot(dot, true);
          continue;
        }

        if (dot.x < -24 || dot.x > canvas.width + 24) {
          resetDot(dot, true);
          continue;
        }

        highlightX = dot.x - (dot.radius * 0.28);
        highlightY = dot.y - (dot.radius * 0.28);

        context.strokeStyle = dot.color;
        context.globalAlpha = 0.35 + pulse;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.stroke();

        context.fillStyle = dot.color;
        context.globalAlpha = 0.12 + pulse;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius * 0.92, 0, Math.PI * 2, false);
        context.fill();

        context.globalAlpha = 0.35 + pulse;
        context.beginPath();
        context.arc(highlightX, highlightY, Math.max(0.4, dot.radius * 0.22), 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawEmbers() {
      var index;
      var dot;
      var rise;
      var sway;
      var flicker;
      var glowRadius;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        rise = dot.speed * (settings.dotSpeed * 8.5);
        sway = Math.sin((state.entryFrame / 16) + dot.phase) * dot.drift * (settings.dotSpeed * 3.1);
        flicker = 0.25 + (0.55 * (0.5 + (Math.sin((state.entryFrame / 10) + dot.phase) / 2)));
        glowRadius = dot.radius * (1.35 + (0.6 * flicker));

        dot.x += sway;
        dot.y -= rise;

        if (dot.y < -dot.radius - 10 || dot.x < -26 || dot.x > canvas.width + 26) {
          resetDot(dot, true);
          continue;
        }

        context.fillStyle = dot.color;
        context.globalAlpha = 0.12 + (0.12 * flicker);
        context.beginPath();
        context.arc(dot.x, dot.y, glowRadius, 0, Math.PI * 2, false);
        context.fill();

        context.globalAlpha = 0.45 + (0.35 * flicker);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawSparkles() {
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
          dot.x = nextRandom() * canvas.width;
          dot.y = nextRandom() * canvas.height;
          syncDotRelativePosition(dot, canvas.width, canvas.height);
          dot.sparkleFrame = 0;
          fadeAlpha = 0;
          lifeProgress = 0;
        }

        twinkle = 0.18 + (0.82 * Math.max(0, Math.sin((state.backgroundFrame / dot.speed) + dot.phase)));
        sparkleSize = dot.radius * (0.6 + (0.9 * twinkle));
        offset = sparkleSize * 1.6;

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

    function drawFog() {
      var index;
      var dot;
      var driftX;
      var driftY;
      var alpha;
      var width;
      var height;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = dot.speed * settings.dotSpeed * 0.9;
        driftY = Math.sin((state.backgroundFrame / 48) + dot.phase) * dot.wobble * settings.dotSpeed * 0.4;
        alpha = 0.045 + (0.04 * (0.5 + (Math.sin((state.backgroundFrame / 36) + dot.phase) / 2)));
        width = dot.radius * 8.5;
        height = dot.radius * 2.6;

        dot.x -= driftX;
        dot.y += driftY;

        if (dot.x < -width - 24) {
          resetDot(dot, true);
        } else if (dot.y < -height) {
          dot.y = 6;
          syncDotRelativePosition(dot, canvas.width, canvas.height);
        } else if (dot.y > canvas.height + height) {
          dot.y = canvas.height - 6;
          syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        drawFogEllipse(dot.x, dot.y, width, height);
        context.globalAlpha = alpha * 0.75;
        drawFogEllipse(dot.x + (width * 0.22), dot.y - (height * 0.1), width * 0.68, height * 0.72);
        context.globalAlpha = alpha * 0.55;
        drawFogEllipse(dot.x - (width * 0.18), dot.y + (height * 0.08), width * 0.56, height * 0.62);
      }

      context.globalAlpha = 1;
    }

    function drawComets() {
      var index;
      var dot;
      var driftX;
      var driftY;
      var tailLength;
      var alpha;

      context.lineWidth = 1.2;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        driftX = dot.speed * settings.dotSpeed * 12;
        driftY = dot.drift * settings.dotSpeed * 3.4;
        tailLength = dot.length;
        alpha = 0.18 + (0.55 * dot.glow);

        dot.x -= driftX;
        dot.y += driftY;

        if (dot.x < -tailLength - 28 || dot.y > canvas.height + 28 || dot.y < -28) {
          resetDot(dot, true);
          continue;
        }

        context.strokeStyle = dot.color;
        context.globalAlpha = alpha * 0.55;
        context.beginPath();
        context.moveTo(dot.x + tailLength, dot.y - (driftY * 3.4));
        context.lineTo(dot.x, dot.y);
        context.stroke();

        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
        context.fillStyle = dot.color;
        context.fill();
      }

      context.globalAlpha = 1;
    }

    function drawMatrix() {
      var index;
      var dot;
      var fall;
      var trailStep;
      var segmentCount;
      var segmentIndex;
      var segmentY;
      var alpha;
      var width;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * settings.dotSpeed * 7.5;
        trailStep = dot.length;
        segmentCount = Math.max(3, Math.round(dot.glow));
        width = dot.radius;

        dot.y += fall;

        if (dot.y - (trailStep * segmentCount) > canvas.height + 18) {
          resetDot(dot, true);
          continue;
        }

        for (segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
          segmentY = dot.y - (segmentIndex * trailStep);
          alpha = (1 - (segmentIndex / segmentCount)) * 0.45;

          if (segmentY < -trailStep || segmentY > canvas.height + trailStep) {
            continue;
          }

          context.fillStyle = dot.color;
          context.globalAlpha = alpha;
          context.fillRect(dot.x, segmentY, width, trailStep * 0.72);
        }

        context.globalAlpha = 0.85;
        context.fillStyle = dot.color;
        context.fillRect(dot.x, dot.y, width, trailStep * 0.78);
      }

      context.globalAlpha = 1;
    }

    function drawConfetti() {
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
          resetDot(dot, true);
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

    function drawBalls() {
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
        syncDotRelativePosition(dot, canvas.width, canvas.height);

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

    function drawStatic() {
      var index;
      var dot;
      var alpha;
      var size;
      var scanlineAlpha;
      var y;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];

        if (nextRandom() < 0.085) {
          dot.x = nextRandom() * canvas.width;
          dot.y = nextRandom() * canvas.height;
          syncDotRelativePosition(dot, canvas.width, canvas.height);
        }

        alpha = 0.1 + (nextRandom() * 0.45);
        size = dot.length;

        context.fillStyle = dot.color;
        context.globalAlpha = alpha;
        context.fillRect(dot.x, dot.y, size, size);
      }

      for (y = 0; y < canvas.height; y += 3) {
        scanlineAlpha = 0.05 + (0.03 * (0.5 + (Math.sin((state.backgroundFrame / 12) + (y / 18)) / 2)));
        context.fillStyle = settings.dotColor;
        context.globalAlpha = scanlineAlpha;
        context.fillRect(0, y, canvas.width, 1);
      }

      context.globalAlpha = 1;
    }

    function drawLeaves() {
      var index;
      var dot;
      var fall;
      var sway;
      var width;
      var height;
      var rotation;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        fall = dot.speed * settings.dotSpeed * 5.6;
        sway = Math.sin((state.backgroundFrame / 22) + dot.phase) * dot.drift * (settings.dotSpeed * 3.4);
        width = dot.radius * 1.55;
        height = dot.length;
        rotation = Math.sin((state.backgroundFrame / 20) + dot.phase) * 0.85;

        dot.x += sway;
        dot.y += fall;

        if (dot.y - height > canvas.height + 18 || dot.x < -28 || dot.x > canvas.width + 28) {
          resetDot(dot, true);
          continue;
        }

        context.save();
        context.translate(dot.x, dot.y);
        context.rotate(rotation);
        context.fillStyle = dot.color;
        context.globalAlpha = 0.78;
        drawLeafShape(width, height);
        context.restore();
      }

      context.globalAlpha = 1;
    }

    function drawFireworks() {
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
          launchScale = Math.max(1, 0.75 + (settings.dotSpeed * 2.5));

          dot.x += dot.vx * launchScale;
          dot.y += dot.vy * launchScale;
          dot.vy += 0.085 * launchScale;

          trailLength = Math.max(8, dot.fireworkBurstSize * 0.22);
          context.strokeStyle = dot.color;
          context.globalAlpha = 0.35;
          context.lineWidth = Math.max(1, dot.radius * 0.35);
          context.beginPath();
          context.moveTo(launchX, launchY + trailLength);
          context.lineTo(dot.x, dot.y);
          context.stroke();

          context.fillStyle = dot.color;
          context.globalAlpha = 0.9;
          context.beginPath();
          context.arc(dot.x, dot.y, Math.max(0.75, dot.radius * 0.45), 0, Math.PI * 2, false);
          context.fill();

          if (dot.y <= dot.fireworkTargetY) {
            dot.fireworkState = "burst";
            dot.sparkleFrame = 0;
          } else if (dot.vy >= 0) {
            if (dot.y <= canvas.height * 0.5) {
              dot.fireworkState = "burst";
              dot.sparkleFrame = 0;
            } else {
              resetDot(dot, true);
            }
          } else if (dot.y < -40) {
            resetDot(dot, true);
          } else if (dot.y > canvas.height + 40) {
            resetDot(dot, true);
          }
          continue;
        }

        dot.sparkleFrame += 1;
        lifeProgress = dot.sparkleFrame / Math.max(dot.sparkleLifeDuration || 1, 1);

        if (lifeProgress >= 1) {
          resetDot(dot, true);
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
          particleTravel = radius * easeOutCubic(Math.min(lifeProgress, 1));
          previousTravel = radius * easeOutCubic(Math.min(previousLifeProgress, 1));
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

    function drawLeafShape(width, height) {
      context.beginPath();
      context.moveTo(0, -height / 2);
      context.bezierCurveTo(width / 2, -height / 3, width / 2, height / 3, 0, height / 2);
      context.bezierCurveTo(-width / 2, height / 3, -width / 2, -height / 3, 0, -height / 2);
      context.fill();

      context.globalAlpha *= 0.55;
      context.fillRect(-0.5, -height / 2, 1, height);
    }

    function drawFogEllipse(centerX, centerY, width, height) {
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

    function drawText(entry, metrics, baseX, baseY, progress, exitProgress) {
      var index;
      var character;
      var color;
      var wave;
      var canvasMidX = canvas.width / 2;
      var textMidOffset;
      var enterFromCenter = entry.start === "<>" && progress < 1 && exitProgress === 0;
      var zoomThroughCenter = entry.end === "<>" && exitProgress > 0;
      var enterZoomScale = enterFromCenter ? (2.8 - (1.8 * easeOutCubic(progress))) : 1;
      var zoomAmount = zoomThroughCenter ? easeInCubic(exitProgress) : 0;
      var exitZoomScale = zoomThroughCenter ? (1 + (2.2 * zoomAmount)) : 1;
      var alpha = 1;
      var x;

      if (enterFromCenter) {
        alpha = 0.2 + (0.8 * progress);
      } else if (zoomThroughCenter) {
        alpha = 1 - exitProgress;
      }

      context.font = settings.font;
      context.textBaseline = "middle";
      context.globalAlpha = alpha;

      for (index = 0; index < entry.characters.length; index += 1) {
        character = entry.characters[index];
        color = entry.colors[index] || settings.defaultColors[0];
        wave = Math.sin((state.entryFrame / 4) + (index / 1.7)) * settings.waveHeight;
        textMidOffset = (character.offsetX + (character.width / 2)) - (metrics.width / 2);
        x = baseX + character.offsetX;

        if (enterFromCenter) {
          x = canvasMidX + (textMidOffset * enterZoomScale) - (character.width / 2);
        }

        if (zoomThroughCenter) {
          x = canvasMidX + (textMidOffset * exitZoomScale) - (character.width / 2);
          wave = wave * (1 + (0.25 * zoomAmount));
        }

        context.fillStyle = color;
        context.fillText(character.value, x, baseY + wave);
      }

      context.globalAlpha = 1;
    }

    function measureEntry(entry) {
      var offsetX = 0;
      var characters = [];
      var index;
      var value;
      var width;

      context.font = settings.font;

      for (index = 0; index < entry.text.length; index += 1) {
        value = entry.text.charAt(index);
        width = context.measureText(value).width;

        characters.push({
          value: value,
          width: width,
          offsetX: offsetX
        });

        offsetX += width;
      }

      entry.characters = characters;

      return {
        width: offsetX,
        height: settings.fontHeight
      };
    }

    function getPosition(entry, metrics, progress, holdProgress) {
      var centerX = (canvas.width - metrics.width) / 2;
      var centerY = canvas.height / 2;
      var startX = axisPoint(entry.start, "x", "start", metrics.width, settings.edgePadding, centerX);
      var startY = axisPoint(entry.start, "y", "start", metrics.height, settings.edgePadding, centerY);
      var endX = axisPoint(entry.end, "x", "end", metrics.width, settings.edgePadding, centerX);
      var endY = axisPoint(entry.end, "y", "end", metrics.height, settings.edgePadding, centerY);
      var x = lerp(startX, centerX, easeOutCubic(progress));
      var y = lerp(startY, centerY, easeOutCubic(progress));
      var exitProgress;

      if (state.entryFrame > entry.holdStartFrame) {
        exitProgress = Math.min(holdProgress / entry.transitionFrames, 1);
        x = lerp(centerX, endX, easeInCubic(exitProgress));
        y = lerp(centerY, endY, easeInCubic(exitProgress));
      }

      return { x: x, y: y };
    }

    function axisPoint(direction, axis, phase, size, edgePadding, center) {
      if (axis === "x") {
        if (direction.indexOf("<") !== -1) {
          if (phase === "start") {
            return canvas.width + edgePadding;
          }
          return -size - edgePadding;
        }

        if (direction.indexOf(">") !== -1) {
          if (phase === "start") {
            return -size - edgePadding;
          }
          return canvas.width + edgePadding;
        }
      }

      if (axis === "y") {
        if (direction.indexOf("^") !== -1) {
          if (phase === "start") {
            return canvas.height + edgePadding;
          }
          return -edgePadding;
        }

        if (direction.indexOf("V") !== -1) {
          if (phase === "start") {
            return -edgePadding;
          }
          return canvas.height + edgePadding;
        }
      }

      return center;
    }

    function createDots(count) {
      var dots = [];
      var index;

      for (index = 0; index < count; index += 1) {
        dots.push(makeDot(false));
      }

      return dots;
    }

    function resizeDots(nextCount) {
      var dots = state.dots.slice(0, nextCount);

      while (dots.length < nextCount) {
        dots.push(makeDot(false));
      }

      return dots;
    }

    function recolorDots(nextColor) {
      var index;

      for (index = 0; index < state.dots.length; index += 1) {
        state.dots[index].color = nextColor;
      }
    }

    function resizeCanvas() {
      var previousWidth = canvas.width || settings.width;
      var previousHeight = canvas.height || settings.height;
      var index;
      var dot;

      canvas.width = settings.width;
      canvas.height = settings.height;
      context.font = settings.font;

      for (index = 0; index < state.dots.length; index += 1) {
        dot = state.dots[index];
        syncDotRelativePosition(dot, previousWidth, previousHeight);
        syncDotAbsolutePosition(dot);
      }
    }

    function makeDot(spawnOffscreen) {
      var dot = {
        x: 0,
        y: 0,
        relativeX: 0,
        relativeY: 0,
        radius: 1,
        speed: 1,
        wobble: 0,
        drift: 0,
        glow: 1,
        length: 8,
        popFrame: -1,
        popDuration: 8,
        popTargetY: -1,
        sparkleFrame: 0,
        sparkleLifeDuration: 180,
        sparkleFadeDuration: 24,
        vx: 0,
        vy: 0,
        fireworkState: "",
        fireworkDelay: 0,
        fireworkTargetY: 0,
        fireworkBurstSize: 0,
        fireworkBurstCount: 0,
        phase: nextRandom() * Math.PI * 2,
        color: settings.dotColor
      };

      applyDotStyle(dot);
      resetDot(dot, spawnOffscreen, true);
      return dot;
    }

    function resetDot(dot, spawnOffscreen, initialSpawn) {
      var initialAge;
      var risePerFrame;
      var startY;
      var riseFrames;
      var cycleFrames;
      var simX;
      var simY;
      var simVx;
      var simVy;
      var simFrame;
      var launchScale;
      var launchFrames;
      var burstX;
      var burstY;
      var startX;
      var totalFrames;
      var idleFrames;

      applyDotStyle(dot);

      if (settings.backgroundMode === "rain") {
        dot.x = initialSpawn ? ((nextRandom() * (canvas.width + 96)) - 32) : (nextRandom() * (canvas.width + 32));
        dot.y = spawnOffscreen ? (-dot.length - (nextRandom() * (canvas.height * 0.35))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.7)) - (canvas.height * 0.35)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "snow") {
        dot.x = initialSpawn ? ((nextRandom() * (canvas.width + 48)) - 24) : (nextRandom() * canvas.width);
        dot.y = spawnOffscreen ? (-dot.radius - (nextRandom() * (canvas.height * 0.3))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.6)) - (canvas.height * 0.25)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "fireflies") {
        dot.x = nextRandom() * canvas.width;
        dot.y = nextRandom() * canvas.height;
      } else if (settings.backgroundMode === "dust") {
        dot.x = spawnOffscreen ? (canvas.width + dot.radius + (nextRandom() * (canvas.width * 0.2))) : (nextRandom() * canvas.width);
        dot.y = nextRandom() * canvas.height;
      } else if (settings.backgroundMode === "bubbles") {
        dot.x = nextRandom() * canvas.width;
        dot.y = spawnOffscreen ? (canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.25))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.8)) - (canvas.height * 0.45)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "bubble-pop") {
        dot.x = nextRandom() * canvas.width;
        dot.y = spawnOffscreen ? (canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.25))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.8)) - (canvas.height * 0.45)) : (nextRandom() * canvas.height));
        dot.popTargetY = (canvas.height * (0.08 + (nextRandom() * 0.42))) + dot.radius;
        if (initialSpawn) {
          risePerFrame = Math.max(dot.speed * Math.max(settings.dotSpeed, 0.01) * 6.5, 0.01);
          startX = dot.x;
          startY = canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.25));
          riseFrames = Math.max(1, Math.round((startY - dot.popTargetY) / risePerFrame));
          cycleFrames = riseFrames + Math.max(dot.popDuration, 1);
          initialAge = Math.floor(nextRandom() * Math.max(cycleFrames, 1));
          simX = startX;
          simY = startY;

          for (simFrame = 0; simFrame < initialAge && simFrame < riseFrames; simFrame += 1) {
            simX += Math.sin((simFrame / 24) + dot.phase) * dot.drift * (Math.max(settings.dotSpeed, 0.01) * 2.8);
            simY -= risePerFrame;
          }

          dot.x = simX;
          dot.y = simY;

          if (initialAge >= riseFrames) {
            dot.popFrame = Math.min(initialAge - riseFrames, Math.max(dot.popDuration, 1));
            dot.y = dot.popTargetY + ((nextRandom() * dot.radius * 2) - dot.radius);
          }
        }
      } else if (settings.backgroundMode === "embers") {
        dot.x = nextRandom() * canvas.width;
        dot.y = spawnOffscreen ? (canvas.height + dot.radius + (nextRandom() * (canvas.height * 0.2))) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.65)) - (canvas.height * 0.3)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "sparkles") {
        dot.x = nextRandom() * canvas.width;
        dot.y = nextRandom() * canvas.height;
        dot.sparkleFrame = Math.floor(nextRandom() * Math.max(dot.sparkleLifeDuration || 1, 1));
      } else if (settings.backgroundMode === "fog") {
        dot.x = spawnOffscreen ? (canvas.width + (dot.radius * 8.5) + (nextRandom() * (canvas.width * 0.18))) : (nextRandom() * canvas.width);
        dot.y = (nextRandom() * canvas.height);
      } else if (settings.backgroundMode === "comets") {
        dot.x = spawnOffscreen ? (canvas.width + dot.length + (nextRandom() * canvas.width * 0.8)) : (initialSpawn ? ((nextRandom() * (canvas.width + dot.length + (canvas.width * 0.8))) - (canvas.width * 0.35)) : (nextRandom() * (canvas.width + dot.length)));
        dot.y = initialSpawn ? ((nextRandom() * (canvas.height * 1.3)) - (canvas.height * 0.15)) : (nextRandom() * canvas.height);
      } else if (settings.backgroundMode === "matrix") {
        dot.x = Math.floor(nextRandom() * Math.max(canvas.width - dot.radius, 1));
        if (initialSpawn) {
          dot.x += (nextRandom() * 6) - 3;
        }
        dot.y = spawnOffscreen ? (-dot.length * dot.glow - (nextRandom() * canvas.height * 0.35)) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.8)) - (dot.length * dot.glow * 0.9)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "confetti") {
        dot.x = nextRandom() * canvas.width;
        dot.y = spawnOffscreen ? (-dot.length - (nextRandom() * canvas.height * 0.35)) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.65)) - (canvas.height * 0.3)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "balls") {
        dot.x = dot.radius + (nextRandom() * Math.max(canvas.width - (dot.radius * 2), 1));
        dot.y = dot.radius + (nextRandom() * Math.max(canvas.height - (dot.radius * 2), 1));
      } else if (settings.backgroundMode === "static") {
        dot.x = nextRandom() * canvas.width;
        dot.y = nextRandom() * canvas.height;
      } else if (settings.backgroundMode === "leaves") {
        dot.x = nextRandom() * canvas.width;
        dot.y = spawnOffscreen ? (-dot.length - (nextRandom() * canvas.height * 0.3)) : (initialSpawn ? ((nextRandom() * (canvas.height * 1.65)) - (canvas.height * 0.3)) : (nextRandom() * canvas.height));
      } else if (settings.backgroundMode === "fireworks") {
        dot.x = canvas.width * (0.04 + (nextRandom() * 0.92));
        dot.y = canvas.height + (nextRandom() * (canvas.height * 0.42));
        dot.fireworkState = "idle";
        dot.fireworkDelay = 12 + Math.floor(nextRandom() * 90);
        dot.fireworkTargetY = canvas.height * (0.12 + (nextRandom() * 0.38));
        dot.sparkleFrame = 0;
        if (initialSpawn || spawnOffscreen) {
          launchScale = Math.max(1, 0.75 + (settings.dotSpeed * 2.5));
          simX = dot.x;
          simY = dot.y;
          simVx = dot.vx;
          simVy = dot.vy;
          burstX = simX;
          burstY = simY;
          launchFrames = 0;

          for (simFrame = 0; simFrame < 240; simFrame += 1) {
            simX += simVx * launchScale;
            simY += simVy * launchScale;
            simVy += 0.085 * launchScale;

            if (simY <= dot.fireworkTargetY || (simVy >= 0 && simY <= canvas.height * 0.5)) {
              burstX = simX;
              burstY = simY;
              launchFrames = simFrame + 1;
              break;
            }
          }

          if (!launchFrames) {
            burstX = canvas.width * (0.04 + (nextRandom() * 0.92));
            burstY = canvas.height * (0.12 + (nextRandom() * 0.38));
            launchFrames = 1;
          }

          idleFrames = dot.fireworkDelay;

          if (initialSpawn) {
            totalFrames = idleFrames + launchFrames + Math.max(dot.sparkleLifeDuration || 1, 1);
            initialAge = Math.floor(nextRandom() * Math.max(totalFrames, 1));
          } else if (nextRandom() < 0.72) {
            initialAge = idleFrames + Math.floor(nextRandom() * Math.max(launchFrames, 1));
          } else {
            initialAge = 0;
          }

          if (initialAge < idleFrames) {
            dot.fireworkState = "idle";
            dot.fireworkDelay = idleFrames - initialAge;
          } else if (initialAge < idleFrames + launchFrames) {
            dot.fireworkState = "launch";
            simX = dot.x;
            simY = dot.y;
            simVx = dot.vx;
            simVy = dot.vy;

            for (simFrame = 0; simFrame < initialAge - idleFrames; simFrame += 1) {
              simX += simVx * launchScale;
              simY += simVy * launchScale;
              simVy += 0.085 * launchScale;
            }

            dot.x = simX;
            dot.y = simY;
            dot.vx = simVx;
            dot.vy = simVy;
          } else {
            dot.fireworkState = "burst";
            dot.x = burstX;
            dot.y = Math.min(burstY, canvas.height * 0.5);
            dot.sparkleFrame = initialAge - idleFrames - launchFrames;
          }
        }
      } else if (spawnOffscreen) {
        dot.x = canvas.width + dot.radius + (nextRandom() * (canvas.width * 0.35));
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      } else {
        dot.x = nextRandom() * canvas.width;
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      }

      syncDotRelativePosition(dot, canvas.width, canvas.height);
      dot.popFrame = -1;

      if (settings.backgroundMode !== "bubble-pop") {
        dot.popTargetY = -1;
      }

      if (settings.backgroundMode !== "sparkles") {
        dot.sparkleFrame = 0;
      }

      if (settings.backgroundMode !== "balls" && settings.backgroundMode !== "fireworks") {
        dot.vx = 0;
        dot.vy = 0;
      }

      if (settings.backgroundMode !== "fireworks") {
        dot.fireworkState = "";
        dot.fireworkDelay = 0;
        dot.fireworkTargetY = 0;
        dot.fireworkBurstSize = 0;
        dot.fireworkBurstCount = 0;
      }
    }

    function applyDotStyle(dot) {
      dot.color = settings.dotColor;

      if (settings.backgroundMode === "rain") {
        dot.radius = 1;
        dot.speed = (nextRandom() * 1.6) + 1.2;
        dot.wobble = 0;
        dot.drift = (nextRandom() * 0.8) + 0.15;
        dot.glow = (nextRandom() * 0.4) + 0.6;
        dot.length = (nextRandom() * 12) + 10;
        return;
      }

      if (settings.backgroundMode === "snow") {
        dot.radius = (nextRandom() * 1.6) + 1.1;
        dot.speed = (nextRandom() * 0.8) + 0.5;
        dot.wobble = (nextRandom() * 1.2) + 0.35;
        dot.drift = (nextRandom() * 1.1) + 0.4;
        dot.glow = 1;
        dot.length = 0;
        return;
      }

      if (settings.backgroundMode === "fireflies") {
        dot.radius = ((nextRandom() * 1.7) + 1.2) * 0.5;
        dot.speed = (nextRandom() * 0.5) + 0.35;
        dot.wobble = (nextRandom() * 0.9) + 0.35;
        dot.drift = (nextRandom() * 0.9) + 0.3;
        dot.glow = (nextRandom() * 0.5) + 0.8;
        dot.length = 0;
        return;
      }

      if (settings.backgroundMode === "dust") {
        dot.radius = (nextRandom() * 2.2) + 0.9;
        dot.speed = (nextRandom() * 0.5) + 0.25;
        dot.wobble = (nextRandom() * 0.7) + 0.2;
        dot.drift = (nextRandom() * 0.8) + 0.2;
        dot.glow = 0.4 + (nextRandom() * 0.25);
        dot.length = 0;
        return;
      }

      if (settings.backgroundMode === "bubbles") {
        dot.radius = (nextRandom() * 3.2) + 1.8;
        dot.speed = (nextRandom() * 0.45) + 0.3;
        dot.wobble = 0;
        dot.drift = (nextRandom() * 0.85) + 0.25;
        dot.glow = 0.5 + (nextRandom() * 0.3);
        dot.length = 0;
        dot.popDuration = 8 + Math.floor(nextRandom() * 4);
        return;
      }

      if (settings.backgroundMode === "bubble-pop") {
        dot.radius = (nextRandom() * 3.2) + 1.8;
        dot.speed = (nextRandom() * 0.45) + 0.3;
        dot.wobble = 0;
        dot.drift = (nextRandom() * 0.85) + 0.25;
        dot.glow = 0.5 + (nextRandom() * 0.3);
        dot.length = 0;
        dot.popDuration = 6 + Math.floor(nextRandom() * 5);
        return;
      }

      if (settings.backgroundMode === "embers") {
        dot.radius = (nextRandom() * 1.4) + 0.7;
        dot.speed = (nextRandom() * 0.8) + 0.45;
        dot.wobble = (nextRandom() * 0.35) + 0.15;
        dot.drift = (nextRandom() * 1.0) + 0.25;
        dot.glow = 0.7 + (nextRandom() * 0.35);
        dot.length = 0;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "sparkles") {
        dot.radius = (nextRandom() * 1.1) + 0.55;
        dot.speed = (nextRandom() * 18) + 10;
        dot.wobble = 0;
        dot.drift = 0;
        dot.glow = 1;
        dot.length = 0;
        dot.popDuration = 8;
        dot.sparkleFadeDuration = 18 + Math.floor(nextRandom() * 18);
        dot.sparkleLifeDuration = (dot.sparkleFadeDuration * 2) + 80 + Math.floor(nextRandom() * 180);
        return;
      }

      if (settings.backgroundMode === "fog") {
        dot.radius = (nextRandom() * 10) + 8;
        dot.speed = (nextRandom() * 0.32) + 0.18;
        dot.wobble = (nextRandom() * 0.85) + 0.2;
        dot.drift = 0;
        dot.glow = 1;
        dot.length = 0;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "comets") {
        dot.radius = (nextRandom() * 1.2) + 0.8;
        dot.speed = (nextRandom() * 1.6) + 1.6;
        dot.wobble = 0;
        dot.drift = (nextRandom() * 1.2) - 0.6;
        dot.glow = 0.55 + (nextRandom() * 0.4);
        dot.length = (nextRandom() * 46) + 28;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "matrix") {
        dot.radius = (nextRandom() * 2.4) + 1.4;
        dot.speed = (nextRandom() * 0.9) + 0.8;
        dot.wobble = 0;
        dot.drift = 0;
        dot.glow = 4 + Math.floor(nextRandom() * 6);
        dot.length = (nextRandom() * 10) + 8;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "confetti") {
        dot.radius = (nextRandom() * 2.8) + 1.6;
        dot.speed = (nextRandom() * 1.1) + 0.75;
        dot.wobble = 0;
        dot.drift = (nextRandom() * 1.2) + 0.35;
        dot.glow = 1;
        dot.length = (nextRandom() * 7) + 6;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "balls") {
        dot.radius = (nextRandom() * 4.5) + 3.5;
        dot.speed = 1;
        dot.wobble = 0;
        dot.drift = 0;
        dot.glow = 1;
        dot.length = 0;
        dot.popDuration = 8;
        dot.vx = ((nextRandom() * 1.4) + 0.55) * (nextRandom() < 0.5 ? -1 : 1);
        dot.vy = ((nextRandom() * 1.4) + 0.55) * (nextRandom() < 0.5 ? -1 : 1);
        return;
      }

      if (settings.backgroundMode === "static") {
        dot.radius = 1;
        dot.speed = 1;
        dot.wobble = 0;
        dot.drift = 0;
        dot.glow = 1;
        dot.length = (nextRandom() < 0.82) ? 1 : 2;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "leaves") {
        dot.radius = (nextRandom() * 3.2) + 2.2;
        dot.speed = (nextRandom() * 0.7) + 0.45;
        dot.wobble = 0;
        dot.drift = (nextRandom() * 1.1) + 0.45;
        dot.glow = 1;
        dot.length = (nextRandom() * 8) + 10;
        dot.popDuration = 8;
        return;
      }

      if (settings.backgroundMode === "fireworks") {
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
        return;
      }

      dot.radius = (nextRandom() * 1.35) + 0.45;
      dot.speed = (nextRandom() * 1.2) + 0.6;
      dot.wobble = nextRandom() * 0.6;
      dot.drift = 0;
      dot.glow = 1;
      dot.length = 0;
      dot.popDuration = 8;
    }

    function syncDotRelativePosition(dot, width, height) {
      var safeWidth = Math.max(width || canvas.width || 1, 1);
      var safeHeight = Math.max(height || canvas.height || 1, 1);

      dot.relativeX = dot.x / safeWidth;
      dot.relativeY = dot.y / safeHeight;
    }

    function syncDotAbsolutePosition(dot) {
      dot.x = dot.relativeX * canvas.width;
      dot.y = dot.relativeY * canvas.height;
    }

    function nextRandom() {
      randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
      return randomSeed / 4294967296;
    }
  }

  function lerp(start, end, progress) {
    return start + ((end - start) * progress);
  }

  function easeOutCubic(value) {
    var inverse = 1 - value;
    return 1 - (inverse * inverse * inverse);
  }

  function easeInCubic(value) {
    return value * value * value;
  }

  window.DreamMarquee = {
    parseColorList: parseColorList,
    parseEntries: parseEntries,
    parseMessageFile: parseMessageFile,
    loadMessageFile: loadMessageFile,
    createEntry: createEntry,
    createCanvasMarquee: createCanvasMarquee,
    normalizeHtmlConfig: normalizeHtmlConfig,
    applyHtmlMarquee: applyHtmlMarquee,
    buildHtmlMarkup: buildHtmlMarkup,
    clampNumber: clampNumber,
    clampLoop: clampLoop,
    normalizeColor: normalizeColor
  };
}());
