Here is the complete `Todo.test.igni` file. 

It covers the empty state, the add-item interaction, and a third test verifying that sequentially adding multiple tasks accumulates them in the list (exercising the `items = items + [...]` array-append logic).

```igni
# Todo.test.igni

test "initial render shows empty state":
  render Todo
  expect seen "No tasks yet"
  expect items is empty

test "adding a task updates the list and clears the input":
  render Todo
  
  # 'draft' is the bound variable of the input, so it acts as the selector
  change draft: "buy milk"
  tap "Add"
  
  expect seen "buy milk"
  expect not seen "No tasks yet"
  
  # Assert on the UI primitive's bound state
  expect value_of(draft) is ""

test "adding multiple tasks accumulates in the list":
  render Todo
  
  # First task
  change draft: "buy milk"
  tap "Add"
  
  # Second task
  change draft: "walk the dog"
  tap "Add"
  
  # Both should be rendered
  expect seen "buy milk"
  expect seen "walk the dog"
  
  # render puts screen variables in test scope, so we can assert on state directly
  expect items.length is 2
```

### Why these tests work in Igni:
* **Selectors:** In Igni, you don't need arbitrary `testID`s. `change` targets the input via its `bind: draft` variable, and `tap` targets the button via its visible label `"Add"`.
* **State access:** Because `render Todo` runs in the test body, the screen's internal variables (`items`, `draft`) are directly exposed in test scope. This allows you to mix visual assertions (`expect seen "buy milk"`) with direct state assertions (`expect items.length is 2` or `expect items is empty`).
* **Builtins:** `value_of(draft)` is a test-scope builtin that lets you easily verify that the input's current bound value has reset to an empty string.