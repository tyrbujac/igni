# Cold-LLM Test: Todo with Delete (Igni v0.6.1 — Cheat Sheet)

**Spec version tested:** Igni v0.6.1 cheat sheet (228 lines, patched)
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Todo with delete
**Second cheat sheet test — validates fixes from Shopping round.**

## The prompt

> Using only the Igni language spec above, write a Todo app in Igni. It should have a text input for new tasks, an "Add" button, and a list of tasks below. Each task shows its text and a "Done" button that removes it. When there are no tasks, show "No tasks yet." Clear the input after adding.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Cross-model results

| Feature | Gemini 3 Fast | ChatGPT 5.3 | Gemini 3.1 Pro | Claude Opus 4.6 |
| --- | --- | --- | --- | --- |
| No parens on screen | ✓ | ✓ | ✓ | ✓ |
| Functions inside screen | ✓ | No (inline on tap) | ✓ | ✓ |
| `input bind:` | ✓ | ✓ | ✓ | ✓ |
| Add to list | ✓ | ✓ | ✓ | ✓ |
| Clear input after add | ✓ | ✓ | ✓ | ✓ |
| Empty state | ✓ | ✓ | ✓ | ✓ |
| Remove item | `without` | `filter` lambda | `without` | `filter` lambda |
| Empty check | `is not ""` | `is not ""` | `is not ""` | `is not empty` |
| **Verdict** | **PASS** | **PARTIAL** | **PASS** | **PASS** |

## Headline findings

### 1. Cheat sheet fixes validated

The two fixes from the Shopping round both worked:
- **No-arg screen:** 4/4 now write `screen Name:` without parentheses (was 0/4 before fix)
- **Each-in-function:** Gemini Fast now defines functions with if/else and list operations (failed in Shopping round)

### 2. ChatGPT still inlines multi-statement on tap

Same structural error as Shopping. ChatGPT-specific pattern — avoids named functions and puts if/else blocks directly after `on tap:`. The other three models all define functions. This is a model habit, not a cheat sheet gap.

### 3. `is not ""` vs `is not empty`

Three models checked for empty string with `is not ""` instead of the canonical `is not empty`. Only Opus used the spec form. Both are valid Igni but `is not empty` is the intended pattern. Models prefer literal comparison — feels more explicit to them.

### 4. `without` vs `filter` for removal

Prompt said "removes it" without specifying a builtin. Gemini Fast and Pro used `without` (identity-based). ChatGPT and Opus used `filter` with lambda. Both are correct — `without` works because the item reference comes from the `each` loop.

## Cheat sheet effectiveness summary (across both rounds)

| Round | Test | Before fix | After fix |
| --- | --- | --- | --- |
| Shopping | No-arg screen parens | 0/4 correct | (fixed in cheat sheet) |
| Shopping | Each-in-function | 3/4 correct | (fixed in cheat sheet) |
| Todo | No-arg screen parens | — | 4/4 correct |
| Todo | Functions in screen | — | 3/4 correct (ChatGPT is model-specific) |

The 228-line cheat sheet produces valid Igni from non-frontier models. Two targeted fixes closed two structural gaps. The remaining ChatGPT issue is a model habit, not a spec gap.
