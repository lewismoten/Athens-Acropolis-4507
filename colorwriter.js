(function () {
  var mount = document.getElementById("colorwriter-app");

  if (!mount) {
    return;
  }

  var palettes = {
    Default: buildDefaultPalette(),
    "Web Safe": buildWebSafePalette(),
    Red: buildChannelPalette("red"),
    Green: buildChannelPalette("green"),
    Blue: buildChannelPalette("blue")
  };
  var state = {
    paletteName: "Default",
    palette: palettes.Default,
    text: "Welcome, and thanks for visiting my page!",
    output: [],
    editing: false,
    currentIndex: 0,
    currentColor: "D71201",
    windowMode: "normal",
    restoreRect: {
      left: 24,
      top: 24,
      width: 456,
      height: 314
    },
    browserRect: {
      left: 500,
      top: 54
    },
    previewBackground: "FFFFFF",
    zIndexSeed: 3
  };

  mount.innerHTML = [
    '<div id="cw-desktop" style="position:relative; min-height:100vh; overflow:hidden;">',
    '  <div id="cw-window" style="position:absolute; left:24px; top:24px; width:456px; height:314px; min-width:430px; min-height:290px; resize:both; overflow:hidden; z-index:2; font:12px \'MS Sans Serif\', Geneva, sans-serif; color:#000000; border:2px solid #d4d0c8; border-right-color:#000000; border-bottom-color:#000000; background:#d4d0c8; box-sizing:border-box;">',
    '    <div id="cw-titlebar" style="height:20px; background:linear-gradient(90deg, #0000aa, #2e58ff); color:#ffffff; display:flex; align-items:center; justify-content:space-between; padding:0 3px 0 6px; box-sizing:border-box; cursor:move; user-select:none;">',
    '      <span style="display:flex; align-items:center; gap:4px; font-weight:bold;">',
    '        <span style="width:14px; height:14px; border:1px solid #ffffff; border-right-color:#333333; border-bottom-color:#333333; background:linear-gradient(135deg, #ffffff 0 28%, #cc0000 28% 52%, #0000cc 52% 100%); box-sizing:border-box;"></span>',
    '        <span>&lt;FONT&gt; Editor</span>',
    '      </span>',
    '      <span style="display:flex; gap:2px;">',
    '        <button id="cw-minimize" type="button" style="width:16px; height:14px; padding:0; text-align:center; line-height:12px; border:1px solid #ffffff; border-right-color:#555555; border-bottom-color:#555555; background:#d4d0c8; color:#000000; font:11px \'MS Sans Serif\', Geneva, sans-serif;">_</button>',
    '        <button id="cw-maximize" type="button" style="width:16px; height:14px; padding:0; text-align:center; line-height:12px; border:1px solid #ffffff; border-right-color:#555555; border-bottom-color:#555555; background:#d4d0c8; color:#000000; font:11px \'MS Sans Serif\', Geneva, sans-serif;">[]</button>',
    '        <button id="cw-close" type="button" style="width:16px; height:14px; padding:0; text-align:center; line-height:12px; border:1px solid #ffffff; border-right-color:#555555; border-bottom-color:#555555; background:#d4d0c8; color:#000000; font:11px \'MS Sans Serif\', Geneva, sans-serif;">X</button>',
    "      </span>",
    "    </div>",
    '    <div id="cw-content" style="height:calc(100% - 20px); padding:8px; box-sizing:border-box; display:flex; flex-direction:column;">',
    '      <div style="display:flex; gap:8px; align-items:flex-start;">',
    '        <fieldset style="width:84px; margin:0; padding:6px; border:2px groove #d4d0c8; box-sizing:border-box;">',
    '          <legend style="padding:0 4px;">Palette</legend>',
    '          <label style="display:block; white-space:nowrap;"><input type="radio" name="palette" value="Default" checked> Default</label>',
    '          <label style="display:block; white-space:nowrap;"><input type="radio" name="palette" value="Web Safe"> Web Safe</label>',
    '          <label style="display:block; white-space:nowrap;"><input type="radio" name="palette" value="Red"> Red</label>',
    '          <label style="display:block; white-space:nowrap;"><input type="radio" name="palette" value="Green"> Green</label>',
    '          <label style="display:block; white-space:nowrap;"><input type="radio" name="palette" value="Blue"> Blue</label>',
    "        </fieldset>",
    '        <canvas id="cw-palette" width="44" height="98" style="border:2px inset #d4d0c8; cursor:crosshair; image-rendering:pixelated; box-sizing:border-box;"></canvas>',
    '        <div style="flex:1; min-width:0;">',
    '          <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">',
    '            <div id="cw-swatch" style="width:54px; height:24px; border:2px inset #d4d0c8; background:#d71201; box-sizing:border-box;"></div>',
    '            <input id="cw-hex" type="text" value="D71201" maxlength="6" style="width:56px; border:2px inset #d4d0c8; font:14px \'Courier New\', monospace; padding:2px 4px; box-sizing:border-box;">',
    '            <div id="cw-live-preview" style="flex:1; min-width:0; height:24px; border:2px inset #d4d0c8; background:#000000; color:#0000cc; display:flex; align-items:center; padding:0 6px; box-sizing:border-box; font:12px \'Courier New\', monospace; white-space:nowrap; overflow:hidden;">shoomi@mindless.com</div>',
    "          </div>",
    '          <div style="display:flex; gap:10px; margin-bottom:6px; white-space:nowrap;">',
    '            <div>Total Letters: <input id="cw-total" type="text" value="0" readonly style="width:26px; border:2px inset #d4d0c8; padding:1px 2px; box-sizing:border-box;"></div>',
    '            <div>Letter # <input id="cw-letter-number" type="text" value="0" readonly style="width:26px; border:2px inset #d4d0c8; padding:1px 2px; box-sizing:border-box;"></div>',
    '            <div>Letter: <input id="cw-letter" type="text" value="" readonly style="width:22px; border:2px inset #d4d0c8; padding:1px 2px; box-sizing:border-box;"></div>',
    "          </div>",
    '          <input id="cw-text" type="text" style="width:100%; box-sizing:border-box; border:2px inset #d4d0c8; padding:2px 4px; margin-bottom:8px;" value="Welcome, and thanks for visiting my page!">',
    '          <div style="display:flex; gap:10px; align-items:center;">',
    '            <button id="cw-start" style="width:92px; white-space:nowrap;">Start Editing</button>',
    '            <button id="cw-clear" style="width:72px;">Clear</button>',
    '            <button id="cw-exit" style="width:72px; margin-left:auto; box-sizing:border-box;">Exit</button>',
    "          </div>",
    "        </div>",
    "      </div>",
    '      <div style="margin-top:8px; border:2px inset #d4d0c8; background:#ffffff; flex:1; min-height:0;">',
    '        <textarea id="cw-output" style="width:100%; height:100%; box-sizing:border-box; border:0; resize:none; font:12px \'Courier New\', monospace; padding:4px;"></textarea>',
    "      </div>",
    "    </div>",
    "  </div>",
    '  <div id="cw-browser-window" style="position:absolute; left:500px; top:54px; width:366px; height:282px; min-width:250px; min-height:180px; overflow:hidden; z-index:1; font:12px \'MS Sans Serif\', Geneva, sans-serif; color:#000000; border:2px solid #d4d0c8; border-right-color:#000000; border-bottom-color:#000000; background:#d4d0c8; box-sizing:border-box;">',
    '    <div id="cw-browser-titlebar" style="height:20px; background:linear-gradient(90deg, #7c0000, #d95700); color:#ffffff; display:flex; align-items:center; justify-content:space-between; padding:0 3px 0 6px; box-sizing:border-box; cursor:move; user-select:none;">',
    '      <span style="display:flex; align-items:center; gap:4px; font-weight:bold;">',
    '        <span style="width:14px; height:14px; border:1px solid #ffffff; border-right-color:#333333; border-bottom-color:#333333; background:linear-gradient(180deg, #d7ecff 0 56%, #0b4fbf 56% 100%); box-sizing:border-box; position:relative;"><span style="position:absolute; left:2px; top:2px; width:8px; height:4px; border:1px solid #0b4fbf; background:#ffffff; box-sizing:border-box;"></span></span>',
    '        <span>Preview Browser</span>',
    "      </span>",
    '      <span style="display:flex; gap:2px;">',
    '        <button type="button" id="cw-browser-close" style="width:16px; height:14px; padding:0; text-align:center; line-height:12px; border:1px solid #ffffff; border-right-color:#555555; border-bottom-color:#555555; background:#d4d0c8; color:#000000; font:11px \'MS Sans Serif\', Geneva, sans-serif;">X</button>',
    "      </span>",
    "    </div>",
    '    <div style="height:calc(100% - 20px); display:flex; flex-direction:column; box-sizing:border-box;">',
    '      <div style="padding:4px; border-bottom:1px solid #808080; background:#d4d0c8;">',
    '        <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px; white-space:nowrap;">',
    '          <span>BG</span>',
    '          <button type="button" class="cw-browser-swatch" data-color="FFFFFF" title="White" style="width:16px; height:16px; padding:0; border:2px outset #d4d0c8; background:#ffffff;"></button>',
    '          <button type="button" class="cw-browser-swatch" data-color="000000" title="Black" style="width:16px; height:16px; padding:0; border:2px outset #d4d0c8; background:#000000;"></button>',
    '          <button type="button" class="cw-browser-swatch" data-color="004F7C" title="Site Blue" style="width:16px; height:16px; padding:0; border:2px outset #d4d0c8; background:#004f7c;"></button>',
    '          <button type="button" class="cw-browser-swatch" data-color="400040" title="Purple" style="width:16px; height:16px; padding:0; border:2px outset #d4d0c8; background:#400040;"></button>',
    '          <button type="button" class="cw-browser-swatch" data-color="C0C0C0" title="Silver" style="width:16px; height:16px; padding:0; border:2px outset #d4d0c8; background:#c0c0c0;"></button>',
    "        </div>",
    '        <div style="display:flex; gap:4px; align-items:center;">',
    '          <span>Address</span>',
    '          <input id="cw-browser-address" type="text" readonly value="about:font-preview" style="flex:1; min-width:0; border:2px inset #d4d0c8; padding:1px 4px; box-sizing:border-box; background:#ffffff;">',
    "        </div>",
    "      </div>",
    '      <div style="flex:1; min-height:0; background:#808080; padding:3px; box-sizing:border-box;">',
    '        <iframe id="cw-browser-frame" title="Color Writer Preview" style="display:block; width:100%; height:100%; border:2px inset #d4d0c8; background:#ffffff; box-sizing:border-box;"></iframe>',
    "      </div>",
    '      <div id="cw-browser-status" style="height:18px; border-top:1px solid #808080; padding:2px 6px; box-sizing:border-box; background:#d4d0c8; white-space:nowrap; overflow:hidden;">Rendering old-school HTML...</div>',
    "    </div>",
    "  </div>",
    '  <div id="cw-minimized" style="display:none; position:absolute; left:8px; bottom:8px; width:220px; border:2px solid #d4d0c8; border-right-color:#000000; border-bottom-color:#000000; background:#d4d0c8; box-sizing:border-box;">',
    '    <div id="cw-minimized-titlebar" style="height:20px; background:linear-gradient(90deg, #0000aa, #2e58ff); color:#ffffff; display:flex; align-items:center; justify-content:space-between; padding:0 3px 0 6px; box-sizing:border-box;">',
    '      <span style="display:flex; align-items:center; gap:4px; font-weight:bold;">',
    '        <span style="width:14px; height:14px; border:1px solid #ffffff; border-right-color:#333333; border-bottom-color:#333333; background:linear-gradient(135deg, #ffffff 0 28%, #cc0000 28% 52%, #0000cc 52% 100%); box-sizing:border-box;"></span>',
    '        <span>&lt;FONT&gt; Editor</span>',
    '      </span>',
    '      <span style="display:flex; gap:2px;">',
    '        <button id="cw-restore" type="button" style="width:16px; height:14px; padding:0; text-align:center; line-height:12px; border:1px solid #ffffff; border-right-color:#555555; border-bottom-color:#555555; background:#d4d0c8; color:#000000; font:11px \'MS Sans Serif\', Geneva, sans-serif;">[]</button>',
    '        <button id="cw-minimized-close" type="button" style="width:16px; height:14px; padding:0; text-align:center; line-height:12px; border:1px solid #ffffff; border-right-color:#555555; border-bottom-color:#555555; background:#d4d0c8; color:#000000; font:11px \'MS Sans Serif\', Geneva, sans-serif;">X</button>',
    "      </span>",
    "    </div>",
    "  </div>",
    "</div>"
  ].join("");

  var desktop = document.getElementById("cw-desktop");
  var windowEl = document.getElementById("cw-window");
  var titlebar = document.getElementById("cw-titlebar");
  var browserWindowEl = document.getElementById("cw-browser-window");
  var browserTitlebar = document.getElementById("cw-browser-titlebar");
  var browserFrame = document.getElementById("cw-browser-frame");
  var browserStatus = document.getElementById("cw-browser-status");
  var browserCloseButton = document.getElementById("cw-browser-close");
  var browserSwatches = document.getElementsByClassName("cw-browser-swatch");
  var minimizedEl = document.getElementById("cw-minimized");
  var paletteCanvas = document.getElementById("cw-palette");
  var paletteContext = paletteCanvas.getContext("2d");
  var swatch = document.getElementById("cw-swatch");
  var hexInput = document.getElementById("cw-hex");
  var livePreview = document.getElementById("cw-live-preview");
  var totalInput = document.getElementById("cw-total");
  var letterNumberInput = document.getElementById("cw-letter-number");
  var letterInput = document.getElementById("cw-letter");
  var textInput = document.getElementById("cw-text");
  var outputArea = document.getElementById("cw-output");
  var startButton = document.getElementById("cw-start");
  var clearButton = document.getElementById("cw-clear");
  var exitButton = document.getElementById("cw-exit");
  var closeButton = document.getElementById("cw-close");
  var minimizeButton = document.getElementById("cw-minimize");
  var maximizeButton = document.getElementById("cw-maximize");
  var restoreButton = document.getElementById("cw-restore");
  var minimizedCloseButton = document.getElementById("cw-minimized-close");
  var paletteRadios = document.getElementsByName("palette");
  var dragState = null;

  for (var radioIndex = 0; radioIndex < paletteRadios.length; radioIndex += 1) {
    paletteRadios[radioIndex].addEventListener("change", onPaletteChange);
  }

  paletteCanvas.addEventListener("click", onPalettePick);
  startButton.addEventListener("click", toggleEditing);
  clearButton.addEventListener("click", clearEditing);
  exitButton.addEventListener("click", goToGoodies);
  closeButton.addEventListener("click", goToGoodies);
  minimizedCloseButton.addEventListener("click", goToGoodies);
  minimizeButton.addEventListener("click", minimizeWindow);
  maximizeButton.addEventListener("click", toggleMaximize);
  restoreButton.addEventListener("click", restoreWindow);
  browserCloseButton.addEventListener("click", function () {
    browserWindowEl.style.display = "none";
  });
  for (radioIndex = 0; radioIndex < browserSwatches.length; radioIndex += 1) {
    browserSwatches[radioIndex].addEventListener("click", onPreviewBackgroundPick);
  }
  titlebar.addEventListener("mousedown", startEditorDrag);
  browserTitlebar.addEventListener("mousedown", startBrowserDrag);
  windowEl.addEventListener("mousedown", function () {
    bringToFront(windowEl);
  });
  browserWindowEl.addEventListener("mousedown", function () {
    bringToFront(browserWindowEl);
  });
  document.addEventListener("mousemove", dragWindow);
  document.addEventListener("mouseup", stopDrag);
  textInput.addEventListener("input", onTextChange);
  hexInput.addEventListener("input", onHexInput);

  browserWindowEl.style.left = state.browserRect.left + "px";
  browserWindowEl.style.top = state.browserRect.top + "px";
  drawPalette();
  refreshUi();

  function onPaletteChange(event) {
    state.paletteName = event.target.value;
    state.palette = palettes[state.paletteName];
    state.currentColor = state.palette.colors[0];
    drawPalette();
    refreshUi();
  }

  function onPalettePick(event) {
    var rect = paletteCanvas.getBoundingClientRect();
    var x = Math.max(0, Math.min(paletteCanvas.width - 1, Math.floor(event.clientX - rect.left)));
    var y = Math.max(0, Math.min(paletteCanvas.height - 1, Math.floor(event.clientY - rect.top)));
    var columnWidth = paletteCanvas.width / state.palette.columns;
    var rowHeight = paletteCanvas.height / state.palette.rows;
    var column = Math.max(0, Math.min(state.palette.columns - 1, Math.floor(x / columnWidth)));
    var row = Math.max(0, Math.min(state.palette.rows - 1, Math.floor(y / rowHeight)));
    var color = state.palette.matrix[row][column];

    applyCurrentColor(color);
    refreshUi();

    if (state.editing) {
      assignColorToCurrentLetter(color);
    }
  }

  function toggleEditing() {
    if (state.editing) {
      state.editing = false;
      refreshUi();
      return;
    }

    state.text = textInput.value;
    if (!state.output.length || state.currentIndex >= state.text.length) {
      state.output = [];
      state.currentIndex = 0;
    }
    state.editing = true;
    assignSpacesUntilLetter();
    refreshUi();
  }

  function clearEditing() {
    state.output = [];
    state.currentIndex = 0;
    state.editing = false;
    refreshUi();
  }

  function goToGoodies() {
    window.location.href = "goodies.html";
  }

  function onTextChange() {
    state.text = textInput.value;
    if (!state.editing) {
      refreshUi();
    }
  }

  function onHexInput() {
    var cleaned = normalizeHex(hexInput.value);
    if (!cleaned) {
      return;
    }

    applyCurrentColor(cleaned);
    refreshUi();
  }

  function assignColorToCurrentLetter(color) {
    var text = textInput.value;
    if (state.currentIndex >= text.length) {
      state.editing = false;
      refreshUi();
      return;
    }

    state.output[state.currentIndex] = wrapFontColor(text.charAt(state.currentIndex), color);
    state.currentIndex += 1;
    assignSpacesUntilLetter();
    if (state.currentIndex >= text.length) {
      state.editing = false;
    }
    refreshUi();
  }

  function assignSpacesUntilLetter() {
    var text = textInput.value;

    while (state.currentIndex < text.length && text.charAt(state.currentIndex) === " ") {
      state.output[state.currentIndex] = " ";
      state.currentIndex += 1;
    }
  }

  function applyCurrentColor(color) {
    state.currentColor = normalizeHex(color) || state.currentColor;
  }

  function refreshUi() {
    var text = textInput.value;
    var currentLetter = text.charAt(state.currentIndex) || "";
    var drawableCount = countDrawableLetters(text);
    var htmlOutput = state.output.join("");

    totalInput.value = String(drawableCount);
    letterNumberInput.value = currentLetter ? String(countDrawableLetters(text.slice(0, state.currentIndex)) + 1) : "0";
    letterInput.value = currentLetter;
    hexInput.value = state.currentColor;
    swatch.style.background = "#" + state.currentColor;
    livePreview.style.color = "#0000cc";
    livePreview.textContent = "shoomi@mindless.com";
    outputArea.value = htmlOutput;
    startButton.textContent = state.editing ? "Stop Editing" : "Start Editing";
    maximizeButton.textContent = state.windowMode === "maximized" ? "❐" : "[]";
    browserStatus.textContent = htmlOutput ? "Showing rendered <FONT> output" : "Waiting for colored text...";
    refreshBrowserSwatches();
    renderBrowserPreview(htmlOutput, text);
  }

  function onPreviewBackgroundPick(event) {
    state.previewBackground = event.currentTarget.getAttribute("data-color") || state.previewBackground;
    refreshUi();
  }

  function startEditorDrag(event) {
    if (state.windowMode !== "normal") {
      return;
    }

    startDrag(event, windowEl, null);
  }

  function startBrowserDrag(event) {
    startDrag(event, browserWindowEl, function (left, top) {
      state.browserRect.left = left;
      state.browserRect.top = top;
    });
  }

  function startDrag(event, element, onMove) {
    bringToFront(element);

    if (event.target.tagName === "BUTTON" || event.target.tagName === "INPUT") {
      return;
    }

    dragState = {
      startX: event.clientX,
      startY: event.clientY,
      left: element.offsetLeft,
      top: element.offsetTop,
      element: element,
      onMove: onMove
    };
  }

  function dragWindow(event) {
    var maxLeft;
    var maxTop;
    var nextLeft;
    var nextTop;

    if (!dragState) {
      return;
    }

    maxLeft = Math.max(0, desktop.clientWidth - dragState.element.offsetWidth);
    maxTop = Math.max(0, desktop.clientHeight - dragState.element.offsetHeight);
    nextLeft = dragState.left + (event.clientX - dragState.startX);
    nextTop = dragState.top + (event.clientY - dragState.startY);

    nextLeft = Math.max(0, Math.min(maxLeft, nextLeft));
    nextTop = Math.max(0, Math.min(maxTop, nextTop));

    dragState.element.style.left = nextLeft + "px";
    dragState.element.style.top = nextTop + "px";
    if (dragState.onMove) {
      dragState.onMove(nextLeft, nextTop);
    }
  }

  function stopDrag() {
    dragState = null;
  }

  function minimizeWindow() {
    if (state.windowMode === "minimized") {
      return;
    }

    rememberWindowRect();
    state.windowMode = "minimized";
    windowEl.style.display = "none";
    minimizedEl.style.display = "block";
    refreshUi();
  }

  function restoreWindow() {
    state.windowMode = "normal";
    minimizedEl.style.display = "none";
    windowEl.style.display = "block";
    applyRestoreRect();
    refreshUi();
  }

  function toggleMaximize() {
    if (state.windowMode === "minimized") {
      restoreWindow();
    }

    if (state.windowMode === "maximized") {
      state.windowMode = "normal";
      applyRestoreRect();
      refreshUi();
      return;
    }

    rememberWindowRect();
    state.windowMode = "maximized";
    windowEl.style.left = "0px";
    windowEl.style.top = "0px";
    windowEl.style.width = desktop.clientWidth + "px";
    windowEl.style.height = desktop.clientHeight + "px";
    refreshUi();
  }

  function rememberWindowRect() {
    state.restoreRect = {
      left: windowEl.offsetLeft,
      top: windowEl.offsetTop,
      width: windowEl.offsetWidth,
      height: windowEl.offsetHeight
    };
  }

  function applyRestoreRect() {
    windowEl.style.left = state.restoreRect.left + "px";
    windowEl.style.top = state.restoreRect.top + "px";
    windowEl.style.width = state.restoreRect.width + "px";
    windowEl.style.height = state.restoreRect.height + "px";
  }

  function bringToFront(element) {
    state.zIndexSeed += 1;
    element.style.zIndex = String(state.zIndexSeed);
  }

  function renderBrowserPreview(htmlOutput, text) {
    var previewBody = htmlOutput || escapePreviewText(text);
    var frameDocument = browserFrame.contentWindow.document;
    var textColor = pickPreviewTextColor(state.previewBackground);

    frameDocument.open();
    frameDocument.write(
      "<!DOCTYPE html>" +
      "<html><head><title>Preview</title></head>" +
      '<body bgcolor="#' + state.previewBackground + '" text="#' + textColor + '" style="margin:12px; font:16px \'Times New Roman\', serif;">' +
      previewBody +
      "</body></html>"
    );
    frameDocument.close();
  }

  function refreshBrowserSwatches() {
    var index;
    var color;

    for (index = 0; index < browserSwatches.length; index += 1) {
      color = browserSwatches[index].getAttribute("data-color");
      browserSwatches[index].style.borderStyle = color === state.previewBackground ? "inset" : "outset";
    }
  }

  function pickPreviewTextColor(background) {
    var red = parseInt(background.slice(0, 2), 16);
    var green = parseInt(background.slice(2, 4), 16);
    var blue = parseInt(background.slice(4, 6), 16);
    var brightness = (red * 299) + (green * 587) + (blue * 114);

    return brightness >= 140000 ? "000000" : "FFFFFF";
  }

  function escapePreviewText(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function drawPalette() {
    var row;
    var column;
    var cellWidth = paletteCanvas.width / state.palette.columns;
    var cellHeight = paletteCanvas.height / state.palette.rows;

    for (row = 0; row < state.palette.rows; row += 1) {
      for (column = 0; column < state.palette.columns; column += 1) {
        paletteContext.fillStyle = "#" + state.palette.matrix[row][column];
        paletteContext.fillRect(
          Math.floor(column * cellWidth),
          Math.floor(row * cellHeight),
          Math.ceil(cellWidth),
          Math.ceil(cellHeight)
        );
      }
    }

    paletteContext.strokeStyle = "#000000";
    paletteContext.strokeRect(0.5, 0.5, paletteCanvas.width - 1, paletteCanvas.height - 1);
  }

  function wrapFontColor(character, color) {
    return '<FONT COLOR=' + color + '>' + escapeHtml(character) + "</FONT>";
  }

  function countDrawableLetters(text) {
    return text.replace(/ /g, "").length;
  }

  function normalizeHex(value) {
    var cleaned = String(value).replace(/[^0-9a-f]/gi, "").toUpperCase();

    if (cleaned.length < 6) {
      return "";
    }

    return cleaned.slice(0, 6);
  }

  function escapeHtml(character) {
    if (character === "&") {
      return "&amp;";
    }

    if (character === "<") {
      return "&lt;";
    }

    if (character === ">") {
      return "&gt;";
    }

    return character;
  }

  function buildDefaultPalette() {
    var matrix = [];
    var rows = 14;
    var columns = 6;
    var row;
    var column;
    var hue;
    var lightness;

    for (row = 0; row < rows; row += 1) {
      matrix[row] = [];
      lightness = 0.82 - ((row / (rows - 1)) * 0.52);

      for (column = 0; column < columns; column += 1) {
        hue = (column / columns) + ((row % 2) * 0.02);
        matrix[row][column] = rgbToHex(hslToRgb(hue, 0.95, lightness));
      }
    }

    return makePalette(matrix);
  }

  function buildWebSafePalette() {
    return makePalette([
      ["66FFFF", "66FFCC", "66FF66", "CCFF66", "FFCC66", "FF66CC"],
      ["33FFFF", "33FFCC", "33FF66", "99FF33", "FFCC33", "FF33CC"],
      ["00FFFF", "00FFCC", "00FF66", "66FF00", "FFCC00", "FF00CC"],
      ["00CCFF", "00CCCC", "00CC66", "66CC00", "CC9900", "CC00CC"],
      ["0099FF", "0099CC", "009966", "669900", "996600", "990099"],
      ["0066FF", "0066CC", "006666", "666600", "663300", "660066"],
      ["0033FF", "3333FF", "333399", "663333", "993333", "6600CC"],
      ["3333CC", "6633FF", "663399", "993366", "CC6633", "9900FF"],
      ["6633CC", "9933FF", "9933CC", "CC3366", "FF6633", "CC00FF"],
      ["9933CC", "CC33FF", "CC33CC", "FF3366", "FF3333", "FF00FF"],
      ["CC66FF", "FF66FF", "FF66CC", "FF6699", "FF6666", "FF3399"],
      ["999999", "777777", "555555", "333333", "111111", "000000"]
    ]);
  }

  function buildChannelPalette(channel) {
    var matrix = [];
    var rows = 14;
    var columns = 6;
    var row;
    var column;
    var luminance;
    var blend;
    var startRed;
    var startGreen;
    var startBlue;
    var endRed;
    var endGreen;
    var endBlue;
    var red;
    var green;
    var blue;

    for (row = 0; row < rows; row += 1) {
      matrix[row] = [];
      luminance = 255 - Math.round((row / (rows - 1)) * 255);
      startRed = luminance;
      startGreen = luminance;
      startBlue = luminance;
      endRed = channel === "red" ? luminance : 0;
      endGreen = channel === "green" ? luminance : 0;
      endBlue = channel === "blue" ? luminance : 0;

      for (column = 0; column < columns; column += 1) {
        blend = column / (columns - 1);
        red = Math.round(startRed + ((endRed - startRed) * blend));
        green = Math.round(startGreen + ((endGreen - startGreen) * blend));
        blue = Math.round(startBlue + ((endBlue - startBlue) * blend));
        matrix[row][column] = toHex(red) + toHex(green) + toHex(blue);
      }
    }

    return makePalette(matrix);
  }

  function makePalette(matrix) {
    return {
      matrix: matrix,
      rows: matrix.length,
      columns: matrix[0].length,
      colors: flattenPalette({ matrix: matrix })
    };
  }

  function flattenPalette(palette) {
    var colors = [];
    var row;
    var column;

    for (row = 0; row < palette.matrix.length; row += 1) {
      for (column = 0; column < palette.matrix[row].length; column += 1) {
        colors.push(palette.matrix[row][column]);
      }
    }

    return colors;
  }

  function rgbToHex(rgb, webSafe) {
    var red = rgb[0];
    var green = rgb[1];
    var blue = rgb[2];

    if (webSafe) {
      red = snapWebSafe(red);
      green = snapWebSafe(green);
      blue = snapWebSafe(blue);
    }

    return toHex(red) + toHex(green) + toHex(blue);
  }

  function snapWebSafe(value) {
    return Math.max(0, Math.min(255, Math.round(value / 51) * 51));
  }

  function toHex(value) {
    var hex = value.toString(16).toUpperCase();
    return hex.length === 1 ? "0" + hex : hex;
  }

  function hslToRgb(hue, saturation, lightness) {
    var red;
    var green;
    var blue;
    var q;
    var p;

    if (saturation === 0) {
      red = lightness;
      green = lightness;
      blue = lightness;
    } else {
      q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - (lightness * saturation);
      p = (2 * lightness) - q;
      red = hueToRgb(p, q, hue + (1 / 3));
      green = hueToRgb(p, q, hue);
      blue = hueToRgb(p, q, hue - (1 / 3));
    }

    return [
      Math.round(red * 255),
      Math.round(green * 255),
      Math.round(blue * 255)
    ];
  }

  function hueToRgb(p, q, t) {
    var value = t;
    if (value < 0) {
      value += 1;
    }
    if (value > 1) {
      value -= 1;
    }
    if (value < 1 / 6) {
      return p + ((q - p) * 6 * value);
    }
    if (value < 1 / 2) {
      return q;
    }
    if (value < 2 / 3) {
      return p + ((q - p) * ((2 / 3) - value) * 6);
    }
    return p;
  }
}());
