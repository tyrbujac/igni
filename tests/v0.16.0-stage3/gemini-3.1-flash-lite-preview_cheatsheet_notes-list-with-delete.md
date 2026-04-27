Here is the Igni implementation for the Notes app:

```igni
component NoteRow(note):
  layout horizontal, gap: medium:
    label note.text, fill: true
    button "✕", color: danger, on tap: emit delete note

screen Notes:
  notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]

  layout vertical, padding: large, gap: small:
    label "My Notes", style: heading
    each item in notes:
      NoteRow item, on delete(n): notes = without(notes, n)
```

### Design Explanation
The component uses `emit delete note` to signal the parent. By passing the entire `note` object as the payload, we delegate the logic of *what* needs to be deleted to the parent, keeping the `NoteRow` component generic and focused only on presentation. 

In the parent, the `on delete(n):` handler receives the specific note object. We then use the built-in `without(notes, n)` function to reassign the `notes` list. Because Igni uses lexical reactivity, reassigning `notes` automatically triggers a re-render of the screen, removing the specific row from the UI.