```igni
component SearchBar(placeholder_text):
  text = ""
  layout horizontal, gap: medium:
    input bind: text, placeholder: placeholder_text
    button "Search", on tap: emit submit text

screen Search:
  query = ""
  results = []
  
  # Trigger the fetch only when the query changes via the component
  results = fetch("/api/search?q=" + query)

  layout vertical, padding: large:
    SearchBar "Search", on submit(q): query = q
    
    if results is loading:
      spinner
    else if results is error:
      label "Failed to load results"
    else if results is empty:
      label "No results"
    else:
      layout vertical, gap: small:
        each item in results:
          label item.title
```

### Design Choices

*   **Communication:** I defined the `SearchBar` to `emit submit text`. The parent `Search` screen captures this using the `on submit(q):` handler. This keeps the component decoupled: it doesn't know what happens to the query; it simply broadcasts that a submission occurred with a payload.
*   **Reactivity:** The `results` variable is assigned the result of `fetch(...)`. Because Igni uses lexical reactivity, whenever the user submits a new query and `query` is updated, the `fetch` call automatically re-runs with the new URL and the UI re-renders to reflect the `loading`, `error`, or result state.
*   **State Management:** I used a local `query` variable in the `Search` screen to drive the fetch. The `SearchBar` maintains its own `text` state internally, only "pushing" its value to the parent when the button is tapped. This prevents the API from being hit on every keystroke, which is a best practice for `fetch` calls.
*   **Conditional Rendering:** The logic follows the recommended sequence: checking for `is loading`, `is error`, and `is empty` before iterating over the list, ensuring a robust user experience for each state of the asynchronous request.