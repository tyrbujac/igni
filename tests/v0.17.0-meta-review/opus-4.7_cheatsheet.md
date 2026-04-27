---
model_label: opus 4.7
input_tier: cheatsheet
input_path: spec/v0.17.0-cheatsheet.md
date: 2026-04-27
---

Reviewed it carefully. Honest read below.

## Definitions and scores

**Readability — for a designer-engineer.** Score: **8/10.**
Anchor: SwiftUI 7, Flutter 5, JSX 6, HTML+CSS 6.
The 17-line Todo is genuinely shorter than the equivalent in any of those, and the colon-block syntax is closer to a design spec than to code. Beats SwiftUI on hello-world ceremony (no struct, no `View` protocol, no `body` accessor). Loses small points to indentation-language ailments — copy/paste sensitivity, refactor-across-nesting, the colon-after-everything visual noise.

**LLM accuracy — zero-shot from this spec.** Score: **6/10 simple apps, 4/10 complex.**
Anchor: I'd put myself at 6/10 zero-shot on Flutter, 5 on SwiftUI for anything stateful.
Igni's design is LLM-friendly in the obvious ways — no imports, one way to do things, reactive model is just assignment. But the gotcha density is high and several rules are non-obvious enough that I'd reliably trip:
- `derived = base * 2` at top level capturing the *initial* value of `base` is the kind of rule I'd violate constantly.
- "Declare at top of screen body" — I'd write `if x: total = 1` and read `total` after.
- `is` doing structural-for-primitives / reference-for-objects is a footgun. I'd write `selected_method is {id: 1}` thinking it'd match.
- No string interpolation — I'd type `"${name}"` reflexively.
- `input bind: shared.X` rejected but `slider bind: shared.X` accepted — exception worth one error per session.
- `every` only supporting 1s/5s/30s — I'd write `every 100ms:`.
- `emit X v` ↔ `on X(name):` signature mismatch — I'd misalign these on first try.

**Speed — developer iteration.** Score: **9/10.**
Anchor: SwiftUI previews 8, Flutter hot reload 7, React+Vite 7.
Hot reload + minimal boilerplate + no build-system ceremony is faster than any of those. *If* hot reload is as fast as Flutter's claim. Compile and runtime speed are bounded by Flutter itself — no concern, no advantage.

**Cost — LLM token generation.** Score: **8/10** (low = good).
Igni source is dense; per-feature it's roughly half the tokens of equivalent Flutter. Net cost depends on retry rate from the gotchas above.

**Cost — cognitive for a human.** Score: **6/10.**
Looks simpler than it is. The cheatsheet is ~700 lines. Lexical reactivity is one rule but it has at least three non-obvious corollaries (initial-vs-current capture, transitive reach, programmatic vs user-driven `on change:`). Designers will write Igni and ship bugs they can't explain.

**Testing — vs what I'd expect at v1.0.** Score: **2/10.**
Spec is silent. No snapshot tests, no interaction tests, no golden images, no mocks for `fetch`/`locate`. SwiftUI ships with `XCTestCase` + ViewInspector ecosystem, Flutter has `flutter_test` + golden_toolkit. This is a real hole, not a "v1.x" item.

**Error messages.** Can't score — no examples. The phrasing "rejected at parse time" and "compile-time error" suggests intent. Show three actual error messages in the docs.

**Debugging.** Score: **3/10.** Only `print()` shown. For a reactive language you want a state-flow inspector — what changed, who re-rendered, why. Without that, "the layout didn't update" debugging is going to be guesswork.

**Accessibility.** Score: **0/10** (nothing exists to score). SwiftUI has accessibility traits, Flutter has Semantics. Igni: nothing. For a 2026 UI language this is a publishable-quality bug.

**Animation.** Score: **0/10.** Not in spec. No implicit animations, no transitions, no spring. A UI language without animation is shipping in the wrong decade.

## Before v1.0 — substantive

**1. Testing story is non-negotiable.** Pick a model — Flutter's widget tester is the obvious wrap — and surface it with Igni-native ergonomics. Without this, no one ships production Igni.

**2. `is` overload is a footgun.** Structural for primitives, reference for objects, with no syntactic distinction, is exactly the kind of rule that quietly poisons code. Either go fully structural (canonical equality on values) or split operators (`is` for reference, `==` for value). Pick one and document it as one rule, not two-with-a-table.

**3. "Declare at top of screen body" is a hostile constraint.** I understand the implementation reason (lexical scope for reactivity tracking), but Python and Swift handle equivalent reactivity without forcing this. The accumulator pattern is fine; the rejection of legitimate inner-scope use cases isn't. Re-examine.

**4. No string interpolation.** Add it. `"Hello, ${name}"` or `"Hello, {name}"`. The cost of `+`-concatenation in real apps with i18n is high.

**5. Sub-second `every` is missing.** Games, instruments, animations, gesture-driven UIs — none of those work with 1s minimum. Promising "v0.15+" is fine for a v0.17 spec but blocks real apps from shipping.

**6. `fetch` reactivity needs an escape hatch.** The "set a separate trigger variable" pattern works but is unprincipled — it's a workaround for the abstraction leaking. Consider an explicit `fetch.on(trigger)` form or a debounce primitive.

**7. Cross-screen function rule will force giant `shared:` blocks.** Real apps share logic, not just state. Add screen-less utility modules or accept that `shared:` will become a dumping ground.

**8. Null propagation is a designer-friendly default that becomes a production-app liability.** `questions[bad_index].text` quietly returning null and rendering nothing is exactly the kind of bug that ships. Add a `??` default operator or Optional sugar.

**9. No platform escape hatch documented.** What happens when someone needs a native module? Camera? File picker? Push notifications? If the answer is "wait for us to add it," you have a DSL ceiling problem. Document the FFI / native-channel story now.

**10. `each` performance / identity story.** No mention of keying. Long lists will re-render per parent re-eval. Spec needs to say what makes an item "the same item" for diffing.

**11. Border tokens only is principled but rigid.** Designers ship 1px and 1.5px borders constantly. Either accept token-only and live with the friction, or add a `theme: border:` block analogous to `theme: color:` so projects can extend the vocabulary without inline pixels.

**12. Animation, accessibility, forms validation.** Three orthogonal v1.0 gaps. Each is a multi-week design problem. Don't ship v1.0 without at least animation and accessibility — the others can wait.

## What's good

The lexical-reactivity-via-assignment model is the right primitive. No `setState`, no signals, no observables — assignment as the only state mutation, function calls as derived values. This is the cleanest reactive model I've seen in a UI DSL and it's the genuine reason to build Igni rather than a Flutter wrapper.

Themes-only-via-tokens with inline-hex rejection is enforced design correctness and rare to see at a language level. Good taste.

`shared.` prefix as visible coupling marker is the right call. Flat `shared:` namespace across files with same-name collision as build error is the right call.

`emit` + parent-scope handler for component events is a clean shape — better than React's prop-callback convention, comparable to SwiftUI's binding pattern but more explicit.

The cheatsheet writing itself is good — examples first, rules-as-quote-blocks, "Why doesn't state reset?" prose. Keep that style; don't let v1.0 docs grow into a reference manual.
