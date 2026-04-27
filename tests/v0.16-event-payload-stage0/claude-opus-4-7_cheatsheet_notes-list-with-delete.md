# Notes App

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

## Design choice: how the row signals "remove me"

The `NoteRow` emits a custom event with the note itself as payload: `emit delete note`. The parent attaches `on delete(target):` and removes that exact note via `without(notes, target)`.

**Why this shape?**

1. **Components can't reach into parent state.** Cross-screen function calls are forbidden, and the same logical separation applies between a component and its parent — the row has no visibility into `notes`. The only sanctioned channel is `emit`.

2. **Pass the whole note, not the id.** The parent's list is the source of truth, and `without` removes by reference. Since `note` came *from* `notes` via `each`, passing it back gives `without` the exact reference it needs — no `find(notes, n => n.id is id)` lookup step required.

3. **Payload-aware handler signature.** Because the child emits a value, the parent must receive it: `on delete(target):`. A bare `on delete:` would be rejected at validation time, and `on delete(_):` would discard the very value we need. The explicit `(target)` parameter makes the data flow visible at the call site.

4. **Mutation flows through reassignment.** `without` returns a new list; assigning it back to `notes` triggers lexical reactivity, which re-runs the screen body and re-renders the `each` block with the deleted row gone. No manual refresh, no `setState`.