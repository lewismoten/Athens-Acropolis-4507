(function () {
  var registeredModes = {};

  function normalizeHexColor(rawValue) {
    var value = String(rawValue || "").trim();

    if (/^#[0-9a-f]{6}$/i.test(value)) {
      return value;
    }

    if (/^[0-9a-f]{6}$/i.test(value)) {
      return "#" + value;
    }

    return "";
  }

  function parseColorList(rawValue) {
    var values = String(rawValue || "").split("|");
    var colors = [];
    var index;
    var normalized;

    for (index = 0; index < values.length; index += 1) {
      normalized = normalizeHexColor(values[index]);

      if (normalized) {
        colors.push(normalized);
      }
    }

    return colors;
  }

  function parseImageFileList(rawValue) {
    var values = String(rawValue || "").split("|");
    var files = [];
    var index;
    var value;

    for (index = 0; index < values.length; index += 1) {
      value = String(values[index] || "").trim();
      if (value) {
        files.push(value);
      }
    }

    return files;
  }

  function createEntry(actionText, text, colorText, options) {
    var actions = String(actionText || "<>,<>").split(",");
    var settings = options || {};
    var defaultColor = normalizeColor(settings.defaultColor, "#ffaa00");
    var holdFrames = typeof settings.holdFrames === "number" ? settings.holdFrames : 100;
    var travel = Math.max(35, Math.round(String(text || "").length * 1.6));
    var colors = Array.isArray(colorText) ? colorText : parseColorList(colorText);

    return {
      start: actions[0] || "<>",
      end: actions[1] || "<>",
      text: String(text || ""),
      colors: colors,
      defaultColor: defaultColor,
      holdFrames: holdFrames,
      transitionFrames: travel,
      holdStartFrame: travel + holdFrames,
      durationFrames: (travel * 2) + holdFrames,
      characters: null
    };
  }

  function parseInlineMessageItems(text) {
    var source = String(text || "");
    var items = [];
    var plainText = "";
    var index = 0;
    var nextIndex;
    var imageIndex;

    while (index < source.length) {
      if (source.charAt(index) === "$") {
        if (source.charAt(index + 1) === "$") {
          items.push({ type: "text", value: "$" });
          plainText += "$";
          index += 2;
          continue;
        }

        nextIndex = index + 1;
        while (nextIndex < source.length && /[0-9]/.test(source.charAt(nextIndex))) {
          nextIndex += 1;
        }

        if (nextIndex > index + 1) {
          imageIndex = parseInt(source.slice(index + 1, nextIndex), 10);
          items.push({ type: "image", imageIndex: imageIndex });
          index = nextIndex;
          continue;
        }
      }

      items.push({ type: "text", value: source.charAt(index) });
      plainText += source.charAt(index);
      index += 1;
    }

    return {
      items: items,
      plainText: plainText
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
    var normalized = normalizeHexColor(rawValue);

    if (normalized) {
      return normalized;
    }

    return normalizeHexColor(fallback) || "#000000";
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

  function normalizeBackgroundImagePlacement(value) {
    if (value === "center" ||
      value === "top-left" ||
      value === "top-center" ||
      value === "top-right" ||
      value === "left-center" ||
      value === "right-center" ||
      value === "bottom-left" ||
      value === "bottom-center" ||
      value === "bottom-right" ||
      value === "fit" ||
      value === "xy" ||
      value === "xy-size") {
      return value;
    }

    return "center";
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

  function buildCanvasFont(settings) {
    var prefix = "";
    var styleValue = String(settings.fontStyle || "0");

    if (styleValue === "1") {
      prefix = "bold ";
    } else if (styleValue === "2") {
      prefix = "italic ";
    } else if (styleValue === "3") {
      prefix = "bold italic ";
    }

    return prefix + settings.fontSize + "px " + (settings.fontName || '"Times New Roman", Times, serif');
  }

  function extractFontNameFromDeclaration(fontValue) {
    var value = String(fontValue || "").trim();
    var match;

    if (!value) {
      return '"Times New Roman", Times, serif';
    }

    match = value.match(/(?:^|\s)\d+px\s+(.+)$/i);

    if (match && match[1]) {
      return match[1].trim();
    }

    return value;
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
    var initialFontSize = typeof options.fontSize === "number" ? options.fontSize : (typeof options.fontHeight === "number" ? options.fontHeight : 29);
    var initialFontStyle = typeof options.fontStyle !== "undefined" ? String(options.fontStyle) : "2";
    var initialFontName = typeof options.fontName === "string" && options.fontName.trim()
      ? options.fontName.trim()
      : extractFontNameFromDeclaration(options.font || "italic 29px Times New Roman, Times, serif");
    var settings = {
      width: options.width || canvas.width || 500,
      height: options.height || canvas.height || 78,
      backgroundColor: normalizeColor(options.backgroundColor, "#000033"),
      backgroundImage: String(options.backgroundImage || ""),
      backgroundImagePlacement: normalizeBackgroundImagePlacement(options.backgroundImagePlacement),
      backgroundImageX: clampNumber(options.backgroundImageX, -4000, 4000, 0),
      backgroundImageY: clampNumber(options.backgroundImageY, -4000, 4000, 0),
      backgroundImageWidth: clampNumber(options.backgroundImageWidth, 0, 4000, 0),
      backgroundImageHeight: clampNumber(options.backgroundImageHeight, 0, 4000, 0),
      messageFile: String(options.messageFile || ""),
      message: typeof options.message === "string" ? options.message : "",
      colors: typeof options.colors !== "undefined" ? options.colors : null,
      start: options.start || ">>",
      end: options.end || "<<",
      staticMessage: !!options.staticMessage,
      backgroundMode: normalizeBackgroundMode(options.backgroundMode),
      dotColor: normalizeColor(options.dotColor, "#9999ff"),
      dotCount: typeof options.dotCount === "number" ? options.dotCount : 50,
      waveHeight: typeof options.waveHeight === "number" ? options.waveHeight : 8,
      fontName: initialFontName || '"Times New Roman", Times, serif',
      fontSize: initialFontSize,
      fontStyle: initialFontStyle,
      fontHeight: initialFontSize,
      fps: typeof options.fps === "number" ? options.fps : 30,
      displayFrames: typeof options.displayFrames === "number" ? options.displayFrames : 100,
      edgePadding: typeof options.edgePadding === "number" ? options.edgePadding : 18,
      dotSpeed: typeof options.dotSpeed === "number" ? options.dotSpeed : 0.18,
      defaultColor: normalizeColor(options.defaultColor, "#ffaa00"),
      imageFiles: typeof options.imageFiles === "string" ? options.imageFiles : ""
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
      backgroundImageSource: "",
      inlineImages: [],
      lastTimestamp: 0,
      entries: []
    };

    resizeCanvas();
    updateBackgroundImage(settings.backgroundImage);
    loadInlineImages(settings.imageFiles);
    setEntries(options.entries || buildFallbackEntries(), false);
    loadOptionalMessageFile();
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

    function buildFallbackEntries() {
      if (typeof settings.message === "string" && settings.message.length) {
        return [{
          start: settings.start || ">>",
          end: settings.end || "<<",
          text: settings.message,
          colors: typeof settings.colors === "string" ? parseColorList(settings.colors) : (settings.colors || []),
          defaultColor: settings.defaultColor
        }];
      }

      return [];
    }

    function loadOptionalMessageFile() {
      if (!settings.messageFile) {
        return;
      }

      loadMessageFile(settings.messageFile, {
        defaultColor: settings.defaultColor,
        holdFrames: settings.displayFrames,
        firstEntryAction: options.firstEntryAction,
        defaultEntryAction: options.defaultEntryAction
      }).then(function (loadedEntries) {
        if (loadedEntries && loadedEntries.length && settings.messageFile) {
          setEntries(loadedEntries, false);
        }
      }).catch(function () {
        // Keep the current fallback entries if the optional message file fails to load.
      });
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
      var previousBackgroundImage = settings.backgroundImage;
      var previousBackgroundImagePlacement = settings.backgroundImagePlacement;
      var previousBackgroundImageX = settings.backgroundImageX;
      var previousBackgroundImageY = settings.backgroundImageY;
      var previousBackgroundImageWidth = settings.backgroundImageWidth;
      var previousBackgroundImageHeight = settings.backgroundImageHeight;
      var previousImageFiles = settings.imageFiles;
      var previousMessageFile = settings.messageFile;
      var previousBackgroundMode = settings.backgroundMode;

      settings.width = next.width || settings.width;
      settings.height = next.height || settings.height;
      settings.backgroundColor = typeof next.backgroundColor !== "undefined" ? normalizeColor(next.backgroundColor, settings.backgroundColor) : settings.backgroundColor;
      settings.backgroundImage = typeof next.backgroundImage === "string" ? next.backgroundImage : settings.backgroundImage;
      settings.backgroundImagePlacement = typeof next.backgroundImagePlacement === "string" ? normalizeBackgroundImagePlacement(next.backgroundImagePlacement) : settings.backgroundImagePlacement;
      settings.backgroundImageX = typeof next.backgroundImageX === "number" ? clampNumber(next.backgroundImageX, -4000, 4000, settings.backgroundImageX) : settings.backgroundImageX;
      settings.backgroundImageY = typeof next.backgroundImageY === "number" ? clampNumber(next.backgroundImageY, -4000, 4000, settings.backgroundImageY) : settings.backgroundImageY;
      settings.backgroundImageWidth = typeof next.backgroundImageWidth === "number" ? clampNumber(next.backgroundImageWidth, 0, 4000, settings.backgroundImageWidth) : settings.backgroundImageWidth;
      settings.backgroundImageHeight = typeof next.backgroundImageHeight === "number" ? clampNumber(next.backgroundImageHeight, 0, 4000, settings.backgroundImageHeight) : settings.backgroundImageHeight;
      settings.messageFile = typeof next.messageFile === "string" ? next.messageFile : settings.messageFile;
      settings.message = typeof next.message === "string" ? next.message : settings.message;
      settings.colors = typeof next.colors !== "undefined" ? next.colors : settings.colors;
      settings.start = typeof next.start === "string" ? next.start : settings.start;
      settings.end = typeof next.end === "string" ? next.end : settings.end;
      settings.staticMessage = typeof next.staticMessage === "boolean" ? next.staticMessage : settings.staticMessage;
      settings.backgroundMode = next.backgroundMode ? normalizeBackgroundMode(next.backgroundMode) : settings.backgroundMode;
      settings.dotColor = typeof next.dotColor !== "undefined" ? normalizeColor(next.dotColor, settings.dotColor) : settings.dotColor;
      settings.dotCount = typeof next.dotCount === "number" ? next.dotCount : settings.dotCount;
      settings.waveHeight = typeof next.waveHeight === "number" ? next.waveHeight : settings.waveHeight;
      settings.fontName = typeof next.fontName === "string" && next.fontName.trim() ? next.fontName.trim() : (next.font ? extractFontNameFromDeclaration(next.font) : settings.fontName);
      settings.fontSize = typeof next.fontSize === "number" ? next.fontSize : (typeof next.fontHeight === "number" ? next.fontHeight : settings.fontSize);
      settings.fontStyle = typeof next.fontStyle !== "undefined" ? String(next.fontStyle) : settings.fontStyle;
      settings.fontHeight = settings.fontSize;
      settings.fps = typeof next.fps === "number" ? next.fps : settings.fps;
      settings.displayFrames = typeof next.displayFrames === "number" ? next.displayFrames : settings.displayFrames;
      settings.edgePadding = typeof next.edgePadding === "number" ? next.edgePadding : settings.edgePadding;
      settings.dotSpeed = typeof next.dotSpeed === "number" ? next.dotSpeed : settings.dotSpeed;
      settings.defaultColor = typeof next.defaultColor !== "undefined" ? normalizeColor(next.defaultColor, settings.defaultColor) : settings.defaultColor;
      settings.imageFiles = typeof next.imageFiles === "string" ? next.imageFiles : settings.imageFiles;

      if (settings.dotCount !== previousDotCount) {
        setRenderDotCount(Math.min(state.renderDotCount, settings.dotCount));
      }

      if (settings.backgroundImage !== previousBackgroundImage ||
        settings.backgroundImagePlacement !== previousBackgroundImagePlacement ||
        settings.backgroundImageX !== previousBackgroundImageX ||
        settings.backgroundImageY !== previousBackgroundImageY ||
        settings.backgroundImageWidth !== previousBackgroundImageWidth ||
        settings.backgroundImageHeight !== previousBackgroundImageHeight) {
        updateBackgroundImage(settings.backgroundImage);
      } else {
        applyCanvasBackgroundStyle();
      }

      if (settings.imageFiles !== previousImageFiles) {
        loadInlineImages(settings.imageFiles);
      }

      if (settings.messageFile !== previousMessageFile) {
        setEntries(buildFallbackEntries(), false);
        loadOptionalMessageFile();
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
            defaultColor: settings.defaultColor,
            holdFrames: settings.displayFrames
          }));
          continue;
        }

        list.push(createEntry(
          (entry.start || "<>") + "," + (entry.end || "<>"),
          entry.text || "",
          entry.colors || [],
          {
            defaultColor: typeof entry.defaultColor !== "undefined" ? entry.defaultColor : settings.defaultColor,
            holdFrames: typeof entry.holdFrames === "number" ? entry.holdFrames : settings.displayFrames
          }
        ));
      }

      if (!list.length) {
        list.push(createEntry("<>,<>", "", [], {
          defaultColor: settings.defaultColor,
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
        if (!settings.staticMessage) {
          state.entryFrame += 1;

          if (state.entryFrame > state.entries[state.currentIndex].durationFrames) {
            state.currentIndex = (state.currentIndex + 1) % state.entries.length;
            state.entryFrame = 0;
          }
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
      if (settings.staticMessage) {
        progress = 1;
        holdProgress = 0;
      } else {
        progress = Math.min(state.entryFrame / entry.transitionFrames, 1);
        holdProgress = Math.max(state.entryFrame - entry.holdStartFrame, 0);
        if (state.entryFrame > entry.holdStartFrame) {
          exitProgress = Math.min(holdProgress / entry.transitionFrames, 1);
        }
      }
      position = getPosition(entry, metrics, progress, holdProgress);

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!settings.backgroundImage) {
        context.fillStyle = settings.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      drawDots();
      drawText(entry, metrics, position.x, position.y, progress, exitProgress);
    }

    function drawDots() {
      var mode = getMode(settings.backgroundMode);

      if (mode && typeof mode.draw === "function") {
        mode.draw(getModeRuntime());
      }
    }

    function loadInlineImages(imageFiles) {
      var nextFiles = parseImageFileList(imageFiles);
      var nextImages = [];
      var index;
      var fileName;
      var image;

      for (index = 0; index < nextFiles.length; index += 1) {
        fileName = String(nextFiles[index] || "").trim();
        if (!fileName) {
          continue;
        }
        image = new Image();
        image.onload = drawFrame;
        image.src = fileName;
        nextImages.push(image);
      }

      state.inlineImages = nextImages;
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
      var waveFrame = settings.staticMessage ? state.backgroundFrame : state.entryFrame;
      var canvasMidX = canvas.width / 2;
      var textMidOffset;
      var enterFromCenter = entry.start === "<>" && progress < 1 && exitProgress === 0;
      var zoomThroughCenter = entry.end === "<>" && exitProgress > 0;
      var enterZoomScale = enterFromCenter ? (2.8 - (1.8 * easeOutCubic(progress))) : 1;
      var zoomAmount = zoomThroughCenter ? easeInCubic(exitProgress) : 0;
      var exitZoomScale = zoomThroughCenter ? (1 + (2.2 * zoomAmount)) : 1;
      var alpha = 1;
      var x;
      var image;
      var drawWidth;
      var drawHeight;
      var imageY;
      var textColorIndex = 0;

      if (enterFromCenter) {
        alpha = 0.2 + (0.8 * progress);
      } else if (zoomThroughCenter) {
        alpha = 1 - exitProgress;
      }

      context.font = buildCanvasFont(settings);
      context.textBaseline = "middle";
      context.globalAlpha = alpha;

      for (index = 0; index < entry.characters.length; index += 1) {
        character = entry.characters[index];
        wave = Math.sin((waveFrame / 4) + (index / 1.7)) * settings.waveHeight;
        textMidOffset = (character.offsetX + (character.width / 2)) - (metrics.width / 2);
        x = baseX + character.offsetX;

        if (enterFromCenter) {
          x = canvasMidX + (textMidOffset * enterZoomScale) - (character.width / 2);
        }

        if (zoomThroughCenter) {
          x = canvasMidX + (textMidOffset * exitZoomScale) - (character.width / 2);
          wave = wave * (1 + (0.25 * zoomAmount));
        }

        if (character.type === "image") {
          image = state.inlineImages[character.imageIndex];
          if (image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
            drawHeight = settings.fontHeight;
            drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
            imageY = (baseY + wave) - (drawHeight / 2);
            context.drawImage(image, x, imageY, drawWidth, drawHeight);
          }
        } else {
          color = entry.colors[textColorIndex] || entry.defaultColor || settings.defaultColor;
          context.fillStyle = color;
          context.fillText(character.value, x, baseY + wave);
          textColorIndex += 1;
        }
      }

      context.globalAlpha = 1;
    }

    function measureEntry(entry) {
      var offsetX = 0;
      var characters = [];
      var parsed = parseInlineMessageItems(entry.text);
      var index;
      var item;
      var value;
      var width;
      var image;

      context.font = buildCanvasFont(settings);

      for (index = 0; index < parsed.items.length; index += 1) {
        item = parsed.items[index];
        if (item.type === "image") {
          image = state.inlineImages[item.imageIndex];
          if (image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
            width = settings.fontHeight * (image.naturalWidth / image.naturalHeight);
          } else {
            width = settings.fontHeight;
          }

          characters.push({
            type: "image",
            imageIndex: item.imageIndex,
            width: width,
            offsetX: offsetX
          });
          offsetX += width;
          continue;
        }

        value = item.value;
        width = context.measureText(value).width;

        characters.push({
          type: "text",
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
      context.font = buildCanvasFont(settings);

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

    function updateBackgroundImage(nextSource) {
      var source = String(nextSource || "").trim();

      state.backgroundImageSource = source;
      applyCanvasBackgroundStyle();
      drawFrame();
    }

    function applyCanvasBackgroundStyle() {
      var source = state.backgroundImageSource;

      canvas.style.backgroundColor = settings.backgroundColor;

      if (settings.backgroundImagePlacement === "center") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "center center";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "top-left") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "left top";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "top-center") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "center top";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "top-right") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "right top";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "left-center") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "left center";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "right-center") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "right center";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "bottom-left") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "left bottom";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "bottom-center") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "center bottom";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "bottom-right") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "right bottom";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "fit") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = "center center";
        canvas.style.backgroundSize = "100% 100%";
      } else if (settings.backgroundImagePlacement === "xy") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = settings.backgroundImageX + "px " + settings.backgroundImageY + "px";
        canvas.style.backgroundSize = "auto";
      } else if (settings.backgroundImagePlacement === "xy-size") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundPosition = settings.backgroundImageX + "px " + settings.backgroundImageY + "px";
        if (settings.backgroundImageWidth > 0 && settings.backgroundImageHeight > 0) {
          canvas.style.backgroundSize = settings.backgroundImageWidth + "px " + settings.backgroundImageHeight + "px";
        } else {
          canvas.style.backgroundSize = "auto";
        }
      } else {
        canvas.style.backgroundRepeat = "repeat";
        canvas.style.backgroundPosition = "left top";
        canvas.style.backgroundSize = "auto";
      }

      canvas.style.backgroundImage = source ? ('url("' + source.replace(/"/g, "%22") + '")') : "none";
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

  window.ShoomiColorMarquee = {
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
