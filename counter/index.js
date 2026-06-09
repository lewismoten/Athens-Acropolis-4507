(function () {
  var form = document.getElementById("counter-form");
  var previewBox = document.getElementById("preview-box");
  var previewModeSelect = document.getElementById("preview-mode");
  var urlOutput = document.getElementById("counter-url");
  var tagOutput = document.getElementById("counter-tag");
  var copyUrlButton = document.getElementById("copy-url");
  var copyTagButton = document.getElementById("copy-tag");
  var fields;
  var stripImage = new Image();
  var requestedStripSrc = "";
  var loadedStripSrc = "";
  var lastServerPreviewMode = "php";
  var previewRequestId = 0;
  var previewObjectUrl = null;
  var stripLayoutRequests = {};
  var STRIP_LAYOUTS = {
    "counter-strip": {
      src: "counter-strip.gif",
      meta: "counter-strip.meta.json",
      tokens: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", "am", "pm", ",", "-"],
      widths: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 10, 24, 24, 11, 11],
      offsets: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 160, 184, 208, 219]
    },
    "@strip_blue_tea_counter": {
      src: "@strip_blue_tea_counter.gif",
      meta: "@strip_blue_tea_counter.meta.json",
      tokens: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", "am", "pm", ",", "-"],
      widths: [15, 12, 16, 16, 17, 16, 16, 16, 16, 16, 10, 31, 29, 9, 11],
      offsets: [0, 16, 29, 46, 63, 81, 98, 115, 132, 149, 166, 178, 210, 241, 251]
    }
  };

  if (!form || !previewBox || !previewModeSelect || !urlOutput || !tagOutput) {
    return;
  }

  fields = {
    df: document.getElementById("counter-df"),
    strip: document.getElementById("counter-strip"),
    digits: document.getElementById("counter-digits"),
    frgb: document.getElementById("counter-frgb"),
    ft: document.getElementById("counter-ft"),
    step: document.getElementById("counter-step"),
    comma: document.getElementById("counter-comma"),
    increment: document.getElementById("counter-increment"),
    previewCount: document.getElementById("counter-preview-count")
  };

  setStripImageSource(fields.strip.value);
  ensureStripLayout(fields.strip.value);

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];

    if (!field) {
      return;
    }

    bindSyncEvents(field, onFormChanged);
  });

  bindSyncEvents(form, onFormChanged);
  bindSyncEvents(previewModeSelect, function () {
    if (previewModeSelect.value === "php" || previewModeSelect.value === "python" || previewModeSelect.value === "go" || previewModeSelect.value === "perl") {
      lastServerPreviewMode = previewModeSelect.value;
    }
    syncOutputsAndPreview();
  });
  copyUrlButton.addEventListener("click", function () {
    copyText(urlOutput.value);
  });
  copyTagButton.addEventListener("click", function () {
    copyText(tagOutput.value);
  });

  syncOutputsAndPreview();

  function getConfig() {
    return {
      df: String(fields.df.value || "default.dat"),
      strip: String(fields.strip.value || "counter-strip"),
      previewMode: String(previewModeSelect.value || "canvas"),
      digits: clampInteger(fields.digits.value, 1, 12, 4),
      frgb: normalizeHex(fields.frgb.value || "#000066"),
      ft: clampInteger(fields.ft.value, 0, 6, 0),
      step: clampInteger(fields.step.value, 0, 1000, 1),
      comma: !!fields.comma.checked,
      increment: !!fields.increment.checked,
      previewCount: clampInteger(fields.previewCount.value, 0, 999999999, 12345)
    };
  }

  function buildLegacyDdValue(config) {
    return [
      config.strip,
      "frgb=" + config.frgb.replace(/^#/, ""),
      "comma=" + (config.comma ? "T" : "F"),
      "ft=" + config.ft
    ].join("|");
  }

  function buildServerUrl(config, cacheBuster) {
    var params = new URLSearchParams();
    var scriptName = getSelectedServerScript(getEffectiveServerMode(config.previewMode));
    var values = buildServerParams(config);

    Object.keys(values).forEach(function (key) {
      params.set(key, values[key]);
    });

    if (cacheBuster) {
      params.set("_ts", String(Date.now()));
    }

    return scriptName + "?" + params.toString();
  }

  function buildServerParams(config) {
    return {
      df: config.df,
      strip: config.strip,
      dd: buildLegacyDdValue(config),
      digits: String(config.digits),
      step: String(config.step),
      increment: config.increment ? "1" : "0"
    };
  }

  function buildEmbedCode(config) {
    var effectiveMode = getEffectiveServerMode(config.previewMode);
    var params = buildServerParams(config);
    var endpoint = getSelectedServerScript(effectiveMode);
    var lines;

    if (effectiveMode !== "perl") {
      return '<img src="' + buildServerUrl(config, false) + '" alt="counter">';
    }

    lines = [
      '<div id="visitor-counter"></div>',
      '<script src="shoomi-visitor-counter.js"><' + '/script>',
      '<script>',
      'ShoomiVisitorCounter.mount("#visitor-counter", {',
      '  endpoint: "' + endpoint + '",',
      '  params: ' + JSON.stringify(params, null, 2).replace(/\n/g, '\n  '),
      '});',
      '<' + '/script>'
    ];

    return lines.join("\n");
  }

  function buildImgTag(config) {
    return buildEmbedCode(config);
  }

  function updateOutputs() {
    var config = getConfig();

    urlOutput.value = buildServerUrl(config, false);
    tagOutput.value = buildImgTag(config);
  }

  function syncOutputsAndPreview() {
    updateOutputs();
    renderActivePreview();
  }

  function onFormChanged() {
    setStripImageSource(fields.strip.value);
    ensureStripLayout(fields.strip.value);
    syncOutputsAndPreview();
  }

  function bindSyncEvents(target, handler) {
    ["input", "change", "keyup", "click", "paste"].forEach(function (eventName) {
      target.addEventListener(eventName, handler);
    });
  }

  function renderActivePreview() {
    if (previewModeSelect.value === "perl") {
      renderPerlPreview();
      return;
    }

    if (previewModeSelect.value === "php" || previewModeSelect.value === "python" || previewModeSelect.value === "go") {
      renderServerPreview();
      return;
    }

    renderCanvasPreview();
  }

  function renderServerPreview() {
    var config = getConfig();
    var requestId;
    var url;

    clearPreviewMedia();
    previewBox.textContent = "Loading server preview...";
    url = buildServerUrl(config, true);
    requestId = ++previewRequestId;

    if (!window.fetch) {
      renderServerPreviewWithImageTag(url, requestId);
      return;
    }

    window.fetch(url, { cache: "no-store" })
      .then(function (response) {
        var contentType = String(response.headers.get("content-type") || "").toLowerCase();

        if (!response.ok) {
          return response.text().then(function (text) {
            throw buildServerPreviewError(
              "The server preview returned HTTP " + response.status + ".",
              text
            );
          });
        }

        if (contentType.indexOf("image/") !== 0) {
          return response.text().then(function (text) {
            throw buildServerPreviewError(
              "The selected script did not return an image. Content-Type was `" + (contentType || "unknown") + "`.",
              text
            );
          });
        }

        return response.blob().then(function (blob) {
          return { blob: blob, contentType: contentType };
        });
      })
      .then(function (result) {
        var image;

        if (requestId !== previewRequestId) {
          return;
        }

        clearPreviewMedia();
        previewObjectUrl = URL.createObjectURL(result.blob);
        image = document.createElement("img");
        image.alt = "Server counter preview";
        image.onload = function () {
          if (requestId !== previewRequestId) {
            return;
          }
          previewBox.innerHTML = "";
          previewBox.appendChild(image);
        };
        image.onerror = function () {
          if (requestId !== previewRequestId) {
            return;
          }
          showPreviewError("The selected script returned data, but the browser could not decode it as an image.");
        };
        image.src = previewObjectUrl;
      })
      .catch(function (error) {
        if (requestId !== previewRequestId) {
          return;
        }

        showPreviewError(error && error.message ? error.message : "Unable to load the server preview.");
      });
  }

  function renderServerPreviewWithImageTag(url, requestId) {
    var image = document.createElement("img");

    clearPreviewMedia();
    image.alt = "Server counter preview";
    image.onload = function () {
      if (requestId !== previewRequestId) {
        return;
      }
      previewBox.innerHTML = "";
      previewBox.appendChild(image);
    };
    image.onerror = function () {
      if (requestId !== previewRequestId) {
        return;
      }
      showPreviewError("The selected script could not be loaded as an image. The server may be returning an error page or raw source code instead of executing the script.");
    };
    image.src = url;
  }

  function buildServerPreviewError(message, responseText) {
    var snippet = String(responseText || "").replace(/\s+/g, " ").trim().slice(0, 180);
    var error = new Error(message + (snippet ? "\n\nResponse preview:\n" + snippet : ""));

    return error;
  }

  function showPreviewError(message) {
    var error = document.createElement("div");

    clearPreviewMedia();
    error.className = "preview-error";
    error.textContent = String(message || "Unable to render preview.");
    previewBox.innerHTML = "";
    previewBox.appendChild(error);
  }

  function clearPreviewMedia() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
  }

  function getSelectedServerScript(previewMode) {
    if (previewMode === "perl") {
      return "counter.pl";
    }
    if (previewMode === "python") {
      return "counter.py";
    }
    if (previewMode === "go") {
      return "counter.go";
    }

    return "counter.php";
  }

  function getEffectiveServerMode(previewMode) {
    if (previewMode === "php" || previewMode === "python" || previewMode === "go" || previewMode === "perl") {
      return previewMode;
    }

    return lastServerPreviewMode || "php";
  }

  function renderPerlPreview() {
    var config = getConfig();

    clearPreviewMedia();
    previewBox.textContent = "Loading server preview...";

    if (!window.ShoomiVisitorCounter || typeof window.ShoomiVisitorCounter.mount !== "function") {
      showPreviewError("shoomi-visitor-counter.js is required to preview the Perl JSONP counter.");
      return;
    }

    window.ShoomiVisitorCounter.mount(previewBox, {
      endpoint: "counter.pl",
      params: buildServerParams(config),
      basePath: ""
    }).catch(function (error) {
      showPreviewError(error && error.message ? error.message : "Unable to load the Perl JSONP preview.");
    });
  }

  function renderCanvasPreview() {
    var config = getConfig();
    var text = formatCount(config.previewCount, config.digits, config.comma);
    var tokens = tokenizeDisplayText(text, getStripLayout(config.strip).tokens);
    var canvas;
    var context;
    var stripCanvas;
    var glyphHeight;
    var layout = getStripLayout(config.strip);
    var glyphMap = getGlyphMap(layout);
    var offsets = getGlyphOffsets(layout);
    var trailingPadding = 0;
    var width = 0;
    var index;
    var sourceIndex;
    var expectedSrc = resolveStripUrl(layout.src);

    if (loadedStripSrc !== expectedSrc || !stripImage.complete || !stripImage.naturalWidth) {
      previewBox.textContent = "Loading counter strip...";
      return;
    }

    glyphHeight = stripImage.naturalHeight;
    stripCanvas = buildStripCanvas();
    canvas = document.createElement("canvas");
    for (index = 0; index < tokens.length; index += 1) {
      sourceIndex = glyphMap[tokens[index]];
      if (typeof sourceIndex !== "number") {
        sourceIndex = 0;
      }
      width += layout.widths[sourceIndex];
    }
    if (tokens.length) {
      sourceIndex = glyphMap[tokens[tokens.length - 1]];
      if (typeof sourceIndex !== "number") {
        sourceIndex = 0;
      }
      trailingPadding = getGlyphTrailingPadding(layout, offsets, sourceIndex, stripImage.naturalWidth);
    }
    canvas.width = width + trailingPadding;
    canvas.height = glyphHeight;
    context = canvas.getContext("2d");
    width = 0;

    for (index = 0; index < tokens.length; index += 1) {
      sourceIndex = glyphMap[tokens[index]];
      if (typeof sourceIndex !== "number") {
        sourceIndex = 0;
      }

      context.drawImage(
        stripCanvas,
        offsets[sourceIndex],
        0,
        layout.widths[sourceIndex],
        glyphHeight,
        width,
        0,
        layout.widths[sourceIndex],
        glyphHeight
      );
      width += layout.widths[sourceIndex];
    }

    if (trailingPadding > 0 && tokens.length) {
      context.drawImage(
        stripCanvas,
        offsets[sourceIndex] + layout.widths[sourceIndex],
        0,
        trailingPadding,
        glyphHeight,
        width,
        0,
        trailingPadding,
        glyphHeight
      );
    }

    canvas = buildFramedPreviewCanvas(canvas, config.frgb, config.ft);

    previewBox.innerHTML = "";
    previewBox.appendChild(canvas);
  }

  function buildStripCanvas() {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = stripImage.naturalWidth;
    canvas.height = stripImage.naturalHeight;
    context.drawImage(stripImage, 0, 0);

    return canvas;
  }

  function buildFramedPreviewCanvas(sourceCanvas, hexColor, thickness) {
    var framedCanvas;
    var framedContext;
    var line;

    if (thickness <= 0) {
      return sourceCanvas;
    }

    framedCanvas = document.createElement("canvas");
    framedCanvas.width = sourceCanvas.width + (thickness * 2);
    framedCanvas.height = sourceCanvas.height + (thickness * 2);
    framedContext = framedCanvas.getContext("2d");

    framedContext.drawImage(sourceCanvas, thickness, thickness);
    framedContext.save();
    framedContext.strokeStyle = hexColor;

    for (line = 0; line < thickness; line += 1) {
      framedContext.strokeRect(
        line + 0.5,
        line + 0.5,
        framedCanvas.width - (line * 2) - 1,
        framedCanvas.height - (line * 2) - 1
      );
    }

    framedContext.restore();

    return framedCanvas;
  }

  function formatCount(value, digits, useComma) {
    var text = String(Math.max(0, value));
    var parts = [];

    while (text.length < digits) {
      text = "0" + text;
    }

    if (!useComma) {
      return text;
    }

    while (text.length > 3) {
      parts.unshift(text.slice(-3));
      text = text.slice(0, -3);
    }

    parts.unshift(text);
    return parts.join(",");
  }

  function getGlyphMap() {
    var layout = arguments.length > 0 ? arguments[0] : getStripLayout(getConfig().strip);
    var map = {};
    var index;

    for (index = 0; index < layout.tokens.length; index += 1) {
      map[layout.tokens[index]] = index;
    }

    return map;
  }

  function getGlyphOffsets(layout) {
    var offsets = [];
    var left = 0;
    var index;

    if (layout.offsets && layout.offsets.length === layout.widths.length) {
      return layout.offsets.slice();
    }

    for (index = 0; index < layout.widths.length; index += 1) {
      offsets.push(left);
      left += layout.widths[index];
    }

    return offsets;
  }

  function getGlyphTrailingPadding(layout, offsets, glyphIndex, imageWidth) {
    var rightEdge = offsets[glyphIndex] + layout.widths[glyphIndex];
    var nextOffset = glyphIndex + 1 < offsets.length ? offsets[glyphIndex + 1] : imageWidth;

    return Math.max(0, nextOffset - rightEdge);
  }

  function getStripLayout(stripName) {
    return STRIP_LAYOUTS[stripName] || STRIP_LAYOUTS["counter-strip"];
  }

  function resolveStripUrl(stripSrc) {
    return new URL(stripSrc, window.location.href).href;
  }

  function ensureStripLayout(stripName) {
    var layout = getStripLayout(stripName);

    if (!window.fetch || !layout.meta || stripLayoutRequests[stripName]) {
      return;
    }

    stripLayoutRequests[stripName] = window.fetch(layout.meta, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load strip metadata.");
        }

        return response.json();
      })
      .then(function (metadata) {
        var parsed = parseStripMetadata(metadata);

        if (!parsed) {
          return;
        }

        layout.tokens = parsed.tokens;
        layout.widths = parsed.widths;
        layout.offsets = parsed.offsets;
      })
      .catch(function () {
        return null;
      })
      .then(function () {
        if (getConfig().strip === stripName && previewModeSelect.value === "canvas") {
          renderCanvasPreview();
        }
      });
  }

  function parseStripMetadata(metadata) {
    var tokens;
    var widths;
    var offsets;
    var base;
    var baseWidth;
    var baseAdvance;
    var left;
    var index;
    var token;
    var entry;
    var width;
    var offset;
    var advance;

    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    if (Array.isArray(metadata.tokens) && Array.isArray(metadata.widths) && metadata.tokens.length === metadata.widths.length) {
      tokens = metadata.tokens.slice();
      widths = metadata.widths.map(function (value) {
        return clampInteger(value, 1, 999, 1);
      });
      offsets = Array.isArray(metadata.offsets) && metadata.offsets.length === widths.length
        ? metadata.offsets.map(function (value) { return clampInteger(value, 0, 9999, 0); })
        : getGlyphOffsets({ widths: widths });

      return { tokens: tokens, widths: widths, offsets: offsets };
    }

    base = metadata.base;
    if (!base || !Array.isArray(base.tokens)) {
      return null;
    }

    baseWidth = clampInteger(base.width, 1, 999, 0);
    if (!baseWidth) {
      return null;
    }

    baseAdvance = clampInteger(base.advance, 1, 9999, baseWidth);
    left = clampInteger(base.offset, 0, 9999, 0);
    tokens = base.tokens.slice();
    widths = [];
    offsets = [];

    for (index = 0; index < tokens.length; index += 1) {
      token = tokens[index];
      entry = metadata[token];
      width = baseWidth;
      offset = left;
      advance = baseAdvance;

      if (typeof entry === "number") {
        width = clampInteger(entry, 1, 999, baseWidth);
        advance = width;
      } else if (entry && typeof entry === "object") {
        width = clampInteger(entry.width, 1, 999, baseWidth);
        offset = clampInteger(entry.offset, 0, 9999, left);
        advance = clampInteger(entry.advance, 1, 9999, width);
      }

      widths.push(width);
      offsets.push(offset);
      left = offset + advance;
    }

    return { tokens: tokens, widths: widths, offsets: offsets };
  }

  function setStripImageSource(stripName) {
    var layout = getStripLayout(stripName);
    var nextSrc = resolveStripUrl(layout.src);

    if (requestedStripSrc === nextSrc && loadedStripSrc === nextSrc && stripImage.complete) {
      return;
    }

    requestedStripSrc = nextSrc;
    loadedStripSrc = "";
    stripImage.onload = function () {
      if (requestedStripSrc !== nextSrc) {
        return;
      }

      loadedStripSrc = nextSrc;
      renderCanvasPreview();
    };
    stripImage.onerror = function () {
      if (requestedStripSrc !== nextSrc) {
        return;
      }

      loadedStripSrc = "";
      showPreviewError("Unable to load the selected counter strip image.");
    };
    stripImage.src = nextSrc;

    if (stripImage.complete && stripImage.naturalWidth) {
      loadedStripSrc = nextSrc;
      renderCanvasPreview();
    }
  }

  function tokenizeDisplayText(text, availableTokens) {
    var tokens = [];
    var tokenLookup = {};
    var index;
    var pair;
    var character;

    for (index = 0; index < availableTokens.length; index += 1) {
      tokenLookup[availableTokens[index]] = true;
    }

    index = 0;

    while (index < text.length) {
      pair = text.slice(index, index + 2).toLowerCase();

      if ((pair === "am" || pair === "pm") && tokenLookup[pair]) {
        tokens.push(pair);
        index += 2;
        continue;
      }

      character = text.charAt(index);
      if (tokenLookup[character]) {
        tokens.push(character);
      }

      index += 1;
    }

    if (!tokens.length) {
      tokens.push(tokenLookup["0"] ? "0" : availableTokens[0]);
    }

    return tokens;
  }

  function clampInteger(value, min, max, fallback) {
    var number = parseInt(value, 10);

    if (!isFinite(number)) {
      number = fallback;
    }

    if (number < min) {
      return min;
    }

    if (number > max) {
      return max;
    }

    return number;
  }

  function normalizeHex(value) {
    var text = String(value || "").trim();

    if (!/^#[0-9a-f]{6}$/i.test(text)) {
      return "#000066";
    }

    return text.toLowerCase();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }

    window.prompt("Copy this text:", text);
  }
}());
