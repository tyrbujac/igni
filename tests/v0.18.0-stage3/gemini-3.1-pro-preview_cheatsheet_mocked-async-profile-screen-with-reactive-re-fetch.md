Here is the complete `Profile.test.igni` file, demonstrating how to mock the reactive fetch states, assert on the rendered text, and verify reactive re-fetches driven by user interaction.

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
  expect not seen "Couldn't load"

test "tapping Refresh triggers a new reactive fetch":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Ada", email: "ada@example.com"}
    "/api/user/me?refresh=1": {name: "Ada Lovelace", email: "ada@example.com"}
  
  render Profile
  
  # Verify the initial fetch happened
  expect requested("/api/user/me?refresh=0")
  expect seen "Ada"
  
  # Trigger the on tap: refresh = refresh + 1 handler
  tap "Refresh"
  
  # The fetch() arguments changed, so it automatically re-fires and hits the mock map again
  expect requested("/api/user/me?refresh=1")
  expect seen "Ada Lovelace"
```

### Why this works:
1. **Source-visible mocking:** `mock fetch:` overrides the async response at the top of the test body, making the async UI instantly deterministic without waiting.
2. **Plain-text assertions:** `expect seen "text"` automatically scans the rendered output. We don't need to select individual labels or check component trees.
3. **Reactive test execution:** In the third test, `tap "Refresh"` increments the `refresh` variable. Because the `fetch()` URL references `refresh`, Igni's standard lexical-reactivity rule kicks in, automatically re-evaluating the fetch against the mock map and re-rendering the layout. The test requires zero manual `await` or `pump()` calls to resolve the new state.