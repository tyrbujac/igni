Here is the complete implementation for the `StepCounter` screen and its corresponding tests, strictly following the Igni v0.19.0 draft specifications.

### `StepCounter.igni`

The screen uses `spring()` to declaratively interpolate the displayed step count. For the absolute wall-clock timer, we capture the initial timestamp and update a current `tick` via a 1-second recurrence block, safely calculating the elapsed time on every re-render. 

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
    label "Last reset " + (tick - last_reset_at) + "s ago"
    
    button "Add 100", on tap: target_steps = target_steps + 100
    button "Reset", on tap: reset()

  reset():
    target_steps = 0
    last_reset_at = now()
    tick = now()  # reassign tick immediately so the UI snaps to "0s ago" without waiting for the next every block
```

### `StepCounter.test.igni`

The tests use `freeze_time:` blocks to ensure that all `now()` calls evaluate to a deterministic timestamp, allowing both the timer computations and the captured structural snapshot to be perfectly stable across runs.

```igni
test "spring counter reaches target after advancing time":
  freeze_time: 2026-04-28T12:00:00Z
    render StepCounter
    
    tap "Add 100"
    
    # Advances the test clock, which fires any due `every` blocks 
    # and processes the interpolated spring animation to its settled state.
    mock every:
      advance 1s
      
    # Asserting against the rendered output ensures the UI 
    # visually caught up to the animated target value.
    expect seen "100"

test "snapshot of timestamp-derived UI is deterministic":
  freeze_time: 2026-04-28T12:00:00Z
    render StepCounter
    
    # Because we're under a freeze_time block, `now()` evaluates to 
    # exactly 2026-04-28T12:00:00Z. The snapshot will consistently 
    # capture "Last reset 0s ago" without race conditions.
    snapshot "step_counter_initial"
```