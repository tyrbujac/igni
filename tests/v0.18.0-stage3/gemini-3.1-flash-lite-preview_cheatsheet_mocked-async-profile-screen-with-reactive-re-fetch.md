```igni
# Profile.test.igni

test "shows error state when fetch fails":
  mock fetch:
    "/api/user/me?refresh=0": error "network timeout"
  render Profile
  expect seen "Couldn't load — try again"

test "shows user info when fetch succeeds":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada Lovelace", email: "ada@example.com"}
  render Profile
  expect seen "Ada Lovelace"
  expect seen "ada@example.com"

test "tapping refresh triggers a new fetch":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada", email: "ada@ex.com"}
    "/api/user/me?refresh=1": {name: "Grace", email: "grace@ex.com"}
  
  render Profile
  expect seen "Ada"
  
  tap "Refresh"
  expect seen "Grace"
  expect request_count("/api/user/me?refresh=1") is 1
```