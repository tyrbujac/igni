# Quizzler Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3 Flash, ChatGPT 5.3
**Spec:** v0.6.5 (first run was pre-indexing; re-run was post-indexing)
**Source:** Angela Yu's "Complete Flutter Development Bootcamp" — Quizzler app (Section 9)

## What Quizzler tests

True/false quiz. One question at a time, "True" and "False" buttons, row of checkmark/X icons for past answers, completion message and restart. First Angela Yu project requiring **list indexing** — accessing the Nth item in a list by position.

## Why this test matters

Quizzler was run **before** indexing was added to the spec. The goal was to see how models handle a genuine gap, not whether they can use a documented feature. After indexing was added, the same prompt was re-run.

## Pre-indexing results — 4 distinct approaches

### Gemini 3.1 Pro — removal pattern (no indexing needed)

```igni
unanswered = get_all_questions()
current = get_current(unanswered)
answer(choice):
  scores = scores + [correct]
  unanswered = without(unanswered, current)
```

**Strategy:** Avoid indexing entirely. Keep unanswered questions in a list, remove each after answering. Most creative solution — genuinely valid Igni, no invented syntax.

**Invented syntax:** None.

### Gemini 3 Flash — invented `questions[index]`

```igni
index = 0
current = questions[index]
check(user_answer):
  if index + 1 < length(questions):
    index = index + 1
  else:
    finished = true
```

**Strategy:** Use index-based access directly. Clean and natural, but `questions[index]` didn't exist in the spec.

**Invented syntax:** `questions[index]` — list indexing.

### ChatGPT 5.3 — confused workaround

```igni
current = find(questions, q => q is questions[index])
```

**Strategy:** Tried `find()` to access by index, but the predicate references the very syntax it's trying to avoid. Circular logic.

**Invented syntax:** `questions[index]` — buried inside a `find` predicate.

### Claude Opus 4.6 — manual index walk

```igni
current():
  return find(questions, q => index_of(q) is index)

index_of(target):
  i = 0
  each q in questions:
    if q is target:
      return i
    i = i + 1
  return -1
```

**Strategy:** Build `index_of()` helper and manual `each` loops with counters. Most verbose (~65 lines) but no invented syntax.

**Invented syntax:** None (function body is valid Igni, just painful).

## Pre-indexing comparison

| Model | Indexing approach | Invented syntax? | Lines | Would transpile? |
|---|---|---|---|---|
| Gemini Pro | Removal pattern (`without`) | No | ~45 | Likely (cleanest) |
| Gemini Flash | `questions[index]` directly | Yes | ~40 | No (before indexing) |
| ChatGPT | `questions[index]` in `find` predicate | Yes | ~35 | No |
| Claude | Manual `each` loop with counter | No | ~65 | Partially |

## The indexing signal

**2/4 models invented `questions[index]`.** Strongest gap signal in the project — the pattern "show item N from a list" is so fundamental that working around it produces convoluted code. **Decision:** Add `list[index]` to the spec. Zero-based, returns `null` on out-of-bounds.

## Post-indexing re-run — 4/4 zero-fix

| Model | Transpiles? | Fixes needed | Notable |
|---|---|---|---|
| Gemini Flash | Yes | 0 | String-based score tracking (`"check"`/`"close"`) |
| ChatGPT | Yes | 0 | Used `title:`, `current = questions[index]` local var |
| Gemini Pro | Yes | 0 | `questions[index] is not null` for end detection |
| Claude | Yes | 0 | `count_correct()` helper, `title:`, score on completion screen |

**4/4 zero-fix.** All four models use `questions[index]` naturally. Convergence returned to near-identical structure. Adding one feature eliminated four workaround patterns.

## Flutter vs Igni

~120 lines Flutter (across 3 files) → ~45 lines Igni (single file). ~2.7x reduction. Lower ratio than Dicee (4.3x) and Xylophone (4.5x) because Quizzler has more logic that both languages express similarly.

## Cumulative zero-fix data

| App | Models | Zero-fix |
|---|---|---|
| Contacts | 3 | 3/3 (after type hints) |
| Dicee | 4 | 4/4 |
| Xylophone | 4 | 4/4 (after empty-block fix) |
| Quizzler | 4 | 4/4 (after indexing) |
| **Total** | **15** | **15/15** |

## Key finding: divergence-as-signal

Before indexing: 4 distinct approaches. After indexing: near-identical code from all 4 models. Convergence correlates inversely with missing features — divergence IS the gap signal.
