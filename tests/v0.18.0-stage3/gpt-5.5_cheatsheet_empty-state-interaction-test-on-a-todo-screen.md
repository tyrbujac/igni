```igni
test "empty state is shown on initial render":
  render Todo
  expect seen "No tasks yet"

test "adding an item renders it and clears the draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect not seen "No tasks yet"
  expect value_of(draft) is ""

test "adding multiple items keeps existing todos":
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