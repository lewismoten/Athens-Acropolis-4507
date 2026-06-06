const fs = require("fs");
const path = require("path");

const TICKS_PER_QUARTER = 192;

const definitions = [
  { name: "program_50_string_ensemble_g4", channel: 0, program: 50, note: 67, velocity: 92, durationTicks: TICKS_PER_QUARTER * 16 },
  { name: "program_99_goblins_unicorn_c4", channel: 1, program: 99, note: 60, velocity: 92, durationTicks: TICKS_PER_QUARTER * 16 },
  { name: "program_35_fretless_bass_f2", channel: 2, program: 35, note: 41, velocity: 88, durationTicks: TICKS_PER_QUARTER * 8 },
  { name: "drum_42_closed_hihat", channel: 9, note: 42, velocity: 100, durationTicks: TICKS_PER_QUARTER * 2 },
  { name: "drum_46_open_hihat", channel: 9, note: 46, velocity: 100, durationTicks: TICKS_PER_QUARTER * 2 },
  { name: "drum_49_crash_cymbal", channel: 9, note: 49, velocity: 100, durationTicks: TICKS_PER_QUARTER * 4 },
  { name: "drum_51_ride_cymbal", channel: 9, note: 51, velocity: 100, durationTicks: TICKS_PER_QUARTER * 4 },
  { name: "drum_54_tambourine", channel: 9, note: 54, velocity: 100, durationTicks: TICKS_PER_QUARTER * 3 },
  { name: "drum_69_cabasa", channel: 9, note: 69, velocity: 100, durationTicks: TICKS_PER_QUARTER * 2 }
];

const outputDir = path.join(process.cwd(), "soundtrack", "samples");

for (const definition of definitions) {
  fs.writeFileSync(
    path.join(outputDir, definition.name + ".mid"),
    buildMidi(definition)
  );
}

function buildMidi(definition) {
  const trackChunks = [];

  trackChunks.push(varLen(0));
  trackChunks.push(bytes(0xff, 0x51, 0x03, 0x08, 0x53, 0x3b));

  if (definition.channel !== 9) {
    trackChunks.push(varLen(0));
    trackChunks.push(bytes(0xc0 | definition.channel, definition.program));
  }

  trackChunks.push(varLen(0));
  trackChunks.push(bytes(0x90 | definition.channel, definition.note, definition.velocity));

  trackChunks.push(varLen(definition.durationTicks));
  trackChunks.push(bytes(0x80 | definition.channel, definition.note, 0));

  trackChunks.push(varLen(0));
  trackChunks.push(bytes(0xff, 0x2f, 0x00));

  const trackData = Buffer.concat(trackChunks);

  return Buffer.concat([
    Buffer.from("MThd", "ascii"),
    u32(6),
    u16(0),
    u16(1),
    u16(TICKS_PER_QUARTER),
    Buffer.from("MTrk", "ascii"),
    u32(trackData.length),
    trackData
  ]);
}

function bytes(...values) {
  return Buffer.from(values);
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value, 0);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
}

function varLen(value) {
  const buffer = [value & 0x7f];
  let remaining = value >>> 7;

  while (remaining > 0) {
    buffer.unshift((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }

  return Buffer.from(buffer);
}
