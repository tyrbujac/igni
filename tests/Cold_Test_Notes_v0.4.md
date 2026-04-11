# Cold-LLM Test: Notes App (Igni v0.4)

**Spec version tested:** Igni v0.4
**Test run dates:** _(fill in when run)_
**Source prompt:** `tests/prompts.md` → Notes app

## The prompt

> Using only the Igni language spec above, write a notes app in Igni. The user should see a list of all their notes (showing just the title) on the main screen, with a button to create a new note. Tapping a note opens a detail screen showing the full content. From the detail screen, the user can edit the note's title and body, save changes, or delete the note. When there are no notes yet, show an empty state on the main screen.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** _(e.g. Opus 4.6)_
**Date:** _(YYYY-MM-DD)_
**One-shot or split?:** _(one shot / split into parts / asked clarifying questions)_

### Output

```igni
(paste full LLM output here)
```

### Grading

- **Invented syntax not in the spec?** _(yes/no — list what)_
- **Used existing syntax wrong?** _(yes/no — list where)_
- **Valid Igni on first try?** _(yes/no)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

---

## Gemini

**Model version:** _(e.g. Gemini 3.1 Pro)_
**Date:** _(YYYY-MM-DD)_
**One-shot or split?:** _(one shot / split / asked questions)_

### Output

```igni
(paste full LLM output here)
```

### Grading

- **Invented syntax not in the spec?** _(yes/no — list what)_
- **Used existing syntax wrong?** _(yes/no — list where)_
- **Valid Igni on first try?** _(yes/no)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

---

## GPT

**Model version:** _(e.g. GPT-5 / ChatGPT free tier)_
**Date:** _(YYYY-MM-DD)_
**One-shot or split?:** _(one shot / split / asked questions)_

### Output

```igni
(paste full LLM output here)
```

### Grading

- **Invented syntax not in the spec?** _(yes/no — list what)_
- **Used existing syntax wrong?** _(yes/no — list where)_
- **Valid Igni on first try?** _(yes/no)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

---

## Gaps observed (across all three models)

This is a **v0.4 acceptance test.** Universal gaps here mean v0.4 missed something the previous three tests should have caught. Since this app exercises **multi-screen navigation for the first time** in the suite, expect potential gaps around cross-screen state, navigation with arguments, and how mutations propagate across screens.

### Predicted gaps for this test

- **Cross-screen state.** The notes list lives on the list screen, but the detail screen needs to read and modify it. v0.4 has no shared-store concept (deferred to v0.5). Models will likely either: (a) pass the whole list down as an argument and rebuild via callbacks, (b) invent a global store, (c) find a pattern using existing primitives.
- **Navigation with state mutation.** When the detail screen deletes or edits a note, how does the list screen reflect the change? Tied to the cross-screen state question.
- **Empty state handling.** `is empty` on the list. Should be straightforward in v0.4, but worth checking that models reach for it cleanly without inventing alternatives.
- **Returning from detail with a result** (like a deleted-flag, or the edited content) — the spec only has `navigate to` and `navigate back` with no mention of return values. Models may invent a callback pattern.

### Findings (fill in as tests run)

1. _(...)_

---

## v0.4 acceptance verdict

After all three models are tested, decide:

- **PASS** — all three models produce valid Igni first-try with no inventions. v0.4 is stable. Move to Chat and Music player tests next.
- **PARTIAL** — at least one model invented something, but the inventions are minor or fall under predicted v0.5 gaps (like cross-screen state). v0.4 ships, the gaps go into the v0.5 backlog.
- **FAIL** — multiple models invented things v0.4 should have covered. Patch as v0.4.1 or roll back to design v0.4 differently.

_(fill in after tests run)_

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls. This is the "design by trying" data point — your gaps and the LLMs' gaps should mostly overlap. The Notes app's cross-screen state question is the most likely place v0.4 will fall short.

```igni
(paste your hand-written attempt here)
```
