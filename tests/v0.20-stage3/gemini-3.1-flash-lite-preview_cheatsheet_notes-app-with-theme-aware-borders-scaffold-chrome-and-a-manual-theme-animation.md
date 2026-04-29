```igni
theme:
  color:
    brand: "#FF6B35"
    subtle: "#CFCFCF"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F9F9F9"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    text: "#F5F5F5"
    card: "#1A1A1A"
    # brand and subtle are inherited from light variant

screen Notes, title: "My Notes":
  # Wrap the entire body in a transition to allow for a fade effect 
  # when the theme mode snaps the variant.
  layout vertical, transition: fade:
    if shared.theme_mode is "dark":
      content
    else:
      content

  content():
    layout vertical, padding: large, gap: medium:
      button "Toggle Theme", on tap: flip_theme()
      
      each i in [1, 2, 3]:
        layout vertical, padding: medium, background: card, rounded: medium, border: thin, color: subtle:
          label "Note " + i, style: heading.small
          label "This border and background color resolve via the active theme variant."

  flip_theme():
    if shared.theme_mode is "dark":
      shared.theme_mode = "light"
    else:
      shared.theme_mode = "dark"
```