# Igni Transpiler

Compiles `.igni` source to Dart/Flutter targeting web. Hand-written recursive descent parser in TypeScript.

## Quick start

```bash
cd transpiler
npm install
npx tsx src/cli.ts examples/counter.igni
```

This prints the generated Dart to stdout. To run in a browser, use the CLI from any directory containing `.igni` files:

```bash
igni run
```

## Pipeline

```
.igni source → Lexer → Token[] → Parser → AST → CodeGen → .dart
```

- **Lexer** — Python-style INDENT/DEDENT indentation tracking
- **Parser** — recursive descent, no dependencies
- **CodeGen** — maps Igni constructs to Flutter widgets

## Supported features

| Igni | Dart/Flutter |
|---|---|
| `screen Name:` / `screen Name, title: "T":` | StatefulWidget + Scaffold + AppBar |
| `component Name(args):` | StatelessWidget |
| Wrapper components with `body` | StatelessWidget with child slot |
| `layout vertical/horizontal` | Column / Row + Center, Padding, Expanded |
| `label`, `button`, `input`, `toggle`, `spinner` | Text, ElevatedButton, TextField, Switch, CircularProgressIndicator |
| `image`, `icon`, `slider`, `checkbox`, `dropdown`, `badge` | Image, Icon, Slider, Checkbox, DropdownButton, Chip |
| `bind:` | TextEditingController + onChanged + setState |
| `if`/`else`/`else if` | Collection-if with spread |
| `each item in list:` | Collection-for with spread |
| `navigate to` / `navigate back` | Navigator.push / Navigator.pop |
| `shared:` block | ChangeNotifier + ListenableBuilder |
| `fetch(url)` / `method:` / `body:` | http.get/post/put/patch/delete + async state |
| `is loading` / `is error` / `is empty` / `is not empty` | Boolean flags / .isEmpty / .isNotEmpty |
| `without`/`replace`/`find`/`count`/`length`/`filter`/`sorted`/`reversed`/`map` | Dart list methods |
| Lambda expressions `item => expr` | Dart closures |
| `contains(str, term)` | .toLowerCase().contains() |
| `random(min, max)` | Random().nextInt() |
| `play("file.wav")` | audioplayers AssetSource |
| Functions with params + `return` | Methods with setState |
| `and`/`or`, `not`, `>` `<` `>=` `<=` | `&&`/`||`, `!`, comparison operators |
| `items[index]` (list indexing) | Bounds-checked access |
| Object literals `{key: val}` / field access `obj.field` | Dart Maps / bracket notation |
| `on change:` event on bind primitives | Callback after setState |
| `background: "image.png"` on screens/layouts | BoxDecoration with AssetImage |

## Examples

27 apps in `examples/`, each with source (`.igni`) and reference output (`.expected.dart`):

| Example | What it tests |
|---|---|
| `counter` | Variables, layout, button, reactivity |
| `settings` | Input binding, toggle binding, padding |
| `toggle` | if/else, not operator |
| `functions` | Screen-internal functions, on tap with function calls |
| `greeting` | is empty/not empty, string concatenation |
| `todo` | each loops, list/object literals, field access |
| `notes` | Multi-screen navigation, screen params |
| `todo-full` | without builtin, function args, delete |
| `components` | Component definition + invocation |
| `shared` | Cross-screen shared state, ChangeNotifier |
| `fetch` | Async HTTP, loading/error states, spinner |
| `fetch-mutation` | POST/PUT/PATCH/DELETE with method: and body: |
| `fetch-reactive` | Reactive re-fetch when URL dependencies change |
| `dice` | random builtin |
| `dicee` | Screen properties, local images, AppBar, fill layouts |
| `dashboard` | Complex layouts, badges, dividers |
| `fn-return` | Functions with return values |
| `lambda` | filter/sorted/reversed with lambdas |
| `primitives` | slider, checkbox, dropdown, image, icon |
| `shopping` | Full e-commerce with shared state |
| `wrapper` | Body slot wrapper components |
| `logic` | and/or boolean operators |
| `type-hints` | Typed variable declarations |
| `contacts` | List indexing, comparison operators |
| `on-change` | on change: event on all bind primitives |
| `bg-image` | Background images on screens and layouts |
| `tutorial` | Smoke test (no expected output) |

## Running tests

```bash
# Run all diff tests
npm test

# Or manually for one example
npx tsx src/cli.ts examples/counter.igni | diff - examples/counter.expected.dart
```
