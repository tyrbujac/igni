Here is a review of the Igni project across the three provided documents. 

### Q1 — Strengths

**1. The "Trigger-Variable" Pattern.** 
This is the absolute standout piece of language design in the spec. Instead of burying network debounce/throttling behind a `throttle:` keyword or implicit magic, Igni leans on its existing lexical reactivity to solve the text-input-fetch footgun. By forcing developers to bind the `fetch` to a *separate* variable updated via an explicit `on tap:`, you maintain the "no magic" rule while perfectly solving the spam-API problem. Enforcing this at compile-time via an explicit transpiler rejection is brilliant.

**2. The Coherence of the AI-First Methodology.** 
The alignment between `README.md`, `CLAUDE.md`, and the Spec is remarkably tight. The "budget, not a backlog" philosophy articulated in `CLAUDE.md` is directly visible in the spec's constraints (e.g., the refusal to add string interpolation or inline conditionals). Using cold-LLM testing as an adversarial reviewer to lock in syntax (like `{target with ...}`) is a genuinely novel approach to language design that validates the dissertation's core hypothesis.

**3. `body` Wrappers and the "No Component Arguments" Rule.**
Forbidding components from being passed as arguments to other components is a highly opinionated choice that pays off massively. It guarantees that the visual indentation of the code matches the visual layout of the UI on screen. The introduction of the `body` keyword cleanly solves the need for wrapper components without compromising the "no parentheses" invocation style. 

**4. Lexical Reactivity.**
The core reactivity rule—*each screen re-evaluates from the top whenever any variable it lexically references is reassigned*—is profoundly simple. It completely eliminates the need for dependency arrays, hook rules, or state controllers. It is a massive win for human readability.

---

### Q2 — Weaknesses, Friction, and Drift

**1. Spec History Pollution vs. CLAUDE.md Mandates.**
`CLAUDE.md` explicitly commands: *"Teach the language first; don't open with release notes... If older version changes matter, put them in CHANGELOG.md."* 
Yet, the `v0.15.0` spec violates this repeatedly. It opens with a dense "Changes from v0.14.0" paragraph. The `locate()` section contains drift justifying "the v0.9.0 rules." The `floor()` section justifies its existence via "the v0.14 timer primitive." This prose is doing too much work, polluting the LLM's context, and directly contradicting your own AI guidelines. The spec should be a timeless, canonical statement of *how the language works right now*.

**2. The Component Invocation Syntax is Under-justified.**
The spec shows component definitions like `component Avatar(url, size):` (positional parameters), but then invokes them as `Avatar user.avatar, size: 80`. 
Is `size: 80` a named argument? Syntactically, it looks exactly like primitive properties (`image url, size: 80`). If components support named arguments, the spec never defines the rules for them (Can I mix positional and named? Do names have to match the parameter exactly?). If it's *not* a named argument, and `size:` is just syntactic sugar for the second positional argument, that is confusing. 

**3. The "Multi-view screens" Tactical Pattern.**
Spending a full page showing how to cram three distinct views into a single screen using a top-level `if selected is null:` feels like a symptom of a missing routing primitive, not a feature to be celebrated. The prose works very hard to caveat this ("tactical pattern, not the canonical architecture"), which indicates the design choice (disallowing cross-screen function calls without a robust sub-routing alternative) is currently imposing high friction.

---

### Q3 — Genuine Semantic Uncertainties

If I were an LLM (or a human) trying to write Igni from these docs, I would guess wrong in these specific places:

**1. How does a parent screen capture a new event payload?**
The spec states: *"The parent's `on X:` handler can name the receiving binding whatever it wants... parent picks the binding name in its handler body."* 
But it provides no syntax for *how* to do this. The example given is:
```igni
each alert in alerts:
  AlertRow alert, on delete: alerts = without(alerts, alert)
```
In this example, the parent isn't magically receiving an emitted payload; it is simply closing over the `alert` variable from the `each` loop! 
If a component emits *new* data (e.g., an input emitting a string: `emit submit "hello"`), how does the parent bind that string? `on submit: my_var = ???`. Without explicit closure syntax (like `on submit(data):`), an LLM will hallucinate syntax to capture this value.

**2. Where is the boundary between "Init" and "Render"?**
The spec says: *"Top-level assignments (count = 0) run once... The rendering part (layouts, labels, conditionals...) re-runs."*
But what happens if I put an `if` block at the top level that assigns a variable?
```igni
screen Test:
  x = 0
  if x is 0:
    y = 1
```
Does that `if` block run once (because it's state initialization) or does it re-run on every render (because it's a conditional)? The spec implies a split lifecycle but doesn't formally define the boundary.

**3. Null access on out-of-bounds lists.**
The spec notes that `items[index]` returns `null` if out of bounds. The very next line says indexing chains with field access: `questions[index].text`. 
If `index` is out of bounds, what happens when I access `.text` on `null`? Does the app crash (Dart's default behavior)? Or does Igni have implicit safe-navigation that returns `null`? An LLM will likely guess wrong or try to invent a `?.` operator.

**4. Block scoping of local variables.**
If I declare a new variable inside an `if` block or an `each` loop, is it available outside that block? Python (which shares Igni's indentation style) says yes; C-family languages say no. The spec does not define local variable scope boundaries.

---

### Q4 — Recommendations

If I were Tyr, here is the prioritized roadmap for the next 2-4 versions:

**1. Fix the Event Payload Syntax (Immediate / v0.15.1)**
You must define explicit syntax for capturing event payloads that doesn't rely on loop closures or AST guessing. I recommend a simple parameter syntax on the handler:
`SearchBar on submit(query): fetch_results(query)`
This is unambiguous, LLM-friendly, and solves the gap immediately.

**2. Scrub the Spec of Historical Detritus (Immediate)**
Execute the `CLAUDE.md` mandate. Remove the "Changes from v0.14.0" section entirely. Strip out all references to Pomodonuts, v0.9 rules, and v0.14 gap justifications. Move all of this to `CHANGELOG.md` or `docs/private/`. The spec should read as a clean, timeless manual. 

**3. Formalise Component Arguments (Next Milestone)**
Clarify the `size: 80` component syntax. If Igni components accept named arguments, state it explicitly with a rule (e.g., "Arguments can optionally be prefixed with their parameter name and a colon"). If they are strictly positional, remove the `size: 80` from the `Avatar` example and replace it with `Avatar user.avatar, 80`. 

**4. Formalise the "Init vs Render" Boundary (Next Milestone)**
Add a strict rule defining what runs once vs. what re-runs. 
*Recommendation:* "The contiguous block of variable declarations at the top of a screen body runs once. The first layout, primitive, or UI-conditional marks the beginning of the render body, which re-evaluates on every state change."

**5. Address Null Propagation (Future)**
Add a single sentence to the variables section clarifying what happens when accessing a field on `null`. If it causes a runtime error, say so, and advise the LLM to use `if item is not null:` guards.