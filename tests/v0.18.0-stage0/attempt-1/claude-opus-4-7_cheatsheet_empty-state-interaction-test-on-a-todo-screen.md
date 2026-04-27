```igni
# Todo.test.igni — sibling to Todo.igni

test "empty state shows placeholder on initial render":
  render Todo
  expect seen "No tasks yet"
  expect not seen "buy milk"

test "adding an item renders it and clears the draft":
  render Todo
  change draft: "buy milk"
  tap "Add"
  expect seen "buy milk"
  expect not seen "No tasks yet"
  expect value_of(draft) is ""

test "adding multiple items renders all of them in order":
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
  expect value_of(draft) is ""
```

**Notes on the third test.** I went with multi-add because it's the cheapest test that catches the most plausible regressions in this screen:

- The `add()` function uses `items + [{text: draft}]` (correct append) rather than `[{text: draft}] + items` (prepend) or `[{text: draft}]` (overwrite) — multiple adds catches all three.
- It confirms the `each item in items:` loop renders every entry, not just the first or last.
- It re-confirms that `draft` clears on each add, not just the first one (a stateful bug where `draft = ""` only fires once would slip past the two-test minimum).

Tests I deliberately did *not* write:
- **"Add with empty draft does nothing"** — the current screen has no such guard; it would happily add `{text: ""}`. Writing that test would assert behaviour the source doesn't implement, which is a spec-bug, not a regression test.
- **A snapshot of the rendered tree** — `snapshot` is deferred to v0.19 per the spec.