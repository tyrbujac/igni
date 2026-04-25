```igni
screen Timer:
  duration = 60
  start_time = 0
  current_time = 0
  running = false

  every 1s:
    if running:
      current_time = now()

  layout vertical, gap: medium, align: center:
    if running and (duration - (current_time - start_time) > 0):
      label format(duration - (current_time - start_time)), style: heading
    else if running:
      label "Time's up!", style: heading
    else:
      label "01:00", style: heading

    button "Start", on tap: start()
    button "Reset", on tap: reset()

  start():
    start_time = now()
    current_time = now()
    running = true

  reset():
    running = false
    start_time = 0
    current_time = 0

  format(remaining):
    m = remaining / 60
    s = remaining - (m * 60)
    return pad(m) + ":" + pad(s)

  pad(n):
    if n < 10:
      return "0" + n
    return n
```

### How the countdown works

*   **Wall-clock correction:** We don't rely on a simple counter that decrements (`remaining = remaining - 1`). If we did, the timer would drift or pause if the user navigated away. Instead, we capture the epoch timestamp via `start_time = now()` when the user presses Start.
*   **Re-calculating on return:** The `every 1s:` block is suspended when the user navigates away. When they return, the screen re-evaluates. `current_time` is updated to the *current* `now()`. The math `duration - (current_time - start_time)` calculates the exact difference, effectively "jumping" the timer to the correct position regardless of how much time passed while the screen was unmounted.
*   **Formatting:** Since Igni lacks string interpolation and ternary operators, we use a helper `format` function to split the `remaining` seconds into minutes and seconds, and a `pad` function to add the leading zero for single-digit values.