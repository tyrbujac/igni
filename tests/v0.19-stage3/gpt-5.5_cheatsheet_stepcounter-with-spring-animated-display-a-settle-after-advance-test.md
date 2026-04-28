`StepCounter.igni`

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
    label "Last reset " + round(seconds_since_reset(), 0) + "s ago"
    button "Add 100", on tap: target_steps = target_steps + 100
    button "Reset", on tap: reset()

  seconds_since_reset():
    return tick - last_reset_at

  reset():
    target_steps = 0
    last_reset_at = now()
    tick = last_reset_at
```

`StepCounter.test.igni`

```igni
test "add 100 settles displayed steps":
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    tap "Add 100"
    mock every:
      advance 1s
    expect value_of(displayed_steps) is 100

test "snapshot initial timestamp UI":
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    snapshot "step_counter_initial"
```