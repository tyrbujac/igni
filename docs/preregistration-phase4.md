# Phase 4 pre-registration — Flutter vs Igni pilot

**Date:** 2026-04-16
**Status:** Pre-registration. **No edits after results are collected.** Any revisions go in a separate "revised predictions" section so the original is preserved.
**Pilot app:** Angela Yu's BMI Calculator (not BMI Calculator Pro).
**Author:** Tyr (predictions authored in dialogue with Claude Opus 4.7 on 2026-04-16, captured before any pilot run).

---

## Why pre-register

Pre-committing predictions with point estimates and confidence intervals is what separates research from motivated confirmation. If observed results fall outside the 67% CI, that is a real finding (a pre-registered falsification). The dissertation needs the predictions locked *before* the numbers come in, with the original preserved even if reality disagrees.

---

## Question

Does Igni beat Flutter on the canonical "write a small UI app" task across frontier and mid-tier models, measured on tokens, cost, time, and bug count?

---

## Hypothesis

Igni compresses the output-token budget enough to beat Flutter on total cost and wall-clock time, despite paying an input-token tax for the spec, at the pilot app size (BMI Calculator, ~50 lines of Igni / ~120 lines of Flutter).

---

## Methods

### Pilot app

Angela Yu's **BMI Calculator** (not Pro). Same functional spec for both languages.

**"Working" definition:** Two number inputs (height, weight), a calculate button, BMI displayed to 1 decimal place, category label (underweight / normal / overweight / obese). Compiles without errors AND renders the UI described in the prompt AND responds correctly to one representative user interaction.

### Controls

- **Same prompt text** for both languages (modulo the spec insert for Igni; Flutter gets a minimal context line like *"Write a Flutter app using Material 3."*).
- **Same models at frozen versions** (see panel below). Not "Opus latest" — specifically `claude-opus-4-7`, `gpt-5.4`, `gemini-3-flash-preview`, `gemma4:e4b`.
- **Same retry policy:** up to 3 attempts; feed compile errors back to the model each round; stop early if working.
- **Same "working" bar** (above).

### Model panel

| Model | Role | Research question it answers |
|---|---|---|
| Claude Opus 4.7 | frontier (closed) | What's the ceiling? Does Igni still help the best model, or does the best model crush both languages equally? |
| GPT-5.4 | frontier (closed, different vendor) | Does the effect hold across vendors, or is it a Claude-specific artifact? |
| Gemini 3 Flash | mid-tier (closed) | Does Igni disproportionately help weaker-cheaper models? (Multiplicative cost argument.) |
| Gemma 4 E4B | floor (open, local) | Reports separately as the methodology floor. NOT included in the headline Flutter-vs-Igni multiplier — Gemma's current Igni results are "below the instruction-following threshold" (produces invented syntax labelled `cognito`, not Igni). Keeping it reports a floor finding, not a peer-to-peer comparison. |

**Panel is frontier × 2 (different vendors), mid × 1, floor × 1 (reported separately).**

### Sample size

Pilot: **n = 3 trials per cell** (2 languages × 3 frontier/mid models × 3 trials = 18 runs in the headline panel, plus 6 Gemma runs reported separately).

Final dissertation study (not this pre-reg): n = 5 across 3–5 apps of varying size.

Temperature: 0.7 for variance (or the provider's default, noted per run).

### Asymmetry to disclose

Flutter gets training data "for free" (0 context tokens). Igni needs the spec in context (~850 tokens micro, ~2,300 tokens cheatsheet, ~12,600 tokens full). **Pilot uses the cheatsheet tier** (~2,300 tokens) — the middle context cost. This asymmetry is how both languages would be used in practice but must be disclosed in the writeup. Honest framing: *"Including context cost, Igni still wins on total tokens by X%."* If it doesn't, that is itself a finding.

### Bug taxonomy (decide before looking at outputs)

- **Compile failure** — transpile/Flutter build doesn't produce a binary.
- **Runtime crash** — app starts but throws at runtime.
- **Wrong behaviour** — runs but doesn't do what the prompt asked.
- **Wrong visual** — renders but layout/styling is off.
- **Missing feature** — a required feature is absent.
- **Spec violation** (Igni-side) — invented syntax, misused primitives.

Ideally 20% of runs spot-checked by a second rater for inter-rater reliability.

---

## Pre-registered predictions

| # | Metric | Direction | Point estimate (Flutter ÷ Igni) | 67% CI | Notes |
|---|---|---|---|---|---|
| 1 | Total cost to working app (£) | Lower is better | **3×** | 1.5× – 6× | **Headline.** Igni compresses output tokens, pays for spec on input. Net win depends on app size — Igni wins bigger on larger apps. If Igni doesn't win here, the thesis is in trouble. |
| 2 | Wall-clock time to working app (s) | Lower is better | **2.5×** | 1.5× – 4× | Output tokens drive generation time. |
| 3 | Output tokens (final working version) | Lower is better | **3×** | 2× – 5× | Cleanest, most defensible prediction. Direct LOC compression. |
| 4 | Input tokens (context) | Lower is better | **0.25×** (Flutter wins) | 0.15× – 0.4× | One-sided. Flutter = zero context tax (training data). Igni = spec in context. Cheatsheet tier assumed (~2,300 tokens). |
| 5 | First-try compile rate (%) | Higher is better | **Igni 85%, Flutter 75%** | Igni 70–95%, Flutter 60–85% | Simpler surface, fewer foot-guns. Flutter compile errors tend to be obvious (missing imports, typos). |
| 6 | Lines of code (final working) | Lower is better | **3.5×** | 2.5× – 5× | Most mechanical metric. Correlated with #3. |

### Metric tiers (for analysis prioritisation)

- **Tier 1 (headline, dissertation-critical):** #1 total cost, #2 wall-clock, plus a *semantic-bug count* derived from the taxonomy above.
- **Tier 2 (diagnostic):** #3 output tokens, #4 input tokens, #5 first-try compile, retry count, invented-syntax incidents.
- **Tier 3 (context):** #6 LOC, human review time (qualitative), commentary quality (qualitative).

If only three metrics can be measured: total cost (#1), wall-clock time (#2), and semantic bugs in first working version. First two are the value prop; the third is the richest diagnostic.

---

## Watch-outs when interpreting results

- **#1 and #4 are in tension.** If #4 comes in worse than predicted (big spec tax) and the app is small, #1 can collapse to near-1× even when #3 and #6 win cleanly. Key finding to watch: if total cost doesn't win, the thesis needs a *"wins on apps larger than X"* qualifier.
- **#3 and #6 track each other.** Measure both, but don't be surprised if they produce near-identical multipliers. Output tokens drive cost/time; LOC is the intuitive-to-readers proxy.
- **#5 interacts with retries invisibly.** A 10pp gap in first-try compile rate means ~10% more retry cost for the losing language. If Flutter compiles first-try higher than the 75% predicted, a lot of the cost win evaporates. Retry count should be tracked at least informally.

---

## Before running (pre-flight checklist)

- [ ] This document committed with the 2026-04-16 date locked.
- [ ] "Working app" definition frozen (above).
- [ ] Retry policy frozen (up to 3 attempts, feed compile errors back, stop early).
- [ ] Model versions pinned (exact IDs, not "latest").
- [ ] Bug taxonomy frozen.
- [ ] Budget set: ~£5–10 for the pilot, ~4–6 hours wall time including analysis.
- [ ] Prompts for both languages drafted and reviewed (no asymmetry beyond the spec insert).

---

## After running

**Do not edit this file.** Results go in a sibling file `docs/phase4-results.md` with two new columns for each metric: *observed* and *inside CI ✓/✗*. Anywhere marked ✗ is a pre-registered falsification and must be reported as such in the dissertation — these are the most valuable rows in the table.

Revisions to the predictions themselves, if any, go in `docs/preregistration-phase4-revised.md` with the revision date in the header. The original stays untouched.

---

## Caveats

- **Pilot ≠ dissertation evidence.** Results on BMI alone are pilot evidence. The full study needs 3–5 apps of varying size. BMI is the right first pilot because it's the cleanest test of the experimental machinery.
- **BMI is in the Igni cold-test corpus.** The spec has been iterated with BMI as one of the validation apps. Any post-iteration familiarity effect on the Igni side needs disclosure, though the Flutter side has no equivalent familiarity control.
- **Gemma as floor, not peer.** Reported separately throughout. Do not include in the headline multiplier.
- **Spec-tier confound.** This pilot uses the cheatsheet tier only. The separate question of *"does nano beat cheatsheet beat full on Igni across model tiers"* is pre-registered elsewhere (planned, not yet written).

---

*Source: extracted from `HELP.md` (2026-04-16 dialogue with Claude Opus 4.7, web). Forked into the repo on 2026-04-17 to lock the predictions before any Phase 4 pilot run.*
