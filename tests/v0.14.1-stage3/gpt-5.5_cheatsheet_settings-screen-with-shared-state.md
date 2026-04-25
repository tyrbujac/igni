```igni
shared:
  step = 1
  sound_on = true

screen Main:
  count = 0

  layout vertical, gap: medium, padding: large, align: center:
    label "Counter", style: heading
    label count, style: heading

    layout horizontal, gap: medium:
      button "-", shape: circle, color: subtle, on tap: decrement()
      button "+", shape: circle, color: brand, on tap: increment()

    button "Settings", on tap: navigate to Settings

  increment():
    if shared.sound_on:
      play("click.wav")
    count = count + shared.step

  decrement():
    count = count - shared.step

screen Settings:
  layout vertical, gap: medium, padding: large:
    label "Settings", style: heading

    label "Increment step"
    label shared.step
    slider bind: shared.step, min: 1, max: 10

    toggle bind: shared.sound_on, label: "Sound on tap"

    button "Back", on tap: navigate back
```

The settings persist because `step` and `sound_on` live in the top-level `shared:` block. Both screens read from `shared.step` and `shared.sound_on`, and the settings screen binds its slider and toggle directly to those shared fields. When the user changes them, Igni reassigns the shared values, so the main screen uses the updated settings when you navigate back.