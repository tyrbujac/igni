# Igni Cold-LLM Test Prompts (v0.9.0)

Cold tests against v0.9.0. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What changed in v0.9.0:** one semantic rule change. The reactive-fetch footgun — writing `results = fetch("..." + query)` where `query` is bound to an `input` — is now a transpile-time error. The v0.8.0 spec carried this as prose guidance ("always use a trigger variable"); v0.9.0 promotes it to an enforced rule. No new syntax, no new keywords. Decision doc: `docs/private/40_v09_async_footgun.md`.

**Hypothesis under test:**

Does the v0.9.0 cheatsheet *teach the fix* zero-shot? Previous rounds have shown frontier models reaching for a reactive-looking `fetch(... + bound_var)` pattern ~50% of the time — the decision to enforce the rule came from exactly that cold-test frequency. The prediction: with v0.9.0-cheatsheet as context, frontier models should read the "reactive-fetch footgun is a transpile error" line and pre-emptively reach for the trigger-variable pattern without having to hit the error first.

**Prediction:** if the enforcement-plus-prose combo works, models given v0.9.0-cheatsheet should:

- write a separate trigger variable (e.g. `search`, `active`) and drive it from a button or `on change:` handler, rather than interpolating the bound `input` variable directly into the fetch URL
- produce Igni code that transpiles on first attempt (no footgun error from the validator)
- cite the reactive-re-fire reason in the post-code explanation, not just mechanically show the pattern

**Panel:** Claude Opus 4.7 (1M context, with `--thinking 10000`), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama). Swap from v0.8.1 Phase 1: Opus 4.6 → Opus 4.7 only; other three identical for comparability.

---

## 1. Product Search (reactive-fetch footgun target)

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

- **Rule adoption (headline metric).** Did the model write the trigger-variable pattern unprompted? A separate variable driven from a button tap or `on change:` handler, with the fetch URL built from the trigger variable — not from the input-bound variable directly. Score ✓ if the canonical pattern appears; ✗ if the model wrote `fetch("...?q=" + bound_var)` and got caught by the transpiler.
- **Transpile pass/fail.** Auto-graded by the runner. Models that hit the footgun rule fail here; models that adopted the trigger pattern should pass.
- **`is loading` / `is error` handling.** Were loading and error branches rendered correctly, not just commented about?
- **Empty state.** Was the blank-query case distinguished from the no-results case? Both should render something friendly.
- **Design-quality commentary.** In the post-code explanation, does the model *name* the reason it chose the trigger pattern (reactive re-fire on keystroke) or does it just show the pattern mechanically? Naming the reason is a stronger signal that the spec text landed.
- **Design drift.** Any invented syntax? Any React/Flutter-shaped overengineering (`useState`, state containers, hooks)?

**Success bar:** at least 3/4 frontier models should produce a trigger-variable pattern unprompted and transpile on first attempt. Any model that hits the footgun rule is still informative — the error message is the teaching signal, and the commentary on *why* the model chose the broken pattern is part of the dataset.

**Context tier:** cheatsheet (`spec/v0.9.0-cheatsheet.md`). The new footgun-is-error line lives concisely at the bottom of the Async Data section; this is the tightest test of whether condensed spec text teaches the rule.
