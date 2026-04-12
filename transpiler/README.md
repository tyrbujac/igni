# Igni Transpiler

Compiles `.igni` source to Dart/Flutter targeting web. Hand-written recursive descent parser in TypeScript.

## Quick start

```bash
cd transpiler
npm install
npx tsx src/cli.ts examples/counter.igni
```

This prints the generated Dart to stdout. To run in a browser:

```bash
npx tsx src/cli.ts examples/fetch.igni > test_app/lib/main.dart
cd test_app
flutter run -d chrome
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
| `screen Name:` | StatefulWidget |
| `component Name(args):` | StatelessWidget |
| `layout vertical/horizontal` | Column / Row |
| `label`, `button`, `input`, `toggle`, `spinner` | Text, ElevatedButton, TextField, Switch, CircularProgressIndicator |
| `bind:` | TextEditingController + onChanged + setState |
| `if`/`else`/`else if` | Collection-if with spread |
| `each item in list:` | Collection-for with spread |
| `navigate to` / `navigate back` | Navigator.push / Navigator.pop |
| `shared:` block | ChangeNotifier + ListenableBuilder |
| `fetch(url)` | http.get + async state management |
| `is loading` / `is error` | Boolean flags |
| `is empty` / `is not empty` | .isEmpty / .isNotEmpty |
| `without(list, item)` | .where().toList() |
| `replace(list, old, new)` | .map().toList() |
| Functions with params | Methods with setState |
| `not expr` | `!expr` |
| Object literals `{key: val}` | Dart Maps |
| Field access `obj.field` | Bracket notation `obj['field']` |

## Examples

Eleven test apps in `examples/`, each with source (`.igni`) and reference output (`.expected.dart`):

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

## Running tests

```bash
# Run all diff tests
for f in counter settings toggle functions greeting todo notes todo-full components shared fetch; do
  npx tsx src/cli.ts examples/$f.igni | diff - examples/$f.expected.dart && echo "$f: PASS"
done
```
