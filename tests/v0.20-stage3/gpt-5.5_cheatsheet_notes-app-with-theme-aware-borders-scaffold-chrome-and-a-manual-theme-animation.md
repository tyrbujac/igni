```igni
shared:
  theme_mode = "light"

theme:
  color:
    brand: "#4F46E5"
    subtle: "#CFCFCF"
    subtle_border: "#CFCFCF"
    surface: "#FFFFFF"
    card: "#F7F7FA"
    text: "#111827"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    card: "#181821"
    text: "#F5F5F5"
    subtle: "#4B5563"
    # brand and subtle_border intentionally omitted:
    # they auto-fall-back to the light theme values.
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

component NotesContent(notes):
  layout vertical, padding: large, gap: medium:
    button "Toggle theme", color: brand, on tap: toggle_theme()

    each note in notes:
      layout vertical, padding: medium, gap: small, rounded: medium, border: thin, color: subtle, background: card:
        label note.title, style: heading.small
        label note.body, style: body

  toggle_theme():
    if shared.theme_mode is "dark":
      shared.theme_mode = "light"
    else:
      shared.theme_mode = "dark"

screen Notes, title: "My Notes.":
  notes = [
    {title: "Grocery list", body: "Milk, eggs, coffee, and oranges."},
    {title: "Project idea", body: "Build a tiny notes app with theme-aware cards."},
    {title: "Reminder", body: "Call Sam before dinner."}
  ]

  # Explicit user-built theme-switch fade.
  # Theme variant changes still resolve instantly; this conditional is what fades.
  layout vertical, transition: fade:
    if shared.theme_mode is "dark":
      NotesContent notes
    else:
      NotesContent notes
```