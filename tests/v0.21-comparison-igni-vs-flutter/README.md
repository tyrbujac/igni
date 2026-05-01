# v0.21 Phase 4 — Igni vs raw Flutter comparison

**Pre-registration:** `docs/private/131_phase4_comparison_design.md` (frozen 2026-05-01).
**Anchor:** doc 83 Phase 4 + `tests/benchmarks/loc-ratio.md` baseline + doc 117 methodology chapter §4.

## Cell matrix (18 cells)

3 apps × 3 models × 2 frameworks. Single attempt per cell.

| Model | Framework | pomodonut | bmi | mi-card |
|---|---|---|---|---|
| claude-opus-4-7 | Igni | cell | cell | cell |
| claude-opus-4-7 | Flutter | cell | cell | cell |
| gpt-5.5 | Igni | cell | cell | cell |
| gpt-5.5 | Flutter | cell | cell | cell |
| gemini-3.1-pro-preview | Igni | cell | cell | cell |
| gemini-3.1-pro-preview | Flutter | cell | cell | cell |

## Pre-registered success bars

| Bar | Threshold |
|---|---|
| **B1** Output token compression | Median Igni `output_tokens` ≤ Median Flutter × **0.5** |
| **B2** Output LOC compression | Median Igni `output_loc` ≤ Median Flutter × **0.4** |
| **B3** Output word compression | Median Igni `output_words` ≤ Median Flutter × **0.5** |
| **B4** Compile-success non-degradation | Igni `compile_success` rate ≥ Flutter rate − **10pp** |
| **B5** Cheatsheet amortisation breakeven | Reported, not gated |

**Strong pass:** B1+B2+B3+B4 met. **Soft:** B1+B2 met, B3 or B4 missed. **Inconclusive:** B1 or B2 missed.

## Setup

The Flutter compile-check needs a scratch project (gitignored — recreate locally):

```bash
cd tests/v0.21-comparison-igni-vs-flutter
flutter create --template=app --platforms=web --no-pub _flutter_check
cd _flutter_check && flutter pub get
```

Verify with `dart analyze lib/main.dart` — should report "No issues found!" against the default boilerplate.

## Run command (sequential — canonical for ship validation)

```bash
# Igni cells (with v0.21 cheatsheet injection)
npx tsx tests/runner/cold-test.ts \
  --prompts tests/v0.21-comparison-igni-vs-flutter/prompts-igni.md \
  --out tests/v0.21-comparison-igni-vs-flutter/igni \
  --spec spec/v0.21.0-cheatsheet.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview

# Flutter cells (no spec injection — relies on training-corpus knowledge)
npx tsx tests/runner/cold-test.ts \
  --prompts tests/v0.21-comparison-igni-vs-flutter/prompts-flutter.md \
  --out tests/v0.21-comparison-igni-vs-flutter/flutter \
  --no-spec \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview

# Compile-check + metrics post-processing
npx tsx tests/v0.21-comparison-igni-vs-flutter/compile-check.ts
npx tsx tests/v0.21-comparison-igni-vs-flutter/compute-metrics.ts
```

`--no-grade` because the existing transpile-grader is Igni-only; compile-success is computed separately by `compile-check.ts` for both frameworks.

Cost target: ~$2-4 (proportional to Stage 0's $0.95 for 9 cells, doubled for cell count, with Igni cells carrying cheatsheet-injection cost).

## Files

- `prompts-igni.md` — 3 framework-agnostic app descriptions with Igni framework header
- `prompts-flutter.md` — same 3 prompts with Flutter framework header
- `compile-check.ts` — extracts code from .md outputs, runs canonical compile path per framework, emits per-cell compile_success boolean
- `compute-metrics.ts` — post-processor: walks per-cell .json outputs + .md sources, computes LOC + word count + cheatsheet-token breakout, emits per-cell enriched .json + aggregate metrics.csv
- `_flutter_check/` — single shared Flutter scratch project (pubspec.yaml + lib/main.dart placeholder); reused for all 9 Flutter cells
- `igni/` — Igni cell outputs (`<model>_cheatsheet_<prompt-slug>.{md,json}`)
- `flutter/` — Flutter cell outputs (`<model>_none_<prompt-slug>.{md,json}`)
- `metrics.csv` — final aggregate (filled post-run)
- `synthesis.md` — hand-written analysis (filled post-run, structure frozen in design note §"Frozen synthesis structure")
