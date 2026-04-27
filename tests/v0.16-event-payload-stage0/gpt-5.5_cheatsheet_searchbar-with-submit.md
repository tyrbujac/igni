```igni
component SearchBar:
  query = ""

  layout horizontal, gap: medium:
    input bind: query, placeholder: "Search"
    button "Search", on tap: emit submit query


screen Search:
  results = null

  layout vertical, padding: large, gap: medium:
    SearchBar on submit(query): results = fetch("/api/search?q=" + query)

    if results is loading:
      spinner
    else if results is error:
      label "Failed"
    else if results is not null:
      if results is empty:
        label "No results"
      else:
        each result in results:
          label result.title
```

The `SearchBar` keeps its own local `query` state with `input bind: query`. When the button is tapped, it emits a custom `submit` event and passes the current query as the event payload:

```igni
emit submit query
```

The parent receives that payload with:

```igni
SearchBar on submit(query): results = fetch("/api/search?q=" + query)
```

The `query` name in `on submit(query):` is chosen by the parent; it receives the value emitted by the component. The parent then assigns `results` to a `fetch(...)` call, so the request only happens when the user taps Search, not on every keystroke.

`results` starts as `null`, which means the screen shows nothing before the first search. After submission, it shows a spinner while loading, an error label on failure, `"No results"` for an empty response, or a vertical list of `result.title` labels.