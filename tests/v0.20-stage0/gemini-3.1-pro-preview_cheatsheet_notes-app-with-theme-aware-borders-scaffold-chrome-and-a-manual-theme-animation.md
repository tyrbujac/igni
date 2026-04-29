```igni
shared:
  theme_mode = "light"  # Start in light mode for the direct light/dark toggle

theme:
  color:
    brand: "#FF6B35"
    subtle_border: "#CFCFCF"    # User-defined token to demonstrate auto-fall-back
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F9F9F9"
    subtle: "#E2E2E2"
  scaffold:
    background: surface         # Propagates to window frame
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"          # Overridden for dark mode
    text: "#F5F5F5"
    card: "#1A1A1A"
    subtle: "#333333"
    # `brand` and `subtle_border` omitted here → auto-fall-back to light variant values
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Notes, title: "My Notes":
  notes = [
    {title: "Grocery Run", body: "Apples, coffee, oat milk"},
    {title: "Release v0.20", body: "Check the dark mode propagation"},
    {title: "Call Mechanic", body: "Ask about the weird rattle"}
  ]

  toggle_theme():
    if shared.theme_mode is "light":
      shared.theme_mode = "dark"
    else:
      shared.theme_mode = "light"

  layout vertical, padding: large, gap: medium:
    button "Toggle theme", color: brand, on tap: toggle_theme()

    # Explicit theme-switch fade. `transition:` is a layout-level property,
    # NOT a theme-block property. We build the fade explicitly by swapping
    # branches based on the theme_mode string.
    layout vertical, fill: true, transition: fade:
      if shared.theme_mode is "dark":
        NoteList notes
      else:
        NoteList notes

component NoteList(items):
  layout vertical, gap: medium:
    each note in items:
      # Active-variant resolution: `card` and `subtle` automatically
      # resolve to their dark-hex equivalents when theme_mode flips.
      layout vertical, padding: medium, background: card, rounded: medium, border: thin, color: subtle:
        label note.title, style: heading.small
        label note.body, style: body
```