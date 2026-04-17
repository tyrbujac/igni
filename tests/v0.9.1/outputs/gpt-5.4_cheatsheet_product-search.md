```igni
screen Search, title: "SEARCH":
  query = ""
  search = ""
  products = fetch("/api/products?q=" + search)

  layout vertical, padding: large, gap: medium:
    input bind: query, placeholder: "Search products"

    button "Search", color: brand, on tap: search = query

    if query is empty:
      layout vertical, fill: true, align: center, gap: small:
        icon "search", size: large, color: subtle
        label "Type a product name to search", style: body, align: center, color: subtle
    else if products is loading:
      layout vertical, fill: true, align: center:
        spinner
    else if products is error:
      layout vertical, fill: true, align: center, gap: small:
        icon "warning", size: large, color: danger
        label "Something went wrong.", style: heading.small, align: center
        label "Please try your search again.", style: body, align: center, color: subtle
    else if length(products) is 0:
      layout vertical, fill: true, align: center, gap: small:
        icon "search", size: large, color: subtle
        label "No products found", style: heading.small, align: center
        label "Try a different product name.", style: body, align: center, color: subtle
    else:
      layout vertical, gap: small:
        each product in products:
          layout vertical, padding: medium, background: card, rounded: true:
            label product.name, style: heading.small
            label "$" + round(product.price, 2), style: body, color: subtle
```

### Design decisions
- I used the required trigger-variable pattern: `query` is bound to the input, and `search` is only updated when the user taps the Search button. This avoids the reactive-fetch footgun.
- The layout is a simple mobile-friendly vertical stack with large padding and clear spacing.
- Empty states are handled separately for:
  - blank query
  - no matching results
- Loading and error states are centered to feel more like a polished app screen.
- Product rows use `background: card` and `rounded: true` for a clean native-app list style without custom colors.