```igni
shared:
  hold = []

screen Catalog:
  inventory = [
    {id: 1, name: "Oxygen Tank", mass: 50},
    {id: 2, name: "Fuel Cell", mass: 120},
    {id: 3, name: "Rations", mass: 20},
    {id: 4, name: "Spare Parts", mass: 85}
  ]

  layout vertical, padding: large, title: "Cargo Catalog":
    layout vertical, fill: true, gap: medium:
      each item in inventory:
        layout horizontal, padding: medium, background: card, rounded: true, on tap: add_to_hold(item):
          layout vertical, fill: true:
            label item.name, style: heading.small
            label "Mass: " + item.mass + " kg", style: caption
          icon "add", color: brand

    button "View Hold", on tap: navigate to Hold

  add_to_hold(cargo):
    existing = find(shared.hold, h => h.id is cargo.id)
    if existing is not null:
      shared.hold = replace(shared.hold, existing, {existing with qty: existing.qty + 1})
    else:
      shared.hold = shared.hold + [{id: cargo.id, name: cargo.name, mass: cargo.mass, qty: 1}]

screen Hold:
  layout vertical, padding: large, title: "Cargo Hold":
    if shared.hold is empty:
      layout vertical, fill: true, align: center:
        label "Hold is empty", style: body
    else:
      layout vertical, fill: true, gap: small:
        each entry in shared.hold:
          layout horizontal, padding: medium, background: card, align: center:
            layout vertical, fill: true:
              label entry.name, style: heading.small
              label "Qty: " + entry.qty + " (" + (entry.mass * entry.qty) + " kg)", style: caption
            button "Jettison", color: danger, on tap: jettison(entry)

    divider
    layout horizontal, padding: medium:
      label "Total Fleet Mass:", style: heading.small
      layout vertical, fill: true, align: end:
        label calculate_total() + " kg", style: heading

  jettison(target):
    shared.hold = without(shared.hold, target)

  calculate_total():
    total = 0
    each entry in shared.hold:
      total = total + (entry.mass * entry.qty)
    return total
```