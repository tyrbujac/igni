## 1. One-paragraph summary

Igni is a small declarative UI language that compiles to Flutter, aimed squarely at people who want to write very short, readable app code—especially in LLM-assisted workflows. Its core bet is that syntax which is easier for frontier models to learn from a single spec will also be easier for humans to read: indentation-based blocks, no imports, no widget-constructor nesting, no hook/state boilerplate, one obvious pattern for common tasks, and a deliberately narrow surface area. In practice it feels like a stripped-down mix of SwiftUI/Compose/Flutter concepts with Python-like layout and a strong “spec as the product” philosophy. What makes it distinct is less raw capability than disciplined constraint: it is intentionally designed around cold-start learnability, including transpile-time rejection of patterns that are technically possible but likely to cause mistakes.

## 2. What works

### The language has a very clear point of view
The strongest thing here is that Igni is not trying to be a general-purpose language. It knows it is a UI DSL, and the docs/spec/tutorial all reinforce that. That coherence shows up everywhere: “one way to do everything,” no imports, no interpolation, no alternate equality operators, no inline conditionals, no multi-parameter lambdas. I don’t agree with every individual choice, but the cumulative effect is real: the language feels teachable.

### The reactivity model is simple and memorable
The Reactivity section is one of the best parts of the spec.  
> “each screen re-evaluates from the top whenever any variable it lexically references is reassigned.”

That is a strong, compact rule. It’s the kind of thing a human can hold in their head and an LLM can likely apply consistently. I also think the spec does a good job tying that rule back to the opening Todo example and then reusing it across local state, shared state, and async state. That unification is smart.

### The syntax is genuinely readable in the small
The basic examples are very successful:

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

This is a good “why Igni exists” example. Compared to Flutter, the readability win is obvious. Compared to SwiftUI/Compose, it is still simpler to parse visually.

### The docs are unusually intentional
You can tell this has been iterated. The README, architecture doc, spec, and tutorial each have distinct jobs and mostly execute them well:

- README: crisp value proposition, installation, quick start, project status.
- Architecture: gives implementation/testing context without polluting user docs.
- Full spec: tutorial-ish progression with reference detail.
- Beginner tutorial: actually beginner-friendly, with sensible step sizes.

The tutorial in particular is strong. The progression from Hello World → variables → conditions → buttons → input → functions → booleans → dice roller is well judged. Section 5’s `input bind:` explanation is simple and effective. Section 6’s introduction of functions only when the reader has seen repeated multi-step actions is pedagogically sound.

### The compile-time rejection philosophy is smart
This may be Igni’s most interesting design choice. Rather than just document anti-patterns, it rejects them with fix-it guidance. The `fetch` + bound text input footgun is a great example. The trigger-variable pattern is arguably a little awkward, but the fact that the language actively protects the user is good design.

Likewise:
- rejecting `count(list, lambda)` and forcing `length(filter(...))`
- rejecting bare `shared:` access
- restricting `emit`
- rejecting direct `locate()`-driven reactive fetches

This is exactly the kind of guardrail a research DSL should have.

### Object update syntax is excellent
`{target with field: newval}` is a very good addition. It reads well, avoids verbosity, and is easy to explain. It also matches the rest of the language’s readability goals better than forcing full object reconstruction. The rule constraints are sensible too: shallow only, named base only, no function calls/indexing as the base. That’s a good example of useful restriction.

### Components are thoughtfully constrained
“No parentheses on invocation” is risky in theory, but here it mostly works because the rest of the language is designed around it. The body-slot wrapper pattern is also well explained. `body` rendering exactly one widget is a good constraint; it avoids hidden wrappers and keeps layout semantics explicit.

The event-channel model with `emit` + `on <event>:` is also better than I expected. It preserves the same shape as built-in events and keeps parent/child interaction uniform.

### Shared state is simple enough
The flat `shared:` namespace with explicit `shared.` reads is a reasonable choice for this scale of language. I especially like the “visible coupling marker” rationale. A lot of frameworks obscure global/shared state too much; Igni does the opposite.

### The spec is full of useful “don’t do this” clarifications
A lot of language docs only show happy paths. Igni repeatedly points at likely confusions:
- event handlers go on the same line, not as children
- `if` is a statement, not an expression
- `fill: true` is only for layouts
- icon buttons should be `icon ... on tap:`, not icon-inside-button
- field-based matching should use lambdas, not object literals
- component/screen args are immutable

Those callouts are the result of real testing, and it shows.

## 3. What worries you

### Versioning across the docs is confusing
This is the biggest immediate trust issue. The README and architecture doc still repeatedly talk about `v0.11.6` in explanatory prose while synced markers point to `v0.12.2` as canonical. The architecture doc’s “Spec files” section explicitly names `spec/v0.11.6.md` as current full spec, which conflicts with the repo-level “current canonical spec is v0.12.2.”

I understand from the spec that `v0.12.2` is docs-only restructuring, but as a reader this still creates uncertainty: which wording is canonical when details differ? For a project whose whole premise is “single spec document, no ambiguity,” this matters a lot.

### The “one way” principle sometimes becomes “the only way is the verbose way”
There are cases where the simplification pays off, and cases where it feels doctrinaire.

The clearest example is strings: no interpolation, only `+`. For tiny examples, fine. For real UI copy, routes, and composed labels, this can get clumsy quickly. Same with conditional assignment: the default-then-override pattern is teachable, but it’s also noisy for common value selection.

Likewise, forcing `length(filter(...))` instead of a predicate count is consistent, but not especially elegant. You can justify it, but it does impose ceremony on a very common operation.

### The lexical reactivity rule is elegant, but I’m not fully convinced it scales mentally
For small screens it’s excellent. For larger ones, “re-evaluates from the top whenever any referenced variable is reassigned” could become slippery, especially once you mix:
- local variables
- shared variables
- async values
- screen functions
- wrapper components
- event-driven updates

I don’t think the rule is wrong. I do think it creates a hidden threshold where the apparent simplicity could mask performance or reasoning complexity. The spec says the same rule applies everywhere, but it doesn’t yet give much help for thinking about cost, repeated work, or derived values on larger screens.

### Async semantics need sharper boundaries
This sentence bothered me a bit:
> “a line that calls `fetch` (or any function returning async data) blocks until it resolves.”

I understand what you mean in the declarative sense, but “blocks” is loaded and potentially misleading. The UI obviously doesn’t literally block; the variable enters a loading state. I’d tighten that wording.

More broadly, async seems powerful but under-specified in edge behavior:
- what exactly counts as “any function returning async data”?
- can user-defined functions return async values?
- are fetches deduplicated within a render?
- what is cancellation behavior when dependencies change quickly?
- how does `paginate:` interact with async re-fetch and list identity?

Some of that may be implementation detail, but enough of it affects programmer expectations that I’d want clearer semantics.

### The language may be too dependent on docs prose rather than syntax affordances
A lot of correctness relies on the user internalizing special cases:
- no cross-screen function calls
- body can render zero or once
- `count` is identity-only
- `find` has two forms but `count` doesn’t
- `contains` is case-insensitive
- indexing returns `null`
- `card` is a background-only token, not a color
- `fetch` + text input is illegal but fetch + slider is legal
- `locate()` has special anti-footgun rejection

All of these are individually reasonable, but the language surface is accumulating “you must know this exact rule” pockets. That doesn’t invalidate the design, but it does chip away at the claim of radical simplicity.

### Identity-based list operations are dangerous without stronger onboarding
This is probably the design area I’d worry about most long-term. `without`, `replace`, `count`, and `is in` all use identity semantics, not structural equality. The spec explains it, but I suspect many users—human and model—will repeatedly trip on it, especially because object literals look so lightweight and common in Igni.

The spec itself says:
> “`find(list, {id: x})` does NOT work — the dict literal is a new identity.”

That’s exactly the sort of thing people will get wrong. It’s not fatal, but it’s a conceptual mismatch between “friendly small object syntax” and “reference identity semantics.”

### No imports is nice until project scale arrives
Auto-discovery and global availability are great for tiny apps, maybe even medium ones. But “every screen and component is available everywhere with no imports” plus flat global shared state plus no per-file scoping is a scalability tradeoff with a sharp cliff.

The docs hint at this with “no folders needed until 15+ files,” but honestly, 15 files is not that many. If this project ever leaves prototype territory, namespace management will become painful fast.

### The tutorial is excellent for beginners but underprepares them for the language’s harder edges
By the end of the tutorial, the learner has seen:
- variables
- conditions
- inputs
- functions
- random

But not:
- components
- navigation
- shared state
- async data
- list transforms
- identity semantics
- object updates
- wrapper components
- custom events

That’s reasonable for a beginner tutorial, but it creates a steep second cliff between “I can build a toy app” and “I can build the kinds of apps the README advertises.” I’d want a short “Part 2” bridge tutorial.

### Some examples in the spec feel slightly optimistic or underexplained
A few places made me pause:
- `show Dashboard` appears in the Boolean operators section, but `show` is not part of the language elsewhere.
- The “For long lists fetched from a server, add `paginate:` to fetch in chunks and auto-load more on scroll” line is stronger than the architecture note, which says auto-load-more was deferred pending async integration. That looks inconsistent.
- Theme support is present, but only partially live. The spec is reasonably explicit, but this kind of half-exposed feature is always dangerous for a DSL aimed at zero-shot generation.

## 4. Comparisons

### Closest overall: SwiftUI / Jetpack Compose, with Flutter as runtime and Elm-ish discipline in spots
If I had to pitch it in one sentence: Igni is a highly constrained declarative UI DSL in the SwiftUI/Compose family, compiled to Flutter, with some Elm/Roc-style bias toward explicit data reshaping and a strong anti-footgun stance.

### Where it feels most like SwiftUI / Compose
- declarative screens/components
- state-driven rerendering
- layout-oriented UI construction
- reusable components
- wrapper composition
- “the UI is a function of state,” even if not expressed that way syntactically

But Igni is much smaller and more prose-guided than either.

### Where it feels like Flutter
Mostly in what it’s escaping:
- widget tree nesting
- boilerplate around state
- explicit controller/context plumbing
- runtime/platform access through Flutter plugins

It is almost “Flutter with the syntax pressure removed.”

### Where it has an edge
1. **Cold-start readability**: It is much easier to read than Flutter and often easier than SwiftUI/Compose, especially for novices.
2. **Spec coherence**: The language is small enough that the whole thing can fit in an LLM context window and plausibly be learned from one document.
3. **Guardrails**: Mainstream UI frameworks rarely reject anti-patterns as aggressively or as helpfully.
4. **Brevity**: For simple UI CRUD flows, it is materially shorter than Flutter and somewhat shorter than Compose/SwiftUI.

### Where it loses
1. **Ecosystem and escape hatches**: Flutter/React/SwiftUI/Compose all crush it here.
2. **Scalability of organization**: no imports, global discovery, flat shared namespace—fine early, risky later.
3. **Semantic maturity**: async, identity, partial theme support, and future large-app ergonomics are all less battle-tested.
4. **Power-user expressiveness**: The same constraints that help LLMs and beginners can frustrate experienced developers.
5. **Trust and precision**: Established frameworks have fewer doc/runtime mismatches and more stable semantics.

### Relative to Elm/Roc
Not close in syntax, but there’s a shared instinct: constrain the language to remove classes of mistakes. Igni is much more UI-first and less principled in the type/system sense, but I can see the family resemblance in the anti-footgun choices.

## 5. What you'd change

### 1. Fix the version/canonical-doc story immediately
This is the highest-priority non-language change. I would make the docs fully self-consistent in the next release:
- update architecture references from `v0.11.6` to `v0.12.2`
- clearly label `v0.12.2` as “docs-only restructure; language semantics unchanged from v0.11.6” in every public-facing place where version confusion could arise
- audit all examples for stale wording or behavior contradictions (`paginate:` especially)

For a language optimized around learnability-from-docs, doc trust is the product.

### 2. Add one small derived-data feature to reduce ceremony
I would push for one scoped ergonomics improvement, not a broad expansion. My top candidate: **predicate `count`**.

Current:
```igni
critical_count = length(filter(alerts, a => a.level is "critical"))
```

Proposed:
```igni
critical_count = count(alerts, a => a.level is "critical")
```

Why this one:
- it’s common
- it’s easy to teach because `find` already has dual identity/predicate forms
- it reduces cognitive and visual noise
- it doesn’t introduce a whole new concept, just extends an existing builtin consistently

If you wanted an alternative instead, I’d consider **string interpolation** narrowly—but only if you decide the readability gain outweighs the “one way” philosophy cost. Predicate `count` feels safer and more aligned with the current design.

---

Overall: I think Igni is one of the more coherent “LLM-friendly language” experiments I’ve seen, precisely because it isn’t just syntax golf. There is real language-design judgment here. My main concern is not that the core idea is weak; it’s that the project now has to preserve its own clarity as the rule count grows. The design is strongest when it removes ambiguity. The next risk is death by accumulated special cases.