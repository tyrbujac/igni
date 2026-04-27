```igni
component SearchBar:
  text = ""
  layout horizontal, gap: small:
    input bind: text, placeholder: "Search"
    button "Search", color: brand, on tap: emit submit text

screen Search:
  query = ""
  results = fetch("/api/search?q=" + query)

  layout vertical, gap: medium, padding: large:
    SearchBar on submit(q): query = q

    if query is empty:
      label "Type something to search"
    else if results is loading:
      spinner
    else if results is error:
      label "Search failed"
    else if results is empty:
      label "No results"
    else:
      each result in results:
        label result.title
```

## Design choices

**Emitting the query as event data.** The component carries its own `text` state (a local variable bound to the `input`). On tap, it emits `submit text` — a single positional payload. The parent receives it with `on submit(q):` and names the receiver `q`. This keeps the component self-contained: the parent never reaches into the component's `text`, and the component doesn't need to know what the parent does with the query.

**Bridging the emit into a fetch via a trigger variable.** The cheatsheet warns: *"Don't concatenate an `input bind:` variable into a fetch URL — it re-fires per keystroke."* The `emit submit` pattern naturally avoids that — the query only updates when the user taps Search, not on every keystroke. So `query` becomes the trigger variable, and `fetch("/api/search?q=" + query)` re-runs only when `query` is reassigned (i.e., on submit).

**Empty-query guard.** Without the `if query is empty:` branch, the screen would fire a fetch to `/api/search?q=` on first render. Gating on `query is empty` defers the fetch until the user actually submits something.

**Result states in declarative order.** `is loading` → `is error` → `is empty` → render. The `is empty` check works on the resolved list (after loading completes) and gives the "No results" message its own branch, distinct from network failures.

**No parentheses on component invocation.** `SearchBar on submit(q): ...` follows the cheatsheet's no-arg invocation form (`CartIcon`) since `SearchBar` takes no parameters — the placeholder is hardcoded inside per the spec.