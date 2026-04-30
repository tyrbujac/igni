## Q1 — Strongest case AGAINST Option A `persist(initial)`

### Architectural case for B: persistence is a storage class, not a value wrapper

The strongest principled objection to Option A is that `persist()` is not really like `fetch()` or `spring()`.

- `fetch()` creates an external async value surface.
- `spring()` creates an animated reactive mirror.
- `persist()` changes the storage duration and durability semantics of a shared variable.

That is a materially different category. `persist()` is not “a value-producing function” in the ordinary sense; it is a declaration attribute disguised as an expression.

That matters for Igni because Option A creates a pseudo-function with special placement rules:

```igni
shared:
  theme_mode = persist("system")
```

But then the language must say:

- `persist()` is only valid in `shared:`
- `persist()` is only valid at top-level declaration position
- `persist()` cannot be nested
- `persist(fetch(...))` is illegal
- `[persist(x)]` is illegal
- likely `persist(now())` is illegal
- likely `persist(make_default())` is illegal

That is a lot of “function-looking thing that is not really a function” special pleading.

Option B:

```igni
shared persisted:
  theme_mode = "system"
  cart = []
```

makes the semantic category explicit: these are shared variables with durable storage.

### “No magic” concern

With Option A, the durable behavior is hidden in the RHS initializer, but normal reads/writes look identical:

```igni
shared.theme_mode = "dark"
```

That is mostly good for simplicity, but it also means the durability of the assignment is not visible at the assignment site. Option B does not fix that completely, but it does make the declaration visually honest: the variable lives in a persisted state region.

More importantly, Option A makes the initializer carry two meanings:

```igni
theme_mode = persist("system")
```

This looks like “assign the return value of a function call,” but actually means:

> declare a disk-backed shared key named `theme_mode`, defaulting to `"system"` only if no durable value exists.

That is not normal expression semantics. Option B avoids this mismatch.

### “One way to do everything” concern

The pro-A argument says wrapper builtins are the one way:

```igni
fetch(...)
spring(...)
persist(...)
```

But the anti-A argument is that this is an over-generalized surface similarity. These three are not one semantic family unless Igni defines a very broad and abstract category like “reactive surface constructors.”

If that family becomes:

- async external source
- animation mirror
- durable local storage

then the wrapper category may become too broad to teach reliably. The syntax looks unified, but the rejection matrix grows:

| Wrapper | Can be assigned? | Can be nested? | Has lifecycle? | Has disk effects? | Can error? |
|---|---:|---:|---:|---:|---:|
| `fetch()` | no / surface-specific | no? | yes | no | yes |
| `spring()` | no / mirror | no? | yes | no | no |
| `persist()` | yes | no | app lifetime | yes | maybe |

That may be worse for LLM accuracy than one explicit block form.

### Option B handles collision policy better

Persistent variables have durable keys. A collision is not merely a compile-time namespace issue; it can corrupt or reinterpret disk state.

Option B gives Igni a natural place to impose stricter persistence rules:

```igni
shared persisted:
  theme_mode = "system"
```

The compiler can say: persisted declarations are a distinct declaration class with stricter uniqueness rules. Option A can also do this, but it is less visually obvious because it piggybacks on ordinary `shared:` merging.

### Option B future-proofs better without adding expression complexity

Even if Tier 2 is deferred, persistence may eventually need:

- explicit key names
- reset behavior
- versioning
- app namespace control
- migration hooks
- encryption policy
- test seeding

Option A risks growing into:

```igni
theme_mode = persist("system", key: "theme_mode", version: 2, migrate: ...)
```

That would be very un-Igni.

Option B has a cleaner future expansion path if expansion is ever needed:

```igni
shared persisted:
  theme_mode = "system"
```

or later, if absolutely necessary:

```igni
shared persisted:
  theme_mode = "system"
  cart = []
```

The declaration region can carry policy without making every persisted value look like a configurable function call.

### Strongest verdict against A

The strongest principled verdict would be: **FLIP to B**.

Reason: `persist()` is not a runtime value wrapper; it is a storage-class declaration. Treating it as a wrapper preserves superficial syntax consistency while increasing semantic exception load.

### My actual verdict

**REFINE A, not full flip.**

I think A can survive if it is specified narrowly and honestly:

1. `persist()` is a declaration-position wrapper only.
2. It is valid only in `shared:`.
3. Its argument must be a JSON-serialisable literal default.
4. It cannot compose with any wrapper or function call.
5. Duplicate persisted keys are compile-time errors.

If Igni adopts those refinements, A remains acceptable because it preserves the existing `shared.X` access model and avoids creating a second shared-state block flavour. But the design note should explicitly admit that `persist()` is not a general expression function.

---

## Q2 — Collision rule and cross-wrapper rejection

### Q4 silent merge: I think this is wrong for `persist()`

Silent merge is acceptable for volatile `shared:` because the failure mode is local and temporary. If two files declare the same volatile shared name and the last one wins, the app may behave incorrectly, but the bad state disappears on restart or rebuild.

For `persist()`, the failure mode is worse:

```igni
// file A
shared:
  theme_mode = persist("system")

// file B
shared:
  theme_mode = persist("dark")
```

If file B wins, the app may write `"dark"` to disk. Then later file B is removed. But the durable value may remain `"dark"` and continue affecting the app. The bug survives after the source conflict is gone.

That violates operator honesty. The runtime state no longer corresponds cleanly to the visible source.

So I would change Q4 to:

> Non-conflicting persisted declarations may merge across files. Conflicting persisted declarations are compile-time errors.

No new syntax required. Just a stricter rule for durable keys.

Recommended rule:

```text
A persisted shared name may be declared exactly once per app.
```

If Igni later supports explicit keys, then the rule should be:

```text
A persisted disk key may be declared exactly once per app.
```

### Q5 parse-time rejection: correct direction, but incomplete

The three concrete rejections are good:

1. `persist(fetch(...))`
2. `persist(spring(...))`
3. `[persist(x)]`

But the rule should generalize beyond wrapper composition.

The core rule should be:

> `persist()` accepts only JSON-serialisable literal defaults: string, number, boolean, null, lists/maps composed only of the same.

Then these are also rejected:

```igni
shared:
  created_at = persist(now())
  user = persist(load_user())
  default_theme = persist(shared.theme_mode)
  cart = persist(make_cart())
```

Because dynamic initializers create ambiguity:

- Does `now()` run every app start?
- Only on first install?
- After clearing storage?
- During hot reload?
- Before or after other shared state initializes?

That is exactly the kind of hidden runtime behavior Igni should avoid.

Suggested generic error:

```text
persist() requires a JSON literal default. Function calls, wrapper calls, variable references, and runtime values are not allowed. To persist dynamic data, declare a literal default and assign the value later from an explicit event handler.
```

Then the existing cross-wrapper messages can be specialized versions of that broader rule.

Example:

```igni
shared:
  user = persist(null)

screen Profile:
  button "Save", on tap: shared.user = fetched_user
```

That keeps persistence explicit and avoids “magic first-run computation.”

---

## Q3 — Strongest case AGAINST Shape A latest-URL-wins

### URL identity is the wrong primitive

The main principled objection to Shape A is that the invariant Igni actually needs is not:

> only commit if the URL is still current

It is:

> only the latest request generation may commit

URL equality is an implementation detail. It works for the simplest GET case, but it does not represent the full identity of a fetch.

These can all be different requests with the same URL:

- same URL, different body
- same URL, different method
- same URL, different headers
- same URL, different auth token
- same URL, explicit refresh
- same URL, different dependency that affects parsing or local handling

If Igni needs Shape C as a fallback, that is evidence that Shape A is not the right abstraction. The language should not have two race-resolution concepts: URL guard for common cases, counter guard for edge cases.

Use the counter/token as the one rule.

### Bandwidth waste is not the main problem

For dropdowns, bandwidth waste is probably tolerable. For sliders, it can be bad. A slider-driven fetch can fire dozens of requests quickly. Even if text-input-to-URL is rejected, sliders and programmatic shared-state changes are still enough to create bursts.

But the deeper problem is not bandwidth. It is lifecycle correctness.

Shape A allows old requests to keep running. If the user navigates away, the latest URL may still match at completion time. Without a separate mounted/dispose guard, Shape A can still try to commit into a dead screen.

That creates the classic Flutter failure:

```text
setState() called after dispose()
```

A URL guard does not solve that. Cancellation or generation invalidation on dispose does.

### Shape B prevents a real class of bugs, not just wasted bandwidth

If fetches are lifecycle-scoped and canceled on dependency change or screen disposal, then Igni prevents:

- stale responses committing after navigation
- dead-screen state writes
- unnecessary network pressure
- long-running requests leaking beyond their UI owner
- server/API quota hammering during rapid reactive changes

However, Shape B alone is not sufficient. HTTP cancellation is not perfectly reliable across platforms, especially Flutter Web. A request may still complete even after the client attempts to close it.

So the robust peer-language pattern is:

1. cancel old work when possible
2. also guard commits with a generation token / mounted check

### Stronger alternative: C-only as the semantic rule

I would flip the core semantics from A to C:

```text
Each fetch fire increments a generation token.
A response may commit only if its captured generation is still current.
On screen dispose, invalidate the generation.
```

This handles:

- changed URL
- same URL with changed body
- explicit refresh
- changed headers/auth
- navigation/dispose
- non-URL dependencies

Then cancellation can be added as an implementation optimization later:

```text
The runtime may cancel superseded requests, but correctness does not depend on cancellation.
```

### Verdict

**FLIP to C-only as the semantic rule.**

More precisely:

- Use generation-token latest-wins for all `fetch()` re-runs.
- Invalidate the token on screen disposal.
- Optionally close/cancel the previous HTTP client as a runtime optimization.
- Do not use URL equality as the primary correctness check.

This is more “one way to do everything” than Shape A + Shape C fallback.

---

## Q4 — Peer-language survey

### Persistence survey

#### SwiftUI `@AppStorage`

SwiftUI uses declaration-level storage annotation:

```swift
@AppStorage("theme") var theme = "system"
```

Load-bearing pattern:

- persistence is attached at declaration
- usage is normal variable access
- key/default are explicit near declaration
- durability is not expressed at every read/write site

This is closer to Option B philosophically, though syntactically it resembles a wrapper/annotation.

#### Compose Multiplatform `rememberSaveable`

```kotlin
var name by rememberSaveable { mutableStateOf("") }
```

This is more local UI-state restoration than app-level durable persistence. It handles lifecycle recreation, not full local-first durable storage.

Pattern:

- persistence/restoration is declared at state creation
- default is local
- usage is ordinary state access

#### React `useLocalStorage` hooks

```js
const [theme, setTheme] = useLocalStorage("theme", "system")
```

Pattern:

- persistence is a state constructor/hook
- usage goes through ordinary state setter
- explicit key/default
- composability is powerful but error-prone

This is closest to `persist(initial)` as a function-shaped state constructor, but React accepts hook complexity that Igni intentionally avoids.

#### Flutter `shared_preferences`

```dart
final prefs = await SharedPreferences.getInstance();
prefs.setString("theme", "dark");
```

Pattern:

- imperative service
- explicit key-value API
- not reactive by default
- too verbose and too unstructured for Igni’s UI-first model

### Persistence load-bearing pattern

Across peers, the common successful pattern is:

> Persistence is declared at the source of state, not at use sites.

The design notes already capture that. The remaining unresolved question is whether Igni expresses that source-of-state declaration as:

```igni
theme = persist("system")
```

or:

```igni
shared persisted:
  theme = "system"
```

Peer languages slightly favor declaration annotations/block semantics over value-expression semantics, but React hooks provide precedent for function-shaped state constructors.

### Race-condition survey

#### SwiftUI `.task(id:)`

```swift
.task(id: query) {
  await load(query)
}
```

Pattern:

- task is keyed
- old task is canceled when key changes
- task is canceled when view disappears

#### React Query `useQuery`

```js
useQuery(["user", id], fetchUser)
```

Pattern:

- query key, not URL string, defines identity
- stale results are ignored
- cancellation via `AbortSignal` where possible
- cache participates in lifecycle

#### Compose `LaunchedEffect(key)`

```kotlin
LaunchedEffect(query) {
  load(query)
}
```

Pattern:

- coroutine is scoped to composition
- key change cancels previous coroutine
- leaving composition cancels work

### Race-condition load-bearing pattern

Peers converge on:

> key/generation-scoped async work with lifecycle cancellation.

Not merely latest-URL-wins.

The Igni draft has considered the ingredients — URL guard, cancellation, request counter — but the strongest peer-language lesson is that cancellation and generation/lifecycle scoping are part of the same conceptual model. Correctness should not depend on URL equality.

---

## Q5 — Principled-minority self-prediction

I do not fully HOLD the recommended pair.

My positions:

- Q1 persistence: **REFINE A**, do not flip yet.
- Q3 fetch race: **FLIP to C-only as the semantic rule**, with optional cancellation later.

### If Tyr reversed persistence from A to B/C, the principled case would be

The minority case should say:

> `persist()` is not a value wrapper. It is a storage-class declaration. Making it look like a function creates a fake uniformity that increases semantic exceptions and LLM branch risk.

The argument would not be about ergonomics. It would be about preserving Igni’s architectural honesty.

Specific objections:

- `persist()` is only valid in declaration position.
- It cannot compose like an expression.
- Its argument is not a normal runtime expression.
- Its effect is durable and survives source changes.
- It needs stricter uniqueness rules than normal `shared:`.
- Therefore it deserves declaration syntax, not expression syntax.

That is a real Tyr-style reversal case.

### If Tyr reversed race handling from A to C-only/B, the principled case would be

The minority case should say:

> URL equality is an accidental implementation detail. The real invariant is generation ownership: only the newest fetch instance may commit.

That favors C-only.

A stronger B-flavored minority case would say:

> Async work in UI must be lifecycle-scoped. If the screen disappears, the fetch must be canceled or invalidated. Anything else violates “no magic” because invisible dead work can still affect runtime behavior.

But B still needs a generation guard because cancellation is not perfectly reliable. So the cleanest architectural reversal is:

```text
C is the semantic rule.
B is an implementation optimization.
A is unnecessary.
```

That is the strongest principled-minority objection that should exist even if the panel otherwise likes the Stage 1 leans.