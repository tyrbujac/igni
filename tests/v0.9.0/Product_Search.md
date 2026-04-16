# Product Search Cold Test Results — v0.9.0 (first round on new spec)

**Date:** 2026-04-16
**Models tested:** Claude Opus 4.7 (no thinking — runner gap), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.9.0-cheatsheet.md` + v0.9.0 Product Search prompt
**Runner:** `tests/runner/run.ts`, auto-graded via transpiler
**Scope:** single-prompt round. Footgun-only, swap-Opus-only — one controlled variable vs v0.8.1 Phase 1.

## Purpose — does the v0.9.0 rule teach the fix zero-shot?

v0.9.0 promoted the reactive-fetch footgun from v0.8.0 prose guidance ("always use a trigger variable") to an enforced transpile-time rule. `fetch("..." + bound_input_var)` is now rejected with a fix-it message. The decision doc (`docs/private/40_v09_async_footgun.md`) predicted that cold tests would show the pattern at ~50% frequency, which is why the spec now enforces it.

**The hypothesis:** with v0.9.0-cheatsheet as context, frontier models should read the new "reactive-fetch footgun is a transpile error" line and pre-emptively reach for the trigger-variable pattern — without having to hit the error first.

**Pre-commit prediction:** at least 3/4 frontier models transpile on first attempt; the ones that do cite the reason (reactive re-fire on keystroke), not just mechanically show the pattern.

## Headline result — rule syntactically adopted by 3/3 frontier models, but only 1/3 used the canonical semantics

| Axis | Opus 4.7 | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Transpile passes** | ✓ (33L) | ✓ (39L) | ✓ (44L) | ✗ (drift) | **3/4** |
| **Avoids direct `fetch(..."+"+bound_var)`** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |
| **Uses canonical trigger (button tap, not `on change:`)** | ✗ `on change:` | ✗ `on change:` | ✓ button | n/a | **1/3 frontier** |
| **Names "reactive-fetch footgun" in commentary** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |
| **Handles `is loading` / `is error` correctly** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |
| **Empty state distinguishes blank query vs no results** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |

## Per-hypothesis analysis

### 1. Rule landed — but the narrow detection can be evaded with `on change: trigger = bound_var`

All three frontier models avoided the exact pattern v0.9 detects (`fetch("..." + query)` where `query` is an input bind target). All three wrote something like:

```igni
query = ""              # bound to the input
search = ""             # "trigger" variable
results = fetch("/api/products?q=" + search)
```

And all three named the rule in commentary. **Opus:** *"The spec explicitly calls out the reactive-fetch footgun: you can't put a `bind:`-ed variable directly into a `fetch()` URL in the same screen."* **GPT-5.4:** *"I used the trigger-variable pattern with `query` and `search` to avoid the reactive-fetch footgun."* **Gemini 3 Flash:** *"Per the Igni spec, I used two variables: `query` (bound to the input) and `search_term` (the actual fetch trigger). This prevents the 'reactive-fetch footgun' where every keystroke would trigger a network request."*

That's a clean win for the spec-taught-the-rule hypothesis on the syntactic level.

**But only Gemini used the canonical semantics.** Gemini updates the trigger from an explicit button tap:

```igni
input bind: query, placeholder: "Search products...", fill: true
button "Search", color: brand, on tap: search_term = query
```

Opus and GPT-5.4 both used `on change:` to copy `query` → `search` on every keystroke:

```igni
# Opus
input bind: query, placeholder: "Search products...", on change: update_search()
# ...
update_search():
  search = query
```

```igni
# GPT-5.4
input bind: query, placeholder: "Search products", on change: search = query
```

**The `on change:` indirection evades the narrow detection but preserves the per-keystroke fetch semantics.** `search = query` on every keystroke reassigns `search`; reactivity re-runs the fetch on every reassignment. API still spammed. The transpiler doesn't catch this because `fetch(... + search)` references `search`, which isn't itself a `bind:` target.

This is the strongest finding of the round: **the rule teaches the *shape* of the fix but not its *purpose*.** Gemini got the purpose (gate the fetch behind an explicit user action). Opus and GPT got the shape and missed the purpose.

### 2. Loading / error / empty states — cleanly handled by all three frontier models

`is loading`, `is error`, and `is empty` chained into an if/else cascade with `fill: true` on each non-success branch. All three distinguished the blank-query case from the no-results case, showing a different icon/label for each. No invented syntax in the state-handling branches.

### 3. Minor spec drift — one invented builtin

Both Gemini and GPT called `round(price, 2)` for price formatting. `round` is not in the spec. In Dart it happens to be a valid method on `num`, so the transpiled output compiles and probably runs — a "transpiler-accepts-what-the-spec-doesn't-cover" edge case rather than an invention that breaks things. Not a v0.9-related signal.

### 4. Gemma 4 E4B — full drift, same as Phase 1

Gemma produced 174 lines labelled ```cognito` (not `igni`), with `@state`, `@effect`, `@on enter`, typed parameters, braces, and imperative fetching. Closer to Kotlin/Swift than Igni. Matches the v0.8.1 Phase 1 finding that local 8B models drift rather than follow the spec. The 3719-token input was paid (spec + prompt sent) but the output isn't comparable to the frontier panel. Keep Gemma as the methodology floor (what the panel looks like without frontier behaviour), not as a peer.

## Per-model architecture notes

**Claude Opus 4.7** — 240 input / 883 output / 13.9s. Only 240 input tokens because the 4,783-token cache write on first call was the full spec; subsequent runs would read from cache (`in=240` reflects the non-cached prompt body). Wrote the cleanest commentary of the four — explicitly names the spec rule and walks through the state ordering. Used `on change:` evasion of the detection. Runner's 10k-thinking flag incompatible with 4.7's new `thinking.type: "adaptive"` API — ran without thinking; see follow-ups.

**GPT-5.4** — 3472 input / 455 output / 7.9s. Shortest output, tightest code. Same `on change:` evasion as Opus. Uses `if search is not empty: products = fetch(...)` at screen body level — a conditional top-level fetch, which the transpiler accepts but is an unusual shape. No commentary on *why* it chose that shape.

**Gemini 3 Flash preview** — 3701 input / 655 output / 4.5s. Fastest. Used the canonical button-tap trigger, extracted a `ProductRow` component, and named the footgun rule by name. Strongest single output of the round. Non-hex `color: green` on the price; `heading.small` on the name.

**Gemma 4 E4B** — 3719 input / 1674 output / 108s. Local, no API cost. Invented a language and wrote ~170 lines of it. 1.8 minutes of wall time for zero transpilable output. Same shape of drift as Phase 1.

## Transpiler validation

| Model | Transpile | Lines | Error |
|---|---|---|---|
| Claude Opus 4.7 | ✓ | 33 | — |
| GPT-5.4 | ✓ | 39 | — |
| Gemini 3 Flash preview | ✓ | 44 | — |
| Gemma 4 E4B | ✗ | 170 | `Unexpected character: '@'` at `@state var search_query` line |

Auto-graded via `tests/runner/grade.ts` (extracts first fenced code block, pipes through `transpiler/src/cli.ts`). No v0.9-validator errors fired — because all three frontier models preemptively wrote around the pattern. The transpiler never had to reject a direct `fetch("..." + query)` in this round.

## Verdict

**The v0.9.0 enforcement-plus-prose combo worked at the syntactic level.** All three frontier models read the cheatsheet, internalised the rule, and wrote Igni that transpiles. The teaching signal from the new spec text is strong — three independent models used the exact phrase *"reactive-fetch footgun"* in their commentary.

**The semantic win is only 1/3.** Opus and GPT used `on change: trigger = bound_var` to satisfy the transpiler while preserving the per-keystroke fetch behaviour the rule was designed to prevent. The narrow detection by construction can't catch this — the fetch URL references a non-bound variable — but the user gets the same API spam the rule was written to forbid. This is the first empirical case for widening the detection (a v0.10 candidate).

Spec text and enforcement together change model *behaviour* cleanly; changing model *understanding* needs an additional clarification.

## Next steps

1. **Widen detection (v0.10 candidate).** Catch `on change: X = bound_var` where `X` is later used in a `fetch` URL. This is the empirical pattern two of three frontier models reached for. A conservative version: reject `on change:` handlers whose sole action is `trigger = bound_var` when `trigger` is a fetch dependency. Needs a design note.

2. **Spec wording on trigger semantics.** The v0.9.0 async section says "set a separate variable from a button or `on change:` handler" — but `on change:` doesn't actually gate the fetch behind a user action; it fires on every keystroke. Proposed tightening: "set a separate variable from an `on tap:` handler on a button" and remove the `on change:` option. Models read the spec literally; the `on change:` option reads as equivalent but isn't.

3. **Runner fix for Opus 4.7 extended thinking.** The current `anthropic.ts` provider sends `thinking: { type: 'enabled', budget_tokens: N }` which was valid for 4.6. Opus 4.7 requires `thinking: { type: 'adaptive' }` + `output_config: { effort: 'high' | 'medium' | 'low' }`. One-turn runner update; blocks flagship thinking runs until fixed.

4. **Regression — Habit Tracker on v0.9.0.** Phase 1's Habit Tracker round should still pass on v0.9.0 since v0.9 doesn't touch components or emit. Worth re-running to confirm no regression from the async section rewrite.

5. **Mutating-component-arg as the next v0.10 candidate.** CLAUDE.md notes this gap. Same template as v0.9: prose says args are immutable, transpiler silently accepts shadowing. Cold test first (does any model naturally try to mutate an arg?), design note second, ship as v0.10 if the pattern appears.
