---
name: spec-cycle
description: Use this skill when working on Igni's spec-iteration cycle — designing a new spec primitive, drafting a design note in docs/private/, running Stage 0 / Stage 2 / Stage 3 cold-test panels, deciding whether to skip Stage 2, or interpreting panel-run results. Triggers on phrases like "design a new spec primitive", "run Stage 0", "Stage 2 panel critique", "Stage 3 ship validation", "write a design note", "what's the next stage of the cycle", or when the user opens docs/private/ to add a new design note. Do NOT load for non-spec-cycle work (cookbook entries, transpiler-only fixes, version bumps that don't touch spec syntax).
---

# Igni spec-iteration cycle reference

## The cycle (per `docs/cycle.md`)

Nine named stages, each with human checkpoints:

1. **Identify signal** — cold-test or panel review surfaced a gap (4/4 or 3/4 convergence). Logged in ROADMAP Stream 3.
2. **Stage 1 — design draft** — `docs/private/<n>_<name>.md` with proposed shape, alternatives rejected, open questions, recommended path. Tyr decides; iterate.
3. **Stage 2 — design review (panel critique)** — 3-frontier-model panel critiques the design note via `tests/runner/cold-test.ts --no-spec --no-grade`. 5-question framework; synthesise convergence (3/3 = patch, 2/3 = consider, 1/3 = log). **Skippable** when shape is well-precedented and signal is structural (per v0.14.1 precedent — see §When to skip Stage 2 below).
4. **Stage 0 — cheatsheet draft cold-test** — 3 frontier models × 3 prompts against `cheatsheet-draft.md`. Pre-registered ship-bar (typically 3/3 or 4/4 P1+P2). Soft-fail = patch teaching, re-run; hard-fail = reopen design.
5. **Implementation** — fork spec/cheatsheet/micro to next version; parser + codegen + fixtures + `npm test`; archive prior version. CHANGELOG entry.
6. **Stage 3 — ship validation** — 4-model panel (frontier + flash-lite noise tier) × same prompts against shipped cheatsheet. Confirms cheatsheet teaches the new feature post-implementation.
7. **Critique / Synthesis** — `tests/v<X>-stage3/README.md` documents adoption rates, methodology traps, cumulative cost.
8. **Patch** — Tier-A items from synthesis; Tier-B/C deferred to next docs-only iteration.
9. **Roadmap update** — Stream 3 entry from "active candidate" → "shipped"; promote next candidate.

## Pre-registered ship bars

Lock these in the design note BEFORE running panels. Mid-run revisions invalidate the empirical signal.

- **Stage 0:** 3/3 on P1+P2 (canonical adoption); 2/3 on P3 (no over-declaration).
- **Stage 3:** 4/4 on P1+P2; 3/4 on P3.

If a prompt produces unexpected adoption that suggests the prompt itself is unclear, log it as a trap-journal item (`docs/private/trap-journal.md`) — don't edit the prompt.

## When to skip Stage 2

Stage 2 catches *shape uncertainty*. Skip when:

- The shape mirrors existing syntax (e.g., `theme: color:` mirrors `theme: text:` shipped in v0.12.1).
- Empirical evidence already locks the choice (e.g., v0.14.1's `bind: shared.X` widening had 11/14 panel cells producing the same shape — no shape question to critique).
- The "alternative shapes" are all rejected by Path C structurally.

When in doubt, run Stage 2 — it's cheap (~$0.30) and catches unknown-unknowns. The v0.14.1 precedent is the single canonical "skip Stage 2" case; treat it as an exception, not a default.

## Threshold rules for promotion

ROADMAP Stream 3 candidates promote to active when:

- **4/4 cold-test signal:** strongest possible — design note opens immediately.
- **3/4 signal:** strong — design note opens; pre-register ship bars.
- **2/4 panel + cold-test:** compounding — promote after a second domain confirms.
- **1/4 single-model raise:** Tier C; log only, wait for compounding signal.

For docs-only iterations (e.g., v0.14.2 cheatsheet pin pass), the threshold is lower — clarifications can ship with weaker signal because they don't add spec budget.

## Common pitfalls

- **Don't speculate spacing tokens** — let real Figma Variables data drive the rungs. (Per v0.15.1 hand-translation gate finding.)
- **Don't pre-decide Q-questions before hand-translation** — Path C demands empirical resolution, not abstract argument.
- **When a spec version ships without transpiler coverage, mark `partial` in CHANGELOG and prioritise transpiler catchup before stacking another spec change.** (v0.12 → v0.12.1 reference case.)
- **Never delete or overwrite a snapshot version.** Archive to `spec/archive/` immutably.

## Templates

- Design note format — see `docs/private/95_v014_timer_primitive.md` (v0.14 timer, three-revision arc) or `docs/private/98_v0150_theme_color.md` (v0.15.0 theme color, post-pushback arc).
- Stage 2 prompts — see `tests/v0.14-design-review/prompts.md` or `tests/v0.15.0-design-review/prompts.md` (5-question framework + embedded design note).
- Stage 0 / Stage 3 prompts — see `tests/v0.15.0-stage0/prompts.md`.
- Synthesis README — see `tests/v0.15.0-design-review/README.md` (Stage 2 synthesis with convergence tables) or `docs/private/101_v0150_coldtest_synthesis.md` (Stage 0/3 synthesis).

## Operational

- **Cost expectations:** Stage 2 ~$0.30, Stage 0 ~$0.27, Stage 3 ~$0.28. Budget ~$0.85 per spec change.
- **Wallclock:** sequential mode ~10–15 min per stage. Parallel mode (when shipped — `--parallel` flag) ~2–3 min per stage.
- **Reproducibility:** sequential mode is canonical for ship-validation runs; parallel for iterative work. Cite which mode in synthesis docs.
- **Automation principle (`docs/private/104`):** automate plumbing only. Synthesis (convergence-counting, patch decisions, "honest no" detection) stays human-mediated.

## When this skill applies

Designing new syntax. Running panels. Writing design notes. Deciding skip-Stage-2. Interpreting cold-test results. Updating ROADMAP Stream 3 status. Drafting Stage 0/2/3 prompts.

When this skill does NOT apply: cookbook entries (different audience), transpiler-only fixes (no spec change), version-bump mechanics (use the `version-bump` skill), trap-journal walks (use the `trap-journal` skill), CHANGELOG entries (covered by `version-bump`).
