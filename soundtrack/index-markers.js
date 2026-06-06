(function () {
  function getMarkerToggleEntries(options) {
    return [
      { key: "program", toggle: options.markerTypeProgramToggle },
      { key: "bankMsb", toggle: options.markerTypeBankMsbToggle },
      { key: "bankLsb", toggle: options.markerTypeBankLsbToggle },
      { key: "nrpnMsb", toggle: options.markerTypeNrpnMsbToggle },
      { key: "nrpnLsb", toggle: options.markerTypeNrpnLsbToggle },
      { key: "data", toggle: options.markerTypeDataToggle },
      { key: "volume", toggle: options.markerTypeVolumeToggle },
      { key: "pan", toggle: options.markerTypePanToggle },
      { key: "expression", toggle: options.markerTypeExpressionToggle },
      { key: "attack", toggle: options.markerTypeAttackToggle },
      { key: "reverb", toggle: options.markerTypeReverbToggle },
      { key: "other", toggle: options.markerTypeOtherToggle }
    ];
  }

  function getMarkerTypeKeyForEvent(event) {
    if (!event) {
      return "";
    }

    if (event.type === "program") {
      return "program";
    }

    if (event.type !== "controlChange") {
      return "";
    }

    return {
      0: 'bankMsb',
      6: 'data',
      7: 'volume',
      10: 'pan',
      11: 'expression',
      32: 'bankMsb',
      73: 'attack',
      91: 'reverb',
      98: 'nrpnLsb',
      99: 'nrpnMsb'
    }[event.controller] || 'other';

  }

  function isMeaningfulMarkerEvent(event, stateByTrack) {
    var trackState;

    if (!event || !stateByTrack) {
      return false;
    }

    if (!stateByTrack[event.trackIndex]) {
      stateByTrack[event.trackIndex] = {
        initialProgramSeen: false,
        initialControlsSeen: {}
      };
    }

    trackState = stateByTrack[event.trackIndex];

    if (event.start > 0) {
      return true;
    }

    if (event.type === "program") {
      if (!trackState.initialProgramSeen) {
        trackState.initialProgramSeen = true;
        return false;
      }
      return true;
    }

    if (event.type === "controlChange") {
      if (!trackState.initialControlsSeen[event.controller]) {
        trackState.initialControlsSeen[event.controller] = true;
        return false;
      }
      return true;
    }

    return true;
  }

  function getMarkerAvailability(song) {
    var availability = {};
    var playableTrackIndexes = {};
    var stateByTrack = {};
    var hasRegisterLinks = false;
    var hasRegisterState = false;

    getMarkerToggleEntries({
      markerTypeProgramToggle: true,
      markerTypeBankMsbToggle: true,
      markerTypeBankLsbToggle: true,
      markerTypeNrpnMsbToggle: true,
      markerTypeNrpnLsbToggle: true,
      markerTypeDataToggle: true,
      markerTypeVolumeToggle: true,
      markerTypePanToggle: true,
      markerTypeExpressionToggle: true,
      markerTypeAttackToggle: true,
      markerTypeReverbToggle: true,
      markerTypeOtherToggle: true
    }).forEach(function (entry) {
      availability[entry.key] = false;
    });

    if (!song || !song.infoEvents || !song.trackSummaries) {
      return {
        hasMeaningfulMarkers: false,
        byType: availability,
        hasRegisterLinks: false,
        hasRegisterState: false
      };
    }

    (song.trackSummaries || []).forEach(function (summary) {
      if (summary.hasPlayableNotes) {
        playableTrackIndexes[summary.index] = true;
      }
    });

    (song.infoEvents || []).forEach(function (event) {
      var key;

      if (!playableTrackIndexes[event.trackIndex]) {
        return;
      }

      if (event.type !== "program" && event.type !== "controlChange") {
        return;
      }

      if (!isMeaningfulMarkerEvent(event, stateByTrack)) {
        return;
      }

      key = getMarkerTypeKeyForEvent(event);
      if (key) {
        availability[key] = true;
      }

      if (event.type === "controlChange") {
        if (event.controller === 98 || event.controller === 99 || event.controller === 6) {
          hasRegisterLinks = true;
        }
        if (event.controller === 98 || event.controller === 99 || event.controller === 100 || event.controller === 101 || event.controller === 6) {
          hasRegisterState = true;
        }
      }
    });

    return {
      hasMeaningfulMarkers: Object.keys(availability).some(function (key) {
        return availability[key];
      }),
      byType: availability,
      hasRegisterLinks: hasRegisterLinks,
      hasRegisterState: hasRegisterState
    };
  }

  function syncMarkerControlsForSong(song, options) {
    var availability = getMarkerAvailability(song);

    if (options.markerToggleWrap) {
      options.markerToggleWrap.style.display = availability.hasMeaningfulMarkers ? "" : "none";
    }

    if (!availability.hasMeaningfulMarkers) {
      options.trackMarkerToggle.checked = false;
    }

    getMarkerToggleEntries(options).forEach(function (entry) {
      var label = entry.toggle ? entry.toggle.parentNode : null;
      var shown = !!availability.byType[entry.key];

      if (label) {
        label.style.display = shown ? "" : "none";
      }

      if (entry.toggle) {
        entry.toggle.checked = shown;
      }
    });

    if (options.registerLinkToggleWrap) {
      options.registerLinkToggleWrap.style.display = availability.hasRegisterLinks ? "" : "none";
    }
    options.registerLinkToggle.checked = availability.hasRegisterLinks;

    if (options.registerStateToggleWrap) {
      options.registerStateToggleWrap.style.display = availability.hasRegisterState ? "" : "none";
    }
    options.registerStateToggle.checked = availability.hasRegisterState;
    if (!availability.hasRegisterState) {
      options.registerStateToggle.checked = false;
      options.registerStateStatus.style.display = "none";
      options.registerStateStatus.innerHTML = "";
    }

    if (options.markerSubrowWrap) {
      options.markerSubrowWrap.style.display = (availability.hasRegisterLinks || availability.hasRegisterState) ? "" : "none";
    }

    options.updateMarkerControlsVisibility();
  }

  function isMarkerTypeEnabled(event, options) {
    if (!event) {
      return false;
    }

    if (event.type === "program") {
      return options.markerTypeProgramToggle.checked;
    }

    if (event.type !== "controlChange") {
      return true;
    }

    return options[`markerType${{
      0: 'BankMsb',
      6: 'Data',
      7: 'Volume',
      10: 'Pan',
      11: 'Expression',
      32: 'BankLsb',
      73: 'Attack',
      91: 'Reverb',
      98: 'NrpnLsb',
      99: 'NrpnMsb',
    }[event.controller] || 'Other'}Toggle`].checked;
  }

  function getTrackMarkerEvents(song, lane, options) {
    var trackEvents;
    var initialProgramSeen = false;
    var initialControlsSeen = {};

    if (!song || !song.infoEvents) {
      return [];
    }

    trackEvents = song.infoEvents.filter(function (event) {
      return event.trackIndex === lane.trackIndex &&
        (event.type === "program" || event.type === "controlChange");
    });

    return trackEvents.filter(function (event) {
      if (!isMarkerTypeEnabled(event, options)) {
        return false;
      }

      if (event.start > 0) {
        return true;
      }

      if (event.type === "program") {
        if (!initialProgramSeen) {
          initialProgramSeen = true;
          return false;
        }
        return true;
      }

      if (event.type === "controlChange") {
        if (!initialControlsSeen[event.controller]) {
          initialControlsSeen[event.controller] = true;
          return false;
        }
        return true;
      }

      return true;
    });
  }

  function getTrackMarkerColor(event, laneMuted) {
    var color = "#99ccff";

    if (event.type === "program") {
      color = "#99ccff";
    } else if (event.controller === 0) {
      color = "#ffb36b";
    } else if (event.controller === 32) {
      color = "#7fd0ff";
    } else if (event.controller === 6) {
      color = "#ff6666";
    } else if (event.controller === 7) {
      color = "#99ff99";
    } else if (event.controller === 10) {
      color = "#99ffff";
    } else if (event.controller === 11) {
      color = "#ffcc99";
    } else if (event.controller === 73) {
      color = "#ff9999";
    } else if (event.controller === 91) {
      color = "#99aaff";
    } else if (event.controller === 98 || event.controller === 99) {
      color = "#b999ff";
    }

    return laneMuted ? "rgba(170,170,190,0.75)" : color;
  }

  function shouldDrawTrackMarkerStem(markerEvent) {
    var controller = markerEvent && markerEvent.controller;

    if (!markerEvent || markerEvent.type !== "controlChange") {
      return true;
    }

    return !(controller === 0 || controller === 6 || controller === 32 || controller === 11 || controller === 73 || controller === 91 || controller === 98 || controller === 99);
  }

  window.ShoomiIndexMarkers = {
    getMarkerToggleEntries: getMarkerToggleEntries,
    syncMarkerControlsForSong: syncMarkerControlsForSong,
    getTrackMarkerEvents: getTrackMarkerEvents,
    getTrackMarkerColor: getTrackMarkerColor,
    shouldDrawTrackMarkerStem: shouldDrawTrackMarkerStem
  };
}());
