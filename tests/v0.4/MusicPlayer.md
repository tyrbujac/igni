# Cold-LLM Test: Music Player (Igni v0.4)

**Spec version tested:** Igni v0.4
**Test run dates:** _(fill in when run)_
**Source prompt:** `prompts.md` → Music player

## The prompt

> Using only the Igni language spec above, write a music player screen in Igni. Show album art, song title, artist, a progress slider, and play/pause/skip-back/skip-forward buttons in a row at the bottom.
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

This is a **v0.4 acceptance test** that's expected to pass cleanly. The music player was already validated against Gemini in the v0.3.1 comparison test where it surfaced no significant gaps. v0.4 should be at least as strong.

**Predicted gaps:** none significant. This is the closest to a v0.4 happy path. If gaps surface, they're high-priority because this should be the easiest acceptance test in the suite.

### Findings (fill in as tests run)

1. _(...)_

---

## v0.4 acceptance verdict

After all three models are tested, decide:

- **PASS** — all three models produce valid Igni first-try with no inventions. The happy-path baseline holds.
- **PARTIAL** — at least one model invented something. Worth investigating because this app should be easy.
- **FAIL** — multiple models invented things. v0.4 has a real problem on the basics.

_(fill in after tests run)_

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls.

```igni
(paste your hand-written attempt here)
```
