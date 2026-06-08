<?php
declare(strict_types=1);

$outputPath = __DIR__ . '/counter-strip.gif';
$templatePath = dirname(__DIR__) . '/count.gif';
$fontPath = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
$cellWidth = 15;
$height = 20;
$fontSize = 14.0;
$glyphs = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ','];
$template = imagecreatefromgif($templatePath);
$image = imagecreate($cellWidth * count($glyphs), $height);

if ($template === false || $image === false) {
    fwrite(STDERR, "Unable to create strip image.\n");
    exit(1);
}

$textColor = imagecolorallocate($image, 255, 255, 255);
$softWhite = imagecolorallocate($image, 220, 220, 220);
$innerDark = imagecolorallocate($image, 0, 0, 0);

for ($index = 0; $index < count($glyphs); $index += 1) {
    $left = $index * $cellWidth;
    $glyph = $glyphs[$index];

    imagecopy($image, $template, $left, 0, 0, 0, $cellWidth, $height);
    imagefilledrectangle($image, $left + 2, 2, $left + $cellWidth - 3, $height - 3, $innerDark);
    drawGlyph($image, $glyph, $left, $cellWidth, $height, $fontPath, $fontSize, $textColor, $softWhite);
}

imagegif($image, $outputPath);
imagedestroy($image);
imagedestroy($template);

fwrite(STDOUT, "Wrote {$outputPath}\n");

function drawGlyph($image, string $glyph, int $left, int $cellWidth, int $height, string $fontPath, float $fontSize, int $textColor, int $softWhite): void
{
    if ($glyph === ',') {
        drawCommaGlyph($image, $left, $textColor, $softWhite);
        return;
    }

    $target = getGlyphTargetBox($glyph);
    $rendered = renderGlyphMask($glyph, $fontPath, $fontSize);
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
        [8, 11], [9, 11],
        [7, 12], [8, 12], [9, 12],
        [7, 13], [8, 13],
        [6, 14], [7, 14],
        [6, 15],
    ];
    $highlight = [
        [8, 10], [9, 10],
        [7, 11], [8, 11],
        [7, 12],
    ];

    foreach ($highlight as $point) {
        imagesetpixel($image, $left + $point[0], $point[1], $softWhite);
    }

    foreach ($points as $point) {
        imagesetpixel($image, $left + $point[0], $point[1], $textColor);
    }
}

function renderGlyphMask(string $glyph, string $fontPath, float $fontSize): array
{
    $temp = imagecreatetruecolor(30, 30);
    $black = imagecolorallocate($temp, 0, 0, 0);
    $shadow = imagecolorallocate($temp, 220, 220, 220);
    $white = imagecolorallocate($temp, 255, 255, 255);
    $bbox = imagettfbbox($fontSize, 0, $fontPath, $glyph);
    $x = 15 - (int) floor(($bbox[2] - $bbox[0]) / 2) - $bbox[0];
    $baselineY = 21;
    $minX = 999;
    $minY = 999;
    $maxX = -1;
    $maxY = -1;

    imagefilledrectangle($temp, 0, 0, 29, 29, $black);
    imagettftext($temp, $fontSize, 0, $x, $baselineY, $shadow, $fontPath, $glyph);
    imagettftext($temp, $fontSize, 0, $x, $baselineY - 1, $white, $fontPath, $glyph);

    for ($y = 0; $y < 30; $y += 1) {
        for ($xPos = 0; $xPos < 30; $xPos += 1) {
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

function getGlyphTargetBox(string $glyph): array
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

    return $map[$glyph] ?? ['x' => 3, 'y' => 4, 'width' => 9, 'height' => 12];
}
