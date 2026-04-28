Here is the implementation of the screen and its companion test. 

### `Login.igni`

```igni
screen Login:
  refresh = 0
  user = fetch("/api/user/me?refresh=" + refresh)

  layout vertical, padding: large, align: center, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      layout vertical, gap: medium, align: center:
        label "Couldn't load — try again"
        button "Retry", on tap: refresh = refresh + 1
    else:
      layout vertical, gap: medium, align: center:
        label "Welcome, " + user.name, style: heading
        label user.email
```

### `Login.test.igni`

```igni
test "loads user data and snapshots loaded state":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Tyr", email: "tyr@example.com"}
  render Login
  snapshot "login_loaded"
```

---

### Design Decisions & Explanations

1. **Re-fetching via URL concatenation:** To make `user` re-fetch when `refresh` is reassigned, the `fetch()` call *must* read the `refresh` variable in its arguments (per the lexical-reactivity rule). Appending it as a query parameter (`"?refresh=" + refresh`) is the canonical shape for forcing a GET request to re-evaluate without making it a POST request with a `body:`. When the "Retry" button taps, `refresh` increments, the screen re-evaluates, and the new URL triggers a new fetch.
2. **Placement of `transition: fade`:** The `transition:` modifier is placed on the parent `layout vertical` that *directly* contains the `if / else if / else` block. This satisfies the compiler rule that transitions only animate dynamic child replacement. Using `spring()` here would be a parse-time error because we are swapping structural branches, not interpolating a continuous value.
3. **Mocking the exact URL:** Because the `fetch` in production evaluates to `"/api/user/me?refresh=0"` on the initial render, the `mock fetch:` block inside the test must match that exact string.
4. **No assertions before the snapshot:** We omit an `expect seen "Welcome, Tyr"` before the snapshot because `snapshot` acts as the holistic structural assertion. Once the deterministic `mock fetch` resolves the user, `render Login` reaches the loaded branch in the same test tick, so the snapshot captures the correctly resolved UI tree immediately.