shared:
  cart = []

screen Products, title: "Products":
  products = [
    {id: 1, name: "T-Shirt", price: 19.99},
    {id: 2, name: "Sneakers", price: 59.99},
    {id: 3, name: "Backpack", price: 39.99},
    {id: 4, name: "Cap", price: 14.99}
  ]

  layout vertical, padding: large, gap: medium:
    label "Products", style: heading

    each product in products:
      layout horizontal, spread: true, background: card, padding: medium, rounded: true, on tap: add_to_cart(product):
        layout vertical:
          label product.name
          label "$" + round(product.price, 2), style: caption
        button "Add", color: brand, on tap: add_to_cart(product)

    button "View Cart", color: subtle, on tap: navigate to Cart

  add_to_cart(product):
    existing = find(shared.cart, item => item.id is product.id)

    if existing is null:
      shared.cart = shared.cart + [{id: product.id, name: product.name, price: product.price, quantity: 1}]
    else:
      updated = {existing with quantity: existing.quantity + 1}
      shared.cart = replace(shared.cart, existing, updated)

screen Cart, title: "Cart":
  layout vertical, padding: large, gap: medium:
    label "Your Cart", style: heading

    if shared.cart is empty:
      layout vertical, fill: true, align: center:
        label "Your cart is empty"
    else:
      layout vertical, fill: true, gap: medium:
        each item in shared.cart:
          layout horizontal, spread: true, background: card, padding: medium, rounded: true:
            layout vertical:
              label item.name
              label "$" + round(item.price, 2), style: caption
              label "Qty: " + item.quantity
            button "Remove", color: danger, on tap: remove_item(item)

    divider
    label "Total: $" + round(total_price(), 2), style: heading.small
    button "Back to Products", color: subtle, on tap: navigate back

  remove_item(item):
    if item.quantity > 1:
      updated = {item with quantity: item.quantity - 1}
      shared.cart = replace(shared.cart, item, updated)
    else:
      shared.cart = without(shared.cart, item)

  total_price():
    total = 0
    each item in shared.cart:
      total = total + item.price * item.quantity
    return total