# Igni Cold-LLM Test Prompts (v0.10 — object-update syntax validation)

Cold tests against v0.9.1. Paste the full spec/cheatsheet FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What this validates:** whether frontier models independently invent an object-update syntax that matches the v0.10 design note's recommended shape (`{target with field: newval}`) vs. alternatives (`{...target, field: newval}`, `update(target, ...)`, method-style). Same template as the v0.7.0 BMI rerun that validated `bg = card` assignability before the spec adopted it.

**Hypothesis under test:**

Given the canonical "update one field on an object in a list" idiom and its verbose field-enumeration form, what shape do frontier models reach for when asked to propose a more concise syntax? Design note (`docs/private/42_v10_object_update.md`) recommends `{target with field: newval}` on principle grounds; this test gauges whether that matches models' natural reach or whether the spread-based `{...target, ...}` wins organically.

**Prediction:** two plausible outcomes —

- **`with`-keyword cluster** (3-4/4 models): validates the design note's recommendation directly. Ship `{target with ...}`.
- **Spread cluster** (3-4/4 models): counter-signal. Reconsider `{...target, ...}` despite the principle-based rejection in the design note.
- **Mixed / no convergence** (split 2/2 or 4 different shapes): ship the design note's recommendation on principles; the cold test didn't produce a strong natural idiom.

**Panel:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama). Same panel as v0.9.0 / v0.9.1 Product Search. Run with `--no-grade` — this prompt asks for syntax proposals, not code that transpiles.

---

## 1. Object-update syntax proposal

> Using only the Igni language spec above, look at this function:
>
> ```igni
> toggle_done(target):
>   items = replace(items, target, {text: target.text, done: not target.done})
> ```
>
> And this one:
>
> ```igni
> increment_quantity(existing):
>   shared.cart = replace(shared.cart, existing, {id: existing.id, name: existing.name, price: existing.price, quantity: existing.quantity + 1})
> ```
>
> Both follow the canonical "update one field on an object in a list" idiom documented in the spec: `replace(list, target, new_object)` where `new_object` enumerates every field of `target` plus the change you actually care about.
>
> **Task:** propose a concise Igni syntax for building `new_object` that preserves all of `target`'s fields while overriding one or more. The goal is to eliminate the field-by-field enumeration while staying inside Igni's design principles (indentation over brackets, no method syntax, `{...}` for object literals, one way to do everything, `key: value` is reserved for object literals and component invocation arguments).
>
> Write:
>
> 1. The exact syntax you propose, used to rewrite both functions above.
> 2. A one-paragraph explanation of why you chose that shape over alternatives you considered.
> 3. Any concerns or ambiguities — places where the proposal might collide with existing syntax or would need a tightening rule.

**What to grade:**

- **Shape family.** Which cluster did the model reach for? Options observed across the literature and adjacent languages: (a) `with` keyword inside `{}`, (b) `...` spread inside `{}`, (c) new builtin (`update(target, field: val)`), (d) method-style (`target.update(...)`), (e) something unexpected.
- **Consistency with Igni principles.** Did the model reason about the principles in `CLAUDE.md`-style terms (no brackets, no method syntax, spec budget) or did it drop in a JS/TS idiom without reasoning?
- **Edge case coverage.** Did the model raise the `with`-as-field-name ambiguity, the shallow-vs-deep question, or the base-must-be-Ident concern? These are the real design decisions; a good proposal surfaces them.
- **Spec placement.** Did the model show where in the spec the new rule would live and what the existing "Replacing items" section (line 727–737) would need to say?
- **Design drift.** Any proposals that violate existing non-negotiables (method syntax, ternary-like operators, parens on component invocation, string interpolation)?

**Success bar:** at least 3/4 frontier models converge on a single shape family. The converged shape becomes the v0.10 proposal. If models split across multiple families, ship the design note's `with`-keyword recommendation on principles (rejecting the JS/TS spread import is already a principled stance, not a cold-test-contingent one).

**Context tier:** cheatsheet (`spec/v0.9.1-cheatsheet.md`). Condensed spec is the tightest teaching surface — if the cheatsheet's existing object-literal + `replace` rules are enough for the model to propose a coherent extension, the spec has succeeded at teaching its own shape.
