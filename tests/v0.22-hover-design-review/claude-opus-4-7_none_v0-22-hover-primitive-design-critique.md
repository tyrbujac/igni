# Panel response: v0.22 hover primitive

## Q1 — Strongest case AGAINST Shape B1

**Verdict: HOLD B1, but with a sharper rationale than the design note offers.**

The strongest case against B1 is the "one way" violation hidden in plain sight: B1 ships *two* mechanisms that produce visible-change-on-hover. Shape A would produce one. The note's defense — "conditional content always via `if`; property overrides via `hover:`" — frames this as orthogonal axes, but from the author's POV at the keystroke moment, the question is "what happens when the user hovers this card?" and B1 answers it in two indented blocks at sibling positions. That's a branch where an LLM can guess wrong: does the model emit the property override under `hover:` or under `if is_hovered():` (where it would also work, because reactive re-evaluation handles property-shaped children inside `if` just fine)? B1 needs to make the *narrower* form (`hover:`) **mandatory** for the property-override case to keep the count at one — i.e., "if it's a property override on hover state, it MUST go in `hover:`, not in `if is_hovered():` even though the latter would render correctly." That's a parse-time rule the design note doesn't explicitly commit to. Without it, B1 is a two-way shape.

But: even with that rule added, B1 is still principled-correct, and here's why Shape A loses harder. Shape A's *real* sin isn't conflating render-with-override (the note's framing). It's that Shape A makes hover the **only** primitive in Igni where children render conditionally without an `if`. That's the no-magic violation: an author looking at `hover:` with a `label` child cannot tell, without knowing the hover rule specifically, that the label's rendering is gated. Igni's whole conditional-render contract is "search for `if`." Shape A breaks that contract for one keyword. B1's two-block shape makes the gate visible at the cost of slight redundancy — and "cause visible in source" is the harder principle to recover once lost. Ergonomics can be patched in v0.23; principle erosion can't.

C is dead on arrival for the reason the note gives (read-only `bind:` widens semantics, naming pass needed). B2 is strictly worse than B1 at shallow nesting and only pulls ahead at deep nesting — which Q4 below argues is rare enough not to pay for upfront.

**Required refinement to B1:** add a parse rule that property-shaped overrides MUST appear in `hover:` and not under `if is_hovered():`. Without it, B1 leaks into a two-way shape.

## Q2 — Sub-decision locks

**Touch-always-false (Q2): correct.** Composes cleanly with `if`, no surprise.

**Cookbook-not-spec (Q3): correct.** Spec rule here would be a magic-progressive-enhancement framework — wrong layer.

**Cursor-pointer-only (Q4): under-served, but right for v0.22.** The honest gap is `text` (edit affordance over editable surfaces) and `not-allowed` (disabled-button affordance). Drag affordance (`grab`/`grabbing`) is a genuine miss — drag is a v0.23+ surface anyway, so the cursor token can land with it. A11y cues: `not-allowed` is the load-bearing one because Igni already has disabled-button surfaces today; an author wanting to signal "this button is disabled" has *no* cursor token in v0.22. **Recommend: add `not-allowed` to v0.22 whitelist alongside `pointer`.** Two tokens, both grounded in shipped surfaces. `text`/`grab` defer cleanly.

**No-nesting (Q5): correct.** Nested hover is a CSS pathology Igni has the chance to never inherit.

**Instant-snap default (Q6): WRONG.** This is the lock most likely to break at v1.0. The note's appeal to "v0.20 dark-mode top-level theme switch rule" is a category error: theme-switch is a global state mutation where snap is desirable (transition-during-theme-switch is the well-known CSS antipattern). Hover is a local interaction where the most common shape — the gallery card lift, which is literally Source 1 of the evidence panel — *expects* smoothness. Authors will write `transition: fade` on every hover-using layout, which makes the default the wrong default. The principled fix is `transition: hover` as default for `hover:`-bearing layouts (a short, ~120ms ease for property-only changes), with `transition: none` as the explicit opt-out. That's still one-way (the transition is determined by the presence of `hover:`), still no-magic (visible in the spec), and matches the load-bearing case. **HOLD-with-flip recommended on Q6.**

## Q3 — Scale-in-whitelist, anti-anchored on α

**Verdict: FLIP to β for v0.22; revisit when transform-class lands.**

(a) **Yes, α mixes spec-classes.** This is the load-bearing objection. "Property override" is a value-flip on an existing property. "Child render" is a structural gate. Hover-scoped `scale:` is a *third* thing: a transform-class property that exists *only* in hover scope and nowhere else in the language. That's a spec smell. Igni doesn't have any other property that exists in one scope and not another — `background:`, `border:`, `rounded:` all work identically in base and hover. `scale:` would be the first scope-restricted property, which is a new spec-class disguised as a whitelist entry. The note's framing ("hover-scoped only, 1 token in 1 whitelist") under-counts the cost: it's not 1 token, it's a new dimension on the property model.

(b) **n=1 for scale doesn't justify spec budget under Igni's own evidence rules.** The note explicitly distinguishes "n=2 cross-source for hover" from "n=1 for scale-in-whitelist" — and then proceeds to lean α anyway. That's the panel's job to flag. If n=1 from a retrospective-identified gap (Pomodonut shipped without it; Tyr noticed afterward) is the bar, the spec budget will inflate fast. The honest read: Pomodonut's button feels less responsive without scale, but the panel's own evidence threshold (n=2 cross-source) hasn't been met.

(c) **Cleanest shape: β for v0.22, then γ-shaped resolution in the transform-primitive cycle (v0.23+ stack/wrap/rotation).** Rotation is *also* a transform. Scale and rotation should land together in the transform-primitive design, not piecewise via hover-whitelist. β isn't "do nothing" — it's "wait for the transform-class design, where scale lives alongside rotation as a coordinate-system primitive available in both base and hover scope." That defers the spec-class question to the cycle that's already going to answer it.

The Pomodonut case is real, but the right response is to delay v0.22's hover ship from "the polished hover" to "the principled hover" and let the v0.23 transform cycle complete the picture. Shipping α now creates a one-property-deep-only-in-hover precedent that the transform cycle will have to either preserve (weird) or migrate away from (breaking change).

## Q4 — Lexical-scope edge case

Worst case: a card inside a list inside a scroll inside a screen, where the *card* has a hover and the *list row* has a hover (e.g., row-level highlight when hovering anywhere in the row, plus card-level lift when hovering the card itself). Author writes `if is_hovered():` inside the card meaning "when the card is hovered" — gets it. Author writes `if is_hovered():` inside the row but outside any card meaning "when the row is hovered" — gets it. Author writes `if is_hovered():` inside the card meaning "when the row is hovered" (to drive a card-level visual that depends on row-level hover state) — **silently gets card-hover instead, with no error.** The shadowing is invisible because both layouts have hover state and both resolutions parse cleanly.

B2 (named binding) does *partially* solve this — `is_hovered("row_name")` is unambiguous. But it shifts the failure mode: the author has to know the parent's `name:` value, which means hover-aware children are coupled to ancestor naming choices. Refactoring an ancestor's name silently breaks descendants. So B2 trades shadowing-ambiguity for naming-coupling, which is arguably worse for refactor safety.

**The actually-clean fix isn't B2 — it's a parse-time warning in B1 when `is_hovered()` is used inside a layout whose ancestors *also* have `hover:` blocks.** "Ambiguous `is_hovered()`: enclosing layout and ancestor at line N both define hover. Move the `if` block into the layout you mean, or split the layout." This catches the worst case at parse time without paying the B2 naming tax. Recommend B1 ship with this lint.

## Q5 — Peer-language survey

The load-bearing pattern across the survey is **scale-on-hover is universally treated as a transform-property-with-hover-trigger, not a hover-only affordance.** CSS: `transform: scale()` lives in base, `:hover { transform: scale(1.05) }` overrides. SwiftUI: `.scaleEffect()` lives on any view, `.onHover` toggles state that drives it. Compose: `Modifier.scale()` is base-available, hover state from `interactionSource` drives it. Framer Motion: `scale` works in `animate`, `initial`, `whileHover`, `whileTap` — same property, multiple triggers. **Not one peer framework scopes scale to hover.** This is a strong signal that α's "scale exists only in hover" is an Igni-specific oddity, not a peer-validated shape.

The peer-language shape Igni hasn't considered: SwiftUI's `.onHover { isHovered in ... }` closure-with-binding is essentially Shape C done right — the binding is *introduced by* the hover modifier, not a layout property. Igni-ified, that'd be: `hover as h:` introducing `h` as a reactive bool in the layout's scope. This avoids the "innermost enclosing" ambiguity of B1 and the naming-coupling of B2 and the read-only-bind semantic widening of C. It does cost one new binding form, which is non-trivial spec budget. Worth flagging as a fifth shape the design note didn't enumerate, even if B1 still wins on spec-budget grounds.

The CSS `:hover` descendant-matching pattern (Shape A) is the most common peer pattern but, as Q1 argued, it's the one that breaks Igni's no-magic contract hardest.

**Q3 implication is sharp:** every peer framework has scale-as-transform-available-everywhere. Shipping α puts Igni alone in scope-restricting it. β + transform-cycle resolution aligns Igni with the peer consensus.

## Q6 — Principled-minority prediction

Panel result: **HOLD B1 (with refinements: mandatory-property-in-hover parse rule, parse-time ambiguity lint, `not-allowed` cursor token), FLIP Q6 to transition-default, FLIP Q7 to β.**

The principled-minority case Tyr should weigh — the one I'd expect to hold up under reversal pressure — is **on Q7, reversing the panel's β back to α, on the grounds that β's "wait for transform cycle" defers a real-app-validated need on principle-purity grounds the user doesn't pay for.** Pomodonut shipped without it; the next button-bearing app will ship without it; "wait for v0.23" is the kind of cycle-discipline argument that's correct in the small and wrong in the aggregate when it stacks across multiple cycles. If the transform cycle slips (rotation is genuinely harder than scale because of layout-flow implications), scale-on-hover slips with it for no good reason. The minority case: **ship α as a documented temporary scope-restriction, with an explicit spec note that scale will generalize to base scope when the transform cycle lands.** That's principled (the restriction is visible and time-bound), evidence-honored (Pomodonut's need is met), and pre-commits to the migration. The panel's β is cleaner; α-with-migration-note is more honest about the tradeoff.

I wouldn't expect a strong minority case on Q1 — B1 is well-supported by Igni's principles once the parse-rule refinement is added. The hover-shape question is closer to settled than Q7 is.