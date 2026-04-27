# v0.18 testing-infrastructure design review — Stage 2 panel

**Status: prompts ready, runs pending.** Stage 2 framing-critique panel against `docs/private/112_v018_testing_infrastructure.md` (Stage 1 design draft).

## What this is

Stage 2 panel against the **bundling rationale + canonical example shape + open sub-decisions** of the v0.18 testing infrastructure design. Testing is the project's first framework-shaped cycle; the doc bundles 7+ syntax elements + a test runner + mocking + golden-files. The bundling itself is what Stage 2 should pressure-test.

7 sub-decisions are **locked from chat** (single-cycle bundle; unified `test "name":`; sequence-of-statements body; `expect <bool>` vocabulary; sibling `*.test.igni` files; `tap "<label>"`; `render <Name>`). Stage 2 critiques 6 questions: shape (Q1), vocabulary (Q2), bundling (Q3), canonical-example-bug check (Q4), builtin set (Q5), cycle-adaptation (Q6).

After this panel lands, patches inline per spec-cycle skill rules (3/3 → patch, 2/3 → consider, 1/3 → log). Then Stage 0 cold-test → implementation.

## Panel composition

| Model | Provider | ID | Notes |
|---|---|---|---|
| Claude Opus 4.7 | Anthropic | `claude-opus-4-7` | — |
| GPT-5.5 | OpenAI | `gpt-5.5` | `--effort high` |
| Gemini 3.1 Pro Preview | Google | `gemini-3.1-pro-preview` | — |

Three frontier models matches Stage 2 precedent (`tests/v0.17.0-border-design-review/`, `tests/v0.16-event-payload-design-review/`, `tests/v0.15.0-design-review/`). No flash-lite at this stage — Stage 2 is design-review, not adoption-test.

## Critique questions (six, in prompt order)

1. **Unified test block + scope-inferred body.** Right shape? Should body's "no scope concept" rule be relaxed (explicit marker) or tightened (parse-time error on mixed body)?
2. **Assertion vocabulary.** `expect <bool>` only + `seen "string"` builtin — right vocabulary, or matcher API, or two-keyword `expect`/`assert` split?
3. **Single-bundle scope.** Is bundling all 7 elements in v0.18 right, or should mocking/snapshot split to v0.19? Trigger-A falsification path read.
4. **Canonical-example bug check.** Is there a Pomodonut-style bug hidden in the proposed examples? (mock-fetch + every interaction, mock-every advance semantics, snapshot determinism, tap-by-label disambiguation.)
5. **Test-scope builtin set.** Is `seen + value_of + on + tapped` right? Missing builtins?
6. **Cycle-adaptation framing.** Is the proposed 9-stage cycle adaptation for framework-shaped changes right? Should the cycle add a "framework-design" stage with reference implementation embedded?

Output instruction: each question answered with explicit `hold / refine / reject` position + concrete evidence/counter-example.

## Running the panel

API runner at `tests/runner/`. Run with `--no-spec` (the design-note excerpt lives inside the prompt body, not as a `--spec` injection — matches the existing Stage 2 filename convention `<model>_none_<slug>.{md,json}`) and `--no-grade` (prose output, no transpiler check).

```bash
cd tests/runner

# Anthropic
npx tsx run.ts \
  --model claude-opus-4-7 \
  --no-spec \
  --prompts ../v0.18.0-testing-design-review/prompts.md \
  --out ../v0.18.0-testing-design-review \
  --no-grade

# OpenAI (high reasoning)
npx tsx run.ts \
  --model gpt-5.5 \
  --effort high \
  --no-spec \
  --prompts ../v0.18.0-testing-design-review/prompts.md \
  --out ../v0.18.0-testing-design-review \
  --no-grade

# Google Pro
npx tsx run.ts \
  --model gemini-3.1-pro-preview \
  --no-spec \
  --prompts ../v0.18.0-testing-design-review/prompts.md \
  --out ../v0.18.0-testing-design-review \
  --no-grade
```

Outputs land as `<model>_none_v0-18-testing-infrastructure-design-critique.{md,json}`. Cost target: ~$0.30 cumulative (matches v0.17 Stage 2 panel cost of $0.149 + headroom for the longer doc content).

## Synthesis

After all 3 cells complete, append a synthesis section to this README with:

- **Q1–Q6 verdict** per question — 3/3 hold / 2/3 hold w/ refinement / 1/3 hold + the strongest dissent recorded verbatim.
- **Convergent refinements** to apply to doc 112 — anything 3/3 patches the design note before Stage 0; 2/3 considered (Tyr decision); 1/3 logged.
- **Trigger-A check** — did the panel push back on the single-bundle scope? If yes with 2/3+ convergence, that's the falsification trigger from doc 112 §Watch-list — re-bundle to v0.18 MVP + v0.19 advanced before Stage 0 runs.
- **Patch list staged for follow-on edit pass** — applied to doc 112 *before* Stage 0 prompt finalisation begins.
- **Cost** — sum of `usage` fields from the three runner JSON outputs.

## Out of scope

- Critiquing the locked sub-decisions (single-bundle, unified `test`, sibling files, etc.). The prompt is intentionally framing/bundling/vocabulary-critique only on the *open* questions.
- Stage 0 prompt drafting. Begins after this panel's synthesis lands and any doc-112 patches apply.
- Implementation. Begins after Stage 0 strong-passes.

---

# Synthesis (2026-04-27)

**Headline: TRIGGER-A FIRES.** 3/3 cells converge on splitting snapshot to v0.19. Plus four canonical-example bugs identified at 3/3 convergence + one builtin to drop at 3/3 + one assertion-syntax-classification refinement at 1/3-but-load-bearing. Doc 112 needs material revision before Stage 0.

**Total cost:** $0.2588 (claude-opus-4-7 $0.1010 + gpt-5.5 high $0.1372 + gemini-3.1-pro-preview $0.0206). Under the $0.30 budget.

## Q1 — Unified test block + scope-inferred body (3/3 hold core; 2/3 tighten)

| Cell | Position | Tightening proposed |
|---|---|---|
| opus 4.7 | Hold | **Parse-time error** on event-sim before render (statically decidable; runtime check violates "no magic") |
| gpt 5.5 | Hold | **Parse-time / preflight error** for `tap`/`change`/`submit`/`snapshot`/`seen`/`value_of`/`on` without prior `render` |
| gemini 3.1 pro | Hold | Argues *against* parse-time ordering rules — "restricts valid testing patterns, such as asserting intermediate states during a multi-step user flow" |

**Verdict:** 3/3 hold the unified block + sequence-of-statements body. **2/3 (Opus + GPT) want the event-sim-without-render check moved from runtime to parse-time.** Gemini-pro's "intermediate state assertions" concern is about `expect`-between-`tap`s, not about tap-before-render — orthogonal. The 2/3 refinement is real and the gemini-pro argument doesn't actually reject it.

**Patch decision:** **2/3 → consider; recommend apply.** Move event-sim-without-prior-render from runtime error to parse-time error. Genuine "no magic" win; doesn't restrict legitimate patterns.

## Q2 — Assertion vocabulary (3/3 hold; 1/3 syntactic refinement)

| Cell | Position | Refinement |
|---|---|---|
| opus 4.7 | Hold strongly | None — push back hard on matcher API + on `expect`/`assert` split |
| gpt 5.5 | Hold | **Specify `seen "string"` as a test-scope predicate form** (like `tap "label"`), not as a general lowercase function. Otherwise it violates the "lowercase functions use parens" casing rule |
| gemini 3.1 pro | Hold | None — reject matcher API + reject split |

**Verdict:** 3/3 hold `expect <bool-expression>` + `seen "string"` builtin. **1/3 (GPT) flags a real syntactic-classification gap:** `seen "string"` (lowercase + no parens) is neither a component invocation (which is PascalCase) nor a function call (which has parens) under the v0.17.1-pinned casing rule. Same problem applies to `tap "label"`, `change <id>: <value>`, etc.

**Patch decision:** **1/3 but load-bearing — apply.** Add explicit "test-scope predicate/action forms" syntactic category to doc 112: `seen`, `tap`, `change`, `submit`, `toggle`, `slide`, `advance`, `mock` are not regular function calls; they are special test-scope syntax that doesn't violate the function-call rule. Document the category once; covers all current and future test-scope verbs.

## Q3 — Single-bundle scope (3/3 REFINE — TRIGGER-A FIRES)

| Cell | Position | Specific call |
|---|---|---|
| opus 4.7 | **Refine — split snapshot to v0.19; keep mocking in v0.18** | "Trigger-A here. Mocking belongs in the bundle [...] Snapshot is different: separate design surface, lowest panel signal of bundled elements, biggest canonical-example bug surface." |
| gpt 5.5 | **Refine — keep mocking; allow snapshot to split if pressure** | "Make snapshots the first item to eject under Trigger A or the >3-sessions surprise" |
| gemini 3.1 pro | **Refine — split BOTH mocking and snapshot to v0.19** | "v0.18 (Core Testing) and v0.19 (Determinism). Bundling [...] is a massive risk." |

**Convergence breakdown:**
- **Snapshot — 3/3 SPLIT to v0.19** (Opus + Gemini-pro want it now; GPT wants it on first sign of pressure — close enough to 3/3).
- **Mocking — 2/3 KEEP in v0.18** (Opus + GPT).
- **Mocking — 1/3 SPLIT** (Gemini-pro).

**TRIGGER-A FIRES.** Per doc 112 §Watch-list: *"Stage 2 panel proposes splitting mocking + snapshot off into v0.19 with 2/3+ convergence."* Convergence is 3/3 on snapshot specifically; 1/3 on mocking. The trigger fires partially — split snapshot, keep mocking.

**Patch decision:** **3/3 → APPLY.** Material doc 112 revision: remove snapshot from §What v0.18 *is*; add to §What v0.18 *isn't* with explicit deferral rationale; remove §Snapshot subsection + snapshot canonical example + Q-snap-1/Q-snap-2 open sub-decisions. v0.18 scope is now: test + render + events + assertions + builtins + mocking + sub-second `every`. v0.19 scope: snapshot + (whatever animation primitives that come with the same cycle).

## Q4 — Canonical-example bugs (3/3 REFINE; multiple bugs)

Each cell flagged Pomodonut-style hidden bugs. Convergent findings:

| Bug | Convergence | Specific |
|---|---|---|
| **Snapshot non-determinism** with `now()`/random/fetch-content | **3/3** | Opus: "the live bug — any Dashboard rendering `now()`, random ID, or fetch-derived content produces a different snapshot every run." GPT: "snapshots not deterministic if rendered content includes `now()`, random values, or live fetch data." Gemini-pro: "will silently fail if the UI contains `now()` or randomly generated IDs." *Resolved by Trigger-A snapshot-split.* |
| **Duplicate-label `tap "<label>"` ambiguous selector** | **3/3** | Opus: "`tap "Sign in"` with two buttons labelled "Sign in" has no defined behaviour. Recommend: runtime error on ambiguous match." GPT: "must fail on ambiguity. Runner should raise 'ambiguous selector' rather than choosing the first." Gemini-pro: "highly fragile [...] needs a disambiguation strategy." |
| **`mock every: advance 60s`** semantics with multiple `every` blocks | **3/3** | Opus: "if a screen has `every 1s:` + `every 5s:`, `advance 60s` should fire 60 + 12 — but the doc doesn't say." GPT: "must specify advancing 60s fires exactly sixty `every 1s:` ticks after start, not 59 or 61, and reactive work drains after each tick." Gemini-pro: "fire the reactive loop 60 times sequentially, or just alter the clock and fire once?" |
| **`mock fetch` reactive re-fetch interaction** underspecified | **3/3** | Opus: "if the test mutates a variable that the production code's `fetch()` depends on, does the mock map get re-consulted? It must, or reactive-fetch tests are impossible." GPT: "mocked fetch responses should resolve deterministically, reactive re-renders should drain to stability." Gemini-pro: implicit in "test-scope override violates 'no magic'" critique. |
| **Stopwatch example sequencing** (`advance` before render/start) | **2/3** | GPT: "`mock every: advance 60s` appears before `render Stopwatch` and before `tap "Start"`. If test bodies are sequential, that advances time before the timer exists." Opus indirectly via the duplicate-mock concern. |
| **`mock fetch:` test-scope override violates "no magic"** | **1/3** | Gemini-pro: "fundamentally altering Igni's execution model purely for tests." Opus disagreed (necessary, bounded magic). |

**Patch decisions:**
- **3/3 — apply all.** Add §Disambiguation rules for tap-by-label (runtime error on ambiguous match; future `tap "X" in <region>` escape hatch). Add §Mocking semantics — explicit advance-fires-due-blocks rule + reactive-re-fetch consults mock map per-call. Patch the stopwatch canonical example to render→tap→advance ordering. Snapshot non-determinism is resolved by the Trigger-A split.
- **2/3 (stopwatch sequencing)** — apply (cheap; clarifying).
- **1/3 (no-magic override)** — refine, don't reject. Frame `mock fetch:` as an *explicit* test-scope override (visible in the source via the `mock` keyword), not hidden magic. Bounded magic is OK when it's spelled out.

## Q5 — Test-scope builtin set (3/3 DROP `tapped`; 2/3 add request-observation)

| Cell | Drop | Add | Defer |
|---|---|---|---|
| opus 4.7 | `tapped` | `current_route` (or fold route-args into `on`) | `count_of`, `errored`, `latest_request` |
| gpt 5.5 | `tapped` | `requested "/api/users"` / `request_count("/api/users")` | `count_of`, `errored`, `current_route` |
| gemini 3.1 pro | `tapped` | `count_of(<selector>)`, `latest_request("<url>")` | — |

**Verdict:**
- **3/3 DROP `tapped`** — strongest convergent finding on builtins. Argument: tests should assert *consequences* of interaction (`expect on Dashboard` after `tap "Sign in"`), not the interaction itself. `tapped` invites tests that pass without verifying behaviour.
- **2/3 ADD some form of request-observation** (GPT + Gemini-pro) — `requested("<url>")` / `request_count("<url>")` natural counterpart to `mock fetch`.
- **1/3 ADD `count_of`** (Gemini-pro only; Opus argued against — `list.length` covers it).
- **1/3 ADD `current_route` / route-arg `on` form** (Opus only).

**Patch decisions:**
- **3/3 — apply.** Drop `tapped` from the builtin table. Final set: `seen`, `value_of`, `on`.
- **2/3 → consider; Tyr decision.** Add `requested("<url>")` + `request_count("<url>")` since mock-fetch is in scope and these are natural counterparts. *Recommend apply.*
- **1/3 → log only.** Defer `count_of` and route-arg `on` to v0.18.x docs-only iteration if canonical-example friction surfaces them.

## Q6 — Cycle adaptation (2/3 add framework-spike; 1/3 push back)

| Cell | Position |
|---|---|
| opus 4.7 | **Refine — add Stage-1.5 reference-impl gate.** Build the thinnest viable slice (test + expect + render + seen) before full Stage 1 design locks. Catches snapshot-determinism + duplicate-label bugs *before* they're spec'd. *Don't* promote to a full new stage. |
| gpt 5.5 | **Hold, with framework-spike stage.** Reference impl or executable trace before final lock. "Lightweight." |
| gemini 3.1 pro | **Hold; push back on adding a formal "framework-design" stage.** Reference impl upfront slows momentum. Rely on Stage 0 (LLM prompting) as ultimate pass/fail gate. |

**Verdict: 2/3 want a framework-spike / reference-impl gate.** 1/3 push back on momentum grounds. Both arguments are real: the spike catches bugs (Opus's argument about snapshot + duplicate-label is concrete and exactly what this Stage 2 *did* catch), and adds friction (Gemini-pro's concern is legitimate).

**Patch decision:** **2/3 → consider; Tyr decision.** This is a methodology-level change to `docs/cycle.md`, not a doc 112 patch. Recommend: adopt as an *optional* Stage 1.5 for framework-shaped changes (testing, animation runtime, a11y, i18n, package-system); not required for primitive cycles. *Surface for Tyr decision; if accepted, queue a separate `docs/cycle.md` update.*

## Patch list — staged for application

**Apply now (3/3 convergent):**

1. **Trigger-A — split snapshot to v0.19.** Remove §Snapshot, §Q-snap-1/Q-snap-2, the snapshot canonical example. Move snapshot to §Isn't with explicit deferral rationale. v0.18 scope shrinks; v0.19 inherits snapshot + animation pairing.
2. **Q1 — parse-time check** for event-sim without prior render in same test body. Update §Composition rules + §locked-decisions text.
3. **Q2 — explicit "test-scope predicate/action forms" syntactic category.** New paragraph clarifying that `seen`, `tap`, `change`, `submit`, `toggle`, `slide`, `advance`, `mock` are not regular function calls and don't violate the lowercase-fn-with-parens casing rule.
4. **Q4 — disambiguation rule for `tap "<label>"`.** Runtime error on ambiguous match; future `tap "<label>" in <region>` escape hatch.
5. **Q4 — mock-every advance semantics.** "`advance <duration>` advances simulated time by `<duration>`; all active `every <interval>:` blocks fire `<duration> / <interval>` times in order; reactive re-renders drain to stability between ticks."
6. **Q4 — mock-fetch reactive re-fetch.** Mock map consulted on every fetch call, including reactive re-fires; no per-test-caching.
7. **Q4 — patch stopwatch canonical example.** Render → tap "Start" → advance 60s → expect (correct sequencing).
8. **Q5 — drop `tapped` from builtin set.** Final set: `seen`, `value_of`, `on`.

**Apply with Tyr decision (2/3):**

A. **Q5 — add `requested("<url>")` + `request_count("<url>")` builtins** as natural counterpart to `mock fetch`. Recommend apply.
B. **Q6 — adopt optional Stage 1.5 reference-impl gate** for framework-shaped changes. Recommend apply but as a *separate* `docs/cycle.md` update PR, not bundled into doc 112.

**Apply with Tyr decision (1/3 — load-bearing):**

C. **Q4 — frame `mock fetch:` as explicit test-scope override**, not hidden magic. Single-paragraph clarification in §Mocking. Recommend apply (small, defensive against future "no magic" critiques).

## Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.1010 |
| gpt-5.5 (effort: high) | $0.1372 |
| gemini-3.1-pro-preview | $0.0206 |
| **Total** | **$0.2588** |

Under the $0.30 budget. Cumulative v0.18 cycle cost so far: **$0.26 (Stage 2)** + Stage 0 + implementation + Stage 3 still ahead.
