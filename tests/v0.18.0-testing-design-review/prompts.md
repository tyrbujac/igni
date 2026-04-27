# v0.18 testing-infrastructure design review — Stage 2

Stage 2 panel — 3 frontier models critique design note 112 (`docs/private/112_v018_testing_infrastructure.md`) before any spec edit lands. The doc proposes a v1.0-blocker testing primitive bundle: `test "name":` block + `render`/event-sim/`expect`/test-scope builtins + mocking + snapshot/golden + sub-second `every` widening. Single-cycle bundle per Tyr decision.

Run via `tests/runner/run.ts --no-spec --no-grade` against three frontier models (`claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`). Outputs are prose, not Igni code.

Why a Stage 2 against the framing: testing is the project's **first framework-shaped change** — most prior cycles shipped a single primitive (`border:`, `every`, `theme: color:`) that fit ~10 LOC parser/codegen. This bundles 7+ syntax elements + a test runner + mocking + golden-files. The bundling rationale + canonical example shape are exactly what Stage 2 should pressure-test before implementation begins.

Treat panel responses as input to a Tyr decision, not the decision itself. Patch decision (per spec-cycle skill rules): 3/3 convergent on a refinement → patch doc 112; 2/3 → consider; 1/3 → log only.

## 1. v0.18 testing infrastructure design critique

> You are reviewing a design note for the Igni programming language ahead of v0.18 implementation. Igni is a UI-first programming language with the north star "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
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
> v0.17.0 just shipped (`border:` layout property + visual-chrome methodology branch). Immediately afterward, a 7-cell chat-mode meta-review panel (4 cheatsheet + 3 full-spec passes across opus-4.7, gpt-5.3, gemini-3.1-pro, gemini-3-flash) rated Igni and surfaced **7/7 unanimous convergence on testing as the v1.0 dealbreaker** — strongest possible result in the project's history. Panel sketches:
>
> - GPT 5.3: `test "Todo empty": render Todo / expect "No tasks yet"`
> - Gemini 3 Flash: `test "Description":` block that can simulate `on tap:` events and assert against state
> - Gemini 3 Flash: "Because logic is coupled to the screen, you can't unit test functions in isolation."
> - Opus 4.7: "This is the v1.0 dealbreaker for any team that ships software."
>
> The design note below is Stage 1 — the proposed shape. Tyr has already locked seven sub-decisions in chat (single-cycle bundle; unified `test "name":` block; sequence-of-statements body with no scope concept; `expect <bool-expression>` only; sibling `*.test.igni` files; `tap "<label>"` string-selector; `render <Name>` no-parens). The remaining sub-decisions and the bundling rationale are open — that's what this panel critiques.
>
> The design note follows. Read it carefully, then answer the six specific questions at the end. Be substantive and direct.
>
> ---DESIGN NOTE START---
>
> # 112 — v0.18 testing infrastructure (Stage 1 design)
>
> **Source signal:** v0.17.0 meta-review panel — 7/7 cells unanimously named testing as a v1.0 gap. Strongest possible convergent result. Promoted directly to Next-milestone tier, bypassing the usual Stream 3 staging.
>
> **Locked sub-decisions** (Tyr, chat):
>
> - **Cycle sequencing — single-cycle bundle.** v0.18 ships test block + render + event-sim + assertions + mocking + snapshot/golden + sub-second `every` widening.
> - **Test syntax scope — unified `test "name":`, scope-inferred from body content.** No `test_function`/`test_screen`/`test_component` proliferation.
> - **No "scope" concept.** Test bodies are sequential (assignments, render, function calls, event-sims, expect assertions). `render` is optional; event-sims require prior render at runtime.
> - **Assertion vocabulary — `expect <bool-expression>` only.** Single canonical form. Test-scope builtin `seen "string"` provides content matching; ergonomics reuse existing `is`/`is in`/`is empty`/`not` operators.
> - **Test files — sibling `*.test.igni`** alongside source. Auto-discovered by `igni test` (recursive); excluded from `igni build` by extension.
> - **Event-sim shape — `tap "<label>"`** (string-as-selector, 3/3 panel convergence on this shape).
> - **Render syntax — `render <Name>`** for screens; `render <Component>, arg: value` for components. Mirrors no-parens invocation.
>
> ## What v0.18 *is* and *isn't*
>
> **Is:** end-to-end testing infrastructure for user Igni programs. Specifically:
>
> - `test "name":` block at top-level of `*.test.igni` files
> - `render Screen` / `render Component arg: value` for set-up
> - `tap "<label>"` / `change <input-id>: <value>` / `submit <input-id>` for event simulation
> - `expect <bool-expression>` for assertions
> - Test-scope builtins: `seen "string"`, `value_of(<input-id>)`, `on <Screen>`, `tapped("<label>")`
> - `mock fetch:` and `mock every:` blocks for deterministic runs
> - `snapshot "<name>"` for visual / textual regression tests against golden files
> - `igni test` CLI command (auto-discovers + runs `*.test.igni` files)
> - Sub-second `every` widening (`16ms` / `100ms` / `500ms` added to the existing `1s`/`5s`/`30s` whitelist)
>
> **Isn't:** property-based testing / fuzzing (v0.19+), performance benchmarking, Playwright-style cross-browser E2E, deep mocking of `locate()`/`play()` (1/7 panel signal too thin), pixel-perfect cross-platform golden testing (textual-tree only for v0.18), test runners for the transpiler itself (those exist).
>
> ## Why testing earns v1.0-blocker tier
>
> 7/7 panel signal (verbatim quotes given above). Plus peer-language survey: Flutter `flutter_test` + `golden_toolkit` (first-class), SwiftUI XCTest + ViewInspector (first-class), Compose `composeTestRule` (first-class), React Testing Library + Vitest/Jest (first-class in ecosystem). 3/3 peer-language evidence. Combined: unambiguous v1.0 prerequisite.
>
> **Sequencing argument.** Three other v1.0-blocker primitive classes (a11y, animation, i18n) also surfaced at 4/7+3/7+1/7. Testing goes first because (a) strongest signal; (b) test runner needs sub-second `every` for time-mock, which animation also needs; (c) once tests exist, every subsequent v1.0-blocker primitive can be developed test-first, accelerating their own cycles.
>
> ## Framework-shaped — adapting the cycle
>
> The 9-stage spec-iteration cycle was built for primitive design (~10 LOC parser/codegen each). Testing is different: multiple syntax elements; most work is implementation (test runner, mock infra, golden-files); Stage 0/3 cold-test prompts have a different shape ("given screen Y, write tests" rather than "build app using X").
>
> **Cycle adaptations proposed:** Stage 1 bundles all elements; Stage 2 critiques the bundling itself; Stage 0 prompts ask panels to write tests for given screens; implementation may take 2-3 sessions and ship v0.18 *partial* if elements stagger.
>
> ## Hard examples — walls hit at v0.17
>
> Five things an Igni developer cannot do today: assert that a Todo screen shows "No tasks yet" empty state; assert that tapping "Add" with `draft = "buy milk"` produces an item with that text; verify a pure function in isolation (Gemini-flash: "logic coupled to screen = can't unit test functions in isolation"); mock `fetch()` for deterministic tests; golden-file regression test a payment-flow screen. Walls 1+2+3 = MVP scope; walls 4+5 = bundled-but-could-defer scope. Per single-bundle decision, all five ship.
>
> ## Proposed shape — canonical examples
>
> ```igni
> # user/Login.test.igni — sibling test file
>
> test "login form shows error on invalid email":
>   render Login
>   change email_input: "not-an-email"
>   tap "Sign in"
>   expect seen "Please enter a valid email"
>
> test "format_currency formats GBP with two decimals":
>   result = format_currency(1234.56)
>   expect result is "£1,234.56"
>
> test "shows offline state when fetch fails":
>   mock fetch:
>     "/api/users/42": error "network timeout"
>   render Profile
>   expect seen "Couldn't load — try again"
>
> test "stopwatch elapsed reaches 60 seconds":
>   mock every:
>     advance 60s
>   render Stopwatch
>   tap "Start"
>   expect seen "01:00"
>
> test "Dashboard layout matches golden":
>   render Dashboard, shared.user: example_user()
>   snapshot "dashboard_default"
> ```
>
> ## Test-scope builtins (proposed set)
>
> | Builtin | Returns | Meaning |
> |---|---|---|
> | `seen "string"` | bool | Does the rendered output contain this string anywhere? |
> | `value_of(<input-id>)` | bound value | Inspect an input/toggle/slider's current bound value |
> | `on <Screen>` | bool | Is the current screen `<Screen>`? (post-navigate assertion) |
> | `tapped("<label>")` | bool | Did a button with this label receive a tap event during this test? |
>
> ## Open sub-decisions (this panel may shift)
>
> - **Q-A — Mocking surface area.** Block-form (`mock fetch:` with URL-map body) vs. per-call builtin (`fetch.mock("/api/x", response)`). *Proposal: block-form*, mirrors `theme:` and `shared:` patterns.
> - **Q-B — Snapshot representation.** Textual widget-tree vs. pixel-perfect image. *Proposal: textual for v0.18.*
> - **Q-C — `igni test` CLI flags.** *Proposal: `--update-snapshots`, `--filter <pattern>`, `--watch`. Beyond that, defer to user feedback.*
> - **Q-D — Sub-second `every` token list.** *Proposal: `16ms` / `100ms` / `500ms` added. `1m`+ deferred unless signal compounds.*
> - **Q-E — Test-scope builtin set.** *Proposal: `seen` + `value_of` + `on` + `tapped` only.*
> - **Q-F — Mock-fetch interaction with the production "trigger variable" rule.** *Proposal: test-scope override — fetch calls run synchronously against the mock map; production reactive-fetch rules don't apply during tests.*
>
> ## Watch-list — falsification triggers
>
> Three triggers; **any one** opens a re-bundling decision: Stage 2 panel proposes splitting mocking + snapshot off (this panel could be that trigger); implementation cost surprise (>3 sessions); Stage 0 reveals a canonical-example bug (the doc 95 Pomodonut pattern).
>
> ## Stage 2 readiness
>
> Recommended: run Stage 2, do not skip. Testing is the project's first framework-shaped change; bundling rationale + canonical example shape + open sub-decisions all need critique.
>
> ---DESIGN NOTE END---
>
> Now answer six specific questions. Be substantive and direct. If you genuinely converge with the proposed default, say so explicitly — convergence is data. If you'd reject a locked decision, name the alternative and the cost.
>
> **Q1 — Unified test block + scope-inferred body.** Is `test "name":` with a body-as-sequence-of-statements (no scope concept; render optional; event-sims require prior render at runtime) the right shape? Counter-arguments? Should the body's "no scope concept" rule be relaxed (i.e. allow explicit scope marker for clarity) or tightened (parse-time error on mixed-shape body)?
>
> **Q2 — Assertion vocabulary.** `expect <bool-expression>` as the single canonical form, with `seen "string"` test-scope builtin for content matching. Is this the right vocabulary? Or does the panel converge on a matcher API (`expect(x).toBe(y)` chain) or on splitting `expect <string>` (content) and `assert <bool>` (predicate) as two distinct keywords?
>
> **Q3 — Single-bundle scope.** Is the single-cycle bundle right (test + render + events + assertions + mocking + snapshot + sub-second `every` together), or should mocking and/or snapshot split into v0.19? What's your read on the Trigger-A falsification path — would you push back on bundling at all, or accept it as designed?
>
> **Q4 — Canonical-example bug check.** Look hard at the proposed canonical examples (Login form test, format_currency function test, mock-fetch offline test, mock-every stopwatch test, snapshot test). Is there a Pomodonut-style bug — a test pattern that looks right but silently fails in some legitimate case? Specifically: does `mock fetch:` interact correctly with reactive re-fetches inside `every` blocks? Does `mock every: advance 60s` correctly fire the right number of `every 1s:` ticks? Does `snapshot "name"` handle dynamic content like `now()` deterministically? Does `tap "Sign in"` find the right button if two buttons share a label?
>
> **Q5 — Test-scope builtin set.** The proposal is `seen` + `value_of` + `on` + `tapped`. Is this set right? What's missing that the canonical examples or your reading of typical Igni apps would need? (Examples to consider: `count_of(<list>)` for state inspection, `errored("<screen>")` for error-state checks, `latest_request("<url>")` for fetch-call inspection, `current_route` for navigation-state.)
>
> **Q6 — Cycle-adaptation framing.** The doc proposes that the project's 9-stage cycle (built for single-primitive changes) needs adapting for framework-shaped changes — Stage 0 prompts shift from "build app using X" to "given screen Y, write tests for it"; Stage 2 critiques bundling rationale; implementation may stagger across multiple sessions. Is this adaptation right? Are there other framework-shaped changes coming (a11y runtime, animation engine, i18n loader) that would benefit from a different adaptation? Should the cycle add a "framework-design" stage that includes a working reference implementation as part of the design note?
>
> Format: six numbered answers, one substantive paragraph each. Each must declare a clear position (hold / refine / reject) before evidence. No need to write Igni code beyond short illustrative snippets — this is design critique.
