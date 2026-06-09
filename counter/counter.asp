<%
Option Explicit
Response.Buffer = True
Response.Expires = -1
Response.CacheControl = "no-cache"
Response.AddHeader "Pragma", "no-cache"

Dim rootPath, dataDir
rootPath = Server.MapPath(".")
dataDir = rootPath & "\data"

EnsureFolder dataDir

Dim keyValue, legacyOptions, queryDf, queryDd, queryStrip
Set legacyOptions = ParseLegacyOptions(Request.QueryString("dd"), Request.QueryString("df"))
queryDf = Request.QueryString("df")
queryDd = Request.QueryString("dd")
queryStrip = Request.QueryString("strip")

keyValue = FirstNonEmpty(Array(Request.QueryString("key"), GetDictionaryValue(legacyOptions, "df"), queryDf, "default"))

Dim counterFile, incrementEnabled, stepValue, countValue, callbackName
counterFile = ResolveCounterFile(dataDir, keyValue)
incrementEnabled = (FirstNonEmpty(Array(Request.QueryString("increment"), "1")) <> "0")
stepValue = ClampInteger(FirstNonEmpty(Array(Request.QueryString("step"), "1")), 0, 1000, 1)
countValue = ReadAndUpdateCount(counterFile, IIf(incrementEnabled, stepValue, 0))
callbackName = NormalizeCallbackName(Request.QueryString("callback"))

Dim stripName, digitsValue, commaValue, frameColor, frameThickness, textOverride, displayText
stripName = ResolveStripName(FirstNonEmpty(Array(queryStrip, GetDictionaryValue(legacyOptions, "dd"), queryDd, "counter-strip")))
digitsValue = ClampInteger(FirstNonEmpty(Array(Request.QueryString("digits"), "4")), 1, 12, 4)
commaValue = ParseLegacyBool(FirstNonEmpty(Array(GetDictionaryValue(legacyOptions, "comma"), Request.QueryString("comma"), "1")), True)
frameColor = NormalizeHex(FirstNonEmpty(Array(GetDictionaryValue(legacyOptions, "frgb"), Request.QueryString("frgb"), "#000066")))
frameThickness = ClampInteger(FirstNonEmpty(Array(GetDictionaryValue(legacyOptions, "ft"), Request.QueryString("ft"), "0")), 0, 6, 0)
textOverride = FirstNonEmpty(Array(Request.QueryString("text"), ""))
If textOverride <> "" Then
  displayText = textOverride
Else
  displayText = FormatCount(countValue, digitsValue, commaValue)
End If

Dim rawParamsJson, legacyJson, normalizedJson, payloadJson
rawParamsJson = BuildRawParamsJson()
legacyJson = BuildLegacyJson(legacyOptions)
normalizedJson = "{""key"":" & JsonString(NormalizeCounterKey(keyValue)) & _
  ",""df"":" & JsonString(queryDf) & _
  ",""dd"":" & JsonString(queryDd) & _
  ",""strip"":" & JsonString(stripName) & _
  ",""stripSrc"":" & JsonString(StripSourceFor(stripName)) & _
  ",""digits"":" & CStr(digitsValue) & _
  ",""increment"":" & JsonBool(incrementEnabled) & _
  ",""step"":" & CStr(stepValue) & _
  ",""comma"":" & JsonBool(commaValue) & _
  ",""frgb"":" & JsonString(frameColor) & _
  ",""ft"":" & CStr(frameThickness) & _
  ",""text"":" & JsonString(textOverride) & _
  ",""displayText"":" & JsonString(displayText) & "}"

payloadJson = "{""count"":" & CStr(countValue) & _
  ",""counterFile"":" & JsonString(RelativeCounterFile(counterFile, rootPath)) & _
  ",""legacyOptions"":" & legacyJson & _
  ",""normalized"":" & normalizedJson & _
  ",""rawParams"":" & rawParamsJson & "}"

If callbackName <> "" Then
  Response.ContentType = "application/javascript"
  Response.Write callbackName & "(" & payloadJson & ");"
Else
  Response.ContentType = "application/json"
  Response.Write payloadJson
End If

Function ParseLegacyOptions(ddValue, dfValue)
  Dim dict, parts, part, pair, i, keyName
  Set dict = Server.CreateObject("Scripting.Dictionary")
  If Trim(CStr(dfValue & "")) <> "" Then
    dict.Add "df", CStr(dfValue)
  End If
  If Trim(CStr(ddValue & "")) = "" Then
    Set ParseLegacyOptions = dict
    Exit Function
  End If

  parts = Split(CStr(ddValue), "|")
  If UBound(parts) >= 0 Then
    dict("dd") = parts(0)
  End If
  For i = 1 To UBound(parts)
    part = parts(i)
    If InStr(part, "=") > 0 Then
      pair = Split(part, "=", 2)
      keyName = LCase(Trim(pair(0)))
      If keyName <> "" Then
        dict(keyName) = Trim(pair(1))
      End If
    End If
  Next

  Set ParseLegacyOptions = dict
End Function

Function GetDictionaryValue(dict, keyName)
  If dict.Exists(keyName) Then
    GetDictionaryValue = dict.Item(keyName)
  Else
    GetDictionaryValue = ""
  End If
End Function

Sub EnsureFolder(folderPath)
  Dim fso
  Set fso = Server.CreateObject("Scripting.FileSystemObject")
  If Not fso.FolderExists(folderPath) Then
    fso.CreateFolder folderPath
  End If
End Sub

Function NormalizeCounterKey(rawValue)
  Dim value, i, ch, codePoint, result
  value = LCase(Trim(CStr(rawValue & "")))
  If Right(value, 4) = ".dat" Then
    value = Left(value, Len(value) - 4)
  End If
  result = ""
  For i = 1 To Len(value)
    ch = Mid(value, i, 1)
    codePoint = AscW(ch)
    If (codePoint >= 48 And codePoint <= 57) Or (codePoint >= 97 And codePoint <= 122) _
      Or ch = "_" Or ch = "." Or ch = ":" Or ch = "(" Or ch = ")" Or ch = "-" Then
      result = result & ch
    Else
      result = result & "-"
    End If
  Next
  Do While Left(result, 1) = "-"
    result = Mid(result, 2)
  Loop
  Do While Right(result, 1) = "-"
    result = Left(result, Len(result) - 1)
  Loop
  If result = "" Then
    result = "default"
  End If
  If Len(result) > 120 Then
    result = Left(result, 120)
  End If
  NormalizeCounterKey = result
End Function

Function ResolveCounterFile(folderPath, rawValue)
  ResolveCounterFile = folderPath & "\" & NormalizeCounterKey(rawValue) & ".dat"
End Function

Function ReadAndUpdateCount(filePath, incrementBy)
  Dim fso, textStream, contents, countValue
  Set fso = Server.CreateObject("Scripting.FileSystemObject")

  Application.Lock
  On Error Resume Next
  If Not fso.FileExists(filePath) Then
    Set textStream = fso.CreateTextFile(filePath, True)
    textStream.WriteLine "0"
    textStream.Close
  End If

  Set textStream = fso.OpenTextFile(filePath, 1, True)
  contents = Trim(textStream.ReadAll)
  textStream.Close

  If IsNumeric(contents) Then
    countValue = CLng(contents)
  Else
    countValue = 0
  End If
  If countValue < 0 Then
    countValue = 0
  End If

  If incrementBy > 0 Then
    countValue = countValue + incrementBy
    Set textStream = fso.OpenTextFile(filePath, 2, True)
    textStream.WriteLine CStr(countValue)
    textStream.Close
  End If
  On Error GoTo 0
  Application.UnLock

  ReadAndUpdateCount = countValue
End Function

Function ClampInteger(rawValue, minValue, maxValue, fallbackValue)
  Dim numberValue
  If IsNumeric(Trim(CStr(rawValue & ""))) Then
    numberValue = CLng(rawValue)
  Else
    numberValue = fallbackValue
  End If
  If numberValue < minValue Then numberValue = minValue
  If numberValue > maxValue Then numberValue = maxValue
  ClampInteger = numberValue
End Function

Function ParseLegacyBool(rawValue, defaultValue)
  Dim text
  text = UCase(Trim(CStr(rawValue & "")))
  If text = "" Then
    ParseLegacyBool = defaultValue
  ElseIf text = "T" Or text = "TRUE" Or text = "1" Or text = "Y" Then
    ParseLegacyBool = True
  ElseIf text = "F" Or text = "FALSE" Or text = "0" Or text = "N" Then
    ParseLegacyBool = False
  Else
    ParseLegacyBool = defaultValue
  End If
End Function

Function NormalizeHex(rawValue)
  Dim value
  value = Trim(CStr(rawValue & ""))
  If value = "" Then
    NormalizeHex = "#000066"
    Exit Function
  End If
  If Left(value, 1) <> "#" And Len(value) = 6 And value Like "[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]" Then
    value = "#" & value
  End If
  If Len(value) = 7 And Left(value, 1) = "#" Then
    NormalizeHex = LCase(value)
  Else
    NormalizeHex = "#000066"
  End If
End Function

Function ResolveStripName(rawValue)
  Dim stripName
  stripName = Trim(CStr(rawValue & ""))
  If InStr(stripName, "|") > 0 Then
    stripName = Split(stripName, "|", 2)(0)
  End If
  If LCase(Right(stripName, 4)) = ".gif" Then
    stripName = Left(stripName, Len(stripName) - 4)
  End If
  If stripName = "" Then stripName = "counter-strip"
  ResolveStripName = stripName
End Function

Function StripSourceFor(stripName)
  StripSourceFor = ResolveStripName(stripName) & ".gif"
End Function

Function FormatCount(countValue, digitsValue, useComma)
  Dim text, parts
  text = CStr(countValue)
  If text = "" Then text = "0"
  Do While Len(text) < digitsValue
    text = "0" & text
  Loop
  If Not useComma Then
    FormatCount = text
    Exit Function
  End If

  parts = ""
  Do While Len(text) > 3
    If parts = "" Then
      parts = Right(text, 3)
    Else
      parts = Right(text, 3) & "," & parts
    End If
    text = Left(text, Len(text) - 3)
  Loop

  If parts = "" Then
    FormatCount = text
  Else
    FormatCount = text & "," & parts
  End If
End Function

Function NormalizeCallbackName(rawValue)
  Dim callbackName
  callbackName = Trim(CStr(rawValue & ""))
  If callbackName = "" Then
    NormalizeCallbackName = ""
    Exit Function
  End If
  If callbackName Like "[A-Za-z_$]*" Or InStr(callbackName, ".") > 0 Then
    NormalizeCallbackName = callbackName
  Else
    NormalizeCallbackName = ""
  End If
End Function

Function FirstNonEmpty(values)
  Dim i, candidate
  For i = 0 To UBound(values)
    candidate = CStr(values(i) & "")
    If candidate <> "" Then
      FirstNonEmpty = candidate
      Exit Function
    End If
  Next
  FirstNonEmpty = ""
End Function

Function RelativeCounterFile(filePath, basePath)
  Dim normalizedBase
  normalizedBase = basePath
  If Right(normalizedBase, 1) <> "\" Then
    normalizedBase = normalizedBase & "\"
  End If
  If LCase(Left(filePath, Len(normalizedBase))) = LCase(normalizedBase) Then
    RelativeCounterFile = Replace(Mid(filePath, Len(normalizedBase) + 1), "\", "/")
  Else
    RelativeCounterFile = Replace(filePath, "\", "/")
  End If
End Function

Function BuildRawParamsJson()
  Dim keys, i, keyName, value
  keys = Array("callback", "comma", "df", "dd", "digits", "frgb", "ft", "increment", "key", "step", "strip", "text")
  BuildRawParamsJson = "{"
  For i = 0 To UBound(keys)
    keyName = keys(i)
    value = Request.QueryString(keyName)
    If i > 0 Then BuildRawParamsJson = BuildRawParamsJson & ","
    BuildRawParamsJson = BuildRawParamsJson & JsonString(keyName) & ":" & JsonString(CStr(value & ""))
  Next
  BuildRawParamsJson = BuildRawParamsJson & "}"
End Function

Function BuildLegacyJson(dict)
  Dim keys, i, keyName, pieces
  If dict.Count = 0 Then
    BuildLegacyJson = "{}"
    Exit Function
  End If
  ReDim keys(dict.Count - 1)
  i = 0
  For Each keyName In dict.Keys
    keys(i) = CStr(keyName)
    i = i + 1
  Next
  Call SortStrings(keys)
  pieces = "{"
  For i = 0 To UBound(keys)
    If i > 0 Then pieces = pieces & ","
    pieces = pieces & JsonString(keys(i)) & ":" & JsonString(CStr(dict.Item(keys(i))))
  Next
  pieces = pieces & "}"
  BuildLegacyJson = pieces
End Function

Sub SortStrings(ByRef items)
  Dim i, j, temp
  If IsEmpty(items) Then Exit Sub
  For i = 0 To UBound(items) - 1
    For j = i + 1 To UBound(items)
      If LCase(items(j)) < LCase(items(i)) Then
        temp = items(i)
        items(i) = items(j)
        items(j) = temp
      End If
    Next
  Next
End Sub

Function JsonString(value)
  Dim text
  text = CStr(value & "")
  text = Replace(text, "\", "\\")
  text = Replace(text, """", "\""")
  text = Replace(text, vbCrLf, "\n")
  text = Replace(text, vbCr, "\n")
  text = Replace(text, vbLf, "\n")
  JsonString = """" & text & """"
End Function

Function JsonBool(value)
  If CBool(value) Then
    JsonBool = "true"
  Else
    JsonBool = "false"
  End If
End Function
%>
