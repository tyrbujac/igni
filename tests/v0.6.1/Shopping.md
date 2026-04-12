# Cold-LLM Test: Shopping Cart (Igni v0.6.1 — Cheat Sheet)

**Spec version tested:** Igni v0.6.1 cheat sheet (218 lines)
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Shopping cart
**First cheat sheet test — measures whether 218 lines is enough.**

## The prompt

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have two screens: a product list showing each product's name and price, and a cart screen. Tapping a product adds it to the cart. The cart screen shows items with quantities, a total price, and a "Remove" button per item. Use shared state for the cart. Use `find` with a lambda to check if a product is already in the cart, and `filter` to remove items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Cross-model results

| Feature | ChatGPT 5.3 | Gemini 3.1 Pro | Gemini 3 Fast | Claude Opus 4.6 |
| --- | --- | --- | --- | --- |
| Lambda `find` | ✓ | ✓ | ✓ | ✓ |
| Lambda `filter` | ✓ | ✓ | ✓ | ✓ |
| `replace` for qty | ✓ | ✓ | ✓ | ✓ |
| `is null`/`is not null` | ✓ | ✓ | ✓ | ✓ |
| `shared:` block | ✓ | ✓ | ✓ | ✓ |
| Functions inside screens | No (inline on tap) | ✓ | ✓ | ✓ |
| No parens on screen name | No (`Cart()`) | No (`ProductList()`) | No (`ProductList()`) | No (`Products()`) |
| `each` in function body | n/a | n/a | Failed (gave up) | ✓ (inline) |
| `length()` builtin | No | No | ✓ | ✓ |
| **Spec verdict** | PARTIAL | PASS (minor) | PARTIAL | PASS (minor) |

## Headline findings

### 1. Lambdas: 4/4 correct from cheat sheet alone

Every model — including the fast/cheap Gemini 3 Fast — used predicate `find`, `filter`, and `replace` correctly with lambda syntax. The 218-line cheat sheet teaches lambdas as effectively as the 1028-line full spec.

### 2. Universal error: `screen Name()` parentheses

All four models added `()` to no-arg screen names. The cheat sheet only shows `screen Profile(user):` (with parameter). Models inferred empty parens for no-arg screens. **Fix: add a no-arg screen example to the cheat sheet.**

### 3. ChatGPT: inline multi-statement on tap

ChatGPT put the entire if/else add-to-cart logic directly after `on tap:` instead of defining a function. The spec says `on tap:` takes a single statement or function call. ChatGPT understood the logic but not the constraint.

### 4. Gemini Fast: couldn't compute total

Wrote `return "Calculated"` with a comment: "Igni doesn't support reduce/fold." The cheat sheet's Functions section shows a simple return but no `each` loop inside a function. **Fix: add an each-in-function example to the cheat sheet.**

### 5. Opus was slowest but cleanest

50 seconds vs ~5 seconds for Gemini Fast. Produced the most structurally correct output: functions inside screens, `length()` for badge, proper separation of concerns.

## Cheat sheet gaps identified

1. **No-arg screen example needed** — all 4 models added `()`. Add `screen Home:` example.
2. **`each` in function body example needed** — Gemini Fast didn't know functions can loop. Add total-computation example.

## Cheat sheet vs full spec comparison (Shopping cart)

| Aspect | Full spec (v0.6) | Cheat sheet (v0.6.1) |
| --- | --- | --- |
| Lambda syntax | 3/3 correct | 4/4 correct |
| Structural errors | 0 | 2 (screen parens, inline on-tap) |
| Total computation | 3/3 correct | 3/4 (Gemini Fast failed) |
| Models tested | Frontier only | Mixed (frontier + fast) |

The cheat sheet successfully teaches syntax and semantics. It fails to teach structure — where functions go, how screens are declared. The fix is two examples, not more prose.
