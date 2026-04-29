```igni
shared:
  theme_mode = "light"

theme:
  color:
    brand: "#4F46E5"
    subtle: "#CFCFCF"
    subtle_border: "#CFCFCF"
    surface: "#F7F7FB"
    text_main: "#111827"
    card: "#FFFFFF"
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

theme dark:
  color:
    subtle: "#5B6472"
    surface: "#0D1117"
    text_main: "#F5F5F5"
    card: "#161B22"
    # brand and subtle_border intentionally omitted:
    # they auto-fall-back to the light theme values.
  scaffold:
    background: surface
  appbar:
    background: card
    foreground: text_main

screen Notes, title: "My Notes":
  notes = [{title: "Grocery list", body: "Oats, lemons, and coffee beans"}, {title: "Book idea", body: "A tiny language that reads like a design spec"}, {title: "Weekend", body: "Water the basil and call Ada"}]

  layout vertical, padding: large, gap: medium:
    button "Toggle theme", color: brand, on tap: toggle_theme()

    each note in notes:
      layout vertical, padding: medium, gap: small, rounded: medium, border: thin, color: subtle, background: card:
        label note.title, style: heading.small, color: text_main
        label note.body, style: body, color: text_main

  toggle_theme():
    if shared.theme_mode is "dark":
      shared.theme_mode = "light"
    else:
      shared.theme_mode = "dark"
```