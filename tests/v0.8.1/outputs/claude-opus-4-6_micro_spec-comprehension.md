- **What it is:** Igni is a declarative, indentation-based, syntax-only micro-language for describing user interfaces — screens, layouts, components, state, and navigation — without an underlying general-purpose host language or build toolchain.

- **Best suited for:** Simple, screen-based interactive applications such as mobile apps, dashboards, and form-driven tools — anything composed of labeled screens with state, lists, user input, and straightforward navigation between views.

- **What it optimizes for:** Minimal cognitive overhead and one obvious way to do everything — a tiny set of built-in primitives, design tokens instead of raw CSS, automatic reactivity on variable reassignment, and no aliases or multiple paths to the same result.

- **How it differs from framework-heavy UI code:** There is no JSX/HTML/CSS split, no import system, no component lifecycle, no explicit state-management library, and no build step; layouts, styling, data fetching, and event handling are all expressed with a uniform colon-and-indentation syntax using a fixed vocabulary of keywords and tokens.

- **Key constraints to remember:** Nesting depth is capped at 4 layout levels (conditionals/loops don't count; components reset the count); screen and component arguments are immutable; list elements cannot be mutated in place (you must reassign the whole list); primitives like `label` and `button` may only appear in screen/component bodies, never inside functions; and cross-screen communication must go through `shared:` state, not function calls.