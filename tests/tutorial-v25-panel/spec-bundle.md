# Igni reference materials (for LLM panel review)

## README.md

# Igni

[![test](https://github.com/tyrbujac/igni/actions/workflows/test.yml/badge.svg)](https://github.com/tyrbujac/igni/actions/workflows/test.yml)

A programming language for building UIs — designed to be read.

**Status: research prototype.** Final-year CS dissertation project investigating whether LLM output accuracy and human readability track each other. Spec is at v0.12.2; transpiler covers most of it; the tutorial has been through multiple cold-run iterations. Not yet production-ready. See [§ Status](#status) for the methodology + evidence.

**The hypothesis:** LLM accuracy and human readability track each other. Remove the ambiguity that trips LLMs up — no brackets on component invocation, one way to update state, a single spec document — and the language becomes nicer for humans too. Igni is that experiment.

**Concrete evidence so far:** Igni's syntax gets cold-tested on frontier LLMs (Claude, GPT, Gemini) — each round measures whether models write correct code from the docs alone, no examples. The most recent test produced **0/7 wrong inventions** after a one-paragraph docs fix, down from 3/7 silent bugs before. That loop is how the object-update syntax, trigger wording, and geolocation primitive got locked in — the language evolves toward phrasings frontier models reach for first. Methodology and full per-round numbers in [tests/README.md](tests/README.md).

Igni transpiles to Dart/Flutter. You write short, readable source files. The toolchain handles the rest.

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons open them. One way to do everything. No imports, no `useState`, no boilerplate. Reactivity is automatic.

## Installation

Igni isn't on npm. To install from source:

```bash
git clone https://github.com/tyrbujac/igni.git
cd igni/transpiler
npm install
```

Then symlink the CLI onto your PATH:

```bash
mkdir -p ~/.local/bin
ln -s "$(pwd)/bin/igni" ~/.local/bin/igni
# ensure ~/.local/bin is on your $PATH — add to ~/.zshrc or ~/.bashrc if not
```

Verify: `igni --help` prints the usage message.

## Quick start

**Prerequisites:** Node.js 18+, Flutter SDK, Chrome.

```bash
igni new my-app
cd my-app
```

Run it:

```bash
igni run
```

First run needs internet — `flutter create` fetches scaffold packages from pub.dev. After that, `igni run` works fully offline, theme fonts included.

`igni new` creates a starter `app.igni` and a `.gitignore` for the generated `.igni/` Flutter project. Save `app.igni`, browser updates automatically. That's it.

## Using Igni with an LLM

Igni is designed to be injected straight into your LLM's context window.

1. **The context:** paste the entire contents of [`spec/v0.12.2-cheatsheet.md`](spec/v0.12.2-cheatsheet.md) into your system prompt or initial message.
2. **The persona:** add this instruction: *"You are an expert Igni developer. Write concise, idiomatic Igni code using strictly the provided rules. Do not invent syntax."*
3. **The prompt:** ask for the specific UI you need. Example: *"Build a `screen Settings:` with a dark mode toggle bound to a boolean variable, and a red logout button."*

Because Igni lacks boilerplate, the model outputs the raw 5–6 lines you need, ready to save directly into your `.igni` file.

## How it works

`igni run` transpiles your `.igni` files to Dart, spins up a Flutter web server, and watches for changes. Edit, save, see the result in your browser — the loop is instant.

When Flutter or generated Dart reports an error from `main.dart`, Igni maps it back to the nearest `.igni` source line so the CLI points at code you actually wrote instead of only the generated file.

Under the hood, a hidden `.igni/` Flutter project is created automatically. You never touch it — just edit `.igni` files and save.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for how the pieces fit together (repo layout, spec files, transpiler pipeline, validation methodology). See [`docs/tutorial.md`](docs/tutorial.md) to learn Igni end-to-end.

## Why not Flutter / React / SwiftUI?

Igni is downstream of the same declarative-UI lineage as SwiftUI and Jetpack Compose, built specifically for LLM-assisted workflows. Compared to mainstream options:

- **Flutter** — Igni compiles to Flutter. You get Flutter's rendering; you skip Flutter's imperative `setState`, widget constructors, and `BuildContext` plumbing. Tradeoff: Igni's spec is deliberately smaller than Flutter's API, so features Flutter has (animations, pub.dev packages) you'd need to drop into Flutter directly for.
- **React / React Native** — Igni's reactivity is automatic reassignment (no `useState`, no setters). Similar in spirit to React but via lexical re-evaluation instead of hook-based re-renders. Igni has no JSX, no components-as-functions, and no package ecosystem — it's much narrower.
- **SwiftUI / Jetpack Compose** — Closest cousins. Similar declarative-UI mental model. Main difference: Igni was designed for cold-LLM adoption from day one, so its spec is narrower and explicitly resists features that confuse models — no ternary expressions, no string interpolation, no multi-parameter lambdas.

If you already love Flutter / React / SwiftUI, Igni likely isn't competitive for your existing workflow. If you're writing UI code with LLM assistance and feeling the syntactic noise, Igni optimizes for that specifically.

## Mobile

`igni run` defaults to Chrome. Mobile is one command each:

```bash
igni run ios          # iOS simulator
igni run android      # Android emulator
```

Igni auto-picks a running device, or auto-boots the first available simulator / emulator. Use `--device "<name>"` to pick a specific one. See [`docs/mobile.md`](docs/mobile.md) for device-selection rules, build timings, and known gotchas (Cloudflare third-party APIs, SafeArea).

## Project structure

Igni files are much shorter than their Flutter equivalents — a screen is typically 10-40 lines, not 100-300. Flat file structure works well:

- **Under 200 lines:** fine as a single file
- **Over 200 lines:** consider splitting by screen or feature
- **No folders needed** until 15+ files — auto-discovery means every screen and component is available everywhere with no imports

```text
my-app/
  app.igni           # entry point
  settings.igni      # another screen (optional)
  images/            # local images
  audio/             # audio files
```

## Status

**Language spec:** Current canonical spec is [spec/<!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md](spec/<!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md). Companion cheatsheet at [<!-- SYNC:cheatsheet-path -->spec/v0.12.2-cheatsheet.md<!-- /SYNC:cheatsheet-path -->](<!-- SYNC:cheatsheet-path -->spec/v0.12.2-cheatsheet.md<!-- /SYNC:cheatsheet-path -->); syntax-only micro reference at [<!-- SYNC:micro-path -->spec/v0.12.2-micro.md<!-- /SYNC:micro-path -->](<!-- SYNC:micro-path -->spec/v0.12.2-micro.md<!-- /SYNC:micro-path -->). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest spec changes:** `v0.12.2` (2026-04-24) restructured the spec around the reactivity rule: sections renumbered top-to-bottom as a tutorial (Todo walkthrough imported as §2), Lists split into basics + transformations, planned theme content moved to Appendix C. Docs-only; 60/60 diff tests byte-identical; three LLM-panel rounds converged 3/4–5/5 on every change shipped (see `docs/private/85`). `v0.12.1` (2026-04-23) renamed font tokens `source-sans` → `source_sans` and `fira-code` → `fira_code` to avoid the lexer's Minus-token collision, and landed the v0.12 theme-block transpiler implementation (see `docs/private/84`). `v0.12` (2026-04-22) added the `theme:` block, scoped to font overrides via `theme.text.<role>.font:` with a curated six-font bundle. Stage 0 falsified the originally-proposed per-label `font:` syntax (0–1/4); the theme-level shape emerged via 2/4 independent convergence in the same panel (see `docs/private/78`, `81`). `v0.11.6` (2026-04-22) adds a three-sentence reactivity lifecycle clarifier to the cheatsheet's *Reacting to users* section, addressing the 3/4 LLM-panel convergence gap on the abstract-only "re-evaluates from the top" rule (see `docs/private/73`). `v0.11.5` (2026-04-21) was a docs-only hygiene pass — cheatsheet pruned 2,931 → 2,536 words; context-specific callouts migrated from the cheatsheet's learning path to the full spec's reference sections. First execution of the prune-before-add cadence. `v0.11.4` (2026-04-21) sharpened the *Counting by field* callout per a 4-model ship review; Stage 3 validated the rewrite at 0/7 inventions (see *Concrete evidence* above). `v0.11.3` (2026-04-21) canonicalised `length(filter(list, predicate))` as the idiom for field-based counting. `v0.11.0` added the `locate()` geolocation primitive reusing `fetch()`'s `is loading:` / `is error:` machinery (4/4 pre-ship shape convergence, 3/3 post-ship adoption on Clima). Preceding syntax ships: `v0.10.0` object-update syntax `{target with field: newval}` (9/9 frontier adoption across three domain-swap rounds); `v0.9.1` trigger-variable wording tighten (docs-only, 3/3 flip); `v0.9.0` reactive-fetch footgun as a transpile-time error; `v0.8.0` component event channels (`emit` + `on <event>:`). See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest methodology result:** the v0.10 domain-swap round (Shopping + Apothecary + Spaceship Cargo, 3 × 4 models × cheatsheet tier) produced 9/9 frontier adoption of `{target with ...}` unprompted. Three runs at varying domain distance from e-commerce rules out the "shopping-cart corpus density" confound — the cheatsheet teaches the syntax, the domain doesn't supply it. First post-ship result strong enough to call directly-supported rather than suggestive.

**Transpiler:** Working. <!-- SYNC:example-count -->43<!-- /SYNC:example-count --> example apps compile and run in the browser; iOS simulator and Android emulator supported via `igni run ios` / `igni run android` (device auto-pick, auto-boot, `--device` override). Covers:

- **Composition** — screens, components, wrapper components with `body` slot, layouts
- **Control flow** — `if`/`else`, `each` loops (with `paginate:` for lazy rendering), functions, lambdas
- **State & data** — variables, two-way binding, shared state, async `fetch` + `locate()` with loading/error
- **Data shapes** — list operations (`filter`, `sorted`, `without`, `replace`, ...), list indexing, object-update syntax (`{target with field: newval}`)
- **UI surface** — screen properties (title, background), local images, audio, SafeArea auto-wrap when no AppBar (prevents iOS notch clipping)
- **Operators** — arithmetic, comparison, boolean (`and`/`or`/`not`)

**Compile-time rejections** — five anti-patterns rejected with fix-it errors: reactive-fetch footgun, `emit <event>` misplacement, bare `shared:` access, `count(list, lambda)` (use `length(filter(...))`), `locate()` reactive-fetch extension. Pinned negative fixtures in [`transpiler/examples-errors/`](transpiler/examples-errors/).

**CLI:** `igni new` scaffolds a starter. `igni run` transpiles, watches, serves. `igni run ios` / `igni run android` for mobile — see [`docs/mobile.md`](docs/mobile.md). Full reference in [`transpiler/README.md`](transpiler/README.md).

**Project scope:** Single-author by design during early access. The project's adversarial review comes from cold-LLM panels (4 frontier models per round, see [`tests/README.md`](tests/README.md)) and human usability testing, not multi-contributor PRs — a deliberate choice for a research prototype. External contribution will open post-v1.0 when the spec is stable enough to absorb PRs without churn.

## Repo structure

```text
igni/
├── README.md                # this file
├── ARCHITECTURE.md          # how the pieces fit (human audience)
├── CLAUDE.md                # AI-assistant design principles + workflow
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
├── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
├── spec/
│   ├── README.md
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->-cheatsheet.md  # current canonical cheatsheet
│   ├── <!-- SYNC:version -->v0.12.2<!-- /SYNC:version -->-micro.md       # current canonical micro reference
│   └── archive/             # historical <!-- SYNC:historical-range-files -->v0.2.md → v0.12.1.md<!-- /SYNC:historical-range-files --> (never edited after shipping)
├── transpiler/
│   ├── README.md
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   ├── examples/            # <!-- SYNC:example-count -->43<!-- /SYNC:example-count --> .igni apps + .expected.dart references
│   └── examples-errors/     # pinned transpile-rejection fixtures
├── tests/                   # cold-LLM test results + methodology
│   ├── README.md
│   └── v<spec_version>/     # prompts + results per round
├── docs/
│   ├── README.md
│   ├── tutorial.md          # beginner walkthrough
│   ├── mobile.md            # iOS / Android run instructions
│   └── archive/             # prior tutorial drafts
├── editors/
│   └── vscode/              # VS Code / Cursor TextMate grammar
├── scripts/
│   └── sync-docs.ts         # regenerates SYNC:* markers from repo state
└── assets/                  # logo (igni.svg + igni-dark-mode.svg, PNGs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).


---

## spec/v0.12.2-cheatsheet.md

# Igni v0.12.2 — Cheat Sheet

UI-first language. Reads like a design spec, compiles to Flutter. No imports, no classes, no boilerplate.

## Hello World

```igni
screen Hello:
  label "Hello, World!"
```

That's a complete app. One screen, one label.

## A Complete App

A 17-line Todo, every line load-bearing, exercising the most common Igni primitives in one piece. Read top-to-bottom before drilling into the per-feature sections below.

```igni
screen Todo:                                       # screen — top-level
  items = []                                       # variable; empty list
  draft = ""                                       # variable; empty string

  layout vertical, gap: medium, padding: large:    # layout — vertical stack
    label "Todo", style: heading                   # label with style token
    input bind: draft, placeholder: "New task"     # input with two-way bind
    button "Add", on tap: add()                    # button → screen function
    if items is empty:                             # conditional rendering
      label "No tasks yet"
    else:
      each item in items:                          # list iteration
        label item.text                            # field access on object

  add():                                           # screen-internal function
    items = items + [{text: draft}]                # list append + object literal
    draft = ""                                     # state reassign → re-renders
```

Lexical reactivity does the heavy lifting: reassigning `items` or `draft` inside `add()` re-runs the screen body, which re-renders the layout. There is no `setState`, no controllers, no observable wrappers. Same model holds whether state is local (this example), shared across screens (`shared:` block), or async (`fetch()` / `locate()`).

## Reacting to users

State is plain variables. Conditionals are statements. The connective tissue is one rule: **a screen re-evaluates from the top whenever any variable it references is reassigned.** No `setState`, no observable wrappers, no signals — just assignment. Same rule applies whether the variable is local (declared in the screen body), shared (declared in a top-level `shared:` block), or async (the result of a `fetch()` or `locate()`).

**Why doesn't state reset?** Top-level assignments (`count = 0`) run *once*, when the screen first opens — think "starts at", not "resets to". Re-evaluation re-runs the rendering part (layouts, labels, conditionals) with the variable's current value, not its initial one. The `= 0` line doesn't fire again until you leave the screen and come back.

**Variables.**

```igni
name = "Tyr"                       # String
count = 0                          # int
price = 9.99                       # decimal
active = true                      # bool
status_color = green               # colour value
card_bg = card                     # background-only surface value
items = []                         # List
items: [Product] = []              # List with type hint
fields = {name: "Tyr", age: 24}    # Object (Map)
weather = null                     # null
```

Arithmetic: `+`, `-`, `*`, `/` (standard precedence, parentheses for grouping).
String concatenation: `"Hello, " + name`. No string interpolation.
Field access: `obj.field`.
List indexing: `items[0]`, `items[index]`. Zero-based. Returns `null` on out-of-bounds. Chains: `questions[index].text`.

**Conditionals.**

```igni
if condition:
  ...
else if other:
  ...
else:
  ...
```

Statements, not expressions. For conditional values: assign default, then override.

```igni
result = default_value
if condition:
  result = alternative
```

This also works for styling values:

```igni
bg = card
if selected:
  bg = brand
layout vertical, background: bg:
  label "Selected", color: white
```

**Boolean logic.**

`not`, `and`, `or` — not symbols.

`is` checks equality: `name is "Tyr"`, `count is 0`, `weather is null`.
Negate: `is not`. Special forms: `is empty`, `is not empty`, `is loading`, `is error`, `is null`, `is not null`.
List membership: `is in`, `is not in`.
Comparison: `>`, `<`, `>=`, `<=` for numeric ordering.

Conditionals require explicit boolean values. No truthiness.

## Running It

```bash
igni run              # runs app.igni (default entry point)
igni run hello.igni   # runs a specific file
```

`app.igni` is the default entry point for multi-file projects. For single-file experiments, name the file whatever you want and pass it to `igni run`. Save a `.igni` file to hot reload.

```text
my-app/
  app.igni          # entry point (default)
  images/           # local images (referenced by name)
  audio/            # audio files (referenced by name)
```

## Screens

```igni
screen Home:
  count = 0

  layout vertical, padding: large:
    label count, style: heading
    button "Add", on tap: increment()

  increment():
    count = count + 1

screen Profile(user):
  layout vertical, padding: large:
    label user.name, style: heading

screen Dicee, title: "Dicee", background: red:
  layout horizontal, align: center:
    image "dice1.png", size: 120
```

Full page. **Variables, layouts, and functions all live inside the screen body** — never at file level. Screen bodies stack vertically by default. Optional properties after name: `title:` adds an app bar, `background:` sets colour or image.

## Showing things

| Primitive  | Example                                       |
|------------|-----------------------------------------------|
| `label`    | `label "Hello", style: heading`               |
| `image`    | `image "photo.png", size: 48, round: true`    |
| `icon`     | `icon "play", size: large, color: brand`      |
| `badge`    | `badge "Online", color: green`                |
| `spinner`  | `spinner`                                     |
| `divider`  | `divider`                                     |

Labels support `align: center` for centred text. Images: local filename → `images/` folder, URL starting with `http` → network.

## Getting input

User input comes from a small set of primitives, each connected to state via `bind:` and capable of firing events. Every input-capable primitive has the same three building blocks: a primitive name (what it looks like), a `bind:` target (where its current value lives), and event handlers (what fires on user action). Read the primitives table first, then the binding rule, then the events.

| Primitive  | Example                                       |
|------------|-----------------------------------------------|
| `button`   | `button "Save", color: brand, on tap: save()` |
| `input`    | `input bind: email, placeholder: "Email"`     |
| `toggle`   | `toggle bind: dark_mode, label: "Dark mode"`  |
| `checkbox` | `checkbox bind: agreed, label: "I agree"`     |
| `slider`   | `slider bind: volume, min: 0, max: 100`       |
| `dropdown` | `dropdown bind: country, options: countries`  |

**Circular buttons** — `shape: circle` for compact +/- steppers and icon-style controls (defaults to rounded rectangle):

```igni
button "-", shape: circle, color: subtle, on tap: weight = weight - 1
```

**Data binding.** `bind:` connects a primitive to a variable. Two-way, automatic — every keystroke for `input`, every flip for `toggle`/`checkbox`, every drag for `slider`, every selection for `dropdown` reassigns the bound variable. The reactivity rule (see *Reacting to users*) re-renders the screen each time, so live filtering, conditional rendering, and dependent inputs all "just work."

```igni
input bind: email, placeholder: "Email"
toggle bind: dark_mode
```

**Events.** All input primitives (and any layout / component) accept `on tap:` and `on touch:`. Primitives with `bind:` additionally accept `on change:` for side effects when the bound value changes.

```igni
on tap: save()                     # fires on release (confirmed action)
on tap: count = count + 1          # inline assignment
on tap: navigate to Detail item    # navigation
on touch: play("note1.wav")        # fires on contact (instant response)
```

`on tap:` for buttons, navigation, list items. `on touch:` for instruments, games — when latency matters.

**`on change:` fires when a bound value changes.** For side effects — updating a dependent variable, validating input. Attaches to any primitive with `bind:`. For `dropdown`/`toggle`/`checkbox`/`slider`, fires once per selection. For `input`, fires on every keystroke. The bound variable is already updated when the handler fires.

```igni
dropdown bind: country, options: countries, on change: update_region()
input bind: email, placeholder: "Email", on change: validate(email)
```

**Events go on the same line, not as indented children.** Multiple events can coexist: `layout vertical, on tap: select(), on touch: play("click.wav"):`.

## Arranging things

`layout vertical` → Column. `layout horizontal` → Row.

Properties: `gap`, `padding`, `align` (start/center/end), `spread: true`, `background`, `rounded`, `fill: true`.

`fill: true` makes a layout expand to fill remaining space in its parent:

```igni
layout vertical:
  label "Header"
  layout vertical, fill: true, align: center:
    label "Centered in remaining space"
```

Empty layouts can omit the trailing colon:

```igni
layout vertical, fill: true, background: red, on touch: play("note1.wav")
```

`fill: true` is **layout-only** — primitives (button, label, etc.) don't support it. Multiple `fill: true` siblings split space equally.

**Bottom-anchored CTA.** Put `fill: true` on every content section above the button. Sections share vertical space; the un-filled button sits at the bottom:

```igni
layout vertical, padding: large:
  layout vertical, fill: true:    # content
  layout vertical, fill: true:    # more content
  button "Save", color: brand     # anchors to bottom
```

### Background images

`background:` accepts colour names (unquoted) or image filenames (quoted strings):

```igni
layout vertical, background: red:              # colour
layout vertical, background: "sunset.jpg":     # image from images/
screen Destini, background: "background.png":  # full-screen image
```

Starts with `http` → network image. Otherwise → local file from `images/`. Content renders on top.

## Lists

```igni
items = items + [new_item]                    # append
items = without(items, target)                # remove (identity)
items = replace(items, old, new)              # swap (identity)
match = find(items, target)                   # identity find → item or null
match = find(items, item => item.id is x)     # predicate find → item or null
names = map(items, item => item.name)         # transform each → list
done = filter(items, item => item.done)       # predicate filter → list
by_name = sorted(items, item => item.name)    # sort ascending by key → list
rev = reversed(items)                         # reverse → list
n = length(items)                             # count of items
qty = count(items, target)                    # whole-value match only
crit = length(filter(alerts, a => a.level is "critical"))   # field-based: compose length + filter
```

Iteration: `each item in items:` followed by indented block.

**Updating one field on an item:**

```igni
toggle(target):
  items = replace(items, target, {target with done: not target.done})
```

`{BASE with KEY: VALUE, ...}` builds a new object with all of BASE's fields plus the overrides. BASE is a variable or dot-access chain (`target`, `item.profile`, `shared.cart`); function calls and indexing at the base are rejected. Multiple overrides are comma-separated: `{item with title: "x", done: true}`. Shallow only — nest explicitly for deep updates. `with` is a reserved keyword. Braces required; no bare-infix form.

The verbose `{text: target.text, done: true}` form is still legal — it's a regular object literal — but prefer `{target with done: true}` whenever you're copying-with-overrides.

> **Rule:** List elements cannot be mutated in place. Updates flow through reassignment of the whole list — `replace`, `without`, or the `each` rebuild loop.

## Functions

```igni
greet(name):
  return "hello " + name

total_price():
  total = 0
  each item in items:
    total = total + item.price
  return total
```

Defined inside screens/components. Close over surrounding state. No `def`/`func`/`fn` keyword. `each`, `if/else`, and `return` all work inside function bodies.

> **Rule:** Cross-screen function calls are NOT allowed. Functions defined in one screen are invisible to other screens connected by `navigate to`. For cross-screen state, use `shared:`.

**Lambdas** — single-expression, one parameter — used only as arguments to list builtins:

```igni
item => item.done
item => item.price * item.quantity
```

Not general-purpose; if you need a multi-line transformation, use a screen-internal function and call it from the lambda body or the surrounding code.

## Async

```igni
user = fetch("/api/user")

if user is loading:
  spinner
else if user is error:
  label "Failed"
else:
  label user.name
```

Mutations: `fetch(url, method: "POST", body: {title: draft})`.

Don't concatenate an `input bind:` variable into a fetch URL — it re-fires per keystroke. Set a separate trigger variable from an `on tap:` handler and fetch from that instead. (Full rules in the spec.)

### Device location

```igni
here = locate()

if here is loading:
  spinner
else if here is error:
  label "Couldn't get location"
else:
  label round(here.latitude, 4) + ", " + round(here.longitude, 4)
```

`locate()` returns an async value with `.latitude` and `.longitude` (decimal-degree floats). Same `is loading` / `is error` shape as `fetch()`. One-shot read; first call triggers the platform permission prompt; denial collapses into `is error`.

The fetch-URL rule above extends to `locate()` — don't concatenate `here.latitude` / `here.longitude` straight into a fetch URL. Capture coordinates via an `on tap:` trigger first, then fetch from that variable.

## Components

```igni
component Avatar(url, size):
  image url, size: size, round: true
```

Invocation: `Avatar user.avatar, size: 80` (no parentheses).
No-arg: `CartIcon` (name alone).

> **Rule:** Arguments to screens and components are immutable. To edit a value passed in, declare a local variable inside the body.

### Wrapper components

```igni
component Card(title):
  layout vertical, padding: medium, background: card:
    label title, style: heading.small
    body
```

`body` renders exactly one widget. Caller passes a single top-level element. For multiple children, caller wraps in `layout vertical:` or `layout horizontal:`:

```igni
Card "Settings":
  layout vertical, gap: small:
    toggle bind: dark_mode
    button "Logout", color: danger, on tap: logout()
```

### Component events

```igni
component Stepper(value):
  layout horizontal, gap: medium, align: center:
    button "-", shape: circle, on tap: emit decrement
    label value
    button "+", shape: circle, on tap: emit increment

# parent
Stepper weight, on increment: weight = weight + 1, on decrement: weight = weight - 1
```

`emit <name>` declares a custom event channel. Caller attaches with `on <name>:` — same vocabulary as `on tap:`. Action evaluates in parent scope.

`emit` is **only valid as the action of an event handler** (`on tap:`, `on touch:`, `on change:`). Standalone `emit X` is a parse error. Reserved names: `tap`, `change`, `touch`.

Event data: `emit selected item` → parent `on selected: handle(item)` (item is a named binding).
Optional: parent without `on <name>:` handler is fine — event no-ops.

## Navigation

```igni
navigate to Profile user
navigate back
```

## Shared State

```igni
shared:
  cart = []
```

Access from any screen: `shared.cart`. Same reactivity rule. `shared.` prefix is the visible coupling marker. **Use `shared:` only when multiple screens need the same data. Single-screen state is local.**

## Styling

`brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`.

Use directly with `color:` on primitives and `background:` on layouts and screens, or store them in variables first:

```igni
status_color = green
if failed:
  status_color = danger
label "Status", color: status_color
```

`card` is a background-only token (themed surface colour): `background: card`. Like other tokens it can be stored in a variable — but the background-only restriction applies wherever it's used, so `color: card` is an error.

Design tokens: `small` (8), `medium` (16), `large` (24).
Text styles: `heading`, `heading.small`, `body`, `caption`.

**Fonts:** a top-level `theme:` block overrides `style:` token fonts project-wide (patches, not replaces — omitted keys keep defaults):

```igni
theme:
  text:
    heading: font: pacifico
    body: font: source_sans
```

Bundle: `pacifico` (script), `inter` / `source_sans` (sans), `merriweather` / `lora` (serif), `fira_code` (mono). Per-label `font:` override is not available — typography is theme-level.

A bare `screen` has sensible defaults (padding, outlined input, intrinsic button width, neutral background). Explicit modifiers always win. See the full spec for the list.

## Local Images and Audio

Put files in `images/` or `audio/`, reference by name:

```igni
image "avatar.png", size: 80, round: true
image "https://example.com/photo.jpg", size: 100
play("note1.wav")
```

Starts with `http` → network image. Otherwise → local file. The toolchain handles asset registration.

## Builtins

**Strings:**

```igni
contains("Hello world", "world")   # true (case-insensitive)
upper("critical")                  # "CRITICAL"
lower("Hello")                     # "hello"
```

Store strings in their natural form; convert at the render site. No `capitalize` or `title_case`.

**Utility:**

```igni
result = random(1, 6)              # random integer, min to max inclusive
round(bmi, 1)                      # "21.5" — number to string, N decimals
play("sound.wav")                  # play audio from audio/ folder
print(count)                       # log to browser console (F12)
```

## Comments

```igni
# single-line comment
count = 0  # inline comment
```

## Rules (reference)

- Indentation-based scoping. Colons end any line that opens a block.
- One way to do everything. No aliases, no shortcuts, no alternatives.
- Types are inferred. Optional hints: `name: String = "Tyr"`, `items: [Item] = []`.
- Max nesting depth: 4 levels (`layout`/`screen`/`component` blocks count; conditionals and loops don't). Custom components reset the counter.
- Reactivity: each screen re-evaluates from the top when any variable it references is reassigned.
- List elements cannot be mutated in place. Updates flow through reassignment.
- UI primitives only render in screen or component bodies, never inside functions.
- Arguments to screens and components are immutable.
- Cross-screen function calls are NOT allowed. Use `shared:` for cross-screen state.
- Object identity is reference-based, not structural. Use lambdas for field-based matching.


---

## docs/tutorial.md (the artifact under review)

# Learn Igni

> Tutorial v2.5 · targets Igni v0.12.2

Build your first app, one small step at a time. No programming experience needed.

Every part: save the file (**Cmd+S** on Mac, **Ctrl+S** on Windows) and see the result in the browser.

**If something goes wrong:** check your spelling and indentation, then save again. If the browser doesn't change and the terminal shows red text, you've usually misspelled a name (for example `nam` instead of `name`). Fix it and save again.

---

## Before you start

> **Already set up?** If `igni run` is running and you have an empty `app.igni` open, skip to [Section 1](#section-1--hello-world).

You'll need:

1. **A text editor** — [Cursor](https://cursor.com) is free and works well.
2. **A terminal** — on Mac press **Cmd+Space**, type `Terminal`, press Enter. On Windows press the **Windows key**, type `Terminal`, press Enter.
3. **Chrome** — already on most computers.

In the terminal, type this and press Enter:

```bash
igni new learn-igni
cd learn-igni
igni run
```

A browser window opens showing a counter. Tap **Add** — the number goes up. Leave the terminal open; every save updates the browser. **Ctrl+C** stops the server when you're done.

**Prefer Safari, Firefox, or Arc?** Use `igni run localhost` — it prints a URL you can paste into any browser.

### Open the file

In Cursor: **File → Open Folder**, pick `learn-igni`. Click `app.igni` on the left. **Select everything and delete it** so the file is empty. You're ready.

---

## Section 1 — Hello World

### Part 1 — Show text on screen

Type this and save:

```igni
screen Hello:
  label "Hello World"
```

You see **Hello World** in the browser.

- `screen Hello:` creates a page called "Hello." The colon `:` means "here's what goes on this page."
- `label "Hello World"` shows text on the screen. The text inside the double quotes is what you see.

---

### Part 2 — Make it a heading

```igni
screen Hello:
  label "Welcome to my app!", style: heading
```

Save. The text is noticeably bigger. `style: heading` is what makes it big. Change the words in the quotes to anything you want — your name, a joke — and save again.

---

### Part 3 — Add a second line

```igni
screen Hello:
  label "Welcome to my app!", style: heading
  label "Made in Igni"
```

Both lines appear, one below the other. The first is big (because of `style: heading`), the second is normal size. Things stack top to bottom — add more lines whenever you want.

---

## Section 2 — About you

### Part 1 — Put something in a box

Make a box, put something in it, show what's inside:

```igni
screen Hello:
  name = "Sam"
  label name
```

Save. You see **Sam**.

- `name = "Sam"` makes a box called `name` and puts "Sam" inside.
- `label name` (no quotes) tells Igni to look **inside** the box and show what's there. That's why you see **Sam**, not the word "name".

A box with a name is called a **variable**.

Without the quotes, Igni looks inside the box. With quotes, it shows the letters literally:

```igni
label "name"
label name
```

`label "name"` shows the word **name**. `label name` shows **Sam**.

---

### Part 2 — Join things together

```igni
screen Hello:
  name = "Andy"
  age = 30

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save. You see **Hi, I'm Andy** and **I am 30 years old**.

- `+` joins pieces of text together.
- `age = 30` — no quotes around `30` because it's a number, not text.
- **Variables go at the top of the screen**, above the labels that use them.

---

### Part 3 — Make it yours

Clear out the placeholder values:

```igni
screen Hello:
  name = ""
  age = 0

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save — you'll see "Hi, I'm " and "I am 0 years old". That's the app without you in it.

Now put your name between the two quotes and change `0` to your age. Save. The screen greets you.

---

## Section 3 — Making decisions

Apps often show different things in different situations. That's what `if` and `else` are for.

### Part 1 — if and else

Start with `if` alone:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
```

You see **Welcome back, Robin!** Now change `name = "Robin"` to `name = "Taylor"` and save. **The label disappears entirely.** That's `if` on its own: show something when the check is true, show nothing when it's false.

Now add `else`:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
  else:
    label "Nice to meet you " + name
```

Flip `name` between "Robin" and "Taylor" and watch the message change.

- `if name is "Robin":` asks: "does `name` contain Robin?" The colon means "here's what to do if yes."
- `else:` means "otherwise."
- `is` asks if two things are the same. Careful: `=` puts something in a box; `is` asks if two things match.
- The lines below `if` and `else` are **indented** — that's how Igni knows they belong to the branch.

---

### Part 2 — Bigger, smaller, equal

Sometimes you want to compare sizes, not just exact matches. Igni uses the same symbols as maths:

- `age > 18` — "is age bigger than 18?"
- `age < 18` — "is age smaller than 18?"
- `age >= 18` — "is age 18 or bigger?"
- `age <= 18` — "is age 18 or smaller?"

Let's use `>=` to decide if someone is an adult:

```igni
screen Hello:
  age = 42

  # >= means "18 or bigger"
  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Change `age = 42` to `age = 10`. Save. It switches to **You are a child**.

A line starting with `#` is a **note** for you. Igni ignores it.

---

## Section 4 — Counter

### Part 1 — A counter with a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Save, then tap the button. The number goes up!

- `count = 0` — a box that starts at zero.
- `label count` shows whatever number is in the `count` box.
- `button "Add one"` — the text in quotes is what appears on the button.
- `on tap: count = count + 1` — when tapped, take `count`, add 1, put the result back.

Change `+ 1` to `+ 2` and save. Now the counter jumps by two each tap.

---

### Part 2 — A second button, side by side

```igni
screen Counter:
  count = 0

  layout horizontal, gap: small:
    button "Add one", on tap: count = count + 1
    # this button takes the count down
    button "Remove one", on tap: count = count - 1

  label count, style: heading
```

Two buttons in a row, with the number below them.

- `layout horizontal:` puts things side by side instead of stacking them. Everything indented under it goes in the row.
- `gap: small` adds space between the buttons.

**Try this:** add a third button labelled "+10" that adds ten to the count. Keep it in the same row.

---

### Part 3 — Make it look nice with layout vertical

`layout horizontal:` puts things in a row. `layout vertical:` stacks them top-to-bottom — with modifiers to control spacing and alignment:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large, align: center:
    label count, style: heading
    layout horizontal, gap: small:
      button "Add one", on tap: count = count + 1
      button "Remove one", on tap: count = count - 1
```

Save. Same counter, centred on the page with breathing room.

- `gap: medium` — space between the label and the row.
- `padding: large` — space around the whole thing.
- `align: center` — centres everything horizontally.

---

## Section 5 — Greeter

### Part 1 — Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
```

Type your name into the text box. You see your letters appear as you type, but nothing else happens yet.

- `name = ""` — a box that starts empty.
- `input bind: name` — a text box connected to the `name` box. Whatever you type goes in.
- `placeholder: "..."` — the grey hint text shown before you type.

---

### Part 2 — Greet them back

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name. The greeting updates letter by letter as you type.

---

### Part 3 — Checkpoint

Put Section 3 and this section together. A text box that greets you, or asks for your name if you haven't typed one:

```igni
screen Greeter:
  name = ""

  layout vertical, gap: large:
    input bind: name, placeholder: "What is your name?"

    if name is empty:
      label "Type your name above"
    else:
      label "Hello, " + name
```

When you open the page, you see "Type your name above." Start typing — the hint is replaced with "Hello, [your name]."

`is empty` is a shortcut for "has no content yet" — handy for boxes that start as `""`.

---

## Section 6 — ScoreBoard

A **function** is a named list of steps. Reach for one when a button does several things and you want to name that combination.

### Part 1 — Set up the screen

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
```

Save. You see a big **0** and nothing beneath it (because `message` is empty). No buttons yet; we'll add them next.

---

### Part 2 — Win button

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()

  win():
    score = score + 1
    message = "Nice one!"
```

Tap **Win** — the score goes up and "Nice one!" appears. One tap, two things happen.

- `win():` creates a function called "win." The parentheses and colon always come together. Functions go at the bottom of the screen.
- `on tap: win()` — when tapped, run every step inside `win`.
- `layout horizontal, gap: small:` — we set up the row now so we can add a second button without rearranging.

---

### Part 3 — Lose button

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()
    button "Lose", on tap: lose()

  win():
    score = score + 1
    message = "Nice one!"

  lose():
    score = score - 1
    message = "Try again!"
```

Second button in the row, second function at the bottom. Tap **Lose**: score goes down, message changes.

---

### Part 4 — Reset button

Rather than editing `score = 0` by hand every round, add a Reset button:

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()
    button "Lose", on tap: lose()
  button "Reset", on tap: reset()

  win():
    score = score + 1
    message = "Nice one!"

  lose():
    score = score - 1
    message = "Try again!"

  reset():
    score = 0
    message = ""
```

Tap Win a few times, Lose once, then Reset. Everything goes back to zero. Reset sits on its own line — it doesn't belong in the Win/Lose row because it's a different kind of button.

---

## Section 7 — Weather

You've used text and numbers. There's a third kind of value: **yes-or-no**, written `true` and `false`.

### Part 1 — if/else with true/false

```igni
screen Weather:
  raining = true

  if raining:
    label "Bring an umbrella"
  else:
    label "Enjoy the sun"
```

Save — you see **Bring an umbrella**. Flip `raining = false` and save — now **Enjoy the sun**.

- `raining = true` — a box holding `true`. No quotes; it's not text.
- `if raining:` reads as "if raining is true." The box itself is the answer — no comparison needed.

---

### Part 2 — else if for a second check

What if it's snowing instead of raining? Use `else if`:

```igni
screen Weather:
  raining = false
  snowing = true

  if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — **Snow day**. The `if raining:` check was false, so Igni tried `else if snowing:`, which was true.

`else if` lets you check another thing if the first was false. You can chain as many as you need.

---

### Part 3 — and for combining

Sleet is raining AND snowing at the same time. Use `and`:

```igni
screen Weather:
  raining = true
  snowing = true

  if raining and snowing:
    label "Sleet! Bundle up."
  else if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — **Sleet! Bundle up.** Both are true, so the first check wins.

`raining and snowing` is only true when both are true.

---

## Section 8 — Dice Roller

Let's build something real.

### Part 1 — Set up the state

```igni
screen DiceRoller:
  result = 0
  rolled = false
```

Save. Blank screen — no UI yet. `result` is the box for the dice number. `rolled` tracks whether the player has tapped Roll yet.

---

### Part 2 — Show the heading

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading
```

Now you see the title, centred with spacing.

---

### Part 3 — Show the result or prompt

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading

    if rolled:
      label "You rolled:"
      label result, style: heading
    else:
      label "Tap Roll to start!"
```

Save — you see **Tap Roll to start!** because `rolled = false`. Flip `rolled = true` by hand and save — you see **You rolled:** and **0**.

---

### Part 4 — Roll button + function

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading

    if rolled:
      label "You rolled:"
      label result, style: heading
    else:
      label "Tap Roll to start!"

    button "Roll", on tap: roll()

  roll():
    result = random(1, 6)
    rolled = true
```

Tap **Roll** — a number between 1 and 6 appears. Tap again for a new number.

- `random(1, 6)` — picks a random number between 1 and 6.
- `rolled = true` — flip the box so the screen shows the number instead of the prompt.

A working dice roller in 15 lines. You built an app.

**Try this:** change `random(1, 6)` to `random(1, 20)` for a D20, or `random(1, 100)` for a guessing game.

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `label name` | Shows what's in the `name` box |
| `name = "Robin"` | Creates a box with text inside |
| `count = 0` | Creates a box with a number inside |
| `rolled = false` | Creates a box with true or false inside |
| `"text" + name` | Joins things together |
| `age >= 18`, `name is "Robin"` | Asks a question |
| `if / else if / else:` | Branches |
| `a and b` | Both must be true |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Stacks things with spacing |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

## What to build next

Some ideas:

- **A tip calculator.** Input for the bill, a slider for the tip percentage, a label for the total. Uses comparisons, inputs, and arithmetic.
- **A shopping list.** Input for new items, a button to add them, a label counting the total. Next step: **lists** in the cheatsheet.
- **A quiz game.** A question, four buttons for answers, a score that goes up when the right one is tapped.
- **Rock Paper Scissors.** You've got almost everything — except function parameters (one new concept). Starter:

  ```igni
  screen RPS:
    result = ""

    layout vertical, gap: medium, padding: large, align: center:
      label result, style: heading
      layout horizontal, gap: small:
        button "Rock", on tap: play("Rock")
        button "Paper", on tap: play("Paper")
        button "Scissors", on tap: play("Scissors")

    play(choice):
      result = "You picked " + choice
  ```

  Save and tap a button. Extend `play(choice)`: pick a computer choice with `random(1, 3)`, compare to `choice`, and set `result` to who won. The cheatsheet has how to pass arguments.

When you're ready for more, the **cheatsheet** has every Igni feature in one place.
