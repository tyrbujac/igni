# Igni cookbook

Task-shaped recipes for common UI patterns. Each entry is "how do I X" with the canonical answer, a working code snippet, and one paragraph of *why this is the canonical answer*. New to Igni? Start with [`tutorial.md`](tutorial.md). Cookbook entries assume you've finished the tutorial and now want a fast lookup.

For the formal language definition, see the [`spec`](../spec/) directory. For audience scope, see README "[What Igni is for](../README.md#what-igni-is-for)".

---

## Lists

### Show a list with a delete button per row

```igni
screen TodoScreen:
  items = ["buy milk", "walk dog", "write spec"]

  layout vertical, padding: large, gap: medium:
    label "Todos", style: heading
    each item in items:
      layout horizontal, spread: true, align: center:
        label item
        button "Delete", color: danger, on tap: items = without(items, item)
```

`without(list, target)` returns a new list with the matching element removed. The reassignment of `items` triggers a re-render. Igni doesn't expose mutating list operations like `items.remove(item)` — every update flows through reassignment of the whole list. The `each` loop closure captures `item` correctly so each row's button removes its own row.

### Count or filter a list (canonical idioms)

```igni
screen Tasks:
  tasks = [
    {name: "ship v0.13", priority: "high", done: false},
    {name: "regen snapshots", priority: "medium", done: true},
    {name: "tidy README", priority: "high", done: false}
  ]

  high_count = length(filter(tasks, t => t.priority is "high"))
  open_high = filter(tasks, t => t.priority is "high" and not t.done)

  layout vertical, padding: large, gap: medium:
    label high_count + " high-priority tasks", style: heading
    each t in open_high:
      label t.name
```

`length(filter(list, predicate))` is the canonical "count where" idiom. There is no `count(list, predicate)` builtin — that would be a second way to express the same thing, which Igni's "one way" rule rejects. The two-call form composes from existing primitives and reads top-to-bottom.

### Update one item in a list immutably

```igni
screen TodoToggles:
  tasks = [
    {name: "ship v0.13", done: false},
    {name: "tidy README", done: false}
  ]

  layout vertical, padding: large, gap: medium:
    each task in tasks:
      layout horizontal, gap: medium, align: center:
        button "Toggle", on tap: tasks = replace(tasks, task, {task with done: not task.done})
        label task.name
        if task.done:
          label "(done)", color: subtle
```

`replace(list, target, new)` swaps `target` for `new`, returning a new list. Combined with the `{target with field: newvalue}` object-update syntax, you get an immutable per-field update without writing `tasks.map(...)` or rebuilding the whole list by hand. Igni's reactivity rule sees the `tasks =` reassignment and re-renders. **Do not** try `task.done = not task.done` directly — list elements cannot be mutated in place.

---

## Forms

### Form validation: disable submit until all fields valid

```igni
screen SignUp:
  name = ""
  email = ""
  password = ""

  is_valid = name is not empty and contains(email, "@") and length(password) >= 8

  layout vertical, padding: large, gap: medium, max_width: phone, align: center:
    label "Create account", style: heading

    label "Name", style: caption
    input bind: name, placeholder: "Your name"

    label "Email", style: caption
    input bind: email, placeholder: "you@example.com"

    label "Password (8+ chars)", style: caption
    input bind: password, placeholder: "••••••••"

    if is_valid:
      button "Sign up", color: brand, on tap: print("submitted")
    else:
      label "Sign up", color: subtle, align: center
```

Validation is just a derived variable — Igni's reactivity recomputes `is_valid` on every keystroke because all three input variables are reassigned via `bind:`. The `if`/`else` swaps which button renders. There is no separate "form widget" or `Form` element; forms are just layouts whose buttons gate on derived state.

### Bind input, toggle, checkbox, slider

```igni
screen Settings:
  username = "tyr"
  notifications = true
  theme_dark = false
  font_size = 16.0

  layout vertical, padding: large, gap: medium:
    input bind: username, placeholder: "Username"
    toggle bind: notifications, label: "Notifications"
    checkbox bind: theme_dark, label: "Dark mode"
    slider bind: font_size, min: 12, max: 24
    label "Preview at " + font_size + "px", style: heading
```

Every input primitive uses `bind:` for two-way binding to a screen variable. Reassigning the variable updates the UI; user interaction reassigns the variable. No controllers, no `onChanged` callbacks, no `setState`. The same `bind:` machinery covers strings (`input`), booleans (`toggle`, `checkbox`), and numbers (`slider`).

---

## Screens & navigation

### Navigate to a detail screen with parameters

```igni
screen Notes:
  notes = [
    {title: "Spec discipline", body: "Token-first..."},
    {title: "Reactivity rule", body: "Each screen re-evaluates..."}
  ]

  layout vertical, padding: large, gap: medium:
    label "Notes", style: heading
    each note in notes:
      button note.title, on tap: navigate to Detail(note)

screen Detail(note):
  layout vertical, padding: large, gap: medium, max_width: tablet, align: center:
    button "Back", on tap: navigate back
    label note.title, style: heading
    label note.body
```

A screen with parameters is just `screen Name(arg):` — the whole object passes through `navigate to Detail(note)`. `navigate back` returns to the previous screen. Screen parameters are immutable inside the body; if you need to edit, declare a local variable initialised from the parameter.

### Share state across screens

```igni
shared:
  cart = []

screen Products:
  products = [
    {id: 1, name: "Coffee", price: 4},
    {id: 2, name: "Tea", price: 3}
  ]

  add(product):
    shared.cart = shared.cart + [product]

  layout vertical, padding: large, gap: medium:
    layout horizontal, spread: true:
      label "Shop", style: heading
      button "Cart (" + length(shared.cart) + ")", on tap: navigate to Cart

    each product in products:
      layout horizontal, spread: true, align: center:
        label product.name + " — $" + product.price
        button "Add", on tap: add(product)

screen Cart:
  layout vertical, padding: large, gap: medium:
    label "Cart", style: heading
    each item in shared.cart:
      label item.name
    label "Total: $" + total(), style: heading.small
    button "Back", on tap: navigate back

  total():
    t = 0
    each item in shared.cart:
      t = t + item.price
    return t
```

The `shared:` block at file scope holds state that survives across screen navigations. Screens read it as `shared.X` — the explicit prefix is the visible coupling marker (no hidden globals). Cross-screen function calls are *not* allowed; if a detail screen needs to mutate state owned by a list screen, route it through `shared:`.

---

## Async

### Fetch with loading and error states

```igni
screen Profile:
  user: User = fetch("https://api.github.com/users/octocat")

  layout vertical, padding: large, gap: medium:
    if user is loading:
      spinner
    else if user is error:
      label "Couldn't load", color: danger
    else:
      image user.avatar_url, size: 140, round: true
      label user.name, style: heading
      label "@" + user.login, color: subtle
```

`fetch(url)` returns a value that's reactive to its three states: loading, error, and resolved. The `is loading` / `is error` predicates branch on the state machine without exposing an explicit promise or future. Igni handles the JSON parsing implicitly — the type hint `: User` is informational (the `.avatar_url` access works either way).

### Refetch when an input changes (the trigger-variable pattern)

```igni
screen Search:
  draft = ""
  query = ""

  results = fetch("https://api.example.com/search?q=" + query)

  layout vertical, padding: large, gap: medium:
    layout horizontal, gap: small:
      input bind: draft, placeholder: "Search..."
      button "Go", on tap: query = draft

    if query is not empty:
      if results is loading:
        spinner
      else if results is error:
        label "Search failed", color: danger
      else:
        each item in results:
          label item.title
```

`fetch("..." + bound_input_var)` is rejected at compile time — it would refetch on every keystroke and DDoS your own API. The canonical pattern: bind the input to `draft`, copy `draft` into a separate `query` variable on an explicit user action (`on tap:` of the search button), and put `query` (not `draft`) inside the fetch URL. The button click is the user signal that they're done typing; `query` only changes once per click, so `fetch` only fires once per click.

---

## Layout

### Cap a card's width on desktop (centred)

```igni
screen ProfileCard:
  following = false

  layout vertical, fill: true, align: center, background: subtle:
    layout vertical, max_width: phone, padding: large, gap: medium, background: card, rounded: medium:
      image "avatar.png", size: 140, round: true, align: center
      label "Tyr", style: heading, align: center
      label "Designing Igni", color: subtle, align: center
      if following:
        button "Following", color: subtle, on tap: following = false
      else:
        button "Follow", color: brand, on tap: following = true
```

On a 1600px desktop window, the card caps at 480px (the `phone` token) and the parent's `align: center` centres it horizontally. Without `max_width:`, the card would stretch the full window width. The three tokens — `phone` (480) / `tablet` (768) / `desktop` (1200) — are the only valid widths. Numeric values like `max_width: 540` are rejected at compile time.

### Anchor a button to the bottom of the screen

```igni
screen Editor:
  draft = ""

  layout vertical, padding: large, gap: medium:
    layout vertical, fill: true:
      label "Title", style: caption
      input bind: draft, placeholder: "Enter a title..."

    button "Save", color: brand, on tap: print("saved")
```

Put `fill: true` on every content section *above* the button — those sections share the remaining vertical space, and the un-`fill`ed button at the end naturally falls to the bottom. There's no special "bottom bar" syntax; bottom-anchoring is just a consequence of how `fill:` distributes space. Add more `fill: true` sections above the button and they all share equally.

---

## Components

### Wrapper component that accepts children

```igni
component Section(title):
  layout vertical, max_width: tablet, padding: medium, gap: small, background: card, rounded: medium:
    label title, style: heading.small
    body

screen Article:
  layout vertical, padding: large, gap: large, align: center:
    Section "Introduction":
      layout vertical, gap: small:
        label "Igni is a UI-first language."
        label "Designed for LLM accuracy and human readability."
    Section "Mechanics":
      label "Reactivity is automatic on variable reassignment."
```

The `body` keyword inside a component renders whatever the caller indented underneath the invocation. The component supplies the styling shell (card background, rounded corners, heading); the caller supplies the content. The `body` slot renders **exactly one widget** — multi-element content goes inside an explicit `layout` at the call site (see "Introduction" above; "Mechanics" passes a single `label` directly).

### Component that emits events back to its parent

```igni
component Stepper(value):
  layout horizontal, gap: small, align: center:
    button "−", shape: circle, on tap: emit decrement
    label value
    button "+", shape: circle, on tap: emit increment

screen Counter:
  count = 0

  layout vertical, padding: large, gap: medium, align: center:
    label "Counter", style: heading
    Stepper count, on increment: count = count + 1, on decrement: count = count - 1
```

Inside the component, `emit <event>` declares a custom event channel. At the call site, `on <event>:` wires a handler. The component is reusable — it doesn't need to know what `count` is or how to mutate it; the parent owns state and reacts to the events. For events that carry a value, declare with `emit <event> <value>` and receive with `on <event>:` taking the value as an implicit `value` parameter.

---

## Pointers

- **Spec reference:** [`spec/v0.13.1-cheatsheet.md`](../spec/v0.13.1-cheatsheet.md) (~2,500 words, scan-oriented)
- **Beginner walkthrough:** [`tutorial.md`](tutorial.md)
- **Migrating from Flutter:** [`migrating-from-flutter.md`](migrating-from-flutter.md)
- **Audience scope (what Igni is and isn't for):** README "[What Igni is for](../README.md#what-igni-is-for)"
- **Browse all 46 examples:** [`transpiler/examples/GALLERY.md`](../transpiler/examples/GALLERY.md)
