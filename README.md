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

## How it works

Igni source (`.igni` files) transpiles to Dart targeting Flutter for web. You write Igni, the transpiler outputs Dart, and Flutter serves it in the browser.

```bash
cd transpiler
npx tsx src/cli.ts examples/counter.igni > test_app/lib/main.dart
cd test_app && flutter run -d chrome
```

Average compression: **5.7x fewer lines in Igni than Dart** across eleven example apps.

## Status

**Language spec:** Complete at [`spec/v0.5.1.md`](spec/v0.5.1.md). Designed iteratively through cold-LLM testing — pasting the spec into fresh Claude, Gemini, and ChatGPT sessions and grading the output. Eight test apps, three models, 24 data points across seven spec versions.

**Transpiler:** Working. Eleven example apps compile and run in the browser. Covers screens, components, layouts, conditionals, loops, functions, navigation, shared state, async data fetching, two-way data binding, and list operations. See [`transpiler/README.md`](transpiler/README.md).

## Repo structure

```
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── v0.5.1.md            # current — the transpiler builds against this
│   └── v0.2 → v0.5.md       # historical (never edited after shipping)
├── tests/                   # cold-LLM test results
│   ├── v0.3.2/              # Calculator, Todo, Weather
│   ├── v0.4/                # Chat, MusicPlayer, Notes
│   ├── v0.5/                # Notes re-run, Shopping
│   └── v0.5.1/              # Settings, Greeting (transpiler-validated)
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   └── examples/            # 11 .igni apps + .expected.dart references
└── docs/                    # project docs (private, gitignored)
```

## License

MIT. See [`LICENSE`](LICENSE).
