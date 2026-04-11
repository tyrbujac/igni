# Cold-LLM Test: Shopping App (Igni v0.5)

**Spec version tested:** Igni v0.5
**Test run dates:** _(fill in when run)_
**Source prompt:** `prompts.md` → Shopping app

## The prompt

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have three screens: a product list (showing each product as a card with image, name, and price, with a tap-to-view-detail behaviour), a product detail screen (showing the same info plus a description and an "Add to Cart" button), and a cart screen (showing all added items with quantities, a total, and a "Remove" button per item). The cart should be accessible from any screen via a button or icon in the corner, and should persist as the user navigates between screens. Use a wrapper component for the product cards. Use the list builtins for adding, removing, and updating cart items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

## Why this test exists

This is the **most comprehensive single-test exercise of v0.5's design.** It deliberately requires all three new v0.5 features in one app:

1. **Shared state** (`shared:` block, `shared.cart`) — the cart needs to be accessible from three screens and persist across navigation. This is the canonical use case the v0.4 Notes test surfaced as a real gap. v0.5 closes it with `shared:`.
2. **Wrapper components with `body` slot** — the prompt explicitly asks for "a wrapper component for the product cards." The expected pattern is a `ProductCard` wrapper that takes the product as an argument and uses `body` for the card's inner content, OR a structured product card that takes the product directly. Either is valid; the wrapper-with-body pattern is the more on-brand v0.5 idiom.
3. **List builtins** — adding (`+ [item]`), removing (`without`), updating quantities (`replace`), looking up by id (`find`), checking membership (`is in`), counting items (`length`).

If the Shopping app produces clean Igni from all three models, v0.5 is empirically validated and ships as the last design-only release.

---

## Claude

**Model version:** _(e.g. Opus 4.6)_
**Date:** _(YYYY-MM-DD)_
**One-shot or split?:** _(one shot / split into parts / asked clarifying questions)_

### Output

```igni
(paste full LLM output here)
```

### Grading

- **Invented syntax not in the spec?** _(yes/no — list what)_
- **Used existing syntax wrong?** _(yes/no — list where)_
- **Valid Igni on first try?** _(yes/no)_
- **Used `shared:` block for cart?** _(yes/no)_
- **Used wrapper component with `body`?** _(yes/no)_
- **Used list builtins?** _(which ones — `replace`, `find`, `count`, `length`, `is in`?)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

---

## Gemini

**Model version:** _(e.g. Gemini Thinking 3.0)_
**Date:** _(YYYY-MM-DD)_
**One-shot or split?:** _(one shot / split / asked questions)_

### Output

```igni
(paste full LLM output here)
```

### Grading

- **Invented syntax not in the spec?** _(yes/no — list what)_
- **Used existing syntax wrong?** _(yes/no — list where)_
- **Valid Igni on first try?** _(yes/no)_
- **Used `shared:` block for cart?** _(yes/no)_
- **Used wrapper component with `body`?** _(yes/no)_
- **Used list builtins?** _(which ones — `replace`, `find`, `count`, `length`, `is in`?)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

---

## GPT

**Model version:** _(e.g. GPT-5 / ChatGPT free tier)_
**Date:** _(YYYY-MM-DD)_
**One-shot or split?:** _(one shot / split / asked questions)_

### Output

```igni
(paste full LLM output here)
```

### Grading

- **Invented syntax not in the spec?** _(yes/no — list what)_
- **Used existing syntax wrong?** _(yes/no — list where)_
- **Valid Igni on first try?** _(yes/no)_
- **Used `shared:` block for cart?** _(yes/no)_
- **Used wrapper component with `body`?** _(yes/no)_
- **Used list builtins?** _(which ones — `replace`, `find`, `count`, `length`, `is in`?)_
- **Line count:** _(N lines)_

### Notes

_(any narration the model added, how it reasoned, anything notable about its approach)_

---

## Gaps observed (across all three models)

This is a v0.5 validation test for **all three new language features at once**. Universal gaps here would be the strongest possible signal that v0.5 isn't discoverable.

### Cross-model feature usage matrix (Shopping)

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| `shared:` block for cart | _?_ | _?_ | _?_ |
| Wrapper component with `body` | _?_ | _?_ | _?_ |
| `replace` for quantity updates | _?_ | _?_ | _?_ |
| `find` for product lookup | _?_ | _?_ | _?_ |
| `is in` for cart membership check | _?_ | _?_ | _?_ |
| `length` for "X items in cart" | _?_ | _?_ | _?_ |
| `count` for occurrence count | _?_ | _?_ | _?_ |
| Inventions | _?_ | _?_ | _?_ |

### Predicted gaps for this test

- **Cart icon with badge** — "X items" might require number-to-string concatenation, which is in v0.4.1 (`length(shared.cart) + " items"`). Worth checking models reach for it cleanly.
- **Product card wrapper** — the prompt explicitly asks for a wrapper. Models that have read the v0.5 `body` section should use it. Models that miss that section might inline the card layout instead.
- **Quantity updates** — if the cart shows quantities, the model needs to either store quantities as a field on cart items (`replace` updates them) or count occurrences via `count`. Either is valid v0.5.
- **`shared:` namespace** — if the model defines `shared.cart` in one file and tries to redefine it in another, that's a v0.5 error.
- **Cross-screen call temptation** — even with `shared:` documented, ChatGPT might still try to call functions across screens. The v0.5 explicit rule should catch this.

### Findings (fill in as tests run)

1. _(...)_

---

## v0.5 acceptance verdict for Shopping

After all three models are tested, decide:

- **PASS — v0.5 ships as the last design-only release.** All three models produce working Shopping apps using `shared:`, wrapper components with `body`, and the new list builtins. v0.5 is empirically validated. **Move to the TypeScript-to-Dart transpiler workstream.**
- **PARTIAL — minor gaps, recoverable with documentation.** Some features used by some models, with documented workarounds for the rest. Possibly do a v0.5.1 docs patch addressing whatever gaps surfaced, then move to the transpiler.
- **FAIL — v0.5 has real defects.** Multiple models invent things v0.5 should have covered, OR models can't find the v0.5 features even with the spec in front of them. Diagnose the specific gap and decide whether to patch v0.5 or push back to v0.6.

_(fill in after tests run)_

---

## Hand-written attempt (optional but valuable)

Your own attempt at this Shopping app in Igni v0.5, exercising all three new features. Worth doing as a sanity check before running the cold tests — if you hit walls writing this by hand, the cold tests will hit the same walls.

```igni
(paste your hand-written attempt here)
```
