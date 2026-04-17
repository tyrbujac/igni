# Product Search Cold Test Results — v0.9.1 (docs-only follow-up to v0.9.0)

**Date:** 2026-04-17
**Models tested:** Claude Opus 4.7 (thinking OFF for apples-to-apples; separate adaptive-thinking validation under `runner-validation/`), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.9.1-cheatsheet.md` + v0.9.1 Product Search prompt (prompt body byte-identical to v0.9.0)
**Runner:** `tests/runner/run.ts`, auto-graded via transpiler
**Scope:** single-prompt round. One controlled variable vs v0.9.0: the cheatsheet file (spec wording). Model panel, prompt, thinking setting, everything else held constant.

## Purpose — does docs-only wording move Opus and GPT off the `on change:` evasion?

v0.9.0 Product Search (`tests/v0.9.0/Product_Search.md`) found 3/3 frontier models adopted the trigger-variable pattern *syntactically* but only 1/3 used the canonical semantics. Opus and GPT both wrote `on change: search = query` to satisfy the transpiler while preserving per-keystroke fetch behaviour — the narrow detection by construction can't catch that shape.

v0.9.1 is a docs-only patch: drops `on change:` from the trigger-variable recommendation in *Async Data*, adds a sentence explicitly flagging `on change: trigger = bound_var` as *not* an escape hatch. No transpiler changes, no new syntax. The hypothesis: if spec wording alone is enough, Opus and GPT will flip to `on tap:` on a button without needing enforcement.

**Pre-commit prediction:** 3/4 frontier models use button-tap trigger shape (no `on change: trigger = bound_var`). If that holds, the v0.10 case for widening the transpiler detection gets weaker — docs changed behaviour without code.

## Headline result — 3/3 frontier models on the canonical button-tap trigger

| Axis | Opus 4.7 | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Transpile passes** | ✓ (34L) | ✓ (33L) | ✓ (41L) | ✗ (drift) | **3/4** |
| **Uses canonical trigger (`on tap:` on a button)** | ✓ | ✓ | ✓ | n/a | **3/3 frontier** |
| **Avoids `on change: trigger = bound_var` evasion** | ✓ | ✓ | ✓ | n/a | **3/3 frontier** |
| **Names reactive-fetch footgun in commentary** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |
| **`is loading` / `is error` / empty state handling** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |

**Direct comparison — v0.9.0 vs v0.9.1:**

| Model | v0.9.0 trigger shape | v0.9.1 trigger shape | Change |
|---|---|---|---|
| Claude Opus 4.7 | `on change: update_search()` + helper fn | `on tap: search = query` | ✓ flipped to canonical |
| GPT-5.4 | `on change: search = query` | `on tap: search = query` | ✓ flipped to canonical |
| Gemini 3 Flash | `on tap: search_term = query` | `on tap: search_term = query` | — stable |
| Gemma 4 E4B | `@state`/`@on` drift | `@state`/`@on` drift | — stable (methodology floor) |

Docs-only wording moved the two models that were evading the rule in v0.9.0 onto the canonical pattern. Zero transpiler changes, one sentence changed in the spec, two of four models flipped.

## Per-hypothesis analysis

### 1. The docs-only tightening worked — 3/3 frontier on `on tap:` trigger

Opus 4.7's v0.9.1 code:

```igni
screen Search, title: "SEARCH":
  query = ""
  search = ""

  results = fetch("/api/products?q=" + search)

  layout vertical, padding: large, gap: medium:
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search products..."
      button "Go", color: brand, on tap: search = query
    ...
```

vs v0.9.0:

```igni
# Opus v0.9.0
input bind: query, placeholder: "Search products...", on change: update_search()
# ...
update_search():
  search = query
```

The v0.9.1 code is also *shorter* than v0.9.0 — the button-tap shape removes the need for a helper function entirely. Opus's commentary: *"I used two variables: `query` (bound to the input, changes per keystroke) and `search` (only updated on button tap). The fetch reads from `search`, so it only fires when the user commits."* The word *commits* is new — v0.9.0's Opus explanation was about "the spec rule" in the abstract; v0.9.1's is about *what the trigger semantically means*.

GPT-5.4 changed from `on change: search = query` (v0.9.0) to `on tap: search = query` (v0.9.1). Exactly the shape v0.9.1's wording recommended. Commentary: *"`search` is only updated when the user taps the Search button. This avoids the reactive-fetch footgun."* Again, "when the user taps" is new phrasing — the mechanism, not just the rule name.

Gemini 3 Flash produced essentially the same code as v0.9.0 — it was already on the canonical pattern and stayed there.

### 2. None of the models cited the "not an escape hatch" sentence explicitly

Notable: zero of the three frontier models quoted or paraphrased the new v0.9.1 caveat. They just *did* the button-tap version. This is stronger than quoting — the sentence reshaped the recommendation at the top of the trigger-variable paragraph, and the models picked up the new default. The caveat sentence at the end is load-bearing only if a model reaches for `on change:` first; since none did, the caveat wasn't tested for its own sufficiency, only its presence-alongside-the-recommendation. An ablation (remove only the caveat, keep the `on tap:`-only recommendation) could isolate which half did the work — not worth running for one round of three models, but worth remembering if v0.10 detection widening gets pushed.

### 3. Runner adaptive-thinking fix validated

Separate `runner-validation/` run: Opus 4.7 + `--thinking 5000` against v0.9.1-cheatsheet. The new `is47PlusModel()` branch fired (`effort=low from budget=5000`), the API accepted the `thinking: { type: 'adaptive' }` + `output_config: { effort: 'low' }` shape, the call completed in 11.6s with 712 output tokens. Transpile ✓ (32 lines).

Interesting side observation: the thinking-on variant produced slightly shorter, tighter code (32L vs 34L) with less design-decisions commentary (712 vs 966 output tokens) but the exact same trigger-variable shape (`on tap: search = query`). This matches the Phase 1 pattern — thinking at low effort focuses the model rather than making the code substantively different. For flagship runs, the dial would bump to 10000 (medium) or 16000+ (high); the low effort proved the mechanism works.

### 4. Minor drifts unchanged from v0.9.0

Both GPT and Gemini again used `round(price, 2)` for price formatting — `round` remains not in the spec. Dart's `num.round()` accepts it, so it transpiles and runs. Not a v0.9.1 signal, same as v0.9.0. If `round` or related number formatting keeps appearing across cold tests, it's a standalone v0.10 candidate ("3 models invented a formatter" signal), but that needs its own cold-test evidence track.

Gemini extracted a `ProductRow` component again. GPT used `length(products) is 0` for empty-results (same as v0.9.0). Both consistent with their v0.9.0 shapes.

### 5. Gemma 4 E4B — full drift, same as v0.9.0 and v0.8.1 Phase 1

174 lines of `@state`, `@on input:focus_change`, `@function`, `@async`, `delay: 1000ms`. 79.7s wall time. Same methodology floor. Included for the panel completeness but uninformative for v0.9.1-specific signal.

## Per-model architecture notes

**Claude Opus 4.7 (no thinking)** — 240 input / 966 output / 14.9s. Output 966 tokens vs 883 in v0.9.0 (slightly longer commentary; code body is 34L vs 33L). Used `search is empty` *before* the fetch-state branches — explicitly called out in commentary as "keeps the initial screen calm". Same 5-state branching depth as v0.9.0, but the flow is cleaner with no helper function.

**GPT-5.4** — 3518 input / 491 output / 7.5s. Shortest output, tightest code (same as v0.9.0). Dropped the top-level conditional fetch (`if search is not empty: products = fetch(...)`) that was in v0.9.0 — now uses unconditional screen-body fetch with the trigger variable, which is the canonical shape. Architecturally simpler than v0.9.0.

**Gemini 3 Flash preview** — 3746 input / 655 output / 4.2s. Fastest frontier model, same pattern as v0.9.0: button-tap trigger, extracted `ProductRow` component, "Try Again" button in error state that re-assigns the trigger. Output size identical to v0.9.0 (655 tokens). Stable.

**Gemma 4 E4B** — 3763 input / 1163 output / 79.7s. Local via Ollama. Drifted into `@state`/`@on` DSL, not Igni. Same shape as v0.9.0 and Phase 1.

**Claude Opus 4.7 (thinking 5000, runner-validation/)** — 240 input / 712 output / 11.6s. Same trigger shape as the thinking-off run, marginally less commentary. Validates the 4.7 adaptive-thinking runner fix end-to-end.

## Transpiler validation

| Model | Transpile | Lines | Error |
|---|---|---|---|
| Claude Opus 4.7 | ✓ | 34 | — |
| GPT-5.4 | ✓ | 33 | — |
| Gemini 3 Flash preview | ✓ | 41 | — |
| Gemma 4 E4B | ✗ | — | drifted to non-Igni DSL |
| Opus 4.7 (thinking 5000, validation) | ✓ | 32 | — |

Auto-graded via `tests/runner/grade.ts`. No v0.9-validator errors fired — which was the whole design: v0.9.1 got the models to write code the validator doesn't have to reject, instead of code the validator can't catch.

## Verdict

**v0.9.1 docs-only worked.** Against the same panel, same prompt, same thinking setting as v0.9.0, changing only the spec wording moved 2/3 frontier models off the `on change: trigger = bound_var` evasion and onto the canonical button-tap trigger. The "not an escape hatch" caveat sentence plus the `on tap:`-only recommendation together reshaped the default the models reach for.

**Implication for v0.10 detection widening.** The case for making `on change: trigger = bound_var` a transpile error is now weaker than it was after the v0.9.0 round. Docs fixed the behaviour gap without enforcement. Widening the detection anyway would still help the principled "no magic" argument (the evasion pattern is *possible* even if no frontier model now writes it), but the cold-test-driven urgency is reduced. Moves from "mandatory v0.10 candidate" to "nice-to-have v0.10 candidate", pending a replication round against different prompts or a larger panel.

**Runner adaptive-thinking fix validated end-to-end.** Opus 4.7 + `--thinking 5000` produced clean output under the new `is47PlusModel()` branch. Flagship runs at 10000 (medium effort) are unblocked.

**Methodology note.** This is the cleanest cold-test-driven iteration in the project's history: one-sentence spec change → direct behavioural flip in two of three frontier models, measured against a same-panel baseline. The template (v0.9.0 enforce + v0.9.1 wording) is reusable for any future pitfall where enforcement-plus-prose is the right combination.

## Next steps

1. **Regression — Habit Tracker on v0.9.1.** Component `emit`/`on <event>:` wiring from v0.8.0 should be unaffected by v0.9.1's async-section wording change. Worth a rerun to confirm no regression and to validate the thinking-runner fix on a second prompt.

2. **Flagship-effort validation.** A single Opus 4.7 run at `--thinking 10000` (medium) or `--thinking 16000` (high) would verify the higher effort buckets in the runner's mapping table. Low was validated this round.

3. **v0.10 candidate re-ranking.** With widening-async-detection de-prioritised, the top v0.10 candidates are: (a) object update ergonomics (`{target with done: not target.done}`), (b) `count()` predicate form, (c) mutating-component-arg (next "prose says, transpiler silently allows" gap to test on the v0.9 template). Each still needs a design note before syntax lands.

4. **Ablation (deferred).** To isolate whether the `on tap:`-only recommendation or the "not an escape hatch" caveat did the work, remove one at a time and rerun the panel. Not worth running now — the combined change already shipped the intended behaviour — but worth noting if the v0.10 decision on detection widening becomes load-bearing.
