<?php
declare(strict_types=1);

$stripPath = __DIR__ . '/counter-strip.gif';
$outputPath = __DIR__ . '/counter-strip.json';
$textOutputPath = __DIR__ . '/counter-strip-data.txt';
$glyphMap = [
    '0' => 0,
    '1' => 1,
    '2' => 2,
    '3' => 3,
    '4' => 4,
    '5' => 5,
    '6' => 6,
    '7' => 7,
    '8' => 8,
    '9' => 9,
    ',' => 10,
];

$strip = @imagecreatefromgif($stripPath);

if ($strip === false) {
    fwrite(STDERR, "Unable to load counter strip.\n");
    exit(1);
}

$glyphWidth = (int) (imagesx($strip) / count($glyphMap));
$glyphHeight = imagesy($strip);
$glyphs = [];

foreach ($glyphMap as $character => $index) {
    $rows = [];

    for ($y = 0; $y < $glyphHeight; $y += 1) {
        $row = [];

        for ($x = 0; $x < $glyphWidth; $x += 1) {
            $rgba = imagecolorsforindex($strip, imagecolorat($strip, ($index * $glyphWidth) + $x, $y));
            $row[] = [
                'hex' => sprintf('#%02x%02x%02x', $rgba['red'], $rgba['green'], $rgba['blue']),
                'alpha' => max(0, min(1, 1 - ($rgba['alpha'] / 127))),
            ];
        }

        $rows[] = $row;
    }

    $glyphs[$character] = $rows;
}

$frameMask = [];

for ($y = 0; $y < $glyphHeight; $y += 1) {
    $row = [];

    for ($x = 0; $x < $glyphWidth; $x += 1) {
        $colors = [];

        foreach ($glyphs as $character => $rows) {
            $colors[$rows[$y][$x]['hex']] = true;
        }

        $hexValues = array_keys($colors);
        $tintable = false;

        if (count($hexValues) === 1) {
            $hex = $hexValues[0];
            $rgb = hexToRgb($hex);
            $luma = (0.299 * $rgb[0]) + (0.587 * $rgb[1]) + (0.114 * $rgb[2]);

            if ($luma >= 55) {
                $tintable = true;
            }
        }

        $row[] = $tintable;
    }

    $frameMask[] = $row;
}

$metadata = [
    'glyphWidth' => $glyphWidth,
    'glyphHeight' => $glyphHeight,
    'glyphOrder' => array_keys($glyphMap),
    'frameMask' => $frameMask,
    'glyphs' => $glyphs,
];

file_put_contents(
    $outputPath,
    json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
);

$palette = [];
$paletteIndex = [];

foreach ($glyphs as $rows) {
    foreach ($rows as $row) {
        foreach ($row as $pixel) {
            if (!isset($paletteIndex[$pixel['hex']])) {
                $paletteIndex[$pixel['hex']] = count($palette);
                $palette[] = $pixel['hex'];
            }
        }
    }
}

$textLines = [];
$textLines[] = 'size=' . $glyphWidth . 'x' . $glyphHeight;
$textLines[] = 'palette=' . implode(',', $palette);
$textLines[] = 'mask=' . implode('/', array_map(
    static function (array $row): string {
        return implode('', array_map(static fn (bool $value): string => $value ? '1' : '0', $row));
    },
    $frameMask
));

foreach ($glyphMap as $character => $_index) {
    $encodedRows = [];

    foreach ($glyphs[$character] as $row) {
        $encoded = '';

        foreach ($row as $pixel) {
            $encoded .= str_pad(
                strtoupper(base_convert((string) $paletteIndex[$pixel['hex']], 10, 36)),
                2,
                '0',
                STR_PAD_LEFT
            );
        }

        $encodedRows[] = $encoded;
    }

    $label = $character === ',' ? 'comma' : $character;
    $textLines[] = 'glyph=' . $label . ':' . implode('/', $encodedRows);
}

file_put_contents($textOutputPath, implode("\n", $textLines) . "\n");

imagedestroy($strip);

function hexToRgb(string $hex): array
{
    $value = ltrim($hex, '#');

    return [
        hexdec(substr($value, 0, 2)),
        hexdec(substr($value, 2, 2)),
        hexdec(substr($value, 4, 2)),
    ];
}
