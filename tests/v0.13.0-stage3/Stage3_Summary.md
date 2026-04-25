# v0.13.0 Stage 3 Summary

**Run date:** 2026-04-25
**Spec tier:** `spec/v0.13.1-cheatsheet.md` (post-prose-patch from `tests/v0.13.0-spec-critique/`).
**Panel:** 4 frontier models — Claude Opus 4.7 (thinking=16k), GPT-5.5 (effort=high), Gemini 3.1 Pro Preview (thinking=16k), Gemini 3.1 Flash-Lite Preview (thinking=16k).
**Cells:** 8 (4 models × 2 prompts).
**Total cost:** $0.737. Cache savings on the 2789-word cheatsheet were significant (Opus reported a 7102-token cache hit on prompt 2).
**Pre-registration:** `docs/private/79_v013_max_width.md` §Stage 3 attribution (locked 2026-04-22, before the v0.13 implementation session began).

## Pass bar (locked)

| Adoption | Decision |
|---|---|
| **4/4** | Ship holds. Stage-0-skip prediction vindicated. |
| 3/4 | Soft pass. Note the miss; decide between v0.13.2 docs nudge vs let it ride. |
| ≤2/4 | Stage-0-skip was wrong. Reopen v0.13. Recalibrate the "six prior token primitives" warrant. |

**Adoption rule:** A model "adopts" if it reaches for any of `phone` / `tablet` / `desktop` *correctly* in at least one of the two prompts.

## Result: 4/4 — ship holds

| Model | Dashboard prompt | Article prompt | Adopted? | Notes |
|---|---|---|---|---|
| Claude Opus 4.7 | No `max_width:` (chose intrinsic-width sidebars + `fill: true` main column) | `max_width: tablet` on article body, `align: center` parent | **YES (1/2)** | Explicitly justified the dashboard choice in commentary — sidebars shrink-wrap their content, main column absorbs remaining space. Defensible design call, not a non-adoption. |
| GPT-5.5 high | `max_width: phone` on both sidebars | `max_width: tablet` on article column | **YES (2/2)** | Cited the box-model rule explicitly: "Igni's `max_width:` includes padding, so the actual text line length is a little narrower than 768px." |
| Gemini 3.1 Pro Preview | `max_width: phone` on both sidebars (capped 480px each, main column `fill: true`) | `max_width: tablet` on article body | **YES (2/2)** | Dashboard transpile failed for an *unrelated* reason — `tab_color = subtle` placed inside a layout block, which violates Igni's variable-placement rule. The `max_width:` usage itself was syntactically correct. |
| Gemini 3.1 Flash-Lite Preview | `max_width: tablet` on both sidebars | `max_width: desktop` on article column | **YES (2/2)** | Cheapest model in panel ($0.005 / cell) reached for `max_width:` unprompted on both prompts. |

## Adoption metrics

- **4/4 models adopted** the new property unprompted.
- **Token distribution across 12 max_width occurrences:** `phone` (5×), `tablet` (6×), `desktop` (1×). All three tokens used at least once across the panel.
- **0/8 cells invented** `full`, `none`, or `auto` — the v0.13.1 hallucination protection (CHANGELOG entry, commit `b787d2c`) held.
- **0/8 cells used numeric values** — the token-only commitment held.
- **7/8 transpiled cleanly.** The one failure (Gemini Pro dashboard) was an Igni variable-placement violation unrelated to max_width.

## Methodology interpretation

Pre-registered Stage-0-skip prediction was **vindicated**. The token-first design call landed cleanly on a seventh token primitive without measurement-grade Stage 0 friction. The "six prior token primitives ≥95% adoption" warrant survives one more validation; the rule "Stage 0 is for uncertainty, not ceremony" gains another supporting datapoint.

Worth flagging for the dissertation:
- **GPT-5.5 high** explicitly cited the box-model rule ("Igni's `max_width:` includes padding, so the actual text line length is a little narrower than 768px"). This is the v0.13.1 patch language working as intended — the prose was not just understood, it was *quoted back* with its operational implication.
- **Cache savings were material.** The Anthropic $0.21 cell-cost on the dashboard prompt with thinking=16k would have been ~$0.30 without cache; the article rerun on the same conversation cost $0.075 instead of ~$0.21. Confirms the value of cached spec injection in long Stage 3 runs.
- **Adoption rule's "at least one prompt" standard** worked correctly for Opus's split (1/2). A stricter "both prompts" rule would have over-penalised a defensible design call. Worth noting in the methodology chapter that pre-registration phrasing matters.

## Outstanding observations (not actioned)

- **Gemini Pro variable-placement violation** in the dashboard (`tab_color = subtle` inside a layout) is the same class of bug the v0.13.0 (well, v0.13's transpiler) doesn't catch. Independent of max_width — log as a candidate transpiler-rejection-fixture to feed `transpiler/examples-errors/` in a future session. Already on the v1.0-criterion-2 ROADMAP under "bare statements in UI blocks" → that bullet now has fresh signal.
- **Opus's dashboard non-use of max_width** is a design-style finding rather than a non-adoption: a senior engineer might absolutely choose intrinsic widths over a cap for a top-level dashboard. Worth keeping the "at least one prompt" adoption rule for similar future Stage 3s where models legitimately split.