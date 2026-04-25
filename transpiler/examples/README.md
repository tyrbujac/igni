# Examples

<!-- SYNC:example-count -->46<!-- /SYNC:example-count --> `.igni` apps, each paired with a reference `.expected.dart` for diff-testing. Also usable as a learning gallery — browse to see Igni in action.

For per-example LOC counts and Igni-to-Dart abstraction ratios, see the auto-generated [`GALLERY.md`](GALLERY.md).

To run any example in a browser:

```bash
cd transpiler/examples
igni run counter.igni      # or any other .igni file in this folder
```

To inspect the generated Dart:

```bash
npx tsx ../src/cli.ts counter.igni
```

## Index

### Starter apps

- **`counter`** — variables + button + reassignment reactivity. The "hello world" of state.
- **`greeting`** — `input bind:` + string concatenation + `is empty` / `is not empty`.
- **`toggle`** — `if`/`else` conditional rendering + `not` operator.
- **`settings`** — multi-field input binding with pre-populated defaults.

### Layout & styling

- **`primitives`** — every input primitive: `slider`, `checkbox`, `dropdown`, `image`, `icon`.
- **`dashboard`** — nested layouts, `badge`, `divider`, dense-information card layouts.
- **`bg-image`** — `background: "image.png"` on screens and layouts; `fill: true`.
- **`input-button-defaults`** — the visual-default rendering (outlined input, intrinsic button, scaffold background).
- **`mi-card`** — Angela Yu's identity-card app rebuilt in Igni. Static layout only: teal screen background, round avatar, `heading` + `color: white` text, two card-backgrounded info rows with icons capped at `max_width: phone` (so the cards don't stretch the window on desktop — the v0.13 dogfood case). 15 LOC — the static-UI regime in the LOC benchmark.
- **`max-width`** — five composition cases for `max_width:` (v0.13): shrink-wrap-then-cap, fill+cap, multi-fill-sibling redistribution, box-model-includes-padding, and a centered MiCard-style card. Tokens `phone` (480) / `tablet` (768) / `desktop` (1200).

### Lists & mutation

- **`todo`** — classic list + input + `each` + `is empty` conditional + screen-internal function.
- **`todo-full`** — same shape plus `without(list, target)` deletion.
- **`lambda`** — `filter`, `sorted`, `reversed` with lambda expressions.
- **`contacts`** — list indexing, comparison operators, large-list ergonomics. (Non-shared variant.)
- **`object-update`** — `{target with field: newval}` object-update syntax (v0.10).
- **`derived-counts`** — `length(filter(...))` canonical pattern for field-based counting (v0.11.3+).

### Functions

- **`functions`** — screen-internal functions called from `on tap:`.
- **`fn-return`** — functions with `return` values used in labels.
- **`else-if-in-fn`** — conditional flow within a function body.

### Components

- **`components`** — component definition + invocation with parameters.
- **`component-conditional`** — component that renders different UI based on its argument.
- **`component-derived-local`** — component with local variables derived from props.
- **`wrapper`** — wrapper component with `body` slot for composable layouts.
- **`stepper`** — component with `emit <event>` + `on <event>:` wiring at call site (v0.8).

### State

- **`shared`** — cross-screen state via `shared:` block + `shared.X` access.
- **`shopping`** — full e-commerce shell. Shared cart, wrapper components, list builtins, navigation.
- **`type-hints`** — typed variable declarations (`items: [Item] = [...]`).

### Navigation

- **`notes`** — multi-screen navigation with screen parameters (`navigate to Detail note`).
- **`screen-conditional`** — screen body that renders different content based on state.

### Async

- **`fetch`** — single HTTP GET + `is loading` / `is error` state machine.
- **`fetch-mutation`** — POST / PUT / PATCH / DELETE via `method:` and `body:`.
- **`fetch-reactive`** — reactive re-fetch when URL dependencies change (trigger-variable pattern).
- **`locate`** — `locate()` geolocation primitive + `is loading` / `is error` (v0.11).
- **`clima`** — Angela Yu weather app: `locate()` + fetch chain with trigger variables.

### Side effects

- **`on-change`** — `on change:` event handler on every bindable primitive.
- **`dice`** — `random(min, max)` builtin.
- **`dicee`** — Angela Yu course project: screen `title:` + `background:`, local images, AppBar.

### Builtins

- **`string-case`** — `upper()` / `lower()` string builtins (v0.7.1).
- **`logic`** — `and` / `or` boolean composition.
- **`emit-primitive-name`** — event naming convention for primitive-emitted events.

### Pagination & large lists

- **`pagination`** — `paginate: N` modifier on `each` for lazy `ListView.builder`.

### Games

- **`tictactoe`** — two-player noughts and crosses. 3×3 grid via nested layouts, flat-list-of-objects board, `replace()` + `{target with mark: player}` for cell updates, `each` over row indices with arithmetic indexer.

### Smoke test

- **`tutorial`** — companion to [`docs/tutorial.md`](../../docs/tutorial.md). Simple counter used as a pipeline sanity check.

## Notes on reading examples

Each `.igni` file is 5–60 lines. The corresponding `.expected.dart` is typically 40–300 lines — that's the readability multiplier. Examples are the contract between spec behaviour and codegen output: `npm test` diffs stdout against `.expected.dart`, byte-exact.

When adding an example, update this index with a one-liner describing what it demonstrates.
