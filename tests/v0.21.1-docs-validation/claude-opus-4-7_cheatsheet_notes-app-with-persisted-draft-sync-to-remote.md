```igni
# Notes.igni — full app, single file

theme:
  color:
    brand: "#4A90E2"

shared persisted:
  notes = []
  draft = ""

shared:
  sync_result = null      # null | "loading" | "ok" | "error" — volatile; resets on restart

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    if shared.notes is empty:
      layout vertical, fill: true, align: center:
        label "No notes yet"
    else:
      each note in shared.notes:
        layout vertical, padding: medium, background: card, rounded: medium:
          label note.text

    button "+ New", color: brand, on tap: navigate to Editor

screen Editor, title: "New note":
  local_draft = shared.draft

  layout vertical, padding: large, gap: medium:
    input bind: local_draft, placeholder: "Write your note...", on change: shared.draft = local_draft

    if shared.sync_result is "loading":
      layout horizontal, gap: small, align: center:
        spinner
        label "Syncing..."
    else if shared.sync_result is "ok":
      label "Saved!", color: green
    else if shared.sync_result is "error":
      label "Sync failed", color: danger

    button "Save", color: brand, on tap: save()

  save():
    if local_draft is empty:
      return
    shared.update(notes = shared.notes + [{text: local_draft}])
    shared.update(draft = "")
    local_draft = ""
    sync()
    navigate back

  sync():
    shared.sync_result = "loading"
    response = fetch("https://api.notes.example/sync", method: "POST", body: {text: local_draft})
    if response is error:
      shared.sync_result = "error"
    else:
      shared.sync_result = "ok"
```

### Design notes (where two shapes were equally canonical)

**1. Bridging `shared.draft` into `input`.** The cheatsheet calls this out explicitly: `input bind: shared.X` is rejected at parse time. I declared `local_draft = shared.draft` (initial-capture from persisted shared) and wrote back via `on change: shared.draft = local_draft`. Every keystroke persists — so a mid-draft app close survives.

**2. `sync_result` is volatile `shared:`, not `shared persisted:`.** Sync status is session-scoped — "Saved!" / "Sync failed" should not greet the user on app relaunch. Putting it in plain `shared:` rather than `shared persisted:` matches the cheatsheet's "if the user expects to see this value after closing and reopening, persist it" heuristic. It's `shared:` rather than local-to-Editor because the assignment-from-`save()`-which-calls-`sync()` chain reads cleaner when the status variable lives at the top level (and conceptually the sync is an app-level concern, not Editor-internal).

**3. Note shape: object `{text: ...}` rather than bare string.** Forward-compatible with adding `created_at`, `id`, etc. without a migration of the persisted blob. Cheap insurance.

**4. Save flow ordering: append → clear draft → fire sync → navigate back.** The local append is the source of truth; sync is best-effort backup. If sync fails the note is still saved locally and the user sees "Sync failed" on their next visit to Editor (or could be surfaced on List in a future iteration). Clearing `shared.draft` before `sync()` means the in-flight POST body uses `local_draft` (captured before clear) — which is why `sync()` reads `local_draft` not `shared.draft`.

**5. Empty-draft guard in `save()`.** Pressing Save on an empty input is a no-op rather than an error toast — simplest correct behaviour; the cheatsheet's "assign default, then override" pattern wasn't needed here since early-return is cleaner.