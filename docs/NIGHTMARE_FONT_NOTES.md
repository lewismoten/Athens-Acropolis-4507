# Nightmare Font Notes

## Why This File Exists

This repository includes the old `nitemare.TTF` font because it was part of the original look of the site. I restored it for modern browsers through `@font-face`, but since this is a public GitHub repository, I wanted a separate note describing what I could actually recover about the font itself: internal metadata, likely dates, authorship clues, licensing clues, and the limits of what I can prove.

The two local copies:

- [nitemare.TTF](../nitemare.TTF)
- [nitemare 2.TTF](../nitemare%202.TTF)

are byte-for-byte identical, and [nitemare.zip](../nitemare.zip) contains just one file:

- `nitemare.TTF`

## How The Site Uses It

The site uses this typeface under the family name:

- `Burton's Nightmare`

In the restoration, that family is loaded from [font.css](../font.css) so the menu headings and page titles render again without requiring visitors to install the font locally.

## How The Original Site Presented The Font

The original site did not assume every visitor already had the font installed. It explicitly pointed people to a downloadable copy and told them why they might want it.

On [goodies.html](../goodies.html), the page says:

- `If you have windows and a browser that supports all your windows fonts, then you may want to check out this true type font. I use this font on many of my pages.`

It then presents the font as:

- `Font Set: Burton's Nightmare`
- `File Name: nitemare.ttf`
- `Download file name: nitemare.zip`
- `Download size: 16,728 bytes`

So the original experience appears to have been:

- visitors were shown a specimen image of the typeface in use
- specifically, the page used [abc_burtons_nightmare.gif](../abc_burtons_nightmare.gif) as an `AaBbCc`-style preview
- if they wanted the page to look right on their own machine, they were invited to download and install the font manually
- the site treated the font as part of the page's atmosphere, but still in a very 90s "optional enhancement" way rather than something automatically embedded by the browser

## Internal Metadata Recovered From The Font

These values came from the font's `name`, `OS/2`, `head`, `maxp`, and `cmap` tables.

### Name table

- Family: `Burton's Nightmare`
- Subfamily: `Regular`
- Full name: `Burton's Nightmare`
- PostScript name: `Burton'sNightmare`
- Copyright string:
  - `From the Tim Burton film`

### Technical structure

- Format: `TrueType`
- Glyph count: `92`
- Mapped character count: `89`
- Unicode coverage in practice:
  - basic Latin letters
  - digits
  - a limited punctuation set
  - a few Latin-1 accented characters such as `Ä`, `Ë`, `Ö`, `ß`, `ä`, `ë`, `ö`
- `unitsPerEm`: `1200`
- Vendor ID (`achVendID`): `Alts`
- Font revision: `1.0`

### Dates found inside the font

The internal `head` table reports:

- Created: `Sat Oct 16 10:06:42 1993`
- Modified: `Sat Oct 16 10:06:42 1993`

However, the local ZIP archive has a file timestamp of:

- `1996-04-30 19:21`

My best reading is:

- `1993` is the font's own embedded timestamp
- `1996` is the date of the packaged copy that ended up in this archive

That fits well with the font's obvious reference to *The Nightmare Before Christmas*, which came out in `1993`.

## What I Can And Cannot Infer From The Metadata

### What seems reasonably solid

- The intended public-facing family name was `Burton's Nightmare`.
- The font was explicitly themed around a Tim Burton-related film.
- The font was already in circulation in the mid-90s.
- The local copy I have is very small and consistent with early web-era decorative TTF sharing.
- The `~` glyph appears to embed a stylized copyright / signature mark and year:
  - visually, it can be read as `SFL © 1993`
  - the year is clear even though OCR struggled with the stylized letters

### What is not solid

- The font file does **not** name an author or company in a trustworthy way.
- The vendor ID `Alts` is present, but it now looks much more like a tooling clue than an authorship clue.
- The copyright string is descriptive rather than legally useful. It references "the Tim Burton film" but does not name the designer, a copyright year, or a license.

## Authorship

I could not recover a definitive author name from the local file.

What I found on the public web is inconsistent:

- some font mirror sites label the designer as `unknown`
- some label it as `010Bus`
- some label it as `Mitron Cre`

Because those are third-party mirrors and they disagree with one another, I do **not** think any of those names should be treated as confirmed authorship from the evidence I have right now.

My current best conclusion is:

- author: unknown
- public family name: `Burton's Nightmare`
- file name most commonly seen: `NITEMARE.TTF`

## What `Alts` Probably Means

At first glance, the vendor ID:

- `Alts`

looks like it might identify a foundry. After digging further, I do not think that is the best reading.

The stronger explanation is:

- `Alts` refers to `Altsys`, the company behind the Fontographer font editor
- many old TrueType fonts created or exported with Fontographer carry `Alts` in the vendor field and `Altsys Fontographer ...` in other metadata

That means `Alts` is probably telling us more about the software used to build or export the font than about who designed the letterforms.

So if the question is "what other fonts did Alts make at the time?", my best answer is:

- Altsys made font-editing software, especially Fontographer, rather than serving primarily as the artistic foundry behind decorative fonts like this one
- many unrelated 1990s fonts show `Alts` because they were produced with that toolchain
- the more promising authorship clue in this case is `SFL`, not `Alts`

## Licensing

I did not recover a reliable license notice from the local files.

Important local facts:

- [nitemare.zip](../nitemare.zip) contains only the TTF, with no `README`, `LICENSE`, or author text file
- the font's internal metadata contains no EULA, website, or reuse terms

I also checked the old TrueType embedding flag field (`OS/2.fsType`). This file has an odd value that does **not** cleanly map to a modern explicit licensing statement. Microsoft's OpenType documentation says valid usage-permission values are `0`, `2`, `4`, or `8`, and that bit `0` is reserved. In other words, the embedding flag in this font is not a safe substitute for an actual license grant. Source:

- Microsoft OpenType `OS/2` table reference:
  - https://learn.microsoft.com/en-us/typography/opentype/spec/os2

So for public-repository purposes, my best honest summary is:

- license: unknown
- commercial use: unknown
- redistribution terms: unknown

I am comfortable documenting and preserving the file as part of an old web restoration, but I would not claim that it is clearly open-source or clearly free for unrestricted reuse.

## What I Found On The Internet

I found a long trail of font mirror pages, but they mostly repeat the same limited metadata already present in the file:

- family name: `Burton's Nightmare`
- file name: `NITEMARE.TTF`
- glyph count: `92`
- copyright string: `From the Tim Burton film`
- license: usually listed as `Unknown`

The most useful extra clues I found were:

- DaFont has hosted the font for a long time and says it was first seen there `before 2005`:
  - https://www.dafont.com/burtons-nightmare.font
- Luc Devroye's font pages describe it as a `free orphaned typeface` and connect it to `1993`, while still not giving a clearly trustworthy author attribution:
  - https://luc.devroye.org/fonts-102262.html
- mirror sites such as WFonts, FontPark, and Pickafont repeat the same internal metadata and generally mark the license as unknown or unclear:
  - https://www.wfonts.com/font/burtons-nightmare
  - https://fontpark.com/en/burton-s-nightmare.font
  - https://www.pickafont.com/fonts/Burton-S-Nightmare.html

I also found some community references where people casually treat it as "the Nightmare Before Christmas font" or a bootleg/tribute font derived from that visual association, but I would treat those as cultural clues rather than licensing evidence.

## Best Historical Reading

My best estimate is:

- this was an early decorative fan-style font inspired by *The Nightmare Before Christmas*
- it was likely circulating by the mid-90s
- it may have been created very close to the film's original release window
- it became one of those widely mirrored "orphaned" web fonts whose file survived much better than its documentation

That matches both the local timestamps and the way the font shows up online: easy to find, widely mirrored, but thin on trustworthy provenance.

## Embedded Mark Inside The `~` Glyph

One especially useful clue turned up when I inspected the `~` character (`U+007E`) closely.

Rendered large, that glyph is not just a tilde flourish. It includes:

- a large decorative letterform
- a small embedded signature / copyright-style symbol
- the year `1993`
- Visual inspection is strong enough that I am comfortable documenting the mark as:
  - `SFL © 1993`

That does **not** identify the author by name with certainty, but it does reinforce the likely `1993` origin window already suggested by the font's internal timestamp and its connection to *The Nightmare Before Christmas*.

It also gives one more clue about authorship or foundry initials:

- `SFL`

I now have a stronger lead on what `SFL` probably meant.

The best-supported reading is:

- `SFL` = `Scriptorium Font Library`

Why I think that:

- another old decorative font, `Lindisfarne`, is mirrored online with the same `Copyright 1993 SFL` metadata
- MyFonts identifies `Lindisfarne` as a Scriptorium release and credits the design to `David Nalle`
- old shareware font listings also use product codes such as `SFL-1002`, `SFL-3001`, and similar numbers for sampler disks and themed font collections associated with Scriptorium Font Library

That does not absolutely prove that this exact `Burton's Nightmare` file was authored by David Nalle or by Scriptorium, but it does make `Scriptorium Font Library` the strongest explanation I have found so far for the `SFL` initials embedded in the font.

## Practical Public-Repo Position

For this repository, I am treating `nitemare.TTF` as:

- a historical asset used by the recovered site
- preserved to restore the original appearance
- third-party authorship unknown
- license unknown

I am not claiming authorship of the font, and I am not treating its presence in old font archives as proof that it is freely licensed for every use.

## Best Current Theory About `SFL`

After a more focused pass, my best current theory is:

- `SFL` most likely stands for `Scriptorium Font Library`
- `Scriptorium` was the decorative font foundry / library run by `David Nalle`
- the `SFL © 1993` mark inside the `~` glyph may be an abbreviated signature for that library

What supports that theory:

- `Lindisfarne` is tied to Scriptorium by MyFonts, which lists:
  - designer: `David Nalle`
  - publisher/foundry: `Scriptorium`
- the same `Lindisfarne` font is mirrored elsewhere with `Copyright 1993 SFL`
- old shareware references show `SFL-####` disk and sampler numbering that aligns naturally with `Scriptorium Font Library`
- additional MyFonts pages under Scriptorium show the same `Copyright SFL` or `SFL ©1993` pattern across a wider family of fonts

What still remains uncertain:

- I do not yet have a primary 1993-era Scriptorium catalog page that explicitly lists `Burton's Nightmare`
- the local `nitemare.TTF` file still does not name `David Nalle` or `Scriptorium` directly in its ordinary font metadata

So I would phrase the conclusion conservatively as:

- probable affiliation: `Scriptorium Font Library`
- probable associated designer/foundry circle: `David Nalle / Scriptorium`
- certainty level: moderate, not absolute

## Additional Scriptorium Pattern Evidence

While restoring this site, I found a broader pattern on MyFonts under Scriptorium that makes the `SFL` reading much more convincing.

Fonts showing the simpler `Copyright SFL` style include:

- `Columba`
- `Kathasa`
- `Rhesimol`
- `Talethior`

Fonts showing the more specific `SFL ©1993` style include:

- `Alt Gothic`
- `Bastarda`
- `Blazon`
- `Fabliaux`
- `Futhark`
- `Herald`
- `Jongeleur`
- `Jugend`
- `Minima`
- `Lindisfarne`
- `Magnus`
- `Mondial`
- `Ogham`
- `Pyle`
- `Saraphim`
- `Savoyard`
- `Simplus`
- `Tancred`
- `Ulalume`
- `Visage`

That is a much larger cluster than I had at first, and it strongly suggests that:

- `SFL` was an intentional recurring mark
- it belonged to the Scriptorium font family/ecosystem rather than being random decoration
- the `1993` date was reused on a whole group of related early Scriptorium fonts
- the mark was commonly tucked into the `~` character, which was rarely used in ordinary 90s web text and therefore served as a convenient hidden signature slot

That last point matters because it helps explain why the mark could exist across many fonts without being obvious in ordinary day-to-day use. In the 90s, the tilde character was much less common in normal text than it is now, so using `~` as a signature/copyright slot would have been a practical compromise:

- low visibility in normal writing
- but still easy to type from a standard keyboard if someone wanted to surface the mark to demonstrate authorship, legitimacy, or copyright use

## Note On `Goodfellow`

One especially interesting comparison is:

- `Goodfellow`

The letterforms there reportedly look very close to `Burton's Nightmare`, which may point to a family resemblance in David Nalle / Scriptorium design work. At the same time, it is important not to overread that similarity:

- `Goodfellow` does not appear to carry the same `1993` mark
- MyFonts lists it as debuting much later, on `March 28, 2002`

So I would treat `Goodfellow` as:

- a useful visual comparison
- suggestive of the same design sensibility
- not direct proof that `Burton's Nightmare` and `Goodfellow` are the same design or release

## Sources

- Local font metadata from:
  - [nitemare.TTF](../nitemare.TTF)
  - [nitemare.zip](../nitemare.zip)
- Microsoft OpenType `OS/2` reference:
  - https://learn.microsoft.com/en-us/typography/opentype/spec/os2
- DaFont entry:
  - https://www.dafont.com/burtons-nightmare.font
- Luc Devroye font index entry:
  - https://luc.devroye.org/fonts-102262.html
- WFonts mirror:
  - https://www.wfonts.com/font/burtons-nightmare
- FontPark mirror:
  - https://fontpark.com/en/burton-s-nightmare.font
- Pickafont mirror:
  - https://www.pickafont.com/fonts/Burton-S-Nightmare.html
- WFonts `Lindisfarne` mirror showing the same `Copyright 1993 SFL` string:
  - https://www.wfonts.com/font/lindisfarne
- FontPark `Lindisfarne` mirror showing the same `Copyright 1993 SFL` string:
  - https://fontpark.com/en/lindisfarne.font
- MyFonts `Lindisfarne` entry identifying Scriptorium and David Nalle:
  - https://www.myfonts.com/de/collections/lindisfarne-font-scriptorium
- MyFonts `Goodfellow` entry used as a later visual comparison:
  - https://www.myfonts.com/collections/goodfellow-font-scriptorium
- MyFonts Scriptorium collection pages observed during this research, which showed repeating `Copyright SFL` and `SFL ©1993` patterns across multiple fonts:
  - https://www.myfonts.com/de/collections/lindisfarne-font-scriptorium
- Luc Devroye entry for Scriptorium / David Fleming Nalle:
  - https://luc.devroye.org/fonts-23614.html
- Shareware-style SFL disk numbering example:
  - https://blogfonts.com/florimel.font

## Continue Exploring

- [Back to the main project overview](../README.md)
- [Shoomi's Soundtrack](SHOOMI_SOUNDTRACK.md)
- [Review the MIDI technical metadata](midi_metadata.md)
- [Check the soundtrack licensing and sample-bank caveats](SOUNDTRACK_LICENSE_NOTES.md)
- [See the restored Java applet research](JAVA_APPLET_NOTES.md)
- [See the Cool Color Writer reconstruction notes](COOL_COLOR_WRITER_NOTES.md)
