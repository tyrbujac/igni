```igni
# Todo.test.igni — sibling to Todo.igni

test "empty state shows placeholder on initial render":
  render Todo
  expect seen "No tasks yet"
  expect items is empty
  expect value_of(draft) is ""

test "adding an item renders it and clears the draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect not seen "No tasks yet"
  expect value_of(draft) is ""
  expect items.length is 1

test "adding multiple items preserves order and accumulates":
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

The third test guards against three classes of regression at once: (1) an off-by-one or overwrite bug in `items + [{text: draft}]` (e.g. accidentally replacing instead of appending), (2) order inversion (`[new] + items` vs `items + [new]` — easy to flip during a refactor), and (3) the draft-clear behaviour holding across repeated adds rather than only on the first one. Indexing into `items` directly asserts the shape of state, while the `seen` checks confirm the `each` loop renders every entry — both layers matter because either could silently break without the other noticing.