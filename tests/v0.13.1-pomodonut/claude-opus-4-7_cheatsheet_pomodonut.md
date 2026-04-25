```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

screen Pomodonut, title: "Pomodonut":
  mode = "work"
  remaining_min = 25
  remaining_sec = 0
  running = false

  layout vertical, gap: large, padding: large, align: center:
    title_color = brand
    if mode is "break":
      title_color = green

    label mode_label(), style: heading, color: title_color
    label time_text(), style: heading, color: title_color

    layout horizontal, gap: medium:
      button start_label(), color: brand, on tap: toggle_run()
      button "Reset", color: subtle, on tap: reset()

    button "Settings", on tap: navigate to Settings

    # Dev-only: drives the countdown one second at a time.
    # See note below — the spec has no recurring timer primitive.
    button "Tick (1s)", color: subtle, on tap: tick()

  mode_label():
    if mode is "work":
      return "Work"
    return "Break"

  start_label():
    if running:
      return "Pause"
    return "Start"

  pad(n):
    if n < 10:
      return "0" + round(n, 0)
    return round(n, 0)

  time_text():
    return pad(remaining_min) + ":" + pad(remaining_sec)

  segment_minutes():
    if mode is "work":
      return shared.work_minutes
    return shared.break_minutes

  toggle_run():
    running = not running

  reset():
    running = false
    remaining_min = segment_minutes()
    remaining_sec = 0

  tick():
    if not running:
      return
    if remaining_sec > 0:
      remaining_sec = remaining_sec - 1
      return
    if remaining_min > 0:
      remaining_min = remaining_min - 1
      remaining_sec = 59
      return
    # Segment ended — flip mode, ding, and reload duration.
    if shared.sound_on:
      play("ding.wav")
    if mode is "work":
      mode = "break"
    else:
      mode = "work"
    remaining_min = segment_minutes()
    remaining_sec = 0

screen Settings, title: "Settings":
  layout vertical, gap: medium, padding: large:
    label "Work duration", style: heading.small
    slider bind: shared.work_minutes, min: 1, max: 60
    label round(shared.work_minutes, 0) + " min"

    divider

    label "Break duration", style: heading.small
    slider bind: shared.break_minutes, min: 1, max: 30
    label round(shared.break_minutes, 0) + " min"

    divider

    toggle bind: shared.sound_on, label: "Sound on segment change"

    button "Back", on tap: navigate back
```

### Design notes

**Per-second countdown — the honest part.** The Igni v0.12.2 spec exposes only event-driven reactivity (`on tap`, `on touch`, `on change`) plus the async one-shots `fetch()` and `locate()`. There is no documented recurring-timer primitive — no `every`, no `on tick`, no scheduler. So a real wall-clock countdown isn't expressible in the language as specified. I structured the app so that adding such a primitive is a one-line change: replace the `Tick (1s)` button with whatever recurring-event syntax the language gains (e.g. `on tick every: 1s: tick()` on the screen's root layout). The `tick()` function itself is already shaped for a 1 Hz driver.

**State split: minutes and seconds, not total seconds.** Igni's arithmetic is `+ - * /` with no documented integer division or modulo, so deriving `mm:ss` from a single `seconds` counter would be awkward. Storing `remaining_min` and `remaining_sec` separately makes the decrement loop a clean three-branch `if`/`else if`/`else` and avoids any modulo dance.

**`pad()` via `round(n, 0)`.** The spec gives `round(value, decimals)` as the canonical number→string conversion. `round(7, 0)` yields `"7"`, which then concatenates cleanly with `"0"` to produce `"07"`. This is the only way I found to coerce an int to a string within the documented builtins.

**Colour as state-derived value.** Per the *Conditionals* section, I assign `title_color = brand` and override to `green` when `mode is "break"`, then pass it to `color:`. Both the segment title and the countdown share the colour so the work/break distinction is immediate.

**Settings persistence via `shared:`.** Work/break durations and the sound toggle live in the top-level `shared:` block, so the slider/toggle bindings on the Settings screen mutate the same values the main screen reads. `reset()` and the segment transition both re-read `segment_minutes()` from `shared.`, so changes take effect on the next reset or segment flip — exactly the contract `shared:` advertises.

**Reset semantics.** `reset()` sets `running = false` and reloads the *current* segment's duration; it does not flip work↔break. That matches the brief ("reset the current segment") and keeps the user in control of mode transitions (which only happen organically when a segment hits zero).