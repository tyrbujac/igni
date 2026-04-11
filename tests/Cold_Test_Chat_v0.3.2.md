# Cold-LLM Test: Chat Interface (Igni v0.3.2)

**Spec version tested:** Igni v0.3.2
**Test run dates:** _(fill in when run)_
**Source prompt:** `tests/prompts.md` → Chat interface

## The prompt

> Using only the Igni language spec below, write a chat interface in Igni. The screen should show a list of messages (each with a sender name and message text), have a text input at the bottom for typing new messages, and have a send button that adds the new message to the list and clears the input.

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

**Model version:** _(e.g. Gemini 2.5 Pro)_
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

**Model version:** _(e.g. GPT-5)_
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

Each gap noted by any model gets a line here. Include `# GAP:` comments from your own hand-written attempt below as well — both are evidence of the same underlying defect.

1. _(e.g. "Clearing an input programmatically — spec only shows two-way bind, no `clear()` method")_
2. _(...)_

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls. This is the "design by trying" data point — your gaps and the LLMs' gaps should mostly overlap.

```igni
(paste your hand-written attempt here)
```
