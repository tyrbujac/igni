# Igni Cold-LLM Test Prompts (v0.6.8)

Cold tests against v0.6.8. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**Comparison note:** The BMI Calculator prompt below is identical to the v0.6.7 version so outputs can be diff'd directly against `tests/v0.6.7/BMI_Calculator.md`. The spec changed, not the prompt. That isolates the variable: same task, same models, new spec — does the breaking `body` change reduce invented patterns?

---

## 1. BMI Calculator (Angela Yu Flutter Course)

> Using only the Igni language spec above, write a BMI Calculator app in Igni — a two-screen body mass index calculator.
>
> **Screen 1 — Input:**
> - Title: "BMI CALCULATOR"
> - **Gender selection:** two tappable cards side by side — one with a male icon labelled "MALE", one with a female icon labelled "FEMALE". Tapping one selects it and deselects the other. The selected card should be visually distinct (e.g. different background colour).
> - **Height section:** a label "HEIGHT", a large label showing the current height value with "cm" next to it, and a slider (min 120, max 220, default 170).
> - **Weight section:** a label "WEIGHT", a large label showing the current weight value, and two round buttons: "-" to decrease and "+" to increase weight (default 60).
> - **Age section:** a label "AGE", a large label showing the current age value, and two round buttons: "-" to decrease and "+" to increase age (default 25).
> - Weight and Age sections should be side by side.
> - A "CALCULATE YOUR BMI" button at the bottom that navigates to the results screen, passing the height, weight, and gender.
>
> **Screen 2 — Results:**
> - Title: "BMI CALCULATOR"
> - A "Your Result" heading.
> - A category label showing "UNDERWEIGHT", "NORMAL", or "OVERWEIGHT" — coloured green for normal, red/danger for underweight, and orange for overweight.
> - The calculated BMI number displayed large (one decimal place if possible, otherwise whole number is fine).
> - An interpretation line: "You have a lower than normal body weight. You can eat a bit more." for underweight, "You have a normal body weight. Good job!" for normal, "You have a higher than normal body weight. Try to exercise more." for overweight.
> - A "RE-CALCULATE" button that navigates back.
>
> **BMI formula:** weight (kg) / (height in metres) squared. Categories: below 18.5 = underweight, 18.5 to 24.9 = normal, 25 and above = overweight.
>
> Use a reusable component for the gender cards and another for the weight/age input sections (both have the same +/- button pattern).
>
> **Visual style:** dark navy/charcoal screen background with a pink/brand accent for the primary button. Card sections (gender, height, weight, age) use a slightly lighter dark background. Text is white throughout. Match the feel of the source design — don't invent hex codes, use Igni's named colors (e.g. `black`, `brand`, `card`) and set text color explicitly where the dark background requires it.
>
> Show the complete Igni code first, then briefly explain any design decisions you made.
