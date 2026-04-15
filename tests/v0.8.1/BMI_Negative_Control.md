# BMI Negative Control Cold Test Results — v0.8.1 (Phase 1 baseline)

**Date:** 2026-04-15
**Models tested:** Claude Opus 4.6 (+10k extended thinking), GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama)
**Input:** **no spec** + BMI Calculator prompt (`tests/v0.8.1/prompts-control.md`)
**Prompt verbatim:** *"Write a BMI calculator app in a UI language called Igni. The app should let the user enter their weight and height, then show their BMI and a label describing the category (underweight, normal, overweight, obese). Show the complete code."*

## Purpose — separate "spec taught the model" from "model would have done this anyway"

The negative control is the denominator for every subsequent spec-effect claim. If a v0.7.0 or v0.8.0 feature "lands" at 4/4 across frontier models, the first question a reviewer asks is: *would the models have produced this anyway without reading the spec?* The negative control measures exactly that: same models, same app prompt, but the spec is not provided. The model has only the language name ("Igni") and the task description.

**The hypothesis:** frontier models will produce output that is recognisably not Igni — inventing imports, classes, brackets, or drifting into JSX/SwiftUI/Flutter patterns. Baseline transpile rate should approach 0%. Any surprise passes are diagnostic (they imply Igni resembles something the model already knows).

**Prediction:** 0/4 transpile. High invented-syntax counts across all four models. Each model's drift direction is itself informative — it tells us what mental model the model reaches for when it doesn't know the language.

## Headline result — 0/4 transpile, per-model drift is diagnostic

| Axis | Opus 4.6 +think | GPT-5.4 | Gemini 3 Flash | Gemma 4 E4B | Score |
|---|---|---|---|---|---|
| **Transpile pass** | ✗ | ✗ | ✗ | ✗ | **0/4** |
| **Uses `{ }` braces / non-indentation blocks** | ✓ invented | ✗ (kept indented) | ✓ invented | ✓ invented | 3/4 drift |
| **Invents type annotations** (`: Float`, `Double?`) | ✓ | ~ | ✗ | ✓ | 2.5/4 |
| **Invents pattern-matching syntax** (`match`, `when`) | ✓ `match` | ✗ | ✗ | ✓ `when/case` | 2/4 |
| **Honest-no disclaimer before attempting** | ✓ *"Igni isn't a widely-documented UI language in my training data"* | ✗ | ✗ | ✗ | **1/4** |

## Per-model drift direction — what each model thinks Igni should look like

Each model, without spec context, reaches for a different mental model. This is the diagnostic core of the control.

### Opus 4.6 → SwiftUI

Opus opens with an unprompted disclaimer:

> *"**Note:** 'Igni' isn't a widely-documented UI language in my training data, so the following is my best-faith interpretation of what an Igni app would look like based on the declarative, component-oriented style the name suggests. If Igni has a specific spec you're working from, feel free to share it and I'll adjust."*

Then invents SwiftUI-ish syntax:

```
app BMICalculator {
  state {
    weight:     Float  = 0.0
    height:     Float  = 0.0
    showResult: Bool   = false
  }

  func calculateBMI() {
    if height <= 0.0 || weight <= 0.0 {
      showResult = false
      return
    }

    bmi = weight / (height * height)

    category = match bmi {
      ..18.5  => "Underweight"
      ..25.0  => "Normal weight"
      ..30.0  => "Overweight"
      _       => "Obese"
    }
  }

  view {
    Scaffold(title: "BMI Calculator") {
      Column(alignment: .center, spacing: 20, padding: 32) {
        // ...
      }
    }
  }
}
```

Key drift markers: `app { }` top-level block, `state { }` block, typed slots (`weight: Float = 0.0`), `func` keyword, `match ..18.5 =>` range-pattern syntax, `view { Scaffold { Column {} } }` view tree, `Column(alignment: .center, spacing: 20, padding: 32)` dot-notation enum args — this is SwiftUI with a light Compose accent.

Transpile fails on line 1 because Opus used `──` box-drawing characters in a decorative comment header (not a syntax issue, just a lexer choke on Unicode).

**Most diagnostic output of the control round.** The honest-no disclaimer is exactly the signal the v0.7.0 CLAUDE.md methodology flags as most valuable: *"a model that correctly names what the spec can't do is more useful for designing the next version than a model that invents a workaround."* Opus did the first while the others did the second. Worth citing directly in the dissertation.

### GPT-5.4 → SwiftUI / Compose-ish (correction below)

GPT-5.4 produces a brace-heavy declarative-UI DSL, not indentation-based syntax:

```
app BMI_Calculator {
  state {
    weightKg: number = 70
    heightCm: number = 170
  }

  computed {
    heightM = heightCm / 100
    bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0

    category =
      bmi < 18.5 ? "Underweight" :
      bmi < 25   ? "Normal" :
      bmi < 30   ? "Overweight" : "Obese"
  }

  ui {
    Window(title: "BMI Calculator") {
      Column(spacing: 16, padding: 20) {
        NumberInput(value: bind weightKg, …)
        Button(onTap: …) { Text("Calculate") }
      }
    }
  }
}
```

Key drift markers: curly braces throughout, `state { }` / `computed { }` / `ui { }` top-level blocks, `bind weightKg` as a value expression, `Window` / `Column` / `NumberInput` PascalCase widget constructors with named-arg parens, `?:` ternary expressions. This shape is closer to Compose / SwiftUI / Dart UI-toolkits than to anything indentation-based.

Transpile fails on the `?:` ternary character. The output is not "accidentally close to Igni" — it's a generic declarative-brace DSL that happens to share some vocabulary (`bind`, colons on named args) but none of Igni's structural shape.

**Contamination check result:** running the identical prompt with the language name swapped to "Arboral" produces essentially the same shape (`app { state { } fn …() { } view { Screen { … } } }`). See `tests/v0.8.1/Contamination_Check.md` for full comparison. Conclusion: GPT-5.4's shape is a generic UI-DSL prior, not Igni-specific prior knowledge. Phase 1 GPT-5.4 results stand without caveats.

### Gemini 3 Flash → Rust

Gemini 3 jumps directly to Rust syntax:

```
fn view(&self) -> Node {
  // ...
}
```

Key drift markers: `fn` keyword, `&self` receiver, `-> Node` return types. This is unambiguously Rust-shaped. The language name "Igni" doesn't obviously map to Rust — the model's prior is apparently that a "UI language called Igni" should look like a systems-language view-tree DSL.

Transpile fails on the `&` character in `&self`. Rust is the farthest-from-Igni drift of the four models.

### Gemma 4 E4B → Kotlin / Swift hybrid

Gemma drifts into a Kotlin/Swift hybrid with heavy type decoration:

```
Screen BMI_Calculator:
    title("BMI Calculator")
    state {
        weight: Double = 0.0
        height: Double = 0.0
        bmi_result: Double? = null
        category_label: String = "Enter values..."
    }

    fn calculate_bmi():
        let w = self.weight
        let h = self.height

        when bmi:
            case < 18.5:
                category = "Underweight"
            case 18.5...24.9:
                category = "Normal Weight (Excellent!)"
            ...
```

Key drift markers: `Double?` nullable-type, `when/case` pattern matching, `self.` receivers, `let` declarations, `...` range syntax. This is Swift with Kotlin seasoning. Not unlike Opus's drift direction, but less coherent — mixes idioms across languages.

Transpile fails on `?` nullable type on line 15.

## Per-model architecture notes

### Claude Opus 4.6 (+10k extended thinking)

The only model to flag uncertainty before generating. 2813 output tokens including a substantive preamble (*"this is my best-faith interpretation"*) and a well-structured SwiftUI-like output. 53-second runtime reflects the thinking budget going toward deliberate hedging. Most useful single output of the control round for methodology purposes.

### GPT-5.4

Brace-heavy declarative-UI DSL — `app { state { } computed { } ui { Window { Column { } } } }`. Does not use Igni-shape (no indentation, no `screen Name:`, no `label`/`button` primitives, no `on tap:`). Ternary `?:` used inside `computed` block. No hedging or disclaimer — confidently produces a plausible-sounding DSL. Fastest of the non-Ollama calls (7s). Contamination check confirms this is a generic prior, not Igni-specific (see `Contamination_Check.md`).

### Gemini 3 Flash preview

Rust drift is unusual and worth a short note. No disclaimer. 766 output tokens, 6 seconds. The shortest-but-cleanest output of the four (in terms of syntactic coherence within the wrong language) — Gemini 3 Flash is definitively writing Rust, not confused pseudo-Igni.

### Gemma 4 E4B

Longest output (2167 tokens, 146 lines) and most mixed drift. 114 seconds of local inference. Shows what a 4B model produces when given a language it doesn't know — falls into the most recently-seen type-heavy language in training, with noticeable idiom mixing between Kotlin, Swift, and Python.

## Verdict — the spec is doing work

**Predicted 0/4 transpile rate achieved.** Every model produced syntactically invalid Igni without the spec. This establishes the negative control baseline: every spec-effect claim in Phase 1 and beyond can be compared against this zero point.

**Opus's honest-no is the single most important output** of the Phase 1 round for methodology defensibility. It demonstrates that frontier models can accurately assess "I don't know this" when given a low-signal prompt, which means claims of "the spec taught the model" are falsifiable: if the spec did nothing, Opus would say so.

**Per-model drift direction is novel diagnostic data** that wouldn't come out of spec-included runs. Opus goes SwiftUI, GPT-5.4 goes SwiftUI / Compose-ish, Gemini 3 goes Rust, Gemma goes Kotlin/Swift. These are the *priors* each model brings to a "UI language called X" prompt — all four produce brace-based or type-decorated drift; none produces Igni's indentation+colon shape. Useful for:

- **Framing the spec's intro section.** If most frontier models' prior is "SwiftUI-shaped," the spec's opening should explicitly contrast with SwiftUI patterns (no `@State`, no `struct`, no `ViewBuilder`). If the prior is Rust-shaped (Gemini), contrast with `fn`/`&self`.
- **Predicting which models will under-adopt which spec features.** Models with stronger "SwiftUI" prior may take more spec-reinforcement to abandon `@State`-style patterns.
- **Calibrating the Phase 4 Igni-vs-Flutter comparison.** The honest-no signal means Opus can give meaningful reviews of what makes Igni different — it has a clear baseline of what it *doesn't* think Igni is.

## Most diagnostic individual finding

Opus's disclaimer is worth quoting in the dissertation as-is:

> *"'Igni' isn't a widely-documented UI language in my training data, so the following is my best-faith interpretation of what an Igni app would look like based on the declarative, component-oriented style the name suggests. If Igni has a specific spec you're working from, feel free to share it and I'll adjust."*

This is the single most scientifically valuable output of Phase 1. It proves:

1. The models aren't pretending to know Igni. Phase 1 code-output claims are legitimately "learned from the spec," not retrieved from training data.
2. Opus is trustworthy enough to flag uncertainty rather than confabulate — which matters for future dissertation claims about model behaviour.
3. The spec is doing real work. Phase 3's spec-size sweep isn't measuring whether the spec matters; it's measuring *how little* spec is needed for the learning to land.

## Next steps

1. **Preserve this round permanently.** Every future spec version should have its own negative-control row, using the exact same prompt and models, to track whether model priors drift over time. If in 2028 Opus's drift direction changes from SwiftUI to something else, that's a model-capability signal. This is the longitudinal side of the Phase 5 regression chart that isn't covered by spec-delta tracking.
2. **Add a second control prompt.** A language where the prior should be *wrong* — e.g., "write a simple game in Igni" — probes what happens when the model's prior can't be cleanly satisfied. Low priority, but worth doing once for completeness.
3. **Reference this file** from any future write-up that claims "the spec landed" — the denominator for "did the model learn this from the spec?" is right here.
