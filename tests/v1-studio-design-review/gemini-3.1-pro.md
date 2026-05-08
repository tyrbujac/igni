# Gemini 3.1 Pro — v1 Studio strategic critique

**Run date:** 2026-05-01
**Session shape:** all-five-at-once (single paste of paste-package.md after cheatsheet attach)
**Cheatsheet version:** v0.21.1
**Brainstorm doc version:** docs/private/134 as of 2026-05-01

---

Here is the architectural critique of the five positions for Igni v1.0 and Igni Studio, evaluated directly against the v0.21.1 Cheatsheet principles of "no magic," "one way to do everything," and token-strict predictability.

---

## Q1 — Wireframe vs semantic primitives split

**Verdict:** FLIP
**Confidence:** HIGH

**Reasoning:**
Introducing a split between wireframe primitives (`rectangle`, `circle`, `line`) and semantic primitives (`button`, `input`) directly violates Igni's core "one way to do everything" principle. The v0.21.1 cheatsheet already demonstrates that a `layout` with `background:`, `rounded:`, and `border:` properties effectively serves as a rectangle or a circle (when fully rounded). Adding `rectangle` and `circle` primitives creates two competing vocabularies for drawing a box on the screen: one through layout configuration and one through pure visual primitives.

Furthermore, if wireframe shapes are introduced alongside layouts, designers and developers will inevitably mix them, leading to fragmented UI structures where some containers are `layouts` holding children, and others are `rectangles` serving as mere backgrounds, requiring absolute positioning or complex z-indexing (which Igni currently avoids) to overlay text.

**If REFINE/FLIP:**
Abandon the wireframe primitive family entirely. Unify the visual and semantic models by leaning into the existing `layout` primitive. If a designer needs a custom visual shape, they use an empty or populated `layout` with the appropriate visual tokens (`background`, `border`, `rounded`). For a line, a `divider` primitive already exists in the cheatsheet. This keeps the primitive count low, forces a single mental model, and ensures everything drawn on screen remains structurally part of the layout flow.

---

## Q2 — Modular interactivity (any primitive can be tappable)

**Verdict:** REFINE
**Confidence:** HIGH

**Reasoning:**
The v0.21.1 cheatsheet explicitly states: *"All input primitives (and any layout / component) accept `on tap:` n touch:`."* Therefore, modular interactivity is already embedded in the language. The risk is not the interactivity itself, but the loss of accessibility semantics when a raw layout is made interactive to serve as a custom button. If `layout vertical, on tap: save()` compiles to a tappable zone without a semantic role, screen readers fail.

The counter-position (restricting `on tap:` entirely to buttons) is too restrictive for custom design systems where a whole card needs to be a touch target. However, relying on designers to manually append `role: button` to every interactive layout is a recipe for widespread accessibility failures, contradicting Igni's goal of predictable, robust defaults.

**If REFINE/FLIP:**
Keep the existing modular interactivity (allowing `on tap:` on layouts), but treat accessibility semantics as a compiler concern, not an optional designer property. If a `layout` is given an `on tap:` handler, the Igni compiler should implicitly wrap it in a generic interactive role (e.g., `role: button` or `role: clickable`) at codegen. If a more specific role is needed, the developer can explicitly declare `role: link`, which overrides the compiler's default. This preserves flexibility while ensuring accessibility "just works" without relying on manual `role:` tagging.

---

## Q3 — v1.0 positioning model: flow-only vs flow + bounded-offset

**Verdict:** FLIP
**Confidence:** HIGH

**Reasoning:**
Hold the line on flow-only positioning. The counter-position is correct: flow-only is sufficient indefinitely. Introducing `offset_x:` and `offset_y:`—even if bounded to spacing tokens—punctures the declarative flow layout model and leaks absolute-positioning mentalities into the DSL. Once offsets are allowed, designers will use them to fake margins, overlap elements improperly, or break responsive reflows, subverting the strict token-based padding and gap systems that make Igni robust.

Igni's design principles strongly favor explicit structural choices over visual nudging. If an element needs to move 8px to the right, it should be because of a `padding: small` or `gap: small` on its container, not an arbitrary positional offset on the element itself. This exact discipline is what makes the AST to Figma auto-layout round-trip feasible.

**If REFINE/FLIP:**
Do not implement bounded offset. Studio's canvas must constrain designers to the language's reality, not bend the language to accommodate traditional freehand canvas expectations. If Studio needs to support designers, it should do so by making flow layout intuitive (e.g., visual drop-zones for flex flow, exposing `gap` and `padding` controls visually), exactly as Figma Auto-Layout does.

---

## Q4 — Igni Studio canvas semantics: direct-manipulation vs source-first

**Verdict:** REFINE
**Confidence:** MEDIUM

**Reasoning:**
A purely source-first, read-only canvas drastically limits the market appeal of Studio, reducing it to a live-preview rather than a collaborative design tool. However, the operator lean of "direct manipulation" is dangerous if interpreted as freehand Figma-style dragging. Freehand dragging implies absolute positioning, which conflicts with Igni's flow-only layout model (as established in Q3).

The value of Igni Studio lies in visual, lossless AST manipulation. For this to work, the canvas must be a *structural* manipulation surface. When a designer drags a button, they shouldn't be dragging it to an X/Y coordinate; they should be dragging it into a structural flow zone (e.g., dropping it into a `layout vertical` gap).

**If REFINE/FLIP:**
Refine the definition of "direct-manipulation" for Studio. The canvas must operate strictly as an Auto-Layout/Flexbox manipulation tool. You can click and drag elements to reorder them within their parent list, or drag a new primitive from a tray into a valid structural insertion point. You can visually tweak a `padding` slider that snaps to `spacing/N` tokens. The canvas translates these visual structural edits directly into `.igni` source updates. This preserves the "drag shapes around" UX but constrains it entirely to Igni's valid AST vocabulary.

---

## Q5 — Token pair system for coloured primitives (auto-contrast text colour)

**Verdict:** HOLD
**Confidence:** HIGH

**Reasoning:**
The operator lean (explicit token pairs in the `theme:` block) perfectly aligns with Igni's existing architectural philosophy. The v0.21.1 cheatsheet demonstrates that Igni favors explicit, traceable declarations without hidden magic (e.g., explicit `shared:` blocks, explicit `theme dark:` variants without auto-generation). Auto-contrast (a) introduces opacity; developers cannot predict the text color by reading the source, and a slight hex change in the background could cause the text color to abruptly flip from black to white.

Status quo (d) or a new `text_color:` property (c) creates massive boilerplate. If a designer changes a button's `color:` to a dark brand token, requiring them to also remember to manually set `text_color: white` on the label inside the button violates developer ergonomics.

**If REFINE/FLIP:**
Hold the operator lean. In the `theme: color:` block, require (or highly encourage) companion tokens. When a component like `button` applies a background color token, the compiler automatically retrieves the paired "on-color" token for its default text styling. This keeps the magic strictly localized to the theme resolution phase, meaning the behavior is globally predictable, explicitly defined in source, and removes redundant styling noise from the individual screen layouts.
