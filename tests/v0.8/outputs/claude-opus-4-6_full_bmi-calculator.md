```igni
# app.igni — BMI Calculator

component GenderCard(icon_name, text, selected):
  bg = card
  if selected:
    bg = brand
  layout vertical, fill: true, padding: large, background: bg, rounded: medium, align: center, gap: medium:
    icon icon_name, size: large, color: white
    label text, style: caption, color: white

component Stepper(label_text, value):
  layout vertical, fill: true, padding: medium, background: card, rounded: medium, align: center, gap: small:
    label label_text, style: caption, color: white
    label value, style: heading, color: white
    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: emit decrement
      button "+", shape: circle, color: subtle, on tap: emit increment

screen Input, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large:
    # Gender selection
    layout horizontal, gap: medium:
      GenderCard "male", "MALE", gender is "male", on tap: gender = "male"
      GenderCard "female", "FEMALE", gender is "female", on tap: gender = "female"

    # Height section
    layout vertical, padding: medium, background: card, rounded: medium, align: center, gap: small:
      label "HEIGHT", style: caption, color: white
      layout horizontal, gap: small, align: center:
        label height, style: heading, color: white
        label "cm", style: body, color: white
      slider bind: height, min: 120, max: 220

    # Weight and Age side by side
    layout horizontal, gap: medium:
      Stepper "WEIGHT", weight, on increment: weight = weight + 1, on decrement: weight = weight - 1
      Stepper "AGE", age, on increment: age = age + 1, on decrement: age = age - 1

    # Calculate button
    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Results height, weight, gender

screen Results(height, weight, gender), title: "BMI CALCULATOR", background: black:
  height_m = height / 100
  bmi = weight / (height_m * height_m)

  category = "NORMAL"
  category_color = green
  interpretation = "You have a normal body weight. Good job!"

  if bmi < 18.5:
    category = "UNDERWEIGHT"
    category_color = danger
    interpretation = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    category = "OVERWEIGHT"
    category_color = orange
    interpretation = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, fill: true, gap: large, padding: large, align: center:
    label "Your Result", style: heading, color: white
    label category, style: heading, color: category_color
    label round(bmi, 1), style: heading, color: white
    label interpretation, style: body, color: white, align: center
    layout vertical, fill: true
    button "RE-CALCULATE", color: brand, on tap: navigate back
```

---

### Design decisions

**`GenderCard` uses `on tap:` on the invocation, not `emit`.** The card itself is purely presentational — it receives a `selected` boolean and renders accordingly. The parent screen owns the `gender` variable and sets it directly on tap. There's no internal interaction *inside* the card that the parent can't see, so `emit` would be unnecessary indirection. This contrasts with `Stepper`, where the +/- buttons are *internal* interactive elements that genuinely need to signal outward.

**`Stepper` uses `emit increment` / `emit decrement`.** The component's two buttons are sub-elements hidden from the parent. Following the spec's exact Stepper example, the parent wires `on increment:` and `on decrement:` at the call site, keeping the arithmetic (`weight + 1`, `age - 1`) in the parent's scope where the variables live.

**`fill: true` on both component root layouts.** `GenderCard` and `Stepper` both need to split their parent's horizontal space equally. Since `fill: true` siblings share space evenly, both gender cards get 50/50 and both steppers get 50/50 — no pixel math needed.

**Conditional assignment for category/colour/interpretation.** Following the spec's canonical "assign default, then override" pattern. The default is NORMAL/green, then `if`/`else if` overrides for the other two ranges.

**Empty `layout vertical, fill: true` before the RE-CALCULATE button.** This is the bottom-anchoring pattern from the spec — the empty fill layout pushes the button to the bottom of the screen while the result content stays near the top.

**`round(bmi, 1)` for one decimal place.** The spec's `round` builtin returns a string, so it renders directly in the label.

**`background: black` + `background: card` for the dark theme.** `black` gives the dark screen background; `card` on the section layouts gives the slightly elevated surface the design calls for. All text is explicitly `color: white` since the dark background demands it.