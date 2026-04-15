# Roadmap

Where Igni is going. Near term is actively planned; ideas are unstructured thoughts for someday. Priority signals come from cold-LLM tests and human testing — not speculation.

---

## Near term

### ~~Stream 1 — Transpiler: close the spec gap~~ DONE

All major v0.6.6 spec features now have transpiler support. 27 diff tests, 0 failures. Remaining low-priority items (`theme:` block, `paginate:` on `each`) moved to Ideas.

### Stream 2 — Tooling: close the human experience gap

The v0.6.6 rating assessment identified tooling (4/10) and debugging (3/10) as the biggest drags on the human experience. These don't require spec changes and don't risk LLM accuracy regressions.

**Done:**

1. ~~**VS Code syntax highlighting**~~ — TextMate grammar in `editors/vscode/`. Keywords, UI primitives, events, properties, inline function calls, component params, type hints. Verified in Cursor.
2. ~~**`print()` builtin**~~ — works with zero code changes. Generic function call fallback produces valid `print()` in Dart. Browser-tested.
3. ~~**`igni run` CLI cleanup**~~ — Igni-branded messages, build animation with timing, debug banner removed, tab title + favicon set to Igni.
4. ~~**Browser-test row layout fix**~~ — `fetch-reactive` (input + button in horizontal layout) confirmed working in browser.

**Current priorities:**

1. **Better transpiler error messages** — map Dart errors back to Igni line numbers. Currently errors reference generated Dart code the user didn't write. Source maps or line-number tracking in codegen.
2. **Browser-test remaining features** — `on-change` and `fetch-mutation` now diff-test cleanly, but browser passes would confirm runtime behaviour rather than just generated Dart shape.
3. **`igni new`** — project scaffolding. `igni run` works; it now needs the matching setup command.

**Methodology state:** the v0.6.11 BMI re-run closed the v0.6.x patch arc. All three non-breaking additions changed model behaviour, including the documentation-only bottom-anchor pattern. That lowers the pressure to add syntax reactively; docs patches are now a validated tool, not a fallback. The v0.7.0 round added the second validation: cold-test data (what models produce) and qualitative ship-review data (what models critique) converge on the same gaps when both are run against the same version. Future versions use one narrower cold-test round plus one ship-review round, with priority ordering backed by compounded signal across both streams.

### Stream 3 — Spec: v0.7.1 shipped, v0.8 next

Language-level improvements identified by cold tests and the rating assessment. These require spec changes and should be explored one target at a time, then cold-tested before committing.

**Locked for v0.7.0:** ship exactly one language feature — colour/background token assignability. Strings stay `+`-only in this release. Object update ergonomics is assessed as too large for the same version and should be treated as a likely `v0.8` candidate unless a much smaller shape appears.

- **Colour/background token assignability** — **SHIPPED in v0.7.0.** BMI cold test: 3/4 models independently invented `bg = card` / `status_color = green` and used them in `background: bg` / `color: status_color` to style conditionally. The language now matches that natural pattern. `card` remains background-only at the property boundary.
- ~~**`body` slot inside horizontal layouts + button width**~~ **FIXED 2026-04-14 in v0.6.8.** `body` now renders exactly one widget. Callers wrap multi-child content in explicit `layout vertical:` / `layout horizontal:`. Fixes the BMI crash by construction — buttons wrapped in an explicit horizontal layout become direct Row children with intrinsic widths instead of `SizedBox(width: infinity)` inside an unconstrained Column.
- **Object spread/update syntax** — **v0.8 backlog, no longer first in line.** Biggest remaining human writability pain point. `replace(items, target, {text: target.text, done: not target.done})` requires enumerating every field. Something like `{target with done: not target.done}` would eliminate the boilerplate, but this touches object syntax directly and is larger than the two items that overtook it in v0.7.0 testing.
- **Event handlers as component arguments** — **leading v0.8 design question.** 2/4 BMI invention in v0.7.0 (Gemini 3 Flash invented `on_tap_handler` as a named parameter; GPT 5.3 invented `on decrease:` / `body.decrease()`). 3/4 ship-review flags (Gemini 3.1 Pro, GPT 5.3, Opus 4.6) = 5/8 compounded. The spec-legal workaround is string-key dispatch — verbose enough that half the frontier models reach past the spec. Structurally a question about the component reusability model: can a reusable input component drive parent state without knowing the parent's function names? Needs a full design note and candidate cold test before landing syntax.
- **Derived state clarity** — `current = stories[index]` appeared in all 8 Destini model outputs. 7/8 trust reactivity to update it; 1/8 defensively reassigns. One-line spec clarification: "Assignments at screen body level re-evaluate on every render."
- **Variable-placement rules** — 1/4 Contacts models put filter/sort logic inside a layout block. Spec says "Variables, layouts, and functions all live inside the screen body" but the boundary isn't explicit. One sentence: "Variable assignments go at the screen body level, not inside layout blocks."
- **Identity semantics** — reference identity + immutable data creates friction. **4/4 models flagged it across two test rounds.** Biggest open design question. Need to decide: `key:` field on objects, structural equality, or something else.
- **Error inspection** — `is error` tells you something failed but not what. 3/4 models flagged it. Need at least `user.error.message` and 404 vs 500 distinction.
- **Dictionary/map type** — Settings cold test showed 4/4 models using if/else chains for country→cities mapping. `cities_for[country]` with `{"UK": [...], "France": [...]}` syntax would be cleaner. Comes up in settings, localisation, routing, form options. Strong signal.

**How to approach Stream 3 now:** v0.7.1 shipped the strongest-signal item. Event handlers as component arguments are now the leading v0.8 design question (2/4 BMI invention + 3/4 ship review = 5/8), structurally larger than object update ergonomics because it concerns the component reusability model. Object update ergonomics is the backup v0.8 candidate. Both need their own design notes before syntax lands. Pending validation: Alert Dashboard rerun against the same four models to measure the delta on `upper()` adoption.

### ~~Stream 3a — v0.7.1: string case builtins~~ SHIPPED

v0.7.1 adds `upper(s)` / `lower(s)` string builtins. Evidence: 4/4 Alert Dashboard friction + 4/4 ship review = 8/8 compounded, strongest evidence in project history. Every frontier model hit the missing `upper()` on Alert Dashboard (Gemini 3.1 Pro wrote a mapper function, Opus 4.6 honest-flagged, Gemini 3 Flash ignored, GPT 5.3 invented `upper()` with a broken placeholder). Decision doc: `docs/private/31_v071_string_case.md`. Validation: Alert Dashboard rerun against the same four models, same methodology as the v0.6.11 BMI colour-assignability rerun.

---

## Testing

- ~~**Type hints in transpiler**~~ — **DONE.** 3/3 zero-fix on Contacts after this change.
- **Angela Yu Flutter course projects** — rebuild her course projects in Igni as a real-world coverage test. Good stress test for the transpiler against progressively harder Flutter patterns, and produces concrete before/after comparisons (Flutter vs Igni) for the dissertation.
  - ~~**Dicee**~~ — **DONE.** 4/4 zero-fix cold test, 13 lines vs 56 lines Flutter (4.3x reduction). Drove: screen properties (`title:`, `background:`), local image assets, extended colours, `fill: true` layouts, AppBar support.
  - ~~**Xylophone**~~ — **DONE.** 4/4 transpile (after empty-block fix), 10 lines vs 45 lines Flutter (4.5x reduction). Drove: `play` audio builtin, `audio/` folder convention, `teal` colour, empty layout blocks. Weaker model convergence than Dicee — 2/4 extracted components, 2/4 inlined.
  - ~~**Quizzler**~~ — **DONE.** 4/4 zero-fix (after list indexing added), ~50 lines vs ~120 lines Flutter (~2.4x reduction). Drove: list indexing (`items[index]`), apostrophe escaping, label `align:` property. Most revealing cold test — 4 distinct approaches before indexing, near-identical after.
  - ~~**Destini**~~ — **DONE.** Cheatsheet-only: 3/4 data-driven, 1 hardcoded if/else. Full-spec rerun: **4/4 data-driven** (Gemini Pro switched from hardcoded to data-driven). Background image **0/4 → 4/4** after spec addition. Architecture convergence restored by full spec.
- **v0.6.6 full-spec cold tests** — stress-tested advanced features with 3 apps:
  - ~~**Contacts**~~ — **DONE.** 4/4 identical architecture. Tested: `shared:`, `filter`/`sorted`/`reversed` + lambdas, `replace`/`without`, `fetch` + `is loading`/`is error`, navigation + params, wrapper component. 1 typo (Opus), 0 invented syntax. Strongest convergence in any cold test. Trigger-variable understanding: 4/4 correct.
  - ~~**Settings**~~ — **DONE.** 4/4 perfect — first cold test with zero errors across all models. Tested: `on change:` (4/4 correct, 3 distinct approaches), `heading.small` (4/4 correct), `dropdown`/`toggle`/`slider`/`checkbox`/`image round:`/`button color: danger`. Surfaced `bind:`/`on change:` event ordering gap (now documented and implemented).

## Ideas

Unfiltered. No timeline. Some of these might be bad. Signal strength noted where cold tests or reviews have data.

- `theme:` block — spec-defined but transpiler not implemented. Low priority (default theme works)
- `paginate:` on `each` — spec-defined but transpiler not implemented. Low priority (no cold test has exercised it)
- ~~`upper()` / `lower()` string builtins~~ — **SHIPPED in v0.7.1** (8/8 compounded signal from Alert Dashboard)
- `trim()` string builtin — Claude flagged in v0.6.2 review; no cold-test evidence yet. Would need its own signal before shipping (same bar as `upper`/`lower` cleared).
- `unique(list, item => key)` for deduplication
- Date/time primitives — Claude flagged in v0.6.2 review
- Form validation pattern (multi-field, cross-field)
- Named slots for wrapper components (`body header:`, `body footer:`) — 3/4 models flagged single slot as limiting
- Lifecycle hooks (`on appear`, `on disappear`) — 3/4 models flagged. Needed for analytics, refresh-on-return
- Shared state namespacing or grouping — 4/4 models flagged flat namespace scaling
- Animations and transitions
- `debounce:` modifier on `input bind:` — 4/4 models flagged the async footgun
- Derived state / memoisation — 3/4 v0.7.0 ship-review flags (Gemini 3.1 Pro, GPT 5.3, Gemini 3 Flash) on the reactive-recompute-at-scale concern. No cold-test evidence yet because no existing test app exercises reactivity over a large enough dataset. **Action:** design a targeted cold-test app (moderately large filtered list with a bound input field) to verify whether the predicted O(N)-per-keystroke is a real problem or theoretical. Flutter's render engine may already absorb it for typical sizes; measure before adding syntax
- Package/module system for sharing components across projects
- Scroll behaviour (scroll-to-bottom on chat append)
- Deep links, query params, modal stacks, back-stack management
- ~~Map/dictionary type~~ — moved to Stream 3 as v0.7 candidate
- String interpolation — 2/4 models flagged `+` concatenation as verbose. Rating assessment flagged it as medium-high impact for human writability. Explicitly deferred from `v0.7.0`; if revisited, the next step is a `{}`-only design note with exact syntax and error behavior, then a focused cold test.
- ~~`button background:`~~ — resolved by full-width rounded buttons (v0.6.6)
- ~~Background image on layouts~~ — **resolved.** Spec and transpiler both done.
- ~~`image fill: true`~~ — **resolved.** Background image feature on screens/layouts eliminated the need.
- Async cancellation / stale response handling — ChatGPT flagged race conditions
- Error boundaries / component-level fallback — ChatGPT flagged no crash isolation
