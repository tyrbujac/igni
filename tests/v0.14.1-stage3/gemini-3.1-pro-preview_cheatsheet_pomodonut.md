```igni
shared:
  work_mins = 25
  break_mins = 5
  sound_enabled = true
  
  is_work = true
  running = false
  end_time = 0
  paused_remaining = 1500  # Starts at 25 minutes (1500 seconds)

screen Pomodonut:
  tick = now()

  every 1s:
    if shared.running:
      tick = now()
      if shared.end_time - tick <= 0:
        transition(tick)

  # Calculate current display time defensively to avoid negative flicker
  current_rem = shared.paused_remaining
  if shared.running:
    current_rem = shared.end_time - tick
    if current_rem < 0:
      current_rem = 0

  # Reactively set styling based on the current mode
  bg_color = red
  mode_title = "Work"
  if not shared.is_work:
    bg_color = green
    mode_title = "Break"

  layout vertical, fill: true, align: center, background: bg_color, padding: large, gap: large:
    label mode_title, style: heading
    label format_time(current_rem), style: heading
    
    layout horizontal, gap: medium:
      if shared.running:
        button "Pause", on tap: pause()
      else:
        button "Start", on tap: start()
      button "Reset", on tap: reset()

    # Anchor settings button to the bottom
    layout vertical, fill: true:
    button "Settings", on tap: navigate to Settings

  start():
    shared.end_time = now() + shared.paused_remaining
    shared.running = true

  pause():
    shared.running = false
    shared.paused_remaining = shared.end_time - tick

  reset():
    shared.running = false
    if shared.is_work:
      shared.paused_remaining = shared.work_mins * 60
    else:
      shared.paused_remaining = shared.break_mins * 60

  transition(current_time):
    if shared.sound_enabled:
      play("ding.wav")
      
    shared.is_work = not shared.is_work
    
    next_mins = shared.break_mins
    if shared.is_work:
      next_mins = shared.work_mins
      
    shared.end_time = current_time + (next_mins * 60)
    shared.paused_remaining = next_mins * 60

  format_time(total_sec):
    m = total_sec / 60
    s = total_sec - (m * 60)
    return pad(m) + ":" + pad(s)

  pad(n):
    if n < 10:
      return "0" + n
    return "" + n


screen Settings, title: "Settings":
  layout vertical, padding: large, gap: large:
    
    layout vertical, gap: small:
      label "Work Duration (minutes)"
      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, on tap: update_work(-1)
        label shared.work_mins
        button "+", shape: circle, on tap: update_work(1)

    layout vertical, gap: small:
      label "Break Duration (minutes)"
      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, on tap: update_break(-1)
        label shared.break_mins
        button "+", shape: circle, on tap: update_break(1)

    toggle bind: shared.sound_enabled, label: "Play sound on transition"

    layout vertical, fill: true:
    button "Back", on tap: navigate back

  update_work(delta):
    new_val = shared.work_mins + delta
    if new_val >= 1:
      shared.work_mins = new_val
      if not shared.running and shared.is_work:
        shared.paused_remaining = new_val * 60

  update_break(delta):
    new_val = shared.break_mins + delta
    if new_val >= 1:
      shared.break_mins = new_val
      if not shared.running and not shared.is_work:
        shared.paused_remaining = new_val * 60
```

### Design Decisions

1. **State Ownership (`shared:` vs local):**
   The core timer state (running status, remaining time, end time) must live in the `shared:` block, not the local screen scope. If it were local, navigating to the Settings screen and back would completely reset the variables to their default declarations. Keeping them shared ensures the timer can continue silently in the background while settings are tweaked.
2. **Wall-clock Timer Precision:**
   Per the spec's warning, I am not using the relative decrement pattern (`paused_remaining = paused_remaining - 1`). Instead, when the timer is started, we calculate an absolute `end_time = now() + remaining`. The `every 1s:` block simply updates `tick` to calculate how much time is left until `end_time`. This guarantees the timer doesn't drift and naturally handles scenarios where the app briefly pauses or the screen loses focus.
3. **Time Formatting without built-ins:**
   Since Igni avoids boilerplate and lacks explicitly documented `floor()` or `%` modulo built-ins, I relied on standard integer arithmetic principles (`m = total / 60` and `s = total - (m * 60)`) backed by a small `pad()` helper to enforce the requested `mm:ss` string format cleanly inside the screen.
4. **Declarative Layout Styling:**
   I dynamically update the `bg_color` layout property via reassignment to easily flip the app's visual identity depending on if `shared.is_work` is `true` (red) or `false` (green). I specifically applied `fill: true` to the outermost container to ensure the colored background stretches fully across the available window real estate.