# Opus 4.7 — v0.19.1 cheatsheet review

*Raw chat-mode output, 2026-04-28. Minor copy-paste artifacts preserved as-is (e.g. "the sfrom the top" should read "the screen from the top" — text-mangling artifact from the chat UI; "Component events. Plus prune candidates." had its first letter cut off in the original Q2 lead).*

---

**Q1 — strongest: "Reacting to users."**

It does what cheat sheets usually fail at — names the framework users coming in (React/Vue/Svelte/Solid) and tells them which mental model to drop. The wrong-vs-right `total` callout is the load-bearing teaching moment for the whole language; without it the rest is just syntax. The transitive-reach rule belongs here too and reads cleanly. Don't compress, don't reorder, don't move the callout below other content.

Animation is a close second for the same reason (the "two primitives, one rule each" framing plus the compiler-rejection error messages do defensive teaching). But Animation can survive light editing. "Reacting to users" can't — break it and the doc collapses.

**Q2 — weakest: Component events. Plus prune candidates.**

Component events is the densest section relative to teaching payoff. Emit shape + payload mismatch rules + reserved names + `_` discard + closure-over-loop-var is roughly five concepts crammed in. A reader who needs all five is past cheat-sheet stage. Cut to: emit shape, one mismatch rule, link to spec for the rest.

Prune candidates across the whole doc:

- The "What X doesn't do" enumerations in Animation and Testing — pure roadmap. Collapse each to a single line: "v0.19 ships X only."
- Version-tagged callouts ("v0.20+ candidate", "Stream 3 candidate") leak internal planning into user-facing docs. Strip them.
- The Figma `_`-flatten note under `theme:` — niche, belongs in spec.
- The lexical-reactivity rule is restated 4–5 times (Reacting, Functions, Components, Async re-fetch, every). One canonical statement, then back-references.
- "Builtins" reads as a junk drawer — the `now()` non-reactivity caveat is critical and is currently buried next to `print()`. Promote it or move it next to `every`.

**Q3 — semantic uncertainty / teaching gaps.**

Spots where a future reader will guess and probably guess wrong:

- **`every` on screen revisit.** "Pauses when user navigates away and resumes on return." On return, does the sfrom the top? Does `start_time = now()` re-fire? You imply not (top-level runs once "when the screen first opens"), but you never close the loop with navigate-back. Determines whether stopwatches survive navigation.
- **`spring()` row identity in `each`.** "Keyed by row identity" — but Igni's `is` rule is reference for objects, structural for primitives. So `each name in ["Ada", "Ben"]` reordered to `["Ben", "Ada"]`: same rows or different rows? Reader has to guess.
- **`transition: fade` under `each` reordering.** Insertion/removal trigger fade (explicit). Reordering — silent. Probably a no-op visually, but the doc should say.
- **`mock fetch:` URL key matching.** Exact string match? Path-only? Query-string-aware? `"/api/users/42"` as a key vs `fetch("/api/users/" + id)` — the test author needs to know whether to template the key. Implied "literal string" but unstated.
- **`value_of()` on an unset binding.** Table says "current value" — but if the user never typed, what's "current"? Presumably the initial bound variable value. State it.
- **Int vs decimal arithmetic.** The Variables section names both types but never says whether `count + price` works, what `1 / 2` returns, or when truncation happens. The structural-equality and no-truthiness discipline suggests the language cares about types; the cheat sheet stays silent.
- **"Variables read outside a block."** Block = `each` and `if`/`else`, presumably. The accumulator rule is right but the definition of "block" is inference-only.
- **Transitive-reach second clause** ("reassigning a variable nothing reads is a no-op for the UI"). Correct, but readers won't believe it until they've been bitten. One concrete example — assigning to an unread variable, watching nothing happen — would lock it in.
- **`seen "string"` across element boundaries.** Does `seen "Hello World"` match two adjacent labels rendering "Hello" and "World"? Probably no. Worth one line.

Of these, the `every`-on-revisit gap is the highest-stakes — stopwatches are an explicit example in the doc, and the lifecycle answer changes whether the example as written is correct.
