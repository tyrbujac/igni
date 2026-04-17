# Igni Cold-LLM Test Prompts (v0.9.1)

Cold tests against v0.9.1. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What changed in v0.9.1:** documentation-only. v0.9.0's Async section recommended setting the trigger variable "from a button or `on change:` handler". The v0.9.0 Product Search cold test (`tests/v0.9.0/Product_Search.md`) showed 2/3 frontier models read that as equivalent and wrote `on change: search = query` — which fires every keystroke and re-creates the per-keystroke fetch v0.9.0 was designed to prevent. v0.9.1 drops `on change:` from the recommendation and adds an explicit "not an escape hatch" sentence pointing at the button-tap pattern. No syntax or semantic changes; the v0.9.0 transpile-time rule is unchanged.

**Hypothesis under test:**

Does the v0.9.1 spec wording alone move Opus/GPT off the `on change: search = query` evasion pattern and onto the canonical button-tap trigger? Gemini already chose the button-tap pattern in v0.9.0 without prompting — this round tests whether the tightened wording brings the other two frontier models onto the same page *without* widening transpiler detection.

**Prediction:** if docs-only wording is sufficient, models given v0.9.1-cheatsheet should:

- use an `on tap:` handler on a button to set the trigger variable, matching Gemini's v0.9.0 pattern
- stop reaching for `on change: trigger = bound_var` to satisfy the transpiler while preserving per-keystroke semantics
- if any model still writes the `on change:` evasion, that's the empirical case for mandatory v0.10 detection widening

**Panel:** Claude Opus 4.7 (thinking OFF to match v0.9.0 conditions — one controlled variable), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama). Identical model panel to v0.9.0 Product Search. The runner adaptive-thinking fix (`414ed7e`) is separately validated with an Opus 4.7 + `--thinking 5000` run against the same prompt, outputs under `runner-validation/` — distinct from the main panel so the spec-wording comparison stays clean.

---

## 1. Product Search (trigger-variable wording target)

> Using only the Igni language spec above, write a small Product Search app in Igni.
>
> **Screen:**
> - Title: "SEARCH"
> - Show a text input where the user types a product name
> - Show a list of matching products fetched from `/api/products?q=<query>`
> - Each product row shows:
>   - name
>   - price
> - Show a loading indicator while the fetch is in flight
> - Show a friendly empty state when the query is blank or no results
> - Show an error state if the fetch fails
>
> **Requirements:**
> - Use only Igni's built-in primitives and styling values.
> - Use a clean mobile-app layout.
> - Do not use hex colors.
>
> Show the complete Igni code first, then briefly explain any design decisions you made.

**What to grade:**

- **Trigger shape (headline metric for v0.9.1).** Did the model set the trigger variable from an `on tap:` handler on a button (canonical) or from an `on change:` handler on the bound input (evasion)? v0.9.0 result: 1/3 frontier models picked button-tap. Target: 3/3 on v0.9.1 or the case for v0.10 detection widening becomes mandatory.
- **Rule adoption.** Did the model write any form of trigger-variable pattern (button or `on change:`) unprompted? Score ✓ if any trigger pattern appears; ✗ if direct `fetch("...?q=" + bound_var)` slips through.
- **Transpile pass/fail.** Auto-graded by the runner.
- **`is loading` / `is error` / empty state handling.** Same bar as v0.9.0.
- **Design-quality commentary.** Does the model name *why* it chose the button-tap shape specifically (spec text says `on change:` is not an escape hatch), or does it show the pattern mechanically?
- **Design drift.** Any invented syntax? Any React/Flutter-shaped overengineering?

**Success bar:** at least 3/4 frontier models use the button-tap trigger shape (no `on change: trigger = bound_var`). Transpile pass rate should hold at 3/4 from v0.9.0.

**Context tier:** cheatsheet (`spec/v0.9.1-cheatsheet.md`). The tightened wording lives in one sentence of the Async section — this tests whether condensed spec text is enough to move Opus/GPT off the evasion pattern.
