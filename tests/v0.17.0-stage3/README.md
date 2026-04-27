# v0.17.0 `border:` Stage 3 — synthesis

**Verdict: SOFT PASS — strong on frontier tier (3/3 P1 + 3/3 P2 + 3/3 P3); noise tier P2 fails on form not intent.** Ship v0.17.0; queue a one-line cheatsheet pin for v0.17.1.

12 cells: 4 models × 3 prompts (claude-opus-4-7, gpt-5.5 high-effort, gemini-3.1-pro-preview, gemini-3.1-flash-lite-preview) against shipped `spec/v0.17.0-cheatsheet.md`. Total cost $0.342.

## Per-prompt adoption table

| Prompt | claude-opus-4-7 | gpt-5.5 | gemini-3.1-pro-preview | gemini-3.1-flash-lite-preview |
|---|---|---|---|---|
| **P1 — Outlined settings card** | ✅ canonical | ✅ canonical (`each` loop) | ✅ canonical (`each` loop, with explanatory comment) | ✅ canonical (`each` loop) |
| **P2 — Selected payment method** | ✅ canonical (two-helper) | ✅ canonical (two-helper) | ✅ canonical (two-helper, with prose) | ⚠️ canonical INTENT (two-helper shape) but uses **unsupported backslash line-continuation** — would not transpile |
| **P3 — Profile screen with mixed border use** | ✅ canonical (wrapper-layout pin) | ✅ canonical (wrapper-layout pin) | ✅ canonical (wrapper-layout pin, with explanatory comment) | ✅ canonical (wrapper-layout pin) |

**Headline numbers:**
- P1: 4/4 transpile-clean ✅
- P2: 3/4 transpile-clean (strict) / 4/4 if you score intent ⚠️
- P3: 4/4 transpile-clean ✅ — **Patch 2 (outlined-button pin) worked perfectly: every model reached for the wrapper-layout shape unprompted**

## Strongest cell — Patch 2 success on P3

Every model independently produced the same canonical shape for outlined buttons:

```igni
layout vertical, rounded: medium, border: thin:
  button "Edit", on tap: edit()
```

Compare to Stage 0 P3, where 3 models produced 3 *different* workarounds (tappable-layout, button-wrapped-in-bordered-layout, custom OutlinedButton component). The cheatsheet pin collapsed the divergence to one shape across the entire 4-model panel — including the noise tier. **The pin worked exactly as designed.** Two models (gemini-pro, opus) explicitly used a comment or didn't need one because the pattern read as natural; gemini-pro's comment "Per the Igni rule: button outlines are achieved by wrapping the button in a layout with `border:` and `rounded:`" suggests the cheatsheet teaching landed verbatim.

## Strongest cell — Patch 1 success on P2

Three of four models reached for the **two-helper pattern** (separate `width_for` and `color_for` functions, both vary on selection) — the exact shape Patch 1 promoted from "convergent unprompted" (Stage 0) to "canonical teaching" (v0.17 ship cheatsheet). Frontier tier is 3/3 perfect; flash-lite's intent is right too.

The shape's ergonomic acceptance under teaching is itself signal: Patch 1 teaches ≥6 lines of helpers, all 3 frontier models reproduced them faithfully without truncation or compression. The cheatsheet's inline comment ("Selection redundancy — width AND colour both shift on select. Either alone is ambiguous") was honoured implicitly by output structure if not always quoted.

## The single soft-fail — flash-lite P2

Flash-lite output:

```igni
layout horizontal, padding: medium, background: card, rounded: medium, \
       border: border_width(method), color: border_color(method), \
       on tap: selected = method:
  label method
```

The shape is canonical (two-helper, `border:` + `color:`, on-tap reassignment). But the model used **backslash line-continuation** — a JavaScript/Python pattern that Igni's lexer rejects at parse time:

```
Error: Unexpected character: '\'
```

Verified by transpiling the cell against the shipped v0.17 transpiler — fails immediately on the first `\`. So this output is *uncanonical-by-form, canonical-by-intent*.

**Why it happened (hypothesis).** The canonical selected-state example in the v0.17 cheatsheet uses a single-line layout that runs to ~140 characters. Flash-lite (a smaller / less-reasoning model than the frontier panel) appears to have inferred from training data that long single lines should be soft-wrapped via `\` — a pattern from Python/Bash but not Igni. The cheatsheet doesn't currently say "no line continuation" because the v0.17 cycle didn't anticipate this specific failure mode.

## Patch decision (per cycle rules)

3/4 on P2 strict = **soft fail per the pre-registered ship bar**. Cycle protocol: queue a v0.17.1 docs-only iteration (cheatsheet patch only, no syntax change), do *not* block the v0.17.0 ship.

**Recommended v0.17.1 patch** (one line into the cheatsheet's `## Arranging things` section, near where layout properties are introduced):

> All layout properties go on the opening line — Igni doesn't accept `\` line-continuation or backslash-wrapping. Long property lists stay on one physical line; if the line gets uncomfortably long, factor into a custom component instead.

This is a single sentence, no syntax change, no transpiler change. Could ship with the next docs-only iteration alongside any other v0.17.x clarifications that surface.

**Frontier-tier strong pass + noise-tier-form-fail is well-precedented** — v0.14.1 had the same shape (frontier 4/4, flash-lite reverted to relative-decrement). The cycle accepts that the noise tier is a forward-looking signal for next-iteration docs improvements, not a gate on current-version ship.

## Trap-journal candidates

- **Backslash line-continuation as a noise-tier failure mode** worth distinguishing from substantive misunderstanding. Flash-lite produced canonical *shape* but uncanonical *form*. The trap-journal pattern from v0.17 Stage 0 (under-taught vs stretched primitives) extends: "shape vs form" is a third sub-category — model knows the right pattern but reaches for an unsupported text-formatting convention. Worth logging as another methodology distinction. Lightweight: append to the existing v0.17 trap-journal entry rather than create a new one.

## Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.1005 |
| gpt-5.5 (effort: high) | $0.1706 |
| gemini-3.1-pro-preview | $0.0634 |
| gemini-3.1-flash-lite-preview | $0.0074 |
| **Total** | **$0.3419** |

Cumulative v0.17 cycle: $0.149 (Stage 2 framing) + $0.348 (Stage 0) + $0.342 (Stage 3) = **$0.839**. Within the ~$0.85 budget targeted at design lock.

## Ship verdict

**SHIP v0.17.0 as-is.** Frontier tier is 3/3 + 3/3 + 3/3 — every cell across opus/gpt/gemini-pro is transpile-clean canonical. The flash-lite P2 form-fail is a noise-tier signal for v0.17.1 docs polish, not a v0.17.0 gate.

**Queued follow-ons:**
- v0.17.1 cheatsheet pin: "no `\` line-continuation" sentence in the layout-properties section.
- ROADMAP Stream 3: mark `border:` shipped; promote next Path C primitive when the cycle opens (per `docs/private/111` Watch-list, that's `shadow:` if any of triggers A/B/C fires; otherwise next is whichever Stream 3 candidate has compounded signal).
- Trap-journal append: shape-vs-form distinction at noise tier.