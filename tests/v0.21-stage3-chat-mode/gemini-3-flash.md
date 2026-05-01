# Stage 3 chat-mode — gemini-3-flash

## P1 — Theme + sender-name settings with persisted preferences

## Settings.igni

```igni
theme:
  color:
    brand: "#FF6B35"
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
  # brand inherits from light theme automatically

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  # Bridge for the input primitive (per v0.21 bind rule)
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: large:
    
    # Theme Selection Section
    layout vertical, gap: small:
      label "Appearance", style: title
      layout horizontal, gap: small, spread: true:
        ThemeOption "System", "system"
        ThemeOption "Light", "light"
        ThemeOption "Dark", "dark"

    divider

    # Sender Preference Section
    layout vertical, gap: small:
      label "Default Sender Name", style: title
      input bind: draft_name, placeholder: "Your name on sent cards", on change: save_name()
      label "This name will appear on all cards you send.", style: caption

  save_name():
    shared.sender_name = draft_name

component ThemeOption(label_text, mode):
  # Selected state pattern: uses width and color to signal active choice
  is_active = shared.theme_mode is mode
  
  border_w = thin
  border_c = subtle
  if is_active:
    border_w = thick
    border_c = brand

  layout vertical, fill: true, padding: medium, rounded: medium, border: border_w, color: border_c, on tap: shared.theme_mode = mode:
    label label_text, align: center
```

---

### Implementation Notes

*   **Persisted State**: Both `theme_mode` and `sender_name` are placed in the `shared persisted:` block. This ensures that when the user flips a theme toggle or types their name, the data is saved to disk and survives an app restart.
*   **The `input` Exception**: Since `input bind:` cannot target `shared` state directly, I used a local `draft_name` initialized to the shared value. The `on change:` handler syncs it back to `shared.sender_name` on every keystroke.
*   **ThemeOption Component**: To avoid code duplication for the three theme buttons, I created a `ThemeOption` component. It uses the **Selected-state pattern** where the border width and color react to whether the `mode` passed in matches the current `shared.theme_mode`.
*   **Layout Strategy**: I used `layout horizontal, spread: true:` with `fill: true` on the component containers. This ensures the three theme buttons divide the screen width equally, creating a balanced "segmented control" look.

---

## P2 — Live-search with rapidly-changing dependency

## Search.igni

```igni
theme:
  color:
    brand: "#2E7D32"      # A recipe-friendly green
    surface: "#FFFFFF"
    text: "#1C1C1E"
    subtle: "#8E8E93"
    card: "#F2F2F7"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Search, title: "Find a recipe":
  # 1. State declarations
  draft_query = ""
  trigger_query = ""
  max_minutes = 30
  
  # 2. Async fetch
  # Note: trigger_query updates on 'submit', max_minutes updates on 'drag'.
  # Igni v0.21.0 handles rapid slider updates (race conditions) automatically.
  results = fetch("https://api.recipes.example/search?q=" + trigger_query + "&max_minutes=" + max_minutes)

  layout vertical, padding: large, gap: medium:
    
    # Search Input
    layout vertical, gap: small:
      label "Keywords", style: caption
      input bind: draft_query, placeholder: "Chicken, pasta...", on submit: trigger_query = draft_query

    # Prep Time Filter
    layout vertical, gap: small:
      layout horizontal, spread: true:
        label "Max Prep Time", style: caption
        label max_minutes + " min", style: caption, color: brand
      slider bind: max_minutes, min: 5, max: 120
      # Slider step: Igni sliders are continuous by default; 
      # the API handles specific ints, but for visual 'steps' of 5, 
      # one could wrap max_minutes in a display function.

    divider

    # 3. Conditional Rendering (State Handling)
    if results is loading:
      layout vertical, fill: true, align: center:
        spinner
        label "Searching...", style: body, color: subtle
    
    else if results is error:
      layout vertical, fill: true, align: center, gap: medium:
        label "Search failed — tap to retry", color: danger
        # Re-assigning a dependency (trigger_query) forces a re-fetch
        button "Retry", color: brand, on tap: trigger_query = trigger_query

    else if results is empty:
      layout vertical, fill: true, align: center:
        label "No recipes found matching your criteria.", color: subtle
    
    else:
      # Success: Render list
      layout vertical, fill: true:
        each recipe in results:
          RecipeCard recipe

# 4. Custom Component for results
component RecipeCard(recipe):
  layout vertical, padding: medium, background: card, rounded: medium, gap: small:
    layout horizontal, spread: true:
      label recipe.title, style: title
      label recipe.prep_time + "m", style: caption, color: brand
    label recipe.description, style: body, color: subtle
```

---

### Implementation Notes

*   **Trigger Pattern**: Per the cheatsheet's "fetch-URL rule," I separated `draft_query` (bound to input) from `trigger_query` (used in the URL). This prevents the API from being hit on every single character typed. The `on submit:` handler on the `input` bridges the two.
*   **Slider Reactivity**: Unlike the text input, the `slider` binds directly to `max_minutes`, which is a direct dependency of the `fetch`. Because `max_minutes` reassigns on every drag movement, the `fetch` fires immediately. 
*   **Race Conditions**: I did not implement manual debouncing or cancellation logic. Per §Async in the spec, Igni v0.21 handles "keystroke storms" (or in this case, "slider storms") by ensuring the latest request always wins and stale responses are ignored.
*   **Retry Logic**: To trigger a retry, I simply re-assigned `trigger_query = trigger_query`. Since the screen re-evaluates whenever a variable in the `fetch` arguments is assigned, this satisfies the requirement to restart the request.

---

## P3 — Notes app with persisted draft + sync to remote

## Notes.igni

```igni
theme:
  color:
    brand: "#6200EE"
    surface: "#FFFFFF"
    text: "#000000"
    card: "#F5F5F5"
    success: "#2E7D32"
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

shared persisted:
  notes = []
  draft = ""

# --- Screens ---

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    button "+ New", color: brand, on tap: navigate to Editor
    
    divider

    if notes is empty:
      layout vertical, fill: true, align: center:
        label "No notes yet", color: subtle
    else:
      layout vertical, gap: small:
        each note in notes:
          layout vertical, padding: medium, background: card, rounded: medium:
            label note.text

screen Editor, title: "New note":
  # Using a trigger variable for the POST to prevent keystroke-firing
  sync_payload = null
  sync_result = null

  if sync_payload is not null:
    sync_result = fetch("https://api.notes.example/sync", method: "POST", body: {text: sync_payload})

  layout vertical, padding: large, gap: medium:
    # multi-line input via implicit vertical expansion (or just standard input)
    input bind: shared.draft, placeholder: "Write something..."
    
    layout horizontal, gap: medium, align: center:
      button "Save", color: brand, on tap: save_note()
      
      # Status Handling for Sync
      if sync_result is loading:
        spinner
      else if sync_result is error:
        label "Sync failed", color: danger
      else if sync_result is not null:
        label "Saved!", color: success

  save_note():
    # 1. Update local persisted state
    notes = notes + [{text: shared.draft}]
    
    # 2. Trigger the network sync
    sync_payload = shared.draft
    
    # 3. Clear the persisted draft
    shared.draft = ""
    
    # 4. Return home
    navigate back
```

---

### Implementation Notes

*   **Persistence Strategy**: Both `notes` and `draft` are inside `shared persisted:`. Because the `input` in the Editor binds directly to `shared.draft`, every character typed is immediately written to disk by the runtime. If the app crashes or is closed, the text is still there when the user returns.
*   **POST Trigger Pattern**: I used the `sync_payload` variable as a reactive trigger for the `fetch`. Per the cheatsheet, we avoid concatenating `input` variables directly into fetches. By assigning `sync_payload = shared.draft` inside the `save_note()` function, the `fetch` fires exactly once when the button is tapped.
*   **Navigation Choice**: I used `navigate back` after saving. While `navigate to List` would also work, `back` is more idiomatic for a "New Item" sub-screen as it pops the route off the stack and returns the user to their previous context.
*   **Shared Variable Access**: In the `save_note` function, I used `notes = notes + [...]`. Because `notes` is a shared variable, the Igni compiler treats this as a reassignment to the shared state, triggering re-renders on the `List` screen automatically.
