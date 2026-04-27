```igni
screen TipCalculator, title: "Tip Calculator":
  bill_text = ""
  tip_percent = 15
  people = 1

  bill():
    return parse_decimal(bill_text)

  tip_amount():
    return bill() * tip_percent / 100

  total():
    return bill() + tip_amount()

  per_person():
    return total() / people

  layout vertical, gap: large, padding: large, max_width: phone:
    label "Tip Calculator", style: heading

    input bind: bill_text, placeholder: "Bill amount (£)"

    layout vertical, gap: small:
      label "Tip: " + tip_percent + "%"
      slider bind: tip_percent, min: 0, max: 30

    layout vertical, gap: small:
      label "Splitting between " + people + " people"
      layout horizontal, gap: medium, align: center:
        button "-", shape: circle, color: subtle, on tap: decrement_people()
        label people, style: heading.small
        button "+", shape: circle, color: brand, on tap: increment_people()

    divider

    layout vertical, gap: medium, padding: medium, background: card, rounded: medium:
      layout horizontal, spread: true:
        label "Tip"
        label "£" + round(tip_amount(), 2)
      layout horizontal, spread: true:
        label "Total"
        label "£" + round(total(), 2)
      layout horizontal, spread: true:
        label "Per person", style: heading.small
        label "£" + round(per_person(), 2), style: heading.small

  decrement_people():
    if people > 1:
      people = people - 1

  increment_people():
    if people < 10:
      people = people + 1
```

## Where the cheatsheet didn't quite cover what I needed

**1. Parsing the input string to a number.** The `input` primitive binds to a string, but I needed a decimal for arithmetic. The cheatsheet shows `round()` (number → string), but no inverse. I invented `parse_decimal(bill_text)` following the same naming style as the other utility builtins. I'd expect it to return `0` (or perhaps `null`, propagating safely through arithmetic) on empty/invalid input, which is why the screen renders correctly before the user types anything — `bill()` just returns `0`, so all three displayed values are `£0.00`.

**2. Stepper for "number of people".** The cheatsheet's slider example caps at 100 and the dropdown wants an `options:` list. Neither felt right for "1 to 10 with a default of 1." I used the circular-button stepper pattern shown explicitly in the *Getting input* section (`shape: circle` for "compact +/- steppers"), with guard functions to clamp to the 1–10 range. This stays inside documented syntax.

**3. Derived currency values.** The cheatsheet is emphatic that `derived = base * 2` at the top level captures the initial value and doesn't track changes — derived state needs a function. So `bill()`, `tip_amount()`, `total()`, and `per_person()` are all screen-internal functions, called from the layout. They re-evaluate whenever `bill_text`, `tip_percent`, or `people` is reassigned, exactly as the *Reach is transitive* rule promises.

**4. `spread: true` on a horizontal row.** Listed in the layout properties table but not shown in an example. I used it for the "label on left, value on right" rows in the results card, which is the natural use case.

**5. String concatenation with numbers.** Used freely (`"£" + round(total(), 2)`, `"Splitting between " + people + " people"`). The cheatsheet shows `"Hello, " + name` and the `round()` example returns a string, so this composes cleanly. For raw numbers like `people` in a concatenation, I'm assuming `+` coerces — the Dicee/stopwatch examples show numbers being passed straight to `label`, but mixing with strings in `+` isn't explicitly shown.