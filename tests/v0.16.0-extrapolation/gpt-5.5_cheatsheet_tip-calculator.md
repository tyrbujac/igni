```igni
screen TipCalculator, title: "Tip Calculator":
  bill_text = ""
  tip_percent = 15
  people = 1

  layout vertical, gap: medium, padding: large, max_width: phone:
    label "Tip Calculator", style: heading

    input bind: bill_text, placeholder: "Bill amount, e.g. 42.50"

    layout vertical, gap: small:
      label "Tip: " + tip_percent + "%"
      slider bind: tip_percent, min: 0, max: 30

    layout vertical, gap: small:
      label "People splitting"
      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, color: subtle, on tap: decrease_people()
        label people, style: heading.small
        button "+", shape: circle, color: subtle, on tap: increase_people()

    divider

    layout vertical, gap: small, background: card, padding: medium, rounded: medium:
      label "Total including tip: £" + round(total_bill(), 2)
      label "Tip amount: £" + round(tip_amount(), 2)
      label "Per person: £" + round(per_person(), 2), style: heading.small

  bill_amount():
    return decimal(bill_text)

  tip_amount():
    return bill_amount() * tip_percent / 100

  total_bill():
    return bill_amount() + tip_amount()

  per_person():
    return total_bill() / people

  decrease_people():
    if people > 1:
      people = people - 1

  increase_people():
    if people < 10:
      people = people + 1
```

The cheatsheet does not define a string-to-number conversion for turning the typed bill amount into a decimal value, so I used an invented Igni-style builtin:

```igni
decimal(bill_text)
```

It naturally reads as “convert this text to a decimal number.” Everything else uses primitives covered by the cheatsheet: `input`, `slider`, buttons, functions for derived state, `round(value, 2)`, and guarded assignments for keeping the people count between 1 and 10.