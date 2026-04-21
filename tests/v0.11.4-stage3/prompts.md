# v0.11.4 Stage 3 validation — `count()` predicate Shape B adoption

Cold tests against v0.11.4. Paste the full cheatsheet FIRST, then the prompt BELOW it. Fresh conversation, no prior context.

**Hypothesis under test — Stage 3 (behavioural adoption):**

Did the v0.11.3 → v0.11.4 docs-only patch land? v0.12 Stage 0 showed 7/7 successful calls hitting the `count()` identity-trap friction against v0.11.2 cheatsheet, 3/7 producing silently-wrong runtime output via invented `count(list, lambda)` shapes. v0.11.3 added a *Counting by field* callout; v0.11.4 sharpened the callout and the line-260 inline comment per a 4-model ship review (`docs/private/66_v113_ship_review.md`). This round measures behaviour against v0.11.4.

**Pre-registered (locked 2026-04-21 in `docs/private/65_v012_count_predicate.md`, before v0.11.4 shipped):**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.4`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.11.4-cheatsheet.md`.
- **Pass bar (Shape B holds):** 0 silently-wrong inventions of `count(list, lambda)` across the 8 calls. Any workaround shape counts as success — `length(filter(...))`, explicit `each` accumulator, honest-no, helper function.
- **Fail bar (escalate to Shape A — polymorphic `count`):** 1+ invention.

---

## 1. Alert Dashboard (v0.7.1 verbatim rerun — direct A/B vs pre-v0.11.3 baseline)

> Using only the Igni language spec above, write an Alert Dashboard app in Igni — a single-screen app that shows a list of alerts, each with a severity-coloured badge and text.
>
> **Screen:**
> - Title: "ALERTS"
> - A list of alerts (start with 5 hardcoded alerts inside the screen body — no fetch needed). Each alert has a `level` (`"critical"`, `"warning"`, or `"info"`) and a `message` string.
> - For each alert, render an `AlertRow` component that shows:
>   - A coloured badge on the left showing the level in uppercase ("CRITICAL", "WARNING", "INFO")
>   - The message text to the right of the badge
> - The badge colour is determined by the level: critical → danger, warning → orange, info → green.
> - At the top of the screen, show a summary line: "X critical, Y warnings, Z info" where X/Y/Z are the counts.
> - The summary line's own text colour should match the highest-severity level present (danger if any critical, orange else if any warning, green otherwise).
>
> **Requirements:**
> - Use a reusable `AlertRow` component.
> - The component should receive the alert's colour as an argument, not recompute it internally.
> - Use a screen-level function to compute the colour from a level.
>
> Show the complete Igni code first, then briefly explain any design decisions you made.

**What to grade (Stage 3 focus — count-expression shape only):**

- Does the model express X/Y/Z using `length(filter(...))`, or does it invent `count(list, lambda)` / broken `count(filter(...), <sentinel>)`?
- Any commentary about the identity-trap friction (reading the v0.11.4 callout)?
- Is the output semantically correct at runtime?
- Transpile auto-graded by the runner.

---

## 2. Task-list scalar count (pinned 2026-04-21 in `docs/private/65`)

> Write an Igni Tasks screen that shows a list of tasks (each with a `name`, `done` boolean, and `priority` string — one of `"high"`, `"medium"`, `"low"`). At the top of the screen, display a single label: `X high-priority tasks` — where X is the count of tasks whose `priority` is `"high"`. Below, render each task as a row with a checkbox (bound to `done`) and the task name. Start with 6 hardcoded tasks. Show the complete Igni code first, then briefly explain any design decisions.

**What to grade:** same criteria as prompt 1. Scalar-count framing stresses the operation without a summary breakdown to cushion the idiom choice.

---

## Notes for the grader

- Neither prompt mentions `count` by name. Idiom choice is the signal.
- Pre-registration is strict: 0 inventions = pass; 1+ = fail. Result is binary.
- Commentary quoting the callout verbatim is strong evidence the patch is being read.
- Transpile pass is *necessary but not sufficient*: a broken `count(items, lambda)` transpiles cleanly today and produces silently-wrong counts at runtime. Grade the runtime semantics, not just the transpile flag.
