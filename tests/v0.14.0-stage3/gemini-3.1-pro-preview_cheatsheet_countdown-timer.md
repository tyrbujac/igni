Here is the complete Igni code for the 60-second countdown timer. 

```igni
screen Countdown:
  duration = 60
  start_time = 0
  running = false
  tick = now()

  every 1s:
    if running:
      tick = now()
      if remaining(duration, start_time, tick) is 0:
        running = false

  # Calculate remaining time for display
  rem = duration
  if start_time > 0:
    rem = remaining(duration, start_time, tick)

  layout vertical, padding: large, gap: large, align: center:
    if rem is 0:
      label "Time's up!", style: heading
    else:
      label format_time(rem), style: heading

    layout horizontal, gap: medium:
      button "Start", on tap: start()
      button "Reset", on tap: reset()

  start():
    if running is false:
      start_time = now()
      tick = now()
      running = true

  reset():
    running = false
    start_time = 0
    tick = now()

  remaining(dur, start, t):
    elapsed = t - start
    if elapsed >= dur:
      return 0
    return dur - elapsed

  format_time(s):
    if s is 60:
      return "01:00"
    if s < 10:
      return "00:0" + s
    return "00:" + s
```

### How it works

1. **Absolute Wall-Clock Tracking:** Instead of manually subtracting `1` from a `remaining` variable every second, this countdown records an absolute `start_time` using `now()` (which returns integer seconds since epoch). On every tick, it subtracts the `start_time` from the current time to find the true elapsed time. 
2. **Navigating Away:** If the user starts the timer, navigates to a different screen for 10 seconds, and comes back, the `every 1s:` block will have paused. However, because we evaluate elapsed time using `now() - start_time`, the moment the screen mounts again and `tick` updates, the calculation instantly factors in the 10 seconds that passed while the screen was unmounted. The timer remains perfectly accurate.
3. **Reactivity:** When the `every 1s:` block executes and updates `tick`, the lexical reactivity rule triggers. The screen automatically re-evaluates from top to bottom. It recalculates `rem` and updates the layout conditionally showing either the formatted time or the "Time's up!" label.
4. **String Formatting:** Because Igni prioritizes simplicity and lacks complex string-padding builtins, the `format_time(s)` helper function handles the strict 60-second layout manually, injecting the `"00:0"` string prefix for single-digit seconds to preserve the `mm:ss` display.