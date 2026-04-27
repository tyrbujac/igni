1. `count is 0` → true; `name is "Tyr"` → true; `items is []` → [GUESS] true (the cheatsheet uses `is empty` for empty-list checks, suggesting `is []` may not be the idiom, but structural equality on primitives plus `[]` being a literal probably works — actually the cheatsheet says structural for primitives, *reference* for lists, so likely **false**, use `is empty`); `a is b` for identical object literals → false (cheatsheet explicit); `product is in shared.cart` across separate fetches → false (reference equality on objects). Precedence: [GUESS] `is in` binds tighter than `and`, matching standard comparison-vs-logical precedence.

2. [GUESS] `total` is visible outside — Igni appears to use Python-style function-level scoping rather than block-level, since the cheatsheet shows `total = 0` before an `each` and reads it after. Value would be the last iteration's assignment. The cheatsheet's own `total_price()` example shows exactly this pattern working.

3. [GUESS] The cut is "top-level assignments run once; everything else re-runs." So `x = 0` runs once, but the `if x is 0:` and the `label y` are part of the rendering body and re-run each tick. This means `y` gets re-derived each render — which works here but would break if `x` could change to non-zero (y would be unbound). [CANNOT PREDICT] precisely whether bare `if` at screen top-level is "init" or "render" — the cheatsheet doesn't disambiguate `if` outside a `layout`.

4. [GUESS] Crash, or at minimum a runtime error. The cheatsheet specifies null on out-of-bounds indexing but doesn't extend null-safety to field access on null. Most languages this compiles to (Dart/Flutter) would throw on `null.text`.

5. [CANNOT PREDICT] for strings — the cheatsheet only shows `each` over lists. [GUESS] neither works; canonical "N times" idiom is likely iterating over a list, perhaps `each i in [0,1,2,3,4]:`. No `range()` builtin is documented.

6. [GUESS] No — the lexical-reactivity rule says re-render happens when a referenced variable is reassigned. If the layout doesn't read `tick`, reassigning `tick` shouldn't re-render the layout. The `every` block still fires; `tick` still updates; nothing visible changes.

7. [GUESS] `total(item)` re-evaluates on every reactivity tick that re-renders this screen, for every item. Components/functions aren't memoised (cheatsheet states this explicitly for components: "not memoised by argument"), and the same logic plausibly applies to function calls in render position.

8. [GUESS] All PostCards rebuild. Cheatsheet explicitly states "Components re-evaluate with their parent... not memoised by argument." No diffing mentioned. Flutter's element tree may diff under the hood, but at the Igni semantic level it's a full rebuild.

9. [CANNOT PREDICT] The cheatsheet describes reactive re-fetch but says nothing about cancellation or race semantics. [GUESS] last-completion-wins is the most likely Flutter-default behaviour, with no automatic cancellation.

10. [CANNOT PREDICT] Cheatsheet doesn't address overlapping `every` + async. [GUESS] the next tick fires regardless and a second fetch starts concurrently, with last-completion-wins on `weather`.

11. `elapsed` is int (int minus int). [GUESS] `round(60, 1)` returning a string would make `elapsed >= round(60, 1)` a type error or coerce-fail — comparing int to string. The cheatsheet's stopwatch example uses `tick - start_time` directly as a label without `round`, suggesting numeric subtraction stays numeric and `round` is purely a display formatter not meant for comparisons.

12. [GUESS] The cheatsheet shows `bind: shared.X` (single dot-access) works for slider/toggle/checkbox/dropdown. `settings.volume` on a local object: [CANNOT PREDICT] — the cheatsheet only documents `shared.X` and bare locals. Indexed `shared.volumes[0]`: [GUESS] rejected, since `bind:` parallels `input`'s requirement for stable identifiers and the documented forms are bare-name and single-dot only.

13. [CANNOT PREDICT] The cheatsheet shows `shared:` as a top-level block but doesn't address multi-file declarations of the same key. [GUESS] build-time error on duplicate declaration is most consistent with Igni's "one way to do everything" philosophy.

14. [CANNOT PREDICT] Cheatsheet only shows fetch returning objects with field access (`user.name`) and the `is loading`/`is error` states. Plain-text response and 204 behaviour aren't documented. [GUESS] non-JSON might collapse to `is error`; 204 might yield null or an empty-object success state.