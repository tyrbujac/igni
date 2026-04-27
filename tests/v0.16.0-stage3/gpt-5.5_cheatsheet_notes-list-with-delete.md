```igni
component NoteRow(note):
  layout horizontal, gap: medium, align: center:
    label note.text
    button "✕", shape: circle, color: danger, on tap: emit remove note

screen Notes:
  notes = [{id: 1, text: "buy milk"}, {id: 2, text: "call mum"}, {id: 3, text: "pay rent"}]

  layout vertical, gap: medium, padding: large:
    label "Notes", style: heading

    each note in notes:
      NoteRow note, on remove(target): notes = without(notes, target)
```

The `NoteRow` component does not mutate the parent’s `notes` list directly. Instead, it emits a custom `remove` event and passes its `note` as event data.

The parent screen owns the list state, so it handles `on remove(target):` and updates the list with:

```igni
notes = without(notes, target)
```

Because the emitted `note` is the same object reference from the `each` loop, `without` removes that specific note from the list.