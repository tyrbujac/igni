# v0.13 max-width — pre-implementation design review

Single prompt asking three frontier models (GPT-5.5 high, Claude Opus 4.7, Gemini 3.1 Pro) to critique the `max-width:` design note for Igni v0.13. Run via `tests/runner/run.ts` with `--no-spec --no-grade`. Outputs are prose, not Igni code.

This is a one-off design-review run — not Stage 0 (no measurement of model adoption) and not Stage 3 (no shipped feature to validate). Treat the responses as input to a decision, not the decision itself.

## 1. Max-width design critique

> You are reviewing a design note for the Igni programming language ahead of v0.13 implementation. Igni is a UI-first language whose north star is "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Token-first**: spacing/colour/etc are named tokens (`small`/`medium`/`large` for spacing, `brand`/`subtle`/`danger` for colour) rather than arbitrary numeric or string values. The motivation is bounded LLM variance — models trained on Tailwind / Material / Bootstrap reach for tokens consistently, whereas numeric values produce per-model noise (one model picks 480, another 500, another 512).
> - **One way to do everything**: every alternative form is rejected on principle. If a feature has two valid syntaxes, one is dropped.
> - **Spec budget, not backlog**: every new keyword is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **Existing layout primitives**: `layout vertical:` and `layout horizontal:` with properties `gap`, `padding`, `align` (start/center/end), `spread`, `background`, `rounded`, `fill: true`. Spacing tokens `small (8px)` / `medium (16px)` / `large (24px)`.
>
> Igni currently has six prior token-based primitives (`style:`, `color:`, `gap:`, `padding:`, `align:`, `background:`) — all six showed near-100% adoption when introduced via cheatsheet update. v0.13's `max-width:` would be the seventh in this family.
>
> The design note follows. Read it carefully. After the note, five specific questions are asked.
>
> ---DESIGN NOTE START---
>
> # v0.13 candidate — `max-width:` on layouts (container width token)
>
> **Date:** 2026-04-22
> **Status:** Design note — **Shape B recommended, Stage 0 skipped as documented methodology discipline (see §Decision). Stage 3 remains required.** Motivation from `docs/private/77_micard_dogfood.md`. Format template from `docs/private/65_v012_count_predicate.md`. Sibling design note: `docs/private/78_v012_font.md` (v0.12 candidate, separate ship per attribution discipline).
>
> ---
>
> ## Motivation
>
> MiCard dogfood (`docs/private/77`) surfaced this gap concretely on desktop. Angela's MiCard is a mobile-only design — portrait phone layout, ~400px wide. On macOS desktop, an Igni `layout horizontal, background: card, rounded: medium:` stretches to the full window width (~1600px on a standard laptop), making the phone/email info cards look comically wide relative to the avatar/name/title block above.
>
> Concrete friction site (from `transpiler/test_apps/mi-card/app.igni`):
>
> ```igni
> layout horizontal, gap: medium, align: center, padding: medium, background: card, rounded: medium:
>   icon "phone", color: teal
>   label "+44 123 456 7890"
> ```
>
> On `igni run macos`: card spans the whole window. No Igni syntax available to say "this card should be at most 480px wide regardless of viewport."
>
> Existing precedent in Igni: inputs have a hardcoded 320px `max-width` cap in codegen (`transpiler/src/codegen.ts` — `ConstrainedBox(constraints: BoxConstraints(maxWidth: 320))` for inputs outside Row context). `max-width:` on layouts generalises that existing pattern to any container. It's not net-new machinery — it's exposing control over an existing mechanism.
>
> Desktop is a new Igni target (`igni run macos` shipped earlier today; see `docs/private/75`). The gap was invisible when Igni was mobile/web-only because mobile viewports are narrow by design. Desktop UX will increasingly hit this — any future real-app shipment to macOS without max-width control will surface the same complaint.
>
> ## Cold-test evidence
>
> **None yet.** No prior cold-test round has forced a layout-width constraint. Earlier rounds tested mobile-only apps (dicee, bmi, quizzler, clima) where the viewport did the constraint work for free. MiCard on desktop is the first reproducible case, and even that is human-authored, not panel-observed.
>
> This is noted honestly for the dissertation record but it does *not* warrant Stage 0 — see §Decision for why.
>
> ## Candidate shapes
>
> ### Shape A — numeric pixel value
>
> ```igni
> layout vertical, max-width: 480:
>   ...
> ```
>
> `max-width:` takes a number in pixels. Matches how images currently take `size: 140` — there's a precedent for numeric values in the spec.
>
> **Rejected** on token-first grounds. Reasoning:
>
> - 480 is an arbitrary breakpoint. Models given numeric freedom pick different values for the same UI — one chooses 400, another 480, another 500, another 512. Every choice looks "reasonable"; the variance is noise, not signal.
> - The `image size: 140` precedent is an existing token-inconsistency in Igni, not a pattern to propagate. See §Future for the image/icon size-token candidate that would retire it.
> - Accepting numeric values here reintroduces exactly the per-LLM variance the token-first principle is designed to eliminate. This is the `padding: 17px` failure mode modern design systems avoid.
>
> ### Shape B — token-based, tokens-only (recommended)
>
> ```igni
> layout vertical, max-width: phone:
>   ...
> ```
>
> `max-width:` takes one of four tokens: `phone` / `tablet` / `desktop` / `full`.
>
> | Token | Pixel-equivalent | Use |
> |---|---|---|
> | `phone` | 480px | Mobile portrait layouts; card UIs |
> | `tablet` | 768px | Mid-size containers; article body widths |
> | `desktop` | 1200px | Typical desktop content columns |
> | `full` | no cap | Explicit form of the current no-`max-width` default. Clarifies intent in code. |
>
> **Pixel equivalents are documented in the cheatsheet for implementer and reviewer transparency** — same precedent as spacing tokens (`small (8px)` / `medium (16px)` / `large (24px)`). But users cannot write `max-width: 540`. **The token set is the spec.** If a real app needs 540px specifically, the answer is "pick `phone` (480) or `tablet` (768) and accept the substitution."
>
> This token-only commitment is the deliberate cost of the token-first principle. If someone is tempted to propose "allow `max-width: 540` for the 8% of cases tokens don't cover," that's Shape C creeping back in — reject it. The commitment holds only if it holds absolutely.
>
> **Name choice:** `phone` / `tablet` / `desktop` match standard responsive-design breakpoints. Models trained on Tailwind (`sm` / `md` / `lg` / `xl`), Material (mobile / tablet / desktop breakpoints), or Bootstrap (`sm` / `md` / `lg`) will reach for our names naturally — they're closest in shape to Material's naming, which reads most cleanly in body text. Four tokens fits the 3–5-per-dimension rule of thumb.
>
> **Orthogonality:** pairs cleanly with existing `fill: true` (flex). `fill: true, max-width: tablet` = "take remaining space up to the tablet-width cap." Composable. No interaction with `padding:`, `gap:`, `align:`, or `background:`.
>
> **Pros:**
> - **Token-first principle.** Zero per-model variance. Four options, unambiguous naming.
> - **Spec budget bounded.** 4 tokens, scope locked.
> - **Matches responsive-design conventions.** Familiar names for LLMs; maintainers don't have to remember custom tokens.
> - **Pixel equivalents documented for transparency.** Spacing-token precedent exactly.
> - **Composable.** No new interaction rules with existing modifiers.
>
> **Cons:**
> - **Users can't hit exact pixel widths.** A designer with a spec saying "cards are 540px" has to pick 480 or 768. This is the deliberate token-only commitment.
> - **Naming locks to responsive-design semantics.** `phone` implies mobile-ish; if someone wants a 480px-wide widget inside a desktop app, the name "phone" might read oddly. Mitigation: the pixel value is the value; the name is a hint. Use what fits.
>
> ### Shape B′ — sub-shape of B (token commitment made visible)
>
> Shape B′ is not a different candidate — it's the explicit naming of Shape B's commitment. Call it out because the commitment is subtle and easy to erode.
>
> - **Pixel equivalents are documented.** Implementers and reviewers see `phone (480)` so they can reason about layout arithmetic.
> - **Users write tokens only.** Never `max-width: 540`. The token set *is* the spec.
> - **No escape hatch.** If cold-test evidence later shows models consistently wanting a value tokens can't express, that's a separate design-note conversation, not an inline escape-hatch addition.
>
> Naming this explicitly so the commitment doesn't drift in future implementation or docs work. If someone later proposes "allow numeric values for the 8% of cases tokens don't cover," they're proposing Shape C — reject it on principle, not pragmatically.
>
> ### Shape C — hybrid (numeric + tokens)
>
> ```igni
> layout vertical, max-width: 480:           # numeric
> layout vertical, max-width: tablet:        # token
> ```
>
> Allow either form. **Rejected.**
>
> - Violates "one way to do everything" explicitly. Two valid syntaxes for the same concept.
> - Reintroduces per-model numeric variance (the exact failure mode Shape A falls into).
> - Weakens the token commitment by making tokens an optional nicety rather than the canonical form.
>
> The temptation to accept Shape C is usually framed as "we can have tokens *and* flexibility." That framing is wrong — the flexibility is precisely what dilutes Igni's LLM-accuracy thesis. Reject.
>
> ### Rejected: pixel-precision positioning (`offset:`, `margin-N-px:`, `translate:`)
>
> Named for the record. Pixel positioning primitives were the source of the pre-plan pushback that prompted this note. All rejected per the token-first principle. If a real app surfaces layout-positioning pain that tokens don't solve, that's a separate design note — and the first question to ask is "can tokens cover this with a new dimension (shadow, radius, z-depth)?" before considering arbitrary pixels.
>
> ## Principles in tension
>
> - **Token-first** → favours B. The design principle crystallised in the pre-plan discussion for this note.
> - **One way to do everything** → favours picking a single shape (A or B, not C). Shape C is out either way.
> - **Cold-test reach** → favours B. Models trained on Tailwind / Material / Bootstrap reach for `phone` / `tablet` / `desktop` naturally.
> - **Precedent of `image size: 140`** → nominally favours A. Noted as an existing token-inconsistency in Igni, *not* a pattern to propagate. See §Future candidates for the follow-on that retires it.
>
> No real tension between Shape B and the project's principles. The tension is between B and the short-term pragmatic argument "but sometimes I need exactly 540" — which is the argument the token commitment is designed to refuse.
>
> ## Orthogonality
>
> Pairs cleanly with existing layout modifiers:
>
> - `fill: true, max-width: tablet` → "take remaining space up to 768px" — useful for main content columns in dashboards.
> - `align: center` + `max-width: phone` on a child layout → "centered 480px-capped card" — the common MiCard-style pattern.
> - No interaction with `gap:`, `padding:`, `background:`, `rounded:`.
>
> ## Decision field — Shape B recommended; Stage 0 skipped as a methodology contribution, not a shortcut
>
> Framing this deliberately because the skip is dissertation-worthy and mis-framing it as pragmatic loses the point:
>
> > **Stage 0 is a tool for measuring design uncertainty, not a mandatory process gate. Cold tests have marginal value when prior-driven predictions are strong. Igni's six prior token-based primitives (`style:`, `color:`, `gap:`, `padding:`, `align:`, `background:`) have all shown near-100% adoption when introduced via cheatsheet update. Running Stage 0 on a seventh token-based primitive would confirm a prediction already held at p > 0.95 — methodological theatre, not measurement.**
> >
> > **The skip itself is the methodology contribution: Stage 0 is for uncertainty, not ceremony. When not to run the test is as principled as when to run it.**
>
> This reframing turns the skip into a finding for the dissertation's methodology chapter, not a deferred to-do. The methodological claim gets cleaner: *Stage 0 is warranted when design uncertainty is high (competing shapes with reasonable priors both); Stage 0 is theatre when priors are already strong.*
>
> Doc 78 (`font:`) retains Stage 0 because Shape B's string-form pull is a genuine uncertainty — models trained on CSS reach for string-form font names reflexively, and measuring that pull against Shape A's token form is exactly what Stage 0 exists for. That's the contrast that gives the skip rule its teeth.
>
> Doc 79 (`max-width:`) does not have an equivalent uncertainty. The shape is unambiguous (one modifier on any layout, four named breakpoints), the precedent is deep (six prior token-based primitives all adopted ≥95%), and the cold-test would measure a near-certainty.
>
> **Stage 3 remains required** with pre-registered adoption thresholds (see §Stage 3). If Stage 3 falsifies the skip, this note gains a "when the prediction was wrong" follow-up section and the skip rule gets recalibrated for future primitives. That failure mode is itself the most valuable methodology data point this note could produce.
>
> ## Stage 3 attribution commitment, with pre-registered adoption bar
>
> When v0.13 ships, Stage 3 validation uses a **desktop-layout-stress prompt** — a multi-column dashboard, or a side-by-side two-panel UI, explicitly targeted at desktop viewport dimensions. No overlap with v0.12's typography prompt (doc 78). This separation preserves the cleanest possible attribution of `max-width:` adoption to v0.13 specifically.
>
> **Pre-registered interpretation** (same cadence as doc 78):
>
> | Stage 3 outcome | Decision |
> |---|---|
> | **4/4** adoption of `max-width: phone|tablet|desktop` tokens | Ship holds. Prior vindicated. Methodology skip justified. |
> | **3/4** | Acceptable. Note the miss (likely a model reaching for a numeric value out of habit). Decide between a docs patch (v0.13.1-style) vs. letting it ride based on whether the miss is teachable. |
> | **2/4 or below** | The Stage-0-skip was wrong. This note gains a "when the prediction was wrong" section capturing what the skip missed (e.g. models reach for numeric because the breakpoint-naming convention is too strong a pull toward responsive-design tokens models expect to receive pixel values alongside). v0.13 is reopened before any further max-width work. The skip rule gets recalibrated — "six prior token primitives" is no longer sufficient warrant for future skips. |
>
> The 2/4-or-below outcome is the most valuable for the methodology chapter even though it'd be a ship-level setback. It'd falsify the "prior-driven skip is safe" claim and force the project to recalibrate when Stage 0 gets skipped in the future. Capturing it honestly matters more than avoiding the face-loss.
>
> ## Future token candidates surfaced by this discussion
>
> Not v0.13. Each needs its own design note before landing. Named here to show the token-first principle's implications across the spec — the design-pattern consistency this note establishes should extend coherently rather than being ad-hoc applied.
>
> ### Radius tokens (candidate for v0.14 or later)
>
> Current: boolean `rounded: true` / omitted. Collapses four useful visual states into two.
>
> Candidate: `rounded: small` / `medium` / `large` / `circle`. Matches the token-first principle; collapses the current Boolean special case into the general spacing-tokens pattern; `circle` shorthand for `BorderRadius.circular(10000)` or equivalent.
>
> Not motivated by MiCard specifically — MiCard is fine with the current `rounded: medium` behaviour. Promote when a real app surfaces friction (e.g. a card UI where small vs large rounded corners are visually meaningful).
>
> ### Shadow tokens (candidate for v0.14+)
>
> No syntax today. Candidate: `shadow: none` / `subtle` / `medium` / `strong` on layouts. Maps to Material elevation (or custom BoxShadow values).
>
> Not MiCard-relevant (Angela's design is flat, no shadows). Flagged by the token-first audit as a missing dimension. Promote when a real app wants card depth.
>
> ### Text-size tokens beyond `heading` / `body` / `caption` (candidate for v0.14+)
>
> MiCard's name (large), title (medium), and contact-row text (small) all sit within the "body" scale but at different sizes. Current tokens collapse that variation.
>
> Candidate: extend the existing `heading.small` dotted-variant pattern to the full scale — `body.small`, `body.large`, `caption.small`, etc. Promote only if a real app surfaces the friction — MiCard didn't quite reach it (we shipped with the current tokens), but a typography-dense app would.
>
> ### Image / icon size tokens (candidate for v0.14+)
>
> The biggest token-inconsistency in the current spec. `image "x", size: 140` and `icon "y", size: 20` both take arbitrary numeric values — the exact pattern this note argues against for max-width.
>
> Candidate tokens (rough): `avatar` (~40px) / `thumb` (~80px) / `full` (~320px) for images; `small` / `medium` / `large` for icons. Promote when a real app surfaces variance.
>
> Not fixing this in v0.13 is deliberate — it would require its own design note and Stage 0 (this would be a *retirement* of an existing numeric primitive, not an addition, which has its own cold-test shape). But naming it here so it doesn't get silently normalised by continued use.
>
> ## Follow-up candidate (not explored today)
>
> **`width:` (exact, not max) on layouts, and `width:` on inputs / buttons** for the borderline-yes input-width override mentioned in doc 77's follow-ups and in the pre-plan discussion for this note.
>
> Stashed as a *next* design-note candidate, not v0.13. Key open questions for that future note:
>
> - Should `width:` take the same 4-token set as `max-width:`, or a different set?
> - Does `width:` replace `max-width:` in practice (if you're going to commit to a width, why bother with max)? Or are they genuinely different use cases?
> - How does the existing hardcoded 320px input cap interact with a user-facing `width:` on input?
>
> Borderline-yes, not urgent. Revisit when a real app needs it or when a cold-test round surfaces the friction.
>
> ## Non-goals
>
> - **Min-width on layouts** — Igni hasn't surfaced a reproducible case. Rejected silently (not via explicit anti-pattern).
> - **Percentage widths** (`max-width: 50%`) — violates token-first. If a real app needs percentages, propose tokens for common cases (`half` / `third` / `quarter`) via a separate design note; don't admit arbitrary percentages.
> - **Viewport-relative units** (`vw`, `vh`) — same reasoning as percentages. Out.
> - **Pixel-precision positioning** (offset, margin-N-px, translate) — rejected per the pre-plan discussion.
> - **Media-query-style breakpoint rules** — `@media (max-width: phone) { ... }` CSS-style conditional blocks. Out of spec — Igni's reactivity model is lexical, not responsive-breakpoint-based.
>
> ## Relation to other candidates
>
> - **v0.12 — `font:` on labels** (`docs/private/78_v012_font.md`). Separate minor version per attribution discipline. Separate Stage 3 prompt (typography-heavy). Orthogonal primitive — no interaction with `max-width:`.
> - **v0.14+ candidates** (see §Future): radius, shadow, text-size, image/icon size tokens. Each its own design note.
> - **Input-width override** (see §Follow-up): borderline-yes, separate note, not v0.13.
>
> ## Appendix — what ships with v0.13 if Shape B lands
>
> Scope of the v0.13 spec change, for implementer reference:
>
> 1. **Cheatsheet:** add `max-width:` row to the layout-modifier section with the 4-token list and pixel equivalents documented.
> 2. **Full spec:** add a Container Width subsection explaining `max-width:` tokens, composability with `fill:`, and the token-only commitment.
> 3. **Micro:** add `max-width: phone | tablet | desktop | full` to the layout modifier list.
> 4. **Transpiler codegen:** `max-width:` on a layout produces `ConstrainedBox(constraints: BoxConstraints(maxWidth: <pixel-value>), child: ...)`. Token-to-pixel map lives alongside spacing tokens in `codegen-helpers.ts`.
> 5. **Diff-test fixture:** add `examples/max-width.igni` + `.expected.dart` pair exercising each token.
> 6. **CHANGELOG:** v0.13 entry naming the motivation (MiCard desktop gap), the shape (Shape B / B′, token-only), the methodology-skip rationale, and the Stage 3 attribution plan.
> 7. **Existing input 320px cap:** decide whether to retire the hardcoded cap in favour of letting inputs accept `max-width:` directly. Probably yes for consistency, but out of scope for this note — a follow-up implementation question.
>
> Not part of this note — implementation is a separate session's work after v0.12 has shipped and its Stage 3 data is in hand.
>
> ---DESIGN NOTE END---
>
> Now please answer all five questions below. Be substantive: a short answer that says "looks fine" is less useful than a paragraph identifying a specific concern, even if you ultimately judge the concern minor. Where you agree with the note, say so explicitly — converging endorsement is signal too.
>
> **Question 1 — Token naming.** Shape B picks `phone` / `tablet` / `desktop` / `full`. Alternatives include Tailwind-style (`sm` / `md` / `lg` / `xl`), Material breakpoints, or semantic-purpose names (`card` / `reading` / `wide` / `unbounded`). Which set would an LLM trained on web/Material/Tailwind reach for most naturally without prompting? What does the current naming get right or wrong? Does `phone` / `tablet` / `desktop` overcommit to device metaphor in cases where the layout is just "a 480px-wide widget" with no device implication?
>
> **Question 2 — Pixel ladder.** `phone: 480` / `tablet: 768` / `desktop: 1200`. Are these the right values? Walk through common UI patterns (article body width, modal width, sidebar, dashboard column, marketing hero) and identify any where these don't snap cleanly. Should the ladder be 5 tokens instead of 4 (e.g. add `wide: 1600` for cinema/dashboard, or insert a `compact: 360` below phone)? Or are 4 sufficient given the project's "3–5-per-dimension" rule of thumb?
>
> **Question 3 — `full` token necessity.** Igni's "one way to do everything" principle is violated if both `max-width: full` AND omission of `max-width:` produce the same result. The note argues `full` "clarifies intent in code." Is that argument earning its keep, or is `full` a one-way-to-do-it violation that should be removed? Walk through the case for and against.
>
> **Question 4 — `fill: true` × `max-width:` composition.** The note says they compose — "take remaining space up to the cap." Walk through what `layout horizontal, fill: true, max-width: tablet` actually means: (a) inside a parent that's wider than 768px (does the layout cap at 768 and let the parent's remaining space go unused?); (b) inside a parent narrower than 768px (does max-width become a no-op?); (c) when used on a sibling alongside other `fill: true` siblings — does it skew the equal-distribution semantics? Identify any edge cases where the spec semantics are ambiguous and would benefit from explicit clarification in the spec text.
>
> **Question 5 — Shape C rejection (no numeric escape hatch).** The note rejects allowing `max-width: 540` as a numeric override even for the 8% of cases tokens don't cover. The argument is purely principled: numeric values reintroduce per-LLM variance. Is this rigidity defensible long-term, or does it create real-world friction that will surface as cold-test failure or developer churn? If you think the rejection holds, name the strongest counter-argument and explain why it doesn't ultimately move you. If you think the rejection is wrong, propose a specific shape for a controlled escape hatch that doesn't reintroduce the variance Shape A suffers from.
>
> Prose response, no code blocks. ~600–1200 words total across all five questions is a reasonable target — go longer if a question genuinely needs it, shorter if you have a clean answer that doesn't need padding.

