```igni
shared:
  work_mins = 25
  break_mins = 5
  sound_enabled = true

screen Main:
  mode = "Work"
  running = false
  
  # Top-level variables evaluate once when the screen first opens
  mins = shared.work_mins
  secs = 0

  # Determine active colors based on mode
  mode_color = brand
  if mode is "Break":
    mode_color = green

  # Format minutes with leading zero
  m_str = "" + mins
  if mins < 10:
    m_str = "0" + mins

  # Format seconds with leading zero
  s_str = "" + secs
  if secs < 10:
    s_str = "0" + secs

  layout vertical, padding: large, align: center, gap: large:
    label mode, style: heading, color: mode_color
    label m_str + ":" + s_str, style: heading

    layout horizontal, gap: medium:
      if running:
        button "Pause", on tap: running = false
      else:
        button "Start", color: brand, on tap: running = true
      button "Reset", color: subtle, on tap: reset_timer()

    button "Settings", color: subtle, on tap: navigate to Settings

    # Manual timer advance (see design notes below)
    if running:
      button "Tick (Simulate 1s)", color: subtle, on tap: tick()

  reset_timer():
    running = false
    if mode is "Work":
      mins = shared.work_mins
    else:
      mins = shared.break_mins
    secs = 0

  transition():
    if mode is "Work":
      mode = "Break"
      mins = shared.break_mins
    else:
      mode = "Work"
      mins = shared.work_mins
    secs = 0
    
    if shared.sound_enabled:
      play("ding.wav")

  tick():
    if running:
      if secs is 0:
        if mins is 0:
          transition()
        else:
          mins = mins - 1
          secs = 59
      else:
        secs = secs - 1

screen Settings:
  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    
    label "Work Duration (mins)"
    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: dec_work()
      label shared.work_mins
      button "+", shape: circle, color: subtle, on tap: inc_work()
      
    label "Break Duration (mins)"
    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: dec_break()
      label shared.break_mins
      button "+", shape: circle, color: subtle, on tap: inc_break()
      
    toggle bind: shared.sound_enabled, label: "Enable sound on transition"
    
    layout vertical, fill: true:
    button "Back", color: subtle, on tap: navigate back

  dec_work():
    if shared.work_mins > 1:
      shared.work_mins = shared.work_mins - 1

  inc_work():
    shared.work_mins = shared.work_mins + 1
    
  dec_break():
    if shared.break_mins > 1:
      shared.break_mins = shared.break_mins - 1

  inc_break():
    shared.break_mins = shared.break_mins + 1
```

### Design Decisions & Workarounds

1. **The Per-Second Countdown (The "Tick" Button):** 
   The Igni `v0.12.2` spec has no asynchronous delayed loops, `sleep()`, `setTimeout`, or ticker hooks. Because all language features must be explicitly in the spec, there is no native way to increment a timer every second in the background. To satisfy the prompt's requirements using *only* valid primitives, I implemented the exact time-math logic in a `tick()` function and bound it to a "Tick (Simulate 1s)" button that appears when the timer is running. In a future version of Igni with lifecycle/timer hooks, you would bind `tick()` to that hook instead.
2. **Avoiding Modulo & Division for Time Formatting:**
   The spec's arithmetic is limited to `+`, `-`, `*`, `/`. Using division (`/`) yields floats, and there is no explicit `floor()` or modulo (`%`) documented to accurately slice total seconds into minutes and remaining seconds. Therefore, I opted to split `mins` and `secs` into distinct integer variables. The countdown manually decrements seconds, rolling over to `59` and deducting a minute when it hits `0`, bypassing the need for complex math entirely.
3. **State Persistence vs Re-assignment:**
   Top-level variables like `mins = shared.work_mins` run *once* when the screen opens. If a user tweaks settings mid-pomodoro, the timer doesn't jump abruptly when they navigate back (which would be bad UX). To apply newly adjusted duration settings, the user must explicitly hit the "Reset" button, which pulls the latest `shared.` values into local state.