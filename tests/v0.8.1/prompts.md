# Igni Cold-LLM Test Prompts (v0.8.1)

Cold tests against v0.8.1. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What changed in v0.8.1:** documentation-only framing cleanup. No syntax or semantic changes from v0.8.0. The opening now explains more directly that Igni is a UI-first language for readable source code, designed for human-AI collaborative development, best suited to product-style UI apps, and not a general-purpose language. The stacked historical change blurbs were removed from the opening, and the cheatsheet intro was aligned to match.

**Hypothesis under test:**

Does a cleaner opening improve first-read understanding without changing the language? v0.8.1 should not change what Igni can do. It should change how quickly and accurately both humans and LLMs understand what Igni is for, how it should read, and what patterns are idiomatic.

**Prediction:** if the framing cleanup works, models given v0.8.1 should:

- produce equally correct or more correct Igni than v0.8.0
- show less React/Flutter-shaped overengineering
- explain Igni more accurately as a UI-first language for readable product-app code
- recall the main constraints more cleanly in the comprehension task

Same methodology as the existing cold-test reruns: same four models (Claude Opus 4.6, Gemini 3 Flash, ChatGPT 5.3, Gemini 3.1 Pro), fresh chat, same prompt, direct comparison against v0.8.0.

---

## 1. Habit Tracker (direct `v0.8.0` vs `v0.8.1` framing comparison)

> Using only the Igni language spec above, write a small Habit Tracker app in Igni.
>
> **Screen:**
> - Title: "HABITS"
> - Show a list of habits. Each habit has:
>   - a name
>   - a streak count
>   - whether today's check-in is complete
> - Each habit row should show:
>   - the habit name
>   - a badge showing the streak
>   - a toggle or checkbox for today's completion
> - At the top of the screen, show a summary with:
>   - total habits
>   - completed today
> - At the bottom, include:
>   - a text input for a new habit name
>   - an "Add Habit" button
> - If there are no habits, show a friendly empty state instead of the list.
>
> **Requirements:**
> - Use a reusable component for each habit row.
> - Use a clean mobile-app layout with cards or grouped sections.
> - Use only Igni's built-in primitives and styling values.
> - Do not use hex colors.
>
> Show the complete Igni code first, then briefly explain any design decisions you made.

**What to grade:**

- **Overall correctness stays at least as good as v0.8.0.** Since v0.8.1 is docs-only, any regression in correctness is a negative signal.
- **Less framework-shaped drift.** Does the model avoid React/Flutter habits like over-abstracted architecture, imports/classes commentary, or non-Igni mental models?
- **Idiomatic Igni structure.** Does it reach for a straightforward `screen` + `layout` + local state + simple reusable component shape?
- **Use-case fit.** Does the model treat Igni as a language for product-style UI apps rather than a general-purpose app language?
- **Explanation quality.** In the short commentary after the code, does it describe the solution in Igni terms (`screen`, `layout`, readable UI structure, local state) rather than external framework vocabulary?
- **Transpiler validation.** Run each output through the transpiler per `tests/README.md` step 2. Record transpile + `dart analyze` results inline.

**Success bar:** compared with v0.8.0, v0.8.1 should produce equally correct or better outputs with less framework drift and more clearly Igni-shaped explanations.

---

## 2. Spec Comprehension (did the new opening land?)

> Using only the Igni language spec above, answer in 5 bullet points:
> - what kind of language Igni is
> - what kinds of apps it is best suited for
> - what it optimizes for
> - how it differs from framework-heavy UI code
> - the main constraints a programmer must remember

**What to grade:**

- **Positioning accuracy.** Does the model correctly identify Igni as UI-first?
- **Human-AI collaboration hypothesis.** Does it recognise that Igni is designed to reduce ambiguity for both humans and LLMs?
- **Use-case accuracy.** Does it name the intended domain cleanly (dashboards, forms, multi-screen product apps, interactive tools) without drifting into games/systems/scripts?
- **Constraint recall.** Does it correctly name core structural constraints rather than inventing ones that aren't in the spec?
- **Noise level.** Does it avoid irrelevant version history and invented claims?

**Success bar:** v0.8.1 should produce noticeably clearer, more on-target summaries than v0.8.0, even if the app-task outputs are only marginally different.

---

## Optional secondary qualitative prompt

> Compare `v0.8.0` and `v0.8.1` and explain which one is easier to learn first.

Use this only as supporting evidence. If it conflicts with the task-based results above, trust the task-based results.
