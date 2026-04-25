```igni
screen NoteEditor:
  draft = ""
  last_saved = now()
  saved_seconds_ago = 0

  every 1s:
    saved_seconds_ago = now() - last_saved

  every 5s:
    if draft is not empty:
      save(draft)
      last_saved = now()

  layout vertical, gap: medium, padding: large:
    label "Notes", style: heading
    input bind: draft, placeholder: "Start typing..."
    label "Saved " + saved_seconds_ago + "s ago", style: caption
```

### How the two recurring tasks fit together

Two independent `every` blocks share state through `last_saved`:

- **`every 5s:`** is the persistence loop. When the draft is non-empty, it calls `save(draft)` and stamps `last_saved = now()`. That reassignment is the only signal the UI needs.
- **`every 1s:`** is the display loop. It recomputes `saved_seconds_ago = now() - last_saved` once a second. Because `saved_seconds_ago` is referenced by the `label`, lexical reactivity re-renders the screen every tick and the counter ticks up — until the 5-second block resets `last_saved` and the count drops back near zero.

`now()` is non-reactive, so it only updates the display when read inside an `every` block. Initialising `last_saved = now()` (rather than `0`) avoids a giant "Saved 1761000000s ago" on first paint.