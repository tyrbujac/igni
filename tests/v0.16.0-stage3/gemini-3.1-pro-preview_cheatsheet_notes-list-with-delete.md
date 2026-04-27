```igni
component NoteRow(note):
  layout horizontal, gap: medium, align: center:
    label note.text
    button "✕", on tap: emit delete note

screen Notes:
  notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]

  layout vertical, padding: large, gap: medium:
    label "My Notes", style: heading
    each note in notes:
      NoteRow note, on delete(target): notes = without(notes, target)
```

### Design Choice: Communicating "Remove Me"

To communicate the deletion, I used an **explicit event payload** (`emit delete note`) rather than a value-less emit relying on lexical closure. 

**Why this approach?**
1. **Decoupling:** By doing `emit delete note`, the `NoteRow` component carries its own context. It explicitly tells the parent *what* is being interacted with, making the component self-contained and reusable outside of just this specific `each` loop.
2. **Built-in Reference Equality:** The parent catches the emitted value as `target` and uses the built-in list mutation `without(notes, target)`. In Igni, object matching is by reference. Because we passed the exact object from the loop down into the component and back up via the emit payload, `without` perfectly matches it by reference and returns a new list without that specific item.
3. **Reactivity:** Reassigning the new list back to `notes` triggers Igni's lexical reactivity rule, re-running the screen body and instantly updating the UI without any need for `setState()`.