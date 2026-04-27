```igni
screen Notes:
  notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]

  layout vertical, gap: medium, padding: large:
    label "Notes", style: heading
    each note in notes:
      NoteRow note, on delete(target): notes = without(notes, target)

component NoteRow(note):
  layout horizontal, gap: medium, align: center:
    label note.text, style: body
    button "✕", shape: circle, color: danger, on tap: emit delete note
```

### Design choice: payload-carrying `emit`

The row signals deletion with `emit delete note` — passing the note object as the event payload — and the parent receives it via `on delete(target): notes = without(notes, target)`.

I chose the **payload form** (`emit delete note` + `on delete(target):`) over the **bare-emit + closure** form (`emit delete` + `on delete: notes = without(notes, note)`) for two reasons:

1. **Decoupling.** The component carries its own identity in the event. `NoteRow` is now usable from any context — not just inside an `each note in notes:` loop where `note` happens to be in scope. If a future caller renders a single pinned note outside a loop, the bare-emit form would break (no `note` loop variable to close over); the payload form just works.

2. **Explicitness over implicit closure.** The cheatsheet describes both forms as valid, but the payload form makes the data flow visible at the call site: you can see `target` arrive and get passed to `without`. The closure form relies on the reader noticing that `note` in the handler refers to the surrounding `each` binding.

`without(notes, target)` works cleanly here because `target` is the exact object reference from the list (passed through `emit` unchanged), so reference equality matches the single intended row.