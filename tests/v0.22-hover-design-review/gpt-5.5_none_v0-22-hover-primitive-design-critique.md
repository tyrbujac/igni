## Q1 — Strongest case against Shape B1

The strongest principled case against B1 is that it only *partially* preserves “one way to do everything.”

B1 says:

```igni
hover:
  background: brand

if is_hovered():
  label card.description
```

The defense is: “content conditionals always use `if`; hover only overrides properties.” That is mostly true, but the objection is that **property changes are still runtime conditionals**. `background: brand` under `hover:` is effectively:

> if hovered, use this property value

So B1 does introduce a second state-conditional mechanism. It just limits that mechanism to properties. If Igni’s principle is interpreted strictly as “all runtime UI variation must be expressed through reactive booleans and `if`/ordinary values,” then B1 is not pure.

The sharper “no magic” objection is `is_hovered()`’s implicit receiver:

```igni
if is_hovered():
```

This does not say *what* is hovered. It relies on “innermost enclosing layout” resolution. That is visible in the spec, but not visible in the source. In deeply nested UI, this is exactly the kind of ambient behavior that can become surprising.

A more principled alternative would be a refined C/fifth shape: explicitly expose the hover state from the layout into a local reactive name, then use that name everywhere.

For example, conceptually:

```igni
layout vertical, hover_state: card_hovered, padding: medium:
  hover:
    background: brand

  if card_hovered:
    label card.description
```

This is cleaner than current C’s `bind: hovered`, because `bind:` already means writable data binding. But the underlying idea is stronger than B1 on “no magic”: the hovered layout is explicit, the state name is explicit, and conditional content stays fully inside `if`.

However, that fifth shape has real costs:

- new layout property surface,
- new naming rule,
- possible name collisions in repeated/listed layouts,
- more boilerplate,
- more LLM guessing around what to name and where to bind.

Shape A is the strongest ergonomic alternative, but it is weaker architecturally. It makes `hover:` a second conditional-render form:

```igni
hover:
  label card.description
```

That directly competes with `if`. For Igni, that is a worse violation than B1’s property-only state block.

Shape B2 fixes B1’s implicit receiver problem:

```igni
if is_hovered("card_lift"):
```

But it adds `name:` to layout as a new authoring burden and creates its own ambiguity: names in repeated components, refactors, duplicated cards, and LLM-invented identifiers.

**Score for B1:**

- **One way to do everything:** 7/10. Conditional content remains one-way via `if`, but stateful styling gets its own mechanism.
- **No magic:** 6/10. `hover:` is explicit, but `is_hovered()` has an implicit receiver.
- **Spec budget:** 8/10. Small and teachable.
- **LLM accuracy:** 6/10. Evidence already shows models will likely try Shape A first.

**Verdict: REFINE B1, not flip.**

Keep B1 for v0.22, but tighten the spec language and diagnostics:

1. Error hard when children appear inside `hover:`.
2. Error message should say: “Use `if is_hovered():` outside `hover:` for hover-conditional content.”
3. Document `is_hovered()` with examples showing the innermost-layout rule and the common nesting pitfall.
4. Consider a future explicit-state escape hatch only if real apps show repeated ambiguity.

B1 is not perfect, but among the listed shapes it best preserves Igni’s architectural rule: **rendering conditionals stay in `if`; hover is only a property override block.**

---

## Q2 — Pressure-test of Tyr-locked sub-decisions

### 1. Touch-only platforms: `is_hovered()` always false

This is correct for v0.22.

The important refinement is that the rule should be capability-based, not brand/platform-based. “Touch-only” should mean “no hover-capable pointer is currently available,” not “iOS/Android.” Tablets with trackpads, stylus hover, desktop touchscreens, and browser pointer media queries complicate this by v1.0.

So the v1-safe version is:

> On platforms with no hover-capable pointer, `hover:` is a no-op and `is_hovered()` returns false.

Do not make tap emulate hover. That would violate no-magic and create accessibility confusion.

### 2. Mobile-first vs desktop-first: cookbook, not spec

Correct.

Hover content should be progressive enhancement. The spec should not invent automatic mobile fallbacks. If content is essential, authors must expose it through normal UI: tap, expand, details view, long-press recipe, etc.

This is consistent with no magic.

### 3. Cursor whitelist: `pointer` only

Mostly correct for v0.22, but dangerous if treated as a long-term lock.

`cursor: pointer` covers the highest-confidence case: clickable card/button-like surfaces.

But at v1.0, pointer-only under-serves:

- drag affordance: `grab`, `grabbing`;
- text/edit affordance: `text`;
- disabled affordance: `not-allowed`;
- resize handles if Igni grows editor/layout tooling surfaces.

That said, v0.22 should not add all CSS cursor vocabulary. That would explode the token surface. The right move is to ship `pointer` only, then widen only with cold-test/real-app evidence.

Accessibility note: cursor is not an accessibility primitive. It should not carry semantic meaning. Disabled state, focus state, ARIA-like semantics, and keyboard affordance need their own rules.

### 4. Nested hover rejected at parse

This is correct only if it means:

```igni
hover:
  hover:
    background: brand
```

is rejected.

Since `hover:` is property-only, nested `hover:` blocks should be impossible/invalid.

But the spec must not accidentally ban this:

```igni
layout vertical:
  hover:
    background: card_hover

  layout horizontal:
    hover:
      background: row_hover
```

Nested hoverable layouts are necessary. A card can have a hover state, and a button inside it can also have a hover state. The parse rejection should be specifically “`hover:` cannot appear inside a `hover:` block,” not “hoverable layouts cannot nest.”

### 5. Instant-snap default

This is principled and should hold.

Default smooth hover transitions would be runtime behavior that authors did not write. Igni already chose instant top-level dark-mode switching unless transition is explicit. Hover should follow the same rule.

However, the current recipe may be underpowered if `transition: fade` is the only smoothing vocabulary. “Card lift” usually wants background/shadow/scale easing, not literal fade. If v0.22 ships scale or shadow changes, the transition token may need future widening:

```igni
transition: smooth
```

or similar, instead of overloading `fade`.

But the default should remain instant.

---

## Q3 — Strongest case against Q7 Option α: hover-scoped `scale:`

I would **not ship Option α in v0.22**. My verdict is: **FLIP to β for v0.22, with intent to revisit γ when the transform class is designed.**

Option α:

```igni
hover:
  scale: 1.05
```

looks small, but it is not just another visual property like `background:` or `shadow:`.

### a) It mixes transform semantics with hover semantics

`scale` is a transform. It raises questions that background does not:

- Does it affect layout size or only painting?
- Does it affect hit testing?
- Does it overflow neighboring content?
- Does it clip inside parent layouts?
- Does it affect child coordinate systems?
- Does it interact with rotation later?
- What is the transform origin?
- Does scale compose with future `rotate:` or `translate:`?
- Does transition animate the transform or snap?

If Igni adds `scale:` only inside `hover:`, it creates a strange third class:

1. normal layout properties,
2. hover property overrides,
3. transform-like properties that only exist as hover affordances.

That is architecturally awkward. If `scale` is real, it should eventually be part of a general transform model. If it is not ready as a general transform, it probably should not sneak in through hover.

### b) n=1 evidence is weak for a new primitive token

Pomodonut is valid evidence. It shows authors want button responsiveness. But one real-app instance should not be enough to introduce a transform primitive ahead of the planned stack/wrap/rotation/visual-primitive cycle.

This is especially true because scale is a high-attraction token. Once it exists in one place, LLMs will generalize it:

```igni
layout vertical, scale: 1.2:
```

or:

```igni
image hero, scale: 0.8
```

If those are parse errors, the language becomes less predictable. If they are accepted, v0.22 accidentally pulled transform design forward.

### c) Cleanest shape for “button feels responsive on hover”

For v0.22, use existing safe affordances:

```igni
layout horizontal, background: brand, rounded: medium:
  hover:
    background: brand_dark
    shadow: medium
    cursor: pointer
```

That is enough to ship hover Stage 1.

Long-term, the clean shape is γ, but only after transform design:

```igni
layout horizontal, scale: 1:
  hover:
    scale: 1.05
```

In that future, `hover:` is not special-casing scale. It is simply overriding a normal property.

So my recommendation:

- **v0.22:** do not ship `scale:` in the hover whitelist.
- **Later transform cycle:** add general `scale:` if the transform model is accepted.
- Then allow `hover:` to override it like any other property.

This preserves spec budget and avoids introducing transform semantics through a state-feedback side door.

---

## Q4 — Lexical-scope edge case for `is_hovered()`

The dangerous case is when authors visually think in terms of “the card,” but the source position is inside a deeper layout.

Example:

```igni
layout vertical, padding: medium:          # screen
  layout vertical:                         # scroll/list
    layout vertical, background: card:     # intended hover target: card
      hover:
        background: brand

      layout horizontal:                   # row inside card
        image card.image

        layout vertical:                   # text column
          label card.title

          if is_hovered():
            label card.description
```

The author may intend `is_hovered()` to mean “is the card hovered?” But under B1 it means “is the innermost enclosing layout hovered?” Depending on exact placement, that may be the text column, the row, or the card.

Worst case:

```igni
layout vertical, background: card:
  hover:
    background: brand

  layout horizontal:
    button "Open"

    if is_hovered():
      label "Card preview"
```

If `if is_hovered():` is lexically inside the horizontal row, the preview may only appear when the row is hovered, not when the whole card is hovered. The visual model and lexical model diverge.

Does B2 solve this?

Partially:

```igni
layout vertical, name: card_lift, background: card:
  hover:
    background: brand

  layout horizontal:
    if is_hovered("card_lift"):
      label "Card preview"
```

This removes implicit receiver ambiguity. But it introduces naming ambiguity:

- Are names unique globally, per screen, or per component instance?
- What happens in repeated list items?
- Can every card in a loop be named `card_lift`?
- Does `is_hovered("card_lift")` refer to nearest lexical name, first runtime instance, or all matching instances?
- Do refactors silently break names?
- Will LLMs invent names that do not exist?

So B2 solves one ambiguity by adding another authoring surface.

For v0.22, B1 is acceptable if the cookbook teaches the safe pattern:

```igni
layout vertical, background: card:
  hover:
    background: brand

  if is_hovered():
    label card.description

  layout horizontal:
    image card.image
    label card.title
```

Put the `if is_hovered():` directly under the layout whose hover state you mean.

---

## Q5 — Peer-language survey

### CSS

CSS uses selector state:

```css
.card:hover {
  background: blue;
  transform: scale(1.05);
}

.card:hover .description {
  display: block;
}
```

CSS allows both property changes and descendant reveal under `:hover`. That is closest to Shape A.

But CSS also has a huge selector system, cascading specificity, inheritance, and descendant matching. Igni explicitly does not want that kind of hidden reach. CSS is powerful but not a good north star for Igni’s “one way” constraint.

For hover-scale, CSS treats scale as a general transform:

```css
transform: scale(1.05);
```

It is not hover-only.

### SwiftUI

SwiftUI usually exposes hover as state:

```swift
@State var isHovered = false

Text("Card")
  .background(isHovered ? Color.blue : Color.gray)
  .scaleEffect(isHovered ? 1.05 : 1)
  .onHover { hovering in
    isHovered = hovering
  }
```

Conditional content also uses ordinary state:

```swift
if isHovered {
  Text("Description")
}
```

This is closer to B1/C than A.

For scale, SwiftUI uses a general transform/effect primitive: `scaleEffect`. Hover merely changes the value.

### Jetpack Compose

Compose uses an interaction source:

```kotlin
val interactionSource = remember { MutableInteractionSource() }
val hovered by interactionSource.collectIsHoveredAsState()

Box(
  Modifier
    .hoverable(interactionSource)
    .scale(if (hovered) 1.05f else 1f)
)
```

Again: hover is state/event source; scale is a general modifier.

This is closer to C/fifth-shape explicit state than B1. Compose makes the event source explicit, but that comes with boilerplate Igni probably does not want.

### Framer Motion

Framer Motion has a declarative hover prop:

```jsx
<motion.div whileHover={{ scale: 1.05 }} />
```

This is closest to Shape A for property changes, but not for child rendering. Conditional children would still be React state/render logic.

For hover-scale, Framer treats `scale` as part of the general animation/transform prop family. `whileHover` overrides it during hover.

### Load-bearing pattern

Across peers:

1. Hover is either a selector/pseudo-state or an exposed interaction state.
2. Conditional child rendering generally belongs to the host language’s conditional system.
3. Hover-scale is expressed as changing a **general transform property**, not as a hover-only primitive.
4. Smoothness/animation is usually explicit or part of the animation framework.

The peer survey supports B1’s split more than Shape A for Igni: conditional content should remain ordinary conditional rendering. But the survey argues against hover-only `scale:`. Scale is normally a transform primitive available outside hover too.

---

## Q6 — Principled-minority case for reversal

I already made the principled-minority case against α: do not ship hover-only `scale:` in v0.22. It is a transform primitive entering through the hover side door on n=1 evidence. Tyr should reverse panel consensus on α if consensus forms around “it feels good” rather than “it belongs in the property model.”

The strongest principled-minority case against B1 would be this:

> B1 pretends to preserve “one way to do everything,” but actually creates ambient stateful styling through `hover:` and ambient state lookup through `is_hovered()`. The truly Igni-shaped version should expose hover state explicitly and use ordinary conditionals/properties from there.

That minority would push for a refined C/fifth shape, not current `bind:`:

```igni
layout vertical, hover_state: card_hovered:
  if card_hovered:
    label card.description
```

The argument would be:

- no implicit receiver;
- no hidden lexical hover lookup;
- all runtime state is visible as a named value;
- conditional content remains `if`;
- future states like focus/pressed/active could follow the same model.

I do not think that should block B1 for v0.22, because the explicit-state shape has too much naming/spec surface for Stage 1. But that is the minority objection Tyr should keep alive.

Final recommendation:

- **Hover shape:** HOLD/REFINE B1.
- **Sub-decisions:** mostly hold; clarify nested hover and pointer capability.
- **Scale:** FLIP from α to β for v0.22; revisit γ during transform/rotation design.