# Roadmap

Where Igni is going. Near term is actively planned; ideas are unstructured thoughts for someday.

---

## Near term

Things to build next, roughly prioritised.

- **Identity semantics** — reference identity + immutable data creates friction. 2/3 cold-test models flagged it. Need to decide: `key:` field on objects, structural equality, or something else. Biggest open design question.
- **`on change:` event** — needed for dropdowns and validated inputs. Transpiler gap.
- **`fetch` mutations** — `method:` / `body:` for POST/PUT/PATCH/DELETE. Spec has it, transpiler doesn't.
- **Comments passthrough** — lexer skips `#` comments, should emit `//` in Dart for debugging.
- **Reactive re-fetch** — fetch URL depends on a variable that changes; auto re-runs.

## Ideas

Unfiltered. No timeline. Some of these might be bad.

- `lower()` / `upper()` / `trim()` string builtins
- `unique(list, item => key)` for deduplication
- Date/time primitives
- Form validation pattern (multi-field, cross-field)
- Named slots for wrapper components (`body header:`, `body footer:`)
- Lifecycle hooks (`on appear`, `on disappear`) for analytics/refresh
- Shared state namespacing or grouping
- Animations and transitions
- `debounce:` modifier on `input bind:`
- Error inspection (`user.error.message`, 404 vs 500)
- Package/module system for sharing components across projects
- Scroll behaviour (scroll-to-bottom on chat append)
- Deep links, query params, modal stacks, back-stack management
