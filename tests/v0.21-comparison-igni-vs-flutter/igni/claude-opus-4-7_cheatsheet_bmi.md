```igni
shared:
  height = 180
  weight = 60
  age = 20
  gender = "male"

screen BmiCalculator, title: "BMI CALCULATOR":
  layout vertical, padding: large, gap: medium:

    layout horizontal, gap: medium:
      layout vertical, fill: true, padding: large, rounded: medium, background: male_bg(), align: center, on tap: shared.gender = "male":
        icon "male", size: large, color: white
        label "MALE", color: white

      layout vertical, fill: true, padding: large, rounded: medium, background: female_bg(), align: center, on tap: shared.gender = "female":
        icon "female", size: large, color: white
        label "FEMALE", color: white

    layout vertical, padding: large, rounded: medium, background: card, gap: small:
      label "HEIGHT", style: caption, align: center
      layout horizontal, gap: small, align: center:
        label shared.height, style: heading
        label "cm"
      slider bind: shared.height, min: 120, max: 220

    layout horizontal, gap: medium:
      layout vertical, fill: true, padding: large, rounded: medium, background: card, gap: small, align: center:
        label "WEIGHT", style: caption
        label shared.weight, style: heading
        layout horizontal, gap: medium, align: center:
          button "-", shape: circle, color: subtle, on tap: shared.weight = shared.weight - 1
          button "+", shape: circle, color: subtle, on tap: shared.weight = shared.weight + 1

      layout vertical, fill: true, padding: large, rounded: medium, background: card, gap: small, align: center:
        label "AGE", style: caption
        label shared.age, style: heading
        layout horizontal, gap: medium, align: center:
          button "-", shape: circle, color: subtle, on tap: shared.age = shared.age - 1
          button "+", shape: circle, color: subtle, on tap: shared.age = shared.age + 1

    button "CALCULATE", color: brand, on tap: navigate to BmiResult

  male_bg():
    result = card
    if shared.gender is "male":
      result = brand
    return result

  female_bg():
    result = card
    if shared.gender is "female":
      result = brand
    return result

screen BmiResult, title: "YOUR RESULT":
  layout vertical, padding: large, gap: medium:

    layout vertical, fill: true, padding: large, rounded: medium, background: card, gap: medium, align: center:
      label category(), style: title, color: category_color()
      label round(bmi(), 1), style: heading
      label advice()

    button "RE-CALCULATE", color: brand, on tap: navigate back

  bmi():
    return shared.weight / ((shared.height / 100) * (shared.height / 100))

  category():
    result = "OVERWEIGHT"
    if bmi() < 18.5:
      result = "UNDERWEIGHT"
    else if bmi() < 25:
      result = "NORMAL"
    return result

  category_color():
    result = orange
    if bmi() < 18.5:
      result = blue
    else if bmi() < 25:
      result = green
    return result

  advice():
    result = "You have a higher than normal body weight. Try to exercise more."
    if bmi() < 18.5:
      result = "You have a lower than normal body weight. You can eat a bit more."
    else if bmi() < 25:
      result = "You have a normal body weight. Good job!"
    return result
```