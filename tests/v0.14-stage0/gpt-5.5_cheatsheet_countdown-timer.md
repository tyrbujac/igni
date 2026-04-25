```igni
screen Countdown, title: "Countdown":
  duration = 60
  start_time = 0
  running = false
  tick = now()

  every 1s:
    if running:
      tick = now()
      if remaining(duration, start_time, tick) is 0:
        running = false

  layout vertical, gap: large, padding: large, align: center:
    if remaining(duration, start_time, tick) is 0 and start_time is not 0:
      label "Time's up!", style: heading
    else:
      label format_time(remaining(duration, start_time, tick)), style: heading

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

  remaining(dur, start, t):
    if start is 0:
      return dur

    elapsed = t - start
    if elapsed >= dur:
      return 0

    return dur - elapsed

  format_time(seconds):
    if seconds >= 60:
      return "01:00"

    if seconds < 10:
      return "00:0" + round(seconds, 0)

    return "00:" + round(seconds, 0)
```

The timer stores the wall-clock `start_time` when the user taps **Start**. Every second, the `every 1s:` block updates `tick = now()`, which re-renders the screen.

The remaining time is computed from timestamps:

```igni
elapsed = tick - start_time
remaining = duration - elapsed
```

So the timer does **not** depend on decrementing a counter. If the user navigates away, the `every` block pauses, but when they return it reads `now()` again and recomputes the remaining time from the original `start_time`. That keeps the countdown correct even if several seconds passed while the screen was away.