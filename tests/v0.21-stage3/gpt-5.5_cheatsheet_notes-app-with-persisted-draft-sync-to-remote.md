```igni
# Notes.igni

theme:
  color:
    brand: "#2563EB"
    surface: "#F8FAFC"
    text: "#0F172A"
  typography:
    heading: font: inter
    title: font: inter
    body: font: inter
    caption: font: inter
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

shared:
  sync = null
  sync_started = false

shared persisted:
  notes = []
  draft = ""

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    button "+ New", color: brand, on tap: navigate to Editor

    if shared.sync is loading:
      spinner
    else if shared.sync is error:
      label "Sync failed", color: danger
    else if shared.sync_started:
      label "Saved!", color: green

    if shared.notes is empty:
      label "No notes yet"
    else:
      each note in shared.notes:
        layout vertical, padding: medium, background: card, rounded: medium:
          label note.text

screen Editor, title: "New note":
  draft = shared.draft

  layout vertical, padding: large, gap: medium:
    input bind: draft, placeholder: "Write your note", on change: shared.draft = draft
    button "Save", color: brand, on tap: save()

  save():
    note = {text: draft}
    shared.notes = shared.notes + [note]
    shared.draft = ""
    draft = ""
    shared.sync_started = true
    shared.sync = fetch("https://api.notes.example/sync", method: "POST", body: note)
    navigate back
```

Brief choices:

- I used `shared persisted:` only for durable user data: `notes` and `draft`.
- I used plain volatile `shared:` for `sync` / `sync_started`, because the POST status is UI state and does not need to survive restart.
- `input bind: shared.draft` is rejected by Igni, so `Editor` uses the idiomatic local bridge: `draft = shared.draft` plus `on change: shared.draft = draft`.
- The cheatsheet does not define a separate multiline input modifier, so this uses the canonical `input` primitive for the draft field.