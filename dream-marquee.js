(function () {
  var registeredModes = {};

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
    if (registeredModes[value]) {
      return value;
    }

    if (registeredModes.stars) {
      return "stars";
    }

    return value || "stars";
  }

  function registerMode(name, definition) {
    if (!name || !definition) {
      return;
    }

    registeredModes[name] = definition;
  }

  function hasMode(name) {
    return !!registeredModes[name];
  }

  function getMode(name) {
    return registeredModes[normalizeBackgroundMode(name)] || null;
  }

  function listModes() {
    return Object.keys(registeredModes).sort();
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
    var TARGET_RENDER_MS = 25;
    var RECOVERY_RENDER_MS = 17;

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
      renderDotCount: settings.dotCount,
      lastRenderDuration: 0,
      fastFrameStreak: 0,
      slowFrameStreak: 0,
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
        state.renderDotCount = Math.min(state.renderDotCount, settings.dotCount);
        setRenderDotCount(settings.dotCount);
      }

      if (settings.backgroundMode !== previousBackgroundMode) {
        state.dots = createDots(state.renderDotCount);
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
      var renderStart;
      var renderDuration;

      if (!state.lastTimestamp) {
        state.lastTimestamp = timestamp;
      }

      if (timestamp - state.lastTimestamp >= 1000 / settings.fps) {
        state.lastTimestamp = timestamp;
        renderStart = now();
        drawFrame();
        renderDuration = now() - renderStart;
        state.lastRenderDuration = renderDuration;
        adaptDotCount(renderDuration);
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
      var mode = getMode(settings.backgroundMode);

      if (mode && typeof mode.draw === "function") {
        mode.draw(getModeRuntime());
      }
    }

    function getModeRuntime() {
      return {
        canvas: canvas,
        context: context,
        settings: settings,
        state: state,
        nextRandom: nextRandom,
        resetDot: resetDot,
        applyDotStyle: applyDotStyle,
        syncDotRelativePosition: syncDotRelativePosition,
        syncDotAbsolutePosition: syncDotAbsolutePosition,
        easeOutCubic: easeOutCubic,
        easeInCubic: easeInCubic,
        drawLeafShape: drawLeafShape,
        drawFogEllipse: drawFogEllipse
      };
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

    function getMinimumAdaptiveDotCount() {
      return Math.min(100, settings.dotCount);
    }

    function setRenderDotCount(nextCount) {
      var minimumCount = getMinimumAdaptiveDotCount();
      var clampedCount = Math.max(minimumCount, Math.min(settings.dotCount, Math.round(nextCount)));

      if (clampedCount === state.renderDotCount) {
        return;
      }

      state.renderDotCount = clampedCount;
      state.dots = resizeDots(clampedCount);
    }

    function adaptDotCount(renderDuration) {
      var reductionRatio;
      var decreaseBy;
      var increaseBy;

      if (settings.dotCount <= getMinimumAdaptiveDotCount()) {
        state.fastFrameStreak = 0;
        state.slowFrameStreak = 0;
        return;
      }

      if (renderDuration > TARGET_RENDER_MS) {
        state.slowFrameStreak += 1;
        state.fastFrameStreak = 0;

        reductionRatio = Math.min(0.45, Math.max(0.1, (renderDuration - TARGET_RENDER_MS) / TARGET_RENDER_MS));
        decreaseBy = Math.max(25, Math.round(state.renderDotCount * reductionRatio));
        setRenderDotCount(state.renderDotCount - decreaseBy);
        return;
      }

      state.slowFrameStreak = 0;

      if (state.renderDotCount >= settings.dotCount) {
        state.fastFrameStreak = 0;
        return;
      }

      if (renderDuration < RECOVERY_RENDER_MS) {
        state.fastFrameStreak += 1;
        if (state.fastFrameStreak >= 3) {
          increaseBy = Math.max(10, Math.round((settings.dotCount - state.renderDotCount) * 0.12));
          setRenderDotCount(state.renderDotCount + increaseBy);
          state.fastFrameStreak = 0;
        }
      } else {
        state.fastFrameStreak = 0;
      }
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
      var mode = getMode(settings.backgroundMode);
      var runtime = getModeRuntime();

      applyDotStyle(dot);

      if (mode && typeof mode.reset === "function") {
        mode.reset(dot, spawnOffscreen, initialSpawn, runtime);
      } else if (spawnOffscreen) {
        dot.x = canvas.width + dot.radius + (nextRandom() * (canvas.width * 0.35));
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      } else {
        dot.x = nextRandom() * canvas.width;
        dot.y = (nextRandom() * (canvas.height - 10)) + 5;
      }

      syncDotRelativePosition(dot, canvas.width, canvas.height);

      if (mode && typeof mode.cleanup === "function") {
        mode.cleanup(dot, runtime);
      }
    }

    function applyDotStyle(dot) {
      dot.color = settings.dotColor;
      var mode = getMode(settings.backgroundMode);
      var runtime = getModeRuntime();

      if (mode && typeof mode.style === "function") {
        mode.style(dot, runtime);
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

    function now() {
      if (typeof performance !== "undefined" && performance && typeof performance.now === "function") {
        return performance.now();
      }

      return Date.now();
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
    registerMode: registerMode,
    hasMode: hasMode,
    getMode: getMode,
    listModes: listModes,
    normalizeHtmlConfig: normalizeHtmlConfig,
    applyHtmlMarquee: applyHtmlMarquee,
    buildHtmlMarkup: buildHtmlMarkup,
    clampNumber: clampNumber,
    clampLoop: clampLoop,
    normalizeColor: normalizeColor
  };
}());
