# v0.22 hover primitive design review — Stage 2

Stage 2 panel — 3 frontier models critique design note 125 (`docs/private/125_v022_hover.md`) before any spec edit lands. The note proposes Shape B1 (`is_hovered()` reactive boolean + `hover:` property-only sub-block) for the v0.22 hover primitive, with Stage 1 sub-questions all locked. Three alternative shapes are on the table (A: children-allowed; B2: named binding; C: `bind: hovered`).

Run via `npx tsx tests/runner/cold-test.ts --no-spec --no-grade --prompts tests/v0.22-hover-design-review/prompts.md --out tests/v0.22-hover-design-review --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview`. Outputs are prose, not Igni code.

Why a Stage 2 against the framing: the hover primitive's load-bearing question is *language-shape* — does `hover:` accept primitive children, or is conditional content always via `if`? — and the recommended Shape B1 lean is well-justified enough that anchoring is a real risk. The principled-minority pattern (`docs/private/114`, four instances now including v0.20 Q4 absorption) is the architecture-side guard for "panel agrees with recommendation but architecture should reverse"; the anti-anchoring Q1 below is the panel-side guard for "panel agrees with recommendation but the agreement is anchoring rather than load-bearing critique."

**Q1 is framed adversarially** — *the strongest case AGAINST Shape B1* — for the same reason v0.20 dark-mode Q1 was framed adversarially against option (b). Mirrors the v0.20-design-review precedent.

Treat panel responses as input to a Tyr decision, not the decision itself. Patch decision (per spec-cycle skill rules): 3/3 convergent on a refinement → patch doc 125; 2/3 → consider; 1/3 → log only. Trigger A in doc 125 fires if 2/3+ flip Shape B1 on architectural grounds (not just "Shape A is more familiar").

## 1. v0.22 hover primitive design critique

> You are reviewing a design note for the Igni programming language ahead of v0.22 implementation. Igni is a UI-first programming language with the north star "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword/syntax form is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Indentation, no brackets**: block structure is whitespace + colons.
> - **PascalCase = component (no parens), lowercase = function (with parens).**
> - **Lexical reactivity**: each screen re-evaluates from the top whenever any variable it references is reassigned.
> - **Path C** (committed v0.15+): designs translate from Figma's auto-layout vocabulary; primitives match Figma's model rather than reinventing.
>
> v0.21 just shipped (persistence Tier 1 + reactive fetch race fix). v0.22's scope is hover ship + narrow a11y + stack/wrap/rotation Stage 1 design notes. Hover Stage 1 was opened during v0.21 cycle as parallel low-pressure work; this Stage 2 panel runs in the strategic-planning gate window between v0.21 ship and v0.22 open.
>
> The hover primitive surfaced from the v0.21 pre-cycle visual-primitives evidence panel (2026-04-30, `tests/v021-pre-cycle-evidence/`): 4/4 P1 + 3/4 P3 reach for `hover:` on load-bearing surfaces. Two cells (Claude P3, GPT P3) flagged that the cheatsheet's property-overrides-only `hover:` walls "preview expands on hover" surfaces — the question is whether `hover:` should accept primitive children, or whether conditional content stays in `if` blocks via a separate `is_hovered()` reactive boolean.
>
> The design note below recommends Shape B1 for the panel to pressure-test. Read it carefully, then answer the five specific questions at the end. Be substantive and direct.
>
> ---DESIGN NOTE START---
>
> ## 125 — v0.22 hover primitive
>
> ### Four shape proposals
>
> **Shape A — `hover:` accepts primitive children**
>
> ```igni
> layout vertical, padding: medium, background: card:
>   image card.image
>   label card.title
>
>   hover:
>     background: brand
>     label card.description, style: caption  # hover-only child renders only on hover
> ```
>
> *For:* Single primitive solves both visual-lift (property overrides) and reveal-content (children) shapes — one keyword, one mental model. Maps cleanly to CSS `:hover { ... }` and SwiftUI `.onHover { ... }`. Pre-cycle panel surfaced this as the natural shape.
>
> *Against:* Conflates *rendering-conditional content* (existing pattern: `if shared.X:` blocks under lexical reactivity) with *property-override-on-state*. Igni's no-magic principle: "if something happens at runtime, the cause should be visible in the source." Making `hover:` a hidden boolean-conditional violates the conditional-render-via-`if` rule. Spec budget tax: hover joins `if` as a second conditional-render mechanism.
>
> **Shape B1 — `hover:` is property-only; add `is_hovered()` boolean for conditionals (RECOMMENDED LEAN)**
>
> ```igni
> layout vertical, padding: medium, background: card:
>   image card.image
>   label card.title
>
>   hover:
>     background: brand
>
>   if is_hovered():
>     label card.description, style: caption
> ```
>
> *For:* Preserves one-way-to-do-everything (conditional content via `if`; property overrides via `hover:`). `is_hovered()` reads naturally as a reactive boolean (matches `now()`/`seen` patterns). Smallest spec budget: 1 new builtin + 1 new sub-block. `is_hovered()` returns true when the *innermost enclosing layout* is hovered (lexical scope by parent-layout-tree); nested layouts shadow outer hover state via the same lexical-shadowing logic Igni already uses.
>
> *Against:* Two reads of "the hovered layout" feel less DRY than CSS `:hover` (where everything inside the hover scope automatically applies). LLMs trained heavily on web idioms might reach for Shape A first.
>
> **Shape B2 — Named binding (variant of B)**
>
> ```igni
> layout vertical, name: card_lift, padding: medium, background: card:
>   image card.image
>   hover:
>     background: brand
>   if is_hovered("card_lift"):
>     label card.description, style: caption
> ```
>
> *For:* Explicit binding eliminates the "innermost enclosing" ambiguity at deep nesting.
>
> *Against:* Adds `name:` modifier as a new layout property surface. Naming noise on every layout that wants hover-conditional content. Spec budget tax higher than B1.
>
> **Shape C — `bind: hovered` reactive binding**
>
> ```igni
> layout vertical, padding: medium, background: card, bind: hovered:
>   image card.image
>   hover:
>     background: brand
>   if hovered:
>     label card.description, style: caption
> ```
>
> *For:* Reuses `bind:` pattern from v0.14.1 (slider/toggle/checkbox/dropdown).
>
> *Against:* `bind:` currently binds to `shared.X` or `obj.field` (writable state); `bind: hovered` introduces a *read-only* binding that's runtime-managed. Widens `bind:` semantics. Naming question: `bind: hovered` reads as "bind something *to* hovered," not "bind hovered *to a name*." Possibly clearer as `expose: hovered` or `state: hovered` — needs a naming pass that the other shapes don't need.
>
> ### Stage 1 lock (Tyr 2026-04-30): Shape B1
>
> Rationale per concur:
> - Preserves "one way to do everything" (conditional content always via `if`).
> - Verb-symmetry with `now()`/`seen` (reactive-boolean builtins pattern).
> - Smallest spec addition.
> - Shape A's CSS-familiarity appeal is real but doesn't outweigh breaking the conditional-render rule. Igni's principles are dissertation-load-bearing; ergonomic gain at principle cost is the wrong trade.
>
> ### Sub-question locks (Tyr 2026-04-30)
>
> - **Q2 — Touch-platform: `is_hovered()` always returns `false`** on touch-only platforms; `hover:` is a no-op (base properties hold). Composes with `if` — branch never enters; no surprises.
> - **Q3 — Mobile-first vs desktop-first: cookbook recipe rather than spec rule.** Hover content is *progressive enhancement*; visible elsewhere via tap/long-press/expanded card.
> - **Q4 — Cursor-token whitelist: `pointer` only for v0.22.** Matches `border:`/`transition:`/`padding:` token-discipline. Widen via cold-test signal.
> - **Q5 — Nested-hover: rejected at parse.** `hover:` cannot nest inside another `hover:` (one-level-only). Targeted error message.
> - **Q6 — Composition with `transition:`: instant-snap default.** Matches v0.20 dark-mode top-level theme switch rule. Explicit `transition: fade` opt-in if a layout wants smooth lift.
>
> ### Cheatsheet skeleton (Shape B1)
>
> ```
> layout vertical, padding: medium, background: card, rounded: medium:
>   hover:
>     background: brand
>     cursor: pointer
>   label "Tap me"
> ```
>
> Rules:
>
> - `hover:` is a sub-block of `layout`, not a modifier. Indented inside the layout it modifies.
> - `hover:` only takes property-shaped children (`background:`, `border:`, `rounded:`, `cursor:`, `shadow:`). Children primitives (`label`, `button`, etc.) are not allowed inside `hover:` — use `is_hovered()` + `if` for hover-conditional content.
> - `cursor:` whitelist for v0.22: `pointer` only.
> - `hover:` property-flips are instant-snap by default. Add `transition: fade` to smooth.
> - Touch-only platforms: `hover:` is a no-op; `is_hovered()` returns `false`.
> - `is_hovered()` reads the *innermost enclosing layout's* hover state by lexical scope.
>
> ---DESIGN NOTE END---
>
> Now answer the five questions below. Be substantive — vague consensus-y replies fail the panel's purpose. If you think Shape B1 is right, say *why* in the language of Igni's principles, not generic "looks clean." If you think it's wrong, say *what specifically breaks* and *what should ship instead*.
>
> **Q1 (anti-anchored — strongest case AGAINST Shape B1):** Make the strongest possible case AGAINST Shape B1. What does Shape B1 break, miss, or mis-handle that a different shape (A / B2 / C, or one not on the list) would handle better? Score B1 against Igni's "one way to do everything" + "no magic" principles in particular — does the property/conditional split honestly preserve those principles, or does the two-mechanism shape ("`hover:` for properties, `if is_hovered():` for conditionals") secretly violate "one way" by introducing a second conditional-render-on-state pathway alongside `if shared.X:`? Argue the principled case for one of the alternatives, not just the ergonomic case. Verdict: HOLD B1 / REFINE B1 / FLIP to A / FLIP to B2 / FLIP to C / FLIP to a fifth shape.
>
> **Q2 (sub-decision lock pressure-test):** Of the five sub-question locks (Q2 touch-always-false / Q3 cookbook-not-spec / Q4 cursor-pointer-only / Q5 no-nesting / Q6 instant-snap default), which (if any) are wrong? Be specific about *what* breaks at v1.0 horizon if the lock holds. Particular focus on: does Q4 (cursor-pointer-only) under-serve drag affordance, edit affordance, or accessibility cues? Does Q6 (instant-snap default) under-serve the most common "card lifts on hover" case where users *expect* smoothness?
>
> **Q3 (lexical-scope edge case):** Shape B1's "innermost enclosing layout wins" rule for `is_hovered()` resolution. What ambiguity surfaces under deep nesting (e.g. card inside list inside scroll inside screen)? Does Shape B2 (named binding) actually solve this, or just shift the ambiguity to "which name applies"? Worst-case author-confusion scenario you can construct.
>
> **Q4 (peer-language survey):** What do peer languages and frameworks do? CSS `:hover` (selector-based, descendant matching), SwiftUI `.onHover { isHovered in ... }` (per-modifier closure), Compose `Modifier.hoverable(interactionSource)` (event-source pattern), Framer Motion `whileHover={{ ... }}` (declarative-prop). Does any peer language solve hover in a way Igni's draft hasn't considered? What's the load-bearing pattern across the survey?
>
> **Q5 (anti-anchoring vs principled-minority):** This panel is anti-anchored on Q1, but Igni has a documented principled-minority pattern (`docs/private/114`, four instances) where Tyr reverses panel consensus to preserve architectural principles. If 3/3 of you HOLD on B1, what would the principled-minority case for Tyr to reverse to (a different shape) look like? If you genuinely think B1 is right, predict the strongest minority objection that *should* exist; if you flipped on Q1, you've already made the case — say so.
