1. **Equality semantics.** `count is 0` is true; `name is "Tyr"` is true; `items is []` is **false** because list equality is by reference; `a is b` is **false** for the same reason. In `is in`, `is in` behaves as a single operator (membership), so it binds tightly, but the logic behaves as `(item is in list) and (quantity > 1)`. `[GUESS]` The `is in` operator likely evaluates the membership first as a whole block.

2. **Block scoping.** The variable `total` will be visible in the `label` because Igni's lexical scoping is flat within the screen/function body. `[GUESS]` However, if `items` is empty, `total` will be undefined at the time `label` renders, likely causing a runtime error or null-rendering; the fix is to define `total = 0` at the top of the screen body.

3. **Init vs render boundary.** The `if` block is part of the rendering logic. Therefore, it runs on every reactivity tick. The assignment `y = 1` occurs during the re-evaluation of the screen body, and `label y` will correctly access that reassigned value.

4. **Null on chained access.** `items[bad_index].text` returns `null` without crashing. Igni's property access chains are designed to be safe; if any link in the chain (like the index or the object property) resolves to null, the entire expression evaluates to null.

5. **Iteration over non-lists.** Neither `each c in "string"` nor `each i in 5` is supported. `[GUESS]` The canonical idiom for "do this N times" is to pre-generate a list of length N using a helper function or to filter a range if a `range()` primitive existed (which it doesn't). You must manually construct a list in a `screen` init block to iterate over it.

6. **Reactivity reach inside `every`.** The screen does **not** re-render every second. Igni's lexical reactivity only triggers a re-render if a variable referenced in the *rendering* layout is reassigned. Since `tick` is never used in the `layout` block, the assignment inside `every` updates the variable in memory but does not force a UI update.

7. **Function reactivity inside `each`.** `total(item)` re-evaluates on every reactivity tick. Because the screen body re-runs from the top upon any variable reassignment, any function called within the rendering tree is re-executed to ensure the UI reflects the most current state of the variables it references.

8. **Component memoization in `each`.** All `PostCard` components rebuild whenever the parent screen re-evaluates. Igni does not perform differential rendering or memoization; it follows a "re-evaluate the whole tree" model whenever reactive state changes.

9. **In-flight fetch on dependency change.** [CANNOT PREDICT] The cheatsheet does not specify the cancellation policy for in-flight `fetch` requests when the reactive dependency triggers a new one.

10. **fetch inside every with slow response.** [CANNOT PREDICT] It is unclear if `fetch` requests initiated by `every` are queued, abandoned, or run concurrently; the spec does not define the execution context for overlapping asynchronous operations.

11. **Numeric type after operations.** `elapsed` is an `int`. The comparison `elapsed >= round(60, 1)` will trigger a type error. `round` returns a `string`, and Igni requires explicit boolean logic; it does not implicitly coerce strings to numbers for comparison operators.

12. **bind: on indexed/computed targets.** `bind:` requires a direct variable reference (`bind: my_var`) and does not support indexed access (`bind: list[0]`) or property access on non-shared objects. `[GUESS]` These are rejected at parse time because the binding must map to a stable, single-identifier reference to perform the automatic two-way reassignment.

13. **Shared namespace across files.** [CANNOT PREDICT] The interaction between `shared` variables across multiple files is not defined in the cheatsheet, leaving the resolution strategy (merge vs. collision error) unspecified.

14. **fetch on non-JSON response.** [GUESS] If the response is not valid JSON, `health` will likely resolve to an `error` state (or `null`), as `fetch` is designed to handle API-like data; plain text might not be coerced into a usable variable type, and 204s would likely result in `null` or an empty object.