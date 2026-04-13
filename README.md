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

## Status

**Language spec:** [`spec/v0.6.6.md`](spec/v0.6.6.md) is the current canonical spec. Companion cheatsheet at [`spec/v0.6.6-cheatsheet.md`](spec/v0.6.6-cheatsheet.md). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Transpiler:** Working. 27 example apps compile and run in the browser. Covers screens, components, wrapper components, layouts, conditionals, loops, functions, lambdas, navigation, shared state, async data fetching, two-way binding, list operations, boolean and comparison operators, list indexing, screen properties, local images/audio, and more.

**CLI:** `igni run` — one command to transpile, watch, and serve.

## Repo structure

```
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── v0.6.6.md            # current canonical spec
│   ├── v0.6.6-cheatsheet.md # current canonical cheatsheet
│   └── v0.2 → v0.6.5.md    # historical (never edited after shipping)
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   └── examples/            # 27 .igni apps + .expected.dart references
├── tests/                   # cold-LLM test results
│   └── v0.3.2 → v0.6.6/    # prompts + results per spec version
├── docs/                    # tutorial + project docs
│   └── tutorial.md          # beginner tutorial (no programming experience needed)
├── assets/                  # logo and branding
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
└── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).
