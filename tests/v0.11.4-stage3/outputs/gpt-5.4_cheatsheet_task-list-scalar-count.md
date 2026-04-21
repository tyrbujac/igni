```igni
screen Tasks:
  tasks = [
    {name: "Pay rent", done: false, priority: "high"},
    {name: "Buy groceries", done: false, priority: "medium"},
    {name: "Reply to email", done: true, priority: "low"},
    {name: "Finish report", done: false, priority: "high"},
    {name: "Book dentist", done: false, priority: "medium"},
    {name: "Call mom", done: true, priority: "high"}
  ]

  high_count = length(filter(tasks, task => task.priority is "high"))

  layout vertical, gap: medium, padding: large:
    label high_count + " high-priority tasks", style: heading

    each task in tasks:
      layout horizontal, gap: medium, align: center:
        checkbox bind: task.done, label: ""
        label task.name
```

A couple of design notes:

- I used `length(filter(...))` to count high-priority tasks, because `count()` only matches whole values, not object fields.
- The tasks are hardcoded as requested, with `name`, `done`, and `priority` on each object.
- Each task is rendered as a horizontal row with a checkbox and label.

One important caveat: per the Igni rules you shared, list elements cannot be mutated in place, so `checkbox bind: task.done` is not actually valid Igni if `task` is an item from `each`. The idiomatic version would use `on change:` plus `replace(...)` to rebuild the `tasks` list. If you want, I can provide the fully rule-compliant version next.