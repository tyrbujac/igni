# GPT-5.3 — v1 Studio strategic critique

**Run date:** 2026-05-01
**Session shape:** split-paste (Q1+Q2 first, Q3+Q4+Q5 second — visible from formatting style change mid-response)
**Cheatsheet version:** v0.21.1
**Brainstorm doc version:** docs/private/134 as of 2026-05-01
**Notes:** Original placeholder file `gpt-5.5.md` renamed to `gpt-5.3.md` to match the actual chat-mode model used (ChatGPT default = 5.3, not 5.5).

---

## Q1 — Wireframe vs semantic primitives split

**Verdict: REFINE**

I'd keep the split, but tighten it. The operator's instinct is directionally right because Igni already separates **structure** from **meaning** in several places. `layout vertical` is structural; `button` is semantic. `transition:` and `spring()` are orthogonal behaviour layers, not new visual types. `shared:` is storage semantics, not UI shape. So "visual primitives" vs "semantic primitives" is not alien to the language — it fits the existing architecture.

But the proposed wireframe family is too broad as written. `text` and `image` aren't really "wireframe"; they already carry semantic payload in the current model (`label`, `image`). Adding `text` beside `label`, or `heading` beside `label style: heading`, fractures the "one way" rule. The cheatsheet is explicit about flattening vocabulary where possible (`heading.small` became `title` for consistency). Duplicating text primitives goes against that trend.

So I'd refine the split into:

**Structural primitives**

* `rectangle`
* `circle`
* `line`

**Content primitives**

* keep existing `label`
* keep existing `image`
* keep existing `icon`

**Semantic interactive primitives**

* `button`
* `input`
* `toggle`
* `checkbox`
* `slider`
* `dropdown`

No `text`. No `heading`. Headings remain styling (`label ..., style: heading`), which preserves the existing mental model.

This keeps Igni Studio coherent: structural shapes map naturally to canvas tools (draw rectangle/circle/line), while semantic controls map to interaction patterns. That division mirrors the AST cleanly. A designer dragging a rectangle is making geometry; dragging a button is making intent. That distinction is useful in Studio and stays faithful to the source language.

The test: if removing the semantic primitive would force you to reconstruct accessibility and behaviour manually, it deserves to stay semantic. `button` passes that test. `heading` does not.

---

## Q2 — Modular interactivity (any primitive can be tappable)

**Verdict: REFINE**

The current operator lean is too permissive as stated, but the counter-position ("buttons only") is too restrictive for a visual builder. So refine, don't hold or flip.

Igni already treats events as orthogonal in places: *"All input primitives (and any layout / component) accept `on tap:` and `on touch:`."* That's an important precedent. Layouts being tappable means the language already rejected the hard semantic-only event model. Extending that to shapes is architecturally consistent.

The problem is accessibility drift. A tappable rectangle with no role is semantically empty. That conflicts with Igni's "visible coupling" philosophy (`shared.` prefix, explicit `bind:`). Interaction should be equally explicit.

My refinement:

**Rule 1:** Any primitive may have `on tap:`.

```igni
rectangle, on tap: save()
```

Valid.

**Rule 2:** If a non-semantic primitive has `on tap:`, it must declare `role:` or accept an explicit compiler-inserted default.

Better shape:

```igni
rectangle, role: button, on tap: save()
```

or compiler warning:

> Interactive shape has implicit `role: button`

Not silent. Visible.

**Rule 3:** Semantic primitives lock their default role.

```igni
button "Save"
```

implicitly `role: button`

Override allowed only for accessibility specialisation, not arbitrary role mutation.

This preserves flexibility without weakening the language's clarity. The current Igni model consistently avoids hidden behaviour (`input bind: shared.X` is rejected because the runtime mechanism would be ambiguous). Same principle here: tappability is fine, but semantic intent must stay source-visible.

Why not FLIP back to "buttons only"? Because Studio changes the problem. Designers will build card-taps, avatar-taps, custom icon targets, image hotspots. Forcing every one into a wrapped `button` is boilerplate — exactly what Igni is designed to erase. The language already values compositional ergonomics (`layout ... on tap:`). Shapes should follow that same rule, with explicit semantic anchoring.

---

## Q3 — v1.0 positioning model: flow-only vs flow + bounded-offset

**Verdict:** HOLD
**Confidence:** HIGH

**Reasoning:**

Flow-only is the right v1.0 constraint. It is deeply consistent with the cheatsheet's philosophy: layouts are directional (`vertical` / `horizontal`), spacing is tokenised, widths are capped with tokens, borders are tokenised, animation is tokenised. The whole language repeatedly rejects arbitrary scalar freedom (`border: 1px` invalid, `max_width: 540` invalid, arbitrary spacing invalid). Offset is the first real breach in that discipline because it introduces positional deltas detached from parent flow.

The counter-position ("flow-only forever") is stronger than it looks. Igni's existing layout model is intentionally declarative and responsive by construction. A `layout vertical` adapts to content and screen size; an offset does not. Even bounded offset (`spacing/1` etc.) introduces a local coordinate system inside a flow model, which creates mental model bifurcation: "does this thing live in flow, or is it visually displaced from flow?" That's the first step toward absolute layout pressure.

The Studio question matters here: what does Studio actually need? Not freeform positioning. Studio needs **flow-aware manipulation**, not pixel-space manipulation. That means:

* reorder children by drag
* adjust `gap:` by dragging spacing handles
* adjust `padding:` by dragging container edges
* resize token-bound sizes (`size:`, `rounded:`)
* align (`start`/`center`/`end`)
* toggle `fill: true`

That is enough to feel canvas-native without introducing positional offsets into the language.

The "designers want to nudge 4px" argument is real, but that is exactly where Studio should resist. Figma trains micro-positioning habits because its model is absolute. Igni's model is flow. Studio should teach Igni, not emulate Figma.

**If REFINE/FLIP:**
No language-level offset. But add a Studio-only interaction primitive: **spacing shim insertion**. If a designer nudges an elemeserts or adjusts `gap:` / wrapper padding rather than generating `offset_x:`.

---

## Q4 — Igni Studio canvas semantics: direct-manipulation vs source-first

**Verdict:** HOLD
**Confidence:** HIGH

**Reasoning:**

Source-first is too weak to justify a product. If Studio is only a render preview plus editor, that's a better IDE extension, not a distinct collaboration surface. The operator's lean is correct: Studio must be a direct-manipulation surface or it has no strategic differentiation.

But "direct-manipulation" must mean **AST-native manipulation**, not visual freeform editing. That's the key distinction. The cheatsheet already defines a constrained, regular AST:

* indentation-scoped blocks
* tokenised properties
* fixed primitive grammar
* no arbitrary expressions in UI shape definitions

That regularity is exactly what makes lossless round-trip plausible.

What currently resists canvas vocabulary? Mostly functions and reactive logic. A canvas cannot meaningfully "draw":

```igni
if user is loading:
```

or

```igni
each item in items:
```

or

```igni
total():
```

These are behavioural AST nodes, not visual ones. That's fine. Studio should treat them as structural containers, not draggable design artefacts. The renderable subset is already implicitly there: primitives, layouts, theme, style tokens.

The biggest v1.0 implication is preserving AST determinism. Studio needs stable node identity. That argues for resisting syntax sugar in v1.0. Every alternate syntax multiplies visual round-trip ambiguity. Igni's "one way to do everything" principle becomes a Studio enabler, not just a readability rule.

Studio should be direct-manipulation, but constrained by language semantics. Dragging a child within a `layout vertical` means reordering source. Dragging padding means mutating `padding:` tokens. Clicking a conditional branch means selecting that branch in the source tree. Not Figma freedom — structured manipulation.

**If REFINE/FLIP:**
Refine direct-manipulation as **flow-native manipulation**:

* reorder children
* wrap/unwrap in layouts
* promote repeated patterns into components
* mutate token properties via handles

No arbitrary x/y placement.

---

## Q5 — Token pair system for coloured primitives (auto-contrast text colour)

**Verdict:** HOLD
**Confidence:** HIGH

**Reasoning:**

Explicit token pairs are the best fit for Igni. They preserve the language's strongest invariant: visible decisions in source. The cheatsheet repeatedly rejects invisible runtime behaviour:

* no inline hex outside `theme:`
* no implicit mutable state wrappers
* explicit `shared.`
* explicit `bind:`
* explicit token systems

Luminance auto-contrast violates that pattern. It's "magic." A button's foreground becomes an invisible runtime derivation from a background value. Worse, luminance ≠ semantic contrast intent. Brand systems often intentionally use off-white, tinted black, or non-max-contrast pairings. Auto-luminance flattens brand expression.

Per-primitive `text_color:` is the opposite failure mode: too much repetition. Igni repeatedly centralises repeated concerns into theme blocks. Making every button carry foreground colour is the same anti-pattern as inline hex colours — local decisions instead of system-level consistency.

Studio strongly benefits from explicit pairs. A canvas can trivially render:

* background token → paired foreground token

That's deterministic and inspectable. A designer clicks `brand`; Studio previews `on_brand`. Clear. Auto-contrast would require live luminance computation and hidden rules, making the visual system less inspectable.

The strongest argument for explicit pairs is dark mode. Igni already has variant theme blocks. Pairing naturally extends into variant resolution:

* `brand`
* `on_brand`

Light and dark can vary together under the existing token-resolution mechanism.

**If REFINE/FLIP:**
Refine naming convention:

* built-ins ship as pairs (`brand` + `on_brand`)
* custom tokens may optionally declare pair inline:

```igni
theme:
  color:
    primary_700: "#1D4ED8"
    on_primary_700: white
```

Compiler rule: any token used as a filled background for semantic controls must have an `on_` companion, or compile error. This preserves explicitness and prevents inaccessible defaults.
