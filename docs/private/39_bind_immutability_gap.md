# bind: on immutable component args — spec-learnability gap

**Date:** 2026-04-16
**Status:** Finding documented. No spec change yet.
**Source:** v0.8.1 Habit Tracker cold test (Phase 1), v0.8 BMI transpiler validation session.

---

## The gap

2/4 frontier models (GPT-5.4, Gemini 3 Flash) wrote `checkbox bind: habit.done` inside a component body, where `habit` is a component argument. This violates two rules:

1. **Immutable args:** component arguments cannot be mutated. `bind:` creates two-way binding, which requires mutation.
2. **`bind:` syntax:** the transpiler requires `bind:` values to be simple variable names, not field access expressions like `obj.field`.

Opus is the only model that correctly identified the constraint and worked around it — using conditional buttons with `emit toggle` instead. Its design-decisions commentary explicitly explains: *"Component arguments are immutable in Igni, so `toggle bind: habit.done` inside `HabitRow` would be illegal."*

## Why models get this wrong

The spec documents both rules separately:
- Immutable args: "Arguments to screens and components are immutable."
- `bind:` semantics: shown only with simple variable names in examples.

But the spec never shows the **intersection** — what happens when you want a checkbox-like UI for an item field inside a reusable component. The natural instinct (bind to the field) is wrong, and the correct pattern (emit an event, let the parent mutate via `replace()`) is non-obvious.

## Evidence

| Model | Pattern | Result |
|---|---|---|
| Opus 4.6 | `button "checkmark", on tap: emit toggle` | Correct — transpiles |
| GPT-5.4 | `checkbox bind: habit.done` | Wrong — immutable arg |
| Gemini 3 Flash | `checkbox bind: item.done, on change: emit toggle` | Wrong — immutable arg (despite also using emit!) |
| Gemma 4 E4B | `habit.completed = !habit.completed` | Wrong — JS mutation syntax |

Gemini Flash is the most interesting case: it correctly uses `emit toggle` for the parent callback but *also* binds to the immutable arg field. It understood the event channel pattern but didn't realise `bind:` on an arg field is the thing that's illegal.

## Options

### A. Spec counterexample (low cost, high signal)

Add a "common pitfall" note in the Components section, similar to the existing fetch-URL-binding pitfall:

```
# Common pitfall — bind: inside components
# WRONG: component args are immutable, bind: can't mutate them
component HabitRow(habit):
  checkbox bind: habit.done    # error: can't mutate argument field

# RIGHT: emit an event, let the parent own the mutation
component HabitRow(habit):
  if habit.done:
    button "done", color: green, on tap: emit toggle
  else:
    button "todo", color: subtle, on tap: emit toggle
```

This is the same "show the wrong thing, then the right thing" pattern that worked for the fetch-URL pitfall (which went from a common model error to 4/4 correct after the pitfall note was added).

### B. Spec clarification on `bind:` scope

Add one sentence to the `bind:` documentation: "bind: only works with screen-level variables, not component argument fields."

### C. Do nothing (wait for more data)

2/4 is a signal but not overwhelming. The v0.9 object-update ergonomics work may change the patterns enough that this pitfall becomes less relevant.

## Recommendation

**Option A** — a counterexample in the Components section. It's the cheapest intervention with the strongest precedent (the fetch-URL pitfall). Can be added to v0.8.1 or v0.8.2 as a docs-only patch. If models still get it wrong after the counterexample, escalate to a spec clarification.

## Transpiler changes made

Three transpiler fixes landed during this investigation:

1. **`aef283e`** — allow primitive names as custom event identifiers (`emit toggle`)
2. **`f3dfb0f`** — allow derived-local variables in component bodies
3. **`6294b3a`** — allow conditional variable reassignment in component bodies (`bg = card; if selected: bg = brand`)
4. **`09ce22b`** — split `bind:` error messages: "missing bind:" vs "field access in bind:"

After all four fixes, the Habit Tracker pass rate is 1/4 (Opus). The remaining failures are model errors, not transpiler gaps.
