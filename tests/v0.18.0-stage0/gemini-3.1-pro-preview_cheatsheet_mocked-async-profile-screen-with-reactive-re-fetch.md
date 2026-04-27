```igni
# Profile.test.igni

test "shows offline state when fetch fails":
  mock fetch:
    "/api/user/me?refresh=0": error "network timeout"
  
  render Profile
  
  expect seen "Couldn't load — try again"

test "shows user name and email on successful load":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada Lovelace", email: "ada@example.com"}
  
  render Profile
  
  expect seen "Ada Lovelace"
  expect seen "ada@example.com"

test "tapping Refresh increments counter and triggers a new fetch":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada Lovelace", email: "ada@example.com"}
    "/api/user/me?refresh=1": {name: "Ada Lovelace (Updated)", email: "ada.updated@example.com"}
  
  render Profile
  expect seen "Ada Lovelace"
  
  tap "Refresh"
  
  # Lexical reactivity: tapping refresh reassigns `refresh = 1`.
  # The fetch arguments change, causing a reactive re-fetch to the new URL.
  expect requested("/api/user/me?refresh=1")
  expect request_count("/api/user/me?refresh=1") is 1
  
  # The UI updates with the new response from the mock map
  expect seen "Ada Lovelace (Updated)"
  expect not seen "Ada Lovelace"
```