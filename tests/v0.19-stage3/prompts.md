# v0.19 animation + snapshot — Stage 3 ship-validation

Post-implementation cold test against the v0.19 cheatsheet draft (`tests/v0.19-stage0/cheatsheet-draft.md`, post-Session-3 + post-cheatsheet-patches per docs/private/113 §Stage 0 outcome). Same three prompts as Stage 0 — *fixed where the Stage 0 prompts themselves over-promised v0.19's surface* — run against a 4-model panel (3 frontier + flash-lite noise tier) to confirm the cheatsheet teaches the post-implementation surface.

**Why pre-bump.** The v0.18.0 → v0.19.0 fork (version-bump skill) hasn't shipped yet. Stage 3 runs against the cheatsheet draft so any teaching-gap findings can land in the v0.19.0 ship rather than triggering an immediate v0.19.1 docs iteration. v0.19 already accumulated two synthesis-to-cheatsheet drift traps mid-implementation (`value_of()` ambiguity, `width: spring()` non-existent property); pre-bump Stage 3 is the third validation pass before the spec freezes.

**Pre-registered ship bar** (mirrors v0.18 Stage 3 shape):

- **Strong:** 4/4 P1 + 4/4 P2 reach for canonical syntax (`transition: <token>` on conditional render, `spring(value)` declarative on a value, `snapshot "<name>"`, `mock now:` / `freeze_time:` / `mock every: advance` test-scope verbs as taught). ≥3/4 P3 use `spring()` inside `each` correctly (label-consumed; row-keyed via `each item in <list>:` not over indices). Proceed to version bump.
- **Soft:** 3/4 on P1 or P2 — log as Tier-A patch for v0.19.0 ship (or v0.19.1 if post-bump).
- **Fail:** ≤2/4 P1 — re-examine cheatsheet teaching; possible v0.19.x design re-open.

Run with `--no-grade`. The transpiler now compiles all v0.19 surface end-to-end (122 → 124 fixtures all green; smoke 78 → 80 green); auto-grade against panel output would still introduce churn, so synthesise convergence manually per cycle standard.

Run via API runner:

```bash
cd tests/runner
npx tsx run.ts --model claude-opus-4-7 --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage3/prompts.md --out ../v0.19-stage3 --no-grade
npx tsx run.ts --model gpt-5.5 --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage3/prompts.md --out ../v0.19-stage3 --no-grade
npx tsx run.ts --model gemini-3.1-pro-preview --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage3/prompts.md --out ../v0.19-stage3 --no-grade
npx tsx run.ts --model gemini-3.1-flash-lite-preview --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage3/prompts.md --out ../v0.19-stage3 --no-grade
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. Cost target: ~$0.40–0.60 (4 models × 3 prompts; matches v0.18 Stage 3 budget).

---

## 1. Login screen with fade-between-states + a snapshot test

> Build a `Login` screen that swaps between three conditional states: a loading spinner while the user-record fetch is in-flight, a logged-in welcome panel when `user` resolves, and an error message when `user` errors. The swap between branches should fade. Then write a `Login.test.igni` that snapshots the loaded state.
>
> Constraints:
>
> - The fetch is `user = fetch("/api/user/me")` — re-fetched when `refresh` is reassigned.
> - Three branches via `if user is loading: … else if user is error: … else: …`.
> - The fade applies to the conditional swap (not to any individual value).
> - The test mocks the fetch to return a successful user record `{name: "Tyr", email: "tyr@example.com"}` and then snapshots the rendered tree.
>
> Write both `Login.igni` (the screen) and `Login.test.igni` (one test that asserts the loaded state via `snapshot "login_loaded"`). Use idiomatic Igni per the cheatsheet. If two equally-canonical shapes exist for any decision, pick one and explain briefly.

## 2. StepCounter with spring-animated display + a settle-after-advance test

> Build a `StepCounter` screen where the user taps a button to add 100 steps at a time, the displayed step count animates smoothly toward the target whenever the target changes, and the screen also shows how long ago the user last reset their counter. Then write a `StepCounter.test.igni` covering both the spring animation and the timestamp-derived UI.
>
> Constraints:
>
> - `target_steps` is the underlying integer state.
> - `displayed_steps` is the smoothly-animated value (use the value-animation primitive the cheatsheet teaches).
> - `last_reset_at` is a timestamp captured via `now()`. The screen displays "Last reset Xs ago" where X is the integer seconds since `last_reset_at`.
> - The button reads "Add 100" and increments `target_steps` by 100. A second button reads "Reset" and sets `target_steps = 0` and `last_reset_at = now()`.
>
> Write both `StepCounter.igni` (the screen) and `StepCounter.test.igni` (two tests):
>
> - **Test 1 (primary — spring assertion).** Renders the screen, taps "Add 100" once, advances test time by enough to settle the animation, and asserts that the displayed value equals `100`. Must use the test-clock advance verb the cheatsheet teaches; do not depend on wall-clock time.
> - **Test 2 (snapshot of timestamp-derived UI).** Renders the screen and produces a `snapshot "<name>"` of the loaded view. Because the screen reads `now()` for "Last reset Xs ago", your snapshot must be deterministic across runs — choose the right time-mock primitive from the cheatsheet to fix `now()` to a known value before rendering.

## 3. Notifications list with per-row spring + a snapshot before/after reorder

> Build a `Notifications` screen that displays a list of notifications, each with an animated per-row recency score. The list can be reordered by the user (newest first vs oldest first). Then write a `Notifications.test.igni` that snapshots the list, reorders it, and snapshots again — verifying that each row's spring tracks the row's identity, not its position in the list.
>
> Constraints:
>
> - `notifications` is a list of `{id, message, recency}` objects, where `recency` is a number from 0–1.
> - Each row renders the message + a per-row animated number for the recency score (use the spring shape the cheatsheet teaches for label-consumed values; v0.19 does not animate layout dimensions).
> - A toggle reorders the list (e.g. `if newest_first: notifications else: reversed(notifications)`).
> - The test renders the screen, snapshots the initial list as `"notifications_initial"`, flips the toggle, and snapshots again as `"notifications_reordered"`.
>
> Write both `Notifications.igni` and `Notifications.test.igni`. Pay attention to row identity — the snapshot of a reordered list should still capture each row's *target* `recency` correctly per the cheatsheet's spring-in-each rule. The cheatsheet describes whether snapshot capture is deterministic without explicit settling; follow what the cheatsheet teaches.
