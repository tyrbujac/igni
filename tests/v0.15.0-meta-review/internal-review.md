# Internal review — Igni at the close of v0.15.0

Written 2026-04-26 by Claude Code from a structured read of the repo. Part A
of the meta-review; the *Synthesis* section at the bottom compares this read
against the 4-model panel response in this directory once it returns.

**Caveat up front.** Claude has co-authored a sizeable share of this repo
(spec critiques, design notes, transpiler patches, tutorial drafts), and a
prior project review by Claude is already on file at
`docs/private/102_claude_code_project_review.md` — flagged in that note for
self-bias risk. Treat this review as one perspective, not as an external
audit. The frontier-model panel in the sibling files is the closer
approximation to a fresh read.

## What I read

- `spec/v0.15.0.md` (canonical spec, ~2k lines).
- `CLAUDE.md` (agent contract, 95 lines).
- `README.md` (public face, 194 lines).
- `ARCHITECTURE.md`, `ROADMAP.md`, `CHANGELOG.md` for orientation.
- `transpiler/src/` directory structure + LOC distribution
  (lexer 333 / parser 1581 / codegen 2993).
- `tests/runner/` panel infrastructure.
- `transpiler/examples/` (58 .igni + .expected.dart pairs) and
  `transpiler/examples-errors/` (32 pinned rejection fixtures); SYNC marker
  reports 90 diff tests in CLAUDE.md, all passing.
- `docs/private/` headlines (101–106 most recent), `trap-journal.md` aggregate
  (cli-ux 15, runtime 4, methodology 4 — the dominant signal class).

I did **not** run the full panel or the smoke harness as part of this review;
my read is from the artefacts as committed.

## 1. Language-design coherence — strong, with two strain points

The non-negotiable principles in `CLAUDE.md` (one way to do everything, no
brackets, max nesting 4, no magic, components-via-indentation, immutable
component args, lexical reactivity) are doing a lot of work, and they hold
up against v0.15.0's surface. Reading the spec straight through, I cannot
find a feature that a frontier LLM would have to hold two competing forms
in mind. The only sanctioned "magic" is the lexical-reactivity rule, and
the spec is direct about labelling it as such.

Two strain points worth naming:

**Strain 1: derived-state semantics under-pinned.** The v0.14.1 cheatsheet
review surfaced 2/4 model uncertainty on whether `derived = base * 2` at
the top of a screen recalculates when `base` changes. The v0.14.2 docs
iteration pinned this in the cheatsheet, but a fresh reader of the full
spec — especially one looking for the dependency graph — still has to
infer the rule from the lexical-reactivity statement plus the absence of
recalculation in worked examples. This is a known watchpoint, not a fresh
finding, but it has not gone away.

**Strain 2: error-state inspection beyond async.** 3/4 cold-test signal
that `is error` is fine for fetch-failures but doesn't extend to user
validation, null on out-of-bounds, or function-level exceptions. The spec
is genuinely silent here, and silence is the right move *if* the project
intends to ship a single error primitive that covers all four — but the
silence currently reads as gap rather than restraint.

Everything else (reactivity, components, layouts, theme, bind, fetch,
locate, every) reads as coherent. v0.14's `every <duration>:` and v0.14.1's
`bind: shared.X` widening are good examples of additions that paid the
spec-budget tax for a clear primitive ratio rather than a verbosity
saving — exactly the rule CLAUDE.md asks for.

## 2. Transpiler — 95% surface coverage, real test discipline

LOC distribution is healthy (~7.4k TS): codegen the largest, parser
moderate, lexer small. 90 diff tests + 32 negative fixtures means 122
pinned behaviours total — and the negative fixtures matter as much as the
positive ones, because they encode design rules in code (assignment-in-UI-
body, count+lambda, bare-shared access, and four others).

The `npm run smoke` harness (added 2026-04-26) is the right fix to the
real gap exposed by the pomodonut session, where four real bugs got
through `npm test` because diff tests don't run apps. Smoke catches
~half of bug classes by running `flutter analyze` against the kitchen-
sink scaffold; the remainder (visual layout, runtime correctness) need
heavier instruments and are correctly punted in ROADMAP Stream 2.

Known transpiler gaps from ROADMAP that I'd flag as worth tracking:

- **Duplicate-theme error line attribution** (combined-source coords leak
  through `formatTranspileError`). Concrete fix in `parser.ts:43-50`.
  Already in Immediate; surface this whenever auto-discovery semantics
  are touched.
- **Better Dart-error → Igni-line mapping** (Stream 2 #2). The
  int-divide trap surfaced this at the user level; v0.14.3 shipped the
  Igni-side check, but the underlying mapping work is still open.
- **Gemini Pro provider resilience** (Stream 2 #4). Six cumulative network
  failures across two Stage 3 rounds is methodology-relevant — panel
  results are dissertation evidence, and a flaky panel cell is a noise
  source.

## 3. Test methodology — the strongest part of the project

This is, in my read, where Igni is most differentiated. The layered
test stack is unusually thoughtful for a research prototype:

- **Diff tests** for codegen pinning (90 cases).
- **Negative fixtures** for design-rule pinning (32 cases).
- **Smoke harness** for catches `flutter analyze` finds at PR time.
- **Cold-LLM panels** at three stages of every cycle (Stage 0 adoption
  pre-implementation, Stage 2 design critique pre-ship, Stage 3 ship-
  validation, plus per-minor-version cheatsheet review and post-ship
  Stage 7 critique).
- **Mum dress-rehearsals** as the non-technical-user signal that
  frontier-model panels demonstrably miss.

The critical insight in the trap journal aggregate is the cli-ux:runtime
ratio of 15:4. *That ratio is the dissertation result.* Two rounds of
mum-testing have pushed the curve hard — the spec and runtime are
filtering bugs out before they reach the user, and what's left is
surface-level (errors, tutorial pacing, friction). Frontier-model panels
do not catch this class. This is a load-bearing methodology finding for
the COMP390 chapter and should be written up as such.

The one thing I'd flag here is the **automation principle** in
`docs/private/104` (and now in `CLAUDE.md`): "plumbing yes, judgement no."
This is the right rule, but the rule itself is becoming dense — the cycle
has 9 stages, branches for skip-Stage-2, special cases for
docs-only-iterations, and a per-minor-version cheatsheet review. There is
real cognitive load on Tyr to remember which stage applies when. A short
flowchart at the top of `docs/cycle.md` (or a single-screen state-diagram
rendered as ASCII in the file) would not violate the automation principle
and would compress 9 stages into a glanceable artefact. I'd recommend it.

## 4. Documentation — rich, mostly well-organised, one synthesis gap

The three-tier spec format (full / cheatsheet / micro) is paying off — the
cheatsheet is the cold-test injection format, the full spec is the prose
reference, and the micro is for fast scan. They evolve together via SYNC
markers, which means doc drift is structurally hard to introduce.

**Where the docs land well:** `ARCHITECTURE.md` orients a new contributor
faster than I expected for a 2k-line spec project. `CLAUDE.md` is one of
the cleanest agent contracts I've read — the non-negotiables list at the
top is a strong filter, the "common pitfalls" section is concrete and
short, and the "honest no" framing is unusually self-aware.

**Where the docs land less well:**

- **110+ private design notes**, numbered chronologically, with no index.
  CLAUDE.md says "append-only chronological research record" — that's the
  right discipline — but the *retrieval* problem is now real. A ranked
  index by topic (state model, error handling, theming, Path C, Figma,
  methodology) would make the corpus searchable without breaking the
  append-only rule. This is plumbing, not judgement, so it doesn't tax
  the dissertation methodology.
- **README.md "Status" section reads as half-changelog, half-evidence
  summary**, and the two are doing different jobs. The "concrete evidence
  so far" paragraph in the lede already nails the evidence story; the
  later "Latest spec change" / "Latest methodology result" lines are
  duplicative for someone who already finished the lede. Worth a pass.
- **The README's "Using Igni with an LLM" section** assumes the cheatsheet
  paste is the recommended workflow, but the Path C / Figma framing in
  the positioning lede implies a richer pipeline (Figma → cheatsheet →
  LLM → Igni). The README hasn't yet caught up to the Path C commit.

## 5. Roadmap & cycle discipline — the tiering is holding

Three-tier ROADMAP (Immediate / Next milestone / Future) is doing what it
was designed to do: when I read the top, I can see the active focus
without scrolling through ideas. The signal-ranked Stream 3 backlog
(`bind: shared.X`, identity semantics, dictionary, recurring-timer, etc.)
is honest about which items have cold-test data and which are
brainstorm-without-signal-yet. v1.0 criterion-4 progress (1/3 real apps)
is concrete and falsifiable.

**The Next-milestone-promotion-by-decision rule is the single most
underrated piece of project governance in this repo.** "When it ships,
the next milestone is promoted from Future — promotion is an explicit
decision, not drift." That rule prevents the slow expansion of "in
progress" that kills most solo projects.

Watchpoint: the **Recently shipped** section is now ~25 entries deep on
2026-04-26 alone. CHANGELOG.md is the right home for entries older than
a week; ROADMAP's "recently shipped" is doing journal duty when it
should be doing pointer duty. A weekly compression pass would keep the
top of the file glanceable.

## 6. Watchpoints / concrete recommendations

Ranked highest-leverage first.

1. **Index `docs/private/`.** A `docs/private/INDEX.md` keyed by topic,
   regenerable from a script that scans frontmatter or first-paragraph
   tags. Plumbing, dissertation-safe. The retrieval problem is present
   today and will only get worse.
2. **Compress ROADMAP "Recently shipped" weekly.** Old entries to
   CHANGELOG, top section stays a glanceable pointer.
3. **Pin derived-state semantics in the *full spec*** (not just the
   cheatsheet). The cheatsheet got the v0.14.2 pin; the full spec is the
   place a careful reader goes for runtime-truth and currently still
   has to infer.
4. **Single-page cycle flowchart at the top of `docs/cycle.md`.** ASCII
   state diagram of the 9 stages with skip-conditions noted. The
   methodology is sophisticated; the entry surface should not be.
5. **Decide whether "error inspection beyond async" is a v0.16 design
   note or an explicit non-goal.** Either is fine; silence is the
   weakest answer.
6. **README.md tightening.** Drop or fold the duplicative
   "Latest spec change" / "Latest methodology result" Status lines into
   the lede paragraph that already does the evidence work. Update the
   "Using Igni with an LLM" section to acknowledge the Path C pipeline
   if the project is committed to that framing publicly.
7. **Trap-journal aggregate as a dissertation artefact.** Write up the
   15:4 cli-ux:runtime ratio explicitly in the methodology chapter, with
   the explicit claim that frontier-model panels are blind to this bug
   class.
8. **`igni new` scaffolding** (Stream 2 #3). Lower priority than the
   above, but worth flagging — `igni new` is one of the first commands
   a new user runs, and right now the README implies it exists in a way
   that the codebase is still building toward.

## 7. Honest limits of this review

- I did not run the panel myself before writing this section; I'm
  comparing the panel's outputs against my read in the *Synthesis* below.
- I did not run the smoke harness, did not browser-test pomodonut, and
  did not exercise `igni run` end-to-end. My transpiler read is from
  source-shape and test-count, not from running the system.
- I cannot evaluate dissertation-chapter coverage from inside the repo —
  the methodology is here, but how it lands as a written argument is a
  separate artefact I haven't seen.
- I have prior involvement (per the caveat at the top); a fresh
  external read would catch things I have learned to look past.

## Synthesis

Panel completed 2026-04-26, $0.85 across 4 cells. **Three of four cells
returned substantive prose; GPT-5.5 hit `stop_reason: length` with 8192
reasoning tokens consumed and an empty body** (failed cell, methodology
note below). Convergence-counting is therefore over n=3 visible models:
`claude-opus-4-7`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.

### Convergent findings (≥2/3 agree)

1. **Lexical reactivity is the strongest design choice — 3/3.** All three
   models named "the screen re-evaluates whenever a referenced variable is
   reassigned" as the load-bearing rule and the thing Igni gets *most*
   right. Opus: "the entire model... the spec keeps refunding this rule."
   Gemini Pro: "profoundly simple... massive win for human readability."
   Flash Lite: "significantly reduces the training surface for an LLM."
   This is a strong protect-this signal.

2. **The v0.15.0 spec opens with version-history prose that violates
   CLAUDE.md's own rule — 2/3.** Opus and Gemini Pro both name this
   exactly: the "Changes from v0.14.0" paragraph at the top of the spec is
   doing changelog work in a document that CLAUDE.md instructs to "teach
   the language first; don't open with release notes." Opus calls it the
   highest-leverage fix in the project; Gemini Pro lists it as an Immediate
   v0.15.1 change. **I missed this in Part A.** Fair hit — the rule is in
   CLAUDE.md (line 49 in the version I read) and the spec is currently
   in violation. Cost-to-fix: very low. Leverage: very high.

3. **The multi-view-screens "tactical pattern" reads as a workaround for
   missing navigation, not a feature — 2/3.** Opus: "the spec is inviting
   users to route around its missing features... I'd cut this section or
   move it to the cookbook." Gemini Pro: "feels like a symptom of a
   missing routing primitive, not a feature to be celebrated." Flash Lite
   touches the adjacent point about `fetch` mutation having a "tactical"
   feel rather than a language-level primitive. **I didn't catch this in
   Part A.** This is the kind of cross-document tension I'm prone to
   missing because I have prior involvement; both fresh-read models
   spotted it.

4. **Runtime-semantics gaps beyond what's pinned in the spec — 3/3.** Each
   model produced 4–12 numbered Q3 items, and the categories overlap
   substantially: equality semantics (`is` for primitives vs objects vs
   strings vs lists), `each` over non-lists / "do this N times", in-flight
   `fetch` cancellation when dependencies change, `every` concurrency
   under slow handlers, component re-evaluation cost in `each`, null
   propagation on chained access, block scoping inside `if`/`each`, init
   vs render boundary, component event payload binding (`emit` →
   `on X:`). The convergent shape is: the lexical-reactivity rule is
   precise, but the runtime behaviour *that follows from* the rule is
   under-pinned. This generalises my Part A point about derived-state
   semantics to a much wider gap. **A "Runtime semantics" spec appendix
   pinning answers to ~10 of these** is the highest-leverage v0.16 spec
   addition the panel surfaced.

5. **Component event payload binding (`emit` → `on X:`) is genuinely
   under-specified — 2/3.** Gemini Pro made the cleanest case: the
   `AlertRow alert, on delete: alerts = without(alerts, alert)` example
   isn't actually demonstrating event-payload capture — it's closure over
   a loop variable. The spec says "parent picks the binding name in its
   handler body" but provides no syntax for *how* to bind a payload that
   the child emits. Gemini Pro's concrete proposal (`on submit(query):`)
   is implementable in a single design note. Flash Lite's adjacent Q3 #3
   on `emit` payload constraints corroborates. **I didn't catch this in
   Part A** — I read past the example without noticing the closure-vs-
   payload conflation.

### Where I diverged correctly from the panel

- **Internal-doc / repo navigation gaps.** Neither panel cell flagged the
  110+ unindexed `docs/private/` entries or the ROADMAP "Recently shipped"
  bloat. These are real but inside-the-house concerns the panel can't see
  without spelunking — fair miss on their part, not theirs to catch.
- **Trap-journal cli-ux:runtime ratio as a dissertation-methodology
  result.** The 15:4 ratio claim is a methodology-chapter argument the
  panel can't make from the public docs alone. My Part A point stands.
- **Smoke-harness vs `flutter analyze` reasoning.** The panel didn't have
  enough transpiler internals visible to evaluate this.

### Where the panel diverged correctly from me

The four convergent findings above (spec-opening violation, multi-view-
screens as workaround, runtime-semantics scope, event-payload binding gap)
are fair hits I missed. Two of the four (#2, #5) are concrete and
shippable; the other two (#3, #4) are larger surface decisions.

### Per-cell notes

- **`claude-opus-4-7`**: 17KB response, 12 numbered Q3 items, 8 prioritised
  Q4 recommendations, plus an explicit "convergences worth naming" section.
  Strongest depth and specificity. Opus's Q4 #8 (a cold-LLM round
  *specifically targeting semantic uncertainties*, where convergent wrong
  answers identify under-pinned behaviour) is genuinely a new methodology
  proposal — separate from existing Stage 0/2/3 — and is the strongest
  panel-only signal worth a `docs/private/NN_*` design note.
- **`gpt-5.5`**: failed cell. `stop_reason: length`, 8192 output tokens
  consumed entirely as reasoning, file 0 bytes. Same failure-class as the
  Gemini Pro network-failure pattern logged in ROADMAP Stream 2 #4 — both
  are dissertation-evidence noise sources. Worth a one-line trap-journal
  entry under `methodology` (panel-cell-failure-modes are now multi-
  provider; can't blame Google alone).
- **`gemini-3.1-pro-preview`**: 7.7KB response, 4 Q3 items, 5 Q4 recs.
  Concrete and well-targeted. Independently named the spec-opening
  violation and proposed a clean `on submit(query):` syntax for event
  payloads. Lower output-token count than Opus but higher signal density.
- **`gemini-3.1-flash-lite-preview`**: 5.2KB, 4 Q3 items, 4 Q4 recs.
  Surprisingly good for a lite-tier model — caught the `fetch` reactive-
  vs-imperative bifurcation, the `theme:` last-write-wins multi-file
  ambiguity, and `every`-block concurrency under slow handlers. Different
  recommendations from the other two (proposes a `mutate` keyword and a
  global-namespace-sweep CLI step). Some of these are over-engineering
  in Igni's spec-budget terms but the diagnostic readings are sharp.

### Panel-only signals worth escalating

These did not appear in Part A and warrant a Tyr decision on whether to
file as a numbered design note:

1. **Move v0.15.0's "Changes from v0.14.0" paragraph out of the spec
   opening; replace with a one-sentence delta.** 2/3 panel + an explicit
   CLAUDE.md rule violation. v0.15.1 docs-only, very low cost.
2. **Component event payload binding syntax (`on X(name):` or similar).**
   2/3 panel. Genuinely missing primitive, not a documentation gap.
   Needs a design note with Stage 0 cold-test before syntax lands.
3. **Runtime semantics appendix.** 3/3 panel surfaced ~15 distinct
   under-specified runtime questions across equality, scoping,
   lifecycle, propagation. Single appendix could pin most of them
   without new syntax. Highest LLM-correctness payoff per word added.
4. **Multi-view-screens section: cut or demote to cookbook.** 2/3 panel.
   Lower-priority, blocked on real navigation primitives shipping in
   v0.17+.
5. **`count(list, predicate)` gap.** 1/3 (Opus only) but a concrete
   cross-builtin inconsistency. Smallest possible change to remove a
   sharp edge.
6. **Methodology proposal: cold-LLM round on semantic uncertainties.**
   1/3 (Opus). Continuous with existing methodology, targets a different
   defect class than "models invent syntax." Plausibly the next
   dissertation-contribution-relevant methodology iteration.

### Honest assessment

The panel is more useful than I expected for a meta-review (vs. a
feature-gate Stage 2/3). Two of the four convergent findings (#2 spec-
opening, #5 event-payload) are fixes I should have caught in Part A and
didn't. The runtime-semantics gap (#4) is the largest and most expensive
to address, but a single appendix would cover most of it. The multi-view-
screens point (#3) is a longer-horizon design decision tied to
navigation.

The bias caveat at the top of Part A is load-bearing: prior involvement
made me read past two of the four convergent issues. Future Tyr-initiated
project-wide reviews should run the panel *first* and use the panel as a
reading prompt for the human's own re-read — not the other way round.

### Costs

| cell                                | cost USD |
|-------------------------------------|----------|
| claude-opus-4-7                     | $0.3651  |
| gpt-5.5-2026-04-23 (failed)         | $0.3938  |
| gemini-3.1-pro-preview              | $0.0855  |
| gemini-3.1-flash-lite-preview       | $0.0097  |
| **total**                           | **$0.8540** |

Failed-cell cost ($0.39) is the largest single cell despite producing no
output — methodology-relevant for the dissertation cost-per-finding
table.
