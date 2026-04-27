Here is the complete Igni code for the Kanban board. 

```igni
screen Kanban, title: "Igni Board":
  items = []
  todo_draft = ""
  doing_draft = ""
  done_draft = ""

  layout horizontal, fill: true, gap: large, padding: large:
    
    # TODO Column
    layout vertical, fill: true, background: subtle, padding: medium, rounded: medium, on drop(item): move(item, "Todo"):
      label "Todo", style: heading.small
      layout horizontal, gap: small:
        input bind: todo_draft, placeholder: "New task"
        button "Add", on tap: add_todo()
      each item in filter(items, i => i.status is "Todo"):
        TaskCard item, on delete(target): remove(target)

    # DOING Column
    layout vertical, fill: true, background: subtle, padding: medium, rounded: medium, on drop(item): move(item, "Doing"):
      label "Doing", style: heading.small
      layout horizontal, gap: small:
        input bind: doing_draft, placeholder: "New task"
        button "Add", on tap: add_doing()
      each item in filter(items, i => i.status is "Doing"):
        TaskCard item, on delete(target): remove(target)

    # DONE Column
    layout vertical, fill: true, background: subtle, padding: medium, rounded: medium, on drop(item): move(item, "Done"):
      label "Done", style: heading.small
      layout horizontal, gap: small:
        input bind: done_draft, placeholder: "New task"
        button "Add", on tap: add_done()
      each item in filter(items, i => i.status is "Done"):
        TaskCard item, on delete(target): remove(target)

  add_todo():
    if todo_draft is not empty:
      items = items + [{title: todo_draft, status: "Todo"}]
      todo_draft = ""

  add_doing():
    if doing_draft is not empty:
      items = items + [{title: doing_draft, status: "Doing"}]
      doing_draft = ""

  add_done():
    if done_draft is not empty:
      items = items + [{title: done_draft, status: "Done"}]
      done_draft = ""

  move(item, new_status):
    items = replace(items, item, {item with status: new_status})

  remove(target):
    items = without(items, target)


component TaskCard(item):
  layout horizontal, background: card, padding: medium, rounded: medium, gap: small, align: center, drag_value: item:
    layout vertical, fill: true:
      label item.title
    button "X", shape: circle, color: danger, on tap: emit delete item
```

### Explaining the Uncovered Parts (Invented Syntax)

Because native Drag-and-Drop is missing from the provided v0.16.0 cheatsheet, I invented two symmetrical property tokens to handle it naturally in Igni's event-handler paradigm:

1. **`drag_value:`** (used on the `TaskCard` wrapper layout)
   Declares that a layout can be picked up by the user. Whatever variable or object is passed to `drag_value:` becomes the "payload" carried by the drag cursor. 
2. **`on drop(<payload>):`** (used on each column's vertical layout)
   Declares that a layout is a drop target. When the user releases a dragged item over this layout, it unwraps the payload and fires the inline action. 

**Why this fits Igni's style perfectly:**
Rather than setting up controllers, gesture detectors, and coordinates, the state management handles the magic structurally. 
* You drag a `TaskCard`, capturing its object reference.
* You drop it on the "Doing" column, triggering `move(item, "Doing")`.
* `move()` uses the builtin `replace` combined with the `{BASE with KEY: VALUE}` syntax to generate a new list with that specific object updated.
* Reassigning `items` re-evaluates the screen body.
* The builtin `filter` in the `each` loops sees the item's new status and visually snaps the card to its new column. 

### Other notable Igni rules applied:
* **Max Nesting Depth**: I abstracted the Card into a `TaskCard` component. Keeping it inline inside the column's `layout horizontal` (for the Add button) would have exceeded Igni's strict 4-level nesting limit.
* **Component Events**: The component invokes `emit delete item` on its internal button, and the parent catches it with `on delete(target): remove(target)`. This adheres to the rule that components cannot implicitly mutate parent variables directly.