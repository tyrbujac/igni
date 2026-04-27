```igni
screen PaymentMethods:
  methods = [
    {name: "Credit card"},
    {name: "PayPal"},
    {name: "Bank transfer"}
  ]
  selected = methods[0]

  layout vertical, gap: medium, padding: large:
    label "Choose payment method", style: heading

    each method in methods:
      layout horizontal, padding: medium, background: card, rounded: medium, border: border_width_for(method), color: border_color_for(method), on tap: selected = method:
        label method.name

  border_width_for(method):
    if method is selected:
      return thick
    return thin

  border_color_for(method):
    if method is selected:
      return brand
    return subtle
```