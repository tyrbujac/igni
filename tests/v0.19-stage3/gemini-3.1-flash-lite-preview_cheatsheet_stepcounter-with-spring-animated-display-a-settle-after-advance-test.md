Here is the `StepCounter` implementation and its corresponding test file, adhering to the Igni v0.19.0 spec.

### StepCounter.igni

```igni
screen StepCounter:
  target_steps = 0
  displayed_steps = spring(target_steps)
  last_reset_at = now()
  seconds_since_reset = 0

  every 1s:
    seconds_since_reset = now() - last_reset_at

  layout vertical, padding: large, gap: medium, align: center:
    label displayed_steps, style: heading
    label "Last reset " + seconds_since_reset + "s ago", style: caption
    
    layout horizontal, gap: small:
      button "Add 100", on tap: target_steps = target_steps + 100
      button "Reset", on tap: reset()

  reset():
    target_steps = 0
    last_reset_at = now()
```

***

### StepCounter.test.igni

```igni
test "displayed_steps reaches 100 after animation":
  # 1. Freeze time so the timestamp logic is deterministic
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    tap "Add 100"
    
    # 2. Advance time to settle the spring and ensure every block fires
    mock every:
      advance 1s
      
    # 3. Assert target reached
    expect value_of(displayed_steps) is 100

test "reset timestamp UI snapshot is stable":
  # 1. Freeze time to ensure 'seconds_since_reset' calculation is consistent
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    tap "Add 100"
    
    # 2. Advance so the reset logic captures the frozen time
    mock every:
      advance 10s
    tap "Reset"
    
    # 3. Capture deterministic snapshot
    snapshot "reset_ui_at_zero"
```

### Key Implementation Notes:
*   **Reactivity:** The screen reads `seconds_since_reset`, which is updated by the `every 1s:` block. This correctly triggers a re-render of the label every second.
*   **Spring:** `displayed_steps` is bound to the `spring()` primitive. In the test, we use `value_of(displayed_steps)` which, per the spec, returns the target value, allowing us to verify the state reached 100.
*   **Testing:** 
    *   Used `freeze_time:` to handle the `now()` dependency. Because `now()` is non-reactive and would otherwise produce different results every time the test runs, fixing it is required for stable snapshots.
    *   Used `mock every: advance 1s` to simulate the passage of time, which triggers the `every` block and the spring animation settling.
    *   `value_of` was used to inspect the variable state inside the test scope as defined in the cheatsheet.