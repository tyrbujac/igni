Here are the two files. 

### `StepCounter.igni`

```igni
screen StepCounter:
  target_steps = 0
  displayed_steps = spring(target_steps)
  last_reset_at = now()
  seconds_ago = 0

  every 1s:
    seconds_ago = now() - last_reset_at

  layout vertical, gap: medium, padding: large, align: center:
    label displayed_steps, style: heading
    label "Last reset " + seconds_ago + "s ago"
    
    layout horizontal, gap: medium:
      button "Add 100", on tap: target_steps = target_steps + 100
      button "Reset", on tap: reset()

  reset():
    target_steps = 0
    last_reset_at = now()
    seconds_ago = 0  # Reassign locally so the UI updates instantly, without waiting for the next 1s tick
```

### `StepCounter.test.igni`

```igni
test "spring counter reaches target after advancing time":
  render StepCounter
  tap "Add 100"
  
  # Advances simulated test-time, settling the animation and ticking any active `every` blocks
  mock every:
    advance 1s
    
  # Asserts the deterministic target value of the binding
  expect value_of(displayed_steps) is 100

test "StepCounter snapshot is stable with frozen time":
  # Fixes now() so the rendered "Last reset Xs ago" text is deterministic
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    snapshot "step_counter_initial"
```