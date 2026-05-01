# Stage 3 chat-mode — claude-opus-4-7

## P1 — Theme + sender-name settings with persisted preferences

```igni
theme:
  color:
    brand: "#8B5CF6"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    text: "#F5F5F5"
    card: "#1A1A24"

shared persisted:
  theme_mode = "system"
  sender_name = ""

component ThemeOption(value, label_text):
  layout horizontal, padding: medium, rounded: medium, border: option_width(), color: option_color(), on tap: shared.theme_mode = value:
    label label_text

  option_width():
    if shared.theme_mode is value:
      return thick
    return thin

  option_color():
    if shared.theme_mode is value:
      return brand
    return subtle

screen Settings, title: "Settings":
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: medium:
    label "Appearance", style: title

    layout vertical, gap: small:
      ThemeOption "system", "Use system setting"
      ThemeOption "light", "Always light"
      ThemeOption "dark", "Always dark"

    label "Default sender name", style: title
    input bind: draft_name, placeholder: "Your name on sent cards", on change: shared.sender_name = draft_name
```

Notes on decisions where two shapes exist:

**Component vs three inline rows for the picker.** Picked component. Three near-identical rows differing only in `value` and label text is exactly what `component` is for; inline would duplicate the two state functions three times.

**Selection signal: border vs background tint.** Picked border (`thin`→`thick`, `subtle`→`brand`). The cheatsheet documents this as the canonical selected-state pattern; background-tint isn't.

**Sender name save: button vs `on change:`.** Picked `on change:` auto-save. No requirement for an explicit save action, and persistence is the contract the user cares about — typing then closing the app should preserve the value.

**Dark variant scope.** Only redeclared `surface`, `text`, `card`. `brand` inherits from light (a single brand colours modes is the common case), and `scaffold:`/`appbar:` sub-blocks fall back to light — but because their values reference `surface`/`text` tokens that resolve through the active variant, the chrome flips correctly without redeclaration.

---

## P2 — Live-search with rapidly-changing dependency

```igni
theme:
  color:
    brand: "#E07856"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F5F0EC"
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

    layout vertical, gap: small:
      label "Max prep time: " + max_minutes + " min"
      slider bind: max_minutes, min: 5, max: 120, step: 5

    if results is loading:
      layout vertical, align: center, gap: small, padding: large, fill: true:
        spinner
        label "Searching..."
    else if results is error:
      layout vertical, align: center, gap: small, padding: large:
        label "Search failed — tap to retry"
        button "Retry", color: brand, on tap: submitted_query = query
    else:
      each recipe in results:
        layout vertical, padding: medium, background: card, rounded: medium, gap: small:
          label recipe.title, style: title
          label recipe.prep_time + " min", style: caption
          label recipe.description, style: body
```

Notes on decisions:

**Trigger variable for query.** Standard cheatsheet pattern — `query` holds the live input, `submitted_query` is the fetch dependency. `on submit:` copies one to the other. Slider has no equivalent indirection because its drag-fires-fetch is required.

**Race-condition handling.** Nothing written for it — v0.21's runtime cancels in-flight requests when a reactive dep changes. The slider's rapid drag is the canonical case the runtime covers.

**Retry: reassign `submitted_query = query`.** Reassignment triggers re-fetch per the reactivity rule, regardless of whether the value changed. Cleaner than a separate `retry_token` in the URL or a self-reassign trick.

**Initial fetch fires with empty query.** The pattern as documented produces `q=&max_minutes=30` on first render — I let it fire rather than gate it. Gating with `if submitted_query is not empty:` runs into the "variables read outside a block must be declared at the top of the screen body" rule and conditional-assignment around `fetch()` isn't a shape the cheatsheet shows. A real app would handle the empty-query case server-side or add an empty-state branch in the success render; the prompt didn't specify, so I left it.

**Two cheatsheet gaps worth flagging:**

1. `slider step:` isn't in the cheatsheet's slider example. The prompt requires step 5, and `step:` is a natural property name, but it's not documented — assumption.
2. Number-to-string concatenation in the URL (`"&max_minutes=" + max_minutes`) — the cheatsheet shows string + string and `round()` returning a string, but no documented `str()` or implicit int→string coercion. Either the runtime coerces or there's a missing builtin. I wrote it the obvious wae spec..

---

## P3 — Notes app with persisted draft + sync to remote

```igni
theme:
  color:
    brand: "#5B6CFF"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F4F5FB"
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
    layout vertical, fill: true, gap: small:
      if shared.notes is empty:
        layout vertical, fill: true, align: center:
          label "No notes yet"
      else:
        each note in shared.notes:
          layout vertical, padding: medium, background: card, rounded: medium:
            label note.text

    button "+ New", color: brand, on tap: navigate to Editor

screen Editor, title: "New note":
  local_draft = shared.draft
  saved = false
  pending_text = ""

  sync_result = fetch("https://api.notes.example/sync", method: "POST", body: {text: pending_text})

  layout vertical, padding: large, gap: medium:
    if not saved:
      input bind: local_draft, placeholder: "Write a note", multiline: true, on change: shared.draft = local_draft
      button "Save", color: brand, on tap: save()
    else if sync_result is loading:
      layout vertical, fill: true, align: center, gap: small:
        spinner
        label "Saving..."
    else if sync_result is error:
      layout vertical, fill: true, align: center, gap: small:
        label "Sync failed"
        layout horizontal, gap: small:
          button "Retry", color: brand, on tap: pending_text = pending_text
          button "Back", on tap: navigate back
    else:
      layout vertical, fill: true, align: center, gap: small:
        label "Saved!"
        button "Done", color: brand, on tap: navigate back

  save():
    shared.notes = shared.notes + [{text: local_draft}]
    pending_text = local_draft
    shared.draft = ""
    saved = true
```

Notes on decisions:

**Stay on Editor during sync, navigate back on dismiss.** The prompt says both "navigate back to List" and "the user sees an inline 'Saved!' status after." These conflict if Save navigates back immediately — the user can't see status on a screen that's no longer mounted. Resolved: tap Save → append to shared.notes + fire POST + flip `saved = true` → Editor shows inline status → user taps Done/Back to navigate. Alternative would be hoisting sync state into `shared:` and showing the toast on List — heavier and not requested.

**Append-before-sync ordering.** Append to `shared.notes` synchronously in `save()`, then fire the POST. The prompt's wording ("append AND POST") supports this; failure means the local list has the note but backup didn't go through, which is the right durability shape — local-first.

**Retry: `pending_text = pending_text`.** Same-value reassignment triggers re-fetch per the reactivity rule (reassignment-triggered, not value-diff-triggered). Same pattern as the Search screen's retry. A counter-in-body would also work but pollutes the request payload with bookkeeping.

**input draft pattern.** Exact bridge from the cheatsheet — `local_draft = shared.draft` at the top, `on change: shared.draft = local_draft` to write back. Forced by the parse-time rejection of `input bind: shared.X`. The persisted shared draft means closing the app mid-keystroke survives, which is the constraint.

**"+ New" bottom-anchored.** Used the documented `fill: true`-on-content pattern. The button sits below the list (or below the empty-state).

**Cheatsheet gaps flagged:**

1. **`multiline: true` on input** isn't in the cheatsheet — only single-line `input bind: email, placeholder: "Email"` is shown. The constraint requires a multi-line editor; `multiline: true` is the obvious property name. Spec gap.
2. **Initial fetch fires on screen open.** `pending_text = ""` initial → one wasted POST on Editor open with empty body. The UI gates on `saved` so the user never sees this request's result, but it hits the network. The cheatsheet has no documented "fire fetch on demand" primitive — `fetch()` is reactive on its argument variables, and those resolve at mount. Real fix would be a deferred-fetch shape (`fetch_when(condition, ...)` or a `trigger` primitive). Same wart as the Search screen's empty-query first fetch — worth a v0.22 note.
3. **Multi-line input filling remaining vertical space.** `fill: true` is layout-only; primitives don't support it. So the textarea takes intrinsic height instead of expanding to fill the screen — UX wart for a notes editor where you'd expect the input to dominate. Wrapping the input in a `layout vertical, fill: true:` doesn't propagate the fill to the input itself.
