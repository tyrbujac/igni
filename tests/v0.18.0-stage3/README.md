# v0.18 testing infrastructure — Stage 3 ship-validation

**Verdict: STRONG PASS — 4/4 P1 + 4/4 P2 + 4/4 P3 against shipped `spec/v0.18.0-cheatsheet.md`.** Frontier tier (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview) and noise tier (gemini-3.1-flash-lite-preview) both produced canonical Igni test syntax across every prompt × every model. Cycle closes.

12 cells, 4 models × 3 prompts. Total cost $0.466.

## Per-prompt adoption table

| Prompt | claude-opus-4-7 | gpt-5.5 | gemini-3.1-pro-preview | gemini-3.1-flash-lite-preview |
|---|---|---|---|---|
| **P1 — Function-test access path** | ✅ canonical | ✅ canonical | ✅ canonical | ✅ canonical |
| **P2 — Todo empty + interaction** | ✅ canonical (multi-add bonus) | ✅ canonical (multi-add bonus) | ⚠️ canonical except `length(items)` | ✅ canonical (multi-add bonus) |
| **P3 — Profile mock-fetch + reactive re-fetch** | ✅ canonical (uses `requested` + `request_count`) | ✅ canonical (uses `request_count` + new user data) | ✅ canonical (uses `requested` + new user data) | ✅ canonical (uses `request_count`) |

## Per-prompt convergent strengths

**P1 (function-test access path).** All four models converged on `render <Screen>` + `expect <function>(<args>) is <value>` — the Q13 Option A teaching held cleanly across the noise tier too. Every cell explicitly cited the test-scope override:

- **Opus:** "the cheatsheet gives exactly one way to test a screen-internal function in v0.18: `render <Screen>` to put the screen's functions in test scope"
- **GPT-5.5:** "`render Calculator` mounts the screen and makes its internal functions available in test scope"
- **Gemini-pro:** "Igni enforces that screen-internal functions are totally invisible outside their screen. You **must** use `render Calculator` to unlock `total_with_tax`"
- **Flash-lite:** "Per the specification, screen-internal functions are otherwise unreachable from tests. By rendering `Calculator`, we satisfy the test-scope requirement"

The patch from Stage 0 attempt 1 → attempt 2 propagated cleanly through the noise tier. No further teaching needed.

**P2 (Todo empty + interaction).** All four models reached for:
- `render Todo` ✓
- `change draft: "..."` ✓ (4/4 same shape)
- `tap "Add"` ✓
- `expect seen "..."` ✓
- `expect not seen "..."` ✓ (negation via `not` operator)
- `expect value_of(draft) is ""` ✓ (4/4 used the test-scope builtin)
- Multi-item bonus tests (3/4 added a third "multiple items" test)

**P3 (Profile mock-fetch + reactive re-fetch).** All four models:
- Use `mock fetch:` block form ✓
- Mock both URLs (`?refresh=0` AND `?refresh=1`) anticipating the reactive-re-fetch URL change ✓
- Use `error "<message>"` for the offline-state mock ✓
- Use `requested()` and/or `request_count()` for the refresh-triggers-new-fetch assertion ✓
- All cite lexical reactivity correctly in their explanations ✓

The Q-G ratification (test-scope `requested` / `request_count` builtins added at 2/3 panel + Tyr ratification) holds across the full 4-model panel — a strong post-hoc validation.

## The single off-shape — gemini-pro P2 `length(items)`

Gemini-pro's third P2 test asserts `expect length(items) is 2` instead of `expect items.length is 2`. The cheatsheet teaches `items.length` (dot-access on a Dart-builtin property). `length(<list>)` would parse as a regular function call → undefined symbol at codegen time. **Logical intent is right; the syntactic form is wrong.**

This is the single soft-fail in the run. It's not a teaching gap (the cheatsheet shows `items.length` explicitly in the P2-shaped section), but worth a trap-journal note: gemini-pro reaches for function-call form (`length()`, `count()`) by cross-language-reflex even when the cheatsheet teaches dot-access. Frontier tier so this might surface on other property-access cases too. No action this cycle; flag for future cheatsheet pass if it compounds.

## Methodology validations

1. **Q-G ratification (post-Stage-2 builtin additions) survived to ship.** `requested("<url>")` and `request_count("<url>")` were added to the design at 2/3 panel signal + Tyr ratification — moderate confidence. Stage 0 attempt 2 saw 3/3 use them; Stage 3 saw 4/4 use them. The 2/3-then-ratify path has produced canonical adoption at panel-strength signal.

2. **Patch-and-re-run from Stage 0 propagated to noise tier.** The Option A function-test-access-path teaching, added in the Stage 0 patch, was canonical at 3/3 in attempt 2 (frontier only). Stage 3 noise-tier test (flash-lite) confirms the patch reads cleanly to a less-capable model too. The cheatsheet's "render is the test-scope override" rule + the explicit `format_currency` "render once, assert many" example are doing the teaching together; neither alone would land as cleanly.

3. **Trigger A snapshot-deferral was the right call.** No model invented a snapshot syntax. No model reached for matcher API (`.toBe()`, `.equals()`). The deferred-bundle decision held — Stage 3 tells us neither feature was missed at the canonical-test-shape level.

4. **Framework-shaped cycle adaptation is reproducible.** "Given screen Y, write tests for it" produced direct-comparison-quality signal at both Stage 0 and Stage 3. Same prompts run twice (Stage 0 attempt 2 vs Stage 3 against the shipped cheatsheet); same convergent canonical shapes. The framing works for framework-shaped infrastructure cycles.

## Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.15602 |
| gpt-5.5 (effort: high) | $0.21875 |
| gemini-3.1-pro-preview | $0.08190 |
| gemini-3.1-flash-lite-preview | $0.00953 |
| **Total** | **$0.4662** |

**Cumulative v0.18 cycle cost: $1.459** ($0.149 Stage 2 + $0.844 Stage 0 attempts 1+2 + $0.466 Stage 3). Above the typical ~$0.85-per-cycle norm because v0.18 is framework-shaped (denser prompts; wider surface) and Stage 0 ran twice (attempt 1 + attempt 2 for the function-test-access patch). Worth the spend — the patch-and-re-run resolved a real design gap that a single-attempt Stage 0 would have shipped past.

## Trap-journal candidates

1. **gemini-pro reaches for `length(<list>)` over `<list>.length` in test scope.** Cross-language reflex (Python/JS-style function-call form) overrides cheatsheet teaching of dot-access. Single-cell raise; flag for future cheatsheet review if it compounds across more property-access cases.

## Next step

Cycle closes. v0.18.0 ships as canonical. Pending Tyr decision: next milestone promotion from Stream 3 (accessibility / animation+snapshot v0.19 / shared-namespace scoping / cross-screen utility modules — strong candidates per v0.17.0 meta-review panel).
