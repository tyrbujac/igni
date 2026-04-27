---
model_label: gemini 3.1 pro
input_tier: cheatsheet
input_path: spec/v0.17.0-cheatsheet.md
date: 2026-04-27
---

This is a fascinating language design. You’ve essentially taken the Svelte reactivity model, married it to Python’s indentation syntax, and enforced strict, opinionated design system constraints (like the anti-inline-hex rule and the 4-level nesting limit). It reads like an executable wireframe.

As an AI, I parse and generate UI code constantly across dozens of frameworks. Here is my evaluation of Igni v0.17.0, along with a substantive critique of what you need to iron out before v1.0.

---

### **Axis Evaluations**

#### **1. Readability**
* **Definition:** How quickly a designer-engineer can visually parse a file, understand the layout hierarchy, and map the state flow without being hindered by framework boilerplate or syntactical noise.
* **Score: 9.5/10**
* **Comparators:** * **Flutter/Dart (4/10):** Drowns the reader in nested `child:`, `children: [`, parentheses, and `setState` boilerplate.
  * **SwiftUI (8/10):** Clean, but `@State`, `@Binding`, and property wrappers introduce cognitive overhead for designers.
  * **Igni:** Igni strips away everything but the layout and the logic. The fact that a 17-line script can define state, layout, two-way bindings, and mutation logic without a single import or class definition is stellar.

#### **2. LLM Accuracy**
* **Definition:** The likelihood that a frontier LLM (like myself) can generate syntactically and logically correct Igni code purely zero-shot from this spec, without hallucinating standard conventions from other languages.
* **Score: 8/10**
* **Comparators:** * **HTML/CSS (9.5/10):** We have seen it billions of times.
  * **Brand new DSLs (usually 5/10):** LLMs tend to drift back to familiar syntax.
  * **Igni:** You score highly here because of your strict "One way to do everything" rule. We do well with hard boundaries. However, you lose 2 points because an LLM will almost certainly hallucinate `==` instead of `is`, `def func():` instead of `func():`, or try to use `shared.title` directly in an `input` bind (which your spec explicitly rejects). We will need rigid system prompts to avoid those specific pitfalls.

#### **3. Speed (Developer Iteration Speed)**
* **Definition:** The time it takes a developer to go from a conceptual design to a functional, interactive, themed screen on a device.
* **Score: 9/10**
* **Comparators:** * **Jetpack Compose (7/10):** Powerful, but hampered by Gradle build times and sometimes clunky previews.
  * **Igni:** Because the language is so terse and side-steps complex architecture decisions (no controllers, no viewmodels), the path from idea to screen is almost instantaneous. The enforced `images/` directory and auto-asset registration remove tedious setup tasks.

#### **4. Cost (LLM Token Cost)**
* **Definition:** The number of input/output tokens required for an AI to read or write an Igni application, which directly impacts API costs and context window usage for AI-assisted coding.
* **Score: 10/10**
* **Comparators:** * **React/JSX (6/10):** Heavy on imports, exports, explicit prop types, and hook boilerplate.
  * **Igni:** Exceptionally cheap. A complex screen in Igni takes perhaps 100 tokens. The same screen in Flutter might take 400. This makes Igni incredibly efficient for AI agents to generate and refactor.

#### **5. Testing**
* **Definition:** The ease and built-in capability to assert that state changes, UI renders correctly, and business logic holds true.
* **Score: 3/10 (Based on current spec)**
* **Comparators:** * **React Testing Library (8/10):** Excellent conceptual model mapping to user behavior.
  * **Igni:** Your spec currently implies zero testing infrastructure. For a v1.0, you cannot just rely on visual verification. Because logic is tightly coupled to the screen, you need a headless runner that can do something like: `mount Todo`, `tap "Add"`, `assert items contains...`.

#### **6. Scalability / Architecture (Extra Axis)**
* **Definition:** How well the language and its architecture support a growing codebase, a large team, and complex business logic without turning into spaghetti code.
* **Score: 5.5/10**
* **Comparators:** * **Flutter + Riverpod (8/10):** Highly structured, easily mockable, highly decoupled.
  * **Igni:** This is Igni's weakest point right now. Global shared state namespaces and the inability to share functions across screens will cause immense pain in apps larger than 10-15 screens. (More on this below).

---

### **The Road to v1.0: Critique & Considerations**

#### **What I'd Celebrate (Keep these at all costs)**
* **The 4-level nesting limit:** This is brilliant. It forces developers to break down UI into components instead of creating the "pyramid of doom" famous in Flutter.
* **Lexical Reactivity:** Implicit `every` block and `fetch` reactivity based on referenced variables is magical. It removes so much lifecycle boilerplate (no `useEffect` dependency arrays!).
* **Design Token Enforcement:** Rejecting inline hex codes (`color: "#FF0000"`) and forcing them into the `theme:` block is a massive win for design system integrity.

#### **Structural Risks & Smells (Pushbacks)**

**1. The `shared:` Namespace Collision Risk**
* **The Problem:** Your spec states: *"Same name in two files is a build-time error... same-name collisions are exactly the hidden-coupling failure mode."* If I have a 50-screen app, and two different developers want to create a shared `status` or `is_loading` variable, the compiler yells at them. As apps grow, developers will be forced into awkward, manual pseudo-namespaces like `shared.auth_user_status`.
* **The Fix:** Introduce explicit namespacing. `shared auth: user = null`. Then access via `shared.auth.user`.

**2. No Cross-Screen Logic Sharing**
* **The Problem:** *"Cross-screen function calls are NOT allowed."* If I need a `format_currency(decimal)` function or a complex `validate_password(string)` regex, I have to copy-paste that function into every single screen that uses it. This violates DRY (Don't Repeat Yourself) in a way that will frustrate engineers immediately.
* **The Fix:** You need a concept of `module` or `utils` files that can export pure functions, separate from screens.

**3. Component State Loss on Re-render**
* **The Problem:** *"Components re-evaluate with their parent... To edit a value passed in, declare a local variable inside the body."* If a `Stepper` component has local state (`is_dragging = true`), and the parent screen re-evaluates because a completely unrelated variable changed, does the `Stepper` lose its local `is_dragging` state? In React, this is solved by the virtual DOM and `keys`. In Flutter, by `StatefulWidget`. If Igni destroys component local state every time the parent layout re-evaluates, interactive components will be incredibly buggy.

**4. Async Error Handling is Opaque**
* **The Problem:** `if user is error: label "Failed"`. How do I show the user *why* it failed? (e.g., "Network Timeout" vs. "403 Forbidden").
* **The Fix:** The `is error` state needs to yield an error object, perhaps accessed via `user.error.message`.

**5. Object Mutation is Verbose for Deep States**
* **The Problem:** The `with` keyword is shallow only. If you have a `user` object with a `profile` object containing a `settings` object, updating a toggle means:
`user = {user with profile: {user.profile with settings: {user.profile.settings with dark_mode: true}}}`.
* **The Fix:** Consider a simplified deep-update syntax, or a built-in `update_path(object, "profile.settings.dark_mode", true)` utility.

***

Igni is exceptionally close to being a killer tool for rapid prototyping and design-system-driven development. The constraints you've added are largely healthy, but the strictness around logic sharing needs a slight release valve.

Given the strict ban on cross-screen functions, how do you envision developers handling widespread, complex data-formatting rules (like date parsing or currency formatting) in a large Igni application?
