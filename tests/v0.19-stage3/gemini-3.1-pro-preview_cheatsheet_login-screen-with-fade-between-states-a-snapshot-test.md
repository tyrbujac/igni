Here is the implementation of the screen and its corresponding test, followed by brief explanations of the structural choices made per the Igni v0.19 spec.

### `Login.igni`

```igni
screen Login:
  refresh = 0
  user = fetch("/api/user/me?refresh=" + refresh)

  layout vertical, padding: large, gap: medium, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      label "Couldn't load — try again"
      button "Retry", on tap: refresh = refresh + 1
    else:
      label "Welcome, " + user.name, style: heading
      label user.email
```

### `Login.test.igni`

```igni
test "login fetch success renders and snapshots loaded state":
  mock fetch:
    "/api/user/me?refresh=0": {name: "Tyr", email: "tyr@example.com"}
  
  render Login
  
  expect seen "Welcome, Tyr"
  expect seen "tyr@example.com"
  
  snapshot "login_loaded"
```

### Design & Syntax Choices

1. **Reactive re-fetching:** The prompt requires the fetch to re-run when `refresh` is reassigned. Because Igni's lexical reactivity rule for `fetch()` requires the triggering variable to be in the *arguments* of the call, I appended `?refresh=" + refresh` to the URL. Reassigning `refresh` via the "Retry" button automatically re-runs the screen body, re-evaluates the URL string, and fires a fresh network request.
2. **Branch Identity over Nesting:** In the `else if` and `else` blocks, multiple primitives (like the label and the button) are returned as flat siblings rather than being wrapped in an additional `layout vertical:`. Because `transition: fade` keys by *branch identity* (rather than child type), returning flat siblings is entirely safe—the transition engine correctly groups and fades the entire branch output as one swap. This avoids unnecessary nesting levels and honors Igni's max-depth constraints. 
3. **Implicit Test Synchronization:** The test requires no `await` or `pumpAndSettle()` logic. Because the URL `"api/user/me?refresh=0"` maps instantly in the `mock fetch:` block, the `render Login` command resolves the `user` binding sequentially. By the time `snapshot "login_loaded"` executes, the target state is deterministically reached.