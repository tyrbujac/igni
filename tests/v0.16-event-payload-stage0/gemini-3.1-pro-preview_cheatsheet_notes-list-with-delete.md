```igni
screen Notes:
  notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]

  layout vertical, padding: large, gap: medium:
    label "Notes", style: heading
    
    each note in notes:
      NoteRow note, on delete(target): notes = without(notes, target)

component NoteRow(note):
  layout horizontal, align: center, spread: true:
    label note.text
    button "✕", shape: circle, color: subtle, on tap: emit delete note
```

### Design Choice: Communicating "Remove Me"

In Igni, **component arguments are strictly immutable**, so the `NoteRow` child cannot mutate the parent's `notes` list directly. 

Instead, the row uses **custom events** to bubble the interaction up. When the delete button is tapped, it triggers `emit delete note`, passing the exact object reference as the event payload. The parent `Notes` screen listens to this via `on delete(target):`, receives the specific note reference, and reassigns its local state using the list mutation builtin `without(notes, target)`. 

Because Igni matches object references in lists for `without()`, it cleanly strips that specific note from the array. Reassigning the top-level `notes` variable then naturally triggers Igni's lexical reactivity rule, re-running the screen body and re-rendering the updated list.