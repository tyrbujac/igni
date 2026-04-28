### Notifications.igni

```igni
screen Notifications:
  notifications = [
    {id: 1, message: "New comment", recency: 0.2},
    {id: 2, message: "System update", recency: 0.8},
    {id: 3, message: "Security alert", recency: 0.9}
  ]
  newest_first = true

  layout vertical, padding: large, gap: medium:
    toggle bind: newest_first, label: "Sort newest first"
    
    layout vertical, gap: small:
      each item in display_list():
        layout horizontal, gap: medium, background: card, padding: medium, rounded: medium:
          label item.message
          label spring(item.recency * 100)

  display_list():
    if newest_first:
      return notifications
    return reversed(notifications)
```

### Notifications.test.igni

```igni
test "notifications row springs track identity across reordering":
  render Notifications
  
  # Initial state snapshot
  snapshot "notifications_initial"
  
  # Flip the toggle to trigger the reordering
  toggle newest_first
  
  # Verify rows are reordered
  # Per-row springs capture the target value, which is deterministic 
  # by construction in the serializer, so no need to pump or settle.
  snapshot "notifications_reordered"
```

### Key Implementation Notes:

1.  **Reactivity:** The screen uses a `display_list()` function to compute the ordering. Since the layout reads this function, it will automatically re-render whenever `newest_first` is toggled.
2.  **Spring Identity:** By iterating `each item in display_list()`, the row's state is keyed by the item itself. When the order changes, the `spring` associated with the notification `id: 1` will maintain its state and animate correctly because the identity remains constant, even though its index in the UI tree has changed.
3.  **Deterministic Snapshots:** As defined in the cheat sheet, `snapshot` captures the target value of `spring()` (via `Tween.end`). This allows the test to remain deterministic and reliable without needing to wait for animation frames, as the snapshot reflects the final state the animation is moving toward.
4.  **No `await`:** There is no `await` or `pump` required; the Igni testing framework's `snapshot` command reads the properties directly from the component's current internal state at the moment the test statement executes.