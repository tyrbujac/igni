# Product Search App

```igni
screen Search, title: "SEARCH":
  query = ""
  search = ""

  results = fetch("/api/products?q=" + search)

  layout vertical, padding: large, gap: medium:
    layout horizontal, gap: small:
      input bind: query, placeholder: "Search products..."
      button "Go", color: brand, on tap: search = query

    if search is empty:
      layout vertical, fill: true, align: center, padding: large:
        icon "search", size: large, color: subtle
        label "Type a product name to begin", color: subtle, align: center
    else if results is loading:
      layout vertical, fill: true, align: center:
        spinner
        label "Searching...", color: subtle
    else if results is error:
      layout vertical, fill: true, align: center, padding: large:
        icon "warning", size: large, color: danger
        label "Something went wrong", style: heading.small
        label "Please try again in a moment", color: subtle, align: center
    else if results is empty:
      layout vertical, fill: true, align: center, padding: large:
        label "No products found", style: heading.small
        label "Try a different search term", color: subtle, align: center
    else:
      layout vertical, gap: small, fill: true:
        each product in results:
          layout horizontal, padding: medium, background: card, rounded: true, spread: true:
            label product.name, style: body
            label product.price, style: body, color: brand
```

## Design decisions

**Trigger-variable pattern for fetch.** The spec explicitly flags `fetch("...?q=" + query)` with a bound input as a transpile error. I used two variables: `query` (bound to the input, changes per keystroke) and `search` (only updated on button tap). The fetch reads from `search`, so it only fires when the user commits.

**Empty-state precedence.** I check `search is empty` *before* the fetch states. When the screen first loads, `search = ""` will trigger a fetch for `?q=`, but the UI shows the friendly "type to begin" prompt regardless of what that returns. This keeps the initial screen calm.

**State branching order.** `empty query → loading → error → no results → results`. Each branch is mutually exclusive via `else if`, so only one renders.

**Visual hierarchy.** Price rendered in `brand` colour to draw the eye; name in default `body`. Product rows use `background: card` with `rounded: true` for a tappable-card feel, and `spread: true` pushes name and price to opposite edges.

**Mobile layout.** `padding: large` on the outer layout for thumb-safe edges, `gap: medium` between the search bar and results, `gap: small` between rows. State messages use `fill: true` so the empty/loading/error states centre vertically in the remaining space rather than clinging to the top.

**No hex colours.** Only token names (`brand`, `subtle`, `danger`, `card`) as required.