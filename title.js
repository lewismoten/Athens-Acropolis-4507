(function () {
  var canvas = document.getElementById("dream-marquee");
  var soundtrack = document.getElementById("soundtrack");
  var soundToggle = document.getElementById("sound-toggle");
  var soundStatus = document.getElementById("sound-status");
  var marqueeApi = window.DreamMarquee;
  var entries;

  if (!canvas || !canvas.getContext || !marqueeApi) {
    return;
  }

  entries = marqueeApi.parseEntries([
    [">>,>>", "The beginning of all dreams", "880000|990000|aa0000|bb0000|cc0000|dd0000|ee0000|ff0000|ee0000|dd0000|cc0000|bb0000|aa0000|990000|880000|990000|aa0000|bb0000|cc0000|dd0000|ee0000|0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|"],
    ["<<,<<", "Located in GeoCities", "00ff00|00ee00|00dd00|00cc00|00bb00|00aa00|009900|008800|009900|00aa00|00bb00|00cc00|00dd00|00ee00|00ff00|00ee00|00dd00|00cc00|00bb00|00aa00|"],
    ["^^,<>", "/Athens/Acropolis/4507/", "00ff00|eeee00|dddd00|cccc00|bbbb00|aaaa00|999900|008800|999900|aaaa00|bbbb00|cccc00|dddd00|eeee00|ffff00|eeee00|dddd00|00cc00|bbbb00|aaaa00|999900|888800|009900|"],
    ["VV,<>", "Get your FREE homepage now!", "880088|990099|aa00aa|bb00bb|cc00cc|dd00dd|ee00ee|ff00ff|ee00ee|00dddd|00cccc|00bbbb|00aaaa|009999|880088|990099|aa00aa|bb00bb|cc00cc|dd00dd|ee00ee|ff00ff|ee00ee|dd00dd|cc00cc|bb00bb|aa00aa|990099|880088|990099|aa00aa|bb00bb|cc00cc|"],
    ["<<,<<", "http://www.geocities.com", "aaaaaa|bbbbbb|cccccc|dddddd|eeeeee|ffffff|eeeeee|dddddd|cccccc|bbbbbb|aaaaaa|999999|888888|999999|aaaaaa|bbbbbb|cccccc|dddddd|eeeeee|ffffff|eeeeee|dddddd|cccccc|bbbbbb|aaaaaa|999999|888888|999999|aaaaaa|bbbbbb|"],
    ["<<,>>", "sweet dreams!", "0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|000099|000088|000088|000099|0000aa|0000bb|0000cc|0000dd|0000ee|0000ff|0000ee|0000dd|0000cc|"]
  ], {
    defaultColors: marqueeApi.parseColorList("ffaa00"),
    holdFrames: 100
  });

  entries.unshift(marqueeApi.createEntry(">>,>>", "Shoomi's HomePage", "0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|000099|000088|000000|000088|000099|0000aa|0000bb|0000cc|0000dd|0000ee|0000ff|0000ee|", {
    defaultColors: marqueeApi.parseColorList("ffaa00"),
    holdFrames: 100
  }));

  marqueeApi.createCanvasMarquee({
    canvas: canvas,
    width: 500,
    height: 78,
    backgroundColor: "#000033",
    dotColor: "#9999ff",
    dotCount: 50,
    waveHeight: 8,
    font: "italic 29px Times New Roman, Times, serif",
    fontHeight: 29,
    fps: 30,
    displayFrames: 100,
    defaultColors: marqueeApi.parseColorList("ffaa00"),
    entries: entries
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
