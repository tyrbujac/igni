# Chapter 5 — Methodology

> **Pre-draft status (2026-04-28).** This chapter is being pre-drafted ahead of formal dissertation start. Sections marked *(placeholder)* contain a one-sentence statement of what the section will argue but no full draft yet. Sub-section §4a (principled-minority reversal) is drafted to substantive completion as the first depth-first pass; other sub-sections will draft in subsequent weekly sessions per the cadence in `project_dissertation_cadence.md`. Tone is rough chapter prose; formal academic register, citations, length-shaping, and supervisor-input integration land at formalisation.

---

## What this chapter argues

This chapter argues that Igni's spec-iteration cycle is not merely a workflow used to build the language but a research instrument that surfaces methodological patterns about LLM-assisted language design. Igni is the case study; the cycle and the patterns it produces are the dissertation's primary methodological contribution. The chapter proceeds in seven sections: an introduction that frames the cycle as an instrument; a description of the instrument itself (the nine stages, the validation surfaces, the human-mediated synthesis layer the contribution rests on); a catalogue of four named patterns observed through cycle iteration, each with worked examples drawn from specific Igni versions; the empirical signal the cycle has accumulated through its trap-journal apparatus; the limitations and threats to validity that bound the contribution; and a conclusion restating what the cycle teaches that generalises beyond Igni.

---

## §1 — Introduction *(placeholder)*

*The chapter's framing argument: the cycle is a research instrument, not just a workflow; the patterns it surfaces are methodologically novel; Igni-the-language is the case study, not the deliverable. Position against existing literature on LLM evaluation in software engineering and on language-design methodology more broadly. State the four named patterns as the chapter's contribution proper.*

---

## §2 — The cycle as research instrument *(placeholder)*

*The 9-stage cycle from `docs/cycle.md` (Stage 0 cold-test prerequisite, Stage 1 design draft, Stage 2 pre-implementation panel critique, Stage 3 ship-validation panel, Stage 4 implementation, Stage 5 ship, Stage 6 trap-journal walk, Stage 7 retrospective synthesis, Stage 8 ROADMAP routing, Stage 9 strategic gate). The automation principle (`docs/private/104`) — plumbing yes, judgement no. How human-mediated synthesis is the contribution-bearing layer; what would be lost if the synthesis layers were automated. The cycle's iteration history (v0.2 through v0.19.1 as of writing).*

---

## §3 — Validation surfaces *(placeholder)*

*Stage 0 cold-test (frontier models reading cheatsheet cold; canonical-shape adoption rate; transpile-clean rate); Stage 2 pre-implementation panel critique (5-question framework; HOLD/REFINE/FLIP verdicts; convergence-counting); Stage 3 ship-validation panel (mixed frontier + flash-lite noise tier; canonical-reach measure). Per-minor-version chat-mode review (free; v0.14.1, v0.15.0, v0.17.0, v0.19.1 precedents). Prediction-test methodology (`docs/private/108`; 4-model panel asking "what does Igni do at runtime?" with `[GUESS]`/`[CANNOT PREDICT]` markers separating fact from convergent guessing). Frontier-cheatsheet zero-shot probe (lower-tier model + spec injected + real-app prompt as cheap signal-density instrument; `docs/private/trap-journal.md` 2026-04-27 entry). Each surface measures a different signal class; together they triangulate.*

---

## §4 — Named patterns

The cycle's iteration has surfaced four observable patterns whose specific shapes are the methodological contribution this chapter rests on. Each pattern was named after the cycle had produced enough instances to characterise it; none was designed top-down. Three are catalogued at multiple instances (principled-minority at three; synthesis-to-cheatsheet drift at two; no-flips-no-patches at one but distinguishable in shape from neighbouring outcomes), and one is novel from the most recent iteration (cross-question central-claim convergence, observed once in the Igni Studio strategic-critique panel of 2026-04-28).

The four patterns are, in the order they will be drafted:

- **§4a — Principled-minority reversal.** When a pre-implementation panel converges on the lower-friction default and the architect locks the principled-architectural objection, the architectural reversal wins. *Three instances. Drafted below.*
- **§4b — Synthesis-to-cheatsheet drift trap class.** When the cheatsheet draft over-promises relative to the language as actually shipped, panels propagate the wrong syntax cleanly through Stage 0 because the cheatsheet is the authoritative reference. *Two instances. Future session.*
- **§4c — Cross-question central-claim convergence.** When five independent question framings of a strategic-critique panel reduce to a single underlying diagnosis, the panel has produced its strongest possible signal — patch the central claim before any tactical changes. *One instance, novel. Future session.*
- **§4d — No-flips-no-patches outcome shape.** When Stage 2 panel + Stage 0 cold-test + Stage 3 ship-validation all hold without a single patch, the cycle has delivered its rarest shape: panel and architecture in full agreement. *One instance. Future session.*

The patterns are not exhaustive. Future cycles will surface more, and existing patterns will accumulate further instances that may force refinement of their boundaries. But each of the four has the property that, once named, future cycles can recognise the shape and route the cycle's response accordingly — they are catalogue entries, not theorems. The contribution is the catalogue itself.

---

### §4a — Principled-minority reversal

#### Pattern definition

When a pre-implementation panel converges on the lower-friction default — what Igni users would expect to type, what frontier models reach for unprompted, what minimises the spec change — and the architect's reversal locks the architectural-principle objection — what the language *should* mean given its design constraints, what preserves a load-bearing invariant three versions out — the architectural reversal wins. Three instances now show this shape across the cycle's history.

#### Why this pattern matters for the methodology argument

The pattern is evidence for a specific methodological insight: panel signal and architectural soundness measure different things, and the dissertation's instrument-set has to be able to tell them apart. Panel signal measures what frontier models converge on when reading a cheatsheet cold — and that convergence is dominated by familiarity-with-existing-frameworks, lowest-friction-to-write, and what-the-prompt-author-probably-wants. These are valid signals for ergonomic adoption, but they are independent of whether the language's invariants survive at scale. The architectural-principle objection, by contrast, comes from the design's invariants — load-bearing rules like "no magic," "one way to do everything," "visible coupling," "spec budget over backlog" — which are spec-design-time choices, not runtime conveniences. They do not move with usage.

When the panel-asked-question and the architecture-answered-question coincide, panel majority wins by definition: the panel is reading the right oracle. When they diverge, panel majority is no longer load-bearing for the architectural question, and the architect's reversal is the correct call. The pattern's three instances are evidence that this divergence happens in practice, often enough to catalogue as a recurring signal-shape rather than dismiss as one-off judgement-calls. This matters for the dissertation because the standard methodology toolkit in software-engineering research treats panel convergence as an unqualified positive signal — and the pattern is evidence that, for spec-design questions, that treatment is too coarse.

#### Three instances as worked examples

##### Instance 1 — v0.15.0 Q1: replace-only vs user-defined colour tokens

The v0.15.0 cycle introduced theme-block colour overrides — `theme: color: brand: "#FF6B35"` and similar. The Stage 2 design-review panel was asked whether the surface should be *replace-only* (designers can override Igni's twelve built-in colour tokens but cannot declare new ones) or *user-defined* (designers can override built-ins *and* declare arbitrary new tokens like `primary_700`). Replace-only is the lower-friction default — fewer rules to learn, smaller spec change, no name-collision policy needed. The panel leaned that way.

The architectural objection came from Path C, the project's commitment that Igni's primitives stay translatable from Figma's auto-layout vocabulary without escape hatches into raw Flutter. A representative real Figma file, hand-translated to anchor the Path C decision (`docs/private/99`), surfaced 23 semantic colour tokens — eight of which had no Igni equivalent. Replace-only could not represent that file without dropping tokens or aliasing them onto unrelated built-ins; either choice violated Path C's translation-without-loss commitment.

The reversal was to user-defined. Stage 0 ran 9/9 transpile-clean + 3/3 canonical adoption; Stage 3 ran 12/12 transpile + 4/4 canonical. The cycle shipped 2026-04-26, and subsequent cycles (v0.16, v0.17, v0.19) have used user-defined colour tokens as a load-bearing primitive without friction. The architectural objection was right; the panel's lower-friction lean would have shipped a cheatsheet that real Figma files could not translate against.

Sources: `docs/private/98_v0150_theme_color.md` (design note + reversal context); `tests/v0.15.0-design-review/` (Stage 2 raw outputs); `tests/v0.15.0-stage0/`, `tests/v0.15.0-stage3/` (cold-test + ship-validation outputs).

##### Instance 2 — v0.16.0 Q2: silent-drop vs require-explicit-discard via `_`

The v0.16.0 cycle introduced component event payloads — a child component can `emit X v` to pass a single positional value, and the parent's `on X(name): handler-body` names the receiver. The Stage 2 design-review panel was asked how to handle the mismatch case where a child emits a payload but the parent's handler is bare (`on X:`, no parens). Two options were live: *silent-drop* (the bare handler simply ignores the payload — minimum syntactic surface, most forgiving) or *require-explicit-discard via `_`* (the bare handler must be written `on X(_):` to acknowledge a payload it doesn't use; bare `on X:` is rejected at parse time when the child emits).

The panel leaned silent-drop, two-to-one with Claude's recommendation matching. The reasoning was ergonomic: payload mismatch is a corner case, the discard-keyword adds a new piece of syntax for users to learn, and most callers do not care about the payload they ignore. Silent-drop is the minimum-friction default.

The architectural objection cited two of Igni's load-bearing rules. *No magic* — if a payload exists and the parent silently ignores it, the parent's source no longer reflects what's flowing through the call site; the rule says any runtime behaviour should be visible in the source. *Visible coupling* — the discard is a coupling decision (the parent depends on the child's payload signature) that should appear at the call site, not be inferred from absence. The `_` discard form keeps source readability: `on submit:` means "no payload exists"; `on submit(_):` means "payload exists, parent doesn't need it." Silent-drop conflated those two cases into one syntactic surface.

The reversal was to `_` discard. Stage 0 + Stage 3 both passed 3/3 canonical, with cells reaching for `_` unprompted in cases where the prompt did not name the payload. The cycle shipped 2026-04-27. The architectural reading held: panel signal measured "is this easy to write?" and the architecture answered "does this preserve visible coupling?" — different questions, different oracles, divergence resolved by the invariant.

Sources: `docs/private/109_event_payload_binding.md`; `tests/v0.16-event-payload-design-review/`; `tests/v0.16.0-stage0/`, `tests/v0.16.0-stage3/`.

##### Instance 3 — v0.19 Q4c: current-frame vs target-value snapshot of `spring()`

The v0.19 cycle introduced `spring(value)` for declarative value-animation, and `snapshot "<name>"` for text-tree regression testing of the rendered widget tree. Stage 2 was asked: when a snapshot captures a widget that contains a `spring()`'d value mid-animation, should the captured value be the *current frame at test-clock time* (whatever the spring's interpolation has reached at the moment `snapshot` fires) or the *target value* (the destination the spring is animating toward, deterministic-by-construction)?

Two-of-three panel cells leaned current-frame. The reasoning was again ergonomic: snapshots are about "what the user sees right now"; if the spring is mid-flight the user sees the in-flight frame; capture that. The third cell (Opus) leaned target-value, citing the deterministic-by-construction property — `Tween.end` is readable directly from the rendered `TweenAnimationBuilder` without needing the test to call `pumpAndSettle()` first.

The architectural objection sat alongside the Opus minority. Snapshots in Igni are for *structural regressions* — node identity, branch/list structure, component names, bound layout properties, transition / spring state where applicable — not visual-frame regressions. Mid-flight visual capture is image-snapshot territory, which the v0.19 design explicitly defers to v0.20+ (per Q3 lock — text-tree only for v0.19). Capturing the current frame would conflate two semantically distinct test classes under one verb; the deterministic-by-construction property of target-capture preserved the test primitive's role within the testing primitive class shipped in v0.18 + v0.19.

The reversal was to target-value. Stage 0 ran strong-pass 9/9 across the full P1+P2+P3 prompt set. Stage 3 ran 4-frontier-model 12/12 cells canonical, with multiple cells citing the deterministic-by-construction framing verbatim (e.g., "snapshot captures `Tween.end`, no settle required") — indicating the architectural reading was not just defensible at synthesis time but transmissible through the cheatsheet to fresh-context frontier models. The cycle shipped 2026-04-28.

This instance was particularly interesting because the panel cells that leaned current-frame did so for a defensible methodological reason — they were optimising for "what the test author wants to see" — and the reversal explicitly acknowledged that defensibility while still locking against it. The architectural objection was not "the panel is wrong" but "the panel is right about something that isn't the architectural question."

Sources: `docs/private/113_v019_animation_snapshot.md` §Methodology note; `tests/v0.19-design-review/`; `tests/v0.19-stage0/`, `tests/v0.19-stage3/`.

#### Three-instance summary

| # | Date | Version | Question | Panel lean | Architectural lock | Reasoning | Outcome |
|---|---|---|---|---|---|---|---|
| 1 | 2026-04-26 | v0.15.0 Q1 | Replace-only vs user-defined colour tokens | Replace-only | User-defined | Path C requires representing 23 semantic tokens in the representative design system; replace-only drops 8 of them | Stage 0 + Stage 3 STRONG PASS |
| 2 | 2026-04-27 | v0.16.0 Q2 | Silent-drop vs `_` discard for unused emit payload | Silent-drop (2/1 + Claude rec) | `_` discard | No magic + visible coupling — discard is a coupling decision that must be visible at the call site | Stage 0 + Stage 3 STRONG PASS |
| 3 | 2026-04-28 | v0.19 Q4c | Current-frame vs target-value snapshot of `spring()` | Current-frame (2/3) | Target-value (1/3 minority) | Snapshots are for structural regressions, not visual-frame; deterministic-by-construction is load-bearing for the test primitive class | Stage 0 STRONG PASS; Stage 3 12/12 canonical with verbatim citation |

In each instance the panel's convergent shape was the lower-friction default a frontier model might expect to type; in each instance the architectural reversal preserved a load-bearing invariant of the design that the panel's question framing did not test against.

#### Heuristic — when the pattern applies

Three instances are not enough to pin a complete heuristic, but they cluster into three sub-categories which, taken together, predict when architectural reasoning should override panel majority.

The first is **spec-budget-N-versions-out vs current-version-usability**. The panel optimises for "easy to write today"; the architect must think about how the primitive composes with future v1.0-blockers. Q4c fits this pattern most cleanly — capturing the current frame at test-clock is easier to write today, but it would conflate the v0.19 snapshot semantic with the v0.20+ image-snapshot semantic by claiming the same name for two distinct primitives. The architect's reversal preserved name-disambiguation against future cycles.

The second is **load-bearing invariants challenged**. The design has named principles — no-magic, one-way-to-do-everything, visible-coupling, spec-budget — and the panel's lean would weaken one of them. Q2 in v0.16.0 fits: silent-drop violates no-magic and visible-coupling because it makes a coupling decision invisible. The reversal cited the rule by name; the rule is load-bearing for the language's overall coherence.

The third is **empirical evidence overrides projected ergonomics**. The panel projects ergonomic preferences from cheatsheet-cold context; actual hand-translation or real-app data may contradict the projection. Q1 in v0.15.0 fits: replace-only seemed simpler until a real Figma file was hand-translated and surfaced 23 tokens, eight beyond Igni's twelve built-ins. Empirical data resolved a question that projected ergonomics could not.

The heuristic is unproven at three instances. Future cycles will refine it — whether through additional instances that fit cleanly into one of these three sub-categories, or through edge cases that force a fourth, or through reversals that turn out to have been wrong (a possibility the methodology must remain honest about). The catalogue grows; the rule firms up empirically.

#### What the pattern is *not*

The pattern is *not* a license to override panels reflexively. Two of the three Stage 2 panels in the v0.19 cycle held three-of-three on their respective locks (Q1 bundle, Q2 spring lock); the architectural reversal is reserved for cases where the architectural objection is concrete and load-bearing — citing a named invariant, pointing at a specific composition with a future-version primitive, or producing empirical data that contradicts the panel's projection. Vague preference is not enough.

The pattern is *not* panel-distrust. Panel signal is the dissertation's primary instrument for validating LLM-accuracy across multiple fronts — Stage 0 measures cheatsheet-as-language-teaching effectiveness; Stage 3 measures post-implementation transpile-cleanliness; chat-mode review measures whole-document readability. The principled-minority pattern is about cases where the *question being asked* of the panel does not match the *question the architecture answers*. When the questions match, panel majority wins; when they diverge, the architect's reversal is the correct call. Both directions are honoured by the same methodology.

The pattern is *not* architectural-principle absolutism. Each reversal cites a specific load-bearing rule — not "Tyr's preference" or "this feels wrong" but "this violates no-magic" or "this conflates the v0.19 snapshot semantic with v0.20's image-snapshot semantic." Without the invariant citation, the reversal would be override-by-fiat, which the panel-validation methodology is explicitly designed to prevent. The pattern's discipline is the citation-of-invariant; without it, the pattern collapses into reviewer-bias.

#### Distinguishing from neighbouring cycle outcomes

The principled-minority reversal sits in a lattice of four cycle outcomes, each defined by where panel signal and architectural assessment land relative to one another.

- **Trigger-A flip** — Stage 2 panel converges on a refinement; architect reads the refinement as a load-bearing improvement; the design is patched pre-implementation. Panel and architecture agree the design needs change.
- **Three-of-three HOLD** — Stage 2 panel converges with the design as drafted; architect reads no architectural objection. Panel and architecture agree the design is right.
- **Two-of-three split with no reversal** — panel disagreement; no architectural-principle objection load-bearing enough to override; architect defers to majority. Panel sets the direction; architecture has no separate signal.
- **Principled-minority reversal** — panel converges on a direction; architect's principled objection cites a load-bearing invariant; architecture wins. Panel and architecture *disagree*; architecture is the load-bearing oracle for the question being asked.

The principled-minority shape is the diagonal of this lattice — the case where panel and architecture disagree and the architecture wins. It is distinguishable from the other three by the citation pattern: the architect's reversal must cite a specific invariant that the panel-majority lean would weaken, and the citation must be auditable (a named principle, a concrete composition concern, or a piece of empirical data). Without the citation the reversal is not the pattern; it is one of the other three with the names rearranged.

The other three patterns catalogued in this chapter (§4b synthesis-to-cheatsheet drift; §4c cross-question central-claim convergence; §4d no-flips-no-patches) sit elsewhere in the cycle's outcome-space and are addressed in their own sub-sections.

#### Promotion path / open question

Two paths exist for what this catalogue becomes as the dissertation develops, with implications for the methodology chapter's contribution.

**Path P1 — Stage-2-synthesis-time guidance.** At synthesis time, the architect would ask explicitly: "is this a candidate principled-minority case? Which load-bearing invariant would the panel-majority lean weaken? Is the panel asking a different question than the architecture answers?" This promotes the pattern from observed-at-three-instances to checklist-item-during-synthesis. The risk is false positives — every panel disagreement gets flagged as "principled minority" and the architectural-principle objection becomes a refusal-to-update — which the §What the pattern is *not* discussion above is intended to mitigate.

**Path P2 — catalogue-only.** Treat the pattern as documented for the dissertation chapter without promoting it to a synthesis-time guidance item. Each future instance lengthens the catalogue; the pattern firms empirically; promotion to P1 waits until five-plus instances are accumulated. Lower risk of false-positive overrides; preserves the per-version judgement-laden character of synthesis that the automation principle (`docs/private/104`) makes load-bearing for the methodology chapter's broader argument.

The current recommendation is P2. Three instances is enough to document the pattern as observed but not enough to encode as guidance, and the methodology contribution is precisely the per-version human-mediated synthesis. A checklist item that automatically flags "principled minority" would tend toward over-application, which would itself be a methodology defect. Wait for the fifth instance, then revisit the promotion question.

The pattern is evidence — for the methodology chapter — that the cycle's instrument-set can distinguish *panel-asks-the-right-question* cases from *architecture-asks-a-different-question* cases, and that the distinction has a citable shape. Whether the catalogue becomes guidance is a separate question whose answer depends on more empirical data than three instances yield.

---

### §4b — Synthesis-to-cheatsheet drift trap class *(placeholder)*

*Two instances, both from the v0.19 cycle: (1) cheatsheet promised `width: spring(item.recency * 200)` on a horizontal layout but Igni's layout-property surface is token-only — numeric `width:` doesn't exist; 3/3 Stage 0 panel cells reached for the shape because the cheatsheet promised it. (2) cheatsheet had unquoted ISO timestamps `freeze_time: 2026-04-28T12:00:00Z` which don't lex — the dash-separated parts tokenise as Number/Minus/Number; 3/3 panel cells propagated the unquoted form. Pattern: cheatsheet over-promises relative to the language as actually shipped; panels propagate the wrong syntax cleanly through Stage 0 because the cheatsheet is the authoritative reference. Methodology improvement: a "cheatsheet vs design note vs current language surface" diff check before Stage 0 runs (lint-spec-trio.ts proposed in ROADMAP Stream 2). Distinguishable from doc-drift entries within the cheatsheet (table-vs-example contradictions): this is an outside-vs-inside contradiction (cheatsheet promises vs language reality), not a within-cheatsheet inconsistency.*

---

### §4c — Cross-question central-claim convergence *(placeholder)*

*One instance, novel from the Igni Studio strategic-critique panel of 2026-04-28 (`tests/igni-studio-strategy/`). The panel's five HOLD/REFINE/FLIP questions independently triangulated the same underlying diagnosis — the Studio pitch's "1:1 mapping" claim doesn't hold for behavioral primitives — through five different surfaces (round-trip mechanics, UI architecture, file-structure language-contradiction, competitive-moat collapse, failure-mode prediction). Pattern: when independent question framings reduce to one diagnosis across all questions of a strategic-critique panel, that diagnosis is the highest possible signal a strategic critique can produce; patch the central claim before any tactical changes. Distinguishable from convergence on a single specific finding (e.g. v0.19 Stage 2 3/3 HOLD on Q4c) because the convergence is across questions, not within a question. Distinguishable from the principled-minority pattern (§4a) because that's about reversal of panel majority on architectural grounds; this is the panel itself producing high-value cross-question agreement. Distinguishable from no-flips-no-patches (§4d) because the cells did propose changes — they just all converged on the same root cause. Catalogue-only for now (P3); promote to a Stage-2-design-review-skill heuristic if a second instance surfaces.*

---

### §4d — No-flips-no-patches outcome shape *(placeholder)*

*One instance, from the v0.19 cycle. Stage 2 panel held 3/3 on all five locks (Q1 bundle, Q2 spring lock, Q3 text-tree-only, Q4 mock-now/freeze_time bundle, Q5 token-only `transition:`). Stage 0 cold-test passed 9/9 strong-pass with no patches needed. Stage 3 ship-validation ran 12/12 canonical. The cycle had zero panel pushback on either design or teaching. Pattern: panel and architecture in full agreement; the design is right both as designed and as taught; no patches surface at any stage. Distinguishable from Trigger-A flips (panel and architecture both want change) and from principled-minority reversals (panel and architecture disagree, architecture wins). Rare — first instance across the project's Stage 2 + Stage 0 history. Methodologically valuable as a counter-example to the implicit assumption that Stage 2 always finds something to flip; sometimes the design just survives. Worth catalogueing because it shows the cycle is capable of producing both kinds of signal — the patches-needed kind and the design-survives kind — and that the cycle's discipline is not predicated on producing patches every iteration.*

---

## §5 — Empirical signal *(placeholder)*

*The trap-journal apparatus (`docs/private/trap-journal.md`) — append-only structured log of "what surprised the project," one row per surface, eleven categories (parser, codegen, scaffold, runtime, doc-drift, tooling, methodology, cli-ux, spec-design, performance, human), routes (ROADMAP-Imm/S2/S3, cookbook, memory, design-note, spec-patch, code-fix, deferred). 55 entries as of the 2026-04-28 aggregate snapshot. Category distributions: cli-ux 15 (post-mum-tester polish; stable), methodology 15 (now-dominant; cycle reflecting on itself), runtime 7, tooling 5, codegen 4, doc-drift 4, parser 3, scaffold 1, spec-design 1 (first instance — Gemini-3-flash zero-shot Pomodoro reaching for runtime-derived `theme:`; the previous snapshot's "spec has been getting it right" line no longer holds), performance 0, human 0. The "frontier LLMs miss bugs that non-technical users find" thesis from the previous aggregate snapshot has extended via Tyr's BMI hand-translation surfacing canonical user shapes that 12 fixtures + 12 Stage 3 panel cells did not exercise — two-of-two pattern across mum-tester (cli-ux/parser/codegen) and BMI (codegen int-payload mut, runtime gesture-detector, runtime shared.update). The trap-journal-as-research-instrument is itself a methodology contribution: structured-append-only logging of cycle surprises produces dissertation-evidence material as a side effect of the regular workflow, not as a separate research-collection step.*

---

## §6 — Limitations and threats to validity *(placeholder)*

*Small sample sizes per cycle — 3 frontier models per Stage 2/0/3 panel; 4 frontier + flash-lite for the chat-mode review; pattern instances catalogued at 1-3 instances each in this chapter. Single-author reviewer-self-bias — Tyr is the architect, the cycle-runner, the trap-journal author, and the dissertation author; methodology critiques of his own work are not externally validated in this thesis (mum-tester rounds + BMI hand-translation provide some external pressure but not full peer review). Dissertation-self-bias — Claude assists with cycle synthesis, design-note drafting, and chapter pre-drafting; the dissertation's claims about methodology rest in part on Claude's own retrospective analysis of work it helped author (flagged in `docs/private/102` review caveat). Panel-cell-failure-modes as instrumentation noise — gpt-5.5 length-cap incidents (v0.15.0 meta-review zero-output cell; mitigated via prompt-instruction concision in `docs/private/108`); gemini-pro network failures (logged in ROADMAP Stream 2 as panel-resilience concern; ≥6 cumulative failures across two Stage 3 rounds). The methodology chapter has to be honest about which findings rest on robust signal and which rest on small-sample-size observations that future cycles may revise.*

---

## §7 — Conclusion *(placeholder)*

*Restate: the cycle is a research instrument; the four named patterns (§4a-§4d) are the contribution proper; the empirical signal accumulated through the trap-journal apparatus (§5) supports the patterns at varying instance counts; the limitations (§6) bound the contribution honestly. What the contribution teaches that generalises beyond Igni: the methodology of LLM-assisted language design is not adequately captured by panel-convergence-as-positive-signal; the cycle's instrument-set has to be able to distinguish panel-asks-the-right-question from architecture-asks-a-different-question (§4a); the cheatsheet is a load-bearing surface that requires its own validation discipline distinct from spec-validation (§4b); strategic-critique panels can produce cross-question convergence as a single-claim signal (§4c); no-flips-no-patches is a valid cycle outcome that the methodology must be able to recognise without seeing it as failure (§4d). The trap-journal-as-research-instrument observation is itself a methodological contribution — append-only structured logging of cycle surprises produces dissertation evidence as a workflow side effect. Future research directions: refining the principled-minority heuristic toward a checklist by accumulating more instances; building tooling-level discipline against synthesis-to-cheatsheet drift (lint-spec-trio.ts); investigating whether cross-question central-claim convergence recurs across other strategic-critique panels (multi-instance corroboration); cataloguing additional cycle-outcome shapes as the project's iteration history extends.*
