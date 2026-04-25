```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

  mode = "Work"
  running = false
  remaining_minutes = 25
  remaining_seconds = 0


component MinuteStepper(title, value):
  layout horizontal, gap: medium, align: center:
    label title
    button "-", shape: circle, color: subtle, on tap: emit decrement
    label value
    button "+", shape: circle, color: subtle, on tap: emit increment


screen Pomodonut, title: "Pomodonut":
  mode_color = brand
  if shared.mode is "Break":
    mode_color = green

  seconds_text = round(shared.remaining_seconds, 0)
  if shared.remaining_seconds < 10:
    seconds_text = "0" + round(shared.remaining_seconds, 0)

  time_text = round(shared.remaining_minutes, 0) + ":" + seconds_text

  layout vertical, gap: large, padding: large, align: center:
    label shared.mode, style: heading, color: mode_color
    label time_text, style: heading, color: mode_color

    layout horizontal, gap: medium, align: center:
      if shared.running:
        button "Pause", color: subtle, on tap: pause()
      else:
        button "Start", color: brand, on tap: start()

      button "Reset", color: danger, on tap: reset_segment()

    button "Settings", color: subtle, on tap: navigate to Settings

    # Igni v0.12.2 has no timer / interval primitive.
    # This button is the spec-compliant stand-in for one elapsed second.
    if shared.running:
      button "Tick 1s", color: subtle, on tap: tick()

  start():
    shared.running = true

  pause():
    shared.running = false

  reset_segment():
    shared.running = false
    if shared.mode is "Work":
      shared.remaining_minutes = shared.work_minutes
      shared.remaining_seconds = 0
    else:
      shared.remaining_minutes = shared.break_minutes
      shared.remaining_seconds = 0

  tick():
    if shared.running:
      if shared.remaining_seconds > 1:
        shared.remaining_seconds = shared.remaining_seconds - 1
      else if shared.remaining_seconds is 1:
        advance_segment()
      else if shared.remaining_minutes > 0:
        shared.remaining_minutes = shared.remaining_minutes - 1
        shared.remaining_seconds = 59
      else:
        advance_segment()

  advance_segment():
    if shared.mode is "Work":
      shared.mode = "Break"
      shared.remaining_minutes = shared.break_minutes
      shared.remaining_seconds = 0
    else:
      shared.mode = "Work"
      shared.remaining_minutes = shared.work_minutes
      shared.remaining_seconds = 0

    if shared.sound_on:
      play("ding.wav")


screen Settings, title: "Settings":
  layout vertical, gap: large, padding: large:
    label "Settings", style: heading

    MinuteStepper "Work minutes", shared.work_minutes, on decrement: decrease_work(), on increment: increase_work()
    MinuteStepper "Break minutes", shared.break_minutes, on decrement: decrease_break(), on increment: increase_break()

    toggle bind: shared.sound_on, label: "Sound"

    button "Back", color: brand, on tap: navigate back

  decrease_work():
    if shared.work_minutes > 1:
      shared.work_minutes = shared.work_minutes - 1
      if shared.mode is "Work" and not shared.running:
        shared.remaining_minutes = shared.work_minutes
        shared.remaining_seconds = 0

  increase_work():
    shared.work_minutes = shared.work_minutes + 1
    if shared.mode is "Work" and not shared.running:
      shared.remaining_minutes = shared.work_minutes
      shared.remaining_seconds = 0

  decrease_break():
    if shared.break_minutes > 1:
      shared.break_minutes = shared.break_minutes - 1
      if shared.mode is "Break" and not shared.running:
        shared.remaining_minutes = shared.break_minutes
        shared.remaining_seconds = 0

  increase_break():
    shared.break_minutes = shared.break_minutes + 1
    if shared.mode is "Break" and not shared.running:
      shared.remaining_minutes = shared.break_minutes
      shared.remaining_seconds = 0
```

Igni v0.12.2, as specified, does **not** include a timer, interval, delay, sleep, clock, or lifecycle primitive. Screens only re-evaluate when referenced state is reassigned, and the spec only gives user events, `fetch()`, and `locate()` as ways to cause later reassignment.

So the automatic per-second countdown cannot be implemented faithfully using only the provided Igni primitives. The `tick()` function above contains the correct Pomodoro transition logic, and the `"Tick 1s"` button is a spec-compliant stand-in for “one second elapsed.”

If Igni later added a primitive such as `every second: tick()` or `timer 1s, on tick: tick()`, that would be the only missing piece. The rest of the app uses shared state for persisted settings, switches between Work and Break indefinitely, and plays `ding.wav` on each segment transition when sound is enabled.