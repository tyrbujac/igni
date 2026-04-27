# v0.17.0 cold-LLM rating + v1.0 readiness consult — synthesis

**Run date:** 2026-04-27. **Mode:** chat-mode (web UIs), free. **Cells:** 7 (4 cheatsheet + 3 full spec). **Method-tier:** "mostly calibration, but worth saving." No pre-registered ship bar — convergence-counting is descriptive, not gating.

The plan was 5 cells (Opus + Gemini Pro × cheatsheet + spec, GPT × cheatsheet). At run time Tyr added two unplanned **gemini-3-flash** variants (cheatsheet + spec). Net 7 cells. The extras strengthen cross-validation on the lighter-tier reads and let us run a third within-model delta we didn't plan for.

| # | UI label | Input tier | File |
|---|---|---|---|
| 1 | gemini 3.1 pro | cheatsheet | [`gemini-3.1-pro_cheatsheet.md`](gemini-3.1-pro_cheatsheet.md) |
| 2 | opus 4.7 | cheatsheet | [`opus-4.7_cheatsheet.md`](opus-4.7_cheatsheet.md) |
| 3 | gpt 5.3 | cheatsheet | [`gpt-5.3_cheatsheet.md`](gpt-5.3_cheatsheet.md) |
| 4 | gemini 3 flash | cheatsheet | [`gemini-3-flash_cheatsheet.md`](gemini-3-flash_cheatsheet.md) |
| 5 | gemini 3 flash | spec | [`gemini-3-flash_spec.md`](gemini-3-flash_spec.md) |
| 6 | gemini 3.1 pro | spec | [`gemini-3.1-pro_spec.md`](gemini-3.1-pro_spec.md) |
| 7 | opus 4.7 | spec | [`opus-4.7_spec.md`](opus-4.7_spec.md) |

**Headline (3 sentences):** 7/7 cells flag testing as a v1.0 gap — strongest possible convergent result. 4/7 raise architectural-scale concerns about the flat `shared:` namespace + cross-screen function ban as a unified failure mode at production size. Three v1.0-blocking primitive classes named by 3+ cells — accessibility, animation, internationalisation — none of which are in the current spec.

---

## 1. Per-axis score table

Rows are axes named by 4+ cells (the common ones). Cells off-axis (model didn't score it) shown as `—`. Where a model's score depended on a chosen interpretation of an ambiguous axis, the interpretation is in the parenthetical so cross-cell comparisons aren't apples-to-oranges.

| Axis | gemini 3.1 pro c'sheet | opus 4.7 c'sheet | gpt 5.3 c'sheet | gemini 3 flash c'sheet | gemini 3 flash spec | gemini 3.1 pro spec | opus 4.7 spec |
|---|---|---|---|---|---|---|---|
| **Readability** | 9.5 | 8 | 9 | 9 | 9.5 | 9.5 | 8 |
| **LLM accuracy (zero-shot)** | 8 | 6 simple / 4 complex | 9.5 | 8.5 | 9 | 8.5 | 7 |
| **Speed (dev iteration)** | 9 | 9 | 9 | 10 | 10 | 9 | 8 |
| **Cost (LLM token)** | 10 | 8 | 9.5 | 9 (combined cog+token) | 9 (combined cog+token) | 9.5 | 8 |
| **Cost (cognitive, human)** | — | 6 | 8.5 | (combined above) | (combined above) | — | 7 |
| **Testing (current)** | 3 | 2 | 5 (current; 9 potential) | 5 | 4 | 3 | 3 |

Per-cell extra axes (not scored across the panel — included for completeness):

- **gpt 5.3 c'sheet:** Runtime speed 7, Compile speed 9. Runtime/hosting cost 6.5. Debuggability 6. Error quality 8. Type system 7. Extensibility 6. **Composite:** UI-DSL 8.8, language design 8.0, LLM-product 9.5.
- **opus 4.7 c'sheet:** Debugging 3. Accessibility **0**. Animation **0**. Error messages "TBD".
- **opus 4.7 spec:** Accessibility **1**. Animation **0**. i18n **0**. Typing 4. Extensibility 3. Compile 9 / runtime 6. Spec/context cost 5.
- **gemini 3.1 pro c'sheet:** Architectural scalability 5.5.
- **gemini 3.1 pro spec:** Architectural scalability 5.
- **gemini 3 flash c'sheet:** Refinement (constraint enforcement) 7.
- **gemini 3 flash spec:** Error messages 10 ("Fix-it" UX, citing the trigger-variable rejection + inline-hex rejection as proactive teaching).

**Patterns visible in the table:**

- **Readability is consistently 8–9.5** across all 7 cells. No cell scored it below 8. Strongest convergent positive signal.
- **LLM accuracy splits.** Opus is the contrarian (4–7); every other cell is 8–9.5. *This is methodologically interesting:* Opus is one of the strongest reasoners on the panel, and its lower self-assessment ("I would reliably trip on rule X") is grounded in concrete examples ("I'd write `selected_method is {id: 1}` thinking it'd match"). Less-capable models scoring themselves 9.5 is in tension with this. **The strongest reasoner is the most pessimistic — that read is more credible than the cheerful consensus.**
- **Testing is 2–5 across the panel.** No cell rates current testing infrastructure above 5. GPT alone offers a "potential 9" *if* a test runner ships. Universal critique.
- **Speed (dev iteration) is 8–10.** Strong consensus on the prototyping-velocity pitch.
- **Cost (token) is 8–10.** Strong consensus on the LLM-token efficiency pitch.

---

## 2. Convergence on critiques

Convergence routing rule (adapted from spec-cycle skill, 7-cell denominator): **6+/7 strongest** (act-now); **4–5/7 strong** (queue with cite); **3/7 log-with-cite** (Stream 3 candidate); **1–2/7 single-model raise** (mention but don't promote).

### 7/7 — Testing (strongest)

Every cell named testing as a v1.0 gap. Specific phrasings preserved verbatim:

- gemini 3.1 pro c'sheet: "for v1.0, you cannot just rely on visual verification. ... you need a headless runner that can do something like: `mount Todo`, `tap "Add"`, `assert items contains...`."
- opus 4.7 c'sheet: "**This is a real hole, not a 'v1.x' item.**"
- gpt 5.3 c'sheet: "Without these, v1 is weak." Includes specific syntax sketch (`test "Todo empty": render Todo / expect "No tasks yet"`).
- gemini 3 flash c'sheet: "Because logic is coupled to the screen, you can't unit test functions in isolation."
- gemini 3 flash spec: "I'd expect a `test "Description":` block that can simulate `on tap:` events and assert against state."
- gemini 3.1 pro spec: "the spec currently has no testing story."
- opus 4.7 spec: "**This is the v1.0 dealbreaker for any team that ships software.**"

**Strongest possible result.** Already known to be a gap, now empirically confirmed by every cell on the panel.

### 4/7 — Three v1.0-blocking primitive classes (strong)

**Accessibility (4/7):** opus c'sheet ("publishable-quality bug"), opus spec ("the wall a serious app hits"), gpt c'sheet ("first-class, not bolted on"), gemini-flash c'sheet ("missing axis ... `alt:` on `image`, `hint:` on `layout`").

**Animation (3/7):** opus c'sheet ("shipping in the wrong decade"), opus spec ("real apps need motion"), gpt c'sheet ("animations" listed under "extensibility risk").

**Internationalisation (1/7):** opus spec only (i18n 0/10). Promote *with* accessibility/animation as a class, since they share the "v1.0 cannot ship without primitive support for X" pattern, but track i18n separately as the weakest of the three signals.

### 4/7 — Architectural scalability: shared-namespace flatness + cross-screen function ban

Both gemini-pro passes, both opus passes flagged this as a unified concern at production size. Phrasings:

- gemini 3.1 pro c'sheet: "developers will be forced into awkward, manual pseudo-namespaces like `shared.auth_user_status`. ... Introduce explicit namespacing. `shared auth: user = null`."
- gemini 3.1 pro spec: "names like `shared.selected_item`, `shared.status`, or `shared.draft` will inevitably collide ... developers will be forced to write `shared.auth_user_status` anyway, defeating the clean syntax." Plus a separate critique of the cross-screen ban under "no cross-screen logic sharing".
- opus 4.7 c'sheet: "real apps share logic, not just state. Add screen-less utility modules or accept that `shared:` will become a dumping ground."
- opus 4.7 spec: "Cross-screen function call ban + flat shared namespace = forced pattern. Every cross-screen interaction goes through `shared.` ... pushes data flow into a god-object."

**The two concerns are coupled** — flat shared + ban on cross-screen functions = god-object. Two complementary primitive ideas surface from the panel: namespaced shared blocks (`shared cart:`) and `module`/`utils` files for pure functions.

### 3/7 — Component re-render with no memoization escape

Both gemini-pro passes + opus spec.

- gemini 3.1 pro spec: "Appendix D.8 says every component rebuilds. Even if Flutter's element tree diffs the paint layer efficiently, re-running the Igni block for 100 items per keystroke *will* cause jank on low-end mobile devices."
- opus spec: "for a 200-row list where one row mutates, every row's component body re-runs ... a real production app will hit perf walls and have no escape hatch (no memoization primitive). This gets worse as apps grow."
- gemini 3.1 pro c'sheet (related): component-state-loss-on-rerender concern (slightly different angle — local state inside components).

Strong promotion candidate; needs a `memoize:` modifier or equivalent before lock-in is hard to undo.

### 3/7 — Deep-object-update verbosity

gemini 3.1 pro c'sheet ("`user = {user with profile: {user.profile with settings: {user.profile.settings with dark_mode: true}}}`"), gemini 3 flash c'sheet ("if I have `shared.user.profile.settings.notifications`, the `with` chain becomes a nightmare"), gemini 3.1 pro spec ("real-world JSON is heavily nested ... developers will spend an inordinate amount of time writing nested `with` blocks").

Two proposed shapes: deep-with sugar OR `update_path(object, "profile.settings.dark_mode", true)` builtin.

### 2/7 (model-bias adjacent) — Z-stack / overlay layout missing

Both gemini-3-flash passes (c'sheet + spec). Same model both passes, so the 2/7 isn't really cross-model convergence. Log without promoting; revisit if a non-flash cell raises it in a future panel. Still concrete: FAB / badge-on-icon corner / custom modal need an overlay primitive.

### 2/7 — Async error opacity

Both gemini-pro passes. Same model both passes. Phrasing in spec pass is sharper: "401 vs 500" — production apps need to intercept 401s for logout flow. Log; raise priority if a non-pro cell flags it.

### 2/7 — Lifecycle hooks (on mount / once)

gemini 3 flash spec ("there's no 'Once, when this screen opens'"), gpt 5.3 c'sheet ("missing equivalent of lifecycle hooks/effects"). Two different models, real cross-model signal.

### Single-cell raises (1/7 — log only, await compounding)

Each gets one line. Routing target in brackets.

- `is` overload footgun (opus c'sheet) → [trap-journal candidate when next cycle opens]
- "Declare at top of screen body" too restrictive (opus c'sheet) → [log; revisit if tutorial-tester surfaces it]
- No string interpolation (opus c'sheet) → [tracked-open-questions; v0.7+ backlog already mentions this]
- Sub-second `every` missing (opus c'sheet + opus spec) → **2/7-same-model, but tied to animation 3/7** → coupled with animation gap
- `fetch` reactivity escape hatch (opus c'sheet) → [tracked-open-questions]
- Null propagation hazard (opus c'sheet) → [trap-journal candidate]
- Platform escape hatch (opus c'sheet) + complex-Flutter-plugin escape (gemini-flash c'sheet question) → 2/7 cross-model on "where's the FFI story?" → [should-document]
- `each` keying (opus c'sheet) → [v0.18+ candidate when shadow design opens]
- Border tokens rigid (opus c'sheet) → [v0.17.x docs note: theme: border: token block analogous to theme: color:]
- Navigation too thin (gpt c'sheet) → [tracked-open-questions; already in v0.7+ backlog]
- Local persistence missing (gpt c'sheet) → [tracked-open-questions]
- Derived-state semantics surprise / `total = count * price` non-reactive (gpt c'sheet) → [cheatsheet patch — this rule needs louder teaching; the cheatsheet says it but the surprise still lands]
- `round(x, n)` returns string footgun (opus spec) → [v0.17.1 docs note OR rename to `format()` in v0.18]
- `fill: true` weight property (opus spec) → [v0.18+ candidate]
- No multi-line strings (opus spec) → [tracked-open-questions]
- `random()` no seed (opus spec) → [v0.17.1 patch — testing-adjacent]
- `contains` case-asymmetry (opus spec) → [v0.17.1 docs note]
- Component-vs-function casing rule missing from Appendix B (opus spec) → [v0.17.1 docs patch — concrete]
- "Logic-in-UI graveyard" — screen bodies become 500-line monsters because cross-screen ban (gemini-flash c'sheet) → folds into the 4/7 cross-screen-ban concern
- 4-level nesting cap pushback prediction (gemini-flash spec) → [defend, don't relax]

---

## 3. Cheatsheet-vs-spec within-model deltas

Three models did both passes. The delta is what the spec pass surfaced that the cheatsheet pass missed — *that's the depth gap in the cheatsheet teaching*.

### Opus delta — the richest

**Cheatsheet pass surfaced** (high-level, principled): testing dealbreaker; `is` overload; declare-at-top constraint; no string interp; sub-second `every`; `fetch` escape hatch; cross-screen ban → big shared; null prop hazards; no platform escape hatch; no `each` keying; border tokens rigid; animation/a11y/forms gaps. Plus: lexical reactivity celebration, theme discipline, `shared.` prefix, `emit` design.

**Spec pass added** (Appendix-derived smells the cheatsheet doesn't expose):

- `round(x, n)` returns a string (Appendix D.11) — typecheck footgun
- `contains` case-inconsistency vs `is` exact
- **Component-vs-function casing rule missing from Appendix B**
- No `each` keying acknowledgement (mentioned in spec but not as a v1.0 risk)
- No `random()` seed → untestable
- No `fill: true` weight (`fill: 2`)
- No multi-line string syntax
- `{base with ...}` requiring a variable name (premature constraint)
- Architectural-scale: flat shared as god-object, no memoization escape, JSON-only fetch
- Specific runtime concern: 200-row list re-render per parent reactivity tick

**Verdict:** the cheatsheet under-teaches Appendix-D semantics specifically. The spec pass surfaces concrete smells that don't appear in the cheatsheet at all. *This is where the v0.17.1 cheatsheet patch list flows out of.*

### Gemini-3.1-pro delta

**Cheatsheet pass surfaced:** namespace collision, cross-screen logic sharing ban, component-state-loss-on-rerender, async error opacity, deep object update verbosity. Score for LLM accuracy: 8/10.

**Spec pass added:** D.8 keystroke perf concern (sharper architectural framing of the same critique), opaque-async-errors framed as 401-vs-500 (more concrete than cheatsheet's "couldn't load"), explicit "Architectural Scalability" axis at 5/10. Score for LLM accuracy: 8.5/10.

**Verdict:** spec pass is *sharper*, not deeper. Same critiques, more specific framing. The cheatsheet pass already caught the architectural concerns at the conceptual level — the spec pass let it cite Appendix D directly. Confirms the cheatsheet teaches enough breadth to surface architectural concerns; what it doesn't teach is the specific Appendix-D smells (which Opus's spec pass picked up).

### Gemini-3-flash delta — the bonus pair

**Cheatsheet pass surfaced:** logic-in-UI graveyard, `now()`/`every` lifecycle smell, missing Z-stack overlay, deep-with verbosity, **accessibility-as-axis** (the only flash to call out a11y as a v1.0 gap).

**Spec pass added:** list mutation friction at scale (sharper than cheatsheet pass's logic-graveyard framing), 4-level nesting cap pushback prediction (defended explicitly), missing "once" lifecycle hook, error messages 10/10 axis ("Fix-it UX"). The dark-mode question at the end.

**Verdict:** flash's c'sheet and spec passes have *different focal points* rather than one being deeper. Cheatsheet pass framed the architectural risk; spec pass dove into specific UX concerns. Together they're complementary — adding flash to the panel was net signal.

### Cross-model delta meta-pattern

The cheatsheet under-teaches three classes of content:

1. **Appendix-D runtime semantics** (Opus surfaced this strongly; cheatsheet doesn't expose `round()` returns string, `contains` case, etc.).
2. **Appendix-B rules** (Opus surfaced component-vs-function casing rule absence).
3. **Architectural-scale concerns** (gemini-pro got these from cheatsheet alone; spec pass sharpened with D.8 citation).

Class 1 + 2 are cheatsheet patch candidates. Class 3 is a real ROADMAP question, not a docs gap.

---

## 4. GPT cheatsheet-only blind spots

GPT 5.3's response was *uncommonly thorough* — split speed/cost into multiple sub-axes, named effects/persistence/navigation/debuggability/typing/extensibility as separate axes, gave per-axis interpretations and anchors. Despite reading only the cheatsheet, GPT covered most of what the spec passes covered.

**Specifically what GPT *didn't* surface that Opus's spec pass did:**

- The Appendix-D specific smells (`round()` returns string, `contains` case, etc.). These are Appendix content the cheatsheet abbreviates.
- The Appendix-B "component-vs-function casing rule missing" finding. Same — cheatsheet teaches the convention by example; spec teaches via Appendix B.
- "Cross-screen function ban + flat shared = god-object" framing. GPT named both gaps separately but didn't unify them as one architectural failure mode the way both Opus passes and gemini-pro spec did.

**What GPT did better than either spec pass on its own**:
- Named *async cancellation race conditions* explicitly (`query = "a" / "ab" / "abc"` — do old fetches cancel?). No spec-pass cell raised this. GPT's only.
- Most explicit testing-syntax sketch (`test "Todo empty": render Todo / expect "No tasks yet"`).
- Composite scoring as three separate ratings: UI-DSL 8.8, language design 8.0, LLM-product 9.5 — best disambiguation of "score Igni" the panel produced.

**Verdict:** the cheatsheet *is* enough for high-level architectural and language-design critique. What it isn't enough for is Appendix-content-specific smells. Confirms the cheatsheet-vs-spec delta isn't an artefact of model strength — it's a real depth gap in the cheatsheet teaching.

---

## 5. Patch list — concrete and routed

Every patch surfaced by the panel, with routing target. **No edits made in this turn — this is the menu, Tyr decides.**

### ROADMAP Stream 3 candidates

Promote based on convergence count + alignment with existing v1.0 criteria (memory `project_v1_criteria.md`, doc 83 scope thesis):

1. **Testing infrastructure (7/7).** Highest possible signal. Headless test runner: `test "name": render Screen / tap "X" / expect Y`. Mock `fetch()`/`locate()`. Snapshot/golden tests. *Promote to "Next milestone" tier, not Stream 3 — this is the v1.0 blocker.*
2. **Accessibility primitives (4/7).** `alt:` on image, `hint:` / `semantic_label:` / `focus_order:` / `role:` on layout. v1.0 cannot ship without. *Stream 3, signal 4/7 from this run.*
3. **Animation primitives (3/7).** Even just `transition: fade`/`slide` on conditional renders + a `spring(value)` primitive would cover 80% of cases. *Stream 3, signal 3/7.*
4. **Internationalisation (1/7).** String wrapping, plural rules, locale-aware date/number formatting. *Stream 3, single-cell raise but coupled with a11y/animation as the "v1.0 primitive-class" trio.*
5. **Shared-namespace scoping (4/7).** `shared cart:` namespaced blocks. Concrete proposal from gemini-pro: `shared auth: user = null` accessed as `shared.auth.user`. *Stream 3, signal 4/7.*
6. **Cross-screen utility modules (4/7, coupled with #5).** `module` / `utils` files exporting pure functions, accessible from any screen. The two coupled gaps create the god-object failure mode. *Stream 3, signal 4/7.*
7. **`each` keying + memoization escape (3/7).** Either an explicit `key:` on `each` items + memoize, or a `memoize:` modifier on layouts/components. The current "all components rebuild every tick" rule (D.8) is fine for prototypes but won't scale. *Stream 3, signal 3/7.*
8. **Deep-object-update sugar (3/7).** Either `update_path(obj, "a.b.c", value)` builtin OR shorthand syntax for nested with-chains. *Stream 3, signal 3/7.*
9. **Lifecycle hook (`once:` or `on appear:`) (2/7).** For analytics events, socket connections, "fire-once-on-mount" patterns. *Stream 3, signal 2/7 cross-model.*
10. **Z-stack / overlay layout (2/7-flash).** FAB, badge-on-corner, modal. *Stream 3 with cited single-model-bias caveat; promote to "active candidate" only after a non-flash cell raises it.*
11. **Async error introspection (2/7-pro).** `result.error.message` / `.status` so 401 vs 500 can be distinguished. *Stream 3 with cited single-model-bias caveat; promote on compounding signal.*
12. **Async cancellation semantics (1/7-gpt).** Currently undefined — what happens when `query` is reassigned mid-fetch? *Stream 3 with cite; needs a design note before syntax lands.*

### v0.17.1 docs-only patch candidates (cheatsheet)

From the Opus spec-pass smells + the v0.17.0 Stage 3 finding from prior session:

1. **Component-vs-function casing rule into the cheatsheet's rules-summary section** (or equivalent of Appendix B). Concrete lines: "PascalCase = component invocation (no parens). lowercase = function call (parens)." Currently inferred from examples; should be explicit.
2. **`round(x, n)` return-type pin.** Cheatsheet should say verbatim: "`round()` returns a *string* — use it for display, not for comparison. For numeric rounding use `floor()`." Or rename `round()` → `format_number()` in v0.18 (separate decision).
3. **`contains` case-asymmetry pin.** Document that `contains` is case-insensitive while `is` is exact. One-line note in §Lists.
4. **Derived-state-non-reactivity louder teaching.** GPT specifically called out that `total = count * price` non-reactivity surprises every reactive-language native (React/Vue/Svelte/Solid). The cheatsheet teaches this rule but the surprise lands anyway. Add an explicit "common mistake" callout.
5. **No `\` line-continuation pin.** Carried forward from v0.17.0 Stage 3 soft-fail (flash-lite at noise tier reached for backslash continuation). One-line addition under §Arranging things.
6. **Sub-second `every` known limitation note.** Currently the cheatsheet just says "1s/5s/30s only." Add: "for animation loops or sub-second polling, this is currently a known limitation; tracked as v0.18+ candidate." Sets reader expectation.

### Cookbook entries (memorable shapes from single-cell raises)

1. **Outlined button via wrapper layout** — already in v0.17 cheatsheet as a §Border subsection; cookbook entry would just cross-reference.
2. **Deep-object-update via temporary local** — show how to flatten a nested `with`-chain into named intermediate variables for readability, ahead of any sugar landing.
3. **`each` keying via `id` field convention** — until the language has a `key:` modifier, document the "use a unique `id` field on list items + reference by id, not index" pattern.
4. **Selected-state via two helpers (border width + colour)** — already in v0.17 cheatsheet; cookbook cross-reference.

### Trap-journal entries (methodology observations)

1. **Opus's "I would trip on rule X" self-assessment as a more credible signal than less-capable cells' confident high scores.** When the most-capable reasoner on the panel (Opus is at the top of the strength tier here) self-reports concrete trip-points, that's a sharper diagnostic than a Gemini-flash confident 9.5/10 LLM-accuracy score. Worth a methodology note: *frontier reasoners' self-reported failure modes are higher signal than their composite scores.*
2. **Cheatsheet under-teaches Appendix-content** — confirmed across the within-model deltas. Methodology pattern: chat-mode reviews against the cheatsheet specifically may need to be paired with a spec-pass for at least one capable reasoner, since cheatsheet-only readers won't surface Appendix smells. *This is a recurring methodology improvement, not just a v0.17 finding.*
3. **The "question back at the reader" pattern.** 4/7 cells ended their response with a question — escape hatches (gemini-flash c'sheet), dark mode (gemini-flash spec), large-team domain logic (gemini-pro spec), data-formatting at scale (gemini-pro c'sheet). What the model perceives as the most-pressing missing thing is a soft signal — and across 4 different open questions, the convergent theme is "what's the escape hatch when Igni doesn't cover the use case?" (FFI / native plugin / shared utility / theme variant). This is the same gap the panel raised structurally as #5/#6 in the patch list.

---

## 6. Methodology verdict

- **7 cells was enough.** Testing convergence at 7/7 was the strongest possible signal — further cells would have been confirmation, not new information. Three within-model deltas (instead of the planned two) was a free upgrade from Tyr adding the gemini-flash variants on the day.
- **Within-model deltas surfaced real depth gaps in the cheatsheet teaching.** Worth the spend (free here since chat-mode). The Opus delta in particular produced a concrete v0.17.1 cheatsheet patch list that wouldn't have surfaced from a cheatsheet-only run.
- **The "state which interpretation" framing on speed/cost worked partially.** GPT split into multiple sub-axes (good); Opus and gemini-pro picked one and stated it (good); only gemini-flash didn't disambiguate explicitly (combined cognitive+token under one number). Net: keep the framing for future runs; the disambiguation discipline produces interpretable scores in 6/7 cells.
- **Chat-mode produced sharper signal than an API equivalent would have.** Open-ended ratings + "biggest things before v1.0" framing produces prose critique; an API panel would have to constrain the format. The cost is reproducibility — if any of these findings need dissertation-grade citation, an API rerun against pinned model IDs is a separate decision.
- **The 4/7 "question back at reader" pattern is methodologically interesting**, not just data. Four different open-ended questions converging on "where's the escape hatch?" is itself a finding. Worth incorporating into future cold-test prompt designs as an explicit ask: "name the escape hatch you'd reach for when Igni doesn't cover your case."

**Promotion question (carried forward, not decided this turn):** the chat-mode-meta-review is now a 3-precedent pattern (v0.14.1, v0.15.0, v0.17.0). Each produced sharper signal than the parallel API panels. Worth promoting from one-off to recurring stage in `docs/cycle.md`? Decision separate from this synthesis — Tyr's call after weighing the existing cycle's complexity vs. the methodology contribution.

---

## 7. Out-of-scope (carried forward from plan)

This synthesis surfaces patches; **no edits to ROADMAP / spec / cheatsheet / cookbook / docs-private in this turn.** Next-step decisions all Tyr's:

- Which of the 12 ROADMAP candidates promote (and at what priority)
- Whether to spin a v0.17.1 docs-only iteration around the 6 cheatsheet patches
- Whether the methodology pattern earns a recurring-stage promotion in `docs/cycle.md`
- Whether to commit + push this directory now or batch with whatever else accumulates
