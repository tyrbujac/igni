```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

  segment = "Work"
  running = false
  start_time = 0
  paused_remaining = 1500
  tick = 0

screen Pomodonut, title: "Pomodonut":
  every 1s:
    if shared.running:
      shared.tick = now()
      if current_remaining() <= 0:
        next_segment()

  layout vertical, gap: large, padding: large, align: center:
    label shared.segment, style: heading, color: segment_color()
    label time_text(current_remaining()), style: heading

    if shared.running:
      button "Pause", color: subtle, on tap: pause_timer()
    else:
      button "Start", color: brand, on tap: start_timer()

    button "Reset", color: danger, on tap: reset_segment()
    button "Settings", on tap: navigate to Settings

  start_timer():
    if not shared.running:
      shared.start_time = now()
      shared.tick = shared.start_time
      shared.running = true

  pause_timer():
    if shared.running:
      shared.paused_remaining = current_remaining()
      shared.running = false

  reset_segment():
    shared.running = false
    shared.paused_remaining = segment_duration()
    shared.start_time = 0
    shared.tick = now()

  next_segment():
    if shared.sound_on:
      play("ding.wav")

    if shared.segment is "Work":
      shared.segment = "Break"
      shared.paused_remaining = shared.break_minutes * 60
    else:
      shared.segment = "Work"
      shared.paused_remaining = shared.work_minutes * 60

    shared.start_time = now()
    shared.tick = shared.start_time
    shared.running = true

  current_remaining():
    if shared.running:
      elapsed = shared.tick - shared.start_time
      left = shared.paused_remaining - elapsed
      if left <= 0:
        return 0
      return left

    return shared.paused_remaining

  segment_duration():
    if shared.segment is "Work":
      return shared.work_minutes * 60

    return shared.break_minutes * 60

  segment_color():
    if shared.segment is "Work":
      return brand

    return green

  time_text(total):
    mins = minutes_part(total)
    secs = seconds_part(total)
    return two_digits(mins) + ":" + two_digits(secs)

  minutes_part(total):
    if total < 60:
      return 0

    return 1 + minutes_part(total - 60)

  seconds_part(total):
    if total < 60:
      return total

    return seconds_part(total - 60)

  two_digits(value):
    if value < 10:
      return "0" + round(value, 0)

    return round(value, 0)


screen Settings, title: "Settings":
  layout vertical, gap: large, padding: large:
    label "Work duration", style: heading.small

    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: decrease_work()
      label minutes_label(shared.work_minutes), style: heading.small
      button "+", shape: circle, color: brand, on tap: increase_work()

    label "Break duration", style: heading.small

    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: decrease_break()
      label minutes_label(shared.break_minutes), style: heading.small
      button "+", shape: circle, color: brand, on tap: increase_break()

    toggle bind: shared.sound_on, label: "Sound"

    button "Back", on tap: navigate back

  increase_work():
    shared.work_minutes = shared.work_minutes + 1

    if shared.segment is "Work" and not shared.running:
      shared.paused_remaining = shared.work_minutes * 60

  decrease_work():
    if shared.work_minutes > 1:
      shared.work_minutes = shared.work_minutes - 1

      if shared.segment is "Work" and not shared.running:
        shared.paused_remaining = shared.work_minutes * 60

  increase_break():
    shared.break_minutes = shared.break_minutes + 1

    if shared.segment is "Break" and not shared.running:
      shared.paused_remaining = shared.break_minutes * 60

  decrease_break():
    if shared.break_minutes > 1:
      shared.break_minutes = shared.break_minutes - 1

      if shared.segment is "Break" and not shared.running:
        shared.paused_remaining = shared.break_minutes * 60

  minutes_label(value):
    return round(value, 0) + " min"
```

This uses `shared:` for settings and timer state so changes made on the Settings screen persist when returning to `Pomodonut`.

The countdown is driven by Igni’s `every 1s:` recurrence. Instead of decrementing a counter every second, the app stores `start_time = now()` when the segment starts, updates `shared.tick = now()` once per second, and calculates:

```igni
paused_remaining - (shared.tick - shared.start_time)
```

That keeps the timer tied to wall-clock time. Pausing stores the current remaining seconds in `shared.paused_remaining`; starting again captures a new `start_time`.

When the remaining time reaches zero, `next_segment()` switches between `"Work"` and `"Break"`, resets the remaining duration from the shared settings, and plays `ding.wav` if sound is enabled.

Because Igni v0.14 does not include modulo or integer division helpers, the `mm:ss` display is built with small recursive helpers: `minutes_part()` subtracts 60s at a time, and `seconds_part()` returns the leftover seconds.