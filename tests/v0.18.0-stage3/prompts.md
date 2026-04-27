# v0.18 testing infrastructure — Stage 3 ship-validation

Post-implementation cold test against the *shipped* v0.18.0 cheatsheet (`spec/v0.18.0-cheatsheet.md`). Same three prompts as Stage 0 but run against the production-canon document, with a 4-model panel (3 frontier + flash-lite noise tier) instead of Stage 0's 3-model panel.

**Pre-registered ship bar** (per cycle defaults):

- **Strong:** 4/4 P1 + 4/4 P2 reach for the canonical syntax (`test "name":`, `render <Screen>`, event-sims, `expect <bool>`); ≥3/4 P3 use `mock fetch:` block-form correctly without inventing matcher API or snapshot syntax (which is split to v0.19).
- **Soft:** 3/4 P1+P2 — log as Tier-A patch for next docs-only iteration.
- **Fail:** ≤2/4 P1 — re-examine cheatsheet teaching in a v0.18.x patch cycle.

Run with `--no-grade`. The transpiler now compiles this surface end-to-end (verified via flutter test on three smoke fixtures); however auto-grade against production codegen on novel test fixtures from a panel run would still introduce churn — synthesise convergence manually as is the cycle's standard.

Run via API runner: `npx tsx run.ts --model <id> --spec ../../spec/v0.18.0-cheatsheet.md --prompts ../v0.18.0-stage3/prompts.md --out ../v0.18.0-stage3 --no-grade`.

---

## 1. Pure-function unit test on a screen-internal function

> Given this `Calculator` screen, write tests for the `total_with_tax` function.
>
> ```igni
> screen Calculator:
>   total_with_tax(subtotal, rate):
>     return subtotal + subtotal * rate
>
>   layout vertical, padding: large, gap: medium:
>     label "VAT Calculator", style: heading
>     label total_with_tax(100, 0.2)
> ```
>
> The tests should assert the function output for at least two inputs:
> - `total_with_tax(100, 0.2)` returns `120`
> - `total_with_tax(50, 0)` returns `50`
>
> Write the contents of `Calculator.test.igni`. Use idiomatic Igni testing syntax per the cheatsheet. If the language gives you multiple ways to test a screen-internal function, pick the cleanest and explain why briefly.

## 2. Empty state + interaction test on a Todo screen

> Given this `Todo` screen, write tests that exercise both its empty state and its add-item interaction.
>
> ```igni
> screen Todo:
>   items = []
>   draft = ""
>
>   add():
>     items = items + [{text: draft}]
>     draft = ""
>
>   layout vertical, padding: large, gap: medium:
>     label "Todo", style: heading
>     input bind: draft, placeholder: "New task"
>     button "Add", on tap: add()
>     if items is empty:
>       label "No tasks yet"
>     else:
>       each item in items:
>         label item.text
> ```
>
> Write the contents of `Todo.test.igni`. Include at minimum:
>
> - A test that asserts the empty state shows "No tasks yet" on initial render.
> - A test that types "buy milk" into the input, taps "Add", and asserts that "buy milk" appears in the rendered list and the draft input is cleared.
>
> Add a third test of your choice that you'd write to gain confidence in this screen.

## 3. Mocked async profile screen with reactive re-fetch

> Given this `Profile` screen that fetches user data and supports a manual refresh, write tests covering its async states.
>
> ```igni
> screen Profile:
>   refresh = 0
>   user = fetch("/api/user/me?refresh=" + refresh)
>
>   layout vertical, padding: large, gap: medium:
>     if user is loading:
>       spinner
>     else if user is error:
>       label "Couldn't load — try again"
>     else:
>       label user.name, style: heading
>       label user.email, style: caption
>     button "Refresh", on tap: refresh = refresh + 1
> ```
>
> Write the contents of `Profile.test.igni`. Include at minimum:
>
> - A test that asserts the offline state ("Couldn't load — try again") when the fetch fails.
> - A test that asserts the loaded state shows the user's name and email when the fetch returns valid data.
>
> Add a third test of your choice — for example, verifying that tapping "Refresh" triggers a new fetch (consider what to assert and how).
