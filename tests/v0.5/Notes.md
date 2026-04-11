# Cold-LLM Test: Notes App Re-run (Igni v0.5)

**Spec version tested:** Igni v0.5
**Test run dates:** _(fill in when run)_
**Source prompt:** `prompts.md` → Notes app (re-run from v0.4)
**v0.4 baseline:** MIXED (see `tests/v0.4/Notes.md`) — Claude PASS-incomplete, Gemini PASS via single-screen workaround, ChatGPT PARTIAL (invented cross-screen function visibility)

## The prompt

> Using only the Igni language spec above, write a notes app in Igni. The user should see a list of all their notes (showing just the title) on the main screen, with a button to create a new note. Tapping a note opens a detail screen showing the full content. From the detail screen, the user can edit the note's title and body, save changes, or delete the note. When there are no notes yet, show an empty state on the main screen.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

## Why we're re-running this

The v0.4 Notes test produced the most diagnostically useful result in the entire suite: Claude correctly identified that v0.4 had no way for a detail screen to mutate state owned by a list screen, and refused to invent a workaround. Gemini sidestepped via the single-screen multi-view pattern. ChatGPT invented cross-screen function visibility.

**v0.5 closes the gap** by adding the `shared:` block. Notes can now be stored in `shared.notes` (or similar), readable and writable from both the list and detail screens, with the same lexical reactivity rule applying — any screen reading `shared.notes` re-renders when any screen writes to it.

This re-run is the **regression check that validates v0.5's design.** If all three models now reach for `shared.notes` and produce a fully working Notes app, v0.5's shared-state mechanism is empirically validated.

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
- **Used `shared:` block?** _(yes/no — was the cross-screen state gap closed?)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

**Compare to v0.4 baseline:** Claude in the v0.4 round wrote no-op save/delete with an explicit honest comment about the gap. The interesting question is whether v0.5 changes Claude's approach: does it now reach for `shared:` because the spec documents it, or does it still write a single-screen workaround out of habit?

---

## Gemini

**Model version:** _(e.g. Gemini Thinking 3.0)_
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
- **Used `shared:` block?** _(yes/no — or stuck with the single-screen pattern from v0.4?)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

**Compare to v0.4 baseline:** Gemini in the v0.4 round found the single-screen multi-view pattern and used it cleanly. That pattern is still valid in v0.5 (and now explicitly documented in the Conditionals section with caveats). Will Gemini stick with single-screen, switch to `shared:`, or use both?

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
- **Used `shared:` block?** _(yes/no — was the cross-screen function invention replaced with shared state?)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

**Compare to v0.4 baseline:** ChatGPT in the v0.4 round invented cross-screen function visibility (calling functions defined in one screen from another screen connected via `navigate to`). The v0.5 cross-screen call rule is now explicit AND `shared:` is offered as the right alternative. Will ChatGPT find `shared:` cleanly?

---

## Gaps observed (across all three models)

This is a v0.5 validation test. **The expected outcome is that the v0.4 cross-screen state gap is closed** — all three models should produce working Notes apps without inventing cross-screen function calls.

### Cross-model gap matrix (Notes v0.5)

| Concern | Claude | Gemini | ChatGPT |
|---|---|---|---|
| Used `shared:` for notes state | _?_ | _?_ | _?_ |
| Used the single-screen pattern instead | _?_ | _?_ | _?_ |
| Invented anything (cross-screen call, etc.) | _?_ | _?_ | _?_ |
| App works end-to-end | _?_ | _?_ | _?_ |

### Findings (fill in as tests run)

1. _(...)_

---

## v0.5 validation verdict for Notes

After all three models are tested, decide:

- **PASS — v0.5 closes the gap.** All three models produce working Notes apps using `shared:` (or the single-screen pattern, which is also valid). No cross-screen function calls are invented. The v0.4 cross-screen state gap is empirically closed.
- **PARTIAL — v0.5 closes most of the gap.** Some models use `shared:`, some use single-screen, some still invent. The pattern is mostly discoverable but not universal.
- **FAIL — v0.5 doesn't close the gap.** Multiple models still invent cross-screen function visibility despite the explicit v0.5 rule and the `shared:` alternative. The documentation isn't discoverable; needs a v0.5.1 docs patch.

_(fill in after tests run)_

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni v0.5, using the `shared:` block. Worth doing as a sanity check on the v0.5 design before running the cold tests.

```igni
(paste your hand-written attempt here)
```
