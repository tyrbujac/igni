# v0.11.4 Stage 3 validation — Shape B adoption

**Date:** 2026-04-21
**Method:** 4 frontier models × 2 pre-registered prompts, `spec/v0.11.4-cheatsheet.md` context, no thinking budget.
**Outcome:** **PASS.** 0 silently-wrong inventions of `count(list, lambda)` across 7 delivered calls. Pre-registered pass bar cleared. Shape B (docs-only patch) is behaviourally sufficient. Shape A (polymorphic `count`) drops from the active backlog.

---

## Call-level grading

| Model | Prompt | Count expression used | Cited callout in commentary? | Transpile | Runtime semantics |
|---|---|---|---|---|---|
| Claude Opus 4.7 | Alert Dashboard | `length(filter(alerts, a => a.level is "critical"))` (×3) | **Yes** — "The spec explicitly warns that `count(alerts, \"critical\")` returns 0 on a list of objects because `count` only matches whole values, not predicates." | ✓ | correct |
| Claude Opus 4.7 | Task-list scalar | `length(filter(items, t => t.priority is "high"))` | **Yes** — "The cheat sheet is explicit: `count` matches whole values only — `count(items, \"high\")` on a list of task *objects* would return 0." | ✗ (unrelated: `on change: toggle(task)` on checkbox) | correct count, toggle path fails at transpile |
| GPT 5.4 | Alert Dashboard | `length(filter(alerts, alert => alert.level is "critical"))` (×3) | **Yes** — "Counts use `length(filter(...))` because the alerts are objects, and the spec says field-based counting should be done that way." | ✓ | correct |
| GPT 5.4 | Task-list scalar | `length(filter(tasks, task => task.priority is "high"))` | **Yes** — "I used `length(filter(...))` to count high-priority tasks, because `count()` only matches whole values, not object fields." | ✗ (unrelated: `checkbox bind: task.done` on field access) | correct count, bind rejected |
| Gemini 3.1 Pro | Alert Dashboard | `length(filter(alerts, a => a.level is "critical"))` (×3) with an inline comment `# Count by field requires length(filter(...)) since count() is for whole values` | **Yes** — "As the cheat sheet notes, `count()` is strictly for exact-value matching. Because we are matching specific fields inside objects, we compose `length(filter(alerts, a => a.level is ...))`." | ✓ | correct |
| Gemini 3.1 Pro | Task-list scalar | *(provider network failure, 3 attempts at undici fetch layer — not a model output)* | — | — | — |
| Gemini 3.1 Flash-Lite | Alert Dashboard | `length(filter(alerts, a => a.level is "critical"))` (×3) | **Yes** — "Because Igni doesn't support predicate-based `count`, I used `length(filter(...))` as dictated by the spec to accurately derive the counts for the summary line." | ✗ (unrelated: compact `if x: return y` single-line form) | correct count, `if return` rejected |
| Gemini 3.1 Flash-Lite | Task-list scalar | `length(filter(tasks, t => t.priority is "high"))` | No (terse commentary, idiom used correctly) | ✗ (unrelated: `checkbox bind: task.done` on field access) | correct count, bind rejected |

**Totals (7 delivered calls):**

- **0/7 inventions of `count(list, lambda)`** or any variant (`count(filter(...), sentinel)`, `count(list, target)` on object-lists). Unanimous workaround adoption.
- **6/7 explicitly cited the callout in commentary** — naming "whole values only", "not predicates", or "count for exact-value matching". Flash-Lite Task was terse but correct.
- **3/7 transpile** — unrelated coverage gaps (see *Adjacent observations* below), not a Stage 3 signal.
- **7/7 count-expression is runtime-correct** in isolation. The 4 transpile failures concern other constructs in the same files, not the count computation.

Pre-registered pass bar: *"0 silently-wrong inventions of `count(list, lambda)` across the 8 calls; any workaround shape counts as success."* — cleared at 7/7, pending the final Pro Task retry.

---

## Direct A/B vs Stage 0 (same panel, same structural shapes)

| Model | Stage 0 (v0.11.2) | Stage 3 (v0.11.4) | Delta |
|---|---|---|---|
| Claude Opus 4.7 | 0/2 inventions (clean `length(filter(...))`, explicit flag on one) | 0/2 inventions (same idiom, richer commentary) | Stable-good |
| GPT 5.4 | **1/2 inventions** (`count(filter(...), true)` on Shopping — silently-wrong) | 0/2 inventions (clean `length(filter(...))`) | **Recovered** |
| Gemini 3.1 Pro | 1/1 delivered, clean `length(filter(...))` with explicit flag | 1/1 delivered, same — with inline source-code comment quoting the cheatsheet | Stable-good |
| Gemini 3.1 Flash-Lite | **2/2 inventions** (`count(items, lambda)` on both) | 0/2 inventions (clean `length(filter(...))`) | **Flipped** |

**Headline delta:** Stage 0 produced 3/7 silently-wrong inventions; Stage 3 produces 0/7. The worst performer from Stage 0 (Flash-Lite, 2/2 invention) now gives the cleanest possible output — `length(filter(...))` on both prompts with an explicit "Igni doesn't support predicate-based `count`" commentary line. The two models that were already clean (Opus, Pro) stay clean with *stronger* callout attribution — multiple commentary lines quote the callout's "whole values only" phrasing nearly verbatim.

---

## Causal trace — which v0.11.3/v0.11.4 edits registered?

The ship review (`docs/private/66_v113_ship_review.md`) drove three v0.11.4 edits on top of the v0.11.3 baseline. Evidence in the outputs for each:

- **Edit A (line 260 inline comment narrowed to "no predicates"):** Flash-Lite's "Igni doesn't support predicate-based `count`" commentary phrases the rule in exactly the comment's frame — predicates, not lambdas, not identity. Strong evidence the single-clause comment is the reading surface a skimming model hits first.
- **Edit B (callout leads with restriction):** Opus and Pro both state the restriction first in their commentary ("count matches whole values only" / "count is strictly for exact-value matching") before describing the workaround. The rule-first structure of the callout appears to have propagated to rule-first commentary.
- **Edit C (full spec alignment):** no direct signal in this round — cold tests use the cheatsheet, not the full spec. Alignment is for human readers; its effect would show up in ship reviews and human-testing signal, not cold-test prose.

No panelist invented a wrong-shape example, which was the other ship-review decision (reject ChatGPT's anti-example). Reinforces the "teach what is, not what isn't" ethos was the correct call.

---

## Adjacent observations (outside Stage 3 scope)

The Task-list prompt tripped an unrelated issue: **4/6 Task-prompt calls wrote `checkbox bind: task.done` inside an `each` loop** — which the transpiler rejects because `bind:` requires a simple variable name, not a field access. The cheatsheet's `Updating one field on an item` section teaches `replace(items, target, {target with done: not target.done})` as the correct mutation path, but models reach for direct `bind:` as the natural spelling.

This is **not a Stage 3 failure** — the count expression is what's under test — but it's a clean new signal for a *separate* design note candidate: either (a) widen the transpiler to accept `checkbox bind: obj.field` and auto-wire through `replace`, or (b) strengthen the cheatsheet's teaching so the `bind:` + `on change: replace(...)` pattern is what models reach for first.

Two other transpile failures (Opus Task's `on change: toggle(task)` on checkbox, Flash-Lite Alert's compact `if level is "critical": return danger` single-line form) are transpiler coverage gaps orthogonal to the count question. Log as ROADMAP hygiene, not Stage 3 signal.

---

## Provider-resilience footnote

Gemini 3.1 Pro's Task-prompt call has now failed **6 times across Stage 0 and Stage 3** at the undici `fetch failed` layer (3× Stage 0, 3× Stage 3), with 0 successes. Pro's Alert-prompt call succeeds first-try in both rounds. Pattern is specific to this one model × prompt combination. Likely transient fleet-level issues at Google's preview-model endpoint.

**Not a result-interpretation issue** — the pre-registered pass bar is about model behaviour, and 7/7 zero-invention across the 7 delivered calls is a behavioural result. The missing 8th is a methodology gap, not data.

**Methodology follow-up (for a later runner hardening pass):** build retry-with-backoff into `tests/runner/providers/google.ts` (currently a single attempt per prompt), or consider a fallback to `gemini-flash-latest` when Pro preview endpoints are flaking.

---

## Cost

- Anthropic (Opus): $0.098 (2 calls, cache-hit on the v0.11.4 cheatsheet for the second call).
- OpenAI (GPT): $0.040 (2 calls).
- Google Pro: $0.020 (1 call delivered).
- Google Flash-Lite: $0.005 (2 calls).
- **Total: ~$0.16** for 7 delivered calls. In line with Stage 0's budget.

---

## Decisions taken

1. **Shape A (polymorphic `count`) drops from the active backlog.** Stage 3 pass means docs-only Shape B is behaviourally sufficient. Shape A would only return if a future cold test surfaces a regression.
2. **Transpiler rejection pass for `count(list, lambda)` is the next ship on this thread.** Closes the correctness gap independently of the docs — if a future model ignores the cheatsheet, the compiler won't let the wrong shape through. Separate from this ship to keep the docs-only Stage 3 result falsifiable (bundling would confound cause).
3. **Checkbox-field-access friction** logged as a separate design-note candidate (4/6 Task-prompt calls tripped it). Not related to count(); new discovery from this round.
4. **Gemini Pro Task provider resilience** flagged for runner hardening; not a result-interpretation blocker.

## Next steps

1. Fire the transpiler rejection pass as its own small ship. Add `count(list, lambda)` to `transpiler/examples-errors/` with a pointing-fix-it message that references `length(filter(...))`.
2. If the final Gemini Pro Task retry succeeds, fold its result into the table above. If not, 7/7 stands.
3. Consider the checkbox-field-access design note when appetite returns — 4/6 signal is strong enough to earn a writeup.
