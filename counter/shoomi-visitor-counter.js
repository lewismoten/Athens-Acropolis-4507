(function () {
  var api = window.ShoomiVisitorCounter || {};
  var layoutCache = {};
  var imageCache = {};

  api._callbacks = api._callbacks || {};
  api.mount = function (target, options) {
    var node = resolveTarget(target);
    var settings = options || {};
    var endpoint = settings.endpoint || "counter.pl";
    var params = copyObject(settings.params || {});
    var callbackParam = settings.callbackParam || "callback";
    var basePath = settings.basePath || getBasePath(endpoint);
    var timeoutMs = clampInteger(settings.timeoutMs, 500, 30000, 5000);

    if (!node) {
      return Promise.reject(new Error("Counter target was not found."));
    }

    node.textContent = "Loading counter...";

    return requestJsonp(endpoint, params, callbackParam, timeoutMs).then(function (payload) {
      return api.renderPayload(node, payload, { basePath: basePath });
    }).catch(function (error) {
      node.textContent = error && error.message ? error.message : "Unable to load counter.";
      throw error;
    });
  };

  api.renderPayload = function (target, payload, options) {
    var node = resolveTarget(target);
    var settings = options || {};
    var config = normalizePayload(payload);
    var basePath = settings.basePath || "";
    var stripSrc = config.stripSrc || stripSourceFor(config.strip);
    var layoutPromise;

    if (!node) {
      return Promise.reject(new Error("Counter target was not found."));
    }

    layoutPromise = loadStripLayout(stripSrc, basePath);

    return Promise.all([
      layoutPromise,
      loadStripImage(stripSrc, basePath)
    ]).then(function (results) {
      var layout = results[0];
      var image = results[1];
      var canvas = renderCounterCanvas(layout, image, config);

      if (node.tagName && String(node.tagName).toUpperCase() === "CANVAS") {
        node.width = canvas.width;
        node.height = canvas.height;
        node.getContext("2d").clearRect(0, 0, node.width, node.height);
        node.getContext("2d").drawImage(canvas, 0, 0);
        return node;
      }

      node.innerHTML = "";
      node.appendChild(canvas);
      return canvas;
    });
  };

  api.buildJsonpUrl = function (endpoint, params, callbackName, callbackParam) {
    var values = copyObject(params || {});
    values[callbackParam || "callback"] = callbackName;
    return buildUrl(endpoint, values);
  };

  window.ShoomiVisitorCounter = api;

  function requestJsonp(endpoint, params, callbackParam, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var callbackId = "cb" + Date.now() + String(Math.floor(Math.random() * 100000));
      var callbackName = "ShoomiVisitorCounter._callbacks." + callbackId;
      var script = document.createElement("script");
      var cleaned = false;
      var resolved = false;
      var timerId = 0;

      function cleanup() {
        if (cleaned) {
          return;
        }
        cleaned = true;
        if (timerId) {
          window.clearTimeout(timerId);
          timerId = 0;
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete api._callbacks[callbackId];
      }

      api._callbacks[callbackId] = function (payload) {
        resolved = true;
        cleanup();
        resolve(payload);
      };

      script.async = true;
      script.onerror = function () {
        cleanup();
        reject(new Error("Unable to load counter JSONP response."));
      };
      script.onload = function () {
        if (resolved) {
          return;
        }
        cleanup();
        reject(new Error("The counter endpoint loaded, but it did not call the JSONP callback. A static server may be serving the Perl source instead of executing it."));
      };
      script.src = api.buildJsonpUrl(endpoint, params, callbackName, callbackParam);
      timerId = window.setTimeout(function () {
        if (resolved) {
          return;
        }
        cleanup();
        reject(new Error("The counter endpoint did not return a JSONP callback in time. A static server may be serving the Perl script source instead of executing it."));
      }, clampInteger(timeoutMs, 500, 30000, 5000));
      (document.head || document.body || document.documentElement).appendChild(script);
    });
  }

  function renderCounterCanvas(layout, stripImage, config) {
    var text = config.displayText || (config.text ? String(config.text) : formatCount(config.count, config.digits, config.comma));
    var tokens = tokenizeDisplayText(text, layout.tokens);
    var glyphMap = getGlyphMap(layout);
    var offsets = getGlyphOffsets(layout);
    var canvas = document.createElement("canvas");
    var context;
    var index;
    var sourceIndex;
    var width = 0;
    var trailingPadding = 0;

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
      trailingPadding = getGlyphTrailingPadding(layout, offsets, sourceIndex, stripImage.naturalWidth || stripImage.width);
    }

    canvas.width = width + trailingPadding;
    canvas.height = stripImage.naturalHeight || stripImage.height;
    context = canvas.getContext("2d");
    width = 0;

    for (index = 0; index < tokens.length; index += 1) {
      sourceIndex = glyphMap[tokens[index]];
      if (typeof sourceIndex !== "number") {
        sourceIndex = 0;
      }

      context.drawImage(
        stripImage,
        offsets[sourceIndex],
        0,
        layout.widths[sourceIndex],
        canvas.height,
        width,
        0,
        layout.widths[sourceIndex],
        canvas.height
      );
      width += layout.widths[sourceIndex];
    }

    if (trailingPadding > 0 && tokens.length) {
      context.drawImage(
        stripImage,
        offsets[sourceIndex] + layout.widths[sourceIndex],
        0,
        trailingPadding,
        canvas.height,
        width,
        0,
        trailingPadding,
        canvas.height
      );
    }

    if (config.ft > 0) {
      canvas = buildFramedCanvas(canvas, config.frgb, config.ft);
    }

    return canvas;
  }

  function loadStripLayout(stripSrc, basePath) {
    var metaAsset = deriveMetaAsset(stripSrc);
    var key = metaAsset + "|" + basePath;

    if (layoutCache[key]) {
      return layoutCache[key];
    }

    layoutCache[key] = loadJsonAsset(resolveAssetUrl(metaAsset, basePath))
      .then(function (metadata) {
        var parsed = parseStripMetadata(metadata);

        if (!parsed) {
          throw new Error("Unable to parse strip metadata.");
        }

        return parsed;
      });

    return layoutCache[key];
  }

  function loadStripImage(stripSrc, basePath) {
    var assetUrl = resolveAssetUrl(stripSrc, basePath);

    if (imageCache[assetUrl]) {
      return imageCache[assetUrl];
    }

    imageCache[assetUrl] = new Promise(function (resolve, reject) {
      var image = new Image();

      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("Unable to load counter strip image."));
      };
      image.src = assetUrl;
    });

    return imageCache[assetUrl];
  }

  function normalizePayload(payload) {
    var raw = payload && payload.rawParams ? payload.rawParams : {};
    var legacy = payload && payload.legacyOptions ? payload.legacyOptions : {};
    var normalized = payload && payload.normalized ? payload.normalized : {};
    var strip = firstNonEmpty(
      scalarValue(normalized.strip),
      scalarValue(raw.strip),
      scalarValue(legacy.dd),
      "counter-strip"
    );

    return {
      count: clampInteger(payload && payload.count, 0, 999999999, 0),
      strip: normalizeStripName(strip),
      stripSrc: firstNonEmpty(scalarValue(normalized.stripSrc), stripSourceFor(strip)),
      digits: clampInteger(firstNonEmpty(scalarValue(normalized.digits), scalarValue(raw.digits), "4"), 1, 12, 4),
      comma: parseLegacyBool(firstNonEmpty(scalarValue(legacy.comma), scalarValue(raw.comma), "1"), true),
      frgb: normalizeHex(firstNonEmpty(scalarValue(legacy.frgb), scalarValue(raw.frgb), "#000066")),
      ft: clampInteger(firstNonEmpty(scalarValue(legacy.ft), scalarValue(raw.ft), "0"), 0, 6, 0),
      text: firstNonEmpty(scalarValue(normalized.text), scalarValue(raw.text), ""),
      displayText: firstNonEmpty(scalarValue(normalized.displayText), "")
    };
  }

  function resolveTarget(target) {
    if (!target) {
      return null;
    }
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    return target;
  }

  function getBasePath(endpoint) {
    return String(endpoint || "").replace(/[^/]*$/, "");
  }

  function resolveAssetUrl(asset, basePath) {
    return new URL(asset, window.location.href.replace(/[^/]*$/, "") + basePath).href;
  }

  function buildUrl(endpoint, params) {
    var search = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] === undefined || params[key] === null || params[key] === "") {
        return;
      }
      search.set(key, String(params[key]));
    });
    return endpoint + "?" + search.toString();
  }

  function copyObject(source) {
    var result = {};
    Object.keys(source || {}).forEach(function (key) {
      result[key] = source[key];
    });
    return result;
  }

  function normalizeStripName(value) {
    var strip = String(value || "").split("|")[0].trim();

    if (!strip) {
      return "counter-strip";
    }

    return strip.replace(/\.gif$/i, "");
  }

  function stripSourceFor(stripName) {
    return normalizeStripName(stripName) + ".gif";
  }

  function deriveMetaAsset(stripSrc) {
    var source = String(stripSrc || "counter-strip.gif");
    return source.replace(/\.gif$/i, ".meta.json");
  }

  function loadJsonAsset(assetUrl) {
    if (window.fetch) {
      return window.fetch(assetUrl, { cache: "no-store" }).then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load strip metadata.");
        }
        return response.json();
      });
    }

    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest();

      request.open("GET", assetUrl, true);
      request.onreadystatechange = function () {
        var parsed;

        if (request.readyState !== 4) {
          return;
        }

        if (request.status < 200 || request.status >= 300) {
          reject(new Error("Unable to load strip metadata."));
          return;
        }

        try {
          parsed = JSON.parse(request.responseText);
        } catch (error) {
          reject(new Error("Unable to parse strip metadata."));
          return;
        }

        resolve(parsed);
      };
      request.onerror = function () {
        reject(new Error("Unable to load strip metadata."));
      };
      request.send(null);
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

  function formatCount(value, digits, useComma) {
    var text = String(Math.max(0, clampInteger(value, 0, 999999999, 0)));
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

  function getGlyphMap(layout) {
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

  function buildFramedCanvas(sourceCanvas, hexColor, thickness) {
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

  function parseLegacyBool(value, defaultValue) {
    var text = String(value || "").trim().toUpperCase();
    if (!text) {
      return defaultValue;
    }
    if (text === "T" || text === "TRUE" || text === "1" || text === "Y") {
      return true;
    }
    if (text === "F" || text === "FALSE" || text === "0" || text === "N") {
      return false;
    }
    return defaultValue;
  }

  function normalizeHex(value) {
    var text = String(value || "").trim();
    if (/^[0-9a-f]{6}$/i.test(text)) {
      return "#" + text.toLowerCase();
    }
    if (!/^#[0-9a-f]{6}$/i.test(text)) {
      return "#000066";
    }
    return text.toLowerCase();
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

  function firstNonEmpty() {
    var index;
    var value;

    for (index = 0; index < arguments.length; index += 1) {
      value = arguments[index];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return "";
  }

  function scalarValue(value) {
    if (Array.isArray(value)) {
      return value.length ? value[value.length - 1] : "";
    }
    return value;
  }
}());
