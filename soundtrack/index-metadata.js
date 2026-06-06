(function () {
  function updateTrackDetails(song, options) {
    var lines = [];
    var roleMap;
    var playableSummaries;

    if (!song || !song.trackSummaries) {
      options.target.innerHTML = "";
      return;
    }

    roleMap = options.buildTrackRoleMap(song);
    playableSummaries = options.getPlayableSummariesSorted(song);

    if (!playableSummaries.length) {
      options.target.innerHTML = "";
      return;
    }

    lines.push("<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table\">");
    lines.push("<TR BGCOLOR=\"#000044\"><TH ALIGN=\"LEFT\">MIDI Track</TH><TH ALIGN=\"LEFT\">Role</TH><TH ALIGN=\"LEFT\">Channel / Program</TH><TH ALIGN=\"LEFT\">Mapped Sound</TH><TH ALIGN=\"LEFT\">Notes</TH><TH ALIGN=\"LEFT\">Contents</TH></TR>");
    playableSummaries.forEach(function (summary) {
      var label = options.getPreferredTrackLabel(summary, options.findFirstTrackEvent(song, summary.index));
      var mapping = roleMap[summary.index] || {};
      var details = formatTrackContentsHtml(summary, options);
      var channelProgram = mapping.channelProgram || (summary.hasPlayableNotes ? "playable" : "meta/control");
      var mappedSound = options.formatSoundChoice(options.trackSoundMap[summary.index] || options.suggestSoundChoice(summary, options.findFirstTrackEvent(song, summary.index)));
      var noteCount = summary.noteCount || 0;
      var muted = options.controller && options.controller.isMuteKey ? options.controller.isMuteKey(mapping.muteKey || ("track:" + summary.index)) : false;
      var rowClass = muted ? " class=\"soundtrack-table-cell-muted\"" : "";

      lines.push("<TR" + rowClass + ">" +
        "<TD><SPAN CLASS=\"soundtrack-table-label\">" + options.escapeHtml(label) + "</SPAN></TD>" +
        "<TD>" + options.escapeHtml(mapping.role || (summary.hasPlayableNotes ? "Track" : "Meta / control")) + "</TD>" +
        "<TD>" + channelProgram + "</TD>" +
        "<TD>" + options.escapeHtml(mappedSound) + "</TD>" +
        "<TD>" + noteCount + "</TD>" +
        "<TD>" + details + "</TD>" +
        "</TR>");
    });
    lines.push("</TABLE>");

    options.target.innerHTML = lines.join("");
  }

  function updateSongMetadata(song, options) {
    var rows = [];
    var lyricEvents;
    var tempoBpm = "";
    var timeSignature = "";
    var keySignature = "";
    var sequencerSpecific = "";
    var extraText = [];
    var metaTrackRows = [];
    var metadataTables = [];
    var nrpnRows = [];

    if (!song) {
      options.target.innerHTML = "";
      return;
    }

    lyricEvents = (song.infoEvents || []).filter(function (event) {
      return event.type === "lyric";
    });

    if (song.tempoMap && song.tempoMap.length) {
      tempoBpm = Math.round(60000000 / song.tempoMap[0].microsecondsPerQuarter * 100) / 100 + " BPM";
    }

    (song.infoEvents || []).forEach(function (event) {
      if (!timeSignature && event.type === "timeSignature") {
        timeSignature = event.label;
      }
      if (!keySignature && event.type === "keySignature") {
        keySignature = event.label;
      }
      if (!sequencerSpecific && event.type === "sequencerSpecific") {
        sequencerSpecific = event.label;
      }
    });

    rows.push(["Format", String(song.format || "")]);
    rows.push(["Track Count", String(song.trackCount || "")]);
    rows.push(["Division", String(song.division || "") + " ticks/quarter"]);
    rows.push(["Duration", options.formatTime(song.duration || 0)]);
    if (tempoBpm) {
      rows.push(["Tempo", tempoBpm]);
    }
    if (timeSignature) {
      rows.push(["Time Signature", timeSignature]);
    }
    if (keySignature) {
      rows.push(["Key Signature", keySignature]);
    }
    if (sequencerSpecific) {
      rows.push(["Sequencer Specific", sequencerSpecific]);
    }
    rows.push(["Lyric Events", String(lyricEvents.length)]);
    rows.push(["Playable Event Count", String((song.events || []).length)]);
    rows.push(["Info Event Count", String((song.infoEvents || []).length)]);

    if (song.textMetadata) {
      (song.textMetadata.copyright || []).forEach(function (value) {
        rows.push(["Copyright", value]);
      });

      (song.textMetadata.text || []).forEach(function (value) {
        var separatorIndex = value.indexOf(": ");
        var trimmedValue = String(value || "").trim();

        if (!trimmedValue) {
          return;
        }

        if (separatorIndex > 0) {
          rows.push([trimmedValue.slice(0, separatorIndex), trimmedValue.slice(separatorIndex + 2)]);
        } else {
          extraText.push(trimmedValue);
        }
      });

      if (song.textMetadata.instrument && song.textMetadata.instrument.length) {
        rows.push([
          "Instrument Names",
          song.textMetadata.instrument.map(function (entry) {
            return "Track " + (entry.trackIndex + 1) + ": " + entry.text;
          }).join(" | ")
        ]);
      }
    }

    extraText.forEach(function (value, index) {
      rows.push([index === 0 ? "Comments" : "More Comments", value]);
    });

    (song.trackSummaries || []).forEach(function (summary) {
      var label;
      var details;

      if (summary.hasPlayableNotes) {
        return;
      }

      label = options.getPreferredTrackLabel(summary, null);
      details = summary.descriptions.length ? summary.descriptions.join(", ") : "";

      if (label === "-" && !details) {
        return;
      }

      metaTrackRows.push([
        "Track " + (summary.index + 1),
        label === "-" ? "<SPAN CLASS=\"soundtrack-dim\">-</SPAN>" : options.escapeHtml(label),
        details ? options.escapeHtml(details) : "<SPAN CLASS=\"soundtrack-dim\">name / credit only</SPAN>"
      ]);
    });

    metadataTables.push(
      "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table\">" +
      "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"2\">MIDI Metadata</TH></TR>" +
      compressMetadataRows(rows).map(function (row) {
        return "<TR><TD WIDTH=\"160\" CLASS=\"soundtrack-table-label\">" + options.escapeHtml(row[0]) + "</TD><TD>" + options.escapeHtml(row[1]) + "</TD></TR>";
      }).join("") +
      "</TABLE>"
    );

    if (metaTrackRows.length) {
      metadataTables.push(
        "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table soundtrack-table-spaced\">" +
        "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"3\">Additional Meta Tracks</TH></TR>" +
        "<TR BGCOLOR=\"#000033\" CLASS=\"soundtrack-table-subhead\"><TH ALIGN=\"LEFT\">Track</TH><TH ALIGN=\"LEFT\">Name / Credit</TH><TH ALIGN=\"LEFT\">Timing / Control Details</TH></TR>" +
        metaTrackRows.map(function (row) {
          return "<TR><TD WIDTH=\"70\" CLASS=\"soundtrack-table-label\">" + options.escapeHtml(row[0]) + "</TD><TD>" + row[1] + "</TD><TD>" + row[2] + "</TD></TR>";
        }).join("") +
        "</TABLE>"
      );
    }

    if ((song.trackSummaries || []).some(function (summary) {
      return summary.hasPlayableNotes && options.isCommentLikeTrackName(summary.name || "");
    })) {
      metadataTables.push(
        "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table soundtrack-table-spaced\">" +
        "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"2\">Playable Track Comments</TH></TR>" +
        (song.trackSummaries || []).filter(function (summary) {
          return summary.hasPlayableNotes && options.isCommentLikeTrackName(summary.name || "");
        }).map(function (summary) {
          return "<TR><TD WIDTH=\"160\" CLASS=\"soundtrack-table-label\">" + options.escapeHtml(options.getPreferredTrackLabel(summary, options.findFirstTrackEvent(song, summary.index))) + "</TD><TD>" + options.escapeHtml(summary.name) + "</TD></TR>";
        }).join("") +
        "</TABLE>"
      );
    }

    nrpnRows = buildNrpnRegisterRows(song);
    if (nrpnRows.length) {
      metadataTables.push(
        "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table soundtrack-table-spaced\">" +
        "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"4\">NRPN / Data Registers</TH></TR>" +
        "<TR BGCOLOR=\"#000033\" CLASS=\"soundtrack-table-subhead\"><TH ALIGN=\"LEFT\">Register</TH><TH ALIGN=\"LEFT\">Selected By</TH><TH ALIGN=\"LEFT\">Data Entry Writes</TH><TH ALIGN=\"LEFT\">Tracks</TH></TR>" +
        nrpnRows.map(function (row) {
          return "<TR><TD CLASS=\"soundtrack-table-label\">" + options.escapeHtml(row.register) + "</TD><TD>" + options.escapeHtml(row.selectedBy) + "</TD><TD>" + row.dataWritesHtml + "</TD><TD>" + options.escapeHtml(row.tracks) + "</TD></TR>";
        }).join("") +
        "</TABLE>" +
        "<DIV CLASS=\"soundtrack-note-dim soundtrack-note-dim-tight\">All Data Entry values used: " + options.escapeHtml(getAllNrpnWriteValuesSummary(nrpnRows)) + "</DIV>"
      );
    }

    if (getAllControlNumbers(song).length) {
      metadataTables.push(
        "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table soundtrack-table-spaced\">" +
        "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"2\">Unhandled / Tracked CC Inventory</TH></TR>" +
        "<TR><TD WIDTH=\"160\" CLASS=\"soundtrack-table-label\">Applied in playback</TD><TD>" + formatControlInventoryHtml(getControlNumbersByStatus(song, "applied"), options) + "</TD></TR>" +
        "<TR><TD WIDTH=\"160\" CLASS=\"soundtrack-table-label\">Tracked state</TD><TD>" + formatControlInventoryHtml(getControlNumbersByStatus(song, "tracked"), options) + "</TD></TR>" +
        "<TR><TD WIDTH=\"160\" CLASS=\"soundtrack-table-label\">Not yet handled</TD><TD>" + formatControlInventoryHtml(getControlNumbersByStatus(song, "unhandled"), options) + "</TD></TR>" +
        "</TABLE>"
      );
    }

    if (buildAppliedControlImpactRows(song).length) {
      metadataTables.push(
        "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table soundtrack-table-spaced\">" +
        "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"4\">Controller impact in this player</TH></TR>" +
        "<TR BGCOLOR=\"#000033\" CLASS=\"soundtrack-table-subhead\"><TH ALIGN=\"LEFT\">Control</TH><TH ALIGN=\"LEFT\">Events</TH><TH ALIGN=\"LEFT\">Channels</TH><TH ALIGN=\"LEFT\">Tracks</TH></TR>" +
        buildAppliedControlImpactRows(song).map(function (row) {
          return "<TR><TD CLASS=\"soundtrack-table-label\">" + options.escapeHtml(row.label) + "</TD><TD>" + options.escapeHtml(String(row.count)) + "</TD><TD>" + options.escapeHtml(row.channels) + "</TD><TD>" + options.escapeHtml(row.tracks) + "</TD></TR>";
        }).join("") +
        "</TABLE>"
      );
    }

    options.target.innerHTML = metadataTables.join("");
  }

  function getAllControlNumbers(song) {
    var numbers = [];

    (song.trackSummaries || []).forEach(function (summary) {
      (summary.controlNumbers || []).forEach(function (controllerNumber) {
        pushUniqueNumber(numbers, controllerNumber);
      });
    });

    return numbers;
  }

  function getControlHandlingStatus(controllerNumber) {
    if (isAppliedControlChange(controllerNumber)) {
      return "applied";
    }

    if (isTrackedControlChange(controllerNumber)) {
      return "tracked";
    }

    return "unhandled";
  }

  function getControlNumbersByStatus(song, status) {
    return getAllControlNumbers(song).filter(function (controllerNumber) {
      return getControlHandlingStatus(controllerNumber) === status;
    });
  }

  function formatControlInventoryHtml(controlNumbers, options) {
    if (!controlNumbers.length) {
      return "<SPAN CLASS=\"soundtrack-dim\">none</SPAN>";
    }

    return "<UL CLASS=\"soundtrack-list\">" + controlNumbers.map(function (controllerNumber) {
      return "<LI>" + options.escapeHtml("CC" + controllerNumber + " " + getControlChangeLabel(controllerNumber)) + "</LI>";
    }).join("") + "</UL>";
  }

  function buildAppliedControlImpactRows(song) {
    var byController = {};

    (song.infoEvents || []).forEach(function (event) {
      var entry;

      if (event.type !== "controlChange" || !isAppliedControlChange(event.controller)) {
        return;
      }

      if (!byController[event.controller]) {
        byController[event.controller] = {
          controller: event.controller,
          count: 0,
          channels: [],
          tracks: []
        };
      }

      entry = byController[event.controller];
      entry.count += 1;
      if (event.channel !== undefined && event.channel !== null) {
        pushUniqueNumber(entry.channels, event.channel + 1);
      }
      pushUniqueNumber(entry.tracks, event.trackIndex + 1);
    });

    return Object.keys(byController).map(function (controllerNumber) {
      var entry = byController[controllerNumber];
      return {
        label: "CC" + controllerNumber + " " + getControlChangeLabel(Number(controllerNumber)),
        count: entry.count,
        channels: formatNumberRanges(entry.channels),
        tracks: formatNumberRanges(entry.tracks)
      };
    }).sort(function (left, right) {
      return Number(left.label.match(/^CC(\d+)/)[1]) - Number(right.label.match(/^CC(\d+)/)[1]);
    });
  }

  function compressMetadataRows(rows) {
    var map = {};
    var ordered = [];

    (rows || []).forEach(function (row) {
      var key = row[0] + "\u0000" + row[1];

      if (!map[key]) {
        map[key] = [row[0], row[1], 0];
        ordered.push(map[key]);
      }

      map[key][2] += 1;
    });

    return ordered.map(function (row) {
      if (row[2] > 1) {
        return [row[0], row[1] + " (x" + row[2] + ")"];
      }
      return [row[0], row[1]];
    });
  }

  function buildNrpnRegisterRows(song) {
    var byChannel = {};
    var rows = [];

    if (!song || !song.infoEvents || !song.trackSummaries) {
      return [];
    }

    (song.infoEvents || []).forEach(function (event) {
      if (event.type !== "controlChange" || (event.controller !== 98 && event.controller !== 99 && event.controller !== 6)) {
        return;
      }

      if (event.channel === undefined || event.channel === null) {
        return;
      }

      if (!byChannel[event.channel]) {
        byChannel[event.channel] = {
          nrpnMsb: null,
          nrpnLsb: null,
          channel: event.channel
        };
      }

      if (event.controller === 99) {
        byChannel[event.channel].nrpnMsb = event.value;
        registerNrpnEvent(rows, event, byChannel[event.channel], "select");
      } else if (event.controller === 98) {
        byChannel[event.channel].nrpnLsb = event.value;
        registerNrpnEvent(rows, event, byChannel[event.channel], "select");
      } else if (event.controller === 6) {
        registerNrpnEvent(rows, event, byChannel[event.channel], "write", event.value);
      }
    });

    return rows.sort(function (left, right) {
      return compareRegisterKeys(left.registerKey, right.registerKey);
    });
  }

  function registerNrpnEvent(rows, event, state, mode, value) {
    var register = (state.nrpnMsb === null ? "-" : state.nrpnMsb) + " / " + (state.nrpnLsb === null ? "-" : state.nrpnLsb);
    var trackNumber = event.trackIndex + 1;
    var channelNumber = state.channel + 1;
    var existing = rows.find(function (row) {
      return row.register === register;
    });

    if (!existing) {
      existing = {
        register: register,
        registerKey: [state.nrpnMsb === null ? -1 : state.nrpnMsb, state.nrpnLsb === null ? -1 : state.nrpnLsb],
        selectTracks: [],
        selectChannels: [],
        writeTracks: [],
        writeChannels: [],
        writeValues: {},
        tracksList: []
      };
      rows.push(existing);
    }

    if (mode === "select") {
      pushUniqueNumber(existing.selectTracks, trackNumber);
      pushUniqueNumber(existing.selectChannels, channelNumber);
    }

    if (mode === "write") {
      pushUniqueNumber(existing.writeTracks, trackNumber);
      pushUniqueNumber(existing.writeChannels, channelNumber);
      if (!existing.writeValues[value]) {
        existing.writeValues[value] = {
          tracks: [],
          channels: []
        };
      }
      pushUniqueNumber(existing.writeValues[value].tracks, trackNumber);
      pushUniqueNumber(existing.writeValues[value].channels, channelNumber);
    }

    pushUniqueNumber(existing.tracksList, trackNumber);
    existing.selectedBy = formatNumberRanges(existing.selectTracks);
    existing.selectedChannels = formatNumberRanges(existing.selectChannels);
    existing.tracks = formatNumberRanges(existing.tracksList);
    existing.dataWritesHtml = formatNrpnWriteTable(existing.writeValues);
  }

  function pushUniqueNumber(list, value) {
    if (list.indexOf(value) === -1) {
      list.push(value);
      list.sort(function (left, right) {
        return left - right;
      });
    }
  }

  function compareRegisterKeys(left, right) {
    if (left[0] !== right[0]) {
      return left[0] - right[0];
    }
    return left[1] - right[1];
  }

  function formatNrpnWriteTable(writeValues) {
    var values = Object.keys(writeValues).map(Number).sort(function (left, right) {
      return left - right;
    });

    if (!values.length) {
      return "<SPAN CLASS=\"soundtrack-dim\">-</SPAN>";
    }

    return "<TABLE CELLPADDING=\"2\" CELLSPACING=\"0\" BORDER=\"0\" CLASS=\"soundtrack-table\">" +
      values.map(function (value) {
        return "<TR><TD CLASS=\"soundtrack-table-cell-warning\">" + escapeHtml(String(value)) + "</TD><TD>Ch " + escapeHtml(formatNumberRanges(writeValues[value].channels)) + "</TD><TD CLASS=\"soundtrack-caption\">Tracks " + escapeHtml(formatNumberRanges(writeValues[value].tracks)) + "</TD></TR>";
      }).join("") +
      "</TABLE>";
  }

  function getAllNrpnWriteValuesSummary(rows) {
    var values = [];

    (rows || []).forEach(function (row) {
      Object.keys(row.writeValues || {}).forEach(function (value) {
        pushUniqueNumber(values, Number(value));
      });
    });

    return formatNumberRanges(values);
  }

  function formatTrackContentsHtml(summary, options) {
    var items = [];

    if ((summary.descriptions || []).length) {
      items = items.concat(summary.descriptions.map(function (description) {
        return "<LI>" + options.escapeHtml(description) + "</LI>";
      }));
    }

    if ((summary.programValues || []).length) {
      items.push(
        "<LI>program types<UL CLASS=\"soundtrack-sublist\">" +
        summary.programValues.map(function (program) {
          return "<LI>" + options.escapeHtml(program + " " + options.getProgramMeaning(program).replace(/^\(|\)$/g, "")) + "</LI>";
        }).join("") +
        "</UL></LI>"
      );
    }

    if ((summary.controlNumbers || []).length) {
      items.push(
        "<LI>control types<UL CLASS=\"soundtrack-sublist\">" +
        summary.controlNumbers.map(function (controllerNumber) {
          var label = getControlChangeLabel(controllerNumber);
          var applied = isAppliedControlChange(controllerNumber);
          var tracked = isTrackedControlChange(controllerNumber);
          var text = "CC" + controllerNumber + " " + label;

          if (applied) {
            return "<LI>" + options.escapeHtml(text) + "</LI>";
          }

          if (tracked) {
            return "<LI><SPAN CLASS=\"soundtrack-dim\">" + options.escapeHtml(text + " (tracked)") + "</SPAN></LI>";
          }

          return "<LI><SPAN CLASS=\"soundtrack-dim\">" + options.escapeHtml(text + " (not yet handled)") + "</SPAN></LI>";
        }).join("") +
        "</UL></LI>"
      );
    }

    if (!items.length) {
      return "<SPAN CLASS=\"soundtrack-dim\">none</SPAN>";
    }

    return "<UL CLASS=\"soundtrack-list\">" + items.join("") + "</UL>";
  }

  function getControlChangeLabel(controllerNumber) {
    var names = {
      0: "Bank Select MSB",
      1: "Modulation",
      6: "Data Entry MSB",
      7: "Channel Volume",
      10: "Pan",
      11: "Expression",
      32: "Bank Select LSB",
      66: "Sostenuto",
      67: "Soft Pedal",
      64: "Sustain Pedal",
      71: "Resonance",
      72: "Release Time",
      73: "Attack Time",
      74: "Brightness",
      91: "Reverb Send",
      92: "Tremolo Depth",
      93: "Chorus Send",
      94: "Celeste Depth",
      98: "NRPN LSB",
      99: "NRPN MSB",
      100: "RPN LSB",
      101: "RPN MSB",
      121: "Reset All Controllers"
    };

    return names[controllerNumber] || "Control";
  }

  function isAppliedControlChange(controllerNumber) {
    return controllerNumber === 0 || controllerNumber === 1 || controllerNumber === 7 || controllerNumber === 10 || controllerNumber === 11 || controllerNumber === 32 || controllerNumber === 66 || controllerNumber === 67 || controllerNumber === 71 || controllerNumber === 72 || controllerNumber === 73 || controllerNumber === 74 || controllerNumber === 91 || controllerNumber === 92 || controllerNumber === 93 || controllerNumber === 94 || controllerNumber === 121;
  }

  function isTrackedControlChange(controllerNumber) {
    return controllerNumber === 6 || controllerNumber === 98 || controllerNumber === 99 || controllerNumber === 100 || controllerNumber === 101;
  }

  function updateMetaLaneDetails(song, metaLaneData, options) {
    var rows = [];

    if (!song || !metaLaneData.length) {
      options.target.innerHTML = "";
      return;
    }

    metaLaneData.forEach(function (lane) {
      var relatedSummary = options.findMetaSummaryForLane(song, lane);
      var segmentTypes = {};
      var sampleLabels = [];

      lane.segments.forEach(function (segment) {
        segmentTypes[segment.type] = true;
        if (segment.label && sampleLabels.indexOf(segment.label) === -1 && sampleLabels.length < 3) {
          sampleLabels.push(segment.label);
        }
      });

      rows.push(
        "<TR>" +
        "<TD CLASS=\"soundtrack-table-label-top\">" + options.escapeHtml(lane.name) + "</TD>" +
        "<TD CLASS=\"soundtrack-table-top\">" + options.escapeHtml(Object.keys(segmentTypes).map(options.describeMetaEventType).join(", ") || "meta") + "</TD>" +
        "<TD CLASS=\"soundtrack-table-top\">" + options.escapeHtml(sampleLabels.join(" | ") || "timed meta/control data") + "</TD>" +
        "<TD CLASS=\"soundtrack-table-top\">" + (relatedSummary ? options.escapeHtml("Track " + (relatedSummary.index + 1)) : "<SPAN CLASS=\"soundtrack-dim\">unknown</SPAN>") + "</TD>" +
        "</TR>"
      );
    });

    options.target.innerHTML =
      "<TABLE WIDTH=\"100%\" CELLPADDING=\"4\" CELLSPACING=\"0\" BORDER=\"1\" BORDERCOLOR=\"#555588\" CLASS=\"soundtrack-table\">" +
      "<TR BGCOLOR=\"#000044\" CLASS=\"soundtrack-table-head\"><TH ALIGN=\"LEFT\" COLSPAN=\"4\">Meta / Control Lane Guide</TH></TR>" +
      "<TR BGCOLOR=\"#000033\" CLASS=\"soundtrack-table-subhead\"><TH ALIGN=\"LEFT\">Lane</TH><TH ALIGN=\"LEFT\">Event Types</TH><TH ALIGN=\"LEFT\">Examples</TH><TH ALIGN=\"LEFT\">Track</TH></TR>" +
      rows.join("") +
      "</TABLE>";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function formatNumberRanges(values) {
    var sorted;
    var ranges = [];
    var start;
    var end;
    var index;
    var value;

    if (!values || !values.length) {
      return "";
    }

    sorted = values.slice().sort(function (left, right) {
      return left - right;
    });

    start = sorted[0];
    end = sorted[0];

    for (index = 1; index <= sorted.length; index += 1) {
      value = sorted[index];
      if (value === end + 1) {
        end = value;
        continue;
      }
      ranges.push(start === end ? String(start) : start + "-" + end);
      start = value;
      end = value;
    }

    return ranges.join(", ");
  }

  window.ShoomiIndexPageMetadata = {
    updateTrackDetails: updateTrackDetails,
    updateSongMetadata: updateSongMetadata,
    updateMetaLaneDetails: updateMetaLaneDetails,
    getControlChangeLabel: getControlChangeLabel,
    isAppliedControlChange: isAppliedControlChange,
    isTrackedControlChange: isTrackedControlChange
  };
}());
