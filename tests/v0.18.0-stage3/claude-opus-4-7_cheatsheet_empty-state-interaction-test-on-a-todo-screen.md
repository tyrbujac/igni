```igni
# Todo.test.igni — sibling to Todo.igni

test "empty state shows placeholder on initial render":
  render Todo
  expect seen "No tasks yet"
  expect items is empty
  expect value_of(draft) is ""

test "adding a task renders it and clears the draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect not seen "No tasks yet"
  expect value_of(draft) is ""
  expect items.length is 1

test "adding multiple tasks preserves order and accumulates":
  render Todo
  change draft: "buy milk"
  tap "Add"
  change draft: "walk dog"
  tap "Add"
  change draft: "write tests"
  tap "Add"
  expect seen "buy milk"
  expect seen "walk dog"
  expect seen "write tests"
  expect items.length is 3
  expect items[0].text is "buy milk"
  expect items[2].text is "write tests"
  expect value_of(draft) is ""
```

The third test guards against two regressions that the first two miss: (1) `add()` mutating `items` correctly across repeated calls (the single-add test would still pass if `add` overwrote instead of appended), and (2) order preservation in the rendered `each` loop. Indexing into `items` after the taps confirms the list shape directly, complementing the `seen` content assertions.