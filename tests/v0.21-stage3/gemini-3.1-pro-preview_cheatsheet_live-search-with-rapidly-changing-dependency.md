Here is the complete app. It includes a project-wide `theme:` block, the `Search` screen, and a `RecipeCard` component to keep the layout within the strict 4-level nesting limit.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#F5F5F5"
  scaffold:
    background: surface

screen Search, title: "Find a recipe":
  query = ""
  active_query = ""
  max_minutes = 30
  retry_tick = 0

  # Reactive fetch: auto-runs when active_query, max_minutes, or retry_tick reassign.
  url = "https://api.recipes.example/search?q=" + active_query + "&max_minutes=" + max_minutes + "&t=" + retry_tick
  results = fetch(url)

  layout vertical, padding: medium, gap: medium:
    # Trigger-variable pattern: inputs to 'query', only commits to 'active_query' on submit.
    input bind: query, placeholder: "Search recipes...", on submit: active_query = query

    layout horizontal, align: center, gap: medium:
      label "Max prep time: " + max_minutes + " mins"
      slider bind: max_minutes, min: 5, max: 120, step: 5

    # transition: fade animates the swap between loading / error / list states
    layout vertical, fill: true, transition: fade:
      if results is loading:
        layout vertical, align: center, gap: medium:
          spinner
          label "Searching..."
      else if results is error:
        layout vertical, align: center, gap: medium:
          label "Search failed — tap to retry"
          button "Retry", on tap: retry_tick = retry_tick + 1
      else:
        layout vertical, gap: medium:
          if results is empty:
            label "No recipes found for '" + active_query + "'"
          else:
            each item in results:
              RecipeCard item

# Extracted to obey the 4-level nesting rule and keep the screen body readable
component RecipeCard(item):
  layout vertical, padding: medium, background: card, rounded: medium, gap: small:
    label item.title, style: title
    label item.prep_time + " mins", style: caption
    label item.description
```

### Design Decisions & Idiomatic Shapes

*   **The Trigger-Variable Pattern:** The text input is bound to `query` (which updates per-keystroke so the UI feels responsive), but the `fetch` depends on `active_query`. The `on submit:` handler commits `query` to `active_query`. This creates the explicit isolation boundary the cheat sheet demands to prevent network-request storms while typing.
*   **Race Conditions on Slider Drag:** You don't write debouncers in Igni. Binding the slider to `max_minutes` and concatenating that directly into the URL means the `fetch()` fires continuously as the user drags. The v0.21 runtime automatically cancels in-flight requests and ignores stale responses, so the user is guaranteed to see only the result of where the slider comes to rest. 
*   **The `retry_tick` Pattern:** To implement a Retry button, you must reassign a dependency of the `fetch()`. If the user hits Retry without changing their search terms, `active_query` and `max_minutes` haven't changed. Appending `&t=" + retry_tick` to the URL gives the `on tap:` handler a unique state integer to increment, mutating the URL and forcing the reactive re-fetch predictably without an imperative `reload()` function.
*   **`transition: fade` Placement:** The transition sits on the `layout vertical` that wraps the `if / else if / else` block. As the network state resolves from `is loading` to a loaded list, the layout's immediate child set is replaced, triggering the cross-fade automatically.