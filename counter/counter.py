#!/usr/bin/env python3
import argparse
import fcntl
import io
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DEFAULT_STRIP = ROOT / "counter-strip.gif"
DEFAULT_TOKENS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ","]
def main() -> None:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--query", default=None)
    parser.add_argument("--output", default=None)
    parser.add_argument("--no-headers", action="store_true")
    args = parser.parse_args()

    query_string = args.query if args.query is not None else os.environ.get("QUERY_STRING", "")
    payload = build_counter_gif(query_string)

    if args.output:
        Path(args.output).write_bytes(payload)
        return

    stdout = sys.stdout.buffer
    if not args.no_headers:
        stdout.write(b"Content-Type: image/gif\r\n")
        stdout.write(b"Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n")
        stdout.write(b"Pragma: no-cache\r\n\r\n")
    stdout.write(payload)


def build_counter_gif(query_string: str) -> bytes:
    query = parse_qs(query_string, keep_blank_values=True)
    legacy = parse_legacy_options(query)
    strip_path = resolve_strip_path(legacy.get("dd", value(query, "dd", "")))
    counter_file = resolve_counter_file(
        value(query, "key", legacy.get("df", value(query, "df", "default")))
    )
    digits = clamp_int(value(query, "digits", "4"), 1, 12, 4)
    increment = value(query, "increment", "1") != "0"
    step = clamp_int(value(query, "step", "1"), 0, 1000, 1)
    use_comma = parse_legacy_bool(legacy.get("comma", value(query, "comma", "1")), True)
    frame_color = normalize_optional_color(legacy.get("frgb", value(query, "frgb", "")))
    frame_thickness = clamp_int(legacy.get("ft", value(query, "ft", "0")), 0, 6, 0)
    text_override = value(query, "text", "")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    count = read_and_update_count(counter_file, step if increment else 0)
    layout = load_strip_layout(strip_path)
    text = format_counter_text(count, digits, use_comma)
    tokens = tokenize_display_text(text_override, layout["tokens"]) if text_override else tokenize_display_text(text, layout["tokens"])
    image = render_counter_image(tokens, strip_path, layout, frame_color, frame_thickness)

    output = io.BytesIO()
    image.save(output, format="GIF")
    return output.getvalue()


def value(query: dict, key: str, default: str) -> str:
    values = query.get(key)
    if not values:
        return default
    return values[-1]


def clamp_int(raw: str, minimum: int, maximum: int, fallback: int) -> int:
    try:
        number = int(str(raw).strip())
    except ValueError:
        number = fallback
    return max(minimum, min(maximum, number))


def normalize_counter_key(raw: str) -> str:
    key = (raw or "").strip()
    key = re.sub(r"\.dat$", "", key, flags=re.IGNORECASE)
    key = re.sub(r"[^a-z0-9_.:()\-]+", "-", key, flags=re.IGNORECASE)
    key = key.strip("-").lower()
    return key[:120] if key else "default"


def resolve_counter_file(raw: str) -> Path:
    key = normalize_counter_key(raw)
    if key in {"", "default"}:
        key = "default"
    return DATA_DIR / f"{key}.dat"


def read_and_update_count(path: Path, increment_by: int) -> int:
    if not path.exists():
        path.write_text("0\n", encoding="utf-8")

    with path.open("r+", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        contents = handle.read().strip()
        count = max(0, int(contents or "0"))
        if increment_by > 0:
            count += increment_by
            handle.seek(0)
            handle.truncate()
            handle.write(f"{count}\n")
        fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    return count


def format_counter_text(count: int, minimum_digits: int, use_comma: bool) -> str:
    padded = str(max(0, count)).rjust(minimum_digits, "0")
    if not use_comma:
        return padded
    parts = []
    while len(padded) > 3:
        parts.insert(0, padded[-3:])
        padded = padded[:-3]
    parts.insert(0, padded)
    return ",".join(parts)


def parse_legacy_options(query: dict) -> dict:
    options = {}
    dd = value(query, "dd", "")
    df = value(query, "df", "")
    if df:
        options["df"] = df
    if not dd:
        return options
    parts = dd.split("|")
    options["dd"] = parts.pop(0)
    for part in parts:
        if "=" not in part:
            continue
        key, option_value = part.split("=", 1)
        key = key.strip().lower()
        option_value = option_value.strip()
        if key:
            options[key] = option_value
    return options


def parse_legacy_bool(raw: str, default: bool) -> bool:
    text = str(raw or "").strip().upper()
    if not text:
        return default
    if text in {"T", "TRUE", "1", "Y"}:
        return True
    if text in {"F", "FALSE", "0", "N"}:
        return False
    return default


def normalize_optional_color(raw: str):
    text = str(raw or "").strip().replace(";", "")
    if not text:
        return None
    if re.fullmatch(r"[0-9a-fA-F]{6}", text):
        return f"#{text.lower()}"
    if re.fullmatch(r"#[0-9a-fA-F]{6}", text):
        return text.lower()
    return None


def resolve_strip_path(style: str) -> Path:
    normalized = re.sub(r"[^@a-z0-9()_\-]+", "", style.strip().lower())
    candidates = []
    if normalized:
        candidates.append(ROOT / f"{normalized}.gif")
        candidates.append(ROOT / f"{normalized.replace('(', '').replace(')', '')}.gif")
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return DEFAULT_STRIP

def load_strip_layout(strip_path: Path) -> dict:
    metadata_path = strip_path.with_suffix(".meta.json")

    if metadata_path.is_file():
        data = json.loads(metadata_path.read_text(encoding="utf-8"))
        layout = parse_strip_metadata(data)
        if layout is not None:
            return layout

    with Image.open(strip_path) as strip:
        glyph_width = strip.width // len(DEFAULT_TOKENS)

    widths = [glyph_width] * len(DEFAULT_TOKENS)
    offsets = [index * glyph_width for index in range(len(DEFAULT_TOKENS))]
    return {"tokens": DEFAULT_TOKENS[:], "widths": widths, "offsets": offsets}


def parse_strip_metadata(data) -> dict | None:
    if not isinstance(data, dict):
        return None

    tokens = list(data.get("tokens", []))
    widths = [int(value) for value in data.get("widths", [])]
    offsets = [int(value) for value in data.get("offsets", [])]
    if tokens and len(tokens) == len(widths):
        if len(offsets) != len(widths):
            offsets = []
            left = 0
            for width in widths:
                offsets.append(left)
                left += width
        return {"tokens": tokens, "widths": widths, "offsets": offsets}

    base = data.get("base")
    if not isinstance(base, dict):
        return None

    tokens = list(base.get("tokens", []))
    if not tokens:
        return None

    base_width = int(base.get("width", 0) or 0)
    if base_width <= 0:
        return None

    widths = []
    offsets = []
    left = int(base.get("offset", 0) or 0)
    base_advance = int(base.get("advance", base_width) or base_width)

    for token in tokens:
        entry = data.get(token)
        width = base_width
        offset = left
        advance = base_advance

        if isinstance(entry, int):
            width = int(entry)
            advance = width
        elif isinstance(entry, dict):
            width = int(entry.get("width", base_width) or base_width)
            offset = int(entry.get("offset", left) or left)
            advance = int(entry.get("advance", width) or width)

        widths.append(width)
        offsets.append(offset)
        left = offset + advance

    return {"tokens": tokens, "widths": widths, "offsets": offsets}


def tokenize_display_text(raw_text: str, available_tokens) -> list[str]:
    tokens = []
    text = str(raw_text or "")
    index = 0
    token_set = set(available_tokens)

    while index < len(text):
        pair = text[index:index + 2].lower()
        if pair in {"am", "pm"} and pair in token_set:
            tokens.append(pair)
            index += 2
            continue

        character = text[index]
        if character in token_set:
            tokens.append(character)
        elif character.isdigit() and character in token_set:
            tokens.append(character)
        index += 1

    if not tokens:
        fallback = "0" if "0" in token_set else available_tokens[0]
        tokens.append(fallback)

    return tokens


def render_counter_image(tokens: list[str], strip_path: Path, layout: dict, frame_color, frame_thickness: int) -> Image.Image:
    strip = Image.open(strip_path).convert("P")
    glyph_height = strip.height
    token_to_index = {token: index for index, token in enumerate(layout["tokens"])}
    image_width = sum(layout["widths"][token_to_index.get(token, 0)] for token in tokens)
    image = Image.new("P", (image_width, glyph_height))
    image.putpalette(strip.getpalette())

    target_left = 0
    default_index = token_to_index.get("0", 0)

    for token in tokens:
        glyph_index = token_to_index.get(token, default_index)
        source_left = layout["offsets"][glyph_index]
        glyph_width = layout["widths"][glyph_index]
        cell = strip.crop((source_left, 0, source_left + glyph_width, glyph_height))
        image.paste(cell, (target_left, 0))
        target_left += glyph_width

    if frame_thickness > 0:
        image = apply_frame_thickness(image, frame_color or "#666666", frame_thickness)

    return image


def apply_frame_thickness(image: Image.Image, hex_color: str, thickness: int) -> Image.Image:
    framed = Image.new("RGBA", (image.width + (thickness * 2), image.height + (thickness * 2)), (255, 0, 255, 0))
    framed.alpha_composite(image.convert("RGBA"), (thickness, thickness))
    rgb_image = framed.convert("RGB")
    draw = ImageDraw.Draw(rgb_image)
    outline = hex_to_rgb(hex_color)
    top = 0
    left = 0
    right = rgb_image.width - 1
    bottom = rgb_image.height - 1

    for line in range(thickness):
        draw.rectangle((left + line, top + line, right - line, bottom - line), outline=outline)

    return rgb_image.convert("P", palette=Image.ADAPTIVE, colors=256)


def hex_to_rgb(hex_color: str):
    value = hex_color.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


if __name__ == "__main__":
    main()
