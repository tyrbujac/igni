# v0.12 Stage 0 summary — `font:` on labels, shape choice

**Date run:** 2026-04-22
**Spec context:** `spec/v0.11.6-cheatsheet.md` (no priming toward `font:`; primitive not in spec).
**Panel:** 4 frontier models × 2 prompts = 8 calls. No thinking.
**Cost:** $0.1820 total (vs $0.15 estimate in doc 78 §Decision line 138).
**Outputs:** `tests/v0.12-stage0/outputs/`.

---

## Pre-registered decision (locked 2026-04-22 in `docs/private/78` §Decision, lines 130–134)

| Stage 0 outcome | Decision |
|---|---|
| 4/4 token form | Ship Shape A as v0.12 |
| 3/4 token, 1/4 string | Ship Shape A + cheatsheet anti-pattern callout |
| **≤2/4 token** | **Shape A wrong; reopen doc 78; reconsider Shape B** |

**Triggered: ≤2/4 bar. Pre-registered outcome: reopen doc 78, no spec work.**

---

## Call-level grading

| Model | Prompt 1 (Profile card) | Prompt 2 (Menu) | Per-model shape |
|---|---|---|---|
| Claude Opus 4.7 | **no-shape** — honest-no; `style:` only; commentary cites "One way to do everything" as reason *not* to invent | **token form** — `font: merriweather`, `font: lora` throughout; commentary cites "mirroring how `color:` and `style:` already work" as justification | tie (1 token, 1 no-shape) |
| GPT 5.4 | **no-shape** (primary block) — `style:` + `color:` only; flagged explicitly that the spec has no font-family property. Secondary illustrative block showed `font: "Pacifico"` as *example of what it would need* | **string form** — `font: "Merriweather"`, `font: "Lora"` throughout | tie (1 string, 1 no-shape) |
| Gemini 3.1 Pro | **no-shape** — refused to invent; commentary proposes theme-level mapping (`heading` → Pacifico, `body` → Source Sans Pro configured at compiler/theme layer) | **no-shape** — same refusal + theme-level mapping rationale verbatim | 2/2 no-shape |
| Gemini 3.1 Flash-Lite | **string form** — `font: "Pacifico"`, `font: "Source Sans Pro"` on every label; uncritical | **string form** — `font: "Merriweather"`, `font: "Lora"` throughout; uncritical | 2/2 string form |

**Tallies:**

- Per-call (8 calls): **1/8 token · 3/8 string · 4/8 no-shape**
- Per-model "majority" (doc 78 counting basis): **~0.5/4 token · 1.5/4 string · 2/4 no-shape** (ties broken by first-prompt preference: Opus and GPT both land in no-shape)

Token-form reach strictly: **0/4 models.** Generously (counting Opus as token because that's what it invented when it did invent): **1/4.**

Either reading is ≤2/4 → **fail bar triggered.**

---

## The unexpected finding: Shape C (theme-level font mapping) emerged independently

Two models independently proposed a third shape neither of doc 78's candidates captures:

**Opus 4.7 Prompt 1** (refusing to invent per-label `font:`, then suggesting the alternative):
> "To actually satisfy the Pacifico / Source Sans Pro requirement, Igni would need either: (1) A theme-level font-family configuration (mapping `heading` → Pacifico, `body` → Source Sans Pro project-wide), or (2) A per-label `font:` property."

**Gemini 3.1 Pro Prompts 1 & 2** (both outputs arrived at the same structure):
> "The mapping of 'heading = Pacifico' and 'body = Source Sans Pro' would be configured at the compiler/theme level behind the scenes, keeping the screen markup purely semantic."

Call this **Shape C — theme-level font mapping.** `font:` is not a per-label property; instead, a project-level theme block maps `style:` tokens to font families. Semantic tokens stay in the label markup; the typographic realisation is configured once globally.

This is **not the same as Shape A per-label tokens.** It removes the per-label `font:` property entirely. It matches Igni's "hide Flutter's boilerplate" principle better than either candidate in doc 78, and it aligns with how CSS design systems actually pair fonts with semantic text roles in production. It also dovetails with the still-open `theme:` block (ROADMAP Immediate, v1.0 criterion 2 coverage gap).

**This is a 2/4 independent-invention signal** — the same magnitude as the v0.7.1 Alert Dashboard `emit toggle` cold-test finding that kicked off multiple spec revisions. Worth taking seriously.

---

## Also notable: honest-no is the dominant behaviour

**3 of 4 models refused to invent `font:` syntax on at least one prompt.** Opus and GPT refused on Prompt 1 (profile card — the typography-heaviest prompt); Gemini Pro refused on both. Only Flash-Lite invented immediately on both.

All three refusals cite the spec's "One way to do everything" discipline as the reason not to invent. This is **methodology working as designed** — the spec's rule-simplicity principle is strong enough that frontier models refuse to ad-lib around it, even when the prompt explicitly demands a capability the spec doesn't provide.

Reading this together with the Shape C emergence: the models that respected the spec independently arrived at "you should add this capability *at the theme/style layer*, not as per-label syntax."

---

## What this changes about the v0.12 path

Per pre-registered decision: **no spec work before doc 78 is reopened.** That's binding.

The reopening should engage with three candidate shapes, not two:

- **Shape A** (per-label token, `font: pacifico`) — doc 78's recommendation. Stage 0 hit ≤2/4. **Falsified as-written.**
- **Shape B** (per-label string, `font: "Pacifico"`) — doc 78's fallback. Stage 0 got 1/4 (Flash-Lite) immediate reach + 1/4 (GPT) when pushed. **Not dominant either.**
- **Shape C** (theme-level mapping from `style:` to font family) — emerged independently from 2/4 models. **New candidate.** Aligns with the `theme:` block already on the ROADMAP Immediate tier as a coverage gap.

Shape C is architecturally different: it doesn't add a per-label property; it completes the existing `style:` system by letting the theme wire up font-family for each style token. It converges two open design questions (font support + `theme:` block semantics) into one primitive.

---

## Prompt-structure caveat (honest self-audit)

Both prompts include "Using only the Igni language spec above…" (standard methodology language for cold tests). This phrasing **may bias models toward honest-no** vs inventing, which inflates the no-shape count and deflates both Shape A and Shape B.

The anticipatory clause in `prompts.md` flagged this: *"if any model produces 2/2 no-shape, flag as a prompt-shape problem and consider re-running with a sharper requirement phrasing before applying the decision rule."* Gemini Pro did 2/2 no-shape. That clause triggers.

However, this doesn't change the headline decision:

1. The 2/4 Shape C emergence would persist regardless of prompt phrasing (it's a positive invention signal, not an absence signal).
2. Flash-Lite's 2/2 string form and GPT's menu-prompt string form would also persist.
3. Token form (1/8 calls, 1/4 models strictly) would still be below bar.

Re-running with sharper phrasing would tell us whether Opus and GPT would also reach for string form on Prompt 1 when forced to invent. That's a useful secondary question, but the primary signal — **Shape A is not the dominant invention shape, and Shape C is an independent-2-model finding** — is already in.

**Recommendation:** treat this Stage 0 as complete and apply the pre-registered decision. Optionally run a "pushier" variant prompt (without the "only the spec above" framing, explicitly instructing invention) as a **secondary Stage 0-b** before reopening doc 78, if Tyr wants the Shape A/B question settled beyond the Shape C pivot. Doc 78 reopen should engage with Shape C regardless.

---

## Recommended actions (for Tyr)

1. **Reopen `docs/private/78`.** Pre-registered decision is binding — 1/4 (or 0/4) token form is well below the 2/4 fail bar.
2. **Add Shape C to the candidate list** in the reopened note. Two independent frontier models proposed it unprompted; that's strong signal, not noise.
3. **Optionally run Stage 0-b** with a "pushier" prompt (~$0.15 additional) to disambiguate whether Opus and GPT would land on Shape B or theme-level Shape C when forced past honest-no. Low cost; would harden the reopened doc's evidence section.
4. **Do not promote v0.12 to Next milestone.** Per plan Step 6 branch 3: "no promotion; note stays in Future with updated evidence; Boojy subset migration remains Next milestone." ROADMAP unchanged.
5. **v0.13 `max-width:` is unaffected.** Its Stage-0-skipped decision relies on priors from six existing token primitives, not on this round's outcome. v0.13 can proceed when Tyr chooses to prioritise it.

---

## Stage 3 note (for future reference)

If a reopened doc 78 lands on Shape C (theme-level) rather than a per-label shape, the Stage 3 prompt commitment in doc 78 §Stage 3 (typography-heavy prompt) still applies — but the grading rubric shifts from "did models reach for `font: pacifico` on each label" to "did models configure the theme correctly and rely on semantic `style:` tokens in the markup." That's a fundamentally different measurement. Keep attribution discipline (no overlap with v0.13's desktop-layout prompt).

---

## Bottom line

**The Stage 0 worked.** It didn't confirm Shape A — it surfaced a better option (Shape C) that neither of doc 78's two candidates anticipated. This is exactly the signal Stage 0 is for: cold-test evidence redirects the design before spec work lands, not after. Doc 78's methodological discipline (run Stage 0 when priors are thin) paid off on the first round.
