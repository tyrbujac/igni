```igni
# Profile.test.igni — sibling to Profile.igni

test "shows offline state when fetch fails":
  mock fetch:
    "/api/user/me?refresh=0": error "network timeout"
  render Profile
  expect seen "Couldn't load — try again"

test "loaded state shows the user's name and email":
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

A few notes on the third test:

- The `refresh` variable is concatenated into the fetch URL, so the lexical-reactivity rule re-fires `fetch()` with a *different* URL (`refresh=1`) after the tap. That makes the new fetch observable as a distinct entry in the mock map — no need to assert "fetch fired again on the same URL," which would be ambiguous.
- Both URLs are mocked so the post-tap state stays in the loaded branch (otherwise the screen would flip to `is loading` or `is error` and the assertion target would shift).
- `request_count(...) is 1` on the initial URL guards against the re-fire accidentally re-hitting `refresh=0`; `requested(...)` on the new URL confirms the tap drove the URL change end-to-end.