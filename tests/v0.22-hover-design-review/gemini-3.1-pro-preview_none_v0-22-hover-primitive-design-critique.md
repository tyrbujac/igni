Here is a substantive, principles-driven review of the v0.22 hover primitive design note.

### Q1 (anti-anchored — strongest case AGAINST Shape B1)

**The case against B1:** Shape B1 fundamentally violates both "no magic" and "one way to do everything" by introducing a split-brain architecture for interaction state. 

Under B1, an author handles a single conceptual state (the user hovering a card) via two entirely different syntax mechanisms: a declarative property block (`hover:`) for visuals, and an ambient runtime function (`is_hovered()`) for structure. This is not "preserving" the conditional-render rule; it is gerrymandering it. B1 dictates that reactivity is explicit and lexical everywhere in Igni, *except* for hover styling, which gets a special DSL, *and* hover conditionals, which rely on an invisible DOM-like context rather than a bound variable. 

Furthermore, because Igni is committed to the Figma mental model (Path C), B1 is the wrong translation. In Figma, hover is a Component Variant. A variant seamlessly encapsulates both property overrides (background change) and structural changes (revealing a child layer) in one conceptual unit. 

**Verdict: FLIP to Shape A.** 
Shape A maps perfectly to Figma variants and zero-shot LLM intuition. It acknowledges that `hover:` is not a styling override, but a *state-driven view modifier*. Yes, it introduces conditional rendering outside of `if`, but it does so by treating interaction states as localized variants. Shape A requires one mental model, one syntax block, and eliminates the ambient magic of `is_hovered()`. 

### Q2 (sub-decision lock pressure-test)

Several of the Stage 1 locks create immediate v1.0 horizon risks:

*   **Q5 (Nested-hover rejected at parse) — FATAL:** Rejecting nested hovers at parse fundamentally breaks standard UI patterns. A hoverable gallery card containing a hoverable "favorite" icon button is a nested hover. If Igni rejects this at parse, the language cannot build basic rich-interaction cards. This lock must be reverted; Igni must implement standard event-bubbling/propagation rules or allow inner hovers to capture the pointer.
*   **Q6 (Instant-snap default) — WRONG FOR HOVER:** While v0.20 dark-mode instant-snap is correct (theme flips are jarring to animate), hover is a *micro-interaction*. Instant-snapping a `scale` or heavy `shadow` creates a glitchy, broken feel that screams "prototype," not "UI-first." Forcing users to write `transition: fade` on every card lift taxes the spec budget and violates sensible defaults. Hover property flips should have a baked-in default micro-interaction easing (e.g., 150ms ease-out).
*   **Q4 (Cursor whitelist: pointer only) — WRONG:** Restricting to `pointer` severely under-serves desktop-first accessibility. `text` (edit affordance), `grab`/`grabbing` (drag affordance), and `not-allowed` (disabled state) are load-bearing UI primitives. Leaving them out degrades the user's ability to signal interactability.

### Q3 (Q7 scale-in-hover-whitelist α/β/γ pressure-test)

**The case AGAINST Option α (Tyr's lean):** 
Option α proposes adding `scale` exclusively as a property under `hover:`. This violently breaks Igni’s zero-shot LLM learnability by destroying property symmetry. 

If an LLM learns that `scale: 1.05` is valid inside `hover:`, it will inevitably hallucinate `scale: 1.05` on standard layouts. Option α creates a third, highly dangerous spec-class: "properties that represent coordinate-system transforms, but are syntactically scoped as interaction-state-feedback only." This conflates *what* a property does (geometry transform) with *when* it happens (on hover). 

*   **(a) Coordinate vs. State semantics:** Scale is a spatial transform. Hardcoding it as a hover-only feedback mechanism is pure magic. It prevents a user from scaling a component on click, on load, or statically.
*   **(b) n=1 evidence justification:** A single Pomodonut button missing interactability feedback does not justify permanently mangling the language's property symmetry. 
*   **(c) The cleanest shape:** **Option β (Don't ship, workaround)**. If stack/wrap/rotation are deferred to v0.22 proper, `scale` must wait for the generalized transform primitive class (Option γ). Do not spend spec budget creating a magical hover-only scale property. Let authors use `background`, `shadow`, or `padding` for hover feedback until general transforms are shipped. 

### Q4 (lexical-scope edge case)

Shape B1's `is_hovered()` relies on "the innermost enclosing layout". This introduces a catastrophic author-confusion scenario: **structural refactoring silently breaks interaction logic.**

Imagine a user has a `Card` layout containing text. They use `is_hovered()` to show a tooltip when the card is hovered. 
Later, they need to add a colored border around the text, so they wrap the text in a new generic `layout padding: small`. 
Because `is_hovered()` looks at the *innermost* layout, the hover target has just silently shrunk from the entire `Card` to only the small text-wrapper layout. The author changed visuals, but implicitly destroyed the interaction hit-box. 

Shape B2 (named binding) solves this ambiguity but heavily taxes the spec budget with naming noise. This edge case is further proof that Shape A (where the `hover:` block clearly denotes the hit-box, and children go inside it) or Shape C (explicit reactivity bound to a specific layout) are architecturally superior.

### Q5 (peer-language survey)

Across CSS, SwiftUI, Jetpack Compose, and Framer Motion, **no peer framework restricts transforms to hover-only.**

*   **CSS:** `:hover` is a state selector. `transform: scale()` is a general property.
*   **SwiftUI:** `.onHover { isHovered in }` handles state. `.scaleEffect()` is a general modifier. 
*   **Compose:** `Modifier.hoverable()` hoists state. `Modifier.scale()` is universal.
*   **Framer Motion:** `whileHover={{ scale: 1.05 }}` looks like Shape A + Option α, but Framer Motion *also* exposes `scale` universally via standard `animate={{}}` props. 

The load-bearing pattern across the industry is **property symmetry**: any property that can be animated/applied on hover can also be applied statically. Igni drafting Option α (hover-scoped scale) is an entirely novel restriction that violates established UI engineering mental models.

### Q6 (anti-anchoring vs principled-minority)

If the panel unanimously votes to FLIP to Shape A and reject Option α (favoring Option β or γ), Tyr’s principled-minority case to reverse consensus and ship B1 + α would center on **Blast-Radius Containment and Spec Budget Absolutism.**

Tyr would argue: *"Shape A introduces nested tree-diffing complexities and invites LLMs to stuff massive component sub-trees inside hover blocks, destroying read-flow. Option γ introduces universal scaling, which LLMs will immediately abuse to achieve hacky layout alignments instead of using auto-layout primitives properly. B1 + α is ruthlessly constrained. Yes, α breaks property symmetry, and yes, B1 requires two mechanisms, but they are sandboxed. We restrict powerful tools (like scale) to exactly where they are needed (interaction feedback) to prevent their misuse in layout. Igni optimizes for rule simplicity and LLM rail-guards, not theoretical purity."* 

While philosophically consistent with Igni's strictness, this defense underestimates how badly LLMs fail when spatial scope is invisible (B1's `is_hovered()`) and properties are asymmetrically allowed (α's hover-only scale).