# Igni Cold-LLM Test Prompts (v0.5.1)

The v0.5.1 round is the **first transpiler-validated test**. LLM output is graded twice: once against the spec (inventions, misuse, valid) and once against the transpiler (transpiles, runs in browser, errors). Transpiler errors directly prioritise what to build next.

The transpiler currently handles: `screen`, variables (int/String/bool), `layout` (vertical/horizontal, align, gap, padding), `label`, `button` + `on tap`, `input bind:` + `placeholder:`, `toggle bind:`, `if`/`else`/`else if`, `not`, arithmetic. Features NOT yet in the transpiler: `each`, functions, `navigate to`, `fetch`, `shared:`, components, `image`, `icon`, `is`/`is not`, `is empty`, string `+` concatenation in labels.

## How to use these prompts

**Paste the full contents of `spec/v0.5.1.md` FIRST, then paste one of these prompts BELOW it in the same chat message.** The prompt must be the most recent thing the model sees.

Each prompt ends with a "Respond with only the Igni code" directive. Don't remove it.

**After grading the output against the spec**, save the Igni code to a `.igni` file and run:

```bash
cd transpiler
npx tsx src/cli.ts <file>.igni
```

Record the transpiler result (success/error) in the test file alongside the spec grading.

---

## 1. Settings screen (transpiler-validated)

> Using only the Igni language spec above, write a Settings screen in Igni with: a username text field, an email text field, a dark mode toggle, a notifications toggle, and a "Save" button at the bottom.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** input binding (`input bind:`), toggle binding (`toggle bind:`), layout with multiple primitives, button with event handler. All features the transpiler supports.

**Why this prompt:** Deliberately scoped to what the transpiler can handle. No profile picture (would need `image`), no logout (would need `navigate to` or function calls). The goal is an end-to-end test: LLM writes Igni → transpiler produces Dart → app runs in the browser.

**Transpiler expectation:** If the LLM writes clean v0.5.1, this should transpile and run. Any transpiler failure is either a bug in the transpiler or a feature gap to close.

**Likely LLM behaviours to watch for:**
- Does the LLM use `bind:` correctly on input and toggle?
- Does it use `on tap:` on the button with an inline assignment, or does it try to call a function?
- Does it add `style:`, `color:`, or `placeholder:` properties correctly?
- Does it use `layout` with `gap:` and `padding:`?

---

## 2. Greeting screen (transpiler-validated, exercises conditionals)

> Using only the Igni language spec above, write a Greeting screen in Igni. It should have a text input for the user's name and a greeting below it. When the name field is not empty, show "Hello, " followed by the name. When the name field is empty, show "Type your name above" in a subtle style.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** input binding, `if`/`else` conditional rendering, `is empty`/`is not empty` conditions, string concatenation with `+` in labels. Tests whether LLMs produce code the transpiler can handle for conditionals.

**Transpiler expectation:** Will likely FAIL on `is not empty` (not yet in the transpiler) and string `+` in label display expressions. These failures are useful — they tell us what to add next.

**Why include a test that's expected to fail:** The failures are the data. If all three models use `is not empty`, that's the next transpiler feature to add. If they find a workaround the transpiler already handles, that's a finding about how LLMs navigate constraints.
