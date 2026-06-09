<%@ Page Language="C#" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.Collections.Generic" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Text" %>
<%@ Import Namespace="System.Text.RegularExpressions" %>
<%@ Import Namespace="System.Web.Script.Serialization" %>

<script runat="server">
private static readonly object CounterLock = new object();

protected void Page_Load(object sender, EventArgs e)
{
    Response.Buffer = true;
    Response.Expires = -1;
    Response.CacheControl = "no-cache";
    Response.AddHeader("Pragma", "no-cache");

    string rootPath = Server.MapPath(".");
    string dataDir = Path.Combine(rootPath, "data");
    EnsureDataDirectory(dataDir);

    var rawParams = ParseRawParams();
    var legacy = ParseLegacyOptions(GetScalar(rawParams, "dd"), GetScalar(rawParams, "df"));

    string stripName = ResolveStripName(FirstNonEmpty(
        GetScalar(rawParams, "strip"),
        GetLegacyValue(legacy, "dd"),
        GetScalar(rawParams, "dd"),
        "counter-strip"
    ));
    string key = FirstNonEmpty(
        GetScalar(rawParams, "key"),
        GetLegacyValue(legacy, "df"),
        GetScalar(rawParams, "df"),
        "default"
    );

    bool increment = FirstNonEmpty(GetScalar(rawParams, "increment"), "1") != "0";
    int step = ClampInteger(FirstNonEmpty(GetScalar(rawParams, "step"), "1"), 0, 1000, 1);
    int digits = ClampInteger(FirstNonEmpty(GetScalar(rawParams, "digits"), "4"), 1, 12, 4);
    bool comma = ParseLegacyBool(FirstNonEmpty(GetLegacyValue(legacy, "comma"), GetScalar(rawParams, "comma"), "1"), true);
    string frameColor = NormalizeHex(FirstNonEmpty(GetLegacyValue(legacy, "frgb"), GetScalar(rawParams, "frgb"), "#000066"));
    int frameThickness = ClampInteger(FirstNonEmpty(GetLegacyValue(legacy, "ft"), GetScalar(rawParams, "ft"), "0"), 0, 6, 0);
    string textOverride = FirstNonEmpty(GetScalar(rawParams, "text"), "");
    string counterFile = ResolveCounterFile(dataDir, key);
    long count = ReadAndUpdateCount(counterFile, increment ? step : 0);
    string displayText = textOverride.Length > 0 ? textOverride : FormatCount(count, digits, comma);
    string callback = NormalizeCallbackName(GetScalar(rawParams, "callback"));

    var payload = new Dictionary<string, object>
    {
        ["count"] = count,
        ["counterFile"] = RelativeCounterFile(counterFile, rootPath),
        ["rawParams"] = SimplifyRawParams(rawParams),
        ["legacyOptions"] = legacy,
        ["normalized"] = new Dictionary<string, object>
        {
            ["key"] = NormalizeCounterKey(key),
            ["df"] = GetScalar(rawParams, "df"),
            ["dd"] = GetScalar(rawParams, "dd"),
            ["strip"] = stripName,
            ["stripSrc"] = StripSourceFor(stripName),
            ["digits"] = digits,
            ["increment"] = increment,
            ["step"] = step,
            ["comma"] = comma,
            ["frgb"] = frameColor,
            ["ft"] = frameThickness,
            ["text"] = textOverride,
            ["displayText"] = displayText
        }
    };

    string json = new JavaScriptSerializer().Serialize(payload);

    if (!string.IsNullOrEmpty(callback))
    {
        Response.ContentType = "application/javascript; charset=utf-8";
        Response.Write(callback + "(" + json + ");");
        return;
    }

    Response.ContentType = "application/json; charset=utf-8";
    Response.Write(json);
}

private Dictionary<string, List<string>> ParseRawParams()
{
    var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
    foreach (string key in Request.QueryString.AllKeys)
    {
        if (key == null) continue;
        string[] values = Request.QueryString.GetValues(key) ?? new[] { "" };
        result[key] = new List<string>(values);
    }
    return result;
}

private Dictionary<string, object> SimplifyRawParams(Dictionary<string, List<string>> rawParams)
{
    var result = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
    foreach (string key in new SortedSet<string>(rawParams.Keys, StringComparer.OrdinalIgnoreCase))
    {
        List<string> values = rawParams[key];
        result[key] = values.Count > 1 ? (object)values.ToArray() : (values.Count == 1 ? values[0] : "");
    }
    return result;
}

private Dictionary<string, object> ParseLegacyOptions(string ddValue, string dfValue)
{
    var result = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
    if (!string.IsNullOrWhiteSpace(dfValue))
    {
        result["df"] = dfValue;
    }

    if (string.IsNullOrWhiteSpace(ddValue))
    {
        return result;
    }

    string[] parts = ddValue.Split('|');
    if (parts.Length > 0)
    {
        result["dd"] = parts[0];
    }

    for (int index = 1; index < parts.Length; index += 1)
    {
        string part = parts[index];
        int separator = part.IndexOf('=');
        if (separator <= 0) continue;
        string key = part.Substring(0, separator).Trim().ToLowerInvariant();
        string value = part.Substring(separator + 1).Trim();
        if (key.Length > 0)
        {
            result[key] = value;
        }
    }

    return result;
}

private string GetLegacyValue(Dictionary<string, object> legacy, string key)
{
    object value;
    return legacy.TryGetValue(key, out value) ? Convert.ToString(value) ?? "" : "";
}

private string GetScalar(Dictionary<string, List<string>> rawParams, string key)
{
    List<string> values;
    if (!rawParams.TryGetValue(key, out values) || values.Count == 0)
    {
        return "";
    }
    return values[values.Count - 1] ?? "";
}

private string FirstNonEmpty(params string[] values)
{
    foreach (string value in values)
    {
        if (!string.IsNullOrEmpty(value))
        {
            return value;
        }
    }
    return "";
}

private int ClampInteger(string rawValue, int minValue, int maxValue, int fallbackValue)
{
    int parsed;
    if (!int.TryParse((rawValue ?? "").Trim(), out parsed))
    {
        parsed = fallbackValue;
    }
    if (parsed < minValue) parsed = minValue;
    if (parsed > maxValue) parsed = maxValue;
    return parsed;
}

private bool ParseLegacyBool(string rawValue, bool defaultValue)
{
    string text = (rawValue ?? "").Trim().ToUpperInvariant();
    if (text.Length == 0) return defaultValue;
    if (text == "T" || text == "TRUE" || text == "1" || text == "Y") return true;
    if (text == "F" || text == "FALSE" || text == "0" || text == "N") return false;
    return defaultValue;
}

private string NormalizeHex(string rawValue)
{
    string value = (rawValue ?? "").Trim();
    if (Regex.IsMatch(value, "^[0-9A-Fa-f]{6}$"))
    {
        value = "#" + value;
    }
    return Regex.IsMatch(value, "^#[0-9A-Fa-f]{6}$") ? value.ToLowerInvariant() : "#000066";
}

private string ResolveStripName(string rawValue)
{
    string strip = (rawValue ?? "").Trim();
    int pipeIndex = strip.IndexOf('|');
    if (pipeIndex >= 0)
    {
        strip = strip.Substring(0, pipeIndex);
    }
    if (strip.EndsWith(".gif", StringComparison.OrdinalIgnoreCase))
    {
        strip = strip.Substring(0, strip.Length - 4);
    }
    return strip.Length == 0 ? "counter-strip" : strip;
}

private string StripSourceFor(string stripName)
{
    return ResolveStripName(stripName) + ".gif";
}

private string NormalizeCounterKey(string rawValue)
{
    string key = (rawValue ?? "").Trim().ToLowerInvariant();
    key = Regex.Replace(key, "\\.dat$", "", RegexOptions.IgnoreCase);
    key = Regex.Replace(key, "[^a-z0-9_.:()\\-]+", "-");
    key = key.Trim('-');
    if (key.Length == 0) key = "default";
    return key.Length > 120 ? key.Substring(0, 120) : key;
}

private string ResolveCounterFile(string dataDir, string rawValue)
{
    return Path.Combine(dataDir, NormalizeCounterKey(rawValue) + ".dat");
}

private void EnsureDataDirectory(string dataDir)
{
    if (!Directory.Exists(dataDir))
    {
        Directory.CreateDirectory(dataDir);
    }
}

private long ReadAndUpdateCount(string counterFile, int incrementBy)
{
    lock (CounterLock)
    {
        if (!File.Exists(counterFile))
        {
            File.WriteAllText(counterFile, "0\n");
        }

        string contents = File.ReadAllText(counterFile).Trim();
        long count;
        if (!long.TryParse(contents, out count) || count < 0)
        {
            count = 0;
        }

        if (incrementBy > 0)
        {
            count += incrementBy;
            File.WriteAllText(counterFile, count.ToString() + "\n");
        }

        return count;
    }
}

private string RelativeCounterFile(string counterFile, string rootPath)
{
    string prefix = rootPath.EndsWith("\\", StringComparison.Ordinal) ? rootPath : rootPath + "\\";
    if (counterFile.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
    {
        return counterFile.Substring(prefix.Length).Replace('\\', '/');
    }
    return counterFile.Replace('\\', '/');
}

private string FormatCount(long count, int digits, bool useComma)
{
    string text = Math.Max(count, 0).ToString().PadLeft(digits, '0');
    if (!useComma) return text;

    var parts = new List<string>();
    while (text.Length > 3)
    {
        parts.Insert(0, text.Substring(text.Length - 3));
        text = text.Substring(0, text.Length - 3);
    }
    parts.Insert(0, text);
    return string.Join(",", parts.ToArray());
}

private string NormalizeCallbackName(string rawValue)
{
    string callback = (rawValue ?? "").Trim();
    if (callback.Length == 0) return "";
    return Regex.IsMatch(callback, @"\A[$A-Z_][0-9A-Z_$]*(?:\.[0-9A-Z_$]+)*\z", RegexOptions.IgnoreCase) ? callback : "";
}
</script>
