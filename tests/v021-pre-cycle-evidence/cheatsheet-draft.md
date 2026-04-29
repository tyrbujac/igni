# Igni cheatsheet — v0.21 pre-cycle evidence draft

**Status (2026-04-29):** Scaffold draft. The full cheatsheet body is `spec/v0.20.1-cheatsheet.md` verbatim — do **not** duplicate it here; the runner injects both the v0.20.1 cheatsheet and the additions below. This file holds only the **proposed additions** for the four pre-cycle candidates.

When run-time prep happens: copy `spec/v0.20.1-cheatsheet.md` body, then append the four sections below into the appropriate cheatsheet locations (Hover near §Reacting; Stack near §Arranging things; Wrap inside §Arranging things; Rotation in a new §Visual transforms section).

---

## §Hover (proposed for v0.21+)

`layout` blocks accept a `hover:` sub-block that overrides properties when a pointing device is over the layout. Renders to no-op on touch-only platforms.

```igni
layout vertical, padding: medium, background: card, rounded: medium:
  hover:
    background: brand
    cursor: pointer
  label "Tap me"
```

**Rules:**

- `hover:` is a sub-block, not a modifier. Indented inside the layout it modifies.
- Properties inside `hover:` override the layout's base properties only while hover is active. They snap back when the pointer leaves.
- `hover:` only takes property-shaped children (`background:`, `border:`, `rounded:`, `cursor:`, `shadow:`). Children primitives (`label`, `button`) are not allowed inside `hover:`.
- On touch-only platforms (mobile), `hover:` is a no-op — base properties hold.

**Reach test:** does the model use `hover:` when the prompt asks for a "card that lights up when you hover over it"?

---

## §Layout stack (proposed for v0.21+)

`layout stack:` is a third layout type alongside `vertical:` and `horizontal:`. Children render at the same position; later children stack visually on top of earlier ones. Z-stack semantics, not coordinate positioning — alignment is via `align:` (start / center / end) and content sizing.

```igni
layout stack, align: bottom_right:
  image "card-bg.jpg"
  label "Featured", padding: small, background: brand, rounded: small
```

**Rules:**

- Children stack in source order. Last child paints on top.
- `align:` accepts the same tokens as `vertical`/`horizontal` plus compounds (`top_left`, `top_right`, `bottom_left`, `bottom_right`, `center`).
- Common use: badge over image, FAB over scrollable content, custom modal overlays.
- No coordinates, no offset modifiers. Alignment is the only positioning vocabulary; if a child needs offset, wrap in `padding:`.

**Reach test:** does the model use `layout stack:` when the prompt asks for a "card with a badge in the corner" or "preview screen with a floating button"?

---

## §Layout wrap (proposed for v0.21+)

`layout horizontal:` accepts a `wrap: true` modifier. Children flow horizontally; when they exceed the available width, the next child starts a new row at the same horizontal alignment.

```igni
layout horizontal, wrap: true, gap: small:
  each tag in tags:
    label tag, padding: small, background: subtle, rounded: full
```

**Rules:**

- Default is `wrap: false` (current behaviour — overflows clip or scroll).
- `gap:` applies both horizontally (between siblings on a row) and vertically (between rows).
- Vertical-layout wrap (`layout vertical, wrap: true`) is **not** a candidate — would require column-overflow semantics that don't translate from Figma's auto-layout. Horizontal-only.

**Reach test:** does the model use `wrap: true` when the prompt asks for a "tag list that flows to the next line if it gets too long" or "chip group filter"?

---

## §Visual transforms (proposed for v0.21+ — honest-no candidate)

Layouts and labels accept a `rotation:` modifier with a token whitelist. Free angles are not supported (spec budget; rare in production app UI).

```igni
label "NEW", padding: small, background: brand, color: white, rotation: 90
```

**Rules:**

- Whitelist: `rotation: 90` / `rotation: 180` / `rotation: 270` — degrees implicit, no unit suffix.
- `rotation:` rotates the rendered element clockwise by the named amount. Layout slot is preserved (the rotated element occupies its pre-rotation bounding box for layout purposes).
- Common use: rotated stamp accents, vertical text on side rails, decorative rotated labels.
- Free angles (e.g. `rotation: 45`) are explicitly rejected at codegen with a "use the whitelist" error.

**Reach test (honest-no):** does the model use `rotation:` on prompts that *could* benefit from it (rotated card stamps, decorative accents)? Operator's prior is **likely demote** — rare in app UI; if 4/4 cells use it the prior was wrong.

---

## End of v0.21 pre-cycle additions

The four sections above sit on top of the v0.20.1 cheatsheet body. The runner sees: v0.20.1 cheatsheet + §Hover + §Layout stack + §Layout wrap + §Visual transforms.

**Pre-cycle context note for the panel:** these sections describe *proposed* shapes. The panel measures cold authorability and reach: which proposed shapes do models naturally adopt when given a card-sender-shaped prompt where the feature would be load-bearing? Adoption rate per candidate determines promotion vs demotion per `README.md` pre-registered bars.

**What the panel does NOT measure:** it does not measure whether the proposed shapes are the *best* shapes (that's Stage 1 design-note work). It only measures whether the candidates earn design-note bandwidth at all.
