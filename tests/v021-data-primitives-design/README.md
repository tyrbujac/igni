# v0.21 data-primitives strategic-critique panel — synthesis

**Date:** 2026-04-29 (post-v0.20.1 ship). **Method:** chat-mode strategic critique with v0.20.1-cheatsheet attached + 3-question structured framework + HOLD/REFINE/FLIP verdicts per dimension. **Models:** Gemini 3 Flash, Gemini 3.1 Pro, GPT 5.3, Claude Opus 4.7. **Cost:** $0 (web-UI chat-mode). **Wallclock:** ~30 min async. **Synthesis:** human-mediated per `docs/private/104` automation principle.

## Methodology note

Second instance of the chat-mode strategic-critique pattern (first: Igni Studio panel, `tests/igni-studio-strategy/`, 2026-04-28). Distinct from the cheatsheet-review pattern (n=5: v0.14.1 / v0.15.0 / v0.17.0 / v0.19.1 / v0.20.1) on three axes:

1. **Subject** — strategic critique probes a *specific architectural decision* with structured dimensions (S1/S2/S3 for scope; P1-P6 for shape; T1/T2/T3 for trajectory); cheatsheet review reads the cheatsheet *cold* across the whole document with a fixed Q1-Q5 template.
2. **Question structure** — strategic-critique dimensions are domain-specific to the decision under review; cheatsheet-review questions are stable across versions for cross-version comparability.
3. **Output role** — strategic critique feeds a *Stage 1 design note* (input to a fresh cycle, not output of one); cheatsheet review feeds a *docs-iteration patch list* (v0.X.1 patch ship).

n=2 establishes the strategic-critique pattern as a distinct methodology shape. The Studio panel (n=1) catalogued the *cross-question central-claim convergence* sub-pattern (5 questions reducing to one diagnosis; chapter §4c). This panel (n=2) catalogues the *contested-split* sub-pattern: a 2/4+2/4 split on Q2 with A-camp and B-camp both architecturally defensible — distinct from principled-minority's "minority wins" or "minority gets absorbed" shapes because here the architecture hasn't yet taken a stand.

## Panel composition

| Model | File | Style |
|---|---|---|
| Gemini 3 Flash | `gemini-3-flash.md` | Tightest output, table-heavy. Q1 dimension table. Q2 explicit "case AGAINST Option A" naming wrapper-confusion (`persist(fetch(...))`). Recommends Option B. |
| Gemini 3.1 Pro | `gemini-3.1-pro.md` | Most architectural framing. Q1 "absolute scope purity" framing for Tier 0. Q2 most explicit anti-A case ("Option A looks like a function call but acts like a compiler macro"). Recommends Option B. Closes with the multi-file collision follow-up question. |
| GPT 5.3 | `gpt-5.3.md` | Most exhaustive — full A/B/C breakdown per all six P-dimensions. Tier-recommendation matrix. "Persistence is part of UI continuity" framing. Recommends Option A with placement restriction. Most concrete v1.x framing for Tier 2 (`store Workouts:` not `table Workouts:`). |
| Claude Opus 4.7 | `claude-opus-4-7.md` | Densest contrarian residue ("the n=3 cross-source signal deserves one more interrogation"). Most explicit cross-reference Q1↔Q2. Recommends Option A. Surfaces Tier-2 lambda-predicate constraint as v1.0-decision-shapes-v1.x. |

---

## Q1 — Scope boundary

### Convergence verdicts

| Tier | Flash | Pro | GPT | Opus | Convergence |
|---|---|---|---|---|---|
| **Tier 1 in v1.0** | ✓ recommended | ✓ "Conclusion: Ship Tier 1" | ✓ "Hold — best scope-to-value" | ✓ "Right size for v1.0" | **4/4 unanimous** |
| **Tier 3 out indefinitely** | ✓ "fetch() forever" | ✓ "fetch() forever" | ✓ "Hard flip — never in core" | ✓ "Out indefinitely" | **4/4 unanimous** |
| **Tier 2 deferred from v1.0** | ✓ defer / separate research project | ✓ "definitive scope creep" | ✓ "Flip out of v1.0" | ✓ "Out for v1.0" | **4/4 unanimous** |
| Tier 2 v1.x re-opening enthusiasm | "separate research project" — defer indefinitely | "definitive scope creep" — never natural | "v1.2+ at earliest, lambda-only no SQL" | "v1.x maybe limited 'schemaless persisted list'" | Range: never → maybe-limited |

**Strongest possible signal across all four cells on three points: Tier 1 in v1.0, Tier 3 out, Tier 2 deferred.** Act with high confidence on each.

### Tier 0 anti-anchoring residue (preserve verbatim)

All four cells acknowledge Tier 0 has academic merit. Opus is the most explicit and worth quoting at length:

> The strongest case for shipping nothing new is methodological. If the dissertation thesis is "constrained UI language is more LLM-authorable than a general-purpose alternative," every primitive added that isn't UI dilutes that thesis. fetch() is already a concession, but a defensible one — every UI app talks to *some* backend, even if read-only. Persistence is categorically different: it's a data-layer concern that real apps solve with Supabase, Firebase, or custom APIs. … The interesting question is whether the n=3 signal is reading "production app needs" through a lens the dissertation framing doesn't actually require.

GPT echoes the framing more bluntly: "Tier 0 is defensible academically, but weak strategically." Pro names it "absolute scope purity." Flash frames it as preventing "the 'Is it a UI language or a full-stack framework?' identity crisis."

**The contrarian residue does not flip the verdict** — all four cells still recommend Tier 1 — but it does sharpen the dissertation framing requirement: Stage 1 design note must explicitly state *why* `persist()` ships in v1.0 ("the eval requires it") rather than letting the "obvious" inclusion go unchallenged.

### Cross-source signal accumulation

Persistence as a v0.21+ candidate now has **n=4 cross-source instruments**:

1. **v0.16.0 extrapolation panel** (`docs/private/110`): 4/4 cells named `persist(initial)` as a needed primitive when models extrapolated past the spec.
2. **v0.20.1 chat-mode cheatsheet review** (`tests/v0.20.1-cheatsheet-review/`): 3/4 cells named persistence as a Q5 fit-and-limits wall for notes-shape apps.
3. **Boojy Notes app 2 build descope** (`docs/private/116` Decision 2): explicit "local-first persistence needs `persist()` to ship first" framing — real-app build window producing the gap.
4. **This panel** (2026-04-29): 4/4 unanimous on Tier 1 inclusion in v1.0.

**Strongest cross-source convergence pattern catalogued.** Methodology chapter §4e currently frames the pattern at n=3; updates to n=4. The pattern's load-bearing claim is "three independent instruments produce the same gap inventory"; n=4 reinforces with a fourth instrument (strategic critique) that operates on a *different question framing* than the prior three.

---

## Q2 — `persist()` shape

### Convergence verdicts

| Option | Flash | Pro | GPT | Opus | Convergence |
|---|---|---|---|---|---|
| **Option A — wrapper `persist(initial)`** | FLIP — wrapper confusion | REFINE/anti — "function call but compiler macro" | **Recommend** "A > B >>> C" | **Recommend** with refinements | **2/4 (GPT + Opus)** |
| **Option B — `shared persisted:` block** | **Recommend** | **Recommend** "Conclusion: Option B" | REFINE — "leaks discipline; better than C, worse than A" | FLIP — "sub-flavor confusion" | **2/4 (Flash + Pro)** |
| **Option C — top-level `persist:` block** | FLIP — namespace pollution | (not recommended) | FLIP — "second state namespace" | FLIP — "duplicates shared:" | **4/4 reject** |

**The split is genuinely contested — 2/4 + 2/4.** Architectural force on both sides; not collapsible to a "majority lean."

### The two camps

**B-camp (Flash + Pro):** annotation-modifier discipline. `shared persisted:` is a clear modifier on existing surface; preserves the rule "use `shared:` for cross-screen data" while adding a durability dimension; matches Compose-style annotation prior; prevents `persist()`-anywhere confusion (Flash's wrapper-confusion case: an LLM might write `x = persist(fetch(...))` or `count = persist(0)` inside a screen body). Pro's strongest framing: *"`persist` as a wrapper breaks the visual simplicity of type inference… LLMs are structural engines. They understand blocks natively."*

**A-camp (GPT + Opus):** wrapper-builtin consistency. `persist(initial)` matches `fetch()` and `spring()` patterns — locality of meaning at value declaration; doesn't fragment `shared:` into sub-flavours; preserves "one block, no aliases" discipline. Opus's strongest framing: *"`shared persisted:` introduces a sub-flavor. The LLM has to learn three shapes for cross-screen state: volatile shared, persistent shared, implicitly local."* GPT's strongest framing: *"persistence is an attribute of state. Not a separate namespace."*

### Architectural axis vs peer-language axis

The split lines up roughly along two competing axes that both have real architectural force:

- **Architectural axis** (favours A): Igni's load-bearing invariants point at the wrapper. "One way to do everything" — A doesn't introduce a new block; B introduces a `shared persisted:` flavour distinct from `shared:`. "Don't add a new keyword when an existing primitive can be extended" — A reuses the wrapper-builtin pattern; B adds the `persisted` annotation keyword. "Visible coupling" — both options preserve the `shared.X` access prefix; equivalent on this axis.
- **Peer-language axis** (favours B): Compose-style annotations and SwiftData modifiers feel familiar; the wrapper-builtin pattern is starting to overload (three wrappers — `fetch`, `spring`, `persist` — with three different semantic categories: async, animated, durable). Flash's "case AGAINST Option A" is the fourth-wrapper-overload concern; an LLM cold-reading the cheatsheet might assume `persist()` is async-shaped (because `fetch()` is) or read-only (because `spring()` is).

**This is not yet a principled-minority pattern instance.** The pattern requires architecture to take a stand against panel convergence (instances 1-3) or split (instance 4 absorption). Here the panel itself is split, and architecture hasn't taken a position — Stage 1 design note is where the architectural call gets made, after app 3 build provides real-app evidence.

### Wrapper-confusion risk is option-independent

Flash's `persist(fetch(...))` concern applies regardless of which shape ships:

- **If Option A wins**, the spec must reject `persist(fetch(...))` at parse time with a cross-pointing error ("`fetch()` results have a loading lifecycle; `persist()` requires JSON-serialisable values — these don't compose"). Same parse-time guard for `persist(spring(...))` and other cross-wrapper combinations.
- **If Option B wins**, the spec must address whether persisted variables can hold fetch-derived values at all — a `shared persisted: user = fetch(...)` declaration would also need rejection or an explicit reload-from-cache semantics.

**Stage 1 design note must inventory the rejection rules regardless of shape choice.** Shape determines syntax of rejection messages; the semantic question is identical. Add as Q5 to the Stage 1 design note shape inventory (Q1 shape choice; Q2 type boundary; Q3 write semantics; Q4 multi-file collision; Q5 cross-wrapper rejection rules).

### Pro's multi-file collision follow-up — option-independent

Pro closes with: *"how do you envision handling the compilation when multiple `.igni` files declare their own `shared persisted:` sections — should they merge silently like the standard `shared:` block, or should persistence force a single-file declaration rule to prevent silent disk-key collisions?"*

The question generalises beyond Option B. **Persistence needs a multi-file collision rule regardless of which shape ships:**

- Option A: two files declaring `shared: theme_mode = persist("system")` and `shared: theme_mode = persist("dark")` would create two declarations with the same disk key. Same problem as the Studio panel's `shared.igni` god-object concern.
- Option B: same problem under the `shared persisted:` block name.
- Option C: same problem inside `persist:` block.

The **disk-key collision question** is the architectural sub-question, distinct from the syntax-shape question. Stage 1 inventory: silent merge (matches v0.5+ `shared:` convention) vs single-file declaration (forces explicit ownership of persisted state) vs require explicit collision-resolution annotation (per-key namespace).

### Anti-anchoring framing for Stage 2

If Stage 1 design note lands on Option A (the architectural-axis lean), Stage 2 panel Q1 must explicitly ask the panel for the strongest case AGAINST A. The B-camp arguments above are the right anchor — particularly the wrapper-overload concern at the fourth instance and Flash's `persist(fetch(...))` compositional trap. Pre-register Trigger A watch: if Stage 2 produces 3/3 FLIP toward B, that's the principled-minority pattern at instance 5 firing, and the architectural lean reverses.

If Stage 1 design note lands on Option B (the peer-language-axis lean), Stage 2 Q1 anti-anchor is the A-camp arguments: wrapper-builtin consistency and the "one way to do everything" invariant. Symmetric Trigger A watch.

**Both options remain plausible Stage 1 outcomes.** Don't pre-anchor on either in this synthesis.

---

## Q3 — v1.x trajectory

### Convergence verdicts

| Sub-question | Flash | Pro | GPT | Opus | Convergence |
|---|---|---|---|---|---|
| **T2 — Tier 2 deferred** | "separate research project" | "definitive scope creep" | "v1.2+ at earliest, lambda-only no SQL" | "separate research project" | **4/4** |
| **T2 — Tier 2 shape if it ships** | (silent on shape) | (rejects entirely) | `store Workouts:` not `table`, lambda-only `query Workouts, where: w => …` | "schemaless persisted list" with existing list builtins | A-camp on shape: extends list-builtin discipline |
| **T3 — "fetch() forever"** | ✓ | ✓ | ✓ | ✓ "library territory, not language" | **4/4 unanimous** |
| **Tier-1-only acceptable for v1.0** | ✓ "90% of prototype use cases" | ✓ "single-device tools, todo lists, offline notes" | ✓ "absence of sync is not a language failure" | ✓ "narrow category fails" | **4/4 unanimous** |

**Strongest possible signal on Tier 3:** "fetch() forever" with 4/4 unanimity. Vendor SDK bindings out of core indefinitely. Validates the cloud-backend deferral as the v1.0+ stance — and worth pinning explicitly so future cycles don't re-discover the question.

### Long-horizon constraint surfaced (Opus + GPT — 2/4 explicit)

If Tier 2 ever ships, the lambda-predicate discipline matters. Opus: *"If Tier 2 ever ships, it should feel like extension of list builtins, not a parallel query syntax — `query Workouts.where(w => w.created_at > yesterday())` or similar, sharing the lambda discipline."* GPT echoes: *"`store Workouts:` not `table Workouts:` because 'table' implies SQL mental model. Query should be lambda-only. No SQL."*

**Methodology principle worth pinning:** *the design choices that look local to v1.0 actually constrain v1.x's space.* Option A's wrapper-shape composes cleanest with hypothetical Tier 2 (`table Workouts:` declaration is a different surface from `persist(...)` on a list — no overlap, no migration question). Options B and C would force "does Tier 2 also use a top-level block? What's the relationship?" — design debt before Tier 2 even ships. This is a *secondary* architectural argument for Option A; not load-bearing on its own (Tier 2 may never ship), but worth catalogueing.

### Tier-1-only failure mode (4/4 alignment)

The notes-app-syncs-across-devices scenario is the explicit test. All four cells reach the same answer: cross-device sync is bigger than Igni's whole language scope; v2.x problem at earliest, not a v1.0 gap. Opus's reframe: *"The cross-source signal you mentioned almost certainly isn't asking for sync — it's asking for 'my todo list survives app close.'"*

For v1.0 dissertation-eval purposes, Tier-1-only covers single-device tools, todo lists, offline notes, settings-heavy utilities, workout trackers, recipe books, draft journals — the achievable-app category. This is the right boundary.

---

## Stage 1 inventory (input from this synthesis)

When Stage 1 design note opens (post-app-3 build), the inventory below sits as evidence input. Stage 1 makes the architectural calls; this synthesis provides the panel signal:

1. **Tier 1 inclusion in v1.0** — 4/4 unanimous + n=4 cross-source convergence. **Decided** at synthesis level; Stage 1 confirms framing (does the dissertation claim cover persistence, or scope-cut?).
2. **Q2 shape choice (A vs B)** — 2/4+2/4 split; architectural-axis vs peer-language-axis. **Open** for Stage 1; architecture takes a stand based on load-bearing-invariants pressure-test + app 3 evidence.
3. **Cross-wrapper rejection rules (Q5)** — option-independent; Stage 1 inventories regardless of shape choice. `persist(fetch(...))` parse-time rejection; same for other wrapper combinations.
4. **Multi-file collision rule (Q4)** — option-independent; silent merge / single-file declaration / explicit annotation. Stage 1 picks one.
5. **Type boundary (P3)** — JSON-serialisable graph (Pro + GPT + Opus convergent); compiler-rejected statically where possible, runtime-rejected otherwise.
6. **Write semantics (P4)** — split: GPT recommends immediate-write semantic contract (debouncing as implementation detail); Opus recommends explicit debounced-flush with documented window. Stage 1 picks one with justification.
7. **Failure modes (P5)** — silent fall-back to initial on corruption / type mismatch (3/4 convergent); Pro adds "graceful reset is vastly superior to fatal crash loop on boot."
8. **Tier 3 out indefinitely** — 4/4 unanimous "fetch() forever." **Decided** at synthesis level; pin in spec as v1.0+ stance.
9. **Tier 2 deferred** — 4/4 unanimous from v1.0; lambda-predicate discipline constraint logged for v1.x design when it opens.
10. **Tier 0 contrarian residue** — Stage 1 dissertation framing must explicitly state *why* `persist()` ships in v1.0 ("the eval requires it") rather than letting the inclusion go unchallenged.

## Cycle status

| Step | Status |
|---|---|
| Strategic critique panel run | ✓ 2026-04-29 |
| 4 cell outputs collected | ✓ all four (Flash / Pro / GPT / Opus) |
| Synthesis README | ✓ this file |
| Tyr-side strategic synthesis | `docs/private/122_v021_data_primitives_design_review.md` (next) |
| Methodology chapter §4e update (n=4 + n=2 distinction) | pending |
| App 3 (card sender) build | pending — 2-3 weeks |
| v0.21 Stage 1 design note | pending — opens post-app-3 |
| Stage 2 panel | not yet scheduled |

**Cumulative cost:** $0 (chat-mode). v1.0 criterion 1 clock unchanged.

**Sequence per Tyr (unchanged):** app 3 build → v0.21 Stage 1 design note (informed by real-app data + this panel's signal) → Stage 2 → ship. Stage 1 takes this synthesis as evidence input alongside the app 3 build's empirical signal on persistence shape.
