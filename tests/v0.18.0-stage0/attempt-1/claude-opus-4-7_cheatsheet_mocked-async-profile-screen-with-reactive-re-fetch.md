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

**Notes on the third test.** The `Profile` screen builds its fetch URL from the `refresh` counter — `"/api/user/me?refresh=" + refresh`. By the reactive re-fetch rule, reassigning `refresh` causes `fetch()` to re-fire with the new URL. So tapping "Refresh" (which runs `refresh = refresh + 1`) is observable as a *new* URL hitting the mock map. Asserting `requested("/api/user/me?refresh=1")` after the tap — and `request_count` being exactly 1 for each URL — proves both that the refresh wired through *and* that the original URL didn't re-fire spuriously. Both URLs are mocked up front because the mock map is consulted on every fetch, including reactive re-fires.