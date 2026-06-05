VERSION 4.00
Begin VB.Form colorwriter
   Caption         =   "<FONT> Editor"
   ClientHeight    =   6000
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   8000
   LinkTopic       =   "Form1"
   ScaleHeight     =   6000
   ScaleWidth      =   8000
   StartUpPosition =   2  'CenterScreen

   Begin VB.CommandButton StartButton
      Caption         =   "Begin Editing"
      Name            =   "StartButton"
   End

   Begin VB.TextBox TextLetter
      Name            =   "TextLetter"
      Text            =   ""
   End

   Begin VB.TextBox TextLetterNumber
      Name            =   "TextLetterNumber"
      Text            =   "1"
   End

   Begin VB.TextBox TextLetterTotal
      Name            =   "TextLetterTotal"
      Text            =   "0"
   End

   Begin VB.Frame Frame1
      Caption         =   "Palette"
      Name            =   "Frame1"

      Begin VB.OptionButton PaletteChoice
         Caption         =   "Default"
         Index           =   0
         Name            =   "PaletteChoice"
      End

      Begin VB.OptionButton PaletteChoice
         Caption         =   "Web Safe"
         Index           =   1
         Name            =   "PaletteChoice"
      End
   End

   Begin VB.Label Label1
      Caption         =   "Letter #"
      Name            =   "Label1"
   End

   Begin VB.Label Label2
      Caption         =   "Total Letters:"
      Name            =   "Label2"
   End

   Begin VB.Label Label3
      Caption         =   "Letter:"
      Name            =   "Label3"
   End

   Begin VB.CommandButton Command6
      Caption         =   "Command6"
      Name            =   "Command6"
   End

   Begin VB.CommandButton Command7
      Caption         =   "Command7"
      Name            =   "Command7"
   End
End
Attribute VB_Name = "colorwriter"
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

' This form file is a reconstruction, not original source.
' Control names and some captions were inferred from strings found in the compiled EXE.
