```igni
# Profile.test.igni — sibling to Profile.igni

test "shows offline state when fetch fails":
  mock fetch:
    "/api/user/me?refresh=0": error "network timeout"
  render Profile
  expect seen "Couldn't load — try again"

test "shows user name and email when fetch succeeds":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada Lovelace", email: "ada@example.com"}
  render Profile
  expect seen "Ada Lovelace"
  expect seen "ada@example.com"

test "tapping Refresh triggers a new fetch":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada Lovelace", email: "ada@example.com"}
    "/api/user/me?refresh=1": {name: "Ada Lovelace", email: "ada@example.com"}
  render Profile
  expect request_count("/api/user/me?refresh=0") is 1
  tap "Refresh"
  expect requested("/api/user/me?refresh=1")
  expect request_count("/api/user/me?refresh=1") is 1
```

A few notes on the design choices:

- **Initial URL.** `refresh = 0` at the top of `Profile` runs once on mount, so the first fetch URL is `"/api/user/me?refresh=0"` — the mock map keys must match exactly.
- **Refresh test asserts on URLs, not UI.** Tapping "Refresh" reassigns `refresh`, which the lexical-reactivity rule propagates into the `fetch()` URL, causing a re-fire to `?refresh=1`. The cleanest assertion is `requested(...)` / `request_count(...)` — it directly verifies the new fetch happened, rather than indirectly via rendered output (which looks the same in both responses).
- **Both URLs mocked.** The mock map is consulted on every fetch including reactive re-fires, so both `?refresh=0` and `?refresh=1` need entries — otherwise the second fetch would have no defined response.
- **`request_count` before and after.** Asserting count is `1` both before and after the tap pins down that exactly one fetch happened per URL — no accidental double-fires.