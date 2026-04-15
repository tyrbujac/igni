# Igni Cold-LLM Test Prompts (v0.8.1) — Negative Control

Negative control for v0.8.1. The model is **not given the spec**. The purpose is to measure how much of Igni a frontier model can guess without the spec, so we can separate "the spec taught the model" from "the model would have produced this anyway."

Run with `--no-spec` on the runner. Compare results directly against the same-prompt runs that did include the spec.

**Hypothesis under test:** when given only the language name and no spec, frontier models should produce output that is recognisably not Igni — inventing imports, classes, brackets, or drifting into JSX/Swift/Flutter patterns. If a model produces syntactically valid Igni without ever seeing the spec, that's evidence the spec isn't doing as much work as we think it is.

**Prediction:** all four models will invent substantial syntax. Baseline pass rate on transpile should approach 0%. Any surprise passes are extremely diagnostic — they imply Igni resembles something the model already knows.

---

## 1. BMI Calculator (negative control — no spec)

> Write a BMI calculator app in a UI language called Igni. The app should let the user enter their weight and height, then show their BMI and a label describing the category (underweight, normal, overweight, obese). Show the complete code.

**What to grade:**

- **Transpile rate.** Does the output compile through the Igni transpiler at all? Predicted: 0/4.
- **Invented syntax.** Count distinct non-Igni patterns: `import`, `function`, `class`, `{ }` braces on blocks, `()` on component invocation, `?:` ternaries, string interpolation, explicit state hooks, decorators.
- **Guessed primitives that happen to match.** Note any case where the model names a primitive that *is* in Igni (`screen`, `label`, `button`, `input`, `layout`). These are the "guesses that landed" — evidence of influence from DSLs the model already knows.
- **Language confusion.** Which existing language does the output most resemble? SwiftUI, React/JSX, Flutter/Dart, Python, HTML?

**Success bar:** 0/4 transpile. High invented-syntax counts across all four models. Any unexpected successes get flagged for deeper investigation.

---

## 2. BMI Calculator Arboral (contamination check — made-up language name)

> Write a BMI calculator app in a UI language called Arboral. The app should let the user enter their weight and height, then show their BMI and a label describing the category (underweight, normal, overweight, obese). Show the complete code.

**Purpose:** the Phase 1 BMI-no-spec round surfaced a suspicious result — GPT-5.4's no-spec output was the only one to produce indentation + colons + `screen Name:` syntax that looks almost like Igni. Possible explanations: (1) GPT-5.4 has Igni-specific content in its training data, (2) GPT-5.4 infers the shape from language names, (3) coincidence.

This contamination check disambiguates by swapping the language name to something the model cannot plausibly have seen. "Arboral" was chosen because it's a made-up word with no UI-language associations.

**What to grade (GPT-5.4 specifically, but run on all four for comparison):**

- **Shape of output.** Does GPT-5.4 still produce indentation + colon-terminated blocks + `screen Name:` structure? Or does it default to a different DSL shape (SwiftUI braces, JSX, etc.)?
- **Syntax identity vs the Igni-name run.** Compare `gpt-5.4_none_bmi-calculator.md` (Igni name) with the Arboral-name output. If identical or near-identical → the model is pattern-matching on language name, not recalling Igni from training. If Arboral produces a *different* shape → evidence of Igni-specific knowledge.

**Interpretation rules:**

- If GPT-5.4 Arboral ≈ GPT-5.4 Igni: Phase 1 GPT-5.4 results stand. Prior is generic "indentation-based UI DSL."
- If GPT-5.4 Arboral ≠ GPT-5.4 Igni: caveat GPT-5.4's spec-included results in the dissertation. The model may have prior knowledge of Igni that contaminates baseline measurements.
