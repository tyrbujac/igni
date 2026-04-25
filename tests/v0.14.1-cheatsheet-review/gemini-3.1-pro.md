This is a beautifully opinionated spec. It reads with the confidence of a language designer who knows exactly what they want to kill (boilerplate, state controllers, imports) and exactly what they want to elevate (visual hierarchy, declarative state). 

Here is an honest breakdown of where the document sings, where it stumbles, and where the compiler logic gets a bit opaque.

---

### Q1: What's strongest?

**The "Show, Don't Tell" Opening**
The progression from a two-line "Hello World" directly into the 17-line Todo app is incredibly effective. It builds immediate trust. Instead of wading through abstract concepts, the reader sees state, layout, two-way binding, iteration, and event handling all working together before they even hit the first technical header. 

**The Core Reactivity Rule**
*"A screen re-evaluates from the top whenever any variable it references is reassigned."* This is the strongest piece of teaching in the document. It provides a single mental model for everything that follows. By phrasing it this cleanly, you preemptively answer dozens of questions about how `bind:`, async, and timers work.

**Visual Density of the Tables**
The markdown tables for "Showing things" and "Getting input" are perfect cheat-sheet material. They give the reader the vocabulary at a glance without bogging them down in property descriptions.

---

### Q2: What's weakest?

**The `on change:` Caveat Paragraph**
Under "Getting input," the paragraph explaining that `on change:` only fires for *user-driven* events and not programmatic reassignment is heavy and repetitive. It reads less like a cheat sheet and more like a defense against a specific bug.
* **Fix:** Condense this into a hard rule bullet: *"**Rule:** `on change:` only fires on physical user interaction, never on programmatic reassignment."*

**The "Arranging things" Layout Rules**
The prose explaining `fill: true` and `max_width:` feels clunky compared to the rest of the document. The explanation of how capped siblings interact with uncapped `fill: true` siblings is a bit of a word salad. 
* **Fix:** Use a bulleted list of layout laws (e.g., "Siblings with `fill: true` split remaining space equally," "Capped layouts freeze at their `max_width` token").

**The Pomodonut Example**
Under "Recurrence," the Pomodonut example is trying to do too much. To explain `every 1s:`, you introduced a 19-line example with start times, boolean toggles, and a custom `remaining()` math function. The cognitive load of figuring out the math distracts from the feature being taught.
* **Fix:** Keep the explanation of wall-clock timers, but simplify the example to just tracking elapsed seconds. 

---

### Q3: Where is genuine semantic uncertainty?

These are areas where I read the text, understood the intent, but wouldn't know exactly what the runtime or parser would do.

**1. The "Top-Level" Boundary vs. Derived State**
The spec says: *"Top-level assignments (`count = 0`) run once, when the screen first opens... Re-evaluation re-runs the rendering part (layouts, labels, conditionals) with the variable's current value."* 
* **The Uncertainty:** How does the parser distinguish between "initial state" that runs once and "derived state" that must recalculate? 
    If I write:
    ```igni
    base = 5
    derived = base * 2
    button "Add", on tap: base = base + 1
    ```
    When `base` becomes 6, does `derived` recalculate to 12? If `derived = base * 2` is evaluated as a "top-level assignment," the spec implies it only runs *once*. If it *does* recalculate, where exactly does the "rendering part" begin?

**2. Implicit Payload Binding in Component Events**
Under Component events, you write: `emit selected item → parent on selected: handle(item)` (item is a named binding).
* **The Uncertainty:** Where does the name `item` come from in the parent scope? Is the parent forced to use the exact variable name the component emitted? What if the parent has two `List` components emitting `item`, or if `item` clashes with a local variable? In most languages, closures or lambda syntax (like `on selected: x => handle(x)`) resolve this, but here it seems like magic string matching.

**3. The `fetch()` Re-evaluation Paradox**
The spec says: *"Don't concatenate an `input bind:` variable into a fetch URL — it re-fires per keystroke."*
* **The Uncertainty:** This contradicts the earlier rule that top-level variable assignments run *once*. If I write `user = fetch("/api/" + draft)` at the top level, why does it re-fire when `draft` changes, but `count = 0` doesn't reset to 0 when `draft` changes? Is `fetch` treated as a reactive hook rather than a standard assignment?

***

If you were to clarify the "top-level assignment" boundary to fix the `fetch` and derived state ambiguity, would you lean towards introducing a specific keyword (like `init`), or relying strictly on visual separation (like putting state in a dedicated block)?
