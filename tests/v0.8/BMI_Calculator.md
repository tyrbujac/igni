# BMI Calculator Cold Test Results — v0.8.0

**Date:** 2026-04-15
**Models tested:** Gemini 3 Flash, Gemini 3.1 Pro, ChatGPT 5.3, Claude Opus 4.6
**Input:** `v0.8.0.md` (full spec) + identical-to-v0.7.0 BMI prompt
**App:** BMI Calculator — Angela Yu Flutter Course #5

## Purpose — feature-landing test for component event channels

v0.8.0's single addition is component event channels: `emit <event>` inside a component, `on <event>:` at the call site. The direct question is whether the v0.7.0 BMI gap is now closed: can a reusable +/- stepper drive parent-scope state mutation without string-key dispatch or invented callback syntax?

The prompt is identical to the v0.7.0 BMI rerun. Same app, same four models. The spec is what changed.

## Headline result — Stepper signal closed cleanly

| Signal | Gemini Flash | Gemini Pro | GPT 5.3 | Opus 4.6 | v0.7.0 | v0.8.0 | Delta |
|---|---|---|---|---|---|---|---|
| **Stepper uses `emit` + `on <event>:`** | ✓ | ✓ | ✓ | ✓ | 0/4 emit | **4/4** | **+4** |
| **Gender card also uses event channels** | ~ (`emit tap`, invalid reserved name) | — | ✓ | — | 0/4 | **1/4 clean, 1/4 attempted** | partial |
| **No standalone `emit`** | ✓ | ✓ | ✓ | ✓ | — | **4/4** | clean |
| **No reserved-name collisions** | ✗ (`emit tap`) | ✓ | ✓ | ✓ | — | **3/4** | one miss |
| **`round(bmi, 1)` carry-over** | ✓ | ✓ | ✓ | ✓ | 4/4 | **4/4** | stable |
| **`shape: circle` carry-over** | ✓ | ✓ | ✓ | ✓ | 4/4 | **4/4** | stable |
| **Conditional styling variables (`status_color` / `bg`)** | ✓ | ✓ | ✓ | ✓ | 4/4 | **4/4** | stable |
| **Transpiler validation** | ✗ (`emit tap` reserved) | — | ✓ (GPT-5.4 rerun) | ✓ (Opus 4.6 rerun) | — | **2/3 pass** | — |

## Per-hypothesis analysis

### 1. Stepper event channels — 4/4 (feature landed)

All four models used the intended v0.8.0 shape for the reusable weight/age control:

- component emits named events from the +/- buttons
- parent attaches `on increment:` / `on decrement:` at the call site
- no model fell back to the old string-key dispatch workaround
- no model invented callback-parameter syntax like v0.7.0's `on_tap_handler` / `on decrease:`

This is the direct before/after win the version was meant to produce. On the canonical BMI stepper case, the feature landed cleanly.

### 2. Gender-card event adoption — mixed, but not the main test

The secondary question was whether models would generalise the same event-channel pattern to the MALE/FEMALE selection cards.

Results split three ways:

- **GPT 5.3:** clean generalisation. `GenderCard` emits `select`, parent listens with `on select:`
- **Gemini 3 Flash:** attempted the same idea, but used `emit tap`, which is invalid because `tap` is reserved
- **Gemini Pro / Opus 4.6:** stayed conservative and used `on tap:` directly at the component invocation site instead of custom event channels

Interpretation: models internalised the Stepper case strongly, but broader "all reusable interactive components should expose custom events" is only partially internalised. That's fine for the release goal — the BMI stepper was the real target — but it does suggest the spec example is landing more as a canonical pattern than a general "components can expose event APIs" principle.

### 3. No standalone `emit` — 4/4 clean

Zero models wrote body-level `emit X` outside an event handler. The rule "`emit` is only valid as the action of `on tap:` / `on touch:` / `on change:`" appears to have landed.

### 4. Reserved-name collisions — 1/4 miss

Gemini 3 Flash wrote:

```igni
layout vertical, ..., on tap: emit tap:
```

This is exactly the reserved-name collision the spec forbids. `tap`, `change`, and `touch` are built-in event names and cannot be used as custom component events.

This is the only direct v0.8.0 rule miss in the batch, and it is a good candidate for a small docs-sharpening pass or a more emphatic counterexample in the component-events section or cheatsheet.

### 5. v0.7.0 carry-overs — all stable

The previous version's signals held:

- `round(bmi, 1)` or equivalent rounded BMI display: 4/4
- `shape: circle` on +/- buttons: 4/4
- conditional styling-value assignment (`status_color = green`, `bg = card`, override in `if`): 4/4
- explicit named colors only (`black`, `brand`, `card`, `white`, `green`, `danger`, `orange`, `subtle`): 4/4

No evidence here that adding event channels destabilised the existing styling/value patterns.

## Per-model notes

### Gemini 3 Flash

Strong Stepper adoption: `Stepper "WEIGHT", weight, on increment: ... , on decrement: ...` with the component emitting `decrement` / `increment` from the circle buttons.

Main defect: the `GenderCard` attempts to expose a custom event using `emit tap`, which is invalid because `tap` is reserved. This is the clearest rule miss in the round.

Other notes:

- uses object-literal navigation to `Results {h: height, w: weight, g: gender}`
- uses `round(height, 0)` for the slider display, which is sensible presentation polish
- explanation explicitly references the `emit` bubbling model and the bottom-anchor pattern

### ChatGPT 5.3

Most aggressive event-channel adoption of the four. Uses custom events on both components:

- `NumberStepper` emits `increment` / `decrement`
- `GenderCard` emits `select`
- parent listens with `on increment:` / `on decrement:` / `on select:`

This is the strongest evidence of the feature being understood as a general reusable-component pattern rather than just "the Stepper example from the spec."

Other notes:

- clean use of conditional `bg = card` → `bg = brand`
- uses empty `layout vertical, fill: true:` spacer form for bottom anchoring
- overall shape is spec-idiomatic and much cleaner than GPT's v0.7.0 BMI invention round

### Gemini 3.1 Pro

Clean, conservative output. Uses the canonical Stepper event-channel pattern correctly, but does not generalise custom events to `GenderCard`; instead attaches `on tap:` directly at the call site.

Strengths:

- very spec-shaped layout and value-assignment patterns
- `status_color` conditional assignment is canonical
- bottom-anchored CTA pattern is present
- clean Stepper `emit decrement` / `emit increment`

Minor note:

- navigates to `Results {height: height, weight: weight}` and does not pass `gender`, despite the prompt requesting it. This is a prompt-completeness miss, not a v0.8.0 event-channel issue.

### Claude Opus 4.6

Also clean and conservative. Uses `emit decrement` / `emit increment` on the reusable `ValueAdjuster` component and attaches handlers at the parent call site. Like Gemini Pro, keeps `GenderCard` on plain invocation `on tap:` rather than custom event channels.

Strengths:

- strong Stepper adoption
- stable carry-over patterns (`round`, `shape: circle`, conditional colour variable)
- clear explanation that `emit` is the right tool when the parent needs to decide what to mutate

Small notes:

- the `Results` screen is structurally simpler than the others and does not recreate the card-heavy center panel as strongly
- commentary explicitly flags one assumption about how `fill: true` propagates through the component root, which is useful implementation-awareness rather than a syntax miss

## Two-stage validation status

**Stage 1 (spec-level grading):** clear pass on the main feature. The Stepper event-channel signal moved from 0/4 in v0.7.0 to 4/4 in v0.8.0. One reserved-name collision (`emit tap`) appears in Gemini Flash. No standalone `emit` misuse.

**Stage 2 (transpiler validation):** completed 2026-04-16 via automated runner rerun (Opus 4.6, GPT-5.4, Gemini 3 Flash — Gemini Pro not re-run, no API access via runner). **2/3 pass.** Opus 4.6 (70L) and GPT-5.4 (84L) transpile cleanly. Gemini Flash (73L) fails on `emit tap` — the reserved-name collision the spec grading already flagged. The failure is a spec-compliance error, not a transpiler gap. Transpiler fix required: conditional variable reassignment inside component `if` blocks (`bg = card; if selected: bg = brand`) was rejected by the parser; fixed in the same session (parser: allow `if` with `allowAssignments: true` in component bodies; codegen: emit `var` instead of `final` for reassigned locals, emit imperative `if` blocks before the return).

## Verdict

v0.8.0 landed the feature it was designed to land.

The canonical BMI stepper case is now clean across all four models: reusable component emits named events, parent mutates its own state via `on increment:` / `on decrement:`. That closes the 5/8 compounded v0.7.0 signal on "no clean way for a sub-element inside a reusable component to drive parent-scope state mutations."

The only meaningful residual issue in this batch is **reserved custom event names**, surfaced by Gemini 3 Flash's `emit tap`. That suggests a docs-sharpening opportunity, but not a feature failure.

Net: **feature validated.** This is not a cheatsheet-placement failure result. The main v0.8.0 structural signal is closed.

## Next steps

1. ~~Run stage-2 transpiler validation on all four outputs and record transpile / `dart analyze` results.~~ **Done** (2/3 pass; Gemini Pro not re-run).
2. Note reserved-name collisions (`tap`, `change`, `touch`) as the main follow-up docs issue from the batch.
3. Move to the `v0.8.0` vs `v0.8.1` framing comparison using the Habit Tracker prompt in `tests/v0.8.1/prompts.md`.
4. Regrade v0.8.1 Phase 1 Habit Tracker outputs with the component-conditional transpiler fix.
