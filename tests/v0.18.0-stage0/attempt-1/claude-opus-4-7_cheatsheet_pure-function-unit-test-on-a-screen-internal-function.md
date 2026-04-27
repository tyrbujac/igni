# Calculator.test.igni

```igni
test "total_with_tax adds 20% VAT to subtotal":
  render Calculator
  expect total_with_tax(100, 0.2) is 120

test "total_with_tax with zero rate returns subtotal unchanged":
  render Calculator
  expect total_with_tax(50, 0) is 50
```

## Why this shape

The cheatsheet explicitly addresses this case under *Function reachability*: `render <Screen>` is the documented test-scope override that puts a screen's internal functions in scope, allowing direct calls like `total_with_tax(100, 0.2)` from the test body.

The alternative would be to test the function *indirectly* through the rendered UI — e.g. `expect seen "120"` after `render Calculator`, since the layout calls `label total_with_tax(100, 0.2)`. That works for the first case but is the wrong tool here because:

1. **It conflates two concerns.** A `seen "120"` assertion fails if the function is wrong *or* if the label rendering changes (formatting, currency symbol, layout swap). Direct function calls isolate the arithmetic.
2. **It doesn't scale to the second case.** `total_with_tax(50, 0)` isn't rendered by the screen at all — there's no hardcoded `label total_with_tax(50, 0)` to assert against. You'd have to add UI just to test the function, which inverts the dependency.
3. **The cheatsheet shows this exact pattern.** The `render Calculator` + direct-call form is the documented idiom for unit-testing screen-internal pure functions; `seen` is for rendered-output content matching.

`render Calculator` runs once per test (cheap — no network, no timers), unlocks the function in test scope, and `expect <bool-expression>` with `is` does the rest. No matchers, no mocks needed.