# v0.19 animation + snapshot — Stage 0 cold-test

**Status: panel complete; synthesis below.** Pre-implementation cold test for the v0.19 animation + snapshot bundle (post-Stage-2 + Tyr-ratified per `docs/private/113_v019_animation_snapshot.md`).

## What this is

Stage 0 measures whether the cheatsheet *teaches* the new v0.19 primitives well enough that frontier models reach for the canonical syntax when asked to build screens + tests using them. Adapted per doc 112 §Framework-shaped: each prompt provides a screen and asks the panel to build production source + tests using the new primitives.

The cheatsheet draft at `cheatsheet-draft.md` is the v0.18.0-shipped cheatsheet with two additions covering the post-Stage-2 locked surface (8 patches inlined):

- New **`## Animation`** section (~70 lines): `transition: <token>` on conditional renders, `spring(value)` declarative value-animation, with the Q3-tighten compiler-rejection rule + Q4a row-keying inside `each` + Q2-a11y reduced-motion at codegen.
- Additions to **`## Testing`**: `snapshot "<name>"` (text-tree only — Q3 lock), `mock now:` (ambient-scope) + `freeze_time:` (block-scope — Q6 scoping), Q4b advance-moves-both-clocks semantic, Q4c snapshot-captures-target semantic, Q5-serializer scope (snapshot includes chrome + transition/spring state).
- Title bumped to "Igni v0.19.0 — Cheat Sheet (Stage 0 draft)".

## Panel composition

| Model | Provider | ID | Notes |
|---|---|---|---|
| Claude Opus 4.7 | Anthropic | `claude-opus-4-7` | — |
| GPT-5.5 | OpenAI | `gpt-5.5` | — (no `--effort` flag) |
| Gemini 3.1 Pro Preview | Google | `gemini-3.1-pro-preview` | — |

Three frontier models per Stage 0 precedent. No flash-lite — Stage 0 is adoption-test against capable readers.

## Prompts (three, in prompt order)

- **P1 — Login screen with fade-between-states + a snapshot test.** Tests Q1 split (transition: on swap), Q5 token-only, Q3 snapshot, Q5-serializer scope, Q3-tighten boundary (panel shouldn't reach for `transition:` on a value).
- **P2 — StepCounter with spring-animated display + a settle-after-advance test.** Test 1 (primary) tests Q2 `spring(value)` + Q4b advance-moves-both-clocks. Test 2 (secondary) tests Q4 + Q6 — `mock now:` / `freeze_time:` for `now()`-derived snapshot determinism. Spring is the higher-stakes question per Tyr 2026-04-28 caveat.
- **P3 — Notifications list with per-row spring + reorder snapshot.** Tests Q4a row-keying (load-bearing — `each` over items not indices), Q4c snapshot-captures-target (snapshot of reordered list still tracks each row's target value), Q5-serializer scope.

## Pre-registered ship bar

- **Strong:** 3/3 P1 + 3/3 P2 reach for the canonical syntax — `transition: <token>` on conditional render (P1), `spring(value)` declarative on a value (P2 Test 1, primary), `snapshot "<name>"` / `mock every: advance` test-scope verbs as taught. ≥2/3 P3 use spring inside `each` correctly (row-keyed; `snapshot` of the list captures target values, not intermediate frames). P2 Test 2 (`mock now:` / `freeze_time:` for `now()`-derived snapshot) is **secondary signal** — convergence informs the time-mock teaching strength but does not gate Strong.
- **Soft:** 2/3 P1 + P2 Test 1 — patch the cheatsheet draft, re-run.
- **Fail:** ≤1/3 P1 — design wrong, reopen Q1 / Q2 / Q3 sub-decisions in doc 113.

Run with `--no-grade`. v0.19 transpiler hasn't shipped yet; auto-grade would falsely fail every output.

## Running the panel

API runner at `tests/runner/`. Three parallel invocations:

```bash
cd tests/runner
npx tsx run.ts --model claude-opus-4-7 --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage0/prompts.md --out ../v0.19-stage0 --no-grade
npx tsx run.ts --model gpt-5.5 --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage0/prompts.md --out ../v0.19-stage0 --no-grade
npx tsx run.ts --model gemini-3.1-pro-preview --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage0/prompts.md --out ../v0.19-stage0 --no-grade
```

9 outputs total when complete (`<model>_cheatsheet_<slug>.{md,json}` × 3 prompts × 3 models).

## Out of scope

- Critiquing the locked sub-decisions Q1–Q5 (Stage 2 already ratified them at 3/3 HOLD).
- Implementation. Begins after this Stage 0's strong-pass verdict + a separate session opens.

---

## Synthesis (2026-04-28)

**Headline: STRONG PASS — 3/3 canonical adoption on every prompt × every model (9/9 cells).** Strongest possible Stage 0 outcome. The pre-registered ship bar required 3/3 P1 + 3/3 P2 + ≥2/3 P3; the panel delivered 3/3 across all three prompts including the load-bearing P3 row-keying test. No cheatsheet patches needed; cycle proceeds directly to implementation. Combined with Stage 2's 3/3 HOLD on all 5 locks, the v0.19 cycle has had **zero panel pushback** on either design or teaching.

**Total cost:** $0.6314 (claude-opus-4-7 $0.106 + gpt-5.5 $0.397 + gemini-3.1-pro-preview $0.131). Above the $0.40–0.50 estimate; cause is gpt-5.5 not getting cross-prompt prompt-cache benefits the way Anthropic's prompt cache delivered for opus. Logged to trap-journal as a Stream 2 tooling candidate.

### Per-prompt adoption table

| Prompt | claude-opus-4-7 | gpt-5.5 | gemini-3.1-pro-preview | Convergence |
|---|---|---|---|---|
| P1 — Login + fade + snapshot | ✅ | ✅ | ✅ | **3/3** |
| P2 Test 1 — spring + advance + assert | ✅ | ✅ | ✅ | **3/3** |
| P2 Test 2 — `freeze_time:` snapshot | ✅ | ✅ | ✅ | **3/3** |
| P3 — per-row spring + reorder snapshot | ✅ | ✅ | ✅ | **3/3** |

All four "canonical reach" measures hit 3/3. Variations are stylistic (assertion form, defensive `freeze_time:` wrapping, screen-vs-shared scoping) — no model invented out-of-spec syntax; no model missed a load-bearing rule.

### P1 — Login + fade + snapshot (3/3 canonical)

- **All three** placed `transition: fade` on the outer `layout vertical` whose `if`/`else if`/`else` swaps. None tried `transition:` on a value (would have triggered Q3-tighten rejection). None invented a duration argument (Q5 token-only respected).
- **All three** used `mock fetch:` block-form to inject the loaded user record. URL-matching pattern varied: opus + gemini matched the full URL with the `?refresh=0` query param (cache-buster pattern); gpt used `body: {refresh: refresh}` and a clean URL — both are valid reactive-fetch shapes, just different patterns from the cheatsheet's "any variable in `fetch()` arguments triggers re-fire" rule.
- **All three** reached for `snapshot "login_loaded"`. Opus added a belt-and-braces `expect seen "Welcome, Tyr"` before the snapshot; gpt + gemini went snapshot-only.
- **Opus's notes** were the most detailed — explicitly cites Q3-tighten ("`transition:` is only valid where the dynamic child set changes") and the Q5-serializer rationale for pairing `seen` with `snapshot`.

### P2 — StepCounter + spring + advance + `mock now:` snapshot (3/3 canonical, both tests)

- **All three** declared `displayed_steps = spring(target_steps)` — Q2 lock canonically reached without prompting. The Flutter-runtime concern that Stage 2 pressure-tested doesn't surface as friction at adoption time.
- **All three** used `freeze_time:` block (the v0.19 primitive) for *both* tests rather than `mock now:` — the block-scoped form was the natural shape. `mock now:` (the ambient-scope form) wasn't reached for in any cell. **This is informational signal:** the cheatsheet teaches both, but `freeze_time:` is the more-natural canonical for these tests.
- **All three** used `tick = now()` + `every 1s:` for the "Last reset Xs ago" live timer — perfect adoption of the existing v0.18 cheatsheet's `now()` non-reactivity teaching, composed cleanly with v0.19's `freeze_time:` for snapshot determinism.
- **Test 1 assertion shape** split 2/3 vs 1/3: opus + gpt used `expect value_of(displayed_steps) is 100`; gemini used `expect seen "100"`. Both are valid against the prompt; the divergence reflects a cheatsheet ambiguity (see §Trap-journal candidates).
- **Test 2** universally wrapped the `render` + `snapshot` in `freeze_time: 2026-04-28T12:00:00Z` for deterministic timestamp UI. Q6 scoping (block-scope for `freeze_time:`) was reached for canonically.
- **Both buttons (`Add 100`, `Reset`)** rendered correctly across all three; opus + gpt + gemini all factored `reset()` as a screen-internal function (matches the v0.18 cheatsheet's Todo `add()` pattern).

### P3 — Notifications + per-row spring + reorder snapshot (3/3 canonical — load-bearing test)

- **All three** wrote `each item in <list>:` (over the items, NOT indices) — the load-bearing Q4a row-keying rule held under cold-test conditions. None of them iterated `each i in 0..notifications.length:` (which would have silently animated wrong values on reorder — the exact Pomodonut-class bug Q4a is designed to prevent).
- **All three** used `width: spring(item.recency * <constant>)` per-row — perfect Q2 + Q4a composition.
- **Snapshots-before-and-after-reorder** — all three captured both `snapshot "notifications_initial"` and `snapshot "notifications_reordered"` with `mock every: advance 1s` between, validating that Q4c (snapshot captures target) means the reordered snapshot tracks each row's *target* `recency` regardless of position.
- **Opus's P3** went above-and-beyond: added `transition: fade` on the outer list layout to animate the reorder *swap* on top of the per-row springs ("two animation primitives, two distinct jobs, no overlap" — opus's own framing). Used `shared:` block + `render Notifications, shared.notifications: [...]` for test isolation.
- **Gemini's P3** explicitly cited the Q4a + Q4c rules in inline comments: *"Igni's snapshots structurally capture the **target** value of a spring by construction"* and *"the codegen keys the spring animations by row identity"*. The cheatsheet's load-bearing teaching landed verbatim.
- **Gpt-5.5's P3** was tersest; same canonical shape, no notes. Used screen-local `notifications` rather than `shared:` (valid; opus's choice was best-in-class for test isolation but not required).

### Convergent strengths (cheatsheet teaching ratified at 3/3)

- **Q1 split** (`transition:` for swaps, `spring()` for values) — perfectly internalised. Zero out-of-boundary uses.
- **Q2 `spring(value)` declarative** — universal canonical adoption. Stage 2's pressure-test outcome held under cold-test conditions.
- **Q4a row-keying** (`each` over items, not indices) — load-bearing rule reached for by all three; gemini explicitly cited the rule.
- **Q4c snapshot captures target** — gemini cited verbatim; opus + gpt implicitly correct (snapshots both before+after reorder confirm the target-tracking semantics).
- **Q5 token-only `transition:`** — no panel cell invented a duration shape.
- **Q5-serializer scope** — opus explicit, gemini implicit (both layered chrome into the snapshot mental model).
- **Q4 freeze_time: + advance-moves-both-clocks (Q4b)** — 3/3 used the pair together with the right composition.
- **Q6 freeze_time: block-scope** — 3/3 used the block form; nobody mistook it for ambient-scope.
- **`tick = now()` + `every 1s:` for live timers** — perfect carryforward from v0.18 cheatsheet, composing cleanly with v0.19 `freeze_time:`.

### Patches not needed

No cheatsheet patches required for ship. The Stage 0 strong-pass means the cheatsheet draft (`cheatsheet-draft.md`) is the canonical-teaching version that should ship as `spec/v0.19.0-cheatsheet.md` once implementation lands.

### Trap-journal candidates

- **Cheatsheet ambiguity — `value_of()` on screen variables vs inputs only.** The §Testing builtin table says `value_of(<input-id>)` returns "an input/toggle/slider's current bound value", but the §Mocking-now spring-counter example uses `expect value_of(displayed_steps) is 100` where `displayed_steps` is a screen variable, not an input. Panel adoption split 2/3 (`value_of`) vs 1/3 (`seen`) — both valid against the example, but the rule is unclear. Worth pinning before v0.19 ship: either widen the `value_of()` definition to "any bound variable" or restrict the example to use `seen` for non-input bindings. Methodology trap: *examples that contradict the table teach the example; the table loses authority*.
- **`mock now:` (ambient-scope form) not reached for by any panel cell** — `freeze_time:` (block form) was universally chosen. Both forms are taught; the block form is more natural for the test patterns the panel produced. Indirect signal that the ambient/block scoping distinction (Q6) is a Tyr-decision-time concern, not a user-facing distinction at the cold-test level. Worth deferring deeper investigation to Stage 3 or implementation phase.
- **Stage 0 cost overrun** — $0.6314 vs $0.40–0.50 estimate. Cause: gpt-5.5 input cost = $0.40 alone (no cross-prompt prompt-cache; full 12k input × 3 prompts = ~36k input tokens billed); opus input cost = $0.10 (Anthropic prompt-cache reduced subsequent prompts to 358–582 tokens after the first). Stream 2 tooling candidate: `tests/runner/providers/openai.ts` could engage OpenAI's prompt-cache API (`cached_tokens` param) for runs that share a `--spec` across prompts.
- **"All locks held + zero patches" outcome shape** — first instance in the project's Stage 2 + Stage 0 history of a cycle clearing both panels with zero design/teaching pushback. Methodology data point: counters the implicit assumption that pre-implementation panels always find something to flip. Linked to doc 114's principled-minority-pattern catalogue (different shape: "no flips" = panel converges with the design; "principled minority" = panel converges against the design but Tyr reverses).

### Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.105 |
| gpt-5.5 | $0.397 |
| gemini-3.1-pro-preview | $0.131 |
| **Total** | **$0.631** |

Per-cell range: $0.022 (gemini smallest) to $0.137 (gpt-5.5 P1, the largest). Cumulative v0.19 cycle cost: **$0.27 (Stage 2) + $0.63 (Stage 0) = $0.90.** Benchmarks: v0.14 cycle was $1.91 cumulative; v0.19 is on track to land under that even with implementation + Stage 3 ahead.

### Decisions for Tyr

1. **Verdict ratification** — STRONG PASS as proposed (3/3 across all four canonical-reach measures)? Or revise based on the value_of() vs seen ambiguity raised in §Trap-journal candidates?
2. **Cheatsheet ambiguity patch** — fix the `value_of()` table-vs-example inconsistency before v0.19 ship, or defer to a docs-only iteration after implementation? Either is defensible; recommendation: fix at ship-time (low-effort + prevents the same ambiguity surfacing during real-app use).
3. **`mock now:` ambient-scope** — keep both forms in the cheatsheet (`mock now:` ambient + `freeze_time:` block) despite the panel reaching for only `freeze_time:`? Recommendation: keep both — `mock now:` will earn its place when test patterns that need ambient-scope (e.g. mid-test time advancement without re-block-wrapping) emerge, and removing it now would require re-adding it later.
4. **Implementation scheduling** — proceed to v0.19 transpiler implementation phase next session? 2–3 sessions estimated per doc 113 §Framework-shaped warning. Cheatsheet draft + design note are final and ship-ready; implementation just needs to catch up.
