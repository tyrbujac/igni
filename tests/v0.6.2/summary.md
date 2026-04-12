# v0.6.2 Cold-LLM Test Summary

**Date:** 2026-04-12
**Spec:** v0.6.2
**Test:** Contacts app (search, filter, sort, navigation, favourite toggle)
**Models:** Claude Opus 4.6, Gemini 3.1 Pro, ChatGPT

---

## Results at a glance

| | Claude Opus 4.6 | Gemini 3.1 Pro | ChatGPT |
|---|---|---|---|
| **Spec grade** | PASS | PASS | FAIL |
| **Transpiles?** | Yes (2 fixes) | Yes (2 fixes) | No |
| **Runs in browser?** | Yes | Yes | — |
| **`shared:` correct?** | Yes | Yes | No |
| **List mutation correct?** | Yes (`replace`) | Yes (`replace`) | No (in-place) |
| **`toggle label:`** | Misused | Misused | Misused |
| **Filter approach** | Function | Conditional assignment | Conditional assignment |

---

## Confirmed spec issues

### 1. `toggle` vs `checkbox` label confusion (3/3 models)

All three models wrote `toggle bind: x, label: "text"`. The spec defines `label:` as a property on `checkbox`, not `toggle`. The primitives table in v0.6.2 shows:

- `toggle` → `toggle bind: dark_mode`
- `checkbox` → `checkbox bind: agreed, label: "I agree"`

**Action:** Either add `label:` to `toggle` (it's a reasonable property) or add a callout distinguishing the two primitives. Since 3/3 models made this mistake, the spec is the problem, not the models.

### 2. Conditional assignment at screen body level (2/3 models)

Gemini and ChatGPT both used the spec's canonical conditional assignment pattern at the screen body level:

```igni
display = shared.contacts
if show_favourites:
  display = filter(display, c => c.favourite)
```

This is valid v0.6.2 but the transpiler's parser only supports `if` blocks containing UI nodes at the screen body level — not variable reassignments. Claude avoided this by putting the logic in a function, but the other two models wrote what the spec teaches.

**Action:** Support `if` with variable assignments at the screen body level in the parser. This is the highest-priority transpiler gap from this test round.

---

## Confirmed transpiler gaps

| Gap | Surfaced by | Priority |
|---|---|---|
| `if` with assignments at screen body level | Gemini, ChatGPT | **High** — 2/3 models used it |
| Optional type hints (`name: Type = val`) | Claude | Low — no model needed it |

---

## Codegen bugs found and fixed during testing

| Bug | Fix |
|---|---|
| `TextStyle?` null safety — `.copyWith()` on nullable type | Added `!` to STYLE_MAP entries |
| `widget.param` in field initializers | Added `late` when initializer refs screen params |
| `filter` lambda returns `dynamic` not `bool` | Added `== true` coercion in filter codegen |
| Column overflow — no scrolling | Wrapped Scaffold body in `SingleChildScrollView` |
| `contains` case-sensitive | Made codegen use `.toLowerCase()` on both sides |

---

## Model-specific observations

**Claude Opus 4.6** — Strongest output. Used `shared:` correctly, `replace` for mutations, wrapped filter/sort in a `visible()` function (avoiding the transpiler gap by coincidence). The only model to use `find` with a predicate lambda for looking up the current contact. Functions-as-expressions (`visible()` called inline in `if` and `each`) was a clean pattern.

**Gemini 3.1 Pro** — Correct on fundamentals (`shared:`, `replace`). Used the conditional assignment pattern from the spec, which is arguably more idiomatic but hit a transpiler gap. Cleanest `toggle_fav()` implementation: `replace` + local variable update in two lines.

**ChatGPT** — Missed two fundamental constraints: no `shared:` block (contacts local to one screen) and in-place field mutation (`contact.favourite = not contact.favourite`). Both are prominently documented in the spec. Also used `color: green` instead of a design token. Not worth fixing to transpile — the errors are architectural.

---

## Recommendations

1. **Spec patch (v0.6.3):** Add `label:` to `toggle` primitive, or add a callout distinguishing toggle from checkbox. 3/3 models is a definitive signal.
2. **Transpiler priority:** Implement `if` with assignments at screen body level. 2/3 models used it.
3. **Next test:** Run a harder prompt — multi-screen e-commerce or a chat app — to stress-test `fetch`, mutations, and more complex shared state patterns.
4. **Dissertation data point:** The two-stage validation (spec grade + transpiler) caught different things. Spec grading caught ChatGPT's architectural errors. Transpiler validation caught 5 codegen bugs that spec-only testing would never surface. Both stages are necessary.
