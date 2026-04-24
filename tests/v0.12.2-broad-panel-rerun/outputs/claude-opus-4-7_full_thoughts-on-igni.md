# Thoughts on Igni

## 1. One-paragraph summary

Igni is a Flutter-targeting DSL that strips declarative UI down to its smallest legible core — indentation for blocks, colons to open them, one way to do each thing, no imports, no `setState`, no JSX, no ternaries, no string interpolation. The north star is a hypothesis most languages don't state out loud: *readability for humans and accuracy for LLMs are the same problem*. The project iterates the spec by running cold-LLM panels (Claude, GPT, Gemini) against the docs, watching what models invent when they're wrong, and patching the spec until 4/4 models reach for the sanctioned syntax first. It's for solo developers and small teams using LLMs heavily to produce UI code, who feel Flutter/React/SwiftUI's syntactic noise as friction — *not* for production apps, complex animations, or anyone who needs a package ecosystem. What makes it different is the feedback loop (cold-test → spec patch → re-test), not any single syntactic choice.

## 2. What works

**The hypothesis and the evidence loop.** Most toy languages die in a vacuum — the author thinks their syntax is clear, nobody else gets a chance to disagree. Igni's methodology (`tests/README.md`, cold-LLM panels as adversarial review) is the most interesting thing about the project, and the results are concrete enough to be falsifiable: "9/9 frontier adoption of `{target with …}` across three domain-swap rounds" is the kind of claim a reader can check. The domain-swap technique (Shopping + Apothecary + Spaceship Cargo) to rule out corpus-density confounds is genuinely clever.

**Transpile-time rejections for the right things.** The reactive-fetch footgun (`fetch("/api/search?q=" + query)` where `query` is bound to an `input`) is a real bug that I've watched LLMs produce in React too — and rejecting it at compile time with a fix-it that names the trigger-variable pattern is exactly the right call. Same for `count(list, lambda)` → "use `length(filter(...))`", `emit` outside handlers, and bare `shared:` access. Each of these is a place where the "obvious" syntax is wrong, and catching it at the compile boundary with a *directional* error is better than documentation alone.

**`is` as the universal equality operator.** Folding `is empty`, `is loading`, `is error`, `is null`, `is in`, and value equality (`count is 0`, `name is "Tyr"`) into one keyword is a real simplification. Most languages split these across `==`, `.isEmpty`, `.contains`, `== null`, plus framework-specific async checks. One word, consistent mental model.

**The visible coupling marker for shared state.** Requiring `shared.cart` at every read/write site — not just at declaration — means a reader scanning any line can tell whether state is local or global. This is the opposite of React Context (invisible at the consumer) or Zustand/Redux (visible at the import, but not at the call site). Small rule, big readability win.

**`{target with field: value}` syntax.** The rule that BASE must be a variable or dot-chain (no function calls, no indexing) is the detail that makes this work. It forces readers to find the named object, which is the whole point of object-update syntax. The 9/9 adoption evidence suggests models find it natural too.

**The "spec is a budget, not a backlog" principle in Appendix B.** This is the rare project whose design rationale explicitly argues against adding features. Most spec docs read as roadmaps; this one reads as a constraint.

**Tutorial pacing.** v2.5 is well-paced. Section 2 Part 1's explicit distinction between `label "name"` and `label name` is exactly the clarification a real beginner needs and most tutorials skip. Section 4 building a counter one button at a time, with the instruction to *try adding a third button labelled "+10"* at the end of Part 2, is textbook scaffolded instruction.

**The empty-layout-with-`on touch:` pattern for a xylophone.** The spec takes a real Flutter ergonomic pain point (making a coloured tappable region) and gives it an obvious answer: `layout vertical, fill: true, background: red, on touch: play(...)`. Small, but these are the sort of details that compound.

## 3. What worries you

**"Research prototype" and "three-tier spec" are in tension with the stated LLM-adoption goal.** If the point of Igni is that LLMs can produce correct code from the docs alone, the spec churn (v0.2 → v0.12.2 in what looks like weeks) is the biggest risk to that promise. Any LLM trained after today's cutoff will have a knowledge gap for whichever version ships next month. The cheatsheet-in-context workflow papers over this, but it means the language is effectively *only* usable with a live docs paste — and every version that renames tokens (like v0.12.1's `source-sans` → `source_sans`) silently invalidates older pastes users may have saved.

**The reactivity rule hides a sharp edge around `fetch` at screen body level.** The spec says "a line that calls `fetch` blocks until it resolves" and "`fetch` at screen body level is reactive — it re-runs whenever a dependency changes." Combined with the lexical reactivity rule, this means every screen body re-evaluation *might* re-fetch. The footgun is narrow (rejected only for `input bind:` + string concat), but the model is broader than the check. A user writing:

```igni
screen Feed:
  page = 0
  posts = fetch("/api/posts?page=" + page)
  button "Next", on tap: page = page + 1
```

...has a working paginator. But change `page = 0` to `page = default_page()` where `default_page` reads a `shared.` variable and you've built a re-fetch chain that's hard to reason about. The narrow transpile-time rule catches one case; the general problem is "what causes a screen re-evaluation to re-fire `fetch`?" and the answer is "every reference." Users will get bitten by cases outside the rule.

**"Cross-screen function calls are NOT allowed" is a significant limitation presented casually.** This is a much bigger deal than the spec treats it as. It means any non-trivial app needs `shared:` for anything the detail screen wants to push back to the list. For a Notes app, that's a real decision — does `notes` go in `shared:` because the detail screen edits it? The tutorial doesn't hit this, and the spec's note in §Functions is easy to miss. I'd expect many cold-tested LLMs to write cross-screen calls and have them fail.

**Lambdas are crippled in a way that will bite users.** "One parameter only. ... Multi-parameter lambdas are not supported; if you need more context, close over variables from the surrounding scope." This is fine for `filter`/`find`/`sorted`/`map`, but `reduce` is conspicuously absent from the list builtins — and without reduce or multi-param lambdas, computing a cart total requires the `each` imperative form:

```igni
total_price():
  total = 0
  each item in cart:
    total = total + item.price
  return total
```

...which is fine, but it's also the kind of three-line function that `sum(map(cart, i => i.price))` replaces in every other declarative language. The "one way to do everything" principle is cutting against expressiveness here.

**The tutorial doesn't once use components.** §7 on Components in the spec is a lot to learn, and the tutorial ending at "Section 8 — Dice Roller" with zero component extraction means a reader who finishes the tutorial has no intuition for when to extract. The "once a screen has three similar UI blocks" heuristic in the spec is good advice, but it lives in the spec, not the tutorial. A beginner will hit 200-line screens before understanding the extraction move.

**"Conditionals are statements, not expressions" + "no ternary" + "no string interpolation" is a lot of friction compounded.** Each is defensible on its own. Together they mean every "format this number nicely" or "colour this label based on a value" needs a separate assignment statement and block. The spec's BMI example illustrates this:

```igni
status_color = green
if bmi < 18.5:
  status_color = danger
else if bmi >= 25:
  status_color = orange
label "BMI", color: status_color
```

Five lines for what in SwiftUI is `.foregroundColor(bmi < 18.5 ? .red : bmi >= 25 ? .orange : .green)`. SwiftUI's version is admittedly harder to read; Igni's is harder to *write*. For LLMs this may be fine (they'll produce the verbose version). For humans editing afterwards, the ceremony adds up.

**Identity-based equality as the default is going to confuse people.** The spec correctly warns that `find(list, {id: 1, name: "Tyr"})` doesn't work because "the dict literal is a new identity." But every JavaScript/Python developer's first instinct will be exactly that pattern. The rule is defensible (reference semantics, no structural equality) but I'd bet it's the single most common cold-test invention that's going to keep appearing.

**`locate()` is a lot of API for what seems like a very specific feature.** Dedicating a primitive, a compile-time rule extension, and a whole subsection to geolocation in a spec that doesn't have animation, timers, or reduce feels like it's optimising for a specific cold-test app (Clima) rather than balanced coverage. The "Latest methodology result" section suggests this was genuinely driven by testing, but from the outside it reads as asymmetric.

**No animation story.** The README honestly says "features Flutter has (animations, pub.dev packages) you'd need to drop into Flutter directly for." I believe this is understating the problem. Real UIs need transitions between screens, loading shimmers, tap feedback, expand/collapse. Without any primitive for this, Igni apps will feel static in a way that no amount of Flutter tooling underneath can fix.

**The `#FAFAFA` default scaffold.** Deep in "Visual defaults." This is fine for light mode but gives Igni an opinionated *light-mode-only* aesthetic out of the gate. Combined with no dark-mode primitive and a theme block limited to font overrides, Igni ships with a look. This should either be called out as a v1 choice or remedied before v1.

## 4. Comparisons

Igni sits closest to **SwiftUI** on the mental-model axis — declarative, state-driven, indentation-friendly, property-bag syntax, automatic reactivity via lexical reference. The `bind:` keyword is essentially `@Binding`. The `body` slot in wrapper components is `@ViewBuilder` content. "Each screen re-evaluates from the top" is `@State` + the SwiftUI rebuild loop.

**Where Igni has an edge over SwiftUI:** no property wrapper zoo (`@State`, `@Binding`, `@StateObject`, `@ObservedObject`, `@EnvironmentObject`, `@Environment`). Igni collapses these into `variable =`, `bind:`, and `shared.`. For anyone who's ever tried to explain to a colleague when to use which wrapper, this is a genuine simplification. `is` as universal equality is also cleaner than SwiftUI's mix of `==`, `.isEmpty`, and `if let`.

**Where Igni loses to SwiftUI:** animations, gestures, accessibility, a decade of library ecosystem, real IDE tooling, first-party platform integration, dark mode. Everything non-UI.

Against **Jetpack Compose** the same pattern holds, but Compose has more powerful state tooling (`remember`, `derivedStateOf`, `CompositionLocal`) that Igni deliberately doesn't try to match.

Against **Elm**, Igni gives up a lot. Elm's pure Model-Update-View is more rigorous than Igni's "reassign and re-evaluate," and Elm's custom types + exhaustive pattern matching buy correctness guarantees Igni has no answer for. But Elm's ceremony (decoders, commands, subscriptions) is exactly the thing Igni is rejecting. Different tradeoffs.

Against **Flutter directly**: Igni is better for short, readable screens; worse for anything needing fine-grained control.

Against **Roc**: Roc is a real language with a typed backend and platform abstraction. Igni is a transpiler to Dart. Not comparable on those axes, but Roc shares the "small, read-it-top-to-bottom" aesthetic.

The comparison Igni *should* be making more explicitly in the README is to **v0 / Vercel / Bolt / Lovable** — LLM-first codegen tools. Those tools emit React. Igni is the only project I'm aware of taking seriously the idea that the *target language itself* should be designed for LLM codegen rather than just prompting cleverly. That's a genuinely novel position and the README undersells it by framing the comparison against SwiftUI/React/Flutter instead.

## 5. What you'd change

**Change 1: Add `sum`, `min`, `max`, and `average` as list builtins.** Scope: small, additive, non-breaking. All four are trivially expressible in `each`, but all four are things every real app needs (cart totals, highest score, average rating, lowest price). Their absence forces a three-line function for a one-line intent every time, and it's exactly the sort of friction cold-tested LLMs will produce an invented builtin for (`total(cart, i => i.price)` or `sum_by(cart, ...)`). Adding them directly, with the same predicate-lambda shape as `filter`/`find`, closes the gap:

```igni
total = sum(cart, item => item.price * item.quantity)
cheapest = min(products, p => p.price)
top_score = max(rounds, r => r.score)
avg_rating = average(reviews, r => r.stars)
```

This is a budget decision: four keywords, all structurally identical to existing builtins, zero new concepts. I'd spend the budget.

**Change 2: Add a dedicated Components section (§9 or §10) to the tutorial.** Scope: docs-only, no language change. A reader who finishes the current tutorial has no intuition for component extraction, and the spec's component section is too much to absorb without a scaffolded introduction. The Dice Roller at §8 is a natural extraction target — extract a `DieFace(value)` component, invoke it from the screen, add a second die, note how the component makes the second die trivial. This is a 20-minute writing task that closes the biggest learnability gap in the doc set.

While there, add a paragraph to the tutorial's "What to build next" about the cross-screen function rule, with a single sentence: "For state that multiple screens edit (like the notes in a notes app), use a `shared:` block — the cheatsheet explains how." This would inoculate users against the most confusing failure mode in the navigation model without requiring them to read the full spec.

Both changes ship in v0.13. Neither touches the transpiler. Both move the language toward its stated goal (readable by humans, correct for LLMs) without spending budget on speculative features.