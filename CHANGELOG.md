# Changelog

Spec evolution, one entry per version. Each version is a frozen snapshot in `spec/`.

---

## Unreleased
*Non-spec additions.*

- **Micro reference** — `spec/v0.8.0-micro.md`, ~650 words, syntax-only third context tier below the full spec (~9,700 words) and cheatsheet (~1,780 words). Not a spec version; same language as v0.8.0. Lets cold tests vary context size as an independent variable.

---

## v0.10.0 — 2026-04-17
*Object update syntax — `{target with field: newval}` replaces the field-enumeration idiom.*

- **`{BASE with KEY: VALUE, ...}`** builds a new object with all of BASE's fields plus the overrides. The canonical "update one field on an object in a list" idiom is now `items = replace(items, target, {target with done: not target.done})` instead of enumerating every field by hand. Motivation: the pattern appeared in every mutation example in the repo (`transpiler/examples/contacts.igni`, `shopping.igni`, the spec's toggle/save examples) and v0.7.0 ship reviews flagged it as boilerplate. Design note: `docs/private/42_v10_object_update.md`.
- **BASE is a variable or dot-access chain.** `{target with ...}`, `{item.profile with ...}`, `{shared.cart with ...}` are legal; `{get_item() with ...}` (function call) and `{items[0] with ...}` (indexing) are rejected — bind the result to a local first. Narrow restriction by design: keeps the base obviously tied to a named object the reader can look up.
- **Shallow only.** `{target with profile.name: "X"}` is a parse error; nest explicitly: `{target with profile: {target.profile with name: "X"}}`. No path-access magic.
- **Braces required, no bare-infix.** `{target with done: true}` is legal; `target with done: true` (no braces) is not. Rationale: `{}` is Igni's single object-construction delimiter — keeping `with` inside braces preserves one-way-to-do-everything.
- **`with` is a reserved keyword.** Cannot be used as an identifier or field name. Repo-wide scan before ship showed zero existing occurrences.
- **Pre-ship cold-test validation.** `tests/v0.10/Object_Update_Syntax.md` ran a four-model syntax-proposal round: four distinct shapes, no majority convergence (Opus → spread, GPT → `{with}`, Gemini → bare infix `with`, Gemma → juxtaposition). `with`-keyword family had 2/3 frontier plurality. Design note's fallback rule fired — ship the principle-driven recommendation.
- **First new micro reference since v0.8.0.** `spec/v0.10.0-micro.md` forks from v0.8.0 (v0.9.0 and v0.9.1 added no syntax, so the micro stayed at v0.8.0). v0.10 is the first syntactic addition since v0.8.0; micro bumped to match.
- Transpiler: new `ObjectUpdate` AST node, `with` keyword added to lexer, codegen emits Dart `{...base, 'k': v, ...}` map spread. `transpiler/examples/contacts.igni` and `shopping.igni` migrated to the new shape; new `object-update.igni` positive example and two negative examples pinned (non-Ident base, `with` as field name).

## v0.9.1 — 2026-04-17
*Documentation-only. Trigger-variable pattern now recommends `on tap:` on a button and explicitly flags the `on change:` pseudo-fix.*

- **Spec wording tightening** in *Async Data*. v0.9.0 recommended setting the trigger "from a button or `on change:` handler". The v0.9.0 Product Search cold test (`tests/v0.9.0/Product_Search.md`) showed 2/3 frontier models read `on change:` as equivalent to a button and wrote `on change: search = query` to copy the bound variable into the trigger — which fires every keystroke and preserves the exact per-keystroke fetch the v0.9.0 rule was designed to prevent. v0.9.1 drops `on change:` from the recommendation and adds a sentence explaining why it is not an escape hatch. No syntax or semantic changes; same transpiler.
- Detection widening (catching `on change: trigger = bound_var` where `trigger` feeds a `fetch` URL) is deferred to v0.10 with its own design note. v0.9.1 is a docs-only patch to stop the spec from teaching the evasion pattern while the detection question is still being scoped.

## v0.9.0 — 2026-04-16
*Reactive-fetch footgun becomes a parse-time error.*

- **`fetch` URL concatenated with an `input bind:` target is now a transpile error.** Writing `results = fetch("/api/search?q=" + query)` where `query` is bound to an `input` used to compile and silently spam the API on every keystroke. The transpiler now rejects it with a fix-it message pointing at the trigger-variable pattern.
- **Detection is narrow on purpose:** string concatenation (`+ BinaryExpr`) inside the URL, direct `Ident` reference to a `bind:` target, `input` primitive only. `toggle` / `slider` / `checkbox` / `dropdown` stay legal — those reassign on discrete user action, and fetch-on-change is the intended pattern.
- Motivation: violated the "no magic" non-negotiable. A per-keystroke HTTP call is the opposite of "visible cause in the source." Cold-LLM tests repeatedly surface this pattern. Promoting the v0.5-era prose guidance ("Always use a trigger variable") to enforced rule turns the spec into its own teacher. Decision doc: `docs/private/40_v09_async_footgun.md`.
- Implementation: new `validateAsyncReactivity` pass on `Program` runs after `validateEmitPlacement`, before codegen. No parser changes. Reuses existing `TranspileError`.
- Test coverage: `transpiler/examples-errors/async-footgun.igni` pins the exact pitfall; existing `examples/fetch-reactive.igni` (trigger-variable pattern) continues to transpile.

## v0.8.0 — 2026-04-15
*Component event channels: `emit <event>` inside components, `on <event>:` at the call site.*

- **`emit <event> [<arg>]`** declares a custom event channel inside a component, valid only as the action of an `on tap:` / `on touch:` / `on change:` handler. Standalone use is a parse error.
- **`on <event>:` at component invocation** wires a handler that runs in the parent screen scope (`weight = weight + 1` setStates correctly). Same vocabulary as `on tap:` on primitives — no new keyword for callers.
- **Reserved event names: `tap`, `change`, `touch`** can't be custom event names. Parse-time error names the conflict.
- **Event data:** `emit selected item` → parent `on selected: handle(item)` where `item` is a named binding inside the handler body. Component author picks the binding name; caller uses it.
- **Optional handlers:** parent without a handler attached for a given emit just no-ops, same as `button "X"` without `on tap:`.
- Motivation: 5/8 compounded signal from v0.7.0 BMI cold-test (2/4 model invention of `on_tap_handler` / `on decrease:` + 3/4 ship-review flags). The string-key dispatch workaround was verbose enough that half the frontier models reached past it. Decision doc: `docs/private/33_v08_event_handlers.md`.
- Codegen emits each unique `emit X` event in a component as an optional `void Function([dynamic <arg>])? onX` field on the StatelessWidget. Standalone-emit validation runs as a pre-codegen pass.

## v0.7.1 — 2026-04-15
*`upper(s)` and `lower(s)` string case builtins.*

- **`upper(string)` / `lower(string)`** — return new strings with every letter uppercased / lowercased. Motivation: v0.7.0 Alert Dashboard cold test produced the strongest single-feature signal in the project's history (8/8 compounded — 4/4 model output friction + 4/4 ship-review flags). Every frontier model hit the missing uppercase builtin on the same prompt; three invented around it, one honest-flagged the gap. Lets the data model keep natural lowercase keys (`"critical"`, `"warning"`, `"info"`) for branching/filtering while the UI converts at the render site. Non-breaking.
- Codegen maps to Dart's `toUpperCase()` / `toLowerCase()`. Five-line change.
- No other string case helpers. `capitalize`, `title_case`, `trim`, `split`, `replace` on strings have zero cold-test evidence and are explicitly not in v0.7.1.

## v0.7.0 — 2026-04-14
*Styling tokens become assignable values.*

- **Assignable styling values** — colour tokens (`brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`) can now be stored in variables, passed around, and reassigned using the normal conditional-assignment pattern. Motivation: the BMI cold-test sequence repeatedly showed both humans and frontier models reaching for `bg = card` / `status_color = green` as the natural way to express conditional styling.
- **`card` is now assignable too, but stays background-only** — `bg = card` then `layout vertical, background: bg:` is valid. `color: card` remains invalid by design. This keeps the semantic surface token distinction from v0.6.5 while removing duplicate-layout boilerplate for selection states and status cards.
- **Strings explicitly unchanged in v0.7.0** — string concatenation stays `+` only. Interpolation was analysed and parked for a later version rather than bundled into the same release. This keeps v0.7.0 to one real language feature.

## v0.6.11 — 2026-04-14
*`shape: circle` property on `button` for compact circular controls.*

- **`button "X", shape: circle`** — compact circular button sized to its content. Default `button` remains a rounded-rectangle full-width bar. Motivation: BMI cold test revealed no way to express the round +/- stepper controls from Angela's reference design — models fell back to ordinary rectangular buttons. One new property value (circle), no new primitive. Circular buttons skip the SizedBox full-width wrap so a row of them lays out as distinct tap targets. Non-breaking.
- Canonical pairing: `button "-", shape: circle, color: subtle, on tap: ...` for +/- steppers; `icon "play", on tap: ...` still the right pattern for raw-glyph icon buttons without a filled background.

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
