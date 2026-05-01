# v0.21 Stage 3 ship-validation — persistence + reactive-fetch cancellation

**Date:** 2026-05-01.
**Method:** 4 frontier models × 3 prompts × shipped cheatsheet (`spec/v0.21.0-cheatsheet.md`, 8007 words). `--no-grade` (auto-grade against panel output introduces churn for canonical-shape variation per cycle precedent).
**Models:** `claude-opus-4-7`, `gpt-5.5-2026-04-23`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview` (noise tier).
**Sequential mode** (canonical for ship-validation reproducibility).
**Cost:** $0.9771 across 12 cells (above the $0.60-$0.80 estimate; gpt-5.5 input dominated at $0.596 = 61% of total — per-provider cache assumption broke for OpenAI; see Methodology data point #5).
**Outputs:** 12 `<model>_cheatsheet_<prompt-slug>.md` + 12 `.json` (this directory).

**Cumulative v0.21 cycle cost:** $0.35 (Stage 2) + $0.95 (Stage 0) + $0.98 (Stage 3) = **$2.28** — slightly above v0.20's $1.85 cumulative.

## Verdict — SOFT (P3 reaches soft bar; cancellation-invisibility 4/4 strong; awaiting chat-mode dual-instrument convergence before SHIP/PAUSE call)

Pre-registered ship bar:
- **Strong:** 4/4 P1 + 4/4 P2 + ≥3/4 P3
- **Soft:** 3/4 on P1 or P2 — Tier-A patch for v0.21.0 narrative or v0.21.1 docs iteration
- **Fail:** ≤2/4 P1 — reopen cheatsheet teaching; possible v0.21.x design re-open

**Result:** **4/4 P1 (canonical-shape) + 4/4 P2 (canonical + cancellation-invisibility unanimous) + 3/3 P3 visible (Pro truncated at MAX_TOKENS).** Two minor cheatsheet teaching gaps surfaced (Tier-A docs patches, neither a design issue).

| Dimension | Result | Notes |
|---|---|---|
| P1 canonical reach | **4/4** | All cells reached `shared persisted:` annotated-block + JSON-literal defaults + `shared.theme_mode` selector + `theme dark:` variant. Three-radio shape produced canonically (3/4 via extracted component, 1/4 via `each` loop). |
| P2 canonical reach | **4/4** | All cells reached trigger-variable pattern for input + slider-direct-into-URL + 3-state branching. **Cancellation invisibility unanimous** — 4/4 cells explicitly cited v0.21 cancellation rule in their reasoning (predicted 4/4 zero-manual-cancellation; observed 4/4 + 4/4 explicit-cite). |
| P3 canonical reach (visible) | **3/3 visible** | All visible cells (Opus + GPT + Flash-lite) used `shared persisted:` for the durable surface; canonical mutation pattern with state branching; cross-screen append via `shared.notes = shared.notes + [note]`. **Pro truncated at MAX_TOKENS = 328 output tokens** — third instance of the Pro truncation pattern (now formal heuristic per cycle skill). |
| P1 cheatsheet teaching gap (Flash-lite) | observation | Flash-lite read `shared persisted:` as relaxing the input-bind exception ("since `shared persisted:` variables are directly mutable, `input bind: shared.sender_name` is the most direct way to handle this in v0.21"). Same misread reproduced on P3 (n=2 within this panel for same model). v0.21.1 docs-iteration candidate. |
| P3 cheatsheet teaching gap (Opus) | observation | Opus invented `shared.update(notes = shared.notes + [...])` named-arg form for batched updates — the cheatsheet teaches `shared.X = value` direct (auto-wrap in update). Single-cell instance. v0.21.1 docs-iteration candidate. |

This is **soft (not strong)** because P3 visible-canonical-on-all-dimensions count is 1/3 (only GPT fully canonical; Opus's `shared.update(named)` syntax invention + Flash-lite's `input bind: shared.X` misread reduce the strict count). However, on the looser pre-reg dimension ("≥3/4 P3 use `shared persisted:` for the durable surface"), the bar is met (3/3 visible reach for the persisted block). Tier-A patches go to v0.21.1 docs-iteration; **no design-level reopen**.

**Cross-instrument SHIP decision deferred** to post-chat-mode synthesis — this is the first dual-instrument Stage 3 ship-validation per `tests/v0.21-stage3-chat-mode/README.md`. If chat-mode reaches strong on the same load-bearing dimensions, the API soft observations become candidate-Tier-A-patches (ship with docs iteration); if chat-mode also reaches soft on the same observations, those gaps are real and v0.21.1 docs-iteration is gated; if chat-mode produces stronger-canonical without the input-bind/update gaps, those are harness-specific and don't gate ship. Synthesis at `docs/private/130_v021_stage3_dual_instrument.md` post-both-instruments.

## Convergence by prompt

### P1 — Theme + sender-name settings with persisted preferences (4/4 canonical, 3/4 strict-canonical)

| Cell | shared persisted: block | JSON-literal defaults | shared.theme_mode active selector | Theme + dark variants | Radio shape |
|---|---|---|---|---|---|
| Opus | ✓ | ✓ (`"system"`, `""`) | ✓ | ✓ (auto-fall-back of `brand` documented) | extracted ThemeOption component |
| GPT | ✓ | ✓ | ✓ | ✓ (over-declared scaffold/appbar in dark — not a fall-back issue, just verbose) | extracted ThemeModeOption with emit |
| Gemini Pro | ✓ | ✓ | ✓ | ✓ (explicit auto-fall-back comment) | extracted ThemeOption component |
| Flash-lite | ✓ | ✓ | ✓ | ✓ | `each mode in ["system", "light", "dark"]` loop |

**4/4 cells reached `shared persisted:` annotated-block** — Stage 2's Q2 FLIP from Option A wrapper-builtin held cleanly post-implementation. **Zero `persist(initial)` wrapper-builtin leak** across all 4 cells (predicted; observed). 4/4 used JSON-literal defaults. 4/4 used `shared.theme_mode` as the canonical theme-active selector (per v0.20 dark-mode rule, unchanged in v0.21).

**Flash-lite teaching-gap observation (load-bearing for v0.21.1 docs iteration, NOT load-bearing for ship decision):** Flash-lite reached for `input bind: shared.sender_name` directly with the explicit reasoning *"since `shared persisted:` variables are directly mutable, `input bind: shared.sender_name` is the most direct way to handle this in v0.21."* This misreads `shared persisted:` as relaxing the input-bind rule that the cheatsheet specifically calls out. The other three cells used the canonical `local_draft = shared.X` + `on change: shared.X = local_draft` bridge pattern. **Same misread reproduced on P3** (n=2 within panel for same cell), suggesting flash-lite's interpretation is consistent — this is teaching-clarity territory, not a design ambiguity.

**Minor observations (not load-bearing):**
- Pro added `subtle: "#E0E0E0"` as a user-defined token in `theme: color:` (canonical user-defined token shape).
- GPT used `emit select value:` from the component (v0.16.0 emit-payload shape, canonical).
- Flash-lite's `each` body has `fill: true` and `on tap:` placed as if they were body children rather than layout properties (syntactic confusion); orthogonal to v0.21 surface. Same noise-tier-surfaces-orthogonal-issues pattern observed in v0.20 Stage 3.

### P2 — Live-search with rapidly-changing dependency (4/4 canonical + 4/4 explicit cancellation-rule cite)

| Cell | Trigger-variable on input | Slider directly into URL | Zero manual cancellation | 3-state branch shape | Title |
|---|---|---|---|---|---|
| Opus | ✓ (`on submit: submitted_query = query`) | ✓ | ✓ + **explicit cite** | ✓ | ✓ |
| GPT | ✓ (`submit_search()` function) | ✓ | ✓ + **explicit cite** | ✓ | ✓ |
| Gemini Pro | ✓ (`active_query`; retry via `retry_tick` increment) | ✓ | ✓ + **explicit cite** | ✓ | ✓ |
| Flash-lite | ✓ (`query_trigger`) | ✓ | ✓ + **explicit cite** | ✓ | ✓ |

**Strongest possible outcome on this prompt.** Every single cell:
1. Reached for the trigger-variable pattern correctly (input bound to local, separate trigger driven by `on submit:` or button)
2. Bound the slider directly into the fetch URL (canonical per cheatsheet's "rapid-change OK on slider, runtime handles cancellation")
3. **Explicitly cited the v0.21 cancellation rule in their reasoning** — phrases like "the v0.21 reactive-fetch race-condition handling covers (latest fire wins, stale responses ignored)" (Opus), "Igni v0.21 are latest-wins, so stale mid-drag responses are ignored/cancelled automatically" (GPT), "v0.21 runtime automatically cancels in-flight requests and ignores stale responses" (Pro), "Igni v0.21 runtime will automatically cancel stale requests" (Flash-lite).
4. **Zero manual cancellation primitives surfaced** — no `cancel()`, `AbortController`, `request_id` token, or any cancellation-management code. Cancellation is correctly invisible to user code.

**Methodology takeaway:** The Stage 0 P2 prediction (3/3 cells produce trigger-variable + direct-slider + zero-manual-cancellation + explicit-cancellation-rule-absorption-in-decision-commentary) extends to **4/4 at Stage 3** — strongest possible cancellation-invisibility outcome. The teaching of "cancellation is internal" landed perfectly. (See chapter §4 catalogue.)

**Retry-pattern variance (canonical-shape variation, not divergence):**
- Opus: self-reassign `submitted_query = submitted_query + ""` (minimal-reassignment trick)
- GPT: `submitted_query = submitted_query` (self-assignment — would NOT re-fire reactivity per the cheatsheet; potentially broken at runtime)
- Pro: `retry_tick` integer cache-buster appended to URL (cleanest pattern)
- Flash-lite: re-call `query_trigger = query` (only works if user typed since last fetch)

GPT's self-assignment retry (`submitted_query = submitted_query`) is the only one that doesn't actually fire reactivity — Igni's reactivity rule says "reassignment fires re-render" but a self-assignment to the same value may or may not fire (cheatsheet doesn't explicitly clarify). **Minor cheatsheet observation:** clarifying whether `x = x` fires reactivity or not is a v0.21.1 docs-iteration candidate (orthogonal to v0.21 surface).

### P3 — Notes app with persisted draft + sync to remote (3/3 visible, Pro truncated)

| Cell | shared persisted: notes + draft | Input bind on shared.draft (bridge) | POST mutation 3-state | Cross-screen append | Empty state |
|---|---|---|---|---|---|
| Opus | ✓ | ✓ canonical bridge | ✓ (sync_trigger pattern, mutation 3-state via `if shared.sync is loading` etc.) | partial — non-canonical `shared.update(notes = ...)` named-arg form | ✓ via lifted `notes_is_empty()` |
| GPT | ✓ | ✓ canonical bridge | ✓ (canonical mutation pattern with `shared.sync` volatile + sync_started flag) | ✓ canonical `shared.notes = shared.notes + [note]` | ✓ inline |
| Gemini Pro | **truncated** | (truncated) | (truncated) | (truncated) | (truncated) |
| Flash-lite | ✓ | **bug**: `input bind: shared.draft` directly (same misread as P1) | ✓ canonical mutation pattern with imperative `sync_status` flag | ✓ canonical | ✓ inline |

**Pro truncation:** stop_reason `MAX_TOKENS`, output_tokens 328 (vs Opus 1602 / GPT 2323 / Flash-lite ~700-744). The visible `.md` content is end-of-reasoning scratchpad ("So `local_draft` updates automatically on type, and `on change:` fires…") — no actual code shipped. **Third instance of the Pro truncation pattern** (morning v0.21 pre-cycle panel + Stage 0 P3 + Stage 3 P3); promotion threshold of n=3 reached for `spec-cycle` skill heuristic addition (see Methodology data point #5).

**P3-visible verdict:** 3/3 visible cells produce canonical-shape persistence (used `shared persisted:` block for both notes + draft). 2/3 visible cells use canonical bridge for input on persisted shared (Opus + GPT — Flash-lite repeats the same input-bind misread from P1). 2/3 visible cells use canonical cross-screen append (`shared.X = shared.X + [...]`) — Opus alone reached for non-canonical `shared.update(named=value)` syntax that doesn't exist in the cheatsheet.

**Opus's `shared.update(name=value)` invention:** the cheatsheet teaches `shared.X = value` directly (auto-wrap in `shared.update()` happens at codegen — invisible to user). Opus invented an explicit named-arg `update()` API. Single-cell instance; suggests the auto-wrap teaching is slightly under-stated (cheatsheet says it but doesn't say "*don't* call update() yourself" explicitly). **v0.21.1 docs-iteration candidate.**

**Flash-lite's input-bind-shared-direct misread:** reproduced from P1. Both instances accompanied by explicit reasoning ("since `shared persisted:` variables are directly mutable, `input bind: shared.sender_name` is the most direct way" / "input bind: shared.draft" without justification but same shape). The cheatsheet's `bind:` rule explicitly excludes `input` for shared, but flash-lite's read of v0.21's persistence-overhaul interpolated relaxation. **v0.21.1 docs-iteration candidate** — strengthen the input-bind-shared exception teaching, possibly via a "v0.21 changes nothing about the input-bind exception" note in the §Persisted shared state section.

## Methodology data points (queue for chapter §4 in next dissertation-cadence session)

1. **Third-consecutive-12/12 Stage 3 strong-pass: BROKEN at v0.21.** v0.19 + v0.20 both hit 12/12 canonical post-implementation (no-flips-no-patches outcome shape catalogued in `docs/private/117` §4d, n=2 instance). v0.21 misses 12/12: Pro truncation alone removes 3 cells from full-canonical count, plus the input-bind-shared misread (n=2 within flash-lite) and Opus's `shared.update(named)` invention. **The "no-flips-no-patches at Stage 3" pattern is now n=2 with a non-extending v0.21** — chapter §4 sub-section reverts from "growing pattern" to "n=2 plus a contextually-explained miss" (v0.21 is the project's first ship with brand-new spec-syntax that exposes brand-new teaching surface; the misses are post-implementation reading-pattern signals not design-flaws). **Methodology contribution: outcome shapes don't extend forever — they have boundary conditions tied to spec-novelty.**

2. **Cancellation invisibility: 4/4 + 4/4 explicit-cite.** Strongest possible outcome on this dimension. Predicted (per Stage 0 P2 outcome) at 4/4 zero-manual-cancellation; observed at 4/4 + every cell volunteered the cancellation rule in decision commentary. The teaching of "cancellation is internal; not user-visible" landed perfectly. **The v0.21 race-conditions Q3=C+B fix is silently doing its job** — users see the rule, write canonical syntax, and never invent cancellation primitives. Methodology contribution: **invisible-runtime-mechanism teaching pattern** — when codegen handles a hazard internally, the cheatsheet's role is to *name the hazard* (so users know it's handled) without exposing any user-facing primitive. Different shape from explicit-rule teaching; n=1 instance.

3. **Persistence wrapper-builtin leak: 0/4.** Stage 2 FLIP from Option A (`persist(initial)` wrapper) to Option B (`shared persisted:` annotated-block) held cleanly. Zero cells reached for the wrapper form. The Stage 2 panel's 2/3 architectural-grounds FLIP plus Tyr's `argument-semantic-asymmetry` operator decision was vindicated empirically post-implementation. Reinforces the principled-minority-pattern absorption sub-shape (`docs/private/114` instance 4).

4. **Flash-lite as differential signal carrier (n=3 instances now).** v0.20 Stage 3 surfaced border-width-as-string + content-vs-Content shape errors. v0.21 Stage 3 surfaces input-bind-shared-direct + property-in-body shape errors. Pattern: flash-lite reliably surfaces orthogonal teaching gaps that the cheatsheet's frontier-tier readers correctly handle. Promotes flash-lite from "noise tier" to **"differential teaching-gap surface"** — methodology rename candidate. Worth a chapter §6 sub-note.

5. **Gemini-3.1-Pro output truncation reaches n=3 → formal heuristic-promotion.** Morning v0.21 pre-cycle panel (P3, 328 tokens) + Stage 0 P3 (gated, 1/3 truncated) + Stage 3 P3 (328 tokens, MAX_TOKENS stop_reason). Three independent instances on three independent panels in two days. **Per the spec-cycle skill heuristic-promotion rule, n=3 triggers formal addition.** Trap-journal entry pending; spec-cycle skill needs a "*sanity-check Pro output length before interpreting Pro 0/N reach as cell rejection — Pro's response budget is consistently narrower than peer models on long-prompt code-generation tasks*" rule.

6. **OpenAI cache assumption broke at Stage 3.** Stage 0 of v0.21 ran for $0.95 across 9 cells = $0.106/cell. Stage 3 ran $0.98 across 12 cells = $0.082/cell — but gpt-5.5 alone was $0.596 across 3 prompts = $0.199/prompt for gpt-5.5 input (vs $0.040-0.048 for Anthropic + Google with cache hits). The OpenAI prompt-cache fix (Stream 2 #6, shipped 2026-04-28) is supposed to drop subsequent-prompt costs to ~30% of first-prompt — observed result is much closer to no-cache. **Tooling investigation gated:** is the prompt-cache key working for gpt-5.5-2026-04-23 specifically? Or is the shared-prefix-detection weaker than predicted? Trap-journal candidate.

## Cross-instrument SHIP decision rule (mirror chat-mode README)

This is the API panel half of the first dual-instrument Stage 3 ship-validation. Pre-registered convergence rule:

| Outcome | API | Chat-mode | Action |
|---|---|---|---|
| Both meet bar | strong | strong | SHIP v0.21.0 with cross-instrument confidence |
| API only | strong | soft/fail | PAUSE + investigate (chat-mode harness gap or real teaching gap that API obscured) |
| Chat-mode only | soft/fail | strong | PAUSE + investigate (API harness contamination or prompt-framing sensitivity) |
| Neither | fail | fail | Revisit syntax design |

**This API panel landed at SOFT (P3 dimension-by-dimension; cancellation-invisibility 4/4 strong; persistence-leak 0/4 strong; Pro truncated; 2 minor cheatsheet teaching gaps).** Chat-mode panel run is operator-side; cross-instrument synthesis to `docs/private/130_v021_stage3_dual_instrument.md` once chat-mode lands. Decision rule: API soft + chat-mode strong = ship with v0.21.1 docs-iteration queued; both soft on same gaps = v0.21.1 docs-iteration is gated load-bearing; chat-mode reverses some gaps as harness-specific = revisit which gaps to patch.

## What stays unchanged

- **Stage 2 Q2 FLIP held** (`shared persisted:` over `persist(initial)` wrapper-builtin): 4/4 cells reached the annotated-block form, zero wrapper-builtin leak.
- **Stage 2 Q3 race-conditions handling held** (cancellation invisible to user code): 4/4 zero manual cancellation primitives, 4/4 explicit cite of v0.21 rule in reasoning.
- **Stage 0 P3 prediction held** for the visible cells (3/3 use shared persisted: for the durable surface).
- **JSON-literal-only rule, single-file collision, namespace-shared design**: zero cell violated any of these (no function-call defaults, no collision, all `shared.X` access).

## Trap-journal entries pending (for end-of-session walk)

- `cold-test --spec` resolves relative to runner dir, not cwd (tooling, ROADMAP-S2)
- Pro output truncation n=3 (methodology, spec-cycle skill heuristic addition)
- OpenAI cache hit-rate observation (tooling, investigation)
- Opus `shared.update(named)` invention (methodology + docs gap, v0.21.1 candidate)
- Flash-lite input-bind-shared misread n=2 within panel (methodology + docs gap, v0.21.1 candidate)
