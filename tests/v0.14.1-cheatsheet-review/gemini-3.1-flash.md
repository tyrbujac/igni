This cheat sheet is remarkably focused. It successfully balances a "spec-like" precision with a "designer-friendly" tone. Here is the breakdown based on your three questions.

---

## Q1 — What's strongest?

* **The "One Rule" Mental Model:** The phrasing *"a screen re-evaluates from the top whenever any variable it references is reassigned"* is the absolute anchor of this document. By repeating it in the Intro, Reacting, and Recurrence sections, you eliminate the "how does the magic work?" anxiety that usually plagues declarative UI docs.
* **The `every` vs. `now()` Distinction:** The "Wall-clock-correct timers" section is a masterclass in teaching state management. It anticipates the exact bug every junior dev would write (relative decrementing) and provides the robust architectural pattern (absolute timestamps) immediately.
* **The `with` keyword for immutable updates:** The explanation of `{BASE with KEY: VALUE}` is crisp. It makes the "Rule: List elements cannot be mutated in place" feel like a minor syntactic trade-off rather than a burden.
* **Layout Primitives:** The table-based approach to primitives and the clear explanation of `fill: true` vs. `max_width:` tokens make the layout engine feel "solved" in under 20 lines.

---

## Q2 — What's weakest?

* **Shared State Binding (The Input Exception):** The paragraph under *Binding to shared state* is dense. Explaining why `input` is an exception due to "text controllers" feels like a peek behind the Flutter curtain that breaks the "Igni-first" abstraction. It might be cleaner to show a code snippet of the `on change:` bridge immediately, as the prose currently carries too much weight.
* **Boolean Logic vs. "Is" forms:** You list `is empty`, `is loading`, and `is error` as "special forms." It's unclear if these are keywords or if `loading` and `error` are literal states of an async object. If I have a variable `status = "loading"`, does `if status is loading` work, or is that reserved for `fetch()`?
* **Formatting "Arranging things":** The example is good, but the prose explaining sibling behavior (capped vs. uncapped splitting) is a bit wordy. A small table or bulleted list for "Sibling Interaction Rules" would be easier to scan.

---

## Q3 — Where is genuine semantic uncertainty?

### 1. The Scope of `each` and Re-evaluation
If a screen re-evaluates from the top, does it maintain "focus" or "scroll position" in an `each` loop?
* **The Uncertainty:** If I have an `input` inside an `each` loop and I type (triggering a re-render of the whole screen), does the input lose focus because the loop "re-ran"?

### 2. Async Lifecycle & Parallelism
* **The Uncertainty:** If I call `user = fetch("/api/user")` at the top of the screen, and the screen re-evaluates because of a *different* variable change (e.g., a timer or a sidebar toggle), does the `fetch` trigger again? The doc says top-level assignments run "once," but `fetch` is often treated as a continuous "binding" in some reactive languages. Does Igni memoize fetch calls?

### 3. "Body" in Wrapper Components
* **The Uncertainty:** The doc states `body` renders "exactly one widget."
    * If the user passes *nothing*, does it crash or no-op?
    * If the user passes a `label` and then a `button` without a `layout` wrapper, is that a compile error or does it just take the first one?

### 4. Function Return Types and UI
* **The Uncertainty:** The rule says "UI primitives only render in screen or component bodies, never inside functions."
    * Does this mean a function cannot return a "widget"?
    * Example: `get_icon(type) { if type is "a": return icon "play" }`. If this is illegal, it significantly changes how people will try to refactor complex UI logic. It would be helpful to explicitly state: "Functions return data, components return UI."

### 5. Indexing Null Safety
* **The Uncertainty:** You mention `items[index]` returns `null` on out-of-bounds.
    * Does `items[0].text` throw a runtime error if the list is empty (trying to access `.text` on `null`), or does Igni have "null-safe chaining" by default? Given the language's "design spec" vibe, users might expect it to just fail silently/render nothing.
