```igni
shared persisted:
  work_minutes = 25
  break_minutes = 5
  sound_on = true

screen Pomodonut, title: "Pomodonut":
  segment = "Work"
  remaining = shared.work_minutes * 60
  running = false

  every 1s:
    if running:
      tick()

  layout vertical, padding: large, gap: medium, align: center:
    label segment, style: heading, color: color_for_segment()
    label format_time(remaining), style: heading

    layout horizontal, gap: medium, align: center:
      button start_label(), color: start_color(), on tap: toggle_running()
      button "Reset", color: subtle, on tap: reset()

    layout vertical, fill: true

    button "Settings", on tap: navigate to Settings

  color_for_segment():
    result = brand
    if segment is "Break":
      result = green
    return result

  start_label():
    result = "Start"
    if running:
      result = "Pause"
    return result

  start_color():
    result = brand
    if running:
      result = subtle
    return result

  toggle_running():
    running = not running

  reset():
    running = false
    if segment is "Work":
      remaining = shared.work_minutes * 60
    else:
      remaining = shared.break_minutes * 60

  tick():
    remaining = remaining - 1
    if remaining <= 0:
      swap_segment()

  swap_segment():
    if shared.sound_on:
      play("ding.wav")
    if segment is "Work":
      segment = "Break"
      remaining = shared.break_minutes * 60
    else:
      segment = "Work"
      remaining = shared.work_minutes * 60

  format_time(total):
    minutes = floor(total / 60)
    seconds = total - minutes * 60
    return pad(minutes) + ":" + pad(seconds)

  pad(n):
    result = "" + n
    if n < 10:
      result = "0" + n
    return result

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: medium:
    label "Work duration", style: title
    label "" + shared.work_minutes + " min"
    slider bind: shared.work_minutes, min: 1, max: 60

    label "Break duration", style: title
    label "" + shared.break_minutes + " min"
    slider bind: shared.break_minutes, min: 1, max: 30

    toggle bind: shared.sound_on, label: "Sound"

    layout vertical, fill: true

    button "Back", on tap: navigate back
```