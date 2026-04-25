```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

screen Pomodonut:
  mode = "work"
  running = false
  start_time = 0
  elapsed_before = 0
  tick = now()

  every 1s:
    tick = now()
    if running:
      if current_elapsed() >= segment_seconds():
        ding()
        switch_mode()

  layout vertical, gap: large, padding: large, align: center, max_width: phone:
    label title(), style: heading, color: mode_color()
    label time_display(), style: heading
    if running:
      button "Pause", on tap: pause()
    else:
      button "Start", color: brand, on tap: start()
    button "Reset", color: subtle, on tap: reset()
    button "Settings", color: subtle, on tap: navigate to Settings

  title():
    if mode is "work":
      return "Work"
    return "Break"

  mode_color():
    if mode is "work":
      return red
    return green

  segment_seconds():
    if mode is "work":
      return shared.work_minutes * 60
    return shared.break_minutes * 60

  current_elapsed():
    if running:
      return elapsed_before + (tick - start_time)
    return elapsed_before

  remaining():
    r = segment_seconds() - current_elapsed()
    if r < 0:
      return 0
    return r

  time_display():
    r = remaining()
    mins = r / 60
    secs = r - mins * 60
    return pad(mins) + ":" + pad(secs)

  pad(n):
    s = "" + n
    if n < 10:
      return "0" + s
    return s

  start():
    start_time = now()
    running = true

  pause():
    elapsed_before = current_elapsed()
    running = false

  reset():
    running = false
    elapsed_before = 0
    start_time = now()

  switch_mode():
    if mode is "work":
      mode = "break"
    else:
      mode = "work"
    elapsed_before = 0
    start_time = now()

  ding():
    if shared.sound_on:
      play("ding.wav")

screen Settings, title: "Settings":
  layout vertical, gap: medium, padding: large, max_width: phone:
    label "Work duration", style: heading.small
    slider bind: shared.work_minutes, min: 1, max: 60
    label shared.work_minutes

    divider

    label "Break duration", style: heading.small
    slider bind: shared.break_minutes, min: 1, max: 30
    label shared.break_minutes

    divider

    toggle bind: shared.sound_on, label: "Sound"

    button "Back", on tap: navigate back
```

## Design notes

**Wall-clock timer.** Igni only offers `every 1s:`/`5s:`/`30s:` and `now()` (integer seconds, non-reactive). Decrementing a `remaining` counter would drift if the screen is unmounted, so I followed the spec's *Wall-clock-correct timers* pattern: store an absolute `start_time` and let `every 1s:` reassign `tick = now()`. The remaining time is computed each render as `segment_seconds - (tick - start_time)`.

**Pause/resume without losing progress.** Because `start_time` is absolute, naïvely resuming after a pause would count the paused interval. I keep an `elapsed_before` accumulator: `pause()` snapshots the current elapsed seconds into it and clears `running`; `start()` sets a fresh `start_time` and flips `running` on; `current_elapsed()` adds the live delta only while running. Reset zeroes the accumulator.

**Segment transitions.** The `every 1s:` block compares `current_elapsed()` to `segment_seconds()`. When it overflows, it calls `ding()` (gated by `shared.sound_on`) and `switch_mode()`, which flips `mode` and rebases the timer. Cycles continue until the user pauses.

**Colour as mode indicator.** `mode_color()` returns `red` for work and `green` for break, applied to the title `label`. The countdown itself stays in the default text style — only the segment label recolours, satisfying the constraint to avoid graphics/animations.

**`mm:ss` formatting.** No `floor`/`format` builtin, so `pad()` does the leading-zero work using `"" + n` for stringification and `"0" + s` for sub-10 values. Integer `/` is assumed to truncate, matching the int type of `now()`'s return.

**Shared state.** Only the three settings cross screens, so they're the only `shared:` entries. Timer state (`mode`, `running`, `start_time`, `elapsed_before`, `tick`) is local to `Pomodonut` — per the spec's "use `shared:` only when multiple screens need the same data" rule.

**Settings UI.** Sliders bind directly to `shared.*` values; a sibling `label` echoes the current number since sliders don't show their value. The `toggle` binds the sound flag. `navigate back` returns to the main screen, where the new durations apply on the next segment (or immediately, since `segment_seconds()` is recomputed each render).