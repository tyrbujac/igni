```igni
screen Tasks, title: "Tasks":
  tasks = [
    {name: "Pay rent", done: false, priority: "high"},
    {name: "Reply to client", done: true, priority: "high"},
    {name: "Buy groceries", done: false, priority: "medium"},
    {name: "Book dentist", done: false, priority: "medium"},
    {name: "Water plants", done: true, priority: "low"},
    {name: "Clean desk", done: false, priority: "low"}
  ]

  high_count = length(filter(tasks, task => task.priority is "high"))
  medium_count = length(filter(tasks, task => task.priority is "medium"))
  low_count = length(filter(tasks, task => task.priority is "low"))

  layout vertical, gap: medium, padding: large:
    label high_count + " high priority, " + medium_count + " medium, " + low_count + " low"

    each task in tasks:
      layout horizontal, gap: medium, align: center:
        checkbox bind: task.done
        label task.name
```

Design decisions:
- I used a local `tasks` list with 6 hardcoded objects, as requested.
- The summary counts are computed with `filter(...)` + `length(...)`, which matches the spec and counts all tasks regardless of `done`.
- Each task is rendered as a horizontal row with a `checkbox` and `label`.
- I kept the task row minimal since only the checkbox and name were required.