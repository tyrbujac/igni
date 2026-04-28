# Gemini 3.1 Pro — v0.19.1 cheatsheet review

*Raw chat-mode output, 2026-04-28. Minor copy-paste artifacts preserved as-is ("Q3: Semanrtainty" should read "Semantic Uncertainty" — text-mangling artifact from the chat UI).*

---

Here is an analysis of the Igni v0.19.0 cheat sheet, breaking down the strongest structural pillars, the areas ripe for pruning, and the semantic gaps that could trip up developers.

### Q1: Strongest Section (What protects, don't touch)

**The "Reacting to users" block (specifically the derived state and `❌ wrong / ✅ right` callout).**

*   **Why it works:** This is the bedrock of Igni's mental model. By explicitly addressing the exact cognitive friction developers will bring from React, Vue, or Svelte, you defuse the biggest footgun in the language. The distinction between top-level assignment "capturing" values and functions "tracking" values is beautifully articulated.
*   **What to protect:** Do not soften or compress the `total = count * price` vs `total(): return count * price` explanation. The assertive, slightly opinionated tone here (*"The connective tissue is one rule..."*) gives the reader confidence that the language is deterministic and predictable.

### Q2: Weakest Section + Prune Candidates (Redundant, dense, or dead weight)

**The "Arranging things -> Border" subsection.**

*   **Why it's weak:** It suddenly shifts from a punchy syntax reference into a highly specific UI design tutorial. The cheat sheet loses its velocity here.
*   **Prune Candidates:**
    *   **The "Selected-state pattern" example:** This 13-line code block explaining how to shift both border width and color simultaneously is too heavy for a cheat sheet. The philosophical design advice (*"selection signals through both width and colour. Either alone is ambiguous..."*) is dead weight in a syntax guide.
    *   **The "Outlined buttons" snippet:** It's redundant. You've already established that `border:` applies to layouts and that components nest. You can trust the reader to deduce that putting a button inside a bordered layout makes an outlined button.
*   **The Fix:** Compress the entire `border` section down to three sentences and one code block showing the syntax and theme-color composition.

### Q3: Semanrtainty (Ambiguities and teaching gaps)

**1. Object Mutation is buried and ambiguous.**
You introduce the `{BASE with KEY: VALUE}` syntax deep inside the **Lists** section under "Updating one field on an item." Objects (Maps) are core primitives, yet they have no dedicated update documentation.
*   *The Gap:* If I just have a top-level `user = {name: "Tyr", age: 24}`, how do I update the age reactively from an `on tap:` handler? Do I use the `with` keyword, or can I do `user.age = 25`? Since the spec strictly says list elements cannot be mutated in place, the reader is left guessing if objects have the same restriction.

**2. The `without` / `replace` reference-equality trap.**
In the **Boolean logic** section, you correctly establish that `{name: "a"} is {name: "a"}` is false (reference equality). In the **Lists** section, you introduce `without(items, target)`.
*   *The Gap:* A developer will inevitably try `items = without(items, {id: 42})` and it will silently fail to remove anything because the newly minted object literal doesn't match the reference in the list. You call out the multiplicity behavior, but you need an explicit warning about reference-matching here, likely steering them toward `filter(items, item => item.id is not 42)` for object lists.

**3. `every` block resumption timing.**
You note that `every` blocks pause on navigation and that missed ticks are not replayed. You state: *"if the user navigates away for ten seconds, the block fires once on return, not ten times."*
*   *The Gap:* Does it fire *immediately* upon the screen re-mounting, or does it wait for the duration to elapse *after* remounting? If I have `every 30s: fetch(...)`, a 29-second navigation away either means I fetch immediately on return, or I wait another 30 seconds.

**4. `max_width:` and `fill: true` axis confusion.**
*   *The Gap:* "Multiple `fill: true` siblings split space equally." A Flutter/CSS dev will assume this applies along the main axis of the layout (height for vertical, width for horizontal). The text doesn't explicitly confirm this, which causes a slight semantic pause when reading the CTA button anchoring example.

***

How do you want to handle the object mutation gap—should `{BASE with KEY: VALUE}` be pulled out into its own dedicated "Objects" section, or does Igni allow direct property reassignment (e.g., `user.name = "Ada"`) at the top level?
