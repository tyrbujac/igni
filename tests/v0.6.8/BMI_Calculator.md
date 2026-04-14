# BMI Calculator Cold Test Results — v0.6.8

**Date:** 2026-04-14
**Models tested:** Claude Opus 4.6, ChatGPT 5.3, Gemini 3.1 Fast, Gemini 3.1 Pro
**Input:** v0.6.8.md (full spec) + BMI Calculator prompt with explicit styling paragraph
**App:** BMI Calculator — Angela Yu Flutter Course #5, re-run against the new spec

## Context & what this run tests vs. v0.6.7

Same four models, same two-screen BMI Calculator design. Two differences from the v0.6.7 run:

1. **Spec bumped to v0.6.8** with the breaking `body` change (the slot now renders exactly one widget; callers must wrap multiple children in an explicit `layout vertical:` or `layout horizontal:`).
2. **Prompt added a Visual Style paragraph** asking for dark navy/charcoal background, pink/brand accent on the CTA, slightly lighter card sections, white text, no hex codes, use Igni's named colours.

Questions this re-run answers:

1. **Body-slot adoption:** do models find the new pattern, or do they trip the transpiler error (or invent around it)?
2. **Colour-as-variable persistence:** does the 3/4 signal from v0.6.7 persist with explicit "use named colours" guidance?
3. **Theming strategies:** how do models handle dark backgrounds, the unimplemented `theme:` block, and the no-hex-codes constraint?
4. **Effect of bug fixes:** with Bugs 1-5 now fixed, do models naturally use the direct patterns (multi-param navigation, dynamic icon names) or still reach for workarounds?

## Headline result — 2/4 likely to transpile

| | Opus 4.6 | Gemini Pro | Gemini Fast | ChatGPT 5.3 |
|---|---|---|---|---|
| **Valid syntax** | Yes | Yes (with colour-as-variable) | No (invented callback params) | No (invented `on decrement:`) |
| **Invented features** | None | None | `on tap` as param, `size:` on layout | `on decrement:` / `on increment:` custom events (same as v0.6.7) |
| **Body slot** | **Correct v0.6.8** — caller wraps in `layout horizontal:` | Avoided (cross-component function dispatch) | **Correct v0.6.8** — caller wraps in `layout horizontal:` | Avoided via invented events |
| **Colour-as-variable** | No (duplicate-layout) | Yes (bg, text_col, cat_color) | Yes (bg_color, cat_color) | Yes (bg, colour) |
| **Multi-param nav** | Direct | Object literal | Object literal | Direct |
| **Dark theme approach** | `background: black` + per-layout | Same | Same | Same |
| **Hex codes attempted** | No | No | No | No |
| **`theme:` block attempted** | No | No | No | No |
| **Would transpile?** | Yes | Mostly (colour-as-variable fails) | No | No |

## The persistent finding — colour-as-variable is not noise (3/4 v0.6.7 → 3/4 v0.6.8)

The v0.6.7 test flagged this as the strongest signal. v0.6.8 adds an explicit "use Igni's named colors" instruction — and the pattern **still appears in 3/4 models**:

```igni
# Gemini Flash (v0.6.8):
cat_color = green
if bmi < 18.5:
  cat_color = red
# ...
label category, color: cat_color

# Gemini Pro (v0.6.8):
cat_color = green
bg = card
text_col = subtle
if is_selected:
  bg = brand
  text_col = white

# ChatGPT (v0.6.8):
colour = white
if bmi < 18.5:
  colour = danger
# ...
label category, color: colour
```

Same as v0.6.7. The explicit guidance to "use Igni's named colors" was interpreted as "and store them in variables when you need conditional colors" — not as "don't treat them as assignable values."

Only Opus avoided the pattern — using if/else-if/else with separately-rendered labels:

```igni
if category is "UNDERWEIGHT":
  label category, style: heading, color: danger
else if category is "NORMAL":
  label category, style: heading, color: green
else:
  label category, style: heading, color: orange
```

**This is the clearest possible cross-spec replication of a single finding. Two cold tests, different prompts (v0.6.8 explicitly pushes toward semantic tokens), same 3/4 result.** The v0.7 decision to make colour tokens assignable is now supported by the strongest cumulative signal in the project's testing history.

## Secondary finding — callback-to-component is a blind spot

Two different models from different vendors independently invented callback-passing syntax:

**Gemini Fast** — declares `on tap` as a component parameter, then uses `on tap: on tap:` on the layout:
```igni
component GenderCard(label_text, value, current, on tap):
  # ...
  layout vertical, ..., on tap: on tap:
    # ...
```

**ChatGPT** — invents `on decrement:` / `on increment:` as custom events on the component invocation, with component-internal functions that reference them:
```igni
NumberStepper "WEIGHT", weight,
  on decrement: weight = weight - 1,
  on increment: weight = weight + 1

# Inside component:
decrement():
  on decrement
```

ChatGPT did the **exact same invention in v0.6.7**. Spec changed, prompt changed, nothing about ChatGPT's output changed.

**Only Gemini Pro found the spec-correct pattern** — cross-component function dispatch with a string type parameter:
```igni
# Parent:
CounterCard "WEIGHT", weight, "weight"

# Component invokes parent's function:
icon "minus", on tap: decrease(type)
```

Opus sidestepped entirely by putting buttons through `body`.

**Implication:** component-callback is a real need that the spec doesn't meet ergonomically. Cross-component function dispatch works but requires the caller to encode the identity of the target (`"weight"`, `"age"`) so the component's handler can discriminate. Two of four models couldn't find this pattern. Worth considering a spec-level affordance in v0.7 (named events? explicit `event X:` parameter?).

## Theming findings — semantic colours carried the day

Every model handled the styling paragraph correctly:

| Observation | Count |
|---|---|
| Used `background: black` for screen (navy not named) | 4/4 |
| Used `background: card` for card sections | 4/4 |
| Set `color: white` on labels over dark bg | 4/4 |
| Used `color: subtle` for secondary text | 3/4 |
| Used `color: brand` for CTA button | 4/4 |
| Attempted hex codes | 0/4 |
| Attempted `theme:` block (unimplemented) | 0/4 |

Three takeaways:

1. **The "no hex codes, use named colors" guidance worked cleanly.** Models interpreted it as a constraint and respected it.
2. **No model tried the `theme:` block**, even though it's documented in the spec (as "design stage"). The "design stage" caveat was enough to keep them away. This is evidence we don't need to rush implementing `theme:` — per-layout `background:` is expressive enough that models route around it.
3. **Semantic tokens (`brand`, `card`, `subtle`, `danger`) cover the real styling surface.** No model felt the lack of additional tokens. `brand` worked as a pink accent; `card` worked as a lighter-dark surface; `subtle` worked as a muted text. This validates Igni's small, semantic palette over a larger named palette.

## Results by model

### Claude Opus 4.6 — cleanest, v0.6.8 pattern adopted

```igni
screen Input, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large:
    # Gender selection
    layout horizontal, gap: medium:
      layout vertical, fill: true:
        GenderCard "male", "MALE", gender is "male", on tap: gender = "male"
      layout vertical, fill: true:
        GenderCard "female", "FEMALE", gender is "female", on tap: gender = "female"

    # Height
    layout vertical, padding: medium, background: card, rounded: medium, align: center:
      label "HEIGHT", style: caption, color: subtle
      layout horizontal, align: center, gap: small:
        label height, style: heading, color: white
        label "cm", style: body, color: subtle
      slider bind: height, min: 120, max: 220

    # Weight and Age side by side
    layout horizontal, gap: medium:
      layout vertical, fill: true:
        ValueCard "WEIGHT", weight:
          layout horizontal, gap: medium:
            button "-", on tap: dec_weight()
            button "+", on tap: inc_weight()
      layout vertical, fill: true:
        ValueCard "AGE", age:
          layout horizontal, gap: medium:
            button "-", on tap: dec_age()
            button "+", on tap: inc_age()

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Result height, weight, gender

  inc_weight():
    weight = weight + 1
  dec_weight():
    weight = weight - 1
  inc_age():
    age = age + 1
  dec_age():
    age = age - 1


component GenderCard(icon_name, label_text, selected):
  if selected:
    layout vertical, padding: large, background: brand, rounded: medium, align: center:
      icon icon_name, size: large, color: white
      label label_text, style: caption, color: white
  else:
    layout vertical, padding: large, background: card, rounded: medium, align: center:
      icon icon_name, size: large, color: white
      label label_text, style: caption, color: white


component ValueCard(title, value):
  layout vertical, padding: medium, background: card, rounded: medium, align: center:
    label title, style: caption, color: subtle
    label value, style: heading, color: white
    body


screen Result(height, weight, gender), title: "BMI CALCULATOR", background: black:
  height_m = height / 100
  bmi = weight / (height_m * height_m)

  category = "NORMAL"
  interpretation = "You have a normal body weight. Good job!"
  if bmi < 18.5:
    category = "UNDERWEIGHT"
    interpretation = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    category = "OVERWEIGHT"
    interpretation = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, gap: large, padding: large, align: center, fill: true:
    label "Your Result", style: heading, color: white

    if category is "UNDERWEIGHT":
      label category, style: heading, color: danger
    else if category is "NORMAL":
      label category, style: heading, color: green
    else:
      label category, style: heading, color: orange

    label bmi, style: heading, color: white
    label interpretation, style: body, color: white, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back
```

**Notes (Opus):** adopted the v0.6.8 pattern perfectly — `ValueCard` uses `body`, caller wraps in `layout horizontal:`. Uses duplicate-layout in `GenderCard` (spec-correct given no assignable colour tokens). Uses if/else-if/else for category display. Flags `round()` as a spec gap. Same cross-cutting consistency as v0.6.7.

### Gemini 3.1 Pro — strong, same colour-as-variable as v0.6.7

```igni
screen Input, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large, fill: true:

    layout horizontal, gap: medium:
      GenderCard "MALE", "male", gender is "male", on tap: gender = "male"
      GenderCard "FEMALE", "female", gender is "female", on tap: gender = "female"

    layout vertical, padding: medium, background: card, rounded: medium, align: center:
      label "HEIGHT", color: subtle
      layout horizontal, align: center:
        label height, style: heading, color: white
        label "cm", color: subtle
      slider bind: height, min: 120, max: 220

    layout horizontal, gap: medium:
      CounterCard "WEIGHT", weight, "weight"
      CounterCard "AGE", age, "age"

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Results {height: height, weight: weight, gender: gender}

  decrease(type):
    if type is "weight":
      weight = weight - 1
    else if type is "age":
      age = age - 1

  increase(type):
    if type is "weight":
      weight = weight + 1
    else if type is "age":
      age = age + 1

screen Results(data), title: "BMI CALCULATOR", background: black:
  h_m = data.height / 100
  bmi = data.weight / (h_m * h_m)

  category = "NORMAL"
  cat_color = green
  message = "You have a normal body weight. Good job!"

  if bmi < 18.5:
    category = "UNDERWEIGHT"
    cat_color = danger
    message = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    category = "OVERWEIGHT"
    cat_color = orange
    message = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, gap: medium, padding: large, fill: true:
    label "Your Result", style: heading, color: white

    layout vertical, padding: large, background: card, rounded: medium, align: center, spread: true, fill: true:
      label category, color: cat_color
      label bmi, style: heading, color: white
      label message, color: white, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back

component GenderCard(title, icon_name, is_selected):
  bg = card
  text_col = subtle
  if is_selected:
    bg = brand
    text_col = white

  layout vertical, padding: medium, background: bg, rounded: medium, align: center, fill: true:
    icon icon_name, size: large, color: white
    label title, color: text_col

component CounterCard(title, value, type):
  layout vertical, padding: medium, background: card, rounded: medium, align: center, fill: true:
    label title, color: subtle
    label value, style: heading, color: white
    layout horizontal, gap: medium:
      icon "minus", size: large, color: white, on tap: decrease(type)
      icon "plus", size: large, color: white, on tap: increase(type)
```

**Notes (Gemini Pro):** doesn't use `body` at all — uses cross-component function dispatch with string type discrimination (`decrease("weight")`, `decrease("age")`). This is the one spec-correct alternative to body. Heavy use of colour-as-variable (`bg`, `text_col`, `cat_color`). Still uses object-literal navigation workaround despite the Bug 2 fix making direct multi-param work.

### Gemini 3.1 Fast — invented callback parameter syntax

```igni
screen Input, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: medium:
    # Gender
    layout horizontal, gap: medium:
      GenderCard "MALE", "male", gender, on tap: gender = "male"
      GenderCard "FEMALE", "female", gender, on tap: gender = "female"

    # Height
    layout vertical, background: card, padding: medium, rounded: medium, align: center:
      label "HEIGHT", style: caption, color: subtle
      label height + "cm", style: heading, color: white
      slider bind: height, min: 120, max: 220

    # Weight and Age
    layout horizontal, gap: medium:
      ControlCard "WEIGHT", weight:
        layout horizontal, gap: medium:
          RoundButton "-", on tap: weight = weight - 1
          RoundButton "+", on tap: weight = weight + 1
      ControlCard "AGE", age:
        layout horizontal, gap: medium:
          RoundButton "-", on tap: age = age - 1
          RoundButton "+", on tap: age = age + 1

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Results {h: height, w: weight, g: gender}

screen Results(data), title: "BMI CALCULATOR", background: black:
  height_m = data.h / 100
  bmi = data.w / (height_m * height_m)

  category = "NORMAL"
  cat_color = green
  advice = "You have a normal body weight. Good job!"

  if bmi < 18.5:
    category = "UNDERWEIGHT"
    cat_color = red
    advice = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    category = "OVERWEIGHT"
    cat_color = orange
    advice = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, gap: medium, padding: large, fill: true:
    label "Your Result", style: heading, color: white
    layout vertical, background: card, padding: large, rounded: medium, align: center, fill: true, gap: large:
      label category, color: cat_color, style: heading.small
      label bmi, style: heading, color: white
      label advice, align: center, color: white
    button "RE-CALCULATE", color: brand, on tap: navigate back

component GenderCard(label_text, value, current, on tap):
  bg_color = card
  if value is current:
    bg_color = subtle

  layout vertical, background: bg_color, padding: medium, rounded: medium, align: center, fill: true, on tap: on tap:
    icon value, size: 80, color: white
    label label_text, style: caption, color: subtle

component ControlCard(label_text, value):
  layout vertical, background: card, padding: medium, rounded: medium, align: center, fill: true:
    label label_text, style: caption, color: subtle
    label value, style: heading, color: white
    body

component RoundButton(text):
  layout vertical, background: subtle, size: 56, rounded: large, align: center:
    label text, style: heading, color: white
```

**Issues (Gemini Fast):**
- Invented syntax: `component GenderCard(label_text, value, current, on tap):` — `on tap` as a parameter name. Then `on tap: on tap:` on the layout. Parser would fail.
- Invalid property: `size: 56` on `layout vertical` inside `RoundButton`. Layouts don't have a `size:` property.
- `icon value, size: 80` — numeric icon size (spec uses design tokens like `size: large`).
- Otherwise: correct v0.6.8 body usage in `ControlCard`, colour-as-variable pattern, reasonable styling choices.

### ChatGPT 5.3 — same invention as v0.6.7, zero learning

```igni
screen Input, title: "BMI CALCULATOR", background: black:
  gender = null
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large:
    layout horizontal, gap: medium:
      GenderCard "MALE", "male", gender is "male", on tap: gender = "male"
      GenderCard "FEMALE", "female", gender is "female", on tap: gender = "female"

    layout vertical, background: card, rounded: medium, padding: medium, align: center:
      label "HEIGHT", color: white
      layout horizontal, align: center:
        label height, style: heading, color: white
        label " cm", color: white
      slider bind: height, min: 120, max: 220

    layout horizontal, gap: medium:
      NumberStepper "WEIGHT", weight,
        on decrement: weight = weight - 1,
        on increment: weight = weight + 1

      NumberStepper "AGE", age,
        on decrement: age = age - 1,
        on increment: age = age + 1

    button "CALCULATE YOUR BMI", color: brand,
      on tap: navigate to Result height, weight, gender


screen Result(height, weight, gender), title: "BMI CALCULATOR", background: black:
  h = height / 100
  bmi = weight / (h * h)

  category = ""
  interpretation = ""
  colour = white

  if bmi < 18.5:
    category = "UNDERWEIGHT"
    interpretation = "You have a lower than normal body weight. You can eat a bit more."
    colour = danger
  else if bmi < 25:
    category = "NORMAL"
    interpretation = "You have a normal body weight. Good job!"
    colour = green
  else:
    category = "OVERWEIGHT"
    interpretation = "You have a higher than normal body weight. Try to exercise more."
    colour = orange

  layout vertical, gap: medium, padding: large:
    label "Your Result", style: heading, color: white
    layout vertical, background: card, rounded: medium, padding: large, align: center:
      label category, color: colour
      label bmi, style: heading, color: white
      label interpretation, align: center, color: white
    button "RE-CALCULATE", color: brand, on tap: navigate back


component GenderCard(label_text, icon_name, selected):
  bg = card
  if selected:
    bg = brand

  layout vertical, background: bg, rounded: medium, padding: medium, align: center:
    icon icon_name, size: large, color: white
    label label_text, color: white


component NumberStepper(label_text, value):
  layout vertical, background: card, rounded: medium, padding: medium, align: center:
    label label_text, color: white
    label value, style: heading, color: white
    layout horizontal, gap: small:
      layout vertical, background: black, rounded: medium, padding: small, on tap: decrement():
        label "-", align: center, color: white
      layout vertical, background: black, rounded: medium, padding: small, on tap: increment():
        label "+", align: center, color: white

  decrement():
    on decrement

  increment():
    on increment
```

**Issues (ChatGPT):**
- **Identical invention to v0.6.7:** `on decrement: ...` / `on increment: ...` as custom events on component invocation. The component internally defines `decrement()` / `increment()` functions whose bodies are `on decrement` / `on increment` — a completely invented callback mechanism.
- Same pattern, same spec violation, different spec version. This is the most robust evidence that ChatGPT has a systematic blind spot here.
- Otherwise: valid colour-as-variable, valid direct multi-param navigation, valid styling.

## Comparison: v0.6.7 → v0.6.8 delta

| Dimension | v0.6.7 | v0.6.8 | Delta |
|---|---|---|---|
| Models with valid syntax | 1/4 (Opus) | 2/4 (Opus, Gemini Pro) | +1 |
| Models likely to transpile | 1/4 | 2/4 | +1 |
| Colour-as-variable pattern | 3/4 | 3/4 | **unchanged** |
| Multi-param navigation correct | 3/4 | 4/4 (both forms legal now) | +1 |
| Hex code attempts | 0/4 | 0/4 | unchanged |
| `theme:` block attempts | 0/4 | 0/4 | unchanged |
| Invented syntax per model | 1 model | 2 models | +1 |
| ChatGPT's invention pattern | `on decrement:` | `on decrement:` (same) | unchanged |

The v0.6.8 breaking change didn't break models who were already doing body correctly (Opus, both Geminis adapted). It didn't fix models who were going to invent anyway (ChatGPT).

The most informative result is what **didn't** change: colour-as-variable is a deep, replicable pattern. Explicit guidance to "use Igni's named colors" did nothing to prevent it — 3/4 models still reached for it. This is now the clearest signal in the project's cold-testing history.

## Implications for v0.7

**1. Colour-as-variable is now unambiguous.** Two cold tests, 3/4 each, explicit guidance against it in one test. It should be resolved in v0.7. Options from the ROADMAP:
- (a) Make colour tokens first-class values (what models expect, what they invented).
- (b) Document duplicate-layout workaround as canonical (what Opus does, but verbose).
- (c) Property-expression form (`color: if cond then danger else green`).

The evidence now strongly favours (a). Models treat tokens as values in their mental model; the spec should match.

**2. Component-callback is the next signal.** Not yet as strong as colour-as-variable (2/4 invented two different inventions), but clearly a real need. Worth a v0.7 discussion on whether `event X:` or named-event syntax belongs. For now, cross-component function dispatch (Gemini Pro's pattern) is the canonical workaround — but it's not obvious from the spec alone.

**3. `theme:` block is a false priority.** 0/4 models tried to use it. The "design stage" caveat is doing its job. Per-layout `background:` + named colours + `color:` is expressive enough that models don't feel the gap. Lower priority than the ROADMAP currently implies.

**4. Icon sizing should be documented as design-token-only.** Gemini Fast used `size: 48` and `size: 80` (numeric). The spec examples always use design tokens (`size: large`). A one-line clarification would help.

## Transpiler validation

Opus's output is the cleanest candidate for end-to-end validation (matches all v0.6.8 rules, no colour-as-variable, no invented syntax). Gemini Pro's output is likely to transpile modulo the colour-as-variable pattern (which would fail at codegen time when a bare identifier is used in `color:` but isn't a known token).

Not validated through the transpiler in this session — that's a follow-up step. The primary goal of this test was the spec-design signal, and that signal is clear.
