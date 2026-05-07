# Gemini 3.1 Pro — v0.22 size-token cold-blind proposal

**Run date:** 2026-05-07
**Session shape:** TBD — operator confirms (one-message / two-message)
**Cheatsheet version:** v0.21.2
**Design note:** docs/private/137_studio_drift_size_token_gaps.md as of 2026-05-07

---

<!-- Paste verbatim model response below this marker. Don't trim, paraphrase, or add operator commentary. -->

### Proposed scale

1. **Named steps (Word tokens):** A 6-step semantic scale.
   * `none` (0 px)
   * `tiny` (4 px)
   * `small` (8 px)
   * `medium` (16 px)
   * `large` (24 px)
   * `full` (Max value / 9999px / 100%)
2. **Numeric scale:** A sparse, value-based companion scale: `px/4`, `px/8`, `px/12`, `px/16`, `px/20`, `px/24`, `px/32`. (Rather than an abstract index-based multiplier like `scale/3`, it explicitly states the pixel value to match a designer's mental model from Figma).

### Special-case decisions

* **Zero-value token:** ADD. Name: `none`. Reason: Flattening default layout properties (removing gap or padding) is a constant, explicit designer action; `gap: none` reads perfectly.
* **Max-value for `rounded:`:** ADD. Name: `full`. Reason: Pill-shaped buttons and circular avatars are fundamental UI primitives; relying on a massive numeric token like `px/999` is an anti-pattern.
* **Extension tokens:** ADD. Name: `tiny`. Reason: 8px, 16px, and 24px cover the macro-rhythm, but designers frequently need a micro-rhythm (4px) for tight component groupings (e.g., an icon next to text).

### Justification

The 6-step word scale (`none`, `tiny`, `small`, `medium`, `large`, `full`) is specifically engineered to map 1:1 onto the six-button segmented control shown in the Igni Studio Properties panel mock (`[ ? │ ? │ ? │ ? │ ? │ ? ]`). This creates a complete, closed loop for the designer's most common layout intents. By using full English words instead of utility-CSS abbreviations (`sm`/`md`/`lg`), the DSL avoids looking like markup and instead mirrors the native vocabulary found in Figma's auto-layout and typography panels. In a visual tool, clicking a button labeled `[ Small ]` feels polished; clicking `[ sm ]` feels like editing code.

Crucially, this scale maintains strict uniformity and semantic coherence across all four target properties. `padding: small` and `gap: medium` are obvious layout instructions. `rounded: full` elegantly handles the pill-button use case without introducing a property-specific exception. While `size: none` is a slight edge case (effectively rendering an object 0x0), it is a valid structural constraint, and `size: full` intuitively implies filling the available container space (100%), matching standard design-tool expectations.

For the numeric scale, a value-based syntax (`px/12` or `pt/12`) is significantly more ergonomic for a Figma-native designer than an index-based multiplier (`scale/3`). Designers work in explicit pixel values when translating from a canvas. Forcing them to divide by 4 to find the correct token introduces unnecessary cognitive friction. A sparse, whitelisted pixel scale gives them the exact precision they need for specific specs, while the 6-button semantic scale handles 80% of their rapid-layout intent.

### Honest-no reaction

**Partial revise.**
I would adopt the canonical full-word `small / medium / large` nomenclature, as it successfully avoids the Tailwind abbreviation trap. However, I would strongly hold my ground against the canonical scheme's omission of a zero token and a max-value token. If the UI panel has exactly 6 slots, `small/medium/large` leaves three slots awkwardly empty or forces the UI to mix semantic and numeric concepts. Furthermore, omitting a semantic way to achieve a pill shape (`rounded: full`) or strip spacing (`gap: none`) forces the designer to fall back on numbers, defeating the purpose of a "semantic shortcut."

Regarding `spacing/1..8`: I would reject the index-based approach. A core tenet of the "designer-lean" frame is matching the user's mental model. Designers think in "12px", not "4px multiplied by 3." If the scale is sparse anyway, exposing the final value (`spacing/12`) is infinitely more native to a Figma workflow than forcing mental math (`spacing/3`).

### Confidence
HIGH
