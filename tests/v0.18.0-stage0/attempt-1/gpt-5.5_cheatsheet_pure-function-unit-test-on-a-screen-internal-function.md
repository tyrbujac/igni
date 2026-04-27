```igni
# Calculator.test.igni

test "total_with_tax adds VAT":
  render Calculator
  expect total_with_tax(100, 0.2) is 120

test "total_with_tax handles zero tax":
  render Calculator
  expect total_with_tax(50, 0) is 50
```

Because `total_with_tax` is defined inside `Calculator`, the cleanest test is to `render Calculator` first, then assert the screen-internal function directly. Testing via the rendered label would only cover the hardcoded `100, 0.2` case and would not let us check multiple inputs as clearly.