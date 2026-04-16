```igni
screen Input, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, padding: medium, gap: medium:
    # Gender Selection
    layout horizontal, gap: medium:
      GenderCard "male", "MALE", gender, on tap: gender = "male"
      GenderCard "female", "FEMALE", gender, on tap: gender = "female"

    # Height Selection
    layout vertical, background: card, padding: medium, rounded: medium, align: center:
      label "HEIGHT", style: caption, color: white
      label round(height, 0) + "cm", style: heading, color: white
      slider bind: height, min: 120, max: 220

    # Weight and Age Selection
    layout horizontal, gap: medium:
      Stepper "WEIGHT", weight, on increment: weight = weight + 1, on decrement: weight = weight - 1
      Stepper "AGE", age, on increment: age = age + 1, on decrement: age = age - 1

    # Calculate Button
    layout vertical, fill: true:
      # This layout pushes the button to the bottom
    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Results {h: height, w: weight, g: gender}

component GenderCard(id, label_text, current):
  bg = card
  if current is id:
    bg = subtle # Highlight selected card

  layout vertical, fill: true, background: bg, padding: large, rounded: medium, align: center, on tap: emit tap:
    icon id, size: 80, color: white
    label label_text, style: caption, color: white

component Stepper(label_text, value):
  layout vertical, fill: true, background: card, padding: medium, rounded: medium, align: center:
    label label_text, style: caption, color: white
    label value, style: heading, color: white
    layout horizontal, gap: medium:
      button "-", shape: circle, color: subtle, on tap: emit decrement
      button "+", shape: circle, color: subtle, on tap: emit increment

screen Results(data), title: "BMI CALCULATOR", background: black:
  # Formula: w / (h/100)^2
  h_m = data.h / 100
  bmi = data.w / (h_m * h_m)
  
  # Determine Category and Styling
  category = "NORMAL"
  status_color = green
  advice = "You have a normal body weight. Good job!"
  
  if bmi < 18.5:
    category = "UNDERWEIGHT"
    status_color = danger
    advice = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    category = "OVERWEIGHT"
    status_color = orange
    advice = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, padding: large, gap: medium:
    label "Your Result", style: heading, color: white
    
    layout vertical, fill: true, background: card, padding: large, rounded: medium, align: center, gap: large:
      label category, color: status_color, style: heading.small
      label round(bmi, 1), style: heading, color: white
      label advice, style: body, color: white, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back
```

### Design Decisions & Implementation Notes:

*   **State Management**: Used local screen variables for `height`, `weight`, etc. Since the results are a calculation based on a snapshot, I passed them as a single object `data` to the `Results` screen.
*   **Reusability**: 
    *   `GenderCard`: Uses an `emit tap` to notify the parent to update the selection. It uses conditional assignment (`bg = card` then `if current is id: bg = subtle`) to handle the "active" state visual.
    *   `Stepper`: Uses the `button shape: circle` primitive as specified for +/- controls.
*   **Layout**: Used `fill: true` on an empty layout in the Input screen to anchor the "CALCULATE" button to the bottom of the screen. In the Results screen, `fill: true` on the central card ensures it takes up the majority of the screen real estate.
*   **Logic**: 
    *   Used the `round(bmi, 1)` builtin to ensure the result matches standard medical displays.
    *   Standard `if/else if` blocks determine the status text and colors based on the numeric BMI value.
*   **Styling**: Leveraged Igni's built-in tokens: `black` for the deep background, `card` for section surfaces, and `brand` for the primary action buttons. Text is explicitly set to `color: white` to ensure readability against the dark surfaces.