# Igni v0.20.0 — Cheat Sheet (Stage 0 draft)

UI-first language. Reads like a design spec, compiles to Flutter. No imports, no classes, no boilerplate.

**v0.20 additions** *(folded into the relevant sections below):*
- **Theme dark-mode propagation** — `theme: scaffold:` / `theme: appbar:` / `theme: text:` structural sub-blocks for chrome; `theme dark:` variant pair; `shared.theme_mode: system | light | dark` runtime selector with auto-fall-back for missing dark tokens.
- **Wider spacing tokens** — `spacing/1` through `spacing/8` numeric scale (4/8/12/16/20/24/32 px); existing `small` / `medium` / `large` word tokens are aliases for the most common rungs.

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

**Derived state needs a function, not a top-level `=`.** Because top-level assignments run once, `derived = base * 2` *captures* `base`'s initial value — it does not track changes to `base`. To compute a value that follows reactive state, define a function: `total(): return count * price`. Calls inside the rendering part (`label total()`) re-evaluate whenever any state read inside the function is reassigned. Reactivity follows references through function calls.

> **Common mistake.** This is the #1 reactivity footgun for readers coming from React / Vue / Svelte / Solid:
>
> ```igni
> # ❌ wrong — total captures count * price ONCE; never updates
> count = 1
> price = 9.99
> total = count * price       # ← top-level `=`, runs once
>
> # ✅ right — total() re-evaluates whenever count or price changes
> count = 1
> price = 9.99
> total():
>   return count * price
> ```
>
> If the layout reads `total` (the variable), it shows the initial value forever. If it reads `total()` (the function), it tracks `count` and `price`. Top-level assignment captures; functions track.

**Reach is transitive — and only fires when something reads.** A layout that calls a function that reads `tick` re-renders when `tick` changes, the same as if the layout read `tick` directly. The corollary: reassigning a variable that *nothing* in the layout reads (directly or transitively) is a no-op for the UI by design — `every 1s: debug_count = debug_count + 1` runs every second but renders nothing if no `label` reads `debug_count`. If you want an `every` block to drive UI updates, ensure the layout (directly or via a function call) reads the variable being updated.

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
List indexing: `items[0]`, `items[index]`. Zero-based. Returns `null` on out-of-bounds. Chained access on null **propagates null** (no crash): `questions[bad_index].text` evaluates to null. Canonical pattern: gate at the conditional (`if i < length(items): label items[i].text`), not defensive `if x is not null:` chains at every access.

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

`is` checks equality: `name is "Tyr"`, `count is 0`, `weather is null`. Negate: `is not`.

> **Equality is structural for primitives, reference for objects and lists.** `"a" is "a"` is true; `1 is 1` is true. But `{name: "a"} is {name: "a"}` is **false** — they're separately-built objects. Same for lists. The trap: `without(items, {id: 42})` against a list of objects silently fails (the new object literal doesn't match the existing reference); for field-based matching, use `filter(items, item => item.id is not 42)` or `find(items, item => item.id is target.id)`.

Special forms: `is empty`, `is not empty`, `is loading`, `is error`, `is null`, `is not null`.
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

**Binding to shared state.** `slider`, `toggle`, `checkbox`, and `dropdown` accept `shared.X` directly. The reassignment auto-wraps in `shared.update()` so other screens watching that field re-render. Use this for settings screens that mutate `shared:` state without local-var-plus-`on change:` boilerplate.

```igni
input bind: email, placeholder: "Email"
toggle bind: dark_mode
slider bind: shared.volume, min: 0, max: 100        # shared.X works on
toggle bind: shared.sound_on, label: "Sound"        # slider/toggle/checkbox/dropdown
```

> **`input` is the exception.** Igni's `input` backs onto a Flutter `TextEditingController` that needs a stable local identifier — `input bind: shared.X` is rejected at parse time. Bridge via a local variable and `on change:`:
> ```igni
> draft = shared.title
> input bind: draft, on change: shared.title = draft
> ```

**Events.** All input primitives (and any layout / component) accept `on tap:` and `on touch:`. Primitives with `bind:` additionally accept `on change:` for side effects when the bound value changes.

```igni
on tap: save()                     # fires on release (confirmed action)
on tap: count = count + 1          # inline assignment
on tap: navigate to Detail item    # navigation
on touch: play("note1.wav")        # fires on contact (instant response)
```

`on tap:` for buttons, navigation, list items. `on touch:` for instruments, games — when latency matters.

**`on change:` fires when a *user-driven* primitive change reassigns a bound variable.** For side effects — updating a dependent variable, validating input. Attaches to any primitive with `bind:`. The bound variable is already updated when the handler fires. `dropdown`/`toggle`/`checkbox`/`slider` fire once per selection; `input` fires on every keystroke.

Programmatic reassignment (a Reset button, an `every` block, another function) re-renders but does NOT fire `on change:` — the handler is for user input only.

```igni
dropdown bind: country, options: countries, on change: update_region()
input bind: email, placeholder: "Email", on change: validate(email)
```

**Events go on the same line, not as indented children.** Multiple events can coexist: `layout vertical, on tap: select(), on touch: play("click.wav"):`.

## Arranging things

`layout vertical` → Column. `layout horizontal` → Row.

Properties: `gap`, `padding`, `align` (start/center/end), `spread: true`, `background`, `max_width`, `rounded`, `border`, `fill: true`.

**Layout properties go on a single line — no `\` line-continuation.** A long property list stays on one physical line; if it gets uncomfortably long, factor the layout into a custom component. Igni's lexer rejects backslash-continuation as a syntax error.

**`fill: true`** expands a layout to fill remaining space in its parent along the parent's main axis (height for `layout vertical`, width for `layout horizontal`). Layout-only — primitives don't support it. Multiple `fill: true` siblings split that space equally. Empty layouts may omit the trailing colon.

```igni
layout vertical:
  label "Header"
  layout vertical, fill: true, align: center:
    label "Centered in remaining space"
```

**`max_width:`** caps a layout at one of three tokens: `phone` (480px) / `tablet` (768px) / `desktop` (1200px). Omitting it is uncapped. Tokens only — `max_width: 540` is invalid. The cap includes padding/background. Composes with `fill: true`: capped siblings freeze at their cap; uncapped `fill: true` siblings split the remaining space.

```igni
# Centered card, capped at 480px
layout vertical, align: center, max_width: phone, padding: medium, background: card, rounded: medium:
  label "MiCard", style: heading
  label "+44 123 456 7890"
```

```igni
# Two siblings sharing a row: left capped at tablet (768px), right takes remaining space
layout horizontal, gap: medium:
  layout vertical, fill: true, max_width: tablet:
    label "Article body, capped at 768px even on a wide window"
  layout vertical, fill: true:
    label "Sidebar, takes whatever's left"
```

**Bottom-anchored CTA.** Put `fill: true` on every content section above the button. Sections share vertical space; the un-filled button sits at the bottom:

```igni
layout vertical, padding: large:
  layout vertical, fill: true:    # content
  layout vertical, fill: true:    # more content
  button "Save", color: brand     # anchors to bottom
```

### Border

`border:` outlines a layout. Width tokens: `thin` / `medium` / `thick`. Colour resolves through theme — same rule as `color:` elsewhere in the spec.

```igni
# Default — uses the theme's border colour
layout vertical, padding: medium, rounded: medium, border: thin:
  label "Notifications"
  label "Get alerts when X happens", style: caption

# Explicit theme colour
layout vertical, padding: medium, rounded: medium, border: thin, color: brand:
  label "Premium plan"
```

Composes with `rounded:` (border follows the rounded corners) and `background:` (border draws on top of fill — both can be set). Use it where the design draws an outline — outlined cards, selected radio-tiles, distinct-edge containers. Don't sprinkle `border:` on layouts that don't need an outline.

**Selected-state pattern.** Selection signals through both width and colour — either alone is ambiguous. Use one screen-internal function per axis: `border: width_for(method), color: color_for(method)`, each returning `thick`/`thin` or `brand`/`subtle` based on `method is shared.selected`.

Inline pixel values (`border: 1px`), numeric width tokens (`border: 1`), and inline hex on `color:` are rejected — tokens only.

**Outlined buttons.** `border:` is a layout property, not a button modifier — wrap a `button` in a bordered layout:

```igni
layout vertical, rounded: medium, border: thin:
  button "Sign Out", on tap: sign_out()
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
# query
match = find(items, target)                   # identity find → item or null
match = find(items, item => item.id is x)     # predicate find → item or null
n = length(items)                             # count of items
qty = count(items, target)                    # whole-value match only
crit = length(filter(alerts, a => a.level is "critical"))   # field-based: compose length + filter

# transform
names = map(items, item => item.name)         # transform each → list
done = filter(items, item => item.done)       # predicate filter → list
by_name = sorted(items, item => item.name)    # sort ascending by key → list
rev = reversed(items)                         # reverse → list

# mutation (returns new list — assign back)
items = items + [new_item]                    # append
items = without(items, target)                # remove (all matches)
items = replace(items, old, new)              # swap (all matches)
```

`without` removes every element equal to `target`; `replace` swaps every match. In the common case (`target` is a loop variable from `each`), only one element matches by reference, so multiplicity rarely surfaces — but for a list of primitives, `replace([1, 2, 1], 1, 99)` returns `[99, 2, 99]`.

Iteration: `each item in items:` followed by indented block.

**Updating one field on an item:**

```igni
toggle(target):
  items = replace(items, target, {target with done: not target.done})
```

`{BASE with KEY: VALUE, ...}` builds a new object with all of BASE's fields plus the overrides. BASE is a variable or dot-access chain (`target`, `item.profile`, `shared.cart`); function calls and indexing at the base are rejected. Multiple overrides are comma-separated: `{item with title: "x", done: true}`. Shallow only — nest explicitly for deep updates. `with` is a reserved keyword. Braces required; no bare-infix form.

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

> **Rule:** Variables read outside a block must be declared at the top of the screen body. The accumulator pattern above (`total = 0` declared first, then mutated inside `each`) is the canonical shape — assigning a name first inside an `if` or `each` and reading it after is rejected with a "declare at the top of the screen body" hint.

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

**Reactive re-fetch.** A `fetch()` call re-runs whenever any variable in its arguments — URL, `method:`, `body:` — is reassigned (same rule as §Reacting to users). `user = fetch("/api/user/" + user_id)` automatically re-fetches when `user_id` changes; same for `locate()`-derived inputs.

Don't concatenate an `input bind:` variable into a fetch URL — it re-fires per keystroke. Set a separate trigger variable from an `on tap:` handler and fetch from that instead.

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

## Recurrence

A screen can run a block of code on a recurring schedule via `every <duration>:`. Body is the same shape as a function body — statements, `if`/`else`, assignments, function calls. Reassigning state inside the block re-renders the screen (§Reacting to users).

```igni
screen Clock:
  tick = now()

  every 1s:
    tick = now()

  layout vertical, padding: large:
    label tick, style: heading
```

**Lifecycle.** The block fires while the screen is mounted and visible. It pauses on navigate-away and resumes on return. Missed ticks are NOT replayed — navigating away for ten seconds fires the block once on return, not ten times. **On return, the next tick is scheduled `<duration>` from the resume moment** — not from the original schedule, not immediately. Top-level captures (e.g. `start_time = now()`) don't re-fire on revisit; they ran once when the screen first opened.

**Wall-clock-correct timers.** For countdowns and elapsed-time UIs, capture timestamps with `now()` (integer seconds since epoch UTC) rather than decrementing a counter. The relative-decrement pattern (`remaining = remaining - 1`) loses elapsed seconds when the screen unmounts; the absolute-timestamp pattern reads correct wall-clock time on every tick:

```igni
screen Stopwatch:
  start_time = now()
  tick = now()

  every 1s:
    tick = now()

  layout vertical, padding: large:
    label tick - start_time, style: heading        # elapsed seconds
```

For pause/resume across navigation, accumulate elapsed-on-pause and add it to `tick - start_time` while running. See `transpiler/examples/pomodonut/app.igni` for the full Pomodoro shape.

**Multiple blocks per screen.** A screen may declare multiple `every` blocks at different rates — for example, `every 1s:` for a countdown UI and `every 5s:` for an auto-save. Each block is independent.

```igni
screen NoteEditor:
  draft = ""
  last_saved = 0
  saved_seconds_ago = 0

  every 1s:
    saved_seconds_ago = now() - last_saved

  every 5s:
    if draft is not empty and now() - last_saved > 5:
      save(draft)
      last_saved = now()

  layout vertical:
    input bind: draft
    label saved_seconds_ago
```

**Durations.** Whitelist: `16ms` / `100ms` / `500ms` / `1s` / `5s` / `30s`. Other tokens (`50ms`, `1m`, `1h`, `2s`) and numeric durations (`every 2:`, `every 1.5:`) are rejected at parse time. The `16ms` rung is the animation-loop primitive (60 Hz frame rate); `100ms` is the typical UI tick; `500ms` is for twitch-rate updates (loading dots, pulse animations). Sub-second tokens compose with the `mock every:` test primitive (see §Testing) — `advance <duration>` jumps simulated time and fires due `every` blocks proportionally.

**Slow `fetch()` inside `every`.** If a fetch inside an `every` block takes longer than the tick interval, the next tick is **skipped** until the previous fetch completes. No queue, no concurrency, no abort. Periodic polling becomes "every interval, *or* however long the previous took, whichever is longer" — predictable, no resource drift.

## Components

```igni
component Avatar(url, size):
  image url, size: size, round: true
```

Invocation: `Avatar user.avatar, size: 80` (no parentheses).
No-arg: `CartIcon` (name alone).

> **Rule:** Arguments to screens and components are immutable. To edit a value passed in, declare a local variable inside the body.

**Components re-evaluate with their parent** (same rule as §Reacting to users). No per-arg memoisation — passing the same value to a re-rendering parent doesn't skip the rebuild. For expensive work, lift it to the parent and pass the result in.

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

**Event data.** `emit X v` passes a single positional value; the parent names the receiver in parens. Pack multiple values into an object.

```igni
component SearchBar(placeholder_text):
  text = ""
  layout horizontal:
    input bind: text, placeholder: placeholder_text
    button "Go", on tap: emit submit text

# parent
SearchBar "Search", on submit(query): results = fetch("/api/search?q=" + query)
```

**Mismatch is rejected.** The child's `emit` signature and the parent's handler signature must agree — value-emit + bare `on X:` is rejected (use `on X(_):` to ignore explicitly); valueless-emit + `on X(name):` is rejected; same event emitted both with and without payload is a compile-time error. Reserved events (`tap`/`change`/`touch`) stay payload-less. A parent without an `on <name>:` handler is fine — the event no-ops.

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

`shared:` blocks across multiple files **compose into a single namespace** — `auth.igni` declaring `shared: user` and `cart.igni` declaring `shared: items` makes both `shared.user` and `shared.items` available everywhere. **Same name in two files is a build-time error**, with both file locations in the message — same-name collisions are exactly the hidden-coupling failure mode the prefix was designed to prevent.

## Styling

### Colour tokens

Built-in: `brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`.

Use directly with `color:` on primitives and `background:` on layouts and screens, or store them in variables first:

```igni
status_color = green
if failed:
  status_color = danger
label "Status", color: status_color
```

`card` is a background-only token (themed surface colour): `background: card`. Like other tokens it can be stored in a variable — but the background-only restriction applies wherever it's used, so `color: card` is an error.

Text styles: `heading`, `heading.small`, `body`, `caption`.

### Spacing tokens (v0.20)

Two equivalent surfaces — pick whichever reads cleanly in context:

- **Word tokens (semantic shortcuts)** — `small` (8 px), `medium` (16 px), `large` (24 px).
- **Numeric scale** — `spacing/1` (4 px), `spacing/2` (8 px), `spacing/3` (12 px), `spacing/4` (16 px), `spacing/5` (20 px), `spacing/6` (24 px), `spacing/8` (32 px). Multiply N by 4 to get pixels.

`small` = `spacing/2`. `medium` = `spacing/4`. `large` = `spacing/6`. Cheatsheet teaches numeric for fine-grained Figma translation; word tokens for semantic shorthand. Same effect either way.

Used by `gap:`, `padding:`, `rounded:`, and `size:` properties. Numeric `gap: 12` is **not** valid — token-only discipline preserved.

```igni
layout vertical, padding: spacing/3, gap: spacing/2:
  label "12 px outer padding, 8 px between rows"
```

```igni
# Equivalent
layout vertical, padding: medium, gap: small:
  label "16 px outer padding, 8 px between rows"
```

### Theme block (v0.20 expanded)

A top-level `theme:` block overrides built-in tokens project-wide (patches, not replaces — omitted keys keep defaults). v0.20 widens the block with **structural sub-blocks** for chrome (`scaffold:`, `appbar:`, `text:`) alongside the existing `color:` (palette) and `text:` font sub-block:

```igni
theme:
  color:
    brand: "#FF6B35"             # override built-in
    primary_700: "#1D4ED8"       # user-defined token, used as color: primary_700
    surface_elevated: "#F5F5F5"
  text:
    heading: font: pacifico
    body: font: source_sans
  scaffold:
    background: surface_elevated   # references colour token
  appbar:
    background: surface_elevated
    foreground: brand
```

Font bundle: `pacifico` (script), `inter` / `source_sans` (sans), `merriweather` / `lora` (serif), `fira_code` (mono). Per-label `font:` override is not available — typography is theme-level.

`theme: color: <token>: "<hex>"` overrides a built-in or declares a new user-defined token. Custom token names match `[a-z][a-z0-9_]*` and cannot collide with Igni keywords, primitives, or other built-in tokens. Hex values are `"#RRGGBB"` only — shorthand `"#RGB"` is a parse error.

**Structural sub-blocks** (`theme: scaffold:` / `theme: appbar:`) hold framework-chrome defaults — what the app's window-frame looks like before any screen-level overrides. Their values reference colour tokens (defined in `theme: color:` above).

`card` is grandfathered as background-only — overriding it via `theme: color: card: "#X"` updates the surface but `card` stays foreground-rejected. User-defined tokens work in both `color:` and `background:` positions.

> **Inline hex codes are rejected** outside `theme:`. `color: "#FF0000"` and `background: "#FFFFFF"` are parse-time errors — define a `theme: color:` token and use it by name. The all-tokens-go-through-theme rule keeps colour decisions traceable to one place.

### Dark mode (v0.20)

Dark mode is a **variant pair**. Add a sibling `theme dark:` block that mirrors `theme:`. Tokens missing in the dark variant **auto-fall-back** to the light value (so brand colours that don't change between modes only need declaring once):

```igni
theme:
  color:
    brand: "#80CBC4"
    surface: "#FFFFFF"
    text: "#0D0D14"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"   # different in dark
    text: "#F5F5F5"
    # `brand` not declared here → inherits "#80CBC4" from light variant
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text
```

The active variant is selected at runtime via a built-in `shared.theme_mode` string. Three accepted values: `"system"` (default — follows OS appearance), `"light"` (force-light), `"dark"` (force-dark):

```igni
shared:
  theme_mode = "system"   # default — follows OS appearance
  # theme_mode = "light"  — force-light regardless of OS
  # theme_mode = "dark"   — force-dark regardless of OS
```

When `"system"` is active, the variant follows `MediaQuery.platformBrightnessOf` from the OS; assignment to `"light"` or `"dark"` overrides. Comparison via `is`: `if shared.theme_mode is "dark":`. Other values are runtime errors. Strings (not bare identifiers) keep the lexer unambiguous — `dark` in the value position would collide with the `theme dark:` block keyword.

> **Token references resolve through the active variant.** `border: thin, color: subtle` flips colour when `shared.theme_mode` flips. `background: card` (and any other theme-token reference) resolves through the same path. Any screen that references theme tokens implicitly depends on the active variant — reassigning `shared.theme_mode` triggers re-render of every screen reading theme tokens. The OS-appearance change is treated the same way.

> **Theme switches are instant.** `transition: fade` does **not** apply to top-level theme switches — variants snap synchronously. To animate a theme switch, build it explicitly with existing primitives (e.g., conditional render with `transition: fade` on a screen-level `if shared.theme_mode is "dark":`). That's source-visible, not magic.

Forward-compat: the same `shared.<X>_mode` pattern is reserved for v0.21 accessibility primitives (`shared.contrast_mode`, `shared.motion_mode`). Variant resolution routes through one shared mechanism so future modes don't reopen the design.

### Defaults

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

> **Case asymmetry.** `contains()` is case-insensitive (`contains("Hello", "hello")` is `true`). `is` equality is case-sensitive (`"Hello" is "hello"` is `false`). When you need a case-insensitive *equality* check, write `lower(a) is lower(b)`. The asymmetry is the rule, not the bug.

**Utility:**

```igni
result = random(1, 6)              # random integer, min to max inclusive
round(bmi, 1)                      # "21.5" — number to STRING, N decimals — display only
floor(s / 60)                      # 24 — largest integer ≤ x; pairs with `/` for time math
play("sound.wav")                  # play audio from audio/ folder
print(count)                       # log to browser console (F12)
seconds = now()                    # integer seconds since 1970-01-01 UTC
```

`now()` is **non-reactive**. A bare `now()` reference does NOT cause re-evaluation — capturing `start = now()` runs once when the screen first opens, just like any other top-level assignment. To re-read the wall clock periodically, call `now()` from inside an `every <duration>:` block. Returns integer seconds — no sub-second precision, no timezone awareness, no monotonic-clock distinction.

`round(x, n)` returns a **string**, not a number — it is for *display formatting only*. Do not use it in numeric comparisons. The expression `if elapsed >= round(60, 1)` typechecks but compares an integer against the string `"60.0"` — the comparison is silently wrong. For numeric rounding use `floor()` (integer math) or compare against the unrounded value directly.

## Animation

Two primitives, one for each kind of "thing changes": **`transition: <token>`** for swaps between conditional renders, **`spring(value)`** for smooth value interpolation. They never overlap — each shape has one canonical answer.

### Transition between conditional states

```igni
screen Login:
  user = fetch("/api/user/me")

  layout vertical, padding: large, gap: medium, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      label "Couldn't load — try again"
    else:
      label "Welcome, " + user.name, style: heading
```

`transition: fade` (or `transition: slide`) on a layout fades/slides the swap whenever the layout's immediate child set changes — when an `if`/`else if`/`else` resolves to a different branch, or when an `each` adds/removes items.

**Token-only.** v0.19 ships `fade` and `slide` only. No per-call duration argument (`transition: fade 200ms` is rejected); system-default duration. Matches the v0.17 `border:` width-token discipline (`thin`/`medium`/`thick`, no `border: 1px`).

**Compiler rejection.** `transition:` is only valid on a container whose immediate dynamic child set changes through `if`/`else` or `each` insertion/removal. If you put `transition: fade` on a layout that only has a value changing (e.g. a `label` whose text reassigns), the compiler errors with: *"Use `spring(value)` for changing values; `transition:` only animates child replacement."* — pointing you at the right primitive.

**Third-state interrupts.** If a fade is in flight from `loading → loaded` and the state jumps to `error` mid-transition, the in-flight fade interrupts and a new fade starts toward the error branch. The codegen `AnimatedSwitcher` keys by branch identity (not by child type or text), so distinct branches are tracked correctly even when their rendered children look similar.

**Branch shape.** Each `if`/`else if`/`else` branch can hold either a single primitive (`spinner`, `label "..."`) or multiple siblings — multi-child branches auto-wrap in a Column-min during codegen, so writing flat siblings inside `else:` and writing `layout vertical:` to wrap them are equivalent shapes. Pick whichever reads cleaner.

**`each` reordering.** Inserts and removals trigger the fade; reordering existing items is a no-op visually — keys hold steady, so `AnimatedSwitcher` sees no replacement. If you want a reorder-driven animation, that's `spring()` on a per-row value, not `transition:`.

### Smooth value animation

```igni
screen StepCounter:
  target_steps = 0
  displayed_steps = spring(target_steps)

  layout vertical, gap: medium, padding: large, align: center:
    label displayed_steps, style: heading
    button "Add 100", on tap: target_steps = target_steps + 100
```

`spring(value)` returns a value that smoothly animates toward `value` whenever `value` is reassigned. The reactive boundary is the same as everywhere else — `target_steps` reassigns, the screen re-evaluates, `spring` re-targets and interpolates from its current frame to the new target.

**`spring()` is a read-only animated mirror, not state.** Reassigning to a `spring()`'d binding is an error — the binding shadows its source variable, which is what you mutate. To change the animated value, reassign the underlying state (`target_steps = ...`); `spring` follows.

**Interpolatable types.** `spring()` accepts numbers and lengths (and colours at codegen, when supported). `spring("hello")` or `spring(some_object)` errors with: *"Use `transition: fade` on a conditional render instead."* — pointing you at the right primitive for non-interpolatable changes.

**Reduced motion.** When the OS's reduced-motion accessibility setting is enabled, `spring()` collapses its duration to zero — the target value is applied immediately. No code change needed; the runtime honours the setting at codegen.

**Inside `each`.** When `spring()` is used per-row inside an `each`, the spring's animation state is keyed by **row identity**, not list index. Reordering, filtering, or inserting items doesn't reset or jump per-row springs:

```igni
each item in notifications:
  layout horizontal, gap: small:
    label item.message
    label spring(item.recency * 100)
    # spring tracks item.recency per row;
    # reorder keeps each row's animation state attached to its own item.
```

Iterate over the items, not their indices, when per-row springs matter — `each i in 0..notifications.length:` would bind the spring to the index, and reordering would animate wrong values.

**`spring()` consumers.** The canonical consumer is `label`. `spring()` lowers to a `TweenAnimationBuilder` that wraps the rendered text. Layout-dimension animation (`width: spring(...)`, `height: spring(...)`) is not yet supported — Igni's layout properties are token-only per the `border:` / `max_width:` discipline.

### What `transition:` and `spring()` don't do

No imperative duration / curves (`transition: fade 200ms ease-out`, `spring(value, stiffness: 0.8)`). No scroll-driven, gesture-driven, or layout-property animation. No custom `cubic-bezier(...)`. No lifecycle hooks (`once:` / `on appear:`). Token-only on `transition:`; system spring defaults on `spring()`.

## Testing

Tests live in sibling `*.test.igni` files alongside source. `igni test` discovers them recursively from project root and runs them; `igni build` excludes them by extension. No configuration.

```igni
# Login.test.igni — sibling to Login.igni

test "login form shows error on invalid email":
  render Login
  change email_input: "not-an-email"
  tap "Sign in"
  expect seen "Please enter a valid email"

test "valid login navigates to dashboard":
  render Login
  change email_input: "user@example.com"
  change password_input: "correct-horse-battery-staple"
  tap "Sign in"
  expect on Dashboard
```

A `test "<name>":` block contains a sequence of statements: assignments, `render`, event-sims, `expect` assertions. The body has no scopes — what you assert on tells the reader what's tested.

**Function reachability.** `render <Screen>` puts the screen's internal functions in test scope — production's "cross-screen function calls are NOT allowed" rule is overridden inside test bodies, source-visible at the call site. Without a prior `render`, calling a screen-internal function is a parse-time error. Render once and assert across many inputs:

```igni
test "format_currency handles edges":
  render Cart
  expect format_currency(1234.56) is "£1,234.56"
  expect format_currency(0) is "£0.00"
  expect format_currency(0.5) is "£0.50"
```

**Render.** `render <Screen>` (no parens) for screens; `render <Component>, arg: value` for components with arguments. Mirrors the existing component-invocation no-parens style. Optional `shared.X: value` arg form pre-sets shared state:

```igni
test "Dashboard shows the user's name":
  render Dashboard, shared.user: {name: "Tyr", email: "tyr@example.com"}
  expect seen "Tyr"
```

**Event simulation.** Verb + selector. Selector for buttons is the visible text; for inputs / toggles / sliders it's the `bind:` variable name.

```igni
tap "<exact button label>"        # tap a button by visible text
change <input-id>: <new value>    # update an input's bound variable
submit <input-id>                 # fire the input's submit handler
toggle <toggle-id>                # flip a toggle
slide <slider-id> to <value>      # set a slider's value
```

Event-sims require a prior `render` in the same test body — checked at parse time. If `tap "<label>"` matches more than one visible target, runtime error: `ambiguous selector — N elements match "<label>"`. Rename one of the targets (or, in v0.19+, narrow with `tap "<label>" in <region>`).

**Assertions.** Single canonical form: `expect <bool-expression>`. Examples:

```igni
expect items.length is 0                    # state assertion
expect items is empty                       # state assertion via builtin
expect seen "No tasks yet"                  # rendered-output content match
expect not seen "Add"                       # negation via existing `not` operator
expect value_of(email_input) is ""          # input-value inspection
expect on Dashboard                         # current-screen assertion
expect requested("/api/users")              # was this URL fetched?
expect request_count("/api/users") is 1     # how many times?
```

There is **no matcher API** (`expect(x).toBe(y)` chains). Test-scope predicates compose with the language's existing `is` / `is in` / `is empty` / `not` operators.

Test-scope verbs (`seen`, `tap`, `change`, `submit`, `toggle`, `slide`, `advance`, `mock`, `snapshot`, `freeze_time`) are special forms — verb + argument, no parens. They don't violate the lowercase-function-uses-parens rule because they aren't regular function calls.

**Test-scope builtins.** Available only inside `test "name":` blocks; rejected at parse time outside test scope.

| Builtin | Returns | Meaning |
|---|---|---|
| `seen "string"` | bool | Does the rendered output contain this string anywhere? Matches within a single primitive's text content — adjacent labels rendering `"Hello"` + `"World"` are NOT matched by `seen "Hello World"`. |
| `value_of(<binding>)` | current value | Inspect any test-scope-visible binding — an input/toggle/slider via its `bind:` variable, or any screen-state variable by name. On an input the user hasn't typed into yet, returns the bound variable's initial value. For a `spring()`'d binding, returns the target value (deterministic-by-construction, per the Q4c snapshot rule); advance test time before reading if you want the post-settle value. |
| `on <Screen>` | bool | Is the current screen `<Screen>`? (post-navigate assertion) |
| `requested("<url>")` | bool | Did the test issue a `fetch()` to this URL? |
| `request_count("<url>")` | int | How many times was this URL fetched during the test? |

**Mocking — `fetch`.** Block-form (`mock fetch:` with a URL → response map) makes fetch calls deterministic:

```igni
test "shows offline state when fetch fails":
  mock fetch:
    "/api/users/42": error "network timeout"
  render Profile
  expect seen "Couldn't load — try again"

test "loads user data and shows email":
  mock fetch:
    "/api/users/42": {name: "Ada Lovelace", email: "ada@example.com"}
  render Profile
  expect seen "ada@example.com"
```

The mock map is consulted on every `fetch()` call, including reactive re-fires — if the test mutates a variable production's `fetch()` depends on, the re-fired fetch hits the mock map fresh.

**URL keys match the resolved string literally.** For templated URLs (`fetch("/api/users/" + id)`), the key is the resolved value (`"/api/users/42"`), not the template — no path-only matching, no query-string-aware matching, no globs.

**Mocking — `every`.** `mock every:` + `advance <duration>` jumps simulated time forward; all active `every <interval>:` blocks fire `<duration> / <interval>` times in order; reactive re-renders drain to stability between ticks. Real wall-clock time is unaffected — the test runs in milliseconds.

```igni
test "stopwatch elapsed reaches 60 seconds":
  render Stopwatch
  tap "Start"
  mock every:
    advance 60s
  expect seen "01:00"
```

`advance` is sequenced like any other test-body statement — it advances time at the body-position where it appears. Place `advance` after `render` + initial event-sims so the timer being advanced actually exists.

**Snapshot.** `snapshot "<name>"` captures the current rendered tree as a deterministic text representation, stored as a golden file. Re-running the test compares against the stored file; if the tree differs, the test fails with a diff until you re-approve via `igni test --update-snapshots`.

```igni
test "Dashboard renders the user's name":
  render Dashboard, shared.user: {name: "Tyr", email: "tyr@example.com"}
  snapshot "dashboard_default"
```

**Goldens** live at `__snapshots__/<test-slug>__<snap-slug>.txt` — one file per (test, snapshot) pair, slugs are lower-case-with-underscores. Commit alongside `.test.igni`; reviewers diff goldens like source. First run writes; subsequent runs compare; `igni test --update-snapshots` rewrites all goldens after intentional code changes.

**What the text-tree captures.** Node identity, branch/list structure, component names, bound layout properties (`padding`, `gap`, `align`, `background`, `rounded`), and `transition:` / `spring()` state. Visible strings alone aren't enough — wrong padding or wrong transition would slip through string-only checks.

**Snapshot of a `spring()`'d value.** Snapshots capture the spring's **target value**, not the intermediate frame — deterministic by construction; no settle needed before the snapshot.

**Mocking — `now()`.** Use `mock now:` (ambient for the test body) or `freeze_time:` (a block extent) to fix `now()` to a known timestamp. Any test that renders a screen reading `now()` should pin time, even if the assertion doesn't directly check timestamp UI — `now()`-derived state still affects snapshot determinism and `every`-block sequencing:

```igni
test "Feed renders relative timestamps":
  mock now: "2026-04-28T12:00:00Z"
  mock fetch:
    "/api/feed": [{ts: "2026-04-28T11:00:00Z", text: "Hello"}]
  render Feed
  expect seen "1 hour ago"
```

```igni
test "StepCounter snapshot is stable":
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    snapshot "step_counter_initial"
```

`mock now:` is **ambient-scope** — applies for the rest of the test body (or enclosing mock block). `freeze_time:` has a **block extent** — its `:` opens an indented block; the freeze ends on dedent.

**Advancing time when frozen.** `mock every: advance <duration>` advances both the every-block scheduler and the frozen `now()` value together — one test clock. Freeze at noon, advance `1m`, read `now()` sees `12:01`.

```igni
test "spring counter reaches target after 1 second":
  freeze_time: "2026-04-28T12:00:00Z"
    render StepCounter
    tap "Add 100"
    mock every:
      advance 1s
    expect value_of(displayed_steps) is 100
```

> **Not yet:** image / golden-file snapshots (pixel-perfect comparison), `mock locate()` / `mock play()`, property-based testing, timezone-aware `freeze_time:`. All deferred to a future cycle.

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
- UI primitives only render in screen or component bodies, never inside functions.
- Arguments to screens and components are immutable.
- **PascalCase = component, lowercase = function.** Components are invoked without parens (`Avatar user.avatar, size: 80`); functions are called with parens (`greet("Tyr")`). The casing tells you which is which when reading. Naming a component `myCard` (lowercase) or a function `Greet` (capitalized) is a parse-time error.
