# Gemini 3 Flash — v0.19.1 cheatsheet review

*Raw chat-mode output, 2026-04-28. Minor copy-paste artifacts preserved as-is (e.g. line 41's `bind: draft,ge: shared.title = draft` should be `bind: draft, on change: shared.title = draft` — text-mangling artifact from the chat UI).*

---

This cheat sheet is a masterclass in "design-as-code." Igni v0.19.0 feels like the spiritual successor to early BASIC simplicity, but with modern reactive muscle.

As requested, here is the assessment of the documentation's structural health.

---

## Q1: The Strongest Section (What to Protect)
**The "Reacting to Users" / Derived State section.**

The distinction between **Top-level assignment (Captures)** and **Functions (Tracks)** is the most critical conceptual bridge in the language. Most reactive frameworks struggle to explain the "magic" of dependency tracking; Igni's literal rule—*a screen re-evaluates when a variable it references is reassigned*—is crystalline.
*   **Why it works:** The "Common Mistake" box specifically targets the mental model of React/Svelte developers, preempting the most likely source of frustration.
*   **Recommendation:** Keep the `total = count * price` vs `total():` example exactly as is. It is the "Rosetta Stone" for understanding Igni.

---

## Q2: The Weakest Section (Prune Candidates)
**The "Selected-state pattern" under Borders.**

While the code is clear, this section feels like a "Tutorial" snuck into a "Cheat Sheet."
*   **The Issue:** It spends 15 lines of code explaining how to use a `width_for` function to return `thick` or `thin`. This logic is already covered by the "Functions" and "Conditionals" sections.
*   **Pruning:** You could reduce this to a single sentence: *"Since `border:` accepts tokens, use a screen-internal function to return `thick` or `thin` based on selection state."* You don't need the full implementation of a payment method list to prove that functions work.

**Also:** The "Layout Properties" section mentions no `\` line-continuation twice. One bullet point is enough.

---

## Q3: Semantic Uncertainty (The "Teaching Gaps")
**1. The `bind:` vs `on change:` execution order.**
The docs say: *"The bound variable is already updated when the handler fires."* However, in the **`input` exception** section, you show:
`input bind: draft,ge: shared.title = draft`
If `draft` is updated *before* the handler, does the UI re-render *twice*? (Once for the `bind` update and once for the `shared.title` update). Or are these batched because they originated from the same user event? This is the only place where Igni's "no boilerplate" promise feels like it might hide a performance or race-condition "gotcha."

**2. The `body` keyword in Wrapper Components.**
The docs state: `body` renders exactly one widget. If the caller passes:
```igni
Card "Title":
  label "One"
  label "Two"
```
Does the compiler automatically wrap those in a `vertical` layout, or does it throw a "Single child expected" error? Given Igni's "no aliases" rule, I suspect it's an error, but "One widget" can be ambiguous to someone who thinks of a list of items as a single "content block."

**3. The `is` vs `contains` asymmetry.**
The documentation acknowledges the asymmetry as a "rule, not a bug," but it doesn't explain *why*. In a UI language, having `is` be case-sensitive but `contains` be case-insensitive will lead to scenarios where `if contains(name, "Tyr")` is true, but `if name is "Tyr"` is false. This is a fertile ground for logic bugs.

---

### Summary for v0.20
The **Animation** section is your most "complete" addition. The `transition:` vs `spring()` divide is brilliant because it forces the developer to choose between "Structural Change" and "Value Interpolation," preventing the "messy middle" of imperative animation logic found in CSS or Flutter.

**Verdict:** The docs are 90% "Reference" and 10% "Tutorial." Pruning that 10% (like the Payment Method example) will make this a tighter, faster read for experienced devs.
