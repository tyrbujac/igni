```igni
# Search.igni

theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#111827"
    muted: "#6B7280"
  scaffold:
    background: surface
  appbar:
    background: brand
    foreground: white

theme dark:
  color:
    surface: "#111827"
    text: "#F9FAFB"
    muted: "#9CA3AF"
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

  layout vertical, padding: large, gap: medium:
    input bind: query, placeholder: "Search recipes", on submit: submit_search()

    label "Max prep time", style: title
    slider bind: max_minutes, min: 5, max: 120, step: 5
    label max_minutes, style: caption, color: muted

    if results is loading:
      layout vertical, gap: small, align: center:
        spinner
        label "Searching..."

    else if results is error:
      layout vertical, gap: small, align: center:
        label "Search failed — tap to retry", color: danger
        button "Retry", on tap: retry()

    else:
      if results is empty:
        label "No recipes found"
      else:
        each recipe in results:
          layout vertical, padding: medium, gap: small, background: card, rounded: medium, border: thin:
            label recipe.title, style: title
            label recipe.prep_minutes, style: caption, color: muted
            label recipe.description

  submit_search():
    submitted_query = query

  retry():
    submitted_query = submitted_query
```

I used `query` as the input-bound draft value and `submitted_query` as the fetch trigger value. That is the idiomatic Igni shape for “type freely, fetch only on submit”: keystrokes reassign `query`, but the `fetch()` depends on `submitted_query`, so it only re-runs when `submit_search()` copies the draft across.

The slider is bound directly to `max_minutes`, which is part of the fetch URL, so dragging it live re-fires the same `fetch()` call on every value change. Igni v0.21’s fetch cancellation/latest-wins rule handles rapid slider changes, so stale mid-drag responses are ignored.