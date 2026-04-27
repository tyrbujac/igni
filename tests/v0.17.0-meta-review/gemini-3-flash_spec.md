---
model_label: gemini 3 flash
input_tier: spec
input_path: spec/v0.17.0.md
date: 2026-04-27
---

This is an impressive evolution of Igni. Moving to **v0.17.0** with a focus on "visual chrome" primitives like `border:`—and specifically the rigorous promotion gate for these features—suggests a language that is maturing from a "cool experiment" into a disciplined tool.

The "no parentheses" rule for component invocation vs. "parentheses for expressions" is a smart clarity win. It creates a visual rhythm where **Layout/Components** look like a design spec, while **Logic/Math** looks like code.

---

## Evaluation & Scoring

### 1. Readability: 9.5/10
**Definition:** The "Glance Value"—how quickly a designer can map the code to a mental image of the UI without mentally parsing syntax trees.
* **Comparison:** Compared to **Flutter (6/10)**, Igni is a revelation. Removing the "bracket hell" and the `Widget build(BuildContext context)` boilerplate makes the intent immediate. It feels closer to **SwiftUI (8/10)** but cleaner because it lacks the complex property wrappers (`@State`, `@Binding`) that often clutter SwiftUI's logic.

### 2. LLM Accuracy: 9/10
**Definition:** The probability of a zero-shot successful generation based on the "Spec as a Budget" philosophy.
* **Comparison:** I am far more confident writing Igni zero-shot than **Flutter**. In Flutter, LLMs frequently hallucinate where a `const` goes or mess up `Column` vs `ListView` nesting rules. Igni's "one way to do it" (e.g., `is` instead of `==`, `+` for everything) reduces the "branching factor" of possible mistakes an AI can make.

### 3. Speed (Developer Iteration): 10/10
**Definition:** Time from "I have an idea" to "I see it on my device."
* **Rationale:** The lexical reactivity rule is the "cheat code" here. By removing the concept of `setState` or `Controllers`, you’ve removed the #1 source of developer friction in UI work. It’s "spreadsheet-style" programming applied to pixels.

### 4. Cost (Cognitive & Token): 9/10
**Definition:** **Cognitive Cost:** The mental overhead required to maintain a mental model of the app state. **:** LLM context window efficiency.
* **Rationale:** Because the spec is a "budget," the token cost to describe a screen is tiny. You can fit an entire Igni app into a prompt that would only hold a single Flutter class. Cognitively, the `shared.` prefix is a masterstroke—it makes "where did this data come from?" a non-question.

### 5. Testing: 4/10
**Definition:** Built-in infrastructure for verifying visual and logic correctness (Unit/Golden tests).
* **Rationale:** This is currently the weakest link. For a v1.0, I’d expect a `test "Description":` block that can simulate `on tap:` events and assert against state. Currently, the spec is heavily focused on *writing* and *running*, but not *verifying*.

### 6. Extra Axis: Error Messages (The "Fix-it" UX): 10/10
**Definition:** How much the compiler helps the user stay within the "rails" of the language.
* **Rationale:** The proactive rejection of "Fetch-in-Input" and "Inline Hex" with explicit "Suggested Fix" messages is exactly what a UI-first language needs. It treats the compiler as a pair programmer, not a judge.

---

## Critical Considerations before v1.0

### 1. The "List Mutation" Friction (The Smell)
The `items = replace(items, target, {target with ...})` pattern is pure and reactive, but for very large lists or deep objects, it feels like "manual immutability."
* **Risk:** If a user has a list of 500 items, and they toggle a checkbox, the "each-rebuild" or `replace` logic might feel verbose.
* **Celebration:** It prevents a whole class of "UI didn't update because I mutated a list property" bugs that plague React/Flutter. Stick to it, but maybe consider a `update items[target] with ...` sugar that desugars to the current `replace` logic.

### 2. Structural Risk: The 4-Level Nesting Cap
I **love** this rule as a forcing function for quality, but it will be the most "pushed-back on" feature by power users.
* **Push-back:** Users will argue it slows them down.
* **Defense:** It is the only thing keeping Igni from becoming a "Write-Only" language. If you can't see the logic because of the nesting, the language has failed its "Human Readable" north star.

### 3. The Gap: Complex Layouts (Z-Index/Overlay)
Currently, everything is `vertical` or `horizontal`.
* **Gap:** How do I build a floating action button (FAB) that stays in the corner while the list scrolls? How do I put a badge on the *corner* of an icon?
* **Suggestion:** A `layout stack:` primitive is likely needed before v1.0 to handle the "Z" axis without breaking the simplicity.

### 4. The Gap: Lifecycle (Beyond `every`)
While `every` handles recurrence, there’s no "Once, when this screen opens" (e.g., to fire an analytics event or start a socket connection).
* **Structural Risk:** If you add `on mount:`, you risk bringing back the complexity of `useEffect`. You might consider an `once:` block that follows the same scoping as `every`.

---

## The Verdict
Igni is currently an **8.8/10** UI-DSL. It is the first language I've seen that truly understands the "LLM-as-a-first-class-developer" era. It doesn't just make it easy for humans to read; it makes it **impossible for AIs to hallucinate**.



One follow-up for the design stage: **How do you envision handling "Theming" for dark mode specifically?** Does `theme: color:` support a `dark:` sub-block, or is the intention to let the runtime handle the `subtle`/`card` mapping automatically?
