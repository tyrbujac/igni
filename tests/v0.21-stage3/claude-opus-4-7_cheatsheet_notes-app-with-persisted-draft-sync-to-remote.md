```igni
# Notes.igni — a tiny notes app with persisted state and sync-on-save

theme:
  color:
    brand: "#4F46E5"

shared persisted:
  notes = []
  draft = ""

shared:
  sync_trigger = null
  sync_status = "idle"

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    if notes_is_empty():
      layout vertical, fill: true, align: center:
        label "No notes yet"
    else:
      layout vertical, fill: true, gap: medium:
        each note in shared.notes:
          layout vertical, padding: medium, background: card, rounded: medium:
            label note.text

    button "+ New", color: brand, on tap: navigate to Editor

  notes_is_empty():
    return shared.notes is empty

screen Editor, title: "New note":
  local_draft = shared.draft

  sync = null
  if shared.sync_trigger is not null:
    sync = fetch(shared.sync_trigger.url, method: "POST", body: shared.sync_trigger.body)

  layout vertical, padding: large, gap: medium:
    input bind: local_draft, placeholder: "Write your note…", on change: shared.draft = local_draft

    if sync is loading:
      layout horizontal, gap: small, align: center:
        spinner
        label "Syncing…", style: caption
    else if sync is error:
      label "Sync failed", color: danger, style: caption
    else if shared.sync_status is "saved":
      label "Saved!", color: green, style: caption

    button "Save", color: brand, on tap: save()

  save():
    text = local_draft
    if text is empty:
      return
    shared.update(notes = shared.notes + [{text: text}])
    shared.update(draft = "")
    local_draft = ""
    shared.update(sync_status = "saved")
    shared.update(sync_trigger = {url: "https://api.notes.example/sync", body: {text: text}})
    navigate back
```

## Design choices where two shapes were equally canonical

**1. Where does the sync `fetch()` live — `List` or `Editor`?**
I put it in `Editor`. Both work, but `Editor` is where the user sees the loading/error/success feedback before navigating back, so co-locating the fetch with its UI feedback reads more directly. The `shared.sync_trigger` object decouples "user pressed Save" from "fetch fires reactively" — reassigning the trigger re-runs the fetch (per the *Reactive re-fetch* rule), and clearing the input/draft happens synchronously before navigation. The trigger pattern is also the cheatsheet's recommended shape for fetches whose URLs/bodies derive from user input (avoiding per-keystroke re-fires).

**2. Bridging `shared.draft` through a local variable in `Editor`.**
`input bind: shared.draft` is rejected at parse time (the cheatsheet's `input` exception). The canonical bridge is `local_draft = shared.draft` + `input bind: local_draft, on change: shared.draft = local_draft`. This means every keystroke writes through to persisted storage, so closing the app mid-draft survives — exactly the requirement.

**3. `notes_is_empty()` function vs. inline `if shared.notes is empty:`.**
Inline would also be idiomatic and shorter. I lifted it to a screen-internal function purely for symmetry — it makes the conditional read like prose and demonstrates the "reactivity follows references through function calls" rule (the function reads `shared.notes`, so the layout re-renders when notes change). Either shape is fine; for a real codebase I'd probably inline it.

**4. `sync_status` as a separate `shared:` (volatile) variable rather than `shared persisted:`.**
The "Saved!" / "Sync failed" status is ephemeral UI feedback — it shouldn't survive an app restart (showing "Saved!" on cold-launch would be confusing). So `sync_status` lives in plain `shared:`, while `notes` and `draft` (which the user expects to persist) live in `shared persisted:`. The durability decision is per-variable, made at declaration time.