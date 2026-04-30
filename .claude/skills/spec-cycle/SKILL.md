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
4. **Stage 0 — cheatsheet draft cold-test** — 3 frontier models × 3 prompts against `cheatsheet-draft.md`. Pre-registered ship-bar (typically 3/3 or 4/4 P1+P2). Soft-fail = patch teaching, re-run; hard-fail = reopen design. *(See §Stage 0 → Implementation handoff below for the teaching-gap discipline.)*
5. **Implementation** — fork spec/cheatsheet/micro to next version; parser + codegen + fixtures + `npm test`; archive prior version. CHANGELOG entry.
6. **Stage 3 — ship validation** — 4-model panel (frontier + flash-lite noise tier) × same prompts against shipped cheatsheet. Confirms cheatsheet teaches the new feature post-implementation.
7. **Critique / Synthesis** — `tests/v<X>-stage3/README.md` documents adoption rates, methodology traps, cumulative cost.
8. **Patch** — Tier-A items from synthesis; Tier-B/C deferred to next docs-only iteration.
9. **Roadmap update** — Stream 3 entry from "active candidate" → "shipped"; promote next candidate.

**Stage 0 / Stage 2 / Stage 3 vocabulary.** Current practice (v0.15+ cycles) names the cheatsheet cold-test "Stage 0," the design-review panel "Stage 2," and the ship-validation panel "Stage 3." This vocabulary is dominant in trap-journal entries and design notes; `docs/cycle.md`'s 1-9 numbering (where stage 6 is what current practice calls "Stage 3") is documentation-of-record. The two systems coexist; reconciliation is deferred — revisit at the next ship retrospective if the friction surfaces.

## Pre-registered ship bars

Lock these in the design note BEFORE running panels. Mid-run revisions invalidate the empirical signal.

- **Stage 0:** 3/3 on P1+P2 (canonical adoption); 2/3 on P3 (no over-declaration).
- **Stage 3:** 4/4 on P1+P2; 3/4 on P3.

If a prompt produces unexpected adoption that suggests the prompt itself is unclear, log it as a trap-journal item (`docs/private/trap-journal.md`) — don't edit the prompt.

## Stage 0 → Implementation handoff

**Fix Stage 0 teaching gaps before implementation. Don't ship known teaching ambiguities and patch later.**

A Stage 0 strong-pass means the panel reached canonical adoption — but a strong-pass can still surface teaching gaps (cheatsheet contradictions, under-determined rules, examples that contradict the table). Patch those in the cheatsheet draft before implementation begins. The spec/cheatsheet/micro archive together at implementation time (the version-bump skill's stage-9 convention); ambiguities not caught in the draft ship as canonical and are far harder to fix later.

The discipline is: first read of the cheatsheet is when teaching either lands or fails. Panel divergence on a non-load-bearing axis (e.g. assertion-form choice, defensive-mock wrapping) is signal that *something is unclear*, even if every cell still produces canonical syntax. Pin the rule, don't defer.

Precedent: v0.19 Stage 0 (2026-04-28) surfaced a `value_of()` table-vs-example contradiction during a 9/9 strong-pass — table restricted to inputs, example used a screen variable. Panel split 2/3 (`value_of`) vs 1/3 (`seen`); both valid against the example, but the rule was unclear. Patched in cheatsheet draft same session, before implementation.

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

## Cycle status convention

Every design note opens with a single-line status header that gets updated each session:

```markdown
**Cycle status (updated <YYYY-MM-DD>):** <stage> — <one-line current state>. Next: <next stage>.
Sessions to ship: <estimate>.
```

Reading the design note's first line tells you the stage. No separate state file required; the design note IS the canonical record. For multi-workstream cycles (v0.20 has three — A dark-mode, B spacing, C lint-spec-trio), each design note tracks its own state independently. ROADMAP "Next milestone" remains the cross-workstream sequencing summary.

Example, v0.20 dark-mode design note at Session 2 open:
```markdown
**Cycle status (updated 2026-04-29):** Stage 1 design draft opened. Next: Stage 2 panel critique.
Sessions to ship: ~5-6.
```

After Stage 2 lands:
```markdown
**Cycle status (updated 2026-05-06):** Stage 2 panel ran 3/3 HOLD on Q1, 2/3 REFINE on Q2-Q3 with patches inlined. Next: Stage 0 cheatsheet cold-test.
Sessions to ship: ~3-4 remaining.
```

Closed cycles use a final state:
```markdown
**Cycle status:** Shipped 2026-04-28. Final.
```

The line gets edited at session-end as part of the closing checklist below. The "updated" date pins when the state was last touched; missing or weeks-old "updated" dates flag a stalled cycle worth a planning conversation.

## Starting a session

1. Read the current design note's Cycle status line (top of `docs/private/<n>_<name>.md`).
2. Skim trap-journal entries since last session (`docs/private/trap-journal.md`).
3. Check ROADMAP "Next milestone" for cross-workstream sequencing.
4. Confirm working-tree clean: `git status --short`.
5. Confirm baseline green: `npm test` (in `transpiler/`).

If the design note doesn't exist yet, you're at Stage 1 — open it. If the latest Cycle status reads "Stage 1 done; Stage 2 next," you're at Stage 2. The status line is canonical; if you find it stale or contradicted by ROADMAP / trap-journal evidence, fix the status line before doing further work — the convention only pays off if it stays accurate.

## Closing a session

1. Update the design note's Cycle status line: new stage, date, next stage.
2. Walk the trap journal if anything surprising surfaced (per `trap-journal` skill).
3. Commit per session boundary — one focused commit per session-end is the precedent (e.g. commits `e42407d` cleanup pass, `0f9f3b3` scope lock, `afd1de8` methodology pre-draft).
4. Update memory if the session produced load-bearing decisions (scope locks, methodology insights, real-app candidate selection).

## Plan structure rules

Plans describe FORWARD work only. Articulated 2026-04-30 after a single session accumulated 11 streams documenting mostly-completed work — third recurring session-shape structural-discipline failure mode (after version-hygiene + one-version-at-a-time). The rule prevents plans from drifting into session logs.

**Required plan sections:**
- **Context** — why this plan exists; what triggered it; what state it leaves behind. Brief.
- **Streams** — discrete forward work items (≤7 total).
- **Out of scope** — explicitly named exclusions for this session.
- **Verification** — single consolidated section at plan end (not per-stream).

**Per-stream structure (each stream item):**
- **Name** — short imperative ("Open doc 128", "Run Stage 2 panel").
- **Scope** — what specifically gets done; what's NOT done.
- **Trigger** — what kicks this stream off (file edit, panel run, prior stream completion).
- **Files** — paths to modify; (gitignored) markers where applicable.
- **Commit shape** — single-commit message format; or "no commit (gitignored)".

**Anti-patterns:**
- ❌ **Completed work as plan items.** If it's already shipped, it goes in a session log (`docs/private/<n>_session_<date>.md`) or commit-message log — not the plan.
- ❌ **Per-stream verification sections.** Move to plan-level Verification.
- ❌ **Inline methodology cataloguing.** Methodology chapter §4 queue is its own surface (memory + design notes). Plans don't catalogue.
- ❌ **Dependent streams chained mid-plan** (`Stream A → Stream B → Stream C`). If A must finish before B starts, B is a different plan in a future session.

**Length rules:**
- ≤100 lines total.
- ≤15 lines per stream.
- ≤7 streams maximum.

**When plans are exceeded** (>100 lines / >7 streams / mostly-completed-work content): stop, write a session log entry capturing completed work, start a fresh plan next session for the truly-forward residual work.

**Catalogue note (candidate sub-section for methodology chapter §4):** plan-length-discipline is the third structural rule emerged from cycle execution (after version-hygiene + one-version-at-a-time). The meta-pattern itself is dissertation material — *structural discipline emerges from cycle execution, not from up-front design.* n=3 establishes the meta-pattern; promote to a sub-section heading when chapter §4 first-draft session lands (~2026-05-05 per dissertation cadence).

## When this skill applies

Designing new syntax. Running panels. Writing design notes. Deciding skip-Stage-2. Interpreting cold-test results. Updating ROADMAP Stream 3 status. Drafting Stage 0/2/3 prompts. Drafting plans for next-session work (per Plan structure rules above).

When this skill does NOT apply: cookbook entries (different audience), transpiler-only fixes (no spec change), version-bump mechanics (use the `version-bump` skill), trap-journal walks (use the `trap-journal` skill), CHANGELOG entries (covered by `version-bump`).
