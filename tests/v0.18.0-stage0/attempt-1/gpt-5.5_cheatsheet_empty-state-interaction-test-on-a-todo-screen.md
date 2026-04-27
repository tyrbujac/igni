```igni
test "shows empty state on initial render":
  render Todo
  expect seen "No tasks yet"

test "adds a task and clears the draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect not seen "No tasks yet"
  expect value_of(draft) is ""

test "can add multiple tasks":
  render Todo
  change draft: "buy milk"
  tap "Add"
  change draft: "walk dog"
  tap "Add"
  expect seen "buy milk"
  expect seen "walk dog"
  expect not seen "No tasks yet"
  expect value_of(draft) is ""
```