This is a remarkably well-thought-out language specification. Igni's commitment to lexical reactivity and severe constraints on styling produces a mental model that is refreshingly easy to hold in your head. It successfully captures the declarative joy of SwiftUI or Compose while stripping away the boilerplate and lifecycle management that usually accompany them.

Here is my review based on your questions.

### Q1 — What is strongest?

The explicit confrontation of the reactivity mental model is exceptional. By directly addressing the difference between top-level assignment (which captures once) and function definitions (which track ongoing changes), you immediately disarm the number-one footgun for developers coming from React, Vue, or Svelte. It is rare and highly effective for a language cheatsheet to anticipate a specific developer misconception and correct it inline.

Furthermore, the compiler-as-teacher approach to animations is brilliant. Rejecting invalid transitions with error messages that point directly to the correct primitive (instructing the user to switch between conditional swaps and value interpolation) turns a common point of frustration into a seamless learning experience. The strict token-only discipline for layout properties is also a massive strength; it removes micro-decisions and guarantees visual consistency.

### Q2 — What is weakest?

The dual spacing system actively contradicts your language's foundational rule: "One way to do everything. No aliases, no shortcuts, no alternatives." Offering both semantic word tokens (small, medium, large) and a numeric scale for the exact same pixel values is an alias. This will inevitably lead to team friction, style-guide debates, and mixed codebases—the exact problems Igni otherwise masterfully avoids. Pick one system and force the user to adapt.

Additionally, the explanation of bottom-anchored buttons using multiple fill-true containers feels like a CSS hack rather than a deliberate UI primitive. It forces the reader to thinkisible space consumption rather than semantic layout. Finally, the list mutation section is slightly cluttered; introducing object overriding in the middle of list operations breaks the conceptual flow.

### Q3 — Where is genuine semantic uncertainty?

**Component Local State:** The specification clearly explains that screens hold state, and that components accept immutable arguments. But it is entirely unclear if a component can hold its own isolated local state. If I want to build an expanding accordion component, can it manage its own internal boolean, or must that state be hoisted to the parent screen and passed down? The text implies the latter, but does not explicitly confirm it.

**Reactive Fetch Race Conditions:** You note that a network fetch automatically re-runs when its dependency variables change. But what happens if that dependency is bound to a text input? If a user types five characters rapidly, do five network requests fire? Does Igni automatically debounce this? Do they resolve out of order and cause UI tearing, or does the latest request win? The document explains how slow fetches behave inside recurring timers, but is dangerously silent on reactive fetch race conditions.

### Q4 — Cross-language-prior check

Tailwind developers are deeply conditioned to inline their dark mode overrides directly on the element. Igni's strict requirement for a centralized dark theme block is a severe paradigm shift. It is arguably better for long-term maintainability, but it will initially frustrate users who expect local, inline control. Conversely, the automatic fallback for missing dark tokens is a brilliant inclusion that perfectly mirrors how CSS custom properties cascade, so web developers will grasp it instantly.

The numerical spacing scale will make Tailwind and Bootstrap users feel right at home, as they are used to multiplying base units. However, SwiftUI users might stumble over the strict string-typing of the theme mode selector ("system", "light", "dark"); they will likely come in looking for an injected environment variable or an enum, and might find the bare strings slightly brittle until they understand the lexer constraints.

### Q5 — Fit and limits

**(a) Designer/Developer Canvas Tool:** Igni would be phenomenal for building the tool's surrounding chrome—the property inspectors, the toolbars, and the layer lists would snap together quickly. However, building the canvas itself in Igni would hit an immediate brick wall. A canvas requires granular gesture tracking, arbitrary absolute positioning, and continuous layout-dimension manipulation, all of which Igni explicitly bans by design. You would have to drop down to native Flutter for the canvas area.

**(b) Personal Notes App:** This is Igni's perfect strike zone. The reactive state handles list filtering effortlessly, shared state manages user preferences cleanly, and the navigation model is exactly what a notes app needs. The only potential hard limit would be the editing surface itself. If the app requires a rich-text editor with bold/italic text ranges or inline image embeds, Igni's standard input primitive is likely too basic, requiring a complex custom component escape hatch.

**(c) Internal Data Dashboard:** This is a mixed bag. Standard form entry, settings screens, and basic metric cards would fly off the keyboard. However, internal tools frequently rely on complex, resizable data grids, sortable tables with sticky headers, and interactive charting. Because Igni relies heavily on basic horizontal and vertical layout primitives and lacks advanced data-visualization components, building dense, interactive data tables would quickly become an exercise in fighting the layout engine. You would likely reach for a web stack instead.
