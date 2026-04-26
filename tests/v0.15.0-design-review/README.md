# v0.15.0 Stage 2 design review — synthesis

**Date:** 2026-04-26
**Models:** claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview (3 frontier; flash-lite excluded per v0.14 precedent on prose-critique tasks).
**Method:** Single prompt with embedded `docs/private/98` design note + 5 critique questions. `--no-spec --no-grade` (prose output).
**Cost:** $0.3352 across 3 cells.
**Outputs:** `<model>_none_v0-15-0-theme-color-design-critique.md` per model.

## Convergence by question

### Q1 — User-defined lock

| Finding | Models | Convergence |
|---|---|---|
| Lock is correct given Path C | claude, gpt, gemini | **3/3** |
| Numeric cap (e.g., 24) is incoherent | claude, gpt, gemini | **3/3** |
| LLM-learnability concern bounded by parse-time fuzzy-match errors | claude, gpt, gemini | **3/3** |

**Decision: lock holds, no patch needed.** Optional refinement Claude suggested: add a paragraph explicitly rejecting the numeric-cap "compromise" so a future reviewer doesn't propose it. Low-priority; doc 98 already implies this. Skip.

### Q2 — Token-name lexical class / reserved-word collision

| Finding | Models | Convergence |
|---|---|---|
| Mitigation as drafted is insufficient — needs hard-list | claude, gpt, gemini | **3/3** |
| Reserve all Igni keywords + built-ins, not just colour names | claude, gpt, gemini | **3/3** |
| Forward-reserve anticipated tokens (`gradient`, `shadow`, `border`, etc.) | claude, gpt | **2/3** |
| Concrete example (`gradient` collision in v0.16) | claude, gpt, gemini | **3/3** |

**Decision: PATCH.** Add a hard-list reserved-name policy to spec. Cover (a) all Igni keywords + (b) all built-in colour tokens + (c) anticipated forward tokens (`gradient`, `shadow`, `border`, `radius`, `motion`, `elevation`, `transparent`).

### Q3 — Nested-group flattening

| Finding | Models | Convergence |
|---|---|---|
| `_` flatten is correct | claude, gpt, gemini | **3/3** |
| Slash-preservation rejected (lexer surgery, semantic ambiguity) | claude, gpt, gemini | **3/3** |
| Leaf-only rejected (collisions) | claude, gpt, gemini | **3/3** |
| First-and-leaf rejected (silent collisions) | claude, gpt, gemini | **3/3** |
| Need full Figma-name normalization rule (lowercase, non-alphanum→`_`, collapse, collision-error) | gpt, claude (lighter) | 2/3 |
| `_` rule should be "Rule" not "Recommendation" in spec | claude | 1/3 |

**Decision: PATCH.** Lift `_` flatten from "Recommendation" to "Rule" in v0.15.0 spec. Add a brief Figma-normalization note (lowercase, non-alphanum → `_`, collapse repeated `_`, reject collisions). Note this is a *translator-output* concern (Igni source uses already-flattened names); the spec just documents the canonical translation.

### Q4 — Inline-hex same-cycle rejection

| Finding | Models | Convergence |
|---|---|---|
| Same-cycle rejection is correct | claude, gpt, gemini | **3/3** |
| Igni "no deprecation cycle" policy holds | claude, gpt, gemini | **3/3** |
| Rejection must apply to ALL colour-valued properties, not just `color:` | gpt | 1/3 |
| Background error message should mention `card` (it's omitted from current draft) | gpt | 1/3 |

**Decision: PATCH (light).** Verify codegen rejection covers `color:` AND `background:` (already done in implementation — both call sites have the StringLit-`#` check). Also verify any other colour-valued property positions exist; if so, add rejection there too. Update background error message to mention `card`.

### Q5 — Blind spots

| Finding | Models | Convergence |
|---|---|---|
| `card` semantics are anomalous and underspecified | claude, gpt, gemini | **3/3** |
| Figma name normalization rule missing | gpt, claude | 2/3 (covered by Q3 patch) |
| Resolution model (scope, order, time) not specified | claude | 1/3 |
| Alpha channel `#RRGGBBAA` not supported but Figma uses it heavily | gemini | 1/3 |
| `"#999"` shorthand contradicts `"#RRGGBB"` design (real example bug) | gpt | 1/3 |
| Stage 0 prompts don't test Figma-like names | gpt | 1/3 |

**Decisions:**

- **`card` semantics — PATCH (3/3).** Spec must clarify: (a) `card` is overridable via `theme: color: card: "#X"` (b) `card` remains background-only after override (c) custom user-defined tokens are foreground-and-background-eligible (no `card`-style restriction). The asymmetry is grandfathered, not a model.
- **Hex format consistency — PATCH (real bug).** Doc 98's example `subtle: "#999"` contradicts the `"#RRGGBB"` constraint. Implementation accepts both `#RRGGBB` and `#RGB`. Decision: tighten implementation to `#RRGGBB` only (matches "one way to do everything"). Update example in doc 98 + spec to use full 6-digit hex.
- **Alpha channel — defer to v0.15.x candidate (1/3 but real).** Real Figma feature; Igni doesn't support. Log to ROADMAP Stream 3 with this signal. Don't widen v0.15.0 scope.
- **Resolution model — defer to spec follow-up (1/3).** Implementation already does whole-program collect-then-resolve; document explicitly in v0.15.0 spec patch as a one-paragraph note (cheap).
- **Stage 0 prompt update (1/3).** Add a Figma-name-shape prompt to the pre-registered Stage 0 list. Light edit to doc 98.

## Summary of patches

| Item | Convergence | Where | Status |
|---|---|---|---|
| Hard-list reserved names | 3/3 | spec/cheatsheet/micro | PATCH |
| `card` semantics clarified | 3/3 | spec | PATCH |
| `_` flatten → "Rule" + Figma normalization | 2/3 | spec | PATCH |
| Inline-hex rejection property coverage + `card` in background error | 1/3 (real bug) | codegen audit + error text | PATCH |
| Hex `#RRGGBB`-only (drop `#RGB`) + fix doc 98 example | 1/3 (real bug) | parser + doc 98 | PATCH |
| Resolution model paragraph | 1/3 | spec | PATCH (cheap) |
| Alpha channel `#RRGGBBAA` | 1/3 | ROADMAP Stream 3 | DEFER + log |
| Stage 0 prompt update | 1/3 | doc 98 | PATCH (cheap) |

## What stays unchanged

- **Q1 user-defined lock.** No challenge.
- **Q2 hard-list approach.** No model wanted contextual keywords.
- **Q3 `_` separator.** Unanimous.
- **Q4 same-cycle rejection.** Unanimous.
- v0.15.0 implementation (parser, codegen, fixtures) already shipped — patches are spec-side + small codegen tightening on hex format + property-coverage audit.

## Next

1. Apply patches above.
2. Re-run `npm test` (still 87/87).
3. Re-run `sync-docs --check` (still clean).
4. Update doc 98 status: "Stage 1 + Stage 2 complete; v0.15.0 shipped."
5. Update CHANGELOG to point at this synthesis + cite patches.
6. Log alpha-channel candidate to ROADMAP Stream 3.

## Cumulative cost

v0.15.0 Stage 2: $0.3352. Total v0.15.0 cycle so far: $0.34 (no Stage 0 / Stage 3 yet).
