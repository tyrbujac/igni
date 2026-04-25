```igni
screen Countdown:
  duration = 60
  start_time = 0
  running = false
  tick = now()

  every 1s:
    if running:
      tick = now()

  layout vertical, gap: large, align: center:
    if running and tick - start_time >= duration:
      label "Time's up!", style: heading
    else:
      label format_time(remaining()), style: heading

    layout horizontal, gap: medium:
      button "Start", on tap: start()
      button "Reset", on tap: reset()

  start():
    start_time = now()
    running = true
    tick = start_time

  reset():
    running = false

  remaining():
    if not running:
      return duration
    elapsed = tick - start_time
    if elapsed >= duration:
      return 0
    return duration - elapsed

  format_time(sec):
    if sec >= 60:
      return "01:00"
    if sec < 10:
      return "00:0" + sec
    return "00:" + sec
```

### How it works

**Wall-clock timers, not decrementing counters.** 
Instead of tracking the remaining time and subtracting `1` on every tick, the countdown relies on absolute timestamps. When the user taps "Start", the `start()` function grabs the exact current time via `now()` (integer seconds since epoch) and saves it to `start_time`. 

The `remaining()` calculation simply finds the difference between the current `tick` and the `start_time`.

**Lexical Reactivity.**
The `every 1s:` block fires while the app is active, continually updating the `tick` variable to the newest `now()`. Following Igni's core reactivity rule, reassigning `tick` forces the screen to re-evaluate from the top. The layout redraws, calls `remaining()` to calculate the exact difference, formats it via `format_time()`, and renders the correct string (or "Time's up!" if 60 seconds have elapsed).

**Why it stays correct during navigation.**
If a user starts the timer, navigates to a different screen, and stays there for 20 seconds, the `every 1s:` block pauses. However, when they return, the block resumes and updates `tick` to the *current* `now()`. Because the math relies on `tick - start_time` instead of blindly subtracting `1` per tick, the UI instantly calculates that 20 seconds have elapsed and jumps exactly to the correct `mm:ss` display. No elapsed time is lost while the screen was unmounted.