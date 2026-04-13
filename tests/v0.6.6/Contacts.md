# Contacts Cold Test Results

**Date:** 2026-04-13
**Models tested:** Gemini 3.1 Fast, ChatGPT 5.3, Gemini 3.1 Pro, Claude Opus 4.6
**Input:** v0.6.6.md (full spec, post-doc-fixes)
**App:** Contacts — multi-screen contact manager with search, sort, edit, delete (CRUD)

## What Contacts tests

The most complex cold test to date. Tests features that Destini didn't exercise:

- **Shared state** (`shared:` block, `shared.contacts`, cross-screen reads and writes)
- **List builtins with lambdas** (`filter`, `sorted`, `reversed`, `contains`)
- **List mutation builtins** (`replace`, `without`)
- **Async data** (`fetch` + `is loading` + `is error`)
- **Navigation with params** (`navigate to ContactDetail contact`, `navigate back`)
- **Wrapper component with `body`-style pattern** (ContactCard as reusable card)
- **`heading.small`** (card names and section headings)
- **Conditional value selection** (sort direction toggle)
- **Edit mode toggle** (`if editing:` / `else:` with bound inputs)
- **Trigger-variable understanding** (local filtering should NOT use trigger pattern)

## Results — strong convergence

### Gemini 3.1 Fast — correct but misplaced filter logic

```igni
shared:
  contacts: [Contact] = [
    {id: 1, name: "Alice Thompson", phone: "555-0101", email: "alice@example.com"},
    {id: 2, name: "Bob Richards", phone: "555-0102", email: "bob@example.com"},
    {id: 3, name: "Charlie Davis", phone: "555-0103", email: "charlie@example.com"}
  ]
  ascending = true

screen ContactList:
  query = ""
  
  layout vertical, gap: medium, padding: large:
    label "My Contacts", style: heading
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search name..."
      button "Sort", on tap: ascending = not ascending

    # Filtering and Sorting Logic
    display = filter(shared.contacts, c => contains(c.name, query))
    display = sorted(display, c => c.name)
    if not ascending:
      display = reversed(display)

    if display is empty:
      label "No contacts found", color: subtle
    else:
      each person in display:
        ContactCard person, on tap: navigate to ContactDetail person

component ContactCard(person):
  layout vertical, padding: medium, background: card, rounded: medium:
    label person.name, style: heading.small
    label person.phone, style: body, color: subtle

screen ContactDetail(contact):
  extra = fetch("/api/contacts/" + contact.id)
  editing = false
  edit_name = contact.name
  edit_phone = contact.phone
  edit_email = contact.email

  if extra is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if extra is error:
    layout vertical, padding: large, align: center:
      label "Error loading details", color: danger
      button "Back", on tap: navigate back
  else:
    layout vertical, gap: medium, padding: large:
      if editing:
        label "Edit Contact", style: heading
        input bind: edit_name, placeholder: "Name"
        input bind: edit_phone, placeholder: "Phone"
        input bind: edit_email, placeholder: "Email"
        layout horizontal, gap: medium:
          button "Save", on tap: save_changes()
          button "Cancel", on tap: editing = false
      else:
        label contact.name, style: heading
        label "Phone", style: caption
        label contact.phone, style: body
        label "Email", style: caption
        label contact.email, style: body
        label "Notes", style: caption
        label extra.notes, style: body
        layout horizontal, gap: medium:
          button "Edit", on tap: editing = true
          button "Delete", color: danger, on tap: remove_contact()
          button "Back", on tap: navigate back

  save_changes():
    updated = {id: contact.id, name: edit_name, phone: edit_phone, email: edit_email}
    shared.contacts = replace(shared.contacts, contact, updated)
    navigate back

  remove_contact():
    shared.contacts = without(shared.contacts, contact)
    navigate back
```

**Two issues:**

1. **Filter/sort logic inside layout block.** `display = filter(...)` and `display = sorted(...)` are indented as children of `layout vertical:`. Variables should be at screen body level, not inside layouts. The spec says "Variables, layouts, and functions all live inside the screen body" — but doesn't explicitly say "not inside a layout block." Clarification opportunity.

2. **`ascending` in shared state.** A single-screen UI preference stored in `shared:`. The spec's own guidance says "if only one screen reads the value, it's local." Spec comprehension miss.

Otherwise clean: typed shared state annotation (`[Contact]`), correct `replace`/`without`, correct `fetch`/`is loading`/`is error`, `heading.small` on card, `caption` for detail field labels, shows `extra.notes` from fetched data.

### ChatGPT 5.3 — cleanest output, best `heading.small` usage

```igni
shared:
  contacts = [
    {id: 1, name: "Alice Smith", phone: "07123 456789", email: "alice@example.com"},
    {id: 2, name: "Bob Johnson", phone: "07234 567890", email: "bob@example.com"},
    {id: 3, name: "Charlie Brown", phone: "07345 678901", email: "charlie@example.com"}
  ]

screen ContactList, title: "Contacts":
  search = ""
  descending = false

  filtered = filter(shared.contacts, c => contains(c.name, search))
  sorted_list = sorted(filtered, c => c.name)
  display = sorted_list
  if descending:
    display = reversed(display)

  layout vertical, gap: medium, padding: large:
    input bind: search, placeholder: "Search contacts..."
    button "Toggle Sort", on tap: descending = not descending
    if display is empty:
      label "No contacts found", color: subtle
    else:
      each contact in display:
        ContactCard contact, on tap: navigate to ContactDetail contact

component ContactCard(contact):
  layout vertical, padding: medium, background: card, rounded: medium:
    label contact.name, style: heading.small
    label contact.phone, style: body, color: subtle

screen ContactDetail(contact), title: "Contact":
  details = fetch("/api/contacts/" + contact.id)
  editing = false
  draft_name = contact.name
  draft_phone = contact.phone
  draft_email = contact.email

  if details is loading:
    spinner
  else if details is error:
    label "Failed to load contact details", color: danger
  else:
    layout vertical, gap: medium, padding: large:
      if editing:
        input bind: draft_name, placeholder: "Name"
        input bind: draft_phone, placeholder: "Phone"
        input bind: draft_email, placeholder: "Email"
        layout horizontal, gap: medium:
          button "Save", color: brand, on tap: save()
          button "Cancel", on tap: editing = false
      else:
        label "Name", style: heading.small
        label contact.name, style: body
        label "Phone", style: heading.small
        label contact.phone, style: body
        label "Email", style: heading.small
        label contact.email, style: body
        layout horizontal, gap: medium:
          button "Edit", on tap: editing = true
          button "Delete", color: danger, on tap: delete()

  save():
    updated = {id: contact.id, name: draft_name, phone: draft_phone, email: draft_email}
    shared.contacts = replace(shared.contacts, contact, updated)
    navigate back

  delete():
    shared.contacts = without(shared.contacts, contact)
    navigate back
```

**No issues.** Cleanest output of the four. Filter/sort at screen body level. `heading.small` used for both card names AND detail section headings — the only model to use it for section headings, which is what the prompt asked for. `title:` app bars on both screens. Textbook conditional value selection pattern. `draft_` prefix naming convention. `replace` and `without` correct.

### Gemini 3.1 Pro — correct, conditional filter optimisation

```igni
shared:
  contacts = [
    {id: 1, name: "Alice Smith", phone: "555-0101", email: "alice@example.com"},
    {id: 2, name: "Bob Jones", phone: "555-0102", email: "bob@example.com"},
    {id: 3, name: "Charlie Brown", phone: "555-0103", email: "charlie@example.com"}
  ]

screen ContactList, title: "Contacts":
  search_text = ""
  descending = false

  display_list = shared.contacts
  if search_text is not empty:
    display_list = filter(display_list, c => contains(c.name, search_text))
  display_list = sorted(display_list, c => c.name)
  if descending:
    display_list = reversed(display_list)

  layout vertical, padding: large, gap: medium:
    input bind: search_text, placeholder: "Search by name..."
    if descending:
      button "Sort: Z->A", on tap: descending = false
    else:
      button "Sort: A->Z", on tap: descending = true
    if display_list is empty:
      label "No contacts found", color: subtle
    else:
      each contact in display_list:
        ContactCard contact, on tap: navigate to ContactDetail contact

component ContactCard(contact):
  layout vertical, padding: medium, background: card, rounded: medium:
    label contact.name, style: heading.small
    label contact.phone, style: body, color: subtle

screen ContactDetail(contact), title: "Contact Details":
  edit_mode = false
  draft_name = contact.name
  draft_phone = contact.phone
  draft_email = contact.email
  extra_details = fetch("/api/contacts/" + contact.id)

  if extra_details is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if extra_details is error:
    layout vertical, padding: large, gap: medium:
      label "Couldn't load extra details", color: danger
      button "Back", on tap: navigate back
  else:
    layout vertical, padding: large, gap: medium:
      if edit_mode:
        input bind: draft_name, placeholder: "Name"
        input bind: draft_phone, placeholder: "Phone"
        input bind: draft_email, placeholder: "Email"
        layout horizontal, gap: medium:
          button "Save", color: brand, on tap: save_contact()
          button "Cancel", on tap: edit_mode = false
      else:
        label "Name", style: caption, color: subtle
        label contact.name, style: heading
        label "Phone", style: caption, color: subtle
        label contact.phone, style: body
        label "Email", style: caption, color: subtle
        label contact.email, style: body
        layout horizontal, gap: medium:
          button "Edit", on tap: edit_mode = true
          button "Delete", color: danger, on tap: delete_contact()

  save_contact():
    updated = {id: contact.id, name: draft_name, phone: draft_phone, email: draft_email}
    shared.contacts = replace(shared.contacts, contact, updated)
    navigate back

  delete_contact():
    shared.contacts = without(shared.contacts, contact)
    navigate back
```

**No issues.** Conditional filter optimisation — only runs `filter` when search is non-empty. Sort button labels show current state ("Sort: Z->A" when descending is true). `caption` for detail field labels instead of `heading.small`. `title:` on both screens. `replace` and `without` correct. Noted in design commentary that identity-based `replace` works because the reference flows through from shared state.

### Claude Opus 4.6 — one typo, best edit() pattern

```igni
shared:
  contacts = [
    {id: 1, name: "Alice Chen", phone: "+44 7700 900001", email: "alice@example.com"},
    {id: 2, name: "Bob Martinez", phone: "+44 7700 900002", email: "bob@example.com"},
    {id: 3, name: "Clara Johansson", phone: "+44 7700 900003", email: "clara@example.com"}
  ]

screen ContactList:
  search = ""
  descending = false

  filtered = filter(shared.contacts, c => contains(c.name, search))
  sorted_list = sorted(filtered, c => c.name)
  display = sorted_list
  if descending:
    display = reversed(display)

  layout vertical, gap: medium, padding: large:
    label "Contacts", style: heading
    input bind: search, placeholder: "Search contacts..."
    if descending:
      button "Sort A->Z", on tap: descending = false
    else:
      button "Sort Z->A", on tap: descending = true
    if display is empty:
      label "No contacts found", color: subtle
    else:
      each contact in display:
        ContactCard contact, on tap: navigate to ContactDetail contact

screen ContactDetail(contact):
  details = fetch("/api/contacts/" + contact.id)
  editing = false
  draft_name = contact.name
  draft_phone = contact.phone
  draft_email = contact.email

  if details is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if details is error:
    layout vertical, padding: large:
      label "Couldn't load contact details", color: danger
      button "Go Back", on tap: navigate back
  else:
    layout vertical, gap: medium, padding: large:
      if editing:
        label "Edit Contact", style: heading
        label "Name", style: caption
        input bind: draft_name, placeholder: "Name"
        label "Phone", style: caption
        input bind: draft_phone, placeholder: "Phone"
        label "Email", style: caption
        input bind: draft_email, placeholder: "Email"
        layout horizontal, gap: medium:
          button "Save", color: brand, on tap: save()
          button "Cancel", on tap: editing = false
      else:
        label con.name, style: heading           # BUG: "con.name" should be "contact.name"
        label "Phone", style: caption
        label contact.phone, style: body
        label "Email", style: caption
        label contact.email, style: body
        layout horizontal, gap: medium:
          button "Edit", on tap: edit()
          button "Delete", color: danger, on tap: delete_contact()

  edit():
    draft_name = contact.name
    draft_phone = contact.phone
    draft_email = contact.email
    editing = true

  save():
    updated = {id: contact.id, name: draft_name, phone: draft_phone, email: draft_email}
    shared.contacts = replace(shared.contacts, contact, updated)
    navigate back

  delete_contact():
    shared.contacts = without(shared.contacts, contact)
    navigate back

component ContactCard(contact):
  layout vertical, padding: medium, background: card, rounded: medium:
    label contact.name, style: heading.small
    label contact.phone, style: body, color: subtle
```

**One issue:** `label con.name` — typo, should be `contact.name`. First actual code error across all Destini + Contacts outputs. Would break transpilation.

**Best `edit()` pattern.** Opus wraps draft reset + mode toggle in an `edit()` function, so re-entering edit mode after a cancel resets drafts to current values. Other models initialise drafts once at screen creation — stale if the user edits, cancels, then re-enters. Sort button labels describe the action ("Sort Z->A" means tapping switches to Z->A). Design commentary noted when identity-based `replace` works and when you'd need the lambda form instead.

## Architecture comparison

| Feature | Gemini Fast | ChatGPT | Gemini Pro | Opus |
|---|---|---|---|---|
| `shared:` correct | Yes (typed) | Yes | Yes | Yes |
| `filter` + `contains` + lambda | Yes | Yes | Yes | Yes |
| `sorted` + `reversed` | Yes | Yes | Yes | Yes |
| `fetch` + `is loading` + `is error` | Yes | Yes | Yes | Yes |
| `replace` (save) | Yes | Yes | Yes | Yes |
| `without` (delete) | Yes | Yes | Yes | Yes |
| `navigate to` + params | Yes | Yes | Yes | Yes |
| `ContactCard` component | Yes | Yes | Yes | Yes |
| `heading.small` in card | Yes | Yes | Yes | Yes |
| `heading.small` for section headings | No (caption) | **Yes** | No (caption) | No (caption) |
| Conditional value selection | Yes | Yes | Yes | Yes |
| Filter/sort at screen body level | **No (in layout)** | Yes | Yes | Yes |
| `title:` app bar | No | Yes | Yes | No |
| Edit draft reset on re-enter | No | No | No | **Yes (edit fn)** |
| Code errors | None | None | None | **1 typo** |

## Convergence analysis

**4/4 identical architecture.** All models independently produced:
1. `shared:` block with contacts list
2. `ContactList` screen with search input → `filter` + `contains` → `sorted` → conditional `reversed`
3. `ContactCard` component with `heading.small` + `body`
4. `ContactDetail` screen with `fetch`, `if editing:` toggle, `replace` for save, `without` for delete
5. Draft variables for edit mode, new object construction on save

This is the strongest convergence seen in any Igni cold test. The architecture is essentially the same across all four models — differences are cosmetic (variable naming, style tokens for labels, app bar presence).

## Trigger-variable understanding

**4/4 correct.** All four models bound search directly to the input (no trigger variable) and explicitly noted in their design commentary that the trigger-variable pattern doesn't apply to local filtering — only to `fetch`-dependent inputs. This is direct evidence the spec's pitfall documentation is working.

## Gaps surfaced

### 1. Variable assignments inside layout blocks

Gemini Fast placed `display = filter(...)` as a child of `layout vertical:`. The spec says "Variables, layouts, and functions all live inside the screen body" — but the boundary between "screen body" and "inside a layout" isn't explicit. Adding a one-line clarification ("Variable assignments go at the screen body level, not inside layout blocks") would close this.

Signal: 1/4 models. Low severity — the intent is clear even if placement is wrong.

### 2. `heading.small` for section headings vs `caption`

The prompt asked for "section headings" in the detail view. Only ChatGPT used `heading.small` — the other three used `caption` for field labels. `caption` is arguably a reasonable interpretation (small label above a value), but the prompt hinted at headings and the spec now documents `heading.small`. The dotted variant may need a more prominent example showing it used for section headings specifically.

Signal: 3/4 models chose `caption` over `heading.small` for field labels. The spec's `heading.small` definition may need a usage example beyond card titles.

### 3. No new language gaps

Every feature requested worked. `shared:`, `filter`, `sorted`, `reversed`, `contains`, `replace`, `without`, `fetch`, `navigate to`, `navigate back`, `heading.small`, lambdas, conditional value selection — all used correctly by all models (minus one typo). The spec covers this complexity level.

## Design commentary analysis

Allowing design commentary (replacing "code only") produced useful diagnostic data:

- **Trigger-variable understanding:** 4/4 explicitly noted local filtering doesn't need it
- **Identity semantics:** 2/4 (Gemini Pro, Opus) noted `replace` works by identity and when you'd need lambdas
- **Immutability rule:** 3/4 explicitly noted creating new objects for `replace`
- **Edit state management:** Opus noted the cancel-and-re-edit edge case others missed

The commentary confirms spec comprehension at a level the code alone wouldn't reveal.
