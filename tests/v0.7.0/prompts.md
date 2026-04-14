# Igni Cold-LLM Test Prompts (v0.7.0)

Cold tests against v0.7.0. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What changed in v0.7.0:** styling tokens became assignable values. Colour tokens (`brand`, `danger`, `green`, etc.) can be stored in variables, passed to functions/components, and reassigned in `if`/`else` blocks. `card` is assignable but remains background-only at the property boundary.

**Hypotheses under test:**

1. **Did the feature land?** With styling-tokens-as-values documented, do models spontaneously reach for `status_color = green` / `bg = card` as the natural conditional-styling pattern — without being prompted? The BMI rerun is the direct test: every v0.6.x BMI round showed models *wanting* this and inventing syntax for it. v0.7 made that syntax real. 4/4 spontaneous usage would validate the feature.

2. **Does the architecture-flow claim hold?** The spec now claims tokens flow through components and functions like any other value, with examples. Do models actually *use* those patterns when the prompt invites them, or do they fall back to duplicated layouts with hardcoded colours?

Run both prompts against the same four models (Claude Opus 4.6, Claude Sonnet 4.6, ChatGPT 5, Gemini 3 Pro). Grade against v0.6.11 BMI results for a direct delta on prompt 1.

---

## 1. BMI Calculator (direct v0.6.11 rerun — did styling-tokens-as-values land?)

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

- **Spontaneous token-as-value usage.** Does the result-screen category colour come from a variable (`status_color = green; if bmi < 18.5: status_color = danger; ...`) or is it solved with three duplicated `label` blocks inside `if`/`else if`/`else`? Direct delta vs v0.6.11 (where all four models wrote the duplicated form because the variable form wasn't legal).
- **Gender-card background via variable.** Does the selected/unselected gender-card background use a `bg = card` / `bg = brand` assignment pattern inside the component, or does it duplicate the whole card layout in an `if`/`else`?
- **`card` boundary compliance.** Does any model misuse `card` with `color:`? (Should be 0/4 — the spec explicitly calls this an error.)
- **Carry-over from v0.6.11.** `round(bmi, 1)` usage should stay at 4/4. `shape: circle` on the +/- steppers should stay at 4/4. Bottom-anchored CTA pattern (`fill: true` on content sections) should stay at ~3.5/4.

---

## 2. Alert Dashboard (token-through-architecture test)

> Using only the Igni language spec above, write an Alert Dashboard app in Igni — a single-screen app that shows a list of alerts, each with a severity-coloured badge and text.
>
> **Screen:**
> - Title: "ALERTS"
> - A list of alerts (start with 5 hardcoded alerts inside the screen body — no fetch needed). Each alert has a `level` (`"critical"`, `"warning"`, or `"info"`) and a `message` string.
> - For each alert, render an `AlertRow` component that shows:
>   - A coloured badge on the left showing the level in uppercase ("CRITICAL", "WARNING", "INFO")
>   - The message text to the right of the badge
> - The badge colour is determined by the level: critical → danger, warning → orange, info → green.
> - At the top of the screen, show a summary line: "X critical, Y warnings, Z info" where X/Y/Z are the counts.
> - The summary line's own text colour should match the highest-severity level present (danger if any critical, orange else if any warning, green otherwise).
>
> **Requirements:**
> - Use a reusable `AlertRow` component.
> - The component should receive the alert's colour as an argument, not recompute it internally.
> - Use a screen-level function to compute the colour from a level.
>
> Show the complete Igni code first, then briefly explain any design decisions you made.

**What to grade:**

- **Function-returns-colour pattern.** Does the model write a `severity_color(level)` function that returns a colour token, matching the spec example? Or does it fall back to a lookup dict, a switch-case workaround, or inlined conditionals?
- **Component-takes-colour argument.** Does the `AlertRow` component accept `color` as a parameter and use it on its badge, matching the spec's `StatusBadge(text, color)` example?
- **Summary-line colour.** Does the model compose the same function for the summary line, reusing the pattern, or invent a second mechanism?
- **No invention of dict-as-map.** The "right" solution is a function that branches on `level`. Does any model invent a `{critical: danger, warning: orange, info: green}` dictionary lookup? (This would be a gap signal — it means models reach for a map-style lookup that Igni doesn't support as an idiom.)
- **Transpiler validation.** Run both outputs through the transpiler per `tests/README.md` step 2. Record transpile success and browser-run success alongside the spec-level grade.

---

## Optional third prompt (hold in reserve)

Running a third prompt in the same round is usually noise. Only run if prompt 1 and prompt 2 give unambiguous PASS results and you want to push on the `card`-boundary rule specifically:

> Write an Igni component `ThemedPanel(title, surface)` where `surface` is a styling token. The panel uses `surface` as its background and shows `title` at the top in bold. Then use it three times in a screen, passing `card`, `brand`, and a variable `bg` whose value depends on a toggle.

**What to grade:** does any model pass `card` to `color:` instead of `background:` by mistake? Does any model try to use `surface` on a text `color:` property? This is the narrowest test of the `card`-is-background-only boundary rule — run only if the first two prompts don't already exercise it enough.
