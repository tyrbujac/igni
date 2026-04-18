```igni
shared:
  satchel = []

screen Shelf:
  potions = [
    {id: 1, name: "Health Potion", price: 50},
    {id: 2, name: "Mana Elixir", price: 75},
    {id: 3, name: "Invisibility Draught", price: 150}
  ]

  layout vertical, title: "Apothecary", padding: medium:
    label "Available Potions", style: heading
    each p in potions:
      layout horizontal, padding: medium, background: card, align: center:
        layout vertical, fill: true:
          label p.name, style: body
          label "Gold: " + round(p.price, 0), style: caption
        button "Buy", on tap: add_to_satchel(p)
    
    divider
    button "View Satchel", color: brand, on tap: navigate to Satchel

  add_to_satchel(p):
    existing = find(shared.satchel, item => item.id is p.id)
    if existing is not null:
      shared.satchel = replace(shared.satchel, existing, {existing with qty: existing.qty + 1})
    else:
      shared.satchel = shared.satchel + [{id: p.id, name: p.name, price: p.price, qty: 1}]

screen Satchel:
  layout vertical, title: "Your Satchel", padding: medium:
    if shared.satchel is empty:
      layout vertical, fill: true, align: center:
        label "Your satchel is empty", style: body
    else:
      layout vertical, fill: true:
        each item in shared.satchel:
          layout horizontal, padding: medium, background: card, align: center:
            layout vertical, fill: true:
              label item.name, style: body
              label "Qty: " + round(item.qty, 0), style: caption
            label "G: " + round(item.price * item.qty, 0), style: body
            button "X", color: danger, shape: circle, on tap: shared.satchel = without(shared.satchel, item)
      
      divider
      layout horizontal, spread: true:
        label "Total Gold:", style: heading.small
        label round(get_total(), 0), style: heading.small
    
    button "Back to Shelf", on tap: navigate back

  get_total():
    total = 0
    each item in shared.satchel:
      total = total + (item.price * item.qty)
    return total
```