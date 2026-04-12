# Cold-LLM Test: Shopping Cart (Igni v0.6)

**Spec version tested:** Igni v0.6
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Shopping cart
**Re-run of the v0.5 test that surfaced the `find` gap.**

## The prompt

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have two screens: a product list showing each product's name and price, and a cart screen. Tapping a product adds it to the cart. The cart screen shows items with quantities, a total price, and a "Remove" button per item. Use shared state for the cart. Use `find` with a lambda to check if a product is already in the cart, and `filter` to remove items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Cross-model results

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| Predicate `find` with lambda | `find(cart, item => item.id is product.id)` | `find(cart, item => item.id is product.id)` | `find(cart, p => p.id is product.id)` |
| `filter` with lambda | `filter(cart, item => item.id is not target.id)` | `filter(cart, p => p.id is not item.id)` | `filter(cart, item => item.id is not target.id)` |
| `replace` for qty update | Yes | Yes | No (used `count` approach) |
| `is null` on find result | Yes | Yes | Yes |
| Components | `ProductCard` | `ProductRow`, `CartRow` | `ProductRow` |
| `shared:` block | Yes | Yes | Yes |
| `length()` | Yes (cart badge) | No | No |
| `divider` | Yes | Yes | No |
| Inventions | `icon "plus"` | None | `unique_items()` function |
| **Spec verdict** | **PASS** | **PASS** | **PASS** |

## Headline result

**3/3 models used predicate-based `find` with lambda syntax.** This was the #1 gap from v0.5 where 2/3 models misused identity-based `find` for structural matching. The gap is empirically closed.

### v0.5 → v0.6 comparison

| Model | v0.5 Shopping | v0.6 Shopping |
|---|---|---|
| Claude | PARTIAL (`find` misuse) | **PASS** (lambda find) |
| Gemini | PASS (used `count` workaround) | **PASS** (lambda find + replace) |
| ChatGPT | PARTIAL (`find` misuse) | **PASS** (lambda find + filter) |

The `find`-by-field gap that motivated v0.6 is definitively closed.
