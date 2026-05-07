# Claude Opus 4.7 — v0.22 size-token cold-blind proposal

**Run date:** 2026-05-07
**Session shape:** TBD — operator confirms (one-message / two-message)
**Cheatsheet version:** v0.21.2
**Design note:** docs/private/137_studio_drift_size_token_gaps.md as of 2026-05-07

---

<!-- Paste verbatim model response below this marker. Don't trim, paraphrase, or add operator commentary. -->

## Proposed scale

**Named steps (3):**
1. `small` — 8 px
2. `medium` — 16 px
3. `large` — 24 px

**Numeric scale alongside:** Yes — `scale/1..8` minus `scale/7`. Sparse (4/8/12/16/20/24/32). Token-only discipline preserved; no escape hatch to arbitrary px. I'd reject `spacing/N` as the prefix because it reads as a category error on `rounded:` and `size:` — see below.

## Special cases

- **Zero token: ADD** as `none`. Token-only discipline means `padding: 0` is a parse error; designers need an idiom for flat layouts. Reads natively on all four properties (and `size: none` is just a parse error — fine).
- **Max-rounded token: ADD** as `full`. Pills and circles are container-relative; no px value expresses them. Valid only on `rounded:`; parse error elsewhere.
- **Extension tokens (xs/xl): SKIP**. The numeric scale already surfaces 4 px (`scale/1`) and 32 px (`scale/8`). Adding word tokens for these creates two surfaces for the same value and violates "one way to do everything" without earning new expressiveness.

## Justification

**Three steps, not five.** The same scale serves four properties with different natural ranges — `gap:` skews small, `size:` skews larger, `rounded:` lives in 4–24 plus `full`. A five-step word scale forces some steps to be unnatural in some contexts: "huge gap" is rare; "tiny size" is meaningless for component dimensions. Three steps cover the common middle actually shared across all four uses; the numeric scale catches outliers. This is a forcing function, not a limitation — if a designer reaches for `xl` and it's not there, they fall through to `scale/8` and the source parses cleanly.

**Naming.** `small / medium / large` over `sm / md / lg` because the canonical user reads a Properties panel button, not a Tailwind className. Full words read native in segmented controls (Material, Polaris, macOS native all use full words). Mood-based naming (`tight / cozy / roomy`) was tempting but fails uniformity — `rounded: tight` and `size: tight` don't parse semantinguage is the only naming family that survives all four contexts.

**Numeric prefix.** `scale/N` over `spacing/N` for uniformity. `padding: spacing/4` reads fine, but `rounded: spacing/4` and `size: spacing/4` read as category errors — these aren't "spacing" properties. `scale/N` is neutral and stays clean across all four.

**Panel-mock gap I want to flag:** the mock shows 6 buttons per row but the word-token set has only 3 (and `none` + `full` doesn't get you to 6 either). Either the panel surfaces a curated word + numeric subset (e.g. `none / small / medium / large` + two contextual numerics), or the 6-button row is over-budget. Worth resolving in the Studio spec, not the cheatsheet.

## Honest-no reaction

**Partial hold.** Word tokens match canonical — I'd land at `small / medium / large` independently for the uniformity reasons above. I'd push back on `spacing/N` as the numeric prefix. "Spacing" is fine for `gap:` and `padding:` but reads as a category error on `rounded:` and `size:`. `scale/N` keeps the prefix neutral across all four. Worth defending: did `spacing/` win on familiarity (designers see "spacing scale" in design-system docs) at the cost of cross-property uniformity? If yes, that's a real trade-off, but the spec's "one scale, four uses" framing argues against it.

## Confidence

**MEDIUM-HIGH.** The 3-step + word-token choice converges cleanly from the uniformity constraint. The `scale/` vs `spacing/` question is a genuine choice — I'd want LLM-authoring data both ways before locking it.
