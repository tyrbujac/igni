---
model_label: gemini 3.1 pro
input_tier: spec
input_path: spec/v0.17.0.md
date: 2026-04-27
---

This is a remarkably cohesive and deeply opinionated specification. The north star of "Flutter without the bracket hell" combined with the philosophy that "the spec is a budget, not a backlog" results in a DSL that is aggressively optimized for its target audience. The discipline to reject feature creep (like inline hex colors, custom width pixels, or deep object mutations) in favor of one canonical way to do things is exactly how great, focused tools are built.

Here is an analysis and rating of Igni across your requested axes, followed by structural feedback for the road to v1.0.

### 1. Readability
**Definition:** How easily a visual thinker (a designer-engineer hybrid) can look at the code and map it to a UI tree and interaction flow without drowning in syntax, brackets, or state-management boilerplate.
**Score: 9.5/10**
**Anchor:** Better than SwiftUI (8/10); drastically better than Flutter (4/10).
Igni reads like a highly structured markdown or wireframe document. By stripping away `children: []` arrays, trailing commas, and explicit `setState` or `@Binding` wrappers, the signal-to-noise ratio is nearly perfect. A designer can read the `Todo` example and understand the layout geometry and state flow immediately.

### 2. LLM Accuracy
**Definition:** The probability that a frontier model can generate syntactically and semantically correct code purely from the provided spec, zero-shot, without hallucinating APIs or breaking structural rules.
**Score: 8.5/10**
**Anchor:** Better than Flutter (6/10 due to bracket nesting/context loss) and SwiftUI (7/10 due to hallucinated modifiers).
LLMs excel at indentation-based scoping (Python is the lingua franca of LLM training data) and struggle with deep bracket nesting. Igni's strict "one way to do things" and minimal keyword surface area mean an LLM has very few paths to hallucinate. The only reason it isn't a 10 is that implicit typing and implicit object structures sometimes cause LLMs to hallucinate properties on objects that don't exist in the actual data model.

### 3. Speed
**Definition:** Developer iteration speed—the time elapsed from an idea in the developer's head to a functioning, interactive prototype on the screen.
**Score: 9/10**
**Anchor:** Faster than React (7/10 due to hook wiring) and Flutter (6/10 due to widget boilerplate).
The combination of zero-config default visuals, lexical reactivity (no controllers or observers to wire up), and automatic hot reload makes this a prototyping powerhouse. "Three commands to first pixel" is a reality here.

### 4. Cost
**Definition:** LLM Token Cost—the number of output tokens required to generate a complete, functioning screen.
**Score: 9.5/10**
**Anchor:** Significantly cheaper than HTML/CSS (6/10) and Flutter (4/10).
Because Igni omits semicolons, curly braces for scope, explicit typing (mostly), import statements, and `build()` method signatures, it is incredibly terse. Generating an Igni app will cost a fraction of the tokens required to generate the equivalent Flutter Dart code.

### 5. Testing
**Definition:** The ability and ergonomics for a developer to write reliable unit and integration tests that assert UI behavior and state transitions.
**Score: 3/10**
**Anchor:** Worse than React Testing Library (8/10) or Flutter Widget Tests (7/10).
The spec currently has no testing story. Because state is heavily tied to the lexical scope of the `screen` body, and `shared:` state is a global flat namespace, isolating components or screens to assert their behavior programmatically without spinning up the whole transpile/runtime environment will be difficult.

### 6. Added Axis: Architectural Scalability
**Definition:** How gracefully the language handles an app growing from a 3-screen prototype to a 50-screen production app with complex data dependencies and domain logic.
**Score: 5/10**
**Anchor:** Worse than Flutter (8/10) or React (7/10).
Igni's constraints are its superpower for prototyping, but they become friction at scale. The flat global namespace for `shared:` variables will cause collisions in large teams. The inability to do deep object updates cleanly will result in massive boilerplate when dealing with complex, nested JSON APIs.

---

### The Road to v1.0: Biggest Things to Consider

#### The Smells & Risks
* **The Flat Global `shared:` Namespace:** Appendix D.13 states that same-name collisions across files break the build. In a 50-screen app built by three people, names like `shared.selected_item`, `shared.status`, or `shared.draft` will inevitably collide. You need some form of namespacing (e.g., `shared.auth.user` or referencing the file it came from implicitly) before v1.0, or developers will be forced to write `shared.auth_user_status` anyway, defeating the clean syntax.
* **Shallow Object Updates vs. Real APIs:** The `{target with profile: {target.profile with name: "X"}}` constraint is logically sound but painful in practice. Real-world JSON is heavily nested. If Igni is intended to consume standard web APIs via `fetch`, developers will spend an inordinate amount of time writing nested `with` blocks.
* **D.8 Component Rebuilds & Keystroke Reactivity:** If an `input` is bound to a variable, the screen re-evaluates on every keystroke. If that screen contains an `each` loop rendering 100 `PostCard` components, Appendix D.8 says every component rebuilds. Even if Flutter's element tree diffs the paint layer efficiently, re-running the Igni block for 100 items per keystroke *will* cause jank on low-end mobile devices. You may need an implicit `memo` boundary for components.
* **Opaque Async Errors:** Abstracting 404s, 500s, 204s, and non-JSON responses entirely into `is error` without exposing a status code limits the developer's ability to handle auth expirations (401 vs 500). "Couldn't load" is fine for a prototype, but production apps need to intercept 401s to trigger a logout flow.

#### The Triumphs (Things to Celebrate & Protect)
* **Lexical Reactivity:** Stripping away state management libraries in favor of "if it's in the text and reassigned, it reacts" is brilliant. It drastically lowers cognitive floor for new developers.
* **The "No Pixels for Layout" Rule:** Forcing users into `gap: medium` and `max_width: phone` is a masterclass in UI constraint. It prevents developers from pushing pixels and accidentally ruining responsive design. Hold the line on this.
* **The Trigger-Variable Pattern for Async:** Explicitly rejecting `fetch("..." + input_bound_var)` at transpile time is excellent framework design. It catches a massive footgun early and enforces a clean architectural pattern (explicit user intent to fetch) directly in the compiler.
* **Discard Form for Events:** `on X(_):` as the universal marker for "payload exists, but I don't care" is a great adoption of established conventions that keeps readability high.

Igni reads like a breath of fresh air for front-end development. Given the rigid global nature of `shared:` state, how do you envision a larger team managing domain logic and background tasks that don't neatly fit into a single UI screen's lifecycle?
