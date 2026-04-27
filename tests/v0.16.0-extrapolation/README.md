# v0.16.0 extrapolation panel

**Status: setup ready, runs pending.** Predictions pre-registered 2026-04-27 in `predictions.md`. Three apps × 4-model panel = 12 cells.

## What this is

A new cold-test variant. Existing Stage 0 / Stage 3 panels measure *convergence on a known design*. This measures **what models invent when the spec runs out** — feeds the inverse signal:

- where v0.16.0 is sufficient (small/medium cells should mostly transpile),
- where models invent the same syntax under pressure (promotion signal for new primitives),
- where existing primitives stretch awkwardly (refactor candidates),
- per-model bias toward "invent" vs "degrade-within-spec" (methodology side-effect).

Complements the BMI hand-translation cycle (commit `88e9eb7`): BMI = author writes, transpiler bugs leak. This = model writes cold, *spec gaps* leak. Same target, different leak path.

## App ladder (domain-spanning)

| # | App | Tier | Stresses | Predicted gap |
|---|---|---|---|---|
| 1 | Tip calculator | small / utility | `slider`, `input`, derived state | Currency formatting (no string-format builtin) |
| 2 | Habit tracker | medium / CRUD | lists, `each`, `replace()`, `navigate to` | **Persistence (headline gap)**, date handling |
| 3 | Kanban board | ambitious / interactive | three columns, multi-list state | **Drag-and-drop (no primitive)**, gestures |

## Running the panel

API runner at `tests/runner/`. Same path as every cold-test since v0.8.1. Run with `--no-grade` because beyond-spec invented syntax will not transpile.

```bash
cd tests/runner

# Anthropic
npx tsx run.ts \
  --model claude-opus-4-7 \
  --spec ../../spec/v0.16.0-cheatsheet.md \
  --prompts ../v0.16.0-extrapolation/prompts.md \
  --out ../v0.16.0-extrapolation \
  --no-grade

# OpenAI
npx tsx run.ts \
  --model gpt-5.5 \
  --effort high \
  --spec ../../spec/v0.16.0-cheatsheet.md \
  --prompts ../v0.16.0-extrapolation/prompts.md \
  --out ../v0.16.0-extrapolation \
  --no-grade

# Google Pro
npx tsx run.ts \
  --model gemini-3.1-pro-preview \
  --spec ../../spec/v0.16.0-cheatsheet.md \
  --prompts ../v0.16.0-extrapolation/prompts.md \
  --out ../v0.16.0-extrapolation \
  --no-grade

# Google Flash-Lite
npx tsx run.ts \
  --model gemini-3.1-flash-lite-preview \
  --spec ../../spec/v0.16.0-cheatsheet.md \
  --prompts ../v0.16.0-extrapolation/prompts.md \
  --out ../v0.16.0-extrapolation \
  --no-grade
```

Outputs land as `<model>_cheatsheet_<slug>.{md,json}`. 12 files total when complete.

## Synthesis

After all 12 cells complete, write a synthesis at `docs/private/<next>_v0160_extrapolation_panel.md` (next available integer prefix; **110** is open as of 2026-04-27 unless something landed first — verify with `ls docs/private/ | sort -V | tail -3`).

Synthesis structure (mirror `docs/private/101_v0150_coldtest_synthesis.md`):

1. **Per-app prediction-vs-observed table** — graded against `predictions.md`. `[PRED-X.Y]` referenced by ID.
2. **Invented-syntax catalogue** keyed by convergence count:
   - 4/4 → strongest promotion signal, design note immediately.
   - 3/4 → strong promotion signal, design note next cycle.
   - 2/4 → log in ROADMAP Stream 3 with this run cited.
   - 1/4 → idiosyncratic, log in trap-journal only.
3. **Stretched-primitive catalogue** — places existing primitives bend awkwardly under pressure (refactor candidates, not new primitives).
4. **Graceful-degradation ratio** per model — invent-vs-substitute count. Methodology side-effect.
5. **Methodology verdict — keep or drop.** If ≥1 promotion-tier (3+/4) shape emerges, this is worth establishing as a recurring stage in `docs/cycle.md`. If 0, calibration data only; do not add a stage.

## Out of scope

- Fixing model outputs to make them transpile. Raw outputs are the data.
- Implementing any invented primitive in this cycle. This run produces design candidates only.
- Updating `docs/cycle.md` to add a new stage **unless** the synthesis verdict is keep.
