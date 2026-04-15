# Habit Tracker Cold Test Results — v0.8.1 (Phase 1 baseline)

**Date:** 2026-04-15
**Models tested:** Claude Opus 4.6 (+10k extended thinking), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.8.0-cheatsheet.md` + v0.8.1 Habit Tracker prompt
**Runner:** `tests/runner/run.ts` — first automated API-based cold test round, auto-graded via transpiler.
**Scope:** single-spec baseline. The framing-comparison version of this round (v0.8.0 vs v0.8.1) slots in once `spec/v0.8.1.md` ships; this file establishes the v0.8.0 column for that eventual comparison.

## Purpose — reusable components + component-to-parent event flow under v0.8.0 `emit`

v0.8.0 introduced `emit <event>` inside components with `on <event>:` wiring at the call site, specifically to remove the string-key dispatch workaround that the v0.7.0 BMI round surfaced as the top v0.8 design question. The Habit Tracker app is the first round-trip test of that feature: every intuitive design produces a reusable `HabitRow` component that needs to mutate parent state on check-in, which is exactly what `emit` was built for.

**The hypothesis:** models using the v0.8.0 cheatsheet will reach for `emit <event>` as the natural way to expose the row's completion toggle to the parent screen. If `emit` is learnable, 2–3/4 should produce an `on <event>:` handler at the call site. Other v0.8.0 patterns under indirect observation: `replace()` for toggling the habit in the list (immutable elements rule), `filter()` + `length()` for the summary count, `fill: true` for bottom-anchored input.

## Headline result — `emit` adopted by frontier models, blocked by transpiler on event-name collision

| Axis | Opus 4.6 +think | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Reuses `HabitRow` component** | ✓ | ✓ | ✓ | attempted | 3/4 |
| **Uses `emit <event>` + `on <event>:`** | ✓ `emit toggle` | ✗ (`bind:` on arg) | ✓ `emit toggle` | ✗ (invented `action`, `render:`) | **2/4** |
| **Immutable list via `replace()`** | ✓ | ~ (used `bind:` — violates arg immutability) | ✓ | ✗ (mutated in place, `!habit.completed`) | 2/4 |
| **Summary via `length(filter(...))`** | ✓ | ✓ | ✓ | attempted | 3/4 |
| **`fill: true` bottom-anchor** | ✓ | ✓ | ✓ | ✗ | 3/4 |
| **Empty state with icon + friendly label** | ✓ | ✓ | ✓ | attempted | 3/4 |
| **Transpile passes** | ✗ `emit toggle` gap | ✗ component local | ✗ `emit toggle` gap | ✗ JS drift | **0/4** |

## Per-hypothesis analysis

### 1. `emit` feature landed cleanly on 2/4 frontier outputs

Claude Opus 4.6 and Gemini 3 Flash independently converged on the same construction:

```igni
# Opus — emit from the button inside HabitRow
button "✓", shape: circle, color: green, on tap: emit toggle
# …
HabitRow habit, on toggle: toggle_habit(habit)
```

```igni
# Gemini 3 Flash — emit from the checkbox's on change
checkbox bind: item.done, on change: emit toggle
# …
HabitRow h, on toggle: toggle_habit(h)
```

Both picked **`toggle`** as the natural identifier for "this row's completion state changed." Neither used a string key, neither passed a function argument. Both referenced the underlying spec rule correctly in their design-decisions commentary — Opus explicitly notes *"Component arguments are immutable in Igni, so `toggle bind: habit.done` inside `HabitRow` would be illegal. Instead, the circle button emits a `toggle` event and the parent screen owns the state mutation — clean unidirectional data flow."* Gemini 3 echoes *"keeps the component 'dumb' and reusable, delegating the complex logic of incrementing streaks and updating the list to the main screen."*

**This is the cleanest v0.8.0 feature-landing signal so far.** The underlying need that v0.7.0 surfaced (2/4 inventing `on_tap_handler` / `on decrease:` as component arguments) is now the pattern frontier models reach for by name.

### 2. Transpiler rejects `emit toggle` — spec-vs-transpiler disagreement

Both v0.8.0-legal outputs fail transpile with essentially the same error:

```
Error: Expected event name after "emit", got "toggle"
```

Per the v0.8.0 spec, reserved event names are `tap`, `change`, `touch` — a three-name reserved list. `toggle` is not on it and should be a legal custom event name. The transpiler is stricter than the spec: it additionally rejects *any identifier that matches a built-in primitive name* (`toggle` is also the primitive for a toggle switch). This wasn't a documented constraint of v0.8.0.

**This is the strongest unresolved signal of the round — a genuine transpiler bug or an undocumented spec rule.** Two of the four frontier models independently chose the same identifier, which is exactly the methodology's convergence-as-signal criterion. Fix options:

- **Transpiler fix (preferred):** allow primitive-shadowing event names. `emit toggle` parses; the parent's `on toggle:` handler just works because event-names and primitive-names live in different namespaces.
- **Spec tightening:** document that custom event names must not collide with built-in primitive names. Would force frontier models to invent a non-primitive name, which may defeat the point of the feature.

Prefer option 1. The transpiler is the implementation, the spec is the source of truth, and the spec doesn't say primitive names are reserved.

### 3. GPT-5.4 sidestepped `emit` entirely — different but also broken

GPT-5.4 wrote `checkbox bind: habit.done` inside `HabitRow(habit)`, trying to two-way-bind a component argument. This compiles *intent* but silently violates the spec's immutable-args rule. The transpiler actually tripped earlier on a different line:

```
Error: Unexpected token "streak_text" — expected a UI element

    2 |   streak_text = "Streak: " + habit.streak
      |              ^
```

GPT-5.4 declared a derived local at the top of the component body. The transpiler's parser expects only UI primitives inside a component body, not variable declarations.

Two distinct issues with the same output:

- **Semantic bug (spec):** `bind:` on an immutable arg. No feedback path — the `checkbox` would be visually interactive but the state wouldn't propagate.
- **Syntax bug (transpiler):** component-body locals rejected. The spec doesn't explicitly forbid them. **Second potential transpiler-vs-spec gap of the round.** See "New gap" below.

### 4. Gemma 4 E4B — floor behaviour, JS syntactic drift

Gemma produced a structurally plausible but syntactically broken output. It crashed into JS/DSL-hybrid patterns:

- `habit.completed = !habit.completed` — JS-style negation, mutates a list-element property in place (violates immutability rule), uses `!` (Igni uses `not`)
- `action toggleHabitCompletion(id) { ... }` — invented `action` keyword (Igni has no such keyword)
- `render: { ... }` — invented `render:` block (Igni doesn't have one; screen bodies are direct)
- Duplicate `layout:` lines hallucinated mid-output — visible context-window / attention degradation beyond ~1500 output tokens
- `for (var habit in shared.habits)` — JS for-loop (Igni uses `each item in items:`)

This is the expected floor signal: a 4B-parameter model on a cheatsheet-tier spec loses coherence after ~1500 tokens and defaults to JavaScript-shaped pseudocode when it can't hold the language model for Igni.

## New gap: component-body derived locals

Separately from the `emit toggle` finding, GPT-5.4's derived-local pattern surfaces a second question: **should Igni allow variable declarations inside a component body?** The spec is silent on this — it shows components with only primitives in their bodies, but doesn't explicitly forbid a local assignment like `streak_text = "Streak: " + habit.streak` or `display_name = upper(habit.name)` for a derived value.

Arguments for allowing it:
- Screens already allow derived locals (`completed = filter(habits, h => h.done)` is canonical).
- Without it, the alternative is inlining the expression at every use site, which hurts readability.

Arguments against:
- Components are meant to be pure-render functions parameterised by args. Local state breaks the mental model.
- There's a workaround: compute the derived value in the parent screen, pass it as an additional arg.

**Not a blocker for v0.8.1 but worth documenting.** Candidate for a v0.8.2 spec clarification — either explicitly permit component-body derived locals (matching screens), or explicitly forbid them and update the cheatsheet to show the workaround.

## Per-model architecture notes

### Claude Opus 4.6 (+10k extended thinking)

Most idiomatic output of the round. Uses `emit toggle`, `replace()`, `filter()`/`length()`, `fill: true`, and deliberately extracts a `StatCard` component to avoid the 4-level nesting cap (*explicitly citing that spec rule* in the design-decisions commentary). Reads like hand-written Igni by someone who's internalised v0.8.0. Blocked only by the transpiler on `emit toggle`.

**Runtime:** 99s, 5845 output tokens. Most of the 10k thinking budget was spent on the 5-paragraph design-decisions preamble, not on code correctness — evidence that the 10k→5k cost optimisation for regression runs is safe (see `tests/runner/README.md` for the updated recommendation).

### GPT-5.4

Produced a clean-looking Habit Tracker that sidesteps the `emit` pattern and hits two different transpiler/spec bugs instead: component-body derived locals (syntax bug) and `bind:` on an immutable arg (semantic bug). No explicit feedback loop from row to parent — the app as written is non-functional, but the bugs are structural rather than inventive. Notably did *not* invent new keywords or braces; stayed within Igni's vocabulary.

**Runtime:** 9s, 572 output tokens. No thinking; straight completion.

### Gemini 3 Flash (preview)

Second output to use `emit toggle` — converges with Opus. Places it on `on change: emit toggle` attached to a `checkbox`, which is a more natural wire-up than Opus's approach (two buttons with toggle inside their `on tap:`). Uses `not target.done`, `replace(habits, target, updated)`, correct v0.8.0-idiomatic bracket-free style throughout. Writes a fresh object with `{name: ..., streak: ..., done: ...}` for the replace call. Minor quibble: `if habit_name is not "":` instead of the spec-preferred `is not empty` — both work.

**Runtime:** 5s, 819 output tokens. Thinking disabled (Gemini default-on thinking forced to 0 for parity); raw completion.

### Gemma 4 E4B (local, 9.6 GB model)

Floor case. Degrades from plausible-looking Igni in the first 50 lines to repeating hallucinated `layout: row, spacing: 16` loops, then drifts into a full JavaScript-shaped component at ~line 65 with `{ }` braces, `var`, `action`, `render:`, `!`, and `for (var habit in ...)`. Valuable as a baseline: shows what a 4B local model produces against the cheatsheet — clearly not production-usable, but structurally recognisable.

**Runtime:** 99s, 1605 output tokens. Local inference; no API cost.

## Transpiler validation

Auto-graded for all four outputs via `tests/runner/grade.ts` (pipes first fenced block through `transpiler/src/cli.ts`). Results stored in `transpile.passed` / `transpile.error` on each `.json` sidecar.

| Model | Pass | Line count | Error |
|---|---|---|---|
| Opus 4.6 | ✗ | 63 | `emit toggle` — transpiler gap |
| GPT-5.4 | ✗ | 44 | component-body local declaration |
| Gemini 3 Flash | ✗ | 60 | `emit toggle` — transpiler gap |
| Gemma 4 E4B | ✗ | 98 | `!` (invented JS negation) |

**Raw pass rate: 0/4.** But the two Opus/Gemini failures are on code that is spec-legal — fixing the transpiler gap (primitive-name shadowing for event names) would flip this to **2/4**. That's a materially different headline for the round.

## Verdict

v0.8.0's `emit` feature landed on two of four frontier models — **the single clearest convergence signal of the round.** Without any prompt steering, Opus and Gemini 3 Flash independently chose the same identifier (`toggle`) for the same event on the same app. This closes the v0.7.0-identified "event handlers as component arguments" gap, which was the leading unresolved signal of v0.7.

The 0/4 transpile rate is misleading. Both v0.8.0-legal outputs fail on a single undocumented transpiler behaviour (rejecting event names that shadow primitives), which the spec doesn't mandate. Fix that one bug and the round is 2/4 pass, with Opus and Gemini producing hand-writable-quality Igni.

Secondary findings:
- **Component-body derived locals** — GPT-5.4's `streak_text = ...` pattern is a second potential spec-vs-transpiler gap worth clarifying in v0.8.2.
- **Gemma at the floor** produces JS-shaped pseudocode after ~1500 tokens. Useful reference for calibrating later regression runs against a known weak model.

## Relation to the v0.8.1 framing comparison

The original plan for this file was a v0.8.0 vs v0.8.1 direct framing comparison (docs-only cleanup in the spec opening). That comparison is still the intended next step, and the Phase 1 data above populates the v0.8.0 column for it. When `spec/v0.8.1.md` ships, re-run these four models against the same prompt with the new spec and diff the JSON sidecars — the delta is the framing-cleanup effect, cleanly separated from model-capability effects.

## Next steps

1. **Decide the `emit toggle` resolution:** transpiler fix (preferred) vs spec tightening. If transpiler fix, write a minimal reproducer and add to `transpiler/examples/`.
2. **Decide the component-body-locals question:** document spec intent either way.
3. **Cross-reference against `Spec_Comprehension.md`** — which models *said* `emit` was the pattern for cross-component state? This closes the loop on "do they understand the feature, and do they use it?"
4. **v0.8.2 candidate list** coming out of this round: primitive-name event shadowing (transpiler fix), component-body derived locals (spec clarification). Both are transpiler-or-docs fixes, not new language features. Consistent with the v0.8.0 design budget.
5. **Ship `spec/v0.8.1.md`** and re-run this round for the framing-comparison delta.
