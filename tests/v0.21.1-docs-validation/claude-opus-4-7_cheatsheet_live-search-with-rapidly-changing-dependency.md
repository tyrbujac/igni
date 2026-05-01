```igni
# app.igni

theme:
  color:
    brand: "#E8703A"

screen Search, title: "Find a recipe":
  query = ""
  submitted_query = ""
  max_minutes = 30

  results = fetch("https://api.recipes.example/search?q=" + submitted_query + "&max_minutes=" + max_minutes)

  layout vertical, gap: medium, padding: large:
    input bind: query, placeholder: "Search recipes", on submit: submitted_query = query

    layout vertical, gap: small:
      label "Max prep time: " + max_minutes + " min", style: caption
      slider bind: max_minutes, min: 5, max: 120, step: 5

    if results is loading:
      layout vertical, gap: small, align: center, padding: large:
        spinner
        label "Searching..."
    else if results is error:
      layout vertical, gap: small, align: center, padding: large:
        label "Search failed — tap to retry"
        button "Retry", color: brand, on tap: submitted_query = submitted_query
    else:
      if results is empty:
        label "No recipes found", style: caption
      else:
        each recipe in results:
          layout vertical, gap: small, padding: medium, background: card, rounded: medium:
            label recipe.title, style: title
            label recipe.prep_minutes + " min", style: caption
            label recipe.description, style: body
```

**Notes on choices:**

- **Input trigger variable is `submitted_query`, not a counter.** The cheatsheet's input-bind-fetch pattern wants a separate trigger variable; reading `submitted_query` (not `query`) into the fetch URL means keystrokes don't re-fire. `on submit: submitted_query = query` promotes the live draft to the trigger on Enter.
- **Slider binds directly into the fetch URL.** Per the cheatsheet, `slider bind: max_minutes` is fine — it's not the input-bind exception. Each drag-step reassigns `max_minutes`, the fetch's argument changes, and v0.21's reactive-fetch cancellation rule ensures stale in-flight requests are dropped automatically. No debouncing primitive needed.
- **Retry uses `submitted_query = submitted_query`.** Canonical "reassign-to-self" shape from §Reacting to users — fires reactivity by reference, not by value-diff, so the fetch re-runs even though the URL string is identical.
- **Initial state shows all recipes at 30 min max.** `submitted_query = ""` means the first fetch fires immediately with an empty query. If you'd rather gate the first fetch behind a submit, wrap the fetch in `if submitted_query is not empty:` — I picked the eager shape because "browse by prep-time alone" is a useful default for a recipe search.
- **Empty-results check is nested inside the success branch**, not a fourth top-level state. `results is empty` is only meaningful once `is loading` and `is error` are ruled out.