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
- This fallback message is shown as a centered waving message, not as a transitioning sequence row.

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

`messageFile`

- Type: `string`
- Required: no
- Default: `""`
- Optional external message file in `dreamers.txt` style format.
- When blank, the top-level `message` is shown as the centered waving fallback message.
- When present, the fallback `message` stays visible until the file loads successfully.

`displayFrames`

- Type: `number`
- Required: no
- Default: `100`
- Applet-style hold duration shared by sequenced messages.

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

`dotImageFiles`

- Type: `string | string[]`
- Required: no
- Default: `""`
- Pipe-delimited image list or image array used by image-aware background modes.
- When empty, image-aware modes fall back to their normal vector rendering.

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

`start` and `end` belong to sequence entries only. They are not used by the plain top-level fallback `message`.

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

## Creating Custom Modes

Custom background modes are registered with:

```js
ShoomiColorMarquee.registerMode("my-mode", {
  style: function (dot, runtime) {},
  reset: function (dot, spawnOffscreen, initialSpawn, runtime) {},
  draw: function (runtime) {},
  cleanup: function (dot, runtime) {}
});
```

Only `draw` is truly essential, but in practice you will almost always want `style` and `reset` too.

### Mode Hooks

`style(dot, runtime)`

- Runs when a dot is created or restyled.
- Use it to define the dot's shape and behavior inputs.
- Typical fields to set:
- `radius`
- `speed`
- `wobble`
- `drift`
- `glow`
- `length`
- any custom properties your mode needs

`reset(dot, spawnOffscreen, initialSpawn, runtime)`

- Runs when a dot is spawned or recycled.
- Use it to place the dot and initialize per-life state.
- `spawnOffscreen` tells you whether the dot should begin just outside the visible area.
- `initialSpawn` tells you whether this is part of the initial field population.

`draw(runtime)`

- Called every frame for the active mode.
- Usually loops over `runtime.state.dots`, updates positions, handles respawn, and draws visuals.

`cleanup(dot, runtime)`

- Optional.
- Use it to clear mode-specific fields when dots are reset.

### Runtime API

The `runtime` object passed to mode hooks exposes:

`runtime.canvas`

- The active canvas element.

`runtime.context`

- The `2d` drawing context.

`runtime.settings`

- Current marquee settings, including `dotSpeed`, `dotCount`, `dotColor`, `dotImageFiles`, `backgroundMode`, `fps`, and more.

`runtime.state`

- Current runtime state, including:
- `dots`
- `backgroundFrame`
- `entryFrame`
- render-adaptation state

`runtime.nextRandom()`

- Deterministic pseudo-random generator used throughout the marquee.

`runtime.resetDot(dot, spawnOffscreen, initialSpawn?)`

- Recycles a dot using the current mode's reset logic.

`runtime.applyDotStyle(dot)`

- Reapplies the current mode's `style(...)`.

`runtime.syncDotRelativePosition(dot, width, height)`

- Updates `relativeX` / `relativeY` after you move a dot.

`runtime.syncDotAbsolutePosition(dot)`

- Restores absolute position from relative coordinates after resize.

`runtime.easeOutCubic(value)`

- Shared easing helper.

`runtime.easeInCubic(value)`

- Shared easing helper.

`runtime.getDotImage(dot)`

- Returns the assigned dot image when `dotImageFiles` is populated.

`runtime.drawDotImage(dot, options)`

- Draws the assigned dot image for a dot.
- Returns `true` if an image was drawn, `false` if the mode should fall back to vector drawing.

### `drawDotImage(...)` Options

```js
runtime.drawDotImage(dot, {
  x: dot.x,
  y: dot.y,
  width: 12,
  height: 12,
  rotation: 0,
  alpha: 1
});
```

Supported options:

- `x`
- `y`
- `width`
- `height`
- `rotation`
- `alpha`

### Reverse Animation Requirement

New modes should support negative `dotSpeed`.

That means:

- moving in the opposite direction when `dotSpeed < 0`
- respawning from the correct opposite edge
- avoiding modes that simply drain out and never repopulate in reverse
- making lifecycle-based effects feel intentionally reversed when possible

Examples from built-in modes:

- rain respawns from the bottom in reverse
- bubbles can reform downward in reverse
- fireworks can rewind from burst back into launch

If full lifecycle reversal is too complex, at minimum the mode should:

- continue animating
- continue respawning
- not freeze
- not vanish permanently

### Dot Image Support Requirement

New modes should also consider whether `dotImageFiles` is populated.

If your mode is image-friendly:

- call `runtime.drawDotImage(...)`
- let the mode fall back to vector drawing when no image is available
- decide how images should behave in that mode

Examples:

- `rain` stretches images into streaks
- `comets` use the image as the head
- `matrix` repeats one image down a whole line
- `fireworks` use one image per burst

If a mode is not a good fit for images, document that clearly and keep the vector rendering path.

### Local Helpers

If a drawing helper is only used by one mode, keep it inside that mode file instead of adding it to the shared runtime API.

Examples:

- `leaves.js` owns its own leaf-shape drawing helper
- `fog.js` owns its own fog-ellipse helper

That keeps the shared runtime smaller and makes mode files more self-contained.

### Minimal Example

```js
ShoomiColorMarquee.registerMode("my-drift", {
  style: function (dot, runtime) {
    var rand = runtime.nextRandom;
    dot.radius = (rand() * 2) + 1;
    dot.speed = (rand() * 0.8) + 0.4;
    dot.drift = (rand() * 0.8) + 0.2;
    dot.wobble = (rand() * 0.6) + 0.2;
    dot.glow = 1;
    dot.length = 0;
  },
  reset: function (dot, spawnOffscreen, initialSpawn, runtime) {
    var rand = runtime.nextRandom;
    var canvas = runtime.canvas;
    var reverse = runtime.settings.dotSpeed < 0;

    dot.x = spawnOffscreen
      ? (reverse ? -12 : canvas.width + 12)
      : (rand() * canvas.width);
    dot.y = rand() * canvas.height;
  },
  draw: function (runtime) {
    var dots = runtime.state.dots;
    var context = runtime.context;
    var canvas = runtime.canvas;
    var reverse = runtime.settings.dotSpeed < 0;
    var i;
    var dot;
    var driftX;
    var driftY;

    for (i = 0; i < dots.length; i += 1) {
      dot = dots[i];
      driftX = dot.speed * runtime.settings.dotSpeed * 2;
      driftY = Math.sin((runtime.state.backgroundFrame / 20) + dot.phase) * dot.wobble;

      dot.x -= driftX;
      dot.y += driftY;

      if ((!reverse && dot.x < -16) || (reverse && dot.x > canvas.width + 16)) {
        runtime.resetDot(dot, true);
        continue;
      }

      runtime.syncDotRelativePosition(dot, canvas.width, canvas.height);

      if (runtime.drawDotImage(dot, {
        width: dot.radius * 3,
        height: dot.radius * 3,
        alpha: 0.8
      })) {
        continue;
      }

      context.fillStyle = dot.color;
      context.globalAlpha = 0.8;
      context.beginPath();
      context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
      context.fill();
    }

    context.globalAlpha = 1;
  }
});
```

## Easter Eggs

### Reverse Mode

Many background modes can run in reverse.

Use a negative `dotSpeed` value.
If you want to stay closest to the behavior that has actually been tested in this project, prefer negative integers.

Examples:

```js
dotSpeed: -3
dotSpeed: -12
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
