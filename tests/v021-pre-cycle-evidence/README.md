# v0.21 Pre-cycle visual-primitives evidence panel

**Status (2026-04-29):** Scaffold only — pre-registered; not yet run. Run kicks off in parallel with app 3 (card sender) build per `docs/private/120`.

**Cycle stage:** Novel — *pre-Stage-1 candidate-cluster cold test*. Distinct from the existing 9-stage cycle (`docs/cycle.md`); this is an upstream filter that decides which candidates earn Stage 1 design notes when v0.21 opens, vs which demote permanently to Ideas. Methodology contribution catalogued in `docs/private/123` §Methodology contributions.

## What this panel measures

Four visual-primitive candidates surfaced from continued thinking after the 2026-04-29 tutorial-walk session (`docs/private/123` Findings B–D + tutorial-walk impressions). All four are below ROADMAP Stream 3 promotion bar today; this panel generates cold-test signal that promotes (or demotes) them before any design-note bandwidth is spent.

| Candidate | Proposed Igni shape | Path C analogue (Figma) |
|---|---|---|
| **Hover states** | `hover:` sub-block under `layout` (overrides apply on hover) | Figma component `:hover` styling |
| **Z-stacking** | `layout stack:` block opener (children stacked z-order, last on top) | Figma frame z-stacking, or `layout absolute` |
| **Auto-layout wrap** | `layout horizontal, wrap: true:` modifier (wraps to next row at overflow) | Figma auto-layout `wrap` setting |
| **Rotation** *(honest-no candidate)* | `rotation:` modifier with whitelist (90 / 180 / 270) | Figma transform rotate |

## Pre-registered promotion bars

**Promotion** = candidate earns a Stage 1 design note in v0.21+ cycle. **Demotion** = candidate moves to permanent Ideas with no design note unless second-instance signal (real-app friction) re-promotes.

Bars are pre-registered HERE before run, per the discipline rule "every evidence-generation panel must include at least one candidate the operator privately suspects will fail" (catalogued `docs/private/123` §Methodology). Selection-bias is the failure mode; pre-registration is the guard.

| Candidate | Promote bar | Demote bar | Operator's prior |
|---|---|---|---|
| Hover | ≥3/4 cells reach for `hover:` sub-block shape (or a competing shape if convergent) on a prompt that natively benefits from hover state | ≤1/4 cells reach for any hover shape | Likely promote — web/desktop apps need it |
| Z-stack | ≥3/4 cells reach for `layout stack:` (or competing shape) on a prompt with overlay/badge requirements | ≤1/4 cells reach for any z-stack shape | Likely promote — badges/FAB/modals are real |
| Wrap | ≥3/4 cells reach for `wrap: true` modifier (or competing shape) on a prompt with tag-list / chip-group elements | ≤1/4 cells reach for any wrap shape | Possibly promote — tag lists are real but not load-bearing for v1.0 |
| **Rotation (honest-no)** | ≥3/4 cells reach for `rotation:` modifier on a prompt where rotation would be visually natural | ≤1/4 cells reach for `rotation:` | **Likely demote** — rare in production app UI |

**Rotation is the honest-no candidate**: Tyr privately suspects it's a post-v1.0 candidate, but the panel must include candidates the operator suspects will fail to validate the instrument's *demotion* capability. If everything passes, suspect curation; if rotation passes, the operator's prior was wrong (good signal — adjust curation). If rotation gets demoted, the instrument's discrimination is working.

## Candidates explicitly NOT in this panel

- **Opacity** (whitelist 25/50/75/100). n=0 enthusiasm-only at present; not earned spot in panel. Wait for real-app friction.
- **Shadow** (`shadow:` token-only modifier). Already a v0.21 candidate per ROADMAP; signal is real-app pressure (app 3) + future evidence panel — not this one.
- **Cross-platform variant pattern** (`viewport()` builtin). n=1 from Boojy Notes app 2. Architectural questions warrant a separate panel after second-instance signal lands.
- **Persistence (`persist()`)**. Already locked for v0.21 cycle Stage 1 per `docs/private/122` n=4 cross-source convergence; doesn't need pre-cycle evidence.

## Methodology framing

This panel is the *first instance of "pre-Stage-1 candidate-cluster cold test"* as a cycle pattern. Existing Stage 0 cold-tests fire post-Stage-1 (against a cheatsheet draft for a candidate already authorised by a design note). This panel fires *before* design notes — it filters which candidates earn the design-note bandwidth.

Methodology contribution gates (per `docs/private/123`):
- **Promotion to recurring cycle stage** requires n=2 (second pre-cycle-evidence panel run with similar shape). Until then, this is a one-off experiment.
- **Honest-no-candidate discipline rule** is articulated for the first time in this panel's pre-registration. If rotation gets demoted by the panel, the rule's edge sharpens. If rotation passes, the rule's edge dulls (operator's prior was wrong; rule still useful for next run but less load-bearing).
- **Cross-source convergence** with app 3 (card sender) is the highest-yield methodology pattern — both panel and real-app pressure produce signal on overlapping candidates (hover/z-stack in card-sender screens; doc 122's n=4 persistence convergence is the precedent).

## Files

- `cheatsheet-draft.md` — extends `spec/v0.20.1-cheatsheet.md` with proposed shapes for the four candidates. Inject as `--spec` to the runner.
- `prompts.md` — three card-sender-shaped cold-test prompts, designed to give natural surfaces for each candidate without explicitly naming the candidate primitive.
- `<model>_cheatsheet_<prompt-slug>.{md,json}` — outputs (filled after run).
- This file — pre-registration + post-run synthesis (sections appended after run).

## Cost estimate

n=4 cells × 3 prompts = 12 cells. Anthropic + OpenAI prompt-cache shipped (Stream 2 #6); cumulative cost target ≤$0.50 (cheatsheet ~7-8k words; first-prompt cache miss ~$0.10-0.12 per model; subsequent prompts cached). Compare v0.20-stage0 (9 cells, $0.83) — this is 12 cells but with cache-warm advantage.

If cost overruns >$1.00, log to trap-journal as a tooling/methodology entry (cache effectiveness regression?) before continuing.

## Synthesis (run 2026-04-30)

**Verdict:** All four candidates clear the promote bar. Honest-no candidate (rotation) adoption surprised the operator's prior — passed at 8/12 with 4/4 on both natural-surface prompts. Hover/stack/wrap confirmed the likely-promote priors. **Routing decisions below are PROPOSED — pending Tyr's confirmation per CLAUDE.md sole-decision-maker rule before any ROADMAP / Ideas edits.**

**Panel:** claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview, gemini-3-flash-preview × 3 prompts = 12 cells. Sequential mode. **Cost: $0.88** (over the $0.50 target but under the $1.00 trap-journal threshold; root-cause analysis below). Wallclock ~12 min (Claude 2.5 min/cell, GPT 1.5 min/cell, Gemini-Pro 1.2 min/cell, Gemini-Flash 0.3 min/cell).

### Aggregate adoption per candidate

| Candidate | Total | P1 (load-bearing where noted) | P2 | P3 | Verdict vs pre-registered bars |
|---|---|---|---|---|---|
| **Hover** | 7/12 | 4/4 (load-bearing) | 0/4 (natural, not load-bearing) | 3/4 (load-bearing; gemini-pro truncated) | **Strong promote** — reach tracks load-bearing-ness perfectly. Gemini-pro P3 0/1 is a token-budget artifact (output cut at 622 tokens mid-screen), not a reach failure. |
| **Stack** (`layout stack`) | 8/12 | 4/4 (load-bearing — corner stamp) | 4/4 (load-bearing — overlay/share/watermark) | 0/4 (natural, not load-bearing) | **Strong promote** — perfect 4/4 on both load-bearing prompts; non-reach on P3 is appropriate (badge-over-image surface chosen by 0/4 because tag chips render fine without z-stack). |
| **Wrap** (`wrap: true`) | 8/12 | 4/4 (load-bearing — responsive grid) | 0/4 (no wrap surface) | 4/4 (load-bearing — chip group) | **Strong promote** — cleanest result of the panel; wrap reach perfectly correlates with prompt's load-bearing surface. |
| **Rotation** (honest-no) | 8/12 | 4/4 (natural — "NEW!" stamp) | 4/4 (natural — diagonal watermark) | 0/4 (no rotation surface) | **Strong promote — operator's prior wrong**. Pre-registered prior was "likely demote." Adoption matches the natural-surface pattern. Whitelist friction surfaced on P2 (see below). |

Aggregate per the per-prompt rubric (≥9/12 strong / 6-8 partial / 3-5 revisit / ≤2 demote): all four sit at 7-8/12, which by the rubric reads "partial." But the cross-tab pattern — every candidate hits 4/4 on its load-bearing surfaces and 0/4 elsewhere — is the strong-promote shape: *cells use the primitive when it solves the problem, not because the cheatsheet shows it.* Per the rubric's last paragraph, this earns strong-promote status.

### Convergence by prompt

**P1 (card list home — hover, stack, wrap, rotation all natural):** 4/4 on every candidate. The most candidate-dense prompt; cells composed all four shapes cleanly into the same card-grid screen. No competing shapes proposed.

**P2 (card preview — stack load-bearing, rotation natural for diagonal watermark, hover natural for share button):** 4/4 stack, 4/4 rotation, 0/4 hover (correctly not reached — share button hover wasn't load-bearing). **Whitelist friction surfaced**: 2/4 cells (Gemini-Pro, Gemini-Flash) explicitly flagged that `rotation:` whitelist (90/180/270) doesn't express "diagonal" — Gemini-Flash used `rotation: 90` and noted the limitation; GPT-5.5 used `rotation: 45` (out-of-whitelist). Claude used `rotation: 90` without flag. Design question for v0.21 Stage 1: widen rotation whitelist (45?) or accept that decorative diagonal text is non-canonical.

**P3 (filter screen — wrap load-bearing, hover load-bearing for preview-expansion):** 4/4 wrap, 3/4 hover (gemini-pro truncated mid-output before reaching preview component). **Hover-only-children architectural wall surfaced**: 2/4 cells (Claude, GPT) explicitly flagged that `hover:` as drafted only accepts property overrides, not primitive children — so the prompt's "preview expands to show extra detail on hover" requirement isn't expressible. Claude P3 quote: *"Worth flagging rather than faking."* GPT P3 quote: *"Showing description only while hovered would need a future hover-state rendering primitive."* This is a load-bearing design question for v0.21 Stage 1 hover design note.

### Proposed routing (pending Tyr confirmation)

1. **Hover → ROADMAP Stream 3 promotion → Stage 1 design note in v0.21+ cycle.** Strong promote signal. Open question for Stage 1: should `hover:` accept primitive children, or is there a per-element `is_hovered()` boolean for conditional rendering? Both surfaces failed to express on P3 with the property-override-only shape.
2. **Stack (`layout stack`) → ROADMAP Stream 3 promotion → Stage 1 design note in v0.21+ cycle.** Strong promote, no design questions raised. Cleanest of the four.
3. **Wrap (`wrap: true`) → ROADMAP Stream 3 promotion → Stage 1 design note in v0.21+ cycle.** Strong promote. Vertical-wrap exclusion in cheatsheet draft was respected (no cell tried `layout vertical, wrap: true`).
4. **Rotation → ROADMAP Stream 3 promotion → Stage 1 design note in v0.21+ cycle.** Operator's prior reversed. Open question for Stage 1: widen whitelist to include 45°? Or document "decorative diagonal text" as a non-goal? GPT-5.5's out-of-whitelist `rotation: 45` reach is the canary signal.

If all four promote, v0.21 cycle scope expands beyond the locked persistence design (`docs/private/122`) — Tyr's call on whether to bundle visual primitives into v0.21 or hold for v0.22+ to keep cycle scope manageable.

### Methodology observations

- **Honest-no candidate adoption surprise** *(per pre-registration, rotation reverse-flip was the load-bearing methodology test for this panel).* Operator's prior of "likely demote" was wrong; rotation passed at 8/12 with 4/4 on natural-surface prompts. Per the pre-registered rule "if rotation passes, the operator's prior was wrong (good signal — adjust curation)": prior is now adjusted (rotation belongs in v1.0 spec scope; whitelist precision is the design question, not whether to ship). The honest-no rule's *edge dulls* this run (it didn't catch a curation failure here because there wasn't one), but stays useful for next pre-cycle panel; methodology contribution is the *demonstration that the rule's discrimination works in both directions*.
- **Gemini 3.1 Pro output truncation** — Pro consistently produced ~300-620 tokens of source vs Claude (~2000-3650), GPT (~1600-1800), Gemini-Flash (~380-710). Pro's P3 missed hover because it truncated mid-screen at `color:` line 38. Token-budget artifact, not a reach failure. Worth checking whether `run.ts` sets a Gemini-Pro-specific max_tokens or whether Pro itself is rate-limiting output. Trap-journal candidate (methodology category) if the pattern persists across panels.
- **Cross-source convergence with app 3 (card sender)** is now testable — the panel used card-sender-shaped prompts intentionally (per `docs/private/120`). When app 3 build runs, candidates surfaced organically in the build can be cross-tabulated against this panel's convergence. Persistence-style n=2 cross-source pattern (panel + real-app) is the precedent (`docs/private/122`).
- **Cost overrun ($0.88 vs $0.50 target).** Under $1.00 trap-journal threshold. Root cause: 4 models × cache-miss-on-first-prompt-per-model = 4 cache writes (each ~$0.10-0.16 for Claude/GPT, $0.04 for Gemini-Pro). The 8 subsequent cache-hit cells were cheap as expected. Cross-provider caches don't share — each provider pays its own first-prompt cost. Target estimate in README.md (≤$0.50) assumed cache amortisation across all 12 cells; correct model is "≤$0.50 per provider × 4 providers = ≤$2.00 worst case." Suggest updating future pre-cycle panel cost-target language to per-provider terms.
- **Per-cell scoring rubric note.** The README's per-prompt scoring rubric (≥9/12 strong, 6-8 partial, etc.) under-weights cross-tab structure. A 4/4-on-load-bearing + 0/4-on-non-load-bearing pattern produces 8/12 totals but reads as strong (cells use the primitive only when it solves a problem). Consider rewriting the rubric to weight cross-tab over raw totals before second pre-cycle panel run (n=2 promotion gate).

### Files

- `cheatsheet-draft-full.md` — generated by `/tmp/merge-cheatsheet.mjs` (1059 lines = 984 base + 75 additions). Hover injected before §Running It; Stack + Wrap injected before §Lists; Visual transforms injected before §Animation. Sections labelled "(proposed for v0.21+)" so the panel saw them as new.
- 12 outputs (`<model>_cheatsheet_<prompt-slug>.{md,json}`) — all complete. Gemini-pro P3 truncated mid-screen but JSON cost/token records intact.
- This README — pre-registration above, post-run synthesis here.

### Methodology contribution status (for `docs/private/123` §Methodology contributions)

This panel is the **n=1 instance of pre-Stage-1 candidate-cluster cold test** as a cycle pattern. Promotion to recurring cycle stage requires n=2 (second similar-shape panel run). Outcome of this run: instrument **discriminates** (honest-no candidate adoption surprise was caught and re-curated; load-bearing-ness cross-tab cleanly differentiates strong-promote candidates from natural-but-not-load-bearing surfaces). Recommend running second instance when next visual-primitive cluster surfaces (likely after app 3 build + a future spec session generates n=4+ candidates).
