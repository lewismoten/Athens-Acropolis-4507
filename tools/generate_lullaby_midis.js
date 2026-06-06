const fs = require("fs");
const path = require("path");

const TICKS_PER_BEAT = 192;
const OUTPUT_DIR = path.join(process.cwd(), "soundtrack");
const MIDI_METADATA = {
  author: "Lewis Moten with OpenAI Codex assistance",
  arranger: "Example public-domain-style arrangement for the Shoomi MIDI player demo",
  copyright: "Public domain dedication intended for demonstration and testing use.",
  created: "2026-06-02",
  source: "Traditional nursery rhymes arranged as MIDI player examples",
  website: "https://lewismoten.com",
  lyricsAuthor: "Traditional",
  comments: [
    "Generated for the Shoomi soundtrack sampler using strings, atmosphere, bass, and light percussion.",
    "Created as example files for switching songs in the in-browser MIDI/Web Audio player.",
    "Melodic arrangement and MIDI structure were produced with OpenAI Codex assistance and then curated for this site."
  ],
  sequencer: "Custom JavaScript MIDI generator",
  lyrics: {
    rockAByeBaby: [
      { beat: 0, text: "Rock-a-bye baby," },
      { beat: 4, text: "in the treetop," },
      { beat: 8, text: "when the wind blows," },
      { beat: 12, text: "the cradle will rock." },
      { beat: 16, text: "When the bough breaks," },
      { beat: 20, text: "the cradle will fall," },
      { beat: 24, text: "and down will come baby," },
      { beat: 28, text: "cradle and all." }
    ],
    hushLittleBaby: [
      { beat: 0, text: "Hush, little baby," },
      { beat: 4, text: "don't say a word," },
      { beat: 8, text: "Papa's gonna buy you" },
      { beat: 12, text: "a mockingbird." },
      { beat: 16, text: "And if that mockingbird won't sing,", durationBeats: 8 },
      { beat: 24, text: "Papa's gonna buy you" },
      { beat: 28, text: "a diamond ring." }
    ],
    twinkleTwinkle: [
      { beat: 0, text: "Twinkle, twinkle," },
      { beat: 4, text: "little star," },
      { beat: 8, text: "How I wonder" },
      { beat: 12, text: "what you are." },
      { beat: 16, text: "Up above the" },
      { beat: 20, text: "world so high," },
      { beat: 24, text: "Like a diamond" },
      { beat: 28, text: "in the sky." },
      { beat: 32, text: "Twinkle, twinkle," },
      { beat: 36, text: "little star," },
      { beat: 40, text: "How I wonder" },
      { beat: 44, text: "what you are.", durationBeats: 4 }
    ]
  }
};

function vlq(value) {
  const bytes = [value & 0x7f];
  value >>= 7;

  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }

  return bytes;
}

function ascii(text) {
  return Array.from(Buffer.from(text, "ascii"));
}

function meta(type, data) {
  return [0xff, type, ...vlq(data.length), ...data];
}

function textMeta(type, text) {
  return meta(type, ascii(text));
}

function u32(value) {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  ];
}

function noteOn(channel, note, velocity) {
  return [0x90 | channel, note, velocity];
}

function noteOff(channel, note) {
  return [0x80 | channel, note, 0];
}

function programChange(channel, program) {
  return [0xc0 | channel, program];
}

function controlChange(channel, controller, value) {
  return [0xb0 | channel, controller, value];
}

function createTrack(events) {
  const sorted = events.slice().sort((left, right) => {
    if (left.tick !== right.tick) {
      return left.tick - right.tick;
    }

    return left.order - right.order;
  });

  let previousTick = 0;
  const bytes = [];

  sorted.forEach((event) => {
    bytes.push(...vlq(event.tick - previousTick), ...event.data);
    previousTick = event.tick;
  });

  bytes.push(...vlq(0), ...meta(0x2f, []));

  return [
    ...ascii("MTrk"),
    ...u32(bytes.length),
    ...bytes
  ];
}

function createSong({ title, tempo, melody, chords, bass, drums, keySignature = 0, metadata = {} }) {
  const tracks = [];
  const mergedMetadata = mergeMetadata(metadata);
  const metaEvents = buildSongMetadataEvents(title, tempo, keySignature, mergedMetadata);

  tracks.push(createTrack(metaEvents));

  tracks.push(createTrack(buildInstrumentTrack({
    trackName: "Strings",
    instrumentName: "Synth Strings 1",
    channel: 5,
    program: 50,
    volume: 76,
    pan: 44,
    notes: melody
  })));

  tracks.push(createTrack(buildInstrumentTrack({
    trackName: "Atmosphere",
    instrumentName: "FX 4 (Atmosphere) / Goblins-Unicorn flavor",
    channel: 7,
    program: 99,
    volume: 103,
    pan: 96,
    notes: chords
  })));

  tracks.push(createTrack(buildInstrumentTrack({
    trackName: "Bass",
    instrumentName: "Fretless Bass",
    channel: 8,
    program: 35,
    volume: 79,
    pan: 75,
    notes: bass
  })));

  tracks.push(createTrack(buildDrumTrack(drums, "Drum Kit")));

  const header = [
    ...ascii("MThd"),
    ...u32(6),
    0x00, 0x01,
    0x00, tracks.length,
    (TICKS_PER_BEAT >>> 8) & 0xff, TICKS_PER_BEAT & 0xff
  ];

  return Buffer.from([...header, ...tracks.flat()]);
}

function buildInstrumentTrack({ trackName, instrumentName, channel, program, volume, pan, notes }) {
  const events = [
    { tick: 0, order: 0, data: textMeta(0x03, trackName) },
    { tick: 0, order: 1, data: textMeta(0x04, instrumentName || trackName) },
    { tick: 0, order: 2, data: programChange(channel, program) },
    { tick: 0, order: 3, data: controlChange(channel, 7, volume) },
    { tick: 0, order: 4, data: controlChange(channel, 10, pan) }
  ];

  notes.forEach((note, index) => {
    events.push({
      tick: note.tick,
      order: 10 + index,
      data: noteOn(channel, note.note, note.velocity || 88)
    });
    events.push({
      tick: note.tick + note.duration,
      order: 20000 + index,
      data: noteOff(channel, note.note)
    });
  });

  return events;
}

function buildDrumTrack(notes) {
  const channel = 9;
  const events = [
    { tick: 0, order: 0, data: textMeta(0x03, "Drums") },
    { tick: 0, order: 1, data: textMeta(0x04, "Drum Kit") },
    { tick: 0, order: 2, data: programChange(channel, 0) },
    { tick: 0, order: 3, data: controlChange(channel, 7, 65) },
    { tick: 0, order: 4, data: controlChange(channel, 10, 41) }
  ];

  notes.forEach((note, index) => {
    events.push({
      tick: note.tick,
      order: 10 + index,
      data: noteOn(channel, note.note, note.velocity || 72)
    });
    events.push({
      tick: note.tick + note.duration,
      order: 20000 + index,
      data: noteOff(channel, note.note)
    });
  });

  return events;
}

function mergeMetadata(metadata) {
  return {
    author: metadata.author || MIDI_METADATA.author,
    arranger: metadata.arranger || MIDI_METADATA.arranger,
    copyright: metadata.copyright || MIDI_METADATA.copyright,
    created: metadata.created || MIDI_METADATA.created,
    source: metadata.source || MIDI_METADATA.source,
    website: metadata.website || MIDI_METADATA.website,
    lyricsAuthor: metadata.lyricsAuthor || MIDI_METADATA.lyricsAuthor,
    comments: (metadata.comments && metadata.comments.length ? metadata.comments : MIDI_METADATA.comments).slice(),
    sequencer: metadata.sequencer || MIDI_METADATA.sequencer,
    lyrics: (metadata.lyrics && metadata.lyrics.length ? metadata.lyrics : []).slice()
  };
}

function buildSongMetadataEvents(title, tempo, keySignature, metadata) {
  const events = [
    { tick: 0, order: 0, data: textMeta(0x03, title) },
    { tick: 0, order: 1, data: textMeta(0x01, "Traditional lullaby arranged with Shoomi soundtrack instruments") },
    { tick: 0, order: 2, data: meta(0x7f, [0x00, 0x00, 0x41]) },
    { tick: 0, order: 3, data: meta(0x58, [0x04, 0x02, 0x18, 0x08]) },
    { tick: 0, order: 4, data: meta(0x59, [keySignature & 0xff, 0x00]) },
    { tick: 0, order: 5, data: meta(0x51, [(tempo >>> 16) & 0xff, (tempo >>> 8) & 0xff, tempo & 0xff]) }
  ];
  let order = 6;

  if (metadata.copyright) {
    events.push({ tick: 0, order: order, data: textMeta(0x02, metadata.copyright) });
    order += 1;
  }

  [
    metadata.author ? "Author: " + metadata.author : "",
    metadata.arranger ? "Arranger: " + metadata.arranger : "",
    metadata.lyricsAuthor ? "Lyrics: " + metadata.lyricsAuthor : "",
    metadata.created ? "Created: " + metadata.created : "",
    metadata.source ? "Source: " + metadata.source : "",
    metadata.website ? "Website: " + metadata.website : "",
    metadata.sequencer ? "Sequencer: " + metadata.sequencer : ""
  ].filter(Boolean).forEach((line) => {
    events.push({ tick: 0, order, data: textMeta(0x01, line) });
    order += 1;
  });

  (metadata.comments || []).forEach((comment) => {
    if (!comment) {
      return;
    }
    events.push({ tick: 0, order, data: textMeta(0x01, comment) });
    order += 1;
  });

  (metadata.lyrics || []).forEach((entry) => {
    if (!entry || !entry.text) {
      return;
    }

    events.push({
      tick: q(entry.beat || 0),
      order,
      data: textMeta(0x05, entry.text)
    });
    order += 1;

    if (entry.durationBeats) {
      events.push({
        tick: q(entry.beat || 0),
        order,
        data: textMeta(0x01, "LYRICDUR:" + q(entry.durationBeats))
      });
      order += 1;
    }
  });

  return events;
}

function q(beats) {
  return Math.round(beats * TICKS_PER_BEAT);
}

function addNote(list, beat, duration, note, velocity) {
  list.push({
    tick: q(beat),
    duration: q(duration),
    note,
    velocity
  });
}

function addChord(list, beat, duration, notes, velocity) {
  notes.forEach((note) => {
    addNote(list, beat, duration, note, velocity);
  });
}

function bar(root, quality) {
  if (quality === "maj") {
    return [root, root + 4, root + 7];
  }

  if (quality === "min") {
    return [root, root + 3, root + 7];
  }

  return [root, root + 5, root + 7];
}

function buildRockAByeBaby() {
  const melody = [];
  const chords = [];
  const bass = [];
  const drums = [];
  const phrase = [
    [0, 1, 64], [1, 1, 67], [2, 1, 67], [3, 1, 64],
    [4, 1, 67], [5, 1, 69], [6, 2, 67],
    [8, 1, 64], [9, 1, 62], [10, 1, 64], [11, 1, 65],
    [12, 1, 64], [13, 1, 62], [14, 2, 60]
  ];
  const reprise = [
    [16, 1, 64], [17, 1, 67], [18, 1, 67], [19, 1, 64],
    [20, 1, 67], [21, 1, 69], [22, 2, 71],
    [24, 1, 69], [25, 1, 67], [26, 1, 65], [27, 1, 64],
    [28, 1, 62], [29, 1, 64], [30, 2, 60]
  ];
  const progression = [
    [0, bar(48, "maj")], [4, bar(53, "maj")], [8, bar(57, "maj")], [12, bar(48, "maj")],
    [16, bar(48, "maj")], [20, bar(53, "maj")], [24, bar(55, "maj")], [28, bar(48, "maj")]
  ];

  phrase.concat(reprise).forEach(([beat, duration, note], index) => {
    addNote(melody, beat, duration, note, index % 6 === 0 ? 98 : 90);
    if (duration >= 2) {
      addNote(melody, beat + 1.5, 0.5, note - 5, 48);
    }
    if (index % 4 === 1) {
      addNote(melody, beat + 0.5, 0.5, note + 12, 44);
    }
  });

  progression.forEach(([beat, notes], index) => {
    addChord(chords, beat, 4, notes.map((note) => note + 12), index % 2 === 0 ? 54 : 48);
    addChord(chords, beat + 2, 2, notes.map((note) => note + 19), 42);
    addChord(chords, beat + 3, 1, notes.map((note) => note + 24), 30);
    addNote(bass, beat, 2, notes[0], 72);
    addNote(bass, beat + 2, 2, notes[0] + 7, 66);
    addNote(bass, beat + 1, 1, notes[0] + 12, 52);
    addNote(bass, beat + 3, 1, notes[0] + 5, 50);
  });

  for (let beat = 0; beat < 32; beat += 1) {
    addNote(drums, beat, 0.4, 42, beat % 4 === 0 ? 62 : 48);
    if (beat % 4 === 2) {
      addNote(drums, beat, 0.5, 54, 54);
    }
    if (beat % 8 === 7) {
      addNote(drums, beat + 0.5, 0.8, 46, 52);
    }
    if (beat % 8 === 3) {
      addNote(drums, beat + 0.75, 0.3, 51, 40);
    }
  }

  addNote(drums, 0, 1.2, 49, 64);
  addNote(drums, 15.5, 1.0, 69, 58);
  addNote(drums, 31, 1.5, 49, 70);

  return createSong({
    title: "Rock-a-bye Baby",
    tempo: 640000,
    melody,
    chords,
    bass,
    drums,
    metadata: {
      lyrics: MIDI_METADATA.lyrics.rockAByeBaby
    }
  });
}

function buildHushLittleBaby() {
  const melody = [];
  const chords = [];
  const bass = [];
  const drums = [];
  const melodyNotes = [
    [0, 1, 60], [1, 1, 64], [2, 2, 67],
    [4, 1, 67], [5, 1, 69], [6, 2, 67],
    [8, 1, 65], [9, 1, 64], [10, 2, 62],
    [12, 1, 64], [13, 1, 62], [14, 2, 60],
    [16, 1, 60], [17, 1, 64], [18, 2, 67],
    [20, 1, 69], [21, 1, 71], [22, 2, 72],
    [24, 1, 69], [25, 1, 67], [26, 2, 65],
    [28, 1, 64], [29, 1, 62], [30, 2, 60]
  ];
  const progression = [
    [0, bar(48, "maj")], [4, bar(57, "maj")], [8, bar(53, "maj")], [12, bar(48, "maj")],
    [16, bar(48, "maj")], [20, bar(55, "maj")], [24, bar(53, "maj")], [28, bar(48, "maj")]
  ];

  melodyNotes.forEach(([beat, duration, note], index) => {
    addNote(melody, beat, duration, note, index % 5 === 0 ? 96 : 88);
    if (duration === 2) {
      addNote(melody, beat + 1.5, 0.5, note - 12, 38);
    }
    if (index % 3 === 0) {
      addNote(melody, beat + 0.5, 0.5, note + 7, 46);
    }
  });

  progression.forEach(([beat, notes], index) => {
    addChord(chords, beat, 4, notes.map((note) => note + 12), index % 2 === 0 ? 56 : 50);
    addChord(chords, beat + 1, 3, notes.map((note) => note + 24), 34);
    addChord(chords, beat + 2.5, 1.5, notes.map((note) => note + 19), 36);
    addNote(bass, beat, 1.5, notes[0], 74);
    addNote(bass, beat + 2, 1.5, notes[0] + 7, 68);
    addNote(bass, beat + 1.5, 0.5, notes[0] + 12, 48);
    addNote(bass, beat + 3.5, 0.5, notes[0] + 5, 46);
  });

  for (let beat = 0; beat < 32; beat += 1) {
    addNote(drums, beat, 0.35, beat % 8 === 7 ? 46 : 42, beat % 4 === 0 ? 60 : 46);
    if (beat % 2 === 1) {
      addNote(drums, beat + 0.5, 0.3, 69, 40);
    }
    if (beat % 4 === 2) {
      addNote(drums, beat, 0.45, 54, 52);
    }
    if (beat % 8 === 4) {
      addNote(drums, beat + 0.75, 0.75, 51, 42);
    }
    if (beat % 8 === 6) {
      addNote(drums, beat + 0.25, 0.25, 49, 34);
    }
  }

  addNote(drums, 0, 1.0, 49, 58);
  addNote(drums, 31.25, 1.4, 49, 66);

  return createSong({
    title: "Hush, Little Baby",
    tempo: 620000,
    melody,
    chords,
    bass,
    drums,
    metadata: {
      lyrics: MIDI_METADATA.lyrics.hushLittleBaby
    }
  });
}

function buildTwinkleTwinkleLittleStar() {
  const melody = [];
  const chords = [];
  const bass = [];
  const drums = [];
  const melodyNotes = [
    [0, 1, 60], [1, 1, 60], [2, 1, 67], [3, 1, 67],
    [4, 1, 69], [5, 1, 69], [6, 2, 67],
    [8, 1, 65], [9, 1, 65], [10, 1, 64], [11, 1, 64],
    [12, 1, 62], [13, 1, 62], [14, 2, 60],
    [16, 1, 67], [17, 1, 67], [18, 1, 65], [19, 1, 65],
    [20, 1, 64], [21, 1, 64], [22, 2, 62],
    [24, 1, 67], [25, 1, 67], [26, 1, 65], [27, 1, 65],
    [28, 1, 64], [29, 1, 64], [30, 2, 62],
    [32, 1, 60], [33, 1, 60], [34, 1, 67], [35, 1, 67],
    [36, 1, 69], [37, 1, 69], [38, 2, 67],
    [40, 1, 65], [41, 1, 65], [42, 1, 64], [43, 1, 64],
    [44, 1, 62], [45, 1, 62], [46, 2, 60]
  ];
  const progression = [
    [0, bar(48, "maj")], [4, bar(55, "maj")], [8, bar(53, "maj")], [12, bar(48, "maj")],
    [16, bar(55, "maj")], [20, bar(50, "maj")], [24, bar(55, "maj")], [28, bar(50, "maj")],
    [32, bar(48, "maj")], [36, bar(55, "maj")], [40, bar(53, "maj")], [44, bar(48, "maj")]
  ];

  melodyNotes.forEach(([beat, duration, note], index) => {
    addNote(melody, beat, duration, note, index % 7 === 0 ? 98 : 88);
    if (duration >= 2) {
      addNote(melody, beat + 1.5, 0.5, note - 12, 36);
    }
    if (index % 4 === 2) {
      addNote(melody, beat + 0.5, 0.5, note + 12, 42);
    }
  });

  progression.forEach(([beat, notes], index) => {
    addChord(chords, beat, 4, notes.map((note) => note + 12), index % 2 === 0 ? 54 : 48);
    addChord(chords, beat + 2, 2, notes.map((note) => note + 19), 38);
    addChord(chords, beat + 3, 1, notes.map((note) => note + 24), 30);
    addNote(bass, beat, 2, notes[0], 72);
    addNote(bass, beat + 2, 2, notes[0] + 7, 66);
    addNote(bass, beat + 1, 1, notes[0] + 12, 46);
    addNote(bass, beat + 3, 1, notes[0] + 5, 44);
  });

  for (let beat = 0; beat < 48; beat += 1) {
    addNote(drums, beat, 0.35, beat % 8 === 7 ? 46 : 42, beat % 4 === 0 ? 58 : 44);
    if (beat % 4 === 2) {
      addNote(drums, beat, 0.4, 54, 48);
    }
    if (beat % 8 === 3) {
      addNote(drums, beat + 0.75, 0.3, 51, 38);
    }
    if (beat % 8 === 5) {
      addNote(drums, beat + 0.5, 0.25, 69, 34);
    }
  }

  addNote(drums, 0, 1.0, 49, 56);
  addNote(drums, 23.5, 0.8, 69, 44);
  addNote(drums, 47, 1.2, 49, 64);

  return createSong({
    title: "Twinkle, Twinkle, Little Star",
    tempo: 600000,
    melody,
    chords,
    bass,
    drums,
    metadata: {
      lyrics: MIDI_METADATA.lyrics.twinkleTwinkle
    }
  });
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, "rock_a_bye_baby.mid"), buildRockAByeBaby());
fs.writeFileSync(path.join(OUTPUT_DIR, "hush_little_baby.mid"), buildHushLittleBaby());
fs.writeFileSync(path.join(OUTPUT_DIR, "twinkle_twinkle_little_star.mid"), buildTwinkleTwinkleLittleStar());

console.log("Wrote soundtrack/rock_a_bye_baby.mid");
console.log("Wrote soundtrack/hush_little_baby.mid");
console.log("Wrote soundtrack/twinkle_twinkle_little_star.mid");
