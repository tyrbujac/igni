---
model_label: gemini 3 flash
input_tier: cheatsheet
input_path: spec/v0.17.0-cheatsheet.md
date: 2026-04-27
---

This is a fascinating spec. Igni feels like a "DSL for the 80% case"—brutally opinionated to maximize velocity. It successfully collapses the "State Management vs. Layout vs. Logic" trilemma into a single reactive flow.

Here is an evaluation of Igni v0.17.0 across your requested axes:

---

### **The Scorecard**

| Axis | Interpretation | Score (out of 10) | Reasoning & Comparators |
| :--- | :--- | :--- | :--- |
| **Readability** | Clarity for designer-engineers; scanning intent vs. implementation. | **9/10** | **Anchor: SwiftUI.** It is cleaner than SwiftUI because it removes the "View" protocol and `@State` property wrappers. It reads like a literal translation of a Figma layer list. |
| **LLM Accuracy** | Zero-shot generation probability for a frontier model. | **8.5/10** | **Anchor: Flutter (7/10).** LLMs struggle with Flutter's deep nesting and boilerplate. Igni’s "no imports, no classes" rule reduces the "hallucination surface." The semantic rules (like `fill: true` only on layouts) are very clear. |
| **Speed** | **Developer Iteration Speed** (Time from idea to "it's on the screen"). | **10/10** | **Anchor: HTML/CSS.** By making state assignment the only reactivity primitive, you eliminate 90% of the debugging cycles found in Redux or Bloc. |
| **Cost** | **Cognitive Cost** for a human reader/writer. | **9/10** | The "Total Todo app in 17 lines" is the proof. The cognitive load is low because there is only one way to do things. No `map()` vs `forEach()` debates. |
| **Testing** | **UI Regression & Logic.** | **5/10** | **Current State.** To reach v1.0, it needs a headless "State-In-UI-Out" test runner. Because logic is coupled to the screen, you can't unit test functions in isolation. |
| **Refinement** | **Constraint Enforcement.** | **7/10** | The strict 4-level nesting and token-only styling are brilliant for consistency but will be the first thing "power users" complain about. |

---

### **Critical Analysis: Pre-v1.0 Considerations**

#### **1. The "Logic-in-UI" Structural Risk**
The rule that **UI primitives cannot be used inside functions** is a great guardrail, but since functions *can* be inside screens and close over state, you have a "Middle-Ground Graveyard."
* **The Risk:** As apps grow, screen bodies will become 500-line monsters because functions cannot be shared across screens.
* **Recommendation:** Formalize "Logic Modules"—files that only contain functions and `shared:` state, which can be imported. Otherwise, users will abuse `shared:` just to avoid code duplication.

#### **2. The `now()` and `every` lifecycle**
The decision to make `now()` non-reactive is a smart performance move, but it's a potential foot-gun.
* **The Smell:** If a user writes `label now()`, it shows the time the screen opened and never updates.
* **Recommendation:** A compiler warning or "hint" when `now()` or `fetch()` is used in a layout without a corresponding `every` block or trigger variable.

#### **3. The "Missing" Layout: Z-Stack / Overlay**
You have `vertical` and `horizontal`, but no `overlay` or `stack`.
* **The Gap:** How do I build a FAB (Floating Action Button), a custom Modal, or a badge that sits on the corner of an icon?
* **The Push-back:** Don't force users to use `padding: negative` (if that even exists). A `layout overlay:` primitive is essential for modern UI Spec parity.

#### **4. Data Mutation Verbosity**
The `{target with done: not target.done}` syntax is safe but gets exhausting for deeply nested objects.
* **The Risk:** If I have `shared.user.profile.settings.notifications`, the `with` chain becomes a nightmare.
* **The Celebration:** You’ve avoided the "Immer" complexity, but consider a "Deep-With" or a simpler way to mutate `shared` paths.

#### **5. Accessibility (The Missing Axis)**
A "UI-first" language must treat accessibility as a first-class citizen, not a post-process.
* **The Idea:** Since you have a `label`, Igni should automatically handle screen-reader focus.
* **Recommendation:** Add an `alt:` property to `image` and `hint:` to `layout` as mandatory or highly-encouraged tokens.

### **Final Verdict**
Igni is a celebration of **Subtractive Design**. By removing the "Programming" from "UI Programming," you've created something that feels like it was designed in a vacuum where the last 20 years of "Enterprise Design Patterns" never happened. That is its greatest strength.

**Keep the constraints. Resist the urge to add `imports`. Force the components.**

How do you plan to handle "The Escape Hatch"—i.e., when a designer needs a complex Flutter plugin (like a 3D renderer or Google Maps) that Igni doesn't support?
