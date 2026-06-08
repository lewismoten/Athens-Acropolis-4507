# Shoomi's Color Marquee

Shoomi's Color Marquee is a canvas-based remake of the classic animated personal-site banner style: colorful text, wavy motion, background particles, optional message files, and lots of retro GIF energy.

It takes inspiration from old Java applet marquees and GeoCities-era banner art, but runs as plain HTML + JavaScript.

## Quick Example

```html
<div id="banner-bg" style="width:640px;height:92px;">
  <canvas id="banner" width="640" height="92"></canvas>
</div>

<script src="shoomi-color-marquee.js"></script>
<script src="modes/stars.js"></script>
<script>
  ShoomiColorMarquee.createCanvasMarquee({
    canvas: document.getElementById("banner"),
    backgroundElement: document.getElementById("banner-bg"),
    width: 640,
    height: 92,
    backgroundColor: "#000066",
    message: "$0 Shoomi's Home Page $$ forever",
    colors: "ffff66|66ccff|ff99cc|",
    defaultColor: "ffffff",
    imageFiles: "blue_ball.gif|red_ball.gif|",
    backgroundMode: "stars",
    dotColor: "9999ff",
    dotCount: 50,
    dotSpeed: 0.18,
    waveHeight: 8,
    fontName: "\"Times New Roman\", Times, serif",
    fontSize: 30,
    fontStyle: "2",
    fps: 20,
    displayFrames: 100
  });
</script>
```

## Color And Image Piping

### `colors`

`colors` can be provided either as a pipe-delimited list or as an array of text colors.

```js
colors: "ffff66|66ccff|ff99cc|"
```

```js
colors: ["ffff66", "#66ccff", "ff99cc"]
```

Notes:

- Colors may be written as `RRGGBB` or `#RRGGBB`.
- Missing `#` is added automatically for 6-character hex values.
- If the list is shorter than the visible text, remaining characters fall back to `defaultColor`.
- A trailing pipe is fine.

### `imageFiles`

`imageFiles` can also be provided either as a pipe-delimited list or as an array.

```js
imageFiles: "blue_ball.gif|green_ball.gif|red_ball.gif|"
```

```js
imageFiles: ["blue_ball.gif", "green_ball.gif", "red_ball.gif"]
```

These images can be used inline inside text with `$` tokens.

## Inline Image Tokens

Use `$0`, `$1`, `$2`, and so on to reference images from `imageFiles`.

```js
message: "$0 Welcome $1 Home"
imageFiles: "blue_ball.gif|red_ball.gif|"
```

Rules:

- `$0` uses the first image
- `$1` uses the second image
- `$$` escapes a literal dollar sign

Example:

```js
message: "Costs $$5 $0 today"
```

This renders as:

- literal `$5`
- then image `0`

## Parameters

All options are passed to `ShoomiColorMarquee.createCanvasMarquee(options)`.

### Core Elements

`canvas`

- Type: `HTMLCanvasElement`
- Required: yes
- Default: none
- The drawing surface for text and animated dots.

`backgroundElement`

- Type: `HTMLElement`
- Required: no
- Default: `canvas`
- Optional separate element that owns the background color/image styles.

### Sizing

`width`

- Type: `number`
- Required: no
- Default: `500`

`height`

- Type: `number`
- Required: no
- Default: `78`

### Text And Message

`message`

- Type: `string`
- Required: no
- Default: `""`
- Fallback inline message used when no message file is active or when file loading fails.

`colors`

- Type: `string | string[]`
- Required: no
- Default: `null`
- Per-character text colors.

`defaultColor`

- Type: `string`
- Required: no
- Default: `#ffaa00`
- Fallback text color when `colors` is missing or too short.

`imageFiles`

- Type: `string | string[]`
- Required: no
- Default: `""`
- Pipe-delimited image list or image array for inline `$0`, `$1`, `$2` message tokens.

`start`

- Type: `string`
- Required: no
- Default: `">>"`
- Enter transition for the fallback inline message.

`end`

- Type: `string`
- Required: no
- Default: `"<<"`
- Exit transition for the fallback inline message.

`staticMessage`

- Type: `boolean`
- Required: no
- Default: `false`
- When `true`, the inline message stays centered and visible instead of sequencing.

`messageFile`

- Type: `string`
- Required: no
- Default: `""`
- Optional external message file in `dreamers.txt` style format.

`displayFrames`

- Type: `number`
- Required: no
- Default: `100`
- Applet-style hold duration shared by sequenced messages.

`edgePadding`

- Type: `number`
- Required: no
- Default: `18`
- Extra offscreen padding used by text transitions.

### Typography

`fontName`

- Type: `string`
- Required: no
- Default: `"Times New Roman", Times, serif`

`fontSize`

- Type: `number`
- Required: no
- Default: `29`

`fontStyle`

- Type: `string | number`
- Required: no
- Default: `"2"`

Values:

- `0` = Regular
- `1` = Bold
- `2` = Italic
- `3` = Bold Italic

### Background

`backgroundColor`

- Type: `string`
- Required: no
- Default: `#000033`

`backgroundImage`

- Type: `string`
- Required: no
- Default: `""`

`backgroundImagePlacement`

- Type: `string`
- Required: no
- Default: `"center"`

Supported values:

- `tile`
- `center`
- `top-left`
- `top-center`
- `top-right`
- `left-center`
- `right-center`
- `bottom-left`
- `bottom-center`
- `bottom-right`
- `fit`
- `xy`
- `xy-size`

`backgroundImageX`

- Type: `number`
- Required: no
- Default: `0`
- Used by `xy` and `xy-size`.

`backgroundImageY`

- Type: `number`
- Required: no
- Default: `0`
- Used by `xy` and `xy-size`.

`backgroundImageWidth`

- Type: `number`
- Required: no
- Default: `0`
- Used by `xy-size`.

`backgroundImageHeight`

- Type: `number`
- Required: no
- Default: `0`
- Used by `xy-size`.

### Background Animation

`backgroundMode`

- Type: `string`
- Required: no
- Default: first registered mode, normally `stars`

`dotColor`

- Type: `string`
- Required: no
- Default: `#9999ff`

`dotCount`

- Type: `number`
- Required: no
- Default: `50`

`dotSpeed`

- Type: `number`
- Required: no
- Default: `0.18`
- Controls the speed and direction of the background mode.

`dotImageMode`

- Type: `string`
- Required: no
- Default: `"none"`

Supported values:

- `none`
- `images`

`dotImageFiles`

- Type: `string | string[]`
- Required: no
- Default: `""`
- Pipe-delimited image list or image array used by image-aware background modes.

### Timing And Motion

`fps`

- Type: `number`
- Required: no
- Default: `30`

`waveHeight`

- Type: `number`
- Required: no
- Default: `8`

`randomSeed`

- Type: `number`
- Required: no
- Default: internal seed
- Lets you keep motion deterministic if needed.

### Methods

The marquee instance returns:

`setOptions(nextOptions)`

- Updates marquee settings live.

`setEntries(entries, preserveProgress?)`

- Replaces active entries.

`setSize(width, height)`

- Resizes the marquee.

`getEntries()`

- Returns a shallow copy of current entries.

## Sequences

You can supply sequences either inline or by using a message file.

### Inline `entries`

Example:

```js
entries: [
  { start: ">>", end: "<<", text: "First", colors: "ffff66|66ccff|" },
  { start: "^^", end: "VV", text: "Second", colors: "ff99cc|ffffff|" }
]
```

Each entry supports:

- `start`
- `end`
- `text`
- `colors`
- `defaultColor`
- `holdFrames`

If `holdFrames` is omitted, the marquee uses global `displayFrames`.

### Message File Format

The optional message file is line-based.

Format:

1. first line: sequence count
2. then for each sequence:
3. text
4. colors
5. `enter,exit`

Example:

```text
3
Welcome Home
ffff66|66ccff|
>>,<<
The beginning of all dreams
ff99cc|ffffff|
^^,VV
Click around
66ffcc|ffff66|
<>,>>
```

### Transition Tokens

Supported transition tokens:

- `>>`
- `<<`
- `^^`
- `VV`
- `<>`

Meaning:

- `>>` horizontal from left / toward right
- `<<` horizontal from right / toward left
- `^^` vertical from bottom / toward top
- `VV` vertical from top / toward bottom
- `<>` center zoom transition

## Modes

### `stars`

Twinkling drifting star field.

- Supports dot images: yes

### `rain`

Fast slanted falling streaks.

- Supports dot images: yes
- Image behavior: stretched along the rain streak

### `snow`

Soft drifting flakes.

- Supports dot images: yes

### `fireflies`

Slow glowing wanderers with pulse.

- Supports dot images: yes

### `dust`

Floating haze-like particles.

- Supports dot images: yes

### `bubbles`

Upward floating bubbles.

- Supports dot images: yes

### `bubble-pop`

Bubbles that pop into rings.

- Supports dot images: yes for the bubble body

### `embers`

Small glowing particles that rise and flicker.

- Supports dot images: yes

### `sparkles`

Twinkling stationary glints.

- Supports dot images: yes

### `fog`

Large soft drifting mist shapes.

- Supports dot images: yes

### `comets`

Fast streaks with visible heads and tails.

- Supports dot images: yes
- Image behavior: image is used as the comet head

### `matrix`

Falling segmented matrix-like columns.

- Supports dot images: yes
- Image behavior: one image repeats down a full line, another line may use a different image

### `confetti`

Fluttering falling rectangles.

- Supports dot images: yes

### `balls`

Bouncing balls that collide with edges.

- Supports dot images: yes

### `static`

CRT-like noise shimmer and scanline feel.

- Supports dot images: no

### `leaves`

Falling rotating leaf-like shapes.

- Supports dot images: yes

### `fireworks`

Launch, burst, and falling fragments.

- Supports dot images: yes
- Image behavior: burst particles only; one burst repeats one image, another burst can use another image

## Easter Eggs

### Reverse Mode

Many background modes can run in reverse.

Use a negative `dotSpeed` value.

Examples:

```js
dotSpeed: -0.18
dotSpeed: -0.5
```

What this does:

- rain rises
- snow can drift upward
- bubbles can reform downward
- fireworks can rewind
- many particle lifecycles play backward or from reversed spawn directions

In the marquee editor, this is exposed as a negative `Background Speed`.

### Dollar Escape

If you want a real dollar sign in text, use:

```text
$$
```

### Mixed GIF Chaos

If you provide multiple `dotImageFiles`, image-aware modes will usually pick one image per particle or per effect object. That means mixed ball GIFs, alternating matrix lines, and different firework bursts can all coexist in one marquee.
