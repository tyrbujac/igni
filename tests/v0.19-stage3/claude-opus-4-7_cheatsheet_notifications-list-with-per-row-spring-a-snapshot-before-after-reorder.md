# Notifications.igni

```igni
screen Notifications:
  newest_first = true
  notifications = [
    {id: 1, message: "New follower",        recency: 0.95},
    {id: 2, message: "Comment on your post", recency: 0.70},
    {id: 3, message: "Weekly digest",        recency: 0.40},
    {id: 4, message: "Old reminder",         recency: 0.10},
  ]

  layout vertical, padding: large, gap: medium:
    label "Notifications", style: heading
    toggle bind: newest_first, label: "Newest first"

    each item in visible_list():
      layout horizontal, gap: medium, padding: medium, background: card, rounded: medium:
        label item.message
        label spring(item.recency * 100)

  visible_list():
    if newest_first:
      return notifications
    return reversed(notifications)
```

# Notifications.test.igni

```igni
test "rows keep their spring identity when the list reorders":
  render Notifications
  snapshot "notifications_initial"
  toggle newest_first
  snapshot "notifications_reordered"
```

## Why this is correct per the cheatsheet

**Row identity in the spring.** The `each item in visible_list():` iterates the items themselves, not indices, so each `spring(item.recency * 100)` is keyed by row identity. When `newest_first` flips and `visible_list()` returns `reversed(notifications)`, the same item objects appear in reversed positions — Igni's per-row spring state stays attached to each item, so the target value in row N after reordering is the recency of *that item*, not whatever was previously at position N.

**Derived list goes through a function, not a top-level `=`.** `visible_list()` re-evaluates whenever `newest_first` (or `notifications`) changes — the cheatsheet's "derived state needs a function" rule. Writing `visible = if newest_first: notifications else: reversed(notifications)` at the top of the screen body would capture the initial value once and never update.

**Toggle reorders without a separate handler.** `toggle bind: newest_first` reassigns the variable on flip; the screen re-evaluates; `visible_list()` re-runs; the `each` rebuilds in the new order. No `on change:` needed.

**Snapshot determinism with `spring()`.** Per the cheatsheet's Q4c rule: snapshots capture the spring's *target* value (read from `Tween.end`), not an in-flight frame. So the test needs no `advance` or `pumpAndSettle` before `snapshot` — both snapshots deterministically show each row's target recency. The reordered snapshot will show the same `recency * 100` values attached to the same `message`s, just in reverse order — which is exactly what proves spring state follows row identity, not list position.

**Test-scope forms used correctly.** `render Notifications` (no parens, screen form), `toggle newest_first` (verb + bind-variable selector, no parens — test-scope syntax), `snapshot "<name>"` (no parens). All are test-scope special forms per the cheatsheet's predicate/action table.