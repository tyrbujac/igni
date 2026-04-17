```igni
shared:
  cart = []
  products = [
    {id: 1, name: "Coffee", price: 4.50},
    {id: 2, name: "Tea", price: 3.00},
    {id: 3, name: "Muffin", price: 2.75},
    {id: 4, name: "Bagel", price: 3.25}
  ]

screen Products, title: "Products":
  layout vertical, padding: large, gap: medium:
    button "View Cart", color: brand, on tap: navigate to Cart

    each product in shared.products:
      layout horizontal, padding: medium, background: card, rounded: true, spread: true, on tap: add(product):
        label product.name, style: heading.small
        label "$" + round(product.price, 2)

  add(product):
    existing = find(shared.cart, item => item.id is product.id)
    if existing is null:
      shared.cart = shared.cart + [{id: product.id, name: product.name, price: product.price, quantity: 1}]
    else:
      shared.cart = replace(shared.cart, existing, {existing with quantity: existing.quantity + 1})

screen Cart, title: "Cart":
  layout vertical, padding: large, gap: medium:
    if shared.cart is empty:
      label "Your cart is empty", style: body
    else:
      each item in shared.cart:
        layout horizontal, padding: medium, background: card, rounded: true, spread: true, align: center:
          layout vertical, gap: small:
            label item.name, style: heading.small
            label "$" + round(item.price, 2) + " x " + item.quantity
          button "Remove", color: danger, on tap: remove(item)

      divider
      layout horizontal, spread: true, padding: medium:
        label "Total", style: heading
        label "$" + round(total(), 2), style: heading

    button "Back", on tap: navigate back

  remove(target):
    shared.cart = without(shared.cart, target)

  total():
    sum = 0
    each item in shared.cart:
      sum = sum + item.price * item.quantity
    return sum
```