(function () {
  var MODE_SCRIPT_PATHS = {
    stars: "marquee/modes/stars.js",
    rain: "marquee/modes/rain.js",
    snow: "marquee/modes/snow.js",
    fireflies: "marquee/modes/fireflies.js",
    dust: "marquee/modes/dust.js",
    bubbles: "marquee/modes/bubbles.js",
    "bubble-pop": "marquee/modes/bubbles.js",
    embers: "marquee/modes/embers.js",
    sparkles: "marquee/modes/sparkles.js",
    fog: "marquee/modes/fog.js",
    comets: "marquee/modes/comets.js",
    matrix: "marquee/modes/matrix.js",
    confetti: "marquee/modes/confetti.js",
    balls: "marquee/modes/balls.js",
    static: "marquee/modes/static.js",
    leaves: "marquee/modes/leaves.js",
    fireworks: "marquee/modes/fireworks.js"
  };
  var form = document.getElementById("marquee-form");
  var previewCanvas = document.getElementById("marquee-preview-canvas");
  var previewFrame = document.getElementById("preview-frame");
  var previewSurface = document.getElementById("preview-surface");
  var codeOutput = document.getElementById("marquee-code");
  var htmlCodeOutput = document.getElementById("marquee-html-code");
  var generatedFileHeading = document.getElementById("generated-file-heading");
  var copyButton = document.getElementById("copy-code");
  var copyStatus = document.getElementById("copy-status");
  var defaultMessageCard = document.getElementById("default-message-card");
  var imageLibraryPreview = document.getElementById("image-library-preview");
  var manageImagesButton = document.getElementById("manage-images");
  var sequenceGridBody = document.getElementById("sequence-grid-body");
  var rowModal = document.getElementById("row-modal");
  var rowModalForm = document.getElementById("row-modal-form");
  var modalCancel = document.getElementById("modal-cancel");
  var imageModal = document.getElementById("image-modal");
  var imageModalGrid = document.getElementById("image-modal-grid");
  var imageModalSelected = document.getElementById("image-modal-selected");
  var imageModalClose = document.getElementById("image-modal-close");
  var marqueeApi = window.ShoomiColorMarquee;
  var previewMarquee;
  var AVAILABLE_IMAGE_FILES = [
    "red_ball.gif",
    "orange_ball.gif",
    "yellow_ball.gif",
    "green_ball.gif",
    "blue_ball.gif",
    "purple_ball.gif",
    "pink_ball.gif",
    "grey_ball.gif",
    "white_ball.gif",
    "black_ball.gif"
  ];
  var AVAILABLE_BANNER_FILES = [
    "banner_geocities.gif",
    "banner_linkexchange.gif",
    "banner_lpage.gif"
  ];
  var DEFAULT_FONT_ID = "times-new-roman";
  var FALLBACK_FONT_CATALOG = [{
    id: "burtons-nightmare",
    label: "Burton's Nightmare",
    family: "\"Burton's Nightmare\"",
    fallback: "fantasy"
  }, {
    id: "times-new-roman",
    label: "Times New Roman",
    family: "\"Times New Roman\"",
    fallback: "times"
  }, {
    id: "times",
    label: "Times",
    family: "Times",
    fallback: "serif"
  }, {
    id: "georgia",
    label: "Georgia",
    family: "Georgia",
    fallback: "serif"
  }, {
    id: "garamond",
    label: "Garamond",
    family: "Garamond",
    fallback: "serif"
  }, {
    id: "palatino-linotype",
    label: "Palatino Linotype",
    family: "\"Palatino Linotype\"",
    fallback: "palatino"
  }, {
    id: "palatino",
    label: "Palatino",
    family: "Palatino",
    fallback: "serif"
  }, {
    id: "arial",
    label: "Arial",
    family: "Arial",
    fallback: "helvetica"
  }, {
    id: "helvetica",
    label: "Helvetica",
    family: "Helvetica",
    fallback: "sans-serif"
  }, {
    id: "verdana",
    label: "Verdana",
    family: "Verdana",
    fallback: "sans-serif"
  }, {
    id: "tahoma",
    label: "Tahoma",
    family: "Tahoma",
    fallback: "sans-serif"
  }, {
    id: "trebuchet-ms",
    label: "Trebuchet MS",
    family: "\"Trebuchet MS\"",
    fallback: "sans-serif"
  }, {
    id: "system-ui",
    label: "System UI",
    family: "system-ui",
    fallback: "sans-serif"
  }, {
    id: "courier-new",
    label: "Courier New",
    family: "\"Courier New\"",
    fallback: "courier"
  }, {
    id: "courier",
    label: "Courier",
    family: "Courier",
    fallback: "monospace"
  }, {
    id: "lucida-console",
    label: "Lucida Console",
    family: "\"Lucida Console\"",
    fallback: "monospace"
  }, {
    id: "comic-sans-ms",
    label: "Comic Sans MS",
    family: "\"Comic Sans MS\"",
    fallback: "cursive"
  }, {
    id: "impact",
    label: "Impact",
    family: "Impact",
    fallback: "fantasy"
  }, {
    id: "serif",
    label: "Serif",
    family: "serif"
  }, {
    id: "sans-serif",
    label: "Sans Serif",
    family: "sans-serif"
  }, {
    id: "monospace",
    label: "Monospace",
    family: "monospace"
  }, {
    id: "fantasy",
    label: "Fantasy",
    family: "fantasy"
  }, {
    id: "cursive",
    label: "Cursive",
    family: "cursive"
  }];
  var fontCatalog = [];
  var fontCatalogById = {};
  var defaultMessageRow = {
    start: ">>",
    end: "<<",
    text: "$0 $1 Shoomi's marquee maker $2 $3",
    colors: "ffff66|ffee88|ffdd55|ffee88|"
  };
  var selectedImageFiles = AVAILABLE_IMAGE_FILES.slice(0);
  var sequenceRows = [];
  var editingRowIndex = -1;
  var editingDefaultMessage = false;
  var imageModalMode = "manage";
  var modalHistory = [];
  var modalHistoryIndex = -1;
  var modalSelectionStart = 0;
  var modalSelectionEnd = 0;

  if (!form || !previewCanvas || !previewSurface || !codeOutput || !htmlCodeOutput || !marqueeApi || !sequenceGridBody || !rowModal || !rowModalForm || !defaultMessageCard || !imageLibraryPreview || !imageModal || !imageModalGrid || !imageModalSelected) {
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
    backgroundMode: document.getElementById("marquee-background-mode"),
    dotImageMode: document.getElementById("marquee-dot-image-mode"),
    animationSpeed: document.getElementById("marquee-animation-speed"),
    background: document.getElementById("marquee-background"),
    backgroundImage: document.getElementById("marquee-background-image"),
    backgroundImagePlacement: document.getElementById("marquee-background-image-placement"),
    backgroundImageX: document.getElementById("marquee-background-image-x"),
    backgroundImageY: document.getElementById("marquee-background-image-y"),
    backgroundImageWidth: document.getElementById("marquee-background-image-width"),
    backgroundImageHeight: document.getElementById("marquee-background-image-height"),
    fileName: document.getElementById("sequence-file-name"),
    defaultColor: document.getElementById("marquee-default-color"),
    dotColor: document.getElementById("marquee-dot-color"),
    fontFamily: document.getElementById("marquee-font-family"),
    fontStyle: document.getElementById("marquee-font-style"),
    modalText: document.getElementById("modal-row-text"),
    modalColors: document.getElementById("modal-row-colors"),
    modalColorTrigger: document.getElementById("modal-color-trigger"),
    modalColorPicker: document.getElementById("modal-row-color-picker"),
    modalInsertImage: document.getElementById("modal-insert-image"),
    modalUndo: document.getElementById("modal-undo"),
    modalPreview: document.getElementById("modal-row-preview")
  };

  previewMarquee = marqueeApi.createCanvasMarquee({
    canvas: previewCanvas,
    backgroundElement: previewSurface,
    width: 640,
    height: 92,
    backgroundColor: "#000066",
    backgroundImage: "",
    backgroundImagePlacement: "center",
    backgroundImageX: 0,
    backgroundImageY: 0,
    backgroundImageWidth: 0,
    backgroundImageHeight: 0,
    backgroundMode: "stars",
    dotColor: "#9999ff",
    dotCount: 50,
    waveHeight: 8,
    dotSpeed: toDotSpeed(3),
    fontName: resolveFontFamilyStack(DEFAULT_FONT_ID),
    fontSize: 30,
    fontStyle: "2",
    fps: 20,
    displayFrames: 100,
    defaultColor: "#ffff66",
    dotImageFiles: "",
    imageFiles: buildImageFilesPipe(selectedImageFiles.map(resolvePreviewBackgroundImagePath)),
    entries: [[">>,<<", defaultMessageRow.text, "#ffff66|#ffee88|#ffdd55|#ffee88"]]
  });

  form.addEventListener("input", onFormFieldInput);
  form.addEventListener("change", onFormFieldChange);
  if (fields.backgroundImage) {
    fields.backgroundImage.addEventListener("change", function () {
      updateMarquee();
    });
  }
  defaultMessageCard.addEventListener("click", onDefaultMessageClick);
  imageLibraryPreview.addEventListener("click", onImageLibraryPreviewClick);
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

  if (manageImagesButton) {
    manageImagesButton.addEventListener("click", openImageManager);
  }

  if (imageModal) {
    imageModal.addEventListener("click", onImageModalShellClick);
  }

  if (imageModalGrid) {
    imageModalGrid.addEventListener("click", onImageModalGridClick);
  }

  if (imageModalClose) {
    imageModalClose.addEventListener("click", closeImageModal);
  }

  if (fields.modalInsertImage) {
    fields.modalInsertImage.addEventListener("click", openImageInsertPicker);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !imageModal.hidden) {
      closeImageModal();
    } else if (event.key === "Escape" && !rowModal.hidden) {
      closeRowModal();
    }
  });

  applyFontCatalog(FALLBACK_FONT_CATALOG, DEFAULT_FONT_ID);
  seedDefaultRows();
  updateMarquee();
  loadFontCatalog();

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
    if (previewSurface) {
      previewSurface.style.width = config.width + "px";
      previewSurface.style.height = config.height + "px";
    }
    if (previewCanvas) {
      previewCanvas.style.width = config.width + "px";
      previewCanvas.style.height = config.height + "px";
    }
    updateGeneratedFileHeading();
    renderDefaultMessageCard(config.background);
    renderImageLibraryPreview();
    renderSequenceGrid(config.background);
    renderImageModal();
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
    var fontFamilyId = getSelectedFontFamilyId();
    var sequenceCount = sequenceRows.length;
    var messageFile = getSequenceFileName();
    var useDotImages = fields.dotImageMode && fields.dotImageMode.value === "images";

    return {
      sequenceCount: sequenceCount,
      messageFile: messageFile,
      displayTime: marqueeApi.clampNumber(fields.displayTime.value, 1, 999, 100),
      width: width,
      height: height,
      fontSize: fontSize,
      waveHeight: marqueeApi.clampNumber(fields.waveHeight.value, 0, 24, 8),
      dotCount: marqueeApi.clampNumber(fields.dotCount.value, 0, 9999, 50),
      backgroundSpeed: marqueeApi.clampNumber(fields.backgroundSpeed.value, -30, 30, 3),
      backgroundMode: normalizeBackgroundMode(fields.backgroundMode.value),
      dotImageFiles: useDotImages ? buildImageFilesPipe(selectedImageFiles) : "",
      animationSpeed: marqueeApi.clampNumber(fields.animationSpeed.value, 1, 120, 20),
      background: marqueeApi.normalizeColor(fields.background.value, "#000066"),
      backgroundImage: normalizeBackgroundBanner(fields.backgroundImage.value),
      backgroundImagePlacement: normalizeBackgroundImagePlacement(fields.backgroundImagePlacement.value),
      backgroundImageX: marqueeApi.clampNumber(fields.backgroundImageX.value, -4000, 4000, 0),
      backgroundImageY: marqueeApi.clampNumber(fields.backgroundImageY.value, -4000, 4000, 0),
      backgroundImageWidth: marqueeApi.clampNumber(fields.backgroundImageWidth.value, 0, 4000, 0),
      backgroundImageHeight: marqueeApi.clampNumber(fields.backgroundImageHeight.value, 0, 4000, 0),
      imageFiles: buildImageFilesPipe(selectedImageFiles),
      defaultColor: defaultColor,
      dotColor: marqueeApi.normalizeColor(fields.dotColor.value, "#9999ff"),
      fontFamilyId: fontFamilyId,
      fontFamily: resolveFontFamilyStack(fontFamilyId),
      fontStyle: fontStyle
    };
  }

  function getCanvasConfig(config, rows) {
    return {
      width: config.width,
      height: config.height,
      backgroundColor: config.background,
      backgroundImage: resolvePreviewBackgroundImagePath(config.backgroundImage),
      backgroundImagePlacement: config.backgroundImagePlacement,
      backgroundImageX: config.backgroundImageX,
      backgroundImageY: config.backgroundImageY,
      backgroundImageWidth: config.backgroundImageWidth,
      backgroundImageHeight: config.backgroundImageHeight,
      backgroundMode: config.backgroundMode,
      dotColor: config.dotColor,
      dotCount: config.dotCount,
      dotImageFiles: config.dotImageFiles ? buildImageFilesPipe(selectedImageFiles.map(resolvePreviewBackgroundImagePath)) : "",
      dotSpeed: toDotSpeed(config.backgroundSpeed),
      waveHeight: config.waveHeight,
      fontName: config.fontFamily,
      fontSize: config.fontSize,
      fontStyle: config.fontStyle,
      fps: config.animationSpeed,
      displayFrames: config.displayTime,
      defaultColor: config.defaultColor,
      imageFiles: buildImageFilesPipe(selectedImageFiles.map(resolvePreviewBackgroundImagePath))
    };
  }

  function buildCanvasEntries(config, rows) {
    var entries = [];
    var sourceRows = (config.messageFile && rows.length) ? rows : [defaultMessageRow];
    var index;

    for (index = 0; index < sourceRows.length; index += 1) {
      entries.push({
        start: sourceRows[index].start,
        end: sourceRows[index].end,
        text: sourceRows[index].text,
        colors: marqueeApi.parseColorList(sourceRows[index].colors)
      });
    }

    return entries;
  }

  function buildDreamersScript(config, rows) {
    var lines = [String(config.sequenceCount)];
    var index;

    for (index = 0; index < rows.length; index += 1) {
      lines.push(rows[index].text);
      lines.push(rows[index].colors);
      lines.push(rows[index].start + "," + rows[index].end);
    }

    return lines.join("\n");
  }

  function buildCanvasEmbedCode(config, rows) {
    var fileName = getSequenceFileName();
    var useMessageFile = !!fileName;
    var modeScripts = getEmbedModeScripts(config.backgroundMode);
    var optionsConfig = {
      width: config.width,
      height: config.height,
      backgroundColor: config.background,
      backgroundImage: config.backgroundImage,
      backgroundImagePlacement: config.backgroundImagePlacement,
      backgroundImageX: config.backgroundImageX,
      backgroundImageY: config.backgroundImageY,
      backgroundImageWidth: config.backgroundImageWidth,
      backgroundImageHeight: config.backgroundImageHeight,
      backgroundMode: config.backgroundMode,
      dotColor: config.dotColor,
      dotCount: config.dotCount,
      dotImageFiles: config.imageFiles,
      dotSpeed: toDotSpeed(config.backgroundSpeed),
      waveHeight: config.waveHeight,
      fontName: config.fontFamily,
      fontSize: config.fontSize,
      fontStyle: config.fontStyle,
      fps: config.animationSpeed,
      displayFrames: config.displayTime,
      imageFiles: config.imageFiles,
      message: defaultMessageRow.text,
      colors: defaultMessageRow.colors,
      defaultColor: config.defaultColor
    };
    var lines = [];
    var index;

    if (useMessageFile) {
      optionsConfig.messageFile = fileName;
    }

    lines.push('<canvas id="dream-marquee" width="' + config.width + '" height="' + config.height + '" style="display:block;">');
    lines.push(escapeForInlineText(defaultMessageRow.text || "Dream marquee"));
    lines.push("</canvas>");
    lines.push('<script src="marquee/shoomi-color-marquee.js"><\/script>');
    for (index = 0; index < modeScripts.length; index += 1) {
      lines.push('<script src="' + modeScripts[index] + '"><\/script>');
    }
    lines.push("<script>");
    lines.push("(function () {");
    lines.push('  var canvas = document.getElementById("dream-marquee");');
    lines.push("  var marqueeApi = window.ShoomiColorMarquee;");
    lines.push("  var marqueeOptions = " + stringifyForCode(optionsConfig, 2) + ";");
    lines.push("");
    lines.push("  if (!canvas || !canvas.getContext || !marqueeApi) {");
    lines.push("    return;");
    lines.push("  }");
    lines.push("");
    lines.push("  marqueeOptions.canvas = canvas;");
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
    var previewTextStyle = buildFormPreviewTextStyle();

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
        "<td><div class=\"sequence-text\" title=\"" + escapeHtml(row.text) + "\" style=\"background:" + escapeHtml(resolvedBackground) + ";" + previewTextStyle + "\">" + buildColorizedTextMarkup(row.text, row.colors) + "</div></td>",
        '<td><div class="sequence-cell-actions">',
        '<button type="button" id="sequence-row-edit-' + index + '" name="sequenceRowEdit' + index + '" class="row-button row-edit" data-index="' + index + '">Edit</button>',
        '<button type="button" id="sequence-row-delete-' + index + '" name="sequenceRowDelete' + index + '" class="row-button row-delete" data-index="' + index + '">Delete</button>',
        "</div></td>",
        "</tr>"
      ].join("");
    }

    html += [
      "<tr>",
      '<td colspan="4" class="sequence-text">Optional message file rows.</td>',
      '<td><div class="sequence-cell-actions">',
      '<button type="button" id="sequence-row-add" name="sequenceRowAdd" class="row-button row-add">Add</button>',
      "</div></td>",
      "</tr>"
    ].join("");

    sequenceGridBody.innerHTML = html;
  }

  function renderDefaultMessageCard(backgroundColor) {
    var previewTextStyle = buildFormPreviewTextStyle();

    defaultMessageCard.innerHTML = [
      '<div class="sequence-text default-message-preview" title="' + escapeHtml(defaultMessageRow.text || "") + '" style="background:' + escapeHtml(backgroundColor || "#000066") + ";" + previewTextStyle + '">' + buildColorizedTextMarkup(defaultMessageRow.text || "", defaultMessageRow.colors || "") + "</div>",
      '<div class="sequence-cell-actions">',
      '<button type="button" id="default-message-edit" name="defaultMessageEdit" class="row-button default-message-edit">Edit</button>',
      '<button type="button" id="default-message-clear" name="defaultMessageClear" class="row-button default-message-clear">Clear</button>',
      "</div>"
    ].join("");
  }

  function renderImageLibraryPreview() {
    var html = "";
    var index;

    if (!selectedImageFiles.length) {
      imageLibraryPreview.innerHTML = '<span class="image-chip-empty">No images selected</span>';
      return;
    }

    for (index = 0; index < selectedImageFiles.length; index += 1) {
      html += buildImageChipMarkup(selectedImageFiles[index], index, true);
    }

    imageLibraryPreview.innerHTML = html;
  }

  function renderImageModal() {
    var selectedHtml = "";
    var gridHtml = "";
    var index;
    var fileName;
    var selectedIndex;

    for (index = 0; index < selectedImageFiles.length; index += 1) {
      selectedHtml += buildImageChipMarkup(selectedImageFiles[index], index, true);
    }

    if (!selectedHtml) {
      selectedHtml = '<span class="image-chip-empty">No images selected</span>';
    }

    for (index = 0; index < AVAILABLE_IMAGE_FILES.length; index += 1) {
      fileName = AVAILABLE_IMAGE_FILES[index];
      selectedIndex = selectedImageFiles.indexOf(fileName);
      gridHtml += [
        '<button type="button" class="image-picker-button',
        selectedIndex >= 0 ? ' is-selected' : '',
        '" data-image-file="', escapeHtml(fileName),
        '" data-selected-index="', String(selectedIndex),
        '">',
        '<img src="', escapeHtml(resolvePreviewBackgroundImagePath(fileName)), '" alt="', escapeHtml(fileName), '">',
        '<span class="image-picker-label">', escapeHtml(fileName), '</span>',
        '</button>'
      ].join("");
    }

    imageModalSelected.innerHTML = selectedHtml;
    imageModalGrid.innerHTML = gridHtml;
  }

  function buildImageChipMarkup(fileName, index, includeToken) {
    var label = typeof index === "number" ? ("$" + index) : fileName;
    var token = includeToken && typeof index === "number" ? ('<span class="image-picker-label">' + escapeHtml(label) + "</span>") : "";

    return [
      '<span class="image-chip" title="', escapeHtml(fileName), '">',
      '<img src="', escapeHtml(resolvePreviewBackgroundImagePath(fileName)), '" alt="', escapeHtml(fileName), '">',
      token,
      "</span>"
    ].join("");
  }

  function buildImageFilesPipe(imageFiles) {
    return (imageFiles || []).join("|");
  }

  function buildFormPreviewTextStyle() {
    var config = getPageConfig();
    var style = "font-family:" + escapeHtml(config.fontFamily) + ";";

    if (String(config.fontStyle || "0") === "1") {
      style += "font-weight:bold;";
      style += "font-style:normal;";
    } else if (String(config.fontStyle || "0") === "2") {
      style += "font-weight:normal;";
      style += "font-style:italic;";
    } else if (String(config.fontStyle || "0") === "3") {
      style += "font-weight:bold;";
      style += "font-style:italic;";
    } else {
      style += "font-weight:normal;";
      style += "font-style:normal;";
    }

    return style;
  }

  function buildMoveButton(direction, index, disabled) {
    var isUp = direction === "up";
    var symbol = isUp ? "&#9650;" : "&#9660;";
    var label = isUp ? "Move row up" : "Move row down";

    return '<button type="button" id="sequence-row-' + direction + '-' + index + '" name="sequenceRow' + (isUp ? "Up" : "Down") + index + '" class="sequence-move-button row-button row-' + direction + '" data-index="' + index + '" aria-label="' + label + '"' + (disabled ? " disabled" : "") + ">" + symbol + "</button>";
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

    return '<select id="sequence-row-' + kind + '-' + index + '" name="sequenceRow' + (kind === "start" ? "Enter" : "Exit") + index + '" class="sequence-transition-select" data-kind="' + kind + '" data-index="' + index + '">' + options + "</select>";
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
    editingDefaultMessage = index === -2;
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
    editingDefaultMessage = false;
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

    if (editingDefaultMessage) {
      defaultMessageRow.text = record.text;
      defaultMessageRow.colors = record.colors;
    } else if (editingRowIndex >= 0) {
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
    var selectionStart = rawIndexToPlainTextIndex(text, selection.start);
    var selectionEnd = rawIndexToPlainTextIndex(text, selection.end);
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
    fields.modalPreview.style.lineHeight = config.fontSize + "px";
    fields.modalPreview.style.minHeight = Math.max(config.fontSize + 28, 54) + "px";
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
    var selectionStart = rawIndexToPlainTextIndex(text, getModalSelectionRange().start);
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

  function onDefaultMessageClick(event) {
    var target = event.target;

    if (target.classList.contains("default-message-edit")) {
      openRowModal(-2, defaultMessageRow);
      return;
    }

    if (target.classList.contains("default-message-clear")) {
      defaultMessageRow.text = "";
      defaultMessageRow.colors = "";
      updateMarquee();
    }
  }

  function onImageLibraryPreviewClick(event) {
    if (event.target && event.target.closest && event.target.closest(".image-chip")) {
      openImageManager();
    }
  }

  function openImageManager() {
    imageModalMode = "manage";
    renderImageModal();
    imageModal.hidden = false;
  }

  function openImageInsertPicker() {
    imageModalMode = "insert";
    renderImageModal();
    imageModal.hidden = false;
  }

  function closeImageModal() {
    imageModal.hidden = true;
    imageModalMode = "manage";
    if (!rowModal.hidden) {
      fields.modalText.focus();
      restoreModalSelection();
    }
  }

  function onImageModalShellClick(event) {
    if (event.target.hasAttribute("data-image-modal-close")) {
      closeImageModal();
    }
  }

  function onImageModalGridClick(event) {
    var button = event.target.closest ? event.target.closest(".image-picker-button") : null;
    var fileName;
    var selectedIndex;
    var wasSelected;

    if (!button) {
      return;
    }

    fileName = button.getAttribute("data-image-file");
    selectedIndex = selectedImageFiles.indexOf(fileName);
    wasSelected = selectedIndex >= 0;

    if (!wasSelected) {
      selectedImageFiles.push(fileName);
      selectedIndex = selectedImageFiles.length - 1;
    }

    if (imageModalMode === "insert" && !rowModal.hidden) {
      insertImageTokenIntoModal(selectedIndex);
      closeImageModal();
      updateMarquee();
      return;
    }

    if (wasSelected) {
      selectedImageFiles.splice(selectedIndex, 1);
    }

    renderImageLibraryPreview();
    renderImageModal();
    updateMarquee();
  }

  function insertImageTokenIntoModal(imageIndex) {
    var token = "$" + imageIndex;
    var text = fields.modalText.value || "";
    var selection = getModalSelectionRange();
    var start = selection.start;
    var end = selection.end;
    var nextText = text.slice(0, start) + token + text.slice(end);

    fields.modalText.value = nextText;
    fields.modalColors.value = normalizeColorPipeForText(
      nextText,
      fields.modalColors.value,
      getDefaultFontColorPipe()
    );
    modalSelectionStart = start + token.length;
    modalSelectionEnd = modalSelectionStart;
    pushModalHistoryState(getModalEditorState());
    updateModalEditorPreview();
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
    var safeText = String(text || "");
    var parsed = parseInlineMessageText(safeText);
    var colors = expandColorArrayForText(parsed.plainText, colorPipe, getDefaultFontColorPipe());
    var html = "";
    var itemIndex;
    var colorIndex = 0;
    var color;
    var item;
    var imageFile;

    if (!safeText) {
      return '<span class="sequence-text-char"> </span>';
    }

    for (itemIndex = 0; itemIndex < parsed.items.length; itemIndex += 1) {
      item = parsed.items[itemIndex];
      if (item.type === "image") {
        imageFile = selectedImageFiles[item.imageIndex];
        if (imageFile) {
          html += '<span class="image-token" title="' + escapeHtml("$" + item.imageIndex + " " + imageFile) + '"><img src="' + escapeHtml(resolvePreviewBackgroundImagePath(imageFile)) + '" alt="' + escapeHtml(imageFile) + '"></span>';
        } else {
          html += '<span class="sequence-text-char">' + escapeHtml("$" + item.imageIndex) + "</span>";
        }
        continue;
      }

      color = colors[colorIndex] || colors[colors.length - 1] || ("#" + getDefaultFontColorPipe().replace(/\|$/, ""));
      html += '<span class="sequence-text-char" data-char-index="' + colorIndex + '" style="color:' + escapeHtml(color) + ';">' + escapeHtml(item.value) + '</span>';
      colorIndex += 1;
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

  function parseInlineMessageText(text) {
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

  function rawIndexToPlainTextIndex(text, rawIndex) {
    var source = String(text || "");
    var plainIndex = 0;
    var index = 0;
    var nextIndex;

    while (index < source.length && index < rawIndex) {
      if (source.charAt(index) === "$") {
        if (source.charAt(index + 1) === "$") {
          plainIndex += 1;
          index += 2;
          continue;
        }

        nextIndex = index + 1;
        while (nextIndex < source.length && /[0-9]/.test(source.charAt(nextIndex))) {
          nextIndex += 1;
        }

        if (nextIndex > index + 1) {
          index = nextIndex;
          continue;
        }
      }

      plainIndex += 1;
      index += 1;
    }

    return plainIndex;
  }

  function expandColorArrayForText(text, colorPipe, fallback) {
    var safeText = parseInlineMessageText(text).plainText;
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

  function normalizeBackgroundMode(value) {
    if (value === "rain" || value === "snow" || value === "fireflies" || value === "dust" || value === "bubbles" || value === "bubble-pop" || value === "embers" || value === "sparkles" || value === "fog" || value === "comets" || value === "matrix" || value === "confetti" || value === "balls" || value === "static" || value === "leaves" || value === "fireworks") {
      return value;
    }

    return "stars";
  }

  function normalizeDotImageMode(value) {
    if (value === "images") {
      return "images";
    }

    return "none";
  }

  function normalizeBackgroundBanner(value) {
    var normalized = normalizeAssetPath(value, "");

    if (AVAILABLE_BANNER_FILES.indexOf(normalized) >= 0) {
      return normalized;
    }

    return "";
  }

  function normalizeBackgroundImagePlacement(value) {
    if (value === "tile" ||
      value === "center" ||
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

  function normalizeAssetPath(value, fallback) {
    var normalized = String(value || "").trim();

    if (!normalized) {
      return typeof fallback === "string" ? fallback : "";
    }

    return normalized;
  }

  function resolvePreviewBackgroundImagePath(assetPath) {
    var normalized = normalizeAssetPath(assetPath, "");
    var relativePath;

    if (!normalized) {
      return "";
    }

    if (/^(?:[a-z]+:)?\/\//i.test(normalized) || normalized.charAt(0) === "/" || normalized.indexOf("../") === 0 || normalized.indexOf("./") === 0) {
      return normalized;
    }

    relativePath = "../" + normalized;

    if (typeof window !== "undefined" && window.location && typeof window.location.href === "string" && typeof URL === "function") {
      return new URL(relativePath, window.location.href).href;
    }

    return relativePath;
  }

  function getModeScriptPath(modeName) {
    return MODE_SCRIPT_PATHS[normalizeBackgroundMode(modeName)] || MODE_SCRIPT_PATHS.stars;
  }

  function getEmbedModeScripts(modeName) {
    var scripts = [MODE_SCRIPT_PATHS.stars];
    var selectedPath = getModeScriptPath(modeName);

    if (selectedPath !== MODE_SCRIPT_PATHS.stars) {
      scripts.push(selectedPath);
    }

    return scripts;
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

  function loadFontCatalog() {
    if (!window.fetch) {
      return;
    }

    window.fetch("font-families.json?v=20260607").then(function (response) {
      if (!response || !response.ok) {
        throw new Error("Failed to load font catalog.");
      }

      return response.json();
    }).then(function (catalog) {
      applyFontCatalog(catalog, getSelectedFontFamilyId());
      updateMarquee();
      if (!rowModal.hidden) {
        updateModalEditorPreview();
      }
    }).catch(function () {
      applyFontCatalog(FALLBACK_FONT_CATALOG, getSelectedFontFamilyId());
      updateMarquee();
      if (!rowModal.hidden) {
        updateModalEditorPreview();
      }
    });
  }

  function applyFontCatalog(catalog, selectedId) {
    var list = Array.isArray(catalog) && catalog.length ? catalog : FALLBACK_FONT_CATALOG;
    var nextSelectedId = selectedId || DEFAULT_FONT_ID;
    var optionsHtml = [];
    var index;
    var entry;

    fontCatalog = [];
    fontCatalogById = {};

    for (index = 0; index < list.length; index += 1) {
      entry = normalizeFontCatalogEntry(list[index]);

      if (!entry || fontCatalogById[entry.id]) {
        continue;
      }

      fontCatalog.push(entry);
      fontCatalogById[entry.id] = entry;
    }

    if (!fontCatalogById[nextSelectedId]) {
      nextSelectedId = fontCatalogById[DEFAULT_FONT_ID] ? DEFAULT_FONT_ID : (fontCatalog[0] ? fontCatalog[0].id : "");
    }

    for (index = 0; index < fontCatalog.length; index += 1) {
      entry = fontCatalog[index];
      optionsHtml.push('<option value="' + escapeHtml(entry.id) + '"' + (entry.id === nextSelectedId ? " selected" : "") + ">" + escapeHtml(entry.label) + "</option>");
    }

    fields.fontFamily.innerHTML = optionsHtml.join("");
    fields.fontFamily.value = nextSelectedId;
  }

  function normalizeFontCatalogEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    if (!entry.id || !entry.family) {
      return null;
    }

    return {
      id: String(entry.id).trim(),
      label: String(entry.label || entry.family).trim(),
      family: String(entry.family).trim(),
      fallback: entry.fallback ? String(entry.fallback).trim() : ""
    };
  }

  function getSelectedFontFamilyId() {
    var value = fields.fontFamily && fields.fontFamily.value ? String(fields.fontFamily.value).trim() : "";

    if (value && fontCatalogById[value]) {
      return value;
    }

    if (fontCatalogById[DEFAULT_FONT_ID]) {
      return DEFAULT_FONT_ID;
    }

    return fontCatalog[0] ? fontCatalog[0].id : DEFAULT_FONT_ID;
  }

  function resolveFontFamilyStack(fontFamilyId) {
    var resolvedFamilies = [];
    var seenIds = {};
    var seenFamilies = {};
    var currentId = fontFamilyId;
    var entry;
    var family;

    if (!fontCatalogById[currentId] && fontCatalogById[DEFAULT_FONT_ID]) {
      currentId = DEFAULT_FONT_ID;
    }

    while (currentId && fontCatalogById[currentId] && !seenIds[currentId]) {
      entry = fontCatalogById[currentId];
      family = entry.family;
      seenIds[currentId] = true;

      if (family && !seenFamilies[family]) {
        resolvedFamilies.push(family);
        seenFamilies[family] = true;
      }

      if (!entry.fallback || !fontCatalogById[entry.fallback]) {
        break;
      }

      currentId = entry.fallback;
    }

    if (!resolvedFamilies.length) {
      return '"Times New Roman", Times, serif';
    }

    return resolvedFamilies.join(", ");
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

  function stringifyForCode(value, indentSize) {
    return JSON.stringify(value, null, indentSize || 2).replace(/<\/script/gi, "<\\/script");
  }

  function updateGeneratedFileHeading() {
    var fileName;

    if (!generatedFileHeading) {
      return;
    }

    fileName = getSequenceFileName();
    generatedFileHeading.innerHTML = fileName ? ("Generated `" + escapeHtml(fileName) + "`") : "Generated Message File";
  }

  function getSequenceFileName() {
    var value = fields.fileName && fields.fileName.value ? String(fields.fileName.value).trim() : "";
    return value;
  }
}());
