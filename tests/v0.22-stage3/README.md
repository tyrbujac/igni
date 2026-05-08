# v0.22 Stage 3 ship-validation — hover + size tokens

**Date:** _<filled at run time>_.
**Method:** 4 frontier models × 3 prompts × shipped cheatsheet (`spec/v0.21.2-cheatsheet.md`, ~8800 words — the working cheatsheet that already carries the v0.22 §Hover section + extended Spacing-tokens table; will be archived and forked to `spec/v0.22.0-cheatsheet.md` at the version-bump session post-Stage-3). `--no-grade` (auto-grade against panel output introduces churn for canonical-shape variation per cycle precedent).
**Models:** `claude-opus-4-7`, `gpt-5.5-2026-04-23`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview` (noise tier).
**Sequential mode** (canonical for ship-validation reproducibility).
**Cost target:** ~$0.70-1.00 (matches v0.21's $0.98; per-provider cache assumption broke for OpenAI in n=4 prior cycles — total may skew toward $1.00).
**Outputs:** 12 `<model>_cheatsheet_<prompt-slug>.{md,json}` (this directory).

**Cumulative v0.22 cycle cost projection:** $0 (Stage 2 chat-mode size-tokens, separate panel `tests/v0.22-size-tokens-panel/`) + $0 (Stage 2 chat-mode hover, separate panel `tests/v0.22-hover-design-review/`) + ~$0.30 (Stage 0 `tests/v0.22-stage0/`) + Stage 3 = **~$1.00 - $1.30 projected**.

**Reused prompts:** Stage 0's 3 prompts (`tests/v0.22-stage0/prompts.md` — card-grid hover-lift, card-list hover-revealed-preview, contact-card pill+disabled) carry forward verbatim. Stage 0 cleared at 8/9 PASS-mod-bench post-`not_allowed` rename; Stage 3 verifies the same teaching survives panel-ranked canonical reach with flash-lite noise tier in scope.

## What Stage 3 measures vs Stage 0

| Dimension | Stage 0 | Stage 3 |
|---|---|---|
| Cells per prompt | 3 | 4 |
| Noise tier | none | flash-lite |
| Grade | reach test (canonical-shape adoption) | reach test (canonical-shape adoption) |
| Cheatsheet | draft | shipped |
| Verdict consequence | patch teaching, re-run subset | ship / soft-patch / reopen |

## Pre-registered ship bar

Same shape as v0.19 / v0.20 / v0.21 Stage 3:

- **Strong:** 4/4 P1 + 4/4 P2 + ≥3/4 P3 reach for canonical syntax. Proceed to ship-confirmation; close v0.22 cycle.
- **Soft:** 3/4 on P1 or P2 — log as Tier-A patch for v0.22.0 ship narrative or v0.22.1 docs iteration (no spec-level reopen).
- **Fail:** ≤2/4 P1 — reopen cheatsheet teaching; possible v0.22.x design re-open (Q1-shape `hover:` sub-block or `is_hovered()` lexical-scope rule).

**Per-prompt canonical shape (predicted):**

| Prompt | Canonical-shape predictions |
|---|---|
| **P1** card-grid hover-lift | `hover:` sub-block carries `background: brand` + `cursor: pointer` (+ optional shadow if cells reach for it — note: `shadow:` is NOT in the v0.22 hover whitelist; see "Known cheatsheet inconsistency" below). `gap: none` for the icon row. No `is_hovered()` for the property overrides. 3-column grid via `each` over `[3 recipes].split(into: 3)` or similar, OR three `layout horizontal:` rows of `each item in row`. |
| **P2** card-list hover-revealed-preview | `hover:` sub-block carries `background: brand` only. `is_hovered()` inside an `if` block for the conditionally-rendered preview description (NOT inside `hover:`). Description label is the right primitive shape (`label`, with `style: caption`). |
| **P3** contact-card pill+disabled | `rounded: full` for both circular avatar AND pill button. `gap: none` between name section and button row. `cursor: not_allowed` inside `hover:` for disabled state. Conditional disabled-state logic uses `if is_followed:` (or equivalent state-driven shape) — NOT magic state inference; the disabled background swap is canonical `background: subtle` inside the same `hover:` block OR via a state-conditional outer rendering. |

**Known cheatsheet inconsistency at run time** (logged for ship narrative): the cheatsheet draft at line 172 still lists `shadow:` in the `hover:` whitelist, but transpiler v0.22 ships without `shadow:` codegen support. If panel cells reach for `shadow: medium` inside `hover:`, the transpiler will produce a parse error ("Unknown hover property"). The version-bump session will drop `shadow:` from the cheatsheet whitelist text before forking `spec/v0.22.0-cheatsheet.md`. Stage 3 outputs that include `shadow:` should be flagged as cheatsheet-driven not user-driven and rolled into the same fix.

**Other spec-text adjustments queued for version-bump** (not blocking ship if Stage 3 doesn't surface them):
- Cheatsheet line 178 ("Nested layouts shadow outer hover state") — soften to "innermost enclosing layout-with-`hover:`-block" since transpiler v0.22 reads from ancestor when current layout has no `hover:` (cleaner than always-zero-state shadow).
- Cheatsheet line 179 (ambiguity-lint paragraph) — not implemented in transpiler; either drop the paragraph or land as v0.22.1 patch if dogfood surfaces confusion.

## Synthesis _(post-run, fill after panel completes)_

### Verdict at the panel level

_<STRONG / SOFT / FAIL — one paragraph. Ship/patch/reopen call.>_

### Convergence by prompt

#### P1 — Card grid with hover-lift

| Cell | `hover:` sub-block | property overrides canonical | `gap: none` icon row | `cursor: pointer` | Verdict |
|---|---|---|---|---|---|
| Opus | | | | | |
| GPT | | | | | |
| Gemini Pro | | | | | |
| Flash-lite | | | | | |

_<observations>_

#### P2 — Card list with hover-revealed preview

| Cell | `hover:` sub-block | `is_hovered()` inside `if` | property overrides NOT inside `if` | Verdict |
|---|---|---|---|---|
| Opus | | | | |
| GPT | | | | |
| Gemini Pro | | | | |
| Flash-lite | | | | |

_<observations>_

#### P3 — Contact card with pill, circular avatar, disabled state

| Cell | `rounded: full` (avatar + pill) | `gap: none` between name + buttons | `cursor: not_allowed` inside `hover:` | conditional-disabled logic shape | Verdict |
|---|---|---|---|---|---|
| Opus | | | | | |
| GPT | | | | | |
| Gemini Pro | | | | | |
| Flash-lite | | | | | |

_<observations>_

### Cross-cutting observations

_<load-bearing patterns across prompts>_

### Trigger A status

_<patches surfaced; categorise as Tier-A docs / v0.22.x reopen / out-of-scope>_

### Methodology data points (chapter §4 catalogue queue)

_<methodology contributions catalogued for next dissertation cadence session>_

### Trap-journal entries

_<append to docs/private/trap-journal.md as Stage-3 walk surfaces traps>_

---

## Pre-flight checklist (operator-side)

- [ ] Confirm `transpiler/` tests green (`cd transpiler && npm test` → 165/165).
- [ ] Confirm smoke green (`cd transpiler && npm run smoke` → 104/107, 0 failures, 3 SMOKE_SKIPs unchanged).
- [ ] Confirm cheatsheet `spec/v0.21.2-cheatsheet.md` still on disk and contains the v0.22 §Hover section + extended Spacing-tokens table.
- [ ] Run the cold-test command in `prompts.md` from repo root.
- [ ] Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`.
- [ ] Synthesise per-prompt convergence into the Synthesis section above. **No automated synthesis** per `docs/private/104` automation principle.
