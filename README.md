# Igni

A UI-first programming language designed for human readability and LLM accuracy.

**Status: design stage.** No compiler or runtime exists yet. The current artifact is a single markdown spec, iterated through versioned snapshots and validated with cold-LLM tests across multiple frontier models.

## North star

*"Flutter, without the bracket hell."*

Igni's hypothesis is that LLM accuracy and human readability correlate more tightly than people think — most of what's hard about Flutter for LLMs is the same stuff that's hard for humans. By stripping away alternatives and ambiguity, you get a language that's both nicer to read and easier for LLMs to write correctly on the first try.

## At a glance

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons end the line that opens one. Lowercase for built-in primitives, PascalCase for user-defined components and screens. No imports, no `useState`, no controllers, no boilerplate. Reactivity is automatic via lexical variable references.

## The current spec

The canonical version is **[`spec/v0.4.md`](spec/v0.4.md)**.

## Project history and versioning

The language was originally named **Rocket**, then renamed to **Igni** at v0.3.2 — a Witcher reference (Igni is the fire sign). The Rocket-era spec files (v0.2, v0.3, v0.3.1) are preserved as historical snapshots and never edited.

| Version | Era | Status | Key additions |
|---|---|---|---|
| `spec/v0.2.md` | Rocket | Historical | Original draft |
| `spec/v0.3.md` | Rocket | Historical | Async data, mutations, screen-internal functions, lexical reactivity rule |
| `spec/v0.3.1.md` | Rocket | Historical | Mutation pattern fix, `icon` primitive, object literals, no string interpolation |
| `spec/v0.3.2.md` | Igni | Historical | Renamed Rocket → Igni; no language changes |
| **`spec/v0.4.md`** | **Igni** | **Canonical** | Arithmetic operators, `is X` for equality, `null`, list operations, `each` in functions, comments |

## Validation methodology

The spec is validated with **cold-LLM tests**: paste the current spec into a fresh frontier-model conversation (Claude, Gemini, ChatGPT) and run a fixed set of test prompts verbatim. The model's output is graded against three questions:

1. **Did it invent syntax that's not in the spec?** → *spec has a gap*
2. **Did it use existing syntax wrong?** → *spec is ambiguous*
3. **Did it produce valid Igni on the first try?** → *spec works for this case*

Gaps that surface across multiple models or multiple test apps become the next version's backlog. The methodology is documented in [`tests/README.md`](tests/README.md).

### Test results so far

| App | Spec version | Models tested | Outcome |
|---|---|---|---|
| Calculator | v0.3.2 | Claude Opus 4.6, Gemini 3.1 Pro, ChatGPT | Surfaced arithmetic operators, `is` extension, precedence — all closed by v0.4 |
| Todo list | v0.3.2 | Claude Opus 4.6, Gemini 3.1 Pro, ChatGPT | Surfaced list `+`, list removal, `each` in functions — all closed by v0.4 |
| Weather app | v0.3.2 | Claude Opus 4.6, Gemini Thinking 3.0, ChatGPT | Validated reactive read pattern; surfaced `null` — closed by v0.4 |
| Chat interface | v0.4 | Pending | v0.4 acceptance test |
| Music player | v0.4 | Pending | v0.4 acceptance test |
| Notes app | v0.4 | Pending | v0.4 acceptance test (first multi-screen) |

Three apps tested across three models = 9 independent data points so far. **v0.4 is the first version drafted from empirical evidence rather than designer intuition.**

## Design principles

- **One way to do everything.** No aliases. No shortcuts. No alternatives.
- **Indentation, no brackets.** No braces. No parentheses on component invocation. No inline conditionals.
- **Max nesting depth 4** for `layout` / `screen` / `component` blocks.
- **No magic.** If something happens at runtime, the cause should be visible in the source.
- **The spec is a budget, not a backlog.** Every new keyword or block type is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity — in an AI-assisted coding world, models write the boilerplate.

## Repo structure

```text
igni/
├── README.md                       # this file
├── CLAUDE.md                       # working notes for AI assistants
├── LICENSE                         # MIT
├── spec/                           # all spec versions, oldest to newest
│   ├── v0.2.md                     # Rocket-era historical
│   ├── v0.3.md                     # Rocket-era historical
│   ├── v0.3.1.md                   # Rocket-era historical
│   ├── v0.3.2.md                   # Igni-era historical (rename only)
│   └── v0.4.md                     # canonical
└── tests/                          # cold-LLM test infrastructure
    ├── README.md                   # test methodology
    ├── v0.3.2/                     # tests run against v0.3.2
    │   ├── prompts.md              # the three prompts tested against v0.3.2
    │   ├── Calculator.md           # complete
    │   ├── Todo.md                 # complete
    │   ├── Weather.md              # complete
    │   └── summary.md              # cross-app aggregation that fed the v0.4 backlog
    └── v0.4/                       # tests run against v0.4 (current)
        ├── prompts.md              # the three v0.4 acceptance prompts
        ├── Chat.md                 # acceptance test, pending
        ├── MusicPlayer.md          # acceptance test, pending
        └── Notes.md                # acceptance test, pending — first multi-screen
```

## What this project is *not*

- **Not a Flutter plugin or DSL yet.** The transpile-to-Flutter path is under consideration but uncommitted.
- **Not an active codebase.** No build step, no compiler, no runtime. The project is a design document and its empirical validation.
- **Not a multi-target language for v1.** Web is the v1 target so that "three commands to first pixel" stays achievable. Mobile compilation is opt-in later.

## License

MIT. See [`LICENSE`](LICENSE).
