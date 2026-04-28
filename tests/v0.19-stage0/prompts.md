# v0.19 animation + snapshot — Stage 0 cold-test

Pre-implementation cold test for the v0.19 animation + snapshot bundle (design note `docs/private/113_v019_animation_snapshot.md`, post-Stage-2 + Tyr-ratified 2026-04-28). Cheatsheet draft (`cheatsheet-draft.md`) injected as `--spec`. Stage 0 framework adapted per doc 112 §Framework-shaped: each prompt provides a screen and asks the panel to write source that uses the new primitives, including tests.

The 8 post-Stage-2 patches are inlined into the cheatsheet draft so the panel sees the locked semantics: Q1 split (`transition:` for swaps, `spring()` for values), Q2 `spring(value)` declarative, Q3 text-tree-only snapshot, Q4 `mock now:` / `freeze_time:` bundle, Q5 token-only `transition:`, Q3-tighten compiler rejection, Q4a row-keying inside `each`, Q4b advance-moves-both-clocks, Q4c snapshot-captures-target, Q4d `AnimatedSwitcher` interrupt, Q5-serializer scope, Q2-a11y reduced-motion, Q6 ambient-vs-block scoping.

**Pre-registered ship bar (mirror v0.18 shape):**

- **Strong:** 3/3 P1 + 3/3 P2 reach for the canonical syntax — `transition: <token>` on conditional render (P1), `spring(value)` declarative on a value (P2 Test 1, primary), `snapshot "<name>"` / `mock every: advance` test-scope verbs as taught. ≥2/3 P3 use spring inside `each` correctly (row-keyed; `snapshot` of the list captures target values, not intermediate frames). P2 Test 2 (`mock now:` / `freeze_time:` for `now()`-derived snapshot) is **secondary signal** — convergence informs the time-mock teaching strength but does not gate Strong; spring is the higher-stakes question per Tyr 2026-04-28 caveat.
- **Soft:** 2/3 P1 + P2 Test 1 — patch the cheatsheet draft (the teaching needs to be sharper), re-run.
- **Fail:** ≤1/3 P1 — design wrong, reopen Q1 / Q2 / Q3 sub-decisions in doc 113.

Run with `--no-grade`. v0.19 transpiler hasn't shipped yet; auto-grade would falsely fail every output.

Run via API runner:

```bash
cd tests/runner
npx tsx run.ts --model claude-opus-4-7 --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage0/prompts.md --out ../v0.19-stage0 --no-grade
npx tsx run.ts --model gpt-5.5 --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage0/prompts.md --out ../v0.19-stage0 --no-grade
npx tsx run.ts --model gemini-3.1-pro-preview --spec ../v0.19-stage0/cheatsheet-draft.md --prompts ../v0.19-stage0/prompts.md --out ../v0.19-stage0 --no-grade
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. Cost target: ~$0.40 (3 models × 3 prompts; matches v0.18 Stage 0 cost of ~$0.35 attempt-1).

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
> - **Test 1 (primary — spring assertion).** Renders the screen, taps "Add 100" once, advances test time by enough to settle the animation, and asserts that the displayed value equals `100`. Must use the test-clock advance verb the cheatsheet teaches; do not depend on wall-clock time. If you reach for a snapshot here, capture the settled state.
> - **Test 2 (snapshot of timestamp-derived UI).** Renders the screen and produces a `snapshot "<name>"` of the loaded view. Because the screen reads `now()` for "Last reset Xs ago", your snapshot must be deterministic across runs — choose the right time-mock primitive from the cheatsheet to fix `now()` to a known value before rendering.

## 3. Notifications list with per-row spring + a snapshot before/after reorder

> Build a `Notifications` screen that displays a list of notifications, each with an animated progress bar showing how recent the notification is. The list can be reordered by the user (newest first vs oldest first). Then write a `Notifications.test.igni` that snapshots the list, reorders it, and snapshots again — verifying that each row's spring tracks the row's identity, not its position in the list.
>
> Constraints:
>
> - `notifications` is a list of `{id, message, recency}` objects, where `recency` is a number from 0–1.
> - Each row renders a label + a layout whose `width` (or some visible dimension) is bound to `spring(item.recency)` — the per-row spring.
> - A toggle reorders the list (e.g. `if newest_first: notifications else: reverse(notifications)`).
> - The test renders the screen, snapshots the initial list as `"notifications_initial"`, flips the toggle, advances enough time to settle any spring transitions, and snapshots again as `"notifications_reordered"`.
>
> Write both `Notifications.igni` and `Notifications.test.igni`. Pay attention to row identity — the snapshot of a reordered list should still capture each row's *target* `recency` correctly per the cheatsheet's spring-in-each rule.
