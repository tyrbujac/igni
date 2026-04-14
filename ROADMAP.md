# Roadmap

Where Igni is going. Near term is actively planned; ideas are unstructured thoughts for someday. Priority signals come from cold-LLM tests and human testing — not speculation.

---

## Near term

### ~~Stream 1 — Transpiler: close the spec gap~~ DONE

All major v0.6.6 spec features now have transpiler support. 27 diff tests, 0 failures. Remaining low-priority items (`theme:` block, `paginate:` on `each`) moved to Ideas.

### Stream 2 — Tooling: close the human experience gap (START HERE)

The v0.6.6 rating assessment identified tooling (4/10) and debugging (3/10) as the biggest drags on the human experience. These don't require spec changes and don't risk LLM accuracy regressions.

**Done:**

1. ~~**VS Code syntax highlighting**~~ — TextMate grammar in `editors/vscode/`. Keywords, UI primitives, events, properties, inline function calls, component params, type hints. Verified in Cursor.
2. ~~**`print()` builtin**~~ — works with zero code changes. Generic function call fallback produces valid `print()` in Dart. Browser-tested.
3. ~~**`igni run` CLI cleanup**~~ — Igni-branded messages, build animation with timing, debug banner removed, tab title + favicon set to Igni.
4. ~~**Browser-test row layout fix**~~ — `fetch-reactive` (input + button in horizontal layout) confirmed working in browser.

**Next session priorities:**

1. **Browser-test remaining features** — `on-change`, `fetch-mutation` examples not yet browser-tested. Diff tests confirm Dart compiles correctly but don't prove it runs correctly.
2. **Better transpiler error messages** — map Dart errors back to Igni line numbers. Currently errors reference generated Dart code the user didn't write. Source maps or line-number tracking in codegen.
3. **`igni new`** — project scaffolding. `igni run` works, needs the matching setup command.

**Optional:** end-to-end cold test — now that the transpiler covers `on change:` and fetch mutations, a full pipeline test (spec → LLM → transpile → run in browser) is possible for the first time with these features.

### Stream 3 — Spec: v0.7 design exploration

Language-level improvements identified by cold tests and the rating assessment. These require spec changes and should be cold-tested before committing.

- **Object spread/update syntax** — #1 human writability pain point. `replace(items, target, {text: target.text, done: not target.done})` requires enumerating every field. Something like `{target with done: not target.done}` would eliminate the boilerplate. High impact on both writing and reading code. Needs careful design to not add LLM confusion.
- **Derived state clarity** — `current = stories[index]` appeared in all 8 Destini model outputs. 7/8 trust reactivity to update it; 1/8 defensively reassigns. One-line spec clarification: "Assignments at screen body level re-evaluate on every render."
- **Variable-placement rules** — 1/4 Contacts models put filter/sort logic inside a layout block. Spec says "Variables, layouts, and functions all live inside the screen body" but the boundary isn't explicit. One sentence: "Variable assignments go at the screen body level, not inside layout blocks."
- **Identity semantics** — reference identity + immutable data creates friction. **4/4 models flagged it across two test rounds.** Biggest open design question. Need to decide: `key:` field on objects, structural equality, or something else.
- **Error inspection** — `is error` tells you something failed but not what. 3/4 models flagged it. Need at least `user.error.message` and 404 vs 500 distinction.

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
- `lower()` / `upper()` / `trim()` string builtins — Claude flagged string manipulation gaps
- `unique(list, item => key)` for deduplication
- Date/time primitives — Claude flagged in v0.6.2 review
- Form validation pattern (multi-field, cross-field)
- Named slots for wrapper components (`body header:`, `body footer:`) — 3/4 models flagged single slot as limiting
- Lifecycle hooks (`on appear`, `on disappear`) — 3/4 models flagged. Needed for analytics, refresh-on-return
- Shared state namespacing or grouping — 4/4 models flagged flat namespace scaling
- Animations and transitions
- `debounce:` modifier on `input bind:` — 4/4 models flagged the async footgun
- Derived state / memoisation — 3/4 models flagged recompute-on-every-render concern (note: Flutter handles render efficiency, but explicit computed values might still be useful)
- Package/module system for sharing components across projects
- Scroll behaviour (scroll-to-bottom on chat append)
- Deep links, query params, modal stacks, back-stack management
- Map/dictionary type — Settings cold test showed 4/4 models using if/else chains for country→cities mapping. `cities_for[country]` would be cleaner. Comes up in settings, localisation, routing, form options
- String interpolation — 2/4 models flagged `+` concatenation as verbose. Rating assessment flagged as medium-high impact for human writability
- ~~`button background:`~~ — resolved by full-width rounded buttons (v0.6.6)
- ~~Background image on layouts~~ — **resolved.** Spec and transpiler both done.
- ~~`image fill: true`~~ — **resolved.** Background image feature on screens/layouts eliminated the need.
- Async cancellation / stale response handling — ChatGPT flagged race conditions
- Error boundaries / component-level fallback — ChatGPT flagged no crash isolation
