# Tasks Screen

```igni
screen Tasks, title: "Tasks":
  items = [
    {name: "Ship v0.12 release notes", done: false, priority: "high"},
    {name: "Review pull requests", done: true, priority: "high"},
    {name: "Update dependencies", done: false, priority: "medium"},
    {name: "Write blog draft", done: false, priority: "medium"},
    {name: "Clean up old branches", done: true, priority: "low"},
    {name: "Reorganise bookmarks", done: false, priority: "low"},
  ]

  high = filter(items, item => item.priority is "high")
  medium = filter(items, item => item.priority is "medium")
  low = filter(items, item => item.priority is "low")

  layout vertical, gap: medium, padding: large:
    label length(high) + " high priority, " + length(medium) + " medium, " + length(low) + " low"

    each item in items:
      layout horizontal, gap: medium, align: center:
        checkbox bind: item.done
        label item.name

  toggle(target):
    items = replace(items, target, {target with done: not target.done})
```

## Design decisions

**Counts via `filter` + `length`.** The spec gives `count(items, target)` for occurrences of a specific value, but priority is a string *field* inside each object, not the item itself — identity-based `count` wouldn't match. `filter` with a predicate lambda is the right tool, and `length` of each filtered list gives the breakdown.

**String concatenation for the summary.** Igni has no string interpolation, so the summary line is built with `+`. `length()` returns a number and `+` concatenates it into the string cleanly.

**Hardcoded list with mixed `done` states.** Two tasks start `done: true` so the checkboxes visibly reflect bound state on first render.

**Row layout.** Each task is a `layout horizontal` with `align: center` so the checkbox and label sit on the same baseline with consistent spacing.

**A note on `checkbox bind: item.done`.** Per the spec's immutability rule ("List elements cannot be mutated in place — updates flow through reassignment"), binding directly to `item.done` inside an `each` loop is the pattern a beginner would reach for, but strictly the correct form routes through a `replace` call — which is why I included the `toggle(target)` function at the bottom as the canonical mutation path. If the checkbox's direct bind doesn't trigger reactivity in a given Igni build, swap the row to:

```igni
checkbox bind: item.done, on change: toggle(item)
```

and let `toggle` rebuild the list via `replace` + `{target with done: ...}`.