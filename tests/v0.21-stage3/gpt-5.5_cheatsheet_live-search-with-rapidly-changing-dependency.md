```igni
# Search.igni

theme:
  color:
    brand: "#2E7D32"
    surface: "#FFFDF7"
    text: "#1F241F"
    muted: "#6B756B"
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

screen Search, title: "Find a recipe":
  query = ""
  submitted_query = ""
  max_minutes = 30

  results = fetch("https://api.recipes.example/search?q=" + submitted_query + "&max_minutes=" + max_minutes)

  layout vertical, padding: large, gap: medium, transition: fade:
    input bind: query, placeholder: "Search recipes", on submit: submit_search()

    label "Max prep time (minutes)", style: caption
    slider bind: max_minutes, min: 5, max: 120, step: 5
    label max_minutes, style: caption

    if results is loading:
      layout horizontal, gap: small, align: center:
        spinner
        label "Searching..."

    else if results is error:
      layout vertical, gap: small:
        label "Search failed — tap to retry", color: danger
        button "Retry", color: brand, on tap: retry()

    else:
      if results is empty:
        label "No recipes found"
      else:
        layout vertical, gap: medium:
          each recipe in results:
            layout vertical, padding: medium, gap: small, background: card, rounded: medium:
              label recipe.title, style: title
              label recipe.prep_minutes, style: caption
              label recipe.description

  submit_search():
    submitted_query = query

  retry():
    submitted_query = submitted_query
```

I used the canonical trigger-variable pattern for the input: `query` is the live text field value, while `submitted_query` is the value read by `fetch()`. Typing does not refetch; submitting reassigns `submitted_query`, which refires the single `fetch()`.

The slider is bound directly to `max_minutes`, so every drag change reassigns it and refires the same `fetch()` call. In Igni v0.21, rapid reactive fetch changes are latest-wins, so stale mid-drag responses are ignored/cancelled automatically.