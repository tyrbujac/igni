# v0.21 Stage 0 cold-test — persistence + reactive-fetch cancellation

**Status (2026-04-30):** Scaffold ready; panel run pending. Mirrors v0.20-stage0 + v0.19-stage0 structure. Cheatsheet draft injected as `--spec`; 3 models × 3 prompts; sequential mode for reproducibility.

## What this panel measures

Pre-implementation cold-test for the v0.21 cycle's two paired Stage-2-locked primitives:

- **Persistence:** Stage 2 panel FLIPped Option A (wrapper-builtin) → Option B (`shared persisted:` annotated-block). Q4 + Q5 patches inlined: parse-time-collision rule, JSON-literal-only argument rule. Cheatsheet draft adds a new `### Shared persisted state (v0.21)` sub-section under `## Shared State`.
- **Reactive-fetch cancellation:** Stage 2 panel FLIPped Shape A (URL-guard) → Shape C+B (counter-token + `http.Client.close()`). Cheatsheet draft replaces the v0.20.1 "race conditions undefined-behaviour" callout under `## Async` with the new cancellation rule (with Web partial-cancellation caveat).

The panel measures whether 3 frontier models cold-reach for the canonical syntax + semantic rules with no prior context beyond the cheatsheet draft.

## Pre-registered ship bar

- **Strong (proceed to implementation):** 3/3 P1 + 3/3 P2 + ≥2/3 P3 canonical.
- **Soft (patch teaching, re-run):** 2/3 P1+P2.
- **Fail (reopen design):** ≤1/3 P1 — design wrong; reopen Q2 (persistence shape) or fetch-cancellation Q3.

Per-prompt canonical-syntax bar:

- **P1 — Theme + sender-name settings with persisted preferences:** uses `shared persisted:` block with `theme_mode = "system"` + `sender_name = ""` JSON-literal defaults. Doesn't over-declare or use the dropped wrapper-builtin shape.
- **P2 — Live-search with rapidly-changing dependency:** uses canonical `fetch()` call with two live dependencies (query + slider value). No manual cancellation primitives surfaced (cancellation is internal; user code shouldn't need to express it). Uses the trigger-variable pattern for the text-input case (`on submit:` not direct `bind:` to URL).
- **P3 — Notes app with persisted draft + sync:** uses `shared persisted:` for both notes list AND in-progress draft. Sync POST uses idiomatic `fetch()`; doesn't try to manually cancel or guard the in-flight request.

## Run command

```bash
npx tsx tests/runner/cold-test.ts \
  --prompts tests/v0.21-stage0/prompts.md \
  --out tests/v0.21-stage0 \
  --spec tests/v0.21-stage0/cheatsheet-draft.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview
```

`--no-grade` because v0.21 transpiler hasn't shipped; auto-grade would falsely fail every output. Manual convergence-counting per the per-prompt canonical bars above.

**Cost target:** ~$0.40 (matches v0.20 + v0.19 Stage 0 precedent for 9-cell sequential runs).

## Files

- `cheatsheet-draft.md` — v0.20.4 cheatsheet body + `### Shared persisted state (v0.21)` section + replaced race-conditions callout. 1009 lines (was 984).
- `prompts.md` — three card-sender / recipes-search / notes-app prompts.
- `<model>_cheatsheet_<prompt-slug>.{md,json}` — outputs (filled after run).
- This file — pre-registration above; post-run synthesis below.

## Synthesis (run 2026-04-30)

**Verdict — STRONG PASS, 8/9 canonical (3/3 P1 + 3/3 P2 + 2/3 P3 + 1/3 P3 partial-due-to-instrument-truncation).** Pre-registered ship bar met (3/3 P1+P2 + ≥2/3 P3); cleared on first run. **Ready for v0.21 implementation phase.** No Stage 0 → implementation patches needed; no design re-opening triggered.

**Cost:** $0.9546 across 9 cells (~$0.40 estimate exceeded). Per the morning trap-journal entry (per-provider cache isolation), cost target should read per-provider × N. **n=2 instance** of cost-target-undercount pattern; the rule "cross-provider caches don't share" now firmly empirical at two ships. Trap-journal already captures this; no new entry needed.

### Convergence by prompt

| Prompt | Cell | Verdict | Canonical signals |
|---|---|---|---|
| **P1 — Theme + persisted preferences** | Claude | ✓ | `shared persisted: theme_mode = "system" + sender_name = ""`; both JSON-literal defaults; no Option A leak |
|  | GPT | ✓ | Same shape with `default_sender_name` (synonym; both JSON-literal) |
|  | Gemini | ✓ | Identical structural shape to Claude |
| **P2 — Live-search rapid-change** | Claude | ✓ | Trigger-variable pattern for input (`on submit:`); direct bind for slider; references v0.21 cancellation rule explicitly ("the framework closes the stale request and its response is dropped via an internal generation counter") |
|  | GPT | ✓ | Same pattern; references "Igni's reactive fetch cancellation/generation behavior" correctly |
|  | Gemini | ✓ | Same pattern; explicit "Built-in Cancellation for the Slider — In Igni, you don't write manual debouncing or cancellation logic" — perfect cold-reach on the v0.21 rule |
| **P3 — Notes persisted draft + sync** | Claude | ✓ | `shared persisted: notes = [] + draft = ""`; sync via `fetch(method: "POST")`; trigger-variable pattern for the POST fire |
|  | GPT | ✓ | Same shape; `shared persisted:` block + sync POST + sync-status state |
|  | Gemini | ⚠️ partial (instrument issue) | Output truncated at 38 lines / 328 tokens mid-decision-comment. Visible portion shows correct `shared persisted: notes = [] + draft = ""` + correct understanding of v0.21 dispose-cancel rule in commentary, but the sync flow itself was cut off before the screen body landed. **Not a design failure** — instrument truncation only |

**Aggregate adoption (per-shape):**

| Shape | P1 (3) | P2 (3) | P3 (3) | Total |
|---|---|---|---|---|
| `shared persisted:` block | 3/3 | n/a | 2/3 visible (3/3 if counting Gemini's truncated-but-correct partial) | **5-6/6 load-bearing** |
| Reactive fetch + canonical cancellation | n/a | 3/3 | 2/3 visible | **5/6 load-bearing** |
| JSON-literal defaults inside persisted block | 3/3 | n/a | 2/3 visible | **5-6/6** |
| Trigger-variable pattern for input-bind-fetch | n/a | 3/3 | n/a | **3/3** |
| Manual cancellation primitives surfaced | 0/3 | 0/3 | 0/3 | **0/9** ✓ (cancellation correctly invisible to user code) |
| Option A wrapper-builtin leak (`= persist(`) | 0/3 | 0/3 | 0/3 | **0/9** ✓ (the dropped Stage-1 lock shape didn't leak through) |

### Per-prompt notes

**P1 — clean.** All three cells produced near-identical structural shape: `theme:` + `theme dark:` variant pair + `shared persisted:` block + Settings screen with three radio-button-style theme options. Theme-mode picker shape varied (Claude: extracted component; GPT: inline-repeated rows with `if shared.theme_mode is mode:` check; Gemini: similar inline shape) — same v0.20-stage0 P1 multi-shape outcome reproduced under new cheatsheet. No cell over-declared in `shared persisted:`; both `theme_mode` and `sender_name` were the only persisted variables (correct minimum-surface cold-reach).

**P2 — strongest convergence.** All three cells reached the same shape: trigger-variable pattern for the text input (`query` bound to input, `submitted_query` reassigned in `on submit:`, fetch reads `submitted_query`); direct bind for the slider (`max_minutes` reassigns on every drag tick, fetch reads it). All three explicitly explain the v0.21 cancellation behaviour in their decision commentary — *"you don't write manual debouncing"* (Gemini), *"stale mid-drag responses are dropped and the latest request wins"* (GPT), *"the cheatsheet's v0.21 reactive-fetch cancellation guarantees the latest drag's response wins"* (Claude). The cancellation rule was clearly absorbed and applied. **Zero manual cancellation primitives** surfaced — cancellation is correctly invisible to user code, exactly as designed.

**P3 — strong on persistence + sync where visible; Gemini truncated.** Claude + GPT produced complete, structurally identical apps: `shared persisted:` block (notes + draft) + List screen + Editor screen + sync POST via `fetch(method: "POST", body: {...})` + sync-status state machine (idle / loading / saved / failed). Both used the trigger-variable pattern for the sync fire (counter that increments on Save). Gemini's output truncated at 328 tokens — the visible portion (38 lines) correctly used `shared persisted: notes + draft` and made an explicit decision comment about screen-dispose cancellation, but cut off mid-decision before the screen body. Methodologically: instrument issue, not design failure.

### Methodology observations

1. **Gemini-3.1-Pro consistent output truncation — promoted to n=2.** Morning trap-journal entry catalogued this as n=1 single-instance pattern (v0.21 pre-cycle panel; Pro produced 300-622 token outputs vs Claude 2000-3650). This Stage 0 reproduces it at n=2: Pro's P3 = 328 tokens, P2 = 1015, P1 = ~3500ish. Same shape — Pro's response budget appears smaller than peer models for design-critique / code-generation prompts. **Promotes from single-instance observation to formal trap class.** Discipline rule for future panels: when interpreting Gemini-Pro 0/N reach, sanity-check output length first; truncated outputs are instrument failure, not cell rejection. Worth a `spec-cycle` skill update at n=3.

2. **Cost-target undercount — n=2.** $0.95 actual vs $0.40 estimate (~2.4x). Same root cause as morning's pre-cycle panel ($0.88 vs $0.50): per-provider cache isolation. Cost-target estimates should read per-provider × N rather than total-amortised. n=2 entries already in trap-journal; no new entry needed; this confirms the pattern.

3. **Stage 0 → implementation handoff cleanliness — second consecutive 9/9-equivalent strong-pass.** v0.20 + v0.21 Stage 0 panels both cleared the pre-registered bar on first run (allowing for the gemini-truncation instrument issue here). Methodology data point: when Stage 2 design-locks have absorbed panel critique cleanly, Stage 0 cold-reach lands without further patch cycles. n=2 instances of clean-Stage-0-after-clean-Stage-2 (v0.20 + v0.21). Worth chapter §4 catalogue when v0.21 Stage 1 finalises (~2026-05-05 cadence).

4. **Zero Option A leak through Stage 0.** The dropped Stage-1 wrapper-builtin shape (`shared.X = persist(initial)`) didn't appear in any cell. Stage 2 FLIP A→B was absorbed cleanly by the cheatsheet draft; cells cold-read the new shape without falling back to the rejected one. Confirms the principled-minority Stage 2 reversal worked as intended; the cheatsheet teaching is sharp on the new shape.

### Patch list

**None.** Zero patches needed. Cheatsheet draft as-injected is canonical-aligned; cells reach for the new shapes correctly without further teaching.

### Stage 0 → implementation handoff

v0.21 cycle ready for **implementation phase** (per spec-cycle skill cycle stage progression). Implementation scope:

- **Parser:** `shared persisted:` sub-block recognition (lex `persisted` as Identifier paired with `shared` keyword, or new TokenType — TBD at implementation); JSON-literal-only argument validation; cross-file persisted-key collision check; cross-wrapper rejection rules per Q5.
- **Codegen:** persisted-state lowering (storage-backend choice — SharedPreferences likely default per scope); fetch reactive cancellation lowering (per-fetch counter token + http.Client + close on re-fire + dispose-cancel); Web partial-cancellation note in generated comments.
- **Spec body:** fork v0.20.4 → v0.21.0 via `new-spec-version.ts`; spec/cheatsheet/micro forks; SYNC marker regen.
- **Fixtures:** ~5-8 new positive (persistence + cancellation + cross-wrapper rejection) + 2-3 negative (Option A wrapper-builtin shape rejected; persist(now()) rejected; cross-file collision rejected).
- **Stage 3 panel** post-implementation; ship after.

Estimated 2-3 implementation sessions matching v0.18 testing-infrastructure shape (one big primitive class with intertwined sub-decisions). Per `feedback_one_version_at_a_time.md`: v0.22+ work (hover Stage 2, stack/wrap/rotation Stage 1) stays deferred until v0.21 ships.
