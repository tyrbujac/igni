# Product Search

```igni
screen Search, title: "SEARCH":
  query = ""
  search = ""

  results = fetch("/api/products?q=" + search)

  layout vertical, padding: large, gap: medium:
    input bind: query, placeholder: "Search products...", on change: update_search()

    if search is empty:
      layout vertical, fill: true, align: center:
        icon "search", size: large, color: subtle
        label "Start typing to find products", color: subtle, align: center
    else if results is loading:
      layout vertical, fill: true, align: center:
        spinner
    else if results is error:
      layout vertical, fill: true, align: center:
        icon "warning", size: large, color: danger
        label "Something went wrong", color: danger, align: center
        label "Please try again", color: subtle, align: center
    else if results is empty:
      layout vertical, fill: true, align: center:
        label "No products match your search", color: subtle, align: center
    else:
      layout vertical, gap: small:
        each product in results:
          layout horizontal, padding: medium, background: card, rounded: true, spread: true:
            label product.name, style: body
            label product.price, style: body, color: brand

  update_search():
    search = query
```

## Design decisions

**Trigger-variable pattern.** The spec explicitly calls out the reactive-fetch footgun: you can't put a `bind:`-ed variable directly into a `fetch()` URL in the same screen. So I bind the input to `query`, then use `on change:` to copy it into `search`, which is what the fetch actually depends on. This keeps the fetch reactive without tripping the transpile error.

**Explicit empty state before fetching.** When `search` is blank, I show a friendly prompt rather than firing a fetch for an empty query. This also means the initial app state is inviting rather than a confusing "no results" message.

**State ordering with `if`/`else if`.** The checks cascade in priority: blank query → loading → error → no results → success. Only one branch renders, and `fill: true` on each non-success branch lets the message sit centered in the remaining space below the input — a clean mobile pattern.

**Row styling.** Each result row is a horizontal layout with `spread: true`, pushing the name to the left and the price to the right. The `background: card` + `rounded: true` gives each row a subtle card surface without needing a wrapper component. Price uses `color: brand` to draw the eye.

**Tokens only, no hex.** Colors are all semantic (`subtle`, `danger`, `brand`, `card`); spacing uses `small`/`medium`/`large`; text uses `body`. Everything is on-spec.