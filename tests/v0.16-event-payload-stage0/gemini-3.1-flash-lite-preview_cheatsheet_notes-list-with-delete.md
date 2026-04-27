```igni
screen Notes:
  notes = [
    {id: 1, text: "buy milk"}, 
    {id: 2, text: "call mum"}, 
    {id: 3, text: "pay rent"}
  ]

  layout vertical, padding: large, gap: medium:
    label "My Notes", style: heading
    each note in notes:
      NoteRow note, on delete: notes = without(notes, note)

component NoteRow(note):
  layout horizontal, gap: medium, align: center:
    label note.text
    button "✕", color: danger, shape: circle, on tap: emit delete
```

### Design Explanation

The communication pattern uses the `emit` and `on` event system:

1.  **Component Event:** The `NoteRow` captures the user's intent via `on tap: emit delete`. Since `emit` is required to be inside an event handler, it effectively creates a custom "delete" event channel for the parent to listen to.
2.  **Parent Delegation:** The `Notes` screen registers for that custom event using `on delete:`. Because `notes` state is defined in the parent, the parent performs the actual state mutation (`notes = without(notes, note)`).
3.  **Encapsulation:** The `NoteRow` doesn't need to know *how* to remove an item or even that it exists within a `notes` list; it only knows that when the button is tapped, it should broadcast a `delete` event. This keeps the component clean and reusable.