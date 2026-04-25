# Migrating from Flutter

Igni compiles to Flutter — every Igni screen is ultimately a Flutter widget tree at runtime. The migration path is therefore narrower than it sounds: you're not learning a new rendering engine, you're swapping syntax + state primitives for ones with less ceremony. This guide covers the mental-model shift, three side-by-side ports, and the explicit non-goals that decide when you should drop into raw Flutter instead.

For Igni's audience scope (what it's for and not for), see README "[What Igni is for](../README.md#what-igni-is-for)". For task-shaped recipes, see [`cookbook.md`](cookbook.md).

---

## Mental-model shift

Three differences worth absorbing before reading code:

1. **Reactivity is automatic on variable reassignment.** No `setState`, no `notifyListeners`, no `useState` hook. Reassigning a variable inside a screen body causes the screen to re-evaluate from the top. That's the entire model. The Flutter equivalent — wrapping a value in `ValueNotifier` and rebuilding on changes — is the default in Igni, with no boilerplate.

2. **The widget tree is not exposed.** You don't write `Column(children: [...])` or worry about `BuildContext`. Igni's `layout vertical:` compiles to `Column`, `layout horizontal:` to `Row`, and the indentation tells the compiler what to put in `children:`. There's nothing to lift up, nothing to constructor-cascade, nothing to wrap in `Builder` to access context.

3. **The spec is a budget, not a backlog.** Flutter ships ~2,000 widget classes and a large API surface. Igni ships ~25 primitives (full list in the [cheatsheet](../spec/v0.13.1-cheatsheet.md)). When you find Igni "missing" something Flutter has — tabs, slivers, custom-painters, drawer widgets — the answer is usually "compose it from primitives" or "this isn't an Igni use case; drop into raw Flutter." The narrowness is the point: a smaller spec means LLMs can reach for the right primitive on the first try.

The first two shifts are wins for almost every Flutter user; the third is a real tradeoff documented in *Non-goals* below.

---

## Three ports, side by side

### 1. A counter

**Flutter:**
```dart
import 'package:flutter/material.dart';

class CounterScreen extends StatefulWidget {
  const CounterScreen({super.key});
  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('$_count', style: Theme.of(context).textTheme.headlineLarge),
            ElevatedButton(
              onPressed: () => setState(() => _count++),
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
}
```

**Igni:**
```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

5 lines vs 28. The lifted-out widget class, the `setState` callback, the `MainAxisAlignment` enum, the `Theme.of(context)` plumbing — all gone. Igni's reactivity sees the `count =` reassignment and re-renders the screen automatically.

### 2. Fetch with loading and error

**Flutter (using `FutureBuilder`):**
```dart
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Map<String, dynamic>> _user;

  @override
  void initState() {
    super.initState();
    _user = http.get(Uri.parse('https://api.github.com/users/octocat'))
        .then((r) => json.decode(r.body));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<Map<String, dynamic>>(
        future: _user,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return const Text('Error');
          final u = snap.data!;
          return Column(
            children: [
              Image.network(u['avatar_url'], width: 140, height: 140),
              Text(u['name']),
            ],
          );
        },
      ),
    );
  }
}
```

**Igni:**
```igni
screen Profile:
  user = fetch("https://api.github.com/users/octocat")

  layout vertical, padding: large, gap: medium:
    if user is loading:
      spinner
    else if user is error:
      label "Error", color: danger
    else:
      image user.avatar_url, size: 140, round: true
      label user.name, style: heading
```

6 vs 32. Igni's `fetch` returns a value with three reactive states (`is loading` / `is error` / resolved); the JSON parsing is implicit; the conditional rendering is `if`/`else if`/`else` against the same variable rather than `FutureBuilder`'s callback-shaped API.

### 3. Editable list with delete-per-row

**Flutter:**
```dart
class TodoScreen extends StatefulWidget {
  const TodoScreen({super.key});
  @override
  State<TodoScreen> createState() => _TodoScreenState();
}

class _TodoScreenState extends State<TodoScreen> {
  final _items = <String>['buy milk', 'walk dog', 'write spec'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView.builder(
        itemCount: _items.length,
        itemBuilder: (context, i) => Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(_items[i]),
            ElevatedButton(
              onPressed: () => setState(() => _items.removeAt(i)),
              child: const Text('Delete'),
            ),
          ],
        ),
      ),
    );
  }
}
```

**Igni:**
```igni
screen TodoScreen:
  items = ["buy milk", "walk dog", "write spec"]

  layout vertical, padding: large, gap: medium:
    each item in items:
      layout horizontal, spread: true, align: center:
        label item
        button "Delete", color: danger, on tap: items = without(items, item)
```

7 vs 25. The `each` loop closure captures `item` correctly per iteration. `without(list, target)` returns a new list with the matching element removed; the reassignment fires reactivity. No index-based iteration, no `removeAt`, no `setState`.

---

## What Igni doesn't have (deliberate non-goals)

These aren't oversights — they're costs paid to keep the spec small enough to learn cold. From README "[What Igni is for](../README.md#what-igni-is-for)":

- **Imperative drawing surfaces** (`canvas`, custom painters, shaders) — required for waveforms, photo editors, custom chart rendering.
- **Frame loops / animation primitives** (`on frame:`, `AnimationController`, `Tween`) — required for 60fps interactions, scrubbing playheads, physics simulations.
- **Pointer events with coordinates and drag lifecycle** (`onPanStart` / `Move` / `End` with `details.globalPosition`) — required for brushes, draggable clips, marquee selections, tablet input.
- **Raw layout dimensions** (`Container(width: 240, height: 480)`, `Transform.translate(offset: Offset(x, y))`) — required for piano rolls, timelines, anything where pixels are computed rather than tokenised.
- **Granular per-subtree reactivity** (`ValueListenableBuilder`, `Selector` patterns) — Igni re-evaluates the entire screen on any reassignment. Fine for forms; problematic for 500-item lists with frequent updates.

Three independent frontier-model panels converged on this exact list of missing primitives — it's the consensus view of what creative-tool UIs need that Igni won't ship. See [`docs/private/92`](private/) (gitignored research record) for the panel responses.

Other Flutter capabilities deliberately not exposed:
- **Custom routing / nested navigators / deep links / modals** — Igni has `navigate to Screen(args)` and `navigate back`, no `Navigator 2.0`.
- **The pub.dev ecosystem** — Igni doesn't import packages. If you need `dio`, `bloc`, `provider`, `riverpod`, `freezed`, etc., you're outside Igni's scope.
- **Themes beyond font + colour tokens** — `theme:` block in v0.12+ exposes font tokens; deeper Material 3 theme customisation isn't there.
- **Internationalisation, accessibility tree control, complex form validation libraries** — all live in the wider Flutter / pub.dev ecosystem.

---

## When to drop into Flutter directly

Three honest rules of thumb:

1. **If your app is in the creative-tool band** (DAW, video editor, photo editor, real-time game, custom chart library, vector drawing tool) — write Flutter directly from day one. Igni won't get you to a working prototype because it doesn't expose the primitives those apps need. README "What Igni is for" calls this out explicitly.

2. **If you're hitting a single Flutter capability** that Igni doesn't expose (one specific animation, one custom-painted widget, one third-party package), the existing pattern is to keep the rest of your app in Igni and write that one widget in Flutter. The transpiler outputs to a hidden `.igni/` Flutter project; you can extend the generated code, but most teams will just rewrite that screen in Flutter and build separately.

3. **If you're worried about reactivity performance with 500+ items** — Igni's whole-screen-re-evaluation rule is the model. For most form / list / detail apps it's fine; for a Kanban with 1000 cards being dragged in real time, it isn't. Measure before assuming. If it does hurt, that's a sign the app may not fit Igni's audience band.

---

## Workflow differences worth knowing

- **`igni run`** is one command for the whole dev loop: transpile → start Flutter web server → open Chrome → watch for changes. There's no separate `flutter create`, `flutter run`, or hot-reload key combo — saving an `.igni` file triggers a hot restart automatically.
- **No `pubspec.yaml`** to maintain. The hidden `.igni/` directory has its own `pubspec.yaml` that the transpiler regenerates; manual edits there get overwritten.
- **No widget inspector** — Flutter DevTools work against the generated Dart, but the line numbers reference the generated file. Igni's CLI tries to map runtime errors back to your `.igni` source line; it's good but not perfect.
- **Single source file is fine.** Most Flutter projects split into one-class-per-file structures by convention. Igni is much shorter — typical screen is 10–40 lines — so flat-file layouts read well up to 200 lines, and any number of screens in one file is supported.

---

## Pointers

- **Spec reference:** [`spec/v0.13.1.md`](../spec/v0.13.1.md) (full) or [`spec/v0.13.1-cheatsheet.md`](../spec/v0.13.1-cheatsheet.md) (scan-oriented)
- **Cookbook (task-shaped recipes):** [`cookbook.md`](cookbook.md)
- **Beginner walkthrough:** [`tutorial.md`](tutorial.md)
- **All 46 example apps:** [`transpiler/examples/GALLERY.md`](../transpiler/examples/GALLERY.md)
- **Mobile (iOS / Android):** [`mobile.md`](mobile.md)
