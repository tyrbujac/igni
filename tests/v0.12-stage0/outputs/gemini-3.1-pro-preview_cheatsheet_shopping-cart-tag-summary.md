```igni
screen Cart, title: "Cart":
  items = [
    {name: "Mechanical Keyboard", price: 120, tag: "new"},
    {name: "Wireless Mouse", price: 45, tag: "sale"},
    {name: "Desk Mat", price: 20, tag: "regular"},
    {name: "USB-C Hub", price: 35, tag: "new"},
    {name: "Monitor Arm", price: 80, tag: "regular"}
  ]

  new_qty = length(filter(items, item => item.tag is "new"))
  sale_qty = length(filter(items, item => item.tag is "sale"))
  reg_qty = length(filter(items, item => item.tag is "regular"))

  layout vertical, gap: medium, padding: large:
    label new_qty + " new, " + sale_qty + " on sale, " + reg_qty + " regular", style: heading.small
    divider
    
    each item in items:
      CartRow item

component CartRow(item):
  layout horizontal, spread: true:
    label item.name
    label "£" + item.price
```

### Design Decisions

*   **Deriving Counts**: The cheat sheet states `count(items, target)` counts occurrences of a specific *identity/target*, not a predicate. Therefore, to count items by their inner fields, we compose `length()` and `filter()` with a lambda (`item => item.tag is "new"`). 
*   **Layout Spread**: Inside the `CartRow` component, `layout horizontal, spread: true:` is used to automatically anchor the item name to the far left and the price to the far right, taking advantage of the native flex spacing without manually calculating widths.
*   **Component Invocation**: `CartRow` is called as a UI primitive (`CartRow item`), strictly avoiding parentheses, as Igni treats components as UI language extensions rather than standard function calls.
*   **Nesting Limits**: The code safely respects Igni's 4-level nesting limit rule. The tree is `screen` (1) → `layout` (2) → `CartRow`. The `each` loop does not count towards the limit, and the `CartRow` component definition resets the counter entirely.