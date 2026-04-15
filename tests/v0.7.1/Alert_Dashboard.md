# Alert Dashboard Cold Test Results — v0.7.1

**Date:** 2026-04-15
**Models tested:** Gemini 3 Flash, Gemini 3.1 Pro, GPT 5.3, Claude Opus 4.6
**Input:** v0.7.1.md (full spec) + Alert Dashboard prompt from tests/v0.7.1/prompts.md #1
**App:** Alert Dashboard — single-screen list with severity-coloured badges and a summary line

## Purpose — feature-landing test for `upper()` / `lower()`

v0.7.0's Alert Dashboard round produced the strongest single-feature signal in the project's history: 4/4 model output friction on the missing uppercase-badge requirement (Gemini Pro wrote a mapper function, Opus 4.6 honest-flagged, Gemini Flash ignored, GPT 5.3 invented `upper()` with a broken placeholder) plus 4/4 ship-review flags = 8/8 compounded. v0.7.1 ships `upper(s)` / `lower(s)` as builtins. This rerun is the direct before/after: identical prompt, same four models.

**The hypothesis:** if the feature landed, every model renders the uppercase badge via `upper(alert.level)` — no mapper functions, no honest-refusals, no ignored requirements, no invented placeholder syntax. 4/4 spontaneous usage matches the v0.6.11 BMI rerun pattern that validated colour assignability.

## Headline result — `upper(alert.level)` landed 4/4

| | Gemini Flash | Gemini Pro | GPT 5.3 | Opus 4.6 | v0.7.0 | v0.7.1 | Delta |
|---|---|---|---|---|---|---|---|
| **Uppercase badge via `upper(alert.level)`** | ✓ | ✓ | ✓ | ✓ | 0/4 (workarounds) | **4/4** | **+4** |
| **Data model stays lowercase** | ✓ | ✓ | ✓ | ✓ | n/a | 4/4 | new |
| **Screen-level `severity_color(level)` function** | ✓ | ✓ | ✓ (`alert_color`) | ✓ | 4/4 | 4/4 | stable |
| **`AlertRow(alert, color)` — colour as arg** | ✓ | ✓ (`badge_color`) | ✓ | ✓ | 4/4 | 4/4 | stable |
| **Summary-colour via conditional reassignment** | ✓ | ✓ | ✓ | ✓ (ascending override) | 4/4 | 4/4 | stable |
| **No `lower()` invention on comparison side** | ✓ | ✓ | ✓ | ✓ | n/a | 4/4 | clean |
| **Transpiles (emits Dart)** | ✓ | ✓ | ✓ | ✓ | 3/4 | 4/4 | +1 |
| **Generated Dart passes `dart analyze`** | ✗ | ✗ | ✗ | ✗ | — | 0/4 | new bug |

## Per-hypothesis analysis

### 1. `upper(alert.level)` usage — 4/4

All four models render the badge text via `upper(alert.level)` inside the `AlertRow` component. The pattern is unanimous down to the call site:

```igni
component AlertRow(alert, color):
  layout horizontal, gap: medium, align: center:
    badge upper(alert.level), color: color
    label alert.message
```

Direct v0.7.0 → v0.7.1 deltas per model:

- **Gemini Flash:** v0.7.0 silently rendered lowercase `alert.level`; v0.7.1 writes `badge upper(alert.level)`. Gap closed.
- **Gemini Pro:** v0.7.0 wrote a mapper function `format_level(level)` returning literal uppercase strings; v0.7.1 drops the mapper entirely and calls `upper(alert.level)` at the render site. One function deleted from the output.
- **GPT 5.3:** v0.7.0 invented `upper()` (broken — undefined, with a placeholder `message_level` that returned literal `"ALERT"`); v0.7.1 uses the now-real `upper()` correctly. The broken-placeholder defect disappears.
- **Opus 4.6:** v0.7.0 honest-flagged the gap and rendered lowercase by choice; v0.7.1 writes `upper(alert.level)` with no commentary. The "honest no" converts cleanly to usage once the feature exists.

**Interpretation:** adding two builtins closed a 4/4 friction signal at 4/4 usage. The spec's Reference-section placement near `contains()`, together with the cheatsheet entry, was sufficient — no model asked whether `upper` / `lower` existed, none reached past them. This is the same shape as the v0.6.11 BMI rerun for colour assignability.

### 2. Data model stays lowercase — 4/4

None of the four pre-uppercased the stored `level` field. Every output stores `"critical"` / `"warning"` / `"info"` verbatim and converts at the UI boundary:

```igni
alerts = [
  {level: "critical", message: "..."},
  {level: "warning", message: "..."},
]
```

This is the exact data-model-stays-lowercase behaviour the v0.7.1 spec example advocates. Crucially, the comparison-side code (`if level is "critical"` inside `severity_color`) uses the same lowercase keys — no model wrote `if level is "CRITICAL"` or pre-uppercased to dodge the conversion. The "store strings in natural form" doc note in the spec was followed without being prompted.

### 3. Screen-level `severity_color(level)` function — 4/4 (stable vs v0.7.0)

All four models define a screen-level function branching on the level string and returning a colour token. Function names: `severity_color` (Gemini Flash, Gemini Pro, Opus), `alert_color` (GPT 5.3). Structure is identical to v0.7.0:

```igni
severity_color(level):
  if level is "critical":
    return danger
  if level is "warning":
    return orange
  return green
```

No regression from v0.7.0. Adding `upper` / `lower` did not disturb the function-returns-colour pattern.

### 4. `AlertRow(alert, color)` — colour as arg — 4/4 (stable vs v0.7.0)

Every component accepts the colour as a positional parameter and uses it directly on `badge color:`. Parameter shapes:

- **Gemini Flash:** `AlertRow(alert, color)` — whole alert plus precomputed colour
- **Gemini Pro:** `AlertRow(alert, badge_color)` — whole alert plus colour (new decomposition from v0.7.0 where it passed three separate args)
- **GPT 5.3:** `AlertRow(alert, color)` — simplified from v0.7.0's `(message, color)` shape
- **Opus 4.6:** `AlertRow(alert, color)` — whole alert plus colour

All four now pass the whole `alert` object plus the colour — consolidation vs v0.7.0 where shapes varied. The `upper()` call at the render site makes passing the whole alert strictly more useful (component needs `alert.level` for the badge and `alert.message` for the text), which is likely what drove the convergence.

### 5. Summary-colour via conditional reassignment — 4/4 (stable vs v0.7.0)

All four use the `summary_color = green` / conditional override pattern. Three use descending priority (`if critical > 0 ... else if warning > 0`). Opus 4.6 again uses ascending-override without `else if`:

```igni
summary_color = green
if warning_count > 0:
  summary_color = orange
if critical_count > 0:
  summary_color = danger
```

Last-write-wins makes the priority ordering readable top-to-bottom. Same stylistic choice as v0.7.0.

### 6. No `lower()` misuse on comparison — 4/4 clean

One hypothesis in prompts.md was that models might write `if lower(level) is "critical"` defensively, signalling uncertainty about whether Igni's `is` is case-sensitive. None did. All four compare lowercase keys against lowercase literals directly. The spec's implicit case-sensitivity contract held — no prompt-driven need to add an explicit doc note.

## New gap surfaced — `count()` identity trap on string-field matching

All four outputs had to solve the same secondary problem: count alerts by `level` string. The v0.7.0 Alert Dashboard round already flagged this once (GPT 5.3 self-corrected inline); v0.7.1 shows 4/4 friction, which promotes the signal.

- **Gemini Flash** wrote `count(alerts, a => a.level is "critical")` — the **predicate form**, which isn't in the current spec. `count(list, target)` is defined as identity-based. This is a clean invention of the shape: `count(list, predicate)`, which is the same shape as `filter(list, predicate)` and `find(list, predicate)`.
- **Gemini Pro** explicitly explained in its commentary: *"The spec strictly defines `count(list, target)` as an identity/reference-based match. Because we are matching by a field value, using `count` with an object literal wouldn't work. Instead, I used `length(filter(alerts, a => a.level is "critical"))`."* — honest workaround, spelled out the friction.
- **GPT 5.3** wrote a broken placeholder `count(filter(alerts, ...), alerts[0])`, added a comment, and immediately self-corrected with `length(filter(...))`. The self-correction block is visible in the emitted code.
- **Opus 4.6** went straight to `length(filter(alerts, a => a.level is "critical"))` without commentary.

**Signal strength:** 4/4 models hit the friction; 1/4 invented the predicate form outright; 1/4 flagged it explicitly in commentary; 1/4 wrote a visible self-correction. This matches the threshold that promoted `upper` / `lower` out of the ideas backlog. The likely resolution is either:

- **Extend `count` to accept a predicate:** `count(list, predicate)` alongside `count(list, target)`. Same name, polymorphic — violates "one way" mildly, matches how `find` is already defined.
- **Recommend `length(filter(...))` explicitly in the spec:** one-line doc note, zero syntax cost. Same shape as the "store strings in display form" debate, and one the string-case decision came down against.

Logged to the v0.8 backlog, not acted on in this release.

## Per-model architecture notes

### Gemini 3 Flash

Clean, minimal output. Uses `align: center` on the `AlertRow` horizontal layout for vertical alignment — a small polish detail. Invented `count(list, predicate)` — the only spec-invention in the round, and structurally the strongest form of the `count()` gap signal. Otherwise unremarkable, which is itself worth noting: the model that previously ignored the uppercase requirement now uses `upper()` without fanfare.

### Gemini 3.1 Pro

Most spec-idiomatic output. Writes the commentary acknowledging the `count()` identity trap, chooses the spec-legal workaround, and explicitly names the v0.7.1 guidance: *"The `upper()` transformation only happens right at the UI boundary inside the `badge` primitive."* The pattern the spec advocates is being recognised as the pattern.

### GPT 5.3

The same model that produced the roughest v0.7.0 output (broken `upper()` placeholder + literal `"ALERT"` badge) now produces a correct run — with the caveat that the self-correcting `count` block is still visible in the emitted code:

```igni
critical_count = count(filter(alerts, a => a.level is "critical"), alerts[0])  # placeholder init
...
# Fix counts using length (since count is identity-based)
critical_count = length(critical_list)
```

Last-write-wins means the correct line runs, but the file contains dead code. Same defect shape as v0.7.0, different line. The model's own commentary calls out the `count` friction but doesn't clean up. Grade-affecting for code-quality but not for the `upper()` hypothesis.

### Claude Opus 4.6

Cleanest output. Ascending-override summary colour, explicit v0.7.1 citation in commentary (*"This follows the v0.7.1 guidance"*), correct `length(filter(...))` without commentary. No inventions. Behaviour matches v0.7.0 except the previously-flagged uppercase gap is gone — the "honest no" became "spontaneous use."

## Two-stage validation status

**Stage 1 (spec-level grading):** 4/4 legal `upper()` usage. 1/4 invented `count(list, predicate)` (Gemini Flash) — distinct gap signal, not an `upper()` failure. GPT 5.3's dead-code self-correction is a code-quality defect but not a spec violation (last-write-wins means the correct lines run).

**Stage 2 (transpiler validation):** run. All four outputs saved to `tests/v0.7.1/outputs/*.igni` and transpiled via `npx tsx src/cli.ts`. Headline findings:

- **All 4 transpile cleanly** — the Igni lexer/parser/codegen emits valid-looking Dart for every output, including Gemini Flash's invented `count(list, predicate)` (falls through to the generic `count(list, target)` path).
- **0/4 pass `dart analyze`** — all four outputs trip the same error: `implicit_this_reference_in_initializer`. The codegen emits screen-body-top-level derived variables (`critical_count = length(filter(alerts, ...))`) as State-class instance-field initialisers that reference another instance field (`alerts`), which Dart forbids. Flutter would refuse to build all four.
- **`upper()` codegen itself is clean.** Every output emits `alert['level'].toString().toUpperCase().toString()` — the double `.toString()` is cosmetic-only and valid Dart. The `upper()` feature is not the problem.
- **Severity-specific findings:**
  - **Gemini Flash's `count(alerts, a => a.level is "critical")`** compiles into `alerts.where((e) => e == (a) => a['level'] == 'critical').length` — comparing each alert against a lambda literal via `==`, which is always false. Counts would render as `0 critical, 0 warnings, 0 info` even if the dart-analyze bug were fixed. Two defects stacked.
  - **GPT 5.3's broken-then-corrected count block** emits `var critical_count = ...` twice in the same scope. Dart treats this as duplicate variable declaration (additional compile errors on top of the shared instance-field-initialiser bug).
  - **Gemini Pro and Opus 4.6** would run correctly once the shared transpiler bug is fixed — their Igni is structurally clean.

**Headline:** the `upper()` language feature landed. The transpiler surfaced a separate bug not caused by v0.7.1 but revealed by the Alert Dashboard prompt's derived-state shape (`alerts` at the top, counts derived from `alerts`, both at screen-body level). Same bug exists in v0.7.0 — the prior round didn't catch it because the broken GPT 5.3 output failed earlier and the other three weren't fully dart-analysed.

## Verdict

**Spec-level:** feature validated 4/4. v0.7.1's `upper(s)` / `lower(s)` builtins close the 8/8 compounded signal from v0.7.0 cleanly — every model converts at the render site, nobody pre-uppercases the data model, nobody reaches past the feature. Direct analogue to the v0.6.11 BMI rerun that validated colour assignability: same before/after methodology, same 4/4 landing, same qualitative convergence across models.

**Transpiler-level:** separate 4/4 gap surfaced that blocks Flutter build on all four outputs. The codegen emits screen-body-top-level derived variables as State instance-field initialisers that reference other instance fields — illegal Dart. Not caused by v0.7.1; not specific to the `upper()` feature; was latent in v0.7.0 and earlier. Existing 28 example apps avoid the pattern (derived computations live inside functions or the build method), so `npm test`'s text-diff testing didn't catch it.

**Net:** v0.7.1's language feature ships. The transpiler has a new highest-priority fix driven by a 4/4 cold-test signal. The `count()` predicate form is a genuine secondary spec signal (4/4 friction, 1/4 spontaneous invention) but lower priority than the transpiler bug that blocks these outputs from running at all.

## Next steps

1. **Fix the derived-state-at-screen-body transpiler bug.** Either move `var name = initialiser` into the build method (re-evaluates each frame — matches lexical reactivity), or emit `late final` with initialisation in `initState()`. Blocks Flutter build on 4/4 cold-test outputs — highest-priority transpiler work. Add a regression example (counts derived from a list, both at screen-body level) to `transpiler/examples/` so `npm test` catches it.
2. **Add `count()` predicate form / string-field counting to the ROADMAP v0.8 backlog** with 4/4 evidence note. Cross-reference this file as the source. 1/4 spontaneous invention (Gemini Flash) plus 3/4 explicit workaround via `length(filter(...))`.
3. **Begin v0.8 spec design work once the transpiler bug is fixed.** Two signals sit in the queue: event-handlers-as-component-arguments (5/8 from v0.7.0 BMI + ship review) and `count()` predicate form (4/4 from v0.7.1 Alert Dashboard). The event-handler gap sits on a more structurally important axis (component reusability for inputs); the `count()` gap is narrower but has clean 4/4 evidence. Design notes needed before either lands.

## Appendix — raw outputs and transpilation artifacts

- `tests/v0.7.1/outputs/gemini-flash.igni` — invented `count(list, predicate)`
- `tests/v0.7.1/outputs/gemini-pro.igni` — cleanest output
- `tests/v0.7.1/outputs/gpt-53.igni` — visible self-correction block
- `tests/v0.7.1/outputs/opus-46.igni` — ascending-override summary colour

All four transpile via `npx tsx transpiler/src/cli.ts <file>.igni`. All four fail `dart analyze` on the derived-state-initialiser bug. Gemini Flash additionally produces a semantically-broken count loop; GPT 5.3 additionally duplicates `var` declarations.

## Postscript — transpiler bug fixed same session (2026-04-15)

The derived-state-initialiser bug was fixed in `transpiler/src/codegen.ts` during the same working session: a third pre-pass now promotes any screen-body variable whose initialiser references another screen-body variable to a build-local (matches lexical reactivity — recomputes on rebuild). Regression test added as `transpiler/examples/derived-counts.igni` so `npm test` catches the pattern going forward.

Post-fix transpile results:

| | Gemini Flash | Gemini Pro | GPT 5.3 | Opus 4.6 |
|---|---|---|---|---|
| **Transpiles** | ✓ | ✓ | ✓ | ✓ |
| **Passes `dart analyze` (0 errors)** | ✓ | ✓ | ✓ | ✓ |
| **Produces correct runtime output** | ✗ (invented `count(list, predicate)` compiles to always-false comparison, counts stay at 0) | ✓ | ✓ (dead self-correction code still emitted but correct values win via last-write) | ✓ |

The `count()` predicate-form issue (Gemini Flash) is now purely a runtime-semantics bug rather than a compile error. 3/4 outputs run correctly; the fourth transpiles and builds but produces visibly wrong counts. That promotes the `count()` predicate-form gap from "friction signal" to "correctness signal" — still v0.8 backlog, now with stronger weight.

28 → 29 existing transpiler examples all still pass (`npm test` confirms). The fix was zero-regression.
