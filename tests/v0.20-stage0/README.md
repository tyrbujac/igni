# v0.20 Stage 0 cold-test — dark-mode + spacing tokens

**Date:** 2026-04-29.
**Method:** 3 frontier models × 3 prompts × cheatsheet-draft injected as `--spec` (7140 words). `--no-grade` (v0.20 transpiler hasn't shipped; auto-grade would falsely fail every output).
**Models:** `claude-opus-4-7`, `gpt-5.5-2026-04-23`, `gemini-3.1-pro-preview`.
**Sequential mode** (canonical for ship-validation reproducibility).
**Cost:** $0.834 across 9 cells (over the $0.40 estimate; comparable to v0.19's $0.63 for spec-injected with smaller spec).
**Outputs:** 9 `<model>_cheatsheet_<prompt-slug>.md` + 9 `.json` files (this directory).

**Cumulative v0.20 cycle cost so far:** $0.30 (Stage 2) + $0.83 (Stage 0) = **$1.13**.

## Verdict — STRONG PASS, 9/9 canonical

Pre-registered ship bar (per `prompts.md` header):
- **Strong:** 3/3 P1 + 3/3 P2 + ≥2/3 P3
- **Soft:** 2/3 P1+P2 → patch teaching, re-run
- **Fail:** ≤1/3 P1 → reopen Q1/Q4 design

Result: **3/3 P1 + 3/3 P2 + 3/3 P3 = 9/9 cells canonical**. Strong pass; **exceeds** the pre-reg threshold (P3 was a soft-target ≥2/3, hit 3/3).

This is the v0.20 cycle's first 9/9 outcome — first time across the project's history that a Stage 0 against a substantial spec change has hit 3/3 on every prompt. Worth noting against v0.19's 9/9 (animation+snapshot, 2026-04-28) — two consecutive cycles with clean Stage 0 passes; logged as a methodology data point but not yet a pattern at n=2.

## Convergence by prompt

### P1 — Settings screen with light/dark theme toggle (3/3 canonical)

Tests canonical adoption of the post-Stage-2 reshape: `theme: scaffold:` + `theme: appbar:` structural sub-blocks, `theme dark:` variant pair, `shared.theme_mode` string enum.

| Cell | `theme dark:` pair | `shared.theme_mode = "system"` | Auto-fall-back of `brand` | Scaffold + AppBar sub-blocks | 3-option radio shape |
|---|---|---|---|---|---|
| Opus | ✓ | ✓ | ✓ (with explicit comment) | ✓ both variants | ✓ (extracted `ThemeOption` component) |
| GPT | ✓ | ✓ | ✓ (with explicit comment) | ✓ both variants | ✓ (3 inline tappable rows) |
| Gemini | ✓ | ✓ | ✓ (with explicit comment) | ✓ both variants | ✓ (`each opt in options:` over a 3-element list) |

Three different idiomatic approaches to the radio pattern — extracted component (Opus), inline-repeated rows (GPT), `each` over options list (Gemini) — all canonical per the cheatsheet's selected-state pattern. None over-declared in `theme dark:`.

**Notable:** Gemini's `each` over an options list is the most data-driven shape; Opus's component is the most reuse-friendly; GPT's inline-repeated is the most explicit. All three reached `if shared.theme_mode is mode:` for the selection check — string equality canonical.

### P2 — Greeting card with fine-grained typography spacing (3/3 canonical)

Tests canonical adoption of `spacing/N` numeric scale OR word-token aliases for fine-grained typography spacing. The prompt asked panels to pick which token style they reach for and explain.

| Cell | Token style chosen | All 4 spacings correct (32 / 16 / 12 / 20 px) | Nested-layout pattern for non-uniform gaps |
|---|---|---|---|
| Opus | **Numeric `spacing/N` exclusively** | ✓ (8 / 4 / 3 / 5) | ✓ (after 2 self-corrections — see methodology note below) |
| GPT | **Numeric `spacing/N` exclusively** | ✓ (8 / 4 / 3 / 5) | ✓ |
| Gemini | **Numeric `spacing/N` exclusively** | ✓ (8 / 4 / 3 / 5) | ✓ |

**3/3 chose numeric over word tokens.** Strong methodology signal — when the prompt has *specific pixel values* (12, 20 px), the numeric scale wins on LLM-canonical adoption because word tokens (`small/medium/large`) only cover the 8/16/24 rungs. Opus and Gemini both explicitly justified the numeric choice ("12 px and 20 px don't have word-token aliases"; "the design spec calls for highly specific intervals").

This validates the v0.20 plan's Q1 lean (option C: keep both word-tokens + numeric scale). Frontier panels reach for whichever vocabulary fits the context. The Q1 design question — should the cheatsheet teach numeric as canonical or word tokens as canonical — appears to be context-dependent: numeric for fine-grained Figma translation; word tokens for semantic shorthand. The cheatsheet draft's "pick whichever reads cleanly" framing held cleanly.

**Methodology note — Opus self-correction.** Opus's P2 output is unusually transparent about its own reasoning process: it produced a first attempt with `gap:` on a single child (recognised that's wrong), a second attempt with `padding:` on each layout (recognised that adds 4-side padding incorrectly), and a third correct attempt with the nested-layout pattern. The output explicitly walks through the dead-ends and the resolution. This isn't a bug — Opus is expressing its working as it triangulates the right shape. Worth noting as a frontier-cell-behaviour data point: when the layout structure is non-trivial, frontier cells do iterate within a single response. Distinct from v0.19's panel where every cell produced clean first-shot outputs.

### P3 — Notes app with theme-aware borders, scaffold chrome, and manual theme animation (3/3 canonical)

The composition pressure-test. Four properties under test: auto-fall-back rule (don't redeclare `brand`/`subtle_border` in dark), active-variant token resolution (border colour flips with theme), `theme: scaffold:` propagation, instant-snap theme-switch rule (do NOT apply `transition: fade` to top-level theme).

| Cell | Auto-fall-back: brand+subtle_border NOT redeclared | Active-variant resolution: `border: thin, color: subtle*` | Scaffold+AppBar in both variants | Instant-snap rule respected | Optional explicit-fade pattern |
|---|---|---|---|---|---|
| Opus | ✓ (with explicit comments noting the auto-fall-back; `subtle` legitimately differs in dark) | ✓ (`color: subtle_border`) | ✓ both variants | ✓ accepted instant-snap explicitly: *"deliberately did not wrap the screen body in if shared.theme_mode is 'dark':"* | Skipped (per "most cells will skip" guidance) |
| GPT | ✓ (with explicit comment "intentionally omitted: auto-fall-back to light theme values") | ✓ (`color: subtle`) | ✓ both variants | ✓ skipped fade | Skipped |
| Gemini | ✓ (with explicit comment) | ✓ (`color: subtle`) | ✓ both variants | ✓ understood the rule explicitly: *"`transition:` is a layout-level property, NOT a theme-block property. We build the fade explicitly by swapping branches"* | **Implemented the optional fade** — wraps `NoteList notes` branches in `layout vertical, transition: fade:` keyed on `if shared.theme_mode is "dark":` |

All three pressure-tested properties held. The instant-snap rule was correctly understood by all three cells — none tried to put `transition: fade` on the `theme:` block. Gemini went the extra mile and built the optional explicit-fade pattern correctly using the v0.19 conditional-render `transition:` shape, with both branches calling the same `NoteList notes` component (the AnimatedSwitcher fires the fade on the *conditional* identity change, not on the inner content; canonical per v0.19 branch-keying).

**The composition pressure-test passed cleanly across all four properties.** This is the highest-confidence Stage 0 result — the four-pronged test was specifically designed to probe whether models would over-declare in `theme dark:`, conflate `transition:` with theme switches, or miss the active-variant-resolution composition. Zero incidents.

## Teaching gaps surfaced (cheatsheet patches before implementation)

Per the spec-cycle skill's Stage 0 → Implementation handoff: **fix teaching gaps before implementation. Don't ship known teaching ambiguities and patch later.**

A 9/9 strong pass can still surface teaching gaps. Three minor ones:

### Patch S0-1 — Dual-namespace `text:` (cheatsheet patch before Session 6)

The cheatsheet exposes two distinct `text:` surfaces:
- `theme: text: heading: font: pacifico` — font sub-block (v0.18, unchanged)
- `theme: color: text: "#0D0D14"` — text-colour token (v0.20 addition, used by AppBar foreground via `theme: appbar: foreground: text`)

GPT P3 noticed this potential collision and used `text_main` as a defensive workaround (not technically a bug — `text_main` is a valid user-defined token name — but indicates the dual-namespace was confusable). Opus and Gemini both used `text` correctly without confusion, but the disambiguation was implicit.

**Patch:** add a one-paragraph clarifier in `§Theme block (v0.20 expanded)` of `cheatsheet-draft.md` explicitly noting the two namespaces:

> **Two `text:` surfaces.** `theme: text:` is the font sub-block (`theme: text: heading: font: pacifico`). `theme: color: text:` is the text-colour token (`theme: color: text: "#0D0D14"`). They share the keyword `text` but live in different sub-blocks; the parser disambiguates by position. Use the colour token for label foregrounds and AppBar `foreground:` references; use the font sub-block for typography-style overrides.

Apply before Session 6 implementation.

### Patch S0-2 — Optional explicit-fade pattern (cheatsheet patch, low-priority)

Gemini correctly implemented the optional explicit-fade pattern using `if shared.theme_mode is "dark":` with both branches calling the same component. This is canonical per v0.19's branch-keying rule (AnimatedSwitcher fires on conditional identity change, not on inner content), but the cheatsheet doesn't explicitly note that the optional fade pattern works with same-content branches. Could add a one-line example to make the pattern more discoverable.

**Patch:** add a one-line note in `§Dark mode (v0.20)` after the instant-snap rule:

> If you want the explicit fade, branches inside the `if shared.theme_mode is "dark":` can use the same content — the fade fires on the conditional's branch-identity change (per v0.19's branch-keying rule), not on inner content differences.

Optional — only applies to users who want the explicit fade. Apply alongside Patch S0-1 for cohesion.

### Patch S0-3 — Numeric vs word-token guidance (cheatsheet pin, optional)

3/3 panel cells reached for numeric `spacing/N` over word tokens for the P2 fine-grained spacing prompt. The cheatsheet currently says "pick whichever reads cleanly in context" without naming the heuristic. Stage 0 surfaced the heuristic empirically: numeric for specific pixel values (especially 12 px / 20 px which lack word-token aliases); word tokens for semantic shorthand.

**Patch (optional):** strengthen the §Spacing tokens section's framing from "pick whichever reads cleanly" to a one-line heuristic: *"Numeric `spacing/N` for specific pixel values (especially 12 / 20 / 4 / 32 px which lack word-token aliases). Word tokens (`small / medium / large`) for semantic shorthand (e.g. 'medium gap between cards in a list')."*

Optional. Doesn't change the language; just sharpens the cheatsheet's teaching of an empirical reach pattern. Low-priority.

## What stays unchanged

- **Reshape (`(a) ∪ (b)`)** held cleanly across all 9 cells. The structural-vs-semantic split (sub-blocks for chrome, `color:` for palette) is canonical.
- **Auto-fall-back rule** — 3/3 P1 omitted brand from dark; 3/3 P3 omitted brand+subtle_border. Auto-fall-back is the canonical adoption shape.
- **Explicit enum `shared.theme_mode: "system" | "light" | "dark"`** — 3/3 string-quoted, 3/3 used `if X is "Y":` for comparison. The v0.20 Stage 2 patch (replace tri-state boolean with string enum) reads cleanly.
- **Active-variant token resolution** — 3/3 P3 used `border: thin, color: subtle*` (where the colour token resolves through the active variant). The Q5-scoping wording ("active-variant resolution applies to theme tokens") held.
- **Instant-snap rule** — 3/3 P3 understood it. Gemini built the optional explicit-fade correctly; Opus + GPT skipped it (canonical per "most cells will skip" framing).
- **Generic-selector forward-compat note** — 0/9 cells exercised this directly (no a11y context in prompts) but no cell *contradicted* it either.

## Cycle status update

After this synthesis, doc 118 Cycle status updates to:

```
**Cycle status (updated 2026-04-29):** Stage 0 cold-test STRONG PASS (9/9 canonical, $0.834). Three minor cheatsheet patches queued before Session 6: dual-namespace `text:` clarifier, optional explicit-fade note, numeric-vs-word heuristic pin. Next: cheatsheet patches + implementation (Session 6).
Sessions to ship: ~2 remaining.
```

## Methodology data points logged

1. **9/9 Stage 0 strong-pass on a substantial spec change** — second consecutive (after v0.19's 9/9). Not yet a pattern at n=2; logged for future trap-journal aggregate snapshot. The v0.20 cycle distinguishes itself in that the *Stage 2 panel produced substantive critique* (1H/1R/1F split, surfacing 6 patches) but the *Stage 0 reading* of the post-patch cheatsheet was unanimous-canonical. Suggests the patch-absorption pattern (instance 4 of `docs/private/114`) successfully reshaped the design without leaking ambiguity into the cheatsheet.

2. **Frontier-cell self-correction within a single response** (Opus P2). Worth catalogueing as a methodology observation: when the canonical shape requires non-trivial layout reasoning, frontier cells iterate visibly within their response. Distinct from cells that produce clean first-shot outputs. Not a bug, not a metric — just a behaviour pattern worth noting.

3. **Numeric-over-word token preference under specific-px prompts** (3/3 P2). Empirical reach pattern; potentially generalisable to "when the prompt names exact values, panels reach for numeric token systems if available." Logged for future spec-design-time guidance.

## Next steps

**Session 6** — implementation. Workstream A (parser + codegen for `theme dark:` + structural sub-blocks + `shared.theme_mode` runtime selector) + Workstream B (DESIGN_TOKENS map widening + `spacing/N` lexer rule). Apply Patches S0-1 and S0-2 (and optionally S0-3) to the cheatsheet draft before forking to `spec/v0.20.0-cheatsheet.md`.

Pre-Session-6 checklist:
- Apply Patches S0-1, S0-2 (and optionally S0-3) to `tests/v0.20-stage0/cheatsheet-draft.md`
- Fork via `npx tsx scripts/new-spec-version.ts 0.20.0`
- Implement parser + codegen + fixtures
- Run `npm test` (target: 131 → 131+N green)
- Run `npm run smoke` (target: 80/85 → 81+/86+ with new fixtures)
- `igni run` browser-test against light + dark fixtures

**Session 7** — Stage 3 ship-validation panel (4-frontier × 3-prompts = 12 cells). Pre-reg: 4/4 P1+P2; 3/4 P3. Cost target ~$0.40-0.60.
