# Igni Cold-LLM Test Prompts (v0.7.1)

Cold tests against v0.7.1. Paste the full spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What changed in v0.7.1:** added `upper(s)` and `lower(s)` string case builtins. Everything else is identical to v0.7.0.

**Hypothesis under test:**

Did the feature land? The v0.7.0 Alert Dashboard round produced the strongest single-feature signal in the project's history: 4/4 model output friction (Gemini 3.1 Pro mapper function, Opus 4.6 honest-flagged, Gemini 3 Flash ignored requirement, GPT 5.3 broken invented syntax) plus 4/4 ship-review flags = 8/8 compounded. v0.7.1 makes `upper()` real. The direct test is the same Alert Dashboard prompt against the same four models.

**Prediction:** if the feature landed, every model renders the uppercase badge via `upper(alert.level)` — no mapper functions, no honest-refusals, no ignored requirements, no invented placeholder syntax. 4/4 spontaneous usage would validate the feature, matching the v0.7.0 colour-assignability BMI rerun pattern.

Same methodology as the v0.6.11 BMI rerun that validated colour assignability: identical prompt, same four models (Claude Opus 4.6, Claude Sonnet 4.6 / Gemini 3 Flash equivalent, ChatGPT 5.3, Gemini 3.1 Pro), grade against v0.7.0 Alert Dashboard results for a direct delta.

---

## 1. Alert Dashboard (direct v0.7.0 rerun — did string case builtins land?)

> Using only the Igni language spec above, write an Alert Dashboard app in Igni — a single-screen app that shows a list of alerts, each with a severity-coloured badge and text.
>
> **Screen:**
> - Title: "ALERTS"
> - A list of alerts (start with 5 hardcoded alerts inside the screen body — no fetch needed). Each alert has a `level` (`"critical"`, `"warning"`, or `"info"`) and a `message` string.
> - For each alert, render an `AlertRow` component that shows:
>   - A coloured badge on the left showing the level in uppercase ("CRITICAL", "WARNING", "INFO")
>   - The message text to the right of the badge
> - The badge colour is determined by the level: critical → danger, warning → orange, info → green.
> - At the top of the screen, show a summary line: "X critical, Y warnings, Z info" where X/Y/Z are the counts.
> - The summary line's own text colour should match the highest-severity level present (danger if any critical, orange else if any warning, green otherwise).
>
> **Requirements:**
> - Use a reusable `AlertRow` component.
> - The component should receive the alert's colour as an argument, not recompute it internally.
> - Use a screen-level function to compute the colour from a level.
>
> Show the complete Igni code first, then briefly explain any design decisions you made.

**What to grade:**

- **`upper(level)` spontaneous usage.** Does the model render the badge via `upper(alert.level)` — the direct delta signal? Direct comparison vs v0.7.0 Alert Dashboard (where 0/4 used `upper()` because it did not yet exist: 1 mapper function, 1 honest-flag, 1 ignored requirement, 1 broken placeholder).
- **Data model stays lowercase.** Does `alerts` store `"critical"` / `"warning"` / `"info"` (natural keys for branching and the severity-colour function), or does the model pre-uppercase into `"CRITICAL"` to dodge the case conversion problem? Pre-uppercasing would be a false-positive signal — the feature exists but is being routed around.
- **`upper()` used in both render sites.** Does the model also use `upper()` on the summary-line counts if it pluralises or labels them in caps? Second occurrence is a weaker signal but confirms the builtin is being reached for, not just the one obvious site.
- **No `lower()` invention where it doesn't belong.** Does any model use `lower()` on the comparison side (`if lower(level) is "critical"`)? That would indicate uncertainty about whether comparison is case-sensitive — the spec currently says `is` is exact match. If this happens 2+/4, it's a gap signal for explicit case-sensitivity doc.
- **Transpiler validation.** Run each output through the transpiler per `tests/README.md` step 2. Record transpile success and browser-run success alongside the spec-level grade.

**Pass bar (matching v0.6.11 BMI rerun):** 4/4 spontaneous `upper(alert.level)` usage on the badge render site. Anything less than 4/4 signals the spec's Reference entry or cheatsheet placement needs sharpening.
