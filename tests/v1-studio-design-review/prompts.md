# v1.0 Studio architectural-direction — 5 anti-anchored questions

**Format:** Each question presents the operator-side current lean AND an explicit counter-position so models don't pattern-match to author bias. Per Stage 2 panel discipline (`docs/private/114` principled-minority pattern). Models pick a verdict (HOLD operator lean / REFINE with shape modifications / FLIP to counter-position OR a third alternative) and justify with reasoning grounded in the cheatsheet + Igni's design principles.

**Context preamble (read first):** Igni is a UI-first DSL designed for human readability + LLM accuracy; current canonical surface is `spec/v0.21.1-cheatsheet.md` (attached). Igni Studio is a planned post-June-2027 product — a developer/designer collaboration tool combining a canvas (Figma-style auto-layout for renderable subset of Igni), source editor, state inspector, and diagnostics tray over `.igni` source files. The questions below ask whether v0.22-v1.0 cycle decisions should be shaped by Studio's later architectural needs.

---

## Q1 — Wireframe vs semantic primitives split

**Operator lean (Position 2 in `docs/private/134`):** v1.0 splits primitives into two families. **Wireframe primitives** — `rectangle`, `circle`, `line`, `text`, `image` — visual building blocks. **Semantic primitives** — `button`, `input`, `link`, `heading` — accessibility-anchored interactive shapes. Both compose with `on tap:` (modular interactivity per Q2). `role:` is an orthogonal property declared independently.

**Counter-position:** Unify them — every primitive is semantically named AND visually composable; no wireframe/semantic distinction needed because Igni's "no magic" + "one way to do everything" principles want one shape per concept. Adding a wireframe family doubles the primitive vocabulary and forces designers to learn TWO mental models (visual-only vs accessibility-anchored).

**Question:** HOLD / REFINE / FLIP. Pick one and justify in ~3-5 paragraphs. If REFINE, propose specific shape modifications. If FLIP, argue the counter-position OR propose a third alternative the operator hasn't considered. Reference cheatsheet content + Igni's design principles in your reasoning.

---

## Q2 — Modular interactivity (any primitive can be tappable)

**Operator lean (Position 2 in `docs/private/134`):** Both wireframe and semantic primitives compose with `on tap:` (and other event handlers). `rectangle, color: white, on tap: count = count + 1` is valid. Custom button shapes become trivial (`rectangle` styled however you want, made interactive via `on tap:`). `role: button` (or other roles) declares accessibility intent orthogonally.

**Counter-position:** Keep interactivity scoped to `button` + layouts (current behaviour). Rectangles/circles being interactive blurs the visual-vs-behavioural primitive distinction. Accessibility becomes harder (screen-readers can't infer "this rectangle is a button" without explicit `role:`, which designers will forget). The current "buttons are buttons; everything else renders" rule is principled; modular interactivity sacrifices clarity for flexibility.

**Question:** HOLD / REFINE / FLIP. Pick one and justify. If REFINE, propose how accessibility is preserved (does `on tap:` auto-imply `role: button` unless overridden? Does the compiler reject `on tap:` on shapes without explicit `role:`?). If FLIP, argue why current behaviour is sufficient even when designers want custom button shapes.

---

## Q3 — v1.0 positioning model: flow-only vs flow + bounded-offset

**Operator lean (Position 3 in `docs/private/134`):** v1.0 retains flow-only positioning (current `layout vertical:` / `layout horizontal:`). Snap-to-spacing-tokens (`spacing/1` through `spacing/8`) is the only positioning vocabulary. Bounded offset (`offset_x:`, `offset_y:` limited to spacing-token values) is deferred to v1.x or v2.0 as a tracked-open-question.

**Counter-position:** Flow-only is sufficient indefinitely; offset positioning leaks Figma-canvas thinking into a layout-vocabulary language and breaks responsive behaviour by default (offsets are absolute; flow is relative). Adding offset to v1.0 is a slippery slope — designers will ask for unbounded offset, then negative offset, then z-index, then absolute positioning. Flow + custom layout components is sufficient; the cost is verbosity, not capability.

**Question:** HOLD / REFINE / FLIP. Pick one and justify. What does Studio (per `docs/private/115_igni_studio_strategy.md`) actually NEED that v1.0 must support? If Studio's canvas wants designers to nudge things 4px in any direction, does v1.0 need bounded offset, or does Studio constrain the canvas to flow-shape interactions?

---

## Q4 — Igni Studio canvas semantics: direct-manipulation vs source-first

**Operator lean (Position 4 in `docs/private/134`):** Igni Studio is a canvas-based UI builder where the canvas is a **direct-manipulation surface for the renderable subset of `.igni`** (per `docs/private/115`). Designers drag shapes around and the canvas mutates the source AST losslessly. Snap-to-token grid is the language rule AND the design tool rule unified.

**Counter-position:** Studio should be **source-first** — the canvas is a read-only render preview, never an authoring surface. Authoring happens only in the source editor. This keeps the language unconstrained by canvas-vocabulary requirements (no need to prove every primitive has a Figma-style direct-manipulation handle). Cost: kills the "drag shapes around" Figma-like UX that's the natural designer expectation.

**Question:** HOLD / REFINE / FLIP. Pick one and justify. What language-design decisions made now (in v0.22-v1.0 cycles) enable vs constrain Studio's later product-design phase? If direct-manipulation is the goal, what cheatsheet content currently resists canvas-vocabulary? If source-first is acceptable, why bother with Studio at all (vs just polishing the VS Code extension)?

---

## Q5 — Token pair system for coloured primitives (auto-contrast text colour)

**Operator lean (Position 7 in `docs/private/134`):** Each colour token in `theme: color:` declares its companion text colour. `brand` pairs with `on_brand`; user-defined tokens declare both (`primary_700` + `on_primary_700`). When a button (or other filled primitive) sets `color: brand`, the text inside automatically picks `on_brand` — no per-button text-color override needed. Sparked by calculator dogfood Finding H (`color: white` button has invisible text because text doesn't auto-flip).

**Counter-positions** (pick from, or propose a different one):
- (a) **Auto-contrast (luminance-based).** No declared pairs; runtime computes text colour from button-background luminance. Zero spec budget; opinionated but consistent.
- (b) **Explicit pairs** (operator lean above).
- (c) **Per-primitive `text_color:` override property.** Status quo + new property. Designer remembers contrast on every button.
- (d) **Status quo — no system.** Designer responsibility entirely. Igni doesn't have a contrast model; bugs like Finding H are "you should have set text colour explicitly."

**Question:** HOLD / REFINE / FLIP. Pick the operator lean (b) OR one of (a/c/d) OR propose a fifth alternative. Justify in terms of spec budget tax + Igni's "no magic" principle + designer ergonomics + Studio canvas implications (Studio's canvas would presumably visualise the pairing or auto-contrast — which is easier to render?).

---

## Submission shape (per cell)

Each model returns five paragraphs (one per question), each with:
- **Verdict:** HOLD / REFINE / FLIP.
- **Reasoning:** 3-5 paragraphs grounded in cheatsheet + Igni's design principles.
- **If REFINE/FLIP:** specific shape modification or alternative direction.
- **Confidence:** subjective HIGH/MEDIUM/LOW (lets the synthesizer weight strong-cite-of-cheatsheet differently from soft-impression).
