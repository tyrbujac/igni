Based on the Igni v0.18.0 specification, here is the `Todo.test.igni` file:

```igni
# Todo.test.igni

test "shows 'No tasks yet' on initial load":
  render Todo
  expect seen "No tasks yet"
  expect value_of(draft) is ""

test "adding an item updates the list and clears the draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect value_of(draft) is ""
  expect not seen "No tasks yet"

test "adding multiple items maintains order":
  render Todo
  change draft: "Task 1"
  tap "Add"
  change draft: "Task 2"
  tap "Add"
  expect seen "Task 1"
  expect seen "Task 2"
  # Asserting that the list contains both entries
  expect items.length is 2
```

### Explanation of the choices:
*   **Initial State:** Uses `expect seen` to verify the conditional rendering logic for the empty list state.
*   **Interaction:** Uses `change` to simulate typing (which updates the `bind:` variable `draft`) and `tap` to trigger the `add()` function. Verification checks both the rendered UI (`seen`) and the internal state via `value_of`.
*   **Order/Multi-item Confidence:** The third test ensures that `items` is correctly accumulating new tasks rather than overwriting existing ones, providing confidence that the `items = items + [...]` logic is functioning as intended across multiple interactions.