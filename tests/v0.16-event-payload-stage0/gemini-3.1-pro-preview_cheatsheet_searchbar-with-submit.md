Here is the complete Igni code for the app:

```igni
component SearchBar:
  query = ""

  layout horizontal, gap: medium:
    input bind: query, placeholder: "Search"
    button "Search", color: brand, on tap: emit submit query

screen Search, title: "Search":
  active_query = ""
  results = fetch("/api/search?q=" + active_query)

  layout vertical, padding: large, gap: medium:
    SearchBar on submit(text): active_query = text

    if active_query is not empty:
      if results is loading:
        spinner
      else if results is error:
        label "Failed to load results", color: danger
      else if results is empty:
        label "No results", color: subtle
      else:
        each item in results:
          label item.title
```

### Design Choices & How it Works

1. **Localizing Keystrokes (The Component):** 
   The `SearchBar` component declares its own `query` variable and binds the `input` to it. This means every keystroke updates the component's internal state, but does *not* leak out to re-render the parent screen or trigger a premature API call. 
2. **Emitting the Query (The Interface):** 
   Instead of modifying shared state, the component uses `emit submit query` when the button is tapped. The parent catches this payload via `on submit(text):` and reassigns its own `active_query` variable inline.
3. **Reactive Fetching (The Parent):**
   In Igni, `fetch()` inherently tracks its arguments. Because `results = fetch(...)` incorporates `active_query` into its URL, reassigning `active_query` automatically triggers a new network request and evaluates the screen back to an `is loading` state.
4. **Conditional Flow (The UI):**
   The entire results section is gated behind `if active_query is not empty:` so the user isn't shown a loading spinner or an empty state when they first open the screen. Inside that block, standard top-down statements (`is loading`, `is error`, `is empty`) explicitly dictate exactly what to render.