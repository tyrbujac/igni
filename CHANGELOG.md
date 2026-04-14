# Changelog

Spec evolution, one entry per version. Each version is a frozen snapshot in `spec/`.

---

## v0.6.10 — 2026-04-14
*Documentation-only. "Bottom-anchored actions" pattern added to the layout section.*

- **Bottom-anchored actions pattern** — documented how to use existing `fill: true` on content sections so a CTA button naturally sits at the bottom of the screen (common mobile form layout). No new syntax. Motivation: BMI cold tests across v0.6.7 and v0.6.8 showed 4/4 models produced shrink-wrapped layouts with the CALCULATE button floating mid-screen, even though Igni already supported the correct pattern. Discoverability fix.
- Matching one-liner example added to the cheatsheet.

## v0.6.9 — 2026-04-14
*`round(value, places)` builtin for number formatting.*

- **`round(value, places)`** — returns a string with `value` rounded to `places` decimals. Standard rounding, works on int and double. `round(bmi, 1)` → `"21.5"`. Motivation: 4/4 cold-test models across v0.6.7 and v0.6.8 produced raw-float BMI displays because there was no way to format a computed float. Opus flagged the gap explicitly in both test runs. Smallest possible addition to close the strongest remaining signal after colour-as-variable. Non-breaking.
- Codegen maps to Dart's `toStringAsFixed()`. Two-line change.

## v0.6.8 — 2026-04-14
*Breaking: `body` slot renders exactly one widget. Caller wraps multi-child content explicitly.*

- **`body` is a single-widget slot** (not a container) — the implicit Column wrapper around caller content is gone. Callers passing multiple children must use `layout vertical:` or `layout horizontal:`. Motivation: the BMI cold test (v0.6.7) showed the implicit wrapper both hid layout decisions from the caller and produced runtime crashes when `body` sat inside a horizontal layout. Making the slot a literal hole aligns with the "zero magic" principle and fixes the crash by construction.
- Transpiler now emits a clear error when a wrapper receives 2+ children.
- Migrated `wrapper.igni` example to the new form.
- Same transpiler bug fixes folded into v0.6.8 from BMI cold test work: multi-param `navigate to`, dynamic icon-name runtime lookup, `if/else` at component body root, binary expression parenthesisation, wrapper components with 2+ positional args, screen-root `Expanded` unwrap, scoped `CrossAxisAlignment.stretch`.

## v0.6.7 — 2026-04-14
*Documentation-only. `print()` builtin, updated Running It section.*

- **`print()` builtin** for console debugging — `print(value)` logs to browser console. No new syntax; documents existing transpiler behaviour.
- **Running It section updated** — describes `igni run` behaviour (build output, hot reload on save, `print()` for debugging).

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

## v0.5.1 — 2026-04-12
*Documentation patch from v0.5 Shopping cold test. Last spec before the transpiler.*

- `find` identity warning with counter-example
- `spread: true` as canonical boolean form
- Wrapper component terminology cross-reference
- `count`-for-quantity idiom
- No-arg component invocation clarification

## v0.5 — 2026-04-11
*Closes the cross-screen state gap from the Notes test.*

- `shared:` block for cross-screen state
- Wrapper components with `body` slot
- List builtins: `replace`, `find`, `count`, `length`
- `is in` / `is not in` operators
- Input-debounce common-pitfall callout

## v0.4.1 — 2026-04-11
*Documentation patch from v0.4 acceptance tests.*

- Single-screen multi-view pattern (with caveats)
- Icon button example
- Functions-as-expressions
- `image round:` vs `layout rounded:` distinction
- No-cross-screen-function-calls rule

## v0.4 — 2026-04-11
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

## v0.3.2 — 2026-04-11
*Rename from Rocket to Igni. No language changes.*

## v0.3.1 — 2026-04-11
*Last version under the Rocket name.*

- Structurally-correct mutation example
- `icon` primitive
- Object literals
- No-interpolation rule
- Intrinsic-dimensions carve-out

## v0.3 — 2026-04-11
*First major expansion.*

- Async data (`fetch`)
- Mutations
- Screen-internal functions
- Lexical reactivity rule
- "Spec as budget" and "three commands to first pixel" principles

## v0.2 — 2026-04-11
*The original draft under the Rocket name.*
