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
      dots: createDots(settings.dotCount),
      lastTimestamp: 0,
      entries: []
    };

    resizeCanvas();
    setEntries(options.entries || [], false);
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

      settings.width = next.width || settings.width;
      settings.height = next.height || settings.height;
      settings.backgroundColor = next.backgroundColor || settings.backgroundColor;
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

    function drawText(entry, metrics, baseX, baseY, progress, exitProgress) {
      var index;
      var character;
      var color;
      var wave;
      var canvasMidX = canvas.width / 2;
      var textMidOffset;
      var enterFromCenter = entry.start === "<>" && progress < 1 && exitProgress === 0;
      var collapseToCenter = entry.end === "<>" && exitProgress > 0;
      var enterScale = enterFromCenter ? (0.1 + (0.9 * progress)) : 1;
      var collapseAmount = collapseToCenter ? easeInCubic(exitProgress) : 0;
      var scale = enterFromCenter ? enterScale : 1;
      var alpha = 1;
      var x;

      if (enterFromCenter) {
        alpha = 0.2 + (0.8 * progress);
      } else if (collapseToCenter) {
        alpha = 1 - exitProgress;
      }

      context.font = settings.font;
      context.textBaseline = "middle";
      context.globalAlpha = alpha;

      for (index = 0; index < entry.characters.length; index += 1) {
        character = entry.characters[index];
        color = entry.colors[index] || settings.defaultColors[0];
        wave = Math.sin((state.entryFrame / 4) + (index / 1.7)) * settings.waveHeight * scale;
        textMidOffset = (character.offsetX + (character.width / 2)) - (metrics.width / 2);
        x = baseX + character.offsetX;

        if (enterFromCenter) {
          x = canvasMidX + (textMidOffset * scale) - (character.width / 2);
        }

        if (collapseToCenter) {
          x = canvasMidX + (textMidOffset * (1 - collapseAmount)) - (character.width / 2);
          wave = wave * (1 - (0.85 * collapseAmount));
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
      var startX = axisPoint(entry.start, "x", metrics.width, settings.edgePadding, centerX);
      var startY = axisPoint(entry.start, "y", metrics.height, settings.edgePadding, centerY);
      var endX = axisPoint(entry.end, "x", metrics.width, settings.edgePadding, centerX);
      var endY = axisPoint(entry.end, "y", metrics.height, settings.edgePadding, centerY);
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

    function axisPoint(direction, axis, size, edgePadding, center) {
      if (axis === "x") {
        if (direction.indexOf("<") !== -1) {
          return -size - edgePadding;
        }

        if (direction.indexOf(">") !== -1) {
          return canvas.width + edgePadding;
        }
      }

      if (axis === "y") {
        if (direction.indexOf("^") !== -1) {
          return -edgePadding;
        }

        if (direction.indexOf("V") !== -1) {
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
      canvas.width = settings.width;
      canvas.height = settings.height;
      context.font = settings.font;
    }

    function makeDot(spawnOffscreen) {
      var dot = {
        x: 0,
        y: 0,
        radius: (nextRandom() * 1.35) + 0.45,
        speed: (nextRandom() * 1.2) + 0.6,
        wobble: nextRandom() * 0.6,
        phase: nextRandom() * Math.PI * 2,
        color: settings.dotColor
      };

      resetDot(dot, spawnOffscreen);
      return dot;
    }

    function resetDot(dot, spawnOffscreen) {
      if (spawnOffscreen) {
        dot.x = canvas.width + dot.radius + (nextRandom() * (canvas.width * 0.35));
      } else {
        dot.x = nextRandom() * canvas.width;
      }

      dot.y = (nextRandom() * (canvas.height - 10)) + 5;
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
