Here is the `Calculator.test.igni` file:

```igni
test "total_with_tax calculates correct totals across varying rates":
  render Calculator
  expect total_with_tax(100, 0.2) is 120
  expect total_with_tax(50, 0) is 50
```

### Why this approach?

Igni enforces that screen-internal functions are totally invisible outside their screen. You **must** use `render Calculator` to unlock `total_with_tax` into the test scope; otherwise, it's a parse-time error. 

Because `total_with_tax` is a pure mathematical function that doesn't depend on or mutate any screen state, the cleanest approach is to `render` the screen once and group all the functional edge-case assertions (`expect ... is ...`) into a single test block. This avoids the boilerplate of spinning up a separate `test` and `render` block for every single arithmetic permutation.