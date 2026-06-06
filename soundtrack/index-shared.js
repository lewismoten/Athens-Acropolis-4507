(function () {
  var TRACKS = {
    "../midi_song_newage.mid": {
      label: "Site soundtrack - New Age",
      caption: "The restored GeoCities title-frame soundtrack."
    },
    "rock_a_bye_baby.mid?v=3": {
      label: "Rock-a-bye Baby",
      caption: "A lullaby arranged with the same dream soundtrack palette."
    },
    "hush_little_baby.mid?v=6": {
      label: "Hush, Little Baby",
      caption: "A second lullaby with extra pad swells, bass steps, and bedtime percussion flourishes."
    },
    "twinkle_twinkle_little_star.mid?v=3": {
      label: "Twinkle, Twinkle, Little Star",
      caption: "A brighter lullaby example with the same dream soundtrack palette and lyric timing."
    }
  };
  var TRACK_COLORS = {
    "Strings": "#66ccff",
    "Atmosphere": "#cc99ff",
    "Bass": "#66ff99",
    "Drums": "#ffcc66"
  };
  var DRUM_SAMPLE_OPTIONS = [
    { note: 42, label: "42: Closed HH" },
    { note: 46, label: "46: Open HH" },
    { note: 49, label: "49: Crash" },
    { note: 51, label: "51: Ride" },
    { note: 54, label: "54: Tambourine" },
    { note: 69, label: "69: Cabasa" }
  ];
  var DRUM_FALLBACK_NOTES = {
    35: 49,
    36: 49,
    37: 54,
    38: 54,
    39: 54,
    40: 54,
    41: 51,
    43: 51,
    44: 42,
    45: 51,
    47: 51,
    48: 51,
    50: 51,
    52: 49,
    53: 51,
    55: 49,
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
    68: 54
  };
  var GENERAL_MIDI_PROGRAM_NAMES = [
    "Acoustic Grand Piano", "Bright Acoustic Piano", "Electric Grand Piano", "Honky-tonk Piano",
    "Electric Piano 1", "Electric Piano 2", "Harpsichord", "Clavi",
    "Celesta", "Glockenspiel", "Music Box", "Vibraphone",
    "Marimba", "Xylophone", "Tubular Bells", "Dulcimer",
    "Drawbar Organ", "Percussive Organ", "Rock Organ", "Church Organ",
    "Reed Organ", "Accordion", "Harmonica", "Tango Accordion",
    "Acoustic Guitar (nylon)", "Acoustic Guitar (steel)", "Electric Guitar (jazz)", "Electric Guitar (clean)",
    "Electric Guitar (muted)", "Overdriven Guitar", "Distortion Guitar", "Guitar Harmonics",
    "Acoustic Bass", "Electric Bass (finger)", "Electric Bass (pick)", "Fretless Bass",
    "Slap Bass 1", "Slap Bass 2", "Synth Bass 1", "Synth Bass 2",
    "Violin", "Viola", "Cello", "Contrabass",
    "Tremolo Strings", "Pizzicato Strings", "Orchestral Harp", "Timpani",
    "String Ensemble 1", "String Ensemble 2", "Synth Strings 1", "Synth Strings 2",
    "Choir Aahs", "Voice Oohs", "Synth Voice", "Orchestra Hit",
    "Trumpet", "Trombone", "Tuba", "Muted Trumpet",
    "French Horn", "Brass Section", "Synth Brass 1", "Synth Brass 2",
    "Soprano Sax", "Alto Sax", "Tenor Sax", "Baritone Sax",
    "Oboe", "English Horn", "Bassoon", "Clarinet",
    "Piccolo", "Flute", "Recorder", "Pan Flute",
    "Blown Bottle", "Shakuhachi", "Whistle", "Ocarina",
    "Lead 1 (square)", "Lead 2 (sawtooth)", "Lead 3 (calliope)", "Lead 4 (chiff)",
    "Lead 5 (charang)", "Lead 6 (voice)", "Lead 7 (fifths)", "Lead 8 (bass + lead)",
    "Pad 1 (new age)", "Pad 2 (warm)", "Pad 3 (polysynth)", "Pad 4 (choir)",
    "Pad 5 (bowed)", "Pad 6 (metallic)", "Pad 7 (halo)", "Pad 8 (sweep)",
    "FX 1 (rain)", "FX 2 (soundtrack)", "FX 3 (crystal)", "FX 4 (atmosphere)",
    "FX 5 (brightness)", "FX 6 (goblins)", "FX 7 (echoes)", "FX 8 (sci-fi)",
    "Sitar", "Banjo", "Shamisen", "Koto",
    "Kalimba", "Bag pipe", "Fiddle", "Shanai",
    "Tinkle Bell", "Agogo", "Steel Drums", "Woodblock",
    "Taiko Drum", "Melodic Tom", "Synth Drum", "Reverse Cymbal",
    "Guitar Fret Noise", "Breath Noise", "Seashore", "Bird Tweet",
    "Telephone Ring", "Helicopter", "Applause", "Gunshot"
  ];
  var DRUM_NAMES = {
    35: "Acoustic BD",
    36: "Bass Drum 1",
    38: "Acoustic Snare",
    40: "Electric Snare",
    41: "Low Floor Tom",
    42: "Closed HH",
    43: "High Floor Tom",
    44: "Pedal HH",
    45: "Low Tom",
    46: "Open HH",
    47: "Low-Mid Tom",
    48: "Hi-Mid Tom",
    49: "Crash",
    50: "High Tom",
    51: "Ride",
    52: "Chinese Cym",
    53: "Ride Bell",
    54: "Tambourine",
    55: "Splash Cym",
    56: "Cowbell",
    57: "Crash 2",
    58: "Vibraslap",
    59: "Ride 2",
    60: "Hi Bongo",
    61: "Low Bongo",
    62: "Mute Hi Conga",
    63: "Open Hi Conga",
    64: "Low Conga",
    65: "High Timbale",
    66: "Low Timbale",
    67: "High Agogo",
    68: "Low Agogo",
    69: "Cabasa"
  };

  function formatNumberRanges(values) {
    var sorted = (values || []).slice().sort(function (left, right) {
      return left - right;
    });
    var parts = [];
    var start;
    var end;
    var index;

    if (!sorted.length) {
      return "-";
    }

    start = sorted[0];
    end = sorted[0];

    for (index = 1; index <= sorted.length; index += 1) {
      if (sorted[index] === end + 1) {
        end = sorted[index];
        continue;
      }

      if (start === end) {
        parts.push(String(start));
      } else {
        parts.push(start + "-" + end);
      }

      start = sorted[index];
      end = sorted[index];
    }

    return parts.join(", ");
  }

  function formatTime(seconds) {
    var whole = Math.max(0, Math.floor(seconds));
    var minutes = Math.floor(whole / 60);
    var remainder = whole % 60;

    return minutes + ":" + (remainder < 10 ? "0" : "") + remainder;
  }

  function fitLabel(context, text, maxWidth) {
    var value = String(text || "");

    if (context.measureText(value).width <= maxWidth) {
      return value;
    }

    while (value.length > 1 && context.measureText(value + "...").width > maxWidth) {
      value = value.slice(0, -1);
    }

    return value + "...";
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function isCommentLikeTrackName(name) {
    var value = String(name || "").trim();

    if (!value || value === "-") {
      return false;
    }

    if (value.length >= 36) {
      return true;
    }

    if (/[.!?]["']?$/.test(value) || /[,;:]/.test(value) || /(^|\s)(i|i've|i'd|don't|can't|won't|well)\b/i.test(value)) {
      return true;
    }

    if (/\b(lyric|copyright|track|name|music by|converted by|arranged by|vgmusic|midi by)\b/i.test(value)) {
      return true;
    }

    return false;
  }

  function getDrumName(note) {
    return DRUM_NAMES[note] || "Percussion";
  }

  function getProgramMeaning(program, profile) {
    var name = GENERAL_MIDI_PROGRAM_NAMES[Number(program)];

    if (!name) {
      return "(unknown)";
    }

    if (profile === "gs") {
      return "(" + name + ", GS base)";
    }
    if (profile === "xg") {
      return "(" + name + ", XG base)";
    }
    if (profile === "game") {
      return "(" + name + ", game hint)";
    }

    return "(" + name + ")";
  }

  window.ShoomiIndexPageShared = {
    TRACKS: TRACKS,
    TRACK_COLORS: TRACK_COLORS,
    DRUM_SAMPLE_OPTIONS: DRUM_SAMPLE_OPTIONS,
    DRUM_FALLBACK_NOTES: DRUM_FALLBACK_NOTES,
    GENERAL_MIDI_PROGRAM_NAMES: GENERAL_MIDI_PROGRAM_NAMES,
    formatNumberRanges: formatNumberRanges,
    formatTime: formatTime,
    fitLabel: fitLabel,
    escapeHtml: escapeHtml,
    isCommentLikeTrackName: isCommentLikeTrackName,
    getDrumName: getDrumName,
    getProgramMeaning: getProgramMeaning
  };
}());
