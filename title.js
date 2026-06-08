(function () {
  var canvas = document.getElementById("dream-marquee");
  var soundtrack = document.getElementById("soundtrack");
  var soundToggle = document.getElementById("sound-toggle");
  var soundStatus = document.getElementById("sound-status");
  var marqueeApi = window.ShoomiColorMarquee;

  if (!canvas || !canvas.getContext || !marqueeApi) {
    return;
  }

  marqueeApi.createCanvasMarquee({
    canvas: canvas,
    width: 500,
    height: 78,
    backgroundColor: "#000033",
    dotColor: "#9999ff",
    dotCount: 50,
    waveHeight: 8,
    fontName: '"Times New Roman", Times, serif',
    fontSize: 29,
    fontStyle: "2",
    fps: 30,
    displayFrames: 100,
    defaultColor: "#ffaa00",
    message: (canvas.textContent || "Shoomi's HomePage").trim(),
    colors: "ffaa00",
    messageFile: "dreamers.txt"
  });

  initSoundtrack();

  function initSoundtrack() {
    if (!soundtrack || !soundToggle || !soundStatus) {
      return;
    }

    if (window.createDreamSoundtrackController) {
      window.createDreamSoundtrackController({
        toggleEl: soundToggle,
        statusEl: soundStatus,
        fallbackAudioEl: soundtrack,
        assetBase: ".",
        midiUrl: "midi_song_newage.mid"
      });
      return;
    }

    soundToggle.addEventListener("click", toggleSoundtrack);
    soundtrack.addEventListener("play", updateSoundUi);
    soundtrack.addEventListener("pause", updateSoundUi);
    soundtrack.addEventListener("ended", updateSoundUi);

    updateSoundUi();

    if (soundtrack.autoplay) {
      attemptAutoplay();
    }
  }

  function attemptAutoplay() {
    var playPromise = soundtrack.play();

    if (playPromise && playPromise.then) {
      playPromise.then(function () {
        updateSoundUi();
      }).catch(function () {
        soundStatus.innerHTML = "click for sound";
        soundToggle.innerHTML = ">";
      });
    }
  }

  function toggleSoundtrack() {
    if (!soundtrack) {
      return;
    }

    if (soundtrack.paused) {
      soundtrack.play();
    } else {
      soundtrack.pause();
    }
  }

  function updateSoundUi() {
    if (!soundtrack || !soundToggle || !soundStatus) {
      return;
    }

    if (soundtrack.paused) {
      soundToggle.innerHTML = ">";
      soundStatus.innerHTML = "sound off";
      return;
    }

    soundToggle.innerHTML = "||";
    soundStatus.innerHTML = "sound on";
  }
}());
