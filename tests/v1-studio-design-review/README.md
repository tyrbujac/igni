# v1.0 Studio architectural-direction — chat-mode strategic-critique panel

**Status:** Scaffold ready; panel run pending operator scheduling. **CC drafts; Tyr runs manually.**
**Method:** Chat-mode 3-frontier-model panel. Operator pastes cheatsheet (`spec/v0.21.1-cheatsheet.md`) + brainstorm summary (excerpt of `docs/private/134_v1_studio_brainstorm.md`) + each question into a fresh chat per question per model. Responses saved verbatim with web-UI artefacts preserved.
**Models:** Claude Opus 4.7 (Claude.ai), GPT-5.5 (ChatGPT), Gemini 3.1 Pro (Google AI Studio). 4th model optional if operator wants noise-tier comparison (Gemini 3 Flash).
**Cost:** $0 (chat-mode subscriptions). **Honest timing estimate: 60–90 min run + 60–90 min synthesis = 2–3 hours operator-attention total.** Longer than past chat-mode panels (v0.21-stage3-chat-mode was ~30 min) because architectural questions invite long discursive responses + cross-model synthesis is harder than convergence-counting on syntax-shape questions.
**Outputs:** `claude-opus-4-7.md`, `gpt-5.5.md`, `gemini-3.1-pro.md` — each with five question-separated sections.

## What this panel measures

Tyr's calculator dogfood Session 1 (`docs/private/133_calculator_dogfood.md`) surfaced 8 findings; two of them (G + H) and the cumulative gestalt raised an architectural question: **what is the relationship between Igni's primitives, its theme system, and the future Igni Studio canvas?** Doc 134 captures seven operator-side brainstorm positions on shapes / interactivity / positioning / token pairs. None are Tyr-locked.

This panel pressure-tests those positions across three frontier models with anti-anchored questions (each question presents BOTH the operator lean AND a concrete counter-position so models don't pattern-match to author bias). The panel's convergence/divergence pattern informs v0.22+ scope decisions:

- **3/3 HOLD** on operator lean → strong baseline; proceed to consider locking for v1.0.
- **2/3 HOLD + 1/3 architectural divergence** → REFINE the brainstorm position; investigate the divergence before locking.
- **1/3 HOLD or 0/3** → FLIP; reopen the position.
- **3/3 NEW direction** that doesn't match the operator lean OR the counter-position → highest-signal outcome; surfaces a third position the operator didn't see.

## Methodology — third instance of chat-mode strategic-critique pattern; first at v1.0-architectural level

Prior strategic-critique panels (n=2 instances):
- `tests/igni-studio-strategy/` (2026-04-28) — Studio strategic claim critique; 5 HOLD/REFINE/FLIP questions. **API mode** with cold-test runner.
- (Smaller informal application earlier, captured in `docs/private/115_igni_studio_strategy.md` synthesis chain.)

Prior chat-mode panels (different instrument-purpose):
- Cheatsheet-quality reviews (n=5 instances: v0.14.1, v0.15.0, v0.17.0, v0.19.1, v0.20.1) — Q1-Q5 cheatsheet-readability template.
- Stage 3 ship-validation (n=1: v0.21 Stage 3 chat-mode at `tests/v0.21-stage3-chat-mode/`) — cold-write evidence at ship-validation.

**This panel combines both lines:** strategic-critique shape (HOLD/REFINE/FLIP per question, doc-115-style) executed in chat-mode (manual paste, no runner, $0). And it pushes the strategic-critique instrument to a **new scope level** — v1.0-architectural-direction questions rather than per-cycle decisions. **First instance of chat-mode-strategic-critique-at-v1.0-architectural-level**; methodology contribution catalogued for chapter §4 (gates n=2 reproduction in a future v1.0+ cycle for class promotion).

## Pre-registered ship bar — per-question convergence-counting

Same shape as past Stage 2 panel synthesis. Per question:
- **HOLD verdict:** model agrees with operator lean (Position N from doc 134). Justification cites cheatsheet content, design principles, or prior-art alignment.
- **REFINE verdict:** model agrees with the *direction* but proposes specific shape modifications (e.g., "yes to token pairs, but pairs should be derived not declared").
- **FLIP verdict:** model argues for the counter-position OR a third alternative entirely.

**Aggregate panel verdict:**
- 3/3 HOLD → strong baseline (operator lean validated; consider v1.0 lock candidate).
- 2/3 HOLD + 1/3 REFINE → soft baseline (refinement worth investigating; not a flip).
- 2/3 HOLD + 1/3 FLIP → INVESTIGATE the flip (1/3 architectural disagreement is signal worth understanding before locking).
- 1/3 HOLD + 2/3 REFINE/FLIP → REFINE the brainstorm position; re-survey before locking.
- 0/3 HOLD → FLIP entirely; the operator lean is the wrong direction.

## Files

- `prompts.md` — 5 architectural questions with anti-anchored framing (operator lean + counter-position per question; pick-and-justify request).
- `injection-materials.md` — inventory of what the operator pastes per chat session (cheatsheet path, brainstorm summary excerpt, the 5 questions).
- `claude-opus-4-7.md` — placeholder; filled when operator runs Opus session.
- `gpt-5.5.md` — placeholder; filled when operator runs GPT session.
- `gemini-3.1-pro.md` — placeholder; filled when operator runs Gemini Pro session.
- This file — pre-registration above; **post-panel synthesis appended below after run.**

## Run sequence (operator-side)

1. Open three fresh browser tabs: Claude.ai, ChatGPT, Google AI Studio (or Gemini chat).
2. For each model:
   - Paste the cheatsheet (`spec/v0.21.1-cheatsheet.md`, ~8000 words) as the first message + "use this as the architectural reference for the questions that follow."
   - Then paste the brainstorm summary excerpt (operator can curate from doc 134, or use the full doc — operator's call).
   - Then paste each question (one at a time OR all five at once — operator's call; one-at-a-time gets more focused per-question reasoning, all-at-once gets faster overall).
3. Save responses verbatim into the per-model `.md` file with question-separated sections (matching `tests/v0.21-stage3-chat-mode/` per-model file shape).
4. After all three models complete: synthesise per-question convergence into the post-run section of this README. **No automated synthesis** per `docs/private/104` automation principle — convergence-counting is human judgement.
5. Update `docs/private/134` with panel-feedback annotations per position. Decide v0.22+ scope adjustments (if any) post-synthesis.

---

## Synthesis (run 2026-05-01, n=4 cells — operator added Gemini 3 Flash beyond planned 3-cell trio)

**Verdict at the panel level:** STRONG SIGNAL — 4/4 against the operator lean as stated on Q1, Q3 (with stronger-than-leaned counter); 4/4 toward operator lean with substantive refinement on Q2, Q4; 3/4 HOLD on Q5 with 1/4 REFINE-toward-auto-generation. Cycle cost: $0 (chat-mode), ~90 min operator-attention (run + capture + this synthesis).

### Convergence by question

| Question | Pro | Flash | GPT-5.3 | Opus 4.7 | Aggregate |
|---|---|---|---|---|---|
| **Q1** Wireframe vs semantic split | FLIP (HIGH) | FLIP (HIGH) | REFINE | REFINE (MED-HIGH) | **4/4 against split as stated**; 2/4 FLIP (no new shape primitives — layouts can do circles via `rounded:` + `background:`); 2/4 REFINE (add only `rectangle`/`circle`/`line`, drop the wireframe-vs-semantic taxonomy, drop duplicates `text`/`heading`/`link`) |
| **Q2** Modular interactivity | REFINE (HIGH) | REFINE (HIGH) | REFINE | HOLD-with-strong-refinement (MED) | **4/4 toward modular interactivity** + **3/4 require explicit `role:` at parse-time** (Opus + GPT + Flash). 1/4 (Pro) wants compiler to auto-imply `role: button` instead — outlier; majority rejects as magic. **Bounded `role:` enum** (`button`/`link`/`tab`/`switch`/`option`/`none`) recommended by Opus; tokens-not-strings consistent with rest of spec. |
| **Q3** Flow-only vs bounded-offset | FLIP (HIGH) | HOLD (MED) | HOLD (HIGH) | FLIP-to-counter (HIGH) | **4/4 against bounded-offset** — stronger than operator lean (which deferred). 2/4 FLIP (kill it from the roadmap entirely; not even v1.x). 2/4 HOLD (flow-only confirmed). **2/4 (Opus + Flash + GPT spacing-shim) propose `layout stack:` primitive** with alignment tokens (`top_left`/`bottom_right`/etc.) for FAB/badge/popover/overlay use cases. |
| **Q4** Studio canvas semantics | REFINE (MED) | HOLD (HIGH) | HOLD (HIGH) | REFINE (MED-HIGH) | **4/4 toward direct-manipulation, NOT Figma-clone.** Direct-manipulation must be **structurally constrained** (snap-to-spacing-token handles, drag-to-reorder children, drag-padding-handles, no freehand x/y placement). Opus's "narrow direct-manipulation channels in mostly-render-preview canvas" frames the consensus shape cleanly. |
| **Q5** Token pair system | HOLD (HIGH) | REFINE (MED) | HOLD (HIGH) | HOLD-on-(b)-with-refinement (MED) | **3/4 HOLD** on explicit pairs (operator lean — Position 7). 1/4 REFINE (Flash — auto-generate `on_X` via WCAG with explicit override). Convergent cross-cutting agreement: **NOT auto-contrast luminance-magic at runtime; NOT per-primitive override; YES pairs (built-in or auto-generated, with override).** |

### Cross-cutting observations

1. **Strongest cross-model convergence: explicit-`role:`-at-parse-time (Q2) + against-bounded-offset (Q3) + structurally-constrained-Studio (Q4).** All three cluster around the same architectural principle: **"Igni is a constrained-vocabulary DSL; the canvas constrains gestures to the vocabulary, not the other way around."** Three independent question framings producing the same underlying insight is the strongest possible cross-model signal pattern (matches the "convergence of divergence" pattern from `docs/private/115_igni_studio_strategy.md` 2026-04-28 panel).

2. **Q1 is the primary scope-revision signal.** Operator's wireframe-vs-semantic-families framing was 4/4 rejected as a *taxonomy*; only the underlying "add 3 shape primitives" piece survived (2/4). The dogfood-side motivation (Finding F + custom-button shapes) needs Q2 (modular interactivity) more than it needs Q1 (new shape primitives). v0.22+ scope: only ship `rectangle`/`circle`/`line` if a real-app or panel signal demands them; Q2's modular interactivity + `role:` system is the higher-priority bundle.

3. **Q3's `layout stack:` proposal is a NEW design candidate not in doc 134's seven positions.** Opus + GPT both name a stacking primitive (overlay-style; alignment-token-anchored; replaces the legitimate use cases bounded-offset would have served). This is the panel surfacing a position the operator didn't see — the third-position outcome the panel methodology is designed to produce. **`layout stack:` joins the v0.22+ scope queue as a Position 8 candidate.**

4. **Q4 has minimal language-side ask.** Studio's direct-manipulation can be implemented entirely with existing v0.21.1 surface (token-only discipline) plus the v0.22+ candidates from Q2 + Q3 (role: + stacking). **No new language-design work is required for Studio's canvas direction; the Studio-direction document (doc 115) needs an annotation update to reflect "narrow direct-manipulation channels" framing.**

5. **Q5 (token pairs) is closest to a clean operator-lock.** 3/4 HOLD + 1/4 minor refinement. Smallest design surface among the panel's recommendations. Could fast-track to a v0.22 docs/codegen patch if shape stays small (per-primitive `on_X` lookup via `theme: color:` pairs + parse-time error on missing pair for user-defined tokens).

6. **Methodology data points (chapter §4 catalogue queue):**
   - **n=3 instance of chat-mode strategic-critique pattern; first at v1.0-architectural level.** Methodology contribution per pre-registration validated — the instrument scaled to architectural-direction questions cleanly. Operator-attention cost (~90 min run + ~60 min synthesis = 2.5 hr total) matches the honest timing estimate.
   - **Convergence-of-divergence (per doc 115) reproduced.** Three different questions (Q2 + Q3 + Q4) producing the same underlying architectural principle (constrained-vocabulary DSL + canvas-obeys-language) is the same signal-pattern shape doc 115 catalogued.
   - **Anti-anchoring discipline worked.** Counter-positions in each question were taken seriously by the panel (4/4 FLIP on Q1; 4/4 with refinements on Q2; 4/4 against bounded-offset on Q3 — counter-positions were chosen on merit, not just rebutted). The panel did not pattern-match to operator framing.
   - **Smaller-model differential teaching surface (Flash) reproduces.** Flash's REFINE on Q5 (auto-generate `on_X`) is the only outlier from the 3/4-HOLD pattern; consistent with the n=3 prior pattern from `docs/private/130` of smaller Gemini models surfacing teaching-gap-shaped reaches.

### v0.22+ scope-decision recommendations (operator decides; CC frames the candidates)

| Candidate | Source | Scope shape | Recommendation |
|---|---|---|---|
| **A. `rectangle`/`circle`/`line` + `role:` system + modular interactivity bundle** | Q1 + Q2 | Spec change (3 new primitives + 1 new property + parse-time rule); Stage 1 design note → Stage 2 → Stage 0 → impl → Stage 3 (~5-6 sessions) | **Bundle because co-dependent.** Q2's role: rule needs Q1's new primitives to be load-bearing (without shape primitives, modular interactivity is just "extend layouts further" which isn't a v0.22-class spec ship). |
| **B. `layout stack:` + alignment-token expansion (8 directions)** | Q3 (NEW Position 8 from panel) | Spec change (1 new layout direction + ~6 new alignment tokens); could be a small spec ship within v0.22 cycle bandwidth | **Defer Stage 1 design until A is locked.** Stack composes with the role: system if shape primitives can be stack children with role: on tap. |
| **C. Token pair system in `theme: color:`** | Q5 | Docs + codegen patch (no new syntax — extend `theme: color:` validation + add `on_X` lookup at button text rendering); could be small ship parallel to v0.22 cycle | **Fast-track candidate.** Smallest design surface; addresses calc dogfood Finding H directly. Could ship as v0.21.2 small ship if scope holds. |
| **D. Studio direction document update (doc 115)** | Q4 | Strategy doc only — append "narrow direct-manipulation channels" framing + bounded-gesture vocabulary; no language change | **Methodology task, not cycle-shape.** Land alongside any v0.22+ ship. |

**Cycle reshape implication for v0.22 (vs combined-cycle plan's bundled hover + narrow a11y):** the panel surfaces Q2's modular-interactivity-with-role: as architecturally adjacent to hover (both about "what can layouts/shapes do?"). Possible reshape: **v0.22 = hover + role: + modular interactivity** (Q1 deferred or partial); narrow a11y demoted to v0.23. Or **v0.22 = unchanged (hover + narrow a11y); v0.23 = modular interactivity bundle**. Operator decides at the next cycle-prep gate; this synthesis flags the option without locking it.

### Anomaly notes

- **GPT-5.3 split-paste artefact:** Q1+Q2 in one delivery (markdown bullet style), Q3+Q4+Q5 in a second delivery (Verdict/Confidence/Reasoning style with explicit headers). No degradation in reasoning quality; just stylistic variance. Likely operator paste-action split.
- **Minor verbatim-capture truncations in chat-paste source:**
  - GPT-5.3 Q3: "If a designer nudges an elemeserts" — looks like a word boundary got cut in chat-mode rendering.
  - Gemini Pro Q2: "`on touch:`" rendered as "n touch:`" — quote character truncation.
  - Gemini Flash Q2: "compiler requiree:`" — similar truncation.
  - Gemini Flash Q3: "thinkFlow." — space dropped.
  None affect the substance of the verdicts; preserved verbatim per methodology rule.
- **Cost target validation:** $0 chat-mode + ~90 min operator-attention matches the honest timing estimate from pre-registration (60-90 min run + 60-90 min synthesis). No cost overrun this cycle (different from the per-provider-cache-isolation API-mode trap; chat-mode is genuinely free).

### Handoff

- **`docs/private/134_v1_studio_brainstorm.md`** gets per-position panel-feedback annotations (operator decides post-panel; scaffold ready to fill).
- **`docs/private/115_igni_studio_strategy.md`** gets a 2026-05-01 "Q4 panel feedback" addendum re: narrow direct-manipulation channels framing.
- **v0.22+ scope decision** happens at next cycle-prep gate (post calc-dogfood-Session-1-ship/bail). This synthesis is input.
