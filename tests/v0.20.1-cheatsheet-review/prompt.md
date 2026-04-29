# Cheatsheet review prompt (v0.20.0 → v0.20.1)

Single-message prompt pasted into 4 web-LLM chat interfaces. The cheatsheet (`spec/v0.20.0-cheatsheet.md`) was embedded between the `---CHEATSHEET START---` / `---CHEATSHEET END---` markers in the actual prompt. Reproduced here for methodology traceability. Mirrors the v0.14.1 / v0.15.0 / v0.17.0 / v0.19.1 cheatsheet-review precedent. Q1–Q3 are identical to the v0.19.1 prompt for cross-version comparability; Q4 is a v0.20-specific cross-language-prior probe; Q5 is a fit-and-limits probe across three project shapes.

---

You are reviewing the Igni programming language cheatsheet for clarity and design quality.

Igni is a UI-first language that compiles to Flutter — indentation + colons replace braces, no parentheses on component invocation, designed for both human readability and LLM accuracy.

Read the cheatsheet carefully, then answer five questions.

---CHEATSHEET START---

[the full v0.20.0 cheatsheet was pasted here]

---CHEATSHEET END---

Now answer these five questions substantively:

**Q1 — What's strongest?** Which sections or passages read most crisply? Where do you finish reading and feel confident you understand exactly how the language behaves? What teaching choices are working well?

**Q2 — What's weakest?** Which sections or passages feel cluttered, contradictory, or harder to read than the surrounding prose? Which examples are doing too much? Which prose carries more weight than it should? Be specific about what would benefit from pruning, rewriting, or splitting.

**Q3 — Where is genuine semantic uncertainty?** Different from "weakly written." Identify places where you read carefully and still aren't sure how Igni actually behaves at runtime. Underspecified edge cases, behaviour the prose implies but doesn't pin down, places where you'd reach for a feature and not know if it's there.

**Q4 — Cross-language-prior check (v0.20 surface).** This version added theme variant pairs (`theme:` + `theme dark:`), structural sub-blocks (`scaffold:` / `appbar:` / `text:` chrome), the `shared.theme_mode: "system" | "light" | "dark"` selector, the auto-fall-back rule (dark inherits light values when omitted), and a `spacing/N` numeric scale (1–8 → 4/8/12/16/20/24/32 px) alongside word aliases (`small`/`medium`/`large`). For each of these, do they teach cleanly *against the priors a reader brings from SwiftUI / Jetpack Compose / Tailwind / CSS `prefers-color-scheme`*? Where do those priors help (a reader will guess right and the cheatsheet confirms)? Where might they mislead (a reader will guess wrong because Igni's rule diverges quietly)?

**Q5 — Fit and limits.** If you imagine three concrete project shapes — (a) a designer/developer collaboration tool with a canvas, source editor, state inspector, and AI-agent layer over `.igni` files; (b) a personal-knowledge / notes app with multi-screen navigation, a list of notes, an editable note view, and a settings screen; (c) a small data-entry or dashboard internal tool you've shipped before — for each, where would Igni *as described in this cheatsheet* be the right tool, and where would you reach for Flutter directly, web stack, or something else? Be specific about which Igni primitives map cleanly and which surfaces (state, layout, behavioural primitives, escape-hatch needs) hit a wall.

Prose response, no code blocks. Be substantive — a paragraph naming a specific concern beats a vague "looks good." Where you converge with the design choices, say so.
