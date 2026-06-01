## Short verdicts

- **Q1:** **KEEP SEPARATE.** `screen` is a route/lifecycle/chrome boundary; `layout` is an auto-layout container. Merging them creates exactly the context-sensitive syntax Igni is trying to avoid.
- **Q2:** None of A/B/C should ship as written. **B is the least bad**, because it at least makes semantics visible and rejects plain tappable layouts, but it relocates aliasing into `role:`. I would ship a fourth option: **semantic interactive primitives only** — `button` for actions, `link` for navigation, inert visual shapes for decoration, and no generic `on tap:` on arbitrary visible primitives.
- **Hypothesis:** Directionally right, but slightly incomplete. The worst failure is not only “two source forms with identical output”; it is also “source forms that look visually interchangeable but produce different accessibility semantics.” That is not aliasing by the strict definition, but it is still an LLM-accuracy and accessibility trap.

---

# Q1 — Should `screen` and `layout` merge?

## Verdict: **KEEP SEPARATE**

Do not merge `screen` and `layout`.

The architectural distinction is real:

- `screen` is a **route / page / lifecycle / lexical-reactivity boundary**.
- `layout` is a **Figma-style auto-layout frame**.
- `screen` owns things like `title:`, app chrome, navigation identity, parameters, screen-local state, `every` blocks, and functions.
- `layout` owns direction, child arrangement, `gap:`, `padding:`, `fill: true`, `hover:`, `transition:`, and visual grouping.

Those are not two spellings of the same thing. They are different semantic categories.

The current overlap — especially `background:` and `max_width:` — is a smell, but merging is the wrong fix. It turns a small property overlap into a large context-sensitive primitive.

## Q1a — `max_width: phone`

If `screen` and `layout` merge, `max_width: phone` becomes context-sensitive.

At top level it means something like:

> cap the page content within the viewport.

Nested, it means:

> cap this layout box within its parent’s layout algorithm.

Those are not identical operations. A top-level page cap interacts with viewport, app chrome, screen background, and perhaps app bar/title behavior. A nested layout cap interacts with sibling allocation, `fill: true`, row/column direction, and parent constraints.

So a merged primitive forces one of three bad outcomes:

1. **Same property, different meaning by position.**  
   Bad for the hypothesis. The reader/LLM must know whether this is the root use or nested use.

2. **New property for top-level behavior**, e.g. `content_max_width:`.  
   That avoids ambiguity but proves the merge did not actually simplify the language.

3. **Drop the screen-level meaning.**  
   Then existing “page content cap” use cases migrate to a root layout, which is fine — but again that argues for sharper separation, not merge.

My preference for v0.23: keep `screen`, keep `layout`, and seriously consider making `max_width:` **layout-only**. Then the canonical page-width shape is explicit:

```igni
screen Home:
  layout vertical, max_width: phone, padding: large:
    label "Home", style: heading
```

That removes the near-alias between:

```igni
screen Home, max_width: phone:
  layout vertical:
    ...
```

and:

```igni
screen Home:
  layout vertical, max_width: phone:
    ...
```

If screen-level `max_width:` remains, the spec must document that it is page-chrome/content behavior, not ordinary layout behavior. But that still leaves an LLM branch.

## Q1b — `fill: true`

`fill: true` is the clearest reason not to merge.

Today it is meaningful on `layout`:

```igni
layout vertical:
  label "Header"
  layout vertical, fill: true, align: center:
    label "Centered in remaining space"
```

It means:

> expand this layout to fill remaining space along the parent’s main axis.

A top-level `screen` has no parent main axis. So if `screen` and `layout` merge, `fill: true` must become one of:

1. **A no-op at top level.**  
   Violates “no magic.” Source says something happens, but nothing happens.

2. **Parse-rejected only at top level.**  
   Same syntax is legal or illegal depending on nesting position. That is exactly the harmful context-sensitive branch the design hypothesis warns about.

3. **Given a special screen-level meaning.**  
   Worse. Now `fill: true` means different things depending on whether the same primitive is root or nested.

Keeping `screen` and `layout` separate avoids this cleanly. `fill: true` remains a `layout` participation property.

## Q1c — single-vs-multi-child rule

A merged primitive has no good child rule.

If the merged primitive takes **one child only**, every screen needs a wrapper. That is verbose but simple.

If it takes **many children**, screens become implicit layouts. That recreates the current cheatsheet ambiguity:

```igni
screen Hello:
  label "Hello, World!"
```

versus:

```igni
screen Todo:
  layout vertical, gap: medium, padding: large:
    ...
```

The cheatsheet currently says “screen bodies stack vertically by default,” which is convenient but semantically suspicious. It means `screen` is secretly doing layout work.

For v0.23, I would sharpen the rule:

```igni
screen Home:
  layout vertical, padding: large:
    label "Home"
```

That is more verbose than the current Hello World, but it is more canonical. The screen contains screen declarations/state/functions plus exactly one render body. The body’s layout is explicit.

If Igni wants absolute one-way structure, remove “screen bodies stack vertically by default.” That default is an implicit layout.

## Q1 conclusion

**Keep `screen` and `layout` separate.**

But do not merely preserve v0.22 as-is. Tighten it:

- `screen` should be a route/chrome/reactivity boundary.
- `layout` should be the only auto-layout container.
- Avoid root-vs-nested property meaning where possible.
- Consider moving `max_width:` to `layout` only.
- Remove implicit vertical stacking from `screen` if the goal is strict one-way source shape.

---

# Q2 — Options A/B/C

## Option A — Universal `on tap:` + `rectangle`

Reject as written.

`rectangle` as an inert visual primitive may be reasonable, especially under Path C / Figma vocabulary. But universal `on tap:` is the wrong direction.

This creates too many ways to express “user activates something”:

```igni
label "Save", on tap: save()
image "save.png", on tap: save()
rectangle color: brand, on tap: save()
layout vertical, on tap: save():
  label "Save"
button "Save", on tap: save()
```

Those are not equivalent accessibility trees, but they are visually substitutable enough that an LLM will guess wrong. HTML will punish this harder than Flutter.

A clickable `label` is almost never the right semantic primitive. If it performs an action, it is a button. If it navigates, it is a link. If it toggles state, it may be a checkbox/toggle/radio-style control. Universal tap makes the wrong thing easy.

## Option B — `role:` on `layout`

Better than A, but still reject as written.

The good part:

```igni
layout role: button, on tap: save():
  label "Save"
```

is at least source-visible. It says: “this layout is semantically a button.”

The bad part is that it aliases the existing primitive:

```igni
button "Save", on tap: save()
```

and:

```igni
layout role: button, on tap: save():
  label "Save"
```

Those are now two source-level ways to author a button.

Also, HTML already has native `<button>` and `<a>`. Igni should not expose “ARIA role on div” as the primary authoring model when a native semantic element exists. `role:` is target-level vocabulary leaking into Igni.

`role: card` is especially suspicious. “Card” is usually a visual pattern, not an accessibility role. If a card opens detail, it is a link. If it selects something, it is a button or checkbox-like control. If it is just a container, it is a layout.

## Option C — Expand `button`

Partially useful, but incomplete.

Expanding `button` styling helps with one real need: custom visual buttons. But Option C leaves the larger semantic problem untouched because `on tap:` remains legal on `layout` and components.

So authors still have both:

```igni
layout vertical, padding: medium, background: card, rounded: medium, on tap: open():
  label "Open"
```

and:

```igni
button "Open", on tap: open()
```

That is the HTML problem. Flutter can paper over it with `GestureDetector`, `InkWell`, or `Semantics`. HTML cannot. `<div onclick>` is not equivalent to `<button>`.

Also, a `body:` slot on `button` risks creating another alias:

```igni
button "Save", on tap: save()
```

versus:

```igni
button body:
  label "Save"
```

If both are legal and equivalent, the language has created an LLM branch.

## Recommended fourth option: semantic interactive primitives only

Ship a semantics-first model:

1. `layout`, `label`, `image`, `icon`, `rectangle` are **not tappable**.
2. `button` is the primitive for actions.
3. Add `link` as the primitive for navigation.
4. User components expose semantic events via `emit`, not by becoming tappable containers.
5. `rectangle` may exist, but it is inert decoration, not an interaction primitive.

Example action:

```igni
button horizontal, gap: small, padding: medium, background: brand, rounded: full, on tap: add():
  icon "plus", color: white
  label "Add", color: white
```

Example navigation card:

```igni
link to ProductDetail product, vertical, gap: small, padding: medium, background: card, rounded: medium:
  image product.image, size: 120
  label product.name, style: title
  label product.price
```

Example decorative rectangle:

```igni
rectangle color: brand, width: 120, height: 4, rounded: full
```

Component example:

```igni
component ProductCard(product):
  link to ProductDetail product, vertical, gap: small, padding: medium, background: card, rounded: medium:
    image product.image, size: 120
    label product.name, style: title
    label product.price
```

For an action card:

```igni
component SelectableCard(product):
  button vertical, padding: medium, background: card, rounded: medium, on tap: emit select product:
    label product.name, style: title
    label product.price

# parent
SelectableCard product, on select(p): selected = p
```

That keeps the semantic root visible. The component is not magically tappable; it contains a semantic interactive primitive.

HTML codegen sketch:

```html
<button type="button" class="ig-button ig-row ig-gap-small ig-bg-brand ig-rounded-full">
  <span class="ig-icon">plus</span>
  <span>Add</span>
</button>
```

```html
<a href="/product/123" class="ig-link ig-col ig-bg-card ig-rounded-medium">
  <img src="..." />
  <span class="ig-title">Desk Lamp</span>
  <span>£40</span>
</a>
```

```html
<div class="ig-rectangle ig-bg-brand ig-rounded-full" aria-hidden="true"></div>
```

Flutter codegen sketch:

```dart
Semantics(
  button: true,
  child: Material(
    color: brand,
    borderRadius: BorderRadius.circular(...),
    child: InkWell(
      onTap: add,
      child: Row(
        children: [
          Icon(...),
          Text("Add"),
        ],
      ),
    ),
  ),
)
```

```dart
Semantics(
  link: true,
  child: InkWell(
    onTap: () => navigateTo(ProductDetail(product)),
    child: Column(
      children: [
        Image(...),
        Text(product.name),
        Text(product.price),
      ],
    ),
  ),
)
```

This is more verbose than universal `on tap:`, but it is much more learnable: if it activates an action, use `button`; if it navigates, use `link`; if it only arranges things, use `layout`.

---

# Q3a — Does Option A create harmful aliasing?

Strictly, `label "X", on tap: f()` and `button "X", on tap: f()` are **not semantic aliases** under the hypothesis, because their accessibility trees differ.

But that does not make Option A acceptable.

It creates a worse practical problem: visually similar source can produce semantically different UI. An LLM prompted with “make the text tappable” may emit a tappable label when the correct semantic element is a button or link.

So the issue is not “identical semantics under two spellings.” The issue is “wrong semantics are too easy to spell.”

For Igni, a clickable label should not be a normal surface. If the text performs an action, it is a `button`. If it navigates, it is a `link`.

---

# Q3b — Does Option B solve aliasing or relocate it?

It mostly relocates it.

This pair is the problem:

```igni
button "Save", on tap: save()
```

versus:

```igni
layout role: button, on tap: save():
  label "Save"
```

Both express button semantics. One uses a button primitive; one uses a layout plus role. That is exactly a source-level branch.

Even worse, on HTML the better implementation is native `<button>`, not `<div role="button">`. If Igni maps `layout role: button` to `<button>`, then the alias is even more direct. If it maps to `<div role="button">`, Igni is encouraging an inferior target shape.

`role:` is useful as a low-level escape hatch in HTML. Igni should not make it a primary authoring primitive.

---

# Q3c — Does Option C solve the need?

Only partly.

It solves “I need a better-looking button.” It does not solve:

- tappable cards,
- navigation links,
- custom list rows,
- HTML-native semantics,
- the fact that `layout on tap:` already exists.

Expanding `button` is useful if and only if Igni simultaneously removes generic tap from non-semantic containers.

The `body:` issue is subtle. A `button` body slot is not inherently bad. Custom components are also not inherently bad. Igni cannot ban abstraction; a user-defined `PrimaryButton` component will always be able to wrap a canonical primitive.

The bad redundancy is language-level redundancy:

```igni
button ...
```

versus:

```igni
layout ..., on tap: ...
```

for the same semantic intent.

So Option C should not be the whole answer. At best, it is one piece of the fourth option: make `button` expressive enough that authors do not need tappable layouts.

---

# Q3d — How does HTML change the calculus?

HTML argues for **more semantic primitives and fewer generic escape hatches**.

Not more visual primitives for every tag. Not `role:` everywhere. But Igni should have first-class source forms for genuinely distinct interactive semantics:

- action → `button`
- navigation → `link`
- text input → `input`
- boolean input → `toggle` / `checkbox`
- range input → `slider`
- selection input → `dropdown`

Future features like disclosure, modal dialog, menu, tabs, or details should become primitives only when Igni supports those semantics directly. They should not be encoded as arbitrary tappable layouts with roles.

Flutter makes it easy to wrap anything in a gesture detector and patch semantics later. HTML makes that sloppiness visible. `<button>` and `<a>` carry behavior, keyboard handling, focus behavior, form behavior, and accessibility expectations. Igni should compile from semantic source to native target semantics, not infer semantics from arbitrary event handlers.

So HTML does not argue for fewer primitives globally. It argues for fewer **generic** primitives and more **semantic** primitives where the semantics are real.

---

# Q3e — Fourth option

## Option D: interaction is semantic, shapes are inert

Concrete rules:

1. `on tap:` / `on touch:` are legal only on semantic interactive primitives:
   - `button`
   - `link`
   - input-family primitives where appropriate
2. `layout` cannot take `on tap:` directly.
3. `label`, `image`, `icon`, `rectangle` cannot take `on tap:`.
4. Components do not become tappable by default. They emit named semantic events using existing `emit`.
5. Add `link` before the HTML backend ships.
6. `rectangle` may be added, but only as a non-semantic visual primitive.

Canonical examples:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large:
    label count, style: heading

    button horizontal, padding: medium, background: brand, rounded: medium, on tap: count = count + 1:
      label "Add", color: white
```

```igni
screen Products:
  products = fetch("/api/products")

  layout vertical, gap: medium, padding: large:
    if products is loading:
      spinner
    else:
      each product in products:
        link to ProductDetail product, horizontal, gap: medium, padding: medium, background: card, rounded: medium:
          image product.image, size: 64
          layout vertical:
            label product.name, style: title
            label product.price
```

```igni
component Pill(text):
  layout horizontal, padding: small, background: subtle, rounded: full:
    label text, style: caption
```

```igni
component SelectablePill(text):
  button horizontal, padding: small, background: subtle, rounded: full, on tap: emit select text:
    label text, style: caption
```

The non-interactive and interactive versions differ at the semantic root. That is good redundancy: same visual vocabulary, different accessibility semantics.

## Strongest objection to Option D

The strongest objection is ergonomics:

```igni
button "Save", on tap: save()
```

is much nicer than:

```igni
button horizontal, on tap: save():
  label "Save"
```

That objection is real. Igni’s current button shape is excellent for tutorials and small examples.

But allowing both the string shorthand and arbitrary button bodies creates an alias:

```igni
button "Save", on tap: save()
```

versus:

```igni
button horizontal, on tap: save():
  label "Save"
```

If Igni is serious about “one way to do everything,” the block form should win because it scales to icon buttons, card buttons, and composite buttons without introducing a second content slot.

If the project decides the text-button shorthand is too valuable to lose, then document that as an intentional exception — but do not pretend it is free. It is a real LLM branch.

---

# Principled minority objection worth surfacing

If everyone agrees too quickly on “keep `screen` and `layout` separate,” the strongest minority case is:

> The current `screen` already behaves like a root layout in the cheatsheet. It stacks children vertically, accepts `background:`, accepts `max_width:`, and can directly contain `label`. Maybe the honest model is that a screen is just the root layout.

That objection correctly identifies a v0.22 inconsistency.

But the fix is not to merge. The better fix is to make `screen` **less layout-like**, not more:

```igni
screen Home:
  layout vertical, padding: large:
    label "Home"
```

`screen` should declare the page. `layout` should arrange the page. That is the cleaner semantic split.