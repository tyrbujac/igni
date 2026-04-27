Here is the complete `Profile.test.igni` file. 

In Igni, the `mock fetch:` block captures exactly what URLs the reactive UI generates, and test-scope builtins like `seen` and `requested()` compose natively with the `expect` statement.

```igni
# Profile.test.igni

test "shows offline state when fetch fails":
  mock fetch:
    "/api/user/me?refresh=0": error "network timeout"
  render Profile
  expect seen "Couldn't load — try again"

test "loads user data and shows name and email":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada Lovelace", email: "ada@example.com"}
  render Profile
  expect seen "Ada Lovelace"
  expect seen "ada@example.com"

test "tapping Refresh increments counter and triggers new network request":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Initial Data", email: "old@example.com"}
    "/api/user/me?refresh=1": {name: "Refreshed Data", email: "new@example.com"}
  
  render Profile
  expect seen "Initial Data"
  
  tap "Refresh"
  
  # Assert the specific new URL was requested via the reactive re-fire
  expect requested("/api/user/me?refresh=1")
  
  # Assert the UI updated with the new mock response
  expect seen "Refreshed Data"
```

### Why this works:
1. **Initial URL resolution**: Because `refresh` starts at `0`, the initial fetch URL is exactly `"/api/user/me?refresh=0"`. We mock this explicitly in every test.
2. **Reactivity under test**: In the third test, `tap "Refresh"` increments the local `refresh` variable to `1`. Following Igni's lexical-reactivity rule, this immediately re-evaluates the `user = fetch(...)` line with the new URL, hitting the second entry in our `mock fetch:` block.
3. **Built-in Assertions**: We don't need to manually await or inspect mock instances. We just assert the end state (`expect seen "Refreshed Data"`) or query the test engine directly (`expect requested(...)`).