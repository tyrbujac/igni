```igni
# Calculator.test.igni

test "total_with_tax calculates correct amounts":
  expect total_with_tax(100, 0.2) is 120
  expect total_with_tax(50, 0) is 50
```

### Why this approach?

Igni provides two ways to test functionality inside a screen:
1. **Through the UI:** Call `render Calculator` and assert on the output (`expect seen 120`).
2. **Pure-function direct calls:** Skip `render` entirely and call the function directly, as shown above.

For `total_with_tax`, **the pure-function approach is the cleanest (and only viable) choice**. 

Because the `Calculator` layout hardcodes the `100, 0.2` invocation on its label without exposing input fields, you cannot trigger the `(50, 0)` case via UI event-simulation (`change` / `tap`). Testing the function directly bypasses the layout entirely, allowing you to pass arbitrary parameters to verify its internal logic without needing to mock inputs or alter the production UI code.