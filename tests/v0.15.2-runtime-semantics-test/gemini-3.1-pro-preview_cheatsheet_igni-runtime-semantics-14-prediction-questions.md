**1.** `[GUESS]` `count is 0` and `name is "Tyr"` evaluate to true because primitives use structural equality. `items is []`, `a is b`, and the separate-fetch `product is in shared.cart` all evaluate to false because lists and objects use reference equality (expressly noted in the cheatsheet). Regarding precedence, `is in` likely binds tighter than `and` following standard boolean logic precedence, though the cheatsheet does not explicitly detail operator precedence beyond arithmetic.

**2.** `[CANNOT PREDICT]` The cheatsheet does not explicitly define lexical block scoping rules or variable hoisting for `if` and `each` blocks, though the `total_price()` example deliberately declares `total = 0` outside the loop before modifying it, implying standard block scoping might prevent outer access if it were declared inside.

**3.** The `if` block runs every reactivity tick. The cheatsheet explicitly states that top-level assignments run once at initialization, while "the rendering part (layouts, labels, conditionals)" re-runs completely with current values on every re-evaluation.

**4.** `[GUESS]` It likely crashes or throws a runtime error. While the cheatsheet specifies that out-of-bounds indexing returns `null`, it does not mention optional chaining (`?.`) or safe null-propagation for field access (`null.text`), which in most UI languages results in a null reference exception.

**5.** `[CANNOT PREDICT]` The cheatsheet strictly specifies `each item in items:` for list iteration but does not mention string iteration, numeric range generation, or provide a canonical "do this N times" construct.

**6.** `[GUESS]` The screen re-renders every second. The cheatsheet states that "reassigning state inside the block triggers the lexical-reactivity rule and re-renders the screen," which implies that the reassignment of `tick` forces a full screen re-evaluation regardless of whether the rendering layout nodes actually consume that specific variable.

**7.** The function `total(item)` re-evaluates for every item on every reactivity tick. The cheatsheet explicitly states that re-evaluation "re-runs the rendering part," which includes fully evaluating function calls inside layouts and `each` loops, rather than memoizing them per item.

**8.** All `PostCard` components rebuild. The cheatsheet explicitly states that "components are not memoised by argument," so whenever the parent screen re-evaluates due to an unrelated reactive variable change, every component in the `each` loop re-runs regardless of whether its specific `post` argument changed.

**9.** `[CANNOT PREDICT]` The cheatsheet states that a `fetch()` call re-runs when its dependency variables are reassigned, but it does not specify the concurrency model or network behaviour for in-flight requests (e.g., whether they are cancelled, ignored, or subject to race conditions).

**10.** `[CANNOT PREDICT]` The cheatsheet explains the timing and lifecycle of `every` blocks but does not document how long-running async operations like `fetch()` behave when their network execution time exceeds the block's designated tick interval.

**11.** `[GUESS]` It will likely result in a parse or type error. The cheatsheet notes that `round()` converts a number to a string for display, and specifies that `>`, `<`, `>=`, `<=` are strictly for "numeric ordering", strongly implying that comparing an integer to a string using a numeric operator is invalid in Igni's inferred-type system.

**12.** `[GUESS]` `bind: settings.volume` is likely allowed as object dot-access appears standard, but `bind: shared.volumes[0]` is likely rejected. The cheatsheet specifies that list elements cannot be mutated in place and that indexing is rejected at the base for object mutations (`with`), suggesting reactive bindings similarly require a direct variable or stable field path rather than computed indexed targets.

**13.** `[CANNOT PREDICT]` The cheatsheet introduces `shared:` blocks for cross-screen state but does not detail project-wide resolution rules (e.g., merging, collision errors, or initialization order) when multiple files declare the same variable inside their top-level namespaces.

**14.** `[CANNOT PREDICT]` The cheatsheet demonstrates `fetch()` resolving to a mapped object for structured data, but it does not document how the language parses, surfaces, or wraps non-JSON responses like plain text strings or empty 204 bodies.