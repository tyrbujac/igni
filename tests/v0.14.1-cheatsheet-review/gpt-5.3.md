Here's a straight editorial read, split by your three questions.

## Q1 — What's strongest?

### 1. The opening progression (Hello World → Complete App → Reactivity)

This is the strongest teaching sequence.

Why it works:

* Minimal example establishes the shape of the language immediately.
* Todo app compresses most primitives into one readable unit.
* The "lexical reactivity" explanation lands right after the example that demonstrates it.

That ordering is excellent.

Especially strong:

> reassigning `items` or `draft` inside `add()` re-runs the screen body

That sentence explains the runtime model in one pass.

That's the core of the language, and you surface it early.

---

### 2. State model explanation ("Why doesn't state reset?")

Probably the clearest semantic explanation in the document.

This passage:

> think "starts at", not "resets to"

is doing real pedagogical work.

It solves the most common misunderstanding in reactive UI systems before it happens.

Good:

* distinguishes initialisation from re-evaluation
* explains persistence model
* ties back into screen lifecycle

Very clean.

---

### 3. Input binding model

The `bind:` explanation is excellent.

Particularly:

> The bound variable is already updated when the handler fires.

That removes ambiguity immediately.

Good teaching pattern:

* primitive table
* binding rule
* event rule
* edge case (`input` exception for shared state)

That ordering is right.

---

### 4. Lists section

Surprisingly crisp for mutable-by-reassignment semantics.

Best part:

```igni
{target with done: not target.done}
```

That teaches immutable updates compactly.

Also strong:

> List elements cannot be mutated in place.

Very important rule, clearly isolated.

---

### 5. Recurrence section

Very strong because it explains lifecycle, not just syntax.

Especially valuable:

> Missed ticks are NOT replayed

That's exactly the kind of runtime detail people need.

The wall-clock timer section is especially good because it teaches the right mental model, not just API usage.

---

### 6. Wrapper components / `body`

Clear, tiny, practical.

This:

> body renders exactly one widget

is concrete enough that I know exactly what to expect.

Good constraint.

---

## Q2 — What's weakest?

## 1. "Reacting to users" is too long and overloaded

This section is carrying too much conceptual weight.

It currently contains:

* reactivity model
* variable declaration
* operators
* field access
* indexing
* conditionals
* boolean logic

That's too much under one heading.

Problem:
the most important idea (reactivity) gets diluted by syntax trivia.

Fix:
split into:

* State & Reactivity
* Values & Expressions
* Conditionals

That would tighten it significantly.

---

## 2. "Getting input" is bloated

This section is structurally good but over-explained.

Biggest offender:

> Every input-capable primitive has the same three building blocks...

This is explanatory overhead before the examples.

You could delete it.

The table already teaches that.

Same problem here:

> Read the primitives table first, then the binding rule, then the events.

That's instructional scaffolding the document doesn't need.

Cut it.

---

## 3. Shared state binding exception is too buried

This is important:

> `input` is the exception

But it's hidden inside dense prose.

This deserves a boxed rule.

Because this is the first place I'd make a mistake.

Better:

**Rule: `input` cannot bind directly to `shared.X`.**

Then explain why.

---

## 4. Lists API density is too high

This block:

```igni
match = find(...)
names = map(...)
done = filter(...)
by_name = sorted(...)
rev = reversed(...)
n = length(...)
qty = count(...)
```

is dense and mechanically repetitive.

Feels like API reference dumped into tutorial flow.

Fix:
keep 3–4 in cheat sheet
move rest into reference appendix.

---

## 5. Styling section is weakly structured

Feels tacked on.

Problems:

* colours
* surfaces
* spacing
* text styles
* theme fonts

These are separate conceptual domains.

Current flow feels arbitrary.

Especially abrupt:

> `card` is a background-only token

This is important but buried.

Split into:

* Colours
* Spacing tokens
* Typography
* Theme

---

## 6. Rules section at end is partly duplicate

A lot of it restates earlier sections.

Example:

> Cross-screen function calls are NOT allowed.

Already taught.

End-rule sections should consolidate, not repeat.

Make it only invariants that aren't already explicit.

---

## 7. The Todo example does slightly too much

This line:

```igni
items = items + [{text: draft}]
```

teaches:

* list append
* object literals
* assignment reactivity

all at once.

It works, but it's dense for the first real example.

Not broken — just high cognitive load.

---

## Q3 — Where is there genuine semantic uncertainty?

This is the important one.

These are places where the spec genuinely does not fully pin behaviour down.

---

## 1. Variable initialisation ordering

What is legal?

```igni
count = total + 1
total = 5
```

Can locals reference later locals?

Not specified.

Need:
top-down evaluation semantics.

---

## 2. Re-evaluation dependency tracking

You say:

> whenever any variable it references is reassigned

What counts as "references"?

Example:

```igni
a = 1
b = a + 1
```

If `a` changes:
does screen rerun because `b` references `a`?
or only if the render tree references `a`?

Dependency graph semantics are unclear.

---

## 3. Function-triggered dependencies

Example:

```igni
label total()

total():
  return count * price
```

Does reactivity track `count` and `price` through function calls?

Or only direct lexical references?

This matters a lot.

Unspecified.

---

## 4. Async fetch identity semantics

```igni
user = fetch("/api/user")
```

On re-evaluation:
does this reissue?

Or memoise by callsite?

This is critical.

You imply stability but never specify it.

---

## 5. `locate()` stability

Same issue.

Does:

```igni
here = locate()
```

request once per mount?
once per evaluation?
cached globally?

Not pinned down.

---

## 6. Event ordering when state changes inside event handlers

Example:

```igni
button "Tap", on tap:
  count = count + 1
  count = count + 1
```

One rerender or two?

Batching semantics unclear.

---

## 7. Multiple variable reassignments

Related:

```igni
a = 1
b = 2
```

during one function call.

One render pass or per assignment?

Important runtime contract.

Unspecified.

---

## 8. `on change:` feedback loops

Example:

```igni
input bind: email, on change: email = upper(email)
```

Allowed?

If yes:
does it recurse?

Need explicit loop prevention semantics.

---

## 9. Equality semantics

You say:

> `is` checks equality

But later:

> Object identity is reference-based

So:

```igni
{name: "a"} is {name: "a"}
```

false?

Probably.

But this should be explicit.

Right now equality semantics are split across sections.

---

## 10. `without(items, target)` multiplicity

If target appears three times:
remove first?
all?
exact instance only?

Not specified.

---

## 11. `replace(items, old, new)` multiplicity

Same issue.

First match?
all matches?

Need exact semantics.

---

## 12. Navigation state persistence

If you:

```igni
navigate to Profile user
navigate back
```

does previous screen retain state?

You imply yes for mounted screens, but stack semantics aren't explicit.

Need lifecycle rules.

---

## 13. Component recomputation semantics

Do components independently react?

Or fully re-execute as part of parent rerender?

Likely parent-driven, but not stated.

---

## 14. Max nesting depth counting

You say:

> conditionals and loops don't

Do nested layouts inside conditionals count?

Probably yes.

But the counting algorithm isn't precise enough.

---

## 15. Async race semantics

Example:

```igni
user = fetch("/a")
user = fetch("/b")
```

If `/a` resolves last, can it overwrite `/b`?

No race semantics defined.

Important.

---

## Overall verdict

Strongest trait: the runtime model is unusually coherent. The language has a real philosophy, and the docs communicate it.

Weakest trait: tutorial and reference modes are mixed together too often.

Biggest improvement:
separate **learn mode** from **reference mode**.

Right now the docs oscillate between:
"here's how to think"
and
"here's every legal token."

That hurts readability more than any sentence-level issue.

If you fix only one thing:
tighten the conceptual sections and isolate the semantic guarantees into explicit runtime rules. That would materially improve the spec.
