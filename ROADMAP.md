# Roadmap

Where Igni is going. Near term is actively planned; ideas are unstructured thoughts for someday. Priority signals come from cold-LLM tests and human testing — not speculation.

---

## Near term

Things to build next, roughly prioritised.

- **Identity semantics** — reference identity + immutable data creates friction. **4/4 models flagged it across two test rounds.** Biggest open design question. Need to decide: `key:` field on objects, structural equality, or something else. The mutation model depends on identity but the identity model is fragile (ChatGPT's diagnosis).
- ~~**Type hints in transpiler**~~ — **DONE.** 3/3 zero-fix on Contacts after this change.
- **Error inspection** — `is error` tells you something failed but not what. 3/4 models flagged it. Need at least `user.error.message` and 404 vs 500 distinction. Real apps need this.
- **`on change:` event** — needed for dropdowns and validated inputs. Transpiler gap.
- **`fetch` mutations** — `method:` / `body:` for POST/PUT/PATCH/DELETE. Spec has it, transpiler doesn't.
- **Comments passthrough** — lexer skips `#` comments, should emit `//` in Dart for debugging.
- **`igni new`** — project scaffolding. `igni run` works, needs the matching setup command.

## Testing

- **Angela Yu Flutter course projects** — rebuild her course projects in Igni as a real-world coverage test. Good stress test for the transpiler against progressively harder Flutter patterns, and produces concrete before/after comparisons (Flutter vs Igni) for the dissertation.
  - ~~**Dicee**~~ — **DONE.** 4/4 zero-fix cold test, 13 lines vs 56 lines Flutter (4.3x reduction). Drove: screen properties (`title:`, `background:`), local image assets, extended colours, `fill: true` layouts, AppBar support.
  - ~~**Xylophone**~~ — **DONE.** 4/4 transpile (after empty-block fix), 10 lines vs 45 lines Flutter (4.5x reduction). Drove: `play` audio builtin, `audio/` folder convention, `teal` colour, empty layout blocks. Weaker model convergence than Dicee — 2/4 extracted components, 2/4 inlined. Audio gap handled gracefully by all models (placeholder functions).
  - ~~**Quizzler**~~ — **DONE.** 4/4 zero-fix (after list indexing added), ~50 lines vs ~120 lines Flutter (~2.4x reduction). Drove: list indexing (`items[index]`), apostrophe escaping, label `align:` property. Most revealing cold test — 4 distinct approaches before indexing, near-identical after. Divergence-as-signal methodology validated.

## Ideas

Unfiltered. No timeline. Some of these might be bad. Signal strength noted where cold tests or reviews have data.

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
- `button background:` — full-width coloured buttons currently require a `layout horizontal, background: color` workaround. If 2-3 cold tests show models using this pattern, add `background:` to `button` directly
- String interpolation — 2/4 models flagged `+` concatenation as verbose. Intentional trade, but worth revisiting
- Async cancellation / stale response handling — ChatGPT flagged race conditions
- Error boundaries / component-level fallback — ChatGPT flagged no crash isolation
