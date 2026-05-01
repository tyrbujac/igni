```igni
shared:
  height = 180
  weight = 60
  age = 20
  gender = "male"

component MaleCard:
  layout vertical, fill: true, padding: medium, gap: small, align: center, background: card, rounded: medium, border: gender_border(), color: gender_color(), on tap: shared.gender = "male":
    label "Male", style: title, color: gender_color()

  gender_border():
    if shared.gender is "male":
      return thick
    else:
      return thin

  gender_color():
    if shared.gender is "male":
      return brand
    else:
      return subtle

component FemaleCard:
  layout vertical, fill: true, padding: medium, gap: small, align: center, background: card, rounded: medium, border: gender_border(), color: gender_color(), on tap: shared.gender = "female":
    label "Female", style: title, color: gender_color()

  gender_border():
    if shared.gender is "female":
      return thick
    else:
      return thin

  gender_color():
    if shared.gender is "female":
      return brand
    else:
      return subtle

component HeightCard:
  layout vertical, padding: medium, gap: medium, align: center, background: card, rounded: medium:
    label "HEIGHT", style: title, color: subtle
    layout horizontal, gap: small, align: center:
      label round(shared.height, 0), style: heading
      label "cm", style: title, color: subtle
    slider bind: shared.height, min: 120, max: 220

component WeightCard:
  layout vertical, fill: true, padding: medium, gap: medium, align: center, background: card, rounded: medium:
    label "WEIGHT", style: title, color: subtle
    label shared.weight, style: heading
    layout horizontal, gap: medium, align: center:
      button "–", shape: circle, color: subtle, on tap: shared.weight = shared.weight - 1
      button "+", shape: circle, color: brand, on tap: shared.weight = shared.weight + 1

component AgeCard:
  layout vertical, fill: true, padding: medium, gap: medium, align: center, background: card, rounded: medium:
    label "AGE", style: title, color: subtle
    label shared.age, style: heading
    layout horizontal, gap: medium, align: center:
      button "–", shape: circle, color: subtle, on tap: shared.age = shared.age - 1
      button "+", shape: circle, color: brand, on tap: shared.age = shared.age + 1

screen Calculator, title: "BMI CALCULATOR":
  layout vertical, padding: large, gap: medium:
    layout vertical, fill: true, gap: medium:
      layout horizontal, gap: medium:
        MaleCard
        FemaleCard

      HeightCard

      layout horizontal, gap: medium:
        WeightCard
        AgeCard

    button "CALCULATE", color: brand, on tap: navigate to Result

screen Result, title: "YOUR RESULT":
  layout vertical, padding: large, gap: medium:
    layout vertical, fill: true, gap: medium, align: center:
      label category(), style: title, color: status_color()
      label round(bmi(), 1), style: heading
      label advice(), align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back

  bmi():
    return shared.weight / ((shared.height / 100) * (shared.height / 100))

  category():
    if bmi() < 18.5:
      return "UNDERWEIGHT"
    else if bmi() < 25:
      return "NORMAL"
    else:
      return "OVERWEIGHT"

  status_color():
    if bmi() < 18.5:
      return blue
    else if bmi() < 25:
      return green
    else:
      return orange

  advice():
    if bmi() < 18.5:
      return "You are below the normal range, so consider eating more nutritious meals."
    else if bmi() < 25:
      return "You have a normal body weight, so keep up your healthy habits."
    else:
      return "You are above the normal range, so consider more activity and balanced meals."
```