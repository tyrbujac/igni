Here is the `Login.igni` screen and its corresponding `Login.test.igni` test file.

### Login.igni

```igni
screen Login:
  # The fetch is reactive; re-assigning refresh triggers a re-fetch
  refresh = 0
  user = fetch("/api/user/me" + refresh)

  layout vertical, padding: large, gap: medium, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      label "Couldn't load — try again"
      button "Retry", on tap: refresh = refresh + 1
    else:
      label "Welcome, " + user.name, style: heading
      label user.email, style: body

  # Explicitly using a refresh trigger variable ensures we don't 
  # accidentally trigger a re-fetch on every keystroke (if this were an input).
```

**Design choices:**
*   **Re-fetch mechanism:** I used a `refresh` integer counter as a cache-buster/trigger. Even though this example doesn't have an input, this is the canonical Igni pattern to avoid implicit dependencies.
*   **Conditional layout:** I placed `transition: fade` on the parent `layout`. This ensures that whenever the `if/else` logic resolves to a different branch (e.g., transitioning from `loading` to `else`), the entire view fades as it swaps branches.

---

### Login.test.igni

```igni
# Login.test.igni

test "login form renders welcome state successfully":
  # 1. Mock the specific fetch call we expect
  mock fetch:
    "/api/user/me0": {name: "Tyr", email: "tyr@example.com"}

  # 2. Render the screen
  render Login

  # 3. Assert current screen identity and content
  expect on Login
  expect seen "Welcome, Tyr"
  
  # 4. Snapshot the state for golden comparison
  snapshot "login_loaded"
```

**Design choices:**
*   **Mock URL:** Since the screen appends `refresh` (initially `0`), the fetch request matches `"/api/user/me0"`.
*   **Test-scope `snapshot`:** I used the snapshot feature as requested. This will create a `login_loaded.txt` file (or similar, depending on toolchain naming) in the `__snapshots__/` directory, ensuring that the rendered structure matches the expected output.
*   **Sequence:** The `render` call is placed after the `mock` call, ensuring that the initial screen evaluation catches the mocked response immediately.