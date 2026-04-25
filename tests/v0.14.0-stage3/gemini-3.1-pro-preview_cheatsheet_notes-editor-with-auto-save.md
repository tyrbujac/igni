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
    input bind: draft, placeholder: "Start typing..."
    label "Saved " + saved_seconds_ago + "s ago", color: subtle
```

### How the recurring tasks are wired together:

1. **Independent Schedules**: The screen utilizes Igni's support for multiple concurrent `every` blocks. The `every 1s:` block strictly manages the UI ticker, while the `every 5s:` block strictly manages the side-effect (saving to the backend). 
2. **Wall-clock Correctness**: Instead of incrementing a counter every second, the `1s` timer calculates the absolute difference via `now() - last_saved`. This ensures the displayed "Ns ago" is perfectly accurate even if the user temporarily backgrounds the app and misses ticks.
3. **Lexical Reactivity**: The connective tissue is simply variable reassignment. When the `every 5s:` block finishes saving, it reassigns `last_saved = now()`. On the very next 1-second tick, `now() - last_saved` evaluates to `0`, reassigning `saved_seconds_ago`. This automatically triggers a re-render of the layout, instantly updating the label down to "0s ago" without any explicit state controllers.