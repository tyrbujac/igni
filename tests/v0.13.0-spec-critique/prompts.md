# v0.13.0 spec/cheatsheet teachability critique

Single prompt asking three frontier models (GPT-5.5 high, Claude Opus 4.7, Gemini 3.1 Pro) to read the just-shipped v0.13.0 spec/cheatsheet/micro text for the new `max_width:` property and identify clarity gaps. Run via `tests/runner/run.ts` with `--no-spec --no-grade`. Outputs are prose, not Igni code.

This is a **post-ship teachability critique** — distinct from the pre-implementation design-review run at `tests/v0.13-design-review/` which reviewed the design note. This reviews the user-facing artifact. New methodology shape.

## 1. v0.13.0 spec/cheatsheet/micro teachability critique

> You are reviewing the just-shipped v0.13.0 spec text for the Igni programming language's `max_width:` layout property. Igni is a UI-first language whose north star is "Flutter, without the bracket hell" — indentation and colons, no braces, no parentheses on component invocation, no string interpolation, one way to do everything. Designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong. Token-first: spacing/colour are named tokens (`small`/`medium`/`large` for spacing) rather than numeric values, to bound LLM variance.
>
> Three artifacts follow: the §Container Width subsection from the full spec, the cheatsheet paragraph + example, and the micro entry. Read them carefully. Five focused questions follow.
>
> ---SPEC §Container width (from spec/v0.13.0.md)---
>
> ### Container width
>
> `max_width:` caps a layout's width at one of three tokens: `phone` / `tablet` / `desktop`. Useful when a card or content column should not stretch the full window on desktop.
>
> | Token | Pixel cap | Use |
> |---|---|---|
> | `phone` | 480px | Mobile portrait layouts; cards |
> | `tablet` | 768px | Mid-size containers; article body widths |
> | `desktop` | 1200px | Typical desktop content columns |
>
> ```igni
> layout vertical, align: center, max_width: phone, padding: medium, background: card, rounded: medium:
>   label "MiCard", style: heading
>   label "+44 123 456 7890"
> ```
>
> **Omitting `max_width:` is the canonical form for an uncapped layout.** Don't introduce a `none` or `full` token to "clarify intent" — absence is the answer. The token set above *is* the spec; users cannot write `max_width: 540`. If a real app needs 540px specifically, pick `phone` (480) or `tablet` (768) and accept the substitution. The token-only commitment is deliberate — see §Styling for the broader token-first discipline.
>
> **Composition with `fill: true` and box model.**
>
> 1. **Without `fill: true`**, a layout with `max_width:` shrink-wraps to its content's intrinsic width, capped at the token's pixel value. No expansion to fill parent space.
> 2. **With `fill: true` and the parent wider than the cap**, the layout caps at the token's pixel value. The remaining parent space is unused at the layout level; final placement of the capped layout follows the parent's `align:` (default `start`).
> 3. **With `fill: true` and the parent narrower than the cap**, `max_width:` is a no-op. The layout fills the parent's available width.
> 4. **Multiple `fill: true` siblings, one capped:** flex-grow semantics — siblings split available space equally until the capped sibling hits its cap and freezes; remaining space is redistributed proportionally among uncapped `fill: true` siblings. If all `fill: true` siblings are capped and slack remains, the slack belongs to the parent and is governed by parent `align:` / `spread:`.
> 5. **Box model.** `max_width:` caps the outer rendered layout box, *including* `padding:` and `background:`. So `max_width: phone, padding: large` produces a layout that is 480px wide *including* the 24px padding on each side — the inner content area is 432px. This matches CSS `box-sizing: border-box`.
>
> ---CHEATSHEET (from spec/v0.13.0-cheatsheet.md)---
>
> Properties: `gap`, `padding`, `align` (start/center/end), `spread: true`, `background`, `max_width`, `rounded`, `fill: true`.
>
> [...other content about gap/fill...]
>
> **`max_width:` caps a layout's width** at one of three tokens — `phone` (480px) / `tablet` (768px) / `desktop` (1200px). Omitting `max_width:` is the canonical uncapped form (no `full` token). Tokens-only — `max_width: 540` is invalid; pick the nearest token. `max_width:` caps include padding/background (CSS `box-sizing: border-box`). Composes with `fill: true`: capped sibling caps; uncapped `fill: true` siblings absorb redistributed slack.
>
> ```igni
> layout vertical, align: center, max_width: phone, padding: medium, background: card, rounded: medium:
>   label "MiCard", style: heading
>   label "+44 123 456 7890"
> ```
>
> ---MICRO (from spec/v0.13.0-micro.md)---
>
> ```igni
> layout vertical, max_width: phone, align: center:
>   label "Capped at 480px, centered"
> ```
>
> `vertical` | `horizontal`. `fill: true` is layout-only; siblings split space equally. `max_width: phone | tablet | desktop` (480 / 768 / 1200) caps width — omit for uncapped (no `full` token); cap includes padding/background.
>
> ---END ARTIFACTS---
>
> Now answer the five questions below. Be substantive: a paragraph identifying a specific concern is more useful than "looks fine," even if you ultimately judge the concern minor. Where you agree with the text, say so explicitly — converging endorsement is signal too.
>
> **Question 1 — Composition rules clarity.** The five composition rules cover the `fill: true` × `max_width:` interaction. Are they clearly stated? Specifically: is rule 4 (multi-fill-sibling redistribution) understandable to a reader who hasn't seen Flutter's flex-grow algorithm? Is "remaining space is redistributed proportionally among uncapped `fill: true` siblings" precise enough, or does it leave open how tied flex weights resolve?
>
> **Question 2 — Box-model rule (rule 5).** Rule 5 says `max_width: phone, padding: large` produces a 480px outer with 432px inner content. Is this communicated clearly enough? Would a reader trace through that arithmetic correctly without explicit annotation, or would they confuse "max width 480" with "content width 480"?
>
> **Question 3 — Cheatsheet density.** The cheatsheet has one paragraph + one MiCard-style example. Sufficient, or should it include a second example showing a `fill: true, max_width:` composition (since that's where the 5 spec rules concentrate)? Cheatsheets in Igni are meant to be scan-oriented — does adding an example pay for the density cost?
>
> **Question 4 — Micro and the absent `full` token.** The micro is one line and ends with "omit for uncapped (no `full` token)." Does that hint land? Or could a reader, primed by web/CSS conventions, hallucinate `max_width: full`, `max_width: none`, or `max_width: auto` on the strength of the property name despite the explicit "no full token" clause?
>
> **Question 5 — Anything else.** Surprising omissions, ambiguous wording, missing edge cases, or anything in the artifacts that would mislead an LLM or a human reader cold. This is the wildcard question — flag whatever caught your eye that didn't fit Questions 1–4.
>
> Prose response, no Igni code blocks needed. ~600–1000 words target across all five answers; longer is fine if a question genuinely needs it.

