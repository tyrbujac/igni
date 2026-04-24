# Igni Review

## 1. One-paragraph summary

Igni is a small, opinionated UI language that compiles to Flutter/Dart, built around a single hypothesis: the syntactic choices that make code legible to frontier LLMs are the same choices that make it legible to humans. Its author is using cold-LLM panel testing (Claude, GPT, Gemini writing code from the docs alone) as the primary design forcing function, and iterating the spec until models reach for the intended idioms unprompted. The result is a deliberately narrow declarative-UI DSL — no imports, no brackets on component invocation, one equality operator (`is`), automatic lexical reactivity on variable reassignment, and a strict "one way per task" discipline — aimed at developers writing UI with LLM assistance who are tired of Flutter/React's boilerplate surface area. It's a research prototype (dissertation project), single-author, web-first, with mobile as a secondary target via `igni run ios/android`.

## 2. What works

- **The hypothesis is falsifiable and being tested.** Most new languages ship with vibes-based justifications; Igni has numeric cold-test results per spec round (e.g. "9/9 frontier adoption of `{target with ...}` unprompted" across three domain-swap rounds) and uses them to lock syntax. The domain-swap methodology (Shopping + Apothecary + Spaceship Cargo) to rule out corpus-density confounds is genuinely thoughtful experimental design.
- **Lexical reactivity as the entire model.** The rule — *"each screen re-evaluates from the top whenever any variable it lexically references is reassigned"* — is stated in one sentence and then everything else falls out of it. Local state, `shared.` state, and async `fetch()` all obey the same rule. This is the single smartest design decision in the spec. Compared to "useState + useEffect + useMemo + useCallback + dependency arrays," this is an enormous simplification.
- **`is` as the universal equality operator** (`is empty`, `is null`, `is loading`, `is error`, `is in`, `is "Robin"`, `is 0`). Folding all equality tests under one keyword with readable English variants is a clear win for both LLM and human. No `==`/`===`/`Object.equals` confusion.
- **The reactive-fetch footgun as a compile-time error.** Rejecting `fetch("..." + bound_var)` with a fix-it pointing at the trigger-variable pattern is the kind of tacit-knowledge-made-explicit rule that normally takes juniors months to learn. Encoding it in the compiler is the right move. The narrow scope (text `input` only, not `slider`/`dropdown`/`toggle`) is correctly calibrated.
- **`{target with field: value}` object-update syntax.** The spec's argument for keeping the `with` form inside braces — so object construction has exactly one visual marker — is principled, and the 9/9 adoption data supports it empirically. The rules around it (shallow only, BASE must be a variable or dot-chain, no function-call bases) are tight.
- **The tutorial is excellent.** v2.5 is genuinely well-paced. Section 2 Part 1's treatment of `label "name"` vs `label name` is the kind of thing most tutorials skip and it's exactly the conceptual split beginners trip on. The checkpoint structure ("Section 3 + Section 5 combined") and the "Try this" asides are pedagogically strong.
- **SYNC markers and prune-before-add cadence.** The discipline of `scripts/sync-docs.ts` for mechanical facts, plus the documented v0.11.5 prune pass (2931 → 2536 words), signals that the author actually treats the spec's word count as a resource to budget. Most language designers don't.
- **Compile-time rejections with fix-it errors.** Five specific anti-patterns with pinned negative fixtures in `examples-errors/` is a production-grade discipline for a research prototype.

## 3. What worries you

- **The core hypothesis is a correlation claim that isn't being tested against its alternative.** The README says *"LLM accuracy and human readability track each other."* The cold-LLM tests measure whether LLMs produce correct Igni. They do not measure human readability independently, nor whether the two correlate. It's entirely possible that LLM-friendly syntax and human-friendly syntax happen to overlap *for Igni* because the author is a thoughtful designer, not because the principles track in general. The ARCHITECTURE document mentions "human usability testing" but I see no methodology or results for it the way there is for LLM testing. Without that, the headline claim is under-evidenced.
- **"No ternary" and "no string interpolation" rules push verbosity into readers.** The spec defends these as reducing LLM confusion, but the consequence is real: the "conditional assignment" pattern —

  > ```igni
  > display = sorted_list
  > if descending:
  >   display = reversed(display)
  > ```

  — is three lines where `display = descending ? reversed(sorted_list) : sorted_list` is one. And `url = "/api/users/" + user_id + "/posts"` is noisier than `` `/api/users/${user_id}/posts` ``. At scale this friction compounds. The spec's claim that LLMs are confused by ternaries isn't backed by data I can see; it would be worth running an ablation round that specifically tests a ternary syntax.
- **The multi-view screen pattern is a trap waiting to happen.** The NotesApp example (list + detail in one screen, swapped by `if selected is null`) is explicitly called "tactical, not canonical" — but it's shown in full, in the spec, in beginner-adjacent position. Readers will copy it. The boundary conditions ("exactly two or three tightly coupled views" / "many screens (5+) — they should be separate") are fuzzy. I'd expect this to be a common source of apps painting themselves into a corner at version 2.
- **No function references, no multi-parameter lambdas, no lambda assignment.** The spec says lambdas are *"not general-purpose — you cannot assign a lambda to a variable, return one from a function, or use one outside a builtin call."* This is defensible for v1 but will bite hard the first time someone wants to sort by two keys, deduplicate by a key, or build a reusable filter predicate. The lack of `zip`, `reduce`/`fold`, or grouping primitives, combined with the single-param lambda restriction, means anything non-trivial falls back to imperative `each` rebuilds. That's fine until it isn't.
- **Cross-screen function calls being forbidden forces everything into shared state.** The spec is explicit: *"Cross-screen function calls are NOT allowed. [...] If a detail screen needs to mutate state owned by a list screen [...] use shared state."* The consequence: any non-trivial app ends up with a fat global `shared:` namespace. The Notes example side-steps this by doing the multi-view trick. In a real app, something as simple as "edit screen saves back to list screen" promotes `items` to global state. That's a Redux-store-by-stealth with none of Redux's tooling.
- **Identity semantics are genuinely confusing.** The spec states identity is reference-based, but then `replace(items, target, {target with done: true})` works because `replace` is explicitly identity-matching and `{target with ...}` creates a new object. Meanwhile `find(list, {id: x})` does NOT work. The rules are internally consistent but the cognitive load is high, and the "Identity is reference-based, not structural" warning in Appendix B is the kind of footnote that 80% of readers will miss until a bug bites them.
- **Pagination is only half-shipped.** The spec documents `paginate: 20` with language like *"for long lists fetched from a server, add `paginate:` to fetch in chunks and auto-load more on scroll"* — but the README/ARCHITECTURE say *"auto-load-more on scroll deferred pending async integration."* The docs promise behaviour that doesn't exist yet. This is the kind of gap that burns trust.
- **Async error handling is primitive.** `is error` collapses every failure (denied permission, 404, 500, timeout, offline) into one state. For `locate()` this is explicitly documented. For `fetch()` it's implicit. Real apps need to distinguish "token expired, re-auth" from "network down, retry" from "server broke, show error." There's no stated escape hatch. Similarly `contains()` being hardcoded case-insensitive with no case-sensitive alternative will bite.
- **`theme:` is documented live but mostly vapor.** v0.12.2 ships only font overrides; `spacing:` and `color:` sub-blocks are in Appendix C as "planned." This is a real usability blocker — you cannot customize brand colours, which means every Igni app looks like an Igni app. For a language pitching itself on "three commands to first pixel," the inability to match a client's brand palette is a v1 problem.
- **Single-author, no external contribution until post-v1.0.** Defensible for a dissertation project, but the README's "External contribution will open post-v1.0 when the spec is stable" has a ratchet problem: the spec stabilises by shipping, and shipping broadly needs contributors. This is fine as long as the author's bus factor stays at 1 and the dissertation timeline holds.
- **No test beyond transpiler-diff and LLM cold runs.** I see no property tests, no fuzzing of the parser, no runtime test suite for the generated Dart. For a language claiming production-readiness intent, this is thin.

## 4. Comparisons

Igni's closest cousins are **SwiftUI** and **Jetpack Compose** — declarative UI with automatic state observation — but with three distinguishing moves:

- **Vs SwiftUI/Compose:** Igni wins on spec size and zero-boilerplate. A SwiftUI `@State`/`@Binding`/`@ObservedObject` distinction doesn't exist; there's just `=` and `shared.`. Igni loses on ecosystem (no `ForEach` customisation, no animations, no gesture composition, no view modifiers beyond the handful shipped), on tooling (no Previews, no type checker worth mentioning), and on performance model transparency (SwiftUI at least tells you *why* something re-rendered via Instruments; Igni's "re-evaluate from the top" may or may not translate to Flutter's widget diffing efficiently).
- **Vs Flutter directly:** Igni's 17-line Todo vs Flutter's ~80-line equivalent is a real win, and the SafeArea auto-wrap + sensible defaults are genuine quality-of-life. But Flutter has animations, a pub.dev ecosystem, mature devtools, and a community. Igni is strictly less powerful — the tradeoff only makes sense if the LLM-assisted workflow gain outweighs the ecosystem loss.
- **Vs Elm:** Similar north star (one way to do things, no surprises), very different mechanism. Elm is pure-functional with an explicit `Msg`/`update` loop; Igni is impure with implicit reactivity via reassignment. Elm's compiler errors are legendary; Igni's are transpile-time rejections of a handful of patterns. Elm's purity gives it time-travel debugging; Igni gives that up for familiar assignment syntax. Igni's "LLMs reach for this syntax first" empiricism would probably find that LLMs reach for assignment before `update` functions, which supports the bet.
- **Vs Roc:** Roc is also small-spec and opinionated, but Roc is a general-purpose functional language; Igni is a UI-only DSL. Different categories.
- **Vs React/React Native:** Igni kills the hook rules, the dependency-array footgun, and JSX's bracket soup. It loses the ecosystem and the escape hatches (no `useRef`, no imperative handles, no portal).

**Closest match overall:** SwiftUI, if SwiftUI had been designed in 2025 specifically for LLM-assisted coding and had shed 90% of its API surface. The narrowness is the product.

**Where Igni has a genuine edge:** the combination of (a) "reactivity is just reassignment," (b) "one equality operator that reads as English," and (c) "compile-time rejection of the reactive-fetch footgun." I haven't seen another language with all three.

**Where Igni loses:** animation, ecosystem, lambda power, error-state granularity, theming, and — unavoidably — the trust problem that comes with being single-author research software.

## 5. What you'd change

**Change 1: Add a proper error-state primitive, or at least an escape hatch.** The current model where `fetch()` errors collapse to `is error` with no stated way to read status codes, messages, or retry is a known gap that will bite the first user who hits a 401. Concrete proposal for v0.13: give async results an optional `.error` field that is `null` on success and an object `{status, message}` on failure, keeping `is error` as the canonical test for branching but letting apps display *why*:

```igni
if forecast is error:
  label forecast.error.message, color: danger
  if forecast.error.status is 401:
    button "Log in again", on tap: navigate to Login
```

This is scoped, doesn't change the reactivity model, and addresses a real usability blocker without bloating the spec — one new dotted field, no new keyword.

**Change 2: Run a human-readability study, even a small one, and publish its methodology.** The hypothesis in the README is *"LLM accuracy and human readability track each other,"* but only one side is being measured. A 10-person think-aloud study — show participants an Igni snippet and a Flutter equivalent, ask them to predict what it does, measure accuracy and time — would either validate the core thesis or reveal that LLM-friendliness and human-friendliness diverge. Either outcome strengthens the dissertation. Right now the headline claim is half-supported, and given that the project's entire differentiation depends on it, closing the evidentiary gap seems higher-priority than adding features. This doesn't need to ship in a spec version; it needs to ship in `tests/` alongside the cold-LLM results.

Both are achievable in the next few spec rounds. The first is a scoped language change. The second is a methodology upgrade that would materially strengthen what Igni can claim about itself.