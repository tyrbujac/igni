# v0.12 Stage 0 scope audit — `count()` predicate form

Cold tests against v0.11.2. Paste the full spec FIRST, then paste the prompt BELOW it. Fresh conversation, no prior context.

**Hypothesis under test — Stage 0 (scope):**

The v0.7.1 Alert Dashboard round showed 4/4 friction on `count(list, target)` when counting object-shaped list elements by a field value (`count alerts whose level is "critical"`). 1/4 (Gemini Flash) invented `count(list, predicate)`; 3/4 worked around with `length(filter(...))` or visible self-correction. Both v0.7.0 and v0.7.1 used the same Alert Dashboard prompt — same domain.

**Question:** is the friction *general* (any object-list + field-based count → hits the identity trap) or *Alert-Dashboard-specific* (enum-on-flat-object edge case)?

**Method:** two structurally different prompts that each naturally invoke count-by-field on a different domain. Neither mentions `count()` explicitly — the prompt shape forces the pattern; the model picks the idiom.

**Prediction:**

- **General:** 3-4/4 frontier hit the same friction on both prompts (invent predicate form OR reach for `length(filter(...))` with visible friction OR explicitly flag).
- **Domain-specific:** ≤2/4 hit friction on these prompts. Alert Dashboard's enum-on-flat-object shape is the edge, not the rule.

**Ship implications:**

- General → Shape A or B in `docs/private/65_v012_count_predicate.md` becomes justified.
- Domain-specific → close design note 65, file a one-line cheatsheet note on the Alert Dashboard edge case, move on.

**Pass bar:** 6/8 friction occurrences across 4 models × 2 prompts = general. ≤4/8 = domain-specific. 5/8 = rerun or expand.

---

## 1. Shopping Cart Tag Summary

> Using only the Igni language spec above, write a shopping-cart summary screen in Igni.
>
> **Screen:**
> - Title: "Cart"
> - A list of cart items (start with 5 hardcoded items inside the screen body — no fetch needed). Each item has a `name` (string), a `price` (number), and a `tag` string which is one of `"new"`, `"sale"`, or `"regular"`.
> - At the top of the screen, show a tag-summary line: "X new, Y on sale, Z regular" where X/Y/Z are the item counts per tag.
> - Below the summary, render each item as a row showing `name` on the left and `£price` on the right.
> - Use a reusable `CartRow` component for the rows.
>
> Show the complete Igni code first, then briefly explain any design decisions.

**What to grade:**

- **How does the model compute X/Y/Z?** Options: (a) `count(items, predicate)` — invented, matches Gemini Flash v0.7.1 shape; (b) `length(filter(items, predicate))` — spec-legal workaround; (c) `count(items, "new")` — wrong-but-compiles (identity match on object vs string, returns 0); (d) explicit inline `each` + counter accumulator; (e) honest refusal / flag.
- **Commentary.** Does the model name the friction (e.g. "the spec's `count` is identity-based so I can't use it for field-matching")? Explicit acknowledgement is a friction signal.
- **Silent wrong code.** Option (c) above is the dangerous case — code compiles, runs, displays "0 new, 0 on sale, 0 regular" regardless of the data. Record how many models shipped it unnoticed.
- **Transpile result.** Auto-graded by the runner. Note whether the output transpiles independent of semantic correctness.

---

## 2. Task List Priority Summary

> Using only the Igni language spec above, write a task-tracker screen in Igni.
>
> **Screen:**
> - Title: "Tasks"
> - A list of tasks (start with 6 hardcoded tasks inside the screen body — no fetch needed). Each task has a `name` (string), a `done` (boolean), and a `priority` which is one of `"high"`, `"medium"`, or `"low"`.
> - At the top of the screen, show a priority-breakdown line: "A high priority, B medium, C low" where A/B/C are the counts of tasks at each priority level (count all tasks, done or not).
> - Below the summary, render each task as a row with a checkbox (bound to `done`) and the task name.
>
> Show the complete Igni code first, then briefly explain any design decisions.

**What to grade:** same criteria as prompt 1 — how is the count-by-field expressed, does the model flag the friction, does the output silently produce wrong counts.

---

## Notes for the grader

- Neither prompt mentions `count()` by name. The model's idiom choice is the signal.
- Both prompts share Alert Dashboard's structural shape (object list + string enum field + summary counts), but differ in domain, naming, and secondary requirements. If friction is the same on both, it's the shape that drives it, not the Alert Dashboard prompt specifically.
- Transpiler grading is provided automatically by the runner. Manual grading focuses on the count-expression shape.
- Expected spend: ~8 API calls (4 models × 2 prompts) ≈ $0.15–0.30 depending on output length and whether thinking is enabled.
