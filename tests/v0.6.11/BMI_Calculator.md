# BMI Calculator Cold Test Results — v0.6.11

**Date:** 2026-04-14
**Models tested:** Claude Opus 4.6, ChatGPT 5.3, Gemini 3 Flash, Gemini 3.1 Pro
**Input:** v0.6.11.md (full spec) + identical-to-v0.6.8 BMI prompt
**App:** BMI Calculator — Angela Yu Flutter Course #5

## Purpose — methodology experiment

Between v0.6.8 and v0.6.11 the spec received three non-breaking additions, each designed to address a specific gap the v0.6.8 BMI cold test surfaced:

1. **v0.6.9** — `round(value, places)` builtin. Addresses the raw-float BMI display that 4/4 models produced in v0.6.8.
2. **v0.6.10** — Bottom-anchored actions pattern. Pure documentation, no new syntax. Addresses the shrink-wrapped layout that left the CALCULATE button floating mid-screen in 4/4 v0.6.8 outputs.
3. **v0.6.11** — `shape: circle` on `button`. Addresses the missing round +/- stepper buttons.

The prompt is *identical* to v0.6.8. Same app, same four models. The spec is what changed. The question is whether these three categorically different additions (builtin, documentation example, new property value) each translate into visibly different model output.

This is the final cold test in the pure-prompt-grade-and-compare methodology. v0.7 work will shift to human-authorship driven design (Tyr reading/writing Igni and flagging friction), with cold tests reserved for validating specific structural decisions.

## Headline result — every addition landed

| | ChatGPT | Gemini Flash | Gemini Pro | Opus 4.6 | v0.6.8 | v0.6.11 | Delta |
|---|---|---|---|---|---|---|---|
| **`round()` on BMI** | ✓ | ✓ | ✓ | ✓ | 0/4 | **4/4** | +4 |
| **Bottom-anchor `fill:true`** | ✓ | ✓ | ✓ | 1/2 screens | 0/4 | **~3.5/4** | +3.5 |
| **`shape: circle`** | ✓ | ✓ | ✓ | ✓ | n/a | **4/4** | new |
| **Colour-as-variable** | ✓ | ✓ | — | — | 3/4 | **2/4** | −1 |
| **Valid multi-param nav** | ✗ (no commas) | ✗ (parens) | ✓ | ✓ | 3/4 | 2/4 | −1 |
| **ChatGPT callback invention** | still there | — | — | — | 1/4 | 1/4 | 0 |

## Per-addition analysis

### `round()` — 0/4 → 4/4 (unanimous adoption)

Every model produced `round(bmi, 1)` on first exposure. All four correctly:
- Called it with two args (value and places)
- Passed `1` for the BMI display, matching Angela's `toStringAsFixed(1)` convention
- Chose `label round(bmi, 1)` as the idiomatic call site (not a variable assignment first)

Three of four placed the call inside the Results screen's body. Gemini Flash alone used an intermediate variable (`bmi = round(bmi_val, 1)`) rather than calling `round()` at the render site — arguably cleaner, but the end result is identical.

**Interpretation:** adding a builtin to the Reference section with a one-line example is a near-perfect channel from spec to model output. This is the strongest propagation signal we've measured across any addition.

### Bottom-anchor `fill: true` pattern — 0/4 → ~3.5/4 (documentation drove adoption)

The interesting finding. v0.6.10 is **pure documentation** — no new syntax. The pattern (`fill: true` on content sections, unfilled button at the end) was already possible in v0.6.8; 0/4 models used it. After adding a worked example to the layout section, 3-4/4 did.

Three distinct forms emerged:

**Canonical (Gemini Pro):** `fill: true` directly on the three content rows. This matches the spec's added example closest.

**Empty-spacer (ChatGPT):** `layout vertical, fill: true` as an empty layout placed before the button, used as a pure vertical spacer.

**Outside-the-padded-wrapper (Gemini Flash):** put all content in an outer `layout vertical, fill: true` and the button at the **screen body level** after it. Screen body stacks vertically by default, so the fill:true layout expands and the button lands at the edge. Arguably cleaner than the documented form.

**Partial (Opus):** used the pattern on the Results screen only, left the Input screen shrink-wrapped.

**Interpretation:** documentation-only patterns propagate at roughly 75-90% effectiveness compared to named primitives (100%). The variety of forms also says something useful — when the spec shows one canonical pattern, models find the *idea* but express it in their own way. Two of three adopters did something not literally in the example, just spiritually adherent to it.

A small observation worth logging: Gemini Flash's "button at screen body level, outside the padded layout" is a pattern the spec doesn't document but is arguably more elegant than the canonical form (the button naturally sits edge-to-edge because it escapes the outer padding). Worth considering for a future docs patch.

### `shape: circle` — unanimous adoption on first exposure

4/4 models used `button "-", shape: circle, color: subtle, on tap: ...` for +/- stepper buttons. All four made the same three choices:
- `shape: circle` (correctly named, correctly scoped to button)
- `color: subtle` for a grey filled background (matching Angela's `#4C4F5E` more closely than any other named colour)
- Placed the circle buttons inside `layout horizontal, gap: medium:` rows

**Interpretation:** adding one new property value to an existing primitive is the cheapest structural spec addition possible, and it propagates perfectly. This is consistent with the `round()` result — *named* additions are extremely effective at shaping output.

### Colour-as-variable — 3/4 → 2/4

Down from 3/4 in both v0.6.7 and v0.6.8. Two models (Gemini Flash, ChatGPT) still used it; two (Gemini Pro, Opus) did not.

Notable: **Gemini Pro used it heavily in both v0.6.7 and v0.6.8 cold tests but dropped it this round**, using the duplicate-layout pattern for the GenderCard and the if/else-label pattern for the category color. This is the first time Gemini Pro hasn't produced the pattern.

Possible explanations:
- **Random variation** — LLM outputs aren't deterministic, and n=3 tests with one model isn't enough for a confident trend
- **Incidental drift** — adding the v0.6.9/10/11 content may have shifted model attention toward other patterns
- **"Use Igni's named colors" line finally landing** — the v0.6.8 prompt introduced the explicit instruction; v0.6.11 carries it over. Maybe Gemini Pro responded to it this time.

The fact that 2/4 still do it means the signal is still real, just softer. The design case for addressing colour-as-variable in v0.7 isn't weakened — it's the single most replicated invention across our three cold tests.

### ChatGPT callback invention — still there

Third test, third different callback invention. v0.6.7: `on decrement:` custom events. v0.6.8: same. v0.6.11: **named component parameters named `on_dec` and `on_inc` that carry function references** (`StepperSection "WEIGHT", weight, on_dec: dec_weight, on_inc: inc_weight`), then called inside the component as `on tap: on_dec()`.

Igni has no first-class functions; passing function names as parameter values doesn't work. Same conceptual blindspot, three surface-level variations.

**Interpretation:** some inventions are model-specific, not spec-specific. Adding more spec surface won't fix ChatGPT's desire to pass callbacks to components — that's a mismatch between GPT's training priors (where callbacks are universal) and Igni's constraints. This is useful negative data: **cold testing with one model from one vendor would miss this pattern entirely**, because Opus and Gemini both find the spec-correct cross-component function dispatch pattern. Vendor diversity matters more than model count.

### Self-aware error flagging (Opus)

Opus's output ends with:

> **Bug you'll want to catch:** `step_down` for age currently says `age = age + 1` — that's a typo, should be `age = age - 1`. I'll flag it rather than silently fix it since you'll want the transpiler cold tests to catch these.

Plus a second typo (`weit` instead of `weight`) inside its own output. This is the only cold-test run across three sessions where a model meta-commented on its own mistakes. Interesting research point about model self-awareness in code generation, though the correct framing is probably "Opus is more willing to acknowledge uncertainty" rather than any strong claim about introspection.

## Results by model

### Opus 4.6 — cleanest architecture, self-flagged two bugs

```igni
component GenderCard(icon_name, label_text, selected):
  if selected:
    layout vertical, fill: true, align: center, padding: large, background: brand, rounded: medium, gap: small:
      icon icon_name, size: large, color: white
      label label_text, style: caption, color: white
  else:
    layout vertical, fill: true, align: center, padding: large, background: card, rounded: medium, gap: small:
      icon icon_name, size: large, color: white
      label label_text, style: caption, color: white

component StepperCard(title, value):
  layout vertical, fill: true, align: center, padding: medium, background: card, rounded: medium, gap: small:
    label title, style: caption, color: subtle
    label value, style: heading, color: white
    layout horizontal, gap: medium:
      button "-", shape: circle, color: subtle, on tap: step_down(title)
      button "+", shape: circle, color: subtle, on tap: step_up(title)

screen Input, title: "BMI CALCULATOR", background: black:
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, padding: large, gap: medium:
    layout horizontal, gap: medium:
      GenderCard "male", "MALE", gender is "male", on tap: gender = "male"
      GenderCard "female", "FEMALE", gender is "female", on tap: gender = "female"

    layout vertical, align: center, padding: medium, background: card, rounded: medium, gap: small:
      label "HEIGHT", style: caption, color: subtle
      layout horizontal, align: center, gap: small:
        label height, style: heading, color: white
        label "cm", style: body, color: subtle
      slider bind: height, min: 120, max: 220

    layout horizontal, gap: medium:
      StepperCard "WEIGHT", weight
      StepperCard "AGE", age

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Results height, weight, gender

  step_up(which):
    if which is "WEIGHT":
      weight = weight + 1
    else:
      age = age + 1

  step_down(which):
    if which is "WEIGHT":
      weight = weit - 1          # typo self-flagged: should be `weight - 1`
    else:
      age = age + 1              # bug self-flagged: should be `age - 1`

screen Results(height, weight, gender), title: "BMI CALCULATOR", background: black:
  height_m = height / 100
  bmi = weight / (height_m * height_m)

  category = "NORMAL"
  if bmi < 18.5:
    category = "UNDERWEIGHT"
  else if bmi >= 25:
    category = "OVERWEIGHT"

  interpretation = "You have a normal body weight. Good job!"
  if bmi < 18.5:
    interpretation = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    interpretation = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, padding: large:
    layout vertical, fill: true, align: center, gap: medium:
      label "Your Result", style: heading, color: white

      if category is "UNDERWEIGHT":
        label "UNDERWEIGHT", style: heading.small, color: danger
      else if category is "NORMAL":
        label "NORMAL", style: heading.small, color: green
      else:
        label "OVERWEIGHT", style: heading.small, color: orange

      label round(bmi, 1), style: heading, color: white
      label interpretation, style: body, color: white, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back
```

Notes: adopted `round()`, `shape: circle`, and bottom-anchor (on Results only). Did not use the pattern on Input. Used cross-component function dispatch with string key (`step_up("WEIGHT")`). Self-flagged typos in its own output.

### Gemini 3.1 Pro — fully canonical v0.6.11 adoption

Used all three patches correctly, in the exact forms the spec documents:
- `round(bmi, 1)` at render site
- `fill: true` on all three content rows on Input, `fill: true` on the card on Results
- `shape: circle, color: subtle` on +/- buttons
- Multi-param navigation direct: `navigate to Results height, weight, gender`

**Did not use colour-as-variable** this round — used duplicate-layout for GenderCard and if/else-label for the category color. First time Gemini Pro has avoided the pattern across three cold tests.

Also kept its spec-correct cross-component function dispatch (`decrement(type)`, `increment(type)`, `select_gender(type)`).

### Gemini 3 Flash — adopted all three, novel bottom-anchor

`round()` via intermediate variable (`bmi = round(bmi_val, 1)`), then `label bmi`.

Bottom-anchor via a novel pattern: content inside `layout vertical, fill: true:`, button at **screen body level** outside that layout. Cleaner than the canonical form because the button escapes the outer padding.

`shape: circle, color: subtle` on +/- buttons, placed inside a horizontal row.

Still uses colour-as-variable (`bg = card`, `bg = subtle`, `cat_color = red/orange`).

Minor issues:
- `navigate to Results(height, weight)` — parens on navigation, syntax error
- Numeric icon size (`size: 80`) and label size (`size: 100`) — spec uses design tokens, these may be silently ignored
- Variable assignments inside a layout block (category/message/advice in the Results card) — technically violates the variable-placement rule

### ChatGPT 5.3 — all three new patches, still invents callbacks

`round(bmi, 1)` at render site. ✓

Bottom-anchor via empty `layout vertical, fill: true` spacer before the button. ✓

`shape: circle, color: subtle` on +/- buttons. ✓

**Still invents callback syntax**, third cold test running:
```igni
StepperSection "WEIGHT", weight,
  on_dec: dec_weight,
  on_inc: inc_weight
```

Treats `on_dec` and `on_inc` as named parameters carrying function references. The component then calls `on tap: on_dec()`. Igni has no first-class functions — `dec_weight` as a value isn't callable. Different surface syntax from v0.6.7 and v0.6.8, same underlying blindspot.

Also has a navigation syntax error: `navigate to Result height weight gender` — no commas between args.

Colour-as-variable still heavy: `bg = card`, `bg = brand`, `colour = green/danger/orange`.

## Methodology findings

**1. Spec-to-output propagation is very reliable for named additions.** `round()` (builtin): 4/4. `shape: circle` (property value): 4/4. Two new names in the spec, universal adoption on first exposure. The channel from "add something named to the spec" to "models use it" is effectively saturated.

**2. Documentation-only patterns propagate at 75-90% of named additions.** The bottom-anchor pattern moved 3-4/4 models despite introducing no new syntax. **This matters for the spec budget.** It means we can fix many gaps via documentation rather than adding new keywords. The "spec is a budget" principle is vindicated — not every gap needs new syntax.

**3. Documented patterns get reinterpreted, not copied.** Only Gemini Pro used the exact canonical form from the spec example. ChatGPT and Gemini Flash each invented a variant that captures the pattern's intent but expresses it differently. This is good — it means we're teaching the *concept*, not the specific code shape. But it argues for documenting multiple forms when they're all spec-correct, so models aren't artificially constrained to one pattern.

**4. Some patterns are model-specific and won't be fixed by spec changes.** ChatGPT's callback invention is now 3-for-3 across different invention forms. Adding more spec won't fix it — it's a mismatch between training priors and Igni's constraints. Only recourse: keep cross-vendor cold tests so we don't generalize Opus+Gemini behavior as universal.

**5. Colour-as-variable is softening but persistent.** 3/4 → 3/4 → 2/4 across three tests. Still worth addressing in v0.7 but the urgency is slightly lower than v0.6.8 suggested. One interpretation: the explicit "use Igni's named colors" prompt line has been doing some work, and models that re-read carefully (Gemini Pro here) can be nudged away from the pattern even without spec changes. Doesn't eliminate the need for a v0.7 fix, but reduces pressure.

**6. Vendor diversity > model count.** Four models across three vendors caught a callback pattern specific to OpenAI and a colour-as-variable pattern that appears across Google and OpenAI but not Anthropic. Two models from the same vendor would have missed at least one of these. Dissertation-relevant methodology note.

## What this closes and what it opens

**Closes the v0.6.x arc.** The three patches (v0.6.9/10/11) were each hypothesis-driven responses to v0.6.8 cold-test signal. This test confirms each hypothesis:
- Missing builtin → add builtin (works, 4/4)
- Undiscovered existing pattern → document pattern (works, 3-4/4)
- Missing property value → add property value (works, 4/4)

**Opens v0.7.** Colour-as-variable remains the single biggest unresolved design question; the object-spread, identity-semantics, and error-inspection questions in the ROADMAP remain untouched. v0.7 work will shift from cold-test-driven to human-authorship-driven — Tyr reading/writing Igni and flagging friction — with cold tests reserved for validating specific structural decisions.

## Transpiler validation

All four outputs would need individual investigation for end-to-end transpilation. Predictions:

- **Opus:** transpiles after typo fixes; renders closest to Angela
- **Gemini Pro:** transpiles cleanly, valid end-to-end
- **Gemini Flash:** fails to transpile due to `navigate to Results(height, weight)` (parens on nav — Bug 2 pattern)
- **ChatGPT:** fails to transpile due to `navigate to Result height weight gender` (missing commas) AND the callback invention syntax

Not run this round — the primary goal was the spec-propagation experiment. Left as a follow-up if end-to-end validation is needed.
