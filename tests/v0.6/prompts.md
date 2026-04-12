# Igni Cold-LLM Test Prompts (v0.6)

The v0.6 round validates **lambda expressions and predicate-based list operations**. The key question: do LLMs discover the `item => expr` syntax and use `find`/`filter`/`sorted`/`reversed` correctly from the spec alone?

## How to use these prompts

Paste the full contents of `spec/v0.6.md` FIRST, then paste one of these prompts BELOW it in the same chat message.

---

## 1. Shopping cart (re-run — the test that surfaced the find gap)

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have two screens: a product list showing each product's name and price, and a cart screen. Tapping a product adds it to the cart. The cart screen shows items with quantities, a total price, and a "Remove" button per item. Use shared state for the cart. Use `find` with a lambda to check if a product is already in the cart, and `filter` to remove items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** Predicate-based `find` (the #1 gap from v0.5), `filter` with lambda, `shared:` state, `each` loops, object literals, field access, `navigate to`. This is the test that originally surfaced the `find` misuse — running it against v0.6 validates the fix.

**v0.5 baseline:** PARTIAL. 2/3 models misused identity-based `find` for structural matching. Gemini sidestepped with `count`.

**v0.6 expected:** All three models use `find(cart, item => item.id is product.id)` or similar predicate form. If they still reach for identity-based find, the lambda syntax isn't discoverable enough.

---

## 2. Sorted contact list (new — exercises sorted + filter + reversed)

> Using only the Igni language spec above, write a Contacts screen in Igni. It should show a list of contacts sorted alphabetically by name. Include a search input that filters contacts by name (show only contacts whose name contains the search text). Add a toggle to switch between A-Z and Z-A sort order. Use the list builtins from the spec.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** `sorted` with lambda key function, `filter` with lambda predicate, `reversed` for descending sort, `input bind:` for search, `toggle bind:` for sort direction, composition of multiple list operations.

**Predicted gaps:**
- **String contains/matching** — the spec has no `contains` or substring check. Models will need to invent or work around it. This is a known gap — watch what they invent.
- **Chaining operations** — `reversed(sorted(filter(list, pred), keyFn))` is verbose but correct. Models might try to chain differently.
