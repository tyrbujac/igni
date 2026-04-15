This code is written in **Igni**, a fictional, declarative UI language designed for streamlined application development. Igni uses a `State` management system and functional components to build user interfaces.

### The Igni Code: `BMI_Calculator.agni`

```agni
// ------------------------------------------------------------
// File: BMI_Calculator.agni
// Description: Calculates BMI based on user weight (kg) and height (m).
// ------------------------------------------------------------

// Define the main screen widget
Screen BMI_Calculator:
    title("BMI Calculator")
    state {
        // State variables to hold user input
        weight: Double = 0.0
        height: Double = 0.0
        
        // State variables for results
        bmi_result: Double? = null
        category_label: String = "Enter values and press Calculate."
    }

    // --- LOGIC FUNCTION ---
    // This function executes the core calculation and classification.
    fn calculate_bmi():
        let w = self.weight
        let h = self.height

        // Input validation
        if w <= 0 or h <= 0:
            self.bmi_result = null
            self.category_label = "Please enter positive values for both weight and height."
            return

        // 1. Calculate BMI: Weight (kg) / Height² (m²)
        let bmi = w / (h * h)
        self.bmi_result = bmi

        // 2. Determine Category using conditional logic
        let category: String
        when bmi:
            case < 18.5:
                category = "Underweight (Focus on increasing nutrient intake.)"
            case 18.5...24.9:
                category = "Normal Weight (Excellent!)"
            case 25.0...29.9:
                category = "Overweight (Consider adjustments to diet and exercise.)"
            case 30.0...9999: // Max Double value acts as the upper bound
                category = "Obese (Consult a healthcare professional for a personalized plan.)"
            default:
                category = "Invalid Calculation."
        
        self.category_label = category

    // --- UI STRUCTURE ---
    widget Container:
        padding: 20
        background_color: "#F5F5F5"

        Column:
            spacing: 15
            
            // Title Widget
            Text("Body Mass Index Calculator")
                style: Header(font_size: 24, color: "#333333")

            // -------------------------------------
            // Input Row: Weight
            // -------------------------------------
            Row:
                Text("Weight (kg):")
                    width: 120
                Input(
                    type: "number",
                    placeholder: "e.g., 75",
                    value: self.weight.toString(),
                    on_change: { new_value in
                        self.weight = new_value.toDouble()
                    }
                )
                width: 150

            // -------------------------------------
            // Input Row: Height
            // -------------------------------------
            Row:
                Text("Height (m):")
                    width: 120
                Input(
                    type: "number",
                    placeholder: "e.g., 1.75",
                    value: self.height.toString(),
                    on_change: { new_value in
                        self.height = new_value.toDouble()
                    }
                )
                width: 150

            // -------------------------------------
            // Action Button
            // -------------------------------------
            Button(
                text: "Calculate BMI",
                action: {
                    self.calculate_bmi()
                }
            )
                style: PrimaryButton()
            
            Spacer() // Pushes the results to the bottom
            
            // -------------------------------------
            // Results Display Area
            // -------------------------------------
            Widget ResultPanel:
                background_color: "#E0F7FA"
                padding: 15
                border_radius: 8
                
                Column:
                    Text("Your BMI:")
                        style: SubHeader()

                    // BMI Value Display
                    Text(
                        if self.bmi_result != null:
                            "${self.bmi_result.rounded(2)}",
                        else:
                            "N/A"
                    )
                        style: ResultNumber(font_size: 36, color: "#007ACC")

                    // Category Label Display
                    Text("Category:")
                        style: SubHeader()

                    Text(
                        self.category_label,
                        style: CategoryText()
                    )

// ------------------------------------------------------------
// Helper/Style Definitions (Simulating Igni's built-in libraries)
// ------------------------------------------------------------

Style Header(font_size: Int, color: String): Style
Style SubHeader(): Style
Style PrimaryButton(): Style
Style ResultNumber(font_size: Int, color: String): Style
Style CategoryText(): Style
```

### Explanation and Flow

1.  **`Screen BMI_Calculator:`**: Defines the main container and encapsulates the application's state.
2.  **`state { ... }`**: This block holds the persistent data (`weight`, `height`, `bmi_result`, `category_label`). When the user interacts with an input, these state variables are updated.
3.  **`fn calculate_bmi()`**: This function contains all the application logic.
    *   **Validation:** It first checks if the inputs are positive.
    *   **Calculation:** It performs the standard BMI calculation: $W / H^2$.
    *   **Classification (`when bmi:`):** Igni uses a `when` statement (similar to pattern matching in other languages) to efficiently categorize the resulting BMI value and assign the descriptive label to `self.category_label`.
4.  **`widget Container:`**: This is the root UI layout element.
5.  **Inputs (`Row` & `Input`):** Two `Row` widgets arrange the labels and input fields. The `on_change` handler is crucial; when a user types, it automatically updates the corresponding state variable (`self.weight` or `self.height`).
6.  **Button (`Button`):** The button's `action` directly calls `self.calculate_bmi()`, triggering the entire calculation and update process.
7.  **Results Display:** The output widgets (the BMI value and the category label) are bound directly to the `self.bmi_result` and `self.category_label` state variables, ensuring the UI updates automatically whenever the `calculate_bmi` function is run.