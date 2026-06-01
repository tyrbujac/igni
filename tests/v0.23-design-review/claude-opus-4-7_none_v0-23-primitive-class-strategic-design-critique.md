# Panel Critique: Igni v0.23 Primitive-Class Shapes

## Q1 — `screen` / `layout` merge

**Verdict: KEEP SEPARATE.**

The merge case is aesthetic ("they share `background:` and `max_width:`"); the separation case is structural and load-bearing. Walking through the sub-questions explains why:

**Q1a — `max_width: phone`.** This property already does subtly different things on `screen` vs nested `layout`: on `screen` it caps the *content viewport* (centring within the page), on nested `layout` it caps a *sibling's flex contribution*. Today this is hidden behind two primitive names — the form selection is unambiguous because the primitive *is* the context. Merge them and `max_width: phone` becomes exactly the context-sensitive form the design hypothesis names as the harmful kind: "same syntax, different meaning depending on nesting depth." An LLM emitting `max_width: phone` would need to know whether it's at depth 0 or depth N to predict behaviour. That's the failure mode, named explicitly.

**Q1b — `fill: true`.** "Legal at inner positions, parse-rejected at top level" is the textbook context-sensitive form. The cheatsheet already documents `fill: true` as layout-only and the merger introduces the precise defect — a property whose legality depends on the position in the tree.

**Q1c — single-vs-multi child.** The "governed by a property" escape hatch is worse than either horn. A `body_mode: single | many` flag would be a context-sensitive form selector dressed as a property. "Many wins" forces every screen's body to grow a wrapper or change shape; "one wins" mandates a wrapper everywhere — both burn spec budget for no semantic gain. There's a real semantic distinction here: a screen is a *route target* (URL/navigation/title-bar host); a layout is a *flex container*. They share two properties because top-level page chrome happens to want a background and a width cap. That's not redundancy, that's coincidence.

The design hypothesis says: *surface redundancy that reflects genuine semantic distinction is fine; surface redundancy that hides identical semantics is a defect.* `screen` and `layout` are **genuinely different semantically** — one is a route, one is a flex container. Two primitives is the correct surface.

The minor ergonomic tax of the wrapping `layout vertical:` inside every `screen` is paying for clean LLM zero-shot: when the model sees `screen X:` it knows the body is a single layout; when it sees `layout vertical:` it knows it's a flex container. No ambiguity, no global context required.

**The real opportunity here** is not to merge but to *tighten the divergence*: remove `max_width:` and `background:` from one of them (probably `screen` — push page-chrome onto a `theme: scaffold:`-style mechanism, which v0.20 already established). That eliminates the shared-property surface that motivated the merge question without losing the routing/container distinction.

---

## Q2 — Verdict: **Option B, with a modification.**

Specifically: B as written, but **`role:` is not a property on `layout` — it's a small set of additional named primitives** (`card`, `tappable`, `link`). I'll defend this in Q3e.

But first, scoring the three as posed:

---

## Q3a — Does Option A's universal `on tap:` create harmful aliasing?

**Yes, and it's the worst kind.**

`label "X", on tap: f()` and `button "X", on tap: f()` produce visually similar output, but:

- `<button>` vs `<span onclick>`: different a11y tree, different keyboard reachability, different screen reader announcement, different focus ring.
- `ElevatedButton` vs `GestureDetector(child: Text)`: different Material semantics, different ink-well, different disabled state.

The hypothesis says: *semantic aliasing reduces cross-model code generation accuracy*. Two surface forms that render visually-similar but semantically-different output is **exactly** the failure mode. An LLM emitting "make the X tappable" has no principled reason to pick one over the other. A reviewer reading the source can't tell if the author *meant* "this is a button" or "this is a label that happens to be tappable."

Worse: HTML transpile makes this a real accessibility regression. v0.24 will turn `label, on tap:` into `<span onclick>`, which is an a11y defect — not just a stylistic one.

**Option A is ruled out by the hypothesis.** Universal `on tap:` is the canonical "make it work" affordance that buys ergonomics with semantic clarity. Igni's whole pitch is the opposite trade.

---

## Q3b — Does Option B's `role:` solve aliasing or relocate it?

**Mostly solves, partially relocates.**

The aliasing pair `layout role: button: ...` vs `button "...":` is **not** the same kind of pair as Q3a. Here's why:

- `button "Save"` is the simple-case primitive: filled, themed, label-only, intrinsic width. Maps to `<button>` / `ElevatedButton`. Locked semantics, locked appearance vocabulary.
- `layout role: button:` is the *escape hatch*: arbitrary children, custom styling, but **the role: keyword force-promotes the a11y tree to button**. Maps to `<button class="...">` / `Semantics(button: true, child: ...)`.

These produce **identical a11y trees** (the whole point of `role:`) but **different visual flexibility**. The semantic-equivalence-at-runtime is real but the surface shapes signal different design intents: "use the system button" vs "I'm building a custom button and need it to remain reachable."

This is genuine semantic distinction with surface signal, not aliasing. The hypothesis permits it.

**Where B *does* relocate aliasing:** `layout role: button` and a hypothetical user-defined `component MyButton:` that wraps `layout, on tap:`. If users can build "buttons" two ways — `role: button` or a wrapping component — then advice like "is this content tappable?" splits across two patterns. Mitigation: aggressive lint rule that says "components whose root is `layout` with `on tap:` and no `role:` are an a11y warning" — pushes everyone toward `role:`.

The deeper concern with B is that `role:` is one property holding a semantic *type tag*. Type tags as properties are typically a smell — they're how you encode "this thing is actually a different kind of thing." That argues for promoting them to primitives. (See Q3e.)

---

## Q3c — Option C: expand `button`'s vocabulary

**Insufficient and creates a different defect.**

The "expand button" approach handles the *cosmetic* needs (outlined, text-only, icon+label) but doesn't handle the *structural* need: tappable cards, tappable list rows, tappable image tiles, tappable arbitrary regions. These are common UI shapes (Pinterest-style grid, settings list rows, dashboard tiles), and Option C punts them back to "wrap in `layout` and… do what?" Currently `on tap:` on `layout` is legal — so users wrap a `button` in a `layout` for layout reasons but also have `on tap:` available on the layout itself, and it's unclear which to use. C doesn't address that.

C also introduces a `body:` slot on `button`, which is a **second body mechanism** alongside the existing wrapper-component `body`. Two body forms with subtly different semantics (one slot vs many slot? Required vs optional? Allowed children?) is itself a context-sensitive form. The cheatsheet currently has *one* body rule; C bifurcates it.

C is the "do less" option, which is normally Igni's instinct, but here it leaves the underlying need unsolved. Reject.

---

## Q3d — How does HTML transpile change the calculus?

**It argues for *more primitives, not fewer*, and it's the strongest argument against Option C.**

HTML's interactive vocabulary (`<button>`, `<a>`, `<input>`, `<details>`, `<dialog>`, `<summary>`, `<label for=>`) is *semantically richer* than Flutter's. A Flutter-only target lets you collapse a lot of distinctions ("it's all GestureDetector underneath"); the HTML target punishes this. `<a href>` vs `<button onclick>` is not a styling difference — it's whether middle-click-to-open-in-new-tab works, whether the URL appears in the status bar, whether crawlers see a link, whether the back button does the right thing.

The Igni primitive set is currently a 14-element list optimised for a Flutter mental model (`button`, `input`, `toggle`, `checkbox`, `slider`, `dropdown` — basically Material's input vocabulary). HTML transpile wants to add at least:

- a primitive for **navigation** (link semantics — distinct from button)
- a primitive for **disclosure** (`<details>` / collapsible)
- a primitive for **dialog** (modal / non-modal — and Flutter's `showDialog` maps cleanly)

These exist regardless of the Q2 decision. They're genuine semantic distinctions, not redundant forms. The "spec budget" intuition pushes back on adding primitives, but the budget is paid against *redundant* keywords, not *semantically distinct* ones. Adding `link` as a primitive is cheap; aliasing `link` and `button` would be expensive.

**Implication for Q2:** Option A (universal `on tap:`) is the worst here because it actively destroys the HTML semantic distinctions. Option C (expand `button`) is silent on them. Option B (`role:`) handles `role: link` cleanly. A primitive-based answer (Q3e) handles them most cleanly.

---

## Q3e — Fourth option: **`tappable` + `link` as primitives, `card` for wrapper-with-style**

**Sketch:**

Add three primitives:

- **`card`** — a styled non-interactive container (the "rectangle with padding/background/rounded/border" need). Replaces the "what's a non-button styled box" question.
- **`tappable`** — a wrapper primitive that promotes its child to button-role for a11y, with `on tap:` required.
- **`link`** — a navigation-role wrapper, takes a destination, with `<a href>` / route semantics.

**Igni source:**

```igni
# Simple button — unchanged
button "Save", on tap: save()

# Styled non-interactive panel — was: layout vertical, padding:..., background:...
card padding: medium, background: card, rounded: medium:
  label "Notifications"
  label "Get alerts when X happens", style: caption

# Tappable card (clicking the whole card)
tappable on tap: open(post):
  card padding: medium, background: card:
    image post.cover
    label post.title

# Link (navigation)
link to Profile user:
  card padding: medium:
    Avatar user.avatar
    label user.name
```

**HTML codegen:**

- `card` → `<div class="card-...">` (no interactive role, no tabindex)
- `tappable` → `<button type="button" class="...">` wrapping child markup (full button a11y; child stays as visual)
- `link` → `<a href="/profile/...">` (real anchor — middle-click works, crawlers see it, no JS-only navigation)

**Flutter codegen:**

- `card` → `Container` with decoration
- `tappable` → `Semantics(button: true, child: GestureDetector(onTap: ..., child: ...))` with focus + keyboard wiring
- `link` → `Semantics(link: true, ...)` + `Navigator.pushNamed`

**Disposition of `on tap:` on plain `layout`:** **removed.** This is a v0.23 break (back-compat is explicitly not required). `on tap:` is now valid only on `button`, `tappable`, `link`, and user components — i.e., on things that have *role semantics*. Plain `layout` is for flex; tap-handling is a separate primitive class. This is the move that makes the design hypothesis bite: there's no longer a way to write a "tappable div."

**Why this beats Option B:**

1. **No type-tag-as-property.** `role: button` encodes the semantic type as a property of `layout`. Promoting it to a primitive (`tappable`) makes the type the primary surface form. PascalCase / lowercase / colon-separated keyword distinction is how Igni already signals semantic categories; primitives are the natural home.
2. **Stronger LLM signal.** "Make this card clickable" → `tappable: card: ...` is one syntactic shape. With B, the model has to remember `layout role: button` is the magic incantation, plus pick the right children. With this option, primitive choice *is* the semantic choice.
3. **No `on tap:` on plain `layout`.** This is the sharpest thing the proposal does. It eliminates the Q3a aliasing entirely — there's no longer a `layout, on tap:` form to compete with `button` or `tappable`. Semantic role is forced at the primitive choice site.
4. **`card` solves the Rectangle problem without the name "rectangle."** `rectangle` is geometric (Figma vocabulary), `card` is semantic. Path C says match Figma's auto-layout vocabulary, and Figma calls these "frames" or "containers" — but the *semantic* content is "card-like styled box." `card` is the right name in Igni's vocabulary even if Figma's tree calls it a frame.

**Strongest objection (Option B side):** "You've added three primitives where one property would do. Spec budget!"

**Defence:** Spec budget is paid in *learnability*, not keyword count. Three primitives with clean orthogonal semantics (`card` = style, `tappable` = button-role, `link` = link-role) cost less LLM-zero-shot accuracy than one `role:` property whose value list (`button | link | card | ?`) is itself a learnability tax — the model has to memorise the value enum, plus the rule about which children are valid, plus the rule about which other properties are mutually exclusive. The "one property with a value-tag" pattern looks economical but front-loads complexity into a single overloaded form. Three primitives is **flatter** in the namespace shape an LLM models.

The genuinely strong objection is: **"Where does this stop? Will you also add `dialog`, `disclosure`, `tabs` as primitives?"** Answer: yes, on the v0.24 HTML-transpile cycle, exactly as Q3d argues. The interactive primitive set should match HTML's interactive element set, because that's the strongest semantic vocabulary available and the one HTML a11y enforces. Flutter's vocabulary is a subset; designing to the union is the right move.

---

## Predicted principled-minority reversal

If Tyr reverses the panel, the strongest case is:

> **"This isn't a primitive question — it's a `component` question. The whole point of user-defined components is that 'tappable card' is a *user pattern*, not a *language primitive*. If the language ships `tappable` as a primitive, you've conceded that user-defined components can't carry a11y semantics correctly — which means the component system has a hole. Fix that hole instead."**

The reversal would be: **don't add `tappable` or `link` as primitives. Instead, add `role:` as a property on `component` definitions** — `component PostCard, role: button:` — so user components declare their a11y role at the definition site, and *that* propagates correctly through codegen. The base primitive set stays small; users compose their own semantic primitives; `on tap:` on plain `layout` is still removed (the Q3a fix); but the role attaches to component declarations, not to ad-hoc layout uses.

This reversal has real force because:

- It keeps the primitive set minimal (Igni's stated goal).
- It pushes the a11y problem to where it actually lives — *user components are the things that carry application-level semantics*, not primitive layouts.
- It dovetails with `emit` events: a component that declares `role: button` could automatically translate its `emit tap` into the right HTML/Flutter semantics.
- It exposes a real gap in the current spec: user components currently can't declare a11y roles, which is a v0.24 HTML-transpile blocker regardless of Q2.

I don't endorse the reversal — `tappable` as a primitive is more LLM-legible than role-on-component, because the role appears at the *use site*, not the definition site, and zero-shot generation favours use-site signals. But the reversal's case is strong enough that v0.23 should resolve **both** questions: ship `tappable` / `link` / `card` *and* add `role:` to component declarations. They're not alternatives; they're different layers of the same problem.