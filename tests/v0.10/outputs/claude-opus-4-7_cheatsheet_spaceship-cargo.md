```igni
shared:
  hold = []

screen Catalog, title: "Cargo Catalog":
  catalog = [
    {name: "Tritium", mass: 12.5},
    {name: "Water", mass: 8.0},
    {name: "Rations", mass: 2.3},
    {name: "Spare Parts", mass: 15.7},
    {name: "Medkit", mass: 1.2}
  ]

  layout vertical, padding: large, gap: medium:
    button "View Hold", color: brand, on tap: navigate to Hold
    divider
    each item in catalog:
      layout horizontal, padding: medium, background: card, spread: true, on tap: load(item):
        label item.name, style: heading.small
        label round(item.mass, 1) + " t"

  load(item):
    existing = find(hold, entry => entry.name is item.name)
    if existing is null:
      hold = hold + [{name: item.name, mass: item.mass, quantity: 1}]
    else:
      hold = replace(hold, existing, {existing with quantity: existing.quantity + 1})

screen Hold, title: "Cargo Hold":
  layout vertical, padding: large, gap: medium:
    if hold is empty:
      layout vertical, fill: true, align: center:
        label "Hold is empty", style: body
    else:
      each entry in hold:
        layout horizontal, padding: medium, background: card, spread: true, align: center:
          layout vertical, gap: small:
            label entry.name, style: heading.small
            label round(entry.mass, 1) + " t  x " + entry.quantity
          button "Jettison", color: danger, on tap: jettison(entry)
    divider
    label "Total mass: " + round(total_mass(), 1) + " t", style: heading

  jettison(entry):
    hold = without(hold, entry)

  total_mass():
    total = 0.0
    each entry in hold:
      total = total + entry.mass * entry.quantity
    return total
```