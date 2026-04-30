```igni
# Notes.igni — persisted notes app with sync-on-save

theme:
  color:
    brand: "#4A6FA5"

shared persisted:
  notes = []
  draft = ""

shared:
  sync_trigger = 0
  last_sync_status = "idle"   # "idle" | "saved" | "failed"

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    if notes is empty:
      layout vertical, fill: true, align: center:
        label "No notes yet"
    else:
      each note in shared.notes:
        layout vertical, padding: medium, background: card, rounded: medium:
          label note.text

    button "+ New", color: brand, on tap: navigate to Editor

screen Editor, title: "New note":
  sync = null
  status = ""

  if sync_trigger > 0:
    sync = fetch("https://api.notes.example/sync", method: "POST", body: {text: shared.draft})

  layout vertical, padding: large, gap: medium:
    input bind: draft_local, placeholder: "Write your note...", on change: shared.draft = draft_local

    if sync is loading:
      layout horizontal, gap: small, align: center:
        spinner
        label "Syncing..."
    else if sync is error:
      label "Sync failed", color: danger
    else if status is "saved":
      label "Saved!", color: green

    button "Save", color: brand, on tap: save()

  draft_local = shared.draft

  save():
    shared.update(notes: shared.notes + [{text: shared.draft}])
    sync_trigger = sync_trigger + 1
    status = "saved"
    shared.draft = ""
    navigate back
```

**Design choices where two shapes were equally canonical:**

1. **Bridging `shared.draft` to a local `input bind:`.** The cheatsheet explicitly forbids `input bind: shared.X` (the `TextEditingController` exception). I used the documented bridge pattern: local `draft_local` mirrors `shared.draft`, and `on change:` writes back. This means every keystroke persists — exactly what "draft survives app close mid-write" requires.

2. **Triggering the sync POST.** The cheatsheet's reactive-fetch rule warns against concatenating `input bind:` variables into fetch URLs (re-fires per keystroke). I used the **trigger-variable pattern**: `sync_trigger` increments on Save, the `fetch()` reads it, so the POST fires exactly once per save. The alternative (calling fetch imperatively from `save()`) isn't possible in Igni — `fetch()` is a reactive expression, not a procedure.

3. **`each note in shared.notes` vs `each note in notes`.** Both work (the `shared.` prefix is the visibility marker, but inside an `each` either resolves the same list). I kept `shared.notes` explicit at the iteration site to make the cross-screen coupling visible at the read.

4. **Status display order.** Loading → error → success, checked in that order with `if`/`else if`. Only one renders at a time; `transition: fade` could be added on the wrapping layout to animate state changes, but the spec didn't ask for it and adding animation tokens unprompted violates the "no aliases, no shortcuts" rule.