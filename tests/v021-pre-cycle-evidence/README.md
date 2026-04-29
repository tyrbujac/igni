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

## Synthesis (post-run)

*To be filled after panel run. Structure follows v0.20-stage0 README convention: Verdict header, Convergence-by-prompt sub-sections, per-candidate decision (promoted/demoted), routing decisions for each.*
