<?php
declare(strict_types=1);

$storagePath = __DIR__ . '/data/counts.json';
$stripPath = __DIR__ . '/counter-strip.gif';
$counterKey = normalizeCounterKey($_GET['key'] ?? 'default');
$minimumDigits = clampInteger($_GET['digits'] ?? '4', 1, 12, 4);
$shouldIncrement = ($_GET['increment'] ?? '1') !== '0';
$step = clampInteger($_GET['step'] ?? '1', 0, 1000, 1);

ensureStorageFile($storagePath);
$count = readAndUpdateCount($storagePath, $counterKey, $shouldIncrement ? $step : 0);

renderCounterImage($count, $minimumDigits, $stripPath);

function normalizeCounterKey(string $value): string
{
    $key = preg_replace('/[^a-z0-9_.:-]+/i', '-', trim($value)) ?? 'default';
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

function ensureStorageFile(string $storagePath): void
{
    $directory = dirname($storagePath);

    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    if (!is_file($storagePath)) {
        file_put_contents($storagePath, "{}\n", LOCK_EX);
    }
}

function readAndUpdateCount(string $storagePath, string $counterKey, int $incrementBy): int
{
    $handle = fopen($storagePath, 'c+');
    $counts = [];
    $count = 0;

    if ($handle === false) {
        return $count;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return $count;
        }

        $contents = stream_get_contents($handle);
        if (is_string($contents) && trim($contents) !== '') {
            $decoded = json_decode($contents, true);
            if (is_array($decoded)) {
                $counts = $decoded;
            }
        }

        $count = isset($counts[$counterKey]) ? max(0, (int) $counts[$counterKey]) : 0;

        if ($incrementBy > 0) {
            $count += $incrementBy;
            $counts[$counterKey] = $count;
            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($counts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
        }

        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }

    return $count;
}

function renderCounterImage(int $count, int $minimumDigits, string $stripPath): void
{
    $text = formatCounterText($count, $minimumDigits);
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

    header('Content-Type: image/gif');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    imagegif($image);
    imagedestroy($image);
    imagedestroy($strip);
}

function formatCounterText(int $count, int $minimumDigits): string
{
    $padded = str_pad((string) max(0, $count), $minimumDigits, '0', STR_PAD_LEFT);
    $parts = [];

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
