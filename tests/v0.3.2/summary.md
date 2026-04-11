# Igni v0.3.2 — Cold-LLM Test Summary

**Spec version:** v0.3.2
**Test suite run:** 2026-04-11
**Apps tested:** Calculator, Todo, Weather (3 of 5 originally planned — Chat and Music Player were deferred to the v0.4 acceptance round so they could test the v0.4 spec instead)
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro / Thinking 3.0, ChatGPT (free tier)

## Headline result

**v0.3.2 surfaced 12+ gaps across three apps and three models** — exactly the data needed to design v0.4 from empirical evidence rather than designer intuition. No app passed cleanly under v0.3.2; every test produced at least one universal invention, which was the entire point of the exercise.

The strongest signal came from **Calculator + Todo** showing 2/3 models naturally extending `is X` for arbitrary equality (a slam-dunk for the v0.4 design call) and from **Weather** confirming that the v0.3.2 reactive read pattern was already discoverable for live re-fetching (2/3 models found it cold; only Claude reached for the manual state-machine pattern).

## Apps × models matrix

| App           | Claude Opus 4.6 | Gemini 3.1 Pro | ChatGPT (free) | Verdict |
|---|---|---|---|---|
| Calculator    | N (5 inventions) | N (5 inventions) | N (4 inventions) | FAIL |
| Todo          | N (3 inventions) | N (3 inventions) | N (4 inventions) | FAIL |
| Weather       | ~ (5 inventions, manual state pattern) | ~ (1 invention, reactive pattern) | **Y (zero inventions)** | PARTIAL |

Legend: **Y** = valid Igni first-try, no inventions. **~** = valid but with subtle issues. **N** = failed (invented syntax).

## Aggregated gaps (the v0.4 backlog)

Ranked by how many tests surfaced each issue. Each gap references the test result file it came from.

1. **Equality syntax** (Calculator + Todo) — 2/3 models naturally extended `is X` from `is empty` to general equality. Only Gemini reached for `==`/`!=`. **Strongest evidence in the suite (4/6 data points across two apps).** v0.4 fix: bless `is X` for arbitrary equality.
2. **Arithmetic operators `-`, `*`, `/`** (Calculator) — 3/3 models invented all three. Universal need. v0.4 fix: add as standard operators.
3. **Operator precedence** (Calculator) — 3/3 models depend on standard math precedence. v0.4 fix: one sentence rule.
4. **List append `list = list + [item]`** (Todo) — 3/3 models converged on the same pattern. v0.4 fix: bless `+` for list concatenation.
5. **List removal pattern** (Todo) — 3/3 models needed it, no consensus on approach (Claude invented `without()`, ChatGPT used `each` + `continue`, Gemini used `each` filter rebuild). v0.4 design call: `without(list, item)` builtin (Claude's intuition; reads like English).
6. **`each` in non-rendering context** (Todo) — 2/3 models stretched `each` into function bodies. v0.4 fix: bless this.
7. **`null` value** (Weather) — Claude reached for `null` and `is not null` for the "no value yet" sentinel. v0.4 fix: bless `null` and extend `is X` to include `is null`/`is not null`.
8. **Number+string concatenation** (Weather) — 2/3 models wrote `number + "°"` style mixed-type expressions. v0.4 fix: one sentence — `+` coerces number to string in mixed expressions.
9. **Reactive re-fetch documentation** (Weather) — 2/3 models discovered the pattern cold; Claude missed it and reached for the manual state-machine instead. v0.4 fix: add an explicit example to the Async Data section. **No new feature** — just docs.
10. **Truthiness coercion stop-note** (Calculator + Todo + Weather) — 3 different models, 3 forms (`if operator:`, `color: x and y`, `else if error_msg:`). v0.4 fix: explicit rule that conditionals require explicit booleans.
11. **List item field mutation rule** (Todo, Claude only) — Claude wrote `item.done = not item.done`. Spec is silent on whether this is allowed. v0.4 fix: commit to functional updates only (rule stays simple).
12. **Cross-component function calls** (Todo, Claude only) — `TodoItem` calls a parent screen's function. Spec is silent. v0.4 fix: one-line clarification that this is allowed.
13. **Primitives auto-render numeric values** (Calculator) — Claude invented `to_number`/`to_string`. v0.4 fix: one-line note that primitives auto-convert.

## Per-model observations

### Claude Opus 4.6

- **Strongest at structural decomposition.** Always extracted components when the pattern called for it (`TodoItem` in Todo, `MessageBubble` later in Chat).
- **Reaches for the imperative pattern when both imperative and reactive options exist** — Claude wrote the manual state machine for Weather (loading/error/weather as separate variables) instead of the cleaner reactive `data = fetch(...)` form. The v0.3.2 mutation example in the spec was overshadowing the simpler read pattern. v0.4 added an explicit reactive re-fetch example to fix this.
- **Naturally extends `is X` to equality.** Both `is not empty` and `is "0"` style.
- **Invents type conversion when it picks string-typed display.** `to_number` / `to_string`.

### Gemini 3.1 Pro / Thinking 3.0

- **Consistently invented `==`/`!=` instead of extending `is`** in v0.3.2 testing. Both Calculator and Todo. The v0.3.2 spec didn't make `is X` discoverable enough for Gemini specifically. (Note: in the v0.4 Chat test, Gemini finally adopted `is not empty` — the v0.4 documentation worked.)
- **Functional update style.** Rebuilds lists rather than mutating in place. Verbose but unambiguous.
- **Discovers reactive patterns from existing primitives.** The Weather reactive re-fetch was found cold, no help needed.
- **Stretches `each` into function-body context** for filter loops.
- Models tested: Gemini 3.1 Pro (Calculator, Todo) → Gemini Thinking 3.0 (Weather, after Pro 3.1 limits).

### ChatGPT (free tier)

- **Most prone to JS-style idioms.** Truthiness coercion (`if operator:`, `color: x and y`), `continue` statement, conditional values via boolean expressions.
- **Also extends `is X` naturally** (used `if item is target:` in Todo, `if draft is empty:` for the empty check).
- **Most compact output** of the three across all apps.
- **First model in the entire test suite to produce a 100% clean output** — Weather, ChatGPT, zero inventions, against v0.3.2.

## Conclusions and v0.4 priorities (now shipped)

The v0.4 backlog (now shipped):

1. ✅ Arithmetic operators `-`, `*`, `/` + precedence rule
2. ✅ Bless `is X` for arbitrary equality (the highest-evidence finding)
3. ✅ Bless `+` for list concatenation
4. ✅ `without(list, item)` builtin for removal
5. ✅ `each` in non-rendering contexts
6. ✅ `null` value + `is null` / `is not null`
7. ✅ Number-to-string coercion in `+`
8. ✅ Reactive re-fetch documentation (no new feature, just docs)
9. ✅ Functional list updates (committed rule, no in-place mutation)
10. ✅ Cross-component function calls (one-line allowance)
11. ✅ Primitives auto-render numbers (one-line note)
12. ✅ Truthiness coercion stop-note
13. ✅ Conditional values via boolean expressions stop-note
14. ✅ Comments syntax (`#` to end of line, formalising existing convention)

**Deferred to v0.5:**

- Optimistic updates with rollback (requires cross-screen state, background requests, post-navigation error surfacing).
- Cross-screen shared state (likely surfaced by the Notes app test in v0.4 acceptance).
- Forms, animations, search/filter/sort, routing patterns, theming, package system.

**Surprises from this round:**

- Weather's reactive re-fetch pattern was *already discoverable* in v0.3.2 — the v0.4 fix is documentation, not new features. 2/3 models found the pattern cold.
- Calculator's predicted "grid layout" gap and "number-vs-string distinction" gap did NOT materialize. Models worked around them naturally.
- ChatGPT was the first model to produce a 100% clean test output (Weather) — and it's the free-tier model, not the highest-end one.

**Methodology notes for the v0.4 round:**

- Use the chat UI (not API). Established this round, kept for v0.4.
- Always end each prompt with *"Respond with only the Igni code"* — added mid-round after early chat-UI tests showed models discussing the spec instead of writing code.
- Capture cross-model agreement explicitly — patterns shared by 2/3 or 3/3 models are much stronger evidence than per-model findings.

## Pointers

- Per-test result files: `tests/v0.3.2/Calculator.md`, `Todo.md`, `Weather.md`
- Prompts used: `tests/v0.3.2/prompts.md`
- Spec snapshot tested: `spec/v0.3.2.md`
- v0.4 spec (the result of this backlog): `spec/v0.4.md`
- v0.4 acceptance summary (in progress): `tests/v0.4/summary.md`
