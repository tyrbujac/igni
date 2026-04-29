This is an excellent architectural juncture. Moving from stateless UI to persisted data is where language scopes usually explode. As an AI evaluating this, I don't have the emotional attachment to feature-shipping that human engineers do, which makes it easier to look at this purely through the lens of constraint, LLM predictability, and your dissertation timeline.

Here is a strategic review of Igni's data primitives, holding strictly to your v0.20.1 constraints.

---

### **QUESTION 1: SCOPE BOUNDARY**

To protect a mid-2026 v1.0 release, we have to aggressively defend the boundary between "UI language" and "app framework."

#### **S1: Defensibility for v1.0**
*   **Anti-anchoring on Tier 0 (The case for `fetch()` only):** The strongest argument for Tier 0 is absolute scope purity. Igni's dissertation thesis is about a "constrained UI language for LLM-assisted development." Persistence does not test UI generation; it tests state lifecycle management. By forcing developers to use `fetch()`, you completely sidestep local state hydration, migration, and disk I/O asynchronous blocking. You prove the UI thesis without taking on database architecture debt.
*   **Flip/Refine (Tier 1):** However, Tier 0 makes the 17-line Todo app a toy. Without Tier 1 (KV persistence), you cannot build a self-contained, offline-capable utility app—which is the exact archetype LLMs are best at generating. Tier 1 is the minimal viable capability required to make Igni practically useful for prototyping. Tier 2 and Tier 3 are massive scope creep that turns Igni into an app platform, risking the mid-2026 delivery.

#### **S2: LLM-authorability cold**
*   **Hold (Tier 1):** LLMs are exceptionally good at key-value maps. Setting a flag or saving a flat array is highly predictable.
*   **Flip (Tier 2/3):** Tier 2 (local DB schemas) requires LLMs to successfully hallucinate relational schemas, query syntaxes, and local migration lifecycles—often resulting in mismatched queries. Tier 3 (vendor SDKs) is the worst-case scenario: LLM knowledge cutoffs mean they will confidently generate deprecated Firebase or Supabase SDK patterns, breaking compilation.

#### **S3: "One way to do everything" match**
*   **Hold (Tier 1):** If we add Tier 1, we still maintain a clean binary: transient data (local variables), global data (`shared`), and external data (`fetch`).
*   **Flip (Tier 2/3):** Tier 2 introduces a massive divergence. Does the user filter a list using the v0.20.1 `filter(items, item => ...)` lambda, or do they write a SQL-like `where` clause in Tier 2? This shatters the "one way" discipline.

**Conclusion for Q1:** Ship Tier 1 in v1.0. Defer Tier 2 and 3 entirely.

---

### **QUESTION 2: PERSIST() SHAPE (Assuming Tier 1 lands)**

Assuming we proceed with Tier 1 for v0.21, here is how the shape options break down.

#### **P1: LLM-authorability cold (Anti-anchoring Option A)**
*   **The case AGAINST Option A (`persist(initial)`):** Option A looks like a function call but acts like a compiler macro. LLMs will inevitably try to use it inside local screen state (`screen Home: count = persist(0)`). If Igni rejects local persistence, the LLM hits a compile error. If Igni allows it, you've just introduced fragmented disk I/O tied to screen lifecycles, which is a nightmare. Furthermore, `persist` as a wrapper breaks the visual simplicity of type inference.
*   **Refine (Options B & C):** LLMs are structural engines. They understand blocks natively. Giving them a dedicated namespace block (`shared persisted:` or `persist:`) ensures they won't try to sprinkle persistence inside component bodies.

#### **P2: "One way to do everything" match**
*   **Hold (Option B - `shared persisted:`):** This is the strongest structural fit. Igni already has a rule: "Use `shared:` for cross-screen data." If we use Option C (`persist:`), we create a fragmented global namespace. Does a developer read from `shared.theme` or `persist.theme`? Option B modifies the existing paradigm without breaking the global access rule (`shared.workouts`).

#### **P3: Type coverage**
*   **Boundary:** It must support strings, numbers, booleans, and lists/objects of those primitives (strict JSON serializability).
*   **Exclusions:** It must outright reject complex/runtime types. You cannot persist a `spring()`, an active `fetch()` loading state, or a function reference. At compile time, if an unsupported type is assigned to a persisted variable, it must throw an error.

#### **P4: Race conditions and write semantics**
*   **Hold:** Persistence writes must be asynchronous, fire-and-forget background tasks (using `shared_preferences` under the hood) so the 60fps UI thread isn't blocked.
*   **Refine:** It composes perfectly with v0.20.1's undefined race behaviour. If a user mashes a toggle, the last state to settle in memory is the last state written to disk. "Last-writer-wins" is the standard KV expectation.

#### **P5: Failure modes**
*   **Refine:** Disk states get corrupted, or schemas change (e.g., v1 of the app saves a string, v2 expects an object).
*   **Degradation:** Idisk read fails type-matching against the code's initial declaration, Igni must **silently wipe the disk key and fall back to the initial value defined in code.** For a prototype language, graceful reset is vastly superior to a fatal crash loop on boot.

#### **P6: Peer-language priors**
*   **Helpful:** `localStorage` is the right mental model for the developer—flat, synchronous-feeling access.
*   **Misleading:** `SwiftData` or `CoreData` are graph-oriented and will tempt you into building relationship management. Avoid this at all costs.

**Conclusion for Q2:** Option B (`shared persisted:`) is the safest, most LLM-friendly structural choice.

---

### **QUESTION 3: BEYOND TIER 1 — WHAT DOES v1.x LOOK LIKE?**

#### **T1: Is Tier 2 (schema DB) a natural extension or scope creep?**
It is definitive **scope creep**. Introducing declarative tables and relational queries fundamentally breaks Igni's "state is just variables" reactivity model. If a developer needs a relational database, they are building a complex system, not a rapid UI prototype. A local DB pushes Igni away from being a "UI-first" language into "Flutter-lite," competing in a space it doesn't need to win.

#### **T2: Tier 3 (Cloud integration) — First-class or `fetch()` forever?**
**`fetch()` forever.** Tying a compiled language to a third-party BaaS (Firebase/Supabase) guarantees rapid bit-rot as those external APIs evolve. Because Supabase provides an excellent REST API via PostgREST, a developer can already achieve Tier 3 functionality in Igni using `fetch()`. Let the backend providers maintain their REST layers; Igni should remain agnostic and focus purely on parsing JSON over HTTP.

#### **T3: The failure mode of Tier 1 only in v1.0**
If a developer wants to build a cross-device synced notes app using v1.0, Tier 1 alone will fail them. Is this acceptable? **Yes.** Your dissertation is proving the velocity and LLM-authorability of a UI language. Proving local state (Tier 1) validates the language's capacity for persistence. Network sync is a solved architectural problem that requires a backend. Setting the expectation that Igni handles the "glass" and leaves the "cloud" to standard HTTP endpoints is a feature of your constraint management, not a bug.

---

Given this analysis favoring Option B (`shared persisted:`) for Tier 1, how do you envision handling the compilation of this block when multiple `.igni` files declare their own `shared persisted:` sections—should they merge silently like the standard `shared:` block, or should persistence force a single-file declaration rule to prevent silent disk-key collisions?
