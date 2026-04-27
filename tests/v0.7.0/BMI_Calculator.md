# BMI Calculator Cold Test Results — v0.7.0

**Date:** 2026-04-14
**Models tested:** Gemini 3 Flash, Gemini 3.1 Pro, ChatGPT 5.3, Claude Opus 4.6
**Input:** v0.7.0.md (full spec) + identical-to-v0.6.11 BMI prompt
**App:** BMI Calculator — Angela Yu Flutter Course #5

## Purpose — feature-landing test for styling-tokens-as-values

v0.7.0's single addition is styling tokens as assignable values: colour tokens can be stored in variables, passed through components/functions, and reassigned in `if`/`else`. `card` is assignable too but remains background-only at the property boundary.

Across the entire v0.6.x BMI sequence, the strongest unresolved signal was models *wanting* to write `bg = card` / `status_color = green` and having no legal way to do so. v0.7.0 makes that syntax real. The BMI prompt is **identical to v0.6.8 and v0.6.11** — same app, same four models. The spec is what changed.

**The hypothesis:** if the feature landed, the BMI-category colour on the Results screen will be variable-driven in 4/4 outputs, and the gender-card selection background will be variable-driven in 4/4 outputs. Both patterns are exactly what the spec's examples now show.

## Headline result — feature landed unanimously

| | Gemini Flash | Gemini Pro | ChatGPT 5.3 | Opus 4.6 | v0.6.11 | v0.7.0 | Delta |
|---|---|---|---|---|---|---|---|
| **BMI category via `status_color` variable** | ✓ | ✓ | ✓ | ✓ | 0/4 (duplicated labels) | **4/4** | +4 |
| **Gender-card `bg = card` / `bg = brand`** | ✓ | ✓ | ✓ | ✓ | n/a (was illegal) | **4/4** | new |
| **`card` boundary compliance (no `color: card`)** | ✓ | ✓ | ✓ | ✓ | — | **4/4** | clean |
| **`round(bmi, 1)` carried over from v0.6.11** | ✓ | ✓ | ✓ | ✓ | 4/4 | **4/4** | stable |
| **`shape: circle` on +/- carried over** | ✓ | ✓ | ✓ | ✓ | 4/4 | **4/4** | stable |
| **Bottom-anchored CTA via `fill: true`** | ~ (empty spacer) | ✓ | ~ (empty spacer) | ✓ | ~3.5/4 | **~3/4** | stable |
| **First-class event handlers (invention)** | invented `on_tap_handler` param | — | invented `on decrease` / `body.decrease()` | — | — | 2/4 | **new gap** |

## Per-hypothesis analysis

### 1. Styling-tokens-as-values — 0/4 → 4/4 (feature landed)

Every model used the `status_color = green` / conditional-reassign pattern on the Results screen, without any prompt steering them toward it. This is the largest convergence jump we've seen on any v0.x → v0.(x+1) transition, and it closed the single largest recurring signal of the v0.6.x series.

Variation across models is stylistic, not structural:

- **Gemini Pro / Opus 4.6 / GPT 5.3:** default to `green`, override to `danger` / `orange`. Matches the spec's BMI example almost verbatim.
- **Gemini Flash:** default to `green`, override to `red` / `orange`. Uses `red` instead of `danger` for underweight — both are legal colours in the spec, so this is a styling judgement, not an invention.

All four also extended the pattern to one or more other variables beside colour (`category = "NORMAL"`, `message = "..."`, `interpretation = "..."`). The "assign default then conditionally override" idiom that the spec documents for styling propagates cleanly to strings too.

### 2. Gender-card background via variable — 0/4 → 4/4

Every GenderCard component uses the exact `bg = card` / `if selected: bg = brand` pattern the spec documents. Three of four override to `brand` (matching the spec example); Gemini Flash overrides to `subtle` (defensible — the prompt said "visually distinct," not "use the accent colour").

This is the cleanest adoption of a new v0.7 pattern: the spec shows one example, models apply it to a structurally similar case, and the code reads correctly on the first try.

### 3. `card` boundary compliance — 4/4

Zero models used `card` with `color:`. Zero models used `card` in an arithmetic or comparison expression. The boundary rule landed without needing any prompt reinforcement — the single sentence "Using `card` with `color:` is an error" appears to have been sufficient.

### 4. v0.6.11 carry-overs all stable

`round(bmi, 1)` = 4/4 (maintained from v0.6.11).
`shape: circle` on the +/- steppers = 4/4 (maintained).
Bottom-anchored CTA pattern = ~3/4 (roughly flat vs v0.6.11's ~3.5/4). Gemini Pro and Opus use the canonical "`fill: true` on the content section" form; Gemini Flash and GPT 5.3 use an empty `layout vertical, fill: true` as a spacer before the button. Both forms work. The spec teaches the first, but models continue to reach for the empty-spacer shortcut at roughly the same rate.

No regressions on any v0.6.x addition. This is the first v0.x → v0.(x+1) transition where the new feature landed *and* nothing prior slipped.

## New gap surfaced — first-class event handlers as component arguments

Two of four models (Gemini Flash and GPT 5.3) invented syntax to pass event handlers as component arguments. Neither pattern is supported by the spec.

**Gemini Flash (GenderCard):**

```igni
component GenderCard(text, icon_name, is_selected, on_tap_handler):
  layout vertical, ..., on tap: on_tap_handler:
    ...

# Caller:
GenderCard "MALE", "male", gender is "MALE", on tap: gender = "MALE"
```

The caller passes three positional args and then `on tap: gender = "MALE"` as a component-invocation property. The component definition declares a fourth parameter `on_tap_handler` and tries to bind `on tap:` inside its layout to it. These two mechanisms don't connect — `on_tap_handler` would be undefined at runtime. The model conflated "components can have `on tap:` on their invocation" (legal per the spec) with "components can accept event handlers as named parameters" (not legal).

**GPT 5.3 (ValueStepper):**

```igni
ValueStepper "WEIGHT", weight,
  on decrease: weight = weight - 1,
  on increase: weight = weight + 1

component ValueStepper(title, value):
  ...
  button "-", shape: circle, on tap: body.decrease()
  button "+", shape: circle, on tap: body.increase()
```

Two inventions in one. First, `on decrease:` and `on increase:` as named event types — the spec has only `on tap`, `on touch`, `on change`. Second, `body.decrease()` / `body.increase()` — `body` is a wrapper content slot, not a namespace for caller-provided handlers. GPT 5.3 independently invented a full event-handler-passing protocol.

Gemini Pro and Opus 4.6 avoided the problem by having the component call a screen-level function by name, dispatching on a string key (`adjust(title, -1)`, `increment("weight")`). This is the spec-legal pattern and it works, but it's clearly verbose — two separate functions plus string-key dispatch just to reuse a +/- stepper for two variables.

**Interpretation:** 2/4 models reaching for the same missing feature is a strong gap signal. The underlying need is reusable input components that drive parent state — the same shape as React's `onValueChange` callbacks or Flutter's `ValueSetter`. Igni currently forces a string-key workaround, and frontier models notice the friction enough to invent syntax around it. This should feed v0.8 design work.

This is **the new strongest unresolved signal for v0.8**, taking the slot that colour-as-variable held through v0.6.x.

## Per-model architecture notes

### Gemini 3 Flash

Cleanest use of v0.7 patterns on both the Results screen (`status_color`) and the GenderCard (`bg = ...`). Also reached for the wrapper-component pattern (`body` slot) on `StepperSection`, which is legal and is the only model to use it on this app. But invented `on_tap_handler` as a first-class event handler argument on GenderCard — see gap above. Uses `red` instead of `danger` for underweight (legal but non-canonical).

### Gemini 3.1 Pro

The most spec-idiomatic output of the four. Uses `bg = card` / `if selected: bg = brand` verbatim from the spec example. Uses `category_color = green` / conditional-override verbatim. Uses the canonical `fill: true`-on-content-section bottom-anchor pattern. Bundles input screen state into a `payload` object for navigation, which is legal but slightly indirect. Zero inventions.

### ChatGPT 5.3

Got the styling-tokens feature right (`status_color`, `bg`) but invented the strongest gap of the round — a full event-handler-passing protocol via `on decrease:` / `body.decrease()`. Also contains an apparent typo `largackground:` on the Results layout line (likely a copy-paste artifact), which would fail to parse. Falls back to an empty `layout vertical, fill: true` spacer for bottom anchoring. The model knows v0.7 landed but stretched past the spec into territory that doesn't exist.

### Claude Opus 4.6

Clean v0.7 usage throughout. Uses the canonical bottom-anchor pattern and string-key dispatch (`increment(key)` / `decrement(key)`) for the Stepper — the spec-legal alternative to the inventions above. Zero inventions. Arguably the most conservative of the four outputs; explicitly notes in its own commentary that the string-key pattern is verbose but unambiguous.

## Two-stage validation status

**Stage 1 (spec-level grading):** 4/4 produced legal-looking Igni for the v0.7 feature under test. 2/4 included inventions around event-handler passing. The ChatGPT typo `largackground:` would also be a parse error.

**Stage 2 (transpiler validation):** not yet run. To complete the cycle, the four outputs should be saved as `.igni` files and transpiled. Predicted outcomes:

- Gemini Pro, Opus 4.6: expected zero-fix transpile.
- Gemini Flash: will transpile only if `on_tap_handler` is silently ignored; otherwise error.
- GPT 5.3: will fail to transpile on either the typo or the invented `on decrease:` handler.

Transpiler results should be recorded below once run.

## Verdict

v0.7.0 landed the styling-tokens-as-values feature cleanly. The single design goal of the version — make `status_color = green` and `bg = card` legal patterns that models naturally reach for — was met by all four frontier models on the first try, against the identical prompt that drove 0/4 adoption on v0.6.11.

No regressions on prior additions. One new gap surfaced (first-class event handlers as component arguments) at 2/4 strength — strong enough to log as the top candidate for v0.8 design work, weak enough that it doesn't block shipping v0.7.0.

v0.7.0 is ready to ship as the canonical spec.

## Next steps

1. Run the four outputs through the transpiler; record stage-2 results.
2. Run the **Alert Dashboard** prompt (tests/v0.7.0/prompts.md #2) against the same four models — directly probes the function-returns-colour and component-takes-colour-arg patterns. Results feed directly into whether the v0.7 architecture-flow examples in the spec are sufficient, or whether they need more prominence.
3. If the Alert Dashboard run also passes 4/4, freeze v0.7.0 and begin v0.8 design work — with first-class event handlers in components as the lead candidate, driven by the 2/4 invention signal above.

---

## Retrospective: gap closed empirically at v0.16 (2026-04-27)

**Status of the "first-class event handlers as component args" gap (2/4 invention signal at v0.7.0): closed.**

v0.16.0 shipped `emit <name> <payload>` + `on <name>(arg):` event-payload binding (canonical example at `spec/v0.16.0.md` L1038–1089). Hand-translation of the BMI Calculator into `transpiler/examples/bmi/app.igni` (~70 lines) directly tests whether the design response actually delivers the shape the v0.7 panel reached for.

**Result.** The exact reusable +/- stepper that GPT 5.3 invented `on decrease:` / `body.decrease()` for, and that Gemini Pro / Opus 4.6 worked around with string-key dispatch, is now expressible directly:

```igni
component ValueCard(label_text, value):
  layout vertical, fill: true, padding: medium, background: card, rounded: medium, align: center, gap: small:
    label label_text
    label value, style: heading
    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: emit step (-1)
      button "+", shape: circle, color: subtle, on tap: emit step 1

# at the call site:
ValueCard "WEIGHT", shared.weight, on step(d): shared.weight = shared.weight + d
ValueCard "AGE", shared.age, on step(d): shared.age = shared.age + d
```

Codegen produces clean Dart: `final void Function(dynamic)? onStep` field on the `ValueCard` widget, `onStep?.call(-1)` and `onStep?.call(1)` on the two button presses. No string-key dispatch, no two-function ceremony, no inventions needed. The v0.7-era convergent need is now spec-supported with one canonical syntax.

**Friction tax surfaced, not predicted.** `emit step -1` (bare negative-int payload) fails parsing — the workaround is `emit step (-1)` with parens grouping. Bare unary-minus literals work fine in `temperature = -5` and `[-3, -2, -1, 0]`, but the `emit <name> <expr>` grammar trips on the `-`. Frontier models in 2026-04 are likely to write the bare form first and need one fix-it nudge or a cookbook entry to land. Logged in `docs/private/trap-journal.md` as a v0.27+ candidate (parser widen unary-minus to accept the same shape as list-literal acceptance).

**Bigger trap surfaced at browser-test time.** Igni source `shared.weight = shared.weight + d` parsed cleanly, generated Dart, and passed `flutter analyze --no-pub` (the smoke harness). But `flutter run` — only invoked when Tyr ran `igni run` — failed with `A value of type 'num' can't be assigned to a variable of type 'int'`. Root cause: emit-payload params are typed `void Function(dynamic)?` at the closure boundary, so `int + dynamic → num` and Dart's strict assignment rejects `int = num`. Same shape as the v0.14.3 `format_time` int-divide trap; the v0.16.0 fixtures only used String/object payloads, so the int-delta shape — arguably the canonical use case for the new feature — was unexercised across 12 transpile-clean test cases and 12 strong-pass Stage 3 panel cases. **Same-session fix shipped:** `codegen.ts` now tracks `dynamicParamsInScope` and post-wraps `int_field = ...` RHS with `(...).toInt()` when the RHS references an in-scope payload param. New fixture `transpiler/examples/on-handler-int-payload.igni` covers the canonical Stepper shape; BMI's regenerated `app.expected.dart` reflects the wrap.

**Methodology lift.** This now generalises to a 2-of-2 pattern: v0.13.1 pomodonut and v0.16 BMI both surfaced canonical-shape bugs that all of (npm test diff, smoke harness `flutter analyze`, the per-version Stage 3 panel) missed, only catchable by `flutter run` on a real-app translation. Per-version "first real-app translation" gate is now load-bearing for ship-readiness; a feature passing Stage 3 panels and 12 fixture cases is not the same thing as a feature that survives first contact with a non-trivial app.

**Methodology note.** A panel's *unresolved* signal — the thing the spec was *trying* to make expressible — is the most useful retrospective handle two cycles later. The v0.7.0 row "first-class event handlers" was a single sentence in the panel verdict; following it through to v0.16 hand-translation produced empirical confirmation of design follow-through that no number of subsequent panel runs would have produced (panels probe forward, not back). For dissertation methodology: when a gap is logged with this much specificity, schedule a retrospective the moment the design response ships.

Companion artefacts: `transpiler/examples/bmi/app.igni` (the hand-translation), `transpiler/examples/bmi/app.expected.dart` (golden fixture committed alongside), trap-journal entries dated 2026-04-27.
