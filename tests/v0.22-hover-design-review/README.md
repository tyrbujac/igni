# v0.22 hover primitive — Stage 2 design review

**Status (2026-04-30):** Scaffold only — pre-registered; not yet run. Stage 2 panel scheduled for **post-v0.21-ship strategic-planning gate window** per `docs/private/125_v022_hover.md` cycle ordering note (Tyr 2026-04-30). Gate-window run lets v0.22 cycle open with hover Stage 2 synthesis already complete; persistence is v0.21 PRIMARY and gets cycle bandwidth.

**Cycle stage:** Stage 2 (design review panel critique). 3 frontier models × 1 prompt × 6 questions, prose critique. Skip Stage 2 was considered and rejected because Q1 (children-vs-property-overrides) is a load-bearing shape decision — a single panel run is cheap insurance against locking syntax under operator-side framing. Q3 added 2026-04-30 late session covering Q7 (scale-in-hover-whitelist α/β/γ) after Pomodonut Source 2 surfaced n=2 cross-source evidence.

## What this panel measures

Critique of `docs/private/125_v022_hover.md` Stage 1 lock (Shape B1 — `is_hovered()` reactive boolean + `hover:` property-only sub-block). Panel pressure-tests B1 against three alternatives:

- **Shape A** — `hover:` accepts primitive children (CSS `:hover` familiarity; conflates conditional content with property override).
- **Shape B2** — Named binding (`layout vertical, name: card_lift, ...:` then `if is_hovered("card_lift"):`).
- **Shape C** — Per-binding hover state (`bind: hovered` on layouts).

Q1 is **anti-anchored** — framed as *the strongest case AGAINST Shape B1* — to guard against panel agreement that's more anchoring than load-bearing critique. Mirrors the v0.20 dark-mode Stage 2 anti-anchoring precedent (`tests/v0.20-design-review/README.md`).

## Pre-registered ship bars

Per `spec-cycle` skill convention. Lock these BEFORE the panel runs.

- **3/3 HOLD** on B1 (no panel cell flips; minor refinements may apply) → Stage 1 lock confirmed; proceed to Stage 0 cheatsheet cold-test in v0.22 cycle.
- **2/3 REFINE** with substantive patches → apply patches to design note 125, no shape flip.
- **2/3 FLIP** to A / B2 / C on architectural grounds → fire Trigger A (reopen Stage 1; principled-minority pattern test per `docs/private/114`).
- **1/3 single-model raise** → log to `docs/private/125` Open-questions section; consider for v0.23 docs-iteration.

## Run command

```bash
npx tsx tests/runner/cold-test.ts \
  --no-spec \
  --no-grade \
  --prompts tests/v0.22-hover-design-review/prompts.md \
  --out tests/v0.22-hover-design-review \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview
```

`--no-spec` because the panel critiques the design note (embedded in the prompt), not Igni source. `--no-grade` because outputs are prose critique, not Igni code.

**Cost estimate:** ~$0.30 (matches v0.20-design-review's $0.2985). Cheatsheet draft NOT injected (would inflate cost without panel value — Stage 0 is the cheatsheet-injection stage).

## Files

- `prompts.md` — single-prompt 5-question framework with embedded design note 125 (Stage 1 lock + cheatsheet skeleton).
- `<model>_none_v0-22-hover-design-critique.{md,json}` — outputs (filled after run).
- This file — pre-registration + post-run synthesis (sections appended after run).

## Synthesis (post-run)

*To be filled after panel run. Structure follows v0.20-design-review/README.md convention: Verdict header, Convergence-by-question sub-sections, per-Q decision (HOLD/REFINE/FLIP), patch list, Trigger A status.*
