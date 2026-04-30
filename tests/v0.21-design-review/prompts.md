# v0.21 persistence + reactive-fetch-race design review — Stage 2

Stage 2 panel — 3 frontier models critique design notes 126 (persistence) and 121 (reactive-fetch-race) before any spec edit lands. Both are v0.21 cycle workstreams; bundling them saves cycle bandwidth.

Run via `npx tsx tests/runner/cold-test.ts --no-spec --no-grade --prompts tests/v0.21-design-review/prompts.md --out tests/v0.21-design-review --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview`. Outputs are prose, not Igni source.

**Q1 + Q3 are anti-anchored** against the locked / honest-leaned shapes (Option A persistence + Shape A race-conditions) per v0.20 + v0.19 Stage 2 precedent. Anti-anchoring guards against panel agreement that's more anchoring than load-bearing critique.

Patch decision (per spec-cycle skill rules): 3/3 convergent on a refinement → patch the design note; 2/3 → consider; 1/3 → log only. Trigger A fires if 2/3+ FLIP on Q1 or Q3 on architectural grounds.

## 1. v0.21 persistence + reactive-fetch-race design critique

> You are reviewing two paired design notes for the Igni programming language ahead of v0.21 implementation. Igni is a UI-first programming language with the north star "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword/syntax form is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Indentation, no brackets**: block structure is whitespace + colons.
> - **PascalCase = component (no parens), lowercase = function (with parens).**
> - **Lexical reactivity**: each screen re-evaluates from the top whenever any variable it references is reassigned.
> - **Path C** (committed v0.15+): designs translate from Figma's auto-layout vocabulary; primitives match Figma's model rather than reinventing.
> - **Wrapper-builtin pattern** (already established): `fetch()`, `spring()` are top-level wrappers that take a value and return a reactive surface. Three instances form a class; spec budget rule says "don't add a new keyword when an existing primitive can be extended."
>
> v0.20.4 just shipped (typography rename `heading.small` → `title` for flat-naming consistency). v0.21's scope is two paired primitives: **persistence (`persist()` Tier 1)** and **reactive-fetch-race fix**. Both are evidence-driven by n=4 cross-source convergence (extrapolation panel + Boojy descope + chat-mode review + strategic panel) and a 3/4 chat-mode review respectively.
>
> The two design notes below are ready for Stage 2 critique. Read them carefully, then answer the five specific questions at the end. Be substantive and direct — Q1 + Q3 are anti-anchored, so substantive architectural arguments AGAINST the recommended leans are exactly what the panel is for.
>
> ---DESIGN NOTE 126 — persistence (`persist()` Tier 1)---
>
> ### Source signal — n=4 cross-source convergence
>
> | Instrument | Mechanism | Finding |
> |---|---|---|
> | v0.16.0 extrapolation panel | "What do models invent when the spec runs out?" | 4/4 named `persist(initial)` as needed primitive; 2/4 converged on shape |
> | v0.20.1 chat-mode cheatsheet review | Q5 fit-and-limits across three project shapes | 3/4 cells named persistence as a wall for notes-shape apps |
> | Boojy Notes app 2 build descope | Real-app build window — explicit descope at scope-lock time | "local-first persistence needs `persist()` to ship first" |
> | v0.21 strategic-critique panel | H/R/F dimensions on scope boundary | 4/4 unanimous Tier 1 in v1.0 |
>
> ### Q1 — Scope LOCKED (Tier 1 only in v1.0)
>
> - **Tier 1 IN.** Local-first key-value persistence — `persist(initial)` adds durable shared state to the existing volatile/shared/external state model. Data survives app close, restart, OS update; no cross-device sync; no schema migration framework; no relational queries.
> - **Tier 2 DEFERRED.** Schema-bearing persistent collections (`store Workouts:` / `table Workouts:`) explicitly out of v1.0 scope.
> - **Tier 3 OUT INDEFINITELY.** Vendor SDK bindings (Firebase, Supabase, Realm) — *"fetch() forever"* per panel unanimous.
>
> ### Q2 — Shape LOCKED → Option A (wrapper-builtin)
>
> ```igni
> shared:
>   theme_mode = persist("system")
>   cart = persist([])
>   user_id = persist(null)
>
> screen Settings:
>   layout vertical:
>     label "Theme: " + shared.theme_mode
>     button "Dark", on tap: shared.theme_mode = "dark"
> ```
>
> `persist()` is a wrapper builtin (matches `fetch()`, `spring()`) used at top-level inside `shared:` block. Initial value passed as the wrapper argument. Reading and writing use the standard `shared.X` access pattern — wrapper is invisible at usage sites.
>
> **Why A locked over B (annotated-block `shared persisted:`):**
> - **"One way to do everything"** preserved (no `shared:` vs `shared persisted:` sub-block flavours).
> - **Wrapper-builtin pattern already established** — `fetch()`, `spring()`, now `persist()`. Three instances form a class. Spec budget rule.
> - **Q4 + Q5 are option-independent** — they don't drive the Q2 choice; both options must address them.
>
> Acknowledged peer-language argument for B (Compose `@Stable`, SwiftData `@Model`): real but lighter for Igni's discipline. Annotations sit on existing class-based state in those ecosystems; Igni doesn't have classes — adding `shared persisted:` creates a new flavour.
>
> ### Q4 — Multi-file collision rule (operator-honest-lean: silent merge)
>
> Three candidate rules: (a) silent merge per existing `shared:` convention (last-declaration-wins); (b) single-file declaration forced; (c) explicit collision-resolution annotation. **Lean: silent merge.** Matches existing Igni convention. Disk-key-collision risk is real but rare (theme_mode is canonical; app-specific keys are typically file-local).
>
> ### Q5 — Cross-wrapper rejection rules (operator-honest-lean: parse-time rejection)
>
> Three concrete parse-time rejections with cross-pointing error messages:
> 1. **`persist(fetch(...))` rejected**: *"`fetch()` results have a loading lifecycle; `persist()` requires JSON-serialisable values — these don't compose. To persist fetched data, copy the resolved value into a persisted variable from an `on tap:` handler."*
> 2. **`persist(spring(...))` rejected**: *"`spring()` is a read-only animation mirror, not a state value; `persist()` requires assignable JSON values."*
> 3. **`[persist(x)]` (persist-inside-list-literal) rejected**: *"`persist()` is a top-level wrapper inside `shared:`, not a value-position expression. Declare each persisted item separately in `shared:`."*
>
> ---DESIGN NOTE 121 — reactive-fetch-race fix---
>
> ### The hazard
>
> A reactive `fetch()` re-runs whenever a variable in its arguments is reassigned. The runtime fires the fetch fire-and-forget — no cancellation, no completion-time URL check. Two rapid changes to the dependency produce two concurrent in-flight requests. **The response that lands last sets state**, regardless of which URL is current at completion time. Stale-data-wins under network race conditions.
>
> ### Three candidate fix shapes
>
> **Shape A — Latest-URL-wins guard at completion time** *(operator-honest-lean)*
>
> In `_fetchX`, capture the URL at request-fire time. On completion, check if it still matches `_lastXUrl`. If not, drop the response.
>
> Pros: minimal codegen change; no client lifecycle; preserves "fetch is just an async value" mental model. Old request still completes (wastes bandwidth) but doesn't pollute state. Latest-URL response always wins.
>
> Cons: bandwidth waste under rapid changes (every fire spends a full request). No early termination if user navigates away mid-flight.
>
> **Shape B — Cancellation via `http.Client.close()`**
>
> Each fire creates an `http.Client`; subsequent fire closes the previous client (which throws `ClientException` in the in-flight `await`, caught and dropped via the URL guard).
>
> Pros: actual cancellation — bandwidth savings under rapid changes; cleaner client-side behaviour.
>
> Cons: semantic muddiness — "the request was cancelled" is a different state from "the request errored." Lifecycle is more codegen surface area; possible Flutter Web vs mobile divergence.
>
> **Shape C — Request-counter token**
>
> Each fire increments an integer counter; the response only commits if the captured counter matches the current value at completion.
>
> Pros: orthogonal to URL identity (handles the case where two fires share a URL but should still serialise — e.g., POST mutations).
>
> Cons: counter is a separate field per fetch var (more codegen state). Functionally equivalent to Shape A for GET-with-changing-URL.
>
> ### Recommended Stage 1 lean
>
> **Shape A with Shape C fallback for non-URL-driven re-fires.** Shape A handles the canonical case (URL changes drive re-fetch) with minimal codegen surface. Shape C handles the edge case where the URL is identical but the body or method differs (mutations triggered by an external `every`-block or a shared-state change). Shape B's actual cancellation is a quality-of-life improvement on top of either, not a substitute.
>
> ---DESIGN NOTES END---
>
> Now answer the five questions below. Be substantive and direct.
>
> **Q1 (anti-anchored — strongest case AGAINST Option A):** Make the strongest possible case AGAINST Option A (wrapper-builtin `persist(initial)`). What does Option A break, miss, or mis-handle that Option B (annotated-block `shared persisted:`) would handle better? Score against Igni's "one way to do everything" + "no magic" principles in particular — does the wrapper-overload concern at the fourth instance (`fetch` async, `spring` animated, `persist` durable — three different semantic categories sharing one syntactic shape) honestly violate spec-budget discipline? Argue the principled architectural case for B, not just the ergonomic case. Verdict: HOLD A / REFINE A / FLIP to B / FLIP to C (sub-block keyword `persist:` block parallel to `shared:`).
>
> **Q2 (sub-decision pressure-test — Q4 collision rule + Q5 cross-wrapper rejection):** Of the operator-honest-leans on Q4 (silent merge) + Q5 (parse-time cross-wrapper rejection with the three concrete error messages above), which (if any) are wrong? Particular focus: does silent-merge for `persist()` create a worse failure mode than for plain `shared:` (because the disk-key collision is *durable* — last writer's value persists across app restarts even after the conflicting declaration is removed)? Should Q5's cross-pointing error message structure cover edge cases the three concrete examples don't (e.g., `persist(now())`, `persist(some_function_call())`)?
>
> **Q3 (anti-anchored — strongest case AGAINST Shape A for race-conditions):** Make the strongest possible case AGAINST Shape A (latest-URL-wins guard). Bandwidth waste is the named con; how bad is it really under typical reactive-search shapes (input-bind to URL is already compile-time-rejected; the remaining surfaces are slider/dropdown/programmatic-shared-state)? Does Shape B's actual cancellation actively prevent a class of bug Shape A allows (e.g., user-navigation-during-fetch + lingering setState after dispose, even with Shape A's URL guard)? Argue the principled case for B (or C-only without A's URL guard). Verdict: HOLD A+C-fallback / REFINE / FLIP to B / FLIP to C-only.
>
> **Q4 (peer-language survey):** Persistence: Compose-Multiplatform `rememberSaveable`, SwiftUI `@AppStorage`, React `useLocalStorage` hooks, Flutter `shared_preferences`. Race-conditions: SwiftUI `.task(id:)`, React Query `useQuery` with cancellation, Compose `LaunchedEffect(key)`. Does any peer language solve persistence shape or race-condition shape in a way Igni's drafts haven't considered? What's the load-bearing pattern across the survey?
>
> **Q5 (anti-anchoring vs principled-minority self-prediction):** This panel is anti-anchored on Q1 (persistence) + Q3 (race-conditions), but Igni has a documented principled-minority pattern (`docs/private/114`, four instances) where Tyr reverses panel consensus to preserve architectural principles. If 3/3 of you HOLD on Option A + Shape A, what would the principled-minority case for Tyr to reverse to (B or C) look like? If you genuinely think Option A + Shape A are right, predict the strongest minority objection that *should* exist; if you flipped on Q1 or Q3, you've already made the case — say so.
