# Changelog

Spec evolution, one entry per version. Each version is a frozen snapshot in `spec/`.

---

## v0.6.6 — 2026-04-13
*Full spec reorganised into learning order. Background images.*

- **Full spec reorganised** to match cheatsheet learning order: hello world → screens → display → variables → interaction → events → layout → state → conditionals → lists → functions → components → navigation → shared state → async → reference
- Design principles moved to end as "Rules (reference)" section
- Built-in primitives split into "Showing Things" (display) and "Interactive Things" (input)
- **Background images** on layouts and screens (`background: "photo.png"`). Extends `background:` property — colour names unquoted, image filenames quoted. 4/4 Destini cold-test models attempted image backdrops.
- Cheatsheet updated with background image support

## v0.6.5 — 2026-04-13
*Five documentation clarifications from 4-model spec review, plus list indexing from Quizzler cold test.*

- `fill: true` is layout-only (not primitives)
- Multiple events on one element (`on tap:` + `on touch:` coexist)
- `card` clarified as background token, not a general colour
- `fill: true` siblings split equally
- Property applicability table
- List indexing (`items[0]`, `questions[index]`) — zero-based, null on out-of-bounds

## v0.6.4 — 2026-04-13
*Ten additions from rebuilding Angela Yu's Dicee and Xylophone Flutter projects.*

- Screen properties (`title:`, `background:`)
- `fill: true` on layouts (expand to fill remaining space)
- Extended colour names (`red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`)
- `background:` on screens and layouts
- Local image assets (`image "photo.png"` from `images/` folder)
- Type hints transpiler-supported (`name: Type = value`)
- `play("file.wav")` audio builtin with `audio/` folder convention
- Empty layout blocks (background + events, no children)
- `on touch:` event (fires on finger contact, vs `on tap:` on release)

## v0.6.3 — 2026-04-12
*Driven by first end-to-end cold-LLM test (Contacts app, 3 models) + human tutorial testing.*

- `toggle label:` — fix primitives table inconsistency (3/3 models wrote it, spec example already used it)
- `map(list, item => expr)` builtin — replaces verbose `each` rebuild pattern (3/3 model reviews)
- `contains` is case-insensitive — matches user expectations for search
- Float literals (`price = 9.99`) — surfaced by non-programmer tutorial testing
- `random(min, max)` — utility builtin for random integers

## v0.6.2 — 2026-04-12
*Documentation patch.*

- No language changes from v0.6.1
- Cheatsheet companion added

## v0.6.1 — 2026-04-12
*Developer experience additions from building a calculator.*

- Implicit vertical layout — screen/component bodies stack vertically by default
- Comparison operators (`>`, `<`, `>=`, `<=`)

## v0.6 — 2026-04-12
*First post-transpiler spec. Designed from building real apps.*

- Lambda expressions (`item => item.done`) for list builtins
- `filter`, `sorted`, `reversed` builtins
- `return` in functions
- `contains()` string builtin
- `and`/`or` boolean operators

## v0.5.1 — 2025
*Documentation patch from v0.5 Shopping cold test. Last spec before the transpiler.*

- `find` identity warning with counter-example
- `spread: true` as canonical boolean form
- Wrapper component terminology cross-reference
- `count`-for-quantity idiom
- No-arg component invocation clarification

## v0.5 — 2025
*Closes the cross-screen state gap from the Notes test.*

- `shared:` block for cross-screen state
- Wrapper components with `body` slot
- List builtins: `replace`, `find`, `count`, `length`
- `is in` / `is not in` operators
- Input-debounce common-pitfall callout

## v0.4.1 — 2025
*Documentation patch from v0.4 acceptance tests.*

- Single-screen multi-view pattern (with caveats)
- Icon button example
- Functions-as-expressions
- `image round:` vs `layout rounded:` distinction
- No-cross-screen-function-calls rule

## v0.4 — 2025
*First spec drafted from cold-LLM test data (Calculator, Todo, Weather).*

- Arithmetic operators (`+`, `-`, `*`, `/`)
- `is X` for arbitrary equality
- `null`
- `+` for lists, `without` for removal
- `each` in non-rendering contexts
- Functional list updates
- Comments (`#`)
- Cross-component function calls
- Reactive re-fetch example

## v0.3.2 — 2025
*Rename from Rocket to Igni. No language changes.*

## v0.3.1 — 2025
*Last version under the Rocket name.*

- Structurally-correct mutation example
- `icon` primitive
- Object literals
- No-interpolation rule
- Intrinsic-dimensions carve-out

## v0.3 — 2025
*First major expansion.*

- Async data (`fetch`)
- Mutations
- Screen-internal functions
- Lexical reactivity rule
- "Spec as budget" and "three commands to first pixel" principles

## v0.2 — 2025
*The original draft under the Rocket name.*
