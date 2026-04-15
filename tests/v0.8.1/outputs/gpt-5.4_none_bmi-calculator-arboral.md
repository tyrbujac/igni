```arboral
app BMI_Calculator {
  state {
    weightKg: ""
    heightCm: ""
    bmi: ""
    category: ""
    error: ""
  }

  fn calculateBMI() {
    let weight = toNumber(weightKg)
    let height = toNumber(heightCm)

    if (weight <= 0 or height <= 0) {
      bmi = ""
      category = ""
      error = "Please enter valid positive numbers for weight and height."
      return
    }

    let heightM = height / 100
    let value = weight / (heightM * heightM)
    let rounded = round(value * 10) / 10

    bmi = toString(rounded)
    error = ""

    if (value < 18.5) {
      category = "Underweight"
    } else if (value < 25) {
      category = "Normal"
    } else if (value < 30) {
      category = "Overweight"
    } else {
      category = "Obese"
    }
  }

  view {
    Screen {
      title: "BMI Calculator"

      Column {
        padding: 24
        spacing: 16
        align: center

        Text {
          value: "BMI Calculator"
          size: 28
          weight: bold
        }

        TextField {
          label: "Weight (kg)"
          value: bind weightKg
          inputType: decimal
          placeholder: "Enter your weight"
        }

        TextField {
          label: "Height (cm)"
          value: bind heightCm
          inputType: decimal
          placeholder: "Enter your height"
        }

        Button {
          text: "Calculate BMI"
          onClick: calculateBMI
        }

        if (error != "") {
          Text {
            value: error
            color: red
            size: 14
          }
        }

        if (bmi != "") {
          Card {
            padding: 16
            width: fill

            Column {
              spacing: 8

              Text {
                value: "Your BMI: " + bmi
                size: 22
                weight: bold
              }

              Text {
                value: "Category: " + category
                size: 18
                color: blue
              }
            }
          }
        }
      }
    }
  }
}
```