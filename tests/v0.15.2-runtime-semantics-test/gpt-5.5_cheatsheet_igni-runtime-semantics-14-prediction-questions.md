1. `count is 0` is true; `name is "Tyr"` is true; `items is []` is false because lists compare by reference; `a is b` is false because separately-built objects compare by reference; `product is in shared.cart` is false if the matching cart item came from a different fetch and is only field-equal. `[GUESS]` `is in` binds tighter than `and`, so it reads as `(product is in cart) and (quantity > 1)`.

2. `[GUESS]` A variable first assigned inside an `if` or `each` block is not safely available outside it. `label total` should not work as written; initialize `total` before the loop, then update it inside the loop.

3. `[CANNOT PREDICT]` The cheatsheet says top-level assignments run once and conditionals are part of rendering, but it does not precisely define the init/render boundary for a top-level `if` that contains assignments.

4. `[CANNOT PREDICT]` The cheatsheet only says out-of-bounds indexing returns `null`; it does not say whether field access on `null` propagates `null` or errors.

5. `each` is described as list iteration, so `"hello"` and `5` are not valid iterable values from the cheatsheet. The canonical shape is to model the repeated things as a list and iterate that; there is no stated range/character iteration primitive.

6. Yes. Reassigning `tick` inside `every 1s:` triggers the normal reactivity rule and re-renders the screen, even though the visible layout does not read `tick`; the UI just appears unchanged.

7. `total(item)` is called as part of rendering. When the parent screen re-evaluates, the `each` block runs again and the label expression is recomputed for each rendered item; it is not cached for the item’s lifetime.

8. All `PostCard` component bodies re-run when the parent re-evaluates. The cheatsheet explicitly says components are not memoised by argument; no Igni-level “only changed post rebuilds” behavior is specified.

9. `[CANNOT PREDICT]` The cheatsheet says dependency changes cause a reactive re-fetch, but it does not specify cancellation, stale-result ignoring, or race/last-completion behavior for in-flight requests.

10. `[CANNOT PREDICT]` The cheatsheet does not define overlap policy for slow async work started from an `every` block, so queue/abort/concurrent/skip behavior is unspecified.

11. `elapsed = now() - start` is numeric, effectively an integer seconds value. `round(60, 1)` returns a string, and numeric comparisons are only specified for numeric ordering, so comparing `elapsed >= round(60, 1)` should be a type error rather than coercing.

12. `[GUESS]` `slider bind: shared.volumes[0]` is not allowed, because indexed/computed targets are not described as writable bind targets. `slider bind: settings.volume` is also likely not allowed for a local object field; the supported targets appear to be a plain local variable, or direct `shared.X` for slider/toggle/checkbox/dropdown.

13. `[CANNOT PREDICT]` The cheatsheet defines `shared:` but does not specify duplicate shared names across files or merge/conflict rules.

14. `[CANNOT PREDICT]` The cheatsheet does not state how `fetch()` parses non-JSON/plain-text responses or empty `204` responses.