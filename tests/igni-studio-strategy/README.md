# Igni Studio strategic critique — 3-frontier-model panel synthesis

**Date:** 2026-04-28. **Method:** Stage 2-style strategic critique with cheatsheet (`spec/v0.19.1-cheatsheet.md`) attached as `--spec` system context + Igni Studio 200-word brief inline + 5 HOLD/REFINE/FLIP questions. **Models:** `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`. **Cost:** $0.5264 (over $0.30 estimate due to content density — opus 1961w + gpt 2298w + gemini 993w). **Wallclock:** ~6.5 min sequential. **Synthesis:** human-mediated per `docs/private/104` automation principle.

## Methodology note

Strategic critique adapts the Stage 2 5-question framework from "is the design right?" to "is the strategic claim right?" using HOLD/REFINE/FLIP verdicts. Two cells used non-standard verdict labels on later questions (Opus prose-only on Q4 + Q5; Gemini HOLD on Q5) — synthesis extracts the *judgment* from prose where the label is unclear. Notable methodology observation: across all five questions, the cells converged on the *same load-bearing diagnosis* (the "1:1 mapping" claim doesn't hold for behavioral primitives), but expressed it through different surfaces — round-trip mechanics (Q1), framing inadequacy (Q2), file-structure contradiction (Q3), competitive moat collapse (Q4), failure-mode prediction (Q5). The five questions independently triangulate the same underlying issue. This is the strongest possible signal pattern: *not* "the panel found different problems" but "the panel found one problem from five angles."

## Panel composition

| Model | File | Style |
|---|---|---|
| Claude Opus 4.7 | `claude-opus-4-7_cheatsheet_igni-studio-strategic-critique.md` | Most cheatsheet citation; named the "Cursor + Figma frame import" specific competitor move; "anticipate this now" non-standard Q5 verdict |
| GPT 5.5 | `gpt-5.5_cheatsheet_igni-studio-strategic-critique.md` | Most exhaustive shape inventory (8 round-trip-resistant Igni shapes catalogued); strongest taxonomy ("source of truth: `.igni`; tests: `*.test.igni`; snapshots: `__snapshots__`; generated indexes: disposable; Studio metadata: non-semantic only") |
| Gemini 3.1 Pro | `gemini-3.1-pro-preview_cheatsheet_igni-studio-strategic-critique.md` | Tightest output (993w); cleanest H/R/F discipline; named the "State & Action Graph" alternative most concretely (Unreal Blueprints analogy) |

## Convergence by question

### Q1 — Round-trip claim: 2/3 REFINE + 1/3 FLIP, **functionally 3/3 against the claim as stated**

| Specific shape flagged | Opus | GPT | Gemini | Convergence |
|---|---|---|---|---|
| Reactivity rule (top-level `=` vs `f()`) | ✓ | ✓ | ✓ | **3/3** |
| `every` blocks have no canvas representation | ✓ | ✓ | ✓ | **3/3** |
| Lambdas / list transforms (`filter(items, item => ...)`) | ✓ | ✓ | ✓ | **3/3** |
| `{base with key: value}` object updates | ✓ | ✓ | ✓ | **3/3** |
| Conditional/async branches (`is loading`/`is error`) | ✓ | ✓ | ✓ | **3/3** |
| Function bodies (multi-line imperative) | ✓ | ✓ | — | 2/3 |
| Tests (entire `*.test.igni` surface) | ✓ | ✓ | — | 2/3 |
| Component event contracts (`emit X v` + payload) | — | ✓ | — | 1/3 |

**Reframed claim** (what the panel converged on, paraphrased):
- Opus: "1:1 round-trip on the *renderable subset*; source-only authoring for behaviour, with AI agent assistance to bridge."
- GPT: "Lossless AST round-trip for all `.igni` files; visual round-trip for the subset of Igni whose semantics have Studio surfaces."
- Gemini: Round-trip only applies to UI primitives; logic requires a State & Action Graph surface (node-based, Unreal Blueprints-style).

The three reframings agree on substance: visual round-trip is bounded by the renderable subset, not the full language. They disagree on tooling: Opus says AI bridges, GPT says AST preservation marks source-only nodes, Gemini says add a node-graph behavior surface.

### Q2 — Four-panel framing: **3/3 REFINE**

| Finding | Opus | GPT | Gemini | Convergence |
|---|---|---|---|---|
| Drop the Scratch green-flag toggle | ✓ ("wrong metaphor — Igni reactive-by-construction") | ✓ ("Igni already hot reloads") | ✓ ("Igni's value prop is lexical reactivity; canvas should always be live") | **3/3** |
| Add a state/scenario inspector | ✓ "context inspector" | ✓ "state/scenario panel" | ✓ "State Inspector" | **3/3** |
| Demote AI agent from panel to action layer / command palette | — (keeps as panel, reframes) | ✓ "action layer over the project" | ✓ "ambient command palette" | 2/3 |
| Add diagnostics/problems surface | ~ implicit | ✓ "problems/test panel" | — | 1/3 explicit |
| Make cheatsheet/AGENTS context visible to user | ✓ "context inspector" | — | — | 1/3 |

**Reframings proposed**:
- Opus: 5 surfaces (canvas, source, preview, agent chat, context inspector) + 2 orthogonal modes (manipulate vs interact, live vs frozen).
- GPT: Stage / Source / Inspector / Bottom tray (problems, tests, snapshots, fetch mocks, console) / Agent command layer.
- Gemini: Canvas + Source + State + ambient AI command palette.

Convergent shape: replace the green-flag-toggled four-panel pitch with **three primary surfaces (canvas + source + state) + one transient agent layer + one diagnostics tray**. The reactive-by-construction property of Igni makes the live-vs-frozen toggle unnecessary; the missing surface across all three reframings is **state**, not preview.

### Q3 — File structure scaling: **3/3 against the proposed structure** (2/3 FLIP + 1/3 REFINE)

This is the strongest convergence in the panel. All three cells cite the *same cheatsheet line* as evidence:

> "`shared:` blocks across multiple files **compose into a single namespace** — `auth.igni` declaring `shared: user` and `cart.igni` declaring `shared: items` makes both `shared.user` and `shared.items` available everywhere."

The proposed Studio structure (singular `shared.igni`) literally contradicts the language's stated convention.

| Failure mode | Opus | GPT | Gemini | Convergence |
|---|---|---|---|---|
| `shared.igni` god-object | ✓ | ✓ | ✓ | **3/3** |
| Flat `screens/` namespace collisions at scale | ✓ | ✓ | ✓ | **3/3** |
| `tests/` folder contradicts cheatsheet co-location convention | ✓ explicit | ✓ explicit | ~ implicit | 2/3 explicit |
| `AGENTS.md` context-window saturation | ✓ | ✓ | — | 2/3 |
| `igni.config` risks proprietary shadow format | — | ✓ | — | 1/3 |

**Convergent shape change**: feature-based grouping with co-located tests + per-feature shared blocks.

- Opus: `shared/auth.igni` + `shared/cart.igni`; `screens/onboarding/Welcome.igni`; co-located `*.test.igni`; `agents/<domain>.md`.
- GPT: `features/auth/Login.igni` + `Login.test.igni` + `auth.shared.igni`; `__snapshots__/` per-folder; `.igni/` for generated indexes.
- Gemini: `features/auth/Login.igni` + `Login.test.igni` + `state.igni`; abandon top-level opinionated structure entirely.

The substantive recommendation is identical across all three: use `features/<domain>/` as the organising unit, put per-domain `shared:` files inside, co-locate tests next to source.

### Q4 — Differentiation honesty: **3/3 hold against visual builders + 3/3 worry about AI coders**

| Tool | Opus verdict | GPT verdict | Gemini verdict | Convergence |
|---|---|---|---|---|
| FlutterFlow | Holds (architectural) | Holds | Holds | **3/3 holds** |
| Webflow | Holds (different category — "mostly noise") | Holds | Holds | **3/3 holds** |
| Bubble | Holds (different business model) | Holds | Holds | **3/3 holds** |
| **Cursor** | **Collapses unless canvas earns its keep** | "Defensibly different only if visual AST canvas is real" | "Could close in 18mo" | **3/3 worry** |
| **Lovable** | **Conditional on Path C** | "Most dangerous comparison" | "Could close in 18mo" | **3/3 worry** |

**Cross-model framing of the moat**:
- Opus: "The pitch leans on FlutterFlow because that's the comfortable comparison. The Cursor comparison is the one that should keep the team up at night."
- GPT: "Igni Studio's moat is not 'AI writes code.' That will be commoditized. The moat has to be: visual editing and source editing remain the same artifact after the app becomes real."
- Gemini: "Differentiation against visual builders is highly defensible; differentiation against AI coders is vulnerable."

All three converge on: **the comfortable comparison (FlutterFlow/Webflow/Bubble) is structurally different and not the right pressure-test**; **the honest comparison is Cursor + Lovable**, where the moat depends entirely on the round-trip claim from Q1 holding up. If Q1's degradation pattern materializes, the moat collapses.

### Q5 — Most likely failure mode + 6-month signal: **3/3 same failure mode, masked by verdict-label variation**

The verdict labels (Opus prose-only, GPT REFINE, Gemini HOLD) hide a strong functional convergence. Gemini's HOLD says "the failure mode named in the prompt is correct"; GPT's REFINE refines the *mitigation*, not the failure; Opus's "anticipate this now" reframes as urgency rather than disagreement.

| Element | Opus | GPT | Gemini | Convergence |
|---|---|---|---|---|
| **Failure shape**: round-trip degrades under real complexity | ✓ "round-trip-tolerated-but-nobody-trusts-it" | ✓ "canvas becomes mostly read-only preview" | ✓ "visual canvas devolves into read-only scaffolding viewer" | **3/3** |
| Signal class: telemetry on edit origin (canvas vs source vs agent) | ✓ "cross-surface edit ratio per user" | ✓ "round-trip editable coverage %" + edit-origin segmentation | ✓ "telemetry on AST mutation origin grouped by file age" | **3/3** |
| Specific threshold | <30% canvas edits in 7-day window by month 4 | <30% projects flag canvas-preserved-not-editable; <20% UI commits from canvas in 10+ screen projects | >95% old-file edits from text editor or agent = bi-directional loop failed | All three quantify; thresholds align |
| Support-ticket pattern | "canvas changed my code" / "formatting churned" / `# do not edit in canvas` comments | "canvas changed my formatting/comment" / "canvas can't edit this component" / "designer broke my function" | (implicit in telemetry framing) | 2/3 explicit ticket patterns |
| Competitor canary | "Cursor ships Figma frame import → canvas becomes redundant" | (not explicit) | (not explicit) | 1/3 — Opus only |

**Convergent failure-mode prediction**: by month 4-6, projects with 10+ screens that hit real complexity (`fetch`, `shared`, `each`, lambdas, tests, component events) show <30% canvas-originated edits. Designers stop opening source view; developers stop opening canvas; the round-trip claim becomes decorative. This is the "easy path" because Studio asks users to maintain dual fluency that most won't.

## Tier routing

### Tier A — 3/3 strong convergence; patches the strategy thesis

These findings are load-bearing enough that the Studio pitch should be revised before any product marketing solidifies:

1. **The "1:1 mapping" claim is wrong as stated and must be reframed.** Visual round-trip works for the renderable subset (layouts, primitives, theme tokens, component invocations); behavioral primitives (reactivity, lambdas, `every`, `{x with}`, conditional branches, tests, component events) require source authoring. Honest reframing: *"lossless AST round-trip for all `.igni` files; visual round-trip for the subset whose semantics have Studio surfaces."* (Q1, 3/3).
2. **Drop the green-flag / live-preview toggle from the framing.** Igni is reactive-by-construction; there's no "off" state to toggle out of. The metaphor is borrowed from a context (Scratch) where it earned its place; importing the metaphor without the context is wrong (Q2, 3/3).
3. **Add a state/scenario inspector as a primary surface.** Across all three reframings, the missing element is *state*, not preview. Concrete: state inspector lets the user manually flip variable values, mock fetch states, see scenarios (loading/error/empty/success/permission-denied) (Q2, 3/3).
4. **Replace the proposed file structure with feature-based grouping.** The proposed `screens/` + singular `shared.igni` + top-level `tests/` *contradicts* the cheatsheet's stated conventions. Feature-based grouping with co-located tests + per-feature shared files matches the language's design (Q3, 3/3).
5. **The honest competitive moat is Cursor + Lovable, not FlutterFlow.** The structural-architectural differentiation against visual-builder incumbents is comfortable but not the right pressure-test. The moat against text-editor + AI tools depends entirely on the round-trip claim from #1 holding up (Q4, 3/3).
6. **The failure-mode telemetry must track edit origin by file age.** A canary metric — "in projects with 10+ screens, what fraction of edits originate from canvas vs source vs agent?" — would surface round-trip degradation within the first 6 months. This is the v0.20+ signal-collection requirement (Q5, 3/3).

### Tier B — 2/3 with concrete shape; logged for app-2 implementation watch-list

7. **Demote the AI agent from a fourth panel to an action layer / ambient command palette.** GPT + Gemini agree; Opus keeps it as a panel but reframes its role. The substantive shape change: the agent isn't a *surface* like canvas/source/preview; it's a collaborator operating across surfaces. UI implication: not a fixed sidebar (Q2, 2/3).
8. **AGENTS.md must scale via per-domain context files.** Monolithic `AGENTS.md` saturates frontier-LLM context budgets at ~50 screens. Concrete pattern: `AGENTS.md` (project-wide) + `features/<domain>/AGENTS.md` (per-feature). Generated indexes (`.igni/symbols.json`, `.igni/shared-usage.json`) are cache, not source-of-truth (Q3, 2/3).
9. **The diagnostics surface (problems / tests / snapshots / fetch mocks / console) is missing.** Igni has strong parse-time rules (no inline hex, `input bind: shared.X` rejected, max nesting depth 4, `transition:` validity rules); a first-class diagnostics panel makes those visible to the user, not buried in compile errors (Q2, 1/3 explicit but coupled with state-inspector convergence at 3/3).
10. **`igni.config` is a load-bearing risk** — fine for editor preferences, dangerous if it stores layout/component metadata. Rule of thumb: source of truth = `.igni`; Studio metadata = non-semantic only (Q3, 1/3 — GPT only — but rule-of-thumb formulation is high-quality).

### Tier C — 1/3 raise; logged for ROADMAP-S3 only

11. **Component event contract editing has no canvas vocabulary.** GPT-only Q1 raise. The `emit X v` + parent's `on X(name):` payload-binding requires API-inspector tooling, not just visual layout. (Q1, 1/3).
12. **Cursor + Figma-frame-import is the specific competitor canary to watch for.** Opus-only Q5 raise. If Cursor ships a "Figma export → Igni source" feature, the canvas's import-Figma-once-then-edit-source workflow becomes redundant. (Q5, 1/3 — but specific enough to be worth tracking).

## Cross-cutting observation (methodology-grade, dissertation-relevant)

All five questions independently triangulate the *same* underlying issue: **the "1:1 mapping" claim is the load-bearing premise of the Studio pitch, and it doesn't hold for behavioral primitives.** This is unusual in Stage 2 panels — typically each question surfaces a distinct concern. Here, five different framings (mechanics, UI architecture, file organisation, competitive moat, failure-mode prediction) all reduce to the same diagnosis from different angles. The methodological signature is *strong* — not "the panel found different problems" but "the panel found one problem from five angles." This pattern is worth catalogueing alongside the principled-minority-pattern (`docs/private/114`) and synthesis-to-cheatsheet drift trap class — a new signal-shape: *cross-question central-claim convergence*. When five independent question framings reduce to one diagnosis, that diagnosis is the highest possible signal a strategic critique can produce.

The other dissertation-relevant note: cells diverged on *verdict labels* (Opus's "anticipate this now"; Gemini's HOLD on Q5; the prose-only Opus Q4) but converged on *substance*. This validates the synthesis-must-stay-human discipline (`docs/private/104` automation principle) — an automated convergence-counter looking only at H/R/F labels would have under-reported Q5 convergence and missed the cross-question diagnosis entirely.

## Decisions (Tyr-mediated, this synthesis)

1. **Apply all 6 Tier A findings** — captured in `docs/private/115_igni_studio_strategy.md` as the revised Studio pitch with reframed central claim, missing-surface (state inspector), corrected file structure, honest moat (Cursor + Lovable not FlutterFlow), and 6-month telemetry plan.
2. **Tier B findings logged** to the same `docs/private/115` doc as a "watch-list during app 2 implementation" — app 2 will pressure-test whether the corrected file structure holds, whether AGENTS.md per-domain pattern works, etc.
3. **Tier C findings** routed to ROADMAP Stream 3 only (component event canvas vocabulary; Cursor competitor canary).
4. **Cross-cutting methodology observation** captured in trap-journal as a new signal-shape (cross-question central-claim convergence, novel pattern).
5. **No v0.20 spec changes triggered.** The Studio panel was a *strategic* critique; v0.20's locked scope (spacing tokens + shadow + Stream 2 tooling) is unaffected. The findings inform Studio's product-design phase, which is post-June-2027.

## Cumulative cost

- v0.19 cycle: $1.55 (Stage 2 + Stage 0 + Stage 3).
- v0.19.1: $0 (chat-mode review + Explore-agent drift audit).
- This panel: **$0.5264** (over $0.30 estimate; substantive output justified).
- v0.19 + Studio panel cumulative: **$2.08**.

## Next steps

1. Open `docs/private/115_igni_studio_strategy.md` capturing Tier A as revised Studio pitch, Tier B as watch-list, Tier C as ROADMAP-S3 candidates.
2. Append cross-question central-claim convergence as a methodology entry to `docs/private/trap-journal.md`.
3. ROADMAP Stream 3 — log the two Tier C items (Cursor canary; component event canvas vocabulary).
4. Commit synthesis README + 115 + trap-journal append + ROADMAP update as one bundle.
