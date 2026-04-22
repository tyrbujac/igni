```igni
screen Cart, title: "Cart":
  items = [
    {name: "Coffee", price: 10, tag: "new"},
    {name: "Tea", price: 5, tag: "sale"},
    {name: "Mug", price: 12, tag: "regular"},
    {name: "Sugar", price: 2, tag: "sale"},
    {name: "Spoon", price: 4, tag: "new"}
  ]

  # Calculate counts for summary
  new_count = count(items, item => item.tag is "new")
  sale_count = count(items, item => item.tag is "sale")
  reg_count = count(items, item => item.tag is "regular")

  layout vertical, padding: large, gap: medium:
    label new_count + " new, " + sale_count + " on sale, " + reg_count + " regular", style: caption
    divider
    each item in items:
      CartRow item

component CartRow(item):
  layout horizontal, spread: true:
    label item.name
    label "£" + item.price
```

### Design Decisions

*   **Reactivity:** The `new_count`, `sale_count`, and `reg_count` variables are declared at the top level of the screen body. Because Igni re-evaluates the entire screen whenever state changes, placing these here ensures the summary dynamically updates if items are added or removed in the future.
*   **Composition:** I used a dedicated `CartRow` component to encapsulate the layout of an individual item. This follows the Igni convention of keeping the `screen` body clean and readable while delegating presentation to reusable components.
*   **Layout Logic:** By setting `spread: true` on the `CartRow` horizontal layout, the `name` (left) and `price` (right) are automatically pushed to opposite edges of the screen, providing a clean, standard shopping cart list appearance.
*   **Data Structure:** Used an array of objects to store the cart. Since Igni requires explicit list iteration (`each`), I passed the `item` context directly into the `CartRow` component, which simplifies the component signature while keeping it type-agnostic.
*   **Styling:** I used the `caption` text style for the summary line to visually differentiate it from the primary list content, maintaining a clear visual hierarchy.