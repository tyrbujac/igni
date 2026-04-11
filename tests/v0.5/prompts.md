# Igni Cold-LLM Test Prompts (v0.5)

These are the prompts being used as **v0.5 validation tests**. The goal is to confirm that v0.5's three new features (shared state via `shared:` block, wrapper components with `body` slot, list builtins) actually close the gaps surfaced by the v0.4 acceptance round.

The Notes app is a re-run of the v0.4 prompt — same wording, against v0.5 — to verify that the cross-screen state gap is closed. The Shopping app is new and exercises all three v0.5 features together in a single multi-screen app.

If both pass cleanly, **v0.5 ships as the last design-only release** and the next workstream is the TypeScript-to-Dart transpiler.

## How to use these prompts

**Paste the full Igni spec FIRST, then paste one of these prompts BELOW it in the same chat message.** The order matters: the prompt has to be the most recent thing the model sees, otherwise the model latches onto the spec and starts discussing it instead of executing the task.

Each prompt ends with a *"Respond with only the Igni code"* directive. Don't remove it — without that line, frontier models default to narrating the spec instead of generating code.

To run any of these tests, paste the entire contents of `spec/v0.5.md` followed by one of the prompts below, and capture the response into the matching `<App>.md` file in this folder.

---

## 1. Notes app (re-run from v0.4)

> Using only the Igni language spec above, write a notes app in Igni. The user should see a list of all their notes (showing just the title) on the main screen, with a button to create a new note. Tapping a note opens a detail screen showing the full content. From the detail screen, the user can edit the note's title and body, save changes, or delete the note. When there are no notes yet, show an empty state on the main screen.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** the same multi-screen navigation pattern that the v0.4 Notes test exercised. The difference now is that v0.5 has `shared:` blocks, so the detail screen can mutate the parent screen's state via `shared.notes` instead of being structurally limited.

**v0.4 baseline:** MIXED. Claude wrote no-op `save_note` and `delete_note` and explicitly named the cross-screen state gap. Gemini sidestepped via the single-screen pattern (still valid in v0.5 but no longer the only option). ChatGPT invented cross-screen function visibility.

**v0.5 expected outcomes:**

- **Best case (PASS):** All three models reach for `shared.notes` (or similar) to share state across the list and detail screens. v0.5 closes the gap definitively.
- **Acceptable (PARTIAL):** Some models still use the single-screen pattern (which is valid v0.4.1 and still valid v0.5). Some use `shared:`. Both are correct; the test still PASSes structurally.
- **Concerning (FAIL):** Any model still invents cross-screen function visibility, OR no model finds `shared:`, OR the `shared:` syntax is misused. Would mean the v0.5 documentation isn't discoverable.

**Predicted gaps:** none specific to this test; it's a regression check against the v0.4 baseline.

---

## 2. Shopping app (new for v0.5)

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have three screens: a product list (showing each product as a card with image, name, and price, with a tap-to-view-detail behaviour), a product detail screen (showing the same info plus a description and an "Add to Cart" button), and a cart screen (showing all added items with quantities, a total, and a "Remove" button per item). The cart should be accessible from any screen via a button or icon in the corner, and should persist as the user navigates between screens. Use a wrapper component for the product cards. Use the list builtins for adding, removing, and updating cart items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises (all three v0.5 features in one test):**

- **Shared state:** the cart needs to be accessible from product list, product detail, and cart screens, and changes from any screen need to flow to the others. This is the canonical use case for `shared:`.
- **Wrapper components with `body`:** the prompt explicitly asks for "a wrapper component for the product cards." The right answer is a `ProductCard` wrapper with the image / name / price layout, where the caller's body becomes the inner content (or a similar pattern).
- **List builtins:** `+ [item]` to add to cart, `without` to remove, `replace` to update quantities, `find` to look up an item by id (for "is this product already in the cart?"), `is in` for membership checks, `length` for "X items in cart" indicators.

This is the **most comprehensive single-test exercise of v0.5's design** — three new features, three screens, real shared state, real list manipulation.

**Predicted gaps for v0.5:**

- **Cart icon with badge** — "X items in cart" might require number-to-string concatenation, which is in v0.4.1 (`length(shared.cart) + " items"`) but might trip some models.
- **Product card wrapper** — the prompt explicitly asks for a wrapper. Models that have read the v0.5 `body` section should use it. Models that miss that section might inline the card layout instead. Either is structurally valid; the wrapper is the more on-brand solution.
- **Quantity updates** — if the cart shows quantities, the model needs to either store quantities as a separate field on cart items (in which case `replace` updates them) or count occurrences (in which case `count(shared.cart, product)` is the right tool). Either approach is valid v0.5.
- **`shared:` namespace conflicts** — if the model defines `shared.cart` in one file and tries to redefine it elsewhere, that's a v0.5 error. Worth noting if any model does it.

**v0.5 acceptance verdict if Shopping passes:** v0.5 ships. Move to the TypeScript transpiler workstream.

**v0.5 acceptance verdict if Shopping fails or surfaces inventions:** depends on what surfaces. If it's a documentation gap (the feature exists but wasn't found), do a v0.5.1 docs patch. If it's a real missing feature, defer the fix to v0.6 and decide whether to delay the transpiler workstream or build it against v0.5 as-is.
