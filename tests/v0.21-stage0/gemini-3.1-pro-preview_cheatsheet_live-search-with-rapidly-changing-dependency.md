Here is the complete, idiomatic Igni application fulfilling your constraints. 

```igni
theme:
  color:
    brand: "#FF6B35"
    card: "#F9FAFB"

screen Search, title: "Find a recipe":
  query_input = ""
  active_query = ""
  max_minutes = 30
  retry_tick = 0
  
  # Reactive fetch: Re-runs automatically when any concatenated variable is reassigned
  url = "https://api.recipes.example/search?q=" + active_query + "&max_minutes=" + max_minutes + "&t=" + retry_tick
  results = fetch(url)

  layout vertical, padding: large, gap: medium:
    
    # 1. Input bound to a local draft, fetching only on submit
    input bind: query_input, placeholder: "Search recipes...", on submit: active_query = query_input

    # 2. Slider bound directly to the fetch dependency
    layout vertical, gap: small:
      label "Max prep time: " + max_minutes + " mins"
      slider bind: max_minutes, min: 5, max: 120, step: 5
    
    # 3. Dynamic results area
    layout vertical, fill: true, transition: fade:
      if results is loading:
        layout vertical, align: center, gap: medium:
          spinner
          label "Searching..."
          
      else if results is error:
        layout vertical, align: center, gap: medium:
          label "Search failed — tap to retry"
          button "Retry", color: brand, on tap: retry()
          
      else if results is empty:
        label "No recipes found."
        
      else:
        layout vertical, gap: medium:
          each recipe in results:
            RecipeCard recipe

  retry():
    retry_tick = retry_tick + 1

component RecipeCard(recipe):
  layout vertical, padding: medium, gap: small, background: card, rounded: medium:
    label recipe.title, style: title
    label recipe.prep_time + " mins", style: caption
    label recipe.description
```

### Why it's written this way:

1. **Two Types of Fetch Triggers:**
   * **Submit-gated (Text Input):** The `input` binds to `query_input` (which updates on every keystroke), but the fetch URL depends on `active_query`. The `on submit: active_query = query_input` action acts as a gatekeeper, satisfying your requirement not to fetch on every keystroke. 
   * **Live (Slider):** The `slider` binds directly to `max_minutes`, which is concatenated straight into the URL. Every drag tick reassigns `max_minutes`, which triggers a reactive re-fetch instantly.
2. **Built-in Cancellation for the Slider:** You mentioned rapid slider drags should only show the latest result. In Igni, you don't write manual debouncing or cancellation logic for this. When `max_minutes` changes while a previous `fetch` is still in flight, the framework closes the stale request and its response is dropped via an internal generation counter. The UI will only ever render the outcome of the final drag tick.
3. **The Retry Pattern:** When a fetch fails, we need a way to re-run it even if the user hasn't changed their search query. We achieve this by concatenating a `retry_tick` counter to the URL. The `retry()` function increments it, which obeys Igni's golden rule: *a screen re-evaluates whenever a state variable is reassigned*. This cleanly forces a fresh network call.
4. **Conditional State Wrapping & Transitions:** The result area is wrapped in `layout vertical, fill: true, transition: fade:`. 
   * `fill: true` forces the state container to span whatever screen height is left below the controls. 
   * The `if / else if` chain takes advantage of the fact that `is loading` and `is error` halt execution before we ever attempt to read the resolved list properties (`is empty` or `each`). 
   * `transition: fade` automatically crossfades whenever the `if/else` resolution swaps branches.
5. **Component Factoring:** The `RecipeCard` is factored out into a `component`. If we left it inline, the `each` loop contents would push us past Igni's strict 4-level nesting limit. Moving it to a component resets the depth counter and keeps the screen readable.