```igni
component CartRow(name, price):
  layout horizontal, spread: true:
    label name
    label "£" + price

screen Cart, title: "Cart":
  items = [
    {name: "Notebook", price: 12.99, tag: "new"},
    {name: "Headphones", price: 49.99, tag: "sale"},
    {name: "Water Bottle", price: 15.50, tag: "regular"},
    {name: "Backpack", price: 39.00, tag: "sale"},
    {name: "Pen Set", price: 8.25, tag: "new"}
  ]

  new_items = count(filter(items, item => item.tag is "new"), true)
  sale_items = count(filter(items, item => item.tag is "sale"), true)
  regular_items = count(filter(items, item => item.tag is "regular"), true)

  layout vertical, gap: medium, padding: large:
    label new_items + " new, " + sale_items + " on sale, " + regular_items + " regular"

    each item in items:
      CartRow item.name, price: item.price
```

Design decisions:
- `CartRow` is a wrapper component for reuse and to keep the screen clean.
- I used `layout horizontal, spread: true` so the item name stays left and the price stays right.
- The tag summary is computed from the hardcoded `items` list inside the screen body, as requested.
- Prices are rendered as `"£" + price`, which matches the spec’s string concatenation style.