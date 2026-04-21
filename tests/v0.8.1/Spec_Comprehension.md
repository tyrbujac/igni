# Spec Comprehension Cold Test Results — v0.8.1 (Phase 1 baseline)

**Date:** 2026-04-15
**Models tested:** Claude Opus 4.6 (+5k extended thinking), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.8.0-micro.md` (653 words, syntax-only tier) + 5-bullet comprehension prompt
**Runner:** `tests/runner/run.ts`. No transpile step — prompt is prose, not code.

> **Footnote (post-`docs/private/50` audit, 2026-04-21):** the auto-grader's `transpile.passed` field in the per-run JSON sidecars records `false` for all four runs on this prompt. That figure is **not a model-quality signal** and should not be cited. The prompt asks for prose answers describing Igni semantics; no fenced code is expected, so the runner's transpile-grader is inapplicable here. Any dissertation reference to v0.8.1 Spec_Comprehension "0/4 transpile-pass" should be replaced with "n/a — prompt doesn't produce fenced code." See `docs/private/50` §"v0.8.1 — four sidecars silently failed on one prompt" for the full audit trail.


## Purpose — does the minimum-context tier teach the language?

The micro-cheatsheet (`spec/v0.8.0-micro.md`, 653 words, 37% of the cheatsheet, 7% of the full spec) is a syntax-only reference. Almost no prose, no tradeoffs, no worked examples beyond the minimum. The comprehension prompt asks five questions: what kind of language, what apps, what it optimises for, how it differs from framework-heavy UI, what the main constraints are.

**The hypothesis:** frontier models given only the micro tier should still correctly identify Igni as a UI-first declarative language, name its optimising priorities, and recall at least three of the major structural constraints. If the micro tier teaches the language, Phase 3's spec-size sweep becomes a tractable variable and a cheap-token option for later regression runs.

## Headline result — all four models pass on a 653-word spec

| Axis | Opus 4.6 +think | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Correctly names "UI-first / declarative"** | ✓ | ✓ | ✓ | ~ (adds "functional") | 3.5/4 |
| **Names indentation/colon syntax** | ✓ | ✓ | ✓ | ✓ | 4/4 |
| **Identifies product-UI app domain correctly** | ✓ mobile/dashboards | ✓ CRUD/forms/dashboards | ✓ "data-driven internal tools" | ✓ UI/data display | 4/4 |
| **Names "one way to do everything"** | — | ✓ (verbatim) | ✓ (verbatim) | ✓ | 3/4 |
| **Names automatic reactivity on reassignment** | ✓ | ✓ | ✓ | ✓ | 4/4 |
| **Names 4-level nesting cap** | ✓ (+ nuance) | ✓ | ✓ | ~ (said "strict depth") | 3.5/4 |
| **Names immutable list rule** | ✓ | ✓ | ✓ | ✓ | 4/4 |
| **Names immutable-args / shared-state rule** | ✓ | ✓ | — | ✓ | 3/4 |
| **Names primitives-only-in-screen/component-bodies** | ✓ | ✓ | ✓ | ✓ | 4/4 |
| **Mentions `emit`/`on <event>:` as the event channel** | — | ✓ | — | — | 1/4 |

**Every model passes the basic comprehension check** on a 653-word spec. No invented features, no major mislabels. The micro tier is viable.

## Per-hypothesis analysis

### 1. Positioning accuracy (UI-first / declarative / indentation-based)

All four models lead with the right framing:

- **Opus 4.6:** *"declarative, indentation-based, syntax-only micro-language for describing user interfaces — screens, layouts, components, state, and navigation — without an underlying general-purpose host language or build toolchain."* Sharpest framing of the round; directly contrasts with Dart/JS-host languages.
- **GPT-5.4:** *"small, declarative UI language for building screens, components, layout, state, and simple interactions with a strict, indentation-based syntax."* Catches "syntax-only" explicitly.
- **Gemini 3 Flash:** *"declarative, domain-specific, indentation-based UI language that combines state management, layout, and logic into a single syntax."* Cleanest one-sentence definition; calls it a DSL explicitly.
- **Gemma 4 E4B:** *"declarative, functional UI language with strong embedded state management capabilities."* Adds "functional" which is a loose fit — Igni has functions but isn't functional in the FP sense. Minor mislabel, not a showstopper.

All four catch indentation-based and colon-terminated syntax. No model confused Igni for HTML/JSX, imperative, or template-language. The micro spec's opening line ("Syntax-only. Indentation-based. Colons open blocks.") does the work.

### 2. Use-case fit (what kinds of apps)

Converges cleanly on the product-UI domain:

- **Opus:** mobile apps, dashboards, form-driven tools
- **GPT-5.4:** mobile/dashboard screens, CRUD flows, forms, profiles, settings, lists, detail views, productivity tools. *Explicitly excludes* "graphics-heavy, algorithm-heavy, or highly custom systems"
- **Gemini 3 Flash:** data-driven internal tools, mobile-first CRUD, rapid prototyping
- **Gemma:** interactive state-driven UIs, data display, complex local component logic, async fetching

None drifted into games, systems, scripts, embedded — all correctly stayed in product-app territory. The micro tier's primitive list (label/button/input/toggle/checkbox/slider/dropdown/badge/spinner/icon/divider) is enough signal for models to infer the domain.

### 3. Optimisation framing

- **Opus:** *"minimal cognitive overhead and one obvious way to do everything"* — correct but doesn't use the spec's exact phrasing
- **GPT-5.4:** *"clarity, speed, and consistency of authoring … one obvious way to express UI"* — uses the spec's phrasing
- **Gemini 3 Flash:** *"developer speed and readability through 'one way to do everything'"* — uses the spec's phrasing verbatim (quoted)
- **Gemma:** *"declarative reactivity"* — technically correct but misses the design philosophy; leads with reactivity rather than simplicity

3/4 catch the "one way to do everything" design budget, which is the phrasing the full spec and cheatsheet emphasise. The micro tier's single mention of this principle in the Rules section is enough.

### 4. Framework-differentiation

- **Opus:** "no JSX/HTML/CSS split, no import system, no component lifecycle, no explicit state-management library, no build step"
- **GPT-5.4:** "no large API surface, no multiple patterns for state/rendering, no custom truthiness rules, no complex component lifecycle model, no mutable in-place list updates, very limited function/component behavior"
- **Gemini 3 Flash:** "frameworks requiring manual lifecycle methods or verbose component plumbing … Igni merges these into primitive layout blocks and automatic reactivity"
- **Gemma:** "unified, single-pass model where UI definition, state changes, and event handling are declared co-located"

All four contrast Igni against framework boilerplate. GPT-5.4 has the most specific list (correctly names "no truthiness" as an explicit rule). Opus is sharpest on separation-of-concerns ("no JSX/HTML/CSS split"). This is the kind of high-signal differentiator a dissertation examiner would want to see the spec communicates effectively.

### 5. Constraints recall

All four recall the major structural rules:

- **Opus:** 4-level nesting cap (with the nuance that conditionals/loops don't count, components reset the counter), immutable args, immutable list elements, primitives-only-in-bodies, no cross-screen function calls
- **GPT-5.4:** indentation-colon blocks, primitives in bodies only, immutable args, immutable list elements, no cross-screen function calls, `on change:` requires `bind:`, `emit` only in event handlers, no truthiness, max nesting 4. **Most complete recall of the round — only model to correctly mention `emit`'s contextual constraint.**
- **Gemini 3 Flash:** 4-level nesting, immutable list pattern, primitive/function separation
- **Gemma:** nesting depth 4, distinction between functional logic and UI structure, immutable list elements, primitives-only-in-bodies

GPT-5.4's recall is remarkably comprehensive — nine rules named correctly from a 653-word spec. Opus catches the conditionals-don't-count nuance that the other three miss.

**Opus caught the nested-counter nuance** that no other model caught: *"Nesting depth is capped at 4 layout levels (conditionals/loops don't count; components reset the count)."* This is a three-sentence combined rule in the micro spec compressed into one, and Opus picked up all three clauses.

### 6. `emit` recognition — the Phase 1 convergence check

Only **1/4** models (GPT-5.4) spontaneously mentioned `emit` as a constraint in the comprehension task. Given that 2/4 *used* `emit` in the Habit Tracker prompt (Opus and Gemini 3), this is a curious asymmetry:

- **Opus** used `emit toggle` in the code prompt but didn't name `emit` as a constraint in comprehension.
- **Gemini 3 Flash** used `emit toggle` in the code prompt but didn't name it in comprehension.
- **GPT-5.4** did *not* use `emit` in the code prompt (used `bind:` incorrectly instead) but *did* name it as a constraint in comprehension.

Interpretation: the constraint-listing task is recall-heavy; the coding task is production-heavy. A model can know a rule exists without applying it, and can apply a rule correctly without naming it as a constraint. **This is a useful methodology finding** — the two prompts test different skills and shouldn't be collapsed into a single "did the model understand v0.8.0" score.

## Per-model architecture notes

### Claude Opus 4.6 (+5k extended thinking)

Tight, spec-citation-heavy output. 373 output tokens for a 5-bullet response. Catches the nested-conditionals/components-reset nuance. Doesn't name `emit` as a constraint despite using it correctly in Habit Tracker. Extended thinking at 5k was almost certainly overkill for this prompt — the answer is direct spec recall.

**Runtime:** 11s, 373 output tokens. Thinking tokens: 0 surfaced (SDK 0.60 limitation).

### GPT-5.4

Most comprehensive constraint recall of the round — nine rules named from the micro spec. Only model to name `emit`'s contextual restriction ("only works inside event handlers") and `on change:`'s `bind:` requirement. Curiously produces worse code (Habit Tracker) than Gemini 3 while producing better *descriptions* of the language — suggests the model has good pattern-recognition on "what is this language" but weaker generation under constraint.

**Runtime:** 12s, 436 output tokens.

### Gemini 3 Flash preview

Fastest response (3s, 226 output tokens). Names the major constraints but less comprehensively than GPT-5.4 or Opus. Uses the spec's "one way to do everything" phrasing verbatim. Correctly scopes the app domain to "data-driven internal tools" and "rapid prototyping" — more specific framing than the others. No mention of `emit`, consistent with the pattern (used it in code, didn't name it as a constraint).

**Runtime:** 3s, 226 output tokens. Thinking disabled.

### Gemma 4 E4B (local)

Names all four major structural rules and reactivity-via-reassignment. Slight drift on "declarative, functional" (Igni is declarative; "functional" is loose). Doesn't catch the nested-counter nuance. Overall: passable comprehension from a 4B local model on a 653-word spec. Useful calibration point for Phase 3 (does the micro tier hold at weaker model sizes?).

**Runtime:** 59s, 556 output tokens. Local inference; slow but free.

## Verdict

**The micro tier (653 words) teaches Igni to all four tested models.** No invented features, no major mislabels, consistent comprehension of the product-UI app domain, consistent recall of the major structural rules. The Phase 3 spec-size sweep becomes a credible experiment — there's a real question here (does accuracy on *code generation* drop as the spec shrinks?), and Phase 1 establishes that comprehension at least survives the shrink.

**Most diagnostic result of the round:** GPT-5.4's nine-constraint recall including the `emit` contextual restriction and the `on change:` / `bind:` linkage. These are rules buried 2–3 sentences deep in the spec body; GPT-5.4 retrieves them cleanly. This suggests the spec's current density is not a comprehension bottleneck for frontier models.

**Most interesting asymmetry:** the Habit Tracker round (4/4 transpile fail) vs this round (4/4 comprehension pass) for Opus and Gemini 3 Flash. The models understand v0.8.0 and can describe it correctly. Blocked only by a transpiler gap on output. That's a strong signal for directing fix-effort at the tooling, not the spec.

## Next steps

1. **Re-run comprehension against the v0.8.1 framing cleanup** once `spec/v0.8.1.md` ships. Compare bullet quality against this v0.8.0-micro baseline. If v0.8.1's new opening lands, models should produce cleaner positioning bullets with less drift ("functional" → "declarative").
2. **Spec-size sweep (Phase 3):** run the same comprehension prompt against the cheatsheet (1,780 words) and full spec (9,700 words) on the same four models. If comprehension is already 4/4 on micro, the question becomes *how much better* full-spec comprehension is — potentially a null result, which is itself valuable data for the "spec budget" principle.
3. **Add a second comprehension prompt targeting the v0.8.0 `emit` feature directly.** "Describe in 2-3 sentences how a component communicates an event to its parent in Igni." This would disambiguate the "knows vs uses" asymmetry seen in Habit Tracker.
