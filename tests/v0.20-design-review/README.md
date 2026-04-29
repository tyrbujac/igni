# v0.20 Stage 2 design review — dark-mode propagation

**Date:** 2026-04-29.
**Method:** 3 frontier models × 1 prompt × 6 questions (single embedded design note from `docs/private/118_v020_dark_mode.md`). `--no-spec --no-grade` (prose critique, not Igni source).
**Models:** `claude-opus-4-7`, `gpt-5.5-2026-04-23`, `gemini-3.1-pro-preview`.
**Sequential mode** (canonical for ship-validation reproducibility).
**Cost:** $0.2985 across 3 cells (within ~$0.30-0.50 estimate).
**Outputs:** `claude-opus-4-7_*.md`, `gpt-5.5_*.md`, `gemini-3.1-pro-preview_*.md` (this directory).

The panel was framed with **Q1 anti-anchoring** — *"give the strongest case AGAINST option (b)"* — to guard against panel agreement that's more anchoring than load-bearing critique. The framing worked: 2/3 cells produced substantive architectural arguments for deferral or alternative shape. Whether to fire Trigger A (panel flips option b) is the load-bearing decision this synthesis surfaces.

## Convergence by question

### Q1 — Strongest case AGAINST option (b)

| Cell | Position | Substance (one-line summary) |
|---|---|---|
| Opus | REFINE | (b) survives, but Boojy gap is solvable by (a) alone; recommend ship (a) at v0.20 + (b) at v0.21 to pressure-test selector against a11y |
| GPT | HOLD | (b) introduces a "magic leak" but the observed failure IS missing active-theme selection, not just AppBar tokens — converges with (b) acknowledging architectural cost |
| Gemini | FLIP | (b) hardcodes binary state into AST; v1.0 needs generic theming axes (high-contrast, density, sepia, white-labeling); recommends (c) plus future generic `modes:` primitive |

**Convergence summary:** 3/3 acknowledge (b) weakens "no magic." 2/3 substantively argue for deferral or reshape (Opus deferral, Gemini reshape). 1/3 holds with caveats (GPT). **Strict Trigger-A reading: 1/3 FLIP < 2/3 threshold. Architectural reading: 2/3 pause-or-reshape pressure.**

This is the load-bearing decision (see §The Trigger A decision below).

### Q2 — Runtime selector mechanism

| Cell | Position | Substance |
|---|---|---|
| Opus | REFINE | tri-state `null/true/false` is LLM-authoring gap (models drop the null case); explicit enum `shared.theme_mode: auto/light/dark` |
| GPT | REFINE | tri-state OK for spec budget; explicit enum `system/light/dark` clearer if budget allows; cheatsheet must teach canonical pattern |
| Gemini | REFINE | tri-state is "LLM poison" — models will write `dark_mode = !dark_mode` and break null; explicit enum `system/light/dark` |

**Convergence: 3/3 REFINE → PATCH.** All three propose the same fix: replace tri-state boolean with explicit enum. Naming variants (`auto/light/dark` vs `system/light/dark`); GPT prefers `system`, Gemini prefers `system`, Opus prefers `auto`. Recommendation: `system | light | dark` (2/3 specific naming convergence).

### Q3 — User-defined token composition with dark variant

| Cell | Position | Substance |
|---|---|---|
| Opus | FLIP | Auto-fall-back (c.ii) + lint warning on structural-chrome tokens missing dark variant; in real 23-token Figma only 4-7 differ |
| GPT | HOLD | Strict-pair is right discipline; 14-19 of 23 tokens differ; explicit duplication > invisible fallback; matches Figma per-mode model |
| Gemini | FLIP | Strict-pair violates spec budget; ~7 of 25 invert, ~18 stay static; CSS + Figma both use cascade/fallback; `theme dark:` is a sparse override layer |

**Convergence: 2/3 FLIP toward (c.ii) auto-fall-back with the *same* concrete suggestion → treat as 3/3 PATCH per stage-2-review skill rule.** Opus + Gemini independently propose the same fix; GPT dissents on the empirical-prior question (how many tokens actually differ).

**Material disagreement on the empirical question** — Opus 4-7 of 23, Gemini ~7 of 25, GPT 14-19 of 23. This is not directly resolvable without a concrete real-Figma sample. The auto-fall-back design works for both ends of the range; strict-pair only works cleanly if GPT's 14-19 estimate is right. Auto-fall-back + lint warning hedges: cheatsheet teaches "declare in `theme dark:` only when distinct"; lint catches the dangerous case (structural-chrome token used in `background:` or `scaffold:` without explicit dark override).

### Q4 — Default-text scope and structural/semantic boundary

| Cell | Position | Substance |
|---|---|---|
| Opus | REFINE — option `(a) ∪ (b)` | Reserve structural sub-blocks `scaffold:` / `appbar:` / `default_text:` *inside* `theme:`; `theme: color:` stays purely user-defined; default-text scope (d.ii) structural-text-only |
| GPT | REFINE — option `(a) ∪ (b)` | option (b) for variants + structural split (`scaffold:`, `appbar:`); avoid vague `default_text` token; use semantic role `text` or `on_surface` |
| Gemini | REFINE — option `(a) ∪ (b)` | Mixing structural defaults and semantic colours violates "one way to do everything"; structural chrome belongs in own namespace; preserve `theme: appbar:` |

**Convergence: 3/3 REFINE → PATCH.** All three independently arrive at the same reshape: `(a) ∪ (b)` — combine option (a)'s sub-block structure for chrome with option (b)'s `theme: dark:` variant pair. **The Stage 1 trilemma was wrong. The answer is a combination, not a choice.**

The reshaped shape:
```igni
theme:
  color:
    brand: "#80CBC4"
    surface: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"   # auto-fall-back inherits brand from light
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text
```

### Q5 — Forward-coupling rule (active-variant token resolution)

| Cell | Position | Substance |
|---|---|---|
| Opus | FLIP | Defer to colour tokens only; explicitly leave shadow ontology unspecified (dark-mode shadows often lighter highlights, not darker drop-shadows) |
| GPT | HOLD with scoping | Commit late-binding generally; don't pre-commit shadow ontology; variant-defined presets compose cleanly |
| Gemini | HOLD | Active-variant resolution invariant in v0.20 *enables* future `theme dark: shadow: elevated:` overrides; foundational |

**Convergence: 2/3 HOLD with same scoping (commit late-binding, don't constrain future visual-chrome ontology) + 1/3 FLIP (defer to colour-only).** Per stage-2-review: 2/3 with same concrete suggestion. **PATCH wording but HOLD the rule:** commit "active-variant resolution applies to theme tokens" without naming what shadow primitives will look like. Opus's concern is addressable via wording rather than via deferring the rule entirely.

### Q6 — Open-ended framing pressure

| Concern raised | Cells | Convergence |
|---|---|---|
| **Theme transition animation** interaction with v0.19 `transition:` | Opus + GPT + Gemini | **3/3 → PATCH** |
| **Generic selector machinery** shared with v0.21 a11y (high-contrast, large-text, reduced-motion) | Opus + GPT | 2/3 → PATCH (same concern) |
| **Bundling concerns** — split workstream A from B+C | Opus (full split) + GPT (conditional split) | 2/3 → CONSIDER (couples with Trigger A) |
| Snapshot testing dark-mode hook (`mock brightness:` or similar) | GPT alone | 1/3 → LOG to ROADMAP |
| Behavior when `theme dark:` is absent | GPT alone | 1/3 → LOG (codegen-detail) |
| Generic `modes:` primitive instead of binary dark | Gemini alone | 1/3 → LOG to ROADMAP |

## Decisions

### Patch (apply to doc 118 + spec text)

| # | Patch | Convergence |
|---|---|---|
| 1 | **Q2 enum** — replace tri-state boolean with explicit enum `shared.theme_mode: system / light / dark` | 3/3 |
| 2 | **Q3 auto-fall-back** — (c.ii) for missing dark variant; add lint warning on structural-chrome tokens missing dark override (Workstream C v2 feature) | 2/3 same suggestion → 3/3 |
| 3 | **Q4 reshape — `(a) ∪ (b)`** — keep `theme: color:` user-defined + add `theme: scaffold:` / `theme: appbar:` sub-blocks; `theme dark:` mirrors both | 3/3 |
| 4 | **Q5 scoping** — wording refinement: "active-variant resolution applies to theme tokens" without pre-committing future visual-chrome ontology | 2/3 same scoping → 3/3 |
| 5 | **Q6 theme-transition rule** — explicitly state instant-snap (recommended) OR design transition story; don't leave ambient | 3/3 |
| 6 | **Q6 generic-selector framing** — design `shared.theme_mode` so v0.21 a11y can add `shared.contrast_mode` / `shared.motion_mode` through same resolver | 2/3 same concern → 3/3 |

### Consider (Tyr decision)

| # | Item | Substance |
|---|---|---|
| 7 | **Workstream split** (A standalone vs A+B+C bundled) | 2/3 raise concern. Opus full split (A as own cycle); GPT conditional split (only if A stays narrow). Couples with Trigger A — if Reading A applies, bundle stays; if Reading B, A becomes its own cycle. |

### Log (don't block ship)

| # | Item | Destination |
|---|---|---|
| 8 | Snapshot testing dark-mode hook (`mock brightness:`) | ROADMAP Stream 3 (1/3) |
| 9 | Behavior when `theme dark:` is absent | Resolve at implementation (Session 6) |
| 10 | Generic `modes:` primitive replacing binary dark | ROADMAP Stream 3 (1/3 — Gemini's Q1 lean position; methodology-relevant for v0.22+) |

## The Trigger A decision

The watch-list trigger A in doc 118 reads: *"if 2/3+ cells argue against (b) on architectural grounds — citing a load-bearing invariant the recommendation weakens, OR a real-app shape (b) closes off that (a)/(c) leave open."* Strict reading: 1/3 FLIP. Architectural reading: 2/3 substantive arguments for pause/reshape.

Three readings:

**Reading A — Trigger A does NOT fire.** Strict 1/3 < 2/3. Apply patches 1-6; ship (b) v0.20 with the reshape. After patches, (b) is closer to `(a) ∪ (b)` with explicit-enum + auto-fall-back than the original (b). GPT's HOLD is the median; Opus's REFINE acknowledges (b) survives; Gemini's FLIP is the architectural-objection minority. Patches 1-6 substantially address the panel's architectural concerns (no more tri-state, structural/semantic split, generic-selector forward-compat, transition rule).

**Reading B — Trigger A fires; ship (a) at v0.20, (b) at v0.21.** Per principled-minority pattern (`docs/private/114`), panel converges on a load-bearing architectural objection (no-magic + spec-budget). Opus's "Boojy is solvable by (a) alone; selector design needs a11y pressure-test" is the cleanest deferral argument. Cost: one cycle of pressure-testing the selector against a11y before locking. v0.20 ships only `(a)` sub-blocks for chrome (still the Q4 `(a) ∪ (b)` insight applies; just without `theme dark:` variant pair).

**Reading C — Major reshape per Gemini.** Generic `modes:` primitive replaces dark-specific `theme dark:`. Most aggressive; biggest spec-budget cost. 1/3 panel signal alone is below the patch threshold; LOG to ROADMAP for v0.22+ unless v0.21 a11y design surfaces the same concern (compounding signal would promote).

**Methodology note.** The anti-anchoring Q1 framing produced exactly the kind of architectural critique it was designed to surface. Whichever reading Tyr commits to, the framing succeeded — *substantive arguments against* the recommendation surfaced (Opus's concrete deferral case; Gemini's generic-modes critique). Even if Reading A applies and patches 1-6 reshape (b) into `(a) ∪ (b)`, the panel produced a "non-reversal" data point worth catalogueing alongside `docs/private/114`'s three reversal instances. The pattern's catalogue extends from "panel convergence + architecture overrides" to "panel pushback + architecture surveys + decides which case is load-bearing."

## What stays unchanged

- **Path C lens** — Figma variable modes mapping: 3/3 panel implicitly supports the Figma-modes precedent (Opus + GPT + Gemini all reference Figma's mode-fallback model). Whichever reading wins, the design-by-translating commitment holds.
- **Compile-time-token rule reframing** — 3/3 acknowledge the rule was designed for definitions, not selection. The reframing-as-open-question framing held.
- **Pre-registered ship bars** — Stage 0 (3/3 P1+P2; ≥2/3 P3) and Stage 3 (4/4 P1+P2; 3/4 P3) unchanged. Reshape doesn't affect ship-bar shape.
- **Workstream B (spacing tokens)** — orthogonal. Stage 2 didn't critique B; B's design note (`docs/private/119`) is unaffected.
- **Workstream C (`lint-spec-trio.ts`)** — already shipped v1 (commit `037f685`). Patch 2's lint-warning-on-structural-chrome-tokens is a v2 feature for after v0.20 spec lands; doesn't block v1.

## Next steps

**1. Tyr decides Reading A vs B vs C** (this synthesis surfaces the contested Trigger A; the decision is the cycle's load-bearing call for this session).

**2. After decision:**
- **If Reading A:** Apply patches 1-6 to `docs/private/118_v020_dark_mode.md`. Update Cycle status line: *"Stage 2 panel run; Q1 contested (Trigger A held; principled-minority architecture survey: Tyr decided panel concerns substantially addressable via patches 1-6 rather than via deferral). 6/6 PATCHES applied for Q2-Q6. Next: Stage 0 cheatsheet draft cold-test."*
- **If Reading B:** Apply Q4 reshape `(a) ∪ (b)` *without* `theme dark:` variant pair (just the structural sub-blocks). Defer Q2 enum + Q3 auto-fall-back + Q5 scoping + Q6 selector framing to v0.21. Update Cycle status: *"Stage 2 panel run; Trigger A fired (2/3 architectural pause-pressure). v0.20 ships (a) only — sub-blocks for chrome — and v0.21 adds variant pair after a11y design pressure-tests selector machinery. Next: Stage 0 cheatsheet draft for the (a)-only scope."*
- **If Reading C:** Halt v0.20 dark-mode workstream; redesign as generic `modes:` primitive for v0.22+ after v0.21 a11y signal compounds. Workstream B (spacing) + C (lint) ship as v0.20 alone.

**3. ROADMAP Stream 3 updates** (regardless of reading): Add 1/3 logs for snapshot dark-mode hook and generic `modes:` primitive.

**4. Commit Session 3** (single commit): synthesis README + ROADMAP updates + (if Reading A or B) doc 118 patches as local-only.

**5. Optional methodology entry** (Tyr decides): if Reading A, consider a "non-reversal" data point in `docs/private/114_principled_minority_pattern.md` — fourth instance, different shape (panel converges on architectural objection but architecture surveys and decides patches address the concern rather than reversing). Methodology-chapter §4a (`docs/private/117`) gets the same data point.
