(function () {
  var sharedSampleState = {
    arrayBuffers: {},
    loadPromises: {}
  };
  var coordinatorState = getPlaybackCoordinator();

  function getCoordinatorRoot() {
    try {
      if (window.top && window.top.location && window.top.location.origin === window.location.origin) {
        return window.top;
      }
    } catch (error) {
      // Ignore cross-frame access issues and fall back to the current window.
    }

    return window;
  }

  function getPlaybackCoordinator() {
    var root = getCoordinatorRoot();

    if (!root.__shoomiSoundtrackCoordinator) {
      root.__shoomiSoundtrackCoordinator = {
        controllers: [],
        register: function (controller) {
          if (this.controllers.indexOf(controller) === -1) {
            this.controllers.push(controller);
          }
        },
        unregister: function (controller) {
          this.controllers = this.controllers.filter(function (entry) {
            return entry !== controller;
          });
        },
        claim: function (owner) {
          this.controllers.forEach(function (controller) {
            if (controller !== owner && controller.isPlaying && controller.isPlaying()) {
              controller.pause();
            }
          });
        }
      };
    }

    return root.__shoomiSoundtrackCoordinator;
  }

  window.createDreamSoundtrackController = function createDreamSoundtrackController(options) {
    var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    var assetBase = (options.assetBase || "").replace(/\/$/, "");
    var midiUrl = options.midiUrl || resolveAsset("midi_song_newage.mid");
    var midiData = options.midiData || null;
    var onSongReady = options.onSongReady;
    var onLoadError = options.onLoadError;
    var toggleEl = options.toggleEl;
    var statusEl = options.statusEl;
    var fallbackAudioEl = options.fallbackAudioEl;
    var trackSoundMap = options.trackSoundMap || {};
    var preloadMidi = !!options.preloadMidi;

    if (!AudioContextCtor || !toggleEl || !statusEl) {
      return createFallbackController(toggleEl, statusEl, fallbackAudioEl);
    }

    var audioContext = null;
    var masterGain = null;
    var analyserNode = null;
    var spectrumData = null;
    var parsedSong = null;
    var buffers = {};
    var loadPromise = null;
    var schedulerId = null;
    var playing = false;
    var wantsPlayback = false;
    var playbackOriginTime = 0;
    var pausedAt = 0;
    var nextEventIndex = 0;
    var nextLoopIndex = 0;
    var activeVoices = [];
    var mutedTrackMap = {};
    var lookAheadSeconds = 0.22;
    var tickMilliseconds = 60;
    var sampleBankReady = false;
    var sampleBankPromise = null;
    var sampleLoadProgress = {
      loaded: 0,
      total: 0
    };
    var loadState = "idle";
    var previewState = {
      active: false,
      voices: [],
      timers: []
    };

    var instrumentSamples = {
      35: {
        sampleId: "bass",
        rootNote: 41,
        loop: true,
        loopStart: 0.34,
        loopEnd: 3.55,
        baseGain: 0.48,
        attack: 0.01,
        release: 0.08
      },
      50: {
        sampleId: "strings",
        rootNote: 67,
        loop: true,
        loopStart: 0.72,
        loopEnd: 7.8,
        baseGain: 0.42,
        attack: 0.03,
        release: 0.12
      },
      99: {
        sampleId: "goblins",
        rootNote: 60,
        loop: true,
        loopStart: 0.68,
        loopEnd: 8.15,
        baseGain: 0.46,
        attack: 0.04,
        release: 0.16
      }
    };
    var waveformDefs = {
      sine: { waveform: "sine", baseGain: 0.24, attack: 0.008, release: 0.08 },
      square: { waveform: "square", baseGain: 0.18, attack: 0.003, release: 0.05 },
      triangle: { waveform: "triangle", baseGain: 0.22, attack: 0.004, release: 0.06 },
      sawtooth: { waveform: "sawtooth", baseGain: 0.15, attack: 0.004, release: 0.05 }
    };

    var drumSamples = {
      42: { sampleId: "drum_hihat_closed", rootNote: 42, baseGain: 0.24, release: 0.02 },
      46: { sampleId: "drum_hihat_open", rootNote: 46, baseGain: 0.28, release: 0.03 },
      49: { sampleId: "drum_crash", rootNote: 49, baseGain: 0.34, release: 0.05 },
      51: { sampleId: "drum_ride", rootNote: 51, baseGain: 0.28, release: 0.04 },
      54: { sampleId: "drum_tambourine", rootNote: 54, baseGain: 0.22, release: 0.03 },
      69: { sampleId: "drum_cabasa", rootNote: 69, baseGain: 0.34, release: 0.02 }
    };
    var drumFallbackMap = {
      35: 49,
      36: 49,
      38: 54,
      40: 54,
      41: 51,
      42: 42,
      43: 51,
      44: 42,
      45: 51,
      46: 46,
      47: 51,
      48: 51,
      49: 49,
      50: 51,
      51: 51,
      52: 49,
      53: 51,
      54: 54,
      55: 49,
      56: 54,
      57: 49,
      58: 69,
      59: 51,
      60: 69,
      61: 69,
      62: 69,
      63: 69,
      64: 69,
      65: 54,
      66: 54,
      67: 54,
      68: 54,
      69: 69
    };

    var sampleUrls = {
      bass: resolveAsset("soundtrack/samples/program_35_fretless_bass_f2.ogg"),
      strings: resolveAsset("soundtrack/samples/program_50_string_ensemble_g4.ogg"),
      goblins: resolveAsset("soundtrack/samples/program_99_goblins_unicorn_c4.ogg"),
      drum_hihat_closed: resolveAsset("soundtrack/samples/drum_42_closed_hihat.ogg"),
      drum_hihat_open: resolveAsset("soundtrack/samples/drum_46_open_hihat.ogg"),
      drum_crash: resolveAsset("soundtrack/samples/drum_49_crash_cymbal.ogg"),
      drum_ride: resolveAsset("soundtrack/samples/drum_51_ride_cymbal.ogg"),
      drum_tambourine: resolveAsset("soundtrack/samples/drum_54_tambourine.ogg"),
      drum_cabasa: resolveAsset("soundtrack/samples/drum_69_cabasa.ogg")
    };

    toggleEl.addEventListener("click", togglePlayback);
    setUi(false, "click to load");

    if (preloadMidi) {
      setUi(false, "loading midi...");
      loadAssets().then(function () {
        if (!playing) {
          setUi(false, "click for sound");
        }
      }).catch(function (error) {
        if (onLoadError) {
          onLoadError(error);
        }
        fallbackToAudio();
      });
    }

    var controllerApi = {
      play: play,
      pause: pause,
      toggle: togglePlayback,
      seek: seek,
      destroy: destroy,
      isPlaying: function () {
        return playing;
      },
      isPaused: function () {
        return !playing;
      },
      getPlaybackPosition: getPlaybackPosition,
      getSong: function () {
        return parsedSong;
      },
      getLoadState: function () {
        return loadState;
      },
      getSpectrumData: getSpectrumData,
      previewSoundChoice: previewSoundChoice,
      startPreviewSoundChoice: startPreviewSoundChoice,
      stopPreviewSoundChoice: stopPreviewSoundChoice,
      setTrackMuted: setTrackMuted,
      isTrackMuted: function (trackIndex) {
        return !!mutedTrackMap[trackIndex];
      },
      setMuteKey: setMuteKey,
      setTrackSound: setTrackSound,
      getTrackSound: function (trackIndex) {
        return trackSoundMap[trackIndex] || "";
      },
      isMuteKey: function (muteKey) {
        return !!mutedTrackMap[muteKey];
      }
    };

    coordinatorState.register(controllerApi);

    return controllerApi;

    function loadAssets() {
      if (loadPromise) {
        return loadPromise;
      }

      loadState = "loading-midi";

      audioContext = new AudioContextCtor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.68;
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 512;
      analyserNode.smoothingTimeConstant = 0.82;
      spectrumData = new Uint8Array(analyserNode.frequencyBinCount);
      masterGain.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      loadPromise = (midiData ? Promise.resolve(midiData) : loadMidi(midiUrl)).then(function (midiBuffer) {
        parsedSong = parseMidiFile(midiBuffer);
        loadState = "midi-ready";
        if (onSongReady) {
          onSongReady(parsedSong);
        }
      }).catch(function (error) {
        loadState = "error";
        throw error;
      });

      return loadPromise;
    }

    function loadSampleBank() {
      var names;
      var remaining;
      var sequence;

      if (sampleBankReady) {
        loadState = "ready";
        return Promise.resolve();
      }

      if (sampleBankPromise) {
        return sampleBankPromise;
      }

      names = Object.keys(sampleUrls);
      remaining = names.filter(function (name) {
        return !buffers[name];
      });
      sampleLoadProgress.total = remaining.length;
      sampleLoadProgress.loaded = 0;

      if (!remaining.length) {
        sampleBankReady = true;
        loadState = "ready";
        setUi(false, "click for sound");
        return Promise.resolve();
      }

      loadState = "loading-samples";
      sequence = Promise.resolve();

      remaining.forEach(function (name, index) {
        sequence = sequence.then(function () {
          setUi(false, "loading " + (index + 1) + "/" + remaining.length);
          return ensureSampleLoaded(name).then(function () {
            sampleLoadProgress.loaded = index + 1;
          }).catch(function () {
            sampleLoadProgress.loaded = index + 1;
            return null;
          });
        });
      });

      sampleBankPromise = sequence.then(function () {
        sampleBankReady = true;
        sampleBankPromise = null;
        loadState = "ready";
        setUi(false, "click for sound");
      }).catch(function (error) {
        sampleBankPromise = null;
        loadState = "error";
        throw error;
      });

      return sampleBankPromise;
    }

    function loadSample(name, url) {
      if (sharedSampleState.arrayBuffers[name]) {
        return audioContext.decodeAudioData(sharedSampleState.arrayBuffers[name].slice(0)).then(function (buffer) {
          return {
            name: name,
            buffer: buffer
          };
        });
      }

      return fetchWithTimeout(url, 8000).then(function (response) {
        if (!response.ok) {
          throw new Error("sample fetch failed: " + url + " (" + response.status + ")");
        }
        return response.arrayBuffer();
      }).then(function (arrayBuffer) {
        sharedSampleState.arrayBuffers[name] = arrayBuffer.slice(0);
        return audioContext.decodeAudioData(arrayBuffer.slice(0));
      }).then(function (buffer) {
        return {
          name: name,
          buffer: buffer
        };
      });
    }

    function loadMidi(url) {
      return fetchWithTimeout(url, 8000).then(function (response) {
        if (!response.ok) {
          throw new Error("midi fetch failed: " + url + " (" + response.status + ")");
        }
        return response.arrayBuffer();
      });
    }

    function ensureSampleLoaded(name) {
      if (buffers[name]) {
        return Promise.resolve(buffers[name]);
      }

      if (sharedSampleState.loadPromises[name]) {
        return sharedSampleState.loadPromises[name].then(function (arrayBuffer) {
          if (buffers[name]) {
            return buffers[name];
          }

          return audioContext.decodeAudioData(arrayBuffer.slice(0)).then(function (buffer) {
            buffers[name] = buffer;
            return buffer;
          });
        });
      }

      sharedSampleState.loadPromises[name] = fetchWithTimeout(sampleUrls[name], 8000).then(function (response) {
        if (!response.ok) {
          throw new Error("sample fetch failed: " + sampleUrls[name] + " (" + response.status + ")");
        }
        return response.arrayBuffer();
      }).then(function (arrayBuffer) {
        sharedSampleState.arrayBuffers[name] = arrayBuffer.slice(0);
        return arrayBuffer;
      }).catch(function (error) {
        delete sharedSampleState.loadPromises[name];
        throw error;
      });

      return sharedSampleState.loadPromises[name].then(function (arrayBuffer) {
        return audioContext.decodeAudioData(arrayBuffer.slice(0));
      }).then(function (buffer) {
        buffers[name] = buffer;
        return buffer;
      }).catch(function (error) {
        delete sharedSampleState.loadPromises[name];
        throw error;
      });
    }

    function resolveAsset(path) {
      if (!assetBase) {
        return path;
      }

      return assetBase + "/" + path;
    }

    function play() {
      wantsPlayback = true;
      if (!parsedSong) {
        setUi(false, "loading midi...");
      }
      return loadAssets().then(function () {
        if (!parsedSong) {
          throw new Error("soundtrack not ready");
        }

        if (!wantsPlayback) {
          return;
        }

        if (playing || schedulerId) {
          return;
        }

        return loadSampleBank().then(function () {
          if (!wantsPlayback) {
            return;
          }

          if (audioContext.state === "suspended") {
            return audioContext.resume().then(function () {
              if (!wantsPlayback) {
                return;
              }

              startPlayback();
            });
          }

          if (!wantsPlayback) {
            return;
          }

          startPlayback();
        });
      });
    }

    function startPlayback() {
      if (!wantsPlayback || !parsedSong) {
        return;
      }

      coordinatorState.claim(controllerApi);

      if (schedulerId) {
        window.clearInterval(schedulerId);
        schedulerId = null;
      }

      playing = true;
      playbackOriginTime = audioContext.currentTime - pausedAt;
      nextLoopIndex = Math.floor(pausedAt / parsedSong.duration);
      nextEventIndex = findStartingEventIndex(pausedAt % parsedSong.duration);
      schedulerId = window.setInterval(scheduleAhead, tickMilliseconds);
      scheduleAhead();
      setUi(true, "sound on");
    }

    function pause() {
      wantsPlayback = false;

      if (!playing && !schedulerId) {
        return;
      }

      pausedAt = getPlaybackPosition();
      playing = false;
      if (schedulerId) {
        window.clearInterval(schedulerId);
        schedulerId = null;
      }
      stopActiveVoices();
      setUi(false, "sound off");
    }

    function seek(seconds) {
      if (!parsedSong) {
        return;
      }

      var wasPlaying = playing;
      var target = Math.max(0, Math.min(parsedSong.duration, Number(seconds) || 0));

      pausedAt = target;

      if (schedulerId) {
        window.clearInterval(schedulerId);
        schedulerId = null;
      }

      stopActiveVoices();
      nextLoopIndex = Math.floor(pausedAt / parsedSong.duration);
      nextEventIndex = findStartingEventIndex(pausedAt % parsedSong.duration);

      if (wasPlaying && wantsPlayback) {
        startPlayback();
      }
    }

    function togglePlayback() {
      if (playing) {
        pause();
      } else {
        setUi(false, parsedSong ? (sampleBankReady ? "starting..." : "loading samples...") : "loading midi...");
        play().catch(function () {
          fallbackToAudio();
        });
      }
    }

    function scheduleAhead() {
      if (!playing || !wantsPlayback || !parsedSong) {
        return;
      }

      var windowEnd = audioContext.currentTime + lookAheadSeconds;
      var event;
      var eventTime;

      while (true) {
        event = parsedSong.events[nextEventIndex];
        eventTime = playbackOriginTime + (nextLoopIndex * parsedSong.duration) + event.start;

        if (eventTime > windowEnd) {
          break;
        }

        if (eventTime >= audioContext.currentTime - 0.02) {
          scheduleEvent(event, eventTime);
        }

        nextEventIndex += 1;
        if (nextEventIndex >= parsedSong.events.length) {
          nextEventIndex = 0;
          nextLoopIndex += 1;
        }
      }
    }

    function scheduleEvent(event, when) {
      if (!playing || !wantsPlayback) {
        return;
      }

      if (mutedTrackMap[event.trackIndex] ||
          (event.channel === 9 && mutedTrackMap["drums:all"]) ||
          mutedTrackMap[getEventMuteKey(event)]) {
        return;
      }

      var sampleDef;
      var source;
      var gainNode;
      var buffer;
      var velocity;
      var playbackRate;
      var attack;
      var release;
      var stopAt;
      var loopEnd;
      var dynamicGain;
      var volumeScale;
      var expressionScale;
      var sostenutoScale;
      var softPedalScale;
      var attackScale;
      var releaseScale;
      var reverbSend;
      var tremoloDepth;
      var chorusSend;
      var celesteDepth;
      var modulationDepth;
      var filterNode = null;
      var filterCutoff;
      var filterQ;
      var tremoloStage = null;
      var tremoloOscillator = null;
      var tremoloGainNode = null;
      var modulationOscillator = null;
      var modulationGainNode = null;
      var detuneTarget = null;
      var totalTuningSemitones;
      var pitchBendSemitones;
      var oscillatorFrequency;
      var extraTail;
      var panValue;
      var panNode = null;

      sampleDef = resolveSampleDef(event);

      if (!sampleDef) {
        return;
      }

      pitchBendSemitones = ((((event.pitchBendValue === undefined ? 8192 : event.pitchBendValue) - 8192) / 8192) * (event.pitchBendSensitivity === undefined ? 2 : event.pitchBendSensitivity));

      gainNode = audioContext.createGain();
      if (sampleDef.mode === "wave") {
        source = audioContext.createOscillator();
        source.type = sampleDef.waveform;
      } else {
        buffer = buffers[sampleDef.sampleId];
        if (!buffer) {
          ensureSampleLoaded(sampleDef.sampleId).catch(function () {
            return null;
          });
          return;
        }
        source = audioContext.createBufferSource();
        source.buffer = buffer;
      }
      filterCutoff = 900 + (((event.brightness === undefined ? 64 : event.brightness) / 127) * 7200);
      filterQ = Math.max(0.0001, (((event.resonance === undefined ? 64 : event.resonance) / 127) * 16));

      if (event.channel !== 9) {
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(filterCutoff, when);
        filterNode.Q.setValueAtTime(filterQ, when);
        source.connect(filterNode);
        filterNode.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      if (typeof audioContext.createStereoPanner === "function") {
        panNode = audioContext.createStereoPanner();
        tremoloStage = audioContext.createGain();
        gainNode.connect(tremoloStage);
        tremoloStage.connect(panNode);
        panNode.connect(masterGain);
      } else {
        tremoloStage = audioContext.createGain();
        gainNode.connect(tremoloStage);
        tremoloStage.connect(masterGain);
      }

      velocity = Math.max(0.08, Math.min(1, event.velocity / 110));
      volumeScale = Math.max(0, Math.min(1, (event.channelVolume === undefined ? 100 : event.channelVolume) / 127));
      expressionScale = Math.max(0, Math.min(1, (event.expression === undefined ? 127 : event.expression) / 127));
      softPedalScale = 1 - (Math.max(0, Math.min(127, event.softPedal === undefined ? 0 : event.softPedal)) / 127) * 0.35;
      sostenutoScale = 1 + (Math.max(0, Math.min(127, event.sostenuto === undefined ? 0 : event.sostenuto)) / 127) * 0.08;
      dynamicGain = sampleDef.baseGain * velocity * volumeScale * expressionScale * softPedalScale * sostenutoScale;
      totalTuningSemitones = (event.coarseTuneSemitones || 0) + (event.fineTuneSemitones || 0);
      if (sampleDef.mode === "wave") {
        oscillatorFrequency = 440 * Math.pow(2, ((event.note - 69) + totalTuningSemitones + pitchBendSemitones) / 12);
        source.frequency.setValueAtTime(oscillatorFrequency, when);
        detuneTarget = source.detune || null;
      } else {
        playbackRate = Math.pow(2, ((event.note - sampleDef.rootNote) + totalTuningSemitones + pitchBendSemitones) / 12);
        source.playbackRate.value = playbackRate;
        detuneTarget = source.detune || null;
      }

      if (panNode) {
        panValue = ((event.pan === undefined ? 64 : event.pan) - 64) / 63;
        panNode.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), when);
      }

      if (sampleDef.loop) {
        source.loop = true;
        source.loopStart = sampleDef.loopStart;
        loopEnd = Math.min(sampleDef.loopEnd, Math.max(sampleDef.loopStart + 0.1, buffer.duration - 0.1));
        source.loopEnd = loopEnd;
      }

      attack = sampleDef.attack || 0.005;
      release = sampleDef.release || 0.05;
      attackScale = getAttackScale(event.attackTime);
      releaseScale = getReleaseScale(event.releaseTime);
      reverbSend = Math.max(0, Math.min(127, event.reverbSend === undefined ? 0 : event.reverbSend));
      extraTail = (reverbSend / 127) * 0.18;
      attack = Math.max(0.001, Math.min(0.45, attack * attackScale));
      release = Math.max(0.02, Math.min(0.65, (release * releaseScale) + extraTail + ((Math.max(0, Math.min(127, event.sostenuto === undefined ? 0 : event.sostenuto)) / 127) * 0.08)));
      stopAt = when + Math.max(0.04, event.duration + extraTail);

      gainNode.gain.setValueAtTime(0.0001, when);
      gainNode.gain.linearRampToValueAtTime(dynamicGain, when + attack);
      gainNode.gain.setValueAtTime(dynamicGain, Math.max(when + attack, stopAt - release));
      gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      tremoloStage.gain.setValueAtTime(1, when);

      tremoloDepth = Math.max(0, Math.min(127, event.tremoloDepth === undefined ? 0 : event.tremoloDepth));
      chorusSend = Math.max(0, Math.min(127, event.chorusSend === undefined ? 0 : event.chorusSend));
      celesteDepth = Math.max(0, Math.min(127, event.celesteDepth === undefined ? 0 : event.celesteDepth));
      modulationDepth = Math.max(0, Math.min(127, event.modulation === undefined ? 0 : event.modulation));

      if (tremoloDepth > 0) {
        tremoloOscillator = audioContext.createOscillator();
        tremoloGainNode = audioContext.createGain();
        tremoloOscillator.type = "sine";
        tremoloOscillator.frequency.setValueAtTime(4.2 + ((chorusSend / 127) * 1.8), when);
        tremoloGainNode.gain.setValueAtTime((tremoloDepth / 127) * 0.42, when);
        tremoloOscillator.connect(tremoloGainNode);
        tremoloGainNode.connect(tremoloStage.gain);
        tremoloOscillator.start(when);
        tremoloOscillator.stop(stopAt + 0.02);
      }

      if ((modulationDepth > 0 || celesteDepth > 0) && event.channel !== 9) {
        modulationOscillator = audioContext.createOscillator();
        modulationGainNode = audioContext.createGain();
        modulationOscillator.type = "sine";
        modulationOscillator.frequency.setValueAtTime(5 + ((chorusSend / 127) * 2) + ((celesteDepth / 127) * 1.5), when);
        modulationGainNode.gain.setValueAtTime(((modulationDepth / 127) * 36) + ((celesteDepth / 127) * 18), when);
        modulationOscillator.connect(modulationGainNode);
        if (detuneTarget) {
          modulationGainNode.connect(detuneTarget);
          modulationOscillator.start(when);
          modulationOscillator.stop(stopAt + 0.02);
        }
      }

      source.start(when);
      source.stop(stopAt + 0.02);
      source.onended = function () {
        removeActiveVoice(source);
      };

      source._dreamTrackIndex = event.trackIndex;
      source._dreamMuteKey = getEventMuteKey(event);
      source._dreamAuxNodes = [filterNode, tremoloStage, tremoloOscillator, tremoloGainNode, modulationOscillator, modulationGainNode, panNode, gainNode].filter(Boolean);
      activeVoices.push(source);
    }

    function setTrackMuted(trackIndex, muted) {
      mutedTrackMap[trackIndex] = !!muted;
      if (muted) {
        stopTrackVoices(trackIndex);
      }
    }

    function setMuteKey(muteKey, muted) {
      mutedTrackMap[muteKey] = !!muted;
      if (muted) {
        stopMuteKeyVoices(muteKey);
      }
    }

    function setTrackSound(trackIndex, soundChoice) {
      trackSoundMap[trackIndex] = soundChoice;
      stopTrackVoices(trackIndex);
    }

    function startPreviewSoundChoice(soundChoice) {
      var previewChoice = soundChoice;

      stopPreviewSoundChoice();

      return loadAssets().then(function () {
        if (audioContext.state === "suspended") {
          return audioContext.resume();
        }
      }).then(function () {
        var sampleDef;

        if (!previewChoice) {
          return null;
        }

        if (typeof previewChoice === "object" && previewChoice.mode === "drumkit" && previewChoice.drumNote === null) {
          return playDrumKitPreview();
        }

        if (typeof previewChoice === "number") {
          sampleDef = resolveDrumLikeSample(previewChoice);
          return startHeldPreviewSample(sampleDef, previewChoice);
        }

        sampleDef = resolvePreviewChoice(previewChoice);
        return startHeldPreviewSample(sampleDef, null);
      });
    }

    function previewSoundChoice(soundChoice) {
      var previewChoice = soundChoice;

      stopPreviewSoundChoice();

      return loadAssets().then(function () {
        if (audioContext.state === "suspended") {
          return audioContext.resume();
        }
      }).then(function () {
        var sampleDef;

        if (!previewChoice) {
          return null;
        }

        if (typeof previewChoice === "object" && previewChoice.mode === "drumkit" && previewChoice.drumNote === null) {
          return playDrumKitPreviewBurst();
        }

        if (typeof previewChoice === "number") {
          sampleDef = resolveDrumLikeSample(previewChoice);
          return playPreviewSample(sampleDef, previewChoice);
        }

        sampleDef = resolvePreviewChoice(previewChoice);
        return playPreviewSample(sampleDef, null);
      });
    }

    function stopPreviewSoundChoice() {
      previewState.active = false;
      previewState.timers.forEach(function (timerId) {
        window.clearTimeout(timerId);
        window.clearInterval(timerId);
      });
      previewState.timers = [];
      previewState.voices.forEach(function (voice) {
        try {
          voice.stop();
        } catch (error) {
          // Ignore already-stopped preview voices.
        }
      });
      previewState.voices = [];
    }

    function destroy() {
      wantsPlayback = false;
      playing = false;

      if (schedulerId) {
        window.clearInterval(schedulerId);
        schedulerId = null;
      }

      stopActiveVoices();
      toggleEl.removeEventListener("click", togglePlayback);
      coordinatorState.unregister(controllerApi);

      if (audioContext && audioContext.state !== "closed") {
        try {
          audioContext.close();
        } catch (error) {
          // Ignore teardown errors during controller replacement.
        }
      }
    }

    function stopActiveVoices() {
      var index;

      for (index = 0; index < activeVoices.length; index += 1) {
        try {
          activeVoices[index].stop();
        } catch (error) {
          // Ignore already-stopped voices.
        }
      }

      activeVoices = [];
    }

    function stopTrackVoices(trackIndex) {
      var remaining = [];
      var index;

      for (index = 0; index < activeVoices.length; index += 1) {
        if (activeVoices[index]._dreamTrackIndex === trackIndex) {
          try {
            activeVoices[index].stop();
          } catch (error) {
            // Ignore already-stopped voices.
          }
        } else {
          remaining.push(activeVoices[index]);
        }
      }

      activeVoices = remaining;
    }

    function stopMuteKeyVoices(muteKey) {
      var remaining = [];
      var index;

      for (index = 0; index < activeVoices.length; index += 1) {
        if (activeVoices[index]._dreamMuteKey === muteKey) {
          try {
            activeVoices[index].stop();
          } catch (error) {
            // Ignore already-stopped voices.
          }
        } else {
          remaining.push(activeVoices[index]);
        }
      }

      activeVoices = remaining;
    }

    function getEventMuteKey(event) {
      if (event.channel === 9) {
        return "drum:" + event.note;
      }

      return "track:" + event.trackIndex;
    }

    function resolveSampleDef(event) {
      var soundChoice = trackSoundMap[event.trackIndex];
      var soundMode = getTrackSoundMode(soundChoice);
      var programNumber;
      var drumNote;

      if (!soundChoice) {
        if (event.channel === 9 || isDrumBankSelected(event.bankMsb, event.bankLsb)) {
          return drumSamples[event.note];
        }
        return instrumentSamples[event.program];
      }

      if (soundMode === "drumkit") {
        drumNote = getMappedDrumNote(soundChoice, event.note);
        return resolveDrumLikeSample(drumNote);
      }

      if (soundMode === "program") {
        programNumber = getProgramNumber(soundChoice);
        return instrumentSamples[programNumber] || null;
      }

      if (soundMode === "wave") {
        return getWaveformDef(soundChoice);
      }

      if (event.channel === 9) {
        return drumSamples[event.note];
      }

      return instrumentSamples[event.program];
    }

    function isDrumBankSelected(bankMsb, bankLsb) {
      return bankMsb === 120 || bankMsb === 126 || bankMsb === 127 || bankLsb === 120 || bankLsb === 126 || bankLsb === 127;
    }

    function getTrackSoundMode(soundChoice) {
      if (!soundChoice) {
        return "";
      }

      if (typeof soundChoice === "string") {
        if (soundChoice === "drumkit") {
          return "drumkit";
        }
        if (soundChoice.indexOf("program:") === 0) {
          return "program";
        }
        if (soundChoice.indexOf("wave:") === 0) {
          return "wave";
        }
        return "";
      }

      return soundChoice.mode || "";
    }

    function getProgramNumber(soundChoice) {
      if (!soundChoice) {
        return 0;
      }

      if (typeof soundChoice === "string") {
        return Number(soundChoice.split(":")[1]) || 0;
      }

      return Number(soundChoice.program) || 0;
    }

    function getWaveformName(soundChoice) {
      if (!soundChoice) {
        return "sine";
      }

      if (typeof soundChoice === "string") {
        return soundChoice.split(":")[1] || "sine";
      }

      return String(soundChoice.waveform || "sine");
    }

    function getWaveformDef(soundChoice) {
      var name = getWaveformName(soundChoice);
      var def = waveformDefs[name] || waveformDefs.sine;

      return {
        mode: "wave",
        waveform: def.waveform,
        baseGain: def.baseGain,
        attack: def.attack,
        release: def.release
      };
    }

    function getMappedDrumNote(soundChoice, sourceNote) {
      var mappedNote;

      if (typeof soundChoice === "object" && soundChoice) {
        if (soundChoice.drumMap && soundChoice.drumMap[sourceNote] !== undefined) {
          mappedNote = Number(soundChoice.drumMap[sourceNote]);
          if (!Number.isNaN(mappedNote)) {
            return mappedNote;
          }
        }

        if (soundChoice.drumNote !== undefined && soundChoice.drumNote !== null) {
          mappedNote = Number(soundChoice.drumNote);
          if (!Number.isNaN(mappedNote)) {
            return mappedNote;
          }
        }
      }

      return sourceNote;
    }

    function resolveDrumLikeSample(note) {
      var mappedNote = drumFallbackMap[note];
      var available;

      if (mappedNote && drumSamples[mappedNote]) {
        return drumSamples[mappedNote];
      }

      available = Object.keys(drumSamples).map(Number).sort(function (left, right) {
        return Math.abs(left - note) - Math.abs(right - note);
      });

      if (!available.length) {
        return null;
      }

      return drumSamples[available[0]];
    }

    function resolvePreviewChoice(soundChoice) {
      var soundMode = getTrackSoundMode(soundChoice);
      var programNumber;
      var drumNote;

      if (soundMode === "drumkit") {
        drumNote = getMappedDrumNote(soundChoice, 42);
        return resolveDrumLikeSample(drumNote);
      }

      if (soundMode === "program") {
        programNumber = getProgramNumber(soundChoice);
        return instrumentSamples[programNumber] || null;
      }

      if (soundMode === "wave") {
        return getWaveformDef(soundChoice);
      }

      return null;
    }

    function playPreviewSample(sampleDef, noteOverride) {
      var source;
      var gainNode;
      var previewGain;
      var stopAt;
      var noteValue;
      var frequency;
      var playbackRate;
      var durationSeconds;

      if (!sampleDef) {
        return Promise.resolve();
      }

      previewGain = audioContext.createGain();
      previewGain.gain.value = 0.5;
      previewGain.connect(masterGain);

      if (sampleDef.mode === "wave") {
        source = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        source.type = sampleDef.waveform;
        noteValue = 69;
        if (sampleDef.waveform === "triangle") {
          noteValue = 45;
        } else if (sampleDef.waveform === "square" || sampleDef.waveform === "sawtooth") {
          noteValue = 72;
        }
        frequency = 440 * Math.pow(2, (noteValue - 69) / 12);
        source.frequency.setValueAtTime(frequency, audioContext.currentTime);
        source.connect(gainNode);
        gainNode.connect(previewGain);
        durationSeconds = 0.5;
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(sampleDef.baseGain || 0.2, audioContext.currentTime + (sampleDef.attack || 0.01));
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationSeconds);
        source.start(audioContext.currentTime);
        source.stop(audioContext.currentTime + durationSeconds + 0.02);
        return Promise.resolve();
      }

      return ensureSampleLoaded(sampleDef.sampleId).then(function (buffer) {
        source = audioContext.createBufferSource();
        gainNode = audioContext.createGain();
        source.buffer = buffer;
        noteValue = noteOverride !== null && noteOverride !== undefined ? noteOverride : sampleDef.rootNote;
        playbackRate = Math.pow(2, (noteValue - sampleDef.rootNote) / 12);
        source.playbackRate.value = playbackRate;
        source.connect(gainNode);
        gainNode.connect(previewGain);
        stopAt = Math.min(buffer.duration, sampleDef.loop ? 0.75 : Math.max(0.18, Math.min(buffer.duration, 0.9)));
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(sampleDef.baseGain || 0.25, audioContext.currentTime + Math.max(0.005, sampleDef.attack || 0.01));
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + stopAt);
        source.start(audioContext.currentTime, 0, stopAt);
        source.stop(audioContext.currentTime + stopAt + 0.02);
      });
    }

    function startHeldPreviewSample(sampleDef, noteOverride) {
      if (!sampleDef) {
        return Promise.resolve();
      }

      previewState.active = true;

      if (sampleDef.mode === "wave" || sampleDef.loop) {
        return startSustainedPreview(sampleDef, noteOverride);
      }

      return startRepeatedPreview(sampleDef, noteOverride);
    }

    function startSustainedPreview(sampleDef, noteOverride) {
      var source;
      var gainNode;
      var previewGain;
      var noteValue;
      var frequency;
      var playbackRate;
      var holdGain;

      if (sampleDef.mode === "wave") {
        source = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        previewGain = audioContext.createGain();
        previewGain.gain.value = 0.5;
        source.type = sampleDef.waveform;
        noteValue = 69;
        if (sampleDef.waveform === "triangle") {
          noteValue = 45;
        } else if (sampleDef.waveform === "square" || sampleDef.waveform === "sawtooth") {
          noteValue = 72;
        }
        frequency = 440 * Math.pow(2, (noteValue - 69) / 12);
        source.frequency.setValueAtTime(frequency, audioContext.currentTime);
        source.connect(gainNode);
        gainNode.connect(previewGain);
        previewGain.connect(masterGain);
        holdGain = sampleDef.baseGain || 0.2;
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(holdGain, audioContext.currentTime + Math.max(0.005, sampleDef.attack || 0.01));
        source.start(audioContext.currentTime);
        previewState.voices.push(source);
        return Promise.resolve();
      }

      return ensureSampleLoaded(sampleDef.sampleId).then(function (buffer) {
        source = audioContext.createBufferSource();
        gainNode = audioContext.createGain();
        previewGain = audioContext.createGain();
        previewGain.gain.value = 0.5;
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = sampleDef.loopStart || 0;
        source.loopEnd = sampleDef.loopEnd || Math.max((sampleDef.loopStart || 0) + 0.1, buffer.duration - 0.1);
        noteValue = noteOverride !== null && noteOverride !== undefined ? noteOverride : sampleDef.rootNote;
        playbackRate = Math.pow(2, (noteValue - sampleDef.rootNote) / 12);
        source.playbackRate.value = playbackRate;
        source.connect(gainNode);
        gainNode.connect(previewGain);
        previewGain.connect(masterGain);
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(sampleDef.baseGain || 0.25, audioContext.currentTime + Math.max(0.005, sampleDef.attack || 0.01));
        source.start(audioContext.currentTime);
        previewState.voices.push(source);
      });
    }

    function startRepeatedPreview(sampleDef, noteOverride) {
      var intervalMs = 240;
      var intervalId;

      function trigger() {
        if (!previewState.active) {
          return;
        }
        playPreviewSample(sampleDef, noteOverride).then(function () {
          return null;
        }).catch(function () {
          return null;
        });
      }

      trigger();
      intervalId = window.setInterval(trigger, intervalMs);
      previewState.timers.push(intervalId);
      return Promise.resolve();
    }

    function playDrumKitPreview() {
      var notes = [42, 46, 49, 51, 54, 69];
      var loopMs = 720;

      previewState.active = true;

      notes.forEach(function (note, index) {
        var timerId = window.setTimeout(function tick() {
          if (!previewState.active) {
            return;
          }
          playPreviewSample(resolveDrumLikeSample(note), note).then(function () {
            return null;
          }).catch(function () {
            return null;
          });
          timerId = window.setTimeout(tick, loopMs);
          previewState.timers.push(timerId);
        }, index * 120);
        previewState.timers.push(timerId);
      });

      return Promise.resolve();
    }

    function playDrumKitPreviewBurst() {
      var notes = [42, 46, 49, 51, 54, 69];
      var sequence = Promise.resolve();

      notes.forEach(function (note, index) {
        sequence = sequence.then(function () {
          return new Promise(function (resolve) {
            window.setTimeout(function () {
              playPreviewSample(resolveDrumLikeSample(note), note).then(resolve).catch(resolve);
            }, index * 95);
          });
        });
      });

      return sequence;
    }

    function removeActiveVoice(source) {
      var next = [];
      var index;

      for (index = 0; index < activeVoices.length; index += 1) {
        if (activeVoices[index] !== source) {
          next.push(activeVoices[index]);
        }
      }

      activeVoices = next;
    }

    function getPlaybackPosition() {
      if (!parsedSong || !playing) {
        return pausedAt;
      }

      return (audioContext.currentTime - playbackOriginTime) % parsedSong.duration;
    }

    function getSpectrumData() {
      if (!analyserNode || !spectrumData) {
        return null;
      }

      analyserNode.getByteFrequencyData(spectrumData);
      return spectrumData;
    }

    function findStartingEventIndex(songOffset) {
      var index;

      for (index = 0; index < parsedSong.events.length; index += 1) {
        if (parsedSong.events[index].start >= songOffset) {
          return index;
        }
      }

      return 0;
    }

    function fallbackToAudio() {
      var fallback;
      loadState = "fallback";

      toggleEl.removeEventListener("click", togglePlayback);
      fallback = createFallbackController(toggleEl, statusEl, fallbackAudioEl);
      if (wantsPlayback) {
        fallback.play();
      }
    }

    function setUi(isPlaying, text) {
      if (!isPlaying && /^loading/.test(text || "")) {
        toggleEl.innerHTML = "...";
      } else if (!isPlaying && text === "starting...") {
        toggleEl.innerHTML = "...";
      } else {
        toggleEl.innerHTML = isPlaying ? "||" : ">";
      }
      statusEl.innerHTML = text;
    }

    function fetchWithTimeout(url, timeoutMs) {
      var controller;
      var timeoutId;

      if (window.AbortController) {
        controller = new AbortController();
        timeoutId = window.setTimeout(function () {
          controller.abort();
        }, timeoutMs);

        return fetch(url, { signal: controller.signal }).then(function (response) {
          window.clearTimeout(timeoutId);
          return response;
        }).catch(function (error) {
          window.clearTimeout(timeoutId);
          throw error;
        });
      }

      return fetch(url);
    }
  };

  function createFallbackController(toggleEl, statusEl, audioEl) {
    if (!audioEl) {
      if (toggleEl && statusEl) {
        toggleEl.innerHTML = ">";
        statusEl.innerHTML = "sound off";
      }

      return {
        play: function () {},
        pause: function () {},
        toggle: function () {},
        isPaused: function () { return true; }
      };
    }

    if (toggleEl) {
      toggleEl.onclick = function () {
        if (audioEl.paused) {
          audioEl.play();
        } else {
          audioEl.pause();
        }
      };
    }

    audioEl.addEventListener("play", updateUi);
    audioEl.addEventListener("pause", updateUi);

    function updateUi() {
      if (!toggleEl || !statusEl) {
        return;
      }

      toggleEl.innerHTML = audioEl.paused ? ">" : "||";
      statusEl.innerHTML = audioEl.paused ? "sound off" : "sound on";
    }

    updateUi();

    var fallbackController = {
      play: function () {
        coordinatorState.claim(fallbackController);
        return audioEl.play();
      },
      pause: function () {
        audioEl.pause();
      },
      seek: function (seconds) {
        var target = Math.max(0, Number(seconds) || 0);

        try {
          audioEl.currentTime = target;
        } catch (error) {
          // Ignore invalid seek targets for fallback audio.
        }
      },
      toggle: function () {
        if (audioEl.paused) {
          audioEl.play();
        } else {
          audioEl.pause();
        }
      },
      isPlaying: function () {
        return !audioEl.paused;
      },
      isPaused: function () {
        return audioEl.paused;
      }
    };

    coordinatorState.register(fallbackController);

    return fallbackController;
  }

  function parseMidiFile(arrayBuffer) {
    var reader = createReader(new Uint8Array(arrayBuffer));
    var headerId = readAscii(reader, 4);
    var headerLength;
    var format;
    var trackCount;
    var division;
    var tracks = [];
    var rawEvents = [];
    var noteEvents = [];
    var infoEvents = [];
    var textMetadata = {
      copyright: [],
      text: [],
      instrument: []
    };
    var tempoEvents = [{ tick: 0, microsecondsPerQuarter: 500000 }];
    var programTimeline = {};
    var controllerTimeline = {};
    var pitchBendTimeline = {};
    var trackSummaries = [];
    var rpnTimeline = {};
    var tempoMap;
    var trackIndex;

    if (headerId !== "MThd") {
      throw new Error("unsupported midi file");
    }

    headerLength = readU32(reader);
    format = readU16(reader);
    trackCount = readU16(reader);
    division = readU16(reader);
    if (headerLength > 6) {
      reader.position += (headerLength - 6);
    }

    for (trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      tracks.push(parseTrack(reader, trackIndex));
    }

    tracks.forEach(function (track) {
      rawEvents = rawEvents.concat(track.events);
      trackSummaries.push(track.summary);
    });

    rawEvents.sort(sortEvents);

    rawEvents.forEach(function (event) {
      if (event.type === "tempo") {
        tempoEvents.push({
          tick: event.tick,
          microsecondsPerQuarter: event.microsecondsPerQuarter
        });
      }

      if (event.type === "program") {
        if (!programTimeline[event.channel]) {
          programTimeline[event.channel] = [];
        }
        programTimeline[event.channel].push({
          tick: event.tick,
          program: event.program
        });
      }

      if (event.type === "pitchBend") {
        if (!pitchBendTimeline[event.channel]) {
          pitchBendTimeline[event.channel] = [];
        }
        pitchBendTimeline[event.channel].push({
          tick: event.tick,
          value: event.value
        });
      }

      if (event.type === "controlChange" && (event.controller === 0 || event.controller === 1 || event.controller === 6 || event.controller === 7 || event.controller === 10 || event.controller === 11 || event.controller === 32 || event.controller === 66 || event.controller === 67 || event.controller === 71 || event.controller === 72 || event.controller === 73 || event.controller === 74 || event.controller === 91 || event.controller === 92 || event.controller === 93 || event.controller === 94 || event.controller === 98 || event.controller === 99 || event.controller === 100 || event.controller === 101 || event.controller === 121)) {
        if (!controllerTimeline[event.channel]) {
          controllerTimeline[event.channel] = {};
        }
        if (!controllerTimeline[event.channel][event.controller]) {
          controllerTimeline[event.channel][event.controller] = [];
        }
        controllerTimeline[event.channel][event.controller].push({
          tick: event.tick,
          value: event.value
        });

        if (event.controller === 121) {
          applyControllerReset(controllerTimeline, event.channel, event.tick);
        }
      }

      if (event.type === "copyright") {
        textMetadata.copyright.push(event.text);
      }

      if (event.type === "text") {
        textMetadata.text.push(event.text);
      }

      if (event.type === "instrumentName") {
        textMetadata.instrument.push({
          trackIndex: event.trackIndex,
          text: event.text
        });
      }
    });

    buildRpnTimeline(rawEvents, rpnTimeline);
    tempoMap = buildTempoMap(tempoEvents, division);
    noteEvents = pairNoteEvents(rawEvents, programTimeline, controllerTimeline, pitchBendTimeline, rpnTimeline, tempoMap, division);
    infoEvents = buildInfoEvents(rawEvents, tempoMap, division);

    return {
      format: format,
      trackCount: trackCount,
      division: division,
      duration: Math.max(0.1, Math.max(
        noteEvents.reduce(function (maxValue, event) {
          return Math.max(maxValue, event.start + event.duration);
        }, 0),
        infoEvents.reduce(function (maxValue, event) {
          return Math.max(maxValue, event.start);
        }, 0)
      )),
      events: noteEvents,
      infoEvents: infoEvents,
      rpnTimeline: rpnTimeline,
      trackSummaries: trackSummaries,
      textMetadata: textMetadata,
      tempoMap: tempoMap.map(function (entry) {
        return {
          tick: entry.tick,
          microsecondsPerQuarter: entry.microsecondsPerQuarter,
          secondsAtTick: entry.secondsAtTick
        };
      })
    };
  }

  function parseTrack(reader, trackIndex) {
    var trackId = readAscii(reader, 4);
    var trackLength = readU32(reader);
    var end = reader.position + trackLength;
    var tick = 0;
    var runningStatus = 0;
    var events = [];
    var summary = {
      index: trackIndex,
      name: "",
      hasPlayableNotes: false,
      noteCount: 0,
      lyricCount: 0,
      programCount: 0,
      controlChangeCount: 0,
      tempoCount: 0,
      sysexCount: 0,
      metaCount: 0,
      programValues: [],
      controlNumbers: [],
      descriptions: []
    };

    if (trackId !== "MTrk") {
      throw new Error("unsupported track chunk");
    }

    while (reader.position < end) {
      var delta = readVarLen(reader);
      var status = reader.bytes[reader.position];
      var command;
      var channel;

      tick += delta;

      if (status < 0x80) {
        status = runningStatus;
      } else {
        reader.position += 1;
        runningStatus = status;
      }

      if (status === 0xff) {
        var metaType = reader.bytes[reader.position];
        var metaLength;

        reader.position += 1;
        metaLength = readVarLen(reader);

        if (metaType === 0x51 && metaLength === 3) {
          events.push({
            type: "tempo",
            trackIndex: trackIndex,
            tick: tick,
            microsecondsPerQuarter:
              (reader.bytes[reader.position] << 16) |
              (reader.bytes[reader.position + 1] << 8) |
              reader.bytes[reader.position + 2]
          });
          summary.tempoCount += 1;
        }

        if (metaType === 0x03) {
          events.push({
            type: "trackName",
            trackIndex: trackIndex,
            tick: tick,
            text: readAsciiFromBytes(reader.bytes, reader.position, metaLength)
          });
        }

        if (metaType === 0x01) {
          var textValue = readAsciiFromBytes(reader.bytes, reader.position, metaLength);
          var lyricDurationMatch = /^LYRICDUR:(\d+)$/i.exec(textValue);

          if (lyricDurationMatch) {
            events.push({
              type: "lyricDuration",
              trackIndex: trackIndex,
              tick: tick,
              durationTicks: Number(lyricDurationMatch[1])
            });
          } else {
            events.push({
              type: "text",
              trackIndex: trackIndex,
              tick: tick,
              text: textValue
            });
          }
        }

        if (metaType === 0x02) {
          events.push({
            type: "copyright",
            trackIndex: trackIndex,
            tick: tick,
            text: readAsciiFromBytes(reader.bytes, reader.position, metaLength)
          });
        }

        if (metaType === 0x05) {
          events.push({
            type: "lyric",
            trackIndex: trackIndex,
            tick: tick,
            text: readAsciiFromBytes(reader.bytes, reader.position, metaLength)
          });
          summary.lyricCount += 1;
        }

        if (metaType === 0x04) {
          events.push({
            type: "instrumentName",
            trackIndex: trackIndex,
            tick: tick,
            text: readAsciiFromBytes(reader.bytes, reader.position, metaLength)
          });
        }

        if (metaType === 0x58 && metaLength >= 4) {
          events.push({
            type: "timeSignature",
            trackIndex: trackIndex,
            tick: tick,
            numerator: reader.bytes[reader.position],
            denominator: Math.pow(2, reader.bytes[reader.position + 1])
          });
        }

        if (metaType === 0x59 && metaLength >= 2) {
          events.push({
            type: "keySignature",
            trackIndex: trackIndex,
            tick: tick,
            sharpsFlats: toSignedByte(reader.bytes[reader.position]),
            scale: reader.bytes[reader.position + 1]
          });
        }

        if (metaType === 0x7f) {
          events.push({
            type: "sequencerSpecific",
            trackIndex: trackIndex,
            tick: tick,
            dataHex: bytesToHex(reader.bytes, reader.position, metaLength)
          });
        }

        summary.metaCount += 1;
        reader.position += metaLength;
        runningStatus = 0;
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        reader.position += readVarLen(reader);
        summary.sysexCount += 1;
        runningStatus = 0;
        continue;
      }

      command = status >> 4;
      channel = status & 0x0f;

      if (command === 0x8 || command === 0x9) {
        var note = reader.bytes[reader.position];
        var velocity = reader.bytes[reader.position + 1];
        reader.position += 2;

        events.push({
          type: (command === 0x9 && velocity !== 0) ? "noteOn" : "noteOff",
          trackIndex: trackIndex,
          tick: tick,
          channel: channel,
          note: note,
          velocity: velocity
        });
        if (command === 0x9 && velocity !== 0) {
          summary.noteCount += 1;
          summary.hasPlayableNotes = true;
        }
        continue;
      }

      if (command === 0xc) {
        events.push({
          type: "program",
          trackIndex: trackIndex,
          tick: tick,
          channel: channel,
          program: reader.bytes[reader.position]
        });
        summary.programCount += 1;
        reader.position += 1;
        continue;
      }

      if (command === 0xb) {
        events.push({
          type: "controlChange",
          trackIndex: trackIndex,
          tick: tick,
          channel: channel,
          controller: reader.bytes[reader.position],
          value: reader.bytes[reader.position + 1]
        });
        summary.controlChangeCount += 1;
        reader.position += 2;
        continue;
      }

      if (command === 0xe) {
        events.push({
          type: "pitchBend",
          trackIndex: trackIndex,
          tick: tick,
          channel: channel,
          value: reader.bytes[reader.position] | (reader.bytes[reader.position + 1] << 7)
        });
        reader.position += 2;
        continue;
      }

      if (command === 0xa) {
        reader.position += 2;
        continue;
      }

      if (command === 0xd) {
        reader.position += 1;
      }
    }

    summarizeTrackDescriptions(summary, events);

    return {
      events: events,
      summary: summary
    };
  }

  function pairNoteEvents(rawEvents, programTimeline, controllerTimeline, pitchBendTimeline, rpnTimeline, tempoMap, division) {
    var activeNotes = {};
    var result = [];

    rawEvents.forEach(function (event) {
      var key;
      var queue;
      var program;
      var noteOn;

      if (event.type === "noteOn") {
        key = event.channel + ":" + event.note;
        queue = activeNotes[key] || [];
        queue.push(event);
        activeNotes[key] = queue;
      }

      if (event.type === "noteOff") {
        key = event.channel + ":" + event.note;
        queue = activeNotes[key];

        if (!queue || !queue.length) {
          return;
        }

        noteOn = queue.shift();
        program = event.channel === 9 ? 0 : getProgramAtTick(programTimeline[event.channel], noteOn.tick);

        result.push({
          trackIndex: noteOn.trackIndex,
          channel: noteOn.channel,
          note: noteOn.note,
          velocity: noteOn.velocity,
          program: program,
          bankMsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 0, noteOn.tick, 0),
          modulation: getControlValueAtTick(controllerTimeline[noteOn.channel], 1, noteOn.tick, 0),
          bankLsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 32, noteOn.tick, 0),
          dataEntryMsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 6, noteOn.tick, 0),
          channelVolume: getControlValueAtTick(controllerTimeline[noteOn.channel], 7, noteOn.tick, 100),
          expression: getControlValueAtTick(controllerTimeline[noteOn.channel], 11, noteOn.tick, 127),
          pan: getControlValueAtTick(controllerTimeline[noteOn.channel], 10, noteOn.tick, 64),
          sostenuto: getControlValueAtTick(controllerTimeline[noteOn.channel], 66, noteOn.tick, 0),
          softPedal: getControlValueAtTick(controllerTimeline[noteOn.channel], 67, noteOn.tick, 0),
          resonance: getControlValueAtTick(controllerTimeline[noteOn.channel], 71, noteOn.tick, 64),
          releaseTime: getControlValueAtTick(controllerTimeline[noteOn.channel], 72, noteOn.tick, 64),
          attackTime: getControlValueAtTick(controllerTimeline[noteOn.channel], 73, noteOn.tick, 64),
          brightness: getControlValueAtTick(controllerTimeline[noteOn.channel], 74, noteOn.tick, 64),
          reverbSend: getControlValueAtTick(controllerTimeline[noteOn.channel], 91, noteOn.tick, 0),
          tremoloDepth: getControlValueAtTick(controllerTimeline[noteOn.channel], 92, noteOn.tick, 0),
          chorusSend: getControlValueAtTick(controllerTimeline[noteOn.channel], 93, noteOn.tick, 0),
          celesteDepth: getControlValueAtTick(controllerTimeline[noteOn.channel], 94, noteOn.tick, 0),
          nrpnLsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 98, noteOn.tick, 0),
          nrpnMsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 99, noteOn.tick, 0),
          rpnLsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 100, noteOn.tick, 127),
          rpnMsb: getControlValueAtTick(controllerTimeline[noteOn.channel], 101, noteOn.tick, 127),
          pitchBendSensitivity: getRpnWriteValueAtTick(rpnTimeline[noteOn.channel], "0:0", noteOn.tick, 2),
          pitchBendValue: getPitchBendAtTick(pitchBendTimeline[noteOn.channel], noteOn.tick),
          fineTuneSemitones: getRpnFineTuneAtTick(rpnTimeline[noteOn.channel], noteOn.tick),
          coarseTuneSemitones: getRpnCoarseTuneAtTick(rpnTimeline[noteOn.channel], noteOn.tick),
          start: tickToSeconds(noteOn.tick, tempoMap, division),
          duration: Math.max(0.04, tickToSeconds(event.tick, tempoMap, division) - tickToSeconds(noteOn.tick, tempoMap, division))
        });
      }
    });

    return result.sort(function (left, right) {
      return left.start - right.start;
    });
  }

  function buildRpnTimeline(rawEvents, rpnTimeline) {
    var channelState = {};

    rawEvents.forEach(function (event) {
      var state;
      var key;

      if (event.type !== "controlChange" || event.channel === undefined || event.channel === null) {
        return;
      }

      if (!channelState[event.channel]) {
        channelState[event.channel] = {
          rpnMsb: 127,
          rpnLsb: 127
        };
      }

      state = channelState[event.channel];

      if (event.controller === 101) {
        state.rpnMsb = event.value;
        return;
      }

      if (event.controller === 100) {
        state.rpnLsb = event.value;
        return;
      }

      if (event.controller !== 6) {
        return;
      }

      if (state.rpnMsb === 127 && state.rpnLsb === 127) {
        return;
      }

      if (!rpnTimeline[event.channel]) {
        rpnTimeline[event.channel] = {};
      }

      key = state.rpnMsb + ":" + state.rpnLsb;

      if (!rpnTimeline[event.channel][key]) {
        rpnTimeline[event.channel][key] = [];
      }

      rpnTimeline[event.channel][key].push({
        tick: event.tick,
        value: event.value
      });
    });
  }

  function getRpnWriteValueAtTick(channelRpnTimeline, key, tick, defaultValue) {
    var entries;
    var value = defaultValue;
    var index;

    if (!channelRpnTimeline || !channelRpnTimeline[key]) {
      return defaultValue;
    }

    entries = channelRpnTimeline[key];

    for (index = 0; index < entries.length; index += 1) {
      if (entries[index].tick <= tick) {
        value = entries[index].value;
      } else {
        break;
      }
    }

    return value;
  }

  function getRpnCoarseTuneAtTick(channelRpnTimeline, tick) {
    return getRpnWriteValueAtTick(channelRpnTimeline, "0:2", tick, 64) - 64;
  }

  function getRpnFineTuneAtTick(channelRpnTimeline, tick) {
    return (getRpnWriteValueAtTick(channelRpnTimeline, "0:1", tick, 64) - 64) / 64;
  }

  function getPitchBendAtTick(channelPitchBendTimeline, tick) {
    var value = 8192;
    var index;

    if (!channelPitchBendTimeline) {
      return value;
    }

    for (index = 0; index < channelPitchBendTimeline.length; index += 1) {
      if (channelPitchBendTimeline[index].tick <= tick) {
        value = channelPitchBendTimeline[index].value;
      } else {
        break;
      }
    }

    return value;
  }

  function applyControllerReset(controllerTimeline, channel, tick) {
    var resetValues = {
      1: 0,
      6: 0,
      10: 64,
      11: 127,
      66: 0,
      67: 0,
      71: 64,
      72: 64,
      73: 64,
      74: 64,
      91: 0,
      92: 0,
      93: 0,
      94: 0,
      98: 127,
      99: 127,
      100: 127,
      101: 127
    };

    Object.keys(resetValues).forEach(function (controllerKey) {
      var controllerNumber = Number(controllerKey);

      if (!controllerTimeline[channel][controllerNumber]) {
        controllerTimeline[channel][controllerNumber] = [];
      }

      controllerTimeline[channel][controllerNumber].push({
        tick: tick,
        value: resetValues[controllerNumber]
      });
    });
  }

  function buildInfoEvents(rawEvents, tempoMap, division) {
    var lyricDurations = {};

    rawEvents.forEach(function (event) {
      if (event.type === "lyricDuration") {
        lyricDurations[event.trackIndex + ":" + event.tick] = event.durationTicks;
      }
    });

    return rawEvents.filter(function (event) {
      return event.type === "tempo" ||
        event.type === "text" ||
        event.type === "copyright" ||
        event.type === "trackName" ||
        event.type === "instrumentName" ||
        event.type === "lyric" ||
        event.type === "timeSignature" ||
        event.type === "keySignature" ||
        event.type === "sequencerSpecific" ||
        event.type === "program" ||
        event.type === "controlChange";
    }).map(function (event) {
      var lyricDurationTicks = lyricDurations[event.trackIndex + ":" + event.tick];
      return {
        type: event.type,
        trackIndex: event.trackIndex,
        channel: event.channel,
        start: tickToSeconds(event.tick, tempoMap, division),
        duration: event.type === "lyric" && lyricDurationTicks ? tickToSeconds(event.tick + lyricDurationTicks, tempoMap, division) - tickToSeconds(event.tick, tempoMap, division) : 0,
        label: describeInfoEvent(event),
        controller: event.controller,
        value: event.value,
        program: event.program
      };
    });
  }

  function buildTempoMap(tempoEvents, division) {
    var unique = {};
    var sorted;
    var index;
    var currentSeconds = 0;

    tempoEvents.forEach(function (event) {
      unique[event.tick] = event.microsecondsPerQuarter;
    });

    sorted = Object.keys(unique).map(function (tick) {
      return {
        tick: Number(tick),
        microsecondsPerQuarter: unique[tick]
      };
    }).sort(function (left, right) {
      return left.tick - right.tick;
    });

    for (index = 0; index < sorted.length; index += 1) {
      sorted[index].secondsAtTick = currentSeconds;

      if (index < sorted.length - 1) {
        currentSeconds += ((sorted[index + 1].tick - sorted[index].tick) * sorted[index].microsecondsPerQuarter) / (division * 1000000);
      }
    }

    return sorted;
  }

  function tickToSeconds(tick, tempoMap, division) {
    var index;
    var tempo = tempoMap[0];

    for (index = 0; index < tempoMap.length; index += 1) {
      if (tempoMap[index].tick <= tick) {
        tempo = tempoMap[index];
      } else {
        break;
      }
    }

    return tempo.secondsAtTick + (((tick - tempo.tick) * tempo.microsecondsPerQuarter) / (division * 1000000));
  }

  function getProgramAtTick(programEvents, tick) {
    var program = 0;
    var index;

    if (!programEvents) {
      return 0;
    }

    for (index = 0; index < programEvents.length; index += 1) {
      if (programEvents[index].tick <= tick) {
        program = programEvents[index].program;
      } else {
        break;
      }
    }

    return program;
  }

  function getControlValueAtTick(channelControllers, controllerNumber, tick, defaultValue) {
    var controllerEvents;
    var value = defaultValue;
    var index;

    if (!channelControllers || !channelControllers[controllerNumber]) {
      return defaultValue;
    }

    controllerEvents = channelControllers[controllerNumber];

    for (index = 0; index < controllerEvents.length; index += 1) {
      if (controllerEvents[index].tick <= tick) {
        value = controllerEvents[index].value;
      } else {
        break;
      }
    }

    return value;
  }

  function getAttackScale(value) {
    var normalized = ((value === undefined ? 64 : value) - 64) / 63;

    if (normalized >= 0) {
      return 1 + (normalized * 3);
    }

    return Math.max(0.2, 1 + (normalized * 0.75));
  }

  function getReleaseScale(value) {
    var normalized = ((value === undefined ? 64 : value) - 64) / 63;

    if (normalized >= 0) {
      return 1 + (normalized * 2.2);
    }

    return Math.max(0.2, 1 + (normalized * 0.8));
  }

  function sortEvents(left, right) {
    if (left.tick !== right.tick) {
      return left.tick - right.tick;
    }

    if (left.type === right.type) {
      return 0;
    }

    if (left.type === "program") {
      return -1;
    }

    if (right.type === "program") {
      return 1;
    }

    if (left.type === "tempo") {
      return -1;
    }

    if (right.type === "tempo") {
      return 1;
    }

    if (left.type === "noteOff") {
      return -1;
    }

    return 1;
  }

  function createReader(bytes) {
    return {
      bytes: bytes,
      position: 0
    };
  }

  function readAscii(reader, length) {
    var value = "";
    var index;

    for (index = 0; index < length; index += 1) {
      value += String.fromCharCode(reader.bytes[reader.position + index]);
    }

    reader.position += length;
    return value;
  }

  function readAsciiFromBytes(bytes, start, length) {
    var value = "";
    var index;

    for (index = 0; index < length; index += 1) {
      value += String.fromCharCode(bytes[start + index]);
    }

    return value;
  }

  function readU16(reader) {
    var value = (reader.bytes[reader.position] << 8) | reader.bytes[reader.position + 1];
    reader.position += 2;
    return value;
  }

  function readU32(reader) {
    var value =
      (reader.bytes[reader.position] << 24) |
      (reader.bytes[reader.position + 1] << 16) |
      (reader.bytes[reader.position + 2] << 8) |
      reader.bytes[reader.position + 3];
    reader.position += 4;
    return value >>> 0;
  }

  function readVarLen(reader) {
    var value = 0;
    var nextByte;

    do {
      nextByte = reader.bytes[reader.position];
      reader.position += 1;
      value = (value << 7) | (nextByte & 0x7f);
    } while (nextByte & 0x80);

    return value;
  }

  function toSignedByte(value) {
    return value > 127 ? value - 256 : value;
  }

  function bytesToHex(bytes, start, length) {
    var parts = [];
    var index;

    for (index = 0; index < length; index += 1) {
      parts.push((bytes[start + index] + 256).toString(16).slice(-2));
    }

    return parts.join(" ");
  }

  function summarizeTrackDescriptions(summary, events) {
    var nameEvent = events.find(function (event) {
      return event.type === "trackName" && event.text;
    });
    var timeSignatureEvent = events.find(function (event) {
      return event.type === "timeSignature";
    });
    var keySignatureEvent = events.find(function (event) {
      return event.type === "keySignature";
    });
    var sequencerSpecificEvents = events.filter(function (event) {
      return event.type === "sequencerSpecific";
    });
    var uniquePrograms = {};
    var uniqueControls = {};

    summary.name = nameEvent ? nameEvent.text.replace(/\s+$/, "") : "";

    events.forEach(function (event) {
      if (event.type === "program") {
        uniquePrograms[event.program] = true;
      }
      if (event.type === "controlChange") {
        uniqueControls[event.controller] = true;
      }
    });

    summary.programValues = Object.keys(uniquePrograms).map(Number).sort(function (left, right) {
      return left - right;
    });
    summary.controlNumbers = Object.keys(uniqueControls).map(Number).sort(function (left, right) {
      return left - right;
    });

    if (summary.tempoCount) {
      summary.descriptions.push(summary.tempoCount + " tempo event" + (summary.tempoCount === 1 ? "" : "s"));
    }

    if (timeSignatureEvent) {
      summary.descriptions.push("time signature " + timeSignatureEvent.numerator + "/" + timeSignatureEvent.denominator);
    }

    if (keySignatureEvent) {
      summary.descriptions.push("key signature " + describeKeySignature(keySignatureEvent.sharpsFlats, keySignatureEvent.scale));
    }

    if (summary.programCount > 1) {
      summary.descriptions.push(summary.programCount + " program change" + (summary.programCount === 1 ? "" : "s"));
    }

    if (summary.controlChangeCount) {
      summary.descriptions.push(summary.controlChangeCount + " control change" + (summary.controlChangeCount === 1 ? "" : "s"));
    }

    if (summary.lyricCount) {
      summary.descriptions.push(summary.lyricCount + " lyric event" + (summary.lyricCount === 1 ? "" : "s"));
    }

    if (sequencerSpecificEvents.length) {
      summary.descriptions.push(
        sequencerSpecificEvents.length + " sequencer-specific event" + (sequencerSpecificEvents.length === 1 ? "" : "s")
      );
    }
  }

  function describeInfoEvent(event) {
    if (event.type === "tempo") {
      return "tempo";
    }

    if (event.type === "trackName") {
      return (event.text || "track name").replace(/\s+$/, "");
    }

    if (event.type === "text") {
      return (event.text || "text").replace(/\s+$/, "");
    }

    if (event.type === "copyright") {
      return (event.text || "copyright").replace(/\s+$/, "");
    }

    if (event.type === "instrumentName") {
      return (event.text || "instrument").replace(/\s+$/, "");
    }

    if (event.type === "lyric") {
      return (event.text || "lyric").replace(/\s+$/, "");
    }

    if (event.type === "timeSignature") {
      return event.numerator + "/" + event.denominator;
    }

    if (event.type === "keySignature") {
      return describeKeySignature(event.sharpsFlats, event.scale);
    }

    if (event.type === "sequencerSpecific") {
      return event.dataHex;
    }

    if (event.type === "program") {
      return "prog " + event.program;
    }

    if (event.type === "controlChange") {
      return describeControlChange(event.controller, event.value);
    }

    return event.type;
  }

  function describeControlChange(controller, value) {
    if (controller === 0) {
      return "Bank Select MSB = " + value;
    }

    if (controller === 1) {
      return "Modulation = " + value;
    }

    if (controller === 6) {
      return "Data Entry MSB = " + value;
    }

    if (controller === 7) {
      return "Channel Volume = " + value;
    }

    if (controller === 10) {
      return "Pan = " + value;
    }

    if (controller === 11) {
      return "Expression = " + value;
    }

    if (controller === 32) {
      return "Bank Select LSB = " + value;
    }

    if (controller === 66) {
      return "Sostenuto = " + value;
    }

    if (controller === 67) {
      return "Soft Pedal = " + value;
    }

    if (controller === 71) {
      return "Resonance = " + value;
    }

    if (controller === 72) {
      return "Release Time = " + value;
    }

    if (controller === 73) {
      return "Attack Time = " + value;
    }

    if (controller === 74) {
      return "Brightness = " + value;
    }

    if (controller === 91) {
      return "Reverb Send = " + value;
    }

    if (controller === 92) {
      return "Tremolo Depth = " + value;
    }

    if (controller === 93) {
      return "Chorus Send = " + value;
    }

    if (controller === 94) {
      return "Celeste Depth = " + value;
    }

    if (controller === 98) {
      return "NRPN LSB = " + value;
    }

    if (controller === 99) {
      return "NRPN MSB = " + value;
    }

    if (controller === 100) {
      return "RPN LSB = " + value;
    }

    if (controller === 101) {
      return "RPN MSB = " + value;
    }

    if (controller === 121) {
      return "Reset All Controllers = " + value;
    }

    return "CC" + controller + " = " + value;

    return "CC" + controller + " = " + value;
  }

  function describeKeySignature(sharpsFlats, scale) {
    var major = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];
    var minor = ["Abm", "Ebm", "Bbm", "Fm", "Cm", "Gm", "Dm", "Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "A#m"];
    var index = sharpsFlats + 7;
    var list = scale === 1 ? minor : major;

    if (index < 0 || index >= list.length) {
      return sharpsFlats + " / " + (scale === 1 ? "minor" : "major");
    }

    return list[index];
  }
}());
