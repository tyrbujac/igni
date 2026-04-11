# Cold-LLM Test: Chat Interface (Igni v0.4)

**Spec version tested:** Igni v0.4
**Test run dates:** _(fill in when run)_
**Source prompt:** `prompts.md` → Chat interface

## The prompt

> Using only the Igni language spec above, write a chat interface in Igni. The screen should show a list of messages (each with a sender name and message text), have a text input at the bottom for typing new messages, and have a send button that adds the new message to the list and clears the input.
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

This is a **v0.4 acceptance test.** Universal gaps here mean v0.4 missed something the test suite should have caught.

### Predicted gaps for this test

- **Clearing an input programmatically.** The spec only shows two-way `bind`. To clear an input after send, the model needs to set the bound variable to `""`. Worth checking whether this is obvious from the bind docs or if models invent a `clear()` method.
- **Scroll-to-bottom behaviour.** The spec has no scroll primitive. Chat UIs traditionally scroll to the bottom when a new message arrives. Models may invent a scroll directive, ignore the issue entirely, or do something creative.

### Findings (fill in as tests run)

1. _(...)_

---

## v0.4 acceptance verdict

After all three models are tested, decide:

- **PASS** — all three models produce valid Igni first-try with no inventions. v0.4 covers this case cleanly.
- **PARTIAL** — at least one model invented something, but the inventions are minor or fall under predicted v0.5 gaps (like scroll behaviour). v0.4 ships, the gaps go into the v0.5 backlog.
- **FAIL** — multiple models invented things v0.4 should have covered. Patch as v0.4.1 or roll back.

_(fill in after tests run)_

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls.

```igni
(paste your hand-written attempt here)
```
