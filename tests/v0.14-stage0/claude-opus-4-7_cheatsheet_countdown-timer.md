```igni
screen Countdown:
  duration = 60
  start_time = 0
  running = false
  tick = now()

  every 1s:
    if running:
      tick = now()

  layout vertical, gap: large, align: center, padding: large:
    if remaining() is 0 and running:
      label "Time's up!", style: heading
    else:
      label format(remaining()), style: heading

    layout horizontal, gap: medium:
      button "Start", color: brand, on tap: start()
      button "Reset", on tap: reset()

  start():
    if not running:
      start_time = now()
      tick = now()
      running = true

  reset():
    running = false
    start_time = 0
    tick = now()

  remaining():
    if not running:
      return duration
    elapsed = tick - start_time
    if elapsed >= duration:
      return 0
    return duration - elapsed

  format(secs):
    if secs >= 60:
      return "01:00"
    if secs < 10:
      return "00:0" + round(secs, 0)
    return "00:" + round(secs, 0)
```

### How it works

- **State.** `start_time` records the wall-clock second the user pressed Start; `tick` is the most recent observed wall-clock second; `running` gates everything. Top-level assignments only fire once when the screen first opens, so these aren't reset on re-evaluation.
- **Reactive ticking.** The `every 1s:` block reassigns `tick = now()` once per second while running. The reactivity rule then re-runs the screen body, which calls `remaining()` and `format(...)` and re-renders the label.
- **Wall-clock-correct.** `remaining()` doesn't decrement a counter — it computes `duration - (tick - start_time)`. The displayed value is always derived from real timestamps, so any jitter or pause in the tick loop doesn't accumulate drift.
- **Navigate-away behavior.** Per the spec, `every` blocks pause when the screen unmounts and resume on return; missed ticks are not replayed. That's exactly what we want here: when the user comes back, the next tick (within a second) reassigns `tick = now()`, `remaining()` recomputes against the original `start_time`, and the display jumps straight to the correct value — including "Time's up!" if 60 seconds have already elapsed in the background. A counter-decrement approach (`remaining = remaining - 1`) would have lost those seconds; the absolute-timestamp approach reads them back correctly.
- **Reset** clears `running` and `start_time`, so `remaining()` short-circuits to `duration` and the label shows `01:00` again.