(function () {
  function updateCurrentScoreState(song, currentPosition, options) {
    var tempoText = "";
    var timeSignatureText = "";
    var keySignatureText = "";
    var tempoEntry;
    var timeSignatureEvent;
    var keySignatureEvent;
    var parts = [];

    if (!song) {
      options.metaStateStatus.innerHTML = "";
      return;
    }

    tempoEntry = getTempoEntryAtTime(song, currentPosition);
    timeSignatureEvent = getLastInfoEventAtTime(song, "timeSignature", currentPosition);
    keySignatureEvent = getLastInfoEventAtTime(song, "keySignature", currentPosition);

    if (tempoEntry) {
      tempoText = Math.round((60000000 / tempoEntry.microsecondsPerQuarter) * 100) / 100 + " BPM";
      parts.push("<SPAN CLASS=\"soundtrack-state-key\">Tempo:</SPAN> <SPAN CLASS=\"soundtrack-state-value\">" + options.escapeHtml(tempoText) + "</SPAN>");
    }

    if (timeSignatureEvent) {
      timeSignatureText = timeSignatureEvent.label;
      parts.push("<SPAN CLASS=\"soundtrack-state-key\">Time:</SPAN> <SPAN CLASS=\"soundtrack-state-value\">" + options.escapeHtml(timeSignatureText) + "</SPAN>");
    }

    if (keySignatureEvent) {
      keySignatureText = keySignatureEvent.label;
      parts.push("<SPAN CLASS=\"soundtrack-state-key\">Key:</SPAN> <SPAN CLASS=\"soundtrack-state-value\">" + options.escapeHtml(keySignatureText) + "</SPAN>");
    }

    if (!parts.length) {
      options.metaStateStatus.innerHTML = "<SPAN CLASS=\"soundtrack-note-dim\">No persistent score-state markers are defined for this point in the song.</SPAN>";
      updateRegisterStateVisibility(song, currentPosition, options);
      return;
    }

    options.metaStateStatus.innerHTML = "<SPAN CLASS=\"soundtrack-state-key\">Current score state:</SPAN> " + parts.join(" <SPAN CLASS=\"soundtrack-state-sep\">|</SPAN> ");
    updateRegisterStateVisibility(song, currentPosition, options);
  }

  function updateRegisterStateVisibility(song, currentPosition, options) {
    if (!options.registerStateToggle.checked) {
      options.registerStateStatus.style.display = "none";
      options.registerStateStatus.innerHTML = "";
      return;
    }

    updateRegisterStateTable(song, currentPosition, options);
  }

  function updateRegisterStateTable(song, currentPosition, options) {
    var channelStates;

    if (!song) {
      options.registerStateStatus.style.display = "none";
      options.registerStateStatus.innerHTML = "";
      return;
    }

    channelStates = buildCurrentRegisterStates(song, currentPosition).filter(function (state) {
      return state.nrpnMsb !== null || state.nrpnLsb !== null || state.rpnMsb !== null || state.rpnLsb !== null || state.dataEntry !== null;
    });

    if (!channelStates.length) {
      options.registerStateStatus.style.display = "block";
      options.registerStateStatus.innerHTML = "<SPAN CLASS=\"soundtrack-note-dim\">No NRPN, RPN, or Data Entry register state is active at this point in the song.</SPAN>";
      return;
    }

    options.registerStateStatus.style.display = "block";
    options.registerStateStatus.innerHTML =
      "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table soundtrack-table-dark\">" +
      "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"5\">Current channel register state</TH></TR>" +
      "<TR BGCOLOR=\"#000033\" CLASS=\"soundtrack-table-subhead\"><TH ALIGN=\"LEFT\">Channel</TH><TH ALIGN=\"LEFT\">NRPN</TH><TH ALIGN=\"LEFT\">RPN</TH><TH ALIGN=\"LEFT\">Selected Register</TH><TH ALIGN=\"LEFT\">Data</TH></TR>" +
      channelStates.map(function (state) {
        return "<TR>" +
          "<TD CLASS=\"soundtrack-table-label\">Ch " + options.escapeHtml(String(state.channel + 1)) + "</TD>" +
          "<TD>" + options.escapeHtml(formatRegisterKey(state.nrpnMsb, state.nrpnLsb)) + "</TD>" +
          "<TD>" + options.escapeHtml(formatRegisterKey(state.rpnMsb, state.rpnLsb)) + "</TD>" +
          "<TD>" + options.escapeHtml(formatActiveRegisterLabel(state)) + "</TD>" +
          "<TD CLASS=\"soundtrack-table-cell-warning\">" + options.escapeHtml(state.dataEntry === null ? "-" : String(state.dataEntry)) + "</TD>" +
          "</TR>";
      }).join("") +
      "</TABLE>" +
      "<DIV CLASS=\"soundtrack-note-dim soundtrack-note-dim-tight\">Register state is channel-based, so tracks sharing a MIDI channel can read the same selected NRPN or RPN register and Data Entry value.</DIV>";
  }

  function buildCurrentRegisterStates(song, currentPosition) {
    var states = {};

    (song.infoEvents || []).forEach(function (event) {
      var state;

      if (event.type !== "controlChange" || event.channel === undefined || event.channel === null || event.start > currentPosition) {
        return;
      }

      if (event.controller !== 98 && event.controller !== 99 && event.controller !== 100 && event.controller !== 101 && event.controller !== 6) {
        return;
      }

      if (!states[event.channel]) {
        states[event.channel] = {
          channel: event.channel,
          nrpnMsb: null,
          nrpnLsb: null,
          rpnMsb: null,
          rpnLsb: null,
          activeType: "",
          dataEntry: null
        };
      }

      state = states[event.channel];

      if (event.controller === 99) {
        state.nrpnMsb = event.value;
        state.activeType = "NRPN";
      } else if (event.controller === 98) {
        state.nrpnLsb = event.value;
        state.activeType = "NRPN";
      } else if (event.controller === 101) {
        state.rpnMsb = event.value;
        state.activeType = "RPN";
      } else if (event.controller === 100) {
        state.rpnLsb = event.value;
        state.activeType = "RPN";
      } else if (event.controller === 6) {
        state.dataEntry = event.value;
      }
    });

    return Object.keys(states).map(function (channel) {
      return states[channel];
    }).sort(function (left, right) {
      return left.channel - right.channel;
    });
  }

  function formatRegisterKey(msb, lsb) {
    return (msb === null ? "-" : msb) + " / " + (lsb === null ? "-" : lsb);
  }

  function formatActiveRegisterLabel(state) {
    if (!state || !state.activeType) {
      return "-";
    }

    if (state.activeType === "RPN") {
      return "RPN " + formatRegisterKey(state.rpnMsb, state.rpnLsb);
    }

    if (state.activeType === "NRPN") {
      return "NRPN " + formatRegisterKey(state.nrpnMsb, state.nrpnLsb);
    }

    return "-";
  }

  function getTempoEntryAtTime(song, currentPosition) {
    var selected = null;

    (song.tempoMap || []).forEach(function (entry) {
      if (entry.secondsAtTick <= currentPosition) {
        selected = entry;
      }
    });

    return selected || ((song.tempoMap || [])[0] || null);
  }

  function getLastInfoEventAtTime(song, type, currentPosition) {
    var selected = null;

    (song.infoEvents || []).forEach(function (event) {
      if (event.type === type && event.start <= currentPosition) {
        selected = event;
      }
    });

    return selected;
  }

  function describeMetaEventType(type) {
    var names = {
      lyric: "Lyrics",
      text: "Text",
      copyright: "Copyright",
      trackName: "Track name",
      instrumentName: "Instrument name",
      tempo: "Tempo",
      timeSignature: "Time signature",
      keySignature: "Key signature",
      sequencerSpecific: "Sequencer-specific",
      program: "Program"
    };

    return names[type] || type;
  }

  function updateCurrentLyric(song, currentPosition, options) {
    var lyricEvents;
    var activeIndex = -1;
    var segmentEnd = null;
    var progress = 0;
    var pieces = [];
    var index;

    if (!song || !song.infoEvents) {
      options.lyricStatus.innerHTML = "";
      return;
    }

    lyricEvents = song.infoEvents.filter(function (event) {
      return event.type === "lyric";
    });

    if (!lyricEvents.length) {
      options.lyricStatus.innerHTML = "";
      return;
    }

    lyricEvents.forEach(function (event, eventIndex) {
      if (event.start <= currentPosition) {
        activeIndex = eventIndex;
      }
    });

    if (activeIndex >= 0) {
      if (lyricEvents[activeIndex].duration > 0) {
        segmentEnd = lyricEvents[activeIndex].start + lyricEvents[activeIndex].duration;
      } else if (lyricEvents[activeIndex + 1]) {
        segmentEnd = lyricEvents[activeIndex + 1].start;
      } else {
        segmentEnd = lyricEvents[activeIndex].start + 0.6;
      }

      progress = Math.max(0, Math.min(1, (currentPosition - lyricEvents[activeIndex].start) / Math.max(0.001, segmentEnd - lyricEvents[activeIndex].start)));
    }

    pieces.push("<DIV CLASS=\"soundtrack-lyrics-heading\">Lyrics</DIV>");

    for (index = 0; index < lyricEvents.length; index += 1) {
      var event = lyricEvents[index];
      var isActive = index === activeIndex;
      var isPast = index < activeIndex;
      var progressBar = "";
      var rowClass = "soundtrack-lyric-row " + (isActive ? "soundtrack-lyric-row-active" : (isPast ? "soundtrack-lyric-row-past" : "soundtrack-lyric-row-future"));

      if (isActive) {
        progressBar =
          "<DIV CLASS=\"soundtrack-lyric-progress\">" +
          "<DIV CLASS=\"soundtrack-lyric-progress-fill\" STYLE=\"height:" + Math.round(progress * 100) + "%;\"></DIV>" +
          "</DIV>";
      }

      pieces.push(
        "<DIV DATA-LYRIC-TIME=\"" + event.start + "\" CLASS=\"" + rowClass + "\">" +
        "<SPAN CLASS=\"soundtrack-lyric-time\">" + options.formatTime(event.start) + "</SPAN>" +
        progressBar +
        "<SPAN CLASS=\"soundtrack-lyric-text\">" + options.escapeHtml(event.label) + "</SPAN>" +
        "</DIV>"
      );
    }

    options.lyricStatus.innerHTML = pieces.join("");
  }

  function showMetaTooltip(zone, point, options) {
    var rect = options.metaVisualizer.getBoundingClientRect();
    var left = Math.min(rect.width - 228, Math.max(8, (point.x * (rect.width / options.metaVisualizer.width)) + 12));
    var top = Math.max(26, (point.y * (rect.height / options.metaVisualizer.height)) - 18);

    options.metaHoverTooltip.innerHTML =
      "<DIV CLASS=\"soundtrack-tooltip-title\">" + options.escapeHtml(zone.lane) + "</DIV>" +
      "<DIV>" + options.escapeHtml(zone.fullLabel) + "</DIV>" +
      "<DIV CLASS=\"soundtrack-tooltip-meta\">" + options.escapeHtml(options.formatTime(zone.start) + " - " + options.formatTime(zone.end)) + "</DIV>";
    options.metaHoverTooltip.style.display = "block";
    options.metaHoverTooltip.style.left = left + "px";
    options.metaHoverTooltip.style.top = top + "px";
  }

  function hideMetaTooltip(target) {
    target.style.display = "none";
  }

  function showTrackTooltip(zone, point, options) {
    var rect = options.visualizer.getBoundingClientRect();
    var scaleX = rect.width / options.visualizer.width;
    var scaleY = rect.height / options.visualizer.height;
    var left = Math.min(rect.width - 228, Math.max(8, (point.x * scaleX) + 12));
    var top = Math.max(26, (point.y * scaleY) - 18);
    var kind = zone.eventType === "program" ? "Program change" : "Control change";

    options.trackHoverTooltip.innerHTML =
      "<DIV CLASS=\"soundtrack-tooltip-title\">" + options.escapeHtml(zone.laneName) + "</DIV>" +
      "<DIV>" + options.escapeHtml(kind + ": " + formatTrackMarkerTooltipLabel(zone, options)) + "</DIV>" +
      "<DIV CLASS=\"soundtrack-tooltip-meta\">" + options.escapeHtml("At " + options.formatTime(zone.time)) + "</DIV>";
    options.trackHoverTooltip.style.display = "block";
    options.trackHoverTooltip.style.left = Math.max(8, window.scrollX + rect.left + left) + "px";
    options.trackHoverTooltip.style.top = Math.max(8, window.scrollY + rect.top + top) + "px";
  }

  function hideTrackTooltip(target) {
    target.style.display = "none";
  }

  function showTrackLaneTooltip(zone, point, options) {
    var rect = options.visualizer.getBoundingClientRect();
    var scaleX = rect.width / options.visualizer.width;
    var scaleY = rect.height / options.visualizer.height;
    var left = Math.min(rect.width - 240, Math.max(8, (point.x * scaleX) + 12));
    var top = Math.max(26, (point.y * scaleY) - 18);
    var relative = Math.max(0, Math.min(1, (point.x - zone.x) / Math.max(1, zone.width)));
    var time = zone.visibleStart + (relative * zone.visibleSeconds);
    var stateInfo = getTrackStateTooltipInfo(options.getSong(), zone.lane, time, options);

    options.trackHoverTooltip.innerHTML =
      "<DIV CLASS=\"soundtrack-tooltip-title\">" + options.escapeHtml(zone.lane.name) + "</DIV>" +
      "<DIV CLASS=\"soundtrack-tooltip-subtitle\">" + options.escapeHtml("In effect at " + options.formatTime(time)) + "</DIV>" +
      stateInfo.html;
    options.trackHoverTooltip.style.display = "block";
    options.trackHoverTooltip.style.left = Math.max(8, window.scrollX + rect.left + left) + "px";
    options.trackHoverTooltip.style.top = Math.max(8, window.scrollY + rect.top + top) + "px";
  }

  function getTrackStateTooltipInfo(song, lane, time, options) {
    var events;
    var programEvent = null;
    var controls = {};

    if (!song || !song.infoEvents || lane.trackIndex === null || lane.trackIndex === undefined) {
      return {
        html: "<DIV CLASS=\"soundtrack-tooltip-empty\">No track state available.</DIV>"
      };
    }

    events = song.infoEvents.filter(function (event) {
      return event.trackIndex === lane.trackIndex &&
        (event.type === "program" || event.type === "controlChange") &&
        event.start <= time;
    });

    events.forEach(function (event) {
      if (event.type === "program") {
        programEvent = event;
      } else if (event.type === "controlChange") {
        controls[event.controller] = event;
      }
    });

    if (!programEvent && !Object.keys(controls).length) {
      return {
        html: "<DIV CLASS=\"soundtrack-tooltip-empty\">No program or supported control changes have happened yet on this track.</DIV>"
      };
    }

    return {
      html: buildTrackStateTooltipHtml(programEvent, controls, options)
    };
  }

  function buildTrackStateTooltipHtml(programEvent, controls, options) {
    var lines = [];
    var orderedControllers = [0, 32, 99, 98, 6, 7, 10, 11, 73, 91];

    if (programEvent) {
      lines.push(
        "<DIV><SPAN CLASS=\"soundtrack-state-key\">Program:</SPAN> " +
        options.escapeHtml("prog " + programEvent.program + " " + options.getProgramMeaning(programEvent.program)) +
        "</DIV>"
      );
    }

    orderedControllers.forEach(function (controllerNumber) {
      var event = controls[controllerNumber];
      var applied;
      var suffix = "";

      if (!event) {
        return;
      }

      applied = options.isAppliedControlChange(controllerNumber);
      if (!applied) {
        suffix = " (tracked only)";
      }

      lines.push(
        "<DIV><SPAN CLASS=\"" + (applied ? "soundtrack-state-key" : "soundtrack-tooltip-label-muted") + "\">" + options.escapeHtml(options.getControlChangeLabel(controllerNumber)) +
        ":</SPAN> <SPAN CLASS=\"" + (applied ? "soundtrack-state-value" : "soundtrack-tooltip-value-muted") + "\">" + options.escapeHtml(String(event.value) + suffix) + "</SPAN></DIV>"
      );

      if (controllerNumber === 98 || controllerNumber === 99) {
        lines.push("<DIV CLASS=\"soundtrack-tooltip-hint\">NRPN picks a synth-specific parameter number; it does not change the sound by itself.</DIV>");
      } else if (controllerNumber === 6 && (controls[98] || controls[99])) {
        lines.push("<DIV CLASS=\"soundtrack-tooltip-hint\">Data Entry sets the value for the currently selected NRPN parameter.</DIV>");
      }
    });

    return lines.join("");
  }

  function formatTrackMarkerTooltipLabel(zone, options) {
    if (zone.eventType === "program" && zone.program !== undefined) {
      return "prog " + zone.program + " " + options.getProgramMeaning(zone.program);
    }

    if (zone.eventType === "controlChange" && zone.controller !== undefined) {
      if (zone.controller === 98 || zone.controller === 99) {
        return options.getControlChangeLabel(zone.controller) + " = " + zone.value + " (selects a non-registered synth parameter)";
      }
      if (zone.controller === 6) {
        return options.getControlChangeLabel(zone.controller) + " = " + zone.value + " (sets the selected parameter value)";
      }
      return options.getControlChangeLabel(zone.controller) + " = " + zone.value;
    }

    return zone.label;
  }

  window.ShoomiIndexPageState = {
    updateCurrentScoreState: updateCurrentScoreState,
    updateRegisterStateVisibility: updateRegisterStateVisibility,
    updateCurrentLyric: updateCurrentLyric,
    describeMetaEventType: describeMetaEventType,
    showMetaTooltip: showMetaTooltip,
    hideMetaTooltip: hideMetaTooltip,
    showTrackTooltip: showTrackTooltip,
    hideTrackTooltip: hideTrackTooltip,
    showTrackLaneTooltip: showTrackLaneTooltip
  };
}());
