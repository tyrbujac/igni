# Q1: Scope tier for v1.0

## Tier 0 — fetch() only (anti-anchoring case)

The strongest case for shipping nothing new is methodological. If the dissertation thesis is "constrained UI language is more LLM-authorable than a general-purpose alternative," every primitive added that isn't UI dilutes that thesis. fetch() is already a concession, but a defensible one — every UI app talks to *some* backend, even if read-only. Persistence is categorically different: it's a data-layer concern that real apps solve with Supabase, Firebase, or custom APIs. If you can fetch() to those, you don't need persist() in the language. The dissertation can claim "Igni is the UI layer; backend is out of scope," scope-cut cleanly, and the eval gets fewer variables.

**S1 (defensibility):** Tier 0 is the cleanest research-prototype framing. The "constrained UI language" thesis stays uncluttered. Scope creep risk is zero. **S2 (LLM-authorability):** strongest possible — no new surface area to misuse. **S3 (one-way discipline):** unaffected; nothing added.

**Verdict: refine, not adopt.** The case has more merit than the cross-source signal suggests, but the eval likely requires building apps that survive restart. A todo list that loses everything when the app closes is a toy, and your reviewers will know it. Tier 0 is honest but probably underdelivers for the dissertation deliverable. The interesting question is whether the n=3 signal is reading "production app needs" through a lens the dissertation framing doesn't actually require.

## Tier 1 — persist() for local key-value

**S1:** Right size for v1.0. Smallest possible expansion, doesn't claim to solve database problems, addresses the concrete gap (state survives restart). Defensible scope: settings, preferences, draft text, small lists. **Hold.**

**S2:** One new builtin (or one new block — see Q2). Cold-authorability is essentially perfect because surface area is minimal. The one risk is semantic confusion with existing wrappers (fetch, spring) — addressed in Q2. **Hold.**

**S3:** Holds discipline cleanly *if* the shape is single. The discipline question collapses entirely into Q2. **Hold, contingent on Q2 shape.**

## Tier 2 — schema-aware local DB

**S1:** This is the scope cliff. Schema declaration syntax, query primitives, mutation primitives, migration semantics — each is a major design surface. For a UI-first dissertation, this expands scope into "app platform," which is a fundamentally different research thesis. **Flip.**

**S2:** Multiple primitives multiply LLM error modes. Schema mistakes, query lambda mistakes, migration mistakes all compound. The eval becomes "how good is the LLM at relational thinking" not "how good is it at UI translation." **Flip.**

**S3:** SQL-versus-lambda is a one-way violation in waiting. Even within lambda predicates, there's filter() composition versus declarative `where:` — both can plausibly work, both produce two ways. **Flip.**

**Verdict: out for v1.0.** Possible v1.x but not natural; see Q3.

## Tier 3 — cloud backend integration

**S1:** Vendor-specific, even when abstracted. "Supabase via Igni" is an SDK wrapper, not a language primitive. Product territory, not language territory. **Flip.**

**S2:** Vendor patterns leak into the language surface. Firebase realtime listeners differ from Supabase row-level security from Postgres direct connection. The LLM has to know vendor specifics on top of language specifics. **Flip.**

**S3:** Multi-vendor multiplies ways; single-vendor is lock-in. No clean position. **Flip.**

**Verdict: out indefinitely.** "fetch() + persist() + bring your own backend" is the principled position.

## Q1 recommendation

Tier 1 for v1.0. Tier 2 deferred with serious skepticism. Tier 3 out indefinitely. The contrarian residue: Tier 0 is defensible enough that the dissertation framing should be explicit about *why* persist() ships in v1.0 — "the eval requires it," not "the language is becoming an app platform."

---

# Q2: persist() shape

## Option A — `persist(initial)` wrapper

**P1 (anti-anchoring case against A):** The wrapper shape collides semantically with the existing wrapper builtins. `spring(value)` is a read-only animated mirror; `fetch(url)` is async with loading/error states. `persist(initial)` would be neither — a synchronous variable that happens to write-through to disk. An LLM cold-reading the cheatsheet might assume `persist()` returns an async/loading shape (because fetch does) or that it's read-only (because spring is). The wrapper-builtin pattern is becoming overloaded: three wrappers, three different semantic categories. Adding a fourth pushes the pattern past coherence. The risk is real — counter-evidence is that local-screen state declared with `persist()` would also need scope-resolution logic (storage key derived from variable name + scope path), which adds compiler complexity that isn't visible at the call site.

Counter-counter: the wrapper is still the most idiomatic Igni shape. Variable declarations are plain assignments; modifiers wrap initial values. `persist([])` reads as "this is a list, but persistent." Local to declaration, no separate block to introduce. **Refine, not flip.** Keep the wrapper shape; consider naming carefully to disambiguate from fetch/spring (e.g., document explicitly that it's a transparent identity-with-side-effect, or pick a name like `stored()` if `persist()` reads too async).

**P2:** Strongest one-way match of the three options. Variable-level decoration, shared-block discipline preserved, same shape across primitives, lists, objects. **Hold.**

**P3 (type coverage):** JSON-serializable subset. Strings, numbers, bools, lists of those, objects with serializable fields. Functions error. Reference cycles error. Compiler can statically reject `persist(some_function)` and most non-serializable shapes; runtime catches the rest. The boundary needs to be explicit in docs: "persist() accepts the same types you'd send through `fetch(body:)`." **Refine to make boundary explicit.**

**P4 (race and write semantics):** Naive every-reassignment-writes is wrong for rapid changes (slider drag binding to persisted volume = per-frame writes). Debouncing is necessary. The interaction with v0.20.1's deferred race-condition story: persist() inherits the same problem. If a write is debounced and the app suspends mid-window, last state is lost. Honest specification: writes flush within Nms of last reassignment; flush forced on app suspend (platform lifecycle). Document the window. **Refine.**

**P5 (failure modes):** Storage corruption — read returns null, fall back to initial value. Quota exceeded — write fails silently (debug log) by default. Type mismatch on read (schema drifted between app versions) — fall back to initial, log warning. Loud-error variants belong in v1.x once the failure-mode signal is real. The principled tradeoff: silent failure with debug log accepts that production apps with quota concerns need a different primitive later. **Hold with explicit doc.**

**P6 (peer priors):**
- SwiftData @Model **misleads** — schema-aware, queryable, relational. persist() is none of these. LLMs trained on Swift over-reach.
- Compose DataStore **mostly aligns** — preferences-style, key-value, async writes. Some leak: DataStore distinguishes Preferences from Proto (typed); persist() collapses both.
- localStorage **helps** — synchronous, simple, JSON-serializable. Closest mental model.
- AsyncStorage (RN) **mostly helps** but is async on read; persist() reads sync at screen mount.

The trap: SwiftData expectations. Docs need an explicit disclaimer — "persist() is for settings, drafts, and small lists, not for queryable application data."

## Option B — `shared persisted:` annotated sub-block

**P1:** Worse than A. `shared:` is already a special form; `shared persisted:` introduces a sub-flavor. The LLM has to learn three shapes for cross-screen state: volatile shared, persistent shared, implicitly local. Within a file, can you mix persisted and non-persisted in one block? If yes, you need both `shared:` and `shared persisted:` blocks when state is mixed. If no, every shared variable is persistent (forced binary). Both choices are awkward. **Flip.**

**P2:** Leaks discipline if both `shared:` and `shared persisted:` exist (two ways to encode "shared variable"). Clean only with per-variable annotations inside a unified block, which is closer to A's wrapper than its own thing. **Flip.**

**P3–P6:** Persistence semantics don't change between wrapper and block annotation; same answers as A. The only real differences are P1 and P2, both worse for B.

**Verdict: flip.**

## Option C — top-level `persist:` block

**P1:** New top-level construct, new namespace (`persist.X`). The duplication with `shared:` is the immediate problem. What's the difference between cross-screen-shared but not persistent, versus persistent (and necessarily cross-screen)? If both, do you declare in both blocks and sync them? Reference both `shared.theme_mode` and `persist.theme_mode`? **Flip.**

**P2:** Major leak. `shared:` and `persist:` both fulfill "cross-screen state"; persist also adds durability. Most production cases want both, leading to duplication or confusion about which prefix to use. **Flip.**

**P3–P6:** Same persistence semantics; the framing is the issue.

**Verdict: flip.**

## Q2 recommendation

Option A (wrapper inside `shared:`), with two refinements: name carefully to not collide with fetch/spring semantics, and consider extending to local-screen scope (so screen-local draft text can persist without lifting to shared just for persistence). The local-scope extension adds compiler work for storage-key resolution but preserves the one-way discipline; without it, persist() forces "anything that needs to survive must be shared," which is itself a discipline violation.

Type boundary: JSON-serializable, compiler-rejected where statically detectable. Write semantics: debounced flush, forced on suspend. Failure modes: silent fall-back to initial on corruption/mismatch, debug log on quota.

---

# Q3: v1.x trajectory

## T1 — schema-aware DB as v1.x extension?

The proposal in the question is significant scope expansion. `table Workouts:` is type-system addition; `query Workouts, where: w => w.created_at > yesterday()` is a query language; the implied storage is relational with indexes; missing from the sketch but required: migration semantics for schema evolution across app versions. Each is research-paper-sized.

The lambda predicate is the hardest design surface. Does `w => w.created_at > yesterday()` compile to a SQL WHERE clause? That requires restricting the lambda subset to SQL-translatable expressions and generating predictable execution plans. Or does it run client-side after fetching all rows? That doesn't scale. Hybrid (some predicates pushed down, others client-side) is what Room/SwiftData do, and it's the leakiest part of those frameworks — exactly the kind of "predicate happens to be SQL-translatable, performance differs by 1000x" surface that breaks LLM-authorability.

**Verdict:** separate research project, not natural extension. v1.x could ship a *limited* "schemaless persisted list" with helper builtins (find/filter/sort already exist) and call it done. Real relational data should fetch from a backend.

## T2 — cloud backend integration?

Vendor SDKs as language primitives: no. The interesting middle ground is a generic typed-REST-resource abstraction layered on fetch():

```
resource User at "/api/users":
  id: int
  name: string
```

Giving you typed fetch + structured write. This is not nothing — it's a real productivity gain over raw fetch — but it's also a significant language expansion, and it could equally well be a userland library in Igni once the language supports type declarations more broadly. **Verdict:** library territory, not language territory. fetch() forever for the language; ecosystem can build typed-resource patterns.

## T3 — failure mode of Tier-1-only

The notes-app-syncs-across-devices scenario is the right test, and it surfaces the honest answer: cross-device sync is bigger than Igni's whole language scope.ing, offline queue management — these are individually large engineering surfaces and collectively a different product category. If adoption gates on cross-device sync, that's a v2.x problem at earliest, not a v1.0 gap.

For v1.0, the achievable apps are: single-device tools, todo lists, offline notes, settings-heavy utilities, workout trackers, recipe books, draft journals. These are real apps. The dissertation eval probably samples from this category anyway. The cross-source signal you mentioned almost certainly isn't asking for sync — it's asking for "my todo list survives app close."

**Failure-mode reframe:** v1.0 with Tier 1 fails to deliver only on apps where cross-device-sync is the core feature, which is a narrow category. For most app categories, persist() + fetch() to a user-built backend covers it.

---

# Cross-reference: Q1 ↔ Q2

The Q1 scope decision narrows Q2's design space helpfully. Tier-1-only means persist() doesn't have to compose with Tier-2/3 designs — there's no DB layer to coordinate with, no cloud sync semantics to fit. This *raises* the bar on persist()'s design (it's the entire data story) but *reduces* the surface it has to compose against.

Option A (wrapper) composes cleanest with a hypothetical future Tier 2: a `table Workouts:` declaration is a different surface from `persist(...)` on a list, no overlap, no migration question. Options B and C would force the question "does Tier 2 also use a top-level block? What's the relationship?" — which is exactly the kind of design debt you don't want to ship.

The Tier-2 lambda predicate (`where: w => w.created_at > yesterday()`) cross-references back to v0.20's `filter(items, item => item.done)`. If Tier 2 ever ships, it should feel like extension of list builtins, not a parallel query syntax — `query Workouts.where(w => w.created_at > yesterday())` or similar, sharing the lambda discipline. That's a constraint for future-Tier-2 design, not v1.0 work, but it's worth noting now: **the design choices that look local to v1.0 actually constrain v1.x's space**, and Option A is the one that constrains it least restrictively.

The strongest contrarian residue across all three questions: the n=3 cross-source signal for "some persistence in v1.0" deserves one more interrogation. If the signal is reading production-app demand through a research-prototype lens, the right response might still be Tier 0 plus a clear "out of scope" framing in the dissertation. That's defensible academically. But if the signal is reading dissertation-eval demand (the apps you'd build to demonstrate the language), Tier 1 is required and the recommendation above stands.
