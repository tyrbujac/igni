Here is the test file for the `Todo` screen. 

```igni
# Todo.test.igni

test "shows empty state on initial render":
  render Todo
  expect seen "No tasks yet"
  expect items is empty
  expect value_of(draft) is ""

test "adding a task shows it in the list and clears input":
  render Todo
  
  # Type into the input using its `bind:` variable as the selector
  change draft: "buy milk"
  tap "Add"
  
  # Assert the UI updated correctly
  expect seen "buy milk"
  expect not seen "No tasks yet"
  
  # Assert the draft state and input field reset
  expect value_of(draft) is ""

test "adding multiple tasks appends them sequentially":
  render Todo
  
  # Add first task
  change draft: "buy milk"
  tap "Add"
  
  # Add second task
  change draft: "walk the dog"
  tap "Add"
  
  # Assert both tasks appear and the length of the list state is 2
  expect seen "buy milk"
  expect seen "walk the dog"
  expect length(items) is 2
```

### Why the third test?
I added **"adding multiple tasks appends them sequentially"**. 

While the second test proves that the *transition* from an empty state to a populated list works, the third test gives us confidence in the `each` loop and list mutation (`items = items + [...]`). It ensures that adding a subsequent item doesn't overwrite the first one, and that multiple items successfully render to the screen at the same time.