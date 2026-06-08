# Counter Service

This folder contains a tiny PHP-based hit counter that stores counts in a local JSON file and returns a generated GIF image assembled from a classic counter strip.

## Basic Usage

```html
<img src="counter/index.php?key=home" alt="Visitor counter">
```

## Query Parameters

- `key`
  Unique counter name. Default: `default`
- `digits`
  Minimum number of digits to display. Default: `4`
- `increment`
  Set to `0` to read without incrementing.
- `step`
  How much to increment by when `increment` is enabled. Default: `1`

## Notes

- Counter values are stored in [data/counts.json](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/data/counts.json).
- Digit glyphs come from [counter-strip.gif](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter-strip.gif), generated from the local `count.gif` look.
- The PHP process needs write access to that file.
- The response is a GIF image with no-cache headers, so it behaves like a classic web counter image.
- Commas are inserted automatically, so larger values render like `1,234` or `12,345,678`.
