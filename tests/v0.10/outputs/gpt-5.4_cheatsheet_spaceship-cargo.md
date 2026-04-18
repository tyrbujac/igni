shared:
  hold = []

screen Catalog, title: "Cargo Catalog":
  catalog = [
    {name: "Titanium Crate", mass: 120},
    {name: "Fuel Cell", mass: 45},
    {name: "Med Kit", mass: 12},
    {name: "Food Rations", mass: 18},
    {name: "Quantum Relay", mass: 200}
  ]

  add_to_hold(cargo):
    existing = find(shared.hold, item => item.name is cargo.name)
    if existing is null:
      shared.hold = shared.hold + [{name: cargo.name, mass: cargo.mass, quantity: 1}]
    else:
      updated = {existing with quantity: existing.quantity + 1}
      shared.hold = replace(shared.hold, existing, updated)

  layout vertical, padding: large, gap: medium:
    label "Available Cargo", style: heading
    each cargo in catalog:
      layout horizontal, padding: medium, background: card, rounded: true, align: center, spread: true, on tap: add_to_hold(cargo):
        layout vertical:
          label cargo.name, style: body
          label round(cargo.mass, 0) + " kg", style: caption
        button "Load", color: brand, on tap: add_to_hold(cargo)
    button "Open Hold", color: subtle, on tap: navigate to Hold

screen Hold, title: "Cargo Hold":
  jettison(item):
    if item.quantity > 1:
      updated = {item with quantity: item.quantity - 1}
      shared.hold = replace(shared.hold, item, updated)
    else:
      shared.hold = without(shared.hold, item)

  total_mass():
    total = 0
    each item in shared.hold:
      total = total + item.mass * item.quantity
    return total

  layout vertical, padding: large, gap: medium:
    label "Current Hold", style: heading

    if shared.hold is empty:
      layout vertical, fill: true, align: center:
        label "Hold is empty", style: body
    else:
      layout vertical, fill: true, gap: medium:
        each item in shared.hold:
          layout horizontal, padding: medium, background: card, rounded: true, align: center, spread: true:
            layout vertical:
              label item.name, style: body
              label round(item.mass, 0) + " kg each", style: caption
              label "Qty: " + round(item.quantity, 0), style: caption
            button "Jettison", color: danger, on tap: jettison(item)

    divider
    layout horizontal, align: center, spread: true:
      label "Total Mass", style: heading.small
      label round(total_mass(), 0) + " kg", style: heading.small
    button "Back to Catalog", color: subtle, on tap: navigate back