#!/usr/bin/env perl
use strict;
use warnings;
use Fcntl qw(:flock);
use JSON::PP;

my $ROOT = do {
    my $path = $0;
    $path =~ s{[^/]+$}{};
    $path =~ s{/$}{};
    $path eq '' ? '.' : $path;
};
my $DATA_DIR = "$ROOT/data";

my $query_string = '';
for (my $index = 0; $index < @ARGV; $index += 1) {
    if ($ARGV[$index] eq '--query' && defined $ARGV[$index + 1]) {
        $query_string = $ARGV[$index + 1];
        last;
    }
}
$query_string = $ENV{QUERY_STRING} // '' if $query_string eq '';

my $params = parse_query_string($query_string);
my $legacy = parse_legacy_options($params);
my $strip_name = resolve_strip_name(
    first_non_empty(
        scalar_value($params, 'strip'),
        $legacy->{dd},
        scalar_value($params, 'dd'),
        'counter-strip'
    )
);
my $key = first_non_empty(
    scalar_value($params, 'key'),
    $legacy->{df},
    scalar_value($params, 'df'),
    'default'
);
my $counter_file = resolve_counter_file($key);
my $increment = first_non_empty(scalar_value($params, 'increment'), '1') ne '0';
my $step = clamp_integer(first_non_empty(scalar_value($params, 'step'), '1'), 0, 1000, 1);
my $digits = clamp_integer(first_non_empty(scalar_value($params, 'digits'), '4'), 1, 12, 4);
my $comma = parse_legacy_bool(first_non_empty($legacy->{comma}, scalar_value($params, 'comma'), '1'), 1);
my $frame_color = normalize_hex(first_non_empty($legacy->{frgb}, scalar_value($params, 'frgb'), '#000066'));
my $frame_thickness = clamp_integer(first_non_empty($legacy->{ft}, scalar_value($params, 'ft'), '0'), 0, 6, 0);
my $text_override = first_non_empty(scalar_value($params, 'text'), '');
my $count = read_and_update_count($counter_file, $increment ? $step : 0);
my $callback = normalize_callback_name(scalar_value($params, 'callback'));
my $display_text = $text_override ne '' ? $text_override : format_count($count, $digits, $comma);

ensure_data_dir($DATA_DIR);

my %normalized = (
    key => normalize_counter_key($key),
    df => scalar_value($params, 'df'),
    dd => scalar_value($params, 'dd'),
    strip => $strip_name,
    stripSrc => strip_source_for($strip_name),
    digits => $digits + 0,
    increment => $increment ? JSON::PP::true : JSON::PP::false,
    step => $step + 0,
    comma => $comma ? JSON::PP::true : JSON::PP::false,
    frgb => $frame_color,
    ft => $frame_thickness + 0,
    text => $text_override,
    displayText => $display_text,
);

my %payload = (
    count => $count + 0,
    counterFile => relative_counter_file($counter_file),
    rawParams => simplify_params($params),
    legacyOptions => $legacy,
    normalized => \%normalized,
);

my $json = JSON::PP->new->ascii->canonical->encode(\%payload);

if ($callback) {
    print "Content-Type: application/javascript; charset=utf-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print $callback, '(', $json, ");";
} else {
    print "Content-Type: application/json; charset=utf-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print $json;
}

sub parse_query_string {
    my ($query) = @_;
    my %result;

    for my $pair (split /[&;]/, ($query // '')) {
        next if $pair eq '';
        my ($key, $value) = split /=/, $pair, 2;
        $key = url_decode($key // '');
        $value = url_decode($value // '');
        push @{ $result{$key} }, $value;
    }

    return \%result;
}

sub url_decode {
    my ($value) = @_;
    $value =~ tr/+/ /;
    $value =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    return $value;
}

sub scalar_value {
    my ($params, $key) = @_;
    return '' if !exists $params->{$key} || ref($params->{$key}) ne 'ARRAY' || !@{ $params->{$key} };
    return $params->{$key}->[-1];
}

sub simplify_params {
    my ($params) = @_;
    my %result;

    for my $key (sort keys %{$params}) {
        my @values = @{ $params->{$key} // [] };
        $result{$key} = @values > 1 ? \@values : ($values[0] // '');
    }

    return \%result;
}

sub parse_legacy_options {
    my ($params) = @_;
    my %options;
    my $dd = scalar_value($params, 'dd');
    my $df = scalar_value($params, 'df');

    $options{df} = $df if defined $df && $df ne '';
    return \%options if !defined $dd || $dd eq '';

    my @parts = split /\|/, $dd;
    $options{dd} = shift @parts;
    for my $part (@parts) {
        next if $part !~ /=/;
        my ($key, $value) = split /=/, $part, 2;
        $key = lc trim($key);
        $value = trim($value);
        $options{$key} = $value if $key ne '';
    }

    return \%options;
}

sub resolve_strip_name {
    my ($raw) = @_;
    my $strip = defined $raw ? trim($raw) : '';
    $strip = (split /\|/, $strip, 2)[0] if $strip =~ /\|/;
    $strip =~ s/\.gif$//i;
    return $strip eq '' ? 'counter-strip' : $strip;
}

sub strip_source_for {
    my ($strip_name) = @_;
    my $strip = resolve_strip_name($strip_name);
    return $strip . '.gif';
}

sub ensure_data_dir {
    my ($dir) = @_;
    return if -d $dir;
    mkdir $dir;
}

sub normalize_counter_key {
    my ($raw) = @_;
    my $key = defined $raw ? trim($raw) : '';
    $key =~ s/\.dat$//i;
    $key =~ s/[^a-z0-9_.:()\-]+/-/ig;
    $key =~ s/^-+//;
    $key =~ s/-+$//;
    $key = lc $key;
    $key = substr($key, 0, 120);
    return $key eq '' ? 'default' : $key;
}

sub resolve_counter_file {
    my ($raw) = @_;
    my $key = normalize_counter_key($raw);
    return "$DATA_DIR/$key.dat";
}

sub relative_counter_file {
    my ($path) = @_;
    $path =~ s/^\Q$ROOT\E\/?//;
    return $path;
}

sub read_and_update_count {
    my ($path, $increment_by) = @_;

    if (!-f $path) {
        open my $seed, '>', $path or die "Unable to seed counter file: $!";
        print {$seed} "0\n";
        close $seed;
    }

    open my $handle, '+<', $path or die "Unable to open counter file: $!";
    flock($handle, LOCK_EX) or die "Unable to lock counter file: $!";
    seek($handle, 0, 0);
    local $/;
    my $contents = <$handle>;
    my $count = defined $contents && $contents =~ /^\s*(\d+)/ ? $1 + 0 : 0;
    $count = 0 if $count < 0;

    if ($increment_by > 0) {
        $count += $increment_by;
        seek($handle, 0, 0);
        truncate($handle, 0) or die "Unable to truncate counter file: $!";
        print {$handle} $count, "\n";
    }

    flock($handle, LOCK_UN);
    close $handle;
    return $count;
}

sub clamp_integer {
    my ($raw, $min, $max, $fallback) = @_;
    my $number = defined $raw && $raw =~ /^\s*-?\d+\s*$/ ? int($raw) : $fallback;
    $number = $min if $number < $min;
    $number = $max if $number > $max;
    return $number;
}

sub parse_legacy_bool {
    my ($raw, $default_value) = @_;
    my $text = uc trim(defined $raw ? $raw : '');
    return $default_value if $text eq '';
    return 1 if $text eq 'T' || $text eq 'TRUE' || $text eq '1' || $text eq 'Y';
    return 0 if $text eq 'F' || $text eq 'FALSE' || $text eq '0' || $text eq 'N';
    return $default_value;
}

sub normalize_hex {
    my ($raw) = @_;
    my $value = trim(defined $raw ? $raw : '');
    return '#000066' if $value eq '';
    $value = '#' . $value if $value =~ /^[0-9A-Fa-f]{6}$/;
    return $value =~ /^#[0-9A-Fa-f]{6}$/ ? lc $value : '#000066';
}

sub format_count {
    my ($count, $digits, $use_comma) = @_;
    my $text = "$count";
    my @parts;

    $text = '0' if $text eq '';
    while (length($text) < $digits) {
        $text = '0' . $text;
    }

    return $text if !$use_comma;

    while (length($text) > 3) {
        unshift @parts, substr($text, -3);
        $text = substr($text, 0, length($text) - 3);
    }

    unshift @parts, $text;
    return join ',', @parts;
}

sub normalize_callback_name {
    my ($raw) = @_;
    return undef if !defined $raw;
    my $callback = trim($raw);
    return undef if $callback eq '';
    return undef if $callback !~ /\A[\$A-Z_][0-9A-Z_\$]*(?:\.[0-9A-Z_\$]+)*\z/i;
    return $callback;
}

sub first_non_empty {
    for my $value (@_) {
        next if !defined $value;
        return $value if $value ne '';
    }
    return '';
}

sub trim {
    my ($value) = @_;
    $value = '' if !defined $value;
    $value =~ s/^\s+//;
    $value =~ s/\s+$//;
    return $value;
}
