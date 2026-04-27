```igni
component NoteRow(note):
  layout horizontal, gap: medium, align: center:
    label note.text
    button "✕", shape: circle, color: danger, on tap: emit delete note

screen Notes:
  notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]

  layout vertical, gap: medium, padding: large:
    label "Notes", style: heading

    each note in notes:
      NoteRow note, on delete(target): notes = without(notes, target)
```

`NoteRow` does not mutate the parent’s `notes` list directly. Instead, it emits a custom `delete` event with its own `note` as the payload:

```igni
emit delete note
```

The parent receives that note as `target` and removes it with:

```igni
notes = without(notes, target)
```

This keeps the row reusable and lets the parent own the list state. Since the emitted `note` is the same object from the `notes` list, `without` removes that specific note.