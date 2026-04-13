# Igni

A UI programming language that transpiles to Dart/Flutter. Designed for human readability and LLM accuracy.

*"Flutter, without the bracket hell."*

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons open them. One way to do everything. No imports, no `useState`, no boilerplate. Reactivity is automatic.

## Quick start

```bash
# 1. Create a project
mkdir my-app && cd my-app

# 2. Create app.igni
cat > app.igni << 'EOF'
screen Hello:
  count = 0

  layout vertical, align: center, gap: medium, padding: large:
    label count, style: heading
    button "Add", on tap: count = count + 1
EOF

# 3. Run it
igni run
```

Save `app.igni`, browser updates automatically. That's it.

**Prerequisites:** Node.js 18+, Flutter SDK, Chrome.

## How it works

Igni source (`.igni` files) transpiles to Dart targeting Flutter for web. `igni run` handles the whole chain: transpile, serve, watch for changes, hot reload.

Under the hood, a hidden `.igni/` Flutter project is created automatically. You never touch it — just edit `.igni` files and save.

## Status

**Language spec:** [`spec/v0.6.6.md`](spec/v0.6.6.md) is the current canonical spec. Companion cheatsheet at [`spec/v0.6.6-cheatsheet.md`](spec/v0.6.6-cheatsheet.md) (same content, condensed for LLM consumption). Designed iteratively through cold-LLM testing (pasting the spec into fresh Claude, Gemini, and ChatGPT sessions) and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Transpiler:** Working. Twenty-three example apps compile and run in the browser. Covers screens, components, wrapper components with `body` slot, layouts, conditionals, loops, functions with `return`, lambdas, navigation, shared state, async data fetching, two-way data binding, list operations (`map`/`filter`/`sorted`/`reversed`/`find`/`replace`/`without`/`count`/`length`), `and`/`or` boolean operators, comparison operators, float literals, list indexing, screen properties, local images/audio, and more.

**CLI:** `igni run` — one command to transpile, watch, and serve. Save `.igni` file, browser updates.

## Repo structure

```
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── v0.6.6.md            # current canonical spec
│   ├── v0.6.6-cheatsheet.md # current canonical cheatsheet
│   └── v0.2 → v0.6.5.md    # historical (never edited after shipping)
├── tests/                   # cold-LLM test results
│   ├── v0.3.2/              # Calculator, Todo, Weather
│   ├── v0.4/                # Chat, MusicPlayer, Notes
│   ├── v0.5/                # Notes re-run, Shopping
│   ├── v0.6 → v0.6.3/      # Contacts, Shopping, Dashboard, Todo (transpiler-validated)
│   └── v0.6.4 → v0.6.6/    # prompts for Angela Yu projects + cold tests
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   └── examples/            # 23 .igni apps + .expected.dart references
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
└── docs/                    # tutorial + project docs
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).
