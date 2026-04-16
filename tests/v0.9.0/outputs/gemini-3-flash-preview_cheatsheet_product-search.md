```igni
screen ProductSearch, title: "SEARCH":
  query = ""
  search_term = ""
  
  # Fetch is triggered by search_term to avoid the reactive-fetch footgun
  results = fetch("/api/products?q=" + search_term)

  layout vertical, padding: medium, gap: medium:
    # Search Bar Area
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search products...", fill: true
      button "Search", color: brand, on tap: search_term = query

    # Content Area
    if search_term is "":
      layout vertical, fill: true, align: center:
        icon "search", size: large, color: subtle
        label "Type a product name to begin", style: body
    
    else if results is loading:
      layout vertical, fill: true, align: center:
        spinner
        label "Finding products...", style: caption

    else if results is error:
      layout vertical, fill: true, align: center:
        icon "error", color: danger
        label "Something went wrong", style: body
        button "Try Again", color: subtle, on tap: search_term = query

    else if results is empty:
      layout vertical, fill: true, align: center:
        label "No products found for '" + search_term + "'", style: body
    
    else:
      layout vertical, fill: true, gap: small:
        each product in results:
          ProductRow product

component ProductRow(product):
  layout vertical, padding: medium, background: card, rounded: true:
    layout horizontal, spread: true:
      label product.name, style: heading.small
      label "$" + round(product.price, 2), color: green
```

### Design Decisions

1.  **Trigger-Variable Pattern**: Per the Igni spec, I used two variables: `query` (bound to the input) and `search_term` (the actual fetch trigger). This prevents the "reactive-fetch footgun" where every keystroke would trigger a network request. The search only fires when the user taps the button.
2.  **State Feedback**: I implemented explicit branches for all four async states (Initial/Empty, Loading, Error, and Success) to ensure a polished mobile feel. I used the `fill: true` property on these layouts to keep the icons and labels centered in the screen's remaining space.
3.  **Componentization**: I extracted the `ProductRow` into a component. This keeps the main screen logic clean and allows the use of `background: card` and `rounded: true` to make each item look like a distinct mobile UI element.
4.  **Formatting**: Used the `round(price, 2)` builtin to ensure the price displays correctly as a string, and used `spread: true` on the horizontal layout to push the name to the left and the price to the right.