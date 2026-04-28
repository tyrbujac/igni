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

## Notes on the canonical-shape choices

**Why `"/api/user/me?r=" + refresh` instead of a bare `"/api/user/me"`.** The cheatsheet says `fetch()` re-fires when any variable in its arguments is reassigned. To get a reactive re-fetch on a Retry tap, *something* the fetch reads has to change. Concatenating a `refresh` counter into the URL is the documented shape — `refresh = refresh + 1` reassigns the variable, the URL string changes, the fetch re-runs. The alternative (mutating an unrelated trigger variable that the fetch doesn't reference) wouldn't actually re-fire the fetch.

**Why the mock URL is `"/api/user/me?r=0"` (with the query string).** The mock map is consulted by exact URL match. Initial render has `refresh = 0`, so the fetch goes to `"/api/user/me?r=0"` — that's what the mock has to key on. If the test exercised Retry, it would also need `"/api/user/me?r=1"` in the mock map.

**Why `transition: fade` lives on the outer `layout`, not on the branches.** `transition:` animates the swap of the immediate dynamic child set on the container it's attached to. The `if`/`else if`/`else` resolves to one of three immediate children of that outer layout, so the fade lives there. Putting it on a branch would error — the cheatsheet's compiler-rejection rule is explicit that `transition:` requires a changing child set, not a changing value.

**Why one snapshot instead of `expect seen "..."` plus snapshot.** Either alone would pass; both is the belt-and-braces shape the cheatsheet's snapshot section endorses — `seen` documents the human-readable invariant in the test source, and `snapshot` captures the full tree (padding, gap, transition state, structure) that string matches miss.