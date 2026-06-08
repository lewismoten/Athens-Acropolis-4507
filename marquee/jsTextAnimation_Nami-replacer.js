(function () {
  var APPLET_CODE = "jstextanimation_nami.class";
  var REQUIRED_MODES = ["stars", "rain", "snow"];
  var MODE_SCRIPT_PATHS = {
    stars: "modes/stars.js",
    rain: "modes/rain.js",
    snow: "modes/snow.js"
  };
  var FONT_NAME_MAP = {
    timesroman: '"Times New Roman", Times, serif',
    timesnewroman: '"Times New Roman", Times, serif',
    helvetica: "Helvetica, Arial, sans-serif",
    arial: "Arial, Helvetica, sans-serif",
    courier: '"Courier New", Courier, monospace',
    couriernew: '"Courier New", Courier, monospace',
    dialog: '"Times New Roman", Times, serif',
    dialoginput: '"Courier New", Courier, monospace',
    monospaced: '"Courier New", Courier, monospace',
    serif: "serif",
    sansserif: "sans-serif",
    sanserif: "sans-serif"
  };
  var IMAGE_PLACEMENT_MAP = {
    image_tile: "tile",
    image_center_center: "center",
    image_left_top: "top-left",
    image_center_top: "top-center",
    image_right_top: "top-right",
    image_left_center: "left-center",
    image_right_center: "right-center",
    image_left_bottom: "bottom-left",
    image_center_bottom: "bottom-center",
    image_right_bottom: "bottom-right",
    image_fit: "fit",
    image_xy: "xy",
    image_xyxlyl: "xy-size"
  };

  var api = {
    init: init,
    replaceAll: replaceAll,
    replaceApplet: replaceApplet,
    buildOptionsFromApplet: buildOptionsFromApplet
  };

  window.ShoomiColorMarqueeAppletReplacer = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }

  function autoInit() {
    init().catch(function () {
      // Keep the original applet markup in place if replacement fails.
    });
  }

  function init(root) {
    return ensureDependencies().then(function () {
      return replaceAll(root || document);
    });
  }

  function replaceAll(root) {
    var applets = findTargetApplets(root || document);
    var instances = [];
    var index;

    for (index = 0; index < applets.length; index += 1) {
      instances.push(replaceApplet(applets[index]));
    }

    return instances;
  }

  function replaceApplet(applet) {
    var marqueeApi = window.ShoomiColorMarquee;
    var options;
    var wrapper;
    var canvas;
    var instance;
    var align;

    if (!applet || applet.getAttribute("data-shoomi-replaced") === "1" || !marqueeApi) {
      return null;
    }

    options = buildOptionsFromApplet(applet);
    wrapper = document.createElement("div");
    canvas = document.createElement("canvas");
    align = String(applet.getAttribute("align") || "").toLowerCase();

    wrapper.className = "shoomi-color-marquee-replacement";
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = options.width + "px";
    wrapper.style.height = options.height + "px";
    wrapper.style.verticalAlign = align || "top";

    canvas.width = options.width;
    canvas.height = options.height;
    canvas.style.display = "block";
    canvas.textContent = options.message || "Shoomi's Color Marquee";

    wrapper.appendChild(canvas);

    options.canvas = canvas;
    options.backgroundElement = wrapper;

    applet.setAttribute("data-shoomi-replaced", "1");
    applet.parentNode.replaceChild(wrapper, applet);

    instance = marqueeApi.createCanvasMarquee(options);
    wrapper._shoomiColorMarquee = instance;
    wrapper._shoomiAppletOptions = options;
    return instance;
  }

  function buildOptionsFromApplet(applet) {
    var params = collectAppletParams(applet);
    var width = clampInt(readFirstValue(applet.getAttribute("width"), params.width), 120, 1200, 500);
    var height = clampInt(readFirstValue(applet.getAttribute("height"), params.height), 32, 240, 78);
    var backgroundAction = mapBackgroundAction(readParam(params, "backgroundaction"));
    var backgroundSpeedValue = readParam(params, "backgroundactionspeed", "backgroundspeed");
    var options = {
      width: width,
      height: height,
      message: readParam(params, "message") || "",
      messageFile: readParam(params, "messagefile") || "",
      colors: readParam(params, "colors") || "",
      defaultColor: normalizeColor(readParam(params, "defalutcolor", "defaultcolor"), "#ffaa00"),
      backgroundColor: normalizeColor(readParam(params, "backcolor"), "#000033"),
      backgroundImage: readParam(params, "backgroundimage") || "",
      backgroundImagePlacement: mapImagePlacement(readParam(
        params,
        "drawimagetype",
        "backgroundimagetype",
        "backgroundimageplacement",
        "imageplacement"
      )),
      backgroundImageX: clampInt(readParam(params, "backgroundimagex", "imagex", "drawimagex"), -4000, 4000, 0),
      backgroundImageY: clampInt(readParam(params, "backgroundimagey", "imagey", "drawimagey"), -4000, 4000, 0),
      backgroundImageWidth: clampInt(readParam(params, "backgroundimagewidth", "backgroundimagexl", "imagewidth", "imagexl", "drawimagexl"), 0, 4000, 0),
      backgroundImageHeight: clampInt(readParam(params, "backgroundimageheight", "backgroundimageyl", "imageheight", "imageyl", "drawimageyl"), 0, 4000, 0),
      backgroundMode: backgroundAction.mode,
      dotColor: normalizeColor(readParam(params, "backgrounddotcolor"), "#9999ff"),
      dotCount: backgroundAction.none ? 0 : clampInt(readParam(params, "backgrounddotnum"), 0, 9999, 50),
      dotSpeed: toDotSpeed(clampInt(backgroundSpeedValue, -30, 30, 3)),
      waveHeight: clampInt(readParam(params, "namiheight"), 0, 24, 8),
      fontName: mapFontName(readParam(params, "fontname")),
      fontSize: clampInt(readParam(params, "fontsize"), 10, 72, 29),
      fontStyle: String(clampInt(readParam(params, "fontstyle"), 0, 3, 2)),
      fps: clampInt(readParam(params, "speed"), 1, 120, 20),
      displayFrames: clampInt(readParam(params, "displaytime"), 1, 999, 100),
      imageFiles: readParam(params, "imagefiles") || ""
    };

    return options;
  }

  function collectAppletParams(applet) {
    var params = {};
    var nodes = applet ? applet.getElementsByTagName("param") : [];
    var index;
    var node;
    var name;
    var value;

    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      name = String(node.getAttribute("name") || "").replace(/\s+/g, "").toLowerCase();
      value = node.getAttribute("value");

      if (!name) {
        continue;
      }

      params[name] = value;
    }

    return params;
  }

  function readParam(params) {
    var index;
    var key;

    for (index = 1; index < arguments.length; index += 1) {
      key = String(arguments[index] || "").replace(/\s+/g, "").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        return params[key];
      }
    }

    return "";
  }

  function readFirstValue(primary, secondary) {
    return primary || secondary || "";
  }

  function mapFontName(value) {
    var key = String(value || "").replace(/[^a-z]/gi, "").toLowerCase();

    if (!key) {
      return '"Times New Roman", Times, serif';
    }

    return FONT_NAME_MAP[key] || value || '"Times New Roman", Times, serif';
  }

  function mapBackgroundAction(value) {
    var normalized = String(value || "").trim().toLowerCase();
    var numeric = parseInt(normalized, 10);

    if (normalized === "none" || normalized === "no_action" || numeric === 0) {
      return {
        mode: "stars",
        none: true
      };
    }

    if (normalized === "ame" || normalized === "rain" || numeric === 1) {
      return {
        mode: "rain",
        none: false
      };
    }

    if (normalized === "yuki" || normalized === "snow" || numeric === 2) {
      return {
        mode: "snow",
        none: false
      };
    }

    if (normalized === "hoshi" || normalized === "stars" || numeric === 3) {
      return {
        mode: "stars",
        none: false
      };
    }

    return {
      mode: "stars",
      none: false
    };
  }

  function mapImagePlacement(value) {
    var key = String(value || "").trim().toLowerCase();

    if (!key) {
      return "center";
    }

    key = key.replace(/[^a-z0-9]+/g, "_");
    return IMAGE_PLACEMENT_MAP[key] || "center";
  }

  function normalizeColor(value, fallback) {
    var text = String(value || "").trim();

    if (!text) {
      return fallback;
    }

    if (/^[0-9a-f]{6}$/i.test(text)) {
      return "#" + text;
    }

    if (/^#[0-9a-f]{6}$/i.test(text)) {
      return text;
    }

    return fallback;
  }

  function clampInt(value, min, max, fallback) {
    var parsed = parseInt(value, 10);

    if (!isFinite(parsed)) {
      parsed = fallback;
    }

    if (parsed < min) {
      return min;
    }

    if (parsed > max) {
      return max;
    }

    return parsed;
  }

  function toDotSpeed(backgroundSpeed) {
    return Number(backgroundSpeed || 0) * 0.06;
  }

  function findTargetApplets(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = scope.querySelectorAll("applet");
    var matches = [];
    var index;
    var node;
    var code;

    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      code = String(node.getAttribute("code") || "").trim().toLowerCase();

      if (code === APPLET_CODE) {
        matches.push(node);
      }
    }

    return matches;
  }

  function ensureDependencies() {
    return ensureCore().then(ensureRequiredModes);
  }

  function ensureCore() {
    if (window.ShoomiColorMarquee) {
      return Promise.resolve();
    }

    return loadScript(resolveAssetUrl("shoomi-color-marquee.js"));
  }

  function ensureRequiredModes() {
    var marqueeApi = window.ShoomiColorMarquee;
    var pending = [];
    var index;
    var name;

    if (!marqueeApi) {
      return Promise.reject(new Error("ShoomiColorMarquee runtime failed to load."));
    }

    for (index = 0; index < REQUIRED_MODES.length; index += 1) {
      name = REQUIRED_MODES[index];
      if (!marqueeApi.hasMode(name)) {
        pending.push(loadScript(resolveAssetUrl(MODE_SCRIPT_PATHS[name])));
      }
    }

    if (!pending.length) {
      return Promise.resolve();
    }

    return Promise.all(pending);
  }

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var existing = findScript(url);
      var script;

      if (existing) {
        if (existing.getAttribute("data-loaded") === "1") {
          resolve();
          return;
        }

        existing.addEventListener("load", function handleLoad() {
          existing.removeEventListener("load", handleLoad);
          resolve();
        });
        existing.addEventListener("error", function handleError() {
          existing.removeEventListener("error", handleError);
          reject(new Error("Failed to load " + url));
        });
        return;
      }

      script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.addEventListener("load", function () {
        script.setAttribute("data-loaded", "1");
        resolve();
      });
      script.addEventListener("error", function () {
        reject(new Error("Failed to load " + url));
      });
      document.head.appendChild(script);
    });
  }

  function findScript(url) {
    var scripts = document.getElementsByTagName("script");
    var index;

    for (index = 0; index < scripts.length; index += 1) {
      if (scripts[index].src === url) {
        return scripts[index];
      }
    }

    return null;
  }

  function resolveAssetUrl(fileName) {
    var current = document.currentScript || findSelfScript();
    var base;

    if (!current || !current.src) {
      return fileName;
    }

    base = current.src.replace(/[^/]*$/, "");
    return base + fileName;
  }

  function findSelfScript() {
    var scripts = document.getElementsByTagName("script");
    var index;
    var script;

    for (index = scripts.length - 1; index >= 0; index -= 1) {
      script = scripts[index];
      if (/jsTextAnimation_Nami-replacer\.js(?:\?.*)?$/i.test(script.src || "")) {
        return script;
      }
    }

    return null;
  }
}());
