# v0.14 timer primitive — pre-implementation design review

Single prompt asking three frontier models (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview) to critique the v0.14 timer-primitive design note for Igni. Run via `tests/runner/cold-test.ts` with `--no-spec --no-grade`. Outputs are prose, not Igni code.

This is Stage 2 in the spec-iteration cycle (`docs/cycle.md`) — pre-implementation design review. Not Stage 0 (no measurement of model adoption against a cheatsheet draft) and not Stage 3 (no shipped feature to validate). Treat the responses as input to a decision, not the decision itself.

## 1. v0.14 timer-primitive design critique

> You are reviewing a design note for the Igni programming language ahead of v0.14 implementation. Igni is a UI-first language whose north star is "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle. If a feature has two valid syntaxes, one is dropped.
> - **No magic**: if something happens at runtime, the cause should be visible in source. The lexical-reactivity rule is the only sanctioned "magic" — *each screen re-evaluates when any variable it references is reassigned*.
> - **Token-first**: tokens (`small`/`medium`/`large` for spacing, `phone`/`tablet`/`desktop` for `max_width:`, etc.) over arbitrary numeric values, to bound LLM variance.
> - **Indentation, no brackets**: block structure is whitespace + colons. No braces, no parentheses on component invocation, no inline conditionals.
>
> Existing reactive surface in v0.13.1:
>
> - Event handlers: `on tap:`, `on touch:`, `on change:` — attach to UI primitives. Body fires when the user takes an action.
> - Async one-shots: `fetch(url)`, `locate()` — return values that resolve later, with `is loading` / `is error` predicates for state-checking.
> - No timer, no interval, no scheduler, no `every`, no `on tick`. *That's the gap this note addresses.*
>
> Pomodonut cold test (2026-04-26) was the trigger: 4/4 frontier models attempted a per-second countdown for a pomodoro app, 3/4 explicitly named the missing primitive in their own design notes before working around it with a manual button driver. The strongest possible promotion signal in the spec backlog right now.
>
> The design note follows. Read it carefully — it has a revision history (first draft recommended Shape B `on tick:`, current draft recommends Shape A `every 1s:` after architectural pushback) and the rejected shapes are kept in the document for review. After the note, five specific questions are asked.
>
> ---DESIGN NOTE START---
>
> # v0.14 candidate — Recurring-timer primitive (`every 1s:`)
> 
> **Date:** 2026-04-26
> **Status:** Design note — **Shape A (`every 1s:` block-opener at screen scope) recommended.** Motivation from `docs/private/94_pomodonut_real_app.md` Stage 3 (4/4 attempted, 3/4 honest-no). Format template from `docs/private/79_v013_max_width.md`.
> 
> > **Revision history.** First draft (2026-04-26) recommended Shape B (`on tick:` event handler at screen scope). Tyr pushed back on three grounds: (1) the existing `on X:` family fires from user actions (tap/touch/change); `on tick:` would silently break that load-bearing intuition by putting time-driven recurrence in a user-action-class container; (2) 1Hz-fixed forecloses future variable rates (animation 60Hz, auto-save 5-10s, live-data 30s) into a second breaking change; (3) 4/4 ship bar over-tight given panel signal-to-noise on Flash-Lite. All three landed. The recommendation flipped to Shape A with corrections noted in §Each / every parallel and §Methodology note. Original recommendation preserved as Shape B (rejected) for review.
> 
> ---
> 
> ## Motivation
> 
> Pomodonut criterion-4 #2 cold test (2026-04-26, `docs/private/94`) surfaced this gap with the strongest possible signal: 4/4 frontier models attempted a per-second countdown, and 3/4 explicitly named the missing primitive in their own design notes before working around it with a manual button driver. Only `gemini-3.1-flash-lite-preview` hallucinated.
> 
> Concrete friction (from `tests/v0.13.1-pomodonut/claude-opus-4-7_cheatsheet_pomodonut.md`):
> 
> > The Igni v0.12.2 spec exposes only event-driven reactivity (`on tap`, `on touch`, `on change`) plus the async one-shots `fetch()` and `locate()`. There is no documented recurring-timer primitive — no `every`, no `on tick`, no scheduler. So a real wall-clock countdown isn't expressible in the language as specified. I structured the app so that adding such a primitive is a one-line change.
> 
> This is a category gap, not a token-name gap. Igni has no machinery for *time-based* state reassignment, only event-based and async-one-shot. Any app that needs a clock display, an animation tween, a debounce, an auto-refresh, or a polling fetch hits this hole and either invents a primitive or fails.
> 
> **Friction surfaces (real apps that need this, ranked by likelihood):**
> - Pomodoro / focus timers (Pomodonut)
> - Stopwatches / countdowns
> - Clock displays (analog, digital, world clocks)
> - Auto-refreshing data (live scoreboards, weather, prices)
> - Game loops (snake, pong — *out of Igni scope per audience but the primitive is still the same*)
> - Animations / progress indicators driven by state, not Flutter's animation framework
> - Auto-save drafts (debounced via tick + last-changed-time)
> 
> The primitive is also adjacent to the panel-flagged `debounce:` modifier on `input bind:` (4/4 signal, listed in ROADMAP Ideas). A screen-level recurrence + last-edit-timestamp pattern composes to debounced saves without a special-case modifier.
> 
> ## Cold-test evidence
> 
> **Strong.** 4/4 attempts in Pomodonut Stage 3 cold test:
> 
> | Model | Approach | Honest-no? |
> |---|---|---|
> | `claude-opus-4-7` | Manual `tick()` function + button driver. Suggested syntax: `on tick every: 1s: tick()` on root layout. | ✓ |
> | `gpt-5.5` | Manual `tick()` function + button driver. | ✓ |
> | `gemini-3.1-pro-preview` | Manual `tick()` function + button driver. Suggested syntax: `every second: tick()` or `timer 1s, on tick: tick()`. | ✓ |
> | `gemini-3.1-flash-lite-preview` | Hallucinated `timer interval: 1, on tick:` block as if documented. | ✗ |
> 
> **Honest-no rate 3/4** is a key methodology signal — it says frontier models recognise the absence of a primitive rather than papering over with whatever they trained on. That's the kind of signal that justifies adding to the spec rather than writing it off as model laziness.
> 
> The shapes models reached for cluster around three patterns:
> - `every <duration>: <body>` (Claude variant, Gemini-pro variant)
> - `on tick: <body>` (Claude variant, named explicitly)
> - `timer <duration>, on tick:` block (Gemini-pro and Gemini-flash-lite variants — closest to a top-level primitive)
> 
> All three converge on a screen-scope reactive block that fires periodically.
> 
> ## The user-action invariant
> 
> A load-bearing intuition surfaced in the revision but never written into the spec: **every `on X:` event in Igni traces to a user action.**
> 
> | Event | Trigger |
> |---|---|
> | `on tap:` | User finger up after a press on a primitive |
> | `on touch:` | User finger down on a primitive |
> | `on change:` | User-driven bound-value change (typing, toggling, dragging, selecting) |
> 
> The pattern is: external user input → state reassignment → re-render. The `on X:` syntactic family describes *reactions to the user*. Models trained on Igni's existing surface read `on X:` as "something the user did," not "something that happens autonomously."
> 
> A time-driven recurrence primitive shaped as `on tick:` would put time-driven state change into a user-action-class container. The trigger would be the system clock, not a user action. The lexical-reactivity rule says "screen re-evaluates when any *variable it references* is reassigned" — the rule itself is class-agnostic, but the existing event-handler family is class-specific (user-driven).
> 
> Adding `on tick:` doesn't break the spec on the page. It breaks an *intuition that holds across the existing surface* — the kind of consistency that future spec authors and learners (human and machine) implicitly trust. A v0.16 reader who has internalised "`on X:` means the user did something" would have to be silently re-taught when they hit `on tick:` for the first time.
> 
> The class boundary deserves a syntactic boundary. `every 1s:` puts time-driven recurrence in a different syntactic family — block-opener parallel to `each`, not event-handler parallel to `on tap:`. The user-action invariant survives intact.
> 
> This is documented even if no Stage 2 reviewer flags it. The reasoning is load-bearing for review.
> 
> ## Each / every parallel
> 
> The first draft of this note rejected `every` as a "near-rhyming learnability hazard" relative to `each`. **That reading was wrong.** The lexical near-rhyme reflects a clean *semantic parallel*:
> 
> - `each item in items: <body>` — body runs once per list item.
> - `every 1s: <body>` — body runs once per time interval.
> 
> Both are **language-driven iteration**. Both produce a sequence of body invocations. Neither involves a user action. The trigger for `each` is the language consuming a list; the trigger for `every` is the language consuming time. They are siblings.
> 
> This is the cleanest semantic mapping in the candidate set. `each` and `every` aren't "two near-rhyming keywords competing for attention" — they're two faces of the same concept (iteration), separated by what's being iterated.
> 
> The previous concern was "`every` is generic — no signal that it's *time-based* recurrence." The fix is in the duration argument: `every 1s:` is unambiguously time-based the moment you read past the keyword. `every 100:` would be ambiguous — but the duration token whitelist (see §Duration tokens) rejects bare numbers.
> 
> ## Candidate shapes
> 
> ### Shape A — `every <duration>:` block-opener at screen scope (recommended)
> 
> ```igni
> screen Pomodonut:
>   remaining = 1500
>   running = false
> 
>   every 1s:
>     if not running:
>       return
>     if remaining > 0:
>       remaining = remaining - 1
> 
>   layout vertical:
>     label remaining
>     button "Start", on tap: running = true
>     button "Pause", on tap: running = false
> ```
> 
> A new top-level keyword `every` introduces a recurring-statement block at screen-body scope (peer to function defs, variable decls, layout). Body is plain function-style statements. Gating ("only run while running") is plain `if` at the top of the body — no `while:` modifier.
> 
> Duration argument is a token from the v0.14 whitelist. Currently: `1s`. See §Duration tokens.
> 
> **Pros:**
> - **Class boundary preserved.** Time-driven recurrence is in a different syntactic family from user-event handlers. The user-action invariant on `on X:` holds (see §The user-action invariant).
> - **Parallel to `each`.** Both are language-driven iteration. Sibling concepts get sibling syntax (see §Each / every parallel).
> - **One new keyword.** No new event names, no new modifiers. The duration is a token argument, not a separate concept.
> - **Cold-test reach.** 2/4 models reached for some form of `every <duration>:` (claude-opus, gemini-pro). One synonym from a third (`every second:`).
> - **Composes with lexical-reactivity unchanged.** Body reassigns variables; screen re-renders. Same path as event-handler bodies.
> - **Variable-rate-ready.** Adding `every 100ms:` or `every 30s:` later is a whitelist extension, not a syntax change.
> 
> **Cons:**
> - **One new keyword to learn (`every`).** Mitigated by the each/every parallel — models already know `each` shape.
> - **`each`/`every` ambiguity for human readers in passing.** Mitigated by the duration argument: `each x in y:` vs `every 1s:` are visually distinct after the keyword.
> 
> ### Shape B — `on tick:` event handler at screen scope (rejected on user-action-invariant grounds)
> 
> ```igni
> screen Pomodonut:
>   remaining = 1500
>   running = false
> 
>   on tick:
>     if not running:
>       return
>     if remaining > 0:
>       remaining = remaining - 1
> ```
> 
> `on tick:` at screen-body scope, fired automatically once per second. Reuses the `on X:` event-handler shape.
> 
> **Was the first-draft recommendation. Now rejected.**
> 
> **Why rejected:**
> - **Breaks the user-action invariant.** `on X:` family fires from user input. Adding `on tick:` puts time-driven recurrence in a user-action-class container. The class boundary erodes silently. See §The user-action invariant.
> - **1Hz fixed forecloses variable rates.** Without a duration argument, every future rate change requires a syntax extension (`on tick rate: 100ms:`?), and the spec accumulates rate machinery on what was supposed to be "just an event." Shape A's duration argument is whitelist-extensible without revisiting syntax.
> - **Cold-test reach was thinner than first-draft credit.** Claude-opus named `on tick:` once in design notes; the same model also wrote `on tick every: 1s: tick()` in another section, which is closer to Shape A. Counting Claude as a clean 1/4 for B was generous; effectively 0.5/4 because the same response considered both shapes.
> 
> The original case for Shape B was "smallest spec-budget delta" (one new event name, zero new keywords). That's true on a token-counting basis but ignores the *semantic* spec budget — keeping the event-handler family monosemantic is worth more than saving one keyword.
> 
> Kept in the document because the first-draft recommendation should be visible to reviewers. Don't edit it out.
> 
> ### Shape C — `interval Ns:` block with `on tick:` child event (rejected)
> 
> ```igni
> screen Pomodonut:
>   interval 1s, on tick:
>     if running:
>       remaining = remaining - 1
> ```
> 
> A new top-level block primitive `interval` parameterised by duration, with `on tick:` as its event.
> 
> **Rejected.**
> - **Two new things at once.** A new block primitive AND a new event name. Shape A introduces only a keyword + duration argument.
> - **Multiple instances per screen are unclear.** What if a screen has `interval 1s, on tick: A` and `interval 5s, on tick: B`? No precedent in current Igni for multiple top-level instances of the same primitive.
> - **Wordier for the 99% case.** Shape A's `every 1s:` reads as "every second"; Shape C's `interval 1s, on tick:` reads as ceremony.
> - **Naming coupling.** "Interval" as primitive + "tick" as event is two names for what models naturally call one thing.
> 
> ### Shape D — `on appear:` lifecycle + `schedule(fn, after:)` builtin (rejected)
> 
> ```igni
> screen Pomodonut:
>   on appear:
>     schedule(tick, after: 1s)
>   tick():
>     if running:
>       remaining = remaining - 1
>     schedule(tick, after: 1s)
> ```
> 
> Reuse the panel-flagged `on appear:` lifecycle hook. Add `schedule(fn, after:)` as a builtin function. User writes their own recurring loop.
> 
> **Rejected.**
> - **Two spec changes for one feature.** Adds `on appear:` AND `schedule()`. Shape A adds one keyword.
> - **Recursive setTimeout pattern is a known footgun.** Forgetting the recursive `schedule()` call stops the timer silently; double-firing it doubles the rate. Models will write this wrong.
> - **Lifecycle leak.** Surviving callbacks across unmount need cancellation machinery — more spec budget, or hidden lifecycle rule (no-magic violation).
> 
> ### Shape E — Reactive `clock()` builtin (rejected on no-magic)
> 
> ```igni
> screen Clock:
>   start = clock()
>   remaining = 1500 - (clock() - start)
> ```
> 
> `clock()` is implicitly reactive — screen re-evaluates every second.
> 
> **Rejected.** Lexical-reactivity says "screen re-evaluates when any *variable it references* is reassigned." `clock()` is a function, not a variable. Making it reactive requires a hidden ticking-state rule that violates the no-magic principle.
> 
> If `clock()` is added later, it should be a non-reactive read (`now = clock()` captured at a moment), re-fired by callers via Shape A's `every 1s:`.
> 
> ## Principles in tension
> 
> | Principle | Favours |
> |---|---|
> | **User-action invariant on `on X:`** | A (preserves invariant) > B/C/D (use `on X:` for non-user-driven event) |
> | **Spec budget is a tax** | A (1 keyword + duration arg) > B (1 event name only) > C (1 block primitive + 1 event name) ≈ D (1 lifecycle hook + 1 builtin) |
> | **One way to do everything** | All single-shape. None violate. E rejected on a different principle. |
> | **No magic** | A/B/C/D explicit. E rejected. |
> | **Cold-test reach** | A (2/4 + 1 synonym) > C (2/4 mimic) > B (~0.5/4 named) > D (0/4 — model wouldn't infer) |
> | **Reuse existing shapes** | A reuses `each` block-opener pattern (no precedent for "block-opener at screen scope" but the indentation rule is the same). B reuses `on X:` syntactically but breaks the family's semantic class. |
> | **Composes with lexical-reactivity** | All four reassign variables → re-render. No principle separates them here. |
> | **Variable-rate-ready** | A (duration is a token argument, whitelist-extensible) > B/C (rate is structural; future rates require syntax change) > D (caller-driven, ergonomic-cost only) |
> 
> The first-draft tiebreak landed on B for "smallest spec-budget delta." That metric ignored the user-action-invariant cost and the variable-rate-foreclosure cost. Once both are weighed, A wins by every column except spec-token count — and that column is a poor proxy for spec budget when the costs are semantic.
> 
> ## Decision: Shape A (`every 1s:` at screen scope)
> 
> **Rationale:**
> 
> 1. **Preserves the user-action invariant on `on X:`.** Time-driven recurrence is in a different syntactic family from user-event handlers — block-opener, not event-handler. Reviewers and future spec authors get to keep the intuition that `on X:` means "the user did something."
> 2. **Each / every is a clean semantic parallel.** Both are language-driven iteration. Sibling concepts, sibling syntax. The lexical near-rhyme reflects the parallel; it doesn't compete with it.
> 3. **Variable-rate-ready without a future syntax change.** Duration is a token argument. v0.14 ships `1s` only; v0.15+ extends the whitelist (`100ms`, `30s`). Same shape as `max_width: phone | tablet | desktop`.
> 4. **Cold-test reach is strong (2/4 named the shape, 1/4 within one synonym).** Stage 2 will validate.
> 5. **Composes with lexical-reactivity unchanged.** Body reassigns; screen re-renders. Same path as event handlers.
> 6. **Reuses indentation+colon block shape.** Same lexical mechanism as `if`, `each`, `layout`, function bodies.
> 
> **What ships in v0.14:**
> 
> - New keyword `every`.
> - One duration token: `1s`. (Whitelist-validated. Numerics rejected. Other tokens rejected.)
> - `every <duration>: <body>` at screen-body scope (peer to function defs, var decls, layout).
> - Body is the same shape as a function body: statements, `if`/`else`, assignments, function calls, `return`.
> - Gating ("only run while running") is plain `if` at the top of the body. No `while:` modifier.
> - One `every` block per screen. Multiple is rejected on simplicity grounds — same as one `body` per wrapper. Compose multiple recurrences via shared timestamps inside one block if needed (see §Stage 2 questions for the auto-save+auto-refresh case).
> - Mounted-screen-only. Pauses on navigate-away, resumes on return. Implicit lifecycle, same as state.
> - No parameter for offset, phase, jitter, or cancellation.
> 
> ## Duration tokens
> 
> Same shape as `max_width: phone | tablet | desktop`. The duration is a token, not an arbitrary value.
> 
> | Token | Meaning | Status |
> |---|---|---|
> | `1s` | once per second | **v0.14 — ships** |
> | `100ms` | ten times per second | Future (v0.15+) — for animations, debounce |
> | `5s` | once per five seconds | Future — for auto-save |
> | `30s` | once per thirty seconds | Future — for live-data refresh |
> | `1m` | once per minute | Future — for clock displays, low-rate polling |
> 
> **What v0.14's parser accepts:** `every 1s:` only. Any other duration token (`every 100ms:`, `every 5s:`) fails at parse time with a targeted error: "duration `100ms` not yet supported in v0.14 — use `1s`. See ROADMAP Stream 3 for planned extensions."
> 
> **What it rejects unconditionally:**
> - Numeric durations: `every 1.5:`, `every 2:`, `every 60:` → parse error "duration must be a token (`1s`); numeric values are not accepted."
> - Bare keywords: `every second:` → parse error "use `1s`, not `second`."
> - Variable references: `every rate:` → parse error "duration must be a literal token, not a variable."
> 
> This is the deliberate token-first commitment, identical to `max_width:`'s rejection of `max_width: 540`. The token whitelist *is* the spec. If a real app needs 2-second recurrence, the answer in v0.14 is "use `1s` and a divisor in your `every` body" or "wait for v0.15." Not "let users write arbitrary durations."
> 
> **Future extension path is explicit and additive.** Each new token added to the whitelist gets its own design note when a real app demands it (per the v1.0 audience thesis: real apps drive promotion, not theoretical coverage). Likely first additions:
> - **`100ms`** when an animation or progress-bar real-app surfaces 1Hz-insufficient.
> - **`5s`** when an auto-save real-app surfaces.
> - **`30s`** when a live-data real-app surfaces.
> 
> The lexer surface for `1s` (and future `100ms`, `5s`, etc.) needs investigation — is `1s` already lexable as a number+suffix, or does it need new tokenisation? Note in §Spec edit footprint.
> 
> ## Methodology note
> 
> This is the first time in the spec-iteration history that *architectural reasoning* has driven a design decision over *convergent panel signal*.
> 
> Every prior v0.X design (max_width, theme, font, count predicate, named slots, ...) followed the standard cycle: panel signal → propose shape → ship-on-principles → Stage 3 validate. The shape was always the one panels converged on, refined by token-first or one-way-to-do-everything as needed.
> 
> The timer round broke the pattern. **Panels caught the timer-gap signal correctly** (4/4 attempts + 3/4 honest-no), and panels even named candidate shapes (`on tick`, `every Ns`, `timer Ns`). But the *shape decision* was made by reasoning about the user-action invariant — a load-bearing intuition that exists nowhere in the spec and that no Stage 1 panel was asked about.
> 
> The first-draft recommendation followed cold-test reach and spec-token-count metrics, both panel-derived. The revised recommendation followed the architectural argument that the existing event-handler family is class-specific (user-driven), and adding a system-driven event to the same family erodes a consistency that future readers implicitly trust.
> 
> **The implicit claim of the propose→ship→validate template is "panels are sufficient for shape decisions."** The timer round demonstrates that claim doesn't hold across all design decisions. Sometimes architectural reasoning has to override convergent panel signal — in this case, because the invariant being violated is implicit (not in the spec text) and panels can't surface what the spec doesn't articulate.
> 
> This is methodology-noteworthy. The dissertation's methodology chapter should record this round explicitly: panels are necessary (they catch real gaps with high reliability — see Pomodonut 4/4 honest-no) but not always sufficient (the *shape* may need architectural reasoning beyond panel reach). A second, possibly third, instance of architectural-overrides-panel will validate the pattern; one instance is just a data point. Watch for the next one.
> 
> (Capture in the design note now so the reasoning is preserved. Single sentence in v1.0's methodology summary; paragraph in the dissertation's spec-iteration chapter eventually.)
> 
> ## Cheatsheet teaching
> 
> `every 1s:` is a different reactivity class from event handlers. Suggest a NEW cheatsheet section, not a sub-bullet under "Reacting to users." Likely heading: **Recurrence** or **Time**.
> 
> Two examples for the cheatsheet:
> 
> ```igni
> screen Clock:
>   now = format_time()
> 
>   every 1s:
>     now = format_time()
> 
>   layout vertical, padding: large:
>     label now, style: heading
> ```
> 
> ```igni
> screen Pomodonut:
>   remaining = 1500
>   running = false
> 
>   every 1s:
>     if not running:
>       return
>     if remaining > 0:
>       remaining = remaining - 1
> 
>   layout vertical:
>     label remaining
>     button "Start", on tap: running = true
>     button "Pause", on tap: running = false
> ```
> 
> Cheatsheet prose (~60 words):
> 
> > **Recurrence.** A screen can run a block of code on a recurring schedule via `every <duration>:`. Body is the same shape as a function body — statements, `if`/`else`, assignments. Reassigning state inside the block triggers the lexical-reactivity rule. The block fires while the screen is mounted; pauses when the user navigates away and resumes on return. v0.14 supports `every 1s:` only; arbitrary durations and numeric values are rejected at parse time.
> 
> ## Spec edit footprint
> 
> In rough order of cost:
> 
> 1. **Spec (`spec/v0.14.0.md`):** add §Recurrence (new section, ~150 words including Pomodoro example). Don't slot under §Reacting to users — different reactivity class.
> 2. **Cheatsheet (`spec/v0.14.0-cheatsheet.md`):** add §Recurrence with the two examples above. ~60 words prose + ~25 lines code.
> 3. **Lexer (`transpiler/src/lexer.ts`):** verify whether `1s` is lexable today or needs a new tokenisation pass. Likely needs: a duration-literal token type, lexed as `<digits>(ms|s|m|h)`. v0.14 emits this token, parser whitelist-validates the suffix+value combination. Other suffixes (`ms`, `m`, `h`) lex but parser rejects.
> 4. **Parser:** allow `every <DurationLiteral>:` at screen-body scope (peer to function defs, variable decls, layout). Body is the same shape as a function body. AST: new `EveryBlock` node. Validate the duration token against the v0.14 whitelist (`1s` only); emit a targeted error for non-whitelist values pointing at the planned extensions.
> 5. **Codegen:** wire `every 1s:` to a `Timer.periodic(Duration(seconds: 1), ...)` started in `initState`, cancelled in `dispose`. Mounted-only by tying to the `State` lifecycle (Flutter handles this for free).
> 6. **Tests:**
>    - New positive fixture `transpiler/examples/every-clock.igni` (clock display).
>    - New positive fixture `transpiler/examples/every-countdown.igni` (pomodoro-style).
>    - New negative fixture `transpiler/examples-errors/every-numeric-duration.igni` (pin: `every 2:` rejected).
>    - New negative fixture `transpiler/examples-errors/every-unsupported-duration.igni` (pin: `every 100ms:` rejected with "v0.14 supports `1s` only").
>    - New negative fixture `transpiler/examples-errors/every-on-button.igni` (pin: `every 1s:` only attaches to `screen`, not buttons or other primitives).
> 
> ## Pre-registered Stage 2 / Stage 0 / Stage 3 (locked 2026-04-26)
> 
> **Pre-implementation review** is required before Stage 0 — this is a category-new primitive (first time-based reactivity), unlike `max_width:` which was the seventh token primitive.
> 
> ### Stage 2 — design review (this session)
> 
> - **Panel:** 3 frontier models (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview).
> - **Context:** This design note pasted into the prompt. No spec, no cheatsheet — `--no-spec --no-grade`. (Per v0.13-design-review precedent.)
> - **Output:** prose critique addressing 5 critical-design questions (see `tests/v0.14-design-review/prompts.md`).
> - **Pass bar:** 3/3 frontier models read the note coherently and produce useful prose. Convergent objections (≥2/3 raise the same concern) trigger a design-note patch before Stage 0. Single-model raises noted but not blocking.
> 
> ### Stage 0 — pre-implementation cheatsheet review (later session)
> 
> - **Panel:** 3 frontier models (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview).
> - **Context:** v0.14.0-cheatsheet draft with `every 1s:` introduced.
> - **Adoption rule:** A model "adopts" if it reaches for `every 1s:` correctly on a Pomodoro-style or clock-display prompt where periodic reassignment is required.
> - **Stage 0 ship-bar:** 3/3 adoption. If 2/3, document the miss and patch the cheatsheet language before Stage 3. If ≤1/3, reopen Shape (likely candidate: revisit Stage 2 outcome for re-examination).
> 
> ### Stage 3 — post-implementation behavioural cold test (much later)
> 
> - **Panel:** 4 frontier models (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview, gemini-3.1-flash-lite-preview).
> - **Context:** `spec/v0.14.0-cheatsheet.md`.
> - **Prompts:** at least two — one Pomodoro rerun (calibrates against today's Pomodonut), one clock-display or auto-refresh prompt (tests adoption outside the obvious case).
> - **Adoption rule:** Model uses `every 1s:` correctly in at least one prompt where periodic reassignment is required.
> - **Pass bar:** **3/4 minimum (ship holds), 4/4 ideal.** Match v0.11.4-stage3 shape, NOT v0.13's tighter pattern. Flash-Lite is panel-noise — its hallucinated `timer interval: 1, on tick:` block in Pomodonut shows the model's spec-comprehension gap, and its design-review-tier outputs are routinely lower-quality than the three frontier models. Setting 4/4 invites a re-roll cycle on a known-noisy panel member.
> - **Soft pass:** 3/4 with Flash-Lite as the miss → ship, log the miss, no docs nudge unless it correlates with a frontier miss.
> - **Soft pass:** 3/4 with a frontier model as the miss → ship, log the miss, v0.14.1 docs nudge candidate.
> - **Fail bar:** ≤2/4. Reopen — likely the cheatsheet teaching is wrong. Patch and re-run before reopening Shape.
> 
> ### Pomodonut rerun (post-v0.14-ship)
> 
> After Stage 3 passes, re-run `tests/v0.13.1-pomodonut/` against `spec/v0.14.0-cheatsheet.md` (renamed to `tests/v0.14.0-pomodonut/`). Pre-registered: ≥2/4 transpilable + browser-functional, with the sound-effect path validated. If the `bind: obj.field` issue still blocks, the secondary signal compounds and that becomes the next v0.14.x design note. If the pomodoro architecture transpiles cleanly, ship `transpiler/examples/pomodonut.igni` as criterion-4 #2.
> 
> This decouples the criterion-4 ship from the v0.14 spec ship — v0.14 ships independently on its own Stage 3, and Pomodonut closes its slot only when *both* v0.14 has shipped *and* the rerun transpiles cleanly.
> 
> ## Future considerations (out of scope for v0.14)
> 
> - **Higher-rate / lower-rate ticks.** Covered by §Duration tokens — additive whitelist extensions (`100ms`, `5s`, `30s`, `1m`) when real apps demand them. NOT a separate design note unless a future addition requires reshaping `every`'s syntax.
> - **Lifecycle hooks (`on appear:`, `on disappear:`).** Already on ROADMAP Ideas (3/4 signal). Independent of `every`. If both ship in v0.14, design them in parallel design notes; don't bundle.
> - **Cancellable async (timer cancel, fetch cancel).** Distinct concern from periodic ticking. `every`'s lifecycle is mounted-screen-only; cancellation lives in unmount. If apps need finer cancellation, that's a v0.15+ design.
> - **Animation curves / tween primitives.** Out of Igni scope per audience thesis (creative-tool primitives explicitly excluded). Flutter's animation framework is fine for the rare Igni app that needs it; not Igni's job to wrap it.
> - **Cross-screen ticking via `shared:` block.** No — `every` is screen-scoped. If a shared timer is needed (e.g. global session timer surviving navigation), the v0.15+ design is `every` at the *app* scope, distinct primitive. Don't bundle.
> - **Multiple `every` blocks per screen** (e.g. one for auto-save at `5s`, one for auto-refresh at `30s`). Pre-emptively rejected at single-instance for simplicity. If real apps demand it, the v0.15+ design considers it then. Stage 2 Q4 will surface whether reviewers think this is too tight.
> 
> ## Outcome
> 
> *To be filled post-Stage-2.*
> 
> - Stage 2 result:
> - Convergent objections:
> - Single-model raises:
> - Stage 2 patches applied:
> - Stage 0 result:
> - Stage 0 patches applied:
> - Stage 3 result:
> - Pomodonut rerun result:
> - v0.14 ship date:
> - Criterion-4 #2 close date:
>
> ---DESIGN NOTE END---
>
> Now please answer all five questions below. Be substantive: a short answer that says "looks fine" is less useful than a paragraph identifying a specific concern, even if you ultimately judge the concern minor. Where you agree with the note, say so explicitly — converging endorsement is signal too. Where you'd reach for a different shape than Shape A, name it and walk through the case.
>
> **Question 1 — Each / every semantic parallel.** The note argues that `each item in items: <body>` (list iteration) and `every 1s: <body>` (time iteration) are sibling concepts — both *language-driven iteration*, neither involves user action. Does this parallel hold for you on close reading, or do you see places it breaks? Specifically: (a) does the parallel survive when the body of `every` reassigns variables (which `each` typically doesn't — `each`'s body is render-only in current Igni); (b) would a model trained on Igni's existing surface predict `every`'s lifecycle (mounted-only) correctly from the `each` parallel; (c) is the lexical near-rhyme actually a strength, a wash, or a hazard for skim reading?
>
> **Question 2 — User-action invariant on `on X:`.** The note adds a §The user-action invariant subsection arguing that the existing `on X:` family (tap, touch, change) consistently fires from user input, and that adding `on tick:` would silently break this consistency. The note treats this invariant as load-bearing enough to justify a new keyword (`every`) over reusing `on tick:`. Is this argument earning its keep? Walk through: (a) does the invariant actually hold when you scrutinise `on change:` — does *every* `on change:` trace to user input, or is there an edge case where the spec already breaks this (e.g. programmatic reassignment of a bound variable)? (b) if a future v0.X adds, say, `on websocket-message:` or `on geolocation-update:`, would those go in `on X:` family or in some new family — and does that decision pre-empt or undermine the timer invariant argument? (c) is the cost of a new keyword `every` worth the consistency, or is the simpler `on tick:` recommendation (Shape B in the note) actually the better trade?
>
> **Question 3 — Duration token whitelist.** v0.14 ships `every 1s:` only. `every 100ms:`, `every 5s:`, `every 30s:` etc. all parse as duration tokens but fail at parse time with a "use `1s` only — see ROADMAP for planned extensions" error. Numeric durations (`every 2:`, `every 1.5:`) and bare keywords (`every second:`) are unconditionally rejected. Walk through: (a) is shipping only `1s` honest scope discipline, or is it artificially restrictive given that real apps obviously want at least `100ms` for animations and `5s`/`30s` for auto-save and live-data? (b) is the whitelist UX painful enough to drive developer churn (every model that tries `every 100ms:` hits a parse error, wastes a turn, and may misattribute the failure to its own mistake)? (c) is there a stronger middle ground — for instance, ship `1s` and `100ms` together, or accept duration tokens as a single shape and gate higher rates behind a Shape D-style cancellation extension?
>
> **Question 4 — One `every` block per screen.** The note pre-emptively rejects multiple `every` blocks in the same screen (e.g. one for auto-save at 5s + one for auto-refresh at 30s). The reasoning is "simplicity, same as one `body` per wrapper." Walk through: (a) are there real-app cases where two recurrences at different rates compose meaningfully? (b) would models trained on Igni's surface naturally write two `every` blocks if they had two recurrences to wire up, and would a parse-time rejection feel surprising? (c) if the restriction holds, is the workaround "compose multiple recurrences via shared timestamps inside one `every 1s:` block" actually expressive enough — does the composability claim hold on inspection?
>
> **Question 5 — Lifecycle: mounted-screen-only.** The `every 1s:` block fires while the screen is mounted; pauses on navigate-away; resumes on return. The note treats this as obvious. Walk through cases where this is the wrong default: (a) a global session timer (e.g. "your session expires in 30 minutes" — the timer should keep counting even if the user navigates between screens); (b) a polling fetch on a Settings screen that should keep polling when the user steps to a sub-screen and back; (c) any case where pausing-on-navigate creates user-visible glitches. Is the mounted-only lifecycle right, or does a future `shared:` / app-scope `every` belong in v0.14 alongside the screen-scope version?
>
> Prose response, no code blocks. ~600–1200 words total across all five questions is a reasonable target — go longer if a question genuinely needs it, shorter if you have a clean answer that doesn't need padding.
