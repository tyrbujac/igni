# v0.17.0 border framing critique — Stage 2

Stage 2 panel — 3 frontier models pressure-test the **methodology framing** in design note 111 (`docs/private/111_v017_border.md`), specifically the *visual-chrome-under-signals* claim that's being generalised from one observation (the v0.16.0 extrapolation panel) to a class of primitives (gradient, opacity, blur, advanced radius, rotation, scale).

Run via `tests/runner/run.ts --no-spec --no-grade` against three frontier models (`claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`). Outputs are prose, not Igni code. The border *syntax* itself is precedented (mirrors v0.15.0 `theme: color:`); this panel does not critique it.

Why a Stage 2 specifically against the framing: the methodology claim determines whether future visual-chrome primitives skip cold-test entirely and go straight to hand-translation. That's a recurring procedural decision; getting the rule wrong recurs across multiple cycles. ~$0.30 to pressure-test against three frontier readers.

Treat panel responses as input to a Tyr decision, not the decision itself. Patch decision (per spec-cycle skill rules): 3/3 convergent on a refinement → patch doc 111; 2/3 → consider; 1/3 → log only.

## 1. Visual-chrome empirical-pull-blindspot framing critique

> You are reviewing a methodology claim made inside an Igni programming-language design note ahead of v0.17 implementation. Igni is a UI-first language whose north star is "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword/syntax form is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Designs that translate, not redesign**: the canonical user is a designer-engineer translating a Figma file into Igni source. Path C is the committed ship-list of primitives Igni adds to match Figma vocabulary where it doesn't already (theme color overrides v0.15.0 shipped; spacing tokens, border, shadow queued).
>
> Igni's standard primitive-promotion gate runs three signal sources:
>
> - **Trap journal** — real-app friction logged by the author when running `igni run` against actual apps.
> - **Cookbook** — workaround entries for friction that hasn't yet earned a primitive.
> - **Cold-test panel signal** — 3-4 frontier models given the cheatsheet and prompted to build apps; convergent invention of new syntax (3/4 or 4/4) promotes a primitive to the design queue. The most recent panel (`docs/private/110`) was a *spec-extrapolation* variant: 12 cells across small/medium/ambitious apps, no "stick to spec" guardrail, measuring what models invent when the spec runs out.
>
> The v0.16.0 extrapolation panel produced 6 promotion-tier candidates (drag-and-drop, persistence, dates, string→number, list-filter, single-list-state). It also produced **zero unprompted invention of `border:` or `shadow:` syntax** across 12 cells — even though the panel explicitly told models to invent syntax for spec gaps.
>
> The v0.17 design note now needs to defend why `border:` ships *despite* zero empirical pull. Its proposed defence is the "visual-chrome-under-signals" methodology pattern below. That pattern is what this panel is critiquing. Excerpt:
>
> ---DESIGN NOTE EXCERPT START---
>
> ### Why this primitive earns v0.17 despite zero empirical pull
>
> This section establishes a methodology pattern that applies beyond border/shadow.
>
> **The problem.** The standard Igni primitive-promotion gate runs three signal sources:
>
> - Trap journal (real-app friction)
> - Cookbook (workaround entries)
> - Cold-test panel signal (1/4 → 4/4 convergent invention)
>
> For `border:`, all three return zero:
>
> - Trap journal: no entries citing border-shaped walls.
> - Cookbook: no border workaround entries.
> - v0.16.0 extrapolation panel: 12 cells, **zero unprompted invention** of `border:` syntax. Models reached for drag-and-drop, persistence, dates, string→number — never for visual chrome.
>
> **The blind spot.** *Visual-chrome primitives systematically under-signal in cold-test methodology because rendering details fall below prompt resolution.* When a prompt asks "build a habit tracker," frontier models produce *functional* layouts but rarely specify visual chrome that a designer would call out (border weights, shadow elevation, gradient fills). The prompt's resolution stops at the logic primitive. Cold-test is the wrong instrument for this primitive class.
>
> This is **not a defect of the methodology** — it's a known limitation. The same property holds for **gradient**, **opacity**, **blur**, **advanced radius tokens**, **rotation**, **scale transforms**, and probably **animation curves** when those eventually land. None of them will surface in cold-test convergence either, for the same reason.
>
> **The two-prong protocol for visual-chrome primitives.** When the empirical-pull instruments return zero on a primitive whose Figma-vocabulary status is unambiguous:
>
> 1. **Path C ship-list serves as prior** (the project's prior committed scope decision is the design budget).
> 2. **Hand-translation gates serve as validation** (real Figma file translation supplies post-hoc empirical pull; if a hand-translation goes through and the primitive isn't reached for, *that's* the falsifying signal).
>
> This protocol is where the methodology contribution lives for visual-chrome: the design budget is set up-front by the Path C scope decision, and validation is post-hoc via hand-translation rather than pre-flight via cold-test.
>
> ---DESIGN NOTE EXCERPT END---
>
> Critique this framing. Be substantive and direct. If you genuinely converge with the design note, say so explicitly — convergence is data. If you'd reject the framing, name the alternative.
>
> **Q1 — Does the visual-chrome-under-signals pattern hold as stated?** Pressure-test the causal mechanism. The note's diagnosis is "rendering details fall below prompt resolution." Is that the right mechanism, or is something else going on (training-data bias, Igni-spec specificity in cheatsheet form, panel-prompt-design choices, the fact that `card` token already exists and may visually substitute, etc.)? Is the *pattern* real and the *mechanism* wrong? Take a clear position: hold / refine / reject.
>
> **Q2 — Does it generalise cleanly to the named primitives?** The note extends the claim to **gradient**, **opacity**, **blur**, **advanced radius tokens**, **rotation**, **scale transforms**, and (tentatively) **animation curves**. For each of these six, is it a clean fit for the pattern, a partial fit, or a counter-example where you'd actually expect cold-test signal to surface? Per-primitive judgements are more useful than blanket agreement. Make at least three concrete per-primitive calls.
>
> **Q3 — Is the two-prong protocol (Path C prior + hand-translation validation) sufficient, or does the methodology need a third leg?** The protocol commits to ship-on-prior + validate-post-hoc. Is that enough? Candidate third legs to evaluate: peer-language-survey (does Flutter/SwiftUI/Compose surface this primitive prominently, suggesting it's load-bearing for designer-engineer fluency?), real-app-corpus-scan (statistical frequency of the primitive in deployed Figma files), designer-interview, accessibility-spec-derived list (e.g. WCAG mandates focus indicators, which are border-shaped). Recommend one, none, or push back on the framing.
>
> **Q4 — Most important: are there visual-chrome primitives that DO surface in cold tests?** Counter-examples. Even one well-grounded case sharpens the pattern by bounding when it applies. Suggested probes to consider: do models invent **colour tokens** (`color: brand`, `theme:` overrides) when given a brand-themed prompt? **Font-weight or font-size** invention? **Cursor styles**? **Focus-ring styles** when the prompt mentions accessibility? **Hover or pressed states**? **Animation timing** when the prompt says "smooth transition"? Name at least one concrete counter-example with reasoning, or argue convincingly that no clean counter-example exists.
>
> Format: four answers (Q1–Q4), one substantive paragraph each. Each must declare a clear position (hold / refine / reject) before evidence. Q2 needs at least three per-primitive calls. Q4 must name at least one specific probe. No need to write Igni code — this is methodology critique.
