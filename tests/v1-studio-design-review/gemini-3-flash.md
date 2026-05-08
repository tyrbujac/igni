# Gemini 3 Flash — v1 Studio strategic critique

**Run date:** 2026-05-01
**Session shape:** all-five-at-once (single paste of paste-package.md after cheatsheet attach)
**Cheatsheet version:** v0.21.1
**Brainstorm doc version:** docs/private/134 as of 2026-05-01
**Notes:** 4th cell added by operator beyond planned 3-cell trio (Pro + GPT + Opus); Flash plays the noise-tier / smaller-model differential-teaching-gap-surface role consistent with prior chat-mode panel patterns.

---

### Q1 — Wireframe vs semantic primitives split

**Verdict:** **FLIP**
**Confidence:** **HIGH**

**Reasoning:**
The operator lean toward a split between "wireframe" and "semantic" families violates Igni's core "one way to do everything" and "no magic" principles. Introducing a parallel vocabulary for rectangles and circles alongside buttons and inputs creates an unnecessary cognitive tax for the developer. If I have a `rectangle` that I've styled with `rounded: medium` and a `background: card`, and then I decide it needs to be interactive, the language should not force me to migrate my layout to a `button` primitive just to satisfy a semantic requirement. This creates a "refactoring cliff" where the developer has to swap primitives rather than just adding an event handler.

Furthermore, the existing cheatsheet already demonstrates that `layout` is the primary structural primitive. By allowing layouts to have `background`, `rounded`, `border`, and `padding`, a `layout vertical, background: red, rounded: circle` already *is* a circle. Introducing a separate `circle` primitive creates redundant ways to achieve the same visual result. The "one way" principle suggests that if you want a visual box, you use a `layout`. Adding a dedicated wireframe family just to mirror Figma's mental model compromises the DSL's lean identity for the sake of tool-side familiarity.

Instead, Igni should lean into its existing identity as a specification for "high-level UI." The distinction between wireframe and semantic should be handled through properties, not primitive names. A primitive should be defined by its *content and structure*, not by its intended accessibility role. If a designer wants a "wireframe," they are really just asking for a layout with a specific border and no logic. Igni's current model is already expressive enough to handle this without bifurcating the language.

**Alternative Direction:**
Stick to the existing primitives and expand the **Role-based Styling** model. Rather than new primitives, allow `layout` to explicitly declare a `role:`. This keeps the vocabulary small. If the goal is "wireframing," introduce a `wireframe` theme or a global modifier that renders all `layout` and `button` primitives as skeletons. This achieves the designer's goal (low-fidelity visualization) without polluting the production language with redundant primitives.

---

### Q2 — Modular interactivity (any primitive can be tappable)

**Verdict:** **REFINE**
**Confidence:** **HIGH**

**Reasoning:**
The operator lean is correct in terms of developer ergonomics: if a developer can attach `on tap:` to a layout or a label, they can build custom UI patterns without fighting the framework. The current cheatsheet already shows `layout vertical, on tap: select()` as a valid pattern. However, the counter-position's concern about accessibility is legitimate. In a "UI-first" language, accessibility shouldn't be an afterthought or a "property designers will forget."

The "Igni way" to solve this is through **Compiler Enforcement**. If any primitive that is not inherently interactive (like a `label` or a `layout`) has an `on tap:` handler attached, the compiler should require an explicit `role:`. This forces the developer to think about semantics at the moment they add the interaction, rather than relying on a separate "accessibility pass" that never happens. This aligns with Igni's "parse-time rejection" philosophy used for spacing tokens and hex codes.

By making `on tap:` modular but gated by a `role` requirement on non-semantic primitives, we preserve flexibility for custom buttons while ensuring the output remains high-quality. This prevents the "rectangle-as-button" trap where the UI looks right but is invisible to screen readers. It also maintains the "no magic" principle—the developer explicitly states what the element is.

**Proposed Modification:**
Any `layout`, `image`, or `icon` may accept `on tap:`. However, if the primitive is not a `button`, `input`, `toggle`, `checkbox`, `slider`, or `dropdown`, the compiler requiree:` property.
*   `layout, on tap: do_thing():` ❌ (Error: "Interactive layouts require a role. Add role: button or role: link.")
*   `layout, role: button, on tap: do_thing():` ✅
*   `button "Save", on tap: do_thing():` ✅ (Role is implicit).

---

### Q3 — v1.0 positioning model: flow-only vs flow + bounded-offset

**Verdict:** **HOLD**
**Confidence:** **MEDIUM**

**Reasoning:**
Igni's power lies in its constraints. The "token-only discipline" for `gap`, `padding`, and `border` is what makes it resilient across screen sizes. Introducing `offset_x` or `offset_y`, even if bounded to spacing tokens, introduces the "nudge" anti-pattern. Once you allow a 4px offset, you have created a way for elements to overlap or create unexpected whitespace that isn't captured by the flow logic. This makes the "Lossless AST round-trip" for Studio much harder because the visual position of an element no longer matches its position in the document flow.

For Studio to be successful, it must teach designers how to thinkFlow." If a designer wants to nudge an item, the correct Igni answer is usually to adjust the `gap` of the parent, add `padding` to the child, or wrap the item in a `layout` with `align: end`. Bounded offsets are a "Figma-crutch" that would eventually lead to fragile UI code that breaks when the `max_width: phone` cap is hit.

The v1.0 goal should be to prove that **Flow is enough**. If there are specific UI patterns (like a notification badge overlapping an icon) that currently require offsets, Igni should introduce a specific `overlay` layout primitive or a `badge` property rather than a generic `offset`. This keeps the intent semantic and the layout predictable.

---

### Q4 — Igni Studio canvas semantics: direct-manipulation vs source-first

**Verdict:** **HOLD**
**Confidence:** **HIGH**

**Reasoning:**
A "source-first" Studio (read-only preview) is just a glorified hot-reload window. To provide real value to the designer-developer bridge, Studio *must* be a direct-manipulation surface. The "magic" of Igni is its readability; seeing a one-to-one mapping between a "drag-to-increase-gap" action on the canvas and the `gap: medium` → `gap: large` change in the code is the ultimate educational tool for the language.

However, the direct manipulation must be **Strictly Constrained**. The canvas should not behave like a free-form vector tool. Instead, it should behave like a "Token-Aware Structural Editor." When a designer drags an element, they shouldn't be changing coordinates; they should be reordering the AST or changing the `align:` property. This reinforces the language's rules. If a designer tries to drag an element to a random X/Y coordinate, the UI should snap it to the nearest valid `layout` position.

This approach solves the counter-position's concern about "Figma visual fidelity." Studio isn't trying to be Figma; it's trying to be a visual interface for `.igni`. By aligning the canvas semantics with the language semantics (e.g., the grid is the `spacing/N` scale), you ensure that the "round-trip" is always lossless.

---

### Q5 — Token pair system for coloured primitives (auto-contrast text colour)

**Verdict:** **REFINE**
**Confidence:** **MEDIUM**

**Reasoning:**
The operator lean (Position 7: Explicit Pairs) is the most robust, but it adds significant "spec tax" to the `theme:` block. Requiring `on_brand`, `on_primary`, etc., for every token doubles the amount of theme code. However, the "Status Quo" (Designer responsibility) is a recipe for inaccessible apps. The "Auto-contrast" (Luminance-based) approach feels like "magic" that Igni usually avoids—it's a runtime calculation that the developer can't easily override or predict without running the app.

A **REFINE** approach would be to use **Smart Defaults with Explicit Overrides**.
Igni should adopt the `on_TOKEN` naming convention as a built-in expectation. If the developer defines `brand: "#FF6B35"`, the language *automatically* provides an `on_brand` value based on standard WCAG contrast (white or black). However, the developer can explicitly override it in the `theme:` block if they want a specific tint (e.g., a very dark navy instead of pure black).

This follows the "one way to do things" rule but reduces the boilerplate. When a `button "Save", color: brand` is rendered, the label's `color:` defaults to `on_brand`. This makes the Studio canvas implications very clean: the designer sets the background, and the text "just works," but the "source-first" developer can still see exactly where that color comes from by checking the `on_brand` token.

**Proposed Modification:**
*   Defining a color token `X` in `theme:` automatically generates a companion `on_X` token using a built-in contrast algorithm.
*   `on_X` can be manually defined in the `theme: color:` block to override the default.
*   Filled primitives (`button`, `badge`, or `layout` with a background) set their default foreground color to the companion `on_X` token of their background.
