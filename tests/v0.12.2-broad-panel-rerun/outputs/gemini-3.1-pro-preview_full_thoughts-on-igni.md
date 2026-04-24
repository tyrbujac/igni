Here is a detailed, honest review of Igni based on the provided reference materials. 

### 1. One-paragraph summary
Igni is a declarative, research-stage UI programming language that transpiles to Dart/Flutter, aggressively optimized for two things: human readability and zero-shot LLM output accuracy. It achieves this by stripping away the structural noise of modern UI frameworks—removing brackets, parentheses on component invocations, `useState`/`setState` boilerplate, and complex widget trees—in favor of indentation, strict lexical reactivity, and a rigid "one-way-to-do-everything" philosophy. Aimed squarely at developers heavily utilizing AI assistants, Igni operates on the hypothesis that minimizing syntactic ambiguity (like eliminating ternaries and multi-parameter lambdas) makes the language simultaneously easier for frontier models to generate flawlessly and dramatically cleaner for humans to read. 

### 2. What works
*   **Lexical Reactivity**: This is the crown jewel of Igni. The rule that *“each screen re-evaluates from the top whenever any variable it lexically references is reassigned”* (Spec §Reactivity) is a massive cognitive relief. Eliminating `useState`, dependency arrays, and observable wrappers in favor of `count = count + 1` makes the mental model incredibly flat. 
*   **Native Async States**: Baking `loading` and `error` states directly into the language via the `fetch` and `locate()` primitives (Spec §Async Data) is brilliant. Writing `if user is loading:` instead of wrestling with Flutter’s `FutureBuilder` or React’s `try/catch/finally` loading flags removes a notoriously tedious class of boilerplate.
*   **Component Invocation Syntax**: Dropping parentheses and brackets for component invocation (`Avatar user.avatar, size: 80` instead of `<Avatar url={user.avatar} size={80} />`) genuinely makes the code read like a designer's specification document. It forces a clean, left-to-right reading flow.
*   **The Object Update Pattern**: Using `{target with field: newval}` paired with `replace(items, target, ...)` (Spec §Lists — transformations) is a very smart compromise. It enforces immutability without requiring deep-clone libraries or spread-operator gymnastics.
*   **Design Tokens over Pixels**: Enforcing `gap: medium` and `color: brand` at the compiler level (Spec §Styling) is a great guardrail. It prevents the "magic number" UI drift that plagues standard Flutter and React codebases.

### 3. What worries me
*   **The Reactive Fetch Footgun**: The fact that you have to implement a compiler-level rejection for `fetch("..." + bound_var)` (Spec §Async Data) exposes a slight conceptual leak in the reactivity model. Forcing the user to manually wire up a "trigger variable" (`active = query` on a button tap) requires introducing shadow state. This feels like the exact kind of boilerplate Igni otherwise tries to eliminate. 
*   **Performance and Render Boundaries**: The spec says "each screen re-evaluates from the top". If I have a paginated list of 500 items and a user types into a bound `input` (updating a variable on every keystroke), does the entire Flutter widget tree rebuild? Modern frameworks rely on `memo` or fine-grained signals to stop cascade renders. If extracting a component doesn't implicitly isolate render boundaries, complex Igni apps might hit severe performance cliffs.
*   **The "Multi-view screens" tactical pattern**: In Spec §Conditionals, the language sanctions using root-level `if/else` blocks to toggle between a List and a Detail view. This is a dangerous pattern to officially recommend. It breaks platform-native navigation (the hardware back button on Android, URL routing on Web) and encourages "God files."
*   **String + Number Coercion**: Spec §Variables notes that `+` coerces numbers to strings (`"Score: " + 100`). While convenient, dynamic coercion is historically a massive source of silent bugs in languages like JavaScript. It violates the "zero magic" rule slightly. 

### 4. Comparisons
*   **Flutter**: Igni dominates Flutter in readability. It eliminates `BuildContext`, `StatefulWidget` boilerplate, and the infamous "bracket hell" of deeply nested widget trees. However, Igni loses to Flutter in expressiveness; by intentionally omitting animations, custom canvas drawing, and the Pub package ecosystem, Igni trades power for simplicity. 
*   **SwiftUI / Jetpack Compose**: Igni is closest to these two. It shares their declarative, modifier-driven layout philosophy (e.g., `layout vertical, padding: large:`). Igni has an edge in state management—you don't need `@State` or `remember {}`—but loses in deep platform integration and complex gesture handling.
*   **Svelte**: Svelte shares Igni's "reassignment equals reactivity" philosophy. Igni feels like taking Svelte's `<script>` block reactivity and applying it to a strictly indentation-based template language like Pug or Python.
*   **Elm**: Igni shares Elm's rigidness ("one way to do everything"), but is much more pragmatic. Where Elm forces you into a strict Model-View-Update architecture with messages, Igni gives you the `shared:` block (Spec §Shared State) as a practical, highly-visible global state escape hatch.

### 5. What I'd change
If I joined the project, I would push for these two scoped changes for the v1.0 roadmap:

1.  **Add an `on submit:` event to inputs to kill the trigger-variable boilerplate.** 
    Instead of forcing the user to create a shadow variable (`active`) and a dedicated button just to stop `fetch()` from spamming the API on every keystroke, allow `input` to capture the "Enter/Return" key. 
    *Current boilerplate:*
    ```igni
    query = ""
    active = ""
    results = fetch("/api?q=" + active)
    input bind: query
    button "Search", on tap: active = query
    ```
    *Proposed change:* Let `on submit:` fire an event natively.
    ```igni
    query = ""
    results = fetch("/api?q=" + query) # compiler allows this if 'query' is updated discretely
    input bind: query, lazy: true # or 'input placeholder: "...", on submit: fetch(...)' 
    ```
    Alternatively, bake a `debounce: 500ms` modifier into `bind:` to embrace the reactivity fully without the footgun.

2.  **Remove the "Multi-view screens" pattern from the documentation.**
    In Spec §Conditionals, rewrite the Notes app example to strictly use `navigate to` and the `shared:` block. Recommending developers fake navigation with `if selected is null:` creates apps that violate basic web/mobile UX expectations (like the browser back button). Igni's `shared:` state is already elegant enough to handle List/Detail data sharing cleanly; the documentation should enforce standard navigation patterns to ensure transpiled apps feel like native software.