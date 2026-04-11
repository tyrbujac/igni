# Cold-LLM Test: Notes App Re-run (Igni v0.5)

**Spec version tested:** Igni v0.5
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `prompts.md` → Notes app (re-run from v0.4)
**v0.4 baseline:** MIXED (see `tests/v0.4/Notes.md`) — Claude PASS-incomplete, Gemini PASS via single-screen workaround, ChatGPT PARTIAL (invented cross-screen function visibility)

## The prompt

> Using only the Igni language spec above, write a notes app in Igni. The user should see a list of all their notes (showing just the title) on the main screen, with a button to create a new note. Tapping a note opens a detail screen showing the full content. From the detail screen, the user can edit the note's title and body, save changes, or delete the note. When there are no notes yet, show an empty state on the main screen.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

## Why we re-ran this

The v0.4 Notes test produced the most diagnostically useful result in the entire suite: Claude correctly identified that v0.4 had no way for a detail screen to mutate state owned by a list screen, and refused to invent a workaround. Gemini sidestepped via the single-screen multi-view pattern. ChatGPT invented cross-screen function visibility.

**v0.5 closes the gap** by adding the `shared:` block. This re-run is the regression check that validates v0.5's design. **The result: clean PASS across all three models. Zero inventions.** The cross-screen state gap is empirically closed.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
shared:
  notes: [Note] = []

screen NotesList:
  layout vertical, gap: medium, padding: large:
    label "My Notes", style: heading
    if shared.notes is empty:
      label "No notes yet", style: body, color: subtle
    else:
      each note in shared.notes:
        NoteRow note, on tap: navigate to NoteDetail note
    button "New Note", color: brand, on tap: create()

  create():
    new = {title: "Untitled", body: ""}
    shared.notes = shared.notes + [new]
    navigate to NoteDetail new

component NoteRow(note):
  layout horizontal, padding: medium, background: card, rounded: medium:
    label note.title, style: body

screen NoteDetail(note):
  draft_title = note.title
  draft_body = note.body

  layout vertical, gap: medium, padding: large:
    input bind: draft_title, placeholder: "Title"
    input bind: draft_body, placeholder: "Body"
    layout horizontal, gap: medium:
      button "Save", color: brand, on tap: save()
      button "Delete", color: danger, on tap: delete()
      button "Back", on tap: navigate back

  save():
    shared.notes = replace(shared.notes, note, {title: draft_title, body: draft_body})
    navigate back

  delete():
    shared.notes = without(shared.notes, note)
    navigate back
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.**
- **Used `shared:` block?** **Yes** (with type annotation: `notes: [Note] = []`).
- **Used new v0.5 builtins?** **Yes** — `replace` for save, `without` for delete.
- **Line count:** ~38 lines.

### Notes

**Compared to v0.4:** In the v0.4 round, Claude wrote no-op `save_note()` and `delete_note()` and added an explicit prose comment naming the cross-screen state gap. **In v0.5, Claude wrote a fully working app on the first try.** Same model, same prompt, different spec — and the change is exactly what v0.5 was designed to enable. The "honest no" became a clean yes once the spec gave Claude the right tool. This is the strongest possible evidence that v0.5's documentation is discoverable for Claude.

Other observations:

- **Type annotation on `shared:`** — Claude wrote `notes: [Note] = []`, the more explicit form. ChatGPT did the same; Gemini chose the inferred form.
- **`replace` for save** — used the new v0.5 builtin without prompting. Identity-based match works correctly here because `note` in the detail screen IS the same object as one in the `shared.notes` list (passed via navigation).
- **Component extraction** — `NoteRow` is a regular non-wrapper component.
- **Three buttons in detail screen** — Save, Delete, Back. The Back button is just `navigate back` directly (no helper function needed).

---

## Gemini

**Model version:** Gemini 3.1 Pro
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
shared:
  notes = []

screen NotesList:
  layout vertical, gap: medium, padding: large:
    label "My Notes", style: heading

    if shared.notes is empty:
      label "No notes yet", style: body, color: subtle
    else:
      each note in shared.notes:
        NoteRow note, on tap: navigate to NoteDetail note

    button "New Note", color: brand, on tap: create()

  create():
    new_note = {title: "Untitled", body: ""}
    shared.notes = shared.notes + [new_note]
    navigate to NoteDetail new_note

component NoteRow(note):
  layout horizontal, padding: medium, background: card, rounded: medium:
    label note.title, style: body

screen NoteDetail(note):
  draft_title = note.title
  draft_body = note.body

  layout vertical, gap: medium, padding: large:
    input bind: draft_title, placeholder: "Title"
    input bind: draft_body, placeholder: "Body"

    layout horizontal, gap: medium:
      button "Save", color: brand, on tap: save()
      button "Delete", color: danger, on tap: delete()

  save():
    shared.notes = replace(shared.notes, note, {title: draft_title, body: draft_body})
    navigate back

  delete():
    shared.notes = without(shared.notes, note)
    navigate back
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.**
- **Used `shared:` block?** **Yes** (without type annotation: `notes = []`).
- **Used new v0.5 builtins?** **Yes** — `replace` and `without`.
- **Line count:** ~37 lines.

### Notes

**This is the most informative finding of the run: Gemini abandoned the v0.4 single-screen workaround.** In the v0.4 round, Gemini found a clever pattern using `if selected_note is null:` to swap between list and detail views inside one screen — that pattern is still valid in v0.5 (and explicitly documented in the Conditionals section). But in v0.5, Gemini chose the canonical multi-screen + `shared:` approach instead. **When both options are available, models prefer the canonical pattern.** The single-screen workaround was a clever escape hatch, not a preferred architecture.

This validates the v0.4.1 framing: documenting the single-screen pattern as a *tactical* workaround (not the canonical architecture) was the right call. The proper mechanism was missing in v0.4, and now that v0.5 has it, models naturally reach for it.

Other observations:

- **No type annotation on `shared:`** — Gemini wrote `notes = []`, letting the type be inferred.
- **No "Back" button** in the detail screen — relies on `navigate back` from save/delete only. Slightly less polished UX but functionally equivalent.
- **Architecture is otherwise identical** to Claude's, down to the component name (`NoteRow`).

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
shared:
  notes: [Note] = []

component NoteCard(note):
  layout vertical, padding: medium, background: card, rounded: medium:
    label note.title, style: body

screen NotesList:
  layout vertical, gap: medium, padding: large:
    label "My Notes", style: heading

    if shared.notes is empty:
      label "No notes yet", style: body, color: subtle
    else:
      each note in shared.notes:
        NoteCard note, on tap: navigate to NoteDetail note

    button "New Note", color: brand, on tap: create_note()

  create_note():
    new = {title: "Untitled", body: ""}
    shared.notes = shared.notes + [new]
    navigate to NoteDetail new

screen NoteDetail(note):
  draft_title = note.title
  draft_body = note.body

  layout vertical, gap: medium, padding: large:
    input bind: draft_title, placeholder: "Title"
    input bind: draft_body, placeholder: "Body"

    layout horizontal, gap: medium:
      button "Save", on tap: save()
      button "Delete", color: danger, on tap: delete()
      button "Back", on tap: navigate back

  save():
    shared.notes = replace(shared.notes, note, {title: draft_title, body: draft_body})
    navigate back

  delete():
    shared.notes = without(shared.notes, note)
    navigate back
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.**
- **Used `shared:` block?** **Yes** (with type annotation).
- **Used new v0.5 builtins?** **Yes** — `replace` and `without`.
- **Line count:** ~40 lines.

### Notes

**Compared to v0.4:** In the v0.4 round, ChatGPT invented cross-screen function visibility — calling `update_note` and `delete_note` (defined in the parent `Notes` screen) from inside `NoteDetail.save_note()`. The v0.5 `shared:` block plus the explicit "no cross-screen function calls" rule from v0.4.1 redirected ChatGPT cleanly. **The v0.5 documentation captured ChatGPT's invention preference and channelled it into the right pattern.**

Other observations:

- **Component named `NoteCard`** instead of `NoteRow` — same shape, different name.
- **Function named `create_note()`** instead of `create()` — slightly more verbose.
- **All three buttons present** — Save, Delete, Back.
- **`save()` button has no `color:`** — slightly less polished than the other two outputs.

---

## Gaps observed (across all three models)

**Zero gaps. Zero inventions. Clean PASS across all three models.** This is the second 100% clean test in the suite history (after Chat under v0.4) and the most important one because it closes the v0.4 MIXED verdict on a regression check.

### Cross-model usage matrix (Notes v0.5)

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| Used `shared:` block | Yes (with type annotation) | Yes (no annotation) | Yes (with type annotation) |
| Used `shared.notes` from both screens | Yes | Yes | Yes |
| Used `replace` for save | **Yes** | **Yes** | **Yes** |
| Used `without` for delete | Yes | Yes | Yes |
| Used `is empty` for empty state | Yes | Yes | Yes |
| Used `navigate to` / `navigate back` | Yes | Yes | Yes |
| Extracted component | `NoteRow` | `NoteRow` | `NoteCard` |
| Inventions | None | None | None |

### Headline findings

1. **`replace` is universally discoverable.** All three models reached for the new v0.5 builtin for the save operation without prompting. This is the highest-evidence v0.5 feature in the test (3/3 used it on first contact).
2. **`shared:` is universally discoverable.** All three models found the new v0.5 mechanism and used it correctly. The `shared.X` prefix at every use site is clear and didn't trip any model.
3. **The architectures are nearly interchangeable.** All three converged on: `shared:` block at the top, two screens (NotesList + NoteDetail), one component (NoteRow/NoteCard), `replace` for save, `without` for delete, `navigate back` after mutations. Variance is purely stylistic.
4. **Gemini abandoned the single-screen workaround** when given the canonical alternative. When both options are available, models prefer the canonical pattern. This validates the v0.4.1 framing of the single-screen pattern as tactical, not canonical.
5. **Claude went from "honest no" to "clean yes."** The most diagnostically useful negative result in the v0.4 round became the most validating positive result in the v0.5 round. **The spec design responded to the real signal.**

### What this validates about v0.5

- **The `shared:` block is discoverable.** No model needed any nudging.
- **`replace` is discoverable.** All three reached for it as the right tool for "update one item in a list."
- **The cross-screen state gap is closed.** No model invented anything; no model fell back to a workaround when the canonical mechanism was available.
- **The v0.5 spec's documentation works.** The new `Shared State` section, the `replace` subsection, and the explicit "no cross-screen function calls" rule from v0.4.1 all landed.

---

## v0.5 validation verdict for Notes

**PASS.** All three models produced valid Igni first-try with zero inventions. The v0.4 MIXED verdict on this exact same prompt is now a clean PASS. v0.5's `shared:` design is empirically validated for this case.

**This is the most important single test result in the suite history** because it transforms a MIXED verdict into a clean PASS — empirical proof that v0.5's `shared:` design landed and is discoverable across multiple frontier models.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni v0.5, using the `shared:` block. Worth doing as a sanity check on the v0.5 design before running the cold tests.

```igni
(paste your hand-written attempt here)
```
