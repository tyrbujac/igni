---
name: trap-journal
description: Use this skill when walking the trap journal after an `igni run` session, real-app exercise, or panel run — categorising what surprised you and routing each item to its destination. Triggers on phrases like "walk the trap journal", "log a trap", "categorise this surprise", "route this finding", "what category does X go in", "after igni run what now", or when the user opens `docs/private/trap-journal.md` to add an entry. Also loads when a session surfaces a bug, error-message friction, or unexpected source-pattern behaviour and the next step is "where does this go." Do NOT load for spec design (use `spec-cycle`), Stage 2 panel synthesis (use `stage-2-review`), Figma translation (use `figma-translation`), or general roadmap edits unrelated to a fresh trap surface.
---

# Trap-journal walk reference

The journal at `docs/private/trap-journal.md` is an append-only structured log of "what surprised the project." Every `igni run` session, real-app exercise, and panel run is a chance to add entries. Without the walk, traps evaporate and the next session relearns the same lesson.

Top-level rule lives in CLAUDE.md (line ~42, "After every `igni run`, walk the trap journal"). Cycle context lives in `docs/cycle.md §Trap journal` (Stage 5 follow-up + the routing table). This skill covers the *discipline* — how to write entries, how to route them, when to refresh the aggregate.

## The walk

After every `igni run` session (or panel run, or real-app translation), ask:

- Did the transpiler do something unexpected? (parser rejected valid syntax, codegen wrong, runtime crash on legal Igni)
- Did the source pattern fight me? (had to work around the language to express the obvious thing)
- Did an error message mislead, or fail silently?
- Did a tool/CLI surface friction (`igni run`, runner, scaffold)?
- Did a methodology trap surface? (prompt phrasing, panel noise, sample bias)
- Was there friction without a clear shape — friction I felt but can't yet name?

Each yes is a trap row.

## Format

One line per surface:

```
`<YYYY-MM-DD>` | `<category>` | <one-line description, with the exact symptom + root cause if known> | → <route> [+ <route> ...]
```

Multi-route allowed (`→ code-fix + ROADMAP-Imm`). Use absolute dates in `YYYY-MM-DD` — no relative dates. Append at the bottom; reverse-chronological reading is fine, but chronological writing is the discipline.

## Categories and routes (closed sets)

Both lists are documented in the journal file's own header (`docs/private/trap-journal.md` lines 7–31). Don't re-state them here. The header rule "extend cautiously" applies — only add a new category when an existing one would be a clear stretch, and note the addition in commit text.

## Routing judgement (the small art)

The routing table in `docs/cycle.md §Trap journal` is canonical for the broad shape. Common patterns from the journal:

| Trap shape | Route(s) |
|---|---|
| Transpiler bug (parser rejects valid, codegen wrong, runtime crash on legal Igni) | `code-fix` + new fixture in `examples/` or `examples-errors/` + `ROADMAP-Imm` if the fix needs design first |
| Source pattern that surprises a careful author | `cookbook` recipe + `memory` (assistant-side avoidance) |
| Spec gap — language can't express the user's natural intent | `design-note` in `docs/private/<n>` + `ROADMAP-S3` |
| Error-message clarity / silent-failure | `code-fix` (better message + fixture pinning the better message) |
| Tutorial / docs drift | `code-fix` (`spec-patch` for spec/cheatsheet/tutorial; not the same as a runtime spec change) |
| Methodology trap (prompt phrasing, panel noise) | `methodology` (logged as note) + `design-note` if pattern recurs |
| Friction without a clear shape yet | `deferred` — log here only; or `docs/private/<n>_observations.md` waypoint until shape emerges |

Multi-destination routing is the norm, not the exception. A real bug almost always pairs `code-fix` with a roadmap entry or methodology note.

## The 5-minute rule

Write the row, route, move on. No essays. The journal is a *signal accumulator*, not a backlog or an investigation log:

- Investigation goes in `docs/private/<n>_<topic>.md` (next integer prefix per CLAUDE.md).
- Roadmap items go in ROADMAP.md.
- Cookbook recipes go in `docs/cookbook.md`.
- The journal entry just *names* the surface and *points* at where the work lands.

If you find yourself writing a paragraph in the description column, stop — move the body to a design note and link it.

## Aggregate snapshot

The bottom of the file is a histogram by category plus one paragraph interpreting the lean. Refresh every ~5 new entries (loose, not strict). The judgement call: is the new lean signal or noise?

- Category histogram → **plumbing**. Pure counting. A one-shot script could do it; until the file hits ~100 entries, manual recounting is fine.
- Paragraph interpretation → **judgement**. What does the dominant category tell us about where Igni's quality risks actually live? Is the lean a temporary artefact (one heavy session) or a sustained pattern across sessions?

Per `docs/private/104_automation_principle.md`: never automate the interpretation. The dissertation methodology chapter rests on what the snapshot *means* — that's a human read, not a counter.

## What NOT to do

- **Don't backfill speculatively.** If a trap wasn't actually surfaced (just predicted), it doesn't belong here. ROADMAP Future is the speculation surface.
- **Don't pick categories by proximity.** A "label flashing wrongly" entry could read as `runtime` (display bug), `cli-ux` (confusing feedback), or `methodology` (test-harness blind spot). Pick what *surprised* you. If genuinely ambiguous, multi-route.
- **Don't queue traps for later.** Write the row in the same session as the surface. Memory of what surprised you decays fast.
- **Don't treat the journal as a TODO list.** Routes have already been chosen; the trap is logged. Whether the routed work has happened is ROADMAP / CHANGELOG / commit history's job, not the journal's.
- **Don't recopy the journal's header into entries.** Categories and routes are documented once at the top. Entries reference them by name only.

## Worked examples

From the journal (recent):

- `2026-04-27` | `runtime` | BMI gender-card tap didn't switch selection because GestureDetector defaulted to `HitTestBehavior.deferToChild` | → `code-fix` (codegen.ts emits `behavior: HitTestBehavior.opaque`)
- `2026-04-27` | `methodology` | v0.17.0 Stage 0 strong-passed but surfaced under-taught + stretched-primitive patterns the ship bar didn't distinguish | → `methodology` + `code-fix` (two cheatsheet patches applied same session)
- `2026-04-26` | `cli-ux` | Layout block opener missing `:` silently produced empty layout instead of erroring | → `code-fix` (parser.ts peeks past newline; raises if `Indent` follows) + new fixture

The shape: short symptom + root cause + route. Not a paragraph; not just the symptom.

## Self-trigger (auto-draft, not auto-append)

Load this skill the moment a trap-class event surfaces in a session — don't wait for the user to ask. Don't auto-append to the journal either. **Auto-draft, propose, append on confirmation.** The routing decision is the dissertation contribution per `docs/private/104` — pure auto-append would dilute signal with my own routine mistakes, transient build noise, and routing calls made without Tyr's judgement.

**Pinned proposal format** (matches CLAUDE.md auto-draft bullet — single source of truth):

```
trap detected — confirm/edit/reject?

`<YYYY-MM-DD>` | `<category>` | <description with root cause if known> | → <route>
```

One-word reply approves and Claude appends. Reply with edited row to revise. Reply "skip" to drop entirely.

### What IS a trap

| Pattern | Trap? |
|---|---|
| Transpiler emits wrong Dart / parser rejects valid Igni | ✅ |
| Igni-source pattern fought us / needed a workaround | ✅ |
| Error message had to be read twice or looked up | ✅ |
| Tooling friction needing a workaround or repeated attempts | ✅ |
| Methodology surprise (panel noise, prompt trap, model invented unsupported syntax) | ✅ |

### What is NOT a trap

| Pattern | Why not |
|---|---|
| User asked X; my first attempt was wrong; I fixed it | My mistake — not a trap on the project |
| Build failed on a typo in code I just wrote | Same — routine fix-and-retry, not signal |
| Tyr reasoning imperfectly mid-discussion and CC correcting | The design conversation working — not a trap |
| Already-known shape re-encountered (e.g. another empty-layout-collapse) | Already in the journal; only log if it teaches something *new* |
| Bug I'm speculating about but haven't actually surfaced | Skill rule: no backfilling speculatively. ROADMAP Future is the speculation surface. |

When in doubt: did this *surprise* the project (not just me)? If yes, propose. If it'd surprise no one but my keystroke history, skip.

## When this skill applies

Walking the trap journal after any session. Adding a new entry. Deciding category + route for a fresh surface. Refreshing the aggregate snapshot. Coaching the user through their first journal walk.

When this skill does NOT apply: spec design or stage planning (use `spec-cycle`), Stage 2 panel synthesis (use `stage-2-review`), Figma hand-translation (use `figma-translation`), CHANGELOG / ROADMAP edits during a version ship (use `version-bump`), or any work that doesn't start with a fresh trap surface.
