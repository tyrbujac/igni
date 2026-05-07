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

## Synthesis (2026-05-07)

**Run:** 3 cells, sequential, total cost $0.36 (Opus $0.13 / GPT-5.5 $0.20 / Gemini-3.1-pro $0.03). All cells produced substantive prose critique; no degenerate outputs. Captures in `claude-opus-4-7_*`, `gpt-5.5_*`, `gemini-3.1-pro-preview_*`.

**Headline verdict:** **HOLD B1 with refinements; FLIP Q7 α → β (unanimous); FLIP Q6 instant-snap-default to smooth (2/3); ADD `not-allowed` to cursor whitelist (3/3 mention).** Trigger A NOT fired (only 1/3 — Gemini — flipped Q1 to Shape A).

### Convergence by question

| Question | Opus 4.7 | GPT-5.5 | Gemini-3.1-pro | Verdict |
|---|---|---|---|---|
| **Q1 — Shape (B1 vs A/B2/C)** | HOLD with refinement (mandatory-property-in-`hover:` parse rule) | REFINE B1 (hard-error on children inside `hover:`; sharpen cookbook) | **FLIP to A** (Figma-variant mental model, CSS familiarity) | **HOLD B1 with refinements**; Gemini's FLIP logged as 1/3 |
| **Q2 — touch-always-false** | correct | correct (refine to capability-based not platform-based) | (silent) | HOLD; refine wording to capability-based |
| **Q2 — cookbook-not-spec** | correct | correct | (silent) | HOLD |
| **Q2 — cursor `pointer` only** | add `not-allowed` (disabled affordance, shipped surface) | mention `not-allowed` in expansion list | name `not-allowed` explicitly as load-bearing | **3/3 mention `not-allowed` → PATCH** |
| **Q2 — no-nesting (parse error on `hover:` inside `hover:`)** | correct | correct, with explicit clarification: ban is `hover:` inside `hover:`, NOT hoverable-layouts inside hoverable-layouts | misread as "nested hoverable layouts banned" → "FATAL" | **HOLD**; sharpen wording so Gemini's misread is impossible |
| **Q2 — instant-snap default** | **WRONG** — gallery card-lift expects smoothness; flip default to `transition: hover`-shape ~120ms ease | HOLD default; transition-token vocabulary may need `smooth` widening | **WRONG** — hover is micro-interaction, baked 150ms ease-out | **2/3 FLIP — strongest pressure point on locks. PATCH (Tyr decides shape)** |
| **Q3 — Q7 scale (α/β/γ)** | FLIP α → β | FLIP α → β | FLIP α → β | **3/3 unanimous → PATCH** (drop `scale:` from v0.22 hover whitelist; defer to v0.23+ transform cycle) |
| **Q4 — lexical-scope ambiguity** | propose parse-time lint when ancestor ALSO has `hover:` | propose cookbook-recipe mitigation; B2's naming surface introduces own ambiguity | refactor-silently-breaks-hit-box scenario; reason to flip to A | 3/3 acknowledge real risk; **1/3 (Opus) proposes concrete lint — architecturally clean PATCH candidate** |
| **Q5 — peer survey** | universal: scale-as-transform-property-with-hover-trigger; surfaces 5th shape `hover as h:` (SwiftUI closure-with-binding) | survey supports B1's split for content; rejects α | universal: property symmetry; α violates | **3/3 reinforces Q3 verdict (peers reject hover-only scale)**; 1/3 surfaces fifth shape — log to v0.23+ candidate |
| **Q6 — minority case** | minority for α-with-migration-note (Pomodonut need real, β slips into v0.23 risk) | minority for explicit-state shape (`hover_state: card_hovered`) | minority for B1+α as "blast-radius containment + spec budget absolutism" | 3 distinct minorities — methodology log; Tyr weighs |

### Patch decisions

| # | Patch | Trigger | Action |
|---|---|---|---|
| **P1** | Drop `scale:` from v0.22 hover whitelist; lock Q7 = β; note scale lands in v0.23+ transform cycle | 3/3 unanimous (Q3) | **APPLY** to doc 125 + cheatsheet skeleton line 159 |
| **P2** | Add `not-allowed` to v0.22 cursor whitelist alongside `pointer` (disabled-affordance) | 3/3 mention (Q2 cursor) | **APPLY** to doc 125 Q4 + cheatsheet |
| **P3** | Flip Q6 default: `hover:` property-flips ease ~150ms by default (instead of instant-snap); explicit `transition: none` (or no-op token) opts out of smoothing | 2/3 strong (Q2 instant-snap) | **APPLY shape-pending Tyr's call** between (a) bake-in 150ms ease-out vs (b) `transition: hover` default token vs (c) hold instant-snap |
| **P4** | Add parse-time rule to B1 spec: property-shaped overrides MUST appear inside `hover:`, NOT inside `if is_hovered():` (even though the latter would render correctly via reactive re-eval). Without this, B1 leaks into a two-way shape per Opus's Q1 refinement | 1/3 strong (Opus, Q1) | **CONSIDER** — Tyr's call; tightens "one-way" claim |
| **P5** | Add parse-time ambiguity lint: warn when `is_hovered()` is used inside a layout whose ancestor *also* has a `hover:` block ("ambiguous: enclosing layout and ancestor at line N both define hover") | 1/3 architecturally clean (Opus, Q4) | **CONSIDER** — Tyr's call; addresses the silently-breaks-on-refactor failure mode all 3 acknowledged |
| **P6** | Sharpen cheatsheet wording: "`hover:` cannot appear inside another `hover:` block." NOT "hoverable layouts cannot nest." Hoverable layouts CAN nest; only literal nested `hover:` blocks are rejected | 1/3 misread (Gemini, Q2) | **APPLY** wording-only |
| **P7** | Refine touch-platform language: capability-based ("no hover-capable pointer") not platform-based ("touch-only platforms") | 1/3 refine (GPT, Q2) | **APPLY** wording-only |

### Logs (no patch — surfaced for record)

- **Gemini's FLIP to A (Q1):** 1/3 raise; below 2/3-FLIP Trigger A bar. Log to `docs/private/125` Open-questions; revisit if a future panel/real-app reproduces.
- **Opus's fifth shape `hover as h:` (Q5):** SwiftUI-style closure-with-binding; introduces hover state as a local reactive name. 1/3 raise; log to ROADMAP Stream 3 as v0.23+ candidate (post-transform cycle).
- **Three distinct principled-minority cases (Q6):** methodology contribution — first Stage 2 panel where 3 different minority cases surface for the same locks. Log to doc 125 §Methodology; Tyr judges whether any reverses.

### What stays unchanged (locked, no panel pushback)

- Shape B1 itself — `hover:` property-only sub-block + `is_hovered()` lexical-scope boolean. 2/3 hold; the 1/3 flip is below threshold.
- Q3 cookbook-not-spec lock for mobile-first-vs-desktop-first.
- Q5 nested-`hover:`-blocks rejected at parse (separately, hoverable layouts CAN nest — wording sharpened per P6).

### Trigger A status

**NOT FIRED.** Pre-registered: 2/3 FLIP on B1 → reopen Stage 1 (principled-minority pattern). Actual: 1/3 FLIP (Gemini → A), 2/3 HOLD/REFINE. Below threshold.

### Next steps

1. Tyr decides P3 shape (instant-snap → smooth: bake-in vs `transition: hover` token vs hold).
2. Tyr decides P4 (mandatory-property-in-`hover:` parse rule) and P5 (ambiguity lint).
3. Apply P1, P2, P6, P7 unconditionally (consensus-grade or wording-only).
4. Update `docs/private/125` status: "Stage 2 complete; B1 + 7 patches applied; Q7 locked β."
5. Restore stripped `tests/v0.22-size-tokens-panel/injection-materials.md` (already done this session).
6. v0.22 cycle opens — Stage 1 (cheatsheet skeleton) + Stage 0 cold-test of combined hover + size-tokens.
