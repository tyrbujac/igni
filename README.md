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

Igni source (`.igni` files) transpiles to Dart targeting Flutter for web. You write Igni, the transpiler outputs a standard Flutter project, and `flutter run` serves it in the browser. The goal is three commands to first pixel:

```
install igni
igni new my-app
igni run
```

Web is the v1 target. Mobile compilation comes later via Flutter's existing toolchain.

## Status

The language spec is complete at **[`spec/v0.5.1.md`](spec/v0.5.1.md)**. The spec was designed iteratively using cold-LLM testing — pasting the spec into fresh Claude, Gemini, and ChatGPT sessions, asking the model to write apps, and grading the output. Gaps found across models became the next version's design work. Eight test apps across three models produced 24 independent data points over seven spec versions.

The next workstream is the **TypeScript-to-Dart transpiler**.

## Repo structure

```
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── v0.5.1.md            # current — the transpiler builds against this
│   └── v0.2 → v0.5.md       # historical versions (never edited after shipping)
├── tests/                   # cold-LLM test results
│   ├── README.md            # test methodology
│   ├── v0.3.2/              # Calculator, Todo, Weather — fed v0.4
│   ├── v0.4/                # Chat (PASS), MusicPlayer (PARTIAL), Notes (MIXED)
│   └── v0.5/                # Notes re-run (PASS), Shopping (PARTIAL) — fed v0.5.1
└── docs/                    # project docs (proposal, etc.)
```

Spec files are immutable snapshots — each new version is a new file. Tests live alongside the spec version they were run against.

## License

MIT. See [`LICENSE`](LICENSE).
