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

The cheatsheet gives exactly one way to test a screen-internal function in v0.18: `render <Screen>` to put the screen's functions in test scope, then call the function directly inside `expect`. The relevant guarantees:

> **Function reachability — `render <Screen>` puts the screen's internal functions in test scope.** [...] Without a prior `render`, calling a screen-internal function from a test body is a parse-time error.

So `render Calculator` is required — it's not decorative, it's what unlocks `total_with_tax` for the test body.

A few alternatives the cheatsheet rules out (or makes worse):

- **Asserting via rendered output** (`expect seen "120"`) would test the label, not the function. It also couples the test to display formatting decisions in the layout. The direct-call form tests the function's contract, which is what the prompt asks for.
- **One test with two `expect`s** is shown as legitimate in the `format_currency` example, but splitting into two named tests gives each input case its own failure message ("zero rate" vs "adds VAT"), which is the bigger payoff for two lines of duplication.
- **No `render`** — parse-time error, per the rule above.

The single canonical assertion form is `expect <bool-expression>`, and `is` is structural equality for primitives (`120 is 120` is true), so `expect total_with_tax(100, 0.2) is 120` is the idiomatic shape.