# Igni Cold-LLM Test Prompts (v0.6.1 — Cheat Sheet Edition)

The v0.6.1 round tests the **cheat sheet** (218 lines) instead of the full spec (1028 lines). The question: can models generate correct Igni from just the condensed reference?

**Use `spec/v0.6.1-cheatsheet.md` for these tests, NOT the full spec.**

Tests a wider model range: frontier models (Claude, Gemini, ChatGPT) AND non-frontier (Gemini Flash, DeepSeek, Haiku, Llama, etc.). The non-frontier results measure whether Igni's design is clear enough for less capable models.

## How to use

1. Open a fresh conversation in the target model
2. Paste the full contents of `spec/v0.6.1-cheatsheet.md`
3. Paste one prompt below in the same message
4. Capture the output

## 1. Shopping cart (cheat sheet stress test)

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have two screens: a product list showing each product's name and price, and a cart screen. Tapping a product adds it to the cart. The cart screen shows items with quantities, a total price, and a "Remove" button per item. Use shared state for the cart. Use `find` with a lambda to check if a product is already in the cart, and `filter` to remove items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this tests:** The hardest cold test app against the shortest spec. Exercises shared state, lambdas, predicate find, filter, replace, navigate, components, each, if/else, functions with return — nearly every feature.

**Grading focus:** Does the cheat sheet give enough context for correct structure (functions inside screens, no parens on screen names)? Or do models need the full spec's examples?

---

## 2. Todo with delete (mid-complexity, tests core features)

> Using only the Igni language spec above, write a Todo app in Igni. It should have a text input for new tasks, an "Add" button, and a list of tasks below. Each task shows its text and a "Done" button that removes it. When there are no tasks, show "No tasks yet." Clear the input after adding.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this tests:** Core features only — input binding, button events, functions, each loops, if/else, without/list operations. No lambdas, no shared state, no navigation. If a model fails this with the cheat sheet, the cheat sheet is missing fundamental information.
