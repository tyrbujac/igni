> **Note:** "Igni" isn't a widely-documented UI language in my training data, so the following is my best-faith interpretation of what an Igni app would look like based on the declarative, component-oriented style the name suggests. If Igni has a specific spec you're working from, feel free to share it and I'll adjust.

```igni
// ── BMI Calculator ──────────────────────────────────────

app BMICalculator {

  // ── Reactive state ──────────────────────────────────
  state {
    weight:     Float  = 0.0      // kilograms
    height:     Float  = 0.0      // metres
    bmi:        Float  = 0.0
    category:   String = ""
    showResult: Bool   = false
  }

  // ── Business logic ──────────────────────────────────
  func calculateBMI() {
    if height <= 0.0 || weight <= 0.0 {
      showResult = false
      return
    }

    bmi = weight / (height * height)

    category = match bmi {
      ..18.5  => "Underweight"
      ..25.0  => "Normal weight"
      ..30.0  => "Overweight"
      _       => "Obese"
    }

    showResult = true
  }

  func categoryColor() -> Color {
    return match category {
      "Underweight"    => Color.blue
      "Normal weight"  => Color.green
      "Overweight"     => Color.orange
      "Obese"          => Color.red
      _                => Color.gray
    }
  }

  // ── View tree ───────────────────────────────────────
  view {
    Scaffold(title: "BMI Calculator") {

      Column(alignment: .center, spacing: 20, padding: 32) {

        // --- Header ---
        Icon("fitness_center", size: 48, color: Color.primary)

        Text("BMI Calculator")
          .fontSize(28)
          .fontWeight(.bold)

        // --- Weight input ---
        TextField(
          label:    "Weight (kg)",
          bind:     $weight,
          keyboard: .decimal,
          hint:     "e.g. 70"
        )

        // --- Height input ---
        TextField(
          label:    "Height (m)",
          bind:     $height,
          keyboard: .decimal,
          hint:     "e.g. 1.75"
        )

        // --- Calculate button ---
        Button("Calculate", style: .filled, width: .match) {
          calculateBMI()
        }

        // --- Result card (shown only after calculation) ---
        if showResult {
          Card(elevation: 4, cornerRadius: 16, padding: 24) {

            Column(alignment: .center, spacing: 12) {

              Text("Your BMI")
                .fontSize(16)
                .color(Color.gray)

              Text("{bmi | fixed(1)}")        // formatted to 1 decimal
                .fontSize(48)
                .fontWeight(.black)
                .color(categoryColor())

              Chip(label: category, color: categoryColor())

              // small explanatory range bar
              Divider()

              Row(spacing: 8) {
                RangeBadge("< 18.5",  "Underweight", Color.blue)
                RangeBadge("18.5–25", "Normal",      Color.green)
                RangeBadge("25–30",   "Overweight",  Color.orange)
                RangeBadge("≥ 30",    "Obese",       Color.red)
              }
            }
          }
        }
      }
    }
  }

  // ── Reusable sub-component ──────────────────────────
  component RangeBadge(range: String, label: String, color: Color) {
    view {
      Column(alignment: .center, spacing: 2) {
        Text(range)
          .fontSize(10)
          .fontWeight(.semibold)
          .color(color)
        Text(label)
          .fontSize(9)
          .color(Color.gray)
      }
    }
  }
}
```

## How it works

| Section | Purpose |
|---|---|
| **`state { … }`** | Declares reactive properties. Changing any value automatically re-renders the parts of the view that depend on it. |
| **`$weight` / `$height`** | Two-way bindings so `TextField` edits flow back into state. |
| **`match bmi { ..18.5 => … }`** | Pattern-match with half-open ranges to classify the BMI. |
| **`categoryColor()`** | Maps the category string to a semantic `Color` used by both the large number and the `Chip`. |
| **`if showResult { … }`** | Conditionally renders the result `Card` only after a valid calculation. |
| **`component RangeBadge`** | A small reusable component shown at the bottom of the card to remind the user of each BMI range. |

### BMI formula refresher

$$BMI = \frac{\text{weight (kg)}}{\text{height (m)}^2}$$

| BMI | Category |
|-----|----------|
| < 18.5 | Underweight |
| 18.5 – 24.9 | Normal weight |
| 25.0 – 29.9 | Overweight |
| ≥ 30.0 | Obese |

If the real Igni spec differs from what I've shown here, drop a link or a snippet and I'll happily rework the code to match.