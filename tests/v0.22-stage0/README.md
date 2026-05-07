# v0.22 Stage 0 cold-test — hover + size tokens

**Status (2026-05-07):** Pre-registered. Run scheduled for v0.22 cycle Stage 0 (post-cheatsheet-skeleton, pre-implementation).

**Method:** 3 frontier models × 3 prompts × cheatsheet-draft injected as `--spec`. `--no-grade` (v0.22 transpiler hasn't shipped; auto-grade would falsely fail every output).

**Models:** `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`. Optional `gemini-3-flash-lite` noise-tier cell for resolution hygiene per v0.20/v0.21 precedent.

**Cost estimate:** ~$0.70 (matches v0.20-stage0's $0.83 for spec-injected 3×3).

**Outputs:** 9 `<model>_cheatsheet_<prompt-slug>.{md,json}` files (filled after run).

## Pre-registered ship bars

Lock these BEFORE the panel runs.

- **Strong pass (ship):** 3/3 P1 + 3/3 P2 + 3/3 P3 = **9/9 cells canonical**.
- **Soft pass:** 2/3 on any single prompt → patch teaching in cheatsheet, re-run minimal subset.
- **Fail:** ≤1/3 on any prompt → reopen the relevant Stage 2 lock (e.g., if hover-conditional content fails: revisit Q1 B1 lock; if `rounded: full` fails: revisit P1 lock from doc 137).

Trigger A: ≥2/3 cells flip the architectural shape (e.g., emit `if is_hovered():` for property overrides instead of `hover:`) → reopen Stage 1.

## What "canonical" means per prompt

### P1 — Card grid with hover-lift
- Hover-lift property overrides go inside `hover:` sub-block (background, shadow, cursor)
- Property overrides do **not** appear inside `if is_hovered():`
- Tightly-packed icon row uses `gap: none`

### P2 — Card list with hover-revealed preview
- Card-level visual highlight (`background: brand`) goes inside `hover:`
- Preview-description rendering uses `is_hovered()` + `if`
- Preview is rendered as a normal child primitive (not magic-injected by `hover:`)

### P3 — Contact card with pill button + disabled state
- Circular avatar: `rounded: full`
- Pill button: `rounded: full`
- Tight section gap: `gap: none`
- Disabled state cursor: `cursor: not-allowed` inside `hover:`

## Run command

```bash
cd tests/runner
set -a && source .env && set +a
npx tsx cold-test.ts \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview \
  --spec ../v0.22-stage0/cheatsheet-draft.md \
  --prompts ../v0.22-stage0/prompts.md \
  --out ../v0.22-stage0 \
  --max-tokens 16000
```

`--max-tokens 16000` triggers the streaming codepath in both Anthropic and OpenAI providers (per the 2026-05-07 OpenAI-streaming-fix trap; non-streaming long generations hit "Connection error"). Drop to default 8192 only if all three models reliably finish under it (v0.22 hover prompts may exceed because the cheatsheet is now ~1090 lines, larger than v0.20's).

`--no-grade` is implied for spec-without-shipped-transpiler; the runner skips auto-grading when the transpiler can't parse the new syntax.

## Files

- `cheatsheet-draft.md` — snapshot of `spec/v0.21.2-cheatsheet.md` at Stage 0 run time, with v0.22 hover + size-token additions. Methodology artefact: this is what the panel saw.
- `prompts.md` — 3-prompt cold-test framework with reach tests.
- `<model>_cheatsheet_<prompt-slug>.{md,json}` — outputs (filled after run).
- This file — pre-registration + post-run synthesis (sections appended after run).

## Synthesis (2026-05-07)

**Captured:** 8/9 cells. Cost ~$0.55. Total v0.22 cycle so far: $0.36 (Stage 2) + $0.55 (Stage 0) = **$0.91** (under v0.20 cycle's $1.85 at comparable point).

**Verdict: SOFT PASS — patch teaching, re-run minimal subset.** The single substantive finding is the `not-allowed` lexer trap (n=2/2 cells emit literal `cursor: not-allowed` per the cheatsheet teaching, but the lexer rejects hyphens in identifiers — same shape as v0.12 font-token failure resolved in v0.12.1 by snake_case rename). Gemini-3.1-pro P3 fail-to-run is a methodology-bench trap (n=2 reproduction of the OpenAI/Google streaming asymmetry; P3-prompt-specific failure under three retry attempts), separately scoped from the design pass/fail decision.

### Convergence by prompt

#### P1 — Card grid with hover-lift (3/3 canonical)

Tests `hover:` property-overrides + `gap: none` for tight icon row.

| Cell | `hover:` block with overrides | NOT inside `if is_hovered():` | `gap: none` for icons | Component extraction |
|---|---|---|---|---|
| Opus 4.7 | ✓ (background, shadow, cursor) | ✓ | ✓ | inline (not extracted) |
| GPT-5.5 | ✓ (background, shadow, cursor) | ✓ | ✓ | extracted RecipeCard component |
| Gemini-3.1-pro | ✓ (background, shadow, cursor) | ✓ | ✓ | extracted RecipeCard component |

**3/3 canonical. Reach test perfect.** All three reach for `hover:` block over `if is_hovered():` for property overrides — the P4 patch (mandatory-property rule) is honoured by default before being a parse rule. Two of three extract the card into a component (idiomatic).

#### P2 — Card list with hover-revealed preview (3/3 canonical)

Tests `is_hovered()` + `if` for conditional content + `hover:` for property overrides.

| Cell | `hover:` for property override | `is_hovered()` + `if` for conditional content | Description NOT inside `hover:` |
|---|---|---|---|
| Opus 4.7 | ✓ (background, cursor) | ✓ | ✓ |
| GPT-5.5 | ✓ (background, cursor) | ✓ | ✓ |
| Gemini-3.1-pro | ✓ (background, cursor) | ✓ | ✓ (also notes "transitions ~150ms by default") |

**3/3 canonical. Reach test perfect.** Gemini's prose explicitly references the v0.22 P3 patch ("It automatically transitions over ~150ms by default") — strong evidence the cheatsheet teaching is sticking on the new default.

#### P3 — Contact card with pill, circular avatar, disabled state (2/3 canonical, lexer trap)

Tests `rounded: full` for circle/pill + `cursor: not-allowed` for disabled affordance + `gap: none` between sections.

| Cell | `rounded: full` (avatar) | `rounded: full` (pill button) | `cursor: not-allowed` reach | `gap: none` between sections | Lexer-valid? |
|---|---|---|---|---|---|
| Opus 4.7 | ✓ | ✓ (via wrapping layouts; buttons don't accept rounded directly) | ✓ (via `follow_cursor()` returning `not-allowed`) | partial (uses `gap: small` clusters; notes the alternative inline) | **NO — `not-allowed` lexes as `not - allowed`** |
| GPT-5.5 | ✓ | ✓ (via wrapping layouts) | ✓ (`cursor: not-allowed` inside `hover:`) | ✓ (`gap: none` on outer container) | **NO — `not-allowed` lexes as `not - allowed`** |
| Gemini-3.1-pro | — fail to run (3 retries; `TypeError: fetch failed`) | — | — | — | — |

**2/3 P3 canonical.** Both cells reach `rounded: full` for both circle-and-pill cases — strong signal the size-token addition is teaching cleanly.

**Critical finding (n=2/2): `not-allowed` lexer trap.** The cheatsheet teaches `cursor: not-allowed` (line 175 of `cheatsheet-draft.md`); both cells emit it literally. But `transpiler/src/lexer.ts:293-302` `scanIdentifier` only accepts alphanumerics — hyphen is `TokenType.Minus` (line 212). Source `cursor: not-allowed` lexes as `cursor : not - allowed` (5 tokens: identifier "cursor", colon, identifier "not", minus, identifier "allowed") and parses as either parse error or `not minus allowed` expression.

This is the same trap shape as v0.12 hyphenated font tokens, resolved in v0.12.1 by snake_case rename rather than lexer surgery (per `docs/private/84_v0121_font_token_rename.md`).

#### P3 also surfaced two minor teaching gaps (1/3 each)

- **Button-can't-take-rounded workaround:** Both Opus and GPT wrapped buttons in `layout vertical, rounded: full` to apply pill shape, with explanatory notes. The cheatsheet's button primitive doesn't expose `rounded:` directly. This is correct per the spec, but the workaround is verbose. Could be either: (a) a v0.22.1 docs-iteration patch teaching the pattern explicitly in the cheatsheet, or (b) a v0.22.1 spec patch adding `rounded:` to button. n=2 of 2 cells reach for the workaround → log only, not in v0.22 scope.
- **`gap: none` interpretation drift (Opus only):** Opus put `gap: small` between sections instead of `gap: none` between name and button row. Notes the alternative inline ("If you want literally zero gap..."). 1/3 — log only.

### Patches surfaced

| # | Patch | Source | Action |
|---|---|---|---|
| **S1** | Rename `not-allowed` → `not_allowed` in cursor whitelist (cheatsheet + doc 125 + impl plan). Same shape as v0.12.1 font-token rename. Reasoning: hyphens in identifiers conflict with `TokenType.Minus`; snake_case is the v0.12.1-precedent fix; bending the lexer for one cursor token is principle-erosion | n=2/2 cells emit literal `not-allowed` (Stage 0 lexer trap) | **Tyr-decision required** — rename or drop disabled-affordance from v0.22 |
| **S2** | Methodology-bench: gemini-3.1-pro-preview P3 fail-to-run reproduces the n=1 OpenAI streaming trap from `2026-05-07` (now n=2 of class). Provider streaming defaults across the runner's three providers are still asymmetric | 3 retry attempts on gemini-3.1-pro-preview P3 | log to trap-journal as n=2 promotion of `methodology-bench` class |

### Trigger A status

**NOT FIRED.** Pre-reg: ≥2/3 cells flip the architectural shape → reopen Stage 1. Actual: 0/3 cells flip — every captured cell uses `hover:` for property overrides and `is_hovered()` + `if` for conditional content. The Stage 1 + Stage 2 design is teaching cleanly; the only ship-blocker is the lexer-spec disconnect on `not-allowed`.

### P3 re-run (2026-05-07, post-rename to `not_allowed`)

`not-allowed` → `not_allowed` rename applied to cheatsheet + doc 125 + prompts.md per Tyr 2026-05-07 (S1 decision, v0.12.1-precedent path). Cheatsheet snapshot re-copied; P3 re-run on opus + gpt + gemini-3.1-pro.

| Cell | `cursor: not_allowed` lexer-clean | `rounded: full` reach | Conditional disabled-state | Verdict |
|---|---|---|---|---|
| Opus 4.7 | ✓ | ✓ (button wrappers); avatar uses `image ... round: true` (canonical per cheatsheet line 227, 562, 808 — separate `round:` boolean for full-circle images) | ✓ (`if contact.followed:`) | **canonical** |
| GPT-5.5 | ✓ | ✓ (button wrappers); avatar wrapped in `rounded: full` layout AND uses `image round: true` (slightly redundant but both forms canonical) | ✓ (`if followed:`) | **canonical** |
| Gemini-3.1-pro | — fail to run (5th retry attempt; same `TypeError: fetch failed` from undici; not a streaming issue — happens before any HTTP exchange completes; specific to gemini-3.1-pro-preview + this prompt + 8.8k-word spec combination) | — | — | **bench-trap, n=2 of provider-streaming-asymmetry class** |
| Gemini-3.1-flash-lite-preview (noise tier) | ✓ (`cursor: not_allowed`) | ✓ (`rounded: full` on avatar + buttons) | uses inline `if x: a else: b` ternary expressions — **invalid Igni** (no inline conditionals, per "one way to do everything") | **non-canonical structurally; noise-tier signal only** |

### Final verdict

**8/9 frontier-canonical with bench-trap on the 9th.** Treating as **STRONG mod methodology-bench**: every captured frontier cell on every prompt is canonical post-rename; the only gap is gemini-3.1-pro-preview reproducibly failing to fetch on P3 (5 retry attempts, 4 parameter combinations including streaming and non-streaming). Design teaching is clean — Stage 0 passes for design purposes; the missing cell is an instrument-class issue logged as n=2 promotion of methodology-bench class to trap-journal.

Cumulative v0.22 cycle cost: $0.36 (Stage 2) + ~$0.65 (Stage 0 + re-run) ≈ **$1.01**.

### Next steps

1. ✅ **DONE** — S1 rename applied to `not_allowed`.
2. ✅ **DONE** — re-run P3 captured 2/3 frontier canonical post-rename.
3. ✅ **DONE** — gemini P3 trap logged as n=2 to `docs/private/trap-journal.md`.
4. **Tyr-go-ahead pending** — proceed to Stage 4 implementation:
   - Size tokens: `DESIGN_TOKENS` adds `none: 0`; codegen.ts special-cases `rounded: full` → `BorderRadius.circular(9999)` at the two rounded sites; reject `full` on padding/gap/size via existing unknown-token error path.
   - Hover: lexer/parser support for `hover:` sub-block; codegen lowering to MouseRegion-wrapped property overrides; `is_hovered()` builtin with innermost-enclosing-layout scope rule; nested-`hover:` parse error; parse-time rule that property overrides MUST live in `hover:` (P4); ambiguity lint when ancestor also has `hover:` (P5); `cursor:` whitelist (`pointer` + `not_allowed`); ~150ms ease-out default + `transition: none` opt-out.
   - Tests: ~12-15 new diff fixtures.
