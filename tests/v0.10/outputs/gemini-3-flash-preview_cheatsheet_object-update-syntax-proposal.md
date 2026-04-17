### 1. Proposed Syntax: `object with field: value`

The proposed syntax introduces the `with` keyword for object cloning and field overriding.

**Updated Functions:**

```igni
toggle_done(target):
  items = replace(items, target, target with done: not target.done)

increment_quantity(existing):
  shared.cart = replace(shared.cart, existing, existing with quantity: existing.quantity + 1)
```

**Multiple Fields Example:**
```igni
item = item with price: 10.0, active: true
```

---

### 2. Design Rationale

The `with` keyword aligns with Igni’s "UI-first/Design Spec" philosophy by reading like a natural language instruction rather than a mathematical operation (like `{...target}`). It avoids adding new bracket-based syntax or method-style dot notation (e.g., `.copy()`), which would clash with Igni’s minimal, property-driven layout style. By using `key: value` pairs after the `with` keyword, it leverages the existing vocabulary used in primitives and component invocations. This approach treats object updates as a non-mutating transformation, reinforcing Igni's rule that "updates flow through reassignment."

---

### 3. Concerns and Ambiguities

*   **Reserved Keyword:** `with` would need to be added to the reserved keyword list, potentially breaking existing code if developers used `with` as a variable name (e.g., `layout horizontal, with: 100`).
*   **Comma Usage:** In Igni, commas usually separate arguments in a flat list (like in `image "file", size: 48`). The parser must explicitly distinguish between `with` followed by a single override and a comma-separated list of multiple overrides to ensure the grammar doesn't get confused by trailing colons or nested expressions.
*   **Nesting:** The syntax should likely be restricted to shallow updates. Allowing `user with address.city: "New York"` would introduce complex path-parsing logic that Igni currently avoids. Restricting it to top-level fields keeps the compiler simple and the code readable.
*   **Collision with Logic:** Care must be taken so that `with` is not interpreted as a boolean operator (like `is` or `and`). It should only be valid in an expression following an object identifier.