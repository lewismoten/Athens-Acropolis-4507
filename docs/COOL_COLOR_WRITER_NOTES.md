# Cool Color Writer Notes

## Why This File Exists

This repository includes the old `clr_fnt.zip` package for my Visual Basic 4 tool, which I called `Color Writer / <FONT> Editor` and also referred to on the site as the `Cool Color Writer`.

Because this is now a public GitHub repository for a recovered and restored GeoCities site, I wanted a separate note describing what I can still recover about that program from the setup archive itself: dates, people, metadata, version information, and how it relates to the site.

![Cool Color Maker Button](../cool_color_maker_button.gif)

## What The Program Was For

The purpose of the program was very specific to how I was building pages in the late 90s:

- pick colors for text one letter at a time or as gradients
- convert those colors into HTML hex values
- generate old-school `<FONT COLOR=...>` markup for use in hand-authored pages

That workflow shows up all over this site. Many headings and decorative text runs are clearly composed of per-letter color tags, and the tool exists to make exactly that kind of HTML easier to produce.

The recovered EXE metadata describes it as:

- Product name: `Color Writer/<Font> Editor`
- File description: `Converts Color to hex and displays it in font commands to be used in HTML editing`
- Comment: `Good for Writing HTML Text`

## Files In The Original Setup Archive

The original distribution package in this repo is:

- [clr_fnt.zip](../clr_fnt.zip)

Its contents are:

- `colorwriter3.ex_`
- `ST4UNST.EX_`
- `setup132.ex_`
- `SETUP.LST`
- `setup.exe`
- `stkit432.dl_`

The ZIP timestamps show a packaging date of:

- `1997-03-22 13:28`

That is the strongest concrete date I have for the shipped setup package.

## What Was Recovered From The Binary

I extracted and reconstructed what I could from the installer payload into:

- [clr_fnt_reconstruction](../clr_fnt_reconstruction)

The most useful recovered metadata from the EXE is:

- Product name: `Color Writer/<Font> Editor`
- Internal name: `colorwriter3`
- Original filename: `colorwriter3.exe`
- Product version: `2.01.0002`
- File version: `2.01.0002`
- Company / authors field: `Lucas Moten & Lewis Moten`
- Comment: `Good for Writing HTML Text`
- File description: `Converts Color to hex and displays it in font commands to be used in HTML editing`

There are also several site-specific strings embedded in the binary:

- `<FONT> Editor`
- `Begin Editing`
- `Default`
- `Web Safe`
- `Letter:`
- `Letter #`
- `Total Letters:`
- `http://www.geocities.com/Athens/Acropolis/4507/`
- `shoomi@mindless.com`

Those strings were tied directly to my own page, my own HTML workflow, and my own online identity at the time.

## What It Suggests About Who Built It

The EXE's author/company field says:

- `Lucas Moten & Lewis Moten`

Based on that, plus my own memory, my best reading is:

- I, Lewis Moten, was the primary author
- Lucas Moten assisted and contributed
- the program was a shared sibling project, but probably not an equal split in implementation

I cannot prove authorship percentages from the binary alone, but the metadata absolutely supports the idea that both of our names were intentionally attached to the tool.

## Personal Timeline Context

This date and authorship information fits an important period in my life.

Before moving to Alexandria, Virginia, I was working a night job catching chickens. During the day, I would program, and I connected to the internet through BBS access and the limited online paths available to me at the time.

My brother invited me to come live with him in part because it would open up better job opportunities, and in part because it meant access to a cable modem connection, which was a meaningful upgrade over what I had before.

I moved from Moorefield, West Virginia to live with my brother and his wife on:

- `May 28, 1997`

That was my birthday, and it helps explain why my brother was involved in the project and why the program carries both of our names.

My memory of that period is that:

- we had computer desks set up back-to-back in a small dining area
- the desks faced the walls
- we were both programming in our free time

That context matters because it makes the collaboration feel very concrete. This was not some distant or purely commercial project. It was a home-built utility from a very specific moment when we were physically sharing space, both immersed in computers, and building things side by side.

It also sits in a very transitional career period for me. After moving to Alexandria, I first worked:

- at Burger King as a cashier
- then at Ruby Tuesday as a prep cook
- and only after that did I get my first IT job at `GMSI`

That timeline matters because `Cool Color Writer` belongs to the stretch when programming was still something I was pushing hard on from personal drive, long before it had stabilized into a formal IT career.

One nuance is worth noting:

- the packaged setup archive is dated `March 22, 1997`
- my move to live with my brother was `May 28, 1997`

So the current evidence suggests one of two things:

1. the shared authorship and collaboration had already started before that move, or
2. the March 1997 package represents one release in a tool that kept evolving during the period when we were living and programming together

I cannot prove which of those is more accurate from the archive alone, but the second possibility feels especially plausible given the version number `2.01.0002` and the clear signs that the project was already iterative.

## Development Stage And Tone

The recovered legal/copyright field contains a very revealing string:

- `Freeware (GNU pending distribution of code.  IF YOU SEE THIS MESSAGE, THEN YOU GOT AN EARLY ALPHA! )`

That tells me a few things:

- I was thinking about software distribution, not just private use
- I was at least aware of the GNU/open-distribution world, even if the licensing plan was still loose
- the build I packaged still carried an early-alpha style internal message

That matches the tone of the original `goodies.html` page, where I described the tool as something I had been working on with my brother, said it was in beta, and said I hoped to release it publicly when it was finished.

In other words:

- the program was real
- it was already functional enough to package
- but it was still evolving and not yet presented as fully finished

## Visual Basic 4 Evidence

The binary and installer clearly point to a Visual Basic 4-era Windows application.

Recovered indicators include:

- `VB40032.DLL`
- `setup132.exe`
- `stkit432.dll`
- `Project1`
- `TYPELIB`
- `_IID_FORM1`

The setup package structure is also very typical of mid-90s VB deployment.

## Recovered UI Clues

Even without the original source code, the compiled EXE preserves a lot of interface hints.

Likely control names include:

- `TextLetter`
- `TextLetterNumber`
- `TextLetterTotal`
- `Palette`
- `PaletteChoice`
- `StartButton`
- `Command6`
- `Command7`

Recovered captions and labels include:

- `<FONT> Editor`
- `Begin Editing`
- `Default`
- `Web Safe`
- `Letter:`
- `Letter #`
- `Total Letters:`

Those line up closely with:

- the old screenshot [colorfont_preview.gif](../colorfont_preview.gif)
- the restored browser version in [colorwriter.html](../colorwriter.html) and [colorwriter.js](../colorwriter.js)

## Relationship To The Restored HTML Version

The modern browser recreation is:

- [colorwriter.html](../colorwriter.html)
- [colorwriter.js](../colorwriter.js)

That restored version is not the original VB source code. It is a browser-based recreation built from:

- the installer metadata
- recovered strings
- the old screenshot
- the behavior of the surrounding site
- my best reconstruction of how the tool was used

So I think of the restored HTML app as:

- a compatibility remake
- a preservation project
- a way to let people experience the same workflow without needing Windows 95-era VB software

## What I Could Not Recover

I was able to recover structure, names, strings, and version metadata, but not the actual VB event-handler source code.

At the moment, I cannot find the original source code for this program.

Part of that is simply the passage of time, but part of it is also the result of repeated data loss over the years:

- one or more NAS devices suffered catastrophic failure
- at another point, my computer was stolen
- many old floppy disks have become unreadable

So a lot of material from that period has not been intentionally discarded so much as gradually lost to hardware failure, theft, media decay, and time. Many files from the past have simply faded away into the void.

So what I do **not** have is:

- the original `.vbp` project
- the original `.frm` and `.frx` files
- literal source for button handlers and palette logic
- a full changelog or development history

The files in [clr_fnt_reconstruction](../clr_fnt_reconstruction) are therefore:

- valuable evidence
- useful reconstruction material
- not authoritative source code

## Best Historical Reading

My best reading of `Cool Color Writer` is:

- it was a home-built Visual Basic 4 tool made specifically to support my HTML authoring style
- it was already packaged for distribution by `March 22, 1997`
- it carried both my name and my brother's name in its version metadata
- it belonged to the same creative workflow that produced the per-letter gradient text across the site
- it was written before I had a job in IT, during a period when my programming life was still very self-driven, experimental, and rooted in long days of personal coding around non-technical work

That last point matters to me. This tool was not a work assignment or a resume bullet first. It was me building something because the web page I wanted demanded a tool that did not already exist for me.

## Sources

- Original package:
  - [clr_fnt.zip](../clr_fnt.zip)
- Reconstruction folder:
  - [clr_fnt_reconstruction/README.md](../clr_fnt_reconstruction/README.md)
  - [clr_fnt_reconstruction/Project1.vbp](../clr_fnt_reconstruction/Project1.vbp)
  - [clr_fnt_reconstruction/colorwriter.frm](../clr_fnt_reconstruction/colorwriter.frm)
  - [clr_fnt_reconstruction/raw/colorwriter3.strings.txt](../clr_fnt_reconstruction/raw/colorwriter3.strings.txt)
  - [clr_fnt_reconstruction/raw/colorwriter3.rsrc.txt](../clr_fnt_reconstruction/raw/colorwriter3.rsrc.txt)
- Original site page referencing the tool:
  - [goodies.html](../goodies.html)

## Continue Exploring

- [Back to the main project overview](../README.md)
- [Shoomi's Soundtrack](SHOOMI_SOUNDTRACK.md)
- [Review the MIDI technical metadata](midi_metadata.md)
- [Check the soundtrack licensing and sample-bank caveats](SOUNDTRACK_LICENSE_NOTES.md)
- [See the restored Java applet research](JAVA_APPLET_NOTES.md)
- [Read the Nightmare font provenance notes](NIGHTMARE_FONT_NOTES.md)
