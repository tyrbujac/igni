```igni
# Notes.igni

theme:
  color:
    brand: "#2563EB"
    surface: "#F8FAFC"
    text: "#0F172A"
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

shared persisted:
  notes = []
  draft = ""

shared:
  pending_sync = null

screen List, title: "Notes":
  sync_result = null

  if shared.pending_sync is not null:
    sync_result = fetch("https://api.notes.example/sync", method: "POST", body: {text: shared.pending_sync})

  layout vertical, padding: large, gap: medium:
    layout horizontal, spread: true, align: center:
      label "Notes", style: heading
      button "+ New", color: brand, on tap: navigate to Editor

    if shared.pending_sync is not null:
      layout vertical, padding: medium, rounded: medium, background: card:
        if sync_result is loading:
          spinner
        else if sync_result is error:
          label "Sync failed", color: danger
        else:
          label "Saved!", color: green

    if shared.notes is empty:
      label "No notes yet"
    else:
      each note in shared.notes:
        layout vertical, padding: medium, rounded: medium, background: card, border: thin:
          label note

screen Editor, title: "New note":
  draft = shared.draft

  layout vertical, padding: large, gap: medium:
    input bind: draft, placeholder: "Write your note...", multiline: true, on change: shared.draft = draft

    button "Save", color: brand, on tap: save()

  save():
    if draft is not empty:
      shared.notes = shared.notes + [draft]
      shared.pending_sync = draft
      shared.draft = ""
      draft = ""
      navigate back
```

Brief decisions:

- `input bind: shared.draft` is not used because Igni rejects direct `input` binding to `shared.X`; the editor bridges through local `draft` and writes back with `on change:`.
- Notes are stored as strings, not objects, because the app only needs note text.
- Since the Save action must navigate back, the sync status is shown inline on `List` after return. `Editor` fires the POST by reassigning `shared.pending_sync`, which the `List` screen’s reactive `fetch()` reads.