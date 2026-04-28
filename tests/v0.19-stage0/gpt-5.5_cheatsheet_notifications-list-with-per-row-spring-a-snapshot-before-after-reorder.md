```igni
# Notifications.igni

screen Notifications:
  newest_first = true

  notifications = [
    {id: "n1", message: "Build finished", recency: 0.95},
    {id: "n2", message: "Comment on your post", recency: 0.65},
    {id: "n3", message: "Weekly digest ready", recency: 0.30}
  ]

  ordered_notifications():
    if newest_first:
      return notifications
    return reversed(notifications)

  layout vertical, padding: large, gap: medium:
    label "Notifications", style: heading

    toggle bind: newest_first, label: "Newest first"

    layout vertical, gap: small:
      each item in ordered_notifications():
        layout vertical, padding: medium, background: card, rounded: medium, gap: small:
          label item.message
          layout horizontal, gap: small:
            label item.id, style: caption
            layout horizontal, width: spring(item.recency * 200), background: blue, rounded: small
```


```igni
# Notifications.test.igni

test "notification row springs follow row identity after reorder":
  render Notifications

  snapshot "notifications_initial"

  toggle newest_first

  mock every:
    advance 1s

  snapshot "notifications_reordered"
```