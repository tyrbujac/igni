---
model_label: opus 4.7
input_tier: spec
input_path: spec/v0.17.0.md
date: 2026-04-27
---

# Honest read on Igni v0.17

It's a real design exercise, not vibe-coded. The reactivity model is principled, the "one way" discipline holds up under pressure, and the prediction-test methodology in Appendix D is exactly the right kind of rigor. But there are gaps that matter before v1.0, and a few structural risks worth naming.

---

## Scoring

### Readability — 8/10

By "readability" I mean: how fast a designer-engineer can scan a screen body and predict what it renders.

The Todo example reads cleanly — every line is load-bearing and the reactivity is obvious from the source. **Versus Flutter: clear win**, the bracket-hell + named-arg-overload + builder-method-chains thing is real pain. **Versus SwiftUI: roughly tied** — SwiftUI still wins on tooling (live previews, autocomplete) but Igni has the edge on raw glance-readability since there's no `View` boilerplate or `@State` decoration. **Versus JSX: comparable** — JSX wins on ecosystem familiarity, Igni wins on reactivity clarity (no `useEffect` cognitive overhead). **Versus Jetpack Compose: Igni wins** — Compose's `@Composable` ceremony and `remember { mutableStateOf(...) }` are cognitive tax Igni doesn't pay.

Loses points for: the parens-vs-no-parens split between functions and components is a real visual inconsistency; deep layout nesting still gets dense; `:` discipline is easy to miss when scanning.

### LLM accuracy — 7/10

How likely a frontier model is to write correct Igni zero-shot from this spec.

The "one way" rule plus explicit fix-it errors is genuinely good for LLM consumption. Most syntactic decisions cut LLM ambiguity (no ternary, no string interpolation, `is` for all equality). The Appendix D runtime semantics are exactly right — that's the kind of latent ambiguity LLMs trip on.

But the spec is **long**. Loading the full cheatsheet costs serious context. And there are subtle "rejected at parse time" rules a model has to hold in working memory simultaneously: bind+fetch, `every` placement, bind targets, cross-screen , with-base restrictions, `emit` placement. That's a lot of negative space.

Versus my own confidence: I'd write more accurate Igni from this spec than I'd write SwiftUI from Apple's docs. I'd write less accurate Igni than I'd write HTML/CSS from MDN. Flutter is the right comparison and Igni wins it.

**The biggest accuracy hole I see**: nowhere does the spec state the component-vs-function disambiguation rule. Examples consistently use PascalCase for components and lowercase for functions, but `Appendix B: Rules summary` doesn't include this. A model could write `myCard user, size: 80` and not know it's wrong until codegen. **Add this to Appendix B.**

### Speed — three interpretations

- **Compile speed: 9/10.** Simple AST, no type inference work beyond the trivial cases, transpiles to Flutter. Should be very fast.
- **Runtime speed: 6/10.** Flutter's cost plus the "components don't memoize, function calls re-evaluate every tick" rule (D.7, D.8). For a 200-row list where one row mutates, every row's component body re-runs. Flutter's element diffing helps with paint, but Igni-level re-evaluation is uncached. The spec is honest about this and points at "reduce reactivity surface" as the answer, but a real production app will hit perf walls and have no escape hatch (no memoization primitive). This gets worse as apps grow.
- **Dev iteration: 8/10.** Hot reload is there. Standard Flutter-tier loop.

### Cost — three interpretations

- **Token cost (LLM generating Igni): 8/10.** Concise syntax, no `<div className="...">` noise, no `Container(child: ...)` wrappers. Generates compactly.
- **Spec/context cost (loading the cheatsheet): 5/10.** The cheatsheet is ~12k words. Models will need most of it for non-trivial work. The "one way" rule means there's less to learn but every rule must be present in context to avoid hallucination.
- **Cognitive cost (human reader): 7/10.** Basics are simple. Footguns are signposted. But the rejected-at-parse-time rules pile up — a contributor reading Igni source needs to internalize them all.

### Testing — 3/10

This is the most serious gap. The spec mentions `igni run` and `print()` and that's it. v1.0 needs:

- A widget-test equivalent — render a component with mocked args, assert on the rendered output.
- A snapshot/golden-file system for visual regression.
- A way to mock `fetch()` and `locate()` for deterministic tests.
- Some equivalent of SwiftUI previews — render a component in isolation with example data.

Compare against the bar: Flutter has `flutter_test`, `golden_toolkit`, `mockito`. SwiftUI has previews + `ViewInspector`. React has Testing Library + Storybook + Vitest. Igni has nothing. **This is the v1.0 dealbreaker for any team that ships software.**

### Additional axes

- **Accessibility — 1/10.** Not mentioned anywhere. No semantic labels, no focus management, no ARIA equivalent, no contrast tokens, no screen-reader testing. The token discipline is *positioned* well for accessibility (semantic colour roles, `style:` over raw fonts) but the actual a11y primitives are absent. This is going to be the wall a serious app hits.
- **Animations — 0/10.** Completely absent. No transitions, no springs, no gestures beyond `on tap`/`on touch`. Real apps need motion. Bolting this on later risks breaking the "one way" rule because Flutter's animation model (controllers, tweens) doesn't fit lexical reactivity.
- **Internationalization — 0/10.** Strings are inline literals. No `t("hello")`, no plural rules, no RTL handling.
- **Typing — 4/10.** Optional hints (`items: [Product] = []`). No discriminated unions, no generics, no proper type errors. Will hurt at scale.
- **Extensibility — 3/10.** Token sets are closed by design (`phone/tablet/desktop` for max-width is exhaustive). Good for LLM accuracy, painful when an app needs the missing value. The font bundle is fixed at 6.
- **Error messages — TBD.** Spec promises good fix-it messages. Can't evaluate without seeing the actual transpiler output.

---

## Things to consider before v1.0

### Structural risks (the things that scare me)

1. **`shared:` is a flat global namespace across all files.** Build-time collision detection is good but doesn't solve the architectural problem: a 50-screen app ends up with a flat list of names. There's no per-feature import, no module-scoped shared state. The "everything visible at every read site" principle is good; the "everything mutable from every screen" reality is what you'll regret. Consider namespaced shared blocks (`shared cart:`) before the flat namespace becomes load-bearing.

2. **No memoization escape hatch.** D.7 and D.8 say function calls and components in `each` re-evaluate on every reactivity tick. The spec's answer is "reduce your reactivity surface," but at scale you'll need a `memoize:` modifier or equivalent. Adding this later without breaking the model is hard. **Decide now whether you want one.**

3. **Cross-screen function call ban + flat shared namespace = forced pattern.** Every cross-screen interaction goes through `shared.` This is fine for simple apps, but it pushes data flow into a god-object. SwiftUI has `@EnvironmentObject` for scoped DI. React has Context. Flutter has Provider. Igni has nothing — and the ban means you can't even pass a callback prop. Reconsider.

4. **`fetch` is JSON-only and synchronous-shaped.** No streaming, no file upload, no binary, no WebSocket, no SSE. The spec acknowledges and defers. For v1.0 you need at least file upload (`POST` with multipart) and probably streaming. Adding async iterators or stream primitives later will collide with the "one way" rule.

5. **`every` only has three duration tokens.** `1s`, `5s`, `30s` is absurd for v1.0. Even `1m`/`5m` would help. A timer/animation tick is `16ms`. The whitelist principle is right; the whitelist itself is too small.

### Functional gaps (the things you must add)

- **Animations.** Even just `transition: fade`/`slide` between conditional renders, plus a `spring(value)` primitive, would cover 80% of cases.
- **Form abstraction.** Multi-step forms with shared validation state are painful in pure shared-variable land. Consider a `form:` block with `valid:`, `submit:`, `errors:`.
- **Test runner.** Mock `fetch`, render component, assert.
- **Accessibility primitives.** `semantic_label:`, `focus_order:`, `role:`.
- **i18n.** Wrap strings, plural rules, locale-aware date/number formatting.
- **`fetch_text()` / `fetch_blob()`.** Acknowledged in D.14, do it.
- **Sub-second `now()` and `every`.** `every 16ms:` is the animation loop. Without it, motion is unattainable.

### Smells worth fixing now

- **`{base with ...}` requiring a variable name** — bind to a local first then update. Smells like premature constraint. Allow `find(...) with x: 1` directly; the gain in fluency outweighs the parsing cost.
- **`contains` is case-insensitive but `is` is exact.** Inconsistent. Add `contains_ignore_case` and make `contains` exact, or document the asymmetry as a rule (it's a rule users will trip on).
- **Component vs function casing rule isn't in Appendix B.** Add it.
- **`round(x, n)` returns a string** (D.11). This is a known foot-trap — `if elapsed >= round(60, 1)` typechecks at runtime as comparison of int to string. Either make `round()` return a number and add a separate `format(x, n)` for display, or rename to `format_number`. The current shape will burn people.
- **`fill: true` siblings split equally with no weight property.** The spec is honest about this but it's a constraint that will hurt. Designers do want 1:2 splits. Add `fill: 2` (numeric weight) before the no-weight rule becomes load-bearing.
- **No multi-line string syntax.** How do I write a paragraph of body text?
- **`random()` has no seed.** Untestable. Add `random(min, max, seed:)` or a global `seed()` function.

### Things to celebrate (genuinely)

- **The trigger-variable pattern in §Async being mandatory rather than aspirational.** Compile-time rejection of `fetch("..." + bound_var)` is the right call. Most languages would let users foot-shoot themselves and call it "flexibility."
- **Appendix D existing at all.** The runtime semantics being pinned by a multi-model prediction test is methodologically excellent. Most language specs leave this implicit and let the implementation decide. Keep this discipline.
- **`every` as its own reactivity class.** Not overloading `on X:` for time-driven reactivity is principled. Models will pattern-match correctly because the syntactic shape matches the conceptual class.
- **`emit` requires being inside an event handler.** Closing the "fire on mount" door before it opens is good — most reactive frameworks regret allowing it.
- **Background-only `card` token.** The asymmetric restriction is unusual and right — you genuinely don't want `card` as a foreground colour, and the type-level enforcement keeps the design system honest.
- **Object-update with `{base with ...}`.** Concise, immutable, doesn't require enumerating all fields. Better than React's `{...x, y: 1}` because it reads left-to-right.

---

## Bottom line

It's a thoughtful spec that holds together better than most v0.x DSLs I've seen. The reactivity model and the "one way" discipline are the strongest parts. **It's not v1.0-ready yet.** The three things that would block me from using it in production are: no testing infrastructure, no accessibility primitives, no animation primitives. The structural risks (flat shared namespace, no memoization escape, JSON-only fetch) are addressable but easier to fix now than after lock-in.

If you're building toward v1.0 and have to pick three priorities: **testing, accessibility, animations.** Everything else can wait.
