```igni
screen Tasks:
  items = [
    {name: "Ship release notes", done: false, priority: "high"},
    {name: "Review PRs", done: false, priority: "high"},
    {name: "Update dependencies", done: false, priority: "medium"},
    {name: "Water plants", done: false, priority: "low"},
    {name: "Fix login bug", done: true, priority: "high"},
    {name: "Write blog draft", done: false, priority: "medium"}
  ]

  layout vertical, gap: medium, padding: large:
    label length(filter(items, t => t.priority is "high")) + " high-priority tasks", style: heading

    each task in items:
      layout horizontal, gap: medium, align: center:
        checkbox bind: task.done, on change: toggle(task)
        label task.name

  toggle(target):
    items = replace(items, target, {target with done: not target.done})
```

### Design notes

- **Counting by field uses `length(filter(...))`, not `count(...)`.** The cheat sheet is explicit: `count` matches whole values only — `count(items, "high")` on a list of task *objects* would return 0. For field-based matching, `length(filter(items, t => t.priority is "high"))` is the idiomatic form.

- **String concatenation for the header.** No interpolation in Igni, so `length(...) + " high-priority tasks"` — the numeric result coerces into the concatenation.

- **Checkbox wired through a `toggle()` function.** List elements can't be mutated in place, so even though `checkbox bind: task.done` looks like it would work directly, the proper update flows through `replace(items, target, {target with done: not target.done})`. The `on change:` handler fires after the bound value flips, and `toggle()` reassigns `items` — which re-runs the screen body and re-renders the header count. Flipping any checkbox where `priority is "high"` updates the count reactively, but here the count is based on priority (which never changes), so the header stays stable — the reactivity is there if you later add priority editing.

- **`{target with done: not target.done}`** — the copy-with-overrides form, preferred over rebuilding the object field-by-field.

- **No `shared:` block.** All state is local to this one screen.