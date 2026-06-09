<?php
declare(strict_types=1);

$outputPath = __DIR__ . '/counter-strip.gif';
$metadataPath = __DIR__ . '/counter-strip.meta.json';
$templatePath = dirname(__DIR__) . '/count.gif';
$fontPath = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
$height = 20;
$glyphSpecs = [
    ['token' => '0', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '1', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '2', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '3', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '4', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '5', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '6', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '7', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '8', 'width' => 15, 'fontSize' => 14.0],
    ['token' => '9', 'width' => 15, 'fontSize' => 14.0],
    ['token' => ':', 'width' => 10, 'fontSize' => 14.0],
    ['token' => 'am', 'width' => 24, 'fontSize' => 9.5],
    ['token' => 'pm', 'width' => 24, 'fontSize' => 9.5],
    ['token' => ',', 'width' => 11, 'fontSize' => 14.0],
    ['token' => '-', 'width' => 11, 'fontSize' => 14.0],
];

$template = imagecreatefromgif($templatePath);
$totalWidth = array_sum(array_map(static fn (array $spec): int => $spec['width'], $glyphSpecs));
$image = imagecreate($totalWidth, $height);

if ($template === false || $image === false) {
    fwrite(STDERR, "Unable to create strip image.\n");
    exit(1);
}

$textColor = imagecolorallocate($image, 255, 255, 255);
$softWhite = imagecolorallocate($image, 220, 220, 220);
$innerDark = imagecolorallocate($image, 0, 0, 0);
$left = 0;

foreach ($glyphSpecs as $spec) {
    $token = $spec['token'];
    $width = $spec['width'];

    imagecopy($image, $template, $left, 0, 0, 0, min(15, $width), $height);

    if ($width > 15) {
        imagefilledrectangle($image, $left + 15, 0, $left + $width - 1, $height - 1, imagecolorat($template, 14, 0));
    }

    imagefilledrectangle($image, $left + 2, 2, $left + $width - 3, $height - 3, $innerDark);
    if (in_array($token, [':', ',', '-'], true)) {
        imagefilledrectangle($image, $left, 0, $left + 1, $height - 1, $innerDark);
        imagefilledrectangle($image, $left + 2, 2, $left + 2, $height - 3, $innerDark);
        imagefilledrectangle($image, $left + $width - 3, 2, $left + $width - 3, $height - 3, $innerDark);
        imagefilledrectangle($image, $left + $width - 2, 0, $left + $width - 1, $height - 1, $innerDark);
    }
    drawGlyph($image, $token, $left, $width, $height, $fontPath, (float) $spec['fontSize'], $textColor, $softWhite);
    $left += $width;
}

imagegif($image, $outputPath);
file_put_contents(
    $metadataPath,
    json_encode(buildCompactMetadata($glyphSpecs), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
);

imagedestroy($image);
imagedestroy($template);

fwrite(STDOUT, "Wrote {$outputPath}\n");

function buildCompactMetadata(array $glyphSpecs): array
{
    $tokens = array_map(static fn (array $spec): string => $spec['token'], $glyphSpecs);
    $baseWidth = (int) ($glyphSpecs[0]['width'] ?? 15);
    $metadata = [
        'base' => [
            'tokens' => $tokens,
            'width' => $baseWidth,
        ],
    ];

    foreach ($glyphSpecs as $spec) {
        if ((int) $spec['width'] !== $baseWidth) {
            $metadata[$spec['token']] = (int) $spec['width'];
        }
    }

    return $metadata;
}

function drawGlyph($image, string $glyph, int $left, int $cellWidth, int $height, string $fontPath, float $fontSize, int $textColor, int $softWhite): void
{
    if ($glyph === ',') {
        drawCommaGlyph($image, $left, $textColor, $softWhite);
        return;
    }

    if ($glyph === ':') {
        drawColonGlyph($image, $left, $cellWidth, $textColor, $softWhite);
        return;
    }

    if ($glyph === '-') {
        drawDashGlyph($image, $left, $cellWidth, $textColor, $softWhite);
        return;
    }

    if ($glyph === 'am' || $glyph === 'pm') {
        drawWordGlyph($image, $glyph, $left, $cellWidth, $textColor, $softWhite);
        return;
    }

    $target = getGlyphTargetBox($glyph, $cellWidth);
    $rendered = renderGlyphMask($glyph, $fontPath, $fontSize, $cellWidth, $height);
    $temp = $rendered['image'];

    if ($temp === false) {
        return;
    }

    imagecopyresized(
        $image,
        $temp,
        $left + $target['x'],
        $target['y'],
        $rendered['minX'],
        $rendered['minY'],
        $target['width'],
        $target['height'],
        max(1, $rendered['width']),
        max(1, $rendered['height'])
    );
    imagedestroy($temp);
}

function drawCommaGlyph($image, int $left, int $textColor, int $softWhite): void
{
    $points = [
        [7, 11], [8, 11],
        [7, 12], [8, 12],
        [6, 13], [7, 13],
        [6, 14],
    ];
    $highlight = [
        [7, 10], [8, 10],
        [6, 11],
    ];

    foreach ($highlight as $point) {
        imagesetpixel($image, $left + $point[0], $point[1], $softWhite);
    }

    foreach ($points as $point) {
        imagesetpixel($image, $left + $point[0], $point[1], $textColor);
    }
}

function drawColonGlyph($image, int $left, int $cellWidth, int $textColor, int $softWhite): void
{
    $center = $left + intdiv($cellWidth, 2) - 1;
    $dots = [
        [$center, 7], [$center + 1, 7],
        [$center, 8], [$center + 1, 8],
        [$center, 12], [$center + 1, 12],
        [$center, 13], [$center + 1, 13],
    ];
    $highlight = [
        [$center, 6], [$center + 1, 6],
        [$center, 11], [$center + 1, 11],
    ];

    foreach ($highlight as [$x, $y]) {
        imagesetpixel($image, $x, $y, $softWhite);
    }

    foreach ($dots as [$x, $y]) {
        imagesetpixel($image, $x, $y, $textColor);
    }
}

function drawDashGlyph($image, int $left, int $cellWidth, int $textColor, int $softWhite): void
{
    $start = $left + 3;
    $end = $left + $cellWidth - 4;

    for ($x = $start; $x <= $end; $x += 1) {
        imagesetpixel($image, $x, 10, $softWhite);
        imagesetpixel($image, $x, 11, $textColor);
    }
}

function drawWordGlyph($image, string $glyph, int $left, int $cellWidth, int $textColor, int $softWhite): void
{
    $bitmaps = [
        'a' => [
            '0110',
            '0001',
            '0111',
            '1001',
            '0111',
        ],
        'm' => [
            '11010',
            '10101',
            '10101',
            '10101',
            '10101',
        ],
        'p' => [
            '1110',
            '1001',
            '1110',
            '1000',
            '1000',
        ],
    ];
    $letters = str_split($glyph);
    $letterWidths = [];
    $spacing = 1;
    $top = 8;
    $totalWidth = 0;
    $x = 0;

    foreach ($letters as $letter) {
        $bitmap = $bitmaps[$letter] ?? ['0'];
        $width = strlen($bitmap[0]);
        $letterWidths[] = $width;
        $totalWidth += $width;
    }

    if (count($letters) > 1) {
        $totalWidth += $spacing * (count($letters) - 1);
    }

    $x = $left + max(1, intdiv($cellWidth - $totalWidth, 2));

    foreach ($letters as $index => $letter) {
        drawBitmapGlyph($image, $bitmaps[$letter], $x, $top, $textColor, $softWhite);
        $x += $letterWidths[$index] + $spacing;
    }
}

function drawBitmapGlyph($image, array $rows, int $left, int $top, int $textColor, int $softWhite): void
{
    $height = count($rows);
    $width = strlen($rows[0]);
    $lit = [];
    $lookup = [];

    for ($y = 0; $y < $height; $y += 1) {
        for ($x = 0; $x < $width; $x += 1) {
            if ($rows[$y][$x] === '1') {
                $lookup[$x . ',' . $y] = true;
                $lit[] = [$x, $y];
            }
        }
    }

    foreach ($lit as [$x, $y]) {
        if (!isset($lookup[$x . ',' . ($y - 1)]) && $y > 0) {
            imagesetpixel($image, $left + $x, $top + $y - 1, $softWhite);
        }
        if (!isset($lookup[($x - 1) . ',' . $y]) && $x > 0 && !isset($lookup[$x . ',' . ($y - 1)])) {
            imagesetpixel($image, $left + $x - 1, $top + $y, $softWhite);
        }
    }

    foreach ($lit as [$x, $y]) {
        imagesetpixel($image, $left + $x, $top + $y, $textColor);
    }
}

function renderGlyphMask(string $glyph, string $fontPath, float $fontSize, int $cellWidth, int $height): array
{
    $tempWidth = max(40, $cellWidth * 2);
    $tempHeight = max(30, $height + 10);
    $temp = imagecreatetruecolor($tempWidth, $tempHeight);
    $black = imagecolorallocate($temp, 0, 0, 0);
    $shadow = imagecolorallocate($temp, 220, 220, 220);
    $white = imagecolorallocate($temp, 255, 255, 255);
    $bbox = imagettfbbox($fontSize, 0, $fontPath, $glyph);
    $x = intdiv($tempWidth, 2) - (int) floor(($bbox[2] - $bbox[0]) / 2) - $bbox[0];
    $baselineY = $glyph === 'am' || $glyph === 'pm' ? 16 : 21;
    $minX = 999;
    $minY = 999;
    $maxX = -1;
    $maxY = -1;

    imagefilledrectangle($temp, 0, 0, $tempWidth - 1, $tempHeight - 1, $black);
    imagettftext($temp, $fontSize, 0, $x, $baselineY, $shadow, $fontPath, $glyph);
    imagettftext($temp, $fontSize, 0, $x, $baselineY - 1, $white, $fontPath, $glyph);

    for ($y = 0; $y < $tempHeight; $y += 1) {
        for ($xPos = 0; $xPos < $tempWidth; $xPos += 1) {
            $rgb = imagecolorat($temp, $xPos, $y) & 0xFFFFFF;
            if ($rgb !== 0x000000) {
                if ($xPos < $minX) {
                    $minX = $xPos;
                }
                if ($y < $minY) {
                    $minY = $y;
                }
                if ($xPos > $maxX) {
                    $maxX = $xPos;
                }
                if ($y > $maxY) {
                    $maxY = $y;
                }
            }
        }
    }

    if ($maxX < $minX || $maxY < $minY) {
        return [
            'image' => $temp,
            'minX' => 0,
            'minY' => 0,
            'width' => 1,
            'height' => 1,
        ];
    }

    return [
        'image' => $temp,
        'minX' => $minX,
        'minY' => $minY,
        'width' => ($maxX - $minX) + 1,
        'height' => ($maxY - $minY) + 1,
    ];
}

function getGlyphTargetBox(string $glyph, int $cellWidth): array
{
    $map = [
        '0' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '1' => ['x' => 4, 'y' => 4, 'width' => 7, 'height' => 12],
        '2' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '3' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '4' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 13],
        '5' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '6' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '7' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '8' => ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12],
        '9' => ['x' => 3, 'y' => 4, 'width' => 8, 'height' => 13],
    ];

    return $map[$glyph] ?? ['x' => 3, 'y' => 4, 'width' => max(6, $cellWidth - 6), 'height' => 12];
}
