```igni
# Search.igni

theme:
  color:
    brand: "#FF6B35"
    surface: "#FFF8F2"
    surface_elevated: "#FFFFFF"
    text: "#201A17"
    muted: "#6B625D"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#17120F"
    surface_elevated: "#241C18"
    text: "#FFF8F2"
    muted: "#C8B9B0"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Search, title: "Find a recipe":
  query = ""
  submitted_query = ""
  max_minutes = 30

  recipes = fetch("https://api.recipes.example/search?q=" + submitted_query + "&max_minutes=" + max_minutes)

  layout vertical, padding: large, gap: medium, transition: fade:
    input bind: query, placeholder: "Search recipes", on submit: submit_search()

    layout vertical, gap: small:
      layout horizontal, gap: small:
        label "Max prep time:"
        label max_minutes
        label "minutes"
      slider bind: max_minutes, min: 5, max: 120, step: 5

    if recipes is loading:
      layout horizontal, gap: small, align: center:
        spinner
        label "Searching..."
    else if recipes is error:
      layout vertical, padding: medium, gap: medium, background: surface_elevated, rounded: medium, border: thin, on tap: retry():
        label "Search failed — tap to retry"
        button "Retry", color: brand, on tap: retry()
    else:
      if recipes is empty:
        label "No recipes found"
      else:
        layout vertical, gap: medium:
          each recipe in recipes:
            layout vertical, padding: medium, gap: small, background: surface_elevated, rounded: medium, border: thin:
              label recipe.title, style: title
              label "Prep time: " + recipe.prep_minutes + " minutes", style: caption, color: muted
              label recipe.description

  submit_search():
    submitted_query = query

  retry():
    submitted_query = submitted_query
```

Notes on the two main choices:

- The input is bound to `query`, but the `fetch()` depends on `submitted_query`. That is the Igni trigger-variable pattern: typing updates `query` live, but the network request only re-fires when `on submit:` copies it into `submitted_query`.
- The slider is bound directly to `max_minutes`, and `max_minutes` is in the fetch URL, so every drag value re-fires the same `fetch()` call. Igni’s reactive fetch cancellation/generation behavior ensures stale mid-drag responses are dropped and the latest request wins.