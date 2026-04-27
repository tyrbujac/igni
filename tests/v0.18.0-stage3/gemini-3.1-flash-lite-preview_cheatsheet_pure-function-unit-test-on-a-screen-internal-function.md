```igni
# Calculator.test.igni

test "total_with_tax calculates correctly":
  render Calculator
  expect total_with_tax(100, 0.2) is 120
  expect total_with_tax(50, 0) is 50
```

### Explanation
In Igni, the cleanest way to test a screen-internal function is by using `render` to mount the screen, which makes its functions available within the test scope. 

Per the specification, screen-internal functions are otherwise unreachable from tests. By rendering `Calculator`, we satisfy the test-scope requirement to unlock `total_with_tax`. Using a single `test` block with multiple `expect` assertions is the most idiomatic approach here, as it minimizes boilerplate while clearly documenting the expected outcomes for various function inputs.