package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"image"
	"image/color"
	"image/draw"
	"image/gif"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
)

type stripLayout struct {
	Tokens  []string `json:"tokens"`
	Widths  []int    `json:"widths"`
	Offsets []int
}

type compactStripBase struct {
	Tokens  []string `json:"tokens"`
	Width   int      `json:"width"`
	Offset  int      `json:"offset"`
	Advance int      `json:"advance"`
}

type compactStripEntry struct {
	Width   int `json:"width"`
	Offset  int `json:"offset"`
	Advance int `json:"advance"`
}

var (
	rootPath, _     = filepath.Abs(filepath.Dir(os.Args[0]))
	dataDir         = filepath.Join(rootPath, "data")
	defaultStrip    = filepath.Join(rootPath, "counter-strip.gif")
	defaultTokens   = []string{"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ","}
	protectedColors = map[[3]uint8]bool{
		{0, 0, 0}:       true,
		{232, 232, 232}: true,
		{252, 252, 252}: true,
		{168, 168, 168}: true,
	}
	keySanitizer   = regexp.MustCompile(`[^a-z0-9_.:()\-]+`)
	stripSanitizer = regexp.MustCompile(`[^@a-z0-9()_\-]+`)
)

func main() {
	queryArg := flag.String("query", "", "")
	outputArg := flag.String("output", "", "")
	noHeaders := flag.Bool("no-headers", false, "")
	flag.Parse()

	queryString := *queryArg
	if queryString == "" {
		queryString = os.Getenv("QUERY_STRING")
	}

	payload, err := buildCounterGIF(queryString)
	if err != nil {
		if *outputArg != "" {
			_ = os.WriteFile(*outputArg, []byte(err.Error()), 0o644)
			os.Exit(1)
		}
		io.WriteString(os.Stdout, "Status: 500 Internal Server Error\r\n")
		io.WriteString(os.Stdout, "Content-Type: text/plain; charset=utf-8\r\n\r\n")
		io.WriteString(os.Stdout, err.Error())
		os.Exit(1)
	}

	if *outputArg != "" {
		_ = os.WriteFile(*outputArg, payload, 0o644)
		return
	}

	if !*noHeaders {
		io.WriteString(os.Stdout, "Content-Type: image/gif\r\n")
		io.WriteString(os.Stdout, "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n")
		io.WriteString(os.Stdout, "Pragma: no-cache\r\n\r\n")
	}
	_, _ = os.Stdout.Write(payload)
}

func buildCounterGIF(queryString string) ([]byte, error) {
	values, _ := url.ParseQuery(queryString)
	legacy := parseLegacyOptions(values)
	stripPath := resolveStripPath(firstNonEmpty(values.Get("strip"), legacy["dd"], values.Get("dd")))
	counterFile := resolveCounterFile(firstNonEmpty(values.Get("key"), legacy["df"], values.Get("df"), "default"))
	digits := clampInt(values.Get("digits"), 1, 12, 4)
	increment := firstNonEmpty(values.Get("increment"), "1") != "0"
	step := clampInt(values.Get("step"), 0, 1000, 1)
	useComma := parseLegacyBool(firstNonEmpty(legacy["comma"], values.Get("comma"), "1"), true)
	frameColor := normalizeOptionalColor(firstNonEmpty(legacy["frgb"], values.Get("frgb")))
	frameThickness := clampInt(firstNonEmpty(legacy["ft"], values.Get("ft"), "0"), 0, 6, 0)
	textOverride := values.Get("text")

	_ = os.MkdirAll(dataDir, 0o755)
	count, err := readAndUpdateCount(counterFile, ternaryInt(increment, step, 0))
	if err != nil {
		return nil, err
	}

	layout, err := loadStripLayout(stripPath)
	if err != nil {
		return nil, err
	}

	text := formatCounterText(count, digits, useComma)
	var tokens []string
	if textOverride != "" {
		tokens = tokenizeDisplayText(textOverride, layout.Tokens)
	} else {
		tokens = tokenizeDisplayText(text, layout.Tokens)
	}

	imageResult, err := renderCounterImage(tokens, stripPath, layout, frameColor, frameThickness)
	if err != nil {
		return nil, err
	}

	var buffer bytes.Buffer
	if err := gif.Encode(&buffer, imageResult, nil); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func parseLegacyOptions(values url.Values) map[string]string {
	options := map[string]string{}
	if df := values.Get("df"); df != "" {
		options["df"] = df
	}
	dd := values.Get("dd")
	if dd == "" {
		return options
	}
	parts := strings.Split(dd, "|")
	options["dd"] = parts[0]
	for _, part := range parts[1:] {
		pair := strings.SplitN(part, "=", 2)
		if len(pair) != 2 {
			continue
		}
		key := strings.ToLower(strings.TrimSpace(pair[0]))
		value := strings.TrimSpace(pair[1])
		if key != "" {
			options[key] = value
		}
	}
	return options
}

func normalizeCounterKey(raw string) string {
	key := strings.TrimSpace(raw)
	key = strings.TrimSuffix(strings.ToLower(key), ".dat")
	key = keySanitizer.ReplaceAllString(key, "-")
	key = strings.Trim(key, "-")
	if key == "" {
		return "default"
	}
	if len(key) > 120 {
		return key[:120]
	}
	return key
}

func resolveCounterFile(raw string) string {
	key := normalizeCounterKey(raw)
	if key == "" {
		key = "default"
	}
	return filepath.Join(dataDir, key+".dat")
}

func readAndUpdateCount(counterFile string, incrementBy int) (int, error) {
	if _, err := os.Stat(counterFile); os.IsNotExist(err) {
		if err := os.WriteFile(counterFile, []byte("0\n"), 0o644); err != nil {
			return 0, err
		}
	}

	file, err := os.OpenFile(counterFile, os.O_RDWR, 0o644)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX); err != nil {
		return 0, err
	}
	defer syscall.Flock(int(file.Fd()), syscall.LOCK_UN)

	contents, err := io.ReadAll(file)
	if err != nil {
		return 0, err
	}
	count, _ := strconv.Atoi(strings.TrimSpace(string(contents)))
	if count < 0 {
		count = 0
	}

	if incrementBy > 0 {
		count += incrementBy
		if _, err := file.Seek(0, 0); err != nil {
			return 0, err
		}
		if err := file.Truncate(0); err != nil {
			return 0, err
		}
		if _, err := file.WriteString(strconv.Itoa(count) + "\n"); err != nil {
			return 0, err
		}
	}

	return count, nil
}

func clampInt(raw string, minValue int, maxValue int, fallback int) int {
	number, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil {
		number = fallback
	}
	if number < minValue {
		return minValue
	}
	if number > maxValue {
		return maxValue
	}
	return number
}

func parseLegacyBool(raw string, fallback bool) bool {
	text := strings.ToUpper(strings.TrimSpace(raw))
	switch text {
	case "T", "TRUE", "1", "Y":
		return true
	case "F", "FALSE", "0", "N":
		return false
	case "":
		return fallback
	default:
		return fallback
	}
}

func normalizeOptionalColor(raw string) *[3]uint8 {
	text := strings.ReplaceAll(strings.TrimSpace(raw), ";", "")
	if text == "" {
		return nil
	}
	if strings.HasPrefix(text, "#") {
		text = text[1:]
	}
	if len(text) != 6 {
		return nil
	}
	value, err := strconv.ParseUint(text, 16, 32)
	if err != nil {
		return nil
	}
	result := [3]uint8{uint8(value >> 16), uint8((value >> 8) & 0xFF), uint8(value & 0xFF)}
	return &result
}

func resolveStripPath(style string) string {
	normalized := stripSanitizer.ReplaceAllString(strings.ToLower(strings.TrimSpace(style)), "")
	candidates := []string{}
	if normalized != "" {
		if strings.HasSuffix(normalized, ".gif") {
			candidates = append(candidates, filepath.Join(rootPath, normalized))
		} else {
			candidates = append(candidates, filepath.Join(rootPath, normalized+".gif"))
		}
		candidates = append(candidates, filepath.Join(rootPath, strings.ReplaceAll(strings.ReplaceAll(normalized, "(", ""), ")", "")+".gif"))
	}
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return defaultStrip
}

func loadStripLayout(stripPath string) (stripLayout, error) {
	metadataPath := strings.TrimSuffix(stripPath, filepath.Ext(stripPath)) + ".meta.json"
	if contents, err := os.ReadFile(metadataPath); err == nil {
		if layout, ok := parseStripMetadata(contents); ok {
			return layout, nil
		}
	}

	file, err := os.Open(stripPath)
	if err != nil {
		return stripLayout{}, err
	}
	defer file.Close()

	source, err := gif.Decode(file)
	if err != nil {
		return stripLayout{}, err
	}
	glyphWidth := source.Bounds().Dx() / len(defaultTokens)
	widths := make([]int, len(defaultTokens))
	offsets := make([]int, len(defaultTokens))
	for index := range defaultTokens {
		widths[index] = glyphWidth
		offsets[index] = index * glyphWidth
	}
	return stripLayout{Tokens: append([]string{}, defaultTokens...), Widths: widths, Offsets: offsets}, nil
}

func parseStripMetadata(contents []byte) (stripLayout, bool) {
	var layout stripLayout
	if err := json.Unmarshal(contents, &layout); err == nil && len(layout.Tokens) == len(layout.Widths) && len(layout.Tokens) > 0 {
		if len(layout.Offsets) != len(layout.Widths) {
			layout.Offsets = layout.Offsets[:0]
			left := 0
			for _, width := range layout.Widths {
				layout.Offsets = append(layout.Offsets, left)
				left += width
			}
		}
		return layout, true
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(contents, &raw); err != nil {
		return stripLayout{}, false
	}

	var base compactStripBase
	if err := json.Unmarshal(raw["base"], &base); err != nil || len(base.Tokens) == 0 || base.Width <= 0 {
		return stripLayout{}, false
	}

	baseAdvance := base.Advance
	if baseAdvance <= 0 {
		baseAdvance = base.Width
	}

	result := stripLayout{
		Tokens: append([]string{}, base.Tokens...),
		Widths: make([]int, 0, len(base.Tokens)),
		Offsets: make([]int, 0, len(base.Tokens)),
	}

	left := base.Offset
	for _, token := range base.Tokens {
		width := base.Width
		offset := left
		advance := baseAdvance

		if entryRaw, ok := raw[token]; ok {
			var widthOnly int
			if err := json.Unmarshal(entryRaw, &widthOnly); err == nil {
				width = widthOnly
				advance = width
			} else {
				var entry compactStripEntry
				if err := json.Unmarshal(entryRaw, &entry); err == nil {
					if entry.Width > 0 {
						width = entry.Width
					}
					if entry.Offset != 0 || left == 0 {
						offset = entry.Offset
					}
					if entry.Advance > 0 {
						advance = entry.Advance
					} else {
						advance = width
					}
				}
			}
		}

		result.Widths = append(result.Widths, width)
		result.Offsets = append(result.Offsets, offset)
		left = offset + advance
	}

	return result, true
}

func tokenizeDisplayText(raw string, available []string) []string {
	tokenSet := map[string]bool{}
	for _, token := range available {
		tokenSet[token] = true
	}

	tokens := []string{}
	for index := 0; index < len(raw); {
		if index+2 <= len(raw) {
			pair := strings.ToLower(raw[index : index+2])
			if (pair == "am" || pair == "pm") && tokenSet[pair] {
				tokens = append(tokens, pair)
				index += 2
				continue
			}
		}
		character := raw[index : index+1]
		if tokenSet[character] {
			tokens = append(tokens, character)
		}
		index++
	}

	if len(tokens) == 0 {
		if tokenSet["0"] {
			return []string{"0"}
		}
		return []string{available[0]}
	}

	return tokens
}

func formatCounterText(count int, minimumDigits int, useComma bool) string {
	if count < 0 {
		count = 0
	}
	padded := strconv.Itoa(count)
	for len(padded) < minimumDigits {
		padded = "0" + padded
	}
	if !useComma {
		return padded
	}
	parts := []string{}
	for len(padded) > 3 {
		parts = append([]string{padded[len(padded)-3:]}, parts...)
		padded = padded[:len(padded)-3]
	}
	parts = append([]string{padded}, parts...)
	return strings.Join(parts, ",")
}

func renderCounterImage(tokens []string, stripPath string, layout stripLayout, frameColor *[3]uint8, frameThickness int) (image.Image, error) {
	file, err := os.Open(stripPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	source, err := gif.Decode(file)
	if err != nil {
		return nil, err
	}

	sourceRGBA := toRGBA(source)
	glyphHeight := sourceRGBA.Bounds().Dy()
	tokenIndex := map[string]int{}
	for index, token := range layout.Tokens {
		tokenIndex[token] = index
	}
	defaultIndex := tokenIndex["0"]

	imageWidth := 0
	for _, token := range tokens {
		glyphIndex, ok := tokenIndex[token]
		if !ok {
			glyphIndex = defaultIndex
		}
		imageWidth += layout.Widths[glyphIndex]
	}

	target := image.NewRGBA(image.Rect(0, 0, imageWidth, glyphHeight))
	left := 0
	for _, token := range tokens {
		glyphIndex, ok := tokenIndex[token]
		if !ok {
			glyphIndex = defaultIndex
		}
		width := layout.Widths[glyphIndex]
		srcRect := image.Rect(layout.Offsets[glyphIndex], 0, layout.Offsets[glyphIndex]+width, glyphHeight)
		draw.Draw(target, image.Rect(left, 0, left+width, glyphHeight), sourceRGBA, srcRect.Min, draw.Src)
		left += width
	}

	if frameThickness > 0 {
		target = applyFrameThickness(target, *valueOrDefault(frameColor, [3]uint8{102, 102, 102}), frameThickness)
	}

	return target, nil
}

func toRGBA(img image.Image) *image.RGBA {
	bounds := img.Bounds()
	rgba := image.NewRGBA(bounds)
	draw.Draw(rgba, bounds, img, bounds.Min, draw.Src)
	return rgba
}

func applyFrameThickness(img *image.RGBA, frame [3]uint8, thickness int) *image.RGBA {
	frameColor := color.RGBA{R: frame[0], G: frame[1], B: frame[2], A: 255}
	bounds := img.Bounds()
	framed := image.NewRGBA(image.Rect(0, 0, bounds.Dx()+(thickness*2), bounds.Dy()+(thickness*2)))
	draw.Draw(framed, image.Rect(thickness, thickness, thickness+bounds.Dx(), thickness+bounds.Dy()), img, bounds.Min, draw.Src)

	for line := 0; line < thickness; line++ {
		rect := image.Rect(line, line, framed.Bounds().Dx()-line, framed.Bounds().Dy()-line)
		strokeRect(framed, rect, frameColor)
	}

	return framed
}

func strokeRect(img *image.RGBA, rect image.Rectangle, c color.RGBA) {
	maxX := rect.Max.X - 1
	maxY := rect.Max.Y - 1
	for x := rect.Min.X; x <= maxX; x++ {
		img.SetRGBA(x, rect.Min.Y, c)
		img.SetRGBA(x, maxY, c)
	}
	for y := rect.Min.Y; y <= maxY; y++ {
		img.SetRGBA(rect.Min.X, y, c)
		img.SetRGBA(maxX, y, c)
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func ternaryInt(condition bool, whenTrue int, whenFalse int) int {
	if condition {
		return whenTrue
	}
	return whenFalse
}

func valueOrDefault(value *[3]uint8, fallback [3]uint8) *[3]uint8 {
	if value != nil {
		return value
	}
	return &fallback
}
