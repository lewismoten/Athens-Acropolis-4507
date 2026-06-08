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

  if (!form || !previewBox || !previewModeSelect || !urlOutput || !tagOutput) {
    return;
  }

  fields = {
    df: document.getElementById("counter-df"),
    ddBase: document.getElementById("counter-dd"),
    digits: document.getElementById("counter-digits"),
    frgb: document.getElementById("counter-frgb"),
    ft: document.getElementById("counter-ft"),
    step: document.getElementById("counter-step"),
    comma: document.getElementById("counter-comma"),
    increment: document.getElementById("counter-increment"),
    previewCount: document.getElementById("counter-preview-count")
  };

  stripImage.src = "counter-strip.gif";

  form.addEventListener("input", onFormChanged);
  form.addEventListener("change", onFormChanged);
  previewModeSelect.addEventListener("change", renderActivePreview);
  copyUrlButton.addEventListener("click", function () {
    copyText(urlOutput.value);
  });
  copyTagButton.addEventListener("click", function () {
    copyText(tagOutput.value);
  });

  updateOutputs();
  renderActivePreview();

  function getConfig() {
    return {
      df: String(fields.df.value || "default.dat"),
      ddBase: String(fields.ddBase.value || "lmoten(a)"),
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
      config.ddBase,
      "frgb=" + config.frgb.replace(/^#/, ""),
      "comma=" + (config.comma ? "T" : "F"),
      "ft=" + config.ft
    ].join("|");
  }

  function buildPhpUrl(config, cacheBuster) {
    var params = new URLSearchParams();

    params.set("df", config.df);
    params.set("dd", buildLegacyDdValue(config));
    params.set("digits", String(config.digits));
    params.set("step", String(config.step));
    params.set("increment", config.increment ? "1" : "0");

    if (cacheBuster) {
      params.set("_ts", String(Date.now()));
    }

    return "index.php?" + params.toString();
  }

  function buildImgTag(config) {
    return '<img src="' + buildPhpUrl(config, false) + '" alt="counter">';
  }

  function updateOutputs() {
    var config = getConfig();

    urlOutput.value = buildPhpUrl(config, false);
    tagOutput.value = buildImgTag(config);
  }

  function onFormChanged() {
    updateOutputs();
    renderActivePreview();
  }

  function renderActivePreview() {
    if (previewModeSelect.value === "php") {
      renderPhpPreview();
      return;
    }

    renderCanvasPreview();
  }

  function renderPhpPreview() {
    var config = getConfig();
    var image = document.createElement("img");

    previewBox.innerHTML = "";
    image.alt = "PHP counter preview";
    image.src = buildPhpUrl(config, true);
    previewBox.appendChild(image);
  }

  function renderCanvasPreview() {
    var config = getConfig();
    var text = formatCount(config.previewCount, config.digits, config.comma);
    var canvas;
    var context;
    var stripCanvas;
    var glyphWidth;
    var glyphHeight;
    var glyphMap = getGlyphMap();
    var index;
    var sourceIndex;

    if (!stripImage.complete || !stripImage.naturalWidth) {
      stripImage.onload = renderCanvasPreview;
      return;
    }

    glyphWidth = Math.floor(stripImage.naturalWidth / 11);
    glyphHeight = stripImage.naturalHeight;
    stripCanvas = buildTintedStripCanvas(config.frgb, config.ft);
    canvas = document.createElement("canvas");
    canvas.width = glyphWidth * text.length;
    canvas.height = glyphHeight;
    context = canvas.getContext("2d");

    for (index = 0; index < text.length; index += 1) {
      sourceIndex = glyphMap[text.charAt(index)];
      if (typeof sourceIndex !== "number") {
        sourceIndex = 0;
      }

      context.drawImage(
        stripCanvas,
        sourceIndex * glyphWidth,
        0,
        glyphWidth,
        glyphHeight,
        index * glyphWidth,
        0,
        glyphWidth,
        glyphHeight
      );
    }

    previewBox.innerHTML = "";
    previewBox.appendChild(canvas);
  }

  function buildTintedStripCanvas(hexColor, frameThickness) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var imageData;
    var data;
    var rgb = hexToRgb(hexColor);
    var index;
    var key;
    var protectedColors = {
      "0,0,0": true,
      "232,232,232": true,
      "252,252,252": true,
      "168,168,168": true
    };
    var gray;
    var glyphWidth;
    var glyphHeight;
    var cell;
    var line;

    canvas.width = stripImage.naturalWidth;
    canvas.height = stripImage.naturalHeight;
    context.drawImage(stripImage, 0, 0);
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;

    for (index = 0; index < data.length; index += 4) {
      key = data[index] + "," + data[index + 1] + "," + data[index + 2];
      gray = data[index];

      if (protectedColors[key] || data[index] !== data[index + 1] || data[index + 1] !== data[index + 2]) {
        continue;
      }

      data[index] = Math.round((gray / 255) * rgb[0]);
      data[index + 1] = Math.round((gray / 255) * rgb[1]);
      data[index + 2] = Math.round((gray / 255) * rgb[2]);
    }

    context.putImageData(imageData, 0, 0);

    if (frameThickness > 0) {
      glyphWidth = Math.floor(canvas.width / 11);
      glyphHeight = canvas.height;
      context.strokeStyle = hexColor;

      for (cell = 0; cell < 11; cell += 1) {
        for (line = 0; line < frameThickness; line += 1) {
          context.strokeRect(
            (cell * glyphWidth) + line + 0.5,
            line + 0.5,
            glyphWidth - (line * 2) - 1,
            glyphHeight - (line * 2) - 1
          );
        }
      }
    }

    return canvas;
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
    return {
      "0": 0,
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      ",": 10
    };
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

  function hexToRgb(hexColor) {
    var hex = hexColor.replace(/^#/, "");

    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ];
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }

    window.prompt("Copy this text:", text);
  }
}());
