# Habit Tracker Cold Test Results — v0.8.1 framing comparison

**Date:** 2026-04-15
**Models tested:** Claude Opus 4.6, Gemini 3 Flash, ChatGPT 5.3, Gemini 3.1 Pro
**Inputs:** `spec/v0.8.0.md` vs `spec/v0.8.1.md` + identical Habit Tracker prompt
**Purpose:** test whether docs-only framing cleanup improves first-read understanding without changing the language

## Headline result

| Signal | v0.8.0 | v0.8.1 | Delta |
|---|---|---|---|
| Valid Igni output | ?/4 | ?/4 | |
| Syntax inventions | ? | ? | |
| Framework drift | ? | ? | |
| Idiomatic Igni structure | ?/4 | ?/4 | |
| Transpiles | ?/4 | ?/4 | |
| Passes `dart analyze` | ?/4 | ?/4 | |

## Comparison summary

Short verdict after all eight runs:

- Did `v0.8.1` reduce framework-shaped drift?
- Did `v0.8.1` make the model explanations more on-target?
- Did correctness stay flat, improve, or regress?

## Per-model notes

### Claude Opus 4.6

#### v0.8.0

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

#### v0.8.1

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

### Gemini 3 Flash

#### v0.8.0

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

#### v0.8.1

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

### ChatGPT 5.3

#### v0.8.0

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

#### v0.8.1

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

### Gemini 3.1 Pro

#### v0.8.0

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

#### v0.8.1

- Raw output file:
- Spec-level notes:
- Transpiler result:
- `dart analyze` result:

## What to watch for

- Less React/Flutter-shaped overengineering under `v0.8.1`
- Cleaner explanation of Igni as a UI-first language
- Same or better correctness despite no semantic changes
- Any regressions caused by the new intro wording

## Output file convention

Suggested filenames under `tests/v0.8.1/outputs/`:

- `v080-habit-opus-46.igni`
- `v081-habit-opus-46.igni`
- `v080-habit-gemini-flash.igni`
- `v081-habit-gemini-flash.igni`
- `v080-habit-gpt-53.igni`
- `v081-habit-gpt-53.igni`
- `v080-habit-gemini-pro.igni`
- `v081-habit-gemini-pro.igni`
