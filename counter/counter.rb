#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "cgi"
require "fileutils"

ROOT = File.expand_path(__dir__)
DATA_DIR = File.join(ROOT, "data")

def parse_query_string(query)
  result = Hash.new { |hash, key| hash[key] = [] }
  CGI.parse(query.to_s).each do |key, values|
    result[key].concat(values.map { |value| value.to_s })
  end
  result
end

def scalar_value(params, key)
  values = params[key]
  return "" unless values.is_a?(Array) && !values.empty?

  values.last.to_s
end

def first_non_empty(*values)
  values.each do |value|
    next if value.nil? || value == ""

    return value
  end
  ""
end

def simplify_params(params)
  params.keys.sort.each_with_object({}) do |key, result|
    values = params[key] || []
    result[key] = values.length > 1 ? values : (values.first || "")
  end
end

def parse_legacy_options(params)
  options = {}
  df = scalar_value(params, "df")
  dd = scalar_value(params, "dd")

  options["df"] = df unless df.empty?
  return options if dd.empty?

  parts = dd.split("|")
  options["dd"] = parts.shift.to_s
  parts.each do |part|
    next unless part.include?("=")

    key, value = part.split("=", 2)
    key = key.to_s.strip.downcase
    next if key.empty?

    options[key] = value.to_s.strip
  end

  options
end

def normalize_counter_key(raw)
  key = raw.to_s.strip.downcase.sub(/\.dat\z/i, "")
  key = key.gsub(/[^a-z0-9_.:()\-]+/i, "-").gsub(/\A-+|-+\z/, "")
  key = key[0, 120]
  key.nil? || key.empty? ? "default" : key
end

def resolve_counter_file(raw)
  File.join(DATA_DIR, "#{normalize_counter_key(raw)}.dat")
end

def relative_counter_file(path)
  path.sub(/\A#{Regexp.escape(ROOT)}\/?/, "")
end

def clamp_integer(raw, min, max, fallback)
  value = begin
    Integer(raw.to_s.strip, 10)
  rescue ArgumentError, TypeError
    fallback
  end
  [[value, min].max, max].min
end

def parse_legacy_bool(raw, default)
  text = raw.to_s.strip.upcase
  return default if text.empty?
  return true if %w[T TRUE 1 Y].include?(text)
  return false if %w[F FALSE 0 N].include?(text)

  default
end

def normalize_hex(raw)
  value = raw.to_s.strip
  value = "##{value}" if value.match?(/\A[0-9a-fA-F]{6}\z/)
  value.match?(/\A#[0-9a-fA-F]{6}\z/) ? value.downcase : "#000066"
end

def resolve_strip_name(raw)
  strip = raw.to_s.strip.split("|", 2).first.to_s.sub(/\.gif\z/i, "")
  strip.empty? ? "counter-strip" : strip
end

def strip_source_for(strip_name)
  "#{resolve_strip_name(strip_name)}.gif"
end

def format_count(count, digits, use_comma)
  text = [count.to_i, 0].max.to_s
  text = text.rjust(digits, "0")
  return text unless use_comma

  text.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
end

def normalize_callback_name(raw)
  callback = raw.to_s.strip
  return nil if callback.empty?
  return nil unless callback.match?(/\A[$A-Z_][0-9A-Z_$]*(?:\.[0-9A-Z_$]+)*\z/i)

  callback
end

def ensure_data_dir
  FileUtils.mkdir_p(DATA_DIR)
end

def read_and_update_count(path, increment_by)
  File.write(path, "0\n") unless File.exist?(path)

  count = 0
  File.open(path, File::RDWR) do |file|
    file.flock(File::LOCK_EX)
    file.rewind
    contents = file.read.to_s
    count = contents[/\d+/].to_i
    count = 0 if count.negative?

    if increment_by.positive?
      count += increment_by
      file.rewind
      file.truncate(0)
      file.write("#{count}\n")
      file.flush
    end
  ensure
    file.flock(File::LOCK_UN) if file
  end
  count
end

query_string = ""
ARGV.each_with_index do |argument, index|
  if argument == "--query" && ARGV[index + 1]
    query_string = ARGV[index + 1]
    break
  end
end
query_string = ENV["QUERY_STRING"].to_s if query_string.empty?

params = parse_query_string(query_string)
legacy = parse_legacy_options(params)
strip_name = resolve_strip_name(first_non_empty(scalar_value(params, "strip"), legacy["dd"], scalar_value(params, "dd"), "counter-strip"))
key = first_non_empty(scalar_value(params, "key"), legacy["df"], scalar_value(params, "df"), "default")
increment = first_non_empty(scalar_value(params, "increment"), "1") != "0"
step = clamp_integer(first_non_empty(scalar_value(params, "step"), "1"), 0, 1000, 1)
digits = clamp_integer(first_non_empty(scalar_value(params, "digits"), "4"), 1, 12, 4)
comma = parse_legacy_bool(first_non_empty(legacy["comma"], scalar_value(params, "comma"), "1"), true)
frame_color = normalize_hex(first_non_empty(legacy["frgb"], scalar_value(params, "frgb"), "#000066"))
frame_thickness = clamp_integer(first_non_empty(legacy["ft"], scalar_value(params, "ft"), "0"), 0, 6, 0)
text_override = first_non_empty(scalar_value(params, "text"), "")
callback = normalize_callback_name(scalar_value(params, "callback"))

ensure_data_dir
counter_file = resolve_counter_file(key)
count = read_and_update_count(counter_file, increment ? step : 0)
display_text = text_override.empty? ? format_count(count, digits, comma) : text_override

payload = {
  count: count,
  counterFile: relative_counter_file(counter_file),
  rawParams: simplify_params(params),
  legacyOptions: legacy,
  normalized: {
    key: normalize_counter_key(key),
    df: scalar_value(params, "df"),
    dd: scalar_value(params, "dd"),
    strip: strip_name,
    stripSrc: strip_source_for(strip_name),
    digits: digits,
    increment: increment,
    step: step,
    comma: comma,
    frgb: frame_color,
    ft: frame_thickness,
    text: text_override,
    displayText: display_text
  }
}

json = JSON.generate(payload)

if callback
  puts "Content-Type: application/javascript; charset=utf-8\r\nCache-Control: no-store, no-cache, must-revalidate, max-age=0\r\nPragma: no-cache\r\n\r\n#{callback}(#{json});"
else
  puts "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store, no-cache, must-revalidate, max-age=0\r\nPragma: no-cache\r\n\r\n#{json}"
end
