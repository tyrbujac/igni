```igni
shared:
  cart = []

screen ProductList:
  products = [
    {id: 1, name: "Coffee Beans", price: 18.00},
    {id: 2, name: "Steel Kettle", price: 45.00},
    {id: 3, name: "Paper Filters", price: 5.50}
  ]

  layout vertical, title: "Store", padding: medium, gap: medium:
    button "View Cart (" + length(shared.cart) + ")", on tap: navigate to Cart
    
    each p in products:
      layout horizontal, padding: medium, background: card, align: center, spread: true, on tap: add_to_cart(p):
        layout vertical:
          label p.name, style: heading.small
          label "$" + round(p.price, 2)
        icon "add", color: brand

  add_to_cart(product):
    existing = find(shared.cart, item => item.id is product.id)
    if existing is not null:
      shared.cart = replace(shared.cart, existing, {existing with qty: existing.qty + 1})
    else:
      shared.cart = shared.cart + [{id: product.id, name: product.name, price: product.price, qty: 1}]

screen Cart:
  layout vertical, title: "Your Cart", padding: medium, gap: medium:
    if shared.cart is empty:
      label "Your cart is empty", align: center
    else:
      layout vertical, fill: true, gap: small:
        each item in shared.cart:
          layout horizontal, padding: medium, background: card, align: center, spread: true:
            layout vertical:
              label item.name, style: heading.small
              label "$" + round(item.price, 2) + " x " + item.qty
            button "Remove", color: danger, on tap: remove_item(item)
      
      divider
      layout horizontal, spread: true:
        label "Total", style: heading
        label "$" + round(calculate_total(), 2), style: heading

  remove_item(target):
    shared.cart = without(shared.cart, target)

  calculate_total():
    total = 0
    each item in shared.cart:
      total = total + (item.price * item.qty)
    return total
```