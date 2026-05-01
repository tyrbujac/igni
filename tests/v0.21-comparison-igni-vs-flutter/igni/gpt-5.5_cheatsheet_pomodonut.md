```igni
shared:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

screen Pomodonut, title: "Pomodonut":
  segment = "work"
  running = false
  tick = now()
  started_at = now()
  paused_remaining = shared.work_minutes * 60

  every 1s:
    if running:
      tick = now()
      if remaining() <= 0:
        if shared.sound_on:
          play("ding.wav")
        next_segment()

  layout vertical, padding: large, gap: medium:
    layout vertical, fill: true, gap: medium, align: center:
      if segment is "work":
        label "Work", style: heading, color: brand
      else:
        label "Break", style: heading, color: green

      label format_time(remaining()), style: heading

      layout horizontal, gap: medium, align: center:
        if running:
          button "Pause", color: subtle, on tap: toggle_running()
        else:
          button "Start", color: brand, on tap: toggle_running()

        button "Reset", color: subtle, on tap: reset_timer()

    button "Settings", color: brand, on tap: navigate to Settings

  duration_for_segment():
    if segment is "work":
      return floor(shared.work_minutes) * 60
    return floor(shared.break_minutes) * 60

  remaining():
    if running:
      left = paused_remaining - (tick - started_at)
      if left < 0:
        return 0
      return left
    return paused_remaining

  toggle_running():
    if running:
      paused_remaining = remaining()
      running = false
    else:
      started_at = now()
      tick = now()
      running = true

  reset_timer():
    running = false
    tick = now()
    started_at = now()
    paused_remaining = duration_for_segment()

  next_segment():
    if segment is "work":
      segment = "break"
      paused_remaining = floor(shared.break_minutes) * 60
    else:
      segment = "work"
      paused_remaining = floor(shared.work_minutes) * 60
    started_at = now()
    tick = now()
    running = true

  format_time(total):
    safe = total
    if safe < 0:
      safe = 0
    minutes = floor(safe / 60)
    seconds = safe - (minutes * 60)
    return two_digits(minutes) + ":" + two_digits(seconds)

  two_digits(value):
    if value < 10:
      return "0" + round(value, 0)
    return round(value, 0)

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: large:
    layout vertical, gap: small:
      layout horizontal, spread: true, align: center:
        label "Work duration", style: title
        label round(floor(shared.work_minutes), 0) + " min"
      slider bind: shared.work_minutes, min: 1, max: 60

    layout vertical, gap: small:
      layout horizontal, spread: true, align: center:
        label "Break duration", style: title
        label round(floor(shared.break_minutes), 0) + " min"
      slider bind: shared.break_minutes, min: 1, max: 30

    toggle bind: shared.sound_on, label: "Sound"

    layout vertical, fill: true:

    button "Back", color: brand, on tap: navigate back
```