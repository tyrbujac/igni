# GPT 5.3 — v0.19.1 cheatsheet review

*Raw chat-mode output, 2026-04-28. Minor copy-paste artifacts preserved as-is (e.g. "screenslator" appears once where the text should likely read "functions belong to screens" — the chat UI mangled the text mid-sentence).*

---

Here's a straight editorial pass on the spec.

## Q1 — Strongest section (protect this)

### **Reactivity model ("Reacting to users")**

This is the spine of the language.

Why it works:

* **Single mental model**: "reassign → re-evaluate" is the entire runtime model.
* It scales cleanly across:

  * local state
  * shared state
  * async (`fetch`)
  * location (`locate`)
* The distinction between **top-level assignment captures** vs **functions track** is unusually well taught.

This bit is excellent:

```igni
total = count * price   # captures once
```

vs

```igni
total():
  return count * price
```

That teaches the runtime better than most reactive frameworks teach theirs.

### What it protects

It protects Igni from:

* state API creep (`setState`, signals, refs, stores)
* lifecycle hook sprawl
* derived-state confusion
* accidental hidden reactivity

This section defines the language's identity.

Do not simplify it.

Do not split it.

Do not weaken "top-level runs once".

That invariant carries half the language.

---

## Q2 — Weakest section + prune candidates

### Weakest: **Testing**

Not because it's bad — because it's overweight relative to the rest of the language.

The language sells:

> no boilerplate, one way to do things

But testing reads like an entire sub-language.

It introduces:

* render semantics
* test-only function reachability
* test-only verbs
* mock fetch
* mock every
* mock now
* freeze_time
* snapshot
* goldens
* snapshot updating
* deterministic spring serialisation

That's a lot.

It feels like spec gravity shifted.

---

### Prune candidates

## 1. Merge `mock now:` and `freeze_time:`

These are conceptually the same thing.

Current:

```igni
mock now: ...
freeze_time: ...
```

One ambient, one block.

That's extra surface.

Better:

```igni
mock now: ...
```

with optional block form.

Cleaner.

---

## 2. Remove direct function testing via `render`

This is clever, but breaks the otherwise strong boundary:

> functions belong to screenslator
expect total_with_tax(...)
```

That creates semantic leakage.

Cleaner long-term:

Either:

* extract utility modules later

or

* only test through UI/state

Right now this feels like a structural exception.

---

## 3. Snapshot section is too long

Way too much explanation.

You only need:

* what snapshot captures
* where it stores
* how to update

The internal explanation of spring target serialisation is implementation-detail-heavy.

That belongs in docs, not cheat sheet.

---

## Q3 — Semantic uncertainty (future teaching gaps)

These are places where v0.X users will misread the language.

---

### 1. Top-level code vs render-body is still conceptually fuzzy

You explain:

> top-level assignments run once

Good.

But the language visually interleaves:

```igni
count = 0
layout vertical:
```

That makes it look like one execution flow.

But it's actually two phases:

* init phase
* render phase

That distinction is semantic, not syntactic.

That will confuse people.

Future fix candidate:

make initialisers visually distinct.

Example:

```igni
state:
  count = 0
```

Not saying change it now — but this is the deepest teaching gap.

---

### 2. Functions are reactive, but only transitively when read

This rule:

> only fires when something reads

is correct, but subtle.

Example:

```igni
total():
  return count * price
```

This is reactive only if called in render.

That's not obvious.

People will assume functions "subscribe".

They don't.

Teaching gap.

---

### 3. `spring(value)` looks like state but isn't state

Example:

```igni
displayed_steps = spring(target_steps)
```

Visually looks like assignment.

Semantically it's derived animated projection.

That distinction will blur.

Likely confusion:

"Can I mutate spring output?"

Future docs need explicit:

> spring values are read-only animated mirrors.

---

### 4. Equality semantics are sharp-edged

This:

```igni
{a: 1} is {a: 1}  # false
```

is correct.

But many will not expect it.

Especially in a UI-first language.

This will create subtle bugs.

Needs more visibility.

Not buried.

---

### 5. `round()` returning string is dangerous

This is the most surprising builtin in the whole spec.

```igni
round(21.456, 1) -> "21.5"
```

That violates expectation.

Even with docs, people will misuse it.

This is a language-design smell.

Strong candidate for redesign.

---

### 6. `input` being excluded from `shared.X`

This is an exception to an otherwise elegant universal bind model.

Current:

```igni
slider bind: shared.volume
```

works.

```igni
input bind: shared.title
```

fails.

That's a conceptual crack.

The implementation reason makes sense.

The user-facing model suffers.

This will keep needing explanation.

---

## Overall

The language is strongest where it is opinionated and singular:

* reactivity
* layouts
* components
* state

Weakest where it grows exception systems:

* testing
* input/shared binding exception
* time mocking duplication

Biggest future teaching risk:

**the invisible split between init-time and render-time semantics.**

That's the one I'd watch hardest.
