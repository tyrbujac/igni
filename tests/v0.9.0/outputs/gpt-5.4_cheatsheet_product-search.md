```igni
screen Search, title: "SEARCH":
  query = ""
  search = ""
  products = []

  if search is not empty:
    products = fetch("/api/products?q=" + search)

  layout vertical, padding: large, gap: medium:
    input bind: query, placeholder: "Search products", on change: search = query

    if search is empty:
      layout vertical, fill: true, align: center, gap: small:
        icon "search", size: large, color: subtle
        label "Type a product name to start searching", align: center, color: subtle

    else if products is loading:
      layout vertical, fill: true, align: center, gap: medium:
        spinner
        label "Searching products...", color: subtle

    else if products is error:
      layout vertical, fill: true, align: center, gap: small:
        icon "warning", size: large, color: danger
        label "Something went wrong", style: heading.small, align: center
        label "Please try again in a moment.", align: center, color: subtle

    else if products is empty:
      layout vertical, fill: true, align: center, gap: small:
        icon "search", size: large, color: subtle
        label "No products found", style: heading.small, align: center
        label "Try a different product name.", align: center, color: subtle

    else:
      layout vertical, gap: small:
        each product in products:
          layout horizontal, padding: medium, background: card, rounded: true, spread: true, align: center:
            label product.name
            label "$" + round(product.price, 2), style: heading.small
```

Design decisions:
- I used the trigger-variable pattern with `query` and `search` to avoid the reactive-fetch footgun.
- The layout is a simple vertical mobile UI with generous padding and card-style rows.
- Empty, loading, and error states are centered and friendly so the screen feels complete even without results.
- Product rows use `spread: true` so the name stays left and the price stays right.