(function () {
  var form = document.getElementById("marquee-form");
  var previewCanvas = document.getElementById("marquee-preview-canvas");
  var previewFrame = document.getElementById("preview-frame");
  var codeOutput = document.getElementById("marquee-code");
  var htmlCodeOutput = document.getElementById("marquee-html-code");
  var generatedFileHeading = document.getElementById("generated-file-heading");
  var copyButton = document.getElementById("copy-code");
  var copyStatus = document.getElementById("copy-status");
  var sequenceGridBody = document.getElementById("sequence-grid-body");
  var rowModal = document.getElementById("row-modal");
  var rowModalForm = document.getElementById("row-modal-form");
  var modalCancel = document.getElementById("modal-cancel");
  var marqueeApi = window.DreamMarquee;
  var previewMarquee;
  var sequenceRows = [];
  var editingRowIndex = -1;
  var modalHistory = [];
  var modalHistoryIndex = -1;
  var modalSelectionStart = 0;
  var modalSelectionEnd = 0;

  if (!form || !previewCanvas || !codeOutput || !htmlCodeOutput || !marqueeApi || !sequenceGridBody || !rowModal || !rowModalForm) {
    return;
  }

  var fields = {
    displayTime: document.getElementById("marquee-display-time"),
    fontSize: document.getElementById("marquee-font-size"),
    width: document.getElementById("marquee-width"),
    height: document.getElementById("marquee-height"),
    waveHeight: document.getElementById("marquee-wave-height"),
    dotCount: document.getElementById("marquee-dot-count"),
    backgroundSpeed: document.getElementById("marquee-background-speed"),
    animationSpeed: document.getElementById("marquee-animation-speed"),
    background: document.getElementById("marquee-background"),
    fileName: document.getElementById("sequence-file-name"),
    defaultColor: document.getElementById("marquee-default-color"),
    dotColor: document.getElementById("marquee-dot-color"),
    fontFamily: document.getElementById("marquee-font-family"),
    fontStyle: document.getElementById("marquee-font-style"),
    modalText: document.getElementById("modal-row-text"),
    modalColors: document.getElementById("modal-row-colors"),
    modalColorTrigger: document.getElementById("modal-color-trigger"),
    modalColorPicker: document.getElementById("modal-row-color-picker"),
    modalUndo: document.getElementById("modal-undo"),
    modalPreview: document.getElementById("modal-row-preview")
  };

  previewMarquee = marqueeApi.createCanvasMarquee({
    canvas: previewCanvas,
    width: 640,
    height: 92,
    backgroundColor: "#000066",
    dotColor: "#9999ff",
    dotCount: 50,
    waveHeight: 8,
    dotSpeed: toDotSpeed(3),
    font: "italic 30px Times New Roman, Times, serif",
    fontHeight: 30,
    fps: 20,
    displayFrames: 100,
    defaultColors: marqueeApi.parseColorList("ffff66"),
    entries: [[">>,<<", "Welcome to Shoomi's marquee maker.", "#ffff66|#ffee88|#ffdd55|#ffee88"]]
  });

  form.addEventListener("input", onFormFieldInput);
  form.addEventListener("change", onFormFieldChange);
  sequenceGridBody.addEventListener("click", onSequenceGridClick);
  sequenceGridBody.addEventListener("input", onSequenceGridInput);
  sequenceGridBody.addEventListener("change", onSequenceGridChange);
  rowModal.addEventListener("click", onModalShellClick);
  rowModalForm.addEventListener("submit", onModalSubmit);
  fields.modalText.addEventListener("input", onModalTextInput);
  fields.modalText.addEventListener("select", onModalSelectionChange);
  fields.modalText.addEventListener("click", onModalSelectionChange);
  fields.modalText.addEventListener("keyup", onModalSelectionChange);
  fields.modalText.addEventListener("keydown", onModalTextKeyDown);

  if (fields.modalPreview) {
    fields.modalPreview.addEventListener("mouseup", onModalPreviewMouseUp);
  }

  if (fields.modalUndo) {
    fields.modalUndo.addEventListener("click", undoModalChange);
  }

  if (fields.modalColorTrigger) {
    fields.modalColorTrigger.addEventListener("mousedown", onModalColorTriggerMouseDown);
    fields.modalColorTrigger.addEventListener("click", onModalColorTriggerClick);
  }

  if (fields.modalColorPicker) {
    fields.modalColorPicker.addEventListener("input", onModalColorPickerInput);
    fields.modalColorPicker.addEventListener("change", onModalColorPickerInput);
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyGeneratedCode);
  }

  if (modalCancel) {
    modalCancel.addEventListener("click", closeRowModal);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !rowModal.hidden) {
      closeRowModal();
    }
  });

  seedDefaultRows();
  updateMarquee();

  function updateMarquee() {
    var config = getPageConfig();
    var rows = getSequenceRows();
    var canvasOptions = getCanvasConfig(config, rows);
    var canvasEntries = buildCanvasEntries(config, rows);

    previewMarquee.setOptions(canvasOptions);
    previewMarquee.setEntries(canvasEntries);

    if (previewFrame) {
      previewFrame.style.minHeight = Math.max(config.height + 38, 130) + "px";
    }
    if (previewCanvas) {
      previewCanvas.style.width = config.width + "px";
      previewCanvas.style.height = config.height + "px";
    }
    updateGeneratedFileHeading();
    renderSequenceGrid(config.background);
    codeOutput.value = buildDreamersScript(config, rows);
    htmlCodeOutput.value = buildCanvasEmbedCode(config, rows);
    copyStatus.textContent = "";
  }

  function onFormFieldInput(event) {
    if (event.target && event.target.closest && event.target.closest("#sequence-grid")) {
      return;
    }

    updateMarquee();
    if (!rowModal.hidden) {
      updateModalEditorPreview();
    }
  }

  function onFormFieldChange(event) {
    if (event.target && event.target.closest && event.target.closest("#sequence-grid")) {
      return;
    }

    updateMarquee();
    if (!rowModal.hidden) {
      updateModalEditorPreview();
    }
  }

  function getPageConfig() {
    var width = marqueeApi.clampNumber(fields.width.value, 120, 1200, 640);
    var height = marqueeApi.clampNumber(fields.height.value, 32, 240, 92);
    var fontSize = marqueeApi.clampNumber(fields.fontSize.value, 10, 72, 30);
    var defaultColor = marqueeApi.normalizeColor(fields.defaultColor.value, "#ffff66");
    var fontStyle = String(fields.fontStyle.value || "0");
    var sequenceCount = sequenceRows.length;

    return {
      sequenceCount: sequenceCount,
      displayTime: marqueeApi.clampNumber(fields.displayTime.value, 1, 999, 100),
      width: width,
      height: height,
      fontSize: fontSize,
      waveHeight: marqueeApi.clampNumber(fields.waveHeight.value, 0, 24, 8),
      dotCount: marqueeApi.clampNumber(fields.dotCount.value, 0, 999, 50),
      backgroundSpeed: marqueeApi.clampNumber(fields.backgroundSpeed.value, 0, 30, 3),
      animationSpeed: marqueeApi.clampNumber(fields.animationSpeed.value, 1, 120, 20),
      background: marqueeApi.normalizeColor(fields.background.value, "#000066"),
      defaultColor: defaultColor,
      dotColor: marqueeApi.normalizeColor(fields.dotColor.value, "#9999ff"),
      fontFamily: (fields.fontFamily.value || "Times New Roman, Times, serif").trim(),
      fontStyle: fontStyle
    };
  }

  function getCanvasConfig(config, rows) {
    var defaultColors = marqueeApi.parseColorList(config.defaultColor);

    return {
      width: config.width,
      height: config.height,
      backgroundColor: config.background,
      dotColor: config.dotColor,
      dotCount: config.dotCount,
      dotSpeed: toDotSpeed(config.backgroundSpeed),
      waveHeight: config.waveHeight,
      font: buildFontDeclaration(config),
      fontHeight: config.fontSize,
      fps: config.animationSpeed,
      displayFrames: config.displayTime,
      defaultColors: defaultColors
    };
  }

  function buildCanvasEntries(config, rows) {
    var entries = [];
    var index;

    for (index = 0; index < rows.length; index += 1) {
      entries.push({
        start: rows[index].start,
        end: rows[index].end,
        text: rows[index].text,
        colors: marqueeApi.parseColorList(rows[index].colors)
      });
    }

    return entries;
  }

  function buildDreamersScript(config, rows) {
    var lines = [String(config.sequenceCount)];
    var index;

    if (rows[0]) {
      lines.push(rows[0].text);
      lines.push(rows[0].colors);
    }

    for (index = 1; index < rows.length; index += 1) {
      lines.push(rows[index].text);
      lines.push(rows[index].colors);
      lines.push(rows[index].start + "," + rows[index].end);
    }

    return lines.join("\n");
  }

  function buildCanvasEmbedCode(config, rows) {
    var defaultColorValues = splitColorPipe(config.defaultColor);
    var optionsConfig = {
      width: config.width,
      height: config.height,
      backgroundColor: config.background,
      dotColor: config.dotColor,
      dotCount: config.dotCount,
      dotSpeed: toDotSpeed(config.backgroundSpeed),
      waveHeight: config.waveHeight,
      font: buildFontDeclaration(config),
      fontHeight: config.fontSize,
      fps: config.animationSpeed,
      displayFrames: config.displayTime,
      defaultColors: defaultColorValues
    };
    var entriesConfig = [];
    var lines = [];
    var index;

    for (index = 0; index < rows.length; index += 1) {
      entriesConfig.push({
        start: rows[index].start,
        end: rows[index].end,
        text: rows[index].text,
        colors: splitColorPipe(rows[index].colors)
      });
    }

    lines.push('<canvas id="dream-marquee" width="' + config.width + '" height="' + config.height + '" style="display:block;">');
    lines.push(escapeForInlineText((rows[0] && rows[0].text) || "Dream marquee"));
    lines.push("</canvas>");
    lines.push('<script src="../dream-marquee.js"><\/script>');
    lines.push("<script>");
    lines.push("(function () {");
    lines.push('  var canvas = document.getElementById("dream-marquee");');
    lines.push("  var marqueeApi = window.DreamMarquee;");
    lines.push("  var marqueeOptions = " + stringifyForCode(optionsConfig, 2) + ";");
    lines.push("  var marqueeEntries = " + stringifyForCode(entriesConfig, 2) + ";");
    lines.push("");
    lines.push("  if (!canvas || !canvas.getContext || !marqueeApi) {");
    lines.push("    return;");
    lines.push("  }");
    lines.push("");
    lines.push("  marqueeOptions.canvas = canvas;");
    lines.push("  marqueeOptions.defaultColors = marqueeApi.parseColorList(marqueeOptions.defaultColors.join(\"|\"));");
    lines.push("  marqueeOptions.entries = marqueeEntries.map(function (entry) {");
    lines.push("    return marqueeApi.createEntry(entry.start + \",\" + entry.end, entry.text, entry.colors.join(\"|\"), {");
    lines.push("      defaultColors: marqueeOptions.defaultColors");
    lines.push("    });");
    lines.push("  });");
    lines.push("");
    lines.push("  marqueeApi.createCanvasMarquee(marqueeOptions);");
    lines.push("}());");
    lines.push("<\/script>");

    return lines.join("\n");
  }

  function seedDefaultRows() {
    sequenceRows = [{
      start: ">>",
      end: ">>",
      text: "Shoomi's HomePage",
      colors: "0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|000099|000088|000000|000088|000099|0000aa|0000bb|0000cc|0000dd|0000ee|0000ff|"
    }, {
      start: ">>",
      end: ">>",
      text: "The beginning of all dreams",
      colors: "880000|990000|aa0000|bb0000|cc0000|dd0000|ee0000|ff0000|ee0000|dd0000|cc0000|bb0000|aa0000|990000|880000|990000|aa0000|bb0000|cc0000|dd0000|ee0000|0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|"
    }, {
      start: "<<",
      end: "<<",
      text: "Located in GeoCities",
      colors: "00ff00|00ee00|00dd00|00cc00|00bb00|00aa00|009900|008800|009900|00aa00|00bb00|00cc00|00dd00|00ee00|00ff00|00ee00|00dd00|00cc00|00bb00|00aa00|"
    }, {
      start: "^^",
      end: "<>",
      text: "/Athens/Acropolis/4507/",
      colors: "00ff00|eeee00|dddd00|cccc00|bbbb00|aaaa00|999900|008800|999900|aaaa00|bbbb00|cccc00|dddd00|eeee00|ffff00|eeee00|dddd00|00cc00|bbbb00|aaaa00|999900|888800|009900|"
    }, {
      start: "VV",
      end: "<>",
      text: "Get your FREE homepage now!",
      colors: "880088|990099|aa00aa|bb00bb|cc00cc|dd00dd|ee00ee|ff00ff|ee00ee|00dddd|00cccc|00bbbb|00aaaa|009999|880088|990099|aa00aa|bb00bb|cc00cc|dd00dd|ee00ee|ff00ff|ee00ee|dd00dd|cc00cc|bb00bb|aa00aa|990099|880088|990099|aa00aa|bb00bb|cc00cc|"
    }, {
      start: "<<",
      end: "<<",
      text: "http://www.geocities.com",
      colors: "aaaaaa|bbbbbb|cccccc|dddddd|eeeeee|ffffff|eeeeee|dddddd|cccccc|bbbbbb|aaaaaa|999999|888888|999999|aaaaaa|bbbbbb|cccccc|dddddd|eeeeee|ffffff|eeeeee|dddddd|cccccc|bbbbbb|aaaaaa|999999|888888|999999|aaaaaa|bbbbbb|"
    }, {
      start: "<<",
      end: ">>",
      text: "sweet dreams!",
      colors: "0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|000099|000088|000088|000099|0000aa|0000bb|0000cc|0000dd|0000ee|0000ff|0000ee|0000dd|0000cc|"
    }];
  }

  function getSequenceRows() {
    return sequenceRows.slice(0);
  }

  function renderSequenceGrid(backgroundColor) {
    var html = "";
    var index;
    var row;
    var resolvedBackground = backgroundColor || "#000066";

    for (index = 0; index < sequenceRows.length; index += 1) {
      row = sequenceRows[index];
      html += [
        "<tr>",
        '<td><div class="sequence-index-cell"><span class="sequence-index">' + String(index + 1) + '</span><div class="sequence-move-controls">' +
          buildMoveButton("up", index, index <= 0) +
          buildMoveButton("down", index, index >= sequenceRows.length - 1) +
          "</div></div></td>",
        '<td>' + buildTransitionSelect("start", index, row.start) + "</td>",
        '<td>' + buildTransitionSelect("end", index, row.end) + "</td>",
        "<td><div class=\"sequence-text\" title=\"" + escapeHtml(row.text) + "\" style=\"background:" + escapeHtml(resolvedBackground) + ";\">" + buildColorizedTextMarkup(row.text, row.colors) + "</div></td>",
        '<td><div class="sequence-cell-actions">',
        '<button type="button" class="row-button row-edit" data-index="' + index + '">Edit</button>',
        '<button type="button" class="row-button row-delete" data-index="' + index + '">Delete</button>',
        "</div></td>",
        "</tr>"
      ].join("");
    }

    html += [
      "<tr>",
      '<td colspan="4" class="sequence-text">Optional message file rows.</td>',
      '<td><div class="sequence-cell-actions">',
      '<button type="button" class="row-button row-add">Add</button>',
      "</div></td>",
      "</tr>"
    ].join("");

    sequenceGridBody.innerHTML = html;
  }

  function buildMoveButton(direction, index, disabled) {
    var isUp = direction === "up";
    var symbol = isUp ? "&#9650;" : "&#9660;";
    var label = isUp ? "Move row up" : "Move row down";

    return '<button type="button" class="sequence-move-button row-button row-' + direction + '" data-index="' + index + '" aria-label="' + label + '"' + (disabled ? " disabled" : "") + ">" + symbol + "</button>";
  }

  function buildTransitionSelect(kind, index, token) {
    var currentValue = tokenToDirectionValue(token);
    var options;

    if (kind === "start") {
      options = [
        buildTransitionOption("right", currentValue),
        buildTransitionOption("left", currentValue),
        buildTransitionOption("top", currentValue),
        buildTransitionOption("bottom", currentValue)
      ].join("");
    } else {
      options = [
        buildTransitionOption("right", currentValue),
        buildTransitionOption("left", currentValue),
        buildTransitionOption("top", currentValue),
        buildTransitionOption("bottom", currentValue),
        buildTransitionOption("center", currentValue)
      ].join("");
    }

    return '<select class="sequence-transition-select" data-kind="' + kind + '" data-index="' + index + '">' + options + "</select>";
  }

  function buildTransitionOption(value, currentValue) {
    return '<option value="' + value + '"' + (value === currentValue ? " selected" : "") + ">" + value + "</option>";
  }

  function openRowModal(index, row) {
    var values = row || sequenceRows[index] || {
      start: ">>",
      end: ">>",
      text: "",
      colors: ""
    };

    editingRowIndex = typeof index === "number" ? index : -1;
    fields.modalText.value = values.text || "";
    fields.modalColors.value = normalizeColorPipeForText(values.text || "", values.colors || "", "ffff66|ffee88|ffdd55|ffee88|");
    modalHistory = [];
    modalHistoryIndex = -1;
    modalSelectionStart = 0;
    modalSelectionEnd = fields.modalText.value.length;
    pushModalHistoryState({
      text: fields.modalText.value,
      colors: fields.modalColors.value,
      selectionStart: modalSelectionStart,
      selectionEnd: modalSelectionEnd
    });
    updateModalEditorPreview();
    rowModal.hidden = false;
    fields.modalText.focus();
    restoreModalSelection();
  }

  function closeRowModal() {
    rowModal.hidden = true;
    editingRowIndex = -1;
    modalHistory = [];
    modalHistoryIndex = -1;
  }

  function onModalSubmit(event) {
    var record;

    event.preventDefault();

    record = {
      start: editingRowIndex >= 0 && sequenceRows[editingRowIndex] ? sequenceRows[editingRowIndex].start : ">>",
      end: editingRowIndex >= 0 && sequenceRows[editingRowIndex] ? sequenceRows[editingRowIndex].end : ">>",
      text: fields.modalText.value || "",
      colors: normalizeColorPipeForText(fields.modalText.value || "", fields.modalColors.value, getDefaultFontColorPipe())
    };

    if (!record.text.trim()) {
      fields.modalText.focus();
      return;
    }

    if (editingRowIndex >= 0) {
      sequenceRows[editingRowIndex] = record;
    } else {
      sequenceRows.push(record);
    }

    closeRowModal();
    updateMarquee();
  }

  function onModalTextInput() {
    fields.modalColors.value = normalizeColorPipeForText(
      fields.modalText.value || "",
      fields.modalColors.value,
      getDefaultFontColorPipe()
    );
    rememberModalSelection();
    pushModalHistoryState(getModalEditorState());
    updateModalEditorPreview();
  }

  function onModalColorPickerInput() {
    applyColorToModalSelection();
  }

  function applyColorToModalSelection() {
    var text = fields.modalText.value || "";
    var selection = getModalSelectionRange();
    var selectionStart = selection.start;
    var selectionEnd = selection.end;
    var colors;
    var index;
    var nextColor;

    if (!text || selectionStart === selectionEnd) {
      updateModalColorControls();
      return;
    }

    colors = expandColorArrayForText(text, fields.modalColors.value, getDefaultFontColorPipe());
    nextColor = marqueeApi.normalizeColor(fields.modalColorPicker.value, getPageConfig().defaultColor).replace(/^#/, "");

    for (index = selectionStart; index < selectionEnd && index < colors.length; index += 1) {
      colors[index] = nextColor;
    }

    fields.modalColors.value = colors.join("|") + (colors.length ? "|" : "");
    modalSelectionStart = selectionStart;
    modalSelectionEnd = selectionEnd;
    pushModalHistoryState(getModalEditorState());
    updateModalEditorPreview();
    fields.modalText.focus();
    restoreModalSelection();
  }

  function updateModalEditorPreview() {
    var config;

    if (!fields.modalPreview) {
      return;
    }

    config = getPageConfig();
    fields.modalColors.value = normalizeColorPipeForText(
      fields.modalText.value || "",
      fields.modalColors.value,
      getDefaultFontColorPipe()
    );
    fields.modalPreview.style.background = marqueeApi.normalizeColor(fields.background.value, "#000066");
    fields.modalPreview.style.font = buildFontDeclaration(config);
    fields.modalText.style.font = fields.modalPreview.style.font;
    fields.modalText.style.background = fields.modalPreview.style.background;
    fields.modalText.style.color = "#ffffff";
    fields.modalPreview.innerHTML = buildColorizedTextMarkup(fields.modalText.value || "", fields.modalColors.value);
    updateModalColorControls();
  }

  function updateModalColorControls() {
    if (fields.modalColorPicker) {
      fields.modalColorPicker.value = detectModalSelectionColor();
    }

    if (fields.modalColorTrigger && fields.modalColorPicker) {
      fields.modalColorTrigger.style.background = fields.modalColorPicker.value;
    }

    if (fields.modalUndo) {
      fields.modalUndo.disabled = modalHistoryIndex <= 0;
    }
  }

  function detectModalSelectionColor() {
    var text = fields.modalText.value || "";
    var selectionStart = getModalSelectionRange().start;
    var colors = expandColorArrayForText(text, fields.modalColors.value, getDefaultFontColorPipe());

    if (!colors.length) {
      return getPageConfig().defaultColor;
    }

    if (selectionStart >= 0 && selectionStart < colors.length) {
      return colors[selectionStart].charAt(0) === "#" ? colors[selectionStart] : ("#" + colors[selectionStart]);
    }

    return colors[0].charAt(0) === "#" ? colors[0] : ("#" + colors[0]);
  }

  function onModalSelectionChange() {
    rememberModalSelection();
    updateModalColorControls();
  }

  function onModalPreviewMouseUp() {
    var selection = window.getSelection ? window.getSelection() : null;
    var range;
    var startIndex;
    var endIndex;
    var start;
    var end;

    if (!selection || !selection.rangeCount || selection.isCollapsed) {
      return;
    }

    range = selection.getRangeAt(0);

    if (!fields.modalPreview.contains(range.startContainer) || !fields.modalPreview.contains(range.endContainer)) {
      return;
    }

    startIndex = getPreviewCharIndexFromNode(range.startContainer, range.startOffset, true);
    endIndex = getPreviewCharIndexFromNode(range.endContainer, range.endOffset, false);

    if (startIndex < 0 || endIndex < 0) {
      return;
    }

    start = Math.min(startIndex, endIndex);
    end = Math.max(startIndex, endIndex);
    modalSelectionStart = start;
    modalSelectionEnd = end;
    fields.modalText.focus();
    restoreModalSelection();
  }

  function onModalColorTriggerMouseDown(event) {
    rememberModalSelection();
    event.preventDefault();
  }

  function onModalColorTriggerClick() {
    if (!fields.modalColorPicker) {
      return;
    }

    rememberModalSelection();
    fields.modalColorPicker.value = detectModalSelectionColor();
    fields.modalColorPicker.click();
    setTimeout(function () {
      if (!rowModal.hidden) {
        fields.modalText.focus();
        restoreModalSelection();
      }
    }, 0);
  }

  function onModalTextKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && String(event.key).toLowerCase() === "z") {
      event.preventDefault();
      undoModalChange();
    }
  }

  function rememberModalSelection() {
    if (!fields.modalText) {
      return;
    }

    modalSelectionStart = typeof fields.modalText.selectionStart === "number" ? fields.modalText.selectionStart : 0;
    modalSelectionEnd = typeof fields.modalText.selectionEnd === "number" ? fields.modalText.selectionEnd : modalSelectionStart;
  }

  function restoreModalSelection() {
    if (!fields.modalText || typeof fields.modalText.setSelectionRange !== "function") {
      return;
    }

    fields.modalText.setSelectionRange(modalSelectionStart, modalSelectionEnd);
    updateModalColorControls();
  }

  function getModalSelectionRange() {
    return {
      start: modalSelectionStart,
      end: modalSelectionEnd
    };
  }

  function getModalEditorState() {
    return {
      text: fields.modalText.value || "",
      colors: normalizeColorPipeForText(fields.modalText.value || "", fields.modalColors.value, getDefaultFontColorPipe()),
      selectionStart: modalSelectionStart,
      selectionEnd: modalSelectionEnd
    };
  }

  function pushModalHistoryState(state) {
    var nextState = state || getModalEditorState();
    var previousState = modalHistoryIndex >= 0 ? modalHistory[modalHistoryIndex] : null;

    if (previousState &&
      previousState.text === nextState.text &&
      previousState.colors === nextState.colors &&
      previousState.selectionStart === nextState.selectionStart &&
      previousState.selectionEnd === nextState.selectionEnd) {
      return;
    }

    modalHistory = modalHistory.slice(0, modalHistoryIndex + 1);
    modalHistory.push({
      text: nextState.text,
      colors: nextState.colors,
      selectionStart: nextState.selectionStart,
      selectionEnd: nextState.selectionEnd
    });
    modalHistoryIndex = modalHistory.length - 1;
    updateModalColorControls();
  }

  function restoreModalHistoryState(state) {
    if (!state) {
      return;
    }

    fields.modalText.value = state.text || "";
    fields.modalColors.value = state.colors || "";
    modalSelectionStart = state.selectionStart || 0;
    modalSelectionEnd = typeof state.selectionEnd === "number" ? state.selectionEnd : modalSelectionStart;
    updateModalEditorPreview();
    fields.modalText.focus();
    restoreModalSelection();
  }

  function undoModalChange() {
    if (modalHistoryIndex <= 0) {
      updateModalColorControls();
      return;
    }

    modalHistoryIndex -= 1;
    restoreModalHistoryState(modalHistory[modalHistoryIndex]);
  }

  function onModalShellClick(event) {
    if (event.target.hasAttribute("data-modal-close")) {
      closeRowModal();
    }
  }

  function onSequenceGridClick(event) {
    var target = event.target;
    var index = parseInt(target.getAttribute("data-index"), 10);
    var temp;

    if (target.classList.contains("row-add")) {
      openRowModal(-1, {
        start: ">>",
        end: ">>",
        text: "",
        colors: ""
      });
      return;
    }

    if (!isFinite(index)) {
      return;
    }

    if (target.classList.contains("row-delete")) {
      sequenceRows.splice(index, 1);
      updateMarquee();
      return;
    }

    if (target.classList.contains("row-up")) {
      if (index > 0) {
        temp = sequenceRows[index - 1];
        sequenceRows[index - 1] = sequenceRows[index];
        sequenceRows[index] = temp;
        updateMarquee();
      }
      return;
    }

    if (target.classList.contains("row-down")) {
      if (index < sequenceRows.length - 1) {
        temp = sequenceRows[index + 1];
        sequenceRows[index + 1] = sequenceRows[index];
        sequenceRows[index] = temp;
        updateMarquee();
      }
      return;
    }

    if (target.classList.contains("row-edit")) {
      openRowModal(index);
    }
  }

  function onSequenceGridInput(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    }
  }

  function onSequenceGridChange(event) {
    var target = event.target;
    var index = parseInt(target.getAttribute("data-index"), 10);
    var kind = target.getAttribute("data-kind");

    if (event.stopPropagation) {
      event.stopPropagation();
    }

    if (!isFinite(index) || !kind || !sequenceRows[index]) {
      return;
    }

    if (kind === "start") {
      sequenceRows[index].start = directionValueToToken(target.value || "right");
      updateMarquee();
      return;
    }

    if (kind === "end") {
      sequenceRows[index].end = directionValueToToken(target.value || "left");
      updateMarquee();
    }
  }

  function buildColorizedTextMarkup(text, colorPipe) {
    var colors = expandColorArrayForText(text, colorPipe, getDefaultFontColorPipe());
    var safeText = String(text || "");
    var html = "";
    var index;
    var color;

    if (!safeText) {
      return '<span class="sequence-text-char"> </span>';
    }

    if (!colors.length) {
      return escapeHtml(safeText);
    }

    for (index = 0; index < safeText.length; index += 1) {
      color = colors[index] || colors[colors.length - 1];
      html += '<span class="sequence-text-char" data-char-index="' + index + '" style="color:' + escapeHtml(color) + ';">' + escapeHtml(safeText.charAt(index)) + '</span>';
    }

    return html;
  }

  function normalizeColorPipe(rawValue, fallback) {
    var colors = marqueeApi.parseColorList(rawValue || "");
    var index;
    var values = [];

    if (!colors.length) {
      return fallback;
    }

    for (index = 0; index < colors.length; index += 1) {
      values.push(colors[index].replace(/^#/, ""));
    }

    return values.join("|") + "|";
  }

  function expandColorArrayForText(text, colorPipe, fallback) {
    var safeText = String(text || "");
    var parsedColors = marqueeApi.parseColorList(colorPipe || "");
    var expandedColors = [];
    var index;
    var fallbackColor = marqueeApi.parseColorList(fallback || getDefaultFontColorPipe())[0] || "#ffff66";

    for (index = 0; index < safeText.length; index += 1) {
      expandedColors.push(parsedColors[index] || fallbackColor);
    }

    return expandedColors;
  }

  function normalizeColorPipeForText(text, colorPipe, fallback) {
    var colors = expandColorArrayForText(text, colorPipe, fallback);
    var values = [];
    var index;

    for (index = 0; index < colors.length; index += 1) {
      values.push(String(colors[index] || "").replace(/^#/, ""));
    }

    return values.join("|") + (values.length ? "|" : "");
  }

  function getDefaultFontColorPipe() {
    return marqueeApi.normalizeColor((fields.defaultColor && fields.defaultColor.value) || "#ffff66", "#ffff66").replace(/^#/, "") + "|";
  }

  function toDotSpeed(backgroundSpeed) {
    return Number(backgroundSpeed || 0) * 0.06;
  }

  function buildFontDeclaration(config) {
    var styleValue = String(config.fontStyle || "0");
    var prefix = "";

    if (styleValue === "1") {
      prefix = "bold ";
    } else if (styleValue === "2") {
      prefix = "italic ";
    } else if (styleValue === "3") {
      prefix = "bold italic ";
    }

    return prefix + config.fontSize + "px " + config.fontFamily;
  }

  function getPreviewCharIndexFromNode(node, offset, isStart) {
    var target = node;
    var charIndex;
    var normalizedOffset;

    while (target && target !== fields.modalPreview && (!target.getAttribute || target.getAttribute("data-char-index") === null)) {
      target = target.parentNode;
    }

    if (!target || target === fields.modalPreview) {
      return -1;
    }

    charIndex = parseInt(target.getAttribute("data-char-index"), 10);

    if (!isFinite(charIndex)) {
      return -1;
    }

    if (node && node.nodeType === 3) {
      normalizedOffset = Math.max(0, Math.min(offset, String(node.nodeValue || "").length));
      return isStart ? charIndex : (charIndex + Math.min(normalizedOffset, 1));
    }

    return isStart ? charIndex : (charIndex + 1);
  }

  function tokenToDirectionValue(token) {
    if (token === "<<") {
      return "left";
    }

    if (token === "^^") {
      return "top";
    }

    if (token === "VV") {
      return "bottom";
    }

    if (token === "<>") {
      return "center";
    }

    return "right";
  }

  function directionValueToToken(value) {
    if (value === "left") {
      return "<<";
    }

    if (value === "top") {
      return "^^";
    }

    if (value === "bottom") {
      return "VV";
    }

    if (value === "center") {
      return "<>";
    }

    return ">>";
  }

  function getTransitionLabel(value) {
    if (value === ">>") {
      return "right";
    }

    if (value === "<<") {
      return "left";
    }

    if (value === "^^") {
      return "top";
    }

    if (value === "VV") {
      return "bottom";
    }

    if (value === "<>") {
      return "center";
    }

    return value || "";
  }

  function copyGeneratedCode() {
    var value = codeOutput.value;

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      codeOutput.focus();
      codeOutput.select();
      copyStatus.textContent = "Select and copy manually.";
      return;
    }

    navigator.clipboard.writeText(value).then(function () {
      copyStatus.textContent = "Copied.";
    }).catch(function () {
      codeOutput.focus();
      codeOutput.select();
      copyStatus.textContent = "Select and copy manually.";
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeForInlineText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function splitColorPipe(colorPipe) {
    var colors = marqueeApi.parseColorList(colorPipe || "");
    var values = [];
    var index;

    for (index = 0; index < colors.length; index += 1) {
      values.push(colors[index].replace(/^#/, ""));
    }

    return values;
  }

  function stringifyForCode(value, indentSize) {
    return JSON.stringify(value, null, indentSize || 2).replace(/<\/script/gi, "<\\/script");
  }

  function updateGeneratedFileHeading() {
    var fileName;

    if (!generatedFileHeading) {
      return;
    }

    fileName = getSequenceFileName();
    generatedFileHeading.innerHTML = "Generated `" + escapeHtml(fileName) + "`";
  }

  function getSequenceFileName() {
    var value = fields.fileName && fields.fileName.value ? String(fields.fileName.value).trim() : "";
    return value || "dreamers.txt";
  }
}());
