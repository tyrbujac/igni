Here is a critique of the Igni Studio product concept, evaluated strictly against the provided Igni v0.19.1 cheatsheet.

### Q1 — Round-trip claim
**FLIP**

The premise that "canvas and source have a 1:1 mapping" holds true for *layouts*, but completely breaks for *logic and state*. A visual canvas inherently represents spatial layout and current visual state; it has no native vocabulary for non-spatial language primitives. 

To maintain the round-trip claim, Igni Studio would have to invent graphical representations for pure text structures, or force users to drop into the text panel to edit them. Specific cheatsheet shapes that resist visual round-tripping:
1. **The derived state function rule:** A user visually binds a "Total" label to `count * price`. Does Studio generate `total = count * price` (which the cheatsheet warns is a top-level capture that never updates) or `total(): return count * price` (the correct reactive tracking)? A drag-and-drop canvas can't infer this intent.
2. **Hidden conditional branches:** In `if user is loading: spinner else: label user.name`, the canvas can only render one branch at a time. To visually edit the `error` state, the user needs non-canvas scaffolding to force the visual state.
3. **List transformations and mutations:** `items = replace(items, target, {target with done: not target.done})`. There is no visual metaphor for a `{BASE with KEY: VALUE}` expression or a `filter()` lambda. 
4. **Time blocks:** `every 1s: tick = now()`. A canvas has no spatial representation for a recurring background loop.

To make the claim hold, Igni Studio must add a **State & Action Graph surface** (akin to Unreal Blueprints or node-based logic) to visually map variables, functions, `every` blocks, and `fetch()` calls. Otherwise, the "round-trip" only applies to UI primitives, while developers write 100% of the logic in the text panel.

### Q2 — Four-panel framing
**REFINE**

The "Canvas + Source + AI Agent + Live Preview (Green Flag)" framing over-includes modes and under-includes the actual driver of Igni applications: State.

I propose dropping the "Live Preview (Green Flag)" mode and replacing it with a **State Inspector**. 
* **Why drop Live Preview?** Igni's entire value prop is *lexical reactivity*—any variable reassignment automatically re-runs the screen. A Scratch-style green flag implies a compiled run state separate from the authoring state. Instead, the canvas should always be "live", responding instantly to variable changes. 
* **Why add State Inspector?** Because Igni relies on plain variables (`draft = ""`, `user = fetch(...)`) rather than observables or `setState()`, the only way to debug a canvas is to see the exact current value of those variables. The State Inspector allows the user to manually flip `selected = true` or mock `here = locate()` to see the canvas react immediately without writing a test.
* **The AI Agent** should not be a dedicated layout panel, but a transient command palette / ambient cursor context, freeing up horizontal real estate for Canvas + Source + State.

### Q3 — File structure scaling
**FLIP**

The proposed flat structure (`screens/` + `components/` + single `shared.igni`) will immediately collapse under a 3-developer, 50-screen workload due to a misreading of the Igni specification.

* **The `shared.igni` god-object failure:** The concept forces a single `shared.igni` file. The cheatsheet explicitly states: *"`shared:` blocks across multiple files compose into a single namespace — `auth.igni` declaring `shared: user` and `cart.igni` declaring `shared: items` makes both available everywhere."* Forcing 3 developers to funnel all cross-screen state into one file guarantees endless merge conflicts. 
* **The flat `screens/` namespace failure:** 50 screens in a flat folder is unmanageable. Furthermore, screens usually have colocated test files (`Login.igni` alongside `Login.test.igni`).

**Shape change:** Abandon the opinionated top-level folder structure. Because Igni has no imports and uses a single namespace for `shared:` and components, Studio should allow feature-based grouping: `features/auth/Login.igni`, `features/auth/Login.test.igni`, and `features/auth/state.igni` (containing `shared: user`). The compiler already handles this natively; the Studio shouldn't artificially restrict it.

### Q4 — Differentiation honesty
**REFINE**

The differentiation against visual builders is highly defensible; the differentiation against AI coders is vulnerable. 

* **FlutterFlow:** Igni Studio guarantees developers own human-readable, zero-boilerplate source code instead of exported proprietary spaghetti; FlutterFlow cannot close this without entirely rewriting its underlying engine.
* **Webflow:** Igni Studio compiles to native mobile/desktop platforms (Flutter) rather than just DOM/CSS; Webflow will not close this gap as they are strictly wedded to web technologies.
* **Bubble:** Igni Studio has zero vendor lock-in because everything lives in local `.igni` files you can edit in VS Code; Bubble structurally relies on proprietary hosting lock-in and will never close this.
* **Lovable:** Igni Studio forces LLMs to generate perfect UI using a highly restricted, token-only vocabulary (`transition: fade`, `max_width: tablet`, `spring(value)`) with no escape hatches to raw CSS/Flutter; Lovable allows React/Tailwind hallucinations, but will close this gap within 18 months as frontier models become better at writing standard web code flawlessly.
* **Cursor:** Igni Studio offers a deterministic, bi-directional visual drag-and-drop canvas; Cursor is currently text-only, but could theoretically close this gap within 18 months by building a visual DOM-to-code write-back preview pane.

### Q5 — Most likely failure mode + 6-month signal
**HOLD**

**Failure mode:** The visual canvas devolves into a read-only scaffolding viewer. Designers use the canvas to drag-and-drop the initial layout (`layout vertical`, `label`, `button`), but as soon as developers add interactive logic (`on change: validate()`, `spring(value)`, `every 1s:` blocks, or `mock fetch:` in tests), the visual builder becomes too cumbersome to safely manipulate the AST. Developers retreat entirely to the VS Code text editor, rendering the "Studio" just a heavy, buggy code viewer rather than a bi-directional editor.

**6-month signal:** Telemetry tracking the origin of AST mutations (Canvas vs. Text Editor vs. AI Agent) grouped by file age. If new files show a 50/50 split, but files older than 3 days show >95% of edits originating from the Text Editor or AI Agent, the bi-directional editing loop has failed in practice. If developers stop interacting with the visual canvas after day one, Igni Studio is just an IDE with a slow preview pane.