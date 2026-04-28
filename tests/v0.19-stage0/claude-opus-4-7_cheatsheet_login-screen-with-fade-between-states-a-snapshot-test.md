# Login.igni

```igni
screen Login:
  refresh = 0
  user = fetch("/api/user/me?r=" + refresh)

  layout vertical, padding: large, gap: medium, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      layout vertical, gap: medium, align: center:
        label "Couldn't load — try again"
        button "Retry", color: brand, on tap: refresh = refresh + 1
    else:
      layout vertical, gap: medium:
        label "Welcome, " + user.name, style: heading
        label user.email, style: caption
```

# Login.test.igni

```igni
test "Login renders the loaded user panel":
  mock fetch:
    "/api/user/me?r=0": {name: "Tyr", email: "tyr@example.com"}
  render Login
  expect seen "Welcome, Tyr"
  snapshot "login_loaded"
```

# Notes on the canonical-shape choices

**1. How to trigger reactive re-fetch.** Two shapes exist:

- (a) Bake the trigger into the URL: `fetch("/api/user/me?r=" + refresh)`.
- (b) Use a separate trigger variable read elsewhere and rely on it.

I picked (a). The cheatsheet's rule is that a `fetch()` re-fires when *any variable in its arguments* is reassigned — so the trigger has to appear in the URL, `method:`, or `body:` to actually re-fire. Appending a cache-buster query param is the source-visible way to do that for a `GET`. The mock map keys on the exact URL, which is why the test mocks `"/api/user/me?r=0"` (the initial render's URL) rather than the bare path.

**2. Where `transition: fade` goes.** On the outer `layout vertical`, whose immediate child set changes when `if`/`else if`/`else` resolves to a different branch. Per the compiler-rejection rule in §Animation, `transition:` is only valid where the dynamic child set changes — putting it on a `label` whose text reassigns would error out and point at `spring()`. Here, the swap *is* a child replacement, so `transition: fade` is the right primitive.

**3. Error branch as a wrapped layout, not a bare `label`.** The error branch wraps the message and retry button in `layout vertical` so that `refresh` actually has a way to be reassigned — without a retry affordance, the reactive re-fetch machinery is dead code. This also keeps each branch as a single top-level child of the transitioning parent, which is what `transition: fade` keys on.

**4. Test asserts content *and* snapshots.** `expect seen "Welcome, Tyr"` is a fast, readable sanity check that the loaded branch rendered; `snapshot "login_loaded"` captures the structural tree (layout chrome, transition state, branch identity) so future regressions in padding/gap/transition are caught too. The cheatsheet's snapshot section explicitly notes that visible strings alone aren't enough — the chrome matters — so pairing the two is idiomatic rather than redundant.

**5. No `freeze_time:` needed.** Nothing in this screen reads `now()`, so the snapshot is already deterministic. `freeze_time:` would be required if the loaded branch rendered a relative timestamp.