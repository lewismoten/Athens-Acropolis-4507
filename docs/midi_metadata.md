# MIDI Metadata

## Source File
- `midi_song_newage.mid`

## Container And Timing
- Format: `1`
- Track count: `5`
- Division: `192` ticks per quarter note
- Time signature: `4/4`
- Key signature: `C major` / `0 sharps`
- Tempo meta event at tick `0`: `08 6E 95`
- Approximate tempo: about `110 BPM`
- Approximate duration: about `2:30`
- Parsed playback duration used by the Web Audio restoration: about `154.9 seconds`

## Embedded Text And Track Names
- Track 1: unnamed meta/control track
- Track 2: `Drums`
- Track 3: `Track8`
- Track 4: `Track9`
- Track 5: `Track10`

## Other Embedded Metadata
- Sequencer-Specific meta event present, length `3`
- No visible title field found
- No visible composer/author field found
- No visible copyright text found
- No visible lyric or cue text found

## Initial Program And Mix Setup At Tick 0
- Channel 5:
  - Program `50` = `Synth Strings 1`
  - Web Audio sample substitute: [Program 50 String Ensemble sample](../soundtrack/samples/program_50_string_ensemble_g4.ogg)
  - Main volume `76`
  - Pan `44`
  - Bank MSB `0`
  - Bank LSB `0`
- Channel 7:
  - Program `99` = `Atmosphere`
  - Web Audio sample substitute: [Program 99 Goblins/Unicorn sample](../soundtrack/samples/program_99_goblins_unicorn_c4.ogg)
  - Main volume `103`
  - Pan `96`
  - Bank MSB `0`
  - Bank LSB `0`
- Channel 8:
  - Program `35` = `Fretless Bass`
  - Web Audio sample substitute: [Program 35 Fretless bass sample](../soundtrack/samples/program_35_fretless_bass_f2.ogg)
  - Main volume `79`
  - Pan `75`
  - Bank MSB `0`
  - Bank LSB `0`
- Channel 9:
  - Program `0` = standard drum kit context
  - Web Audio drum samples:
    [Drum 42 Closed hi-hat](../soundtrack/samples/drum_42_closed_hihat.ogg),
    [Drum 46 Open hi-hat](../soundtrack/samples/drum_46_open_hihat.ogg),
    [Drum 49 Crash cymbal](../soundtrack/samples/drum_49_crash_cymbal.ogg),
    [Drum 51 Ride cymbal](../soundtrack/samples/drum_51_ride_cymbal.ogg),
    [Drum 54 Tambourine](../soundtrack/samples/drum_54_tambourine.ogg),
    [Drum 69 Cabasa](../soundtrack/samples/drum_69_cabasa.ogg)
  - Main volume `65`
  - Pan `41`
  - Bank MSB `0`
  - Bank LSB `0`

## Visible Raw Strings Found In The File
- `MThd`
- `MTrk`
- `Drums`
- `Track8`
- `Track9`
- `Track10`

## Origin Clues
- The file does not contain a visible title, composer, copyright, or publisher field.
- The track names are generic:
  - `Drums`
  - `Track8`
  - `Track9`
  - `Track10`
- That naming pattern feels more like a keyboard/sequencer export default than a carefully tagged commercial release.
- A sequencer-specific meta event is present at tick `0` with data `00 00 41`.
- `41h` is Roland's manufacturer ID in MIDI SysEx tables, which suggests the file may have been created on, exported from, or prepared for Roland-compatible hardware/software.
- That Roland clue points more to the toolchain or target playback environment than to a named author.
- My best current historical reading is:
  - likely source: a 90s MIDI archive, hobbyist sequence collection, or personal download
  - likely era: mid-to-late 1990s
  - confirmed author/title: unknown

## Could It Have Been Generated?
- Possibly, but I cannot prove it from the file alone.
- Things that make a generator or pattern-based tool plausible:
  - the file is sparse in metadata
  - it uses a small, tidy GM instrument set
  - the structure is repetitive and economical
- Things that make it feel less like a pure automatic generator dump:
  - the arrangement is musically intentional enough to separate roles cleanly into strings, atmosphere pad, bass, and percussion
  - the channel volumes and pans appear deliberately balanced
  - the percussion choices feel curated rather than random
- My best guess is:
  - it could have been sequenced with the help of a pattern-based or mathematically driven MIDI tool
  - but it still feels more like a human-shaped arrangement than a raw automatic output

## External Search Result
- I searched for the exact filename and for musical-structure clues on public MIDI catalog sites.
- I did not find a trustworthy match for the exact file under a confirmed song title or composer.
- So the current attribution status remains:
  - source archive unknown
  - author unknown
  - composition date unknown

## Restoration Notes
- The original MIDI is technically sparse in human-readable metadata.
- Most useful surviving information is playback structure, track naming, and program/channel setup.
- The Web Audio restoration reads this MIDI directly and maps its requested programs to a compact Sound Blaster-style sample bank in [soundtrack/samples](../soundtrack/samples).
- The strongest new origin clue so far is the Roland-associated `41h` sequencer-specific marker, but that is still not enough to identify the exact song source or author.

## Continue Exploring

- [Back to the main project overview](../README.md)
- [Shoomi's Soundtrack](SHOOMI_SOUNDTRACK.md)
- [Check the soundtrack licensing and sample-bank caveats](SOUNDTRACK_LICENSE_NOTES.md)
- [See the restored Java applet research](JAVA_APPLET_NOTES.md)
- [Read the Nightmare font provenance notes](NIGHTMARE_FONT_NOTES.md)
- [See the Cool Color Writer reconstruction notes](COOL_COLOR_WRITER_NOTES.md)
