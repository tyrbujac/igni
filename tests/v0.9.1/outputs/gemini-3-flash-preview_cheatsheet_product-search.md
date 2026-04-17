```igni
screen ProductSearch, title: "SEARCH":
  query = ""
  search_term = ""
  
  # Reactive fetch follows the trigger-variable pattern to avoid per-keystroke API calls
  results = fetch("/api/products?q=" + search_term)

  layout vertical, padding: medium, gap: medium:
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search products...", fill: true
      button "Search", color: brand, on tap: search_term = query

    if query is empty:
      layout vertical, fill: true, align: center:
        icon "search", size: large, color: subtle
        label "Type something to start searching", style: caption
    
    else if results is loading:
      layout vertical, fill: true, align: center:
        spinner
    
    else if results is error:
      layout vertical, fill: true, align: center:
        label "Something went wrong", color: danger
        button "Try Again", on tap: search_term = query

    else if length(results) is 0:
      layout vertical, fill: true, align: center:
        label "No products found for " + search_term, style: body
    
    else:
      layout vertical, gap: small, fill: true:
        each item in results:
          ProductRow item

component ProductRow(product):
  layout horizontal, padding: medium, background: card, rounded: true, spread: true:
    layout vertical:
      label product.name, style: body
      label "$" + round(product.price, 2), style: caption
    icon "chevron_right", color: subtle
```

### Design Decisions

1.  **Search Pattern**: I implemented the **trigger-variable pattern** (`query` vs `search_term`). The `input` binds to `query`, but the `fetch` relies on `search_term`. This prevents the "reactive-fetch footgun" where every keystroke would trigger a network request. The search only executes when the user taps the button.
2.  **Empty State**: I used an `if query is empty` check to show a friendly prompt. This improves UX by not showing "No results" before the user has even typed.
3.  **Layout & Fill**: I used `fill: true` on the main content area and used `align: center` for the loading/error/empty states to ensure they appear centered in the viewport rather than cramped at the top.
4.  **Componentization**: The `ProductRow` is extracted as a component to keep the main screen logic clean and allow for easy styling of the list items (using `background: card` and `rounded: true` for a modern "tile" look).
5.  **Error Handling**: I included a "Try Again" button in the error state which simply re-assigns the `search_term` to trigger a re-fetch.