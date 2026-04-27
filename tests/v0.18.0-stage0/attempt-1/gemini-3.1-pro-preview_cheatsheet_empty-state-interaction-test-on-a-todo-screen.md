Here is the complete `Todo.test.igni` file. 

It tests the empty state, the add-item interaction, and a third test that verifies adding multiple sequential items works correctly (proving the list accumulates and the empty state text disappears).

```igni
# Todo.test.igni

test "shows empty state on initial render":
  render Todo
  expect seen "No tasks yet"

test "adds a new task and clears the input":
  render Todo
  change draft: "buy milk"
  tap "Add"
  
  # The list should now show the new task and hide the empty state
  expect seen "buy milk"
  expect not seen "No tasks yet"
  
  # The input should be cleared
  expect value_of(draft) is ""

test "adds multiple tasks sequentially":
  render Todo
  
  # Add first task
  change draft: "buy milk"
  tap "Add"
  
  # Add second task
  change draft: "walk the dog"
  tap "Add"
  
  # Both tasks should be rendered in the list
  expect seen "buy milk"
  expect seen "walk the dog"
```

### Why these tests work:
1. **Selectors are domain-specific:** We use `change draft: "buy milk"` because `draft` is the exact `bind:` variable name for the input. We use `tap "Add"` because that is the exact visible text on the button. 
2. **Built-in test assertions:** `seen "..."` instantly validates the render tree output without having to query individual layout nodes, and `not seen "..."` confirms the `else` block swapped out the empty state.
3. **`value_of()` for inputs:** `expect value_of(draft) is ""` specifically inspects the bound value of the input primitive to ensure the two-way binding caught the `draft = ""` state reset inside the `add()` function.