# v0.19 animation + snapshot design review — Stage 2 panel

**Status: panel complete; synthesis below.** Stage 2 framing-critique panel against `docs/private/113_v019_animation_snapshot.md` (Stage 1 design + Q1–Q5 locked).

## What this is

Stage 2 panel against the **bundling rationale + Q2 spring-vs-duration pressure-test + canonical-example-bug check** of the v0.19 animation + snapshot design. Animation is the project's second framework-shaped cycle (after v0.18 testing). The Q2 lock (`spring(value)` declarative) was flagged by Tyr as the highest-pressure question — peer-language argues 3/4 toward spring, but Flutter (Igni's compile target) is duration-based.

Five sub-decisions were locked by Tyr 2026-04-28 (see doc 113 §Locked sub-decisions): Q1 split between `transition:` and value-animation; Q2 `spring(value)` declarative; Q3 text-tree-only snapshot; Q4 bundle `mock now:` / `freeze_time:`; Q5 token-only `transition:`. Stage 2 critiques 6 questions: bundling carry-forward (Q1), spring-vs-duration pressure-test (Q2), animation-surface boundary leak (Q3), canonical-example bug check (Q4), snapshot scope deferral (Q5), time-mock vocabulary completeness (Q6).

After this panel lands, patches inline per `stage-2-review` skill rules (3/3 → patch, 2/3 → consider, 1/3 → log). Then Stage 0 cold-test → implementation.

## Panel composition

| Model | Provider | ID | Notes |
|---|---|---|---|
| Claude Opus 4.7 | Anthropic | `claude-opus-4-7` | — |
| GPT-5.5 | OpenAI | `gpt-5.5` | (no `--effort` flag — mirrored doc 112's invocation) |
| Gemini 3.1 Pro Preview | Google | `gemini-3.1-pro-preview` | — |

Three frontier models per Stage 2 precedent. No flash-lite at this stage.

## Critique questions (six, in prompt order)

1. **Bundling rationale carry-forward.** Does the doc 112 Trigger-A pre-decision still hold from this side? Or animation-only-v0.19 + snapshot-v0.20?
2. **Spring vs duration (highest-pressure).** Does `spring(value)` declarative survive Flutter-runtime fit? Concrete prompt: write a SearchBox with animated dropdown height under both shapes.
3. **Animation-surface boundary leak (Q1+Q5 lock validation).** Does the "conditional renders only" boundary leak? Smallest patch?
4. **Canonical-example bug check.** Pomodonut-style hidden bugs in spring-in-each, freeze_time + advance, snapshot-of-spring, third-state-during-fade?
5. **Snapshot scope (Q3 lock validation).** Real regression bugs the text-tree deferral leaves uncatchable?
6. **Time-mock vocabulary completeness.** Is `mock now:` + `freeze_time:` + `mock every: advance` enough surface, or do we need `replay`/`step`/`at`/`tz`?

Output instruction: each question answered with explicit `hold / refine / flip` position + concrete evidence.

## Running the panel

API runner at `tests/runner/`. Invocation pattern (3 parallel runs, ~1–3 min each, total ~$0.27):

```bash
cd tests/runner

# Anthropic
npx tsx run.ts \
  --model claude-opus-4-7 \
  --no-spec --no-grade \
  --prompts ../v0.19-design-review/prompts.md \
  --out ../v0.19-design-review

# OpenAI
npx tsx run.ts \
  --model gpt-5.5 \
  --no-spec --no-grade \
  --prompts ../v0.19-design-review/prompts.md \
  --out ../v0.19-design-review

# Google Pro
npx tsx run.ts \
  --model gemini-3.1-pro-preview \
  --no-spec --no-grade \
  --prompts ../v0.19-design-review/prompts.md \
  --out ../v0.19-design-review
```

Outputs land as `<model>_none_v0-19-animation-snapshot-design-critique.{md,json}`.

## Out of scope

- Critiquing the locked sub-decisions Q1–Q5 directly (the prompt frames them as locks; the panel may pressure-test them but the framing is "does the lock survive?").
- Stage 0 prompt drafting. Begins after this synthesis lands and any doc-113 patches apply.
- Implementation. Begins after Stage 0 strong-passes.

---

## Synthesis (2026-04-28)

**Headline: ALL FIVE LOCKS HOLD AT 3/3.** No Trigger A on Q2 spring-vs-duration (the highest-pressure question per Tyr) — `spring(value)` declarative survives Flutter-runtime pressure-test 3/3. Bundle (Q1), text-tree scope (Q5), and vocabulary surface (Q6) also 3/3 HOLD. Q3 + Q4 + Q5-serializer surface several patch-worthy refinements: 1× treat-as-3/3 (Q3 tighten via compiler rejection), 4× 2/3 (Q4a row-keying, Q4b/Q4c semantic-must-specify with split lean, Q4d third-state interrupt clarification, Q5 serializer scope), 3× 1/3 (Q2 reduced-motion note, Q3 widen-to-label opposite direction, Q6 scoping clarity).

**Total cost:** $0.27075 (claude-opus-4-7 $0.104345 + gpt-5.5 $0.14373 + gemini-3.1-pro-preview $0.02272). Under the typical $0.30 Stage 2 budget; matches doc 112's $0.26 panel cost almost exactly.

### Q1 — Bundling rationale carry-forward (3/3 HOLD)

| Cell | Position | Argument |
|---|---|---|
| opus 4.7 | Hold | Strongest argument is the *third* one, not the symmetric ones: "designing the `mock now:` / `freeze_time:` surface twice is the actual cost of splitting." Animation-only-v0.19 produces a 6-month "claim-only docs" window. |
| gpt 5.5 | Hold | "Shipping animation without any snapshot surface would create primitives that are hard to regression-test, and waiting for image-fidelity snapshots before shipping any snapshot support would overfit v0.19 to the hardest version of the problem." |
| gemini 3.1 pro | Hold | "Splitting animation to v0.19 and snapshots to v0.20 would result in a cycle where you are shipping un-verifiable motion features. The text-tree snapshot approach is cheap enough to implement alongside animation." |

**Verdict:** **3/3 HOLD.** Trigger A on Q1 does not fire. Bundle survives.

**Patch decision:** No patch.

### Q2 — Spring vs duration (3/3 HOLD on the highest-pressure lock)

| Cell | Position | Argument |
|---|---|---|
| opus 4.7 | Hold (with 1/3 caveat) | "The Flutter outlier is real but not load-bearing for the lock. … `transition: 200ms` on a height value has no anchor in the language: transition between what and what? It needs a controller, a from-value, an AnimationController lifecycle — all the Flutter machinery the language was supposed to hide." Caveat: spec should explicitly note `spring()` reads OS reduced-motion at codegen. |
| gpt 5.5 | Hold | "Flutter being duration/controller-oriented is an implementation inconvenience, not a language-design blocker: Igni can codegen a keyed implicit animation/controller behind the lexical `spring` binding … and centralize reduced-motion behavior by making `spring(value)` return `value` immediately when motion is disabled." |
| gemini 3.1 pro | Hold | "In a duration model, an LLM must correctly attach the modifier to the layout node, creating a structural disconnect between the animating data state and the visual tree. With `dropdown_height = spring(items.length * row_height)`, the animation is intrinsically bound to the data via lexical reactivity." |

**Verdict:** **3/3 HOLD.** The headline finding. Q2 was framed as the highest-pressure pressure-test of the Stage 1 framing; the panel converged unanimously that:

1. `spring(value)` composes natively with lexical reactivity (target reassigns → spring re-targets, no controller lifecycle in source).
2. Duration shape is harder for LLMs to misuse — no syntactic anchor for "from-value" → invented `previous_value` variables, useEffect-style hooks, all the bracket-hell patterns Igni exists to delete.
3. Flutter's duration-controller model is an implementation/codegen problem, not a surface-syntax problem.

**Patch decision:** No flip. **1/3 single-model refinement (opus) — Tyr decision.** Add a one-sentence note to the spec that `spring()` honors OS reduced-motion at codegen (codegen collapses spring duration to zero when reduced-motion is set; centralizes the a11y hook). *Recommend apply* — small spec note, prevents an a11y regression that's already on the v1.0-blocker list (4/7 v0.17.0 meta-review). **Pending Tyr decision.**

### Q3 — Animation-surface boundary leak (3/3 REFINE; 2/3 TIGHTEN, 1/3 WIDEN)

| Cell | Position | Direction | Specific patch |
|---|---|---|---|
| opus 4.7 | Refine | **Tighten** | Spec for `spring(value)` must enumerate interpolatable types (numbers/lengths/colors). Error for `spring(non_interpolatable)`: *"use `transition: fade` on a conditional render instead."* Symmetric error for `transition:` misuse. |
| gpt 5.5 | Refine | **Tighten** | "`transition:` is only valid on a container whose immediate dynamic child set changes through `if`/`else` or `each` insertion/removal/replacement; it is not a scalar/layout/style animation mechanism." Compiler error: *"Use `spring(value)` for changing values; `transition:` only animates child replacement."* |
| gemini 3.1 pro | Refine | **Widen (opposite)** | Widen `transition: <token>` to apply directly to standard components displaying state (`label status, transition: fade` codegens to `AnimatedSwitcher` keyed on the variable). |

**Verdict:** **3/3 REFINE**, but the refinement direction splits **2/3 TIGHTEN** vs **1/3 WIDEN**. Per the `stage-2-review` skill rule "two models proposing the same fix → treat as 3/3," the tighten direction is patch-worthy.

The 2/3 (opus + gpt) converge on the *same mechanism* — compiler-level rejection with cross-pointing error messages. This closes the workaround-culture leak the question warned about (LLMs forcing conditional-render swaps to access `transition:` on values).

The 1/3 (gemini) goes the *opposite* direction — widen `transition:` to bare label/state changes. Has merit (cleanest LLM ergonomics for "fade this label when status changes") but conflicts with the Q1 lock that splits `transition:` from value-animation.

**Patch decision (Tyr's call):**

- **Recommended:** Apply opus+gpt tighten — add the diagnostic-rejection rule to doc 113 + queue for codegen implementation. **Pending Tyr decision.**
- **Recommended log:** Gemini's widen-to-label as a Stream 3 candidate to revisit if Stage 0 surfaces real friction with the tighter rule. **Pending Tyr decision.**

### Q4 — Canonical-example bug check (multiple sub-bugs)

#### Q4a — `spring()` in `each` row keying

| Cell | Position | Specific |
|---|---|---|
| opus 4.7 | Refine | "Spec must specify spring-state keying — almost certainly by stable row key, matching how Flutter's `Key` system works." Pomodonut-class bug: list reorder silently animates wrong values. |
| gpt 5.5 | Refine | "spring() inside each must have stable identity: the spring state should be keyed by the lexical binding plus the row identity, not by transient list index." |
| gemini 3.1 pro | Hold (partial) | "per-row spring works via standard tree-identity state retention." Doesn't explicitly disagree but doesn't specify the mechanism. |

**Verdict:** **2/3 REFINE on stable-row-key requirement.** Gemini's "natively resolves" doesn't conflict but doesn't reinforce. **Patch decision (Tyr's call):** apply 2/3 patch — spring state in `each` keyed by row identity. *Recommend apply.* **Pending Tyr decision.**

#### Q4b — `freeze_time:` + `mock every: advance` interaction

| Cell | Position | Proposed semantic |
|---|---|---|
| opus 4.7 | Refine | `freeze_time:` freezes `now()` only; `advance` advances both wall-clock-for-every-blocks **and** the frozen `now()` value by the advance amount. One consistent mental model. |
| gpt 5.5 | Refine | `freeze_time:` freezes `now()`/civil time only; `advance` controls the test scheduler/animation clock and continues to fire timers/every-blocks **even when civil time is frozen**. now() stays frozen. |
| gemini 3.1 pro | Refine | "`advance` must mutate the test-scoped frozen clock. If `freeze_time` locks `now()` to a static constant that `advance` cannot budge, time-based animations and their assertions will entirely fail to evaluate." |

**Verdict:** **3/3 REFINE on "must specify"**, but **2/3 (opus + gemini)** lean toward "advance moves `now()` forward together with the every-clock"; **1/3 (gpt)** argues for the cleaner separation "advance moves only the every-clock; `now()` stays frozen."

Both shapes are defensible. The 2/3 lean has the simpler mental model (one clock, advance moves everything). GPT's separation is cleaner for tests that *want* `now()` static while still ticking animations.

**Patch decision (Tyr's call — load-bearing semantic decision):** Lock semantics either at the 2/3 lean OR the 1/3 alternative. Both shapes need to be specified explicitly in doc 113 either way. **Pending Tyr decision.**

#### Q4c — Snapshot of a `spring()`'d value

| Cell | Position | Proposed semantic |
|---|---|---|
| opus 4.7 | Refine | Snapshot captures the **target** (logical-state, not visual-frame); deterministic-by-construction. Image-golden in v0.20 is where intermediate-frame capture lives. |
| gpt 5.5 | Refine | Snapshot captures the **current rendered frame at the current test scheduler time**, not the spring target. Mid-flight if not settled. |
| gemini 3.1 pro | Refine | Snapshot must rigorously capture the **exact mid-flight frame at the current test-clock time**, not the settled state. |

**Verdict:** **3/3 REFINE on "must specify"**, but **2/3 (gpt + gemini)** lean toward "current rendered frame at test-clock time" (mid-flight if not settled); **1/3 (opus)** argues for "target value, deterministic by construction."

This is **the single most load-bearing Q4 decision.** It determines whether snapshot tests are deterministic-by-construction (opus) or require explicit time-control discipline (gpt+gemini).

- **2/3 lean (current-frame):** Tests must use `advance` enough time to settle before snapshotting. More work, but matches what users expect from "snapshot the rendered tree."
- **1/3 alternative (target):** Snapshots auto-skip animation; matches "logical state" framing. Less work for users; arguably less powerful for animation regression.

**Patch decision (Tyr's call — load-bearing):** Lock the snapshot-of-spring semantic. Both directions need explicit specification in doc 113. **Pending Tyr decision.**

#### Q4d — Third-state assignment during `transition: fade`

| Cell | Position | Specific |
|---|---|---|
| opus 4.7 | Refine | "Flutter's `AnimatedSwitcher` handles this (interrupts in-flight transition, starts a new one), so codegen target is fine, but the spec should state the interrupt semantics." |
| gpt 5.5 | Refine | "AnimatedSwitcher keys must represent the branch/item identity, not merely child type or text." |
| gemini 3.1 pro | Hold (partial) | "AnimatedSwitcher handles sudden third-state interruptions gracefully." No explicit refinement. |

**Verdict:** **2/3 REFINE on clarifying the spec.** **Patch decision (Tyr's call):** apply clarifying note on `AnimatedSwitcher` interrupt + key-by-branch-identity semantics. *Recommend apply.* **Pending Tyr decision.**

### Q5 — Snapshot scope (3/3 HOLD on lock; 2/3 REFINE on serializer scope)

| Cell | Position | Refinement |
|---|---|---|
| opus 4.7 | Hold | None — text-tree-only is right; image/golden in v0.20 with focused design. |
| gpt 5.5 | Hold | **Serializer scope refinement:** "text-tree snapshot must not mean only visible strings; it needs to serialize enough render-tree structure to make animation regressions observable: node identity, branch/list structure, component names, relevant layout/chrome tokens, and transition/spring state." |
| gemini 3.1 pro | Hold | **Serializer scope refinement:** "text-tree serialization includes bound layout properties (e.g., outputting `<layout vertical padding="large" height="100">`)." |

**Verdict:** **3/3 HOLD on the v0.19 scope lock** (text-tree only, image deferred). **2/3 REFINE (gpt + gemini)** on the serializer scope — must include node identity + branch/list structure + component names + layout/chrome tokens + transition/spring state. Otherwise an `["Tyr"]`-only snapshot doesn't verify that `transition: fade` existed or that layout chrome is correct.

**Patch decision (Tyr's call):** This is the **highest-leverage patch in the synthesis**. Without it, snapshots are too thin to catch the regressions they exist to catch. *Recommend apply* as a spec rule on what `snapshot "<name>"` captures. **Pending Tyr decision.**

### Q6 — Time-mock vocabulary completeness (3/3 HOLD on rejecting expansion)

| Cell | Position | Refinement |
|---|---|---|
| opus 4.7 | Hold | Reject `replay`/`step`/`at`/`tz` — each violates spec budget or pre-empts i18n. Forward-looking note: `freeze_time: <iso-with-tz>` should not couple instant-vs-timezone in v0.19; let i18n design `mock tz:` separately in v0.21+. |
| gpt 5.5 | Hold (with refinement) | Reject vocabulary expansion. **Scoping clarity:** spec must specify that `mock now:` is ambient for the test/mock block per existing mock rules; `freeze_time:` has unambiguous block extent. |
| gemini 3.1 pro | Hold | Reject `replay`/`step`/`at`/`tz` — `step` is sugar over `advance`, `tz` belongs in i18n, etc. |

**Verdict:** **3/3 HOLD on rejecting vocabulary expansion.** Two single-model refinements:

- **1/3 (gpt) — scoping clarity** for `mock now:` ambient vs `freeze_time:` block extent. Small spec-clarity addition.
- **1/3 (opus) — forward-looking note** that `freeze_time:` should not couple with timezone in v0.19; v0.21 i18n design will own `mock tz:`.

**Patch decisions (Tyr's calls):**

- **Q6 scoping clarity (gpt 1/3):** Apply as minor patch now, or log to ROADMAP for follow-on iteration? **Pending Tyr decision.**
- **Q6 forward-looking note (opus 1/3):** Log to ROADMAP Stream 3 as a v0.21 i18n design-note dependency (recommended; not v0.19's problem). **Pending Tyr decision.**

### Patch list — Tyr's decisions (2026-04-28)

**APPLIED to doc 113 (8 patches):**

1. ✅ **Q3 tighten** — APPLIED. Compiler-level rejection of `transition:` on non-conditional-renders + `spring()` on non-interpolatable types, with cross-pointing error messages.
2. ✅ **Q4a — spring-in-each row keying** — APPLIED. Spring state in `each` keyed by row identity (matching Flutter's `Key` system), not list index.
3. ✅ **Q4d — transition: third-state interrupt** — APPLIED. `AnimatedSwitcher` keys represent branch/item identity; interrupt-and-restart semantics on third-state assignment.
4. ✅ **Q5 — snapshot serializer scope (HIGHEST-LEVERAGE)** — APPLIED. Text-tree captures node identity + branch/list structure + component names + bound layout properties + transition/spring state, not just visible strings.
5. ✅ **Q4b — `freeze_time:` + `advance` semantic** — LOCKED **Option A (2/3 lean)**. `advance` moves both the every-block scheduler and the frozen `now()` value forward together. Simpler mental model; matches what tests usually want; Option B's value is rare.
6. ✅ **Q4c — snapshot-of-spring semantic** — LOCKED **Option A (1/3 minority, against panel lean)**. Snapshot captures the target value, deterministic-by-construction.
   - **Reversal rationale:** Igni's snapshots are for catching structural regressions, not visual regressions. Determinism matters more than animation-state coverage. If users want mid-flight animation regression testing, that's image snapshots in v0.20 — the right tool for that job. The 2/3 panel argued for ergonomic-default (current frame); the 1/3 (opus) argued for architectural principle (deterministic-by-construction). Same methodology pattern as v0.15.0 Q1 reversal and v0.16.0 Q2 reversal — principled architectural objection outweighs ergonomic majority. **Third instance of the principled-minority-outweighs-ergonomic-majority pattern; recognised as a methodology contribution worth a chapter when the dissertation lands.** See doc 113 §Methodology note.
7. ✅ **Q2 reduced-motion note** — APPLIED. `spring()` honors OS reduced-motion at codegen (duration collapses to zero when reduced-motion enabled). A11y-defensive on a v1.0-blocker primitive class.
8. ✅ **Q6 scoping clarity (gpt)** — APPLIED. `mock now:` is ambient-scope per existing mock-block rules; `freeze_time:` has unambiguous block-extent.

**LOGGED to ROADMAP Stream 3 (2 items, 1/3 single-model):**

9. 📋 **Q3 widen (gemini)** — LOGGED. Stream 3 candidate: widen `transition:` to bare label state changes (`label status, transition: fade`). Revisit if Stage 0 surfaces friction with the tighter Q3-tighten rule applied above.
10. 📋 **Q6 forward-looking i18n note (opus)** — LOGGED. Stream 3: `freeze_time:` should not couple instant-vs-timezone in v0.19; v0.21 i18n design owns `mock tz:` separately.

### What stays unchanged (locks confirmed by 3/3 HOLD)

- **Q1 — bundle.** Animation + snapshot + time-mock all in v0.19. (3/3 HOLD; Trigger A does not fire.)
- **Q2 — `spring(value)` declarative.** Survives Flutter-runtime pressure-test 3/3. The headline finding.
- **Q3 + Q5 (token-only `transition:` on conditional renders only).** Boundary refined via tighten rule but the *direction* of the lock is unchanged.
- **Q4 — `mock now:` / `freeze_time:` bundle.** Time-mock infrastructure ships with v0.19. Internal semantics need lock (Q4b), but the bundle decision survives.
- **Q5 — snapshot scope = text-tree only.** Image/golden deferred to v0.20+. 3/3.
- **Q6 — vocabulary surface.** No `replay`/`step`/`at`/`tz` in v0.19. 3/3.

### Cost summary

| Model | Cost |
|---|---|
| claude-opus-4-7 | $0.104345 |
| gpt-5.5 | $0.143730 |
| gemini-3.1-pro-preview | $0.022720 |
| **Total** | **$0.270795** |

Under the typical $0.30 Stage 2 budget. Cumulative v0.19 cycle cost so far: **$0.27 (Stage 2)** + Stage 0 + implementation + Stage 3 still ahead.

### Next steps

1. ✅ **All 10 patch decisions locked by Tyr 2026-04-28.** 8 APPLIED to doc 113; 2 LOGGED to ROADMAP Stream 3.
2. ✅ **Doc 113 patches applied.** §Locked sub-decisions + §What v0.19 *is* updated. New §Stage 2 outcome section + §Methodology note added. Status line flipped to "Stage 1 + Stage 2 complete."
3. ✅ **ROADMAP updated.** v0.19 Stage 2 entry added to Recently shipped; Next-milestone line updated; Stream 3 entries appended for the 2 logged items.
4. **Stage 0 cold-test queued for a later session.** Separate runner cost (~$0.30 estimate based on doc 112's Stage 0). v0.19 cycle running cost so far: $0.27 (Stage 2 only).
