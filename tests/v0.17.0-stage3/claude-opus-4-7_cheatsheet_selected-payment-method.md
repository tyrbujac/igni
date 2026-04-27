```igni
screen Payment:
  methods = [
    {name: "Credit Card"},
    {name: "PayPal"},
    {name: "Bank Transfer"}
  ]
  selected = methods[0]

  layout vertical, gap: medium, padding: large:
    label "Payment Method", style: heading
    each method in methods:
      layout horizontal, padding: medium, background: card, rounded: medium, border: width_for(method), color: color_for(method), on tap: selected = method:
        label method.name

  width_for(method):
    if method is selected:
      return thick
    return thin

  color_for(method):
    if method is selected:
      return brand
    return subtle
```