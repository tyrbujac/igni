# Shopping Cold Test Results — v0.10.0 post-ship `{target with ...}` adoption

**Date:** 2026-04-17
**Models tested:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** `spec/v0.10.0-cheatsheet.md` + v0.10 Shopping prompt (`tests/v0.10/prompts.md` #2)
**Runner:** `tests/runner/run.ts`, auto-graded via transpiler
**Scope:** single-prompt round. Measures whether the v0.10.0 cheatsheet teaches `{target with ...}` zero-shot for the canonical "quantity-increment on duplicate-add" case.

## Purpose — does the v0.10.0 cheatsheet teach `{target with ...}` zero-shot?

v0.10.0 shipped object-update syntax on a design-note fallback rule: the pre-ship proposal round (`Object_Update_Syntax.md`) produced four distinct shapes across the four-model panel with no majority convergence. `with`-keyword family had 2/3 frontier plurality. The design note's "ship on principles" branch fired — `{target with field: newval}` became the spec.

This round tests the opposite direction. Given v0.10.0-cheatsheet as context, do frontier models *reach for* `{target with ...}` unprompted when asked to build a small shopping app with a quantity-increment mutation? The prompt never names the syntax; models must pattern-match from the cheatsheet's single example in the Lists section.

**Pre-commit prediction:** 3/4 frontier models use `{existing with quantity: existing.quantity + 1}` unprompted for the duplicate-add case. Any falling back to the verbose enumeration form is evidence the cheatsheet teaching is still weak and needs sharpening.

## Headline result — 3/3 frontier on `{target with ...}` unprompted

| Axis | Opus 4.7 | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Transpile passes** | ✓ (52L) | ✓ (65L) *[fence fix]* | ✓ (53L) | ✗ (drift) | **3/4** |
| **Uses `{target with ...}` for quantity-increment** | ✓ | ✓✓ *(twice)* | ✓ | n/a | **3/3 frontier** |
| **Falls back to field enumeration** | ✗ | ✗ | ✗ | n/a | 3/3 clean |
| **Shared state + find-by-predicate pattern** | ✓ | ✓ | ✓ | n/a | 3/3 frontier |

All three frontier models adopted the new syntax on first exposure. No fallback to the verbose form in the quantity-update site. Same panel as the v0.9.1 Product Search round and the v0.10 pre-ship proposal round, so the signal is directly comparable.

## Per-model findings

### Claude Opus 4.7 — clean canonical form

```igni
add(product):
  existing = find(shared.cart, item => item.id is product.id)
  if existing is null:
    shared.cart = shared.cart + [{id: product.id, name: product.name, price: product.price, quantity: 1}]
  else:
    shared.cart = replace(shared.cart, existing, {existing with quantity: existing.quantity + 1})
```

Transpiled in one shot (52 lines, 695 output tokens, 8.8s). Used the `with` syntax exactly where it applies: the "already in cart" branch. Kept the full field enumeration in the "not in cart yet" branch — which is correct, because there's no base object to copy from when adding a new row. Shows the model internalised not just the shape but when to use it.

### GPT-5.4 — two uses (increment + decrement)

```igni
# add_to_cart
if existing is null:
  shared.cart = shared.cart + [{id: product.id, name: product.name, price: product.price, quantity: 1}]
else:
  updated = {existing with quantity: existing.quantity + 1}
  shared.cart = replace(shared.cart, existing, updated)

# remove_item — notable: GPT interprets "Remove" as "decrement or remove when last"
if item.quantity > 1:
  updated = {item with quantity: item.quantity - 1}
  shared.cart = replace(shared.cart, item, updated)
else:
  shared.cart = without(shared.cart, item)
```

GPT produced the code without fenced ` ```igni ` markers, so the runner's auto-grader flagged "no code block". Extracted and transpiled manually: clean pass (65 lines). Used `{target with ...}` **twice** — increment and decrement — showing the pattern generalises cleanly. GPT's Remove semantics ("decrement until zero, then remove") went beyond the literal prompt; more evidence the model reasoned about the mutation space rather than pattern-matching one usage.

**Methodology note:** the `--no-grade`-adjacent "no code block" failure is a runner artifact, not a model failure. Grader pattern is: extract the first fenced block from the output. GPT skipped fences entirely. For this round, manual verification filled the gap; for future rounds, the prompt could explicitly request fences.

### Gemini 3 Flash — `qty` abbreviation

```igni
add_to_cart(product):
  existing = find(shared.cart, item => item.id is product.id)
  if existing is null:
    shared.cart = shared.cart + [{id: product.id, name: product.name, price: product.price, qty: 1}]
  else:
    shared.cart = replace(shared.cart, existing, {existing with qty: existing.qty + 1})
```

Fastest output (3.2s, 569 tokens). Canonical pattern. Abbreviated `quantity` → `qty` across the app consistently — purely a style choice, not a bug. Transpiled in 53 lines.

### Gemma 4 E4B — full drift, same as prior rounds

Output wrapped in ` ```ini ` not ` ```igni `. Code was Python-ish pseudocode with `for` loops, `item.quantity += 1` in-place mutation, hardcoded `PRODUCT_CATALOG` as ALL_CAPS, and block comments. Matches the pattern from Phase 1, v0.9.0, v0.9.1, and the v0.10 syntax-proposal round. Methodology floor; uninformative for v0.10 adoption signal.

## Secondary observations

- **No verbose-form fallback.** None of the three frontier models wrote `{id: existing.id, name: existing.name, price: existing.price, quantity: existing.quantity + 1}` — the exact pattern v0.10 was designed to eliminate. The `examples/shopping.igni` source used that shape before v0.10; the cheatsheet migration to `{target with ...}` successfully taught the replacement.
- **`{target with ...}` appears only where appropriate.** All three models kept the full-field object literal for "new row" cases (nothing to copy from) and switched to `{with}` for "copy-with-override" cases. The shape is used with semantic discrimination, not syntactic overuse.
- **Dot-chain base not exercised in any output.** The cheatsheet shows a dot-chain base in the Lists section (`{target with ...}`), but no model reached for `{shared.cart with ...}` or `{product.profile with ...}`. Shopping's structure didn't invite a nested update; a Notes-style rerun could test dot-chain adoption as a separate signal if needed.
- **Response sizes in line with prior rounds.** Opus 695 tokens vs 712 on Product Search v0.10 validation. GPT 572 vs 491 on v0.9.1. Gemini 569 vs 655 on v0.9.1. Within normal variance; no token-cost regression from the new syntax being in the cheatsheet.

## Transpiler validation

| Model | Transpile | Lines | Notes |
|---|---|---|---|
| Claude Opus 4.7 | ✓ | 52 | Clean auto-grade pass |
| GPT-5.4 | ✓* | ~65 | Grader flagged "no code block" due to missing ` ```igni ` fence; manual transpile clean |
| Gemini 3 Flash preview | ✓ | 53 | Clean auto-grade pass |
| Gemma 4 E4B | ✗ | — | Same drift pattern as prior rounds |

## Verdict

**The v0.10.0 cheatsheet teaches `{target with ...}` zero-shot.** 3/3 frontier models reached for the new syntax unprompted, at the exact site the design note targeted, with semantic discrimination (new-row vs copy-with-override). GPT's second use in the remove-decrement path shows the pattern generalises beyond a single idiom.

**Ship-on-principles was the right call.** The pre-ship proposal round produced no convergence, but the implemented syntax — once taught by a single cheatsheet example — is consistently discovered by frontier models when they need it. That's the strongest possible post-ship validation: the prose teaches the shape even though the models' own proposals wouldn't have picked it.

**v0.10.0 is closed as a spec iteration.** The design-note-plus-cheatsheet combo works. The canonical template (enforce + prose teach + cold-test validate) extends the v0.9.0-v0.9.1 template with one more stage: pre-ship *proposal* tests for syntax-budget decisions that cold-test data doesn't fully resolve.

## Next candidates

From the roadmap, ranked by readiness:

1. **`count()` predicate form** — 4/4 Alert Dashboard friction signal. Smaller shape than object update (extend existing builtin). Needs a design note but the shape space is narrower (accept a lambda vs accept an identity target).
2. **Mutating-component-arg as v0.11-template candidate** — the next "prose says, transpiler silently allows" gap. Needs its own cold test first (same template as v0.10 proposal round) to measure whether any model naturally tries to mutate a passed-in arg.
3. **Widen async-footgun detection** — now de-prioritised after v0.9.1 closed the evasion gap with docs-only.

## Minor runner follow-up

- GPT's missing-fence "no code block" suggests either (a) the prompt should explicitly request ` ```igni ` fences, or (b) the grader should fall back to treating the whole output as a single code block when no fence is found. Small fix; doesn't block future rounds.
