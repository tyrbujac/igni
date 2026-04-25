# Notes Editor

```igni
screen NoteEditor:
  draft = ""
  last_saved = 0
  saved_seconds_ago = 0

  every 1s:
    saved_seconds_ago = now() - last_saved

  every 5s:
    if draft is not empty and now() - last_saved >= 5:
      save(draft)
      last_saved = now()

  layout vertical, gap: medium, padding: large:
    input bind: draft, placeholder: "Start typing..."
    label "Saved " + saved_seconds_ago + "s ago", style: caption
```

## How the two recurring tasks are wired together

The screen uses two independent `every` blocks coordinated through one shared timestamp variable, `last_saved`:

- **`every 5s:`** is the autosave loop. It checks the draft is non-empty, calls `save(draft)`, then stamps `last_saved = now()`. Using `now()` (wall-clock seconds since epoch) means the elapsed-time math stays correct even if the screen unmounts and resumes.
- **`every 1s:`** is the display loop. It recomputes `saved_seconds_ago = now() - last_saved`. Reassigning that variable triggers Igni's lexical reactivity, so the `label` re-renders with the new count each tick.

The two blocks never call each other — they communicate purely through `last_saved`. The 5s block writes it; the 1s block reads it. Because `input bind: draft` keeps `draft` continuously in sync with what the user types, the autosave block always picks up the latest text without any manual change tracking.