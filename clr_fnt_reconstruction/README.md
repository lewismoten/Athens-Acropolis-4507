# Color Writer Reconstruction

This folder contains a best-effort reconstruction of the old Visual Basic 4 project that shipped in the `clr_fnt` setup package.

## What Was Recovered

- `extracted/colorwriter3.exe`: the main application binary
- `extracted/setup132.exe`: Visual Basic 4 setup bootstrap
- `extracted/stkit432.dll`: VB4 setup toolkit DLL
- `extracted/ST4UNST.exe`: setup uninstaller helper
- `extracted/SETUP.LST`: installer manifest
- `raw/colorwriter3.strings.txt`: printable strings recovered from the EXE
- `raw/colorwriter3.objdump-x.txt`: PE header / section / import metadata
- `raw/colorwriter3.rsrc.txt`: raw `.rsrc` section dump

## What Seems Confirmed

From the installer manifest and version metadata inside `colorwriter3.exe`:

- Product name: `Color Writer/<Font> Editor`
- Internal name: `colorwriter3`
- Version: `2.1.0.2`
- Authors / company name: `Lucas Moten & Lewis Moten`
- Comment: `Good for Writing HTML Text`
- File description: `Converts Color to hex and displays it in font commands to be used in HTML editing`

The binary also clearly contains Visual Basic 4 signatures:

- `VB40032.DLL`
- `Project1`
- `THUNcolorwriter`
- `CompObj`
- `TYPELIB`

## What Seems Inferred

The original source files such as `.vbp`, `.frm`, and `.frx` are not present. They were almost certainly compiled into the EXE. The files in this folder are a reconstruction based on:

- installer metadata
- embedded strings
- VB runtime names
- resource section contents

`Project1.vbp` and `colorwriter.frm` in this folder are therefore source-like sketches, not authoritative original source.

## Likely UI Elements

These names were found in the EXE and likely correspond to VB form controls:

- `TextLetter`
- `TextLetterNumber`
- `TextLetterTotal`
- `Palette`
- `PaletteChoice`
- `Frame1`
- `Command6`
- `Command7`
- `StartButton`
- `Label1`
- `Label2`
- `Label3`

These captions or values were also found:

- `<FONT> Editor`
- `Begin Editing`
- `Default`
- `Web Safe`
- `Letter:`
- `Letter #`
- `Total Letters:`
- `000000`
- `http://www.geocities.com/Athens/Acropolis/4507/`
- `shoomi@mindless.com`

## Notes

The EXE appears to include at least one form-related OLE/VB resource stream in `.rsrc`, including `TYPELIB` and `_IID_FORM1` markers. With more specialized Windows-era VB reverse-engineering tools, it may be possible to recover more exact form layouts or typelib details.
