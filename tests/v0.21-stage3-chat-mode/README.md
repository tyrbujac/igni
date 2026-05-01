# v0.21 Stage 3 chat-mode ship-validation — companion to API panel

**Date:** 2026-05-01.
**Method:** 4-LLM chat-mode panel against shipped cheatsheet (`spec/v0.21.0-cheatsheet.md`, ~7300 words). Operator pasted cheatsheet + each prompt into a fresh chat per prompt per model; 12 fresh-chat sessions total; responses saved verbatim with web-UI artefacts preserved.
**Models:** Claude Opus 4.7 (Claude.ai), GPT 5.3 (ChatGPT), Gemini 3.1 Pro, Gemini 3 Flash.
**Cost:** $0 (chat-mode subscriptions). **Wallclock:** ~30 min operator-attention.
**Outputs:** `claude-opus-4-7.md`, `gpt-5.3.md`, `gemini-3.1-pro.md`, `gemini-3-flash.md` — each with three prompt-separated sections.

## Methodology — first dual-instrument Stage 3

This is the **first instance of Stage 3 ship-validation run across two instruments** (API panel via cold-test runner + chat-mode web panel via paste-and-collect). Companion artifact: `tests/v0.21-stage3/` (API panel; verdict SOFT). Cross-instrument synthesis at `docs/private/130_v021_stage3_dual_instrument.md`.

**Why two instruments.** Cross-instrument convergence is established methodology pattern (matches persistence's n=4 cross-source confidence that justified v0.21 inclusion). Chat-mode has been used for cheatsheet quality (n=5: v0.14.1 / v0.15.0 / v0.17.0 / v0.19.1 / v0.20.1) and strategic critique (n=2) but not for Stage 3 ship-validation — that asymmetry has no strong rationale, and `shared persisted:` is brand-new syntax, so cold-write evidence at ship-validation across two instruments validates the Option B choice with stronger evidence than API alone.

## Verdict — SOFT (cancellation invisibility 4/4 + 4/4 cite; persistence wrapper-leak 0/4; P3 input-bind misread n=2 reproduces API panel n=1 → cross-instrument n=3 of 8 = real teaching gap)

Pre-registered ship bar:
- **Strong:** 4/4 P1 + 4/4 P2 + ≥3/4 P3 canonical on load-bearing dimensions
- **Soft:** 3/4 on P1 or P2 — Tier-A patch for v0.21.0 narrative or v0.21.1 docs iteration
- **Fail:** ≤2/4 P1 — reopen cheatsheet teaching; possible v0.21.x design re-open

**Result:** **4/4 P1 + 4/4 P2 + 4/4 P2 explicit cancellation cite + 2/4 P3 strict-canonical (Pro + Opus) + 2/4 P3 with input-bind-shared-direct misread (Flash + GPT) + 1/4 P3 with bare-access-without-shared-prefix (Flash, NEW sub-shape).**

| Dimension | Result | Notes |
|---|---|---|
| P1 canonical reach | **4/4** | All cells reached `shared persisted:` annotated-block + JSON-literal defaults + `theme dark:` variant. Three-radio shape produced canonically (4/4 cells with explicit selected-state pattern; 3/4 via component, 1/4 via inline). Pro + Opus + GPT used canonical input-bridge pattern; Flash also used canonical bridge here (note: differs from Flash's API-panel run — chat-mode P1 didn't reproduce the API misread). |
| P2 canonical reach | **4/4 + 4/4 explicit cancellation cite** | All cells reached trigger-variable pattern for input + slider-direct-into-URL + 3-state branching. **Cancellation invisibility unanimous** — 4/4 cells explicitly cited v0.21 cancellation rule in their reasoning. Mirrors API panel's 4/4 + 4/4 cite outcome. |
| P3 canonical reach | **2/4 strict (Pro + Opus); 2/4 with input-bind-shared misread (Flash + GPT)** | Pro: 5/5 canonical. Opus: 5/5 canonical (with multiline + initial-fetch-fire cheatsheet-gap observations, both v0.22+ candidates). GPT: 4/5 — reached `input bind: shared.draft` directly with explicit reasoning ("your spec explicitly asks for it as the draft source"). Flash: 3/5 — same `input bind: shared.draft` misread + bare-access (`notes` instead of `shared.notes`) throughout the file. |
| Pro truncation reproduction | **0/3 — chat-mode does NOT reproduce API truncation** | All three Pro prompts in chat-mode produced full, well-structured output with extensive design-decision sections. The Pro truncation observed in API panel P3 (MAX_TOKENS at 328 output tokens) is **API-mode-specific to current Pro `gemini-3.1-pro-preview` parameters**, not a Pro-model-wide behaviour. Cross-instrument confirms harness-specificity. |
| Persistence wrapper-builtin leak | **0/4** | Zero cells reached for `persist(initial)` wrapper-builtin form. Stage 2 Q2 FLIP from Option A to Option B held cleanly in chat-mode too. |

This is **soft** because the input-bind-shared-direct misread reproduces in chat-mode at 2/4 (Flash + GPT) — combined with API's 1/4 (Flash-lite), cross-instrument count is **3/8 cells with the same misread**, which is the primary diagnostic signal for v0.21.1 docs-iteration. Strict P3 canonical reach is 2/4; on the looser pre-reg dimension ("≥3/4 P3 use `shared persisted:` for the durable surface"), the bar is met (4/4 use the persisted block). Tier-A patches go to v0.21.1 docs-iteration; **no design-level reopen**.

## Convergence by prompt

### P1 — Theme + sender-name settings with persisted preferences (4/4 canonical)

| Cell | shared persisted: block | JSON-literal defaults | shared.theme_mode active selector | Theme + dark variants | Radio shape |
|---|---|---|---|---|---|
| Opus | ✓ | ✓ (`"system"`, `""`) | ✓ | ✓ (auto-fall-back implicit) | extracted ThemeOption component with screen-internal `option_width()` / `option_color()` functions |
| GPT | ✓ | ✓ | ✓ | ✓ (over-declared scaffold/appbar in dark — verbose but not buggy) | extracted ThemeOption component with derived state functions |
| Gemini Pro | ✓ | ✓ | ✓ | ✓ (explicit auto-fall-back comment) | INLINE three layouts (chose inline over component for "static enum values") with screen-internal `width_for(mode)` / `color_for(mode)` |
| Gemini Flash | ✓ | ✓ | ✓ | ✓ (auto-fall-back implicit comment) | extracted ThemeOption component with `is_active = ...` derived flag |

**4/4 cells reached canonical persistence + theme variant + radio shape.** Pro chose inline-three over component (only cell to do so) — explicit reasoning: "places functions locally scoped to the screen (as shown in the cheatsheet's Selected-state pattern)" — interesting observation since the cheatsheet's Border / Selected-state pattern shows the function approach for *components*; Pro extrapolated that to inline screen-body usage. Functionally identical, methodologically distinct.

**Notable cross-instrument observation:** Flash chat-mode used the canonical input-bind-bridge pattern correctly here (`draft_name = shared.sender_name` + `on change: save_name()`), whereas Flash-lite API panel used `input bind: shared.sender_name` directly. Same model family, different output — suggests the misread is *consistency-sensitive to model size*. Flash (the larger Gemini Flash) caught the rule; Flash-lite (the smaller "noise tier" model) misread it. **Methodology data point:** flash-lite's role as differential teaching-gap surface holds up — it surfaces the same gap shape that other Gemini-family models avoid.

### P2 — Live-search with rapidly-changing dependency (4/4 canonical + 4/4 explicit cancellation cite)

| Cell | Trigger-variable on input | Slider directly into URL | Zero manual cancellation | 3-state branch shape | Title |
|---|---|---|---|---|---|
| Opus | ✓ (`on submit: submitted_query = query`) | ✓ | ✓ + **explicit cite** ("v0.21's runtime cancels in-flight requests when a reactive dep changes") | ✓ | ✓ |
| GPT | ✓ (`on submit: submitted_query = query`) | ✓ | ✓ + **explicit cite** ("Igni v0.21's fetch cancellation rules mean rapid slider changes cancel/ignore stale requests, so the latest drag wins") | ✓ | ✓ |
| Gemini Pro | ✓ (`trigger_search()` function calling `active_query = draft_query`) | ✓ | ✓ + **explicit cite** ("Igni v0.21's built-in race-condition handling: the previous in-flight request is automatically cancelled/ignored as the user drags the slider") | ✓ | ✓ |
| Gemini Flash | ✓ (`on submit: trigger_query = draft_query`) | ✓ | ✓ + **explicit cite** ("Igni v0.21 handles 'keystroke storms' (or in this case, 'slider storms') by ensuring the latest request always wins and stale responses are ignored") | ✓ (4-state — empty-state separated from else) | ✓ |

**Strongest possible outcome — chat-mode reproduces API panel's 4/4 + 4/4 cite pattern.** The cancellation invisibility teaching is empirically validated across two independent instruments (8/8 cells across both panels reached zero manual cancellation primitives + 8/8 explicit cite of the v0.21 rule). This is the dual-instrument convergence the dual-instrument design was meant to capture.

**Retry-pattern variance** (canonical-shape variation, not divergence):
- Opus: `submitted_query = query` (reassign to current input value)
- GPT: `submitted_query = submitted_query` (self-assignment — same as API panel; reactivity behaviour ambiguous)
- Pro: `trigger_search()` function call (cleanest pattern via function-on-tap)
- Flash: `trigger_query = trigger_query` (self-assignment — same caveat as GPT)

The self-assignment retry pattern (`x = x`) is reached for in 2/4 chat-mode cells (mirroring 2/4 API cells) — clarifying whether `x = x` triggers reactivity is a v0.21.1 docs-iteration candidate (orthogonal to v0.21 surface, observed across both instruments).

**Opus chat-mode P2 cheatsheet-gap observations** (from Opus's own design notes):
- `slider step:` not in cheatsheet's slider example (Opus called it an "assumption")
- Number-to-string concatenation in URL building lacks documented coercion rule

These are observations against the cheatsheet, not v0.21-specific. Same pattern as Opus API-panel-Stage-3-flagging-cheatsheet-gaps (n=2 within Opus chat-mode + 0/3 other models flag these → Opus-specific reading discipline, not consensus issue).

### P3 — Notes app with persisted draft + sync to remote (2/4 strict canonical, 2/4 with input-bind-shared misread)

| Cell | shared persisted: notes + draft | Input bind on shared.draft (canonical = via bridge) | POST mutation 3-state | Cross-screen append | Empty state |
|---|---|---|---|---|---|
| Opus | ✓ | ✓ canonical bridge (`local_draft = shared.draft` + `on change:`) | ✓ (gated by `saved` flag for inline status visibility) | ✓ canonical | ✓ inline `if shared.notes is empty` |
| GPT | ✓ | **bug**: `input bind: shared.draft` directly. Explicit reasoning: *"your spec explicitly asks for it as the draft source, so the editor uses the shared value as the backing state"* | ✓ canonical | ✓ canonical | ✓ inline |
| Gemini Pro | ✓ | ✓ canonical bridge | ✓ (gated by `is_saving` flag) | ✓ canonical | ✓ inline `if shared.notes is empty` (with explicit `color: subtle`) |
| Gemini Flash | ✓ | **bug**: `input bind: shared.draft` directly | ✓ | ✓ ALSO **bug**: bare access throughout (`notes = notes + ...`, `if notes is empty`, `each note in notes:` — missing `shared.` prefix everywhere except where it's explicitly written) | ✓ inline |

**Two recurrent teaching gaps + one new sub-shape:**

1. **Input-bind-on-shared-direct misread (n=2 chat-mode + n=1 API panel = n=3 of 8 cells).** GPT + Flash chat-mode + Flash-lite API panel all wrote `input bind: shared.X` despite the cheatsheet's explicit rule against it. GPT's reasoning is interesting — it interprets the prompt's "multi-line input bound to the draft" as overriding the cheatsheet rule ("your spec explicitly asks for it"). Flash-lite API gives a different reasoning (`shared persisted:` relaxes the rule). Same shape, different reasoning, three independent cells — **the cheatsheet's input-bind-shared exception teaching is consistently misread by smaller models AND by GPT-5.3 specifically**.

2. **Bare-access without shared prefix (chat-mode Flash only, n=1, NEW sub-shape).** Flash wrote `notes = notes + [...]` and `each note in notes:` — bare access to a `shared persisted:` variable. The cheatsheet's `shared.X` discipline is well-established (validateSharedPrefix in codegen rejects bare access at compile time), but Flash interpolated `shared persisted:` as creating a top-level binding accessible without prefix. **n=1 instance**; gates n=2 for class promotion to formal teaching gap.

3. **Initial-fetch-fires + multiline-not-documented (Opus-only chat-mode P3 observations, same pattern as Opus's API-panel discipline).** These are Opus's reading-of-the-cheatsheet observations, surfacing v0.22+ design candidates (`fetch_when(condition, ...)` deferred-fetch primitive; `multiline: true` input modifier). Methodology data point: Opus's reading-discipline reliably surfaces design candidates that the prompt author (operator) wasn't probing for. Same shape as Opus's "honest-no" capability mentioned in `feedback_one_version_at_a_time.md`.

**Pro chat-mode P3 ran clean** — full output, no truncation, comprehensive design notes, canonical syntax throughout. The Pro truncation observed in API panel was harness-specific.

## Methodology data points (queue for chapter §4 in next dissertation-cadence session)

1. **First dual-instrument Stage 3 ship-validation completed.** Per the original methodology contribution catalogue, this is the first instance of cross-instrument convergence as a distinct pattern from single-instrument validation. Convergence outcomes (8/8 cancellation invisibility + 8/8 cite + 8/8 wrapper-leak-zero) are *strongly* validated by dual-instrument confirmation. Divergence outcomes (Pro truncation API-only + Opus `shared.update(named)` API-only + Flash bare-access chat-mode-only) point to harness-specific behaviours. **The dual-instrument design successfully separated harness-specific from real teaching gaps.** Worth chapter §4 sub-section.

2. **Cancellation invisibility 8/8 + 8/8 explicit cite (cross-instrument).** Strongest possible outcome at scale. The v0.21 race-conditions Q3=C+B fix is silently doing its job across two independent observers. **Methodology contribution: "invisible-runtime-mechanism teaching pattern"** at n=1 instance — when codegen handles a hazard internally, the cheatsheet's role is to *name the hazard* without exposing user-facing primitive. The v0.21 cancellation rule lands at the upper bound: every single cell across both panels named the rule, used the canonical syntax, and never invented cancellation primitives.

3. **Persistence wrapper-builtin leak 0/8 (cross-instrument).** Stage 2 Q2 FLIP from Option A to Option B held cleanly across both instruments. Reinforces principled-minority-pattern absorption sub-shape (`docs/private/114` instance 4) — empirically validated post-implementation that the architectural-grounds reversal didn't leak ambiguity at any reading level.

4. **Pro truncation is API-harness-specific.** Cross-instrument check resolves the n=3 API-mode truncation pattern: chat-mode Pro produced full, comprehensive output on all 3 prompts. The truncation is *not* a Pro-model-wide behaviour — it's specific to current API parameters (max_output_tokens, system prompt overhead, or response-budget heuristics). **Methodology contribution: cross-instrument check is the disambiguation tool for "model behaviour vs harness behaviour".** This is a sub-pattern of the broader harness-vs-real distinction the dual-instrument design was meant to surface.

5. **Input-bind-shared-direct misread reproduces cross-instrument at 3/8.** The 1/4 API panel signal extends to 2/4 chat-mode signal = 3/8 cross-instrument. **Real teaching gap, not harness-specific** — v0.21.1 docs-iteration must address. Patch shape: explicit callout in §Persisted shared state ("v0.21 changes nothing about the input-bind exception; `shared persisted:` shares the namespace, so the same rule applies"). Three independent cells reached for the bug despite the cheatsheet's existing rule statement, suggesting the rule is *findable* but not *salient enough* for cells whose prompt-context emphasizes persistence.

6. **Bare-access-without-shared-prefix (n=1) is new sub-shape.** Flash chat-mode P3 surfaced the bare-access pattern — accessing `notes` instead of `shared.notes` throughout. Single instance; gates n=2 for class promotion. If reproduced in v0.22+ panels, suggests the `shared.X` discipline teaching needs reinforcement. For now, methodology-log-only observation.

7. **Self-assignment retry pattern (`x = x`) at 4/8 cross-instrument.** Two API + two chat-mode cells reached for `submitted_query = submitted_query` or `trigger_query = trigger_query` for retry. The cheatsheet doesn't explicitly state whether reassignment-to-same-value triggers reactivity. **Cross-instrument reach is high enough (50%) to warrant a v0.21.1 docs-iteration clarification.** Either confirm the reassignment-fires-reactivity rule or suggest a counter-bump pattern as the canonical retry shape.

## Cross-instrument SHIP decision

Both instruments evaluated independently:

| Instrument | Verdict | P1 | P2 | P3 | Notable |
|---|---|---|---|---|---|
| API panel (`tests/v0.21-stage3/`) | SOFT | 4/4 | 4/4 + 4/4 cite | 3/3 visible (Pro truncated) | Pro MAX_TOKENS, Opus `shared.update(named)` invention, Flash-lite input-bind misread |
| Chat-mode (this dir) | SOFT | 4/4 | 4/4 + 4/4 cite | 2/4 strict (Pro + Opus) | Pro full output, GPT + Flash input-bind misread, Flash bare-access |

**Cross-instrument verdict: SOFT (both halves)** — same gap (input-bind-shared) reproduces n=3/8 + new chat-mode-only minor (bare-access n=1).

Per the pre-registered ship matrix:
- API SOFT + chat-mode SOFT (same gaps + new minor) = **v0.21.1 docs-iteration is gated load-bearing; ship after patches.** Broader docs scope than just the input-bind callout — include the bare-access reinforcement, the multiline observation (informational, not a v0.21 patch), and the self-assignment-retry clarification.

**Decision: SHIP v0.21.0** (no design reopen) **+ queue v0.21.1 docs-iteration** with the following Tier-A patches:

1. **Strengthen `input bind: shared.X` exception teaching in §Persisted shared state.** Add explicit callout: *"v0.21 changes nothing about the input-bind exception; `shared persisted:` shares the namespace with `shared:`, so `input bind: shared.X` is rejected for both. Use the canonical bridge: `local = shared.X` at the top, `on change: shared.X = local` to write back. Persisted `shared.X` writes happen on assignment; the bridge pattern preserves them."* (n=3/8 cross-instrument; load-bearing)
2. **Clarify reassignment-to-same-value reactivity** in §Reactivity. Either confirm fires (and document the retry pattern as canonical) or suggest a counter-bump alternative. (n=4/8 cross-instrument cells reached for `x = x` retry; ambiguous teaching surface)
3. **Bare-access reminder in §Persisted shared state.** *"Like plain `shared:`, persisted shared variables are accessed via `shared.X` — the prefix is the visible coupling marker; bare access is rejected at compile time."* (n=1; pre-emptive against n=2 promotion)

**Out of v0.21.1 scope** (informational observations from chat-mode panel, candidates for v0.22+ design):
- Opus's flagged `multiline: true` on input
- Opus's flagged `slider step:` clarification
- Opus's flagged number-to-string coercion rule
- Opus's flagged deferred-fetch primitive (`fetch_when()` shape)

These are larger-scope additions or v0.22+ design candidates; not load-bearing for v0.21 ship.

## What stays unchanged

- **Stage 2 Q2 FLIP held cross-instrument** (`shared persisted:` over `persist(initial)` wrapper): 8/8 cells reached the annotated-block form, zero wrapper-builtin leak.
- **Stage 2 Q3 race-conditions handling held cross-instrument**: 8/8 zero manual cancellation primitives + 8/8 explicit cite of v0.21 rule.
- **JSON-literal-only rule, single-file collision, namespace-shared design**: zero cell violated any of these (no function-call defaults, no collision, all `shared.X` access except for one Flash chat-mode bare-access bug, which is teaching-gap not design-gap).
- **Persisted-state Stage 0 P3 prediction held**: visible cells (5/8 across both instruments not blocked by Pro API truncation) all use `shared persisted:` for the durable surface.
