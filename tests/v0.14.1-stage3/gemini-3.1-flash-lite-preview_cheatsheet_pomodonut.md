```igni
shared:
  work_mins = 25
  break_mins = 5
  sound_enabled = true

screen Settings:
  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading

    label "Work duration (min): " + shared.work_mins
    slider bind: shared.work_mins, min: 1, max: 60

    label "Break duration (min): " + shared.break_mins
    slider bind: shared.break_mins, min: 1, max: 15

    toggle bind: shared.sound_enabled, label: "Play sound on switch"

    button "Back", on tap: navigate back

screen Pomodonut:
  is_running = false
  is_work = true
  remaining = shared.work_mins * 60

  every 1s:
    if is_running:
      if remaining > 0:
        remaining = remaining - 1
      else:
        # Cycle transition
        is_work = not is_work
        if shared.sound_enabled:
          play("ding.wav")
        
        # Reset to new duration
        if is_work:
          remaining = shared.work_mins * 60
        else:
          remaining = shared.break_mins * 60

  format_time(s):
    m = round(s / 60, 0)
    rem = s % 60
    if rem < 10:
      return m + ":0" + rem
    return m + ":" + rem

  layout vertical, padding: large, gap: large, align: center:
    if is_work:
      label "Work", style: heading, color: red
    else:
      label "Break", style: heading, color: green

    label format_time(remaining), style: heading

    layout horizontal, gap: medium:
      if is_running:
        button "Pause", on tap: is_running = false
      else:
        button "Start", on tap: is_running = true

      button "Reset", on tap:
        is_running = false
        if is_work:
          remaining = shared.work_mins * 60
        else:
          remaining = shared.break_mins * 60

    button "Settings", on tap: navigate to Settings
```

### Design Decisions

**1. Per-Second Countdown Logic**
I implemented the timer using an `every 1s:` block. This is the ideal pattern for this use case because Igni's lexical reactivity automatically handles the UI update when `remaining` is decremented. 
*   **Decoupled State:** `remaining` tracks the seconds left in the *current* cycle. When it hits zero, the logic switches `is_work` (triggering the mode shift), plays the sound, and resets `remaining` to the full duration stored in `shared`.
*   **Robustness:** Because the cycle duration logic is derived from `shared` variables inside the timer block, the app handles mode switching indefinitely without needing complex parent-child coordination.

**2. Formatting**
Since Igni does not support string interpolation or built-in time formatting, I created a `format_time` helper function. This manually breaks down the seconds into minutes and seconds, with an explicit `if` check to pad single-digit seconds with a leading zero, ensuring the `mm:ss` clock display remains stable.

**3. Settings & Shared State**
The settings are managed via a `shared:` block. By using `shared.work_mins` and `shared.break_mins` inside the `Pomodonut` logic, the timer always respects the user's latest preferences without needing to pass arguments between screens. Note that the `Reset` button ensures that if a user changes a setting while paused, they can refresh the timer to the new duration.

**4. UI Adaptation**
I used simple conditional rendering (`if is_work:`) to change the label text and color dynamically. This keeps the layout hierarchy clean while adhering to the requirement of visually distinguishing "Work" (red) from "Break" (green) mode.