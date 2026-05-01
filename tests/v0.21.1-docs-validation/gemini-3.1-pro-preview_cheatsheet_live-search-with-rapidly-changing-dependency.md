Here is the complete `Search.igni` app. It implements every constraint using the canonical v0.21 shapes, including the trigger-variable pattern for the text input, live reactivity for the slider, and the native race-condition handling for rapid fetches.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FAFAFA"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: brand

component RecipeCard(recipe):
  layout vertical, padding: medium, gap: small, background: card, rounded: medium:
    label recipe.title, style: title
    label recipe.minutes + " mins", style: caption
    label recipe.description

screen Search, title: "Find a recipe":
  query = ""
  submitted_query = ""
  max_minutes = 30

  # Reactive fetch: automatically re-runs whenever submitted_query or max_minutes changes.
  # Mid-flight cancellations on rapid slider drags are handled natively by Igni v0.21.
  results = fetch("https://api.recipes.example/search?q=" + submitted_query + "&max_minutes=" + max_minutes)

  layout vertical, padding: large, gap: medium:
    
    # 1. Text input bound to a local draft (`query`), but only updates the 
    # fetch dependency (`submitted_query`) when the user submits.
    input bind: query, placeholder: "Search recipes...", on submit: submitted_query = query
    
    # 2. Slider bound directly to the fetch dependency (`max_minutes`). 
    # Every tick of the drag reassigns the variable and fires the fetch.
    layout horizontal, gap: medium, align: center:
      label "Max prep: " + max_minutes + "m"
      layout vertical, fill: true:
        slider bind: max_minutes, min: 5, max: 120, step: 5
    
    divider

    # 3. Conditional rendering with a transition for smooth state swaps.
    layout vertical, fill: true, transition: fade:
      if results is loading:
        layout horizontal, gap: small, align: center:
          spinner
          label "Searching..."
          
      else if results is error:
        layout vertical, gap: small, align: center:
          label "Search failed — tap to retry"
          # Canonical retry pattern: reassigning a dependency to itself triggers a re-fetch
          button "Retry", on tap: submitted_query = submitted_query
          
      else if results is empty:
        label "No recipes match your criteria."
        
      else:
        layout vertical, gap: medium:
          each recipe in results:
            RecipeCard recipe
```

### Why these canonical shapes were chosen:

1. **The `input` trigger variable (`query` vs `submitted_query`)**
   Because `input bind: X` updates `X` on every keystroke, directly concatenating `X` into a `fetch()` URL would cause a keystroke storm. We assign the `bind:` to a dead-end variable (`query`), and use the `on submit:` event handler to reassign `submitted_query`. The reactivity engine traces the `fetch` to `submitted_query` only.
2. **The `slider` direct bind (`max_minutes`)**
   The prompt required live updates on drag. By binding the slider directly to `max_minutes` (which the `fetch` references), every pixel of drag re-evaluates the screen and fires a new fetch. **You don't need a debounce or abort controller.** Igni v0.21's cancellation rule guarantees that if `max_minutes` changes while a previous request is in-flight, the old request is dropped and only the latest result will resolve into the `results` variable.
3. **The Retry Button**
   The simplest way to re-fire a reactive read in Igni is `on tap: dependency = dependency`. Assigning `submitted_query = submitted_query` fires the assignment observer, causing the screen to re-evaluate and the `fetch()` to re-run, without needing a dedicated `retry_count` integer.
4. **`transition: fade` on the results container**
   Because the state naturally leaps between distinct visual branches (`loading` → `error` → `results`), applying `transition: fade` to their parent `layout vertical` tells the codegen to insert an `AnimatedSwitcher`. It natively keys off the `if/else if/else` branch identity, giving you smooth cross-fades for free.
5. **Component extraction (`RecipeCard`)**
   Max nesting depth in Igni is 4 levels. By extracting the list item into `component RecipeCard(recipe):`, we keep the main screen's indentation shallow and strictly within the compiler's limits, while making the `each` loop beautifully concise.