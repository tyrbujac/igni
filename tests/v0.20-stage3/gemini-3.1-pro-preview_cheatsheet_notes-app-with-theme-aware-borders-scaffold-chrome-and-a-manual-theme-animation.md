Here is the complete `Notes.igni` file demonstrating Igni v0.20's theme variants, active-variant resolution, token auto-fallback, and explicit view-state transitions.

```igni
shared:
  theme_mode = "light"

theme:
  color:
    brand: "#FF6B35"
    subtle_border: "#CFCFCF"    # User-defined token
    surface: "#FFFFFF"
    text: "#0D0D14"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"          # Override for dark mode
    text: "#F5F5F5"             # Override for dark mode
    # `brand` and `subtle_border` are NOT declared here. 
    # They auto-fall-back and inherit the light variant values.
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

component NoteList(notes):
  layout vertical, padding: large, gap: medium:
    
    # Demonstration of the user-defined token:
    # Used here on an outlined button pattern. Inherits #CFCFCF in both modes.
    layout vertical, rounded: medium, border: thin, color: subtle_border:
      button "Toggle theme", color: brand, on