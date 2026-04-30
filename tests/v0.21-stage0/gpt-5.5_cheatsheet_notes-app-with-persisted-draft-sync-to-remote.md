```igni
# Notes.igni

theme:
  color:
    brand: "#4F46E5"
    surface: "#F8FAFC"
    text: "#111827"
    note_card: "#FFFFFF"
  typography:
    heading: font: inter
    title: font: inter
    body: font: inter
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

shared:
  sync_note = ""
  sync_request = 0

shared persisted:
  notes = []
  draft = ""

screen List, title: "Notes":
  sync = null

  if shared.sync_request > 0:
    sync = fetch("https://api.notes.example/sync", method: "POST", body: {text: shared.sync_note, request_id: shared.sync_request})

  layout vertical, padding: large, gap: medium:
    button "+ New", color: brand, on tap: navigate to Editor

    if shared.sync_request > 0:
      layout vertical, padding: small:
        if sync is loading:
          spinner
        else if sync is error:
          label "Sync failed", color: danger
        else:
          label "Saved!", color: green

    if shared.notes is empty:
      layout vertical, fill: true, align: center:
        label "No notes yet", style: title
    else:
      layout vertical, gap: small:
        each note in shared.notes:
          layout vertical, padding: medium, background: note_card, rounded: medium, border: thin:
            label note

screen Editor, title: "New note":
  draft = shared.draft

  layout vertical, padding: large, gap: medium:
    input bind: draft, placeholder: "Write your note", multiline: true, on change: shared.draft = draft
    button "Save", color: brand, on tap: save()

  save():
    shared.notes = shared.notes + [draft]
    shared.sync_note = draft
    shared.sync_request = shared.sync_request + 1
    shared.draft = ""
    draft = ""
    navigate back
```

Brief notes on choices:

- `notes` and `draft` are in `shared persisted:` so both survive app restart.
- The editor uses a local `draft` bridge because Igni `input` cannot bind directly to `shared.X`; `on change:` writes every keystroke back to `shared.draft`.
- Notes are stored as plain strings because the card only needs note text. The POST wraps the saved string as `{text: ...}`.
- Sync state is triggered from `Editor` but rendered on `List`, because saving navigates back immediately. `sync_request` is included in the POST body so saving the same note text twice still creates a new reactive fetch.