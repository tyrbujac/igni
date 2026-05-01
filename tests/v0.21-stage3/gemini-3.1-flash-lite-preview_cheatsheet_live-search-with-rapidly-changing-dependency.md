```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#0D0D14"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Search, title: "Find a recipe":
  query = ""
  query_trigger = ""
  max_minutes = 60
  
  # Fetch uses a trigger variable to avoid per-keystroke API spam
  recipes = fetch("https://api.recipes.example/search?q=" + query_trigger + "&max_minutes=" + max_minutes)

  layout vertical, padding: medium, gap: medium:
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search recipes...", on submit: query_trigger = query
      button "Search", on tap: query_trigger = query
    
    layout horizontal, gap: small, align: center:
      label "Prep time (min):"
      slider bind: max_minutes, min: 5, max: 120
      label max_minutes
    
    layout vertical, fill: true:
      if recipes is loading:
        layout vertical, align: center, fill: true:
          spinner
          label "Searching..."
      else if recipes is error:
        layout vertical, align: center, fill: true:
          label "Search failed — tap to retry"
          button "Retry", on tap: query_trigger = query
      else:
        each recipe in recipes:
          layout vertical, padding: small, border: thin, rounded: medium:
            label recipe.title, style: heading
            label recipe.prep_time + " mins"
            label recipe.description, style: caption
```

### Design Notes:
1.  **Trigger Pattern:** As required by the "input-bind-fetch" rule, I separated `query` (the input state) from `query_trigger` (the API-driving state). The `on submit:` handler (or the "Search" button tap) updates the trigger, ensuring we only fetch when the user explicitly requests it, while the `slider` directly drives the API (as it provides a clean, continuous numeric value suited for reactive fetches).
2.  **State Handling:** I used the standard `is loading` / `is error` pattern. The `else` block automatically captures the successful list, rendering the cards inside a vertical layout.
3.  **Layout Logic:** The content area uses `fill: true` to occupy the remaining screen height, and the error/loading states use `align: center` within that filled space to keep the UI visually balanced.
4.  **Race Conditions:** Because this relies on the native `fetch()` reactive dependency rule, the Igni v0.21 runtime will automatically cancel stale requests if `query_trigger` or `max_minutes` change before a previous request finishes, ensuring the UI always reflects the latest state.