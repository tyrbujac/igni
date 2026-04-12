# Contacts App — v0.6.2 Cold-LLM Test

**Date:** 2026-04-12
**Spec:** v0.6.2
**Prompt:** See `prompts.md` §1 (Contacts app)

---

## Claude Opus 4.6

**Spec grade: PASS (1 minor issue)**

### Output

```igni
shared:
  contacts: [Contact] = [
    {name: "Alice", phone: "555-0101", favourite: false},
    {name: "Bob", phone: "555-0102", favourite: true},
    {name: "Charlie", phone: "555-0103", favourite: false},
    {name: "Diana", phone: "555-0104", favourite: true},
    {name: "Eve", phone: "555-0105", favourite: false}
  ]

screen ContactList:
  query = ""
  favourites_only = false

  layout vertical, gap: medium, padding: large:
    label "Contacts", style: heading
    input bind: query, placeholder: "Search..."
    toggle bind: favourites_only, label: "Favourites only"
    if visible() is empty:
      label "No contacts found", style: body, color: subtle
    else:
      each contact in visible():
        ContactRow contact, on tap: navigate to ContactDetail contact

  visible():
    result = shared.contacts
    if favourites_only:
      result = filter(result, c => c.favourite)
    if query is not empty:
      result = filter(result, c => contains(c.name, query))
    return sorted(result, c => c.name)

screen ContactDetail(contact):
  current = find(shared.contacts, c => c.name is contact.name)

  layout vertical, gap: medium, padding: large:
    label current.name, style: heading
    label current.phone, style: body
    if current.favourite:
      badge "Favourite", color: brand
    button "Toggle Favourite", on tap: toggle_fav()
    button "Back", on tap: navigate back

  toggle_fav():
    c = find(shared.contacts, c => c.name is contact.name)
    shared.contacts = replace(shared.contacts, c, {name: c.name, phone: c.phone, favourite: not c.favourite})

component ContactRow(contact):
  layout horizontal, padding: medium, background: card, rounded: medium, spread: true:
    label contact.name, style: body
    if contact.favourite:
      icon "star", color: brand
```

### Spec findings

| # | Finding | Type |
|---|---|---|
| 1 | `toggle bind: ..., label: "Favourites only"` — `label:` is a checkbox property, not toggle | Spec issue |
| 2 | `contacts: [Contact] = [...]` — type hint syntax | Valid v0.6.2, transpiler gap |

### Transpiler validation

| Step | Result |
|---|---|
| Transpiles? | Yes, after 2 fixes |
| Fix 1 | Removed type hint `contacts: [Contact]` → `contacts` (transpiler doesn't support type hints) |
| Fix 2 | Removed `label:` from `toggle bind:` (not supported on toggle) |
| Analyze? | Clean after codegen fixes (see below) |
| Runs in browser? | Yes |
| Functional? | Yes — search, filter, navigation, favourite toggle all work |

### Codegen bugs surfaced

1. **`TextStyle?` null safety** — `Theme.of(context).textTheme.bodyLarge.copyWith(...)` fails because `bodyLarge` is nullable in Flutter 3.x. Fixed: added `!` to all STYLE_MAP entries.
2. **`widget.param` in field initializers** — `var current = ...widget.contact...` fails because `widget` isn't available in Dart field initializers. Fixed: added `late` when initializer references screen params.
3. **`filter` lambda type mismatch** — `.where((c) => c['favourite'])` fails because `c['favourite']` returns `dynamic`, not `bool`. Fixed: added `== true` coercion.
4. **Column overflow** — no scrolling on long lists. Fixed: wrapped Scaffold body in `SingleChildScrollView`.
5. **Case-sensitive `contains`** — `"Alice".contains("a")` returns false. Fixed: made `contains` codegen use `.toLowerCase()` on both sides.

### Features correctly used

`shared:`, `filter` (chained), `sorted`, `contains`, lambdas, `find` (predicate), `replace`, `navigate to`/`navigate back`, `badge`, `icon`, `component`, `if`/`else`, `each`, `input bind:`, `toggle bind:`, `is empty`/`is not empty`, `not`, object literals, field access, `return`, functions as expressions.

---

## Gemini 3.1 Pro

**Spec grade: PASS (2 issues)**

### Output

```igni
shared:
  contacts = [
    {name: "Alice", phone: "555-0101", favourite: true},
    {name: "Bob", phone: "555-0102", favourite: false},
    {name: "Charlie", phone: "555-0103", favourite: true},
    {name: "Diana", phone: "555-0104", favourite: false}
  ]

screen ContactsList:
  search_query = ""
  show_favourites = false

  display = shared.contacts

  if show_favourites:
    display = filter(display, c => c.favourite)

  if search_query is not empty:
    display = filter(display, c => contains(c.name, search_query))

  display = sorted(display, c => c.name)

  layout vertical, gap: medium, padding: large:
    input bind: search_query, placeholder: "Search contacts..."
    toggle bind: show_favourites, label: "Show favourites only"

    each contact in display:
      ContactRow contact, on tap: navigate to ContactDetail contact

screen ContactDetail(contact):
  current = contact

  layout vertical, gap: medium, padding: large, align: center:
    label current.name, style: heading
    label current.phone, style: body, color: subtle

    if current.favourite:
      badge "Favourite", color: brand

    button "Toggle Favourite", on tap: toggle_fav()
    button "Back", on tap: navigate back

  toggle_fav():
    updated = {name: current.name, phone: current.phone, favourite: not current.favourite}
    shared.contacts = replace(shared.contacts, current, updated)
    current = updated

component ContactRow(contact):
  layout horizontal, spread: true, padding: medium, background: card, rounded: medium:
    label contact.name, style: body
    if contact.favourite:
      icon "star", color: brand
```

### Spec findings

| # | Finding | Type |
|---|---|---|
| 1 | `toggle bind: ..., label: "Show favourites only"` — same as Claude | Spec issue |
| 2 | Conditional assignment at screen body level (`if show_favourites: display = filter(...)`) | Valid v0.6.2, transpiler gap |

### Transpiler validation

| Step | Result |
|---|---|
| Transpiles? | Yes, after 2 fixes |
| Fix 1 | Removed `label:` from `toggle bind:` |
| Fix 2 | Moved inline conditional assignment into a `visible()` function (transpiler doesn't support `if` with assignments at screen body level) |
| Analyze? | Clean |
| Runs in browser? | Yes |
| Functional? | Yes — same behaviour as Claude's version |

### Notes

Gemini's approach was arguably more idiomatic than Claude's — it used the spec's own conditional assignment pattern rather than wrapping in a function. The fact that the transpiler doesn't support this pattern is a transpiler gap, not a model error. Gemini's `toggle_fav()` using `replace` + local `current = updated` is the cleanest favourite-toggle implementation of the three models.

---

## ChatGPT

**Spec grade: FAIL (3 fundamental issues)**

### Output

```igni
screen Contacts:
  contacts = [
    {name: "Alice", phone: "123456", favourite: true},
    {name: "Bob", phone: "987654", favourite: false},
    {name: "Charlie", phone: "555666", favourite: true}
  ]
  search = ""
  show_favourites = false

  filtered = contacts
  if search is not empty:
    filtered = filter(filtered, c => contains(c.name, search))
  if show_favourites:
    filtered = filter(filtered, c => c.favourite)

  display = sorted(filtered, c => c.name)

  layout vertical, gap: medium, padding: large:
    input bind: search, placeholder: "Search contacts..."
    toggle bind: show_favourites, label: "Favourites only"

    if display is empty:
      label "No contacts found", color: subtle
    else:
      each contact in display:
        ContactRow contact, on tap: navigate to ContactDetail contact

component ContactRow(contact):
  layout vertical, padding: medium, background: card, rounded: medium:
    label contact.name, style: body
    label contact.phone, style: caption, color: subtle

screen ContactDetail(contact):
  layout vertical, gap: medium, padding: large:
    label contact.name, style: heading
    label contact.phone, style: body

    if contact.favourite:
      badge "Favourite", color: green

    button "Toggle Favourite", on tap: toggle_favourite()

  toggle_favourite():
    contact.favourite = not contact.favourite
    navigate back
```

### Spec findings

| # | Finding | Type | Severity |
|---|---|---|---|
| 1 | No `shared:` block — contacts local to one screen, detail screen cannot mutate them back | Spec misunderstanding | Critical |
| 2 | `contact.favourite = not contact.favourite` — in-place field mutation on a list element | Spec violation | Critical |
| 3 | `toggle bind: ..., label:` | Spec issue | Minor |
| 4 | `color: green` — not a design token (`brand`, `subtle`, `danger` are valid) | Spec misuse | Minor |
| 5 | Conditional assignment at screen body level | Valid v0.6.2, transpiler gap | — |

### Transpiler validation

| Step | Result |
|---|---|
| Transpiles? | No |
| Blocker 1 | Conditional assignment at screen body level (same as Gemini) |
| Blocker 2 | In-place field mutation (`contact.favourite = ...`) has no valid transpiler path — would require fundamental restructuring |
| Worth fixing? | No — the missing `shared:` and in-place mutation are design-level errors, not surface syntax issues |

### Notes

ChatGPT missed the two most fundamental constraints in the spec: (1) cross-screen state requires `shared:`, and (2) list elements cannot be mutated in place. Both are prominently documented. The in-place mutation `contact.favourite = not contact.favourite` is exactly the anti-pattern the spec warns against. This is the weakest output of the three models by a significant margin.
