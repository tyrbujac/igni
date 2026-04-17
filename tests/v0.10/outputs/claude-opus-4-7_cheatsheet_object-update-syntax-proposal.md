# Object Spread via `...`

## 1. Proposed Syntax

Inside an object literal, `...expr` expands to all fields of `expr`. Later `key: value` pairs in the same literal override. Whitespace-agnostic; works on one line or across indented lines.

**Rewritten `toggle_done`:**

```igni
toggle_done(target):
  items = replace(items, target, {...target, done: not target.done})
```

**Rewritten `increment_quantity`:**

```igni
shared.cart = replace(shared.cart, existing, {...existing, quantity: existing.quantity + 1})
```

Or, when overrides pile up, the indented form:

```igni
shared.cart = replace(shared.cart, existing, {
  ...existing,
  quantity: existing.quantity + 1,
})
```

## 2. Why This Shape

I considered four alternatives before landing here:

- **A `with` keyword**: `target with {done: not target.done}`. Reads beautifully, but introduces a new infix operator and a second way to construct objects — Igni's "one way to do everything" rule pushes back hard. It also doesn't compose inside a literal that mixes spread with new fields.
- **A `merge(a, b)` builtin**: consistent with `replace`, `without`, `find`. But it forces a function call for what is structurally a literal-construction concern, and nested merges get ugly fast. It also reads as "combine two complete objects" rather than "start from this, tweak that."
- **Implicit carry-forward** (fields not mentioned are preserved): magical and collides with the current semantics where `{x: 1}` means an object with exactly one field. Breaks existing code.
- **`...target` spread inside `{}`**: reuses the existing object-literal delimiter, stays declarative (no verb), needs no new keyword, and the left-to-right "base then overrides" order matches how the spec already describes the idiom ("enumerate every field of target plus the change you actually care about"). The `...` token is unambiguous — it doesn't appear anywhere else in the grammar — and it slots cleanly into both the single-line and indented literal forms the spec already permits for `{...}`.

## 3. Concerns and Tightening Rules

- **Precedence with `.` access**: `...target.profile` must parse as `...(target.profile)`, not `(...target).profile`. Easy rule: `...` binds looser than field access, same as a unary prefix.
- **Override ordering**: the spec's "one way" principle means we should pick one rule and enforce it. Proposal: **later wins**, and spread must come before explicit overrides in the same literal. `{done: true, ...target}` is a parse error, not a silent "spread wins." This keeps the reading order ("start from target, then change these") aligned with evaluation order and avoids the JavaScript footgun where people forget which side wins.
- **Multiple spreads**: `{...a, ...b, x: 1}` is legal and follows the same later-wins rule. I'd allow it — disallowing it would require a special-case rule with no real benefit.
- **Spread of non-objects**: `...null`, `...a_list`, `...a_string` should all be transpile errors, not silent no-ops. The spec is strict about types elsewhere (no truthiness, explicit booleans); spread should match.
- **Collision with lists**: the spec doesn't currently have list spread. If `...` is introduced for objects, the obvious question is whether `[...items, new_item]` should also work as a synonym for `items + [new_item]`. I'd say **no** — `+` is already the documented append idiom, and adding list spread creates exactly the "two ways" the spec forbids. Restrict `...` to object literals only, and document that restriction.
- **Shared-state reactivity**: `shared.cart = replace(shared.cart, existing, {...existing, quantity: ...})` still reassigns `shared.cart`, so the reactivity model is unchanged. Worth calling out in docs because the spread makes the mutation look smaller than it is.