```igni
component GenderCard(icon_name, label_text, selected):
  bg = card
  if selected:
    bg = brand

  layout vertical, fill: true, gap: small, padding: large, background: bg, rounded: medium, align: center:
    icon icon_name, size: 48, color: white
    label label_text, color: white, style: heading.small

component NumberAdjuster(title, value):
  layout vertical, fill: true, gap: medium, padding: large, background: card, rounded: medium, align: center:
    label title, color: white, style: caption
    label value, color: white, style: heading

    layout horizontal, gap: medium, align: center:
      button "-", shape: circle, color: subtle, on tap: emit decrement
      button "+", shape: circle, color: subtle, on tap: emit increment

screen BMICalculator, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large:
    layout horizontal, gap: medium:
      GenderCard "male", "MALE", gender is "male", on tap: gender = "male"
      GenderCard "female", "FEMALE", gender is "female", on tap: gender = "female"

    layout vertical, gap: medium, padding: large, background: card, rounded: medium, align: center:
      label "HEIGHT", color: white, style: caption

      layout horizontal, gap: small, align: end:
        label height, color: white, style: heading
        label "cm", color: white, style: body

      slider bind: height, min: 120, max: 220

    layout horizontal, gap: medium:
      NumberAdjuster "WEIGHT", weight, on decrement: decrease_weight(), on increment: increase_weight()
      NumberAdjuster "AGE", age, on decrement: decrease_age(), on increment: increase_age()

    layout vertical, fill: true

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to BMIResult height, weight, gender

  decrease_weight():
    if weight > 1:
      weight = weight - 1

  increase_weight():
    weight = weight + 1

  decrease_age():
    if age > 1:
      age = age - 1

  increase_age():
    age = age + 1

screen BMIResult(height, weight, gender), title: "BMI CALCULATOR", background: black:
  bmi = weight / ((height / 100) * (height / 100))
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

  layout vertical, gap: medium, padding: large:
    label "Your Result", color: white, style: heading

    layout vertical, fill: true, gap: large, padding: large, background: card, rounded: medium, align: center:
      label category, color: category_color, style: heading.small
      label round(bmi, 1), color: white, style: heading
      label interpretation, color: white, style: body, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back
```

### Design decisions

- **Reusable components:**  
  - `GenderCard` handles the male/female selectable cards.
  - `NumberAdjuster` handles both the weight and age sections using custom `emit increment` / `emit decrement` events.

- **Selection styling:**  
  I used `brand` for the selected gender card and `card` for the unselected one, since the spec asks for a dark UI with a pink/brand accent and lighter dark cards.

- **Bottom button placement:**  
  I used an empty `layout vertical, fill: true` spacer so the calculate button stays at the bottom.

- **BMI formatting:**  
  `round(bmi, 1)` is used to show one decimal place.

- **Gender passing:**  
  The result screen accepts `gender` because the prompt asked for it to be passed, even though the current result UI doesn’t need it for logic.

If you want, I can also produce a **more polished version** with a small reusable `ValueDisplay` component or a slightly tighter layout hierarchy to better mirror the classic Flutter BMI challenge design.