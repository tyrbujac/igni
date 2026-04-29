## Executive position

**Recommendation:**

* **v1.0:** ship **Tier 1 only** (local persistence), keep `fetch()` as-is.
* **v1.x:** consider **Tier 2 only if it stays declarative and non-general-purpose**.
* **Never in core:** Tier 3 vendor SDK bindings.

Why:

Igni's core thesis is not "full-stack app platform"; it is **UI-first declarative app construction optimised for cold LLM generation**. That framing strongly tolerates local persistence because persistence is part of UI continuity ("remember state"), but weakly tolerates databases and poorly tolerates vendor SDKs.

The strongest v1.0 boundary is:

> **UI state + durable UI state + external HTTP.**
> Not local relational modelling. Not backend abstraction.

That preserves the language centre of gravity.

---

# QUESTION 1 — Scope boundary

---

# Tier 0 — `fetch()` only

## S1 — v1.0 defensibility

**Holdable, but weak.**

The strongest argument for Tier 0:

A dissertation prototype can credibly say:

> Igni concerns itself with view construction and reactive state only. Persistence belongs to infrastructure.

That keeps the scope surgically narrow.

That argument is academically defensible.

But product-wise, it creates a visible hole:

* settings reset on restart
* drafts disappear
* onboarding state disappears
* theme preference disappears

That makes even toy apps feel unfinished.

That matters because Igni's evaluation surface is experiential.

A UI language that forgets state feels incomplete.

So Tier 0 is defensible academically, but weak strategically.

**Verdict:** **Hold as fallback only.**

---

## S2 — LLM-authorability

**Strong.**

`fetch(url)` is trivial.

Known prior:

* REST
* HTTP
* JSON

LLMs already know it.

No new concepts.

Best possible cold reliability.

**Verdict:** **Hold.**

---

## S3 — one-way discipline

**Strong.**

Single data ingress:

* remote HTTP

Very clean.

No ambiguity.

But overly pure.

The cost of purity is forcing remote infrastructure for local intent.

That violates semantic pro to save dark mode should not imply API design.

**Verdict:** **Refine: too strict.**

---

---

# Tier 1 — `persist()`

## S1 — v1.0 defensibility

**Strongest fit.**

Tier 1 expands "state" into "durable state" without changing Igni's identity.

Still UI-centred.

Not infrastructure-centred.

It solves the exact missing layer between:

* volatile state
* remote data

This is the natural completion of shared state.

Not a new domain.

This matters for dissertation framing:

Tier 1 strengthens the claim that Igni covers **interactive app behaviour**, not merely screen drawing.

That's a meaningful improvement.

Low implementation cost.

High perceived completeness.

Best scope-to-value ratio.

**Verdict:** **Hold.**

---

## S2 — LLM-authorability

**Excellent.**

A single primitive.

Pattern stability:

```igni
shared:
  theme_mode = persist("system")
```

No schema.

No migrations.

No query planning.

Low hallucination surface.

LLMs can infer it immediately.

**Verdict:** **Hold.**

---

## S3 — one-way discipline

**Strong.**

One storage shape:

key-value persistence.

No alternative syntax.

No backend choices.

Minimal leakage.

It preserves Igni's "obvious path".

**Verdict:** **Hold.**

---

---

# Tier 2 — schema-aware local DB

## S1 — v1.0 defensibility

**Flip.**

This is where Igni starts becoming an app platform.

Why:

Persistence is state continuity.

Relational modelling is data architecture.

Different category.

Tier 2 introduces:

* schema lifecycle
* migrations
* indexing
* query semantics
* conflict semantics

That is a major conceptual surface increase.

Way too large for v1.0.

Dissertation risk:

you stop evaluating UI language design and start evaluating storage model design.

That muddies the thesis.

**Verdict:** **Flip out of v1.0.**

---

## S2 — LLM-authorability

**Mixed.**

LLMs can write CRUD.

But schema evolution is where correctness drops.

Likely errors:

* migration mismatch
* predicate ambiguity
* identity confusion

Cold authorability degrades sharply.

**Verdict:** **Refine only if introduced later.**

---

## S3 — one-way discipline

**Weakening.**

The problem:

query syntax bifurcation.

Either:

A) SQL-like
or
B) lambda predicates

If both exist:

discipline breaks.

If only one exists:

power ceiling appears.

This is classic leakage.

**Verdict:** **Refine later, not now.**

---

---

# Tier 3 — cloud backend integration

## S1 — v1.0 defensibility

**Hard flip.**

Vendor bindings are outside Igni's research centre.

Supabase/Firebase support means:

* auth primitives
* subscription primitives
* config primitives
* vendor docs coupling

That's platform engineering.

Not language design.

Bad fit.

**Verdict:** **Flip.**

---

## S2 — LLM-authorability

**Bad long-term.**

Vendor APIs drift.

Training priors age.

SDK shape changes.

Generated code decays.

HTTP stays stable.

Vendor bindings do not.

**Verdict:** **Flip.**

---

## S3 — one-way discipline

**Impossible.**

Which backend?

* Supabase
* Firebase
* PocketBase
* Appwrite

Choosing one creates exclusion.

Supporting many creates pluralism.

Pluralism violates Igni's philosophy.

**Verdict:** **Flip.**

---

---

## Final Tier recommendation

| Tier   |            v1.0 |           v1.x | Never/core |
| ------ | --------------: | -------------: | ---------: |
| Tier 0 | viable fallback |            yes |         no |
| Tier 1 |         **yes** |            yes |         no |
| Tier 2 |              no |          maybe |         no |
| Tier 3 |              no | extension only |    **yes** |

---

# QUESTION 2 — `persist()` shape

My ranking:

**A > B >>> C**

---

# Option A — wrapper builtin

```igni
shared:
  theme_mode = persist("system")
```

---

## P1 — LLM-authorability

**Hold.**

Why it wins:

Persistence is attached to value declaration.

That is where intent lives.

Locality of meaning.

LLM sees:

state + durability together.

That is excellent.

### Anti-anchoring: case against A

Best argument against A:

It hides storage semantics inside expression syntax.

This creates ambiguity:

```igni
x = persist([])
```

Is this:

* constructor?
* wrapper?
* lazy load?
* durable ref?

That ambiguity is real.

Especially for beginners.

Also:

nested usage temptation:

```igni
items = [persist(x)]
```

Needs parser restriction.

So A needs strict placement rules.

But still best overall.

**Verdict:** **Hold with placement restriction.**

Allowed only in top-level `shared:` initialisers.

---

## P2 — one-way discipline

**Strong.**

Persistence is an attribute of state.

Not a separate namespace.

Good fit.

No dual access model.

**Verdict:** **Hold.**

---

## P3 — type coverage

**Refine.**

Support:

* primitives
* lists
* objects

Recursively serialisable.

Reject:

* async values (`fetch`)
* functions
* components
* runtime handles

Good rule:

> persistable = JSON-serialisable graph

Simple.

Predictable.

Deep nesting: fine.

Cycles: reject.

**Verdict:** **Refine to JSON boundary.**

---

## P4 — write semantics

**Strong recommendation: immediate write on reassignment.**

Not suspend.

Not debounce.

Why:

Igni's mental model is assignment-driven.

Persistence should follow assignment.

```igni
theme = "dark"
```

should mean:

* UI updates
* storage writes

same moment.

Consistency.

Debouncing introduces hidden time.

Bad fit.

Implementation detail can batch internally, but semantic contract should be immediate.

Race model:

last assignment wins.

Same as state.

Clean.

**Verdict:** **Hold immediate semantic write.**

---

## P5 — failure modes

Read:

If stored type mismatches initial type:

fallback to initial.

Example:

stored `"abc"` but initial `[]`

Use `[]`.

Write:

If quota/storage fails:

state still updates, persistence silently degrades plus console warning.

Do not block UI.

Corruption:

same fallback rule.

Simple.

**Verdict:** **Hold.**

---

## P6 — peer priors

Best alignment:

localStorage

Helpful prior.

Misleading prior:

SwiftData

because it implies modelling and querying.

That's Tier 2 thinking.

Bad analogy.

---

---

# Option B — annotated block

```igni
shared persisted:
```

---

## P1 — LLM-authorability

**Refine.**

Readable.

Clear.

But introduces block variants.

Igni currently keeps block vocabulary tight.

This adds syntactic branching.

Not ideal.

Better than C.

Worse than A.

---

## P2 — one-way discipline

**Leaks.**

Now two ways to declare shared state:

* `shared:`
* `shared persisted:`

That weakens the single-path model.

Not catastrophic.

But real.

---

## P3 — type coverage

Same as A.

No difference.

---

## P4 — write semantics

Same as A.

No difference.

---

## P5 — failure modes

Same as A.

No difference.

---

## P6 — peer priors

Resembles annotations/attributes.

Closer to Jetpack Compose ecosystem conventions.

Slightly familiar.

But Igni is not annotation-heavy.

Mismatch.

---

---

# Option C — separate top-level block

```igni
persist:
```

---

## P1 — LLM-authorability

**Flip.**

This creates a second state namespace.

Now the model must choose:

* local
* shared
* persist

That's a routing problem.

Cold generation degrades.

---

## P2 — one-way discipline

**Weak.**

Persistence becomes parallel state.

But persistence is not a different kind of state.

It's a durability property.

Wrong abstraction layer.

---

## P3 — type coverage

Same technical capability.

But semantic duplication remains.

---

## P4 — write semantics

Same.

---

## P5 — failure modes

Same.

---

## P6 — peer priors

Looks like config.

Misleading.

Encourages thinking of persistence as isolated storage instead of durable state.

Bad fit.

---

# Recommended `persist()` contract

```igni
shared:
  theme_mode = persist("system")
  drafts = persist([])
```

Rules:

1. only allowed in `shared:` top-level initialisers
2. JSON-serialisable only
3. load-on-app-start
4. write-on-every-reassignment
5. last-write-wins
6. type mismatch → reset to initial
7. corruption → reset to initial

That is enough.

---

# QUESTION 3 — Beyond Tier 1

---

# T1 — Tier 2 local DB

**Natural extension, but dangerous.**

It can exist in v1.x if framed narrowly:

not "database programming"

but:

> structured local collections

That distinction matters.

Good shape:

```igni
store Workouts:
```

not

```igni
table Workouts:
```

because "table" implies SQL mental model.

Query should be lambda-only.

No SQL.

Example:

```igni
recent = query Workouts, where: w => ...
```

That preserves Igni style.

But this is significant enough to be almost its own research phase.

My view:

**v1.2+ at earliest.**

---

# T2 — Tier 3 cloud integration

Core answer:

**fetch() forever.**

That is the correct abstraction.

Why:

HTTP is the universal backend boundary.

Igni stays backend-agnostic.

Supabase already exposes REST.

Firebase can be proxied.

PocketBase exposes HTTP.

No need for first-class vendor semantics.

Strongest long-term move.

---

# T3 — Tier 1-only failure mode

Case:

notes app + sync.

Tier 1 gives local durability.

Sync via `fetch()`.

That is enough.

Yes, more work.

But acceptable.

Because Igni never promised sync infrastructure.

Important distinction:

absence of sync is not a language failure.

It's a backend boundary.

That is legitimate.

Would it limit adoption?

Yes.

Would it invalidate v1.0?

No.

For a research prototype, local-first + HTTP sync is entirely credible.

That is the right trade.

---

## Final strategic map

**v1.0**

* local state
* shared state
* persisted shared state
* fetch

**v1.x**

* maybe structured local collections (non-SQL)

**never in core**

* vendor backend bindings
* auth SDKs
* realtime SDK primitives

That keeps Igni what it is:

> a UI language with durable state

—not a backend framework, not an ORM, not a BaaS abstraction.
