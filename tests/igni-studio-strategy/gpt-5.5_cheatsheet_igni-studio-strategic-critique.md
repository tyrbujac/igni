## Q1 — Round-trip claim

**Verdict: REFINE.**

The wrong premise is: **“No escape hatches” implies “canvas and source have a 1:1 editable mapping.”**  
What it actually implies is narrower: **Igni source is parseable, constrained, and easier to preserve than arbitrary Flutter/Dart.** That is not the same as saying every real app construct has a natural visual editing surface.

The claim holds for static and lightly interactive UI, but breaks once `.igni` becomes application code rather than layout description.

### Where round-trip breaks

Concrete Igni shapes from the cheatsheet that resist visual round-trip:

1. **Top-level assignment semantics are source-shaped, not canvas-shaped.**

   Igni has the subtle rule:

   > Top-level assignments run once when the screen first opens — “starts at,” not “resets to.”

   And:

   ```igni
   # ❌ captures once
   total = count * price

   # ✅ tracks changes
   total():
     return count * price
   ```

   A canvas can show `label total()`, but a designer-facing property panel must understand the difference between:
   - stored state,
   - initial state,
   - derived functions,
   - reactive dependencies through function calls.

   That is not Figma auto-layout vocabulary anymore.

2. **Function bodies are arbitrary screen-local logic.**

   Igni functions can contain `if`, `each`, accumulators, assignments, and `return`:

   ```igni
   total_price():
     total = 0
     each item in items:
       total = total + item.price
     return total
   ```

   This is round-trippable as AST, but not naturally round-trippable as canvas. Studio either needs a block/programming surface or admits “logic remains source-first.”

3. **List builtins and lambdas are compact source expressions.**

   ```igni
   done = filter(items, item => item.done)
   by_name = sorted(items, item => item.name)
   match = find(items, item => item.id is x)
   ```

   A canvas can display the resulting list, but editing `item => item.id is x` visually requires a query/filter builder. Otherwise the visual surface becomes read-only for real data-driven screens.

4. **Object update syntax is source-specific.**

   ```igni
   items = replace(items, target, {target with done: not target.done})
   ```

   The `{BASE with KEY: VALUE}` syntax is a great language feature, but it is not a visual primitive. Studio needs a “state update” editor that understands immutable list replacement, object spreading, and shallow overrides.

5. **Conditional state and async states are not just visual branches.**

   ```igni
   user = fetch("/api/user")

   if user is loading:
     spinner
   else if user is error:
     label "Failed"
   else:
     label user.name
   ```

   A canvas needs to represent multiple runtime states:
   - loading,
   - error,
   - success,
   - empty list,
   - populated list,
   - permission denied for `locate()`.

   Figma-like canvases usually show one frame at a time. Igni apps need a **state matrix** or **scenario picker**.

6. **`every` blocks are invisible behaviour.**

   ```igni
   every 1s:
     tick = now()
   ```

   Recurrence has lifecycle semantics:

   > The block fires while the screen is mounted and visible. It pauses on navigate-away and resumes on return.

   There is no obvious canvas representation for this. It belongs in a timeline/runtime behaviour panel.

7. **Component event contracts are source-level API design.**

   ```igni
   component Stepper(value):
     button "-", on tap: emit decrement
     button "+", on tap: emit increment

   Stepper weight, on increment: weight = weight + 1
   ```

   The canvas must understand:
   - custom emitted events,
   - payload vs payload-less signatures,
   - reserved names `tap`, `change`, `touch`,
   - parent-scope handlers.

   That is more like a component API inspector than a visual layout editor.

8. **Tests are part of the Igni source world, not the visual world.**

   Igni has test-scope verbs:

   ```igni
   render Login
   change email_input: "not-an-email"
   tap "Sign in"
   expect seen "Please enter a valid email"
   mock fetch:
     "/api/users/42": error "network timeout"
   snapshot "dashboard_default"
   ```

   These are not app UI, but they are first-class project source. A true Studio needs a test runner, mock editor, snapshot viewer, and selector inspector.

### What Studio would need to add

To make the round-trip claim honest, Igni Studio needs more than “canvas + source”:

- **State inspector**: local variables, shared variables, initial values, current runtime values.
- **Derived-value/function editor**: source-first or block-based editing for functions.
- **Data/query builder**: visual surfaces for `filter`, `map`, `find`, `sorted`, lambdas.
- **Scenario picker**: loading/error/empty/success states for `fetch()` and `locate()`.
- **Event contract editor**: component props, `emit` channels, payload signatures.
- **Timer/runtime panel**: `every` blocks, `now()`, lifecycle simulation.
- **Test panel**: `render`, `tap`, `change`, `mock fetch`, `mock every`, snapshots.
- **AST preservation layer**: if Studio cannot edit a construct visually, it must still preserve it exactly and mark it as source-owned.

So the better claim is:

> Igni Studio can provide lossless AST round-trip for all `.igni` files, and visual round-trip for the subset of Igni whose semantics have Studio surfaces.

That is defensible. “Canvas and source have a 1:1 mapping” is too broad.

---

## Q2 — Four-panel framing

**Verdict: REFINE.**

Canvas + source + AI agent + live preview is close, but the framing overstates “panels” and understates **state, tests, and diagnostics**.

### What is missing

1. **Inspector / properties panel**

   Figma-style editing needs an inspector for:

   ```igni
   layout vertical, gap: medium, padding: large, background: card:
   ```

   Without a property inspector, the canvas is mostly drag-and-drop decoration. Igni’s design tokens — `small`, `medium`, `large`, `brand`, `card`, `heading.small`, `max_width: phone` — need a structured editing surface.

2. **State/scenario panel**

   Real Igni screens depend on conditions:

   ```igni
   if items is empty:
     label "No tasks yet"
   else:
     each item in items:
       label item.text
   ```

   A designer needs to preview:
   - empty list,
   - one item,
   - many items,
   - fetch loading,
   - fetch error,
   - logged-in/logged-out shared state.

   Live preview alone does not solve that.

3. **Problems/test panel**

   Igni has strong parse-time rules:
   - no inline hex outside `theme:`,
   - `input bind: shared.X` rejected,
   - `transition:` only valid for child replacement,
   - `spring()` only for interpolatable values,
   - max nesting depth 4.

   Studio needs a first-class diagnostics surface and test runner.

### What is over-included

The **AI agent should not be a fourth equal panel**. It should be an action layer over the project:

- “Make this card reusable.”
- “Extract this branch into a component.”
- “Add a test for empty state.”
- “Explain why this doesn’t re-render.”

A permanent Claude-Code-like panel may be useful, but conceptually the agent is not a surface like canvas/source/preview. It is a collaborator operating on the AST, files, tests, and preview.

### Better framing

I would frame Studio as:

1. **Stage** — canvas and live preview in one surface, with `Design` / `Run` modes.
2. **Source** — canonical `.igni` editor.
3. **Inspector** — selected node properties, state, component API, theme tokens.
4. **Bottom tray** — problems, tests, snapshots, fetch mocks, console.
5. **Agent command layer** — chat/diff/review, not necessarily a fixed panel.

I would also drop the green-flag metaphor as the primary model. Scratch’s green flag means “start the program.” Igni already hot reloads. The better metaphor is probably:

- **Design mode**: select/edit canvas nodes.
- **Run mode**: interact with the app.
- **Scenario selector**: choose state fixtures.

The green flag can still exist as a friendly Run button, but it should not carry the whole mental model.

---

## Q3 — File structure scaling

**Verdict: REFINE.**

The proposed structure is fine for a demo app:

```text
screens/
components/
tests/
theme.igni
shared.igni
igni.config
AGENTS.md
```

It will strain under a 50-screen, 3-developer project.

### Failure mode 1: `shared.igni` becomes a god-object

The cheatsheet explicitly says:

```igni
shared:
  cart = []
```

And:

> `shared:` blocks across multiple files compose into a single namespace.

It also warns:

> Use `shared:` only when multiple screens need the same data. Single-screen state is local.

A single `shared.igni` invites everything to become global:

```igni
shared:
  user = null
  cart = []
  selected_tab = "home"
  draft_title = ""
  onboarding_step = 2
  search_query = ""
```

That undermines Igni’s visible coupling marker, `shared.`.

Better shape:

```text
features/
  auth/
    Login.igni
    Signup.igni
    auth.shared.igni
  cart/
    Cart.igni
    Checkout.igni
    cart.shared.igni
  feed/
    Feed.igni
    FeedItem.igni
    Feed.test.igni
theme.igni
app.igni
AGENTS.md
```

Even though shared blocks compose globally, splitting by feature makes ownership visible. Studio should also show a **shared-state map**: which screens read/write each `shared.X`.

### Failure mode 2: flat `screens/` and `components/` cause namespace collisions

Igni has no classes or imports, and naming is semantic:

> PascalCase = component, lowercase = function. Components are invoked without parens; functions are called with parens.

Screens and components are therefore project-level symbols in practice. In a 50-screen app, flat names like `Settings`, `Profile`, `Card`, `Header`, `Item`, `Detail` will collide semantically even if the compiler catches literal duplicates.

Better shape:

```text
features/
  settings/
    SettingsHome.igni
    SettingsAccount.igni
    SettingsNotifications.igni
    SettingsSection.igni
  profile/
    ProfileHome.igni
    ProfileAvatar.igni
```

Studio should encourage feature-prefixed names, or at least maintain a symbol index.

### Failure mode 3: `tests/` conflicts with Igni’s test convention

The cheatsheet says:

> Tests live in sibling `*.test.igni` files alongside source.

And snapshots live at:

```text
__snapshots__/<test-slug>__<snap-slug>.txt
```

A separate top-level `tests/` folder loses locality. For Igni, the better structure is:

```text
features/
  auth/
    Login.igni
    Login.test.igni
    __snapshots__/
```

That lets the test sit next to the screen/component it renders.

### Failure mode 4: `AGENTS.md` saturates context

The concept assumes AI context comes from one `AGENTS.md`. That will not scale for 50 screens.

Igni itself is intentionally small enough that an LLM can read the cheatsheet cold, but project context is different. A monolithic `AGENTS.md` becomes stale and too large.

Better:

```text
AGENTS.md                  # project-wide rules
features/auth/AGENTS.md    # auth-specific notes
features/cart/AGENTS.md    # cart-specific notes
```

Plus a generated Studio index:

```text
.igni/
  symbols.json
  shared-usage.json
  component-api.json
  routes.json
```

Those generated files should not become proprietary source of truth; they are cache/index metadata.

### Failure mode 5: `igni.config` risks becoming a proprietary shadow format

The product promise is “same `.igni` source files, no proprietary formats.” `igni.config` is fine for editor preferences, but dangerous if it stores layout, component metadata, AI hints, or canvas-only state.

Rule of thumb:

- Source of truth: `.igni`
- Tests: `*.test.igni`
- Snapshots: `__snapshots__`
- Generated indexes: disposable
- Studio metadata: non-semantic only

---

## Q4 — Differentiation honesty

**Verdict: REFINE.**

| Tool | Honest comparison |
|---|---|
| **FlutterFlow** | Igni Studio’s defensible difference is that the canonical artifact is constrained `.igni` source designed for bidirectional editing rather than a visual-builder project that exports Flutter; FlutterFlow could likely close much of the AI/Git/code-export workflow within 18 months, but not full source-native round-trip without changing its core architecture. |
| **Webflow** | Igni Studio is defensibly different because it targets Flutter apps through a UI-first programming language rather than web pages through Webflow’s hosted visual model; Webflow can close AI-assisted design/build and developer handoff, but not the Flutter/mobile-app claim without becoming a different product. |
| **Bubble** | Igni Studio is defensibly different because app state, UI, tests, and behaviour live in inspectable `.igni` files instead of a proprietary hosted no-code model; Bubble can close AI app generation and some export story, but source-native maintainability is structurally hard for it. |
| **Cursor** | Igni Studio is defensibly different only if the visual AST canvas is real, because Cursor can already edit source with an agent and could add an Igni extension, preview, and diagnostics quickly due to Igni’s deliberately small syntax. |
| **Lovable** | Igni Studio is defensibly different if users care about deterministic round-trip source/canvas editing rather than prompt-to-app generation, but Lovable is the most dangerous comparison because it can close much of the “AI builds app from intent” experience and many users may not value the language-level distinction. |

The weakest differentiation is against **Cursor** for developers and **Lovable** for non-developers.

Against Cursor, the risk is: “Why not just use VS Code/Cursor with an Igni language server and hot preview?”

Against Lovable, the risk is: “Why do I care that the source is round-trip-capable if the AI keeps producing working apps?”

So Igni Studio’s moat is not “AI writes code.” That will be commoditized. The moat has to be:

> visual editing and source editing remain the same artifact after the app becomes real.

If Q1 is not solved, the differentiation collapses.

---

## Q5 — Most likely failure mode + 6-month signal

**Verdict: REFINE.**

The most likely failure mode is:

> Igni Studio works beautifully for static screens and simple forms, but once teams add real app logic — `fetch()`, `shared:`, `each`, lambdas, screen functions, tests, component events — the canvas becomes a mostly read-only preview, developers move back to VS Code/Cursor, and designers stop being able to make safe edits.

That is the specific failure to watch for. Not “AI quality is bad.” Not “Flutter compile is slow.” The existential failure is **round-trip degradation under real app complexity**.

### Six-month signal

Track a metric like:

> **Round-trip editable coverage:** percentage of AST nodes in active projects that Studio can both display and edit visually without falling back to source-only mode.

Segment it by project maturity:

- after first screen,
- after first component,
- after first `fetch()`,
- after first `shared:` block,
- after first test,
- after 10+ screens.

Bad signal within six months:

- More than **30% of active projects** contain source constructs marked “canvas-preserved but not canvas-editable.”
- In projects with 10+ screens, fewer than **20% of meaningful UI commits** originate from canvas edits.
- Support tickets cluster around:
  - “Canvas changed my formatting/comment.”
  - “Canvas can’t edit this component.”
  - “Why didn’t this re-render?”
  - “Designer broke my function.”
  - “This branch/state isn’t visible in canvas.”
- Session behaviour shows designers using Studio only for preview while developers/agents make all source edits.

Good signal:

- Teams keep using canvas after adding `fetch()`, `shared:`, tests, and component events.
- Canvas edits survive code review.
- Developers do not prohibit designers from editing real screens.
- Open-save round-trip produces zero diffs.
- Unsupported AST nodes decrease release-over-release.

The decisive question is not whether Igni Studio can generate code from a mockup. Many tools can. The decisive question is whether a 50-screen app with state, tests, async, and shared data remains visually editable without corrupting the `.igni` source.