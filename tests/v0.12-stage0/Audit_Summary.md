# v0.12 Stage 0 scope audit — `count()` predicate form

**Date:** 2026-04-21
**Method:** 4 frontier models × 2 structurally distinct prompts, v0.11.2 cheatsheet context, no thinking, no priming toward `count()`.
**Outcome:** **General signal — not Alert-Dashboard-specific.** Design note `docs/private/65_v012_count_predicate.md` Stage 0 gate cleared. Proceed to Shape B (docs-only patch) as the opening ship move.

---

## Call-level grading

| Model | Prompt 1 (Shopping) | Prompt 2 (Tasks) | Shape family | Friction explicit? |
|---|---|---|---|---|
| Claude Opus 4.7 | `length(filter(items, item => item.tag is "new"))` | `length(filter(items, item => item.priority is "high"))` | **workaround (Shape B)** | silent on Shopping; **explicit** on Tasks — commentary names the trap verbatim |
| GPT 5.4 | `count(filter(items, item => item.tag is "new"), true)` — **invented-broken** | `length(filter(tasks, task => task.priority is "high"))` — clean | **mixed: 1 broken-count invention + 1 workaround** | implicit ("matches the spec") |
| Gemini 3.1 Flash-Lite | `count(items, item => item.tag is "new")` — **invented-broken** (predicate form) | `count(tasks, item => item.priority is "high")` — **invented-broken** (predicate form) | **invention (Shape A)** | none — used predicate form as if spec-legal |
| Gemini 3.1 Pro | `length(filter(items, item => item.tag is "new"))` | *(3 API failures on this call — `fetch failed` at provider layer; not a model-behaviour signal)* | **workaround (Shape B)** | **explicit** on Shopping — commentary names the identity trap |

**Totals (7 successful calls):**

- **7/7 surfaced the count-by-field friction** in some form — invented, worked around, or flagged.
- **3/7 explicitly named the identity trap** in commentary (Opus on Tasks, Gemini Pro on Shopping, GPT's brief "matches the spec" aside).
- **3/7 invented `count(list, predicate)` and produced silently-wrong code** — GPT's `count(filter(...), true)` and Gemini Flash-Lite's two lambda-form calls. All three transpile cleanly but compile into Dart that runs and returns 0 for every count.
- **4/7 reached for `length(filter(...))` as the canonical workaround.**
- **0/7 produced clean code that avoided the pattern entirely** — the prompt shape forces the count-by-field operation; no model dodged it.

Pass bar (set in `prompts.md`): 6/8 = general. Achieved 7/7 at 87.5%, which clears the bar even counting the Gemini Pro Task failure as a non-hit. Signal is general, not Alert-Dashboard-specific.

---

## Cross-model patterns

**1. Gemini Flash-Lite's predicate-form invention is reproducible.** v0.7.1 Alert Dashboard showed Gemini 3 Flash inventing `count(list, predicate)`. Today's Gemini 3.1 Flash-Lite did it twice, on two different domains, with no prompt reference to `count()`. This is now 3 independent Flash-class inventions of the same shape — the strongest evidence in the project for any single Shape A candidate.

**2. The silent-wrong-output failure mode is general, not model-specific.** Three different call paths produced code that transpiles, builds, runs, and displays "0 new, 0 on sale, 0 regular":

- GPT: `count(filter(...), true)` — `true` as identity target never matches a cart-item object.
- Gemini Flash-Lite × 2: `count(items, lambda)` — lambda literal as identity target never matches an item object.

These aren't the same mistake shape but they have the same outcome. The transpiler currently permits *any* shape matching `count(list, any_expr)` because the codegen's generic function-call path accepts it. That's the correctness-escalation point design note 65 already flagged.

**3. Frontier models split on commentary transparency.** Opus 4.7 and Gemini 3.1 Pro explicitly spell out the identity-vs-predicate gap when they hit it. GPT 5.4 and Gemini 3.1 Flash-Lite do not. This matches the v0.7.1 Alert Dashboard behaviour pattern: Gemini 3.1 Pro reached for commentary; Opus 4.6 did not. Commentary style is model-disposition-coupled — Pro-tier models narrate, Flash-tier models don't. Affects grading visibility but not friction signal.

**4. The Shopping → Tasks progression hints at session-level learning inside a single model.** GPT invented broken `count(filter(...), true)` on Shopping, then reached for `length(filter(...))` cleanly on Tasks. Plausibly GPT's own earlier attempt within the session primed it toward the workaround. Not a reliable pattern across runs (the runner treats prompts as independent), but worth noting as a confound for single-prompt cold tests.

---

## Ship implications for design note 65

**Stage 0 gate cleared → Shape B is justified.** The design note's recommendation holds:

1. Draft a one-paragraph cheatsheet patch stating `count(list, target)` is identity-based and recommending `length(filter(list, predicate))` for field-based counting, with one example shaped like the Alert Dashboard / Shopping / Tasks cases.
2. Ship as docs-only patch (v0.11.3 by analogy with v0.11.1's cheatsheet-restructure ship), no transpiler work.
3. Rerun this audit (or the original Alert Dashboard prompt) against the patched cheatsheet. 3/4+ adoption on `length(filter(...))` = Shape B is sufficient; ≤2/4 = escalate to Shape A.

**Additional escalation signal on top of the design note:** the transpiler silently accepts and produces wrong-output for the `count(list, predicate)` and `count(list, non-matching-value)` shapes. This is a correctness bug independent of Shape A/B. Two paths forward:

- **If Shape B ships and adoption is 3/4+ on the rerun:** widen transpiler rejection to reject `count(list, lambda)` at transpile time, per the v0.9-template "enforce what docs teach" pattern. One-line negative test in `transpiler/examples-errors/`.
- **If Shape A gets shipped later:** the rejection widens into a dispatch branch. Lambda → predicate codegen; non-lambda → identity codegen.

Either way, the "silent broken output" failure mode needs the transpiler-rejection pass. Current state (allows it, compiles to always-false `==` comparison) is a dissertation-quality bad-correctness-signal in its own right.

---

## Appendix — call-level transpile results

| Call | Transpile pass | Runtime correctness |
|---|---|---|
| Opus Shopping | ✓ | ✓ — `length(filter(...))` returns correct counts |
| Opus Tasks | ✓ | ✓ |
| GPT Shopping | ✓ | ✗ — `count(filter(...), true)` returns 0 for every count |
| GPT Tasks | ✓ | ✓ |
| Flash-Lite Shopping | ✓ | ✗ — `count(items, lambda)` returns 0 for every count |
| Flash-Lite Tasks | ✓ | ✗ — same |
| Pro Shopping | ✓ | ✓ |
| Pro Tasks | — (3 × fetch-failed at provider layer) | — |

**3/7 transpile-but-wrong-at-runtime.** This is the escalation-to-correctness signal design note 65 flagged. 43% of outputs silently produce wrong counts with current transpiler + v0.11.2 cheatsheet.

---

## Cost and provenance

- Calls executed 2026-04-21. Spec context: `spec/v0.11.2-cheatsheet.md` (2856 words).
- Per-call cost for Anthropic recorded in JSON (`cost_usd`). OpenAI/Google costs report $0 pending `pricing.ts` rate fill-in (tracked separately in ROADMAP v0.10 close-out tails).
- Raw outputs: `tests/v0.12-stage0/outputs/*.md` (prose) and `*.json` (metadata, transpile grade).
- Prompts file: `tests/v0.12-stage0/prompts.md`.

## Next step

Write the v0.11.2-cheatsheet → v0.11.3-cheatsheet one-paragraph patch per design note 65 recommendation. Stage 1 (proposal round) is skippable — the shape is not in question; the adoption question is.
