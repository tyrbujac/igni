```igni
screen TipCalculator, title: "Tip Calculator":
  bill_text = ""
  tip_percent = 15
  split_count = 1

  layout vertical, padding: large, gap: large:
    # Bill Input
    layout vertical, gap: small:
      label "Bill Amount"
      input bind: bill_text, placeholder: "0.00", type: number

    # Tip Slider
    layout vertical, gap: small:
      layout horizontal, spread: true:
        label "Tip"
        label tip_percent + "%"
      slider bind: tip_percent, min: 0, max: 30

    # Split Stepper
    layout horizontal, spread: true, align: center:
      label "Split"
      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, color: subtle, on tap: decrement_split()
        label split_count
        button "+", shape: circle, color: subtle, on tap: increment_split()

    divider

    # Results Card
    layout vertical, gap: medium, padding: medium, background: card, rounded: medium:
      layout horizontal, spread: true:
        label "Tip Amount"
        label "£" + round(tip(), 2)
      
      layout horizontal, spread: true:
        label "Total Bill"
        label "£" + round(total(), 2)
      
      layout horizontal, spread: true:
        label "Per Person"
        label "£" + round(per_person(), 2), style: heading.small

  # Derived State Functions
  bill():
    return to_number(bill_text)

  tip():
    return bill() * (tip_percent / 100)

  total():
    return bill() + tip()

  per_person():
    return total() / split_count

  # Mutators
  decrement_split():
    if split_count > 1:
      split_count = split_count - 1

  increment_split():
    if split_count < 10:
      split_count = split_count + 1
```

### What I invented (Gaps in the Cheatsheet):

1. **`to_number()` builtin**: The cheatsheet shows that `input` primitives map to strings (`draft = ""`), but we need floats for the math. I invented a `to_number(string)` utility function and am assuming it gracefully defaults to `0` if the string is empty or invalid, preventing cascading errors during typing.
2. **`type: number` for inputs**: To pull up the correct native number pad on a mobile device, I added a `type: number` property to the `input` primitive. This feels completely in line with Igni's simple, declarative design spec style. 
3. **`rounded: medium` value**: The `layout` section lists `rounded` as an available property but didn't show the exact argument format. Since other spacing/sizing properties use tokens like `small`, `medium`, and `large` (e.g., `padding: large`), I assumed `rounded:` accepts those same token values.