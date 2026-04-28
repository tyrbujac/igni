Here are the two files. 

Because we iterate over `item in displayed()` (the object references) rather than indices, the spring animation state stays bound to the row's identity. And because the test snapshot captures `Tween.end` (the target value) rather than an arbitrary intermediate animation frame, the snapshot runs instantly and is deterministic by construction—no time-advancing or settling required.

### `Notifications.igni`

```igni
screen Notifications:
  newest_first = true
  
  # Static list for the example; normally this might come from a fetch()
  notifications = [
    {id: 1, message: "System update", recency: 0.9},
    {id: 2, message: "New login", recency: 0.5},
    {id: 3, message: "Backup complete", recency: 0.1}
  ]

  displayed():
    if newest_first:
      return notifications
    return reversed(notifications)

  layout vertical, padding: large, gap: medium:
    layout horizontal, align: center, spread: true:
      label "Notifications", style: heading
      toggle bind: newest_first, label: "Newest first"
    
    # Iterate over the items directly so spring() keys by row identity, 
    # not list index. Reordering won't jumble the animation state.
    each item in displayed():
      layout horizontal, padding: medium, gap: medium, background: card, rounded: medium:
        label item.message
        layout horizontal, fill: true, align: end:
          label spring(item.recency * 100)
```

### `Notifications.test.igni`

```igni
test "Notifications list reorders and preserves row spring identity":
  render Notifications
  
  # Snapshot 1: Captures the initial list. The spring's target values
  # (90, 50, 10) are captured deterministically without needing to advance time.
  snapshot "notifications_initial"
  
  # The event-sim selector for a toggle is its bind: variable name.
  toggle newest_first
  
  # Snapshot 2: List is reversed. Because the iteration is by item reference, 
  # the serialized tree will show the rows in reverse order but each row's 
  # spring will still target its correct, respective value.
  snapshot "notifications_reordered"
```