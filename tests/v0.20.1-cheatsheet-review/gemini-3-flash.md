## Q1 — What's strongest?

The sections on **Lexical Reactivity** and **State Management** are the most robust. By explicitly addressing the "#1 reactivity footgun" (the difference between top-level assignment and functions), the cheatsheet preemptively solves the most common mental model clash for React/Vue developers. The rule "top-level assignment captures; functions track" is a masterclass in concise technical instruction. Furthermore, the **Events and Data Binding** section is exceptionally clear; the "three building blocks" (primitive name, target, and handler) provide a reliable mental scaffolding for every input component. The decision to enforce **PascalCase for components and lowercase for functions** is a brilliant design choice that makes the code self-documenting regarding execution context—you know exactly what triggers a rebuild just by looking at the casing.

---

## Q2 — What's weakest?

The **Recurrence and Wall-clock-correct timers** section feels significantly more dense and "logic-heavy" than the rest of the document. While the Stopwatch example is functional, the prose surrounding "missed ticks" and "accumulation of elapsed-on-pause" introduces a level of complexity that slightly breaks the "UI-first, boilerplate-free" promise of the language. Similarly, the **Testing** section, while comprehensive, feels like it belongs in a separate document. It introduces a massive influx of new "special form" verbs (like `seen`, `on`, `requested`) that compete for mental space with the core UI primitives. The `snapshot` explanation, in particular, carries a lot of "meta-information" about file paths and git commits that clutters the immediate goal of learning how to write the language.

---

## Q3 — Where is genuine semantic uncertainty?

There is significant uncertainty regarding **List and Object identity** in practice. While the sheet states that equality is "reference for objects," it doesn't clarify how `shared:` state handles this across re-renders or file boundaries. If I assign user = {name: "Tyr"}`, and another screen does the same, are they "equal" because they point to the same global reference, or does the object literal syntax always create a fresh, "unequal" reference? Additionally, **Layout behavior** has a gap: it isn't clear how `layout horizontal` handles overflow. Does it wrap like a Flexbox `wrap`, or does it clip/scroll? The absence of a `scroll` primitive or property suggests scrolling might be automatic for screens, but the behavior of nested layouts in that context is unspecified. Finally, the **Async** section doesn't mention "race conditions"—if a user triggers three rapid `fetch` calls through a reactive URL change, does Igni cancel the first two, or do they all resolve and potentially overwrite each other in a random order?

---

## Q4 — Cross-language-prior check (v0.20 surface)

*   **Theme Variant Pairs:** This will be highly intuitive for **Tailwind/CSS** users who are used to `dark:` utilities. The auto-fall-back rule is a strong "quality of life" feature that aligns with how developers actually want to work (declaring the brand once).
*   **Structural Sub-blocks:** These map cleanly to **Material Design/Flutter** priors (Scaffold/AppBar). A developer will "guess right" that these are top-level framework controls.
*   **`shared.theme_mode`:** This is a slight point of friction. In most web/mobile frameworks, "system" is an environment variable you *read*, not a state you *assign*. A reader might initially look for a way to "toggle" the system setting rather than understanding they are merely setting the *preference* for how Igni should listen to the OS.
*   **Spacing Scale:** This is a direct hit for **Tailwind** users. The `spacing/N` syntax is familiar, and the 4px-multiplier is industry standard. The "word tokens vs. numeric tokens" heuristic is a great teaching tool because it acknowledges that "large" is a design intent, while "spacing/5" is a technical requirement.

---

## Q5 — Fit and limits

*   **Project (a) Designer/Developer Tool:** Igni would be **exceptional** for the state inspector and agent layer because the code is so "load-bearing" and lacks boilerplate. However, the **Canvas** would hit a wall immediately. Igni has no primitives for absolute positioning, z-index, or drag-and-drop coordinate handling. I would reach for **Flutter directly** for the canvas to access the `CustomPainter` and `GestureDetector` APIs that Igni hides for simplicity.
*   **Project (b) Notes App:** This is Igni's **sweet spot**. The multi-screen navigation, `shared:` state for theme/settings, and simple list/detail layouts map 1:1 to the cheatsheet. The only hurdle would be rich-text editing (like bold/italic in notes), which Igni's `input` doesn't seem to support.
*   **Project (c) Internal Dashboard:** Igni is the **right tool** for the data-entry forms and high-level charts. The `fetch` reactivity makes live dashboards trivial to implement. I would only switch to a **Web stack** if the dashboard required complex data tables with column-resizing and multi-sort, as Igni's `layout` and `each` primitives are built for clean mobile-first stacks rather than dense, "Excel-like" desktop interactions.
