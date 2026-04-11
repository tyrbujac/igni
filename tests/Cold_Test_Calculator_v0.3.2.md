# Cold-LLM Test: Calculator (Igni v0.3.2)

**Spec version tested:** Igni v0.3.2
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `tests/prompts.md` → Calculator

## The prompt

> Using only the Igni language spec above, write a basic four-function calculator in Igni. It should have a display showing the current value, digit buttons 0-9, operator buttons (+, -, ×, ÷), an equals button, and a clear button.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Calculator:
  display = "0"
  left = 0
  op = ""
  reset_next = false

  layout vertical, gap: small, padding: large, align: center:
    label display, style: heading

    layout horizontal, gap: small:
      button "7", on tap: digit("7")
      button "8", on tap: digit("8")
      button "9", on tap: digit("9")
      button "÷", color: brand, on tap: set_op("÷")

    layout horizontal, gap: small:
      button "4", on tap: digit("4")
      button "5", on tap: digit("5")
      button "6", on tap: digit("6")
      button "×", color: brand, on tap: set_op("×")

    layout horizontal, gap: small:
      button "1", on tap: digit("1")
      button "2", on tap: digit("2")
      button "3", on tap: digit("3")
      button "-", color: brand, on tap: set_op("-")

    layout horizontal, gap: small:
      button "0", on tap: digit("0")
      button "C", color: danger, on tap: clear()
      button "=", color: brand, on tap: evaluate()
      button "+", color: brand, on tap: set_op("+")

  digit(d):
    if reset_next:
      display = d
      reset_next = false
    else if display is "0":
      display = d
    else:
      display = display + d

  set_op(new_op):
    left = to_number(display)
    op = new_op
    reset_next = true

  evaluate():
    right = to_number(display)
    if op is "+":
      display = to_string(left + right)
    else if op is "-":
      display = to_string(left - right)
    else if op is "×":
      display = to_string(left * right)
    else if op is "÷":
      display = to_string(left / right)
    op = ""
    reset_next = true

  clear():
    display = "0"
    left = 0
    op = ""
    reset_next = false
```

### Grading

- **Invented syntax not in the spec?** **Yes — five things:** `-`, `*`, `/` (arithmetic operators), `to_number()`, `to_string()` (type conversion functions). **Notably did NOT invent `==`** — instead, Claude reached for `is` and used `display is "0"`, `op is "+"`, etc., extending the existing `is empty` / `is loading` pattern to general equality.
- **Used existing syntax wrong?** **Borderline:** the `is X` for arbitrary equality isn't strictly in the v0.3.2 spec (only `is empty` / `is loading` / `is error` are defined). Counts as a *natural extension* of existing syntax rather than an invention — Claude inferred the right design from the existing pattern.
- **Valid Igni on first try?** **No.** Structure is clean and the `is` extension is the right design direction, but `-`, `*`, `/`, `to_number`, `to_string` are undefined.
- **Line count:** ~64 lines.

### Notes

Claude's design strategy is fundamentally different from Gemini's — and the difference is informative.

- **String-typed `display`.** Claude treats `display` as a string ("0") and converts to numbers only for arithmetic via invented `to_number()` / `to_string()`. This mirrors how a real calculator's display works (you type digits as characters), but it forces the type-conversion gap that Gemini's numeric-display approach avoided entirely.
- **Reached for `is` to express equality.** This is the single most valuable finding so far. The spec defines `is empty`, `is loading`, `is error` — Claude generalised this to `is "0"`, `is "+"`, `is "-"` etc. **This is exactly the cheapest fix in the v0.4 backlog**, and Claude found it from the spec alone with no prompting. It means `is X` is a *discoverable* extension — frontier models can find it without being told.
- **Visual styling.** Claude added `color: brand` and `color: danger` to operator and clear buttons. Both are valid spec usage and produce a more polished result than Gemini's monochrome buttons.
- **Small chained-operator bug:** `set_op` doesn't call `evaluate()` first when there's already a pending operator. So pressing `5 + 3 +` would lose the `5`. This is a logic bug, not a language gap — both are equally valid evidence about Claude's reasoning, but only the language gaps feed v0.4.
- **No divide-by-zero guard.** Gemini included one; Claude didn't.

---

## Gemini

**Model version:** Gemini 3.1 Pro
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration, code only — the "Respond with only the Igni code" directive worked.

### Output

```igni
screen Calculator:
  display = 0
  previous = 0
  operator = ""
  waiting = false

  layout vertical, padding: large, gap: medium, align: center:
    label display, style: heading

    layout horizontal, gap: small:
      button "7", on tap: digit(7)
      button "8", on tap: digit(8)
      button "9", on tap: digit(9)
      button "÷", on tap: set_op("÷")

    layout horizontal, gap: small:
      button "4", on tap: digit(4)
      button "5", on tap: digit(5)
      button "6", on tap: digit(6)
      button "×", on tap: set_op("×")

    layout horizontal, gap: small:
      button "1", on tap: digit(1)
      button "2", on tap: digit(2)
      button "3", on tap: digit(3)
      button "-", on tap: set_op("-")

    layout horizontal, gap: small:
      button "C", on tap: clear()
      button "0", on tap: digit(0)
      button "=", on tap: calc()
      button "+", on tap: set_op("+")

  digit(d):
    if waiting:
      display = d
      waiting = false
    else if display == 0:
      display = d
    else:
      display = display * 10 + d

  set_op(op):
    if not waiting and operator != "":
      calc()
    previous = display
    operator = op
    waiting = true

  calc():
    if operator == "+":
      display = previous + display
    else if operator == "-":
      display = previous - display
    else if operator == "×":
      display = previous * display
    else if operator == "÷":
      if display == 0:
        display = 0
      else:
        display = previous / display

    operator = ""
    waiting = true

  clear():
    display = 0
    previous = 0
    operator = ""
    waiting = false
```

### Grading

- **Invented syntax not in the spec?** **Yes — five operators:** `==`, `!=`, `-`, `*`, `/`. The spec defines `+` for both concatenation and numeric addition (Counter example) but says nothing about other arithmetic or comparison operators.
- **Used existing syntax wrong?** **One subtle case:** `operator != ""` should have been `not operator is empty` per the spec's `is empty` pattern. Counts as both an invention (`!=`) and a missed reach for the existing idiom.
- **Valid Igni on first try?** **No.** Structure is valid; the expression layer uses undefined operators.
- **Line count:** ~63 lines including blanks.

### Notes

- **Numeric `display`** — Gemini sidestepped the predicted "number vs string" gap by making `display` a number throughout and trusting `label` to render it. This is the simpler design path.
- **Functions inside `screen` close over state** — `digit`, `set_op`, `calc`, `clear` all defined inside `screen Calculator` and freely mutating screen state. The v0.3.1 functions-inside-screens rule landed cleanly.
- **`if` / `else if` / `else` chains** used correctly throughout — including a nested chain inside `calc()`.
- **Calculator logic is correct** — handles chained operators (pressing `+` then `-` calls `calc()` first), tracks the "waiting for new input" state, and guards against divide-by-zero (the only model that did).

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Calculator:
  current = 0
  stored = 0
  operator = ""
  inputting = false

  layout vertical, gap: medium, padding: large:
    label current, style: heading

    layout vertical, gap: small:
      layout horizontal, gap: small:
        button "7", on tap: press_digit(7)
        button "8", on tap: press_digit(8)
        button "9", on tap: press_digit(9)
        button "÷", on tap: set_op("divide")

      layout horizontal, gap: small:
        button "4", on tap: press_digit(4)
        button "5", on tap: press_digit(5)
        button "6", on tap: press_digit(6)
        button "×", on tap: set_op("multiply")

      layout horizontal, gap: small:
        button "1", on tap: press_digit(1)
        button "2", on tap: press_digit(2)
        button "3", on tap: press_digit(3)
        button "-", on tap: set_op("subtract")

      layout horizontal, gap: small:
        button "0", on tap: press_digit(0)
        button "C", on tap: clear()
        button "=", on tap: compute()
        button "+", on tap: set_op("add")

  press_digit(d):
    if inputting:
      current = current * 10 + d
    else:
      current = d
      inputting = true

  set_op(op):
    stored = current
    operator = op
    inputting = false

  compute():
    if operator:
      if operator is "add":
        current = stored + current
      else if operator is "subtract":
        current = stored - current
      else if operator is "multiply":
        current = stored * current
      else if operator is "divide":
        current = stored / current
    operator = ""
    inputting = false

  clear():
    current = 0
    stored = 0
    operator = ""
    inputting = false
```

### Grading

- **Invented syntax not in the spec?** **Yes — four things:** `-`, `*`, `/` (arithmetic) and `if operator:` (truthiness coercion of a non-empty string as a boolean). **Notably did NOT invent `==`** — used `operator is "add"`, `operator is "subtract"` etc., extending `is` syntax just like Claude did.
- **Used existing syntax wrong?** **One case:** `if operator:` treats a string variable as a boolean. The spec only shows boolean variables in conditionals (`if user.online`, `if logged_in and verified`) — bare strings as truthiness checks aren't sanctioned. Should have been `if not operator is empty:` or similar.
- **Valid Igni on first try?** **No.** Same root issue as the other two models — undefined arithmetic operators — plus the truthiness coercion.
- **Line count:** ~62 lines including blanks.

### Notes

- **Numeric `current`** — same approach as Gemini, sidestepping the type-conversion gap that Claude hit.
- **`is` for equality** — same as Claude. Two out of three models naturally extended the `is empty` pattern.
- **Named operators** ("add", "subtract", "multiply", "divide") instead of symbols. Stylistic choice; less elegant than Claude or Gemini's `"+"`/`"-"` but fully valid.
- **Nested `layout vertical` inside the parent vertical** for the keypad. Unnecessary visual grouping but not wrong.
- **Same chained-operator bug as Claude** — `set_op` doesn't call `compute()` first when there's already a pending operator.
- **No divide-by-zero guard** (only Gemini included one).

---

## Gaps observed (across all three models)

This is the cross-model synthesis. **Universal gaps** (all 3 models hit them) are highest priority for v0.4. Gaps that only one model hit are lower priority unless they reveal a fundamental ambiguity.

### The cross-model gap matrix

| Gap                              | Gemini 3.1 Pro | Claude Opus 4.6 | ChatGPT (free) | Universality |
|----------------------------------|----------------|------------------|----------------|--------------|
| `-`, `*`, `/` arithmetic         | invented       | invented         | invented       | **3/3**      |
| Operator precedence              | needs it       | needs it         | needs it       | **3/3**      |
| Equality syntax                  | invented `==`  | inferred `is X`  | inferred `is X`| **3/3 need it; 2/3 found `is`** |
| Inequality                       | invented `!=`  | n/a              | n/a            | only Gemini  |
| Type conversion (`to_number` etc)| n/a            | invented         | n/a            | only Claude  |
| Truthiness coercion (`if str:`)  | n/a            | n/a              | invented       | only ChatGPT |

### Universal gaps (highest priority for v0.4)

1. **Arithmetic operators `-`, `*`, `/`.** All three models invented all three. **Three budget items, no clever alternative.** The spec defines `+` (for both concatenation and numeric addition) but says nothing else. Adding `-`, `*`, `/` is a forced move.

2. **Operator precedence.** All three models wrote expressions like `current * 10 + d` and `previous + display * 10` that depend on standard precedence. The spec doesn't say which operator binds tighter. **Fix:** one sentence — *"Standard mathematical precedence: `*` and `/` bind tighter than `+` and `-`. Use parentheses for grouping in expressions."* Worth disambiguating that the existing "no parentheses" rule applies to **component invocation**, not **expression grouping**.

3. **Equality (and the `is` extension is the right answer).** All three needed equality. But **two out of three models naturally extended `is`** to general equality (`display is "0"`, `op is "+"`, `operator is "add"`). Only Gemini reached for `==`. **This is a slam dunk for the `is X` extension** — the design is *already discoverable* from the existing `is empty` / `is loading` pattern, so it costs zero new keywords AND doesn't require special documentation. Frontier models can find it on their own. **Bless `is X` for arbitrary equality in v0.4** and skip `==`/`!=` entirely.

### Single-model gaps (lower priority)

4. **Type conversion functions (`to_number`, `to_string`).** Only Claude needed these, because it was the only model that chose a string-typed display. Gemini and ChatGPT both used a numeric `current`/`display` and let `label` render it. **Resolution:** add a one-line note to the spec that primitives like `label` accept numeric values and render them as text (which the Counter example *already* relies on but doesn't state explicitly). This nudges future models toward the simpler numeric approach and makes the type-conversion gap unnecessary.

5. **Truthiness coercion (`if operator:`).** Only ChatGPT did this. The spec only shows boolean variables in conditionals. **Resolution:** add one sentence — *"Conditionals require explicit boolean values. Use `is empty` / `is not empty` for string and list checks rather than passing the variable directly."*

6. **Inequality (`!=`).** Only Gemini invented this, and only because it was using `==` rather than `is`. If `is X` is blessed in v0.4, the inequality form is `not X is Y` (or `X is not Y`), which falls out for free.

### Predicted gaps that did NOT surface

- **Number vs string** — predicted to bite, but only Claude hit it (and only because of its design choice). Two out of three models avoided it entirely. Lower priority than expected; resolved by the "label auto-converts numeric values" note in #4.
- **Grid layout** — all three models happily nested horizontal layouts inside a vertical. Stayed within depth limit. **The `layout grid` proposal is unjustified by this test.** Don't add it.

### v0.4 patch (grounded in this test)

If v0.4 adds the following, **all three model outputs above would compile** (modulo the small logic bugs in the calculator state machines, which aren't language issues):

1. Arithmetic operators: `-`, `*`, `/`.
2. Operator precedence rule (one sentence).
3. `is X` for arbitrary equality (extending the existing `is empty` / `is loading` pattern).
4. One-line note: "primitives like `label` render numeric values as text" (formalises existing behaviour, makes type conversion unnecessary).
5. One-line note: "conditionals require explicit boolean values; use `is empty` / `is not empty` for string and list checks."

That's **3 new operators + 4 sentences of clarification.** Spec budget impact: very small. The whole patch is grounded in three independent empirical data points.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls. This is the "design by trying" data point — your gaps and the LLMs' gaps should mostly overlap.

```igni
(paste your hand-written attempt here)
```
