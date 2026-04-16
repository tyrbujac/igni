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
| **Transpile passes** | ✓ (after 3 fixes) | ✗ `bind:` on arg field | ✗ `bind:` on arg field | ✗ JS drift | **1/4** |

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

### 2. ~~Transpiler rejects `emit toggle`~~ — FIXED

~~Both v0.8.0-legal outputs failed transpile because the transpiler rejected event names that shadow built-in primitive names (`toggle` is also the name of the toggle UI primitive).~~

**Fixed in `aef283e`** — the transpiler now allows primitive-name shadowing for custom event names. `emit toggle` parses correctly; event names and primitive names live in different namespaces. The spec was already correct (only `tap`, `change`, `touch` are reserved). After this fix, Opus's output transpiles cleanly.

### 3. GPT-5.4 and Gemini Flash — `bind:` on immutable component args

Both GPT-5.4 and Gemini Flash wrote `checkbox bind: habit.done` (or `item.done`) inside a component, trying to two-way-bind a component argument field. This violates two rules:

- **Immutable args rule:** component arguments can't be mutated. `bind:` creates two-way binding, which requires mutation.
- **`bind:` syntax:** the transpiler requires `bind:` values to be simple variable names, not field access expressions.

~~GPT-5.4 also hit the component-body derived locals gap (`streak_text = ...`).~~ **Fixed in `f3dfb0f`** — component bodies now allow variable declarations. After that fix, GPT-5.4's output advances past the derived-local blocker but still fails on `checkbox bind: habit.done`.

The error message was improved in `09ce22b`: previously "checkbox requires bind:" (misleading — bind: IS present), now "checkbox bind: must be a simple variable name, not a field access like obj.field."

**Contrast with Opus:** Opus correctly identified the immutability constraint and used `emit toggle` with conditional buttons instead. Its design-decisions commentary explicitly explains the reasoning: *"Component arguments are immutable in Igni, so `toggle bind: habit.done` inside `HabitRow` would be illegal."*

### 4. Gemma 4 E4B — floor behaviour, JS syntactic drift

Gemma produced a structurally plausible but syntactically broken output. It crashed into JS/DSL-hybrid patterns:

- `habit.completed = !habit.completed` — JS-style negation, mutates a list-element property in place (violates immutability rule), uses `!` (Igni uses `not`)
- `action toggleHabitCompletion(id) { ... }` — invented `action` keyword (Igni has no such keyword)
- `render: { ... }` — invented `render:` block (Igni doesn't have one; screen bodies are direct)
- Duplicate `layout:` lines hallucinated mid-output — visible context-window / attention degradation beyond ~1500 output tokens
- `for (var habit in shared.habits)` — JS for-loop (Igni uses `each item in items:`)

This is the expected floor signal: a 4B-parameter model on a cheatsheet-tier spec loses coherence after ~1500 tokens and defaults to JavaScript-shaped pseudocode when it can't hold the language model for Igni.

## ~~New gap: component-body derived locals~~ — FIXED

~~GPT-5.4's `streak_text = ...` pattern surfaced a question about whether component bodies should allow variable declarations.~~

**Fixed in `f3dfb0f`** — component bodies now allow derived local variables, matching screen bodies. Components are StatelessWidgets, so derived locals recompute on every rebuild — the correct semantics. Regression test: `transpiler/examples/component-derived-local.igni`.

**Also fixed in `6294b3a`** — conditional variable reassignment in component bodies (`bg = card; if selected: bg = brand`). The parser now allows `if` blocks with assignments inside components, and the codegen emits `var` instead of `final` for reassigned variables. Regression test: `transpiler/examples/component-conditional.igni`.

## Per-model architecture notes

### Claude Opus 4.6 (+10k extended thinking)

Most idiomatic output of the round. Uses `emit toggle`, `replace()`, `filter()`/`length()`, `fill: true`, and deliberately extracts a `StatCard` component to avoid the 4-level nesting cap (*explicitly citing that spec rule* in the design-decisions commentary). Reads like hand-written Igni by someone who's internalised v0.8.0. **Transpiles cleanly after the `emit toggle` fix** — the only passing output of the round.

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

| Model | Pass | Line count | Error | Fix status |
|---|---|---|---|---|
| Opus 4.6 | ✓ | 63 | — | Fixed: `emit toggle` (`aef283e`) |
| GPT-5.4 | ✗ | 44 | `checkbox bind: habit.done` — field access on immutable arg | Model error |
| Gemini 3 Flash | ✗ | 60 | `checkbox bind: item.done` — field access on immutable arg | Model error |
| Gemma 4 E4B | ✗ | 98 | `!` (invented JS negation) | Model error |

**Pass rate: 1/4** (up from 0/4 at initial grading). Three transpiler fixes landed between grading and regrade: `emit toggle` primitive-name shadowing (`aef283e`), component-body derived locals (`f3dfb0f`), and component-body conditional assignment (`6294b3a`). The remaining 3/4 failures are model errors, not transpiler gaps.

## Verdict

v0.8.0's `emit` feature landed on two of four frontier models — **the single clearest convergence signal of the round.** Without any prompt steering, Opus and Gemini 3 Flash independently chose the same identifier (`toggle`) for the same event on the same app. This closes the v0.7.0-identified "event handlers as component arguments" gap, which was the leading unresolved signal of v0.7.

**Pass rate: 1/4** after three transpiler fixes. Opus transpiles and runs cleanly. Gemini Flash also wrote spec-legal Igni but used `checkbox bind: item.done` on an immutable component arg — a model error that surfaces even after the transpiler fixes. GPT-5.4 hit the same `bind:` issue. Gemma produced JS-shaped pseudocode.

Key diagnostic: the remaining 2/4 frontier failures both stem from the same spec-learnability gap — **models don't reliably internalise the immutable-args rule** when it intersects with `bind:` on component arguments. Opus is the only model that explicitly worked around it (using conditional buttons + `emit` instead of `checkbox bind:`).

## Relation to the v0.8.1 framing comparison

The original plan for this file was a v0.8.0 vs v0.8.1 direct framing comparison (docs-only cleanup in the spec opening). That comparison is still the intended next step, and the Phase 1 data above populates the v0.8.0 column for it. When `spec/v0.8.1.md` ships, re-run these four models against the same prompt with the new spec and diff the JSON sidecars — the delta is the framing-cleanup effect, cleanly separated from model-capability effects.

## Next steps

1. ~~**Decide the `emit toggle` resolution.**~~ **Done** — transpiler fix shipped (`aef283e`).
2. ~~**Decide the component-body-locals question.**~~ **Done** — transpiler fix shipped (`f3dfb0f`), component-body conditional assignment also fixed (`6294b3a`).
3. **Cross-reference against `Spec_Comprehension.md`** — which models *said* `emit` was the pattern for cross-component state? This closes the loop on "do they understand the feature, and do they use it?"
4. **Spec-learnability question:** 2/4 frontier models failed to internalise the immutable-args rule when it intersects with `bind:`. Consider a spec/cheatsheet clarification or counterexample showing why `bind:` inside components on argument fields doesn't work.
5. **Ship `spec/v0.8.1.md`** and re-run this round for the framing-comparison delta.
