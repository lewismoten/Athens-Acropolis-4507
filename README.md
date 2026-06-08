# Athens-Acropolis-4507

![GeoCities Banner: Shoomi - The Beginning of All Dreams](banner_geocities.gif)

I got a GeoCities web page in the 90's. This was my first web page. My account was `moonhalo`, and I went by `Shoomi` as the online persona.

![Screenshot of GeoCities Athens/Acropolis/4507](screenshot-ani.gif)

I had archived a few of my web sites and made a CD Resume in 1999. Some of the content had been changed to support an offline version for viewing without an internet connection.

# Restoration Notes
This archive has been partially modernized so the original experience can still be viewed in a current browser without needing legacy plugins or local font installs.

- The original Java applet marquee in `title_old.html` has been recreated with HTML5 canvas in `title.html` and `title.js`, using the original message flow from [dreamers.txt](dreamers.txt).
- The old embedded MIDI behavior has been recreated with a small Web Audio sampler player in [soundtrack/soundtrack-webaudio.js](soundtrack/soundtrack-webaudio.js) that reads [midi_song_newage.mid](midi_song_newage.mid) directly and plays a compact Sound Blaster-style sample bank from `soundtrack/samples/`.
- The `Burton's Nightmare` / `nitemare.ttf` font now loads as a webfont through `font.css`, which restores the intended look of the navigation and page titles.
- The old Visual Basic `Color Writer / <FONT> Editor` has been recreated as a browser app in `colorwriter.html` and `colorwriter.js`, including palette picking, per-letter anchor colors, gradient HTML output, and a live rendered preview.

The reconstructed marquee engine, editor, parameters, message-file format, and mode system are documented in [marquee/README.md](marquee/README.md).

# MIDI Restoration
The original site used an embedded MIDI file, [midi_song_newage.mid](midi_song_newage.mid), which is only about `12 KB`, but modern browsers now tend to download instead of play it. A straight browser-friendly replacement with rendered `mp3` or `ogg` files worked technically, but those full audio renders ended up being a few megabytes each, which felt out of proportion to the tiny original asset.

The current restoration takes a different approach. Instead of shipping a full rendered song, [soundtrack/soundtrack-webaudio.js](soundtrack/soundtrack-webaudio.js) reads the MIDI file directly in the browser, schedules the note data with the Web Audio API, and plays it back using a compact Sound Blaster-style sample bank in [soundtrack/samples](/Users/lewismoten/dev/Athens-Acropolis-4507/soundtrack/samples). That keeps the payload much smaller while still preserving the original musical instructions from the MIDI.

This is a very modern solution compared to what was available in the 90s, but it is a good tradeoff for restoration: the original note data stays intact, the browser no longer tries to download the MIDI as a file, and the total instrument bank is much smaller than full rendered audio files.

The sample bank was not chosen arbitrarily. The local TiMidity patch set used for reconstruction was missing two of the General MIDI programs requested by the file:

- `50`: `Synth Strings 1`
- `99`: `Atmosphere`

To keep the result closer to the kind of late-90s Sound Blaster character the site originally had, [timidity-override.cfg](tools/timidity-override.cfg) pins period-appropriate substitutes from the available patch bank, and [render_soundtrack_samples.js](tools/render_soundtrack_samples.js) was used to build the browser sample set:

- `35` -> `Fretless Bass`
- `50` -> `String Ensemble 1 Marcato`
- `99` -> `Goblins--Unicorn`

That last substitution is intentionally more Sound Blaster-flavored than a generic ambient pad. Old Creative-era banks commonly exposed nearby synth effect names like `Crystal`, `Atmosphere`, and `Goblins/Unicorn`, and the `Goblins--Unicorn` variant ended up sounding closer to the remembered original than the earlier `Crystal` test render. The goal was not perfect forensic recovery of the exact original sound card bank, but a restoration that feels closer to how the page likely sounded on 90s PC hardware while keeping the download size much closer to the spirit of the original MIDI.

A more detailed summary of the surviving technical metadata in the original MIDI is documented in [midi_metadata.md](docs/midi_metadata.md).

Notes about the reconstructed sample-bank provenance and licensing caveats are documented in [SOUNDTRACK_LICENSE_NOTES.md](docs/SOUNDTRACK_LICENSE_NOTES.md).

Notes about the original Java applet classes, how they fit together, and what metadata could be recovered are documented in [JAVA_APPLET_NOTES.md](docs/JAVA_APPLET_NOTES.md).

Notes about the restored `nitemare.ttf` / `Burton's Nightmare` font, including recovered metadata and licensing uncertainty, are documented in [NIGHTMARE_FONT_NOTES.md](docs/NIGHTMARE_FONT_NOTES.md).

Notes about the original Visual Basic 4 `Cool Color Writer` / `Color Writer / <FONT> Editor`, including recovered installer metadata and development context, are documented in [COOL_COLOR_WRITER_NOTES.md](docs/COOL_COLOR_WRITER_NOTES.md).

# 90's Nostalgia
Lots of cutting edge stuff here from the 90's.

- Frames
- Animated GIF's
- Banners
- Image Buttons
- Web Camera
- Visitor Counter
- Custom Font
- Music
- Guestbook
- JAVA Applet Marquee
- Text that changes colors
- No JavaScript
- No Cascading Stylesheets
- No Style Tags

# Font Editor
This little program was made using Visual Basic. It changed your text from one color to another as a gradient.

![Cool Color Maker Button](cool_color_maker_button.gif)

![Screenshot of Colorfont](colorfont_preview.gif)

Windows Executable: [clr_fnt.zip](clr_fnt.zip)

Modern HTML Version: [colorwriter.html](colorwriter.html)

The restored web version keeps the same late-90s `<FONT>` workflow, but runs in a current browser and includes a live preview window so you can see the generated HTML as it would have looked on the site.


# Custom Images
Just about every image was made by me except the Link Exchange banner. I'm uncertain about the "I Believe in Peace" image on the front page.

# Animated City

One thing of note here is the citiscape. I found a New York webcam online that showed a new picture every minute or so. I captured pictures for a few hours as the sun gradually went down. I used GIF Animator to create many of the animated GIF images, and used it to create an animation of the city at night. I used Adobe Photoshop to make the images a monotone color to reduce the color palette and make it fit in with the dream theme.

![New York City changes into night](new_york_dream.gif)

# Broken Stuff
- Inner Circle image on home page link changed to relative vs absolute url. ![Inner Circle](ic_icon.gif)
- MIDI playback is restored with a Web Audio sampler that reads the original MIDI and plays a compact instrument bank instead of shipping multi-megabyte rendered audio files.
- Fonts are restored with a webfont so the included `nitemare.ttf` displays again without local installation.
- Color Writer is restored as an HTML app so the old gradient text generator can be used without the original VB executable.
- Counter is static at 0049 for offline viewing.
- Link Exchange is static for offline viewing.
- LPage Guestbook. Host no longer available.
- Book of Dreamers Guesbook - was hosted at home. An archive is here at [book_of_dreamers.html]
- Marquee applet behavior is restored with a canvas recreation in the top frame. It shows the floating / wavey messages from [dreamers.txt](dreamers.txt)
- Link to Lycos. They no longer use `cgi-bin` for their queries.
- Shoomi's Dreams Form Broken
- Email form doesn't work. The `moonhalo` account on GeoCities is no longer active, and I don't have access to my email at `mindless.com`.

# Banners
Banners were made for other pages to advertise the website.

LPage
![LPage Banner](banner_lpage.gif)

Link Exchange
![Link Exchange Banner](banner_linkexchange.gif)

Geocities
![Geocities Banner](banner_geocities.gif)
