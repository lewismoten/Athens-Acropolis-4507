(function () {
  function renderTrackSoundMapper(song, options) {
    var playableSummaries;
    var html = [];

    if (!song || !song.trackSummaries) {
      options.target.innerHTML = "";
      return;
    }

    playableSummaries = options.getPlayableSummariesSorted(song);

    if (!playableSummaries.length) {
      options.target.innerHTML = "";
      return;
    }

    html.push("<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table\">");
    html.push("<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"4\">Track Sound Mapper</TH></TR>");
    html.push("<TR><TD COLSPAN=\"4\" CLASS=\"soundtrack-mapper-bias-row\">" +
      "<LABEL FOR=\"mapping-bias-select\" CLASS=\"soundtrack-mapper-bias-label\">Global mapping mode:</LABEL>" +
      "<SELECT ID=\"mapping-bias-select\" CLASS=\"soundtrack-mapper-bias-select\">" +
      renderMappingBiasOption("auto", "Auto by MIDI/program", options.getMappingBias()) +
      renderMappingBiasOption("samples", "Use sample bank defaults", options.getMappingBias()) +
      renderMappingBiasOption("wave:sine", "All melodic -> Sine", options.getMappingBias()) +
      renderMappingBiasOption("wave:triangle", "All melodic -> Triangle", options.getMappingBias()) +
      renderMappingBiasOption("wave:square", "All melodic -> Square", options.getMappingBias()) +
      renderMappingBiasOption("wave:sawtooth", "All melodic -> Saw", options.getMappingBias()) +
      "</SELECT>" +
      "<SPAN CLASS=\"soundtrack-mapper-bias-note\">Drums still stay mapped as drums.</SPAN>" +
      "</TD></TR>");
    html.push("<TR BGCOLOR=\"#000033\" CLASS=\"soundtrack-table-subhead\"><TH ALIGN=\"LEFT\">Track</TH><TH ALIGN=\"LEFT\">Source</TH><TH ALIGN=\"LEFT\">Playback Sound</TH><TH ALIGN=\"LEFT\">Preview</TH></TR>");

    playableSummaries.forEach(function (summary) {
      var event = options.findFirstTrackEvent(song, summary.index);
      var currentConfig = normalizeTrackSoundChoice(options.trackSoundMap[summary.index] || suggestSoundChoice(summary, event, options), event, summary, options);
      var currentChoice = getTrackSoundSelectValue(currentConfig);
      var sourceText = event ? options.formatChannelProgram(event) : "playable";
      var label = options.getPreferredTrackLabel(summary, event);
      var drumRows;

      html.push("<TR>" +
        "<TD><SPAN CLASS=\"soundtrack-table-label\">" + options.escapeHtml(label) + "</SPAN></TD>" +
        "<TD>" + options.escapeHtml(sourceText) + "</TD>" +
        "<TD>" +
        "<SELECT DATA-TRACK-SOUND=\"" + summary.index + "\" CLASS=\"soundtrack-mapper-track-select\">" +
        renderSoundOption("program:35", "35: Fretless Bass F2", currentChoice, options) +
        renderSoundOption("program:50", "50: String Ensemble G4", currentChoice, options) +
        renderSoundOption("program:99", "99: Goblins Unicorn C4", currentChoice, options) +
        renderSoundOption("wave:sine", "Wave: Sine", currentChoice, options) +
        renderSoundOption("wave:triangle", "Wave: Triangle", currentChoice, options) +
        renderSoundOption("wave:square", "Wave: Square", currentChoice, options) +
        renderSoundOption("wave:sawtooth", "Wave: Saw", currentChoice, options) +
        renderSoundOption("drumkit", "Drum Kit", currentChoice, options) +
        "</SELECT>" +
        "</TD>" +
        "<TD ALIGN=\"CENTER\"><DIV CLASS=\"soundtrack-preview-wrap\">" + renderSoundPreview(currentConfig) + renderPreviewButton("sound", summary.index, "") + "</DIV></TD>" +
        "</TR>");

      if (currentChoice === "drumkit") {
        if (event && event.channel === 9) {
          drumRows = getTrackDrumCounts(song, summary.index);
          if (drumRows.length) {
            html.push("<TR BGCOLOR=\"#000025\"><TD COLSPAN=\"4\" CLASS=\"soundtrack-drum-config-row\">" +
              "<DIV CLASS=\"soundtrack-drum-config-note\">Map each drum note in this track to one of the available sample sounds.</DIV>");
            drumRows.forEach(function (entry) {
              var mappedNote = currentConfig.drumMap[entry.note] !== undefined ? Number(currentConfig.drumMap[entry.note]) : suggestDrumSampleNote(entry.note, options);
              html.push(
                "<DIV CLASS=\"soundtrack-drum-config-line\">" +
                "<SPAN CLASS=\"soundtrack-drum-config-label\">" + options.escapeHtml(entry.note + " " + options.getDrumName(entry.note) + " x" + entry.count) + "</SPAN>" +
                "<SELECT DATA-TRACK-DRUM=\"" + summary.index + "\" DATA-SOURCE-NOTE=\"" + entry.note + "\" CLASS=\"soundtrack-mapper-drum-select\">" +
                renderDrumSampleOptions(mappedNote, options) +
                "</SELECT>" +
                "<SPAN DATA-TRACK-DRUM-PREVIEW=\"" + summary.index + "\" DATA-SOURCE-NOTE=\"" + entry.note + "\" CLASS=\"soundtrack-drum-preview-slot\">" + renderDrumPreview(mappedNote, options) + "</SPAN>" +
                renderPreviewButton("drum", summary.index, entry.note) +
                "</DIV>"
              );
            });
            html.push("</TD></TR>");
          }
        } else {
          html.push("<TR BGCOLOR=\"#000025\"><TD COLSPAN=\"4\" CLASS=\"soundtrack-drum-config-row\">" +
            "<DIV CLASS=\"soundtrack-drum-config-note\">This track is melodic, so choose which single drum sample should stand in for every note.</DIV>" +
            "<DIV CLASS=\"soundtrack-drum-config-line\">" +
            "<SPAN CLASS=\"soundtrack-drum-config-label\">Use this drum sound</SPAN>" +
            "<SELECT DATA-TRACK-FORCED-DRUM=\"" + summary.index + "\" CLASS=\"soundtrack-mapper-drum-select\">" +
            renderDrumSampleOptions(currentConfig.drumNote || suggestTrackDrumSampleNote(summary, event), options) +
            "</SELECT>" +
            "<SPAN DATA-TRACK-FORCED-DRUM-PREVIEW=\"" + summary.index + "\" CLASS=\"soundtrack-drum-preview-slot\">" + renderDrumPreview(currentConfig.drumNote || suggestTrackDrumSampleNote(summary, event), options) + "</SPAN>" +
            renderPreviewButton("forced-drum", summary.index, "") +
            "</DIV>" +
            "</TD></TR>");
        }
      }
    });

    html.push("</TABLE>");
    options.target.innerHTML = html.join("");

    bindMapperEvents(song, options);
  }

  function bindMapperEvents(song, options) {
    Array.prototype.forEach.call(options.target.querySelectorAll("select[data-track-sound]"), function (select) {
      select.onchange = function () {
        var trackIndex = Number(select.getAttribute("data-track-sound"));
        var summary = song.trackSummaries[trackIndex];
        var event = options.findFirstTrackEvent(song, trackIndex);
        var existing = normalizeTrackSoundChoice(options.trackSoundMap[trackIndex], event, summary, options);
        var nextChoice;

        if (select.value === "drumkit") {
          nextChoice = {
            mode: "drumkit",
            drumNote: event && event.channel !== 9 ? (existing.drumNote || suggestTrackDrumSampleNote(summary, event)) : null,
            drumMap: event && event.channel === 9 ? (existing.drumMap || {}) : {}
          };
        } else {
          nextChoice = select.value;
        }

        options.applyTrackSoundChoice(trackIndex, nextChoice, song);
      };
    });

    Array.prototype.forEach.call(options.target.querySelectorAll("select[data-track-drum]"), function (select) {
      select.onchange = function () {
        var trackIndex = Number(select.getAttribute("data-track-drum"));
        var sourceNote = Number(select.getAttribute("data-source-note"));
        var summary = song.trackSummaries[trackIndex];
        var event = options.findFirstTrackEvent(song, trackIndex);
        var currentConfig = normalizeTrackSoundChoice(options.trackSoundMap[trackIndex], event, summary, options);
        var preview = options.target.querySelector("span[data-track-drum-preview=\"" + trackIndex + "\"][data-source-note=\"" + sourceNote + "\"]");

        currentConfig.mode = "drumkit";
        currentConfig.drumMap[sourceNote] = Number(select.value);
        if (preview) {
          preview.innerHTML = renderDrumPreview(Number(select.value), options);
        }
        options.applyTrackSoundChoice(trackIndex, currentConfig, song);
      };
    });

    Array.prototype.forEach.call(options.target.querySelectorAll("select[data-track-forced-drum]"), function (select) {
      select.onchange = function () {
        var trackIndex = Number(select.getAttribute("data-track-forced-drum"));
        var summary = song.trackSummaries[trackIndex];
        var event = options.findFirstTrackEvent(song, trackIndex);
        var currentConfig = normalizeTrackSoundChoice(options.trackSoundMap[trackIndex], event, summary, options);
        var preview = options.target.querySelector("span[data-track-forced-drum-preview=\"" + trackIndex + "\"]");

        currentConfig.mode = "drumkit";
        currentConfig.drumNote = Number(select.value);
        if (preview) {
          preview.innerHTML = renderDrumPreview(Number(select.value), options);
        }
        options.applyTrackSoundChoice(trackIndex, currentConfig, song);
      };
    });

    Array.prototype.forEach.call(options.target.querySelectorAll("select#mapping-bias-select"), function (select) {
      select.onchange = function () {
        options.setMappingBias(select.value);
        options.resetTrackSoundMap();
        options.ensureTrackSoundDefaults(song);
        if (options.onMapperChanged) {
          options.onMapperChanged(song);
        }
        renderTrackSoundMapper(song, options);
      };
    });

    Array.prototype.forEach.call(options.target.querySelectorAll("button[data-preview-kind]"), function (button) {
      var holdTimer = null;
      var holdStarted = false;
      var holdDelayMs = 170;

      function clearHoldTimer() {
        if (holdTimer !== null) {
          window.clearTimeout(holdTimer);
          holdTimer = null;
        }
      }

      function resolvePreviewValue() {
        var kind = button.getAttribute("data-preview-kind");
        var trackIndex = Number(button.getAttribute("data-track-index"));
        var sourceNote = button.getAttribute("data-source-note");
        var summary = song.trackSummaries[trackIndex];
        var event = options.findFirstTrackEvent(song, trackIndex);
        var currentConfig = normalizeTrackSoundChoice(options.trackSoundMap[trackIndex] || suggestSoundChoice(summary, event, options), event, summary, options);
        var previewValue = currentConfig;

        if (kind === "drum") {
          previewValue = Number((currentConfig.drumMap && currentConfig.drumMap[sourceNote] !== undefined) ? currentConfig.drumMap[sourceNote] : suggestDrumSampleNote(Number(sourceNote), options));
        } else if (kind === "forced-drum") {
          previewValue = Number(currentConfig.drumNote || suggestTrackDrumSampleNote(summary, event));
        }

        return previewValue;
      }

      function startPreview(eventObject) {
        if (eventObject && eventObject.preventDefault) {
          eventObject.preventDefault();
        }

        clearHoldTimer();
        holdStarted = false;
        holdTimer = window.setTimeout(function () {
          holdStarted = true;
          holdTimer = null;
          if (options.controller && options.controller.startPreviewSoundChoice) {
            options.controller.startPreviewSoundChoice(resolvePreviewValue());
          }
        }, holdDelayMs);
      }

      function stopPreview(eventObject) {
        if (eventObject && eventObject.preventDefault) {
          eventObject.preventDefault();
        }

        clearHoldTimer();

        if (holdStarted && options.controller && options.controller.stopPreviewSoundChoice) {
          options.controller.stopPreviewSoundChoice();
        }
        holdStarted = false;
      }

      function clickPreview(eventObject) {
        if (eventObject && eventObject.preventDefault) {
          eventObject.preventDefault();
        }

        clearHoldTimer();
        if (!holdStarted && options.controller && options.controller.previewSoundChoice) {
          options.controller.previewSoundChoice(resolvePreviewValue());
        }
        holdStarted = false;
      }

      button.onmousedown = startPreview;
      button.onmouseup = stopPreview;
      button.onmouseleave = stopPreview;
      button.onmouseout = stopPreview;
      button.ontouchstart = startPreview;
      button.ontouchend = stopPreview;
      button.ontouchcancel = stopPreview;
      button.onclick = clickPreview;
    });
  }

  function getTrackSoundChoice(trackIndex, event, summary, options) {
    return options.trackSoundMap[trackIndex] || suggestSoundChoice(summary, event, options);
  }

  function suggestSoundChoice(summary, event, options) {
    var name = ((summary && summary.name) || "").toLowerCase();
    var program = event ? event.program : -1;
    var forcedWave = getForcedWaveBias(options);

    if (event && (event.channel === 9 || isDrumBankSelected(event.bankMsb, event.bankLsb))) {
      return "drumkit";
    }

    if (program === 47 || name.indexOf("timpani") >= 0) {
      return "drumkit";
    }

    if (forcedWave) {
      return forcedWave;
    }

    if (program === 35 || program === 36 || (program >= 32 && program <= 39) || name.indexOf("bass") >= 0) {
      return "program:35";
    }

    if (isLowBassFallbackProgram(program) || name.indexOf("cello") >= 0 || name.indexOf("trombone") >= 0 || name.indexOf("tuba") >= 0 || name.indexOf("oboe") >= 0) {
      return "program:35";
    }

    if (isAmbientBellProgram(program) ||
        name.indexOf("harp") >= 0 ||
        name.indexOf("glock") >= 0 ||
        name.indexOf("xylophone") >= 0 ||
        name.indexOf("vibraphone") >= 0 ||
        name.indexOf("celesta") >= 0 ||
        name.indexOf("music box") >= 0 ||
        name.indexOf("bell") >= 0) {
      return "program:99";
    }

    if (program === 50 || program === 48 || (program >= 48 && program <= 55) || name.indexOf("string") >= 0) {
      return "program:50";
    }

    if (program === 99 || program >= 96 || name.indexOf("atmos") >= 0 || name.indexOf("fx") >= 0 || name.indexOf("pad") >= 0) {
      return "program:99";
    }

    if (name.indexOf("drum") >= 0 || name.indexOf("percussion") >= 0 || name.indexOf("gunshot") >= 0) {
      return "drumkit";
    }

    if (name.indexOf("melody") >= 0 || name.indexOf("lead") >= 0 || name.indexOf("theme") >= 0) {
      return "program:50";
    }

    return "program:50";
  }

  function getForcedWaveBias(options) {
    if (options.getMappingBias() && options.getMappingBias().indexOf("wave:") === 0) {
      return options.getMappingBias();
    }

    return "";
  }

  function isDrumBankSelected(bankMsb, bankLsb) {
    return bankMsb === 120 || bankMsb === 126 || bankMsb === 127 || bankLsb === 120 || bankLsb === 126 || bankLsb === 127;
  }

  function isLowBassFallbackProgram(program) {
    return program === 42 || program === 43 || program === 57 || program === 58 || program === 67 || program === 68 || program === 69 || program === 70;
  }

  function isAmbientBellProgram(program) {
    return program === 8 || program === 9 || program === 10 || program === 11 || program === 12 || program === 13 || program === 14 || program === 46;
  }

  function getSoundChoiceRole(choice, options) {
    var config = normalizeTrackSoundChoice(choice, null, null, options);

    if (config.mode === "program" && config.program === 35) {
      return "Bass";
    }
    if (config.mode === "program" && config.program === 50) {
      return "Strings";
    }
    if (config.mode === "program" && config.program === 99) {
      return "Atmosphere";
    }
    if (config.mode === "wave" && config.waveform === "triangle") {
      return "Bass";
    }
    if (config.mode === "wave" && (config.waveform === "square" || config.waveform === "sawtooth")) {
      return "Lead";
    }
    if (config.mode === "wave" && config.waveform === "sine") {
      return "Tone";
    }
    if (config.mode === "drumkit") {
      return "Drums";
    }
    return "Audio";
  }

  function getDisplayLaneName(displayName, role) {
    if (displayName === "Drums" && role !== "Drums") {
      return displayName + " (" + role + ")";
    }

    return displayName;
  }

  function formatSoundChoice(choice, options) {
    var config = normalizeTrackSoundChoice(choice, null, null, options);
    var drumMapKeys;

    if (config.mode === "program" && config.program === 35) {
      return "35: Fretless Bass F2";
    }
    if (config.mode === "program" && config.program === 50) {
      return "50: String Ensemble G4";
    }
    if (config.mode === "program" && config.program === 99) {
      return "99: Goblins Unicorn C4";
    }
    if (config.mode === "drumkit") {
      drumMapKeys = Object.keys(config.drumMap || {});
      if (drumMapKeys.length) {
        return "Drum Kit (custom " + drumMapKeys.length + ")";
      }
      if (config.drumNote) {
        return "Drum Kit -> " + options.getDrumName(config.drumNote);
      }
      return "Drum Kit";
    }
    if (config.mode === "wave") {
      return "Wave: " + capitalizeWaveName(config.waveform);
    }
    return "Auto";
  }

  function normalizeTrackSoundChoice(choice, event, summary, options) {
    if (choice && typeof choice === "object") {
      return {
        mode: choice.mode === "drumkit" ? "drumkit" : (choice.mode === "wave" ? "wave" : "program"),
        program: Number(choice.program) || 50,
        waveform: choice.waveform || "sine",
        drumNote: choice.drumNote !== undefined && choice.drumNote !== null ? Number(choice.drumNote) : null,
        drumMap: cloneDrumMap(choice.drumMap)
      };
    }

    if (typeof choice === "string") {
      if (choice === "drumkit") {
        return {
          mode: "drumkit",
          program: 0,
          drumNote: event && event.channel !== 9 ? suggestTrackDrumSampleNote(summary, event) : null,
          drumMap: {}
        };
      }
      if (choice.indexOf("program:") === 0) {
        return {
          mode: "program",
          program: Number(choice.split(":")[1]) || 50,
          waveform: "sine",
          drumNote: null,
          drumMap: {}
        };
      }
      if (choice.indexOf("wave:") === 0) {
        return {
          mode: "wave",
          program: 50,
          waveform: choice.split(":")[1] || "sine",
          drumNote: null,
          drumMap: {}
        };
      }
    }

    if (event || summary) {
      return normalizeTrackSoundChoice(suggestSoundChoice(summary, event, options), event, summary, options);
    }

    return {
      mode: "program",
      program: 50,
      waveform: "sine",
      drumNote: null,
      drumMap: {}
    };
  }

  function getTrackSoundSelectValue(config) {
    if (!config || config.mode === "drumkit") {
      return "drumkit";
    }
    if (config.mode === "wave") {
      return "wave:" + (config.waveform || "sine");
    }
    return "program:" + config.program;
  }

  function capitalizeWaveName(name) {
    var value = String(name || "sine");
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function renderSoundPreview(config) {
    var svg;
    var label = "";
    var stroke = "#99ccff";
    var bg = "#000018";
    var path = "";
    var extras = "";

    if (config.mode === "program" && config.program === 35) {
      stroke = "#66ff99";
      label = "sample";
      path = "M2,19 L6,17 L10,22 L14,13 L18,24 L22,12 L26,26 L30,14 L34,22 L38,16 L42,24 L46,18 L50,21 L54,17 L58,20 L62,19";
    } else if (config.mode === "program" && config.program === 50) {
      stroke = "#66ccff";
      label = "sample";
      path = "M2,20 C5,11 8,11 11,20 S17,29 20,20 S26,11 29,20 S35,29 38,20 S44,11 47,20 S53,29 56,20 S59,11 62,20";
    } else if (config.mode === "program" && config.program === 99) {
      stroke = "#cc99ff";
      label = "sample";
      path = "M2,20 C8,6 14,28 20,12 S30,30 38,10 S50,22 62,18";
    } else if (config.mode === "drumkit") {
      stroke = "#ffcc66";
      label = "drum";
      path = "M10,16 L24,16 M17,9 L17,23 M8,10 L26,22 M8,22 L26,10";
      extras = "<circle cx=\"42\" cy=\"16\" r=\"5\" fill=\"none\" stroke=\"#ffcc66\" stroke-width=\"2\"/>" +
        "<path d=\"M34,16 H28 M56,16 H50 M42,8 V2 M42,30 V24\" stroke=\"#ffcc66\" stroke-width=\"2\" stroke-linecap=\"round\"/>";
    } else if (config.mode === "wave") {
      stroke = config.waveform === "triangle" ? "#66ffcc" : (config.waveform === "square" ? "#ffcc99" : (config.waveform === "sawtooth" ? "#ff99cc" : "#ccccff"));
      label = config.waveform;
      if (config.waveform === "triangle") {
        path = "M2,24 L16,8 L30,24 L44,8 L58,24";
      } else if (config.waveform === "square") {
        path = "M2,24 L2,10 L16,10 L16,24 L30,24 L30,10 L44,10 L44,24 L58,24 L58,10 L62,10";
      } else if (config.waveform === "sawtooth") {
        path = "M2,24 L14,10 L14,24 L26,10 L26,24 L38,10 L38,24 L50,10 L50,24 L62,10";
      } else {
        path = "M2,20 C10,8 18,8 26,20 S42,32 50,20 S58,8 62,20";
      }
    } else {
      label = "?";
      path = "M2,20 C10,12 18,28 26,20 S42,12 50,20 S58,28 62,20";
    }

    svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"44\" height=\"44\" viewBox=\"0 0 64 32\">" +
      "<rect x=\"0.5\" y=\"0.5\" width=\"63\" height=\"31\" rx=\"3\" ry=\"3\" fill=\"" + bg + "\" stroke=\"#555588\"/>" +
      "<path d=\"" + path + "\" fill=\"none\" stroke=\"" + stroke + "\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" +
      extras +
      "<text x=\"60\" y=\"10\" font-size=\"6\" fill=\"#aaaaee\" text-anchor=\"end\">" + label + "</text>" +
      "</svg>";

    return svg;
  }

  function cloneDrumMap(drumMap) {
    var clone = {};

    Object.keys(drumMap || {}).forEach(function (key) {
      clone[key] = Number(drumMap[key]);
    });

    return clone;
  }

  function getTrackDrumCounts(song, trackIndex) {
    var counts = {};

    (song.events || []).forEach(function (event) {
      if (event.trackIndex === trackIndex && event.channel === 9) {
        counts[event.note] = (counts[event.note] || 0) + 1;
      }
    });

    return Object.keys(counts).map(function (note) {
      return {
        note: Number(note),
        count: counts[note]
      };
    }).sort(function (left, right) {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.note - right.note;
    });
  }

  function suggestDrumSampleNote(note, options) {
    var directHit = options.drumSampleOptions.some(function (option) {
      return option.note === note;
    });

    if (directHit) {
      return note;
    }

    return options.drumFallbackNotes[note] || 42;
  }

  function suggestTrackDrumSampleNote(summary, event) {
    var name = ((summary && summary.name) || "").toLowerCase();
    var program = event ? event.program : -1;

    if (program === 127 || name.indexOf("gun") >= 0 || name.indexOf("shot") >= 0 || name.indexOf("crash") >= 0) {
      return 49;
    }
    if (name.indexOf("ride") >= 0) {
      return 51;
    }
    if (name.indexOf("tamb") >= 0) {
      return 54;
    }
    if (name.indexOf("cabasa") >= 0 || name.indexOf("shaker") >= 0 || name.indexOf("perc") >= 0) {
      return 69;
    }
    if (name.indexOf("hat") >= 0 || name.indexOf("hh") >= 0) {
      return 42;
    }
    if (program === 35 || program === 36 || (program >= 32 && program <= 39) || name.indexOf("bass") >= 0) {
      return 54;
    }
    return 42;
  }

  function renderSoundOption(value, label, currentChoice, options) {
    return "<OPTION VALUE=\"" + value + "\"" + (value === currentChoice ? " SELECTED" : "") + ">" + options.escapeHtml(label) + "</OPTION>";
  }

  function renderMappingBiasOption(value, label, currentValue) {
    return "<OPTION VALUE=\"" + value + "\"" + (value === currentValue ? " SELECTED" : "") + ">" + label + "</OPTION>";
  }

  function renderPreviewButton(kind, trackIndex, sourceNote) {
    return "<BUTTON TYPE=\"BUTTON\" DATA-PREVIEW-KIND=\"" + kind + "\" DATA-TRACK-INDEX=\"" + trackIndex + "\"" +
      (sourceNote !== "" ? " DATA-SOURCE-NOTE=\"" + sourceNote + "\"" : "") +
      " TITLE=\"Play preview\" CLASS=\"soundtrack-preview-button\">&#9654;</BUTTON>";
  }

  function renderDrumSampleOptions(selectedNote, options) {
    return options.drumSampleOptions.map(function (option) {
      return "<OPTION VALUE=\"" + option.note + "\"" + (Number(selectedNote) === option.note ? " SELECTED" : "") + ">" + options.escapeHtml(option.label) + "</OPTION>";
    }).join("");
  }

  function renderDrumPreview(note, options) {
    var color = "#ffcc66";
    var label = String(note || "");
    var path = "M10,16 L24,16 M17,9 L17,23 M8,10 L26,22 M8,22 L26,10";
    var extras = "<circle cx=\"42\" cy=\"16\" r=\"5\" fill=\"none\" stroke=\"#ffcc66\" stroke-width=\"2\"/>" +
      "<path d=\"M34,16 H28 M56,16 H50 M42,8 V2 M42,30 V24\" stroke=\"#ffcc66\" stroke-width=\"2\" stroke-linecap=\"round\"/>";

    if (Number(note) === 42 || Number(note) === 46) {
      path = "M8,12 H26 M8,20 H26";
      extras = "<path d=\"M38,10 Q42,6 46,10 M38,16 Q42,12 46,16 M38,22 Q42,18 46,22\" fill=\"none\" stroke=\"#ffcc66\" stroke-width=\"2\" stroke-linecap=\"round\"/>";
    } else if (Number(note) === 49 || Number(note) === 51) {
      path = "M9,16 H25 M17,8 V24";
      extras = "<circle cx=\"42\" cy=\"16\" r=\"7\" fill=\"none\" stroke=\"#ffcc66\" stroke-width=\"2\"/><path d=\"M42,4 V0 M42,32 V28 M30,16 H26 M58,16 H54\" stroke=\"#ffcc66\" stroke-width=\"2\" stroke-linecap=\"round\"/>";
    } else if (Number(note) === 54) {
      path = "M8,16 L16,8 L24,16 L16,24 Z";
      extras = "<circle cx=\"40\" cy=\"11\" r=\"2\" fill=\"#ffcc66\"/><circle cx=\"47\" cy=\"16\" r=\"2\" fill=\"#ffcc66\"/><circle cx=\"40\" cy=\"21\" r=\"2\" fill=\"#ffcc66\"/><circle cx=\"33\" cy=\"16\" r=\"2\" fill=\"#ffcc66\"/>";
    } else if (Number(note) === 69) {
      path = "M10,10 Q16,4 22,10 Q16,16 10,10";
      extras = "<path d=\"M34,8 Q42,2 50,8 Q42,14 34,8 M34,16 Q42,10 50,16 Q42,22 34,16 M34,24 Q42,18 50,24 Q42,30 34,24\" fill=\"none\" stroke=\"#ffcc66\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>";
    }

    return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"44\" height=\"44\" viewBox=\"0 0 64 32\">" +
      "<rect x=\"0.5\" y=\"0.5\" width=\"63\" height=\"31\" rx=\"3\" ry=\"3\" fill=\"#000018\" stroke=\"#555588\"/>" +
      "<path d=\"" + path + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>" +
      extras +
      "<text x=\"60\" y=\"10\" font-size=\"6\" fill=\"#aaaaee\" text-anchor=\"end\">" + options.escapeHtml(label) + "</text>" +
      "</svg>";
  }

  window.ShoomiIndexPageMapper = {
    renderTrackSoundMapper: renderTrackSoundMapper,
    getTrackSoundChoice: getTrackSoundChoice,
    suggestSoundChoice: suggestSoundChoice,
    getSoundChoiceRole: getSoundChoiceRole,
    getDisplayLaneName: getDisplayLaneName,
    formatSoundChoice: formatSoundChoice,
    normalizeTrackSoundChoice: normalizeTrackSoundChoice,
    suggestDrumSampleNote: suggestDrumSampleNote,
    suggestTrackDrumSampleNote: suggestTrackDrumSampleNote
  };
}());
