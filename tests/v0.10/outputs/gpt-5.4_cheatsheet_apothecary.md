shared:
  satchel = []

screen Shelf, title: "Potion Shelf":
  potions = [
    {name: "Healing Draught", price: 12},
    {name: "Mana Tonic", price: 18},
    {name: "Night Vision Elixir", price: 25},
    {name: "Fireproof Serum", price: 30}
  ]

  layout vertical, padding: large, gap: medium:
    label "Apothecary", style: heading
    each potion in potions:
      layout horizontal, spread: true, align: center, padding: medium, background: card, rounded: true, on tap: add_to_satchel(potion):
        layout vertical:
          label potion.name, style: body
          label round(potion.price, 2), style: caption
        button "Add", color: brand, on tap: add_to_satchel(potion)
    button "View Satchel", color: subtle, on tap: navigate to Satchel

  add_to_satchel(potion):
    existing = find(shared.satchel, item => item.name is potion.name)
    if existing is null:
      shared.satchel = shared.satchel + [{name: potion.name, price: potion.price, quantity: 1}]
    else:
      updated = {existing with quantity: existing.quantity + 1}
      shared.satchel = replace(shared.satchel, existing, updated)

screen Satchel, title: "Satchel":
  layout vertical, padding: large, gap: medium:
    label "Satchel", style: heading

    if shared.satchel is empty:
      layout vertical, fill: true, align: center:
        label "Your satchel is empty"
    else:
      layout vertical, fill: true, gap: medium:
        each potion in shared.satchel:
          layout horizontal, spread: true, align: center, padding: medium, background: card, rounded: true:
            layout vertical:
              label potion.name, style: body
              label "Price: " + round(potion.price, 2), style: caption
              label "Qty: " + potion.quantity, style: caption
            button "Discard", color: danger, on tap: discard(potion)

    divider
    label "Total: " + total_price(), style: heading.small
    button "Back to Shelf", color: subtle, on tap: navigate back

  discard(potion):
    shared.satchel = without(shared.satchel, potion)

  total_price():
    total = 0
    each potion in shared.satchel:
      total = total + (potion.price * potion.quantity)
    return round(total, 2)