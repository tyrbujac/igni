```igni
screen NotesEditor:
  draft = ""
  last_saved = now()
  saved_seconds_ago = 0

  every 1s:
    saved_seconds_ago = now() - last_saved

  every 5s:
    save(draft)
    last_saved = now()
    saved_seconds_ago = 0

  layout vertical, gap: medium, padding: large:
    label "Notes", style: heading
    input bind: draft, placeholder: "Write your note..."
    label "Saved " + round(saved_seconds_ago, 0) + "s ago", style: caption
```

The screen uses two independent `every` blocks:

- `every 5s:` calls `save(draft)` and records the save time in `last_saved`.
- `every 1s:` recomputes `saved_seconds_ago` as `now() - last_saved`.

Because Igni re-renders when referenced variables are reassigned, updating `saved_seconds_ago` refreshes the `"Saved Ns ago"` label every second, and updating `last_saved` after each save resets the counter.