# Pre-registered predictions — v0.16.0 extrapolation panel

**Written 2026-04-27, before any model output is generated or read.** This is the prediction-test methodology (see memory `project_prediction_test_methodology` and `tests/v0.15.2-runtime-semantics-test/`). After runs complete, grade observed-vs-predicted and surface where the spec under- or over-shot.

Prompts inject `spec/v0.16.0-cheatsheet.md` and **do not** instruct the panel to stick to spec. Models are explicitly told to invent syntax for gaps. The hypothesis under test is *what they invent*, not whether they comply.

Panel: 4 frontier models × 3 apps = 12 cells (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview, gemini-3.1-flash-lite-preview).

---

## App 1 — Tip calculator (small / utility)

Stresses: `input` (numeric), `slider`, derived state, computed labels, currency formatting.

**[PRED-1.1]** Transpile-clean rate against v0.16.0: **3-4/4**. The app fits inside documented primitives — no inherent gap.

**[PRED-1.2]** Currency formatting (2 decimal places) is the most likely invented-syntax site. Igni has `floor()` (v0.14.3) but no string-format builtin. Predictions:
- ≥2/4 invent a format builtin — most likely `format(value, 2)`, `formatCurrency(value)`, or string-interpolation-style (which is explicitly off per CLAUDE.md, so models that reach for it are demonstrating spec-misalignment).
- 1/4 (probably claude-opus) does the manual `floor(amount * 100) / 100` arithmetic without inventing.
- 0/4 leave it as raw float display.

**[PRED-1.3]** Number-of-people stepper — Igni has no `stepper` primitive. Predictions:
- 4/4 substitute with two `button` "+" / "-" pairs (graceful degradation, well-trodden pattern).
- 0/4 invent a `stepper` block. Reason: pattern is too obvious in current primitives.

**[PRED-1.4]** Slider-percent display — claude-opus tends to render the live value next to the label (e.g. `"Tip 15%"`); gpt-5.5 and gemini lean toward a static label. Cosmetic; not diagnostic.

**Diagnostic verdict from this cell:** if **3+ models converge on the same format-builtin shape**, that's a small but real promotion signal for a v0.17 string-format primitive (paired-stress with the 6/7 `format_time()` invention from the v0.14 Stage 3 trap-journal entry — second compounding cell).

---

## App 2 — Habit tracker (medium / CRUD + state)

Stresses: lists, `each`, `replace()`/`without()`, `navigate to`, shared state, computed-per-item helpers, **persistence (gap)**.

**[PRED-2.1]** Transpile-clean rate against v0.16.0 (ignoring persistence gap, ignoring invented syntax): **2-3/4**. Most pain comes from streak computation and the across-screen habits-list mutation.

**[PRED-2.2]** Persistence syntax is the headline measurement. Models are told the list "should persist across app restarts." Predictions:
- 4/4 invent some persistence syntax (none ignore the requirement — the prompt is explicit).
- Convergence shape: I expect **2-3/4 cluster on a `persist:` block** at top of the screen, similar in spirit to `shared:`. Alternative shapes: `local:` block, per-variable suffix `count = 0 (persist)`, function calls `save("habits", habits)`.
- **If 3-4/4 converge on `persist:`**, that's the strongest possible promotion signal — write the v0.17 design note immediately.
- **If split 2-2 between `persist:` block vs per-variable annotation**, run a follow-up Stage 0 to disambiguate.

**[PRED-2.3]** Streak computation — likely the most divergent slot:
- claude-opus: derived helper function called from layout (`streak_for(habit)`).
- gpt-5.5: stores streak as an object field, mutates on toggle.
- gemini-pro: similar to claude-opus but may inline.
- gemini-flash-lite: most likely failure mode — recomputes inside layout body in a way that doesn't compile.

**[PRED-2.4]** Habit-toggle update — uses `replace(habits, target, new)` (v0.5 canonical) in 3/4. 1/4 falls back to `each`-rebuild (signal: `replace()` teaching could be louder).

**[PRED-2.5]** Date-of-today handling — Igni has `now()` (v0.14) returning integer seconds. No date primitive. Predictions:
- 2-4/4 invent a date helper: `today()`, `date_today()`, or `now() / 86400`.
- Convergence here is a secondary signal — date-handling primitives are a known v1.0+ open question; this would just confirm priority.

**Diagnostic verdict from this cell:** convergent persistence syntax (≥3/4) is the strongest single signal we could expect from this whole experiment. Worth running the panel just for this cell.

---

## App 3 — Kanban board (ambitious / interactive beyond spec)

Stresses: drag-and-drop (gap), three side-by-side columns (multi-list state), cross-list mutation, gesture detection, scroll-within-column (gap).

**[PRED-3.1]** Transpile-clean rate against v0.16.0: **0-1/4**. The app is intentionally beyond-spec.

**[PRED-3.2]** Drag-and-drop syntax — three failure modes per the plan:
- (a) **Invent gesture syntax** — `on drag:`, `on drop:`, `draggable:`, `card draggable: true`. Predicted: 2-3/4.
- (b) **Substitute "Move →" / "Move ←" buttons** — graceful degradation. Predicted: 1-2/4.
- (c) **Abandon and document** — produces partial app + "drag-and-drop not supported in current spec." Predicted: 0-1/4.
- claude-opus most likely to pick (b) given its track record of staying-within-spec; flash-lite most likely to pick (a) without warning.

**[PRED-3.3]** Three-column layout — `layout horizontal` with three nested `layout vertical` columns. Predicted: 4/4 reach this. The layout-horizontal-of-verticals pattern is well-trodden (Connect Four).

**[PRED-3.4]** Cross-column move — moving a card from Todo to Doing requires removing from one list and adding to another. Predictions:
- 2-3/4 use `without(todo, card)` + `doing = [...doing, card]` (or equivalent) — 2-step canonical.
- 1-2/4 invent a `move()` builtin or per-card column-id field + filter.
- If both columns are *fields of an object* (e.g. `board.todo`, `board.doing`), models likely fail because v0.16 forbids field-mutation outside `bind:` — diagnostic for object-field-mutation revisit.

**[PRED-3.5]** Card-add — text input + button per column. Standard pattern; predicted 4/4.

**[PRED-3.6]** Card-delete — long-press, swipe, or X button. Predictions:
- 4/4 use a delete X button (graceful — long-press/swipe gestures are also beyond-spec).
- If any model invents `on long_press:` or `on swipe:`, that's a sub-signal worth logging but not promotion-tier without compounding evidence.

**Diagnostic verdict from this cell:** convergent drag-and-drop syntax (≥3/4 same shape) → drag primitive design note. Dominance of substitute-with-button → spec teaches graceful degradation, no immediate primitive needed. Pure failure (3+/4 give up) → confirms hard ambition cap, useful methodology calibration data.

---

## Cross-cell predictions

**[PRED-X.1]** Graceful-degradation ratio: claude-opus will substitute-within-spec more than invent (ratio ~3:1); flash-lite will invent without warning more than substitute (ratio ~1:3); gpt-5.5 and gemini-pro middle-ground. This per-model bias is itself a methodology contribution — different models have different "invent vs degrade" priors that change which signal we should weight.

**[PRED-X.2]** No model produces all 3 apps cleanly transpiling. The kanban cell guarantees this.

**[PRED-X.3]** Total invented-syntax shapes catalogued across 12 cells: 8-15 distinct shapes. Most appear once; 1-3 shapes appear 3+/4 (the promotion-tier cluster).

**[PRED-X.4]** Methodology verdict: this run is keep-and-recur if it produces ≥1 promotion-tier (3+/4 convergent) invented-syntax shape. If 0, it's still useful one-off calibration data but not worth establishing as a recurring stage.
