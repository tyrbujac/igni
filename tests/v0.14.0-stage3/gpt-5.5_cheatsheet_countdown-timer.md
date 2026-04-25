```igni
screen Countdown:
  duration = 60
  start_time = 0
  tick = now()
  running = false

  every 1s:
    if running:
      tick = now()
      if remaining_time(duration, start_time, tick) is 0:
        running = false

  layout vertical, gap: large, padding: large, align: center:
    if remaining_time(duration, start_time, tick) is 0 and start_time is not 0:
      label "Time's up!", style: heading
    else:
      label format_time(remaining_time(duration, start_time, tick)), style: heading

    layout horizontal, gap: medium:
      button "Start", color: brand, on tap: start()
      button "Reset", color: subtle, on tap: reset()

  start():
    start_time = now()
    tick = start_time
    running = true

  reset():
    running = false
    start_time = 0
    tick = now()

  remaining_time(dur, start, t):
    if start is 0:
      return dur

    elapsed = t - start
    if elapsed >= dur:
      return 0

    return dur - elapsed

  format_time(seconds):
    if seconds is 60:
      return "01:00"

    if seconds < 10:
      return "00:0" + round(seconds, 0)

    return "00:" + round(seconds, 0)
```

The timer stores `start_time` as an absolute wall-clock timestamp from `now()`. Every second, while `running` is true, the `every 1s:` block updates `tick = now()`, which triggers the screen to re-render.

The remaining time is calculated from timestamps:

```igni
remaining = duration - (tick - start_time)
```

rather than by subtracting `1` each second. That means if the user navigates away and comes back, missed ticks do not matter: on return, the next `every 1s:` tick reads the current wall-clock time and the displayed remaining time jumps to the correct value.

When the calculated remaining time reaches `0`, the UI shows `"Time's up!"` instead of the `mm:ss` timer.