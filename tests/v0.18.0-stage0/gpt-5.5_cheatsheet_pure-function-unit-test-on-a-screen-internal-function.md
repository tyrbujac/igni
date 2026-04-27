```igni
test "total_with_tax calculates VAT cases":
  render Calculator
  expect total_with_tax(100, 0.2) is 120
  expect total_with_tax(50, 0) is 50
```

I’d use a single test with one `render Calculator` because `render` is the idiomatic test-scope override that makes the screen-internal `total_with_tax` function callable. Since both assertions exercise the same pure helper, rendering once and checking multiple inputs is the cleanest, least repetitive shape.