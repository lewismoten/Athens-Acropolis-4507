(function () {
  function createLaneData(song, options) {
    var lanes = {};
    var musicOrder = [];
    var drumChildOrder = [];
    var drumChildCounts = {};
    var trackOrderMap;

    if (!song || !song.events) {
      return [];
    }

    trackOrderMap = getPlayableTrackOrderMap(song);

    if (options.drumsExpanded) {
      lanes.Drums = {
        name: "Drums",
        color: "#ffcc66",
        trackIndex: null,
        sortRank: 9999,
        muteKey: "drums:all",
        isGroupLane: true,
        segments: []
      };
    }

    song.events.forEach(function (event) {
      var laneInfo = getLaneInfo(song, event, options);
      var laneKey = laneInfo.key;
      var muteKey = getLaneMuteKey(event, options.drumsExpanded);
      var color = laneInfo.color;

      if (!lanes[laneKey]) {
        lanes[laneKey] = {
          key: laneKey,
          name: laneInfo.name,
          color: color,
          trackIndex: event.trackIndex,
          sortRank: trackOrderMap[event.trackIndex] || 9999,
          muteKey: muteKey,
          isDrumChild: event.channel === 9 && options.drumsExpanded,
          segments: []
        };
        if (event.channel === 9 && options.drumsExpanded) {
          drumChildOrder.push(laneKey);
          drumChildCounts[laneKey] = 0;
          if (musicOrder.indexOf("Drums") === -1) {
            musicOrder.push("Drums");
          }
        } else {
          musicOrder.push(laneKey);
        }
      }

      lanes[laneKey].segments.push({
        start: event.start,
        duration: event.duration,
        note: event.note
      });

      if (event.channel === 9 && options.drumsExpanded) {
        if (lanes.Drums.trackIndex === null || lanes.Drums.trackIndex === undefined) {
          lanes.Drums.trackIndex = event.trackIndex;
        }
        drumChildCounts[laneKey] += 1;
        lanes.Drums.segments.push({
          start: event.start,
          duration: event.duration,
          note: event.note
        });
      }
    });

    musicOrder.sort(function (left, right) {
      return (lanes[left].sortRank || 9999) - (lanes[right].sortRank || 9999);
    });

    if (options.drumsExpanded) {
      var drumsIndex = musicOrder.indexOf("Drums");
      drumChildOrder.sort(function (left, right) {
        return (drumChildCounts[right] || 0) - (drumChildCounts[left] || 0);
      });
      if (drumsIndex >= 0) {
        musicOrder.splice.apply(musicOrder, [drumsIndex + 1, 0].concat(drumChildOrder));
      }
    }

    return musicOrder.map(function (name) {
      return lanes[name];
    });
  }

  function createMetaLaneData(song, options) {
    var lanes = {};
    var laneOrder = [];
    var trackEvents = {};

    if (!song || !song.infoEvents || !song.trackSummaries) {
      return [];
    }

    song.infoEvents.forEach(function (event) {
      var summary = song.trackSummaries[event.trackIndex];
      var laneName;

      if (!summary || summary.hasPlayableNotes) {
        return;
      }

      if (event.type === "trackName" && event.start === 0) {
        return;
      }

      if ((event.start || 0) <= 0 && event.type !== "lyric" && event.type !== "text" && event.type !== "copyright") {
        return;
      }

      laneName = getPreferredTrackLabel(summary, null, options);
      if (!lanes[laneName]) {
        lanes[laneName] = {
          name: laneName,
          color: event.type === "lyric" ? "#ff99ff" : "#ffcc99",
          segments: []
        };
        laneOrder.push(laneName);
        trackEvents[laneName] = [];
      }

      trackEvents[laneName].push(event);
    });

    laneOrder.forEach(function (laneName) {
      var events = trackEvents[laneName];

      events.sort(function (left, right) {
        return left.start - right.start;
      });

      events.forEach(function (event, index) {
        var nextEvent = events[index + 1];
        var duration = nextEvent ? Math.max(0.2, nextEvent.start - event.start) : 0.6;

        lanes[laneName].segments.push({
          start: event.start,
          duration: duration,
          type: event.type,
          label: event.label
        });
      });
    });

    return laneOrder.map(function (laneName) {
      return lanes[laneName];
    });
  }

  function getLaneName(song, event, options) {
    return getLaneInfo(song, event, options).role;
  }

  function getLaneInfo(song, event, options) {
    var summary = song && song.trackSummaries ? song.trackSummaries[event.trackIndex] : null;
    var displayName = getPreferredTrackLabel(summary, event, options);
    var soundChoice = options.getTrackSoundChoice(event.trackIndex, event, summary);
    var role = options.getSoundChoiceRole(soundChoice);

    if (event.channel === 9) {
      if (!options.drumsExpanded) {
        return {
          key: "drums:all",
          name: "Drums",
          role: "Drums",
          color: options.trackColors.Drums
        };
      }

      return {
        key: "drum:" + event.note,
        name: options.getDrumName(event.note),
        role: "Drums",
        color: options.trackColors.Drums
      };
    }

    return {
      key: "track:" + event.trackIndex,
      name: options.getDisplayLaneName(displayName, role),
      role: role,
      color: options.trackColors[role] || "#bbbbdd"
    };
  }

  function getLaneMuteKey(event, drumsExpanded) {
    if (event.channel === 9) {
      if (!drumsExpanded) {
        return "drums:all";
      }
      return "drum:" + event.note;
    }

    return "track:" + event.trackIndex;
  }

  function getVisibleWindow(duration, currentPosition, options) {
    var seconds;
    var start;

    if (options.fullSong) {
      return {
        start: 0,
        end: duration,
        seconds: Math.max(duration, 0.1),
        label: "full song"
      };
    }

    seconds = Math.min(Number(options.windowSeconds) || 10, duration);
    if (options.manualWindowStart !== null && options.isPaused) {
      start = Math.max(0, Math.min(options.manualWindowStart, duration - seconds));
    } else {
      start = Math.max(0, Math.min(currentPosition - (seconds / 2), duration - seconds));
    }

    return {
      start: start,
      end: Math.min(duration, start + seconds),
      seconds: Math.max(seconds, 0.1),
      label: Math.round(seconds) + "s window"
    };
  }

  function buildTrackRoleMap(song, options) {
    var mapping = {};
    var noteGroups = {};

    (song.events || []).forEach(function (event) {
      var summary = (song.trackSummaries || [])[event.trackIndex];
      var soundChoice = options.getTrackSoundChoice(event.trackIndex, event, summary);

      if (!mapping[event.trackIndex]) {
        mapping[event.trackIndex] = {
          role: options.getSoundChoiceRole(soundChoice),
          channelProgram: formatChannelProgram(event, options),
          muteKey: getLaneMuteKey(event, options.drumsExpanded)
        };
      }

      if (!noteGroups[event.trackIndex]) {
        noteGroups[event.trackIndex] = {};
      }

      noteGroups[event.trackIndex][event.note] = (noteGroups[event.trackIndex][event.note] || 0) + 1;
    });

    (song.trackSummaries || []).forEach(function (summary) {
      if (!mapping[summary.index] && !summary.hasPlayableNotes) {
        mapping[summary.index] = {
          role: "Meta / control",
          channelProgram: "No notes"
        };
      }

      if (mapping[summary.index] && mapping[summary.index].channelProgram === "ch 10 / drum kit") {
        mapping[summary.index].channelProgram = formatDrumProgram(noteGroups[summary.index] || {}, options);
        mapping[summary.index].muteKey = "drums:all";
      }

      if (mapping[summary.index] && summary.lyricCount) {
        mapping[summary.index].role = mapping[summary.index].role === "Meta / control" ? "Lyrics / meta" : mapping[summary.index].role;
      }
    });

    return mapping;
  }

  function formatChannelProgram(event, options) {
    if (event.channel === 9) {
      if (options.drumsExpanded) {
        return "ch 10 / " + event.note + " " + options.getDrumName(event.note);
      }
      return "ch 10 / drum kit (GM percussion)";
    }

    return "ch " + (event.channel + 1) + " / " + formatBankProgram(event, options);
  }

  function formatBankProgram(event, options) {
    var bankPrefix = "";

    if ((event.bankMsb || 0) !== 0 || (event.bankLsb || 0) !== 0) {
      bankPrefix = "bank " + (event.bankMsb || 0) + "." + (event.bankLsb || 0) + " / ";
    }

    return bankPrefix + "prog " + event.program + " " + options.getProgramMeaning(event.program);
  }

  function formatDrumProgram(noteGroup, options) {
    var notes = Object.keys(noteGroup).map(Number).sort(function (left, right) {
      return left - right;
    });

    if (!notes.length) {
      return "ch 10 / drum kit";
    }

    return "ch 10 / drum kit<BR>" + notes.map(function (note) {
      return note + " " + options.getDrumName(note) + " x" + noteGroup[note];
    }).join("<BR>");
  }

  function getPreferredTrackLabel(summary, event, options) {
    var fallback;
    var channelNumber;
    var role;

    if (!summary) {
      return event ? ("Track " + (event.trackIndex + 1)) : "Track";
    }

    fallback = summary.name && summary.name !== "-" ? summary.name : ("Track " + (summary.index + 1));

    if (!summary.hasPlayableNotes || !options.isCommentLikeTrackName(summary.name || "")) {
      return fallback;
    }

    channelNumber = event && event.channel !== undefined ? (event.channel + 1) : null;
    role = options.getSoundChoiceRole(options.getTrackSoundChoice(summary.index, event, summary));

    if (event && event.channel === 9) {
      return "Drums" + (channelNumber ? " (Ch " + channelNumber + ")" : "");
    }

    if (role && role !== "Audio") {
      return role + (channelNumber ? " (Ch " + channelNumber + ")" : "");
    }

    return "Track " + (summary.index + 1) + (channelNumber ? " (Ch " + channelNumber + ")" : "");
  }

  function findFirstTrackEvent(song, trackIndex) {
    var match = null;

    (song.events || []).some(function (event) {
      if (event.trackIndex === trackIndex) {
        match = event;
        return true;
      }
      return false;
    });

    return match;
  }

  function getPlayableSummariesSorted(song) {
    var orderMap = getPlayableTrackOrderMap(song);

    return (song.trackSummaries || []).filter(function (summary) {
      return summary.hasPlayableNotes;
    }).sort(function (left, right) {
      return (orderMap[left.index] || 9999) - (orderMap[right.index] || 9999);
    });
  }

  function getPlayableTrackOrderMap(song) {
    var firstEvents = {};
    var orderedTracks;
    var orderMap = {};

    if (!song || !song.events) {
      return orderMap;
    }

    song.events.forEach(function (event) {
      if (firstEvents[event.trackIndex] === undefined) {
        firstEvents[event.trackIndex] = event;
      }
    });

    orderedTracks = Object.keys(firstEvents).map(Number).sort(function (left, right) {
      var leftEvent = firstEvents[left];
      var rightEvent = firstEvents[right];

      if (leftEvent.channel !== rightEvent.channel) {
        return leftEvent.channel - rightEvent.channel;
      }

      if (leftEvent.program !== rightEvent.program) {
        return leftEvent.program - rightEvent.program;
      }

      return left - right;
    });

    orderedTracks.forEach(function (trackIndex, orderIndex) {
      orderMap[trackIndex] = orderIndex;
    });

    return orderMap;
  }

  window.ShoomiIndexData = {
    createLaneData: createLaneData,
    createMetaLaneData: createMetaLaneData,
    getLaneName: getLaneName,
    getLaneInfo: getLaneInfo,
    getLaneMuteKey: getLaneMuteKey,
    getVisibleWindow: getVisibleWindow,
    buildTrackRoleMap: buildTrackRoleMap,
    formatChannelProgram: formatChannelProgram,
    formatBankProgram: formatBankProgram,
    formatDrumProgram: formatDrumProgram,
    getPreferredTrackLabel: getPreferredTrackLabel,
    findFirstTrackEvent: findFirstTrackEvent,
    getPlayableSummariesSorted: getPlayableSummariesSorted,
    getPlayableTrackOrderMap: getPlayableTrackOrderMap
  };
})();
