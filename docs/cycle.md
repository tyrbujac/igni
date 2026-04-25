# Igni development cycle

How spec changes flow through the project. Each stage has a named command and a clear human checkpoint.

This is the canonical cycle for shipping spec changes. It evolved through v0.7–v0.13; the v0.13 ship (commits `8499bdd` … `a7cca4f`) is the cleanest end-to-end example. Future spec work — and any AI assistant working on the project — should follow this cycle rather than reinventing it per session.

## The 9 stages

| # | Stage | Command / artefact | Output | Human checkpoint? |
|---|---|---|---|---|
| 1 | **Spec edit / design note** | manual | design note in `docs/private/`, spec changes on a branch | — (author work) |
| 2 | **Pre-implementation design review** | `npx tsx tests/runner/cold-test.ts --prompts <design-review-prompts> --no-grade --no-spec` | `tests/v<X.Y.Z>-design-review/` per-model `.md` + `.json` | ✓ read findings, decide which to act on |
| 3 | **Spec tweak** | manual (act on review feedback, or skip) | revised spec | — |
| 4 | **Implementation** | manual; `npm run regen-snapshots` after codegen change | `transpiler/src/` + new `transpiler/examples/...igni` + regenerated snapshots | — |
| 5 | **Test — diff + visual** | `npm test` (transpiler) + `igni run <project-dir>` | green tests + visual confirmation | ✓ visually verify rendering |
| 6 | **Stage 3 — behavioural cold test** | `npx tsx tests/runner/cold-test.ts --spec <cheatsheet> --prompts <stage3-prompts>` | `tests/v<X.Y.Z>-stage3/` with per-cell outputs + transpile grades | ✓ score against pre-registered thresholds (in design note) |
| 7 | **Post-ship spec critique** *(optional, recommended after substantive changes)* | `npx tsx tests/runner/cold-test.ts --prompts <critique-prompts> --no-grade --no-spec` | `tests/v<X.Y.Z>-spec-critique/` | ✓ decide which findings warrant a docs patch |
| 8 | **Synthesis** | manual; `npx tsx tests/runner/summarize.ts <panel-output-dir>` produces a draft | `docs/private/NN_v<X.Y.Z>_postship.md` (chronological research record) | — |
| 9 | **Update spec / docs patch** | `npx tsx scripts/new-spec-version.ts <X.Y.Z+1>` (automates spec move + version bump) | new spec version + CHANGELOG entry | — |

Stages 2, 4, 6, 7 use the runner (`tests/runner/run.ts`); the `cold-test` wrapper bundles the multi-model invocation. Stages 1, 3, 4, 8, 9 are author work with no separate panel review.

## Where each stage lives in this repo

- **Stage 2 — design review.** Canonical: `tests/v0.13-design-review/` (3 models read the design note before any code).
- **Stage 6 — Stage 3.** Canonical: `tests/v0.13.0-stage3/` with `Stage3_Summary.md` (4 models, pre-registered threshold check).
- **Stage 7 — spec critique.** Canonical: `tests/v0.13.0-spec-critique/` (post-ship, reads the *shipped artefact*, distinct from stage 2).
- **Stage 8 — synthesis.** Canonical: `docs/private/91_v0130_postship.md`.

## Methodology notes

**Stage 0 (skippable).** A pre-ship cold-test stage that measures design *uncertainty* — competing shapes both have reasonable priors and you need data before committing. **Skippable when prior is strong.** v0.13's `max_width:` deliberately skipped Stage 0: six prior token-based primitives all adopted ≥95% on cheatsheet introduction; a seventh would confirm a near-certainty, not measure anything. *"Stage 0 is for uncertainty, not ceremony."* See `docs/private/79_v013_max_width.md` §Decision for the full framing.

**Stage 3 pre-registration.** Before stage 6 runs, the design note must specify (a) the model panel, (b) the cheatsheet tier used, (c) pre-registered thresholds (e.g. 4/4 ship holds, 3/4 soft pass, ≤2/4 reopen). Pre-registration prevents post-hoc threshold-shifting. See `docs/private/79` §Stage 3 attribution and `tests/v0.11.4-stage3/Stage3_Summary.md` for templates.

**When to add a post-ship critique (stage 7).** Recommended for substantive prose changes (a new layout primitive, a reactivity rule clarification, anything that adds non-trivial new spec text). Not necessary for minor edits or pure-implementation changes. Stage 7 reads the *shipped artefact*; it's a teachability check, distinct from stage 2 which reviews the design *intent*.

**Chat-UI experiments (off-path).** Pasting the spec into Claude.ai / ChatGPT for cheap intuition is fine, but is **not** a citable stage. Rule of thumb: chat-UI for cheap intuition; promote to API panel before acting; archive locally in `docs/private/` for substance even when uncitable. See `docs/private/92_chatui_creative_audience.md` for a worked example (the audience-scope finding that motivated the v1.0 criterion-4 reshape).

## Checkpoints

Human review fits at the end of stages **2, 5, 6, 7**. Other stages are author work. Don't skip checkpoints — they're where the cycle's quality compounds.

## Pointers

- `CLAUDE.md` "Working on the spec with Tyr" — references this doc.
- `ROADMAP.md` Process notes — references this doc.
- `tests/runner/README.md` — runner harness (per-model invocation).
- `docs/private/79_v013_max_width.md` — v0.13 design note, canonical example of stages 1–7 pre-registered.
