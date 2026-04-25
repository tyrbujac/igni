**Question 1 — Each / every semantic parallel**

The semantic parallel holds loosely at the concept of "language-driven iteration," but breaks down when you contrast their outputs. 

(a) The parallel definitely strains around variable reassignment. In current Igni, `each` is a declarative, render-only construct used to stamp out UI primitives based on a list. It does not typically mutate state. `every`, however, is purely imperative—its entire purpose in the proposed design is to execute statements and reassign variables to trigger lexical reactivity. One builds UI; the other mutates state. They are siblings in control flow, but not in side effects. 

(b) Despite this, a model trained on Igni's surface would likely predict `every`'s mounted-only lifecycle correctly. Just as an `each` block ceases to exist when its parent screen or conditional unmounts, an `every` block conceptually belongs to the screen's mounted instance. The intuition that "things inside a screen stop happening when the screen goes away" translates cleanly. 

(c) The lexical near-rhyme is ultimately a strength for skim-reading. While `each` and `every` look similar, the immediate trailing tokens (`item in items` versus `1s`) forcefully disambiguate them. Because Igni explicitly minimizes spec budget, reusing an established block-opener rhythm is far better than introducing a wholly alien keyword structure like `loop` or `recurring`.

**Question 2 — User-action invariant on `on X:`**

The argument that `on X:` exclusively means "the user did something" is logically coherent for the existing surface, but it feels slightly brittle when projecting into the language's future. 

(a) Under strict scrutiny, `on change:` currently upholds the invariant because it maps to user-driven input interactions (typing, toggling). Even if programmatic reassignment triggers it in edge cases, the conceptual model is rooted in DOM/Flutter user interaction. 

(b) The real test of this invariant is future non-user events. If v0.X introduces websockets or geolocation, do those become `on message:` and `on location_change:`? If they do, the user-action invariant breaks entirely, revealing that `on X:` actually just meant "asynchronous event," making the rejection of `on tick:` less sound. Alternatively, if the invariant holds strictly, network events will require their own new keywords (perhaps `upon message:`). Assuming the spec authors intend to defend this class boundary long-term, Shape A is the correct choice. 

(c) Setting the invariant aside, the new keyword `every` is still worth the cost. `on tick:` implies an event stream that might be passed around, debounced, or attached to arbitrary primitives. `every 1s:` is unambiguously an autonomous, top-level loop. It reads better, and the duration argument provides a much cleaner path for variable rates than bolting rate modifiers onto an event handler.

**Question 3 — Duration token whitelist**

Restricting v0.14 to `1s` only is a misapplication of spec discipline that will generate unnecessary friction. 

(a) Shipping only `1s` is artificially restrictive. The design note openly acknowledges that real apps need this primitive for animations, debounced typing, and auto-saves. None of these can be accomplished at 1Hz. By gating faster rates behind a future release, the primitive fails to solve the very friction surfaces it identified, save for the Pomodoro timer. 

(b) The whitelist UX here will absolutely drive LLM churn. An LLM tasked with building a stopwatch or an auto-save feature will naturally write `every 100ms:` or `every 5s:`. It will hit a parse error, waste a turn, and likely attempt to hallucinate a manual recursive function to bypass the restriction. 

(c) There is a trivial middle ground: ship `1s`, `100ms`, and `5s` together in v0.14. Extending a lexer whitelist adds virtually zero spec-learnability tax—an LLM easily understands that `100ms` and `1s` are valid tokens for a duration argument. It honors the token-first rule without arbitrarily crippling the feature's utility for the documented use cases.

**Question 4 — One `every` block per screen**

The pre-emptive rejection of multiple `every` blocks is the weakest architectural decision in the design note and actively violates Igni’s goal of avoiding "bracket hell" and boilerplate.

(a) Real-app cases for composing different rates are ubiquitous. A dashboard screen might need to increment a local "time since last updated" counter every `1s`, while actually polling the live data every `30s`. 

(b) Models trained on Igni will naturally write two separate `every` blocks for these two distinct logical concerns. Hitting a parse-time rejection for multiple blocks will feel highly surprising, as almost no other modern UI framework restricts developers to a single timer per view. 

(c) The proposed workaround—composing multiple recurrences via shared timestamps inside a single `1s` block—is outright hostile to readability. It forces developers and LLMs to write manual modulo math or manual timestamp-delta tracking inside `if` statements just to fire a 30-second event. This is exactly the kind of imperative boilerplate Igni claims to replace. If `every` is a block-opener peer to variable declarations, there is no conceptual reason to artificially limit it to one per screen. 

**Question 5 — Lifecycle: mounted-screen-only**

The mounted-screen-only lifecycle is the correct default for a UI-first language, but it requires careful teaching regarding absolute versus relative state changes.

(a) For a global session timer, pausing on unmount is catastrophic—the user navigates away, navigates back, and their expiration timer has essentially gained free time. 

(b) For a polling fetch on a Settings screen, pausing is usually acceptable, though it means the user might see stale data for a split second upon returning before the next tick fires. 

(c) The most severe user-visible glitches will occur in countdowns (like Pomodonut) if they are written using relative math. If a model writes `remaining = remaining - 1` inside an `every 1s:` block, navigating away for ten seconds and returning will result in the timer having "lost" ten seconds of real time. To avoid this glitch, the timer must calculate remaining time against an absolute, non-pausing wall-clock reference (e.g., `now = format_time()`). 

Ultimately, the mounted-only lifecycle is right for screen-scoped `every` because tying background tasks to unmounted UI is a classic source of memory leaks. However, the exact use cases that fail under this lifecycle (global session timeouts, persistent live-data fetching) prove that an app-scoped or `shared:` version of `every` will be strictly necessary in v0.15+. Keeping them separated into distinct releases is sound, provided the cheatsheet nudges LLMs toward calculating time differences via absolute timestamps rather than relative decrements.