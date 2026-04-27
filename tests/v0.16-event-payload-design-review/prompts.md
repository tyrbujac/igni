# v0.16 event-payload binding design review

Stage 2 panel — 3 frontier models critique design note 109 (proposed `on X(name):` syntax for receiving `emit`-ed values from child components) before any spec edit lands. Run via `tests/runner/cold-test.ts --no-spec --no-grade --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview`. Outputs are prose, not Igni code.

Mirrors the v0.15.0-design-review pattern. Treat panel responses as input to a Tyr decision, not the decision itself.

## 1. v0.16 event-payload binding design critique

> You are reviewing a design note for the Igni programming language ahead of v0.16 implementation. Igni is a UI-first language whose north star is "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
> 
> A few load-bearing design principles for context:
> 
> - **Spec budget, not backlog**: every new keyword/syntax form is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Indentation, no brackets**: block structure is whitespace + colons. No braces, no parentheses on component invocation.
> - **Parens specifically**: function definitions and calls use parens (`greet(name)`); component invocations do NOT (`Avatar user.avatar, size: 80`); list-builtin lambdas use `item => item.foo`.
> 
> Existing event surface in v0.15.2:
> 
> - Reserved event names (built-in primitives): `tap`, `change`, `touch`. These are payload-less.
> - Custom events: `emit X` (no payload) or `emit X v` (single positional value). Pack multiple values as an object: `emit submit {email: e, name: n}`.
> - Parent attaches: `Stepper value, on increment: count = count + 1` — but the spec doesn't show how the parent receives the emitted value when there is one.
> - The cheatsheet says "the parent picks the receiving name in its handler body" but provides no syntax. Today's worked examples lean on closure over loop variables (`each alert in alerts: AlertRow alert, on delete: alerts = without(alerts, alert)`) which dodges the question.
> 
> A v0.15.0 meta-review panel surfaced this as a real spec gap (2/3 convergent), with one model proposing the `on submit(query):` shape that became the design note's Shape A. Background: `docs/private/107`.
> 
> The design note follows. Read it carefully, then answer the five specific questions at the end.
> 
> ---DESIGN NOTE START---
> # 109 — Component event-payload binding syntax
> 
> **Date:** 2026-04-27
> **Status:** Stage 1 design proposal. Stage 2 panel queued. No syntax change shipped yet.
> **Source signal:** v0.15.0 meta-review panel — 2/3 visible cells (Opus + Gemini Pro) flagged this as a real spec gap, with Gemini Pro proposing concrete `on submit(query):` shape. See `docs/private/107`.
> 
> ## Problem
> 
> Igni's component event channel is `emit X v` (v0.5+) — a child component fires a named event with a single positional value. The cheatsheet describes how the value is *sent*:
> 
> > Event data: `emit X v` passes a single positional value — `emit selected item` + `on selected: handle(item)`. The parent picks the receiving name in its handler body; the emit just provides the value.
> 
> The phrase "the parent picks the receiving name in its handler body" implies a syntax exists for naming the receiver — but the spec doesn't show it. Today's worked examples lean on **closure over loop variables** to dodge the question:
> 
> ```igni
> each alert in alerts:
>   AlertRow alert, on delete: alerts = without(alerts, alert)
> ```
> 
> Here `alert` is the loop variable; the parent isn't actually receiving an emitted payload — it's just closing over the iteration scope. This works for list-iteration patterns but breaks for the cases where it actually matters:
> 
> - **`SearchBar` emitting the typed query.** The parent has no loop variable to close over; the emitted string IS the data.
> - **`Slider` emitting its new value.** Same shape — the bind:-to-shared.X path is fine, but if the slider is a custom component that emits `change`, the parent has no way to receive the value.
> - **`Stepper on increment(amount):`** — needs the increment value.
> - **`Form on submit(data):`** — needs the form payload (object).
> 
> A frontier-model meta-review panel reading the spec hits this gap and either invents syntax (`on submit(value):`, `on submit data:`) or refuses to write idiomatic Igni for these cases. The gap is real.
> 
> ## Proposed shape (A) — handler signature names the receiver
> 
> ```igni
> SearchBar on submit(text): results = fetch("/search?q=" + text)
> Slider on change(v): volume = v
> Stepper on increment(amount): count = count + amount
> Form on submit(data): handle(data.email, data.name)
> ```
> 
> The parent's `on X` handler can optionally take a **single positional parameter in parentheses**, naming the binding for the emitted value. Inside the handler body, the named parameter is in scope.
> 
> **Bare form preserved.** When the child emits no value (`emit tap`, `emit close`), the parent uses `on X:` with no parens, exactly as today:
> 
> ```igni
> CloseButton on close: shared.modal = null
> ```
> 
> **Closure-over-loop pattern preserved.** The existing list pattern still works because it doesn't actually use emitted-value binding — it closes over the loop variable:
> 
> ```igni
> each alert in alerts:
>   AlertRow alert, on delete: alerts = without(alerts, alert)
> # `alert` is the loop variable from `each`; AlertRow's emit signature has no value
> ```
> 
> **Multi-value via object packing** — current rule (single positional value, pack as object for multi-value) stays:
> 
> ```igni
> # Child
> component LoginForm:
>   ...
>   button "Sign in", on tap: emit submit {email: e, password: p}
> 
> # Parent
> LoginForm on submit(creds): authenticate(creds.email, creds.password)
> ```
> 
> ### Naming convention — free, caller picks
> 
> The receiver name is **free**, the caller picks it. Matches `each item in items:` (loop variable name is caller's choice) and lambda parameters (`item => item.foo`). Symmetric with the rest of Igni's naming convention.
> 
> ```igni
> SearchBar on submit(q): ...        # short
> SearchBar on submit(query): ...    # explicit
> SearchBar on submit(typed): ...    # context-specific
> ```
> 
> All three are legal and equivalent.
> 
> ## Alternative shapes considered & rejected
> 
> ### Shape B — implicit `value` binding
> 
> Parent always uses an implicit identifier like `value` or `event` to access the payload:
> 
> ```igni
> SearchBar on submit: results = fetch("/search?q=" + value)
> ```
> 
> Pro: zero new syntax.
> Con: violates the no-magic principle. `value` appears in the handler body without being declared anywhere visible — exactly the kind of hidden-source-of-truth Igni rejects.
> 
> ### Shape C — lambda-as-handler
> 
> Handler body is a lambda expression:
> 
> ```igni
> SearchBar on submit: (text) => fetch("/search?q=" + text)
> ```
> 
> Pro: lambdas already exist in Igni for list-builtin arguments.
> Con: handlers are statement bodies, not expressions. Multi-statement handler bodies don't fit the lambda paradigm. Also introduces a second handler-style for a problem the existing handler-style already covers structurally.
> 
> ### Shape D — arrow form
> 
> ```igni
> SearchBar on submit -> text: results = fetch(...)
> ```
> 
> Pro: visible binding.
> Con: introduces `->` as a new symbol that nothing else in Igni uses. New syntax tax for no readability gain over Shape A.
> 
> ## Open questions for Stage 2 panel
> 
> ### Q1 — Shape choice
> 
> Is Shape A right? Are there counter-arguments worth surfacing? Specifically: does the parens form on the parent side risk being read as "function call" or otherwise mis-cued by readers used to other languages? The reader has to distinguish:
> 
> - `Stepper value, on increment(amount): ...` — `Stepper` invocation passing `value`, then handler with parameter
> - `function_call(arg)` — function call elsewhere
> 
> The parens here come *after* the event name, in handler position; structurally distinct from component invocation (which uses no parens) and from function calls (which take only positional args, no event keyword). But cold-test panels may surface ambiguity.
> 
> **Default proposal: Shape A.**
> 
> ### Q2 — Mismatch cases between emit signature and handler signature
> 
> Two mismatches are possible:
> 
> - **Child emits a value, parent uses bare `on X:` (no parens).** Today's behaviour: the value is silently available via closure (if there's one) or unavailable. With Shape A: the child still emits; the parent just doesn't bind the name. Default proposal: **silent drop** — the value isn't bound, the handler runs, the value is discarded.
> - **Child emits no value, parent uses `on X(x):`.** Default proposal: **parse-time error**. Component definitions statically declare which events emit values (the `emit X` vs `emit X v` distinction in the component body); parents naming a parameter for a value-less event should be rejected with a clear "this event has no payload" message.
> 
> ### Q3 — Multi-value emit
> 
> Current rule (v0.15.2 cheatsheet): "emit passes a single positional value, pack multiple as an object."
> 
> Should this change? Two options:
> 
> - **Keep single-positional + object-packing rule.** `emit submit {email, name}` + `on submit(data): ...` accessing `data.email`, `data.name`.
> - **Extend to multi-arg.** `emit submit email, name` + `on submit(email, name): ...`.
> 
> Default proposal: **keep single-positional rule**. One way to do everything; multi-arg parsing introduces new ambiguities (where do positional args end and named params begin?); object-packing is already idiomatic.
> 
> ### Q4 — Reserved event names
> 
> Currently reserved (cheatsheet §Component events): `tap`, `change`, `touch`. These are the existing bound-to-built-in-primitives event names. None currently passes a value to the handler.
> 
> Should `on tap(coords):` etc be allowed for custom uses? Default proposal: **reserved events stay payload-less**. The named form is custom-event-only; reserved events keep their existing no-parens-required shape. (`change` is interesting because it could carry the new value, but that's currently handled via `bind:` rather than `on change:`. Keep the separation.)
> 
> ### Q5 — Does this break any existing pattern?
> 
> The closure-over-loop-var pattern is the highest-risk case. Worked example must keep working:
> 
> ```igni
> each alert in alerts:
>   AlertRow alert, on delete: alerts = without(alerts, alert)
> ```
> 
> Here `alert` is the loop variable; `AlertRow` is presumably defined with `emit delete` (no payload). Parent uses bare `on delete:` (no parens). Works under Shape A.
> 
> **Mixed case worth surfacing**: what if `AlertRow` emits a payload that's *different* from the loop variable?
> 
> ```igni
> each alert in alerts:
>   AlertRow alert, on delete(deleted_id): alerts = filter(alerts, a => a.id is not deleted_id)
> ```
> 
> Both `alert` (loop variable) and `deleted_id` (emitted payload) are in scope inside the handler. Default proposal: **both work, no conflict**. The named handler parameter shadows any same-name outer variable.
> 
> ## Implementation sketch
> 
> Firms up post-Stage-2.
> 
> **Parser** (`transpiler/src/parser.ts`):
> - Extend `parseOnHandler` (or equivalent) to accept optional `(identifier)` after event name.
> - AST shape: `OnHandler { event_name: string, parameter?: Identifier, body: Statement[] }`.
> - Reject parameter for reserved events (`tap`, `touch`, `change`) at parse time.
> - Reject parameter when component definition's emit signature for that event has no value (cross-component static check).
> 
> **Codegen** (`transpiler/src/codegen.ts`):
> - When emitting the handler body, bind the parameter (if present) to the value passed via the existing `emit` event channel mechanism.
> - Existing v0.5 `emit X v` codegen already passes the single positional value through the event channel; this change wires the receiving end.
> 
> **Cheatsheet update** (post-ship):
> - Replace the existing "parent picks the receiving name in its handler body" prose with an explicit syntax example.
> - Add the closure-over-loop-var note as a separate worked example.
> 
> **Fixtures**:
> - Positive: `on-handler-named-param.igni` (named handler parameter on custom event); `on-handler-no-param.igni` (bare handler when emit has no value); `on-handler-multi-value-via-object.igni` (object packing pattern).
> - Negative: `on-handler-named-on-reserved-event.expected.err` (rejected); `on-handler-named-on-payloadless-emit.expected.err` (rejected).
> 
> ## Pre-registered Stage 2 ship bar
> 
> - **Strong (3/3 convergence on Q1 + Q2-Q4 majority + no Q5 breakage).** Proceed to Stage 0 with proposed defaults.
> - **Mixed (2/3 convergence on Q1, splits on Q2-Q4).** Patches queued in design note; Tyr decides which to apply before Stage 0.
> - **Weak (≤1/3 on Q1).** Reopen the design; revisit Shape B/C/D harder.
> 
> ## Stage 2 outcome
> 
> *Filled in after the panel completes — convergence table + queued patches + Stage 0 readiness call.*
> 
> ## Source artefacts
> 
> - `tests/v0.16-event-payload-design-review/prompts.md` — Stage 2 prompt (forthcoming)
> - `tests/v0.16-event-payload-design-review/{model}.{md,json}` × 3 — panel responses (forthcoming)
> - `docs/private/107` — meta-review that surfaced this gap
> - v0.15.2 cheatsheet §Component events — current state of the spec on this topic
> ---DESIGN NOTE END---
> 
> Now answer five specific questions. Be substantive and direct.
> 
> **Q1 — Shape choice.** Is **Shape A** (`on X(name):` — handler signature names the receiver) the right design? Are there counter-arguments worth surfacing? Specifically: does the parens form on the parent side risk being mis-cued as function call, component invocation, or anything else by readers used to other languages? Is one of Shape B (implicit `value`), C (lambda-as-handler), or D (arrow form) actually a better fit for Igni's principles than the design note acknowledges? Or is there a Shape E I haven't considered?
> 
> **Q2 — Mismatch cases.** The design note proposes: silent drop when child emits a value but parent uses bare `on X:` (no parens); parse-time error when child emits no value but parent uses `on X(x):`. Is this the right asymmetry? Counter-arguments?
> 
> **Q3 — Multi-value emit.** Should v0.16 keep the existing single-positional + object-packing rule (`emit submit {a, b}` + `on submit(data): data.a`), or extend to multi-arg (`emit submit a, b` + `on submit(x, y):`)? The design note recommends keep-as-is. Push back if you disagree.
> 
> **Q4 — Reserved events.** Default proposal: reserved event names (`tap`, `change`, `touch`) stay payload-less; named handler parameter is custom-event-only. Concrete: `button "X", on tap(coords):` would be rejected at parse time. Is this the right rule, or should reserved events also accept payloads (e.g. `on tap(coords)` with click position)?
> 
> **Q5 — Pattern preservation.** Does Shape A break any existing pattern in Igni? The design note explicitly checks the closure-over-loop-var pattern (`each alert in alerts: AlertRow alert, on delete:`); also the mixed case where both a loop variable and an emitted payload are in scope. Are there other existing patterns that this proposal could break or make awkward?
> 
> Format: numbered answers (Q1–Q5), one substantive paragraph each. No code blocks except for short illustrative Igni snippets. If you genuinely converge with the proposed default, say so explicitly — convergence is data too. If you'd reject Shape A entirely, name the alternative.
