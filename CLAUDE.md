# Igni Language

UI-first language being designed by Tyr (sole author and sole decision-maker). North star: *"Flutter, without the bracket hell"* — same cross-platform power, but code that reads like a design spec. The hypothesis is that LLM accuracy and human readability correlate tightly, so removing the ambiguity that trips LLMs up also makes the language nicer for humans.

**Status: transpiler stage.** The TypeScript-to-Dart transpiler exists and covers most of the v0.6.2 spec. The project is a versioned markdown spec, a cold-LLM test suite, and a working transpiler that compiles `.igni` to Dart/Flutter.

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

```text
igni/
├── README.md                # public-facing project summary
├── CLAUDE.md                # this file (notes for AI assistants)
├── LICENSE                  # MIT
├── spec/                    # all spec versions
│   ├── v0.2.md              # Rocket-era historical
│   ├── v0.3.md              # Rocket-era historical
│   ├── v0.3.1.md            # Rocket-era historical
│   ├── v0.3.2.md            # Igni-era historical (rename only)
│   ├── v0.4.md              # Igni-era historical (acceptance round)
│   ├── v0.4.1.md            # Igni-era historical (docs patch)
│   ├── v0.5.md              # Igni-era historical (shared state, body slots, list builtins)
│   └── v0.5.1.md            # current canonical (docs patch from v0.5 Shopping test)
├── tests/                   # cold-LLM test infrastructure
│   ├── README.md            # test methodology
│   ├── v0.3.2/              # Calculator, Todo, Weather — fed v0.4
│   ├── v0.4/                # Chat (PASS), MusicPlayer (PARTIAL), Notes (MIXED)
│   └── v0.5/                # Notes re-run (PASS), Shopping (PARTIAL) — fed v0.5.1
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── examples/            # .igni sources + .expected.dart reference outputs
│   ├── package.json
│   └── tsconfig.json
└── docs/                    # project docs (private, gitignored)
```

Each spec version gets its own subfolder under `tests/` containing both the prompts that were used and the result files. Test result filenames drop the `Cold_Test_` prefix and the version suffix (the folder carries the version).

## Spec files

- `spec/v0.2.md` — Rocket-era historical snapshot. The original draft.
- `spec/v0.3.md` — Rocket-era historical. Adds async data, mutations, screen-internal functions, the lexical reactivity rule, and the *"spec as budget"* and *"three commands to first pixel"* principles.
- `spec/v0.3.1.md` — Rocket-era historical. Last version under the Rocket name. Patches v0.3 with a structurally-correct mutation example, the `icon` primitive, object literals, the no-interpolation rule, and the intrinsic-dimensions carve-out.
- `spec/v0.3.2.md` — Igni-era historical. Rename only — no language changes from v0.3.1.
- `spec/v0.4.md` — Igni-era historical. The first version drafted from cold-LLM test data (Calculator, Todo, Weather under v0.3.2). Adds arithmetic operators, `is X` for arbitrary equality, `null`, `+` for lists, `without`, `each` in non-rendering contexts, functional list updates, comments, cross-component function calls, and the reactive re-fetch example.
- `spec/v0.4.1.md` — Igni-era historical. Documentation patch over v0.4 with five one-line additions grounded in the v0.4 acceptance test findings: single-screen multi-view pattern (with caveats), icon button example, functions-as-expressions, `image round:` vs `layout rounded:`, no-cross-screen-function-calls rule.
- `spec/v0.5.md` — Igni-era historical. Closes the cross-screen state gap from the Notes test plus three other v0.5 design items. Adds: (1) cross-screen shared state via top-level `shared:` block, (2) wrapper components with `body` slot keyword (zero-or-once invocation supports conditional wrappers like LoadingWrapper / AuthGuard / Modal), (3) list builtins `replace` / `find` / `count` / `length` plus `is in` / `is not in` operators, (4) prominent input-debounce common-pitfall callout in Async Data section. Three new language features and one documentation upgrade. **No lambdas, no named slots — both deferred to v0.6.**
- `spec/v0.5.1.md` — Documentation patch over v0.5 with five clarifications grounded in the v0.5 cold-LLM Shopping test findings: (1) `find` identity warning with counter-example, (2) `spread: true` as the canonical boolean form, (3) "wrapper component" terminology cross-reference to `body`, (4) `count`-for-quantity idiom from Gemini's Shopping output, (5) no-arg component invocation clarification. No new language features; zero budget impact. Last spec before the transpiler.
- `spec/v0.6.md` — Igni-era historical. First post-transpiler spec. Adds: (1) lambda expressions for list builtins, (2) `filter`/`sorted`/`reversed` builtins, (3) `return` in functions, (4) `contains()` string builtin, (5) `and`/`or` boolean operators. Designed from developer experience building real apps with the transpiler.
- `spec/v0.6.1.md` — Igni-era historical. Adds: (1) implicit vertical layout for screen/component bodies, (2) comparison operators (`>`/`<`/`>=`/`<=`).
- `spec/v0.6.2.md` — Igni-era historical. Documentation patch.
- `spec/v0.6.3.md` — Igni-era historical. Five additions driven by first end-to-end cold-LLM test + human testing: (1) `toggle label:` primitives table fix, (2) `map` builtin, (3) `contains` case-insensitivity, (4) float literals, (5) `random(min, max)`. Cheatsheet companion at `spec/v0.6.3-cheatsheet.md`.
- `spec/v0.6.4.md` — Igni-era historical. Ten additions driven by rebuilding Angela Yu's Dicee and Xylophone Flutter course projects.
- `spec/v0.6.5.md` — **current canonical spec.** Five documentation clarifications driven by 4-model spec review, plus list indexing driven by Quizzler cold test. Cheatsheet at `spec/v0.6.5-cheatsheet.md`.
- `spec/v0.6.6-cheatsheet.md` — **current canonical cheatsheet.** Same content as v0.6.5 cheatsheet, restructured in learning order (hello world → showing things → variables → interaction → layout → logic → components → navigation). Rules moved to end as reference. Optimised for both human learning progression and LLM code generation.

When proposing spec changes, **work from `spec/v0.6.5.md` and fork to a new version file** rather than editing in place. Snapshots are how Tyr tracks design evolution and how cold-LLM tests stay reproducible against a frozen baseline.

## Transpiler

The transpiler lives in `transpiler/` — a TypeScript project that compiles `.igni` source to Dart/Flutter targeting web. Hand-written recursive descent parser, chokidar for file watching.

**Pipeline:** `.igni` → Lexer (INDENT/DEDENT) → Parser → AST → CodeGen → `.dart`

**CLI:** `igni run` — one command to transpile, watch, and serve. Creates a hidden `.igni/` Flutter project automatically, watches for `.igni` file changes, hot reloads the browser on save. Default entry point is `app.igni`; use `igni run hello.igni` to run a specific file. Run from any directory containing `.igni` files. Local wrapper at `transpiler/bin/igni`.

**Currently supported:** `screen` (StatefulWidget), screen properties (`title:` for AppBar, `background:` for Scaffold colour), `component` (StatelessWidget), wrapper components with `body` slot, variables (int/double/String/bool/List), optional type hints (`name: Type = value`, `items: [Type] = []`), `layout` (vertical/horizontal, align, gap, padding, background, rounded, spread, `fill: true` for Expanded), implicit vertical layout for screen bodies, `label` (with `align: center/end` for text alignment), `button` + `on tap`, `input bind:` + `placeholder:`, `toggle bind:`, `image` (size, round, `on tap:`, local assets via `images/` folder + network URLs), `icon` (size, color, `on tap:`), `slider` (bind, min, max), `checkbox` (bind, label), `dropdown` (bind, options), `badge` (color), `spinner`, `if`/`else`/`else if`, `not`, `is`/`is not` (general equality), `is empty`/`is not empty`, `is null`/`is not null`, `is in`/`is not in`, `is loading`/`is error`, comparison operators (`>`/`<`/`>=`/`<=`), `and`/`or` boolean operators, `each` loops, `navigate to`/`navigate back` (multi-screen with params), `shared:` state (ChangeNotifier), `fetch` + `spinner`, `without`/`replace`/`find`/`count`/`length`/`filter`/`sorted`/`reversed` builtins, `contains()` string builtin, `random(min, max)`, lambda expressions (`item => expr`), `return` in functions, screen-internal functions with params, list literals `[]`, object literals `{key: val}`, field access `obj.field`, list indexing `items[index]` (zero-based, null on out-of-bounds), arithmetic (`+`/`-`/`*`/`/`), float literals, string concatenation with `+`, extended colour names (`red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal` + semantic `brand`, `subtle`, `danger`, `green`), `play("file.wav")` audio builtin with `audio/` folder convention, `on touch:` event (fires on finger contact, vs `on tap:` which fires on release).

**Twenty-two example apps:** counter, settings, toggle, functions, greeting, todo, notes (multi-screen), todo-full (with delete), components, shared (cross-screen state), fetch (async API call), dice (random), dicee (Angela Yu course project — screen properties, local images, AppBar), dashboard, fn-return, lambda (filter/sorted/reversed), primitives, shopping (full e-commerce), wrapper (body slot), logic (and/or), type-hints (typed variable declarations). All pass diff tests and run in the browser.

**Testing:** Each example in `transpiler/examples/` has a `.igni` source and a `.expected.dart` reference. `npx tsx src/cli.ts example.igni | diff - example.expected.dart` — zero diff = pass. Browser testing via a gitignored `test_app/` Flutter project.

**Not yet supported (v0.6.5 spec features):** `on change:`, `fetch` with `method:`/`body:` (mutations), reactive re-fetch, `theme:` block, `paginate:` on `each`, comments passthrough to Dart.

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

## Validation methodology

The spec is validated with **cold-LLM tests**: paste the current spec into a fresh frontier-model conversation (Claude, Gemini, ChatGPT) and run the prompts in `tests/v<spec_version>/prompts.md` verbatim. Test results live alongside the prompts under `tests/v<spec_version>/<App>.md`.

**Two-stage validation** (now that the transpiler exists):

1. **Spec grading** (same as before) — did the LLM invent syntax, misuse existing syntax, or produce valid Igni? This grades the spec's learnability.
2. **Transpiler validation** (new) — feed the LLM's output to the transpiler. Does it transpile? Does the Dart output run in the browser? This is the objective pass/fail. Transpiler errors also prioritise what to build next — if 2/3 models use a feature the transpiler doesn't handle, that feature moves to the top of the backlog.

The two stages validate different things: stage 1 validates the spec, stage 2 validates the transpiler. Together they create a feedback loop — cold tests surface what LLMs actually write, which drives both spec patches and transpiler features.

**Test cases:**

- **The easy case** (Settings screen) is a smoke test. Every UI DSL passes it. Now also the first transpiler-validated test.
- **The hard case** — paginated list with loading/error states, navigation to a detail screen, and an edit-and-save flow — is the real validator.
- **The comparison case** — write a music player in both Igni and Flutter — quantifies the readability win in line count and nesting depth.
- **The shared state case** — multi-screen e-commerce app with shared cart, body-slot wrappers, and list builtins.

Full methodology is in `tests/README.md`.

## Working on the spec with Tyr

- **Tyr is the sole decision-maker.** Propose changes, present tradeoffs, wait for confirmation. Never edit the spec on his behalf without explicit approval.
- **For exploratory questions, give 2-3 sentences and the main tradeoff** — not an essay. Tyr will ask for depth if he wants it.
- **For structural changes, use the plan-then-execute pattern**: explore, propose a plan, get approval, then write. Plan mode is appropriate for non-trivial spec edits.
- **Never delete or overwrite a snapshot version.** Preserve them as historical artifacts in `spec/`.
- **Design by trying, not by theorising.** When working on a future v0.X, try to write the hard example in the current spec, hit the walls, and let the walls dictate the additions. This is how every version since v0.3 was designed.
- **Be honest about defects.** If a spec example is structurally wrong, say so directly. The cold test exists precisely to catch what self-review misses.
- **Claude's "honest no" is more valuable than a clever workaround.** If a model correctly identifies a gap and refuses to invent around it, that's the most useful diagnostic signal.
- **v0.6.5 is the current canonical spec.** Work from it. Don't propose v0.7 design work without explicit direction.

## Common pitfalls to avoid

- **Don't propose feature flags, backwards-compat shims, or migration paths.** The spec has no users yet — just change it.
- **Don't add a new keyword when an existing primitive can be extended.** That violates the spec budget rule.
- **Don't write Dart, Flutter, React, or TypeScript** in proposals. Only Igni and prose. If you need to demonstrate something, write it in Igni.
- **Don't use brackets, braces, parentheses on component invocation, ternary operators, or string interpolation.** These are explicitly out.
- **Don't bind a `fetch` URL directly to a text input** — that's the v0.5-documented common pitfall. Use the trigger-variable pattern (see Async Data in the spec).
- **Test transpiler changes by running all example diffs.** `npx tsx src/cli.ts examples/<app>.igni | diff - examples/<app>.expected.dart` for each example. Zero diff = pass. Then browser-test via `test_app/`.

## What this project is *not*

- **Not a multi-target language for v1.** Web is the v1 target so that "three commands to first pixel" stays achievable. Mobile compilation is opt-in later via the Flutter toolchain.

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

The current and authoritative list lives at the bottom of `spec/v0.6.3.md`.
