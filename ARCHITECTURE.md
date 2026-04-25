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
│   ├── <!-- SYNC:version -->v0.13.1<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.13.1<!-- /SYNC:version -->-cheatsheet.md  # current cheatsheet (learning order)
│   ├── <!-- SYNC:version -->v0.13.1<!-- /SYNC:version -->-micro.md       # current micro reference (~700 words)
│   └── archive/               # historical snapshots <!-- SYNC:historical-range-files -->v0.2.md → v0.13.0.md<!-- /SYNC:historical-range-files -->
├── tests/                     # cold-LLM test infrastructure
│   ├── README.md              # test methodology
│   └── v<spec_version>/       # prompts + results per spec round
├── editors/
│   └── vscode/                # VS Code / Cursor TextMate grammar
├── transpiler/                # TypeScript-to-Dart transpiler
│   ├── README.md
│   ├── src/                   # lexer, parser, codegen, CLI
│   ├── bin/igni               # CLI entry point (bash shim to src/igni.ts)
│   ├── examples/              # <!-- SYNC:example-count -->46<!-- /SYNC:example-count --> .igni apps + .expected.dart refs
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

- **[`spec/v0.12.2.md`](spec/v0.12.2.md)** — **current full spec** in learning order (hello world → screens → display → variables → interaction → layout → state → conditionals → lists → functions → components → navigation → shared state → async → reference).
- **[`spec/v0.12.2-cheatsheet.md`](spec/v0.12.2-cheatsheet.md)** — condensed (~2,500 words). Same language, optimised for cold-LLM context and human skim. Primary input for cold-test rounds.
- **[`spec/v0.12.2-micro.md`](spec/v0.12.2-micro.md)** — rules-only (~700 words). Third context tier for tests that vary context size as an independent variable.

Historical versions (v0.2 → v0.12.1) live under [`spec/archive/`](spec/archive/). Each is an immutable snapshot — never edited after ship — because cold-LLM tests stay reproducible against a frozen baseline. See [`CHANGELOG.md`](CHANGELOG.md) for the per-version evolution narrative.

**When proposing spec changes,** fork `spec/v0.12.2.md` (+ cheatsheet + micro) to a new version file rather than editing in place. Historical versions (v0.2 → v0.12.1) live under `spec/archive/`. Full snapshot rule in `CLAUDE.md` for AI-assisted edits.

## Transpiler

TypeScript project at [`transpiler/`](transpiler/) that compiles `.igni` source to Dart/Flutter. Hand-written recursive-descent parser, chokidar for file watching. Hidden `.igni/` Flutter project created on demand.

**Pipeline:** `.igni` → Lexer (INDENT/DEDENT) → Parser → AST → CodeGen → `.dart` → Flutter.

**CLI:** `igni run` one command to transpile, watch, and serve. Mobile targets via `igni run ios` / `igni run android` (v0.11.5+); macOS desktop target via `igni run macos`; non-Chrome browsers (Safari / Firefox / Arc) via `igni run localhost`, which runs Flutter in `-d web-server` mode and prints a `http://localhost:PORT` URL instead of launching a browser. Both web variants pass `--no-web-resources-cdn` so CanvasKit + Flutter's default Roboto are served from the local SDK, and theme font tokens resolve to bundled TTFs (no `google_fonts` runtime fetch) — the web dev loop works fully offline. `igni run localhost` additionally starts a Node SSE sidecar on a random port and injects a reload script into the scaffolded `web/index.html`, so saves auto-refresh the browser tab in any browser — matching Chrome's DX despite Flutter's `-d web-server` not pushing reload signals itself (issue #44974). Standalone release artifacts via `igni build <macos|apk|web>` — output lands in `dist/` ready to share (no code-signing pipeline yet; unsigned macOS apps need right-click → Open on first launch). App identity auto-applies: display name is the folder name title-cased (`dicee` → `Dicee`, `dice-roller` → `Dice Roller`; override with `--name`), and a user-placed `app-icon.png` at the project root is resized into every platform's icon set (falling back to the Igni default when absent). `igni new my-app` scaffolds a starter. Default entry point is `app.igni`. See [`transpiler/README.md`](transpiler/README.md) for the source-layout tour and the full CLI reference.

**Currently supported:** `screen` (StatefulWidget), screen properties (`title:` → AppBar, `background:` → Scaffold colour), `component` (StatelessWidget), wrapper components with `body` slot, variables (int/double/String/bool/List) with optional type hints, assignable styling tokens (`brand`, `subtle`, `danger`, colour palette, background-only `card`), `layout` (vertical/horizontal, align, gap, padding, background, rounded, spread, `fill: true` for Expanded), implicit vertical layout for screen bodies, `label` (with `align:` for text alignment), `button` + `on tap`, `input bind:` + `placeholder:`, `toggle bind:`, `image` (size, round, `on tap:`, local assets + network URLs), `icon` (size, color, `on tap:`), `slider` (bind, min, max), `checkbox` (bind, label), `dropdown` (bind, options), `badge` (color), `spinner`, `if`/`else`/`else if`, `not`, `is`/`is not` equality, `is empty`/`is null`/`is in`/`is loading`/`is error` and their negations, comparison operators (`>`/`<`/`>=`/`<=`), `and`/`or`, `each` loops (with optional `paginate: N` lazy rendering), `navigate to`/`navigate back` (multi-screen with params), `shared:` state via ChangeNotifier, `fetch` + `spinner`, list builtins (`without`/`replace`/`find`/`count`/`length`/`filter`/`sorted`/`reversed`), string builtins (`contains`/`upper`/`lower`), `emit <event> [<arg>]` with `on <event>:` wiring, `random(min, max)`, lambda expressions, `return` in functions, screen-internal functions with params, list literals, object literals, field access, list indexing (null on out-of-bounds), arithmetic, float literals, string concatenation with `+`, `play("file.wav")` audio, `print()` for console debugging, `on touch:` event (fires on contact; `on tap:` fires on release), `locate()` geolocation builtin via `geolocator` plugin. Visual defaults: 16px screen-body padding (unless explicit `layout`), 16px `bodyMedium`, `#FAFAFA` scaffold, outlined input border, intrinsic button width, 480px input max-width outside Row context, `SafeArea` wrap when no `title:` (prevents notch clipping on iOS). Error-message pipeline filters Dart-SDK / Flutter framework stack frames and maps runtime stack frames back to `.igni` lines.

**<!-- SYNC:example-count -->46<!-- /SYNC:example-count --> example apps** in [`transpiler/examples/`](transpiler/examples/) — each a `.igni` source + `.expected.dart` reference. Covers counter, settings, toggle, functions, greeting, todo, notes (multi-screen), todo-full, components, shared (cross-screen state), fetch (async API), fetch-mutation, fetch-reactive, dice, dicee (Angela Yu course project with AppBar + local images), mi-card (Angela Yu identity-card, pure static-layout regime), dashboard, fn-return, lambda, primitives, shopping (full e-commerce), wrapper (body slot), logic, type-hints, contacts (list indexing, comparisons), on-change, bg-image, tutorial (smoke test), string-case, derived-counts, stepper (emit/on events), pagination. See [`transpiler/examples/README.md`](transpiler/examples/README.md) for one-liner descriptions.

**Testing:** `npm test` in `transpiler/` runs <!-- SYNC:total-tests -->64<!-- /SYNC:total-tests --> diff tests (positive + negative rejection cases). Zero diff = pass. Browser smoke-test via `igni run` from any directory containing `.igni` files.

**Not yet supported (v0.12.2 spec features):** `theme:` block sub-paths beyond font overrides — `spacing:` / `color:` sub-blocks, plus `size:` / `weight:` / `color:` fields inside `text:` bundles (planned; see Appendix C). (`theme: text: <role>: font:` shipped in v0.12.1. `paginate:` on `each` shipped 2026-04-22 as syntax + lazy `ListView.builder` codegen; auto-load-more on scroll deferred pending async integration.)

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
- **Not for creative tools.** Photoshop / Ableton / video-editor class apps need primitives Igni explicitly rejects: imperative drawing surfaces (`canvas`), frame-loops (`on frame:`), raw layout dimensions (numeric `width:` / `height:`), granular per-subtree reactivity, pointer-event coordinates with drag lifecycle. The token-first / one-way / no-magic principles that make Igni learnable in one sitting structurally exclude these capabilities. Three independent LLM panels converged on the same five-primitive gap (`docs/private/92`). Igni's audience is CRUD / forms / list-detail / fetch-driven utility apps; creative tools belong in Flutter / React / SwiftUI directly.
- **Not aiming at a single canonical "real app."** v1.0 criterion 4 is "three small real apps shipped" — quantity over flagship-app weight. Earlier framing pointed at a Boojy subset; that's been retired (Boojy is creative-tools-class, see above).
