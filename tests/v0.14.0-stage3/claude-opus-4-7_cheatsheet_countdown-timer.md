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
      label display(), style: heading

    layout horizontal, gap: medium:
      button "Start", color: brand, on tap: start()
      button "Reset", color: subtle, on tap: reset()

  start():
    start_time = now()
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

  display():
    r = remaining()
    mm = 0
    ss = r
    if r >= 60:
      mm = 1
      ss = r - 60
    return pad(mm) + ":" + pad(ss)

  pad(n):
    if n < 10:
      return "0" + round(n, 0)
    return round(n, 0)
```

**How it works.** State is just three plain variables: `start_time` (a UTC timestamp captured by `now()` when Start is tapped), `running` (a flag), and `tick` (a reactive timestamp the `every 1s:` block keeps refreshing). Every second the block reassigns `tick`, which triggers Igni's lexical-reactivity rule and re-renders the screen — the label re-reads `remaining()` and shows the new mm:ss.

The key trick is computing remaining time from **wall-clock subtraction** (`tick - start_time`), not by decrementing a counter. That's what keeps it correct across navigation: `every 1s:` pauses while the screen is unmounted and missed ticks are *not* replayed (per the spec's lifecycle rule). If the user navigates away with 45s left and comes back 30s later, the block fires once on return, `tick` jumps forward by 30, and `remaining()` correctly reports 15. A decrement-based timer would have lost those seconds. When `remaining()` hits 0, the conditional swaps the timer label for "Time's up!"; Reset zeroes everything out so the next Start begins a fresh 60s window.