---
name: version-bump
description: Use this skill when shipping a new Igni spec version — running the version-bump script, writing the Changes-from paragraph + CHANGELOG bullets, regenerating SYNC markers, updating ROADMAP "Recently shipped" + Stream 3 status, and crafting the `ship(vX.Y.Z):` commit. Triggers on phrases like "ship v0.19.0", "bump the version", "fork the spec to vX.Y.Z", "archive v<old>", "regenerate SYNC markers", "promote next milestone after ship", "version bump after implementation", or when the user is at stage 5 / stage 9 of the spec-iteration cycle. Do NOT load for spec design or panel runs (use `spec-cycle`), trap-journal walks (use `trap-journal`), Figma hand-translation (use `figma-translation`), or for ordinary feature work that doesn't fork the spec.
---

# Version-bump reference

Stage 5 (implementation) and stage 9 (roadmap update) of the spec-iteration cycle (`docs/cycle.md`) bundle a recurring sequence: fork the spec trio, archive the old, write the prose, regenerate SYNC markers, update CHANGELOG + ROADMAP, commit. Most of the file shuffling is scripted; the prose, scope decisions, and ROADMAP routing are human work.

Top-level rules already covered by CLAUDE.md: SYNC-marker regions are not editable by hand (line ~76); the spec budget is a tax on LLM learnability (don't pad CHANGELOG with non-spec items); never overwrite a snapshot version. This skill operationalises the sequence and points at canonical sources rather than restating them.

## The script

```bash
npx tsx scripts/new-spec-version.ts <X.Y.Z>
```

Run from a clean working tree on a branch (the script doesn't gate on this; you should). What it does, per its own usage block:

1. Validates `X.Y.Z` and that `spec/v<X.Y.Z>.md` doesn't already exist.
2. Detects the current canonical version (highest `vN.M.P.md` in `spec/`).
3. `cp spec/v<current>.{md,-cheatsheet.md,-micro.md}` → `spec/v<X.Y.Z>.{...}`.
4. `git mv spec/v<current>.{...}` → `spec/archive/v<current>.{...}`.
5. In the new spec/cheatsheet/micro: bumps `# heading` version, `**By Tyr | DD/MM/YY |**` byline date (today, UK format), replaces the existing **Changes from v<previous>:** paragraph with a TODO placeholder.
6. Inserts a `## v<X.Y.Z> — <ISO date>` placeholder under CHANGELOG's `## Unreleased` section, anchored before the first existing `## v…` block.
7. Runs `scripts/sync-docs.ts` to regenerate SYNC markers across CLAUDE.md, README.md, ARCHITECTURE.md, transpiler/examples/GALLERY.md.

If the script's CHANGELOG anchor regex misses (e.g., the file structure changed), it logs a warning and continues; insert the placeholder by hand.

## What's left for the human (after the script)

| Step | File | Notes |
|---|---|---|
| Write the **Changes from v<old>** paragraph | `spec/v<new>.md` (and -cheatsheet, -micro) | One short paragraph; cite design notes, panels, the trigger that drove the version |
| Write the CHANGELOG entry | `CHANGELOG.md` | Replace the placeholder; structure below |
| Cheatsheet + micro updates | `spec/v<new>-cheatsheet.md` + `-micro.md` | Where the ship is docs-iteration or includes new syntax surface |
| Transpiler changes | `transpiler/src/*` + `transpiler/examples*/` | Parser + codegen + new positive/negative fixtures; `npm test` must be green before commit |
| ROADMAP — Recently shipped | `ROADMAP.md` | Append a session entry to "Recently shipped" with date, scope, evidence (panel costs, test counts, commit hashes) |
| ROADMAP — Stream 3 status | `ROADMAP.md` | Move the candidate from Stream 3 to "shipped" or "Recently shipped" framing; update Next milestone if the active chunk just shipped; promote the next candidate from Future when threshold met |
| Commit | — | `ship(vX.Y.Z): <one-line summary>` (see below) |

### CHANGELOG entry shape

```
## v<X.Y.Z> — YYYY-MM-DD

<One-paragraph headline: what shipped, with the cycle-arc context — Stage 1 / 2 / 0 / 3 references, Trigger A fires if any, soft-fail+patch if any.>

### Added
- **Feature**: description (cite design note `docs/private/<n>`, panel `tests/v<X>-stage<N>/`, prior-version origin).

### Changed
- **Surface**: description (cite the precedent that's evolving).

### Methodology
- **Pattern observation**: what this cycle taught about the cycle itself.

### Test count / spec ship
- `npm test` M/M green (was N → M; cite new fixtures).
- End-to-end verification: `flutter test` / `igni run` on canonical example.
- `spec/v<old>` archived; `spec/v<new>` shipped.
- SYNC markers regenerated.
```

Sections are optional — Methodology often appears for cycles with notable findings; small docs-only ships may have only Changed + Test count. Match the recent CHANGELOG entries (`v0.17.0`, `v0.18.0`) for voice.

### Commit shape

```
ship(vX.Y.Z): <one-line topic — feature, plus what landed alongside>

<one-paragraph body explaining the cycle path: Stage 1 doc, Stage 2 verdict + Trigger A if any, Stage 0 attempts + patches, implementation slice, end-to-end verification, test count.>

<bullet list of files / scopes that changed>

<methodology note if the cycle taught something — Trigger A, soft-fail+patch, framework-shaped adaptation.>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

`ship(vX.Y.Z):` is the canonical prefix since v0.14; the script's suggested `feat(spec):` predates this convention — use `ship`. Reference recent ships: `f33827e` (v0.18.0), `244cb14` (v0.17.1), `72cdbb4` (v0.17.0).

## Order of operations

1. Clean working tree on a branch (or main if you're confident).
2. Run `npx tsx scripts/new-spec-version.ts <X.Y.Z>`.
3. Write the **Changes from v<old>** paragraph (spec + cheatsheet + micro — same string, three files).
4. Replace the CHANGELOG placeholder with real bullets.
5. Make any transpiler / fixture changes the version requires.
6. Run `npm test` in `transpiler/` — must be green before commit.
7. Update ROADMAP: Recently shipped session entry; Stream 3 / Next milestone updates.
8. Re-run `npx tsx scripts/sync-docs.ts` if you edited content that drives a SYNC marker (test count, example count, latest-spec-changes paragraph).
9. Review the diff (`git status`, `git diff --stat`).
10. `git add -A` (or selective `git add` if you want to keep some local work uncommitted).
11. `git commit` with the `ship(vX.Y.Z):` shape above.
12. Push when Tyr greenlights — do not push automatically.

## SYNC markers

Per CLAUDE.md (line ~76): never edit content inside `<!-- SYNC:name -->...<!-- /SYNC:name -->` regions. The script invokes `sync-docs.ts` once at step 7 of the script (after the CHANGELOG placeholder is inserted, before next steps). Re-run sync-docs by hand if you later edit:

- Test count → `<!-- SYNC:total-tests -->`
- Example count → `<!-- SYNC:example-count -->`
- Latest-spec-changes paragraph → `<!-- SYNC:latest-spec-changes -->`
- Any version reference outside the script's reach (rare; the script regex catches `v<old>` everywhere in the new spec files)

## The "partial" marker

When a spec version ships ahead of transpiler coverage, mark the CHANGELOG entry as `partial` and prioritise transpiler catchup before stacking another spec change. Reference case: v0.12 → v0.12.1, where v0.12's `theme:` shipped 2026-04-22 without transpiler; v0.12.1 the next day surfaced a hyphen-vs-`TokenType.Minus` lexer conflict. Surfacing implementation-level blockers at catchup time is expected, not pathological — the rule is to let catchup complete before the next spec ship. Already pinned in the `spec-cycle` skill pitfalls; don't restate, just apply.

## Where judgement lives

Per `docs/private/104_automation_principle.md`: file shuffling, regex updates, sync-docs invocation are plumbing. Judgement stays human:

- **Prose** — the Changes-from paragraph, CHANGELOG bullets, commit message all require synthesising what changed and why, citing the right evidence (design notes, panel results, prior-version origins).
- **Scope decisions** — partial marker calls; what gets a Methodology section vs not; whether a docs-iteration warrants a full version bump or a `.X` patch increment.
- **ROADMAP routing** — moving Stream 3 candidates to "shipped"; promoting the next candidate from Future; deciding whether the current ship closes the active Next milestone or just makes progress within it. (The promotion-threshold rules are in the `spec-cycle` skill — re-read those before promoting.)
- **The commit body** — what's worth saying about the cycle path; which methodology observations belong here vs in a CHANGELOG Methodology section vs in a separate trap-journal entry.

The script gets you a green-field scaffold; the skill is what makes the ship coherent.

## When this skill applies

Running the version-bump script. Writing the Changes-from paragraph + CHANGELOG entry. Updating ROADMAP after a version ships. Crafting the `ship(vX.Y.Z):` commit. Verifying SYNC markers picked up the new version everywhere they should.

When this skill does NOT apply: spec design or panel runs (use `spec-cycle`), Stage 2 panel synthesis (use `stage-2-review`), trap-journal walks (use `trap-journal`), Figma hand-translation (use `figma-translation`), or any work before the cycle reaches stage 5 / stage 9.
