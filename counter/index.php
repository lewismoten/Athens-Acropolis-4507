<?php
declare(strict_types=1);

$storageDirectory = __DIR__ . '/data';
$legacyOptions = parseLegacyCounterOptions($_GET);
$stripPath = resolveStripPath($_GET['strip'] ?? ($legacyOptions['dd'] ?? ($_GET['dd'] ?? '')));
$counterFile = resolveCounterFilePath($storageDirectory, $_GET['key'] ?? ($legacyOptions['df'] ?? ($_GET['df'] ?? 'default')));
$minimumDigits = clampInteger($_GET['digits'] ?? '4', 1, 12, 4);
$shouldIncrement = ($_GET['increment'] ?? '1') !== '0';
$step = clampInteger($_GET['step'] ?? '1', 0, 1000, 1);
$useComma = parseLegacyBoolean($legacyOptions['comma'] ?? ($_GET['comma'] ?? '1'), true);
$frameColor = normalizeOptionalColor($legacyOptions['frgb'] ?? ($_GET['frgb'] ?? ''));
$frameThickness = clampInteger($legacyOptions['ft'] ?? ($_GET['ft'] ?? '0'), 0, 6, 0);
$textOverride = isset($_GET['text']) ? (string) $_GET['text'] : '';

ensureStorageDirectory($storageDirectory);
ensureCounterFile($counterFile);
$count = readAndUpdateCount($counterFile, $shouldIncrement ? $step : 0);

renderCounterImage($count, $minimumDigits, $stripPath, $useComma, $frameColor, $frameThickness, $textOverride);

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
    int $frameThickness,
    string $textOverride
): void
{
    $layout = loadStripLayout($stripPath);
    $text = formatCounterText($count, $minimumDigits, $useComma);
    $tokens = tokenizeDisplayText($textOverride !== '' ? $textOverride : $text, $layout['tokens']);
    $strip = loadCounterStrip($stripPath);

    if ($strip === false) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Unable to load counter strip.';
        return;
    }

    $glyphHeight = imagesy($strip);
    $tokenIndex = array_flip($layout['tokens']);
    $defaultIndex = $tokenIndex['0'] ?? 0;
    $imageWidth = 0;

    foreach ($tokens as $token) {
        $glyphIndex = $tokenIndex[$token] ?? $defaultIndex;
        $imageWidth += $layout['widths'][$glyphIndex];
    }

    $image = imagecreate($imageWidth, $glyphHeight);

    if ($image === false) {
        imagedestroy($strip);
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Unable to create counter image.';
        return;
    }

    $left = 0;

    foreach ($tokens as $token) {
        $sourceIndex = $tokenIndex[$token] ?? $defaultIndex;
        $sourceLeft = $layout['offsets'][$sourceIndex];
        $glyphWidth = $layout['widths'][$sourceIndex];

        imagecopy(
            $image,
            $strip,
            $left,
            0,
            $sourceLeft,
            0,
            $glyphWidth,
            $glyphHeight
        );

        $left += $glyphWidth;
    }

    if ($frameThickness > 0) {
        $framed = applyFrameThickness($image, $frameColor ?? '#666666', $frameThickness);
        imagedestroy($image);
        $image = $framed;
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

function loadStripLayout(string $stripPath): array
{
    $metadataPath = preg_replace('/\.gif$/i', '.meta.json', $stripPath) ?: ($stripPath . '.meta.json');

    if (is_file($metadataPath)) {
        $json = file_get_contents($metadataPath);
        $data = json_decode((string) $json, true);
        $layout = parseStripMetadata($data);

        if ($layout !== null) {
            return $layout;
        }
    }

    $tokens = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ','];
    $width = 15;
    $offsets = [];

    for ($index = 0; $index < count($tokens); $index += 1) {
        $offsets[] = $index * $width;
    }

    return [
        'tokens' => $tokens,
        'widths' => array_fill(0, count($tokens), $width),
        'offsets' => $offsets,
    ];
}

function parseStripMetadata($data): ?array
{
    if (!is_array($data)) {
        return null;
    }

    if (isset($data['tokens'], $data['widths']) && is_array($data['tokens']) && is_array($data['widths']) && count($data['tokens']) === count($data['widths'])) {
        $offsets = isset($data['offsets']) && is_array($data['offsets']) ? array_map('intval', array_values($data['offsets'])) : [];

        if (count($offsets) !== count($data['widths'])) {
            $offsets = [];
            $left = 0;

            foreach ($data['widths'] as $width) {
                $offsets[] = $left;
                $left += (int) $width;
            }
        }

        return [
            'tokens' => array_values($data['tokens']),
            'widths' => array_map('intval', array_values($data['widths'])),
            'offsets' => $offsets,
        ];
    }

    if (!isset($data['base']) || !is_array($data['base']) || !isset($data['base']['tokens']) || !is_array($data['base']['tokens'])) {
        return null;
    }

    $tokens = array_values($data['base']['tokens']);
    $baseWidth = (int) ($data['base']['width'] ?? 0);

    if ($tokens === [] || $baseWidth <= 0) {
        return null;
    }

    $baseAdvance = (int) ($data['base']['advance'] ?? $baseWidth);
    $left = (int) ($data['base']['offset'] ?? 0);
    $widths = [];
    $offsets = [];

    foreach ($tokens as $token) {
        $entry = $data[$token] ?? null;
        $width = $baseWidth;
        $offset = $left;
        $advance = $baseAdvance;

        if (is_int($entry) || is_float($entry) || (is_string($entry) && is_numeric($entry))) {
            $width = (int) $entry;
            $advance = $width;
        } elseif (is_array($entry)) {
            $width = (int) ($entry['width'] ?? $baseWidth);
            $offset = (int) ($entry['offset'] ?? $left);
            $advance = (int) ($entry['advance'] ?? $width);
        }

        $widths[] = $width;
        $offsets[] = $offset;
        $left = $offset + $advance;
    }

    return [
        'tokens' => $tokens,
        'widths' => $widths,
        'offsets' => $offsets,
    ];
}

function tokenizeDisplayText(string $text, array $availableTokens): array
{
    $tokens = [];
    $text = (string) $text;
    $index = 0;
    $tokenLookup = array_fill_keys($availableTokens, true);
    $length = strlen($text);

    while ($index < $length) {
        $pair = strtolower(substr($text, $index, 2));

        if (($pair === 'am' || $pair === 'pm') && isset($tokenLookup[$pair])) {
            $tokens[] = $pair;
            $index += 2;
            continue;
        }

        $character = $text[$index];

        if (isset($tokenLookup[$character])) {
            $tokens[] = $character;
        }

        $index += 1;
    }

    if ($tokens === []) {
        $tokens[] = in_array('0', $availableTokens, true) ? '0' : $availableTokens[0];
    }

    return $tokens;
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
    $normalized = preg_replace('/[^@a-z0-9()_\-]+/i', '', strtolower($style)) ?? '';
    $candidateNames = [];

    if ($normalized !== '') {
        if (substr($normalized, -4) !== '.gif') {
            $candidateNames[] = $normalized . '.gif';
        } else {
            $candidateNames[] = $normalized;
        }
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

function applyFrameThickness($image, string $hexColor, int $thickness)
{
    $sourceWidth = imagesx($image);
    $sourceHeight = imagesy($image);
    $framedWidth = $sourceWidth + ($thickness * 2);
    $framedHeight = $sourceHeight + ($thickness * 2);
    $framed = imagecreate($framedWidth, $framedHeight);
    [$red, $green, $blue] = hexToRgb($hexColor);
    $transparent = imagecolorallocate($framed, 255, 0, 255);
    $color = imagecolorallocate($framed, $red, $green, $blue);

    imagefill($framed, 0, 0, $transparent);
    imagecolortransparent($framed, $transparent);
    imagecopy($framed, $image, $thickness, $thickness, 0, 0, $sourceWidth, $sourceHeight);

    for ($line = 0; $line < $thickness; $line += 1) {
        imagerectangle($framed, $line, $line, $framedWidth - 1 - $line, $framedHeight - 1 - $line, $color);
    }

    return $framed;
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
