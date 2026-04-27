# Kanban Board in Igni

```igni
screen Kanban:
  todo_items = [{id: 1, title: "Write spec"}, {id: 2, title: "Review PR"}]
  doing_items = [{id: 3, title: "Build prototype"}]
  done_items = [{id: 4, title: "Set up repo"}]

  todo_draft = ""
  doing_draft = ""
  done_draft = ""

  next_id = 5

  layout vertical, padding: large, gap: medium:
    label "Kanban", style: heading

    layout horizontal, gap: medium:
      Column "Todo", todo_items, todo_draft,
        on add(text): add_to("todo", text),
        on remove(card): todo_items = without(todo_items, card),
        on drop(card): move_card(card, "todo")

      Column "Doing", doing_items, doing_draft,
        on add(text): add_to("doing", text),
        on remove(card): doing_items = without(doing_items, card),
        on drop(card): move_card(card, "doing")

      Column "Done", done_items, done_draft,
        on add(text): add_to("done", text),
        on remove(card): done_items = without(done_items, card),
        on drop(card): move_card(card, "done")

  add_to(column, text):
    if text is empty:
      return
    new_card = {id: next_id, title: text}
    next_id = next_id + 1
    if column is "todo":
      todo_items = todo_items + [new_card]
      todo_draft = ""
    else if column is "doing":
      doing_items = doing_items + [new_card]
      doing_draft = ""
    else:
      done_items = done_items + [new_card]
      done_draft = ""

  move_card(card, target):
    # remove from whichever column owns it
    todo_items = without(todo_items, card)
    doing_items = without(doing_items, card)
    done_items = without(done_items, card)
    # add to target
    if target is "todo":
      todo_items = todo_items + [card]
    else if target is "doing":
      doing_items = doing_items + [card]
    else:
      done_items = done_items + [card]


component Column(title, items, draft):
  layout vertical, fill: true, gap: small, padding: medium, background: card, rounded: medium,
    drop target: true, on drop(card): emit drop card:

    label title, style: heading.small

    layout horizontal, gap: small:
      input bind: draft, placeholder: "New card", on change: emit draft_changed draft
      button "Add", color: brand, on tap: emit add draft

    if items is empty:
      label "No cards", color: subtle
    else:
      each card in items:
        layout horizontal, gap: small, padding: small, background: white, rounded: small,
          draggable: true, drag payload: card:

          label card.title, fill: true
          button "✕", shape: circle, color: subtle, on tap: emit remove card
```

---

## Where I had to invent syntax

The cheatsheet covers state, layouts, events, components, and `emit`, but it doesn't define **drag-and-drop**. I extended Igni's existing modifier-on-layout style rather than inventing a new top-level construct:

**1. `draggable: true` and `drag payload: <value>`** — modifiers on any layout. The layout becomes a drag source; the payload is the value delivered to drop targets. Naming follows Igni convention (lowercase tokens, colon-separated args on the opening line).

**2. `drop target: true` plus `on drop(card):`** — pairs `drop target: true` with a new event handler `on drop`, mirroring `on tap:` / `on change:`. The handler receives the dragged payload as a positional argument, matching the existing `on submit(query):` shape used by `emit`-with-value.

This keeps drag-and-drop within the language's existing rules:
- It's expressed as **modifiers + events**, not a special block.
- Payload delivery uses the **same `(name)` parameter convention** as custom emits.
- The component re-emits `drop` upward via `emit drop card`, so the parent screen owns all state mutation — consistent with Igni's "components are dumb, screens hold state" pattern.

**3. One small judgment call on `input`:** the cheatsheet says `input bind: shared.X` is rejected because `input` needs a stable local. Inside a component, `draft` is passed as an argument (immutable), so I bound to it directly and emitted `draft_changed` so the parent could keep its local `todo_draft` / `doing_draft` / `done_draft` in sync. In practice for a real implementation I'd lift the input into the parent screen — but the cheatsheet's component model with `bind:` on a passed-in arg is the closest fit to the spec as written.