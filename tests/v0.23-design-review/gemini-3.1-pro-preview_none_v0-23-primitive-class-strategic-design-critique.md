Here is the critical review of the v0.23 design candidates, evaluated strictly through Igni’s design hypothesis and load-bearing principles.

### Q1 — Should `screen` and `layout` merge?

**Verdict: KEEP SEPARATE.**

Merging them is a trap that violates the design hypothesis by introducing global context-sensitivity to the core structural primitive. Furthermore, it fundamentally breaks Igni’s lexical reactivity model. 

*   **The Reactivity Anchor:** Igni’s defining rule is *"a screen re-evaluates from the top whenever any variable it references is reassigned."* The `screen` is not just a visual root; it is the **reactivity boundary** and the **variable scope boundary**. If `screen` becomes just another `layout`, where does reactivity start? You would either have to magically infer the root, or allow any `layout` to act as a reactive boundary, destroying the "no magic" and "re-evaluates from the top" simplicity.
*   **Q1a (`max_width`):** This is the one property that migrates cleanly. `max_width` caps the box it sits on, regardless of depth. 
*   **Q1b (`fill: true`):** This is the poison pill. `fill: true` expands a node along its *parent's* main axis. At the root, there is no parent. A merged primitive makes `fill: true` a context-sensitive form: valid at depth ≥ 1, parse-error at depth 0. The LLM will constantly attempt to use `fill: true` on top-level nodes to "make the app full screen," hallucinating a Flutter `Expanded` where it doesn't belong.
*   **Q1c (Single-vs-multi child):** `screen` takes one block because it represents the `Scaffold`/`<body>` that hosts a component tree. `layout` takes many because it represents a `Column`/`Row` container. Merging them forces multi-child at the root, stripping the screen of its canonical shape and making window-chrome properties (`title:`, `background:`) awkwardly share space with flex properties (`gap:`, `align:`).

**Conclusion:** `screen` and `layout` do different jobs. `screen` manages OS/window chrome, variable scope, and the reactive evaluation loop. `layout` manages flex-box spatial distribution. Conflating them creates a god-object whose properties randomly fail depending on their AST depth. Keep them distinct.

---

### Q2 & Q3 — Interactivity, Semantics, and HTML Transpile

Options A, B, and C all fail the design hypothesis. Here is the substantive analysis of why, followed by the required fourth option (Q3e).

#### Q3a. Option A (Universal `on tap:`)
**Verdict:** Catastrophic aliasing (Defect).
Allowing `label "X", on tap: f()` and `button "X", on tap: f()` tells the LLM that interactivity is a context-free modifier that can be sprinkled anywhere. When generating HTML, `label + tap` becomes `<span onclick="f()">`, which has no keyboard focus, no ARIA role, and breaks screen readers. `button` becomes `<button>`. By providing both, you guarantee the LLM will generate inaccessible UI. Interactivity on structural/text primitives is a severe defect in an HTML-targeted world.

#### Q3b. Option B (`role:` property on `layout`)
**Verdict:** Exact aliasing (Defect).
`layout role: button: label "Submit"` and `button "Submit"` are two ways to write the exact same thing. The hypothesis explicitly warns against this: *"Two ways to write the same thing is mildly bad."* The LLM will oscillate between them, and worse, it will try to invent new roles (`role: dropdown`, `role: toggle`) that the compiler rejects. It violates the "Spec budget, not backlog" rule by introducing a modifier where a primitive already exists.

#### Q3c. Option C (Expand `button`'s styling vocabulary)
**Verdict:** Creates property sprawl, but doesn't solve complex child arrangement.
If users want an icon, text, and a badge inside a button, expanding `button`'s properties means adding `icon:`, `badge_text:`, `badge_color:` etc. It reinvents the layout system inside the properties of the button primitive. This violates "Spec budget" and "One way to do everything."

#### Q3d. How the HTML transpile changes the calculus
HTML strictly decouples *semantics* (what a node is) from *presentation* (how it looks via CSS). Flutter conflates them (`ElevatedButton` provides both tap semantics and a specific visual container). To generate high-quality HTML, Igni needs *more* semantic primitives (to target `<button>`, `<a>`, `<dialog>`), and it must aggressively **forbid** generic elements from adopting interactive semantics (no `on tap:` on plain `layout`). If the language allows `<div onclick>`, the LLM will use it, and the HTML transpile will be a11y-dead.

#### Q3e. Option D: Strict Semantic Interaction Primitives (The Proposal)

Here is the fourth option that explicitly satisfies the hypothesis by eliminating all context-sensitive interactivity and aliasing.

**The Rules:**
1. **Remove `on tap:` from `layout`.** Generic boxes cannot be tapped.
2. **Expand `button` to accept an optional block body.** If a `button` has no string argument, it opens a block that acts exactly like a `layout horizontal, align: center:`, but carries strict `<button>` semantics.
3. **Add `link`** for route-aware tap targets (`<a>`).

**Source Examples:**
```igni
# 1. Simple button (string arg)
button "Save", color: brand, on tap: save()

# 2. Complex button (block body instead of string arg)
button on tap: save(), background: subtle, padding: medium, rounded: full:
  icon "check", color: green
  label "Save Changes"
  badge "New", color: brand

# 3. Navigation link
link "Profile", navigate to Profile user
```

**Codegen Mapping:**
*   **Flutter:** `button` (simple) -> `ElevatedButton`. `button` (block) -> `GestureDetector/InkWell` + `Row`. `link` -> `TextButton` + Router logic.
*   **HTML:** `button` (both forms) -> `<button class="...">`. `link` -> `<a href="...">`. `layout` -> `<div class="...">`.

**Defense against the strongest objection:**
*Objection:* Doesn't expanding `button` to take a block create aliasing between `button "Save"` and `button: label "Save"`?
*Defense:* Yes, but it is parse-time mutually exclusive and structurally distinct. If `button` has a string argument, it *cannot* have a block body (parse error). If it has a block body, it *cannot* have a string argument. By restricting interactivity strictly to `button` and `link`, the LLM has exactly zero ways to hallucinate a `<div onclick>`. You trade a very small AST shape redundancy (inline vs block button) for an absolute guarantee of semantic accuracy in the HTML output. The LLM never has to guess whether to use `layout + tap` or `button`; if it taps, it's a `button`.