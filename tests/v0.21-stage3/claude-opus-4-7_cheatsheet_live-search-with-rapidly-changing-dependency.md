```igni
theme:
  color:
    brand: "#FF6B35"

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
        button "Retry", color: brand, on tap: submitted_query = submitted_query + ""
    else:
      if results is empty:
        label "No recipes found"
      else:
        each recipe in results:
          layout vertical, gap: small, padding: medium, background: card, rounded: medium:
            label recipe.title, style: title
            label recipe.prep_minutes + " min", style: caption
            label recipe.description, style: body
```

### Notes on the canonical-shape choices

**1. Trigger variable for the input, direct bind for the slider.** The cheatsheet explicitly calls out the keystroke-storm pitfall for `input bind:` concatenated into a fetch URL, and prescribes the trigger-variable pattern via `on submit:` (or `on tap:`). The slider has no equivalent rule — drag-driven URL changes are exactly what the v0.21 reactive-fetch race-condition handling covers (latest fire wins, stale responses ignored). So `max_minutes` goes straight into the fetch URL; `query` is staged into `submitted_query` on submit.

**2. Retry mechanism.** Two equally-canonical shapes: (a) reassign `submitted_query` to itself to re-fire the reactive fetch, or (b) introduce a separate `retry_token` integer and bump it. I picked (a) — `submitted_query = submitted_query + ""` — because it keeps the dependency surface to one variable. The `+ ""` is the minimal reassignment that triggers re-evaluation (Igni's reactivity fires on assignment, not on value change). Option (b) would be cleaner if retries were frequent or if `submitted_query` had richer semantics, but for one retry button this is tighter.

**3. Slider label above the slider.** The cheatsheet's slider example doesn't show a value-display pattern, so I mirrored the typical mobile-form shape — caption-styled label above showing the current value, then the slider. Reads as a single labelled control.

**4. Result cards as `background: card, rounded: medium`.** The cheatsheet's `card` token is the canonical surface for list items; `rounded: medium` matches the conventional card silhouette. No `border:` since the background already separates the card from the screen.