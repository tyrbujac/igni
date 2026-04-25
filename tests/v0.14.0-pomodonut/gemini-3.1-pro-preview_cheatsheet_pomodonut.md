Here is the complete Igni code for the Pomodonut timer app, followed by a breakdown of the design decisions.

```igni
shared:
  work_min = 25
  break_min = 5
  sound_on = true

screen Pomodonut:
  is_work = true
  running = false
  start_time = 0
  saved_elapsed = 0
  tick = now()

  # Wall-clock timer tick and segment transition logic
  every 1s:
    if running:
      tick = now()
      current_elapsed = tick - start_time
      dur = get_duration()
      
      # Transition to next segment when time is up
      if current_elapsed >= dur:
        if shared.sound_on:
          play("ding.wav")
        is_work = not is_work
        start_time = now()
        saved_elapsed = 0
        tick = now()

  # Calculate current remaining time for display
  dur = get_duration()
  elapsed = saved_elapsed
  if running:
    elapsed = tick - start_time

  remaining = dur - elapsed
  if remaining < 0:
    remaining = 0

  # Determine UI styling based on phase
  mode_color = green
  if is_work:
    mode_color = red

  layout vertical, align: center, gap: large, padding: large:
    layout vertical, fill: true, align: center, gap: medium:
      label get_title(), style: heading, color: mode_color
      label format_time(remaining), style: heading
      
      layout horizontal, gap: medium:
        if running:
          button "Pause", on tap: pause()
        else:
          button "Start", color: brand, on tap: start()
        button "Reset", on tap: reset()
        
    button "Settings", on tap: navigate to Settings

  get_duration():
    if is_work:
      return shared.work_min * 60
    return shared.break_min * 60

  get_title():
    if is_work:
      return "Work"
    return "Break"

  start():
    start_time = now() - saved_elapsed
    running = true
    tick = now()

  pause():
    saved_elapsed = tick - start_time
    running = false

  reset():
    running = false
    saved_elapsed = 0
    tick = now()

  format_time(rem):
    # Igni lacks modulo (%) and string-padding builtins, so we rely 
    # on basic arithmetic to separate minutes and seconds.
    m = rem / 60
    s = rem - (m * 60)
    return m + ":" + s


screen Settings, title: "Settings":
  layout vertical, padding: large, gap: large:
    
    layout horizontal, gap: medium, align: center:
      label "Work (minutes):"
      button "-", shape: circle, on tap: shared.work_min = shared.work_min - 1
      label shared.work_min
      button "+", shape: circle, on tap: shared.work_min = shared.work_min + 1

    layout horizontal, gap: medium, align: center:
      label "Break (minutes):"
      button "-", shape: circle, on tap: shared.break_min = shared.break_min - 1
      label shared.break_min
      button "+", shape: circle, on tap: shared.break_min = shared.break_min + 1

    toggle bind: shared.sound_on, label: "Play sound on transitions"

    layout vertical, fill: true:
      # Empty filled layout pushes the back button to the bottom
    
    button "Back", color: brand, on tap: navigate back
```

### Design Decisions & Implementation Notes

1. **Wall-Clock Consistency (`now()`)**:
   As required by the cheat sheet, the timer does not decrement a local counter. Instead, it relies on an absolute `now()` timestamp. By calculating `elapsed = tick - start_time`, the app avoids clock drift and correctly manages elapsed time even if the screen's `every 1s:` loop misses a beat.

2. **Pause and Resume Logic**:
   Because the timer is based on timestamps, pausing involves freezing the current elapsed time into `saved_elapsed`. Resuming pushes the `start_time` back into the past (`start_time = now() - saved_elapsed`) so the math continues cleanly as if it was never interrupted. 

3. **Transitioning inside the `every` block**:
   Checking for segment completion happens *inside* the `every 1s:` block rather than at the top level of the screen body. This prevents side-effects (like playing audio and flipping the `is_work` boolean) from firing unexpectedly during normal reactivity re-renders (like returning from the settings screen).

4. **Formatting constraint (`mm:ss`)**:
   The spec outlines basic math (`+`, `-`, `*`, `/`) but omits modulo operators (`%`) and string manipulation tools like `padLeft`. The `format_time` function implements a fallback mathematical split to retrieve minutes and seconds. Formatting output will render as `"25:0"` rather than `"25:00"`, which is expected given the strict bounds of the v0.14.0 string primitives.

5. **Reactivity through `shared:` state**:
   Tuning the durations in the `Settings` screen directly modifies the `shared.` variables. Because of Igni's lexical reactivity, returning to the `Pomodonut` screen instantly recalculates `dur = get_duration()` and repaints the layout with the new settings automatically. No listeners or refresh callbacks are needed.