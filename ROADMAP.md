# Roadmap

Tasks tiered by horizon: **Immediate** (sub-day, unblocking), **Next milestone** (one chunk of active work), **Future** (longer-horizon items with cold-test or panel signal). New items default to Future and get promoted by signal, not enthusiasm. History lives in `CHANGELOG.md`; methodology retrospectives in `docs/private/`.

## Current focus

- **Immediate**
  - **Mum tutorial rerun on 2026-04-25** against `docs/tutorial.md` (v2.5.1, targeting Igni v0.13.1). External human-test signal; gates Tier 2 cheatsheet improvements (`docs/private/64`).

- **Next milestone — three small real apps shipped (v1.0 criterion 4).** Quantity bar replacing the previous Boojy-subset framing. Chat-UI experiments (`docs/private/92`) confirmed Boojy is structurally wrong for Igni (creative-tool primitives Igni explicitly excludes), so criterion 4 is now "three small real apps" rather than "one flagship dogfood." First candidate: mum's tutorial-driven app (today's external cold-run). Two more TBD — personal-use side projects, not creative-tool-class. Audience scope documented in README "What Igni is for" + ARCHITECTURE "What this project is *not*."

- **Future** — see Streams below; Ideas at the bottom.

### Recently shipped

- **2026-04-26 session (latest, v0.14 Stage 3 STRONG PASS).** 4-frontier-model panel × 3 pre-registered prompts against shipped `spec/v0.14.0-cheatsheet.md`. **12/12 adoption + 12/12 transpile.** P1 countdown 4/4 canonical (`every 1s:` + `now()` + absolute-timestamp). P2 multi-block notes 4/4 (two `every` blocks, no modulo). P3 weather refresh 4/4 (`every 30s:` adopted; two valid composition shapes — 3/4 simple reassignment + 1/4 claude-opus URL-nonce trigger-variable). Methodology bonus 1: Flash-Lite went from hallucinating `timer interval:` block in Pomodonut baseline to producing zero hallucinations + canonical shapes once the cheatsheet taught `every <duration>:` explicitly. Methodology bonus 2: claude-opus generalised the v0.10 async-trigger pattern to time without explicit teaching — lexical reactivity composes at principles level. Trap-journal: `format_time()` invented in 6/7 cells across Stage 0 + Stage 3 (string-padding builtin v0.15+ candidate). v0.14 ship-hold confirmed. **Next: Pomodonut rerun** against `spec/v0.14.0-cheatsheet.md` — gates criterion-4 #2 close. If `bind: shared.X` blocks (carry-forward from Pomodonut/Stage-0), compounding signal for v0.14.x transpiler patch. Cumulative v0.14 cycle cost: $0.30 (Stage 2) + $0.39 (Stage 0) + $0.41 (Stage 3) = $1.10. Details in `docs/private/95` §Stage 3 outcome.
- **2026-04-26 session (latest, v0.14 implementation shipped).** `every <duration>:` block-opener at screen scope, multi-block per screen, whitelist `1s`/`5s`/`30s`, bundled with non-reactive `now()` builtin returning integer seconds since UTC epoch. Coupled `on change:` user-input-only clarification (docs-only — codegen already correct). 8 new transpiler fixtures (4 positive + 4 negative); 69 → 77 tests, all green. Spec: `spec/v0.14.0{,-cheatsheet,-micro}.md`; v0.13.1 archived. CHANGELOG + SYNC markers updated. Cycle so far: design (round 1) → architectural pushback (round 2) → Stage 2 design review (round 3) → Stage 0 9/9 (round 4) → implementation. **Stage 3 + Pomodonut rerun queued for next session** — closes criterion-4 #2 if Pomodonut transpiles cleanly against v0.14.0-cheatsheet. Commit `26e29f2`.
- **2026-04-26 session (later-later, v0.14 timer Stage 0):** 3-frontier-model panel × 3 pre-registered prompts against `tests/v0.14-stage0/cheatsheet-draft.md`. **9/9 adoption** — passed pre-reg ship bar (3/3 on each prompt). P1 countdown 3/3 canonical (`every 1s:` + `now()` + absolute-timestamp). P2 multi-block notes auto-save 3/3 (two `every` blocks, no modulo workaround). P3 live weather refresh 3/3 (`every 30s:` + convergent `weather = fetch(...)` reassignment composition — no cheatsheet teaching needed for fetch+every). Methodology bonus: lexical-reactivity composes natively with new primitive at the principles level. Methodology trap captured: ran with default `--grade` flag against unimplemented syntax → false-fail signal. Future pre-implementation Stage 0 runs default to `--no-grade`. **v0.14 green-lit for implementation in next session** — spec write + cheatsheet promote + lexer/parser/codegen + fixtures. Details in `docs/private/95` §Stage 0 outcome.
- **2026-04-26 session (later, v0.14 timer Stage 2):** 3-model design-review panel ran against design note 95 (v0.14 timer primitive). Pre-revision: first draft recommended `on tick:` event handler at screen scope; architectural pushback flipped the recommendation to `every 1s:` block-opener (user-action invariant on `on X:` family preserved; variable-rate-ready via duration-token whitelist; softer 3/4 ship bar). Stage 2 critique convergence: **3/3 unanimous — one-block-per-screen rule is the weakest call (flip)**; 2/3 push back on `1s`-only whitelist (expand to `1s`/`5s`/`30s`); 3/3 flag canonical Pomodonut example silently broken on navigate-away (open decision: bundle `now()` builtin with v0.14, or defer to v0.15 with documented limitation). Patches queued in `docs/private/95` Stage 2 outcome section, not yet inlined — Tyr reviews `now()` decision before Stage 0. First spec round driven primarily by architectural reasoning over convergent panel signal — methodology-noteworthy (see §Methodology note in design note 95).
- **2026-04-26 session (later, real-app cold test):** Pomodonut criterion-4 #2 candidate cold-tested against v0.13.1 cheatsheet across the 4-model panel. **Pre-reg verdict: FAIL** (0/4 transpiled). Criterion-4 slot stays open. But methodology succeeded — 3/4 (claude-opus, gpt-5.5, gemini-3.1-pro) produced architecturally complete pomodoros and **explicitly named the missing timer primitive** in their own design notes; only gemini-flash-lite hallucinated. New strong promotion signal for `every Ns:` / tick primitive (added to Stream 3); existing `bind: obj.field` signal reinforced from 4/6 to effective 7/10. Today's parser change (commit 1d9e502) validated against a fresh model — claude-opus hit the targeted `Identifier =` rejection inside a layout body and was given a path to the canonical shape. Details in `docs/private/94`. No `pomodonut.igni` shipped; dogfood-validated version saved at `tests/v0.13.1-pomodonut/dogfood-fixed.igni` for methodology record.
- **2026-04-26 session (later):** v1.0 criterion-2 entry closed via rejection-with-hint (Option B), not acceptance. `parseUINode` now detects `Identifier =` and emits a targeted error pointing at the canonical `color_for(item):` function shape. Single edit covers both bare-assignment and conditional-assignment cases (both route through `parseUINode`). No spec change. Same evasion shape as v0.9.1's `on change:` precedent. Two new negative fixtures pin the rejection sites.
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
- **Recurring-timer primitive — v0.14 SHIPPED, Stage 3 STRONG PASS (12/12). Pomodonut rerun queued.** Originally 4/4 Pomodonut cold test signal (2026-04-26): all four models attempted per-second countdown, 3/4 honest-no on missing primitive. **Design note: `docs/private/95_v014_timer_primitive.md`** went through three revision rounds (first draft → architectural pushback → Stage 2 design review patches). Final shape: `every <duration>:` block-opener at screen scope, multi-block per screen, whitelist `1s`/`5s`/`30s`, bundled with non-reactive `now()` builtin returning integer seconds since epoch UTC, coupled `on change:` clarification (user-input-only). Stage 0 cheatsheet draft cold test (2026-04-26): 9/9 adoption, all three frontier models reached canonically for `every <duration>:` + `now()` + multi-block + fetch+every composition. **Next session: v0.14 implementation** — `spec/v0.14.0.md` + cheatsheet promote + lexer/parser/codegen + fixtures. Stage 3 + Pomodonut rerun follow.
- **Field-access binding (`bind: obj.field` / `bind: shared.X`)** — 4/6 v0.11.4 Stage 3 + 3/4 Pomodonut 2026-04-26 = effective **7/10**. Models reach for both `each`-loop field access and `shared.X` field access. Two design shapes: widen transpiler to accept both forms (auto-wire through `replace` for each, direct write for shared), or strengthen cheatsheet teaching of the canonical mutation pattern (local var + `on change:` writeback). Promote rank — second-strongest candidate behind identity.
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
