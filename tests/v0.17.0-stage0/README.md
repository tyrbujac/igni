# v0.17.0 `border:` Stage 0 — adoption test

**Status: prompts ready, runs pending.** Pre-implementation cold test for the `border:` layout property (design note `docs/private/111`).

## What this is

Stage 0 measures whether the cheatsheet *teaches* the new primitive well enough that frontier models reach for it canonically when given relevant prompts. It runs *before* implementation — if Stage 0 fails, the teaching needs to be sharper before parser/codegen work begins.

The cheatsheet draft at `cheatsheet-draft.md` is the v0.16.0 cheatsheet with one new subsection (`### Border`) added between the layout-properties body and the `### Background images` section. The draft also adds `border` to the layout-properties summary list and bumps the version header to v0.17.0.

## Panel composition

| Model | Provider | ID | Notes |
|---|---|---|---|
| Claude Opus 4.7 | Anthropic | `claude-opus-4-7` | — |
| GPT-5.5 | OpenAI | `gpt-5.5` | `--effort high` |
| Gemini 3.1 Pro Preview | Google | `gemini-3.1-pro-preview` | — |

Three frontier models matches the existing Stage 0 pattern (`tests/v0.15.0-stage0/`). Flash-lite is reserved for Stage 3 noise-tier validation, not Stage 0 adoption.

## Prompts

Three prompts in `prompts.md` covering Walls 1-2 from doc 111 plus the over-declaration test:

- **P1 — Outlined settings card** *(canonical use, Wall 1 closure)* — outline-only cards, no fill.
- **P2 — Selected payment method** *(state-carrying border, Wall 2 closure)* — border carries selection state.
- **P3 — Profile screen with mixed border use** *(over-declaration test)* — only the action buttons get borders, not the profile block.

## Pre-registered ship bar

- **Strong (3/3 P1 + 3/3 P2 + ≥2/3 P3):** proceed to implementation.
- **Soft (2/3 on P1 or P2):** patch cheatsheet teaching (the framing/example wasn't sharp enough), re-run.
- **Fail (≤1/3 P1):** reopen design — the width vocabulary or the proposed shape isn't reaching for what models naturally produce.

## Running the panel

API runner at `tests/runner/`. Run with `--spec ../v0.17.0-stage0/cheatsheet-draft.md` (the draft cheatsheet is the spec for Stage 0) and `--no-grade` (transpiler doesn't yet support `border:`; auto-grade would falsely fail every cell).

```bash
cd tests/runner

# Anthropic
npx tsx run.ts \
  --model claude-opus-4-7 \
  --spec ../v0.17.0-stage0/cheatsheet-draft.md \
  --prompts ../v0.17.0-stage0/prompts.md \
  --out ../v0.17.0-stage0 \
  --no-grade

# OpenAI (high reasoning)
npx tsx run.ts \
  --model gpt-5.5 \
  --effort high \
  --spec ../v0.17.0-stage0/cheatsheet-draft.md \
  --prompts ../v0.17.0-stage0/prompts.md \
  --out ../v0.17.0-stage0 \
  --no-grade

# Google Pro
npx tsx run.ts \
  --model gemini-3.1-pro-preview \
  --spec ../v0.17.0-stage0/cheatsheet-draft.md \
  --prompts ../v0.17.0-stage0/prompts.md \
  --out ../v0.17.0-stage0 \
  --no-grade
```

9 outputs total when complete (`<model>_cheatsheet_<slug>.{md,json}` × 3 prompts × 3 models). Cost target: ~$0.27 (matches v0.15.0).

## Synthesis

After all 9 cells complete, append a synthesis section to this README with:

- **Per-prompt adoption table** — rows = P1/P2/P3, columns = each model, cells = canonical adoption (✅) / partial (⚠️) / off-shape (❌).
- **Strongest dissent** — any cell that explicitly chose a non-canonical shape, with a one-line quote of the model's reasoning.
- **Ship-bar verdict** — strong / soft / fail, with the ship gate cited explicitly.
- **Trap-journal candidates** — any unexpected shapes worth logging even if the ship bar passed.
- **Cheatsheet patch list** — if soft-fail, what the teaching needs to make sharper before re-run.
- **Cost** — sum of `usage` fields.

## Out of scope

- Implementation (parser / codegen / fixtures). Begins after Stage 0 passes.
- Stage 3 (post-implementation panel). Comes later.
- v0.18 shadow design preparatory work.

---

# Synthesis (2026-04-27)

**Headline: STRONG PASS. 3/3 P1 + 3/3 P2 + 3/3 P3.** Ship bar exceeded on all three prompts. Cheatsheet teaching works — proceed to implementation.

**Total cost:** $0.3478 across 9 cells (claude-opus-4-7 $0.0991 + gpt-5.5 high $0.1899 + gemini-3.1-pro-preview $0.0588). Slightly over the $0.27 forecast — high-effort GPT was the cost driver.

## Per-prompt adoption table

| Prompt | claude-opus-4-7 | gpt-5.5 | gemini-3.1-pro-preview |
|---|---|---|---|
| **P1 — Outlined settings card** | ✅ canonical | ✅ canonical (with `each` loop) | ✅ canonical (with `each` loop) |
| **P2 — Selected payment method** | ✅ canonical *(two-helper bonus)* | ✅ canonical *(two-helper bonus)* | ✅ canonical *(two-helper bonus, with explanatory prose)* |
| **P3 — Profile screen with mixed border use** | ✅ correct exclusion | ✅ correct exclusion | ✅ correct exclusion *(abstracts to OutlinedButton component)* |

All 9 cells used `border: <thin\|medium\|thick>` correctly. Zero invented alternatives, zero numeric/pixel widths, zero inline hex on `color:`. Every cell that needed an outlined card used `padding: medium, rounded: medium, border: thin:` — the canonical shape.

## Convergent unprompted finding — two-helper selection pattern (3/3)

The cheatsheet's selected-state example only shows **one** helper (`border_for(method)` returning a colour token). All three models extended this to **two** helpers — one for width, one for colour — both vary by selection:

```igni
border: width_for(method), color: color_for(method)

width_for(method):
  if method is selected:
    return thick
  return thin

color_for(method):
  if method is selected:
    return brand
  return subtle
```

This is the cleaner shape (selection signalled via *both* width and colour, not just colour), and it's convergent across all 3 frontier models without prompting. **Patch candidate for the cheatsheet:** show this two-helper version as the canonical selected-state pattern. The single-helper version in the current draft under-teaches.

## Stretched-primitive signal — outlined buttons (3/3)

P3's "three labelled action buttons each with a thin outline" forced every model to confront that `border:` applies to **layouts only**, not to the `button` primitive. Three different workarounds emerged:

| Model | Shape |
|---|---|
| Opus | Tappable layouts with `on tap:` (no `button` primitive used at all — just labelled `layout vertical, ..., border: thin, on tap:`) |
| GPT-5.5 | Layout wrapping a `button` primitive: `layout vertical, border: thin, rounded: medium:` containing `button "Edit", on tap: ...` |
| Gemini Pro | Custom `OutlinedButton` component wrapping a tappable layout — explicitly noted "the `button` primitive doesn't natively take a `border:` property in Igni, so the canonical way to create an outlined button is to use a tappable `layout` with `border: thin`" |

All three correctly kept the profile block border-free and the action area bordered, satisfying P3's over-declaration check. But the *workaround diversity* is real signal: there's no single canonical shape for "outlined button" in v0.17.

**Three resolution paths** (Tyr decision):

1. **Add a cheatsheet pin** in the v0.17 ship spec: explicitly teach "for outlined buttons, wrap a `button` in a bordered layout, or use a tappable layout with `on tap:`." Pick one of the three workarounds as canonical (Gemini's `OutlinedButton` component is most idiomatic but adds a custom-component requirement; Opus's tappable-layout is simplest but loses the `button` primitive's affordances; GPT's wrapper is the middle ground). My read: **GPT's wrapper-layout shape is the cleanest cheatsheet pin** — uses `button` for affordance + accessibility, layout for border, no custom component needed.
2. **Extend `border:` to `button`** in v0.17 itself — adds scope. Risk: cascades to "should `button` accept `rounded:`/`background:` too?" (it has those via theme tokens). The button primitive's styling surface is currently theme-driven (`color: brand`/`subtle`/`danger`); adding `border:` breaks that pattern.
3. **Ship a `button` `variant: outline` modifier in v0.18 or later**. Cleanest long-term shape (matches Material/SwiftUI/Compose's `OutlinedButton` peer-vocabulary), but adds a new keyword. Defer per Path C scope discipline.

**Recommendation: option 1** for v0.17 ship — cheap, doesn't touch syntax. Promote option 3 if the cheatsheet pin doesn't hold in Stage 3 (i.e. if Stage 3 panels regress to inventing their own bordered-button shapes despite the pin).

## Trap-journal candidates

- **Cheatsheet single-helper teaching under-teaches the two-helper selected-state pattern.** 3/3 panel cells extended to two helpers. *Cheatsheet patch candidate (P1) for v0.17 ship.*
- **Outlined-button workaround diversity (3/3 different shapes).** *Cheatsheet pin candidate (P1) for v0.17 ship + cookbook entry candidate.*

## Ship-bar verdict

**STRONG PASS** — exceeds the pre-registered ship bar (3/3 P1 + 3/3 P2 + ≥2/3 P3 → actual: 3/3 + 3/3 + 3/3).

**Proceed to implementation.** Two cheatsheet patches recommended *before* implementation lands so the v0.17 ship cheatsheet teaches the strongest shape:

1. Replace the single-helper selected-state example in the `### Border` subsection with the two-helper version (width + colour).
2. Add a one-line pin: "for outlined buttons, wrap a `button` in a bordered layout — `border:` applies to layouts only, not to primitive `button`." Cite GPT's wrapper shape.

These are docs-only patches to `cheatsheet-draft.md` (and ultimately `spec/v0.17.0-cheatsheet.md` at ship time); no spec or syntax change.

## Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.0991 |
| gpt-5.5 (effort: high) | $0.1899 |
| gemini-3.1-pro-preview | $0.0588 |
| **Total** | **$0.3478** |

Cumulative v0.17 cycle so far: $0.149 (Stage 2) + $0.348 (Stage 0) = **$0.497**. Implementation + Stage 3 still ahead.
