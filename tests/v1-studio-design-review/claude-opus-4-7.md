# Claude Opus 4.7 — v1 Studio strategic critique

**Run date:** 2026-05-01
**Session shape:** all-five-at-once (single paste of paste-package.md after cheatsheet attach)
**Cheatsheet version:** v0.21.1
**Brainstorm doc version:** docs/private/134 as of 2026-05-01

---

# Igni v1.0 / Studio architectural critique — Claude Opus 4.7

Pressure-test of operator-side positions Q1–Q5, grounded in the Igni v0.21.1 cheatsheet.

---

## Q1 — Wireframe vs semantic primitives split

**Verdict:** REFINE
**Confidence:** MEDIUM-HIGH

**Reasoning:**

The "two families" framing is muddled and the proposal partially collapses on inspection. Look at what Igni v0.21.1 actually has: display primitives (`label`, `image`, `icon`, `badge`, `spinner`, `divider`) and input primitives (`button`, `input`, `toggle`, `checkbox`, `slider`, `dropdown`). There are no geometric shape primitives. So Q1 is not really about splitting existing primitives — it's about which new ones to add for v1.0 and how to organise the docs around them.

Walk through the proposed members. Wireframe family: `rectangle`, `circle`, `line` are genuinely new — they don't exist and would be additions. `text` duplicates `label`. `image` already exists. Semantic family: `button` and `input` already exist. `heading` duplicates `label, style: heading` (already in the styling section as a flat token). `link` is `label, color: brand, on tap: open(url)` — composable, not a primitive. So the actual proposal collapses to: **add `rectangle`, `circle`, `line` as new visual primitives.** The rest of the "split" is renaming or duplication.

This matters because of "one way to do everything." Shipping both `text` and `label` for the same job creates an immediate teaching wart — every cheatsheet section about text now has to say "this works on `label` but also on `text` and they're identical." That's the kind of thing the cheatsheet review process is supposed to catch (per the v0.20.1 typography rename note about keyword collisions surfaced by cheatsheet review). The same logic applies here: don't ship duplicative names because a "two families" mental model demands them.

The legitimate motivation — Studio canvas needs filled-shape primitives that aren't constrained to "thing-with-children" semantics — is solved by adding c primitives. A `rectangle, color: brand, size: spacing/8` has a clear use that today requires an empty fixed-size layout hack. That's worth fixing.

**Refinement:** Add `rectangle`, `circle`, `line` to the existing display primitive list. Drop `text` / `heading` / `link` from the proposal — they duplicate existing capabilities. Don't introduce a "wireframe vs semantic" taxonomy in the docs; it's organising-vocabulary that doesn't help anyone read the spec. The flat Display / Input / Layout grouping in the current cheatsheet is functional; new primitives slot into Display.

---

## Q2 — Modular interactivity (any primitive can be tappable)

**Verdict:** HOLD with strong refinement
**Confidence:** MEDIUM

**Reasoning:**

The counter-position is misframed. The cheatsheet already says: "All input primitives (and any layout / component) accept `on tap:` and `on touch:`." Layouts are already interactive. Modular interactivity is partially the rule today; the question is whether the new shape primitives from Q1 inherit it.

If they do, the rule generalises cleanly: anything renderable can be tapped. If they don't, the asymmetry ("layouts can have `on tap:` but rectangles can't") is harder to teach than the unified rule. The cheatsheet already has consistency wins from this kind of rule-flattening — see the v0.20.4 rename of `heading.small` to `title` for "flat-naming consistency." Same instinct applies here.

The accessibility concern in the counter-position is real, though, and the operator's "`role:` is orthogonal" framing is too soft. Designers will forget `role:`. The fix is not optional and not magic-defaulted: **`on tap:` on a non-`button` shape primitive must require explicit `role:` at compile time.** Parse-time error if missing. This pushes against "no magic" by requiring something the language wouldn't otherwise demand, but it's exactly the principled trade Igni already makes elsewhere — `input bind: shared.X` is rejected, `spacing/7` is rejected, `border: 1px` is rejected, `with` on function-call bases is rejected. The pattern is consistent: when the easy-shortcut creates a fragile-by-default outcome, the compiler refuses to ship the ambiguity.

The alternative — auto-imply `role: button` from `on tap:` on shapes — is wrong twice over. (1) It's magic that hides accessibility decisions inside language-runtime behaviour. (2) Not every tappable shape is a button. A `rectangle, on tap: ...` might be a card, a tab, a list-row, an option in a custom selector. Auto-inferring `role: button` is opinionated where the language should be neutral, and it breaks the moment a designer wants `role: tab` and forgets to override the implicit default.

**Refinement:** Ship modular interactivity AND a `role:` system together as an indivisible v1.0 unit. Compiler rejects `on tap:` on `rectangle` / `circle` / `line` without an explicit `role:`. Built-in primitives like `button` carry an implicit `role: button` (overridable). Layouts continue to behave as today (an `on tap:` layout doesn't require `role:` because layouts have implicit container semantics, but accept `role:` as an override). The `role:` vocabulary is a bounded enum (`button`, `link`, `tab`, `switch`, `option`, `none`) — not free-string ARIA passthrough; that escape hatch is for v1.x. Tokens, not strings, matches the rest of the spec.

---

## Q3 — v1.0 positioning model: flow-only vs flow + bounded-offset

**Verdict:** FLIP (toward the counter)
**Confidence:** HIGH

**Reasoning:**

Bounded offset shouldn't be on the roadmap. Take it off, don't just defer.

The cheatsheet's design pressure is consistently against numeric escape hatches. Spacing is token-only (`gap: 12` rejected). Border width is token-only (`border: 1px` rejected). Rounded is token-only. Max-width is token-only (`max_width: 540` rejected). Colors outside `theme:` are token-only. Durations are whitelist-only. Backslash line-continuation is rejected. Truthiness is rejected. The pattern is unmistakable: every time the spec faces "let's add a numeric escape hatch," it says no, and the rationale is consistent — token discipline keeps decisions traceable to one place and prevents the slow drift into "Igni reinvented CSS."

`offset_x: spacing/2` is the same shape of decision. Even bounded to spacing tokens, the precedent is corrosive. Today it's "bounded offset, spacing tokens only." Tomorrow there's pressure for `spacing/7` (already-rejected, but the use cases will keep arriving). Then negative offset (designers always want negative offset). Then z-index (because overlap without ordering is ambiguous). Then absolute positioning. Each step is small; the sum is "Igni grew a CSS positioning model." The deferred-to-v1.x framing doesn't solve the problem; it kicks the can to a later release where the same arguments apply with worse footing — by then there are existing apps using flow-only positioning, and adding offset is a breaking-style addition rather than a clean v1.0 design choice.

The legitimate cases where designers reach for offset are a small set: floating action button (FAB), badge on avatar, decorative elements behind content, tooltips/popovers anchored to triggers. None of these need `offset_x:`. They need a stacking primitive — what Flutter calls `Stack`, what the web calls `position: absolute` inside `position: relative`. Igni doesn't have one. The right v1.x addition is `layout stack:` — children stacked on top of each other, each child with optional `align:` tokens (`top_left`, `top_center`, `top_right`, `bottom_left`, `bottom_center`, `bottom_right`, `center`, plus the existing `start`/`center`/`end`). This stays in flow + alignment vocabulary. It composes with existing primitives (`Stack` of an `image` + `badge`). It doesn't introduce numeric offsets, even bounded ones.

This also reduces Q4's pressure (Studio canvas semantics). If Studio's canvas only knows about flow + stacks + alignment tokens, the canvas vocabulary is finite, the source-mutation rules are tight, and round-trip is provably lossless. Adding offset to v1.0 — even bounded — means Studio's direct-manipulation has to support per-axis numeric handles, which is exactly the Figma-clone framing Q4 should be rejecting.

**Replacement:** take bounded offset off the roadmap entirely. Replace the "deferred offset" tracked-question with a "deferred stacking primitive" question, scoped specifically to `layout stack:` + alignment tokens. The phrasing matters — "stacking primitive" describes a flow-vocabulary addition; "bounded offset" describes a positioning-vocabulary addition that the rest of the spec is structured to refuse.

---

## Q4 — Igni Studio canvas semantics: direct-manipulation vs source-first

**Verdict:** REFINE
**Confidence:** MEDIUM-HIGH

**Reasoning:**

The operator's "direct-manipulation canvas" framing is too ambitious for a UI-DSL toolchain. The counter's "source-first read-only" framing is too restrictive. The right shape is between them.

Igni's value proposition, as it surfaces throughout the cheatsheet, is: source is the artifact, source is human-readable, source is LLM-accurate. Studio is in service of that, not in tension with it. A Figma-clone direct-manipulation canvas requires every primitive to have a canvas-vocabulary handle — drag, resize, rotate, snap, etc. That constrains language design to "what can we manipulate visually?" — the wrong tail wagging the dog. It also creates a permanent maintenance burden: every new primitive has to ship with canvas-side handles, every new layout property needs a UI affordance, every new theme token needs an editor pane. The language stops being a minimal UI DSL and starts being a thing that fits in a visual editor.

But pure source-first throws away the legitimate value of a canvas surface. Designers do want to see the result, click on a thing, and edit declaratively. Diagnostics overlays (accessibility issues, contrast warnings, layout-shift indicators) are most useful on the rendered tree, not the source AST. State inspectors, theme previewers, and component browsers all live more naturally on the rendered side. The counter-position's challenge ("why bother with Studio at all vs polishing the VS Code extension?") has a real answer — Studio adds a render canvas with click-to-source, accessibility/contrast diagnostics, a state inspector for `shared:` and screen state, a theme editor with live preview, a component browser, and an asset manager. None of these require Figma-style direct manipulation. All of them justify a dedicated product surface.

The middle path: **source-first with narrow direct-manipulation channels.** Most of the canvas is render preview. Specific gestures mutate source through tightly-scoped affordances:

- Click on a primitive → highlight source → editing happens in source pane
- Drag spacing handles between siblings → updates parent's `gap:` token (snaps to spacing/N or word tokens)
- Drag padding handles on a layout → updates `padding:` token
- Color picker on a primitive → updates `color:` to a token (or opens theme editor to declare a new token)
- Resize handles on a `rectangle` / `circle` → updates size to a spacing token (no arbitrary px)
- Theme editor pane → mutates `theme:` block directly

Every direct-manipulation gesture maps to a token-snap source mutation. No drag-anywhere, no pixel-precise handles, no arbitrary positioning. The canvas teaches the language by constraining gestures to language-vocabulary.

Language-design decisions that enable this: token-only discipline (already in v0.21.1) — direct-manipulation needs a finite snap-vocabulary. Stacking primitive (Q3 refinement) — without stacking, "drag this slightly to overlap that" has no source representation. `role:` system (Q2 refinement) — Studio's accessibility diagnostics need explicit role declarations to surface issues. Token pairs (Q5) — Studio's contrast preview is trivial when pairs are declared.

What in the current cheatsheet resists canvas-vocabulary: `each item in items:` with dynamic-length lists — canvas needs to render either a placeholder count or live mock data; design-time data is ambiguous. Reactive `fetch()` and `every:` blocks — canvas can't render time-varying state without simulating; either freeze, mock, or skip (the test harness's `mock fetch:` and `freeze_time:` are conceptually the right tools to reuse). Cross-screen `navigate to` — canvas shows one screen at a time; navigation requires either artboards or modal preview. These are solvable with conventional design-tool patterns (mock-data fixtures, time-freeze toggle, multi-artboard view), but they need explicit Studio-side product decisions and shouldn't sneak into language design as runtime behaviours.

**Refinement:** explicitly reject the Figma-clone framing. Studio is "source-first IDE with canvas affordances" — a developer-tool-class product that includes a render canvas with bounded direct-manipulation gestures, not a design-tool clone. Document the bounded-gesture vocabulary as part of v1.0 spec (or a v1.0-companion Studio spec) so language and tool co-evolve consciously rather than the canvas pulling language design.

---

## Q5 — Token pair system for coloured primitives

**Verdict:** HOLD on (b) with refinement
**Confidence:** MEDIUM

**Reasoning:**

Token pairs (b) is the right shape. The other options fail for distinct reasons.

(a) Auto-contrast (luminance-based) violates "no magic." When a designer sees white text on a button, they need to be able to trace why. "We computed it from luminance" is exactly the opaque rule the cheatsheet's design culture rejects elsewhere — see the explicit footgun call-out for `round(60, 1)` returning a string, or the cheatsheet's repeated emphasis that reactivity is "by reference, not by value-diff" (predictable from source, not from runtime computation). Auto-contrast is the same shape: a runtime rule that determines visible output from invisible computation. It scores well on spec budget (zero new syntax) but loses on traceability, which Igni values higher.

(c) Per-primitive `text_color:` adds a property every coloured primitive has to remember. Designers will set `color: brand` and forget `text_color: white`, ship white-on-white bugs in the long tail. The button/badge/etc. surface area where this matters is large enough that "designer responsibility" leaks into production. Same critique applies to (d), more so — (d) is just (c) with no syntactic affordance.

(b) is explicit, source-visible, and matches Igni's existing precedent. The cheatsheet already encodes role-specific tokens: `card` is background-only, `text` is the default text colour, `subtle` is a muted variant. Adding `on_X` companions extends this rule, not contradicts it. It also renders cleanly in Studio — a theme editor can show `brand` and `on_brand` side-by-side with a contrast ratio, which is harder to do for (a) (requires rendering against arbitrary backgrounds to demonstrate) or (c) (requires use-context to show anything).

**Refinement:** Built-in tokens ship with default pairs. The current built-in palette is `brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`. Each ships with a sensible `on_X` default — `on_brand: white`, `on_yellow: black`, `on_white: black`, etc. Designers who don't override `theme: color:` get correct contrast for free. User-defined tokens require both — declaring `primary_700: "#1D4ED8"` without `on_primary_700: ...` is a parse-time error.

The harder sub-question: when a designer overrides a built-in, do they also need to override its pair? Two options. (1) Yes always — overriding any token requires overriding the pair. (2) Only if they want to change the pair — overriding `brand` keeps the existing `on_brand`. Option 2 is more ergonomic but creates a real footgun: designer overrides `brand: "#FFFF80"` (light yellow), `on_brand` stays white, white-on-light-yellow ships unreadable. Option 1 forces the contrast conversation at the override site. I'd ship option 1 with the parse-time check — same shape of rule as "user-defined tokens declare both," no asymmetry between built-in overrides and new tokens, no implicit-inheritance footgun.

Spec-budget cost is real but bounded: every theme block declares pairs. This is a one-time cost per theme block, not per use-site. The alternative (per-primitive overrides in (c)) is a per-use-site cost that scales with app size. Pairs are cheaper at scale and align with the cheatsheet's general "decide once at the theme level, reference everywhere" pattern.

Studio implication: the canvas's contrast-warning overlay is implementable purely from the declared pair. No runtime luminance computation, no use-context resolution, no special cases. When a designer authors a new token in the theme editor, Studio can require both halves of the pair before the theme block is valid — same rule as the language compiler, surfaced in the GUI.

What I'd FLIP if pushed harder: the built-in-defaults assumption. A purer version of (b) ships with NO built-in pairs — every project declares pairs explicitly in `theme: color:`. More boilerplate, but the rule simplifies to "if you have a `theme: color:` block, every token has a pair." Eliminates the "are built-ins implicit or explicit?" question. I lean against this — too much boilerplate for the common case, and the built-in defaults are well-defined contrast cases that users mostly won't want to override — but it's defensible if the asymmetry between "implicit built-in pairs" and "required user-token pairs" feels wrong.
