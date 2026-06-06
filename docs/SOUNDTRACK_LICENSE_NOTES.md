# Soundtrack License Notes

This project includes a Web Audio soundtrack player that reads [midi_song_newage.mid](../midi_song_newage.mid) directly and plays it back using a compact set of rendered instrument samples in [soundtrack/samples](../soundtrack/samples).

## Short Answer

The sample files in `soundtrack/samples/` are almost certainly **copyrighted audio works**, not public domain by default.

What matters is whether they were derived from source patches that were distributed under terms allowing redistribution and derivative use. Based on the package names, patch names, and TiMidity ecosystem references, these patches appear to come from the historical **FreePats** patch set commonly bundled with TiMidity-compatible systems.

## What Is Confirmed

- The local TiMidity configuration used patch names and paths consistent with the `FreePats`/GUS patch layout:
  - `Tone_000/...`
  - `Drum_000/...`
- Multiple package indexes list the exact patch filenames used here as part of the `freepats` package, including:
  - `Tone_000/035_Fretless_Bass.pat`
  - `Tone_000/048_String_Ensemble_1_Marcato.pat`
  - `Tone_000/098_Crystal.pat`
  - `Tone_000/101_Goblins--Unicorn.pat`
- FreePats describes itself as a project for a "free and open collection of digital instruments for music production."
- A package listing for `freepats-20060219` identifies its package license as `gnu-gpl-v2`.

## Important Uncertainty

The exact **per-file** authorship, year, and license for the specific historical patch files used here has **not** been conclusively verified from upstream file headers or authoritative patch-level metadata.

There is also some licensing ambiguity in the broader FreePats ecosystem:

- Current FreePats policy pages say plain GPL is generally **not suitable** for sound samples unless there is a special exception.
- Historical package metadata for `freepats-20060219` still reports `GPL v2`.

So the safest interpretation is:

- These samples were likely redistributed as part of a historically free/open patch collection.
- But the exact legal status of each individual patch file should be treated as **not fully audited**.

## Sample Inventory

The Web Audio player uses the following rendered `.ogg` files:

| Local file | Derived from patch | MIDI role | Notes |
| --- | --- | --- | --- |
| [program_35_fretless_bass_f2.ogg](../soundtrack/samples/program_35_fretless_bass_f2.ogg) | `Tone_000/035_Fretless_Bass.pat` | Program 35 / Fretless Bass | Rendered local sample from TiMidity patch |
| [program_50_string_ensemble_g4.ogg](../soundtrack/samples/program_50_string_ensemble_g4.ogg) | `Tone_000/048_String_Ensemble_1_Marcato.pat` | Program 50 substitute / Synth Strings 1 | Used as Sound Blaster-style stand-in |
| [program_99_goblins_unicorn_c4.ogg](../soundtrack/samples/program_99_goblins_unicorn_c4.ogg) | `Tone_000/101_Goblins--Unicorn.pat` | Program 99 substitute / Atmosphere | Preferred late-90s sounding substitute |
| [drum_42_closed_hihat.ogg](../soundtrack/samples/drum_42_closed_hihat.ogg) | `Drum_000/042_Hi-Hat_Closed.pat` | Drum note 42 | Standard GM percussion hit |
| [drum_46_open_hihat.ogg](../soundtrack/samples/drum_46_open_hihat.ogg) | `Drum_000/046_Hi-Hat_Open.pat` | Drum note 46 | Standard GM percussion hit |
| [drum_49_crash_cymbal.ogg](../soundtrack/samples/drum_49_crash_cymbal.ogg) | `Drum_000/049_Cymbal_Crash_1.pat` | Drum note 49 | Standard GM percussion hit |
| [drum_51_ride_cymbal.ogg](../soundtrack/samples/drum_51_ride_cymbal.ogg) | `Drum_000/051_Cymbal_Ride_1.pat` | Drum note 51 | Standard GM percussion hit |
| [drum_54_tambourine.ogg](../soundtrack/samples/drum_54_tambourine.ogg) | `Drum_000/054_Tombourine.pat` | Drum note 54 | Spelling follows upstream patch name |
| [drum_69_cabasa.ogg](../soundtrack/samples/drum_69_cabasa.ogg) | `Drum_000/069_Cabasa.pat` | Drum note 69 | Standard GM percussion hit |

## Source Trail

### FreePats project
- About page: https://freepats.zenvoid.org/about.html
- License policy / caveats: https://freepats.zenvoid.org/unsuitable-licenses.html

### Package references showing the patch names
- NetBSD package page for `freepats-20060219`: https://cdn.netbsd.org/pub/pkgsrc/current/pkgsrc/audio/freepats/index.html
- Debian package file list for `freepats`: https://packages.debian.org/sid/all/freepats/filelist
- RPM package file list showing `Tone_000/048_String_Ensemble_1_Marcato.pat`: https://fr2.rpmfind.net/linux/RPM/mageia/cauldron/i686/media/core/release/timidity-patch-freepats-20060219-24.mga10.noarch.html

### TiMidity package reference
- Homebrew formula for `timidity`: https://formulae.brew.sh/formula/timidity

## Community And Ecosystem Signals

These do **not** resolve the legal question on their own, but they are useful indicators of how this patch set has been treated in practice:

- FreePats has long been distributed as a standalone package by major free-software ecosystems such as Debian, NetBSD, MacPorts, Mageia/OpenMandriva, and others.
- Community discussions around TiMidity and FreePats consistently describe the project as an open/free sample bank intended for reuse with MIDI playback and music creation.
- An old FreePats-related Freesound forum thread explicitly describes FreePats as a collection of "Open Source instrument samples" and discusses contributing legally reusable samples to it:
  - https://freesound.org/forum/sample-requests/2215/
- An old TiMidity mailing-list thread shows active discussion of improving and repackaging FreePats as a reusable open patch set, rather than treating it like a private or no-redistribution asset:
  - https://sourceforge.net/p/timidity/mailman/timidity-talk/thread/421C8781.9010508%40ling.lll.hawaii.edu/?page=1
- MacPorts currently lists `freepats` as version `20060219` under license `GPL-2+`:
  - https://ports.macports.org/port/freepats/summary/

## What Other People Seem To Run Into

From the ecosystem references and discussions, the practical pattern looks like this:

- People commonly **install**, **package**, and **redistribute** FreePats-compatible patch files as part of TiMidity-based systems.
- People do **not** seem especially worried about merely using the patches for MIDI playback.
- The real uncertainty shows up when someone wants to:
  - republish derived sample files on their own
  - rely on modern GitHub-style repository licensing expectations
  - make strong claims like "public domain", "no copyright", or "clearly MIT-like"

That matches the caution in FreePats' own documentation: the project aims to be free/open, but sound-sample provenance is a harder problem than ordinary source code licensing.

## Best-Practice Interpretation For This Repo

The rendered sample files in `soundtrack/samples/` should be treated as:

- derived from a historically free/open TiMidity-compatible patch set
- likely redistributable in practice within that ecosystem
- but still deserving of attribution and caution because the patch-level provenance is not fully audited

If this project is ever redistributed more formally, published commercially, or mirrored elsewhere, it would be wise to:

- preserve this note
- preserve links to the upstream patch ecosystem
- avoid claiming the rendered `.ogg` files are public domain
- perform a deeper upstream license audit if stronger legal certainty is needed

## Practical Conclusion For GitHub Pages

Based on what could be verified, I would describe the current situation like this:

- **Low practical risk, moderate legal ambiguity**

Reasons it looks low-risk in practice:

- the patch names align with a historically redistributed FreePats package
- multiple mainstream package ecosystems still ship that package publicly
- the project itself presents the bank as free/open and intended for reuse

Reasons it is still not perfectly clean:

- the specific per-patch copyright notices and authorship trail were not fully recovered
- FreePats' own modern policy pages show that sound-sample licensing can be more complicated than software licensing
- the local `.ogg` files are derivative renders, not the original upstream `.pat` files

If this repository is a personal restoration/archive on GitHub Pages, keeping the sample bank with this attribution and caveat note is probably a reasonable choice.

If this repository were part of a commercial product, formal publication pipeline, or legal-compliance-sensitive organization, a stricter path would still be advisable.

## Continue Exploring

- [Back to the main project overview](../README.md)
- [Shoomi's Soundtrack](SHOOMI_SOUNDTRACK.md)
- [Review the MIDI technical metadata](midi_metadata.md)
- [See the restored Java applet research](JAVA_APPLET_NOTES.md)
- [Read the Nightmare font provenance notes](NIGHTMARE_FONT_NOTES.md)
- [See the Cool Color Writer reconstruction notes](COOL_COLOR_WRITER_NOTES.md)
