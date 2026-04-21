### Igni Implementation: Tasks

```igni
screen Tasks:
  # Initial hardcoded state
  tasks = [
    {name: "Setup CI/CD", done: false, priority: "high"},
    {name: "Refactor API", done: false, priority: "high"},
    {name: "Design System", done: true, priority: "medium"},
    {name: "Write Tests", done: false, priority: "high"},
    {name: "Update Docs", done: false, priority: "low"},
    {name: "Email Client", done: true, priority: "medium"}
  ]

  # Derived state calculation
  high_priority_count = length(filter(tasks, t => t.priority is "high"))

  layout vertical, padding: large, gap: medium:
    label high_priority_count + " high-priority tasks", style: heading
    
    divider

    each task in tasks:
      layout horizontal, align: center, gap: medium:
        checkbox bind: task.done, on change: update_task(task)
        label task.name

  # Update logic via replace (maintaining object identity)
  update_task(target):
    tasks = replace(tasks, target, {target with done: target.done})
```

### Design Decisions

*   **Reactive Derived State:** The `high_priority_count` is calculated at the top of the screen body. Because Igni re-evaluates the entire screen whenever `tasks` is reassigned, the label automatically stays in sync with the current list contents without needing manual observers or `setState`.
*   **Immutability Compliance:** Per the Igni rule that "List elements cannot be mutated in place," I used the `replace` builtin in the `update_task` function. This creates a new list with the updated object, which triggers the reactive re-render cycle.
*   **Layout Composition:** I used a `layout horizontal` for each item to pair the `checkbox` and `label` side-by-side, while the main `layout vertical` provides the global structure and padding.
*   **The `{with}` Pattern:** I utilized the `{target with done: target.done}` syntax. While a simple toggle, this pattern is the standard, safest way in Igni to perform shallow updates to object state while preserving other fields (like `name` and `priority`).
*   **Type Flexibility:** I relied on Igni's type inference. The list literal is automatically treated as a list of objects, allowing clean access via `task.name` and `task.priority` inside the `each` loop.