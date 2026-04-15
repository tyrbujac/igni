# Igni Cold-LLM Test Prompts (v0.8.0)

Cold tests against v0.8.0. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What changed in v0.8.0:** components can declare custom event channels via `emit <event>` (only valid as the action of an `on tap:` / `on touch:` / `on change:` handler), and callers attach handlers via `on <event>:` named arguments at the call site. Reserved event names: `tap`, `change`, `touch`. Everything else is identical to v0.7.1.

**Hypothesis under test:**

Did the feature land? The v0.7.0 BMI Calculator round produced a 5/8 compounded signal (2/4 model invention of `on_tap_handler` / `on decrease:` + 3/4 ship-review flags) that "no clean way for a sub-element inside a reusable component to drive parent-scope state mutations." v0.8.0 makes `emit <event>` real. The direct test is the same BMI prompt against the same four models — does the +/- stepper component now use `emit increment` / `on increment:` instead of string-key dispatch or invented syntax?

**Prediction:** if the feature landed, every model writes the stepper component as something like:

```igni
component Stepper(value):
  layout horizontal:
    button "-", shape: circle, on tap: emit decrement
    label value
    button "+", shape: circle, on tap: emit increment
```

with the parent screen attaching `on increment: weight = weight + 1, on decrement: weight = weight - 1`. 3-4/4 spontaneous adoption would validate the feature, matching the v0.6.11 BMI rerun pattern that validated colour assignability and the v0.7.1 Alert Dashboard pattern that validated `upper()`.

Same methodology as the v0.6.11 BMI rerun and v0.7.1 Alert Dashboard rerun: identical prompt, same four models (Claude Opus 4.6, Gemini 3 Flash, ChatGPT 5.3, Gemini 3.1 Pro), grade against v0.7.0 BMI results for a direct delta on the stepper-component shape.

---

## 1. BMI Calculator (direct v0.7.0 rerun — did `emit` / `on <event>:` land?)

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

**What to grade:**

- **Stepper uses `emit` + `on <event>:`.** Does the Stepper component's +/- buttons use `emit increment` / `emit decrement` (or similar named events) and does the parent attach `on increment: weight = weight + 1`? Direct delta vs v0.7.0 BMI (where 0/4 used emit because it didn't exist: 1 invented `on_tap_handler`, 1 invented `on decrease:`, 2 used the string-key dispatch workaround). 3-4/4 = pass; 4/4 = clean.
- **Gender card uses event channels too.** The MALE/FEMALE cards also need to drive parent state on tap. Do models use `emit selected` (with data) or `emit male` / `emit female`, or do they fall back to direct state mutation in the card layout? Either is spec-legal — but `emit` adoption here is a stronger signal of feature internalisation.
- **No standalone `emit`.** Does any model write `emit X` as a body-level statement (not inside an `on tap:` handler)? Should be 0/4 — the spec calls this out as a parse error.
- **No reserved-name collisions.** Does any model write `emit tap` / `emit change` / `emit touch`? Should be 0/4.
- **Carry-over checks.** v0.7.0 features should stay stable: `status_color = green` variable for category colour (4/4 in v0.7.0), `bg = card` for selected gender card (4/4 in v0.7.0), `round(bmi, 1)` (4/4), `shape: circle` on stepper buttons (4/4).
- **Transpiler validation.** Run each output through the transpiler per `tests/README.md` step 2. Record transpile + `dart analyze` results inline.

**Pass bar (matching v0.6.11 BMI rerun and v0.7.1 Alert Dashboard rerun):** 3-4/4 spontaneous use of `emit` + `on <event>:` for the Stepper component. Below 3/4 signals the spec section needs sharpening or the cheatsheet placement needs revisiting.
