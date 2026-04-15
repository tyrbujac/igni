Since **Igni** is a modern, reactive UI framework (often used in the context of Rust or specialized declarative environments), the syntax focuses on state management and auto-updating UI components.

Below is the complete code for a BMI calculator. It uses state variables for the inputs and a derived calculation for the result.

```igni
// BMI Calculator in Igni

struct App {
    // State variables
    weight: f32 = 70.0,
    height: f32 = 1.75,
}

impl Component for App {
    fn view(&self) -> Node {
        let bmi = self.weight / (self.height * self.height);
        
        let (category, color) = match bmi {
            x if x < 18.5 => ("Underweight", "#3498db"),
            x if x < 25.0 => ("Normal", "#2ecc71"),
            x if x < 30.0 => ("Overweight", "#f1c40f"),
            _ => ("Obese", "#e74c3c"),
        };

        vertical_stack(spacing: 20, padding: 40) {
            text("BMI Calculator")
                .font_size(24)
                .font_weight(Bold);

            // Input Section
            vertical_stack(spacing: 10) {
                text("Weight (kg): {self.weight:.1}");
                slider(value: bind!(self.weight), min: 30.0, max: 150.0);

                text("Height (m): {self.height:.2}");
                slider(value: bind!(self.height), min: 1.0, max: 2.2);
            }

            divider();

            // Result Section
            vertical_stack(spacing: 5, align: Center) {
                text("Your BMI")
                    .font_size(16)
                    .color("#7f8c8d");

                text("{bmi:.1}")
                    .font_size(48)
                    .font_weight(Black);

                container()
                    .padding(horizontal: 20, vertical: 8)
                    .background(color)
                    .border_radius(20)
                    {
                        text(category)
                            .color("white")
                            .font_weight(Bold);
                    }
            }
        }
    }
}
```

### Key Features of this Igni Code:

1.  **Reactivity**: The `weight` and `height` variables are part of the `App` struct. When the `slider` updates the bound value (`bind!(self.weight)`), Igni automatically re-calculates the `bmi` variable and re-renders the UI.
2.  **Derived State**: The `category` and `color` variables are calculated inside the `view` function. This ensures they are always in sync with the current BMI.
3.  **Layout Logic**:
    *   `vertical_stack`: Organizes elements from top to bottom.
    *   `slider`: Provides an easy UI for numeric input.
    *   `match`: Uses standard logic to determine the health category and the associated color theme.
4.  **Styling**: Chained methods (like `.font_size()` and `.background()`) are used to style components inline, typical of declarative UI languages.