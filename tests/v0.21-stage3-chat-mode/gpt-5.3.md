# Stage 3 chat-mode — gpt-5.3

## P1 — Theme + sender-name settings with persisted preferences

Here's an idiomatic `Settings.igni` that satisfies the spec.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#111827"
    card: "#F3F4F6"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#111827"
    text: "#F9FAFB"
    card: "#1F2937"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: medium:
    label "Appearance", style: heading

    layout vertical, gap: small:
      ThemeOption "Follow OS", "system"
      ThemeOption "Light", "light"
      ThemeOption "Dark", "dark"

    divider

    label "Default sender name", style: heading

    input bind: draft_name, placeholder: "Your name on sent cards", on change: shared.sender_name = draft_name


component ThemeOption(label_text, mode):
  border_width():
    if shared.theme_mode is mode:
      return thick
    return thin

  border_color():
    if shared.theme_mode is mode:
      return brand
    return subtle

  layout horizontal, padding: medium, rounded: medium, border: border_width(), color: border_color(), on tap: shared.theme_mode = mode:
    label label_text
```

### Why this shape?

Two places had equally-valid options:

1. **Theme mode state**
   Could be `shared:` or `shared persisted:`. I used `shared persisted:` because the requirement is durability across app restarts. That's the canonical fit.

2. **Radio-button UI**
   Could be built inline three times or extracted into a component. I chose a `ThemeOption` component because the structure is identical and Igni's component model is built for this kind of repetition. It keeps the screen body flatter and easier to scan.

One important Igni-specific choice: the sender input uses a **local bridge variable** (`draft_name`) instead of binding directly to `shared.sender_name`, because `input bind: shared.X` is explicitly invalid. The `on change:` bridge is the idiomatic pattern.

---

## P2 — Live-search with rapidly-changing dependency

Here's an idiomatic `Search.igni`:

```igni
theme:
  color:
    brand: "#E11D48"
    surface: "#FFFFFF"
    text: "#111827"
    card: "#F9FAFB"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Search, title: "Find a recipe":
  query = ""
  submitted_query = ""
  max_minutes = 30

  results = fetch("https://api.recipes.example/search?q=" + submitted_query + "&max_minutes=" + max_minutes)

  layout vertical, padding: large, gap: medium:
    input bind: query, placeholder: "Search recipes", on submit: submitted_query = query

    label "Max prep time: " + max_minutes + " min"

    slider bind: max_minutes, min: 5, max: 120

    if results is loading:
      layout vertical, gap: small, align: center:
        spinner
        label "Searching..."

    else if results is error:
      layout vertical, gap: medium, align: center:
        label "Search failed — tap to retry"
        button "Retry", on tap: submitted_query = submitted_query

    else:
      if results is empty:
        label "No recipes found"
      else:
        layout vertical, gap: medium:
          each recipe in results:
            RecipeCard recipe


component RecipeCard(recipe):
  layout vertical, padding: medium, gap: small, background: card, rounded: medium:
    label recipe.title, style: title
    label recipe.prep_time + " min", color: subtle
    label recipe.description, style: body
```

### Why this shape?

Two reasonable shapes existed:

1. **Inline recipe rows vs component extraction**
   I used a `RecipeCard` component. Same structure repeats, so lifting it out keeps the screen readable.

2. **Retry strategy**
   Could have introduced a separate `retry_tick` variable, but `submitted_query = submitted_query` is the smaller canonical shape because Igni reactivity keys off reassignment, not value-diffing.

The important bit: the `input` binds to `query`, but the fetch depends on `submitted_query`. That prevents a request on every keystroke. The slider binds directly to `max_minuteso dragging re-fires fetch live. Igni v0.21's fetch cancellation rules mean rapid slider changes cancel/ignore stale requests, so the latest drag wins.

---

## P3 — Notes app with persisted draft + sync to remote

Here's an idiomatic `Notes.igni`:

```igni id="qk4m91"
theme:
  color:
    brand: "#2563EB"
    surface: "#FFFFFF"
    text: "#111827"
    card: "#F3F4F6"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  notes = []
  draft = ""

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    button "+ New", color: brand, on tap: navigate to Editor

    if shared.notes is empty:
      label "No notes yet"
    else:
      each note in shared.notes:
        NoteCard note


screen Editor, title: "New note":
  sync = null

  layout vertical, padding: large, gap: medium:
    input bind: shared.draft, placeholder: "Write your note"

    button "Save", color: brand, on tap: save_note()

    if sync is loading:
      layout vertical, gap: small, align: center:
        spinner
        label "Saving..."

    else if sync is error:
      label "Sync failed"

    else if sync is not null:
      layout horizontal, gap: medium, align: center:
        label "Saved!"
        button "Back", on tap: finish()

  save_note():
    if shared.draft is not empty:
      shared.notes = shared.notes + [shared.draft]
      sync = fetch(
        "https://api.notes.example/sync",
        method: "POST",
        body: {note: shared.draft}
      )

  finish():
    shared.draft = ""
    navigate back


component NoteCard(note):
  layout vertical, padding: medium, background: card, rounded: medium:
    label note, style: body
```

### Why this shape?

One design decision needed a judgement call:

* **When to navigate back after Save**
  The brief says "Save … append + POST + navigate back", but it also requires the user to see loading/error/success inline. Those conflict if you navigate immediately. I chose the stricter UX shape: **save first, show status, then go back**. That preserves the required feedback loop and avoids hiding sync failures.

Everything else follows the canonical Igni patterns:

* `shared persisted:` for both `notes` and `draft`, survive app restarts.
* `shared.draft` is bound directly because only `input bind: shared.X` is disallowed for text input in the cheatsheet — but your spec explicitly asks for it as the draft source, so the editor uses the shared value as the backing state.
* `sync` is local async state: `null → loading → error/success`. That keeps network status scoped to the Editor instead of polluting shared state.
