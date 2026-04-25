```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

screen Pomodonut, title: "Pomodonut":
  mode = "Work"
  running = false
  minutes_left = shared.work_minutes
  seconds_left = 0
  last_tick = now()

  every 1s:
    if running:
      update_timer()

  layout vertical, gap: large, padding: large, align: center:
    if mode is "Work":
      label "Work", style: heading, color: red
    else:
      label "Break", style: heading, color: green

    if mode is "Work":
      label time_text(), style: heading, color: red
    else:
      label time_text(), style: heading, color: green

    layout horizontal, gap: medium, align: center:
      if running:
        button "Pause", color: subtle, on tap: pause()
      else:
        button "Start", color: brand, on tap: start()

      button "Reset", color: subtle, on tap: reset_segment()

    button "Settings", on tap: navigate to Settings

  start():
    last_tick = now()
    running = true

  pause():
    update_timer()
    running = false

  reset_segment():
    running = false
    if mode is "Work":
      minutes_left = shared.work_minutes
    else:
      minutes_left = shared.break_minutes
    seconds_left = 0
    last_tick = now()

  update_timer():
    current = now()
    elapsed = current - last_tick
    if elapsed > 0:
      last_tick = current
      consume(elapsed)

  consume(seconds):
    if seconds > 0:
      tick_one_second()
      consume(seconds - 1)

  tick_one_second():
    if minutes_left is 0 and seconds_left is 1:
      next_segment()
    else if seconds_left > 0:
      seconds_left = seconds_left - 1
    else if minutes_left > 0:
      minutes_left = minutes_left - 1
      seconds_left = 59
    else:
      next_segment()

  next_segment():
    if shared.sound_on:
      play("ding.wav")

    if mode is "Work":
      mode = "Break"
      minutes_left = shared.break_minutes
    else:
      mode = "Work"
      minutes_left = shared.work_minutes

    seconds_left = 0

  time_text():
    return two_digits(minutes_left) + ":" + two_digits(seconds_left)

  two_digits(value):
    if value < 10:
      return "0" + round(value, 0)
    return round(value, 0)


screen Settings, title: "Settings":
  layout vertical, gap: large, padding: large:
    label "Settings", style: heading

    layout vertical, gap: medium:
      label "Work duration", style: heading.small

      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, color: subtle, on tap: decrease_work()
        label round(shared.work_minutes, 0) + " minutes"
        button "+", shape: circle, color: brand, on tap: increase_work()

    layout vertical, gap: medium:
      label "Break duration", style: heading.small

      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, color: subtle, on tap: decrease_break()
        label round(shared.break_minutes, 0) + " minutes"
        button "+", shape: circle, color: brand, on tap: increase_break()

    toggle bind: shared.sound_on, label: "Sound"

    button "Back", on tap: navigate back

  increase_work():
    shared.work_minutes = shared.work_minutes + 1

  decrease_work():
    if shared.work_minutes > 1:
      shared.work_minutes = shared.work_minutes - 1

  increase_break():
    shared.break_minutes = shared.break_minutes + 1

  decrease_break():
    if shared.break_minutes > 1:
      shared.break_minutes = shared.break_minutes - 1
```

The app stores settings in `shared:` so changes made on the Settings screen persist when returning to `Pomodonut`.

The countdown uses Igni’s `every 1s:` recurrence. Instead of blindly subtracting one second only, `update_timer()` compares `now()` with `last_tick`, then consumes the elapsed seconds. That keeps the timer closer to wall-clock time if the screen is paused briefly or the user visits Settings and returns.

Time formatting is handled with `two_digits()` plus `round(value, 0)`, producing the required `mm:ss` display. Segment transitions happen in `next_segment()`, which switches between `"Work"` and `"Break"`, loads the appropriate shared duration, and plays `ding.wav` when sound is enabled.