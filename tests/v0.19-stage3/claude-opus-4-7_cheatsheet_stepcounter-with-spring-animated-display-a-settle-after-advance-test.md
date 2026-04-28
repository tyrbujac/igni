# StepCounter.igni

```igni
screen StepCounter:
  target_steps = 0
  displayed_steps = spring(target_steps)
  last_reset_at = now()
  tick = now()

  every 1s:
    tick = now()

  layout vertical, gap: medium, padding: large, align: center:
    label displayed_steps, style: heading
    label "Last reset " + (tick - last_reset_at) + "s ago", style: caption
    button "Add 100", color: brand, on tap: target_steps = target_steps + 100
    button "Reset", on tap: reset()

  reset():
    target_steps = 0
    last_reset_at = now()
```

# StepCounter.test.igni

```igni
test "spring counter reaches target after advancing time":
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    tap "Add 100"
    mock every:
      advance 1s
    expect value_of(displayed_steps) is 100

test "step counter renders deterministic initial snapshot":
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    snapshot "step_counter_initial"
```

## Notes on the choices

- **`spring(target_steps)`** is the value-animation primitive — `target_steps` reassigns on tap, `displayed_steps` interpolates toward the new target.
- **`tick = now()` driven by `every 1s:`** is the wall-clock-correct timer pattern from the cheatsheet. A bare `now()` reference in the layout wouldn't re-evaluate; reading `tick` (which the `every` block reassigns) does.
- **`reset()` is a screen-internal function** so the "Reset" button keeps both assignments together. After `render StepCounter` in tests, it would be in test scope if needed.
- **Test 1** uses `freeze_time:` to anchor `now()` (so the timestamp UI doesn't drift mid-test) and `mock every: advance 1s` to push the test clock — `advance` moves both the every-scheduler and frozen `now()` forward together. `value_of(displayed_steps)` returns the spring's target value deterministically per the snapshot rule.
- **Test 2** wraps `render` + `snapshot` inside `freeze_time:` so the "Last reset 0s ago" string is identical on every run. Without the freeze, `tick - last_reset_at` would render different integers each run and the golden would churn.