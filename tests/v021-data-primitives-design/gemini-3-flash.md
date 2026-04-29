This strategic review assesses the evolution of Igni's data story from a "UI-first" research prototype to a viable v1.0 language.

---

## QUESTION 1: SCOPE BOUNDARY

| Dimension | Tier 0: fetch() Only | Tier 1: persist() (KV) | Tier 2: Schema DB | Tier 3: Cloud SDK |
| :--- | :--- | :--- | :--- | :--- |
| **S1: v1.0 Defensibility** | **HOLD.** Purest "research" stance. Argues that data management is a solved problem via external APIs and that Igni's job is *UI translation*. | **REFINE.** Minimalist "utility" stance. Addresses the #1 friction point (settings/state loss) without bloating the compiler. | **FLIP.** Scope creep. Designing a migration engine and relational mapper for a v1.0 prototype risks the dissertation focus. | **FLIP.** Out of scope. Vendor-specific primitives age quickly and create brittle dependencies for a prototype. |
| **S2: LLM Authorability** | **HOLD.** High. LLMs are excellent at writing REST integrations; no new syntax required. | **HOLD.** High. If it looks like a wrapper or a block, it's a low-token "pattern" for the LLM to follow. | **FLIP.** Low. Handling SQL joins or complex relations via lambdas often leads to hallucinated operators. | **REFINE.** Moderate. LLMs know Firebase/Supabase well, but Igni-specific SDK wrappers would be "cold" hallucinations. |
| **S3: "One Way" Match** | **HOLD.** Perfect. Data is "out there"; fetch() is the bridge. | **REFINE.** Strong. Distinctly separates "transient" (local) from "persistent" (stored). | **FLIP.** Weak. Creates a choice between `fetch()` and `query`, muddying the data source. | **FLIP.** Poor. Forces a choice between vendor A, vendor B, or fetch(). |

### The Case for Tier 0 (Anti-Anchoring)
One could argue that Igni v1.0 should **not** include persistence. As a research prototype focused on "design-to-code translation," the persistence of a Todo list is secondary to the *rendering* of it. By sticking to `fetch()`, Igni remains a pure UI-bridge. Any data problem is pushed to the backend (e.g., a simple Supabase REST endpoint), preserving Igni's slimness and preventing the "Is it a UI language or a full-stack framework?" identity crisis.

---

## QUESTION 2: PERSIST() SHAPE (Assuming Tier 1)

| Dimension | Option A: Wrapper `persist()` | Option B: `shared persisted:` | Option C: `persist:` block |
| :--- | :--- | :--- | :--- |
| **P1: LLM Cold-Authoring** | **FLIP.** High risk of "wrapper confusion." LLMs might try to wrap functions or fetch calls: `user = persist(fetch(...))`. | **HOLD.** Best. An annotation on an existing block (`shared`) is a clear "modifier" pattern LLMs handle well. | **REFINE.** Moderate. Introduces a new namespace (`persist.x`), which might lead to the LLM forgetting the `shared.` prefix. |
| **P2: "One Way" Discipline** | **HOLD.** Preserves the `shared.` prefix as the universal marker for "data that lives outside this screen." | **REFINE.** Creates two types of shared blocks; risks users asking "Why isn't everything persisted?" | **FLIP.** Leaks. Now there are two namespaces (`shared` vs `persist`) for non-local data. |
| **P3: Type Coverage** | Primitives, Lists, Objects. **NOT** supported: Functions, Async values (fetch results), or recursive objects. | Same as A. | Same as A. |
| **P4: Write Semantics** | **Write on Reassign.** Every time `shared.x = val` fires, the disk is hit. Composes with v0.20 race rules: the "last assignment wins" both in RAM and on disk. | Same as A. | Same as A. |
| **P5: Failure Modes** | Read mismatch (stored string vs expected list) returns the `initial` value as a fallback. Silent fail. | Same as A. | Same as A. |
| **P6: Peer Priors** | **AsyncStorage.** The "wrapper" feels like a synchronous version of React Native's model. | **SwiftData.** The annotation feel matches modern declarative UI trends. | **localStorage.** Feels like a separate global object. |

### The Case AGAINST Option A
While Option A (`persist([])`) feels like a simple function call, it is syntactically dishonest. In Igni, things inside `shared:` are usually initializers. `persist()` looks like a runtime transformation, but it's actually a compiler directive. This "magic function" could mislead an LLM into thinking it can be used anywhere (like inside a screen body), whereas a block-level modifier (Option B) or keyword (Option C) strictly constrains the behavior to the data declaration zone.

---

## QUESTION 3: BEYOND TIER 1

### T1: Tier 2 (Schema-aware DB)
Tier 2 is a **separate research project**. Introducing a `table` primitive transforms Igni from a UI-specification language into a heavy-duty Application Framework. For v1.x, Igni should likely remain "dumb" about data structures. If a user needs SQLite, they should wrap it in a REST-like local bridge or use an external service. **Verdict: Defer.**

### T2: Tier 3 (Cloud Integration)
The correct answer for Igni is **"fetch() forever."** By becoming a first-class citizen for Supabase or Firebase, Igni hitches its wagon to a specific vendor's release cycle. To maintain "One way to do everything," Igni should instead focus on making `fetch()` more powerful (e.g., built-in Auth headers or `shared: user = fetch(...)` persistence). **Verdict: Out-of-scope.**

### T3: The "Notes App" Failure Mode
Is Tier 1 (local only) enough? **Yes, for v1.0.** Igni's goal is to enable the *creation* of the app experience. A notes app that saves locally is a "complete" experience for a research prototype. If cross-device sync is the goal, the developer is effectively moving into "Production App" territory, which justifies the jump to an external API via `fetch()`. Tier 1 satisfies 90% of prototype use cases (onboarding flows, dark mode toggles, local checklists) without the complexity of a sync engine.

---

### RECOMMENDATION: The "Annotated Shared" Path
*   **Scope:** Tier 1 (Persistence) is necessary for v1.0 to feel "real."
*   **Shape:** **Option B (`shared persisted:`)**.
    *   It maintains the `shared.` prefix, ensuring all cross-screen data is addressed consistently.
    *   The `persisted` modifier is a clear instruction to the compiler.
    *   It prevents the namespace pollution of Option C and the "anywhere-use" confusion of Option A.

```igni
shared persisted:
  theme_mode = "system"
  tasks = []
```

This keeps Igni's footprint small while solving the most common "it doesn't save" complaint from early testers.
