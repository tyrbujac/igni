# Igni reference materials (for broad-scope LLM panel review)

## README.md

# Igni

[![test](https://github.com/tyrbujac/igni/actions/workflows/test.yml/badge.svg)](https://github.com/tyrbujac/igni/actions/workflows/test.yml)

A programming language for building UIs — designed to be read.

**Status: research prototype.** Final-year CS dissertation project investigating whether LLM output accuracy and human readability track each other. Spec is at v0.11.6; transpiler covers most of it; the tutorial has been through multiple cold-run iterations. Not yet production-ready. See [§ Status](#status) for the methodology + evidence.

**The hypothesis:** LLM accuracy and human readability track each other. Remove the ambiguity that trips LLMs up — no brackets on component invocation, one way to update state, a single spec document — and the language becomes nicer for humans too. Igni is that experiment.

**Concrete evidence so far:** Igni's syntax gets cold-tested on frontier LLMs (Claude, GPT, Gemini) — each round measures whether models write correct code from the docs alone, no examples. The most recent test produced **0/7 wrong inventions** after a one-paragraph docs fix, down from 3/7 silent bugs before. That loop is how the object-update syntax, trigger wording, and geolocation primitive got locked in — the language evolves toward phrasings frontier models reach for first. Methodology and full per-round numbers in [tests/README.md](tests/README.md).

Igni transpiles to Dart/Flutter. You write short, readable source files. The toolchain handles the rest.

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons open them. One way to do everything. No imports, no `useState`, no boilerplate. Reactivity is automatic.

## Installation

Igni isn't on npm. To install from source:

```bash
git clone https://github.com/tyrbujac/igni.git
cd igni/transpiler
npm install
```

Then symlink the CLI onto your PATH:

```bash
mkdir -p ~/.local/bin
ln -s "$(pwd)/bin/igni" ~/.local/bin/igni
# ensure ~/.local/bin is on your $PATH — add to ~/.zshrc or ~/.bashrc if not
```

Verify: `igni --help` prints the usage message.

## Quick start

**Prerequisites:** Node.js 18+, Flutter SDK, Chrome.

```bash
igni new my-app
cd my-app
```

Run it:

```bash
igni run
```

First run needs internet — `flutter create` fetches scaffold packages from pub.dev. After that, `igni run` works fully offline, theme fonts included.

`igni new` creates a starter `app.igni` and a `.gitignore` for the generated `.igni/` Flutter project. Save `app.igni`, browser updates automatically. That's it.

## Using Igni with an LLM

Igni is designed to be injected straight into your LLM's context window.

1. **The context:** paste the entire contents of [`spec/v0.11.6-cheatsheet.md`](spec/v0.11.6-cheatsheet.md) into your system prompt or initial message.
2. **The persona:** add this instruction: *"You are an expert Igni developer. Write concise, idiomatic Igni code using strictly the provided rules. Do not invent syntax."*
3. **The prompt:** ask for the specific UI you need. Example: *"Build a `screen Settings:` with a dark mode toggle bound to a boolean variable, and a red logout button."*

Because Igni lacks boilerplate, the model outputs the raw 5–6 lines you need, ready to save directly into your `.igni` file.

## How it works

`igni run` transpiles your `.igni` files to Dart, spins up a Flutter web server, and watches for changes. Edit, save, see the result in your browser — the loop is instant.

When Flutter or generated Dart reports an error from `main.dart`, Igni maps it back to the nearest `.igni` source line so the CLI points at code you actually wrote instead of only the generated file.

Under the hood, a hidden `.igni/` Flutter project is created automatically. You never touch it — just edit `.igni` files and save.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for how the pieces fit together (repo layout, spec files, transpiler pipeline, validation methodology). See [`docs/tutorial.md`](docs/tutorial.md) to learn Igni end-to-end.

## Why not Flutter / React / SwiftUI?

Igni is downstream of the same declarative-UI lineage as SwiftUI and Jetpack Compose, built specifically for LLM-assisted workflows. Compared to mainstream options:

- **Flutter** — Igni compiles to Flutter. You get Flutter's rendering; you skip Flutter's imperative `setState`, widget constructors, and `BuildContext` plumbing. Tradeoff: Igni's spec is deliberately smaller than Flutter's API, so features Flutter has (animations, pub.dev packages) you'd need to drop into Flutter directly for.
- **React / React Native** — Igni's reactivity is automatic reassignment (no `useState`, no setters). Similar in spirit to React but via lexical re-evaluation instead of hook-based re-renders. Igni has no JSX, no components-as-functions, and no package ecosystem — it's much narrower.
- **SwiftUI / Jetpack Compose** — Closest cousins. Similar declarative-UI mental model. Main difference: Igni was designed for cold-LLM adoption from day one, so its spec is narrower and explicitly resists features that confuse models — no ternary expressions, no string interpolation, no multi-parameter lambdas.

If you already love Flutter / React / SwiftUI, Igni likely isn't competitive for your existing workflow. If you're writing UI code with LLM assistance and feeling the syntactic noise, Igni optimizes for that specifically.

## Mobile

`igni run` defaults to Chrome. Mobile is one command each:

```bash
igni run ios          # iOS simulator
igni run android      # Android emulator
```

Igni auto-picks a running device, or auto-boots the first available simulator / emulator. Use `--device "<name>"` to pick a specific one. See [`docs/mobile.md`](docs/mobile.md) for device-selection rules, build timings, and known gotchas (Cloudflare third-party APIs, SafeArea).

## Project structure

Igni files are much shorter than their Flutter equivalents — a screen is typically 10-40 lines, not 100-300. Flat file structure works well:

- **Under 200 lines:** fine as a single file
- **Over 200 lines:** consider splitting by screen or feature
- **No folders needed** until 15+ files — auto-discovery means every screen and component is available everywhere with no imports

```text
my-app/
  app.igni           # entry point
  settings.igni      # another screen (optional)
  images/            # local images
  audio/             # audio files
```

## Status

**Language spec:** Current canonical spec is [spec/<!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md](spec/<!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md). Companion cheatsheet at [<!-- SYNC:cheatsheet-path -->spec/v0.12.2-cheatsheet.md<!-- /SYNC:cheatsheet-path -->](<!-- SYNC:cheatsheet-path -->spec/v0.12.2-cheatsheet.md<!-- /SYNC:cheatsheet-path -->); syntax-only micro reference at [<!-- SYNC:micro-path -->spec/v0.12.2-micro.md<!-- /SYNC:micro-path -->](<!-- SYNC:micro-path -->spec/v0.12.2-micro.md<!-- /SYNC:micro-path -->). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest spec changes:** `v0.11.6` (2026-04-22) adds a three-sentence reactivity lifecycle clarifier to the cheatsheet's *Reacting to users* section, addressing the 3/4 LLM-panel convergence gap on the abstract-only "re-evaluates from the top" rule (see `docs/private/73`). `v0.11.5` (2026-04-21) was a docs-only hygiene pass — cheatsheet pruned 2,931 → 2,536 words; context-specific callouts migrated from the cheatsheet's learning path to the full spec's reference sections. First execution of the prune-before-add cadence. `v0.11.4` (2026-04-21) sharpened the *Counting by field* callout per a 4-model ship review; Stage 3 validated the rewrite at 0/7 inventions (see *Concrete evidence* above). `v0.11.3` (2026-04-21) canonicalised `length(filter(list, predicate))` as the idiom for field-based counting. `v0.11.0` added the `locate()` geolocation primitive reusing `fetch()`'s `is loading:` / `is error:` machinery (4/4 pre-ship shape convergence, 3/3 post-ship adoption on Clima). Preceding syntax ships: `v0.10.0` object-update syntax `{target with field: newval}` (9/9 frontier adoption across three domain-swap rounds); `v0.9.1` trigger-variable wording tighten (docs-only, 3/3 flip); `v0.9.0` reactive-fetch footgun as a transpile-time error; `v0.8.0` component event channels (`emit` + `on <event>:`). See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest methodology result:** the v0.10 domain-swap round (Shopping + Apothecary + Spaceship Cargo, 3 × 4 models × cheatsheet tier) produced 9/9 frontier adoption of `{target with ...}` unprompted. Three runs at varying domain distance from e-commerce rules out the "shopping-cart corpus density" confound — the cheatsheet teaches the syntax, the domain doesn't supply it. First post-ship result strong enough to call directly-supported rather than suggestive.

**Transpiler:** Working. <!-- SYNC:example-count -->43<!-- /SYNC:example-count --> example apps compile and run in the browser; iOS simulator and Android emulator supported via `igni run ios` / `igni run android` (device auto-pick, auto-boot, `--device` override). Covers:

- **Composition** — screens, components, wrapper components with `body` slot, layouts
- **Control flow** — `if`/`else`, `each` loops (with `paginate:` for lazy rendering), functions, lambdas
- **State & data** — variables, two-way binding, shared state, async `fetch` + `locate()` with loading/error
- **Data shapes** — list operations (`filter`, `sorted`, `without`, `replace`, ...), list indexing, object-update syntax (`{target with field: newval}`)
- **UI surface** — screen properties (title, background), local images, audio, SafeArea auto-wrap when no AppBar (prevents iOS notch clipping)
- **Operators** — arithmetic, comparison, boolean (`and`/`or`/`not`)

**Compile-time rejections** — five anti-patterns rejected with fix-it errors: reactive-fetch footgun, `emit <event>` misplacement, bare `shared:` access, `count(list, lambda)` (use `length(filter(...))`), `locate()` reactive-fetch extension. Pinned negative fixtures in [`transpiler/examples-errors/`](transpiler/examples-errors/).

**CLI:** `igni new` scaffolds a starter. `igni run` transpiles, watches, serves. `igni run ios` / `igni run android` for mobile — see [`docs/mobile.md`](docs/mobile.md). Full reference in [`transpiler/README.md`](transpiler/README.md).

**Project scope:** Single-author by design during early access. The project's adversarial review comes from cold-LLM panels (4 frontier models per round, see [`tests/README.md`](tests/README.md)) and human usability testing, not multi-contributor PRs — a deliberate choice for a research prototype. External contribution will open post-v1.0 when the spec is stable enough to absorb PRs without churn.

## Repo structure

```text
igni/
├── README.md                # this file
├── ARCHITECTURE.md          # how the pieces fit (human audience)
├── CLAUDE.md                # AI-assistant design principles + workflow
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
├── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
├── spec/
│   ├── README.md
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->-cheatsheet.md  # current canonical cheatsheet
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->-micro.md       # current canonical micro reference
│   └── archive/             # historical <!-- SYNC:historical-range-files -->v0.2.md → v0.12.1.md<!-- /SYNC:historical-range-files --> (never edited after shipping)
├── transpiler/
│   ├── README.md
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   ├── examples/            # <!-- SYNC:example-count -->43<!-- /SYNC:example-count --> .igni apps + .expected.dart references
│   └── examples-errors/     # pinned transpile-rejection fixtures
├── tests/                   # cold-LLM test results + methodology
│   ├── README.md
│   └── v<spec_version>/     # prompts + results per round
├── docs/
│   ├── README.md
│   ├── tutorial.md          # beginner walkthrough
│   ├── mobile.md            # iOS / Android run instructions
│   └── archive/             # prior tutorial drafts
├── editors/
│   └── vscode/              # VS Code / Cursor TextMate grammar
├── scripts/
│   └── sync-docs.ts         # regenerates SYNC:* markers from repo state
└── assets/                  # logo (igni.svg + igni-dark-mode.svg, PNGs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).

---

## ARCHITECTURE.md

# Igni architecture

How the pieces fit. Companion to [`README.md`](README.md) (what + why) and [`CLAUDE.md`](CLAUDE.md) (AI-assistant guidance).

## Repo layout

```text
igni/
├── README.md                  # public-facing project summary
├── ARCHITECTURE.md            # this file (how the pieces fit)
├── CLAUDE.md                  # notes for AI assistants (design principles + workflow)
├── LICENSE                    # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
├── CHANGELOG.md               # spec evolution history
├── ROADMAP.md                 # near-term plans + ideas
├── assets/                    # logo (igni.svg, igni-dark-mode.svg, PNGs)
├── spec/
│   ├── README.md
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->-cheatsheet.md  # current cheatsheet (learning order)
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->-micro.md       # current micro reference (~700 words)
│   └── archive/               # historical snapshots <!-- SYNC:historical-range-files -->v0.2.md → v0.12.1.md<!-- /SYNC:historical-range-files -->
├── tests/                     # cold-LLM test infrastructure
│   ├── README.md              # test methodology
│   └── v<spec_version>/       # prompts + results per spec round
├── editors/
│   └── vscode/                # VS Code / Cursor TextMate grammar
├── transpiler/                # TypeScript-to-Dart transpiler
│   ├── README.md
│   ├── src/                   # lexer, parser, codegen, CLI
│   ├── bin/igni               # CLI entry point (bash shim to src/igni.ts)
│   ├── examples/              # <!-- SYNC:example-count -->43<!-- /SYNC:example-count --> .igni apps + .expected.dart refs
│   ├── examples-errors/       # pinned transpile-rejection fixtures + .expected.err
│   └── run-tests.sh           # automated diff-test runner
├── docs/
│   ├── README.md
│   ├── tutorial.md            # current beginner walkthrough
│   ├── mobile.md              # iOS / Android run instructions
│   ├── preregistration-phase4.md
│   ├── archive/               # prior tutorial drafts
│   └── private/               # gitignored research notes
└── scripts/
    └── sync-docs.ts           # regenerates SYNC:* markers from repo state
```

Each `tests/v<spec_version>/` folder contains the prompts used for that round and the per-model result files. Filenames drop the `Cold_Test_` prefix and version suffix — the folder carries the version.

## Spec files

Three tiers of the same language at [`spec/`](spec/):

- **[`spec/v0.11.6.md`](spec/v0.11.6.md)** — **current full spec** in learning order (hello world → screens → display → variables → interaction → layout → state → conditionals → lists → functions → components → navigation → shared state → async → reference).
- **[`spec/v0.11.6-cheatsheet.md`](spec/v0.11.6-cheatsheet.md)** — condensed (~2,500 words). Same language, optimised for cold-LLM context and human skim. Primary input for cold-test rounds.
- **[`spec/v0.11.6-micro.md`](spec/v0.11.6-micro.md)** — rules-only (~700 words). Third context tier for tests that vary context size as an independent variable.

Historical versions (v0.2 → v0.11.5) live under [`spec/archive/`](spec/archive/). Each is an immutable snapshot — never edited after ship — because cold-LLM tests stay reproducible against a frozen baseline. See [`CHANGELOG.md`](CHANGELOG.md) for the per-version evolution narrative.

**When proposing spec changes,** fork `spec/v0.11.6.md` (+ cheatsheet + micro) to a new version file rather than editing in place. Historical versions (v0.2 → v0.11.5) live under `spec/archive/`. Full snapshot rule in `CLAUDE.md` for AI-assisted edits.

## Transpiler

TypeScript project at [`transpiler/`](transpiler/) that compiles `.igni` source to Dart/Flutter. Hand-written recursive-descent parser, chokidar for file watching. Hidden `.igni/` Flutter project created on demand.

**Pipeline:** `.igni` → Lexer (INDENT/DEDENT) → Parser → AST → CodeGen → `.dart` → Flutter.

**CLI:** `igni run` one command to transpile, watch, and serve. Mobile targets via `igni run ios` / `igni run android` (v0.11.5+); macOS desktop target via `igni run macos`; non-Chrome browsers (Safari / Firefox / Arc) via `igni run localhost`, which runs Flutter in `-d web-server` mode and prints a `http://localhost:PORT` URL instead of launching a browser. Both web variants pass `--no-web-resources-cdn` so CanvasKit + Flutter's default Roboto are served from the local SDK — the web dev loop works offline (caveat: fonts routed through v0.12.1's `theme: font:` tokens still hit `fonts.gstatic.com` via `google_fonts`; follow-up tracked). `igni run localhost` additionally starts a Node SSE sidecar on a random port and injects a reload script into the scaffolded `web/index.html`, so saves auto-refresh the browser tab in any browser — matching Chrome's DX despite Flutter's `-d web-server` not pushing reload signals itself (issue #44974). Standalone release artifacts via `igni build <macos|apk|web>` — output lands in `dist/` ready to share (no code-signing pipeline yet; unsigned macOS apps need right-click → Open on first launch). App identity auto-applies: display name is the folder name title-cased (`dicee` → `Dicee`, `dice-roller` → `Dice Roller`; override with `--name`), and a user-placed `app-icon.png` at the project root is resized into every platform's icon set (falling back to the Igni default when absent). `igni new my-app` scaffolds a starter. Default entry point is `app.igni`. See [`transpiler/README.md`](transpiler/README.md) for the source-layout tour and the full CLI reference.

**Currently supported:** `screen` (StatefulWidget), screen properties (`title:` → AppBar, `background:` → Scaffold colour), `component` (StatelessWidget), wrapper components with `body` slot, variables (int/double/String/bool/List) with optional type hints, assignable styling tokens (`brand`, `subtle`, `danger`, colour palette, background-only `card`), `layout` (vertical/horizontal, align, gap, padding, background, rounded, spread, `fill: true` for Expanded), implicit vertical layout for screen bodies, `label` (with `align:` for text alignment), `button` + `on tap`, `input bind:` + `placeholder:`, `toggle bind:`, `image` (size, round, `on tap:`, local assets + network URLs), `icon` (size, color, `on tap:`), `slider` (bind, min, max), `checkbox` (bind, label), `dropdown` (bind, options), `badge` (color), `spinner`, `if`/`else`/`else if`, `not`, `is`/`is not` equality, `is empty`/`is null`/`is in`/`is loading`/`is error` and their negations, comparison operators (`>`/`<`/`>=`/`<=`), `and`/`or`, `each` loops (with optional `paginate: N` lazy rendering), `navigate to`/`navigate back` (multi-screen with params), `shared:` state via ChangeNotifier, `fetch` + `spinner`, list builtins (`without`/`replace`/`find`/`count`/`length`/`filter`/`sorted`/`reversed`), string builtins (`contains`/`upper`/`lower`), `emit <event> [<arg>]` with `on <event>:` wiring, `random(min, max)`, lambda expressions, `return` in functions, screen-internal functions with params, list literals, object literals, field access, list indexing (null on out-of-bounds), arithmetic, float literals, string concatenation with `+`, `play("file.wav")` audio, `print()` for console debugging, `on touch:` event (fires on contact; `on tap:` fires on release), `locate()` geolocation builtin via `geolocator` plugin. Visual defaults: 16px screen-body padding (unless explicit `layout`), 16px `bodyMedium`, `#FAFAFA` scaffold, outlined input border, intrinsic button width, 480px input max-width outside Row context, `SafeArea` wrap when no `title:` (prevents notch clipping on iOS). Error-message pipeline filters Dart-SDK / Flutter framework stack frames and maps runtime stack frames back to `.igni` lines.

**<!-- SYNC:example-count -->43<!-- /SYNC:example-count --> example apps** in [`transpiler/examples/`](transpiler/examples/) — each a `.igni` source + `.expected.dart` reference. Covers counter, settings, toggle, functions, greeting, todo, notes (multi-screen), todo-full, components, shared (cross-screen state), fetch (async API), fetch-mutation, fetch-reactive, dice, dicee (Angela Yu course project with AppBar + local images), mi-card (Angela Yu identity-card, pure static-layout regime), dashboard, fn-return, lambda, primitives, shopping (full e-commerce), wrapper (body slot), logic, type-hints, contacts (list indexing, comparisons), on-change, bg-image, tutorial (smoke test), string-case, derived-counts, stepper (emit/on events), pagination. See [`transpiler/examples/README.md`](transpiler/examples/README.md) for one-liner descriptions.

**Testing:** `npm test` in `transpiler/` runs <!-- SYNC:total-tests -->60<!-- /SYNC:total-tests --> diff tests (positive + negative rejection cases). Zero diff = pass. Browser smoke-test via `igni run` from any directory containing `.igni` files.

**Not yet supported (v0.11.6 spec features):** `theme:` block. (`paginate:` on `each` shipped 2026-04-22 as syntax + lazy `ListView.builder` codegen; auto-load-more on scroll deferred pending async integration.)

**Transpile-time rules enforced** (rejections, not warnings): reactive-fetch footgun — `fetch("..." + bound_var)` rejected, use the trigger-variable pattern; `emit <event>` placement — only valid as the action of `on tap:` / `on touch:` / `on change:`; bare access to `shared:` variables — `hold = hold + [...]` rejected, always use `shared.hold` ("visible coupling marker" rule); `count(list, lambda)` — rejected with a fix-it pointing at `length(filter(list, predicate))` (only the value form `count(list, value)` is supported). See `transpiler/examples-errors/` for the pinned negative fixtures.

## Validation methodology

The spec is validated with **cold-LLM tests**: paste the current spec (or cheatsheet, or micro) into a fresh frontier-model conversation (Claude, Gemini, ChatGPT) and run the prompts in `tests/v<spec_version>/prompts.md` verbatim. Test results live alongside the prompts under `tests/v<spec_version>/<App>.md`.

**Two-stage validation:**

1. **Spec grading** — did the LLM invent syntax, misuse existing syntax, or produce valid Igni? This grades the spec's learnability.
2. **Transpiler validation** — feed the LLM's output to the transpiler. Does it transpile? Does the Dart output run in the browser? Objective pass/fail. Transpiler errors also prioritise what to build next: if 2/3 models reach for a feature the transpiler doesn't handle, that feature moves to the top of the backlog.

Stage 1 validates the spec; stage 2 validates the transpiler. Together they form a feedback loop — cold tests surface what LLMs actually write, which drives both spec patches and transpiler features.

**Test cases:**

- **The easy case** — Settings screen. Smoke test; every UI DSL passes it. First transpiler-validated test.
- **The hard case** — paginated list with loading/error states, navigation to a detail screen, and an edit-and-save flow. The real validator.
- **The comparison case** — music player written in both Igni and Flutter, quantifying the readability win in line count and nesting depth.
- **The shared-state case** — multi-screen e-commerce app with shared cart, body-slot wrappers, and list builtins.

Full methodology in [`tests/README.md`](tests/README.md).

## Keeping docs in sync

A handful of mechanical facts (current spec version, example count, diff-test total, historical version range) are synced into `README.md`, `ARCHITECTURE.md`, and `CLAUDE.md` by `scripts/sync-docs.ts`. They live inside `<!-- SYNC:name -->...<!-- /SYNC:name -->` HTML-comment regions.

**When to run** `npx tsx scripts/sync-docs.ts`:

- After shipping a new spec version.
- After adding or removing an example in `transpiler/examples/` or a negative test in `transpiler/examples-errors/`.
- Before any commit that touches README / ARCHITECTURE / CLAUDE content near the marked regions.

**`--check` mode** (`npx tsx scripts/sync-docs.ts --check`) exits 1 on drift, 0 if clean — no edits. Good for a pre-commit hook.

**What is synced:** `SYNC:version`, `SYNC:cheatsheet-path`, `SYNC:micro-path`, `SYNC:example-count`, `SYNC:total-tests`, `SYNC:historical-range` / `-files` / `-paths`.

**What is NOT synced** — still hand-edited: the "Latest language change" narrative in README, the long "Currently supported" feature list body in this file (the surrounding count is synced), `CHANGELOG.md` entries (append-only), `ROADMAP.md` (explicitly a planning surface).

Rule: don't edit text *inside* any `<!-- SYNC:... -->` region by hand — run the script. Editing the prose around the markers is fine and expected.

## What this project is *not*

- **Not a multi-target language for v1.** Web is the v1 target so that "three commands to first pixel" stays achievable. Mobile compilation is opt-in later via the Flutter toolchain (see [`docs/mobile.md`](docs/mobile.md)).

---

## spec/v0.12.2.md (full spec)

# Igni Language Spec v0.12.2

**By Tyr | 24/04/26 | Status: Design Stage**

Igni is a UI-first programming language designed for human readability and LLM accuracy. Its north star is "Flutter, without the bracket hell" — the same cross-platform power (web, mobile, desktop) but with code that reads like a design spec.

It prioritises: readability, simplicity, and minimal ambiguity.

**Changes from v0.12.1:** Docs-only restructure — section order now follows a basics-to-advanced tutorial flow; the old per-version changelog stack has been excised (full history lives in `CHANGELOG.md`); the Variables section's forward-references to `fetch`/`null`/custom types have been replaced with simpler examples; the Lists section is split across an early basics chapter and a later transformations chapter with signposts connecting them; planned theme-block fields have been moved to Appendix C so they stay visible without cluttering the main learning path. No language, syntax, or transpiler changes. Design note: `docs/private/85_v0122_readability_panel.md`.

---

## Hello World

```igni
screen Hello:
  label "Hello, World!"
```

That's a complete app. One screen, one label. No imports, no classes, no main function, no widget tree.

## A Complete App

Before drilling into the per-feature sections, here is a 17-line Todo — every line load-bearing, exercising the most common Igni primitives in one piece. Read it top-to-bottom. Don't worry about concepts you haven't met yet; the sections that follow will ground each one in turn, and this example is the reference point they all circle back to.

```igni
screen Todo:                                       # screen — top-level
  items = []                                       # variable; empty list
  draft = ""                                       # variable; empty string

  layout vertical, gap: medium, padding: large:    # layout — vertical stack
    label "Todo", style: heading                   # label with style token
    input bind: draft, placeholder: "New task"     # input with two-way bind
    button "Add", on tap: add()                    # button → screen function
    if items is empty:                             # conditional rendering
      label "No tasks yet"
    else:
      each item in items:                          # list iteration
        label item.text                            # field access on object

  add():                                           # screen-internal function
    items = items + [{text: draft}]                # list append + object literal
    draft = ""                                     # state reassign → re-renders
```

Lexical reactivity does the heavy lifting here: reassigning `items` or `draft` inside `add()` re-runs the screen body, which re-renders the layout. There is no `setState`, no controllers, no observable wrappers. The same model holds whether state is local (this example), shared across screens (`shared:` block), or async (`fetch()` / `locate()`). §Reactivity states the rule formally; the rest of the spec is its consequences.

## Running It

```bash
igni run              # runs app.igni (default entry point)
igni run hello.igni   # runs a specific file
```

`app.igni` is the default entry point for multi-file projects. For single-file experiments, name the file whatever you want and pass it to `igni run`. `igni run` builds the project, opens it in the browser, and watches for changes. Save any `.igni` file to hot reload. Use `print(value)` to log to the browser console for debugging.

```text
my-app/
  app.igni          # entry point (default)
  images/           # local images (referenced by name)
  audio/            # audio files (referenced by name)
```

---

## Variables

```igni
name = "Tyr"
count = 0
price = 9.99
active = true
items = []
draft = ""
fields = {name: "Tyr", age: 24}
status_color = green
```

No `var`, `let`, `const`, or `final`. Just `=`. One way. Numbers can be integers (`0`, `42`) or decimals (`9.99`, `1.5`) — the type is inferred automatically.

**Variables are local to the screen by default.** Each variable belongs to the screen it is declared in; changing it re-renders only that screen. For state that multiple screens share (a cart, a logged-in user, app-wide preferences), see §Shared State.

**Styling tokens are values.** Colour tokens (`brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`) can be assigned to variables and passed around like any other value. `card` can also be assigned to a variable (see §Styling for the background-only rule).

(`green` and `card` are built-in design tokens — see §Styling.)

```igni
status_color = green
card_bg = card

if warning:
  status_color = danger

layout vertical, background: card_bg:
  label "Status", color: status_color
```

**`null`** represents the absence of a value. Use it for state that hasn't been populated yet, a field the caller didn't provide, or an optional value cleared on demand. Check for it with `is null` and `is not null`:

```igni
chosen = null

if chosen is null:
  label "Nothing selected"
else:
  label chosen.name
```

`null` is meaningfully different from "empty." A bio with no text (`bio = ""`) is not the same as a record that hasn't loaded yet (`record = null`). Use `null` when absence matters.

**Object literals** use `{key: value}` syntax. Read fields with `obj.key`:

```igni
fields.name        # "Tyr"
fields.age         # 24
```

**List indexing** uses `list[index]` syntax. Zero-based. Returns `null` if the index is out of bounds:

```igni
first = items[0]
current = questions[index]
next = questions[index + 1]   # null if past the end
```

Indexing chains with field access: `questions[index].text` gets the `text` field of the item at position `index`.

**Arithmetic.** Numbers support `+`, `-`, `*`, `/` with standard mathematical precedence: `*` and `/` bind tighter than `+` and `-`. Use parentheses for grouping in expressions. The "no parentheses" rule applies only to **component invocation** — parentheses for **expression grouping** are allowed and encouraged.

```igni
total = price * quantity
change = paid - total
average = (a + b + c) / 3
display = display * 10 + d
```

**Strings concatenate with `+`. Igni has no string interpolation** — the rule is one way per task, and `+` is the way:

```igni
greeting = "hello " + name
url = "/api/users/" + user_id + "/posts"
```

When `+` is used between a number and a string, the number is converted to its string representation. So `"Score: " + 100` produces `"Score: 100"`, and `temperature + "°C"` produces `"23°C"` if `temperature` is `23`. There is no separate `to_string` function — `+` handles the coercion.

### Type hints (optional)

Igni infers variable types from their initial value, so most declarations don't need annotations. When you want to be explicit — usually for variables that start empty or `null` but will later hold a specific shape — you can add a type hint after the name:

```igni
items: [Product] = []              # list of Product objects, starts empty
weather: Weather = null            # Weather object, not yet loaded
names: [String] = []               # list of strings
```

The type hint is informational — it tells a reader (and the transpiler) what shape the variable is expected to hold. You still assign values the same way as without a hint. Use type hints when the empty/`null` starting value hides what the variable will eventually contain; skip them when the initial value is already self-describing (`count = 0`, `name = "Tyr"`, `fields = {key: "value"}`).

---

## Reactivity

Variables are reactive. Change them and the UI updates automatically.

You saw this in the Todo above — `items = items + [{text: draft}]` inside `add()` re-runs the screen body, which re-renders the list without any `setState`, controller, or observer wiring. Formally:

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

**The reactivity rule:** *each screen re-evaluates from the top whenever any variable it lexically references is reassigned.* That's the entire model. If a variable's name appears in your screen body and you change its value, the screen re-renders.

No useState, no setState, no notifyListeners, no StreamBuilder, no reactivity primitives to learn. The same rule applies whether the variable is local (declared inside the screen body), shared (declared in a top-level `shared:` block — see §Shared State), or async (the result of a `fetch` — see §Async Data).

---

## Screens

A full page that can be navigated to. **Screen bodies stack vertically by default** — multiple children without an explicit `layout` are arranged top-to-bottom automatically. Use `layout vertical:` when you need `gap:` or `padding:`. Use `layout horizontal:` for rows.

```igni
screen Home:
  count = 0

  layout vertical, padding: large:
    label count, style: heading
    button "Add", on tap: increment()

  increment():
    count = count + 1
```

**Variables, layouts, and functions all live inside the screen body** — never at file level. A screen is a self-contained unit.

### Screen parameters

Screens can accept arguments from navigation:

```igni
screen Profile(user):
  layout vertical, align: center, padding: large:
    Avatar user.avatar, size: 80
    label user.name, style: heading
    label user.bio, style: body, color: subtle

    layout horizontal, gap: large:
      Stat "Followers", user.followers
      Stat "Following", user.following
      Stat "Posts", user.posts
```

### Screen properties

Screens accept optional properties after the name (and optional params), before the colon:

```igni
screen Dicee, title: "Dicee", background: red:
  # body...

screen Settings, title: "Settings":
  # body...

screen ContactDetail(contact), title: "Details", background: blue:
  # body...
```

**`title:`** adds a title bar (app bar) pinned to the top of the screen. The body renders below it.

**`background:`** sets the full-screen background. Accepts a colour name (`background: red`) or an image filename (`background: "background.png"`). See *Background Images* in the Layout section.

Both are optional. Screens without properties work exactly as before: `screen Name:` or `screen Name(params):`.

---

## Layout

Two types: `vertical` and `horizontal`. Everything is arranged using layouts.

```igni
layout vertical, gap: medium, padding: large:
  label "Title", style: heading
  label "Subtitle", style: body
```

Properties: `gap`, `padding`, `align` (start, center, end), `spread` (boolean — distributes space between children), `background`, `rounded`, `fill` (boolean — expands to fill remaining space in parent).

`spread: true` distributes space evenly between children (like CSS `justify-content: space-between`). It's a boolean — either spread or not:

```igni
layout horizontal, spread: true:
  label "Left"
  label "Right"
```

`fill: true` makes a layout expand to fill all remaining space in its parent layout. Use it when you need content centered in the space below a fixed element like a header:

```igni
screen App, title: "App":
  layout vertical:
    label "Header"
    layout vertical, fill: true, align: center:
      label "This content is centered in the remaining space"
```

**Empty layouts** — a layout with no children can omit the trailing colon. This is common with `fill: true` and `background:` for coloured bars or spacers:

```igni
layout vertical, fill: true, background: red, on touch: play("note1.wav")
```

Both forms are valid — with `:` (and an empty block) or without. Use whichever reads better. Layouts with children always need the colon.

**`fill: true` is a layout property only.** Primitives like `button`, `label`, and `image` do not support `fill: true`. To fill space with a tappable coloured area, use an empty layout:

```igni
# RIGHT — fill on a layout
layout vertical, fill: true, background: red, on touch: play("note.wav")

# WRONG — fill on a button (not supported)
button "", fill: true, on tap: play("note.wav")
```

**Multiple `fill: true` siblings split space equally.** If a parent layout has 7 children all with `fill: true`, each gets 1/7 of the available space. There is no way to weight them differently — equal distribution only.

### Bottom-anchored actions (pinning a button to the bottom)

A common mobile layout: form content at the top, a full-width CTA at the bottom, no empty gap between them regardless of screen height. Use `fill: true` on every content section *above* the button — the sections share the remaining vertical space and the un-filled button at the end naturally falls to the bottom.

```igni
screen Profile:
  layout vertical, gap: medium, padding: large:
    layout vertical, fill: true:              # fills remaining vertical space
      label "Name", style: caption
      input bind: name

    layout vertical, fill: true:              # shares the space with the name section
      label "Bio", style: caption
      input bind: bio

    button "Save", color: brand, on tap: save()   # no fill — anchors to bottom
```

Without `fill: true` on the content sections they'd shrink-wrap their content and the button would float in the middle of the screen. Adding `fill: true` to each section is the whole trick — no special property on the button, no bottom-bar syntax. It's the same pattern Flutter uses with `Expanded` inside a `Column`.

### Background images

`background:` on layouts and screens accepts colour names or image filenames. Colour names are unquoted. Image filenames are quoted strings:

```igni
layout vertical, background: red:
  label "Red background"

layout vertical, background: "sunset.jpg", rounded: medium:
  label "Image background"

screen Destini, background: "background.png":
  layout vertical, padding: large:
    label story_text, color: white
```

The same detection rule as the `image` primitive: if the value starts with `http`, it's a network image; otherwise, it's a local file from the `images/` folder. The toolchain handles asset registration.

The image fills the layout or screen area. Content renders on top of it. Use `color: white` on labels and other primitives to ensure text is readable against dark images.

```igni
screen Hero, background: "https://example.com/hero.jpg":
  layout vertical, fill: true, align: center:
    label "Welcome", style: heading, color: white
```

---

## Showing Things

Display primitives — things that render content on screen.

| Primitive   | Purpose              | Example                                        |
|-------------|----------------------|------------------------------------------------|
| `label`     | Display text         | `label "Hello", style: heading`                |
| `image`     | Display an image     | `image "photo.png", size: 48, round: true`     |
| `icon`      | Display an icon      | `icon "play", size: large, color: brand`       |
| `badge`     | Status indicator     | `badge "Online", color: green`                 |
| `spinner`   | Loading indicator    | `spinner`                                      |
| `divider`   | Visual separator     | `divider`                                      |

> **Tokens you'll see:** `color: brand`, `style: heading`, `size: large`, `color: green` — these are design tokens. They're names for consistent values, not raw pixels or hex codes. The full list lives in §Styling; for now, recognise them as named values.

**Primitives that display values** (`label`, `badge`, etc.) accept any type — strings, numbers, booleans — and render them as text. There is no need to convert numbers to strings explicitly before passing them to a `label`. `label count` renders the current value of `count` whether it's `0`, `42`, or `"Hello"`.

Labels support `align: center` for centred text.

Icons are referenced by name from a built-in icon set. Common UI icons (`play`, `pause`, `skip`, `search`, `settings`, `close`, `back`, etc.) are guaranteed to exist by name; the full set is the runtime's responsibility. No imports, no asset wiring.

### Icon buttons

Because `on tap:` attaches to any primitive (see *Events*), an icon can serve as a tappable button directly:

```igni
icon "play", size: large, color: brand, on tap: play_song()
icon "trash", size: medium, color: danger, on tap: delete_item()
```

This is the **canonical way to make icon-only buttons in Igni.** Don't try to nest an `icon` inside a `button` — `button` is a primitive that takes a text label, not a block that holds child primitives.

### `image round:` vs `layout rounded:`

Two different properties with similar names — easy to conflate, important to keep distinct:

- **`image url, round: true`** — boolean. Renders the image as a circle (e.g. for avatars). Either circular or not, no in-between.
- **`layout vertical, rounded: medium`** — design token. Rounds the corners of the layout's background to the specified radius (`small`, `medium`, `large`).

```igni
image user.avatar, round: true                    # circular avatar
layout vertical, padding: medium, rounded: medium # rounded-corner layout
```

They look similar but apply to different primitives and behave differently.

---

## Interactive Things

Input primitives — things the user interacts with.

| Primitive   | Purpose              | Example                                        |
|-------------|----------------------|------------------------------------------------|
| `button`    | Tappable action      | `button "Save", color: brand, on tap: save()`  |
| `input`     | Text entry           | `input bind: email, placeholder: "Email"`      |
| `toggle`    | On/off switch        | `toggle bind: dark_mode, label: "Dark mode"`   |
| `checkbox`  | Tick box             | `checkbox bind: agreed, label: "I agree"`      |
| `slider`    | Range selector       | `slider bind: volume, min: 0, max: 100`        |
| `dropdown`  | Pick from options    | `dropdown bind: country, options: countries`   |

### Circular buttons

By default, `button` is a full-width rounded rectangle. Add `shape: circle` for compact circular buttons — useful for +/- steppers and other icon-style controls:

```igni
button "-", shape: circle, color: subtle, on tap: weight = weight - 1
button "+", shape: circle, color: subtle, on tap: weight = weight + 1
```

Circular buttons never stretch to fill their parent — they size to their content plus a small fixed padding, so a row of them lays out as distinct tap targets rather than one wide bar. Use short text inside (usually one or two characters: `-`, `+`, `x`, `?`, digits).

For icon-only tappable targets without a filled background, use `icon` with `on tap:` directly (see *Icon buttons* below). `button shape: circle` is the filled-background variant — `icon on tap:` is the raw-glyph variant.

---

### Data binding (`bind:`)

Use `bind` to connect a primitive to a variable. Changes flow both ways automatically.

```igni
screen Settings:
  email = "tyr@example.com"
  dark_mode = false

  layout vertical, gap: medium, padding: large:
    input bind: email, placeholder: "Email"
    toggle bind: dark_mode
```

No `onChange`, no `setState`, no event payloads. `bind` is the only pattern for two-way data.

`bind` reassigns the bound variable on every change — every keystroke for `input`, every flip for `toggle` and `checkbox`, every drag for `slider`. This is intentional and is what makes the reactive read pattern work for live filtering. **But it's also a footgun for input + fetch combinations.** See the "Common pitfall" callout in *Async Data*.

---

## Events

```igni
on tap: count = count + 1
on tap: save()
on touch: play("note1.wav")
on change: validate(email)
```

> **Handlers accept any statement.** The examples above mix inline reassignment (`count = count + 1`) with function calls (`save()`, `validate(email)`). Function syntax is covered in §Functions; for now, read `save()` as "run the `save` function defined elsewhere in this screen."

**`on tap:` fires on release** (finger lifts off screen). Use it for deliberate actions — buttons, navigation, list items. The user confirms intent by completing the tap.

**`on touch:` fires on contact** (finger touches screen). Use it for instant response — instruments, games, drag interactions. The action happens the moment you touch.

```igni
button "Save", on tap: save()              # confirmed action
layout vertical, on touch: play("C4"):     # instant response
```

**`on change:` fires when a bound value changes.** Use it for side effects — validating an input, updating a dependent variable, filtering after a dropdown pick. For `dropdown`, `toggle`, `checkbox`, and `slider`, it fires once per selection. For `input`, it fires on every keystroke (same as `bind:`):

```igni
dropdown bind: country, options: countries, on change: update_region()
input bind: email, placeholder: "Email", on change: validate(email)
```

`on change:` attaches to any primitive that supports `bind:` — `input`, `toggle`, `checkbox`, `slider`, `dropdown`. It does not apply to primitives without `bind:`. The bound variable is already updated when `on change:` fires — inside the handler, you can read the new value.

95% of apps only need `on tap:`. Use `on touch:` when latency matters — a xylophone that plays on release feels laggy; a piano app would be unusable.

`on tap:` and `on touch:` can attach to **any primitive, layout, or component invocation** — not just `button`. List items, cards, avatars, icons, and whole layouts are all tappable the same way:

```igni
PostCard post, on tap: navigate to PostDetail post
icon "play", size: large, on tap: play_song()
```

**Events go on the same line as the primitive or layout, not as indented children.** This is a common mistake:

```igni
# WRONG — events are not children
layout vertical, background: red:
  on tap: play("note1.wav")

# RIGHT — events go on the same line
layout vertical, background: red, on tap: play("note1.wav"):
```

**Multiple events can coexist on one element.** An element can have both `on tap:` and `on touch:` — they fire independently:

```igni
layout vertical, background: red, on tap: select(), on touch: play("click.wav"):
  label "Tap selects, touch plays sound"
```

**Custom event names from components.** Components can declare their own event channels via `emit <name>` inside an event handler. Callers attach handlers using the same `on <name>:` syntax — see *Component Events* in the Components section. Reserved names: `tap`, `change`, `touch` cannot be used as custom event names.

**For tappable list items, prefer extracting a custom component and putting `on tap:` on the invocation,** rather than putting it on a `layout` block-opening line. Block lines that combine `on tap:` with a trailing `:` are valid but harder to read:

```igni
component PostCard(post):
  layout vertical, padding: medium, background: card, rounded: medium:
    label post.title, style: heading.small
    label post.excerpt, style: body, color: subtle

# In the screen:
each post in posts, paginate: 20:
  PostCard post, on tap: navigate to PostDetail post
```

---

## Conditionals

```igni
if user.online:
  badge "Online", color: green
else if user.away:
  badge "Away", color: subtle
else:
  badge "Offline", color: subtle
```

`else if` chains as many conditions as you need. No ternary operators. No inline conditionals. Only `if` / `else if` / `else`.

**Conditionals are statements, not expressions.** `if`/`else` blocks render or run different things based on a condition — they do not produce values. Do not write `color: todo.done and subtle` or similar boolean-expression-as-value patterns. To conditionally style or render, either use an `if`/`else` block or the normal conditional-assignment pattern:

```igni
if todo.done:
  label todo.text, color: subtle
else:
  label todo.text
```

### Conditional assignment (value selection pattern)

When you need to choose between values based on a condition, use assignment followed by conditional reassignment. **Conditionals are statements, not expressions** — you cannot write `x = if cond: a else: b`. Instead:

```igni
display = sorted_list
if descending:
  display = reversed(display)
```

This is the canonical Igni pattern for conditional value selection. Assign the default, then override if the condition holds. The same pattern works for multiple conditions:

```igni
greeting = "Hello"
if time_of_day is "morning":
  greeting = "Good morning"
else if time_of_day is "evening":
  greeting = "Good evening"
```

The same pattern now works cleanly for styling values:

```igni
status_color = green
if bmi < 18.5:
  status_color = danger
else if bmi >= 25:
  status_color = orange

label "BMI", color: status_color
```

### Multi-view screens (tactical pattern for tightly coupled flows)

When two or three views share state and are tightly coupled — like a list and its detail view — you can put both views inside the same `screen` and use `if`/`else` at the screen body level to swap between them. State lives in one place, and "navigation" is just variable assignment:

```igni
screen NotesApp:
  notes = []
  selected = null
  draft_title = ""
  draft_body = ""

  if selected is null:
    # List view
    layout vertical, gap: medium, padding: large:
      label "My Notes", style: heading
      if notes is empty:
        label "No notes yet", style: body, color: subtle
      else:
        each note in notes:
          NoteRow note, on tap: open(note)
      button "New Note", color: brand, on tap: create()
  else:
    # Detail view
    layout vertical, gap: medium, padding: large:
      input bind: draft_title, placeholder: "Title"
      input bind: draft_body, placeholder: "Body"
      layout horizontal, gap: medium:
        button "Save", on tap: save()
        button "Delete", color: danger, on tap: delete()
        button "Back", on tap: selected = null

  open(note):
    selected = note
    draft_title = note.title
    draft_body = note.body

  create():
    new = {title: "Untitled", body: ""}
    notes = notes + [new]
    open(new)

  save():
    notes = replace(notes, selected, {selected with title: draft_title, body: draft_body})
    selected = null

  delete():
    notes = without(notes, selected)
    selected = null

component NoteRow(note):
  layout horizontal, padding: medium, background: card, rounded: medium:
    label note.title, style: body
```

**This is a tactical pattern, not the canonical architecture for multi-screen apps.** It's the right answer when:

- Exactly two or three tightly coupled views that share state — not a stand-in for general navigation
- You don't need real navigation features (back button, deep links, URL history)
- The coupled views are small enough to fit in one file naturally

It's the wrong answer when:

- You have many screens (5+) — they should be separate, with shared state via `shared:`
- You need browser back button, deep links, URL history, or route-based authorization
- The views are unrelated and should be independently navigable
- Forcing them into one file would make the file unmaintainable

For those cases, use separate `screen` definitions with `navigate to` and put the shared data in a `shared:` block.

---

### Boolean operators

Use `not`, `and`, `or` — not symbols.

```igni
active = not active
if logged_in and verified:
  show Dashboard
```

**`is` checks equality.** It already works for `is empty`, `is loading`, `is error` — and extends to any value. `name is "Tyr"`, `count is 0`, `weather is null`, `op is "+"` are all valid. Negate with `is not`:

```igni
if name is "Tyr":
  greet()
if count is 0:
  show EmptyState
if weather is not null:
  show_forecast(weather)
if op is not empty:
  evaluate()
```

Igni has no `==` or `!=`. Use `is` and `is not` for all equality checks. One operator, all cases.

**Comparison operators** handle ordering — bigger, smaller:

```igni
if age > 18:
  label "Adult"
if price >= 100:
  label "Premium"
if stock < 10:
  label "Low stock"
if score <= 0:
  label "Game over"
```

`is` handles "same or not same." `>`, `<`, `>=`, `<=` handle "bigger or smaller." Two systems, clean separation.

**`is in` and `is not in`** check whether an item exists in a list, by identity match (the same equality `is` uses):

```igni
if product is in shared.cart:
  label "Already in cart"
else:
  button "Add to cart", on tap: shared.cart = shared.cart + [product]

if user is not in moderators:
  label "Read-only mode", color: subtle
```

**Conditionals require explicit boolean values.** Do not pass strings, numbers, or other non-boolean values as conditions. Use `is empty` / `is not empty` for absence checks, `is 0` / `is not 0` for numeric checks, and `is null` / `is not null` for nullable values. Igni has no truthiness coercion — `if name:` (where `name` is a string) is invalid; write `if name is not empty:` instead.

---

## Lists — basics

```igni
each item in user.posts:
  PostCard item
```

For long lists fetched from a server, add `paginate:` to fetch in chunks and auto-load more on scroll:

```igni
each post in posts, paginate: 20:
  PostCard post
```

If the iterated variable is still loading (see *Async Data*), the `each` block renders nothing and the screen falls back to its loading state.

No `ListView.builder()`, no keys, no index boilerplate.

### Adding to a list

Use `+` to join lists or append items. Wrap a single item in `[ ]` first:

```igni
items = items + [new_item]                # append one item
combined = list_a + list_b                # join two lists
```

`+` works the same way for lists as it does for strings: it concatenates. There is no `.add()` method.

### Removing from a list

Use the `without` builtin. It returns a new list with the given item removed; assign the result back to the list.

```igni
items = without(items, target)
```

If the item appears multiple times, only the first occurrence is removed. There is no in-place removal — `without` returns a new list and you reassign.

### Replacing items

Use `replace` to swap one item in a list for another. It returns a new list with the first occurrence of `target` replaced by `new_item`; assign the result back to the list:

```igni
items = replace(items, target, updated_target)
```

`replace` mirrors the `without` pattern: identity-based match, returns a new list, no in-place mutation. If the target appears multiple times, only the first occurrence is replaced. If the target isn't in the list, the list is returned unchanged.

This is the cheap way to update one item without writing the full `each` filter loop. The verbose `each` rebuild is still available when you need more control (e.g., updating multiple items in one pass), but for the common "replace this one item" case, `replace` is the idiom.

> **More list operations are covered later.** `map`, `filter`, `sorted`, `count`, `find`, and the `{target with field: …}` object-update form live in §Lists — transformations, after §Async Data. They most often operate on data that arrived via `fetch()`, which is why they're taught alongside async rather than here.

## Functions

```igni
greet(name):
  return "hello " + name

validate(email):
  if email is empty:
    return false
  return true
```

Parentheses around arguments. Colon opens the block. No `def`, `func`, or `fn` keyword — the name followed by parentheses is enough.

Functions defined **inside a `screen` or `component`** close over the surrounding state and can read or write any variable declared there. Top-level functions cannot. This is how event handlers mutate screen state without prop-drilling:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, align: center:
    label count, style: heading
    button "Add", on tap: bump()

  bump():
    count = count + 1
```

**Function calls return values that compose anywhere a value is expected.** A function that returns a value can be called in any expression position — assigned to a variable, passed as a positional argument to a primitive, or used inside a `+` expression:

```igni
count = total_items()                              # returned value assigned to a variable
icon icon_for_state(), size: large                 # returned value used as a positional argument
label "Score: " + format_score(score), style: heading
```

**Cross-screen function calls are NOT allowed.** Functions defined inside one screen are not visible to other screens, even if those screens are connected by `navigate to`. A screen can only call its own functions and the functions defined in components it directly contains.

If a detail screen needs to mutate state owned by a list screen (e.g. saving an edited note back to the parent's list), use **shared state** (see *Shared State*).

---

## Components

Once a screen has three similar UI blocks — three cards with the same style, three buttons laid out the same way — extracting a component starts to pay off. Components take whatever slice of layout you've found yourself repeating and give it a name, parameters, and a body.

A reusable UI piece. No imports, no exports, no boilerplate. If it exists in the project, it can be used anywhere.

```igni
component Avatar(url, size):
  image url, size: size, round: true

component Stat(label, value):
  layout vertical, align: center:
    label value, style: heading.small
    label label, style: caption, color: subtle
```

Invocation has no parentheses — the component name followed by its arguments is enough:

```igni
Avatar user.avatar, size: 80
Stat "Followers", user.followers
```

A component with no arguments is invoked by name alone — no parentheses, no trailing colon (unless it's a wrapper accepting a `body`):

```igni
component CartIcon():
  icon "cart", size: large, color: brand, on tap: navigate to Cart

# Invocation:
CartIcon
```

**Components take data via arguments and contain other components via indentation. A component is never passed as an argument to another component.** This rule is what keeps invocation unambiguous without parentheses. If you want one component to render another, lift it into the outer component's body or pass the data and let the outer component build it.

**Arguments to components and screens are immutable.** To edit a value passed in, declare a local variable inside the body:

```igni
screen PostDetail(post):
  draft = post.title

  layout vertical, gap: medium, padding: large:
    input bind: draft, placeholder: "Title"
```

**Cross-component function calls.** A child component invoked from inside a screen can call functions defined in that screen's body. The function call passes through normally — the child doesn't need to declare anything special. **This is for child components, not for screens called via `navigate to` — see the cross-screen rule in the Functions section.**

```igni
screen Todos:
  items = []

  layout vertical, gap: medium:
    each item in items:
      TodoItem item, on tap: toggle(item)

  toggle(target):
    items = replace(items, target, {target with done: not target.done})

component TodoItem(todo):
  layout horizontal, gap: small:
    label todo.text
    button "Delete", on tap: remove(todo)   # `remove` lives in the parent screen
```

### Wrapper components with `body`

A **wrapper component** is a component that uses the `body` keyword to render caller-provided content. If you need a component that wraps other components' content — cards, modals, loading states — this is the pattern.

The wrapper provides structure (a card border, modal backdrop, loading spinner), and the caller provides the content that goes inside.

To make a wrapper, use the `body` keyword inside the component. It marks where the caller's content renders:

```igni
component Card(title):
  layout vertical, padding: medium, background: card, rounded: medium:
    label title, style: heading.small
    body                              # caller's content renders here
```

**`body` renders exactly one widget.** It's a slot, not a container — the caller provides a single top-level element, and that element goes where `body` sits. If the caller wants multiple children, they wrap them in an explicit `layout vertical:` or `layout horizontal:`:

```igni
Card "Settings":
  layout vertical, gap: small:
    toggle bind: dark_mode, label: "Dark mode"
    toggle bind: notifications, label: "Notifications"
    button "Logout", color: danger, on tap: logout()
```

The `layout vertical:` is the caller's single top-level element. Its children render stacked inside the Card.

For a single child, no wrapping is needed:

```igni
Card "Stats":
  label "Users: " + user_count, style: heading
```

**A wrapper has exactly one `body` slot.** No named slots like `header` and `footer`. The 90% of real cases (cards, modals, sections, loading wrappers) only need one slot anyway.

The rule "body = one widget" is what keeps wrappers predictable. Without it, `body` would need to implicitly wrap caller content in a vertical layout — and that hidden wrapper breaks the moment the wrapper's `body` sits inside a horizontal layout, or callers want buttons side-by-side.

### Conditional wrappers

`body` can appear inside an `if`/`else` block, so the wrapper can render its body conditionally — or skip it entirely. This is the right pattern for loading wrappers, auth guards, and modals:

```igni
component LoadingWrapper(loading):
  if loading:
    spinner
  else:
    body

component AuthGuard(user):
  if user is null:
    layout vertical, align: center, gap: medium:
      label "Please log in to continue"
      button "Log in", color: brand, on tap: navigate to Login
  else:
    body

component Modal(open):
  if open:
    layout vertical, background: overlay, padding: large:
      body
```

**`body` can be invoked zero or once in any single render.** The "zero" case (when the wrapper renders something else instead) is what makes conditional wrappers possible. `body` cannot be invoked more than once.

Use a wrapper the same way you use any other component:

```igni
LoadingWrapper user is loading:
  layout vertical, gap: small:
    label user.name, style: heading
    label user.bio, style: body, color: subtle

AuthGuard shared.current_user:
  Dashboard
```

If `user is loading`, the `LoadingWrapper` renders a spinner and the caller's body is skipped. Otherwise, the body renders. The same pattern applies to `AuthGuard` (only renders the body when logged in) and `Modal` (only renders the body when `open` is true).

### Component Events

A component that contains internal interactive elements (a stepper with +/- buttons, a colour picker with swatches, a list row with a delete affordance) needs a way to tell the parent screen "the user did something." Components do this with `emit` — a custom event channel the caller wires up exactly like `on tap:` on a primitive.

```igni
component Stepper(value):
  layout horizontal, gap: medium, align: center:
    button "-", shape: circle, on tap: emit decrement
    label value, style: heading
    button "+", shape: circle, on tap: emit increment

screen Settings:
  weight = 60
  age = 25

  layout vertical, gap: large, padding: large:
    Stepper weight, on increment: weight = weight + 1, on decrement: weight = weight - 1
    Stepper age, on increment: age = age + 1, on decrement: age = age - 1
```

Inside the component, `emit increment` says "fire the increment event channel." At the call site, `on increment: weight = weight + 1` says "when the increment event fires, run this action." The action evaluates in the parent screen's scope — `weight` resolves against the parent's variables, exactly as it would for `button "+", on tap: weight = weight + 1` written directly in a screen body.

**`emit` is only valid as the action of an event handler.** It must appear inside `on tap:`, `on touch:`, or `on change:`. Standalone `emit X` at the component body level is a parse error — there's no implicit lifecycle moment for it to fire on. Igni has no `on mount` or `on render` hooks; emit is purely a wiring of one explicit trigger to one custom event channel.

```igni
# valid
button "+", on tap: emit increment
icon "trash", on tap: emit delete
input bind: query, on change: emit search

# error: `emit` must appear inside an `on tap:`, `on touch:`, or `on change:` handler
component Bad(value):
  emit increment
  label value
```

**Custom event names cannot collide with built-in event names.** `emit tap`, `emit change`, and `emit touch` are parse errors because they would create ambiguity about which handler fires when both the component and the wrapping invocation use the same event name. The error message names the conflict explicitly.

**Events can carry data.** Pass a value after the event name, and the parent's handler receives it as a named binding:

```igni
component AlertRow(alert):
  layout horizontal, gap: medium, padding: medium, background: card, rounded: medium:
    label alert.message
    icon "trash", color: danger, on tap: emit delete alert

screen Alerts:
  alerts = [...]

  layout vertical, gap: medium:
    each alert in alerts:
      AlertRow alert, on delete: alerts = without(alerts, alert)
```

Inside the parent's `on delete:` handler, `alert` is the value the component emitted — same shape as `on change:` on a primitive making the bound variable implicitly available. The component author picks the binding name; the caller uses that name in the handler body.

**Optional handlers.** A parent that doesn't attach a handler for an event the component emits has no special behaviour — the event simply doesn't go anywhere. Same rule as `button "X"` without `on tap:` — legal, just inert. This means component authors can declare events that callers may ignore.

**Composition.** A wrapper component that contains another emitting component can re-emit by writing the inner event's handler as another `emit`:

```igni
component LabeledStepper(label, value):
  layout vertical, gap: small:
    label label, style: caption
    Stepper value, on increment: emit increment, on decrement: emit decrement
```

Events bubble explicitly. There is no implicit propagation — every level that wants to expose an event must declare it.

---

## Shared State

Some state is owned by a single screen and lives in its body. Some state needs to be read or modified by multiple screens — a shopping cart accessed from product, checkout, and profile pages; an authenticated user accessed from many screens; a settings value applied across the app. For that, use a top-level `shared:` block.

```igni
# in cart.igni
shared:
  cart: [Item] = []
  cart_total = 0
```

Read shared state from any screen with the `shared.` prefix:

```igni
screen Cart:
  layout vertical, gap: medium, padding: large:
    label "Your Cart", style: heading
    if shared.cart is empty:
      label "Your cart is empty", color: subtle
    else:
      each item in shared.cart:
        label item.name
      label "Total: $" + shared.cart_total, style: heading.small
```

Write to it the same way:

```igni
screen ProductDetail(product):
  button "Add to Cart", color: brand, on tap: add_to_cart()

  add_to_cart():
    shared.cart = shared.cart + [product]
    shared.cart_total = shared.cart_total + product.price
```

**The same lexical reactivity rule applies:** any screen that reads `shared.cart` (or any other shared variable) re-evaluates whenever that variable is reassigned. There's no special subscription mechanism — `shared.X` is just a variable that lives outside any single screen, and it follows the same reactivity rule as local variables.

The `shared.` prefix is the **visible coupling marker.** At every read or write site, you can see at a glance whether the variable is local to the screen or shared across the project. There are no hidden globals.

### Multi-file shared state

Any `.igni` file can have a `shared:` block at the top. All `shared:` blocks across all files merge into a single global namespace, so you can organise shared state by feature:

```igni
# in cart.igni
shared:
  cart: [Item] = []
  cart_total = 0
```

```igni
# in auth.igni
shared:
  current_user: User = null
  is_logged_in = false
```

Both `shared.cart` and `shared.current_user` are accessible from any screen in any file. **Defining the same name in two different `shared:` blocks is an error** — one global namespace, one definition per name.

There is no per-file scoping. There is no way to "import" a shared variable from a specific file. The `shared.` namespace is flat and global. If you want feature-organised state, organise the *definitions* across files but address them all by the same flat names.

### When to use shared state

Use `shared:` when:

- Multiple screens read or modify the same data (cart, user, theme, auth tokens)
- A change made in one screen needs to be visible in another (the Notes app's "edit in detail screen, see updated title in list screen" pattern)
- The state outlives any single screen (cart persists across product browsing, checkout, and profile)

Don't use `shared:` for:

- State owned by exactly one screen (form drafts, local UI toggles, animation progress)
- State that should reset when you leave the screen (modal open/closed, current tab)
- State you want to pass explicitly as a screen argument (a specific user the detail screen is showing)

The rule of thumb: **if only one screen reads the value, it's local. If two or more screens need it, it's shared.**

---

## Navigation

```igni
navigate to Profile user
navigate back
```

For state that needs to be visible to multiple screens (a cart, a logged-in user, app-wide settings), use a `shared:` block — see *Shared State*. Navigation passes per-screen arguments, but shared state lives outside the screen graph and follows you around.

---

## Async Data

Fetch data from a server with `fetch`. The assignment looks synchronous, but the screen knows the value arrives asynchronously and tracks three states for it: **loading**, **error**, and **loaded**.

```igni
screen Profile(user_id):
  user: User = fetch("/api/users/" + user_id)

  if user is loading:
    spinner
  else if user is error:
    label "Couldn't load profile", color: danger
  else:
    layout vertical, gap: medium, padding: large, align: center:
      Avatar user.avatar, size: 80
      label user.name, style: heading
      label user.bio, style: body, color: subtle
```

The rule: **a line that calls `fetch` (or any function returning async data) blocks until it resolves.** The variable starts in `loading`, transitions to either `error` or the resolved value, and the screen re-renders at each transition. `is loading` and `is error` are the only new tests — for the success case, just use the variable normally.

If multiple async assignments appear in the same screen, they fetch in parallel, and the screen is in `loading` until all of them have resolved (or any of them errors).

### Reactive re-fetch

When a `fetch` URL depends on a variable that changes during the screen's lifetime — like a search input or a filter — the fetch automatically re-runs each time that variable is reassigned, by the lexical reactivity rule. There's no special "refresh" mechanism. Just declare the fetch at the screen body and let reactivity drive re-fetches.

But there is a footgun: read the next section before binding a fetch URL directly to an `input`.

### Common pitfall: don't bind a fetch directly to a text input

This looks like clean reactive code — and it is — but it spams the API on every keystroke:

```igni
screen Search:
  query = ""
  results = fetch("/api/search?q=" + query)   # FOOTGUN

  layout vertical, padding: large:
    input bind: query, placeholder: "Search..."
    each r in results:
      label r.title
```

`input bind: query` reassigns `query` on every keystroke. The reactivity rule re-evaluates the screen on every reassignment. The `fetch` line re-runs on every re-evaluation. Type "shoes" and you've made 5 API calls.

**The fix is the trigger-variable pattern.** Bind the input to one variable (`query`), then update a *separate* "trigger" variable (`active`) from an `on tap:` handler on a button. The button tap is the explicit user action that gates the fetch:

```igni
screen Search:
  query = ""               # bound to the input — updates on every keystroke
  active = ""              # trigger — only updates when "Search" is tapped
  results = fetch("/api/search?q=" + active)

  layout vertical, padding: large:
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search..."
      button "Search", on tap: active = query
    each r in results:
      label r.title
```

Now the fetch only re-runs when `active` is reassigned, which happens once per "Search" tap.

**A `fetch` URL that references a variable bound to an `input` is a transpile error.** `results = fetch("/api/search?q=" + query)` with `input bind: query` anywhere in the same screen is rejected with a fix-it message pointing at the trigger-variable pattern. The rule is narrow on purpose: string-concatenation in the URL, direct reference to a bind target, `input` primitive only. `toggle` / `slider` / `checkbox` / `dropdown` re-fire on discrete user actions — fetch-on-change is the intended behaviour there (filters, sliders), so those combinations stay legal. Igni has no implicit debouncing, so the trigger-variable pattern above is the sanctioned way to gate a text-input fetch behind an explicit action. `on change:` on the bound input is *not* an escape hatch — it fires on every keystroke, so copying the bound variable into the trigger from an `on change:` handler (`on change: active = query`) re-creates the per-keystroke fetch the rule is designed to prevent. Use a button tap.

The same trigger pattern works for any expensive computation that you want to gate behind an explicit user action: a "Recalculate" button, a "Filter" dropdown that only applies on selection rather than focus, etc.

### Mutations

**`fetch` at screen body level is reactive** — it re-runs whenever a dependency changes. **`fetch` inside a function is imperative** — it runs once when the function is called. Screen-level fetch is for loading data; function-level fetch is for mutations triggered by user actions.

For requests that change server state, pass `method:` and `body:`. The pattern is: **track loading and error state on the screen as variables, mutate them from the function, render conditionally in the layout.** Reactivity does the rest.

```igni
screen PostDetail(post):
  draft = post.title
  saving = false
  save_error = null

  layout vertical, gap: medium, padding: large:
    input bind: draft, placeholder: "Title"
    button "Save", on tap: save_post()

    if saving:
      spinner
    if save_error is not null:
      label save_error, color: danger

  save_post():
    saving = true
    save_error = null
    result = fetch("/api/posts/" + post.id, method: "PATCH", body: {title: draft})
    if result is error:
      saving = false
      save_error = "Couldn't save"
    else:
      navigate back
```

`method:` accepts `"GET"` (default), `"POST"`, `"PUT"`, `"PATCH"`, or `"DELETE"`. The result of a mutation has the same loading/error/loaded states as a read. Branch on `is error` for failure; continue normally for success.

**UI primitives like `label` and `spinner` only render when they appear in a screen or component body — never inside a function.** Functions exist to mutate state. The layout reads that state and re-renders. This separation is what keeps reactivity predictable: there is exactly one place a primitive can render (its position in the tree), and it shows up there because of what the variables currently hold.

That's the entire async model: one primitive (`fetch`), two new tests (`is loading`, `is error`), and one keyword (`is`) — which extends to general equality. Everything else falls out of the existing state and reactivity rules.

### Device location

`locate()` returns the device's current geographic position as an async value, with the same `loading` / `error` / loaded shape as `fetch`:

```igni
screen Where:
  here = locate()

  if here is loading:
    spinner
  else if here is error:
    label "Couldn't get location"
  else:
    label round(here.latitude, 4) + ", " + round(here.longitude, 4)
```

Two fields are guaranteed on the loaded value: **`.latitude`** and **`.longitude`** (decimal degrees as floats). Accuracy, altitude, heading, and timestamp are not exposed in v0.11.

The first call to `locate()` in a session triggers the platform permission prompt (web, iOS, Android). If the user denies, the value resolves to `is error` — there is no separate `is denied` state. The transpiler handles the platform plumbing; the language never exposes a permission-request API.

All failure modes — denied permission, location services disabled, no satellite signal, unsupported platform — collapse to `is error`. Apps can show a generic "location unavailable" message; per-cause messaging is not exposed by `locate()` in v0.11.

`locate()` is a **one-shot read**. The screen renders `loading` once, transitions once to `error` or the resolved coordinates, and stays there until the screen is rebuilt (e.g. via `navigate to` and back). Continuous tracking — a value that updates as the user moves — is a different primitive and is not part of v0.11.

**Reactive-fetch footgun extends to `locate()` results.** A `fetch` URL that concatenates `.latitude` or `.longitude` from a `locate()` result is rejected at compile time, for the same reason that fetching with a bound input is:

```igni
screen Weather:
  here = locate()
  forecast = fetch("/api/forecast?lat=" + here.latitude)   # FOOTGUN — rejected
```

The location resolves once, but a screen that re-evaluates `locate()` after navigating back re-issues the fetch with no visible cause in the source — the same "no magic" violation the v0.9.0 rule was designed to catch. Use the trigger-variable pattern: bind the fetch to a separate variable, then copy the coordinates into it from an `on tap:` handler.

```igni
screen Weather:
  here = locate()
  coords = ""
  forecast = fetch("/api/forecast?c=" + coords)

  if here is loading:
    spinner
  else if here is error:
    label "Location unavailable"
  else:
    button "Get forecast", on tap: coords = round(here.latitude, 4) + "," + round(here.longitude, 4)
    if coords is "":
      label "Tap to load forecast"
    else if forecast is loading:
      spinner
    else if forecast is error:
      label "Forecast unavailable"
    else:
      label forecast.summary
```

`coords` starts empty, so the screen's first render does fire `fetch("/api/forecast?c=")` once — that empty-input call resolves to `is loading` then `is error`, but the layout never shows it because the `coords is ""` branch wins first. When the user taps "Get forecast", `coords` is reassigned and the fetch re-runs once with the real coordinates. Same trigger-variable shape as the v0.10 search example above, with the same one-API-call cost on initial render.

> **Once you have fetched data in hand, reshape it with the list transformations in §Lists — transformations below** — `filter`, `map`, `sorted`, `count`, `find`, and the `{target with field: …}` object-update form.

---

## Lists — transformations

Once you have a list of data, these builtins reshape it: find individual items, count, filter down, remap, sort, measure, and update. They commonly operate on data that arrived via `fetch()` — see §Async Data above — which is why this section sits after async rather than with §Lists — basics.

### Finding items and counting

`find` has two forms: **identity-based** (find an exact object) and **predicate-based** (find by condition).

Identity-based — pass the object directly:

```igni
match = find(items, target)
if match is null:
  label "Not found"
else:
  label match.name
```

Predicate-based — pass a lambda that returns true for the item you want:

```igni
match = find(products, p => p.id is target_id)
if match is null:
  label "Not found"
else:
  label match.name
```

**Use the predicate form when looking up by field.** `find(list, {id: x})` does NOT work — the dict literal is a new identity. Use `find(list, item => item.id is x)` instead.

**Identity is reference-based, not structural.** Two separately created objects with the same fields are NOT the same identity. `{id: 1, name: "Tyr"}` created in one place and `{id: 1, name: "Tyr"}` created in another are different objects. Identity-based builtins (`find(list, target)`, `without`, `replace`, `count`, `is in`) match by reference — the target must be the *same object*, not just an object with the same fields. For field-based matching, always use the lambda form.

Use `count` to get the number of items matching a target (0 if none):

```igni
favourites = count(messages, current_user)
label favourites + " favourites"
```

`count` is identity-based and follows the same `is`-equality rules as `is in`.

**Counting by field.** `count(list, target)` matches whole values only — it doesn't accept a predicate, so `count(alerts, "critical")` on a list of alert objects always returns 0 (an object is never equal to a string). For field-based counting, compose `length` and `filter`:

```igni
critical_count = length(filter(alerts, a => a.level is "critical"))
```

`count` is for counting exact-value matches like `count(votes, "yes")` on a list of strings. Unlike `find`, it doesn't accept a predicate — use `length(filter(...))` for any field-based match.

**Quantity tracking with `count`.** To track how many of each item appear in a collection (e.g. a shopping cart), store duplicates in the list and use `count` to compute quantities on demand:

```igni
add_to_cart(product):
  shared.cart = shared.cart + [product]

# In the cart screen:
each item in shared.unique_items:
  qty = count(shared.cart, item)
  label item.name + " x " + qty
```

### Mapping, filtering, and sorting

`map` returns a new list with each item transformed by a lambda:

```igni
names = map(users, user => user.name)
updated = map(items, item => {item with done: true})
```

`filter` returns a new list containing only items that match a predicate:

```igni
done_items = filter(todos, item => item.done)
active_users = filter(users, u => u.active)
with_bio = filter(users, u => u.bio is not empty)
```

`sorted` returns a new list sorted ascending by a key:

```igni
by_name = sorted(users, user => user.name)
by_price = sorted(products, p => p.price)
```

`reversed` returns a new list in reverse order:

```igni
newest_first = reversed(sorted(posts, p => p.date))
last_five = reversed(recent_messages)
```

For descending sort, compose `reversed` and `sorted`: `reversed(sorted(list, item => key))`. Sorting and reversing are separate operations — one builtin per task.

All four return new lists. None mutate the original. Same immutability rule as `without` and `replace`.

### List length

Use `length` to get the number of items in a list (0 for an empty list):

```igni
n = length(cart)
label n + " items in your cart"
```

### Iterating in functions

`each` works inside function bodies the same way it works inside layouts: as an iteration over a list. Inside a layout, the body of `each` renders something. Inside a function, the body of `each` runs statements. One keyword, two contexts:

```igni
total_price():
  total = 0
  each item in cart:
    total = total + item.price
  return total
```

### Updating list items

**List elements cannot be mutated in place.** To change a field on an item, use `replace` to swap the item for a new one. For more complex updates (multiple items at once, conditional replacement), use the `each` rebuild pattern. Igni's reactivity rule tracks variable reassignment, not field-level changes — keeping the rule simple means updates flow through reassignment.

Simple case — toggle one field on one item:

```igni
toggle(target):
  items = replace(items, target, {target with done: not target.done})
```

`{target with done: not target.done}` builds a new object with *all* of `target`'s fields plus the override. No need to enumerate every field by hand. This is the canonical "update one thing on this object" shape; you will use it everywhere.

Multiple overrides — comma-separate them:

```igni
save_draft(target):
  items = replace(items, target, {target with title: draft_title, body: draft_body})
```

You can add fields that `target` didn't have:

```igni
items = replace(items, target, {target with notes: "added by user"})
```

Complex case — rebuilding the whole list with multiple changes:

```igni
mark_all_done():
  updated = []
  each item in items:
    updated = updated + [{item with done: true}]
  items = updated
```

`each`-rebuild is for when every item changes or the change is conditional; `replace` with `{target with ...}` is for the single-item case.

#### Object-update syntax rules

`{BASE with KEY: VALUE, ...}` where:

- **BASE** is a variable name or a dot-access chain (`target`, `item.profile`, `shared.cart`). Function calls (`get_item() with ...`) and index access (`items[0] with ...`) are rejected — bind the result to a local first, then update. Restricting the base keeps object construction obviously tied to a named object the reader can look up.
- **Overrides** use the same `key: value` syntax as object literals, comma-separated, left-to-right precedence (later wins if a key is repeated — though repeating is a code smell, not an error).
- **Shallow, not deep.** `{target with profile.name: "X"}` is a parse error. To update a nested field, nest explicitly: `{target with profile: {target.profile with name: "X"}}`.
- **Identity is fresh.** `{target with ...} is target` → false. The returned object is a new reference, which is exactly what `replace` / `without` / `find` need to tell the two items apart in the list.
- **Braces are required.** Object construction lives inside `{}` everywhere else in the language (literal, return value, fetch body, component arg); `with` stays inside braces so the reader has one visual marker for "here's an object expression." A bare-infix `target with done: true` would introduce a second way to construct objects and collide with the one-way-to-do-everything principle.

The verbose field-enumeration form (`{text: target.text, done: not target.done}`) is still legal — it's a regular object literal — but the `with` form should be preferred whenever you're copying-with-overrides from an existing object.

---

### Lambda expressions

A lambda is a single-expression anonymous function, written with arrow syntax:

```igni
item => item.done
item => item.price * item.quantity
item => item.id is target.id
```

Lambdas are used as arguments to list builtins like `find`, `filter`, and `sorted`. They are **not** general-purpose — you cannot assign a lambda to a variable, return one from a function, or use one outside a builtin call. They exist to give list operations a way to express "which field" or "what condition" without adding a full function definition.

The parameter name before `=>` is the iteration variable. The expression after `=>` is evaluated once per item and can reference any variable in scope (screen state, shared state, function parameters, other iteration variables).

```igni
match = find(products, p => p.id is target_id)
done = filter(todos, item => item.done)
cheapest_first = sorted(products, p => p.price)
```

**One parameter only.** Lambdas take exactly one parameter — the current item in the iteration. Multi-parameter lambdas are not supported; if you need more context, close over variables from the surrounding scope.

---

## Styling

### Colours

Colour names are values. You can use them directly with `color:` / `background:`, or store them in variables first.

**Available colours:** `brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`.

`brand` maps to the app's primary theme colour. `subtle` is grey. `danger` is red. The rest are literal colours. Use them anywhere a colour is expected:

```igni
label "Error", color: danger
label "Dicee", color: white
layout vertical, background: red:
  # red background
screen App, background: blue:
  # blue full-screen background

status_color = green
if failed:
  status_color = danger
label "Status", color: status_color
```

**`card` is a background-only token** — not a colour. `background: card` uses the theme's card colour (typically a slightly elevated surface). It only works with `background:` on layouts and screens, not with `color:` on primitives. `card` can be stored in a variable and passed around as a value, but the background-only restriction still applies at the property boundary. Using `card` with `color:` is an error.

```igni
layout vertical, background: card, rounded: medium:   # themed card surface
layout vertical, background: red:                      # literal red colour

bg = card
if selected:
  bg = brand
layout vertical, background: bg:
  label "Selected", color: white
```

Because tokens are values, they flow through functions and components like any other value. Pass a colour into a component:

```igni
component StatusBadge(text, color):
  badge text, color: color

status = green
if error:
  status = danger
StatusBadge "Health", status
```

Or return one from a function:

```igni
severity_color(level):
  if level is "critical":
    return danger
  if level is "warning":
    return orange
  return green

label alert.message, color: severity_color(alert.level)
```

### Spacing tokens

No raw pixel values for spacing. Use design tokens.

Reference tokens inline: `style: heading`, `color: brand`, `padding: medium`. **Dotted variants** (`heading.small`) use a smaller version of the base style — `heading.small` is a compact heading for subheadings and card titles. The dotted syntax applies to text styles only.

**The "no raw pixels" rule applies to spacing tokens** (`gap`, `padding`, `margin`). **Intrinsic dimensions on primitives** — `image size:`, `slider min:` / `max:`, etc. — accept numeric values directly because they describe the thing itself, not how it's spaced from its neighbours:

```igni
image user.avatar, size: 80           # OK — intrinsic dimension
layout vertical, padding: large       # use the token, not 24
```

### Visual defaults

Igni ships sensible zero-config defaults so a bare `screen` looks reasonable without ceremony. Explicit modifiers always win — these apply only when the user hasn't set their own value:

- Screen body gets 16px padding automatically — unless the root is an explicit `layout` (user-supplied padding wins then).
- `label` renders at 16px by default; `style: heading` makes it bigger.
- `input` renders with an outlined border, always visible even without `placeholder:`.
- `button` sizes to its content — it doesn't stretch. Wrap in `layout` + an alignment modifier to place it.
- `input` caps at 480px wide outside row context. Inside `layout horizontal:` it uses `Expanded`.
- Scaffold background is `#FAFAFA` neutral; brand pink stays on buttons.
- Screens without a `title:` property wrap their body in `SafeArea` so iOS notches / Dynamic Islands don't clip top content. Screens with `title:` (which emit an AppBar) inherit the AppBar's own safe-area handling.

Defaults exist to keep the "three commands to first pixel" promise — you shouldn't need to write padding, font sizes, or SafeArea wrappers to get a reasonable first render.

---

## Theme block

A `theme:` block at the top level of any `.igni` file overrides the default tokens. Omitted keys keep their defaults — `theme:` patches, it doesn't replace.

In v0.12.1, the only live override path is `theme.text.<token>.font:`, which binds a curated font token to one of the style roles (`heading`, `body`, `caption` — `heading.small` inherits the `heading` font):

```igni
theme:
  text:
    heading: font: pacifico
    body: font: source_sans
    caption: font: source_sans
```

Font values come from a curated 6-token bundle: `pacifico` (script), `inter` / `source_sans` (sans), `merriweather` / `lora` (serif), `fira_code` (mono). The bundle is fixed in v0.12.1 — use the closest token if your target font isn't listed. Extensibility (user-registered fonts) is a planned future extension.

The `theme:` block's design intent reaches further than v0.12.1 implements — a full sketch including planned `spacing:` / `color:` sub-blocks and `size:` / `weight:` / `color:` fields on text tokens lives in **Appendix C: Planned theme fields**. Only the font override shown above is wired into the transpiler today.

## Local Images and Audio

### Local images

Put image files in an `images/` folder in your project directory. Reference them by filename:

```text
my-app/
  app.igni
  images/
    dice1.png
    avatar.jpg
    logo.png
```

```igni
image "dice1.png"
image "avatar.jpg", size: 80, round: true
```

For web images, use the full URL:

```igni
image "https://example.com/photo.jpg", size: 100
```

**One rule:** if the path starts with `http`, it's a network image. Otherwise, it's a local file from `images/`. The toolchain handles asset registration — you never configure paths or asset manifests.

The same rule applies to background images on layouts and screens (see *Background Images* in Layout).

### Audio

Put audio files in an `audio/` folder. Reference them by name with `play`:

```text
my-app/
  app.igni
  audio/
    note1.wav
    click.mp3
```

```igni
button "Play", on tap: play("note1.wav")
```

Same convention as `images/` — drop files in the folder, use the name in code. The toolchain handles asset registration and dependency management.

---

## String and Utility Builtins

**`contains` checks whether a string contains a substring:**

```igni
if contains(name, query):
  label name
```

`contains(string, substring)` returns `true` if the substring appears anywhere in the string, `false` otherwise. **`contains` is case-insensitive** — `contains("Alice", "ali")` returns `true`. This matches user expectations for search and filtering. Case-sensitive matching is not currently supported. Use it for search and filtering:

```igni
filtered = filter(contacts, c => contains(c.name, search_text))
```

**`upper` and `lower` convert a string's case:**

```igni
label upper(level)           # "CRITICAL"
label lower(title)           # "welcome"
```

`upper(string)` returns the string with every letter uppercased. `lower(string)` returns the string with every letter lowercased. Both return a new string and leave the original unchanged. Use them at the render site so the data model can keep natural keys:

```igni
alerts = [
  {level: "critical", message: "Database connection lost"},
  {level: "warning", message: "High memory usage"},
]

each alert in alerts:
  label upper(alert.level), color: severity_color(alert.level)
```

Store strings in their natural form — lowercase keys match how you branch (`if level is "critical"`), filter, and compare. Convert to display form at the UI boundary. There are no other case helpers: `capitalize` and `title_case` are not in the language. If you need title case, store strings in title case.

**`random` generates a random integer in a range:**

```igni
result = random(1, 6)
```

`random(min, max)` returns a random integer between `min` and `max` inclusive. Use it for dice, shuffles, or anywhere you need unpredictability.

**`round` formats a number to a fixed number of decimal places:**

```igni
label round(bmi, 1)                 # "21.5"
label "$" + round(price, 2)         # "$12.34"
label round(count, 0)               # "5"
```

`round(value, places)` returns a string representation of the number rounded to `places` decimal places, using standard rounding. It works on both integers and floats. Use it anywhere you want to display a computed number with controlled precision — BMI, prices, measurements, averages. The result is a string, so you can concatenate it with other strings using `+`. Without `round()`, arithmetic produces raw floats that render as `21.456734812...`; `round(value, 1)` gives you `"21.5"`.

**`play` plays an audio file:**

```igni
play("note1.wav")
```

`play(filename)` plays an audio file from the project's `audio/` folder. See *Local Images and Audio* for the folder convention.

**`print` logs to the browser console:**

```igni
print(count)
print("Current value: " + count)
```

`print(value)` outputs to the browser's developer console (open with F12). Use it to inspect variables, trace function calls, or debug state. It does not render anything on screen.

---

## Comments

`#` starts a comment that runs to the end of the line. Comments can stand on their own line or follow code on the same line:

```igni
count = 0                                  # number of clicks
button "Add", on tap: count = count + 1    # increments on tap
```

Multi-line comments are written as multiple `#` lines. Igni has no `/* */` or other block-comment syntax — pick `#` and stay consistent:

```igni
# The Counter screen is the simplest example.
# It demonstrates lexical reactivity: changing
# `count` re-renders the label automatically.
screen Counter:
  count = 0
  ...
```

---

## Appendix A: Property Applicability

Not all properties work on all primitives. This table shows what applies where:

| Property | Applies to | Notes |
| --- | --- | --- |
| `style:` | `label` | `heading`, `heading.small`, `body`, `caption` |
| `color:` | `label`, `icon`, `button`, `badge` | Any colour name or variable holding a colour value |
| `size:` | `image`, `icon` | Numeric pixels |
| `round:` | `image` | Boolean, circular crop |
| `bind:` | `input`, `toggle`, `checkbox`, `slider`, `dropdown` | Two-way data binding |
| `placeholder:` | `input` | Hint text |
| `label:` | `toggle`, `checkbox` | Adjacent text label |
| `min:`, `max:` | `slider` | Range bounds |
| `options:` | `dropdown` | List of choices |
| `on tap:` | All primitives, layouts, components | Fires on release |
| `on touch:` | All primitives, layouts, components | Fires on contact |
| `fill: true` | `layout` only | Not on primitives |
| `background:` | `layout`, `screen` | Colour name, `card`, image filename, or variable holding any of these |
| `rounded:` | `layout` | Design token (`small`/`medium`/`large`) |
| `gap:`, `padding:` | `layout` | Design token |
| `align:` | `layout`, `label` | `start`, `center`, `end` |
| `spread: true` | `layout` | Space between children |

---

## Appendix B: Rules summary

- Indentation-based scoping (no braces, no brackets for blocks)
- Colons end any line that opens a block
- One way to do everything — no aliases, no shortcuts, no alternatives
- Types are inferred, with optional hints where ambiguous
- Max nesting depth: 4 levels per component. **Only `layout`, `screen`, and `component` blocks count toward the limit — conditionals and loops are free.** Custom components reset the counter — the limit caps reading load at any one site, not total AST depth. Factoring deep nesting into a named component is the sanctioned way to add more.
- Everything a component needs lives in one file
- Zero magic — if something happens, you can see it in the code
- **The spec is a budget, not a backlog.** Every new keyword or block type is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity — in an AI-assisted coding world, models write the boilerplate, so what matters is that the rules are simple enough to learn from the spec.
- Reactivity: each screen re-evaluates from the top when any variable it references is reassigned
- List elements cannot be mutated in place. Updates flow through reassignment.
- UI primitives only render in screen or component bodies, never inside functions.
- Arguments to screens and components are immutable.
- Cross-screen function calls are NOT allowed. Use `shared:` for cross-screen state.
- Object identity is reference-based, not structural. Use lambdas for field-based matching.
- `{BASE with KEY: VALUE, ...}` builds a new object with all of BASE's fields plus the overrides. BASE must be a variable or dot-access chain (no function calls, no indexing). Shallow only; `with` is a reserved keyword.
- `emit` is only valid inside an event handler (`on tap:`, `on touch:`, `on change:`). Standalone use is a parse error. Reserved event names: `tap`, `change`, `touch`.
- `locate()` returns an async value with `.latitude` and `.longitude` (decimal-degree floats). One-shot read; first call triggers the platform permission prompt; denial collapses into `is error`. The reactive-fetch footgun (rejecting `fetch("..." + bound_var)`) extends to `.latitude` / `.longitude` access on a `locate()` result.

## Appendix C: Planned theme fields

The `theme:` block (§Theme block) is a live feature in v0.12.1 but only its font-override path is wired into the transpiler. The full design intent below is the shape future versions will fill in. Implementing these fields is additive and will not change the font syntax shown in §Theme block.

```igni
theme:
  text:
    heading: font: pacifico, size: 24, weight: bold
    body: font: source_sans, size: 16
    caption: font: source_sans, size: 12, color: subtle
  spacing:
    small: 8
    medium: 16
    large: 24
  color:
    brand: "#6C5CE7"
    subtle: "#999"
    danger: "#E74C3C"
```

**Not live in v0.12.1:** `spacing:` / `color:` sub-blocks; `size:` / `weight:` / `color:` fields inside `text:` bundles. The transpiler rejects these paths with a clear error. Use the hardcoded defaults for now.

---

## docs/tutorial.md (v2.5)

# Learn Igni

> Tutorial v2.5 · targets Igni v0.12.2

Build your first app, one small step at a time. No programming experience needed.

Every part: save the file (**Cmd+S** on Mac, **Ctrl+S** on Windows) and see the result in the browser.

**If something goes wrong:** check your spelling and indentation, then save again. If the browser doesn't change and the terminal shows red text, you've usually misspelled a name (for example `nam` instead of `name`). Fix it and save again.

---

## Before you start

> **Already set up?** If `igni run` is running and you have an empty `app.igni` open, skip to [Section 1](#section-1--hello-world).

You'll need:

1. **A text editor** — [Cursor](https://cursor.com) is free and works well.
2. **A terminal** — on Mac press **Cmd+Space**, type `Terminal`, press Enter. On Windows press the **Windows key**, type `Terminal`, press Enter.
3. **Chrome** — already on most computers.

In the terminal, type this and press Enter:

```bash
igni new learn-igni
cd learn-igni
igni run
```

A browser window opens showing a counter. Tap **Add** — the number goes up. Leave the terminal open; every save updates the browser. **Ctrl+C** stops the server when you're done.

**Prefer Safari, Firefox, or Arc?** Use `igni run localhost` — it prints a URL you can paste into any browser.

### Open the file

In Cursor: **File → Open Folder**, pick `learn-igni`. Click `app.igni` on the left. **Select everything and delete it** so the file is empty. You're ready.

---

## Section 1 — Hello World

### Part 1 — Show text on screen

Type this and save:

```igni
screen Hello:
  label "Hello World"
```

You see **Hello World** in the browser.

- `screen Hello:` creates a page called "Hello." The colon `:` means "here's what goes on this page."
- `label "Hello World"` shows text on the screen. The text inside the double quotes is what you see.

---

### Part 2 — Make it a heading

```igni
screen Hello:
  label "Welcome to my app!", style: heading
```

Save. The text is noticeably bigger. `style: heading` is what makes it big. Change the words in the quotes to anything you want — your name, a joke — and save again.

---

### Part 3 — Add a second line

```igni
screen Hello:
  label "Welcome to my app!", style: heading
  label "Made in Igni"
```

Both lines appear, one below the other. The first is big (because of `style: heading`), the second is normal size. Things stack top to bottom — add more lines whenever you want.

---

## Section 2 — About you

### Part 1 — Put something in a box

Make a box, put something in it, show what's inside:

```igni
screen Hello:
  name = "Sam"
  label name
```

Save. You see **Sam**.

- `name = "Sam"` makes a box called `name` and puts "Sam" inside.
- `label name` (no quotes) tells Igni to look **inside** the box and show what's there. That's why you see **Sam**, not the word "name".

A box with a name is called a **variable**.

Without the quotes, Igni looks inside the box. With quotes, it shows the letters literally:

```igni
label "name"
label name
```

`label "name"` shows the word **name**. `label name` shows **Sam**.

---

### Part 2 — Join things together

```igni
screen Hello:
  name = "Andy"
  age = 30

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save. You see **Hi, I'm Andy** and **I am 30 years old**.

- `+` joins pieces of text together.
- `age = 30` — no quotes around `30` because it's a number, not text.
- **Variables go at the top of the screen**, above the labels that use them.

---

### Part 3 — Make it yours

Clear out the placeholder values:

```igni
screen Hello:
  name = ""
  age = 0

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save — you'll see "Hi, I'm " and "I am 0 years old". That's the app without you in it.

Now put your name between the two quotes and change `0` to your age. Save. The screen greets you.

---

## Section 3 — Making decisions

Apps often show different things in different situations. That's what `if` and `else` are for.

### Part 1 — if and else

Start with `if` alone:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
```

You see **Welcome back, Robin!** Now change `name = "Robin"` to `name = "Taylor"` and save. **The label disappears entirely.** That's `if` on its own: show something when the check is true, show nothing when it's false.

Now add `else`:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
  else:
    label "Nice to meet you " + name
```

Flip `name` between "Robin" and "Taylor" and watch the message change.

- `if name is "Robin":` asks: "does `name` contain Robin?" The colon means "here's what to do if yes."
- `else:` means "otherwise."
- `is` asks if two things are the same. Careful: `=` puts something in a box; `is` asks if two things match.
- The lines below `if` and `else` are **indented** — that's how Igni knows they belong to the branch.

---

### Part 2 — Bigger, smaller, equal

Sometimes you want to compare sizes, not just exact matches. Igni uses the same symbols as maths:

- `age > 18` — "is age bigger than 18?"
- `age < 18` — "is age smaller than 18?"
- `age >= 18` — "is age 18 or bigger?"
- `age <= 18` — "is age 18 or smaller?"

Let's use `>=` to decide if someone is an adult:

```igni
screen Hello:
  age = 42

  # >= means "18 or bigger"
  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Change `age = 42` to `age = 10`. Save. It switches to **You are a child**.

A line starting with `#` is a **note** for you. Igni ignores it.

---

## Section 4 — Counter

### Part 1 — A counter with a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Save, then tap the button. The number goes up!

- `count = 0` — a box that starts at zero.
- `label count` shows whatever number is in the `count` box.
- `button "Add one"` — the text in quotes is what appears on the button.
- `on tap: count = count + 1` — when tapped, take `count`, add 1, put the result back.

Change `+ 1` to `+ 2` and save. Now the counter jumps by two each tap.

---

### Part 2 — A second button, side by side

```igni
screen Counter:
  count = 0

  layout horizontal, gap: small:
    button "Add one", on tap: count = count + 1
    # this button takes the count down
    button "Remove one", on tap: count = count - 1

  label count, style: heading
```

Two buttons in a row, with the number below them.

- `layout horizontal:` puts things side by side instead of stacking them. Everything indented under it goes in the row.
- `gap: small` adds space between the buttons.

**Try this:** add a third button labelled "+10" that adds ten to the count. Keep it in the same row.

---

### Part 3 — Make it look nice with layout vertical

`layout horizontal:` puts things in a row. `layout vertical:` stacks them top-to-bottom — with modifiers to control spacing and alignment:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large, align: center:
    label count, style: heading
    layout horizontal, gap: small:
      button "Add one", on tap: count = count + 1
      button "Remove one", on tap: count = count - 1
```

Save. Same counter, centred on the page with breathing room.

- `gap: medium` — space between the label and the row.
- `padding: large` — space around the whole thing.
- `align: center` — centres everything horizontally.

---

## Section 5 — Greeter

### Part 1 — Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
```

Type your name into the text box. You see your letters appear as you type, but nothing else happens yet.

- `name = ""` — a box that starts empty.
- `input bind: name` — a text box connected to the `name` box. Whatever you type goes in.
- `placeholder: "..."` — the grey hint text shown before you type.

---

### Part 2 — Greet them back

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name. The greeting updates letter by letter as you type.

---

### Part 3 — Checkpoint

Put Section 3 and this section together. A text box that greets you, or asks for your name if you haven't typed one:

```igni
screen Greeter:
  name = ""

  layout vertical, gap: large:
    input bind: name, placeholder: "What is your name?"

    if name is empty:
      label "Type your name above"
    else:
      label "Hello, " + name
```

When you open the page, you see "Type your name above." Start typing — the hint is replaced with "Hello, [your name]."

`is empty` is a shortcut for "has no content yet" — handy for boxes that start as `""`.

---

## Section 6 — ScoreBoard

A **function** is a named list of steps. Reach for one when a button does several things and you want to name that combination.

### Part 1 — Set up the screen

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
```

Save. You see a big **0** and nothing beneath it (because `message` is empty). No buttons yet; we'll add them next.

---

### Part 2 — Win button

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()

  win():
    score = score + 1
    message = "Nice one!"
```

Tap **Win** — the score goes up and "Nice one!" appears. One tap, two things happen.

- `win():` creates a function called "win." The parentheses and colon always come together. Functions go at the bottom of the screen.
- `on tap: win()` — when tapped, run every step inside `win`.
- `layout horizontal, gap: small:` — we set up the row now so we can add a second button without rearranging.

---

### Part 3 — Lose button

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()
    button "Lose", on tap: lose()

  win():
    score = score + 1
    message = "Nice one!"

  lose():
    score = score - 1
    message = "Try again!"
```

Second button in the row, second function at the bottom. Tap **Lose**: score goes down, message changes.

---

### Part 4 — Reset button

Rather than editing `score = 0` by hand every round, add a Reset button:

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()
    button "Lose", on tap: lose()
  button "Reset", on tap: reset()

  win():
    score = score + 1
    message = "Nice one!"

  lose():
    score = score - 1
    message = "Try again!"

  reset():
    score = 0
    message = ""
```

Tap Win a few times, Lose once, then Reset. Everything goes back to zero. Reset sits on its own line — it doesn't belong in the Win/Lose row because it's a different kind of button.

---

## Section 7 — Weather

You've used text and numbers. There's a third kind of value: **yes-or-no**, written `true` and `false`.

### Part 1 — if/else with true/false

```igni
screen Weather:
  raining = true

  if raining:
    label "Bring an umbrella"
  else:
    label "Enjoy the sun"
```

Save — you see **Bring an umbrella**. Flip `raining = false` and save — now **Enjoy the sun**.

- `raining = true` — a box holding `true`. No quotes; it's not text.
- `if raining:` reads as "if raining is true." The box itself is the answer — no comparison needed.

---

### Part 2 — else if for a second check

What if it's snowing instead of raining? Use `else if`:

```igni
screen Weather:
  raining = false
  snowing = true

  if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — **Snow day**. The `if raining:` check was false, so Igni tried `else if snowing:`, which was true.

`else if` lets you check another thing if the first was false. You can chain as many as you need.

---

### Part 3 — and for combining

Sleet is raining AND snowing at the same time. Use `and`:

```igni
screen Weather:
  raining = true
  snowing = true

  if raining and snowing:
    label "Sleet! Bundle up."
  else if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — **Sleet! Bundle up.** Both are true, so the first check wins.

`raining and snowing` is only true when both are true.

---

## Section 8 — Dice Roller

Let's build something real.

### Part 1 — Set up the state

```igni
screen DiceRoller:
  result = 0
  rolled = false
```

Save. Blank screen — no UI yet. `result` is the box for the dice number. `rolled` tracks whether the player has tapped Roll yet.

---

### Part 2 — Show the heading

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading
```

Now you see the title, centred with spacing.

---

### Part 3 — Show the result or prompt

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading

    if rolled:
      label "You rolled:"
      label result, style: heading
    else:
      label "Tap Roll to start!"
```

Save — you see **Tap Roll to start!** because `rolled = false`. Flip `rolled = true` by hand and save — you see **You rolled:** and **0**.

---

### Part 4 — Roll button + function

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading

    if rolled:
      label "You rolled:"
      label result, style: heading
    else:
      label "Tap Roll to start!"

    button "Roll", on tap: roll()

  roll():
    result = random(1, 6)
    rolled = true
```

Tap **Roll** — a number between 1 and 6 appears. Tap again for a new number.

- `random(1, 6)` — picks a random number between 1 and 6.
- `rolled = true` — flip the box so the screen shows the number instead of the prompt.

A working dice roller in 15 lines. You built an app.

**Try this:** change `random(1, 6)` to `random(1, 20)` for a D20, or `random(1, 100)` for a guessing game.

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `label name` | Shows what's in the `name` box |
| `name = "Robin"` | Creates a box with text inside |
| `count = 0` | Creates a box with a number inside |
| `rolled = false` | Creates a box with true or false inside |
| `"text" + name` | Joins things together |
| `age >= 18`, `name is "Robin"` | Asks a question |
| `if / else if / else:` | Branches |
| `a and b` | Both must be true |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Stacks things with spacing |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

## What to build next

Some ideas:

- **A tip calculator.** Input for the bill, a slider for the tip percentage, a label for the total. Uses comparisons, inputs, and arithmetic.
- **A shopping list.** Input for new items, a button to add them, a label counting the total. Next step: **lists** in the cheatsheet.
- **A quiz game.** A question, four buttons for answers, a score that goes up when the right one is tapped.
- **Rock Paper Scissors.** You've got almost everything — except function parameters (one new concept). Starter:

  ```igni
  screen RPS:
    result = ""

    layout vertical, gap: medium, padding: large, align: center:
      label result, style: heading
      layout horizontal, gap: small:
        button "Rock", on tap: play("Rock")
        button "Paper", on tap: play("Paper")
        button "Scissors", on tap: play("Scissors")

    play(choice):
      result = "You picked " + choice
  ```

  Save and tap a button. Extend `play(choice)`: pick a computer choice with `random(1, 3)`, compare to `choice`, and set `result` to who won. The cheatsheet has how to pass arguments.

When you're ready for more, the **cheatsheet** has every Igni feature in one place.
