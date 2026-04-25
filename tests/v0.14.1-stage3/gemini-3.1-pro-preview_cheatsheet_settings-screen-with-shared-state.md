```igni
shared:
  step = 1
  sound_on = false

screen Main, title: "Counter":
  count = 0

  layout vertical, padding: large, gap: large, align: center:
    label count, style: heading
    
    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, on tap: count = count - shared.step
      button "+", shape: circle, on tap: increment()
    
    divider
    button "Settings", color: subtle, on tap: navigate to Settings

  increment():
    count = count + shared.step
    if shared.sound_on:
      play("click.wav")

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: large:
    layout vertical, gap: small:
      label "Increment Step (" + shared.step + ")"
      slider bind: shared.step, min: 1, max: 10
    
    toggle bind: shared.sound_on, label: "Sound on tap"
    
    layout vertical, fill: true:
    button "Back", on tap: navigate back
```

### How Persistence Works Here

1. **The `shared:` Block**: State declared at the top of the file (`step` and `sound_on`) lives outside of any specific screen's lifecycle. It acts as a single source of truth for the entire app.
2. **Direct Binding**: In the `Settings` screen, the `slider` and `toggle` are directly bound to `shared.step` and `shared.sound_on`. Every drag of the slider or flip of the toggle instantly updates the shared variable—no manual `on change:` handlers or event callbacks are required.
3. **Lexical Read**: When you `navigate back` to the `Main` screen, its local state (`count = 0`) hasn't reset because you never left the app session. When you tap the "+" button, the `increment()` function simply reads the newly updated `shared.step` and `shared.sound_on` values in real-time.