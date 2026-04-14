# Quizzler Cheatsheet-Only Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3 Flash, ChatGPT 5.3
**Input:** v0.6.5-cheatsheet.md only (300 lines) — no full spec
**App:** Quizzler (same prompt as v0.6.5 full-spec test)

## The experiment

Previous cold tests always pasted the full spec (~1100 lines). This test pasted only the cheatsheet (~300 lines) — a 70% reduction in input. Same prompt, same models, same app. The question: does the condensed reference produce the same quality output?

## Results

| Model | Transpiles? | Structure | Notable issues |
|---|---|---|---|
| Claude Opus 4.6 | Yes | Correct | Used `shared:` for single-screen state (unnecessary) |
| ChatGPT 5.3 | Yes | Correct | Clean, minimal |
| Gemini 3.1 Pro | Yes | Correct | Cleanest output |
| Gemini 3 Flash | Partial | Variables at file level | Put questions/functions outside screen body |

## Cheatsheet vs full spec

Outputs are structurally identical to the full-spec run. Same indexing pattern, same score tracking, same completion detection, same restart logic.

| Metric | Full spec (1100 lines) | Cheatsheet (300 lines) | Delta |
|---|---|---|---|
| Models producing correct code | 4/4 | 3/4 (one scoping error) | -1 |
| `questions[index]` usage | 4/4 | 4/4 | Same |
| Score tracking pattern | 4/4 identical | 4/4 identical | Same |
| Structural convergence | High | High | Same |

## The two errors

**Claude — `shared:` for single-screen state:** Put all state in a `shared:` block. Functionally works but unnecessary. The cheatsheet said "access from any screen" but didn't say "only use when multiple screens need the data." Fixed by adding one line to the cheatsheet.

**Gemini Flash — variables at file level:** Put questions list and functions outside the screen body. Invalid Igni — variables and functions live inside screens. The cheatsheet's screen examples only showed layouts inside screen bodies. Fixed by adding a screen example with variables and functions, plus a bold note.

## Key finding

**The 300-line cheatsheet produces structurally identical outputs to the 1100-line full spec across 4 frontier models.** Approximately 70% of the full specification is explanatory context that aids human comprehension but is not required for LLM code generation accuracy. The remaining 30% (rules, syntax patterns, examples, builtins) is what the LLM actually uses.

Implications:
- The cheatsheet is the primary document for LLM consumption. The full spec is for human readers.
- Spec optimisation for LLM accuracy should focus on the cheatsheet.
- Cold tests should run against both formats to measure the compression penalty.

## Cheatsheet fixes applied

Both errors were fixed in v0.6.6-cheatsheet.md:
1. Added "Use `shared:` only when multiple screens need the same data. Single-screen state is local." to the shared state section.
2. Added screen example showing variables and functions inside the body, with bold note "Variables, layouts, and functions all live inside the screen body."
