```igni
component SearchBar:
  query = ""

  layout horizontal, gap: medium:
    input bind: query, placeholder: "Search"
    button "Search", on tap: emit submit query

screen Search:
  results = null

  layout vertical, gap: medium, padding: large:
    SearchBar, on submit(query): results = fetch("/api/search?q=" + query)

    if results is null:
      label "Type a search and tap Search"
    else if results is loading:
      spinner
    else if results is error:
      label "Search failed"
    else if results is empty:
      label "No results"
    else:
      layout vertical, gap: small:
        each result in results:
          label result.title
```

The `SearchBar` owns its local `query` state through `input bind: query`. When the button is tapped, it emits a custom `submit` event with the typed query as its payload:

```igni
emit submit query
```

The parent receives that payload with:

```igni
on submit(query): results = fetch("/api/search?q=" + query)
```

The `query` name is chosen by the parent handler and is available in the parent scope for building the fetch URL. Assigning the `fetch()` result to `results` lets the screen react to `loading`, `error`, empty, and populated states. `results` starts as `null` so the app does not show `"No results"` before the first search.