```igni
component SearchBar:
  query = ""
  layout horizontal, gap: medium:
    input bind: query, placeholder: "Search"
    button "Search", on tap: emit submit query

screen Search:
  results = []
  trigger = ""

  # Fetching logic: triggered by the change in 'trigger'
  search_results = fetch("/api/search?q=" + trigger)

  layout vertical, padding: large:
    SearchBar on submit(text): trigger = text

    if search_results is loading:
      spinner
    else if search_results is empty:
      label "No results"
    else:
      layout vertical:
        each item in search_results:
          label item.title

  # Note: The 'search_results' fetch is implicitly reactive to 'trigger'.
  # As per the cheatsheet, we use a separate 'trigger' variable to avoid 
  # fetching on every keystroke.
```

### Design Choices

1.  **Event Handling (`emit`):** In the `SearchBar` component, I used `emit submit query`. This passes the current value of the local `query` variable to the parent. The parent captures this using `on submit(text): trigger = text`. This is the standard Igni pattern: the component defines the action, and the parent decides how to handle the data.
2.  **State Decoupling:** As per the "Reactive re-fetch" rule, I avoided binding `input` directly to a `fetch()` URL. Instead, I introduced a `trigger` state variable. When the user taps the search button, the `on submit` handler updates `trigger`, which in turn triggers the `fetch()` call for the new URL.
3.  **Conditional Rendering:** Since `fetch()` returns an async object that supports `.is loading` and `is empty` checks, I used standard `if/else if/else` logic to manage the UI states (Spinner → No results → List) cleanly.
4.  **Layouts:** I used a nested `layout vertical` inside the main screen to keep the search results organized below the search bar, ensuring the UI remains readable.