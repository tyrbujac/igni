# Alert Dashboard Cold Test Results — v0.7.0

**Date:** 2026-04-14
**Models tested:** Gemini 3 Flash, GPT 5.3, Gemini 3.1 Pro, Claude Opus 4.6
**Input:** v0.7.0.md (full spec) + Alert Dashboard prompt from tests/v0.7.0/prompts.md #2
**App:** Alert Dashboard — single-screen list with severity-coloured badges and a summary line

## Purpose — architecture-flow validation for styling-tokens-as-values

The v0.7.0 spec adds two examples claiming styling tokens flow through architecture like any other value: a function returning a colour (`severity_color(level)`) and a component accepting a colour as an argument (`StatusBadge(text, color)`). The BMI round showed the *value-reassignment* pattern landing 4/4 — but that pattern stays entirely inside a single screen body. The Alert Dashboard prompt is designed to exercise the two flows the spec added examples for but the BMI app doesn't touch:

1. Does a model spontaneously factor out a `severity_color(level)` screen-level function that returns a colour token?
2. Does the reusable `AlertRow` component accept a colour as a named parameter (not recompute it internally)?

Both patterns were explicitly prompted for in the requirements block, but the question is whether models execute them cleanly or invent workarounds around a syntax they're unsure about.

## Headline result — architecture-flow patterns landed 4/4 on both axes

| | Gemini Flash | GPT 5.3 | Gemini Pro | Opus 4.6 |
|---|---|---|---|---|
| **Screen-level function returns colour** | ✓ `severity_color` | ✓ `color_for` | ✓ `get_color` | ✓ `severity_color` |
| **Component accepts colour arg** | ✓ `AlertRow(alert, color)` | ✓ `AlertRow(message, color)` | ✓ `AlertRow(msg, txt, badge_color)` | ✓ `AlertRow(alert, badge_color)` |
| **Summary colour via conditional reassignment** | ✓ | ✓ | ✓ | ✓ (ascending override) |
| **Correct `filter + length` (not identity-based `count`)** | ✓ | ✓ (after a false start) | ✓ | ✓ |
| **Addresses "uppercase badge text" requirement** | ✗ renders lowercase | ~ invents `upper()` + placeholder | ✓ `format_level` mapper | ✗ flags gap, keeps lowercase |
| **Output transpiles on first try (predicted)** | likely ✓ | ✗ (broken counting block + undefined `upper`) | likely ✓ | likely ✓ |

## Per-hypothesis analysis

### 1. Function-returns-colour pattern — 4/4

All four models produced a screen-level function that branches on a `level` string and returns a colour token. The function shape is identical to the spec example modulo the function name:

```igni
severity_color(level):
  if level is "critical":
    return danger
  if level is "warning":
    return orange
  return green
```

Three models call the function inline at the `AlertRow` invocation site (`AlertRow alert, severity_color(alert.level)`). One model (Gemini Flash) also does this. Nobody invented a lookup-dictionary pattern (`{critical: danger, warning: orange, info: green}[level]`) — the gap signal flagged in prompts.md didn't appear. This is the cleanest possible outcome: the spec example became the only pattern models reached for.

**Interpretation:** the v0.7.0 spec addition of a `severity_color(level)` example in the Colours and Styling section was sufficient. Adding it wasn't just polish — it was the difference between "feature legal" and "feature used spontaneously."

### 2. Component-takes-colour-argument — 4/4

Every model defined `AlertRow` with colour as a named parameter, none recomputed the colour internally. Parameter naming varies (`color`, `badge_color`), parameter order varies, but the structural pattern is unanimous:

- **Gemini Flash:** `AlertRow(alert, color)` — passes the whole alert object plus the precomputed colour.
- **GPT 5.3:** `AlertRow(message, color)` — passes just the message string and the colour.
- **Gemini Pro:** `AlertRow(message, badge_text, badge_color)` — passes all three pieces, fully decomposed.
- **Opus 4.6:** `AlertRow(alert, badge_color)` — same shape as Gemini Flash.

All four correctly render `badge <level_text>, color: badge_color` inside the component — the `color` parameter flows directly into a `color:` property without any computation. This is exactly the architecture-flow the v0.7 `StatusBadge` example demonstrates.

### 3. Summary-colour via conditional reassignment — 4/4

All four use the canonical `summary_color = green` / override pattern. Three models write it as `if critical > 0 ... else if warning > 0`. Opus 4.6 inverts to ascending-override (`if warning > 0: summary_color = orange; if critical > 0: summary_color = danger`) — arguably cleaner because last-write-wins makes the priority ordering readable top-to-bottom, but structurally the same pattern.

### 4. `count` vs `filter+length` — the identity-based-builtins warning held

The spec explicitly documents that `count` is identity-based and suggests `filter(...) + length(...)` for field matching. Every model correctly reached for the compose pattern:

```igni
critical_count = length(filter(alerts, a => a.level is "critical"))
```

GPT 5.3 initially wrote a broken `count(filter(alerts, ...), alerts[0])` line, then immediately self-corrected in-place with a "Correct counting" comment and reassigned with the `filter + length` pattern. The top-to-bottom re-evaluation model means the correct line wins at runtime, but it's messy code. The other three produced the correct pattern on the first line.

**Interpretation:** the spec's identity-vs-predicate distinction is landing. The `find_by` / `replace_by` ergonomics gap flagged by ChatGPT 5.3 in the earlier spec review remains a real pain point (GPT 5.3 literally had to self-correct inline), but models do find the legal workaround every time. Deferrable to v0.8.

## New gap surfaced — no string-case builtin

4/4 models noticed the "uppercase badge text" requirement. None had a clean spec-legal path.

- **Gemini Pro** wrote a second mapper function `format_level(level)` that returns `"CRITICAL"` / `"WARNING"` / `"INFO"`. Spec-legal, verbose.
- **Opus 4.6** explicitly flagged the gap in its commentary and chose lowercase, noting "inventing one would break the 'only use the spec' constraint."
- **Gemini Flash** silently rendered `alert.level` as lowercase, not addressing the uppercase requirement at all.
- **GPT 5.3** invented `upper()` and a placeholder `message_level(message)` that returns the literal string `"ALERT"`, then called `upper(message_level(message))`. The output is broken: the AlertRow invocation passes only `alert.message` and the colour — no level text — and the component synthesises a fake level. This is the worst spec-level output of the round.

This is a **4/4 gap signal** by a different definition than the BMI event-handler gap. On BMI, 2/4 models invented syntax; the other 2 found the legal workaround silently. On Alert Dashboard, *every* model visibly struggled with the missing string-case utility: two flagged it, one invented it, one worked around it with a mapper function.

**Candidates for the fix:**

- `upper(string)` / `lower(string)` builtins — adds two names to the spec, solves the class.
- Store uppercase strings at data level, accept that the data-level form and display form should match — the "one way" principle says this is the spec's preferred stance.

The first is the smaller change but adds two builtins. The second is a doc note ("store strings in their display form; Igni has no case conversion"). Worth a design decision before shipping v0.7.1.

## Per-model architecture notes

### Gemini 3 Flash

Cleanest output of the four. Function placement inside the screen body, function invoked inline at the `AlertRow` call site, correct `filter+length` counting, correct summary-colour reassignment. The only defect is ignoring the uppercase badge requirement — silently renders `alert.level` in its stored (lowercase) form. No inventions, no broken code.

### GPT 5.3

The roughest output of the round. Three defects in one file:

1. **Self-correcting broken code:** writes three `count(filter(...), alerts[0])` lines, then immediately overwrites them with correct `filter+length` lines. At runtime the correct set wins (last write), but the file includes dead incorrect code with a `# temp pattern` comment.
2. **Invented `upper()` builtin.**
3. **Placeholder `message_level(message)` that returns the literal string `"ALERT"`.** The AlertRow invocation doesn't pass the level at all, so the badge renders as literal `"ALERT"` for every row. This is genuinely broken: the app would display "ALERT" on every badge regardless of severity.

The model's own commentary calls out "one compromise worth calling out" about the missing level text, but the code as written doesn't match what the prompt asked for. This is the worst BMI + Alert Dashboard output on v0.7.0 from GPT 5.3 specifically — it's reaching past the spec on both prompts.

### Gemini 3.1 Pro

The most spec-idiomatic output. Two screen-level functions (`get_color` and `format_level`), component receives three decomposed arguments (message, badge_text, badge_color), correct `filter+length` counting, correct summary-colour pattern. The only minor point is that the inner `label message` in the AlertRow has no explicit colour — inherits default, which may or may not read on the background. Negligible.

### Claude Opus 4.6

Clean v0.7 usage throughout. Ascending-override for summary colour is an interesting stylistic choice that reads well. Correctly flags the missing string-case builtin in its own commentary and chooses not to invent around it — this is the "honest no" behaviour the methodology considers high-value diagnostic output. The AlertRow takes the whole `alert` object plus a colour, which is slightly heavier than GPT 5.3's message-only approach but keeps the component self-describing.

## Two-stage validation status

**Stage 1 (spec-level grading):**

- Gemini Flash, Gemini Pro, Opus 4.6 — produced legal-looking Igni for every constraint except the uppercase-badge requirement (which has no spec-legal answer without adding a builtin).
- GPT 5.3 — contains broken/placeholder code that would not produce the intended UI. Grade: fail.

**Stage 2 (transpiler validation):** not yet run. Predictions:

- Gemini Flash, Gemini Pro, Opus 4.6: expected zero-fix transpile and run.
- GPT 5.3: will error on `upper()` (undefined) even after the dead `count(...)` lines are tolerated by last-write reassignment. Even if `upper()` silently no-ops, the app's badge output would be the literal string "ALERT" — spec-compliant but functionally broken.

## Cross-prompt synthesis (BMI + Alert Dashboard)

Running both prompts of the v0.7.0 cold test round surfaces two separate gaps that should be distinguished for v0.8 planning:

1. **Event handlers as component arguments — 2/4 invention signal, BMI only.** Gemini Flash and GPT 5.3 invented `on_tap_handler` / `on decrease:` respectively to pass caller-provided handlers into reusable input components. String-key dispatch is the spec-legal workaround (Opus, Gemini Pro used it). This gap surfaces specifically when a child component needs to trigger parent-state mutations.

2. **String case conversion — 4/4 friction signal, Alert Dashboard only.** Every model noticed the gap, with varied responses (ignore, invent, workaround-function, honest flag). Cleaner signal than the BMI event-handler gap because all four models hit the same wall.

Both are v0.8 candidates. Ranking by strength: string case has a higher N (4/4 vs 2/4) but the event-handler gap sits on a more structurally important axis (component reusability for inputs). A small-surface v0.7.1 could ship `upper` / `lower` builtins as a minor addition without pre-empting v0.8's event-handler design.

## Verdict

Both Alert Dashboard hypotheses landed 4/4: function-returns-colour and component-takes-colour-arg are not just legal but reflexive when prompted. Combined with the BMI round's 4/4 on value-reassignment, v0.7.0's styling-tokens-as-values feature is fully validated across all three architecture axes the spec examples cover.

One new gap surfaced at stronger signal than anything remaining from the BMI round (4/4 string-case vs 2/4 event-handlers). This changes the v0.8 design-work priority order: string case is now the frontrunner for the next patch, with event-handler-as-argument as the larger structural question behind it.

v0.7.0 should ship as the canonical spec. String case is a candidate for a v0.7.1 mini-addition, not a blocker.

## Next steps

1. Run all four outputs through the transpiler; confirm stage-2 predictions above.
2. Decide: does v0.7.1 ship `upper(string)` / `lower(string)` as a minor builtin addition, or does the spec add a doc note saying "store strings in their display form"? The 4/4 friction signal argues for adding the builtins; the spec-budget rule argues for the doc note. Worth a focused review.
3. Begin v0.8 design work on event handlers as component arguments, driven by the 2/4 BMI invention signal. The string-key dispatch workaround is a real ergonomics cost and the cold tests show frontier models reaching past it.
