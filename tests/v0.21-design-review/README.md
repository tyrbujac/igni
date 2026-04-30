# v0.21 persistence + reactive-fetch-race design review — Stage 2

Stage 2 panel — 3 frontier models critique two paired design notes (doc 126 persistence + doc 121 reactive-fetch-race) before any spec edit lands. Both are v0.21 cycle workstreams; bundling saves cycle bandwidth.

## What's at stake

**Persistence (doc 126):** Q1 (scope: Tier 1 in v1.0, Tier 3 "fetch() forever" out indefinitely) + Q3 (trajectory: Tier-1-only acceptable for v1.0) Tyr-locked under doc 122's 4/4 unanimous panel. **Q2 (shape) LOCKED → Option A (wrapper-builtin `shared.X = persist(initial)`)** under operator confidence 2026-04-30. Q4 (multi-file collision: silent-merge) + Q5 (cross-wrapper rejection: parse-time) honest-leaned.

**Reactive-fetch-race (doc 121):** 3 candidate fix shapes (A: latest-URL-wins guard at completion time; B: cancellation via http.Client.close; C: request-counter token). Honest-lean: **Shape A + Shape C fallback** (A handles canonical URL-changes; C handles non-URL-driven re-fires).

## Panel framing

5-question framework. **Q1 anti-anchored against Option A** (persistence shape) and **Q3 anti-anchored against Shape A** (race-conditions). Anti-anchoring matches the v0.20 + v0.19 Stage 2 precedent — guards against panel agreement that's more anchoring than load-bearing critique.

Run via `npx tsx tests/runner/cold-test.ts --no-spec --no-grade --prompts tests/v0.21-design-review/prompts.md --out tests/v0.21-design-review --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview`. Outputs are prose, not Igni source.

Cost estimate: ~$0.30 (matches v0.20-design-review's $0.2985 — same shape, same model panel).

## Pre-registered ship bars

Per spec-cycle skill convention. Locked BEFORE the panel runs.

- **3/3 HOLD** on Option A + Shape A (no panel cell flips on architectural grounds; minor refinements may apply) → Stage 1 locks confirmed; proceed to Stage 0 cheatsheet cold-test in v0.21 cycle.
- **2/3 REFINE** with substantive patches → apply patches to design notes 126 + 121, no shape flip.
- **2/3 FLIP** to B/C (persistence) or B/C (race-conditions) on architectural grounds → Trigger A fires (see below).
- **1/3 single-model raise** → log to design notes' Open-questions section; consider for v0.22 docs-iteration.

## Trigger A pre-registration

If 2/3+ cells produce FLIP verdict on Q1 (architectural arguments against Option A converging on `shared persisted:` sub-block shape), principled-minority pattern instance 5 fires (extending `docs/private/114`'s 4 prior instances). Pause Stage 2 close, surface to Tyr per `docs/private/114` precedent. Don't auto-flip.

Symmetric Trigger A applies to Q3: if 2/3+ FLIP toward Shape B (cancellation) or Shape C (counter-only) on architectural grounds, pause + surface.

## Treat panel responses as input to a Tyr decision, not the decision itself

Patch decision (per spec-cycle skill rules):
- 3/3 convergent on a refinement → patch design notes.
- 2/3 → consider; surface to Tyr.
- 1/3 → log only.

## Files

- `prompts.md` — single-prompt 5-question framework with embedded design-note content.
- `<model>_none_v0-21-persistence-and-race-conditions-design-critique.{md,json}` — outputs (filled after run).
- This file — pre-registration above, post-run synthesis below.

## Synthesis (run 2026-04-30)

**Verdict — Trigger A FIRES on Q1 (persistence shape) AND Q3 (race-conditions shape).** Both Stage 1 leans (Option A persistence + Shape A race-conditions) face substantive architectural objections. **2/3 FLIP on Q1** (Claude → B, Gemini → C; GPT REFINE-A); **3/3 FLIP on Q3** (Claude → B+C, GPT → C-only, Gemini → C+B). 3/3 FLIP on Q4 silent-merge (compile-time error on conflicting persisted declarations). 3/3 REFINE on Q5 cross-wrapper rejection (broaden to JSON-literal-only rule). Patches paused per pre-registration; surfacing to Tyr per `docs/private/114` precedent. Don't auto-flip.

**Cost:** $0.3476 across 3 cells (Claude $0.13, Gemini $0.02, GPT $0.20). Wallclock ~10 min sequential.

### Convergence table

| Q | Anti-anchor target | Claude verdict | GPT verdict | Gemini verdict | Outcome |
|---|---|---|---|---|---|
| **Q1 — persistence shape** | Option A wrapper-builtin | **FLIP → B** (annotated-block) | **REFINE A** (stricter constraints) | **FLIP → C** (top-level `persist:` block) | **2/3 FLIP architectural grounds → Trigger A** |
| **Q2 — Q4 collision + Q5 cross-wrapper** | silent-merge / 3-rejection list | **Q4 FLIP** to (b)/(c); **Q5 REFINE** (add non-deterministic + non-serialisable) | **Q4 FLIP** (compile-time error); **Q5 REFINE** (JSON-literal-only rule) | **Q4 FLIP** (parse-time rejection); **Q5 REFINE** (add `persist(now())` rejection) | **3/3 FLIP Q4** (durability of failure); **3/3 REFINE Q5** (broaden to JSON-literal-only) |
| **Q3 — race-conditions shape** | Shape A (URL guard + C fallback) | **FLIP → B+C** (B prevents dispose-class bug; C is the liveness token) | **FLIP → C-only** (generation-token as semantic rule, B as optimization) | **FLIP → C+B** (C universal; B for unmounts) | **3/3 FLIP — Shape A unanimously rejected on architectural grounds** |
| **Q4 — peer-language survey** | — | persistence: explicit-key pattern; race: cancellation-on-lifecycle | persistence: declaration-at-source-of-state; race: key/generation-scoped + lifecycle cancellation | persistence: explicit-key decoupling; race: cancellation industry standard | **Convergent**: every modern reactive framework uses cancellation+lifecycle, not URL guards |
| **Q5 — principled-minority self-prediction** | — | already flipped both | already flipped Q3, REFINE Q1 with explicit framing for Tyr-reversal-to-B/C | already flipped both, predicts Tyr-reversal voice for Q1→C and Q3→C+B | All three model the principled-minority case explicitly |

### Per-Q decision (per spec-cycle skill rules: 3/3 = patch, 2/3 = consider, 1/3 = log)

**Q1 (persistence shape) — TRIGGER A — pause for Tyr decision.** 2/3 FLIP on architectural grounds, but split between B (Claude) and C (Gemini). The convergent objection is *"Option A treats `persist()` as a wrapper-builtin like `fetch()`/`spring()`, but it's actually a storage-class declaration with one-shot initial-only argument semantics — the `name(arg)` shape lies about reactivity and creates a 'magic argument' (`persist(now())` captures install time, not now)."* This is genuinely load-bearing. Tyr decides: hold A under principled-minority pattern (instance 5; matches doc 114 precedent), accept B, accept C, or operator-honest reframe.

**Q2 — Q4 silent-merge — 3/3 FLIP, patch.** All three cells independently identified the durability-of-failure asymmetry (volatile shared = transient bug; persisted shared = bug survives source removal). Patch doc 126 Q4: replace silent-merge lean with compile-time-error-on-conflicting-persisted-declarations rule. Concrete rule per panel convergence: *"A persisted shared name may be declared exactly once per app."*

**Q2 — Q5 cross-wrapper rejection — 3/3 REFINE, patch.** Three concrete examples are correct but under-specified. Generalize to: *"`persist()` accepts only JSON-serialisable literal defaults: string, number, boolean, null, lists/maps composed only of the same. Function calls (including `now()`, `uuid()`, `random()`), wrapper calls (`fetch()`, `spring()`), variable references, and nested expressions are parse-time rejected."* The three concrete rejections become specialised cases of this broader rule. Patch doc 126 Q5.

**Q3 (race-conditions shape) — TRIGGER A — pause for Tyr decision.** 3/3 FLIP — strongest possible verdict against Shape A. Convergent shape: **C-only as the semantic rule** (generation-token / counter); **B (cancellation) as implementation optimization** for bandwidth + dispose hygiene; URL guard discarded. Peer-language survey unanimous: every modern reactive framework (SwiftUI `.task(id:)`, React Query, Compose `LaunchedEffect(key)`) uses key/generation-scoped + lifecycle cancellation, not URL-equality guards. Doc 121's recommended Shape A + Shape C fallback is architecturally incomplete (admits A doesn't handle non-URL-driven re-fires; the cleaner rule is C-only with optional B). Tyr decides: hold A under principled-minority pattern (would require strong dispose-handling story), accept C-only, or accept C+B-as-optimization.

### Trigger A status — FIRED on Q1 + Q3

**Principled-minority pattern instance 5+6 candidates** (extending `docs/private/114`'s 4 prior instances). Per pre-registration: pause Stage 2 close, surface to Tyr; don't auto-flip. Tyr's reversal options for each Q:

- **Q1 hold A** with stricter framing per GPT's REFINE (declaration-position-only; JSON-literal-only argument; compile-time-error on duplicate persisted keys; admit in design note that `persist()` is not a general expression function). Q4+Q5 patches still apply.
- **Q1 flip A → B** per Claude (annotated-block `shared persisted:` makes durability honest at declaration site; preserves `shared.X` access; sub-block flavour is a *distinction* not an *alternative*).
- **Q1 flip A → C** per Gemini (top-level `persist:` block parallel to `shared:`; semantically honest; "blocks define storage context" reads cleaner than wrapper-as-storage-class).
- **Q3 hold A** would require articulating why URL-guard + C fallback is preferable to peer-language convergent C-only-with-lifecycle-cancellation. Hard to defend without a strong principle.
- **Q3 flip A → C-only** matches all three cells' convergence; cleanest "one way to do everything" + matches peer languages + handles non-URL-driven re-fires natively.
- **Q3 flip A → C+B** adds cancellation as quality-of-life (bandwidth + dispose hygiene); slightly larger codegen surface but matches industry standard.

### Methodology observations

- **First Stage 2 panel where BOTH Q1 and Q3 anti-anchors fired Trigger A.** Prior Stage 2 panels (v0.19, v0.20) had Q1-only Trigger A or principled-minority resolution on a single question. v0.21 has two simultaneous fires. Worth catalogueing as cycle-shape variant.
- **The wrapper-overload-at-fourth-instance concern (doc 126 §"Why A locked over B" anticipated this) was substantively pressed by 2/3 cells.** The Stage 1 lock under operator confidence was honest — n=4 cross-source signal was stronger than v0.20.4's n=1 — but the architectural axis turned out to be load-bearing in a way the lock didn't fully account for. Methodology lesson: *operator-confidence locks under cross-source threshold can still meet architectural pushback; anti-anchored Stage 2 is the load-bearing instrument that catches it.*
- **Peer-language convergence on race-conditions** (3/3 cells reach the same survey conclusion) is methodology-grade independent corroboration. When peer languages have universally moved past a pattern (URL-guard) and Igni's draft proposes that pattern, the absence of any modern peer using it is itself signal.

### Patch list — Tyr decisions (2026-04-30)

**Q1 — FLIPPED A → B (`shared persisted:` annotated block).** Tyr-decision rationale (per syntax reading + load-bearing argument-semantic asymmetry):
- Refined-A's parens-overhead becomes annoying when persisting many variables (4 calls vs single block declaring 4).
- Refined-A is B-shaped with parens-syntax (cosmetic difference, not functional).
- B's variant-pair shape matches `theme:` / `theme dark:` precedent shipped in v0.20 — sub-block flavour declares variant of same primitive class.
- Persistence IS a flavour of shared state, not a separate category (rejecting Gemini's C which would create a third top-level state block).
- B preserves `shared.X` access pattern across volatile + persisted variables.

**Q3 — FLIPPED A → C+B (counter-token + `http.Client.close()`).** CC-delegated decision per Tyr ("your call based on codegen-tradeoff read"). Rationale:
- Codegen surface bounded (~10 extra lines/fetch vs ~5 for C-only). Both small absolute counts.
- Peer-language convergence is universal (SwiftUI `.task(id:)`, React Query, Compose `LaunchedEffect(key)` all ship cancellation+lifecycle). Shipping C-only would put Igni alone among modern reactive frameworks.
- Bandwidth savings on slider-drag surfaces are user-visible (mobile data + battery; canonical bad case).
- Web partial-cancellation caveat (`http.Client.close()` is best-effort on Flutter Web) is documentable; counter-token correctness backstop catches anything close() misses.
- C+B foundation makes future cancellation refinements incremental rather than re-architecting.

**Q4 — FLIPPED to parse-time error.** All 3/3 panel cells independently identified durability-of-failure asymmetry. Concrete rule: *"A persisted shared name may be declared exactly once per app."* Cross-file collision is parse-time error.

**Q5 — REFINED to JSON-literal-only generalized rule.** All 3/3 panel cells flagged the operator-honest-lean as correct in shape but under-specified — the three concrete rejections miss `persist(now())` / `persist(uuid())` / function-call categories. Concrete rule: *"`persist()` accepts only JSON-serialisable literal defaults: string, number, boolean, null, or lists/maps composed only of the same."*

All four patches applied to docs 126 + 121 in this session. Cycle status table updated; Stage 2 → Stage 0 (cheatsheet cold-test) per `spec-cycle` skill cycle.

### Methodology contributions catalogued (chapter §4 queue)

**11 + 12 (this session arc):** *Split-alternative Trigger A* — principled-minority sub-pattern where panel converges on "not the locked option" but splits across alternatives; architecture chooses replacement from non-converged candidates. Distinct from doc 114's instances 1-4 (panel converges on alternative; architecture honors-or-overrides).

- **Instance 5 (Q1 here):** panel rejects A, splits B (Claude) vs C (Gemini); architecture picks B per syntax-reading + load-bearing argument-semantic-asymmetry objection.
- **Instance 6 (Q3 here):** panel converges on "not A" with shared C-core but splits on cancellation depth (Claude → B+C; GPT → C-only-with-B-future; Gemini → C+B); architecture picks C+B per codegen-tradeoff read + peer-language convergence.

**First Stage 2 panel where both Q1 + Q3 anti-anchors fired Trigger A simultaneously** (10th methodology contribution, catalogued in commit `a9af164`'s message). Plus the split-alternative sub-pattern (11th + 12th, catalogued here).

### Files

- `tests/v0.21-design-review/README.md` — pre-registration above; this synthesis section + Tyr-decision patch list.
- `prompts.md` — single-prompt 5-Q anti-anchored framework.
- 3 cell outputs (`<model>_none_v0-21-persistence-reactive-fetch-race-design-critique.md`).
- `docs/private/126_v021_persistence.md` — Q2 FLIPPED A→B; Q4 + Q5 patches applied (gitignored).
- `docs/private/121_reactive_fetch_race.md` — FLIPPED A→C+B with codegen sketch + caveats (gitignored).

### Next-session opener

**Stage 0 cheatsheet cold-test for v0.21** (per `spec-cycle` skill cycle stage progression). Draft v0.21 cheatsheet additions:
- `shared persisted:` sub-block syntax + access pattern + JSON-literal rule + collision rule.
- `fetch()` re-fetch cancellation + counter-token semantic rule + best-effort-on-Web caveat.

Then 3 frontier models × 3 prompts cold-test to validate LLM cold-reach on the new shapes. ~$0.30-0.50, ~1 session.
