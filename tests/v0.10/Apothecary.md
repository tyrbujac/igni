# Apothecary Cold Test Results — v0.10 `{target with ...}` domain-swap control #1

**Date:** 2026-04-18
**Models tested:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.10.0-cheatsheet.md` + v0.10 Apothecary prompt (`tests/v0.10/prompts.md` #3)
**Runner:** `tests/runner/run.ts`, auto-graded via transpiler
**Scope:** domain-swap control for the Shopping round. Structural twin of #2, same panel, same spec tier. Changes only the noun surface (potions/satchel/discard) to rule out the "shopping-cart corpus density" confound behind Shopping's 3/3 `{target with ...}` adoption.

## Purpose — is Shopping's adoption a training-data artefact?

Shopping produced 3/3 frontier adoption of `{target with ...}` for the quantity-increment site. The strongest counter-hypothesis is corpus density: e-commerce carts are over-represented in LLM training, so models may pattern-match the shape from familiar domain cues rather than from the cheatsheet. Apothecary preserves the mechanic (add item; if duplicate, increment quantity) but swaps the domain to a medieval potion shop. If adoption holds, the cheatsheet's teaching is the cause, not the domain.

**Pre-commit prediction:** 3/4 frontier models use `{existing with quantity: existing.quantity + 1}` unprompted for the duplicate-add case — matching Shopping exactly. Any regression vs. Shopping is evidence of domain-dependent adoption.

## Headline result — 3/3 frontier on `{target with ...}` unprompted

| Axis | Opus 4.7 | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Transpile passes** | ✓ (50L) | ✓ (~60L) *[fence fix]* | ✓ (56L) | ✗ (drift) | **3/4** |
| **Uses `{target with ...}` for quantity-increment** | ✓ | ✓ | ✓ (`qty`) | n/a | **3/3 frontier** |
| **Falls back to field enumeration** | ✗ | ✗ | ✗ | n/a | 3/3 clean |
| **Shared state + find-by-predicate pattern** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |

Identical shape to Shopping. The hypothesis that Shopping's adoption was domain-cued is not supported.

## Per-model findings

### Claude Opus 4.7 — clean canonical form

```igni
add(potion):
  existing = find(shared.satchel, item => item.name is potion.name)
  if existing is null:
    shared.satchel = shared.satchel + [{name: potion.name, price: potion.price, quantity: 1}]
  else:
    shared.satchel = replace(shared.satchel, existing, {existing with quantity: existing.quantity + 1})
```

Transpiled in one shot (50 lines, 765 output tokens, 9.4s, cache-write 5111 toks, cost $0.156). Same discrimination as Shopping: full-field literal in the "new row" branch, `{target with ...}` in the "copy-with-override" branch. `item.name` as identity key (no `id` field in the product source — model recognised the prompt didn't supply one and improvised).

### GPT-5.4 — canonical, fence-missing again

```igni
add_to_satchel(potion):
  existing = find(shared.satchel, item => item.name is potion.name)
  if existing is null:
    shared.satchel = shared.satchel + [{name: potion.name, price: potion.price, quantity: 1}]
  else:
    updated = {existing with quantity: existing.quantity + 1}
    shared.satchel = replace(shared.satchel, existing, updated)
```

570 output tokens, 7.6s. Same shape as Shopping. Output lacks ` ```igni ` fences — runner's grader emitted "no code block". Extracted and transpiled manually: clean pass. Second consecutive round with the same fence-miss from GPT — logged in the Shopping write-up as a candidate grader-fallback fix. No semantic divergence from Opus.

### Gemini 3 Flash — `qty` abbreviation, again

```igni
add_to_satchel(p):
  existing = find(shared.satchel, item => item.id is p.id)
  if existing is not null:
    shared.satchel = replace(shared.satchel, existing, {existing with qty: existing.qty + 1})
  else:
    shared.satchel = shared.satchel + [{id: p.id, name: p.name, price: p.price, qty: 1}]
```

56 lines, 623 output tokens, 3.7s — fastest frontier. Synthesised an `id` field in its own `potions` literal (the prompt didn't give one), giving identity-match independence from `name`. Abbreviates `quantity` → `qty` across the app, matching its Shopping behaviour — stable stylistic signature across domains.

### Gemma 4 E4B — full drift, same as prior rounds

Output fenced as ` ```ini ` not ` ```igni `. Python-ish pseudocode, `for p in potions`, in-place quantity mutation, ALL_CAPS constants. Matches the pattern from v0.9.0 / v0.9.1 / Shopping. Floor model, uninformative for adoption signal but kept in the panel for methodology continuity.

## Secondary observations

- **Field-name drift held constant across domains.** Gemini wrote `qty` on both Apothecary and Shopping; Opus and GPT wrote `quantity` on both. The shape `{target with <field>: ...}` is stable; the field name is a per-model stylistic prior that doesn't vary with domain.
- **Shared-state discipline held on all three frontier.** `shared.satchel = ...` at mutation sites, `shared.` prefix at read sites. No bare-name drift in Apothecary (contrast with Spaceship Cargo, where Opus dropped the prefix).
- **Response sizes in line with Shopping.** Opus 765 (vs 695 Shopping), GPT 570 (vs 572), Gemini 623 (vs 569). Within normal variance.
- **No semantic regression vs Shopping.** Every frontier model produced a working app of equivalent structural quality. The translation from "shopping cart" to "potion shelf" cost zero signal.

## Transpiler validation

| Model | Transpile | Lines | Notes |
|---|---|---|---|
| Claude Opus 4.7 | ✓ | 50 | Clean auto-grade pass |
| GPT-5.4 | ✓* | ~60 | Grader flagged "no code block" — missing ` ```igni ` fence, manual transpile clean |
| Gemini 3 Flash preview | ✓ | 56 | Clean auto-grade pass |
| Gemma 4 E4B | ✗ | — | Drift pattern, consistent with prior rounds |

## Verdict

**Shopping's `{target with ...}` adoption is not a domain artefact.** The domain swap preserved the result exactly: 3/3 frontier, same field-name signatures per model, same Gemma drift pattern. Together with Shopping, the count is 6/6 frontier adoptions across two domains — the cheatsheet's single Lists-section example is sufficient teaching.

**Pending: Spaceship Cargo** — the further-from-shopping domain control (mass/jettison vs price/discard). Three runs × 3 frontier = 9/9 would close the domain-density hypothesis entirely.

## Caveats

- **`cost_usd` is reliable only for Opus this round.** `pricing.ts` keys for GPT-5.4 and Gemma had to be corrected after this round (`gpt-5.4` → `gpt-5.4-2026-03-05`; `gemma4-e4b` → `gemma4:e4b`) and the backfill script `tests/runner/backfill-cost.ts` was run. OpenAI and Google rates are still `VERIFY` placeholders at `$0` — replace before publishing any cost-ratio claims.
- **GPT fence-miss is now a repeating pattern** (Shopping, Apothecary, and Spaceship Cargo all hit it). Grader fallback should probably treat a fence-free response as a single code block when no `\`\`\`` is present.
