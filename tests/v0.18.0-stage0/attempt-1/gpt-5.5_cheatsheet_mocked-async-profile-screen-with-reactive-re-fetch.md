```igni
# Profile.test.igni

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
    "/api/user/me?refresh=1": {name: "Grace Hopper", email: "grace@example.com"}
  render Profile
  expect request_count("/api/user/me?refresh=0") is 1
  tap "Refresh"
  expect request_count("/api/user/me?refresh=1") is 1
  expect seen "Grace Hopper"
  expect seen "grace@example.com"
```