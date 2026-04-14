# BMI Calculator Cold Test Results

**Date:** 2026-04-14
**Models tested:** Claude Opus 4.6, ChatGPT 5.3, Gemini 3.1 Fast, Gemini 3.1 Pro
**Input:** v0.6.7.md (full spec)
**App:** BMI Calculator — two-screen body mass index calculator (Angela Yu Flutter Course #5)

## What BMI Calculator tests

Step up from previous cold tests. First time exercising these combinations:

- **Two-option mutually-exclusive selection** (gender cards) — requires conditional visual styling
- **+/- button counters** (weight, age) — repetitive UI that demands component extraction
- **Arithmetic formula** (`weight / (height/100)^2`) — multi-operator expression with parentheses
- **Multi-parameter navigation** (`navigate to Results height, weight, gender`) — only single-param shown in spec
- **Three-branch conditional styling** (underweight/normal/overweight with different colors + text)
- **Slider with non-default initial value** (height = 170) — spec only shows slider in reference table

## Headline result — 1/4 likely to transpile cleanly

| | Opus 4.6 | Gemini Flash | Gemini Pro | ChatGPT 5.3 |
|---|---|---|---|---|
| **Valid syntax** | Yes | No | Mostly | No |
| **Invented features** | None | None | None | `on decrement:` / `on increment:` custom events |
| **Gender component** | Duplicate layouts (if/else) | Variable for bg | Variable for bg | Variable for bg (+ indentation error) |
| **Counter component** | Wrapper with `body` | Wrapper with `body` | String-type dispatch | Invented callback events |
| **Multi-param nav** | Correct | Parens + dropped gender | Correct | Correct |
| **Slider** | Correct | Correct | Correct | Correct |
| **BMI formula** | `weight * 10000 / (height * height)` | Correct | Correct | Correct |
| **Conditional display** | if/if | if/else if | if/else if/else | if/else if |
| **Would transpile?** | Likely yes | No | Partially | No |

## The #1 finding — color-as-variable (3/4 models)

**Three of four models independently invented the same pattern:** storing a color token in a variable and using it in a property value:

```igni
# Gemini Flash:
status_color = green
# later:
label status, color: status_color

# Gemini Pro:
category_color = subtle
if bmi < 18.5:
  category_color = danger
# later:
label category, color: category_color

# ChatGPT:
color = green
# later:
label category, color: color
```

This is **undocumented** in the spec — color names are tokens, not values. The spec only shows conditional styling via `if`/`else` with separate render branches, which is what Opus used (correctly, verbosely):

```igni
# Opus — correct but verbose:
if category is "UNDERWEIGHT":
  label category, style: heading.small, color: danger
else if category is "NORMAL":
  label category, style: heading.small, color: green
else:
  label category, style: heading.small, color: orange
```

This is the strongest signal of the whole test. When 3/4 frontier models converge on the same invented pattern, the spec needs to either support it or explicitly document the alternative.

Same issue appears for `background:` — 3/4 wrote `bg = card` / `bg = brand` then `background: bg` for the gender card's selected state.

---

## Results by model

### Claude Opus 4.6 — strongest output, spec-correct

```igni
# ── Components ──

component GenderCard(icon_name, text, selected):
  if selected:
    layout vertical, align: center, padding: large, background: brand, rounded: medium:
      icon icon_name, size: 48, color: white
      label text, style: caption, color: white
  else:
    layout vertical, align: center, padding: large, background: card, rounded: medium:
      icon icon_name, size: 48
      label text, style: caption, color: subtle

component ValueSection(title, value):
  layout vertical, align: center, padding: medium, background: card, rounded: medium, gap: small:
    label title, style: caption, color: subtle
    label value, style: heading
    layout horizontal, gap: medium:
      body

# ── Input Screen ──

screen BMIInput, title: "BMI CALCULATOR":
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
    layout vertical, align: center, padding: medium, background: card, rounded: medium, gap: small:
      label "HEIGHT", style: caption, color: subtle
      layout horizontal, gap: small, align: center:
        label height, style: heading
        label "cm", style: body, color: subtle
      slider bind: height, min: 120, max: 220

    # Weight and Age side by side
    layout horizontal, gap: medium:
      layout vertical, fill: true:
        ValueSection "WEIGHT", weight:
          button "-", on tap: dec_weight()
          button "+", on tap: inc_weight()
      layout vertical, fill: true:
        ValueSection "AGE", age:
          button "-", on tap: dec_age()
          button "+", on tap: inc_age()

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to BMIResult height, weight, gender

  inc_weight():
    weight = weight + 1

  dec_weight():
    weight = weight - 1

  inc_age():
    age = age + 1

  dec_age():
    age = age - 1

# ── Results Screen ──

screen BMIResult(height, weight, gender), title: "BMI CALCULATOR":
  bmi = weight * 10000 / (height * height)

  category = "NORMAL"
  interpretation = "You have a normal body weight. Good job!"
  if bmi < 18.5:
    category = "UNDERWEIGHT"
    interpretation = "You have a lower than normal body weight. You can eat a bit more."
  if bmi >= 25:
    category = "OVERWEIGHT"
    interpretation = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, gap: large, padding: large, align: center, fill: true:
    label "Your Result", style: heading

    if category is "UNDERWEIGHT":
      label category, style: heading.small, color: danger
    else if category is "NORMAL":
      label category, style: heading.small, color: green
    else:
      label category, style: heading.small, color: orange

    label bmi, style: heading
    label interpretation, style: body, color: subtle, align: center

    button "RE-CALCULATE", on tap: navigate back
```

**Design decisions (Opus):**
- `ValueSection` uses `body` (wrapper pattern) rather than passing function references. Component handles shared visual structure; caller supplies buttons with their own handlers.
- `GenderCard` uses conditional `if`/`else` for the selected state since there's no conditional styling in Igni. Two full layout blocks is verbose but it's the only correct pattern per spec.
- `fill: true` wrappers around component invocations since `fill: true` is layout-only.
- BMI is `weight * 10000 / (height * height)` — algebraically equivalent to `weight / (height/100)^2` but avoids nested parentheses.
- `gender` passed but unused — "In a real app you might use it for interpretation text or an avatar."

**Grader notes:**
- Clean, spec-correct. Only concern: `size: 48` on icons — spec examples show design tokens (`size: large`). Numeric icon sizes may or may not be in the transpiler.
- Uses `if`/`if` (not `if`/`else if`) for category — works because conditions are mutually exclusive, but not idiomatic.

---

### Gemini 3.1 Fast — two spec violations + color-as-variable

```igni
screen Input, title: "BMI CALCULATOR":
  selected_gender = "male"
  height = 180
  weight = 60
  age = 25

  layout vertical, fill: true, gap: medium, padding: medium:
    # Gender Selection
    layout horizontal, gap: medium, fill: true:
      GenderCard "MALE", "male", selected_gender is "male", on tap: selected_gender = "male"
      GenderCard "FEMALE", "female", selected_gender is "female", on tap: selected_gender = "female"

    # Height Selection
    layout vertical, background: card, padding: medium, rounded: medium, align: center, gap: small:
      label "HEIGHT", style: caption
      label height + "cm", style: heading
      slider bind: height, min: 120, max: 220

    # Weight and Age Selection
    layout horizontal, gap: medium, fill: true:
      CounterSection "WEIGHT", weight:
        layout horizontal, gap: medium:
          icon "minus", size: 40, on tap: weight = weight - 1
          icon "plus", size: 40, on tap: weight = weight + 1

      CounterSection "AGE", age:
        layout horizontal, gap: medium:
          icon "minus", size: 40, on tap: age = age - 1
          icon "plus", size: 40, on tap: age = age + 1

    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Results(weight, height)

component GenderCard(text, icon_name, is_selected):
  bg = card
  if is_selected:
    bg = brand

  layout vertical, fill: true, align: center, padding: large, background: bg, rounded: medium:
    icon icon_name, size: 80, color: white
    label text, style: body, color: white

component CounterSection(title, value):
  layout vertical, fill: true, align: center, padding: medium, background: card, rounded: medium, gap: small:
    label title, style: caption
    label value, style: heading
    body

---

screen Results(weight, height), title: "BMI CALCULATOR":
  h_meters = height / 100
  bmi = weight / (h_meters * h_meters)

  status = "NORMAL"
  advise = "You have a normal body weight. Good job!"
  status_color = green

  if bmi < 18.5:
    status = "UNDERWEIGHT"
    status_color = danger
    advise = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    status = "OVERWEIGHT"
    status_color = orange
    advise = "You have a higher than normal body weight. Try to exercise more."

  layout vertical, fill: true, padding: medium, gap: medium:
    label "Your Result", style: heading

    layout vertical, fill: true, align: center, spread: true, background: card, padding: large, rounded: medium:
      label status, color: status_color, style: heading.small
      label bmi, style: heading
      label advise, style: body, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back
```

**Issues:**
- **`navigate to Results(weight, height)`** — parentheses on navigation. Clear spec violation. Also drops `gender`.
- **`---`** between screen definitions — markdown artifact, not valid Igni.
- **`status_color = green`** — color-as-variable (main finding).
- **`bg = card` / `bg = brand`** in GenderCard — same issue.
- `icon "minus"` / `icon "plus"` — names don't exist in Material Icons (should be `remove` / `add`).
- Height default 180 instead of 170 (minor).

---

### Gemini 3.1 Pro — architecturally interesting, same color gap

```igni
screen Input, title: "BMI CALCULATOR":
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large, fill: true:
    # Gender Cards
    layout horizontal, gap: medium:
      GenderCard "male", "MALE", gender is "male", on tap: gender = "male"
      GenderCard "female", "FEMALE", gender is "female", on tap: gender = "female"

    # Height Slider
    layout vertical, padding: large, background: card, rounded: medium, align: center:
      label "HEIGHT", style: body, color: subtle
      layout horizontal, align: center, gap: small:
        label height, style: heading
        label "cm", style: body
      slider bind: height, min: 120, max: 220

    # Weight and Age Counters
    layout horizontal, gap: medium:
      CounterSection "WEIGHT", weight, "weight"
      CounterSection "AGE", age, "age"

    # Empty layout to push the button to the bottom
    layout vertical, fill: true

    button "CALCULATE YOUR BMI", color: brand, on tap: calc()

  calc():
    navigate to Results height, weight, gender

  increment(type):
    if type is "weight":
      weight = weight + 1
    else if type is "age":
      age = age + 1

  decrement(type):
    if type is "weight":
      weight = weight - 1
    else if type is "age":
      age = age - 1

component GenderCard(icon_name, label_text, is_selected):
  bg = card
  if is_selected:
    bg = brand

  layout vertical, padding: large, background: bg, rounded: medium, align: center, fill: true:
    icon icon_name, size: large
    label label_text, style: body, color: subtle

component CounterSection(title, value, type):
  layout vertical, padding: large, background: card, rounded: medium, align: center, fill: true:
    label title, style: body, color: subtle
    label value, style: heading
    layout horizontal, gap: medium:
      icon "minus", size: large, color: brand, on tap: decrement(type)
      icon "plus", size: large, color: brand, on tap: increment(type)

screen Results(height, weight, gender), title: "BMI CALCULATOR":
  height_m = height / 100
  bmi = weight / (height_m * height_m)

  category = ""
  category_color = subtle
  interpretation = ""

  if bmi < 18.5:
    category = "UNDERWEIGHT"
    category_color = danger
    interpretation = "You have a lower than normal body weight. You can eat a bit more."
  else if bmi >= 25:
    category = "OVERWEIGHT"
    category_color = orange
    interpretation = "You have a higher than normal body weight. Try to exercise more."
  else:
    category = "NORMAL"
    category_color = green
    interpretation = "You have a normal body weight. Good job!"

  layout vertical, gap: medium, padding: large, fill: true:
    label "Your Result", style: heading

    layout vertical, padding: large, background: card, rounded: medium, align: center, fill: true, spread: true:
      label category, color: category_color
      label bmi, style: heading
      label interpretation, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back
```

**Issues:**
- **`category_color = subtle/danger/green/orange`** — color-as-variable (main finding).
- **`bg = card` / `bg = brand`** — same issue.
- Empty `layout vertical, fill: true` as spacer — creative, might work (empty blocks were fixed for Xylophone).
- `icon "minus"` / `icon "plus"` — same naming issue.

**Interesting:** cross-component function calls with string dispatch (`increment(type)` / `decrement(type)`) — valid per spec ("a child component can call functions defined in that screen's body").

---

### ChatGPT 5.3 — weakest, invented syntax

```igni
screen Input, title: "BMI CALCULATOR":
  gender = "male"
  height = 170
  weight = 60
  age = 25

  layout vertical, gap: medium, padding: large:

    # Gender selection
    layout horizontal, gap: medium:
      GenderCard "MALE", "male", gender, on tap: gender = "male"
      GenderCard "FEMALE", "female", gender, on tap: gender = "female"

    # Height
    layout vertical, background: card, padding: medium, rounded: medium, align: center:
      label "HEIGHT", color: subtle
      label height + " cm", style: heading
      slider bind: height, min: 120, max: 220

    # Weight + Age side by side
    layout horizontal, gap: medium:
      StepperCard "WEIGHT", weight, on decrement: weight = weight - 1, on increment: weight = weight + 1
      StepperCard "AGE", age, on decrement: age = age - 1, on increment: age = age + 1

    # Calculate button
    button "CALCULATE YOUR BMI", color: brand, on tap: navigate to Result height, weight, gender


screen Result(height, weight, gender), title: "BMI CALCULATOR":
  h = height / 100
  bmi = weight / (h * h)

  category = "NORMAL"
  message = "You have a normal body weight. Good job!"
  color = green

  if bmi < 18.5:
    category = "UNDERWEIGHT"
    message = "You have a lower than normal body weight. You can eat a bit more."
    color = danger
  else if bmi >= 25:
    category = "OVERWEIGHT"
    message = "You have a higher than normal body weight. Try to exercise more."
    color = orange

  layout vertical, gap: large, padding: large:

    label "Your Result", style: heading

    layout vertical, background: card, padding: large, rounded: medium, align: center, gap: medium:
      label category, color: color
      label bmi, style: heading
      label message, align: center

    button "RE-CALCULATE", color: brand, on tap: navigate back


component GenderCard(label_text, value, selected):
  bg = card
  if selected is value:
bg = blue

  layout vertical, background: bg, padding: medium, rounded: medium, align: center, gap: small:
    if value is "male":
      icon "male", size: large
    else:
      icon "female", size: large
    label label_text


component StepperCard(title, value):
  layout vertical, background: card, padding: medium, rounded: medium, align: center, gap: small:
    label title, color: subtle
    label value, style: heading

    layout horizontal, gap: small:
      button "-", on tap: decrement()
      button "+", on tap: increment()

  decrement():
    on decrement

  increment():
    on increment
```

**Issues:**
- **Invented `on decrement:` / `on increment:` events** — not in spec. Only `on tap:`, `on touch:`, `on change:` exist.
- **Invented callback body** — `decrement(): on decrement` is meaningless in Igni.
- **Indentation error** — `bg = blue` not indented under the `if` in GenderCard.
- **Variable named `color`** shadows the `color:` property name.
- Color-as-variable (`color = green` / `color = danger` / `color = orange`).

---

## Cross-model patterns

| Finding | Signal |
|---------|--------|
| **Slider `bind:`** — 4/4 correct, all declared variable first then bound | Doc gap (slider initial value example missing) was a non-issue. Models infer this. |
| **Multi-param navigation** — 3/4 correct syntax, 1/4 used parens | Single-param spec example sufficient for most models. Gemini Flash is the outlier. |
| **Color-as-variable** — 3/4 independently invented `bg = card` / `status_color = green` | **Strongest signal. Spec needs to support this or explicitly document the workaround.** |
| **BMI formula** — 4/4 algebraically correct | Arithmetic docs solid. Opus's `weight * 10000 / (height * height)` was the cleanest. |
| **Component extraction** — 4/4 extracted gender card, 4/4 attempted counter | Prompt worked. |
| **Icon names** — 2/4 used `"minus"`/`"plus"` (not Material icon names) | Runtime issue, not spec. But worth noting. |
| **Empty layout as spacer** — 1/4 (Pro) | Interesting, not established pattern. |
| **String dispatch across components** — 1/4 (Pro) | Creative use of the cross-component function rule. |

---

## Implications for v0.7

**Top priority: color/background token assignability** (3/4 signal, highest in any cold test for a styling issue). See ROADMAP.md Stream 3.

**Secondary signals:**
- **Multi-param navigation example** — 1/4 got it wrong. Could add one line example to spec, low cost.
- **No conditional-expression syntax** — models don't try ternary in property values, they reach for variable-assignment instead. Confirms no need for `property: if cond then x else y`.
- **Round/format number** — 0/4 tried to round BMI. They all display raw decimal. No signal to add rounding primitives yet.

---

## Transpiler validation (Opus output)

Tested Opus's output against the current transpiler. **Three significant bugs found.**

### Bug 1 — Wrapper component with 2+ positional args + body colon

```igni
ValueSection "WEIGHT", weight:
  button "-", on tap: dec_weight()
```

**Error:** `Unexpected token: "\n"` at `ValueSection "WEIGHT", weight:`

The parser sees `weight:` and thinks it's starting a named argument (expecting a value after the colon), but hits the newline. The ambiguity: is `identifier:` at end-of-invocation a named arg, or the body-opening colon?

Workaround: `ValueSection "WEIGHT", value: weight:` (last arg becomes named). Existing example `dashboard.igni` works because it has `icon_name: "users":` as the last arg.

**Fix direction:** parser needs to detect that `identifier:` at end-of-line (with nothing after the colon on the same line) is the body-opening colon, not a named arg.

### Bug 2 — Multi-param navigation

```igni
navigate to BMIResult height, weight, gender
```

**Error:** `Expected ":", got ","` after `height`.

Looking at the AST/parser:

```typescript
// parser.ts:582-602
private parseNavigate(): NavigateTo | NavigateBack {
  // ...
  let arg: Expr | null = null;  // Only ONE arg allowed
  if (!newline/comma/EOF) {
    arg = this.parseExpr();
  }
  return { type: 'NavigateTo', screen, arg };
}
```

```typescript
// ast.ts:116-120
export interface NavigateTo {
  type: 'NavigateTo';
  screen: string;
  arg: Expr | null;  // Single arg only
}
```

**Fix direction:** change `arg: Expr | null` to `args: Expr[]`, update parser to read comma-separated args, update codegen to emit multiple constructor arguments. Non-trivial but bounded.

**Workaround:** pass all data in a single object literal: `navigate to BMIResult {height: height, weight: weight, gender: gender}`. Works today.

### Bug 3 — if/else with sibling layouts at component body root (CRITICAL)

```igni
component GenderCard(icon_name, text, selected):
  if selected:
    layout vertical, background: brand, ...:
      ...
  else:
    layout vertical, background: card, ...:
      ...
```

The parser accepts this. The codegen produces **invalid Dart**:

```dart
return if (selected) ...[
  Container(...),
] else ...[
  Container(...),
];
```

Flutter compile errors:
- `Expected an identifier, but got 'if'`
- `Expected ';' after this`
- `Expected an identifier, but got '...'`

The spread-if syntax `...[if (cond) Widget else Widget]` only works inside list literals. You can't `return` a spread-if.

**Why this matters:** This is the *only* spec-correct pattern for conditional styling. Opus used it deliberately because color tokens aren't assignable to variables. The transpiler can't handle the one pattern the spec endorses for this use case.

**Fix direction:** codegen should detect `if/else` at component body root and emit a Dart ternary or conditional `return`, not a spread-if. Something like:
```dart
if (selected) {
  return Container(...);
}
return Container(...);
```

Or inline ternary for the Widget return.

**Interaction with the color-as-variable finding:** Bug 3 + the color-as-variable gap together mean Igni currently has **no working pattern for conditional styling**. Either color tokens need to become assignable (supporting the pattern 3/4 models invented), or the transpiler needs to fix Bug 3 (supporting the pattern Opus used). Preferably both.

### Summary

| Bug | Severity | Fix complexity | Status |
|-----|----------|---------------|--------|
| 1. Wrapper component 2+ positional args | Medium (workaround exists) | Small parser change | Open |
| 2. Multi-param navigation | High (intuitive pattern) | Small-medium (AST, parser, codegen) | Open |
| 3. if/else at component body root | **Critical** (blocks conditional styling) | Medium codegen change | **FIXED 2026-04-14** |
| 4. Icon name through component param | High (blocks icon-heavy components) | Runtime icon lookup in codegen | Newly discovered |

### Bug 3 fix (2026-04-14)

Added `genComponentBodyReturn()` / `genRootConditionalReturn()` / `genBranchReturn()` helpers in `codegen.ts`. Component `build()` now emits sequential conditional returns instead of spread-if when the root is an If node:

```dart
@override
Widget build(BuildContext context) {
  if (selected) {
    return Container(...);  // brand background
  }
  return Container(...);  // card background
}
```

All 27 existing diff tests still pass. Flutter build of BMI succeeds (18s first build, no Dart compile errors). Spec-correct conditional styling via `if/else` at component root now transpiles and runs.

### Bug 4 — Icon name through component parameter — **FIXED 2026-04-14**

Revealed after Bug 3 was fixed. The GenderCard component accepts `icon_name` as a param and renders `icon icon_name`. Before the fix, the codegen emitted:

```dart
Icon(icon_name, size: 48, ...)
```

But `icon_name` is a String at runtime, and Flutter's `Icon()` constructor expects `IconData`. Runtime TypeError.

**Fix:** extracted the existing `mapIconName` data into a shared `ICON_MAP`. Added `generateIconLookupHelper()` which emits a Dart function:

```dart
IconData _iconFromName(dynamic name) {
  if (name is IconData) return name;
  switch (name as String) {
    case 'play': return Icons.play_arrow;
    // ...
    case 'male': return Icons.male;
    case 'female': return Icons.female;
    default: return Icons.help_outline;
  }
}
```

`genIcon` now wraps non-literal names with `_iconFromName(...)`. A `needsIconLookup` flag tracks whether the helper should be emitted (only when at least one dynamic icon ref exists). Added `male`, `female`, `minus`, `remove`, `add` to the icon map while fixing this (signals from the cold test).

The `dashboard.expected.dart` was updated to reflect the new, correct output — the previous version had a latent runtime bug that the diff test didn't catch.

### Bug 2 — Multi-param navigation — **FIXED 2026-04-14**

Changed `NavigateTo.arg: Expr | null` → `args: Expr[]` in the AST. Parser now reads comma-separated args after the screen name. Codegen generates all of them as named constructor arguments:

```dart
// Before (only one arg supported):
Navigator.push(context, MaterialPageRoute(builder: (context) => ResultsScreen(height: height)));

// After (all three):
Navigator.push(context, MaterialPageRoute(builder: (context) => ResultsScreen(height: height, weight: weight, gender: gender)));
```

Extracted the ctor-args construction into a `genNavigateCtorArgs` helper used by all three codegen sites that render NavigateTo (case 'NavigateTo' in genStmt, and the two event-handler variants in genOnPressed/genChangeActionBody).

### Bonus fix — Binary expression parenthesisation

Discovered while testing Bug 2 end-to-end: `weight * 10000 / (height * height)` in Igni was being emitted as `weight * 10000 / height * height` in Dart — the author's grouping was being lost. Dart's left-to-right evaluation turned it into `((weight * 10000) / height) * height = weight * 10000`, producing completely wrong BMI values.

Root cause: `exprToDart` for `BinaryExpr` never emitted parens for nested binary subexpressions. The AST preserved grouping via tree structure, but the flat printed form discarded it.

Added precedence-aware parenthesisation: paren a subexpression only when its precedence is lower than the parent, or (for non-associative right operands like `-` and `/`) when it's equal. Simple chains like `a + b + c` stay clean; `a / (b * c)` now correctly prints `a / (b * c)`.

All 27 diff tests still pass (no cosmetic paren changes needed).

### Bug 1 — Wrapper component with 2+ positional args — **FIXED 2026-04-14**

```igni
ValueSection "WEIGHT", weight:
  button "-", on tap: dec_weight()
```

Before: parser saw `weight:` after a comma, assumed it was starting a named argument, tried to parse `parseProperty()` which expected a value after the colon, hit a newline, errored.

Fix: added a lookahead in the comma-separated args loop of `parseComponentInvocation`. When we see `identifier : newline`, treat `identifier` as a positional arg and leave the colon for the body-opening check. When we see `identifier : value` (non-newline), it's still a named arg.

```typescript
} else if (
  this.check(TokenType.Identifier) &&
  this.peek(1)?.type === TokenType.Colon &&
  this.peek(2)?.type !== TokenType.Newline  // new guard
) {
  properties.push(this.parseProperty());
}
```

One token of extra lookahead (`peek(2)`) — cheap and unambiguous.

### Final status

| Bug | Fix | Test result |
|-----|-----|-------------|
| 1. Wrapper 2+ positional args | **Fixed** | 27/27 diff tests pass, native `ValueSection "WEIGHT", weight:` syntax works |
| 2. Multi-param navigation | **Fixed** | 27/27 diff tests pass |
| 3. if/else at component body root | **Fixed** | 27/27 diff tests pass, Flutter build succeeds |
| 4. Icon name through component param | **Fixed** | 27/27 diff tests pass, no more runtime icon TypeError |
| 5. Binary expression parens (discovered) | **Fixed** | BMI formula now correct |

**End-to-end status for Opus's BMI output (no workarounds — using the original verbatim output):**
- Igni source → Dart: succeeds
- Dart → Flutter web build: succeeds (~17s)
- Runtime: Flutter layout constraint error in box.rendering — **separate from transpiler**, stems from Opus's nested `fill: true` layouts creating unbounded constraints

**The transpiler side of the cold-test loop is fully closed.** Every transpiler bug surfaced by the BMI cold test is fixed, and Opus's output now transpiles verbatim with no modifications.

### Runtime layout diagnosis

After fixing all five transpiler bugs, a runtime layout error still occurs on first render. Direct `flutter run` output reveals the specific widget chain:

```
SizedBox ← Column ← Row ← Column ← Center ← Padding ← Padding ← DecoratedBox ← Container ← ValueSection ← Column ← Expanded
constraints: BoxConstraints(unconstrained)
additionalConstraints: BoxConstraints(w=Infinity, 0.0<=h<=Infinity)
```

The crashing widget is a `SizedBox(width: double.infinity, child: ElevatedButton)` — Igni's default button rendering for buttons outside horizontal layouts (makes them full-width). It's inside a Column that's inside a Row with no Expanded — so the Row has unconstrained width and the `width: infinity` has no anchor.

**Two transpiler-level improvements applied while diagnosing:**
1. `unwrapScreenRootExpanded` — strips the outer `Expanded(...)` when `fill: true` is on a screen's root layout. `Expanded` can't be a Scaffold body (must live inside a Flex parent). The Scaffold body already fills available space, so the wrapper is redundant.
2. `CrossAxisAlignment.stretch` now only emits for vertical layouts with fill children. Previously it was also emitted for horizontal layouts, creating circular constraint dependencies between Row height and Column children.

Both are correct transpiler changes. All 27 diff tests still pass.

**Why the runtime error persists:** Opus's code has `layout horizontal, gap: medium: body` inside ValueSection. The `body` slot in Igni always wraps the caller's content in a Column. The caller's content includes buttons, which default to full-width `SizedBox(width: double.infinity)`. So you get:

```
Row (unconstrained width) > Column (body wrapper) > SizedBox(width: infinity)
```

The SizedBox crashes because its requested infinite width has no parent width to anchor to.

**This isn't a single transpiler bug but a semantic mismatch** between:
- The `body` slot always wrapping in a Column (not splitting as siblings)
- Buttons defaulting to full-width outside horizontal contexts
- Opus's pattern of using `body` inside a horizontal layout

Resolving it needs a design decision (how should `body` interact with a horizontal parent? Should buttons be context-aware for width?). Deferred to v0.7 design work — noted as a v0.7 candidate in the ROADMAP.

The BMI end-to-end test isn't blocked on transpiler correctness anymore; it's blocked on language design around `body` + horizontal layouts + default button widths.
