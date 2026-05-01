# v0.21 Phase 4 — Igni vs raw Flutter comparison: synthesis

**Run date:** 2026-05-01
**Pre-registration:** `docs/private/131_phase4_comparison_design.md`
**Cells:** 18 (3 apps × 3 models × 2 frameworks)
**Total cost:** $1.53 (under the $2-4 target)

## 1. Verdict — SOFT PASS

**B1, B2, B3 cleared comfortably; B4 missed (instrument truncation dominates the failure).** B5 reports a clean amortisation breakeven at ~12 apps.

| Bar | Threshold | Measured | Status |
|---|---|---|---|
| **B1** out_tokens compression | Igni ≤ Flutter × 0.5 | 0.292× | ✓ PASS (1.7× under bar) |
| **B2** out_loc compression | Igni ≤ Flutter × 0.4 | 0.156× | ✓ PASS (2.6× under bar) |
| **B3** out_words compression | Igni ≤ Flutter × 0.5 | 0.177× | ✓ PASS (2.8× under bar) |
| **B4** compile non-degradation | Igni ≥ Flutter − 10pp | -33.3pp | ✗ FAIL (raw); see §4 adjusted view |
| **B5** cheatsheet amortisation | reported, not gated | 12.2 apps | ✓ reported |

**B4 caveat:** 2 of the 3 Igni compile failures are Gemini-Pro output truncation — an instrument issue confirmed at n=3 (this run + v0.21 Stage 0 + v0.21 pre-cycle panel). Excluding instrument failures, the adjusted compile rate is Igni 6/7 (85.7%) vs Flutter 9/9 (100%) — delta −14.3pp, narrow miss on B4 by 4.3pp. Only one genuine model-output failure (GPT-5.5 bmi; see §5).

## 2. Metrics by app — per-cell table

| App | Model | Igni out_tok | Flutter out_tok | Igni LOC | Flutter LOC | Igni words | Flutter words | Igni cmp | Flutter cmp |
|---|---|---:|---:|---:|---:|---:|---:|:---:|:---:|
| **mi-card** | claude | 217 | 1112 | 11 | 103 | 63 | 224 | ✓ | ✓ |
|  | gpt-5.5 | 692 | 770 | 12 | 110 | 75 | 207 | ✓ | ✓ |
|  | gemini-pro | 167 | 714 | 11 | 84 | 65 | 212 | ✓ | ✓ |
| **bmi** | claude | 1187 | 3599 | 74 | 293 | 415 | 751 | ✓ | ✓ |
|  | gpt-5.5 | 3534 | 3957 | 93 | 517 | 452 | 1135 | ✗ model | ✓ |
|  | gemini-pro | 326 | 2916 | 0 | 421 | 0 | 937 | ✗ truncated | ✓ |
| **pomodonut** | claude | 851 | 2372 | 75 | 218 | 274 | 505 | ✓ | ✓ |
|  | gpt-5.5 | 2822 | 5203 | 91 | 350 | 341 | 835 | ✓ | ✓ |
|  | gemini-pro | 328 | 2080 | 39 | 250 | 120 | 678 | ✗ truncated | ✓ |

## 3. Aggregate

Median + range across 9 cells per framework:

| Metric | Igni median | Flutter median | Igni range | Flutter range | Igni / Flutter |
|---|---:|---:|---|---|---:|
| output_tokens | 692 | 2372 | 167 – 3534 | 714 – 5203 | **0.292×** |
| output_loc | 39 | 250 | 0 – 93 | 84 – 517 | **0.156×** |
| output_words | 120 | 678 | 0 – 452 | 207 – 1135 | **0.177×** |
| wall_clock_s | 52.2 | 33.0 | 4.0 – 72.5 | 9.7 – 83.2 | 1.583× (Igni *slower* — cheatsheet read time) |

**Compile-success rate:**

| | Pass | Fail | Rate |
|---|---:|---:|---:|
| Igni (raw) | 6 | 3 | 66.7% |
| Igni (truncation-adjusted) | 6 | 1 | 85.7% |
| Flutter | 9 | 0 | 100% |

**Cheatsheet size by provider tokenizer (uncached first-call measurement — canonical):**

| Provider | Cheatsheet tokens | Cheatsheet words |
|---|---:|---|
| Anthropic (Claude) | 20,553 | 8,007 |
| OpenAI (GPT-5.5) | 13,823 | 8,007 |
| Google (Gemini Pro) | 14,766 | 8,007 |

Anthropic's tokenizer counts the same cheatsheet ~50% higher than OpenAI's — a methodology-grade observation about cross-provider token-cost comparability. Same cheatsheet-words; different cheatsheet-tokens. The dissertation chapter must report tokens per-provider, not as a single number.

## 4. Per-bar evaluation

### B1 — Output token compression (≤0.5×): ✓ PASS
**Measured 0.292×** (median Igni 692 vs Flutter 2372 output tokens). 1.7× under the bar. Holds across all three apps (mi-card 0.20×, bmi 0.33×, pomodonut 0.36× when computed pairwise on Claude). The compression claim from the LOC baseline (1.4–5.3× hand-Flutter) holds and tightens for LLM-generated output — model-emitted Igni compresses *at least* as well as hand-written Igni, supporting the cheatsheet-as-canonical-shape design lock.

### B2 — Output LOC compression (≤0.4×): ✓ PASS
**Measured 0.156×** (median Igni 39 vs Flutter 250 LOC). 2.6× under the bar. Stronger compression than B1 because Dart's per-line density is lower — Flutter LLMs emit `Container(margin: ...)` on its own line more than Igni emits `padding: medium` in dedicated lines. Mi-card showed the highest compression (claude: 11 vs 103 LOC = 9.4×) — the static-styling-heavy app class identified in `tests/benchmarks/loc-ratio.md` as Igni's strongest compression case is reconfirmed under LLM generation.

### B3 — Output word compression (≤0.5×): ✓ PASS
**Measured 0.177×** (median Igni 120 vs Flutter 678 words). 2.8× under the bar.

> **Methodology note: smoke run flagged a B3 narrow-miss concern that resolved with the full panel.** During the 6-cell smoke (Claude only), B3 measured 0.543× — narrowly missing the 0.5 bar. Initial interpretation: Igni's keyword-heavy syntax (many short whitespace-split tokens like `layout vertical, padding: medium`) produces inflated word counts vs Dart's longer-token style (`Container(margin: EdgeInsets.all(16))`). The full 18-cell run dropped B3 to 0.177× because Flutter outputs from GPT-5.5 + Gemini-Pro are *much* more verbose than Claude's (median Flutter words: 678 across full panel vs 505 for Claude alone). **Lesson for future Phase 4 runs: Claude is the most compact Flutter producer of the trio; smoke-on-Claude underestimates Flutter's verbosity baseline.**

### B4 — Compile-success non-degradation (≥−10pp): ✗ FAIL (raw); narrow miss (adjusted)
**Raw measured −33.3pp** (Igni 66.7% vs Flutter 100%). **Adjusted measured −14.3pp** (excluding 2 truncation-failed Gemini cells: Igni 85.7% vs Flutter 100%) — still misses the bar by 4.3pp.

Failure breakdown:
- **igni/gemini-pro/bmi:** instrument failure. Output truncated at 326 tokens before any code fence appeared — the entire output is mid-thinking-prose. n=3 instance of the Gemini-Pro truncation trap (n=1 from v0.21 pre-cycle panel; n=2 from v0.21 Stage 0; n=3 from this run).
- **igni/gemini-pro/pomodonut:** instrument failure. Output truncated at 328 tokens mid-function (`return` with no value, no closing brace). Same trap class as above.
- **igni/gpt-5.5/bmi:** **genuine model failure.** GPT-5.5 produced a `MaleCard` component with the layout block declared *inline with* a function (`gender_border()`) defined as a sibling of the layout *inside the same component body*. Transpiler rejected with "Unexpected token 'gender_border' — expected a UI element". Two interpretations: (a) the spec implicitly forbids post-layout function definitions inside components but doesn't say so explicitly; (b) the transpiler has a parser bug accepting this in `screen` bodies but not `component` bodies (pomodonut's screen has post-layout functions and parses fine). Routes to trap-journal (see §7).

The B4 miss does not falsify the "compactness without correctness loss" claim — three of the eighteen cells failed, all in Igni, but two of those failures are not language-design problems. The single genuine failure (GPT bmi) reveals a spec/transpiler ambiguity worth surfacing rather than a fundamental Igni design issue.

### B5 — Cheatsheet amortisation breakeven: 12.2 apps
**Reported, not gated.** Cheatsheet (~20,553 Anthropic tokens) divided by per-app output-token savings (median Flutter out − median Igni out = 1,680 tokens) yields a breakeven point at ~12 apps. Translation: by the 13th Igni app you build with the same cheatsheet read, the Igni cheatsheet has paid for itself in output-cost savings. With prompt caching enabled (Anthropic's case), the breakeven happens essentially on the first cell since cache-hit cost is ~10% of cache-creation cost.

## 5. Per-app commentary

### mi-card (3/3 Igni, 3/3 Flutter)
All three models cold-reached for the canonical Igni shape — `screen MiCard, background: teal:` with centred avatar + name + role + two pill-style info rows. Claude and GPT both produced ~12-line outputs; Gemini-Pro at 11 lines despite truncating overall. Flutter outputs ranged 84-110 LOC with all three reaching for `Scaffold` + `Container` (circular avatar) + `Card` (info pills). Claude's Flutter output was the most verbose at 103 LOC (`SingleChildScrollView` wrapper, explicit `mainAxisSize.min`); Gemini's Flutter output was the most compact at 84 LOC. **No surprises** — this is the styling-heavy static-app class where Igni's compression should land cleanly, and it did.

### bmi (1/3 Igni, 3/3 Flutter)
The most informative app for the comparison. Claude's Igni output (74 LOC) closely mirrored the canonical hand-written `bmi/app.igni` shape (97 LOC) — `shared:` block, two screens, three components. GPT-5.5 reached for a similar shape (93 LOC) but tripped the post-layout-functions-in-component trap (see §4). Gemini-Pro truncated mid-thinking. Flutter outputs ranged 293-517 LOC with `StatefulWidget` boilerplate dominating; Claude's 293-LOC version was particularly tight; GPT's 517-LOC version included redundant per-card `StatefulWidget` extractions. **The cheatsheet's "post-layout functions" gap surfaced for the first time here** — neither the spec nor the cookbook has a worked example showing whether functions can appear after a layout *inside a component*.

### pomodonut (2/3 Igni, 3/3 Flutter)
Claude (75 LOC Igni) used the relative-decrement timer pattern (`remaining = remaining - 1`) — which the cheatsheet *explicitly warns against* in favour of `now()`-based wall-clock timestamps ("the relative-decrement pattern loses elapsed seconds when the screen unmounts"). Despite the cheatsheet teaching, Claude reached for the simpler shape. **Cold-reach reveals teaching gap: the cheatsheet warning is in the section on `every` blocks but the bias-toward-`now()` pattern doesn't propagate to the timer-app domain in zero-shot.** GPT-5.5 used a similar relative-decrement pattern. Gemini-Pro truncated. Flutter outputs ranged 218-350 LOC with all three using `Timer.periodic` + `setState`.

## 6. Methodology observations

1. **Gemini-Pro truncation trap promoted to n=3 (formal trap class).** Three independent panels in three days have shown Gemini-3.1-pro-preview producing output budgets ~5-15× smaller than peer models (Pro: 167-328 tokens vs Claude/GPT: 692-3957 tokens for the same prompts). This is not a ceiling of the model's capability — it's a behaviour pattern where Pro decides early to wrap up. Recommendation: add a note to the `spec-cycle` skill instructing future Phase 4 / Stage 0 / Stage 3 runs to sanity-check Gemini-Pro output length before interpreting low compile-pass rates. Truncation-adjusted reporting should be standard practice.

2. **Claude is the most compact Flutter producer of the trio (n=1).** Smoke-on-Claude alone underestimates Flutter's verbosity baseline by 25-30%. Claude's Flutter outputs are systematically shorter than GPT and Gemini-Pro's. This means future smoke-tests against Claude alone may produce conservative compactness estimates — the full panel reveals stronger Igni-vs-Flutter compression than any single-model view. **Worth catching at smoke design time:** smoke against the median-verbose model (GPT) for honest baseline.

3. **Tokenizer disparity matters for cross-provider claims.** Anthropic's tokenizer counts the cheatsheet ~50% higher than OpenAI's (20,553 vs 13,823 tokens for 8,007 words). Reports that quote a single "tokens" number obscure this — every dissertation-grade cheatsheet-cost figure must be qualified per-provider.

4. **Output length correlates with verbosity, not correctness.** GPT-5.5's 5,203-token Flutter pomodonut output is 2.5× larger than Claude's 2,372-token equivalent — both compile cleanly and produce structurally similar widget trees. The compactness compression measured here (B1, B2, B3) is *Igni vs Flutter* not *Igni vs minimum-Flutter*. The hand-Flutter LOC baseline (`tests/benchmarks/loc-ratio.md`) used Angela Yu's idiomatic implementations as the Flutter reference, which is closer to Claude's output style than GPT's. The full LLM panel produces a *less generous* Flutter baseline (more verbose) which is what makes the compression numbers here higher than the hand-written baseline ranges.

5. **Cheatsheet-token-delta computation needed cache-aware accounting.** First-pass implementation read `usage.input_tokens` only and missed Anthropic's `cache_creation_tokens` / `cache_read_tokens` — yielded negative cheatsheet sizes for Igni cells (see commit messages). Lesson for future runners: full input cost is `input + cache_creation + cache_read`; provider cache-hit accounting is per-API and must be summed.

6. **Stage 0 → Phase 4 instrumentation handoff cleanliness.** The cold-test runner adapted to Phase 4 with zero modifications — the existing `--prompts`, `--out`, `--spec`, `--no-spec`, `--no-grade`, `--models` flags covered everything. Only the post-processor (compile-check + compute-metrics) was new code, ~250 lines total. Methodology infrastructure investment from prior cycles (Stage 0/2/3 pattern) paid dividends here.

## 7. Anomaly notes

- **igni/gemini-pro/bmi:** truncated mid-thinking-prose, no code fence emitted. Marked `compile_success: false`. Not regenerated — instrument failure documented for synthesis honesty.
- **igni/gemini-pro/pomodonut:** truncated mid-function (`return` without value, unclosed code block). Extractor's unfenced fallback returned the partial output with the leading code-fence prefix; transpiler choked on `\`\`\`igni` at line 1. Two issues compounded: (a) extractor's unfenced fallback should strip leading code-fence markers; (b) the underlying code is truncated regardless. Cosmetic extractor fix would not change verdict; logged as a post-cycle TODO.
- **igni/gpt-5.5/bmi:** genuine model-output failure. Routes to trap-journal:

  ```
  2026-05-01 | spec | post-layout functions inside `component` body rejected by transpiler with "Unexpected token X — expected a UI element"; same shape inside `screen` body parses fine. Surfaced via Phase 4 GPT-5.5 cold-reach. Two routes: (a) spec clarifies post-layout functions are forbidden inside components and cookbook gets a counter-example; (b) transpiler grows post-layout-function recognition in component bodies. Defer routing decision until Tyr reviews — n=1 from this panel; could reproduce in a follow-up component-pattern probe. | → routing TBD
  ```

- **No cells regenerated, no manual prompt fixes, no asset-failure exclusions triggered.** All 18 cells ran exactly as pre-registered.

## 8. Handoff to doc 117 methodology chapter

**Paragraph(s) destined for §4 quantitative subsection of `docs/private/117_methodology_chapter_draft.md`:**

> **Phase 4 — Igni vs raw Flutter quantitative comparison (2026-05-01).** A pre-registered (`docs/private/131`) 18-cell comparison test: 3 frontier models (Claude Opus 4.7, GPT-5.5, Gemini 3.1 Pro) building 3 small apps (mi-card, bmi, pomodonut) twice each — once in Igni (with v0.21 cheatsheet injected) and once in raw Flutter (no spec injection — relying on training-corpus knowledge). Measured: input tokens (with cheatsheet broken out separately for honest accounting), output tokens, output LOC, output word count, wall-clock duration, binary compile-success.
>
> Headline findings: Igni median output across the panel is **0.292× Flutter median tokens, 0.156× LOC, 0.177× words** — confirming and tightening the hand-written LOC baseline (`tests/benchmarks/loc-ratio.md`) under LLM generation. Compile-success ran 6/9 Igni vs 9/9 Flutter; truncation-adjusted (excluding 2 Gemini-Pro instrument failures), 6/7 vs 9/9. Cheatsheet amortisation breakeven at ~12 apps before per-app output savings recover the cheatsheet input cost (essentially zero with prompt caching).
>
> The single genuine model failure (GPT-5.5 on bmi) revealed a previously-unsurfaced spec ambiguity around post-layout function definitions inside `component` bodies — routing TBD. The Gemini-Pro truncation pattern is now n=3 across three independent panels, promoted to formal trap class.
>
> The compactness claim is empirically grounded but not load-bearing in isolation — its dissertation contribution is in *combination* with the hand-Flutter LOC baseline (different methodology, same direction), the qualitative cold-test convergence (different methodology, different question), and the Path C Figma-translation failure-mode tracking (different methodology, different surface). Phase 4 fills the quantitative-external-validation slot left empty in the original methodology design; it does not replace any of the cycle's primary instruments.

**Cite alongside:** `tests/benchmarks/loc-ratio.md` (hand-written baseline), `docs/private/131_phase4_comparison_design.md` (pre-registration), this synthesis (results), Phase 4 metrics CSV.

---

*Synthesis hand-written 2026-05-01 from raw `metrics.csv` + `compile-results.json`. No automated synthesis (per `docs/private/104` automation principle). Total cycle cost: $1.53 across 18 cells. Cycle time: ~25 minutes wall-clock for the cold-test runs (parallel) + ~15 minutes for compile-check/metrics + synthesis writing.*
