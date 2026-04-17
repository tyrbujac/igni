# Product Search App

```igni
screen Search, title: "SEARCH":
  query = ""
  search = ""

  results = fetch("/api/products?q=" + search)

  layout vertical, padding: large, gap: medium:
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search products..."
      button "Search", color: brand, on tap: search = query

    if search is empty:
      layout vertical, fill: true, align: center:
        icon "search", size: large, color: subtle
        label "Type a product name to begin", color: subtle, align: center
    else if results is loading:
      layout vertical, fill: true, align: center:
        spinner
        label "Searching...", color: subtle
    else if results is error:
      layout vertical, fill: true, align: center:
        icon "alert", size: large, color: danger
        label "Something went wrong. Try again.", color: danger, align: center
    else if results is empty:
      layout vertical, fill: true, align: center:
        label "No products match your search.", color: subtle, align: center
    else:
      layout vertical, gap: small:
        each product in results:
          layout horizontal, padding: medium, background: card, rounded: true, spread: true:
            label product.name, style: body
            label product.price, style: body, color: brand
```

## Design decisions

- **Trigger-variable pattern.** The input binds to `query`, but `fetch` uses `search`, which is only updated when the user taps the button. This avoids the reactive-fetch footgun (fetching per keystroke).
- **State branching with `else if`.** Five distinct states (blank, loading, error, empty, results) handled in priority order — blank query wins over loading so we don't fetch-thrash on an empty string.
- **`fill: true` on state messages** centers empty/loading/error states in the available space, giving a clean mobile feel rather than squashed-at-the-top text.
- **Rows use `background: card`** (the themed surface token) with `spread: true` to push name left and price right — the canonical product-row pattern.
- **No hex colours** — only tokens (`brand`, `subtle`, `danger`, `card`).