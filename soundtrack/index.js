(function () {
  var pageShared = window.ShoomiIndexPageShared || {};
  var TRACKS = pageShared.TRACKS || {};
  var TRACK_COLORS = pageShared.TRACK_COLORS || {};
  var DRUM_SAMPLE_OPTIONS = pageShared.DRUM_SAMPLE_OPTIONS || [];
  var DRUM_FALLBACK_NOTES = pageShared.DRUM_FALLBACK_NOTES || {};
  var formatNumberRanges = pageShared.formatNumberRanges || function (values) { return String(values || ""); };
  var formatTime = pageShared.formatTime || function (seconds) { return String(seconds || 0); };
  var fitLabel = pageShared.fitLabel || function (_, text) { return String(text || ""); };
  var escapeHtml = pageShared.escapeHtml || function (text) { return String(text || ""); };
  var isCommentLikeTrackName = pageShared.isCommentLikeTrackName || function () { return false; };
  var getDrumName = pageShared.getDrumName || function () { return "Percussion"; };
  var sharedGetProgramMeaning = pageShared.getProgramMeaning || function () { return "(unknown)"; };
  var pageVisualizer = window.ShoomiIndexPageVisualizer || {};
  var varyLaneColor = pageVisualizer.varyLaneColor || function (color) { return color; };
  var drawMetaInfoBox = pageVisualizer.drawMetaInfoBox || function () {};
  var pageMetadata = window.ShoomiIndexPageMetadata || {};
  var getControlChangeLabel = pageMetadata.getControlChangeLabel || function () { return "Control"; };
  var isAppliedControlChange = pageMetadata.isAppliedControlChange || function () { return false; };
  var isTrackedControlChange = pageMetadata.isTrackedControlChange || function () { return false; };
  var pageState = window.ShoomiIndexPageState || {};
  var pageMapper = window.ShoomiIndexPageMapper || {};
  var pageMarkers = window.ShoomiIndexMarkers || {};
  var pageInteraction = window.ShoomiIndexInteraction || {};
  var pageData = window.ShoomiIndexData || {};
  var pageSession = window.ShoomiIndexSession || {};
  var params = new URLSearchParams(window.location.search);
  var selectedMidi = params.get("midi") || "../midi_song_newage.mid";
  var suggestionProfile = params.get("profile") || "gm";
  var trackInfo;
  var absoluteAssetBase;
  var absoluteMidiUrl;
  var soundtrack = document.getElementById("soundtrack");
  var soundToggle = document.getElementById("sound-toggle");
  var soundStatus = document.getElementById("sound-status");
  var midiSourceLibrary = document.getElementById("midi-source-library");
  var midiSourceFile = document.getElementById("midi-source-file");
  var midiSelect = document.getElementById("midi-select");
  var midiFile = document.getElementById("midi-file");
  var programProfileSelect = document.getElementById("program-profile");
  var midiLink = document.getElementById("midi-link");
  var fullSongToggle = document.getElementById("full-song-toggle");
  var trackMarkerToggle = document.getElementById("track-marker-toggle");
  var markerControlsWrap = document.getElementById("marker-controls-wrap");
  var markerTypeProgramToggle = document.getElementById("marker-type-program");
  var markerTypeBankMsbToggle = document.getElementById("marker-type-bank-msb");
  var markerTypeBankLsbToggle = document.getElementById("marker-type-bank-lsb");
  var markerTypeNrpnMsbToggle = document.getElementById("marker-type-nrpn-msb");
  var markerTypeNrpnLsbToggle = document.getElementById("marker-type-nrpn-lsb");
  var markerTypeDataToggle = document.getElementById("marker-type-data");
  var markerTypeVolumeToggle = document.getElementById("marker-type-volume");
  var markerTypePanToggle = document.getElementById("marker-type-pan");
  var markerTypeExpressionToggle = document.getElementById("marker-type-expression");
  var markerTypeAttackToggle = document.getElementById("marker-type-attack");
  var markerTypeReverbToggle = document.getElementById("marker-type-reverb");
  var markerTypeOtherToggle = document.getElementById("marker-type-other");
  var markerToggleWrap = trackMarkerToggle ? trackMarkerToggle.parentNode : null;
  var registerLinkToggle = document.getElementById("register-link-toggle");
  var registerStateToggle = document.getElementById("register-state-toggle");
  var registerLinkToggleWrap = registerLinkToggle ? registerLinkToggle.parentNode : null;
  var registerStateToggleWrap = registerStateToggle ? registerStateToggle.parentNode : null;
  var markerSubrowWrap = registerLinkToggleWrap ? registerLinkToggleWrap.parentNode : null;
  var registerStateStatus = document.getElementById("register-state-status");
  var windowSlider = document.getElementById("window-slider");
  var windowSliderValue = document.getElementById("window-slider-value");
  var timingStatus = document.getElementById("timing-status");
  var lyricStatus = document.getElementById("lyric-status");
  var midiCaption = document.getElementById("midi-caption");
  var trackSoundMapper = document.getElementById("track-sound-mapper");
  var trackDetails = document.getElementById("track-details");
  var songMetadata = document.getElementById("song-metadata");
  var spectrumVisualizer = document.getElementById("spectrum-visualizer");
  var visualizer = document.getElementById("track-visualizer");
  var metaVisualizerWrap = document.getElementById("meta-visualizer-wrap");
  var metaVisualizer = document.getElementById("meta-visualizer");
  var metaHoverTooltip = document.getElementById("meta-hover-tooltip");
  var trackHoverTooltip = document.getElementById("track-hover-tooltip");
  var metaStateStatus = document.getElementById("meta-state-status");
  var metaCurrentStatus = document.getElementById("meta-current-status");
  var metaLaneDetails = document.getElementById("meta-lane-details");
  var visualizerContext = visualizer ? visualizer.getContext("2d") : null;
  var spectrumVisualizerContext = spectrumVisualizer ? spectrumVisualizer.getContext("2d") : null;
  var metaVisualizerContext = metaVisualizer ? metaVisualizer.getContext("2d") : null;
  var controller = null;
  var laneData = [];
  var metaLaneData = [];
  var laneHitZones = [];
  var laneHoverZones = [];
  var trackMarkerHitZones = [];
  var metaHitZones = [];
  var drumsExpanded = false;
  var trackSoundMap = {};
  var customMidiObjectUrl = "";
  var customMidiState = null;
  var currentMidiSource = "library";
  var loadErrorMessage = "";
  var visualizerStartedAt = Date.now();
  var manualWindowStart = null;
  var mappingBias = "auto";
  var lastVisualizerRenderAt = 0;

  function getMetadataOptions() {
    return {
      target: null,
      controller: controller,
      trackSoundMap: trackSoundMap,
      buildTrackRoleMap: buildTrackRoleMap,
      getPlayableSummariesSorted: getPlayableSummariesSorted,
      getPreferredTrackLabel: getPreferredTrackLabel,
      findFirstTrackEvent: findFirstTrackEvent,
      formatSoundChoice: formatSoundChoice,
      suggestSoundChoice: suggestSoundChoice,
      escapeHtml: escapeHtml,
      formatTime: formatTime,
      isCommentLikeTrackName: isCommentLikeTrackName,
      getProgramMeaning: getProgramMeaning,
      describeMetaEventType: describeMetaEventType,
      findMetaSummaryForLane: findMetaSummaryForLane
    };
  }

  function getStateOptions() {
    return {
      metaStateStatus: metaStateStatus,
      registerStateToggle: registerStateToggle,
      registerStateStatus: registerStateStatus,
      lyricStatus: lyricStatus,
      metaVisualizer: metaVisualizer,
      metaHoverTooltip: metaHoverTooltip,
      visualizer: visualizer,
      trackHoverTooltip: trackHoverTooltip,
      escapeHtml: escapeHtml,
      formatTime: formatTime,
      getSong: function () {
        return controller && controller.getSong ? controller.getSong() : null;
      },
      getProgramMeaning: getProgramMeaning,
      getControlChangeLabel: getControlChangeLabel,
      isAppliedControlChange: isAppliedControlChange
    };
  }

  function getMapperOptions() {
    return {
      target: trackSoundMapper,
      controller: controller,
      trackSoundMap: trackSoundMap,
      drumSampleOptions: DRUM_SAMPLE_OPTIONS,
      drumFallbackNotes: DRUM_FALLBACK_NOTES,
      escapeHtml: escapeHtml,
      getDrumName: getDrumName,
      getPlayableSummariesSorted: getPlayableSummariesSorted,
      getPreferredTrackLabel: getPreferredTrackLabel,
      findFirstTrackEvent: findFirstTrackEvent,
      formatChannelProgram: formatChannelProgram,
      getProgramMeaning: getProgramMeaning,
      ensureTrackSoundDefaults: ensureTrackSoundDefaults,
      applyTrackSoundChoice: applyTrackSoundChoice,
      onMapperChanged: function (song) {
        if (controller && controller.getSong) {
          laneData = createLaneData(controller.getSong());
          updateTrackDetails(controller.getSong());
        }
        renderTrackSoundMapper(song);
        drawVisualizer();
      },
      getMappingBias: function () {
        return mappingBias;
      },
      setMappingBias: function (value) {
        mappingBias = value;
      },
      resetTrackSoundMap: function () {
        trackSoundMap = {};
      }
    };
  }

  function getMarkerOptions() {
    return {
      markerTypeProgramToggle: markerTypeProgramToggle,
      markerTypeBankMsbToggle: markerTypeBankMsbToggle,
      markerTypeBankLsbToggle: markerTypeBankLsbToggle,
      markerTypeNrpnMsbToggle: markerTypeNrpnMsbToggle,
      markerTypeNrpnLsbToggle: markerTypeNrpnLsbToggle,
      markerTypeDataToggle: markerTypeDataToggle,
      markerTypeVolumeToggle: markerTypeVolumeToggle,
      markerTypePanToggle: markerTypePanToggle,
      markerTypeExpressionToggle: markerTypeExpressionToggle,
      markerTypeAttackToggle: markerTypeAttackToggle,
      markerTypeReverbToggle: markerTypeReverbToggle,
      markerTypeOtherToggle: markerTypeOtherToggle,
      markerToggleWrap: markerToggleWrap,
      trackMarkerToggle: trackMarkerToggle,
      registerLinkToggle: registerLinkToggle,
      registerStateToggle: registerStateToggle,
      registerLinkToggleWrap: registerLinkToggleWrap,
      registerStateToggleWrap: registerStateToggleWrap,
      markerSubrowWrap: markerSubrowWrap,
      registerStateStatus: registerStateStatus,
      updateMarkerControlsVisibility: updateMarkerControlsVisibility
    };
  }

  function getDataOptions() {
    return {
      drumsExpanded: drumsExpanded,
      trackColors: TRACK_COLORS,
      getDrumName: getDrumName,
      getTrackSoundChoice: getTrackSoundChoice,
      getSoundChoiceRole: getSoundChoiceRole,
      getDisplayLaneName: getDisplayLaneName,
      getProgramMeaning: getProgramMeaning,
      isCommentLikeTrackName: isCommentLikeTrackName
    };
  }

  function getInteractionOptions() {
    return {
      visualizer: visualizer,
      metaVisualizer: metaVisualizer,
      lyricStatus: lyricStatus,
      windowSlider: windowSlider,
      getTrackMarkerHitZones: function () {
        return trackMarkerHitZones;
      },
      getLaneHoverZones: function () {
        return laneHoverZones;
      },
      getLaneHitZones: function () {
        return laneHitZones;
      },
      getMetaHitZones: function () {
        return metaHitZones;
      },
      showTrackTooltip: showTrackTooltip,
      hideTrackTooltip: hideTrackTooltip,
      showTrackLaneTooltip: showTrackLaneTooltip,
      showMetaTooltip: showMetaTooltip,
      hideMetaTooltip: hideMetaTooltip,
      getController: function () {
        return controller;
      },
      isFullSong: function () {
        return fullSongToggle.checked;
      },
      getVisibleWindow: getVisibleWindow,
      setManualWindowStart: function (value) {
        manualWindowStart = value;
      },
      drawVisualizer: drawVisualizer,
      seekToTime: function (time) {
        if (!controller || !controller.seek) {
          return;
        }
        if (!controller.isPaused || !controller.isPaused()) {
          manualWindowStart = null;
        }
        controller.seek(time);
        drawVisualizer();
      },
      toggleDrumsExpanded: function () {
        drumsExpanded = !drumsExpanded;
        if (controller && controller.getSong) {
          laneData = createLaneData(controller.getSong());
          updateTrackDetails(controller.getSong());
        }
        drawVisualizer();
      },
      toggleMuteKey: function (muteKey) {
        if (!controller || !controller.setMuteKey) {
          return;
        }
        controller.setMuteKey(muteKey, !controller.isMuteKey(muteKey));
        updateTrackDetails(controller.getSong());
        drawVisualizer();
      }
    };
  }

  function getSessionOptions() {
    return {
      tracks: TRACKS,
      trackInfo: trackInfo,
      soundtrack: soundtrack,
      soundToggle: soundToggle,
      soundStatus: soundStatus,
      midiSourceLibrary: midiSourceLibrary,
      midiSourceFile: midiSourceFile,
      midiSelect: midiSelect,
      midiLink: midiLink,
      midiCaption: midiCaption,
      lyricStatus: lyricStatus,
      trackSoundMapper: trackSoundMapper,
      trackDetails: trackDetails,
      songMetadata: songMetadata,
      metaStateStatus: metaStateStatus,
      metaCurrentStatus: metaCurrentStatus,
      metaLaneDetails: metaLaneDetails,
      registerStateStatus: registerStateStatus,
      absoluteAssetBase: absoluteAssetBase,
      escapeHtml: escapeHtml,
      fullSongToggle: fullSongToggle,
      windowSlider: windowSlider,
      updateWindowSliderLabel: updateWindowSliderLabel,
      persistViewState: persistViewState,
      syncMarkerControlsForSong: syncMarkerControlsForSong,
      ensureTrackSoundDefaults: ensureTrackSoundDefaults,
      createLaneData: createLaneData,
      createMetaLaneData: createMetaLaneData,
      renderTrackSoundMapper: renderTrackSoundMapper,
      updateTrackDetails: updateTrackDetails,
      updateSongMetadata: updateSongMetadata,
      updateMetaLaneDetails: updateMetaLaneDetails,
      updateCurrentScoreState: updateCurrentScoreState,
      updateCurrentMetaEvents: updateCurrentMetaEvents,
      updateRegisterStateVisibility: updateRegisterStateVisibility,
      drawVisualizer: drawVisualizer,
      getController: function () {
        return controller;
      },
      setController: function (value) {
        controller = value;
      },
      setSelectedMidi: function (value) {
        selectedMidi = value;
      },
      setTrackInfo: function (value) {
        trackInfo = value;
      },
      setAbsoluteMidiUrl: function (value) {
        absoluteMidiUrl = value;
      },
      setVisualizerStartedAt: function (value) {
        visualizerStartedAt = value;
      },
      setLaneData: function (value) {
        laneData = value;
      },
      setMetaLaneData: function (value) {
        metaLaneData = value;
      },
      resetTrackSoundMap: function () {
        trackSoundMap = {};
      },
      getTrackSoundMap: function () {
        return trackSoundMap;
      },
      setLoadErrorMessage: function (value) {
        loadErrorMessage = value;
      },
      setManualWindowStart: function (value) {
        manualWindowStart = value;
      },
      setCurrentMidiSource: function (value) {
        currentMidiSource = value;
      }
    };
  }

  function updateTrackDetails(song) {
    var options = getMetadataOptions();
    options.target = trackDetails;
    if (pageMetadata.updateTrackDetails) {
      pageMetadata.updateTrackDetails(song, options);
    }
  }

  function updateSongMetadata(song) {
    var options = getMetadataOptions();
    options.target = songMetadata;
    if (pageMetadata.updateSongMetadata) {
      pageMetadata.updateSongMetadata(song, options);
    }
  }

  function updateMetaLaneDetails(song) {
    var options = getMetadataOptions();
    options.target = metaLaneDetails;
    if (pageMetadata.updateMetaLaneDetails) {
      pageMetadata.updateMetaLaneDetails(song, metaLaneData, options);
    }
  }

  function updateCurrentScoreState(song, currentPosition) {
    if (pageState.updateCurrentScoreState) {
      pageState.updateCurrentScoreState(song, currentPosition, getStateOptions());
    }
  }

  function updateRegisterStateVisibility(song, currentPosition) {
    if (pageState.updateRegisterStateVisibility) {
      pageState.updateRegisterStateVisibility(song, currentPosition, getStateOptions());
    }
  }

  function updateCurrentLyric(song, currentPosition) {
    if (pageState.updateCurrentLyric) {
      pageState.updateCurrentLyric(song, currentPosition, getStateOptions());
    }
  }

  function describeMetaEventType(type) {
    if (pageState.describeMetaEventType) {
      return pageState.describeMetaEventType(type);
    }
    return type;
  }

  function showMetaTooltip(zone, point) {
    if (pageState.showMetaTooltip) {
      pageState.showMetaTooltip(zone, point, getStateOptions());
    }
  }

  function hideMetaTooltip() {
    if (pageState.hideMetaTooltip) {
      pageState.hideMetaTooltip(metaHoverTooltip);
    }
  }

  function showTrackTooltip(zone, point) {
    if (pageState.showTrackTooltip) {
      pageState.showTrackTooltip(zone, point, getStateOptions());
    }
  }

  function hideTrackTooltip() {
    if (pageState.hideTrackTooltip) {
      pageState.hideTrackTooltip(trackHoverTooltip);
    }
  }

  function showTrackLaneTooltip(zone, point) {
    if (pageState.showTrackLaneTooltip) {
      pageState.showTrackLaneTooltip(zone, point, getStateOptions());
    }
  }

  function renderTrackSoundMapper(song) {
    if (pageMapper.renderTrackSoundMapper) {
      pageMapper.renderTrackSoundMapper(song, getMapperOptions());
    }
  }

  function getTrackSoundChoice(trackIndex, event, summary) {
    if (pageMapper.getTrackSoundChoice) {
      return pageMapper.getTrackSoundChoice(trackIndex, event, summary, getMapperOptions());
    }
    return trackSoundMap[trackIndex];
  }

  function suggestSoundChoice(summary, event) {
    if (pageMapper.suggestSoundChoice) {
      return pageMapper.suggestSoundChoice(summary, event, getMapperOptions());
    }
    return "program:50";
  }

  function getSoundChoiceRole(choice) {
    if (pageMapper.getSoundChoiceRole) {
      return pageMapper.getSoundChoiceRole(choice, getMapperOptions());
    }
    return "Audio";
  }

  function getDisplayLaneName(displayName, role) {
    if (pageMapper.getDisplayLaneName) {
      return pageMapper.getDisplayLaneName(displayName, role);
    }
    return displayName;
  }

  function formatSoundChoice(choice) {
    if (pageMapper.formatSoundChoice) {
      return pageMapper.formatSoundChoice(choice, getMapperOptions());
    }
    return "Auto";
  }

  function getProgramMeaning(program) {
    return sharedGetProgramMeaning(program, suggestionProfile);
  }

  function normalizeTrackSoundChoice(choice, event, summary) {
    if (pageMapper.normalizeTrackSoundChoice) {
      return pageMapper.normalizeTrackSoundChoice(choice, event, summary, getMapperOptions());
    }
    return choice;
  }

  function suggestDrumSampleNote(note) {
    if (pageMapper.suggestDrumSampleNote) {
      return pageMapper.suggestDrumSampleNote(note, getMapperOptions());
    }
    return 42;
  }

  function suggestTrackDrumSampleNote(summary, event) {
    if (pageMapper.suggestTrackDrumSampleNote) {
      return pageMapper.suggestTrackDrumSampleNote(summary, event);
    }
    return 42;
  }

  function getMarkerToggleEntries() {
    if (pageMarkers.getMarkerToggleEntries) {
      return pageMarkers.getMarkerToggleEntries(getMarkerOptions());
    }
    return [];
  }

  function syncMarkerControlsForSong(song) {
    if (pageMarkers.syncMarkerControlsForSong) {
      pageMarkers.syncMarkerControlsForSong(song, getMarkerOptions());
    }
  }

  if (!soundtrack || !soundToggle || !soundStatus || !midiSourceLibrary || !midiSourceFile || !midiSelect || !midiFile || !programProfileSelect || !midiLink || !fullSongToggle || !trackMarkerToggle || !markerControlsWrap || !markerTypeProgramToggle || !markerTypeBankMsbToggle || !markerTypeBankLsbToggle || !markerTypeNrpnMsbToggle || !markerTypeNrpnLsbToggle || !markerTypeDataToggle || !markerTypeVolumeToggle || !markerTypePanToggle || !markerTypeExpressionToggle || !markerTypeAttackToggle || !markerTypeReverbToggle || !markerTypeOtherToggle || !registerLinkToggle || !registerStateToggle || !registerStateStatus || !windowSlider || !windowSliderValue || !timingStatus || !lyricStatus || !midiCaption || !trackSoundMapper || !trackDetails || !songMetadata || !spectrumVisualizerContext || !visualizerContext || !metaVisualizerWrap || !metaVisualizerContext || !metaHoverTooltip || !trackHoverTooltip || !metaStateStatus || !metaCurrentStatus || !metaLaneDetails) {
    return;
  }

  if (!TRACKS[selectedMidi] && !params.get("custom_url")) {
    selectedMidi = "../midi_song_newage.mid";
  }
  if (!/^(gm|gs|xg|game)$/.test(suggestionProfile)) {
    suggestionProfile = "gm";
  }
  programProfileSelect.value = suggestionProfile;

  fullSongToggle.checked = params.get("full") !== "0";
  windowSlider.value = String(Math.max(1, Math.min(30, Number(params.get("range")) || 10)));
  absoluteAssetBase = new URL("..", window.location.href).toString().replace(/\/$/, "");

  midiSourceLibrary.onchange = function () {
    if (!midiSourceLibrary.checked) {
      return;
    }

    currentMidiSource = "library";
    loadSelectedMidi(midiSelect.value);
  };

  midiSourceFile.onchange = function () {
    if (!midiSourceFile.checked) {
      return;
    }

    if (customMidiState) {
      currentMidiSource = "file";
      loadSelectedMidi("__custom_file__", customMidiState);
      return;
    }

    midiFile.click();
  };

  midiSelect.onchange = function () {
    midiSourceLibrary.checked = true;
    midiSourceFile.checked = false;
    currentMidiSource = "library";
    loadSelectedMidi(midiSelect.value);
  };

  midiFile.onchange = function () {
    var file = midiFile.files && midiFile.files[0];
    var reader;

    if (!file) {
      return;
    }

    reader = new FileReader();
    reader.onload = function () {
      customMidiState = {
        midiData: reader.result,
        midiHref: replaceCustomMidiObjectUrl(URL.createObjectURL(file)),
        label: file.name,
        caption: "Custom MIDI loaded from your computer.",
        customUrl: ""
      };
      midiSourceFile.checked = true;
      midiSourceLibrary.checked = false;
      currentMidiSource = "file";
      loadSelectedMidi("__custom_file__", customMidiState);
    };
    reader.readAsArrayBuffer(file);
  };

  programProfileSelect.onchange = function () {
    suggestionProfile = programProfileSelect.value;
    if (customMidiState && currentMidiSource === "file") {
      loadSelectedMidi("__custom_file__", customMidiState);
      return;
    }
    loadSelectedMidi(midiSelect.value);
  };

  fullSongToggle.onchange = function () {
    persistViewState();
    drawVisualizer();
  };

  windowSlider.oninput = function () {
    if (fullSongToggle.checked) {
      fullSongToggle.checked = false;
    }
    manualWindowStart = null;
    updateWindowSliderLabel();
    persistViewState();
    drawVisualizer();
  };

  trackMarkerToggle.onchange = function () {
    updateMarkerControlsVisibility();
    drawVisualizer();
  };

  [
    markerTypeProgramToggle,
    markerTypeBankMsbToggle,
    markerTypeBankLsbToggle,
    markerTypeNrpnMsbToggle,
    markerTypeNrpnLsbToggle,
    markerTypeDataToggle,
    markerTypeVolumeToggle,
    markerTypePanToggle,
    markerTypeExpressionToggle,
    markerTypeAttackToggle,
    markerTypeReverbToggle,
    markerTypeOtherToggle
  ].forEach(function (toggle) {
    toggle.onchange = function () {
      drawVisualizer();
    };
  });

  registerLinkToggle.onchange = function () {
    drawVisualizer();
  };

  registerStateToggle.onchange = function () {
    updateRegisterStateVisibility(controller ? controller.getSong() : null, controller ? controller.getPlaybackPosition() : 0);
    drawVisualizer();
  };

  updateWindowSliderLabel();
  syncMarkerControlsForSong(null);
  updateMarkerControlsVisibility();
  if (pageInteraction.attachInteractionHandlers) {
    pageInteraction.attachInteractionHandlers(getInteractionOptions());
  }

  if (window.createDreamSoundtrackController) {
    loadSelectedMidi(selectedMidi);
    animateVisualizer();
    return;
  }

  function buildVisualization(song) {
    if (pageSession.buildVisualization) {
      pageSession.buildVisualization(song, getSessionOptions());
    }
  }

  function applyLongSongDefaultView(song) {
    if (pageSession.applyLongSongDefaultView) {
      pageSession.applyLongSongDefaultView(song, getSessionOptions());
    }
  }

  function handleLoadError(error) {
    if (pageSession.handleLoadError) {
      pageSession.handleLoadError(error, getSessionOptions());
    }
  }

  function loadSelectedMidi(midiValue, customOptions) {
    if (pageSession.loadSelectedMidi) {
      pageSession.loadSelectedMidi(midiValue, customOptions, getSessionOptions());
    }
  }

  function createLaneData(song) {
    if (pageData.createLaneData) {
      return pageData.createLaneData(song, getDataOptions());
    }
    return [];
  }

  function createMetaLaneData(song) {
    if (pageData.createMetaLaneData) {
      return pageData.createMetaLaneData(song, getDataOptions());
    }
    return [];
  }

  function getLaneName(event) {
    if (pageData.getLaneName) {
      return pageData.getLaneName(controller ? controller.getSong() : null, event, getDataOptions());
    }
    return "Audio";
  }

  function getLaneInfo(song, event) {
    if (pageData.getLaneInfo) {
      return pageData.getLaneInfo(song, event, getDataOptions());
    }
    return { key: "track:" + event.trackIndex, name: "Track", role: "Audio", color: "#bbbbdd" };
  }

  function getLaneMuteKey(event) {
    if (pageData.getLaneMuteKey) {
      return pageData.getLaneMuteKey(event, drumsExpanded);
    }
    return "track:" + event.trackIndex;
  }

  function getVisualizerFrameInterval() {
    var song;
    var eventCount;

    if (!controller || !controller.getSong) {
      return 120;
    }

    song = controller.getSong();
    if (!song || !song.events) {
      return 120;
    }

    eventCount = song.events.length;

    if (eventCount > 50000) {
      return 220;
    }
    if (eventCount > 25000) {
      return 140;
    }
    if (eventCount > 12000) {
      return 90;
    }
    if (eventCount > 6000) {
      return 60;
    }

    return 33;
  }

  function animateVisualizer(timestamp) {
    var shouldDrawMain = false;
    var isPlaying = controller && controller.isPaused && !controller.isPaused();
    var now = Date.now();

    if (!lastVisualizerRenderAt) {
      shouldDrawMain = true;
    } else if (isPlaying && (now - lastVisualizerRenderAt) >= getVisualizerFrameInterval()) {
      shouldDrawMain = true;
    }

    if (shouldDrawMain) {
      drawVisualizer();
      lastVisualizerRenderAt = now;
    }

    drawSpectrumVisualizer();
    window.requestAnimationFrame(animateVisualizer);
  }

  function drawSpectrumVisualizer() {
    var width = spectrumVisualizer.width;
    var height = spectrumVisualizer.height;
    var data;
    var barCount;
    var step;
    var index;
    var x;
    var barWidth;
    var value;
    var barHeight;

    spectrumVisualizerContext.clearRect(0, 0, width, height);
    spectrumVisualizerContext.fillStyle = "#000018";
    spectrumVisualizerContext.fillRect(0, 0, width, height);

    if (!controller || !controller.getSpectrumData) {
      spectrumVisualizerContext.fillStyle = "#99ccff";
      spectrumVisualizerContext.font = "12px Times New Roman";
      spectrumVisualizerContext.fillText("Spectrum will appear when Web Audio is active.", 14, 22);
      return;
    }

    data = controller.getSpectrumData();
    if (!data || !data.length) {
      spectrumVisualizerContext.fillStyle = "#99ccff";
      spectrumVisualizerContext.font = "12px Times New Roman";
      spectrumVisualizerContext.fillText("Click play or use a preview button to activate the spectrum.", 14, 22);
      return;
    }

    barCount = 48;
    step = Math.max(1, Math.floor(data.length / barCount));
    barWidth = width / barCount;

    for (index = 0; index < barCount; index += 1) {
      value = data[Math.min(data.length - 1, index * step)] / 255;
      barHeight = Math.max(2, value * (height - 18));
      x = index * barWidth;
      spectrumVisualizerContext.fillStyle = "hsl(" + Math.round(190 + (index / barCount) * 100) + ", 70%, " + Math.round(28 + (value * 36)) + "%)";
      spectrumVisualizerContext.fillRect(x + 1, height - barHeight - 10, Math.max(2, barWidth - 2), barHeight);
    }

    spectrumVisualizerContext.strokeStyle = "rgba(255,255,255,0.12)";
    spectrumVisualizerContext.beginPath();
    spectrumVisualizerContext.moveTo(0, height - 9.5);
    spectrumVisualizerContext.lineTo(width, height - 9.5);
    spectrumVisualizerContext.stroke();
    spectrumVisualizerContext.fillStyle = "#8888bb";
    spectrumVisualizerContext.font = "10px Times New Roman";
    spectrumVisualizerContext.fillText("low", 4, height - 1);
    spectrumVisualizerContext.fillText("high", width - 22, height - 1);
  }

  function drawVisualizer() {
    var duration;
    var song;
    var currentPosition = 0;
    var visibleWindow;
    var visibleStart;
    var visibleEnd;
    var laneHeights = [];
    var topPadding = 30;
    var leftPadding = 120;
    var rightPadding = 12;
    var bottomPadding = 12;
    var innerWidth;
    var innerHeight;
    var playheadX;
    var muteIconX = 12;
    var expandIconX = 26;
    var desiredHeight;
    var totalUnits = 0;
    var cursorY;
    var currentVisibleWindow;
    var timingSummary;

    desiredHeight = Math.max(260, 52 + laneData.reduce(function (total, lane) {
      return total + (lane.isDrumChild ? 18 : 40);
    }, 0));
    lastVisualizerRenderAt = Date.now();
    if (visualizer.height !== desiredHeight) {
      visualizer.height = desiredHeight;
      visualizer.style.height = desiredHeight + "px";
    }
    visualizerContext.clearRect(0, 0, visualizer.width, visualizer.height);
    visualizerContext.fillStyle = "#000022";
    visualizerContext.fillRect(0, 0, visualizer.width, visualizer.height);
    laneHitZones = [];
    laneHoverZones = [];
    trackMarkerHitZones = [];

    if (!laneData.length || !controller || !controller.getSong()) {
      var loadState = controller && controller.getLoadState ? controller.getLoadState() : "";
      timingStatus.innerHTML = "";
      visualizerContext.fillStyle = "#99ccff";
      visualizerContext.font = "14px Times New Roman";
      pageVisualizer.drawCanvasTimingSummary(visualizerContext, visualizer.width, "Current: --:-- / Duration: --:-- / View: -- / Window: --:-- - --:--");
      if (loadState === "idle") {
        visualizerContext.fillText("Click play to load the MIDI and sample audio.", 16, 28);
        visualizerContext.fillStyle = "#9999ff";
        visualizerContext.font = "12px Times New Roman";
        visualizerContext.fillText("The track map appears after the file is loaded.", 16, 46);
      } else if (loadState === "loading-midi") {
        visualizerContext.fillText("Loading MIDI track map...", 16, 28);
      } else if ((Date.now() - visualizerStartedAt) > 4000) {
        visualizerContext.fillText("Track map could not load for this selection.", 16, 28);
        visualizerContext.fillStyle = "#9999ff";
        visualizerContext.font = "12px Times New Roman";
        if (loadErrorMessage) {
          visualizerContext.fillText(loadErrorMessage, 16, 46);
        } else {
          visualizerContext.fillText("Try re-selecting the MIDI or reloading the page.", 16, 46);
        }
      } else {
        visualizerContext.fillText("Loading track map...", 16, 28);
      }
      drawMetaVisualizer(null, null);
      return;
    }

    song = controller.getSong();
    duration = song.duration || 1;
    currentPosition = controller.getPlaybackPosition();
    visibleWindow = getVisibleWindow(duration, currentPosition);
    currentVisibleWindow = visibleWindow;
    visibleStart = visibleWindow.start;
    visibleEnd = visibleWindow.end;
    innerWidth = visualizer.width - leftPadding - rightPadding;
    innerHeight = visualizer.height - topPadding - bottomPadding;

    laneData.forEach(function (lane) {
      var units = 1;

      if (lane.isDrumChild) {
        units = 0.48;
      }

      laneHeights.push(units);
      totalUnits += units;
    });

    cursorY = topPadding;
    timingSummary = "Current: " + formatTime(currentPosition) + " / Duration: " + formatTime(duration) + " / View: " + visibleWindow.label + " / Window: " + formatTime(visibleStart) + " - " + formatTime(visibleEnd);
    timingStatus.innerHTML = "";
      pageVisualizer.drawCanvasTimingSummary(visualizerContext, visualizer.width, timingSummary);
    updateCurrentLyric(controller.getSong(), currentPosition);
    updateCurrentScoreState(controller.getSong(), currentPosition);
    updateCurrentMetaEvents(controller.getSong(), currentPosition);

    laneData.forEach(function (lane, index) {
      var laneHeight = (innerHeight * laneHeights[index]) / Math.max(totalUnits, 1);
      var laneTop = cursorY;
      var laneMuted = controller && controller.isMuteKey && lane.muteKey ? controller.isMuteKey(lane.muteKey) : false;
      var laneColor = laneMuted ? "#666688" : lane.color;
      var laneLabel = lane.name;
      var labelX = 30;
      var labelY = laneTop + Math.min(14, Math.max(11, laneHeight * 0.55));

      visualizerContext.fillStyle = "rgba(255,255,255,0.04)";
      visualizerContext.fillRect(leftPadding, laneTop, innerWidth, laneHeight - 6);

      if (lane.trackIndex !== null && lane.trackIndex !== undefined) {
        laneHoverZones.push({
          x: leftPadding,
          y: laneTop,
          width: innerWidth,
          height: Math.max(10, laneHeight - 6),
          lane: lane,
          visibleStart: visibleWindow.start,
          visibleSeconds: visibleWindow.seconds
        });
      }

      if (lane.trackIndex !== undefined && !lane.isMetaLane) {
        pageVisualizer.drawSpeakerIcon(visualizerContext, muteIconX, laneTop + 3, !laneMuted);
        laneHitZones.push({
          type: "mute",
          muteKey: lane.muteKey,
          x: muteIconX - 2,
          y: laneTop + 1,
          width: 16,
          height: 16
        });
      }

      if (lane.name === "Drums") {
        pageVisualizer.drawExpandIcon(visualizerContext, expandIconX, laneTop + 3, drumsExpanded);
        laneHitZones.push({
          type: "expand-drums",
          x: expandIconX - 2,
          y: laneTop + 1,
          width: 14,
          height: 16
        });
        labelX = 44;
      } else if (lane.isDrumChild) {
        labelX = 44;
      }

      visualizerContext.fillStyle = laneColor;
      visualizerContext.font = lane.isDrumChild ? "11px Times New Roman" : "12px Times New Roman";
      visualizerContext.fillText(laneLabel, labelX, labelY);

      lane.segments.forEach(function (segment, segmentIndex) {
        var segmentEnd = segment.start + segment.duration;
        var clippedStart;
        var clippedEnd;
        var x;
        var width;
        var noteOffset = lane.name.indexOf("Drums") === 0 ? 0.45 : (1 - ((segment.note - 36) / 40));
        var y = laneTop + 4 + ((laneHeight - 14) * Math.max(0.05, Math.min(0.85, noteOffset)));
        var segmentColor = laneMuted ? laneColor : varyLaneColor(lane.color, segmentIndex);

        if (segmentEnd < visibleStart || segment.start > visibleEnd) {
          return;
        }

        clippedStart = Math.max(segment.start, visibleStart);
        clippedEnd = Math.min(segmentEnd, visibleEnd);
        x = leftPadding + (((clippedStart - visibleStart) / visibleWindow.seconds) * innerWidth);
        width = Math.max(2, ((clippedEnd - clippedStart) / visibleWindow.seconds) * innerWidth);

        visualizerContext.fillStyle = segmentColor;
        if (lane.isMetaLane) {
          visualizerContext.fillRect(x, laneTop + 4, 2, laneHeight - 10);
        } else {
          visualizerContext.fillRect(x, y, width, 4);
        }
      });

      if (trackMarkerToggle.checked) {
        drawTrackLaneMarkers(song, lane, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow, laneMuted);
      }

      cursorY += laneHeight;
    });

    playheadX = leftPadding + (((currentPosition - visibleStart) / visibleWindow.seconds) * innerWidth);
    visualizerContext.strokeStyle = "#ffffff";
    visualizerContext.lineWidth = 2;
    visualizerContext.beginPath();
    visualizerContext.moveTo(playheadX, topPadding - 2);
    visualizerContext.lineTo(playheadX, visualizer.height - bottomPadding + 2);
    visualizerContext.stroke();

    visualizerContext.fillStyle = "#9999ff";
    visualizerContext.font = "11px Times New Roman";
    visualizerContext.fillText(formatTime(visibleStart), leftPadding, visualizer.height - 2);
    visualizerContext.fillText(formatTime(visibleEnd), visualizer.width - rightPadding - 34, visualizer.height - 2);
    drawMetaVisualizer(song, currentVisibleWindow, currentPosition);
  }

  function drawTrackLaneMarkers(song, lane, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow, laneMuted) {
    var markerEvents;

    if (!song || lane.isDrumChild || lane.trackIndex === null || lane.trackIndex === undefined) {
      return;
    }

    markerEvents = getTrackMarkerEvents(song, lane);
    markerEvents.forEach(function (markerEvent) {
      var x;
      var markerColor;

      if (markerEvent.start < visibleWindow.start || markerEvent.start > visibleWindow.end) {
        return;
      }

      x = leftPadding + (((markerEvent.start - visibleWindow.start) / visibleWindow.seconds) * innerWidth);
      markerColor = getTrackMarkerColor(markerEvent, laneMuted);

      if (registerLinkToggle.checked && markerEvent.type === "controlChange" && markerEvent.controller === 6) {
        drawRegisterLinks(song, lane, markerEvent, x, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow);
      }

      if (shouldDrawTrackMarkerStem(markerEvent)) {
        visualizerContext.fillStyle = markerColor;
        visualizerContext.fillRect(x - 0.5, laneTop + 2, 1.5, Math.max(10, laneHeight - 10));
      }
      drawTrackMarkerGlyph(x, laneTop, laneHeight, markerColor, markerEvent);

      trackMarkerHitZones.push({
        x: x - 10,
        y: laneTop + 1,
        width: 20,
        height: Math.max(18, laneHeight - 2),
        type: "marker",
        time: markerEvent.start,
        laneName: lane.name,
        label: markerEvent.label,
        eventType: markerEvent.type,
        channel: markerEvent.channel,
        program: markerEvent.program,
        controller: markerEvent.controller,
        value: markerEvent.value
      });
    });
  }

  function drawRegisterLinks(song, lane, markerEvent, x, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow) {
    var previousMsb;
    var previousLsb;

    if (markerEvent.channel === undefined || markerEvent.channel === null) {
      return;
    }

    previousMsb = findPreviousChannelControlEvent(song, markerEvent.channel, 99, markerEvent.start);
    previousLsb = findPreviousChannelControlEvent(song, markerEvent.channel, 98, markerEvent.start);

    if (previousMsb) {
      drawRegisterLinkCurve(previousMsb, x, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow, "#ffb366");
    }
    if (previousLsb) {
      drawRegisterLinkCurve(previousLsb, x, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow, "#99ddff");
    }
  }

  function findPreviousChannelControlEvent(song, channel, controllerNumber, time) {
    var found = null;

    (song.infoEvents || []).forEach(function (event) {
      if (event.channel === channel && event.type === "controlChange" && event.controller === controllerNumber && event.start < time) {
        if (!found || event.start > found.start) {
          found = event;
        }
      }
    });

    return found;
  }

  function drawRegisterLinkCurve(sourceEvent, targetX, laneTop, laneHeight, leftPadding, innerWidth, visibleWindow, color) {
    var sourceLanePosition = getLaneVerticalPosition(sourceEvent.trackIndex);
    var sourceX;
    var virtualSourceX;
    var sourceY = sourceLanePosition ? sourceLanePosition.centerY : (laneTop + Math.max(13, Math.min(laneHeight - 6, laneHeight * 0.64)));
    var targetY = laneTop + Math.max(8, Math.min(laneHeight - 14, laneHeight * 0.24));
    var controlOffset;

    virtualSourceX = leftPadding + (((sourceEvent.start - visibleWindow.start) / visibleWindow.seconds) * innerWidth);
    sourceX = Math.max(leftPadding - 18, Math.min(leftPadding + innerWidth + 18, virtualSourceX));
    controlOffset = Math.max(10, Math.min(40, Math.abs(targetX - sourceX) * 0.35));

    visualizerContext.save();
    visualizerContext.strokeStyle = color;
    visualizerContext.lineWidth = 1;
    visualizerContext.beginPath();
    visualizerContext.moveTo(sourceX, sourceY);
    visualizerContext.bezierCurveTo(
      sourceX + controlOffset, sourceY - 6,
      targetX - controlOffset, targetY + 6,
      targetX, targetY
    );
    visualizerContext.stroke();
    visualizerContext.restore();
  }

  function getLaneVerticalPosition(trackIndex) {
    var topPadding = 22;
    var bottomPadding = 16;
    var innerHeight = visualizer.height - topPadding - bottomPadding;
    var laneHeights = [];
    var totalUnits = 0;
    var cursorY = topPadding;
    var index;

    for (index = 0; index < laneData.length; index += 1) {
      var units = laneData[index].isDrumChild ? 0.48 : 1;
      laneHeights.push(units);
      totalUnits += units;
    }

    for (index = 0; index < laneData.length; index += 1) {
      var lane = laneData[index];
      var laneHeight = (innerHeight * laneHeights[index]) / Math.max(totalUnits, 1);
      var laneTop = cursorY;

      if (lane.trackIndex === trackIndex && !lane.isDrumChild) {
        return {
          top: laneTop,
          height: laneHeight,
          centerY: laneTop + Math.max(13, Math.min(laneHeight - 6, laneHeight * 0.64))
        };
      }

      cursorY += laneHeight;
    }

    return null;
  }

  function getTrackMarkerEvents(song, lane) {
    if (pageMarkers.getTrackMarkerEvents) {
      return pageMarkers.getTrackMarkerEvents(song, lane, getMarkerOptions());
    }
    return [];
  }

  function getTrackMarkerColor(event, laneMuted) {
    if (pageMarkers.getTrackMarkerColor) {
      return pageMarkers.getTrackMarkerColor(event, laneMuted);
    }
    return laneMuted ? "rgba(170,170,190,0.75)" : "#99ccff";
  }

  function shouldDrawTrackMarkerStem(markerEvent) {
    if (pageMarkers.shouldDrawTrackMarkerStem) {
      return pageMarkers.shouldDrawTrackMarkerStem(markerEvent);
    }
    return true;
  }

  function drawTrackMarkerGlyph(x, laneTop, laneHeight, color, markerEvent) {
    var type = markerEvent.type;
    var controllerNumber = markerEvent.controller;
    var centerY = laneTop + Math.max(10, Math.min(laneHeight - 8, laneHeight * 0.48));
    var lowerY = laneTop + Math.max(14, Math.min(laneHeight - 5, laneHeight * 0.7));
    var upperY = laneTop + Math.max(6, Math.min(laneHeight - 16, laneHeight * 0.16));
    var topY = laneTop + Math.max(8, Math.min(laneHeight - 12, laneHeight * 0.26));
    var ringColor = color;
    var panOffset;

    visualizerContext.save();
    visualizerContext.fillStyle = color;
    visualizerContext.strokeStyle = "#000022";
    visualizerContext.lineWidth = 1;

    if (type === "controlChange" && (controllerNumber === 0 || controllerNumber === 32)) {
      ringColor = controllerNumber === 0 ? "#ffb36b" : "#7fd0ff";
      pageVisualizer.drawBankBadge(visualizerContext, x, lowerY, ringColor, controllerNumber, markerEvent.value);
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && (controllerNumber === 98 || controllerNumber === 99)) {
      ringColor = controllerNumber === 99 ? "#ffb366" : "#99ddff";
      pageVisualizer.drawNrpnBadge(visualizerContext, x, lowerY, ringColor, controllerNumber, markerEvent.value);
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && controllerNumber === 6) {
      pageVisualizer.drawDataEntryGlyph(visualizerContext, x, upperY, markerEvent.value);
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && controllerNumber === 7) {
      pageVisualizer.drawVolumeGlyph(visualizerContext, x, centerY, laneHeight, color, markerEvent.value);
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && controllerNumber === 10) {
      panOffset = (((markerEvent.value === undefined ? 64 : markerEvent.value) - 64) / 63) * Math.min(10, laneHeight * 0.22);
      visualizerContext.fillRect(x - 4, centerY + panOffset - 4, 8, 8);
      visualizerContext.strokeRect(x - 4, centerY + panOffset - 4, 8, 8);
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && controllerNumber === 11) {
      visualizerContext.strokeStyle = color;
      visualizerContext.lineWidth = 1.5;
      visualizerContext.beginPath();
      visualizerContext.moveTo(x - 7, topY + 2);
      visualizerContext.bezierCurveTo(x - 4, topY - 1, x - 2, topY - 1, x + 1, topY + 2);
      visualizerContext.bezierCurveTo(x + 4, topY + 5, x + 6, topY + 5, x + 7, topY + 2);
      visualizerContext.stroke();
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && controllerNumber === 73) {
      visualizerContext.beginPath();
      visualizerContext.moveTo(x, centerY - 5);
      visualizerContext.lineTo(x + 5, centerY + 3);
      visualizerContext.lineTo(x - 5, centerY + 3);
      visualizerContext.closePath();
      visualizerContext.fill();
      visualizerContext.stroke();
      visualizerContext.restore();
      return;
    }

    if (type === "controlChange" && controllerNumber === 91) {
      pageVisualizer.drawReverbGlyph(visualizerContext, x, centerY, color);
      visualizerContext.restore();
      return;
    }

    visualizerContext.beginPath();
    if (type === "program") {
      visualizerContext.moveTo(x, centerY - 6);
      visualizerContext.lineTo(x + 4, centerY - 2);
      visualizerContext.lineTo(x, centerY + 2);
      visualizerContext.lineTo(x - 4, centerY - 2);
    } else {
      visualizerContext.moveTo(x, centerY - 5);
      visualizerContext.lineTo(x + 4, centerY + 2);
      visualizerContext.lineTo(x - 4, centerY + 2);
    }
    visualizerContext.closePath();
    visualizerContext.fill();
    visualizerContext.stroke();
    visualizerContext.restore();
  }

  function drawMetaVisualizer(song, visibleWindow, currentPosition) {
    var topPadding = 20;
    var leftPadding = 120;
    var rightPadding = 12;
    var bottomPadding = 12;
    var innerWidth;
    var innerHeight;
    var cursorY;
    var laneHeight;
    var desiredHeight;
    var playheadX;
    var playheadLabels = [];

    if (!metaLaneData.length || !song || !visibleWindow) {
      metaVisualizerWrap.style.display = metaLaneData.length ? "block" : "none";
      metaVisualizerContext.clearRect(0, 0, metaVisualizer.width, metaVisualizer.height);
      metaVisualizerContext.fillStyle = "#000018";
      metaVisualizerContext.fillRect(0, 0, metaVisualizer.width, metaVisualizer.height);
      if (metaLaneData.length) {
        metaVisualizerContext.fillStyle = "#99ccff";
        metaVisualizerContext.font = "12px Times New Roman";
        metaVisualizerContext.fillText("Loading meta/control track map...", 16, 24);
      }
      return;
    }

    metaVisualizerWrap.style.display = "block";
    desiredHeight = Math.max(120, 32 + (metaLaneData.length * 26));
    if (metaVisualizer.height !== desiredHeight) {
      metaVisualizer.height = desiredHeight;
      metaVisualizer.style.height = desiredHeight + "px";
    }

    metaVisualizerContext.clearRect(0, 0, metaVisualizer.width, metaVisualizer.height);
    metaVisualizerContext.fillStyle = "#000018";
    metaVisualizerContext.fillRect(0, 0, metaVisualizer.width, metaVisualizer.height);
    metaHitZones = [];

    innerWidth = metaVisualizer.width - leftPadding - rightPadding;
    innerHeight = metaVisualizer.height - topPadding - bottomPadding;
    laneHeight = innerHeight / Math.max(metaLaneData.length, 1);
    cursorY = topPadding;

    metaLaneData.forEach(function (lane) {
      var laneTop = cursorY;
      var labelY = laneTop + Math.min(14, Math.max(11, laneHeight * 0.55));
      var laneLabel = fitLabel(metaVisualizerContext, lane.name, leftPadding - 16);

      metaVisualizerContext.fillStyle = "rgba(255,255,255,0.04)";
      metaVisualizerContext.fillRect(leftPadding, laneTop, innerWidth, laneHeight - 6);
      metaVisualizerContext.fillStyle = lane.color;
      metaVisualizerContext.font = "12px Times New Roman";
      metaVisualizerContext.fillText(laneLabel, 12, labelY);

      lane.segments.forEach(function (segment, segmentIndex) {
        var segmentEnd = segment.start + segment.duration;
        var clippedStart;
        var clippedEnd;
        var x;
        var width;
        var y = laneTop + 7;
        var segmentColor = varyLaneColor(segment.type === "lyric" ? "#ff99ff" : lane.color, segmentIndex);
        var fullLabel;
        var shortLabel;
        var labelText;
        var labelWidth;
        var boxWidth;
        var labelX;
        var labelYBox;
        var isActive;
        var textWidth;
        var progress;

        if (segmentEnd < visibleWindow.start || segment.start > visibleWindow.end) {
          return;
        }

        clippedStart = Math.max(segment.start, visibleWindow.start);
        clippedEnd = Math.min(segmentEnd, visibleWindow.end);
        x = leftPadding + (((clippedStart - visibleWindow.start) / visibleWindow.seconds) * innerWidth);
        width = Math.max(2, ((clippedEnd - clippedStart) / visibleWindow.seconds) * innerWidth);

        metaVisualizerContext.fillStyle = segmentColor;
        metaVisualizerContext.fillRect(x, y, width, Math.max(4, laneHeight - 14));
        metaHitZones.push({
          x: x,
          y: y - 11,
          width: Math.max(width, 6),
          height: Math.max(laneHeight, 16),
          lane: lane.name,
          fullLabel: getMetaSegmentLabel(segment, "full"),
          shortLabel: getMetaSegmentLabel(segment, "short"),
          type: segment.type,
          start: segment.start,
          end: segmentEnd
        });

        fullLabel = getMetaSegmentLabel(segment, "full");
        shortLabel = getMetaSegmentLabel(segment, "short");
        isActive = segment.start <= currentPosition && segmentEnd > currentPosition;
        labelText = "";
        metaVisualizerContext.font = "10px Times New Roman";
        progress = Math.max(0, Math.min(1, (currentPosition - segment.start) / Math.max(0.001, segment.duration)));

        if (width >= 46) {
          labelText = fullLabel;
          labelWidth = metaVisualizerContext.measureText(labelText).width + 8;
          boxWidth = Math.max(28, labelWidth);
          labelX = x;
        }

        if (!labelText && width >= 22) {
          labelText = isActive ? fullLabel : shortLabel;
          labelWidth = metaVisualizerContext.measureText(labelText).width + 8;
          boxWidth = Math.max(22, labelWidth);
          labelX = x;
        }

        if (labelText) {
          labelYBox = Math.max(laneTop + 1, y - 11);
          textWidth = metaVisualizerContext.measureText(labelText).width;
          drawMetaInfoBox(metaVisualizerContext, labelX, labelYBox, labelText, boxWidth, isActive && textWidth > (boxWidth - 8) ? progress : 0);
        } else if (isActive) {
          playheadLabels.push({
            y: Math.max(laneTop + 1, y - 11),
            text: fullLabel,
            color: segmentColor
          });
        }
      });

      cursorY += laneHeight;
    });

    playheadX = leftPadding + (((currentPosition - visibleWindow.start) / visibleWindow.seconds) * innerWidth);
    metaVisualizerContext.strokeStyle = "#ffffff";
    metaVisualizerContext.lineWidth = 2;
    metaVisualizerContext.beginPath();
    metaVisualizerContext.moveTo(playheadX, topPadding - 2);
    metaVisualizerContext.lineTo(playheadX, metaVisualizer.height - bottomPadding + 2);
    metaVisualizerContext.stroke();

    playheadLabels.forEach(function (entry, index) {
      var centeredText = entry.text;
      var textWidth;
      var labelWidth;
      var labelX;
      var labelY = entry.y + (index * 11);

      metaVisualizerContext.font = "10px Times New Roman";
      textWidth = metaVisualizerContext.measureText(centeredText).width;
      labelWidth = Math.min(Math.max(64, textWidth + 8), 140);
      labelX = Math.max(leftPadding, Math.min(playheadX - (labelWidth / 2), metaVisualizer.width - rightPadding - labelWidth));
      drawMetaInfoBox(metaVisualizerContext, labelX, labelY, centeredText, labelWidth, 0);
    });

    metaVisualizerContext.fillStyle = "#9999ff";
    metaVisualizerContext.font = "11px Times New Roman";
    metaVisualizerContext.fillText(formatTime(visibleWindow.start), leftPadding, metaVisualizer.height - 2);
    metaVisualizerContext.fillText(formatTime(visibleWindow.end), metaVisualizer.width - rightPadding - 34, metaVisualizer.height - 2);
  }

  function updateCurrentMetaEvents(song, currentPosition) {
    metaCurrentStatus.innerHTML = "";
  }

  function isLiveMetaStatusEventType(type) {
    return type === "lyric" ||
      type === "tempo" ||
      type === "timeSignature" ||
      type === "keySignature" ||
      type === "sequencerSpecific" ||
      type === "program";
  }

  function findMetaSummaryForLane(song, lane) {
    return (song.trackSummaries || []).find(function (summary) {
      return !summary.hasPlayableNotes && getPreferredTrackLabel(summary, null) === lane.name;
    }) || null;
  }

  function clipMetaStatusLabel(label, maxLength) {
    var text = String(label || "");

    if (!maxLength || text.length <= maxLength) {
      return text;
    }

    if (maxLength <= 3) {
      return text.slice(0, maxLength);
    }

    return text.slice(0, maxLength - 3) + "...";
  }

  function getMetaSegmentLabel(segment, mode) {
    var shortMode = mode === "short";

    if (!segment) {
      return "";
    }

    if (!shortMode) {
      if (segment.type === "timeSignature") {
        return "Time signature " + segment.label;
      }
      if (segment.type === "keySignature") {
        return "Key signature " + segment.label;
      }
      if (segment.type === "tempo") {
        return "Tempo change";
      }
      if (segment.type === "program") {
        return "Program change " + String(segment.label || "").replace(/^prog\s+/i, "");
      }
      if (segment.type === "sequencerSpecific") {
        return "Sequencer-specific event";
      }
      return String(segment.label || describeMetaEventType(segment.type));
    }

    if (segment.type === "timeSignature") {
      return "Time " + segment.label;
    }
    if (segment.type === "keySignature") {
      return "Key " + segment.label;
    }
    if (segment.type === "tempo") {
      return "Tempo";
    }
    if (segment.type === "program") {
      return String(segment.label || "").replace(/^prog\s+/i, "P");
    }
    if (segment.type === "sequencerSpecific") {
      return "Seq";
    }
    if (segment.type === "trackName") {
      return "Name";
    }
    if (segment.type === "instrumentName") {
      return "Instr";
    }
    if (segment.type === "copyright") {
      return "Copy";
    }
    if (segment.type === "text") {
      return clipMetaStatusLabel(segment.label, 14);
    }
    if (segment.type === "lyric") {
      return clipMetaStatusLabel(segment.label, 14);
    }

    return clipMetaStatusLabel(segment.label || describeMetaEventType(segment.type), 14);
  }

  function getVisibleWindow(duration, currentPosition) {
    if (pageData.getVisibleWindow) {
      return pageData.getVisibleWindow(duration, currentPosition, {
        fullSong: fullSongToggle.checked,
        windowSeconds: Number(windowSlider.value) || 10,
        manualWindowStart: manualWindowStart,
        isPaused: controller && controller.isPaused && controller.isPaused()
      });
    }
    return { start: 0, end: duration, seconds: Math.max(duration, 0.1), label: "full song" };
  }

  function buildTrackRoleMap(song) {
    if (pageData.buildTrackRoleMap) {
      return pageData.buildTrackRoleMap(song, getDataOptions());
    }
    return {};
  }

  function formatChannelProgram(event) {
    if (pageData.formatChannelProgram) {
      return pageData.formatChannelProgram(event, getDataOptions());
    }
    return "ch " + ((event.channel || 0) + 1);
  }

  function formatBankProgram(event) {
    if (pageData.formatBankProgram) {
      return pageData.formatBankProgram(event, getDataOptions());
    }
    return "prog " + event.program;
  }

  function formatDrumProgram(noteGroup) {
    if (pageData.formatDrumProgram) {
      return pageData.formatDrumProgram(noteGroup, getDataOptions());
    }
    return "ch 10 / drum kit";
  }

  function updateWindowSliderLabel() {
    windowSliderValue.innerHTML = windowSlider.value + " sec";
  }

  function updateMarkerControlsVisibility() {
    var anyVisibleType = getMarkerToggleEntries().some(function (entry) {
      return entry.toggle && entry.toggle.parentNode && entry.toggle.parentNode.style.display !== "none";
    });

    markerControlsWrap.style.display = (trackMarkerToggle.checked && anyVisibleType) ? "block" : "none";
  }

  function persistViewState(customUrl) {
    var nextUrl = new URL(window.location.href);
    if (customUrl) {
      nextUrl.searchParams.delete("midi");
      nextUrl.searchParams.set("custom_url", customUrl);
    } else {
      nextUrl.searchParams.delete("custom_url");
      nextUrl.searchParams.set("midi", selectedMidi);
    }
    nextUrl.searchParams.set("full", fullSongToggle.checked ? "1" : "0");
    nextUrl.searchParams.set("range", windowSlider.value);
    nextUrl.searchParams.set("profile", suggestionProfile);
    window.history.replaceState({}, "", nextUrl.toString());
  }

  function getPreferredTrackLabel(summary, event) {
    if (pageData.getPreferredTrackLabel) {
      return pageData.getPreferredTrackLabel(summary, event, getDataOptions());
    }
    return summary ? (summary.name || ("Track " + (summary.index + 1))) : "Track";
  }

  function replaceCustomMidiObjectUrl(nextUrl) {
    if (pageSession.replaceCustomMidiObjectUrl) {
      customMidiObjectUrl = pageSession.replaceCustomMidiObjectUrl(nextUrl, customMidiObjectUrl);
      return customMidiObjectUrl;
    }
    customMidiObjectUrl = nextUrl;
    return customMidiObjectUrl;
  }

  function fileNameFromUrl(url) {
    if (pageSession.fileNameFromUrl) {
      return pageSession.fileNameFromUrl(url);
    }
    return "Custom MIDI";
  }

  function ensureTrackSoundDefaults(song) {
    var firstEvents = {};

    if (!song || !song.events || !song.trackSummaries) {
      return;
    }

    song.events.forEach(function (event) {
      if (firstEvents[event.trackIndex] === undefined) {
        firstEvents[event.trackIndex] = event;
      }
    });

    song.trackSummaries.forEach(function (summary) {
      if (!summary.hasPlayableNotes || trackSoundMap[summary.index]) {
        return;
      }

      trackSoundMap[summary.index] = suggestSoundChoice(summary, firstEvents[summary.index]);
    });
  }

  function applyTrackSoundChoice(trackIndex, choice, song) {
    trackSoundMap[trackIndex] = choice;
    if (controller && controller.setTrackSound) {
      controller.setTrackSound(trackIndex, choice);
    }
    if (controller && controller.getSong) {
      laneData = createLaneData(controller.getSong());
      updateTrackDetails(controller.getSong());
      renderTrackSoundMapper(song || controller.getSong());
      drawVisualizer();
    }
  }

  function findFirstTrackEvent(song, trackIndex) {
    if (pageData.findFirstTrackEvent) {
      return pageData.findFirstTrackEvent(song, trackIndex);
    }
    return null;
  }

  function getPlayableSummariesSorted(song) {
    if (pageData.getPlayableSummariesSorted) {
      return pageData.getPlayableSummariesSorted(song);
    }
    return [];
  }

  function getPlayableTrackOrderMap(song) {
    if (pageData.getPlayableTrackOrderMap) {
      return pageData.getPlayableTrackOrderMap(song);
    }
    return {};
  }
}());
