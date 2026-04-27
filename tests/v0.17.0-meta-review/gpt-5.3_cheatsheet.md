---
model_label: gpt 5.3
input_tier: cheatsheet
input_path: spec/v0.17.0-cheatsheet.md
date: 2026-04-27
---

Short version: **Igni is unusually coherent**. It’s opinionated in ways most UI DSLs avoid, and that’s its biggest strength *and* biggest risk.

My overall take: **strong as a constrained product DSL, weaker as a general app language**.

## Scores (with definitions)

---

## 1. Readability — **“How quickly can the intended reader reconstruct UI intent from source?”**

This is not “can a compiler parse it?” or “is it concise?”
It’s: *does the source map cleanly to the mental model of the UI?*

### Score: **9/10**

### Anchor:

* Flutter: 6.5/10
* SwiftUI: 8/10
* Jetpack Compose: 7.5/10
* React / JSX: 7/10
* HTML + CSS: 5/10 (split-brain cost)

Why Igni scores high:

### Extremely strong choices:

**1. Single obvious way**
That matters massively.

No imports.
No component boilerplate.
No state wrapper ceremony.

That removes noise.

Compare:

Flutter:

```dart
class Todo extends StatefulWidget ...
```

Igni:

```igni
screen Todo:
```

That’s a huge readability win.

---

**2. Layout syntax reads like structure**

```igni
layout vertical:
```

is more legible than:

SwiftUI:

```swift
VStack
```

or Compose:

```kotlin
Column
```

because it is semantically explicit.

---

**3. Event syntax is natural**

```igni
on tap:
```

is better than:

```dart
onPressed:
```

or:

```jsx
onClick=
```

for non-programmer-adjacent readers.

---

### Where readability drops:

**Reactive derivation via functions is non-obvious**

This:

```igni
total():
  return count * price
```

instead of:

```igni
total = count * price
```

will surprise people.

That’s a semantic trap.

---

**Mutation-via-replacement is conceptually expensive**

This:

```igni
replace(items, target, {...})
```

is clean but mentally heavier than mutable fields.

---

Verdict:

For designer-engineers, this is probably clearer than everything except the best subset of SwiftUI.

---

## 2. LLM accuracy — **“How likely is a strong model to write valid, idiomatic Igni zero-shot from this cheat sheet?”**

Not “can it imitate syntax.”

Can it write correct *reactive* Igni.

### Score: **9.5/10**

### Anchor:

Flutter: 7/10
SwiftUI: 8/10

Igni is easier.

Why:

---

### Grammar entropy is very low

No:

* imports
* types everywhere
* constructors
* widget wrappers
* modifiers chains

Huge win.

---

### Semantic rules are explicit

Especially:

* reassignment triggers reactivity
* top-level runs once
* derived state via functions
* shared state explicit

That gives models stable behaviour.

---

### Event model is constrained

```igni
on tap:
```

instead of dozens of callback styles.

---

Why not 10:

The reactive model has hidden semantic sharp edges.

Models will often accidentally write:

```igni
total = count * price
```

instead of function-derived state.

That bug is subtle.

---

## 3. Speed — **developer iteration speed**

(important to define)

Not runtime.

Not compile speed.

How fast a human ships UI.

### Score: **9/10**

### Anchor:

Flutter hot reload: 8
SwiftUI previews: 8.5
HTML/CSS live reload: 7

Why high:

Very low ceremony.

This:

```igni
screen X:
```

gets you productive immediately.

---

What helps:

* lexical reactivity
* no widget lifecycle complexity
* no controller management

That’s a huge speed multiplier.

---

Why not higher:

No evidence yet of:

* IDE tooling
* autocomplete
* refactors
* inspector tooling

Those determine real iteration speed.

---

## Runtime speed — separate score

### Score: **7/10 (estimated)**

Depends on generated Flutter quality.

Potential issues:

Whole-screen re-evaluation on assignment.

That’s SwiftUI-like, but implementation matters.

If diffing is coarse, performance suffers.

---

## Compile speed — separate score

### Score: **9/10 (estimated)**

Grammar is simple.

AST should be lightweight.

Build pipeline depends mostly on Flutter compilation.

---

## 4. Cost

Multiple interpretations matter.

---

## Token cost (LLM generation)

**Definition:** output tokens required to express intent.

### Score: **9.5/10**

Anchor:
Flutter: 5
SwiftUI: 7
JSXeneration.

---

## Cognitive cost (human)

**Definition:** mental effort to understand/modify.

### Score: **8.5/10**

Low, but:

Reactive derivation rule is unusual.

---

## Runtime/hosting cost

**Definition:** app weight / execution overhead.

### Score: **6.5/10**

Because backend is still Flutter (presumably).

Not bad, but not special.

---

## 5. Testing — **“How testable is the model, and what should ship?”**

### Current score: **5/10**

### Potential v1 score: **9/10**

This is underdefined.

Needs:

---

### Snapshot tests

```igni
test "Todo empty":
  render Todo
  expect "No tasks yet"
```

Should exist.

Mandatory.

---

### Event simulation

```igni
tap "Add"
type "Buy milk"
```

Must exist.

---

### State assertions

```igni
expect items.length is 1
```

Needed.

---

### Async mocks

Mock `fetch()`.

Critical.

---

### Timer control

Mock `every`.

Critical.

---

Without these, v1 is weak.

---

## 6. Debuggability — **“Can developers explain why UI looks the way it does?”**

### Score: **6/10**

Big concern.

Lexical reactivity is elegant but opaque.

Questions:

Why did this rerender?

What variable caused it?

What dependency graph exists?

What function transitively subscribed?

Need tooling.

Compare:
React Developer Tools set a high bar.

---

## 7. Error quality — **“How actionable are failures?”**

### Spec score: **8/10**

### Actual unknown

Spec suggests strong static errors.

That’s excellent.

Especially:

* event payload mismatch
* invalid shared input binding
* duplicate shared names

Good signs.

This matters more than people think.

---

## 8. Type system ergonomics

### Score: **7/10**

Inference-first is right.

But object typing looks loose.

Potential weakness:

```igni
items = [{text: draft}]
```

What guarantees shape consistency?

Need stronger object typing story.

---

## 9. Extensibility — **“Can this grow without collapsing under special cases?”**

### Score: **6/10**

Big risk.

Current beauty comes from compression.

Every new feature threatens grammar purity.

Especially:

* animations
* gestures
* forms
* navigation stacks
* platform APIs
* persistence

SwiftUI got messy here.

Igni will too unless disciplined.

---

# Biggest pre-v1 concerns

## 1. Derived state semantics are dangerous

This is the biggest one.

This:

```igni
total = count * price
```

being non-reactive is unintuitive.

It violates expectations from:

* React
* Vue.js
* Svelte
* SolidJS

I’d strongly consider:

```igni
computed total = count * price
```

or equivalent.

---

## 2. Whole-screen reevaluation must be observable

Need tooling like:

“screen rerendered because `draft` changed”

Without this, debugging becomes mystical.

---

## 3. Async cancellation model is underspecified

What happens here?

```igni
query = "a"
query = "ab"
query = "abc"
```

Do old fetches cancel?

Race conditions?

Need clear semantics.

---

## 4. Navigation model is too thin

Only:

```igni
navigate to
navigate back
```

is fine for demos.

Not enough for real apps.

Need:

* replace
* reset stack
* modal
* result passing
* deep links

---

## 5. No explicit effects model

Where do side effects live besides events and `every`?

Missing equivalent of lifecycle hooks/effects.

That will hurt.

---

## 6. Local persistence missing

Need first-class:

* storage
* secure storage
* cache

Without boilerplate.

---

## 7. Accessibility needs to be first-class

This should not be bolted on.

Need:

* labels
* semantic roles
* focus order
* keyboard nav

Built in.

---

# Things I’d celebrate

## 1. Shared state prefix is excellent

```igni
shared.cart
```

Very strong.

Visible coupling.

Good design.

---

## 2. No imports is bold and right

For this kind of language, imports are mostly noise.

Good call.

---

## 3. Immutable-by-default UI data flow

Strong long-term choice.

Less chaos.

---

## 4. Explicit event channels in components

```igni
emit submit text
```

Very clean.

Better than callback props.

---

## 5. Theme centralisation

Banning inline hex is unpopular but correct.

Good design-system discipline.

---

# Overall

As a **UI DSL**:

**8.8/10**

As a **language design**:

**8/10**

As a **product for LLM-assisted app generation**:

**9.5/10**

Biggest compliment:

Igni feels like someone actually removed things instead of just inventing syntax.

Biggest risk:

Every successful app framework eventually accumulates escape hatches.
Igni’s quality depends on resisting that entropy.
