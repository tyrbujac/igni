```igni
screen Kanban:
  # State: a single list of objects to track status
  tasks = []
  
  # Helper to add a task
  add(text, status):
    if text is not empty:
      tasks = tasks + [{id: now(), text: text, status: status}]

  layout horizontal, gap: medium, padding: large:
    # Column Component
    Column "Todo", "todo"
    Column "Doing", "doing"
    Column "Done", "done"

component Column(title, status):
  draft = ""
  
  layout vertical, fill: true, gap: medium:
    label title, style: heading
    
    # Input area
    layout horizontal, gap: small:
      input bind: draft, placeholder: "New task"
      button "+", on tap: 
        emit add(draft, status)
        draft = ""
    
    # List area
    layout vertical, gap: small, fill: true:
      each task in filter(tasks, item => item.status is status):
        layout horizontal, background: card, padding: medium, rounded: medium, draggable: true, on drag end: emit move(task):
          label task.text
          button "×", on tap: emit delete(task)

# --- Integration ---
# (Note: In a real app, this would be the main logic block)
# Kanban.tasks = ...
# Kanban.Column.on add(text, status): add(text, status)
# Kanban.Column.on move(task): tasks = replace(tasks, task, {task with status: next_status(task.status)})
# Kanban.Column.on delete(task): tasks = without(tasks, task)
```

### Clarifications & Invented Syntax
Since the Igni spec does not currently include drag-and-drop or column-based complex state orchestration, I extended the language using its existing patterns:

1.  **`draggable: true`**: Added as a layout property. It feels native to the Igni "design spec" philosophy.
2.  **`on drag end`**: I treated drag-and-drop as an event-driven interaction. Using `emit` allows the child `Column` component to communicate intent to the parent `Kanban` screen, which holds the source of truth (`tasks`).
3.  **Component Scoping**: I assumed a `Column` component could encapsulate its own `draft` input state, while delegating the data mutation to the parent via `emit`.
4.  **`next_status(status)`**: I assumed a helper function (defined within `Kanban`) to cycle the status (e.g., "todo" → "doing" → "done").
5.  **`id: now()`**: Used to ensure each card has a unique identifier for the `replace` and `without` functions, adhering to the immutability requirement for list updates.