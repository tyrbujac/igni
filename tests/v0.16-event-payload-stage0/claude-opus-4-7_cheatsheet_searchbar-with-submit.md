```igni
component SearchBar:
  query = ""

  layout horizontal, gap: small:
    input bind: query, placeholder: "Search"
    button "Search", color: brand, on tap: emit submit query

screen Search:
  search_query = ""
  results = fetch("/api/search?q=" + search_query)

  layout vertical, gap: medium, padding: large:
    SearchBar on submit(text): search_query = text

    if search_query is empty:
      label "Type a query to begin"
    else if results is loading:
      spinner
    else if results is error:
      label "Search failed"
    else if results is empty:
      label "No results"
    else:
      each item in results:
        label item.title
```

## Design choices

**Local state in the component.** `SearchBar` owns its `query` variable internally. The parent doesn't need to see keystrokes — it only cares about submissions. This keeps the input's `TextEditingController` requirement (local-only `bind:`) satisfied without any bridging boilerplate.

**`emit submit query` carries the payload.** Because the parent needs the typed text, the child emits a value with the event. The parent receives it via `on submit(text):` — the parameter name is the parent's choice. A bare `on submit:` would be rejected at parse time since the child emits with a payload.

**Parent stores the submitted query as a separate trigger variable.** The cheatsheet explicitly warns against concatenating an `input bind:` variable into a fetch URL — it would re-fire per keystroke. Here, `search_query` only updates when the user taps Search, so the reactive `fetch()` re-runs exactly once per submission.

**Reactive `fetch()` at the top of the screen body.** Because `fetch()` re-runs whenever any variable in its arguments is reassigned, simply assigning `search_query` triggers the network call automatically — no explicit "go fetch now" function needed.

**Empty-query guard before checking `is loading`.** On first render, `search_query` is `""`, which would trigger a fetch for an empty query. The `if search_query is empty:` branch short-circuits that and shows a friendly prompt instead.