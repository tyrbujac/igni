---
name: stage-2-review
description: Use this skill when running or interpreting an Igni Stage 2 design panel — a 3-frontier-model critique of a design note before implementation lands. Triggers on phrases like "run Stage 2 panel", "Stage 2 design review", "synthesise the panel results", "what's the convergence on Q1 / Q2 / Q3", or when the user asks for help drafting a Stage 2 prompt or reading panel `.md` outputs. Loads when the user opens tests/v<X>-design-review/ directories or refers to convergence-counting / patches-queued-not-inlined patterns. Do NOT load for Stage 0 / Stage 3 cold-tests (use spec-cycle skill instead) or for cheatsheet-only review passes (different methodology, see tests/v0.14.1-cheatsheet-review/README.md for that pattern).
---

# Stage 2 design review reference

Stage 2 = pre-implementation panel critique of a design note. Catches *shape uncertainty* — alternatives the design draft might be wrong about. Distinguishing Stage 2 from Stage 0/3: Stage 2 outputs are prose critique; Stage 0/3 outputs are Igni source. Stage 2 uses `--no-spec --no-grade`; Stage 0/3 use `--spec <cheatsheet> --grade`.

## When to run Stage 2

Run when:
- New syntax with shape uncertainty (multiple defensible designs).
- Reject-list decisions where models might disagree (see v0.15.0 Q3 same-cycle vs split).
- Implementation-detail decisions that could affect cold-test adoption (see v0.15.0 Q2 reserved-name policy).

Skip when:
- Empirical evidence already locks the choice (e.g., 11/14 panel cells produce the same shape — v0.14.1 precedent).
- Shape mirrors already-shipped syntax (e.g., `theme: color:` mirrors `theme: text:`).
- The "alternative shapes" are all rejected by Path C structurally.

When in doubt, run it. Cost is ~$0.30; signal-to-noise is good.

## The 5-question framework

Pre-register 5 critique questions in the prompt. Don't add more; don't drop them. Standardising the question shape lets convergence-counting work across versions.

The canonical 5:

1. **Q1 — Headline design choice.** "Is the locked recommendation right?" Probe: does the structural argument actually preclude alternatives? Is there a smaller version that's still honest?
2. **Q2 — Lexical / parser surface.** "What's the risk of opening / restricting this namespace?" Probe: future-keyword collisions, reserved-name policy, parsing ambiguity.
3. **Q3 — Naming / canonical-form rule.** "Is the chosen rule (flatten with `_`, etc.) right? What about alternatives?" Probe: round-trippability, collision modes.
4. **Q4 — Reject-list / cycle bundling.** "Same cycle vs separate? Deprecation vs hard reject?" Probe: cleanup cost, methodology consistency.
5. **Q5 — Blind spots.** Open-ended. "What's the most important question or risk the design note doesn't address?" This is the highest-value question — it surfaces unknown-unknowns the author didn't think of.

Adapt question wording per design but keep the structure: 4 specific + 1 open-ended.

## Convergence-counting rules

Score each finding by how many of the 3 panel models converged on it:

- **3/3 unanimous** → **PATCH the design**. Apply pre-implementation. Cite in CHANGELOG.
- **2/3 strong** → **CONSIDER patch**. Depends on specificity. If the convergence is on the same concrete suggestion, treat as 3/3. If two models pointed at the same vague concern with different fixes, treat as 1/3.
- **1/3 single-model** → **LOG to ROADMAP**. Don't block ship. Log to Stream 3 candidate or methodology trap-journal.

Cross-model convergence on *the same specific point* is the signal. Two models flagging "X is unclear" with different fixes is weaker than two models proposing the same fix.

## Patches-queued-not-inlined pattern

After synthesis:

- 3/3 patches → apply to design note + spec/codegen/cheatsheet/micro before shipping. Re-run `npm test`.
- 2/3 patches → apply if specific; defer to next iteration if vague.
- 1/3 patches → log to ROADMAP Stream 3 (or methodology note); don't block ship.

Patches don't ship inline during Stage 2 — they queue post-synthesis. The design note status flips from "Stage 1 design draft" → "Stage 1 + Stage 2 complete" only after patches are applied. Cite patch list in synthesis README and CHANGELOG.

## Synthesis README structure

Format the synthesis as `tests/v<X>-design-review/README.md`:

1. **Header** — date, models, method (single prompt with embedded design note + 5 questions), cost.
2. **Convergence by question** — one table per Q1–Q5: finding × models × convergence count.
3. **Decisions** — patch / defer / log per finding.
4. **Summary of patches** — table mapping finding → file → status.
5. **What stays unchanged** — explicitly note the locked decisions panel didn't push back on.
6. **Next steps** — apply patches, re-run npm test, update doc N status.

See `tests/v0.15.0-design-review/README.md` as the canonical example.

## Common pitfalls

- **Don't conflate "model raised it" with "model converged."** A 1/3 raise is informational, not signal-strong.
- **Don't post-edit prompts after seeing results.** Mid-run revisions invalidate the empirical signal. If a question was unclear, log as methodology trap and re-run with reworded prompts (separate panel run, separate ship-bar).
- **Don't auto-synthesise.** Per `docs/private/104` automation principle, the convergence-counting and patch-decision steps are exactly the human-mediated synthesis the dissertation contribution rests on. Read the prose. Make the call.
- **Don't include flash-lite in Stage 2.** Flash-lite adds noise on prose-critique tasks. Keep Stage 2 at 3 frontier (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview). Use flash-lite for Stage 3 noise-tier inclusion only.

## Operational

- **Runner command:**
  ```bash
  cd tests/runner && npx tsx cold-test.ts \
    --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview \
    --no-spec --no-grade \
    --prompts ../v<X>-design-review/prompts.md \
    --out ../v<X>-design-review
  ```
- **Cost:** ~$0.30–0.40.
- **Wallclock:** ~5–10 min sequential. Parallel mode (when shipped) ~2–3 min.
- **Auto-loads:** `tests/runner/.env` for API keys.
- **Output naming:** `<model>_none_<prompt-slug>.md` per model.

## Reference panels

- `tests/v0.14-design-review/` — v0.14 timer primitive (Shape A vs B critique).
- `tests/v0.15.0-design-review/` — `theme: color:` (5-question framework canonical).

## When this skill applies

Drafting Stage 2 prompts. Running Stage 2 panels. Reading the 3 model `.md` outputs. Counting convergence per question. Deciding which findings become patches. Writing the synthesis README. Updating the design note status post-Stage-2.

When this skill does NOT apply: Stage 0 cold-tests (different methodology — use spec-cycle), Stage 3 ship validation (use spec-cycle), v0.14.1-style chat-mode cheatsheet review (separate methodology, no panel runner), or general design-note authoring before Stage 2 is run.
