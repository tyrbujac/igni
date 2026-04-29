```igni
theme:
  color:
    brand: "#80CBC4"
    subtle: "#9AA0A6"
    subtle_border: "#CFCFCF"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    text: "#F5F5F5"
    card: "#1A1A22"
    subtle: "#5A5F66"
    # brand and subtle_border auto-inherit from light variant

shared:
  theme_mode = "light"

screen Notes, title: "My Notes":
  notes = [
    {title: "Groceries", body: "Milk, eggs, bread"},
    {title: "Ideas", body: "Build a notes app in Igni"},
    {title: "Reminder", body: "Water the plants on Friday"}
  ]

  layout vertical, padding: large, gap: medium:
    button "Toggle theme", color: brand, on tap: flip_theme()

    each note in notes:
      layout vertical, padding: medium, gap: small, background: card, rounded: medium, border: thin, color: subtle:
        label note.title, style: heading.small
        label note.body, style: body

  flip_theme():
    if shared.theme_mode is "dark":
      shared.theme_mode = "light"
    else:
      shared.theme_mode = "dark"
```