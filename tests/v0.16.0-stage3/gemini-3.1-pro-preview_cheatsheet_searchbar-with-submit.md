Here is the complete Igni code for the app:

```igni
component SearchBar:
  query = ""

  layout horizontal, gap: medium:
    input bind: query, placeholder: "Search"
    button "Search", on tap: emit submit query

screen Search:
  results = null

  layout vertical, padding: large, gap: medium:
    label "Search Directory", style: heading
    
    SearchBar on submit(q): results = fetch("/api/search?q=" + q)

    if results is null:
      label "Enter a query to begin."
    else if results is loading:
      spinner
    else if results is error:
      label "Something went wrong.", color: danger
    else if results is empty:
      label "No results found."
    else:
      each item in results:
        label item.title
```

### Design Choices & Igni Idioms Used

* **Preventing "Fetch-per-Keystroke":** The cheat sheet strictly warns against putting an `input bind:` variable directly into a `fetch()` URL, as Igni's lexical reactivity would trigger a network request on every keystroke. To solve this, the `query` variable is kept strictly local to the `SearchBar` component. The parent screen only re-evaluates when the `submit` event fires.
* **Component Event Payload (`emit`):** The `SearchBar` defines its custom event with `emit submit query`. When tapped, this packs the current string into a payload. The parent receives this by naming its own variable in parentheses (`on submit(q):`), allowing it to pass the frozen string directly to `fetch()`.
* **Plain Variables for Async State:** The top-level `results = null` assignment initializes the screen. Because top-level variable assignments only run *once* when the screen opens, `results` doesn't reset when the screen re-renders. 
* **Special Conditional Forms:** Instead of manual checks or observable wrappers, Igni provides built-in conditional statements for common states. `is loading` and `is error` perfectly map to the lifecycle of the `fetch()` primitive, and `is empty` checks the resulting list length cleanly without needing `length(results) is 0`.