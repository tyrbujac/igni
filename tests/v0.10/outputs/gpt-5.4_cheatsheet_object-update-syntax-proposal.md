1. Proposed syntax

```igni
toggle_done(target):
  items = replace(items, target, {target with done: not target.done})
```

```igni
increment_quantity(existing):
  shared.cart = replace(shared.cart, existing, {existing with quantity: existing.quantity + 1})
```

If overriding multiple fields:

```igni
updated = {item with name: "New", done: true}
```

2. Why this shape

I’d use `{object with ...}` because it keeps the result clearly in “object literal territory” while adding the minimum new idea: start from an existing object, then override named fields. It reads well, stays declarative, and avoids method syntax or function-call syntax like `copy(...)` / `merge(...)`, which would push Igni toward more general programming-language patterns instead of UI-spec simplicity. It also preserves `key: value` as the way fields are written, without inventing a second override notation. Compared with alternatives like `with target: ...`, `target + {...}`, or `extend(target, {...})`, this is shorter, more explicit about object construction, and less likely to imply unsupported generic object arithmetic.

3. Concerns / ambiguities

- This would require a new special form inside object literals: today `{...}` only contains `key: value` pairs, so `{target with done: ...}` needs to be explicitly defined as an object-spread/update form, not a normal literal.
- The grammar should make clear that `with` is only valid in this pattern and that the left side must be an object expression, probably a variable/field access like `target` or `existing`.
- It should define whether zero overrides are allowed: `{target with}` is probably best rejected.
- It should define duplicate override behavior: `{item with done: true, done: false}` should likely be a compile error to preserve “one way to do everything.”
- If Igni ever allows arbitrary expressions in object positions, parsing should stay strict so `{a + b with x: 1}` is either clearly allowed or clearly forbidden; I’d suggest only allowing a simple object expression there for readability.