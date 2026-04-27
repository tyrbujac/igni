```igni
# Calculator.test.igni

test "total_with_tax calculates tax correctly":
  render Calculator
  expect total_with_tax(100, 0.2) is 120
  expect total_with_tax(50, 0) is 50
```

This uses the cleanest Igni testing path for a screen-internal function: `render Calculator` mounts the screen and makes its internal functions available in test scope, so the test can call `total_with_tax(...)` directly instead of indirectly asserting through rendered labels.