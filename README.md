# Igni

A programming language for building UIs — designed to be read.

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
mkdir my-app && cd my-app
```

Create a file called `app.igni`:

```igni
screen Hello:
  count = 0

  layout vertical, align: center, gap: medium, padding: large:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Run it:

```bash
igni run
```

Save `app.igni`, browser updates automatically. That's it.

## How it works

`igni run` transpiles your `.igni` files to Dart, spins up a Flutter web server, and watches for changes. Edit, save, see the result in your browser — the loop is instant.

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

**Language spec:** [`spec/v0.8.0.md`](spec/v0.8.0.md) is the current canonical spec. Companion cheatsheet at [`spec/v0.8.0-cheatsheet.md`](spec/v0.8.0-cheatsheet.md). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest language change:** `v0.8.0` adds component event channels: `emit <event>` inside a component fires a custom event (only valid as the action of an `on tap:` / `on touch:` / `on change:` handler), and the parent attaches handlers via `on <event>:` named arguments at the call site — the same vocabulary as `on tap:` on primitives. Motivation: the v0.7.0 BMI cold test produced a 5/8 compounded signal (2/4 models invented `on_tap_handler` / `on decrease:`, 3/4 ship reviewers flagged the same gap). Reusable input controls like the BMI +/- stepper now express what they do without string-key dispatch workarounds. Preceding changes: `v0.7.1` added `upper(s)` / `lower(s)` string case builtins (8/8 Alert Dashboard signal); `v0.7.0` made styling tokens assignable values.

**Latest methodology result:** the v0.6.11 BMI cold test shows that each v0.6.9-v0.6.11 patch produced measurable output change, including a documentation-only patch (`fill: true` bottom-anchoring) that moved model behaviour from `0/4` to roughly `3.5/4`. That's strong evidence for the spec-budget principle: many gaps can be closed by better documentation rather than new syntax.

**Transpiler:** Working. 30 example apps compile and run in the browser. Covers screens, components, wrapper components, layouts, conditionals, loops, functions, lambdas, navigation, shared state, async data fetching, two-way binding, list operations, boolean and comparison operators, list indexing, screen properties, local images/audio, and more.

**CLI:** `igni run` — one command to transpile, watch, and serve.

## Repo structure

```
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── v0.8.0.md             # current canonical spec
│   ├── v0.8.0-cheatsheet.md  # current canonical cheatsheet
│   └── v0.2 → v0.7.1.md      # historical (never edited after shipping)
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   └── examples/            # 27 .igni apps + .expected.dart references
├── tests/                   # cold-LLM test results + methodology
│   └── v0.3.2 → v0.6.11/    # prompts + results per spec version
├── docs/                    # tutorial + project docs
│   └── tutorial.md          # beginner tutorial (no programming experience needed)
├── assets/                  # logo and branding
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
└── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).
