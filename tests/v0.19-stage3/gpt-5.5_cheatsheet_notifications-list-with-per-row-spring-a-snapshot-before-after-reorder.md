### `Notifications.igni`

```igni
screen Notifications:
  newest_first = true

  notifications = [
    {id: 1, message: "Build finished", recency: 0.95},
    {id: 2, message: "New comment on your post", recency: 0.72},
    {id: 3, message: "Weekly digest is ready", recency: 0.41},
    {id: 4, message: "Password changed", recency: 0.18}
  ]

  layout vertical, padding: large, gap: medium:
    label "Notifications", style: heading

    toggle bind: newest_first, label: "Newest first"

    layout vertical, gap: small:
      each notification in ordered_notifications():
        layout horizontal, gap: medium, padding: medium, background: card, rounded: medium:
          label notification.message
          label spring(notification.recency * 100)

  ordered_notifications():
    if newest_first:
      return notifications
    return reversed(notifications)
```

### `Notifications.test.igni`

```igni
test "notifications springs stay attached to rows when reordered":
  render Notifications
  snapshot "notifications_initial"

  toggle newest_first
  snapshot "notifications_reordered"
```

Snapshots are deterministic here without explicit settling: Igni snapshots capture a `spring()`’s target value, not an intermediate animation frame. Since the `spring()` is inside `each notification in ordered_notifications():`, the per-row spring state tracks the notification row identity rather than the row’s position in the list.