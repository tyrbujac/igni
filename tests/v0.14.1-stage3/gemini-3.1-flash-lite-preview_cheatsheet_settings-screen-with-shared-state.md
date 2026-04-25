```igni
shared:
  step = 1
  sound_on = false

screen Main:
  count = 0

  layout vertical, gap: large, align: center:
    label count, style: heading
    layout horizontal, gap: medium:
      button "-", shape: circle, on tap: update_count(-1)
      button "+", shape: circle, on tap: update_count(1)
    button "Settings", on tap: navigate to Settings

  update_count(delta):
    count = count + (delta * shared.step)
    if shared.sound_on:
      play("click.wav")

screen Settings:
  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    layout vertical:
      label "Step size: " + shared.step
      slider bind: shared.step, min: 1, max: 10
    toggle bind: shared.sound_on, label: "Sound on tap"
    button "Back", on tap: navigate back
```

### Explanation of Shared State

*   **`shared:` Block:** We define `step` and `sound_on` in the `shared:` block at the top level of the file. This makes these variables global and accessible to any screen in the app.
*   **Binding:** In the `Settings` screen, we use `bind:` to connect the `slider` and `toggle` directly to `shared.step` and `shared.sound_on`. Igni automatically handles the reassignment and reactivity for these shared values.
*   **Access:** In the `Main` screen, the `update_count` function reads `shared.step` and `shared.sound_on` dynamically. Because the values are stored in the `shared` namespace, they persist regardless of which screen is currently active, and the `Main` screen always accesses the most current value held by the shared state.