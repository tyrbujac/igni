# Igni Language

UI-first language being designed by Tyr (sole author and sole decision-maker). North star: *"Flutter, without the bracket hell"* — same cross-platform power, but code that reads like a design spec. The hypothesis is that LLM accuracy and human readability correlate tightly, so removing the ambiguity that trips LLMs up also makes the language nicer for humans.

**Status: design stage.** No compiler or runtime exists yet. The entire project is a versioned markdown spec plus a cold-LLM test suite that empirically validates each version against multiple frontier models.

*Project history: the language was originally named Rocket and was renamed to Igni at v0.3.2. Spec files in `spec/` are immutable historical snapshots — never edited after they ship. Each new version is a new file.*

## Igni at a glance

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons end the line that opens one. Lowercase for built-in primitives (`label`, `button`, `layout`, `image`, `input`, `toggle`, `slider`, `icon`, `spinner`, ...), PascalCase for user-defined components and screens. No imports, no `useState`, no controllers, no boilerplate.

## Repo layout

```
igni/
├── README.md            # public-facing project summary
├── CLAUDE.md            # this file (notes for AI assistants)
├── LICENSE              # MIT
├── spec/                # all spec versions
│   ├── v0.2.md          # Rocket-era historical
│   ├── v0.3.md          # Rocket-era historical
│   ├── v0.3.1.md        # Rocket-era historical
│   ├── v0.3.2.md        # Igni-era historical (rename only)
│   └── v0.4.md          # current canonical
└── tests/               # cold-LLM test infrastructure
    ├── README.md        # test methodology
    ├── prompts.md       # paste-ready test prompts
    ├── Cold_Test_*.md   # one per app per spec version
    └── v0.3.2_summary.md
```

## Spec files

- `spec/v0.2.md` — Rocket-era historical snapshot. The original draft.
- `spec/v0.3.md` — Rocket-era historical. Adds async data, mutations, screen-internal functions, the lexical reactivity rule, and the *"spec as budget"* and *"three commands to first pixel"* principles.
- `spec/v0.3.1.md` — Rocket-era historical. Last version under the Rocket name. Patches v0.3 with a structurally-correct mutation example, the `icon` primitive, object literals, the no-interpolation rule, and the intrinsic-dimensions carve-out.
- `spec/v0.3.2.md` — Igni-era historical. Rename only — no language changes from v0.3.1.
- `spec/v0.4.md` — **current canonical version.** Adds arithmetic operators (`-`, `*`, `/`), `is X` for arbitrary equality, `null` and `is null`/`is not null`, `+` for list concatenation, `without(list, item)` builtin, `each` in non-rendering contexts, functional list updates, comments (`#`), cross-component function calls, and a reactive re-fetch example. **Every addition is grounded in cold-LLM test data from Calculator, Todo, and Weather apps.**

When proposing spec changes, **work from `spec/v0.4.md` and fork to a new version file** (`spec/v0.4.1.md` for patches, `spec/v0.5.md` for content additions) rather than editing in place. Snapshots are how Tyr tracks design evolution and how cold-LLM tests stay reproducible against a frozen baseline.

## Non-negotiable design principles

If a proposal violates one of these, it's wrong by definition — push back instead of accommodating.

- **One way to do everything.** Every alternative or alias is a branch where an LLM can guess wrong. If a feature has two valid forms in your proposal, pick one.
- **Indentation, no brackets.** No braces. No parentheses on component invocation (parentheses for expression grouping are fine). No inline conditionals. Block structure is whitespace plus colons.
- **Max nesting depth 4** for `layout` / `screen` / `component` blocks. Conditionals and loops don't count toward the limit. Custom components reset the counter.
- **No magic.** If something happens at runtime, the cause should be visible in the source. The lexical reactivity rule is the only sanctioned "magic": *each screen re-evaluates when any variable it references is reassigned.*
- **The spec is a budget, not a backlog.** Every new keyword or block type is a tax on zero-shot LLM learnability. **Optimise for rule simplicity, not output verbosity** — in an AI-assisted coding world, models write the boilerplate, so what matters is that the rules are simple enough for the model to learn from the spec.
- **Components contain components via indentation, never as arguments.** This is what keeps the no-parens invocation style unambiguous.
- **Arguments to screens and components are immutable.** To edit a value passed in, declare a local variable inside the body.
- **UI primitives only render in screen or component bodies, never inside a function.** Functions mutate state; layouts render. The v0.3 → v0.3.1 patch fixed a spec example that violated this — don't reintroduce it.
- **List elements cannot be mutated in place.** Updates flow through reassignment of the whole list. Reactivity tracks variable reassignment, not field-level changes. Verbose but the rule stays simple.

## Validation methodology

The spec is validated with **cold-LLM tests**: paste the current spec into a fresh frontier-model conversation (Claude, Gemini, ChatGPT) and run the test prompts at the bottom of the spec verbatim.

- **The easy case** (Settings screen) is a smoke test. Every UI DSL passes it.
- **The hard case** — paginated list with loading/error states, navigation to a detail screen, and an edit-and-save flow — is the real validator. If the LLM produces compilable Igni on the first try with no invented syntax, the spec is learnable zero-shot. If it invents, those areas need a patch.
- **The comparison case** — write a music player in both Igni and Flutter — quantifies the readability win in line count and nesting depth.

Always run the test suite on every new version. The cold-LLM test caught the v0.3 mutation defect that self-review missed entirely. v0.4 is the first version drafted *from* test data rather than from designer intuition.

## Working on the spec with Tyr

- **Tyr is the sole decision-maker.** Propose changes, present tradeoffs, wait for confirmation. Never edit the spec on his behalf without explicit approval.
- **For exploratory questions, give 2-3 sentences and the main tradeoff** — not an essay. Tyr will ask for depth if he wants it.
- **For structural changes, use the plan-then-execute pattern**: explore, propose a plan, get approval, then write. Plan mode is appropriate for non-trivial spec edits.
- **Never delete or overwrite a snapshot version.** Preserve them as historical artifacts in `spec/`.
- **Design by trying, not by theorising.** When working on a future v0.X, try to write the hard example in the current spec, hit the walls, and let the walls dictate the additions. This is how v0.3, v0.3.1, and v0.4 were designed (the latter two grounded in cold-LLM test data).
- **Be honest about defects.** If a spec example is structurally wrong, say so directly. The cold test exists precisely to catch what self-review misses.

## Common pitfalls to avoid

- **Don't propose feature flags, backwards-compat shims, or migration paths.** The spec has no users yet — just change it.
- **Don't add a new keyword when an existing primitive can be extended.** That violates the spec budget rule.
- **Don't write Dart, Flutter, React, or TypeScript** in proposals. Only Igni and prose. If you need to demonstrate something, write it in Igni.
- **Don't use brackets, braces, parentheses on component invocation, ternary operators, or string interpolation.** These are explicitly out.
- **Don't try to run anything.** There is no build step, no compiler, no test suite (in the unit-test sense). The project is documentation and its empirical validation via cold-LLM tests.

## What this project is *not*

- **Not a Flutter plugin or DSL yet.** The transpile-to-Flutter path is under serious consideration but uncommitted. Don't write code that assumes a compile target.
- **Not an active codebase.** No `package.json`, no `pubspec.yaml`, no build scripts. There's nothing to install or run.
- **Not a multi-target language for v1.** Web is the v1 target so that "three commands to first pixel" stays achievable. Mobile compilation is opt-in later via the Flutter toolchain.

## Tracked open questions (v0.5 backlog)

Items deferred from v0.4 that will be designed once enough test data accumulates:

- **Optimistic updates with rollback** — requires cross-screen state, background requests, and post-navigation error surfacing. Three orthogonal sub-problems.
- **Cross-screen shared state** — once optimistic updates need it.
- **Forms and validation** — multi-field, cross-field, async validators.
- **Animations and transitions.**
- **List search / filter / sort** built into the iteration syntax.
- **Routing patterns** beyond simple navigation: deep links, query params, modal stacks, back-stack management.
- **Theming and dark mode propagation.**
- **Package / module system** for sharing components across projects.
- **Doc-comment syntax** for components and screens.

The current and authoritative list lives at the bottom of `spec/v0.4.md`.
