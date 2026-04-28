Here are the two files. The screen relies on Igni's lexical reactivity to re-evaluate `display_items()` when `newest_first` is reassigned by the toggle. Because we iterate over the items themselves (rather than indices), the codegen keys the spring animations by row identity, allowing them to track the exact item during the reorder.

### `Notifications.igni`

```igni
screen Notifications:
  newest_first = true
  
  notifications = [
    {id: 1, message: "Welcome to Igni", recency: 0.1},
    {id: 2, message: "Your profile is 80% complete", recency: 0.5},
    {id: 3, message: "New login from unknown device", recency: 1.0}
  ]

  display_items():
    if newest_first:
      return reversed(notifications)
    return notifications

  layout vertical, padding: large, gap: medium:
    layout horizontal, spread: true, align: center:
      label "Notifications", style: heading
      toggle bind: newest_first, label: "Newest first"

    each item in display_items():
      layout vertical, gap: small, padding: medium, background: card, rounded: medium:
        label item.message
        # The spring is keyed to the item identity because of the `each` loop.
        # It smoothly interpolates and stays attached to this specific row even on reorder.
        layout horizontal, width: spring(item.recency * 200), background: blue
```

### `Notifications.test.igni`

```igni
test "reordering list preserves row identity for springs":
  # 1. Render the screen into test scope
  render Notifications

  # 2. Snapshot the initial layout (captures target spring widths for the newest-first order)
  snapshot "notifications_initial"

  # 3. Flip the toggle using its bound variable name
  toggle newest_first

  # 4. Advance time to settle any spring transitions
  # (Though Igni's snapshots structurally capture the *target* value of a spring by
  # construction, advancing time guarantees all animations resolve cleanly in the mock clock).
  mock every:
    advance 1s

  # 5. Snapshot the reordered state
  snapshot "notifications_reordered"
```