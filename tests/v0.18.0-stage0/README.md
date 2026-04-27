# v0.18 testing infrastructure — Stage 0 cold-test

**Status: prompts ready, runs pending.** Pre-implementation cold test for the v0.18 testing infrastructure design (post-Stage-2 + Tyr-ratified per `docs/private/112_v018_testing_infrastructure.md`).

## What this is

Stage 0 measures whether the cheatsheet *teaches* the new testing primitives well enough that frontier models reach for the canonical syntax when asked to write tests for given screens. Adapted per doc 112 §Framework-shaped: prompts shift from "build an app using X" to "given screen Y, write tests for it" since testing is framework-shaped infrastructure not a single primitive.

The cheatsheet draft at `cheatsheet-draft.md` is the v0.17.1 cheatsheet with a new `## Testing` section (~135 lines) covering the post-Stage-2 locked surface area:

- `test "name":` block in sibling `*.test.igni` files
- `render <Screen>` / `render <Component>, arg: value` set-up
- Event-sim verbs (`tap "<label>"`, `change <id>: <value>`, `submit`, `toggle`, `slide`)
- Single canonical assertion form `expect <bool-expression>`
- Test-scope predicate forms note (`seen`, `tap`, etc. are special — not function calls)
- Test-scope builtins: `seen`, `value_of`, `on`, `requested`, `request_count`
- `mock fetch:` block + reactive-re-fetch semantics + explicit-test-scope-override framing
- `mock every: advance <duration>` + proportional-fire semantics
- Sub-second `every` widening (`16ms` / `100ms` / `500ms` added)
- Ambiguous-selector handling (runtime error)
- Out-of-scope deferrals (snapshot → v0.19, mock locate/now/play, property-based testing)

The §Recurrence section's durations paragraph is also updated to reflect the wider whitelist.

## Panel composition

| Model | Provider | ID | Notes |
|---|---|---|---|
| Claude Opus 4.7 | Anthropic | `claude-opus-4-7` | — |
| GPT-5.5 | OpenAI | `gpt-5.5` | `--effort high` |
| Gemini 3.1 Pro Preview | Google | `gemini-3.1-pro-preview` | — |

Three frontier models matches Stage 0 precedent. No flash-lite — Stage 0 is adoption-test against capable readers, noise-tier reserved for Stage 3 ship validation.

## Prompts (three, in prompt order)

- **P1 — Pure-function test on a screen-internal function** (`Calculator.test.igni`). Tests whether models reach for the cleanest function-test shape *given* the cheatsheet teaches it. Surfaces the open design question: how does a test access screen-internal functions? Convergent shape across panel = data for the design.
- **P2 — Empty state + interaction test on a Todo screen** (`Todo.test.igni`). Most canonical screen-test pattern — empty state assertion + event-sim + state assertion. Walls 1+2 closure from doc 112.
- **P3 — Mocked async profile screen with reactive re-fetch** (`Profile.test.igni`). Tests `mock fetch:` block-form + offline state + loaded state. Bonus prompt asks for a third test verifying refresh-triggers-new-fetch — which can use `requested("...")` / `request_count("...")` builtins (Q-G ratification) if models reach for them.

## Pre-registered ship bar

- **Strong:** 3/3 P1 + 3/3 P2 reach for canonical syntax (`test "name":`, `render`, event-sims, `expect <bool>`); ≥2/3 P3 use `mock fetch:` block-form correctly without inventing matcher API or snapshot syntax. Proceed to full v0.18 implementation.
- **Soft:** 2/3 on P1 or P2 — patch cheatsheet teaching, re-run Stage 0 against patched draft.
- **Fail:** ≤1/3 P1 — reopen the locked Q1/Q2/Q3 sub-decisions in doc 112. Unlikely given Stage 2 already locked them at 3/3.

## Running the panel

API runner at `tests/runner/`. Run with `--spec ../v0.18.0-stage0/cheatsheet-draft.md` (the draft cheatsheet is the spec for Stage 0) and `--no-grade` (transpiler doesn't yet support most v0.18 syntax beyond the spike's `test`/`render`/`expect seen`; auto-grade would falsely fail anything wider).

```bash
cd tests/runner

# Anthropic
npx tsx run.ts \
  --model claude-opus-4-7 \
  --spec ../v0.18.0-stage0/cheatsheet-draft.md \
  --prompts ../v0.18.0-stage0/prompts.md \
  --out ../v0.18.0-stage0 \
  --no-grade

# OpenAI (high reasoning)
npx tsx run.ts \
  --model gpt-5.5 \
  --effort high \
  --spec ../v0.18.0-stage0/cheatsheet-draft.md \
  --prompts ../v0.18.0-stage0/prompts.md \
  --out ../v0.18.0-stage0 \
  --no-grade

# Google Pro
npx tsx run.ts \
  --model gemini-3.1-pro-preview \
  --spec ../v0.18.0-stage0/cheatsheet-draft.md \
  --prompts ../v0.18.0-stage0/prompts.md \
  --out ../v0.18.0-stage0 \
  --no-grade
```

9 outputs total when complete (`<model>_cheatsheet_<slug>.{md,json}` × 3 prompts × 3 models). Cost target: ~$0.27.

## Synthesis

After all 9 cells complete, append a synthesis section to this README with:

- **Per-prompt adoption table** — rows = P1/P2/P3, columns = each model, cells = canonical adoption (✅) / partial (⚠️) / off-shape (❌).
- **Strongest dissent** — any cell that explicitly chose a non-canonical shape, with a one-line quote.
- **Ship-bar verdict** — strong / soft / fail.
- **Trap-journal candidates** — unexpected shapes worth logging even if ship bar passed.
- **Cheatsheet patch list** — if soft-fail, what teaching needs to make sharper before re-run.
- **P1-specific finding** — *function-test access path*: how did the panel resolve the screen-internal-function-access question? Convergent shape feeds doc 112 (potentially as a new locked sub-decision before implementation).
- **Cost summary**.

## Out of scope

- Implementation (parser additions beyond the spike, mock infra, full event-sim verbs, `igni test` CLI, full builtin set, golden-file snapshot — though snapshot is permanently out of v0.18 per Trigger-A). Begins after Stage 0 strong-passes.
- Stage 3 (post-implementation panel). Comes after implementation lands.
- v0.19 prep work (snapshot + animation primitives).

---

# Synthesis (2026-04-27)

**Headline: STRONG PASS on P2 + P3 (3/3 canonical each); SOFT FAIL on P1 (3/3 hold the test-block shape but DIVERGE 3 different ways on the function-test access path).** The P1 divergence is the most valuable Stage 0 finding — it surfaces a real design gap the cheatsheet didn't resolve, exactly the signal Stage 0 was meant to provide.

**Total cost:** $0.4620 (claude-opus-4-7 $0.1615 + gpt-5.5 high $0.2198 + gemini-3.1-pro-preview $0.0806). Over the $0.27 forecast — each prompt embeds an entire screen source, inflating input size. Still cheap; Stage 0's job is signal density, not budget compliance.

## Per-prompt adoption table

| Prompt | claude-opus-4-7 | gpt-5.5 | gemini-3.1-pro-preview |
|---|---|---|---|
| **P1 — Function-test on screen-internal `total_with_tax`** | ⚠️ render-and-assert + honest-no on second case | ⚠️ render Calculator + direct function call | ⚠️ direct function call, no render |
| **P2 — Todo empty-state + interaction** | ✅ canonical (multi-add bonus test) | ✅ canonical (multi-add bonus test) | ✅ canonical (multi-add bonus test, with prose) |
| **P3 — Profile mock-fetch + reactive re-fetch** | ✅ canonical (uses `request_count`) | ✅ canonical (uses `request_count` + new user data on refresh) | ✅ canonical (uses `requested` + new user data on refresh) |

**P2 + P3 are 3/3 strong-pass.** Every model used the same canonical syntax for both, including:

- `render <Screen>` (3/3)
- `change <id>: <value>` (3/3 — same exact shape `change draft: "buy milk"`)
- `tap "<label>"` (3/3 — `tap "Add"`, `tap "Refresh"`)
- `expect seen "<string>"` (3/3)
- `expect not seen "<string>"` (3/3 — using existing `not` operator with `seen` predicate)
- `expect value_of(<id>) is ""` (3/3 P2)
- `mock fetch:` block-form with URL-map body (3/3 P3)
- **`requested("<url>")` / `request_count("<url>")` from Q-G ratification (3/3 P3)** — the new builtins added at 2/3 panel + Tyr ratification all landed cleanly. Strong ratification signal.
- **Reactive re-fetch URL-changes-on-state-mutation** (3/3 P3) — every cell correctly mocked TWO URLs (`?refresh=0` AND `?refresh=1`) anticipating the URL change after `tap "Refresh"`. The cheatsheet's reactive-re-fetch teaching landed verbatim.

## P1 — Function-test access path: 3/3 different resolutions

Strongest signal of the run. The cheatsheet shows a pure-function test (`result = format_currency(1234.56)` without render), but the cross-screen-function-call rule from the existing language says functions defined inside one screen aren't visible to other screens. Tests live in sibling files — same access-path concern. The cheatsheet didn't resolve this; the panel diverged.

Three distinct resolutions:

**Opus (the honest-no) — render-and-assert + acknowledge the limitation.**
> "Because `total_with_tax` is defined inside `screen Calculator`, the cleanest test is to `render Calculator` first, then assert on the rendered output. Testing via the rendered label would only cover the hardcoded `100, 0.2` case ... The honest answer: **this screen isn't well-shaped for testing the function across multiple inputs.** The idiomatic fix is to lift `total_with_tax` out of the screen so tests can call it directly — but that's a refactor, not a test file."

Opus's second test inlines the arithmetic identity (`result = subtotal + subtotal * rate`) rather than calling the function. *Honest no on the function-direct-call shape.*

**GPT-5.5 (render makes function reachable) — render Calculator + direct call.**
> ```igni
> test "total_with_tax adds VAT":
>   render Calculator
>   expect total_with_tax(100, 0.2) is 120
> ```
> "Because `total_with_tax` is defined inside `Calculator`, the cleanest test is to `render Calculator` first, then assert the screen-internal function directly."

GPT *invents* the access-path rule: rendering the screen brings its functions into test-body scope. The cheatsheet doesn't say this; GPT inferred it.

**Gemini-pro (no render — pure-function-test) — direct call without render.**
> ```igni
> test "total_with_tax calculates correct amounts":
>   expect total_with_tax(100, 0.2) is 120
>   expect total_with_tax(50, 0) is 50
> ```
> "For `total_with_tax`, **the pure-function approach is the cleanest (and only viable) choice**. Because the `Calculator` layout hardcodes the `100, 0.2` invocation on its label, you cannot trigger the `(50, 0)` case via UI event-simulation."

Gemini-pro takes the cheatsheet at its word — pure-function tests work without render. But this conflicts with the cross-screen-function-call rule.

**The design decision the panel surfaced:** how do tests access screen-internal functions? Three viable answers:

- **Option A (GPT) — `render <Screen>` puts screen-internal functions in test-body scope.** Most ergonomic; one rule covers both render-tests and function-tests. Risk: it's a *de facto* exception to the cross-screen-function-call ban; needs explicit spec text.
- **Option B (Gemini-pro) — pure-function tests don't need render and access screen-internal functions directly.** Matches the cheatsheet example as written. Risk: contradicts the existing language rule about cross-screen function visibility, and there's no other path for cross-scope function visibility.
- **Option C (Opus) — pure-function tests require lifting functions out of screens.** Honest-no on the current language shape. Implies the v0.18 design is incomplete without a utility-modules concept (which is on the v0.19+ Stream 3 list). Risk: blocks v0.18 ship on a v0.19+ feature.

Pick A, B, or C — design decision before implementation. *The cheatsheet currently implies B but doesn't make it explicit, which is exactly why the panel diverged.*

## Ship-bar verdict — SOFT FAIL on P1

Per the pre-registered ship bar:

- **Strong:** 3/3 P1 + 3/3 P2 reach for canonical syntax. *Failed* — P1 is 3/3 different shapes, only one of which (Gemini-pro's) matches the cheatsheet's pure-function-test example.
- **Soft:** 2/3 P1 — patch teaching, re-run. *We're at 1/3 strict on P1 (only Gemini-pro followed the cheatsheet shape exactly).*

**Cycle-correct response:** patch the cheatsheet teaching to explicitly resolve the function-test access path, then re-run Stage 0. The patch is a design decision (A/B/C above), not a docs tweak.

**Practical caveat:** P2 + P3 are 3/3 strong, including the new builtins from Q-G ratification. The cheatsheet's testing surface is *largely* well-taught; only the function-test access path is unresolved. A targeted patch + re-run is cheap.

## Patches staged for cheatsheet (pending Tyr decision on A/B/C)

1. **Resolve function-test access path** — add explicit rule to the §Testing section. *This is the design decision Tyr needs to make.* My read: **Option A** (render-makes-function-reachable) is most ergonomic and matches GPT's natural inference. It's a documented test-scope override of the cross-screen-function-call rule, mirroring how `mock fetch:` is a documented test-scope override of reactive-fetch semantics. Both are bounded magic, source-visible at the call site (`render` puts function in scope; `mock` inverts production behaviour).

2. **Strengthen the cheatsheet's pure-function-test example** — currently shows `result = format_currency(1234.56)` without context. Add: which file does this test live in? Is `format_currency` defined inline in the test file, or imported from a screen, or both? The example needs to specify.

3. **Patch the canonical example** — replace the current pure-function-test example with one that's unambiguous about the access path (e.g. "test exercising `total_with_tax` from the `Calculator` screen — render the screen first, then call the function" if we go with Option A).

## Convergent strengths to preserve (ratifications validated)

- `requested("<url>")` + `request_count("<url>")` builtins (Q-G) — 3/3 P3 used them naturally. Ratification holds.
- Mock-fetch reactive-re-fetch semantics — 3/3 P3 mocked both URLs (`?refresh=0` AND `?refresh=1`) anticipating the URL change. Cheatsheet teaching landed.
- `expect value_of(<id>) is ""` — 3/3 P2 used to assert input-clear. Concise and clear.
- Mock-fetch block form — 3/3 P3 used (no per-call builtin alternative invented). Q-A locked at 3/3 implicitly.

## Trap-journal candidate

- **The function-test access path divergence** itself — three frontier models, three different resolutions of the same cheatsheet ambiguity. Methodology pattern: when a cheatsheet shows a syntax shape that conflicts with a load-bearing language rule, panels diverge predictably, and the divergence pattern reveals which resolution is most natural per model. Worth logging: panels are *better* at surfacing under-specified design corners than design reviews are, because each panel has to commit to *some* resolution and the variance shows the gap.

## Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.1615 |
| gpt-5.5 (effort: high) | $0.2198 |
| gemini-3.1-pro-preview | $0.0806 |
| **Total** | **$0.4620** |

Over the $0.27 budget by ~70%. Embedded-screen prompts are denser than typical Stage 0 prompts; future Stage 0 panels with embedded source code should budget ~$0.50.

Cumulative v0.18 cycle cost so far: $0.149 (Stage 2) + $0.462 (Stage 0) = **$0.611**. Implementation + Stage 3 still ahead.

## Decisions for Tyr before next step

1. **A / B / C resolution for P1's function-test access path?** Recommend Option A (render-makes-function-reachable, framed as documented test-scope override mirroring `mock fetch:`). Locks the design before implementation.
2. **Patch + re-run Stage 0, or accept soft-fail and proceed to implementation?** Re-run cost: ~$0.50 + ~5 min wallclock. Accepting soft-fail risks shipping with under-taught function-test syntax that landings will need to fix at Stage 3. *Recommend patch + re-run* — cheap insurance against a known gap.

---

# Attempt 2 Synthesis (2026-04-27, post-patch re-run)

**Headline: STRONG PASS — 3/3 canonical on P1 + P2 + P3.** Patch worked exactly as designed: the explicit "render-makes-function-reachable" Option A rule (added to cheatsheet §Testing) collapsed the 3-way P1 divergence into 3/3 unanimous canonical adoption. Methodology success: a single targeted patch resolved the soft-fail without regressing P2 or P3.

Attempt-1 outputs preserved at `attempt-1/` for the methodology trail.

## Per-prompt adoption table (attempt 2)

| Prompt | claude-opus-4-7 | gpt-5.5 | gemini-3.1-pro-preview |
|---|---|---|---|
| **P1 — Function-test access path** | ✅ canonical (`render Calculator` + `expect total_with_tax(...)`) | ✅ canonical (single test, multi-expect) | ✅ canonical (single test, with prose) |
| **P2 — Todo empty + interaction** | ✅ canonical (multi-add bonus + `items[i].text` indexing) | ✅ canonical | ✅ canonical (with explanatory prose on selectors) |
| **P3 — Profile mock-fetch + reactive re-fetch** | ✅ canonical (uses `request_count`) | ✅ canonical (uses `request_count` + new user data) | ✅ canonical (uses `requested` + new user data) |

**3/3 strong-pass on every prompt × every model.** No off-shape, no partial.

## P1 — Patch validation

The patch was a single explicit rule added to cheatsheet §Testing:

> **Function reachability — `render <Screen>` puts the screen's internal functions in test scope.** Igni's production rule "cross-screen function calls are NOT allowed" is preserved everywhere except inside test bodies, where `render` is the documented test-scope override.

All three models cited the rule in their prose explanations:

- **Opus:** "`render Calculator` mounts the screen and — per the documented test-scope override — puts `total_with_tax` in scope so the test can call it directly."
- **GPT-5.5:** "I'd use a single test with one `render Calculator` because `render` is the idiomatic test-scope override that makes the screen-internal `total_with_tax` function callable."
- **Gemini-pro:** "Igni has **one way** to test screen-internal functions: you must call `render <Screen>` first to unlock the function in test scope."

Note Gemini-pro's "one way" framing — it correctly read the patch as a design rule, not just a usage tip. The naming of "test-scope override" landed (citing the same framing as `mock fetch:`).

Both Opus and Gemini-pro chose to combine both assertions under a single render+test (the cheatsheet's `format_currency` example shape). GPT did the same, with one combined block. None split into two `test` blocks despite the prompt's hint about two separate cases — they read the cheatsheet's "render once, assert many" guidance and applied it. Opus alone justified splitting *would* be defensible (named-cases as documentation) but explicitly chose not to; GPT and Gemini-pro consolidated by default.

## P2 + P3 — No regression

Both held canonical 3/3 from attempt 1. Patch didn't disturb anything outside §Testing's function-access subsection. P3's reactive-re-fetch teaching continues to land: every model still mocks both URLs (`?refresh=0` AND `?refresh=1`) anticipating the URL-change-on-state-mutation behaviour.

Worth flagging: Gemini-pro's third P3 test asserts `expect not seen "Ada Lovelace"` after refresh, but mocks the new user as `"Ada Lovelace (Updated)"` — which contains `"Ada Lovelace"` as a substring, so this assertion is buggy regardless of how `seen` matches (substring or exact). Logical bug in the test author's reasoning, not a syntax issue. Worth a trap-journal note: `seen "X"` substring-vs-exact-match semantics are unspecified in the cheatsheet.

## Ship-bar verdict — STRONG PASS

Pre-registered bar (from this README §Pre-registered ship bar):

- **Strong:** 3/3 P1 + 3/3 P2 reach for canonical syntax; ≥2/3 P3 use `mock fetch:` block-form correctly. ✅ **Met on all three prompts.**

Proceed to full v0.18 implementation. Doc 112 patched (Q13: function-test access path locked at Option A).

## Convergent strengths preserved (no regression)

All attempt-1 ratification validations hold:

- `requested(<url>)` + `request_count(<url>)` builtins (Q-G) — 3/3 P3
- Mock-fetch reactive-re-fetch semantics — 3/3 P3
- `expect value_of(<id>) is ""` — 3/3 P2
- Mock-fetch block form — 3/3 P3
- `change <id>: <value>` event-sim — 3/3 P2
- `tap "<label>"` event-sim — 3/3 P2 + 3/3 P3
- `expect seen "<string>"` / `expect not seen "<string>"` — 3/3 P2

New attempt-2 additions:

- **Render-as-test-scope-override rule** — 3/3 P1 cite it correctly. Patch landed.
- **`render <Screen>` + multi-expect over screen-internal function** — 3/3 P1 used the consolidation pattern.

## Trap-journal candidates

1. **Patch-and-re-run methodology success.** Stage 0's first run surfaced a real design gap (function-test access path); a single targeted patch + re-run resolved it at 3/3. Worth logging as a methodology pattern: when a Stage 0 soft-fail signals "cheatsheet under-specified some corner," a one-rule cheatsheet patch is often sufficient — design changes aren't always needed. The cycle's `Soft → patch teaching, re-run` rule is empirically validated by this run.

2. **`seen "X"` substring-vs-exact match semantics unspecified.** Gemini-pro's P3 third test exhibits a logic bug that depends on this answer. Worth resolving in the cheatsheet before v0.18 implementation. Likely substring-match is more useful (matches React Testing Library's `getByText` default), but the cheatsheet should make this explicit. Add to v0.18 implementation TODO list.

## Cost summary (attempt 2)

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.07307 |
| gpt-5.5 (effort: high) | $0.22753 |
| gemini-3.1-pro-preview | $0.08102 |
| **Total** | **$0.38162** |

Slightly under attempt-1 cost ($0.462) — re-run benefits from same prompts but slightly shorter outputs (less explanatory prose needed once the rule is explicit).

Cumulative v0.18 cycle cost: $0.149 (Stage 2) + $0.462 (Stage 0 attempt 1) + $0.382 (Stage 0 attempt 2) = **$0.993**. Just under $1. Implementation + Stage 3 still ahead; comfortable on the ~Starting.85-per-spec-cycle budget norm given v0.18 is framework-shaped (more infrastructure than typical primitive cycle).

## Methodology lessons captured

- **Stage 0's job is signal density, not budget compliance.** Two runs at $0.85 found a real design gap and validated the patch. Cheaper than discovering it post-Stage-3.
- **Embedded-screen prompts are denser than typical Stage 0 prompts.** Each prompt embeds full source code, inflating input tokens by ~3x vs. "build an app from scratch" prompts. Future Stage 0 panels for framework-shaped infrastructure should budget ~$0.50 per run.
- **The framework-shaped cycle adaptation works.** Doc 112's "given screen Y, write tests" framing produced direct-comparison-quality signal across panels. The adaptation is reproducible for any future framework-shaped infrastructure (e.g. routing, theming, animation if they ever go framework-scoped).

## Next step

Proceed to v0.18 full implementation:

1. Parser additions beyond spike: `change`/`tap`/`submit`/`toggle`/`slide` event-sim verbs, `mock fetch:`/`mock every:` blocks, full builtin set (`seen`/`value_of`/`on`/`requested`/`request_count`).
2. Codegen extensions: WidgetTester integration for event sims, mock-fetch interceptor injection, mock-every fake-async stubs.
3. `igni test` CLI — discovers `*.test.igni`, transpiles to `*_test.dart`, runs `flutter test`.
4. Sub-second `every` whitelist widening (`16ms`/`100ms`/`500ms`).
5. Stage 3 ship-validation panel after implementation.

Stage 0 is closed. v0.18.0-stage0 directory archived as-is.
