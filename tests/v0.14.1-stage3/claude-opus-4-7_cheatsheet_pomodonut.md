```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

screen Pomodonut, title: "Pomodonut":
  mode = "work"
  running = false
  start_time = 0
  accumulated = 0
  tick = now()

  every 1s:
    if running:
      tick = now()
      if tick - start_time + accumulated >= segment_seconds():
        if shared.sound_on:
          play("ding.wav")
        if mode is "work":
          mode = "break"
        else:
          mode = "work"
        start_time = now()
        accumulated = 0

  layout vertical, gap: large, padding: large, align: center:
    label segment_label(), style: heading, color: segment_color()
    label format_time(remaining()), style: heading
    layout horizontal, gap: medium:
      if running:
        button "Pause", color: subtle, on tap: pause()
      else:
        button "Start", color: brand, on tap: start()
      button "Reset", color: subtle, on tap: reset()
    button "Settings", on tap: navigate to Settings

  segment_seconds():
    if mode is "work":
      return shared.work_minutes * 60
    return shared.break_minutes * 60

  segment_label():
    if mode is "work":
      return "Work"
    return "Break"

  segment_color():
    if mode is "work":
      return brand
    return green

  remaining():
    elapsed = accumulated
    if running:
      elapsed = accumulated + (tick - start_time)
    left = segment_seconds() - elapsed
    if left < 0:
      return 0
    return left

  start():
    start_time = now()
    tick = now()
    running = true

  pause():
    accumulated = accumulated + (now() - start_time)
    running = false

  reset():
    running = false
    accumulated = 0
    start_time = now()
    tick = now()

  format_time(s):
    m = s / 60
    sec = s - m * 60
    return pad(m) + ":" + pad(sec)

  pad(n):
    if n < 10:
      return "0" + round(n, 0)
    return round(n, 0)

screen Settings, title: "Settings":
  layout vertical, gap: large, padding: large:
    label "Work duration (minutes)", style: body
    layout horizontal, gap: medium, align: center:
      slider bind: shared.work_minutes, min: 1, max: 60
      label shared.work_minutes
    label "Break duration (minutes)", style: body
    layout horizontal, gap: medium, align: center:
      slider bind: shared.break_minutes, min: 1, max: 30
      label shared.break_minutes
    toggle bind: shared.sound_on, label: "Sound"
    button "Back", on tap: navigate back
```

## Design notes

**Wall-clock countdown.** Following the spec's Pomodonut-shaped guidance: I store an absolute `start_time` (epoch seconds) plus `accumulated` (seconds banked from previous run intervals). The `every 1s:` block only updates `tick = now()`; the displayed remaining time is *derived* in `remaining()` as `segment_seconds() - (accumulated + (tick - start_time))`. This means if the user navigates to Settings and back, the timer reads correct wall-clock time on the next tick — no drift from the missed-tick rule.

**Pause / resume.** Pause folds the live elapsed window into `accumulated` and clears `running`. Start sets a fresh `start_time` and flips `running` back on. Reset zeroes accumulated and the `every` block stops doing anything because `running` is false.

**Segment transition inside the tick block.** When elapsed crosses the segment length, I play the ding (gated by `shared.sound_on`), flip `mode`, and reset the timer baseline. Cycles continue indefinitely; the user stops by pressing Pause or Reset, satisfying "until the user stops."

**Label colour as the only mode signal.** `segment_color()` returns `brand` for work, `green` for break — the spec confirms colour tokens can be returned from functions and consumed by `color:`.

**Settings via `shared:`.** Durations and the sound toggle live in the `shared:` block; sliders and the toggle bind directly to `shared.X` (allowed for slider/toggle per the spec). The main screen reads `shared.work_minutes * 60` etc. inside `segment_seconds()`, so changing a slider takes effect on the next segment automatically.

**`mm:ss` formatting.** No string interpolation and no built-in padding, so `pad()` prepends `"0"` for single-digit values; `round(n, 0)` is the spec's int-to-string converter.