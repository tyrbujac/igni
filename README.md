# Igni

A programming language for building UIs — designed to be read.

The hypothesis: LLM accuracy and human readability track each other. Remove the ambiguity that trips LLMs up and the language becomes nicer for humans too. Igni is that experiment.

Igni transpiles to Dart/Flutter. You write short, readable source files. The toolchain handles the rest.

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons open them. One way to do everything. No imports, no `useState`, no boilerplate. Reactivity is automatic.

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

`igni new` creates a starter `app.igni` and a `.gitignore` for the generated `.igni/` Flutter project. Save `app.igni`, browser updates automatically. That's it.

## How it works

`igni run` transpiles your `.igni` files to Dart, spins up a Flutter web server, and watches for changes. Edit, save, see the result in your browser — the loop is instant.

When Flutter or generated Dart reports an error from `main.dart`, Igni maps it back to the nearest `.igni` source line so the CLI points at code you actually wrote instead of only the generated file.

Under the hood, a hidden `.igni/` Flutter project is created automatically. You never touch it — just edit `.igni` files and save.

## Mobile testing (advanced)

`igni run` targets Chrome with hot reload. To preview an Igni app on an iOS simulator or Android emulator, drop into the generated `.igni/` Flutter project and use Flutter directly.

```bash
igni run              # once, to bootstrap .igni/ (Ctrl-C after the browser opens)
cd .igni
flutter create . --platforms=ios,android   # expand platforms
flutter devices                             # list simulators / emulators
flutter run -d <device-id>                  # run on a specific device
```

Recommended entry point: the iOS simulator (`open -a Simulator`, then `flutter run -d <simulator-id>`) — no USB cable, no Android SDK, fast boot.

Hot reload via `igni run` is Chrome-only for now. Mobile testing is a manual re-run loop: edit `.igni`, re-run `igni run` (to regenerate `main.dart`), then re-run `flutter run` inside `.igni/`.

## Project structure

Igni files are much shorter than their Flutter equivalents — a screen is typically 10-40 lines, not 100-300. Flat file structure works well:

- **Under 200 lines:** fine as a single file
- **Over 200 lines:** consider splitting by screen or feature
- **No folders needed** until 15+ files — auto-discovery means every screen and component is available everywhere with no imports

```
my-app/
  app.igni           # entry point
  settings.igni      # another screen (optional)
  images/            # local images
  audio/             # audio files
```

## Status

**Language spec:** Current canonical spec is [spec/<!-- SYNC:version -->v0.11.2<!-- /SYNC:version -->.md](spec/<!-- SYNC:version -->v0.11.2<!-- /SYNC:version -->.md). Companion cheatsheet at [<!-- SYNC:cheatsheet-path -->spec/v0.11.2-cheatsheet.md<!-- /SYNC:cheatsheet-path -->](<!-- SYNC:cheatsheet-path -->spec/v0.11.2-cheatsheet.md<!-- /SYNC:cheatsheet-path -->); syntax-only micro reference at [<!-- SYNC:micro-path -->spec/v0.11.2-micro.md<!-- /SYNC:micro-path -->](<!-- SYNC:micro-path -->spec/v0.11.2-micro.md<!-- /SYNC:micro-path -->). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest language change:** `v0.10.0` adds object-update syntax. `{target with field: newval}` builds a new object from all of `target`'s fields plus the overrides — the canonical shape for the "update one field on an object in a list" idiom that previously required enumerating every unchanged field. `with` is a reserved keyword; the base must be a variable or dot-access chain (function calls and indexing rejected); shallow only; braces required. Validated post-ship by a 9/9 frontier adoption across three domain swaps (Shopping, Apothecary, Spaceship Cargo) — the cheatsheet's single example is enough to teach the shape. Preceding changes: `v0.9.1` tightened the trigger-variable recommendation (docs-only, 3/3 frontier flipped to canonical `on tap:`); `v0.9.0` promoted the reactive-fetch footgun from prose guidance to a transpile-time error; `v0.8.0` shipped component event channels (`emit` + `on <event>:`).

**Latest methodology result:** the v0.10 domain-swap round (Shopping + Apothecary + Spaceship Cargo, 3 × 4 models × cheatsheet tier) produced 9/9 frontier adoption of `{target with ...}` unprompted. Three runs at varying domain distance from e-commerce rules out the "shopping-cart corpus density" confound — the cheatsheet teaches the syntax, the domain doesn't supply it. First post-ship result strong enough to call directly-supported rather than suggestive.

**Transpiler:** Working. <!-- SYNC:example-count -->39<!-- /SYNC:example-count --> example apps compile and run in the browser. Covers:

- **Composition** — screens, components, wrapper components with `body` slot, layouts
- **Control flow** — `if`/`else`, `each` loops, functions, lambdas
- **State & data** — variables, two-way binding, shared state, async `fetch` with loading/error
- **Data shapes** — list operations (`filter`, `sorted`, `without`, `replace`, ...), list indexing, object-update syntax (`{target with field: newval}`)
- **UI surface** — screen properties (title, background), local images, audio
- **Operators** — arithmetic, comparison, boolean (`and`/`or`/`not`)

**CLI:** `igni new` creates a starter app. `igni run` transpiles, watches, and serves it.

## Repo structure

```
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── <!-- SYNC:version -->v0.11.2<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.11.2<!-- /SYNC:version -->-cheatsheet.md  # current canonical cheatsheet
│   ├── <!-- SYNC:version -->v0.11.2<!-- /SYNC:version -->-micro.md       # current canonical micro reference
│   └── <!-- SYNC:historical-range-files -->v0.2.md → v0.11.1.md<!-- /SYNC:historical-range-files -->      # historical (never edited after shipping)
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   └── examples/            # <!-- SYNC:example-count -->39<!-- /SYNC:example-count --> .igni apps + .expected.dart references
├── tests/                   # cold-LLM test results + methodology
│   └── v0.3.2 → v0.6.11/    # prompts + results per spec version
├── docs/                    # tutorial + project docs
│   └── tutorial-v2.5.md     # beginner tutorial (no programming experience needed)
├── assets/                  # logo (igni.svg + igni-dark-mode.svg, PNGs)
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
└── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).
