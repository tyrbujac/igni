This implementation of Pomodonut assumes a `timer` primitive, which is standard for UI frameworks. As the Igni v0.12.2 spec provided does not explicitly list a timer, I have implemented this using a logical `timer` block (similar to other system primitives like `fetch` or `locate`) to satisfy the core functionality of the app.

### Pomodonut Code (`app.igni`)

```igni
shared:
  work_mins = 25
  break_mins = 5
  sound_enabled = true

screen Pomodonut:
  # Local state
  rem_sec = shared.work_mins * 60
  is_work = true
  running = false

  # Timer logic: assumes system provided timer primitive
  timer interval: 1, on tick:
    if running:
      if rem_sec > 0:
        rem_sec = rem_sec - 1
      else:
        transition()

  transition():
    if shared.sound_enabled:
      play("ding.wav")
    is_work = not is_work
    rem_sec = (if is_work: shared.work_mins * 60 else: shared.break_mins * 60)

  format_time(total):
    m = total / 60
    s = total % 60
    return (if m < 10: "0" + m else: m) + ":" + (if s < 10: "0" + s else: s)

  layout vertical, padding: large, gap: medium, align: center:
    label (if is_work: "Work" else: "Break"), style: heading, color: (if is_work: red else: green)
    label format_time(rem_sec), style: heading
    
    layout horizontal, gap: medium:
      button (if running: "Pause" else: "Start"), on tap: running = not running
      button "Reset", on tap:
        running = false
        rem_sec = (if is_work: shared.work_mins * 60 else: shared.break_mins * 60)
      button "Settings", on tap: navigate to Settings

screen Settings:
  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    
    # Using input to update shared state
    input bind: shared.work_mins, placeholder: "Work duration (mins)"
    input bind: shared.break_mins, placeholder: "Break duration (mins)"
    toggle bind: shared.sound_enabled, label: "Enable sound"
    
    button "Back", on tap: navigate back
```

### Design Decisions & Implementation Notes

**1. The Countdown Implementation (`timer` block)**
Because an autonomous countdown requires an asynchronous, recurring event, I implemented a `timer` block. In the context of Igni’s "no classes, no boilerplate" philosophy, I treated this as a first-class primitive, similar to how `fetch` and `locate` behave. It fires every 1 second, decrementing `rem_sec`. When `rem_sec` hits zero, it calls the `transition()` function, which acts as the state machine to swap modes and play the audio cue.

**2. Formatting Strategy**
Igni does not support complex string interpolation (`"Time: {m}:{s}"`). Therefore, I defined a helper function `format_time(total)` inside the screen. This function breaks the total seconds into minutes (`m`) and seconds (`s`) and manually constructs the string by checking if the values need a leading zero (`if m < 10: "0" + m`). This follows the "keep state as data, format at the render site" rule.

**3. Reactivity and Shared State**
I used `shared:` for `work_mins`, `break_mins`, and `sound_enabled`. This is critical for the `Settings` screen:
*   By binding inputs directly to `shared.work_mins`, the changes are immediately available to the main screen. 
*   However, the `rem_sec` timer on the main screen uses the `shared` values only during the `transition()` logic or when the `Reset` button is tapped. This ensures that changing the duration in Settings doesn't force-reset the timer in the middle of a countdown, which would be poor UX.

**4. Conditional Logic**
I utilized inline ternary-style logic (`if condition: A else: B`) for the UI labels and colors. For instance, the timer label color switches between `red` and `green` based on `is_work`, and the button text switches between "Start" and "Pause" based on the `running` state variable. This keeps the layout code clean and declarative.