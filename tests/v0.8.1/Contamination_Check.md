# GPT-5.4 Contamination Check — v0.8.1

**Date:** 2026-04-15
**Model:** GPT-5.4
**Purpose:** test whether GPT-5.4's baseline "no-spec Igni" output reflected Igni-specific training-data knowledge or a generic UI-DSL prior.

## Background — motivation for the check

The Phase 1 BMI Negative Control round (tests/v0.8.1/BMI_Negative_Control.md) produced GPT-5.4 output that looked superficially like it might be "closer to Igni" than the other models' drift. Two possible explanations:

1. **Igni-specific knowledge.** The public Igni repo + CLAUDE.md + spec files were scraped into GPT-5.4's training data. If so, any claim about "the spec taught the model" for GPT-5.4 would need caveating — it may have arrived knowing Igni's shape.
2. **Generic declarative-DSL prior.** GPT-5.4 produces brace-heavy declarative UI code regardless of the language name, including for languages it has never seen.

## Method

Single swap: rerun the no-spec BMI prompt with the language name "Igni" replaced by "Arboral" — a made-up word with no UI-language associations. Everything else identical. If the output shape is substantially different, hypothesis (1) is supported. If it's essentially the same, hypothesis (2) is supported.

Both runs executed via `tests/runner/run.ts`:

- `gpt-5.4_none_bmi-calculator.md` — original Igni-name run (Phase 1)
- `gpt-5.4_none_bmi-calculator-arboral.md` — contamination check

## Result — hypothesis (2) supported, no contamination detected

**Both outputs use the same structural shape:**

- Top-level block: `app BMI_Calculator { … }` (Igni) / `app "BMI Calculator" { … }` (Arboral)
- State block: `state { weightKg: number = 70, heightCm: number = 170 }` / `state { weightKg: "", heightCm: "", … }`
- Logic block: `computed { … }` with declarative-expression form / `fn calculateBMI() { let w = …; if (…) { … } }` imperative form
- UI block: `ui { Window(title: …) { Column { Text(…) NumberInput(value: bind …) Button(onTap: …) { } } } }` / `view { Screen { Column { TextInput(label: …) … } } }`

Both use curly braces, colon-terminated named parameters on widget-like calls, explicit binding syntax (`bind: …` / `value: bind …`), and trailing-closure widget composition. Neither uses indentation-based block structure. Neither uses `screen Name:` as the screen-declaration syntax (the core v0.8.0 / Igni keyword). Neither uses `on tap:`.

**Differences between the two outputs are editorial, not structural:**

- Igni-name output is marginally richer — uses `computed { }` for declarative derivations, typed state (`number`), ternary-chain pattern matching.
- Arboral-name output is simpler — dynamic-typed state initialised to `""`, imperative `fn calculateBMI()` with explicit `if/else if/else` and `return` for invalid input, uses `fn` / `let` / `or` / `toNumber()` / `toString()` — a slightly more procedural flavour.

Neither shape resembles actual Igni (no `screen`, no indentation, no `layout vertical:`, no `label`/`button` primitives, no `bind: name` as a bare property).

## Interpretation

GPT-5.4's no-spec output represents a generic "declarative brace-heavy UI DSL" prior that it applies to any "UI language called X" prompt. No Igni-specific content was retrieved. Phase 1 GPT-5.4 results are **valid without caveats** — any spec-effect observed in the spec-included runs can be attributed to the spec itself, not to pre-existing knowledge.

Secondary observation (single data point, weak signal): when given a language name that "sounds plausibly real" (like "Igni"), GPT-5.4 produces richer, more feature-laden output (`computed { }`, typed state) than when given a made-up name (simple dynamic strings). This isn't contamination — it's the model adjusting confidence based on whether it thinks the name could plausibly refer to a real language. Worth noting but not methodologically damaging.

## Correction to prior write-ups

The original `BMI_Negative_Control.md` incorrectly described GPT-5.4's drift as "indentation-respecting syntax but with JS operators" with a `screen Name:` + indented body example. That was a misreading — the actual output is `app Name { state { } computed { } ui { } }` brace-heavy. Corrected inline in that file.

The same correction applies to `docs/private/37_runner_phase1_retrospective.md` which flagged GPT-5.4 as suspicious partly on the same mistaken premise. Corrected there too.

**Final per-model drift classification (corrected):**

- Opus → SwiftUI (`app {}`, `state {}`, `func`, `match ..18.5 =>`, `Scaffold { Column {} }`)
- GPT-5.4 → SwiftUI / Compose-ish (`app {}`, `state {}`, `computed {}`, `ui { Window { Column { } } }`, `bind` / `onTap` named args)
- Gemini 3 Flash → Rust (`fn view(&self) -> Node`)
- Gemma → Kotlin/Swift hybrid (`Double?`, `when/case`, `self.`)

All four models produce brace-based or type-decorated drift. **Zero of the four models produce indentation+colon-based syntax without seeing the spec.** This strengthens the "spec is doing work" claim — Igni's signature syntactic feature (indentation-driven blocks) is not a natural default for any frontier model.

## Cost

- One additional API call to GPT-5.4: 56 input tokens + 496 output tokens, 7 seconds.
- Approximate cost: under $0.01.
- Rate of insight per dollar: extremely high. Worth repeating this pattern for any future concern about prior-knowledge contamination of a specific model.
