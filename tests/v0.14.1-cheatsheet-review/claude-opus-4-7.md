**Q1 — Strongest**

The 17-line Todo. It earns its top placement: every line maps to a concept, the inline comments label primitives without breaking the flow, and you finish it with a working mental model of state, layout, conditionals, iteration, and screen-internal functions. Good payoff per token.

The "Why doesn't state reset?" callout. This is the single best teaching move in the document. It pre-empts the obvious wrong assumption ("if the screen re-runs from the top, won't `count = 0` re-fire?") and resolves it in three sentences. Reactivity systems all have to answer this and most don't bother.

The Pomodonut wall-clock vs. relative-decrement example. Showing the wrong pattern alongside the right one, with the failure mode named ("loses elapsed seconds when the screen unmounts"), is more useful than a generic "use timestamps" rule.

Hard constraints stated bluntly. "Max nesting depth: 4." "Cross-screen function calls are NOT allowed." "List elements cannot be mutated in place." "Arguments are immutable." These are quotable, falsifiable, and pin down behaviour.

The input/event teaching order — primitives table → binding rule → events — is a clean spine.

**Q2 — Weakest**

*The "Binding to shared state" paragraph under Getting Input.* This is doing too much in one paragraph: the auto-wrap behaviour, the four primitives that work, the `input` exception, and the bridge pattern (`draft = shared.title` + `on change:`). The `input` exception is a workaround for an asymmetry; it needs its own short subsection or a code example, not a parenthetical buried mid-paragraph.

*The `on change:` "doesn't fire on programmatic reassignment" paragraph.* Important, but it reads like spec prose, not cheat-sheet prose. Two negatives, three counterexamples (Reset button, `every` block, shared state). I'd cut it to one sentence — "fires on user-driven changes only, not programmatic reassignment of the bound variable" — and move the rest to a "subtleties" appendix.

*Lists section.* Ten builtins in one code block plus a composed example. No grouping. The reader can't scan for "how do I find one item" vs. "how do I transform a list" vs. "how do I count things." Group as queries / transforms / mutations-via-reassignment.

*The "verbose form is still legal" hedge under `{x with ...}`.* Either drop it or commit. As written, it adds noise without giving the reader a decision rule. A cheat sheet should pick a winner.

*The fetch-URL keystroke warning.* "Don't concatenate an `input bind:` variable into a fetch URL — it re-fires per keystroke. (Full rules in the spec.)" This is a real footgun and you've punted to a spec the reader doesn't have. It deserves a four-line broken/fixed example. Same shape as the Pomodonut treatment.

*Styling colours.* Dumped as a flat list without grouping (semantic: `brand`, `subtle`, `danger` vs. literal: `red`, `blue`...). The `card` background-only restriction is mentioned twice in slightly different forms.

*"A bare `screen` has sensible defaults... See the full spec."* Either list them or remove the sentence.

**Q3 — Genuine semantic uncertainty**

1. **Reactivity granularity on objects.** If a screen reads `user.name` and I do `user = {user with email: x}`, does it re-render? Presumably yes (the variable `user` was reassigned), but that means any field change re-renders every reader of any field. Not stated.

2. **`fetch()` reactivity model.** The keystroke warning implies `fetch()` re-evaluates whenever its arguments change. Does that include `body:` and `method:`? If `fetch(url, method: "POST", body: {title: draft})` is in a screen body and `draft` changes, does it re-POST every keystroke? If yes, that's a much bigger footgun than the URL one.

3. **`fetch()` lifecycle.** Are concurrent identical fetches deduplicated? Cancelled on navigation? Cached across screens? `is loading` / `is error` describe states but not lifetime.

4. **`navigate to Detail item` — snapshot or live binding?** If the parent reassigns `item` after navigation, does the child see it? "Arguments are immutable" tells me the child can't mutate, not whether the parent's later writes propagate.

5. **`every` block first tick.** Does `every 1s:` fire immediately on mount or after the first interval elapses? Affects whether a manual prime-the-pump pattern is needed.

6. **`every` block lexical capture.** The NoteEditor block reads `draft` and `last_saved`. Does it see the latest values on each tick (re-evaluation each fire) or values captured at mount? Implied by the reactivity model but not stated for `every` specifically.

7. **`emit` argument binding.** `emit selected item` → parent `on selected: handle(item)`. Is `item` a positional binding, a name match, or fixed by the emitter? If parent writes `on selected: handle(thing)`, does it work?

8. **`replace` / `without` on missing targets.** Both are identity-based. What happens when the target isn't in the list? Append? No-op? Error? Different answers have different ergonomic consequences.

9. **`shared:` initialization timing.** Once at app start, or on first access? Matters for ordering when multiple screens read `shared.cart` on initial mount.

10. **Component re-evaluation.** When a parent screen re-renders, do invoked components re-run their bodies? They appear stateless (no docs say otherwise), but it's never confirmed. If they're stateless, `component Card` with internal `count = 0` would reset on every parent change — important if true.

11. **`is loading` / `is error` outside async.** Are these special forms only valid on `fetch()` / `locate()` results, or can any value be in those states?

Items 2, 4, and 10 are the ones I'd reach for code expecting an answer and would have to test to find out.
