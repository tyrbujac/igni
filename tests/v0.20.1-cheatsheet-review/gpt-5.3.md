**Q1 — What's strongest?**

The strongest teaching move is the **"Complete App" early**. The Todo example earns its place: it touches local state, binding, events, conditionals, iteration, object literals, and screen-local functions without becoming "framework demo soup." It creates a stable mental model early: screens are stateful scopes, rendering is declarative, reassignment drives re-evaluation. That's the core of the language, and the cheatsheet makes it visible fast.

The **Reacting to users** section is the clearest semantic core. In particular, "top-level assignments run once" versus "functions track" is unusually well taught. That distinction is where reactive languages usually get vague; here it's explicit, repeated, and illustrated with the exact footgun (`total = count * price`). The "captures vs tracks" framing is memorable and operationally useful.

The **event model** is also strong. `on tap`, `on touch`, `on change` is a small, coherent surface. The distinction between user-driven and programmatic changes for `on change` is especially crisp — that's the kind of behavioural precision that avoids bugs.

The **animation split** (`transition:` for structural change, `spring()` for value change) is excellent API design and well explained. This is one of the few places where the cheatsheet actively prevents misuse instead of just documenting features. "They never overlap" is strong pedagogy.

The **testing model** reads cleanly because it mirrors the language instead of inventing test DSL weirdness. `render`, `tap`, `change`, `expect seen`, `mock fetch`, `mock every` all feel like direct extensions of the runtime model. That consistency matters.

The strongest overall teaching pattern: **rule → pitfall → canonical shape**. The document does this repeatedly (derived state, list updates, input/shared bridging, `round()` returning string), and it works.

---

**Q2 — What's weakest?**

The weakest section is **Theme / Dark mode**. Not because the feature is bad, but because the prose density spikes hard. The introduction of `theme:`, nested `color:`, nested `text:`, structural `text:`, `theme dark:`, token inheritance, `shared.theme_mode`, runtime OS coupling, and transition exclusions all stack into one uninterrupted conceptual climb. It's doing too much at once.

Specifically: the "two `text:` surfaces" explanation is semantically correct but cognitively expensive. A reader now has to distinguish typography-space `text:` from colour-space `text:` purely by nesting. That's parsable, but expensive. This is the kind of thing that should be split into a "shape" explanation and then examples.

The **Recurrence** section is overly long for its semantic payload. The lifecycle detail ("resume schedules next tick from resume moment") matters, but the section keeps layering: lifecycle, wall-clock correctness, multiple blocks, duration whitelist, skipped fetch overlap. It stops feeling like a cheatsheet and starts feeling like runtime notes.

The **Testing** section is very strong conceptually but oversized for a cheatsheet. It's practically a mini-spec. Snapshot semantics, `spring()` snapshot determinism, `mock now`, `freeze_time`, time advancement coupling — all valid, but too much inline for this format.

The **Lists** section has too much behavioural density around identity vs structural equality. The object equality trap belongs conceptually in core equality semantics, not embedded adjacent to list mutation APIs.

The **Border** subsection feels overweight relative to importance. Selected-state patterns, outlined-button workarounds, token rejection rules — that's a lot of ink for a single property.

The recurring pattern of "here is the rule, here is the exception, here is the exception to the exception" is useful in semantic sections but bloats stylistic ones.

---

**Q3 — Where is genuine semantic uncertainty?**

The biggest unresolved runtime question is **function dependency tracking**.

You say reactivity follows references through function calls. But what exactly is tracked? Dynamic dependency graph? Lexical capture? Full function-body dependency? Example:

If `total()` conditionally reads `discount` only when `premium` is true, and `premium` is false during the initial render, does changing `discount` trigger anything? That's unclear.

Related: if a function calls another function, how deep does transitive dependency analysis go?

Second major uncertainty: **async invalidation semantics**.

If `user = fetch("/api/user/" + id)` and `id` changes rapidly:

* Is the old request cancelled?
* Can stale responses win?
* Is there request deduplication?
* Does `is loading` reset immediately on parameter change?

The document explains re-fetching, not request lifecycle.

Third: **shared state atomicity**.

If multiple screens update `shared.cart` nearly simultaneously, what happens? Is `shared.update()` transactional? Last write wins? Merge semantics? Race semantics matter here.

Fourth: **navigation lifecycle and state persistence**.

You state top-level assignments run once "when the screen first opens." But on `navigate back`, does the previous screen instance persist or reconstruct? The recurrence section implies pause/resume, which implies retention, but this should be explicit as a general rule.

Fifth: **component identity**.

Components re-evaluate with parent, but what defines identity in a list? If `each item in items:` renders `Avatar item.url`, is component-local state (if introduced later) tied to item identity or tree position? The animation section implies row identity exists, but component identity rules are unstated.

Sixth: **null propagation depth**.

`questions[bad_index].text` propagates null. But does method invocation null-propagate? `user.profile.name.upper()`? Or does null propagation stop at field access?

Seventh: **fetch caching**.

Is `fetch("/api/user")` memoised per URL? Repeated? Fresh every render? It matters because the language encourages declarative placement.

---

**Q4 — Cross-language-prior check (v0.20 surface)**

**Theme variant pairs (`theme:` + `theme dark:`)**

This maps cleanly to SwiftUI's environment-driven theming and Jetpack Compose's Material theme overrides. Readers will largely guess right: "dark variant overrides light variant."

Where prior misleads: CSS `prefers-color-scheme` teaches media-query branching, not variant inheritance. Igni's inheritance model is closer to token patching than mode-specific stylesheets. That's good, but not the default web mental model.

**Structural sub-blocks (`scaffold`, `appbar`)**

Compose prior helps a lot here because `Scaffold` is already a first-class layout concept there. Flutter prior also helps because of Flutter's `Scaffold` and `AppBar`.

SwiftUI prior hurts slightly because there isn't the same chrome-object mental model; navigation and container styling feel more distributed.

The danger is naming: `text:` under theme means typography, but `text:` under color means token. That violates the "one meaning per word" instinct from all these ecosystems.

**`shared.theme_mode` selector**

This is familiar from app settings everywhere. `"system" | "light" | "dark"` is predictable.

Where it diverges from CSS prior: in CSS, system preference is ambient and passive. Here it's stateful and assignable. That's stronger and more explicit, but users may not expect "system" itself to be mutable state.

**Auto-fall-back rule**

This is the best-designed part. Tailwind and design-token systems train people to expect sparse override maps. This will feel natural.

The only risk: some readers will assume absence in dark means "use default dark token," not "inherit light token." That's subtle.

**`spacing/N` scale**

This lands very cleanly for Tailwind CSS users. Probably the cleanest v0.20 addition.

The only mismatch: Tailwind teaches a denser scale and arbitrary escape hatches. Igni does not. A Tailwind user will instinctively reach for `spacing/7` or arbitrary pixel values. The whitelist constraint needs stronger surfacing.

Biggest divergence overall: SwiftUI/Compose users expect arbitrary numeric spacing; Tailwind users expect token scales. Igni is choosing Tailwind here.

That's a good choice, but should be explicit.

---

**Q5 — Fit and limits**

**(a) Designer/developer collaboration tool (canvas, source editor, inspector, AI layer)**

Igni fits well as the **document format** here, less so as the full implementation language.

Its strongest asset is readability. `screen`, `layout`, `label`, `button`, `shared:` — these are inspectable by humans and LLMs. That's a strong substrate for AI-assisted editing, design diffs, and structural introspection.

The theme system and token discipline help here too: agents can reason over named design decisions.

Where it hits walls: interactive editor infrastructure. Canvas zoom/pan, selection models, drag handles, keyboard shortcuts, undo stacks, graph-like state inspection — those need richer event systems and lower-level rendering control.

I'd use Igni for the UI shell and editor panels, but I'd expect escape hatches into Flutter for the actual canvas engine.

**(b) Personal knowledge / notes app**

This is a very good fit.

Multi-screen navigation maps directly. Shared state covers note collections and settings. Local state handles drafts. `fetch()` can handle sync. `every` can support autosave or relative timestamps.

The language is especially strong for CRUD-heavy apps: list of notes, detail screen, settings screen, filters.

Weak spots:
rich text editing. The input primitive looks too primitive for structured text editing.
Search debounce is awkward because `fetch()` reacts to state changes immediately and the document explicitly warns against binding fetches to input.

Offline persistence is also absent from the model.

But for a standard markdown-ish notes app? Strong fit.

**(c) Internal data-entry/dashboard tool**

Probably the best fit of the three.

Forms map directly to `input`, `toggle`, `dropdown`, `slider`.
Validation maps to `on change`.
Tables/lists map to `each`.
Dashboards map to layouts, labels, and polling via `every`.

The token-only layout discipline is actually an advantage here: consistency beats expressive freedom.

Where it breaks:
complex grids,
virtualised long tables,
drag-drop,
advanced charting,
custom gestures.

At that point I'd reach for Flutter directly or web (depending on deployment needs).

Overall:

Igni looks strongest in the **80% app category** — CRUD, dashboards, forms, content apps, utility apps.

It looks weakest where you need:
highly custom interaction models,
fine-grained rendering control,
advanced async orchestration,
or complex editor-like behaviour.

That's not a flaw. The cheatsheet mostly communicates that boundary honestly. The main thing it needs is sharper signalling about where the abstraction intentionally stops.
