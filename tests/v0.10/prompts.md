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

---

## 2. Shopping (post-ship v0.10 `{target with ...}` adoption)

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have two screens: a product list showing each product's name and price, and a cart screen. Tapping a product adds it to the cart. If the product is already in the cart, its quantity increases by one instead of adding a duplicate row. The cart screen shows items with their name, price, quantity, and a "Remove" button per item. Show a total price at the bottom. Use shared state for the cart.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What to grade:**

- **v0.10 adoption (headline metric).** Did the model use `{target with ...}` for the quantity-increment case (the canonical one-field update on an existing object)? Score ✓ if the model writes `{existing with quantity: existing.quantity + 1}`; ✗ if it falls back to the verbose `{id: existing.id, name: existing.name, ...}` field enumeration. Target: 3-4/4 adoption.
- **Transpile pass.** Auto-graded by the runner. Three frontier models should produce code that transpiles on first attempt.
- **Shared-state usage.** `shared:` block for the cart, `shared.cart = ...` for the mutation, `shared.` prefix at read sites.
- **Identity vs predicate lookup.** `find(cart, item => item.id is product.id)` for the "already in cart?" check — identity match doesn't work across `navigate` transitions since the product is a new object each time.
- **Design drift.** Any invented syntax? Any regression compared to the v0.6.1 Shopping round (dashboard spec example that already tested this prompt shape)?

**Success bar:** at least 3/4 frontier models use `{target with ...}` unprompted for the quantity-increment. The verbose form is still legal but the cheatsheet's prominent example points at the `with` shape first — if the cheatsheet teaches the rule, adoption should be high.

**Context tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`). Tightest teaching surface; if condensed spec is sufficient, that's the strongest validation of the v0.10 design.
