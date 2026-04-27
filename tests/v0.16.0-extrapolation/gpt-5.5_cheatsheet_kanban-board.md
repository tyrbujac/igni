```igni
screen Kanban, title: "Kanban Board":
  cards = [
    {id: 1, title: "Sketch layout", column: "Todo"},
    {id: 2, title: "Build board UI", column: "Doing"},
    {id: 3, title: "Ship first version", column: "Done"}
  ]

  next_id = 4
  todo_draft = ""
  doing_draft = ""
  done_draft = ""

  label "Kanban", style: heading, align: center

  layout horizontal, gap: medium, padding: large, fill: true:
    layout vertical, gap: small, padding: medium, background: card, rounded: medium, fill: true, on drop(card): move_card(card, "Todo"):
      label "Todo", style: heading.small

      layout horizontal, gap: small:
        input bind: todo_draft, placeholder: "New card"
        button "Add", color: brand, on tap: add_todo()

      if todo_cards() is empty:
        label "No cards yet", style: caption
      else:
        each card in todo_cards():
          layout horizontal, gap: small, padding: small, background: white, rounded: medium, spread: true, draggable: card:
            label card.title
            button "Delete", color: danger, on tap: delete_card(card)

    layout vertical, gap: small, padding: medium, background: card, rounded: medium, fill: true, on drop(card): move_card(card, "Doing"):
      label "Doing", style: heading.small

      layout horizontal, gap: small:
        input bind: doing_draft, placeholder: "New card"
        button "Add", color: brand, on tap: add_doing()

      if doing_cards() is empty:
        label "No cards yet", style: caption
      else:
        each card in doing_cards():
          layout horizontal, gap: small, padding: small, background: white, rounded: medium, spread: true, draggable: card:
            label card.title
            button "Delete", color: danger, on tap: delete_card(card)

    layout vertical, gap: small, padding: medium, background: card, rounded: medium, fill: true, on drop(card): move_card(card, "Done"):
      label "Done", style: heading.small

      layout horizontal, gap: small:
        input bind: done_draft, placeholder: "New card"
        button "Add", color: brand, on tap: add_done()

      if done_cards() is empty:
        label "No cards yet", style: caption
      else:
        each card in done_cards():
          layout horizontal, gap: small, padding: small, background: white, rounded: medium, spread: true, draggable: card:
            label card.title
            button "Delete", color: danger, on tap: delete_card(card)

  todo_cards():
    return filter(cards, card => card.column is "Todo")

  doing_cards():
    return filter(cards, card => card.column is "Doing")

  done_cards():
    return filter(cards, card => card.column is "Done")

  add_todo():
    if todo_draft is not empty:
      cards = cards + [{id: next_id, title: todo_draft, column: "Todo"}]
      next_id = next_id + 1
      todo_draft = ""

  add_doing():
    if doing_draft is not empty:
      cards = cards + [{id: next_id, title: doing_draft, column: "Doing"}]
      next_id = next_id + 1
      doing_draft = ""

  add_done():
    if done_draft is not empty:
      cards = cards + [{id: next_id, title: done_draft, column: "Done"}]
      next_id = next_id + 1
      done_draft = ""

  delete_card(card):
    cards = without(cards, card)

  move_card(card, column):
    if card.column is not column:
      cards = replace(cards, card, {card with column: column})
```

The cheatsheet does not define drag-and-drop, so I invented two Igni-style additions:

- `draggable: card` marks a layout as draggable and attaches `card` as the drag payload.
- `on drop(card): move_card(card, "Todo")` makes a layout a drop target. The dropped payload is received as `card`, similar to component event payload syntax.

Everything else uses existing Igni primitives: horizontal/vertical layouts, inputs with `bind:`, buttons with `on tap:`, list filtering, immutable list updates, and object updates with `{card with column: column}`.