```igni
shared:
  satchel = []
  potions = [
    {name: "Elixir of Vigour", price: 12},
    {name: "Moonpetal Draught", price: 8},
    {name: "Dragon's Breath Tonic", price: 20},
    {name: "Whispering Tincture", price: 5},
    {name: "Phoenix Tear Brew", price: 30}
  ]

screen Shelf, title: "Apothecary":
  layout vertical, padding: large, gap: medium:
    label "Potion Shelf", style: heading
    each potion in shared.potions:
      layout horizontal, padding: medium, background: card, rounded: true, spread: true, on tap: add(potion):
        label potion.name, style: body
        label "$" + round(potion.price, 0), style: body
    button "Open Satchel", color: brand, on tap: navigate to Satchel

  add(potion):
    existing = find(shared.satchel, item => item.name is potion.name)
    if existing is null:
      shared.satchel = shared.satchel + [{name: potion.name, price: potion.price, quantity: 1}]
    else:
      shared.satchel = replace(shared.satchel, existing, {existing with quantity: existing.quantity + 1})

screen Satchel, title: "Satchel":
  layout vertical, padding: large, gap: medium:
    if shared.satchel is empty:
      layout vertical, fill: true, align: center:
        label "Your satchel is empty", style: body
    else:
      each item in shared.satchel:
        layout horizontal, padding: medium, background: card, rounded: true, gap: medium, align: center:
          layout vertical, fill: true:
            label item.name, style: body
            label "$" + round(item.price, 0) + " x " + round(item.quantity, 0), style: caption
          button "Discard", color: danger, on tap: discard(item)
    layout horizontal, padding: medium, spread: true:
      label "Total", style: heading.small
      label "$" + round(total(), 2), style: heading.small

  discard(item):
    shared.satchel = without(shared.satchel, item)

  total():
    sum = 0
    each item in shared.satchel:
      sum = sum + item.price * item.quantity
    return sum
```