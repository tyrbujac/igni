## 1 — Token naming

I mostly agree with `phone` / `tablet` / `desktop` as the strongest zero-shot set among the options listed.

An LLM trained on web, Flutter, Material, Tailwind, and Bootstrap is likely to have several competing instincts:

- CSS/Tailwind instinct: `sm` / `md` / `lg` / `xl`
- Material/adaptive-layout instinct: mobile / tablet / desktop, or compact / medium / expanded
- Plain-language UI instinct: phone / tablet / desktop
- Purpose instinct: card / reading / wide / full

For Igni, the plain-language device names are probably the best fit. `sm` / `md` / `lg` / `xl` are familiar, but they are also overloaded: in Tailwind, `sm` can mean breakpoint, font size, shadow size, border radius, max-width, etc. Igni deliberately avoids that kind of compact aliasing. `phone` / `tablet` / `desktop` read better in code and are less likely to be confused with existing `small` / `medium` / `large` spacing tokens.

The main downside is real: `phone` does overcommit slightly to device metaphor. A 480px-wide card inside a desktop dashboard is not “phone” in intent; it is “narrow” or “card-sized.” But I do not think that is fatal. The token name is a mnemonic for a width class, not a claim that the UI is literally a phone screen. In practice, design systems already use device metaphors this way.

I would mildly prefer `mobile` over `phone` if the goal is closer alignment with Material-style language, but `phone` is more concrete and probably more immediately guessable. I would not choose semantic-purpose names like `card` / `reading` / `wide` / `unbounded` yet, because they invite argument about purpose: is a modal `card`, `reading`, or `wide`? Device-size names are imperfect, but they are stable.

## 2 — Pixel ladder

`480 / 768 / 1200` is a defensible first ladder, but it is not perfect.

Common UI patterns:

- **Phone/card/modal-ish layout:** `phone: 480` works well. It is a good cap for MiCard, login cards, profile cards, and compact form panels.
- **Article body:** `tablet: 768` is usable, but slightly wide for long-form reading. Many article bodies want something closer to 640–720px depending on font size. Still, 768 with padding is acceptable.
- **Modal width:** many modals land around 480–640px. `phone` may be a bit narrow for a rich modal; `tablet` may be a bit wide. This is probably the largest practical gap in the ladder.
- **Sidebar:** sidebars often want 280–360px. None of these tokens snap cleanly, but this may be a future `width:` problem more than a `max-width:` problem.
- **Dashboard column/panel:** `tablet` and `desktop` are plausible. A main content column capped at 1200px is common.
- **Marketing hero:** `desktop: 1200` is a standard content max. Some marketing pages want 1440 or 1600, but “uncapped” plus internal layout may be enough for v0.13.

I would not add `wide: 1600` now. A 1600 cap mostly matters for large marketing pages, dense dashboards, or cinema-style layouts, and omission already gives “use the viewport.” If anything, the stronger missing value is below or between the existing tokens: something like 360 or 640. But adding either immediately complicates the story.

Given the project’s 3–5-per-dimension rule, I think the capped ladder should stay at three values for now: 480, 768, 1200. If Stage 3 or later app work shows repeated friction, I would rather add one evidence-backed token later than preemptively expand the set. The likely future candidate would be a `compact`/`narrow` value around 360 or a `reading`/`content` value around 640, but neither has enough motivation in this note.

## 3 — `full` token necessity

I think `full` should probably be removed.

The argument for `full` is understandable: it makes intent explicit. A reader can distinguish “the author forgot to constrain this” from “the author deliberately wants no cap.” That is a real code-review benefit, and CSS/Tailwind has similar ideas like `max-w-none`.

But in Igni, that argument is weaker because “one way to do everything” is load-bearing. If both these mean the same thing:

- omit `max-width:`
- write `max-width: full`

then the language now has two valid spellings for “no max width.” That is exactly the kind of branch Igni is trying to avoid. An LLM can now gratuitously emit `max-width: full`, and reviewers have to decide whether to keep it, remove it, or treat it as meaningful documentation.

Also, `full` is semantically odd as a `max-width` value. The other tokens produce constraints. `full` produces no constraint. That makes it more like a reset than a width token.

I would keep `full` only if Igni has, or soon expects to have, inheritance/style presets/component defaults where an explicit reset is required. For example, if a component template imposed `max-width: phone` and a call site needed to override it, then `max-width: full` could earn its keep. But if there is no cascade or inherited layout modifier, omission should be the one canonical form.

So my recommendation: ship `phone` / `tablet` / `desktop`; omit `full` for v0.13. If a future reset mechanism needs `full`, introduce it then with that specific motivation.

## 4 — `fill: true` × `max-width:` composition

The note is directionally right that these should compose, but the spec needs more explicit semantics.

The intended meaning of `fill: true, max-width: tablet` should be: “participate in available-space allocation, but never render wider than 768px.”

That implies:

**a) Parent wider than 768px**

The child can grow up to 768px, then stops. Any remaining space stays with the parent layout. Depending on the parent’s `align` / `spread` semantics, that leftover space may appear after the child, around the child, or be distributed between siblings. The capped child should not stretch to 1200 just because the parent has room.

**b) Parent narrower than 768px**

The max-width is effectively a no-op. The child can fill the available width, because the available width is already below the cap. So a 500px-wide parent gives the child at most 500px, not 768px.

**c) Siblings with other `fill: true` children**

This is the ambiguous case. Suppose a horizontal parent has two fill children, one capped at `tablet` and one uncapped. Does the parent first split space equally, then cap the first child and leave the leftover unused? Or does it cap the first child and redistribute the remaining space to the uncapped fill sibling?

The spec should choose one. I would recommend CSS-flex-like semantics: fill siblings grow equally until one hits its max-width; capped siblings freeze; remaining space is redistributed among uncapped fill siblings. If all fill siblings are capped and there is still leftover space, the leftover belongs to the parent and is handled by parent alignment/spread.

The spec should also clarify whether `max-width` includes padding/background/rounded container bounds. I think it should cap the outer rendered layout box, including padding and background. Otherwise authors will be surprised when `max-width: phone, padding: large` visually exceeds 480px.

## 5 — Shape C rejection

I agree with rejecting numeric `max-width:` for v0.13.

The strongest counter-argument is real-world design fidelity. Designers hand off specs like 360px sidebars, 560px modals, 640px article bodies, 1440px page containers. If Igni only offers 480 / 768 / 1200, developers will sometimes feel forced into an obviously approximate choice. That can make the language feel toy-like or stubborn, especially for desktop apps where layout precision matters more.

But I do not think that counter-argument wins yet. Igni’s thesis is not “all possible UI specs can be represented with exact fidelity.” It is “common UI intent should be expressible in a bounded, learnable, LLM-reliable vocabulary.” Numeric values are not a small escape hatch once admitted. They become the path of least resistance. Models trained on CSS will often emit `max-width: 600`, `640`, `720`, `1024`, etc., and each value will look reasonable. That reintroduces the exact variance the token system is meant to eliminate.

If evidence later shows that the ladder is insufficient, the better response is not `max-width: 540`; it is a new token with a documented motivation. For example, repeated modal/article friction might justify a `reading` or `content` token around 640. Repeated login/form friction might justify `compact` around 360. That preserves the token-first discipline while letting the design system evolve from observed pressure.

So the rejection is defensible long-term only if the project remains willing to add or adjust tokens based on evidence. “No numeric escape hatch” should not mean “the initial three widths are sacred forever.” It should mean “new width needs become new language-level tokens, not arbitrary per-callsite numbers.”