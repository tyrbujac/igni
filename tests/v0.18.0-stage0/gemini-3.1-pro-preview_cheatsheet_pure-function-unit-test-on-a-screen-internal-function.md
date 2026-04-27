Here is the `Calculator.test.igni` file:

```igni
# Calculator.test.igni

test "total_with_tax calculates correct final amounts":
  render Calculator
  
  expect total_with_tax(100, 0.2) is 120
  expect total_with_tax(50, 0) is 50
```

### Why this approach?

Igni has **one way** to test screen-internal functions: you must call `render <Screen>` first to unlock the function in test scope. 

While you *could* split this into two separate `test` blocks, grouping them into a single test is the cleanest and most idiomatic choice here. Because `total_with_tax` is a pure function that doesn't depend on mutating screen state, you can invoke the "render once, assert many" pattern. This skips redundant mounting overhead and keeps related input/output checks logically grouped together.