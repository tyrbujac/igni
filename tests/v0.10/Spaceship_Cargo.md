# Spaceship Cargo Cold Test Results — v0.10 `{target with ...}` domain-swap control #2

**Date:** 2026-04-18
**Models tested:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.10.0-cheatsheet.md` + v0.10 Spaceship Cargo prompt (`tests/v0.10/prompts.md` #4)
**Runner:** `tests/runner/run.ts`, auto-graded via transpiler
**Scope:** second domain-swap control, furthest from the Shopping domain. Mass instead of price, hold instead of cart, jettison instead of remove. Structural twin of #2 and #3.

## Purpose — closing the domain-density hypothesis

Apothecary (medieval potion shop) already confirmed 3/3 frontier `{target with ...}` adoption. Spaceship Cargo tests the same mechanic at the far end of the domain spectrum — a sci-fi cargo manifest with no price, no cart, no retail vocabulary. If the result holds, the three-run evidence is strong enough to reject the "shopping-cart corpus density" hypothesis altogether.

**Pre-commit prediction:** 3/4 frontier models use `{existing with quantity: existing.quantity + 1}` unprompted for the duplicate-add case. Matching Shopping and Apothecary gives 9/9 frontier adoptions across three domains — the result the domain-swap battery was designed to produce or falsify.

## Headline result — 3/3 frontier on `{target with ...}` unprompted

| Axis | Opus 4.7 | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Transpile passes** | ✓ (50L) | ✓ (~65L) *[fence fix]* | ✓ (57L) | ✗ (drift) | **3/4** |
| **Uses `{target with ...}` for quantity-increment** | ✓ | ✓✓ *(twice)* | ✓ (`qty`) | n/a | **3/3 frontier** |
| **Falls back to field enumeration** | ✗ | ✗ | ✗ | n/a | 3/3 clean |
| **Shared state + find-by-predicate pattern** | partial | ✓ | ✓ | n/a | 2.5/3 frontier |

Domain swap held. Three runs × 3 frontier = **9/9 frontier adoptions across Shopping + Apothecary + Spaceship Cargo**. The cheatsheet teaches the shape.

## Per-model findings

### Claude Opus 4.7 — canonical `{with}`, but dropped `shared.` prefix

```igni
shared:
  hold = []

screen Catalog, title: "Cargo Catalog":
  ...
  load(item):
    existing = find(hold, entry => entry.name is item.name)
    if existing is null:
      hold = hold + [{name: item.name, mass: item.mass, quantity: 1}]
    else:
      hold = replace(hold, existing, {existing with quantity: existing.quantity + 1})
```

Transpiled (50 lines, 667 output tokens, 8.8s, **cache hit 5111 toks**, cost $0.061 — half the Apothecary cost thanks to ephemeral cache reuse on the spec). `{target with ...}` is correct. But Opus wrote `hold` (unqualified) at every read and mutation site despite declaring it inside a `shared:` block — the spec's hard rule is `shared.hold`. That the transpiler accepted this silently is itself a finding: there's a quiet gap between spec and transpiler on the shared-access prefix, worth checking against the `transpiler/src/` codegen path.

**This is a spec-compliance regression Opus didn't hit on Shopping or Apothecary.** Same model, same cheatsheet tier, same prompt shape; only the domain changed. The two plausible causes: (a) random sampling variance, (b) something about "hold" being a noun that's also a verb making the bare identifier feel more natural than `shared.hold`. Either way, worth flagging — if the transpiler tightens `shared:` access in a later version, this test ID regresses.

### GPT-5.4 — two uses (increment + decrement), fence-missing again

```igni
add_to_hold(cargo):
  existing = find(shared.hold, item => item.name is cargo.name)
  if existing is null:
    shared.hold = shared.hold + [{name: cargo.name, mass: cargo.mass, quantity: 1}]
  else:
    updated = {existing with quantity: existing.quantity + 1}
    shared.hold = replace(shared.hold, existing, updated)

jettison(item):
  if item.quantity > 1:
    updated = {item with quantity: item.quantity - 1}
    shared.hold = replace(shared.hold, item, updated)
  else:
    shared.hold = without(shared.hold, item)
```

631 output tokens, 9.2s. Same double-use pattern as Shopping — "Jettison" interpreted as decrement-to-zero-then-remove, giving a second `{item with quantity: item.quantity - 1}` site. Consistent behaviour across all three domain runs. Lacked ` ```igni ` fences again (third consecutive round of fence-miss). Proper `shared.` discipline throughout.

### Gemini 3 Flash — `qty` abbreviation, clean shared discipline

```igni
add_to_hold(cargo):
  existing = find(shared.hold, h => h.id is cargo.id)
  if existing is not null:
    shared.hold = replace(shared.hold, existing, {existing with qty: existing.qty + 1})
  else:
    shared.hold = shared.hold + [{id: cargo.id, name: cargo.name, mass: cargo.mass, qty: 1}]
```

57 lines, 613 output tokens, 3.8s, cache-read 2032. Same stylistic signature across domains: `qty` not `quantity`, synthesises `id` field for identity match, always uses `shared.` prefix. Most consistent model in the panel. Zero regressions across Shopping → Apothecary → Spaceship Cargo.

### Gemma 4 E4B — full drift

1248 output tokens, 64s, transpile failed. Same drift pattern as prior rounds. Kept in the panel as the methodology floor.

## Secondary observations

- **GPT decrement pattern is stable across domains.** Shopping's "Remove" → decrement-or-delete; Cargo's "Jettison" → decrement-or-delete. Both produced a second `{target with quantity: - 1}` site. This is now a GPT-specific behavioural signature worth noting as a per-model writing style rather than a per-round finding.
- **Cache economics validated.** Opus Apothecary (round 1) wrote the spec to cache at $0.156; Opus Cargo (round 2 same session) hit cache at $0.061 — 2.6× cheaper thanks to `cache_control: ephemeral`. Over a multi-prompt run the amortised per-call cost approaches output-only pricing.
- **Shared-prefix drift is a partial 1/3 regression.** Opus only; Gemini and GPT kept `shared.` everywhere. Not enough signal yet to call it a spec-teaching gap; could easily be sampling noise. Worth re-running this prompt at another seed before drawing spec-level conclusions.
- **Domain vocabulary held constant across frontier.** All three used the prompt's terms (Catalog, Hold, Jettison, mass) without slipping back into Shopping's vocabulary. The models are domain-adapting at the surface while preserving the structural shape.

## Transpiler validation

| Model | Transpile | Lines | Notes |
|---|---|---|---|
| Claude Opus 4.7 | ✓ | 50 | Clean auto-grade pass, but `shared.` prefix missing — transpiler silently accepted it |
| GPT-5.4 | ✓* | ~65 | "no code block" — missing ` ```igni ` fence, manual transpile clean |
| Gemini 3 Flash preview | ✓ | 57 | Clean auto-grade pass |
| Gemma 4 E4B | ✗ | — | Same drift |

## Verdict

**Domain-density hypothesis is rejected.** Across Shopping (cart, e-commerce), Apothecary (satchel, medieval retail), and Spaceship Cargo (hold, sci-fi logistics), frontier `{target with ...}` adoption is 9/9. The cheatsheet's Lists-section example teaches the syntax; the domain doesn't supply it.

**Secondary finding to investigate: transpiler silently accepts bare shared-var access.** Opus's Spaceship Cargo output writes `hold = hold + [...]` and `hold = replace(hold, ...)` on a `shared.hold` declaration. Spec says this should be `shared.hold = ...`. The transpiler currently swallows it. Either tighten the transpiler, or re-examine the spec wording — the "visible coupling marker" design rationale is undermined if bare access silently works.

**v0.10.0 passes its full post-ship validation battery.** Three domain-swap runs + the original Shopping ship-test + the pre-ship proposal round = a complete audit trail. The `{target with ...}` syntax is ready to be called stable within v0.10.

## Next candidates

1. **Investigate shared-access transpiler gap.** One-hour spike: write a failing case, check `transpiler/src/` codegen, decide spec-vs-transpiler patch direction. Likely v0.11 or a v0.10.x transpiler-only fix.
2. **GPT fence-miss grader fallback.** Three consecutive rounds now. Small runner patch in `tests/runner/run.ts` — treat unfenced output as a single code block when no `\`\`\`` is found. Low risk, high value for grading hygiene.
3. **`count()` predicate form** — unchanged from the Shopping write-up's queue. Next syntax-budget decision to design.

## Caveats

- **`cost_usd` is reliable only for Opus this round.** Same pricing.ts situation as Apothecary; the backfill has been run with corrected keys but OpenAI/Google rates remain `VERIFY` placeholders.
- **Opus cache hit drops per-call cost dramatically.** If future rounds deliberately vary the prompt order (spec → P1 → spec → P2) vs. batched (spec cached, then P1, P2, P3), the cost signal is confounded. For dissertation-grade cost claims, commit to a single run order per experiment.
