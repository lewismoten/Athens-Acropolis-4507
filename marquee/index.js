(function () {
  var form = document.getElementById("marquee-form");
  var previewCanvas = document.getElementById("marquee-preview-canvas");
  var previewFrame = document.getElementById("preview-frame");
  var codeOutput = document.getElementById("marquee-code");
  var htmlCodeOutput = document.getElementById("marquee-html-code");
  var copyButton = document.getElementById("copy-code");
  var copyStatus = document.getElementById("copy-status");
  var sequenceGridBody = document.getElementById("sequence-grid-body");
  var addRowButton = document.getElementById("add-row");
  var rowModal = document.getElementById("row-modal");
  var rowModalForm = document.getElementById("row-modal-form");
  var modalCancel = document.getElementById("modal-cancel");
  var marqueeApi = window.DreamMarquee;
  var previewMarquee;
  var sequenceRows = [];
  var editingRowIndex = -1;

  if (!form || !previewCanvas || !codeOutput || !htmlCodeOutput || !marqueeApi || !sequenceGridBody || !rowModal || !rowModalForm) {
    return;
  }

  var fields = {
    delayCount: document.getElementById("marquee-delay-count"),
    fontSize: document.getElementById("marquee-font-size"),
    width: document.getElementById("marquee-width"),
    height: document.getElementById("marquee-height"),
    waveHeight: document.getElementById("marquee-wave-height"),
    dotCount: document.getElementById("marquee-dot-count"),
    background: document.getElementById("marquee-background"),
    dotColor: document.getElementById("marquee-dot-color"),
    fontFamily: document.getElementById("marquee-font-family"),
    bold: document.getElementById("marquee-bold"),
    modalText: document.getElementById("modal-row-text"),
    modalColors: document.getElementById("modal-row-colors"),
    modalColorPicker: document.getElementById("modal-row-color-picker"),
    modalApplyColor: document.getElementById("modal-apply-color"),
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
    font: "bold 30px Times New Roman, Times, serif",
    fontHeight: 30,
    fps: 30,
    displayFrames: 100,
    defaultColors: marqueeApi.parseColorList("ffff66|ffee88|ffdd55|ffee88"),
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
  fields.modalText.addEventListener("select", updateModalColorControls);
  fields.modalText.addEventListener("click", updateModalColorControls);
  fields.modalText.addEventListener("keyup", updateModalColorControls);

  if (fields.modalApplyColor) {
    fields.modalApplyColor.addEventListener("click", applyColorToModalSelection);
  }

  if (fields.modalColorPicker) {
    fields.modalColorPicker.addEventListener("input", updateModalColorControls);
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyGeneratedCode);
  }

  if (addRowButton) {
    addRowButton.addEventListener("click", function () {
      openRowModal(-1, {
        start: ">>",
        end: ">>",
        text: "",
        colors: "ffff66|ffee88|ffdd55|ffee88|"
      });
    });
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
    var holdSeconds = marqueeApi.clampNumber(fields.delayCount.value, 0, 999, 7);

    return {
      holdSeconds: holdSeconds,
      holdFrames: holdSeconds * 30,
      width: marqueeApi.clampNumber(fields.width.value, 120, 1200, 640),
      height: marqueeApi.clampNumber(fields.height.value, 32, 240, 92),
      fontSize: marqueeApi.clampNumber(fields.fontSize.value, 10, 72, 30),
      waveHeight: marqueeApi.clampNumber(fields.waveHeight.value, 0, 24, 8),
      dotCount: marqueeApi.clampNumber(fields.dotCount.value, 0, 999, 50),
      background: marqueeApi.normalizeColor(fields.background.value, "#000066"),
      dotColor: marqueeApi.normalizeColor(fields.dotColor.value, "#9999ff"),
      fontFamily: (fields.fontFamily.value || "Times New Roman, Times, serif").trim(),
      bold: !!fields.bold.checked
    };
  }

  function getCanvasConfig(config, rows) {
    var fontWeight = fields.bold.checked ? "bold " : "";
    var defaultColors = marqueeApi.parseColorList((rows[0] && rows[0].colors) || "ffaa00|");

    return {
      width: config.width,
      height: config.height,
      backgroundColor: config.background,
      dotColor: config.dotColor,
      dotCount: config.dotCount,
      waveHeight: config.waveHeight,
      font: fontWeight + config.fontSize + "px " + config.fontFamily,
      fontHeight: config.fontSize,
      displayFrames: config.holdFrames,
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
        colors: marqueeApi.parseColorList(rows[index].colors),
        holdFrames: config.holdFrames
      });
    }

    return entries;
  }

  function buildDreamersScript(config, rows) {
    var lines = [String(config.holdSeconds)];
    var index;

    for (index = 0; index < rows.length; index += 1) {
      lines.push(rows[index].start + "," + rows[index].end);
      lines.push(rows[index].text);
      lines.push(rows[index].colors);
    }

    return lines.join("\n");
  }

  function buildCanvasEmbedCode(config, rows) {
    var fontWeight = config.bold ? "bold " : "";
    var defaultColorValues = splitColorPipe((rows[0] && rows[0].colors) || "ffaa00|");
    var optionsConfig = {
      width: config.width,
      height: config.height,
      backgroundColor: config.background,
      dotColor: config.dotColor,
      dotCount: config.dotCount,
      waveHeight: config.waveHeight,
      font: fontWeight + config.fontSize + "px " + config.fontFamily,
      fontHeight: config.fontSize,
      fps: 30,
      displayFrames: config.holdFrames,
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
        colors: splitColorPipe(rows[index].colors),
        holdFrames: config.holdFrames
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
    lines.push("      defaultColors: marqueeOptions.defaultColors,");
    lines.push("      holdFrames: entry.holdFrames");
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

    if (!html) {
      html = '<tr><td colspan="5" class="sequence-text">No rows yet. Use "Add Row" to create one.</td></tr>';
    }

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
      colors: "ffff66|ffee88|ffdd55|ffee88|"
    };

    editingRowIndex = typeof index === "number" ? index : -1;
    fields.modalText.value = values.text || "";
    fields.modalColors.value = normalizeColorPipeForText(values.text || "", values.colors || "", "ffff66|ffee88|ffdd55|ffee88|");
    fields.modalColorPicker.value = detectModalSelectionColor();
    updateModalEditorPreview();
    rowModal.hidden = false;
    fields.modalText.focus();
    fields.modalText.select();
  }

  function closeRowModal() {
    rowModal.hidden = true;
    editingRowIndex = -1;
  }

  function onModalSubmit(event) {
    var record;

    event.preventDefault();

    record = {
      start: editingRowIndex >= 0 && sequenceRows[editingRowIndex] ? sequenceRows[editingRowIndex].start : ">>",
      end: editingRowIndex >= 0 && sequenceRows[editingRowIndex] ? sequenceRows[editingRowIndex].end : ">>",
      text: fields.modalText.value || "",
      colors: normalizeColorPipeForText(fields.modalText.value || "", fields.modalColors.value, "ffff66|ffee88|ffdd55|ffee88|")
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
      "ffff66|ffee88|ffdd55|ffee88|"
    );
    updateModalEditorPreview();
  }

  function applyColorToModalSelection() {
    var text = fields.modalText.value || "";
    var selectionStart = fields.modalText.selectionStart;
    var selectionEnd = fields.modalText.selectionEnd;
    var colors;
    var index;
    var nextColor;

    if (!text || selectionStart === selectionEnd) {
      updateModalColorControls();
      return;
    }

    colors = expandColorArrayForText(text, fields.modalColors.value, "ffff66|ffee88|ffdd55|ffee88|");
    nextColor = marqueeApi.normalizeColor(fields.modalColorPicker.value, "#ffff66").replace(/^#/, "");

    for (index = selectionStart; index < selectionEnd && index < colors.length; index += 1) {
      colors[index] = nextColor;
    }

    fields.modalColors.value = colors.join("|") + (colors.length ? "|" : "");
    updateModalEditorPreview();
    fields.modalText.focus();
    fields.modalText.setSelectionRange(selectionStart, selectionEnd);
  }

  function updateModalEditorPreview() {
    if (!fields.modalPreview) {
      return;
    }

    fields.modalColors.value = normalizeColorPipeForText(
      fields.modalText.value || "",
      fields.modalColors.value,
      "ffff66|ffee88|ffdd55|ffee88|"
    );
    fields.modalPreview.style.background = marqueeApi.normalizeColor(fields.background.value, "#000066");
    fields.modalPreview.style.font = (fields.bold.checked ? "bold " : "") + getPageConfig().fontSize + "px " + getPageConfig().fontFamily;
    fields.modalPreview.innerHTML = buildColorizedTextMarkup(fields.modalText.value || "", fields.modalColors.value);
    updateModalColorControls();
  }

  function updateModalColorControls() {
    var selectionStart = fields.modalText.selectionStart;
    var selectionEnd = fields.modalText.selectionEnd;

    if (fields.modalApplyColor) {
      fields.modalApplyColor.disabled = !fields.modalText.value || selectionStart === selectionEnd;
    }

    if (fields.modalColorPicker) {
      fields.modalColorPicker.value = detectModalSelectionColor();
    }
  }

  function detectModalSelectionColor() {
    var text = fields.modalText.value || "";
    var selectionStart = fields.modalText.selectionStart;
    var colors = expandColorArrayForText(text, fields.modalColors.value, "ffff66|ffee88|ffdd55|ffee88|");

    if (!colors.length) {
      return "#ffff66";
    }

    if (selectionStart >= 0 && selectionStart < colors.length) {
      return colors[selectionStart].charAt(0) === "#" ? colors[selectionStart] : ("#" + colors[selectionStart]);
    }

    return colors[0].charAt(0) === "#" ? colors[0] : ("#" + colors[0]);
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
    var colors = expandColorArrayForText(text, colorPipe, "ffff66|ffee88|ffdd55|ffee88|");
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
      html += '<span class="sequence-text-char" style="color:' + escapeHtml(color) + ';">' + escapeHtml(safeText.charAt(index)) + '</span>';
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
    var baseColors = parsedColors.length ? parsedColors : marqueeApi.parseColorList(fallback || "ffff66|");
    var expandedColors = [];
    var index;

    for (index = 0; index < safeText.length; index += 1) {
      expandedColors.push(baseColors[index % baseColors.length]);
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
}());
