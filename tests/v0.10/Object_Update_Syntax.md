# Object-Update Syntax Cold Test — v0.10 pre-ship validation

**Date:** 2026-04-17
**Models tested:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.9.1-cheatsheet.md` + v0.10 object-update syntax prompt
**Runner:** `tests/runner/run.ts` with `--no-grade` (proposal task, not code-to-transpile)
**Scope:** single-prompt syntax-proposal round. Same template as the v0.7.0 cold test that validated `bg = card` assignability before the spec adopted it.

## Purpose — does a frontier-model panel converge on `{target with ...}`?

Design note (`docs/private/42_v10_object_update.md`) recommends `{target with field: newval}` for object-update syntax, choosing the `with`-keyword shape over spread-style `{...target, ...}`, `update()` builtin, and method-style `target.update(...)`. The recommendation is principle-driven: `with` reads as English, reuses existing object-literal construction rules, and avoids the JS/TS spread-operator import. But the design note flagged an explicit decision point: *"if 3-4 frontier models independently invent `{target with ...}`, that's the validation pattern that worked for v0.7.0 colour assignability. If models instead invent `{...target, ...}`, that's counter-signal."*

This is that test.

**Prediction:** three possible outcomes — `with` cluster wins (3-4/4), spread cluster wins (3-4/4), mixed with no convergence (ship design note on principles).

## Headline result — no convergence. Four models, four distinct shapes. `with`-family has weak plurality (2/4).

| Model | Proposed shape | Family |
|---|---|---|
| Claude Opus 4.7 | `{...target, key: val}` | spread |
| GPT-5.4 | `{target with key: val}` | with-in-braces (design-note match) |
| Gemini 3 Flash | `target with key: val` *(bare infix, no `{}`)* | with-as-operator |
| Gemma 4 E4B | `target { key: val }` | juxtaposition |

- **`with` keyword family: 2/4** (GPT brace-wrapped, Gemini bare infix). If brace-wrapping counts as a separate shape, the two models disagree; if we count the *keyword choice* alone, they agree.
- **Spread family: 1/4** (Opus only).
- **Juxtaposition: 1/4** (Gemma only, with drift into Python-ish output blocks).

No single shape crosses 3/4. The design note's "mixed / no convergence" branch fires, which means: ship the recommendation on principles, because the cold test didn't produce a dominant natural idiom.

## Per-model analysis

### Claude Opus 4.7 — picked spread, explicitly considered and rejected `with`

Opus landed on `{...target, done: not target.done}` and wrote the most thorough proposal (1334 output tokens, 26s). Notable because Opus explicitly *considered* the `with` shape and rejected it:

> A `with` keyword: `target with {done: not target.done}`. Reads beautifully, but introduces a new infix operator and a second way to construct objects — Igni's "one way to do everything" rule pushes back hard. It also doesn't compose inside a literal that mixes spread with new fields.

This reasoning assumes the language would *get both* shapes and would need to choose which takes precedence inside a mixed literal. That premise doesn't apply to a single-shape ship — if `{target with ...}` is the canonical update form and spread doesn't exist, the composition question is moot. But as a piece of internally coherent reasoning about "what if we adopted both", it's sharp.

Opus's concerns section was the best of the four: precedence with field access (`...target.profile` must parse as `...(target.profile)`), override ordering (proposes spread-first-then-explicit, with `{done: true, ...target}` as a parse error to avoid JS's "which side wins" footgun), multiple spreads, spread of non-objects (proposes transpile error), collision with lists (proposes *not* extending spread to `[...items, new_item]` because `+` is already the append idiom — would create "two ways"), shared-state reactivity. Every concern is real; Opus surfaced the whole design surface.

**If the spread shape is reconsidered, Opus's proposal is the shipping document.**

### GPT-5.4 — picked `{target with ...}`, matched the design note exactly

GPT wrote the shortest, most direct proposal (445 output tokens, 11s). Output was structurally identical to the design note's recommended shape:

```igni
items = replace(items, target, {target with done: not target.done})
shared.cart = replace(shared.cart, existing, {existing with quantity: existing.quantity + 1})
updated = {item with name: "New", done: true}
```

Concerns raised match the design note:
- Should define whether zero overrides are allowed (`{target with}` probably rejected)
- Duplicate override behaviour should be compile error ("preserve 'one way to do everything'")
- Left side should be restricted to a simple object expression, not arbitrary expressions

GPT's rationale explicitly cites the Igni principles the design note reasoned from:
> I'd use `{object with ...}` because it keeps the result clearly in "object literal territory" while adding the minimum new idea [...] avoids method syntax or function-call syntax like `copy(...)` / `merge(...)`, which would push Igni toward more general programming-language patterns instead of UI-spec simplicity.

Strongest single-model validation of the design note's recommendation.

### Gemini 3 Flash — picked `with` keyword, but dropped the braces

Gemini's shape: `target with key: val` — a **bare infix expression**, not wrapped in `{}`:

```igni
items = replace(items, target, target with done: not target.done)
shared.cart = replace(shared.cart, existing, existing with quantity: existing.quantity + 1)
item = item with price: 10.0, active: true
```

This is shorter than GPT's shape and reads more like English. Gemini's rationale: *"reads like a natural language instruction rather than a mathematical operation (like `{...target}`). It avoids adding new bracket-based syntax."*

The concern Gemini raised is the main reason the design note chose braces: *"Reserved Keyword: `with` would need to be added to the reserved keyword list, potentially breaking existing code if developers used `with` as a variable name (e.g., `layout horizontal, with: 100`)."*

**If `with` is adopted, braces vs bare-infix is a real design decision.** The design note argued for braces on "keep object construction scoped inside `{}`" grounds. Gemini's argument for bare-infix is pure brevity + readability. A split exists; the design note should address it before spec language lands.

### Gemma 4 E4B — picked `target { key: val }` (juxtaposition form), drifted into Python

Gemma proposed `target { active: not target.active }` — no keyword, no spread operator, just the object name followed by an override-brace block. The syntax kernel is novel but the surrounding output drifted into Python (`def toggle_state(target):`, `target.get('active', False)`, `#` comments). Same methodology-floor pattern as prior rounds.

Even ignoring the Python drift, the juxtaposition shape has real problems: `target { ... }` looks exactly like a component invocation (`MyComponent prop: value`) except with `{}` instead of arguments. Would collide with the component-invocation reading rule in non-obvious ways.

Informative as methodology floor; not a serious contender.

## Interpretation

**The design note's pre-commit success bar ("3-4/4 converge on one shape") was not met.** What was met: two of three frontier models reached for `with` (in different wrappings), which is a weak plurality and stronger than any other family.

**The design note's fallback rule applies:** ship the principle-driven recommendation. That recommendation is `{target with field: newval}`.

**One real follow-up from this round:** Gemini's bare-infix variant (`target with key: val`) vs GPT's brace-wrapped variant (`{target with key: val}`) is a live design question that the design note should resolve explicitly. Arguments:

- **Brace-wrapped (design note's choice):** scopes `with` to object-construction context. Reader sees `{` and knows "this is an object expression". Parse rule is simple: inside `{`, after Ident, check for `with`.
- **Bare infix (Gemini's choice):** shorter, reads more like English. Matches how `is`/`and`/`or` already work as bare infix keywords. No braces needed when the update is used directly as an expression.

The design note's preferred resolution should be: **brace-wrapped**, for the consistency argument — `{...}` is already the object-construction delimiter in every other context (literal, value return, function argument). Introducing a *third* way to write an object expression (bare-infix result that isn't inside braces) collides with the "one way" principle. Gemini's form is slightly shorter but introduces a subtly bigger rule: "`with` produces an object, evaluated anywhere."

Noting for the v0.10 spec work: the brace decision needs one sentence of explicit justification in the spec's "Mutations" section ("`{target with ...}` stays inside object-literal braces so object construction has one visible delimiter everywhere").

**Opus's spread proposal deserves a shipping document even if not shipped.** The concerns section is the best of the four and would be valuable if the design conversation ever reopens on spread — for example, if a future cold test shows 3/4 models reaching for spread. That's not this round, but the artifact is useful to keep.

## Transpiler validation

N/A — `--no-grade` used. Proposals aren't code, no transpile attempt. The runner auto-grade was correctly skipped.

## Verdict

**Ship `{target with field: newval}` as the v0.10 shape, per the design note.** Cold test didn't produce strong convergence (success bar not met), but the `with`-keyword family has the strongest representation (2/3 frontier) and the design note's principle-based reasoning stands independent of cold-test outcome. Spread shape has a coherent argument from Opus but no other model reached for it, and the "JS/TS import" objection holds.

**Proceed with v0.10.0 spec work as the design note described** — Ident-only base, global `with` reservation, one language feature per release. Add one sentence to the spec justifying brace-wrapped over bare-infix (driven by Gemini's counter-proposal).

## Next steps

1. **Fork `spec/v0.9.1.md` → `spec/v0.10.0.md`.** Add object-update syntax to the "Mutations" section, including the brace-vs-infix justification sentence. Same pattern as v0.9.0 fork.
2. **Cheatsheet + micro ref update.** Both need the new syntax; micro hasn't changed since v0.8.0 and v0.10 is the first syntactic addition since then.
3. **Transpiler implementation.** Parser change (peek after `{` for Ident-then-`with`), lexer keyword addition (`with`), codegen emits Dart `{...target, 'key': v}` map spread. New AST node `ObjectUpdate`.
4. **Test coverage.** Positive examples (`object-update.igni`), negative examples (`object-update-non-ident-base.igni`, `object-update-with-as-key.igni`). Update existing `contacts.igni`, `shopping.igni` to use the new shape.
5. **Validation rerun.** Once shipped, re-run a mutation-heavy app (Notes, Contacts, or Shopping) on v0.10.0-cheatsheet and check adoption rate. Prediction: 3-4/4 frontier models use the new shape unprompted.

## Artifact notes

- Four `.md` + `.json` outputs under `tests/v0.10/outputs/`.
- The first run batch (GPT, Gemini, Gemma) initially failed due to a cwd issue in the runner invocation (missing `cd` prefix); those outputs are re-runs of identical prompts, no semantic effect. Opus ran cleanly on first attempt.
