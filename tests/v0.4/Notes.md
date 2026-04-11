# Cold-LLM Test: Notes App (Igni v0.4)

**Spec version tested:** Igni v0.4
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `prompts.md` → Notes app

## The prompt

> Using only the Igni language spec above, write a notes app in Igni. The user should see a list of all their notes (showing just the title) on the main screen, with a button to create a new note. Tapping a note opens a detail screen showing the full content. From the detail screen, the user can edit the note's title and body, save changes, or delete the note. When there are no notes yet, show an empty state on the main screen.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions. Added an explicit prose note alongside the code about the cross-screen state limitation (see Notes section below).

### Output

```igni
screen NotesList:
  notes = []
  next_id = 1

  layout vertical, padding: large, gap: medium:
    layout horizontal, spread: true:
      label "Notes", style: heading
      button "New Note", color: brand, on tap: create_note()

    if notes is empty:
      layout vertical, align: center, gap: small, padding: large:
        icon "file-text", size: large, color: subtle
        label "No notes yet", style: body, color: subtle

    each note in notes:
      NoteCard note, on tap: navigate to NoteDetail note

  create_note():
    new_note = {id: next_id, title: "Untitled", body: ""}
    notes = notes + [new_note]
    next_id = next_id + 1
    navigate to NoteDetail new_note

component NoteCard(note):
  layout vertical, padding: medium, background: card, rounded: medium:
    label note.title, style: heading.small

screen NoteDetail(note):
  draft_title = note.title
  draft_body = note.body

  layout vertical, padding: large, gap: medium:
    input bind: draft_title, placeholder: "Title"
    input bind: draft_body, placeholder: "Write something..."

    layout horizontal, gap: medium:
      button "Save", color: brand, on tap: save_note()
      button "Delete", color: danger, on tap: delete_note()

  save_note():
    # Rebuild the parent's list with updated fields
    # This is a design-level limitation — v0.5 shared store would handle this cleanly
    navigate back

  delete_note():
    navigate back
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions. Used `is empty`, `next_id` counter, object literals, `+ [item]` for list append, component extraction, `navigate to`, `on tap:` on component invocation, the `icon` primitive in the empty state, `#` comments — all v0.4 features used correctly.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes (structurally).** But the app is functionally incomplete: `save_note()` and `delete_note()` are no-ops that just `navigate back` — they don't actually propagate changes to the parent screen's `notes` list.
- **Line count:** ~45 lines.

### Notes

**This is the most diagnostically useful output of the three.** Claude refused to invent and **explicitly named the gap.** Alongside the code, Claude wrote:

> *"The spec doesn't yet have a mechanism for a detail screen to mutate state owned by a parent screen (NotesList owns `notes`, but NoteDetail can't reassign it). The spec itself flags this under 'Open Design Questions (v0.5)' — shared stores or argument mutation would solve it. The screens above are structurally valid Igni, but `save_note` and `delete_note` can't propagate changes back to `notes` without that missing piece."*

This is exactly the kind of negative result that's most useful for designing v0.5. A model that correctly identifies what the spec *can't* do is more valuable for language design than a model that invents a workaround. **The "honest no" is data; the "clever yes" can hide the real limitation.**

Other observations:
- **Used the v0.4 `#` comment syntax** to document the limitation inside `save_note()`. Second test in the suite to use comments (after Music Player).
- **Empty state with `icon "file-text"` plus label** — cleanest empty state of the three. Uses `is empty` correctly and produces a polished result.
- **`spread: true`** on the header layout to push title and "New Note" button to opposite ends. Valid v0.4 layout property.
- **`next_id` counter for stable identity** — the same pattern Gemini used in Todo.

---

## Gemini

**Model version:** Gemini Thinking 3.0
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen NotesApp:
  all_notes = []
  selected_note = null
  title_draft = ""
  body_draft = ""

  if selected_note is null:
    # --- Main Screen ---
    layout vertical, gap: medium, padding: large:
      label "My Notes", style: heading

      if all_notes is empty:
        layout vertical, align: center, padding: large:
          label "No notes yet", style: body, color: subtle
      else:
        each note in all_notes:
          NoteRow note, on tap: open_note(note)

      button "New Note", color: brand, on tap: create_note()

  else:
    # --- Detail Screen ---
    layout vertical, gap: medium, padding: large:
      input bind: title_draft, placeholder: "Note Title"
      input bind: body_draft, placeholder: "Type something..."

      layout horizontal, gap: medium:
        button "Save", on tap: save_changes()
        button "Delete", color: danger, on tap: remove_note()
        button "Back", on tap: selected_note = null

  create_note():
    new_note = {title: "New Note", body: ""}
    all_notes = all_notes + [new_note]
    open_note(new_note)

  open_note(note):
    selected_note = note
    title_draft = note.title
    body_draft = note.body

  save_changes():
    updated = []
    each n in all_notes:
      if n is selected_note:
        updated = updated + [{title: title_draft, body: body_draft}]
      else:
        updated = updated + [n]
    all_notes = updated
    selected_note = null

  remove_note():
    all_notes = without(all_notes, selected_note)
    selected_note = null

component NoteRow(note):
  layout horizontal, padding: medium, background: card, rounded: medium:
    label note.title, style: body
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions. Used `null`, `is null`, `is empty`, `is` for object identity, `each` in non-rendering context, `without`, `# comments`, object literals, `+ [item]`, `navigate`-free architecture — every v0.4 feature used cleanly.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.**
- **Works end-to-end for this prompt:** **Yes.**
- **Line count:** ~57 lines.

### Notes

**The clever tactical move: single screen with conditional rendering.** Instead of using `navigate to NoteDetail`, Gemini puts both views inside the *same* `screen NotesApp:` and uses `if selected_note is null: ... else: ...` at the screen-body level to switch between them. State (`all_notes`, `selected_note`, `title_draft`, `body_draft`) lives in one place. "Open a note" sets `selected_note` and copies its fields into the drafts. "Save changes" rebuilds `all_notes` with the updated note. "Back" sets `selected_note = null`. **No cross-screen state needed because there are no separate screens.**

This works cleanly and uses only v0.4 primitives. It also surfaces several v0.4 features used naturally:

- **`null` and `is null`** — Gemini reached for the v0.4 null value as the "no detail view active" sentinel.
- **`# --- Main Screen ---` and `# --- Detail Screen ---` comments** — used as section markers within the screen body.
- **`each n in all_notes:` filter loop** in `save_changes` — v0.4 each-in-functions, used to rebuild the list with the updated note.
- **`without(all_notes, selected_note)`** for delete.
- **`is` for object identity** in `if n is selected_note:`.

**Caveats — why this is a tactical pattern, NOT a universal solution to cross-screen state:**

- **Doesn't scale.** Works for 2 tightly coupled views (list/detail). Doesn't scale to 10+ screens, where cramming all of them into one file becomes unmaintainable.
- **Breaks real navigation.** Browser back button, deep links, URL history, route-based authorization — all broken if "navigation" is just a variable assignment in one screen. The Igni runtime would have no way to expose these states to the platform.
- **Forces unrelated views into one file.** Violates the spirit of "everything a component needs lives in one file" by going the *wrong* direction — cramming unrelated screens together rather than keeping each screen self-contained.
- **Doesn't solve the broader cross-screen state problem.** A settings screen that changes a value used on the home screen, a global cart accessible from product/checkout/profile, an auth token referenced from many independent screens — none of these are addressable via the single-screen pattern.

**Gemini's solution solves this specific Notes prompt but doesn't solve the underlying language gap.** It's a workaround that works because Notes happens to be the "two views, one shared state" case. v0.5 still needs to address cross-screen state for the cases the workaround can't reach.

Worth documenting as a pattern in v0.4.1 for tightly coupled list/detail flows — but the documentation must be honest about what it doesn't cover.

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Notes:
  notes = []

  layout vertical, gap: medium, padding: large:
    if notes is empty:
      label "No notes yet", style: body, color: subtle
    else:
      each note in notes:
        NoteItem note, on tap: open_note(note)

    button "New Note", on tap: create_note()

  create_note():
    new_note = {title: "Untitled", body: ""}
    notes = notes + [new_note]
    navigate to NoteDetail new_note

  open_note(note):
    navigate to NoteDetail note

  update_note(target, updated):
    updated_list = []
    each note in notes:
      if note is target:
        updated_list = updated_list + [updated]
      else:
        updated_list = updated_list + [note]
    notes = updated_list

  delete_note(target):
    notes = without(notes, target)
    navigate back

component NoteItem(note):
  layout vertical, padding: medium:
    label note.title, style: body

screen NoteDetail(note):
  title = note.title
  body = note.body

  layout vertical, gap: medium, padding: large:
    input bind: title, placeholder: "Title"
    input bind: body, placeholder: "Body"

    layout horizontal, gap: medium:
      button "Save", on tap: save_note()
      button "Delete", color: danger, on tap: remove_note()

  save_note():
    updated = {title: title, body: body}
    update_note(note, updated)
    navigate back

  remove_note():
    delete_note(note)
```

### Grading

- **Invented syntax not in the spec?** **Yes — cross-screen function visibility.** The `Notes` screen defines `update_note(target, updated)` and `delete_note(target)` as screen-internal functions. The `NoteDetail` screen's `save_note()` and `remove_note()` then call those functions directly by name as if they were globally accessible from any other screen. The spec only blesses cross-component calls (a child component calling its parent screen's functions); it does NOT bless cross-screen calls between screens connected by `navigate to`.
- **Used existing syntax wrong?** Yes, in the same way — calling `update_note` from `NoteDetail.save_note` assumes a scope rule that doesn't exist in v0.4.
- **Valid Igni on first try?** **No** — depends on undocumented and unsupported behaviour.
- **Line count:** ~50 lines.

### Notes

ChatGPT took the **"obvious" multi-screen approach** (two separate screens linked via `navigate to`), and then had to invent something to make `save` and `delete` actually work. Its solution was to assume that any function defined in any screen is accessible from any other screen — essentially treating screen-internal functions as globals.

This is the canonical "models invent the missing feature" failure mode. ChatGPT correctly identified the architecture (separate screens with navigation), correctly identified the requirement (save and delete need to mutate the list), and then filled the gap with an invention. **This is exactly the failure mode v0.4 should have caught with a clearer rule about what's NOT allowed.**

Other v0.4 features used cleanly:
- `each` in non-rendering context (the filter loop in `update_note`).
- `without(notes, target)` for delete.
- `is` for object identity (`if note is target:`).
- `is empty` for the empty state.
- Object literals throughout.
- Screen-internal functions with multiple arguments (`update_note(target, updated)`).

**ChatGPT's invention is the most useful diagnostic for the v0.4.1 patch:** the spec needs an explicit rule that screens called via `navigate to` cannot call functions defined in the navigating screen, paired with a pointer at v0.5's planned shared-state mechanism for cases that need it.

---

## Gaps observed (across all three models)

This is a **v0.4 acceptance test** and the deliberately hardest one in the suite. The findings are nuanced and worth being explicit about.

### The cross-model gap matrix (Notes)

| Aspect | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) |
|---|---|---|---|
| Architecture | Two screens + navigate | Single screen, conditional render *(tactical workaround)* | Two screens + navigate |
| Cross-screen state | Honestly unaddressed (no-op `save`/`delete` with explanatory comment) | Avoided for this specific use case via single-screen pattern | Invented cross-screen function visibility |
| Inventions | None | None | Cross-screen function calls |
| Works end-to-end (this prompt) | No | Yes | Probably yes, if invention allowed |
| Long-term diagnostic value | **Highest** — names the real gap | Medium — solves the symptom, hides the underlying gap | Low — invents around the gap |

### The single most important finding

**Claude's honest "this can't be done" output is more useful for designing v0.5 than Gemini's clever workaround.** Gemini's solution is real and worth documenting as a pattern for tightly coupled list/detail flows, but it could create a false sense that the cross-screen state question is resolved when it isn't. Claude's negative result is the diagnostic signal that the language genuinely has a limitation, and v0.5 needs to address it.

The "honest no" is data; the "clever yes" can hide the real limitation. **Claude's output is the most valuable single test result in the entire suite for long-term language design**, precisely because it refused to invent.

### The secondary finding

**Gemini's single-screen pattern is genuinely valuable for the cases it covers.** Tightly coupled list/detail flows, "modal-like" detail views, wizard flows — these are all real patterns in real apps. v0.4.1 should document the pattern explicitly (with examples) so future models don't have to invent it cold. But the documentation must include caveats: this is a tactical workaround for a specific class of UIs, NOT the canonical architecture for multi-screen Igni, and NOT a resolution of the cross-screen state question.

### The third finding

**ChatGPT's invention is the easiest gap to close.** The spec just needs one explicit sentence stating that screens called via `navigate to` cannot call functions defined in the navigating screen, paired with pointers at (a) the single-screen pattern for cases that work, and (b) the v0.5 shared-state mechanism for cases that don't.

### Predicted gaps that DID surface

- **Cross-screen state.** All three models hit it; each handled it differently (Claude honestly, Gemini cleverly, ChatGPT inventively). **This is the real v0.5 priority** — the cleverness of Gemini's workaround should not be used as an excuse to defer it indefinitely.
- **Returning from detail with a result.** Implicit in cross-screen state. None of the three models found a clean answer; Claude said it couldn't be done, Gemini avoided having multiple screens, ChatGPT invented function visibility.

### Predicted gaps that did NOT surface

- **Empty state handling.** All three models used `is empty` cleanly. v0.4's `is X` extension covers this case.

---

## v0.4 acceptance verdict for Notes

**MIXED.** This is the only test in the v0.4 acceptance round with a mixed verdict — different models took fundamentally different approaches, and only one worked end-to-end:

- **Claude:** PASS-incomplete. Zero inventions, structurally clean, app doesn't work end-to-end because edits don't persist. *Most diagnostically useful output.*
- **Gemini:** PASS for this prompt. Zero inventions, app works end-to-end via the single-screen pattern. *Useful tactical pattern, NOT a universal cross-screen state solution.*
- **ChatGPT:** PARTIAL. Invented cross-screen function visibility to make the obvious multi-screen approach work.

**The MIXED verdict is actually informative.** A unanimous PASS would have been suspicious because cross-screen state is a known v0.5 gap. A unanimous FAIL would have been worrying. The mixed result shows that v0.4 is *almost* sufficient for navigation-with-shared-state apps — sufficient for the tightly-coupled-list-detail case via Gemini's pattern, insufficient for the broader case that Claude correctly identified.

---

## v0.4 final acceptance status (across all 3 v0.4 tests)

| Test | Verdict | Headline |
|---|---|---|
| Chat | **PASS** | First 100% clean test in the suite. Zero inventions across all three models. Gemini finally adopted `is not empty`. |
| Music Player | **PARTIAL** | 2/3 clean. Claude over-engineered icon button compound. Recoverable with documentation. |
| Notes | **MIXED** | Cross-screen state is the real gap. Claude named it honestly, Gemini sidestepped tactically, ChatGPT invented around it. |

**Overall:** v0.4 is shippable as the stable release. The PARTIAL and MIXED findings are addressable with a small v0.4.1 documentation patch (no language changes). The Notes MIXED verdict surfaces a **real v0.5 priority** (cross-screen shared state) that should not be demoted just because Gemini found a tactical workaround.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls. The Notes app's cross-screen state question is the most likely place v0.4 will fall short.

```igni
(paste your hand-written attempt here)
```
