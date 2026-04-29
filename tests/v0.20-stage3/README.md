# v0.20 Stage 3 ship-validation — dark-mode + spacing tokens

**Date:** 2026-04-29.
**Method:** 4 frontier models × 3 prompts × shipped cheatsheet (`spec/v0.20.0-cheatsheet.md`, 7228 words). `--no-grade` (auto-grade against panel output introduces churn for canonical-shape variation per cycle precedent).
**Models:** `claude-opus-4-7`, `gpt-5.5-2026-04-23`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview` (noise tier).
**Sequential mode** (canonical for ship-validation reproducibility).
**Cost:** $0.7198 across 12 cells.
**Outputs:** 12 `<model>_cheatsheet_<prompt-slug>.md` + 12 `.json` (this directory).

**Cumulative v0.20 cycle cost:** $0.30 (Stage 2) + $0.83 (Stage 0) + $0.72 (Stage 3) = **$1.85**. Comparable to v0.19's $1.55 cumulative.

## Verdict — STRONG PASS, 12/12 canonical on load-bearing dimensions

Pre-registered ship bar:
- **Strong:** 4/4 P1 + 4/4 P2 + ≥3/4 P3
- **Soft:** 3/4 on P1 or P2
- **Fail:** ≤2/4 P1

Result: **4/4 P1 + 4/4 P2 + 4/4 P3 = 12/12 cells canonical on the load-bearing dimensions.** Strong pass; **exceeds** the pre-reg threshold (P3 was a soft-target ≥3/4, hit 4/4).

This is the v0.20 cycle's second 9+/9+ canonical outcome (after Stage 0's 9/9). v0.19 also hit 12/12 at Stage 3; v0.20 makes two consecutive ships with clean post-implementation panel results. Logged as a methodology data point — see §Methodology data points below.

## Convergence by prompt

### P1 — Settings screen with light/dark theme toggle (4/4 canonical)

| Cell | `theme dark:` pair | `shared.theme_mode = "system"` | Auto-fall-back of `brand` | Scaffold + AppBar sub-blocks | Radio shape |
|---|---|---|---|---|---|
| Opus | ✓ | ✓ | ✓ (with explicit comment) | ✓ light only (auto-fall-back at sub-block level) | Extracted `ThemeOption` component |
| GPT | ✓ | ✓ | ✓ (with explicit comment) | ✓ both variants | Inline-repeated tappable rows |
| Gemini Pro | ✓ | ✓ | ✓ (with explicit comment) | ✓ both variants | `each mode in modes:` over a 3-element list |
| Flash-lite | ✓ | ✓ | ✓ (with comment) | ✓ light only | Extracted `Option` component |

All four cells reach the load-bearing canonical shape. **Methodology note (Opus + Flash-lite):** both omitted scaffold/appbar from `theme dark:` and relied on auto-fall-back at the sub-block level (light-variant scaffold reference held; the `surface` token inside resolves through the active variant via the codegen's variant-aware emission). This is the design-as-shipped behaviour — Session 6b's codegen explicitly auto-falls-back missing dark sub-blocks, so this adoption shape is canonical not buggy.

**Flash-lite minor observation:** used `width = "thin"` as a string-literal-bound variable for selected-state border styling (`border: width`). The shape works at runtime — Igni's `_igniBorderWidth` resolver matches on string values — but diverges from the cheatsheet's canonical pattern (token-as-bare-identifier, e.g., `width = thin`). Logged as a minor Stage 3 observation; not a P1 fail (the dark-mode adoption itself is fully canonical).

### P2 — Greeting card with fine-grained typography spacing (4/4 canonical)

| Cell | Token style | All 4 spacings correct (32 / 16 / 12 / 20 px) | Heuristic-following reasoning |
|---|---|---|---|
| Opus | **Mixed: numeric for non-aliased, word for 16 px** | ✓ (8 / 4 / 3 / 5 + medium for 16) | Explicit table justifying each choice; aligns with cheatsheet S0-3 heuristic |
| GPT | **Numeric `spacing/N` exclusively** | ✓ (8 / 4 / 3 / 5) | Justified: card matches specific pixel targets |
| Gemini Pro | **Numeric exclusively** | ✓ (8 / 4 / 3 / 5) | "Numeric scale ... for highly specific intervals" |
| Flash-lite | **Numeric exclusively** | ✓ (8 / 4 / 3 / 5) | Empirical-heuristic-aware: "numeric scale allows for high-precision design fidelity" |

**4/4 understood the empirical heuristic** (`spacing/N` for specific pixel values; word tokens for semantic shorthand) and applied it correctly. Opus's mixed-vocabulary approach is the most heuristic-faithful; the other three reached for numeric exclusively (which is also canonical when all values are pinned). The S0-3 cheatsheet pin held cleanly under Stage 3.

Note: 0/4 cells produced word-token-exclusive output. The empirical pattern from Stage 0 ("numeric wins for specific pixel values") replicates at Stage 3.

### P3 — Notes app with theme-aware borders, scaffold chrome, and manual theme animation (4/4 canonical)

| Cell | Auto-fall-back (brand + subtle_border NOT in dark) | Active-variant resolution (`color: subtle*`) | Scaffold + AppBar in both variants | Instant-snap rule respected (no `transition:` on `theme:`) | Optional explicit-fade pattern |
|---|---|---|---|---|---|
| Opus | ✓ (with explicit comment) | ✓ `color: subtle` | ✓ light only (auto-fall-back) | ✓ accepted instant-snap | Skipped (per "most cells will skip" guidance) |
| GPT | ✓ (with explicit comment) | ✓ `color: subtle` | ✓ both variants | ✓ accepted instant-snap | Skipped |
| Gemini Pro | ✓ (with explicit comment) | ✓ `color: subtle_border` (token used on toggle button outline) | ✓ both variants | ✓ accepted instant-snap | Skipped |
| Flash-lite | ✓ (with comment) | ✓ `color: subtle` | ✓ light only | ✓ kept `transition:` off the theme block | **Implemented the optional fade** with `if shared.theme_mode is "dark": content else: content` keyed under `transition: fade` |

All four cells handled the four pressure-tested properties correctly:
1. **Auto-fall-back** — 4/4 omitted brand and (where it appeared) subtle_border from `theme dark:` with explicit comments noting the rule
2. **Active-variant resolution** — 4/4 used `color: subtle*` for theme-aware border colour
3. **Scaffold + AppBar propagation** — 4/4 declared in light, with sub-block-level auto-fall-back tested by Opus + Flash-lite (both omitted from dark; codegen handles correctly)
4. **Instant-snap rule** — 4/4 kept `transition:` off the top-level `theme:` block

**Flash-lite implemented the optional opt-in fade** — the pattern from cheatsheet §Dark mode showing `if shared.theme_mode is "dark":` branches under `transition: fade`. The shape is canonical per v0.19 branch-keying. **Minor observation:** flash-lite's outputs reference `content` (without parens) as a layout body but defines `content()` as a function (lowercase + parens). Igni's component naming rule is PascalCase (`Content`) for components vs lowercase (`content()`) for functions; flash-lite mixed them. The intent (factor out repeated content) is correct; the surface notation is broken. Logged as a minor Stage 3 trap-journal observation; not a P3 fail (the dark-mode pressure-test properties are all canonical).

## Methodology data points

1. **Second consecutive 12/12 Stage 3 strong-pass on a substantial spec change** (after v0.19's 12/12 on 2026-04-28). This is the project's *first* repeating instance of the "no-flips-no-patches outcome shape" §4d pattern catalogued in `docs/private/117` — 1/1 → 2/2. Promotion path opens: at three instances, no-flips-no-patches earns a more substantial chapter §4d expansion (similar to how synthesis-to-cheatsheet drift expanded at 4 instances).

2. **The principled-minority absorption pattern (Stage 2 instance 4) successfully reshaped the design without leaking ambiguity** through either Stage 0 OR Stage 3. The 6 patches absorbed mid-cycle (explicit-enum > tri-state, auto-fall-back > strict-pair, sub-blocks for chrome, generic-selector forward-compat, theme-transition rule, Q5 wording scoping) all read canonically across Stage 0's 9/9 and Stage 3's 12/12. Empirical evidence that *absorbing panel concerns via reshape* is a viable alternative to *reversal* — strengthens the §4a pattern reshape catalogued in `docs/private/114` instance 4.

3. **Empirical-heuristic adoption replicated**. The cheatsheet's S0-3 pin (numeric `spacing/N` for specific pixel values; word tokens for semantic shorthand) was reached for correctly by 4/4 P2 cells under Stage 3. The Stage 0 → Implementation handoff discipline (don't ship known teaching ambiguities) paid off — heuristic teaching held under post-implementation cold reading.

4. **Flash-lite as differential signal carrier**. Flash-lite's two minor observations (border-width-as-string, `content` lowercase-vs-PascalCase) are both *not* dark-mode adoption issues. They're orthogonal cheatsheet-teaching issues that the noise tier surfaces while the load-bearing dimensions stay clean. This validates flash-lite's role as a noise tier — its outputs surface "what does the cheatsheet teach less robustly" without contaminating the load-bearing-shape signal. Methodology-relevant for the dissertation chapter §6 sub-note on multi-tier panel composition.

## What stays unchanged

- **The `(a) ∪ (b)` reshape from Stage 2** held cleanly across all 12 cells. The structural-vs-semantic split (sub-blocks for chrome, `color:` for palette + tokens) is canonical.
- **String-enum `shared.theme_mode`** — 4/4 P1 used `"system"` with quotes; 4/4 P3 used `if X is "Y":` for comparison.
- **Auto-fall-back rule** — 4/4 omitted unchanged tokens from `theme dark:`. Zero over-declarations.
- **Active-variant token resolution** — 4/4 P3 used `color: subtle*` cleanly.
- **Theme-transition instant-snap rule** — 4/4 kept `transition:` off the top-level `theme:`.

## Trap-journal observations (logged for next-cycle teaching)

1. **`width = "thin"` string idiom** (flash-lite P1) — Igni's `_igniBorderWidth` resolver tolerates string values, but the cheatsheet teaches token-as-bare-identifier. Some panel cells reach for the string idiom. Logged for cheatsheet review at v0.20.1 (low priority; not blocking).
2. **`content` lowercase vs `Content` PascalCase** (flash-lite P3) — flash-lite confused function naming (`content()`) with component naming (`Content`). The cheatsheet's PascalCase rule may need a louder pin. Logged for v0.20.1 cheatsheet pin candidate.

## Ship decision

**STRONG PASS — proceed to ship commit.**

The cycle has produced clean signal across all three measurement stages:
- Stage 2 (design review): contested but absorbed via 6 patches — principled-minority pattern instance 4 (absorption shape)
- Stage 0 (post-patch cold read): 9/9 cells canonical
- Stage 3 (post-implementation cold read): 12/12 cells canonical

The shipped artefact reads canonically; the design's load-bearing invariants survived contestation; the cheatsheet teaches the post-patch surface cleanly.

## Next steps (ship sequence per version-bump skill)

1. CHANGELOG v0.20.0 entry refined with final tagline + Workstream A/B/C complete narrative
2. ROADMAP "Recently shipped" entry for v0.20.0
3. Stream 3 dark-mode + spacing entries flipped to "shipped"
4. v1.0 criterion 1 clock resets to 2026-04-29 (ship date) — earliest v1.0 tag becomes 2026-07-29
5. Doc 118 Cycle status: "Shipped 2026-04-29. Final."
6. Memory updates: `project_v1_criteria.md` clock reset; `project_v020_scope.md` flipped to "shipped"
7. Ship commit: `ship(v0.20.0): dark-mode propagation + wider spacing tokens + lint-spec-trio`
