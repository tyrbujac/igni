# Igni — notes for AI assistants

Guidance for Claude and other AI assistants working on the Igni language project. Human-facing architecture lives in [`ARCHITECTURE.md`](ARCHITECTURE.md); read that first if you don't already know the repo. Project summary is in [`README.md`](README.md).

**Positioning.** *Designs that translate, not redesign.* A UI language whose primitives match Figma's auto-layout vocabulary; the canonical user is a designer-engineer + LLM pair authoring Igni from Figma source. The AI-assisted-creator framing is the parent category; this is its concrete instance. See `docs/private/97_figma_to_igni_workflow.md` for Path C scope and v0.15 expansion plan.

**Status: transpiler stage.** The TypeScript-to-Dart transpiler covers most of the <!-- SYNC:version -->v0.19.0<!-- /SYNC:version --> spec. The project is a versioned markdown spec, a cold-LLM test suite, and a working transpiler that compiles `.igni` to Dart/Flutter. *Originally named Rocket (v0.2–v0.3.1), renamed to Igni at v0.3.2.*

## Igni at a glance

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons end the line that opens one. Lowercase built-in primitives (`label`, `button`, `layout`, `image`, `input`, `toggle`, `slider`, `icon`, `spinner`, ...), PascalCase for user-defined components and screens. No imports, no `useState`, no controllers, no boilerplate.

## Non-negotiable design principles

If a proposal violates one of these, it's wrong by definition — push back instead of accommodating.

- **One way to do everything.** Every alternative or alias is a branch where an LLM can guess wrong. If a feature has two valid forms in your proposal, pick one.
- **Indentation, no brackets.** No braces. No parentheses on component invocation (parentheses for expression grouping are fine). No inline conditionals. Block structure is whitespace plus colons.
- **Max nesting depth 4** for `layout` / `screen` / `component` blocks. Conditionals and loops don't count toward the limit. Custom components reset the counter.
- **No magic.** If something happens at runtime, the cause should be visible in the source. The lexical reactivity rule is the only sanctioned "magic": *each screen re-evaluates when any variable it references is reassigned.*
- **The spec is a budget, not a backlog.** Every new keyword or block type is a tax on zero-shot LLM learnability. **Optimise for rule simplicity, not output verbosity** — in an AI-assisted coding world, models write the boilerplate, so what matters is that the rules are simple enough for the model to learn from the spec.
- **Components contain components via indentation, never as arguments.** This is what keeps the no-parens invocation style unambiguous. Wrapper components use the `body` keyword (v0.5) to render the caller's indented content.
- **Arguments to screens and components are immutable.** To edit a value passed in, declare a local variable inside the body.
- **UI primitives only render in screen or component bodies, never inside a function.** Functions mutate state; layouts render. The v0.3 → v0.3.1 patch fixed a spec example that violated this — don't reintroduce it.
- **List elements cannot be mutated in place.** Updates flow through reassignment of the whole list. Use `replace(list, target, new)` for the common single-item case (v0.5) or the `each` rebuild loop for complex updates.
- **Cross-screen function calls are NOT allowed.** Functions defined in one screen are not visible to other screens connected by `navigate to`. For cross-screen state sharing, use the `shared:` block (v0.5).
- **Shared state lives in `shared:` blocks accessed as `shared.X`** (v0.5). The `shared.` prefix is the visible coupling marker — there are no hidden globals. Same lexical reactivity rule applies as for local state.

## Working on the spec with Tyr

- **Tyr is the sole decision-maker.** Propose changes, present tradeoffs, wait for confirmation. Never edit the spec on his behalf without explicit approval.
- **Follow the spec-iteration cycle in [`docs/cycle.md`](docs/cycle.md)** — 9 stages (design → review → ship → Stage 3 → critique → synthesis → patch) with named commands and human checkpoints. v0.13's ship (`docs/private/91`) is the canonical example. Don't reinvent the cycle per session.
- **Skill index for cycle-adjacent work:** `spec-cycle` (design + Stage 0/2/3 panels), `trap-journal` (post-`igni run` walks), `version-bump` (shipping a new spec version), `figma-translation` (Path C hand-translation), `stage-2-review` (panel critique synthesis). Each loads on description-match; `.claude/skills/<name>/SKILL.md` for details.
- **After every `igni run`, walk the trap journal** (`docs/cycle.md` §Trap journal). Every surprise — transpiler bug, layout collapse, Igni-source pattern that fought you, misleading error, surprising workaround — gets routed to ROADMAP, cookbook, saved memory, or a design note depending on its shape. Skipping this means the next session relearns the same trap. The Connect Four exercise's empty-layout-collapse + wrap-height-bug were caught only because the journal ran; both are now in the cookbook.
- **When a trap surfaces *during* a session, draft and propose immediately — don't wait for end-of-session.** Same trap definition as the post-`igni run` walk: bugs, misleading errors, source patterns that fight the obvious shape, methodology surprises. Don't auto-append; the routing decision is the dissertation contribution per `docs/private/104`. Propose format is fixed:
  ```
  trap detected — confirm/edit/reject?

  `<YYYY-MM-DD>` | `<category>` | <description> | → <route>
  ```
  One-word reply approves; edited row revises; "skip" rejects. See `.claude/skills/trap-journal/SKILL.md` for the heuristic and the "what's NOT a trap" exclusions.
- **For exploratory questions, give 2-3 sentences and the main tradeoff** — not an essay. Tyr will ask for depth if he wants it.
- **For structural changes, use the plan-then-execute pattern**: explore, propose a plan, get approval, then write. Plan mode is appropriate for non-trivial spec edits.
- **Never delete or overwrite a snapshot version.** Preserve them as historical artifacts in `spec/archive/`.
- **`docs/private/` is an append-only chronological research record.** Each new entry takes the *next* integer prefix — run `ls docs/private/ | sort -V | tail -5` to find the highest in use, then increment. Never backfill low numbers, never reuse, never pick a number that looks "thematically right." Numbering is the timeline; order is the history. **Exception:** `docs/private/trap-journal.md` is a structured append-only log without integer prefix — entries are date-prefixed rows, not individual files. Add new traps at the bottom; aggregate snapshot at the bottom is updated periodically.
- **Automation principle — plumbing yes, judgement no** *(see `docs/private/104_automation_principle.md`)*. Before automating any part of the cycle, ask: "would automating this make the dissertation methodology chapter weaker?" If yes, don't. The synthesis layers (cold-test convergence-counting, patch-vs-defer decisions, "honest no" detection) are where the dissertation contribution lives; keep them human-mediated. Plumbing (file shuffling, request fan-out, output formatting) is fair game.
- **Teach the language first; don't open with release notes.** The top of a canonical spec should explain what Igni is, what it is for, and why its design helps both humans and LLMs before diving into version history.
- **Keep the opening stable across future versions.** Prefer: positioning, status, one-line current-version delta, then `Hello World`. If older version changes matter, put them in `CHANGELOG.md`, not in a stack of top-of-file historical summaries.
- **Keep future specs clean by default.** If you spot a readability or positioning improvement to the spec or cheatsheet, propose it to Tyr first and get approval before editing; don't silently "improve" the framing while making unrelated spec changes.
- **Design by trying, not by theorising.** When working on a future v0.X, try to write the hard example in the current spec, hit the walls, and let the walls dictate the additions. This is how every version since v0.3 was designed.
- **Be honest about defects.** If a spec example is structurally wrong, say so directly. The cold test exists precisely to catch what self-review misses.
- **Claude's "honest no" is more valuable than a clever workaround.** If a model correctly identifies a gap and refuses to invent around it, that's the most useful diagnostic signal.
- **The current canonical spec is whichever version the `<!-- SYNC:version -->` marker points to (line 5 above). Work from that file.** See `CHANGELOG.md` for the per-version evolution, `ARCHITECTURE.md` for the supported-feature list, and [`ROADMAP.md`](ROADMAP.md) Stream 3 (signal-ranked) for the active spec backlog. Each new candidate needs its own design note in `docs/private/` before syntax lands.

## Common pitfalls to avoid

- **Don't propose feature flags, backwards-compat shims, or migration paths.** The spec has no users yet — just change it.
- **Don't add a new keyword when an existing primitive can be extended.** That violates the spec budget rule.
- **Don't write Dart, Flutter, React, or TypeScript** in proposals. Only Igni and prose. If you need to demonstrate something, write it in Igni.
- **Don't use brackets, braces, parentheses on component invocation, ternary operators, or string interpolation.** These are explicitly out.
- **Don't bind a `fetch` URL directly to a text input** — that's the v0.5-documented common pitfall. Use the trigger-variable pattern (see Async Data in the spec).
- **When a spec version ships without transpiler coverage, mark it *partial* in `CHANGELOG.md` and prioritise transpiler catchup before starting another spec change.** v0.12 → v0.12.1 is the reference case: v0.12's `theme:` spec shipped 2026-04-22 without transpiler; catchup the next day surfaced a lexer/spec conflict (hyphenated font tokens vs `TokenType.Minus`) that the spec writer hadn't predicted. v0.12.1 resolved it via a snake_case rename rather than bending the lexer. Surfacing implementation-level blockers at catchup time is expected, not pathological; the rule is to let catchup complete before stacking another spec change on top. See `docs/private/84_v0121_font_token_rename.md`.
- **Test transpiler changes by running `npm test` in `transpiler/`.** This runs all <!-- SYNC:total-tests -->123<!-- /SYNC:total-tests --> diff tests automatically. Zero diff = pass. Then browser-test via `igni run` against a test `.igni` file.

## ROADMAP tiering

`ROADMAP.md` tiers tasks by horizon so the current focus is always visible at the top:

- **Immediate** — small unblocking items, <1 day each. Typo fixes, rate fill-ins, design-note logging, docs drift. Clear these before advancing the next milestone.
- **Next milestone** — one primary chunk of active work. When it ships, the next milestone is promoted from Future — promotion is an explicit decision, not drift.
- **Future** — ideas + longer-horizon streams. Unfiltered; may not all be good; signal strength noted where cold tests or reviews have data.

When adding a new task, place it in the tier matching its actual horizon — not the one you wish it were in. If unsure, default to Future and let cold-test or human-testing signal promote it.

## SYNC-marker rule

`README.md`, `ARCHITECTURE.md`, and this file contain `<!-- SYNC:name -->...<!-- /SYNC:name -->` regions that `scripts/sync-docs.ts` regenerates from repo state. Do not edit text *inside* any SYNC region by hand — run the script. Editing prose around the markers is fine. Details on which markers exist and when to run the script are in [`ARCHITECTURE.md`](ARCHITECTURE.md) "Keeping docs in sync".

## Tracked open questions (v0.7+ backlog)

Items deferred that will be designed once enough test data accumulates:

- **Optimistic updates with rollback** — needs background requests + post-navigation error surfacing.
- **Forms and validation** — multi-field, cross-field, async validators.
- **Animations and transitions.**
- **Routing patterns** beyond simple navigation: deep links, query params, modal stacks, back-stack management.
- **Theming and dark mode propagation.**
- **Package / module system** for sharing components across projects.
- **Doc-comment syntax** for components and screens.
- **Scroll behaviour** (e.g. scroll-to-bottom on chat append).
- **Named slots** for wrapper components (multiple `body` regions per wrapper) — deferred because single slot covers 90% of cases.
- **Submit modifier on inputs** — currently the trigger-variable pattern handles this.

The current and authoritative list lives at the bottom of `spec/archive/v0.10.0.md`.
