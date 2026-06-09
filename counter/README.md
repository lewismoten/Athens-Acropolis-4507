# Shoomi's Visitor Counter

This folder contains Shoomi's Visitor Counter: a strip-based hit counter that stores counts in individual `.dat` files and can either return a generated GIF image or a JSONP payload for browser-side rendering.

## Basic Usage

```html
<img src="/counter/counter.php?key=home" alt="Visitor counter">
```

Legacy-style usage is also supported:

```html
<img src="/counter/counter.php?df=lmoten(1).dat&dd=counter-strip|frgb=000066|comma=T|ft=0" alt="counter">
```

There is also a builder page at [index.html](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/index.html) for previewing strips and generating URLs or embed code.

## Query Parameters

- `key`
  Unique counter name. Stored as `data/<key>.dat`. Default: `default`
- `df`
  Legacy data-file style counter name. It maps directly to an individual `.dat` file.
- `dd`
  Legacy style selector. In the builder, this now follows the selected counter strip, so packed values look like `counter-strip|frgb=000066|comma=T|ft=0`.
- `digits`
  Minimum number of digits to display. Default: `4`
- `text`
  Optional literal token string to render instead of the numeric counter, such as `12:34pm` or `06-08-26`.
- `increment`
  Set to `0` to read without incrementing.
- `step`
  How much to increment by when `increment` is enabled. Default: `1`
- `comma`
  `T` / `F` or `1` / `0` to toggle thousands separators.
- `frgb`
  Legacy frame color in `RRGGBB`. It colors the outer frame only.
- `ft`
  Legacy frame-thickness value. `0` keeps the original strip size unchanged.

## Notes

- Counter values are stored as individual files like [data/default.dat](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/data/default.dat).
- Digit glyphs come from counter strips like [counter-strip.gif](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter-strip.gif) and [@strip_blue_tea_counter.gif](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/@strip_blue_tea_counter.gif).
- GIF endpoints need server-side write access to the `data/` folder and the `.dat` files inside it.
- JSONP endpoints update the `.dat` file server-side, then let [shoomi-visitor-counter.js](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/shoomi-visitor-counter.js) render the strip in the browser.
- Commas are inserted automatically when enabled, so larger values render like `1,234` or `12,345,678`.

## Available Implementations

- [index.php](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/index.php)
  PHP endpoint that reads the strip GIF directly and returns GIF.
- [counter.php](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.php)
  Preferred PHP entrypoint name. It loads `index.php` for compatibility with older links.
- [counter.py](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.py)
  Python CGI-style endpoint that reads the strip GIF directly and returns GIF.
- [counter.go](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.go)
  Go CGI-style endpoint that reads the strip GIF directly and returns GIF.
- [counter.pl](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.pl)
  Perl JSON/JSONP endpoint that increments the counter and returns the new value plus the resolved render parameters.
- [counter.rb](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.rb)
  Ruby JSON/JSONP endpoint that increments the counter and returns the new value plus the resolved render parameters.
- [counter.asp](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.asp)
  Classic ASP JSON/JSONP endpoint that increments the counter and returns the new value plus the resolved render parameters.
- [counter.aspx](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter.aspx)
  ASP.NET JSON/JSONP endpoint that increments the counter and returns the new value plus the resolved render parameters.
- [shoomi-visitor-counter.js](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/shoomi-visitor-counter.js)
  Drop-in browser helper that can call `counter.pl`, `counter.rb`, `counter.asp`, or `counter.aspx` via JSONP and render the result on a canvas using the selected strip.

The old Node wrapper was removed, so this folder now keeps only implementations that either render the strip image directly or return a browser-renderable counter payload.

## JSONP Endpoints

Use the Perl, Ruby, Classic ASP, or ASP.NET endpoint when you want the server to update the `.dat` file but let the browser do the strip rendering.

Example:

```html
<div id="visitor-counter"></div>
<script src="/counter/shoomi-visitor-counter.js"></script>
<script>
ShoomiVisitorCounter.mount("#visitor-counter", {
  endpoint: "/counter/counter.pl",
  params: {
    df: "lmoten(1).dat",
    strip: "counter-strip",
    dd: "counter-strip|frgb=000066|comma=T|ft=0",
    digits: "4",
    step: "1",
    increment: "1"
  }
});
</script>
```

For Ruby, change only the endpoint:

```html
<script>
ShoomiVisitorCounter.mount("#visitor-counter", {
  endpoint: "/counter/counter.rb",
  params: {
    df: "lmoten(1).dat",
    strip: "counter-strip",
    dd: "counter-strip|frgb=000066|comma=T|ft=0",
    digits: "4",
    step: "1",
    increment: "1"
  }
});
</script>
```

For Classic ASP, change only the endpoint:

```html
<script>
ShoomiVisitorCounter.mount("#visitor-counter", {
  endpoint: "/counter/counter.asp",
  params: {
    df: "lmoten(1).dat",
    strip: "counter-strip",
    dd: "counter-strip|frgb=000066|comma=T|ft=0",
    digits: "4",
    step: "1",
    increment: "1"
  }
});
</script>
```

For ASP.NET, change only the endpoint:

```html
<script>
ShoomiVisitorCounter.mount("#visitor-counter", {
  endpoint: "/counter/counter.aspx",
  params: {
    df: "lmoten(1).dat",
    strip: "counter-strip",
    dd: "counter-strip|frgb=000066|comma=T|ft=0",
    digits: "4",
    step: "1",
    increment: "1"
  }
});
</script>
```

## Strip Metadata

- A strip can optionally have a sidecar metadata file like [counter-strip.meta.json](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter-strip.meta.json) or [@strip_blue_tea_counter.meta.json](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/@strip_blue_tea_counter.meta.json).
- [shoomi-visitor-counter.js](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/shoomi-visitor-counter.js) derives the metadata filename automatically from the strip source, for example `counter-strip.gif` -> `counter-strip.meta.json`.
- The preferred format is a compact lookup object with a `base` block and per-token overrides, for example:

```json
{
  "base": {
    "tokens": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", "am", "pm", ",", "-"],
    "width": 15
  },
  ":": 10,
  "am": 24,
  "pm": 24,
  ",": 11,
  "-": 11
}
```

- Each token override may be either a number meaning `width`, or an object like `{ "width": 29, "offset": 210, "advance": 31 }` when a strip needs non-uniform spacing.
- The current shared token order is:
  `0 1 2 3 4 5 6 7 8 9 : am pm , -`
