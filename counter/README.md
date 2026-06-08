# Counter Service

This folder contains a tiny PHP-based hit counter that stores counts in individual `.dat` files and returns a generated GIF image assembled from a classic counter strip.

## Basic Usage

```html
<img src="counter/index.php?key=home" alt="Visitor counter">
```

Legacy-style usage is also supported:

```html
<img src="counter/index.php?df=lmoten(1).dat&dd=lmoten(a)|frgb=000066|comma=T|ft=0" alt="counter">
```

## Query Parameters

- `key`
  Unique counter name. Stored as `data/<key>.dat`. Default: `default`
- `df`
  Legacy data-file style counter name. It maps directly to an individual `.dat` file.
- `dd`
  Legacy style selector. Pipe-packed options like `lmoten(a)|frgb=000066|comma=T|ft=0` are supported.
- `digits`
  Minimum number of digits to display. Default: `4`
- `increment`
  Set to `0` to read without incrementing.
- `step`
  How much to increment by when `increment` is enabled. Default: `1`
- `comma`
  `T` / `F` or `1` / `0` to toggle thousands separators.
- `frgb`
  Legacy frame-color tint in `RRGGBB`.
- `ft`
  Legacy frame-thickness value. `0` keeps the original strip chrome thickness.

## Notes

- Counter values are stored as individual files like [data/default.dat](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/data/default.dat).
- Digit glyphs come from [counter-strip.gif](/Users/lewismoten/dev/Athens-Acropolis-4507/counter/counter-strip.gif), generated from the local `count.gif` look.
- The PHP process needs write access to the `data/` folder and the `.dat` files inside it.
- The response is a GIF image with no-cache headers, so it behaves like a classic web counter image.
- Commas are inserted automatically, so larger values render like `1,234` or `12,345,678`.
