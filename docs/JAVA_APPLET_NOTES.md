# Java Applet Notes

## Why This File Exists

This repository is primarily a recovered and restored copy of an old GeoCities site. One part of that site used a Java applet for the animated title banner. Modern browsers no longer run Java applets, so I recreated the visible behavior in JavaScript for compatibility, but I have kept the original `.class` files here as historical artifacts.

Because this is a public GitHub repository, I wanted to document what these files appear to be, how they were used on the site, and what I could and could not recover about authorship and licensing.

## What Is In The Repository

The original applet-related files in this repo are:

- [jsTextAnimation_Nami.class](../jsTextAnimation_Nami.class)
- [jsTA_BGAction.class](../jsTA_BGAction.class)
- [jsTA_ImageReder.class](../jsTA_ImageReder.class)
- [jsTA_MsgParser.class](../jsTA_MsgParser.class)
- [jsTA_MsgReder.class](../jsTA_MsgReder.class)
- [title_old.html](../title_old.html)
- [dreamers.txt](../dreamers.txt)

The applet entry point used by the old page is:

- `jsTextAnimation_Nami.class`

The other four class files appear to be helper classes used by that applet.

## How The Original Site Used It

The old banner page in [title_old.html](../title_old.html) loaded the applet like this:

- `<applet code="jsTextAnimation_Nami.class" width=500 height=78>`

It passed a number of parameters into the applet, including:

- `Message`
- `MessageFile`
- `Colors`
- `DefalutColor`
- `BackColor`
- `BackGroundDotColor`
- `BackGroundAction`
- `BackGroundDotNum`
- `BackGroundSpeed`
- `DisplayTime`
- `Speed`
- `NamiHeight`
- `FontName`
- `FontSize`
- `FontStyle`

That parameter surface lines up closely with what the restored HTML version now emulates in [title.js](../title.js): wavey message motion, per-character color lists, background dots, and scripted text loaded from [dreamers.txt](../dreamers.txt).

## Parameter Reference

This section is based on:

- the actual values used in [title_old.html](../title_old.html)
- strings recovered from the compiled classes
- mirrored `Nami` readme/example pages that still survive in fragments online

I do not have the original source code or a full official manual, so these should be read as best-effort restoration notes rather than authoritative vendor documentation.

### Core Parameters Used On This Site

| Parameter | Likely type | Example from this site | Best estimate of what it does |
| --- | --- | --- | --- |
| `Copyright` | string | `Jin Sato (http://www.magi.com/~jinsato)` | Attribution string expected by the applet author. |
| `FontName` | string | `TimesRoman` | Font family used to draw the message text. |
| `FontSize` | integer | `29` | Text size in points/pixels according to the applet's rendering logic. |
| `FontStyle` | integer | `2` | Likely Java `Font` style numeric value; `2` strongly suggests italic. |
| `Message` | string | `shoomi's home page` | Initial text shown before or alongside scripted message loading. |
| `MessageFile` | string / path | `dreamers.txt` | External message script file loaded by the applet. |
| `DefalutColor` | hex color string | `ffaa00` | Fallback/default text color. The misspelling appears to be part of the applet API. |
| `Colors` | pipe-delimited hex color list | `0000ff|0000ee|...` | Per-character color sequence used for the current message. |
| `BackColor` | hex color string | `000033` | Banner background color. |
| `BackGroundDotColor` | hex color string | `9999ff` | Color of the background particle/dot effect. |
| `BackGroundAction` | integer | `3` | Selects the background animation mode. |
| `BackGroundDotNum` | integer | `50` | Number of background particles/dots. |
| `BackGroundSpeed` | integer | `3` | Speed for the background particle effect. |
| `DisplayTime` | integer | `100` | How long a message remains on screen before transitioning away. |
| `Speed` | integer | `20` | General animation speed / timing control. |
| `NamiHeight` | integer | `8` | Amplitude of the wave effect applied to the text. |

### Additional Parameters The Applet Appears To Support

These do not all appear in my local page, but they show up in class strings or in mirrored usage examples for `jsTextAnimation_Nami`:

| Parameter | Likely type | Best estimate |
| --- | --- | --- |
| `ImageFiles` | pipe-delimited string list | Additional images the message system can reference. |
| `BackGroundImage` | string / path | Background image asset loaded by the applet. |
| `BackGroundActionSpeed` | integer | A more explicit speed value for certain background effects. |
| `DrawImageType` or similar image-placement parameter | string / enum-like text | Verified in embedded class strings: `IMAGE_TILE`, `IMAGE_CENTER_CENTER`, `IMAGE_LEFT_TOP`, `IMAGE_CENTER_TOP`, `IMAGE_RIGHT_TOP`, `IMAGE_LEFT_CENTER`, `IMAGE_RIGHT_CENTER`, `IMAGE_LEFT_BOTTOM`, `IMAGE_CENTER_BOTTOM`, `IMAGE_RIGHT_BOTTOM`, `IMAGE_FIT`, `IMAGE_XY`, and `IMAGE_XYXLYL`. My current best reading is that `IMAGE_XY` is coordinate-based placement, and `IMAGE_XYXLYL` is coordinate-based placement with explicit X/Y length sizing. The exact parameter name still is not confirmed from my old HTML, but the applet clearly supports a richer image-placement enum set internally. |

### Notes From How I Used It

Based on how the page was configured and what the restored behavior looks like now, my best reading is:

- `MessageFile` was the real driver for the sequence of animated phrases.
- `Message` was probably just the first/default phrase shown before the file-based sequence took over.
- `Colors` was likely meant to apply to the current message only, character by character.
- `DefalutColor` was probably used whenever the message data did not provide enough explicit color values.
- `BackGroundAction=3` with `BackGroundDotNum=50` and `BackGroundSpeed=3` appears to be the starry field effect I remember from the page.
- `NamiHeight=8` is consistent with the visible vertical wave motion in the letters.

### What `ImageFiles` Appears To Do

From embedded strings and bytecode structure in `jsTextAnimation_Nami.class`, `jsTA_MsgParser.class`, and `jsTA_ImageReder.class`, my current best reading is:

- `ImageFiles` is read as an applet parameter by the main applet
- it is passed into `jsTA_ImageReder`
- `jsTA_ImageReder` tokenizes that value into an internal image list / array
- `jsTA_MsgParser` supports inline image references inside message text
- the parser can ask the image reader for both:
  - `getImage(imageId)`
  - `getImageWidth(imageId)`

That makes the feature look like inline image embedding within a text message, not just a background-image system.

#### Most Likely `ImageFiles` Format

The strongest evidence still points to a pipe-delimited list:

- `ImageFiles="star.gif|heart.gif|moon.gif"`

Reasons:

- the image-reader class uses `StringTokenizer`
- the recovered strings include a standalone `|`
- the applet already uses pipe-delimited values elsewhere

#### Most Likely Inline Image Syntax

The parser bytecode strongly suggests that:

- `$<digits>` inserts an image by numeric index from `ImageFiles`
- `$$` escapes to a literal dollar sign

Examples of the most likely message syntax:

- `Welcome $0 Home`
- `Stars: $1 $2 $3`
- `Cost is $$5`

I have much higher confidence in the `$<digits>` behavior than I do in the exact human-facing documentation the original applet may have used.

### What `BackGroundAction` Probably Means

This is one of the more interesting parameters because the class strings give a few direct clues:

- `NO_ACTION`
- `ACTION_AME`
- `ACTION_HOSHI`
- `ACTION_YUKI`
- `ACTION_MAX`
- `DrawBackGround_Ame`
- `DrawBackGround_Hoshi`
- `DrawBackGround_Yiki`

I think those are almost certainly background mode names.

The Japanese words appear to be:

- `Hoshi` = stars
- `Ame` = rain
- `Yuki` = snow

One class string shows `Yiki`, but since another shows `ACTION_YUKI`, I think `Yiki` is just a typo or corruption in the recovered string rather than a different effect name.

What I can say with reasonable confidence:

- `BackGroundAction` is probably a numeric mode selector.
- One mode means "no background animation".
- Three named animated modes appear to exist: stars, rain, and snow.

What I cannot prove from the recovered files alone:

- the exact numeric mapping of each mode
- whether the values were `1/2/3`, `0/1/2/3`, or something slightly different

My best estimate, based on how I used it on this site:

- `BackGroundAction=3` was most likely the star mode, because this page clearly showed a starry/dot background rather than rain or snow.

So while I cannot fully decode the enum from the bytecode I have, I think it is fair to describe `BackGroundAction` as:

- a numeric selector for none / rain / stars / snow

with `3` being the most likely value for the starfield on this particular page.

### Parameter Quirks In My Old HTML

A few details in [title_old.html](../title_old.html) look like ordinary late-90s copy/paste or experimentation rather than clean final API usage:

- `FontSize` appears twice, with `39` and then `29`
- `NamiHeight` appears twice, both as `8`
- `DefalutColor` is misspelled, but that seems to be the actual parameter name expected by the applet

My assumption is that the later duplicate values were the ones that effectively mattered in practice.

## How `dreamers.txt` Appears To Work

The message script file used by the applet is [dreamers.txt](../dreamers.txt). Based on its structure, my best reading is that it is a small custom message format used by `jsTextAnimation_Nami`.

### File Structure

The file begins with:

- line 1: `7`

I originally suspected this might be a message count, but based on my own recollection of how the banner behaved, it is more likely a timing value, probably meaning:

- wait `7` seconds before starting or advancing the scripted text

That interpretation fits the file better, because the rest of the content is clearly organized as message-related data rather than a simple counted list.

After that, the file appears to be organized in repeating groups of three lines:

1. a motion/action line
2. a text line
3. a color-definition line

For example:

- `>>,>>`
- `The beginning of all dreams`
- `880000|990000|aa0000|...`

That pattern repeats through the file.

### Special Case At The Top

The first three lines are a little different:

- `7`
- `Shoomi's HomePage`
- `0000ff|0000ee|0000dd|...`

There is no action line directly attached to that first message in the file itself. My guess is that the applet treats the initial `Message` parameter from [title_old.html](../title_old.html) as the first/default item, and the message file then supplies either:

- the initial delay plus the first default message/color
- or the count followed by a slightly special first record

In the JavaScript restoration, I handled that first message separately for that reason.

### Motion / Action Line

The motion lines look like this:

- `>>,>>`
- `<<,<<`
- `^^,<>`
- `VV,<>`
- `<<,>>`

My best guess is that the two values mean:

- first value = how the text enters
- second value = how the text exits

And from how the old banner behaved, I think the symbols most likely mean:

- `<<`
  - enter from the right when used as the first value
  - leave toward the left when used as the second value
- `>>`
  - enter from the left when used as the first value
  - leave toward the right when used as the second value
- `^^`
  - rise upward / come in from below toward the center
- `VV`
  - descend / come in from above or move downward, depending on whether it is used as entry or exit
- `<>`
  - split outward from the middle, so the characters drift apart toward left and right

That last one is the least certain, but it would fit both the symbol itself and the kinds of theatrical text motions applets of that era liked to use.

### Text Line

The second line in each group is simply the message text to be displayed, for example:

- `Located in GeoCities`
- `/Athens/Acropolis/4507/`
- `sweet dreams!`

### Color Line

The third line in each group appears to be a pipe-delimited list of per-character colors:

- `0000ff|0000ee|0000dd|...`

My reading is:

- each entry is a 6-digit RGB hex value
- the values are applied character-by-character across the message
- if there are fewer colors than characters, the applet probably either loops or falls back to `DefalutColor`

The color choices themselves look very much like web-safe era gradients:

- repeated doubled hex digits such as `88`, `99`, `aa`, `bb`, `cc`, `dd`, `ee`, `ff`
- simple single-channel ramps like red-only, green-only, or blue-only sequences
- mirrored gradients that brighten toward the center and then darken again

That strongly suggests I was working in the old web-safe color mindset when I built these lines.

### Connection To The Color Writer Tool

Looking at [dreamers.txt](../dreamers.txt), I think it is very likely that this style of per-letter color definition is part of what pushed me toward building the Color Writer / `<FONT>` Editor later.

Why I think that:

- the applet clearly wanted letter-by-letter color control
- the values look hand-authored or at least hand-shaped as gradients
- the site itself uses lots of per-letter color styling in HTML
- the color ramps look like the same kind of web-safe stepped transitions I later wanted for `<FONT COLOR=...>` tags

So while I cannot prove the causal chain, I think it is fair to say that `dreamers.txt` looks like exactly the kind of tedious color-by-color work that would inspire a custom gradient text tool.

## What I Believe Each Class Does

I do not have the original Java source code, so this section is based on:

- the way the applet is configured in [title_old.html](../title_old.html)
- class names
- embedded strings recovered from the compiled `.class` files

### `jsTextAnimation_Nami.class`

This appears to be the main applet controller.

Reasons:

- it is the class named in the `<applet>` tag
- it likely reads the applet parameters and drives the animation
- `Nami` likely refers to the wave motion effect

### `jsTA_MsgParser.class`

This appears to parse the message text and command syntax.

Useful embedded strings include:

- `setMessage`
- `getImageID`
- `isImage`
- `countToken=`
- `')' is messing.`
- references to `FontMetrics`

My best guess is that this class interprets text commands and possibly supports inline image or token handling.

### `jsTA_MsgReder.class`

This appears to be message-rendering related.

The class name looks like a misspelling of "Reader" or "Renderer", but in context it seems to be part of the text layout/drawing path.

### `jsTA_ImageReder.class`

This appears to load and track images used by the applet.

Useful embedded strings include:

- `MediaTracker`
- `startImageRead`
- `getNumOfImage`
- `getImageWidth`
- `m_ImageArray`

Again, the class name seems misspelled, but it looks image-related rather than message-related.

### `jsTA_BGAction.class`

This appears to control the background animation effects.

Useful embedded strings include:

- `BackGroundAction`
- `BackGroundDotNum`
- `BackGroundSpeed`
- `BackGroundDotColor`
- `DrawBackGround_Hoshi`
- `DrawBackGround_Ame`
- `DrawBackGround_Yiki`
- `ACTION_HOSHI`
- `ACTION_AME`
- `ACTION_YUKI`

Those names suggest a few built-in background modes, likely something like:

- stars (`Hoshi`)
- rain (`Ame`)
- snow (`Yuki`, though one string appears misspelled as `Yiki`)

For this site, the configuration in [title_old.html](../title_old.html) points to the starry background effect, so `BackGroundAction=3` is most likely the `Hoshi` mode, although I cannot prove the full numeric mapping from the recovered classes alone.

## Age / Technical Context

All five class files identify as:

- compiled Java class data, version `45.3`

That corresponds to the very early Java 1.1 era, which fits the late-90s origin of this site.

I also found references to:

- `jsTextAnimation_Sub.java`

That suggests these classes may originally have been built from a shared Java source file or source bundle with that name.

## Likely Author Attribution

The strongest attribution I found is not inside the bytecode itself, but in [title_old.html](../title_old.html), which contains:

- `Copyright = "Jin Sato (http://www.magi.com/~jinsato)"`

So my best current understanding is:

- likely author: `Jin Sato`
- likely website at the time: `http://www.magi.com/~jinsato`

I have not found another author string in the compiled class files that contradicts this.

## What I Could Find About The Likely Author

I was not able to recover the original `magi.com/~jinsato` page directly, but a few surviving web traces point in a consistent direction.

### Strongest direct clue

The old HTML itself credits:

- `Jin Sato (http://www.magi.com/~jinsato)`

### Surviving mirrored references

Older mirrored applet/example pages still identify `jsTextAnimation_Nami` and `jsBiorhythm` as Jin Sato applets and preserve the same `magi.com/~jinsato` attribution:

- a mirrored `jsBiorhythm` example page attributes the applet to `Jin Sato` and preserves the same copyright line, with a page date of `15/June/97`
- mirrored `Nami` readme/example pages preserve:
  - the same applet class names
  - the same parameter style
  - the same `magi.com/~jinsato` attribution
  - a product/company name: `MI-RA-I Technology`
  - an additional contact name: `Masae Sato`
  - email addresses using `@magi.com`

In addition, an archived snapshot of one of Jin Sato's pages survives on the Wayback Machine:

- https://web.archive.org/web/19981206150326/http://www.mi-ra-i.com/JinSato/

I was also able to inspect a saved archive copy of:

- `http://www.mi-ra-i.com/JinSato/Java/Numon/index.html`

That archived material strengthens the picture quite a bit.

What it appears to confirm:

- `Jin Sato`
- `MI-RA-I Technology`
- Java applets / developer tools / educational Java content / hobby-technical web content
- later LEGO MindStorms / robotics-related material under the same site structure

What the archived Java page adds:

- the site was serving a Japanese-language "Java introduction" section
- it links back to the older `magi.com/~jinsato` homepage as a previous location
- it describes the material as older Java content being republished after a homepage move
- one saved HTML file includes a direct source comment:
  - `COPYRIGHT 1997 Jin Sato`
- it includes a visible footer:
  - `All Writing Copyright (c) 1995,96,97 Jin Sato All right reserved.`
  - `Last updated: Friday, 03-Oct-1997 00:43:55 EDT`

That does not directly prove the license of the applet class files themselves, but it does make the site history feel much more concrete:

- Jin Sato clearly maintained Japanese-language Java instructional material
- the `magi.com/~jinsato` page appears to have been an earlier home for that material
- the `mi-ra-i.com/JinSato/` site appears to have been a later home for it

### Where this applet seems to sit in his timeline

Based on the archived material and the additional homepage evidence I reviewed while restoring this site, my understanding is:

- Jin Sato described this as his first applet
- he also framed himself as being new to Java at the time, in the same way many people were in that era

That matches the rest of the evidence very well.

Why it fits:

- the archived material reads like someone building and teaching basic Java concepts while still close to the learning process
- `StringTokenizer` is exactly the kind of tool I would expect to see behind something like `jsTA_MsgParser`
- the applet itself is small, parameter-driven, and practical in a way that feels like early hands-on applet work
- the 1997 copyright/date clues line up well with the Java 1.1-era bytecode version in the class files

So at this point I think it is fair to say more directly:

- `jsTextAnimation_Nami` appears to come from Jin Sato's early Java-learning period
- according to his own homepage, it was his first applet
- that helps explain both the straightforward structure of the code and the experimental, learn-by-building quality of the applet

### Best estimate about background / location

This part is more interpretive, but I think it is reasonable:

- The name `Jin Sato` is Japanese.
- The mirrored `Nami` readme material appears to be written in Japanese.
- The class strings include Japanese words transliterated into romaji such as:
  - `Hoshi`
  - `Ame`
  - `Yuki`
- A surviving Japanese link page snippet describes `Jin Sato` as a homepage owner connected to Java applets and says he had settled in Canada for software-development-related work.

So my best estimate is:

- the likely author was Japanese
- they either lived in Japan originally or were strongly connected to Japanese-language developer circles
- they may have been living in Canada by the time some of these applets were being distributed

I cannot prove the full biography from the evidence I have, so I do not want to overstate it beyond that.

### Sources consulted for those clues

- NetVet listing referencing `Jin Sato Original Java Applet Collection`:
  https://netvet.wustl.edu/html.htm
- mirrored `jsBiorhythm` example preserving the same attribution:
  https://scomp.tripod.com/jbioryth.html
- mirrored `Nami` readme/example pages preserving the class names and attribution:
  https://gsmsg.tripod.com/Nami_ReadMe.html
  https://potosilake.tripod.com/scripts/namitext/Nami_ReadMe.html
- archived `mi-ra-i.com/JinSato` page:
  https://web.archive.org/web/19981206150326/http://www.mi-ra-i.com/JinSato/
- archived `Java/Numon` page under the same site:
  https://web.archive.org/web/20000416115346fw_/http://www.mi-ra-i.com/JinSato/Java/Numon/index.html
- Japanese link page snippet referencing Jin Sato's homepage and Canada:
  https://hayakawa.ddo.jp/link/link_tool.html
  - http://www.mi-ra-i.com/JinSato/

## Licensing Status

This is the part I cannot state confidently.

What I **have not** recovered:

- an original `.java` source distribution
- a copyright year
- a formal license notice
- a still-live original distribution page that clearly states reuse terms

So for public-repository purposes, I am treating these Java class files as:

- historically preserved third-party code
- likely authored by `Jin Sato`
- included here for archival and restoration context
- **license unknown**

I am not claiming authorship of these applet class files, and I am not treating them as if they were clearly open source.

## Why The JavaScript Version Exists

The modern [title.js](../title.js) version exists because current browsers do not support Java applets anymore. The goal of the JavaScript recreation was to preserve:

- the animated message flow
- the color styling
- the starry background feel
- the general mood of the original title frame

while still keeping the original applet files in the repository as part of the historical record.

## Practical Summary

From my perspective as the maintainer of a restored GeoCities page:

- these `.class` files are part of the original site history
- they appear to come from a late-90s Java 1.1 text-animation applet
- the strongest author attribution points to **Jin Sato**
- the exact license is still unknown
- the repository keeps them for preservation, while the site itself now uses a browser-compatible JavaScript replacement

If stronger attribution or licensing evidence turns up later, this note should be updated.

## Usages Found
* [Eduardo Funabashi](https://hk.oocities.org/siliconvalley/sector/2715/): Java Applets
  * [Banner 10](https://hk.oocities.org/siliconvalley/sector/2715/java/banner10.html)
  * [Banner 15](https://hk.oocities.org/siliconvalley/sector/2715/java/banner15.html)
* Gigi Livorno [JS Text](https://digilander.libero.it/gigilivorno/html/javajstext.htm)

## Continue Exploring

- [Back to the main project overview](../README.md)
- [Shoomi's Soundtrack](SHOOMI_SOUNDTRACK.md)
- [Review the MIDI technical metadata](midi_metadata.md)
- [Check the soundtrack licensing and sample-bank caveats](SOUNDTRACK_LICENSE_NOTES.md)
- [Read the Nightmare font provenance notes](NIGHTMARE_FONT_NOTES.md)
- [See the Cool Color Writer reconstruction notes](COOL_COLOR_WRITER_NOTES.md)
