# v0.19 animation + snapshot design review — Stage 2

Stage 2 panel — 3 frontier models critique design note 113 (`docs/private/113_v019_animation_snapshot.md`) before any spec edit lands. The doc proposes the v1.0-blocker animation + snapshot bundle: `transition: fade`/`slide` modifier on conditional renders + `spring(value)` declarative value-animation builtin + `snapshot "<name>"` test-scope verb (text-tree only) + `mock now:` / `freeze_time:` time-mock infrastructure. Bundling pre-decided by doc 112 Stage 2 Trigger-A; Q1–Q5 locked by Tyr 2026-04-28.

Run via `tests/runner/run.ts --no-spec --no-grade` against three frontier models (`claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`). Outputs are prose, not Igni code.

Why a Stage 2 against the framing: this is the project's **second framework-shaped change** (after v0.18 testing infrastructure). Animation has a runtime layer (transition controllers, spring physics) on top of the surface syntax; snapshot has its own subsystem (golden-file storage, diff representation, `--update-snapshots` semantics). Doc 112 §Framework-shaped established the cycle adaptation; v0.19 inherits it. **Highest-pressure question is Q2 (spring vs duration)** — peer-language argues 3/4 toward declarative spring, but Flutter (Igni's compile target) is duration-based. Stage 2 should pressure-test whether the spring lock survives the Flutter-runtime fit.

Treat panel responses as input to a Tyr decision, not the decision itself. Patch decision (per spec-cycle skill rules): 3/3 convergent on a refinement → patch doc 113; 2/3 → consider; 1/3 → log only. Trigger A in doc 113 fires if 2/3+ flip the Q2 spring lock.

## 1. v0.19 animation + snapshot design critique

> You are reviewing a design note for the Igni programming language ahead of v0.19 implementation. Igni is a UI-first programming language with the north star "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword/syntax form is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Indentation, no brackets**: block structure is whitespace + colons. No braces, no parentheses on component invocation.
> - **PascalCase = component (no parens), lowercase = function (with parens).**
> - **Lexical reactivity**: each screen re-evaluates from the top whenever any variable it references is reassigned. No `setState`, no signals — just assignment.
>
> v0.18 just shipped (testing infrastructure: `test "name":` block + `render` + event-sims + `expect` + `mock fetch:` / `mock every:` blocks + sub-second `every` widening). The shipped meta-review panel that drove v0.18 also flagged three v1.0-blocker primitive classes — accessibility (4/7), animation (3/7), internationalisation (1/7) — and during v0.18's Stage 2, the panel converged 3/3 on splitting **snapshot/golden-file regression testing** off into v0.19, paired with **animation primitives** (Stage 2 Trigger-A fired in doc 112). Verbatim panel rationale: *"v0.19 will pair snapshot with animation primitives (which also need golden-frame comparison and benefit from the same time-mock infrastructure)."*
>
> The design note below is Stage 1 + Q1–Q5 locked. Tyr has already locked five sub-decisions on 2026-04-28: Q1 — animation surface split between `transition:` (conditional renders) and the value-animation primitive (everything else), no auto-animation on layout property change; Q2 — `spring(value)` declarative value-animation builtin, on 3/4 peer-language evidence; Q3 — text-tree snapshots only for v0.19, image/golden deferred to v0.20+; Q4 — bundle `mock now:` / `freeze_time:` in v0.19; Q5 — token-only `transition:` (no per-call duration argument). Q2 is the highest-pressure lock — Flutter (Igni's compile target) is duration-based, and the panel should pressure-test whether the declarative-spring shape survives Flutter-runtime fit.
>
> The design note follows. Read it carefully, then answer the six specific questions at the end. Be substantive and direct.
>
> ---DESIGN NOTE START---
>
> ## 113 — v0.19 animation primitives + snapshot testing (Stage 1 + Q1–Q5 locked)
>
> **Source signal:**
>
> - **Animation — 3/7 v0.17.0 meta-review.** Opus c'sheet ("A UI language without animation is shipping in the wrong decade", 0/10), opus spec ("Real apps need motion. Bolting this on later risks breaking the 'one way' rule because Flutter's animation model … doesn't fit lexical reactivity", 0/10), gpt c'sheet (named under "extensibility risk"). Verbatim shape proposal from opus spec: *"Even just `transition: fade` / `slide` between conditional renders, plus a `spring(value)` primitive, would cover 80% of cases."*
> - **Snapshot — split from v0.18 at Stage 2 Trigger-A** (3/3 panel convergence). Reasons cited by that panel: snapshot has its own separable design surface; lowest panel signal of the originally-bundled v0.18 elements; biggest canonical-example bug surface — snapshots of UI containing `now()`, random IDs, or fetch-derived content are non-deterministic without a companion `mock now:` / `freeze_time:` design.
> - **Sub-second `every` already shipped** in v0.18 (`16ms` / `100ms` / `500ms` whitelist additions). Animation foundation is already in place; v0.19 adds the surface syntax.
>
> **Locked sub-decisions** (Tyr, 2026-04-28):
>
> - **Q1 — Animation surface: split.** `transition:` modifier handles conditional-render swaps only; value interpolation goes through `spring(value)`. Auto-animation on every layout property change rejected as magic.
> - **Q2 — Value-animation shape: `spring(value)` declarative.** `count = spring(target_count)` smoothly animates `count` whenever `target_count` is reassigned. 3/4 peer-language evidence (SwiftUI / Compose / Framer Motion). New builtin. *Pressure-test in this Stage 2: Flutter is the 1/4 outlier; does the declarative-spring lock survive the Flutter-runtime fit?*
> - **Q3 — Snapshot scope: text-tree only.** Render-tree-text snapshot for v0.19; image/golden-file regression deferred to v0.20+ if real-app pull demands it.
> - **Q4 — Time-mock bundling: bundle.** `mock now: <iso-timestamp>` and `freeze_time:` block forms ship in v0.19. Closes the doc 112 Reason-c canonical-example bug surface for snapshots of `now()`-derived UI.
> - **Q5 — `transition:` argument granularity: token-only.** `transition: fade` / `transition: slide`, system-default duration, no per-call argument. Matches `border:` width-token discipline (`thin/medium/thick`, not `1px/2px/4px`) from v0.17. Widen via compounding-signal pattern if Stage 0 surfaces real friction.
>
> ### What v0.19 *is* and *isn't*
>
> **Is** (Q1–Q5 locked):
>
> - `transition: fade` / `transition: slide` modifier on conditional renders (between `if`/`else` branches and across `each` list-item add/remove). Token-only; system-default duration. Codegen target: Flutter `AnimatedSwitcher`.
> - `spring(value)` declarative value-animation builtin. Codegen target: Flutter implicit-animation tween via `TweenAnimationBuilder` driven by the spring physics curve.
> - `snapshot "<name>"` test-scope verb in `*.test.igni` files. Render-tree text snapshot. Reuses v0.18's `render` + assertion vocabulary. Joins the v0.18-locked test-scope syntactic-forms category alongside `seen` / `tap` / `change` / `submit` / `toggle` / `slide` / `advance` / `mock` (per doc 112 Q8). No spec-budget growth.
> - `igni test --update-snapshots` CLI flag. (Deferred from v0.18 per doc 112 Q-C; lands here.)
> - `mock now: <iso-timestamp>` and `freeze_time:` block forms. Implementation mirrors v0.18's `mock fetch:` / `mock every:` block patterns; returns a frozen value for `now()` calls inside the `freeze_time:` body.
>
> **Isn't:** scroll-driven animation; gesture-driven motion; lifecycle hooks (`once:` / `on appear:` — Stream 3, separate doc); per-element animation curves (custom `cubic-bezier(...)` etc.); accessibility primitives (v0.20+); i18n primitives (v0.21+); shared-namespace scoping (awaiting empirical pull); image/golden-file snapshots (v0.20+); property-based testing; deep mocking of `locate()`/`play()`.
>
> ### Why this bundle earns v0.19
>
> - **Snapshot-without-animation is undertested.** Static-screen snapshots cover doc 112 Walls 1–4, but the most error-prone surface for golden-file regression is exactly the part that *moves*: conditional-render swaps, list reorderings, value transitions.
> - **Animation-without-snapshot is unverifiable.** A `transition: fade` claim across an `if`/`else` swap has no test surface today. `expect seen "Welcome"` after the swap doesn't verify the transition fired; it verifies the post-state. Golden-frame snapshots at intermediate timestamps (paired with `mock every: advance 100ms`) are the standard verification path.
> - **Both need the same time-mock infrastructure.** Snapshot non-determinism on `now()`-derived UI and animation determinism for testing point at the same `mock now:` / `freeze_time:` companion design. Designing it twice — once for snapshot in v0.19, once for animation in v0.20 — duplicates effort and risks divergent semantics.
>
> ### Visual-chrome boundary applicability (per doc 111)
>
> Animation is the borderline case. Per doc 111's boundary rule:
>
> - *Pure-transition uses* (fade between two views, slide a panel in) are decorative-substitutable. Cold-test prompts ("build a habit tracker") will not invent them. **Under-signal expected.**
> - *Interaction motion* (focus indicators, drag affordances, ripple feedback) is semantic-load. **Normal signal expected.**
> - *State transitions* (loading→loaded fade, expanding/collapsing accordions, "added to cart" pulse) straddle the line. Communication-channel-for-state behaviour suggests these *do* surface in functional cold-tests. **Stage 0 prompt design must include a state-transition prompt to test this empirically.**
>
> The doc 111 three-prong promotion gate (Path C prior + peer-language survey + hand-translation validation) applies for the *pure-transition* portion; *interaction motion* and *state transition* portions promote on standard cold-test signal.
>
> ### Hard examples — walls hit at v0.18
>
> - **Wall 6** — fade between two states of a conditional render. A login screen swapping `if logged_in: Dashboard else: Login` cuts hard.
> - **Wall 7** — animate a value smoothly when it changes (counter 0 → 10 over 200ms on tap).
> - **Wall 8** — snapshot-test a payment-flow screen across loading/loaded/error states (text-tree comparison).
> - **Wall 9** — assert a transition fired without depending on wall-clock timing (requires `mock every: advance` from v0.18 + snapshot-at-intermediate-state from v0.19 — the bundling justification).
>
> ### Proposed shape — illustrative canonical examples
>
> *(Stage-1 illustrative; surface details may revise during implementation. The locks are on the primitive shapes — `transition: <token>`, `spring(value)`, `snapshot "<name>"`, `mock now:`, `freeze_time:` — not the example app shapes. If you find bugs in the example shapes themselves, raise them under Q4.)*
>
> ```igni
> # Profile.igni — transition: fade on conditional render
> screen Profile:
>   loading = true
>   user = none
>
>   layout vertical, padding: large, transition: fade:
>     if loading:
>       label "Loading…", style: caption
>     else:
>       label user.name, style: heading
>
> # StepCounter.igni — spring(value) on a displayed counter
> screen StepCounter:
>   target_steps = 0
>   displayed_steps = spring(target_steps)
>
>   layout vertical, gap: medium, padding: large, align: center:
>     label displayed_steps, style: heading
>     button "Add 100", on tap: target_steps = target_steps + 100
>
> # Profile.test.igni — snapshot + freeze_time
> test "profile renders user name when loaded":
>   freeze_time: 2026-04-28T12:00:00Z
>   render Profile, shared.user: {name: "Tyr", email: "tyr@example.com"}
>   snapshot "profile_loaded"
>
> # StepCounter.test.igni — assert spring reaches target after time advance
> test "spring counter reaches target after 1 second":
>   render StepCounter
>   tap "Add 100"
>   mock every:
>     advance 1000ms
>   expect value_of(displayed_steps) is 100
>
> # Feed.test.igni — mock now: for relative-time UI
> test "feed renders relative timestamps":
>   mock now: 2026-04-28T12:00:00Z
>   mock fetch:
>     "/api/feed": [{ts: "2026-04-28T11:00:00Z", text: "Hello"}]
>   render Feed
>   expect seen "1 hour ago"
>   snapshot "feed_with_relative_time"
> ```
>
> ### Watch-list — falsification triggers
>
> - **Trigger A — Stage 2 (this panel) flips Q2 spring lock.** If 2/3+ cells argue duration-based has a load-bearing reason the Stage 1 framing missed (Flutter-runtime fit, dev-tool integration, reduced-motion handling, perf characteristics), the Q2 lock re-opens. Highest-priority pressure-test.
> - **Trigger B — Implementation cost surprise** (>3 sessions): mark v0.19 *partial*; split snapshot to v0.19.1.
> - **Trigger C — Stage 0 reveals a canonical-example bug** (doc 95 + doc 112 pattern): re-open the design.
> - **Trigger D — Q4 deferral surfaces snapshot flakiness** (would only fire if Q4 were unlocked, which it isn't — listed for completeness).
>
> ### Stage 2 readiness
>
> Run Stage 2, do not skip. Animation + snapshot is framework-shaped; bundling rationale + Q2 spring-vs-duration pressure-test + canonical example shape all need critique. Q1, Q3, Q4, Q5 are locked but the panel may pressure-test the locks too — convergent disagreement on a locked decision is high-signal.
>
> ---DESIGN NOTE END---
>
> Now answer six specific questions. Be substantive and direct. If you genuinely converge with the locked decision, say so explicitly — convergence is data. If you'd reject a locked decision, name the alternative and the cost. Treat each Q as either *hold* (lock survives), *refine* (small patch within the lock), or *flip* (lock fails — name the alternative).
>
> **Q1 — Bundling rationale carry-forward.** Doc 112's Stage 2 already split snapshot off v0.18 to pair it with animation in v0.19. Read from this side: does the bundling argument hold (animation needs snapshot to be verifiable; snapshot needs animation as its highest-error-surface; both need the same time-mock infrastructure), or has the framing missed a reason to split them again now that the v0.19 cycle is open? Specifically: would shipping animation-without-snapshot first (v0.19) and snapshot-with-image-fidelity later (v0.20) produce a better v1.0 than the bundle?
>
> **Q2 — Spring vs duration (highest-pressure pressure-test of the Q2 lock).** Tyr locked `spring(value)` declarative on 3/4 peer-language evidence. Flutter — Igni's compile target — is the 1/4 outlier with explicit duration controllers. Pressure-test the lock: does the declarative-spring shape survive the Flutter-runtime fit? Concrete prompt: write a SearchBox component where the dropdown height animates from 0 → results-list-height when items load. Sketch the Igni source under (a) `dropdown_height = spring(items.length * row_height)` and (b) a hypothetical `transition: 200ms` modifier. Which is harder for an LLM to misuse? Which composes better with Igni's lexical-reactivity model? Are there Flutter-runtime characteristics (perf, reduced-motion handling, devtool integration, AnimationController lifecycle) that the spring lock makes harder than necessary?
>
> **Q3 — Animation-surface boundary (Q1 + Q5 lock validation).** Locked: `transition:` modifier handles conditional renders only (Q1 split); token-only no duration argument (Q5). The boundary at "conditional renders only" excludes Wall 7 from `transition:` and routes value interpolation through `spring(value)`. Is the boundary clean, or does it create a gap that LLMs and Igni users will pre-emptively fill with workarounds (e.g. wrapping a value in an `if` to force a conditional-render swap so they can use `transition:`)? If the boundary leaks, what's the smallest patch that closes it without violating "one way to do everything"?
>
> **Q4 — Canonical-example bug check.** Look hard at the proposed canonical examples (transition-on-conditional-render, spring-on-counter, snapshot-with-freeze_time, mock-every advance through animation frames, mock-now for relative-time UI). Is there a Pomodonut-style bug — a pattern that looks right but silently fails in some legitimate case? Specifically: (a) does `spring(value)` compose correctly with `each` when the spring'd value is a per-row variable, e.g. animating a per-item progress bar in a list? (b) does `freeze_time:` interact correctly with `mock every: advance` (does advance fire every-blocks while time is frozen, or does freeze suppress all time-based events)? (c) does `snapshot "name"` of a screen containing a `spring()`'d value capture the *target* value or some intermediate frame — and is the answer the same as what users will expect? (d) does `transition: fade` on an `if A: X else: Y` correctly handle a sudden third-state assignment (e.g. `loading → loaded → error`)?
>
> **Q5 — Snapshot scope (Q3 lock validation).** Locked: text-tree only for v0.19; image/golden deferred. Pressure-test: which real-world regression bugs that Igni users will hit cannot be caught by text-tree snapshots? Is the v0.19 deferral leaving a gap that hand-writes will fill with image-comparison-via-Flutter-test-harness workarounds (indicating the deferral is wrong)? Or is text-tree the right v0.19 scope, with image-golden a focused v0.20+ iteration that's better designed in isolation?
>
> **Q6 — Time-mock bundling (Q4 lock validation).** Locked: bundle `mock now:` / `freeze_time:` in v0.19; implementation mirrors v0.18 mock-block patterns. Pressure-test: are there shape variants of `freeze_time:` that the v0.18 mock-block patterns don't cover (e.g. time-windowed frame replay for animation testing, step-through-frames for visual debugging, time-zone-shift for i18n testing)? Should v0.19 ship a richer time-control vocabulary now (`replay`, `step`, `at`, `tz`), or is `mock now:` + `freeze_time:` + (existing) `mock every: advance` enough surface for the v0.19 + v0.20 use cases?
>
> Format: six numbered answers, one substantive paragraph each. Each must declare a clear position (hold / refine / flip) before evidence. No need to write Igni code beyond short illustrative snippets — this is design critique. If you would push back on any of the locked decisions or the bundling rationale, do so explicitly with the alternative named and the cost stated.
