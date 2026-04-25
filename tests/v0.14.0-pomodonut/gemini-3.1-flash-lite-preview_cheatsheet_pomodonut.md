Here is the complete Igni code for the Pomodonut app.

### The Code

```igni
shared:
  work_mins = 25
  break_mins = 5
  sound_enabled = true

screen Pomodonut, title: "Pomodonut":
  is_running = false
  mode = "Work"
  remaining = shared.work_mins * 60

  every 1s:
    if is_running:
      if remaining > 0:
        remaining = remaining - 1
      else:
        switch_mode()

  switch_mode():
    if mode is "Work":
      mode = "Break"
      remaining = shared.break_mins * 60
    else:
      mode = "Work"
      remaining = shared.work_mins * 60
    
    if shared.sound_enabled:
      play("ding.wav")

  # Color logic
  bg_color = red
  if mode is "Break":
    bg_color = green

  layout vertical, padding: large, align: center, fill: true, background: bg_color:
    label mode, style: heading
    label format_time(remaining), style: heading
    
    layout horizontal, gap: medium:
      button "Start/Pause", on tap: is_running = not is_running
      button "Reset", on tap: reset_timer()
    
    button "Settings", on tap: navigate to Settings

  reset_timer():
    is_running = false
    if mode is "Work":
      remaining = shared.work_mins * 60
    else:
      remaining = shared.break_mins * 60

  format_time(sec):
    minutes = sec / 60
    seconds = sec - (minutes * 60)
    
    # Simple formatting helper for mm:ss
    m_str = minutes
    s_str = seconds
    if seconds < 10:
      s_str = "0" + seconds
      
    return m_str + ":" + s_str

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: large:
    layout vertical:
      label "Work Duration: " + shared.work_mins + " min"
      slider bind: shared.work_mins, min: 1, max: 60
      
    layout vertical:
      label "Break Duration: " + shared.break_mins + " min"
      slider bind: shared.break_mins, min: 1, max: 30
      
    toggle bind: shared.sound_enabled, label: "Enable Sound"
    
    button "Back", on tap: navigate back
```

### Design Decisions

**Timer Implementation (`every 1s`)**
In Igni, there is no `setInterval` or mutable tick logic that persists across screen changes. The `every 1s:` block is the correct primitive for this. It runs independently while the screen is mounted. I store the timer state in a single variable (`remaining`) in seconds. When `every 1s` triggers, if `is_running` is true, we decrement this value. This ensures the app logic remains declarative: the UI is simply a function of the current `remaining` state.

**Shared State**
I used a `shared:` block for `work_mins`, `break_mins`, and `sound_enabled`. Because Igni components and screens are isolated, this allows the settings screen to modify variables that the `Pomodonut` screen can read. Note that when returning to the Pomodonut screen, the timer will use the *updated* values next time `reset_timer()` is called, keeping the logic clean and avoiding the need for complex listeners.

**State Flow**
- **Formatting:** I created a local `format_time` function. Since Igni requires `mm:ss` display, calculating this manually inside a function allows the UI code to remain clean while ensuring double-digit padding for seconds (e.g., `05` instead of `5`).
- **Reset Logic:** The `reset_timer()` function handles the transition logic. By basing the reset value on the current `mode` variable, we ensure that hitting "Reset" correctly restores the time for whichever segment (Work or Break) the user is currently in, without needing to track previous states.
- **Styling:** The background color is dynamically assigned via the `bg_color` variable based on the `mode`. This satisfies the requirement to distinguish Work (red) from Break (green) modes using the lexical reactivity of the screen body.