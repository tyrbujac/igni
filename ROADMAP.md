# Roadmap

Tasks tiered by horizon: **Immediate** (sub-day, unblocking), **Next milestone** (one chunk of active work), **Future** (longer-horizon items with cold-test or panel signal). New items default to Future and get promoted by signal, not enthusiasm. History lives in `CHANGELOG.md`; methodology retrospectives in `docs/private/`.

## Current focus

- **Immediate**
  - **Mum tutorial rerun on 2026-04-25** against `docs/tutorial.md` (v2.5.1, targeting Igni v0.13.1). External human-test signal; gates Tier 2 cheatsheet improvements (`docs/private/64`).
  - **Transpiler-coverage gaps for v1.0 criterion 2** — conditional assignment in layouts, bare statements in UI blocks. Fresh signal 2026-04-25: Gemini 3.1 Pro hit the bare-statements case in v0.13.0 Stage 3 (`tab_color = subtle` placed inside a layout block). Sub-day each.

- **Next milestone — three small real apps shipped (v1.0 criterion 4).** Quantity bar replacing the previous Boojy-subset framing. Chat-UI experiments (`docs/private/92`) confirmed Boojy is structurally wrong for Igni (creative-tool primitives Igni explicitly excludes), so criterion 4 is now "three small real apps" rather than "one flagship dogfood." First candidate: mum's tutorial-driven app (today's external cold-run). Two more TBD — personal-use side projects, not creative-tool-class. Audience scope documented in README "What Igni is for" + ARCHITECTURE "What this project is *not*."

- **Future** — see Streams below; Ideas at the bottom.

### Recently shipped

- **2026-04-26 session:** two transpiler bugs surfaced by Connect Four closed — lexer unary-minus on number literals + codegen scope-aware `declaredLocals` save/restore at each-block boundaries. Connect Four's source-level workarounds removed. New positive fixture `negative-numbers.igni`, new negative fixture `unary-minus-non-literal.igni` (pin: identifier-prefix unary minus stays rejected).
- **2026-04-25 session:** v0.13.0 + v0.13.1 `max_width` ship + Stage 3 4/4 + `gap:` × `each` transpiler fix. Details in `docs/private/91`, `92`; commits `8499bdd` `eca6148` `3681c2d` `5c8345e` `b787d2c` `a7cca4f`.
- Earlier sessions: `CHANGELOG.md`.

---

## Stream 2 — Tooling

Active priorities. Closes the human-experience gap surfaced by the v0.6.6 rating assessment; no LLM-accuracy regressions.

1. **Better transpiler error messages** — map Dart errors back to Igni line numbers via source maps or codegen line-tracking. Errors currently reference generated Dart the user didn't write.
2. **`igni new`** — project scaffolding companion to `igni run`.
3. **Runner provider-resilience** — Gemini Pro Task prompt has 6× cumulative network failures across two Stage 3 rounds. Add retry-with-backoff and/or fallback to `gemini-flash-latest` in `tests/runner/providers/google.ts`.
4. **Browser-test remaining features** — `on-change`, `fetch-mutation` diff-test cleanly but lack runtime browser passes.

## Stream 3 — Spec backlog (signal-ranked)

Active candidates with cold-test or panel signal. Each needs a design note before syntax lands.

- **Identity semantics** — 4/4 across two rounds. Biggest open design question. Decide: `key:` field on objects, structural equality, or alternative.
- **Dictionary/map type** — 4/4 Settings cold test. `cities_for[country]` with `{"UK": [...]}` literal. Comes up in settings, localisation, routing, form options.
- **Checkbox field-access binding (`checkbox bind: obj.field`)** — 4/6 v0.11.4 Stage 3 signal. Two design shapes: widen transpiler to accept `bind: obj.field` inside `each` and auto-wire through `replace`, or strengthen cheatsheet teaching of the canonical mutation pattern.
- **Error inspection + handling beyond async** — 3/4 (`is error` doesn't surface message/status) + 2/3 panel `docs/private/64` (doesn't cover user validation errors, null on out-of-bounds, function-level exceptions). One design note covering both.
- **String interpolation** — 2/3 panel `docs/private/64` flagged `+` concatenation friction. Possibly document-the-choice outcome rather than syntax change. Needs design note covering LLM-parsing-ambiguity, lexer simplicity, reader-surprise.
- **Widen async-footgun detection** — catch `on change: trigger = bound_var` evasion. Nice-to-have after v0.9.1 docs-only patch worked (3/3 frontier on canonical trigger), but the "no magic" principle still argues for transpiler-level rejection.
- **Variable-placement rules** — 1/4 Contacts + fresh 2026-04-25 Gemini Pro Stage 3 hit. Spec clarification ("Variable assignments go at screen body level, not inside layout blocks") + transpiler-rejection fixture candidate.
- **Layout sizing primitive (square cells)** — 2026-04-25 from tic-tac-toe. `aspect: 1` or `square: true` on layouts. `max_width:` doesn't cover it (narrowing the container doesn't fix per-cell aspect ratio). Ranks below other items pending second human-test surface.
- **v0.13.0 spec critique single-model raises** (`docs/private/91`) — `align: center` example ambiguity, horizontal-layout clarification, `max_width:` numeric-value compile-failure mode, "no-op" wording in rule 3. v0.13.2 doc-nudge candidates if any reproduce in a future panel.
- **Per-label `font:`** — `docs/private/78` Shape B deferred after v0.12 theme-level shape shipped. v0.14+ candidate.
- **Mutating-component-arg detection** — next v0.9-template candidate. Needs cold test first.
- **Derived state clarity** — 1/8 defensively reassigns derived state. One-line spec clarification.

## Ideas (signal-strong only)

Cold-test, panel-89, or rating-assessment signal noted. Unsignalled brainstorm items pruned.

- **Error-state primitive** — `forecast.error.message` / `.status`. 2/3 panel 89 (Tier 2 #1, concrete shape from Opus). Strongest 2/3 finding in panel 89.
- **`layout stack:` for z-axis** — FAB over list, badge corners, overlays. 1/3 panel 89 (Gemini, Tier 2 #2). Mirrors Flutter `Stack`.
- **`on submit:` modifier on `input`** — fires on Enter; closes reactive-fetch ergonomics without trigger-variable boilerplate. 1/3 panel 89 + addresses 2/3 "trigger feels hacky" signal.
- **Human-readability study** *(dissertation methodology, not language)* — 10-person think-aloud, Igni vs Flutter snippet prediction. 1/3 panel 89 (Opus, Tier 3 #1). Cheapest dissertation-credibility upgrade in the backlog; either outcome strengthens the chapter.
- **Mobile platform-manifest injection on `locate()`** — iOS `NSLocationWhenInUseUsageDescription`, Android `ACCESS_FINE_LOCATION`. `locate()` currently silently routes to `is error` on mobile. Gated on mobile becoming first-class.
- **Lifecycle hooks (`on appear`, `on disappear`)** — 3/4 flagged. Analytics, refresh-on-return.
- **Named slots for wrapper components** (`body header:`, `body footer:`) — 3/4 flagged single-slot limit.
- **Shared state namespacing / grouping** — 4/4 flagged flat namespace at scale.
- **`debounce:` modifier on `input bind:`** — 4/4 flagged async footgun.
- **Derived state / memoisation** — 3/4 v0.7.0 ship-review on reactive-recompute-at-scale. Action: design a targeted cold-test app (large filtered list + bound input) to verify whether O(N)-per-keystroke is real or theoretical before adding syntax.
- **Async cancellation / stale response handling** — race conditions flagged in v0.6.x review.
- **Error boundaries / component-level fallback** — no crash isolation flagged in v0.6.x review.

---

## Post-v1.0 (parked)

Documentation set (~15–25k words across Tutorial, Reference, Cookbook, Examples gallery). Language Server (LSP-compatible, ~1,500–3,000 lines reusing transpiler AST). VS Code refactoring tools. Snippets extension. Hosting at `ignilang.dev` via VitePress or mdBook. Detail moves to a dedicated planning doc when any becomes near-term.

## Process notes

- **Cheatsheet size discipline.** Subsequent docs-only iterations prune before adding. Context-specific patches (single cold-test findings, single-model workarounds) belong in the full spec's reference sections, not the cheatsheet's learning path. Last prune: v0.11.5 (cheatsheet 2,931 → 2,536 words).
- **Tier discipline.** New items default to Future. Promoted by cold-test or human-testing signal, not enthusiasm.
- **Spec-iteration cycle** — 9 named stages with commands and human checkpoints. See [`docs/cycle.md`](docs/cycle.md) for the canonical reference. v0.13 ship (`docs/private/91`) is the worked example.
