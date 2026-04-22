# Shopping Cart Summary

```igni
component CartRow(item):
  layout horizontal, padding: medium, spread: true:
    label item.name
    label "£" + round(item.price, 2)

screen Cart, title: "Cart":
  items = [
    {name: "Coffee beans", price: 8.50, tag: "new"},
    {name: "Notebook", price: 4.00, tag: "sale"},
    {name: "Desk lamp", price: 22.99, tag: "regular"},
    {name: "Pen set", price: 6.75, tag: "sale"},
    {name: "Mug", price: 12.00, tag: "regular"}
  ]

  new_count = length(filter(items, item => item.tag is "new"))
  sale_count = length(filter(items, item => item.tag is "sale"))
  regular_count = length(filter(items, item => item.tag is "regular"))

  layout vertical, gap: medium, padding: large:
    label round(new_count, 0) + " new, " + round(sale_count, 0) + " on sale, " + round(regular_count, 0) + " regular", style: caption
    divider
    each item in items:
      CartRow item
```

## Design decisions

- **`CartRow` takes the whole item**, not `name`/`price` as separate args. One parameter is cleaner, and the row owns its own layout (`spread: true` pushes name and price to opposite ends).
- **Tag counts are plain variables** derived via `filter` + `length`. Because they're defined at the top of the screen body, they re-evaluate automatically if `items` ever changes — the reactivity rule handles it for free.
- **`round(count, 0)` for the summary line**: the spec gives `round(x, N)` as the number-to-string converter, and there's no string interpolation, so concatenation is the only path. Decimal prices use `round(price, 2)` so "£4.00" shows two decimals consistently.
- **`style: caption` on the summary** keeps it visually subordinate to the row list; a `divider` separates it from the items.
- **Lambdas** are used only inside `filter` — the only place the spec permits them.
- **Nesting stays shallow**: `screen` → `layout vertical` → `CartRow` (one `layout horizontal` inside the component). Well within the 4-level cap, and the component resets the counter anyway.