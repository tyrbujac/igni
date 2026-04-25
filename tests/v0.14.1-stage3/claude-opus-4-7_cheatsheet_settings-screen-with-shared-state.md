# Counter App

```igni
shared:
  step = 1
  sound_on = false

screen Main:
  count = 0

  layout vertical, gap: medium, padding: large, align: center:
    label count, style: heading
    layout horizontal, gap: medium:
      button "-", shape: circle, on tap: decrement()
      button "+", shape: circle, on tap: increment()
    button "Settings", on tap: navigate to Settings

  increment():
    count = count + shared.step
    if shared.sound_on:
      play("click.wav")

  decrement():
    count = count - shared.step

screen Settings, title: "Settings":
  layout vertical, gap: large, padding: large:
    label "Increment step", style: body
    slider bind: shared.step, min: 1, max: 10
    label shared.step, style: caption
    toggle bind: shared.sound_on, label: "Sound on tap"
    button "Back", on tap: navigate back
```

## How settings persist

The top-level `shared:` block declares `step` and `sound_on` as app-wide state, accessible from any screen via the `shared.` prefix.

On the Settings screen, the `slider` and `toggle` bind directly to `shared.step` and `shared.sound_on`. Per the spec, these primitives accept `shared.X` directly — every drag or flip auto-wraps in `shared.update()`, so the new values are written into shared state immediately.

When the user navigates back, the Main screen reads `shared.step` and `shared.sound_on` inside its `increment()` / `decrement()` handlers. Because lexical reactivity tracks references to shared fields, any subsequent change to those values would also re-render Main automatically — but here, the values simply hold their last-set state across the navigation, with no manual save/load needed.