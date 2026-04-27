# Calculator.test.igni

```igni
test "total_with_tax adds VAT to subtotal":
  render Calculator
  expect total_with_tax(100, 0.2) is 120

test "total_with_tax with zero rate returns subtotal unchanged":
  render Calculator
  expect total_with_tax(50, 0) is 50
```

## Why this shape

The cheatsheet shows two viable approaches for testing a screen-internal function, and one is clearly cleaner:

**Direct function calls via `render` (chosen).** `render Calculator` mounts the screen and — per the documented test-scope override — puts `total_with_tax` in scope so the test can call it directly. The assertions read as plain math: `expect total_with_tax(100, 0.2) is 120`. Inputs and expected outputs sit on one line each; failure messages will pinpoint the exact case.

**UI-mediated assertions via `seen` (rejected).** I could have rendered the screen and asserted `expect seen "120"` against the hardcoded `label total_with_tax(100, 0.2)` in the layout. But that only covers the one input baked into the screen body, couples the test to the label's rendering, and gives no path to the second case (`total_with_tax(50, 0)`) without modifying production code. It tests the wrong thing — the label, not the function.

The cheatsheet explicitly endorses the chosen pattern ("You can render once and assert on the function across many inputs"), and it scales: adding more cases is one more `expect` line, no extra renders, no UI fixtures.

I considered consolidating both assertions under a single `render` + two `expect` lines (as the cheatsheet's `format_currency` example does). I kept them as two named `test` blocks because the names document the intent of each case — "adds VAT" vs. "zero rate is identity" — which is more valuable than saving one `render` line.