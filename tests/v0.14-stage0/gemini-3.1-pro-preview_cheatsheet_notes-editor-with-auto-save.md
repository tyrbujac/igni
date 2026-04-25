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

  layout vertical, padding: large, gap: small:
    input bind: draft, placeholder: "Write your note here..."
    label "Saved " + saved_seconds_ago + "s ago", color: subtle
```

### How it works

The screen relies on **two independent recurrence blocks** and **lexical reactivity** to keep the auto-save and the UI in sync:

1. **The 5-second block (Data logic):** Every 5 seconds, it checks if there's text in the draft. If so, it fires the `save()` mutation and resets the `last_saved` timestamp to the current absolute time (`now()`).
2. **The 1-second block (UI logic):** Every second, it calculates the difference between the current time and `last_saved`, updating the `saved_seconds_ago` variable.

**The Wiring:** These blocks don't explicitly call each other or trigger UI updates manually. Instead, they are wired together entirely through state assignment:
* When the `every 5s` block reassigns `last_saved = now()`, the `every 1s` block automatically uses that new baseline on its next tick.
* When the `every 1s` block reassigns `saved_seconds_ago = now() - last_saved`, Igni's reactivity rule kicks in: because a variable referenced in the screen body was reassigned, the screen re-evaluates top-to-bottom, instantly updating the `label` with the fresh integer count.