```igni
test "shows empty state on initial render":
  render Todo
  expect seen "No tasks yet"

test "adds typed item and clears draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect value_of(draft) is ""
  expect not seen "No tasks yet"

test "can add multiple items":
  render Todo
  change draft: "buy milk"
  tap "Add"
  change draft: "walk dog"
  tap "Add"
  expect seen "buy milk"
  expect seen "walk dog"
  expect value_of(draft) is ""
  expect not seen "No tasks yet"
```