# v0.21 data-primitives strategic-critique panel — prompt

**Date:** 2026-04-29 (post-v0.20.1 ship). **Method:** chat-mode strategic critique with v0.20.1-cheatsheet attached as system context + 3-question structured framework + HOLD/REFINE/FLIP verdicts per dimension. **Models:** Gemini 3 Flash, Gemini 3.1 Pro, GPT 5.3, Claude Opus 4.7. **Cost:** $0 (web-UI chat-mode). **Wallclock:** ~30 min async.

**Methodology distinction:** This is a *strategic-critique* panel (probes a specific architectural decision with structured H/R/F dimensions), not a *cheatsheet review* (reads the cheatsheet cold across the whole document). First instance of the strategic-critique pattern was the Igni Studio panel (`tests/igni-studio-strategy/`, 2026-04-28). This is the second instance — n=2 establishes the pattern as distinct from the n=5 cheatsheet-review pattern (v0.14.1 / v0.15.0 / v0.17.0 / v0.19.1 / v0.20.1).

**Prompt-text status:** Reconstructed below from response patterns (the dimension labels S1/S2/S3, P1-P6, T1/T2/T3 are visible across all four cell outputs). Tyr authored the actual prompt directly in chat; this file preserves the structure for traceability. The reconstruction is accurate to the question shape and dimension framing, not to the prose style of the original prompt.

---

## Reconstructed prompt

You are reviewing the proposed v0.21 scope for Igni — specifically, the data-primitives surface area. Igni v0.20.1 ships with `fetch()` (HTTP I/O with reactive re-fetch) but no local persistence primitive. The post-v0.20.1 cheatsheet review (`tests/v0.20.1-cheatsheet-review/`) surfaced a Q5 fit-and-limits walls list where persistence ranked 3/4 for notes-shape apps and 4/4 across the project shapes overall. Combined with the v0.16.0 extrapolation panel's `persist(initial)` finding and the Boojy Notes app 2 build window's explicit descope of persistence per `docs/private/116` Decision 2, persistence has n=3 cross-source signal pointing at v0.21 inclusion.

This panel widens the scope question from "what shape should `persist()` take?" to "what tier of data support belongs in v1.0?" because persistence and DB support are the same architectural question, and asking them together produces signal that asking them separately misses.

Constraint context (load-bearing for v1.0 framing):

- Igni is a UI-first language for LLM-authored apps; the dissertation thesis is *constrained UI language is more LLM-authorable than a general-purpose alternative*.
- v1.0 horizon is mid-2026 to late-July 2026.
- v0.20.1 cheatsheet attached as the language-state baseline.
- "One way to do everything" is a load-bearing language invariant.
- Real-app candidates for the v1.0 dissertation eval: notes-shape, dashboard-shape, settings-heavy utility-shape (per `docs/private/110` extrapolation panel + `docs/private/115` Studio + `docs/private/116` Boojy).

Three questions follow. Use HOLD / REFINE / FLIP verdicts per dimension. Anti-anchoring framing: pressure-test the contrarian case explicitly where requested.

---

### QUESTION 1 — Scope boundary: which tier belongs in v1.0?

Four candidate tiers, in scope-expansion order:

- **Tier 0 — `fetch()` only.** Igni v1.0 ships with no persistence primitive. All durable state goes through HTTP to a user-built backend (Supabase, Firebase, custom REST). The dissertation framing scope-cuts cleanly: "Igni is the UI layer; backend is out of scope."
- **Tier 1 — `persist()` for local key-value.** Igni v1.0 adds a persistence primitive for shared state. Settings, drafts, theme preference, small lists. Local-only; no cloud sync, no schemas.
- **Tier 2 — schema-aware local DB.** Beyond Tier 1: declarative `table` or `store` primitives, query syntax, lambda predicates, migration semantics. Schemaful local data.
- **Tier 3 — cloud backend integration.** Beyond Tier 2: vendor-SDK primitives (Supabase / Firebase / PocketBase), auth primitives, realtime subscription primitives.

Evaluate each tier against three dimensions:

- **S1 — v1.0 defensibility.** Does this tier preserve the dissertation's "constrained UI language" thesis, or does it scope-creep toward "app platform"?
- **S2 — LLM-authorability cold.** Can a frontier LLM cold-author this tier's syntax correctly from the cheatsheet? Where does hallucination risk concentrate?
- **S3 — "One way to do everything" match.** Does this tier preserve the language's load-bearing invariant, or introduce alternative paths for the same intent?

**Anti-anchoring on Tier 0.** The cross-source signal (n=3 instruments) pushes toward Tier 1, but pressure-test the contrarian case: what is the strongest argument for shipping nothing new? Where might Tier 0 be defensible *despite* the signal? Consider: is the signal reading production-app demand through a research-prototype lens that the dissertation framing doesn't actually require?

Recommend a tier for v1.0 with explicit reasoning across S1/S2/S3.

---

### QUESTION 2 — `persist()` shape (conditional on Tier 1 landing in v1.0)

If Tier 1 is the v1.0 answer, how should `persist()` be authored? Three candidate shapes:

- **Option A — wrapper builtin.** `shared: theme_mode = persist("system")`. Persistence is an attribute of value declaration; no new block; consistent with `fetch()` and `spring()` wrapper-builtin pattern.
- **Option B — `shared persisted:` annotated sub-block.** A modifier-keyword on the existing `shared:` block. Persistence is a sub-flavour of cross-screen state.
- **Option C — top-level `persist:` block.** A dedicated block parallel to `shared:`. Persistence is its own namespace, accessed as `persist.X`.

Evaluate each option against six dimensions:

- **P1 — LLM-authorability cold.** Which shape produces the cleanest cold authorship? Where does hallucination concentrate per shape?
- **P2 — "One way to do everything" match.** Does the shape preserve a single canonical path for cross-screen state, or does it introduce alternative authoring paths?
- **P3 — Type coverage.** What types can be persisted? Where is the boundary (functions, fetch results, recursive objects)?
- **P4 — Race conditions and write semantics.** When does the disk get hit? Debounced or immediate? How does this compose with v0.20.1's deferred reactive-fetch race story (`docs/private/121`)?
- **P5 — Failure modes.** Read corruption / type mismatch / quota exceeded — how does the language degrade?
- **P6 — Peer-language priors.** Which existing primitives (localStorage / AsyncStorage / SwiftData / Compose DataStore / etc.) help LLMs reach for the right shape, and which mislead?

**Anti-anchoring on Option A.** Pressure-test the case AGAINST the wrapper shape: where might `persist()` create wrapper-confusion (`persist(fetch(...))`, nested usage, semantic-category drift from `fetch()`/`spring()`)? Where does the wrapper-builtin pattern start to break down at the fourth instance?

Recommend a shape with explicit reasoning across P1-P6.

---

### QUESTION 3 — v1.x trajectory: what comes after Tier 1?

Three sub-questions:

- **T1 — Is Tier 2 (schema-aware DB) a natural extension or scope creep?** Does declarative local DB belong in v1.x at all, or is it a separate research project? If it does ship, what shape preserves Igni's "one way" discipline (lambda predicates vs SQL `where`; `store` vs `table`)?
- **T2 — Tier 3 (cloud backend integration) — first-class or `fetch()` forever?** Should Igni grow vendor-SDK primitives (Supabase / Firebase) at any point, or does HTTP via `fetch()` remain the universal backend boundary?
- **T3 — What apps does Tier-1-only fail to deliver in v1.0?** A notes app with cross-device sync — is local-only persistence acceptable, or a v1.0-blocking gap? Where is the boundary between "language failure" and "backend boundary"?

Document the v1.0+ trajectory before v1.0 ships. The design choices that look local to v1.0 actually constrain v1.x's space.

---

### Output format

For each question, structure the response as:

1. Per-dimension HOLD/REFINE/FLIP verdicts with one-paragraph reasoning each.
2. Anti-anchoring case explicitly addressed where requested.
3. Recommendation with reasoning grounded in the dimensional analysis.

Prose-heavy is fine. Tables welcome but not required. Be specific about *why* a verdict lands where it does — the architectural force behind a HOLD or FLIP is more important than the label.
