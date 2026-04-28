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
test "tapping Add 100 settles displayed_steps to 100":
  freeze_time: 2026-04-28T12:00:00Z
    render StepCounter
    tap "Add 100"
    mock every:
      advance 5s
    expect value_of(displayed_steps) is 100

test "initial render snapshot with frozen time":
  freeze_time: 2026-04-28T12:00:00Z
    render StepCounter
    snapshot "step_counter_initial"
```

## Notes on the choices

**Why `tick = now()` plus `every 1s:`.** The "Last reset Xs ago" label has to recompute every second while the screen is mounted. A bare `now()` reference in the label would be non-reactive (the cheatsheet is explicit: "A bare `now()` reference does NOT cause re-evaluation"). The canonical wall-clock-correct pattern from the *Recurrence* section is to capture `tick = now()` at the top, re-read it inside `every 1s:`, and let the layout read `tick`. Subtracting `last_reset_at` from `tick` gives integer seconds since reset, which the spec confirms `now()` returns.

**Why `freeze_time:` (block) wraps both tests.** Test 2 needs deterministic `now()` for the snapshot — the cheatsheet calls this out directly: "`now()`-derived UI without one of these produces non-deterministic snapshots." Test 1 also benefits: `freeze_time:` couples with `mock every: advance` so the test clock moves forward together when time advances, which keeps the test hermetic even though Test 1 doesn't assert on the timestamp UI.

**Why `advance 5s` settles the spring.** The cheatsheet says snapshots and `value_of()` on a `spring()` capture the **target value** — but the test asks specifically about the *settled displayed value*, and `value_of(displayed_steps)` with the test clock advanced past the system spring duration reads the settled target (`100`). 5s is comfortably past any reasonable spring settle time and matches the Stopwatch example's `advance 60s` rhythm.

**Why `reset()` is a screen-internal function rather than inline.** Two assignments share one tap; factoring into a function keeps the button line readable and matches the Todo example's `add()` shape. Both `target_steps = 0` and `last_reset_at = now()` are reassignments to top-level variables, so the reactivity rule re-renders the screen and re-targets the spring to `0`.