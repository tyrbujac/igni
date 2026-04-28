# Notifications.igni

```igni
shared:
  notifications = [
    {id: 1, message: "New message from Ada", recency: 0.95},
    {id: 2, message: "Build finished", recency: 0.7},
    {id: 3, message: "Weekly digest ready", recency: 0.4},
    {id: 4, message: "Reminder: standup at 10am", recency: 0.15}
  ]

screen Notifications, title: "Notifications":
  newest_first = true

  layout vertical, gap: medium, padding: large:
    toggle bind: newest_first, label: "Newest first"
    divider

    layout vertical, gap: small, transition: fade:
      each item in ordered():
        layout vertical, gap: small, padding: medium, background: card, rounded: medium:
          label item.message, style: body
          layout horizontal, width: spring(item.recency * 300), background: brand, rounded: small:
            label " "

  ordered():
    if newest_first:
      return sorted(shared.notifications, n => 1 - n.recency)
    return sorted(shared.notifications, n => n.recency)
```

A note on the shape: the `each` iterates `ordered()` directly (not over indices), so each row's `spring(item.recency * 300)` keys to the row's `id`-bearing object identity. When `newest_first` flips, the rows reorder visually but each row's spring keeps tracking *its* `item.recency` — the spring on row id `1` keeps targeting `0.95 * 300 = 285` whether it's rendered at position 0 or position 3.

The `transition: fade` on the outer list layout animates the reorder swap (child set's positional identity changes), while the per-row `spring()` independently handles each row's bar width. Two animation primitives, two distinct jobs, no overlap.

# Notifications.test.igni

```igni
test "notifications list snapshots stably across reorder, with per-row spring identity preserved":
  freeze_time: 2026-04-28T12:00:00Z
    render Notifications, shared.notifications: [
      {id: 1, message: "New message from Ada", recency: 0.95},
      {id: 2, message: "Build finished", recency: 0.7},
      {id: 3, message: "Weekly digest ready", recency: 0.4},
      {id: 4, message: "Reminder: standup at 10am", recency: 0.15}
    ]

    mock every:
      advance 1s

    snapshot "notifications_initial"

    toggle newest_first

    mock every:
      advance 1s

    snapshot "notifications_reordered"
```

Why this test catches the identity rule:

- **Snapshots capture the spring's target value**, not an intermediate frame — so `advance 1s` is belt-and-braces (the target is captured regardless of whether the spring has settled), but it keeps the test honest about the "let things stabilise" intent.
- **`shared.notifications` is pre-set** in the `render` call, making the test self-contained and independent of whatever the production `shared:` block declares as defaults.
- **The reordered snapshot must show the same four rows** with the same target widths (`285`, `210`, `120`, `45`), just in reversed structural position. If `spring()` were keyed by index instead of row identity, the reordered snapshot would show rows whose spring targets had *animated toward each other's recency values* — the snapshot diff would expose the bug.
- **`freeze_time:` block** keeps both snapshots deterministic; without it, any `now()`-derived UI (none here, but defensive) would drift. The block extent ends on dedent, matching the cheatsheet's one-way-to-do-everything rule.

The two snapshot files (`notifications_initial`, `notifications_reordered`) become the regression contract — review them once on first run with `igni test --update-snapshots`, and any future change to row chrome, ordering logic, or per-row spring binding surfaces as a snapshot diff.