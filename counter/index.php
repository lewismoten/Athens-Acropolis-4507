<?php
declare(strict_types=1);

$storageDirectory = __DIR__ . '/data';
$legacyOptions = parseLegacyCounterOptions($_GET);
$stripPath = resolveStripPath($legacyOptions['dd'] ?? ($_GET['dd'] ?? ''));
$counterFile = resolveCounterFilePath($storageDirectory, $_GET['key'] ?? ($legacyOptions['df'] ?? ($_GET['df'] ?? 'default')));
$minimumDigits = clampInteger($_GET['digits'] ?? '4', 1, 12, 4);
$shouldIncrement = ($_GET['increment'] ?? '1') !== '0';
$step = clampInteger($_GET['step'] ?? '1', 0, 1000, 1);
$useComma = parseLegacyBoolean($legacyOptions['comma'] ?? ($_GET['comma'] ?? '1'), true);
$frameColor = normalizeOptionalColor($legacyOptions['frgb'] ?? ($_GET['frgb'] ?? ''));
$frameThickness = clampInteger($legacyOptions['ft'] ?? ($_GET['ft'] ?? '0'), 0, 6, 0);

ensureStorageDirectory($storageDirectory);
ensureCounterFile($counterFile);
$count = readAndUpdateCount($counterFile, $shouldIncrement ? $step : 0);

renderCounterImage($count, $minimumDigits, $stripPath, $useComma, $frameColor, $frameThickness);

function normalizeCounterKey(string $value): string
{
    $key = trim($value);
    $key = preg_replace('/\.dat$/i', '', $key) ?? $key;
    $key = preg_replace('/[^a-z0-9_.:()\-]+/i', '-', $key) ?? 'default';
    $key = trim($key, '-');

    if ($key === '') {
        return 'default';
    }

    return strtolower(substr($key, 0, 120));
}

function clampInteger($value, int $min, int $max, int $fallback): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);

    if ($number === false) {
        $number = $fallback;
    }

    if ($number < $min) {
        return $min;
    }

    if ($number > $max) {
        return $max;
    }

    return $number;
}

function ensureStorageDirectory(string $storageDirectory): void
{
    if (!is_dir($storageDirectory)) {
        mkdir($storageDirectory, 0777, true);
    }
}

function resolveCounterFilePath(string $storageDirectory, string $value): string
{
    $key = normalizeCounterKey($value);

    if ($key === '' || $key === 'default') {
        $key = 'default';
    }

    return $storageDirectory . '/' . $key . '.dat';
}

function ensureCounterFile(string $counterFile): void
{
    if (!is_file($counterFile)) {
        file_put_contents($counterFile, "0\n", LOCK_EX);
    }
}

function readAndUpdateCount(string $counterFile, int $incrementBy): int
{
    $handle = fopen($counterFile, 'c+');
    $count = 0;

    if ($handle === false) {
        return $count;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return $count;
        }

        $contents = stream_get_contents($handle);
        $count = max(0, (int) trim((string) $contents));

        if ($incrementBy > 0) {
            $count += $incrementBy;
            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, (string) $count . "\n");
        }

        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }

    return $count;
}

function renderCounterImage(
    int $count,
    int $minimumDigits,
    string $stripPath,
    bool $useComma,
    ?string $frameColor,
    int $frameThickness
): void
{
    $text = formatCounterText($count, $minimumDigits, $useComma);
    $strip = loadCounterStrip($stripPath);
    $glyphs = getStripGlyphMap();

    if ($strip === false) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Unable to load counter strip.';
        return;
    }

    $glyphWidth = (int) imagesx($strip) / count($glyphs);
    $glyphHeight = imagesy($strip);
    $image = imagecreate($glyphWidth * strlen($text), $glyphHeight);

    if ($image === false) {
        imagedestroy($strip);
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Unable to create counter image.';
        return;
    }

    for ($index = 0; $index < strlen($text); $index += 1) {
        $character = $text[$index];
        $sourceIndex = $glyphs[$character] ?? $glyphs['0'];

        imagecopy(
            $image,
            $strip,
            $index * $glyphWidth,
            0,
            $sourceIndex * $glyphWidth,
            0,
            $glyphWidth,
            $glyphHeight
        );
    }

    if ($frameColor !== null) {
        tintFramePixels($image, $frameColor);
    }

    if ($frameThickness > 0) {
        applyFrameThickness($image, $glyphWidth, $glyphHeight, $frameColor ?? '#666666', $frameThickness);
    }

    header('Content-Type: image/gif');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    imagegif($image);
    imagedestroy($image);
    imagedestroy($strip);
}

function formatCounterText(int $count, int $minimumDigits, bool $useComma): string
{
    $padded = str_pad((string) max(0, $count), $minimumDigits, '0', STR_PAD_LEFT);
    $parts = [];

    if (!$useComma) {
        return $padded;
    }

    while (strlen($padded) > 3) {
        array_unshift($parts, substr($padded, -3));
        $padded = substr($padded, 0, -3);
    }

    array_unshift($parts, $padded);

    return implode(',', $parts);
}

function loadCounterStrip(string $stripPath)
{
    if (!is_file($stripPath)) {
        return false;
    }

    return @imagecreatefromgif($stripPath);
}

function getStripGlyphMap(): array
{
    return [
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
}

function parseLegacyCounterOptions(array $query): array
{
    $options = [];
    $dd = isset($query['dd']) ? (string) $query['dd'] : '';

    if (isset($query['df'])) {
        $options['df'] = (string) $query['df'];
    }

    if ($dd === '') {
        return $options;
    }

    $parts = explode('|', $dd);
    $options['dd'] = array_shift($parts) ?? '';

    foreach ($parts as $part) {
        if (strpos($part, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $part, 2);
        $key = strtolower(trim($key));
        $value = trim($value);

        if ($key !== '') {
            $options[$key] = $value;
        }
    }

    return $options;
}

function parseLegacyBoolean($value, bool $default): bool
{
    $text = strtoupper(trim((string) $value));

    if ($text === '') {
        return $default;
    }

    if ($text === 'T' || $text === 'TRUE' || $text === '1' || $text === 'Y') {
        return true;
    }

    if ($text === 'F' || $text === 'FALSE' || $text === '0' || $text === 'N') {
        return false;
    }

    return $default;
}

function normalizeOptionalColor(string $value): ?string
{
    $text = trim($value);

    if ($text === '') {
        return null;
    }

    $text = str_replace(';', '', $text);

    if (preg_match('/^[0-9a-f]{6}$/i', $text) === 1) {
        return '#' . strtolower($text);
    }

    if (preg_match('/^#[0-9a-f]{6}$/i', $text) === 1) {
        return strtolower($text);
    }

    return null;
}

function resolveStripPath(string $style): string
{
    $basePath = __DIR__ . '/counter-strip.gif';
    $style = trim($style);
    $normalized = preg_replace('/[^a-z0-9()_\-]+/i', '', strtolower($style)) ?? '';
    $candidateNames = [];

    if ($normalized !== '') {
        $candidateNames[] = $normalized . '.gif';
        $candidateNames[] = str_replace(['(', ')'], ['', ''], $normalized) . '.gif';
    }

    foreach ($candidateNames as $candidate) {
        $path = __DIR__ . '/' . $candidate;
        if (is_file($path)) {
            return $path;
        }
    }

    return $basePath;
}

function tintFramePixels($image, string $hexColor): void
{
    [$red, $green, $blue] = hexToRgb($hexColor);
    $width = imagesx($image);
    $height = imagesy($image);
    $protected = [
        '0,0,0' => true,
        '232,232,232' => true,
        '252,252,252' => true,
        '168,168,168' => true,
    ];
    $palette = [];

    for ($y = 0; $y < $height; $y += 1) {
        for ($x = 0; $x < $width; $x += 1) {
            $index = imagecolorat($image, $x, $y);
            $color = imagecolorsforindex($image, $index);
            $key = $color['red'] . ',' . $color['green'] . ',' . $color['blue'];
            $gray = $color['red'];

            if (isset($protected[$key]) || $color['red'] !== $color['green'] || $color['green'] !== $color['blue']) {
                continue;
            }

            if (!isset($palette[$key])) {
                $palette[$key] = imagecolorallocate(
                    $image,
                    (int) round(($gray / 255) * $red),
                    (int) round(($gray / 255) * $green),
                    (int) round(($gray / 255) * $blue)
                );
            }

            imagesetpixel($image, $x, $y, $palette[$key]);
        }
    }
}

function applyFrameThickness($image, int $glyphWidth, int $glyphHeight, string $hexColor, int $thickness): void
{
    [$red, $green, $blue] = hexToRgb($hexColor);
    $color = imagecolorallocate($image, $red, $green, $blue);
    $cells = intdiv(imagesx($image), $glyphWidth);

    for ($cell = 0; $cell < $cells; $cell += 1) {
        $left = $cell * $glyphWidth;
        $top = 0;
        $right = $left + $glyphWidth - 1;
        $bottom = $glyphHeight - 1;

        for ($line = 0; $line < $thickness; $line += 1) {
            imagerectangle($image, $left + $line, $top + $line, $right - $line, $bottom - $line, $color);
        }
    }
}

function hexToRgb(string $hexColor): array
{
    $hex = ltrim($hexColor, '#');

    return [
        hexdec(substr($hex, 0, 2)),
        hexdec(substr($hex, 2, 2)),
        hexdec(substr($hex, 4, 2)),
    ];
}
