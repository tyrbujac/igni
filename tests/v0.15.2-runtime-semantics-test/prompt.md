# v0.15.2 runtime-semantics prediction test — 14 questions

Asks a 4-model panel to predict what Igni does at runtime in 14 cases the
v0.15.0 meta-review panel (`tests/v0.15.0-meta-review/`, `docs/private/107`)
flagged as unspecified by the cheatsheet. Convergence (≥3/4 agree, with no
[GUESS] markers) → that's the implicit rule, write it down in the v0.15.2
runtime-semantics appendix. Convergent guesses → weaker signal; spec must
make an explicit choice. Disagreement → spec must adjudicate.

Method: cheatsheet-with-context (same as Stage 0 / Stage 3). `--no-grade`
(prose answers, nothing to transpile). `--spec spec/v0.15.0-cheatsheet.md`
auto-injects the canonical cheatsheet ahead of the prompt.

Skipped from this test (out of scope, separate work):
- Component event-payload binding (`emit` → `on X(name):`) — Option 2 syntax design
- Navigation push/replace/back-stack — already in tracked-open-questions
- emit payload serialization — coupled to event-payload syntax design

---

## 1. Igni runtime semantics — 14 prediction questions

> You have just read the v0.15.0 Igni cheatsheet (above). For each of the
> 14 questions below, predict what Igni does at runtime. Be **concise** —
> one short paragraph per answer, no extended reasoning chains.
>
> **Marking convention** (load-bearing for the synthesis step):
> - If the cheatsheet strongly implies an answer, just answer.
> - If you are guessing from "Igni philosophy," analogy to other languages, or general inference, prefix the answer with `[GUESS]`.
> - If you genuinely cannot predict from the cheatsheet alone, write `[CANNOT PREDICT]` and explain in one line why.
>
> Don't invent syntax. Don't write code. Predict behaviour.
>
> ---
>
> **1. Equality semantics.** Predict the result of each `is` comparison:
>    - `count is 0` (count is an int holding 0)
>    - `name is "Tyr"` (name is a string holding "Tyr")
>    - `items is []` (items is an empty list)
>    - `a is b` (a and b are objects literal-constructed with identical fields, e.g. `{name: "X", age: 1}` each)
>    - `product is in shared.cart` (product was returned from one fetch; shared.cart was populated from a different fetch with the same field values)
>
>    Also: in `if product is in cart and quantity > 1:`, what's the precedence — does `is in` bind tighter or looser than `and`?
>
> **2. Block scoping.** Is a variable declared inside an `if` block or `each` loop visible outside the block?
>
>    ```
>    each item in items:
>      total = item.price + item.tax
>    label total
>    ```
>
>    Does `label total` work? If yes, what's `total`? If no, what's the fix?
>
> **3. Init vs render boundary.** Top-level statements run once; rendering re-runs on reactivity. Where does Igni cut between them?
>
>    ```
>    screen Test:
>      x = 0
>      if x is 0:
>        y = 1
>      label y
>    ```
>
>    Does the `if` block run once at init, or every reactivity tick?
>
> **4. Null on chained access.** The cheatsheet says `items[index]` returns null when out of bounds. What about `items[bad_index].text` — crash, or null?
>
> **5. Iteration over non-lists.** Does `each c in "hello":` work (iterating characters)? Does `each i in 5:` work (iterating 0..4)? If neither, what's the canonical "do this N times" idiom?
>
> **6. Reactivity reach inside `every`.**
>
>    ```
>    screen Idle:
>      tick = 0
>      every 1s:
>        tick = now()
>      layout vertical:
>        label "Static"
>    ```
>
>    Nothing in the layout reads `tick`. Does the screen re-render every second?
>
> **7. Function reactivity inside `each`.**
>
>    ```
>    each item in items:
>      label total(item)
>    ```
>
>    Does `total(item)` re-evaluate for every item on every reactivity tick? Or once per item lifetime? Or some middle ground?
>
> **8. Component memoization in `each`.**
>
>    ```
>    each post in posts:
>      PostCard post
>    ```
>
>    When some unrelated reactive variable changes (and `posts` itself is unchanged), do all PostCards rebuild, or only the ones whose `post` actually changed? Is there diffing?
>
> **9. In-flight fetch on dependency change.**
>
>    ```
>    results = fetch("/search?q=" + trigger)
>    ```
>
>    The user clicks a "Search" button repeatedly, each click reassigning `trigger`. What happens to a previous fetch that was still in flight — cancelled, ignored on completion, or raced (last completion wins)?
>
> **10. fetch inside every with slow response.**
>
>    ```
>    every 30s:
>      weather = fetch(slow_api)
>    ```
>
>    The fetch takes 45s. When the next 30s tick fires, does it queue the new fetch, abort the old one, fire concurrently, or skip until the previous completes?
>
> **11. Numeric type after operations.** `now()` returns int seconds. `elapsed = now() - start` — what type is `elapsed`? The cheatsheet says `round(x, 1)` returns a *string* (for display). What does `if elapsed >= round(60, 1):` do — type error, coerce, false-always, true-always?
>
> **12. `bind:` on indexed/computed targets.** Is `slider bind: shared.volumes[0]` allowed (indexed access)? Is `slider bind: settings.volume` allowed (where `settings` is a local non-shared object)? What's the rule for which expressions can be a `bind:` target?
>
> **13. Shared namespace across files.** `auth.igni` declares `shared: user = null`. `cart.igni` declares `shared: user = "Tyr"`. What does the transpiler do — error at build time, last-write-wins, first-write-wins, merge, undefined?
>
> **14. fetch on non-JSON response.**
>
>    ```
>    health = fetch("/api/health")   # server returns plain text "OK"
>    ```
>
>    What's `health` — a string, a wrapped object, an error, undefined? What about a 204 (empty body)?
>
> ---
>
> **Format reminder:** numbered answers (1.–14.), one short paragraph each, mark `[GUESS]` or `[CANNOT PREDICT]` per the convention above. No code. No extended reasoning. Convergence-counting depends on this discipline.
