# Igni transpiler

TypeScript project that compiles `.igni` source to Dart/Flutter. Hand-written recursive-descent parser, chokidar for file watching, a hidden `.igni/` Flutter project as the build target.

## Pipeline

```
.igni source
   │
   ▼
Lexer  ──── emits tokens with INDENT / DEDENT markers
   │
   ▼
Parser ──── recursive descent; recovers from errors with progress-invariant loops
   │
   ▼
AST    ──── Program → Screen | ComponentDef | SharedBlock | VariableDecl | UINode …
   │
   ▼
CodeGen ─── emits Dart source; enforces transpile-time rules
   │
   ▼
.dart file in .igni/lib/main.dart
   │
   ▼
flutter run (web | ios | android)
```

## CLI

```bash
igni run                                 # web (Chrome), default app.igni
igni run hello.igni                      # web, specific file
igni run ios                             # iOS simulator (auto-pick / auto-boot)
igni run android                         # Android emulator
igni run ios --device "iPhone 17"        # target a specific iOS device
igni run android --device "Pixel 8a"
igni new my-app                          # scaffold a new starter project
```

`igni run` watches `.igni` files in the current directory, regenerates `.igni/lib/main.dart` on save, hot-restarts Flutter, and maps runtime errors back to `.igni` source lines. See [`../docs/mobile.md`](../docs/mobile.md) for mobile device-selection details and known gotchas.

The CLI wrapper is the bash shim at `bin/igni` — it `exec`s `npx tsx src/igni.ts "$@"` so you get the live TypeScript. Symlink `bin/igni` onto your PATH for one-command invocation from any directory.

## Source layout (`src/`)

- **`lexer.ts`** — tokeniser. INDENT/DEDENT-aware. Emits a flat token stream.
- **`parser.ts`** — recursive descent. Builds the AST. Contains progress-invariant assertions that convert infinite-loop regressions into loud errors.
- **`ast.ts`** — AST type definitions (`Program`, `Screen`, `UINode`, `Expr`, `Statement`, etc.).
- **`tokens.ts`** — `TokenType` enum + `Token` shape shared between lexer and parser.
- **`codegen.ts`** — generates Dart. Contains four pre-codegen validation passes (see "Transpile-time rejections" below) plus the main screen / component / expression emitters.
- **`codegen-helpers.ts`** — shared utilities used by codegen and validators (`findProp`, `resolveColor`, `inferType`, `substituteLambdaParam`, etc.).
- **`errors.ts`** — `TranspileError` class + `formatError` / `formatMappedError` — renders errors with caret-under-source alignment.
- **`cli.ts`** — one-shot transpile entry point used by the diff-test runner. Reads `.igni` file(s), prints Dart to stdout. No watch, no Flutter spawn.
- **`igni.ts`** — the interactive CLI entry point. Argument parsing, file watching, `.igni/` project setup, device selection, `flutter run` spawn, hot-reload stdout filter, error mapping.

## Running tests

```bash
cd transpiler
npm test
```

Runs `run-tests.sh` which executes every diff test: 54 total (40 positive + 14 negative-rejection). Zero diff = pass.

- **Positive tests** — `examples/*.igni` transpiled to stdout, compared against `examples/*.expected.dart`. See [`examples/README.md`](examples/README.md) for a one-liner index.
- **Negative tests** — `examples-errors/*.igni` run through the CLI; must exit non-zero with stderr byte-matching `examples-errors/*.expected.err`. These pin the transpile-time rejection messages.

## Transpile-time rejections (rules, not warnings)

The transpiler rejects anti-patterns at compile time, each with a fix-it error message pointing at the canonical shape. All have pinned negative-test fixtures.

| Rule | Shipped | Fixture |
|---|---|---|
| **Reactive-fetch footgun** — `fetch("..." + bound_input_var)` is rejected. Use a trigger variable. | v0.9.0 | `examples-errors/async-footgun.{igni,expected.err}` |
| **`locate()` reactive-fetch extension** — same rule applies to `.latitude` / `.longitude` concatenated into a fetch URL. | v0.11.0 | `examples-errors/locate-footgun.{igni,expected.err}` |
| **`emit <event>` placement** — only valid as the action of `on tap:` / `on touch:` / `on change:`. Standalone `emit` is a parse error. | v0.8.0 | `examples-errors/standalone-emit.{igni,expected.err}` |
| **Bare access to `shared:` variables** — `hold = hold + [...]` rejected; use `shared.hold` ("visible coupling marker" rule). | v0.10 | `examples-errors/bare-shared.{igni,expected.err}` |
| **`count(list, lambda)`** — the lambda form is rejected; use `length(filter(list, predicate))` for field-based counting. | v0.11.4 | `examples-errors/count-lambda.{igni,expected.err}` |

Implementation pattern: a pre-codegen `validateX(program)` method in `codegen.ts` that walks the AST and throws `TranspileError`. See `validateSharedPrefix` / `validateCountLambda` as reference shapes. Additional rejections for structural issues (unclosed strings, bad indent, `object-update` with non-identifier base, etc.) also live in `examples-errors/`.

## Visual defaults

Codegen applies sensible zero-config defaults so bare screens look reasonable:

- 16px screen-body padding (unless root is an explicit `layout`).
- 16px `bodyMedium` default text size.
- `#FAFAFA` scaffold background (neutral; brand pink stays on buttons).
- Outlined input border, visible without `placeholder:`.
- Intrinsic button width (doesn't stretch to full-width).
- 480px input max-width outside Row context.
- `SafeArea` wrap for screens without a `title:` (prevents iOS notch clipping).

Full list in the spec's *Visual defaults* subsection under *Colours and Styling*.

## Adding a new example

1. Write `examples/foo.igni`.
2. `npx tsx src/cli.ts examples/foo.igni > examples/foo.expected.dart` to generate the reference output.
3. `npm test` — `foo` should appear in the pass list.
4. Add a one-line description to `examples/README.md`.
5. Run `npx tsx ../scripts/sync-docs.ts` from repo root to update the `SYNC:example-count` marker.

## Adding a new transpile-time rejection

1. Write the `.igni` fixture at `examples-errors/foo.igni` — code that should be rejected.
2. Add a `validateFoo(program)` method in `codegen.ts`, modelled on `validateSharedPrefix` or `validateCountLambda`. Throw `TranspileError(message, loc?.line, loc?.column)` with a fix-it message.
3. Wire it into `build()` alongside the existing `validateEmitPlacement` / `validateAsyncReactivity` / `validateSharedPrefix` / `validateCountLambda` calls.
4. Capture the exact stderr: `cd examples-errors && npx tsx ../src/cli.ts foo.igni 2>&1 >/dev/null > foo.expected.err`.
5. `npm test` — `err/foo` should pass.
6. Run sync-docs to bump `SYNC:total-tests`.

## Mobile toolchain notes

`flutter doctor` must be green for the target platform. First `igni run ios` invokes `flutter create . --platforms=ios` to add iOS to the existing `.igni/` project; same for `--platforms=android`. `geolocator: ^13.0.1` is auto-injected into `pubspec.yaml` when source contains `locate()`. Known iOS gap: `NSLocationWhenInUseUsageDescription` is not currently injected into `Info.plist`, so `locate()` routes to `is error` on iOS until that's added manually. Tracked in ROADMAP Ideas.
