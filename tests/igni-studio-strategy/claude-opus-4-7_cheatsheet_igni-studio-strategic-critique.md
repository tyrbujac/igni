# Critique: Igni Studio Product Concept

## Q1 — Round-trip claim: **REFINE**

The "1:1 mapping" claim is the load-bearing marketing line, and it's *partially* true — but it leaks in specific, predictable places that the cheatsheet itself reveals.

**Where round-trip breaks for real apps:**

1. **Reactivity rules are expressed as source-only patterns.** The cheatsheet's #1 footgun — `total = count * price` (broken) vs `total(): return count * price` (correct) — is a *semantic* distinction with no visual representation. A canvas showing "label total" can't tell the designer whether `total` is a captured-once variable or a tracking function. The wrong version renders identically *until reactivity matters*. A canvas-driven user who drags in a label bound to a derived value has no scaffolding to choose between the two shapes.

2. **`every` blocks and lifecycle.** "The block fires while the screen is mounted... pauses on navigate-away... missed ticks are NOT replayed." This is invisible behaviour. What does an `every 1s:` block look like as a canvas object? An icon? A sidebar entry? Either choice teaches the designer to think about it as a "thing on the canvas" when it's a temporal contract.

3. **Lambdas inside list builtins.** `filter(items, item => item.id is not 42)` — the cheatsheet's own example of why structural-vs-reference equality matters. There's no auto-layout vocabulary for predicate composition. Figma has no concept that maps to `item => item.something`.

4. **Function bodies.** Multi-line `add():` containing `items = items + [{text: draft}]` followed by `draft = ""` is imperative sequencing inside a screen. The Todo example in the cheatsheet — described as "every line load-bearing" — has 8 of its 17 lines that are *not* renderable as canvas primitives (variables, function bodies, conditionals on state).

5. **`{target with done: not target.done}`** — the canonical update pattern. This is a pure-source idiom. No Figma auto-layout primitive corresponds to "shallow object spread with override."

6. **Test files entirely.** `*.test.igni` with `tap "Sign in"` / `expect seen "..."` / `mock fetch:` / `freeze_time:` — the entire test surface is source-only. Studio either ignores tests on the canvas (degraded round-trip) or invents canvas semantics for them (scope creep, contradicts Path C's "no escape hatches" discipline applied to the *product*).

7. **Reactive `fetch()` argument capture.** The cheatsheet warns: "Don't concatenate an `input bind:` variable into a fetch URL — it re-fires per keystroke." This is a *source-pattern lint*, not a visual constraint. A designer dragging a "data source" component connected to an "input field" component would naturally produce the broken shape.

**What Studio would need to add to make the claim hold:** a canvas surface for *non-rendering source* — variables, functions, `every` blocks, fetch declarations, lambdas. At which point the canvas is no longer "Figma-like auto-layout"; it's a node-graph IDE. That's a fundamentally different product than the pitch.

**Three scenarios where the claim *does* survive:** (a) static marketing screens — heading, image, body, CTA, all literal values; (b) themed component libraries — `Card`, `Avatar`, `Badge` with no internal state; (c) layout scaffolding — nested `layout vertical` / `horizontal` with `gap`/`padding`/`align`/`max_width` tuning. These three cases are exactly what FlutterFlow already handles. The differentiation collapses precisely at the boundary where Igni is *more* than a layout tool.

**Sharper claim for Studio:** "1:1 round-trip on the renderable subset; source-only authoring for behaviour, with AI agent assistance to bridge." This is honest and still distinctive.

---

## Q2 — Four-panel framing: **REFINE**

Missing: **the cheatsheet itself, as a visible artifact.** The product premise is "frontier LLM reads cheatsheet cold" — but Studio's framing treats the AI agent as a black box. If the cheatsheet is the contract that makes Igni LLM-tractable, Studio should *expose* it: a panel where the user sees what context the agent has, can pin parts of it, can see when v0.19 → v0.20 changes a rule the agent is relying on. Otherwise, every Igni version bump silently breaks Studio's agent quality and users can't diagnose why.

Over-included: **the green-flag toggle.** Scratch's green-flag works because Scratch programs have a discrete "start" — event-driven, often game-like. Igni screens are reactive-by-construction; the cheatsheet's reactivity rule says the screen "re-evaluates from the top whenever any variable it references is reassigned." There's no "off" state to toggle out of. A live-preview/canvas-edit toggle is conflating two different things: (a) *should the preview reflect ongoing edits live, or freeze?* (b) *am I manipulating layout or interacting with the running app?* These are orthogonal. A single toggle hides the second.

**Concrete alternative — five surfaces, two modes:**

- **Surfaces:** canvas, source, preview, agent chat, **context inspector** (cheatsheet + AGENTS.md + project rules the agent currently sees).
- **Modes (orthogonal):** *manipulate vs interact* (am I moving primitives or tapping buttons in the running app?) and *live vs frozen* (does the preview reflect unsaved edits?). Two binary toggles, not one three-way switch.

The Scratch metaphor is borrowed from a context where it earned its place. Don't import the metaphor; import the *principle* — make state changes legible.

---

## Q3 — File structure scaling: **FLIP**

The proposed structure encodes the v0.17 god-object failure mode directly into the recommended scaffolding. Cite the cheatsheet:

> "`shared:` blocks across multiple files **compose into a single namespace**... Same name in two files is a build-time error."

This is a *language feature* designed to let teams split shared state across files. The proposed `shared.igni` (singular) actively works against it — it teaches new users to put everything in one file, then hit the god-object problem the multi-file composition was built to solve.

**Concrete failure modes for 50 screens × 3 developers:**

1. **`shared.igni` as god-object.** Already flagged as a concern in v0.17.0. The structure's recommendation to use a single file *is* the failure mode. By month 6, three developers are git-conflicting on `shared.igni` every merge.

2. **Flat `screens/` namespace.** 50 screens at one directory level. `Profile.igni` for a user profile. A second `Profile.igni` for a company profile? Now a developer renames it `CompanyProfile.igni`, then someone else makes `UserProfile.igni`, naming convention drift starts. Cheatsheet says screens are referenced by bare name (`navigate to Profile user`), so the *file* name is decoupled from the *screen* name — making collision detection a runtime/build-time surprise rather than a filesystem one.

3. **`AGENTS.md` context-window saturation.** At 50 screens, project-specific conventions, theme tokens, shared-state schemas, component contracts — `AGENTS.md` exceeds frontier-LLM context budgets. The agent starts forgetting earlier sections. Quality silently degrades; users blame "the AI getting worse" when it's actually their own context bloat.

4. **Tests parallel to source, not co-located.** Cheatsheet: "Tests live in sibling `*.test.igni` files alongside source." But the proposed structure has a `tests/` folder. This contradicts the language's stated convention. Either the cheatsheet wins (move tests next to source) or the structure wins (the cheatsheet is wrong) — Studio can't have it both ways.

**Shape changes:**

- **Plural `shared/`** as a directory; one file per domain (`shared/auth.igni`, `shared/cart.igni`). Matches the language's multi-file composition rule.
- **`screens/` as a namespace tree**, not a flat list. `screens/onboarding/Welcome.igni`, `screens/account/Profile.igni`. Studio's IDE provides flat search; the filesystem provides organisation.
- **Co-located tests** (`Login.igni` + `Login.test.igni` in the same folder), per the cheatsheet's actual convention. Drop `tests/`.
- **`AGENTS.md` → `agents/` directory** with per-domain context files the agent loads on demand based on the file being edited. `agents/auth.md` loads when editing `screens/auth/*` or `shared/auth.igni`.

The proposed structure isn't wrong because it's ugly; it's wrong because it contradicts language features the cheatsheet documents.

---

## Q4 — Differentiation honesty

- **FlutterFlow:** Studio's defensible claim is *editable source — the file the canvas writes is the file a developer maintains, not generated artefact*. FlutterFlow can close this in 18 months by adding a "source view" mode, but only if they accept their proprietary node format becomes a presentation layer over a text language — a major architectural pivot, not a feature. **Differentiation holds.**

- **Webflow:** Different category (sites vs apps); Studio's claim is *native-app output via Flutter*. Webflow won't pivot to native; the differentiation is structural, not competitive. **Differentiation holds, but the comparison is mostly noise** — Webflow users aren't shopping for Studio.

- **Bubble:** Studio's claim is *no proprietary runtime*; Bubble apps run on Bubble's hosted backend. Bubble can't close this without abandoning their business model. **Differentiation holds.**

- **Cursor:** This is where it gets uncomfortable. Cursor + Flutter + a thin Igni-aware extension closes most of Studio's value in *weeks*, not 18 months. Cursor already has the AI agent; it already does AST-aware edits; it already preserves comments. Studio's only remaining edge is the canvas. If the canvas is only useful for the renderable-static subset (per Q1), then Cursor + screenshots-of-Figma + Igni source matches Studio's developer experience with no new product. **Differentiation collapses against Cursor unless the canvas earns its keep beyond static layouts.**

- **Lovable / v0 / Bolt:** These generate React, not Flutter. Their claim is "prompt to deployed app." Studio's claim is "designer-and-developer collaboration on the same source." Lovable can add Flutter output in 6 months; can add round-trip canvas in 18. The defensible edge is *Igni's design discipline making round-trip actually work* — but if Q1's leakage is real, Lovable can match the renderable-subset and out-iterate Studio on the prompt-to-app loop. **Differentiation is conditional on Path C holding up under product pressure.**

**Honest summary:** the strongest differentiation is structural (against FlutterFlow/Bubble); the weakest is against Cursor, which is the closest competitor to a developer-first Studio user. The pitch leans on FlutterFlow comparison because that's the comfortable one. The Cursor comparison is the one that should keep the team up at night.

---

## Q5 — Most likely failure mode + 6-month signal: **(verdict: anticipate this now)**

**Single most likely failure shape:** *The canvas becomes the primary surface for designers, the source becomes the primary surface for developers, the AI agent becomes the primary surface for everyone-in-a-hurry, and the round-trip property silently degrades because nobody's exercising it.* Specifically: designers stop opening the source view, developers stop opening the canvas, and within 3 months a class of edits exists that breaks when the disused surface is finally opened — comments stripped, formatting churned, semantically-equivalent-but-textually-different rewrites. The "round-trip-capable" claim becomes "round-trip-tolerated-but-nobody-trusts-it."

This is the failure mode because it's the *easy* path for users. The product asks them to maintain dual fluency. Most won't. The discipline that holds Igni-the-language together (one way to do everything) doesn't transfer to Igni-the-product unless Studio enforces it with friction users will resent.

**6-month signal:**

- **Primary metric:** *cross-surface edit ratio per user*. For each active user, what fraction of their sessions touch both canvas and source within a 7-day window? If this drops below 30% by month 4, the round-trip claim is decorative, not load-bearing. Users have self-segregated into single-surface workflows.

- **Support-ticket pattern:** "the canvas changed my code" / "the formatting got messed up after the designer edited" / "git diff is unreadable after a canvas session." This pattern appearing >5x/month is the canary. Each ticket means a user trusted round-trip and got burned; they will stop trusting it next time.

- **User behaviour:** designers committing `*.igni` files where the most recent commit message is "fix formatting" or "revert canvas changes." Developers adding `# do not edit in canvas` comments to files. Both are users patching around the failure mode in lieu of the product solving it.

- **Competitor move:** Cursor ships a "Figma frame import" feature that generates Igni source from a Figma export. If this happens, Studio's canvas becomes redundant for the import-Figma-once-then-edit-source workflow, which is the workflow most teams will adopt by default.

**The deeper signal underneath all four:** if AGENTS.md grows past ~3000 tokens of project-specific overrides, users have stopped trusting the language's design discipline to communicate intent and started encoding their own conventions. That's the language-level signal that Path C is leaking under product pressure — and it shows up *before* the round-trip metric does.