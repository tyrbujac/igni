```igni
app BMI_Calculator {
  state {
    weightKg: number = 70
    heightCm: number = 170
  }

  computed {
    heightM = heightCm / 100
    bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0

    category =
      bmi < 18.5 ? "Underweight" :
      bmi < 25   ? "Normal" :
      bmi < 30   ? "Overweight" :
                   "Obese"
  }

  ui {
    Window(title: "BMI Calculator", width: 360, height: 320) {
      Column(
        spacing: 16,
        padding: 20,
        align: "stretch"
      ) {
        Text(
          value: "BMI Calculator",
          fontSize: 24,
          fontWeight: "bold",
          align: "center"
        )

        Column(spacing: 10) {
          Text(value: "Weight (kg)")
          NumberInput(
            value: bind weightKg,
            min: 1,
            max: 500,
            step: 0.1,
            placeholder: "Enter weight in kilograms"
          )

          Text(value: "Height (cm)")
          NumberInput(
            value: bind heightCm,
            min: 1,
            max: 300,
            step: 0.1,
            placeholder: "Enter height in centimeters"
          )
        }

        Card(
          padding: 16,
          background: "#f4f6f8",
          radius: 12
        ) {
          Column(spacing: 8) {
            Text(
              value: "Your BMI",
              fontSize: 16,
              color: "#555"
            )

            Text(
              value: format(bmi, 1),
              fontSize: 32,
              fontWeight: "bold"
            )

            Text(
              value: category,
              fontSize: 18,
              color:
                category == "Underweight" ? "#3498db" :
                category == "Normal"      ? "#27ae60" :
                category == "Overweight"  ? "#f39c12" :
                                            "#e74c3c"
            )
          }
        }
      }
    }
  }
}
```