Here is the complete Igni code for the Notes Editor.

```igni
screen NotesEditor:
  draft = ""
  last_saved = now()
  seconds_ago = 0

  every 1s:
    # Update the display variable to force re-render
    seconds_ago = now() - last_saved

  every 5s:
    # Perform the auto-save and reset the save timestamp
    if draft is not empty:
      save(draft)
      last_saved = now()

  layout vertical, padding: large:
    input bind: draft, placeholder: "Type your note..."
    label "Saved " + seconds_ago + "s ago"
```

### Explanation

This implementation leverages Igni’s **lexical reactivity** and independent timer blocks:

*   **The 1s timer:** This block handles the UI update. It calculates the elapsed time since the last save. Because reassigning `seconds_ago` occurs inside this block, the screen automatically re-evaluates the layout body every second, ensuring the label updates without manual intervention.
*   **The 5s timer:** This block handles the side effect. By performing the `save(draft)` call and resetting `last_saved` to the current `now()`, it resets the calculation used by the 1s block.
*   **State management:** Because `last_saved` and `seconds_ago` are defined at the screen level, they persist across the re-evaluation cycles, allowing the two distinct `every` blocks to communicate via shared local state.