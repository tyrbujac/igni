# Stage 2 Critique: v0.21 Design Notes 126 + 121

## Q1 — Strongest case AGAINST Option A (wrapper-builtin `persist()`)

The principled architectural argument against A is **semantic-category overloading at the wrapper-builtin slot**. Three instances do not "form a class" if the class is defined only by syntactic shape. Look at what `fetch()`, `spring()`, and `persist()` actually do:

- `fetch(url)` — produces an **async surface** with loading/error/value lifecycle. Reactive on argument change. Network I/O.
- `spring(target)` — produces a **read-only animated mirror** of a value. Reactive interpolation. Pure compute.
- `persist(initial)` — produces a **durable identity** keyed to disk. Not reactive on argument (the argument is *initial only*, evaluated once). Disk I/O.

These are three different semantic categories: async-effect, animation-derivative, durable-identity. The syntactic shape `name(arg)` returning "a reactive surface" papers over the fact that **the argument means something fundamentally different in each case**. In `fetch()` the argument is a live dependency; in `spring()` it's a live dependency; in `persist()` it's a one-shot initial value that is *ignored on every run after the first*. That last property is genuine magic — "if something happens at runtime, the cause should be visible in source" is violated because `persist("system")` evaluated on app start #2 returns the disk value, not `"system"`, and nothing in the source distinguishes "this argument is reactive" from "this argument is initial-only."

LLM-learnability angle: a model that has internalised `fetch()` and `spring()` as "wrapper takes live value, returns reactive view" will write `persist(theme_from_server)` expecting it to track. It won't. That's a zero-shot guess-wrong, which is exactly the failure mode the spec-budget rule is designed to prevent.

Option B (`shared persisted:`) handles this honestly: the *block* declares the durability semantic, and the right-hand side is plainly an initial value (same shape as `shared:`'s existing initial-value semantic — which is also one-shot). One way to read "what's the lifetime of this value" is to look at the block header. No wrapper-shape lying about reactivity.

The "one way to do everything" charge against B is weaker than the design note implies: `shared:` and `shared persisted:` aren't two ways to do the same thing — they're two lifetimes for shared state, exactly mirroring volatile-vs-durable. That's a *distinction*, not an *alternative*.

**Verdict: FLIP to B.** The wrapper-overload concern is real and load-bearing. The argument-isn't-reactive-but-looks-like-it-is property of `persist()` is the disqualifier — it breaks the wrapper-builtin contract that the design note claims it's joining. C (sub-block `persist:` parallel to `shared:`) is worse than B because it loses the "persistence is a flavour of shared" semantic and creates a third top-level state block.

## Q2 — Q4 silent-merge + Q5 cross-wrapper rejection

**Q4 silent-merge is wrong, and the design note half-knows it.** The note flags "disk-key-collision risk is real but rare" — but rarity isn't the axis. The axis is *durability of failure*. Plain `shared:` last-declaration-wins is a bug you fix by editing source; the bad value evaporates on next run. `persist()` last-declaration-wins is a bug where **the loser's value is now durably written to disk under a key the winner controls**, and removing the conflicting declaration *does not restore the winner's intended value* — the disk value persists. Worse: in development, hot-reload + collision can write a junk value to disk that survives full uninstall on some platforms (depending on backing store).

This is the single best argument for option (b) — single-file declaration forced for `persist()` specifically — or at minimum a parse-time warning on cross-file persisted-key collision. Silent-merge inherits a convention from a context where the convention's failure mode was reversible. It isn't here. **Flip Q4 to (b) or (c).**

**Q5 cross-wrapper rejections are correct in shape but under-specified.** The three examples cover wrapper-inside-wrapper and value-position misuse. They miss two categories the panel should add:

1. **Non-deterministic initial values:** `persist(now())`, `persist(uuid())`, `persist(random())`. These parse fine but are nonsense — the argument is evaluated once on first run and then ignored forever, so `now()` captures install time, not "now." This is exactly the magic-argument problem from Q1. Either parse-time reject calls to known-non-deterministic builtins, or (better) require `persist()` arguments to be literal-or-const-expression. The error message: *"`persist()` evaluates its argument only on first run; `now()` here will capture install time, not current time. Use a literal initial, then assign in an `on tap:` or `on mount:` handler."*

2. **Non-serialisable initial values:** `persist(SomeComponent)`, `persist(some_closure)`. The note mentions JSON-serialisable in passing but doesn't list it as a parse-time rejection. It should be — type-checkable at parse, much better error than runtime serialisation failure on first write.

The cross-pointing error-message structure (name the problem, name the wrappers' contracts, name the workaround) is right. Extend it to these two categories.

## Q3 — Strongest case AGAINST Shape A (latest-URL-wins guard)

Shape A's cleanest failure isn't bandwidth — it's the **dispose-during-flight + setState-after-unmount** class of bug. The URL guard checks "is this URL still current"; it does not check "does the screen still exist." A user navigates away from a search screen mid-flight; the fetch completes; the URL still matches `_lastXUrl` (nobody reassigned it, the screen just unmounted); the completion handler calls into a disposed reactive surface. In Flutter's substrate this throws on setState-after-dispose; in Igni's reactive model it's silent corruption of a no-longer-displayed scope, possibly leaking the captured closure's references.

Shape A doesn't prevent this because the URL guard isn't a liveness guard. Shape B's `client.close()` *does* — dispose calls close, the in-flight await throws ClientException, the handler short-circuits before touching state. That's a categorical bug Shape A allows and Shape B prevents.

On bandwidth: the note correctly observes that input-bind-to-URL is compile-time rejected, so the remaining surfaces are slider drag, dropdown chains, and programmatic shared-state churn. Slider drag is the bad case — a user dragging a range slider bound to a fetch URL fires N requests/sec for the duration of the drag, all but the last wasted under Shape A. On cellular this is user-visible (data, battery). Shape B reduces this to roughly one in-flight at a time.

The "semantic muddiness" con for B (cancelled vs errored) is overstated — Igni already needs to distinguish these for any fetch surface that exposes error state, and the runtime can map cancellation to a dropped response (no error surfaced) trivially because cancellation is internal-only.

The strongest argument for **C-only** (counter without URL guard): URL identity is a proxy for "is this the response I want," and it's a leaky proxy. Counter is the actual question. Shape A's URL check is a special case of Shape C's counter check; if you're going to ship one, ship the more general one.

**Verdict: FLIP to B (with C's counter as the internal liveness token).** B prevents the dispose-class bug A allows; the counter mechanism from C is the right implementation of B's "is this response still wanted" check (more general than URL equality). Shape A as a fallback adds nothing B+C doesn't provide and costs a code path.

## Q4 — Peer-language survey

**Persistence:**
- **SwiftUI `@AppStorage("key")`** — property-wrapper, explicit key string, type inferred from default. Closest to Igni's draft, but note: the *key is explicit*, not derived from the variable name. This matters for Q4 collision: SwiftUI's collisions are obvious (same string literal) and intentional (cross-screen sharing).
- **Compose `rememberSaveable`** — scoped to composition, not durable across app launches in the persist() sense. Different category.
- **React `useLocalStorage`** — userland hook, takes explicit key, returns `[value, setValue]`. Again: explicit key.
- **Flutter `shared_preferences`** — imperative, explicit string key.

**Load-bearing pattern across persistence survey: explicit key string, not implicit-from-variable-name.** Igni's draft (both A and B) derives the disk key from the variable name. Every peer language makes the key explicit. This is exactly because of the Q4 collision problem — if the key is implicit, refactoring a variable name silently orphans the disk value, and two files declaring the same name silently collide. **The panel should consider `persist("theme_mode", "system")` shape** (explicit key, then initial), which mostly dissolves Q4: collisions become literal-string collisions that grep finds.

**Race-conditions:**
- **SwiftUI `.task(id:)`** — task is bound to a lifecycle and an identity key; identity change cancels and restarts; view dispose cancels. This is **Shape B + an identity token**, exactly the B+C synthesis above.
- **React Query** — query key drives cache + cancellation; concurrent fires share inflight; navigation cancels via AbortController.
- **Compose `LaunchedEffect(key)`** — coroutine cancelled on key change or composition leave.

**Load-bearing pattern across race-conditions survey: cancellation tied to lifecycle, keyed by identity.** Every modern reactive framework has converged on this; nobody ships a URL-guard-at-completion. Shape A is a pattern peer languages tried and moved past. This is independent corroboration of the Q3 flip.

## Q5 — Principled-minority self-prediction

I flipped on both Q1 and Q3, so the case is already made above. But the question asks for the minority objection *if* the panel HOLDs — let me argue the other direction honestly.

**Minority case for Tyr to reverse a HOLD-A consensus on Q1:** the wrapper-builtin "class" is defined by *syntactic surface*, not semantic category. The whole point of three-instances-form-a-class is that LLMs and humans pattern-match on shape. Adding a fourth wrapper with a different argument-semantic (`persist`'s one-shot initial vs `fetch`/`spring`'s live dependency) doesn't extend the class — it forks it. Future wrappers will inherit the ambiguity: is `someBuiltin(x)` reactive on `x` or not? You can't tell from the call site. That's spec-budget regression disguised as spec-budget conservation. The minority moves to B because B keeps the wrapper-builtin class clean (live-dependency-only) and gives durable-identity its own honest syntactic home.

**Minority case for Tyr to reverse a HOLD-A consensus on Q3:** every peer reactive framework cancels on lifecycle. Shipping a URL-guard primitive in 2025 means Igni v1.0 ships with a known dispose-class hazard the panel chose not to fix because the cheaper fix was available. "No magic" cuts here: under Shape A, a fetch fired before navigation completes after navigation and *might or might not* corrupt state depending on whether the URL was reassigned in between. That's runtime behaviour with no source-visible cause. Shape B makes dispose-cancels-fetch a source-readable rule.

**The meta-pattern worth naming:** anti-anchoring on Q1 + Q3 worked on this pair because both leans were defending "minimum spec surface" against "actual semantic correctness." Spec-budget discipline is correct as a *prior*, but it's not a tiebreaker when the cheaper primitive ships a known hazard or a known semantic lie. Both flips here are the same shape: pay one unit of spec budget to remove a category of zero-shot guess-wrong. That's a good trade in a language whose north star includes LLM accuracy.