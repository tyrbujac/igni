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
    input bind: draft, placeholder: "Write your note..."
    label "Saved " + round(saved_seconds_ago, 0) + "s ago", style: caption
```

The screen uses two independent recurring blocks:

- `every 5s:` calls `save(draft)` and then records the save time with `last_saved = now()`.
- `every 1s:` recalculates `saved_seconds_ago` as `now() - last_saved`.

Because Igni re-renders the screen whenever referenced state is reassigned, updating `saved_seconds_ago` every second automatically refreshes the label below the input.