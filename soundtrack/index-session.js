(function () {
  function applyLongSongDefaultView(song, options) {
    if (!song || !song.duration || song.duration <= 300) {
      return;
    }

    if (options.fullSongToggle.checked) {
      options.fullSongToggle.checked = false;
    }

    if (Number(options.windowSlider.value) < 30) {
      options.windowSlider.value = "30";
      if (options.updateWindowSliderLabel) {
        options.updateWindowSliderLabel();
      }
    }

    if (options.setManualWindowStart) {
      options.setManualWindowStart(null);
    }
    if (options.persistViewState) {
      options.persistViewState();
    }
  }

  function handleLoadError(error, options) {
    var loadErrorMessage = error && error.message ? error.message : "Unknown load error.";

    if (options.setLoadErrorMessage) {
      options.setLoadErrorMessage(loadErrorMessage);
    }
    options.soundStatus.innerHTML = "load error";
    if (options.syncMarkerControlsForSong) {
      options.syncMarkerControlsForSong(null);
    }
    options.midiCaption.innerHTML = options.trackInfo.caption + "<BR><SPAN CLASS=\"soundtrack-inline-error\">Load error: " + options.escapeHtml(loadErrorMessage) + "</SPAN>";
    options.lyricStatus.innerHTML = "";
    options.trackSoundMapper.innerHTML = "";
    options.trackDetails.innerHTML = "";
    options.songMetadata.innerHTML = "";
    options.metaStateStatus.innerHTML = "";
    options.metaCurrentStatus.innerHTML = "";
    options.metaLaneDetails.innerHTML = "";
    options.registerStateStatus.innerHTML = "";
    options.registerStateStatus.style.display = "none";
    if (options.setMetaLaneData) {
      options.setMetaLaneData([]);
    }
    if (options.drawVisualizer) {
      options.drawVisualizer();
    }
  }

  function buildVisualization(song, options) {
    try {
      if (options.setLoadErrorMessage) {
        options.setLoadErrorMessage("");
      }
      applyLongSongDefaultView(song, options);
      options.ensureTrackSoundDefaults(song);
      options.syncMarkerControlsForSong(song);
      options.setLaneData(options.createLaneData(song));
      options.setMetaLaneData(options.createMetaLaneData(song));
      options.renderTrackSoundMapper(song);
      options.updateTrackDetails(song);
      options.updateSongMetadata(song);
      options.updateMetaLaneDetails(song);
      options.updateCurrentScoreState(song, 0);
      options.updateCurrentMetaEvents(song, 0);
      options.updateRegisterStateVisibility(song, 0);
      options.drawVisualizer();
    } catch (error) {
      handleLoadError(error, options);
    }
  }

  function replaceCustomMidiObjectUrl(nextUrl, currentUrl) {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    return nextUrl;
  }

  function fileNameFromUrl(url) {
    var clean = String(url).split("?")[0].split("#")[0];
    var parts = clean.split("/");
    return parts[parts.length - 1] || "Custom MIDI";
  }

  function loadSelectedMidi(midiValue, customOptions, options) {
    var midiOptions = customOptions || null;
    var nextTrackInfo;
    var absoluteMidiUrl;
    var selectedMidi = midiValue;
    var controller = options.getController ? options.getController() : null;

    if (!midiOptions && !options.tracks[selectedMidi]) {
      selectedMidi = "../midi_song_newage.mid";
    }

    if (options.setSelectedMidi) {
      options.setSelectedMidi(selectedMidi);
    }

    if (midiOptions) {
      options.setCurrentMidiSource("file");
      options.midiSourceFile.checked = true;
      options.midiSourceLibrary.checked = false;
      nextTrackInfo = {
        label: midiOptions.label || "Custom MIDI",
        caption: midiOptions.caption || "Custom MIDI loaded for the soundtrack player."
      };
      absoluteMidiUrl = midiOptions.midiUrl ? midiOptions.midiUrl : (midiOptions.midiHref || "");
    } else {
      options.setCurrentMidiSource("library");
      options.midiSourceLibrary.checked = true;
      options.midiSourceFile.checked = false;
      nextTrackInfo = options.tracks[selectedMidi];
      absoluteMidiUrl = new URL(selectedMidi, window.location.href).toString();
    }

    options.setTrackInfo(nextTrackInfo);
    options.setAbsoluteMidiUrl(absoluteMidiUrl);
    options.setVisualizerStartedAt(Date.now());
    options.setLaneData([]);
    options.setMetaLaneData([]);
    options.resetTrackSoundMap();
    options.setLoadErrorMessage("");
    options.setManualWindowStart(null);
    document.title = nextTrackInfo.label + " - Shoomi Soundtrack";
    if (!midiOptions) {
      options.midiSelect.value = selectedMidi;
    }
    options.midiLink.href = absoluteMidiUrl || "#";
    options.midiCaption.innerHTML = nextTrackInfo.caption;
    options.lyricStatus.innerHTML = "";
    options.trackSoundMapper.innerHTML = "";
    options.trackDetails.innerHTML = "";
    options.songMetadata.innerHTML = "";
    options.metaStateStatus.innerHTML = "";
    options.metaCurrentStatus.innerHTML = "";
    options.metaLaneDetails.innerHTML = "";
    options.soundStatus.innerHTML = "click to load";
    options.persistViewState(midiOptions && midiOptions.customUrl ? midiOptions.customUrl : "");

    if (controller && controller.destroy) {
      controller.destroy();
      controller = null;
      options.setController(null);
    }

    controller = window.createDreamSoundtrackController({
      toggleEl: options.soundToggle,
      statusEl: options.soundStatus,
      fallbackAudioEl: options.soundtrack,
      assetBase: options.absoluteAssetBase,
      midiUrl: absoluteMidiUrl,
      midiData: midiOptions ? midiOptions.midiData : null,
      preloadMidi: true,
      trackSoundMap: options.getTrackSoundMap ? options.getTrackSoundMap() : {},
      onSongReady: function (song) {
        buildVisualization(song, options);
      },
      onLoadError: function (error) {
        handleLoadError(error, options);
      }
    });

    options.setController(controller);
    options.drawVisualizer();
  }

  window.ShoomiIndexSession = {
    applyLongSongDefaultView: applyLongSongDefaultView,
    buildVisualization: buildVisualization,
    handleLoadError: handleLoadError,
    loadSelectedMidi: loadSelectedMidi,
    replaceCustomMidiObjectUrl: replaceCustomMidiObjectUrl,
    fileNameFromUrl: fileNameFromUrl
  };
})();
